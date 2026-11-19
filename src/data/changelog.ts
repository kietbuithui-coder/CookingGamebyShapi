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
    v: 'Lượt 43',
    tag: 'Đứng được trên nóc vật thấp',
    items: [
      'Nhảy lên đứng hẳn trên nóc ghế đá, bàn nhựa, thùng rác… rồi đi lại trên đó như đi trên mặt đất.',
      'Bước ra khỏi mép là rơi xuống đất, không lơ lửng giữa không trung.',
      'Đứng trên nóc chỉ nhảy thêm được 0,5 m — không nhảy vọt lên nóc cao hơn.',
      'Thùng rác tròn chỉ đỡ khi đứng thật trên miệng thùng.',
    ],
  },
  {
    v: 'Lượt 42',
    tag: 'Nhảy giờ thật sự vượt được vật thấp',
    items: [
      'Nhảy cao hơn (0,99 m thay vì 0,46 m): vượt được ghế đá công viên, bàn nhựa trà đá, bàn cờ ông Tư, thùng rác, băng ngồi, kệ thấp và lề đường.',
      'Có 80 vật thấp nhảy qua được trong thành phố, khai báo đúng chiều cao thật của từng món (bệ cửa sổ cố ý giữ nguyên làm ranh giới nhà).',
      'Tường nhà, cột, vách vẫn chặn tuyệt đối — bay cao bao nhiêu cũng không lọt vào trong.',
      'Rơi trúng nóc vật thấp thì đứng trên đó được, bước ra mép là rơi xuống đất, không bị kẹt trong đồ.',
    ],
  },
  {
    v: 'Lượt 41',
    tag: 'Rau củ để được lâu, ăn quán no lâu, và bệnh đau bụng có thuốc chữa',
    items: [
      'Rau củ mua ở chợ để được lâu gấp 3–3,5 lần: rau muống 30 → 105 giờ, cà rốt 120 → 360 giờ, cà chua 72 → 216 giờ…',
      'Khoai tây, khoai lang, hành tây, tỏi, gừng, sả giữ nguyên như cũ — nhóm này vốn đã rất bền.',
      'Ăn ở quán cơm, quán ăn, chùa hay uống ở quán cà phê thì no lâu hơn 2,5 lần, giá không đổi.',
      'Có bệnh đau bụng: ăn uống bậy (đồ mua sẵn, nước ở vòi công cộng, nước quán cà phê) là có thể bị, máu tụt dần chứ không mất một cục.',
      'Mua thuốc đau bụng ở nhà thuốc An Tâm hoặc quầy thuốc bệnh viện là khỏi ngay — không mua thì vài giờ cũng tự dịu.',
      'Món mình tự nấu từ 2 sao trở lên thì gần như không đau bụng; dưới 2 sao mới có rủi ro.',
      'Mức “Cao” trên điện thoại được trả lại như cũ (2 điểm ảnh, bóng đổ 2048) — máy khoẻ chọn “Cao” là hình đẹp nhất, không bị hạ nữa.',
      'Thịt, cá, hải sản tươi để trong quầy được đúng 2 ngày thay vì 3,5–5 giờ như trước: thịt heo/bò 58 giờ, gà vịt 53 giờ, tôm cá cua 48 giờ.',
    ],
  },
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
];
