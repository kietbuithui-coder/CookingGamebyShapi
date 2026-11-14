// Ô tô đời 2005–2010 chạy chung với xe máy: bốn mẫu hộp vuông, chạy chậm hơn xe máy, nhả khói.
export type CarKind = 'corolla' | 'matiz' | 'cd5' | 'truck';
export interface CarSpec {
  id: CarKind; name: string; len: number; w: number;
  colors: number[]; speed: [number, number];
}
export const CARS: CarSpec[] = [
  { id: 'corolla', name: 'Toyota Corolla đời cũ', len: 2.95, w: 1.58, colors: [0xdfd8c0, 0xe9e6dc, 0xc9c2b2], speed: [5.4, 7.2] },
  { id: 'matiz', name: 'Daewoo Matiz', len: 2.45, w: 1.42, colors: [0x8fc7d8, 0xd9dde2, 0xf0d0a0], speed: [5.2, 7.0] },
  { id: 'cd5', name: 'Kia CD5', len: 2.95, w: 1.56, colors: [0xf3f0e8, 0xb9c0c8, 0xcfd8dc], speed: [5.4, 7.2] },
  { id: 'truck', name: 'Xe tải nhỏ', len: 3.5, w: 1.66, colors: [0x2f6fb5, 0x3f8a5a, 0xd9b84a], speed: [4.2, 5.6] },
];
export const CAR_BY: Record<CarKind, CarSpec> = Object.fromEntries(CARS.map((c) => [c.id, c])) as Record<CarKind, CarSpec>;
/** Cỡ xe lớn nhất (dùng cho khoảng cách đỗ / kiểm thử). */
export const CAR_MAX_LEN = Math.max(...CARS.map((c) => c.len));
/** Tỉ lệ ô tô trong dòng xe. */
export const CAR_SHARE = 0.26;
