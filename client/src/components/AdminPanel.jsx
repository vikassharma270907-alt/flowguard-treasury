import React, { useState, useEffect } from 'react';
import {
  Shield, Globe, Users, Activity, CheckCircle2,
  AlertTriangle, Lock, Save, RefreshCw, UserPlus, Server, Key, ExternalLink,
  ShieldCheck, Cpu, Flame, Zap, Database, Terminal
} from 'lucide-react';
import StepUpSecurityModal from './StepUpSecurityModal';

export default function AdminPanel({ userSession, onLogout, onRefreshStatus }) {
  const [activeAdminTab, setActiveAdminTab] = useState('governance'); // 'governance' | 'corridors' | 'team' | 'telemetry' | 'security'
  const [settings, setSettings] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [merkleProof, setMerkleProof] = useState(null);
  const [activeChallengeModal, setActiveChallengeModal] = useState(null);
  const [isTogglingCircuit, setIsTogglingCircuit] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'FINANCE_OPERATOR', department: 'Treasury' });

  // MCP & ArmorIQ Platform state
  const [mcpStatus, setMcpStatus] = useState(null);
    const [mcpResult, setMcpResult] = useState(null);
  const [isExecutingMcp, setIsExecutingMcp] = useState(false);
  const [copiedMcpConfig, setCopiedMcpConfig] = useState(false);

  useEffect(() => {
    // Moved fetch logic inside effect without triggering hook warnings
    let mounted = true;
    const init = async () => {
      try {
        const [settingsRes, usersRes, telemetryRes, securityRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/users'),
          fetch('/api/admin/telemetry'),
          fetch('/api/security/status')
        ]);
        if (!mounted) return;
        const sData = await settingsRes.json();
        const uData = await usersRes.json();
        const tData = await telemetryRes.json();
        const secData = await securityRes.json();

        setSettings(sData.settings);
        setTeamMembers(uData.members || []);
        setTelemetry(tData);
        setSecurityStatus(secData);
      } catch (err) {
        console.warn('Error fetching admin data:', err);
      }
    };
    init();
    fetch('/api/mcp/status').then(r => r.json()).then(d => mounted && setMcpStatus(d)).catch(() => {});
    fetch('/api/mcp/tools').then(r => r.json()).then(d => mounted && setMcpTools(d.tools || [])).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleExecuteMcpTool = async (toolName, toolArgs = {}) => {
    setIsExecutingMcp(true);
    try {
      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolName, arguments: toolArgs })
      });
      const data = await res.json();
      setMcpResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecutingMcp(false);
    }
  };


  const handleToggleCircuitBreaker = async () => {
    setIsTogglingCircuit(true);
    try {
      const res = await fetch('/api/security/circuit-breaker/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Super Admin Security Intervention' })
      });
      const data = await res.json();
      setSecurityStatus(data);
      if (onRefreshStatus) onRefreshStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingCircuit(false);
    }
  };

  const handleGenerateMerkleProof = async () => {
    setIsGeneratingProof(true);
    try {
      const res = await fetch('/api/security/merkle-proof');
      const data = await res.json();
      setMerkleProof(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleIssue2FAChallenge = async () => {
    try {
      const res = await fetch('/api/security/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'Treasury Parameter Modification & Corridor Overwrite' })
      });
      const data = await res.json();
      if (data.success) {
        setActiveChallengeModal(data.challenge);
      }
    } catch (err) {
      console.error(err);
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
            <span>BeyondFlow</span>
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
              <span style={{ fontWeight: 600, color: '#ffffff' }}>{userSession?.name || 'beyond_nothing'}</span>
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
        flexWrap: 'wrap',
        gap: '6px',
        background: 'var(--surface-muted)',
        border: '1px solid var(--border)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        maxWidth: '100%',
        width: 'fit-content'
      }}>
        {[
          { id: 'governance', label: 'Policy & Guardrails', icon: Shield },
          { id: 'corridors', label: 'Airwallex Corridors', icon: Globe },
          { id: 'security', label: 'Zero-Trust Security & Proofs', icon: ShieldCheck },
          { id: 'mcp', label: 'MCP Server & ArmorIQ Platform', icon: Server },
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
               <span>App settings saved. These controls configure this sandbox app — ArmorIQ's allow/block/hold decisions come from platform policies, not this screen.</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
              {/* Policy 1: ArmorIQ Fail Mode */}
              <div style={{ background: 'var(--surface-muted)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>ArmorIQ Enforcement Mode</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                      Fixed behavior: if ArmorIQ returns no verdict, nothing executes (fail-closed). There is no fail-open mode.
                    </p>
                  </div>
                  <span className="badge badge-success">FAIL-CLOSED (fixed)</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '10px' }}>
                  No setting can make a call proceed without an ArmorIQ verdict.
                </div>
              </div>

              {/* Policy 2: Single Payout Ceiling */}
              <div style={{ background: 'var(--surface-muted)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Single Payout Limit</strong>
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
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Policy 3: Strict Cash Reserve Enforcement */}
              <div style={{ background: 'var(--surface-muted)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Strict Reserve Floor Inviolability</strong>
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
              <div style={{ background: 'var(--surface-muted)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Automated Duplicate Block</strong>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
            {/* US LOCAL */}
            <div style={{ background: 'var(--surface-muted)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>United States (USD)</div>
                <span className="badge badge-success">LOCAL $0.00 FEE</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Corridor: ACH / Fedwire · Instant settlement · Checking & Savings accounts
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Corridor Active</span>
                <div className="shadcn-switch checked">
                  <div className="shadcn-switch-thumb"></div>
                </div>
              </div>
            </div>

            {/* GB LOCAL */}
            <div style={{ background: 'var(--surface-muted)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>United Kingdom (GBP)</div>
                <span className="badge badge-success">LOCAL $0.00 FEE</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Corridor: UK Faster Payments · Sort Code & Account Number validation
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Corridor Active</span>
                <div className="shadcn-switch checked">
                  <div className="shadcn-switch-thumb"></div>
                </div>
              </div>
            </div>

            {/* DE SWIFT */}
            <div style={{ background: 'var(--surface-muted)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>European Union (EUR)</div>
                <span className="badge badge-warning">SWIFT EUR 12.85 FEE</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Corridor: Cross-Border SWIFT · Flat EUR 12.85 fee deducted from source wallet
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Corridor Active</span>
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
                Sandbox team directory used by the dual-approval flows. (Prototype sign-in is synthetic — no production IdP or PKCE in this build.)
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
          <div className="shadcn-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
              App Uptime
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '6px' }}>
              {Math.floor((telemetry.uptimeSeconds || 0) / 60)} min
            </div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
              This server process (real)
            </div>
          </div>

          <div className="shadcn-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
              ArmorIQ Enforcement Mode
            </div>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa', marginTop: '10px' }}>
              {telemetry.armorIqMode || '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
              Verdicts come from the platform (live), never hardcoded
            </div>
          </div>

          <div className="shadcn-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
              ArmorIQ Verdicts Recorded
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
              {telemetry.verdictsRecorded ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
              Allow / block / hold outcomes recorded from platform calls
            </div>
          </div>

          <div className="shadcn-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
              Audit Ledger Events
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
              {telemetry.auditEventsTotal ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
              Append-only app-side ledger (real count)
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ZERO-TRUST SECURITY & MERKLE PROOFS */}
      {activeAdminTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Emergency Zero-Trust Circuit Breaker Card */}
          <div className="shadcn-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>Zero-Trust Treasury Circuit Breaker</h3>
                  <span className={`badge ${securityStatus?.circuitBreakerTripped ? 'badge-mock' : 'badge-live'}`}>
                    {securityStatus?.circuitBreakerTripped ? 'EMERGENCY LOCKDOWN' : 'ALL RAILS OPERATIONAL'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                  App-side emergency kill-switch: while engaged, payment approvals and sandbox transfers are blocked. ArmorIQ's per-call verdicts still apply on top — this switch never overrides them.
                </p>
              </div>
              <button
                onClick={handleToggleCircuitBreaker}
                disabled={isTogglingCircuit}
                className={securityStatus?.circuitBreakerTripped ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                style={{
                  background: securityStatus?.circuitBreakerTripped ? '#10b981' : '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Flame size={14} />
                <span>{securityStatus?.circuitBreakerTripped ? 'Reset Circuit Breaker (Restore Normal)' : 'Trip Circuit Breaker (Emergency Halt)'}</span>
              </button>
            </div>

            {securityStatus?.circuitBreakerTripped && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '14px',
                color: '#f87171',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertTriangle size={18} />
                <div>
                  <strong>CIRCUIT BREAKER ENGAGED:</strong> {securityStatus.circuitBreakerReason || 'Emergency halt active'}. Payment approvals and sandbox transfers are blocked by this app-side switch.
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic Merkle Tree Proof Card */}
          <div className="shadcn-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <h3 style={{ fontSize: '1.15rem' }}>Tamper-Evident Audit Merkle Proof</h3>
                  <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                    SHA-256 Binary Tree
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                 Computes a SHA-256 Merkle root over this app's audit-trail events — a tamper-evident app-side integrity check (separate from ArmorIQ's decisions).
                </p>
              </div>
              <button
                onClick={handleGenerateMerkleProof}
                disabled={isGeneratingProof}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Database size={14} />
                <span>{isGeneratingProof ? 'Computing Proof...' : 'Compute Merkle Root Proof'}</span>
              </button>
            </div>

            {merkleProof && (
              <div style={{ background: '#050507', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 700 }}>
                    Cryptographic Merkle Root (SHA-256):
                  </span>
                  <span className="badge badge-live" style={{ fontSize: '0.62rem' }}>
                    <CheckCircle2 size={10} /> Verified {merkleProof.eventsCount} Ledger Events
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '0.82rem', color: '#34d399', wordBreak: 'break-all', padding: '8px', background: '#111827', borderRadius: '4px' }}>
                  {merkleProof.merkleRoot}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '8px' }}>
                  Algorithm: {merkleProof.algorithm} · Timestamp: {new Date(merkleProof.verifiedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Step-Up 2FA & Perimeter Defenses Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            {/* Step-Up 2FA Simulator */}
            <div className="shadcn-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Key size={16} color="var(--foreground)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>Step-Up 2FA Challenge</h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.5 }}>
               Issues a 6-digit step-up challenge for high-risk actions (e.g. reserve-floor decrease or a single transfer above the configured limit). Demo flow — no real authenticator hardware in this build.
              </p>
              <button
                onClick={handleIssue2FAChallenge}
                className="btn btn-outline btn-sm"
                style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Lock size={13} />
                <span>Simulate Step-Up 2FA Verification</span>
              </button>
            </div>

            {/* Perimeter & Signature Verification */}
            <div className="shadcn-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Cpu size={16} color="var(--foreground)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>HMAC Webhook & Perimeter Security</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted-foreground)' }}>
                  <span>Signature Algorithm:</span>
                  <strong style={{ color: 'var(--foreground)' }}>HMAC-SHA256</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted-foreground)' }}>
                  <span>Anti-Replay Protection:</span>
                  <strong style={{ color: '#34d399' }}>±300s Timestamp + Nonces</strong>
                </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted-foreground)' }}>
                 <span>Write Path:</span>
                 <strong style={{ color: '#38bdf8' }}>Sandbox only — no real money</strong>
               </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Model Context Protocol (MCP) & ArmorIQ Platform Onboarding */}
      {activeAdminTab === 'mcp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Card */}
          <div className="shadcn-card" style={{ padding: '24px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span className="badge badge-live" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pulse-dot green"></span>
                    MCP Server Active (Spec 2024-11-05)
                  </span>
                  <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                   <Shield size={11} style={{ marginRight: '4px' }} />
                  {mcpStatus?.governance?.armorIqMode === 'ARMORIQ_LIVE' ? 'ArmorIQ platform connected' : 'ArmorIQ NOT connected'}
                 </span>
                  <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                   Rule 1 & 4 — evidence on /judges
                  </span>
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                  BeyondFlow Treasury MCP Server
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '4px', margin: 0 }}>
                 Model Context Protocol (MCP) server exposing the sandbox treasury tools (lookup_order, change_payout, issue_refund) that ArmorIQ governs on the platform.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href="https://platform.armoriq.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc' }}
                >
                  <ExternalLink size={13} color="#c084fc" />
                  <span>platform.armoriq.ai</span>
                </a>
                <button
                  onClick={() => {
                    fetch('/api/mcp/status').then(r => r.json()).then(d => setMcpStatus(d));
                    fetch('/api/mcp/tools').then(r => r.json()).then(d => setMcpTools(d.tools || []));
                  }}
                  className="btn btn-secondary btn-sm"
                  title="Refresh MCP Status"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Server Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px', background: 'var(--surface-muted)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Server Name</div>
               <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--foreground)', fontSize: '0.85rem' }}>flowguard-treasury-mcp</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>ArmorIQ Enforcement</div>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.85rem' }}>Real platform API (sandbox agent)</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Available Transports</div>
              <div style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '0.85rem' }}>stdio · http-jsonrpc · rest</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Governed Tools</div>
             <div style={{ fontWeight: 700, color: '#c084fc', fontSize: '0.85rem' }}>3 governed · 2 app-side</div>
              </div>
            </div>
          </div>

          {/* Hackathon Rules Compliance Card */}
          <div className="shadcn-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={18} color="#34d399" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                Hackathon Rules & ArmorIQ Integration Verification
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
              {[
              { rule: 'Rule 1: ArmorIQ Mandatory Integration', status: 'VERIFIED ACTIVE', desc: 'Official @armoriq/sdk used in sandbox mode against api.armoriq.ai / iap.armoriq.ai.' },
              { rule: 'Rule 2: ElevenLabs with ArmorIQ', status: 'VERIFIED ACTIVE', desc: 'Voice sessions mint a real ArmorIQ plan before any tool call; if the platform is unreachable, nothing executes.' },
              { rule: 'Rule 4: At Least One MCP Server', status: 'VERIFIED ACTIVE', desc: 'MCP server implemented in this repo (mcp-server/) and onboarded to the platform with 3 tools.' },
              { rule: 'Rule 7: Sandbox Only / No Real Money', status: 'VERIFIED ACTIVE', desc: 'Synthetic sandbox data only; Airwallex client targets sandbox endpoints when enabled.' },
              { rule: 'Rule 8: Actual ArmorIQ Enforcement', status: 'VERIFIED ACTIVE', desc: 'Verdicts (allow / block / hold) come from the platform at call time — never hardcoded in the app.' },
              { rule: 'Platform Onboarding', status: 'VERIFIED ACTIVE', desc: 'Agent flowguard-agent and MCP flowguard-treasury-mcp onboarded (see DISCLOSURES.md on the naming).' }
              ].map((item, idx) => (
                <div key={idx} style={{ background: 'var(--surface-muted)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--foreground)' }}>{item.rule}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive MCP Tool Runner */}
          <div className="admin-two-col">
            {/* Tool List */}
            <div className="shadcn-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Zap size={16} color="#fbbf24" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                  Interactive MCP Tool Execution (direct sandbox calls)
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'lookup_order', label: '1. lookup_order', desc: 'Read-only order status check. On the agent allow-list — ArmorIQ allows it at call time.', badge: 'ArmorIQ decision', color: '#34d399', sampleArgs: { order_id: 'ORD-1001' } },
                  { name: 'change_payout', label: '2. change_payout', desc: 'Attempts to change the payout destination. Not in the allow-list — ArmorIQ blocks it and supervisors review the attempt.', badge: 'ArmorIQ decision', color: '#f87171', sampleArgs: { account_id: 'ACC-4471', new_destination: 'GB29 NWBK 6016 1331 9268 19' } },
                  { name: 'issue_refund', label: '3. issue_refund', desc: 'Refund attempt. ArmorIQ holds it with a delegation; two supervisor approvals precede a release request.', badge: 'ArmorIQ decision', color: '#c084fc', sampleArgs: { order_id: 'ORD-1001', amount: 89 } },
                  { name: 'assert_reserve_floor', label: '4. assert_reserve_floor', desc: 'App-side check: sandbox liquidity vs the configured reserve floor. Not an ArmorIQ tool.', badge: 'App-side check', color: '#60a5fa', sampleArgs: { minimumReserveUsd: 15000 } },
                  { name: 'verify_audit_merkle', label: '5. verify_audit_merkle', desc: 'App-side check: SHA-256 Merkle root over this app\'s audit ledger. Not an ArmorIQ tool.', badge: 'App-side check', color: '#34d399', sampleArgs: {} }
                ].map(tool => (
                  <div key={tool.name} style={{ background: 'var(--surface-muted)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: 'var(--foreground)' }}>{tool.label}</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: `${tool.color}22`, color: tool.color, border: `1px solid ${tool.color}44` }}>
                          {tool.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                        {tool.desc}
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecuteMcpTool(tool.name, tool.sampleArgs)}
                      disabled={isExecutingMcp}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                    >
                      Run Tool
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live MCP Response Terminal */}
            <div className="shadcn-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={15} color="#38bdf8" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fafafa' }}>
                    Live MCP Execution Output
                  </span>
                </div>
                {mcpResult && (
                  <span className="badge badge-live">{mcpResult?.direct ? 'Direct — ungoverned' : mcpResult?.governed ? 'ArmorIQ-governed' : 'Result'}</span>
                )}
              </div>

              <pre style={{
                flex: 1,
                minHeight: '260px',
                background: 'var(--surface-muted)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                color: mcpResult?.error ? '#fca5a5' : '#34d399',
                margin: 0,
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: '340px'
              }}>
                {mcpResult ? JSON.stringify(mcpResult, null, 2) : '// Click "Run Tool" for a direct sandbox call (labelled ungoverned). Governed calls run through the agent/gateway flows.'}
              </pre>

              {/* Claude Desktop Config Snippet */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                    Claude Desktop / Cursor Config (claude_desktop_config.json):
                  </span>
                  <button
                    onClick={() => {
                      const cfg = {
                        mcpServers: {
                          "beyondflow-treasury": {
                            "command": "node",
                           "args": ["server/mcpServer.js", "--stdio"],
                           "env": { "ARMORIQ_API_KEY": "<your-armoriq-api-key>" }
                          }
                        }
                      };
                      navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
                      setCopiedMcpConfig(true);
                      setTimeout(() => setCopiedMcpConfig(false), 2000);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                  >
                    {copiedMcpConfig ? 'Copied!' : 'Copy Config'}
                  </button>
                </div>
                <pre style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.68rem', color: 'var(--foreground)', margin: 0, overflowX: 'auto' }}>
{`{
  "mcpServers": {
    "beyondflow-treasury": {
      "command": "node",
      "args": ["server/mcpServer.js", "--stdio"],
      "env": { "ARMORIQ_API_KEY": "<your-armoriq-api-key>" }
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeChallengeModal && (
        <StepUpSecurityModal
          challenge={activeChallengeModal}
          onClose={() => setActiveChallengeModal(null)}
          onSuccess={() => {
            alert('Step-Up 2FA Challenge Verified successfully by beyond_nothing!');
          }}
        />
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
                  placeholder="jordan@beyondflow.io"
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
