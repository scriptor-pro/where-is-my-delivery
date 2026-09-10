// Where Is My Delivery? background script — owns the notify/dedupe decision and
// triggers the desktop notification + sound.
//
// NOTE: shouldNotify is duplicated from lib/notify-decision.js — this
// background script is a plain classic script with no module loader,
// see plan Task 5 for why this duplication is intentional.
function shouldNotify({ count, threshold, alreadyNotified }) {
  if (count === null || count === undefined) return false;
  if (alreadyNotified) return false;
  return count <= threshold;
}

async function getThreshold() {
  const { threshold } = await browser.storage.local.get('threshold');
  return typeof threshold === 'number' ? threshold : 0;
}

async function isAlreadyNotified(trackingKey) {
  const { notified } = await browser.storage.local.get('notified');
  return !!(notified && notified[trackingKey]);
}

async function markNotified(trackingKey) {
  const { notified } = await browser.storage.local.get('notified');
  const updated = Object.assign({}, notified, { [trackingKey]: true });
  await browser.storage.local.set({ notified: updated });
}

function playSound() {
  const audio = new Audio(browser.runtime.getURL('sounds/alert.mp3'));
  audio.play().catch(() => {
    // Autoplay can be blocked in some contexts; the desktop notification
    // still fires regardless, so a failed sound is not fatal.
  });
}

async function handleDeliveryCount({ trackingKey, count }) {
  const threshold = await getThreshold();
  const alreadyNotified = await isAlreadyNotified(trackingKey);

  if (!shouldNotify({ count, threshold, alreadyNotified })) return;

  await markNotified(trackingKey);

  const plural = count === 1 ? '' : 's';
  browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('icons/icon-96.png'),
    title: 'Livraison Amazon proche !',
    message: `Il reste ${count} livraison${plural} avant la vôtre.`,
  });
  playSound();
}

browser.runtime.onMessage.addListener((message) => {
  if (message && message.type === 'delivery-count') {
    handleDeliveryCount(message);
  }
});
