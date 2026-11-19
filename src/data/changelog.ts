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
