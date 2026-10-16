import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

test('1. FlowGuard guide PDF file exists and is valid', () => {
  const clientPdfPath = path.resolve('client/public/docs/flowguard-guide.pdf');
  const rootPdfPath = path.resolve('public/docs/flowguard-guide.pdf');

  assert.ok(fs.existsSync(clientPdfPath), 'client/public/docs/flowguard-guide.pdf must exist');
  assert.ok(fs.existsSync(rootPdfPath), 'public/docs/flowguard-guide.pdf must exist');

  const stats = fs.statSync(clientPdfPath);
  assert.ok(stats.size > 0, 'PDF size must be greater than 0');
  assert.ok(stats.size < 2 * 1024 * 1024, 'PDF size must be under 2 MB');

  const buf = fs.readFileSync(clientPdfPath);
  assert.ok(buf.slice(0, 5).toString('ascii').startsWith('%PDF'), 'PDF must start with %PDF header');

  const text = buf.toString('latin1');
  assert.ok(text.includes('%%EOF'), 'PDF must contain %%EOF marker');

  const countMatch = text.match(/\/Count\s+(\d+)/);
  assert.ok(countMatch, 'PDF must contain /Count page count');
  assert.equal(Number(countMatch[1]), 7, 'PDF must have exactly 7 pages');
});

test('2. siteConfig has guidePdf single source of truth', async () => {
  const { siteConfig } = await import('../client/src/siteConfig.js');

  assert.ok(siteConfig.guidePdf, 'siteConfig.guidePdf must exist');
  assert.equal(siteConfig.guidePdf.enabled, true, 'guidePdf.enabled must be true');
  assert.equal(siteConfig.guidePdf.path, '/docs/flowguard-guide.pdf', 'guidePdf.path must be /docs/flowguard-guide.pdf');
  assert.equal(siteConfig.guidePdf.pages, 7, 'guidePdf.pages must be 7');
  assert.equal(siteConfig.guidePdf.sizeLabel, '23 KB', 'guidePdf.sizeLabel must be 23 KB');

  // Developers column in footer
  const devCol = siteConfig.footerColumns.find(c => c.titleKey === 'columns.developers');
  assert.ok(devCol, 'columns.developers column must exist in footerColumns');
  const guideLink = devCol.links.find(l => l.isGuidePdf);
  assert.ok(guideLink, 'guide link with isGuidePdf must exist in developers column');
  assert.equal(guideLink.labelKey, 'links.guidePdf');
  assert.equal(guideLink.isExternal, true);
  assert.equal(guideLink.enabled, true);
});

test('3. i18n dictionaries contain English and Hindi guide keys', () => {
  const en = JSON.parse(fs.readFileSync('client/src/locales/en.json', 'utf-8'));
  const hi = JSON.parse(fs.readFileSync('client/src/locales/hi.json', 'utf-8'));

  assert.equal(en.links.guidePdf, 'Guide (PDF)');
  assert.equal(en.links.downloadGuide, 'Download the guide (PDF)');
  assert.ok(en.links.guidePdfAria.includes('FlowGuard guide, PDF'));

  assert.equal(hi.links.guidePdf, 'गाइड (PDF)');
  assert.equal(hi.links.downloadGuide, 'गाइड डाउनलोड करें (PDF)');
  assert.ok(hi.links.guidePdfAria.includes('केवल अंग्रेज़ी में उपलब्ध') || hi.links.guidePdfAria.includes('केवल अंग्रेज़ी में'));
  assert.ok(hi._note, 'hi.json must include human review note');
});

test('4. Backend Express server delivers PDF with required headers', async () => {
  const app = (await import('../server/server.js')).default;

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/docs/flowguard-guide.pdf`);
    assert.equal(res.status, 200, 'HTTP status must be 200');
    assert.equal(res.headers.get('content-type'), 'application/pdf');
    assert.equal(res.headers.get('content-disposition'), 'inline');
    assert.equal(res.headers.get('cache-control'), 'public, max-age=3600, must-revalidate');
    assert.equal(res.headers.get('x-robots-tag'), 'noindex');

    const arrayBuffer = await res.arrayBuffer();
    assert.equal(arrayBuffer.byteLength, 23358, 'Downloaded PDF size must match exactly');
  } finally {
    server.close();
  }
});
