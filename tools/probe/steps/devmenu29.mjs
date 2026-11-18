// Lượt 29 — menu Test & Dịch chuyển ẩn: bấm 3 mục mới của lượt này, mỗi mục phải mở máy và bật hoạt ảnh.
import { boot, fresh } from '../lib.mjs';
const read = { eval: () => {
  const act = document.querySelector('.ph .pact');
  return { panel: window.__game.ui.modalName, app: window.__PUI.phoneView().app, act: window.__PUI.phoneAct()?.k ?? null, coLop: !!act, nut: act ? [...act.querySelectorAll('button')].map((b) => b.textContent.trim()) : [] };
} };
const openDev = { eval: async () => {
  const g0 = window.__game;
  g0.ui.panel('settings');
  await new Promise((r) => setTimeout(r, 400));
  for (let i = 0; i < 7; i++) { document.querySelector('#dev-unlock')?.click(); }
  await new Promise((r) => setTimeout(r, 400));
  const txt = document.querySelector('#modal .body')?.textContent ?? '';
  return { mo: txt.includes('Test'), first: txt.replace(/\s+/g, ' ').slice(0, 90) };
}, wait: 600 };
const runDev = (label) => ({ eval: async (label) => {
  const btn = [...document.querySelectorAll('#modal .item')].find((it) => it.textContent.includes(label))?.querySelector('button');
  btn?.click();
  await new Promise((r) => setTimeout(r, 700));
  return !!btn;
}, args: [label] });
export default [boot, fresh(9 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 200)); } return 1; } },
  { eval: () => { const g = window.__game.g; g.cash = 200000; g.gear['camung'] = 100; return 1; } },
  openDev,
  { shot: 'p29-08-devmenu.png' },
  { label: '① radio', eval: runDev('Radio').eval, args: ['Radio'] }, { wait: 800 },
  read, { shot: 'p29-09-dev-radio.png' },
];
