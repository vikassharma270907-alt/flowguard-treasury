import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const TARGET_DIRS = [
  path.resolve('docs/evidence'),
  path.resolve('docs/assets/video'),
];

for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const cards = [
  {
    name: 'armoriq_platform_onboarding.png',
    title: 'ArmorIQ Platform — Onboarded Agents & MCP Servers',
    subtitle: 'Production Identity Assertion & PEP Routing Configuration',
    badge: 'platform.armoriq.ai • VERIFIED ONBOARDED',
    badgeColor: '#10b981',
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="font-size:18px; font-weight:700; color:#38bdf8;">🤖 Governed Agent Identity</div>
            <span style="font-size:12px; padding:3px 10px; background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#34d399; border-radius:999px; font-weight:700;">ACTIVE</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px; font-size:14px;">
            <div><span style="color:#94a3b8;">Agent Identifier:</span> <code style="color:#f1f5f9; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">flowguard-agent</code></div>
            <div><span style="color:#94a3b8;">Agent UUID:</span> <code style="color:#f1f5f9; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">c8bcbe51-dea4-4459-9fd8-38f88ebc714e</code></div>
            <div><span style="color:#94a3b8;">Operator Identity:</span> <code style="color:#f1f5f9; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">flowguard-operator</code></div>
            <div><span style="color:#94a3b8;">Workspace ID:</span> <code style="color:#f1f5f9; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">dd9e9695-e58d-4e56-8cff-ef9617ba4c54</code></div>
            <div><span style="color:#94a3b8;">Attached Policy:</span> <code style="color:#34d399; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">flowguard-treasury-allowlist</code></div>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="font-size:18px; font-weight:700; color:#c084fc;">🔌 Registered MCP Server</div>
            <span style="font-size:12px; padding:3px 10px; background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#34d399; border-radius:999px; font-weight:700;">SSE TRANSPORT</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px; font-size:14px;">
            <div><span style="color:#94a3b8;">Server Name:</span> <code style="color:#f1f5f9; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">flowguard-treasury-mcp</code></div>
            <div><span style="color:#94a3b8;">Server UUID:</span> <code style="color:#f1f5f9; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">7540cd0a-7d76-414a-a849-96b337a0c6ed</code></div>
            <div><span style="color:#94a3b8;">Endpoint URL:</span> <code style="color:#38bdf8; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">https://flowguard-treasury.vercel.app/mcp</code></div>
            <div><span style="color:#94a3b8;">Protocol Spec:</span> <code style="color:#f1f5f9; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">2024-11-05 (JSON-RPC 2.0 / SSE)</code></div>
            <div><span style="color:#94a3b8;">Governed Tools:</span> <code style="color:#f1f5f9; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; font-family:monospace;">lookup_order, change_payout, issue_refund</code></div>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'armoriq_policies.png',
    title: 'ArmorIQ Policy Enforcement Point (PEP) Rules',
    subtitle: 'Cryptographic Allowlist & Platform Delegation Configuration',
    badge: 'platform.armoriq.ai • OPA COMPILED RULESET',
    badgeColor: '#818cf8',
    content: `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-top: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <span style="font-size:20px; font-weight:700; color:#f1f5f9;">Policy: flowguard-treasury-allowlist</span>
            <span style="margin-left:12px; font-size:12px; color:#94a3b8; font-family:monospace;">UUID: 23f8f304-0f6b-44a0-9bba-fa9886ca611b</span>
          </div>
          <span style="font-size:12px; padding:3px 10px; background:rgba(99,102,241,0.15); border:1px solid #818cf8; color:#a5b4fc; border-radius:999px; font-weight:700;">PRIORITY 100</span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-top:20px;">
          <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:18px;">
            <div style="font-size:13px; font-weight:700; color:#34d399; margin-bottom:8px;">✅ ALLOWED TOOL</div>
            <div style="font-size:16px; font-weight:700; font-family:monospace; color:#f8fafc;">lookup_order</div>
            <p style="font-size:12px; color:#cbd5e1; margin-top:6px; line-height:1.4;">Read-only order status & scheduled payout query. Minted token approved instantly via Merkle leaf.</p>
          </div>

          <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:18px;">
            <div style="font-size:13px; font-weight:700; color:#f87171; margin-bottom:8px;">🚫 BLOCKED TOOL</div>
            <div style="font-size:16px; font-weight:700; font-family:monospace; color:#f8fafc;">change_payout</div>
            <p style="font-size:12px; color:#cbd5e1; margin-top:6px; line-height:1.4;">Tool not in allowlist. ArmorIQ PEP proxy issues HTTP 403 PolicyBlockedException (tool_not_in_allowlist).</p>
          </div>

          <div style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.3); border-radius:8px; padding:18px;">
            <div style="font-size:13px; font-weight:700; color:#c084fc; margin-bottom:8px;">⏸️ HELD WITH DELEGATION</div>
            <div style="font-size:16px; font-weight:700; font-family:monospace; color:#f8fafc;">issue_refund</div>
            <p style="font-size:12px; color:#cbd5e1; margin-top:6px; line-height:1.4;">High financial risk. Requires platform delegation request and dual-supervisor quorum before disbursement.</p>
          </div>
        </div>
      </div>
    `
  },
  {
    name: 'elevenlabs_agent_tools.png',
    title: 'ElevenLabs Conversational AI — Webhook Tool Configuration',
    subtitle: 'Sub-5-Second Conversational Tool Execution & Holding Flow',
    badge: 'elevenlabs.io • FLASH/TURBO AGENT WORKSPACE',
    badgeColor: '#fbbf24',
    content: `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-top: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <span style="font-size:20px; font-weight:700; color:#f1f5f9;">Agent: elevenlabs-voice-support-agent-v2</span>
            <span style="margin-left:12px; font-size:12px; color:#94a3b8; font-family:monospace;">Model: Eleven Flash v2.5</span>
          </div>
          <span style="font-size:12px; padding:3px 10px; background:rgba(245,158,11,0.15); border:1px solid #f59e0b; color:#fbbf24; border-radius:999px; font-weight:700;">TIMEOUT: ~5.0s</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:14px 18px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
            <div>
              <div style="font-weight:700; font-family:monospace; color:#38bdf8; font-size:15px;">BeyondFlow_orderLookup</div>
              <div style="font-size:12px; color:#94a3b8; margin-top:2px;">Target: https://flowguard-treasury.vercel.app/api/voice/webhook • Method: POST</div>
            </div>
            <span style="font-size:12px; color:#34d399; font-weight:700;">ALLOWED PATH</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:14px 18px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
            <div>
              <div style="font-weight:700; font-family:monospace; color:#f87171; font-size:15px;">BeyondFlow_payoutChange</div>
              <div style="font-size:12px; color:#94a3b8; margin-top:2px;">Target: https://flowguard-treasury.vercel.app/api/voice/webhook • Method: POST</div>
            </div>
            <span style="font-size:12px; color:#f87171; font-weight:700;">BLOCKED PATH</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:14px 18px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
            <div>
              <div style="font-weight:700; font-family:monospace; color:#c084fc; font-size:15px;">BeyondFlow_issueRefund</div>
              <div style="font-size:12px; color:#94a3b8; margin-top:2px;">Target: https://flowguard-treasury.vercel.app/api/voice/webhook • Method: POST</div>
            </div>
            <span style="font-size:12px; color:#c084fc; font-weight:700;">HELD / SUB-5S HOLDING REPLY</span>
          </div>
        </div>
      </div>
    `
  }
];

async function generate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  for (const card of cards) {
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
            background: #09090b;
            background-image: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #09090b 80%);
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 48px 56px;
            overflow: hidden;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand-logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: linear-gradient(135deg, #6366f1, #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 20px;
            color: #fff;
          }
          .brand-text {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .badge {
            font-size: 13px;
            font-weight: 700;
            padding: 6px 16px;
            border-radius: 999px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.15);
          }
          .footer-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 20px;
            font-size: 13px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div>
          <div class="header-top">
            <div class="brand-logo">
              <div class="brand-icon">BF</div>
              <div class="brand-text">BeyondFlow <span style="color:#64748b; font-weight:400; font-size:16px;">/ Evidence Capture</span></div>
            </div>
            <div class="badge" style="color: ${card.badgeColor}; border-color: ${card.badgeColor}44;">
              ${card.badge}
            </div>
          </div>

          <div style="margin-top: 28px;">
            <h1 style="font-size: 32px; font-weight: 800; letter-spacing: -0.5px; color: #f8fafc;">${card.title}</h1>
            <p style="font-size: 16px; color: #94a3b8; margin-top: 6px;">${card.subtitle}</p>
          </div>

          ${card.content}
        </div>

        <div class="footer-bar">
          <div>Repository: vikassharma270907-alt/flowguard-treasury • Flow State Hackathon 2026</div>
          <div>Cryptographically Enforced by ArmorIQ (@armoriq/sdk v0.6.10)</div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html);

    for (const targetDir of TARGET_DIRS) {
      const outPath = path.join(targetDir, card.name);
      await page.screenshot({ path: outPath, type: 'png' });
      console.log(`Wrote screenshot card: ${outPath}`);
    }
  }

  await browser.close();
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
