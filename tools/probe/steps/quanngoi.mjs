// Lượt 16 — bậc 5 "Quán có chỗ ngồi": sáu ghế bàn gỗ trong nhà, thực đơn theo buổi, khách ăn xong gọi thêm.
// Chạy: cd tools/probe && OUT=/tmp/probe/quanngoi node play.mjs steps/quanngoi.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(11 * 60),
  { label: '① dữ liệu bậc 5 và số ghế' },
  { eval: () => {
    const g0 = window.__game, G = g0.g, R = window.__R;
    const rows = [4, 5].map((t) => { G.stall.tier = t; return { t, ghe: R.seatCount(G), anTaiCho: R.dineIn(G), ten: R.tier(G).name, cap: R.tier(G).cap, menu: R.tier(G).menu, queue: R.tier(G).queue }; });
    G.stall.tier = 0;
    return { bac: rows, buoi: R.periodName(G) };
  }, wait: 300 },

  { label: '② mua quán có chỗ ngồi ở tiệm Ba Tài' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g;
    G.cash = 160000000; G.gear = {}; G.stall.tier = 0; G.stall.where = 'carried';
    const out = [];
    for (const id of ['sap', 'quanan', 'quanngoi']) {
      g0.acts.buyGear(id); await new Promise((r) => setTimeout(r, 250));
      const btns = [...document.querySelectorAll('#dlg .btn')];
      const mua = btns.find((b) => b.textContent.includes('Mua —'));
      const moTa = btns[0] ? btns[0].textContent.replace(/\s+/g, ' ').trim() : null;
      if (mua && !mua.classList.contains('off')) mua.click();
      g0.ui.closeDialog(); await new Promise((r) => setTimeout(r, 200));
      out.push({ id, moTa: moTa?.slice(0, 90), tier: G.stall.tier });
    }
    return { mua: out, cash: G.cash, tier: G.stall.tier };
  }, wait: 1200 },

  { label: '③ dựng quán ở Mặt bằng Khu Căn Hộ, xem sáu ghế bàn gỗ' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, S = g0.stall;
    const sp = S.spots().find((s) => s.id === 'matbang_dc');
    const truoc = G.cash, ok = S.placeAt(sp);
    await new Promise((r) => setTimeout(r, 400));
    const me = { x: sp.x + 0.4, z: sp.z + 10.5 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(sp.x - me.x, sp.z - me.z), -0.03);
    await new Promise((r) => setTimeout(r, 1600));
    return { datDuoc: ok, phi: truoc - G.cash, spot: G.stall.spot, ghe: window.__R.seatCount(G), x: +sp.x.toFixed(1), z: +sp.z.toFixed(1) };
  }, wait: 2000 },
  { shot: OUT + 'quan_dung' },

  { label: '④ mở bán, sáu khách ngồi vô sáu ghế' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, st = G.stall, S = g0.stall;
    G.cash = Math.max(G.cash, 8000000);
    for (const id of ['daothot', 'bepthan', 'vi', 'noi', 'chao']) window.__R.buyGear(G, id);
    // bày sẵn vài phần ăn để khách có cái gọi (khỏi phải nấu trong lúc chạy thử)
    for (const id of ['banh_mi_trung', 'com_suon', 'che_dau_xanh', 'tra_da', 'bap_nuong']) {
      G.rec[id].known = true; G.rec[id].on = true;
      st.ready.push({ rid: id, n: 8, q: 0.92, cost: 3000, at: G.day * 1440 + G.min });
    }
    st.open = true; st.dirt = 0;
    for (let i = 0; i < 6; i++) S.send();
    await new Promise((r) => setTimeout(r, 250));
    for (const c of S.customers.slice()) { const [x, z] = S.slotPos(c.slot, 12); c.x = x; c.z = z; S.arrived(c); }
    const t0 = performance.now();
    while (performance.now() - t0 < 5200) { S.update(0.12); await new Promise((r) => setTimeout(r, 40)); }
    const cs = S.customers.map((c) => ({ ten: c.name, slot: c.slot, ngoi: S.seated(c.slot), mon: c.order?.rid, pose: c.pose }));
    return { soKhach: cs.length, khach: cs, ghe0: S.seatPos(0).map((v) => +v.toFixed(2)), ghe5: S.seatPos(5).map((v) => +v.toFixed(2)) };
  }, wait: 900 },
  { eval: async () => {
    const g0 = window.__game, st = g0.g.stall;
    const me = { x: st.x + 5.4, z: st.z + 8.6 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(st.x - me.x, st.z - me.z), -0.02);
    await new Promise((r) => setTimeout(r, 1500));
    window.__cam(me.x, 1.72, me.z, st.x - 0.2, 1.12, st.z + 2.6);
    return 'ok';
  }, wait: 1700 },
  { shot: OUT + 'sau_ghe' },

  { label: '⑤ giao món cho bốn khách, chờ xem ai gọi thêm' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, S = g0.stall, st = G.stall;
    const ds = S.customers.filter((x) => x.order).slice(0, 4);
    const truoc = G.cash, out = [];
    for (const c of ds) {
      st.ready.push({ rid: c.order.rid, n: c.order.n, q: 0.92, cost: 3000, at: 0 });
      S.serve(c);
      await new Promise((r) => setTimeout(r, 500));
      out.push({ ten: c.name, mon: c.order?.rid, conKhach: S.customers.includes(c) });
    }
    const t0 = performance.now();
    while (performance.now() - t0 < 7000) { S.update(0.12); await new Promise((r) => setTimeout(r, 50)); }
    return { truoc, cash: G.cash, daGiao: out, sau: ds.map((c) => ({ ten: c.name, mon: c.order?.rid, goiThem: !!c.order?.more })), goiThem: ds.filter((c) => c.order?.more).length, uyTin: Math.round(G.rep) };
  }, wait: 3000 },
  { eval: async () => {
    const g0 = window.__game, st = g0.g.stall;
    g0.ui.closeDialog();
    const me = { x: st.x - 2.8, z: st.z + 8.4 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(st.x - me.x, st.z - me.z), -0.02);
    await new Promise((r) => setTimeout(r, 1200));
    window.__cam(me.x, 1.8, me.z, st.x + 0.4, 1.02, st.z + 2.5);
    return 'ok';
  }, wait: 1600 },
  { shot: OUT + 'goi_them' },

  { label: '⑥ bảng quầy: chỗ ngồi, buổi bán, món hợp buổi' },
  { eval: async () => {
    const g0 = window.__game;
    g0.ui.panel('stall'); await new Promise((r) => setTimeout(r, 400));
    const root = document.querySelector('#modal');
    [...root.querySelectorAll('[data-tab]')].find((b) => b.dataset.tab === 'info')?.click();
    await new Promise((r) => setTimeout(r, 350));
    const info = [...root.querySelectorAll('.kv')].map((k) => k.textContent.replace(/\s+/g, ' ').trim());
    const menuTab = [...root.querySelectorAll('[data-tab]')].find((b) => b.dataset.tab === 'menu');
    menuTab?.click(); await new Promise((r) => setTimeout(r, 500));
    const rows = [...root.querySelectorAll('.item')].slice(0, 4).map((el) => el.textContent.replace(/\s+/g, ' ').trim().slice(0, 110));
    const tags = [...root.querySelectorAll('.tag')].slice(0, 6).map((el) => el.textContent.replace(/\s+/g, ' ').trim());
    return { kv: info, monDau: rows, tag: tags };
  }, wait: 900 },
  { shot: OUT + 'bang_quay' },

  { label: '⑦ đóng quán, khách đứng dậy; bản lưu giữ bậc 5' },
  { eval: () => {
    const g0 = window.__game, G = g0.g;
    g0.ui.closePanel(); g0.stall.close();
    const raw = JSON.parse(JSON.stringify(G)), back = window.__S.migrate(raw);
    return { tierTruoc: G.stall.tier, tier: back.stall.tier, v: back.v, ghe: window.__R.seatCount(back) };
  }, wait: 500 },
];
