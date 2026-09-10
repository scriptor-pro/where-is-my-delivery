// Decides whether a notification should fire for this delivery-count
// reading. Pure decision: no I/O, no storage access — the caller
// (background.js) is responsible for reading/writing the persisted
// threshold and alreadyNotified state.
function shouldNotify({ count, threshold, alreadyNotified }) {
  if (count === null || count === undefined) return false;
  if (alreadyNotified) return false;
  return count <= threshold;
}

module.exports = { shouldNotify };
