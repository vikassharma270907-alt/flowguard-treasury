import React, { useState } from 'react';
import { Shield, Activity, RefreshCw, Key, ChevronDown, CheckCircle2, AlertTriangle, Play, Lock, User, LogOut, Sliders } from 'lucide-react';

export default function Navbar({
  systemStatus,
  activeTab,
  setActiveTab,
  onOpenCredentials,
  onSelectScenario,
  isRefreshing,
  onRefresh,
  userSession,
  onOpenOAuth,
  onLogout
}) {
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const scenarios = [
    { id: 'SCENARIO_A', label: 'Scenario A: Baseline Multi-Currency Run', desc: 'Standard operations, healthy cash reserve' },
    { id: 'SCENARIO_B', label: 'Scenario B: Duplicate Invoice Attack', desc: 'Injects duplicate candidate INV-2024-884B' },
    { id: 'SCENARIO_C', label: 'Scenario C: Delayed Receivable Shock', desc: 'Customer receipt delayed, auto-defers bills' },
    { id: 'SCENARIO_D', label: 'Scenario D: Sandbox Deposit (+ $25,000)', desc: 'Replenishes wallet via Airwallex deposit simulator' }
  ];

  const currentScenarioObj = scenarios.find(s => s.id === systemStatus?.activeScenario) || scenarios[0];

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand & Sandbox Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)'
          }}>
            <svg width="18" height="16" viewBox="0 0 76 65" fill="#000000">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fafafa' }}>
                Flow<span style={{ color: '#a1a1aa' }}>Guard</span>
              </span>
              <span className={`badge ${systemStatus?.isLiveSandbox ? 'badge-live' : 'badge-mock'}`}>
                <span className={`pulse-dot ${systemStatus?.isLiveSandbox ? 'green' : 'amber'}`}></span>
                {systemStatus?.isLiveSandbox ? 'Airwallex Live' : 'Airwallex Mock'}
              </span>
              <span className={`badge ${systemStatus?.armorIq?.isConfigured ? 'badge-live' : 'badge-neutral'}`} title="ArmorIQ Agent Intent Governance & Policy Assurance">
                <Shield size={10} color={systemStatus?.armorIq?.isConfigured ? '#34d399' : '#a1a1aa'} />
                {systemStatus?.armorIq?.isConfigured ? 'ArmorIQ Live API' : 'ArmorIQ Guard'}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '1px' }}>
              Adaptive Treasury Controller · Airwallex Sandbox + ArmorIQ Intent Security
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--card)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'planner', label: 'Payment Planner' },
            { id: 'invoices', label: 'Invoice & Risk Guard' },
            { id: 'audit', label: 'Audit Trail & API' },
            { id: 'admin', label: 'Admin & Governance', isSpecial: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--secondary)' : 'transparent',
                color: activeTab === tab.id ? '#fafafa' : 'var(--muted-foreground)',
                border: activeTab === tab.id ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab.isSpecial && <Lock size={12} color={activeTab === tab.id ? '#ffffff' : '#71717a'} />}
              {tab.label}
              {tab.isSpecial && (
                <span style={{
                  fontSize: '0.62rem',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  background: userSession?.authenticated ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
                  color: userSession?.authenticated ? '#34d399' : '#a1a1aa',
                  border: '1px solid var(--border)',
                  fontWeight: 600
                }}>
                  {userSession?.authenticated ? 'OAuth Active' : 'OAuth'}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Actions & Scenario Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Scenario Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setScenarioOpen(!scenarioOpen)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '170px', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={12} color="#ffffff" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{currentScenarioObj.label.split(':')[0]}</span>
              </div>
              <ChevronDown size={13} />
            </button>

            {scenarioOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '115%',
                background: '#09090b',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                width: '320px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                zIndex: 200,
                padding: '6px'
              }}>
                <div style={{ padding: '6px 10px', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Demo Presentation Scenarios
                </div>
                {scenarios.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectScenario(s.id);
                      setScenarioOpen(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: systemStatus?.activeScenario === s.id ? 'var(--secondary)' : 'transparent',
                      borderLeft: systemStatus?.activeScenario === s.id ? '2px solid #ffffff' : '2px solid transparent',
                      marginBottom: '2px'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>{s.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh sandbox balances and recalculate plan"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
          </button>

          {/* Sandbox Credentials Modal Button */}
          <button
            onClick={onOpenCredentials}
            className="btn btn-secondary btn-sm"
          >
            <Key size={13} color="#a1a1aa" />
            <span style={{ fontSize: '0.78rem' }}>Keys</span>
          </button>

          {/* OAuth User Profile / Login Button */}
          {userSession?.authenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #27272a, #3f3f46)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {userSession.user?.name ? userSession.user.name[0] : 'A'}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{userSession.user?.name || 'Admin'}</span>
                <ChevronDown size={12} color="#a1a1aa" />
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  background: '#09090b',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  width: '220px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                  zIndex: 200,
                  padding: '6px'
                }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fafafa' }}>{userSession.user?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{userSession.user?.email}</div>
                    <div style={{ marginTop: '4px' }}>
                      <span className="badge badge-live" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        {userSession.user?.role}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setUserMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#fafafa',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        textAlign: 'left'
                      }}
                    >
                      <Sliders size={13} />
                      Admin Console
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setUserMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        textAlign: 'left'
                      }}
                    >
                      <LogOut size={13} />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenOAuth}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Lock size={12} />
              <span>Admin Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
