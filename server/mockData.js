/**
 * BeyondFlow - Realistic Synthetic Seed Data for Sandbox Demo
 * Reflects small business cross-border operations (E-commerce / Hardware Importer)
 * Uses standard major units as required by Airwallex APIs (e.g. 100 = $100.00).
 */

const INITIAL_BALANCES = [
  { currency: 'USD', available_amount: 24500.00, pending_amount: 0.00, reserved_amount: 0.00 },
  { currency: 'EUR', available_amount: 4800.00, pending_amount: 0.00, reserved_amount: 0.00 },
  { currency: 'GBP', available_amount: 2150.00, pending_amount: 0.00, reserved_amount: 0.00 },
  { currency: 'AUD', available_amount: 1000.00, pending_amount: 0.00, reserved_amount: 0.00 },
];

const INDICATIVE_FX_RATES = {
  'USD_EUR': 0.9215,
  'EUR_USD': 1.0852,
  'USD_GBP': 0.7845,
  'GBP_USD': 1.2747,
  'USD_AUD': 1.5120,
  'AUD_USD': 0.6614,
};

const INITIAL_VENDORS = [
  {
    id: 'ven_bavaria_01',
    name: 'Bavaria Precision Tooling GmbH',
    country: 'DE',
    currency: 'EUR',
    payment_method: 'SWIFT',
    swift_fee: 12.85, // Official Airwallex flat EUR 12.85 fee for EUR SWIFT
    bank_details: {
      iban: 'DE89370400440532013000',
      swift_code: 'DBEUMM21XXX',
      bank_name: 'Deutsche Bank Munich'
    },
    category: 'Manufacturing Components',
    verified: true,
    historical_invoices_count: 8,
    typical_spend_range: '€3,000 - €8,000'
  },
  {
    id: 'ven_apex_02',
    name: 'Apex Logistics North America LLC',
    country: 'US',
    currency: 'USD',
    payment_method: 'LOCAL',
    swift_fee: 0.00, // Free local ACH / Fedwire payout
    bank_details: {
      account_routing_type1: 'aba',
      routing_number: '121000358',
      account_number: '9845720194',
      bank_account_category: 'Checking',
      bank_name: 'Wells Fargo San Francisco'
    },
    category: 'Freight & Port Handling',
    verified: true,
    historical_invoices_count: 14,
    typical_spend_range: '$4,000 - $12,000'
  },
  {
    id: 'ven_thames_03',
    name: 'Thames Logic Systems Ltd',
    country: 'GB',
    currency: 'GBP',
    payment_method: 'LOCAL',
    swift_fee: 0.00, // Free UK Faster Payments
    bank_details: {
      sort_code: '200415',
      account_number: '74829104',
      bank_name: 'Barclays Bank London'
    },
    category: 'Cloud Infrastructure & API Hosting',
    verified: true,
    historical_invoices_count: 6,
    typical_spend_range: '£1,000 - £3,500'
  },
  {
    id: 'ven_shenzhen_04',
    name: 'Shenzhen MicroSensors Technology Co',
    country: 'CN',
    currency: 'USD',
    payment_method: 'SWIFT',
    swift_fee: 15.00,
    bank_details: {
      swift_code: 'BKCHCNBJ400',
      account_number: '77294012847',
      bank_name: 'Bank of China Shenzhen'
    },
    category: 'Sensor Hardware',
    verified: true,
    historical_invoices_count: 5,
    typical_spend_range: '$2,500 - $6,000'
  },
  {
    id: 'ven_pacific_05',
    name: 'Pacific Office Packaging Solutions',
    country: 'US',
    currency: 'USD',
    payment_method: 'LOCAL',
    swift_fee: 0.00,
    bank_details: {
      account_routing_type1: 'aba',
      routing_number: '026009593',
      account_number: '3349182051',
      bank_account_category: 'Checking',
      bank_name: 'Chase New York'
    },
    category: 'Cardboard & Packaging Supplies',
    verified: true,
    historical_invoices_count: 11,
    typical_spend_range: '$800 - $2,000'
  }
];

const INITIAL_INVOICES = [
  {
    id: 'inv_001',
    invoice_number: 'INV-2024-884',
    vendor_id: 'ven_bavaria_01',
    vendor_name: 'Bavaria Precision Tooling GmbH',
    amount: 4250.00,
    currency: 'EUR',
    issue_date: '2026-10-02',
    due_date: '2026-10-18', // Due in 3 days
    operational_criticality: 'CRITICAL',
    impact_description: 'Custom CNC aluminum tooling. Non-payment stops assembly line in 48h.',
    discount_terms: '2% 10 Net 30 (Expired)',
    payment_method: 'SWIFT',
    status: 'PENDING_APPROVAL',
    synthetic: true
  },
  {
    id: 'inv_002',
    invoice_number: 'APX-99410',
    vendor_id: 'ven_apex_02',
    vendor_name: 'Apex Logistics North America LLC',
    amount: 7850.00,
    currency: 'USD',
    issue_date: '2026-10-05',
    due_date: '2026-10-17', // Due in 2 days
    operational_criticality: 'CRITICAL',
    impact_description: 'Port customs clearance & container demurrage. Non-payment incurs $350/day demurrage penalties.',
    discount_terms: 'Net 15',
    payment_method: 'LOCAL',
    status: 'PENDING_APPROVAL',
    synthetic: true
  },
  {
    id: 'inv_003',
    invoice_number: 'TLS-4402',
    vendor_id: 'ven_thames_03',
    vendor_name: 'Thames Logic Systems Ltd',
    amount: 1950.00,
    currency: 'GBP',
    issue_date: '2026-09-28',
    due_date: '2026-10-22', // Due in 7 days
    operational_criticality: 'HIGH',
    impact_description: 'EU Production Kubernetes cluster hosting & multi-region database replication.',
    discount_terms: 'Net 30',
    payment_method: 'LOCAL',
    status: 'PENDING_APPROVAL',
    synthetic: true
  },
  {
    id: 'inv_004',
    invoice_number: 'SZ-2026-118',
    vendor_id: 'ven_shenzhen_04',
    vendor_name: 'Shenzhen MicroSensors Technology Co',
    amount: 3400.00,
    currency: 'USD',
    issue_date: '2026-10-01',
    due_date: '2026-10-25', // Due in 10 days
    operational_criticality: 'MEDIUM',
    impact_description: 'Batch 4 optical sensors for next quarter inventory buildup.',
    discount_terms: 'Net 30',
    payment_method: 'SWIFT',
    status: 'PENDING_APPROVAL',
    synthetic: true
  },
  {
    id: 'inv_005',
    invoice_number: 'PAC-8109',
    vendor_id: 'ven_pacific_05',
    vendor_name: 'Pacific Office Packaging Solutions',
    amount: 1250.00,
    currency: 'USD',
    issue_date: '2026-10-08',
    due_date: '2026-10-29', // Due in 14 days
    operational_criticality: 'LOW',
    impact_description: 'Routine cardboard boxes and branded mailers. 4 weeks buffer in warehouse.',
    discount_terms: 'Net 30',
    payment_method: 'LOCAL',
    status: 'PENDING_APPROVAL',
    synthetic: true
  }
];

// Duplicate invoice used in Scenario B
const DUPLICATE_CANDIDATE_INVOICE = {
  id: 'inv_001_dup',
  invoice_number: 'INV-2024-884B', // Subtle alteration typical of AP duplicate error / vendor re-bill
  vendor_id: 'ven_bavaria_01',
  vendor_name: 'Bavaria Precision Tooling GmbH',
  amount: 4250.00, // Identical amount
  currency: 'EUR',
  issue_date: '2026-10-04',
  due_date: '2026-10-19',
  operational_criticality: 'HIGH',
  impact_description: 'Automated re-billing duplicate submitted via alternate accounting email.',
  payment_method: 'SWIFT',
  status: 'PENDING_APPROVAL',
  synthetic: true
};

const EXPECTED_RECEIVABLES = [
  {
    id: 'rec_001',
    customer_name: 'Nordic Retail Group AS',
    expected_amount: 14500.00,
    currency: 'USD',
    expected_date: '2026-10-16',
    status: 'ON_TRACK',
    confidence: 'HIGH'
  },
  {
    id: 'rec_002',
    customer_name: 'Meridian Wholesale LLC',
    expected_amount: 9200.00,
    currency: 'USD',
    expected_date: '2026-10-21',
    status: 'ON_TRACK',
    confidence: 'MEDIUM'
  }
];

module.exports = {
  INITIAL_BALANCES,
  INDICATIVE_FX_RATES,
  INITIAL_VENDORS,
  INITIAL_INVOICES,
  DUPLICATE_CANDIDATE_INVOICE,
  EXPECTED_RECEIVABLES
};
