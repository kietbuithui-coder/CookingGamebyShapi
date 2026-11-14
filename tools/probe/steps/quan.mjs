// Lượt 13 — bậc 4 "Quán ăn nhỏ": mua, dựng ở mặt bằng có sân, khách ngồi ăn tại chỗ.
// Chạy: cd tools/probe && OUT=/tmp/probe/quan node play.mjs steps/quan.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(11 * 60),
  { label: '① dữ liệu bậc 4: giá, sức chứa, hai mặt bằng' },
  { eval: () => {
    const g0 = window.__game, lots = g0.world.lots;
    return {
      spots: g0.stall.spots().map((s) => `${s.id} · ${s.name} · phí ${s.fee} ·  từ bậc ${s.minTier}`),
      soLo: lots.length,
      loHen: lots.filter((l) => l.w < 3).map((l) => `${l.bx}${l.bz}${l.face}@${l.at.toFixed(0)} = ${l.w.toFixed(1)}m`),
      soLoMatBang: lots.filter((l) => (l.id || '').startsWith('matbang')).map((l) => `${l.id} ${l.w}m`),
    };
  }, wait: 200 },
  { label: '② mua sạp rồi mua quán ăn nhỏ ở tiệm Ba Tài' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    g.cash = 60000000; g.gear = {}; g.stall.tier = 0; g.stall.where = 'carried';
    const out = [];
    for (const id of ['sap', 'quanan']) {
      g0.acts.buyGear(id);
      await new Promise((r) => setTimeout(r, 250));
      const btns = [...document.querySelectorAll('#dlg .btn')];
      const mua = btns.find((b) => b.textContent.includes('Mua —'));
      const sub = btns[0] ? btns[0].textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : null;
      if (mua && !mua.classList.contains('off')) mua.click();
      out.push({ id, coNutMua: !!mua, moTa: sub });
      g0.ui.closeDialog();
      await new Promise((r) => setTimeout(r, 250));
    }
    return { mua: out, tier: g.stall.tier, where: g.stall.where, cash: g.cash };
  }, wait: 900 },

  { label: '③ chặn: quán ăn nhỏ không dựng được ở vỉa hè hẹp (Cổng Chợ)' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    const sp = g0.stall.spots().find((s) => s.id === 'cho');
    if (!sp) return { loi: 'thiếu spot cho' };
    const ok = g0.stall.placeAt(sp);
    return { datDuoc: ok, where: g.stall.where, tier: g.stall.tier };
  }, wait: 400 },

  { label: '④ dựng quán ở Mặt bằng Khu Căn Hộ' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    const sp = g0.stall.spots().find((s) => s.id === 'matbang_dc');
    if (!sp) return { loi: 'thiếu mặt bằng' };
    const truoc = g.cash, ok = g0.stall.placeAt(sp);
    await new Promise((r) => setTimeout(r, 300));
    const me = { x: sp.x + 6.5, z: sp.z + 9.5 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(sp.x - me.x, sp.z - me.z), -0.04);
    await new Promise((r) => setTimeout(r, 2400));
    window.__cam(me.x, 2.5, me.z, sp.x, 1.0, sp.z + 1.2);
    return { datDuoc: ok, phi: truoc - g.cash, spot: g.stall.spot, x: +sp.x.toFixed(1), z: +sp.z.toFixed(1) };
  }, wait: 1700 },
  { shot: OUT + 'quan_dung' },

  { label: '⑤ mở bán, khách tới ngồi bốn ghế trong sân' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, st = G.stall, S = g0.stall;
    G.cash = Math.max(G.cash, 6000000);
    for (const id of ['daothot', 'bepthan', 'vi', 'noi']) window.__R.buyGear(G, id);
    for (const id of ['banh_trang_tron', 'khoai_nuong', 'tra_da']) { G.rec[id].known = true; G.rec[id].on = true; }
    for (const [id, n] of [['banhtrang', 10], ['dauphong', 8], ['rauthom', 8], ['tuongot', 8], ['chanh', 8], ['khoailang', 10], ['tra', 8], ['da', 12], ['muoi', 6], ['dauan', 6]]) window.__give(id, n, 'store');
    st.open = true; st.dirt = 0;
    for (let i = 0; i < 4; i++) S.send();
    await new Promise((r) => setTimeout(r, 250));
    // tua nhanh: đưa khách tới đúng chỗ rồi cho họ "tới nơi" luôn
    for (const c of S.customers.slice()) { const [x, z] = S.slotPos(c.slot, 9); c.x = x; c.z = z; S.arrived(c); }
    const t0 = performance.now();
    while (performance.now() - t0 < 5200) { S.update(0.12); await new Promise((r) => setTimeout(r, 40)); }
    const cs = S.customers.map((c) => ({ ten: c.name, slot: c.slot, pose: c.pose, state: c.state, ngoi: S.seated(c.slot) }));
    const seat = S.seatPos(0), slot0 = S.slotPos(0, 9), slot5 = S.slotPos(5, 9);
    return { soKhach: cs.length, khach: cs, slot0TrungGhe: Math.hypot(slot0[0] - seat[0], slot0[1] - seat[1]) < 0.01, slot5: slot5.map((v) => +v.toFixed(2)), mo: st.open };
  }, wait: 900 },
  { eval: async () => {
    const g0 = window.__game, st = g0.g.stall;
    const me = { x: st.x + 1.2, z: st.z + 10.5 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(st.x - me.x, st.z - me.z), -0.02);
    await new Promise((r) => setTimeout(r, 450));
    window.__cam(me.x, 2.35, me.z, st.x, 0.9, st.z + 1.9);
    return 'ok';
  }, wait: 1500 },
  { shot: OUT + 'khach_ngoi' },

  { label: '⑥ giao món cho khách ngồi: tiền vào, khách cảm ơn' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, S = g0.stall, st = G.stall;
    const c = S.customers[0]; if (!c) return { loi: 'không có khách' };
    st.ready.push({ rid: c.order.rid, n: c.order.n, q: 0.9, cost: 3000, at: 0 });
    const truoc = G.cash;
    S.serve(c);
    await new Promise((r) => setTimeout(r, 700));
    return { cashTruoc: truoc, cashSau: G.cash, uyTin: Math.round(G.rep), conKhach: S.customers.length };
  }, wait: 800 },
  { shot: OUT + 'giao_mon' },

  { label: '⑥b ảnh tổng thể quán: bốn chỗ ngồi, khách đang ăn' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, S = g0.stall, st = G.stall;
    g0.ui.closeDialog();
    for (const c of S.customers) g0.ui.unorder(c);
    const me = { x: st.x + 2.2, z: st.z + 9.0 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(st.x - me.x, st.z - me.z), -0.02);
    await new Promise((r) => setTimeout(r, 3000));
    for (const c of S.customers) g0.ui.unorder(c);
    g0.ui.hideToasts?.();
    window.__cam(me.x, 2.15, me.z, st.x, 0.95, st.z + 1.9);
    return { khach: S.customers.length };
  }, wait: 3400 },
  { shot: OUT + 'quan_hero' },

  { label: '⑦ đóng rồi mở lại quán: phí mặt bằng thu đúng một lần mỗi ngày' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, S = g0.stall, st = G.stall;
    const sp = S.spots().find((x) => x.id === st.spot) || { fee: 0 };
    st.open = false; st.paidDay = G.day - 1;
    const truoc = G.cash, ok = S.open();
    await new Promise((r) => setTimeout(r, 300));
    const rent = window.__R.stallRent(G);
    return { moDuoc: ok, phiMatBang: sp.fee, tienThueNgay: rent, khopPhi: rent === sp.fee, paidDay: st.paidDay, tier: st.tier, soMonMenu: window.__R.menuOf(G).length };
  }, wait: 600 },
  { shot: OUT + 'quan_mo' },
];
