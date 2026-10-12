// Storage bridge for the remote-loaded scripts (see updater.js): they run in the user script
// world, which has no chrome.storage, so their requests arrive here as window messages
(() => {
  const TAG = 'dtr-storage';
  const post = (msg) => window.postMessage({ [TAG]: 'bridge', ...msg }, location.origin);

  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (e.source !== window || msg?.[TAG] !== 'script') return;
    if (msg.area !== 'sync' && msg.area !== 'local') return;
    const area = chrome.storage[msg.area];
    if (msg.op === 'get') area.get(msg.arg, (data) => post({ id: msg.id, data }));
    if (msg.op === 'set') area.set(msg.arg, () => post({ id: msg.id }));
  });
  chrome.storage.onChanged.addListener((changes, area) => post({ changes, area }));
  post({ ready: true });
})();
