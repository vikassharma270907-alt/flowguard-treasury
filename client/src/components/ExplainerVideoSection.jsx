import React, { useState, useRef, useEffect } from 'react';
import {
  Video, Play, Pause, FileText, ShieldCheck, Info,
  ExternalLink, ChevronDown, ChevronUp, Volume2, VolumeX,
  Layers, Lock, CheckCircle2, Sparkles, Clock
} from 'lucide-react';

const SCENES = [
  { id: 'scene_1', sceneNumber: 1, title: 'The Problem', time: '0:00 - 0:17', startSec: 0.5, desc: 'Why voice AI needs execution-level guardrails between its words and your money.' },
  { id: 'scene_2', sceneNumber: 2, title: 'Meet BeyondFlow', time: '0:17 - 0:30', startSec: 17.0, desc: 'BeyondFlow: ElevenLabs voice interface governed by ArmorIQ cryptographic authority.' },
  { id: 'scene_3', sceneNumber: 3, title: 'The Big Picture', time: '0:30 - 0:56', startSec: 30.5, desc: 'Caller -> ElevenLabs webhook -> BeyondFlow gateway -> ArmorIQ PEP -> Treasury MCP.' },
  { id: 'scene_4', sceneNumber: 4, title: 'How We Used ElevenLabs', time: '0:56 - 1:22', startSec: 56.5, desc: 'Sub-5s webhook holding pattern, structured parameter extraction, and AI voiceover.' },
  { id: 'scene_5', sceneNumber: 5, title: 'How We Used ArmorIQ', time: '1:22 - 1:55', startSec: 82.0, desc: 'capturePlan -> getIntentToken -> invoke via proxy.armoriq.ai & dual-supervisor quorum.' },
  { id: 'scene_6', sceneNumber: 6, title: 'Set It Up, Step by Step', time: '1:55 - 2:54', startSec: 115.5, desc: '7-step setup guide: ArmorIQ platform onboarding, policies, env, webhooks, and tests.' },
  { id: 'scene_7', sceneNumber: 7, title: 'The Boundary Test', time: '2:54 - 3:23', startSec: 174.5, desc: 'Live screen recording: ALLOWED read, BLOCKED wire diversion, HELD refund release.' },
  { id: 'scene_8', sceneNumber: 8, title: 'How It Differs', time: '3:23 - 3:45', startSec: 203.8, desc: 'Intent enforcement vs semantic guardrails, post-hoc logging, and blanket API keys.' },
  { id: 'scene_9', sceneNumber: 9, title: 'Close & Disclosures', time: '3:45 - 3:58', startSec: 225.8, desc: 'Sandbox environment disclosures, MIT/OFL license credits, and platform references.' }
];

export default function ExplainerVideoSection({
  videoSrc = "/videos/beyondflow-explainer.mp4",
  posterSrc = "/poster.webp",
  audioSrc = "/audio/beyondflow-narration-master.mp3"
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [voiceoverMuted, setVoiceoverMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePoster, setActivePoster] = useState('');

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Lazy load video poster only when within 250px of viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('IntersectionObserver' in window)) {
      setActivePoster(posterSrc);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        setActivePoster(posterSrc);
        observer.disconnect();
      }
    }, { rootMargin: '250px' });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [posterSrc]);

  // Sync scene chapter highlighting with video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleTimeUpdate = () => {
      const cur = video.currentTime;
      // Determine active scene based on current playback time
      for (let i = SCENES.length - 1; i >= 0; i--) {
        if (cur >= SCENES[i].startSec) {
          setActiveSceneIdx(i);
          break;
        }
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const toggleVoiceover = () => {
    const nextMuted = !voiceoverMuted;
    setVoiceoverMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const jumpToScene = (startSec, idx) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startSec;
      videoRef.current.play().catch(() => {});
    }
    setActiveSceneIdx(idx);
  };

  return (
    <section
      id="explainer-video"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px 24px',
        marginBottom: '40px',
        boxShadow: 'var(--card-shadow)'
      }}
    >
      {/* Header Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'var(--pill-watch-bg, rgba(99, 102, 241, 0.2))', border: '1px solid var(--pill-watch-border, rgba(99, 102, 241, 0.4))', color: 'var(--pill-watch-text, #c7d2fe)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Video size={15} />
          <span>Official Demo Video (3:49) — Architectural Explainer</span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--warning, #fbbf24)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
          <Info size={13} />
          <span>Sandbox / test environment. No real funds or customer data.</span>
        </div>
      </div>

      <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
        How BeyondFlow Governs Autonomous Actions with ArmorIQ & ElevenLabs
      </h2>
      <p style={{ fontSize: '0.92rem', color: 'var(--muted-foreground)', maxWidth: '900px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
        A complete architectural walkthrough explaining (1) how BeyondFlow works, (2) how ElevenLabs conversational voice is utilized with sub-5s webhook replies, (3) how ArmorIQ enforces policy and cryptographic plan binding, and (4) how intent-first governance fundamentally differs from traditional API safeguards.
      </p>

      {/* Chapter Navigation Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Jump to Scene Chapter:
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: '8px'
        }}>
          {SCENES.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => jumpToScene(scene.startSec, idx)}
              style={{
                background: activeSceneIdx === idx ? 'var(--card)' : 'var(--secondary)',
                border: activeSceneIdx === idx ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                color: 'var(--foreground)'
              }}
              title={scene.desc}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ fontSize: '0.66rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--foreground)' }}>
                  {scene.time}
                </span>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: activeSceneIdx === idx ? 'var(--primary)' : 'var(--muted)',
                  color: activeSceneIdx === idx ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}>
                  P{scene.sceneNumber}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--foreground)' }}>
                {scene.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Video Player Container */}
      <div ref={containerRef} style={{
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        background: '#000',
        marginBottom: '16px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)'
      }}>
        <video
          ref={videoRef}
          controls
          preload="none"
          poster={activePoster || undefined}
          style={{ width: '100%', maxHeight: '560px', display: 'block', outline: 'none' }}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc.replace('.mp4', '.webm')} type="video/webm" />
          <track
            kind="captions"
            src="/captions.vtt"
            srcLang="en"
            label="English Subtitles (Word-Aligned)"
          />
          Your browser does not support HTML5 video.
        </video>
      </div>

      {/* Player Utility Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        background: 'var(--surface-muted)',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        fontSize: '0.78rem',
        color: 'var(--foreground)'
      }}>
        {/* Verification Trace Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="var(--success)" />
          <span style={{ color: 'var(--foreground)' }}>
            <strong>Recorded live on 2026-10-17</strong> (Trace: <code style={{ color: 'var(--step-sky-text)', fontWeight: 600 }}>armoriq:5081adc84221:1a1472a954f</code>)
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Voiceover Audio Toggle */}
          <button
            onClick={toggleVoiceover}
            className={`btn btn-sm ${voiceoverMuted ? 'btn-secondary' : 'btn-primary'}`}
            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
            title="Toggle synchronized ElevenLabs AI narration audio"
          >
            {voiceoverMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{voiceoverMuted ? 'ElevenLabs Voiceover: Muted' : 'ElevenLabs Voiceover: Active'}</span>
          </button>

          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <FileText size={14} />
            <span>{showTranscript ? 'Hide Transcript' : 'Interactive Transcript'}</span>
            {showTranscript ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            onClick={() => setShowCredits(!showCredits)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <Info size={14} />
            <span>Attribution & Disclosures</span>
          </button>
        </div>
      </div>

      {/* Expandable Transcript with Clickable Jump Targets */}
      {showTranscript && (
        <div style={{
          marginTop: '18px',
          background: 'var(--surface-muted)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
          maxHeight: '400px',
          overflowY: 'auto',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          color: 'var(--foreground)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--step-indigo-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} />
              <span>Full Explainer Narration Script (8 Scenes · Duration: 03:05)</span>
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>Click any timestamp to seek video</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {SCENES.map((scene, idx) => (
              <div
                key={scene.id}
                onClick={() => jumpToScene(scene.startSec, idx)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: activeSceneIdx === idx ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: activeSceneIdx === idx ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--step-sky-text)' }}>
                    [{scene.time}]
                  </span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    Scene {scene.sceneNumber}: {scene.title}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted-foreground)' }}>
                  {idx === 0 && "\"Voice AI agents can now answer calls and take action: look up an order, change a payout, issue a refund. But callers can pressure or trick an agent into doing what it should never do. The question isn't whether the agent sounds smart. It's what stands between its words and your money.\""}
                  {idx === 1 && "\"BeyondFlow is a voice support agent for a sandbox treasury team. ElevenLabs gives it a natural voice. ArmorIQ decides what it is allowed to do.\""}
                  {idx === 2 && "\"Here's the flow. The caller talks to an ElevenLabs voice agent. When the agent needs to act, it calls our gateway. The gateway asks ArmorIQ to approve the action, and only then does the request reach our MCP server, which holds the tools. Allowed calls return an answer. Blocked calls stop. Risky calls are held for human approval.\""}
                  {idx === 3 && "\"First, ElevenLabs. We built a conversational voice agent on it. Its tools are webhooks that point at our gateway, so every spoken request becomes a structured tool call. Because the webhook expects an answer in about five seconds, our gateway replies quickly when a call is held, and the caller can ask for the supervisor's decision. ElevenLabs also generated the narration you're hearing.\""}
                  {idx === 4 && "\"Now ArmorIQ. We registered our agent and MCP servers on the ArmorIQ platform and set three policies: allow reads, block payout changes, and hold refunds for two approvals. In code, our gateway uses the ArmorIQ SDK in three steps: capture the plan, get an intent token, and invoke the tool through ArmorIQ's proxy. For held refunds, we open a delegation request and release the call once two supervisors approve. No allow or block decision lives in our code. A separate test shows ArmorIQ refusing a token used on the wrong tool.\""}
                  {idx === 5 && "\"Now the boundary test, recorded from a real run. 'Where is my order?' Allowed. Asking the agent to send a payout to a new account? Blocked by policy. A refund request? Held until two supervisors approve, then released. Same agent, same voice, three outcomes, each decided by ArmorIQ.\""}
                  {idx === 6 && "\"Typical safeguards check what is said, grant the same permissions for every task, log what happened afterwards, or ask a human to approve everything. Intent enforcement checks the action itself, before it runs, against a plan and a policy, and involves people only when it matters.\""}
                  {idx === 7 && "\"It's a prototype on sandbox data, and one layer among several. BeyondFlow, powered by ElevenLabs and ArmorIQ.\""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Credits & Mandatory Hackathon Disclosures */}
      {showCredits && (
        <div style={{
          marginTop: '14px',
          background: 'var(--surface-muted)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '18px 20px',
          fontSize: '0.8rem',
          color: 'var(--muted-foreground)',
          lineHeight: 1.6
        }}>
          <div style={{ fontWeight: 800, color: 'var(--foreground)', marginBottom: '8px', fontSize: '0.88rem' }}>
            Official Hackathon Disclosures & Attributions
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <strong>AI Voice Narration:</strong> Generated with <strong>ElevenLabs</strong> (Sarah voice model, Eleven Multilingual v2).
            </li>
            <li>
              <strong>Cryptographic Intent Governance:</strong> Governed through <strong>ArmorIQ Platform</strong> (CSRG-IAP & PEP Proxy at <code>proxy.armoriq.ai</code>).
            </li>
            <li>
              <strong>Trace Identifier:</strong> <code>armoriq:5081adc84221:1a1472a954f</code> (Recorded from live run on 2026-10-17).
            </li>
            <li>
              <strong>Model Context Protocol:</strong> Reference MCP SDK (<code>@modelcontextprotocol/sdk</code> v1.32.1) under MIT license.
            </li>
            <li>
              <strong>Sandbox Environment Attestation:</strong> 100% synthetic sandbox data (orders ORD-1001, accounts ACC-4471). Zero real customer funds moved.
            </li>
            <li>
              <strong>Open Source Fonts:</strong> Inter (OFL 1.1), JetBrains Mono (Apache 2.0).
            </li>
          </ul>
        </div>
      )}
    </section>
  );
}
