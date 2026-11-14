import { boot, fresh } from '../lib.mjs';
const go = (label, x, z, y0, y1, yaw = 0, pitch = -0.03) => [
  { label },
  { eval: new Function('return (async () => { const g0 = window.__game, me = { x: ' + x + ', z: ' + z + ' };' +
      ' g0.world.resolve(me.x, me.z, 0.4, me);' +
      ' g0.player.place(me.x, me.z, Math.atan2(' + y0 + ' - me.x, ' + y1 + ' - me.z) + ' + yaw + ', ' + pitch + ');' +
      ' await new Promise((r) => setTimeout(r, 900)); return { x: +me.x.toFixed(1), z: +me.z.toFixed(1) }; })')() },
  { shot: 'fix/' + label.split(')')[0] },
];
export default [boot, fresh(9 * 60),
  ...go('a_cat_toc_xa) tiệm cắt tóc — nhìn từ lối đi', -45.5, 11.6, -44.6, 8.2),
  ...go('b_cat_toc_gan) tiệm cắt tóc — lại gần', -44.6, 9.9, -45.2, 8.0),
  ...go('c_thoi_trang_xa) sạp quần áo — nhìn từ lối đi', -45.0, -5.4, -45.5, -8.2),
  ...go('d_thoi_trang_gan) sạp quần áo — lại gần', -44.0, -6.6, -46.2, -8.0, -0.35),
];
