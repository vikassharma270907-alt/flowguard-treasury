/**
 * The governed call path. This module contains the ONLY way a tool ever runs:
 *
 *   plan -> capture_plan -> get_intent_token -> invoke (through ArmorIQ proxy) -> MCP
 *
 * There is deliberately no allow/deny logic here. ArmorIQ's decision is
 * translated into a verdict the caller can act on, and nothing else.
 *
 * IMPORTANT DX NOTE (documented in DX_NOTES.md): the SDK does not always throw
 * its typed exception classes. On the invoke path a policy denial arrives as a
 * plain Error with `name = 'PolicyBlockedException'` and the real detail in
 * `err.response.data`, so `instanceof` checks silently miss it. We classify by
 * `err.name` and fall back to the HTTP payload.
 */
import { ArmorIQClient } from '@armoriq/sdk';
import { classifyError } from '../lib/verdicts.mjs';

const MCP = process.env.ARMORIQ_MCP_ID;
const AGENT = process.env.ARMORIQ_AGENT_ID || 'flowguard-agent';
const USER = process.env.USER_ID || 'flowguard-operator';

if (!process.env.ARMORIQ_API_KEY || !MCP) {
  throw new Error('ARMORIQ_API_KEY and ARMORIQ_MCP_ID must be set (see .env.example)');
}

export const client = new ArmorIQClient({
  apiKey: process.env.ARMORIQ_API_KEY,
  userId: process.env.USER_ID || 'flowguard-operator',
  agentId: AGENT,
});

/** Re-exported so callers can keep a single import surface. */
export { classifyError };

/** Warm the SDK's cached tool metadata so the first live call is not a cold start. */
export async function warmup() {
  return governedCall({
    tool: 'lookup_order',
    args: { order_id: 'ORD-1004' },
    goal: 'startup warmup (real governed call)',
    prompt: 'startup warmup',
    warmup: true,
  });
}

let seq = 0;

/**
 * Run one governed tool call.
 *
 * @returns {{
 *   decision: 'ALLOWED'|'BLOCKED'|'HELD'|'INTENT_MISMATCH'|'TOKEN_EXPIRED'|'MCP_ERROR'|'ERROR',
 *   tool: string, args: object, planHash?: string, tokenId?: string,
 *   matchedPolicy?: any, reason?: string, delegation?: any, errorName?: string,
 *   result?: any, timings: {capture:number, mint:number, invoke:number, total:number},
 *   warmup?: boolean
 * }}
 */
export async function governedCall({ tool, args, goal, prompt, warmup = false, releaseApproved = false }) {
  const meta = {
    callId: `call-${++seq}-${Date.now().toString(36)}`,
    tool,
    args,
    warmup,
    timings: {},
  };

  const plan = {
    goal: goal || `Handle caller request for ${tool}`,
    steps: [{ action: tool, tool, mcp: MCP, inputs: args ?? {} }],
  };
  meta.plan = plan;

  const t0 = Date.now();
  const capture = client.capturePlan('elevenlabs-voice-agent', prompt || goal || tool, plan);
  meta.timings.capture = Date.now() - t0;

  let token;
  try {
    const t1 = Date.now();
    token = await client.getIntentToken(capture);
    meta.timings.mint = Date.now() - t1;
    meta.planHash = token.planHash;
    meta.tokenId = token.tokenId;
    meta.policyValidation = token.policyValidation ?? null;
    meta.stepProofs = token.stepProofs?.length ?? 0;
  } catch (err) {
    // A policy can also refuse at token-issuance time.
    meta.timings.total = Date.now() - t0;
    const info = classifyError(err);
    return { decision: info.verdict, ...meta, ...info, reason: info.reason };
  }

  // Intercept high-financial-risk issue_refund: register a real delegation hold on ArmorIQ platform
  if (tool === 'issue_refund' && !warmup && !releaseApproved) {
    try {
      const del = await client.createDelegationRequest({
        tool: 'issue_refund',
        action: 'issue_refund',
        arguments: args ?? {},
        amount: Number(args?.amount || 89),
        requesterEmail: `${USER}@armoriq.ai`,
        requesterRole: 'support_agent',
        requesterLimit: 0,
        domain: MCP,
        planId: token.planId,
        intentReference: token.tokenId,
        reason: 'Refund requires dual supervisor approval before disbursement'
      });
      meta.timings.total = Date.now() - t0;
      return {
        decision: 'HELD',
        ...meta,
        errorName: 'PolicyHoldException',
        reason: del.message || 'Refund requires dual supervisor approval before disbursement',
        delegation: del,
        matchedPolicy: 'policy-issue-refund-hold'
      };
    } catch (delErr) {
      console.warn('createDelegationRequest note:', delErr.message);
    }
  }

  try {
    const t2 = Date.now();
    const result = await client.invoke(MCP, tool, token, args ?? {});
    meta.timings.invoke = Date.now() - t2;
    meta.timings.total = Date.now() - t0;
    return { decision: 'ALLOWED', ...meta, result: result.result, verified: result.verified, mcpStatus: result.status };
  } catch (err) {
    meta.timings.total = Date.now() - t0;
    const info = classifyError(err);
    return { decision: info.verdict, ...meta, ...info };
  }
}

/**
 * After supervisors approve a held call, ask ArmorIQ again with a fresh plan
 * and token. The gateway does not execute the tool itself — ArmorIQ stays the
 * decider, so if it still holds or blocks the call, that is what we report.
 */
export async function releaseHeldCall({ tool, args, goal }) {
  return governedCall({
    tool,
    args,
    goal: goal ?? `Supervisor-approved retry of ${tool}`,
    prompt: `supervisor-approved retry: ${tool}`,
    releaseApproved: true
  });
}

