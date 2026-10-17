import React from 'react';
import {
  Video, ArrowRight, ShieldCheck, CheckCircle2,
  Clock, Lock, ExternalLink, ArrowLeft, Terminal,
  Sparkles, FileText, Cpu, Headphones, Play
} from 'lucide-react';
import ExplainerVideoSection from './ExplainerVideoSection';
import { useTheme } from '../context/ThemeContext';

export default function VideoPage({ onNavigate }) {
  const { isDark } = useTheme();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '14px',
        borderBottom: isDark ? '1px solid #27272a' : '1px solid #e5e5e5'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onNavigate ? onNavigate('overview') : (window.location.href = '/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: isDark ? '#e4e4e7' : '#3f3f46',
              background: isDark ? '#18181b' : '#f4f4f5',
              border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Overview</span>
          </button>
          <span style={{ color: 'var(--muted-foreground)', fontSize: '0.82rem' }}>/</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
            3-Minute Explainer Video
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate && onNavigate('how-it-works')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <FileText size={13} />
            <span>How It Works Guide</span>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('judges')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#c084fc',
              background: 'rgba(192, 132, 252, 0.1)',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={13} />
            <span>Judges Tour</span>
          </button>
        </div>
      </div>

      {/* Hero Title Section */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            <Video size={13} color="#10b981" />
            03:49 Master Explainer Video
          </span>
          <span className="badge" style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            background: 'rgba(99, 102, 241, 0.12)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.25)'
          }}>
            <Headphones size={13} />
            ElevenLabs AI Voiceover
          </span>
          <span className="badge" style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#6ee7b7',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <ShieldCheck size={13} />
            Real ArmorIQ PEP Screen Recording
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
          fontWeight: 800,
          color: 'var(--foreground)',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          margin: '0 0 12px 0'
        }}>
          BeyondFlow: 3-Minute Architectural Explainer Video
        </h1>

        <p style={{
          fontSize: '1rem',
          color: 'var(--muted-foreground)',
          maxWidth: '860px',
          lineHeight: 1.6,
          margin: 0
        }}>
          A complete walkthrough for hackathon judges and technical audiences showing how BeyondFlow uses ElevenLabs voice telephony and ArmorIQ cryptographic intent governance to enforce deterministic safety on autonomous treasury actions.
        </p>
      </div>

      {/* Main Video Section Component */}
      <ExplainerVideoSection />

      {/* Architectural Takeaways Grid */}
      <div style={{
        marginTop: '44px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Headphones size={20} color="#38bdf8" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
            1. ElevenLabs Voice Telephony
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '14px' }}>
            Conversational voice agent captures human natural language intent, extracts structured order and refund parameters, and dispatches authenticated webhook requests to the BeyondFlow gateway with sub-5-second holding patterns.
          </p>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', background: 'var(--secondary)', padding: '8px 12px', borderRadius: '6px' }}>
            Webhook Tools: BeyondFlow_orderLookup, BeyondFlow_payoutChange, BeyondFlow_issueRefund
          </div>
        </div>

        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={20} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
            2. ArmorIQ Cryptographic PEP
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '14px' }}>
            Every tool invocation passes through proxy.armoriq.ai with a cryptographic intent token. The policy engine permits benign reads, halts unauthorized wire diversions, and suspends high-risk payouts for human supervisor quorum.
          </p>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', background: 'var(--secondary)', padding: '8px 12px', borderRadius: '6px' }}>
            Enforcement: ALLOWED (1.18s) | BLOCKED (403 tool_not_in_allowlist) | HELD (delegation quorum)
          </div>
        </div>

        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(192, 132, 252, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Cpu size={20} color="#c084fc" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
            3. Model Context Protocol Server
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '14px' }}>
            Adheres strictly to the MCP 2024-11-05 standard. The upstream MCP server executes pure tools without hardcoding verdicts; the ArmorIQ reverse proxy transparently enforces authorization before requests reach the tools.
          </p>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', background: 'var(--secondary)', padding: '8px 12px', borderRadius: '6px' }}>
            Endpoints: /mcp (SSE stream) | /api/mcp (JSON) | stdio CLI transport
          </div>
        </div>
      </div>

      {/* Quick Links Banner */}
      <div style={{
        marginTop: '36px',
        padding: '20px 24px',
        borderRadius: '12px',
        background: isDark ? 'rgba(24, 24, 27, 0.7)' : 'rgba(244, 244, 245, 0.9)',
        border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
            Ready to inspect the live evidence and code?
          </h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted-foreground)', margin: 0 }}>
            Review the 9-chapter transcript, cryptographic audit ledger, or the live boundary test terminal.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onNavigate && onNavigate('judges')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 16px' }}
          >
            <span>Open Judges Dossier</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
