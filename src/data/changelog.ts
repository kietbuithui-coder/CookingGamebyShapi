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
    v: 'Lượt 62',
    tag: 'Đá viên tan chậm gấp 3 lần, và chỗ hiển thị ghi “độ lạnh” thay vì “tươi/hỏng”',
    items: [
      'Đá viên lâu tan gấp 3 lần: để ngoài trời trước đây chỉ 3,4 giờ là tan sạch, nay dùng được khoảng 11 giờ; để trong thùng đá thì giữ được hơn 5 ngày (trước chưa tới 2 ngày).',
      'Túi đá, kho quầy và ba lô không còn ghi “tươi …%” hay “hỏng” cho đá — vì đá tan chứ không ôi, ghi “hỏng” làm người chơi tưởng mua phải hàng ôi.',
      'Nhãn mới: trên nửa thùng là “lạnh 82 %”, dưới nửa là “đá tan 40 %”, gần hết là “tan hết”.',
      'Đêm qua mà đá tan hết, sáng ra có câu báo riêng “Đá trong thùng tan hết” thay vì gộp vào danh sách “đồ hỏng phải bỏ”.',
      'App Quản lý cửa hàng và tin trên điện thoại cũng đọc đúng: đá không còn nằm trong mục “đồ sắp hỏng”, chỉ còn cảnh báo thay đá kẻo thịt cá hỏng theo.',
    ],
  },
  {
    v: 'Lượt 61',
    tag: 'Menu test ẩn dựng sẵn bếp, nồi, than và đủ nguyên liệu cho cả trà đá lẫn trà chanh — chạm một lần là vào nồi',
    items: [
      'Mục “Dựng sẵn bếp cho TRÀ ĐÁ và TRÀ CHANH”: đặt sẵn quầy, mua bếp than, nồi, dao thớt, cho than và đủ nguyên liệu cả hai món, rồi hỏi bạn muốn vào nồi món nào.',
      'Thêm hai mục gọi thẳng “Vào thẳng nồi TRÀ ĐÁ” và “Vào thẳng nồi TRÀ CHANH”: một cú bấm là đứng ngay ở bước cho nguyên liệu, không hỏi gì thêm.',
      'Lý do: bấm mục cũ trên ván mới thì nồi không mở — ván mới chỉ có 18.000₫ nên chưa mua được gánh, quầy chưa đặt được chỗ, và thiếu bếp, nồi, than. Nay các mục này tự lo đủ, chỉ còn việc chạm chén.',
      'Chạm chén là chén bay vào nồi, nồi chuyển sang bước giữ lửa và hiện nút “Quạt lửa” / “Lọc ra” như chơi bình thường.',
    ],
  },
  {
    v: 'Lượt 60',
    tag: 'Sửa lỗi không cho được nguyên liệu vào nồi: trà đá và mọi món nấu, ninh, luộc, pha giờ chạm là ăn',
    items: [
      'Trước bản này, món nào có bước nấu/ninh/luộc/pha (trà đá, nước sâm, kho thịt, nồi cá…) đều bị kẹt ở bước “Cho nguyên liệu”: chạm đúng chén “Trà khô” mà nồi vẫn trống, bấm mãi không qua được.',
      'Nguyên nhân: bàn nấu nhận tay theo một mặt phẳng duy nhất đặt ở MẶT NƯỚC nồi, trong khi chén nguyên liệu nằm trên MẶT BÀN. Điểm chạm vì thế bị kéo lệch khoảng 20 cm — xa hơn bán kính chạm của chén, nên không chén nào ăn được.',
      'Nay bàn nấu nhận tay ở cả hai độ cao: chạm chén thì lấy đúng mặt bàn, chạm để vớt bọt thì lấy mặt nước. Đo lại: chạm đúng chén thì lệch chỉ còn 4 mm (trước là 208 mm).',
      'Rà cả 7 bàn thao tác còn lại: thái/băm, chiên/xào, nướng, trình bày ra đĩa – ly, trộn topping, rửa chén — đều chạm đúng (lệch 1–19 mm, đều dưới ngưỡng ăn).',
      'Bảng test của người làm game có thêm mục mở thẳng bước nấu trà đá để thử lại nhanh.',
    ],
  },
  {
    v: 'Lượt 59',
    tag: 'Mỗi ngày chỉ nhận được vài ca bốc cá, vài ca chạy bàn; vác bao tăng lên 20 bao/ngày, và bảng việc làm liệt kê đủ mọi việc kèm số còn lại thật',
    items: [
      'Ca bốc cá bến cảng giờ chỉ nhận 2 ca một ngày (mỗi ca 110 phút, 4h30–10h). Làm hết ca thứ hai là anh Sáu Lực từ chối, kèm câu nhắc “mai ra sớm nha” — không còn chuyện đứng bấm cả buổi sáng ra tiền.',
      'Ca chạy bàn / phụ quán cà phê chỉ nhận 3 ca một ngày, tính chung cho cả quán Bóng Đá lẫn quán Sân Vườn. Hết 3 ca thì cả hai quán cùng từ chối và nói rõ là hết ca hôm nay.',
      'Lượt ca còn lại hiện ngay trên dòng chọn việc (“còn 2/3 ca hôm nay”), và sau mỗi ca có thông báo còn mấy ca — không phải đoán.',
      'Vác bao ở bến chợ tăng từ 12 lên 20 bao một ngày (6.000₫/bao, tối đa 120.000₫). Đã vác đủ thì dòng chọn việc biến mất, và lỡ đang vác dở bao trên vai cũng phải trả lại chứ không được tính tiền.',
      'Bảng việc làm viết lại: mỗi việc một dòng, đủ 7 việc (vác bao, bốc cá, chạy bàn, rửa chén, giao hàng, ve chai, việc khác), ghi đúng số của ngày hôm nay — còn mấy bao, mấy ca, mấy lượt rửa chén, mấy đơn giao — và ghi rõ giờ mở cửa của từng chỗ.',
      'Việc nào hết thì bảng không im lặng bỏ đi mà ghi thẳng “đã vác đủ 20 bao hôm nay”, để người chơi biết là do hết hạn mức chứ không phải mình tìm sai chỗ.',
      'Qua ngày mới mọi hạn mức tự mở lại; bản lưu cũ vẫn đọc được bình thường, không phải chơi lại từ đầu.',
      'Bảng test của người làm game có mục đo trần: bốc cá tới ca 3, chạy bàn tới ca 4, vác tới bao thứ 21 — cả ba đều bị chặn và sổ ngày không nhích.',
    ],
  },
  {
    v: 'Lượt 58',
    tag: 'Bánh tráng trộn có mini game riêng: 5 topping nằm ở vị trí ngẫu nhiên mỗi ván, màn hình gọi tên thứ nào thì chạm đúng đĩa đó',
    items: [
      'Làm bánh tráng trộn không còn bày lớp theo thứ tự in sẵn trên phiếu: 5 topping (bánh tráng sợi, tương ớt, đậu phộng, rau thơm, chanh) được rải ra 5 cái đĩa quanh thau, và mỗi lần nấu chúng lại nằm ở chỗ khác — không học thuộc vị trí được.',
      'Máy gọi tên từng thứ một (“Chạm đĩa Tương ớt!”), người chơi phải chạm đúng đĩa đang được gọi trước khi hết giờ; đĩa đang gọi có vòng sáng vàng nhấp nháy nên không phải đoán.',
      'Mỗi ván gọi đủ 5 thứ hai vòng, vòng sau gấp hơn vòng trước; chạm nhầm hay chạm ra ngoài đĩa bị trừ điểm, để hết giờ cũng mất điểm, còn chạm đúng liên tục thì điểm cao.',
      'Chạm đúng là đĩa bay vào hộp giấy; hết một vòng thì thau được đảo một lượt cho đều, và xong cả ván thì thành phẩm bày trong hộp nhìn vẫn ra bánh tráng trộn như trước.',
      'Chỉ riêng món này đổi cách làm: các món khác vẫn trình bày theo phiếu như cũ, còn bước trộn không tốn than hay gas và không cần thêm dụng cụ ngoài dao thớt.',
      'Bảng test của người làm game có mục chuẩn bị sẵn quầy bánh tráng trộn, mục vào thẳng mini game trộn, và mục đọc toạ độ 5 đĩa của ván đang mở để so hai ván liền nhau xem vị trí có đổi thật không.',
    ],
  },
  {
    v: 'Lượt 57',
    tag: 'Rào “Cấm đường” chặn được cả xe cộ: xe tới vạch rào là quay đầu, không còn xuyên qua hai hàng rào',
    items: [
      'Xe cộ không còn chạy xuyên qua rào khi phố bị cấm đường: tới vạch rào là dừng lại, quay đầu sang làn bên kia và chạy ngược lại — đúng như ngoài đời gặp rào chắn.',
      'Rào dựng ở hai đầu đoạn phố trước chợ (z = −25 và z = 25) nên từ nay đoạn giữa hai hàng rào không còn chiếc xe nào đi qua, kể cả ô tô chạy nhanh.',
      'Đo lại bằng máy: bật cấm đường rồi đo hơn một nghìn lần vị trí xe, không lần nào có xe nằm giữa hai hàng rào; tắt luật mới thì đo được 570 lần xe lọt vào — đúng là lỗi cũ.',
      'Xe cũng không còn “mọc ra” trong đoạn đường đang rào: chỗ sinh xe dời ra ngoài hai đầu rào, nên không có chiếc nào hiện ra ngay sau lưng rào.',
      'Người đi bộ vẫn đi vòng như trước, giờ đi chung một nguồn sự thật với xe nên hai bên không lệch nhau nữa.',
      'Bảng test của người làm game có ba mục: bật cấm đường rồi tele ra trước rào, đọc số xe đang nằm trong đoạn cấm, và dỡ rào cho phố chạy lại bình thường.',
    ],
  },
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
  }
];
