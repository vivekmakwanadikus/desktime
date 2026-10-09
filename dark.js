(() => {
  const BG = '#0d1114';
  const SURFACE = '#141a1e';
  const RAISED = '#1b2228';
  const BORDER = '#242d33';
  const TEXT = '#e8ecee';
  const MUTED = '#93a0a8';
  const ACCENT = '#6ee787';
  const FONT = '"Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,sans-serif';

  // DeskTime themes through --dt-* palette variables; inverting the gray scale recolors most of the app
  const BASE = `
    html.dtr-dark { color-scheme:dark;
      --dt-gray50:${BG}; --dt-gray100:${RAISED}; --dt-gray150:${BORDER}; --dt-gray200:#303a41; --dt-gray250:#5b6370;
      --dt-gray300:#6f7785; --dt-gray400:#8b93a1; --dt-gray500:#9aa3b2; --dt-gray550:#a5adba; --dt-gray600:#b4bac6;
      --dt-gray700:#cdd2da; --dt-gray800:#e6e8ec; --dt-gray900:#f3f4f6;
      --dt-green100:#16281a; --dt-orange100:#33190f; --dt-red50:#2a1416; --dt-red100:#3a171a; --dt-yellow100:#33290c;
      --dt-azure100:#12263a; --dt-pink100:#2a1630; --dt-aqua100:#0f2a2c; --dt-yellow900:#fcd34d;
      --dt-background-primary:${SURFACE}; --dt-surface-background:${SURFACE};
      --dt-profile-menu-bg:${RAISED}; --dt-toast-background:${RAISED}; --dt-tooltip-background:${RAISED};
      --dt-input-background-color:${RAISED}; --dt-input-background-color-hover:${RAISED};
      --dt-input-background-color-filled:${RAISED}; --dt-input-background-color-error:${RAISED};
      --dt-check-radio-background-color:${RAISED};
      --dt-border-primary:#ffffff52; --dt-border-secondary:#ffffff2e; --dt-border-tertiary:#ffffff14;
      --dt-background-dynamic-lvl-1:#ffffff08; --dt-background-dynamic-lvl-2:#ffffff12;
      --dt-interactive-hover:#ffffff14; --dt-interactive-pressed:#ffffff24; }
    html.dtr-dark body { background-color:${BG}; color:${TEXT}; }
    html.dtr-dark .twitter-typeahead .form-control { background-color:${RAISED} !important; }
    html.dtr-dark #ai-summary-trigger-button { background:#a78bfa1f !important; border:1px solid #a78bfa3d !important;
      border-radius:8px !important; color:#c4b5fd !important; transition:background-color .15s, border-color .15s; }
    html.dtr-dark #ai-summary-trigger-button:hover { background:#a78bfa33 !important; border-color:#a78bfa66 !important; }
    html.dtr-dark #ai-summary-trigger-button span { background:none !important; color:inherit !important;
      -webkit-text-fill-color:currentColor !important; font-size:14px; font-weight:500; }
    html.dtr-dark #ai-summary-trigger-button i { color:inherit !important; }
    html.dtr-dark .nvd3 text { fill:${MUTED}; }
    html.dtr-dark .nvd3 .nv-axis line, html.dtr-dark .nvd3 .nv-axis path { stroke:${BORDER}; }`;

  // Restyle on top of the dark palette: hairline cards, quiet titles, line sparklines
  const MODERN = `
    html.dtr-dark body, html.dtr-dark [class*="dt-typography"], html.dtr-dark .nvd3 text,
    html.dtr-dark .btn, html.dtr-dark input { font-family:${FONT} !important; }
    html.dtr-dark .dt-card { border-radius:14px; box-shadow:inset 0 0 0 1px ${BORDER} !important; }
    html.dtr-dark .dt-card[data-dtr-card] { box-shadow:inset 0 0 0 1px ${ACCENT}4d !important; }
    html.dtr-dark .dt-card--chart .dt-typography-h6 { font-size:13px; font-weight:500 !important;
      letter-spacing:.01em; color:${MUTED} !important; }
    html.dtr-dark .dt-card--chart .dt-typography-h3 { font-size:32px; font-weight:600; letter-spacing:-.025em;
      font-variant-numeric:tabular-nums; }
    html.dtr-dark .text-green400 { color:${ACCENT} !important; }
    html.dtr-dark .dt-card--chart [class*="icon-circle-question"] { opacity:.3; transition:opacity .15s; }
    html.dtr-dark .dt-card--chart:hover [class*="icon-circle-question"] { opacity:.8; }
    html.dtr-dark .dt-card--chart .card-footer { background-color:transparent; border-radius:0 0 14px 14px;
      -webkit-mask-image:linear-gradient(#000,transparent); mask-image:linear-gradient(#000,transparent); }
    html.dtr-dark .dt-card--chart .nvd3 .nv-area { opacity:1 !important; fill-opacity:.14 !important;
      stroke-width:1.5px !important; stroke-opacity:.9 !important; }
    html.dtr-dark .dt-card--productivity-chart .nv-bar { rx:2px; }
    html.dtr-dark .date-and-period-select-nav .dt-typography-h4 { font-weight:600; letter-spacing:-.02em; }
    html.dtr-dark nav.main-header .navbar { background-color:${BG}d1 !important; backdrop-filter:blur(12px);
      box-shadow:inset 0 -1px 0 ${BORDER}; }
    html.dtr-dark #sidebar { background-color:${BG} !important; box-shadow:inset -1px 0 0 ${BORDER}; }
    html.dtr-dark #sidebar .nav-link { border-radius:8px; font-size:14.5px; }
    html.dtr-dark #sidebar .nav-link.active { background-color:#ffffff12 !important; }`;

  const COLOR_PROPS = ['color', 'fill', 'stroke'];
  const BORDER_PROPS = ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color'];

  function parseRgb(v) {
    const m = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(v);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  }

  function neutral(c) {
    return Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) <= 24;
  }

  function lum(c) {
    return (c.r + c.g + c.b) / 3;
  }

  // Light neutral background -> dark surface; colored and already-dark backgrounds are kept
  function darkBg(v) {
    if (v === 'var(--dt-white)') return SURFACE;
    const c = parseRgb(v);
    if (!c || c.a < 0.5 || !neutral(c) || lum(c) < 200) return null;
    return lum(c) >= 253 ? SURFACE : RAISED;
  }

  function lightText(v) {
    const c = parseRgb(v);
    if (!c || !c.a || !neutral(c) || lum(c) > 130) return null;
    if (c.a < 1) return `rgba(255, 255, 255, ${c.a})`;
    return lum(c) <= 60 ? TEXT : MUTED;
  }

  function darkBorder(v) {
    const c = parseRgb(v);
    if (!c || !c.a || !neutral(c)) return null;
    if (lum(c) >= 180) return c.a < 1 ? `rgba(255, 255, 255, ${Math.min(c.a, 0.12)})` : BORDER;
    if (lum(c) <= 80 && c.a < 1) return `rgba(255, 255, 255, ${Math.min(c.a, 0.16)})`;
    return null;
  }

  // Prefix every selector in a list with html.dtr-dark (commas inside :is()/[] are not separators)
  function scope(selectorText) {
    const parts = [];
    let depth = 0;
    let cur = '';
    for (const ch of selectorText) {
      if (ch === '(' || ch === '[') depth++;
      if (ch === ')' || ch === ']') depth--;
      if (ch === ',' && !depth) {
        parts.push(cur);
        cur = '';
      } else cur += ch;
    }
    parts.push(cur);
    return parts.map(s => {
      s = s.trim();
      return /^(html|:root)(?![\w-])/.test(s) ? s.replace(/^(html|:root)/, 'html.dtr-dark') : `html.dtr-dark ${s}`;
    }).join(',');
  }

  // Dark overrides for hardcoded (non-variable) colors in DeskTime's own rules
  function convert(rules, out) {
    for (const rule of rules) {
      if (rule.cssRules && rule.conditionText !== undefined) {
        const inner = [];
        convert(rule.cssRules, inner);
        if (inner.length) out.push(`${rule.cssText.slice(0, rule.cssText.indexOf('{'))}{${inner.join('')}}`);
        continue;
      }
      const st = rule.style;
      if (!st || !rule.selectorText) continue;
      const decl = [];
      const imp = p => (st.getPropertyPriority(p) ? ' !important' : '');
      const bgRaw = st.getPropertyValue('background-color') || st.getPropertyValue('background').trim();
      const bg = darkBg(bgRaw);
      if (bg) decl.push(`background-color:${bg}${imp('background-color') || imp('background')}`);
      // Rule keeps its own colored/dark background: its text and border already suit it
      const keepsBg = !bg && bgRaw && parseRgb(bgRaw)?.a > 0.5;
      if (!keepsBg) {
        for (const p of COLOR_PROPS) {
          const v = lightText(st.getPropertyValue(p));
          if (v) decl.push(`${p}:${v}${imp(p)}`);
        }
        for (const p of BORDER_PROPS) {
          const v = darkBorder(st.getPropertyValue(p));
          if (v) decl.push(`${p}:${v}${imp(p)}`);
        }
      }
      if (decl.length) out.push(`${scope(rule.selectorText)}{${decl.join(';')}}`);
    }
  }

  // Sidebar and messages panel are dark already: give them back the original grays, plus every
  // variable derived from a gray (derived variables resolve at :root, so they must be redeclared)
  function restoreRule(rootVars) {
    const isGray = k => /^--dt-gray\d+$/.test(k);
    const derived = new Set();
    let grew = true;
    while (grew) {
      grew = false;
      for (const [k, v] of Object.entries(rootVars)) {
        if (derived.has(k) || isGray(k)) continue;
        if (/var\(--dt-gray\d+\)/.test(v) || [...derived].some(d => v.includes(`var(${d})`))) {
          derived.add(k);
          grew = true;
        }
      }
    }
    const decl = Object.entries(rootVars).filter(([k]) => isGray(k) || derived.has(k)).map(([k, v]) => `${k}:${v}`);
    return decl.length ? `html.dtr-dark #sidebar,html.dtr-dark #messages{${decl.join(';')}}` : '';
  }

  function ensureStyle(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.documentElement.appendChild(el);
    }
    return el;
  }

  let sheetCount = -1;
  function build() {
    if (document.styleSheets.length === sheetCount) return;
    sheetCount = document.styleSheets.length;
    const out = [];
    const rootVars = {};
    for (const sheet of document.styleSheets) {
      if (sheet.ownerNode?.id?.startsWith('dtr-')) continue;
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText !== ':root') continue;
          for (const p of rule.style) if (p.startsWith('--')) rootVars[p] = rule.style.getPropertyValue(p).trim();
        }
        convert(sheet.cssRules, out);
      } catch (e) {
        // Cross-origin stylesheet: rules not readable
      }
    }
    const css = `${restoreRule(rootVars)}\n${out.join('\n')}`;
    const el = ensureStyle('dtr-dark-generated');
    if (el.textContent !== css) el.textContent = css;
    // Own styles go last so they win over page rules of equal specificity
    document.documentElement.append(ensureStyle('dtr-dark-base'), el, ensureStyle('dtr-dark-modern'));
  }

  let enabled = false;
  function apply() {
    document.documentElement.classList.toggle('dtr-dark', enabled);
    if (!enabled) return;
    ensureStyle('dtr-dark-base').textContent = BASE;
    ensureStyle('dtr-dark-modern').textContent = MODERN;
    build();
  }

  chrome.storage.sync.get({ darkMode: false }, (data) => {
    enabled = data.darkMode;
    apply();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.darkMode) return;
    enabled = !!changes.darkMode.newValue;
    apply();
  });
  // Stylesheets finish loading after document_start
  document.addEventListener('DOMContentLoaded', () => enabled && build());
  window.addEventListener('load', () => enabled && build());
})();
