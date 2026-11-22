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
    v: 'Lượt 56',
    tag: 'Bà Chín Ve Chai có nước da rám nắng đúng dáng người cả ngày ngoài nắng',
    items: [
      'Mặt Bà Chín Ve Chai ở vựa ve chai Khu Dân Cư đổi sang màu da rám nắng, tối hơn hẳn màu da sáng nhất mà game vẫn cấp cho người đứng quầy.',
      'Trước đây màu da của nhân vật cố định chỉ được chọn theo công thức từ khuôn mặt và cái nón, nên Bà Chín rơi đúng vào màu sáng nhất bảng — nhìn không ra người phơi nắng cả ngày.',
      'Từ nay nhân vật nào có nghề nói lên nước da thì được khai màu da riêng; ông Tư Rác và những người đứng quầy khác vẫn giữ nguyên màu như cũ.',
      'Khuôn mặt bà vẫn là khuôn mặt bà cụ tóc bạc, vẫn đội nón lá như trước — chỉ đổi nước da, không đổi ai ra ai.',
      'Bảng test của người làm game có mục soi mặt Bà Chín, mục đọc màu da cũ và màu mới, và mục tele sang vựa ông Tư Rác để so hai chủ vựa cạnh nhau.',
    ],
  },
  {
    v: 'Lượt 55',
    tag: 'Sạp Dì Sáu đổi tên, khách không còn đi xuyên quầy, và ngủ ở nhà nghỉ / nhà trọ không còn bị văng sang gian khác',
    items: [
      'Sạp “Trứng – Giò chả Dì Sáu” trong chợ đổi tên thành “Trứng – Sữa – Giò Dì Sáu”, và quầy bán thêm sữa tươi hộp 32.000₫ cùng sữa đặc lon 24.000₫ cho đúng cái tên.',
      'Khách tới mua ở gánh hàng rong và xe đẩy không còn đi từ sau lưng người bán rồi xuyên thẳng qua thân quầy: họ vòng qua đầu quầy rồi mới bước ra trước mặt, đúng như khách ngoài đời.',
      'Lỗi xuyên quầy sửa cho mọi cỡ quầy chứ không riêng nhà hàng: gánh, xe đẩy, sạp và quán ăn nhỏ đều có thân quầy chắn hẳn hoi, cả trên máy tính lẫn điện thoại.',
      'Ngủ ở nhà nghỉ Bình Dân hay phòng trọ Bác Năm không còn bị văng sang khung gian bên cạnh rồi kẹt cứng: người chơi giờ nằm ở chỗ trống ngay cạnh giường, và tỉnh dậy mà chân còn trong khung giường thì tự bước ra trước khi trả lại quyền đi lại.',
      'Buồng tắm của nhà nghỉ và nhà trọ được dựng lại tử tế: tường ốp gạch men có đường ron, khay tắm có gờ và lỗ thoát nước, cột sen inox có tay gạt nóng lạnh màu đỏ, đầu vòi hoa sen tròn có sáu lỗ phun.',
      'Trong buồng tắm còn có kệ ba chai dầu gội, khăn treo, gương soi có đèn, và một tấm chắn kính để nước không bắn ra ngoài.',
      'Phòng nghỉ và phòng trọ được kê thêm đồ cho ra dáng chỗ ở: tủ đầu giường có đèn ngủ và cuốn sách, quạt treo tường, ti vi nhỏ, rèm cửa, thảm chân giường, móc áo; bên trọ có thêm dây phơi đồ, quạt cây, ấm nước, lịch treo tường và chiếu trải giữa phòng.',
      'Bảng test của người làm game đổi sang việc của bản này: đọc bảng hàng sạp Dì Sáu, tele tới ba chỗ mới sửa, và dựng sẵn gánh trà đá ở Cổng Chợ để xem khách có vòng qua đầu quầy không.',
    ],
  },
  {
    v: 'Lượt 54',
    tag: 'Tiệm bánh Anh Bảo bán thêm năm loại bánh, và nước tăng lực Shapi hồi thẳng thanh chạy',
    items: [
      'Lò bánh mì Anh Bảo đổi thành Tiệm bánh Anh Bảo — giờ bán cả bánh ngọt, không chỉ bánh mì.',
      'Quầy có thêm bánh mì que pa-tê, bánh tiêu, bánh bao nhân thịt, bánh su kem và bánh bông lan; cả sáu loại bày trên cùng một quầy giữa chợ.',
      'Bánh càng đắt thì ăn càng no và càng vui: bánh mì que 5.000₫ no 8 vui 3, bánh bông lan 25.000₫ no 40 vui 13 — không có chuyện trả nhiều tiền mà bụng y như nhau.',
      'Bánh mua về ăn liền trong Túi, không phải nấu; bánh su kem phải giữ lạnh, còn bánh bông lan để được gần hai ngày.',
      'Nước tăng lực nhãn Shapi mới ra lò: 9.000₫/lon, bán ở MiniMart 24h (kệ đá cuối tiệm) và Tạp hoá Cô Ba (ô cuối quầy).',
      'Uống một lon Shapi là thanh chạy hồi ngay 30 %, cạn pin mà còn lon trong túi thì chạy tiếp được — nhưng đừng uống khi thanh đã gần đầy, phí.',
      'Kệ MiniMart và quầy tạp hoá được nới thêm ô để mỗi mặt hàng chỉ nằm đúng một chỗ, không còn cảnh lấy hàng ở ô trống.',
      'Ba loại bánh mới được vẽ hình riêng: bánh mì que là ổ dài và mảnh hơn bánh mì, một đầu quấn giấy; bánh tiêu là đĩa dẹt phồng rắc mè; bánh su kem có vỏ nâu và núm kem trắng trên đầu — trước đây cả ba trông giống hệt nhau.',
    ],
  },
  {
    v: 'Lượt 53',
    tag: 'Thanh thể lực hồi nhanh hay chậm tuỳ máu và pin — người khoẻ chạy dai, người đang thương thở dốc',
    items: [
      'Thanh chạy không còn hồi một tốc độ cố định cho mọi người: máu càng thấp và pin năng lượng càng cạn thì thanh càng lâu đầy.',
      'Máu 20 thì thanh chỉ hồi khoảng một nửa tốc độ bình thường — đứng chờ 22 giây mới đầy, thay vì 11 giây như người khoẻ.',
      'Cạn pin năng lượng thì hồi chậm thêm, nhưng không cộng dồn thành đứng im: cùng lúc tệ nhất vẫn hồi được khoảng 40 % tốc độ.',
      'Người đang thương còn TỤT thanh nhanh hơn khi chạy: máu 25 thì chạy liền được khoảng 8 giây thay vì 10 giây, cạn pin thì ngắn hơn nữa.',
      'Chạm vào thanh thể lực là biết vì sao lâu đầy: nó ghi rõ hồi bao nhiêu phần trăm tốc độ, đang mất máu hay thiếu ngủ, chạy liền được mấy giây và cạn rồi phải chờ bao lâu.',
      'Muốn chạy dai trở lại thì ăn cho no, ngủ cho đủ pin và đi khám khi mất máu — không có cách nào khác.',
      'Bảng test của người làm game có thêm mục đọc thanh chạy hiện tại, so ba mức khoẻ / máu 45 / máu 20, và hai nút đặt sẵn chỉ số để thử.',
    ],
  },
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
];
