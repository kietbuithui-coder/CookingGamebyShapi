// Trà đá (và mọi món "nấu/ninh") không cho được nguyên liệu vào nồi — đo bằng CHẠM MÀN HÌNH THẬT.
// Chạy: cd tools/probe && node play.mjs steps/nau59.mjs
import { boot, fresh, rich } from '../lib.mjs';
const OUT = 'fix/';

/** Mở bước nấu của một món có bước `boil` (mặc định trà đá), trả về chén nguyên liệu + toạ độ màn hình của chén. */
const mởNồi = (rid) => {
  const g0 = window.__game, g = g0.g;
  if (g.stall.where !== 'placed') g0.stall.placeAt({ id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 12000, minTier: 1 });
  const r = window.__rec[rid];
  g.rec[rid].known = true; g.rec[rid].on = true;
  for (const st of r.prep) for (const id of (st.adds || [])) window.__give(id, 4, 'store');
  const ok = g0.cook.prep(r);
  return { rid, ok, mode: g0.mode, phase: g0.cook.mini ? g0.cook.mini.constructor.name : null };
};
/** Đọc chén nguyên liệu của ván nấu đang mở + chiếu toạ độ 3D của chén ra màn hình. */
const chén = () => {
  const g0 = window.__game, m = g0.cook.mini;
  if (!m || !m.bowls) return { open: false, lớp: m?.constructor?.name };
  const V = g0.camera.position.constructor;
  const w = (x, z) => {
    const v = g0.cook.world(x, 0.035, z).project(g0.camera);
    return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)];
  };
  return {
    lớp: m.constructor.name, phase: m.phase,
    planeH: +m.planeH.toFixed(3), surf: +(m.surf ?? -1).toFixed(3),
    chén: m.bowls.map((b) => ({ id: b.id, x: +b.x.toFixed(3), z: +b.z.toFixed(3), fly: b.fly, màn: w(b.x, b.z) })),
  };
};
/**
 * Đo độ lệch của tia chạm: chiếu chén ra màn hình rồi hỏi CHÍNH `Cook.local()` xem nó hiểu điểm chạm đó là đâu.
 * Dùng `local` thật (không chép lại công thức) để phép đo luôn khớp mã đang chạy.
 */
const tiaTớiChén = () => {
  const g0 = window.__game, m = g0.cook.mini;
  const b = m.bowls.find((q) => q.fly < 0) || m.bowls[0];
  const v = g0.cook.world(b.x, 0.035, b.z).project(g0.camera);
  const sx = Math.round((v.x + 1) / 2 * innerWidth), sy = Math.round((1 - v.y) / 2 * innerHeight);
  const hit = g0.cook.local(sx, sy);
  return { chén: b.id, chạmMàn: [sx, sy], mongMuốn: [+b.x.toFixed(3), +b.z.toFixed(3)], nhậnĐược: [+hit.x.toFixed(3), +hit.z.toFixed(3)], lệch: +Math.hypot(hit.x - b.x, hit.z - b.z).toFixed(3), bánKínhĂn: 0.11 };
};
/** Cho cả 1 nguyên liệu vào bằng đường dữ liệu, để đi tiếp tới bước giữ lửa. */
const choHếtBằngChuột = () => {
  const m = window.__game.cook.mini;
  for (const b of m.bowls) if (b.fly < 0) m.down({ x: b.x, y: 0, z: b.z });
  return { phase: m.phase };
};
const choHếtBằngChạm = () => {
  const m = window.__game.cook.mini;
  for (const b of m.bowls) if (b.fly < 0) m.down({ x: b.x, y: 0, z: b.z });
  return { phase: m.phase, fly: m.bowls.map((b) => b.fly) };
};
const pump = (n = 60) => { for (let i = 0; i < n; i++) window.__game.cook.update(0.05); return n; };
const đọc = () => { const g0 = window.__game, g = g0.g; return { mode: g0.mode, lớp: g0.cook.mini?.constructor?.name, scores: g0.cook.scores?.map((v) => +v.toFixed(2)), cóTrà: g.stall.store.filter((s) => s.id === 'tra').map((s) => s.n) }; };

export default [boot, fresh(9 * 60), rich,
  { label: '① mở bước nấu trà đá (Pha trà)' },
  { eval: (mởNồi) => eval('(' + mởNồi + ')')('tra_da'), args: [mởNồi.toString()], wait: 1200 },
  { eval: (chén) => eval('(' + chén + ')()'), args: [chén.toString()] },
  { eval: (tiaTớiChén) => eval('(' + tiaTớiChén + ')()'), args: [tiaTớiChén.toString()] },
  { shot: OUT + 'nau59_truoc' },
  { label: '② CHẠM THẬT vào chén “Trà khô” trên màn hình' },
  { tapsEval: (src) => { const r = eval('(' + src + ')()'); return r.chén.map((c) => c.màn); }, args: [chén.toString()], gap: 500 },
  { eval: (chén) => eval('(' + chén + ')()'), args: [chén.toString()] },
  { label: '③ nếu chén chưa bay: chạm lần 2, 3 như người chơi thật vẫn làm' },
  { tapsEval: (src) => { const r = eval('(' + src + ')()'); return r.chén.filter((c) => c.fly < 0).map((c) => c.màn); }, args: [chén.toString()], gap: 500 },
  { eval: (chén) => eval('(' + chén + ')()'), args: [chén.toString()] },
  { shot: OUT + 'nau59_sau' },
  { label: '④ nếu vẫn kẹt: đẩy nguyên liệu vào bằng đường dữ liệu rồi xem bước giữ lửa có chạy' },
  { eval: (choHếtBằngChuột) => eval('(' + choHếtBằngChuột + ')()'), args: [choHếtBằngChuột.toString()], wait: 800 },
  { eval: (pump) => eval('(' + pump + ')')(40), args: [pump.toString()], quiet: true },
  { eval: () => { const m = window.__game.cook.mini; return { phase: m.phase, prog: +(m.prog ?? 0).toFixed(2), nhiệt: +(m.heat?.temp ?? 0).toFixed(2), nút: [...document.querySelectorAll('#cook .btns button')].map((b) => b.innerText) }; } },
  { shot: OUT + 'nau59_giu_lua' },
  { label: '⑤ bấm LỌC RA khi vừa đậm → phải ra món' },
  { eval: () => { const m = window.__game.cook.mini; m.prog = 0.95; m.btn('done', true); return { kếtQuả: +(m.result ?? -1).toFixed(2) }; } },
  { eval: (pump) => eval('(' + pump + ')')(60), args: [pump.toString()], quiet: true },
  { eval: (đọc) => eval('(' + đọc + ')()'), args: [đọc.toString()] },
];
