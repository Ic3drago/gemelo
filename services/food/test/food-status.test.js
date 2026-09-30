require('ts-node/register');
const test = require('node:test');
const assert = require('node:assert/strict');
const { FoodStatus } = require('../src/food-status.vo');

test('solo permite transiciones desde stored', () => {
  const stored = FoodStatus.of('stored');
  const consumed = FoodStatus.of('consumed');
  const wasted = FoodStatus.of('wasted');
  assert.equal(stored.canTransitionTo(consumed), true);
  assert.equal(stored.canTransitionTo(wasted), true);
  assert.equal(consumed.canTransitionTo(stored), false);
  assert.equal(wasted.canTransitionTo(consumed), false);
});