import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const WIDTHS = [320, 390, 768, 1024, 1440];
const THEMES = ['dark', 'light'];

async function testHowItWorks() {
  console.log(`Auditing /how-it-works at widths ${WIDTHS.join(', ')}px in light and dark mode...`);
  const browser = await chromium.launch();
  let allPassed = true;

  for (const theme of THEMES) {
    for (const w of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width: w, height: 800 },
        colorScheme: theme
      });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const res = await page.goto(`${BASE_URL}/how-it-works`, { waitUntil: 'domcontentloaded' });
      const status = res ? res.status() : null;

      // Force theme on page
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }, theme);

      await page.waitForTimeout(300);

      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        return {
          clientWidth: docEl.clientWidth,
          scrollWidth: docEl.scrollWidth,
          hasOverflow: docEl.scrollWidth > docEl.clientWidth
        };
      });

      const pass = status === 200 && !overflow.hasOverflow && consoleErrors.length === 0;
      if (!pass) allPassed = false;

      const verdict = pass ? 'PASS' : 'FAIL';
      console.log(`[${verdict}] Theme: ${theme.padEnd(5)} | Width: ${String(w).padStart(4)}px | HTTP: ${status} | ScrollWidth: ${overflow.scrollWidth} / ClientWidth: ${overflow.clientWidth} | Overflow: ${overflow.hasOverflow} | ConsoleErrors: ${consoleErrors.length}`);
      if (consoleErrors.length > 0) {
        console.log(`       Errors: ${consoleErrors.join('; ')}`);
      }
      await context.close();
    }
  }

  await browser.close();
  if (allPassed) {
    console.log('\nAll /how-it-works viewport and theme checks PASSED with 0 overflow and 0 console errors!');
  } else {
    console.error('\nSome checks FAILED!');
    process.exit(1);
  }
}

testHowItWorks().catch(err => {
  console.error(err);
  process.exit(1);
});
