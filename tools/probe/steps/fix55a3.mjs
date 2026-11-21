// Lượt 55 (a3): ngủ rồi tua thẳng tới lúc tỉnh (acts.update), đo chỗ đứng sau khi tỉnh, rồi thử bước đi.
import { boot, fresh } from '../lib.mjs';
const run = (house) => ({ eval: (house) => {
  const g0 = window.__game, g = g0.g, A = g0.world.anchors;
  g.housing = house; g.paidUntil = g.day + 3; g.min = 22 * 60;
  const a = A['bed_' + house];
  g0.player.place(a.x, a.z + 1.2, 0, 0); g0.mode = 'play';
  g0.acts.sleep(house, 8);
  const during = { mode: g0.mode, at: [+g0.player.x.toFixed(2), +g0.player.z.toFixed(2)], blocked: g0.world.blocked(g0.player.x, g0.player.z, 0.3) };
  // tua thời gian tới sáng
  g.min = 6 * 60; g.day += 1;
  for (let i = 0; i < 5; i++) g0.acts.update(0.1);
  const after = { mode: g0.mode, at: [+g0.player.x.toFixed(2), +g0.player.z.toFixed(2)], blocked: g0.world.blocked(g0.player.x, g0.player.z, 0.3), eye: +g0.player.eyeTarget.toFixed(2) };
  // thử bước ra 4 hướng, mỗi hướng 1,2 m: xem có bị nhảy chỗ lạ không
  const moves = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const sx = g0.player.x, sz = g0.player.z;
    g0.input.mx = dx; g0.input.mz = dz;
    for (let i = 0; i < 20; i++) g0.player.update(0.05);
    g0.input.mx = 0; g0.input.mz = 0;
    moves.push({ dir: [dx, dz], from: [+sx.toFixed(2), +sz.toFixed(2)], to: [+g0.player.x.toFixed(2), +g0.player.z.toFixed(2)], jump: +Math.hypot(g0.player.x - sx, g0.player.z - sz).toFixed(2) });
  }
  return { house, bed: [+a.x.toFixed(2), +a.z.toFixed(2)], during, after, moves };
}, args: [house], wait: 400 });
export default [boot, fresh(22 * 60),
  { label: 'nhà nghỉ' }, run('nhanghi'),
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; window.__fast(false); const A = g0.world.anchors, b = A.bed_nhanghi; g0.player.place(b.x - 1.6, b.z - 1.0, Math.atan2(b.x - (b.x - 1.6), b.z - (b.z - 1.0)), -0.15); return 1; }, quiet: true, wait: 900 },
  { shot: 'f55a3_nhanghi' },
  { label: 'nhà trọ' }, run('tro'),
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; const A = g0.world.anchors, b = A.bed_tro; g0.player.place(b.x + 1.6, b.z + 1.2, Math.atan2(b.x - (b.x + 1.6), b.z - (b.z + 1.2)), -0.15); return 1; }, quiet: true, wait: 900 },
  { shot: 'f55a3_tro' },
];
