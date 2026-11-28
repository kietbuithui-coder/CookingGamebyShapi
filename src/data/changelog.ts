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
    v: 'Lượt 73',
    tag: 'Đe doạ người lạ (bậc 4 trở lên) đổi tiền lấy mức bị để ý và nguy cơ bị báo công an; sự kiện đánh nhau có cảnh 3D đấm–đỡ–ngã; ba dáng người mới; giao diện gọn kiểu Android với thanh trên cùng và ngăn kéo ☰',
    items: [
      'Bậc 4 trở lên mới có quyền dọa người. Chặn một người giữa đường rồi chọn ba mức: “xin để yên chỗ bán” (30–70 nghìn, nhẹ nhất), “lấy đồ quý” (55–95 nghìn kèm một món đồ quý bán được ở tiệm cầm đồ), “siết nợ người quen” (120–260 nghìn, chỉ đại ca bậc 6 mới dám). Bấm nút ĐE DOẠ trong ngăn kéo ☰, hoặc phím T trên máy tính.',
      'Mỗi lần đe là một vết: mức bị để ý tăng 8–22 điểm, uy tín ngoài phố tụt 3–12, và người trong xóm nghe chuyện nên khách bớt ghé quán. Đe từ ba lần trở lên là có người nhà kéo tới hỏi chuyện.',
      'Bị báo công an là mất thật: người bị đe chạy thẳng ra đồn, phạt tính theo mức bị để ý (đắt hơn án hàng cấm, vì đây là đe doạ người chứ không phải hàng hoá) cộng 6–12 giờ tạm giữ. Đe càng nhiều thì càng dễ bị báo — lần đầu 12 %, tới lần thứ mười là gần 40 %.',
      'Bốn kiểu ẩu đả có cảnh 3D thật: bị úp sọt ở địa bàn băng đối thủ, giang hồ tới đòi nợ (có nợ quá hạn là có người gõ cửa), người nhà của người từng bị mình đe doạ, và băng khác tới phá quán đang bán tốt mà mình không có băng đỡ lưng. Mỗi ngày tối đa một ván, chỉ mở khi đang rảnh tay.',
      'Trong cảnh đánh nhau: hai tới ba đứa xông vào, mỗi đứa là một người dựng bằng hình 3D chứ không phải khối hộp. Ba nút ĐẤM / ĐỠ ĐÒN / LÙI RA — đấm trúng thì đứa đó loạng choạng rồi gục, đỡ thì chỉ mất nửa máu, lùi thì hồi nhẹ máu nhưng chúng dồn nhanh hơn. Hạ hết thì thắng; máu về 0 thì thua.',
      'Ba lựa chọn trước khi đánh, không có cửa miễn phí: đánh tới (thắng được 40–145 nghìn và uy tín trong băng, thua mất 20–26 máu và 6 uy tín phố), bỏ chạy (giữ máu nhưng băng coi là nhát, −8 uy tín), hoặc dàn xếp bằng tiền (150–300 nghìn, không mất máu mà băng cho là hèn).',
      'Ba dáng người mới cho cảnh đánh nhau: ĐỠ ĐÒN (co hai tay che mặt, hơi cúi), TRÚNG ĐÒN (bật ngửa, tay vung, chân loạng choạng) và ĐE DOẠ (chồm tới, một tay chỉ thẳng mặt). Người đấm cũng chồm người tới theo cú đấm chứ không đứng im như tượng.',
      'Giao diện gọn kiểu Android, bật sẵn trên điện thoại: bảy nút nổi ở góc phải gom hết vào một ngăn kéo kéo ra từ mép phải (bấm ☰ ở góc trên), thanh trên cùng hiện tiền và giờ, mỗi nút trong ngăn kéo cao hơn 44 px cho dễ chạm. Điện thoại dọc 390 px trước đây bị bảy nút chiếm gần nửa bề ngang, giờ chỉ còn một nút ☰. Máy tính giữ kiểu cũ; đổi bằng Cài đặt › Giao diện.',
      'Nút Đe doạ nằm trong ngăn kéo, chỉ hiện khi đã là thành viên bậc 4 trở lên — chưa đủ bậc thì không thấy nút, và bấm phím T cũng chỉ hiện lời nhắc.',
    ],
  },
  {
    v: 'Lượt 72',
    tag: 'Băng đảng thành con dao hai lưỡi: khách bỏ đi vì sợ băng, phí chỗ đội thêm, công an để ý mỗi ngày; cảnh đi làm việc có lựa chọn phải trả giá; bốn cách rời băng mà cách nào cũng mất; đụng độ băng đối thủ, đàn em đi theo, và app Sổ băng trên điện thoại',
    items: [
      'Băng đảng giờ có giá thật: theo băng thì khách bớt ghé quán (bậc 1 mất 6% khách, đại ca mất 36%), chủ mặt bằng biết mình có băng thì đòi thêm phí chỗ (tới 60% phí gốc), và mỗi ngày bị công an để ý thêm 1–6 điểm tuỳ bậc. Mấy con số này trừ thẳng vào doanh thu, nên tiền băng kiếm được không còn là tiền chùa.',
      'Mỗi việc của băng giờ có một cảnh kể lại chuyến đi: canh kho lúc ba giờ sáng có hai thằng lạ đi ngang, bốc hàng thì thùng bung ra thấy hàng không nhãn, đi giao thì công an đứng ở ngã tư nhìn theo cái thùng, giữ hàng qua đêm thì có tiếng gõ cửa, đi thu nợ thì người nợ là bà bán tạp hoá biết mình từ hồi còn bán vé số.',
      'Cảnh nào cũng bắt phải chọn: làm tới thì ăn thêm tiền nhưng mất tinh thần, có chuyến mất sức khoẻ và uy tín với phố; rút lui thì không mất tiền nhưng băng coi là nhát và trừ uy tín. Không còn cảnh nào bấm một cái là xong mà không có giá.',
      'Rời băng không còn là nút “rửa tay” miễn phí. Bốn cách: trả nợ máu (mất 400.000₫), phản băng đi khai với công an (không mất tiền nhưng mất 25 uy tín ngoài phố và bị cả xóm nhớ mặt), bỏ đi đổi khu khác bán (mất 800.000₫), hoặc làm ăn thua lỗ để băng tự đuổi (mất nhiều tinh thần nhất). Cách nào cũng mất hết bậc đã gây dựng.',
      'Đụng độ hai phe có thật: từ bậc 3 trở lên, bước sang địa bàn băng đối thủ là bị chặn. Nói chuyện phải phép thì bậc cao được nể, bậc thấp bị khinh; quay đầu thì không ai đụng mà băng mình trừ 10 uy tín; đứng lại thì hai bên xô nhau giữa đường — mất sức khoẻ, bị để ý, uy tín phố giảm, đổi lại băng mình ghi công.',
      'Băng đòi phần thật: từ ngày thứ ba trong băng, mỗi ngày có thể có tin xấu — băng đòi phần tháng, đòi tiền chạy việc, khách quen sợ không dám ghé, hoặc công an gọi lên phường hỏi thăm. Nộp thì mất tiền mà yên, không nộp thì mất uy tín trong băng và bị để mắt.',
      'Bậc 5 dắt được hai đàn em, đại ca dắt ba: đi đông thì tiền công bị chia thêm mà bị để ý gấp rưỡi, đổi lại bị bắt thì đàn em gánh bớt 35% tiền phạt mỗi đứa — và bị bắt là đàn em bỏ đi hết.',
      'Điện thoại có thêm app Sổ băng, chỉ hiện khi đang theo băng: xem bậc, uy tín còn thiếu bao nhiêu, kho hàng cấm, và nhất là mục “cái giá đang phải chịu” — bao nhiêu phần trăm khách bỏ đi, phí chỗ đội thêm bao nhiêu, công an để ý bao nhiêu. Mua hàng và nhận việc vẫn phải ra chỗ đại ca.',
      'Menu ẩn (bấm tám lần nút Cài đặt rồi nhập mã) có thêm mục theo băng để tự thấy mặt trái: mở bảng “cái giá”, mở sẵn một cảnh làm việc để thử hai lựa chọn, và bật thử một tin xấu của băng.',
    ],
  },
  {
    v: 'Lượt 71',
    tag: 'Băng đảng: hai phe đối đầu, sáu bậc thăng chức theo uy tín, năm việc làm trả công theo ca, bốn món hàng cấm kèm án phạt nặng — bị bắt là mất hàng, mất tiền, vào buồng',
    items: [
      'Băng Hẻm Công Nhân (đại ca Hùng Sẹo, sào huyệt trong hẻm xóm lao động) và băng Chợ Cá (đại ca Bà Năm Lửa, sạp cá trong Chợ Xóm Chiều) là hai phe đối đầu. Muốn theo bên nào thì tới nói chuyện với đại ca bên đó, nộp tiền lễ rồi làm việc; đã theo bên này thì bên kia không nhận, và đi ngang địa bàn bên kia cũng bị nhìn mặt.',
      'Theo băng thì lên bậc bằng uy tín chứ không mua bằng tiền: Đàn em mới → Thằng lính → Giữ hàng → Thu nợ → Cánh tay phải → Đại ca. Sáu bậc, mỗi bậc mở thêm việc và món hàng mới, nhưng băng cũng ăn chia phần nhiều hơn — bậc càng cao thì phần mình còn lại càng ít trên mỗi chuyến.',
      'Sổ việc của băng có năm việc, mỗi việc một cái ca riêng: canh kho (30 phút), bốc hàng (chỉ 3–9 giờ sáng, đúng lúc xe về), chở hàng, giữ hàng qua đêm (trả bằng hàng chứ không bằng tiền) và đi thu nợ thuê (chỉ ban ngày). Mỗi việc có số ca tối đa trong ngày, tiền công, mức bị để ý và uy tín khác nhau.',
      'Bốn món hàng cấm: thuốc lá lậu, rượu ngoại, pháo, hàng điện tử trôi nổi. Băng giữ hàng hộ trong kho chứ không bắt mình chở trong túi, và bậc thấp chưa được đụng món nặng.',
      'Hình phạt nặng thật: bị công an khám thấy hàng cấm thì phạt theo giá trị hàng nhân hệ số từng món (pháo nặng nhất), cộng thêm giờ tạm giữ, mất sạch hàng, tụt uy tín trong băng và mất uy tín ngoài phố. Bắt một chuyến pháo là mất hơn tiền lời của ba chuyến giao hàng — nên giữ hàng cấm là chuyện có rủi ro thật, không phải món hời.',
      'Bị khám bất ngờ: đang giữ hàng cấm thì mỗi giờ trong game đều có khả năng bị công an gọi lại, mức bị để ý càng cao thì càng dễ. Hộp thoại hiện rõ số hàng, tiền phạt và số giờ tù trước khi mình chọn nộp, cãi, chạy hay theo về phường.',
      'Xem chi tiết băng ngay trong hội thoại: tên băng, đại ca, địa bàn, bậc đang đứng và cả sáu bậc kèm quyền lợi, phần ăn chia, số chuyến đã làm, kho hàng cấm còn bao nhiêu. Có thêm màn hình “phe phái” nói rõ bên nào giữ đâu và mình đang đứng ở đâu giữa hai bên.',
      'Lên tới Đại ca thì mỗi ngày nhận được tiền bảo kê một góc chợ; ra băng (rửa tay) thì mất toàn bộ uy tín đã gây dựng và mất chỗ đứng trong băng.',
      'Băng đảng có chuyện riêng ngoài đường: đàn em chạy tới kêu đi chuyến gấp, người của băng lại nhắc nộp phần, và băng đối thủ cho đàn em qua dằn mặt quầy của mình. Cả ba đều hiện trong bảng sự kiện của thành phố, và Ông Bảy ở gầm cầu cũng nói được — kèm nút chỉ đường tới đúng chỗ.',
      'Bà Năm Lửa là nhân vật mới, đứng bán cá ở vựa đầu mối trong Chợ Xóm Chiều; Hùng Sẹo ngoài chuyện cho vay nóng nay nói thêm chuyện băng.',
      'Menu ẩn (bấm tám lần nút Cài đặt rồi nhập mã) có thêm mục theo băng ngay tại chỗ: đứng trước mặt đại ca, theo băng, nhận một ca việc, mở sổ hàng cấm và xem bảng sáu bậc.',
    ],
  },
  {
    v: 'Lượt 70',
    tag: 'Ông Bảy nói đúng chuyện đang diễn ra trong phố, nút Góp ý & báo lỗi có chỗ lưu riêng, xe nước mía dời ra sát cổng chợ, quán mía lùi quầy và kê bàn ghế, công trường dỡ mái bạt, khoai lang & xúc xích vẽ lại, mini-game bánh tráng trộn gọn gàng hơn',
    items: [
      'Hàng nút góc phải có thêm nút “Góp ý & báo lỗi”. Bấm vào là một bảng riêng: chọn Báo lỗi / Góp ý / Chuyện khác, gõ điều muốn nói rồi bấm Gửi — góp ý nằm lại trên máy, mở ra đọc lại, sửa, xoá từng cái hoặc xoá hết. Phím G cũng mở bảng này.',
      'Mỗi góp ý tự ghi kèm mã riêng, ngày giờ, chỗ đang đứng, khu phố và bản dựng đang chơi, nên người làm game dựng lại được đúng cảnh mà không phải hỏi lại. Nút “Sao chép hết” gom mọi góp ý thành một khối chữ để dán vào tin nhắn gửi đi.',
      'Xe nước mía dời ra sát cổng trái của Chợ Xóm Chiều, quay mặt vào trong chợ: lối đi chính giữa chợ trống trở lại, không còn tấm biển to chắn ngang tầm mắt dãy sạp. Bảng giá thu về một tấm nhỏ gắn hẳn trên nóc xe bằng hai cọc, nên không còn cảnh biển treo lơ lửng hay thân xe biến mất khi đi xa.',
      'Khoai lang và xúc xích được vẽ lại: khoai lang là củ thon hai đầu, bụng phình, vỏ tím có mắt củ và hai đầu lộ ruột vàng; xúc xích là cây đỏ hồng có nếp gấp ngang trên vỏ và hai đầu bấm kẹp — trước đây cả hai đều là một khúc trụ tròn giống hệt củ cà rốt.',
      'Mini-game bánh tráng trộn làm lại phần hình: topping trên đĩa giờ là đồ ăn thật bày sát đĩa — đậu phộng là hạt có vỏ lụa, rau thơm là ngọn có cuống và lá, chanh là lát mỏng sáu múi, tương ớt là chén sốt có vệt rưới quanh miệng, bánh tráng là nắm sợi nằm ngang. Trước đây gói đậu phộng là cả cái hộp nâu dựng đứng giữa đĩa, còn mẩu gắp được là một khối vuông to rơi vào hộp.',
      'Quán Nước Mía 3K: quầy và máy ép lùi sâu vào trong, mặt tiền để trống nên đứng ngoài đường nhìn thẳng vào là thấy trục ép quay, thấy xô nước. Bàn nhựa kê ngay phía trước quầy, hai bên chừa lối đi ở giữa, ghế xếp quanh bàn và ly đặt sẵn trên mặt bàn — khách mua xong là có chỗ ngồi uống tại chỗ.',
      'Công trường bỏ hẳn mái bạt: tấm bạt sọc xanh–trắng trước đây trông như mái hiên quán ăn mọc giữa công trường nên đã dỡ, cùng bốn cọc chống. Chòi tuyển thợ còn bàn ghi tên, sổ điểm danh, hai ghế chờ, còn bảng “TUYỂN PHỤ HỒ” dán thẳng lên vách rào xanh.',
      'Ca phụ bán nước mía giờ là một cái máy ép thật: canh con chạy trên thanh rồi bấm quay cần đúng vùng xanh mới ra nước, bấm lệch là nước tràn ra ngoài. Rót đủ 6 ly thì hết ca, số ly chuẩn quyết định tiền thưởng.',
      'Ca phụ hồ cũng thành việc thật và dài hơn một phút: ba xe cút kít, mỗi xe năm xẻng. Giữ nút cho kim dâng rồi buông đúng vùng vàng mới được xẻng đất, xúc đủ năm xẻng thì đẩy xe ra chân công trình rồi quay lại xe mới — cả ca khoảng 1 phút 10 giây thời gian thực.',
      'Tấm bảng giá trong quán mía hết lơ lửng giữa quán: trước nó đứng cách vách gần cả mét, nhìn vào cứ tưởng tấm biển treo trên không. Nay bảng áp sát vách, ngang tầm mắt người mua nên vừa đọc rõ, vừa không che máy ép.',
      'Ông Bảy giờ nói được chuyện đang diễn ra: có lễ hội thì ổng chỉ ra Cổng Công Viên, có trận bóng thì chỉ quán cà phê Bóng Đá, chợ lên giá thịt thì nhắc mua trữ, đoàn kiểm tra đi từng quầy thì nhắc dọn quầy, bão tới thì giục tìm chỗ trú. Câu nào cũng kèm nút ghim đường đi tới đúng chỗ đó — hết sự kiện là câu tự biến mất.',
      'Ghế nhựa trong thành phố vẽ lại cho ra cái ghế: mặt ngồi vuông có gờ, bốn chân thon — trước đây là một khối trụ bốn cạnh nên đứng xa nhìn cứ như cái thùng nhựa.',
      'Menu ẩn (bấm tám lần nút Cài đặt rồi nhập mã) có thêm mục cho đúng những thứ vừa sửa: đứng trong quán mía ngó bàn ghế và bảng giá, bày củ khoai với cây xúc xích ngay trước ống kính để soi hình mới, và mở thẳng ván bánh tráng trộn để xem topping bày trên đĩa.',
      'Góc máy trong hai ca làm được chỉnh lại: trước là camera đứng sau lưng hoặc lọt hẳn vào trong thùng xe, màn hình chỉ còn mặt kệ. Nay ca ép mía nhìn chéo qua vai thấy rõ trục ép, xô nước và tay mình; ca phụ hồ đứng lùi trong sân, thấy cả bàn ghi tên lẫn người đang xúc đất. Anh Sáu Lực cũng hết đứng chênh lên mặt bàn — chân đặt xuống đất sau quầy.',
    ],
  },
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
];
