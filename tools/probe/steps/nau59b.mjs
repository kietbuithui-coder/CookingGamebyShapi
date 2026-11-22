// Lượt 59 — soát độ chính xác của tia chạm ở MỌI mini game nấu nướng, và chạm thật để chắc thao tác ăn.
// Chạy: cd tools/probe && node play.mjs steps/nau59b.mjs
import { boot, fresh, rich } from '../lib.mjs';
const OUT = 'fix/';

/** Mở một bước nấu/sơ chế của món; trả về lớp mini game đang chạy. */
const mở = (rid, kind) => {
  const g0 = window.__game, g = g0.g;
  if (g.stall.where !== 'placed') g0.stall.placeAt({ id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 12000, minTier: 1 });
  const r = window.__rec[rid];
  g.rec[rid].known = true; g.rec[rid].on = true;
  for (const st of r.prep) for (const id of (st.adds || [])) window.__give(id, 4, 'store');
  for (const st of r.finish) for (const id of (st.adds || [])) window.__give(id, 4, 'store');
  const ok = kind === 'prep' ? g0.cook.prep(r) : g0.cook.finish(r);
  return { rid, kind, ok, lớp: g0.cook.mini?.constructor?.name };
};
/**
 * Đo độ lệch chung: lấy toạ độ màn hình của một điểm đồ vật (x,z ở độ cao y) rồi hỏi `Cook.local()`
 * xem nó hiểu điểm chạm đó là đâu. `local` là hàm private nhưng truy cập được từ ngoài (JS không chặn).
 */
const lệchTại = (x, z, y) => {
  const g0 = window.__game, m = g0.cook.mini;
  const v = g0.cook.world(x, y, z).project(g0.camera);
  const sx = Math.round((v.x + 1) / 2 * innerWidth), sy = Math.round((1 - v.y) / 2 * innerHeight);
  const p = g0.cook.local(sx, sy);
  return { màn: [sx, sy], hiểuLà: [+p.x.toFixed(3), +p.z.toFixed(3)], lệch: +Math.hypot(p.x - x, p.z - z).toFixed(3) };
};
/** Cho đủ nguyên liệu của công thức vào kho quầy (mọi bước prep + finish). */
const đủĐồ = (rid) => {
  const r = window.__rec[rid], g = window.__game.g;
  for (const [id, per] of Object.entries(r.ings)) window.__give(id, Math.max(3, Math.ceil(per * 4)), 'store');
  for (const st of [...r.prep, ...r.finish]) for (const id of (st.adds || [])) window.__give(id, 4, 'store');
  return { rid, ings: Object.keys(r.ings).length, cóNồi: Object.keys(g.gear).filter((k) => g.gear[k]) };
};
/** Sơ chế sẵn (đánh dấu đã làm) để `finish` mở được bước cuối. */
const sơChếSẵn = (rid) => {
  const g = window.__game.g;
  g.stall.preps = g.stall.preps.filter((p) => p.rid !== rid);
  g.stall.preps.push({ rid, n: 4, q: 0.92, at: g.day * 1440 + g.min, cost: 2000 });
  return g.stall.preps.map((p) => p.rid);
};
/** Nút và gợi ý đang hiện để biết ván có chạy. */
const trạngThái = () => {
  const m = window.__game.cook.mini;
  return { lớp: m?.constructor?.name, nút: [...document.querySelectorAll('#cook .btns button')].map((b) => b.innerText), hint: document.querySelector('#cook .hint')?.innerText?.slice(0, 60) };
};
const pump = (n = 30) => { for (let i = 0; i < n; i++) window.__game.cook.update(0.05); return n; };

export default [boot, fresh(9 * 60), rich,
  // ───────────── THÁI / BĂM ─────────────
  { label: '① THÁI: chạm → kéo → thả ở vạch vàng phải ăn (thái hành lá)' },
  { eval: (đủĐồ) => eval('(' + đủĐồ + ')')('bap_nuong'), args: [đủĐồ.toString()] },
  { eval: (mở) => eval('(' + mở + ')')('bap_nuong', 'prep'), args: [mở.toString()], wait: 1000 },
  { eval: (trạngThái) => eval('(' + trạngThái + ')()'), args: [trạngThái.toString()] },
  { eval: (lệchTại) => { const g0 = window.__game, m = g0.cook.mini; if (!m.guides) return { bỏ: m.constructor.name }; const gx = m.guides[0]; const r = eval('(' + lệchTại + ')')(gx, 0, 0.03); const before = m.used[0]; m.down({ x: r.hiểuLà[0], y: 0, z: r.hiểuLà[1] }); m.up(); return { lớp: 'CutGame', vạch: +gx.toFixed(3), ...r, ăn: m.used[0] !== before }; }, args: [lệchTại.toString()] },

  // ───────────── CHIÊN ─────────────
  { label: '② CHIÊN: vuốt lên để đảo + bấm Đảo/Nhấc chảo phải ăn' },
  { eval: () => { const g0 = window.__game; g0.cook.abort?.(); return 'ok'; } },
  { eval: (đủĐồ) => eval('(' + đủĐồ + ')')('ca_vien_chien'), args: [đủĐồ.toString()] },
  { eval: (mở) => eval('(' + mở + ')')('ca_vien_chien', 'finish'), args: [mở.toString()], wait: 1000 },
  { eval: (trạngThái) => eval('(' + trạngThái + ')()'), args: [trạngThái.toString()] },
  { eval: () => {
    const g0 = window.__game, m = g0.cook.mini;
    if (m.constructor.name !== 'FryGame') return { bỏ: m.constructor.name };
    // vuốt lên trên chảo = chạm ở dưới rồi nhấc lên (sy giảm > 34 px)
    const before = m.tossN;
    m.cookV = 0.45;   // đủ chín để cử chỉ đảo được tính (đảo sớm thì game cố ý báo "Còn sớm")
    m.down({ x: 0, y: 0, z: 0 }, 200, 260); m.up(null, 200, 200);
    return { lớp: 'FryGame', tossTrước: before, tossSau: m.tossN, đảoĐược: m.tossN > before };
  } },
  { eval: (pump) => eval('(' + pump + ')')(20), args: [pump.toString()], quiet: true },

  // ───────────── NƯỚNG ─────────────
  { label: '③ NƯỚNG: chạm đúng món để lật' },
  { eval: () => { window.__game.cook.abort?.(); return 'ok'; } },
  { eval: (đủĐồ, sơChếSẵn) => { const r = eval('(' + đủĐồ + ')')('bap_nuong'); eval('(' + sơChếSẵn + ')')('bap_nuong'); return r; }, args: [đủĐồ.toString(), sơChếSẵn.toString()] },
  { eval: (mở) => eval('(' + mở + ')')('bap_nuong', 'finish'), args: [mở.toString()], wait: 1000 },
  { eval: () => { const g0 = window.__game, m = g0.cook.mini; if (!m.items) return { bỏ: m.constructor.name }; const it = m.items[0]; const v = g0.cook.world(it.x, 0.2, 0).project(g0.camera); const sx = Math.round((v.x + 1) / 2 * innerWidth), sy = Math.round((1 - v.y) / 2 * innerHeight); const p = g0.cook.local(sx, sy); const before = it.down; m.down(p); return { lớp: 'GrillGame', nhậnĐược: [+p.x.toFixed(3), +p.z.toFixed(3)], mónX: +it.x.toFixed(3), lật: before !== it.down }; } },
  { eval: (pump) => eval('(' + pump + ')')(20), args: [pump.toString()], quiet: true },

  // ───────────── NẤU / PHA (trọng tâm lỗi) ─────────────
  { label: '④ NẤU: chạm THẬT từng chén vào nồi (trà đá) — trước lượt 59 không ăn chén nào' },
  { eval: () => { window.__game.cook.abort?.(); return 'ok'; } },
  { eval: (mở) => eval('(' + mở + ')')('tra_da', 'prep'), args: [mở.toString()], wait: 1000 },
  { label: '   (chờ camera đứng yên rồi mới chạm — camera trượt vào bàn nấu mất ~1 s)' },
  { waitFor: () => {
      // Chờ tới khi CHÍNH toạ độ màn hình của chén đứng yên: camera trượt vào bàn nấu, chiếu sớm là chạm ra ngoài màn hình.
      const g0 = window.__game, m = g0.cook.mini;
      if (!m || !m.bowls) return false;
      const b = m.bowls[0], v = g0.cook.world(b.x, 0.035, b.z).project(g0.camera);
      const p = [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)];
      const prev = window.__p0;
      window.__p0 = p;
      return !!prev && Math.abs(prev[0] - p[0]) <= 1 && Math.abs(prev[1] - p[1]) <= 1 && p[1] > 0 && p[1] < innerHeight;
    }, timeout: 20000 },
  { wait: 700 },
  { tapsEval: () => { const g0 = window.__game, m = g0.cook.mini; return m.bowls.map((b) => { const v = g0.cook.world(b.x, 0.035, b.z).project(g0.camera); return [Math.round((v.x + 1) / 2 * innerWidth), Math.round((1 - v.y) / 2 * innerHeight)]; }); }, gap: 500 },
  { eval: () => { const m = window.__game.cook.mini; return { phase: m.phase, fly: m.bowls.map((b) => b.fly), nút: [...document.querySelectorAll('#cook .btns button')].map((b) => b.innerText) }; } },
  { eval: (pump) => eval('(' + pump + ')')(40), args: [pump.toString()], quiet: true },
  { shot: OUT + 'nau59b_noi' },

  // ───────────── TRÌNH BÀY (đĩa/ly) ─────────────
  { label: '⑤ TRÌNH BÀY: chạm từng chén theo phiếu (trà đá — lớp đá)' },
  { eval: () => { window.__game.cook.abort?.(); return 'ok'; } },
  { eval: (đủĐồ, sơChếSẵn) => { const r = eval('(' + đủĐồ + ')')('tra_da'); eval('(' + sơChếSẵn + ')')('tra_da'); return r; }, args: [đủĐồ.toString(), sơChếSẵn.toString()] },
  { eval: (mở) => eval('(' + mở + ')')('tra_da', 'finish'), args: [mở.toString()], wait: 1000 },
  { eval: () => { const g0 = window.__game, m = g0.cook.mini; if (!m.bowls) return { bỏ: m.constructor.name }; const b = m.bowls.find((q) => q.li === m.cur) || m.bowls[0]; const v = g0.cook.world(b.x, 0.03, b.z).project(g0.camera); const sx = Math.round((v.x + 1) / 2 * innerWidth), sy = Math.round((1 - v.y) / 2 * innerHeight); const p = g0.cook.local(sx, sy); const before = m.cur; m.down(p); return { lớp: 'AssembleGame', hiểuLà: [+p.x.toFixed(3), +p.z.toFixed(3)], chén: [+b.x.toFixed(3), +b.z.toFixed(3)], lệch: +Math.hypot(p.x - b.x, p.z - b.z).toFixed(3), ăn: m.cur !== before }; } },

  // ───────────── RỬA CHÉN ─────────────
  { label: '⑥ RỬA CHÉN: chà miếng rửa lên vết bẩn phải sạch dần' },
  { eval: () => { window.__game.cook.abort?.(); const g0 = window.__game; g0.acts.dishes(); return g0.mode; }, wait: 1200 },
  { eval: () => { const g0 = window.__game, m = g0.cook.mini; if (!m.dirt) return { bỏ: m.constructor.name }; const d = m.dirt[0]; const v = g0.cook.world(d.position.x, 0.03, d.position.z).project(g0.camera); const sx = Math.round((v.x + 1) / 2 * innerWidth), sy = Math.round((1 - v.y) / 2 * innerHeight); const p = g0.cook.local(sx, sy); const hp0 = d.userData.hp; m.down(p); m.move(p); return { lớp: 'WashGame', hiểuLà: [+p.x.toFixed(3), +p.z.toFixed(3)], vếtBẩn: [+d.position.x.toFixed(3), +d.position.z.toFixed(3)], lệch: +Math.hypot(p.x - d.position.x, p.z - d.position.z).toFixed(3), hpTrước: +hp0.toFixed(2), hpSau: +d.userData.hp.toFixed(2) }; } },

  // ───────────── TRỘN TOPPING (lượt 58) ─────────────
  { label: '⑦ TRỘN: chạm đúng đĩa đang gọi (bánh tráng trộn)' },
  { eval: () => { window.__game.cook.abort?.(); return 'ok'; } },
  { eval: (đủĐồ, sơChếSẵn) => { const r = eval('(' + đủĐồ + ')')('banh_trang_tron'); eval('(' + sơChếSẵn + ')')('banh_trang_tron'); return r; }, args: [đủĐồ.toString(), sơChếSẵn.toString()] },
  { eval: (mở) => eval('(' + mở + ')')('banh_trang_tron', 'finish'), args: [mở.toString()], wait: 1000 },
  { eval: () => { const m = window.__game.cook.mini; if (!m.spots) return { bỏ: m.constructor.name }; const s = m.spots.find((p) => p.li === m.calls[m.k]); const before = m.k; m.down({ x: s.x, y: 0, z: s.z }); return { lớp: 'TronGame', kTrước: before, kSau: m.k, miss: m.miss }; } },
];
