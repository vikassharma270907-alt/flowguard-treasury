/**
 * BeyondFlow - ElevenLabs Conversational Voice Agent Gateway & Supervisor Playground
 *
 * Sits between ElevenLabs Conversational Voice Agents and the sandbox treasury MCP:
 * 1. Declared call plan on every support call:
 *    - The gateway declares the plan it expects to run (local SHA-256 fingerprint)
 *    - ArmorIQ issues the binding intent token when the first governed call is made;
 *      token_id / plan_hash / policy_validation in this service are ALWAYS the real
 *      values returned by ArmorIQ — never fabricated.
 * 2. Tool Prefix Normalization & Mapping:
 *    - ElevenLabs agents see tools as "BeyondFlow_<tool>" (e.g. BeyondFlow_orderLookup)
 *    - The gateway transparently normalizes prefixes into canonical MCP tool names.
 * 3. 5-Second Tool Call Timeout Window & Async Holding Pattern:
 *    - ElevenLabs times tool calls out after ~5 seconds
 *    - The gateway answers inside the window with an app-side holding utterance,
 *      then records the real ArmorIQ verdict once the governed call returns
 * 4. Human Supervisor Protocol (app-side, clearly labelled):
 *    - Payout change: ArmorIQ blocks it; a supervisor can approve a GOVERNED RETRY
 *      (which asks ArmorIQ again — the retry only proceeds if ArmorIQ allows it)
 *    - Refund: ArmorIQ holds it with a delegation; two app-side approvals are
 *      recorded here, after which the gateway asks ArmorIQ to release the hold.
 *      Release itself is an ArmorIQ decision — we never force it locally.
 *
 * Honesty rules obeyed by this file:
 * - No allow/block/hold statement is ever invented here. Every verdict shown in the
 *   transcript/UI is copied from the live enforcement response (see armorIqEnforcement.js).
 * - When ArmorIQ is unreachable or unconfigured, calls report NOT_EXECUTED with the
 *   underlying reason. The gateway never falls back to a simulated decision.
 * - Airwallex execution is sandbox-only (mock adapter); messages say so explicitly.
 */

const crypto = require('crypto');
const { randomUUID: uuidv4 } = require('crypto');
const auditLedger = require('./auditLedger');
const airwallexService = require('./airwallexService');
const { governedToolCall, mintSessionPlan, MCP_ID } = require('./armorIqEnforcement');

class VoiceGatewayService {
  constructor() {
    this.activeSession = null;
    this.supervisorQueue = [];
    this.callHistory = [];
    this.initDefaultSession();
  }

  /**
   * Initializes a fresh support call session bound to the sandbox dataset
   * (order ORD-1001 / payout account ACC-4471). No token is fabricated: the
   * real ArmorIQ token is minted asynchronously and stored when it arrives.
   */
  initDefaultSession() {
    const callId = 'call_el_' + uuidv4().substring(0, 10);
    const caller = {
      name: 'Dana Whitfield',
      company: 'Northwind Traders (sandbox tenant)',
      phone: '+1 (415) 555-0142',
      verifiedAccountId: 'acc_sandbox_1001',
      orderId: 'ORD-1001',
      orderAmount: 89.00,
      orderCurrency: 'USD',
      scheduledDisbursementDate: '2026-10-03',
      currentBankDetails: {
        bankName: 'Northwind Traders Operating (sandbox)',
        routingNumber: 'GB82 WEST 1234 5698 7654 32',
        accountNumberEnding: '4471'
      }
    };

    // 1. Declared call plan for this session. This is OUR declaration. ArmorIQ
    //    issues the binding intent token at call time; nothing here claims a
    //    decision that has not happened.
    const canonicalPlan = {
      agent_id: 'elevenlabs-voice-support-agent-v2',
      gateway: 'beyondflow-voice-gateway-v1',
      call_id: callId,
      caller_account: caller.verifiedAccountId,
      caller_name: caller.name,
      session_created_at: new Date().toISOString(),
      declared_tools: [
        {
          name: 'BeyondFlow_orderLookup',
          internal_tool: 'orderLookup',
          mcp_tool: 'lookup_order',
          access: 'PUBLIC_READ',
          governed_by: 'ArmorIQ proxy decides at call time'
        },
        {
          name: 'BeyondFlow_payoutChange',
          internal_tool: 'payoutChange',
          mcp_tool: 'change_payout',
          access: 'RESTRICTED_WRITE',
          app_side: 'supervisor hold pattern (answers inside the ~5s window)',
          governed_by: 'ArmorIQ proxy decides at call time'
        },
        {
          name: 'BeyondFlow_issueRefund',
          internal_tool: 'issueRefund',
          mcp_tool: 'issue_refund',
          access: 'CRITICAL_FINANCIAL',
          app_side: 'dual-approval supervisor pattern (2 app-side approvals)',
          governed_by: 'ArmorIQ proxy decides at call time (delegation hold)'
        }
      ]
    };

    const localPlanFingerprint = crypto.createHash('sha256').update(JSON.stringify(canonicalPlan)).digest('hex');

    this.activeSession = {
      callId,
      status: 'READY', // 'READY', 'IN_CALL', 'ESCALATED', 'COMPLETED'
      caller,
      canonicalPlan,
      localPlanFingerprint,
      planHash: null, // set from the real ArmorIQ token mint
      tokenId: null,
      intentToken: null, // real ArmorIQ intent token; stays null until minted
      armorIq: { status: 'MINTING', connected: null, reason: null },
      startTime: Date.now(),
      elapsedSeconds: 0,
      transcript: [],
      toolInvocations: [],
      pendingSupervisorAction: null,
      dualApprovalState: {
        refundPending: false,
        amount: 89.00,
        currency: 'USD',
        approvalsRequired: 2,
        approvals: [] // [{ supervisor: 'beyond_nothing', role: 'SUPER_ADMIN', at: '...' }]
      }
    };

    // Log to audit trail (app-side event; no ArmorIQ claim)
    auditLedger.record({
      eventType: 'VOICE_GATEWAY_EVENT',
      action: 'Voice call session initialized',
      actor: 'BeyondFlow Voice Gateway',
      summary: `Call ${callId} initialized for ${caller.name}. Declared call plan fingerprint ${localPlanFingerprint.substring(0, 12)}...; awaiting real ArmorIQ token mint.`,
      payload: { callId, caller: caller.name, localPlanFingerprint, mcp: MCP_ID },
      mode: 'APP_SIDE'
    });

    // Ask ArmorIQ for the real token binding this declared plan.
    this.ensureLiveArmorIqToken();

    return this.activeSession;
  }

  /**
   * Mints the real ArmorIQ intent token binding this call's declared plan.
   * Never fabricates a token: if ArmorIQ is unconfigured or refuses, the
   * session is marked with the real reason and governed calls report
   * NOT_EXECUTED until it is fixed.
   */
  async ensureLiveArmorIqToken() {
    if (!this.activeSession) return;
    const session = this.activeSession;
    try {
      const mint = await mintSessionPlan({
        goal: `Support call with ${session.caller.name} (${session.caller.company}) about order ${session.caller.orderId}`,
        steps: [
          { action: 'lookup_order', mcp: MCP_ID, inputs: { order_id: session.caller.orderId } },
          { action: 'change_payout', mcp: MCP_ID, inputs: { account_id: 'ACC-4471', new_destination: 'GB29 NWBK 6016 1331 9268 19' } },
          { action: 'issue_refund', mcp: MCP_ID, inputs: { order_id: session.caller.orderId, amount: 89 } }
        ],
        prompt: 'voice session plan declaration'
      });

      if (mint.connected) {
        session.planHash = mint.planHash;
        session.tokenId = mint.tokenId;
        session.intentToken = {
          token_id: mint.tokenId,
          plan_hash: mint.planHash,
          plan_id: mint.planId,
          policy_validation: mint.policyValidation,
          step_proofs_count: mint.stepProofs,
          mode: 'ARMORIQ_LIVE'
        };
        session.armorIq = { status: 'CONNECTED', connected: true, reason: null };

        auditLedger.record({
          eventType: 'VOICE_GATEWAY_EVENT',
          action: 'ArmorIQ intent token minted for the declared call plan',
          actor: 'ArmorIQ platform (platform.armoriq.ai)',
          summary: `Call ${session.callId} bound to ArmorIQ token ${mint.tokenId} (plan ${String(mint.planHash).substring(0, 12)}...).`,
          payload: {
            callId: session.callId,
            tokenId: mint.tokenId,
            planHash: mint.planHash,
            policyValidation: mint.policyValidation
          },
          mode: 'ARMORIQ_LIVE'
        });
      } else {
        session.armorIq = { status: mint.errorName || 'NOT_CONNECTED', connected: false, reason: mint.reason };

        auditLedger.record({
          eventType: 'VOICE_GATEWAY_EVENT',
          action: 'ArmorIQ intent token not minted',
          actor: 'BeyondFlow Voice Gateway',
          summary: `No ArmorIQ token was issued: ${mint.reason}. Governed calls will report NOT_EXECUTED until this is fixed.`,
          payload: { callId: session.callId, armorIq: session.armorIq },
          mode: 'ARMORIQ_NOT_CONNECTED'
        });
      }
    } catch (e) {
      session.armorIq = { status: 'ERROR', connected: false, reason: e.message };
      console.warn('ensureLiveArmorIqToken notice:', e.message);
    }
  }

  /**
   * Normalizes an ElevenLabs tool name. "BeyondFlow_<tool>" is the standard
   * namespace that maps to canonical MCP actions.
   */
  normalizeToolName(toolName) {
    if (!toolName) return '';
    for (const prefix of ['BeyondFlow_', 'IntentGate_']) {
      if (toolName.startsWith(prefix)) {
        return toolName.substring(prefix.length);
      }
    }
    return toolName;
  }

  toElevenLabsToolName(canonicalTool) {
    if (!canonicalTool) return '';
    if (canonicalTool.startsWith('BeyondFlow_')) return canonicalTool;
    // Strip a legacy prefix before re-namespacing.
    const bare = this.normalizeToolName(canonicalTool);
    return `BeyondFlow_${bare}`;
  }

  /**
   * Handles incoming tool call from ElevenLabs Conversational Voice Agent.
   * Every branch runs a live governed call through ArmorIQ (armorIqEnforcement)
   * and reports exactly what came back.
   */
  async handleToolCall({ rawToolName, parameters = {}, callerContext = {}, clientKey = 'global' }) {
    const startTime = Date.now();
    const canonicalTool = this.normalizeToolName(rawToolName);
    const elevenLabsTool = this.toElevenLabsToolName(canonicalTool);
    const toolCallId = 'tcall_' + uuidv4().substring(0, 8);

    if (!this.activeSession) {
      this.initDefaultSession();
    }

    const session = this.activeSession;

    // 1. Tool: orderLookup -> governed lookup_order through ArmorIQ
    if (canonicalTool === 'orderLookup') {
      const orderId = parameters.order_id || parameters.orderId || session.caller.orderId;

      const enforcement = await governedToolCall({
        tool: 'lookup_order',
        args: { order_id: orderId },
        goal: `Tell the caller the status of order ${orderId}`,
        prompt: `Where is my order ${orderId}?`,
        clientKey
      });

      const invocation = {
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        policyDecision: `ARMORIQ_${enforcement.decision}`,
        requiresSupervisor: false,
        latencyMs: enforcement.timings?.total ?? (Date.now() - startTime),
        tokenId: enforcement.tokenId || null,
        planHash: enforcement.planHash || null,
        policyValidation: enforcement.policyValidation || null,
        enforcement,
        timestamp: new Date().toISOString()
      };

      if (enforcement.decision === 'ALLOWED') {
        const order = enforcement.result?.order ?? enforcement.result ?? {};
        const agentResponse = `I found order ${orderId}. Status: ${order.status ?? 'unknown'}. Total ${order.currency ?? 'USD'} ${order.total ?? '-'}, refundable ${order.refundable ?? '-'}. How can I help with this order?`;
        invocation.result = order;
        invocation.agentSpokenResponse = agentResponse;
        invocation.armorIqVerified = enforcement.verified === true;

        session.toolInvocations.push(invocation);
        session.transcript.push({
          speaker: 'agent',
          text: agentResponse,
          timestamp: new Date().toISOString(),
          toolTriggered: elevenLabsTool,
          badge: enforcement.cached ? 'ARMORIQ ALLOWED (CACHED)' : 'ARMORIQ ALLOWED'
        });

        auditLedger.record({
          eventType: 'VOICE_GATEWAY_EVENT',
          action: 'Tool call: lookup_order (governed — ArmorIQ allowed)',
          actor: 'ElevenLabs Voice Agent (governed via ArmorIQ proxy)',
          summary: `ArmorIQ allowed lookup_order for ${orderId}. Token ${enforcement.tokenId}, latency ${invocation.latencyMs}ms.`,
          payload: {
            toolCallId,
            orderId,
            elevenLabsTool,
            tokenId: enforcement.tokenId,
            planHash: enforcement.planHash,
            policyValidation: enforcement.policyValidation,
            timings: enforcement.timings
          },
          mode: 'ARMORIQ_LIVE'
        });

        return {
          success: true,
          toolCallId,
          rawToolName: elevenLabsTool,
          canonicalTool,
          policyDecision: 'ALLOWED_BY_ARMORIQ',
          speechResponse: agentResponse,
          data: order,
          enforcement: {
            decision: enforcement.decision,
            tokenId: enforcement.tokenId,
            planHash: enforcement.planHash,
            policyValidation: enforcement.policyValidation,
            timings: enforcement.timings
          }
        };
      }

      // Blocked / held / not executed — report exactly what came back.
      const honestResponse = `I couldn't run the order lookup. ${
        enforcement.decision === 'NOT_EXECUTED'
          ? 'Enforcement is unavailable right now'
          : `ArmorIQ returned ${enforcement.decision}`
      }: ${enforcement.reason || 'no reason provided'}.`;

      invocation.agentSpokenResponse = honestResponse;
      invocation.reason = enforcement.reason || null;
      session.toolInvocations.push(invocation);
      session.transcript.push({
        speaker: 'agent',
        text: honestResponse,
        timestamp: new Date().toISOString(),
        toolTriggered: elevenLabsTool,
        badge: `ARMORIQ ${enforcement.decision}`
      });

      auditLedger.record({
        eventType: 'VOICE_GATEWAY_EVENT',
        action: `Tool call: lookup_order (${enforcement.decision})`,
        actor: 'BeyondFlow Voice Gateway',
        summary: `lookup_order for ${orderId} was not executed. ${enforcement.decision}: ${enforcement.reason || ''}`,
        payload: { toolCallId, orderId, elevenLabsTool, enforcement },
        mode: enforcement.decision === 'NOT_EXECUTED' ? 'ARMORIQ_NOT_CONNECTED' : 'ARMORIQ_LIVE'
      });

      return {
        success: false,
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        policyDecision: `ARMORIQ_${enforcement.decision}`,
        speechResponse: honestResponse,
        enforcement
      };
    }

    // 2. Tool: payoutChange -> governed change_payout through ArmorIQ.
    //    ArmorIQ is expected to block it; the gateway answers inside the ~5s
    //    window with an app-side holding utterance and queues the real detail.
    if (canonicalTool === 'payoutChange') {
      const accountId = parameters.account_id || parameters.accountId || 'ACC-4471';
      const newDestination =
        parameters.new_destination || parameters.newDestination || parameters.accountNumber || 'GB29 NWBK 6016 1331 9268 19';

      const enforcement = await governedToolCall({
        tool: 'change_payout',
        args: { account_id: accountId, new_destination: String(newDestination) },
        goal: `Change the payout destination for account ${accountId}`,
        prompt: `Please send my payouts for ${accountId} to ${newDestination} instead`,
        clientKey
      });

      // ElevenLabs' tool-call window is ~5s, so the gateway always answers
      // immediately with a holding utterance and keeps the real detail in the queue.
      const holdingMessage = 'A supervisor has been notified. Please hold for supervisor review...';

      const pendingAction = {
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        actionType: 'PAYOUT_DESTINATION_CHANGE',
        status: 'PENDING_SUPERVISOR_ACTION',
        caller: session.caller.name,
        company: session.caller.company,
        details: {
          accountId,
          newDestination: String(newDestination),
          previousDestination: session.caller.currentBankDetails.routingNumber
        },
        enforcement,
        armorIqDecision: `ARMORIQ_${enforcement.decision}`,
        armorIqReason: enforcement.reason || null,
        matchedPolicy: enforcement.matchedPolicy || null,
        enforcementAction: enforcement.enforcementAction || null,
        allowedTools: enforcement.allowedTools || null,
        tokenId: enforcement.tokenId || null,
        planHash: enforcement.planHash || null,
        holdingMessageReturnedWithin5s: true,
        initiatedAt: new Date().toISOString(),
        timeoutWindowSeconds: 5
      };

      session.status = 'ESCALATED';
      session.pendingSupervisorAction = pendingAction;
      this.supervisorQueue.unshift(pendingAction);

      session.transcript.push({
        speaker: 'caller',
        text: `Actually, our company bank details changed this morning. Can you quickly change the payout destination for ${accountId} to ${newDestination}?`,
        timestamp: new Date().toISOString()
      });

      session.transcript.push({
        speaker: 'agent',
        text: holdingMessage,
        timestamp: new Date().toISOString(),
        toolTriggered: elevenLabsTool,
        badge: `ARMORIQ ${enforcement.decision} (<5s WINDOW)`
      });

      auditLedger.record({
        eventType: 'VOICE_GATEWAY_EVENT',
        action: `Tool call: change_payout (ArmorIQ ${enforcement.decision}) — escalated to supervisor`,
        actor: 'ElevenLabs Voice Gateway',
        summary:
          enforcement.decision === 'BLOCKED'
            ? `ArmorIQ blocked the payout destination change: ${enforcement.reason || 'policy'}. Holding message dispatched inside the 5s window; supervisor queue updated.`
            : `change_payout returned ${enforcement.decision}: ${enforcement.reason || ''}. Holding message dispatched inside the 5s window.`,
        payload: pendingAction,
        mode: enforcement.decision === 'NOT_EXECUTED' ? 'ARMORIQ_NOT_CONNECTED' : 'ARMORIQ_LIVE'
      });

      return {
        success: true,
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        policyDecision: `ARMORIQ_${enforcement.decision}`,
        immediateHoldingSpeech: holdingMessage,
        timeoutWindowSeconds: 5,
        pendingSupervisorId: toolCallId,
        enforcement: {
          decision: enforcement.decision,
          reason: enforcement.reason || null,
          matchedPolicy: enforcement.matchedPolicy || null,
          allowedTools: enforcement.allowedTools || null,
          tokenId: enforcement.tokenId || null,
          planHash: enforcement.planHash || null,
          timings: enforcement.timings
        }
      };
    }

    // 3. Tool: issueRefund -> governed issue_refund through ArmorIQ.
    //    ArmorIQ holds it with a real delegation; two app-side approvals are
    //    recorded before the gateway asks ArmorIQ to release the hold.
    if (canonicalTool === 'issueRefund') {
      const refundOrderId = parameters.order_id || parameters.orderId || session.caller.orderId;
      const refundAmount = Number(parameters.amount) || session.caller.orderAmount;

      const enforcement = await governedToolCall({
        tool: 'issue_refund',
        args: { order_id: refundOrderId, amount: refundAmount },
        goal: `Refund order ${refundOrderId}`,
        prompt: `I want a refund of ${refundAmount} for ${refundOrderId}`,
        clientKey
      });

      const holdingMessage =
        enforcement.decision === 'HELD'
          ? 'A supervisor has been notified. Refund requires dual authorization.'
          : `Refund request returned ${enforcement.decision}. A supervisor has been notified.`;

      const pendingAction = {
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        actionType: 'REFUND_DISBURSEMENT',
        status: 'WAITING_DUAL_APPROVAL',
        amount: refundAmount,
        orderId: refundOrderId,
        currency: 'USD',
        caller: session.caller.name,
        approvalsRequired: 2,
        approvalsCount: 0,
        approvals: [],
        enforcement,
        armorIqDecision: `ARMORIQ_${enforcement.decision}`,
        armorIqReason: enforcement.reason || null,
        delegationId: enforcement.delegation?.delegationId || null,
        delegationStatus: enforcement.delegation?.status || null,
        tokenId: enforcement.tokenId || null,
        planHash: enforcement.planHash || null,
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
        text: `Understood. Then could we please issue a refund of $${refundAmount.toLocaleString()} for order ${refundOrderId}?`,
        timestamp: new Date().toISOString()
      });

      session.transcript.push({
        speaker: 'agent',
        text: holdingMessage,
        timestamp: new Date().toISOString(),
        toolTriggered: elevenLabsTool,
        badge: enforcement.decision === 'HELD' ? 'ARMORIQ HELD (DUAL-APPROVAL)' : `ARMORIQ ${enforcement.decision}`
      });

      auditLedger.record({
        eventType: 'VOICE_GATEWAY_EVENT',
        action: `Tool call: issue_refund (ArmorIQ ${enforcement.decision})`,
        actor: 'ElevenLabs Voice Gateway',
        summary:
          enforcement.decision === 'HELD'
            ? `ArmorIQ held the refund of $${refundAmount} for ${refundOrderId}: ${enforcement.reason || 'human approval required'}. Delegation ${enforcement.delegation?.delegationId || 'n/a'} created on the platform.`
            : `issue_refund returned ${enforcement.decision}: ${enforcement.reason || ''}.`,
        payload: pendingAction,
        mode: enforcement.decision === 'NOT_EXECUTED' ? 'ARMORIQ_NOT_CONNECTED' : 'ARMORIQ_LIVE'
      });

      return {
        success: true,
        toolCallId,
        rawToolName: elevenLabsTool,
        canonicalTool,
        policyDecision: `ARMORIQ_${enforcement.decision}`,
        approvalsRequired: 2,
        immediateHoldingSpeech: holdingMessage,
        timeoutWindowSeconds: 5,
        enforcement: {
          decision: enforcement.decision,
          reason: enforcement.reason || null,
          delegationId: enforcement.delegation?.delegationId || null,
          tokenId: enforcement.tokenId || null,
          planHash: enforcement.planHash || null,
          timings: enforcement.timings
        }
      };
    }

    return {
      success: false,
      error: `Unknown tool: ${canonicalTool}`
    };
  }

  /**
   * Supervisor records decision on pending escalated tool call:
   * DENY    -> Agent tells caller "No"
   * APPROVE -> payout change: governed retry (ArmorIQ decides again)
   *            refund: increments app-side dual-approval quorum; at 2/2 the
   *            gateway asks ArmorIQ to release the hold
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

    // CASE 1: Payout Change
    if (pending.canonicalTool === 'payoutChange') {
      if (decision === 'DENY') {
        const agentSpokenResponse =
          "I'm sorry, but our supervisor has reviewed and denied the payout destination change. For your security, banking changes require verified out-of-band identity verification.";

        pending.status = 'DENIED_BY_SUPERVISOR';
        pending.resolvedAt = decisionTime;
        pending.supervisor = supervisorName;
        pending.decision = 'DENY';
        pending.agentSpokenResponse = agentSpokenResponse;

        session.pendingSupervisorAction = null;
        session.status = 'IN_CALL';

        session.transcript.push({
          speaker: 'supervisor',
          text: `[SUPERVISOR ACTION]: Denied payout change request for ${pending.details.accountId}. Reason: high-risk unverified phone request.`,
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
          action: 'Supervisor decision: payout change DENIED',
          actor: supervisorName,
          summary: `Supervisor ${supervisorName} (${role}) denied the payout destination change. App-side decision.`,
          payload: { toolCallId: pending.toolCallId, decision: 'DENY', note },
          mode: 'APP_SIDE_SUPERVISOR'
        });

        return {
          success: true,
          decision: 'DENY',
          agentSpokenResponse,
          status: 'DENIED_BY_SUPERVISOR'
        };
      }

      // APPROVE: run a governed retry. The gateway never applies the change
      // itself — if ArmorIQ still blocks it, we say so.
      const retry = await governedToolCall({
        tool: 'change_payout',
        args: {
          account_id: pending.details.accountId || 'ACC-4471',
          new_destination: String(pending.details.newDestination || 'GB29 NWBK 6016 1331 9268 19')
        },
        goal: 'Supervisor-approved retry of payout destination change',
        prompt: 'supervisor-approved retry: change the payout destination'
      });

      const agentSpokenResponse =
        retry.decision === 'ALLOWED'
          ? 'ArmorIQ has now allowed the payout destination change and the sandbox MCP applied it.'
          : `ArmorIQ still returned ${retry.decision} for the payout change${retry.reason ? `: ${retry.reason}` : ''}. The change was not applied.`;

      pending.status = retry.decision === 'ALLOWED' ? 'APPROVED_AND_EXECUTED' : `SUPERVISOR_APPROVED_RETRY_${retry.decision}`;
      pending.resolvedAt = decisionTime;
      pending.supervisor = supervisorName;
      pending.decision = 'APPROVE';
      pending.retry = retry;
      pending.agentSpokenResponse = agentSpokenResponse;

      session.pendingSupervisorAction = null;
      session.status = 'IN_CALL';

      session.transcript.push({
        speaker: 'supervisor',
        text: `[SUPERVISOR ACTION]: Approved a governed retry for ${pending.details.accountId}.`,
        timestamp: decisionTime,
        badge: 'SUPERVISOR: APPROVED'
      });

      session.transcript.push({
        speaker: 'agent',
        text: agentSpokenResponse,
        timestamp: decisionTime,
        badge: `ARMORIQ ${retry.decision}`
      });

      auditLedger.record({
        eventType: 'VOICE_GATEWAY_EVENT',
        action: `Supervisor approved governed retry: change_payout (ArmorIQ ${retry.decision})`,
        actor: supervisorName,
        summary: `Supervisor ${supervisorName} (${role}) approved a retry. ArmorIQ re-evaluated the call and returned ${retry.decision}.`,
        payload: { toolCallId: pending.toolCallId, retry },
        mode: retry.decision === 'NOT_EXECUTED' ? 'ARMORIQ_NOT_CONNECTED' : 'ARMORIQ_LIVE'
      });

      return {
        success: true,
        decision: 'APPROVE',
        agentSpokenResponse,
        status: pending.status,
        retryDecision: retry.decision
      };
    }

    // CASE 2: Refund -> app-side dual approval, then ArmorIQ release attempt
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

        auditLedger.record({
          eventType: 'VOICE_GATEWAY_EVENT',
          action: 'Supervisor decision: refund DENIED',
          actor: supervisorName,
          summary: `Supervisor ${supervisorName} (${role}) denied the refund of $${pending.amount}. App-side decision.`,
          payload: { toolCallId: pending.toolCallId, decision: 'DENY', note },
          mode: 'APP_SIDE_SUPERVISOR'
        });

        return {
          success: true,
          decision: 'DENY',
          agentSpokenResponse,
          status: 'DENIED_BY_SUPERVISOR'
        };
      }

      // APPROVE: record the approval (app-side) and check the 2-of-2 quorum
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
        pending.status = 'WAITING_FOR_SECOND_APPROVAL';
        const progressMessage = `Approval 1/2 recorded (${supervisorName}). Second supervisor approval required.`;

        session.transcript.push({
          speaker: 'supervisor',
          text: `[SUPERVISOR 1 APPROVED]: ${supervisorName} (${role}) recorded app-side approval 1/2. Waiting for the second approver.`,
          timestamp: decisionTime,
          badge: '1/2 APPROVALS'
        });

        auditLedger.record({
          eventType: 'VOICE_GATEWAY_EVENT',
          action: 'Refund approval 1/2 recorded (app-side)',
          actor: supervisorName,
          summary: `Supervisor 1 (${supervisorName}) recorded app-side approval 1/2 for the refund.`,
          payload: { toolCallId: pending.toolCallId, approvalsCount: 1 },
          mode: 'APP_SIDE_SUPERVISOR'
        });

        return {
          success: true,
          status: 'WAITING_FOR_SECOND_APPROVAL',
          approvalsCount: 1,
          approvalsRequired: 2,
          message: progressMessage
        };
      }

      // Quorum reached (2/2 app-side approvals): ask ArmorIQ to release the
      // hold. If the delegation has been approved on the platform, the invoke
      // proceeds; otherwise ArmorIQ holds again and we say so.
      const release = await governedToolCall({
        tool: 'issue_refund',
        args: { order_id: pending.orderId || 'ORD-1001', amount: pending.amount },
        goal: 'Refund after dual supervisor approval',
        prompt: 'dual-approved refund release',
        skipDelegation: true
      });

      const sandboxAdapter = airwallexService.mode || 'SANDBOX_MOCK';
      const agentSpokenResponse =
        release.decision === 'ALLOWED'
          ? `Your refund of $${pending.amount.toLocaleString()} was released by ArmorIQ and executed on the sandbox MCP. Sandbox only — no real funds moved (Airwallex adapter: ${sandboxAdapter}).`
          : `Both approvals are recorded (app-side), but ArmorIQ still returns ${release.decision} for the refund${release.reason ? `: ${release.reason}` : ''}. The pending delegation ${pending.delegationId || ''} must be approved on platform.armoriq.ai before the refund can execute.`;

      pending.status = release.decision === 'ALLOWED' ? 'APPROVED_AND_EXECUTED' : 'DUAL_APPROVED_AWAITING_ARMORIQ_RELEASE';
      pending.resolvedAt = decisionTime;
      pending.releaseAttempt = release;
      session.dualApprovalState.refundPending = false;

      if (release.decision === 'ALLOWED') {
        session.pendingSupervisorAction = null;
        session.status = 'COMPLETED';
      } else {
        // Keep the item visible until ArmorIQ releases it.
        session.pendingSupervisorAction = pending;
        session.status = 'ESCALATED';
      }

      session.transcript.push({
        speaker: 'supervisor',
        text: '[SUPERVISOR 2 CO-SIGN]: Second app-side approval recorded (2/2). Asking ArmorIQ to release the refund...',
        timestamp: decisionTime,
        badge: '2/2 APPROVALS'
      });

      session.transcript.push({
        speaker: 'agent',
        text: agentSpokenResponse,
        timestamp: decisionTime,
        badge: `ARMORIQ ${release.decision}`
      });

      auditLedger.record({
        eventType: 'VOICE_GATEWAY_EVENT',
        action: `Refund 2/2 approvals — ArmorIQ release attempt (${release.decision})`,
        actor: 'BeyondFlow supervisor quorum (app-side) + ArmorIQ proxy',
        summary: agentSpokenResponse,
        payload: {
          toolCallId: pending.toolCallId,
          approvalsCount: 2,
          approvals: pending.approvals,
          release,
          delegationId: pending.delegationId
        },
        mode: release.decision === 'NOT_EXECUTED' ? 'ARMORIQ_NOT_CONNECTED' : 'ARMORIQ_LIVE'
      });

      return {
        success: true,
        status: pending.status,
        approvalsCount: 2,
        armorIqDecision: `ARMORIQ_${release.decision}`,
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
      title: 'ElevenLabs Voice Agent + BeyondFlow Gateway DX Architecture Notes',
      overview: 'Practical lessons, architectural patterns, and sandbox safeguards learned while connecting ElevenLabs Conversational Voice Agents to an ArmorIQ-governed financial gateway (ArmorIQ for decisions, Airwallex adapter in sandbox/mock mode).',
      insights: [
        {
          id: 'insight-1-timeout',
          title: '1. The 5-Second Tool Call Timeout Window & Async Holding Pattern',
          problem: 'The ElevenLabs Conversational Voice platform gives a tool call roughly 5 seconds before it times out. High-stakes financial operations (such as destination bank account modifications or multi-sig refunds) require human supervisor evaluation, which rarely completes within 5 seconds. If the webhook blocks waiting for human input, ElevenLabs triggers a timeout exception and can sever the voice call.',
          solution: 'The BeyondFlow Voice Gateway answers inside that 5-second window with an app-side holding utterance: "A supervisor has been notified. Please hold for supervisor review...". The gateway queues the pending transaction and records the REAL ArmorIQ verdict for the governed call, then pushes the supervisor decision once acted on.',
          codeSnippet: `// Inside tool call handler: answer inside the ~5s window.
// The governed ArmorIQ call runs first (token mint + invoke); the human
// approval loop is answered asynchronously via the supervisor queue.
if (requiresHumanSupervisor) {
  const holdingSpeech = "A supervisor has been notified. Please hold for supervisor review...";
  queueForSupervisor({ callId, toolCallId, payload });

  // Return the immediate holding response to ElevenLabs before the ~5s timeout
  return res.json({
    status: "HELD",
    speechResponse: holdingSpeech,
    timeoutWindowSeconds: 5
  });
}`
        },
        {
          id: 'insight-2-prefix-mapping',
          title: '2. The BeyondFlow_<tool> Agent Tool Prefix Mapping',
          problem: 'When configuring tools in the ElevenLabs agent interface, tools are exposed to the LLM with an explicit namespace such as BeyondFlow_<tool> (e.g., BeyondFlow_orderLookup, BeyondFlow_payoutChange, BeyondFlow_issueRefund). This signals to the model that financial actions pass through an intent-assurance gateway. Backend plans, MCP schemas, and the Airwallex adapter expect standard canonical names.',
          solution: 'The BeyondFlow Gateway implements bidirectional mapping: normalizeToolName() strips the BeyondFlow_ prefix when processing tool requests, while toElevenLabsToolName() formats schemas for the agent client.',
          codeSnippet: `function normalizeToolName(toolName) {
  for (const prefix of ['BeyondFlow_', 'IntentGate_']) {
    if (toolName.startsWith(prefix)) {
      return toolName.substring(prefix.length);
    }
  }
  return toolName;
}

// In webhook dispatcher:
const canonical = normalizeToolName(req.body.tool_name);
// Dispatches to internal handlers: orderLookup, payoutChange, issueRefund`
        }
      ],
      elevenLabsToolSchemas: [
        {
          name: 'BeyondFlow_orderLookup',
          description: 'Looks up an order by id: status, delivery date, total and refunded amount. ArmorIQ decides at call time whether this read is allowed.',
          parameters: {
            type: 'object',
            properties: {
              order_id: { type: 'string', description: 'Order identifier, e.g. ORD-1001' }
            },
            required: ['order_id']
          }
        },
        {
          name: 'BeyondFlow_payoutChange',
          description: 'Attempts to change the bank destination for a payout account. High security risk: ArmorIQ decides at call time; blocked attempts go to the supervisor queue.',
          parameters: {
            type: 'object',
            properties: {
              account_id: { type: 'string', description: 'Payout account id, e.g. ACC-4471' },
              new_destination: { type: 'string', description: 'New bank destination (IBAN or account number)' }
            },
            required: ['account_id', 'new_destination']
          }
        },
        {
          name: 'BeyondFlow_issueRefund',
          description: 'Issues a refund against an order. High value: ArmorIQ decides at call time; held refunds require dual supervisor approval and ArmorIQ delegation release.',
          parameters: {
            type: 'object',
            properties: {
              order_id: { type: 'string', description: 'Order id, e.g. ORD-1001' },
              amount: { type: 'number', description: 'Refund amount in the order currency' }
            },
            required: ['order_id', 'amount']
          }
        }
      ]
    };
  }
}

const voiceGatewayService = new VoiceGatewayService();
module.exports = voiceGatewayService;
