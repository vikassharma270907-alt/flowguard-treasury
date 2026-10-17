import React from 'react';
import { Shield, Zap } from 'lucide-react';

export default function HowWeUseArmorIQSection() {
  return (
    <section
      id="how-we-use-armoriq"
      style={{
        margin: '36px 0',
        padding: 'clamp(20px, 4vw, 36px) clamp(16px, 3vw, 32px)',
        borderRadius: '16px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)'
      }}
      aria-labelledby="architecture-heading"
    >
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.3)', color: '#818cf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          <Shield size={12} color="#818cf8" />
          Policy-Enforced Intent Pipeline
        </div>
        <h2 id="architecture-heading" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
          How BeyondFlow Uses ArmorIQ
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.92rem', marginTop: '6px', maxWidth: '820px', lineHeight: 1.5 }}>
          Autonomous conversational agents cannot call tools or financial gateways directly. Every real-world action must pass through ArmorIQ's Policy Enforcement Point (PEP) proxy to prove compliance with declared user intent.
        </p>
      </div>

      {/* Theme-Aware Inline SVG Diagram with horizontal containment on medium/desktop */}
      <div
        style={{
          background: 'var(--background)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: 'clamp(16px, 3vw, 24px) 16px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          marginBottom: '28px'
        }}
      >
        <svg
          viewBox="0 0 960 420"
          width="100%"
          style={{ minWidth: 'min(100%, 700px)', height: 'auto', display: 'block' }}
          role="img"
          aria-labelledby="svg-arch-title svg-arch-desc"
        >
          <title id="svg-arch-title">BeyondFlow & ArmorIQ Architectural Flow</title>
          <desc id="svg-arch-desc">
            Visual sequence showing the ElevenLabs Voice Agent passing through the BeyondFlow gateway, which captures the plan, mints an intent token at iap.armoriq.ai, and invokes the tool through proxy.armoriq.ai before reaching the platform-onboarded flowguard-treasury-mcp server.
          </desc>

          <defs>
            <linearGradient id="agentGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="armoriqGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="mcpGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
            </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#818cf8" />
            </marker>
          </defs>

          {/* Node 1: AI Agents */}
          <rect x="30" y="50" width="230" height="150" rx="10" fill="url(#agentGrad)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="145" y="80" textAnchor="middle" fill="#38bdf8" fontWeight="700" fontSize="14">1. Autonomous Agents</text>
          <text x="145" y="105" textAnchor="middle" fill="var(--foreground)" fontWeight="600" fontSize="12">ElevenLabs Voice Support</text>
          <text x="145" y="125" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">& BeyondFlow Treasury Agent</text>
          <text x="145" y="155" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">Tool: BeyondFlow_&lt;tool&gt;</text>
          <text x="145" y="175" textAnchor="middle" fill="var(--success)" fontSize="10">&lt;5s Voice Timeout Guard</text>

          {/* Arrow 1 -> 2 */}
          <path d="M 260 125 L 350 125" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
          <text x="305" y="115" textAnchor="middle" fill="#c084fc" fontSize="10" fontFamily="monospace">Webhook</text>

          {/* Node 2: BeyondFlow Gateway */}
          <rect x="360" y="50" width="240" height="150" rx="10" fill="url(#agentGrad)" stroke="#818cf8" strokeWidth="1.5" />
          <text x="480" y="80" textAnchor="middle" fill="#818cf8" fontWeight="700" fontSize="14">2. BeyondFlow Gateway (:8790)</text>
          <text x="480" y="105" textAnchor="middle" fill="var(--foreground)" fontWeight="600" fontSize="11">Prefix Strip & Plan Canonicalization</text>
          <text x="480" y="130" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">client.capturePlan(model, prompt, plan)</text>
          <text x="480" y="150" textAnchor="middle" fill="#c084fc" fontSize="10" fontFamily="monospace">client.getIntentToken(capture)</text>
          <text x="480" y="175" textAnchor="middle" fill="var(--success)" fontSize="10">Answers held calls inside the ~5s window</text>

          {/* Arrow 2 -> 3 (Token Minting) */}
          <path d="M 480 200 L 480 260" stroke="#818cf8" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="515" y="235" textAnchor="start" fill="#c084fc" fontSize="10" fontFamily="monospace">Token Mint (IAP)</text>

          {/* Node 3: ArmorIQ Cloud */}
          <rect x="260" y="270" width="440" height="120" rx="12" fill="url(#armoriqGrad)" stroke="#818cf8" strokeWidth="2" />
          <text x="480" y="295" textAnchor="middle" fill="var(--foreground)" fontWeight="800" fontSize="15">3. ArmorIQ Governance Cloud</text>
          <text x="480" y="320" textAnchor="middle" fill="#c084fc" fontSize="12" fontWeight="600">CSRG-IAP Platform (iap.armoriq.ai) · PEP Proxy (proxy.armoriq.ai)</text>
          <text x="480" y="345" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">Signed intent tokens · plan/step hashes · platform policy engine</text>
          <text x="480" y="368" textAnchor="middle" fill="var(--success)" fontSize="11" fontWeight="600">Verdicts: ALLOWED · BLOCKED · HELD (Dual-Supervisor Delegation)</text>

          {/* Arrow 3 -> 4 (Proxy to MCP) */}
          <path d="M 700 330 L 750 330 L 750 150 L 790 150" fill="none" stroke="var(--success)" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="755" y="240" textAnchor="start" fill="var(--success)" fontSize="10" fontFamily="monospace">SSE JSON-RPC 2.0</text>

          {/* Node 4: MCP Servers */}
          <rect x="800" y="50" width="220" height="150" rx="10" fill="url(#mcpGrad)" stroke="var(--success)" strokeWidth="1.5" />
          <text x="910" y="80" textAnchor="middle" fill="var(--success)" fontWeight="700" fontSize="14">4. Governed MCP Servers</text>
          <text x="910" y="105" textAnchor="middle" fill="var(--foreground)" fontWeight="600" fontSize="12">flowguard-treasury-mcp</text>
          <text x="910" y="125" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">& flowguard-treasury-mcp</text>
          <text x="910" y="150" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">lookup_order</text>
          <text x="910" y="170" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">change_payout | issue_refund</text>
        </svg>
      </div>

      {/* Code Traces: Exactly what the code calls */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '14px' }}>
        Exact ArmorIQ SDK Methods Called in Production
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '14px' }}>
        <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}>

            <code>client.capturePlan()</code>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.4 }}>
            Called in <code style={{ color: 'var(--foreground)' }}>gateway/armoriq-gateway.mjs</code>. Canonicalizes the prompt, model ID, and intended MCP tools into a deterministic execution structure.
          </p>
        </div>

        <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}>
            <Zap size={16} />
            <code>client.getIntentToken()</code>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.4 }}>
            Calls <code style={{ color: 'var(--foreground)' }}>iap.armoriq.ai</code>. Issues the intent token that binds the captured plan (with its plan and step hashes) before any tool may run.
          </p>
        </div>

        <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}>

            <code>client.invoke()</code>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.4 }}>
            Dispatched through <code style={{ color: 'var(--foreground)' }}>proxy.armoriq.ai</code>. The proxy evaluates the platform policies and returns the verdict (allow / block / hold) before the call reaches the MCP server over HTTP.
          </p>
        </div>

        <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}>

            <code>client.createDelegationRequest()</code>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.4 }}>
            For high-stakes tools like <code style={{ color: '#fbbf24' }}>issue_refund</code>, creates a pending delegation on ArmorIQ requiring 2 human supervisor approvals before release.
          </p>
        </div>
      </div>
    </section>
  );
}
