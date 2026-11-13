// Ảnh chụp lượt 5: mặt tiền + bên trong ba chỗ ở mới. Chạy: cd tools/probe && node play.mjs steps/shots5.mjs
import { boot, fresh, rich } from '../lib.mjs';
const OUT = 'shots5/';
/** Đặt người chơi đúng chỗ rồi ghim camera (__cam chỉ ăn khi người chơi ở gần). */
const shot = (name, pick) => ([
  { eval: (pick) => {
    const g0 = window.__game, A = g0.world.anchors, v = A[pick.anchor], b = A[pick.bed], base = pick.door ? g0.world.doors.find((x) => x.name === pick.door) : v;
    const [cx, cy, cz] = [base.x + pick.cx, pick.cy, base.z + pick.cz], [lx, ly, lz] = [base.x + pick.lx, pick.ly, base.z + pick.lz];
    g0.ui.closeDialog(); g0.mode = 'play'; g0.g.min = 9 * 60;
    g0.player.place(cx, cz, Math.atan2(lx - cx, lz - cz), 0);
    window.__cam(cx, cy, cz, lx, ly, lz);
    return { cam: [+cx.toFixed(1), +cz.toFixed(1)], look: [+lx.toFixed(1), +lz.toFixed(1)], bed: [b.x, b.z] };
  }, args: [pick], quiet: true, wait: 3000 },
  { shot: OUT + name },
]);
export default [boot, fresh(9 * 60), rich,
  { label: 'mặt tiền + nội thất' },
  ...shot('canho_ngoai', { anchor: 'v_canho', bed: 'bed_canho', cx: 1.5, cy: 2.2, cz: 9.5, lx: -0.4, ly: 2.4, lz: 0 }),
  ...shot('canho_trong', { door: 'door_canho', anchor: 'v_canho', bed: 'bed_canho', cx: 1.0, cy: 1.75, cz: -1.6, lx: -2.6, ly: 0.9, lz: -6.2 }),
  ...shot('nharieng_ngoai', { anchor: 'v_nharieng', bed: 'bed_nharieng', cx: 2.2, cy: 2.2, cz: 10, lx: -0.8, ly: 2.4, lz: 0 }),
  ...shot('nharieng_trong', { door: 'door_nharieng', anchor: 'v_nharieng', bed: 'bed_nharieng', cx: 1.2, cy: 1.75, cz: -1.8, lx: -2.4, ly: 0.9, lz: -6.0 }),
  ...shot('cuahang_ngoai', { anchor: 'v_cuahang', bed: 'bed_cuahang', cx: 1.2, cy: 2.1, cz: 9.5, lx: -0.6, ly: 2.2, lz: 0 }),
  ...shot('cuahang_trong', { door: 'door_cuahang', anchor: 'v_cuahang', bed: 'bed_cuahang', cx: 1.4, cy: 1.75, cz: -1.4, lx: -3.0, ly: 0.9, lz: -6.4 }),
  ...shot('canho_tren', { anchor: 'v_canho', bed: 'bed_canho', cx: 0, cy: 15, cz: 1, lx: 0.01, ly: 0, lz: 0 }),
  ...shot('nharieng_tren', { anchor: 'v_nharieng', bed: 'bed_nharieng', cx: 0, cy: 15, cz: 1, lx: 0.01, ly: 0, lz: 0 }),
  ...shot('cuahang_tren', { anchor: 'v_cuahang', bed: 'bed_cuahang', cx: 0, cy: 15, cz: 1, lx: 0.01, ly: 0, lz: 0 }),
];
