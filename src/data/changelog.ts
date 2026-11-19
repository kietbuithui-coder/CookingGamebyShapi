// NHẬT KÝ PHÁT TRIỂN — hiện trong game ở Cài đặt › Nhật ký phát triển.
// Chỉ giữ các bản GẦN ĐÂY (mới nhất ở trên). Mỗi lần làm xong một lượt thì thêm một mục vào đầu mảng;
// mục cũ tự rơi ra khỏi danh sách khi quá 8 bản, để người chơi đọc được nhanh chứ không phải cuộn dài.
// Câu chữ ở đây là câu người chơi đọc, nên viết như đang kể việc đã làm — không viết kiểu commit.
export interface LogEntry {
  /** Nhãn bản: "Lượt 37" — trùng với PLAN.md. */
  v: string;
  /** Một dòng tóm tắt bản này. */
  tag: string;
  /** Những việc đã làm, mỗi dòng một việc, đọc là hiểu ngay trong game có gì khác. */
  items: string[];
}

/** Mới nhất ở đầu. */
export const CHANGELOG: LogEntry[] = [
  {
    v: 'Lượt 40',
    tag: 'Mượt hơn trên điện thoại, và chơi được khi mất mạng',
    items: [
      'Mức “Vừa” — mức mặc định trên điện thoại — bỏ bóng đổ, vẽ 1 điểm ảnh thay vì 1,5 và bớt đèn: đo trên cùng một máy, khung hình nhanh gấp 2,5 lần (5,5 → 14,1 FPS).',
      'Mức “Rất thấp” nay nhẹ hơn nữa (0,6 điểm ảnh, không lớp chi tiết) — máy yếu chọn mức này là gần 30 FPS.',
      'Không có bóng đổ thì tắt hẳn bộ vẽ bóng; điện thoại không bật khử răng cưa (MSAA) ở bất cứ mức nào.',
      'Tự hạ đồ hoạ thông minh hơn: hạ sau 5 giây giật thay vì 6, máy dưới 22 FPS thì hạ thẳng 2 mức, và không hạ oan khi khung hình vẫn trên 45.',
      'Chơi offline: Cài đặt có nút “Lưu để chơi offline” — lưu xong thì tắt mạng, mở lại game vẫn vào và chơi tiếp bình thường.',
    ],
  },
  {
    v: 'Lượt 39',
    tag: 'Bánh phở, bún và đồ nguội cũng để được 2 ngày',
    items: [
      'Bánh phở 30 → 60 giờ, bún tươi 26 → 52 giờ: mua hôm nay, để qua đêm vẫn bán được.',
      'Đồ nguội ăn liền (xúc xích, giò lụa, chả cá, đậu hũ) cũng tăng gấp đôi hạn dùng.',
      'Thịt, cá, hải sản tươi sống thì vẫn hỏng trong ngày như cũ — để lâu là mất thật.',
    ],
  },
  {
    v: 'Lượt 38',
    tag: 'Nhật ký phát triển xem được trong Cài đặt',
    items: [
      'Cài đặt có mục “Nhật ký phát triển”: danh sách các bản gần đây và việc đã làm trong từng bản, bản mới nhất ở trên cùng.',
      'Bản nào chưa đọc thì nút có nhãn “mới”; mở ra đọc là tự lưu, lần sau nhãn biến mất.',
      'Danh sách chỉ giữ các bản gần nhất cho dễ đọc, không phải cuộn một trang dài.',
    ],
  },
  {
    v: 'Lượt 37',
    tag: 'Lấy đồ ra khỏi quầy ở bất cứ đâu',
    items: [
      'Bảng Túi đồ có thêm tab “Kho quầy”: bấm “› Túi” là lấy được đồ trong kho quầy ra, không cần đặt quầy ở chỗ bán.',
      'Đang gánh quầy trên vai, quầy để ở nhà, hay đang đứng giữa chợ — vẫn lấy ra được.',
      'Chỉ chiều bỏ đồ VÀO kho mới cần đứng gần quầy (để kho không thành túi không đáy).',
    ],
  },
  {
    v: 'Lượt 36',
    tag: 'Đồ bỏ vào quầy không còn “biến mất”',
    items: [
      'Bánh mì để được 2 ngày thay vì 1 ngày (52,8 giờ).',
      'Sáng ra thấy mất đồ thì giờ có báo đích danh: “Đồ hỏng phải bỏ: Tôm…”.',
      'Sữa, thịt để trong quầy mà không có tủ đá thì bảng Kho quầy cảnh báo còn mấy giờ là hỏng.',
      'App Quản lý cửa hàng trên điện thoại hiện thêm “Kho nguyên liệu: N loại · X kg”, cảnh báo sắp hỏng và cảnh báo đồ cần lạnh — giống bảng trên máy tính.',
      'Nút “Bỏ” trong Túi đổi thành “Vứt” và báo rõ đã vứt món gì, bao nhiêu.',
      'Lò bánh mì Anh Bảo chiều muộn bán rẻ xả hàng như các sạp khác.',
    ],
  },
  {
    v: 'Lượt 35',
    tag: 'Quán thường cũng có bảng Nhân sự',
    items: [
      'Quán bậc 3–5 thuê người phụ quầy là mở được tab “Nhân sự” — không còn cảnh thuê người mà không có nút “Giao đi chợ…”.',
      'Nhà hàng bình dân vẫn có “Nhân sự & Đặt bàn” như cũ.',
      'Bớt hai dòng thừa ở quán nhỏ: “Nhân viên phụ bếp (0/0)” và “Bếp trưởng tự duyệt đặt bàn” khi chưa có bếp trưởng.',
    ],
  },
  {
    v: 'Lượt 32',
    tag: 'Khách lựa hàng · người đi đường nhận ra người chơi',
    items: [
      'Tạp hoá Cô Ba và MiniMart có khách thật vào lựa hàng: đi dọc kệ, nói đúng tên món và đúng giá hôm nay, có khi nhờ bạn lấy giùm món trên kệ cao.',
      'Người đi đường chào theo hoàn cảnh: bạn giàu, bạn đang túng, hay bạn đang bị công an để ý.',
      'Menu Test & Dịch chuyển (ẩn) có thêm nhóm của lượt 31.',
    ],
  },
  {
    v: 'Lượt 31',
    tag: 'Con người: dáng · râu · nón · thoại riêng · ca làm',
    items: [
      'Tiệm may Cô Ngọc bán ba dáng người (gọn / vừa / đậm) — đổi cả chiều cao, tốc độ đi và độ hao sức; có thêm mũ nón.',
      'Ghế Chú Bảy có mục râu: sạch, râu mép, râu cằm, râu quai nón.',
      '15 nhân vật cố định có câu nói riêng, xoay theo ngày.',
      'Hai người phụ quầy chia ca sáng / ca chiều / cả ngày; ngoài ca thì họ không tới quầy.',
      'Từ xe đẩy trở lên, người chơi tự mặc tạp dề của người bán.',
    ],
  },
];
