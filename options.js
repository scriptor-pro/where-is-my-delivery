// Ding-Dong options popup — reads and writes the notification
// threshold to browser.storage.local, consumed by background.js.
const input = document.getElementById('threshold');
const savedLabel = document.getElementById('saved');

async function loadThreshold() {
  const { threshold } = await browser.storage.local.get('threshold');
  input.value = typeof threshold === 'number' ? threshold : 0;
}

let saveTimeout = null;

input.addEventListener('input', () => {
  const value = Number.parseInt(input.value, 10);
  if (Number.isNaN(value) || value < 0) return;

  browser.storage.local.set({ threshold: value }).then(() => {
    savedLabel.style.visibility = 'visible';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      savedLabel.style.visibility = 'hidden';
    }, 1200);
  });
});

loadThreshold();
