import React, { useState } from 'react';
import {  ShieldCheck } from 'lucide-react';

export default function StepUpSecurityModal({ challenge, onClose, onSuccess }) {
  const [code, setCode] = useState(challenge?.code || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/security/verify-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.challengeId, code })
      });
      const data = await res.json();
      if (data.verified) {
        onSuccess();
        onClose();
      } else {
        setError(data.reason || 'Verification failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 350 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <ShieldCheck size={24} color="var(--primary-foreground)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
            Step-Up 2FA Security Challenge
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            High-privilege treasury action requested by <strong>beyond_nothing</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--surface-muted)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700 }}>
              Action Requiring Authorization:
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', fontWeight: 600, marginTop: '2px' }}>
              {challenge?.action || 'Sensitive Treasury Modification'}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: '6px' }}>
              6-Digit Authenticator OTP Code:
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value)}
              className="input-field"
              placeholder="749201"
              style={{
                textAlign: 'center',
                letterSpacing: '0.3em',
                fontSize: '1.2rem',
                fontWeight: 700,
                padding: '10px'
              }}
              required
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '4px', textAlign: 'center' }}>
              (Pre-filled with simulated cryptographic authenticator token)
            </p>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '0.78rem', color: '#f87171' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={isVerifying} className="btn btn-primary" style={{ flex: 1 }}>
              {isVerifying ? 'Verifying...' : 'Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
