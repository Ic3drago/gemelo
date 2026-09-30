require('reflect-metadata');
require('ts-node/register');
const test = require('node:test');
const assert = require('node:assert/strict');
const { Account } = require('../src/entities/account.entity');

test('mantiene balance no negativo y aplica movimientos', () => {
  const account = Object.assign(new Account(), { balance: 100 });
  account.applyIncome(25);
  account.applyExpense(40);
  assert.equal(Number(account.balance), 85);
  assert.throws(() => account.applyExpense(86), /Saldo insuficiente/);
});

test('rechaza ingresos y egresos no positivos', () => {
  const account = Object.assign(new Account(), { balance: 100 });
  assert.throws(() => account.applyIncome(0), /debe ser positivo/);
  assert.throws(() => account.applyExpense(-1), /debe ser positivo/);
});