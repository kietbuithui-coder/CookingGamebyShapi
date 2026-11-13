// NPC — 16 nhóm khách, tên, tính cách và lời thoại tiếng Việt. Thêm nhóm/lời thoại mới ngay tại đây.
import type { RecipeCat } from './recipes';
import type { District } from '../world/layout';

export type ArchId = 'congnhan' | 'hocsinh' | 'vanphong' | 'shipper' | 'taixe' | 'nguoigia' | 'phuhuynh' | 'treem' | 'dukhach' | 'nhagiau' | 'vogiacu'
  | 'khotinh' | 'phebinh' | 'hangrong' | 'giangho' | 'congan';
export type BegStyle = 'lephep' | 'kekho' | 'naini';
export interface ArchDef {
  id: ArchId; name: string; w: number;                    // w: tỉ lệ xuất hiện
  faces: number[]; shirts: number[]; pants: number[]; hair: number[]; hats: number[]; // hats: 0 không, 1 nón lá, 2 nón kết, 3 mũ bảo hiểm, 4 mũ tai bèo
  hairStyle: number[];                                    // 0 ngắn, 1 dài, 2 búi, 3 hói
  h: [number, number]; fat: [number, number]; fem: number; // chiều cao, độ mập, xác suất nữ
  bag: number;                                            // xác suất đeo ba lô/túi
  budget: [number, number]; wtp: number; sens: number; patience: [number, number]; tip: number;
  pref: Partial<Record<RecipeCat, number>>;
  beg: Record<BegStyle, number> & { amt: [number, number]; food: number };
  speed: number; self: [string, string]; you: string;      // xưng hô [nam, nữ] và cách gọi người chơi ({ac} = anh/chị)
  where: Partial<Record<District, number>>; hours: [number, number];
}
const P = { // bảng màu quần áo
  work: [0x3f6a9a, 0x5a7a4a, 0x8a5a3a, 0x4a5a6a, 0xb5653c, 0x6a6a72], white: [0xf3f3f0, 0xe6ecf3, 0xdfe9f7],
  office: [0xf3f3f0, 0xa8c8ec, 0xf0c8d0, 0xd9e6c8, 0x2f3a52, 0xe9d9b8], bright: [0xe2402f, 0xf5c531, 0x2f8fd5, 0x3fae5a, 0xf08a2f, 0xe86f9a, 0x8a5fd0, 0x2fb5a8],
  old: [0xb9a88a, 0x8a7a9a, 0x9a8a7a, 0x6a7a8a, 0xc9b8a8, 0x7a5a6a], rich: [0x1e2430, 0xf3f0e8, 0x6a1e2e, 0x1e4a3a, 0xd9b84a], rag: [0x6a6258, 0x5a5248, 0x7a6a58, 0x4a4a42],
  dark: [0x2a2e3a, 0x3a3a42, 0x1e2430, 0x4a3a32], jeans: [0x3a5a8a, 0x2f4a72, 0x4a6a9a, 0x2a2e3a], khaki: [0x9a8a6a, 0x7a6a52, 0x5a5a52, 0x2a2e3a],
  hairB: [0x1e1a18, 0x2a2420, 0x3a2a22], hairDye: [0x1e1a18, 0x6a3a22, 0x9a5a2a, 0xd9a05a, 0x2a2420], hairW: [0xd9d9d6, 0xbfbfbc, 0xe9e9e6],
};
export const ARCH: Record<ArchId, ArchDef> = {
  congnhan: { id: 'congnhan', name: 'Công nhân', w: 18, faces: [0, 7, 0, 1], shirts: P.work, pants: P.khaki, hair: P.hairB, hats: [0, 2, 3, 4, 0], hairStyle: [0, 0, 1], h: [0.96, 1.04], fat: [0.95, 1.15], fem: 0.25, bag: 0.1,
    budget: [15000, 32000], wtp: 0.88, sens: 1.5, patience: [50, 85], tip: 0.03, pref: { com: 1.6, banhmi: 1.4, bunpho: 1.2, nuoc: 1.2, mi: 1.1, nuong: 1 },
    beg: { lephep: 0.3, kekho: 0.38, naini: 0.12, amt: [1000, 5000], food: 0.08 }, speed: 1.45, self: ['anh', 'chị'], you: 'em', where: { laodong: 3, khobai: 2, nhanghi: 2, cho: 1, trungtam: 1 }, hours: [5, 21] },
  hocsinh: { id: 'hocsinh', name: 'Học sinh', w: 14, faces: [0, 1, 5, 1], shirts: P.white, pants: [0x2a3a6a, 0x2f3a52], hair: P.hairB, hats: [0, 0, 2], hairStyle: [0, 1, 2], h: [0.86, 0.96], fat: [0.85, 1], fem: 0.5, bag: 0.9,
    budget: [8000, 22000], wtp: 0.8, sens: 1.8, patience: [40, 75], tip: 0, pref: { anvat: 2, xien: 2, chien: 1.7, nuoc: 1.5, che: 1.5, banhmi: 1.2, burger: 1.2 },
    beg: { lephep: 0.22, kekho: 0.3, naini: 0.08, amt: [1000, 3000], food: 0.1 }, speed: 1.5, self: ['em', 'em'], you: '{ac}', where: { dancu: 3, congvien: 2, trungtam: 2, cho: 1 }, hours: [6, 20] },
  vanphong: { id: 'vanphong', name: 'Dân văn phòng', w: 14, faces: [0, 1, 5, 5], shirts: P.office, pants: P.dark, hair: P.hairDye, hats: [0], hairStyle: [0, 1, 2], h: [0.96, 1.04], fat: [0.9, 1.05], fem: 0.5, bag: 0.5,
    budget: [25000, 60000], wtp: 1.15, sens: 1.0, patience: [35, 60], tip: 0.1, pref: { com: 1.4, bunpho: 1.5, mi: 1.3, nuoc: 1.6, goi: 1.4, burger: 1.2, banhmi: 1.1 },
    beg: { lephep: 0.3, kekho: 0.22, naini: 0.05, amt: [2000, 10000], food: 0.05 }, speed: 1.6, self: ['anh', 'chị'], you: 'em', where: { vanphong: 4, trungtam: 2, nhagiau: 1.5, congvien: 1 }, hours: [7, 20] },
  shipper: { id: 'shipper', name: 'Shipper', w: 8, faces: [0, 7, 0], shirts: [0x2fae5a, 0xf08a2f, 0xe2402f, 0x2f8fd5], pants: P.jeans, hair: P.hairB, hats: [3, 3, 2], hairStyle: [0], h: [0.96, 1.03], fat: [0.9, 1.05], fem: 0.12, bag: 0.8,
    budget: [15000, 35000], wtp: 0.92, sens: 1.4, patience: [25, 45], tip: 0.03, pref: { banhmi: 1.8, com: 1.4, nuoc: 1.6, xien: 1, mi: 1.1 },
    beg: { lephep: 0.3, kekho: 0.35, naini: 0.1, amt: [1000, 5000], food: 0.1 }, speed: 1.75, self: ['anh', 'chị'], you: 'em', where: { trungtam: 3, nhanghi: 2, cho: 2, vanphong: 1.5, dancu: 1 }, hours: [6, 23] },
  taixe: { id: 'taixe', name: 'Tài xế', w: 7, faces: [7, 0, 3], shirts: P.work, pants: P.khaki, hair: P.hairB, hats: [0, 2, 2], hairStyle: [0, 3], h: [0.97, 1.04], fat: [1.05, 1.25], fem: 0.05, bag: 0,
    budget: [20000, 40000], wtp: 0.95, sens: 1.3, patience: [45, 80], tip: 0.05, pref: { com: 1.6, bunpho: 1.5, nuoc: 1.5, nuong: 1.2, haisan: 1 },
    beg: { lephep: 0.3, kekho: 0.3, naini: 0.15, amt: [1000, 5000], food: 0.05 }, speed: 1.35, self: ['chú', 'cô'], you: 'con', where: { nhanghi: 3, khobai: 2, cho: 2, laodong: 1 }, hours: [5, 23] },
  nguoigia: { id: 'nguoigia', name: 'Người lớn tuổi', w: 9, faces: [3, 4], shirts: P.old, pants: P.dark, hair: P.hairW, hats: [0, 1, 4, 0], hairStyle: [0, 2, 3], h: [0.9, 0.98], fat: [0.9, 1.15], fem: 0.55, bag: 0.15,
    budget: [12000, 35000], wtp: 0.9, sens: 1.5, patience: [70, 120], tip: 0.04, pref: { bunpho: 1.7, che: 1.6, com: 1.2, nuoc: 1.1, goi: 1.2 },
    beg: { lephep: 0.55, kekho: 0.45, naini: 0.06, amt: [2000, 10000], food: 0.18 }, speed: 0.95, self: ['bác', 'bà'], you: 'con', where: { dancu: 3, congvien: 3, cho: 2.5, khobai: 1 }, hours: [5, 19] },
  phuhuynh: { id: 'phuhuynh', name: 'Phụ huynh', w: 6, faces: [1, 0, 5], shirts: P.bright, pants: P.jeans, hair: P.hairDye, hats: [0, 4], hairStyle: [1, 0, 2], h: [0.95, 1.02], fat: [0.92, 1.1], fem: 0.7, bag: 0.6,
    budget: [25000, 70000], wtp: 1.05, sens: 1.1, patience: [40, 70], tip: 0.06, pref: { anvat: 1.4, che: 1.5, nuoc: 1.4, burger: 1.5, chien: 1.5, xien: 1.3, com: 1 },
    beg: { lephep: 0.4, kekho: 0.4, naini: 0.04, amt: [2000, 10000], food: 0.1 }, speed: 1.2, self: ['anh', 'chị'], you: 'em', where: { congvien: 4, dancu: 3, trungtam: 1.5, cho: 1.5 }, hours: [6, 20] },
  treem: { id: 'treem', name: 'Trẻ em', w: 0, faces: [2], shirts: P.bright, pants: P.bright, hair: P.hairB, hats: [0, 2, 4], hairStyle: [0, 1, 2], h: [0.6, 0.72], fat: [0.9, 1.05], fem: 0.5, bag: 0.3,
    budget: [0, 0], wtp: 1, sens: 1, patience: [30, 60], tip: 0, pref: {}, beg: { lephep: 0, kekho: 0, naini: 0, amt: [0, 0], food: 0 }, speed: 1.25, self: ['con', 'con'], you: '{ac}', where: {}, hours: [6, 20] },
  dukhach: { id: 'dukhach', name: 'Khách du lịch', w: 5, faces: [0, 1, 5, 7], shirts: P.bright, pants: P.khaki, hair: [0xd9a05a, 0x9a5a2a, 0x6a3a22, 0xe9c88a], hats: [1, 2, 4, 0], hairStyle: [0, 1], h: [1.0, 1.1], fat: [0.95, 1.2], fem: 0.5, bag: 0.9,
    budget: [40000, 120000], wtp: 1.45, sens: 0.6, patience: [50, 90], tip: 0.3, pref: { bunpho: 2, banhmi: 1.8, goi: 1.6, nuoc: 1.4, haisan: 1.4, nuong: 1.3 },
    beg: { lephep: 0.45, kekho: 0.4, naini: 0.18, amt: [5000, 20000], food: 0.05 }, speed: 1.1, self: ['tôi', 'tôi'], you: 'bạn', where: { congvien: 3, vanphong: 2, trungtam: 2.5, cho: 2.5, nhagiau: 1 }, hours: [8, 22] },
  nhagiau: { id: 'nhagiau', name: 'Người giàu', w: 5, faces: [5, 1, 0], shirts: P.rich, pants: P.dark, hair: P.hairDye, hats: [0], hairStyle: [0, 1, 2], h: [0.98, 1.06], fat: [0.95, 1.2], fem: 0.5, bag: 0.4,
    budget: [50000, 200000], wtp: 1.6, sens: 0.5, patience: [25, 45], tip: 0.25, pref: { haisan: 2, burger: 1.3, nuoc: 1.4, goi: 1.4, bunpho: 1.2 },
    beg: { lephep: 0.22, kekho: 0.14, naini: 0.02, amt: [5000, 50000], food: 0 }, speed: 1.3, self: ['anh', 'chị'], you: 'em', where: { nhagiau: 4, vanphong: 2.5, congvien: 1 }, hours: [7, 22] },
  vogiacu: { id: 'vogiacu', name: 'Người vô gia cư', w: 3, faces: [3, 7, 0], shirts: P.rag, pants: P.rag, hair: P.hairB, hats: [0, 4, 0], hairStyle: [1, 3, 0], h: [0.93, 1.0], fat: [0.85, 0.95], fem: 0.15, bag: 0.5,
    budget: [3000, 10000], wtp: 0.6, sens: 2.4, patience: [80, 140], tip: 0, pref: { nuoc: 1.5, banhmi: 1.5, anvat: 1 },
    beg: { lephep: 0.1, kekho: 0.15, naini: 0, amt: [500, 1000], food: 0.2 }, speed: 0.9, self: ['tui', 'tui'], you: 'chú em', where: { gamcau: 4, laodong: 2, congvien: 1.5 }, hours: [5, 24] },
  khotinh: { id: 'khotinh', name: 'Khách khó tính', w: 4, faces: [5, 4, 3], shirts: P.office, pants: P.dark, hair: P.hairDye, hats: [0], hairStyle: [2, 0, 3], h: [0.94, 1.02], fat: [0.95, 1.2], fem: 0.6, bag: 0.5,
    budget: [25000, 70000], wtp: 1.0, sens: 1.6, patience: [22, 40], tip: 0, pref: { bunpho: 1.4, com: 1.3, goi: 1.3, haisan: 1.3 },
    beg: { lephep: 0.12, kekho: 0.08, naini: 0, amt: [1000, 5000], food: 0 }, speed: 1.3, self: ['cô', 'cô'], you: 'cháu', where: { trungtam: 2, dancu: 2, vanphong: 1.5, nhagiau: 2 }, hours: [7, 20] },
  phebinh: { id: 'phebinh', name: 'Nhà phê bình ẩm thực', w: 0, faces: [5], shirts: [0x6a1e2e, 0x1e4a3a], pants: P.dark, hair: P.hairDye, hats: [4, 0], hairStyle: [0, 1], h: [0.98, 1.04], fat: [1.05, 1.25], fem: 0.4, bag: 1,
    budget: [200000, 300000], wtp: 1.5, sens: 0.6, patience: [45, 70], tip: 0.2, pref: {}, beg: { lephep: 0.1, kekho: 0.05, naini: 0, amt: [5000, 20000], food: 0 }, speed: 1.2, self: ['tôi', 'tôi'], you: 'bạn', where: {}, hours: [10, 20] },
  hangrong: { id: 'hangrong', name: 'Người bán hàng rong', w: 4, faces: [4, 1, 7], shirts: P.old, pants: P.dark, hair: P.hairB, hats: [1, 1, 4], hairStyle: [2, 0], h: [0.92, 1.0], fat: [0.9, 1.1], fem: 0.7, bag: 0.2,
    budget: [10000, 25000], wtp: 0.8, sens: 1.8, patience: [50, 90], tip: 0, pref: { nuoc: 1.6, che: 1.2, banhmi: 1.2, com: 1.2 },
    beg: { lephep: 0.35, kekho: 0.45, naini: 0.1, amt: [1000, 3000], food: 0.25 }, speed: 1.1, self: ['cô', 'cô'], you: 'con', where: { cho: 3, laodong: 2, trungtam: 1.5, congvien: 1.5, nhanghi: 1 }, hours: [5, 21] },
  giangho: { id: 'giangho', name: 'Giang hồ', w: 2, faces: [6], shirts: [0x1e1e22, 0x6a1e1e, 0xf3f0e8], pants: P.dark, hair: P.hairB, hats: [0], hairStyle: [0, 3], h: [1.0, 1.08], fat: [1.05, 1.3], fem: 0, bag: 0,
    budget: [20000, 60000], wtp: 0.7, sens: 0.8, patience: [18, 35], tip: 0, pref: { nuong: 1.6, haisan: 1.4, nuoc: 1.5, xien: 1.2 },
    beg: { lephep: 0.05, kekho: 0.05, naini: 0, amt: [1000, 2000], food: 0 }, speed: 1.2, self: ['anh', 'anh'], you: 'chú em', where: { laodong: 3, nhanghi: 2.5 }, hours: [10, 24] },
  congan: { id: 'congan', name: 'Công an phường', w: 2, faces: [0, 7], shirts: [0x6a8a4a, 0x5a7a42], pants: [0x4a6238, 0x3a5230], hair: P.hairB, hats: [2], hairStyle: [0], h: [1.0, 1.06], fat: [0.95, 1.15], fem: 0.1, bag: 0,
    budget: [20000, 45000], wtp: 1.0, sens: 1.1, patience: [35, 60], tip: 0, pref: { nuoc: 1.6, com: 1.3, bunpho: 1.3, banhmi: 1.2 },
    beg: { lephep: 0.05, kekho: 0.08, naini: 0, amt: [2000, 5000], food: 0 }, speed: 1.2, self: ['anh', 'chị'], you: 'em', where: { trungtam: 2, cho: 2, vanphong: 2, congvien: 1.5, nhanghi: 1 }, hours: [7, 22] },
};
export const ARCH_LIST = Object.values(ARCH);

export const NAMES = {
  ho: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Huỳnh', 'Võ', 'Phan', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'],
  nam: ['Hùng', 'Tuấn', 'Minh', 'Phúc', 'Tâm', 'Long', 'Khoa', 'Đạt', 'Sơn', 'Thành', 'Bảo', 'Quân', 'Hải', 'Tín', 'Lộc', 'Nghĩa', 'Trí', 'Vũ', 'Tài', 'Kiệt'],
  nu: ['Lan', 'Hoa', 'Mai', 'Trang', 'Thảo', 'Ngọc', 'Hạnh', 'Yến', 'Nhi', 'Linh', 'Phương', 'Thu', 'Hương', 'Vy', 'Trâm', 'Diệu', 'Kim', 'Loan', 'Tuyết', 'My'],
  thu: ['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Út'],
};

/** Khách quen có tên, có sở thích riêng — quan hệ được lưu trong save. */
export interface RegularDef { id: string; name: string; arch: ArchId; fem: boolean; likes: RecipeCat[]; hour: number; note: string; seed: number; }
export const REGULARS: RegularDef[] = [
  { id: 'chu_ba', name: 'Chú Ba xe ôm', arch: 'taixe', fem: false, likes: ['com', 'nuoc'], hour: 11.5, note: 'Thích tám chuyện, hay giới thiệu khách.', seed: 11 },
  { id: 'co_lan', name: 'Chị Lan kế toán', arch: 'vanphong', fem: true, likes: ['bunpho', 'goi', 'nuoc'], hour: 12, note: 'Kỹ tính chuyện vệ sinh.', seed: 12 },
  { id: 'be_ti', name: 'Bé Tí lớp 8', arch: 'hocsinh', fem: false, likes: ['anvat', 'xien', 'chien'], hour: 16.8, note: 'Ít tiền, hay rủ bạn tới.', seed: 13 },
  { id: 'ba_tam', name: 'Bà Tám bán vé số', arch: 'hangrong', fem: true, likes: ['che', 'nuoc', 'banhmi'], hour: 15, note: 'Nghèo mà tốt bụng.', seed: 14 },
  { id: 'anh_khoa', name: 'Anh Khoa shipper', arch: 'shipper', fem: false, likes: ['banhmi', 'com', 'nuoc'], hour: 7, note: 'Luôn vội, ghét chờ.', seed: 15 },
  { id: 'ong_sau', name: 'Ông Sáu về hưu', arch: 'nguoigia', fem: false, likes: ['bunpho', 'che', 'nuoc'], hour: 6.5, note: 'Ngày nào cũng ghé nếu món ngon.', seed: 16 },
  { id: 'chi_my', name: 'Chị My mẹ bỉm', arch: 'phuhuynh', fem: true, likes: ['che', 'anvat', 'burger'], hour: 17.2, note: 'Hay mua nhiều phần mang về.', seed: 17 },
  { id: 'anh_tai', name: 'Anh Tài thợ hồ', arch: 'congnhan', fem: false, likes: ['com', 'banhmi', 'nuong'], hour: 11.7, note: 'Ăn khoẻ, quý người chịu khó.', seed: 18 },
];

// ───────────────────────── Lời thoại ─────────────────────────
// {self}: NPC tự xưng · {you}: gọi người chơi · {dish}: tên món · {price}: giá · {n}: số lượng
export const LINES = {
  order: ['Cho {self} {n} {dish} nha {you}.', '{You} ơi, {n} {dish}!', 'Bán {self} {n} {dish} đi {you}.', 'Lấy {self} {n} {dish} nghen.', '{n} {dish}, làm lẹ giùm {self} nha.', 'Ở đây có {dish} hả? Cho {self} {n} phần.'],
  order_regular: ['Như mọi khi nha {you}, {n} {dish}.', '{Self} lại ghé nè. {n} {dish} nhé!', 'Nhớ quán {you} quá, cho {self} {n} {dish}.'],
  pricey_buy: ['Ủa, hôm nay tăng giá rồi hả? Thôi kệ, lấy {self} {n} {dish}.', '{price} lận hả… Ừ thì lấy {n} phần.', 'Hơi mắc đó nha. Mà thôi, {n} {dish}.'],
  pricey_leave: ['{dish} mà {price}? Mắc quá, thôi {self} đi chỗ khác.', 'Trời đất, chém dữ vậy {you}!', 'Giá này {self} ăn không nổi.', 'Ủa, hôm nay tăng giá rồi hả? Thôi để bữa khác.', 'Bên kia bán rẻ hơn nhiều đó {you}.'],
  cheap: ['Rẻ ghê, bán vậy có lời không {you}?', 'Giá này thì {self} ủng hộ dài dài.', 'Ui, rẻ bất ngờ luôn!'],
  none: ['Ủa, hết món rồi hả? Tiếc ghê.', 'Không có gì ăn được hết trơn.', 'Bữa nay bán ít món vậy {you}?'],
  wait: ['Lâu quá vậy {you} ơi!', '{Self} trễ giờ rồi nè…', 'Sắp xong chưa {you}?', 'Đói rã ruột rồi đây.'],
  leave_wait: ['Thôi, {self} đi đây. Chờ gì mà chờ hoài!', 'Lâu quá, khỏi bán luôn đi!', 'Hết kiên nhẫn rồi nha.'],
  great: ['Ngon xuất sắc! Mai {self} ghé nữa.', 'Trời ơi ngon! Để {self} kêu bạn tới.', 'Đúng vị luôn, {you} nấu khéo ghê.', 'Tuyệt cú mèo!', 'Ăn một lần là nhớ.'],
  good: ['Ngon đó {you}.', 'Ổn áp, vừa miệng.', 'Được nha, {self} sẽ quay lại.', 'Cảm ơn {you} nha.'],
  ok: ['Cũng tạm.', 'Ăn được.', 'Bình thường thôi.', 'Ờ, cho qua bữa.'],
  bad: ['Hơi dở nha {you}.', 'Khét rồi {you} ơi.', 'Mặn chát luôn á.', 'Sống nhăn vầy sao ăn?', 'Lần sau làm kỹ chút nha.'],
  awful: ['Dở tệ! Trả tiền lại đây!', 'Thế này mà cũng đem bán hả?', '{Self} sẽ nói cho cả xóm biết!', 'Ăn xong muốn đau bụng luôn.'],
  stale: ['Đồ để lâu rồi phải không {you}? Hôi quá.', 'Cái này hư rồi mà còn bán hả?'],
  dirty: ['{You} ơi, nhìn {you} lem luốc quá, ăn có sao không đó?', 'Quầy gì mà dơ vậy… thôi {self} xin kiếu.', 'Tắm rửa chút đi rồi hãy bán {you} ơi.'],
  rain: ['Trời mưa thế này mà còn bán, vất vả ghê.', 'Mưa gió vầy có ly gì nóng nóng thì đỡ.', 'Cho {self} núp mưa chút nha.'],
  hot: ['Nóng muốn xỉu, có gì mát mát không {you}?', 'Nắng bể đầu luôn.', 'Trời này làm ly đá là hết sẩy.'],
  cold: ['Lạnh ghê, ăn gì nóng cho ấm bụng.', 'Trời se lạnh mà có tô nước nóng thì hết ý.'],
  tip: ['Khỏi thối, {you} giữ đi.', 'Tiền dư {self} gửi {you} uống nước.', 'Cho {you} thêm chút nè, chịu khó quá.'],
  thanks: ['Cảm ơn {you}.', 'Rồi, {self} đi nha.', 'Chúc {you} đắt hàng.'],
  // xin tiền
  beg_give: ['Nè, cầm lấy mua gì ăn đi.', 'Tội nghiệp, {self} cho ít nè.', 'Ráng lên nha {you}.', 'Có nhiêu đây thôi, cầm đỡ.', 'Còn trẻ, ráng kiếm việc mà làm nghen.'],
  beg_food: ['{Self} không có tiền lẻ, cho {you} ổ bánh mì nè.', 'Ăn cái này đi cho đỡ đói.'],
  beg_refuse: ['Không có tiền lẻ.', 'Xin lỗi nha.', '…', 'Đi làm đi chứ xin gì!', 'Thanh niên sức dài vai rộng mà ngồi xin.', 'Bận lắm.'],
  beg_annoyed: ['Đừng có kéo áo tui!', 'Phiền quá nha!', 'Tui kêu công an bây giờ!', 'Tránh ra coi!'],
  beg_chat: ['Chợ Xóm Chiều sáng sớm hay cần người bốc vác đó, {you} ra thử coi.', 'Quán cơm Bà Tư đang kiếm người rửa chén kìa.', 'Vựa ve chai Tư Rác mua lon với chai nhựa đó, lượm đem bán cũng có tiền.',
    'Hồi đó {self} cũng trắng tay. Bán gánh hàng rong mấy năm là có vốn liền.', 'Trời sắp mưa đó, kiếm chỗ trú đi {you}.', 'Ở hẻm Công Nhân bán đồ ăn sáng đắt lắm nghen.', 'Muốn buôn bán thì ghé tiệm Đồ Nghề Ba Tài mua cặp quang gánh.'],
  // lời vu vơ khi đi ngang
  bark: {
    congnhan: ['Mệt bở hơi tai.', 'Trưa nay ăn gì ta?', 'Lương chưa về nữa…', 'Ráng xong ca này.'],
    hocsinh: ['Mai kiểm tra Toán rồi!', 'Ê, đi ăn vặt không?', 'Cô chủ nhiệm khó ghê.', 'Hết tiền tiêu vặt rồi…'],
    vanphong: ['Deadline dí quá.', 'Họp hoài mệt ghê.', 'Trưa nay ăn gì cho nhanh?', 'Sếp lại đổi ý nữa rồi.'],
    shipper: ['Kẹt xe quá trời.', 'Đơn này xa dữ.', 'Khách không nghe máy nữa.', 'Chạy thêm vài đơn rồi nghỉ.'],
    taixe: ['Xăng lại lên giá.', 'Ế khách ghê.', 'Kiếm ly trà đá cái đã.', 'Đường này hay kẹt lắm.'],
    nguoigia: ['Hồi xưa khu này toàn ruộng.', 'Đau lưng quá.', 'Con cháu nó bận hết rồi.', 'Đi bộ chút cho khoẻ.'],
    phuhuynh: ['Con ơi, đi sát vô!', 'Lát mẹ mua cho.', 'Đừng chạy ra đường nghen.', 'Về còn nấu cơm nữa.'],
    treem: ['Mẹ ơi, con muốn ăn cái kia!', 'Con mỏi chân quá à.', 'Mua kẹo cho con đi!'],
    dukhach: ['Wow, đẹp quá!', 'Việt Nam ngon ngon!', 'Xin chào!', 'Ở đây vui ghê.'],
    nhagiau: ['Khu này bụi bặm quá.', 'Gọi tài xế tới đón đi.', 'Cuối tuần đi resort thôi.'],
    vogiacu: ['Có gì ăn không…', 'Đêm qua lạnh quá.', 'Lại một ngày nữa.'],
    khotinh: ['Đường sá gì dơ quá.', 'Bây giờ làm ăn ẩu lắm.', 'Giá cả leo thang thấy sợ.'],
    phebinh: ['Để xem quán nào đáng viết bài.', 'Ẩm thực đường phố luôn có bất ngờ.'],
    hangrong: ['Vé số đây, chiều xổ!', 'Ai bánh ú, bánh giò hông…', 'Ế quá trời.', 'Nắng mưa gì cũng phải đi.'],
    giangho: ['Khu này của tụi anh.', 'Nhìn gì?', 'Bữa nay thu chưa đủ.'],
    congan: ['Giữ gìn trật tự nha bà con.', 'Không buôn bán lấn chiếm lòng đường.', 'Đi tuần chút.'],
  } as Record<ArchId, string[]>,
};

/** Người bán & nhân vật cố định. look = hàng trong bảng khuôn mặt. */
export interface FixedNpcDef { id: string; name: string; face: number; fem: boolean; shirt: number; pants: number; hair: number; hat: number; hairStyle: number; fat: number; h: number; }
export const FIXED: Record<string, FixedNpcDef> = {
  m_rau: { id: 'm_rau', name: 'Cô Bảy', face: 4, fem: true, shirt: 0x8a5a9a, pants: 0x2a2e3a, hair: 0x3a2a22, hat: 1, hairStyle: 2, fat: 1.1, h: 0.95 },
  m_cu: { id: 'm_cu', name: 'Chú Mười', face: 7, fem: false, shirt: 0x5a7a4a, pants: 0x4a4a42, hair: 0x1e1a18, hat: 4, hairStyle: 0, fat: 1.15, h: 1 },
  m_thit: { id: 'm_thit', name: 'Anh Tư', face: 0, fem: false, shirt: 0xf3f0e8, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 0, fat: 1.2, h: 1.03 },
  m_haisan: { id: 'm_haisan', name: 'Chị Năm', face: 1, fem: true, shirt: 0x2f8fd5, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 1, hairStyle: 2, fat: 1.0, h: 0.97 },
  m_kho: { id: 'm_kho', name: 'Bà Hai', face: 4, fem: true, shirt: 0xb9a88a, pants: 0x3a3a42, hair: 0xd9d9d6, hat: 0, hairStyle: 2, fat: 1.1, h: 0.92 },
  m_giavi: { id: 'm_giavi', name: 'Cô Út', face: 1, fem: true, shirt: 0xe86f9a, pants: 0x2a2e3a, hair: 0x2a2420, hat: 0, hairStyle: 1, fat: 0.95, h: 0.96 },
  m_trung: { id: 'm_trung', name: 'Dì Sáu', face: 4, fem: true, shirt: 0x3fae5a, pants: 0x3a3a42, hair: 0x3a2a22, hat: 1, hairStyle: 2, fat: 1.15, h: 0.94 },
  bakery: { id: 'bakery', name: 'Anh Bảo', face: 0, fem: false, shirt: 0xf5c531, pants: 0x3a5a8a, hair: 0x1e1a18, hat: 2, hairStyle: 0, fat: 1, h: 1.02 },
  mart: { id: 'mart', name: 'Bé Na', face: 1, fem: true, shirt: 0x2fae5a, pants: 0x2a2e3a, hair: 0x6a3a22, hat: 0, hairStyle: 1, fat: 0.92, h: 0.95 },
  kiosk: { id: 'kiosk', name: 'Cô Ba', face: 4, fem: true, shirt: 0xc9665a, pants: 0x2a2e3a, hair: 0x3a2a22, hat: 0, hairStyle: 2, fat: 1.2, h: 0.94 },
  wholesale: { id: 'wholesale', name: 'Chú Tám', face: 7, fem: false, shirt: 0x4a5a6a, pants: 0x4a4a42, hair: 0x1e1a18, hat: 2, hairStyle: 0, fat: 1.25, h: 1.02 },
  pharmacy: { id: 'pharmacy', name: 'Cô Dược', face: 5, fem: true, shirt: 0xf7f7f7, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 0.95, h: 0.96 },
  equip: { id: 'equip', name: 'Chú Ba Tài', face: 7, fem: false, shirt: 0x3f6a9a, pants: 0x4a4a42, hair: 0x2a2420, hat: 0, hairStyle: 3, fat: 1.2, h: 1.0 },
  eatery: { id: 'eatery', name: 'Bà Tư', face: 4, fem: true, shirt: 0xf3f0e8, pants: 0x2a2e3a, hair: 0xbfbfbc, hat: 0, hairStyle: 2, fat: 1.15, h: 0.93 },
  scrap: { id: 'scrap', name: 'Ông Tư Rác', face: 3, fem: false, shirt: 0x7a6a58, pants: 0x4a4a42, hair: 0xbfbfbc, hat: 4, hairStyle: 3, fat: 0.95, h: 0.97 },
  pawn: { id: 'pawn', name: 'Chú Lâm', face: 5, fem: false, shirt: 0x6a1e2e, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 0, fat: 1.1, h: 1.0 },
  bank: { id: 'bank', name: 'Chị Thu', face: 5, fem: true, shirt: 0x2f3a52, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 0.92, h: 0.97 },
  shark: { id: 'shark', name: 'Hùng Sẹo', face: 6, fem: false, shirt: 0x1e1e22, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 3, fat: 1.3, h: 1.08 },
  motel: { id: 'motel', name: 'Dì Chín', face: 4, fem: true, shirt: 0xd9a05a, pants: 0x2a2e3a, hair: 0x3a2a22, hat: 0, hairStyle: 2, fat: 1.2, h: 0.93 },
  tro: { id: 'tro', name: 'Bác Năm chủ trọ', face: 3, fem: false, shirt: 0xb9a88a, pants: 0x3a3a42, hair: 0xd9d9d6, hat: 0, hairStyle: 3, fat: 1.1, h: 0.98 },
  hotel: { id: 'hotel', name: 'Lễ tân Vy', face: 1, fem: true, shirt: 0x6a1e2e, pants: 0x1e2430, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 0.9, h: 0.98 },
  dock: { id: 'dock', name: 'Anh Sáu Lực', face: 0, fem: false, shirt: 0xb5653c, pants: 0x4a4a42, hair: 0x1e1a18, hat: 2, hairStyle: 0, fat: 1.25, h: 1.06 },
  hobo: { id: 'hobo', name: 'Ông Bảy Lang Thang', face: 3, fem: false, shirt: 0x6a6258, pants: 0x4a4a42, hair: 0xbfbfbc, hat: 4, hairStyle: 1, fat: 0.9, h: 0.96 },
};
