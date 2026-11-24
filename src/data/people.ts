// NPC — 16 nhóm khách, tên, tính cách và lời thoại tiếng Việt. Thêm nhóm/lời thoại mới ngay tại đây.
import type { RecipeCat } from './recipes';
import type { District } from '../world/layout';

export type ArchId = 'congnhan' | 'hocsinh' | 'vanphong' | 'shipper' | 'taixe' | 'nguoigia' | 'phuhuynh' | 'treem' | 'dukhach' | 'nhagiau' | 'vogiacu'
  | 'khotinh' | 'phebinh' | 'hangrong' | 'giangho' | 'congan';
export type BegStyle = 'lephep' | 'kekho' | 'naini';
export interface ArchDef {
  id: ArchId; name: string; w: number;                    // w: tỉ lệ xuất hiện
  faces: number[]; shirts: number[]; pants: number[]; hair: number[]; hats: number[]; // hats: 0 không, 1 nón lá, 2 nón kết, 3 mũ bảo hiểm, 4 mũ tai bèo
  hairStyle: number[];                                    // 0 ngắn, 1 dài, 2 búi, 3 hói, 4 xoăn, 5 đuôi ngựa, 6 húi cua, 7 tém ngang vai
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
  congnhan: { id: 'congnhan', name: 'Công nhân', w: 18, faces: [0, 7, 0, 1], shirts: P.work, pants: P.khaki, hair: P.hairB, hats: [0, 2, 3, 4, 0], hairStyle: [0, 0, 6], h: [0.96, 1.04], fat: [0.95, 1.15], fem: 0.25, bag: 0.1,
    budget: [15000, 32000], wtp: 0.88, sens: 1.5, patience: [50, 85], tip: 0.03, pref: { com: 1.6, banhmi: 1.4, bunpho: 1.2, nuoc: 1.2, mi: 1.1, nuong: 1 },
    beg: { lephep: 0.3, kekho: 0.38, naini: 0.12, amt: [1000, 5000], food: 0.08 }, speed: 1.45, self: ['anh', 'chị'], you: 'em', where: { laodong: 3, khobai: 2, nhanghi: 2, cho: 1, trungtam: 1 }, hours: [5, 21] },
  hocsinh: { id: 'hocsinh', name: 'Học sinh', w: 14, faces: [0, 1, 5, 1], shirts: P.white, pants: [0x2a3a6a, 0x2f3a52], hair: P.hairB, hats: [0, 0, 2], hairStyle: [0, 1, 2, 7, 5], h: [0.86, 0.96], fat: [0.85, 1], fem: 0.5, bag: 0.9,
    budget: [8000, 22000], wtp: 0.8, sens: 1.8, patience: [40, 75], tip: 0, pref: { anvat: 2, xien: 2, chien: 1.7, nuoc: 1.5, che: 1.5, banhmi: 1.2, burger: 1.2 },
    beg: { lephep: 0.22, kekho: 0.3, naini: 0.08, amt: [1000, 3000], food: 0.1 }, speed: 1.5, self: ['em', 'em'], you: '{ac}', where: { dancu: 3, congvien: 2, trungtam: 2, cho: 1 }, hours: [6, 20] },
  vanphong: { id: 'vanphong', name: 'Dân văn phòng', w: 14, faces: [0, 1, 5, 5], shirts: P.office, pants: P.dark, hair: P.hairDye, hats: [0], hairStyle: [0, 1, 2, 5, 7], h: [0.96, 1.04], fat: [0.9, 1.05], fem: 0.5, bag: 0.5,
    budget: [25000, 60000], wtp: 1.15, sens: 1.0, patience: [35, 60], tip: 0.1, pref: { com: 1.4, bunpho: 1.5, mi: 1.3, nuoc: 1.6, goi: 1.4, burger: 1.2, banhmi: 1.1 },
    beg: { lephep: 0.3, kekho: 0.22, naini: 0.05, amt: [2000, 10000], food: 0.05 }, speed: 1.6, self: ['anh', 'chị'], you: 'em', where: { vanphong: 4, trungtam: 2, nhagiau: 1.5, congvien: 1 }, hours: [7, 20] },
  shipper: { id: 'shipper', name: 'Shipper', w: 8, faces: [0, 7, 0], shirts: [0x2fae5a, 0xf08a2f, 0xe2402f, 0x2f8fd5], pants: P.jeans, hair: P.hairB, hats: [3, 3, 2], hairStyle: [0, 6], h: [0.96, 1.03], fat: [0.9, 1.05], fem: 0.12, bag: 0.8,
    budget: [15000, 35000], wtp: 0.92, sens: 1.4, patience: [25, 45], tip: 0.03, pref: { banhmi: 1.8, com: 1.4, nuoc: 1.6, xien: 1, mi: 1.1 },
    beg: { lephep: 0.3, kekho: 0.35, naini: 0.1, amt: [1000, 5000], food: 0.1 }, speed: 1.75, self: ['anh', 'chị'], you: 'em', where: { trungtam: 3, nhanghi: 2, cho: 2, vanphong: 1.5, dancu: 1 }, hours: [6, 23] },
  taixe: { id: 'taixe', name: 'Tài xế', w: 7, faces: [7, 0, 3], shirts: P.work, pants: P.khaki, hair: P.hairB, hats: [0, 2, 2], hairStyle: [0, 3, 6], h: [0.97, 1.04], fat: [1.05, 1.25], fem: 0.05, bag: 0,
    budget: [20000, 40000], wtp: 0.95, sens: 1.3, patience: [45, 80], tip: 0.05, pref: { com: 1.6, bunpho: 1.5, nuoc: 1.5, nuong: 1.2, haisan: 1 },
    beg: { lephep: 0.3, kekho: 0.3, naini: 0.15, amt: [1000, 5000], food: 0.05 }, speed: 1.35, self: ['chú', 'cô'], you: 'con', where: { nhanghi: 3, khobai: 2, cho: 2, laodong: 1 }, hours: [5, 23] },
  nguoigia: { id: 'nguoigia', name: 'Người lớn tuổi', w: 9, faces: [3, 4], shirts: P.old, pants: P.dark, hair: P.hairW, hats: [0, 1, 4, 0], hairStyle: [0, 2, 3], h: [0.9, 0.98], fat: [0.9, 1.15], fem: 0.55, bag: 0.15,
    budget: [12000, 35000], wtp: 0.9, sens: 1.5, patience: [70, 120], tip: 0.04, pref: { bunpho: 1.7, che: 1.6, com: 1.2, nuoc: 1.1, goi: 1.2 },
    beg: { lephep: 0.55, kekho: 0.45, naini: 0.06, amt: [2000, 10000], food: 0.18 }, speed: 0.95, self: ['bác', 'bà'], you: 'con', where: { dancu: 3, congvien: 3, cho: 2.5, khobai: 1 }, hours: [5, 19] },
  phuhuynh: { id: 'phuhuynh', name: 'Phụ huynh', w: 6, faces: [1, 0, 5], shirts: P.bright, pants: P.jeans, hair: P.hairDye, hats: [0, 4], hairStyle: [1, 0, 2, 5, 7], h: [0.95, 1.02], fat: [0.92, 1.1], fem: 0.7, bag: 0.6,
    budget: [25000, 70000], wtp: 1.05, sens: 1.1, patience: [40, 70], tip: 0.06, pref: { anvat: 1.4, che: 1.5, nuoc: 1.4, burger: 1.5, chien: 1.5, xien: 1.3, com: 1 },
    beg: { lephep: 0.4, kekho: 0.4, naini: 0.04, amt: [2000, 10000], food: 0.1 }, speed: 1.2, self: ['anh', 'chị'], you: 'em', where: { congvien: 4, dancu: 3, trungtam: 1.5, cho: 1.5 }, hours: [6, 20] },
  treem: { id: 'treem', name: 'Trẻ em', w: 0, faces: [2], shirts: P.bright, pants: P.bright, hair: P.hairB, hats: [0, 2, 4], hairStyle: [0, 1, 2, 6], h: [0.6, 0.72], fat: [0.9, 1.05], fem: 0.5, bag: 0.3,
    budget: [0, 0], wtp: 1, sens: 1, patience: [30, 60], tip: 0, pref: {}, beg: { lephep: 0, kekho: 0, naini: 0, amt: [0, 0], food: 0 }, speed: 1.25, self: ['con', 'con'], you: '{ac}', where: {}, hours: [6, 20] },
  dukhach: { id: 'dukhach', name: 'Khách du lịch', w: 5, faces: [0, 1, 5, 7], shirts: P.bright, pants: P.khaki, hair: [0xd9a05a, 0x9a5a2a, 0x6a3a22, 0xe9c88a], hats: [1, 2, 4, 0], hairStyle: [0, 1, 4, 5], h: [1.0, 1.1], fat: [0.95, 1.2], fem: 0.5, bag: 0.9,
    budget: [40000, 120000], wtp: 1.45, sens: 0.6, patience: [50, 90], tip: 0.3, pref: { bunpho: 2, banhmi: 1.8, goi: 1.6, nuoc: 1.4, haisan: 1.4, nuong: 1.3 },
    beg: { lephep: 0.45, kekho: 0.4, naini: 0.18, amt: [5000, 20000], food: 0.05 }, speed: 1.1, self: ['tôi', 'tôi'], you: 'bạn', where: { congvien: 3, vanphong: 2, trungtam: 2.5, cho: 2.5, nhagiau: 1 }, hours: [8, 22] },
  nhagiau: { id: 'nhagiau', name: 'Người giàu', w: 5, faces: [5, 1, 0], shirts: P.rich, pants: P.dark, hair: P.hairDye, hats: [0], hairStyle: [0, 1, 2, 7], h: [0.98, 1.06], fat: [0.95, 1.2], fem: 0.5, bag: 0.4,
    budget: [50000, 200000], wtp: 1.6, sens: 0.5, patience: [25, 45], tip: 0.25, pref: { haisan: 2, burger: 1.3, nuoc: 1.4, goi: 1.4, bunpho: 1.2 },
    beg: { lephep: 0.22, kekho: 0.14, naini: 0.02, amt: [5000, 50000], food: 0 }, speed: 1.3, self: ['anh', 'chị'], you: 'em', where: { nhagiau: 4, vanphong: 2.5, congvien: 1 }, hours: [7, 22] },
  vogiacu: { id: 'vogiacu', name: 'Người vô gia cư', w: 3, faces: [3, 7, 0], shirts: P.rag, pants: P.rag, hair: P.hairB, hats: [0, 4, 0], hairStyle: [1, 3, 0, 4], h: [0.93, 1.0], fat: [0.85, 0.95], fem: 0.15, bag: 0.5,
    budget: [3000, 10000], wtp: 0.6, sens: 2.4, patience: [80, 140], tip: 0, pref: { nuoc: 1.5, banhmi: 1.5, anvat: 1 },
    beg: { lephep: 0.1, kekho: 0.15, naini: 0, amt: [500, 1000], food: 0.2 }, speed: 0.9, self: ['tui', 'tui'], you: 'chú em', where: { gamcau: 4, laodong: 2, congvien: 1.5 }, hours: [5, 24] },
  khotinh: { id: 'khotinh', name: 'Khách khó tính', w: 4, faces: [5, 4, 3], shirts: P.office, pants: P.dark, hair: P.hairDye, hats: [0], hairStyle: [2, 0, 3], h: [0.94, 1.02], fat: [0.95, 1.2], fem: 0.6, bag: 0.5,
    budget: [25000, 70000], wtp: 1.0, sens: 1.6, patience: [22, 40], tip: 0, pref: { bunpho: 1.4, com: 1.3, goi: 1.3, haisan: 1.3 },
    beg: { lephep: 0.12, kekho: 0.08, naini: 0, amt: [1000, 5000], food: 0 }, speed: 1.3, self: ['cô', 'cô'], you: 'cháu', where: { trungtam: 2, dancu: 2, vanphong: 1.5, nhagiau: 2 }, hours: [7, 20] },
  phebinh: { id: 'phebinh', name: 'Nhà phê bình ẩm thực', w: 0, faces: [5], shirts: [0x6a1e2e, 0x1e4a3a], pants: P.dark, hair: P.hairDye, hats: [4, 0], hairStyle: [0, 1, 7], h: [0.98, 1.04], fat: [1.05, 1.25], fem: 0.4, bag: 1,
    budget: [200000, 300000], wtp: 1.5, sens: 0.6, patience: [45, 70], tip: 0.2, pref: {}, beg: { lephep: 0.1, kekho: 0.05, naini: 0, amt: [5000, 20000], food: 0 }, speed: 1.2, self: ['tôi', 'tôi'], you: 'bạn', where: {}, hours: [10, 20] },
  hangrong: { id: 'hangrong', name: 'Người bán hàng rong', w: 4, faces: [4, 1, 7], shirts: P.old, pants: P.dark, hair: P.hairB, hats: [1, 1, 4], hairStyle: [2, 0, 5], h: [0.92, 1.0], fat: [0.9, 1.1], fem: 0.7, bag: 0.2,
    budget: [10000, 25000], wtp: 0.8, sens: 1.8, patience: [50, 90], tip: 0, pref: { nuoc: 1.6, che: 1.2, banhmi: 1.2, com: 1.2 },
    beg: { lephep: 0.35, kekho: 0.45, naini: 0.1, amt: [1000, 3000], food: 0.25 }, speed: 1.1, self: ['cô', 'cô'], you: 'con', where: { cho: 3, laodong: 2, trungtam: 1.5, congvien: 1.5, nhanghi: 1 }, hours: [5, 21] },
  giangho: { id: 'giangho', name: 'Giang hồ', w: 2, faces: [6], shirts: [0x1e1e22, 0x6a1e1e, 0xf3f0e8], pants: P.dark, hair: P.hairB, hats: [0], hairStyle: [0, 3, 6], h: [1.0, 1.08], fat: [1.05, 1.3], fem: 0, bag: 0,
    budget: [20000, 60000], wtp: 0.7, sens: 0.8, patience: [18, 35], tip: 0, pref: { nuong: 1.6, haisan: 1.4, nuoc: 1.5, xien: 1.2 },
    beg: { lephep: 0.05, kekho: 0.05, naini: 0, amt: [1000, 2000], food: 0 }, speed: 1.2, self: ['anh', 'anh'], you: 'chú em', where: { laodong: 3, nhanghi: 2.5 }, hours: [10, 24] },
  congan: { id: 'congan', name: 'Công an phường', w: 2, faces: [0, 7], shirts: [0x6a8a4a, 0x5a7a42], pants: [0x4a6238, 0x3a5230], hair: P.hairB, hats: [2], hairStyle: [0, 6], h: [1.0, 1.06], fat: [0.95, 1.15], fem: 0.1, bag: 0,
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

/**
 * Người lạ trông ra sao khi nhìn bằng mắt. KHÔNG phải nghề nghiệp: ngoài đường ta không biết ai làm nghề gì,
 * chỉ nhận ra được bộ đồng phục, tuổi tác, vẻ ngoài. Tên thật và nghề chỉ lộ ra khi đã quen.
 */
export const SEEN: Record<ArchId, string> = {
  congnhan: 'Người lạ', hocsinh: 'Học sinh', vanphong: 'Người lạ', shipper: 'Người lạ', taixe: 'Người lạ', nguoigia: 'Người lớn tuổi',
  phuhuynh: 'Người lạ', treem: 'Trẻ em', dukhach: 'Khách du lịch', nhagiau: 'Người lạ', vogiacu: 'Người vô gia cư', khotinh: 'Người lạ',
  phebinh: 'Người lạ', hangrong: 'Người lạ', giangho: 'Người lạ', congan: 'Công an',
};
/** Người đứng quầy mà ta chưa từng nói chuyện: chỉ biết họ làm gì ở đó (nhìn là thấy), chưa biết tên. */
export const FIXED_ROLE: Record<string, string> = {
  m_rau: 'Người bán rau', m_cu: 'Người bán củ quả', m_thit: 'Người bán thịt', m_haisan: 'Người bán hải sản', m_kho: 'Người bán đồ khô',
  m_giavi: 'Người bán gia vị', m_trung: 'Người bán trứng, sữa, giò chả', bakery: 'Thợ làm bánh', mart: 'Nhân viên siêu thị', kiosk: 'Cô bán tạp hoá',
  wholesale: 'Chủ vựa sỉ', pharmacy: 'Dược sĩ', equip: 'Chủ tiệm đồ nghề', eatery: 'Bà chủ quán cơm', scrap: 'Chủ vựa ve chai', scrap2: 'Chủ vựa ve chai',
  pawn: 'Chủ tiệm cầm đồ', bank: 'Nhân viên ngân hàng', shark: 'Gã mặt sẹo', motel: 'Chủ nhà nghỉ', tro: 'Ông chủ trọ',
  hotel: 'Lễ tân khách sạn', dock: 'Cai bốc vác', hobo: 'Ông lão lang thang',
  hot_toc: 'Thợ cắt tóc', thoi_trang: 'Cô bán quần áo', cafe: 'Chủ quán cà phê',
  canho: 'Quản lý căn hộ', nharieng: 'Chủ nhà', cuahang: 'Chủ tạp hoá',
  hospital: 'Bác sĩ trực',
  police: 'Công an khu vực',
  net: 'Chủ quán net', net_bi: 'Khách chơi game', net_nhung: 'Khách lướt web',
  dua: 'Nhóm đua xe đạp', dua_mai: 'Nhóm đua xe đạp', dua_thao: 'Nhóm đua xe đạp',
  tra_da: 'Cô bán trà đá', rap: 'Cậu nhóc nhảy đường phố', sua_xe: 'Thợ sửa xe vỉa hè',
  hat_rong: 'Người hát rong', danh_co: 'Ông già đánh cờ', danh_giay: 'Cậu bé đánh giày',
  chu_ba: 'Chú xe ôm',
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
  // Tên đẹp và tên "troll" của tụi nhỏ: chỉ những người thực sự quen mới lộ tên, nên đây là những người
  // người chơi sẽ gặp lại nhiều lần chứ không phải người qua đường.
  { id: 'chi_ngoc', name: 'Chị Ngọc Hân', arch: 'vanphong', fem: true, likes: ['bunpho', 'nuoc', 'goi'], hour: 11.9, note: 'Tên đẹp, tính kỹ, luôn mua thêm phần mang về.', seed: 21 },
  { id: 'ca_rot', name: 'Cà Rốt', arch: 'hocsinh', fem: false, likes: ['anvat', 'xien', 'nuoc'], hour: 16.2, note: 'Em út nhóm nhảy của Bin, nói chuyện toàn tiếng lóng.', seed: 22 },
  { id: 'meo_mun', name: 'Mèo Mun', arch: 'hocsinh', fem: true, likes: ['che', 'chien', 'nuoc'], hour: 17.4, note: 'Tên ở nhóm, đeo tai nghe cả ngày.', seed: 23 },
];

/** Nhân vật phụ: người có tên, tính nết và câu chuyện riêng, đứng ở những góc nhỏ ven đường.
 *  topics: những câu hỏi người chơi mở ra được; đã hỏi rồi thì lần sau không hỏi lại (lưu trong flags). */
export interface SideTopic { q: string; a: string; }
export interface SideDef { intro: string; again: string; topics: SideTopic[]; }
export const SIDE: Record<string, SideDef> = {

  net_bi: {
    intro: 'Thằng Bi dán mắt vô màn hình, một tay bấm phím một tay cầm ly nước ngọt. “Khoan khoan, để tao qua màn này cái.”',
    again: '“Ủa mày cũng chơi hả? Ngồi kế bên đi, tao chỉ cho chỗ farm.”',
    topics: [
      { q: 'Mày chơi game gì đó?', a: 'Game kiếm hiệp đó. Tối nào tao cũng ra đây, hai ngàn một giờ, chơi tới mười giờ rưỡi thì dzìa. Mẹ tao mà biết là ăn đòn, nên mày đừng có nói nghen.' },
      { q: 'Học hành sao rồi?', a: 'Học thì... cũng được. Mà tao tính rồi, lớn lên tao đi làm game. Ngồi đây chơi hoài cũng thành nghề chớ gì. Chị Hạnh nói tao mơ mộng, mà tao thấy cũng đúng mà.' },
    ],
  },
  net_nhung: {
    intro: 'Con Nhung ngồi ngay ngắn, màn hình sáng rực một khung chat. “Suỵt, tao đang chat với ảnh, đừng có đứng kế bên.”',
    again: '“Lại ghé hả? Ngồi đỡ đi, chị Hạnh tính ba ngàn một giờ đó.”',
    topics: [
      { q: 'Chat với ai mà cười hoài vậy?', a: 'Bạn tao, học trên Sài Gòn. Hồi trước học chung, giờ ảnh lên đó ở với dì. Ngày nào cũng hẹn nhau tám giờ tối, trễ năm phút là ảnh giận. Mà chat có nhiêu đâu, ba ngàn một giờ, còn rẻ hơn cái điện thoại.' },
      { q: 'Sao không xài điện thoại?', a: 'Điện thoại gì con ơi, tao xài chung với má. Mà má giữ suốt ngày. Ra đây ngồi một tiếng, vừa chat vừa nghe nhạc, sướng hơn ở nhà.' },
    ],
  },
  hot_toc: {
    intro: 'Chú Bảy Kéo đứng bên chiếc ghế nệm đỏ đô trong tiệm, tay lau cây kéo trước tấm gương lớn sáng bóng. “Vô đây ngồi đi con. Cắt gọn cho, mười lăm ngàn, ba chục phút là xong — mà muốn uốn xoăn với tém thì lâu hơn chút.”',
    again: '“Lại ghé tiệm đổi kiểu nữa hả? Ngồi xuống ghế coi, tóc con mọc nhanh ghê.”',
    topics: [
      { q: 'Chú mở tiệm ở khu này lâu chưa?', a: 'Ba chục năm rồi con. Hồi trước chú kê cái ghế cắt ngoài đầu chợ cho mấy chú bộ đội trong xóm, giờ có tuổi rồi nên dọn về căn tiệm nhỏ này ở Khu Dân Cư cho mát mẻ. Tuy vô trong nhà mà giá vẫn mười lăm ngàn, khách quen vẫn tìm tới hoài.' },
      { q: 'Sao chú giữ giá bình dân hoài vậy?', a: 'Làm cho bà con trong xóm mà lấy mắc sao đành. Ở đây chú có cái ghế êm, tấm gương lớn, cây kéo bén là đủ sống khỏe rồi. Cái nghề này, khách quý cái tay nghề với tấm lòng mình chứ cần gì biển hiệu hào nhoáng.' },
    ],
  },
  thoi_trang: {
    intro: 'Cô Ngọc đang phủi bụi mấy cái áo treo trên giá trong tiệm mới mở ở Phố Trung Tâm. “Vô trong lựa đi con, áo quần cô mới về, giá mềm thôi. Mặc đẹp mà bán hàng, khách nhìn cũng thấy tin.”',
    again: '“Ghé nữa hả? Cô mới treo thêm mấy cái áo đỏ đó, coi thử đi.”',
    topics: [
      { q: 'Cô lấy hàng ở đâu vậy?', a: 'Cô đi mối ở An Đông, sáng sớm lên lấy một bao, về treo bán lẻ. Lời mỗi cái vài ngàn, mà bán được nhiều thì cũng đủ sống. Mấy đứa bán hàng rong trong xóm toàn lấy đồ của cô đó.' },
      { q: 'Sao cô dọn từ trong chợ ra đây?', a: 'Bán trong chợ thì đông thiệt, mà nắng mưa bay vô giá áo hoài, với lại khách lựa đồ ngại đứng giữa lối đi. Cô dành dụm mướn được căn mặt tiền này, có cửa cuốn, có tủ kính, khách vô trong ngắm thoải mái. Mỗi tháng thêm tiền thuê mà đỡ khổ hơn nhiều con ơi.' },
      { q: 'Mặc đẹp có giúp bán được hàng không?', a: 'Chớ sao không. Người ta đi ngang, thấy mình lem luốc là họ ngại ghé. Mặc đồ sạch, tóc tai gọn gàng, họ tin mình hơn — đồ ăn cũng thấy ngon hơn. Cô nói thiệt đó, không phải khoe hàng đâu.' },
    ],
  },
  cafe: {
    intro: 'Anh Phong đang tráng phin cà phê bằng nước sôi, mùi rang xay thơm phức bay khắp quán. “Vô ngồi chơi em! Quán anh có cà phê sữa đá, trà đào cam sả với bạc xỉu, ngồi thư giãn thoải mái nha.”',
    again: '“Lại ghé quán hả em? Chọn bàn ngoài hiên hay ngồi trong uống ly gì cho tỉnh táo?”',
    topics: [
      { q: 'Quán mình mở ở đây lâu chưa anh?', a: 'Cũng gần bốn năm rồi. Hồi khu căn hộ kế bên mới xây xong là anh thuê mặt bằng này mở quán. Sáng chiều dân văn phòng với mấy cô chú trong chung cư xuống uống đông lắm.' },
      { q: 'Bí quyết pha cà phê ngon của quán là gì?', a: 'Cà phê phải rang vừa, đừng khét quá, pha phin nhôm chậm từng giọt. Sáng ra nghe tiếng nước nhỏ giọt với mùi cà phê ấm là thấy đời nhẹ đi phân nửa rồi.' },
    ],
  },
  tra_da: {
    intro: 'Cô Thắm ngồi bên chiếc bàn nhựa, tay phe phẩy quạt giấy. “Ngồi đi con, nắng lắm.”',
    again: '“Lại ghé hả? Ngồi đi, cô rót cho ly trà đá.”',
    topics: [
      { q: 'Cô bán ở đây bao lâu rồi?', a: 'Ba chục năm rồi con. Hồi đó chỗ này còn là bãi đất trống, cô dựng cái bàn gỗ bán cho mấy anh xe ôm. Giờ xe ôm chạy app hết trơn, mà khách quen cũ vẫn ghé. Ngồi đây là nghe được chuyện của nửa cái xóm.' },
      { q: 'Con trai cô đâu rồi?', a: 'Nó đi lao động bên Đài, hai năm mới về một lần. Tháng nào cũng gửi tiền về, mà cô có xài đâu — để dành cưới vợ cho nó. Con rảnh thì ghé ngồi, cô kể chuyện cho nghe.' },
      { q: 'Bán trà đá có lời không cô?', a: 'Lời gì con. Ly ba ngàn, bán năm chục ly mới đủ tiền chợ. Mà cô bán cho vui, cho có người nói chuyện. Bộ con tính bán hàng hả? Bán đi, khổ mà vui, cô ủng hộ.' },
    ],
  },
  rap: {
    intro: 'Thằng nhóc đội nón lưỡi trai ngược, tai nghe một bên. “Ê, đứng coi chút đi. Tui đang tập bài cho vòng loại.”',
    again: '“Ghé coi tui tập hả? Ngồi đó đi, khúc này khó lắm.”',
    topics: [
      { q: 'Tập nhảy ở đây không ồn à?', a: 'Ồn chứ. Công an xuống hoài. Mà hết chỗ rồi — sân nhà thiếu nhi đóng cửa, quán net thì chật. Gầm cầu này tiếng vang, đúng bài luôn. Nhảy tới khuya là có người đi ngang quăng cho chai nước.' },
      { q: 'Sao mày không lo học?', a: 'Học buổi sáng mà. Chiều đi giao hàng kiếm tiền mua giày. Má nói nhảy nhót gì, lo học đi. Mà tui thấy đứng trên sân khấu là lúc tui giỏi nhất… Nghe sến ha?' },
      { q: 'Tên Bin ở đâu ra?', a: 'Tên thật là Bùi Tuấn Anh. Bin là tên nhóm. Trong nhóm còn Cà Rốt, Mèo Mun, Bắp Rang. Kêu tên thật là tui không quay lại đâu đó nghen.' },
    ],
  },
  sua_xe: {
    intro: 'Chú Hậu đang cạy cái nắp máy, tay dính dầu. “Chờ chút, xong con ốc này đã.”',
    again: '“Ngồi chơi. Xe cộ gì cần thì nói, chú làm cho.”',
    topics: [
      { q: 'Chú sửa xe bao nhiêu năm rồi?', a: 'Ba mươi lăm năm. Chú học nghề từ hồi mười bảy, vá ruột xe đạp cho lính ở bến. Xe máy thời đó hiếm lắm, cả xóm có một chiếc, hư là cả xóm biết.' },
      { q: 'Giờ sửa xe máy khó hơn hồi xưa không?', a: 'Giờ toàn xe tay ga, phải có máy đọc lỗi. Chú không rành, nên chỉ nhận vá bánh, thay nhớt, bơm hơi. Mà vậy đủ sống. Cái gì mình biết thì làm cho chắc, đừng ham.' },
      { q: 'Chiếc xe cũ kia của chú hả?', a: 'Chiếc Cub đó hả. Mua năm tám mươi tám, chở vợ đi đám cưới. Giờ không chạy nữa, để đó làm kỷ niệm. Bán thì được mấy đồng, mà bán rồi lấy gì nhớ.' },
    ],
  },
  hat_rong: {
    intro: 'Cô Hồng ngồi trên ghế nhựa, cây đàn cũ kê trên đùi. “Ngồi nghe một bài không con?”',
    again: '“Con tới nữa hả. Ngồi đó đi, cô hát bài khác.”',
    topics: [
      { q: 'Cô hát ở đây lâu chưa?', a: 'Hát từ hồi còn trong đoàn ca múa. Giờ đoàn giải tán, mắt cũng mờ dần, nên ra đây hát cho người qua đường nghe. Mỗi người bỏ vô thùng vài ngàn, cô đủ tiền chợ. Hát cho vui chứ có ai trả lương đâu con.' },
      { q: 'Bài cô đang hát nói về gì?', a: 'Về con sông quê cô. Hồi nhỏ cô tắm sông, giờ sông lấp rồi, thành đường lớn. Hát để nhớ thôi, chứ ai còn về đó nữa.' },
      { q: 'Cô cần con giúp gì không?', a: 'Không cần đâu con. Con ngồi nghe hết một bài là được rồi. Người ta đi ngang qua mà dừng lại nghe, vậy là quý lắm.' },
    ],
  },
  danh_co: {
    intro: 'Ông Tư ngồi trước bàn cờ tướng, quân đã xếp sẵn. “Có ai chơi không ta? Ngồi đây cả buổi rồi.”',
    again: '“Lại đây lại đây, làm một ván.”',
    topics: [
      { q: 'Ông chơi cờ lâu chưa?', a: 'Từ hồi còn đi làm. Trưa nào cũng ra gốc cây, hai ông một bàn cờ, chơi tới giờ vô ca. Giờ mấy ông đó đi hết rồi, còn tui với cái bàn này. Con chơi được thì chơi, không thì ngồi coi cũng vui.' },
      { q: 'Sao ông không qua quán cà phê chơi?', a: 'Quán cà phê có máy lạnh, mà tui không quen. Ở đây có bóng cây, có gió, lại có con nít trong xóm ghé coi. Tui chỉ cho tụi nó đi quân, vậy là có chuyện làm.' },
      { q: 'Hồi xưa ông làm nghề gì?', a: 'Thợ hồ. Cái chợ Xóm Chiều này tui có phần trộn vữa đó nghen. Giờ lưng đau, leo giàn không nổi, nên nghỉ. Nghỉ rồi mới thấy ngày dài ghê.' },
    ],
  },
  danh_giay: {
    intro: 'Thằng bé ngồi trên cái thùng gỗ, hộp xi đánh giày mở toang. “Anh/chị ơi, đánh giày không? Năm ngàn thôi.”',
    again: '“Anh/chị tới nữa hả! Ngồi đi, con đánh cho bóng liền.”',
    topics: [
      { q: 'Sao không đi học vậy Bo?', a: 'Học buổi sáng rồi mà. Chiều ra đây kiếm tiền… Bà nội bệnh, ba con đi làm xa. Con đánh giày một ngày được sáu chục, đủ mua thuốc cho bà.' },
      { q: 'Hộp xi này của con hả?', a: 'Của ông Năm để lại. Ông nói đánh giày phải đánh hai lớp, lớp đầu lấy bụi, lớp sau mới bóng. Ông mất rồi, con giữ hộp xi này, còn cái ghế nhỏ này nữa.' },
      { q: 'Ai dạy con đánh giày?', a: 'Ông Năm chứ ai. Ông nói làm nghề gì cũng phải sạch tay, khách mới tin. Con nhớ hoài câu đó, nên đánh xong là rửa tay liền.' },
    ],
  },
};

// ───────────────────────── Lời thoại ─────────────────────────
// {self}: NPC tự xưng · {you}: gọi người chơi · {dish}: tên món · {price}: giá · {n}: số lượng
/** Điền chỗ trống trong câu nói: `{you}` = cách gọi người chơi, `{self}` = cách nhân vật tự gọi. */
export function fillLine(t: string, n: { fem: boolean; arch: ArchDef }, ac: string): string {
  return t.replace(/\{you\}/g, n.arch.you.replace('{ac}', ac))
    .replace(/\{Self\}/g, n.arch.self[n.fem ? 1 : 0]).replace(/\{self\}/g, n.arch.self[n.fem ? 1 : 0]);
}
/** Một câu riêng của nhân vật cố định (nếu có), đã điền chỗ trống. Dùng để người quen nói giọng của họ. */
export function ownLine(id: string | undefined, n: { fem: boolean; arch: ArchDef }, ac: string, k: number): string | null {
  const a = id ? LINES.own[id] : undefined;
  if (!a || !a.length) return null;
  return fillLine(a[Math.abs(k) % a.length], n, ac);
}

export const LINES = {
  order: ['Cho {self} {n} {dish} nha {you}.', '{You} ơi, {n} {dish}!', 'Bán {self} {n} {dish} đi {you}.', 'Lấy {self} {n} {dish} nghen.', '{n} {dish}, làm lẹ giùm {self} nha.', 'Ở đây có {dish} hả? Cho {self} {n} phần.'],
  order_regular: ['Như mọi khi nha {you}, {n} {dish}.', '{Self} lại ghé nè. {n} {dish} nhé!', 'Nhớ quán {you} quá, cho {self} {n} {dish}.'],
  order_more: ['{Self} ăn thấy ngon quá, cho {self} thêm {dish} nữa đi.', 'Ừ ngon đó. Làm thêm {self} phần {dish} nha.', 'Còn {dish} không {you}? {Self} ăn thêm một phần.', '{Self} ngồi đây ăn luôn. Cho thêm {dish} — {price} hả, được.'],
  order_group: ['Nhóm {self} {n} người, cho {n} phần {dish} nha {you}!', 'Đi chung cả nhóm {n} người — làm giùm {n} phần {dish} nghen {you}.', 'Tụi {self} {n} người ngồi chung bàn, cho {n} phần {dish} đi {you}.'],
  booking_arrive: ['{Self} có đặt bàn trước {n} chỗ đây!', 'Chào {you}, bàn đặt trước {n} người của {self} tới rồi nè!'],
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
  beg_chat: ['Chợ Xóm Chiều sáng sớm hay cần người bốc vác đó, {you} ra thử coi.', 'Quán cơm Bà Tư đang kiếm người rửa chén kìa.', 'Vựa ve chai mua lon với chai nhựa đó — Tư Rác ở Xóm Lao Động, Bà Chín ở Khu Dân Cư, lượm đem bán cũng có tiền.',
    'Hồi đó {self} cũng trắng tay. Bán gánh hàng rong mấy năm là có vốn liền.', 'Trời sắp mưa đó, kiếm chỗ trú đi {you}.', 'Ở hẻm Công Nhân bán đồ ăn sáng đắt lắm nghen.', 'Muốn buôn bán thì ghé tiệm Đồ Nghề Ba Tài mua cặp quang gánh.'],
  /** Câu riêng của từng nhân vật cố định — chen vào lúc họ chào hoặc nói vu vơ, để mỗi người có một giọng.
   *  Chỗ trống `{you}` là cách gọi người chơi (anh/chị), `{self}` là cách họ tự gọi. */
  own: {
    hot_toc: ['Tóc con khô lắm rồi đó, hớt sơ là gọn liền.', 'Chú Bảy Kéo này cắt mấy chục năm, chưa ai chê.', 'Ngồi ghế này là thấy đời nhẹ hẳn.'],
    thoi_trang: ['Cô Ngọc mới về lô hàng vải mát, mặc là biết liền.', 'Đồ đẹp thì bán hàng cũng tự tin hơn con ạ.'],
    equip: ['Đòn gánh, dao thớt, bếp than — thiếu món nào chú Ba Tài cũng lo được.', 'Làm ăn thì đồ phải chắc, đừng tiếc tiền.'],
    eatery: ['Cơm Bà Tư nấu bằng than, thơm từ ngoài ngõ.', 'Rửa chén xong má cho ăn một dĩa, khỏi trả tiền.'],
    hobo: ['Gầm cầu này là nhà của Bảy, hai chục năm rồi.', 'Đời này ai cho mình cái gì thì nhớ, đừng quên.'],
    police: ['Đi đứng cho đàng hoàng nghen.'],
    dock: ['Bao gạo nặng đó, cúi lưng xuống mà vác.', 'Sáng sớm là đông người làm nhất.'],
    shark: ['Nợ thì nhớ trả đúng hẹn. Hùng Sẹo không thích nhắc lần hai.'],
    tra_da: ['Trà đá cô pha, nước đầu đổ đi, nước hai mới ngon.'],
    sua_xe: ['Xích chùng thì tra dầu, bánh mềm thì bơm. Đơn giản vậy thôi.'],
    danh_co: ['Cờ hay là cờ tính trước ba nước.'],
    hat_rong: ['Cô hát cho người ta nghe, ai thương thì cho đồng lẻ.'],
    danh_giay: ['Đôi giày sạch làm người ta nhìn mình khác liền.'],
    net_bi: ['Vô đây chơi chút rồi về lo làm ăn nghen em.'],
    cafe: ['Cà phê ở đây rang tại chỗ, thơm lắm.'],
    chu_ba: ['Xe ôm Chú Ba đây, đi đâu chú chở cho — rẻ hơn xe thồ.', 'Ngồi sau giữ nón cho chắc nghen con.', 'Chạy ngoài đường riết quen mặt hết cả xóm.'],
  } as Record<string, string[]>,
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
  // ── Xấc xược ──
  // Chỉ một vài nhóm người có kiểu cư xử này, và chỉ thỉnh thoảng (xem RUDE): ném giấy, khạc nhổ,
  // mắng, đuổi. Đủ để người chơi thấy đường phố không phải lúc nào cũng dễ chịu, không đủ để thành phiền.
  rude: {
    paper: ['Hê hê.', 'Cầm lấy nè!', 'Nhìn gì đó?', 'Ê, đồ ăn xin!'],
    spit: ['Hứ.', 'Xui cả ngày.', 'Tránh ra coi.', 'Đen thôi, đỏ thì quên đi.'],
    curse: ['Đứng chắn đường hoài vậy!', 'Bán hàng kiểu gì kỳ cục vậy?', 'Nhìn cái gì? Muốn gì?', 'Dẹp ra cho người ta nhờ!', 'Quán gì mà nhìn dơ quá!'],
    chase: ['Đi chỗ khác bán đi!', 'Dẹp ra khỏi đây!', 'Đừng có lảng vảng chỗ này!', 'Biến ra chỗ khác!'],
    begSpit: ['Hứ! Sức dài vai rộng mà đi xin.', 'Xin xỏ gì tầm này.', 'Nhục chưa? Đi kiếm việc đi.'],
  },
  // ── Chào hỏi khi đi ngang (lượt 11) ──
  // Quen mặt thì chào thân, không thì chào theo trời và theo giờ. Đủ ngắn để không thành phiền.
  greet: {
    known: ['Lại là {you} hả! Bữa nay bán gì ngon không?', 'Chào {you} nha, quán đông chưa?', 'Ủa, gặp hoài ta. Khoẻ không {you}?', 'Đi bán sớm dữ, {you}!'],
    rain: ['Mưa vầy mà cũng đi, {you} siêng ghê.', 'Trời mưa, kiếm chỗ trú đi {you} ơi.', 'Ướt hết rồi kìa, coi chừng cảm.', 'Mưa này bán ế lắm, về sớm nghen.'],
    cold: ['Trời lạnh ghê, {you} mặc thêm áo vô.', 'Gió này tê tái luôn.', 'Lạnh quá, có gì nóng nóng ăn cho ấm.'],
    hot: ['Nắng muốn bể đầu, {you} ơi.', 'Nóng này mà đứng đường tội ghê.', 'Kiếm bóng mát mà đứng nghen {you}.'],
    // người đi đường nhận ra người chơi đổi đời / đang túng / đang bị công an để ý
    rich: ['Nghe nói {you} mở quán đông lắm hả?', 'Trời, giờ {you} khác hồi đó rồi nghen.', 'Cho {self} xin vía làm ăn với {you} ơi.', '{You} giờ làm chủ rồi, nhớ đừng quên người quen.'],
    poor: ['{You} ơi, có gì ăn chưa? Nhìn hốc hác quá.', 'Ráng lên nghen {you}, ai cũng có lúc.', 'Cần gì cứ nói, trong xóm giúp nhau.'],
    wanted: ['Đừng lại gần tui nghen, công an đang để ý đó.', 'Nghe nói {you} có chuyện với phường hả?', 'Lo mà lo chuyện của mình đi, tui không dính vô đâu.', 'Đi đứng coi chừng, mấy chú đang nhìn kìa.'],
    morning: ['Chào buổi sáng {you}.', 'Sớm ghê ta, chợ còn vắng.', 'Đi làm sớm dữ.', 'Chợ sáng đông chưa {you}?'],
    noon: ['Trưa rồi, ăn gì chưa {you}?', 'Nắng trưa đứng đường mệt lắm nghen.', 'Ghé quán ăn miếng cơm đi.'],
    evening: ['Chiều rồi, sắp tan tầm.', 'Đi về nghỉ ngơi nghen {you}.', 'Chiều mát, khách chắc đông.'],
    night: ['Khuya rồi {you} ơi, về đi.', 'Đêm nay đường vắng.', 'Khuya vầy còn bán hả {you}?'],
  } as Record<string, string[]>,
  // ── Đứng xem đua xe đạp chủ nhật ──
  cheer: {
    watch: ['Ủa đua hả? Coi coi!', 'Đạp đi! Đạp mạnh lên!', 'Chỗ này vui nè.', 'Cổ vũ cho con Lan kìa!', 'Ba vòng lận, ráng nghen!'],
    win: ['Đạp dữ thần!', 'Thắng rồi kìa, giỏi quá!', 'Con Lan thua rồi hả? Hê hê.', 'Phao nước tán thưởng đi bà con!'],
    lose: ['Tiếc ghê, xém chút nữa.', 'Thua con Lan hả, bữa sau phục thù.', 'Đạp yếu quá, tập đi nghen.'],
  },
  // ăn một cú đấm: la lên, có người quay lại đánh, có người bỏ chạy
  hit: {
    cry: ['Á! Đánh người ta hả?', 'Ui da! Làm gì vậy trời?', 'Đau! Mày bị gì vậy?', 'Ơ cái thằng này!', 'Đánh tao hả? Thử nữa coi!'],
    run: ['Tao kêu công an!', 'Thằng khùng! Tao đi đây!', 'Đồ điên, tránh xa tao ra!', 'Bớ người ta, nó đánh tôi!'],
    witness: ['Ngoài kia đánh nhau kìa!', 'Sao lại đánh người ta?', 'Tội nghiệp, chắc nó bị gì.', 'Công an đâu rồi?'],
  },
};
/** Nhóm người dễ nổi nóng. Số càng lớn càng hay gây sự; nhóm không có trong bảng thì hiền, không bao giờ gây chuyện. */
export const RUDE: Partial<Record<ArchId, number>> = { giangho: 3.4, khotinh: 2.4, hocsinh: 1.7, congnhan: 1.1, taixe: 1, shipper: 0.7, dukhach: 0.4 };


/** Người bán & nhân vật cố định. look = hàng trong bảng khuôn mặt. */
/** Ứng viên phụ việc ở quầy: chỉ xuất hiện khi quán đã có doanh thu và đã bán được vài ngày. */
export interface HelperDef { name: string; fem: boolean; face: number; hairStyle: number; shirt: number; pants: number; hair: number; skin: number; wage: number; ask: string; }
export const HELPER_POOL: HelperDef[] = [
  { name: 'Bé Tư', fem: true, face: 1, hairStyle: 7, shirt: 0xe86f9a, pants: 0x2f3a52, hair: 0x1e1a18, skin: 0xecbe94, wage: 55000, ask: 'Dạ con thấy quán đông quá, con phụ bưng ra dọn vô cho. Ngày 55 ngàn, được hông {ac}?' },
  { name: 'Thằng Cò', fem: false, face: 0, hairStyle: 6, shirt: 0x2f8fd5, pants: 0x3a5a8a, hair: 0x2a2420, skin: 0xd49a6a, wage: 60000, ask: 'Chú cho con phụ bán với. Con rửa chén, lau bàn, tiếp khách được hết. 60 ngàn một ngày thôi.' },
  { name: 'Chị Hạnh', fem: true, face: 1, hairStyle: 5, shirt: 0x6a8a4a, pants: 0x4a4a42, hair: 0x3a2a22, skin: 0xf2c9a4, wage: 70000, ask: 'Nghe nói quán {ac} đông khách. Chị phụ một tay nghen — 70 ngàn một ngày, khách chờ lâu chị dỗ cho.' },
  { name: 'Chú Em', fem: false, face: 7, hairStyle: 0, shirt: 0x4a5a6a, pants: 0x2a2e3a, hair: 0x1e1a18, skin: 0xe0aa7c, wage: 65000, ask: 'Tui rảnh buổi sáng. Chú mướn tui phụ quầy, 65 ngàn một ngày, khỏi lo khách bỏ đi.' },
  { name: 'Nhỏ Nhung', fem: true, face: 1, hairStyle: 4, shirt: 0xf5c531, pants: 0x2a3a6a, hair: 0x6a3a22, skin: 0xf6d6b6, wage: 58000, ask: 'Cho con phụ quán với {ac} ơi! Con lanh lắm, 58 ngàn một ngày là được rồi.' },
];

/** Ứng viên nhân viên phụ bếp cho nhà hàng bình dân (bậc 6): đứng phòng bếp riêng, tự sơ chế & nấu phụ. */
export interface SousDef extends HelperDef { speed: number; }
export const SOUS_POOL: SousDef[] = [
  { name: 'Bếp phụ Tèo', fem: false, face: 1, hairStyle: 3, shirt: 0xf7f3ea, pants: 0x26282e, hair: 0x1a1816, skin: 0xd9a87a, wage: 95000, speed: 1, ask: 'Dạ {ac}, con làm phụ bếp quán cơm lâu năm rồi — sơ chế với nấu phụ nhanh gọn lắm!' },
  { name: 'Chị Năm bếp', fem: true, face: 2, hairStyle: 5, shirt: 0xf7f3ea, pants: 0x26282e, hair: 0x2a1c14, skin: 0xe6b88e, wage: 110000, speed: 1.15, ask: 'Em đứng bếp phụ quen rồi {ac}, để em lo sơ chế với ra món phụ cho nhẹ tay.' },
  { name: 'Thằng Dũng', fem: false, face: 0, hairStyle: 1, shirt: 0xf7f3ea, pants: 0x2d323b, hair: 0x2a1c14, skin: 0xc9936a, wage: 90000, speed: 0.95, ask: 'Con chịu khó đứng bếp cả ngày, phụ {ac} băm chặt với xào nấu nha!' },
];

/** Người trông coi chi nhánh (bậc 7). Khác người phụ quầy: đứng bán cả ngày ở điểm thứ hai, tự bán món sẵn. */
export const KEEPER_POOL: HelperDef[] = [
  { name: 'Cô Thuận', fem: true, face: 4, hairStyle: 5, shirt: 0xd9463c, pants: 0x2a2e3a, hair: 0x2a2420, skin: 0xe6b88e, wage: 95000, ask: 'Cô bán quán chợ mấy chục năm rồi {ac}. Đưa cô giữ chi nhánh, sáng mở sớm, chiều dọn sạch.' },
  { name: 'Anh Dũng Ca', fem: false, face: 1, hairStyle: 2, shirt: 0x2f8fd5, pants: 0x2f3a52, hair: 0x1e1a18, skin: 0xd49a6a, wage: 100000, ask: 'Tui rành khách phố văn phòng, bán trưa một tiếng bằng người ta cả buổi. 100 ngàn một ngày nghen.' },
  { name: 'Má Bảy', fem: true, face: 4, hairStyle: 7, shirt: 0xb9a88a, pants: 0x3a3a42, hair: 0xd9d9d6, skin: 0xf2c9a4, wage: 88000, ask: 'Má ở nhà rảnh, ra giữ quầy phụ {ac}. Tiền lời bao nhiêu má đưa lại đủ, má chỉ lấy công.' },
];

export interface FixedNpcDef {
  id: string; name: string; face: number; fem: boolean; shirt: number; pants: number; hair: number; hat: number;
  hairStyle: number; fat: number; h: number;
  /**
   * Màu da riêng, bỏ trống thì lấy theo bảng như cũ. Dùng cho người mà nghề nghiệp nói lên nước da:
   * bán ve chai, bốc vác, chạy xe ngoài nắng cả ngày thì không thể trắng hồng như nhân viên ngân hàng.
   */
  skin?: number;
}
export const FIXED: Record<string, FixedNpcDef> = {
  hot_toc: { id: 'hot_toc', name: 'Chú Bảy Kéo', face: 7, fem: false, shirt: 0xf3f0e8, pants: 0x2a2e3a, hair: 0x3a2a22, hat: 0, hairStyle: 6, fat: 1.05, h: 1 },
  thoi_trang: { id: 'thoi_trang', name: 'Cô Ngọc', face: 1, fem: true, shirt: 0xe86f9a, pants: 0x2a2e3a, hair: 0x2a2420, hat: 0, hairStyle: 5, fat: 0.98, h: 0.97 },
  m_rau: { id: 'm_rau', name: 'Cô Bảy', face: 4, fem: true, shirt: 0x8a5a9a, pants: 0x2a2e3a, hair: 0x3a2a22, hat: 1, hairStyle: 2, fat: 1.1, h: 0.95 },
  m_cu: { id: 'm_cu', name: 'Chú Mười', face: 7, fem: false, shirt: 0x5a7a4a, pants: 0x4a4a42, hair: 0x1e1a18, hat: 4, hairStyle: 0, fat: 1.15, h: 1 },
  m_thit: { id: 'm_thit', name: 'Anh Tư', face: 0, fem: false, shirt: 0xf3f0e8, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 0, fat: 1.2, h: 1.03 },
  m_haisan: { id: 'm_haisan', name: 'Chị Năm', face: 1, fem: true, shirt: 0x2f8fd5, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 1, hairStyle: 2, fat: 1.0, h: 0.97 },
  m_kho: { id: 'm_kho', name: 'Bà Hai', face: 4, fem: true, shirt: 0xb9a88a, pants: 0x3a3a42, hair: 0xd9d9d6, hat: 0, hairStyle: 2, fat: 1.1, h: 0.92 },
  m_giavi: { id: 'm_giavi', name: 'Cô Út', face: 1, fem: true, shirt: 0xe86f9a, pants: 0x2a2e3a, hair: 0x2a2420, hat: 0, hairStyle: 1, fat: 0.95, h: 0.96 },
  m_trung: { id: 'm_trung', name: 'Dì Sáu', face: 4, fem: true, shirt: 0x3fae5a, pants: 0x3a3a42, hair: 0x3a2a22, hat: 1, hairStyle: 2, fat: 1.15, h: 0.94 },
  bakery: { id: 'bakery', name: 'Anh Bảo', face: 0, fem: false, shirt: 0xf5c531, pants: 0x3a5a8a, hair: 0x1e1a18, hat: 2, hairStyle: 0, fat: 1, h: 1.02 },
  mart: { id: 'mart', name: 'Bé Na', face: 1, fem: true, shirt: 0x2fae5a, pants: 0x2a2e3a, hair: 0x6a3a22, hat: 0, hairStyle: 7, fat: 0.92, h: 0.95 },
  kiosk: { id: 'kiosk', name: 'Cô Ba', face: 4, fem: true, shirt: 0xc9665a, pants: 0x2a2e3a, hair: 0x3a2a22, hat: 0, hairStyle: 2, fat: 1.2, h: 0.94 },
  wholesale: { id: 'wholesale', name: 'Chú Tám', face: 7, fem: false, shirt: 0x4a5a6a, pants: 0x4a4a42, hair: 0x1e1a18, hat: 2, hairStyle: 0, fat: 1.25, h: 1.02 },
  pharmacy: { id: 'pharmacy', name: 'Cô Hiền', face: 5, fem: true, shirt: 0xf7f7f7, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 0.95, h: 0.96 },
  hospital: { id: 'hospital', name: 'Bác sĩ Hạnh', face: 5, fem: true, shirt: 0xf7f9ff, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 0.95, h: 1.0 },
  police: { id: 'police', name: 'Chú Tám', face: 7, fem: false, shirt: 0x6a8a4a, pants: 0x4a6238, hair: 0x1e1a18, hat: 2, hairStyle: 0, fat: 1.08, h: 1.02 },
  equip: { id: 'equip', name: 'Chú Ba Tài', face: 7, fem: false, shirt: 0x3f6a9a, pants: 0x4a4a42, hair: 0x2a2420, hat: 0, hairStyle: 3, fat: 1.2, h: 1.0 },
  eatery: { id: 'eatery', name: 'Bà Tư', face: 4, fem: true, shirt: 0xf3f0e8, pants: 0x2a2e3a, hair: 0xbfbfbc, hat: 0, hairStyle: 2, fat: 1.15, h: 0.93 },
  scrap2: { id: 'scrap2', name: 'Bà Chín Ve Chai', face: 4, fem: true, shirt: 0x8a7a4a, pants: 0x3a3a42, hair: 0xbfbfbc, hat: 1, hairStyle: 2, fat: 1.08, h: 0.94, skin: 0xb8804f },
  scrap: { id: 'scrap', name: 'Ông Tư Rác', face: 3, fem: false, shirt: 0x7a6a58, pants: 0x4a4a42, hair: 0xbfbfbc, hat: 4, hairStyle: 3, fat: 0.95, h: 0.97 },
  pawn: { id: 'pawn', name: 'Chú Lâm', face: 5, fem: false, shirt: 0x6a1e2e, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 0, fat: 1.1, h: 1.0 },
  bank: { id: 'bank', name: 'Chị Thu', face: 5, fem: true, shirt: 0x2f3a52, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 0.92, h: 0.97 },
  shark: { id: 'shark', name: 'Hùng Sẹo', face: 6, fem: false, shirt: 0x1e1e22, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 3, fat: 1.3, h: 1.08 },
  motel: { id: 'motel', name: 'Dì Chín', face: 4, fem: true, shirt: 0xd9a05a, pants: 0x2a2e3a, hair: 0x3a2a22, hat: 0, hairStyle: 2, fat: 1.2, h: 0.93 },
  tro: { id: 'tro', name: 'Bác Năm chủ trọ', face: 3, fem: false, shirt: 0xb9a88a, pants: 0x3a3a42, hair: 0xd9d9d6, hat: 0, hairStyle: 3, fat: 1.1, h: 0.98 },
  hotel: { id: 'hotel', name: 'Lễ tân Vy', face: 1, fem: true, shirt: 0x6a1e2e, pants: 0x1e2430, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 0.9, h: 0.98 },
  canho: { id: 'canho', name: 'Cô Hạnh', face: 1, fem: true, shirt: 0x2f4a6a, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 1, fat: 0.94, h: 0.97 },
  nharieng: { id: 'nharieng', name: 'Chú Vinh', face: 7, fem: false, shirt: 0xb9a88a, pants: 0x3a3a42, hair: 0x9a9a96, hat: 0, hairStyle: 3, fat: 1.06, h: 1.0 },
  cuahang: { id: 'cuahang', name: 'Cô Lệ', face: 4, fem: true, shirt: 0x3f8a5a, pants: 0x2a2e3a, hair: 0x2a2420, hat: 0, hairStyle: 2, fat: 1.14, h: 0.94 },
  dock: { id: 'dock', name: 'Anh Sáu Lực', face: 0, fem: false, shirt: 0xb5653c, pants: 0x4a4a42, hair: 0x1e1a18, hat: 2, hairStyle: 0, fat: 1.25, h: 1.06 },
  // ── Nhân vật phụ ở những chỗ nhỏ ven đường ──
  tra_da: { id: 'tra_da', name: 'Cô Thắm', face: 1, fem: true, shirt: 0xd9a05a, pants: 0x2a2e3a, hair: 0x2a2420, hat: 0, hairStyle: 2, fat: 1.12, h: 0.94 },
  rap: { id: 'rap', name: 'Bin', face: 0, fem: false, shirt: 0x2f8fd5, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 4, hairStyle: 0, fat: 0.92, h: 1.0 },
  sua_xe: { id: 'sua_xe', name: 'Chú Hậu', face: 7, fem: false, shirt: 0x4a5a6a, pants: 0x3a3d42, hair: 0xbfbfbc, hat: 0, hairStyle: 3, fat: 1.18, h: 1.0 },
  hat_rong: { id: 'hat_rong', name: 'Cô Hồng', face: 4, fem: true, shirt: 0x8a5a9a, pants: 0x1e2430, hair: 0xbfbfbc, hat: 0, hairStyle: 2, fat: 0.98, h: 0.93 },
  danh_co: { id: 'danh_co', name: 'Ông Tư', face: 3, fem: false, shirt: 0xb9a88a, pants: 0x2a2e3a, hair: 0xd9d9d6, hat: 4, hairStyle: 3, fat: 0.95, h: 0.97 },
  danh_giay: { id: 'danh_giay', name: 'Bé Bo', face: 2, fem: false, shirt: 0xf5c531, pants: 0x3a5a8a, hair: 0x1e1a18, hat: 2, hairStyle: 0, fat: 0.85, h: 0.72 },
  net: { id: 'net', name: 'Chị Hạnh', face: 2, fem: true, shirt: 0x2f6fd5, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 1.08, h: 0.95 },
  net_bi: { id: 'net_bi', name: 'Thằng Bi', face: 0, fem: false, shirt: 0xdfe6ea, pants: 0x3a5a8a, hair: 0x1e1a18, hat: 2, hairStyle: 0, fat: 0.92, h: 0.86 },
  net_nhung: { id: 'net_nhung', name: 'Con Nhung', face: 4, fem: true, shirt: 0xe86f9a, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 0.92, h: 0.88 },
  dua: { id: 'dua', name: 'Con Lan', face: 2, fem: true, shirt: 0xe86f9a, pants: 0x2a3a6a, hair: 0x1e1a18, hat: 0, hairStyle: 2, fat: 0.9, h: 0.9 },
  dua_mai: { id: 'dua_mai', name: 'Con Mai', face: 4, fem: true, shirt: 0x3fae5a, pants: 0x2a2e3a, hair: 0x2a201b, hat: 0, hairStyle: 1, fat: 0.88, h: 0.87 },
  dua_thao: { id: 'dua_thao', name: 'Con Thảo', face: 1, fem: true, shirt: 0xf5c531, pants: 0x3a5a8a, hair: 0x1e1a18, hat: 0, hairStyle: 5, fat: 0.92, h: 0.89 },
  hobo: { id: 'hobo', name: 'Ông Bảy Lang Thang', face: 3, fem: false, shirt: 0x6a6258, pants: 0x4a4a42, hair: 0xbfbfbc, hat: 4, hairStyle: 1, fat: 0.9, h: 0.96 },
  cafe: { id: 'cafe', name: 'Anh Phong', face: 0, fem: false, shirt: 0x3a2416, pants: 0x2a2e3a, hair: 0x1e1a18, hat: 0, hairStyle: 0, fat: 0.98, h: 1.01 },
  // Chú Ba xe ôm: đứng dưới gầm cầu cạnh lều người chơi, áo sơ mi sờn + nón bảo hiểm, da ngăm vì chạy nắng cả ngày.
  chu_ba: { id: 'chu_ba', name: 'Chú Ba xe ôm', face: 3, fem: false, shirt: 0x8a7a4a, pants: 0x3a3d42, hair: 0x55504a, hat: 3, hairStyle: 0, fat: 1.12, h: 0.99, skin: 0xb8804f },
};
