// Lượt 61 — "sơ chế trà đá vẫn lỗi": đo ở ĐÚNG khổ màn hình rộng như ảnh người chơi gửi (1568×780),
// và chạm vào viên trà xanh (chỗ ngón tay chạm) chứ không chỉ tâm đĩa.
// Chạy: cd tools/probe && W=1568 H=780 DESKTOP=1 node play.mjs steps/nau60.mjs
import { boot, fresh, rich } from '../lib.mjs';
// PREP=tra_da hoặc tra_chanh
const OUT = 'fix/';

const mởNồi = (rid) => {
  const g0 = window.__game, g = g0.g;
  if (g.stall.where !== 'placed') g0.stall.placeAt({ id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 12000, minTier: 1 });
  if (!g.rec[rid]) g.rec[rid] = { known: false, on: false };
  g.rec[rid].known = true; g.rec[rid].on = true;
  for (const [id, n] of Object.entries(window.__rec[rid].ings)) window.__give(id, Math.ceil(n * 24) + 2, 'store');
  return { rid, ok: g0.cook.prep(window.__rec[rid]), lớp: g0.cook.mini?.constructor?.name };
};
/** Chiếu một điểm 3D trên bàn bếp ra toạ độ màn hình. */
const chiếu = (x, y, z) => {
  const g0 = window.__game, v = g0.cook.world(x, y, z).project(g0.camera);
  return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)];
};
/** Đo độ lệch khi chạm vào đĩa ở từng độ cao (đĩa ~0,03 · tâm viên trà ~0,06 · mặt trên ~0,09). */
const lệch = () => {
  const ch = (x, y, z) => { const g0 = window.__game, v = g0.cook.world(x, y, z).project(g0.camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; };
  const g0 = window.__game, m = g0.cook.mini, b = m.bowls[0];
  const out = {};
  for (const y of [0.03, 0.06, 0.09]) {
    const [sx, sy] = ch(b.x, y, b.z);
    const p = g0.cook.local(sx, sy);
    out['y' + y] = { màn: [sx, sy], hiểuLà: [+p.x.toFixed(3), +p.z.toFixed(3)], lệch: +Math.hypot(p.x - b.x, p.z - b.z).toFixed(3) };
  }
  out.đĩa = [+b.x.toFixed(3), +b.z.toFixed(3)];
  out.cửaSổ = [innerWidth, innerHeight];
  out.planeH = m.planeH; out.planes = m.planes;
  return out;
};
/** Chạm vào TÂM VIÊN TRÀ (không phải tâm đĩa) — đúng như người chơi chạm. */
const chạmViênTrà = () => { const ch = (x, y, z) => { const g0 = window.__game, v = g0.cook.world(x, y, z).project(g0.camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; }; const m = window.__game.cook.mini, b = m.bowls[0]; return [ch(b.x, 0.06, b.z)]; };
const trạngThái = () => { const m = window.__game.cook.mini; return { phase: m.phase, fly: m.bowls.map((b) => b.fly) }; };
const pump = (n = 40) => { for (let i = 0; i < n; i++) window.__game.cook.update(0.05); return n; };

const PREP = process.env.PREP || 'tra_da';
export default [boot, fresh(9 * 60), rich,
  { label: '① mở nồi trà đá ở khổ 1568×780' },
  { eval: (src, rid) => eval('(' + src + ')(' + JSON.stringify(rid) + ')'), args: [mởNồi.toString(), PREP], wait: 1500 },
  { label: '   chờ camera đứng yên' },
  { waitFor: () => {
      const g0 = window.__game, m = g0.cook.mini;
      if (!m || !m.bowls) return false;
      const b = m.bowls[0], v = g0.cook.world(b.x, 0.06, b.z).project(g0.camera);
      const p = [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)];
      const prev = window.__p0; window.__p0 = p;
      return !!prev && Math.abs(prev[0] - p[0]) <= 1 && Math.abs(prev[1] - p[1]) <= 1 && p[1] > 0 && p[1] < innerHeight;
    }, timeout: 20000 },
  { eval: (lệch) => eval('(' + lệch + ')()'), args: [lệch.toString()], max: 1200 },
  { shot: OUT + 'nau60_truoc' },
  { label: '② CHẠM THẬT vào viên trà xanh' },
  { wait: 600 },
  { tapsEval: (src) => eval('(' + src + ')()'), args: [chạmViênTrà.toString()], gap: 500 },
  { eval: (trạngThái) => eval('(' + trạngThái + ')()'), args: [trạngThái.toString()] },
  { label: '③ BẤM CHUỘT THẬT (máy tính) vào cùng chỗ' },
  { clickEval: (src) => eval('(' + src + ')()'), args: [chạmViênTrà.toString()], gap: 400 },
  { eval: (trạngThái) => eval('(' + trạngThái + ')()'), args: [trạngThái.toString()] },
  { label: '   chạm thêm 3 lần như người chơi vẫn làm' },
  { tapsEval: (src) => eval('(' + src + ')()'), args: [chạmViênTrà.toString()], gap: 500 },
  { eval: (trạngThái) => eval('(' + trạngThái + ')()'), args: [trạngThái.toString()] },
  { shot: OUT + 'nau60_sau' },
];
