import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const FFMPEG_PATH = 'C:\\Users\\vikas sharma\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const FRAMES_DIR = path.resolve('scratch/video-scenes');
const OUT_DIR = path.resolve('out');

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = JSON.parse(fs.readFileSync('video/audio/manifest.json', 'utf8'));

// Common CSS styling for all 1920x1080 scene slides
const baseStyle = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1920px;
    height: 1080px;
    background: radial-gradient(circle at 50% 15%, #0f172a 0%, #09090b 60%, #030712 100%);
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 70px 90px;
    overflow: hidden;
    position: relative;
  }
  .header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .logo-badge {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
  }
  .logo-badge span { color: #10b981; }
  .scene-pill {
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.4);
    color: #a5b4fc;
    padding: 8px 20px;
    border-radius: 9999px;
    font-size: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .sandbox-pill {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.35);
    color: #fbbf24;
    padding: 8px 18px;
    border-radius: 9999px;
    font-size: 15px;
    font-weight: 600;
  }
  .footer-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 24px;
    font-size: 16px;
    color: #64748b;
  }
  .code-box {
    background: #0d1117;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 24px;
    font-family: "JetBrains Mono", Consolas, monospace;
    font-size: 18px;
    line-height: 1.6;
    color: #e2e8f0;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
  }
  .code-path {
    color: #38bdf8;
    font-size: 15px;
    margin-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 8px;
    display: flex;
    justify-content: space-between;
  }
`;

// HTML Generators for each Scene
const scenesHtml = {
  scene_1: `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyle}
    .hero-content { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 40px; text-align: center; }
    .question-icon { font-size: 90px; color: #ef4444; margin-bottom: 20px; animation: pulse 2s infinite; }
    h1 { font-size: 64px; font-weight: 800; line-height: 1.15; margin-bottom: 24px; max-width: 1400px; }
    p { font-size: 28px; color: #94a3b8; max-width: 1100px; margin-bottom: 50px; line-height: 1.5; }
    .tools-row { display: flex; gap: 30px; width: 100%; max-width: 1300px; justify-content: center; }
    .tool-chip { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); padding: 22px 32px; border-radius: 14px; font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 14px; }
  </style></head><body>
    <div class="header-bar">
      <div class="logo-badge">Beyond<span>Flow</span></div>
      <div class="scene-pill">Scene 1 · The Security Problem</div>
      <div class="sandbox-pill">⚠️ Sandbox / Test Environment</div>
    </div>
    <div class="hero-content">
      <div class="question-icon">❓</div>
      <h1>Voice AI agents can now talk to users and move money.</h1>
      <p>Look up an order. Change a payout bank. Issue an immediate refund.<br/>Callers can pressure, prompt-inject, or trick them.</p>
      <div class="tools-row">
        <div class="tool-chip" style="border-left: 4px solid #10b981;">🔍 lookup_order (Read)</div>
        <div class="tool-chip" style="border-left: 4px solid #ef4444;">💸 change_payout (Disbursement Wire)</div>
        <div class="tool-chip" style="border-left: 4px solid #f59e0b;">💳 issue_refund (High Risk)</div>
      </div>
    </div>
    <div class="footer-bar">
      <div>The question isn't how smart the voice sounds. It's what stands between its words and your money.</div>
      <div>ArmorIQ Flow State Hackathon 2026</div>
    </div>
  </body></html>`,

  scene_2: `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyle}
    .flow-row { display: flex; align-items: center; justify-content: space-between; margin: 80px 0; gap: 20px; }
    .node { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 36px 30px; text-align: center; flex: 1; }
    .node-title { font-size: 26px; font-weight: 800; margin-bottom: 10px; color: #f8fafc; }
    .node-desc { font-size: 18px; color: #94a3b8; }
    .arrow { font-size: 34px; color: #6366f1; }
  </style></head><body>
    <div class="header-bar">
      <div class="logo-badge">Beyond<span>Flow</span></div>
      <div class="scene-pill">Scene 2 · Meet BeyondFlow</div>
      <div class="sandbox-pill">⚠️ Sandbox / Test Environment</div>
    </div>
    <div>
      <h1 style="font-size: 54px; font-weight: 800; margin-bottom: 12px;">Autonomous Treasury & Intent Vault</h1>
      <p style="font-size: 24px; color: #94a3b8;">ElevenLabs provides the voice. ArmorIQ decides what it is allowed to do.</p>
      <div class="flow-row">
        <div class="node" style="border-top: 4px solid #38bdf8;">
          <div class="node-title">Caller</div>
          <div class="node-desc">Inbound telephony voice</div>
        </div>
        <div class="arrow">➔</div>
        <div class="node" style="border-top: 4px solid #818cf8;">
          <div class="node-title">ElevenLabs Agent</div>
          <div class="node-desc">Conversational platform & webhooks</div>
        </div>
        <div class="arrow">➔</div>
        <div class="node" style="border-top: 4px solid #10b981; background: rgba(16, 185, 129, 0.06);">
          <div class="node-title">ArmorIQ Authority</div>
          <div class="node-desc">Ed25519 Intent Tokens & Proxy PEP</div>
        </div>
        <div class="arrow">➔</div>
        <div class="node" style="border-top: 4px solid #c084fc;">
          <div class="node-title">Treasury MCP Server</div>
          <div class="node-desc">lookup_order, change_payout, issue_refund</div>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <div>Zero allow or block decisions live in our own code — 100% cryptographic policy enforcement.</div>
      <div>https://flowguard-treasury.vercel.app</div>
    </div>
  </body></html>`,

  scene_3: `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyle}
    .branches { display: flex; gap: 30px; margin-top: 40px; }
    .branch-card { flex: 1; border-radius: 16px; padding: 36px 30px; border: 1px solid; }
    .b-title { font-size: 28px; font-weight: 800; margin-bottom: 14px; display: flex; align-items: center; gap: 12px; }
    .b-desc { font-size: 19px; line-height: 1.5; color: #cbd5e1; }
  </style></head><body>
    <div class="header-bar">
      <div class="logo-badge">Beyond<span>Flow</span></div>
      <div class="scene-pill">Scene 3 · The Big Picture (3 Outcomes)</div>
      <div class="sandbox-pill">⚠️ Sandbox / Test Environment</div>
    </div>
    <div>
      <h1 style="font-size: 52px; font-weight: 800; margin-bottom: 12px;">Only an approved call reaches our MCP tools.</h1>
      <p style="font-size: 22px; color: #94a3b8;">When the agent decides to act, the gateway asks ArmorIQ to evaluate. Exactly three outcomes can happen:</p>
      <div class="branches">
        <div class="branch-card" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.4);">
          <div class="b-title" style="color: #34d399;">✅ 1. ALLOWED</div>
          <div class="b-desc">Read inquiries (<code>lookup_order</code>) are validated against policy. Token minted, tool invoked through proxy.armoriq.ai, verified order answer returned to caller.</div>
        </div>
        <div class="branch-card" style="background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.4);">
          <div class="b-title" style="color: #f87171;">🛑 2. BLOCKED</div>
          <div class="b-desc">Unauthorized routing changes (<code>change_payout</code>) are rejected by policy with <code>PolicyBlockedException (403)</code>. Execution halts; wire diversion prevented.</div>
        </div>
        <div class="branch-card" style="background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.4);">
          <div class="b-title" style="color: #fbbf24;">⏸️ 3. HELD</div>
          <div class="b-desc">High-risk refund requests (<code>issue_refund</code>) trigger a platform delegation request. The call is held until two human supervisors submit dual cryptographic approvals.</div>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <div>Trace: armoriq:5081adc84221:1a146791a57 · Matched Policy: flowguard-treasury-allowlist</div>
      <div>Real Runtime Execution</div>
    </div>
  </body></html>`,

  scene_4: `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyle}
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
  </style></head><body>
    <div class="header-bar">
      <div class="logo-badge">Beyond<span>Flow</span></div>
      <div class="scene-pill">Scene 4 · How We Used ElevenLabs</div>
      <div class="sandbox-pill">⏱️ Webhook Window: ~5s</div>
    </div>
    <div>
      <h1 style="font-size: 46px; font-weight: 800; margin-bottom: 8px;">Spoken Words &rarr; Structured Webhooks</h1>
      <p style="font-size: 20px; color: #94a3b8;">ElevenLabs Conversational Voice Agent maps caller speech to webhook tools.</p>
      <div class="content-grid">
        <div class="code-box">
          <div class="code-path"><span>ElevenLabs Agent Tool Definitions</span><span>Webhook Dispatcher</span></div>
          <pre style="color: #38bdf8;">// Registered Webhook Tools on ElevenLabs:
1. BeyondFlow_orderLookup
   POST /api/voice/gateway/tool-call
   Parameters: { "order_id": "ORD-1001" }

2. BeyondFlow_payoutChange
   POST /api/voice/gateway/tool-call
   Parameters: { "new_routing": "021000021" }

3. BeyondFlow_issueRefund
   POST /api/voice/gateway/tool-call
   Parameters: { "order_id": "ORD-1001", "amount": 89 }</pre>
        </div>
        <div class="code-box">
          <div class="code-path"><span>server/voiceGatewayService.js</span><span>Lines 239-253 & 890-898</span></div>
          <pre style="color: #a5b4fc;">async handleToolCall({ rawToolName, parameters }) {
  const canonicalTool = this.normalizeToolName(rawToolName);
  
  // ElevenLabs timeout window is ~5s:
  // Gateway answers inside the window with holding utterance
  if (isHeld) {
    return res.json({
      speech: "Refund held for supervisor review. Reference ID: " + delegationId
    });
  }
}</pre>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <div>Fast-response holding pattern satisfies ElevenLabs' 5-second telephony deadline.</div>
      <div>Verbatim Repository Source</div>
    </div>
  </body></html>`,

  scene_5: `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyle}
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
  </style></head><body>
    <div class="header-bar">
      <div class="logo-badge">Beyond<span>Flow</span></div>
      <div class="scene-pill">Scene 5 · How We Used ArmorIQ</div>
      <div class="sandbox-pill">🛡️ Cryptographic Control Layer</div>
    </div>
    <div>
      <h1 style="font-size: 46px; font-weight: 800; margin-bottom: 8px;">The 3-Step SDK Pipeline: Plan &rarr; Token &rarr; Invoke</h1>
      <p style="font-size: 20px; color: #94a3b8;">No allow or block decision lives in our code; ArmorIQ proxy evaluates every invocation.</p>
      <div class="content-grid">
        <div class="code-box">
          <div class="code-path"><span>server/armorIqEnforcement.js</span><span>Lines 118-135</span></div>
          <pre style="color: #34d399;">// 1. Capture deterministic plan
const capture = client.capturePlan(
  'elevenlabs-voice-agent', prompt, {
    goal: 'Handle caller request for ' + tool,
    steps: [{ action: tool, mcp: MCP_ID, inputs: args }]
  }
);

// 2. Mint Ed25519 Intent Token at https://iap.armoriq.ai
const token = await client.getIntentToken(capture);
// token.tokenId, token.planHash, token.stepProofs</pre>
        </div>
        <div class="code-box">
          <div class="code-path"><span>server/armorIqEnforcement.js</span><span>Lines 148-180</span></div>
          <pre style="color: #f1f5f9;">// 3. Delegation Hold for refunds (multi-supervisor quorum)
if (tool === 'issue_refund' && !skipDelegation) {
  const del = await client.createDelegationRequest({
    action: 'issue_refund', arguments: args, amount: 89,
    reason: 'Requires dual supervisor approval'
  });
  return { decision: 'HELD', delegation: del };
}

// 4. Invoke tool via PEP Proxy: https://proxy.armoriq.ai
const result = await client.invoke(MCP_ID, tool, token, args);</pre>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <div>Platform Objects: Agent flowguard-agent · MCP flowguard-treasury-mcp · Policy flowguard-treasury-allowlist</div>
      <div>Cryptographic Policy Verification Flow</div>
    </div>
  </body></html>`,

  scene_6: `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyle}
    .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 30px; }
    .step-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; }
    .step-num { font-size: 20px; font-weight: 800; color: #38bdf8; margin-bottom: 8px; }
    .step-title { font-size: 17px; font-weight: 700; color: #f8fafc; margin-bottom: 8px; }
    .step-cmd { font-family: monospace; font-size: 13px; color: #a5b4fc; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 6px; }
  </style></head><body>
    <div class="header-bar">
      <div class="logo-badge">Beyond<span>Flow</span></div>
      <div class="scene-pill">Scene 6 · Set It Up Yourself (7 Steps)</div>
      <div class="sandbox-pill">⚡ Sped Up Setup Walkthrough</div>
    </div>
    <div>
      <h1 style="font-size: 46px; font-weight: 800; margin-bottom: 8px;">Run BeyondFlow On Your Own Machine</h1>
      <p style="font-size: 20px; color: #94a3b8;">Everything runs locally from clean checkout using standard package.json scripts.</p>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">Step 1</div>
          <div class="step-title">Create ArmorIQ Account</div>
          <div class="step-cmd">platform.armoriq.ai<br/>Generate API Key</div>
        </div>
        <div class="step-card">
          <div class="step-num">Step 2</div>
          <div class="step-title">Onboard Agent & MCP</div>
          <div class="step-cmd">flowguard-agent<br/>flowguard-treasury-mcp</div>
        </div>
        <div class="step-card">
          <div class="step-num">Step 3</div>
          <div class="step-title">Create 3 Policies</div>
          <div class="step-cmd">Allow reads · Block payouts<br/>Hold refunds (quorum: 2)</div>
        </div>
        <div class="step-card">
          <div class="step-num">Step 4</div>
          <div class="step-title">Start Services</div>
          <div class="step-cmd">npm run mcp:server<br/>npm run gateway</div>
        </div>
        <div class="step-card">
          <div class="step-num">Step 5</div>
          <div class="step-title">Configure ElevenLabs</div>
          <div class="step-cmd">Create Voice Agent<br/>Add webhook tools</div>
        </div>
        <div class="step-card">
          <div class="step-num">Step 6</div>
          <div class="step-title">Run Enforcement Tests</div>
          <div class="step-cmd">npm run test:enforcement<br/>npm run test:intent</div>
        </div>
        <div class="step-card" style="grid-column: span 2; border-color: rgba(16,185,129,0.4);">
          <div class="step-num" style="color: #34d399;">Step 7 · Supervisor Release</div>
          <div class="step-title">Dual Approval Quorum (2/2)</div>
          <div class="step-cmd">Open playground at /voice &bull; Sign off with Supervisor 1 & Supervisor 2 to release held funds</div>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <div>All commands tested against clean checkout · See /how-it-works for full verbatim guide.</div>
      <div>https://github.com/vikassharma270907-alt/beyondflow-treasury</div>
    </div>
  </body></html>`,

  scene_8: `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyle}
    .cards-row { display: flex; gap: 20px; margin-top: 50px; }
    .diff-card { flex: 1; border-radius: 14px; padding: 26px 20px; border: 1px solid; background: rgba(255,255,255,0.03); }
    .diff-title { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
    .diff-desc { font-size: 16px; color: #94a3b8; line-height: 1.4; }
  </style></head><body>
    <div class="header-bar">
      <div class="logo-badge">Beyond<span>Flow</span></div>
      <div class="scene-pill">Scene 8 · How It Differs From Industry Standards</div>
      <div class="sandbox-pill">💡 Architecture Comparison</div>
    </div>
    <div>
      <h1 style="font-size: 48px; font-weight: 800; margin-bottom: 8px;">Intent Enforcement vs Conventional Safeguards</h1>
      <p style="font-size: 22px; color: #94a3b8;">Why typical safeguards fail when conversational voice agents touch real funds.</p>
      <div class="cards-row">
        <div class="diff-card" style="border-color: rgba(239, 68, 68, 0.3);">
          <div class="diff-title" style="color: #f87171;">Semantic Guardrails</div>
          <div class="diff-desc">"Checks what is said." Bypassed by subtle prompt injections, social engineering, and urgent caller pressure.</div>
        </div>
        <div class="diff-card" style="border-color: rgba(239, 68, 68, 0.3);">
          <div class="diff-title" style="color: #f87171;">Static IAM Roles</div>
          <div class="diff-desc">"Same permissions for every task." Grants blanket tool privileges whether looking up an order or moving millions.</div>
        </div>
        <div class="diff-card" style="border-color: rgba(245, 158, 11, 0.3);">
          <div class="diff-title" style="color: #fbbf24;">Post-Hoc Logging</div>
          <div class="diff-desc">"Tells you after." Alerts your security team after unauthorized disbursement wires have already left the account.</div>
        </div>
        <div class="diff-card" style="border-color: rgba(245, 158, 11, 0.3);">
          <div class="diff-title" style="color: #fbbf24;">Manual Approvals</div>
          <div class="diff-desc">"Ask humans for everything." Creates unbearable latency bottlenecks and completely destroys voice UX.</div>
        </div>
        <div class="diff-card" style="border-color: #10b981; background: rgba(16, 185, 129, 0.08);">
          <div class="diff-title" style="color: #34d399;">Intent Enforcement</div>
          <div class="diff-desc">Checks the action itself BEFORE it runs against a cryptographic plan and brings in supervisors only when needed.</div>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <div>BeyondFlow: Intent-First Cryptographic Governance for Autonomous Agents.</div>
      <div>ArmorIQ Flow State Hackathon 2026</div>
    </div>
  </body></html>`,

  scene_9: `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${baseStyle}
    .center-box { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 50px; text-align: center; }
    .credits-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 30px 50px; margin-top: 30px; }
  </style></head><body>
    <div class="header-bar">
      <div class="logo-badge">Beyond<span>Flow</span></div>
      <div class="scene-pill">Scene 9 · Summary & Disclosures</div>
      <div class="sandbox-pill">⚠️ Sandbox Treasury Prototype</div>
    </div>
    <div class="center-box">
      <h1 style="font-size: 60px; font-weight: 800; margin-bottom: 14px;">BeyondFlow</h1>
      <p style="font-size: 26px; color: #a5b4fc; margin-bottom: 30px;">Powered by ElevenLabs Conversational Voice & ArmorIQ Intent Governance</p>
      <div class="credits-box">
        <div style="font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 12px;">Disclosures & Asset Attributions</div>
        <div style="font-size: 16px; color: #cbd5e1; line-height: 1.8;">
          &bull; <strong>Narration</strong>: AI voice generated with ElevenLabs (Voice: George)<br/>
          &bull; <strong>Sandbox Data</strong>: No real customer funds, PII, or live banking accounts used<br/>
          &bull; <strong>Open Source Licenses</strong>: MIT License &bull; SIL Open Font License &bull; Apache 2.0 MCP<br/>
          &bull; <strong>Live Demo & Repo</strong>: https://flowguard-treasury.vercel.app
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <div>Developed for the ArmorIQ Flow State Hackathon (October 10–17, 2026).</div>
      <div>https://github.com/vikassharma270907-alt/beyondflow-treasury</div>
    </div>
  </body></html>`
};

async function buildVideo() {
  console.log('--- Step 1: Rendering 1920x1080 HTML Scene Cards with Playwright ---');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  for (const [key, html] of Object.entries(scenesHtml)) {
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const imgPath = path.join(FRAMES_DIR, `${key}.png`);
    await page.screenshot({ path: imgPath, type: 'png' });
    console.log(`Rendered frame: ${imgPath}`);
  }
  await browser.close();

  console.log('\n--- Step 2: Generating Scene Video Segments (Exact Timing matching Audio) ---');
  const sceneClips = [];

  for (let i = 0; i < manifest.length; i++) {
    const s = manifest[i];
    const dur = s.actualSpeechSeconds;
    const clipPath = path.join(FRAMES_DIR, `clip_${s.id}.mp4`);

    if (s.id === 'scene_7') {
      // Scene 7: Real screen recording from boundary_test_recording.webm
      const realVideo = path.resolve('docs/assets/video/boundary_test_recording.webm');
      console.log(`Encoding Scene 7 from real screen recording: ${realVideo} (${dur}s)...`);
      const cmd = `"${FFMPEG_PATH}" -y -ss 0 -t ${dur} -i "${realVideo}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -r 25 -c:v libx264 -preset ultrafast -profile:v high -level 4.0 -pix_fmt yuv420p -crf 20 "${clipPath}"`;
      execSync(cmd);
    } else {
      // Still card looped for exact speech duration
      const imgPath = path.join(FRAMES_DIR, `${s.id}.png`);
      console.log(`Encoding ${s.id} (${dur}s)...`);
      const cmd = `"${FFMPEG_PATH}" -y -loop 1 -t ${dur} -i "${imgPath}" -vf "format=yuv420p" -r 25 -c:v libx264 -preset ultrafast -profile:v high -level 4.0 -pix_fmt yuv420p -crf 20 "${clipPath}"`;
      execSync(cmd);
    }
    sceneClips.push(clipPath);
  }

  console.log('\n--- Step 3: Concatenating all 9 Scene Video Clips ---');
  const listFile = path.join(FRAMES_DIR, 'concat_list.txt');
  const listContent = sceneClips.map(c => `file '${c.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(listFile, listContent);

  const stitchedVideo = path.join(FRAMES_DIR, 'stitched_visuals.mp4');
  const concatCmd = `"${FFMPEG_PATH}" -y -f concat -safe 0 -i "${listFile}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${stitchedVideo}"`;
  execSync(concatCmd);

  console.log('\n--- Step 4: Muxing Visuals with 9-Scene Master ElevenLabs Voiceover Audio ---');
  const masterAudio = path.resolve('client/public/audio/beyondflow-narration-master.mp3');
  const finalMp4Out = path.resolve(OUT_DIR, 'beyondflow-explainer.mp4');
  const finalWebmOut = path.resolve(OUT_DIR, 'beyondflow-explainer.webm');
  const clientPublicMp4 = path.resolve('client/public/videos/beyondflow-explainer.mp4');
  const clientPublicWebm = path.resolve('client/public/videos/beyondflow-explainer.webm');
  const clientDistMp4 = path.resolve('client/dist/videos/beyondflow-explainer.mp4');
  const clientDistWebm = path.resolve('client/dist/videos/beyondflow-explainer.webm');

  // Encode master MP4 (H.264 + AAC)
  console.log('Rendering master MP4...');
  const muxMp4Cmd = `"${FFMPEG_PATH}" -y -i "${stitchedVideo}" -i "${masterAudio}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 -c:a aac -b:a 192k -shortest "${finalMp4Out}"`;
  execSync(muxMp4Cmd, { stdio: 'inherit' });

  // Encode master WebM (VP9 + Opus)
  console.log('Rendering master WebM...');
  const muxWebmCmd = `"${FFMPEG_PATH}" -y -i "${finalMp4Out}" -c:v libvpx-vp9 -b:v 1500k -crf 30 -deadline good -cpu-used 4 -row-mt 1 -c:a libopus -b:a 128k "${finalWebmOut}"`;
  execSync(muxWebmCmd, { stdio: 'inherit' });

  // Copy to client public videos directory
  fs.copyFileSync(finalMp4Out, clientPublicMp4);
  fs.copyFileSync(finalWebmOut, clientPublicWebm);

  if (fs.existsSync(path.dirname(clientDistMp4))) {
    fs.copyFileSync(finalMp4Out, clientDistMp4);
  }
  if (fs.existsSync(path.dirname(clientDistWebm))) {
    fs.copyFileSync(finalWebmOut, clientDistWebm);
  }

  console.log('\n======================================================');
  console.log(`Master Video Render Complete!`);
  console.log(`MP4: ${finalMp4Out} (${(fs.statSync(finalMp4Out).size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`WebM: ${finalWebmOut} (${(fs.statSync(finalWebmOut).size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Copied to: client/public/videos/beyondflow-explainer.{mp4,webm}`);
  console.log('======================================================');
}

buildVideo().catch(err => {
  console.error(err);
  process.exit(1);
});
