// Lượt 55 (b5): khách tới quầy GÁNH ở Cổng Chợ — có đi vòng qua đầu quầy không, có xuyên quầy không.
import { boot, fresh } from '../lib.mjs';
const setup = (spotId) => ({ eval: async (spotId) => {
  const g0 = window.__game, g = g0.g, R = window.__R, L = await import('/src/world/layout.ts');
  g0.set.quality = 0; g0.applyQuality();
  g.cash = 500000;
  for (const id of ['ganh', 'daothot', 'bepthan', 'noi', 'chao']) if (!R.has(g, id)) R.buyGear(g, id);
  for (const [id, n] of [['tra', 80], ['da', 80]]) window.__give(id, n, 'store');
  g.rec.tra_da.known = true; g.rec.tra_da.on = true;
  g.stall.ready.push({ rid: 'tra_da', n: 40, q: 0.9, cost: 3000, at: g.min });
  const sp = L.SPOTS.find((s) => s.id === spotId);
  g.min = 8 * 60;
  g0.stall.placeAt(sp);
  const s = g.stall, [px, pz] = g0.stall.standPos();
  g0.player.place(px, pz, s.yaw, -0.2);
  g0.stall.open(); window.__fast(true);
  window.__cross = [];
  window.__local = (x, z) => { const s2 = window.__game.g.stall; return [(x - s2.x) * Math.cos(s2.yaw) - (z - s2.z) * Math.sin(s2.yaw), (x - s2.x) * Math.sin(s2.yaw) + (z - s2.z) * Math.cos(s2.yaw)]; };
  for (let i = 0; i < 3; i++) g0.stall.send();
  return { player: [+px.toFixed(2), +pz.toFixed(2)], stall: [+s.x.toFixed(2), +s.z.toFixed(2)] };
}, args: [spotId], wait: 500 });
const sim = (n) => ({ eval: async (n) => {
  const g0 = window.__game, st = g0.stall;
  for (let i = 0; i < n; i++) {
    g0.stall.update(0.2); g0.npcs.update(0.2);
    for (const c of st.customers) {
      if (c.state === 'queue') continue;
      const [lx, lz] = window.__local(c.x, c.z);
      if (Math.abs(lx) < 0.95 && lz > -0.5 && lz < 0.62) {
        const rec = { name: c.name, st: c.state, local: [+lx.toFixed(2), +lz.toFixed(2)] };
        if (!window.__cross.some((x) => x.name === rec.name && Math.abs(x.local[1] - rec.local[1]) < 0.1)) window.__cross.push(rec);
      }
    }
    await new Promise((r) => setTimeout(r, 4));
  }
  const cs = st.customers.map((c) => { const [lx, lz] = window.__local(c.x, c.z); return { st: c.state, local: [+lx.toFixed(2), +lz.toFixed(2)], blocked: g0.world.blocked(c.x, c.z, 0.3) }; });
  return { cs, cross: window.__cross.slice(0, 6) };
}, args: [n], timeout: 120000 });
export default [boot, fresh(8 * 60),
  { label: '① Cổng Chợ: khách tới quầy gánh' }, setup('cho'), sim(150), sim(150), sim(150),
  { eval: () => ({ toast: (document.querySelector('#toasts') || { innerText: '' }).innerText.replace(/\n+/g, ' | ').slice(-200) }) },
  { eval: () => { window.__fast(false); return 1; } , quiet: true, wait: 800 },
  { shot: 'f55b5_cho' },
  { label: '② Cổng Công Viên: cùng gánh' },
  { eval: () => { const g0 = window.__game; for (const n of g0.stall.customers.slice()) g0.stall.dismiss(n, false); g0.stall.close(true); window.__cross = []; return 1; }, quiet: true, wait: 300 },
  setup('cv'), sim(150), sim(150),
  { eval: () => { window.__fast(false); return { cross: window.__cross.slice(0, 6) }; } , wait: 600 },
  { shot: 'f55b5_cv' },
];
