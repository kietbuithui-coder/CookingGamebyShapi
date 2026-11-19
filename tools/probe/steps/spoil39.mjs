// Lượt 39 — bánh phở, bún, đồ nguội để được 2 ngày; thịt tươi vẫn hỏng trong ngày.
// Kiểm bằng bảng Kho quầy thật trên giao diện.
import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(8 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },
  { label: '① bỏ 6 món đồ nguội + thịt heo vào quầy, đọc độ tươi ban đầu', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      g.cash = 500000;
      for (const id of ['ganh', 'daothot', 'bepthan', 'vi', 'noi']) if (!R.has(g, id)) R.buyGear(g, id);
      const sp = g0.stall.spots().find((s) => s.id === 'cv');
      g.stall.tier = 1; g.stall.where = 'placed'; g.stall.spot = sp.id; g.stall.x = sp.x; g.stall.z = sp.z; g.stall.yaw = sp.yaw;
      g.min = 8 * 60; g0.stall.refresh();
      for (const id of ['banhpho', 'bun', 'xucxich', 'gio', 'chaca', 'dauhu', 'heo']) window.__give(id, 1, 'store');
      g0.player.place(sp.x, sp.z + 1.2, 0);
      await new Promise((r) => setTimeout(r, 300));
      g0.ui.panel('stall'); await new Promise((r) => setTimeout(r, 350));
      [...document.querySelectorAll('#modal .tab')].find((b) => /Kho quầy/.test(b.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      return { hanDung: { banhpho: R.hoursLeft(g, g.stall.store.find((s) => s.id === 'banhpho')),
        bun: R.hoursLeft(g, g.stall.store.find((s) => s.id === 'bun')),
        xucxich: R.hoursLeft(g, g.stall.store.find((s) => s.id === 'xucxich')),
        heo: R.hoursLeft(g, g.stall.store.find((s) => s.id === 'heo')) },
        rows: [...document.querySelectorAll('#modal .item')].map((e) => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 34)) };
    }, wait: 800 },
  { shot: 'spoil39-01-truoc.png' },
  { label: '② cho trôi 20 giờ rồi mở lại: món nào còn, món nào bị báo hỏng', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      g0.ui.closePanel();
      const bắt = [];
      const off = window.__bus.on('toast', (t) => bắt.push(t.text));
      for (let i = 0; i < 20; i++) { await new Promise((r) => setTimeout(r, 40)); R.advance(g, 60, window.__acts.act()); }
      off();
      g0.ui.panel('stall'); await new Promise((r) => setTimeout(r, 350));
      [...document.querySelectorAll('#modal .tab')].find((b) => /Kho quầy/.test(b.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      return { ngày: g.day, còn: g.stall.store.map((s) => `${s.id}@${Math.round(s.fresh)}%`),
        báoHỏng: bắt.filter((t) => /Đồ hỏng phải bỏ/.test(t)) };
    }, wait: 1200 },
  { shot: 'spoil39-02-sau-20h.png' },
];
