// Ding-Dong content script — runs on every Amazon page (per manifest's
// host_permissions), but only acts on delivery-tracking pages showing
// "En cours de livraison". Watches the proximity card for its delivery
// count and forwards changes to the background script.
//
// NOTE: parseDeliveryCount is duplicated from lib/parse-delivery.js —
// content scripts have no module loader, see plan Task 4 for why this
// duplication is intentional.
function parseDeliveryCount(text) {
  if (typeof text !== 'string') return null;
  const match = text.match(/(\d+)\s+livraisons?\s+avant\s+la\s+vôtre/i);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function isTrackingPage() {
  const status = document.querySelector('.pt-status-main-status');
  return !!status && status.textContent.includes('En cours de livraison');
}

function trackingKey() {
  // The tracking URL (minus hash/fragment) uniquely identifies this
  // delivery for dedupe purposes.
  return location.origin + location.pathname + location.search;
}

let lastSentCount = null;

function checkAndReport() {
  if (!isTrackingPage()) return;
  const el = document.querySelector('.H_ib_content');
  if (!el) return;
  const count = parseDeliveryCount(el.textContent);
  if (count === null) return;
  if (count === lastSentCount) return; // no change, don't spam messages
  lastSentCount = count;
  browser.runtime.sendMessage({
    type: 'delivery-count',
    trackingKey: trackingKey(),
    count,
  });
}

const observer = new MutationObserver(() => checkAndReport());
observer.observe(document.body, { childList: true, subtree: true, characterData: true });

// Also check once on load, in case the card is already present (e.g. on
// a fresh page load rather than a live DOM update).
checkAndReport();
