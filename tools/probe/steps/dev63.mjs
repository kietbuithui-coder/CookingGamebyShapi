// Lượt 63 — menu ẩn chỉ còn nhóm “Địa điểm — tele nhanh”, không còn mục test nào.
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
const moMenu = () => { const g0 = window.__game; g0.ui.panel('settings'); const u = document.querySelector('#dev-unlock');
  for (let i = 0; i < 7; i++) u.click(); for (const d of '7777') document.querySelector(`[data-pin="${d}"]`)?.click();
  const secs = [...document.querySelectorAll('#modal .body h4')].map((h) => h.innerText);
  const ids = [...document.querySelectorAll('[data-a="devRun"]')].map((b) => b.dataset.k);
  return { mở: ids.length > 0, tiêuĐề: secs, sốMục: ids.length, mụcTest: ids.filter((k) => !k.startsWith('tp_')), mẫu: ids.slice(0, 4) }; };
const bấm = (id) => { const b = document.querySelector(`[data-a="devRun"][data-k="${id}"]`); if (!b) return 'không thấy ' + id; b.click(); return 'bấm ' + id; };
const ởĐâu = () => ({ x: +window.__game.player.x.toFixed(1), z: +window.__game.player.z.toFixed(1) });
export default [boot, fresh(9 * 60),
  { label: '① mở menu ẩn — chỉ còn nhóm Địa điểm' },
  { eval: (s) => eval('(' + s + ')()'), args: [moMenu.toString()], max: 1500 },
  { shot: OUT + 'dev63_menu' },
  { label: '② một mục tele vẫn chạy được' },
  { eval: (s) => eval('(' + s + ')')('tp_cv'), args: [bấm.toString()], wait: 1500 },
  { eval: (s) => eval('(' + s + ')()'), args: [ởĐâu.toString()] },
];
