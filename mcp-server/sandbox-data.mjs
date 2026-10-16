/**
 * ESM re-export of the shared sandbox data module (mcp-server/sandbox-data.cjs).
 * Kept so mcp-server/server.mjs keeps its original import path.
 */
export {
  ORDERS,
  PAYOUT_ACCOUNTS,
  MUTATIONS,
  recordMutation,
  findOrder,
  findAccount,
} from './sandbox-data.cjs';
