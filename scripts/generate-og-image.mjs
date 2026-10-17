import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background: radial-gradient(circle at 50% 10%, #1e1b4b 0%, #09090b 70%, #000 100%);
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 50px 70px;
      position: relative;
      overflow: hidden;
    }
    .grid-lines {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 24px;
      color: #10b981;
    }
    .brand-name {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #ffffff;
    }
    .brand-name span {
      color: #10b981;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .hero {
      z-index: 10;
      margin-top: 10px;
    }
    h1 {
      font-size: 50px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      background: linear-gradient(135deg, #ffffff 30%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 16px;
    }
    p {
      font-size: 20px;
      color: #94a3b8;
      max-width: 960px;
      line-height: 1.5;
    }
    .pillars {
      display: flex;
      gap: 16px;
      z-index: 10;
      margin-top: 24px;
    }
    .card {
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px 20px;
      flex: 1;
    }
    .card-title {
      font-size: 11px;
      text-transform: uppercase;
      color: #38bdf8;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .card-val {
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 18px;
      color: #64748b;
      font-size: 13px;
      z-index: 10;
    }
    .disclaimer {
      color: #f59e0b;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="grid-lines"></div>
  <div class="header">
    <div class="brand">
      <div class="logo-box">B</div>
      <div class="brand-name">Beyond<span>Flow</span></div>
    </div>
    <div class="pill">ArmorIQ Intent-First Governance</div>
  </div>

  <div class="hero">
    <h1>Autonomous Treasury & Intent Vault Governed by ArmorIQ</h1>
    <p>
      Conversational AI voice telephony powered by ElevenLabs, cryptographically bound to declared operator intent with Ed25519 single-use tokens and PEP proxy enforcement.
    </p>

    <div class="pillars">
      <div class="card">
        <div class="card-title">AI Voice Gateway</div>
        <div class="card-val">ElevenLabs Sub-5s Webhooks</div>
      </div>
      <div class="card">
        <div class="card-title">Intent Enforcement</div>
        <div class="card-val">ArmorIQ CSRG-IAP & PEP Proxy</div>
      </div>
      <div class="card">
        <div class="card-title">Banking Tools</div>
        <div class="card-val">Treasury MCP Server (3 Tools)</div>
      </div>
      <div class="card">
        <div class="card-title">Dual Quorum</div>
        <div class="card-val">Multi-Supervisor Step-Up</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div><strong>BeyondFlow</strong> · https://flowguard-treasury.vercel.app</div>
    <div class="disclaimer">Sandbox / test environment. No real funds or customer data.</div>
  </div>
</body>
</html>
`;

async function generate() {
  console.log('Rendering 1200x630 OpenGraph card...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html);
  await page.waitForTimeout(500);

  const targets = [
    path.resolve('client/public/og-image.png'),
    path.resolve('public/og-image.png'),
    path.resolve('client/dist/og-image.png')
  ];

  for (const t of targets) {
    const dir = path.dirname(t);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: t });
    console.log(`Saved: ${t}`);
  }

  await browser.close();
  console.log('OpenGraph image successfully generated in 1200x630 PNG!');
}

generate();
