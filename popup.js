const input = document.getElementById('target');
const status = document.getElementById('status');

const holidayInput = document.getElementById('holiday');
const list = document.getElementById('list');
const kindSelect = document.getElementById('kind');
const pruneBtn = document.getElementById('prune');
const LABELS = { holidays: 'Holiday', halfDays: 'Half day' };
const days = { holidays: [], halfDays: [] };

const eodInput = document.getElementById('eod');
const sodInput = document.getElementById('sod');
const workdaysBox = document.getElementById('workdays');
const overridesBox = document.getElementById('overrides');
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Every synced setting with its default; also the set of keys covered by export/import
const SETTINGS = { dailyTarget: '8:30', endOfDay: '18:30', startOfDay: '', workDays: [1, 2, 3, 4, 5], dayTargets: {}, holidays: [], halfDays: [], darkMode: false };

// Days off older than this (YYYY-MM-DD, one year back) are offered for removal
const PRUNE_BEFORE = (() => {
  const d = new Date();
  return `${d.getFullYear() - 1}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

chrome.storage.sync.get(SETTINGS, (data) => {
  input.value = data.dailyTarget;
  eodInput.value = data.endOfDay;
  sodInput.value = data.startOfDay;
  for (const d of DAY_ORDER) {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = d;
    box.checked = data.workDays.includes(d);
    label.append(box, DAY_NAMES[d]);
    workdaysBox.appendChild(label);

    const override = document.createElement('input');
    override.dataset.day = d;
    override.placeholder = '–';
    override.value = data.dayTargets[d] || '';
    override.title = `${DAY_NAMES[d]} target`;
    override.setAttribute('aria-label', `${DAY_NAMES[d]} target`);
    overridesBox.appendChild(override);
  }
  days.holidays = data.holidays;
  days.halfDays = data.halfDays;
  renderList();
});

const darkBox = document.getElementById('dark');
chrome.storage.sync.get({ darkMode: false }, (data) => { darkBox.checked = data.darkMode; });
darkBox.addEventListener('change', () => chrome.storage.sync.set({ darkMode: darkBox.checked }));

function renderList() {
  list.innerHTML = '';
  const entries = Object.keys(days).flatMap(kind => days[kind].map(date => ({ kind, date })));
  entries.sort((a, b) => a.date.localeCompare(b.date));
  const old = entries.filter(e => e.date < PRUNE_BEFORE).length;
  pruneBtn.hidden = !old;
  pruneBtn.textContent = `Remove ${old} older than a year`;
  if (!entries.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No days off added';
    list.appendChild(li);
  }
  for (const { kind, date } of entries) {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'date';
    const [y, mo, d] = date.split('-').map(Number);
    label.textContent = new Date(y, mo - 1, d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const tag = document.createElement('span');
    tag.className = `tag ${kind}`;
    tag.textContent = LABELS[kind];
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.title = 'Remove';
    btn.addEventListener('click', () => saveDays(kind, days[kind].filter(d => d !== date)));
    li.append(label, tag, btn);
    list.appendChild(li);
  }
}

function saveDays(kind, next) {
  days[kind] = next;
  chrome.storage.sync.set({ [kind]: next }, renderList);
}

pruneBtn.addEventListener('click', () => {
  for (const kind of Object.keys(days)) saveDays(kind, days[kind].filter(d => d >= PRUNE_BEFORE));
});

document.getElementById('add').addEventListener('click', () => {
  const date = holidayInput.value;
  const kind = kindSelect.value;
  if (!date) return;
  // A date can be either holiday or half day, not both
  const other = kind === 'holidays' ? 'halfDays' : 'holidays';
  if (days[other].includes(date)) saveDays(other, days[other].filter(d => d !== date));
  if (!days[kind].includes(date)) saveDays(kind, [...days[kind], date].sort());
  holidayInput.value = '';
});

document.getElementById('save').addEventListener('click', () => {
  const fail = (msg) => {
    status.className = 'err';
    status.textContent = msg;
  };
  const m = input.value.trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!m) return fail('Target: use format H:MM, e.g. 8:30');
  const e = eodInput.value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!e) return fail('End of day: use 24h HH:MM, e.g. 18:30');
  // Start of day is optional; empty hides the "arrive by" clock time
  const sod = sodInput.value.trim();
  const s = sod.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (sod && !s) return fail('Start of day: use 24h HH:MM, e.g. 9:30');
  const workDays = [...workdaysBox.querySelectorAll('input:checked')].map(b => +b.value).sort();
  if (!workDays.length) return fail('Select at least one working day');
  // Per-day targets are optional; blank falls back to the daily target
  const dayTargets = {};
  for (const override of overridesBox.querySelectorAll('input')) {
    const v = override.value.trim();
    if (!v) continue;
    const t = v.match(/^(\d{1,2}):([0-5]\d)$/);
    if (!t) return fail(`${DAY_NAMES[override.dataset.day]} target: use H:MM, e.g. 6:00`);
    dayTargets[override.dataset.day] = `${+t[1]}:${t[2]}`;
  }
  const startOfDay = s ? `${+s[1]}:${s[2]}` : '';
  chrome.storage.sync.set({ dailyTarget: `${+m[1]}:${m[2]}`, endOfDay: `${+e[1]}:${e[2]}`, startOfDay, workDays, dayTargets }, () => {
    status.className = 'ok';
    status.textContent = 'Saved ✓';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});

// Keep only known keys with valid values, so a bad file cannot break the content script
function sanitize(raw) {
  const time = v => typeof v === 'string' && /^\d{1,2}:[0-5]\d$/.test(v);
  const dates = v => Array.isArray(v) && v.every(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d));
  const checks = {
    dailyTarget: time,
    endOfDay: time,
    startOfDay: v => v === '' || time(v),
    workDays: v => Array.isArray(v) && v.length > 0 && v.every(d => Number.isInteger(d) && d >= 0 && d <= 6),
    dayTargets: v => !!v && typeof v === 'object' && !Array.isArray(v)
      && Object.entries(v).every(([d, t]) => /^[0-6]$/.test(d) && time(t)),
    holidays: dates,
    halfDays: dates,
    darkMode: v => typeof v === 'boolean',
  };
  const out = {};
  for (const [key, ok] of Object.entries(checks)) if (key in raw && ok(raw[key])) out[key] = raw[key];
  return out;
}

document.getElementById('export').addEventListener('click', () => {
  chrome.storage.sync.get(SETTINGS, (data) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'desktime-remaining-settings.json';
    a.click();
  });
});

const importFile = document.getElementById('importFile');
const backupStatus = document.getElementById('backupStatus');
document.getElementById('import').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', async () => {
  const file = importFile.files[0];
  if (!file) return;
  try {
    const raw = JSON.parse(await file.text());
    const clean = raw && typeof raw === 'object' ? sanitize(raw) : {};
    if (!Object.keys(clean).length) throw new Error('No valid settings in file');
    chrome.storage.sync.set(clean, () => location.reload());
  } catch (err) {
    backupStatus.className = 'hint err';
    backupStatus.textContent = 'Import failed: not a valid settings file';
  }
  importFile.value = '';
});
