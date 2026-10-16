import React, { useState } from 'react';
import {
  Shield, Activity, RefreshCw, Key, ChevronDown, CheckCircle2,
  AlertTriangle, Play, Lock, User, LogOut, Sliders, Video, X,
  ShieldCheck, Clock, ArrowDownCircle, Sun, Moon, Box
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
  onLogout,
  onOpenJudgeExplainer
}) {
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, isDark, toggleTheme } = useTheme();

  const scenarios = [
    {
      id: 'SCENARIO_A',
      title: 'Scenario A: Baseline Multi-Currency Run',
      desc: 'Standard operations, healthy liquidity reserve (₹12,97,500 floor), ₹0 local rails prioritized.',
      badge: 'NORMAL OPS',
      icon: ShieldCheck,
      color: '#34d399'
    },
    {
      id: 'SCENARIO_B',
      title: 'Scenario B: Duplicate Invoice Attack',
      desc: 'Injects candidate INV-2024-884B with 91.2% Levenshtein similarity to trigger the duplicate shield.',
      badge: 'ATTACK SIM',
      icon: AlertTriangle,
      color: '#f87171'
    },
    {
      id: 'SCENARIO_C',
      title: 'Scenario C: Delayed Receivable Shock',
      desc: 'Simulates a ₹12,54,250 customer receipt delay, auto-deferring low-priority vendor disbursements.',
      badge: 'LIQUIDITY STRESS',
      icon: Clock,
      color: '#fbbf24'
    },
    {
      id: 'SCENARIO_D',
      title: 'Scenario D: Sandbox Deposit (+ ₹20,00,000)',
      desc: 'Simulates Airwallex inbound deposit to replenish wallet balances and unlock held invoices.',
      badge: 'REPLENISHMENT',
      icon: ArrowDownCircle,
      color: '#60a5fa'
    }
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
            background: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
          }}>
            <img src="/logo.svg" alt="Veratone Logo" style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
                Vera<span style={{ color: '#10b981' }}>tone</span>
              </span>
              <span className="badge badge-live" style={{ fontSize: '0.62rem' }}>
                <span className="pulse-dot green"></span>
                ElevenLabs Voice
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.62rem' }} title="ArmorIQ Agent Intent Governance (Org: Vikas Sharma's Workspace)">
                <Shield size={10} color="#10b981" />
                ArmorIQ Live PEP
              </span>
              <span
                onClick={() => setActiveTab('admin')}
                className="badge"
                style={{
                  border: '1px solid rgba(192, 132, 252, 0.4)',
                  color: '#e9d5ff',
                  background: 'rgba(192, 132, 252, 0.12)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Model Context Protocol Server Active (/mcp & stdio)"
              >
                <span className="pulse-dot" style={{ background: '#c084fc' }}></span>
                MCP /mcp
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '1px' }}>
              Verifiable Voice AI Governed by ArmorIQ · Powered by ElevenLabs
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
            { id: 'enclave', label: '3D Enclave', is3D: true },
            { id: 'planner', label: 'Payment Planner' },
            { id: 'invoices', label: 'Invoice & Risk Guard' },
            { id: 'voice', label: 'Voice Gateway', isVoice: true },
            { id: 'audit', label: 'Audit Trail & API' },
            { id: 'admin', label: 'Admin & Governance', isSpecial: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--secondary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)',
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
              {tab.is3D && <Box size={13} color={activeTab === tab.id ? '#6366f1' : 'var(--muted-foreground)'} />}
              {tab.isSpecial && <Lock size={12} color={activeTab === tab.id ? 'var(--foreground)' : '#71717a'} />}
              {tab.label}
              {tab.isVoice && (
                <span style={{
                  fontSize: '0.6rem',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 700
                }}>
                  ElevenLabs
                </span>
              )}
              {tab.isSpecial && (
                <span style={{
                  fontSize: '0.62rem',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  background: userSession?.authenticated ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.06)',
                  color: userSession?.authenticated ? '#34d399' : 'var(--muted-foreground)',
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
          {/* Theme Toggle Button (Light/Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              border: '1px solid var(--border)',
              background: 'var(--secondary)',
              color: 'var(--foreground)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Current theme: ${theme} (click to switch to ${isDark ? 'light' : 'dark'} mode)`}
          >
            {isDark ? (
              <>
                <Sun size={14} color="#fbbf24" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Light</span>
              </>
            ) : (
              <>
                <Moon size={14} color="#6366f1" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Dark</span>
              </>
            )}
          </button>

          {/* Judge Video & Presentation Button */}
          <button
            onClick={onOpenJudgeExplainer}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--foreground)'
            }}
            title="Open Judge Video Script, Veo 3 Prompts & Presentation Rubric"
          >
            <Video size={13} color="var(--foreground)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Judge Video & Demo</span>
          </button>

          {/* Scenario Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setScenarioOpen(!scenarioOpen)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                minWidth: '170px',
                justifyContent: 'space-between',
                background: scenarioOpen ? 'var(--secondary)' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={12} color="#ffffff" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{currentScenarioObj.title.split(':')[0]}</span>
              </div>
              <ChevronDown size={13} />
            </button>

            {/* Click-away backdrop to fix popup dismissal */}
            {scenarioOpen && (
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 140 }}
                onClick={() => setScenarioOpen(false)}
              />
            )}

            {scenarioOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '115%',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                width: '360px',
                boxShadow: 'var(--card-shadow)',
                zIndex: 150,
                padding: '10px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px 10px 8px',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Hackathon Demo Scenarios
                  </div>
                  <button
                    onClick={() => setScenarioOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {scenarios.map(s => {
                    const isSelected = systemStatus?.activeScenario === s.id;
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectScenario(s.id);
                          setScenarioOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--secondary)' : '#121215',
                          border: isSelected ? '1px solid #ffffff' : '1px solid var(--border)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon size={14} color={s.color} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                              {s.title}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="badge badge-live" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              Active
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                          {s.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  {userSession.user?.name ? userSession.user.name[0].toUpperCase() : 'B'}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{userSession.user?.name || 'beyond_nothing'}</span>
                <ChevronDown size={12} color="#a1a1aa" />
              </button>

              {/* Click-away backdrop for user menu */}
              {userMenuOpen && (
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 140 }}
                  onClick={() => setUserMenuOpen(false)}
                />
              )}

              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  width: '220px',
                  boxShadow: 'var(--card-shadow)',
                  zIndex: 150,
                  padding: '6px'
                }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fafafa' }}>{userSession.user?.name || 'beyond_nothing'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{userSession.user?.email || 'beyond_nothing@flowguard.io'}</div>
                    <div style={{ marginTop: '4px' }}>
                      <span className="badge badge-live" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        {userSession.user?.role || 'SUPER_ADMIN'}
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
