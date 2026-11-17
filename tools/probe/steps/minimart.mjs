// Kiểm tra MiniMart 24h ban đêm (02:00 sáng): mở cửa 24/7, không kéo cửa cuốn, Bé Na đứng quầy và có đèn sáng.
import { boot, fresh } from '../lib.mjs';

export default [
  boot,
  fresh(2 * 60),
  { label: '① Kiểm tra mặt tiền & bên trong MiniMart 24h lúc 02:00 sáng' },
  {
    eval: async () => {
      const C = window.__game;
      const v = C.world.anchors.v_mart;
      if (!v) throw new Error('Missing v_mart anchor');
      const s = Math.sin(v.yaw), c = Math.cos(v.yaw);
      // Đặt người chơi ở vỉa hè nhìn thẳng vô cửa chính MiniMart lúc 2h sáng
      C.player.place(v.x + 4.5 * c + 5.2 * s, v.z - 4.5 * s + 5.2 * c, v.yaw + Math.PI, 0.05);
      await new Promise((r) => setTimeout(r, 900));
      const beNa = C.npcs.fixed.get('mart');
      const open = window.__R.shopOpen(C.g, { id: 'mart', open: [0, 24] });
      return {
        open,
        beNa: beNa ? { name: beNa.name, hidden: beNa.hidden, visible: beNa.rig.root.visible } : null,
      };
    },
    wait: 200,
    shot: 'minimart_night_front',
  },
  { label: '② Bước vào trong MiniMart lúc 02:00 sáng kiểm tra đèn trần & quầy' },
  {
    eval: async () => {
      const C = window.__game;
      const v = C.world.anchors.v_mart;
      const s = Math.sin(v.yaw), c = Math.cos(v.yaw);
      C.player.place(v.x + 2.5 * c - 1.5 * s, v.z - 2.5 * s - 1.5 * c, v.yaw + Math.PI * 0.85, 0.0);
      await new Promise((r) => setTimeout(r, 700));
      return { focus: C.interact.focus?.label ?? null };
    },
    wait: 200,
    shot: 'minimart_night_inside',
  },
];
