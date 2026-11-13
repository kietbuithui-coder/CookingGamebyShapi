import { boot, fresh } from '../lib.mjs';
const SPOT = { id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 20000, minTier: 1 };
export default [boot, fresh(11 * 60),
  { eval: (SPOT) => { const g0 = window.__game, g = g0.g, R = window.__R; g0.set.quality = 0; g0.applyQuality(); g.cash = 3000000; for (const id of ['ganh', 'bepthan', 'noi']) R.buyGear(g, id); for (const [id, n] of [['tra', 8], ['da', 12], ['than', 3]]) window.__give(id, n, 'store'); const ok = g0.stall.placeAt(SPOT); const [x, z] = g0.stall.standPos(); g0.player.place(x, z, g.stall.yaw, -0.2); const now = g.day * 1440 + g.min; g.rec.tra_da.on = true; g.stall.ready.push({ rid: 'tra_da', n: 6, q: 0.9, at: now, cost: 1700 }); const op = g0.stall.open(); window.__fast(true); window.__t0 = g0.time; g0.stall.send(); return { ok, op, n: g0.stall.customers.length }; }, args: [SPOT] },
  { waitFor: () => window.__game.stall.customers.some((n) => n.state === 'queue' && n.order), timeout: 150000 },
  { eval: () => { const g0 = window.__game; window.__fast(false); const n = g0.stall.customers.find((n) => n.state === 'queue' && n.order); const [x, z] = g0.stall.standPos(); const dx = n.x - x, dz = n.z - z; g0.player.place(x, z, Math.atan2(dx, dz), -0.05); window.__n = n; n.patience = 1e4; return { gameSecs: +(g0.time - window.__t0).toFixed(1), real: n.name, arch: n.arch.name, regular: n.regular ? n.regular.id : null }; }, wait: 1800, shot: 'rg_customer' },
  { eval: () => { const f = window.__game.interact.focus; return f ? { label: f.label, sub: f.sub } : null; } },
  { eval: () => { const g0 = window.__game, c0 = g0.g.cash; g0.stall.serve(window.__n); return { cash0: c0, cash1: g0.g.cash, sold: g0.g.led.sold, rep: +g0.g.rep.toFixed(2) }; }, wait: 2500 },
  { label: 'khách quen lần đầu: vẫn là người lạ, bán xong mới biết tên' },
  { eval: () => { const g0 = window.__game; window.__fast(true); const reg = { id: 'chu_ba', name: 'Chú Ba xe ôm', arch: 'taixe', fem: false, likes: ['com', 'nuoc'], hour: 11.5, note: '', seed: 11 }; const n = g0.stall.send(reg); return { sent: !!n, met: g0.g.met }; } },
  { waitFor: () => window.__game.stall.customers.some((n) => n.regular && n.state === 'queue' && n.order), timeout: 150000 },
  { eval: () => { const g0 = window.__game; window.__fast(false); const n = g0.stall.customers.find((n) => n.regular && n.state === 'queue'); const [x, z] = g0.stall.standPos(); const dx = n.x - x, dz = n.z - z; g0.player.place(x, z, Math.atan2(dx, dz), -0.05); window.__n = n; n.patience = 1e4; return { rel: g0.g.rel.chu_ba, met: g0.g.met }; }, wait: 1800 },
  { eval: () => { const f = window.__game.interact.focus; return f ? { label: f.label, sub: f.sub } : null; } },
  { eval: () => { const g0 = window.__game; g0.stall.serve(window.__n); return { met: g0.g.met }; }, wait: 3500 },
  { eval: () => ({ toasts: (document.querySelector('#toasts') || { innerText: '' }).innerText.replace(/\n+/g, ' | ').slice(0, 260) }) },
  { eval: () => { const g0 = window.__game; g0.ui.panel('book'); const t = [...document.querySelectorAll('#modal .tab')].find((t) => /khách quen/i.test(t.textContent)); t && t.click(); return [...document.querySelectorAll('#modal .list')].pop().innerText.replace(/\n+/g, ' | ').slice(0, 300); } },
];
