// Auto-update for unpacked installs: a scheduled `git pull` changes the files on disk,
// then the extension reloads itself once the on-disk version differs from the running one
const CHECK_ALARM = 'update-check';
const CHECK_MINUTES = 5;

async function checkForUpdate() {
  try {
    const res = await fetch(chrome.runtime.getURL('manifest.json'), { cache: 'no-store' });
    const { version } = await res.json();
    if (version !== chrome.runtime.getManifest().version) chrome.runtime.reload();
  } catch (e) {
    // manifest.json can be mid-write during a pull: the next alarm retries
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM) checkForUpdate();
});

chrome.alarms.get(CHECK_ALARM, (alarm) => {
  if (!alarm) chrome.alarms.create(CHECK_ALARM, { periodInMinutes: CHECK_MINUTES });
});
