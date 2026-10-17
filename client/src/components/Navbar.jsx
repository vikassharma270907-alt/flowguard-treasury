import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Activity, RefreshCw, Key, ChevronDown, CheckCircle2,
  AlertTriangle, Play, Lock, User, LogOut, Sliders, X,
  ShieldCheck, Clock, ArrowDownCircle, Sun, Moon, Box, ArrowRight, Video
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
  onLogout
}) {
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, isDark, toggleTheme } = useTheme();
  const scenarioMenuRef = useRef(null);

  useEffect(() => {
    if (!scenarioOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setScenarioOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(e.target)) {
        setScenarioOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [scenarioOpen]);

  const scenarios = [
    {
      id: 'SCENARIO_A',
      title: 'Scenario A: Baseline Multi-Currency Run',
      desc: 'Standard operations, healthy liquidity reserve ($15,000 floor), $0 local rails prioritized.',
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
      desc: 'Simulates a $14,500 customer receipt delay, auto-deferring low-priority vendor disbursements.',
      badge: 'LIQUIDITY STRESS',
      icon: Clock,
      color: '#fbbf24'
    },
    {
      id: 'SCENARIO_D',
      title: 'Scenario D: Sandbox Deposit (+ $25,000)',
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
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Brand & Sandbox Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', maxWidth: '100%' }}>
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
            <img src="/logo.svg" alt="BeyondFlow Logo" style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
                Beyond<span style={{ color: '#10b981' }}>Flow</span>
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
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          overflowX: 'auto',
          maxWidth: '100%',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'video', label: '3-Min Video', isVideo: true },
            { id: 'scenarios', label: 'Demo Scenarios', isScenario: true },
            { id: 'enclave', label: 'How It Works', is3D: true },
            { id: 'planner', label: 'Payment Planner' },
            { id: 'invoices', label: 'Invoice & Risk Guard' },
            { id: 'voice', label: 'Voice Gateway', isVoice: true },
            { id: 'audit', label: 'Audit Trail & API' },
            { id: 'admin', label: 'Admin & Governance', isSpecial: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
              }}
              style={{
                background: activeTab === tab.id ? 'var(--secondary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                border: activeTab === tab.id ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                minHeight: '38px'
              }}
            >
              {tab.isVideo && <Video size={13} color="#818cf8" />}
              {tab.isScenario && <Play size={12} color={activeTab === tab.id ? '#10b981' : 'var(--muted-foreground)'} />}
              {tab.is3D && <Box size={13} color={activeTab === tab.id ? '#6366f1' : 'var(--muted-foreground)'} />}
              {tab.isSpecial && <Lock size={12} color={activeTab === tab.id ? 'var(--foreground)' : '#71717a'} />}
              {tab.label}
              {tab.isVideo && (
                <span style={{
                  fontSize: '0.6rem',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 700
                }}>
                  Watch
                </span>
              )}
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
                  background: userSession?.authenticated ? 'rgba(16, 185, 129, 0.15)' : 'var(--muted)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

          {/* Scenario Selector Dropdown */}
          <div ref={scenarioMenuRef} className="relative" style={{ position: 'relative' }}>
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
              aria-expanded={scenarioOpen}
              aria-haspopup="true"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Play size={12} color={isDark ? '#34d399' : '#059669'} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{currentScenarioObj.title.split(':')[0]}</span>
              </div>
              <ChevronDown size={13} />
            </button>

            {scenarioOpen && (
              <div
                className="scenario-dropdown-panel absolute left-0 top-full mt-2 z-50 w-[min(26rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  marginTop: '0.5rem',
                  zIndex: 50,
                  width: 'min(26rem, calc(100vw - 2rem))',
                  maxWidth: 'calc(100vw - 2rem)',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#1e293b' : '#e2e8f0',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '0.75rem',
                  boxShadow: isDark
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                    : '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                  padding: '12px'
                }}
              >
                <div
                  className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '8px',
                    marginBottom: '8px',
                    borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0'
                  }}
                >
                  <div
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontWeight: 700,
                      letterSpacing: '0.05em'
                    }}
                  >
                    Hackathon Demo Scenarios
                  </div>
                  <button
                    onClick={() => setScenarioOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isDark ? '#94a3b8' : '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px'
                    }}
                    aria-label="Close scenarios menu"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div
                  className="flex flex-col gap-2 mt-2"
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}
                >
                  {scenarios.map(s => {
                    const isSelected = (systemStatus?.activeScenario || 'SCENARIO_A') === s.id;
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectScenario(s.id);
                          setScenarioOpen(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 shadow-sm'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(99, 102, 241, 0.18)' : '#eef2ff')
                            : (isDark ? 'rgba(30, 41, 59, 0.55)' : '#f8fafc'),
                          borderWidth: isSelected ? '1.5px' : '1px',
                          borderStyle: 'solid',
                          borderColor: isSelected
                            ? (isDark ? '#6366f1' : '#4f46e5')
                            : (isDark ? '#334155' : '#e2e8f0'),
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div
                          className="flex items-start justify-between gap-2"
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '8px',
                            marginBottom: '4px'
                          }}
                        >
                          <div
                            className="flex items-start gap-2"
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
                          >
                            <div style={{ marginTop: '2px', flexShrink: 0 }}>
                              <Icon size={14} color={s.color} />
                            </div>
                            <span
                              className="text-xs font-bold text-slate-900 dark:text-slate-100"
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: isDark ? '#f1f5f9' : '#0f172a',
                                lineHeight: 1.35
                              }}
                            >
                              {s.title}
                            </span>
                          </div>
                          {isSelected && (
                            <span
                              className="badge badge-live shrink-0 whitespace-nowrap"
                              style={{
                                fontSize: '0.62rem',
                                padding: '2px 6px',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                fontWeight: 700
                              }}
                            >
                              Active
                            </span>
                          )}
                        </div>
                        <div
                          className="text-xs text-slate-600 dark:text-slate-400"
                          style={{
                            fontSize: '0.74rem',
                            color: isDark ? '#94a3b8' : '#475569',
                            lineHeight: 1.45,
                            paddingLeft: '22px'
                          }}
                        >
                          {s.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800"
                  style={{ marginTop: '10px', paddingTop: '8px', borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0' }}
                >
                  <button
                    onClick={() => {
                      setScenarioOpen(false);
                      setActiveTab('scenarios');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Open Full Scenarios Matrix</span>
                    <ArrowRight size={13} />
                  </button>
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
                  width: 'min(220px, calc(100vw - 24px))',
                  boxShadow: 'var(--card-shadow)',
                  zIndex: 150,
                  padding: '6px'
                }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>{userSession.user?.name || 'beyond_nothing'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{userSession.user?.email || 'beyond_nothing@beyondflow.io'}</div>
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
                        color: 'var(--foreground)',
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
