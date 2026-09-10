// Where Is My Delivery? offscreen document — the only context in Chrome MV3 that can
// play audio, since the background service worker has no Audio API.
// Created on demand by background.js, which posts a 'play-sound' message
// here each time a notification fires.
chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === 'play-sound') {
    const audio = new Audio(chrome.runtime.getURL('sounds/alert.mp3'));
    audio.play().catch(() => {
      // Autoplay can be blocked in some contexts; the desktop notification
      // still fires regardless, so a failed sound is not fatal.
    });
  }
});
