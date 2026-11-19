// Chạy hai mục mới của menu ẩn (lượt 36) bằng 8 lần bấm vào tiêu đề "Cài đặt".
import { boot, fresh } from '../lib.mjs';
const openDev = async () => {
  window.__game.ui.closePanel(); window.__game.ui.panel('settings');
  await new Promise((r) => setTimeout(r, 300));
  for (let i = 0; i < 8; i++) { document.getElementById('dev-unlock')?.click(); await new Promise((r) => setTimeout(r, 60)); }
  await new Promise((r) => setTimeout(r, 300));
};
export default [boot, fresh(10 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },
  { label: '① mục bánh mì: bỏ 4 ổ vào quầy rồi xem độ tươi', eval: async (src) => {
      await window.eval(`(${src})`)();
      const item = [...document.querySelectorAll('#modal .item')].find((e) => /Bánh mì trong quầy/.test(e.textContent || ''));
      item?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 900));
      [...document.querySelectorAll('#modal .tab')].find((x) => /Kho quầy/.test(x.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      const g = window.__game.g;
      return { bấmĐược: !!item, tiêuĐề: [...document.querySelectorAll('#modal h4, #modal h2')].map((x) => x.textContent.trim()).slice(0, 4),
        banhMi: g.stall.store.filter((s) => s.id === 'banhmi').map((s) => `×${s.n} tươi ${Math.round(s.fresh)}%`) };
    }, args: [openDev.toString()], wait: 800 },
  { shot: 'dev36-01-banh-mi.png' },
  { label: '② mục đồ lạnh: sữa + thịt trong quầy không tủ đá → cảnh báo', eval: async (src) => {
      await window.eval(`(${src})`)();
      const item = [...document.querySelectorAll('#modal .item')].find((e) => /sữa\/thịt trong quầy/.test(e.textContent || ''));
      item?.querySelector('button')?.click();
      await new Promise((r) => setTimeout(r, 900));
      [...document.querySelectorAll('#modal .tab')].find((x) => /Kho quầy/.test(x.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      const t = document.querySelector('#modal .body')?.textContent?.replace(/\s+/g, ' ') ?? '';
      const i = t.indexOf('cần lạnh mà quầy');
      return { bấmĐược: !!item, cảnhBáo: i >= 0 ? t.slice(Math.max(0, i - 30), i + 120) : t.slice(0, 160) };
    }, args: [openDev.toString()], wait: 800 },
  { shot: 'dev36-02-canh-bao-lanh.png' },
];
