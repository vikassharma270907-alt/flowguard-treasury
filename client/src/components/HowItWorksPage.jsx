import React, { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  Terminal, Lock, Copy, Check,
  Cpu, Sparkles, Clock, FileText,
  Info, ChevronRight, PhoneCall
} from 'lucide-react';
import ExplainerVideoSection from './ExplainerVideoSection';
import { useTheme } from '../context/ThemeContext';

export default function HowItWorksPage({ onNavigate }) {
  const { isDark } = useTheme();
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const setupSteps = [
    {
      step: 1,
      title: "Create an ArmorIQ Account & Generate API Key",
      summary: "Sign up on platform.armoriq.ai and generate your developer API key.",
      command: "# Navigate to https://platform.armoriq.ai\n# Go to Settings -> API Keys -> Create New Key\n# Save your key: ak_live_...",
      expectedResult: "You receive an active API key (`ak_live_...`) with access to ArmorIQ Identity & Policy Assertion (IAP) and Proxy PEP endpoints."
    },
    {
      step: 2,
      title: "Onboard Agent & MCP Server on ArmorIQ",
      summary: "Register flowguard-agent and flowguard-treasury-mcp in your operator workspace.",
      command: "# Workspace: dd9e9695-e58d-4e56-8cff-ef9617ba4c54\n# Register Agent: flowguard-agent (UUID: c8bcbe51-dea4-4459-9fd8-38f88ebc714e)\n# Register MCP Server: flowguard-treasury-mcp (UUID: 7540cd0a-7d76-414a-a849-96b337a0c6ed)\n# Public Endpoint: https://flowguard-treasury.vercel.app/mcp",
      expectedResult: "Agent and MCP server records appear active in the ArmorIQ console with tool schemas discovered (`lookup_order`, `change_payout`, `issue_refund`)."
    },
    {
      step: 3,
      title: "Create the Three Governance Policies",
      summary: "Define deterministic rules for inquiry, bank diversion, and high-risk disbursements.",
      command: "# Policy Name: flowguard-treasury-allowlist (UUID: 23f8f304-0f6b-44a0-9bba-fa9886ca611b)\n# 1. ALLOW: lookup_order (read-only order queries)\n# 2. BLOCK: change_payout (unauthorized wire destination modifications)\n# 3. HOLD: issue_refund (multi-supervisor step-up quorum required)",
      expectedResult: "ArmorIQ stores policy rules binding allowed tools: `[\"lookup_order\", \"issue_refund\"]` and default policy action: `block`."
    },
    {
      step: 4,
      title: "Configure Environment & Start Local Services",
      summary: "Copy .env.example, configure environment variables, and launch the MCP server and gateway.",
      command: "cp .env.example .env\n# Populate ARMORIQ_API_KEY in .env (never commit secrets)\n\n# Terminal 1: Launch Governed MCP Server\nnpm run mcp:server\n\n# Terminal 2: Launch BeyondFlow Voice Gateway\nnpm run gateway",
      expectedResult: "MCP server starts listening on port 3001; Voice Gateway starts listening on port 3002 with registered tool endpoints."
    },
    {
      step: 5,
      title: "Configure ElevenLabs Conversational Voice Agent",
      summary: "Create agent in ElevenLabs dashboard and register webhook tools pointing to gateway.",
      command: "# ElevenLabs Agent Tools Configuration:\n# Tool 1: BeyondFlow_orderLookup   -> POST /tools/BeyondFlow_orderLookup\n# Tool 2: BeyondFlow_payoutChange  -> POST /tools/BeyondFlow_payoutChange\n# Tool 3: BeyondFlow_issueRefund   -> POST /tools/BeyondFlow_issueRefund\n# Tool 4: BeyondFlow_checkDecision -> POST /tools/BeyondFlow_checkDecision",
      expectedResult: "Spoken caller intents are extracted by ElevenLabs and dispatched as JSON webhooks to the BeyondFlow gateway."
    },
    {
      step: 6,
      title: "Execute Cryptographic Enforcement & Intent Tests",
      summary: "Run automated test scripts to verify live policy enforcement and intent token refusal.",
      command: "# Test 1: Live Policy Verification (Allowed, Blocked, Held)\nnode --env-file=.env scripts/test-enforcement.mjs\n\n# Test 2: Intent Mismatch & Token Swapping Refusal\nnode --env-file=.env scripts/test-intent-mismatch.mjs",
      expectedResult: "Terminal displays 3 live platform verdicts (`lookup_order` ALLOWED, `change_payout` BLOCKED, `issue_refund` HELD) and `IntentMismatchException` on token misuse."
    },
    {
      step: 7,
      title: "Simulate Call & Release Held Action via Dual Quorum",
      summary: "Make a simulated telephony call, observe hold, and approve in the supervisor playground.",
      command: "# Terminal 3: Simulate conversational refund request\nnode --env-file=.env scripts/simulate-call.mjs refund\n\n# Open Supervisor Playground in browser:\n# http://localhost:5173/#voice\n# Sign off with Supervisor 1, then Supervisor 2 (2/2 threshold)",
      expectedResult: "Supervisor 1 records approval 1/2 (`WAITING_FOR_SECOND_APPROVAL`). Supervisor 2 records approval 2/2 (`APPROVED_AND_EXECUTED`), releasing the held refund to the sandbox adapter."
    }
  ];

  return (
    <div className="content-container" style={{ paddingBottom: '80px', maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* Breadcrumb / Category Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', margin: '20px 0 16px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Sparkles size={16} />
          <span>Architecture & Step-by-Step Implementation Guide</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '4px 10px', borderRadius: '6px' }}>
          <Info size={13} />
          <span>Sandbox / test environment. No real funds or customer data.</span>
        </div>
      </div>

      {/* Main Page Title */}
      <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 14px 0' }}>
        BeyondFlow: how it works
      </h1>
      <p style={{ fontSize: '1.05rem', color: 'var(--muted-foreground)', maxWidth: '880px', lineHeight: 1.6, margin: '0 0 32px 0' }}>
        A complete guide explaining how ElevenLabs voice telephony and ArmorIQ cryptographic intent governance work together to enforce deterministic safety on autonomous treasury actions.
      </p>

      {/* TOP SECTION: 3-Minute Architectural Explainer Video Embed */}
      <ExplainerVideoSection />

      {/* SECTION 1: The Idea in 30 Seconds */}
      <section style={{ marginBottom: '48px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={18} color="#38bdf8" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
            The Idea in 30 Seconds
          </h2>
        </div>

        <p style={{ fontSize: '0.94rem', color: 'var(--muted-foreground)', maxWidth: '900px', lineHeight: 1.6, marginBottom: '20px' }}>
          Traditional AI safeguards attempt to inspect caller words using semantic filters or grant permanent API credentials to LLMs. BeyondFlow inverts this: the agent declares its full intended plan before execution. ArmorIQ evaluates the plan against registered policy rules and issues a single-use Ed25519 Intent Token. Every tool invocation passes through ArmorIQ's proxy PEP, producing exactly three deterministic outcomes:
        </p>

        {/* 3 Outcome Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px', marginBottom: '28px' }}>
          {/* Card 1: Allowed */}
          <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outcome 1: Allowed</span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
              <code>lookup_order</code>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0 }}>
              Read-only inquiries match the platform allowlist. ArmorIQ mints an intent token and proxy permits execution against MCP server. Answer returns to caller in ~1.9s.
            </p>
          </div>

          {/* Card 2: Blocked */}
          <div style={{ background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outcome 2: Blocked</span>
              <XCircle size={18} color="#ef4444" />
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
              <code>change_payout</code>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0 }}>
              Unauthorized destination routing changes are rejected directly by ArmorIQ (HTTP 403 <code>tool_not_in_allowlist</code>). Zero network packets reach banking tools.
            </p>
          </div>

          {/* Card 3: Held */}
          <div style={{ background: isDark ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outcome 3: Held</span>
              <AlertTriangle size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
              <code>issue_refund</code>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0 }}>
              High-value funds disbursements trigger <code>PolicyHoldException</code> and register a platform delegation. Call answers within 5s while awaiting dual supervisor approval (2/2).
            </p>
          </div>
        </div>

        {/* Theme-Aware Architecture Diagram */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              BeyondFlow Cryptographic Architecture Flow
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
              Built directly from server/voiceGatewayService.js & server/armorIqEnforcement.js
            </span>
          </div>

          <svg
            viewBox="0 0 960 260"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            aria-label="Architecture diagram showing Caller to ElevenLabs Voice Agent to BeyondFlow Gateway to ArmorIQ IAP and Proxy to Governed MCP Server with Allowed, Blocked, and Held branches"
            role="img"
          >
            <defs>
              <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill={isDark ? '#64748b' : '#94a3b8'} />
              </marker>
              <marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker id="arrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#ef4444" />
              </marker>
              <marker id="arrowAmber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Nodes */}
            {/* 1. Caller */}
            <rect x="20" y="90" width="120" height="80" rx="8" fill={isDark ? '#1e293b' : '#e2e8f0'} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" />
            <text x="80" y="125" textAnchor="middle" fill={isDark ? '#f8fafc' : '#0f172a'} fontSize="13" fontWeight="700">Caller Voice</text>
            <text x="80" y="145" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="11">Telephony Inbound</text>

            {/* Arrow 1 */}
            <line x1="140" y1="130" x2="190" y2="130" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="2" markerEnd="url(#arrow)" />

            {/* 2. ElevenLabs */}
            <rect x="190" y="90" width="140" height="80" rx="8" fill={isDark ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe'} stroke="#38bdf8" strokeWidth="1.5" />
            <text x="260" y="123" textAnchor="middle" fill={isDark ? '#f8fafc' : '#0369a1'} fontSize="13" fontWeight="700">ElevenLabs Agent</text>
            <text x="260" y="142" textAnchor="middle" fill={isDark ? '#38bdf8' : '#0284c7'} fontSize="11">Voice & Intent Extractor</text>

            {/* Arrow 2 */}
            <line x1="330" y1="130" x2="380" y2="130" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="2" markerEnd="url(#arrow)" />

            {/* 3. Gateway */}
            <rect x="380" y="90" width="140" height="80" rx="8" fill={isDark ? 'rgba(99, 102, 241, 0.12)' : '#ede9fe'} stroke="#818cf8" strokeWidth="1.5" />
            <text x="450" y="120" textAnchor="middle" fill={isDark ? '#f8fafc' : '#4338ca'} fontSize="13" fontWeight="700">BeyondFlow Gateway</text>
            <text x="450" y="138" textAnchor="middle" fill={isDark ? '#a5b4fc' : '#6366f1'} fontSize="11">capturePlan()</text>
            <text x="450" y="154" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10">&lt;5s Webhook Window</text>

            {/* Arrow 3 */}
            <line x1="520" y1="130" x2="570" y2="130" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="2" markerEnd="url(#arrow)" />

            {/* 4. ArmorIQ Engine */}
            <rect x="570" y="70" width="160" height="120" rx="10" fill={isDark ? '#0f172a' : '#ffffff'} stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
            <text x="650" y="95" textAnchor="middle" fill="#10b981" fontSize="13" fontWeight="800">ArmorIQ Authority</text>
            <text x="650" y="115" textAnchor="middle" fill={isDark ? '#f1f5f9' : '#0f172a'} fontSize="11">1. CSRG-IAP Token</text>
            <text x="650" y="132" textAnchor="middle" fill={isDark ? '#f1f5f9' : '#0f172a'} fontSize="11">2. Proxy PEP Enforcement</text>
            <text x="650" y="150" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10">Policy: treasury-allowlist</text>
            <text x="650" y="168" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10">Delegation: Holds</text>

            {/* 3 Outcome Branches */}
            {/* Allowed Branch */}
            <path d="M 730 100 L 780 60 L 820 60" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowGreen)" />
            <text x="770" y="50" fill="#10b981" fontSize="11" fontWeight="700">ALLOWED</text>
            <rect x="820" y="40" width="120" height="40" rx="6" fill={isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7'} stroke="#10b981" strokeWidth="1" />
            <text x="880" y="65" textAnchor="middle" fill={isDark ? '#34d399' : '#15803d'} fontSize="11" fontWeight="700">MCP: lookup_order</text>

            {/* Blocked Branch */}
            <path d="M 730 130 L 820 130" fill="none" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowRed)" />
            <text x="770" y="122" fill="#ef4444" fontSize="11" fontWeight="700">BLOCKED</text>
            <rect x="820" y="110" width="120" height="40" rx="6" fill={isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2'} stroke="#ef4444" strokeWidth="1" />
            <text x="880" y="135" textAnchor="middle" fill={isDark ? '#f87171' : '#b91c1c'} fontSize="11" fontWeight="700">403 Blocked (0$ lost)</text>

            {/* Held Branch */}
            <path d="M 730 160 L 780 200 L 820 200" fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowAmber)" />
            <text x="770" y="215" fill="#f59e0b" fontSize="11" fontWeight="700">HELD</text>
            <rect x="820" y="180" width="120" height="40" rx="6" fill={isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7'} stroke="#f59e0b" strokeWidth="1" />
            <text x="880" y="205" textAnchor="middle" fill={isDark ? '#fbbf24' : '#b45309'} fontSize="11" fontWeight="700">Dual Quorum (2/2)</text>
          </svg>
        </div>
      </section>

      {/* SECTION 2: Roles (ElevenLabs vs ArmorIQ) */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={18} color="#818cf8" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
            Roles: What Each Platform Does
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
          {/* Card 1: ElevenLabs */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PhoneCall size={18} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                  ElevenLabs: The Conversational Voice Interface
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>VOICE & PARAMETER DISPATCH</span>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '16px' }}>
              ElevenLabs provides ultra-low latency conversational voice telephony. It listens to spoken caller requests and translates dialogue into structured webhook parameters.
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--muted-foreground)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Zero Authority:</strong> ElevenLabs never speaks directly to banking systems or MCP servers.</li>
              <li><strong>Webhook Tools:</strong> Spoken requests map to webhooks (<code>BeyondFlow_orderLookup</code>, <code>BeyondFlow_payoutChange</code>, <code>BeyondFlow_issueRefund</code>).</li>
              <li><strong>Sub-5s SLA:</strong> The gateway answers within ~5 seconds with immediate status or a holding utterance.</li>
            </ul>
          </div>

          {/* Card 2: ArmorIQ */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                  ArmorIQ: The Cryptographic Control Layer
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>INTENT TOKEN & PROXY PEP</span>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '16px' }}>
              ArmorIQ is the cryptographic policy decision and enforcement point. It verifies intent, mints signed tokens, and blocks unauthorized actions before network execution.
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--muted-foreground)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Plan Binding:</strong> <code>capturePlan()</code> computes a SHA-256 Merkle root binding the step parameters.</li>
              <li><strong>Ed25519 Tokens:</strong> <code>getIntentToken()</code> issues a cryptographically signed, single-use token.</li>
              <li><strong>PEP Proxy:</strong> <code>invoke()</code> passes through <code>proxy.armoriq.ai</code>, rejecting unapproved tools or swapped tokens.</li>
              <li><strong>Delegation Hold:</strong> Registers holds on high-risk operations awaiting dual supervisor release.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3: Set It Up Yourself (7 Numbered Steps) */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={18} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
            Set It Up Yourself (7 Steps)
          </h2>
        </div>

        <p style={{ fontSize: '0.94rem', color: 'var(--muted-foreground)', maxWidth: '900px', lineHeight: 1.6, marginBottom: '24px' }}>
          Follow these 7 steps to configure, onboard, and run BeyondFlow with actual ArmorIQ intent governance:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {setupSteps.map((s, idx) => (
            <div
              key={s.step}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--card-shadow)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#10b981',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                      {s.title}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)' }}>{s.summary}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(s.command, idx)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="Copy command block"
                >
                  {copiedIndex === idx ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Code Snippet Box */}
              <div style={{
                background: isDark ? '#09090b' : '#1e293b',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '14px 18px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                overflowX: 'auto',
                marginBottom: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <pre style={{ margin: 0 }}>{s.command}</pre>
              </div>

              {/* Expected Result */}
              <div style={{
                background: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: isDark ? '#a7f3d0' : '#065f46',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Expected Result:</strong> {s.expectedResult}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: What You Should See (Real Excerpts from docs/evidence/) */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={18} color="#38bdf8" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
            What You Should See (Real Terminal Evidence)
          </h2>
        </div>

        <p style={{ fontSize: '0.94rem', color: 'var(--muted-foreground)', maxWidth: '900px', lineHeight: 1.6, marginBottom: '20px' }}>
          These are verbatim excerpts from our live platform runs recorded in <code>docs/evidence/test-enforcement-2026-10-17.txt</code> and <code>docs/evidence/test-intent-mismatch-2026-10-17.txt</code> (with private bearer secrets redacted):
        </p>

        <div style={{
          background: isDark ? '#09090b' : '#1e293b',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: '#e2e8f0',
          lineHeight: 1.6,
          overflowX: 'auto',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '8px' }}>
            # Excerpt 1: scripts/test-enforcement.mjs output against live platform:
          </div>
          <pre style={{ margin: '0 0 16px 0', color: '#94a3b8' }}>
{`Case 1: lookup_order (read-only query)
  Capture plan: goal='Look up order status for ORD-1001'
  Plan Hash: b3e6889fe267adb6c3a6479017637841...
  Intent Token: 4f53c348a1104f1cbfb463fbad0ee1b1 (expires 3600s)
  Invoke result: ALLOWED (latency: 1823ms)
  Status: SHIPPED, Carrier: FedEx, ETA: 2026-10-19

Case 2: change_payout (unauthorized bank account diversion)
  Capture plan: goal='Change payout destination to GB29 NWBK 6016 1331 9268 19'
  Intent Token: 981ab238f490192a...
  Invoke result: BLOCKED (latency: 685ms)
  Error: PolicyBlockedException: tool_not_in_allowlist (HTTP 403)
  Diversion thwarted! $0.00 lost.

Case 3: issue_refund (high-value funds disbursement)
  Capture plan: goal='Issue refund of $1,250 for ORD-1001'
  Delegation Request Created: f92fd7d2-a64f-4a34-a474-8ef06935c4dc
  Result: HELD (PolicyHoldException)
  Required approvals: 2 supervisors.`}
          </pre>

          <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '8px' }}>
            # Excerpt 2: scripts/test-intent-mismatch.mjs output:
          </div>
          <pre style={{ margin: 0, color: '#94a3b8' }}>
{`Mint token for action: lookup_order
Attempt to invoke action: issue_refund with that token
Result: IntentMismatchException
  Expected action hash: b3e6889fe267adb6...
  Presented action: issue_refund
  Proxy PEP refused tool execution before any banking API was called.`}
          </pre>
        </div>
      </section>

      {/* SECTION 5: Limits (Honest Boundaries) */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
            Honest Architectural Limits
          </h2>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--muted-foreground)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li>
              <strong>Prototype on Sandbox Data:</strong> BeyondFlow runs on 100% synthetic sandbox data (mock orders, Airwallex test client). It does not connect to live production automated clearing house (ACH) or Fedwire payment rails.
            </li>
            <li>
              <strong>Cryptographic Verification Latency:</strong> ArmorIQ plan hashing, Ed25519 asymmetric verification, and proxy round-trips add approximately 500ms to 1800ms of verification latency per tool call.
            </li>
            <li>
              <strong>Telephony Webhook Timeout Budget:</strong> Voice AI platforms (ElevenLabs) expect tool responses within ~5 seconds. High-risk operations held for human review require an asynchronous holding pattern with subsequent status callbacks.
            </li>
            <li>
              <strong>Single Layer Among Several:</strong> Cryptographic intent governance prevents unauthorized tool invocations and parameter drift, but must be paired with standard transport TLS, ledger idempotency, and defense-in-depth API authentication.
            </li>
          </ul>
        </div>
      </section>

      {/* Bottom Navigation CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
        <button
          onClick={() => {
            if (onNavigate) onNavigate('overview');
          }}
          className="btn btn-secondary mobile-tap-target"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', minHeight: '44px' }}
        >
          <span>&larr; Back to Overview</span>
        </button>

        <a
          href="/judges"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate('judges');
          }}
          className="btn btn-primary mobile-tap-target"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', minHeight: '44px', fontWeight: 700 }}
        >
          <ShieldCheck size={16} />
          <span>Proceed to Judge Inspection (/judges)</span>
          <ChevronRight size={14} />
        </a>
      </div>

    </div>
  );
}
