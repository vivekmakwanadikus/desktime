// Auto-update without the Web Store: content.js and dark.js are fetched from GitHub and
// registered as user scripts, so a push to master reaches every install with no reinstall.
// Needs "Allow User Scripts" switched on in the extension's details page.
const REMOTE = 'https://raw.githubusercontent.com/vivekmakwanadikus/desktime/master/';
const MATCHES = ['https://desktime.com/app/*', 'https://*.desktime.com/app/*'];
const SCRIPTS = [
  { id: 'dark', file: 'dark.js', runAt: 'document_start' },
  { id: 'content', file: 'content.js', runAt: 'document_idle' },
];
// Dev switch: true loads the bundled files from this folder instead of GitHub (reload the extension to pick up edits)
const LOCAL = false;
const TITLE = 'DeskTime Remaining Time';
const CHECK_ALARM = 'update-check';
const CHECK_MINUTES = 5;

// Runs inside the user script world, which has no chrome.storage: look-alike that talks to bridge.js
function storageShim() {
  const TAG = 'dtr-storage';
  const pending = new Map();
  const listeners = [];
  const post = (msg) => window.postMessage({ [TAG]: 'script', ...msg }, location.origin);

  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (e.source !== window || msg?.[TAG] !== 'bridge') return;
    if (msg.ready) {
      // Bridge loaded after this script: resend what it missed
      for (const { request } of pending.values()) post(request);
    } else if (msg.changes) {
      for (const fn of listeners) fn(msg.changes, msg.area);
    } else if (pending.has(msg.id)) {
      const { callback } = pending.get(msg.id);
      pending.delete(msg.id);
      callback?.(msg.data);
    }
  });

  const call = (area, op) => (arg, callback) => {
    const request = { id: crypto.randomUUID(), area, op, arg };
    pending.set(request.id, { request, callback });
    post(request);
  };
  const area = (name) => ({ get: call(name, 'get'), set: call(name, 'set') });
  return { storage: { sync: area('sync'), local: area('local'), onChanged: { addListener: (fn) => listeners.push(fn) } } };
}

// Scripts keep calling chrome.storage as written; the shim is passed in under that name
function wrap(source) {
  return `(function (chrome) {\n${source}\n})((${storageShim})());`;
}

function userScriptsAvailable() {
  try {
    // Throws when the permission or the "Allow User Scripts" toggle is missing
    chrome.userScripts.getScripts();
    return true;
  } catch (e) {
    return false;
  }
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const text = res.ok ? await res.text() : '';
    return text.trim() ? text : null;
  } catch (e) {
    return null;
  }
}

async function sync() {
  const available = userScriptsAvailable();
  chrome.action.setBadgeText({ text: available ? '' : '!' });
  chrome.action.setTitle({ title: available ? TITLE : `${TITLE}: switch on "Allow User Scripts" in extension details` });
  if (!available) return;

  const registered = await chrome.userScripts.getScripts();
  for (const { id, file, runAt } of SCRIPTS) {
    const current = registered.find(s => s.id === id);
    // Bundled copy covers first run while GitHub is unreachable
    const bundled = () => fetchText(chrome.runtime.getURL(file));
    const source = LOCAL ? await bundled() : await fetchText(REMOTE + file) ?? (current ? null : await bundled());
    if (!source) continue;
    const code = wrap(source);
    if (current?.js[0].code === code) continue;
    const script = { id, matches: MATCHES, js: [{ code }], runAt, world: 'USER_SCRIPT' };
    await (current ? chrome.userScripts.update([script]) : chrome.userScripts.register([script]));
  }
}

// Alarm can wake the worker, so the start-up run and the alarm run would otherwise overlap
let syncing = null;
function syncOnce() {
  syncing ??= sync()
    .catch(e => console.warn('[DeskTime Remaining] update failed', e))
    .finally(() => { syncing = null; });
  return syncing;
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM) syncOnce();
});

chrome.alarms.get(CHECK_ALARM, (alarm) => {
  if (!alarm) chrome.alarms.create(CHECK_ALARM, { periodInMinutes: CHECK_MINUTES });
});

syncOnce();
