const test = require('node:test');
const assert = require('node:assert');
const { shouldNotify } = require('../lib/notify-decision.js');

test('notifies when count is at threshold', () => {
  assert.strictEqual(
    shouldNotify({ count: 0, threshold: 0, alreadyNotified: false }),
    true
  );
});

test('notifies when count is below threshold', () => {
  assert.strictEqual(
    shouldNotify({ count: 1, threshold: 3, alreadyNotified: false }),
    true
  );
});

test('does not notify when count is above threshold', () => {
  assert.strictEqual(
    shouldNotify({ count: 5, threshold: 3, alreadyNotified: false }),
    false
  );
});

test('does not notify twice for the same delivery', () => {
  assert.strictEqual(
    shouldNotify({ count: 0, threshold: 0, alreadyNotified: true }),
    false
  );
});

test('does not notify on null count', () => {
  assert.strictEqual(
    shouldNotify({ count: null, threshold: 0, alreadyNotified: false }),
    false
  );
});
