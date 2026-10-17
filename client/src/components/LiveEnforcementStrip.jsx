import React from 'react';
import { ShieldCheck, Ban, Clock, ExternalLink } from 'lucide-react';
import realRunData from '../data/realArmoriqRun.json';

export default function LiveEnforcementStrip() {
  const cases = realRunData?.cases || [];
  const lookupCase = cases.find((c) => c.tool === 'lookup_order') || {
    verdict: 'ALLOWED',
    latencyMs: 887,
    tokenId: '951f7625efe24fb18039b62fadfed910',
    planHash: 'b3e6889fe267adb661881333d488307f0263e0c2baf3efb3866bf136a62ac1ec'
  };

  const payoutCase = cases.find((c) => c.tool === 'change_payout') || {
    verdict: 'BLOCKED',
    latencyMs: 764,
    tokenId: '3a280ab1a5f74beea90b4b459b71b498',
    reason: 'tool_not_in_allowlist',
    httpStatus: 403
  };

  const refundCase = cases.find((c) => c.tool === 'issue_refund') || {
    verdict: 'HELD',
    latencyMs: 604,
    delegationId: 'eb63aac7-349a-4cf0-a156-a2f3c469f427',
    reason: 'Delegation request created. Awaiting approval from senior officer.'
  };

  const recordedDate = realRunData?.recordedAt
    ? new Date(realRunData.recordedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '16 Oct 2026';

  const rows = [
    {
      tool: 'lookup_order',
      intent: 'Read customer order status (ORD-1001)',
      verdict: lookupCase.verdict || 'ALLOWED',
      badgeClass: 'b-ALLOWED',
      badgeColor: 'var(--verdict-allowed-text)',
      badgeBg: 'var(--verdict-allowed-bg)',
      badgeBorder: 'var(--verdict-allowed-border)',
      icon: ShieldCheck,
      latency: `${lookupCase.latencyMs} ms`,
      idLabel: 'Token / Audit ID',
      idValue: lookupCase.tokenId || lookupCase.planHash?.slice(0, 24) || '951f7625efe2…',
      details: 'Read allowed by stored policy (flowguard-treasury-allowlist)'
    },
    {
      tool: 'change_payout',
      intent: 'Divert wire to untrusted destination (GB29...)',
      verdict: payoutCase.verdict || 'BLOCKED',
      badgeClass: 'b-BLOCKED',
      badgeColor: 'var(--verdict-blocked-text)',
      badgeBg: 'var(--verdict-blocked-bg)',
      badgeBorder: 'var(--verdict-blocked-border)',
      icon: Ban,
      latency: `${payoutCase.latencyMs} ms`,
      idLabel: 'Token ID / Reason',
      idValue: `${payoutCase.tokenId?.slice(0, 16)}… (HTTP ${payoutCase.httpStatus || 403} tool_not_in_allowlist)`,
      details: 'Blocked by ArmorIQ PEP before reaching network'
    },
    {
      tool: 'issue_refund',
      intent: 'Disburse full customer refund for $89.00',
      verdict: refundCase.verdict || 'HELD',
      badgeClass: 'b-HELD',
      badgeColor: 'var(--verdict-held-text)',
      badgeBg: 'var(--verdict-held-bg)',
      badgeBorder: 'var(--verdict-held-border)',
      icon: Clock,
      latency: `${refundCase.latencyMs} ms`,
      idLabel: 'Platform Delegation ID',
      idValue: refundCase.delegationId || 'eb63aac7-349a-4cf0-a156-a2f3c469f427',
      details: 'Held for dual supervisor approval via platform delegation API'
    }
  ];

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '4px'
      }}
      aria-label="ArmorIQ PEP Enforcement Strip"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
            Live PEP Enforcement Strip
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--brand-accent-text, #0284c7)',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}
          >
            Recorded run, {recordedDate}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          <span>Policy: <code style={{ color: 'var(--foreground)' }}>flowguard-treasury-allowlist</code></span>
          <span>·</span>
          <span>PEP: <code style={{ color: 'var(--foreground)' }}>proxy.armoriq.ai</code></span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.tool}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px, 1.2fr) minmax(90px, 0.8fr) minmax(90px, 0.7fr) minmax(220px, 2fr) auto',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--secondary)',
                border: '1px solid var(--border-subtle, var(--border))',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ fontWeight: 700, color: 'var(--foreground)' }}>{row.tool}</code>
              </div>

              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: row.badgeColor,
                    background: row.badgeBg,
                    border: `1px solid ${row.badgeBorder}`
                  }}
                >
                  <Icon size={12} strokeWidth={2.6} />
                  <span>{row.verdict}</span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--foreground)', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                <Clock size={13} style={{ color: 'var(--muted-foreground)' }} />
                <span>{row.latency}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>{row.idLabel}</span>
                <code
                  style={{
                    fontSize: '0.73rem',
                    color: 'var(--foreground)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={row.idValue}
                >
                  {row.idValue}
                </code>
              </div>

              <div style={{ justifySelf: 'end' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--brand-indigo, #6366f1)',
                    border: '1px solid rgba(99, 102, 241, 0.28)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>Decided by ArmorIQ PEP</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
