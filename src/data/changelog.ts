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
    v: 'Lượt 48',
    tag: 'Ngủ ở trọ/khách sạn đỡ đói, ghế đá nghỉ tốt hơn, biển chỗ bán đúng giá',
    items: [
      'Ngủ ở khách sạn, phòng trọ, nhà nghỉ, căn hộ: đói và khát tụt ít hơn hẳn (khách sạn giảm ~50 %, phòng trọ ~35 %). Ngủ gầm cầu, ghế đá thì vẫn tụt như cũ.',
      'Giường xịn giờ hồi năng lượng nhanh hơn thật: 8 tiếng ở khách sạn được +89 năng lượng, ghế đá +43 (trước đây cả hai đều chạm trần 43).',
      'Nghỉ trên ghế đá hiệu quả hơn một chút: tinh thần +9 (trước +7), năng lượng +6 (trước +4), vẫn miễn phí.',
      'Biển “CHỖ BÁN HÀNG” hết sai giá: đọc thẳng giá thật trong game (Cổng Chợ 18.000₫, Cổng Công Viên 12.000₫, Phố Văn Phòng 60.000₫, Mặt bằng Phố Văn Phòng 160.000₫, Mặt bằng Khu Căn Hộ 120.000₫).',
    ],
  },
  {
    v: 'Lượt 47',
    tag: 'Sửa lỗi mở game trên điện thoại: không còn màn hình đen',
    items: [
      'Hết cảnh mở game ra chỉ thấy màn hình đen, không vào được menu: nếu tệp game không tải được, máy sẽ hiện bảng báo lỗi kèm hai nút.',
      'Nút “Sửa lỗi tải”: tự xoá bộ nhớ đệm cũ trên máy rồi mở lại. Tiến trình chơi vẫn giữ nguyên.',
      'Game luôn mở bản mới nhất khi có mạng, chỉ dùng bản lưu khi mất mạng — không còn kẹt ở bản cũ sau mỗi lần cập nhật.',
      'Đang tải mà quá 15 giây chưa lên thì có lời báo thay vì đứng im.',
    ],
  },
  {
    v: 'Lượt 46',
    tag: 'Ít mưa hơn, thuê chỗ chợ & công viên rẻ 40 %',
    items: [
      'Trời mưa ít hẳn: từ 37 % thời gian xuống còn 18 % (mưa nhỏ 22 % → 11 %, mưa to 10 % → 2,6 %, giông 5,8 % → 4,5 %).',
      'Mưa tan nhanh hơn, nắng quay lại sớm — bớt cảnh dầm mưa liên miên.',
      'Phí chỗ Cổng Chợ: 30.000 → 18.000₫/ngày. Cổng Công Viên: 20.000 → 12.000₫/ngày (giảm 40 %).',
      'Giá thuê chi nhánh ở chợ và công viên cũng giảm 40 %: chợ 120.000 → 72.000₫, công viên 90.000 → 54.000₫/ngày.',
      'Các chỗ khác giữ nguyên giá.',
    ],
  },
  {
    v: 'Lượt 45',
    tag: 'Điện thoại: vừa đi vừa nhảy/đấm được',
    items: [
      'Trên điện thoại, đang giữ cần ảo mà bấm Nhảy hoặc Đấm thì trước đây vừa không nhảy được, vừa khựng lại — nay chạy đúng.',
      'Đo thật: đang đi, bấm Nhảy vẫn đi tiếp (mz 0,86, quãng đường tăng đều); bấm Đấm cũng vậy.',
      'Nguyên nhân: nút nằm trong lớp #ui trong suốt với chạm nên ngón tay rơi xuống canvas, canvas cướp mất cần ảo.',
      'Trên máy tính không đổi gì: W + Space, W + F, kéo chuột nhìn quanh trong lúc đi vẫn như cũ.',
    ],
  },
  {
    v: 'Lượt 44',
    tag: 'Nhảy qua bồn hoa, hồ nước, xe máy',
    items: [
      'Nhảy qua được 8 bồn hoa công viên, thành hồ nước và cả 69 chiếc xe máy đỗ ven đường.',
      'Hồ nước chỉ nhảy qua được thôi — đứng vào là chìm xuống đáy, không lơ lửng trên mặt nước.',
      'Hàng rào chợ nâng lên cho chắc: chợ vẫn phải đi cổng, không nhảy rào được.',
      'Sửa lỗi chữ dính nhau khi bới thùng rác: nay gộp thành một dòng, ví dụ “+1 Chai nhựa · +2 Lon nhôm”.',
    ],
  },
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
];
