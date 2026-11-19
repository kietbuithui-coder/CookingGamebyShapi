// Menu ẩn của lượt 38: mở nhật ký + xoá dấu đã đọc.
import { boot, fresh } from '../lib.mjs';
const openDev = async () => {
  window.__game.ui.closePanel(); window.__game.ui.panel('settings');
  await new Promise((r) => setTimeout(r, 300));
  for (let i = 0; i < 8; i++) { document.getElementById('dev-unlock')?.click(); await new Promise((r) => setTimeout(r, 60)); }
  await new Promise((r) => setTimeout(r, 300));
};
export default [boot, fresh(10 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },
  { label: '① mục "Mở nhật ký phát triển"', eval: async (src) => {
      await window.eval(`(${src})`)();
      const item = [...document.querySelectorAll('#modal .item')].find((e) => /Mở nhật ký phát triển/.test(e.textContent || ''));
      item?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 800));
      return { bấmĐược: !!item, tiêuĐề: document.querySelector('#modal h2')?.textContent?.trim(),
        sốBản: [...document.querySelectorAll('#modal h4')].length };
    }, args: [openDev.toString()], wait: 800 },
  { shot: 'dev38-01-nhat-ky.png' },
  { label: '② mục xoá dấu đã đọc → Cài đặt có nhãn "mới"', eval: async (src) => {
      await window.eval(`(${src})`)();
      const item = [...document.querySelectorAll('#modal .item')].find((e) => /Xoá dấu đã đọc/.test(e.textContent || ''));
      item?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 800));
      const btn = [...document.querySelectorAll('#modal button')].find((b) => /Xem các bản gần đây/.test(b.textContent));
      return { bấmĐược: !!item, logSeen: window.__game.g.flags.logSeen, nút: btn?.textContent.trim() };
    }, args: [openDev.toString()], wait: 800 },
];
