import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve('client/dist');
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.json': 'application/json'
};

function startServer(port = 0) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath.startsWith('/api/')) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        });
        res.end(JSON.stringify({ status: 'ok', plan: {}, invoices: [], activeScenario: 'SCENARIO_A' }));
        return;
      }
      let p = path.join(ROOT, reqPath === '/' ? 'index.html' : reqPath);
      if (!fs.existsSync(p)) p = path.join(ROOT, 'index.html');
      const ext = path.extname(p);
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      fs.createReadStream(p).pipe(res);
    });

    server.listen(port, () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function runLighthouseCli(url, preset = 'mobile') {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';

    const args = [
      'lighthouse',
      url,
      '--output=json',
      '--output-path=stdout',
      '--chrome-flags=--headless=new --no-sandbox',
      '--only-categories=performance',
      '--quiet'
    ];

    if (preset === 'desktop') {
      args.push('--preset=desktop');
    }

    const child = spawn(npxCmd, args, { shell: true, maxBuffer: 100 * 1024 * 1024 });
    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (d) => { stdoutData += d.toString(); });
    child.stderr.on('data', (d) => { stderrData += d.toString(); });

    child.on('close', (code) => {
      try {
        const first = stdoutData.indexOf('{');
        const last = stdoutData.lastIndexOf('}');
        if (first === -1 || last === -1) {
          return reject(new Error(`No JSON found in stdout (code ${code}): ${stderrData || stdoutData.slice(0, 500)}`));
        }
        const jsonStr = stdoutData.slice(first, last + 1);
        const report = JSON.parse(jsonStr);

        const perf = report.categories.performance;
        const audits = report.audits;
        const fcpVal = audits['first-contentful-paint']?.numericValue;
        const netReqs = audits['network-requests']?.details?.items?.map(r => ({
          url: r.url.split('/').pop(),
          time: Math.round(r.networkEndTime - r.networkRequestTime),
          size: Math.round(r.transferSize / 1024) + 'KB'
        }));
        console.log(`[Diagnostic] FCP: ${Math.round(fcpVal)}ms | LCP: ${Math.round(audits['largest-contentful-paint']?.numericValue)}ms`);
        console.log('[Diagnostic] Network items:', JSON.stringify(netReqs));
        const lcpSnippet = audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet || audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.nodeLabel || audits['largest-contentful-paint']?.displayValue || 'unknown';
        console.log(`[Diagnostic] LCP Node: ${lcpSnippet}`);
        const opps = Object.entries(audits)
          .filter(([_, a]) => a.details && a.details.type === 'opportunity' && a.numericValue > 50)
          .map(([k, a]) => `${k} (${Math.round(a.numericValue)}ms)`);

        resolve({
          score: Math.round(perf.score * 100),
          lcp: audits['largest-contentful-paint']?.numericValue || 0,
          lcpDisplay: audits['largest-contentful-paint']?.displayValue || 'N/A',
          lcpElement: lcpSnippet,
          tbt: audits['total-blocking-time']?.numericValue || 0,
          tbtDisplay: audits['total-blocking-time']?.displayValue || 'N/A',
          cls: audits['cumulative-layout-shift']?.numericValue || 0,
          clsDisplay: audits['cumulative-layout-shift']?.displayValue || '0',
          fcp: audits['first-contentful-paint']?.numericValue || 0,
          fcpDisplay: audits['first-contentful-paint']?.displayValue || 'N/A',
          speedIndex: audits['speed-index']?.numericValue || 0,
          speedIndexDisplay: audits['speed-index']?.displayValue || 'N/A',
          opps
        });
      } catch (e) {
        reject(new Error(`Failed to parse LH json: ${e.message}`));
      }
    });

    child.on('error', reject);
  });
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function measure(runs = 3) {
  const { server, port: assignedPort } = await startServer(0);
  const url = `http://127.0.0.1:${assignedPort}/`;
  console.log(`[Lighthouse] Server running at ${url}. Measuring ${runs} runs for Mobile and Desktop...`);

  const mobileResults = [];
  const desktopResults = [];

  for (let i = 0; i < runs; i++) {
    console.log(`[Lighthouse] Running Mobile Run ${i + 1}/${runs}...`);
    const res = await runLighthouseCli(url, 'mobile');
    console.log(`  -> Mobile ${i + 1}: Score=${res.score}, LCP=${res.lcpDisplay}, TBT=${res.tbtDisplay}, CLS=${res.clsDisplay}`);
    console.log(`     LCP Element: ${res.lcpElement.slice(0, 100)}`);
    if (res.opps.length) console.log(`     Opportunities: ${res.opps.join(', ')}`);
    mobileResults.push(res);
  }

  for (let i = 0; i < runs; i++) {
    console.log(`[Lighthouse] Running Desktop Run ${i + 1}/${runs}...`);
    const res = await runLighthouseCli(url, 'desktop');
    console.log(`  -> Desktop ${i + 1}: Score=${res.score}, LCP=${res.lcpDisplay}, TBT=${res.tbtDisplay}, CLS=${res.clsDisplay}`);
    console.log(`     LCP Element: ${res.lcpElement.slice(0, 100)}`);
    desktopResults.push(res);
  }

  server.close();

  const mobileMedian = {
    score: Math.round(median(mobileResults.map(r => r.score))),
    lcp: Math.round(median(mobileResults.map(r => r.lcp))),
    tbt: Math.round(median(mobileResults.map(r => r.tbt))),
    cls: parseFloat(median(mobileResults.map(r => r.cls)).toFixed(3)),
    runs: mobileResults
  };

  const desktopMedian = {
    score: Math.round(median(desktopResults.map(r => r.score))),
    lcp: Math.round(median(desktopResults.map(r => r.lcp))),
    tbt: Math.round(median(desktopResults.map(r => r.tbt))),
    cls: parseFloat(median(desktopResults.map(r => r.cls)).toFixed(3)),
    runs: desktopResults
  };

  console.log('\n======================================================');
  console.log(`MOBILE MEDIAN:  Score: ${mobileMedian.score} | LCP: ${mobileMedian.lcp}ms | TBT: ${mobileMedian.tbt}ms | CLS: ${mobileMedian.cls}`);
  console.log(`DESKTOP MEDIAN: Score: ${desktopMedian.score} | LCP: ${desktopMedian.lcp}ms | TBT: ${desktopMedian.tbt}ms | CLS: ${desktopMedian.cls}`);
  console.log('======================================================\n');

  return { mobile: mobileMedian, desktop: desktopMedian };
}

// If run directly
if (process.argv[1]?.endsWith('measure-lighthouse.mjs')) {
  const runs = parseInt(process.argv[2] || '3', 10);
  measure(runs).catch(console.error);
}
