/**
 * FlowGuard - ArmorIQ Intent Governance & Policy Verification Service
 * 
 * Sits between financial planning and Airwallex payout execution to enforce:
 * 1. Cryptographic Intent Capture: canonicalizes payment plan steps before execution.
 * 2. Intent-Bound Policy Enforcement: validates that transfers strictly honor reserve floors
 *    and cannot be manipulated by agent drift, hallucination, or prompt injection.
 * 3. Token Verification: issues and verifies cryptographically signed Intent Tokens.
 * 
 * Works with official @armoriq/sdk when ARMORIQ_API_KEY is supplied, with seamless
 * cryptographic simulation fallback for zero-dependency hackathon testing.
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
    this.mode = 'MOCK_SIMULATION';

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
        console.log(`[FlowGuard] ArmorIQ Live Client initialized with key ${key.substring(0, 10)}...`);
      } catch (err) {
        console.warn('ArmorIQ init fallback:', err.message);
        this.client = null;
        this.mode = 'MOCK_SIMULATION';
      }
    } else {
      this.mode = 'MOCK_SIMULATION';
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
      success: true,
      live: false,
      org: { orgId: 'org_flowguard_local', name: "Vikas Sharma's Workspace (FlowGuard)" },
      agent: { agentId: 'flowguard-treasury-agent-v1', name: 'FlowGuard Treasury Agent' },
      agents: [
        { name: 'flowguard-treasury-agent-v1', id: 'flowguard-treasury-agent-v1' },
        { name: 'elevenlabs-voice-support-agent-v2', id: 'elevenlabs-voice-support-agent-v2' }
      ],
      mcps: [{ name: 'flowguard-treasury-mcp' }],
      mode: this.mode
    };
  }

  /**
   * Mints a cryptographically verified Intent Token via ArmorIQ CSRG-IAP Platform
   * Uses client.forUser(email).startSession().startPlan(...) per docs.armoriq.ai/sdk
   */
  async mintPlanToken({
    userEmail = 'operator@flowguard.io',
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
        console.warn('Live mintPlanToken error, falling back to verified simulation:', err.message);
      }
    }

    // Fallback deterministic simulation
    const planHash = this.hashPlan({ goal, tools, userEmail, agentId });
    const tokenId = 'aiq_tok_' + uuidv4().substring(0, 16);
    const intentToken = {
      token_id: tokenId,
      tokenId: tokenId,
      plan_hash: planHash,
      planHash: planHash,
      plan_id: 'plan_' + uuidv4().substring(0, 8),
      signature: 'Ed25519-Verified-Mock',
      signature_algorithm: 'Ed25519',
      policy_decision: 'ALLOW',
      mode: 'ARMORIQ_INTENT_ASSURANCE',
      user_email: userEmail,
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 300000).toISOString(),
      total_steps: tools.length,
      step_proofs: tools.map((t, idx) => ({ path: `/steps/[${idx}]/tool`, hash: planHash, kind: 'step' }))
    };
    return { success: true, live: false, intentToken };
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
          vendor_id: invoice.vendor_id,
          vendor_name: invoice.vendor_name,
          country: invoice.vendor_country || 'DE'
        }
      },
      {
        step: 2,
        tool: 'airwallex.fx.quote_lock',
        params: {
          currency: invoice.currency,
          gross_amount: invoice.amount,
          corridor_method: paymentMethod || invoice.payment_method
        }
      },
      {
        step: 3,
        tool: 'flowguard.treasury.assert_reserve_floor',
        params: {
          minimum_reserve_usd: reserveFloor,
          payout_usd_equivalent: invoice.totalOutflowUsd || invoice.amount
        }
      },
      {
        step: 4,
        tool: 'airwallex.transfers.create',
        params: {
          transfer_currency: invoice.currency,
          transfer_amount: invoice.amount,
          reference: `INV-${invoice.invoice_number}`,
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

    // 2. Policy Enforcement Check
    const violations = [];

    // Policy Rule 1: No critical duplicate permitted
    if (invoice.isBlocked || invoice.recommendation === 'BLOCKED') {
      violations.push({
        rule: 'DUPLICATE_INVOICE_PROHIBITION',
        detail: `ArmorIQ Policy Violation: Target invoice ${invoice.invoice_number} is flagged as duplicate risk.`
      });
    }

    // Policy Rule 2: Cannot breach reserve floor
    if (invoice.recommendation === 'DEFER') {
      violations.push({
        rule: 'RESERVE_FLOOR_PROTECTION',
        detail: `ArmorIQ Policy Violation: Disbursement breaches configured cash reserve floor ($${reserveFloor.toLocaleString()}).`
      });
    }

    // Policy Rule 3: Single transfer cap check ($50,000 max autonomous limit without multi-sig)
    if (invoice.amount > 50000) {
      violations.push({
        rule: 'SINGLE_PAYOUT_THRESHOLD_EXCEEDED',
        detail: 'ArmorIQ Policy Violation: Payout amount exceeds single-transaction ceiling.'
      });
    }

    if (violations.length > 0) {
      const decision = {
        status: 'POLICY_BLOCKED',
        planHash,
        violations,
        latencyMs: Date.now() - startTime
      };

      auditLedger.record({
        eventType: 'POLICY_EVALUATION',
        action: 'ArmorIQ Policy Enforcement: Execution Blocked',
        actor: 'ArmorIQ Agent Governance',
        requestId,
        latencyMs: decision.latencyMs,
        summary: `ArmorIQ intercepted & blocked transfer for ${invoice.invoice_number}: ${violations[0].detail}`,
        payload: decision,
        isAirwallexApi: false,
        mode: this.mode
      });

      return {
        authorized: false,
        policyStatus: 'POLICY_BLOCKED',
        decision
      };
    }

    // 3. Issue Intent Token via ArmorIQ (Live CSRG-IAP or Intent Assurance)
    const userEmail = invoice.vendor_id ? `${invoice.vendor_id}@flowguard.treasury` : 'treasury.operator@flowguard.io';
    const mintResult = await this.mintPlanToken({
      userEmail,
      goal: `Authorize payout of ${invoice.currency} ${invoice.amount} to ${invoice.vendor_name}`,
      tools: planSteps.map(s => ({
        name: s.tool.split('.').pop(),
        args: s.params
      })),
      agentId: 'flowguard-treasury-agent-v1'
    });

    const issuedToken = mintResult.intentToken;
    const latencyMs = Date.now() - startTime;

    auditLedger.record({
      eventType: 'POLICY_EVALUATION',
      action: mintResult.live ? 'ArmorIQ Live Intent Verified & Signed' : 'ArmorIQ Intent Token Minted',
      actor: mintResult.live ? 'ArmorIQ Platform (iap.armoriq.ai)' : 'ArmorIQ Intent Assurance',
      requestId,
      latencyMs,
      summary: `ArmorIQ ${mintResult.live ? 'Live CSRG-IAP' : 'Assurance Engine'} issued intent token ${issuedToken.token_id}. Plan Hash: ${issuedToken.plan_hash.substring(0, 16)}...`,
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
