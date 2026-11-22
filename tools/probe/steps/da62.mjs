// Lượt 62 — kiểm trong game thật: nhãn “độ lạnh” của đá ở Túi đồ, và tốc độ tan sau 12 giờ.
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
const moMenu = () => { const g0 = window.__game; g0.ui.panel('settings'); const u = document.querySelector('#dev-unlock');
  for (let i = 0; i < 7; i++) u.click(); for (const d of '7777') document.querySelector(`[data-pin="${d}"]`)?.click();
  return { mở: !!document.querySelector('[data-k="t60_da_lanh"]'), mục: [...document.querySelectorAll('[data-a="devRun"]')].map((b) => b.dataset.k).filter((k) => k.startsWith('t60')) }; };
const bấm = (id) => { const b = document.querySelector(`[data-a="devRun"][data-k="${id}"]`); if (!b) return 'không thấy ' + id; b.click(); return 'bấm ' + id; };
const toasts = () => [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText.replace(/\n/g, ' '));
/** Nhãn trạng thái của từng lô đá đang có trong túi, đọc từ bảng Túi đồ (đúng cái người chơi nhìn). */
const nhãnTúi = () => {
  const g0 = window.__game; g0.ui.closeDialog(); g0.ui.closePanel(); g0.ui.panel('bag');
  const rows = [...document.querySelectorAll('#modal .item')].map((r) => r.innerText.replace(/\n/g, ' · '));
  return rows.filter((t) => /Đá viên/.test(t));
};
const lôĐá = () => window.__game.g.bag.filter((s) => s.id === 'da').map((s) => ({ n: s.n, fresh: +s.fresh.toFixed(1) }));
export default [boot, fresh(9 * 60),
  { label: '① mở menu ẩn — thấy 2 mục đá' },
  { eval: (s) => eval('(' + s + ')()'), args: [moMenu.toString()] },
  { label: '② “Cho một bịch đá vào túi rồi xem nhãn độ lạnh”' },
  { eval: (s) => eval('(' + s + ')')('t60_da_lanh'), args: [bấm.toString()], wait: 900 },
  { eval: (s) => eval('(' + s + ')()'), args: [lôĐá.toString()] },
  { eval: (s) => eval('(' + s + ')()'), args: [nhãnTúi.toString()], max: 1500 },
  { shot: OUT + 'da62_tui' },
  { label: '③ “Tua 12 tiếng”: đá phải còn, không tan sạch' },
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.ui.closePanel(); g0.ui.panel('settings'); return !!document.querySelector('[data-k="t60_da_dem"]'); }, wait: 400 },
  { eval: (s) => eval('(' + s + ')')('t60_da_dem'), args: [bấm.toString()], wait: 900 },
  { eval: (s) => eval('(' + s + ')()'), args: [toasts.toString()] },
  { eval: (s) => eval('(' + s + ')()'), args: [lôĐá.toString()] },
  { shot: OUT + 'da62_sau12h' },
];
