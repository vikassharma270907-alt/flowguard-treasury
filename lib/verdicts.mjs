/**
 * Verdict classification for ArmorIQ SDK errors.
 *
 * Why this exists (DX finding, see DX_NOTES.md): on the invoke path the SDK can
 * throw a plain `Error` whose `name` is set to the exception name but which is
 * NOT an instance of that exception class, and which carries no typed fields.
 * `instanceof` checks silently fall through. Always classify by `err.name`,
 * then pick up detail from the proxy's JSON body when present.
 */

/** Map an SDK error name onto the verdict vocabulary. */
export const VERDICT_BY_ERROR_NAME = {
  PolicyBlockedException: 'BLOCKED',
  PolicyHoldException: 'HELD',
  IntentMismatchException: 'INTENT_MISMATCH',
  TokenExpiredException: 'TOKEN_EXPIRED',
  RevokedTokenError: 'TOKEN_REVOKED',
  MCPInvocationException: 'MCP_ERROR',
  DelegationException: 'DELEGATION_ERROR',
  InvalidTokenException: 'BLOCKED',
};

/**
 * Normalise whatever the SDK threw into a verdict + structured detail.
 * @returns {{verdict:string,errorName:string,httpStatus:number|null,reason:string,message:string,
 *            enforcementAction:string|null,matchedPolicy:any,allowedTools:string[]|null,
 *            delegation:any,metadata:any}}
 */
export function classifyError(err) {
  const name = err?.name || err?.constructor?.name || 'Error';
  const data = err?.response?.data ?? {};
  const enforcement = data.enforcement ?? {};
  return {
    verdict: VERDICT_BY_ERROR_NAME[name] ?? 'ERROR',
    errorName: name,
    httpStatus: err?.response?.status ?? err?.statusCode ?? null,
    // Typed fields first (when the SDK does throw the real class), then the
    // HTTP payload the proxy actually sent.
    reason: err?.reason ?? data.reason ?? enforcement.reason ?? data.message ?? err?.message ?? name,
    message: err?.message ?? data.message ?? name,
    enforcementAction: err?.enforcementAction ?? data.enforcementAction ?? enforcement.action ?? null,
    matchedPolicy: err?.matchedPolicy ?? data.matchedPolicy ?? null,
    allowedTools: enforcement.allowedTools ?? null,
    delegation: err?.delegationContext ?? data.delegationContext ?? data.delegation ?? null,
    metadata: err?.metadata ?? data.metadata ?? null,
  };
}

/** The proxy's 403 body for a policy denial, in one line. */
export function explain(err) {
  const info = classifyError(err);
  const bits = [info.verdict, info.enforcementAction, info.reason].filter(Boolean);
  if (info.allowedTools) bits.push(`allowed=[${info.allowedTools.join(', ')}]`);
  return bits.join(' | ');
}
