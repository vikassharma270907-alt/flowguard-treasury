import React, { useState } from 'react';
import {
  ShieldCheck, AlertOctagon, Clock, CheckCircle2,
  XCircle, AlertTriangle, ArrowRight, ExternalLink,
  Code2, Copy, Check, Lock, Terminal, Cpu, FileText
} from 'lucide-react';
import realRunData from '../data/realArmoriqRun.json';

export default function BoundaryTestSection() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeCase = realRunData.cases[selectedCaseIndex];

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(realRunData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="boundary-test"
      style={{
        margin: '36px 0',
        padding: 'clamp(20px, 4vw, 36px) clamp(16px, 3vw, 32px)',
        borderRadius: '16px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
        scrollMarginTop: '140px'
      }}
      aria-labelledby="boundary-test-heading"
    >
      {/* Header & Authenticity Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }}></span>
            Centerpiece · Proof of Real ArmorIQ Enforcement
          </div>
          <h2 id="boundary-test-heading" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
            ArmorIQ Boundary Test: 3-Result Verification
          </h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.92rem', marginTop: '6px', maxWidth: '780px', lineHeight: 1.5 }}>
            Demonstrates real enforcement decisions rendered by ArmorIQ's cloud PEP Proxy (<code style={{ color: '#38bdf8' }}>proxy.armoriq.ai</code>) and CSRG-IAP Platform. Allow and block verdicts come from the platform's policy engine; refunds are held through a real platform delegation — no code-level allow/block <code style={{ color: '#f87171' }}>if</code> statements.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{ fontSize: '0.78rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
            Recorded from a real ArmorIQ run on 16 Oct 2026
          </span>
          <a
            href="https://platform.armoriq.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            <span>View on platform.armoriq.ai</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Real ArmorIQ Platform Provenance & Trace Metadata */}
      <div style={{
        background: 'var(--secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '22px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
        gap: '12px',
        fontSize: '0.8rem'
      }}>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
            Registered Agent
          </span>
          <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>flowguard-agent</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
            Governed MCP Server
          </span>
          <strong style={{ color: '#34d399', fontFamily: 'monospace' }}>flowguard-treasury-mcp</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
            Platform Workspace
          </span>
          <strong style={{ color: 'var(--foreground)' }}>Vikas Sharma's Workspace</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
            Active Policy
          </span>
          <strong style={{ color: '#c084fc', fontFamily: 'monospace' }}>flowguard-treasury-allowlist</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
            Run / Trace ID
          </span>
          <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>trace_armoriq_20261016_887ms</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
            Platform Provenance
          </span>
          <a
            href="https://platform.armoriq.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
          >
            <span>Verified on platform</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* 3 Outcome Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '14px', marginBottom: '24px' }}>
        {realRunData.cases.map((c, idx) => {
          const isSelected = selectedCaseIndex === idx;
          const isAllowed = c.verdict === 'ALLOWED';
          const isBlocked = c.verdict === 'BLOCKED';
          const isHeld = c.verdict === 'HELD';

          const badgeBg = isAllowed ? 'var(--success-bg)' : isBlocked ? 'var(--danger-bg)' : 'var(--warning-bg)';
          const badgeColor = isAllowed ? 'var(--success)' : isBlocked ? 'var(--danger)' : 'var(--warning)';
          const borderColor = isSelected ? (isAllowed ? 'var(--success)' : isBlocked ? 'var(--danger)' : 'var(--warning)') : 'var(--border)';

          return (
            <button
              key={c.tool}
              onClick={() => setSelectedCaseIndex(idx)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '16px 18px',
                borderRadius: '12px',
                background: isSelected ? 'var(--secondary)' : 'var(--card)',
                border: `2px solid ${borderColor}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minHeight: '44px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>
                  {c.tool}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}33` }}>
                  {c.verdict}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.4 }}>
                {isAllowed && `Read-only query allowed automatically by ArmorIQ policy in ~${(c.latencyMs / 1000).toFixed(1)}s.`}
                {isBlocked && "Beneficiary account change refused by PolicyBlockedException (403)."}
                {isHeld && "Financial disbursement requires 2 supervisor approvals via delegation."}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Case Deep Dive */}
      <div style={{ background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', padding: 'clamp(16px, 3vw, 24px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>
              Action Evaluated by ArmorIQ
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'monospace' }}>
              {activeCase.action} ({realRunData.mcpServer})
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              PEP Latency: <strong style={{ color: 'var(--foreground)' }}>{activeCase.latencyMs} ms</strong>
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              Token Mint: <strong style={{ color: 'var(--foreground)' }}>{activeCase.mintMs} ms</strong>
            </span>
          </div>
        </div>

        {/* Cryptographic Proof Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px', marginBottom: '18px' }}>
          <div style={{ background: 'var(--card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Token ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#38bdf8', wordBreak: 'break-all' }}>
              {activeCase.tokenId}
            </div>
          </div>
          <div style={{ background: 'var(--card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Canonical Plan Hash (SHA-256)</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#c084fc', wordBreak: 'break-all' }}>
              {activeCase.planHash}
            </div>
          </div>
          <div style={{ background: 'var(--card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Policy Ref (OPA)</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#34d399', wordBreak: 'break-all' }}>
              {activeCase.policyRef}
            </div>
          </div>
        </div>

        {/* Live Verdict Details */}
        {activeCase.verdict === 'ALLOWED' && (
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, marginBottom: '6px' }}>
              <CheckCircle2 size={18} />
              <span>ALLOWED by ArmorIQ Stored Policy</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', margin: '0 0 10px 0' }}>
              Verified through ArmorIQ PEP Proxy. The tool was matched against allowlist policy <code style={{ color: '#34d399' }}>{realRunData.policyName}</code> and forwarded downstream to the MCP server.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '4px' }}>Returned Payload:</div>
            <pre style={{ margin: 0, padding: '10px', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '6px', fontSize: '0.78rem', color: '#38bdf8', overflowX: 'auto', fontFamily: 'monospace' }}>
              {JSON.stringify(activeCase.resultPayload, null, 2)}
            </pre>
          </div>
        )}

        {activeCase.verdict === 'BLOCKED' && (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, marginBottom: '6px' }}>
              <XCircle size={18} />
              <span>BLOCKED by ArmorIQ Policy (HTTP 403)</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', margin: '0 0 10px 0' }}>
              <strong>Exception:</strong> <code style={{ color: '#f87171' }}>{activeCase.exception}</code> · Reason: <code style={{ color: '#f87171' }}>{activeCase.reason}</code>
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', margin: 0 }}>
              The client attempted to redirect bank routing to <code style={{ color: '#fbbf24' }}>{activeCase.params.new_destination}</code>. ArmorIQ rejected this invocation at proxy level because the action is not in the agent's authorized allowlist: <code style={{ color: '#a1a1aa' }}>{JSON.stringify(activeCase.allowedTools)}</code>.
            </p>
          </div>
        )}

        {activeCase.verdict === 'HELD' && (
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, marginBottom: '6px' }}>
              <AlertTriangle size={18} />
              <span>HELD for Human Approval — 2 Supervisor Approvals Required</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
              <strong>Mechanism:</strong> <code style={{ color: '#fbbf24' }}>{activeCase.mechanism || 'ArmorIQ platform delegation'}</code> · Delegation ID: <code style={{ color: '#38bdf8' }}>{activeCase.delegationId}</code>
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', margin: 0 }}>
              Financial disbursement of ${activeCase.params.amount} USD cannot be executed autonomously. A delegation request was registered on ArmorIQ platform (<code style={{ color: '#fbbf24' }}>status: {activeCase.delegationStatus}</code>), awaiting dual supervisor quorum.
            </p>
          </div>
        )}

        {/* Intent Mismatch Bonus Verification */}
        <div style={{ background: 'rgba(129, 140, 248, 0.06)', border: '1px solid rgba(129, 140, 248, 0.2)', borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
              Cryptographic Intent Binding Verification
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--foreground)' }}>
              Declared plan <code style={{ color: '#38bdf8' }}>{realRunData.intentMismatchCase.declaredPlan}</code> → Attempted <code style={{ color: '#f87171' }}>{realRunData.intentMismatchCase.attemptedInvocation}</code>:
              Refused locally by <strong style={{ color: '#f87171' }}>{realRunData.intentMismatchCase.exception}</strong> before any network call.
            </div>
          </div>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <Code2 size={13} />
            <span>{showRawJson ? 'Hide Raw Run Capture' : 'Inspect Raw Run Capture (JSON)'}</span>
          </button>
        </div>

        {/* Raw JSON Modal/Collapsible */}
        {showRawJson && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                docs/recorded-runs/real-armoriq-enforcement-2026-10-16.json
              </span>
              <button
                onClick={handleCopyJson}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
              >
                {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre style={{ margin: 0, padding: '12px', background: '#090d16', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.75rem', color: '#a5f3fc', overflowX: 'auto', maxHeight: '320px', fontFamily: 'monospace' }}>
              {JSON.stringify(realRunData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
