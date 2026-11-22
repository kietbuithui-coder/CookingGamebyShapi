// LUẬT RẢI TOPPING của bánh tráng trộn — phần tính toán thuần (không đụng Three.js, không đụng DOM)
// để test được bằng máy: mỗi ván rải 5 topping ra 5 chỗ KHÁC NHAU, không ván nào giống ván nào,
// và không có hai chỗ nào chồng lên nhau (chồng thì ngón tay bấm trúng cái nọ ra cái kia).
import { clamp, TAU } from '../core/util';

/** Số topping của một ván — đúng 5 như công thức bánh tráng trộn. */
export const TRON_N = 5;
/** Số lượt gọi tên trong một ván: gọi hết 5 topping hai lần, lần sau nhanh hơn lần trước. */
export const TRON_ROUNDS = 2;
/** Bán kính rải theo x và z (bàn bếp chỉ rộng ~0,84 m nên rải theo elip cho vừa khung hình). */
export const TRON_RX = 0.36;
export const TRON_RZ = 0.2;
/** Tâm vòng rải lệch về phía xa người nấu, chừa chỗ đặt hộp bánh tráng ở phía trước. */
export const TRON_CZ = -0.06;
/** Hai chỗ đặt topping phải cách nhau ít nhất chừng này (m) — ngón tay chạm bán kính 0,105 m. */
export const TRON_GAP = 0.15;
/** Bán kính ăn tay của một chỗ đặt topping. */
export const TRON_HIT = 0.105;
/** Thời gian cho mỗi lượt gọi tên, giây — càng về sau càng gấp. */
export const tronLimit = (k: number) => Math.max(1.1, 3.1 - k * 0.16);

export interface Spot { x: number; z: number; }

/**
 * Rải `n` chỗ đặt topping quanh bàn. Mỗi chỗ nằm trong một khoang riêng của vòng tròn
 * (chia đều thành n khoang, mỗi chỗ lệch ngẫu nhiên trong khoang của mình) nên vị trí đổi
 * mỗi ván mà hai chỗ cạnh nhau không bao giờ dính vào nhau.
 * `rand` là hàm ngẫu nhiên 0–1 — truyền Math.random khi chơi, truyền RNG có hạt khi test.
 */
export function tronSpots(rand: () => number, n = TRON_N): Spot[] {
  const base = rand() * TAU, out: Spot[] = [];
  for (let i = 0; i < n; i++) {
    // lệch tối đa ±0,18 khoang: khoang 72° thì hai chỗ sát nhau vẫn cách ≥ 46°
    const a = base + (i + (rand() - 0.5) * 0.36) * (TAU / n), k = 1 + (rand() - 0.5) * 0.12;
    out.push({ x: Math.cos(a) * TRON_RX * k, z: TRON_CZ + Math.sin(a) * TRON_RZ * k });
  }
  // chống chồng: đẩy hai chỗ quá gần ra xa nhau (rất hiếm khi xảy ra, nhưng đừng để phụ thuộc may rủi)
  for (let it = 0; it < 40; it++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      if (d >= TRON_GAP || d < 1e-6) continue;
      const push = (TRON_GAP - d) * 0.52, ux = dx / d, uz = dz / d;
      a.x -= ux * push; a.z -= uz * push; b.x += ux * push; b.z += uz * push; moved = true;
    }
    if (!moved) break;
  }
  // gói lại cho gọn trong khung bàn, phòng trường hợp vừa đẩy ra ngoài
  for (const s of out) { s.x = clamp(s.x, -TRON_RX - 0.04, TRON_RX + 0.04); s.z = clamp(s.z, TRON_CZ - TRON_RZ - 0.05, TRON_CZ + TRON_RZ + 0.05); }
  return out;
}

/**
 * Vòng thứ mấy (đếm từ 1) của lượt gọi thứ `k`. Một ván gọi 2 vòng nên mỗi topping được gọi 2 lần —
 * nghĩa là đĩa topping phải NẰM LẠI trên khay suốt ván, chỉ phần đã cho vào hộp là biến mất.
 */
export const tronRound = (k: number, n = TRON_N) => Math.floor(k / n) + 1;

/** Thứ tự gọi tên topping trong một ván: trộn đều, mỗi vòng gọi đủ cả n lượt. */
export function tronCalls(rand: () => number, n = TRON_N, rounds = TRON_ROUNDS): number[] {
  const out: number[] = [];
  for (let r = 0; r < rounds; r++) {
    const p = Array.from({ length: n }, (_, i) => i);
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    // đừng gọi trùng tên hai lần liền nhau ở chỗ nối hai vòng — nghe như máy bị kẹt
    if (out.length && p[0] === out[out.length - 1]) [p[0], p[1]] = [p[1], p[0]];
    out.push(...p);
  }
  return out;
}

/** Chỗ đặt topping dưới ngón tay (gần nhất trong bán kính ăn tay), −1 nếu chạm ra ngoài. */
export function tronTapAt(spots: Spot[], x: number, z: number, r = TRON_HIT): number {
  let best = -1, bd = r;
  spots.forEach((s, i) => { const d = Math.hypot(s.x - x, s.z - z); if (d <= bd) { bd = d; best = i; } });
  return best;
}

/**
 * Điểm của một ván 0–1: trừ vì chạm nhầm / để hết giờ, và trừ nhẹ nếu chậm tay.
 * `secs` là tổng thời gian chơi, `par` là mốc coi như vừa tay (mỗi lượt ~1,9 giây).
 */
export function tronScore(miss: number, total: number, secs: number, par = total * 1.9 + 1.5): number {
  const acc = 1 - (miss / Math.max(1, total)) * 1.5;
  const speed = secs <= par ? 1 : Math.max(0.62, 1 - (secs - par) / (par * 1.8));
  return clamp(acc * speed * 0.97, 0.05, 1);
}
