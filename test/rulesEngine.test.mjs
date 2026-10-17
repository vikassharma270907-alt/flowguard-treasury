import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertToUsdBase } from '../server/rulesEngine.js';

test('convertToUsdBase - returns amount when currency is USD', () => {
  const result = convertToUsdBase(100, 'USD', { 'EUR_USD': 1.1 });
  assert.equal(result, 100, 'Should return the exact amount when currency is USD');
});

test('convertToUsdBase - uses direct conversion rate (e.g. EUR_USD)', () => {
  const rates = { 'EUR_USD': 1.1 };
  const result = convertToUsdBase(100, 'EUR', rates);
  // We use Math.abs to handle floating point precision issues (e.g. 110.00000000000001)
  assert.ok(Math.abs(result - 110) < 0.00001, 'Should correctly convert using the direct key EUR_USD');
});

test('convertToUsdBase - uses inverse conversion rate (e.g. USD_EUR)', () => {
  const rates = { 'USD_EUR': 0.8 };
  // 100 EUR to USD => 100 / 0.8 = 125
  const result = convertToUsdBase(100, 'EUR', rates);
  assert.equal(result, 125, 'Should correctly convert using the inverse key USD_EUR');
});

test('convertToUsdBase - falls back to 1:1 if rate is unknown', () => {
  const rates = { 'GBP_USD': 1.3 };
  const result = convertToUsdBase(100, 'EUR', rates);
  assert.equal(result, 100, 'Should return original amount when no rate is found');
});
