// DỤNG CỤ, CẤP ĐỘ QUẦY HÀNG, CHỖ Ở, KHOẢN VAY — dữ liệu thuần, dễ mở rộng.

export interface GearDef { id: string; name: string; price: number; kind: 'stall' | 'tool' | 'stove' | 'store' | 'comfort' | 'carry' | 'home' | 'phone'; desc: string; tier?: number; wear?: number; }
export const GEAR_LIST: GearDef[] = [
  { id: 'ganh', name: 'Gánh', price: 120000, kind: 'stall', tier: 1, desc: 'Đôi quang gánh tre — gánh đi khắp phố.' },
  { id: 'xeday', name: 'Xe đẩy', price: 2400000, kind: 'stall', tier: 2, desc: 'Xe đẩy inox có mái che, chứa nhiều, bán nhanh.' },
  { id: 'sap', name: 'Sạp cố định', price: 9000000, kind: 'stall', tier: 3, desc: 'Sạp lớn có bàn ghế, đặt lâu dài một chỗ.' },
  { id: 'quanan', name: 'Quán ăn nhỏ', price: 24000000, kind: 'stall', tier: 4, desc: 'Mặt bằng có mái, bốn chỗ ngồi ăn tại chỗ, bày được 16 món.' },
  { id: 'quanngoi', name: 'Quán có chỗ ngồi', price: 58000000, kind: 'stall', tier: 5, desc: 'Sáu chỗ ngồi bàn gỗ kê trong nhà, bày 20 món, 12 khách một lúc; khách ăn xong còn gọi thêm tráng miệng.' },
  { id: 'nhahang', name: 'Nhà hàng bình dân', price: 135000000, kind: 'stall', tier: 6, desc: 'Nhà hàng khang trang tám chỗ ngồi trong nhà, có phòng bếp riêng, thuê được phụ bếp, đón khách đoàn và nhận đặt bàn trước.' },
  { id: 'chuoi', name: 'Chuỗi cửa hàng', price: 280000000, kind: 'stall', tier: 7, desc: 'Thương hiệu ẩm thực mở thêm chi nhánh thứ hai hoạt động song song, có quản lý trông coi và sổ sách riêng từng điểm.' },
  { id: 'daothot', name: 'Dao & thớt', price: 45000, kind: 'tool', desc: 'Để cắt thái mọi thứ.', wear: 0.25 },
  { id: 'bepthan', name: 'Bếp than', price: 60000, kind: 'stove', desc: 'Rẻ, nướng thơm. Phải quạt, sợ mưa.', wear: 0.5 },
  { id: 'bepgas', name: 'Bếp gas mini', price: 280000, kind: 'stove', desc: 'Chỉnh lửa chính xác, dùng bình gas.', wear: 0.4 },
  { id: 'vi', name: 'Vỉ nướng', price: 40000, kind: 'tool', desc: 'Nướng bắp, khoai, thịt, xiên que.', wear: 0.4 },
  { id: 'chao', name: 'Chảo', price: 75000, kind: 'tool', desc: 'Xào, chiên, ốp la.', wear: 0.3 },
  { id: 'noi', name: 'Nồi', price: 70000, kind: 'tool', desc: 'Nấu nước dùng, cơm, chè, pha trà.', wear: 0.2 },
  { id: 'thungda', name: 'Thùng đá', price: 110000, kind: 'store', desc: 'Giữ lạnh đồ tươi ở quầy (cần đá viên).' },
  { id: 'odu', name: 'Ô dù lớn', price: 150000, kind: 'comfort', desc: 'Che mưa nắng cho quầy và khách.' },
  { id: 'bien', name: 'Bảng hiệu', price: 90000, kind: 'comfort', desc: 'Khách thấy quầy từ xa hơn.' },
  { id: 'den', name: 'Đèn sạc', price: 80000, kind: 'comfort', desc: 'Bán được buổi tối.' },
  { id: 'ghe', name: 'Bàn ghế nhựa', price: 220000, kind: 'comfort', desc: 'Khách ngồi lại ăn, chịu chờ lâu hơn.' },
  { id: 'gio', name: 'Giỏ xách', price: 35000, kind: 'carry', desc: 'Xách thêm được 6 kg.' },
  { id: 'aomua', name: 'Áo mưa', price: 20000, kind: 'carry', desc: 'Không ướt, không cảm lạnh.' },
  { id: 'tulanh', name: 'Tủ lạnh cũ', price: 1500000, kind: 'home', desc: 'Đặt ở phòng trọ, giữ đồ tươi cả tuần.' },
  { id: 'cucgach', name: 'Điện thoại cục gạch', price: 180000, kind: 'phone', desc: 'Nokia 1110i: sổ thu chi, danh bạ, tin nhắn. Pin ba ngày.' },
  { id: 'napgap', name: 'Điện thoại nắp gập', price: 520000, kind: 'phone', desc: 'Samsung E250: thêm nghe nhạc, radio FM, màn hình màu.' },
  { id: 'camung', name: 'Điện thoại cảm ứng', price: 1450000, kind: 'phone', desc: 'O2 Xphone: thêm lướt web WAP. Chậm nhưng oai.' },
];
export const GEAR: Record<string, GearDef> = Object.fromEntries(GEAR_LIST.map((g) => [g.id, g]));

export interface TierDef { tier: number; id: string; name: string; cap: number; coldCap: number; queue: number; speed: number; menu: number; visible: number; trays: number; }
/** cap: kg chứa ở quầy · queue: số khách chờ tối đa · speed: tốc độ đi khi mang quầy · menu: số món tối đa · visible: độ thu hút gốc */
export const TIERS: TierDef[] = [
  { tier: 0, id: '', name: 'Chưa có quầy', cap: 0, coldCap: 0, queue: 0, speed: 1, menu: 0, visible: 0, trays: 0 },
  { tier: 1, id: 'ganh', name: 'Gánh hàng rong', cap: 14, coldCap: 5, queue: 3, speed: 0.78, menu: 3, visible: 0.8, trays: 6 },
  { tier: 2, id: 'xeday', name: 'Xe đẩy', cap: 40, coldCap: 14, queue: 5, speed: 0.7, menu: 6, visible: 1.1, trays: 12 },
  { tier: 3, id: 'sap', name: 'Sạp cố định', cap: 90, coldCap: 30, queue: 7, speed: 0, menu: 10, visible: 1.35, trays: 20 },
  // Bậc 4: mặt bằng thuê theo ngày (phí chỗ cao hơn hẳn), khách ngồi ăn tại chỗ nên đợi lâu hơn và đông hơn.
  { tier: 4, id: 'quanan', name: 'Quán ăn nhỏ', cap: 150, coldCap: 55, queue: 9, speed: 0, menu: 16, visible: 1.5, trays: 32 },
  // Bậc 5: sáu chỗ ngồi bàn gỗ kê trong nhà, khách ăn tại chỗ lâu hơn và gọi thêm món tráng miệng.
  { tier: 5, id: 'quanngoi', name: 'Quán có chỗ ngồi', cap: 200, coldCap: 70, queue: 12, speed: 0, menu: 20, visible: 1.6, trays: 40 },
  // Bậc 6: nhà hàng bình dân khang trang, tám ghế bàn gỗ trong nhà, thuê phụ bếp, đón khách đoàn và đặt bàn trước.
  { tier: 6, id: 'nhahang', name: 'Nhà hàng bình dân', cap: 280, coldCap: 100, queue: 16, speed: 0, menu: 28, visible: 1.8, trays: 56 },
  // Bậc 7: chuỗi cửa hàng ẩm thực — mở thêm chi nhánh thứ hai có người quản lý trông coi và sổ sách riêng.
  { tier: 7, id: 'chuoi', name: 'Chuỗi cửa hàng', cap: 360, coldCap: 140, queue: 20, speed: 0, menu: 40, visible: 2.05, trays: 80 },
];
/** Các bậc kinh doanh tiếp theo (đã mở đủ 7/7 bậc). */
export const FUTURE_TIERS: string[] = [];

export interface HousingDef {
  id: string; name: string; rent: number; per: 'đêm' | 'tuần' | ''; safety: number; sleep: number; storage: number; cold: boolean; shower: boolean;
  anchor: string; desc: string; mood: number; needRep?: number;
}
/** sleep: chất lượng giấc ngủ (hệ số hồi năng lượng) · storage: kg cất được · safety: 0–1 (thấp dễ mất trộm) */
export const HOUSING_LIST: HousingDef[] = [
  { id: 'gamcau', name: 'Gầm cầu', rent: 0, per: '', safety: 0.35, sleep: 0.6, storage: 12, cold: false, shower: false, anchor: 'bed_gamcau', mood: -6, desc: 'Tấm bìa các-tông, miễn phí, hay mất đồ.' },
  { id: 'ghe', name: 'Ghế đá công viên', rent: 0, per: '', safety: 0.25, sleep: 0.5, storage: 0, cold: false, shower: false, anchor: 'bed_ghe', mood: -8, desc: 'Thoáng mát nhưng mưa là ướt, có khi bị đuổi.' },
  { id: 'nhanghi', name: 'Nhà nghỉ Bình Dân', rent: 80000, per: 'đêm', safety: 0.9, sleep: 0.9, storage: 20, cold: false, shower: true, anchor: 'bed_nhanghi', mood: 4, desc: 'Có giường, có vòi sen. Trả theo đêm.' },
  { id: 'tro', name: 'Phòng trọ', rent: 280000, per: 'tuần', safety: 0.95, sleep: 1, storage: 60, cold: false, shower: true, anchor: 'bed_tro', mood: 8, desc: 'Chỗ ở ổn định, cất được nhiều đồ, đặt được tủ lạnh.' },
  { id: 'khachsan', name: 'Khách sạn Hoa Sen', rent: 350000, per: 'đêm', safety: 1, sleep: 1.25, storage: 20, cold: true, shower: true, anchor: 'bed_khachsan', mood: 20, desc: 'Nệm êm, máy lạnh — ngủ một đêm khoẻ cả ngày.' },
  { id: 'canho', name: 'Căn hộ An Bình', rent: 900000, per: 'tuần', safety: 0.98, sleep: 1.1, storage: 80, cold: true, shower: true, anchor: 'bed_canho', mood: 12, needRep: 12, desc: 'Căn hộ một phòng ở khu cao tầng: bếp riêng, cửa sổ nhìn phố, có tủ lạnh.' },
  { id: 'nharieng', name: 'Nhà riêng', rent: 1400000, per: 'tuần', safety: 1, sleep: 1.15, storage: 120, cold: true, shower: true, anchor: 'bed_nharieng', mood: 16, needRep: 30, desc: 'Nhà một trệt có sân, phòng khách, hai buồng ngủ — chỗ ở đàng hoàng.' },
  { id: 'cuahang', name: 'Cửa hàng kiêm nhà ở', rent: 1800000, per: 'tuần', safety: 1, sleep: 1.05, storage: 140, cold: true, shower: true, anchor: 'bed_cuahang', mood: 14, needRep: 45, desc: 'Mặt tiền bán hàng, buồng ngủ phía sau. Rộng nhất trong các chỗ thuê.' },
];
export const HOUSING: Record<string, HousingDef> = Object.fromEntries(HOUSING_LIST.map((h) => [h.id, h]));
/** Các loại chỗ ở sẽ thêm sau. */
export const FUTURE_HOUSING: string[] = [];

export interface LenderDef { id: string; name: string; who: string; rate: number; term: number; max: (rep: number, day: number) => number; lateFee: number; need?: string; amounts: number[]; }
/** rate: lãi mỗi ngày · term: số ngày phải trả · lateFee: phạt mỗi ngày trễ (tỉ lệ trên gốc) */
export const LENDERS: Record<string, LenderDef> = {
  bank: { id: 'bank', name: 'Ngân hàng Sao Vàng', who: 'Chị Thu', rate: 0.006, term: 14, lateFee: 0.01, need: 'tro', amounts: [500000, 1000000, 2000000, 5000000],
    max: (rep) => (rep < 15 ? 0 : rep < 35 ? 1000000 : rep < 60 ? 2000000 : 5000000) },
  shark: { id: 'shark', name: 'Hùng Sẹo', who: 'Hùng Sẹo', rate: 0.03, term: 5, lateFee: 0.05, amounts: [200000, 500000, 1000000, 2000000],
    max: (_rep, day) => (day < 2 ? 500000 : 2000000) },
  tab: { id: 'tab', name: 'Sổ nợ Cô Ba', who: 'Cô Ba', rate: 0, term: 3, lateFee: 0, amounts: [], max: () => 100000 },
};

/** Giá phế liệu (₫/món) tại vựa ve chai, giá đồ nhặt được tại tiệm cầm đồ. */
export interface JunkDef { id: string; name: string; price: number; kg: number; where: 'scrap' | 'pawn'; c: number; shape: 'bottle' | 'can' | 'box' | 'bag' | 'gem'; }
export const JUNK_LIST: JunkDef[] = [
  { id: 'chai', name: 'Chai nhựa', price: 1000, kg: 0.03, where: 'scrap', c: 0x9fd8ec, shape: 'bottle' },
  { id: 'lon', name: 'Lon nhôm', price: 1800, kg: 0.02, where: 'scrap', c: 0xc9ccd2, shape: 'can' },
  { id: 'bia', name: 'Bìa các-tông', price: 2500, kg: 0.4, where: 'scrap', c: 0xb99a6a, shape: 'box' },
  { id: 'sat', name: 'Sắt vụn', price: 5000, kg: 0.6, where: 'scrap', c: 0x7a6a62, shape: 'bag' },
  { id: 'dongho', name: 'Đồng hồ cũ', price: 60000, kg: 0.1, where: 'pawn', c: 0xd9b84a, shape: 'gem' },
  { id: 'radio', name: 'Radio hỏng', price: 35000, kg: 0.5, where: 'pawn', c: 0x4a5a6a, shape: 'box' },
  { id: 'nhan', name: 'Nhẫn bạc', price: 120000, kg: 0.01, where: 'pawn', c: 0xdfe6ea, shape: 'gem' },
];
export const JUNK: Record<string, JunkDef> = Object.fromEntries(JUNK_LIST.map((j) => [j.id, j]));
