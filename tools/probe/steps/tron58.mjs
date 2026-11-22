// Lượt 58 — mini game bánh tráng trộn: 5 topping rải NGẪU NHIÊN mỗi ván, máy gọi tên từng thứ.
// Chạy: cd tools/probe && node play.mjs steps/tron58.mjs
import { boot, fresh, rich } from '../lib.mjs';
const OUT = 'fix/';
/** Đọc ván đang mở: toạ độ 5 đĩa + thứ tự gọi + đang ở lượt nào. */
const ván = () => {
  const m = window.__game.cook.current;
  if (!m || !m.spots) return { open: false };
  return { open: true, spots: m.spots.map((s) => [+s.x.toFixed(3), +s.z.toFixed(3), s.li]), calls: m.calls.slice(), k: m.k, miss: m.miss, left: +m.left.toFixed(2) };
};
/** Chạm đúng đĩa đang được gọi (đi đúng đường của ngón tay: chạm vào mặt bàn). */
const bấm = () => {
  const m = window.__game.cook.current;
  if (!m || !m.spots || m.k >= m.calls.length) return { đãXong: true };
  const want = m.calls[m.k], s = m.spots.find((p) => p.li === want);
  m.down({ x: s.x, y: 0, z: s.z });
  return { want, at: [+s.x.toFixed(3), +s.z.toFixed(3)], k: m.k, miss: m.miss };
};
/** Chạm SAI một đĩa (đĩa không phải thứ đang được gọi). */
const bấmSai = () => {
  const m = window.__game.cook.current, want = m.calls[m.k], s = m.spots.find((p) => p.li !== want);
  const before = { k: m.k, miss: m.miss };
  m.down({ x: s.x, y: 0, z: s.z });
  return { chạm: s.li, đangGọi: want, trước: before, sau: { k: m.k, miss: m.miss } };
};
/** Đẩy khung hình cho game (máy chạy WebGL phần mềm rất chậm, chờ thật thì lâu). */
const pump = (n = 60) => { for (let i = 0; i < n; i++) window.__game.cook.update(0.05); return n; };
const mởVán = () => {
  const g0 = window.__game, g = g0.g;
  if (g.stall.where !== 'placed') g0.stall.placeAt({ id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 12000, minTier: 1 });
  g.rec.banh_trang_tron.known = true; g.rec.banh_trang_tron.on = true;
  for (const id of ['dauphong', 'tuongot', 'chanh']) if (![g.stall.store, g.bag].some((l) => l.some((st) => st.id === id && st.n > 0))) window.__give(id, 4, 'store');
  g.stall.preps.push({ rid: 'banh_trang_tron', n: 1, q: 0.92, at: g.day * 1440 + g.min, cost: 2600 });
  g0.stall.refresh(); g0.cook.finish(window.__rec.banh_trang_tron);
  return { mode: g0.mode, ready: window.__R.readyCount(g, 'banh_trang_tron') };
};
export default [boot, fresh(9 * 60), rich,
  { label: '① mở bánh tráng trộn — ván 1' },
  { eval: mởVán, wait: 1000 },
  { eval: (ván) => eval('(' + ván + ')()'), args: [ván.toString()], max: 900 },
  { label: '② chụp màn hình: 5 đĩa rải ngẫu nhiên, vòng vàng đánh dấu đĩa đang gọi' },
  { eval: () => { document.querySelector('#quest')?.classList.add('hide'); document.querySelector('#toasts')?.classList.add('hide'); return { card: document.querySelector('#cook .card').innerText.replace(/\n/g, ' | ') }; }, wait: 1200 },
  { shot: OUT + 'tron58_ban' },
  { label: '③ chạm SAI: bị trừ điểm, không được tính là xong lượt' },
  { eval: bấmSai },
  { label: '④ để hết giờ một lượt: cũng bị trừ điểm và tự sang lượt sau' },
  { eval: () => { const m = window.__game.cook.current; m.left = 0.05; return { k: m.k, miss: m.miss }; }, wait: 700 },
  { eval: () => { const m = window.__game.cook.current; return { k: m.k, miss: m.miss, left: +m.left.toFixed(2) }; } },
  { label: '⑤ bấm đúng nốt phần còn lại của ván 1' },
  { eval: (bấm, n) => { const out = []; for (let i = 0; i < n; i++) out.push(eval('(' + bấm + ')()')); return out.map((o) => `${o.want}@k${o.k}`).join(' '); }, args: [bấm.toString(), 10], max: 600 },
  { eval: (pump) => eval('(' + pump + ')')(80), args: [pump.toString()], quiet: true },
  { eval: () => { const g0 = window.__game, g = g0.g; return { mode: g0.mode, đãRaMón: g.stall.ready.filter((r) => r.rid === 'banh_trang_tron').map((r) => +r.q.toFixed(2)), cònSơChế: g.stall.preps.filter((p) => p.rid === 'banh_trang_tron').length }; } },
  { label: '⑥ ván 2: vị trí 5 đĩa phải khác ván 1' },
  { eval: mởVán, wait: 1000 },
  { eval: (ván) => eval('(' + ván + ')()'), args: [ván.toString()], max: 900 },
  { label: '⑦ bấm đúng hết ván 2 (không sai) rồi xem điểm' },
  { eval: (bấm, n) => { for (let i = 0; i < n; i++) eval('(' + bấm + ')()'); return 'ok'; }, args: [bấm.toString(), 10], quiet: true },
  { eval: () => { const m = window.__game.cook.current; return m ? { đangChấm: true, miss: m.miss } : { xong: true }; }, wait: 600 },
  { eval: (pump) => eval('(' + pump + ')')(80), args: [pump.toString()], quiet: true },
  { eval: () => { const g0 = window.__game, g = g0.g; return { mode: g0.mode, đãRaMón: g.stall.ready.filter((r) => r.rid === 'banh_trang_tron').map((r) => +r.q.toFixed(2)), cònSơChế: g.stall.preps.filter((p) => p.rid === 'banh_trang_tron').length }; } },
  { label: '⑧ chụp thành phẩm trong hộp (ván vừa trộn xong)' },
  { eval: mởVán, wait: 900 },
  { eval: (bấm, n) => { for (let i = 0; i < n; i++) eval('(' + bấm + ')()'); return 'bấm đủ 10 lượt'; }, args: [bấm.toString(), 10], quiet: false },
  { wait: 500 },
  { eval: () => { const g0 = window.__game, V3 = g0.camera.position.constructor, w = g0.cook.world(0, 0.05, 0.32);
      g0.cook.frameCam = () => {};   // giữ camera cận cảnh cho khung ảnh này
      g0.player.view(new V3(w.x, w.y + 0.24, w.z + 0.3), new V3(w.x, w.y, w.z)); return [+w.x.toFixed(2), +w.z.toFixed(2)]; }, quiet: true, wait: 900 },
  { shot: OUT + 'tron58_thanh_pham' },
  { label: '⑨ món bánh tráng trộn vẫn ra được món và điểm ván 2 thế nào' },
  { eval: () => { const g0 = window.__game, g = g0.g; return { điểmCácBước: g0.cook.scores ? g0.cook.scores.map((v) => +v.toFixed(2)) : 'private', khay: g.stall.ready.map((r) => `${r.rid}:${r.n}`) }; } },
];
