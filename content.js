(() => {
  const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'];
  const SHORT = MONTHS.map(m => m.slice(0, 3));
  const DAY = '(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)';
  const DATE = `${DAY}, ([A-Za-z]+) (\\d{1,2}), (\\d{4})`;
  const RANGE_RE = new RegExp(`${DATE}(?:\\s*-\\s*${DATE})?`);

  const DEFAULTS = { dailyTarget: '8:30', endOfDay: '18:30', startOfDay: '', workDays: [1, 2, 3, 4, 5], dayTargets: {}, holidays: [], halfDays: [], compactLayout: true };
  // Weekly early-leave reserve; month surplus beyond it becomes late-arrival allowance
  const EARLY_LEAVE_WEEKLY_MIN = 90;

  let targetMin = 8 * 60 + 30;
  let endOfDayMin = 18 * 60 + 30;
  let startOfDayMin = null;
  let workDays = DEFAULTS.workDays;
  // Per-weekday target overrides in minutes, keyed by Date#getDay()
  let dayTargetMin = {};
  let customHolidays = [];
  let customHalfDays = [];
  // Last allowance computed on month view: { day, min, surplus, at }
  let lateSnapshot = null;

  function applySettings(data) {
    if ('dailyTarget' in data) targetMin = parseTarget(data.dailyTarget);
    if ('endOfDay' in data) endOfDayMin = parseTarget(data.endOfDay);
    if ('startOfDay' in data) startOfDayMin = data.startOfDay ? parseTarget(data.startOfDay) : null;
    if ('workDays' in data) workDays = data.workDays || DEFAULTS.workDays;
    if ('dayTargets' in data) {
      dayTargetMin = {};
      for (const [day, value] of Object.entries(data.dayTargets || {})) dayTargetMin[day] = parseTarget(value);
    }
    if ('holidays' in data) customHolidays = data.holidays || [];
    if ('halfDays' in data) customHalfDays = data.halfDays || [];
    if ('compactLayout' in data) setCompact(data.compactLayout !== false);
  }

  // Layout rules hang off html.dtr-compact; charts sized for the old layout need a resize to redraw
  function setCompact(on) {
    const root = document.documentElement;
    if (root.classList.contains('dtr-compact') === on) return;
    root.classList.toggle('dtr-compact', on);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  }
  // dark.js sets dtr-compact at document_start from its cache (layout rules live there too), so the first paint is right

  chrome.storage.sync.get(DEFAULTS, (data) => {
    applySettings(data);
    update();
  });
  chrome.storage.local.get({ lateSnapshot: null }, (data) => {
    lateSnapshot = data.lateSnapshot;
    update();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.lateSnapshot) {
        lateSnapshot = changes.lateSnapshot.newValue ?? null;
        update();
      }
      return;
    }
    const data = {};
    for (const key of Object.keys(DEFAULTS)) if (changes[key]) data[key] = changes[key].newValue ?? DEFAULTS[key];
    if (Object.keys(data).length) {
      applySettings(data);
      update();
    }
  });

  function toKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function fmtDays(n) {
    return `${n} day${n === 1 ? '' : 's'}`;
  }

  function parseTarget(s) {
    const [h, m] = String(s).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  function fmt(min) {
    min = Math.max(0, Math.round(min));
    const h = Math.floor(min / 60);
    return h ? `${h}h ${min % 60}m` : `${min}m`;
  }

  function fmtClock(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function parseDuration(text) {
    const t = text.replace(/\s+/g, '');
    const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?$/);
    if (!m || (!m[1] && !m[2])) return null;
    return (+m[1] || 0) * 60 + (+m[2] || 0);
  }

  function makeDate(monthName, day, year) {
    return new Date(+year, MONTHS.indexOf(monthName.toLowerCase()), +day);
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // Parent element of first text node matching test. Walks text nodes only, so
  // cost is linear in page size (element.textContent per element is quadratic).
  function findTextParent(test) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (test(n.textContent) && n.parentElement !== document.body) return n.parentElement;
    }
    return null;
  }

  // Element whose own text (ignoring child elements like icons) equals the title; cached while attached
  const titleCache = new Map();
  function findTitle(title) {
    const cached = titleCache.get(title);
    if (cached?.isConnected) return cached;
    const el = findTextParent(t => t.trim() === title);
    if (el) titleCache.set(title, el);
    return el;
  }

  // Walk up from title element until ancestor holds a value matching test
  function findCard(titleEl, test) {
    let el = titleEl;
    for (let i = 0; i < 6 && el; i++) {
      el = el.parentElement;
      if (el && test(el)) return el;
    }
    return null;
  }

  // Main duration value of a DeskTime card, e.g. 'Productive time' or 'Time at work'
  function readCardMinutes(cardTitle) {
    for (const card of document.querySelectorAll('.dt-card')) {
      const title = card.querySelector('.dt-typography-h6');
      if (!title || title.textContent.trim() !== cardTitle) continue;
      const body = card.querySelector('.card-body');
      const valueEl = body?.querySelector('h1, h2, h3') || body;
      const m = valueEl?.textContent.replace(/\s+/g, '').match(/(?:(\d+)h)?(\d+)m|(\d+)h/);
      if (m) return m[3] ? +m[3] * 60 : (+m[1] || 0) * 60 + +m[2];
    }
    return readCardMinutesFallback(cardTitle);
  }

  function readCardMinutesFallback(cardTitle) {
    const titleEl = findTitle(cardTitle);
    if (!titleEl) return null;
    const card = findCard(titleEl, el => /\d+\s*[hm]/.test(el.textContent.replace(cardTitle, '')));
    if (!card) return null;
    // First element whose whole text is a duration; main value precedes "Average"
    for (const el of card.querySelectorAll('*')) {
      const min = parseDuration(el.textContent.trim());
      if (min !== null) return min;
    }
    return null;
  }

  // URL forms: /app/my (today), /app/my/YYYY-MM-DD, /app/my/YYYY-MM-DD/week|month
  function readRangeFromUrl() {
    const m = location.pathname.match(/\/app\/my(?:\/(\d{4})-(\d{2})-(\d{2}))?(?:\/(day|week|month))?\/?$/);
    if (!m) return null;
    const date = m[1] ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(new Date().setHours(0, 0, 0, 0));
    const view = m[4] || 'day';
    if (view === 'month') {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return { start, end, isRange: true };
    }
    if (view === 'week') {
      const start = new Date(date);
      start.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // Monday
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end, isRange: true };
    }
    return { start: date, end: date, isRange: false };
  }

  function readRange() {
    const fromUrl = readRangeFromUrl();
    if (fromUrl) return fromUrl;
    const m = document.body.innerText.match(RANGE_RE);
    if (!m) return null;
    const start = makeDate(m[1], m[2], m[3]);
    const end = m[4] ? makeDate(m[4], m[5], m[6]) : start;
    return { start, end, isRange: !!m[4] };
  }

  let holidayBanner = null;
  function readHolidays(start, end) {
    const result = [];
    // User-specified holidays from popup (YYYY-MM-DD)
    for (const s of customHolidays) {
      const [y, mo, d] = s.split('-').map(Number);
      const date = new Date(y, mo - 1, d);
      if (date >= start && date <= end) result.push(date);
    }
    if (!holidayBanner?.isConnected) holidayBanner = findTextParent(t => /Public Holiday/i.test(t));
    const banner = holidayBanner;
    if (!banner) return result;
    const container = banner.parentElement || banner;
    const re = /(\d{1,2})\.([A-Za-z]{3})/g;
    let m;
    while ((m = re.exec(container.textContent))) {
      const mi = SHORT.indexOf(m[2].toLowerCase());
      if (mi < 0) continue;
      // Range may span year boundary (week view); pick year that falls in range
      for (const y of new Set([start.getFullYear(), end.getFullYear()])) {
        const d = new Date(y, mi, +m[1]);
        if (d >= start && d <= end) result.push(d);
      }
    }
    return result;
  }

  // Date from calendar cell: <td onclick="...app/my/YYYY-MM-DD'">
  function cellDate(td) {
    const m = (td.getAttribute('onclick') || '').match(/\/app\/my\/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  }

  // Non-working weekday/holiday = 0, half day = 0.5, otherwise 1
  function dayWeight(d, holidays) {
    if (!workDays.includes(d.getDay()) || holidays.some(h => sameDay(h, d))) return 0;
    return customHalfDays.includes(toKey(d)) ? 0.5 : 1;
  }

  function targetFor(d) {
    return dayTargetMin[d.getDay()] ?? targetMin;
  }

  // Working-day count and target minutes between two dates, inclusive
  function span(from, to, holidays) {
    let days = 0;
    let min = 0;
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    while (d <= to) {
      const weight = dayWeight(d, holidays);
      days += weight;
      min += weight * targetFor(d);
      d.setDate(d.getDate() + 1);
    }
    return { days, min };
  }

  function pct(value, total) {
    return `${total ? Math.round((value / total) * 100) : 100}%`;
  }

  // Label/value stat line; note is muted detail after the value, tone colors the value ('pos' | 'neg')
  function row(label, value, note = '', tone = '') {
    return ['row', label, value, note, tone];
  }

  // Time at work that wasn't productive (breaks, neutral/unproductive apps)
  function pushNonProductive(lines, productive, atWork) {
    if (atWork !== null && atWork > productive) {
      lines.push(row('Non-productive', fmt(atWork - productive), `${pct(productive, atWork)} productive`));
    }
  }

  function isFullMonth(range) {
    const lastDay = new Date(range.start.getFullYear(), range.start.getMonth() + 1, 0);
    return range.start.getDate() === 1 && sameDay(range.end, lastDay);
  }

  function lateRow({ min, surplus }, suffix = '') {
    const notes = [];
    if (min <= 0) {
      notes.push(surplus >= 0 ? `${fmt(surplus)} ahead` : `${fmt(-surplus)} behind`, `need over ${fmt(EARLY_LEAVE_WEEKLY_MIN)}`);
    } else if (startOfDayMin !== null) {
      const arrive = new Date();
      arrive.setHours(0, startOfDayMin + min, 0, 0);
      notes.push(`arrive by ${fmtClock(arrive)}`);
    }
    if (suffix) notes.push(suffix);
    return row('Late arrival', min > 0 ? fmt(min) : 'None', notes.join(', '), min > 0 ? 'pos' : '');
  }

  function saveLateSnapshot(surplus) {
    const day = toKey(new Date());
    if (lateSnapshot?.day === day && lateSnapshot.surplus === surplus) return;
    lateSnapshot = { day, min: Math.max(0, surplus - EARLY_LEAVE_WEEKLY_MIN), surplus, at: Date.now() };
    chrome.storage.local.set({ lateSnapshot });
  }

  // Day/week views lack month totals, so show allowance last computed on month view today
  function pushLateSnapshot(lines) {
    if (lateSnapshot?.day === toKey(new Date())) {
      lines.push(lateRow(lateSnapshot, `as of ${fmtClock(new Date(lateSnapshot.at))}`));
    } else {
      lines.push(row('Late arrival', '', 'open month view to refresh'));
    }
  }

  function buildDay(productive, atWork, date) {
    const half = customHalfDays.includes(toKey(date));
    const dayTarget = half ? targetFor(date) / 2 : targetFor(date);
    const remaining = dayTarget - productive;
    const lines = [];
    if (remaining > 0) {
      lines.push(['big', fmt(remaining)]);
    } else {
      lines.push(['big', `+${fmt(-remaining)}`]);
      lines.push(['small', 'Overtime']);
    }
    lines.push(['progress', dayTarget ? productive / dayTarget : 1]);
    lines.push(row('Done', fmt(productive), `${pct(productive, dayTarget)} of target`));
    if (remaining > 0 && sameDay(date, new Date())) {
      lines.push(row('Finish at', fmtClock(new Date(Date.now() + remaining * 60000))));
    }
    lines.push(row('Target', fmt(dayTarget), half ? 'half day' : ''));
    if (sameDay(date, new Date())) pushLateSnapshot(lines);
    pushNonProductive(lines, productive, atWork);
    return { title: 'Left today', lines };
  }

  function buildPeriod(productive, range) {
    const holidays = readHolidays(range.start, range.end);
    const total = span(range.start, range.end, holidays);
    const totalDays = total.days;
    const target = total.min;
    const remaining = target - productive;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inRange = today >= range.start && today <= range.end;
    const from = today > range.start ? today : range.start;
    const left = from > range.end ? { days: 0, min: 0 } : span(from, range.end, holidays);
    const daysLeft = left.days;
    const todayWeight = inRange ? dayWeight(today, holidays) : 0;

    const lines = [];
    if (remaining > 0) {
      lines.push(['big', fmt(remaining)]);
    } else {
      lines.push(['big', `+${fmt(-remaining)}`]);
      lines.push(['small', 'Overtime']);
    }
    // Working days and target minutes elapsed so far, today included
    const elapsed = totalDays - daysLeft + todayWeight;
    const required = target - left.min + todayWeight * targetFor(today);

    // Pace marker: share of the target due by end of today
    const pace = inRange && target ? { at: required / target, title: `Pace: ${fmt(required)} due by end of today` } : null;
    lines.push(['progress', target ? productive / target : 1, pace]);
    // Per-day overrides make the "days × target" breakdown wrong, so drop it then
    const uniform = target === totalDays * targetMin;
    lines.push(row('Target', fmt(target), `${fmtDays(totalDays)}${uniform ? ` × ${fmt(targetMin)}` : ''}`));

    // Projection: assume continuous productive work from now until END_OF_DAY today
    const now = new Date();
    const eod = new Date(now);
    eod.setHours(Math.floor(endOfDayMin / 60), endOfDayMin % 60, 0, 0);

    // Required vs completed through today, with +/- balance (and its projection at END_OF_DAY)
    if (inRange) {
      const diff = productive - required;
      const notes = [diff >= 0 ? 'ahead' : 'behind'];
      if (todayWeight > 0 && now < eod) {
        const projDiff = Math.round(diff + (eod - now) / 60000);
        notes.push(`${projDiff >= 0 ? '+' : '-'}${fmt(Math.abs(projDiff))} ${projDiff >= 0 ? 'ahead' : 'behind'} at ${fmtClock(eod)}`);
      }
      lines.push(row('To date', fmt(productive), `of ${fmt(required)}, ${fmtDays(elapsed)}`));
      lines.push(row('Balance', `${diff >= 0 ? '+' : '-'}${fmt(Math.abs(diff))}`, notes.join(', '), diff >= 0 ? 'pos' : 'neg'));
    }

    if (todayWeight > 0 && now < eod) {
      const projRemaining = remaining - (eod - now) / 60000;
      const projDays = daysLeft - todayWeight;
      const label = `At ${fmtClock(eod)}`;
      if (projRemaining <= 0) lines.push(row(label, `+${fmt(-projRemaining)}`, 'overtime', 'pos'));
      else if (projDays > 0) lines.push(row(label, `${fmt(projRemaining)} left`, `${fmt(projRemaining / projDays)}/day for ${fmtDays(projDays)}`));
      else lines.push(row(label, `${fmt(projRemaining)} left`, 'no working days left', 'neg'));
    }

    // Late arrival: month surplus projected to end of today, minus weekly early-leave reserve
    if (inRange) {
      if (isFullMonth(range)) {
        const projected = productive + (todayWeight > 0 && now < eod ? (eod - now) / 60000 : 0);
        saveLateSnapshot(Math.round(projected - required));
        lines.push(lateRow(lateSnapshot));
      } else {
        pushLateSnapshot(lines);
      }
    }
    return { title: 'Remaining', lines };
  }

  function findEffectivenessCard() {
    const marked = document.querySelector('[data-dtr-card]');
    if (marked && marked.isConnected) return marked;
    const titleEl = findTitle('Effectiveness');
    if (!titleEl) return null;
    const card = findCard(titleEl, el => /[\d.]+\s*%/.test(el.textContent));
    if (!card) return null;
    card.setAttribute('data-dtr-card', '');
    titleEl.setAttribute('data-dtr-title', '');
    return card;
  }

  // Palette and faces live in the two token blocks (.dtr, .dtr-menu) and their dark twins; rules below use only var().
  // Values are it_admin's Cobalt tokens (it_admin/assets/it_admin.css); the page keeps its own body face
  const STYLES = `
    .dtr { --dtr-font-display:"Familjen Grotesk",system-ui,sans-serif;
      --dtr-primary:oklch(52% 0.19 258); --dtr-ok:oklch(55% 0.12 165); --dtr-ok-text:oklch(45% 0.1 165);
      --dtr-muted:oklch(50% 0.018 258); --dtr-track:oklch(93.6% 0.011 252); --dtr-line:oklch(94% 0.008 252);
      --dtr-ink:oklch(21% 0.028 262); --dtr-neg:oklch(53% 0.19 25);
      position:relative; z-index:1; padding:4px 24px 8px; font-family:inherit; }
    .dtr-big { font-family:var(--dtr-font-display); font-size:32px; font-weight:600; line-height:1.1; letter-spacing:-.03em;
      color:var(--dtr-ink); font-variant-numeric:tabular-nums; }
    .dtr-big.over { color:var(--dtr-ok-text); }
    .dtr-small { font-size:13px; color:var(--dtr-muted); line-height:1.5; }
    .dtr-bar { position:relative; height:6px; border-radius:999px; background:var(--dtr-track); margin:12px 0; }
    .dtr-bar > div { height:100%; border-radius:inherit; background:var(--dtr-primary); transform-origin:left center; }
    .dtr-bar.over > div { background:var(--dtr-ok); }
    .dtr-pace { position:absolute; top:-4px; bottom:-4px; width:2px; margin-left:-1px; border-radius:1px;
      background:var(--dtr-ink); }
    .dtr-row { display:flex; justify-content:space-between; align-items:baseline; gap:12px; padding:4px 0;
      font-size:13px; line-height:1.4; border-top:1px solid var(--dtr-line); }
    .dtr-bar + .dtr-row { border-top:0; }
    .dtr-label { flex:none; color:var(--dtr-muted); }
    .dtr-value { text-align:right; font-weight:600; color:var(--dtr-ink); font-variant-numeric:tabular-nums; }
    .dtr-value.pos { color:var(--dtr-ok-text); }
    .dtr-value.neg { color:var(--dtr-neg); }
    .dtr-note { font-weight:400; color:var(--dtr-muted); }
    .dtr-menu { --m-bg:oklch(99.4% 0.003 250); --m-border:oklch(90% 0.009 252); --m-text:oklch(21% 0.028 262);
      --m-muted:oklch(50% 0.018 258); --m-hover:oklch(97.2% 0.01 254); --m-accent:oklch(52% 0.19 258);
      --m-focus:oklch(52% 0.19 258); --m-shadow:0 8px 24px oklch(21% 0.028 262 / .16);
      --m-font:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
      position:fixed; z-index:99999; min-width:176px; padding:4px; background:var(--m-bg); color:var(--m-text);
      border:1px solid var(--m-border); border-radius:8px; box-shadow:var(--m-shadow);
      font:13px/1.4 var(--m-font); animation:dtr-pop .12s ease-out; }
    .dtr-menu-head { padding:4px 12px 8px; font-size:12px; color:var(--m-muted); }
    .dtr-menu-item { display:flex; justify-content:space-between; width:100%; gap:12px; padding:8px 12px; font:inherit;
      color:inherit; text-align:left; background:none; border:0; border-radius:6px; cursor:pointer; }
    .dtr-menu-item:hover, .dtr-menu-item:active { background:var(--m-hover); }
    .dtr-menu-item:focus-visible { outline:2px solid var(--m-focus); outline-offset:-2px; }
    .dtr-menu-item .check { color:var(--m-accent); font-weight:700; }
    @keyframes dtr-pop { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:none; } }
    @media (prefers-reduced-motion:reduce) { .dtr-menu { animation:none; } }
    html.dtr-dark .dtr { --dtr-primary:oklch(70% 0.14 255); --dtr-ok:oklch(72% 0.12 165); --dtr-ok-text:oklch(80% 0.11 165);
      --dtr-muted:oklch(69% 0.022 256); --dtr-track:oklch(26.5% 0.026 262); --dtr-line:oklch(25.5% 0.024 262);
      --dtr-ink:oklch(93% 0.01 250); --dtr-neg:oklch(70% 0.16 25); }
    html.dtr-dark .dtr-menu { --m-bg:oklch(26.5% 0.026 262); --m-border:oklch(35% 0.026 262); --m-text:oklch(93% 0.01 250);
      --m-muted:oklch(69% 0.022 256); --m-hover:oklch(31% 0.028 262); --m-accent:oklch(70% 0.14 255);
      --m-focus:oklch(70% 0.14 255); --m-shadow:0 8px 24px oklch(0% 0 0 / .5); }`;

  function injectStyles() {
    if (document.getElementById('dtr-styles')) return;
    const style = document.createElement('style');
    style.id = 'dtr-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function render(card, { title, lines }) {
    injectStyles();
    const titleEl = card.querySelector('[data-dtr-title]');
    if (titleEl && titleEl.textContent !== title) titleEl.textContent = title;

    // Hide original percentage value
    for (const el of card.querySelectorAll('*')) {
      if (el.children.length === 0 && /^[\d.]+\s*%$/.test(el.textContent.trim())) {
        el.style.display = 'none';
      }
    }

    let box = card.querySelector('[data-dtr]');
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-dtr', '');
      box.className = 'dtr';
      const anchor = titleEl?.parentElement;
      if (anchor && anchor.parentElement === card) anchor.after(box);
      else card.appendChild(box);
    }
    const share = v => Math.round(Math.min(1, Math.max(0, v)) * 100);
    const html = lines.map(([kind, value, ...rest]) => {
      if (kind === 'progress') {
        const [pace] = rest;
        const tick = pace ? `<i class="dtr-pace" style="left:${share(pace.at)}%" title="${pace.title}"></i>` : '';
        return `<div class="dtr-bar${value >= 1 ? ' over' : ''}"><div style="transform:scaleX(${share(value) / 100})"></div>${tick}</div>`;
      }
      if (kind === 'row') {
        const [text, note, tone] = rest;
        const parts = [text, note && `<span class="dtr-note">${note}</span>`].filter(Boolean).join(' ');
        return `<div class="dtr-row"><span class="dtr-label">${value}</span><span class="dtr-value${tone ? ` ${tone}` : ''}">${parts}</span></div>`;
      }
      if (kind === 'big') return `<div class="dtr-big${value.startsWith('+') ? ' over' : ''}">${value}</div>`;
      return `<div class="dtr-small">${value}</div>`;
    }).join('');
    if (box.innerHTML !== html) box.innerHTML = html;
  }

  // Summary cards dropped: the hero card already carries what matters (they stay in the DOM, readCardMinutes needs them)
  const HIDDEN_CARDS = new Set(['Arrival time', 'Left time', 'Productive time', 'Desktime time', 'Time at work', 'Projects time', 'Productivity']);

  // Tag the card grid so CSS can lay it out: hero card beside the productivity bar, other summary cards hidden
  // dark.js hides the cards (dtr-ready missing) until the layout is final: charts get one resize, then show
  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      setTimeout(() => document.documentElement.classList.add('dtr-ready'), 150);
    }, 100);
  }

  function arrangeCards() {
    let grid = null;
    let hasHero = false;
    for (const card of document.querySelectorAll('.dt-card--chart')) {
      const col = card.parentElement;
      if (!col?.classList.contains('col')) continue;
      const title = card.querySelector('.dt-typography-h6')?.textContent.trim();
      const role = card.hasAttribute('data-dtr-card') ? 'hero' : HIDDEN_CARDS.has(title) ? 'hide' : null;
      if (!role) continue;
      grid = col.parentElement;
      if (role === 'hero') hasHero = true;
      if (col.getAttribute('data-dtr-col') !== role) col.setAttribute('data-dtr-col', role);
    }
    if (!grid) return;
    grid.setAttribute('data-dtr-grid', '');
    // Chart card is a sibling of the grid; narrower now, so charts need a resize to redraw
    const page = grid.parentElement;
    if (page.querySelector(':scope > .dt-card--productivity-chart') && !page.hasAttribute('data-dtr-page')) {
      page.setAttribute('data-dtr-page', '');
    }
    if (hasHero) reveal();
  }

  // Neon productivity bar: CSS in dark.js restyles bars tagged .dtr-nb; nvd3 redraws replace the rects, so tag on every pass.
  // The intro animation plays once per card, and only after the layout is revealed (the card is hidden until then)
  const NEON_STEP_MS = 22;
  const NEON_DEFS = '<svg id="dtr-neon-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<linearGradient id="dtr-neon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00ffa3"/>'
    + '<stop offset="1" stop-color="#00b7ff"/></linearGradient></defs></svg>';

  function isGreen(el) {
    const m = /^rgb\((\d+), (\d+), (\d+)/.exec(getComputedStyle(el).fill);
    return !!m && +m[2] > +m[1] + 40 && +m[2] > +m[3] + 40;
  }

  function neonChart() {
    const card = document.querySelector('.dt-card--productivity-chart');
    if (!card) return;
    if (!document.getElementById('dtr-neon-defs')) document.body.insertAdjacentHTML('beforeend', NEON_DEFS);
    for (const bar of card.querySelectorAll('.nv-bar:not(.dtr-nb)')) if (isGreen(bar)) bar.classList.add('dtr-nb');
    if (card.hasAttribute('data-dtr-neon')) return;
    if (!document.documentElement.classList.contains('dtr-ready')) {
      setTimeout(neonChart, 250);
      return;
    }
    const bars = [...card.querySelectorAll('.dtr-nb')].filter(b => parseFloat(b.getAttribute('height')) > 0);
    if (!bars.length) return;
    card.setAttribute('data-dtr-neon', '');
    bars.forEach((b, i) => b.style.setProperty('--dtr-i', i));
    const total = bars.length * NEON_STEP_MS + 550;
    const start = card.querySelector('.interval.online');
    const now = card.querySelector('.interval.now');
    if (start && now) now.style.setProperty('--dtr-now-from', `${start.getBoundingClientRect().left - now.getBoundingClientRect().left}px`);
    card.style.setProperty('--dtr-play', `${total}ms`);
    card.classList.add('dtr-neon-play');
    setTimeout(() => card.classList.remove('dtr-neon-play'), total + 300);
  }

  function update() {
    neonChart();
    // Effectiveness card first: arrangeCards needs it marked to place the hero column in the same pass
    const card = findEffectivenessCard();
    arrangeCards();
    const productive = readCardMinutes('Productive time');
    const range = readRange();
    if (productive === null || !range || !card) {
      console.debug('[DeskTime Remaining]', { productive, range, card: !!card });
      return;
    }
    const atWork = readCardMinutes('Time at work');
    render(card, range.isRange ? buildPeriod(productive, range) : buildDay(productive, atWork, range.start));
  }

  // Right-click a calendar day: mark as holiday / half day / clear
  let menu = null;
  function closeMenu() {
    menu?.remove();
    menu = null;
  }

  function setDayKind(key, kind) {
    const holidays = customHolidays.filter(d => d !== key);
    const halfDays = customHalfDays.filter(d => d !== key);
    if (kind === 'holidays') holidays.push(key);
    if (kind === 'halfDays') halfDays.push(key);
    chrome.storage.sync.set({ holidays: holidays.sort(), halfDays: halfDays.sort() });
  }

  document.addEventListener('contextmenu', e => {
    const td = e.target.closest?.('td[onclick]');
    const key = td && cellDate(td);
    if (!key) return;
    e.preventDefault();
    closeMenu();
    const current = customHolidays.includes(key) ? 'holidays' : customHalfDays.includes(key) ? 'halfDays' : null;
    injectStyles();
    menu = document.createElement('div');
    menu.className = 'dtr-menu';
    menu.setAttribute('role', 'menu');
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    const header = document.createElement('div');
    header.className = 'dtr-menu-head';
    const [y, mo, d] = key.split('-').map(Number);
    header.textContent = new Date(y, mo - 1, d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
    menu.appendChild(header);
    for (const [kind, label] of [['holidays', 'Holiday'], ['halfDays', 'Half day'], [null, 'Clear']]) {
      const item = document.createElement('button');
      item.type = 'button';
      item.setAttribute('role', 'menuitem');
      item.className = 'dtr-menu-item';
      item.textContent = label;
      if (current === kind) {
        const check = document.createElement('span');
        check.className = 'check';
        check.textContent = '✓';
        item.appendChild(check);
      }
      item.addEventListener('click', () => {
        setDayKind(key, kind);
        closeMenu();
      });
      menu.appendChild(item);
    }
    document.body.appendChild(menu);
    menu.querySelector('.dtr-menu-item').focus();
  });
  document.addEventListener('click', e => { if (menu && !menu.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('scroll', closeMenu, true);

  let timer = null;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(update, 300);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(update, 30000);
  update();
})();
