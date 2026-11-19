// Người chơi báo "bánh mì & sữa bỏ vào quầy rồi biến mất". Kiểm bằng giao diện thật:
// ① mua bánh mì + sữa, bỏ vào quầy bằng nút thật → bảng Kho quầy phải hiện cả hai;
// ② cho trôi qua 1 ngày → danh sách món hỏng được BÁO TÊN, và app điện thoại cũng báo "sắp hỏng" + có dòng kho.
import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(10 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },

  { label: '① chuẩn bị quầy gánh + mua bánh mì & sữa bằng acts.take' },
  { eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      g.cash = 500000;
      for (const id of ['ganh', 'daothot', 'bepthan', 'vi', 'noi']) if (!R.has(g, id)) R.buyGear(g, id);
      const sp = g0.stall.spots().find((s) => s.id === 'cv');
      g.stall.tier = 1; g.stall.where = 'placed'; g.stall.spot = sp.id; g.stall.x = sp.x; g.stall.z = sp.z; g.stall.yaw = sp.yaw;
      g.min = 10 * 60; g0.stall.refresh();
      await new Promise((r) => setTimeout(r, 300));
      const A = window.__acts;
      // trả tiền xong thì giỏ hàng tự trống → mỗi lần mua phải trả tiền riêng (như ngoài đời)
      for (const [shop, idx] of [['bakery', 0], ['bakery', 0], ['mart', 14]]) { A.take({ shop, idx, x: 0, y: 0, z: 0 }); A.pay(); }
      await new Promise((r) => setTimeout(r, 250));
      return { store: g.stall.store.map((s) => s.id + '×' + s.n), bag: g.bag.map((s) => s.id + '×' + s.n) };
    }, wait: 600 },

  { label: '② bỏ bánh mì từ túi sang quầy bằng nút "› Quầy" trong bảng Kho quầy' },
  { eval: async () => {
      const g0 = window.__game, g = g0.g;
      g0.ui.panel('stall');
      await new Promise((r) => setTimeout(r, 350));
      [...document.querySelectorAll('#modal .tab')].find((b) => /Kho quầy/.test(b.textContent))?.click();
      await new Promise((r) => setTimeout(r, 350));
      // cột phải "Trong túi": bấm nút "› Quầy" ở dòng Bánh mì
      const rows = [...document.querySelectorAll('#modal .item')];
      const banh = rows.find((e) => /Bánh mì/.test(e.textContent || '') && /› Quầy/.test(e.textContent || ''));
      banh?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 400));
      const after = [...document.querySelectorAll('#modal .item')].map((e) => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 50));
      return { bấmĐược: !!banh, sauKhiBỏ: after, store: g.stall.store.map((s) => s.id + '×' + s.n) };
    }, wait: 700 },
  { shot: 'vanish-01-kho-quay.png' },

  { label: '③ để trôi qua 1 ngày: món hỏng phải được báo tên' },
  { eval: async () => {
      const g0 = window.__game, g = g0.g;
      g0.ui.closePanel();
      const bắt = [];
      const off = window.__bus.on('toast', (t) => bắt.push(t.text));
      // thêm một món rất mau hỏng để thấy rõ lời báo tên món lúc khoá sổ ngày
      window.__give('tom', 1, 'store');
      for (let i = 0; i < 26; i++) { await new Promise((r) => setTimeout(r, 40)); window.__R.advance(g, 60, window.__acts.act()); }
      off();
      return { ngày: g.day, báoHỏng: bắt.filter((t) => /Đồ hỏng phải bỏ|thiệt hại/i.test(t)),
        bánhMìCònLại: g.stall.store.filter((s) => s.id === 'banhmi').map((s) => `×${s.n} @${Math.round(s.fresh)}%`),
        store: g.stall.store.map((s) => s.id + '×' + s.n) };
    }, wait: 900 },

  { label: '④ app điện thoại: dòng kho nguyên liệu + cảnh báo sắp hỏng' },
  { eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      g.cash = Math.max(g.cash, 300000);
      window.__give('banhmi', 4, 'store');
      for (const st of g.stall.store) if (st.id === 'banhmi') st.fresh = 20;
      const row = R.shopRows(g)[0];
      g.phone = { id: 'camung', battery: 72 }; g.gear.camung = 100;
      g0.ui.closePanel(); g0.ui.panel('phone');
      await new Promise((r) => setTimeout(r, 450));
      [...document.querySelectorAll('.pgrid .cell')].find((c) => /Cửa hàng/.test(c.textContent))?.click();
      await new Promise((r) => setTimeout(r, 500));
      const text = document.querySelector('#modal')?.textContent?.replace(/\s+/g, ' ') ?? '';
      return { row: { storeKinds: row.storeKinds, storeKg: row.storeKg, spoil: row.spoilNames },
        appCóKho: /Kho nguyên liệu/.test(text), appCóCảnhBáo: /sắp hỏng/.test(text), trích: text.slice(text.indexOf('Quầy chính'), text.indexOf('Quầy chính') + 260) };
    }, wait: 900 },
  { shot: 'vanish-02-app-dien-thoai.png' },
];
