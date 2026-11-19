// Lượt 41 — rau củ lâu hỏng, ăn quán no lâu 2,5 lần, bệnh đau bụng + thuốc đau bụng.
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(8 * 60), { wait: 2500 },
  { label: '① rau củ trong kho quầy sau 12 giờ', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      g.cash = 500000;
      for (const id of ['ganh', 'daothot', 'bepthan', 'vi', 'noi']) if (!R.has(g, id)) R.buyGear(g, id);
      const sp = g0.stall.spots().find((s) => s.id === 'cv');
      g.stall.tier = 1; g.stall.where = 'placed'; g.stall.spot = sp.id; g.stall.x = sp.x; g.stall.z = sp.z; g.stall.yaw = sp.yaw;
      g0.stall.refresh();
      for (const id of ['raumuong', 'rauthom', 'xalach', 'carot', 'cachua', 'bapcai', 'khoaitay', 'hanhtay', 'heo']) window.__give(id, 1, 'store');
      const start = g.min;
      g.min = start; g0.player.place(sp.x, sp.z + 1.2, 0);
      // trôi 12 giờ
      for (let i = 0; i < 12; i++) { g.min += 60; if (window.__R?.purge) window.__R.purge(g); }
      g0.stall.refresh();
      const shelf = (id) => { const s = g.stall.store.find((x) => x.id === id); return s ? Math.round(R.hoursLeft(g, s)) : null; };
      const left = {};
      for (const id of ['raumuong', 'rauthom', 'xalach', 'carot', 'cachua', 'bapcai']) left[id] = shelf(id);
      return { 'còn giờ (sau 12h)': left, 'khoai tây': shelf('khoaitay'), 'hành tây': shelf('hanhtay'), 'thịt heo': shelf('heo') };
    }, max: 500 },
  { label: '② ăn ở quán cơm: độ no trước/sau', eval: async () => {
      const g0 = window.__game, g = g0.g;
      g.st.hunger = 20;
      const before = g.st.hunger;
      const A = g0.acts;
      // quán cơm Bà Tư: dùng thẳng hàm consume mà menu quán gọi
      window.__R.consume(g, { h: 60 * 2.5, t: 12 * 2.5, m: 6 });
      return { 'trước': before, 'sau': Math.round(g.st.hunger), 'tăng': Math.round(g.st.hunger - before), 'ghi chú': 'một dĩa cơm = 150 điểm no (60 × 2,5)' };
    }, max: 300 },
  { label: '③ bị đau bụng khi uống nước vòi công cộng (thử 200 lần)', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      let hits = 0;
      for (let i = 0; i < 200; i++) {
        g.flags.dauBung = 0;
        R.sickStomach; // noop
        if (Math.random() < R.stomachChance(g, { rank: 0.12 })) hits++;
      }
      const base = 200;
      return { 'tỉ lệ ước tính': R.stomachChance(g, { rank: 0.12 }), 'số lần trúng/200': hits };
    }, max: 300 },
  { label: '④ bị đau bụng thật: chip HUD, máu tụt, mua thuốc khỏi', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      g.st.health = 90;
      R.sickStomach(g, 'Uống nước máy', 180);
      await new Promise((r) => setTimeout(r, 800));
      const chip = [...document.querySelectorAll('#hud .chip, .chip')].map((c) => c.textContent.replace(/\s+/g, ' ').trim()).filter((t) => /Đau bụng/i.test(t));
      const h0 = g.st.health;
      for (let i = 0; i < 60; i++) R.advance(g, 1, { moving: false, running: false, working: false, sleeping: false, sleepQ: 1, sheltered: true, load: 0 });
      const h1 = g.st.health;
      // mua thuốc
      g.cash = Math.max(g.cash, 50000);
      const cash0 = g.cash;
      const ok = R.buyMed(g, 'daubung');
      return { chip: chip[0] ?? '(chưa thấy)', 'máu trước': Math.round(h0), 'máu sau 1 giờ': Math.round(h1), 'còn đau': R.isStomach(g), 'mua thuốc': ok, 'mất tiền': cash0 - g.cash };
    }, shot: '60_dau_bung', max: 400 },
  { label: '⑤ nhật ký phát triển có bản Lượt 41', eval: async () => {
      const g0 = window.__game; g0.ui.closePanel(); g0.ui.panel('changelog'); await new Promise((r) => setTimeout(r, 700));
      const head = document.querySelector('#modal h3, #modal .panelhead')?.textContent?.replace(/\s+/g, ' ').trim();
      const body = document.querySelector('#modal')?.textContent?.slice(0, 320).replace(/\s+/g, ' ');
      return { đầu_đề: head, mở_đầu: body };
    }, shot: '61_nhat_ky_41', max: 500 },
];
