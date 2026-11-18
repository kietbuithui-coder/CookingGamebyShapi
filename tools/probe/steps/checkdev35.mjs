// Mở menu ẩn (8 lần bấm vào tiêu đề "Cài đặt") rồi bấm "Chạy" ở mục mới của lượt 35
// → phải mở ra bảng Quầy với tab Nhân sự và nút "Giao đi chợ…".
import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(10 * 60),
  { eval: async () => {
      window.__game.ui.panel('settings');
      await new Promise((r) => setTimeout(r, 300));
      for (let i = 0; i < 8; i++) { document.getElementById('dev-unlock')?.click(); await new Promise((r) => setTimeout(r, 60)); }
      await new Promise((r) => setTimeout(r, 300));
      const item = [...document.querySelectorAll('#modal .item')].find((e) => /Nhân sự/.test(e.textContent || ''));
      item?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 900));
      [...document.querySelectorAll('#modal .tab')].find((x) => /Nhân sự/.test(x.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      const btns = [...document.querySelectorAll('#modal button')].map((b) => b.textContent.trim());
      return { bấmĐượcMục: !!item, tabs: [...document.querySelectorAll('#modal .tab')].map((x) => x.textContent.trim()),
        h4: [...document.querySelectorAll('#modal h4')].map((x) => x.textContent.trim()), nútChợ: btns.filter((t) => /chợ/i.test(t)) };
    }, wait: 900 },
  { shot: 'chk-dev35.png' },
];
