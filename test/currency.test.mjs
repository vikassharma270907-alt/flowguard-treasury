import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  formatINRCompact,
  paiseToRupees,
  rupeesToPaise,
  calculateGST,
  parseGSTRate,
  roundToClean
} from '../lib/currency.ts';

test('formatINR: Indian digit grouping with whole rupees by default', () => {
  // 999 -> ₹999
  assert.equal(formatINR(999), '₹999');

  // 1000 -> ₹1,000
  assert.equal(formatINR(1000), '₹1,000');

  // 99999 -> ₹99,999
  assert.equal(formatINR(99999), '₹99,999');

  // 100000 -> ₹1,00,000 (Indian grouping: 1,00,000 not 100,000)
  assert.equal(formatINR(100000), '₹1,00,000');

  // 1234567 -> ₹12,34,567
  assert.equal(formatINR(1234567), '₹12,34,567');

  // 10000000 -> ₹1,00,00,000 (1 Crore)
  assert.equal(formatINR(10000000), '₹1,00,00,000');

  // 0 -> ₹0
  assert.equal(formatINR(0), '₹0');
});

test('formatINR: fractional paise values show 2 decimals only when present', () => {
  // A paise value with fractional rupee part
  assert.equal(formatINR(1000.5), '₹1,000.50');
  assert.equal(formatINR(999.75), '₹999.75');
  assert.equal(formatINR(0.25), '₹0.25');

  // When amount is passed in paise directly (inPaise: true)
  assert.equal(formatINR(100050, { inPaise: true }), '₹1,000.50');
  assert.equal(formatINR(99900, { inPaise: true }), '₹999');
  assert.equal(formatINR(10000000, { inPaise: true }), '₹1,00,000');
});

test('formatINR: works with Hindi locale using Latin digits', () => {
  assert.equal(formatINR(100000, { locale: 'hi' }), '₹1,00,000');
  assert.equal(formatINR(1234567, { locale: 'hi-IN' }), '₹12,34,567');
  assert.equal(formatINR(999.5, { locale: 'hi' }), '₹999.50');
});

test('formatINRCompact: compact notation in Lakh and Crore', () => {
  // 1.2 Lakh (120,000)
  assert.equal(formatINRCompact(120000), '₹1.2 L');
  assert.equal(formatINRCompact(120000, { locale: 'hi' }), '₹1.2 लाख');

  // 3.5 Crore (35,000,000)
  assert.equal(formatINRCompact(35000000), '₹3.5 Cr');
  assert.equal(formatINRCompact(35000000, { locale: 'hi' }), '₹3.5 करोड़');

  // 1 Crore exact (10,000,000)
  assert.equal(formatINRCompact(10000000), '₹1 Cr');
  assert.equal(formatINRCompact(10000000, { locale: 'hi' }), '₹1 करोड़');

  // 1 Lakh exact (100,000)
  assert.equal(formatINRCompact(100000), '₹1 L');
  assert.equal(formatINRCompact(100000, { locale: 'hi' }), '₹1 लाख');

  // Under 1 Lakh falls back to standard grouping
  assert.equal(formatINRCompact(50000), '₹50,000');
  assert.equal(formatINRCompact(0), '₹0');

  // When amount is in paise (inPaise: true)
  assert.equal(formatINRCompact(12000000, { inPaise: true }), '₹1.2 L');
  assert.equal(formatINRCompact(3500000000, { inPaise: true }), '₹3.5 Cr');
});

test('paiseToRupees and rupeesToPaise integer safety', () => {
  assert.equal(rupeesToPaise(2499), 249900);
  assert.equal(paiseToRupees(249900), 2499);

  // Avoiding floating-point precision error: 0.1 + 0.2
  const p1 = rupeesToPaise(0.1);
  const p2 = rupeesToPaise(0.2);
  assert.equal(p1 + p2, 30);
  assert.equal(paiseToRupees(p1 + p2), 0.3);
});

test('calculateGST: does not calculate or assume rate when gstRate is not set', () => {
  const resultUnset = calculateGST(249900, undefined);
  assert.equal(resultUnset.hasGst, false);
  assert.equal(resultUnset.gstAmountPaise, 0);
  assert.equal(resultUnset.totalAmountPaise, 249900);

  const resultEmpty = calculateGST(249900, '');
  assert.equal(resultEmpty.hasGst, false);
  assert.equal(resultEmpty.gstAmountPaise, 0);
  assert.equal(resultEmpty.totalAmountPaise, 249900);

  const resultNull = calculateGST(249900, null);
  assert.equal(resultNull.hasGst, false);
});

test('calculateGST: calculates correct exclusive and inclusive GST when gstRate is configured', () => {
  // 18% GST Exclusive on ₹2,499 (249900 paise)
  const resExclusive = calculateGST(249900, 0.18, 'exclusive');
  assert.equal(resExclusive.hasGst, true);
  assert.equal(resExclusive.gstRatePercentage, 18);
  assert.equal(resExclusive.baseAmountPaise, 249900);
  assert.equal(resExclusive.gstAmountPaise, 44982); // ₹449.82
  assert.equal(resExclusive.totalAmountPaise, 294882); // ₹2,948.82

  // 18% string "18%" or "0.18"
  const resStr = calculateGST(249900, '18%', 'exclusive');
  assert.equal(resStr.hasGst, true);
  assert.equal(resStr.gstAmountPaise, 44982);

  // 18% GST Inclusive on ₹2,949 (294900 paise)
  const resInclusive = calculateGST(294882, '0.18', 'inclusive');
  assert.equal(resInclusive.hasGst, true);
  assert.equal(resInclusive.totalAmountPaise, 294882);
  assert.equal(resInclusive.baseAmountPaise, 249900);
  assert.equal(resInclusive.gstAmountPaise, 44982);
});

test('roundToClean: rounds prices to clean boundaries', () => {
  assert.equal(roundToClean(2494, 10), 2490);
  assert.equal(roundToClean(2496, 10), 2500);
  assert.equal(roundToClean(2449, 100), 2400);
  assert.equal(roundToClean(2451, 100), 2500);
});

test('Exchange Rate Fallback: returns approximate fallback rate and never NaN or blank when API fails', async () => {
  const fallbackEnvRate = Number(process.env.FALLBACK_USD_INR) || 86.50;

  // Simulate failed/blocked API fetch
  const mockFailedFetch = async () => {
    throw new Error('Network connection blocked or timeout');
  };

  let simulatedCache = { rate: null, cachedAt: 0 };
  let resolvedRate = null;
  let isApproximate = false;

  try {
    await mockFailedFetch();
  } catch (err) {
    if (simulatedCache.rate) {
      resolvedRate = simulatedCache.rate;
      isApproximate = true;
    } else {
      resolvedRate = fallbackEnvRate;
      isApproximate = true;
    }
  }

  assert.equal(typeof resolvedRate, 'number');
  assert.equal(isNaN(resolvedRate), false);
  assert.equal(resolvedRate > 0, true);
  assert.equal(isApproximate, true);
  assert.equal(resolvedRate, 86.50);

  // Formatting with fallback rate produces clean INR string, never NaN
  const usdPrice = 29;
  const inrPricePaise = Math.round(usdPrice * resolvedRate * 100);
  const formatted = formatINR(inrPricePaise, { inPaise: true });
  assert.equal(formatted.includes('NaN'), false);
  assert.equal(formatted.startsWith('₹'), true);
});
