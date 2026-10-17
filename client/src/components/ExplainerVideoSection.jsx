import React, { useState, useRef, useEffect } from 'react';
import {
  Video, Play, Pause, FileText, ShieldCheck, Info,
  ExternalLink, ChevronDown, ChevronUp, Volume2, VolumeX,
  Layers, Lock, CheckCircle2, Sparkles, Clock
} from 'lucide-react';

const SCENES = [
  { id: 'scene_1', sceneNumber: 1, title: 'The Problem', time: '0:00 - 0:18', startSec: 0.5, desc: 'Why conversational voice agents need execution-level guardrails between words and funds.' },
  { id: 'scene_2', sceneNumber: 2, title: 'What It Is', time: '0:18 - 0:32', startSec: 19.5, desc: 'BeyondFlow: ElevenLabs voice interface governed by ArmorIQ cryptographic authority.' },
  { id: 'scene_3', sceneNumber: 3, title: 'How It Works', time: '0:32 - 1:00', startSec: 31.0, desc: 'Caller -> ElevenLabs webhook -> BeyondFlow gateway -> ArmorIQ PEP -> Treasury MCP.' },
  { id: 'scene_4', sceneNumber: 4, title: 'How We Used ElevenLabs', time: '1:00 - 1:25', startSec: 59.0, desc: 'Sub-5s webhook holding pattern, structured parameter extraction, and AI voiceover.' },
  { id: 'scene_5', sceneNumber: 5, title: 'How We Used ArmorIQ', time: '1:25 - 2:00', startSec: 85.0, desc: 'capturePlan -> getIntentToken -> invoke via proxy.armoriq.ai & dual-supervisor quorum.' },
  { id: 'scene_6', sceneNumber: 6, title: 'The Boundary Test', time: '2:00 - 2:30', startSec: 126.0, desc: 'Live screen recording: ALLOWED read, BLOCKED wire diversion, HELD refund release.' },
  { id: 'scene_7', sceneNumber: 7, title: 'How It Differs', time: '2:30 - 2:52', startSec: 153.0, desc: 'Intent enforcement vs semantic guardrails, post-hoc logging, and blanket API keys.' },
  { id: 'scene_8', sceneNumber: 8, title: 'Close & Disclosures', time: '2:52 - 3:05', startSec: 173.0, desc: 'Official sandbox environment disclosures, MIT/OFL license credits, and platform references.' }
];

export default function ExplainerVideoSection({
  videoSrc = "/videos/beyondflow-explainer.webm",
  posterSrc = "/poster.png",
  audioSrc = "/audio/beyondflow-narration-master.mp3"
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [voiceoverMuted, setVoiceoverMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Sync audio with video playback
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      if (!voiceoverMuted) {
        audio.currentTime = video.currentTime;
        audio.play().catch(() => {});
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      audio.pause();
    };

    const handleTimeUpdate = () => {
      const cur = video.currentTime;
      // Drift compensation if desynced by more than 0.25s
      if (!voiceoverMuted && Math.abs(audio.currentTime - cur) > 0.25) {
        audio.currentTime = cur;
      }
      // Determine active scene
      for (let i = SCENES.length - 1; i >= 0; i--) {
        if (cur >= SCENES[i].startSec) {
          setActiveSceneIdx(i);
          break;
        }
      }
    };

    const handleSeeking = () => {
      audio.currentTime = video.currentTime;
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
    };
  }, [voiceoverMuted]);

  const toggleVoiceover = () => {
    const nextMuted = !voiceoverMuted;
    setVoiceoverMuted(nextMuted);
    if (audioRef.current) {
      if (nextMuted) {
        audioRef.current.pause();
      } else if (videoRef.current && !videoRef.current.paused) {
        audioRef.current.currentTime = videoRef.current.currentTime;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const jumpToScene = (startSec, idx) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startSec;
      if (audioRef.current) {
        audioRef.current.currentTime = startSec;
      }
      videoRef.current.play().catch(() => {});
    }
    setActiveSceneIdx(idx);
  };

  return (
    <section
      id="explainer-video"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(13, 13, 17, 0.95) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px',
        padding: '32px 24px',
        marginBottom: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* Header Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Video size={15} />
          <span>Official 3-Minute Architectural Explainer Video</span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '4px 10px', borderRadius: '6px' }}>
          <Info size={13} />
          <span>Sandbox / test environment. No real funds or customer data.</span>
        </div>
      </div>

      <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
        How BeyondFlow Governs Autonomous Treasury with ArmorIQ & ElevenLabs
      </h2>
      <p style={{ fontSize: '0.92rem', color: 'var(--muted-foreground)', maxWidth: '900px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
        A complete 3-minute architectural walkthrough explaining (1) how BeyondFlow works, (2) how ElevenLabs conversational voice is utilized with sub-5s webhook replies, (3) how ArmorIQ enforces policy and cryptographic plan binding, and (4) how intent-first governance fundamentally differs from traditional API safeguards.
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
                background: activeSceneIdx === idx ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                border: activeSceneIdx === idx ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '8px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                color: activeSceneIdx === idx ? '#ffffff' : 'var(--muted-foreground)'
              }}
              title={scene.desc}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ fontSize: '0.66rem', fontFamily: 'monospace', color: activeSceneIdx === idx ? '#a5b4fc' : '#64748b' }}>
                  {scene.time}
                </span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: activeSceneIdx === idx ? '#4f46e5' : 'rgba(255,255,255,0.06)' }}>
                  P{scene.sceneNumber}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {scene.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Video Player Container */}
      <div style={{
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
          preload="metadata"
          poster={posterSrc}
          style={{ width: '100%', maxHeight: '560px', display: 'block', outline: 'none' }}
        >
          <source src={videoSrc} type="video/webm" />
          <source src={videoSrc.replace('.webm', '.mp4')} type="video/mp4" />
          <track
            kind="captions"
            src="/captions.vtt"
            srcLang="en"
            label="English Subtitles (Word-Aligned)"
            default
          />
          Your browser does not support HTML5 video.
        </video>

        {/* Hidden Synchronized Audio Track */}
        <audio ref={audioRef} preload="auto" src={audioSrc} />
      </div>

      {/* Player Utility Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }}>
        {/* Verification Trace Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>
            <strong>Recorded live on 2026-10-17</strong> (Trace: <code style={{ color: '#38bdf8' }}>armoriq:5081adc84221:1a1472a954f</code>)
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
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
          maxHeight: '400px',
          overflowY: 'auto',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          color: 'var(--foreground)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                    [{scene.time}]
                  </span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f1f5f9' }}>
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
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '18px 20px',
          fontSize: '0.8rem',
          color: 'var(--muted-foreground)',
          lineHeight: 1.6
        }}>
          <div style={{ fontWeight: 800, color: '#fafafa', marginBottom: '8px', fontSize: '0.88rem' }}>
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
