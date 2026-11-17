// Kiểm tra 5 cải tiến: khách ngồi đúng ghế & đi qua cửa, hoạt ảnh cam3, chuông cửa CĂN 102, mua đứt nhà.
import { boot, fresh } from '../lib.mjs';

export default [
  boot,
  fresh(11 * 60),
  { label: '① Thiết lập Nhà hàng bậc 6 và gọi nhóm 4 khách đi qua cửa vào ngồi ghế' },
  {
    eval: async () => {
      const C = window.__game, G = C.g, R = window.__R, S = C.stall;
      G.cash = 300000000;
      G.rep = 85;
      for (const id of ['sap', 'quanan', 'quanngoi', 'nhahang', 'daothot', 'bepgas', 'vi', 'noi', 'chao', 'thungda', 'bien', 'den', 'dieu_hoa']) {
        R.buyGear(G, id);
      }
      G.stall.store.push({ id: 'gas', n: 4, fresh: 99999, q: 1, cost: 28000 });
      for (const id of ['banh_mi_trung', 'com_suon', 'pho_bo', 'tra_da']) {
        G.rec[id].known = true; G.rec[id].on = true;
        G.stall.ready.push({ rid: id, n: 10, q: 0.92, cost: 4000, at: G.day * 1440 + G.min });
      }
      const sp = S.spots().find((s) => s.id === 'matbang_tb');
      const ok = S.placeAt(sp);
      S.open();
      S.refresh();
      // Bật góc nhìn thứ 3 đúng cách (ctx.set.cam3)
      if (!C.set.cam3) C.player.toggleView();
      const c = Math.cos(sp.yaw), sn = Math.sin(sp.yaw);
      const px = sp.x + 0.0 * c + 5.6 * sn, pz = sp.z - 0.0 * sn + 5.6 * c;
      C.player.place(px, pz, sp.yaw + Math.PI, -0.08);
      const sent = S.sendGroup(4);
      // Đặt 4 khách ngay trước cửa ngoài và nhảy tới đoạn vào cửa để họ đi thẳng qua cửa vào ngồi ghế
      for (let i = 0; i < S.customers.length; i++) {
        const n = S.customers[i];
        n.x = sp.x + ((i - 1.5) * 0.4) * c + (5.2 + i * 0.25) * sn;
        n.z = sp.z - ((i - 1.5) * 0.4) * sn + (5.2 + i * 0.25) * c;
        n.pi = Math.max(0, n.path.length - 5);
      }
      // Chờ các khách đi qua cửa và ngồi vào ghế
      for (let t = 0; t < 90; t++) {
        await new Promise((r) => setTimeout(r, 250));
        if (S.customers.length >= 4 && S.customers.slice(0, 4).every((n) => n.state === 'queue')) break;
      }
      // Đặt góc nhìn từ phía cửa chính nhìn vào toàn bộ dãy bàn ghế bên trong
      C.player.place(sp.x + 0.0 * c + 4.5 * sn, sp.z - 0.0 * sn + 4.5 * c, sp.yaw + Math.PI, -0.14);
      return { ok, sent, spot: sp.id, tier: G.stall.tier, arrived: S.customers.filter((n) => n.state === 'queue').length };
    },
    wait: 400,
    shot: 'polish5_seated',
  },
  { label: '② Kiểm tra tọa độ ghế ngồi & hoạt ảnh góc nhìn thứ 3 (đấm)' },
  {
    eval: async () => {
      const C = window.__game;
      const custs = C.stall.customers.map((n) => {
        const [sx, sz] = C.stall.seatPos(n.slot);
        return {
          slot: n.slot,
          state: n.state,
          seated: n.rig.seated,
          pose: n.rig.pose,
          dx: Number(Math.abs(n.x - sx).toFixed(3)),
          dz: Number(Math.abs(n.z - sz).toFixed(3)),
          y: Number(n.y.toFixed(3)),
        };
      });
      C.acts.punch();
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => requestAnimationFrame(r));
        if (C.player.rig.pose === 'punch') break;
      }
      const poseAfterPunch = C.player.rig.pose;
      return { custs, cam3: C.set.cam3, rigVis: C.player.rig.root.visible, poseAfterPunch, gestureT: Number(C.player.gestureT.toFixed(2)) };
    },
    wait: 40,
    shot: 'polish5_cam3_punch',
  },
  { label: '③ Dịch chuyển tới chuông cửa CĂN 102 và kiểm tra tương tác bấm chuông' },
  {
    eval: async () => {
      const C = window.__game;
      const bell = C.world.anchors.bell_canho;
      if (!bell) return { error: 'missing_bell_canho' };
      C.player.place(bell.x + Math.sin(bell.yaw) * 1.5, bell.z + Math.cos(bell.yaw) * 1.5, bell.yaw + Math.PI, -0.05);
      await new Promise((r) => setTimeout(r, 250));
      C.interact.update(0.05);
      const focus = C.interact.focus;
      return { bellFound: !!bell, focusLabel: focus?.label, focusSub: focus?.sub };
    },
    wait: 200,
    shot: 'polish5_canho_door',
  },
  { label: '④ Bấm chuông gọi Cô Hạnh -> mở cửa, bước ra, hiện tùy chọn Mua đứt' },
  {
    eval: async () => {
      const C = window.__game;
      C.interact.focus?.act();
      await new Promise((r) => setTimeout(r, 950));
      const hanh = C.npcs.fixed.get('canho');
      const opts = [...document.querySelectorAll('#dlg .btn')].map((e) => e.textContent?.trim());
      return {
        hanhVis: hanh?.rig.root.visible,
        hanhBellOut: !!hanh?.bellOut,
        hasBuyOpt: opts.some((t) => t.includes('Mua đứt')),
        opts,
      };
    },
    wait: 200,
    shot: 'polish5_bell_dialog',
  },
];
