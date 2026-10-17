import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT_DIR = path.resolve('out');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const posterHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1280px;
      height: 720px;
      background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #09090b 75%, #000 100%);
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 80px;
      position: relative;
      overflow: hidden;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      padding: 8px 18px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      width: fit-content;
    }
    .hero {
      margin-top: 40px;
    }
    h1 {
      font-size: 58px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
      background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
    }
    p {
      font-size: 24px;
      color: #94a3b8;
      max-width: 900px;
      line-height: 1.5;
    }
    .pillars {
      display: flex;
      gap: 20px;
      margin-top: 40px;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px 24px;
      flex: 1;
      backdrop-filter: blur(10px);
    }
    .card-title {
      font-size: 13px;
      text-transform: uppercase;
      color: #38bdf8;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .card-val {
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 24px;
      color: #64748b;
      font-size: 14px;
    }
    .disclaimer {
      color: #f59e0b;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div>
    <div class="badge">
      ArmorIQ Flow State Hackathon 2026 · 3-Minute Architectural Explainer
    </div>
    <div class="hero">
      <h1>BeyondFlow</h1>
      <p>Autonomous Treasury & Intent Vault Governed by ArmorIQ and ElevenLabs Conversational Voice.</p>
    </div>
    <div class="pillars">
      <div class="card" style="border-left: 3px solid #6366f1;">
        <div class="card-title">1. Conversational Voice</div>
        <div class="card-val">ElevenLabs Sub-5s Webhooks</div>
      </div>
      <div class="card" style="border-left: 3px solid #10b981;">
        <div class="card-title">2. Intent Assurance</div>
        <div class="card-val">ArmorIQ PEP Proxy & OPA Policy</div>
      </div>
      <div class="card" style="border-left: 3px solid #f59e0b;">
        <div class="card-title">3. Action Boundary</div>
        <div class="card-val">Dual Supervisor Hold Quorum</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div>
      <div>Trace: armoriq:5081adc84221:1a1472a954f · MCP: flowguard-treasury-mcp</div>
      <div style="margin-top: 4px;">https://flowguard-treasury.vercel.app</div>
    </div>
    <div class="disclaimer">
      Sandbox / test environment. No real funds or customer data.
    </div>
  </div>
</body>
</html>
`;

async function generatePoster() {
  console.log('Rendering 1280x720 poster image...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
    });
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent(posterHtml, { waitUntil: 'networkidle' });
  const posterPath = path.join(OUT_DIR, 'poster.png');
  await page.screenshot({ path: posterPath, type: 'png' });
  await browser.close();
  console.log(`Saved poster image: ${posterPath} (1280x720)`);
}

generatePoster();
