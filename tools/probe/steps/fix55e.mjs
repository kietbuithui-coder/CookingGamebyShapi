// Lượt 55 (e): bấm từng mục test của lượt 55 rồi xem `interact.focus` — tele phải đứng đúng chỗ bấm được.
import { boot, fresh } from '../lib.mjs';
const tap = (ids) => ({ eval: async (ids) => {
  const g0 = window.__game, D = await import('/src/game/devPoints.ts');
  const all = D.getDevSections().flatMap((s) => s.items);
  const out = [];
  for (const id of ids) {
    const it = all.find((i) => i.id === id);
    if (!it) { out.push({ id, err: 'thiếu mục' }); continue; }
    g0.ui.closeDialog(); g0.mode = 'play';
    it.run(); g0.ui.closeDialog(); g0.mode = 'play';
    const p = g0.player;
    // cho tương tác quét lại vài nhịp
    for (let i = 0; i < 40; i++) { g0.player.update(0.03); } for (let i = 0; i < 6; i++) g0.interact.update(0.05);
    out.push({ id, at: [+p.x.toFixed(2), +p.z.toFixed(2)], blocked: g0.world.blocked(p.x, p.z, 0.3),
      focus: g0.interact.focus ? g0.interact.focus.label : null });
  }
  return out;
}, args: [ids], wait: 400 });
export default [boot, fresh(9 * 60),
  { eval: () => { window.__game.set.quality = 0; window.__game.applyQuality(); return 1; }, quiet: true },
  tap(['t55_sap_tele']),
  tap(['t55_sen_nhanghi']),
  tap(['t55_sen_tro']),
  tap(['t55_ngu_nhanghi']),
  tap(['t55_ngu_tro']),
];
