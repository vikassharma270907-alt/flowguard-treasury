import React, { useState } from 'react';
import {
  Sparkles, X, CheckCircle2, Terminal,
  ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react';

const walkthroughSteps = [
  {
    time: "00s - 15s",
    badge: "Plan Capture & Hashing",
    badgeColor: "#38bdf8",
    title: "1. Intent Plan Capture & SHA-256 Merkle Hashing",
    headline: "The agent formally declares its goal and tool parameters before execution begins.",
    explanation: "When an operator or voice caller triggers an operation (e.g. checking order status, changing payout destination, or issuing a refund), BeyondFlow intercepts the intent. The client invokes client.capturePlan(agentId, goal, plan). The plan binds every step, target MCP server, and parameter. BeyondFlow computes a SHA-256 Merkle hash that binds every step of the plan.",
    keyPoints: [
      "Prevents prompt injection, tool poisoning, and agent drift at the source",
      "Deterministic Plan Hash: b3e6889fe267adb6c3a64790176...",
      "Zero tool access or banking API execution permitted prior to validation"
    ],
    codeSnippet: "// 1. Declare intent & capture deterministic plan\nconst capture = client.capturePlan(\n  'flowguard-agent',\n  'Check order status ORD-1001',\n  {\n    goal: 'Check order status ORD-1001',\n    steps: [{\n      action: 'lookup_order',\n      mcp: 'flowguard-treasury-mcp',\n      params: { order_id: 'ORD-1001' }\n    }]\n  }\n);"
  },
  {
    time: "15s - 30s",
    badge: "Cryptographic Authorization",
    badgeColor: "#818cf8",
    title: "2. Ed25519 Intent Token Minting at iap.armoriq.ai",
    headline: "ArmorIQ verifies policy permissions and issues a single-use authorization token.",
    explanation: "BeyondFlow submits the captured plan to ArmorIQ's Identity & Policy Assertion (IAP) service at https://iap.armoriq.ai. ArmorIQ evaluates the registered agent identity (flowguard-agent), user permissions, and the active workspace policy (flowguard-treasury-allowlist). If approved, ArmorIQ mints an Ed25519 cryptographically signed Intent Token containing the plan hash and step Merkle root.",
    keyPoints: [
      "Real platform token ID: 4f53c348a1104f1cbfb463fbad0ee1b1",
      "Asymmetrically signed by ArmorIQ private key; verifiable by public key",
      "Strict TTL expiration (e.g. 3600s) preventing replay attacks"
    ],
    codeSnippet: "// 2. Request Ed25519 token from ArmorIQ IAP\nconst token = await client.getIntentToken(capture);\n// Output from real run:\n// token.id = \"4f53c348a1104f1cbfb463fbad0ee1b1\"\n// token.plan_hash = \"b3e6889fe267adb6c3a64790176...\"\n// token.expires = 3600 (seconds)"
  },
  {
    time: "30s - 45s",
    badge: "Inline PEP Interception",
    badgeColor: "#34d399",
    title: "3. Deterministic PEP Enforcement at proxy.armoriq.ai",
    headline: "Every tool call passes through ArmorIQ's Policy Enforcement Point.",
    explanation: "Tool invocations never communicate with the banking MCP server directly. Instead, client.invoke() routes every call through proxy.armoriq.ai. The proxy verifies the Ed25519 token, validates step compliance against the plan hash, and applies the policy. Safe inquiries (lookup_order) pass with 200 OK. Unauthorized wire changes (change_payout) are blocked immediately with PolicyBlockedException. Large disbursements (issue_refund) are held with PolicyHoldException.",
    keyPoints: [
      "ALLOWED: lookup_order executed in ~1911ms total verification latency",
      "BLOCKED: change_payout blocked in 685ms with tool_not_in_allowlist",
      "HELD: issue_refund halted in 594ms requiring 2 supervisor approvals"
    ],
    codeSnippet: "// 3. PEP enforces policy on tool call\ntry {\n  const res = await client.invoke(\n    token.id, 'flowguard-treasury-mcp',\n    'change_payout', { new_routing: '021000021' }\n  );\n} catch (err) {\n  // Throws PolicyBlockedException: tool_not_in_allowlist\n  // Wire diversion rejected; $0.00 lost!\n}"
  },
  {
    time: "45s - 60s",
    badge: "Quorum & Audit Ledger",
    badgeColor: "#f59e0b",
    title: "4. Multi-Supervisor Quorum & Tamper-Evident Ledger",
    headline: "Dual-sign-off for high-value funds and tamper-evident Merkle auditing.",
    explanation: "When an action is held, ArmorIQ returns a delegationId (e.g. 65b502cb-6cb0-4e50-b392-934c6dba5bd7). In the BeyondFlow Supervisor Playground, designated treasury officers perform step-up authentication. When the 2-approval threshold is satisfied, the action executes against the Airwallex sandbox adapter, and every event is sealed into the cryptographic audit trail.",
    keyPoints: [
      "Auth-gated: MCP tools reject unauthenticated requests without ArmorIQ token",
      "Dual authorization: Multi-signature approval quorum for high-risk payouts",
      "Audit ledger: searchable log with SHA-256 Merkle proofs"
    ],
    codeSnippet: "// 4. Resolve delegation with dual quorum\nconst delegation = await client.createDelegationRequest({\n  delegationId: '65b502cb-6cb0-4e50-b392-934c6dba5bd7',\n  requiredApprovals: 2,\n  receivedApprovals: 2\n});\n// Executed in sandbox with cryptographic audit log entry"
  }
];

export default function InteractiveWalkthroughTour({ onClose }) {
  const [explainerStep, setExplainerStep] = useState(0);

  return (
    <div style={{ marginTop: '24px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: 'clamp(16px, 3vw, 24px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#38bdf8" />
          </div>
          <div>
            <div style={{ color: 'var(--foreground)', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
              BeyondFlow 60-Second Architectural Execution Explainer
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              Step-by-step breakdown of real ArmorIQ intent verification, proxy PEP enforcement, and quorum governance.
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '6px', padding: '8px 12px', minHeight: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
          aria-label="Close walkthrough explainer"
        >
          <X size={15} />
          <span>Close</span>
        </button>
      </div>

      {/* Time Step Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '8px', marginBottom: '20px' }}>
        {walkthroughSteps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setExplainerStep(idx)}
            style={{
              background: explainerStep === idx ? 'rgba(56, 189, 248, 0.12)' : 'var(--card)',
              border: explainerStep === idx ? '1px solid #38bdf8' : '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              minHeight: '44px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace', color: explainerStep === idx ? '#38bdf8' : 'var(--muted-foreground)' }}>
                {step.time}
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: `${step.badgeColor}22`, color: step.badgeColor }}>
                Phase {idx + 1}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: explainerStep === idx ? 'var(--foreground)' : 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {step.badge}
            </div>
          </button>
        ))}
      </div>

      {/* Active Step Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: 'clamp(14px, 3vw, 20px)' }}>
        {/* Left Column: Explanation */}
        <div>
          <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${walkthroughSteps[explainerStep].badgeColor}22`, color: walkthroughSteps[explainerStep].badgeColor, marginBottom: '8px' }}>
            {walkthroughSteps[explainerStep].time} · {walkthroughSteps[explainerStep].badge}
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 6px 0' }}>
            {walkthroughSteps[explainerStep].title}
          </h3>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', margin: '0 0 10px 0' }}>
            {walkthroughSteps[explainerStep].headline}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            {walkthroughSteps[explainerStep].explanation}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {walkthroughSteps[explainerStep].keyPoints.map((pt, pIdx) => (
              <div key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem', color: 'var(--foreground)' }}>
                <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Code & Trace */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
              <Terminal size={14} color="#38bdf8" />
              <span>ArmorIQ SDK Execution Trace</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 600 }}>Recorded Platform Call</span>
          </div>
          <pre
            tabIndex={0}
            aria-label="ArmorIQ SDK execution trace"
            style={{
            flex: 1,
            background: '#04060a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '0.72rem',
            fontFamily: 'monospace',
            color: '#e2e8f0',
            lineHeight: 1.5,
            margin: 0,
            overflowX: 'auto',
            whiteSpace: 'pre'
          }}>
            {walkthroughSteps[explainerStep].codeSnippet}
          </pre>
        </div>
      </div>

      {/* Stepper Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <button
          onClick={() => setExplainerStep(Math.max(0, explainerStep - 1))}
          disabled={explainerStep === 0}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', opacity: explainerStep === 0 ? 0.4 : 1 }}
        >
          <ChevronLeft size={14} />
          <span>Previous Phase</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {walkthroughSteps.map((_, dotIdx) => (
            <span
              key={dotIdx}
              onClick={() => setExplainerStep(dotIdx)}
              style={{
                width: explainerStep === dotIdx ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: explainerStep === dotIdx ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>

        {explainerStep < walkthroughSteps.length - 1 ? (
          <button
            onClick={() => setExplainerStep(explainerStep + 1)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <span>Next Phase</span>
            <ChevronRight size={14} />
          </button>
        ) : (
          <a
            href="/#boundary-test"
            onClick={(e) => { e.preventDefault(); const el = document.getElementById('boundary-test'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <span>View Boundary Test Live</span>
            <ArrowRight size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
