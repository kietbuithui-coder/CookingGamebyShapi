// LƯỢT 29 — hoạt ảnh ngay trên màn hình điện thoại: gọi điện, radio, nhạc, WAP, soạn tin.
// Kiểm trên máy 390×844 (máy thật): mở máy cảm ứng → bấm app → màn hình phải có lớp hoạt ảnh đang chạy,
// phần tử động phải thật sự có animation, và bấm nút trên lớp đó phải đổi kênh / tắt được.
// Chạy: cd tools/probe && W=390 H=844 OUT=/tmp/probe/p29 node play.mjs steps/anim.mjs
import { boot, fresh } from '../lib.mjs';

const phone = (id) => ({ eval: async (id) => {
  const g0 = window.__game, g = g0.g;
  g.gear[id] = 100; g.phone = { id, battery: 82 };
  g.cash = 500000;
  g0.ui.closePanel(); g0.ui.panel('phone');
  await new Promise((r) => setTimeout(r, 350));
  return g.phone.id;
}, args: [id] });

/** Bấm thẳng vào icon trên màn hình chính (cảm ứng) hoặc chọn bằng phím rồi OK. */
const openApp = (name) => ({ eval: async (name) => {
  const cells = [...document.querySelectorAll('.pgrid .cell')];
  const cell = cells.find((c) => c.textContent.includes(name));
  if (cell) cell.click();
  else {
    const rows = [...document.querySelectorAll('.plist .row')];
    const i = rows.findIndex((r) => r.textContent.includes(name));
    const box = window.__game.ui;
    for (let k = 0; k < i; k++) document.querySelector('.pkeys .key:nth-child(3)')?.click();
    document.querySelector('.pkeys .key.mid')?.click();
  }
  await new Promise((r) => setTimeout(r, 300));
  return window.__PUI.phoneView().app;
}, args: [name] });

/** Đo lớp hoạt ảnh: nó có hiện không, phần tử nào đang động, chữ đang chạy là gì. */
const overlay = { eval: () => {
  const act = document.querySelector('.ph .pact');
  const ph = document.querySelector('.ph');
  const anim = (el) => { const s = getComputedStyle(el); return s.animationName && s.animationName !== 'none'; };
  const moving = act ? [...act.querySelectorAll('*')].filter(anim).length : 0;
  return {
    co: !!act, lop: act ? act.className : null,
    rong: act ? Math.round(act.getBoundingClientRect().width) : 0,
    cao: act ? Math.round(act.getBoundingClientRect().height) : 0,
    khungCao: ph ? Math.round(ph.getBoundingClientRect().height) : 0,
    dong: moving,
    chu: act ? act.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : '',
    nut: act ? [...act.querySelectorAll('button')].map((b) => ({ t: b.textContent.trim(), h: Math.round(b.getBoundingClientRect().height) })) : [],
    busy: ph ? ph.classList.contains('busy') : false,
  };
} };

export default [boot, fresh(9 * 60),
  { label: '0 màn dọc 390×844: đóng lời nhắc xoay ngang' },
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return { rong: innerWidth, cao: innerHeight }; } },

  { label: '① cảm ứng: mở app Radio thì màn hình máy tự chạy kim dò đài + sóng' },
  phone('camung'),
  openApp('Radio'),
  { eval: async () => {
    // Bấm đúng dòng "Radio FM" trong danh sách để máy thật sự bật đài.
    document.querySelector('.plist .row[data-a="phonerow"]')?.click();
    await new Promise((r) => setTimeout(r, 400));
    return { app: window.__PUI.phoneView().app, act: window.__PUI.phoneAct()?.k ?? null };
  }, wait: 600 },
  { shot: 'p29-01-radio.png' },
  overlay,

  { label: '② bấm “Đổi đài”: dòng tin trên máy đổi, máy chạy tiếp' },
  { eval: async () => {
    const before = document.querySelector('.ph .pqm, .ph .pmq')?.textContent ?? '';
    document.querySelector('.ph .pact .pbtn')?.click();
    await new Promise((r) => setTimeout(r, 400));
    const after = document.querySelector('.ph .pqm, .ph .pmq')?.textContent ?? '';
    return { truoc: before.replace(/\s+/g, ' ').trim().slice(0, 40), sau: after.replace(/\s+/g, ' ').trim().slice(0, 40), doi: before !== after };
  }, wait: 500 },
  { shot: 'p29-02-doi-dai.png' },

  { label: '③ cảm ứng: lướt WAP — trang tự cuộn, thanh tải chạy' },
  { eval: async () => { window.__PUI.endPhoneAct(); window.__game.ui.closePanel(); window.__game.ui.panel('phone'); await new Promise((r) => setTimeout(r, 300)); return true; } },
  openApp('WAP'),
  { eval: async () => { document.querySelector('.plist .row[data-a="phonerow"]')?.click(); await new Promise((r) => setTimeout(r, 400)); return window.__PUI.phoneAct()?.k ?? null; }, wait: 600 },
  { shot: 'p29-03-wap.png' },
  overlay,
  { label: '③b trang WAP đang chạy: đo vị trí cuộn sau nửa giây' , eval: async () => {
    const el = document.querySelector('.ph .pwscroll');
    const y1 = el ? getComputedStyle(el).transform : '';
    await new Promise((r) => setTimeout(r, 500));
    const y2 = el ? getComputedStyle(el).transform : '';
    return { cuon: y1 !== y2, y1, y2 };
  }, wait: 200 },

  { label: '④ gọi khách quen: màn hình chuyển thành màn hình cuộc gọi' },
  { eval: async () => {
    const g = window.__game.g, R = window.__R;
    window.__PUI.endPhoneAct();
    g.cash = 500000;
    // cho quen một khách để danh bạ có số gọi được
    if (!R || !g.rel) return 'no';
    g.rel['chu_ba'] = { v: 40, n: 3, last: -1 };
    g.flags['call_chu_ba'] = -1;
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    await new Promise((r) => setTimeout(r, 250));
    const cell = [...document.querySelectorAll('.pgrid .cell')].find((c) => c.textContent.includes('Danh bạ'));
    cell?.click();
    await new Promise((r) => setTimeout(r, 350));
    const rows = [...document.querySelectorAll('.plist .row[data-a="phonerow"]')];
    const row = rows.find((r) => r.textContent.includes('Chú Ba'));
    row?.click();
    await new Promise((r) => setTimeout(r, 400));
    return { act: window.__PUI.phoneAct()?.k ?? null, who: window.__PUI.phoneAct()?.who ?? null, dong: rows.length };
  }, wait: 700 },
  { shot: 'p29-04-call.png' },
  overlay,

  { label: '⑤ bấm “Tắt máy” trên màn hình cuộc gọi: lớp gọi tắt hẳn' },
  { eval: async () => {
    const co = !!document.querySelector('.ph .phang');
    document.querySelector('.ph .phang')?.click();
    await new Promise((r) => setTimeout(r, 300));
    return { coNut: co, conLop: !!document.querySelector('.ph .pact'), act: window.__PUI.phoneAct()?.k ?? null };
  }, wait: 400 },
  { shot: 'p29-05-tat-may.png' },

  { label: '⑥ cục gạch mở Tin nhắn: màn hình hiện bong bóng đang gõ + bàn phím' },
  { eval: async () => {
    const g = window.__game.g;
    g.phone = { id: 'cucgach', battery: 66 };
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    await new Promise((r) => setTimeout(r, 300));
    window.__PUI.phoneKey('open', 'sms');
    window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 350));
    return { app: window.__PUI.phoneView().app, act: window.__PUI.phoneAct()?.k ?? null };
  }, wait: 600 },
  { shot: 'p29-06-sms-cucgach.png' },
  overlay,

  { label: '⑦ nắp gập nghe nhạc: cột sóng nhảy, chữ chạy' },
  { eval: async () => {
    const g = window.__game.g;
    window.__PUI.endPhoneAct();
    g.phone = { id: 'napgap', battery: 70 };
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    await new Promise((r) => setTimeout(r, 300));
    // Xoay vòng ▲▼ tới icon "Nhạc" rồi TÁCH để mở (đúng như người chơi bấm).
    const seq = window.__PUI;
    for (let i = 0; i < 9; i++) {
      seq.phoneKey('down'); window.__game.ui.reopenPanel('phone');
      await new Promise((r) => setTimeout(r, 120));
      const cur = document.querySelector('.pring .cur b')?.textContent?.trim();
      if (cur === 'Nhạc') break;
    }
    document.querySelector('.pkeys .key.mid')?.click();
    await new Promise((r) => setTimeout(r, 250));
    document.querySelector('.plist .row[data-a="phonerow"]')?.click();
    await new Promise((r) => setTimeout(r, 400));
    return { app: window.__PUI.phoneView().app, act: window.__PUI.phoneAct()?.k ?? null };
  }, wait: 600 },
  { shot: 'p29-07-napgap-nhac.png' },
  overlay,
];
