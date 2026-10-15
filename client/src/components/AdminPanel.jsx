import React, { useState, useEffect } from 'react';
import {
  Shield, Sliders, Globe, Users, Activity, CheckCircle2,
  AlertTriangle, Lock, Save, RefreshCw, UserPlus, Server, Key, ExternalLink
} from 'lucide-react';

export default function AdminPanel({ userSession, onLogout, onRefreshStatus }) {
  const [activeAdminTab, setActiveAdminTab] = useState('governance'); // 'governance' | 'corridors' | 'team' | 'telemetry'
  const [settings, setSettings] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'FINANCE_OPERATOR', department: 'Treasury' });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [settingsRes, usersRes, telemetryRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/users'),
        fetch('/api/admin/telemetry')
      ]);
      const sData = await settingsRes.json();
      const uData = await usersRes.json();
      const tData = await telemetryRes.json();

      setSettings(sData.settings);
      setTeamMembers(uData.members || []);
      setTelemetry(tData);
    } catch (err) {
      console.warn('Error fetching admin data:', err);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });
      const data = await res.json();
      if (data.success) {
        setTeamMembers([...teamMembers, data.member]);
        setShowInviteModal(false);
        setInviteForm({ name: '', email: '', role: 'FINANCE_OPERATOR', department: 'Treasury' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Vercel-style Admin Breadcrumb & Sub-header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
            <span>FlowGuard</span>
            <span>/</span>
            <span>Enterprise Settings</span>
            <span>/</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>Admin Governance Console</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>
            Governance, Policies & Corridor Controls
          </h1>
        </div>

        {/* Current Admin Identity & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--secondary)',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)'
          }}>
            <img
              src={userSession?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt="Admin Avatar"
              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>{userSession?.name || 'Alex Vance'}</span>
              <span style={{ color: '#71717a', marginLeft: '6px' }}>({userSession?.role || 'SUPER_ADMIN'})</span>
            </div>
          </div>
          <button onClick={onLogout} className="btn btn-outline btn-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* Shadcn Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: '#09090b',
        border: '1px solid var(--border)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        width: 'fit-content'
      }}>
        {[
          { id: 'governance', label: 'Policy & Guardrails', icon: Shield },
          { id: 'corridors', label: 'Airwallex Corridors', icon: Globe },
          { id: 'team', label: 'Team & Roles (OAuth)', icon: Users },
          { id: 'telemetry', label: 'System Telemetry', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#000000' : 'var(--muted-foreground)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} color={isActive ? '#000000' : '#a1a1aa'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GOVERNANCE & POLICIES */}
      {activeAdminTab === 'governance' && settings && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="shadcn-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>ArmorIQ Agent Policy Configuration</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                  Manage intent verification thresholds, autonomous limits, and fail-safe behaviors.
                </p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={14} />
                <span>{isSaving ? 'Saving...' : 'Publish Policy Changes'}</span>
              </button>
            </div>

            {saveSuccess && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={16} />
                <span>Policy configuration successfully updated and broadcast to ArmorIQ Agent Governance!</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Policy 1: ArmorIQ Fail Mode */}
              <div style={{ background: '#121215', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>ArmorIQ Enforcement Mode</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                      Controls whether transfers halt if ArmorIQ verification encounters an exception.
                    </p>
                  </div>
                  <span className={`badge ${settings.armorIqEnforcementMode === 'FAIL_CLOSED' ? 'badge-success' : 'badge-warning'}`}>
                    {settings.armorIqEnforcementMode}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={() => setSettings({ ...settings, armorIqEnforcementMode: 'FAIL_CLOSED' })}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      background: settings.armorIqEnforcementMode === 'FAIL_CLOSED' ? '#ffffff' : 'transparent',
                      color: settings.armorIqEnforcementMode === 'FAIL_CLOSED' ? '#000000' : '#a1a1aa',
                      border: '1px solid var(--border)'
                    }}
                  >
                    FAIL_CLOSED (Strict)
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, armorIqEnforcementMode: 'FAIL_OPEN' })}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      background: settings.armorIqEnforcementMode === 'FAIL_OPEN' ? '#ffffff' : 'transparent',
                      color: settings.armorIqEnforcementMode === 'FAIL_OPEN' ? '#000000' : '#a1a1aa',
                      border: '1px solid var(--border)'
                    }}
                  >
                    FAIL_OPEN (Permissive)
                  </button>
                </div>
              </div>

              {/* Policy 2: Single Payout Ceiling */}
              <div style={{ background: '#121215', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>Single Payout Limit</strong>
                  <span className="mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                    ${settings.singlePayoutLimitUsd?.toLocaleString()} USD
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                  Maximum amount an agent can disburse without board-level authorization.
                </p>
                <input
                  type="range"
                  min="10000"
                  max="100000"
                  step="5000"
                  value={settings.singlePayoutLimitUsd}
                  onChange={e => setSettings({ ...settings, singlePayoutLimitUsd: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#ffffff', cursor: 'pointer' }}
                />
              </div>

              {/* Policy 3: Strict Cash Reserve Enforcement */}
              <div style={{ background: '#121215', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>Strict Reserve Floor Inviolability</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                    Hard block on any payment that violates the $15,000 reserve buffer.
                  </p>
                </div>
                <div
                  className={`shadcn-switch ${settings.enforceReserveFloorStrict ? 'checked' : ''}`}
                  onClick={() => setSettings({ ...settings, enforceReserveFloorStrict: !settings.enforceReserveFloorStrict })}
                >
                  <div className="shadcn-switch-thumb"></div>
                </div>
              </div>

              {/* Policy 4: Auto-Halt Duplicate Invoices */}
              <div style={{ background: '#121215', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>Automated Duplicate Block</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                    Rejects intent tokens automatically when Levenshtein distance matches existing bills.
                  </p>
                </div>
                <div
                  className={`shadcn-switch ${settings.autoHaltDuplicateInvoices ? 'checked' : ''}`}
                  onClick={() => setSettings({ ...settings, autoHaltDuplicateInvoices: !settings.autoHaltDuplicateInvoices })}
                >
                  <div className="shadcn-switch-thumb"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AIRWALLEX CORRIDORS */}
      {activeAdminTab === 'corridors' && settings && (
        <div className="shadcn-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Active Payment Corridors & Fee Rules</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                Airwallex sandbox corridors configured for automated disbursement.
              </p>
            </div>
            <button onClick={handleSaveSettings} className="btn btn-primary btn-sm">
              <Save size={14} /> Update Corridors
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* US LOCAL */}
            <div style={{ background: '#121215', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>United States (USD)</div>
                <span className="badge badge-success">LOCAL $0.00 FEE</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Corridor: ACH / Fedwire · Instant settlement · Checking & Savings accounts
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Corridor Active</span>
                <div className="shadcn-switch checked">
                  <div className="shadcn-switch-thumb"></div>
                </div>
              </div>
            </div>

            {/* GB LOCAL */}
            <div style={{ background: '#121215', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>United Kingdom (GBP)</div>
                <span className="badge badge-success">LOCAL $0.00 FEE</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Corridor: UK Faster Payments · Sort Code & Account Number validation
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Corridor Active</span>
                <div className="shadcn-switch checked">
                  <div className="shadcn-switch-thumb"></div>
                </div>
              </div>
            </div>

            {/* DE SWIFT */}
            <div style={{ background: '#121215', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>European Union (EUR)</div>
                <span className="badge badge-warning">SWIFT EUR 12.85 FEE</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Corridor: Cross-Border SWIFT · Flat EUR 12.85 fee deducted from source wallet
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Corridor Active</span>
                <div className="shadcn-switch checked">
                  <div className="shadcn-switch-thumb"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEAM & ROLES (OAUTH) */}
      {activeAdminTab === 'team' && (
        <div className="shadcn-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Enterprise Access & Team Members</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                Users authenticated via OAuth 2.0 PKCE and assigned Airwallex payout approval roles.
              </p>
            </div>
            <button onClick={() => setShowInviteModal(true)} className="btn btn-primary btn-sm">
              <UserPlus size={14} /> Invite Member
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted-foreground)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px' }}>User</th>
                <th style={{ padding: '12px' }}>Role</th>
                <th style={{ padding: '12px' }}>Department</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{m.email}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{m.role}</span>
                  </td>
                  <td style={{ padding: '12px', color: '#a1a1aa' }}>{m.department}</td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-success">ACTIVE</span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--muted-foreground)' }}>{m.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SYSTEM TELEMETRY */}
      {activeAdminTab === 'telemetry' && telemetry && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="shadcn-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
              Airwallex API Latency
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '6px' }}>
              {telemetry.airwallexSandboxLatencyMs} ms
            </div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
              Average round-trip to api.sandbox.airwallex.com
            </div>
          </div>

          <div className="shadcn-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
              ArmorIQ Handshake
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa', marginTop: '6px' }}>
              {telemetry.armorIqHandshakeMs} ms
            </div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
              Ed25519 token minting & plan hash verification
            </div>
          </div>

          <div className="shadcn-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
              Sandbox Rate Limit Budget
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
              {telemetry.rateLimitRemaining} / 20 req/s
            </div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
              Enforced by Airwallex sandbox gateways
            </div>
          </div>

          <div className="shadcn-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
              System Error Budget
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
              {telemetry.errorBudgetPercent}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
              Deterministic fail-safe SLA
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Invite Enterprise Member</h3>
            </div>
            <form onSubmit={handleInviteSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g. Jordan Hayes"
                  className="shadcn-input"
                  style={{ marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>Work Email</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="jordan@flowguard.io"
                  className="shadcn-input"
                  style={{ marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>Role</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="shadcn-input"
                  style={{ marginTop: '4px' }}
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full control)</option>
                  <option value="FINANCE_DIRECTOR">FINANCE_DIRECTOR (Disbursement approval)</option>
                  <option value="COMPLIANCE_AUDITOR">COMPLIANCE_AUDITOR (Read-only logs)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Send OAuth Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
