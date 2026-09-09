const test = require('node:test');
const assert = require('node:assert');
const { parseDeliveryCount } = require('../lib/parse-delivery.js');

test('parses a plural count', () => {
  assert.strictEqual(parseDeliveryCount('7 livraisons avant la vôtre.'), 7);
});

test('parses a singular count', () => {
  assert.strictEqual(parseDeliveryCount('1 livraison avant la vôtre.'), 1);
});

test('parses zero', () => {
  assert.strictEqual(parseDeliveryCount('0 livraison avant la vôtre.'), 0);
});

test('is case-insensitive', () => {
  assert.strictEqual(parseDeliveryCount('3 LIVRAISONS AVANT LA VÔTRE.'), 3);
});

test('ignores surrounding whitespace and text', () => {
  assert.strictEqual(
    parseDeliveryCount('  \n  12 livraisons avant la vôtre.  \n  '),
    12
  );
});

test('returns null when the text does not match', () => {
  assert.strictEqual(parseDeliveryCount('Le colis est arrivé.'), null);
});

test('returns null for empty string', () => {
  assert.strictEqual(parseDeliveryCount(''), null);
});

test('returns null for non-string input', () => {
  assert.strictEqual(parseDeliveryCount(null), null);
  assert.strictEqual(parseDeliveryCount(undefined), null);
});
