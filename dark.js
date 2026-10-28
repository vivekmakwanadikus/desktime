(() => {
  // Graphite palette from it_admin's dark theme (it_admin/assets/it_admin.css, :root[data-theme="dark"])
  const BG = 'oklch(17.5% 0.02 262)';
  const SIDE = 'oklch(19.5% 0.022 262)';
  const SURFACE = 'oklch(21% 0.024 262)';
  const RAISED = 'oklch(26.5% 0.026 262)';
  const BORDER = 'oklch(30% 0.024 262)';
  const TEXT = 'oklch(93% 0.01 250)';
  const MUTED = 'oklch(69% 0.022 256)';
  const ACCENT = 'oklch(70% 0.14 255)';
  const OK_TEXT = 'oklch(80% 0.11 165)';

  // DeskTime themes through --dt-* palette variables; inverting the gray scale recolors most of the app
  const BASE = `
    html.dtr-dark { color-scheme:dark;
      --dt-gray50:${BG}; --dt-gray100:${RAISED}; --dt-gray150:${BORDER}; --dt-gray200:oklch(33% 0.026 262); --dt-gray250:oklch(44% 0.028 262);
      --dt-gray300:oklch(52% 0.026 260); --dt-gray400:oklch(62% 0.024 258); --dt-gray500:${MUTED}; --dt-gray550:oklch(73% 0.02 256); --dt-gray600:oklch(78% 0.016 254);
      --dt-gray700:oklch(84% 0.014 254); --dt-gray800:oklch(91% 0.01 250); --dt-gray900:oklch(95% 0.008 250);
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
    html.dtr-dark body { background-color:${BG}; color:${TEXT}; }`;

  // The it_admin (Cobalt) skin, always on: cool paper and cobalt in light, graphite in dark. Values are it_admin's
  // (it_admin/assets/it_admin.css). Tokens first, rules below use only var(); fonts fall back to system faces
  // because DeskTime pages load no web fonts of ours. The sidebar stays graphite in both themes (the logo is a white asset).
  const SKIN = `
    html.dtr-skin { color-scheme:light;
      --sk-font-display:"Familjen Grotesk","IBM Plex Sans","Segoe UI Variable Display","Segoe UI",system-ui,sans-serif;
      --sk-font:"IBM Plex Sans","Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;
      --sk-bg:oklch(96.2% 0.008 252); --sk-surface:oklch(99.2% 0.004 250); --sk-surface-2:oklch(97.4% 0.006 252);
      --sk-raised:oklch(99.4% 0.003 250); --sk-field:oklch(99.4% 0.003 250);
      --sk-border:oklch(90% 0.009 252); --sk-hover:oklch(97.2% 0.01 254); --sk-track:oklch(93.6% 0.011 252);
      --sk-text:oklch(21% 0.028 262); --sk-text-2:oklch(36% 0.022 260); --sk-muted:oklch(50% 0.018 258);
      --sk-primary:oklch(52% 0.19 258); --sk-primary-hover:oklch(47% 0.2 260); --sk-primary-soft:oklch(95% 0.028 256);
      --sk-primary-deep:oklch(39% 0.16 260); --sk-on-primary:oklch(98.6% 0.005 250);
      --sk-edge:oklch(62% 0.018 258); --sk-btn-edge:oklch(80% 0.016 254); --sk-btn-edge-hover:oklch(72% 0.02 254);
      --sk-ok-text:oklch(45% 0.1 165); --sk-danger:oklch(53% 0.19 25);
      --sk-shadow-card:0 1px 2px oklch(21% 0.028 262 / .06); --sk-shadow-tab:0 1px 2px oklch(21% 0.028 262 / .1);
      --sk-shadow-key:0 2px 0 0 var(--sk-btn-edge), 0 4px 6px -4px oklch(21% 0.028 262 / .24), inset 0 1px 0 oklch(100% 0 0 / .9);
      --sk-shadow-key-accent:0 2px 0 0 var(--sk-primary-deep), 0 4px 6px -4px oklch(30% 0.12 260 / .4), inset 0 1px 0 oklch(100% 0 0 / .2);
      --sk-shadow-press:inset 0 1px 2px oklch(21% 0.028 262 / .16);
      --sk-ease:cubic-bezier(.2, .7, .2, 1);
      --sk-side:oklch(21% 0.024 262); --sk-side-text:oklch(80% 0.016 254); --sk-side-strong:oklch(95% 0.008 250);
      --sk-side-hover:oklch(26.5% 0.026 262); --sk-side-active:oklch(26.5% 0.026 262); --sk-side-accent:oklch(70% 0.14 255); }
    html.dtr-dark { color-scheme:dark;
      --sk-bg:${BG}; --sk-surface:${SURFACE}; --sk-surface-2:${SIDE}; --sk-raised:${RAISED}; --sk-field:oklch(18.5% 0.022 262);
      --sk-border:${BORDER}; --sk-hover:oklch(24.5% 0.026 262); --sk-track:${RAISED};
      --sk-text:${TEXT}; --sk-text-2:oklch(82% 0.014 254); --sk-muted:${MUTED};
      --sk-primary:${ACCENT}; --sk-primary-hover:oklch(76% 0.12 254); --sk-primary-soft:oklch(70% 0.14 255 / .15);
      --sk-primary-deep:oklch(50% 0.14 258); --sk-on-primary:oklch(17% 0.03 262);
      --sk-edge:oklch(58% 0.022 256); --sk-btn-edge:oklch(14% 0.02 262); --sk-btn-edge-hover:oklch(44% 0.03 260);
      --sk-ok-text:${OK_TEXT}; --sk-danger:oklch(70% 0.16 25);
      --sk-shadow-card:0 1px 2px oklch(0% 0 0 / .3); --sk-shadow-tab:0 1px 2px oklch(0% 0 0 / .4);
      --sk-shadow-key:0 2px 0 0 var(--sk-btn-edge), 0 4px 6px -4px oklch(0% 0 0 / .5), inset 0 1px 0 oklch(100% 0 0 / .06);
      --sk-shadow-key-accent:0 2px 0 0 var(--sk-primary-deep), 0 4px 6px -4px oklch(0% 0 0 / .5), inset 0 1px 0 oklch(100% 0 0 / .25);
      --sk-shadow-press:inset 0 1px 2px oklch(0% 0 0 / .4);
      --sk-side:${SIDE}; }
    html.dtr-skin body, html.dtr-skin main, html.dtr-skin #content { background-color:var(--sk-bg) !important; color:var(--sk-text); }
    html.dtr-skin body, html.dtr-skin [class*="dt-typography"], html.dtr-skin .nvd3 text,
    html.dtr-skin .btn, html.dtr-skin input { font-family:var(--sk-font) !important; }
    html.dtr-skin ::selection { background:var(--sk-primary-soft); color:var(--sk-text); }
    html.dtr-skin #sidebar { background-color:var(--sk-side) !important; box-shadow:none; }
    html.dtr-skin #sidebar .nav-link { color:var(--sk-side-text) !important; border-radius:6px; font-size:14px; font-weight:500; }
    html.dtr-skin #sidebar .nav-link:hover { background-color:var(--sk-side-hover) !important; color:var(--sk-side-strong) !important; }
    html.dtr-skin #sidebar .nav-link.active { background-color:var(--sk-side-active) !important; color:var(--sk-side-strong) !important;
      border-color:transparent !important; outline:0; box-shadow:inset 2px 0 0 var(--sk-side-accent); }
    html.dtr-skin nav.main-header .navbar { background-color:var(--sk-surface) !important; box-shadow:inset 0 -1px 0 var(--sk-border) !important; }
    html.dtr-skin .top-bar-global-search .form-control, html.dtr-skin .twitter-typeahead .form-control {
      background-color:var(--sk-field) !important; border:1px solid var(--sk-edge) !important; border-radius:6px; color:var(--sk-text) !important; }
    html.dtr-skin .date-and-period-select-nav .title { font-family:var(--sk-font-display) !important; font-weight:600;
      letter-spacing:-.02em; color:var(--sk-text) !important; }
    html.dtr-skin .date-and-period-select-nav .date-picker { background-color:var(--sk-surface) !important; border:1px solid var(--sk-border) !important;
      border-radius:6px !important; color:var(--sk-text) !important; box-shadow:var(--sk-shadow-card); }
    html.dtr-skin .date-and-period-select-nav .date-picker * { color:var(--sk-text-2) !important; }
    html.dtr-skin .btn-secondary, html.dtr-skin .btn-light, html.dtr-skin #ai-summary-trigger-button {
      color:var(--sk-text) !important; background:var(--sk-raised) !important; border:1px solid var(--sk-btn-edge) !important;
      border-radius:6px !important; box-shadow:var(--sk-shadow-key) !important;
      transition:transform 120ms var(--sk-ease), box-shadow 120ms var(--sk-ease), background-color 120ms var(--sk-ease), border-color 120ms var(--sk-ease); }
    html.dtr-skin .btn-secondary:hover, html.dtr-skin .btn-light:hover, html.dtr-skin #ai-summary-trigger-button:hover {
      background:var(--sk-hover) !important; border-color:var(--sk-btn-edge-hover) !important; transform:translateY(-1px); }
    html.dtr-skin .btn-secondary:active, html.dtr-skin .btn-light:active, html.dtr-skin #ai-summary-trigger-button:active {
      transform:translateY(1px); box-shadow:var(--sk-shadow-press) !important; }
    html.dtr-skin .btn-primary { color:var(--sk-on-primary) !important; background:var(--sk-primary) !important;
      border:1px solid var(--sk-primary-deep) !important; border-radius:6px !important; box-shadow:var(--sk-shadow-key-accent) !important; }
    html.dtr-skin .btn-primary:hover { background:var(--sk-primary-hover) !important; }
    html.dtr-skin .btn:focus-visible, html.dtr-skin #ai-summary-trigger-button:focus-visible { outline:2px solid var(--sk-primary); outline-offset:2px; }
    html.dtr-skin #ai-summary-trigger-button span { background:none !important; color:inherit !important;
      -webkit-text-fill-color:currentColor !important; font-size:14px; font-weight:500; }
    html.dtr-skin #ai-summary-trigger-button i { color:inherit !important; }
    html.dtr-skin .tabs-container { background-color:var(--sk-track) !important; border-radius:8px !important; padding:3px !important;
      box-shadow:none !important; border:0 !important; }
    html.dtr-skin .tabs-container .tab { border-radius:6px !important; color:var(--sk-muted) !important; font-size:13px !important;
      font-weight:500 !important; background:transparent !important; box-shadow:none !important; }
    html.dtr-skin .tabs-container .tab.active { background-color:var(--sk-raised) !important; color:var(--sk-text) !important;
      box-shadow:var(--sk-shadow-tab) !important; }
    html.dtr-skin .dt-card { background-color:var(--sk-surface) !important; color:var(--sk-text); border:0 !important; border-radius:8px !important;
      box-shadow:inset 0 0 0 1px var(--sk-border), var(--sk-shadow-card) !important; }
    @supports (corner-shape:bevel) { html.dtr-skin .dt-card { border-radius:14px 4px 14px 4px !important; corner-shape:bevel round bevel round; } }
    html.dtr-skin .dt-card[data-dtr-card] { box-shadow:inset 0 0 0 1px color-mix(in oklch, var(--sk-primary) 30%, transparent), var(--sk-shadow-card) !important; }
    html.dtr-skin .dt-card--chart { overflow:hidden; }
    html.dtr-skin .dt-card--chart .dt-typography-h6 { font-size:13px; font-weight:500 !important; letter-spacing:.01em; color:var(--sk-muted) !important; }
    html.dtr-skin .dt-card--chart .dt-typography-h3 { font-family:var(--sk-font-display) !important; font-size:36px; font-weight:600;
      letter-spacing:-.03em; font-variant-numeric:tabular-nums; }
    html.dtr-skin .text-green400 { color:var(--sk-ok-text) !important; }
    html.dtr-skin .text-red500 { color:var(--sk-danger) !important; }
    html.dtr-skin .dt-card--chart [class*="icon-circle-question"] { opacity:.45; transition:opacity 120ms var(--sk-ease); }
    html.dtr-skin .dt-card--chart:hover [class*="icon-circle-question"] { opacity:.9; }
    html.dtr-skin .dt-card--chart .card-footer { background-color:transparent !important;
      -webkit-mask-image:linear-gradient(#000,transparent); mask-image:linear-gradient(#000,transparent); }
    html.dtr-skin .dt-card--chart .nvd3 .nv-area { opacity:1 !important; fill-opacity:.14 !important; stroke-width:1.5px !important; stroke-opacity:.9 !important; }
    html.dtr-skin .dt-card--productivity-chart .nv-bar { rx:2px; }
    html.dtr-skin .nvd3 text { fill:var(--sk-muted); }
    html.dtr-skin .nvd3 .nv-axis line, html.dtr-skin .nvd3 .nv-axis path { stroke:var(--sk-border); }
    html.dtr-skin .dt-card--apps [class*="header-"] { background-color:var(--sk-surface-2) !important; border-top:0 !important;
      border-bottom:1px solid var(--sk-border); color:var(--sk-text) !important; }
    html.dtr-skin .dt-card--apps .header-productive { color:var(--sk-ok-text) !important; }
    html.dtr-skin .dt-card--apps .header-unproductive { color:var(--sk-danger) !important; }
    html.dtr-skin .dt-card--apps .header-neutral { color:var(--sk-muted) !important; }
    @media (prefers-reduced-motion:reduce) {
      html.dtr-skin .btn, html.dtr-skin #ai-summary-trigger-button, html.dtr-skin .dt-card--chart [class*="icon-circle-question"] { transition:none !important; }
      html.dtr-skin .btn:hover, html.dtr-skin #ai-summary-trigger-button:hover { transform:none; }
    }`;

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
    mount();
  }

  // Own styles go last so they win over page rules of equal specificity; the skin is always on, the dark layers only when enabled
  function mount() {
    const skin = ensureStyle('dtr-skin');
    if (skin.textContent !== SKIN) skin.textContent = SKIN;
    if (enabled) document.documentElement.append(ensureStyle('dtr-dark-base'), ensureStyle('dtr-dark-generated'));
    document.documentElement.append(skin);
  }

  let enabled = false;
  function apply() {
    document.documentElement.classList.add('dtr-skin');
    document.documentElement.classList.toggle('dtr-dark', enabled);
    if (!enabled) return mount();
    ensureStyle('dtr-dark-base').textContent = BASE;
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
  document.addEventListener('DOMContentLoaded', () => (enabled ? build() : mount()));
  window.addEventListener('load', () => (enabled ? build() : mount()));
})();
