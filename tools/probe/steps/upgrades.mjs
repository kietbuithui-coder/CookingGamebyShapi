// Kiểm tra toàn bộ 13 nâng cấp tiện lợi/công nghiệp + đa nhân sự (2 phụ bếp + 2 phục vụ) trong Nhà hàng bình dân.
import { boot, fresh } from '../lib.mjs';

export default [
  boot,
  fresh(12 * 60),
  { label: '① nâng cấp Nhà hàng bình dân + 13 tiện nghi + 4 nhân viên' },
  {
    eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R, S = g0.stall;
      g.cash = 350000000;
      for (const id of [
        'sap', 'quanan', 'quanngoi', 'nhahang',
        'daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas', 'thungda', 'bien', 'den',
        'loa', 'hopmangve', 'binh_tra', 'mayep', 'tu_kinh', 'may_quat',
        'wifi_nhac', 'may_tinh_tien', 'tu_dong', 'bep_cn', 'wc_lavabo', 'hut_mui', 'dieu_hoa',
      ]) {
        const res = R.buyGear(g, id);
        if (res !== 'ok') throw new Error(`buyGear(${id}) => ${res}`);
      }
      const sp = S.spots().find((s) => s.id === 'matbang_tb');
      S.placeAt(sp);
      g0.player.x = sp.x;
      g0.player.z = sp.z + 1.5;
      g.stall.store.push(
        { id: 'gas', n: 4, fresh: 99999, q: 1, cost: 28000 },
        { id: 'tra', n: 20, fresh: 99999, q: 1, cost: 2000 },
        { id: 'da', n: 20, fresh: 99999, q: 1, cost: 1000 },
        { id: 'banhmi', n: 12, fresh: 99999, q: 1, cost: 3000 },
        { id: 'trung', n: 12, fresh: 99999, q: 1, cost: 3500 },
      );
      g.stall.ready.push({ rid: 'tra_da', n: 10, q: 0.9, cost: 3000, at: g.min });
      for (const rid of ['pho_bo', 'com_suon', 'banh_mi_trung', 'tra_da']) {
        g.rec[rid].known = true;
        g.rec[rid].on = true;
      }
      R.hireSous(g);
      R.hireSous(g);
      R.hireHelper(g);
      R.hireHelper(g);
      const opened = S.open();
      for (let i = 0; i < 12; i++) S.update(0.15);
      const c = Math.cos(sp.yaw), sn = Math.sin(sp.yaw);
      window.__cam(
        sp.x + 0.2 * c + 7.2 * sn, 2.35, sp.z - 0.2 * sn + 7.2 * c,
        sp.x + 0.0 * c - 0.5 * sn, 1.2, sp.z - 0.0 * sn - 0.5 * c,
      );
      return {
        opened,
        sousCount: R.sousCount(g),
        helperCount: R.helperCount(g),
        cap: R.stallCap(g),
        queueCap: R.stallQueueCap(g),
        trayCap: R.stallTrayCap(g),
        helper1: g.help?.name,
        helper2: g.help2?.name,
        sous1: g.sous?.name,
        sous2: g.sous2?.name,
      };
    },
    wait: 700,
    shot: 'upgrades_front',
  },
  { label: '② vào trong nhà hàng xem thiết bị 3D & 4 nhân viên' },
  {
    eval: async () => {
      const g0 = window.__game, S = g0.stall, sp = S.spot();
      for (let i = 0; i < 15; i++) { S.update(0.15); await new Promise((r) => setTimeout(r, 30)); }
      const c = Math.cos(sp.yaw), sn = Math.sin(sp.yaw);
      window.__cam(
        sp.x + 0.1 * c + 4.8 * sn, 2.0, sp.z - 0.1 * sn + 4.8 * c,
        sp.x - 0.4 * c - 1.4 * sn, 1.05, sp.z + 0.4 * sn - 1.4 * c,
      );
      return {
        hasHelper: !!S.helper,
        hasHelper2: !!S.helper2,
        hasSous: !!S.sous,
        hasSous2: !!S.sous2,
      };
    },
    wait: 600,
    shot: 'upgrades_inside',
  },
  { label: '③ mở bảng Nhân sự & Đặt bàn + Thông tin quầy' },
  {
    eval: async () => {
      const g0 = window.__game;
      g0.ui.panel('stall');
      await new Promise((r) => setTimeout(r, 200));
      const tabBtn = [...document.querySelectorAll('#modal .tab')].find((t) => t.dataset.tab === 'staff');
      if (tabBtn) tabBtn.click();
      await new Promise((r) => setTimeout(r, 200));
      const staffText = document.querySelector('#modal .body')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 420);
      return { staffText };
    },
    wait: 350,
    shot: 'upgrades_staff_panel',
  },
  {
    eval: async () => {
      const tabBtn = [...document.querySelectorAll('#modal .tab')].find((t) => t.dataset.tab === 'info');
      if (tabBtn) tabBtn.click();
      await new Promise((r) => setTimeout(r, 200));
      return { infoText: document.querySelector('#modal .body')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 450) };
    },
    wait: 300,
    shot: 'upgrades_info_panel',
  },
];
