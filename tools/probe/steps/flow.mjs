// Hồi quy nhanh: vào ván mới bằng chạm, đi bằng cần ảo, bật nút chạy, sắm đồ, đặt quầy, nướng bắp bằng nút nấu ăn.
// (Mở bán và phục vụ khách: xem customers.mjs.)
import { boot } from '../lib.mjs';
const tapSel = (sel) => ({ tapsEval: (sel) => { const e = document.querySelector(sel); if (!e) return []; const r = e.getBoundingClientRect(); return [[r.left + r.width / 2, r.top + r.height / 2]]; }, args: [sel] });
const SPOT = { id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 20000, minTier: 1 };
export default [boot,
  { label: 'A. vào ván mới bằng thao tác chạm' },
  { eval: () => { localStorage.clear(); return 1; }, quiet: true },
  tapSel('#menu [data-m=new]'), { wait: 700 }, tapSel('#menu [data-m=anh]'), { wait: 2500 },
  tapSel('#dlg .btn'), { wait: 700 }, tapSel('#dlg .btn'), { wait: 2000 },
  { eval: () => { const g0 = window.__game; g0.set.auto = false; g0.set.quality = 0; g0.applyQuality(); window.__fast = (on) => { g0.city.root.visible = !on; g0.renderer.setPixelRatio(on ? 0.3 : 0.7); return on; }; return { mode: g0.mode, cash: g0.g.cash, p: [+g0.player.x.toFixed(1), +g0.player.z.toFixed(1)], met: Object.keys(g0.g.met).length }; } },
  { label: 'B. đi bằng cần ảo + nút chạy' },
  { drag: [[150, 300], [150, 280], [150, 240], [150, 232]], gap: 80, hold: 2500 },
  { eval: () => { const g0 = window.__game; return { p: [+g0.player.x.toFixed(1), +g0.player.z.toFixed(1)], stickHidden: document.querySelector('#stick').classList.contains('hide') }; } },
  tapSel('#runb .run'), { wait: 300 },
  { eval: () => ({ runLock: window.__game.input.runLock, on: document.querySelector('#runb .run').classList.contains('on') }) },
  tapSel('#runb .run'),
  { label: 'C. sắm đồ, đặt quầy, nướng bắp: bấm nút nấu ăn' },
  { eval: (SPOT) => { const g0 = window.__game, g = g0.g, R = window.__R; g.cash = 3000000; for (const id of ['ganh', 'daothot', 'bepthan', 'vi', 'noi']) R.buyGear(g, id); for (const [id, n] of [['bap', 10], ['hanhla', 6], ['dauan', 6], ['muoi', 6], ['tra', 8], ['da', 12], ['than', 3]]) window.__give(id, n, 'store'); const ok = g0.stall.placeAt(SPOT); const [x, z] = g0.stall.standPos(); g0.player.place(x, z, g.stall.yaw, -0.2); const now = g.day * 1440 + g.min; g.stall.preps.push({ rid: 'bap_nuong', n: 8, q: 0.9, at: now, cost: 900 }); g.rec.bap_nuong.on = true; const r = R.menuOf(g).find((r) => r.id === 'bap_nuong'); window.__done = 0; g0.cook.finish(r, () => { window.__done = 1; }); return { ok, mode: g0.mode, tier: g.stall.tier }; }, args: [SPOT], wait: 2500 },
  { eval: () => { const m = window.__game.cook.mini; return { flame: +m.heat.flame.toFixed(2), btns: [...document.querySelectorAll('#cook .btns button')].map((b) => b.dataset.id + ':' + b.textContent), hud: { act: getComputedStyle(document.querySelector('#act')).display, runb: getComputedStyle(document.querySelector('#runb')).display } }; } },
  tapSel('#cook .btns button[data-id=fan]'), { wait: 250 }, tapSel('#cook .btns button[data-id=fan]'), { wait: 600, shot: 'rg_grill' },
  { eval: () => ({ flame: +window.__game.cook.mini.heat.flame.toFixed(2) }) },
  { eval: () => { const g0 = window.__game; g0.cook.exit ? g0.cook.exit() : document.querySelector('#cook .quit').click(); return g0.mode; }, wait: 800 },
  { eval: () => { const g0 = window.__game; const d = document.querySelector('#dlg'); if (!d.classList.contains('hide')) { const b = d.querySelector('.btn'); b && b.click(); } return { mode: g0.mode, hudAct: getComputedStyle(document.querySelector('#act')).display }; }, wait: 500 },
];
