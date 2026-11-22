// Lượt 64 — bàn phím PIN: gõ được mọi số, có nút xoá ⌫ và C, mã 6 số, sai 5 lần thì khoá.
// Bấm bằng CLICK THẬT vào toạ độ nút trên màn hình, không gọi hàm.
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
const moPin = () => { const g0 = window.__game; g0.ui.closePanel(); g0.ui.panel('settings');
  const u = document.querySelector('#dev-unlock'); for (let i = 0; i < 8; i++) u.click();
  return { bànPhím: !!document.querySelector('[data-pin]'), sốPhím: [...document.querySelectorAll('[data-pin]')].map((b) => b.dataset.pin) }; };
/** Toạ độ tâm của một phím số/xoá — để bấm chuột thật. */
const chỗPhím = (k) => { const b = document.querySelector(`[data-pin="${k}"]`); if (!b) return null; const r = b.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; };
const nhiềuPhím = (ds) => ds.map((k) => { const b = document.querySelector('[data-pin="' + k + '"]'); if (!b) return null; const r = b.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; }).filter(Boolean);
const trạngThái = () => ({ chấm: document.querySelectorAll('#modal .body div span').length, chữ: (document.querySelector('#modal .body')?.innerText || '').replace(/\n+/g, ' | ').slice(0, 200), đãMở: !!document.querySelector('[data-k^="tp_"]') });
export default [boot, fresh(9 * 60),
  { label: '① bấm 8 lần chữ Cài đặt → bàn phím hiện, có đủ 10 số + ⌫ + C' },
  { eval: (s) => eval('(' + s + ')()'), args: [moPin.toString()], max: 800 },
  { shot: OUT + 'pin64_banphim' },
  { label: '② bấm chuột THẬT lần lượt 4, 3, 8 (mã thật 438291) — phải hiện 3 chấm' },
  { clickEval: (s, ds) => eval('(' + s + ')')(ds), args: [nhiềuPhím.toString(), ['4','3','8']], gap: 300 },
  { eval: (s) => eval('(' + s + ')()'), args: [trạngThái.toString()], max: 600 },
  { shot: OUT + 'pin64_ba_so' },
  { label: '③ bấm ⌫ một lần rồi gõ lại 8 → vẫn vào được (nút xoá chạy)' },
  { clickEval: (s, ds) => eval('(' + s + ')')(ds), args: [nhiềuPhím.toString(), ['del','8']], gap: 300 },
  { label: '④ gõ nốt 291' },
  { clickEval: (s, ds) => eval('(' + s + ')')(ds), args: [nhiềuPhím.toString(), ['2','9','1']], gap: 300 },
  { eval: (s) => eval('(' + s + ')()'), args: [trạngThái.toString()], max: 600 },
  { shot: OUT + 'pin64_mo' },
  { label: '⑤ ẩn & khoá lại, gõ sai 5 lần → bàn phím khoá 30 giây' },
  { eval: () => { const b = document.querySelector('[data-a="devLock"]'); if (b) b.click(); return 'khoá'; }, wait: 600 },
  { eval: (s) => eval('(' + s + ')()'), args: [moPin.toString()], max: 400 },
  { clickEval: (s, ds) => eval('(' + s + ')')(ds), args: [nhiềuPhím.toString(), '1'.repeat(30).split('')], gap: 200 },
  { eval: () => ({ lỗi: (document.querySelector('#modal .body p[style]') || {}).innerText || '', toàn: (document.querySelector('#modal .body')?.innerText || '').split('\n').filter((t) => /Sai|giây/.test(t)) }), max: 600 },
  { shot: OUT + 'pin64_khoa' },
];
