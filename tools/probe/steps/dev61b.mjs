// Lượt 61 — hai mục gọi thẳng: bấm một lần là vào ngay bước cho nguyên liệu của nồi (trà đá / trà chanh).
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
const moMenu = () => { const g0 = window.__game; g0.ui.panel('settings'); const u = document.querySelector('#dev-unlock');
  for (let i = 0; i < 7; i++) u.click(); for (const d of '7777') document.querySelector(`[data-pin="${d}"]`)?.click();
  return [...document.querySelectorAll('[data-a="devRun"]')].map((b) => b.dataset.k).filter((k) => k.startsWith('t61')); };
const bấm = (id) => { const b = document.querySelector(`[data-a="devRun"][data-k="${id}"]`); if (!b) return 'không thấy ' + id; b.click(); return 'bấm ' + id; };
const trạngThái = () => { const g0 = window.__game, m = g0.cook.mini, g = g0.g;
  return { món: g0.cook.r?.id, lớp: m?.constructor?.name, phase: m?.phase, tiền: g.cash, quầy: g.stall.where, cấp: g.stall.tier,
    dụngCụ: Object.keys(g.gear), kho: g.stall.store.map((s) => s.id + ':' + s.n) }; };
const lại = () => { const g0 = window.__game; g0.cook.abort?.(); g0.ui.closeDialog(); g0.ui.closePanel(); g0.ui.panel('settings'); return !!document.querySelector('[data-a="devRun"]'); };
export default [boot, fresh(9 * 60),
  { label: '① mở menu ẩn — thấy 3 mục trà' },
  { eval: (s) => eval('(' + s + ')()'), args: [moMenu.toString()] },
  { shot: OUT + 'dev61_menu' },
  { label: '② bấm “Vào thẳng nồi TRÀ ĐÁ”' },
  { eval: (s) => eval('(' + s + ')')('t61_noi_da'), args: [bấm.toString()], wait: 2500 },
  { eval: (s) => eval('(' + s + ')()'), args: [trạngThái.toString()] },
  { shot: OUT + 'dev61_da' },
  { label: '③ quay ra, bấm “Vào thẳng nồi TRÀ CHANH”' },
  { eval: (s) => eval('(' + s + ')()'), args: [lại.toString()], wait: 800 },
  { eval: (s) => eval('(' + s + ')')('t61_noi_chanh'), args: [bấm.toString()], wait: 2500 },
  { eval: (s) => eval('(' + s + ')()'), args: [trạngThái.toString()] },
  { shot: OUT + 'dev61_chanh' },
];
