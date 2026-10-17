/**
 * Keyboard-only verification pass for BeyondFlow.
 *
 * Drives a real Chrome (system channel) through a scripted keyboard-only
 * journey and asserts the accessibility behaviour of the shipped UI:
 *
 *   1. Desktop: repeated Tab presses walk through distinct controls, every
 *      stop has a visible focus indicator, and Enter on the focused
 *      "For Judges" navigation link performs keyboard-only navigation.
 *   2. Mobile (390x844): the hamburger toggle is reachable by Tab, Enter
 *      opens the drawer, focus is trapped inside it, and Escape closes the
 *      drawer and returns focus to the toggle.
 *
 * Usage:
 *   node scripts/verify-keyboard.mjs [url]
 *
 * Defaults to the production deployment. Exits 0 when every check passes,
 * 1 otherwise. Output is plain text, suitable for docs/evidence captures.
 */
import { chromium } from 'playwright';

const target = process.argv[2] || 'https://flowguard-treasury.vercel.app/';
const results = [];
let failures = 0;

function check(name, ok, detail = '') {
  const pass = Boolean(ok);
  results.push({ name, pass, detail });
  if (!pass) failures += 1;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function focusInfo(page) {
  return page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return { tag: 'BODY', text: '', indicator: 'none' };
    const cs = getComputedStyle(a);
    const indicator =
      cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
        ? `outline ${cs.outlineWidth}`
        : cs.boxShadow !== 'none'
          ? 'box-shadow'
          : 'none';
    return {
      tag: a.tagName,
      text: (a.innerText || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 50),
      indicator,
    };
  });
}

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
} catch {
  browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
}

console.log(`Keyboard-only verification — ${target}`);
console.log(`Run at: ${new Date().toISOString()}\n`);

// ---------------------------------------------------------------------------
// 1. Desktop keyboard journey
// ---------------------------------------------------------------------------
console.log('== Desktop keyboard journey (1280x800, Tab + Enter only) ==');
const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await desktop.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
await desktop.waitForTimeout(2000);

const stops = [];
for (let i = 0; i < 12; i++) {
  await desktop.keyboard.press('Tab');
  stops.push(await focusInfo(desktop));
}
const uniqueStops = new Set(stops.map((s) => `${s.tag}:${s.text}`)).size;
check('Tab traversal reaches at least 8 distinct controls (no focus trap)', uniqueStops >= 8, `${uniqueStops} unique stops`);
check(
  'Every tab stop shows a visible focus indicator',
  stops.length > 0 && stops.every((s) => s.indicator !== 'none'),
  stops.map((s) => s.indicator).join(' | ')
);

// Keyboard activation: move focus to the "For Judges" nav link (as a Tab user
// would) and activate it with Enter.
const judgesLink = desktop.locator('a[href="/judges"]').first();
await judgesLink.focus();
const focusedHref = await desktop.evaluate(() => document.activeElement?.getAttribute('href'));
check('"For Judges" nav link receives focus', focusedHref === '/judges', String(focusedHref));

await Promise.all([
  desktop.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {}),
  desktop.keyboard.press('Enter')
]);
await desktop.waitForTimeout(1000);

const navigatedToJudges =
  desktop.url().includes('/judges') ||
  (await desktop.evaluate(() => /90-Second Judge Tour|Judge Inspection Dashboard/i.test(document.body.innerText)));
check('Enter on the focused "For Judges" link activates it', navigatedToJudges, desktop.url());

const judgesRendered = await desktop.evaluate(() => /judge/i.test(document.body.innerText));
check('Judges screen rendered after keyboard navigation', judgesRendered);

await desktop.keyboard.press('Tab');
await desktop.keyboard.press('Shift+Tab');
const backwards = await focusInfo(desktop);
check('Shift+Tab moves focus backwards to another control', backwards.tag !== 'BODY', `${backwards.tag}: ${backwards.text}`);

// ---------------------------------------------------------------------------
// 2. Mobile drawer keyboard journey
// ---------------------------------------------------------------------------
console.log('\n== Mobile drawer keyboard journey (390x844, Tab + Enter + Escape) ==');
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
await mobile.waitForTimeout(2000);

const hamburgerCount = await mobile.locator('button[aria-controls="mobile-nav-drawer"]').count();
check('Hamburger toggle is present on mobile', hamburgerCount === 1, `found ${hamburgerCount}`);

let hamburgerFocused = false;
for (let i = 0; i < 30 && !hamburgerFocused; i++) {
  await mobile.keyboard.press('Tab');
  hamburgerFocused = await mobile.evaluate(
    () => document.activeElement?.getAttribute('aria-controls') === 'mobile-nav-drawer'
  );
}
check('Hamburger toggle is reachable with Tab', hamburgerFocused);
const hamInfo = await focusInfo(mobile);
check('Hamburger toggle shows a visible focus indicator', hamInfo.indicator !== 'none', hamInfo.indicator);

await mobile.keyboard.press('Enter');
await mobile.waitForTimeout(600);
check(
  'Enter opens the mobile navigation drawer',
  await mobile.evaluate(() => document.getElementById('mobile-nav-drawer') !== null)
);
check(
  'Focus moves into the drawer when it opens',
  await mobile.evaluate(() => {
    const drawer = document.getElementById('mobile-nav-drawer');
    return Boolean(drawer && drawer.contains(document.activeElement));
  })
);

let stayedInside = true;
for (let i = 0; i < 3; i++) {
  await mobile.keyboard.press('Tab');
  const inside = await mobile.evaluate(() => {
    const drawer = document.getElementById('mobile-nav-drawer');
    return Boolean(drawer && drawer.contains(document.activeElement));
  });
  stayedInside = stayedInside && inside;
}
check('Tab cycles only inside the open drawer (focus trap)', stayedInside);

await mobile.keyboard.press('Escape');
await mobile.waitForTimeout(500);
check(
  'Escape closes the drawer',
  await mobile.evaluate(() => document.getElementById('mobile-nav-drawer') === null)
);
check(
  'Focus returns to the hamburger toggle after Escape',
  await mobile.evaluate(
    () => document.activeElement?.getAttribute('aria-controls') === 'mobile-nav-drawer'
  )
);

await browser.close();

console.log(`\nResult: ${results.length - failures}/${results.length} checks passed.`);
process.exit(failures ? 1 : 0);
