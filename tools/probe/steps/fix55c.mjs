// Lượt 55 (c): chụp buồng tắm mới + đồ đạc phòng ngủ ở nhà nghỉ / nhà trọ (đặt camera theo khung lô đất).
import { boot, fresh } from '../lib.mjs';
const shot = (lotId, camLocal, camY, lookLocal, lookY, fov, name) => ({ eval: async (lotId, camLocal, camY, lookLocal, lookY, fov, name) => {
  const g0 = window.__game, g = g0.g, L = await import('/src/world/layout.ts');
  const lot = L.LOTS.find((l) => l.id === lotId);
  if (!lot) return 'thiếu lô ' + lotId;
  const W = (lx, lz) => L.toWorld(lot.fr, lot.at + lx, lz);   // buildPlace dựng với b.frame(l.fr, l.at)
  const [cx, cz] = W(camLocal[0], camLocal[1]), [tx, tz] = W(lookLocal[0], lookLocal[1]);
  g.min = 9 * 60; g.weather.now = 'nang';
  g0.ui.closeDialog(); g0.mode = 'play';
  g0.player.place(cx, cz, Math.atan2(tx - cx, tz - cz), -0.05);
  const pos = g0.camera.position.clone().set(cx, camY, cz), look = g0.camera.position.clone().set(tx, lookY, tz);
  g0.player.camTo = { pos, look, fov };
  g0.ui.$('quest').style.display = 'none';
  return { lot: lotId, cam: [+cx.toFixed(2), +cz.toFixed(2)], look: [+tx.toFixed(2), +tz.toFixed(2)] };
}, args: [lotId, camLocal, camY, lookLocal, lookY, fov, name], wait: 1500 });
export default [boot, fresh(9 * 60),
  { eval: () => { const g0 = window.__game, g = g0.g; g.housing = 'nhanghi'; g.paidUntil = g.day + 3; g0.ui.closeDialog(); g0.mode = 'play'; return 1; }, quiet: true },
  { label: '① buồng tắm nhà nghỉ (góc đông-nam phòng, sen trên vách hậu)' },
  shot('motel', [8.9, 2.2], 1.45, [7.0, 4.55], 1.35, 56),
  { shot: 'f55c_nhanghi_wash' },
  { label: '①b cả phòng nhà nghỉ: tủ đầu giường, ti vi, quạt, rèm, thảm + buồng tắm' },
  shot('motel', [6.7, 0.75], 2.5, [11.0, 4.1], 0.85, 100),
  { shot: 'f55c_nhanghi_room' },
  { label: '② buồng tắm nhà trọ' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.housing = 'tro'; g.paidUntil = g.day + 3; g0.player.camTo = null; g0.ui.closeDialog(); g0.mode = 'play'; return 1; }, quiet: true },
  shot('tro', [5.6, 3.0], 1.45, [3.7, 5.2], 1.35, 56),
  { shot: 'f55c_tro_wash' },
  { label: '②b cả phòng trọ: kệ đầu giường, dây phơi, quạt, chiếu, lịch + góc tắm' },
  shot('tro', [3.5, 1.0], 2.4, [9.4, 4.6], 0.8, 100),
  { shot: 'f55c_tro_room' },
  { eval: () => { const g0 = window.__game; g0.player.camTo = null; g0.ui.$('quest').style.display = ''; return 1; }, quiet: true },
];
