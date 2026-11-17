// Bậc 6 — NHÀ HÀNG BÌNH DÂN: nội thất trong nhà kín (4 bàn 8 ghế, phòng bếp riêng),
// đặt bàn trước, nhân viên phụ bếp, khách đoàn.
// Chạy: cd tools/probe && OUT=/tmp/probe/nhahang node play.mjs steps/nhahang.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = '';
export default [boot, fresh(11 * 60),
  { label: '① kiểm tra dữ liệu bậc 6 & mua Nhà hàng bình dân' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, R = window.__R;
    G.cash = 260000000;
    for (const id of ['sap', 'quanan', 'quanngoi', 'nhahang']) {
      g0.acts.buyGear(id); await new Promise((r) => setTimeout(r, 200));
      const btns = [...document.querySelectorAll('#dlg .btn')];
      const mua = btns.find((b) => b.textContent.includes('Mua —'));
      if (mua && !mua.classList.contains('off')) mua.click();
      g0.ui.closeDialog(); await new Promise((r) => setTimeout(r, 150));
    }
    return { tier: G.stall.tier, name: R.tier(G).name, seats: R.seatCount(G), isRest: R.isRestaurant(G) };
  }, wait: 600 },

  { label: '② mở Nhà hàng bình dân ở Mặt bằng Phố Văn Phòng, chụp mặt tiền' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, S = g0.stall;
    const sp = S.spots().find((s) => s.id === 'matbang_tb');
    const ok = S.placeAt(sp);
    for (const id of ['daothot', 'bepgas', 'vi', 'noi', 'chao', 'thungda', 'bien', 'den']) window.__R.buyGear(G, id);
    G.stall.store.push({ id: 'gas', n: 4, fresh: 99999, q: 1, cost: 28000 });
    for (const id of ['banh_mi_trung', 'com_suon', 'pho_bo', 'tra_da']) {
      G.rec[id].known = true; G.rec[id].on = true;
      G.rec[id].price = Math.min(G.rec[id].price, 15000);
      G.stall.ready.push({ rid: id, n: 10, q: 0.92, cost: 4000, at: G.day * 1440 + G.min });
    }
    S.refresh();
    await new Promise((r) => setTimeout(r, 400));
    const c = Math.cos(sp.yaw), sn = Math.sin(sp.yaw);
    const camX = sp.x + 0.5 * c + 10.5 * sn, camZ = sp.z - 0.5 * sn + 10.5 * c;
    g0.player.place(camX, camZ, Math.atan2(sp.x - camX, sp.z - camZ), -0.02);
    await new Promise((r) => setTimeout(r, 800));
    window.__cam(camX, 2.2, camZ, sp.x, 1.35, sp.z + 1.4);
    return { ok, spot: G.stall.spot, tier: G.stall.tier };
  }, wait: 1000 },
  { shot: OUT + 'nhahang_front' },

  { label: '③ thuê phụ bếp, nhận đặt bàn, mở cửa & đón khách đoàn' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, S = g0.stall, R = window.__R;
    G.cash = 10000000;
    R.hireSous(G);
    const b = R.createBooking(G);
    if (b) R.acceptBooking(G, b.id);
    G.stall.open = true;
    const grpOk = S.sendGroup(4);
    await new Promise((r) => setTimeout(r, 250));
    for (const c of S.customers.slice()) {
      const [x, z] = S.slotPos(c.slot, 16);
      c.x = x; c.z = z;
      if (c.data?.isCompanion) S.arrivedCompanion(c);
      else S.arrived(c);
    }
    const t0 = performance.now();
    while (performance.now() - t0 < 2200) { S.update(0.12); await new Promise((r) => setTimeout(r, 40)); }
    const sp = S.spot();
    const c = Math.cos(sp.yaw), sn = Math.sin(sp.yaw);
    const camX = sp.x + 0.2 * c + 5.2 * sn, camZ = sp.z - 0.2 * sn + 5.2 * c;
    const lookX = sp.x + 0.0 * c - 0.8 * sn, lookZ = sp.z - 0.0 * sn - 0.8 * c;
    window.__cam(camX, 1.95, camZ, lookX, 1.05, lookZ);
    return {
      sous: G.sous?.name, sousNpc: !!S.sous,
      bookings: G.bookings.length,
      grpOk, customers: S.customers.length,
      leaderOrder: S.customers.find((x) => x.order)?.order,
    };
  }, wait: 1000 },
  { shot: OUT + 'nhahang_inside' },

  { label: '④ mở bảng Quầy -> Nhân sự & Đặt bàn' },
  { eval: async () => {
    const g0 = window.__game;
    g0.ui.panel('stall');
    await new Promise((r) => setTimeout(r, 200));
    const tabBtn = [...document.querySelectorAll('#modal .tab')].find((t) => t.dataset.tab === 'staff');
    if (tabBtn) tabBtn.click();
    await new Promise((r) => setTimeout(r, 200));
    return {
      tabs: [...document.querySelectorAll('#modal .tab')].map((t) => t.textContent),
      hasSous: document.querySelector('#modal .body')?.textContent?.includes(g0.g.sous?.name ?? '—'),
      hasBooking: document.querySelector('#modal .body')?.textContent?.includes('Đặt bàn trước'),
    };
  }, wait: 400 },
  { shot: OUT + 'nhahang_panel' },
];
