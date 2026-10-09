// No bundled PNGs: the toolbar icon is drawn at runtime
function drawIcon(size) {
  const ctx = new OffscreenCanvas(size, size).getContext('2d');
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.28);
  ctx.fill();
  // Progress ring matching tools/make-icons.ps1: faint track, three-quarter arc from 12 o'clock
  const c = size / 2;
  const r = size * 0.27;
  ctx.lineWidth = size * 0.095;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff5a';
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(c, c, r, -Math.PI / 2, Math.PI);
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

function setIcon() {
  chrome.action.setIcon({ imageData: { 16: drawIcon(16), 32: drawIcon(32), 48: drawIcon(48) } });
}

chrome.runtime.onInstalled.addListener(setIcon);
chrome.runtime.onStartup.addListener(setIcon);
setIcon();
