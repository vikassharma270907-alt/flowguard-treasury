import React, { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  ExternalLink, ArrowRight, Video, Globe,
  Terminal, Lock, Layers, Cpu, FileText, Check, Copy
} from 'lucide-react';
import realRunData from '../data/realArmoriqRun.json';

export default function JudgesPage({ onNavigate }) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const complianceRules = [
    {
      rule: "1. Functional ArmorIQ Integration",
      requirement: "Intent and policy enforcement must be demonstrated through platform.armoriq.ai. API keys from platform, agents and MCP servers onboarded.",
      evidence: "Onboarded Agent 'intentgate-agent', MCP server 'intentgate-support-mcp' (UUID: cd7deb69-adb3-45f7-977b-f0d0e7235ba2), and Policy 'cli-intentgate-agent-intentgate-support-mcp' in Vikas Sharma's Workspace (org_01). Tokens minted at iap.armoriq.ai; calls invoked via proxy.armoriq.ai.",
      status: "PASS",
      verified: true
    },
    {
      rule: "2. ElevenLabs Cannot Replace ArmorIQ",
      requirement: "Third-party services must not bypass or substitute ArmorIQ governance.",
      evidence: "ElevenLabs Conversational Voice Agent sends webhooks with 'IntentGate_' prefix to gateway. Gateway canonicalizes plan and gates every tool call through ArmorIQ before reaching MCP. No tool ever runs without an Ed25519 Intent Token.",
      status: "PASS",
      verified: true
    },
    {
      rule: "3. At Least One MCP Server",
      requirement: "The project must implement and utilize at least one functional MCP server.",
      evidence: "Two functional MCP servers: 1) 'intentgate-support-mcp' (JSON-RPC 2.0 with SSE over HTTP at port 8791 / public tunnel), 2) 'flowguard-treasury-mcp' (Spec 2024-11-05 with stdio CLI transport in server/mcpServer.js).",
      status: "PASS",
      verified: true
    },
    {
      rule: "4. Official Window Development",
      requirement: "Core development must take place within official hackathon window (10 to 17 Oct 2026).",
      evidence: "Git commit history spans Oct 10 to Oct 16, 2026. Verified from git log (commits: 933580c, 54d15d8, 67b57b0, fa91252, etc.). All commits verified against official repository dates.",
      status: "PASS",
      verified: true
    },
    {
      rule: "5. Sandbox / Test Data Only",
      requirement: "Sensitive operations use sandbox or test environments only. No real customer data or production payment systems.",
      evidence: "100% synthetic sandbox data: accounts (ACC-4471, ACC-9921), orders (ORD-1001, ORD-84920), and Airwallex Mock Adapter with simulated corridor rails. Disclaimers present across all balance screens.",
      status: "PASS",
      verified: true
    },
    {
      rule: "6. Real ArmorIQ Enforcement",
      requirement: "Demos must show actual ArmorIQ enforcement, never simulated or hardcoded results.",
      evidence: "scripts/test-enforcement.mjs runs real live calls against ArmorIQ: lookup_order (ALLOWED), change_payout (BLOCKED via PolicyBlockedException), issue_refund (HELD via PolicyHoldException). Raw run capture stored with real token IDs.",
      status: "PASS",
      verified: true
    },
    {
      rule: "7. Zero Misrepresentation",
      requirement: "Accurate descriptions of integrations and capabilities without exaggeration.",
      evidence: "All claims mapped to verified code calls in lib/verdicts.mjs, gateway/armoriq-gateway.mjs, and server/armorIqService.js. Unsupported claims removed or scoped precisely.",
      status: "PASS",
      verified: true
    }
  ];

  const claimsList = [
    {
      claim: "ArmorIQ Cloud PEP intercepts and enforces policies on MCP tool calls",
      where: "Boundary Test section and scripts/test-enforcement.mjs",
      verification: "Run 'node --env-file=.env scripts/test-enforcement.mjs'. Tool calls pass through proxy.armoriq.ai.",
      status: "Live & Recorded"
    },
    {
      claim: "Read-only order lookups are allowed automatically",
      where: "Boundary Test -> lookup_order card",
      verification: "Verified HTTP 200 payload returned with latency ~1,911ms. Matched policy: allow_read_policy.",
      status: "Recorded (16 Oct 2026)"
    },
    {
      claim: "Payout destination changes are blocked by policy",
      where: "Boundary Test -> change_payout card",
      verification: "PEP proxy raises PolicyBlockedException (HTTP 403) with reason 'tool_not_in_allowlist'.",
      status: "Recorded (16 Oct 2026)"
    },
    {
      claim: "Refund disbursements are held requiring 2 supervisor approvals",
      where: "Boundary Test -> issue_refund card & Supervisor Playground",
      verification: "Creates delegation on ArmorIQ platform (delegationId: 65b502cb-6cb0-4e50-b392-934c6dba5bd7).",
      status: "Recorded (16 Oct 2026)"
    },
    {
      claim: "Cryptographic intent mismatch prevented before network execution",
      where: "Boundary Test Intent Mismatch box & scripts/test-intent-mismatch.mjs",
      verification: "Run 'node --env-file=.env scripts/test-intent-mismatch.mjs'. Throws IntentMismatchException locally.",
      status: "Live & Verified"
    },
    {
      claim: "ElevenLabs voice tool webhooks reply within 5-second window",
      where: "Voice Gateway screen (/api/voice/gateway/tool-call)",
      verification: "Gateway replies in <3.5s with supervisor holding speech: 'A supervisor has been notified...'",
      status: "Live"
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 189, 248, 0.08) 50%, rgba(99, 102, 241, 0.1) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '36px 32px',
        marginBottom: '36px'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
          <ShieldCheck size={14} />
          Official Judge Inspection Dashboard · Flow State Hackathon
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', margin: '0 0 12px 0' }}>
          FlowGuard Hackathon Evaluation Guide
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--muted-foreground)', maxWidth: '840px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          Autonomous Treasury & Intent Vault Governed by ArmorIQ. This page provides a fast 90-second tour, verified rule compliance evidence, transparent claims validation, and honest architectural boundaries.
        </p>

        {/* Action Links Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <a
            href="https://github.com/vikassharma270907-alt/flowguard-treasury"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', textDecoration: 'none' }}
          >
            <Github size={15} />
            <span>GitHub Repository</span>
            <ExternalLink size={12} />
          </a>

          <a
            href="https://flowguard-treasury.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', textDecoration: 'none' }}
          >
            <Globe size={15} />
            <span>Live Production Site</span>
          </a>

          <a
            href="/docs/flowguard-guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', textDecoration: 'none' }}
          >
            <FileText size={15} />
            <span>Technical Guide (PDF)</span>
          </a>

          <button
            onClick={handleCopyShare}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
          >
            {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Share /judges'}</span>
          </button>
        </div>
      </div>

      {/* 90-Second Guided Tour */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
          ⏱️ 90-Second Judge Tour (Deep Links)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={{ background: 'var(--card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
              Step 1 · 15 Seconds
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
              The Centerpiece: Boundary Test
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginBottom: '12px', lineHeight: 1.4 }}>
              Inspect the 3-result real run output: ALLOWED, BLOCKED, and HELD with real Ed25519 tokens.
            </p>
            <a
              href="/#boundary-test"
              onClick={(e) => { e.preventDefault(); onNavigate('overview'); setTimeout(() => { const el = document.getElementById('boundary-test'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }}
              style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Jump to Boundary Test</span>
              <ArrowRight size={13} />
            </a>
          </div>

          <div style={{ background: 'var(--card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', marginBottom: '6px' }}>
              Step 2 · 30 Seconds
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
              Architecture & Zero-Bypass Flow
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginBottom: '12px', lineHeight: 1.4 }}>
              Review the theme-aware SVG diagram showing how all agent tools pass through proxy.armoriq.ai.
            </p>
            <a
              href="/#how-we-use-armoriq"
              onClick={(e) => { e.preventDefault(); onNavigate('overview'); setTimeout(() => { const el = document.getElementById('how-we-use-armoriq'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }}
              style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View Architecture Diagram</span>
              <ArrowRight size={13} />
            </a>
          </div>

          <div style={{ background: 'var(--card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
              Step 3 · 25 Seconds
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
              Active MCP Server Inspection
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginBottom: '12px', lineHeight: 1.4 }}>
              Examine the 5 governed tools, JSON-RPC 2.0 endpoint at /mcp, and stdio transport.
            </p>
            <a
              href="/how-it-works"
              onClick={(e) => { e.preventDefault(); onNavigate('enclave'); }}
              style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Inspect MCP & Enclave</span>
              <ArrowRight size={13} />
            </a>
          </div>

          <div style={{ background: 'var(--card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
              Step 4 · 20 Seconds
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
              Dual-Supervisor Quorum & Audit
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginBottom: '12px', lineHeight: 1.4 }}>
              See how held financial actions require 2 supervisor approvals before release.
            </p>
            <a
              href="/audit"
              onClick={(e) => { e.preventDefault(); onNavigate('audit'); }}
              style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Open Audit Trail</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* Rules Compliance Table */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
          📋 Hackathon Rules Compliance Table
        </h2>
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--foreground)', width: '22%' }}>Hackathon Rule</th>
                <th style={{ padding: '12px 16px', color: 'var(--foreground)', width: '56%' }}>Implementation & Evidence</th>
                <th style={{ padding: '12px 16px', color: 'var(--foreground)', width: '12%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {complianceRules.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'var(--background)' : 'var(--card)' }}>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', fontWeight: 700, color: 'var(--foreground)' }}>
                    {r.rule}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    <div style={{ marginBottom: '4px', color: 'var(--foreground)', fontWeight: 500 }}>{r.requirement}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.evidence}</div>
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>
                      <CheckCircle2 size={12} />
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Claims Verification Table */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
          🔍 Claims & Proof Verification Table
        </h2>
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--foreground)', width: '30%' }}>Claim</th>
                <th style={{ padding: '12px 16px', color: 'var(--foreground)', width: '25%' }}>Where to See It</th>
                <th style={{ padding: '12px 16px', color: 'var(--foreground)', width: '30%' }}>How to Verify</th>
                <th style={{ padding: '12px 16px', color: 'var(--foreground)', width: '15%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {claimsList.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'var(--background)' : 'var(--card)' }}>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', fontWeight: 600, color: 'var(--foreground)' }}>
                    {c.claim}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--muted-foreground)' }}>
                    {c.where}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {c.verification}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 600, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Built vs Third-Party Breakdown */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
          🏗️ Architecture Breakdown: Built vs Third-Party
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>
              ✨ What We Built for the Hackathon
            </h3>
            <ul style={{ paddingLeft: '18px', color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
              <li><strong>IntentGate Gateway Service (:8790)</strong>: Tool prefix normalizer, canonical plan generator, and async holding responder.</li>
              <li><strong>Dual-Supervisor Approval Quorum</strong>: Hold tracking engine in gateway/server.mjs requiring 2 independent human reviews before releasing disbursements.</li>
              <li><strong>Standard Model Context Protocol (MCP) Server</strong>: HTTP SSE JSON-RPC 2.0 & CLI stdio server governing 5 financial tools.</li>
              <li><strong>3D Hardware-Accelerated Intent Vaults</strong>: Three Three.js WebGL visualizers with cursor tracking and 60 FPS delta loops.</li>
              <li><strong>Cryptographic Audit Ledger</strong>: Immutable SHA-256 Merkle tree verification engine in server/auditLedger.js.</li>
            </ul>
          </div>

          <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#818cf8', marginBottom: '12px' }}>
              📦 Third-Party Platforms & Libraries Used
            </h3>
            <ul style={{ paddingLeft: '18px', color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
              <li><strong>@armoriq/sdk</strong>: Official ArmorIQ SDK for plan capture, IAP token minting, delegation requests, and PEP proxy invocation.</li>
              <li><strong>ArmorIQ Cloud Platform</strong>: Identity & Assurance Platform (iap.armoriq.ai) and Policy Enforcement Proxy (proxy.armoriq.ai).</li>
              <li><strong>@modelcontextprotocol/sdk</strong>: Anthropic's official SDK for MCP tool registration and JSON-RPC transport.</li>
              <li><strong>ElevenLabs Conversational AI</strong>: Realistic speech agent for voice telephony support.</li>
              <li><strong>Airwallex Banking APIs</strong>: Multi-currency balance and transfer specs operated in verified Sandbox mode.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Disclosures Block */}
      <section style={{ marginBottom: '40px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '10px' }}>
          📜 Open Disclosures & Lineage
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
          <strong>Developer Statement:</strong> FlowGuard is built from scratch for this hackathon using third-party open-source libraries (<code>@armoriq/sdk</code>, <code>@modelcontextprotocol/sdk</code>, <code>three</code>, <code>react</code>, <code>express</code>). All sensitive operations utilize synthetic sandbox accounts without access to live banking rails or real funds.
        </p>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
          Detailed dependency disclosures and licensing notices are documented in <a href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/DISCLOSURES.md" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>DISCLOSURES.md</a>.
        </p>
      </section>

      {/* Honest Limitations */}
      <section style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24', marginBottom: '10px' }}>
          ⚠️ Honest Technical Limitations
        </h2>
        <ul style={{ paddingLeft: '18px', color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
          <li><strong>Sandbox Isolation</strong>: Airwallex transfers and FX conversions run against synthetic sandbox accounts. Real money is never moved.</li>
          <li><strong>Cloudflare Public Tunnel for MCP</strong>: In local development, the HTTP MCP server requires a public HTTPS tunnel (e.g. Cloudflare tunnel) to be invoked by ArmorIQ's cloud PEP proxy.</li>
          <li><strong>Delegation Polling</strong>: Held calls currently release when supervisors approve via the playground web UI; real-time push webhooks for delegation events will be added in the post-hackathon roadmap.</li>
        </ul>
      </section>
    </div>
  );
}
