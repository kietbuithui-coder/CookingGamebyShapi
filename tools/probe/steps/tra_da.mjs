// Sửa quán trà đá trước tạp hoá Cô Ba: cô Thắm ngồi đúng mặt ghế (không bay), quán dời ra sát lòng đường
// để không chắn quầy tạp hoá, bảng giá dựng trên cột riêng thay vì dán lên tường nhà người ta.
// Chạy: cd tools/probe && node play.mjs steps/tra_da.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(9 * 60),
  { label: '① cô Thắm không còn bay, quán không chắn quầy tạp hoá' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors, v = A.v_tra_da, k = A.v_kiosk;
    const n = g0.npcs.fixed.get('tra_da'), kiosk = g0.npcs.fixed.get('kiosk');
    return {
      neoTraDa: { x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2) },
      nguoiNgoi: { y: +n.y.toFixed(2), pose: n.pose, cachKiosk: +Math.hypot(n.x - k.x, n.z - k.z).toFixed(2) },
      cooBa: { y: +kiosk.y.toFixed(2), pose: kiosk.pose },
      ngoiKhac: g0.npcs.list.filter((n) => n.pose === 'sit').map((n) => `${n.fixedId}:${n.y.toFixed(2)}`),
    };
  } },
  { eval: () => { const g0 = window.__game, A = g0.world.anchors, v = A.v_tra_da; g0.player.place(v.x + 4.2, v.z + 2.6, -Math.PI / 2, 0); window.__cam(v.x + 4.4, 1.9, v.z + 2.8, v.x, 0.9, v.z); return 1; }, quiet: true, wait: 3000 },
  { shot: OUT + 'tra_da_sua' },
  { label: '② ông Tư đánh cờ trong công viên cũng ngồi đúng' },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_danh_co; g0.player.place(v.x + 1.6, v.z + 1.4, -Math.PI / 2, 0); window.__cam(v.x + 1.8, 1.5, v.z + 1.6, v.x, 0.6, v.z); return { y: +v.y.toFixed(2) }; }, wait: 3000 },
  { shot: OUT + 'danh_co_sua' },
  { label: '③ ngồi xuống ghế và gọi trà được' },
  { eval: () => { const g0 = window.__game; g0.player.place(g0.world.anchors.tra_ban.x + 0.9, g0.world.anchors.tra_ban.z, -Math.PI / 2, 0); g0.interact.update(0.05); const f = g0.interact.focus; return { focus: f && f.label, sub: f && f.sub }; } },
];
