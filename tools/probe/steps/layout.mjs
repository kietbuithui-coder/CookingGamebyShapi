import { boot, fresh } from '../lib.mjs';
const rect = (sel) => ({ eval: (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { sel, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; }, args: [sel] });
const handle = (name) => { const h = [...document.querySelectorAll('#layed .h')].find((h) => h.textContent.includes(name)); const r = h.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; };
const tapSel = (sel) => ({ tapsEval: (sel) => { const e = document.querySelector(sel); if (!e) return []; const r = e.getBoundingClientRect(); return [[r.left + r.width / 2, r.top + r.height / 2]]; }, args: [sel], quietTaps: true });
const drag = (name, pts) => ({ dragEval: `(() => { const f = ${handle.toString()}; const [x, y] = f(${JSON.stringify(name)}); return ${JSON.stringify(pts)}.map(([dx, dy]) => [x + dx, y + dy]); })()`, gap: 110 });
const state = { eval: () => ({ cur: document.querySelector('#layed .cur')?.textContent, low: document.querySelector('#layed .ctl')?.classList.contains('low'), ui: JSON.stringify(window.__game.set.ui) }) };
export default [boot, fresh(9 * 60),
  { eval: () => { localStorage.removeItem('ganhhang.settings.v1'); return 1; }, quiet: true },
  { eval: () => { window.__game.ui.panel('settings'); return 1; }, quiet: true, wait: 900, shot: 'ly_settings' },
  tapSel('#modal [data-a=layout]'), { wait: 1000, shot: 'ly_editor0' },
  drag('Nút tương tác', [[0, 0], [-60, -20], [-300, -40], [-640, -30]]), { wait: 300 },
  tapSel('#layed [data-l=plus]'), tapSel('#layed [data-l=plus]'), tapSel('#layed [data-l=plus]'), state,
  drag('Túi', [[0, 0], [-30, 40], [-80, 150]]),
  drag('Nút chạy', [[0, 0], [100, 30], [500, 300]]), tapSel('#layed [data-l=minus]'),
  { wait: 400, shot: 'ly_editor1' }, state,
  tapSel('#layed [data-l=cook]'), { wait: 500 },
  drag('Nút khi nấu ăn', [[0, 0], [-100, -20], [-330, -60]]), tapSel('#layed [data-l=plus]'),
  { wait: 400, shot: 'ly_editor2' }, state,
  tapSel('#layed [data-l=done]'), { wait: 1200, shot: 'ly_play' },
  { eval: () => ({ mode: window.__game.mode, layed: !!document.querySelector('#layed'), cookHidden: document.querySelector('#cook').classList.contains('hide'), cookBtns: document.querySelector('#cook .btns').children.length, saved: localStorage.getItem('ganhhang.settings.v1') }) },
  rect('#act'), rect('#runb'), rect('#menub'),
  tapSel('#menub [data-p=bag]'), { wait: 800 },
  { eval: () => ({ modal: window.__game.ui.modalName }) },
];
