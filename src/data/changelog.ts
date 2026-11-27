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
    v: 'Lượt 69',
    tag: 'Xe nước mía ở Chợ Xóm Chiều và quán Nước Mía 3K trên phố: ép tại chỗ, bán từng ly, học nghề, phụ một ca — thêm nghề phụ hồ, thuê nhà theo tháng',
    items: [
      'Xe nước mía dựng trong Chợ Xóm Chiều: thùng xanh, máy ép có trục và tay quay, xô nước, thùng đá, ly xếp sẵn, bó mía dựng góc, dù đỏ, tấm biển “NƯỚC MÍA 3.000₫”, hai ghế nhựa và bao bã mía. Cô Hai Mía đứng bán từ 6 giờ sáng tới 18 giờ 30.',
      'Quán Nước Mía 3K mở ở mặt tiền Phố Trung Tâm, ngay cạnh quán cơm Bà Tư: máy ép quay hẳn ra phía khách, két nước, thùng đá, bó mía, hai bàn nhựa, quạt, đèn, cửa cuốn. Chú Tư Mía bán từ 7 giờ tới 21 giờ — đúng cái tên “Nước Mía 3K” vẫn nằm trong danh sách tiệm từ lâu.',
      'Chạm vào xe hay quán đều mở cùng một thực đơn: ly 3.000₫, ly lớn 5.000₫ — uống tại chỗ thì có động tác khà một hơi, giải khát thật, và tính vào lượng nước mía bán được trong ngày.',
      'Học được cách làm nước mía ở quán với 20.000₫: 1/8 cây mía và một chút đá ra một ly, sơ chế được 8 ly một mẻ. Món này không tự mở theo tay nghề — phải ra quán học mới biết, đúng ý “nghề ở ngoài đời”.',
      'Xin phụ bán một ca 45 phút ở cả hai chỗ: công 14.000₫ cộng thêm theo uy tín, mỗi ngày tối đa 2 ca chia chung cho xe và quán.',
      'Nghề mới: phụ hồ ở công trường Phố Trung Tâm. Cai công trình Anh Sáu Lực đứng ngay chỗ cái biển “công trình thi công” trước đây, có bàn ghi tên, sổ chấm công, ghế và bạt xanh. Một ca 90 phút trả 38.000–52.000₫, ngày nhận 3 ca, làm từ 7 giờ tới 16 giờ và khá hao sức.',
      'Bốn chỗ dựng sẵn mà trước chỉ để ngắm nay đều chạm được: cái tủ lạnh trong nhà trọ (đặt tủ, mở kho lạnh), bàn trà ngoài hè (ngồi nghỉ, nghe chuyện xóm), sàn nhảy của Bin (vô nhảy một bài) và tiệm quần áo (vào lựa đồ, nghe Cô Ngọc kể giá).',
      'Menu ẩn (bấm 8 lần “Cài đặt” rồi gõ mã) nay có nhóm đầu tên “Vừa thay đổi — Lượt 69”: bấm một mục là đứng đúng chỗ và mở sẵn bảng tương tác (xe mía, quán nước mía, chòi công trình, tủ lạnh nhà trọ), kèm một mục đọc con số thật của bản và một mục mở thẳng nhật ký này. Sang bản sau nhóm đó tự đổi theo bản mới, không phải dọn tay.',
      'Thuê nhà theo tháng: bốn chỗ trọ, căn hộ, nhà riêng và cửa hàng có thêm gói tháng 28 ngày, rẻ hơn đóng 4 tuần lẻ đúng 20 % — trọ 896.000₫, căn hộ 2.880.000₫, nhà riêng 4.480.000₫, cửa hàng 5.760.000₫. Đang ở gói tuần vẫn đổi sang gói tháng được, ngày đã trả không mất.',
    ],
  },
  {
    v: 'Lượt 67',
    tag: 'Menu ẩn theo kịp game: 34 chỗ đi nhanh tới đúng người, đứng sát bên họ, dòng “bản mới nhất” đọc từ nhật ký',
    items: [
      'Bấm “Chạy” là đứng sát bên người đó (1,7 m) và quay mặt vào họ. Menu tự tìm chỗ trống quanh đó nên không đặt bạn vào trong cột cầu, quầy hay kệ như trước.',
      'Thêm 21 chỗ đi nhanh còn thiếu: vựa đầu mối Tám Lúa, tạp hoá Cô Ba, quán cơm Bà Tư, nhà thuốc, ngân hàng, cầm đồ, tiệm hớt tóc, tiệm quần áo, nhà trọ, khách sạn, nhà nghỉ, bệnh viện, công an, quán trà đá, chú vá xe, cô hát rong, bé đánh giày, góc nhảy của Bin, chỗ đua xe đạp, quán net, quán cà phê.',
      'Đi nhanh chỉ đổi chỗ đứng, không đổi giờ trong ngày: tới lúc nào thì gặp đúng chuyện lúc đó, y như tự đi bộ ra đó.',
      'Dòng “bản mới nhất” trong menu ẩn đọc thẳng từ nhật ký phát triển, nên nó không còn đứng nguyên ở bản cũ bốn lượt liền; nút khoá cũng ghi đúng “8 lần” thay vì “7 lần”.',
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
];
