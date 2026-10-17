/**
 * Audit store for the supervisor playground.
 *
 * Holds the recent call feed and the pending-approval queue in memory, and
 * appends every event to logs/audit.jsonl so the demo evidence survives a
 * restart. No decisions are made here — it only records what ArmorIQ returned.
 */
import fs from 'node:fs';
import path from 'node:path';

const LOG_DIR = process.env.LOG_DIR || 'logs';
fs.mkdirSync(LOG_DIR, { recursive: true });
const AUDIT_FILE = path.join(LOG_DIR, 'audit.jsonl');

/** Recent calls, newest first. Bounded so the playground stays light. */
export const calls = [];
const MAX_CALLS = 200;

/** Held calls awaiting supervisor approvals: id -> record. */
export const pending = new Map();

export function audit(event, detail = {}) {
  const line = { t: new Date().toISOString(), event, ...detail };
  try {
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(line) + '\n');
  } catch {
    // Logging must never break a governed call.
  }
}

export function recordCall(entry) {
  calls.unshift(entry);
  if (calls.length > MAX_CALLS) calls.pop();
  audit('call', entry);
}

export function recordHold(record) {
  pending.set(record.id, record);
  audit('hold.created', {
    id: record.id,
    tool: record.tool,
    args: record.args,
    planHash: record.planHash,
    requesterId: record.requesterId,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    who: record.requesterId || 'requester',
    when: new Date(record.createdAt).toISOString(),
    hash: record.planHash,
    outcome: 'HELD_AWAITING_SUPERVISORS',
    rule: 'BeyondFlow gateway rule'
  });
  return record;
}

export function recordApproval(id, approval) {
  const record = pending.get(id);
  if (!record) return null;
  record.approvals.push(approval);
  audit('hold.approval', {
    id,
    ...approval,
    count: record.approvals.length,
    required: record.requiredApprovals,
    who: approval.supervisor,
    when: new Date(approval.at || Date.now()).toISOString(),
    hash: record.planHash,
    outcome: approval.decision === 'approve' ? 'APPROVED' : 'DENIED',
    rule: 'BeyondFlow gateway rule'
  });
  return record;
}

export function recordRejection(id, { supervisor, reason, outcome }) {
  const record = pending.get(id);
  const hash = record?.planHash || null;
  audit('hold.rejection', {
    id,
    who: supervisor || 'supervisor',
    when: new Date().toISOString(),
    hash,
    outcome: outcome || 'REJECTED',
    reason,
    rule: 'BeyondFlow gateway rule'
  });
}

export function updateHold(id, patch) {
  const record = pending.get(id);
  if (!record) return null;
  Object.assign(record, patch);
  audit('hold.updated', {
    id,
    ...patch,
    hash: record.planHash,
    when: new Date().toISOString(),
    rule: 'BeyondFlow gateway rule'
  });
  return record;
}

export function listPending() {
  return [...pending.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function listRecentCalls(limit = 50) {
  return calls.slice(0, limit);
}

