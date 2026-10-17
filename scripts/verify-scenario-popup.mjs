import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// Serve client/dist static build
const distDir = path.resolve('client/dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
});

const PORT = 41738;
server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const viewports = [
    { width: 1440, height: 900, name: 'Desktop (1440px)' },
    { width: 1024, height: 768, name: 'Tablet / Small Desktop (1024px)' },
    { width: 375, height: 812, name: 'Mobile (375px)' }
  ];

  let allPassed = true;

  for (const vp of viewports) {
    console.log(`\n=== Testing Viewport: ${vp.name} ===`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`http://localhost:${PORT}`);
    await page.waitForLoadState('networkidle');

    // 1. Locate the Scenario selector button
    const scenarioBtn = page.locator('button:has-text("Scenario A")').first();
    await scenarioBtn.waitFor({ state: 'visible' });

    // 2. Click to open dropdown
    await scenarioBtn.click();
    await page.waitForTimeout(300);

    // 3. Locate the Hackathon Demo Scenarios popup
    const popup = page.locator('text=Hackathon Demo Scenarios').locator('xpath=ancestor::div[contains(@class, "rounded-xl") or contains(@style, "border-radius")]').first();
    const isVisible = await popup.isVisible();
    if (!isVisible) {
      console.error(`FAIL: Popup not visible on ${vp.name}`);
      allPassed = false;
      continue;
    }

    const box = await popup.boundingBox();
    console.log(`Popup bounds on ${vp.name}: x=${box.x.toFixed(1)}, y=${box.y.toFixed(1)}, w=${box.width.toFixed(1)}, h=${box.height.toFixed(1)}`);

    // Check boundary clipping: must be inside viewport
    if (box.x < 0) {
      console.error(`FAIL: Popup clipped on left (x=${box.x}) on ${vp.name}`);
      allPassed = false;
    } else {
      console.log(`PASS: Popup left edge is within viewport (x >= 0)`);
    }

    if (box.x + box.width > vp.width + 1) { // allow 1px rounding
      console.error(`FAIL: Popup clipped on right (x+w=${box.x + box.width} > ${vp.width}) on ${vp.name}`);
      allPassed = false;
    } else {
      console.log(`PASS: Popup right edge is within viewport (x + w <= ${vp.width})`);
    }

    // Check "Active" badge wrapping
    const activeBadge = page.locator('.badge-live:has-text("Active")').first();
    const badgeText = await activeBadge.innerText();
    const badgeBox = await activeBadge.boundingBox();
    console.log(`Active badge text: "${badgeText.trim()}", width: ${badgeBox.width.toFixed(1)}px, height: ${badgeBox.height.toFixed(1)}px`);
    if (badgeBox.height > 25) {
      console.error(`FAIL: Badge wrapped vertically on ${vp.name}`);
      allPassed = false;
    } else {
      console.log(`PASS: Badge is single-line, not wrapped`);
    }

    // Check title & description contrast in initial theme
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
    const firstTitleColor = await popup.locator('.text-slate-900, .dark\\:text-slate-100').first().evaluate(el => window.getComputedStyle(el).color);
    const firstDescColor = await popup.locator('.text-slate-600, .dark\\:text-slate-400').first().evaluate(el => window.getComputedStyle(el).color);
    console.log(`Theme: ${initialTheme.toUpperCase()} -> Title: ${firstTitleColor}, Desc: ${firstDescColor}`);

    // Test Escape key closes popup
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const closedOnEscape = !(await popup.isVisible());
    console.log(`Escape key closes popup: ${closedOnEscape ? 'PASS' : 'FAIL'}`);
    if (!closedOnEscape) allPassed = false;

    // Switch theme
    const themeBtn = page.locator('button[aria-label*="mode"]').first();
    await themeBtn.click();
    await page.waitForTimeout(200);

    // Re-open popup in toggled theme
    await scenarioBtn.click();
    await page.waitForTimeout(200);

    // Check title & description contrast in toggled theme
    const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark');
    const secondTitleColor = await popup.locator('.text-slate-900, .dark\\:text-slate-100').first().evaluate(el => window.getComputedStyle(el).color);
    const secondDescColor = await popup.locator('.text-slate-600, .dark\\:text-slate-400').first().evaluate(el => window.getComputedStyle(el).color);
    console.log(`Theme: ${toggledTheme.toUpperCase()} -> Title: ${secondTitleColor}, Desc: ${secondDescColor}`);

    // Test selecting a scenario closes the popup
    const scenarioCard = popup.locator('text=Scenario B').first();
    await scenarioCard.click();
    await page.waitForTimeout(200);
    const closedOnSelect = !(await popup.isVisible());
    console.log(`Scenario card click closes popup: ${closedOnSelect ? 'PASS' : 'FAIL'}`);
    if (!closedOnSelect) allPassed = false;

    await page.close();
  }

  await browser.close();
  server.close();

  if (allPassed) {
    console.log('\n=======================================');
    console.log('ALL POPUP VERIFICATION CHECKS PASSED!');
    console.log('=======================================');
    process.exit(0);
  } else {
    console.error('\nSOME CHECKS FAILED!');
    process.exit(1);
  }
});
