// Trình chạy kịch bản thử giao diện trong Chrome không giao diện (WebGL phần mềm, giả lập cảm ứng).
// Dùng: node play.mjs steps/<tên>.mjs     Biến môi trường: URL, W, H, DPR, DESKTOP=1, OUT, LOG=1, MAXOUT
// Mỗi bước: { eval, args, waitFor, timeout, tap, tapsEval, gap, drag, dragEval, hold, holdUntil, key, wait, shot, clip, label }
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
// @sparticuz/chromium chỉ chịu chạy khi tưởng mình đang ở AWS Lambda — đặt biến này TRƯỚC khi nạp nó.
process.env.AWS_EXECUTION_ENV ??= 'AWS_Lambda_nodejs22.x';
const chromium = (await import('@sparticuz/chromium')).default;
const puppeteer = (await import('puppeteer-core')).default;
chromium.setGraphicsMode = true;
const OUT = process.env.OUT || path.join(path.dirname(fileURLToPath(import.meta.url)), 'out');
fs.mkdirSync(OUT, { recursive: true });
const W = +(process.env.W || 844), H = +(process.env.H || 390), DPR = +(process.env.DPR || 1), URL_ = process.env.URL || 'http://127.0.0.1:4173/?debug';
const file = process.argv[2];
let steps = file.endsWith('.json') ? JSON.parse(fs.readFileSync(file, 'utf8')) : (await import(pathToFileURL(path.resolve(file)).href)).default;
if (typeof steps === 'function') steps = await steps();
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell',
  args: [...chromium.args, '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: DPR, isMobile: process.env.DESKTOP ? false : true, hasTouch: process.env.DESKTOP ? false : true } });
const page = await browser.newPage();
const errs = [];
page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning' || t === 'warn') { const s = m.text(); if (!/GPU stall|WebGL-|GL Driver Message|swiftshader/i.test(s)) errs.push(t + ': ' + s.slice(0, 300)); } else if (process.env.LOG) console.log('  [page]', m.text().slice(0, 400)); });
page.on('pageerror', (e) => errs.push('pageerror: ' + String(e && e.stack || e).slice(0, 500)));
await page.goto(URL_, { waitUntil: 'load' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (f, ...a) => (typeof f === 'function' ? page.evaluate(f, ...a) : page.evaluate(f));
const short = (f) => String(f).replace(/\s+/g, ' ').slice(0, 56);
const MAXOUT = +(process.env.MAXOUT || 1500);
for (const s of steps) {
  try {
    if (s.label) console.log('── ' + s.label);
    if (s.eval) { const r = await ev(s.eval, ...(s.args || [])); if (!s.quiet) console.log('»', short(s.eval), '=>', (JSON.stringify(r) ?? 'undefined').slice(0, s.max || MAXOUT)); }
    if (s.waitFor) { const t0 = Date.now(), to = s.timeout || 60000; let ok = false; while (Date.now() - t0 < to) { if (await ev(s.waitFor, ...(s.args || []))) { ok = true; break; } await sleep(200); } console.log(`  waitFor ${ok ? 'ok' : 'TIMEOUT'} ${((Date.now() - t0) / 1000).toFixed(1)}s ${short(s.waitFor)}`); }
    if (s.tap) await page.touchscreen.tap(s.tap[0], s.tap[1]);
    if (s.tapsEval) { const pts = await ev(s.tapsEval, ...(s.args || [])); console.log('  taps', JSON.stringify(pts).slice(0, 200)); for (const p of pts || []) { await page.touchscreen.tap(p[0], p[1]); await sleep(s.gap || 250); } }
    if (s.drag || s.dragEval) {
      const pts = s.drag || await ev(s.dragEval, ...(s.args || []));
      if (pts && pts.length) {
        await page.touchscreen.touchStart(pts[0][0], pts[0][1]); await sleep(s.gap || 60);
        for (const p of pts.slice(1)) { await page.touchscreen.touchMove(p[0], p[1]); await sleep(s.gap || 60); }
        if (s.hold) await sleep(s.hold);
        if (s.holdUntil) { const t0 = Date.now(); while (Date.now() - t0 < (s.timeout || 30000)) { if (await ev(s.holdUntil)) break; await sleep(100); } console.log(`  held ${((Date.now() - t0) / 1000).toFixed(1)}s`); }
        await page.touchscreen.touchEnd();
      }
    }
    if (s.key) { await page.keyboard.down(s.key); await sleep(s.hold || 80); await page.keyboard.up(s.key); }
    if (s.wait) await sleep(s.wait);
    if (s.shot) await page.screenshot({ path: path.join(OUT, `${s.shot}.png`), ...(s.clip ? { clip: s.clip } : {}) });
  } catch (e) { console.log('STEP ERROR', short(s.eval || s.waitFor || s.tapsEval || s.dragEval || ''), String(e && e.message || e).slice(0, 400)); }
}
console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'errors: none');
await browser.close();
