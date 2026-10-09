// No bundled PNGs: the toolbar icon is drawn at runtime
function drawIcon(size) {
  const ctx = new OffscreenCanvas(size, size).getContext('2d');
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.28);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(size * 0.68)}px system-ui, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('D', size / 2, size / 2 + size * 0.04);
  return ctx.getImageData(0, 0, size, size);
}

function setIcon() {
  chrome.action.setIcon({ imageData: { 16: drawIcon(16), 32: drawIcon(32), 48: drawIcon(48) } });
}

chrome.runtime.onInstalled.addListener(setIcon);
chrome.runtime.onStartup.addListener(setIcon);
setIcon();
