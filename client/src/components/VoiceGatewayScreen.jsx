import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, PhoneCall, PhoneOff, Mic, Volume2, VolumeX, Shield,
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock,
  ArrowRight, Lock, RefreshCw, Play, Pause, RotateCcw, FileText,
  Terminal, Copy, Sparkles, UserCheck, Users, HelpCircle,
  ExternalLink, Check, Info, AlertOctagon, ChevronRight, Zap
} from 'lucide-react';

export default function VoiceGatewayScreen({ userSession }) {
  const [sessionData, setSessionData] = useState(null);
  const [dxNotes, setDxNotes] = useState(null);
  const [showDxModal, setShowDxModal] = useState(false);
  const [activeDxTab, setActiveDxTab] = useState('insights'); // 'insights' | 'schemas' | 'curl'
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Guided 45-second call state
  const [isGuidedRunning, setIsGuidedRunning] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0); // 0 to 6
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeSpeaker, setActiveSpeaker] = useState(null); // 'caller' | 'agent' | 'supervisor' | null
  const guidedTimerRef = useRef(null);

  // Manual sandbox trigger inputs
  const [selectedToolToTrigger, setSelectedToolToTrigger] = useState('FlowGuard_orderLookup');
  const [manualAccount, setManualAccount] = useState('ACC-4471');
  const [manualDestination, setManualDestination] = useState('GB29 NWBK 6016 1331 9268 19');
  const [manualRefundAmount, setManualRefundAmount] = useState('89');

  // Load session & DX notes from backend
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/voice/session');
      const data = await res.json();
      setSessionData(data.session);
    } catch (err) {
      console.warn('Error fetching voice session:', err);
    }
  };

  const fetchDxNotes = async () => {
    try {
      const res = await fetch('/api/voice/dx-notes');
      const data = await res.json();
      setDxNotes(data);
    } catch (err) {
      console.warn('Error fetching DX notes:', err);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchDxNotes();
  }, []);

  const fallbackBrowserSpeech = (text, speaker) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speaker === 'agent' ? 1.05 : 1.0;
      utterance.pitch = speaker === 'agent' ? 1.1 : 0.95;
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (speaker === 'agent') {
          const femaleOrClean = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Google') || v.name.includes('Natural')));
          if (femaleOrClean) utterance.voice = femaleOrClean;
        } else if (speaker === 'caller') {
          const maleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('George') || v.name.includes('Mark')));
          if (maleVoice) utterance.voice = maleVoice;
        }
      }
      
      utterance.onend = () => setActiveSpeaker(null);
      utterance.onerror = () => setActiveSpeaker(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setActiveSpeaker(null);
    }
  };

  // ElevenLabs server-side synthesis with browser fallback
  const speakText = async (text, speaker = 'agent') => {
    if (isAudioMuted || !text) return;
    setActiveSpeaker(speaker);

    if (speaker === 'agent') {
      try {
        const res = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('audio/mpeg')) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => setActiveSpeaker(null);
          audio.onerror = () => setActiveSpeaker(null);
          audio.play().catch(() => fallbackBrowserSpeech(text, speaker));
          return;
        }
      } catch (err) {
        console.warn('ElevenLabs API server proxy notice:', err);
      }
    }

    fallbackBrowserSpeech(text, speaker);
  };

  // Reset Session
  const handleResetSession = async () => {
    setIsGuidedRunning(false);
    clearInterval(guidedTimerRef.current);
    setTimerSeconds(0);
    setGuidedStep(0);
    setActiveSpeaker(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      const res = await fetch('/api/voice/session/reset', { method: 'POST' });
      const data = await res.json();
      setSessionData(data.session);
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Tool Call via Webhook API
  const handleTriggerTool = async (rawToolName, parameters) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/voice/gateway/tool-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawToolName, parameters })
      });
      const data = await res.json();
      await fetchSession();

      if (data.speechResponse) {
        speakText(data.speechResponse, 'agent');
      } else if (data.immediateHoldingSpeech) {
        speakText(data.immediateHoldingSpeech, 'agent');
      }
      return data;
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Supervisor Decision: Press Deny or Approve
  const handleSupervisorDecision = async (decision, roleOverride = null) => {
    if (!sessionData?.pendingSupervisorAction) return;
    setIsLoading(true);
    try {
      const supervisorName = roleOverride === 'COMPLIANCE_LEAD'
        ? 'Marcus Sterling'
        : (userSession?.user?.name || 'beyond_nothing');
      const role = roleOverride === 'COMPLIANCE_LEAD'
        ? 'COMPLIANCE_AUDITOR'
        : (userSession?.user?.role || 'SUPER_ADMIN');

      const res = await fetch('/api/voice/supervisor/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolCallId: sessionData.pendingSupervisorAction.toolCallId,
          decision,
          supervisorName,
          role
        })
      });
      const data = await res.json();
      await fetchSession();

      if (data.agentSpokenResponse) {
        speakText(data.agentSpokenResponse, 'agent');
      }
      return data;
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 45-Second Guided Call Orchestration
  const startGuidedCall = () => {
    handleResetSession();
    setIsGuidedRunning(true);
    setGuidedStep(1);
    setTimerSeconds(0);

    // Call connected & ArmorIQ plan signed
    speakText("Welcome to Northwind Traders support. How may I assist you today?", 'agent');

    // Run stepped 45-second sequence
    let currentSec = 0;
    guidedTimerRef.current = setInterval(async () => {
      currentSec += 1;
      setTimerSeconds(currentSec);

      // Step 1: ~4s - Caller asks for Order Lookup
      if (currentSec === 4) {
        setGuidedStep(1);
        speakText("Hi! I'm calling about order ORD-1001. Can you confirm the status and my payout date?", 'caller');
      }
      if (currentSec === 8) {
        setGuidedStep(2);
        // Tool: FlowGuard_orderLookup
        await handleTriggerTool('FlowGuard_orderLookup', { order_id: 'ORD-1001' });
      }

      // Step 2: ~15s - Caller attempts social engineering (Payout bank change)
      if (currentSec === 15) {
        setGuidedStep(3);
        speakText("Thanks! Actually, our banking details changed this morning. Can you change the payout destination for ACC-4471 to IBAN GB29 NWBK 6016 1331 9268 19?", 'caller');
      }
      if (currentSec === 20) {
        setGuidedStep(4);
        // Tool: FlowGuard_payoutChange -> Returns holding message in <5s, escalates to supervisor
        await handleTriggerTool('FlowGuard_payoutChange', {
          account_id: 'ACC-4471',
          new_destination: 'GB29 NWBK 6016 1331 9268 19'
        });
      }

      // If user hasn't pressed deny by second 26, prompt them or pause
      if (currentSec === 28 && sessionData?.pendingSupervisorAction?.canonicalTool === 'payoutChange') {
        // Pauses briefly to let supervisor press Deny
      }

      // Step 3: ~32s - Caller requests partial refund
      if (currentSec === 32 && !sessionData?.pendingSupervisorAction) {
        setGuidedStep(5);
        speakText("Understood. Then could we please issue a refund of $89 for order ORD-1001?", 'caller');
      }
      if (currentSec === 36 && !sessionData?.pendingSupervisorAction) {
        setGuidedStep(6);
        // Tool: FlowGuard_issueRefund -> Dual approval
        await handleTriggerTool('FlowGuard_issueRefund', { order_id: 'ORD-1001', amount: 89 });
      }

      // Stop timer at 45 seconds
      if (currentSec >= 45) {
        clearInterval(guidedTimerRef.current);
        setIsGuidedRunning(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (guidedTimerRef.current) clearInterval(guidedTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pendingAction = sessionData?.pendingSupervisorAction;
  const dualApproval = sessionData?.dualApprovalState;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.95) 0%, rgba(9, 9, 11, 0.98) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient background glow */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '8%',
          width: '320px',
          height: '180px',
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15), transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-live" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot green"></span>
                ElevenLabs Conversational Voice Agent
              </span>
              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <Shield size={11} style={{ marginRight: '4px' }} />
                ArmorIQ-Signed Call Plans
              </span>
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <Clock size={11} style={{ marginRight: '4px' }} />
                5s Timeout Protection
              </span>
            </div>

            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>
              Voice Agent Gateway & Supervisor Playground
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', marginTop: '8px', lineHeight: 1.5 }}>
              A real ElevenLabs agent handles voice support calls through the FlowGuard gateway. Every call receives an 
              <strong> ArmorIQ-signed plan</strong>. When callers attempt unverified payout modifications or refunds, 
              the agent notifies a supervisor. <strong>On this playground, YOU are the supervisor</strong>.
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title={isAudioMuted ? 'Unmute voice synthesis' : 'Mute voice synthesis'}
            >
              {isAudioMuted ? <VolumeX size={14} color="#f87171" /> : <Volume2 size={14} color="#34d399" />}
              <span>{isAudioMuted ? 'Voice Muted' : 'Voice Active'}</span>
            </button>

            <button
              onClick={() => setShowDxModal(true)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#e9d5ff'
              }}
            >
              <FileText size={14} color="#c084fc" />
              <span>DX Notes & Tool Schemas</span>
            </button>

            <button
              onClick={startGuidedCall}
              disabled={isGuidedRunning}
              className="btn btn-primary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Play size={14} fill="#ffffff" />
              <span>{isGuidedRunning ? `Call in Progress (${timerSeconds}s)` : 'Start 45s Guided Call'}</span>
            </button>

            <button
              onClick={handleResetSession}
              className="btn btn-secondary btn-sm"
              title="Reset Call Session"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* 45-Second Timeline Progression Bar */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
              45-Second End-to-End Voice Scenario Timeline
            </span>
            <span style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>
              {timerSeconds}s / 45s {isGuidedRunning && '(LIVE)'}
            </span>
          </div>

          <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${Math.min(100, (timerSeconds / 45) * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981 0%, #6366f1 50%, #ec4899 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '8px', marginTop: '10px' }}>
            {[
              { time: '00:00 - 00:10', title: '1. Plan & Order Lookup', sub: 'ArmorIQ Allowed (live)' },
              { time: '00:10 - 00:24', title: '2. Payout Change Attack', sub: '<5s Holding Utterance' },
              { time: '00:24 - 00:32', title: '3. Supervisor Press Deny', sub: 'Agent tells caller NO' },
              { time: '00:32 - 00:45', title: '4. Refund Dual-Approval', sub: 'ArmorIQ release → sandbox MCP' }
            ].map((step, idx) => (
              <div key={idx} style={{
                fontSize: '0.72rem',
                padding: '6px 10px',
                borderRadius: '6px',
                background: timerSeconds >= idx * 11 ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                border: timerSeconds >= idx * 11 ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent'
              }}>
                <div style={{ color: timerSeconds >= idx * 11 ? '#10b981' : '#71717a', fontWeight: 600 }}>{step.time}</div>
                <div style={{ color: 'var(--foreground)', fontWeight: 500 }}>{step.title}</div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.68rem' }}>{step.sub}</div>
              </div>
            ))}
          </div>

          {/* Hackathon Rules Compliance Quick-Reference */}
          <div style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.74rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <ShieldCheck size={14} color="#34d399" />
              <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>Hackathon Rules Verification:</span>
              <span style={{ color: 'var(--muted-foreground)' }}>1. AI Agent: <strong style={{ color: 'var(--foreground)' }}>ElevenLabs Support Agent</strong></span>
              <span style={{ color: '#71717a' }}>·</span>
              <span style={{ color: 'var(--muted-foreground)' }}>2. MCP: <code style={{ color: '#c084fc', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px' }}>intentgate-support-mcp</code></span>
              <span style={{ color: '#71717a' }}>·</span>
              <span style={{ color: '#a1a1aa' }}>3. ArmorIQ:</span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>✅ Allowed: lookup_order</span>
              <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>⛔ Blocked: change_payout</span>
            </div>
            <a
              href="https://docs.armoriq.ai"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
            >
              docs.armoriq.ai <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Call Card + Live Transcript + Supervisor Control */}
      <div className="voice-gateway-layout">
        
        {/* COLUMN 1: Active Call Visualizer & Caller Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Active Call Card */}
          <div className="card" style={{ padding: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isGuidedRunning ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PhoneCall size={16} color={isGuidedRunning ? '#34d399' : '#a1a1aa'} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                    Active Voice Channel
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: isGuidedRunning ? '#34d399' : 'var(--muted-foreground)' }}>
                    {isGuidedRunning ? 'Call In-Progress' : 'Standby / Ready'}
                  </span>
                </div>
              </div>
              <span className={`badge ${isGuidedRunning ? 'badge-live' : 'badge-neutral'}`}>
                {isGuidedRunning ? 'CONNECTED' : 'IDLE'}
              </span>
            </div>

            {/* Audio Waveform Simulator */}
            <div style={{
              background: 'var(--surface-muted)',
              borderRadius: '10px',
              padding: '16px 12px',
              border: '1px solid var(--border)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Voice Waveform</span>
                <span style={{ fontSize: '0.7rem', color: activeSpeaker ? '#34d399' : '#71717a', fontWeight: 600 }}>
                  {activeSpeaker ? `Speaking: ${activeSpeaker.toUpperCase()}` : 'Awaiting Speech'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '40px' }}>
                {[18, 32, 24, 40, 15, 28, 38, 20, 36, 12, 30, 42, 25, 33, 19, 39, 22, 29, 35, 16, 31, 26, 37, 14].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: activeSpeaker ? `${Math.max(6, (h * (Math.sin(i + timerSeconds * 2) + 1.2)) / 2)}px` : '4px',
                      background: activeSpeaker === 'caller'
                        ? '#3b82f6'
                        : activeSpeaker === 'agent'
                        ? '#10b981'
                        : '#71717a',
                      borderRadius: '2px',
                      transition: 'height 0.15s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Caller Profile */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Caller</span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{sessionData?.caller?.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Company</span>
                <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{sessionData?.caller?.company || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Target Order</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#60a5fa' }}>{sessionData?.caller?.orderId || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Disbursement</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>{sessionData?.caller ? `$${Number(sessionData.caller.orderAmount).toFixed(2)} ${sessionData.caller.orderCurrency}` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Bank on File</span>
                <span style={{ fontFamily: 'monospace', color: '#a1a1aa' }}>{sessionData?.caller?.currentBankDetails ? `${sessionData.caller.currentBankDetails.bankName} (•••• ${sessionData.caller.currentBankDetails.accountNumberEnding})` : '—'}</span>
              </div>
            </div>
          </div>

          {/* ArmorIQ Signed Plan Token Card */}
          <div className="card" style={{ padding: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Shield size={16} color="#a78bfa" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)' }}>
                ArmorIQ Call Intent Token
              </span>
            </div>

            <div style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--muted-foreground)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Token ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#c084fc' }}>{sessionData?.intentToken?.token_id || (sessionData?.armorIq?.status === 'MINTING' ? 'minting…' : 'not minted')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Plan Hash:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--foreground)' }}>
                  {sessionData?.planHash ? `${sessionData.planHash.substring(0, 14)}...` : (sessionData?.armorIq?.status === 'MINTING' ? 'minting…' : '—')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Signature:</span>
                <span style={{ color: sessionData?.intentToken?.mode === 'ARMORIQ_LIVE' ? '#34d399' : 'var(--muted-foreground)', fontWeight: 600 }}>{sessionData?.intentToken?.mode === 'ARMORIQ_LIVE' ? 'Issued by ArmorIQ (live)' : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Fail-Mode:</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>fail-closed — no ArmorIQ verdict, nothing executes</span>
              </div>
            </div>

            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(139, 92, 246, 0.2)', fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>
              Every support call mints an immutable plan binding caller identity to permitted corridor policies.
            </div>
          </div>
        </div>

        {/* COLUMN 2: Live Conversation & Tool Invocations */}
        <div className="card" style={{ padding: '20px', minHeight: '580px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Live Support Call Stream
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px', margin: 0 }}>
                Real-time ElevenLabs conversational transcript & gateway tool dispatches
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--muted-foreground)' }}>
                {sessionData?.transcript?.length || 0} Events
              </span>
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto',
            maxHeight: '480px',
            paddingRight: '6px'
          }}>
            {sessionData?.transcript?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted-foreground)' }}>
                <Phone size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 6px 0' }}>
                  Awaiting Support Call
                </h4>
                <p style={{ fontSize: '0.8rem', maxWidth: '360px', margin: '0 auto' }}>
                  Click <strong>Start 45s Guided Call</strong> above, or trigger individual tools from the playground panel on the right.
                </p>
              </div>
            ) : (
              sessionData?.transcript?.map((entry, idx) => {
                const isAgent = entry.speaker === 'agent';
                const isCaller = entry.speaker === 'caller';
                const isSupervisor = entry.speaker === 'supervisor';

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isCaller ? 'flex-start' : isAgent ? 'flex-end' : 'center',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                      <span style={{ fontWeight: 600, color: isCaller ? '#60a5fa' : isAgent ? '#34d399' : '#fbbf24' }}>
                        {isCaller ? `${sessionData?.caller?.name || 'Caller'} (Caller)` : isAgent ? 'ElevenLabs Agent' : 'Supervisor Action'}
                      </span>
                      {entry.badge && (
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: entry.badge.includes('ALLOWED')
                            ? 'rgba(16, 185, 129, 0.2)'
                            : entry.badge.includes('DENIED')
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                          color: entry.badge.includes('ALLOWED')
                            ? '#34d399'
                            : entry.badge.includes('DENIED')
                            ? '#f87171'
                            : '#fbbf24',
                          fontWeight: 700,
                          fontSize: '0.62rem'
                        }}>
                          {entry.badge}
                        </span>
                      )}
                      <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>

                    <div style={{
                      maxWidth: isSupervisor ? '90%' : '75%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isCaller
                        ? 'rgba(37, 99, 235, 0.12)'
                        : isAgent
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(245, 158, 11, 0.1)',
                      border: isCaller
                        ? '1px solid rgba(59, 130, 246, 0.3)'
                        : isAgent
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(245, 158, 11, 0.3)',
                      color: 'var(--foreground)',
                      fontSize: '0.83rem',
                      lineHeight: 1.45
                    }}>
                      {entry.text}
                    </div>

                    {entry.toolTriggered && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.68rem',
                        fontFamily: 'monospace',
                        color: '#c084fc',
                        background: 'rgba(139, 92, 246, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                        marginTop: '2px'
                      }}>
                        <Zap size={10} color="#a78bfa" />
                        <span>Invoked Tool: {entry.toolTriggered}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: "You Are the Supervisor" Interactive Command Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Supervisor Card */}
          <div className="card" style={{
            padding: '20px',
            border: pendingAction
              ? '1px solid rgba(239, 68, 68, 0.6)'
              : '1px solid var(--border)',
            background: pendingAction
              ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, var(--card) 100%)'
              : undefined,
            boxShadow: pendingAction ? '0 0 25px rgba(239, 68, 68, 0.2)' : undefined
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} color={pendingAction ? '#f87171' : '#34d399'} />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                  Supervisor Console
                </h3>
              </div>
              <span className={`badge ${pendingAction ? 'badge-danger' : 'badge-neutral'}`}>
                {pendingAction ? 'ACTION REQUIRED' : 'STANDBY'}
              </span>
            </div>

            {/* CASE A: PENDING PAYOUT CHANGE ESCALATION */}
            {pendingAction?.canonicalTool === 'payoutChange' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertOctagon size={18} color="#f87171" />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fca5a5' }}>
                      Payout Destination Override Attempt
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#fecaca' }}>
                      ArmorIQ Flag: High Risk Unverified Wire Route
                    </div>
                  </div>
                </div>

                {/* 5-second window notification banner */}
                <div style={{
                  fontSize: '0.72rem',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: '#fef3c7'
                }}>
                  <strong>5s Timeout Handling:</strong> Gateway answered <em>"A supervisor has been notified"</em> inside window. Awaiting your decision.
                </div>

                <div style={{ fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--foreground)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Target Account:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f87171' }}>
                      {pendingAction.details.requestedAccount}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Routing transit:</span>
                    <span style={{ fontFamily: 'monospace' }}>{pendingAction.details.requestedRouting}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Disbursement:</span>
                    <span style={{ fontWeight: 600 }}>$18,500.00 USD</span>
                  </div>
                </div>

                {/* Supervisor Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '10px', marginTop: '6px' }}>
                  <button
                    onClick={() => handleSupervisorDecision('DENY')}
                    disabled={isLoading}
                    className="btn btn-danger"
                    style={{
                      padding: '10px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontWeight: 700
                    }}
                  >
                    <XCircle size={15} />
                    <span>Press Deny</span>
                  </button>

                  <button
                    onClick={() => handleSupervisorDecision('APPROVE')}
                    disabled={isLoading}
                    className="btn btn-secondary"
                    style={{
                      padding: '10px',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.75rem'
                    }}
                  >
                    <CheckCircle2 size={14} color="#34d399" />
                    <span>Approve Override</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#a1a1aa', textAlign: 'center' }}>
                  Pressing <strong>Deny</strong> instructs the ElevenLabs agent to refuse the caller's request immediately.
                </div>
              </div>

            /* CASE B: PENDING REFUND DUAL APPROVAL */
            ) : pendingAction?.canonicalTool === 'issueRefund' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Users size={18} color="#c084fc" />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e9d5ff' }}>
                      Refund Requires Dual Approval (2 Keys)
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#c4b5fd' }}>
                      Amount: ${pendingAction.amount.toLocaleString()} USD · Policy Quorum
                    </div>
                  </div>
                </div>

                {/* Quorum Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Quorum Status:</span>
                    <span style={{ fontWeight: 700, color: pendingAction.approvalsCount === 1 ? '#fbbf24' : '#a1a1aa' }}>
                      {pendingAction.approvalsCount} / 2 Approvals Signed
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(pendingAction.approvalsCount / 2) * 100}%`,
                      height: '100%',
                      background: '#c084fc'
                    }} />
                  </div>
                </div>

                {/* Dual Approval Action Buttons */}
                {pendingAction.approvalsCount === 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '10px' }}>
                    <button
                      onClick={() => handleSupervisorDecision('APPROVE')}
                      disabled={isLoading}
                      className="btn btn-primary"
                      style={{ padding: '9px', minHeight: '44px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Check size={14} />
                      <span>Approve (Key 1)</span>
                    </button>
                    <button
                      onClick={() => handleSupervisorDecision('DENY')}
                      disabled={isLoading}
                      className="btn btn-secondary"
                      style={{ padding: '9px', minHeight: '44px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      Deny Refund
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#34d399" />
                      <span>Key 1 signed by {pendingAction.approvals[0]?.supervisor}</span>
                    </div>
                    <button
                      onClick={() => handleSupervisorDecision('APPROVE', 'COMPLIANCE_LEAD')}
                      disabled={isLoading}
                      className="btn btn-primary"
                      style={{
                        padding: '10px',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
                      }}
                    >
                      <Users size={15} />
                      <span>Co-Sign as Compliance Lead (Key 2)</span>
                    </button>
                  </div>
                )}
              </div>

            /* CASE C: STANDBY */
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--muted-foreground)' }}>
                <CheckCircle2 size={32} color="#34d399" style={{ margin: '0 auto 8px auto', opacity: 0.8 }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                  No Escalations Pending
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                  All agent intents within autonomous bounds. High-risk intents route here instantly.
                </p>
              </div>
            )}
          </div>

          {/* Manual Tool Call Trigger Sandbox */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Terminal size={14} color="#60a5fa" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Tool Trigger Sandbox
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                  Select Governed Intent Tool:
                </label>
                <select
                  value={selectedToolToTrigger}
                  onChange={(e) => setSelectedToolToTrigger(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    fontSize: '0.78rem'
                  }}
                >
                  <option value="FlowGuard_orderLookup">FlowGuard_orderLookup (ArmorIQ Allowed)</option>
                  <option value="FlowGuard_payoutChange">FlowGuard_payoutChange (Governed → supervisor queue)</option>
                  <option value="FlowGuard_issueRefund">FlowGuard_issueRefund (Dual approval quorum)</option>
                </select>
              </div>

              {selectedToolToTrigger === 'FlowGuard_payoutChange' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ color: 'var(--muted-foreground)', fontSize: '0.7rem' }}>New Destination (IBAN)</label>
                    <input
                      type="text"
                      value={manualDestination}
                      onChange={(e) => setManualDestination(e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '0.75rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'var(--muted-foreground)', fontSize: '0.7rem' }}>Payout Account ID</label>
                    <input
                      type="text"
                      value={manualAccount}
                      onChange={(e) => setManualAccount(e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '0.75rem' }}
                    />
                  </div>
                </div>
              )}

              {selectedToolToTrigger === 'FlowGuard_issueRefund' && (
                <div>
                  <label style={{ color: 'var(--muted-foreground)', fontSize: '0.7rem' }}>Refund Amount (USD)</label>
                  <input
                    type="number"
                    value={manualRefundAmount}
                    onChange={(e) => setManualRefundAmount(e.target.value)}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '0.75rem' }}
                  />
                </div>
              )}

              <button
                onClick={() => {
                  if (selectedToolToTrigger === 'FlowGuard_orderLookup') {
                    handleTriggerTool('FlowGuard_orderLookup', { order_id: sessionData?.caller?.orderId || 'ORD-1001' });
                  } else if (selectedToolToTrigger === 'FlowGuard_payoutChange') {
                    handleTriggerTool('FlowGuard_payoutChange', { account_id: manualAccount, new_destination: manualDestination });
                  } else if (selectedToolToTrigger === 'FlowGuard_issueRefund') {
                    handleTriggerTool('FlowGuard_issueRefund', { order_id: sessionData?.caller?.orderId || 'ORD-1001', amount: Number(manualRefundAmount) });
                  }
                }}
                disabled={isLoading}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Zap size={13} color="#f59e0b" />
                <span>Dispatch Tool via Gateway</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DX NOTES & TOOL SCHEMAS MODAL */}
      {showDxModal && (
        <div className="modal-overlay" onClick={() => setShowDxModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '840px', width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
                  ElevenLabs Voice Agent DX Architecture Notes
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '4px', margin: 0 }}>
                  Critical production lessons for building voice agents with ArmorIQ & financial gateways
                </p>
              </div>
              <button
                onClick={() => setShowDxModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 10px' }}
              >
                Close
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', padding: '0 24px', background: 'var(--muted)' }}>
              {[
                { id: 'insights', label: '1. Two Core Voice Insights' },
                { id: 'schemas', label: '2. ElevenLabs Tool Schemas' },
                { id: 'curl', label: '3. Webhook cURL Verification' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDxTab(tab.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeDxTab === tab.id ? '2px solid #10b981' : '2px solid transparent',
                    color: activeDxTab === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                    padding: '12px 16px',
                    fontSize: '0.82rem',
                    fontWeight: activeDxTab === tab.id ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Tab Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeDxTab === 'insights' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {dxNotes?.insights?.map(ins => (
                    <div key={ins.id} style={{ background: 'var(--card)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', margin: '0 0 10px 0' }}>
                        {ins.title}
                      </h4>
                      <div style={{ fontSize: '0.82rem', color: 'var(--foreground)', marginBottom: '10px', lineHeight: 1.5 }}>
                        <strong style={{ color: '#dc2626' }}>Problem Encountered: </strong>
                        {ins.problem}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--foreground)', marginBottom: '14px', lineHeight: 1.5 }}>
                        <strong style={{ color: '#059669' }}>Gateway Solution: </strong>
                        {ins.solution}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <pre style={{
                          background: 'var(--surface-muted)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: 'var(--foreground)',
                          overflowX: 'auto',
                          margin: 0
                        }}>
                          {ins.codeSnippet}
                        </pre>
                        <button
                          onClick={() => handleCopy(ins.codeSnippet, ins.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            color: 'var(--foreground)',
                            fontSize: '0.68rem',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedKey === ins.id ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeDxTab === 'schemas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
                    Copy these official tool definitions directly into ElevenLabs Conversational AI Agent Studio.
                    The model invokes these with the <code>FlowGuard_</code> prefix (the gateway also accepts the legacy <code>IntentGate_</code> prefix used by the earlier prototype).
                  </p>

                  {dxNotes?.elevenLabsToolSchemas?.map((schema, idx) => (
                    <div key={idx} style={{ background: 'var(--card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>
                          {schema.name}
                        </span>
                        <button
                          onClick={() => handleCopy(JSON.stringify(schema, null, 2), `schema_${idx}`)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                        >
                          {copiedKey === `schema_${idx}` ? 'Copied JSON!' : 'Copy Schema JSON'}
                        </button>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                        {schema.description}
                      </div>
                      <pre style={{
                        background: 'var(--surface-muted)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                        color: 'var(--foreground)',
                        margin: 0,
                        maxHeight: '160px',
                        overflowY: 'auto'
                      }}>
                        {JSON.stringify(schema, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {activeDxTab === 'curl' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'var(--card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.82rem' }}>
                        1. Webhook Tool Call: FlowGuard_payoutChange (&lt;5s window response)
                      </span>
                      <button
                        onClick={() => handleCopy(`curl -X POST https://flowguard-treasury.vercel.app/api/voice/gateway/tool-call \\
  -H "Content-Type: application/json" \\
  -d '{"rawToolName": "FlowGuard_payoutChange", "parameters": {"account_id": "ACC-4471", "new_destination": "GB29 NWBK 6016 1331 9268 19"}}'`, 'curl1')}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                      >
                        {copiedKey === 'curl1' ? 'Copied!' : 'Copy cURL'}
                      </button>
                    </div>
                    <pre style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--foreground)', margin: 0, overflowX: 'auto' }}>
{`curl -X POST https://flowguard-treasury.vercel.app/api/voice/gateway/tool-call \\
  -H "Content-Type: application/json" \\
  -d '{"rawToolName": "FlowGuard_payoutChange", "parameters": {"account_id": "ACC-4471", "new_destination": "GB29 NWBK 6016 1331 9268 19"}}'`}
                    </pre>
                  </div>

                  <div style={{ background: 'var(--card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.82rem' }}>
                        2. Supervisor Press Deny Endpoint
                      </span>
                      <button
                        onClick={() => handleCopy(`curl -X POST https://flowguard-treasury.vercel.app/api/voice/supervisor/decision \\
  -H "Content-Type: application/json" \\
  -d '{"decision": "DENY", "supervisorName": "beyond_nothing"}'`, 'curl2')}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                      >
                        {copiedKey === 'curl2' ? 'Copied!' : 'Copy cURL'}
                      </button>
                    </div>
                    <pre style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--foreground)', margin: 0, overflowX: 'auto' }}>
{`curl -X POST https://flowguard-treasury.vercel.app/api/voice/supervisor/decision \\
  -H "Content-Type: application/json" \\
  -d '{"decision": "DENY", "supervisorName": "beyond_nothing"}'`}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
