// Lượt 55 (d): bấm thử từng mục test mới trong menu ẩn (lượt 55) — tele sạp Dì Sáu, ngủ nhà nghỉ/trọ,
// buồng tắm hai nơi, dựng gánh ở chợ — rồi kiểm người chơi/NPC có bị kẹt hay không.
import { boot, fresh } from '../lib.mjs';
const tap = (ids) => ({ eval: async (ids) => {
  const g0 = window.__game, D = await import('/src/game/devPoints.ts');
  const sec = D.getDevSections();
  const all = sec.flatMap((s) => s.items);
  const out = [];
  for (const id of ids) {
    const it = all.find((i) => i.id === id);
    if (!it) { out.push({ id, err: 'không có mục này' }); continue; }
    g0.ui.closeDialog(); g0.mode = 'play';
    it.run();
    g0.ui.closeDialog(); g0.mode = 'play';
    const p = g0.player;
    out.push({
      id, at: [+p.x.toFixed(2), +p.z.toFixed(2)],
      blocked: g0.world.blocked(p.x, p.z, 0.3),
      housing: g0.g.housing, tier: g0.g.stall.tier, where: g0.g.stall.where,
      anchors: id.includes('sen') ? null : undefined,
    });
  }
  return out;
}, args: [ids], wait: 500 });
export default [boot, fresh(9 * 60),
  { eval: () => { window.__game.set.quality = 0; window.__game.applyQuality(); return 1; }, quiet: true },
  { label: '① ba mục tele + buồng tắm (đứng ở đâu, có kẹt không)' },
  tap(['t55_sap_tele', 't55_sen_nhanghi', 't55_sen_tro']),
  { label: '② ngủ thử: tele tới chỗ đứng cạnh giường' },
  tap(['t55_ngu_nhanghi', 't55_ngu_tro']),
  { label: '③ dựng gánh ở chợ rồi cho khách kéo tới' },
  tap(['t55_ganh_cho']),
  { eval: () => { const g0 = window.__game; window.__fast(true); window.__cross = [];
    const s = g0.g.stall;
    window.__local = (x, z) => [(x - s.x) * Math.cos(s.yaw) - (z - s.z) * Math.sin(s.yaw), (x - s.x) * Math.sin(s.yaw) + (z - s.z) * Math.cos(s.yaw)];
    return 1; }, quiet: true, wait: 300 },
  { eval: async () => {
    const g0 = window.__game;
    for (let i = 0; i < 400; i++) {
      g0.stall.update(0.2); g0.npcs.update(0.2);
      for (const c of g0.stall.customers) {
        if (c.state === 'queue') continue;
        const [lx, lz] = window.__local(c.x, c.z);
        if (Math.abs(lx) < 0.95 && lz > -0.5 && lz < 0.62) window.__cross.push({ name: c.name, st: c.state, local: [+lx.toFixed(2), +lz.toFixed(2)] });
      }
      if (i % 40 === 0) await new Promise((r) => setTimeout(r, 4));
    }
    const cs = g0.stall.customers.map((c) => { const [lx, lz] = window.__local(c.x, c.z); return { st: c.state, local: [+lx.toFixed(1), +lz.toFixed(1)] }; });
    return { n: cs.length, cs: cs.slice(0, 6), cross: window.__cross.slice(0, 6) };
  }, timeout: 180000 },
  { eval: () => { window.__fast(false); return 1; }, quiet: true, wait: 900 },
  { shot: 'f55d_ganh_cho' },
];
