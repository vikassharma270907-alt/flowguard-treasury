import React from 'react';
import { ShieldAlert, Home, ArrowLeft, ExternalLink } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

export default function NotFoundScreen({ onNavigate }) {
  const { t } = useI18n();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <section
      style={{
        maxWidth: '720px',
        margin: '60px auto 100px auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(20px, 4vw, 36px)',
        borderRadius: '16px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
        textAlign: 'center'
      }}
      aria-labelledby="not-found-heading"
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}
      >
        <ShieldAlert size={32} color="var(--verdict-blocked-text, #ef4444)" />
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: 'var(--verdict-blocked-text, #ef4444)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '14px'
        }}
      >
        HTTP 404 · Resource Not Found
      </div>

      <h1
        id="not-found-heading"
        style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 800,
          color: 'var(--foreground)',
          letterSpacing: '-0.02em',
          margin: '0 0 12px 0'
        }}
      >
        Policy Route Undefined
      </h1>

      <p
        style={{
          color: 'var(--muted-foreground)',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          maxWidth: '540px',
          margin: '0 auto 24px auto'
        }}
      >
        The requested endpoint <code style={{ color: 'var(--step-sky-text)', fontFamily: 'monospace' }}>{currentPath || '/unknown'}</code> is not registered on the BeyondFlow routing table or ArmorIQ platform governance gate.
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '28px'
        }}
      >
        <button
          onClick={() => {
            if (onNavigate) onNavigate('overview');
            if (typeof window !== 'undefined') window.history.pushState(null, '', '/');
          }}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--brand-indigo, #4f46e5)',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Home size={16} />
          <span>Return to Treasury Overview</span>
        </button>

        <button
          onClick={() => {
            if (onNavigate) onNavigate('judges');
            if (typeof window !== 'undefined') window.history.pushState(null, '', '/judges');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--secondary)',
            color: 'var(--foreground)',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: '1px solid var(--border)',
            cursor: 'pointer'
          }}
        >
          <span>Open Judges' Evaluation</span>
          <ExternalLink size={14} />
        </button>
      </div>
    </section>
  );
}
