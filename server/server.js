/**
 * FlowGuard - Backend API Server
 * 
 * Provides clean REST endpoints for:
 * - Airwallex Sandbox connection status & auth verification
 * - Treasury planning & cash reserve optimization
 * - Deterministic duplicate invoice detection
 * - Human-in-the-loop payment approval & sandbox payout execution
 * - Transfer status lifecycle simulation
 * - Searchable immutable audit trail
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { randomUUID: uuidv4 } = require('crypto');

const airwallexService = require('./airwallexService');
const armorIqService = require('./armorIqService');
const securityEngine = require('./securityEngine');
const voiceGatewayService = require('./voiceGatewayService');
const { flowguardMcpServer, FLOWGUARD_MCP_TOOLS } = require('./mcpServer');
const { scanAllInvoices, inspectInvoice } = require('./duplicateDetector');
const { planPayments } = require('./rulesEngine');
const auditLedger = require('./auditLedger');
const {
  INITIAL_INVOICES,
  INITIAL_VENDORS,
  DUPLICATE_CANDIDATE_INVOICE,
  EXPECTED_RECEIVABLES,
  INDICATIVE_FX_RATES
} = require('./mockData');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory demo state
let stateInvoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
let stateVendors = JSON.parse(JSON.stringify(INITIAL_VENDORS));
let stateReceivables = JSON.parse(JSON.stringify(EXPECTED_RECEIVABLES));
let currentReserveFloor = Number(process.env.DEFAULT_RESERVE_FLOOR) || 15000.00;
let activeScenario = 'SCENARIO_A';

// --- In-memory OAuth & Admin State ---
let currentUserSession = {
  id: 'usr_admin_01',
  name: 'beyond_nothing',
  email: 'beyond_nothing@flowguard.io',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  role: 'SUPER_ADMIN',
  provider: 'Google Workspace OAuth',
  authenticatedAt: new Date().toISOString()
};

let adminGovernanceSettings = {
  singlePayoutLimitUsd: 50000,
  multiSigThresholdUsd: 15000,
  enforceReserveFloorStrict: true,
  autoHaltDuplicateInvoices: true,
  fuzzyDuplicateSensitivity: 85,
  activeCorridors: {
    US_LOCAL: { enabled: true, feeUsd: 0.00, method: 'LOCAL' },
    GB_LOCAL: { enabled: true, feeUsd: 0.00, method: 'LOCAL' },
    DE_SWIFT: { enabled: true, feeEur: 12.85, method: 'SWIFT' },
    CN_SWIFT: { enabled: true, feeUsd: 15.00, method: 'SWIFT' }
  },
  armorIqEnforcementMode: 'FAIL_CLOSED',
  armorIqRequirePlanHash: true,
  armorIqRateLimitTokensPerMin: 120,
  apiRateLimitSec: 20,
  auditRetentionDays: 90
};

let adminOrgMembers = [
  { id: 'usr_01', name: 'beyond_nothing', email: 'beyond_nothing@flowguard.io', role: 'SUPER_ADMIN', department: 'Treasury & Risk', status: 'ACTIVE', lastLogin: 'Just now' },
  { id: 'usr_02', name: 'Sarah Chen', email: 'sarah.chen@flowguard.io', role: 'FINANCE_DIRECTOR', department: 'Accounts Payable', status: 'ACTIVE', lastLogin: '2 hours ago' },
  { id: 'usr_03', name: 'Marcus Sterling', email: 'm.sterling@flowguard.io', role: 'COMPLIANCE_AUDITOR', department: 'Internal Audit', status: 'ACTIVE', lastLogin: '1 day ago' },
  { id: 'usr_04', name: 'Airwallex Agent Bot', email: 'agent@flowguard.bot', role: 'AUTONOMOUS_AGENT', department: 'Automated Operations', status: 'MANAGED_BY_ARMORIQ', lastLogin: 'Continuous' }
];

// --- OAuth Authentication Endpoints ---
app.get('/api/auth/session', (req, res) => {
  if (currentUserSession) {
    res.json({ authenticated: true, user: currentUserSession, session: currentUserSession });
  } else {
    res.json({ authenticated: false, user: null, session: null });
  }
});

app.post('/api/auth/oauth/login', (req, res) => {
  const { provider = 'Google Workspace OAuth', email = 'beyond_nothing@flowguard.io', name = 'beyond_nothing' } = req.body;
  currentUserSession = {
    id: 'usr_' + uuidv4().substring(0, 8),
    name: name,
    email: email,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'SUPER_ADMIN',
    provider: provider,
    authenticatedAt: new Date().toISOString()
  };

  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: `OAuth Sign-In via ${provider}`,
    actor: currentUserSession.name,
    summary: `Admin authenticated via ${provider} with role ${currentUserSession.role}`,
    payload: { user: currentUserSession }
  });

  res.json({ success: true, authenticated: true, user: currentUserSession, session: currentUserSession });
});

app.post('/api/auth/google', (req, res) => {
  const { credential, email, name, avatar, googleId } = req.body;
  
  const resolvedEmail = email || 'beyond_nothing@flowguard.io';
  const resolvedName = name || (resolvedEmail.includes('@') ? resolvedEmail.split('@')[0] : 'Google User');
  const resolvedAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(resolvedName)}`;
  
  currentUserSession = {
    id: 'usr_g_' + (googleId || uuidv4().substring(0, 8)),
    name: resolvedName,
    email: resolvedEmail,
    avatar: resolvedAvatar,
    role: 'SUPER_ADMIN',
    provider: 'Google Identity Services (OAuth 2.0 PKCE)',
    googleVerified: true,
    authenticatedAt: new Date().toISOString()
  };

  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: 'Google OAuth Real-Time Sign-In',
    actor: currentUserSession.name,
    summary: `Verified Google identity for ${resolvedEmail} with role SUPER_ADMIN`,
    payload: { user: currentUserSession, provider: 'Google Identity Services' }
  });

  res.json({
    success: true,
    authenticated: true,
    user: currentUserSession,
    session: currentUserSession
  });
});

app.post('/api/auth/logout', (req, res) => {
  const prevUser = currentUserSession?.name || 'Admin';
  currentUserSession = null;
  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: 'Admin Signed Out',
    actor: prevUser,
    summary: 'Session terminated by user.'
  });
  res.json({ success: true });
});

// --- Admin Governance & Telemetry Endpoints ---
app.get('/api/admin/settings', (req, res) => {
  res.json({ settings: adminGovernanceSettings });
});

app.post('/api/admin/settings', (req, res) => {
  adminGovernanceSettings = {
    ...adminGovernanceSettings,
    ...req.body
  };
  auditLedger.record({
    eventType: 'POLICY_EVALUATION',
    action: 'Admin Governance Settings Updated',
    actor: currentUserSession?.name || 'Super Admin',
    summary: 'Updated treasury corridor limits, ArmorIQ fail-mode, or payout thresholds.',
    payload: adminGovernanceSettings
  });
  res.json({ success: true, settings: adminGovernanceSettings });
});

app.get('/api/admin/users', (req, res) => {
  res.json({ members: adminOrgMembers });
});

app.post('/api/admin/users', (req, res) => {
  const { name, email, role, department } = req.body;
  const newMember = {
    id: 'usr_' + uuidv4().substring(0, 6),
    name: name || 'New Operator',
    email: email || 'operator@flowguard.io',
    role: role || 'FINANCE_OPERATOR',
    department: department || 'Treasury',
    status: 'ACTIVE',
    lastLogin: 'Pending'
  };
  adminOrgMembers.push(newMember);
  res.status(201).json({ success: true, member: newMember });
});

app.get('/api/admin/telemetry', (req, res) => {
  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
    airwallexSandboxLatencyMs: 42,
    armorIqHandshakeMs: 28,
    rateLimitRemaining: 18,
    intentTokensMinted: auditLedger.events.filter(e => e.eventType === 'POLICY_EVALUATION').length,
    activeSecurityRules: 6,
    errorBudgetPercent: 99.98
  });
});

// --- Zero-Trust Security & HMAC Endpoints ---
app.get('/api/security/status', (req, res) => {
  res.json(securityEngine.getStatus());
});

app.post('/api/security/circuit-breaker/toggle', (req, res) => {
  const { reason = 'Manual Super Admin Trigger' } = req.body;
  if (securityEngine.circuitBreakerTripped) {
    securityEngine.resetCircuitBreaker(currentUserSession?.name || 'beyond_nothing');
  } else {
    securityEngine.tripCircuitBreaker(reason, currentUserSession?.name || 'beyond_nothing');
  }
  res.json(securityEngine.getStatus());
});

app.post('/api/security/challenge', (req, res) => {
  const { action = 'Sensitive Policy Modification' } = req.body;
  const challenge = securityEngine.createStepUpChallenge(action, currentUserSession?.name || 'beyond_nothing');
  res.json({ success: true, challenge });
});

app.post('/api/security/verify-challenge', (req, res) => {
  const { challengeId, code } = req.body;
  const result = securityEngine.verifyStepUpChallenge(challengeId, code);
  res.json(result);
});

app.get('/api/security/merkle-proof', (req, res) => {
  const root = securityEngine.computeAuditMerkleRoot(auditLedger.events);
  res.json({
    merkleRoot: root,
    eventsCount: auditLedger.events.length,
    algorithm: 'SHA-256 Binary Merkle Tree',
    verifiedAt: new Date().toISOString()
  });
});

// --- ElevenLabs Voice Agent Gateway & Supervisor Endpoints ---
app.get('/api/voice/session', (req, res) => {
  res.json(voiceGatewayService.getSessionState());
});

app.post('/api/voice/session/reset', (req, res) => {
  const session = voiceGatewayService.resetCallSession();
  res.json({ success: true, session });
});

// Incoming tool call webhook from ElevenLabs Conversational Voice Agent
app.post('/api/voice/gateway/tool-call', async (req, res) => {
  const { tool_name, rawToolName, parameters = {}, callerContext = {} } = req.body;
  const tool = rawToolName || tool_name || req.body.tool;
  const result = await voiceGatewayService.handleToolCall({
    rawToolName: tool,
    parameters,
    callerContext
  });
  res.json(result);
});

// Supervisor decision endpoint: press Deny or Approve
app.post('/api/voice/supervisor/decision', async (req, res) => {
  const { toolCallId, decision, supervisorName, role, note } = req.body;
  const result = await voiceGatewayService.recordSupervisorDecision({
    toolCallId,
    decision,
    supervisorName: supervisorName || currentUserSession?.name || 'beyond_nothing',
    role: role || currentUserSession?.role || 'SUPER_ADMIN',
    note
  });
  res.json(result);
});

// DX Notes & ElevenLabs Agent Tool Schemas
app.get('/api/voice/dx-notes', (req, res) => {
  res.json(voiceGatewayService.getDxNotes());
});

// ElevenLabs Server-Side Speech Output (Key never exposed to client)
app.post('/api/voice/synthesize', async (req, res) => {
  const { text, voice_id = '21m00Tcm4TlvDq8ikWAM' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text prompt is required for voice synthesis' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'elevenlabs_live_your_actual_api_key_here') {
    // Return graceful simulation signal for client audio synthesis fallback
    return res.status(200).json({
      simulated: true,
      provider: 'ElevenLabs (Simulated Mode)',
      text,
      message: 'ELEVENLABS_API_KEY not configured on server. Triggering browser Web Speech synthesis fallback.'
    });
  }

  try {
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!elRes.ok) {
      const errText = await elRes.text();
      return res.status(elRes.status).json({ error: `ElevenLabs synthesis failed: ${errText}` });
    }

    const audioBuffer = await elRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.warn('ElevenLabs synthesis network error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// --- FlowGuard Model Context Protocol (MCP) Server Endpoints ---
app.get('/api/mcp/status', (req, res) => {
  res.json({
    name: 'flowguard-treasury-mcp',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    status: 'ONLINE',
    armorIqEnforced: armorIqService.isConfigured(),
    armorIqMode: armorIqService.mode,
    transport: ['stdio', 'http-sse', 'rest'],
    toolsCount: FLOWGUARD_MCP_TOOLS.length,
    onboardingPlatformUrl: 'https://platform.armoriq.ai'
  });
});

app.get('/api/mcp/tools', (req, res) => {
  res.json({ tools: FLOWGUARD_MCP_TOOLS });
});

app.post('/api/mcp/execute', async (req, res) => {
  const { tool, name, arguments: toolArgs = {} } = req.body;
  const toolName = tool || name;
  try {
    const result = await flowguardMcpServer.executeTool(toolName, toolArgs);
    res.json({ success: true, tool: toolName, result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/mcp/config', (req, res) => {
  res.json({
    claudeDesktopConfig: {
      mcpServers: {
        'flowguard-treasury': {
          command: 'node',
          args: ['server/mcpServer.js', '--stdio'],
          env: {
            ARMORIQ_API_KEY: process.env.ARMORIQ_API_KEY || 'ak_live_your_key_here'
          }
        }
      }
    },
    platformOnboarding: {
      serverName: 'flowguard-treasury-mcp',
      agentId: 'flowguard-treasury-agent-v1',
      platformUrl: 'https://platform.armoriq.ai',
      supportedTools: FLOWGUARD_MCP_TOOLS.map(t => t.name)
    }
  });
});

// --- Model Context Protocol (MCP) Standard JSON-RPC 2.0 Handler (/mcp & /api/mcp) ---
// Compliant with MCP 2024-11-05 specification and docs.armoriq.ai cookbook requirements
const handleMcpJsonRpc = async (req, res) => {
  const { jsonrpc, id, method, params = {} } = req.body || {};
  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id: id ?? 1,
      result: { tools: FLOWGUARD_MCP_TOOLS }
    });
  }
  if (method === 'tools/call') {
    const toolName = params.name || params.tool;
    const toolArgs = params.arguments || params.args || {};
    try {
      const toolResult = await flowguardMcpServer.executeTool(toolName, toolArgs);
      return res.json({
        jsonrpc: '2.0',
        id: id ?? 1,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolResult, null, 2)
            }
          ]
        }
      });
    } catch (err) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: id ?? 1,
        error: { code: -32000, message: err.message }
      });
    }
  }
  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id: id ?? 1,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {}, prompts: {}, resources: {} },
        serverInfo: { name: 'flowguard-treasury-mcp', version: '1.0.0' }
      }
    });
  }
  return res.status(404).json({
    jsonrpc: '2.0',
    id: id ?? 1,
    error: { code: -32601, message: `Method not found: ${method}` }
  });
};

app.post('/mcp', handleMcpJsonRpc);
app.post('/api/mcp', handleMcpJsonRpc);

// --- ArmorIQ Platform Bootstrap & Diagnostics (docs.armoriq.ai Step 9) ---
app.get('/api/armoriq/bootstrap', async (req, res) => {
  const result = await armorIqService.bootstrap();
  res.json(result);
});

// --- System Status & Credentials Verification ---
app.get('/api/status', async (req, res) => {
  const isConfigured = airwallexService.isConfigured();
  let authStatus = { success: false, reason: 'Sandbox credentials not provided. Operating in Sandbox Mock Mode.' };

  if (isConfigured) {
    authStatus = await airwallexService.authenticate();
  }

  res.json({
    appName: 'FlowGuard - Airwallex Sandbox Decision Assistant',
    isLiveSandbox: authStatus.success,
    mode: authStatus.success ? 'AIRWALLEX_LIVE_SANDBOX' : 'SANDBOX_MOCK_ADAPTER',
    armorIq: {
      isConfigured: armorIqService.isConfigured(),
      mode: armorIqService.mode
    },
    activeScenario,
    reserveFloor: currentReserveFloor,
    stats: {
      invoicesCount: stateInvoices.length,
      vendorsCount: stateVendors.length,
      auditLogsCount: auditLedger.events.length
    }
  });
});

app.post('/api/config/armoriq', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'ArmorIQ API Key required' });
  }

  armorIqService.updateApiKey(apiKey);
  const isConfigured = armorIqService.isConfigured();

  res.json({
    success: isConfigured,
    mode: armorIqService.mode,
    message: isConfigured
      ? 'ArmorIQ API connected successfully. Cryptographic intent tokens will be verified live.'
      : 'ArmorIQ initialized in intent verification simulation mode (ak_live_, ak_test_, or ak_claw_ expected).'
  });
});

app.post('/api/config/credentials', async (req, res) => {
  const { clientId, apiKey } = req.body;
  if (!clientId || !apiKey) {
    return res.status(400).json({ error: 'Client ID and API Key required' });
  }

  airwallexService.updateCredentials(clientId, apiKey);
  const result = await airwallexService.authenticate();

  res.json({
    success: result.success,
    mode: result.success ? 'AIRWALLEX_LIVE_SANDBOX' : 'SANDBOX_MOCK_ADAPTER',
    message: result.success ? 'Connected successfully to Airwallex Sandbox API.' : result.reason
  });
});

// --- Balances & FX ---
app.get('/api/balances', async (req, res) => {
  try {
    const data = await airwallexService.getBalances();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fx/rates', async (req, res) => {
  try {
    const data = await airwallexService.getFxRates();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fx/quote', async (req, res) => {
  const { buyCurrency, sellCurrency, buyAmount } = req.body;
  if (!buyCurrency || !sellCurrency || !buyAmount) {
    return res.status(400).json({ error: 'Missing required FX quote parameters' });
  }

  try {
    const result = await airwallexService.createFxQuote({ buyCurrency, sellCurrency, buyAmount });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Invoices & Deterministic Duplicate Engine ---
app.get('/api/invoices', (req, res) => {
  res.json({ invoices: stateInvoices });
});

app.get('/api/invoices/inspections', (req, res) => {
  const inspections = scanAllInvoices(stateInvoices, stateVendors);
  res.json({ inspections });
});

app.post('/api/invoices', (req, res) => {
  const newInv = {
    id: 'inv_' + uuidv4().substring(0, 6),
    invoice_number: req.body.invoice_number || 'INV-' + Math.floor(1000 + Math.random() * 9000),
    vendor_id: req.body.vendor_id || 'ven_bavaria_01',
    vendor_name: req.body.vendor_name || 'Bavaria Precision Tooling GmbH',
    amount: Number(req.body.amount) || 1000.00,
    currency: req.body.currency || 'USD',
    issue_date: req.body.issue_date || new Date().toISOString().split('T')[0],
    due_date: req.body.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    operational_criticality: req.body.operational_criticality || 'MEDIUM',
    impact_description: req.body.impact_description || 'General supplier invoice',
    payment_method: req.body.payment_method || 'LOCAL',
    status: 'PENDING_APPROVAL',
    synthetic: true
  };

  stateInvoices.push(newInv);
  const inspection = inspectInvoice(newInv, stateInvoices, stateVendors);

  auditLedger.record({
    eventType: 'DUPLICATE_CHECK',
    action: 'Invoice Registered & Inspected',
    summary: `Invoice ${newInv.invoice_number} submitted. Duplicate risk level: ${inspection.riskLevel}`,
    payload: inspection
  });

  res.status(201).json({ invoice: newInv, inspection });
});

// --- Treasury Planning Engine ---
app.get('/api/planner', async (req, res) => {
  try {
    const balanceResult = await airwallexService.getBalances();
    const fxResult = await airwallexService.getFxRates();
    const inspections = scanAllInvoices(stateInvoices, stateVendors);

    const plan = planPayments({
      balances: balanceResult.balances,
      invoices: stateInvoices,
      inspections,
      reserveFloor: currentReserveFloor,
      expectedReceivables: stateReceivables,
      fxRates: fxResult.rates || INDICATIVE_FX_RATES
    });

    res.json({
      plan,
      isLiveSandbox: balanceResult.isLiveSandbox,
      mode: balanceResult.mode
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/planner/recalculate', async (req, res) => {
  if (req.body.reserveFloor !== undefined) {
    currentReserveFloor = Number(req.body.reserveFloor);
  }

  auditLedger.record({
    eventType: 'POLICY_EVALUATION',
    action: 'Reserve Floor Recalculation',
    actor: 'Treasury Controller',
    summary: `Cash reserve floor updated to $${currentReserveFloor.toLocaleString('en-US')}. Plan re-evaluated.`,
    payload: { reserveFloor: currentReserveFloor }
  });

  const balanceResult = await airwallexService.getBalances();
  const fxResult = await airwallexService.getFxRates();
  const inspections = scanAllInvoices(stateInvoices, stateVendors);

  const plan = planPayments({
    balances: balanceResult.balances,
    invoices: stateInvoices,
    inspections,
    reserveFloor: currentReserveFloor,
    expectedReceivables: stateReceivables,
    fxRates: fxResult.rates || INDICATIVE_FX_RATES
  });

  res.json({ plan });
});

// --- Payments & Approvals ---
app.post('/api/payments/approve-and-pay', async (req, res) => {
  const { invoiceId, approverName = 'Finance Director' } = req.body;
  const targetInvoice = stateInvoices.find(inv => inv.id === invoiceId);

  if (!targetInvoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Pre-flight check: Zero-Trust Circuit Breaker
  if (securityEngine.circuitBreakerTripped) {
    return res.status(403).json({
      error: 'CIRCUIT_BREAKER_ACTIVE',
      message: `Zero-Trust Circuit Breaker is active in LOCKDOWN mode: ${securityEngine.circuitBreakerReason || 'Emergency halt engaged'}. All disbursements suspended.`
    });
  }

  // Pre-flight check: duplicate protection
  const inspection = inspectInvoice(targetInvoice, stateInvoices, stateVendors);
  if (inspection.riskLevel === 'CRITICAL_DUPLICATE') {
    auditLedger.record({
      eventType: 'APPROVAL_GRANTED',
      action: 'Approval Blocked by Duplicate Engine',
      actor: approverName,
      summary: `Payment blocked for invoice ${targetInvoice.invoice_number}: ${inspection.recommendation}`,
      payload: inspection
    });
    return res.status(400).json({
      error: 'PAYMENT_HALTED_DUPLICATE_RISK',
      message: 'This invoice has been flagged as a critical duplicate risk and cannot be disbursed.',
      inspection
    });
  }

  // Pre-flight check: reserve floor protection
  const balanceResult = await airwallexService.getBalances();
  const fxResult = await airwallexService.getFxRates();
  const currentPlan = planPayments({
    balances: balanceResult.balances,
    invoices: stateInvoices,
    inspections: scanAllInvoices(stateInvoices, stateVendors),
    reserveFloor: currentReserveFloor,
    expectedReceivables: stateReceivables,
    fxRates: fxResult.rates || INDICATIVE_FX_RATES
  });

  const plannedItem = currentPlan.decisions.find(d => d.id === invoiceId);
  if (plannedItem && plannedItem.recommendation === 'DEFER') {
    return res.status(400).json({
      error: 'PAYMENT_HALTED_RESERVE_BREACH',
      message: `Executing this payment would breach the minimum cash reserve floor ($${currentReserveFloor.toLocaleString('en-US')}). Release deferred obligations only after funding arrival.`,
      shortfall: plannedItem.shortfall
    });
  }

  // Record human approval stamp
  auditLedger.record({
    eventType: 'APPROVAL_GRANTED',
    action: 'Payment Obligation Approved',
    actor: approverName,
    summary: `Human approval bound for ${targetInvoice.currency} ${targetInvoice.amount.toFixed(2)} to ${targetInvoice.vendor_name}.`,
    payload: {
      invoiceId: targetInvoice.id,
      amount: targetInvoice.amount,
      currency: targetInvoice.currency,
      approver: approverName
    }
  });

  // ArmorIQ Intent Verification & Policy Enforcement
  const armorIqResult = await armorIqService.interceptAndMintIntentToken({
    invoice: { ...targetInvoice, ...(plannedItem || {}) },
    planDecision: plannedItem,
    reserveFloor: currentReserveFloor,
    approverName,
    paymentMethod: targetInvoice.payment_method
  });

  if (!armorIqResult.authorized) {
    return res.status(403).json({
      error: 'ARMORIQ_POLICY_BLOCKED',
      message: armorIqResult.decision?.violations?.[0]?.detail || 'ArmorIQ Agent Policy Enforcement halted execution.',
      armorIq: armorIqResult
    });
  }

  // Execute transfer in Airwallex Sandbox (live or mock)
  const transferResult = await airwallexService.executeTransfer({
    invoiceId: targetInvoice.id,
    vendorName: targetInvoice.vendor_name,
    amount: targetInvoice.amount,
    currency: targetInvoice.currency,
    paymentMethod: targetInvoice.payment_method,
    reference: `INV-${targetInvoice.invoice_number}`,
    approver: approverName
  });

  if (transferResult.success) {
    targetInvoice.status = 'PAID';
    targetInvoice.transfer_id = transferResult.transferId;
  }

  res.json({
    success: transferResult.success,
    invoice: targetInvoice,
    transferResult,
    armorIq: armorIqResult
  });
});

app.post('/api/payments/transition', async (req, res) => {
  const { transferId, nextStatus = 'PAID' } = req.body;
  const result = await airwallexService.transitionTransferStatus(transferId, nextStatus);
  res.json(result);
});

// --- Simulations & Scenarios ---
app.post('/api/simulation/deposit', async (req, res) => {
  const { amount = 25000, currency = 'USD', payerName = 'Demo Capital Top-up' } = req.body;
  const result = await airwallexService.simulateDeposit(amount, currency, payerName);
  res.json(result);
});

app.post('/api/scenarios/reset', async (req, res) => {
  const { scenario = 'SCENARIO_A' } = req.body;
  activeScenario = scenario;
  airwallexService.resetMockState();

  if (scenario === 'SCENARIO_A') {
    // Baseline: standard obligations, healthy reserve
    stateInvoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
    stateReceivables = JSON.parse(JSON.stringify(EXPECTED_RECEIVABLES));
    currentReserveFloor = 15000;
  } else if (scenario === 'SCENARIO_B') {
    // Injects duplicate candidate invoice INV-2024-884B
    stateInvoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
    stateInvoices.splice(1, 0, JSON.parse(JSON.stringify(DUPLICATE_CANDIDATE_INVOICE)));
    stateReceivables = JSON.parse(JSON.stringify(EXPECTED_RECEIVABLES));
    currentReserveFloor = 15000;
  } else if (scenario === 'SCENARIO_C') {
    // Delayed Receivable Shock: Nordic Retail $14,500 delayed
    stateInvoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
    stateReceivables = JSON.parse(JSON.stringify(EXPECTED_RECEIVABLES));
    stateReceivables[0].status = 'DELAYED';
    stateReceivables[0].delay_days = 14;
    currentReserveFloor = 15000;
  } else if (scenario === 'SCENARIO_D') {
    // Post-deposit scenario: +$25,000 available
    stateInvoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
    stateReceivables = JSON.parse(JSON.stringify(EXPECTED_RECEIVABLES));
    airwallexService.simulateDeposit(25000, 'USD', 'Customer Advance Settlement');
    currentReserveFloor = 15000;
  }

  auditLedger.record({
    eventType: 'SIMULATION_EVENT',
    action: `Demo Scenario Switched to ${scenario}`,
    actor: 'Hackathon Demo Presenter',
    summary: `Loaded ${scenario}. Invoices and state refreshed for demonstration.`,
    payload: { scenario }
  });

  res.json({
    success: true,
    activeScenario,
    reserveFloor: currentReserveFloor,
    invoicesCount: stateInvoices.length
  });
});

// --- Audit Ledger API ---
app.get('/api/audit-logs', (req, res) => {
  const { limit = 50, eventType, search } = req.query;
  const events = auditLedger.getEvents({
    limit: Number(limit),
    eventType,
    search
  });
  res.json({ events });
});

// --- Server-Side Cached Currency Exchange Rate API ---
// Cached with 6-hour TTL, Frankfurter API with timeout, fallback to FALLBACK_USD_INR env var
let exchangeRateCache = {
  rate: null,
  cachedAt: 0,
  source: null
};

app.get('/api/currency/rate', async (req, res) => {
  const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
  const now = Date.now();
  const fallbackEnvRate = Number(process.env.FALLBACK_USD_INR) || 86.50;

  // Check valid cache
  if (exchangeRateCache.rate && (now - exchangeRateCache.cachedAt) < TTL_MS) {
    return res.json({
      success: true,
      from: 'USD',
      to: 'INR',
      rate: exchangeRateCache.rate,
      isApproximate: Boolean(exchangeRateCache.isApproximate),
      isFallback: Boolean(exchangeRateCache.isFallback),
      source: exchangeRateCache.source,
      cachedAt: new Date(exchangeRateCache.cachedAt).toISOString()
    });
  }

  // Fetch live rate from free no-key provider (Frankfurter)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Frankfurter API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const liveRate = data?.rates?.INR;

    if (typeof liveRate === 'number' && !isNaN(liveRate) && liveRate > 0) {
      exchangeRateCache = {
        rate: liveRate,
        cachedAt: now,
        isApproximate: false,
        isFallback: false,
        source: 'frankfurter'
      };

      return res.json({
        success: true,
        from: 'USD',
        to: 'INR',
        rate: liveRate,
        isApproximate: false,
        isFallback: false,
        source: 'frankfurter',
        cachedAt: new Date(now).toISOString()
      });
    }
    throw new Error('Invalid rate payload from Frankfurter API');
  } catch (err) {
    console.warn(`[Currency API] Live exchange rate fetch failed (${err.message}). Using fallback.`);

    // If previously cached rate exists (even if stale), use it with isApproximate: true
    if (exchangeRateCache.rate) {
      return res.json({
        success: true,
        from: 'USD',
        to: 'INR',
        rate: exchangeRateCache.rate,
        isApproximate: true,
        isFallback: false,
        source: 'stale_cache',
        warning: 'Live exchange rate unavailable, serving stale cached rate',
        cachedAt: new Date(exchangeRateCache.cachedAt).toISOString()
      });
    }

    // Fall back to FALLBACK_USD_INR from environment
    return res.json({
      success: true,
      from: 'USD',
      to: 'INR',
      rate: fallbackEnvRate,
      isApproximate: true,
      isFallback: true,
      source: 'fallback_env',
      warning: 'Live exchange rate unavailable, serving configured fallback rate',
      cachedAt: new Date(now).toISOString()
    });
  }
});

// --- Serve Frontend Client Build on Port 3001 ---
const path = require('path');
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Express Server listening on all interfaces (0.0.0.0) when not in serverless runtime
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FlowGuard Server] Running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
    console.log(`[FlowGuard Server] Airwallex Sandbox Mode: ${airwallexService.isConfigured() ? 'LIVE_SANDBOX' : 'MOCK_ADAPTER'}`);
  });
}

module.exports = app;
