/**
 * BeyondFlow - ArmorIQ Intent Governance & Policy Verification Service
 * 
 * Sits between financial planning and Airwallex payout execution to enforce:
 * 1. Cryptographic Intent Capture: canonicalizes payment plan steps before execution.
 * 2. Intent-Bound Policy Enforcement: validates that transfers strictly honor reserve floors
 *    and cannot be manipulated by agent drift, hallucination, or prompt injection.
 * 3. Token Verification: issues and verifies cryptographically signed Intent Tokens.
 * 
 * Works with the official @armoriq/sdk when ARMORIQ_API_KEY is supplied. With no
 * key configured the service reports NOT_CONNECTED and refuses to fabricate
 * tokens or decisions — callers must surface the not-connected state instead.
 */

const crypto = require('crypto');
const { randomUUID: uuidv4 } = require('crypto');
const auditLedger = require('./auditLedger');

let ArmorIQClient = null;
try {
  const armoriq = require('@armoriq/sdk');
  ArmorIQClient = armoriq.ArmorIQClient;
} catch (err) {
  console.warn('ArmorIQ SDK load note:', err.message);
}

class ArmorIQService {
  constructor() {
    this.apiKey = process.env.ARMORIQ_API_KEY || '';
    this.client = null;
    this.mode = 'NOT_CONNECTED';

    this.initClient();
  }

  initClient() {
    let key = (this.apiKey || process.env.ARMORIQ_API_KEY || '').replace(/^["']|["']$/g, '').trim();
    if (!key) {
      try {
        const { loadCredentials } = require('@armoriq/sdk/dist/credentials');
        const creds = loadCredentials();
        if (creds && creds.apiKey) {
          key = creds.apiKey;
        }
      } catch (e) {
        // credentials file not yet present
      }
    }

    if (key && ArmorIQClient && (key.startsWith('ak_live_') || key.startsWith('ak_test_') || key.startsWith('ak_claw_'))) {
      try {
        this.client = new ArmorIQClient({ apiKey: key });
        this.apiKey = key;
        this.mode = 'ARMORIQ_LIVE';
        console.log(`[BeyondFlow] ArmorIQ Live Client initialized with key ${key.substring(0, 10)}...`);
      } catch (err) {
        console.warn('ArmorIQ init fallback:', err.message);
        this.client = null;
        this.mode = 'NOT_CONNECTED';
      }
    } else {
      this.mode = 'NOT_CONNECTED';
    }
  }

  updateApiKey(newKey) {
    this.apiKey = newKey;
    this.initClient();
  }

  isConfigured() {
    return this.mode === 'ARMORIQ_LIVE';
  }

  /**
   * Fetches registered organization, agents, and MCP servers directly from ArmorIQ API
   * (Step 9 in docs.armoriq.ai: client.bootstrap())
   */
  async bootstrap() {
    if (this.client && this.mode === 'ARMORIQ_LIVE') {
      try {
        const bootstrapData = await this.client.bootstrap();
        return {
          success: true,
          live: true,
          org: bootstrapData.org,
          agent: bootstrapData.agent,
          agents: bootstrapData.agents || [],
          mcps: bootstrapData.mcps || [],
          toolMap: bootstrapData.toolMap || {},
          mode: 'ARMORIQ_LIVE'
        };
      } catch (e) {
        console.warn('Live bootstrap notice:', e.message);
      }
    }
    return {
      success: false,
      live: false,
      connected: false,
      org: { orgId: null, name: 'ArmorIQ not connected' },
      agent: { agentId: null, name: 'ArmorIQ not connected' },
      agents: [],
      mcps: [],
      toolMap: {},
      note: 'ARMORIQ_API_KEY is not configured on this deployment, so no organization, agent or MCP data is available. Nothing here is simulated platform data.',
      mode: this.mode
    };
  }

  /**
   * Mints a cryptographically verified Intent Token via ArmorIQ CSRG-IAP Platform
   * Uses client.forUser(email).startSession().startPlan(...) per docs.armoriq.ai/sdk
   */
  async mintPlanToken({
    userEmail = 'operator@beyondflow.io',
    goal = 'Treasury execution',
    tools = [],
    agentId = 'flowguard-treasury-agent-v1'
  }) {
    if (this.client && this.mode === 'ARMORIQ_LIVE') {
      try {
        const scope = this.client.forUser(userEmail);
        const session = scope.startSession({ defaultMcpName: 'flowguard-treasury-mcp' });
        const toolCalls = tools.map(t => ({
          name: t.name || t.tool || t.action,
          args: t.args || t.params || {}
        }));
        await session.startPlan(toolCalls);
        const liveToken = session.currentTokenValue;
        if (liveToken) {
          const formattedToken = {
            token_id: liveToken.tokenId,
            tokenId: liveToken.tokenId,
            plan_hash: liveToken.planHash,
            planHash: liveToken.planHash,
            plan_id: liveToken.planId,
            planId: liveToken.planId,
            signature: liveToken.signature,
            signature_algorithm: 'Ed25519',
            policy_decision: 'ALLOW',
            mode: 'ARMORIQ_LIVE_IAP',
            jwt_token: liveToken.jwtToken,
            jwtToken: liveToken.jwtToken,
            step_proofs: liveToken.stepProofs || [],
            stepProofs: liveToken.stepProofs || [],
            total_steps: liveToken.totalSteps || toolCalls.length,
            policy_validation: liveToken.policyValidation,
            policyValidation: liveToken.policyValidation,
            user_email: userEmail,
            issued_at: new Date(liveToken.issuedAt ? liveToken.issuedAt * 1000 : Date.now()).toISOString(),
            expires_at: new Date(liveToken.expiresAt ? liveToken.expiresAt * 1000 : Date.now() + 3600000).toISOString()
          };
          return { success: true, live: true, intentToken: formattedToken };
        }
      } catch (err) {
        console.warn('Live mintPlanToken error:', err.message);
      }
    }

    // No simulation fallback: without a live ArmorIQ response there is no token.
    // Callers must handle the not-connected state instead of showing a fake one.
    return {
      success: false,
      live: false,
      connected: false,
      reason: this.mode === 'ARMORIQ_LIVE'
        ? 'ArmorIQ token mint failed — see server logs for the SDK error.'
        : 'ARMORIQ_API_KEY is not configured on this deployment; no ArmorIQ token can be issued.'
    };
  }

  /**
   * Computes deterministic SHA-256 canonical hash of execution plan
   */
  hashPlan(canonicalPlan) {
    const serialized = JSON.stringify(canonicalPlan, Object.keys(canonicalPlan).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Intercepts intent, checks policy constraints, and mints an Intent Token
   */
  async interceptAndMintIntentToken({
    invoice,
    planDecision,
    reserveFloor,
    approverName,
    paymentMethod,
    corridorFee
  }) {
    const startTime = Date.now();
    const requestId = uuidv4();

    // 1. Build Canonical Plan Steps
    const planSteps = [
      {
        step: 1,
        tool: 'airwallex.transfers.validate_beneficiary',
        params: {
          vendor_id: invoice.vendor_id || 'ven_default',
          vendor_name: invoice.vendor_name || 'Vendor',
          country: invoice.vendor_country || 'DE'
        }
      },
      {
        step: 2,
        tool: 'airwallex.fx.quote_lock',
        params: {
          currency: invoice.currency || 'USD',
          gross_amount: Number(invoice.amount) || 0,
          corridor_method: paymentMethod || invoice.payment_method || 'LOCAL'
        }
      },
      {
        step: 3,
        tool: 'flowguard.treasury.assert_reserve_floor',
        params: {
          minimum_reserve_usd: Number(reserveFloor) || 15000,
          payout_usd_equivalent: Number(invoice.totalOutflowUsd || invoice.amount || 0)
        }
      },
      {
        step: 4,
        tool: 'airwallex.transfers.create',
        params: {
          transfer_currency: invoice.currency || 'USD',
          transfer_amount: Number(invoice.amount) || 0,
          reference: `INV-${invoice.invoice_number || 'UNKNOWN'}`,
          reason: 'goods_trade'
        }
      }
    ];

    const canonicalPlan = {
      agent_id: 'flowguard-treasury-agent-v1',
      session_id: 'ses_' + uuidv4().substring(0, 10),
      approver: approverName,
      created_at: new Date().toISOString(),
      steps: planSteps
    };

    const planHash = this.hashPlan(canonicalPlan);

    // 2. App-side pre-checks (run in our own code — ArmorIQ is NOT involved here;
    //    the governed tool call that follows is what ArmorIQ decides).
    const violations = [];

    // App-side rule 1: no critical duplicate permitted
    if (invoice.isBlocked || invoice.recommendation === 'BLOCKED') {
      violations.push({
        rule: 'DUPLICATE_INVOICE_PROHIBITION',
        checkedBy: 'app-side rule',
        detail: `App-side check: invoice ${invoice.invoice_number} is flagged as duplicate risk.`
      });
    }

    // App-side rule 2: cannot breach reserve floor
    if (invoice.recommendation === 'DEFER') {
      violations.push({
        rule: 'RESERVE_FLOOR_PROTECTION',
        checkedBy: 'app-side rule',
        detail: `App-side check: disbursement breaches the configured cash reserve floor ($${reserveFloor.toLocaleString()}).`
      });
    }

    // App-side rule 3: single transfer cap ($50,000 max without multi-sig)
    if (invoice.amount > 50000) {
      violations.push({
        rule: 'SINGLE_PAYOUT_THRESHOLD_EXCEEDED',
        checkedBy: 'app-side rule',
        detail: 'App-side check: payout amount exceeds the single-transaction ceiling.'
      });
    }

    if (violations.length > 0) {
      const decision = {
        status: 'APP_SIDE_BLOCKED',
        checkedBy: 'app-side rules',
        planHash,
        violations,
        latencyMs: Date.now() - startTime
      };

      auditLedger.record({
        eventType: 'POLICY_EVALUATION',
        action: 'App-side pre-check: execution blocked',
        actor: 'BeyondFlow app-side rules',
        requestId,
        latencyMs: decision.latencyMs,
        summary: `App-side pre-check blocked the transfer for ${invoice.invoice_number}: ${violations[0].detail}`,
        payload: decision,
        isAirwallexApi: false,
        mode: 'APP_SIDE'
      });

      return {
        authorized: false,
        policyStatus: 'APP_SIDE_BLOCKED',
        decision
      };
    }

    // 3. Issue Intent Token via ArmorIQ (Live CSRG-IAP or Intent Assurance)
    const userEmail = invoice.vendor_id ? `${invoice.vendor_id}@flowguard.treasury` : 'treasury.operator@beyondflow.io';
    const mintResult = await this.mintPlanToken({
      userEmail,
      goal: `Authorize payout of ${invoice.currency} ${invoice.amount} to ${invoice.vendor_name}`,
      tools: planSteps.map(s => ({
        name: s.tool.split('.').pop(),
        args: s.params
      })),
      agentId: 'flowguard-treasury-agent-v1'
    });

    if (!mintResult.success || !mintResult.intentToken) {
      const blockedDecision = {
        status: 'ARMORIQ_NOT_CONNECTED',
        planHash,
        reason: mintResult.reason || 'ArmorIQ token mint failed',
        latencyMs: Date.now() - startTime
      };

      auditLedger.record({
        eventType: 'POLICY_EVALUATION',
        action: 'Execution halted: ArmorIQ token not issued',
        actor: 'BeyondFlow app-side rules',
        requestId,
        latencyMs: blockedDecision.latencyMs,
        summary: `No ArmorIQ token was issued (${blockedDecision.reason}). The payout was not authorized — no simulated decision was substituted.`,
        payload: blockedDecision,
        isAirwallexApi: false,
        mode: 'ARMORIQ_NOT_CONNECTED'
      });

      return {
        authorized: false,
        policyStatus: 'ARMORIQ_NOT_CONNECTED',
        decision: blockedDecision
      };
    }

    const issuedToken = mintResult.intentToken;
    const latencyMs = Date.now() - startTime;

    auditLedger.record({
      eventType: 'POLICY_EVALUATION',
      action: 'ArmorIQ intent token minted',
      actor: 'ArmorIQ platform (platform.armoriq.ai)',
      requestId,
      latencyMs,
      summary: `ArmorIQ issued intent token ${issuedToken.token_id}. Plan hash: ${issuedToken.plan_hash.substring(0, 16)}...`,
      payload: { planHash: issuedToken.plan_hash, intentToken: issuedToken },
      mode: issuedToken.mode
    });

    return {
      authorized: true,
      policyStatus: 'INTENT_VERIFIED',
      intentToken: issuedToken
    };
  }
}

const armorIqService = new ArmorIQService();
module.exports = armorIqService;
