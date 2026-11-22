// Lượt 61 — tái hiện ĐÚNG thao tác người chơi: mở menu ẩn (7 lần › 7777) → bấm “Chạy” mục nồi → chạm chén “Trà khô”.
// Mục đích: xem nút Chạy có để lại thứ gì chặn cảm ứng / camera chưa đứng yên hay không.
// Chạy: cd tools/probe && W=1568 H=780 DESKTOP=1 node play.mjs steps/dev60.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
const MON = process.env.MON || 'Trà chanh';
const moMenu = () => {
  const g0 = window.__game; g0.ui.panel('settings');
  const u = document.querySelector('#dev-unlock'); if (!u) return { lỗi: 'không thấy #dev-unlock' };
  for (let i = 0; i < 7; i++) u.click();
  for (const d of '7777') document.querySelector(`[data-pin="${d}"]`)?.click();
  return { mở: !!document.querySelector('[data-a="devRun"][data-k="t61_tra"]') };
};
const chạy = (id) => { const b = document.querySelector(`[data-a="devRun"][data-k="${id}"]`); if (!b) return { lỗi: id }; b.click(); return { bấm: id }; };
const ch = (x, y, z) => { const g0 = window.__game, v = g0.cook.world(x, y, z).project(g0.camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; };
const trạngThái = () => {
  const ch = (x, y, z) => { const g0 = window.__game, v = g0.cook.world(x, y, z).project(g0.camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; };
  const g0 = window.__game, m = g0.cook.mini;
  const b = m && m.bowls && m.bowls[0];
  return {
    lớp: m?.constructor?.name, phase: m?.phase, fly: m?.bowls?.map((x) => +x.fly.toFixed(2)),
    đĩa: b ? [b.x, b.z] : null, màn: b ? ch(b.x, 0.06, b.z) : null,
    modalMở: !document.querySelector('#modal').classList.contains('hide'),
    dlgMở: !document.querySelector('#dlg').classList.contains('hide'),
  };
};
const điểmChạm = () => { const ch = (x, y, z) => { const g0 = window.__game, v = g0.cook.world(x, y, z).project(g0.camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; }; const b = window.__game.cook.mini.bowls[0]; return [ch(b.x, 0.06, b.z)]; };
/** Thử cả 3 độ cao như ngón tay thật có thể chạm (viên trà · đĩa · đỉnh viên). */
const baCao = () => { const ch = (x, y, z) => { const g0 = window.__game, v = g0.cook.world(x, y, z).project(g0.camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; }; const b = window.__game.cook.mini.bowls[0]; return [ch(b.x, 0.06, b.z), ch(b.x, 0.03, b.z), ch(b.x, 0.09, b.z)]; };

export default [boot, fresh(9 * 60),
  { label: '① mở menu ẩn bằng cú bấm thật' },
  { eval: (src) => eval('(' + src + ')()'), args: [moMenu.toString()], wait: 600 },
  { shot: OUT + 'dev60_menu' },
  { label: '② bấm nút Chạy của mục “Dựng sẵn bếp trà” → hộp thoại chọn món' },
  { eval: (src) => eval('(' + src + ')')('t61_tra'), args: [chạy.toString()], wait: 1200 },
  { eval: () => { const d = document.querySelector('#dlg'); return { mở: !d.classList.contains('hide'), chữ: d.querySelector('p')?.innerText, lựa: [...d.querySelectorAll('.opts button')].map((b) => b.innerText) }; } },
  { shot: OUT + 'dev60_chon_' + (process.env.SLUG || 'chanh') },
  { label: '   bấm thật vào lựa chọn “Trà chanh”' },
  { eval: (mon) => { const b = [...document.querySelectorAll('#dlg .opts button')].find((x) => x.innerText.includes(mon)); if (!b) return 'không thấy nút'; b.click(); return 'đã bấm ' + mon; }, args: [MON], wait: 2500 },
  { eval: () => [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText.replace(/\n/g, ' ')).slice(-4) },
  { eval: (src) => eval('(' + src + ')()'), args: [trạngThái.toString()] },
  { shot: OUT + 'dev60_sau_' + (process.env.SLUG || 'chanh') },
  { label: '③ chờ camera đứng yên (như người chơi nhìn nồi)' },
  { waitFor: () => {
      const g0 = window.__game, m = g0.cook.mini; if (!m || !m.bowls) return false;
      const b = m.bowls[0], v = g0.cook.world(b.x, 0.06, b.z).project(g0.camera);
      const p = [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)];
      const prev = window.__p1; window.__p1 = p;
      return !!prev && Math.abs(prev[0] - p[0]) <= 1 && Math.abs(prev[1] - p[1]) <= 1;
    }, timeout: 20000 },
  { label: '④ chạm thật 3 độ cao quanh viên trà' },
  { tapsEval: (src) => eval('(' + src + ')()'), args: [baCao.toString()], gap: 600 },
  { eval: (src) => eval('(' + src + ')()'), args: [trạngThái.toString()] },
  { shot: OUT + 'dev60_cham_' + (process.env.SLUG || 'chanh') },
  { label: '⑤ bấm chuột thật (máy tính) nếu vẫn chưa ăn' },
  { clickEval: (src) => eval('(' + src + ')()'), args: [điểmChạm.toString()], gap: 500 },
  { eval: (src) => eval('(' + src + ')()'), args: [trạngThái.toString()] },
];
