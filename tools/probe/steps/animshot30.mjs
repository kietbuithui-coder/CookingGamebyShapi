// LƯỢT 30 — ảnh lưu: máy phát nhạc riêng (đổi BGM), radio đọc tin thật, WAP năm tin thật + giá chợ.
import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(9 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } const g = window.__game.g; g.cash = 300000; g.gear['camung'] = 100; g.phone = { id: 'camung', battery: 80 }; return 1; } },

  { label: '① Nghe nhạc: tên bài + ca sĩ, nhạc nền đổi theo bài' },
  { eval: async () => {
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    window.__PUI.phoneKey('open', 'music'); window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 200));
    document.querySelector('.plist .row[data-a="phonerow"]')?.click();
    await new Promise((r) => setTimeout(r, 600));
    return window.__game.sound.bgm;
  }, wait: 700 },
  { shot: '28_nhac_tren_may.png' },

  { label: '② “Bài khác”: sang bài kế, nhạc nền đổi' },
  { eval: async () => { document.querySelector('.ph .pact .pbtn')?.click(); await new Promise((r) => setTimeout(r, 600)); return window.__game.sound.bgm; }, wait: 700 },
  { shot: '29_bai_khac_bgm.png' },

  { label: '③ radio: bản tin thật trong ván' },
  { eval: async () => {
    window.__PUI.stopPhoneAct(); window.__game.ui.reopenPanel('phone');
    window.__PUI.phoneKey('open', 'radio'); window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 200));
    document.querySelector('.plist .row[data-a="phonerow"]')?.click();
    await new Promise((r) => setTimeout(r, 600));
    return document.querySelector('.ph .pmq')?.textContent;
  }, wait: 700 },
  { shot: '30_radio_tin_that.png' },

  { label: '④ WAP: năm tin thật + giá chợ đúng giá sạp' },
  { eval: async () => {
    window.__PUI.stopPhoneAct(); window.__game.ui.reopenPanel('phone');
    window.__PUI.phoneKey('open', 'wap'); window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 200));
    document.querySelector('.plist .row[data-a="phonerow"]')?.click();
    await new Promise((r) => setTimeout(r, 600));
    return document.querySelectorAll('.ph .pwscroll p.nw').length;
  }, wait: 700 },
  { shot: '31_wap_tin_that.png' },

  { label: '⑤ sang trang kế: trang giá cả' },
  { eval: async () => { document.querySelector('.ph .pact .pbtn')?.click(); await new Promise((r) => setTimeout(r, 700)); return window.__PUI.phoneAct()?.page; }, wait: 800 },
  { shot: '32_wap_trang_gia.png' },
];
