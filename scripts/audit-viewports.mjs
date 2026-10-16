import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const OUT_DIR = path.resolve('audit-screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  // Phones
  { name: 'phone-320x568', width: 320, height: 568, device: 'iPhone SE 1' },
  { name: 'phone-360x740', width: 360, height: 740, device: 'Galaxy S8+' },
  { name: 'phone-390x844', width: 390, height: 844, device: 'iPhone 12/13/14' },
  { name: 'phone-414x896', width: 414, height: 896, device: 'iPhone 11/XR' },
  { name: 'phone-844x390-land', width: 844, height: 390, device: 'iPhone Landscape' },
  // Tablets
  { name: 'tablet-768x1024', width: 768, height: 1024, device: 'iPad Mini' },
  { name: 'tablet-820x1180', width: 820, height: 1180, device: 'iPad Air' },
  { name: 'tablet-1024x768-land', width: 1024, height: 768, device: 'iPad Landscape' },
  // Laptops / Desktops
  { name: 'laptop-1280x720', width: 1280, height: 720, device: 'HD Laptop' },
  { name: 'laptop-1440x900', width: 1440, height: 900, device: 'MacBook Pro' },
  { name: 'desktop-1920x1080', width: 1920, height: 1080, device: 'FHD Desktop' }
];

const THEMES = ['dark', 'light'];

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'judges', path: '/judges' },
  { name: 'boundary-test', path: '/#boundary-test' },
  { name: 'architecture', path: '/#architecture' },
  { name: 'playground', path: '/voice' },
  { name: '404', path: '/non-existent-page-404' }
];

async function runAudit() {
  console.log(`Starting Phase 1 responsive & theme audit against ${BASE_URL}...`);
  const browser = await chromium.launch();
  const report = {
    timestamp: new Date().toISOString(),
    overflows: [],
    smallTapTargets: [],
    smallInputs: [],
    contrastIssues: [],
    screenshots: []
  };

  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme
      });
      const page = await context.newPage();

      for (const route of ROUTES) {
        const url = `${BASE_URL}${route.path}`;
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 8000 });
        } catch {
          await page.goto(url, { waitUntil: 'load', timeout: 8000 }).catch(() => {});
        }

        // Force theme class on html
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

        await page.waitForTimeout(400);

        // Check horizontal overflow
        const overflowData = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const clientWidth = docEl.clientWidth;
          const scrollWidth = docEl.scrollWidth;
          const hasOverflow = scrollWidth > clientWidth;

          const overflowingElements = [];
          if (hasOverflow) {
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > clientWidth + 2) {
                let sel = el.tagName.toLowerCase();
                if (el.id) sel += '#' + el.id;
                else if (el.className && typeof el.className === 'string') {
                  sel += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.');
                }
                overflowingElements.push({
                  selector: sel,
                  tag: el.tagName,
                  rectRight: Math.round(rect.right),
                  clientWidth,
                  scrollWidth: el.scrollWidth,
                  computedWidth: window.getComputedStyle(el).width,
                  textSnippet: (el.innerText || '').slice(0, 60).replace(/\n/g, ' ')
                });
              }
            }
          }

          // Check tap targets < 44x44
          const smallTargets = [];
          const interactives = document.querySelectorAll('button, a, input, select, textarea');
          for (const btn of interactives) {
            const r = btn.getBoundingClientRect();
            // only check visible ones
            if (r.width > 0 && r.height > 0 && window.getComputedStyle(btn).visibility !== 'hidden' && window.getComputedStyle(btn).display !== 'none') {
              if (r.width < 44 || r.height < 44) {
                let sel = btn.tagName.toLowerCase();
                if (btn.id) sel += '#' + btn.id;
                else if (btn.className && typeof btn.className === 'string') {
                  sel += '.' + btn.className.trim().split(/\s+/).slice(0, 2).join('.');
                }
                smallTargets.push({
                  selector: sel,
                  width: Math.round(r.width),
                  height: Math.round(r.height),
                  text: (btn.innerText || btn.getAttribute('aria-label') || '').slice(0, 30)
                });
              }
            }
          }

          // Check inputs font size < 16px
          const smallInputsList = [];
          const inputs = document.querySelectorAll('input, select, textarea');
          for (const inp of inputs) {
            const fs = parseFloat(window.getComputedStyle(inp).fontSize);
            if (fs < 16 && inp.type !== 'hidden') {
              smallInputsList.push({
                type: inp.type,
                name: inp.name || inp.id || 'unnamed',
                fontSize: `${fs}px`
              });
            }
          }

          return {
            hasOverflow,
            scrollWidth,
            clientWidth,
            overflowingElements: overflowingElements.slice(0, 8),
            smallTargets: smallTargets.slice(0, 8),
            smallInputs: smallInputsList.slice(0, 6)
          };
        });

        if (overflowData.hasOverflow) {
          report.overflows.push({
            theme,
            viewport: vp.name,
            device: vp.device,
            route: route.name,
            scrollWidth: overflowData.scrollWidth,
            clientWidth: overflowData.clientWidth,
            elements: overflowData.overflowingElements
          });
        }

        if (overflowData.smallTargets.length > 0) {
          report.smallTapTargets.push({
            viewport: vp.name,
            route: route.name,
            targets: overflowData.smallTargets
          });
        }

        if (overflowData.smallInputs.length > 0) {
          report.smallInputs.push({
            route: route.name,
            inputs: overflowData.smallInputs
          });
        }

        // Take screenshot
        const ssName = `${route.name}_${vp.name}_${theme}.png`;
        const ssPath = path.join(OUT_DIR, ssName);
        await page.screenshot({ path: ssPath, fullPage: false });
        report.screenshots.push(ssName);
      }

      // Check mobile drawer if small screen
      if (vp.width <= 768) {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'load' }).catch(() => {});
        const menuBtn = await page.$('button[aria-label*="menu" i], button.mobile-menu-btn, button[aria-expanded]');
        if (menuBtn) {
          await menuBtn.click().catch(() => {});
          await page.waitForTimeout(300);
          const drawerSS = `mobile_drawer_${vp.name}_${theme}.png`;
          await page.screenshot({ path: path.join(OUT_DIR, drawerSS) });
          report.screenshots.push(drawerSS);
        }
      }

      await context.close();
    }
  }

  await browser.close();

  const reportPath = path.resolve('audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Audit complete! Saved ${report.screenshots.length} screenshots to ${OUT_DIR}`);
  console.log(`Found ${report.overflows.length} overflow instances.`);
  console.log(`Report saved to ${reportPath}`);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
