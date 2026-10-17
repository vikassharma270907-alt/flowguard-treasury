import { describe, it } from 'node:test';
import assert from 'node:assert';
import { convertToUsdBase, getCorridorFee, planPayments } from '../server/rulesEngine.js';

describe('Rules Engine', () => {
  describe('getCorridorFee', () => {
    it('returns flat EUR 12.85 for EUR SWIFT', () => {
      const fee = getCorridorFee('EUR', 'SWIFT');
      assert.deepStrictEqual(fee, { fee_amount: 12.85, fee_currency: 'EUR', fee_usd: 13.94 });
    });

    it('returns flat USD 15.00 for USD SWIFT', () => {
      const fee = getCorridorFee('USD', 'SWIFT');
      assert.deepStrictEqual(fee, { fee_amount: 15.00, fee_currency: 'USD', fee_usd: 15.00 });
    });

    it('returns flat USD 15.00 for other currency SWIFT', () => {
      const fee = getCorridorFee('GBP', 'SWIFT');
      assert.deepStrictEqual(fee, { fee_amount: 15.00, fee_currency: 'USD', fee_usd: 15.00 });
    });

    it('returns free for LOCAL payment method', () => {
      const fee = getCorridorFee('EUR', 'LOCAL');
      assert.deepStrictEqual(fee, { fee_amount: 0.00, fee_currency: 'EUR', fee_usd: 0.00 });
    });
  });

  describe('convertToUsdBase', () => {
    const mockRates = {
      'EUR_USD': 1.10,
      'USD_GBP': 0.80,
    };

    it('returns the same amount for USD', () => {
      const result = convertToUsdBase(100, 'USD', mockRates);
      assert.strictEqual(result, 100);
    });

    it('uses direct rate if available', () => {
      const result = convertToUsdBase(100, 'EUR', mockRates);
      assert.ok(Math.abs(result - 110) < 0.0001);
    });

    it('uses inverse rate if direct is not available', () => {
      const result = convertToUsdBase(80, 'GBP', mockRates);
      assert.strictEqual(result, 100);
    });

    it('returns fallback 1:1 if rate is unknown', () => {
      const result = convertToUsdBase(100, 'AUD', mockRates);
      assert.strictEqual(result, 100);
    });
  });

  describe('planPayments', () => {
    const mockRates = {
      'EUR_USD': 1.10,
    };

    const mockBalances = [
      { currency: 'USD', available_amount: 20000.00 }
    ];

    it('recommends PAY_NOW if remaining balance >= reserveFloor', () => {
      const invoices = [
        {
          id: 'inv_1',
          currency: 'USD',
          payment_method: 'LOCAL',
          amount: 1000,
          operational_criticality: 'HIGH',
          due_date: '2026-10-20'
        }
      ];

      const result = planPayments({
        balances: mockBalances,
        invoices,
        inspections: [],
        reserveFloor: 15000,
        expectedReceivables: [],
        fxRates: mockRates
      });

      assert.strictEqual(result.decisions.length, 1);
      assert.strictEqual(result.decisions[0].recommendation, 'PAY_NOW');
      assert.strictEqual(result.decisions[0].projectedRemainingReserveUsd, 19000);
    });

    it('recommends DEFER if remaining balance < reserveFloor', () => {
      const invoices = [
        {
          id: 'inv_2',
          currency: 'USD',
          payment_method: 'LOCAL',
          amount: 6000, // 20000 - 6000 = 14000 < 15000
          operational_criticality: 'HIGH',
          due_date: '2026-10-20'
        }
      ];

      const result = planPayments({
        balances: mockBalances,
        invoices,
        inspections: [],
        reserveFloor: 15000,
        expectedReceivables: [],
        fxRates: mockRates
      });

      assert.strictEqual(result.decisions.length, 1);
      assert.strictEqual(result.decisions[0].recommendation, 'DEFER');
      assert.strictEqual(result.decisions[0].shortfall, 1000);
    });

    it('recommends ALREADY_PAID if invoice status is PAID', () => {
      const invoices = [
        {
          id: 'inv_3',
          currency: 'USD',
          payment_method: 'LOCAL',
          amount: 1000,
          status: 'PAID',
          operational_criticality: 'HIGH',
          due_date: '2026-10-20'
        }
      ];

      const result = planPayments({
        balances: mockBalances,
        invoices,
        inspections: [],
        reserveFloor: 15000,
        expectedReceivables: [],
        fxRates: mockRates
      });

      assert.strictEqual(result.decisions.length, 1);
      assert.strictEqual(result.decisions[0].recommendation, 'ALREADY_PAID');
    });

    it('recommends BLOCKED if invoice is flagged by inspection', () => {
      const invoices = [
        {
          id: 'inv_4',
          currency: 'USD',
          payment_method: 'LOCAL',
          amount: 1000,
          operational_criticality: 'HIGH',
          due_date: '2026-10-20'
        }
      ];

      const inspections = [
        {
          invoiceId: 'inv_4',
          riskLevel: 'CRITICAL_DUPLICATE',
          riskScore: 90
        }
      ];

      const result = planPayments({
        balances: mockBalances,
        invoices,
        inspections,
        reserveFloor: 15000,
        expectedReceivables: [],
        fxRates: mockRates
      });

      assert.strictEqual(result.decisions.length, 1);
      assert.strictEqual(result.decisions[0].recommendation, 'BLOCKED');
      assert.strictEqual(result.decisions[0].isBlocked, true);
    });
  });
});
