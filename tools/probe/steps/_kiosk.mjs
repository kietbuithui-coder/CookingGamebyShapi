import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(9 * 60),
  { eval: () => { const g0 = window.__game, A = g0.world.anchors, v = A.v_tra_da; g0.player.place(v.x + 4.2, v.z + 2.6, -Math.PI / 2, 0); window.__cam(v.x + 4.4, 1.9, v.z + 2.8, v.x, 0.9, v.z); return { tra: [v.x.toFixed(2), v.y, v.z.toFixed(2)], kiosk: [A.v_kiosk.x.toFixed(2), A.v_kiosk.z.toFixed(2)] }; }, wait: 3200 },
  { shot: 'tra1' },
  { eval: () => { const g0 = window.__game, A = g0.world.anchors, v = A.v_tra_da; window.__cam(v.x + 2.6, 1.5, v.z - 2.2, v.x - 0.2, 0.75, v.z + 0.2); return 1; }, quiet: true, wait: 3000 },
  { shot: 'tra2' },
];
