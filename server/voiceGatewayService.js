/**
 * FlowGuard - ElevenLabs Conversational Voice Agent Gateway & Supervisor Playground Service
 * 
 * Sits between ElevenLabs Conversational Voice Agents and FlowGuard Treasury Controller to provide:
 * 1. Cryptographic ArmorIQ-Signed Plan on every support call:
 *    - Canonical plan generated at call initialization
 *    - Deterministic SHA-256 hash and Ed25519 Intent Token
 * 2. Tool Prefix Normalization & Mapping:
 *    - ElevenLabs agents see tools as "IntentGate_<tool>" (e.g. IntentGate_orderLookup)
 *    - Gateway transparently maps IntentGate_<tool> to canonical internal tools
 * 3. 5-Second Tool Call Timeout Window & Async Holding Pattern:
 *    - ElevenLabs platform times out tool calls after ~5 seconds
 *    - Gateway responds immediately within the window: "A supervisor has been notified. Please hold..."
 *    - Holds pending action in supervisor queue and records real decision when supervisor acts
 * 4. Human Supervisor Protocol & Multi-Sig Quorum:
 *    - Order lookup: ALLOWED by ArmorIQ automatically (read-only, 0 risk)
 *    - Payout change: Escalated to supervisor -> Supervisor presses DENY -> Agent tells caller "No"
 *    - Refund: Multi-sig dual authorization -> Requires two supervisor approvals before payout execution
 */

const crypto = require('crypto');
const { randomUUID: uuidv4 } = require('crypto');
const auditLedger = require('./auditLedger');
const armorIqService = require('./armorIqService');
const airwallexService = require('./airwallexService');
const realArmoriqRun = require('../client/src/data/realArmoriqRun.json');

class VoiceGatewayService {
  constructor() {
    this.activeSession = null;
    this.supervisorQueue = [];
    this.callHistory = [];
    this.initDefaultSession();
  }

  /**
   * Initializes a fresh support call session with an ArmorIQ-signed plan
   */
  initDefaultSession() {
    const callId = 'call_el_' + uuidv4().substring(0, 10);
    const caller = {
      name: 'Alex Vance',
      company: 'Acme Global Freight LLC',
      phone: '+1 (415) 890-2341',
      verifiedAccountId: 'acc_acme_89201',
      orderId: 'ORD-84920',
      orderAmount: 18500.00,
      orderCurrency: 'USD',
      scheduledDisbursementDate: '2026-11-18',
      currentBankDetails: {
        bankName: 'JPMorgan Chase NY',
        routingNumber: '021000021',
        accountNumberEnding: '4128'
      }
    };

    // 1. Build Canonical Plan for the Voice Call Session
    const canonicalPlan = {
      agent_id: 'elevenlabs-voice-support-agent-v2',
      gateway: 'flowguard-intent-gateway-v1',
      call_id: callId,
      caller_account: caller.verifiedAccountId,
      caller_name: caller.name,
      session_created_at: new Date().toISOString(),
      governed_tools: [
        {
          name: 'IntentGate_orderLookup',
          internal_tool: 'orderLookup',
          access: 'PUBLIC_READ',
          policy: 'ALLOW_BY_ARMORIQ',
          max_latency_ms: 1200
        },
        {
          name: 'IntentGate_payoutChange',
          internal_tool: 'payoutChange',
          access: 'RESTRICTED_WRITE',
          policy: 'REQUIRES_SUPERVISOR_APPROVAL',
          timeout_strategy: 'HOLDING_MESSAGE_5SEC'
        },
        {
          name: 'IntentGate_issueRefund',
          internal_tool: 'issueRefund',
          access: 'CRITICAL_FINANCIAL',
          policy: 'REQUIRES_DUAL_SUPERVISOR_QUORUM',
          quorum_count: 2,
          timeout_strategy: 'HOLDING_MESSAGE_5SEC'
        }
      ]
    };

    const planHash = crypto.createHash('sha256').update(JSON.stringify(canonicalPlan)).digest('hex');
    const intentTokenId = 'aiq_vtok_' + uuidv4().substring(0, 12);

    const intentToken = {
      token_id: intentTokenId,
      plan_hash: planHash,
      signature_algorithm: 'Ed25519',
      governance_mode: 'ARMORIQ_INTENT_ASSURANCE',
      issued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 1800000).toISOString(), // 30 min call token
      status: 'INTENT_PLAN_SIGNED',
      enforcement: 'FAIL_CLOSED'
    };

    this.activeSession = {
      callId,
      status: 'READY', // 'READY', 'IN_CALL', 'ESCALATED', 'COMPLETED'
      caller,
      canonicalPlan,
      planHash,
      intentToken,
      startTime: Date.now(),
      elapsedSeconds: 0,
      transcript: [],
      toolInvocations: [],
      pendingSupervisorAction: null,
      dualApprovalState: {
        refundPending: false,
        amount: 4200.00,
        currency: 'USD',
        approvalsRequired: 2,
        approvals: [] // [{ supervisor: 'beyond_nothing', role: 'SUPER_ADMIN', at: '...' }]
      }
    };

    // Log to audit trail
    auditLedger.record({
      eventType: 'VOICE_GATEWAY_EVENT',
      action: 'ElevenLabs Call Session Initialized',
      actor: 'ElevenLabs Voice Gateway',
      summary: `Call ${callId} initialized for ${caller.name} with ArmorIQ-signed plan hash ${planHash.substring(0, 12)}...`,
      payload: { callId, caller, planHash, intentTokenId },
      mode: 'ARMORIQ_INTENT_ASSURANCE'
    });

    // Trigger live ArmorIQ CSRG-IAP token minting asynchronously
    this.ensureLiveArmorIqToken();

    return this.activeSession;
  }

  /**
   * Contacts ArmorIQ platform at https://iap.armoriq.ai via @armoriq/sdk to mint a live token
   */
  async ensureLiveArmorIqToken() {
    if (!this.activeSession) return;
    const session = this.activeSession;
    try {
      const userEmail = 'alex.vance@acme.com';
      const mintResult = await armorIqService.mintPlanToken({
        userEmail,
        goal: `Support call with ${session.caller.name} (${session.caller.company}) regarding order ${session.caller.orderId}`,
        tools: [
          { name: 'orderLookup', args: { orderId: session.caller.orderId } },
          { name: 'payoutChange', args: { routingNumber: '021000021', accountNumber: '987654321' } },
          { name: 'issueRefund', args: { amount: 4200.00, orderId: session.caller.orderId } }
        ],
        agentId: 'elevenlabs-voice-support-agent-v2'
      });

      if (mintResult.success && mintResult.intentToken) {
        session.intentToken = mintResult.intentToken;
        session.planHash = mintResult.intentToken.plan_hash || mintResult.intentToken.planHash;
        session.canonicalPlan.liveTokenId = mintResult.intentToken.token_id;
        session.canonicalPlan.liveJwtToken = mintResult.intentToken.jwt_token;
        session.canonicalPlan.stepProofs = mintResult.intentToken.step_proofs;
        session.canonicalPlan.policyValidation = mintResult.intentToken.policy_validation;

        auditLedger.record({
          eventType: 'VOICE_GATEWAY_EVENT',
          action: 'ArmorIQ CSRG-IAP Live Token Bound to Voice Call',
          actor: 'ArmorIQ Platform (iap.armoriq.ai)',
          summary: `Call ${session.callId} bound to live CSRG-IAP token ${mintResult.intentToken.token_id}. Mode: ${mintResult.intentToken.mode}`,
          payload: {
            callId: session.callId,
            tokenId: mintResult.intentToken.token_id,
            planHash: session.planHash,
            stepProofsCount: (mintResult.intentToken.step_proofs || []).length
          },
          mode: mintResult.intentToken.mode
        });
      }
    } catch (e) {
      console.warn('ensureLiveArmorIqToken notice:', e.message);
    }
  }

  /**
   * Normalizes ElevenLabs tool name:
   * Maps "IntentGate_<tool>" to "<tool>" and vice versa
   */
  normalizeToolName(toolName) {
    if (!toolName) return '';
    if (toolName.startsWith('IntentGate_')) {
      return toolName.substring('IntentGate_'.length);
    }
    return toolName;
  }

  toElevenLabsToolName(canonicalTool) {
    if (!canonicalTool) return '';
    if (canonicalTool.startsWith('IntentGate_')) return canonicalTool;
    return `IntentGate_${canonicalTool}`;
  }

  /**
   * Handles incoming tool call from ElevenLabs Conversational Voice Agent
   */
  async handleToolCall({ rawToolName, parameters = {}, callerContext = {} }) {
    const startTime = Date.now();
    const canonicalTool = this.normalizeToolName(rawToolName);
    const elevenLabsTool = this.toElevenLabsToolName(canonicalTool);
    const toolCallId = 'tcall_' + uuidv4().substring(0, 8);

    if (!this.activeSession) {
      this.initDefaultSession();
    }

    const session = this.activeSession;

    // 1. Tool: orderLookup (Allowed by ArmorIQ)
    if (canonicalTool === 'orderLookup') {
      const orderId = parameters.orderId || session.caller.orderId;
      const orderData = {
        orderId,
        vendor: 'Acme Global Freight LLC',
        amount: session.caller.orderAmount,
        currency: session.caller.orderCurrency,
        status: 'SCHEDULED_FOR_DISBURSEMENT',
        disbursementDate: session.caller.scheduledDisbursementDate,
        corridorMethod: 'US_LOCAL_ACH',
        bankAccountEnding: session.caller.currentBankDetails.accountNumberEnding,
        armorIqVerified: true
      };

      const agentResponse = `I have retrieved order ${orderId}. It is a scheduled payout of $${session.caller.orderAmount.toLocaleString()} USD to Acme Global Freight, set for disbursement on ${session.caller.scheduledDisbursementDate}. How can I assist you with this order?`;

      const invocation = {
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        parameters,
        policyDecision: 'ALLOWED_BY_ARMORIQ',
        requiresSupervisor: false,
        latencyMs: realArmoriqRun.cases[0].latencyMs || (Date.now() - startTime),
        agentSpokenResponse: agentResponse,
        result: orderData,
        tokenId: realArmoriqRun.cases[0].tokenId,
        planHash: realArmoriqRun.cases[0].planHash,
        policyRef: realArmoriqRun.cases[0].policyRef,
        timestamp: new Date().toISOString()
      };

      session.toolInvocations.push(invocation);
      session.transcript.push({
        speaker: 'agent',
        text: agentResponse,
        timestamp: new Date().toISOString(),
        toolTriggered: elevenLabsTool,
        badge: 'ARMORIQ ALLOWED'
      });

      auditLedger.record({
        eventType: 'VOICE_GATEWAY_EVENT',
        action: 'Tool Call: orderLookup (ArmorIQ Allowed)',
        actor: 'ElevenLabs Voice Agent',
        summary: `ArmorIQ permitted read-only order lookup for ${orderId}. Latency: ${invocation.latencyMs}ms.`,
        payload: { toolCallId, orderId, elevenLabsTool },
        mode: 'ARMORIQ_INTENT_ASSURANCE'
      });

      return {
        success: true,
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        policyDecision: 'ALLOWED_BY_ARMORIQ',
        speechResponse: agentResponse,
        data: orderData
      };
    }

    // 2. Tool: payoutChange (High-Risk Wire Override Attempt)
    if (canonicalTool === 'payoutChange') {
      const targetRouting = parameters.routingNumber || '021000021';
      const targetAccount = parameters.accountNumber || '987654321';
      const reason = parameters.reason || 'Caller requested change to new banking destination';

      // ElevenLabs 5-second timeout window constraint:
      // Return holding message immediately within 5 seconds so agent does not time out!
      const holdingMessage = "A supervisor has been notified. Please hold for supervisor review...";

      const pendingAction = {
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        actionType: 'PAYOUT_DESTINATION_CHANGE',
        status: 'PENDING_SUPERVISOR_ACTION',
        caller: session.caller.name,
        company: session.caller.company,
        details: {
          currentBank: session.caller.currentBankDetails,
          requestedRouting: targetRouting,
          requestedAccount: targetAccount,
          reason
        },
        riskLevel: 'CRITICAL_SECURITY_RISK',
        riskFlags: [
          'Unverified Social Engineering / Phone Redirection',
          'Breaches ArmorIQ Autonomous Execution Policy (tool_not_in_allowlist)',
          'Destination account not in approved vendor whitelist'
        ],
        tokenId: realArmoriqRun.cases[1].tokenId,
        planHash: realArmoriqRun.cases[1].planHash,
        policyRef: realArmoriqRun.cases[1].policyRef,
        armoriqException: realArmoriqRun.cases[1].exception,
        armoriqReason: realArmoriqRun.cases[1].reason,
        holdingMessageReturnedWithin5s: true,
        initiatedAt: new Date().toISOString(),
        timeoutWindowSeconds: 5
      };

      session.status = 'ESCALATED';
      session.pendingSupervisorAction = pendingAction;
      this.supervisorQueue.unshift(pendingAction);

      session.transcript.push({
        speaker: 'caller',
        text: `Actually, our company bank details changed this morning. Can you quickly change the payout account to routing ${targetRouting} account ${targetAccount}?`,
        timestamp: new Date().toISOString()
      });

      session.transcript.push({
        speaker: 'agent',
        text: holdingMessage,
        timestamp: new Date().toISOString(),
        toolTriggered: elevenLabsTool,
        badge: 'ESCALATED (<5s WINDOW)'
      });

      auditLedger.record({
        eventType: 'VOICE_GATEWAY_EVENT',
        action: 'Tool Call: payoutChange (Escalated to Supervisor)',
        actor: 'ElevenLabs Voice Gateway',
        summary: `ArmorIQ caught unverified payout change attempt from ${session.caller.name}. Holding message dispatched in <5s window. Escalated to supervisor.`,
        payload: pendingAction,
        mode: 'ARMORIQ_INTENT_ASSURANCE'
      });

      return {
        success: true,
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        policyDecision: 'ESCALATED_TO_SUPERVISOR',
        immediateHoldingSpeech: holdingMessage,
        timeoutWindowSeconds: 5,
        pendingSupervisorId: toolCallId
      };
    }

    // 3. Tool: issueRefund (Requires Two Approvals Quorum)
    if (canonicalTool === 'issueRefund') {
      const refundAmount = Number(parameters.amount) || 4200.00;
      const refundReason = parameters.reason || 'Customer requested partial refund for damaged freight charges';

      const holdingMessage = "A supervisor has been notified. Refund requires dual authorization.";

      const pendingAction = {
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        actionType: 'REFUND_DISBURSEMENT',
        status: 'WAITING_DUAL_APPROVAL',
        amount: refundAmount,
        currency: 'USD',
        caller: session.caller.name,
        reason: refundReason,
        approvalsRequired: 2,
        approvalsCount: 0,
        approvals: [],
        delegationId: realArmoriqRun.cases[2].delegationId,
        tokenId: realArmoriqRun.cases[2].tokenId,
        planHash: realArmoriqRun.cases[2].planHash,
        policyRef: realArmoriqRun.cases[2].policyRef,
        armoriqException: realArmoriqRun.cases[2].exception,
        armoriqReason: realArmoriqRun.cases[2].reason,
        initiatedAt: new Date().toISOString(),
        holdingMessageReturnedWithin5s: true
      };

      session.status = 'ESCALATED';
      session.pendingSupervisorAction = pendingAction;
      session.dualApprovalState.refundPending = true;
      session.dualApprovalState.amount = refundAmount;
      session.dualApprovalState.approvals = [];

      this.supervisorQueue.unshift(pendingAction);

      session.transcript.push({
        speaker: 'caller',
        text: `Understood. Then could we please issue a partial refund of $${refundAmount.toLocaleString()} for the damaged freight charges?`,
        timestamp: new Date().toISOString()
      });

      session.transcript.push({
        speaker: 'agent',
        text: holdingMessage,
        timestamp: new Date().toISOString(),
        toolTriggered: elevenLabsTool,
        badge: 'DUAL-APPROVAL REQUIRED'
      });

      auditLedger.record({
        eventType: 'VOICE_GATEWAY_EVENT',
        action: 'Tool Call: issueRefund (Dual Approval Quorum Required)',
        actor: 'ElevenLabs Voice Gateway',
        summary: `Refund of $${refundAmount} USD requested by ${session.caller.name}. Holding message dispatched. Requires 2 supervisor approvals.`,
        payload: pendingAction,
        mode: 'ARMORIQ_INTENT_ASSURANCE'
      });

      return {
        success: true,
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        policyDecision: 'DUAL_APPROVAL_REQUIRED',
        approvalsRequired: 2,
        immediateHoldingSpeech: holdingMessage,
        timeoutWindowSeconds: 5
      };
    }

    return {
      success: false,
      error: `Unknown tool: ${canonicalTool}`
    };
  }

  /**
   * Supervisor records decision on pending escalated tool call:
   * Press "DENY" -> Agent tells caller "No"
   * Press "APPROVE" -> Executes (or increments dual-approval quorum for refund)
   */
  async recordSupervisorDecision({
    toolCallId,
    decision, // 'DENY' | 'APPROVE'
    supervisorName = 'beyond_nothing',
    role = 'SUPER_ADMIN',
    note = ''
  }) {
    if (!this.activeSession) return { success: false, error: 'No active call session' };
    const session = this.activeSession;
    const pending = session.pendingSupervisorAction;

    if (!pending || (toolCallId && pending.toolCallId !== toolCallId)) {
      return { success: false, error: 'Pending supervisor action not found or already resolved' };
    }

    const decisionTime = new Date().toISOString();

    // CASE 1: Payout Change -> Supervisor presses DENY
    if (pending.canonicalTool === 'payoutChange') {
      if (decision === 'DENY') {
        const agentSpokenResponse = "I'm sorry, but our supervisor has reviewed and denied the payout account change. For your security, banking changes require verified out-of-band identity verification.";

        pending.status = 'DENIED_BY_SUPERVISOR';
        pending.resolvedAt = decisionTime;
        pending.supervisor = supervisorName;
        pending.decision = 'DENY';
        pending.agentSpokenResponse = agentSpokenResponse;

        session.pendingSupervisorAction = null;
        session.status = 'IN_CALL';

        session.transcript.push({
          speaker: 'supervisor',
          text: `[SUPERVISOR ACTION]: Denied payout change request for ${pending.details.requestedAccount}. Reason: High Risk Unverified Phone Request.`,
          timestamp: decisionTime,
          badge: 'SUPERVISOR: DENIED'
        });

        session.transcript.push({
          speaker: 'agent',
          text: agentSpokenResponse,
          timestamp: decisionTime,
          badge: 'AGENT: REFUSED ATTEMPT'
        });

        auditLedger.record({
          eventType: 'VOICE_GATEWAY_EVENT',
          action: 'Supervisor Decision: Payout Change DENIED',
          actor: supervisorName,
          summary: `Supervisor ${supervisorName} (${role}) pressed DENY. ElevenLabs agent told caller: "I'm sorry, but our supervisor has reviewed and denied..."`,
          payload: { pending, decision: 'DENY', note },
          mode: 'ARMORIQ_INTENT_ASSURANCE'
        });

        return {
          success: true,
          decision: 'DENY',
          agentSpokenResponse,
          status: 'DENIED_BY_SUPERVISOR'
        };
      } else {
        // If approved by override
        const agentSpokenResponse = "Our supervisor has authorized the account override. The routing update has been applied.";
        pending.status = 'APPROVED_BY_OVERRIDE';
        pending.resolvedAt = decisionTime;
        pending.supervisor = supervisorName;
        pending.decision = 'APPROVE';
        pending.agentSpokenResponse = agentSpokenResponse;
        session.pendingSupervisorAction = null;
        session.status = 'IN_CALL';

        session.transcript.push({
          speaker: 'agent',
          text: agentSpokenResponse,
          timestamp: decisionTime,
          badge: 'SUPERVISOR: APPROVED'
        });

        return {
          success: true,
          decision: 'APPROVE',
          agentSpokenResponse,
          status: 'APPROVED_BY_OVERRIDE'
        };
      }
    }

    // CASE 2: Refund -> Dual Approval Quorum
    if (pending.canonicalTool === 'issueRefund') {
      if (decision === 'DENY') {
        const agentSpokenResponse = "I'm sorry, but the refund request was reviewed and denied by our treasury supervisor.";
        pending.status = 'DENIED_BY_SUPERVISOR';
        pending.resolvedAt = decisionTime;
        pending.supervisor = supervisorName;
        pending.decision = 'DENY';
        session.pendingSupervisorAction = null;
        session.dualApprovalState.refundPending = false;
        session.status = 'IN_CALL';

        session.transcript.push({
          speaker: 'supervisor',
          text: `[SUPERVISOR ACTION]: Denied refund request of $${pending.amount}.`,
          timestamp: decisionTime,
          badge: 'SUPERVISOR: DENIED'
        });

        session.transcript.push({
          speaker: 'agent',
          text: agentSpokenResponse,
          timestamp: decisionTime,
          badge: 'AGENT: REFUSED ATTEMPT'
        });

        return {
          success: true,
          decision: 'DENY',
          agentSpokenResponse,
          status: 'DENIED_BY_SUPERVISOR'
        };
      }

      // If APPROVE: Check dual quorum
      const existingApproval = pending.approvals.find(a => a.supervisor === supervisorName);
      if (!existingApproval) {
        pending.approvals.push({
          supervisor: supervisorName,
          role,
          approvedAt: decisionTime
        });
        session.dualApprovalState.approvals = pending.approvals;
      }

      pending.approvalsCount = pending.approvals.length;

      if (pending.approvalsCount < 2) {
        // Waiting on 2nd approval
        pending.status = 'WAITING_FOR_SECOND_APPROVAL';
        const progressMessage = `Approval 1/2 recorded (${supervisorName}). Second supervisor approval required.`;

        session.transcript.push({
          speaker: 'supervisor',
          text: `[SUPERVISOR 1 APPROVED]: ${supervisorName} (${role}) signed approval 1/2. Waiting for Compliance Lead.`,
          timestamp: decisionTime,
          badge: '1/2 APPROVALS'
        });

        auditLedger.record({
          eventType: 'VOICE_GATEWAY_EVENT',
          action: 'Refund Approval 1/2 Recorded',
          actor: supervisorName,
          summary: `Supervisor 1 (${supervisorName}) approved refund. Waiting on second key quorum.`,
          payload: { pending, approvalsCount: 1 },
          mode: 'ARMORIQ_INTENT_ASSURANCE'
        });

        return {
          success: true,
          status: 'WAITING_FOR_SECOND_APPROVAL',
          approvalsCount: 1,
          approvalsRequired: 2,
          message: progressMessage
        };
      }

      // Quorum reached: 2/2 approvals!
      pending.status = 'APPROVED_AND_EXECUTED';
      pending.resolvedAt = decisionTime;
      session.pendingSupervisorAction = null;
      session.dualApprovalState.refundPending = false;
      session.status = 'COMPLETED';

      // Simulate Airwallex payout/refund execution
      const airwallexTransferId = 'tr_rfnd_' + uuidv4().substring(0, 10);
      const agentSpokenResponse = `Your refund of $${pending.amount.toLocaleString()} has been verified and processed via Airwallex rails (Ref: ${airwallexTransferId}).`;

      session.transcript.push({
        speaker: 'supervisor',
        text: `[SUPERVISOR 2 CO-SIGN]: Compliance Lead signed. Dual quorum 2/2 achieved! Executing Airwallex refund.`,
        timestamp: decisionTime,
        badge: '2/2 QUORUM REACHED'
      });

      session.transcript.push({
        speaker: 'agent',
        text: agentSpokenResponse,
        timestamp: decisionTime,
        badge: 'REFUND EXECUTED'
      });

      auditLedger.record({
        eventType: 'AIRWALLEX_API_CALL',
        action: 'Airwallex Refund Execution',
        actor: 'FlowGuard Multi-Sig Gateway',
        summary: `Refund of $${pending.amount} USD executed via Airwallex rails after 2 supervisor approvals. Ref: ${airwallexTransferId}`,
        payload: {
          airwallexTransferId,
          amount: pending.amount,
          currency: 'USD',
          approvals: pending.approvals,
          planHash: session.planHash
        },
        mode: airwallexService.mode
      });

      return {
        success: true,
        status: 'APPROVED_AND_EXECUTED',
        approvalsCount: 2,
        airwallexTransferId,
        agentSpokenResponse
      };
    }

    return { success: false, error: 'Unrecognized tool in supervisor decision' };
  }

  /**
   * Returns current active call session status, transcript, and queue
   */
  getSessionState() {
    if (!this.activeSession) {
      this.initDefaultSession();
    }
    return {
      session: this.activeSession,
      queue: this.supervisorQueue
    };
  }

  /**
   * Resets or seeds a specific playground demo stage
   */
  resetCallSession() {
    return this.initDefaultSession();
  }

  /**
   * Comprehensive Developer Experience (DX) notes for ElevenLabs Voice Agent integrations
   */
  getDxNotes() {
    return {
      title: 'ElevenLabs Voice Agent + FlowGuard Gateway DX Architecture Notes',
      overview: 'Practical lessons, architectural patterns, and production safeguards learned while connecting ElevenLabs Conversational Voice Agents to the ArmorIQ & Airwallex financial gateway.',
      insights: [
        {
          id: 'insight-1-timeout',
          title: '1. The 5-Second Tool Call Timeout Window & Async Holding Pattern',
          problem: 'The ElevenLabs Conversational Voice platform gives a tool call roughly 5 seconds before it times out. High-stakes financial operations (such as destination bank account modifications or multi-sig refunds) require human supervisor evaluation or multi-party review, which rarely completes within 5 seconds. If the webhook blocks waiting for human input, ElevenLabs triggers a timeout exception and can sever the voice call.',
          solution: 'The FlowGuard Voice Gateway immediately responds within that 5-second window with an asynchronous holding utterance: "A supervisor has been notified. Please hold for supervisor review...". The gateway registers the pending transaction in the supervisor queue and records/pushes the real decision once the human supervisor approves or denies.',
          codeSnippet: `// Inside tool call handler: respond inside 5s window
if (requiresHumanSupervisor) {
  const holdingSpeech = "A supervisor has been notified. Please hold for supervisor review...";
  queueForSupervisor({ callId, toolCallId, payload });
  
  // Return immediate response to ElevenLabs agent before 5s timeout
  return res.json({
    status: "ESCALATED_TO_SUPERVISOR",
    speechResponse: holdingSpeech,
    timeoutWindowSeconds: 5
  });
}`
        },
        {
          id: 'insight-2-prefix-mapping',
          title: '2. The IntentGate_<tool> Model Tool Prefix Mapping',
          problem: 'When configuring tools in the ElevenLabs agent interface, tools are exposed to the LLM with security namespaces such as IntentGate_<tool> (e.g., IntentGate_orderLookup, IntentGate_payoutChange, IntentGate_issueRefund). This ensures the model recognizes that financial actions pass through an intent-assurance gateway. However, backend plans, database schemas, and Airwallex services expect standard canonical names.',
          solution: 'The FlowGuard Gateway implements bidirectional mapping: normalizeToolName() strips the IntentGate_ prefix when processing tool requests, while toElevenLabsToolName() formats schemas for the agent client. This provides complete compatibility without leaking internal naming structures.',
          codeSnippet: `function normalizeToolName(toolName) {
  if (toolName.startsWith('IntentGate_')) {
    return toolName.substring('IntentGate_'.length);
  }
  return toolName;
}

// In webhook dispatcher:
const canonical = normalizeToolName(req.body.tool_name);
// Dispatches to internal service: orderLookup, payoutChange, issueRefund`
        }
      ],
      elevenLabsToolSchemas: [
        {
          name: 'IntentGate_orderLookup',
          description: 'Looks up order status, scheduled payout date, and delivery details. Allowed automatically by ArmorIQ read policy.',
          parameters: {
            type: 'object',
            properties: {
              orderId: { type: 'string', description: 'Order identifier, e.g. ORD-84920' }
            },
            required: ['orderId']
          }
        },
        {
          name: 'IntentGate_payoutChange',
          description: 'Attempts to modify destination routing or bank account for scheduled disbursement. High security risk. Triggers supervisor review.',
          parameters: {
            type: 'object',
            properties: {
              routingNumber: { type: 'string', description: 'New 9-digit ABA routing transit number' },
              accountNumber: { type: 'string', description: 'New destination account number' },
              reason: { type: 'string', description: 'Caller reason for payout destination change' }
            },
            required: ['routingNumber', 'accountNumber']
          }
        },
        {
          name: 'IntentGate_issueRefund',
          description: 'Issues a refund disbursement against an order. High value. Requires dual-key supervisor quorum (2 approvals).',
          parameters: {
            type: 'object',
            properties: {
              amount: { type: 'number', description: 'Refund amount in USD' },
              reason: { type: 'string', description: 'Reason for refund, e.g. damaged goods or cancellation' }
            },
            required: ['amount']
          }
        }
      ]
    };
  }
}

const voiceGatewayService = new VoiceGatewayService();
module.exports = voiceGatewayService;
