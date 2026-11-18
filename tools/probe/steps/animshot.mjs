// Lượt 29 — chụp ảnh lưu lại: hoạt ảnh radio / WAP / cuộc gọi / tin nhắn / nhạc ngay trên màn hình máy.
import { boot, fresh } from '../lib.mjs';
const phone = (id) => ({ eval: async (id) => {
  const g0 = window.__game, g = g0.g;
  g.gear[id] = 100; g.phone = { id, battery: 84 }; g.cash = 500000;
  g0.ui.closePanel(); g0.ui.panel('phone');
  await new Promise((r) => setTimeout(r, 250));
  return g.phone.id;
}, args: [id] });
export default [boot, fresh(9 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },

  { label: '① cảm ứng · Radio: kim dò đài + cột sóng + chữ chạy' },
  phone('camung'),
  { eval: async () => { window.__PUI.phoneKey('open', 'radio'); window.__PUI.phoneKey('ok'); window.__game.ui.reopenPanel('phone'); await new Promise((r) => setTimeout(r, 500)); return window.__PUI.phoneAct()?.k; }, wait: 500 },
  { shot: '22_radio_tren_may.png' },

  { label: '② cảm ứng · WAP: trang tự cuộn, thanh tải' },
  { eval: async () => { window.__PUI.endPhoneAct(); window.__PUI.phoneKey('open', 'wap'); window.__PUI.phoneKey('ok'); window.__game.ui.reopenPanel('phone'); await new Promise((r) => setTimeout(r, 500)); return window.__PUI.phoneAct()?.k; }, wait: 500 },
  { shot: '23_wap_tren_may.png' },

  { label: '③ cảm ứng · cuộc gọi: vòng sóng, Đang gọi…, nút Tắt máy' },
  { eval: async () => {
    const g = window.__game.g;
    window.__PUI.endPhoneAct();
    g.rel['chu_ba'] = { v: 40, n: 3, last: -1 }; g.flags['call_chu_ba'] = -1;
    window.__PUI.phoneKey('open', 'contacts');
    window.__game.ui.reopenPanel('phone');
    window.__game.acts.phoneCall('chu_ba');
    window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 500));
    return window.__PUI.phoneAct()?.k;
  }, wait: 600 },
  { shot: '24_cuoc_goi_tren_may.png' },

  { label: '④ cục gạch · tin nhắn: đang gõ + bàn phím số' },
  { eval: async () => { window.__PUI.endPhoneAct(); const g = window.__game.g; g.phone = { id: 'cucgach', battery: 66 }; window.__game.ui.closePanel(); window.__game.ui.panel('phone'); window.__PUI.phoneKey('open', 'sms'); window.__game.ui.reopenPanel('phone'); await new Promise((r) => setTimeout(r, 500)); return window.__PUI.phoneAct()?.k; }, wait: 500 },
  { shot: '25_tin_nhan_dang_go.png' },

  { label: '⑤ nắp gập · nghe nhạc: cột sóng + Bài khác / Tắt' },
  { eval: async () => {
    window.__PUI.endPhoneAct();
    const g = window.__game.g; g.phone = { id: 'napgap', battery: 70 };
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    for (let i = 0; i < 9; i++) {
      window.__PUI.phoneKey('down'); window.__game.ui.reopenPanel('phone');
      await new Promise((r) => setTimeout(r, 90));
      if (document.querySelector('.pring .cur b')?.textContent?.trim() === 'Nhạc') break;
    }
    window.__PUI.phoneKey('ok');
    window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 200));
    document.querySelector('.plist .row[data-a="phonerow"]')?.click();
    await new Promise((r) => setTimeout(r, 500));
    return window.__PUI.phoneAct()?.k;
  }, wait: 600 },
  { shot: '26_nap_gap_nghe_nhac.png' },

  { label: '⑥ bấm Tắt trên máy: màn hình trở lại danh sách app' },
  { eval: async () => { window.__PUI.endPhoneAct(); window.__game.ui.reopenPanel('phone'); await new Promise((r) => setTimeout(r, 400)); return { conLop: !!document.querySelector('.ph .pact'), act: window.__PUI.phoneAct()?.k ?? null }; }, wait: 400 },
  { shot: '27_tat_hoat_anh.png' },
];
