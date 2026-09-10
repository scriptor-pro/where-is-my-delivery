// Ding-Dong background service worker (Chrome MV3) — owns the
// notify/dedupe decision and triggers the desktop notification + sound.
//
// NOTE: shouldNotify is duplicated from lib/notify-decision.js — this is
// a plain classic script with no module loader, see the Firefox
// background.js (plan Task 5) for why this duplication is intentional.
function shouldNotify({ count, threshold, alreadyNotified }) {
  if (count === null || count === undefined) return false;
  if (alreadyNotified) return false;
  return count <= threshold;
}

async function getThreshold() {
  const { threshold } = await chrome.storage.local.get('threshold');
  return typeof threshold === 'number' ? threshold : 0;
}

async function isAlreadyNotified(trackingKey) {
  const { notified } = await chrome.storage.local.get('notified');
  return !!(notified && notified[trackingKey]);
}

async function markNotified(trackingKey) {
  const { notified } = await chrome.storage.local.get('notified');
  const updated = Object.assign({}, notified, { [trackingKey]: true });
  await chrome.storage.local.set({ notified: updated });
}

// Chrome MV3 service workers have no Audio API — playback happens in an
// offscreen document instead, created on demand (Chrome discards unused
// offscreen documents, so it may not already exist).
const OFFSCREEN_URL = 'offscreen.html';

async function ensureOffscreenDocument() {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });
  if (existing.length > 0) return;

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Play a notification sound when a delivery is near.',
  });
}

async function playSound() {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: 'play-sound' });
}

async function handleDeliveryCount({ trackingKey, count }) {
  const threshold = await getThreshold();
  const alreadyNotified = await isAlreadyNotified(trackingKey);

  if (!shouldNotify({ count, threshold, alreadyNotified })) return;

  await markNotified(trackingKey);

  const plural = count === 1 ? '' : 's';
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-96.png'),
    title: 'Livraison Amazon proche !',
    message: `Il reste ${count} livraison${plural} avant la vôtre.`,
  });
  playSound();
}

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === 'delivery-count') {
    handleDeliveryCount(message);
  }
});
