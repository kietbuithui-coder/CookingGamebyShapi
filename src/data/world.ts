// THỜI TIẾT & SỰ KIỆN — dữ liệu thuần. Mỗi mục đều có tác động thật lên khách, giá cả, bảo quản, quầy hàng.
import type { Cat } from './ingredients';
import type { RecipeCat } from './recipes';
import type { District } from '../world/layout';

export type WeatherId = 'nang' | 'nong' | 'mua' | 'muato' | 'giong' | 'gio' | 'lanh' | 'bao';
export interface WeatherDef {
  id: WeatherId; name: string; icon: string;
  cust: number;        // hệ số lượng khách
  hot: number;         // >0: khách thèm món nóng; <0: thèm món mát
  spoil: number;       // hệ số hỏng nguyên liệu
  beg: number;         // hệ số lòng thương khi xin tiền
  rain: number; wind: number; dim: number; fog: number;   // hiệu ứng hình ảnh/âm thanh (0–1)
  walk: number;        // hệ số tốc độ đi bộ
  wet: number;         // mức ướt/lạnh mỗi giờ nếu không có áo mưa hay mái che
  damage: number;      // hư hại quầy mỗi giờ nếu không có ô dù
  fire: number;        // độ khó giữ lửa bếp than ngoài trời (0–1)
  flood: number;       // tốc độ dâng nước mỗi giờ (âm = rút)
  dur: [number, number]; next: Partial<Record<WeatherId, number>>; say: string;
}
export const WEATHER: Record<WeatherId, WeatherDef> = {
  nang: { id: 'nang', name: 'Nắng đẹp', icon: 'sun', cust: 1, hot: 0, spoil: 1, beg: 1, rain: 0, wind: 0.1, dim: 0, fog: 0, walk: 1, wet: 0, damage: 0, fire: 0, flood: -0.2, dur: [5, 10],
    next: { nang: 3, nong: 2.5, mua: 2, gio: 1, lanh: 1, muato: 0.6 }, say: 'Trời quang, nắng nhẹ.' },
  nong: { id: 'nong', name: 'Nắng gắt', icon: 'hot', cust: 0.82, hot: -1, spoil: 1.7, beg: 0.85, rain: 0, wind: 0.05, dim: -0.1, fog: 0, walk: 0.95, wet: 0, damage: 0, fire: 0, flood: -0.35, dur: [4, 7],
    next: { nang: 3, giong: 2, mua: 1.2, nong: 1 }, say: 'Nắng như đổ lửa — đồ tươi mau hỏng, khách thèm đồ mát.' },
  mua: { id: 'mua', name: 'Mưa nhỏ', icon: 'rain', cust: 0.72, hot: 0.6, spoil: 0.9, beg: 1.25, rain: 0.35, wind: 0.2, dim: 0.3, fog: 0.3, walk: 0.95, wet: 6, damage: 0.6, fire: 0.3, flood: 0.03, dur: [2, 5],
    next: { nang: 3, muato: 2, mua: 1, lanh: 1.2 }, say: 'Mưa lâm râm. Khách thưa hơn, món nóng dễ bán.' },
  muato: { id: 'muato', name: 'Mưa to', icon: 'rain2', cust: 0.4, hot: 1, spoil: 0.9, beg: 0.9, rain: 0.8, wind: 0.4, dim: 0.5, fog: 0.55, walk: 0.85, wet: 16, damage: 3, fire: 0.65, flood: 0.22, dur: [2, 4],
    next: { mua: 3, giong: 1.5, nang: 1.5, lanh: 1 }, say: 'Mưa xối xả! Không có ô dù thì bếp than tắt ngúm.' },
  giong: { id: 'giong', name: 'Giông sét', icon: 'storm', cust: 0.3, hot: 1, spoil: 0.9, beg: 0.7, rain: 0.9, wind: 0.7, dim: 0.65, fog: 0.6, walk: 0.8, wet: 20, damage: 5, fire: 0.8, flood: 0.3, dur: [1, 3],
    next: { muato: 2, mua: 2, nang: 2, gio: 1 }, say: 'Sấm chớp đùng đùng, đường phố vắng tanh.' },
  gio: { id: 'gio', name: 'Gió lớn', icon: 'wind', cust: 0.85, hot: 0.3, spoil: 1, beg: 1, rain: 0, wind: 0.9, dim: 0.15, fog: 0.1, walk: 0.92, wet: 0, damage: 2, fire: 0.5, flood: -0.15, dur: [2, 5],
    next: { nang: 3, mua: 1.5, lanh: 1.5, giong: 0.8 }, say: 'Gió giật từng cơn — lửa bếp chập chờn, ô dù dễ bay.' },
  lanh: { id: 'lanh', name: 'Trời se lạnh', icon: 'cold', cust: 0.92, hot: 1, spoil: 0.6, beg: 1.2, rain: 0, wind: 0.3, dim: 0.25, fog: 0.4, walk: 1, wet: 3, damage: 0, fire: 0.1, flood: -0.15, dur: [4, 9],
    next: { nang: 3, mua: 1.5, lanh: 1, gio: 1 }, say: 'Se lạnh. Ai cũng thèm một món nóng hổi.' },
  bao: { id: 'bao', name: 'Bão', icon: 'storm', cust: 0.08, hot: 1, spoil: 1, beg: 0.4, rain: 1, wind: 1, dim: 0.8, fog: 0.8, walk: 0.7, wet: 30, damage: 12, fire: 1, flood: 0.5, dur: [3, 5],
    next: { muato: 3, mua: 2 }, say: 'BÃO! Dọn hàng ngay kẻo hư hết quầy.' },
};
/** Khu trũng — ngập khi mưa lớn kéo dài. */
export const floodZone = (x: number, z: number) => z > 34 && z < 93 && x < 30;

// ───────────────────────── Sự kiện ─────────────────────────
export type Actor = 'inspector' | 'critic' | 'gang' | 'rowdy' | 'credit' | 'vip';
export interface EventDef {
  id: string; name: string; text: string; icon: string;
  dur: number;                 // số giờ kéo dài
  w: number;                   // xác suất tương đối mỗi lần Đạo diễn sự kiện gieo
  cool: number;                // số ngày tối thiểu giữa hai lần lặp lại
  minDay?: number; hours?: [number, number];   // điều kiện kích hoạt
  need?: 'stall' | 'open' | 'debt' | 'home' | 'rep20' | 'rep40' | 'spot_hem' | 'poor';
  // Tác động kinh tế & NPC:
  traffic?: Partial<Record<District | 'all', number>>;   // lượng người qua lại theo khu
  budget?: number;                                       // túi tiền của khách
  demand?: Partial<Record<RecipeCat, number>>;           // nhu cầu theo nhóm món
  price?: Partial<Record<Cat, number>>;                  // giá nguyên liệu theo nhóm
  shop?: Record<string, number>;                         // giá riêng từng cửa hàng
  closed?: string[];                                     // cửa hàng đóng cửa
  outOf?: number;                                        // số mặt hàng hết ở chợ
  weather?: WeatherId;                                   // ép thời tiết
  actor?: Actor;                                         // nhân vật sẽ tìm đến quầy
  blackout?: District[];                                 // cúp điện khu nào
  roadblock?: boolean;                                   // cấm đường (đổi dòng người)
  rival?: boolean; festive?: boolean; theft?: boolean; gift?: number;
  danger?: boolean;                                      // đổi nhạc sang "nguy hiểm"
}
export const EVENT_LIST: EventDef[] = [
  { id: 'le_hoi', name: 'Lễ hội đường phố', text: 'Công viên Hoa Phượng mở lễ hội — người đổ về nườm nượp!', icon: 'flag', dur: 10, w: 1.2, cool: 6, minDay: 3, hours: [7, 12],
    traffic: { congvien: 2.3, trungtam: 1.4 }, budget: 1.15, demand: { anvat: 1.5, xien: 1.5, nuoc: 1.4, che: 1.3 }, festive: true },
  { id: 'hoi_cho', name: 'Hội chợ ẩm thực', text: 'Hội chợ ẩm thực ở cổng chợ — dân sành ăn kéo tới.', icon: 'flag', dur: 9, w: 0.9, cool: 8, minDay: 5, hours: [7, 11],
    traffic: { cho: 2.0, trungtam: 1.3 }, budget: 1.2, demand: { bunpho: 1.3, haisan: 1.4, nuong: 1.3 }, festive: true },
  { id: 'bong_da', name: 'Trận bóng đá', text: 'Tối nay đá banh! Quán Cà phê Bóng Đá ở Phố Bến Xe chật kín.', icon: 'ball', dur: 4, w: 1.4, cool: 3, minDay: 2, hours: [17, 19],
    traffic: { nhanghi: 2.2, laodong: 1.5 }, demand: { nuong: 1.6, xien: 1.5, nuoc: 1.5, chien: 1.4 } },
  { id: 'ngay_luong', name: 'Ngày lĩnh lương', text: 'Hôm nay công nhân, nhân viên lĩnh lương — ai cũng rủng rỉnh.', icon: 'cash', dur: 14, w: 1.5, cool: 5, minDay: 2, hours: [6, 9], budget: 1.35, traffic: { all: 1.15 } },
  { id: 'gia_thit', name: 'Thịt tăng giá', text: 'Dịch bệnh làm giá thịt ở chợ tăng vọt mấy ngày liền.', icon: 'up', dur: 60, w: 1, cool: 7, minDay: 3, price: { meat: 1.4 } },
  { id: 'gia_rau', name: 'Rau củ tăng giá', text: 'Mưa bão miền trên, rau củ về chợ ít — giá leo thang.', icon: 'up', dur: 48, w: 1, cool: 7, minDay: 3, price: { veg: 1.45 } },
  { id: 'gia_haisan', name: 'Hải sản khan hàng', text: 'Biển động, ghe không ra khơi. Hải sản đắt gấp rưỡi.', icon: 'up', dur: 36, w: 0.8, cool: 7, minDay: 4, price: { seafood: 1.5 } },
  { id: 'het_hang', name: 'Chợ hết hàng', text: 'Xe hàng về trễ — nhiều sạp ở chợ hết sạch vài món.', icon: 'box', dur: 12, w: 1.2, cool: 3, minDay: 2, hours: [4, 8], outOf: 6 },
  { id: 'sieu_thi_km', name: 'Siêu thị khuyến mãi', text: 'MiniMart 24h giảm giá 25% toàn bộ hôm nay.', icon: 'down', dur: 14, w: 1.1, cool: 5, minDay: 2, hours: [6, 10], shop: { mart: 0.75 } },
  { id: 'cup_dien', name: 'Cúp điện', text: 'Cúp điện cả khu trung tâm! MiniMart đóng cửa, tủ lạnh ngừng chạy.', icon: 'bolt', dur: 5, w: 0.9, cool: 5, minDay: 3, hours: [15, 20],
    closed: ['mart'], blackout: ['trungtam', 'dancu', 'cho'], traffic: { trungtam: 0.7 } },
  { id: 'bao', name: 'Bão bất ngờ', text: 'Bão đổ bộ! Dọn hàng, tìm chỗ trú ngay!', icon: 'storm', dur: 4, w: 0.6, cool: 9, minDay: 4, weather: 'bao', danger: true },
  { id: 'cam_duong', name: 'Cấm đường', text: 'Đường trước chợ bị rào lại để sửa cống — dòng người dạt sang phố khác.', icon: 'block', dur: 12, w: 0.9, cool: 6, minDay: 3, hours: [6, 10],
    roadblock: true, traffic: { cho: 0.55, trungtam: 1.25, laodong: 1.2 } },
  { id: 'tan_su_kien', name: 'Tan ca đêm', text: 'Khu kho bãi tan ca đêm — công nhân đói bụng đổ ra đường.', icon: 'moon', dur: 3, w: 1.2, cool: 3, minDay: 2, hours: [20, 21.5],
    traffic: { khobai: 2, laodong: 1.8, nhanghi: 1.5 }, demand: { com: 1.4, banhmi: 1.4, mi: 1.4 } },
  { id: 'doi_thu', name: 'Đối thủ mở quán', text: 'Có người mở quầy ngay sát chỗ bạn bán, giá rẻ hơn hẳn.', icon: 'rival', dur: 48, w: 1, cool: 8, minDay: 4, need: 'rep20', rival: true },
  { id: 'kiem_tra', name: 'Kiểm tra vệ sinh', text: 'Đoàn kiểm tra an toàn thực phẩm đang đi từng quầy.', icon: 'badge', dur: 3, w: 1.3, cool: 4, minDay: 3, hours: [9, 17], need: 'open', actor: 'inspector', danger: true },
  { id: 'phe_binh', name: 'Nhà phê bình ghé thăm', text: 'Nghe đồn có nhà phê bình ẩm thực đang dạo quanh khu này…', icon: 'pen', dur: 3, w: 1, cool: 6, minDay: 4, hours: [10, 19], need: 'rep20', actor: 'critic' },
  { id: 'khach_vip', name: 'Khách VIP', text: 'Một vị khách sang trọng đang tìm món ngon đường phố.', icon: 'star', dur: 3, w: 0.8, cool: 6, minDay: 5, hours: [10, 20], need: 'rep40', actor: 'vip' },
  { id: 'bao_ke', name: 'Thu tiền bảo kê', text: 'Đàn em Hùng Sẹo đang đi thu "phí bảo kê" trong hẻm.', icon: 'skull', dur: 3, w: 1.6, cool: 2, minDay: 2, hours: [9, 19], need: 'spot_hem', actor: 'gang', danger: true },
  { id: 'khach_quay', name: 'Khách quậy', text: 'Có ông khách say xỉn đang gây sự quanh đây.', icon: 'angry', dur: 2, w: 1, cool: 4, minDay: 3, hours: [11, 22], need: 'open', actor: 'rowdy', danger: true },
  { id: 'khach_quen_kho', name: 'Khách quen gặp khó', text: 'Một người khách quen đang kẹt tiền, muốn ăn chịu.', icon: 'heart', dur: 4, w: 1, cool: 4, minDay: 4, hours: [10, 19], need: 'open', actor: 'credit' },
  { id: 'trom', name: 'Trộm đêm', text: 'Dạo này khu gầm cầu hay mất trộm lắm.', icon: 'skull', dur: 8, w: 1, cool: 4, minDay: 2, hours: [21, 23], need: 'poor', theft: true, danger: true },
  { id: 'gia_dinh', name: 'Thư nhà', text: 'Mẹ ở quê gửi lên ít tiền kèm lá thư: "Ráng lên con."', icon: 'heart', dur: 1, w: 3, cool: 20, minDay: 3, need: 'debt', gift: 300000 },
];
export const EVENTS: Record<string, EventDef> = Object.fromEntries(EVENT_LIST.map((e) => [e.id, e]));

/** Nhịp khách theo giờ (0–1): sáng, trưa, xế, tối. */
export function hourCurve(h: number, d: District): number {
  const bump = (c: number, w: number) => Math.exp(-((h - c) * (h - c)) / (2 * w * w));
  let v = 0.1 + 0.95 * bump(7.2, 1.0) + 1.0 * bump(11.9, 1.0) + 0.55 * bump(15.5, 1.2) + 0.9 * bump(18.4, 1.1) + 0.35 * bump(21, 1.0);
  if (d === 'laodong' || d === 'khobai') v += 0.35 * bump(6.5, 0.8) + 0.2 * bump(11.6, 0.8);
  if (d === 'vanphong') v = 0.1 + 0.5 * bump(7.8, 0.8) + 1.25 * bump(12, 0.9) + 0.7 * bump(15.2, 1) + 0.5 * bump(18, 0.9);
  if (d === 'cho') v += 0.5 * bump(7, 1.3) - 0.3 * bump(19, 1.5);
  if (d === 'congvien') v = 0.12 + 0.55 * bump(6.3, 0.9) + 0.5 * bump(11.5, 1.2) + 1.2 * bump(17.3, 1.5) + 0.55 * bump(20, 1);
  if (h < 5 || h > 23) v *= 0.15;
  return Math.max(0.03, v);
}
