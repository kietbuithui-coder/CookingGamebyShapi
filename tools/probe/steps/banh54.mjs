// Lượt 54: tiệm bánh bán thêm 5 loại bánh (no + vui theo giá), nước tăng lực Shapi ở MiniMart/Tạp hoá.
// Bấm bằng toạ độ THẬT trên màn hình: đi trong tiệm, bấm vào ô hàng, đưa người bán tính tiền, rồi uống.
import { boot, fresh } from '../lib.mjs';
/** Đứng trước mặt người bán + nhìn vào chỗ bán (không dùng tele của menu ẩn). */
const goShop = (anchor, ox = 0, oz = 1.9) => ({ eval: (anchor, ox, oz) => {
  const g0 = window.__game, a = g0.world.anchors[anchor];
  if (!a) return 'thiếu neo ' + anchor;
  g0.player.place(a.x + ox, a.z + oz, a.yaw + Math.PI);
  g0.mode = 'play';
  return { anchor, at: [+g0.player.x.toFixed(1), +g0.player.z.toFixed(1)] };
}, args: [anchor, ox, oz], wait: 700 });
/** Đứng cách ô hàng 1 m về phía khách (hướng từ neo người bán ra ô), rồi quay mặt vào ô.
 *  Đúng luật chạm: `TAP_REACH = 1,3 m` — đứng xa hơn thì bấm vào ô không ăn. */
const standAt = (shop, idx, dist = 1.0) => ({ eval: (shop, idx, dist) => {
  const g0 = window.__game, a = g0.world.anchors['v_' + shop];
  const s = g0.world.slots.find((x) => x.shop === shop && x.idx === idx);
  if (!a || !s) return 'thiếu ô hoặc neo';
  const dx = a.x - s.x, dz = a.z - s.z, L = Math.hypot(dx, dz) || 1;
  const px = s.x + (dx / L) * dist, pz = s.z + (dz / L) * dist;
  // Cúi camera xuống đúng ô hàng (ô ở độ cao ~1 m, mắt 1,6 m) — nếu không thì ô nằm ngoài màn hình
  // hình ngang 844×390 và ngón tay bấm ra ngoài khung.
  const pitch = -Math.atan2(1.6 - s.y, dist);
  g0.player.place(px, pz, Math.atan2(s.x - px, s.z - pz), pitch);
  g0.mode = 'play';
  return { px: +px.toFixed(2), pz: +pz.toFixed(2), d: +Math.hypot(s.x - px, s.z - pz).toFixed(2), pitch: +pitch.toFixed(2) };
}, args: [shop, idx, dist], wait: 700 });
/** Chiếu ô hàng ra toạ độ màn hình để bấm bằng ngón tay thật. */
const tapSlot = (shop, idx) => ({ tapsEval: (shop, idx) => {
  const g0 = window.__game, s = g0.world.slots.find((x) => x.shop === shop && x.idx === idx);
  const p = window.__proj({ x: s.x, y: s.y, z: s.z });
  const ok = p[0] > 8 && p[0] < innerWidth - 8 && p[1] > 8 && p[1] < innerHeight - 8;
  return ok ? [p] : [];
}, args: [shop, idx], gap: 400, wait: 500 });
/** Đứng lùi 3 m nhìn ngang quầy (để chụp ảnh cả sạp bánh), không nhắm vào một ô cụ thể. */
const viewShop = (shop, dist = 3.0, dy = 0, side = 0) => ({ eval: (shop, dist, dy, side) => {
  const g0 = window.__game, a = g0.world.anchors['v_' + shop];
  const sl = g0.world.slots.filter((x) => x.shop === shop);
  const cx = sl.reduce((s, x) => s + x.x, 0) / sl.length, cz = sl.reduce((s, x) => s + x.z, 0) / sl.length;
  const dx = a.x - cx, dz = a.z - cz, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
  // lệch sang bên để người bán không che mất hàng trên quầy
  const px = cx + ux * dist - uz * side, pz = cz + uz * dist + ux * side, ty = 0.85 + dy;
  g0.player.place(px, pz, Math.atan2(cx - px, cz - pz), -Math.atan2(1.6 - ty, Math.hypot(cx - px, cz - pz)));
  g0.mode = 'play'; return 1;
}, args: [shop, dist, dy, side], wait: 800 });
const cartNow = { eval: () => ({ cart: window.__game.acts.cart ? window.__game.acts.cart.lines.map((l) => l.n + 'x' + l.id) : null, total: window.__game.acts.cart ? window.__game.acts.cartTotal() : 0 }) };
const payNow = (shop) => ({ eval: (shop) => {
  const g0 = window.__game;
  const t = g0.npcs.list.find((n) => n.fixedId === shop && !n.hidden);
  if (!t) return 'không thấy người bán ' + shop;
  g0.acts.talk(t);
  const d = g0.ui.$('dlg');
  const pay = [...d.querySelectorAll('button')].find((b) => /Trả tiền/.test(b.innerText));
  if (pay) pay.click();
  return { clicked: !!pay, opts: [...d.querySelectorAll('button')].map((b) => b.innerText.split('\n')[0]).slice(0, 4) };
}, args: [shop], wait: 800 });
export default [boot, fresh(9 * 60),
  { eval: () => { const g0 = window.__game; g0.g.cash = 300000; return g0.g.cash; }, quiet: true },

  { label: '① tiệm bánh đã đổi tên và bán 6 loại bánh' },
  { eval: () => ({ name: 'Tiệm bánh Anh Bảo', anchor: !!window.__game.world.anchors.v_bakery }) },
  goShop('v_bakery'),
  { eval: () => { const g0 = window.__game; const slots = g0.world.slots.filter((s) => s.shop === 'bakery'); return { slots: slots.length, xs: [...new Set(slots.map((s) => +s.x.toFixed(2)))], idx: slots.map((s) => s.idx) }; } },
  { eval: () => { window.__game.ui.$('quest').style.display = 'none'; return 1; }, quiet: true },
  viewShop('bakery', 1.9, 0.35, 2.5), { shot: 'banh54_shop' },
  { eval: () => { window.__game.ui.$('quest').style.display = ''; return 1; }, quiet: true },

  { label: '② đứng sát ô bánh bông lan (1 m) rồi chạm vào ô — xem ô có ăn không' },
  standAt('bakery', 5), tapSlot('bakery', 5), cartNow,
  { label: '③ chạm thêm ô bánh mì que (rẻ nhất) rồi đưa Anh Bảo tính tiền' },
  standAt('bakery', 1), tapSlot('bakery', 1), cartNow,
  { shot: 'banh54_cart' },
  { eval: () => { const g0 = window.__game, a = g0.world.anchors.v_bakery; g0.player.place(a.x, a.z + 1.4, a.yaw + Math.PI); return 1; }, quiet: true, wait: 500 },
  payNow('bakery'),
  { eval: () => window.__game.g.bag.filter((s) => /^banh/.test(s.id)).map((s) => s.n + 'x' + s.id) },

  { label: '④ ăn bánh bông lan (25.000₫) no hơn hẳn bánh mì que (5.000₫)' },
  { eval: () => { const g0 = window.__game; g0.g.st.hunger = 20; g0.g.st.mood = 50; const i = g0.g.bag.findIndex((s) => s.id === 'banhbonglan'); g0.acts.eat(g0.g.bag, i); return { hunger: +g0.g.st.hunger.toFixed(1), mood: +g0.g.st.mood.toFixed(1) }; } },
  { eval: () => { const g0 = window.__game; g0.g.st.hunger = 20; g0.g.st.mood = 50; const i = g0.g.bag.findIndex((s) => s.id === 'banhmique'); g0.acts.eat(g0.g.bag, i); return { hunger: +g0.g.st.hunger.toFixed(1), mood: +g0.g.st.mood.toFixed(1) }; } },

  { label: '⑤ MiniMart 24h: lon Shapi trên kệ đá (ô số 2), chạm lấy được' },
  goShop('v_mart', 0, 1.6),
  { eval: () => { const g0 = window.__game; const slots = g0.world.slots.filter((s) => s.shop === 'mart'); return { slots: slots.length, uniq: new Set(slots.map((s) => s.idx)).size, shapi: slots.filter((s) => s.idx === 2).map((s) => [+s.x.toFixed(1), +s.z.toFixed(1)]) }; } },
  standAt('mart', 2, 1.0), { shot: 'banh54_mart' },
  standAt('mart', 2), tapSlot('mart', 2), cartNow,
  { eval: () => { const g0 = window.__game, a = g0.world.anchors.v_mart; g0.player.place(a.x, a.z + 1.2, a.yaw + Math.PI); return 1; }, quiet: true, wait: 500 },
  payNow('mart'),
  { eval: () => window.__game.g.bag.filter((s) => s.id === 'shapi').map((s) => s.n + 'x' + s.id) },

  { label: '⑥ uống Shapi: thanh thể lực +30 % ngay (đang 10 %)' },
  { eval: () => { const g0 = window.__game, p = g0.player; p.stamina = 0.1; p.staminaCap = 1; p.tired = true; const i = g0.g.bag.findIndex((s) => s.id === 'shapi'); g0.acts.eat(g0.g.bag, i); return { before: 0.1, after: +p.stamina.toFixed(3), tired: p.tired }; } },
  { eval: () => ({ toast: (document.querySelector('#toasts') || { innerText: '' }).innerText.replace(/\n+/g, ' | ').slice(0, 200) }) },
  { shot: 'banh54_shapi' },

  { label: '⑦ uống Shapi khi thanh đã gần đầy: không vượt trần' },
  { eval: () => { const g0 = window.__game, p = g0.player; g0.g.bag.push({ id: 'shapi', n: 1, fresh: 100, q: 1, cost: 9000 }); p.stamina = 0.85; p.staminaCap = 1; const i = g0.g.bag.findIndex((s) => s.id === 'shapi'); g0.acts.eat(g0.g.bag, i); return { after: +p.stamina.toFixed(3) }; } },

  { label: '⑧ Tạp hoá Cô Ba: 13 ô, lon Shapi (ô 11) chạm lấy được' },
  goShop('v_kiosk', 0, 1.6),
  { eval: () => { const g0 = window.__game; const slots = g0.world.slots.filter((s) => s.shop === 'kiosk'); return { slots: slots.length, shapi: slots.filter((s) => s.idx === 10).map((s) => [+s.x.toFixed(1), +s.z.toFixed(1)]) }; } },
  standAt('kiosk', 10, 1.2), { shot: 'banh54_kiosk' },
  standAt('kiosk', 10), tapSlot('kiosk', 10), cartNow,
];
