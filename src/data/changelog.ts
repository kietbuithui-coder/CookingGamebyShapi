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
    v: 'Lượt 67',
    tag: 'Menu ẩn theo kịp game: 34 chỗ đi nhanh tới đúng người, tự tua tới giờ họ có mặt, dòng “bản mới nhất” đọc từ nhật ký',
    items: [
      'Trước bản này bấm “Chạy” ở menu ẩn mà nơi đó đóng cửa thì tới nơi chẳng có ai — 3 giờ sáng tới tiệm đồ nghề là đứng nhìn cửa khoá. Nay menu tự tua đồng hồ tới giờ mở cửa của chỗ đó (giờ lấy đúng từ dữ liệu của game), nên bấm là gặp người bán.',
      'Thêm 21 chỗ đi nhanh còn thiếu: vựa đầu mối Tám Lúa, tạp hoá Cô Ba, quán cơm Bà Tư, nhà thuốc, ngân hàng, cầm đồ, tiệm hớt tóc, tiệm quần áo, nhà trọ, khách sạn, nhà nghỉ, bệnh viện, công an, quán trà đá, chú vá xe, cô hát rong, bé đánh giày, góc nhảy của Bin, chỗ đua xe đạp, quán net, quán cà phê.',
      'Mục “Bàn cờ Ông Tư” đổi thành “Bàn cờ Ông Tư” đứng đúng cạnh ông; Chú Ba xe ôm thì đứng sát bên ổng (1,7 m) thay vì lệch 2,4 m như trước.',
      'Menu tự tìm chỗ đứng trống quanh người đó, không đặt bạn vào trong cột cầu, quầy hay kệ — trước đây vài mục đặt người chơi lọt thỏm trong đồ vật.',
      'Dòng “bản mới nhất” trong menu ẩn nay đọc thẳng từ nhật ký phát triển, nên nó không còn đứng nguyên ở bản cũ bốn lượt liền; nút khoá cũng ghi đúng “8 lần” thay vì “7 lần”.',
    ],
  },
  {
    v: 'Lượt 66',
    tag: 'Xe ôm Chú Ba: ổng đứng dưới gầm cầu, có xe thật — nhờ chở tới tận cửa, hoặc gọi điện là ổng chạy tới rước',
    items: [
      'Chú Ba xe ôm nay là người thật dưới gầm cầu (cạnh lều của bạn): áo sơ mi sờn, nón bảo hiểm, da ngăm vì chạy nắng, xe số dựng nghiêng bên cạnh, biển “XE ÔM CHÚ BA”, ghế nhựa ngồi chờ khách. Ổng đứng đó từ 5 giờ sáng tới 22 giờ 30.',
      'Lại gần bấm nói chuyện là mở bảng chỗ đi: mỗi đích có giá, số mét, xe chạy mấy phút và đi bộ mất mấy phút — đi xe nhanh hơn đi bộ khoảng ba lần.',
      'Giá theo quãng như bảng dán ngoài hẻm: trong xóm 3.000₫, sang phố bên 5.000₫, ra chợ hay ra bến 8.000₫. Trời mưa phụ phí 2.000₫; mang gánh hàng hay xe đẩy cũng phụ phí 2.000₫ vì nặng xe.',
      'Thân với ổng thì ổng bớt 1.000–2.000₫ (bán cho ổng ăn trưa vài lần là thân). Chưa thân thì tính đủ, ổng không cho thiếu tiền xe.',
      'Gọi điện: biết mặt ổng rồi thì số “Chú Ba xe ôm” nằm trong danh bạ; gọi là ổng chạy tới đúng chỗ bạn đứng sau 3 phút, hỏi đi đâu như ngoài đời. Mỗi ngày gọi hai lần, có cước như mọi cuộc gọi. Còn nợ tiền cơm thì ổng từ chối chở, khuya quá ổng về nhà.',
      'Bản tin radio/WAP nhắc Chú Ba đúng lúc ổng đang đứng dưới gầm cầu, đúng giá đang áp (mưa thì có phụ phí) — không còn câu bịa “đứng đầu hẻm”.',
      'Bản đồ có thêm đích “Chú Ba xe ôm”; menu ẩn thêm mục dịch chuyển nhanh tới chỗ ổng đứng.',
    ],
  },
  {
    v: 'Lượt 64',
    tag: 'Sửa bàn phím mã PIN của menu ẩn: gõ được mọi số, có nút Xoá, mã 6 số khó đoán, sai nhiều thì khoá',
    items: [
      'Trước bản này bàn phím chỉ “nhận” số 7: game so từng số ngay khi gõ nên chữ số đầu tiên khác 7 là bị xoá lập tức, trông như bàn phím hỏng.',
      'Nay gõ số nào cũng được, gõ đủ 6 số mới kiểm tra một lần — sai thì xoá sạch và báo “sai mã, thử lại”, không nói sai ở số nào.',
      'Bàn phím có thêm nút “Xoá” (bỏ một số vừa gõ nhầm) và nút “C” (xoá hết), hai nút rộng rãi, bấm được trên màn hình thấp.',
      'Mã đổi từ 7777 sang mã 6 số không lặp, khó đoán hơn nhiều; bấm 8 lần vào chữ “Cài đặt” mới hiện bàn phím.',
      'Gõ sai 5 lần liên tiếp thì bàn phím khoá 30 giây — hết dò mã bằng cách bấm lần lượt.',
    ],
  },
  {
    v: 'Lượt 63',
    tag: 'Dọn menu test ẩn: xoá hết mục thử, chỉ còn nhóm “Địa điểm — dịch chuyển nhanh”',
    items: [
      'Vào Cài đặt, bấm 7 lần chữ “Cài đặt” rồi nhập 7777 thì nay chỉ còn một nhóm: các chỗ dịch chuyển nhanh (tiệm đồ nghề, chợ, công viên, căn hộ, gầm cầu, MiniMart…).',
      'Toàn bộ mục thử của các lượt trước đã được xoá — menu không còn là bãi rác test, mở lên là thấy đúng thứ dùng được.',
      'Bài kiểm thử canh đúng điều đó: nhóm duy nhất phải tên “Địa điểm”, mọi mã mục phải bắt đầu bằng “tp_”, và danh sách phải còn đủ các chỗ quen thuộc.',
    ],
  },
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
];
