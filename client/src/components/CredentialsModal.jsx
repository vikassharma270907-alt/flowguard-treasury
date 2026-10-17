import React, { useState } from 'react';
import { X, Key, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, Shield } from 'lucide-react';

export default function CredentialsModal({ onClose, onSaveCredentials, onSaveArmorIq, currentStatus }) {
  const [activeSubTab, setActiveSubTab] = useState('airwallex'); // 'airwallex' | 'armoriq'

  // Airwallex state
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testingAwx, setTestingAwx] = useState(false);
  const [awxResult, setAwxResult] = useState(null);

  // ArmorIQ state
  const [armorIqKey, setArmorIqKey] = useState('');
  const [testingAiq, setTestingAiq] = useState(false);
  const [aiqResult, setAiqResult] = useState(null);

  const handleAwxSubmit = async (e) => {
    e.preventDefault();
    setTestingAwx(true);
    setAwxResult(null);
    try {
      const res = await onSaveCredentials(clientId, apiKey);
      setAwxResult({
        success: res.success,
        text: res.message || (res.success ? 'Connected successfully to Airwallex Sandbox API!' : 'Authentication failed')
      });
    } catch (err) {
      setAwxResult({ success: false, text: err.message });
    } finally {
      setTestingAwx(false);
    }
  };

  const handleAiqSubmit = async (e) => {
    e.preventDefault();
    setTestingAiq(true);
    setAiqResult(null);
    try {
      const res = await fetch('/api/config/armoriq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: armorIqKey })
      });
      const data = await res.json();
      setAiqResult({
        success: data.success,
        text: data.message || 'ArmorIQ API Key registered successfully.'
      });
    } catch (err) {
      setAiqResult({ success: false, text: err.message });
    } finally {
      setTestingAiq(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={18} color="#6366f1" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>API Connections & Credentials</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
          <button
            onClick={() => setActiveSubTab('airwallex')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeSubTab === 'airwallex' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeSubTab === 'airwallex' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeSubTab === 'airwallex' ? '2px solid #6366f1' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Airwallex Sandbox
          </button>
          <button
            onClick={() => setActiveSubTab('armoriq')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeSubTab === 'armoriq' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeSubTab === 'armoriq' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeSubTab === 'armoriq' ? '2px solid #8b5cf6' : '2px solid transparent',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Shield size={14} color="#a78bfa" />
            ArmorIQ Intent API
          </button>
        </div>

        {activeSubTab === 'airwallex' && (
          <form onSubmit={handleAwxSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.8rem',
              color: '#c7d2fe'
            }}>
              <strong>Airwallex Sandbox:</strong> Obtain keys from{' '}
              <a href="https://sandbox.airwallex.com" target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>
                sandbox.airwallex.com
              </a>{' '}
              (Account &gt; Developer &gt; API keys). Never use live production credentials.
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Sandbox Client ID (x-client-id)
              </label>
              <input
                type="text"
                required
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="e.g. 1a2b3c4d-5e6f-..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Sandbox API Key (x-api-key)
              </label>
              <input
                type="password"
                required
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Enter your sandbox API key"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            {awxResult && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: awxResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${awxResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                fontSize: '0.82rem',
                color: awxResult.success ? '#34d399' : '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {awxResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{awxResult.text}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                Close
              </button>
              <button type="submit" disabled={testingAwx} className="btn btn-primary btn-sm">
                {testingAwx ? 'Testing Sandbox Login...' : 'Test & Connect Airwallex'}
              </button>
            </div>
          </form>
        )}

        {activeSubTab === 'armoriq' && (
          <form onSubmit={handleAiqSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.8rem',
              color: '#ddd6fe'
            }}>
              <strong>ArmorIQ Intent Assurance:</strong> Connect your ArmorIQ platform key from{' '}
              <a href="https://platform.armoriq.ai" target="_blank" rel="noreferrer" style={{ color: '#a78bfa', textDecoration: 'underline' }}>
                platform.armoriq.ai
              </a>{' '}
              to cryptographically verify AI agent actions, enforce reserve policies, and mint Intent Tokens before calling Airwallex.
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                ArmorIQ Platform API Key
              </label>
              <input
                type="password"
                required
                value={armorIqKey}
                onChange={e => setArmorIqKey(e.target.value)}
                placeholder="ak_test_..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                If left blank, BeyondFlow automatically uses ArmorIQ Cryptographic Intent Simulation.
              </span>
            </div>

            {aiqResult && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: aiqResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${aiqResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                fontSize: '0.82rem',
                color: aiqResult.success ? '#34d399' : '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {aiqResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{aiqResult.text}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                Close
              </button>
              <button type="submit" disabled={testingAiq} className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                {testingAiq ? 'Verifying ArmorIQ Key...' : 'Connect ArmorIQ API'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
