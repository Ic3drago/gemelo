require('ts-node/register');
const test = require('node:test');
const assert = require('node:assert/strict');
const { PointsPolicy } = require('../src/domain/points-policy');
const { LevelingPolicy } = require('../src/domain/leveling-policy');

test('aplica puntos de compra, energía y comida', () => {
  assert.equal(PointsPolicy.forPurchase('Arroz').points, 5);
  assert.equal(PointsPolicy.forEnergyReading(4).points, 15);
  assert.equal(PointsPolicy.forEnergyReading(5).points, 3);
  assert.equal(PointsPolicy.forFoodConsumed('Papa').points, 10);
  assert.equal(PointsPolicy.forFoodWasted('Papa').points, -5);
  assert.equal(PointsPolicy.forBillSaved().points, 3);
});

test('aplica umbrales de nivel y puntos faltantes', () => {
  assert.equal(LevelingPolicy.computeLevel(0).level, 1);
  assert.equal(LevelingPolicy.computeLevel(101).level, 2);
  assert.equal(LevelingPolicy.computeLevel(501).level, 3);
  assert.equal(LevelingPolicy.computeLevel(1501).level, 4);
  assert.equal(LevelingPolicy.pointsToNextLevel(86), 15);
});