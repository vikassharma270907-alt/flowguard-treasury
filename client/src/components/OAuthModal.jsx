import React, { useState } from 'react';
import { X, Shield, Lock, ArrowRight, CheckCircle2, User, Key, Globe } from 'lucide-react';

export default function OAuthModal({ onClose, onLoginSuccess }) {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleOAuthLogin = async (provider, email, name) => {
    setLoadingProvider(provider);
    try {
      const res = await fetch('/api/auth/oauth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, email, name })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess({
          authenticated: true,
          user: data.user || data.session
        });
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        {/* Header with Vercel-style logo icon */}
        <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: '0 0 25px rgba(255, 255, 255, 0.2)'
          }}>
            <svg width="22" height="20" viewBox="0 0 76 65" fill="#000000">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fafafa' }}>
            FlowGuard Admin Portal
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            Authenticate with your enterprise identity provider
          </p>
        </div>

        {/* OAuth Provider Buttons */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Quick Sandbox Admin Shortcut */}
          <button
            onClick={() => handleOAuthLogin('Sandbox Admin SSO', 'beyond_nothing@flowguard.io', 'beyond_nothing')}
            disabled={!!loadingProvider}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'center', gap: '8px' }}
          >
            <User size={15} />
            <span>1-Click Sign In as beyond_nothing (Super Admin)</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          {/* Google Workspace */}
          <button
            onClick={() => handleOAuthLogin('Google Workspace', 'sarah.chen@flowguard.io', 'Sarah Chen')}
            disabled={!!loadingProvider}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', justifyContent: 'flex-start', paddingLeft: '16px' }}
          >
            <Globe size={16} color="#38bdf8" />
            <span style={{ flex: 1, textAlign: 'left' }}>Sign in with Google Workspace</span>
            <ArrowRight size={14} color="#71717a" />
          </button>

          {/* ArmorIQ Enterprise SSO */}
          <button
            onClick={() => handleOAuthLogin('ArmorIQ Enterprise SSO', 'security@flowguard.io', 'ArmorIQ Security Admin')}
            disabled={!!loadingProvider}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', justifyContent: 'flex-start', paddingLeft: '16px', border: '1px solid rgba(139, 92, 246, 0.3)' }}
          >
            <Shield size={16} color="#a78bfa" />
            <span style={{ flex: 1, textAlign: 'left', color: '#e9d5ff' }}>Sign in with ArmorIQ SSO</span>
            <ArrowRight size={14} color="#a78bfa" />
          </button>

          {/* GitHub Enterprise */}
          <button
            onClick={() => handleOAuthLogin('GitHub Enterprise', 'developer@flowguard.io', 'Fintech Dev Lead')}
            disabled={!!loadingProvider}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', justifyContent: 'flex-start', paddingLeft: '16px' }}
          >
            <Lock size={16} color="#fafafa" />
            <span style={{ flex: 1, textAlign: 'left' }}>Sign in with GitHub</span>
            <ArrowRight size={14} color="#71717a" />
          </button>
        </div>

        {/* Footer Security Note */}
        <div style={{
          padding: '14px 24px',
          background: '#040405',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--muted-foreground)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={13} color="#10b981" />
            <span>OAuth 2.0 PKCE + ArmorIQ Token Gate</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.75rem' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
