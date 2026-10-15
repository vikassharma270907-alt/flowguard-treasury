/**
 * The three sandbox tools exposed over MCP.
 *
 * These functions contain NO policy logic. Whether a call is allowed, held or
 * blocked is decided by ArmorIQ before the call ever reaches this file.
 */
import { recordMutation, findAccount, findOrder } from './sandbox-data.mjs';

export const TOOLS = [
  {
    name: 'lookup_order',
    description:
      'Look up a customer order by its id and return status, item list, total and refunded amount. Use for order status, delivery date and refund history questions.',
    inputSchema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'Order id, e.g. ORD-1001' },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'change_payout',
    description:
      'Change the bank destination where a payout account receives funds. Requires the payout account id and the new destination (IBAN or account number).',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'string', description: 'Payout account id, e.g. ACC-4471' },
        new_destination: { type: 'string', description: 'New bank destination (IBAN or account number)' },
      },
      required: ['account_id', 'new_destination'],
    },
  },
  {
    name: 'issue_refund',
    description:
      'Issue a refund against a delivered order. Requires the order id and the refund amount in the order currency. The amount may not exceed the order total minus what was already refunded.',
    inputSchema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'Order id, e.g. ORD-1001' },
        amount: { type: 'number', description: 'Refund amount in the order currency, e.g. 89.0' },
      },
      required: ['order_id', 'amount'],
    },
  },
];

function ok(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
}

/** Raised for bad input. Surfaces as an MCP tool error, not a JSON-RPC error. */
class ToolInputError extends Error {}

const handlers = {
  lookup_order(args = {}) {
    const order = findOrder(args.order_id);
    if (!order) throw new ToolInputError(`No sandbox order with id "${args.order_id}".`);
    return ok({
      found: true,
      order: {
        order_id: order.order_id,
        customer: order.customer,
        status: order.status,
        placed_on: order.placed_on,
        delivered_on: order.delivered_on,
        items: order.items,
        total: order.total,
        currency: order.currency,
        refunded: order.refunded,
        refundable: Number((order.total - order.refunded).toFixed(2)),
        payout_account_id: order.payout_account_id,
      },
    });
  },

  change_payout(args = {}) {
    const account = findAccount(args.account_id);
    if (!account) throw new ToolInputError(`No sandbox payout account with id "${args.account_id}".`);
    const destination = String(args.new_destination ?? '').trim();
    if (destination.length < 8) throw new ToolInputError('new_destination looks too short to be a valid bank destination.');

    const previous = account.destination;
    account.destination = destination;
    recordMutation({ tool: 'change_payout', account_id: account.account_id, from: previous, to: destination });
    return ok({
      changed: true,
      account_id: account.account_id,
      previous_destination: previous,
      new_destination: destination,
      effective: 'immediately (sandbox)',
    });
  },

  issue_refund(args = {}) {
    const order = findOrder(args.order_id);
    if (!order) throw new ToolInputError(`No sandbox order with id "${args.order_id}".`);
    const amount = Number(args.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new ToolInputError('amount must be a positive number.');
    const refundable = Number((order.total - order.refunded).toFixed(2));
    if (amount > refundable) {
      throw new ToolInputError(`Refund of ${amount} exceeds refundable balance ${refundable} for ${order.order_id}.`);
    }
    order.refunded = Number((order.refunded + amount).toFixed(2));
    const refundId = `RFD-${Date.now().toString(36).toUpperCase()}`;
    recordMutation({ tool: 'issue_refund', order_id: order.order_id, amount, refund_id: refundId });
    return ok({
      refund_id: refundId,
      order_id: order.order_id,
      amount,
      currency: order.currency,
      total_refunded: order.refunded,
      refundable_remaining: Number((order.total - order.refunded).toFixed(2)),
      status: 'refund_issued_sandbox',
    });
  },
};

/**
 * Run a tool. Returns an MCP `result` object, or throws for unknown tools.
 * Tool-level failures come back as `isError: true` content so the caller can
 * read the message instead of parsing a transport error.
 */
export function callTool(name, args) {
  const handler = handlers[name];
  if (!handler) {
    throw Object.assign(new Error(`Unknown tool "${name}".`), { code: -32602 });
  }
  try {
    return handler(args);
  } catch (err) {
    if (err instanceof ToolInputError) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }], isError: true };
    }
    throw err;
  }
}
