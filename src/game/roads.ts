// LUẬT ĐƯỜNG ĐI CHO XE CỘ — một chỗ duy nhất, tách khỏi phần vẽ 3D để kiểm thử được.
//
// Vấn đề người chơi báo: "sửa các xe sau cho chúng không xuất hiện từ chỗ không hợp lí (chỗ gầm cầu là một ví dụ)".
// Nguyên nhân: xe chỉ biết `CORR` (tâm các tuyến) rồi cứ thế đặt vào làn và chạy thẳng, trong khi mặt đường của
// thành phố chỉ có trong khoảng z ∈ [−92; 92] và x ∈ [−96; 96]. Ra ngoài đó là bãi đất gầm cầu (z 94,5–107),
// bờ kênh (z ≥ 108,4) và đất trống hai bên — nên xe "mọc" từ gầm cầu, từ bờ kênh, hoặc chạy xuyên bãi rác.
//
// Luật mới:
//  · Dọc trục x: mọi tuyến chạy suốt −96 → +96 (mặt đường thật).
//  · Dọc trục z: ba tuyến giữa chạy −92 → +92. Vành ngoài (±88,5) chỉ nối với giao lộ cuối: nam tới 88,5, bắc tới 92.
//  · Không bao giờ sinh xe ở z > 92 (bãi gầm cầu) hay ngoài −96/+96.
//  · Xe hướng nam chỉ *xuất hiện* phía bắc người chơi, và phải sinh ra trên phần đường thật.
//  · Chạy hết mặt đường thì quay đầu tại giao lộ cuối (đường cụt), không phóng ra bãi đất.
import { CORR, ROAD_HALF, MAP } from '../world/layout';

/**
 * Hai đầu xa của thành phố. Mặt đường dọc trục x chỉ được trải trong phần có ô phố (|x| ≤ 92) —
 * phía đông (x → 96) là vỉa hè vành ngoài, phía tây (x → −96) cũng vậy, nên xe dừng ở 92.
 */
export const ROAD_X_END = 92;
/** Hết mặt đường theo trục z: phía bắc dừng ngay trước bãi đất gầm cầu, phía nam dừng ở mép ô phố cuối. */
export const ROAD_Z_NORTH = 92;
export const ROAD_Z_SOUTH = -92;
/** Giao lộ cuối của vành ngoài (tuyến ±88,5) về phía nam. */
export const RING_END_SOUTH = CORR[3];

/** Ba tuyến giữa chạy suốt hai phía; vành ngoài ±88,5 thì cụt ở giao lộ cuối. */
export const isRingRoad = (c: number) => c !== CORR[0] && c !== CORR[3];

/** Khoảng mặt đường thật của một tuyến, tính theo chiều xe chạy: `back` = chỗ được sinh ra, `front` = chỗ quay đầu. */
export function roadSpan(axis: 0 | 1, sign: 1 | -1, road: number): { back: number; front: number } {
  let a: number, b: number;
  if (axis === 0) { a = -ROAD_X_END; b = ROAD_X_END; }
  else if (isRingRoad(road)) { a = ROAD_Z_SOUTH; b = ROAD_Z_NORTH; }
  else { a = RING_END_SOUTH; b = ROAD_Z_NORTH; }
  return sign > 0 ? { back: a, front: b } : { back: b, front: a };
}

/** Bãi đất gầm cầu + bờ kênh: không có mặt đường, không xe nào được ở đây. */
export const inWasherGround = (x: number, z: number) => z > ROAD_Z_NORTH + ROAD_HALF && x > MAP.x0 && x < MAP.x1;

/**
 * Có phải đang đứng trên mặt đường thật không (dùng để canh lỗi: xe phải luôn nằm trên đường).
 * Cho phép sai số `pad` để tính cả mép lề.
 */
export function onRoad(x: number, z: number, pad = 0): boolean {
  if (x < -ROAD_X_END - pad || x > ROAD_X_END + pad) return false;
  if (z < ROAD_Z_SOUTH - pad || z > ROAD_Z_NORTH + pad) return false;
  for (const c of CORR) {
    if (Math.abs(x - c) < ROAD_HALF + pad) return true;
    if (Math.abs(z - c) < ROAD_HALF + pad) return true;
  }
  return false;
}

/** Một tia sinh xe: tuyến + làn, tách khỏi phần vẽ để kiểm thử. */
/** `pos: null` = chưa có chỗ sinh hợp lệ, hoãn lần sau. */
export interface SpawnPick { axis: 0 | 1; sign: 1 | -1; road: number; lane: number; pos: number | null; }

/**
 * Chọn chỗ sinh xe: ưu tiên con đường gần người chơi (theo trục của xe), và bảo đảm điểm sinh
 * nằm SAU lưng người chơi 35–85 m, trên phần mặt đường thật.
 * `along` = toạ độ người chơi theo trục xe chạy · `across` = theo trục kia.
 */
export function pickSpawn(axis: 0 | 1, sign: 1 | -1, along: number, across: number, rand: {
  chance: (p: number) => boolean; range: (a: number, b: number) => number; pick: <T>(a: T[]) => T;
}): SpawnPick {
  // 3/4 số xe chạy con đường gần nhất, còn lại rải ra các tuyến khác cho phố đỡ trống
  const near = rand.chance(0.75) ? CORR.reduce((b, c) => (Math.abs(c - across) < Math.abs(b - across) ? c : b), CORR[0]) : rand.pick(CORR);
  // Hai tuyến vành ngoài (±88,5) khi chạy dọc trục z chỉ còn một đoạn cụt dài 3,5 m trước giao lộ,
  // nên gần như không có chỗ sinh xe. Gặp vậy thì rẽ sang tuyến giữa — thà khác tuyến còn hơn hiện ra trước mặt.
  const roads = axis === 1 && !isRingRoad(near) ? CORR.filter(isRingRoad) : [near, ...CORR.filter((c) => c !== near)];
  const lane = rand.chance(0.5) ? -1.7 : 1.7;
  let road = roads[0];
  // Sinh sau lưng người chơi. Ưu tiên 35–85 m; nếu chỗ đó đã ra ngoài mặt đường thật (người chơi đứng
  // sát đường cụt / mép thành phố) thì lùi dần cự ly. Không được kẹp vị trí vào trong, vì kẹp sẽ làm
  // xe hiện ra ngay trước mặt người chơi.
  const first = rand.range(35, 85);
  for (const candidate of roads) {
    road = candidate;
    const span = roadSpan(axis, sign, road);
    const lo = Math.min(span.back, span.front) + 2, hi = Math.max(span.back, span.front) - 2;
    for (const d of [first, 30, 26, 22, 18, 14, 11, 9]) {
      const want = along - sign * d;
      if (want >= lo && want <= hi) return { axis, sign, road, lane, pos: want };
    }
    // Hết chỗ phía sau: chỉ nhận điểm sinh ở rất xa phía trước (ngoài tầm nhìn ~150 m) để không "hiện ra" trước mặt.
    for (const d of [140, 160, 180]) {
      const want = along + sign * d;
      if (want >= lo && want <= hi) return { axis, sign, road, lane, pos: want };
    }
  }
  return { axis, sign, road: roads[0], lane, pos: null };
}
