// NGOẠI HÌNH NGƯỜI CHƠI — dữ liệu thuần (kiểu tóc, màu, giá) để phần mô phỏng, giao diện và đồ hoạ dùng chung.
// Người chơi đổi ở tiệm cắt tóc (kiểu + màu tóc) và tiệm thời trang (áo, quần, giày, kính).
export interface PlayerLookData {
  face: number; fem: boolean; hairStyle: number; hair: number; shirt: number; pants: number;
  skin: number; shoe: number; hat: number; hatCol: number; fat: number; h: number;
}
export interface LookOption { name: string; price: number; note?: string; }
export interface HairStyleDef extends LookOption { id: number; }
export interface ColorDef extends LookOption { col: number; }

export const HAIR_STYLES: HairStyleDef[] = [
  { id: 0, name: 'Cắt ngắn', price: 15000 },
  { id: 1, name: 'Để dài', price: 20000 },
  { id: 2, name: 'Búi gọn', price: 20000 },
  { id: 3, name: 'Cạo sát (hói)', price: 12000 },
  { id: 4, name: 'Uốn xoăn', price: 45000 },
  { id: 5, name: 'Buộc đuôi ngựa', price: 25000 },
  { id: 6, name: 'Húi cua', price: 12000 },
  { id: 7, name: 'Tém ngang vai', price: 30000 },
];
export const HAIR_COLORS: ColorDef[] = [
  { name: 'Đen nhánh', col: 0x1e1a18, price: 10000 },
  { name: 'Nâu hạt dẻ', col: 0x6a3a22, price: 20000 },
  { name: 'Nâu vàng', col: 0x9a5a2a, price: 20000 },
  { name: 'Muối tiêu', col: 0xd9d9d6, price: 30000 },
];
export const SHIRT_COLORS: ColorDef[] = [
  { name: 'Xanh dương', col: 0x2f8fd5, price: 25000 },
  { name: 'Trắng', col: 0xf3f0e8, price: 25000 },
  { name: 'Đỏ đô', col: 0xa8323a, price: 28000 },
  { name: 'Xanh rêu', col: 0x4a6a42, price: 28000 },
  { name: 'Vàng nghệ', col: 0xf5c531, price: 30000 },
  { name: 'Hồng phấn', col: 0xe86f9a, price: 30000 },
];
export const PANTS_COLORS: ColorDef[] = [
  { name: 'Xanh đen', col: 0x2a2e3a, price: 20000 },
  { name: 'Xám tro', col: 0x5a5e66, price: 20000 },
  { name: 'Nâu cà phê', col: 0x5a4636, price: 22000 },
  { name: 'Xanh bò', col: 0x3a5a8a, price: 24000 },
  { name: 'Đen thun', col: 0x1b1c1f, price: 18000 },
];
export const SHOE_COLORS: ColorDef[] = [
  { name: 'Dép nhựa', col: 0x2a2a2e, price: 12000 },
  { name: 'Giày vải trắng', col: 0xf3f0e8, price: 35000 },
  { name: 'Giày thể thao', col: 0x3a4a6a, price: 45000 },
];
/** Kính: face 5 = gọng cận, 6 = kính đen. 0 là bỏ kính. */
export const GLASSES: LookOption[] = [
  { name: 'Bỏ kính', price: 0 },
  { name: 'Kính cận gọng đen', price: 45000 },
  { name: 'Kính đen giang hồ', price: 60000 },
];
/** Ngoại hình mặc định của ván mới (chỉ khác nhau ở nam/nữ). */
export function defaultLook(fem: boolean): PlayerLookData {
  return {
    face: fem ? 1 : 0, fem, hairStyle: fem ? 7 : 0, hair: 0x1e1a18, shirt: fem ? 0xe86f9a : 0x2f8fd5,
    pants: 0x2a2e3a, skin: fem ? 0xf6d6b6 : 0xf2c9a4, shoe: 0x2a2a2e, hat: 0, hatCol: 0x2f6fb5, fat: fem ? 0.94 : 1, h: 1,
  };
}
/** Chỉnh lại dữ liệu đọc từ bản lưu cho khỏi vỡ hình. */
export function cleanLook(raw: any, fem: boolean): PlayerLookData {
  const d = defaultLook(fem), n = (v: any, def: number, lo: number, hi: number) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
  const col = (v: any, def: number) => (typeof v === 'number' && isFinite(v) ? v & 0xffffff : def);
  return {
    face: Math.round(n(raw?.face, d.face, 0, 7)), fem: typeof raw?.fem === 'boolean' ? raw.fem : fem,
    hairStyle: Math.round(n(raw?.hairStyle, d.hairStyle, 0, HAIR_STYLES.length - 1)),
    hair: col(raw?.hair, d.hair), shirt: col(raw?.shirt, d.shirt), pants: col(raw?.pants, d.pants), skin: col(raw?.skin, d.skin),
    shoe: col(raw?.shoe, d.shoe), hat: Math.round(n(raw?.hat, d.hat, 0, 4)), hatCol: col(raw?.hatCol, d.hatCol),
    fat: n(raw?.fat, d.fat, 0.8, 1.3), h: n(raw?.h, d.h, 0.85, 1.12),
  };
}
