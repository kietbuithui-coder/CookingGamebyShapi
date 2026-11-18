// LƯỢT 27 — hai số tổng đài trong danh bạ điện thoại:
// 1080 (nghe dự báo thời tiết ngày mai) và 1900 1234 (trúng thưởng — nhưng là lừa, và chỉ dính một lần).
// Chạy: cd tools/probe && OUT=/tmp/probe/hotline W=390 H=844 URL='http://127.0.0.1:5173/?debug' node play.mjs steps/hotline.mjs
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(9 * 60),
  { label: '0 đóng nhắc xoay ngang', eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return !!b; }, quiet: true },

  { label: '① ngày 1: danh bạ chỉ có Tổng đài 1080 (chưa có 1900 1234)', eval: async () => {
    const g = window.__game.g;
    g.gear.camung = 100; g.phone = { id: 'camung', battery: 92 }; g.cash = 60000;
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    await new Promise((r) => setTimeout(r, 400));
    const box = document.querySelector('.phonebox');
    [...box.querySelectorAll('.pgrid .cell')].find((c) => /Danh bạ/.test(c.textContent))?.click();
    await new Promise((r) => setTimeout(r, 350));
    return { day: g.day, rows: [...document.querySelectorAll('.phonebox .plist .row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()) };
  }, wait: 700 },
  { shot: 'h1-danhb-ngay1.png' },

  { label: '② gọi 1080 → toast dự báo ngày mai', eval: async () => {
    const g = window.__game.g, PH = await import('/src/sim/phone.ts');
    const before = g.cash;
    // bấm đúng dòng đầu danh sách (Tổng đài 1080) như người chơi bấm
    document.querySelectorAll('.phonebox .plist .row')[0]?.click();
    await new Promise((r) => setTimeout(r, 400));
    return { cashLeft: g.cash, spent: before - g.cash, wxCall: g.flags.wxCall, next: g.weather.next,
      toast: (document.querySelector('#toasts')?.textContent ?? '').replace(/\s+/g, ' ').slice(-200) };
  }, wait: 700 },
  { shot: 'h1b-goi-1080.png' },

  { label: '③ sang ngày 2 (8h10): có tin nhắn của 1900 1234', eval: async () => {
    const g = window.__game.g;
    g.day = 1; g.min = 8 * 60 + 10;
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    await new Promise((r) => setTimeout(r, 300));
    const box = document.querySelector('.phonebox');
    [...box.querySelectorAll('.pgrid .cell')].find((c) => /Tin nhắn/.test(c.textContent))?.click();
    await new Promise((r) => setTimeout(r, 350));
    return { sms: [...document.querySelectorAll('.phonebox .plist .row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim().slice(0, 100)) };
  }, wait: 700 },
  { shot: 'h2-tinnhan-lua.png' },

  { label: '④ danh bạ: 1900 1234 xuất hiện, đứng đầu cùng 1080', eval: async () => {
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    await new Promise((r) => setTimeout(r, 300));
    const box = document.querySelector('.phonebox');
    [...box.querySelectorAll('.pgrid .cell')].find((c) => /Danh bạ/.test(c.textContent))?.click();
    await new Promise((r) => setTimeout(r, 350));
    const list = [...document.querySelectorAll('.phonebox .plist .row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim());
    return { list, first: list[0] };
  }, wait: 700 },
  { shot: 'h3-danhb-ngay2.png' },

  { label: '⑤ gọi 1900 1234 (bấm dòng đầu) → mất cước, hẹn lên chỗ không có ai', eval: async () => {
    const g = window.__game.g, PH = await import('/src/sim/phone.ts');
    const before = g.cash;
    document.querySelectorAll('.phonebox .plist .row')[0]?.click();
    await new Promise((r) => setTimeout(r, 400));
    return { day: g.day, scamCall: g.flags.scamCall, fee: before - g.cash, trip: PH.scamTrip(g), state: PH.scammed(g),
      toast: (document.querySelector('#toasts')?.textContent ?? '').replace(/\s+/g, ' ').slice(-220) };
  }, wait: 700 },
  { shot: 'h4-goi-1900.png' },

  { label: '⑥ vào ngõ hẹn: hiện đúng MỘT cơ hội quay về', eval: async () => {
    const g = window.__game.g, G = window.__game, PH = await import('/src/sim/phone.ts');
    G.ui.closePanel();
    G.player.place(g.flags.scamX + 0.6, g.flags.scamZ - 2.4, 0);
    await new Promise((r) => setTimeout(r, 900));
    return { way: G.acts.way?.name ?? null, modal: G.ui.modalName,
      dlgOpen: G.ui.dlgOpen,
      who: document.querySelector('#dlg h3')?.textContent.trim() ?? '',
      text: (document.querySelector('#dlg p')?.textContent ?? '').slice(0, 140),
      opts: [...document.querySelectorAll('#dlg .opts .btn')].map((o) => o.textContent.replace(/\s+/g, ' ').trim().slice(0, 100)),
      toast: (document.querySelector('#toasts')?.textContent ?? '').replace(/\s+/g, ' ').slice(-200) };
  }, wait: 1200 },
  { shot: 'h5-ngo-cut.png' },
  { label: '⑦ bấm “quay về” → không mất tiền, hộp thoại đóng hẳn', eval: async () => {
    const g = window.__game.g, G = window.__game, PH = await import('/src/sim/phone.ts');
    const before = g.cash;
    [...document.querySelectorAll('#dlg .opts .btn')][0]?.click();
    await new Promise((r) => setTimeout(r, 700));
    return { dlgOpen: G.ui.isDialogOpen(), fee: before - g.cash, state: PH.scammed(g), toast: (document.querySelector('#toasts')?.textContent ?? '').replace(/\s+/g, ' ').slice(-150) };
  }, wait: 900 },
  { shot: 'h6-quay-ve.png' },

  { label: '⑧ gọi lại 1900 1234 sau khi đã biết: không mất thêm tiền', eval: async () => {
    const g = window.__game.g, PH = await import('/src/sim/phone.ts');
    const before = g.cash;
    const r = PH.callScam(g);
    return { fee: before - g.cash, ok: r.ok, line: (r.line ?? '').slice(0, 120), state: PH.scammed(g) };
  } },
];
