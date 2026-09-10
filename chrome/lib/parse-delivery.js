// Extracts the delivery count from Amazon's proximity card text, e.g.
// "7 livraisons avant la vôtre." -> 7. Returns null if the text doesn't
// match the expected pattern (Amazon changed the wording, or this isn't
// a proximity card at all).
function parseDeliveryCount(text) {
  if (typeof text !== 'string') return null;
  const match = text.match(/(\d+)\s+livraisons?\s+avant\s+la\s+vôtre/i);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

module.exports = { parseDeliveryCount };
