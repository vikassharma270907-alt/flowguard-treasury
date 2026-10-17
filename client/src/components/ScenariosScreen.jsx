import React, { useState } from 'react';
import {
  Play, ShieldCheck, AlertTriangle, Clock, ArrowDownCircle,
  CheckCircle2, ArrowRight, LayoutGrid, Rows, RefreshCw,
  Shield,
} from 'lucide-react';

export default function ScenariosScreen({
  systemStatus,
  onSelectScenario,
  onNavigate
}) {
  // Orientation view state: 'grid' (landscape cards) vs 'timeline' (portrait sequential stack)
  const [orientationMode, setOrientationMode] = useState('grid');
  const [switchingId, setSwitchingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const activeScenario = systemStatus?.activeScenario || 'SCENARIO_A';

  const scenariosData = [
    {
      id: 'SCENARIO_A',
      code: 'Scenario A',
      title: 'Baseline Multi-Currency Run',
      subtitle: 'Standard operations with healthy reserve floor preservation',
      badge: 'NORMAL OPS',
      badgeClass: 'badge-success',
      icon: ShieldCheck,
      accentColor: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      summary: 'Initial treasury state: $33,110 cash across 4 Airwallex wallets, $15,000 liquidity reserve floor, and 5 supplier obligations.',
      dynamics: [
        { label: 'Wallets Cash', val: '$33,110 (USD, EUR, GBP, SGD)' },
        { label: 'Reserve Floor', val: '$15,000 mandatory reserve' },
        { label: 'Supplier Bills', val: '5 approved vendor invoices' }
      ],
      armorIqAction: 'Intent Assurance active. Read lookups auto-allowed. Critical bills (Apex customs, Bavaria tooling) scheduled without breaching reserve.',
      keyOutcome: 'Apex Customs ($6,200) and Bavaria Tooling ($4,250) execute on local rails ($0 fees); $15,000 buffer remains intact.',
      targetView: 'planner',
      targetLabel: 'View in Payment Planner'
    },
    {
      id: 'SCENARIO_B',
      code: 'Scenario B',
      title: 'Duplicate Invoice Attack',
      subtitle: 'Attack injection caught by deterministic Levenshtein duplicate shield',
      badge: 'ATTACK SIMULATION',
      badgeClass: 'badge-danger',
      icon: AlertTriangle,
      accentColor: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.35)',
      summary: 'Adversary injects duplicate invoice INV-2024-884B (€4,250) closely matching legitimate invoice INV-2024-884 with 91.2% similarity.',
      dynamics: [
        { label: 'Injected Invoice', val: 'INV-2024-884B (€4,250)' },
        { label: 'Matching Target', val: 'Bavaria Precision Tooling (€4,250)' },
        { label: 'Similarity Score', val: '91.2% Levenshtein Match' }
      ],
      armorIqAction: 'Duplicate detector halts candidate. ArmorIQ denies Intent Token minting. PEP proxy prevents MCP disbursement.',
      keyOutcome: 'Zero duplicate payment execution. Fraudulent transaction refused before external banking rails are invoked.',
      targetView: 'invoices',
      targetLabel: 'View in Invoice & Risk Guard'
    },
    {
      id: 'SCENARIO_C',
      code: 'Scenario C',
      title: 'Delayed Receivable Shock',
      subtitle: 'Customer receipt postponement triggering auto-deferral of low-priority bills',
      badge: 'LIQUIDITY STRESS',
      badgeClass: 'badge-warning',
      icon: Clock,
      accentColor: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      summary: 'Nordic Retail informs that their expected $14,500 inbound payment is delayed by 14 days, creating imminent cash-flow strain.',
      dynamics: [
        { label: 'Delayed Inbound', val: 'Nordic Retail ($14,500 USD)' },
        { label: 'Postponement', val: '14 calendar days' },
        { label: 'Floor at Risk', val: '$15,000 liquidity buffer' }
      ],
      armorIqAction: 'Deterministic rules engine recalculates priority queue. Non-urgent Shenzhen MicroSensors ($3,415) invoice auto-deferred.',
      keyOutcome: 'Guarantees the $15,000 reserve floor is never violated. Essential suppliers remain scheduled without capital deficit.',
      targetView: 'planner',
      targetLabel: 'View Re-Balanced Plan'
    },
    {
      id: 'SCENARIO_D',
      code: 'Scenario D',
      title: 'Sandbox Deposit Replenishment',
      subtitle: 'Inbound liquidity surge replenishing wallets and unlocking held obligations',
      badge: 'REPLENISHMENT',
      badgeClass: 'badge-info',
      icon: ArrowDownCircle,
      accentColor: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.08)',
      borderColor: 'rgba(56, 189, 248, 0.35)',
      summary: 'Triggers Airwallex sandbox deposit API to simulate an inbound replenishment of +$25,000 USD to operating wallets.',
      dynamics: [
        { label: 'Inbound Deposit', val: '+$25,000 USD sandbox funds' },
        { label: 'Available Capital', val: 'Surges to >$58,000 total' },
        { label: 'Deferred Invoices', val: 'Automatically unlocked' }
      ],
      armorIqAction: 'Capital threshold met. Previously deferred Shenzhen MicroSensors invoice clears reserve constraint and enters approved queue.',
      keyOutcome: 'Real-time liquidity re-allocation. Instant treasury re-balancing logged to tamper-evident audit ledger.',
      targetView: 'audit',
      targetLabel: 'View in Audit Ledger'
    }
  ];

  const handleTrigger = async (id, title) => {
    setSwitchingId(id);
    try {
      await onSelectScenario(id);
      setToastMessage(`Switched to ${title}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingId(null);
    }
  };

  const currentObj = scenariosData.find(s => s.id === activeScenario) || scenariosData[0];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--card)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '12px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 999,
          color: 'var(--foreground)',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner with Orientation Controls */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-neutral" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                HACKATHON SPECIFICATION MATRIX
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                4 PRESET SCENARIOS
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
              Treasury Demo Scenarios & Simulation Matrix
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--muted-foreground)', marginTop: '6px', maxWidth: '820px', lineHeight: 1.5 }}>
              Switch dynamically between baseline multi-currency runs, duplicate invoice attacks, delayed customer receipts, and sandbox cash injections with instant ArmorIQ intent verification.
            </p>
          </div>

          {/* Orientation Mode Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--secondary)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            gap: '4px'
          }}>
            <button
              onClick={() => setOrientationMode('grid')}
              className="btn btn-sm"
              style={{
                background: orientationMode === 'grid' ? 'var(--card)' : 'transparent',
                color: orientationMode === 'grid' ? 'var(--foreground)' : 'var(--muted-foreground)',
                border: orientationMode === 'grid' ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Landscape Card Grid (Side-by-Side)"
            >
              <LayoutGrid size={14} />
              <span>Landscape Grid</span>
            </button>
            <button
              onClick={() => setOrientationMode('timeline')}
              className="btn btn-sm"
              style={{
                background: orientationMode === 'timeline' ? 'var(--card)' : 'transparent',
                color: orientationMode === 'timeline' ? 'var(--foreground)' : 'var(--muted-foreground)',
                border: orientationMode === 'timeline' ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Sequential Timeline Stack (Vertical Orientation)"
            >
              <Rows size={14} />
              <span>Timeline Stack</span>
            </button>
          </div>
        </div>

        {/* Current Active Scenario Callout */}
        <div style={{
          background: currentObj.bgGlow,
          border: `1px solid ${currentObj.borderColor}`,
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--card)',
              border: `1px solid ${currentObj.accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {React.createElement(currentObj.icon, { size: 22, color: currentObj.accentColor })}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: currentObj.accentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ACTIVE SYSTEM SCENARIO
                </span>
                <span className={`badge ${currentObj.badgeClass}`} style={{ fontSize: '0.65rem' }}>
                  <span className="pulse-dot" style={{ background: currentObj.accentColor }}></span>
                  {currentObj.badge}
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
                {currentObj.code}: {currentObj.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                {currentObj.summary}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => onNavigate(currentObj.targetView)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{currentObj.targetLabel}</span>
              <ArrowRight size={14} />
            </button>
            {activeScenario !== 'SCENARIO_A' && (
              <button
                onClick={() => handleTrigger('SCENARIO_A', 'Scenario A: Baseline')}
                className="btn btn-sm"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={13} />
                <span>Reset to Baseline</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scenario Cards (Oriented as 2x2 Balanced Grid on Desktop) */}
      <div style={{
        display: orientationMode === 'grid' ? 'grid' : 'flex',
        gridTemplateColumns: orientationMode === 'grid' ? 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))' : undefined,
        flexDirection: orientationMode === 'timeline' ? 'column' : undefined,
        gap: '24px',
        marginBottom: '36px'
      }}>
        {scenariosData.map((s) => {

          const isSwitching = switchingId === s.id;
          const Icon = s.icon;

          return (
            <div
              key={s.id}
              style={{
                background: isCurrent ? s.bgGlow : 'var(--card)',
                border: isCurrent ? `2px solid ${s.accentColor}` : '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: isCurrent ? `0 8px 24px ${s.accentColor}25` : '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              {/* Top Meta */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isCurrent ? 'var(--card)' : 'var(--secondary)',
                      border: `1px solid ${s.accentColor}50`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={20} color={s.accentColor} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: s.accentColor, textTransform: 'uppercase' }}>
                        {s.code}
                      </span>
                    </div>
                  </div>
                  <span className={`badge ${s.badgeClass}`} style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                    {s.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--muted-foreground)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {s.subtitle}
                </p>

                {/* 2-Column Balanced Internal Grid: Dynamics + ArmorIQ Policy Role */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  {/* Left Column: Key Dynamics Box */}
                  <div style={{
                    background: 'var(--secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '8px' }}>
                      Financial Dynamics
                    </div>
                    {s.dynamics.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px', color: 'var(--foreground)' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}>{d.label}:</span>
                        <strong style={{ fontWeight: 600, textAlign: 'right' }}>{d.val}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: ArmorIQ Policy Role */}
                  <div style={{
                    background: 'var(--secondary)',
                    border: `1px solid ${s.accentColor}35`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: s.accentColor, fontWeight: 700, letterSpacing: '0.04em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Shield size={12} />
                        <span>ArmorIQ Policy Enforcement</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', lineHeight: 1.45, margin: 0 }}>
                        {s.armorIqAction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Horizontal Row on Desktop) */}
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap: '10px'
              }}>
                <button
                  onClick={() => handleTrigger(s.id, s.title)}
                  disabled={isCurrent || isSwitching}
                  className={isCurrent ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                  style={{
                    justifyContent: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    cursor: isCurrent ? 'default' : 'pointer',
                    background: isCurrent ? 'var(--card)' : undefined,
                    borderColor: isCurrent ? s.accentColor : undefined,
                    color: isCurrent ? s.accentColor : undefined,
                    fontWeight: 700
                  }}
                >
                  {isCurrent ? (
                    <>
                      <CheckCircle2 size={15} color={s.accentColor} />
                      <span>Active Scenario</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>{isSwitching ? 'Activating...' : `Run ${s.code}`}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onNavigate(s.targetView)}
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'center', fontSize: '0.78rem', padding: '10px 14px' }}
                >
                  <span>{s.targetLabel}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Structured Comparison Matrix Table */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
            📊 Hackathon Scenario Comparison & Rubric Verification
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            Systematic side-by-side verification table for official hackathon judges and evaluators.
          </p>
        </div>

        <div className="table-cards-mobile" style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 14px', color: 'var(--foreground)', width: '15%' }}>Scenario Preset</th>
                <th style={{ padding: '12px 14px', color: 'var(--foreground)', width: '22%' }}>Simulation Trigger</th>
                <th style={{ padding: '12px 14px', color: 'var(--foreground)', width: '25%' }}>Financial State Impact</th>
                <th style={{ padding: '12px 14px', color: 'var(--foreground)', width: '26%' }}>ArmorIQ Enforcement Outcome</th>
                <th style={{ padding: '12px 14px', color: 'var(--foreground)', width: '12%', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {scenariosData.map((s, idx) => {
                const isSelected = activeScenario === s.id;
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isSelected ? s.bgGlow : (idx % 2 === 0 ? 'var(--background)' : 'var(--card)')
                    }}
                  >
                    <td style={{ padding: '14px', verticalAlign: 'top', fontWeight: 700, color: 'var(--foreground)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <s.icon size={15} color={s.accentColor} />
                        <span>{s.code}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                        {s.title}
                      </div>
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', color: 'var(--muted-foreground)', lineHeight: 1.45 }}>
                      {s.summary}
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', color: 'var(--foreground)', lineHeight: 1.45 }}>
                      {s.keyOutcome}
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', color: 'var(--muted-foreground)', lineHeight: 1.45 }}>
                      <span className={`badge ${s.badgeClass}`} style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'inline-block' }}>
                        {s.badge}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--foreground)' }}>
                        {s.armorIqAction}
                      </div>
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', textAlign: 'center' }}>
                      <button
                        onClick={() => handleTrigger(s.id, s.title)}
                        disabled={isSelected}
                        className={isSelected ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                        style={{ fontSize: '0.74rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
                      >
                        {isSelected ? 'Active' : 'Trigger'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
