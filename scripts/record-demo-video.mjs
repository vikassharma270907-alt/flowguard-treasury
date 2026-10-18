/**
 * Automated Video Recording Script for BeyondFlow
 *
 * Drives Chrome via Playwright with video recording enabled to create an
 * end-to-end video demonstrating:
 * 1. How BeyondFlow works
 * 2. How ArmorIQ and ElevenLabs play a crucial role
 * 3. How it differs fundamentally from typical industry standards
 *
 * Output: flowguard_demo_walkthrough.webm in the brain artifact directory
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.resolve('./docs/assets/video');
const VIDEO_OUTPUT_DIR = path.join(ARTIFACT_DIR, 'videos');
if (!fs.existsSync(VIDEO_OUTPUT_DIR)) {
  fs.mkdirSync(VIDEO_OUTPUT_DIR, { recursive: true });
}

const targetUrl = process.argv[2] || 'https://flowguard-treasury.vercel.app';
console.log(`Starting automated video recording of BeyondFlow on ${targetUrl}...`);

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
} catch {
  browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
}

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: VIDEO_OUTPUT_DIR,
    size: { width: 1280, height: 720 },
  },
});

const page = await context.newPage();

async function smoothScrollTo(selectorOrY, delayMs = 2500) {
  if (typeof selectorOrY === 'string') {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, selectorOrY);
  } else {
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }, selectorOrY);
  }
  await page.waitForTimeout(delayMs);
}

try {
  // -------------------------------------------------------------------------
  // Scene 1: Landing Page & Hero (Interactive 3D Treasury Vault)
  // -------------------------------------------------------------------------
  console.log('Scene 1: Loading Landing Page & Hero...');
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Mouse trajectory across the hero to activate 3D gyroscopic tilt
  for (let x = 400; x <= 800; x += 80) {
    await page.mouse.move(x, 360);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);

  // -------------------------------------------------------------------------
  // Scene 2: Architecture & "How We Use ArmorIQ"
  // -------------------------------------------------------------------------
  console.log('Scene 2: Architecture & How We Use ArmorIQ...');
  await smoothScrollTo('#how-we-use-armoriq', 3500);

  // Hover over architecture diagram elements
  await page.mouse.move(640, 420);
  await page.waitForTimeout(1200);

  // -------------------------------------------------------------------------
  // Scene 3: Cryptographic Boundary Test (Live ArmorIQ PEP Enforcement)
  // -------------------------------------------------------------------------
  console.log('Scene 3: Cryptographic Boundary Test...');
  await smoothScrollTo('#boundary-test', 3500);

  // Showcase the three live verdict cards: ALLOWED, BLOCKED, HELD
  await page.mouse.move(350, 480); // Card 1 (lookup_order)
  await page.waitForTimeout(1000);
  await page.mouse.move(640, 480); // Card 2 (change_payout)
  await page.waitForTimeout(1000);
  await page.mouse.move(930, 480); // Card 3 (issue_refund)
  await page.waitForTimeout(1500);

  // Scroll slightly to reveal Intent Mismatch box
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await page.waitForTimeout(2500);

  // -------------------------------------------------------------------------
  // Scene 4: Voice Gateway & ElevenLabs Sub-5s SLA
  // -------------------------------------------------------------------------
  console.log('Scene 4: Voice Gateway & ElevenLabs Holding Pattern...');
  await page.goto(`${targetUrl}/voice-gateway`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Scroll to show Supervisor Playground & Dual Quorum
  await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2500);

  // -------------------------------------------------------------------------
  // Scene 5: Scenarios & Treasury Duplicate Shield
  // -------------------------------------------------------------------------
  console.log('Scene 5: Scenarios Matrix...');
  await page.goto(`${targetUrl}/scenarios`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Scroll to inspect Scenario B (Duplicate Attack) and Scenario C (Reserve Floor)
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2500);

  // -------------------------------------------------------------------------
  // Scene 6: Official Judge Inspection Dashboard (/judges)
  // -------------------------------------------------------------------------
  console.log('Scene 6: Official Judge Dashboard...');
  await page.goto(`${targetUrl}/judges`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Scroll through the 90-second tour
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(2000);

  // Scroll to Hackathon Rules Compliance Table (7 PASS items)
  await page.evaluate(() => window.scrollBy({ top: 550, behavior: 'smooth' }));
  await page.waitForTimeout(3000);

  // Scroll to Claims Verification and Disclosures
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'smooth' }));
  await page.waitForTimeout(3000);

  console.log('Completed all scenes. Finalizing video...');
} catch (err) {
  console.error('Error during recording:', err);
} finally {
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const rawVideoPath = await video.path();
    const finalVideoPath = path.join(ARTIFACT_DIR, 'flowguard_demo_video.webm');
    fs.copyFileSync(rawVideoPath, finalVideoPath);
    console.log(`Video recorded successfully!`);
    console.log(`Raw Video: ${rawVideoPath}`);
    console.log(`Final Destination: ${finalVideoPath}`);
  }
}
