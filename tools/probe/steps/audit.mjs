// Soát hình học cả thành phố:
//  1) các cặp mặt trùng phẳng, cùng hướng, khác màu/vật liệu → nguồn gốc nhấp nháy (z-fighting);
//  2) biển hiệu bị vật khác che (bắn tia từ mặt biển ra phía trước và tới 3 vị trí người xem dưới đường).
import { boot, fresh } from '../lib.mjs';
import { collect, coplanar, buildGrid, signs } from '../audit_fn.mjs';
const fmt = (s) => `${s.chunk} pos=${s.pos} n=${s.n} ${s.w}x${s.h} front=${s.front}%${s.minT !== null ? ' @' + s.minT + 'm ' + JSON.stringify(s.hitKinds) : ''} views(0,-35,+35)=${s.views}`;
export default [boot, fresh(),
  { eval: collect },
  { label: 'mặt trùng phẳng (bỏ qua vạch kẻ đường vì đã dùng polygonOffset)' },
  { eval: coplanar, args: [{ tol: 0.004, minArea: 0.02, skipKinds: ['marks'] }] },
  { eval: () => { const by = {}; for (const f of window.__cop) { const [, k1, , k2, ax] = f.key.split('|'); const k = k1 + '~' + k2 + ' ' + ax; (by[k] = by[k] || { area: 0, n: 0 }); by[k].area += f.area; by[k].n++; } return Object.entries(by).sort((a, b) => b[1].area - a[1].area).map(([k, v]) => k + ': ' + v.area.toFixed(2) + ' m² / ' + v.n + ' chỗ'); }, max: 4000 },
  { eval: () => window.__cop.slice(0, 15).map((f) => `${f.key} area=${f.area.toFixed(2)} pos=${f.pos} gap=${f.gap} ci=${f.ci} cj=${f.cj}`), max: 6000 },
  { label: 'biển hiệu bị che' },
  { eval: buildGrid, quiet: true },
  { eval: signs, args: [{ minArea: 0.25, front: 3, dist: 9 }] },
  { eval: `window.__signs.filter(s => s.front >= 34).sort((a,b) => b.front - a.front).map(${fmt.toString()})`, max: 12000 },
];
