import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectInvoice,
  calculateLevenshtein,
  normalizeInvoiceNumber
} from '../server/duplicateDetector.js';

describe('Duplicate Detector Tests', () => {

  describe('calculateLevenshtein', () => {
    it('should calculate edit distance correctly', () => {
      assert.equal(calculateLevenshtein('kitten', 'sitting'), 3);
      assert.equal(calculateLevenshtein('INV123', 'INV124'), 1);
      assert.equal(calculateLevenshtein('test', 'test'), 0);
      assert.equal(calculateLevenshtein('', 'test'), 4);
      assert.equal(calculateLevenshtein('test', ''), 4);
      assert.equal(calculateLevenshtein('', ''), 0);
    });
  });

  describe('normalizeInvoiceNumber', () => {
    it('should lowercase and strip non-alphanumeric characters', () => {
      assert.equal(normalizeInvoiceNumber('INV-123'), 'inv123');
      assert.equal(normalizeInvoiceNumber('INV 123/A'), 'inv123a');
    });

    it('should remove common suffixes', () => {
      assert.equal(normalizeInvoiceNumber('INV123-R'), 'inv123');
      assert.equal(normalizeInvoiceNumber('INV123dup'), 'inv123');
      assert.equal(normalizeInvoiceNumber('INV123copy'), 'inv123');
      assert.equal(normalizeInvoiceNumber('INV123B'), 'inv123');
      assert.equal(normalizeInvoiceNumber('INV123rev'), 'inv123');
      assert.equal(normalizeInvoiceNumber('INV123-Rrev'), 'inv123r'); // Only strips last suffix
    });

    it('should handle empty input', () => {
      assert.equal(normalizeInvoiceNumber(''), '');
      assert.equal(normalizeInvoiceNumber(null), '');
      assert.equal(normalizeInvoiceNumber(undefined), '');
    });
  });

  describe('inspectInvoice', () => {
    const existingInvoices = [
      {
        id: '1',
        invoice_number: 'INV-100',
        vendor_id: 'v1',
        vendor_name: 'Vendor A',
        amount: 1000,
        currency: 'USD',
        issue_date: '2023-01-01'
      },
      {
        id: '2',
        invoice_number: 'INV-200',
        vendor_id: 'v2',
        vendor_name: 'Vendor B',
        amount: 500,
        currency: 'EUR',
        issue_date: '2023-01-10'
      }
    ];

    const verifiedVendors = [
      {
        id: 'v1',
        bank_details: { iban: 'IBAN_A' }
      }
    ];

    it('should clear valid invoice', () => {
      const target = {
        id: '99',
        invoice_number: 'INV-300',
        vendor_id: 'v3',
        vendor_name: 'Vendor C',
        amount: 200,
        currency: 'USD',
        issue_date: '2023-01-15'
      };
      const result = inspectInvoice(target, existingInvoices, verifiedVendors);
      assert.equal(result.riskLevel, 'CLEARED');
      assert.equal(result.isFlagged, false);
      assert.equal(result.flags.length, 0);
    });

    it('Rule 1: should detect Exact Identifier Collision', () => {
      const target = {
        id: '99',
        invoice_number: ' inv-100 ', // Whitespace difference and exact match
        vendor_id: 'v3', // Different vendor, still flags
        vendor_name: 'Vendor C',
        amount: 200,
        currency: 'USD',
        issue_date: '2023-01-15'
      };
      const result = inspectInvoice(target, existingInvoices, verifiedVendors);
      assert.equal(result.riskLevel, 'CRITICAL_DUPLICATE');
      assert.equal(result.isFlagged, true);
      assert.equal(result.flags[0].code, 'ERR_EXACT_INVOICE_DUPLICATE');
      assert.equal(result.matchedWith.id, '1');
    });

    it('Rule 2: should detect Normalized/Fuzzy Collision for same vendor', () => {
      const target = {
        id: '99',
        invoice_number: 'INV100-rev', // Matches 'INV-100' normalized
        vendor_id: 'v1',
        vendor_name: 'Vendor A',
        amount: 200,
        currency: 'USD',
        issue_date: '2023-01-15'
      };
      const result = inspectInvoice(target, existingInvoices, verifiedVendors);
      assert.equal(result.riskLevel, 'CRITICAL_DUPLICATE');
      assert.equal(result.isFlagged, true);
      assert.equal(result.flags[0].code, 'WARN_FUZZY_INVOICE_VARIATION');
      assert.equal(result.matchedWith.id, '1');
    });

    it('Rule 2: should detect Fuzzy Collision (Levenshtein <= 2) for same vendor', () => {
      const target = {
        id: '99',
        invoice_number: 'INV-101', // Levenshtein dist to 'INV100' is 1
        vendor_id: 'v1',
        vendor_name: 'Vendor A',
        amount: 200,
        currency: 'USD',
        issue_date: '2023-01-15'
      };
      const result = inspectInvoice(target, existingInvoices, verifiedVendors);
      assert.equal(result.riskLevel, 'CRITICAL_DUPLICATE');
      assert.equal(result.isFlagged, true);
      assert.equal(result.flags[0].code, 'WARN_FUZZY_INVOICE_VARIATION');
      assert.equal(result.matchedWith.id, '1');
    });

    it('Rule 3: should detect Triple-Vector Proximity', () => {
      const target = {
        id: '99',
        invoice_number: 'NEW-123',
        vendor_id: 'v1',
        vendor_name: 'Vendor A',
        amount: 1000,
        currency: 'USD',
        issue_date: '2023-01-14' // Within 14 days of '2023-01-01'
      };
      const result = inspectInvoice(target, existingInvoices, verifiedVendors);
      assert.equal(result.riskLevel, 'SUSPECT');
      assert.equal(result.isFlagged, true);
      assert.equal(result.flags[0].code, 'WARN_PROXIMITY_TRIPLE_VECTOR');
      assert.equal(result.matchedWith.id, '1');
    });

    it('Rule 4: should detect Bank Detail Mismatch', () => {
      const target = {
        id: '99',
        invoice_number: 'VALID-123',
        vendor_id: 'v1',
        vendor_name: 'Vendor A',
        amount: 200,
        currency: 'USD',
        issue_date: '2023-03-01',
        bank_details: { iban: 'IBAN_WRONG' }
      };
      const result = inspectInvoice(target, existingInvoices, verifiedVendors);
      assert.equal(result.riskLevel, 'CRITICAL_DUPLICATE');
      assert.equal(result.isFlagged, true);
      assert.equal(result.flags[0].code, 'WARN_BANK_DETAIL_MISMATCH');
    });

    it('should ignore matching itself by ID', () => {
      const target = {
        id: '1',
        invoice_number: 'INV-100',
        vendor_id: 'v1',
        vendor_name: 'Vendor A',
        amount: 1000,
        currency: 'USD',
        issue_date: '2023-01-01'
      };
      const result = inspectInvoice(target, existingInvoices, verifiedVendors);
      // Wait, there's a bank details mismatch check, let's see.
      // The target doesn't have bank_details, so it skips rule 4.
      // It should just clear.
      assert.equal(result.riskLevel, 'CLEARED');
    });
  });
});
