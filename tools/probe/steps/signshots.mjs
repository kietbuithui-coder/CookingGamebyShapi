import { boot, fresh } from '../lib.mjs';
import { collect, buildGrid, signs } from '../audit_fn.mjs';
const picks = JSON.parse(process.env.PICKS || '[]');   // danh sách [x,y,z] gần đúng của biển cần chụp; rỗng = tự chọn
const N = +(process.env.N || 12), dist = +(process.env.DIST || 10), mode = process.env.MODE || 'front';
const steps = [boot, fresh(12 * 60),
  { eval: () => { const g0 = window.__game; g0.ui.hud(false); document.querySelector('#ui').style.display = 'none'; g0.set.quality = 2; g0.applyQuality(); return 1; }, quiet: true },
  { eval: collect, quiet: true }, { eval: buildGrid, quiet: true }, { eval: signs, args: [{ minArea: 0.25, front: 3, dist: 9 }] },
  { eval: (picks, N, mode) => {
      let list = window.__signs.slice();
      if (picks.length) list = picks.map((p) => list.slice().sort((a, b) => Math.hypot(a.pos[0] - p[0], a.pos[1] - p[1], a.pos[2] - p[2]) - Math.hypot(b.pos[0] - p[0], b.pos[1] - p[1], b.pos[2] - p[2]))[0]);
      else if (mode === 'front') list = list.filter((s) => s.front > 0).sort((a, b) => b.front - a.front);
      else if (mode === 'view') list = list.filter((s) => s.views[0] > 0).sort((a, b) => b.views[0] - a.views[0]);
      else if (mode === 'all') list = list.sort((a, b) => a.chunk.localeCompare(b.chunk) || a.pos[0] - b.pos[0]);
      window.__pick = list.slice(+(window.__skip || 0), +(window.__skip || 0) + N);
      return window.__pick.map((s, i) => i + ': ' + s.chunk + ' ' + s.pos + ' n=' + s.n + ' ' + s.w + 'x' + s.h + ' front=' + s.front + ' views=' + s.views);
    }, args: [picks, N, mode], max: 6000 },
];
for (let i = 0; i < N; i++) steps.push({ eval: (i, dist) => { const s = window.__pick[i]; if (!s) return null; const ex = s.pos[0] + s.n[0] * dist, ez = s.pos[2] + s.n[2] * dist; window.__cam(ex, 1.6, ez, s.pos[0], s.pos[1], s.pos[2]); return i; }, args: [i, dist], quiet: true, wait: 1400, shot: `sg_${String(i).padStart(2, '0')}` });
export default steps;
