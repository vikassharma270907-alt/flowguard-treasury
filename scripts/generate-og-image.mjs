/**
 * Renders the 1200x630 Open Graph card for IntentGate and writes it to both
 * public roots (client/public/og-image.png and public/og-image.png).
 *
 * Usage: node scripts/generate-og-image.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #070c17;
         color: #e8edf7; font-family: "Segoe UI", system-ui, -apple-system, sans-serif; }
  .wrap { position: relative; width: 1200px; height: 630px; padding: 52px 64px;
    display: flex; flex-direction: column; justify-content: space-between;
    background:
      radial-gradient(900px 420px at 78% -10%, rgba(56,189,248,.22), transparent 60%),
      radial-gradient(700px 380px at -10% 110%, rgba(129,140,248,.18), transparent 60%),
      linear-gradient(135deg, #05070f 0%, #0a1224 55%, #0d1830 100%); }
  .grid { position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(148,163,184,.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148,163,184,.07) 1px, transparent 1px);
    background-size: 44px 44px;
    -webkit-mask-image: radial-gradient(ellipse at 60% 40%, black 40%, transparent 78%);
            mask-image: radial-gradient(ellipse at 60% 40%, black 40%, transparent 78%); }
  .row { display: flex; align-items: center; gap: 16px; position: relative; }
  .between { justify-content: space-between; }
  .pill { display: inline-flex; align-items: center; gap: 10px; padding: 9px 18px;
    border: 1px solid rgba(56,189,248,.4); border-radius: 999px;
    background: rgba(56,189,248,.09); color: #7dd3fc; font-size: 17px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #38bdf8;
    box-shadow: 0 0 12px #38bdf8; }
  h1 { font-size: 92px; font-weight: 800; letter-spacing: -.03em; line-height: 1; }
  h1 span { background: linear-gradient(92deg, #38bdf8, #818cf8 60%, #c084fc);
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  .mark { width: 72px; height: 72px; border-radius: 18px;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    display: flex; align-items: center; justify-content: center;
    font-size: 38px; font-weight: 800; color: #06101f; }
  .tag { margin-top: 20px; font-size: 25px; color: #b6c2d9; max-width: 900px; line-height: 1.35; }
  .chips { display: flex; gap: 14px; position: relative; }
  .chip { display: flex; align-items: center; gap: 10px; padding: 12px 18px;
    border-radius: 12px; font-size: 19px; font-weight: 600; border: 1px solid;
    font-family: Consolas, "JetBrains Mono", monospace; }
  .ok { color: #34d399; border-color: rgba(52,211,153,.35); background: rgba(52,211,153,.08); }
  .block { color: #f87171; border-color: rgba(248,113,113,.35); background: rgba(248,113,113,.08); }
  .held { color: #fbbf24; border-color: rgba(251,191,36,.35); background: rgba(251,191,36,.08); }
  .foot { display: flex; justify-content: space-between; align-items: center;
    color: #8fa1bd; font-size: 19px; position: relative; margin-top: 28px; }
  .mono { font-family: Consolas, "JetBrains Mono", monospace; color: #7dd3fc; font-size: 20px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="grid"></div>
  <div class="row between">
    <div class="pill"><span class="dot"></span> ArmorIQ Flow State Hackathon &middot; 2026</div>
    <div class="mono">flowguard-treasury.vercel.app</div>
  </div>
  <div class="row" style="align-items: center;">
    <div class="mark">IG</div>
    <h1 style="margin-left: 10px;">Intent<span>Gate</span></h1>
  </div>
  <div>
    <div class="tag">The autonomous treasury agent where every action is cryptographically governed by ArmorIQ &mdash; intent tokens, policy enforcement, and human-in-the-loop holds.</div>
    <div class="foot" style="margin-top: 30px;">
      <div class="chips">
        <div class="chip ok">&#10003; lookup_order &middot; ALLOWED</div>
        <div class="chip block">&#10005; change_payout &middot; BLOCKED</div>
        <div class="chip held">&#10073;&#10073; issue_refund &middot; HELD</div>
      </div>
    </div>
    <div class="foot">
      <div>Ed25519 intent tokens &middot; OPA policy engine &middot; MCP proxy enforcement</div>
      <div class="mono">iap.armoriq.ai &middot; proxy.armoriq.ai</div>
    </div>
  </div>
</div>
</body>
</html>`;

const targets = [
  path.resolve('client/public/og-image.png'),
  path.resolve('public/og-image.png'),
];

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
} catch {
  browser = await chromium.launch({ headless: true });
}
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buf);
  console.log(`wrote ${target} (${buf.length} bytes)`);
}
