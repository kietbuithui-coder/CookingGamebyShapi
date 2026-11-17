// Kiểm tra Cà Phê Sân Vườn: có chủ quán đứng sau quầy, có khách ngồi dùng và người chơi tương tác được.
import { boot, fresh } from '../lib.mjs';

export default [
  boot,
  fresh(6 * 60 + 10),
  { label: '① Lúc 06:10 sáng (vừa vào game / mới ngủ dậy) tới Cà Phê Sân Vườn' },
  {
    eval: async () => {
      const C = window.__game;
      const v = C.world.anchors.v_cafe;
      const ban = C.world.anchors.ban_cafe;
      if (!v || !ban) throw new Error('Missing v_cafe or ban_cafe anchor');
      // Đặt người chơi ngay trước hiên Cà Phê Sân Vườn nhìn thẳng vô quầy và bàn khách
      const s = Math.sin(v.yaw), c = Math.cos(v.yaw);
      C.player.place(ban.x + s * 3.8, ban.z + c * 3.8, v.yaw + Math.PI, -0.05);
      for (let t = 0; t < 30; t++) {
        await new Promise((r) => setTimeout(r, 150));
        const patrons = C.npcs.list.filter((n) => n.data?.cafeSeat !== undefined && n.state === 'sit');
        if (patrons.length >= 2) break;
      }
      const owner = C.npcs.fixed.get('cafe');
      const patrons = C.npcs.list.filter((n) => n.data?.cafeSeat !== undefined && n.state === 'sit');
      return {
        owner: owner ? { name: owner.name, hidden: owner.hidden, visible: owner.rig.root.visible, pose: owner.rig.pose } : null,
        patronCount: patrons.length,
        patrons: patrons.map((n) => ({ name: n.name, pose: n.pose, seated: n.rig.seated, held: !!n.rig.held })),
        cafeSeats: C.world.cafeSeats.length,
      };
    },
    wait: 200,
    shot: 'cafe_view',
  },
  { label: '② Đi tới quầy & kiểm tra tương tác với chủ quán + menu Cà Phê Sân Vườn' },
  {
    eval: async () => {
      const C = window.__game;
      const v = C.world.anchors.v_cafe;
      const s = Math.sin(v.yaw), c = Math.cos(v.yaw);
      // Đứng trước quầy đối diện Anh Phong
      C.player.place(v.x + s * 1.5, v.z + c * 1.5, v.yaw + Math.PI, -0.05);
      await new Promise((r) => setTimeout(r, 650));
      const fCounter = C.interact.focus?.label ?? null;
      const ban = C.world.anchors.ban_cafe;
      const bs = Math.sin(v.yaw), bc = Math.cos(v.yaw);
      C.player.place(ban.x + bs * 1.1, ban.z + bc * 1.1, v.yaw + Math.PI, -0.35);
      await new Promise((r) => setTimeout(r, 650));
      const fTable = C.interact.focus?.label ?? null;
      C.acts.gardenCafeMenu();
      await new Promise((r) => setTimeout(r, 200));
      const dlgText = document.querySelector('#dlg-txt, .dlg-txt, #dialog')?.textContent?.slice(0, 120) ?? null;
      return { fCounter, fTable, hasDialog: !!dlgText };
    },
    wait: 150,
    shot: 'cafe_menu',
  },
];
