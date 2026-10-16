/**
 * Synthetic sandbox data for the IntentGate MCP server. (CommonJS core —
 * consumed by server/mcpServer.js via require() and re-exported by
 * mcp-server/sandbox-data.mjs for the standalone ESM MCP server.)
 *
 * Everything here is invented. No real customers, orders, accounts or money.
 * Names are deliberately fictional ("Northwind Traders", "Acme Freight").
 */

const ORDERS = {
  'ORD-1001': {
    order_id: 'ORD-1001',
    customer: 'Dana Whitfield',
    customer_email: 'dana.whitfield@example.com',
    status: 'delivered',
    placed_on: '2026-09-28',
    delivered_on: '2026-10-03',
    items: [{ sku: 'SB-220', name: 'Studio Boom Arm', qty: 1, unit_price: 89.0 }],
    total: 89.0,
    currency: 'USD',
    refunded: 0.0,
    payout_account_id: 'ACC-4471',
  },
  'ORD-1002': {
    order_id: 'ORD-1002',
    customer: 'Marcus Lin',
    customer_email: 'marcus.lin@example.com',
    status: 'in_transit',
    placed_on: '2026-10-08',
    delivered_on: null,
    items: [{ sku: 'MX-410', name: 'Condenser Microphone', qty: 2, unit_price: 149.5 }],
    total: 299.0,
    currency: 'USD',
    refunded: 0.0,
    payout_account_id: 'ACC-4471',
  },
  'ORD-1003': {
    order_id: 'ORD-1003',
    customer: 'Priya Raman',
    customer_email: 'priya.raman@example.com',
    status: 'delivered',
    placed_on: '2026-09-12',
    delivered_on: '2026-09-18',
    items: [{ sku: 'HP-070', name: 'Monitor Headphones', qty: 1, unit_price: 210.0 }],
    total: 210.0,
    currency: 'USD',
    refunded: 0.0,
    payout_account_id: 'ACC-9002',
  },
  'ORD-1004': {
    order_id: 'ORD-1004',
    customer: 'Tomas Berg',
    customer_email: 'tomas.berg@example.com',
    status: 'delivered',
    placed_on: '2026-10-01',
    delivered_on: '2026-10-06',
    items: [{ sku: 'CBL-100', name: 'XLR Cable 5m', qty: 4, unit_price: 12.25 }],
    total: 49.0,
    currency: 'USD',
    refunded: 12.25,
    payout_account_id: 'ACC-4471',
  },
};

const PAYOUT_ACCOUNTS = {
  'ACC-4471': {
    account_id: 'ACC-4471',
    label: 'Northwind Traders - Operating (sandbox)',
    destination: 'GB82 WEST 1234 5698 7654 32',
    country: 'GB',
    is_default: true,
  },
  'ACC-9002': {
    account_id: 'ACC-9002',
    label: 'Northwind Traders - Reserve (sandbox)',
    destination: 'DE89 3704 0044 0532 0130 00',
    country: 'DE',
    is_default: false,
  },
};

/** Audit trail of state mutations the tools performed (sandbox-local only). */
const MUTATIONS = [];

function recordMutation(entry) {
  MUTATIONS.push({ at: new Date().toISOString(), ...entry });
}

function findOrder(orderId) {
  if (typeof orderId !== 'string') return null;
  return ORDERS[orderId.trim().toUpperCase()] ?? null;
}

function findAccount(accountId) {
  if (typeof accountId !== 'string') return null;
  return PAYOUT_ACCOUNTS[accountId.trim().toUpperCase()] ?? null;
}

module.exports = { ORDERS, PAYOUT_ACCOUNTS, MUTATIONS, recordMutation, findOrder, findAccount };
