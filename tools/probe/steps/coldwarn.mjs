// Kiểm cảnh báo "đồ cần lạnh để ở quầy": bảng Kho quầy trên PC + app Quản lý cửa hàng trên điện thoại.
import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(10 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },
  { eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      g.cash = 500000;
      for (const id of ['ganh', 'daothot', 'bepthan', 'vi', 'noi']) if (!R.has(g, id)) R.buyGear(g, id);
      const sp = g0.stall.spots().find((s) => s.id === 'cv');
      g.stall.tier = 1; g.stall.where = 'placed'; g.stall.spot = sp.id; g.stall.x = sp.x; g.stall.z = sp.z; g.stall.yaw = sp.yaw;
      g.min = 10 * 60; delete g.gear.tu_dong; delete g.gear.thungda; g0.stall.refresh();
      window.__give('suatuoi', 2, 'store');
      window.__give('banhmi', 2, 'store');
      await new Promise((r) => setTimeout(r, 300));
      g0.player.place(sp.x, sp.z + 1.2, 0);
      g0.ui.panel('stall');
      await new Promise((r) => setTimeout(r, 350));
      [...document.querySelectorAll('#modal .tab')].find((b) => /Kho quầy/.test(b.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      const text = document.querySelector('#modal .body')?.textContent?.replace(/\s+/g, ' ') ?? '';
      const i = text.indexOf('cần lạnh mà quầy');
      return { cóCảnhBáoLạnh: i >= 0, trích: i >= 0 ? text.slice(Math.max(0, i - 40), i + 130) : text.slice(0, 200),
        row: R.shopRows(g)[0].coldNames };
    }, wait: 800 },
  { shot: 'cold-01-kho-quay.png' },
  { eval: async () => {
      const g0 = window.__game, g = g0.g;
      g.phone = { id: 'camung', battery: 72 }; g.gear.camung = 100;
      g0.ui.closePanel(); g0.ui.panel('phone');
      await new Promise((r) => setTimeout(r, 450));
      [...document.querySelectorAll('.pgrid .cell')].find((c) => /Cửa hàng/.test(c.textContent))?.click();
      await new Promise((r) => setTimeout(r, 500));
      const t = document.querySelector('#modal .body')?.textContent?.replace(/\s+/g, ' ') ?? '';
      return { appCóLạnh: /không có tủ đá/.test(t), appCóKho: /Kho nguyên liệu/.test(t),
        trích: t.slice(Math.max(0, t.indexOf('Kho nguyên liệu') - 20), t.indexOf('Kho nguyên liệu') + 200) };
    }, wait: 800 },
  { shot: 'cold-02-app.png' },
];
