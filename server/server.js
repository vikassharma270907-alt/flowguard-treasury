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
const { flowguardMcpServer, FLOWGUARD_MCP_TOOLS, FLOWGUARD_APP_TOOLS } = require('./mcpServer');
const armorIqEnforcement = require('./armorIqEnforcement');
const { scanAllInvoices, inspectInvoice } = require('./duplicateDetector');
const { planPayments } = require('./rulesEngine');
const auditLedger = require('./auditLedger');
const authService = require('./authService');
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

// --- ArmorIQ Platform Authentication Endpoints (docs.armoriq.ai/platform/authentication) ---

// 1. Get current session (supports Bearer JWT token in Authorization header)
app.get('/api/auth/session', (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = authService.verifyAccessToken(token);
    if (verified && verified.valid) {
      return res.json({
        authenticated: true,
        user: verified.payload,
        session: verified.payload,
        tokenType: 'Bearer',
        expiresIn: Math.max(0, verified.payload.exp - Math.floor(Date.now() / 1000))
      });
    }
  }

  // Fallback to active server session
  if (currentUserSession) {
    return res.json({ authenticated: true, user: currentUserSession, session: currentUserSession });
  }

  res.json({ authenticated: false, user: null, session: null });
});

// 2. Email & Password Sign In (/platform/authentication/sign-in)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const result = authService.authenticateWithPassword(email, password);
  if (!result.success) {
    auditLedger.record({
      eventType: 'AUTH_FAILED',
      action: 'Password Sign-In Rejected',
      actor: email,
      summary: `Failed login attempt for ${email}: ${result.error}`
    });
    return res.status(401).json(result);
  }

  currentUserSession = result.user;

  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: 'ArmorIQ Local Sign-In',
    actor: result.user.name,
    summary: `Officer ${result.user.name} (${result.user.email}) signed in via ArmorIQ Password Authentication with role ${result.user.role}`,
    payload: { user: result.user, tokenLifetime: '15m' }
  });

  res.json(result);
});

// 3. Sign Up & 6-Digit OTP Verification (/platform/authentication/sign-up)
app.post('/api/auth/signup', (req, res) => {
  const { email, name, password, organization } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const result = authService.initiateSignUp(email, name, password, organization);
  if (!result.success) {
    return res.status(400).json(result);
  }

  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: 'Account Signup Initiated',
    actor: email,
    summary: `New account registered for ${email}. 6-digit verification OTP issued.`
  });

  res.json(result);
});

// 4. Verify OTP (/platform/authentication/sign-up)
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and 6-digit OTP code are required' });
  }

  const result = authService.verifyOtp(email, otp);
  if (!result.success) {
    return res.status(400).json(result);
  }

  currentUserSession = result.user;

  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: 'Account OTP Verified & Activated',
    actor: result.user.name,
    summary: `Email ${email} verified with OTP. Account activated under organization ${result.user.organization}.`
  });

  res.json(result);
});

// 5. Automatic Token Refresh (/platform/authentication/sessions)
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'Refresh token required' });
  }

  const result = authService.refreshSession(refreshToken);
  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json(result);
});

// 6. OAuth Sign In (Google / GitHub / ArmorIQ SSO)
app.post('/api/auth/oauth/login', (req, res) => {
  const { provider = 'Google Workspace OAuth', email = 'beyond_nothing@flowguard.io', name = 'beyond_nothing', avatar } = req.body || {};

  const result = authService.authenticateWithOAuth(provider, email, name, avatar);
  currentUserSession = result.user;

  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: `OAuth Sign-In via ${provider}`,
    actor: result.user.name,
    summary: `Admin authenticated via ${provider} with role ${result.user.role}`,
    payload: { user: result.user, provider }
  });

  res.json(result);
});

// 7. Google Identity Services (PKCE)
app.post('/api/auth/google', (req, res) => {
  const { email = 'beyond_nothing@flowguard.io', name, avatar } = req.body || {};
  const result = authService.authenticateWithOAuth('Google Identity Services (OAuth 2.0 PKCE)', email, name, avatar);
  currentUserSession = result.user;

  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: 'Google OAuth Real-Time Sign-In',
    actor: result.user.name,
    summary: `Verified Google identity for ${email} with role ${result.user.role}`,
    payload: { user: result.user, provider: 'Google Identity Services' }
  });

  res.json(result);
});

// 8. Device Approval Flow (/platform/authentication/device-approval)
app.post('/api/auth/device/request', (req, res) => {
  const { clientName } = req.body || {};
  const request = authService.createDeviceCodeRequest(clientName);
  res.json({ success: true, ...request });
});

app.post('/api/auth/device/approve', (req, res) => {
  const { userCode, apiKey } = req.body || {};
  const result = authService.approveDeviceCode(userCode, apiKey);

  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: 'Device Connection Approved',
    actor: currentUserSession ? currentUserSession.name : 'Authorized Officer',
    summary: `Approved device connection for user code "${userCode}". Bound to API key ${apiKey || 'production'}.`
  });

  res.json(result);
});

// 9. Sign Out
app.post('/api/auth/logout', (req, res) => {
  const prevUser = currentUserSession?.name || 'Admin';
  currentUserSession = null;
  auditLedger.record({
    eventType: 'AUTH_EVENT',
    action: 'Officer Signed Out',
    actor: prevUser,
    summary: 'ArmorIQ session terminated by user.'
  });
  res.json({ success: true, message: 'Logged out successfully' });
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
  // Real, process-derived values only — no placeholder metrics presented as live measurements.
  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
    armorIqMode: armorIqEnforcement.getClient() ? 'ARMORIQ_LIVE' : 'NOT_CONNECTED',
    verdictsRecorded: auditLedger.events.filter(e => e.eventType === 'POLICY_EVALUATION').length,
    auditEventsTotal: auditLedger.events.length,
    activeSecurityRules: 6,
    circuitBreakerTripped: securityEngine.circuitBreakerTripped
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
    callerContext,
    clientKey: req.ip
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
  const connected = !!armorIqEnforcement.getClient();
  res.json({
    name: 'flowguard-treasury-mcp',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    status: connected ? 'ONLINE' : 'NOT_CONNECTED',
    transport: ['stdio', 'http-jsonrpc', 'rest'],
    governedTools: FLOWGUARD_MCP_TOOLS.map((t) => t.name),
    appSideTools: FLOWGUARD_APP_TOOLS.map((t) => t.name),
    governance: {
      enforcedBy: 'ArmorIQ proxy — governed calls are routed through proxy.armoriq.ai before they reach this server',
      armorIqMode: connected ? 'ARMORIQ_LIVE' : 'NOT_CONFIGURED',
      note: 'This MCP server holds no policy logic. Direct calls are ungoverned and labelled as such.',
    },
    onboardingPlatformUrl: 'https://platform.armoriq.ai'
  });
});

app.get('/api/mcp/tools', (req, res) => {
  res.json({ tools: FLOWGUARD_MCP_TOOLS, appSideTools: FLOWGUARD_APP_TOOLS });
});

app.post('/api/mcp/execute', async (req, res) => {
  const { tool, name, arguments: toolArgs = {} } = req.body;
  const toolName = tool || name;
  try {
    const result = await flowguardMcpServer.executeTool(toolName, toolArgs);
    let payload = null;
    try {
      payload = JSON.parse(result.content?.[0]?.text ?? 'null');
    } catch {
      payload = result.content?.[0]?.text ?? null;
    }
    res.json({
      success: !result.isError,
      tool: toolName,
      direct: true,
      governed: false,
      note: 'Direct MCP execution — bypasses the ArmorIQ proxy by design and carries no ArmorIQ decision. Use the governed demo path to see ArmorIQ act.',
      result: payload,
      isError: !!result.isError
    });
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
            ARMORIQ_API_KEY: '<set ARMORIQ_API_KEY in your environment — never commit keys>'
          }
        }
      }
    },
    platformOnboarding: {
      serverName: 'flowguard-treasury-mcp',
      agentId: process.env.ARMORIQ_AGENT_ID || 'flowguard-agent',
      platformUrl: 'https://platform.armoriq.ai',
      supportedTools: FLOWGUARD_MCP_TOOLS.map(t => t.name),
      appSideTools: FLOWGUARD_APP_TOOLS.map(t => t.name)
    }
  });
});

// --- Model Context Protocol (MCP) Standard JSON-RPC 2.0 Handler (/mcp & /api/mcp) ---
// Compliant with MCP 2024-11-05 specification and docs.armoriq.ai cookbook requirements.
//
// POST /mcp answers with Server-Sent Events exactly as ArmorIQ's proxy expects
// (`event: message\ndata: {json}\n\n`, Content-Type: text/event-stream) — the
// same transport mcp-server/server.mjs serves for local/tunnel use.
// /api/mcp keeps plain JSON envelopes for the in-app admin panel.
const mcpSseFrame = (obj) => `event: message\ndata: ${JSON.stringify(obj)}\n\n`;

const buildMcpEnvelope = async (req) => {
  const { id, method, params = {} } = req.body || {};

  // JSON-RPC notifications (e.g. notifications/initialized) expect no response.
  if (typeof method === 'string' && method.startsWith('notifications/')) {
    return { notification: true };
  }
  if (method === 'ping') {
    return { body: { jsonrpc: '2.0', id: id ?? 1, result: {} } };
  }
  if (method === 'tools/list') {
    return { body: { jsonrpc: '2.0', id: id ?? 1, result: { tools: FLOWGUARD_MCP_TOOLS } } };
  }
  if (method === 'tools/call') {
    const toolName = params.name || params.tool;
    const toolArgs = params.arguments || params.args || {};
    try {
      const toolResult = await flowguardMcpServer.executeTool(toolName, toolArgs);
      return { body: { jsonrpc: '2.0', id: id ?? 1, result: toolResult } };
    } catch (err) {
      return { body: { jsonrpc: '2.0', id: id ?? 1, error: { code: err.code ?? -32000, message: err.message } } };
    }
  }
  if (method === 'initialize') {
    return {
      body: {
        jsonrpc: '2.0',
        id: id ?? 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'flowguard-treasury-mcp', version: '1.0.0' }
        }
      }
    };
  }
  return { body: { jsonrpc: '2.0', id: id ?? 1, error: { code: -32601, message: `Method not found: ${method}` } } };
};

const handleMcpRequest = (transport) => async (req, res) => {
  // Optional bearer auth: enforced whenever MCP_AUTH_TOKEN is configured.
  // The ArmorIQ platform registration sends this token (auth.type = bearer).
  const expectedToken = process.env.MCP_AUTH_TOKEN;
  if (expectedToken) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${expectedToken}`) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32001, message: 'Unauthorized: missing or invalid MCP bearer token.' }
      });
    }
  }

  const envelope = await buildMcpEnvelope(req);

  if (transport === 'sse') {
    if (envelope.notification) {
      return res.writeHead(202, { 'Content-Type': 'text/event-stream' }).end();
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    });
    return res.end(mcpSseFrame(envelope.body));
  }

  // JSON transport (/api/mcp) for in-app callers.
  if (envelope.notification) {
    return res.status(204).end();
  }
  return res.status(200).json(envelope.body);
};

app.post('/mcp', handleMcpRequest('sse'));
app.post('/api/mcp', handleMcpRequest('json'));

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
      ? 'ArmorIQ connected — tool calls will be gated through the platform.'
      : 'ArmorIQ NOT connected — expected key prefix ak_live_ / ak_test_ / ak_claw_. Tool calls return NOT_EXECUTED until a valid key is configured.'
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
    const notConnected = armorIqResult.policyStatus === 'ARMORIQ_NOT_CONNECTED';
    const appSideBlocked = armorIqResult.policyStatus === 'APP_SIDE_BLOCKED';
    return res.status(notConnected ? 503 : 403).json({
      error: notConnected ? 'ARMORIQ_NOT_CONNECTED' : appSideBlocked ? 'APP_SIDE_CHECK_BLOCKED' : 'ARMORIQ_POLICY_BLOCKED',
      message: notConnected
        ? armorIqResult.decision?.reason || 'ArmorIQ is not connected on this deployment, so the payout was not authorized. No decision was simulated.'
        : armorIqResult.decision?.violations?.[0]?.detail || 'Execution halted before any funds moved.',
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

// --- FlowGuard Guide PDF Endpoint with Strict Header Compliance ---
const fs = require('fs');
const path = require('path');
const distPath = path.join(__dirname, '../client/dist');

app.get('/docs/flowguard-guide.pdf', (req, res) => {
  const possiblePaths = [
    path.join(distPath, 'docs/flowguard-guide.pdf'),
    path.join(__dirname, '../client/public/docs/flowguard-guide.pdf'),
    path.join(__dirname, '../public/docs/flowguard-guide.pdf')
  ];
  const targetPath = possiblePaths.find(p => fs.existsSync(p));

  if (!targetPath) {
    return res.status(404).send('PDF Guide Not Found');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.sendFile(targetPath);
});

// --- Serve Frontend Client Build on Port 3001 ---
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
