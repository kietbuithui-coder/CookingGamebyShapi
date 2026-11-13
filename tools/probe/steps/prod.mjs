// Thử bản phát hành (không có ?debug) đúng như người chơi: chạm để vào ván mới, mở Cài đặt, vào màn hình sắp xếp nút.
// Dùng: URL=http://127.0.0.1:4180/CookingGamebyShapi/ node play.mjs steps/prod.mjs
const tapSel = (sel) => ({ tapsEval: (sel) => { const e = document.querySelector(sel); if (!e) return []; const r = e.getBoundingClientRect(); return [[r.left + r.width / 2, r.top + r.height / 2]]; }, args: [sel] });
export default [
  { waitFor: () => !!document.querySelector('#menu [data-m=new]'), timeout: 60000 },
  { eval: () => ({ url: location.pathname, debugHooks: typeof window.__game, menu: [...document.querySelectorAll('#menu [data-m]')].map((b) => b.textContent) }) },
  tapSel('#menu [data-m=new]'), { wait: 700 }, tapSel('#menu [data-m=anh]'), { wait: 2500 },
  tapSel('#dlg .btn'), { wait: 700 }, tapSel('#dlg .btn'), { wait: 2500, shot: 'prod_play' },
  { eval: () => ({ clock: document.querySelector('#clock').innerText.replace(/\n/g, ' '), money: document.querySelector('#money').innerText, focus: document.querySelector('#focus').innerText, saved: !!localStorage.getItem('ganhhang.save.v1') }) },
  tapSel('#menub [data-p=settings]'), { wait: 900 },
  { eval: () => ({ title: document.querySelector('#modal h2')?.innerText, hasLayoutBtn: !!document.querySelector('#modal [data-a=layout]'), hasScale: !!document.querySelector('#modal input[data-r=uiscale]') }) },
  tapSel('#modal [data-a=layout]'), { wait: 900, shot: 'prod_layout' },
  { eval: () => ({ frames: [...document.querySelectorAll('#layed .h')].filter((h) => h.style.display !== 'none').map((h) => h.textContent) }) },
  tapSel('#layed [data-l=done]'), { wait: 800 },
  { eval: () => ({ editorClosed: !document.querySelector('#layed'), settingsSaved: !!localStorage.getItem('ganhhang.settings.v1') }) },
];
