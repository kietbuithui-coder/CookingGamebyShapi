// LƯỢT 28 — chỗ hẹn "nhận thưởng" của 1900 1234 (ngõ cụt sau chợ, có thùng bỏ tiền) và tiệm quần áo mới của Cô Ngọc.
import { boot, fresh } from '../lib.mjs';

/** Đứng ở (x,z) quay mặt về (tx,tz) rồi chụp. */
const look = (name, x, z, tx, tz) => [
  { label: 'đứng ở ' + name, eval: async (x, z, tx, tz) => {
    const G = window.__game, p = G.player;
    G.ui.closePanel(); G.ui.closeDialog(); G.set.cam3 = false;
    const me = { x, z }; G.world.resolve(me.x, me.z, 0.4, me);
    p.place(me.x, me.z, Math.atan2(tx - me.x, tz - me.z), -0.06);
    await new Promise((r) => setTimeout(r, 1400));
    return { at: [+me.x.toFixed(1), +me.z.toFixed(1)] };
  }, args: [x, z, tx, tz], wait: 1600 },
  { shot: name },
];

export default [boot, fresh(9 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; }, quiet: true },
  { label: 'thông tin chỗ hẹn + tiệm quần áo', eval: async () => {
    const PH = await import('/src/sim/phone.ts');
    const { LOTS, lotPoint } = await import('/src/world/layout.ts');
    const l = LOTS.find((x) => x.id === 'thoitrang');
    const a = window.__game.world.anchors;
    return { spot: PH.SCAM_SPOT, shopDoor: lotPoint(l, l.w / 2, 0.4).map((v) => +v.toFixed(1)), shopW: +l.w.toFixed(1),
      thoiTrang: a.v_thoi_trang && [+a.v_thoi_trang.x.toFixed(1), +a.v_thoi_trang.z.toFixed(1)] };
  } },
  ...look('a-ngo-cut', -75.2, 12.4, -75.2, 21.4),
  ...look('b-tuong-cuon', -75.2, 18.2, -74.6, 21.4),
  ...look('c-thung-tien', -73.6, 17.6, -72.2, 20.0),
  ...look('d-tiem-quan-ao', -27.6, -8.6, -22.6, -8.6),
  ...look('e-trong-tiem', -21.6, -8.6, -17.0, -8.0),
  ...look('f-mat-tien', -34.2, -8.6, -22.6, -8.6),
];
