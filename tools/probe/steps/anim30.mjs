// LƯỢT 30 — nghe nhạc (đổi BGM) + radio/WAP đọc tin & giá thật trong ván.
import { boot, fresh } from '../lib.mjs';
const read = { eval: () => {
  const act = document.querySelector('.ph .pact');
  return { lop: act ? act.className : null, chu: act ? act.textContent.replace(/\s+/g, ' ').trim().slice(0, 260) : '',
    nut: act ? [...act.querySelectorAll('button')].map((b) => b.textContent.trim()) : [],
    bgm: window.__game.sound.bgm, bai: window.__PUI.phoneSong() };
} };
export default [boot, fresh(9 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } const g = window.__game.g; g.cash = 300000; g.gear['camung'] = 100; g.phone = { id: 'camung', battery: 80 }; return 1; } },

  { label: '① bật Nghe nhạc: máy phát bài đầu, nhạc nền đổi theo' },
  { eval: async () => {
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    window.__PUI.phoneKey('open', 'music'); window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 200));
    document.querySelector('.plist .row[data-a="phonerow"]')?.click();
    await new Promise((r) => setTimeout(r, 600));
    return 1;
  }, wait: 700 },
  read,
  { shot: 'p30-01-nhac.png' },
  { label: '② bấm “Bài khác”: sang bài kế, nhạc nền đổi theo' },
  { eval: async () => { document.querySelector('.ph .pact .pbtn')?.click(); await new Promise((r) => setTimeout(r, 600)); return 1; }, wait: 700 },
  read,
  { shot: 'p30-02-bai-khac.png' },

  { label: '③ radio: đọc tin thật (thời tiết, giá chợ)' },
  { eval: async () => {
    window.__PUI.stopPhoneAct(); window.__game.ui.reopenPanel('phone');
    window.__PUI.phoneKey('open', 'radio'); window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 200));
    document.querySelector('.plist .row[data-a="phonerow"]')?.click();
    await new Promise((r) => setTimeout(r, 600));
    return 1;
  }, wait: 700 },
  read,
  { shot: 'p30-03-radio.png' },

  { label: '④ lướt WAP: đúng 5 tin thật, bấm Trang khác sang trang kế' },
  { eval: async () => {
    window.__PUI.stopPhoneAct(); window.__game.ui.reopenPanel('phone');
    window.__PUI.phoneKey('open', 'wap'); window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 200));
    document.querySelector('.plist .row[data-a="phonerow"]')?.click();
    await new Promise((r) => setTimeout(r, 600));
    return { tin: document.querySelectorAll('.ph .pwscroll p.nw').length };
  }, wait: 700 },
  { shot: 'p30-04-wap.png' },
  { eval: async () => {
    // sang trang 2 (trang giá cả) rồi chụp: trang 1 là tin thường, trang 2 có bảng giá thật
    document.querySelector('.ph .pact .pbtn')?.click();
    await new Promise((r) => setTimeout(r, 700));
    return { trang: window.__PUI.phoneAct()?.page, tin: document.querySelectorAll('.ph .pwscroll p.nw').length, loai: [...document.querySelectorAll('.ph .pwscroll p.nw b')].map((b) => b.textContent) };
  }, wait: 800 },
  { shot: 'p30-05-wap-trang-2.png' },
  read,
];
