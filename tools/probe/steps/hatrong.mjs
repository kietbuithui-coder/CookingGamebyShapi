import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(10 * 60),
  { label: '① Cô Hồng ở đâu, có chắn cổng không' },
  { eval: async () => {
    const g0 = window.__game, a = g0.world.anchors['v_hat_rong'];
    const collide = g0.world.blocked ? g0.world.blocked(a.x, a.z, 0.3) : null;
    const me = { x: a.x + 7.5, z: a.z + 6.5 };
    g0.player.place(me.x, me.z, Math.atan2(a.x - me.x, a.z - me.z), -0.05);
    await new Promise((r) => setTimeout(r, 500));
    window.__cam(me.x, 1.7, me.z, a.x, 1.0, a.z);
    const n = g0.npcs.fixed.get('hat_rong');
    // khoảng cách từ cột cổng gần nhất
    const pil = [[-38.0, 4.6], [-38.0, -4.6]];
    return { neo: { x: +a.x.toFixed(2), z: +a.z.toFixed(2) }, collide, coCo: !!n, x: n ? +n.x.toFixed(2) : null, z: n ? +n.z.toFixed(2) : null, hidden: n ? n.hidden : null };
  }, wait: 1600 },
  { shot: 'fix/hat_rong_sau' },
  { label: '② nhìn từ cổng chợ ra: cô có khuất không' },
  { eval: async () => {
    const g0 = window.__game, a = g0.world.anchors['v_hat_rong'];
    const me = { x: -33.0, z: 0 };
    g0.player.place(me.x, me.z, Math.atan2(a.x - me.x, a.z - me.z), -0.03);
    await new Promise((r) => setTimeout(r, 400));
    window.__cam(me.x, 1.7, me.z, a.x, 1.0, a.z);
    return 'ok';
  }, wait: 1300 },
  { shot: 'fix/hat_rong_tu_cong' },
];
