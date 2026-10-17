import React, { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  ExternalLink, ArrowRight, Video, Globe,
  Terminal, Lock, Layers, Cpu, FileText, Check, Copy, Sparkles
} from 'lucide-react';
import realRunData from '../data/realArmoriqRun.json';
import ExplainerVideoSection from './ExplainerVideoSection';

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
      evidence: "Onboarded agent 'flowguard-agent' (c8bcbe51-dea4-4459-9fd8-38f88ebc714e), MCP server 'flowguard-treasury-mcp' (UUID: 7540cd0a-7d76-414a-a849-96b337a0c6ed), and policy 'flowguard-treasury-allowlist' (23f8f304-0f6b-44a0-9bba-fa9886ca611b) in the operator workspace (org dd9e9695-e58d-4e56-8cff-ef9617ba4c54). Tokens minted at iap.armoriq.ai; calls invoked via proxy.armoriq.ai.",
      status: "PASS",
      verified: true
    },
    {
      rule: "2. ElevenLabs Cannot Replace ArmorIQ",
      requirement: "Third-party services must not bypass or substitute ArmorIQ governance.",
      evidence: "ElevenLabs Conversational Voice Agent sends tool webhooks with the 'BeyondFlow_' prefix to the BeyondFlow gateway, which captures a canonical plan and gates the call through ArmorIQ before it can reach the MCP server. No tool executes without a platform-minted intent token bound to that plan.",
      status: "PASS",
      verified: true
    },
    {
      rule: "3. At Least One MCP Server",
      requirement: "The project must implement and utilize at least one functional MCP server.",
      evidence: "One MCP server implementation, onboarded to the ArmorIQ platform as 'flowguard-treasury-mcp' with 3 governed tools (lookup_order, change_payout, issue_refund). Transports: JSON-RPC 2.0 over HTTP with SSE responses (deployed /mcp endpoint at flowguard-treasury.vercel.app) and stdio (server/mcpServer.js) for local CLI use. Two further helper checks (reserve floor, audit Merkle root) are labelled app-side in the UI.",
      status: "PASS",
      verified: true
    },
    {
      rule: "4. Official Window Development",
      requirement: "Core development must take place within official hackathon window (10 to 17 Oct 2026).",
      evidence: "Git history runs from first commit ac099d0 (2026-10-15) through the current HEAD — inside the official Oct 10-17, 2026 window. Verified against github.com/vikassharma270907-alt/flowguard-treasury/commits/main (first commit ac099d0 … current HEAD).",
      status: "PASS",
      verified: true
    },
    {
      rule: "5. Sandbox / Test Data Only",
      requirement: "Sensitive operations use sandbox or test environments only. No real customer data or production payment systems.",
      evidence: "100% synthetic sandbox data: payout accounts (ACC-4471, ACC-9002), orders (ORD-1001 … ORD-1004), and an Airwallex sandbox client with a clearly-labelled synthetic mock adapter when credentials are absent. Sandbox disclaimers appear on every money screen.",
      status: "PASS",
      verified: true
    },
    {
      rule: "6. Real ArmorIQ Enforcement",
      requirement: "Demos must show actual ArmorIQ enforcement, never simulated or hardcoded results.",
      evidence: "scripts/test-enforcement.mjs runs live calls against ArmorIQ: change_payout BLOCKED (PolicyBlockedException, reason 'tool_not_in_allowlist', HTTP 403), issue_refund HELD — real pending delegation eb63aac7-349a-4cf0-a156-a2f3c469f427 on the platform — and lookup_order ALLOWED end-to-end (real payload, verified: true). Raw captures re-run 16 Oct 2026 against the production endpoint: docs/evidence/test-enforcement-2026-10-16.txt; audit-log detail: EVIDENCE.md.",
      status: "PASS",
      verified: true
    },
    {
      rule: "7. Zero Misrepresentation",
      requirement: "Accurate descriptions of integrations and capabilities without exaggeration.",
      evidence: "All claims mapped to the code path that produced them: server/armorIqEnforcement.js, lib/verdicts.js, server/voiceGatewayService.js, and gateway/armoriq-gateway.mjs. Unsupported claims were removed or scoped precisely during the pre-submission accuracy pass.",
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
      verification: "Platform allow verdict for lookup_order (allow-list from the live policy); real 200 response payload and latency captured in EVIDENCE.md and docs/evidence/.",
      status: "Recorded (16 Oct 2026)"
    },
    {
      claim: "Payout destination changes are blocked by policy",
      where: "Boundary Test -> change_payout card",
      verification: "PEP proxy raises PolicyBlockedException (HTTP 403) with reason 'tool_not_in_allowlist'.",
      status: "Recorded (16 Oct 2026)"
    },
    {
      claim: "Refund disbursements are held for human approval through a real ArmorIQ platform delegation",
      where: "Boundary Test -> issue_refund card & Supervisor Playground",
      verification: "The refund path creates a real delegation via the platform API (delegationId: eb63aac7-349a-4cf0-a156-a2f3c469f427, status pending). Release flow runs through the app-side dual-supervisor playground.",
      status: "Recorded (16 Oct 2026)"
    },
    {
      claim: "Action-level intent binding: a token minted for one action cannot be used for another",
      where: "Boundary Test Intent Mismatch box & scripts/test-intent-mismatch.mjs",
      verification: "Run 'node --env-file=.env scripts/test-intent-mismatch.mjs'. Wrong-action and expired tokens are refused before any network call (IntentMismatchException / TokenExpiredException). Call arguments are not bound end-to-end by the platform today — the swapped-amount case is reported honestly as NOT REFUSED in docs/evidence/.",
      status: "Live & Verified"
    },
    {
      claim: "ElevenLabs voice tool webhooks reply within 5-second window",
      where: "Voice Gateway screen (/api/voice/gateway/tool-call)",
      verification: "The gateway answers within the ~5-second voice window (holding speech) or returns an explicit governed error with the real reason.",
      status: "Live"
    },
    {
      claim: "ArmorPay Protocol: Deterministic duplicate collision shield & intent-token settlement for AP invoices",
      where: "Invoice Guard screen (/invoices) and server/armorPayService.js",
      verification: "Deterministic pre-flight checks exact collisions, Levenshtein fuzzy suffixes, and reserve floor ($15,000). Mints signed ArmorIQ Intent Token and settles via Airwallex rails with cryptographic Merkle receipt.",
      status: "Live & Verified"
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
          Official Judge Inspection Dashboard · ArmorIQ Flow State Hackathon
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', margin: '0 0 12px 0' }}>
          BeyondFlow Hackathon Evaluation Guide
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--muted-foreground)', maxWidth: '840px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          Voice AI support agent governed by ArmorIQ. This page provides a fast 90-second tour, verified rule compliance evidence, transparent claims validation, and honest architectural boundaries.
        </p>

        {/* Action Links Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <a
            href="https://github.com/vikassharma270907-alt/flowguard-treasury"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm mobile-tap-target"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', minHeight: '44px', textDecoration: 'none' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
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
            href="/how-it-works"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('how-it-works');
              }
            }}
            className="btn btn-primary btn-sm mobile-tap-target"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', minHeight: '44px', textDecoration: 'none', fontWeight: 700 }}
          >
            <Sparkles size={15} />
            <span>How It Works Guide (/how-it-works)</span>
            <ArrowRight size={13} />
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

      {/* 3-Minute Architectural Explainer Video */}
      <ExplainerVideoSection />

      {/* 90-Second Guided Tour */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
          ⏱️ 90-Second Judge Tour (Deep Links)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '14px' }}>
          <div style={{ background: 'var(--card)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
              Step 1 · 15 Seconds
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
              The Centerpiece: Boundary Test
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginBottom: '12px', lineHeight: 1.4 }}>
              Inspect the real run output: ALLOWED, BLOCKED, and HELD verdicts with platform-minted intent tokens and delegation IDs.
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
              Architecture & Enforcement Flow
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
              Examine the 3 platform-governed tools, the deployed /mcp JSON-RPC endpoint, and the stdio transport.
            </p>
            <a
              href="/how-it-works"
              onClick={(e) => { e.preventDefault(); onNavigate('how-it-works'); }}
              style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Inspect Step-by-Step Guide (/how-it-works)</span>
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

      {/* Reproducible Hackathon Demo Scenarios */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
              🕹️ 4 Reproducible Hackathon Demo Scenarios
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
              Trigger each hackathon preset with live multi-currency dynamics, duplicate invoice attacks, and reserve floor calculations.
            </p>
          </div>
          <button
            onClick={() => onNavigate('scenarios')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Open Interactive Scenarios Matrix</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '16px' }}>
          {[
            {
              code: 'Scenario A',
              title: 'Baseline Multi-Currency Run',
              desc: '$33,110 cash across 4 wallets, $15,000 reserve floor, 5 supplier bills. Normal operations preserved.',
              badge: 'NORMAL OPS',
              color: '#10b981'
            },
            {
              code: 'Scenario B',
              title: 'Duplicate Invoice Attack',
              desc: 'Injects invoice INV-2024-884B (€4,250) with 91.2% similarity. Caught by duplicate shield & blocked.',
              badge: 'ATTACK SIM',
              color: '#ef4444'
            },
            {
              code: 'Scenario C',
              title: 'Delayed Receivable Shock',
              desc: '$14,500 customer receipt delayed by 14 days. Rules engine defers low-priority bills to protect floor.',
              badge: 'STRESS SHOCK',
              color: '#f59e0b'
            },
            {
              code: 'Scenario D',
              title: 'Sandbox Deposit (+ $25,000)',
              desc: 'Calls Airwallex sandbox deposit to inject +$25,000 USD, unlocking held obligations automatically.',
              badge: 'REPLENISHMENT',
              color: '#38bdf8'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate('scenarios')}
              style={{
                background: 'var(--card)',
                padding: '18px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: item.color }}>
                    {item.code}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>
                    {item.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                  {item.title}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.45, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.color }}>
                  Launch in Matrix
                </span>
                <ArrowRight size={12} color={item.color} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rules Compliance Table */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
          📋 Hackathon Rules Compliance Table
        </h2>
        <div className="table-cards-mobile" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }}>
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
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{r.evidence}</div>
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
        <div className="table-cards-mobile" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }}>
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
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
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

      {/* Raw Evidence Captures */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '12px' }}>
          🧾 Raw Evidence Captures (Real ArmorIQ Runs)
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '10px' }}>
          Unedited console output from live runs of the verification scripts, committed to the repository (no secrets are printed):
        </p>
        <ul style={{ paddingLeft: '18px', color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.9, margin: 0 }}>
          <li><a href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/docs/evidence/test-enforcement-2026-10-17.txt" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>test-enforcement-2026-10-17.txt</a> — fresh live run: allow / block / hold verdicts with real token and delegation IDs.</li>
          <li><a href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/docs/evidence/test-intent-mismatch-2026-10-17.txt" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>test-intent-mismatch-2026-10-17.txt</a> — fresh live run: IntentMismatchException (wrong action) & TokenExpiredException; Case 2 honest boundary.</li>
          <li><a href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/docs/evidence/test-enforcement-2026-10-16.txt" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>test-enforcement-2026-10-16.txt</a> — baseline run: allow / block / hold platform verdicts.</li>
          <li><a href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/docs/evidence/test-intent-mismatch-2026-10-16.txt" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>test-intent-mismatch-2026-10-16.txt</a> — baseline run: intent-binding refusals.</li>
          <li><a href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/EVIDENCE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>EVIDENCE.md</a> — full audit-log entries for each verdict, including the end-to-end allowed call.</li>
          <li><a href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/docs/evidence/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>docs/evidence/README.md</a> — run metadata: repo revision, platform object IDs, per-case token and policy refs.</li>
        </ul>
      </section>

      {/* Built vs Third-Party Breakdown */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
          🏗️ Architecture Breakdown: Built vs Third-Party
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>
              ✨ What We Built for the Hackathon
            </h3>
            <ul style={{ paddingLeft: '18px', color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
              <li><strong>BeyondFlow Gateway Service (gateway/server.mjs)</strong>: tool-name normalizer, canonical plan builder, and async holding responder.</li>
              <li><strong>Dual-Supervisor Approval Quorum</strong>: Hold tracking engine in gateway/server.mjs requiring 2 independent human reviews before releasing disbursements.</li>
              <li><strong>Model Context Protocol (MCP) server</strong>: JSON-RPC 2.0 over HTTP plus a stdio transport, exposing 3 platform-governed financial tools (and 2 app-side helper checks).</li>
              <li><strong>3D Hardware-Accelerated Intent Vaults</strong>: Three Three.js WebGL visualizers with cursor tracking and 60 FPS delta loops.</li>
              <li><strong>Audit ledger</strong>: append-only SHA-256 Merkle-tree verification (tamper-evident) in server/auditLedger.js.</li>
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
              <li><strong>Airwallex Sandbox API</strong>: balance and transfer integration targeting api.sandbox.airwallex.com, with a clearly-labelled synthetic mock adapter when credentials are absent.</li>
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
         <strong>Developer Statement:</strong> &ldquo;Yes, BeyondFlow reuses and adapts my earlier MIT-licensed IntentGate prototype components (such as the voice gateway holding pattern and Airwallex sandbox adapter) alongside official ArmorIQ SDK and MCP libraries. All code is disclosed under the MIT License.&rdquo; Third-party open-source libraries: <code>@armoriq/sdk</code>, <code>@modelcontextprotocol/sdk</code>, <code>three</code>, <code>react</code>, <code>express</code>. All sensitive operations use synthetic sandbox data only — no live banking rails, no real funds.
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
          <li><strong>MCP Endpoint Hosting</strong>: The registered MCP server is served at <code>https://flowguard-treasury.vercel.app/mcp</code> (SSE transport). During local development the same server can be exposed via a Cloudflare tunnel so ArmorIQ's cloud PEP proxy can reach it.</li>
          <li><strong>Argument-Level Intent Binding</strong>: The platform binds declared actions and token freshness; call arguments are validated by the sandbox tool itself (see the honest Case 2 note in docs/evidence/README.md).</li>
          <li><strong>Delegation Polling</strong>: Held calls currently release when supervisors approve via the playground web UI; real-time push webhooks for delegation events will be added in the post-hackathon roadmap.</li>
        </ul>
      </section>
    </div>
  );
}
