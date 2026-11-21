// Nhật ký phát triển: mở Cài đặt › "Xem các bản gần đây" → đọc được các bản gần nhất, có nhãn "mới".
import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(10 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },
  { label: '① Cài đặt có khối Nhật ký phát triển + nhãn mới', eval: async () => {
      window.__game.ui.panel('settings');
      await new Promise((r) => setTimeout(r, 400));
      const body = document.querySelector('#modal .body')?.textContent?.replace(/\s+/g, ' ') ?? '';
      const btn = [...document.querySelectorAll('#modal button')].find((b) => /Xem các bản gần đây/.test(b.textContent));
      return { cóKhối: /Nhật ký phát triển/.test(body), nhãnMới: /mới/.test(btn?.textContent ?? ''),
        nút: btn?.textContent.trim(), phụĐề: body.slice(body.indexOf('Nhật ký phát triển'), body.indexOf('Nhật ký phát triển') + 90) };
    }, wait: 600 },
  { shot: 'log-01-cai-dat.png' },
  { label: '② bấm vào → danh sách bản, mới nhất ở trên, đánh dấu đã đọc', eval: async () => {
      const g = window.__game.g;
      const before = g.flags.logSeen ?? 0;
      [...document.querySelectorAll('#modal button')].find((b) => /Xem các bản gần đây/.test(b.textContent))?.click();
      await new Promise((r) => setTimeout(r, 400));
      const heads = [...document.querySelectorAll('#modal h4')].map((x) => x.textContent.replace(/\s+/g, ' ').trim());
      const txt = document.querySelector('#modal .body')?.textContent?.replace(/\s+/g, ' ') ?? '';
      window.__shot1 = { heads, txt };
      return { đầuĐề: heads, sốViệc: [...document.querySelectorAll('#modal .item')].length,
        cóLượt51: /Lượt 51/.test(txt), cóLượt49: /Lượt 49/.test(txt), khôngCóLượt42: !/Lượt 42/.test(txt), logSeenTrước: before, logSeenSau: g.flags.logSeen };
    }, wait: 700 },
  { shot: 'log-02-danh-sach.png' },
  { label: '③ mở lại Cài đặt: nhãn "mới" đã biến mất', eval: async () => {
      window.__game.ui.closePanel(); window.__game.ui.panel('settings');
      await new Promise((r) => setTimeout(r, 400));
      const btn = [...document.querySelectorAll('#modal button')].find((b) => /Xem các bản gần đây/.test(b.textContent));
      return { nhãnMớiSauKhiĐọc: /mới/.test(btn?.textContent ?? ''), nút: btn?.textContent.trim() };
    }, wait: 500 },
];
