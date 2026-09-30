require('ts-node/register');
const test = require('node:test');
const assert = require('node:assert/strict');
const { ElectricityTariff } = require('../src/electricity-tariff.vo');

test('252 kWh calcula Bs 264,28 y 126 kg de CO2', () => {
  const bill = ElectricityTariff.calculate(252);
  assert.equal(bill.totalBs, 264.28);
  assert.equal(bill.co2Kg, 126);
  assert.equal(bill.referential, true);
});

test('rechaza consumo cero', () => {
  assert.throws(() => ElectricityTariff.calculate(0), /mayor que cero/);
});