// Ô tô đời 2005–2010 chạy chung với xe máy: bốn mẫu hộp vuông, chạy chậm hơn xe máy, nhả khói.
export type CarKind = 'corolla' | 'matiz' | 'cd5' | 'truck';
export interface CarSpec {
  id: CarKind; name: string; len: number; w: number;
  colors: number[]; speed: [number, number];
  /** Kiểu còi: xe nhỏ "bíp bíp" cao, xe tải "bừm" trầm (xem `src/audio/audio.ts`). */
  horn: 'beep' | 'honk' | 'truck';
}
/** Ba màu sơn mới thêm cho xe hơi (người chơi: "thêm 3 màu cho xe") — đỏ đô, xanh rêu, vàng taxi. */
export const CAR_EXTRA_COLORS = [0x8e2b2b, 0x2f5f4a, 0xe0b235];

export const CARS: CarSpec[] = [
  // Mỗi mẫu có 3 màu cũ + 3 màu mới (xe tải chỉ thêm màu sơn thùng cho hợp dáng).
  { id: 'corolla', name: 'Toyota Corolla đời cũ', len: 2.95, w: 1.58, speed: [5.4, 7.2], horn: 'honk',
    colors: [0xdfd8c0, 0xe9e6dc, 0xc9c2b2, ...CAR_EXTRA_COLORS] },
  { id: 'matiz', name: 'Daewoo Matiz', len: 2.45, w: 1.42, speed: [5.2, 7.0], horn: 'beep',
    colors: [0x8fc7d8, 0xd9dde2, 0xf0d0a0, ...CAR_EXTRA_COLORS] },
  { id: 'cd5', name: 'Kia CD5', len: 2.95, w: 1.56, speed: [5.4, 7.2], horn: 'honk',
    colors: [0xf3f0e8, 0xb9c0c8, 0xcfd8dc, ...CAR_EXTRA_COLORS] },
  { id: 'truck', name: 'Xe tải nhỏ', len: 3.5, w: 1.66, speed: [4.2, 5.6], horn: 'truck',
    colors: [0x2f6fb5, 0x3f8a5a, 0xd9b84a, 0x7a3a2a, 0x4a4a52, 0xb26a2a] },
];
export const CAR_BY: Record<CarKind, CarSpec> = Object.fromEntries(CARS.map((c) => [c.id, c])) as Record<CarKind, CarSpec>;
/** Cỡ xe lớn nhất (dùng cho khoảng cách đỗ / kiểm thử). */
export const CAR_MAX_LEN = Math.max(...CARS.map((c) => c.len));
/** Tỉ lệ ô tô trong dòng xe. */
export const CAR_SHARE = 0.26;
