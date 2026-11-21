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
    v: 'Lượt 52',
    tag: 'Ông Bảy dưới gầm cầu gợi ý theo đúng tình cảnh của bạn, bấm một nút là ghim đường đi',
    items: [
      'Hỏi Ông Bảy không còn ra mấy câu thuộc lòng: ông nhìn máu, cái bụng, túi tiền, giờ trong ngày và cái quầy của bạn mà nói.',
      'Sắp ngất thì ông chỉ vô Bệnh viện Phước An, kèm giá khám 20.000₫ và phòng hồi sức 5.000₫/giờ.',
      'Đói thì chỉ Quán cơm Bà Tư; quán đóng cửa rồi thì chỉ MiniMart 24h hoặc Tạp hoá Cô Ba — chỗ nào còn mở mới chỉ.',
      'Hết tiền thì ông giục đúng cái việc đang mở ở giờ đó: sáng ra bến bốc hàng, trưa ghé quán Bà Tư xin rửa chén, khuya thì ra Bảng việc làm.',
      'Đang bán mà món chính hết nguyên liệu: ông nói thiếu món gì và sạp nào đang mở, bán món đó.',
      'Quầy vắng khách: ông nói giờ nào đông nhất ở đúng khu bạn đang đặt quầy, ngồi giữ tới đó.',
      'Nợ Hùng Sẹo còn hai ngày là ông cảnh báo, kèm số tiền và số ngày còn lại; đêm thì dặn sáng 9 giờ mới gặp được nó.',
      'Trời sắp mưa mà chưa có áo mưa thì ông nhắc mua; khuya thì ông đuổi về đúng căn mình đang thuê mà ngủ.',
      'Câu nào cũng ghi cách đây bao nhiêu mét, và có nút "Chỉ con đường tới…" là cắm cột sáng vàng chỉ đường như trên Bản đồ.',
      'Ghé liền ba lần thì ông nói ba câu khác nhau, không lải nhải một câu.',
      'Bảng test của người làm game (bấm 7 lần chữ "Cài đặt") nay hỏi mã 4 số trước khi mở, người chơi lỡ tay không mở nhầm nữa.',
    ],
  },
  {
    v: 'Lượt 51',
    tag: 'Sửa giao diện theo báo cáo lượt 50: màn thấp hết chồng, chạm đúng chỗ, chơi dọc nhớ lựa chọn',
    items: [
      'Trên màn hình thấp (điện thoại nằm ngang, cửa sổ nhỏ) ô mục tiêu không còn đè lên thanh chỉ số: hết chỗ thì nó tự tụt xuống dưới, các chip hướng đi và sự kiện xuống theo.',
      'Chạm để tương tác phải đứng đủ gần: đang xoay camera quanh quầy hay đi ngang qua người lạ thì không còn mở nhầm bảng Quầy hay hộp thoại.',
      'Cần ảo nhận ngón tay từ cao hơn (bỏ 28 % màn hình trên xuống còn 12 %) nên máy ngang thấp đặt ngón cái đâu cũng đi được; đẩy mạnh hơn một chút là chạy, không phải đẩy hết cỡ.',
      'Nút Chạy có chữ ĐI/CHẠY và nhắc đúng một lần cách dùng; FPS mặc định tắt trên điện thoại cho gọn HUD.',
      'Máy tính: phím Z xoay phải (trước chỉ có Q), bật được khoá con trỏ chuột để rê chuột là xoay, và tuỳ chọn ẩn bốn nút cảm ứng.',
      'Bấm lại đúng phím tắt (M, B, Tab, P) thì bảng đang mở tự đóng; chạm vào biểu tượng chỉ số thì lời giải thích giữ lại trên màn hình, chạm lại mới tắt; thanh chỉ số không còn chen số vào giữa hàng.',
      'Bấm “Bỏ dở” giữa lúc nấu: lần đầu chỉ hỏi lại “Chắc chưa?”, lần hai mới bỏ mẻ — hết mất cả mẻ vì lỡ tay.',
      'Cài đặt có nút xoá bản lưu (bấm hai lần mới xoá) và mục “Cách điều khiển” ghi rõ phím cho máy tính lẫn điện thoại.',
      'Màn dọc: đã chọn “Cứ chơi dọc” thì lần sau mở game không bị lớp phủ che mất nút Chơi mới / Chơi tiếp nữa.',
    ],
  },
  {
    v: 'Lượt 49',
    tag: 'Xe cộ chạy đúng đường, thêm 3 màu xe, còi xe hơi riêng',
    items: [
      'Xe không còn “mọc” từ chỗ không có đường nữa: hết cảnh xe hiện ra giữa bãi đất gầm cầu, trên bờ kênh hay ngoài rìa thành phố.',
      'Xe chỉ xuất hiện sau lưng bạn hoặc ở rất xa phía trước, không còn đột ngột hiện ra ngay trước mặt.',
      'Chạy hết mặt đường thì xe quay đầu ở giao lộ cuối, không phóng ra bãi đất.',
      'Ba màu sơn mới cho xe hơi: đỏ đô, xanh rêu, vàng taxi — và xe đổi màu mỗi lần vào lại đường nên gặp đủ màu.',
      'Còi xe hơi riêng từng loại: xe nhỏ “bíp bíp”, sedan “bìm bìm”, xe tải “bừm” trầm — nghe là biết xe gì đang tới.',
    ],
  },
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
];
