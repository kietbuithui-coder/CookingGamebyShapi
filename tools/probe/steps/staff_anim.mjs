// Kiểm tra 2 nhân viên đứng 2 bên chậu cây, đi qua cửa chính phục vụ khách + lau bàn, không đi xuyên tường.
import { boot, fresh } from '../lib.mjs';

export default [
  boot,
  fresh(11 * 60),
  { label: '① Dựng Nhà hàng + thuê 2 phục vụ đứng 2 bên chậu cây & 2 phụ bếp nấu bếp' },
  {
    eval: async () => {
      const C = window.__game, G = C.g, R = window.__R, S = C.stall;
      G.cash = 350000000; G.rep = 90;
      for (const id of ['sap', 'quanan', 'quanngoi', 'nhahang', 'daothot', 'bepgas', 'bep_cn', 'vi', 'noi', 'chao', 'thungda', 'tu_dong', 'bien', 'den', 'dieu_hoa']) {
        R.buyGear(G, id);
      }
      G.stall.store.push({ id: 'gas', n: 4, fresh: 99999, q: 1, cost: 28000 });
      for (const id of ['banh_mi_trung', 'com_suon', 'pho_bo', 'tra_da']) {
        G.rec[id].known = true; G.rec[id].on = true;
        G.stall.ready.push({ rid: id, n: 12, q: 0.92, cost: 4000, at: G.day * 1440 + G.min });
      }
      const sp = S.spots().find((s) => s.id === 'matbang_tb');
      const ok = S.placeAt(sp);
      S.placeAt(sp);
      S.open();
      R.hireHelper(G, R.helperCandidate(G));
      R.hireHelper(G, R.helperCandidate(G, 1), 2);
      R.hireSous(G, R.sousCandidate(G), 1);
      R.hireSous(G, R.sousCandidate(G, 1), 2);
      S.refresh();

      if (!C.set.cam3) C.player.toggleView();
      const c = Math.cos(sp.yaw), sn = Math.sin(sp.yaw);
      C.player.place(sp.x + 0.0 * c + 6.4 * sn, sp.z - 0.0 * sn + 6.4 * c, sp.yaw + Math.PI, -0.06);

      for (let t = 0; t < 30; t++) {
        await new Promise((r) => setTimeout(r, 250));
        if (S.helper && S.helper2 && S.sous && S.sous2) break;
      }
      return {
        ok,
        helpers: [S.helper?.name, S.helper2?.name],
        sous: [S.sous?.name, S.sous2?.name],
        h1Local: S.helper ? S['worldToLocal'](S.helper.x, S.helper.z).map((v) => Number(v.toFixed(2))) : null,
        h2Local: S.helper2 ? S['worldToLocal'](S.helper2.x, S.helper2.z).map((v) => Number(v.toFixed(2))) : null,
      };
    },
    wait: 200,
    shot: 'staff_at_plants',
  },
  { label: '② Gọi khách đi từ phía hông/sau lưng -> phải vòng qua vỉa hè & vào đúng cửa chính, rồi nhân viên đi qua cửa bưng món' },
  {
    eval: async () => {
      const C = window.__game, G = C.g, S = C.stall;
      const sp = S.s;
      const c = Math.cos(sp.yaw), sn = Math.sin(sp.yaw);
      S.send(); S.send();
      // Đặt 1 khách gần trước cửa để vào ngồi nhanh và test nhân viên đi cửa vào phục vụ
      const n0 = S.customers[0];
      if (n0) {
        n0.pi = Math.max(0, n0.path.length - 2);
        const [tx, tz] = n0.path[n0.pi];
        n0.x = tx; n0.z = tz;
      }
      let sawServePose = false;
      let servedByStaff = false;
      for (let t = 0; t < 180; t++) {
        await new Promise((r) => setTimeout(r, 200));
        const h1p = S.helper?.rig.pose, h2p = S.helper2?.rig.pose;
        if (h1p === 'serve' || h2p === 'serve') sawServePose = true;
        if (G.led.sold > 0) { servedByStaff = true; break; }
      }
      return {
        sawServePose,
        servedByStaff,
        sold: G.led.sold,
        sousPose: S.sous?.rig.pose,
        sous2Pose: S.sous2?.rig.pose,
      };
    },
    wait: 150,
    shot: 'staff_serving_via_door',
  },
  { label: '③ Cận cảnh quầy ra món (hết nhiễu) & người đi đường vòng qua tường phải (không kẹt)' },
  {
    eval: async () => {
      const C = window.__game, S = C.stall, sp = S.s;
      const c = Math.cos(sp.yaw), sn = Math.sin(sp.yaw);
      if (C.set.cam3) C.player.toggleView();
      C.player.place(sp.x + 0.0 * c + 2.2 * sn, sp.z - 0.0 * sn + 2.2 * c, sp.yaw + Math.PI, -0.08);
      // Đặt một người đi bộ ở ngoài cửa sổ phải (lx = 4.2, lz = 2.0) đi sang trái nhà hàng (lx = -6.0, lz = 2.0)
      const ped = C.npcs.list.find((n) => n.kind === 'ped' && n.state === 'walk');
      let pedEnd = null, pedCrossed = false;
      if (ped) {
        const [sx0, sz0] = S['localPos'](4.2, 2.0);
        const [tx0, tz0] = S['localPos'](-6.0, 2.0);
        ped.served = true; ped.x = sx0; ped.z = sz0;
        ped.path = [[tx0, tz0]]; ped.pi = 0; ped.speed = 2.6;
        for (let i = 0; i < 220; i++) {
          C.npcs.update(0.05); C.stall.update(0.05);
          const [plx, plz] = S['worldToLocal'](ped.x, ped.z);
          if (Math.abs(plx) < 3.2 && plz > -2.4 && plz < 3.7) pedCrossed = true;
          if (plx < -4.8) break;
        }
        pedEnd = S['worldToLocal'](ped.x, ped.z).map((v) => Number(v.toFixed(2)));
      }
      let h1Returned = false, h2Returned = false, trappedEscaped = false, trapCustSeated = false;
      // Kiểm tra cả 2 nhân viên đi vào rồi vòng qua trước chậu cây quay về đúng chỗ (±2.18, 4.36) mà không kẹt
      if (S.helper && S.helper2) {
        const [x1, z1] = S['localPos'](-0.7, 2.0), [x2, z2] = S['localPos'](0.7, 2.0);
        S.helper.x = x1; S.helper.z = z1;
        S.helper2.x = x2; S.helper2.z = z2;
        S['helperTask'][1].mode = 'return'; S['helperTask'][2].mode = 'return';
        S['staffMoveTo'](S.helper, S['staffReturnPath'](S.helper, 1), () => { S['helperTask'][1].mode = 'idle'; S.helper.pose = 'idle'; h1Returned = true; });
        S['staffMoveTo'](S.helper2, S['staffReturnPath'](S.helper2, 2), () => { S['helperTask'][2].mode = 'idle'; S.helper2.pose = 'idle'; h2Returned = true; });
        for (let i = 0; i < 160; i++) {
          C.npcs.update(0.05); C.stall.update(0.05);
          if (h1Returned && h2Returned) break;
        }
      }
      // Giả lập khách/người đi đường lỡ kẹt trong phòng ăn (-2.5, 2.0) muốn sang (-8.0, 2.0) -> tự tìm cửa ra ngoài!
      if (ped) {
        const [ix, iz] = S['localPos'](-2.5, 2.0), [ox, oz] = S['localPos'](-8.0, 2.0);
        ped.x = ix; ped.z = iz; ped.state = 'walk'; ped.pose = 'walk';
        ped.path = [[ox, oz]]; ped.pi = 0; ped.speed = 2.6;
        for (let i = 0; i < 240; i++) {
          C.npcs.update(0.05); C.stall.update(0.05);
          const [plx] = S['worldToLocal'](ped.x, ped.z);
          if (plx < -4.2) { trappedEscaped = true; break; }
        }
      }
      // Giả lập khách vào quán đứng kẹt sát tường hông trái (-3.8, 2.0) vẫn tự tìm đường vòng qua cửa để ngồi vào bàn
      const trapC = S.customers.find((c) => c.state === 'toStall') ?? S.send();
      if (trapC) {
        const [cx0, cz0] = S['localPos'](-3.8, 2.0);
        trapC.x = cx0; trapC.z = cz0; trapC.state = 'toStall';
        trapC.path = [S['localPos'](0, 2.0)]; trapC.pi = 0;
        for (let i = 0; i < 240; i++) {
          C.npcs.update(0.05); C.stall.update(0.05);
          if (trapC.state === 'queue' || trapC.state === 'gone') { trapCustSeated = true; break; }
        }
      }
      const h1End = S.helper ? S['worldToLocal'](S.helper.x, S.helper.z).map((v) => Number(v.toFixed(2))) : null;
      const h2End = S.helper2 ? S['worldToLocal'](S.helper2.x, S.helper2.z).map((v) => Number(v.toFixed(2))) : null;
      return { pedEnd, pedCrossed, h1Returned, h2Returned, trappedEscaped, trapCustSeated, h1End, h2End };
    },
    shot: 'counter_clean_closeup',
  },
];
