// ĐÍCH ĐẾN TRONG THÀNH PHỐ — danh sách "chỗ nào tên gì" dùng chung cho Bản đồ, lời khuyên của Ông Bảy và test.
// Ở đây CHỈ có mã + tên + các mã tra cứu (neo `anchor`, hoặc chỗ bán `spot`): toạ độ vẫn nằm ở
// `world/layout.ts` / lúc dựng cảnh (`world/places.ts`, `world/city.ts`) như luật của dự án —
// một chỗ sửa toạ độ thì không phải sửa hai nơi.
//
// Tệp này là dữ liệu thuần (không DOM, không three) nên `src/sim` đọc được và test chạy được trong Node.
export interface Landmark {
  /** Mã đích đến, viết thường, dùng trong lời khuyên và trong test. */
  id: string;
  /** Tên người chơi đọc trên Bản đồ. */
  name: string;
  /** Khoá neo trong `world.anchors` — nơi người chơi phải đi tới (nếu có). */
  anchor?: string;
  /** Mã chỗ bán trong `SPOTS` (chỗ dựng quầy) — dùng thay `anchor` (nếu có). */
  spot?: string;
  /**
   * Dùng được BẤT KỂ GIỜ: giường ngủ (chạm vào là ngủ), bảng việc làm, bệnh viện, công an, gầm cầu,
   * chỗ dựng quầy… Những chỗ còn lại chỉ tính là “đang mở” trong giờ của nó (`PLACE_HOURS` / giờ của sạp).
   */
  always?: boolean;
  /**
   * Chỗ gộp nhiều quầy: chỉ cần MỘT trong các sạp này đang mở là chỗ đó dùng được
   * (Chợ Xóm Chiều có chục sạp, mỗi sạp mở giờ khác nhau — xem `data/shops.ts`).
   */
  openWith?: string[];
}

/** Thứ tự này là thứ tự hiện trên Bản đồ (giữ như bản cũ). */
export const LANDMARK_LIST: Landmark[] = [
  { id: 'equip', name: 'Đồ Nghề Ba Tài', anchor: 'v_equip' },
  { id: 'market', name: 'Chợ Xóm Chiều', anchor: 'v_m_rau', openWith: ['m_rau', 'm_cu', 'm_thit', 'm_haisan', 'm_kho', 'm_giavi', 'm_trung'] },
  { id: 'mart', name: 'MiniMart 24h', anchor: 'v_mart' },
  { id: 'kiosk', name: 'Tạp hoá Cô Ba', anchor: 'v_kiosk' },
  { id: 'eatery', name: 'Quán cơm Bà Tư', anchor: 'v_eatery' },
  { id: 'cafe', name: 'Cà phê Sân Vườn', anchor: 'v_cafe' },
  { id: 'scrap', name: 'Vựa ve chai Tư Rác', anchor: 'v_scrap' },
  { id: 'scrap2', name: 'Vựa ve chai Bà Chín', anchor: 'v_scrap2' },
  { id: 'pawn', name: 'Cầm đồ Chú Lâm', anchor: 'v_pawn' },
  { id: 'bank', name: 'Ngân hàng Sao Vàng', anchor: 'v_bank' },
  // Giường ngủ trong nhà chạm vào là ngủ được mọi giờ, kể cả khi cửa tiệm đã đóng.
  { id: 'tro', name: 'Nhà trọ Bác Năm', anchor: 'v_tro', always: true },
  { id: 'motel', name: 'Nhà nghỉ Bình Dân', anchor: 'v_motel', always: true },
  { id: 'hotel', name: 'Khách sạn Hoa Sen', anchor: 'v_hotel', always: true },
  { id: 'canho', name: 'Căn hộ An Bình', anchor: 'v_canho', always: true },
  { id: 'nharieng', name: 'Nhà số 12', anchor: 'v_nharieng', always: true },
  { id: 'cuahang', name: 'Tạp hoá Bình An', anchor: 'v_cuahang', always: true },
  { id: 'hot_toc', name: 'Tiệm hớt tóc Bảy Kéo', anchor: 'v_hot_toc' },
  { id: 'pharmacy', name: 'Nhà thuốc An Tâm', anchor: 'v_pharmacy' },
  { id: 'hospital', name: 'Bệnh viện Phước An', anchor: 'v_hospital', always: true },
  { id: 'police', name: 'Công an phường', anchor: 'v_police', always: true },
  { id: 'recover', name: 'Phòng hồi sức bệnh viện', anchor: 'giuong_benhvien', always: true },
  { id: 'wholesale', name: 'Vựa đầu mối Tám Lúa', anchor: 'v_wholesale' },
  { id: 'temple', name: 'Chùa Phước An', anchor: 'v_temple', always: true },
  { id: 'wash_park', name: 'Nhà tắm công viên', anchor: 'wash_park', always: true },
  { id: 'shark', name: 'Hùng Sẹo (vay nóng)', anchor: 'v_shark' },
  { id: 'camp', name: 'Gầm cầu (lều của bạn)', anchor: 'bed_gamcau', always: true },
  // Chú Ba xe ôm đứng suốt ngày dưới gầm cầu — neo riêng để Bản đồ ghim đúng chỗ ổng đứng.
  { id: 'xeom', name: 'Chú Ba xe ôm', anchor: 'v_chu_ba' },
  { id: 'board', name: 'Bảng việc làm', anchor: 'board', always: true },
  { id: 'dock', name: 'Bến bốc hàng', anchor: 'v_dock' },
  // ── Chỗ để Ông Bảy chỉ khi có SỰ KIỆN đang diễn ra (lượt 70c). Chỉ tới được khi sự kiện còn hiệu lực:
  // `isOpenOf` trong `sim/advice.ts` đóng những đích này lại khi sự kiện đã hết, nên không bao giờ thành lời
  // chỉ đường chết. Tên ở đây là tên chỗ, KHÔNG phải tên sự kiện (sự kiện đổi luôn, tên chỗ thì cố định).
  { id: 'cafe_bongda', name: 'Quán cà phê Bóng Đá', anchor: 'tv_bongda' },
  { id: 'net_tro', name: 'Quán net Xóm Lao Động', anchor: 'v_net' },
  // Chỗ dựng quầy: dùng toạ độ của `SPOTS`, không có neo riêng.
  { id: 'spot_cho', name: 'Cổng Chợ', spot: 'cho', always: true },
  { id: 'spot_cv', name: 'Cổng Công Viên', spot: 'cv', always: true },
  { id: 'spot_hem', name: 'Hẻm Công Nhân', spot: 'hem', always: true },
  // Ba chỗ dựng quầy còn lại cũng lên bản đồ: lời khuyên của Ông Bảy cần ghim đúng chỗ mình đang bán (ví dụ khi
  // đoàn kiểm tra đang đi từng quầy) chứ không thể chỉ về Cổng Chợ khi quán nằm ở Phố Văn Phòng.
  { id: 'spot_vp', name: 'Phố Văn Phòng', spot: 'vp', always: true },
  { id: 'spot_matbang_tb', name: 'Mặt bằng Phố Văn Phòng', spot: 'matbang_tb', always: true },
  { id: 'spot_matbang_dc', name: 'Mặt bằng Khu Căn Hộ', spot: 'matbang_dc', always: true },
];
export const LANDMARK_BY_ID: Record<string, Landmark> = Object.fromEntries(LANDMARK_LIST.map((l) => [l.id, l]));
/** Tra đích đến theo khoá neo (dùng cho Bản đồ: neo nào có tên thì hiện tên đó). */
export const LANDMARK_BY_ANCHOR: Record<string, Landmark> = Object.fromEntries(LANDMARK_LIST.filter((l) => l.anchor).map((l) => [l.anchor!, l]));

/** Mã chỗ ở (`HOUSING`) → mã đích đến trên bản đồ, để câu “về nhà ngủ” ghim đúng cửa. */
export const HOME_LANDMARK: Record<string, string> = { nhanghi: 'motel', khachsan: 'hotel', tro: 'tro', canho: 'canho', nharieng: 'nharieng', cuahang: 'cuahang', gamcau: 'camp', ghe: 'camp' };
