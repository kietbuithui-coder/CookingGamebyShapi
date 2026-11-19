// Lượt 37 — lấy đồ RA khỏi kho quầy ở bất cứ đâu, không cần đặt quầy ở chỗ bán.
import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(10 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },
  { label: '① để quầy ĐANG MANG THEO, đứng giữa chợ, mở Túi đồ › Kho quầy', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      for (const id of ['ganh', 'daothot', 'bepthan', 'vi', 'noi']) if (!R.has(g, id)) R.buyGear(g, id);
      g.stall.tier = 1;
      window.__give('banhmi', 4, 'store');
      window.__give('heo', 2, 'store');
      g0.stall.pickUp();                       // quầy lên vai, không đặt ở chỗ bán
      g.min = 9 * 60;
      const a = g0.world.anchors.v_cho ?? g0.world.anchors.c_cho;
      if (a) g0.player.place(a.x, a.z + 1.5, 0);
      await new Promise((r) => setTimeout(r, 300));
      g0.ui.closePanel(); g0.ui.panel('bag');
      await new Promise((r) => setTimeout(r, 400));
      const tabs = [...document.querySelectorAll('#modal .tab')].map((x) => x.textContent.trim());
      [...document.querySelectorAll('#modal .tab')].find((x) => /Kho quầy/.test(x.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      const rows = [...document.querySelectorAll('#modal .item')].map((e) => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 46));
      return { where: g.stall.where, tabs, cóTabKho: tabs.includes('Kho quầy'), rows };
    }, wait: 800 },
  { shot: 'take01-kho-tu-tui.png' },
  { label: '② bấm "› Túi" lấy bánh mì ra khi quầy đang mang theo', eval: async () => {
      const g0 = window.__game, g = g0.g;
      const item = [...document.querySelectorAll('#modal .item')].find((e) => /Bánh mì/.test(e.textContent || ''));
      item?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 400));
      const bag = [...document.querySelectorAll('#modal .item')].map((e) => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 40));
      return { túi: g.bag.map((s) => s.id + '×' + s.n), store: g.stall.store.map((s) => s.id + '×' + s.n), bagRows: bag };
    }, wait: 700 },
  { shot: 'take02-da-lay-ra.png' },
  { label: '③ quầy để Ở NHÀ, đứng ngoài đường vẫn lấy được', eval: async () => {
      const g0 = window.__game, g = g0.g;
      g0.ui.closePanel();
      g0.stall.storeHome();
      window.__give('banhmi', 3, 'store');
      const a = g0.world.anchors.v_equip;
      if (a) g0.player.place(a.x, a.z + 2, 0);
      await new Promise((r) => setTimeout(r, 300));
      g0.ui.panel('bag'); await new Promise((r) => setTimeout(r, 350));
      [...document.querySelectorAll('#modal .tab')].find((x) => /Kho quầy/.test(x.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      const item = [...document.querySelectorAll('#modal .item')].find((e) => /Bánh mì/.test(e.textContent || ''));
      item?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 400));
      const t = document.querySelector('#modal .body')?.textContent?.replace(/\s+/g, ' ') ?? '';
      return { where: g.stall.where, lấyĐược: !!item, túi: g.bag.map((s) => s.id + '×' + s.n),
        dòngKho: t.slice(t.indexOf('Kho quầy'), t.indexOf('Kho quầy') + 70) };
    }, wait: 800 },
  { shot: 'take03-quay-o-nha.png' },
];
