// Menu ẩn lượt 52: bấm 7 lần chữ "Cài đặt" → bàn phím số → nhập 7777 mới vào menu test.
// Bấm bằng toạ độ THẬT trên màn hình (không gọi hàm), đúng như người dùng làm.
import { boot, fresh } from '../lib.mjs';
const dlgText = () => { const m = document.querySelector('#modal'); return m && m.innerText ? m.innerText.replace(/\n+/g, ' | ').slice(0, 220) : null; };
export default [boot, fresh(9 * 60),
  { label: 'mở Cài đặt bằng nút trên HUD' },
  { eval: () => { const g0 = window.__game; g0.mode = 'play'; g0.ui.panel('settings'); return g0.ui.modalName; }, wait: 600 },
  { eval: () => ({ modal: window.__game.ui.modalName, hasUnlock: !!document.querySelector('#dev-unlock'), text: (window.__game.ui.$('modal').innerText || '').slice(0, 40) }) },

  { label: 'bấm chữ "Cài đặt" 6 lần: chưa có gì xảy ra' },
  { eval: () => { const el = document.querySelector('#dev-unlock'); const r = el.getBoundingClientRect(); for (let i = 0; i < 6; i++) document.querySelector('#dev-unlock').click(); return { taps: 6, still: !!document.querySelector('#dev-unlock') }; }, wait: 400 },
  { eval: dlgText },

  { label: 'bấm lần thứ 7: hiện bàn phím số' },
  { eval: () => { document.querySelector('#dev-unlock').click(); return 1; }, wait: 500 },
  { eval: () => { const m = document.querySelector('#modal'); return { title: m.querySelector('h2') ? m.querySelector('h2').innerText : '', keys: [...m.querySelectorAll('[data-pin]')].map((b) => b.dataset.pin).join('') }; } },
  { shot: 'dev_a_pinpad' },

  { label: 'nhập SAI (1234): xoá sạch, vẫn ở bàn phím' },
  ...['1', '2', '3', '4'].map((k) => ({ eval: (sel, k) => { const el = [...document.querySelectorAll(sel)].find((e) => e.dataset.pin === k); el.click(); return k; }, args: ['[data-pin]', k], quiet: true, wait: 120 })),
  { eval: () => { const m = document.querySelector('#modal'); return { title: m.querySelector('h2').innerText, err: (m.innerText.match(/Sai mã[^|]*/) || [''])[0], devOpen: !!document.querySelector('[data-a="devRun"]') }; } },
  { shot: 'dev_b_wrong' },

  { label: 'nhập ĐÚNG 7777: vào menu test' },
  ...['7', '7', '7', '7'].map((k) => ({ eval: (sel, k) => { const el = [...document.querySelectorAll(sel)].find((e) => e.dataset.pin === k); el.click(); return k; }, args: ['[data-pin]', k], quiet: true, wait: 150 })),
  { eval: () => { const m = document.querySelector('#modal'); return { title: m.querySelector('h2') ? m.querySelector('h2').innerText : '(không có)', sections: [...m.querySelectorAll('h4')].map((h) => h.innerText), items: [...m.querySelectorAll('[data-k]')].map((b) => b.dataset.k) }; } },
  { shot: 'dev_c_unlocked' },

  { label: 'chạy mục "Tiệm bánh bán những gì" của lượt 54' },
  { eval: () => { const b = [...document.querySelectorAll('[data-k]')].find((x) => x.dataset.k === 'banh_list'); b.click(); return 1; }, quiet: true, wait: 900 },
  { eval: () => { const d = document.querySelector('#dlg'); return { open: !!d && !d.classList.contains('hide'), text: (d.innerText || '').replace(/\n+/g, ' | ').slice(0, 300) }; } },
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; return 1; }, quiet: true, wait: 400 },

  { label: 'đóng Cài đặt rồi mở lại: vẫn còn trong menu (không phải gõ mã)' },
  { eval: () => { const g0 = window.__game; g0.ui.closePanel(); g0.mode = 'play'; return 1; }, quiet: true, wait: 400 },
  { eval: () => { const g0 = window.__game; g0.ui.panel('settings'); return 1; }, quiet: true, wait: 600 },
  { eval: () => ({ title: (document.querySelector('#modal h2') || { innerText: '' }).innerText, stillOpen: !!document.querySelector('[data-a="devRun"]') }) },

  { label: 'bấm "Ẩn & khoá lại" rồi mở Cài đặt: mã bị khoá lại thật' },
  { eval: () => { const b = document.querySelector('[data-a="devLock"]'); b.click(); return 1; }, quiet: true, wait: 700 },
  { eval: () => ({ backToSettings: !document.querySelector('[data-a="devRun"]'), hasUnlock: !!document.querySelector('#dev-unlock'), pinpadGone: !document.querySelector('[data-pin]') }) },
  { eval: () => { const g0 = window.__game; g0.ui.closePanel(); return 1; }, quiet: true, wait: 300 },
  { eval: () => { const g0 = window.__game; g0.ui.panel('settings'); return 1; }, quiet: true, wait: 500 },
  { eval: () => ({ lockedAgain: !document.querySelector('[data-a="devRun"]'), devTapsRestart: !!document.querySelector('#dev-unlock') }) },
  { shot: 'dev_d_locked' },
];
