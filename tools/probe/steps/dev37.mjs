// Chạy mục menu ẩn của lượt 37 (lấy đồ trong quầy ra ở mọi nơi).
import { boot, fresh } from '../lib.mjs';
const openDev = async () => {
  window.__game.ui.closePanel(); window.__game.ui.panel('settings');
  await new Promise((r) => setTimeout(r, 300));
  for (let i = 0; i < 8; i++) { document.getElementById('dev-unlock')?.click(); await new Promise((r) => setTimeout(r, 60)); }
  await new Promise((r) => setTimeout(r, 300));
};
export default [boot, fresh(10 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },
  { label: 'mục ① quầy mang theo → mở Túi đồ › Kho quầy', eval: async (src) => {
      await window.eval(`(${src})`)();
      const item = [...document.querySelectorAll('#modal .item')].find((e) => /Kho quầy lấy đồ ra ngay/.test(e.textContent || ''));
      item?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 800));
      const tabs = [...document.querySelectorAll('#modal .tab')].map((x) => x.textContent.trim());
      [...document.querySelectorAll('#modal .tab')].find((x) => /Kho quầy/.test(x.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      return { bấmĐược: !!item, where: window.__game.g.stall.where, tabs,
        rows: [...document.querySelectorAll('#modal .item')].map((e) => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)) };
    }, args: [openDev.toString()], wait: 800 },
  { shot: 'dev37-01-tui-kho.png' },
  { label: 'mục ② quầy ở nhà → vẫn lấy được', eval: async (src) => {
      await window.eval(`(${src})`)();
      const item = [...document.querySelectorAll('#modal .item')].find((e) => /đứng ngoài đường vẫn lấy/.test(e.textContent || ''));
      item?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 800));
      [...document.querySelectorAll('#modal .tab')].find((x) => /Kho quầy/.test(x.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      const g = window.__game.g;
      const before = g.stall.store.map((s) => s.id + '×' + s.n);
      [...document.querySelectorAll('#modal .item')].find((e) => /Bánh mì/.test(e.textContent || ''))?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 400));
      return { bấmĐược: !!item, where: g.stall.where, trước: before, sauTúi: g.bag.map((s) => s.id + '×' + s.n) };
    }, args: [openDev.toString()], wait: 800 },
  { shot: 'dev37-02-quay-o-nha.png' },
];
