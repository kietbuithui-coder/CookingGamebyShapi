# Kế hoạch 6 lượt tiếp theo

Danh sách góp ý của người chơi khá dài (15 mục), trong đó nhiều mục đụng vào cùng một chỗ: sức khoẻ, vòng
đời một ngày của nhân vật, giao diện, rồi mới tới cảnh vật. Làm gộp một lượt sẽ vừa rối vừa khó kiểm, nên
chia thành sáu lượt, mỗi lượt tự chạy được, có kiểm thử và probe riêng, và **không làm hỏng bản lưu cũ**.

Thứ tự dưới đây xếp theo phụ thuộc kỹ thuật và theo mức "chơi là thấy khác":

| Lượt | Nội dung | Vì sao đứng ở vị trí này |
|---|---|---|
| 6 | Sửa lỗi vặt · nút nhảy & đánh · xỉu (mất tiền, mất đồ) · bệnh viện | Đụng vào máu, tiền, đồ — nền của mọi thứ phía sau |
| 7 | Công an, đồn, buồng giam, lao động khổ sai | Cần nút đánh và luật "gây sự" của lượt 6 |
| 8 | Điện thoại (3 mẫu máy, giờ, thu chi, tin nhắn, lướt web) | Gỡ tab thu chi ở góc phải; là cái khung UI cho quán net |
| 9 | Quán net, chơi game, lướt web tăng tinh thần | Dùng lại UI + túi tiền theo giờ của lượt 8 |
| 10 | Ô tô đời 2005–2010 · xe đạp · event đua xe đạp · xích đu công viên | Chỉ là cảnh vật + một event, không phụ thuộc hệ nào |
| 11 | Khuôn mặt & kiểu tóc · lời thoại dễ thương/thô tục · âm thanh cảm xúc · NPC tạp hoá nhỏ | Làm cuối vì phải rà lại toàn bộ nhân vật một lượt |

Đã xong ngay trong lượt này (phần đầu của mục "sửa lỗi vặt"):

- Quán trà đá của cô Thắm dời ra sát lòng đường, không còn chắn quầy tạp hoá Cô Ba.
- Bảng "TRÀ ĐÁ 3.000₫" chuyển từ tường nhà người ta sang cột dựng cạnh bàn.
- Cô Thắm, ông Tư đánh cờ, bé Bo đánh giày hết bay lơ lửng: mỏ neo hạ từ 0,53 m (mặt ghế) xuống 0,13 m,
  vì tư thế ngồi đã tự hạ thân người xuống mặt ghế.

---

## Lượt 6 — Sức khoẻ, xỉu, bệnh viện ✅ đã xong

**Nút nhảy và nút đánh.** Hai nút mới cạnh nút hành động (bàn phím: `Space` nhảy, `F` đánh). Nhảy có ích
để vượt vũng nước/ổ gà, đánh có hồi chiêu 0,9 giây và chỉ ăn khi đứng sát.

**Đánh ai thì có chuyện.** Đánh người đi đường: họ né, la lên, mất thiện cảm, uy tín giảm; đánh liên tiếp
thì họ bỏ chạy và (lượt 7) có công an. Đánh khi đang gây sự với khách quậy thì dập được vụ, được lòng
người xung quanh.

**Máu về 0 thì xỉu.** Không chết hẳn: màn hình tối lại, tua tới sáng hôm sau, và:
- mất một phần tiền mặt theo tỉ lệ (viện phí + "tiền cảm ơn" của người đưa đi cấp cứu), không bao giờ âm;
- rơi lại một phần đồ trong ba lô ở chỗ xỉu (nhặt lại được nếu quay về kịp trong ngày);
- tinh thần và vệ sinh tụt, uy tín giảm nhẹ.
Người chơi nghèo thì vào bệnh viện công: khám miễn phí, nằm hồi sức trừ vào "sổ nợ xã hội" thay vì tiền mặt.

**Bệnh viện Phước An** (một lô mới ở Phố Trung Tâm): ba quầy — khám bệnh (chẩn đoán, tốn 20.000₫), nhà
thuốc trong bệnh viện (thuốc cảm, thuốc đau bụng, bông băng), và phòng hồi sức (nằm theo giờ, hồi máu
nhanh, tốn tiền). Bác sĩ trực có hội thoại riêng, nhắc uống thuốc.

**Kiểm thử:** xỉu không làm tiền âm; viện phí có trần; hồi sức theo giờ hồi đúng số máu; thuốc dùng đúng
bệnh mới có tác dụng; nhặt lại đồ rơi trong ngày.

**Đã làm (lượt 6):** hai nút mới + `Space`/`F`; đấm mất uy tín, người xung quanh nhìn thấy, người đi đường
một nửa quay lại đuổi; ngất thì trả `min(tiền, 30.000₫ + 15%)`, rơi 40% đồ, tỉnh dậy 6 giờ sáng hôm sau
trên giường bệnh viện với 45 máu; bệnh viện có bác sĩ khám (20.000₫), quầy thuốc (cảm 15.000₫, bông băng
8.000₫, thuốc bổ 25.000₫) và phòng hồi sức 5.000₫/giờ; `SAVE_VERSION` lên 5.

Hai chỗ làm khác kế hoạch cho đỡ khó chịu: đồ rơi được giữ ở **quầy thất lạc của bệnh viện** (không phải
nằm ngoài đường chờ nhặt), và người không đủ tiền thì bệnh viện **ghi sổ luôn** chứ chưa có sổ nợ xã hội —
để lượt 7 làm cùng hệ thống công an/phạt.

## Lượt 7 — Công an, tù, lao động khổ sai

Cảnh sát kiểu Việt Nam: một chú công an phường đi tuần theo giờ, một chốt CSGT ở ngã tư (chỉ nhắc nhở,
không phạt người đi bộ), còi và loa phường. Gây sự giữa phố mà bị nhìn thấy, hoặc đánh người ba lần trong
một ngày → bị giữ. Đồn công an là một lô có quầy tiếp dân; buồng giam là không gian nhỏ nhìn ra hành lang,
có giường sắt và cửa sổ. Phạt tiền, hoặc không có tiền thì đi lao động công ích (quét phố, bốc hàng ở bến)
đủ giờ mới được ra. Ra tù thì uy tín thấp, khách quen nhớ mặt một thời gian.

**Kiểm thử:** số lần gây sự mới bị bắt, tiền phạt có trần, lao động đủ giờ thì được thả, bản lưu vẫn nạp được.

## Lượt 8 — Điện thoại

Ba mẫu máy đời 2005–2010 bán ở tiệm Đồ Nghề: cục gạch (nghe gọi, nhắn tin), nắp gập (thêm nghe nhạc,
radio), cảm ứng (thêm lướt web). Mở bằng nút riêng hoặc phím `P`. Trong máy có:

- **Giờ & pin** — pin tụt theo giờ, sạc ở nhà hoặc quán net;
- **Sổ thu chi** — thay hẳn tab thu chi ở góc phải màn hình (tab đó bị bỏ);
- **Danh bạ** — người đã quen, gọi để hẹn (khách quen tới sớm hơn);
- **Tin nhắn** — nhắc nợ, nhắc đóng tiền nhà, tin của khách quen;
- **Giải trí** — nghe nhạc/radio (tinh thần +), lướt web WAP (tinh thần + ít, tốn pin).

**Kiểm thử:** pin không âm, mở máy khi hết pin thì báo, sổ thu chi khớp với sổ trong game, bản lưu cũ tự
được cấp một máy cục gạch.

## Lượt 9 — Quán net

Một quán net 10 máy ở khu dân cư: thuê máy theo giờ, chơi game (tinh thần +, có mini "bắn" đơn giản),
lướt web, xem phim. Có ổ điện sạc nhờ, có quạt, có cô chủ nhắc giờ. Chơi lâu thì mỏi mắt, đói bụng.

**Kiểm thử:** trừ tiền theo phút, tinh thần tăng theo giờ chơi nhưng có trần, máy hỏng thì đóng.

## Lượt 10 — Đường phố 2005–2010

Ô tô đời cũ (Toyota Corolla, Daewoo Matiz, Kia CD5, xe tải nhỏ) chạy chung với xe máy, có tiếng còi và
khói; xe đạp của học sinh và của nhóm con gái trong xóm. **Event đua xe đạp**: chiều chủ nhật ở đường
công viên, đăng ký với nhóm con gái, đua 3 vòng bằng cách bấm nhịp đạp, thắng được tiền và uy tín, thua
thì bị trêu. **Xích đu công viên**: ngồi lên và đu, đu càng lâu tinh thần càng lên, có tiếng gió.

**Kiểm thử:** xe không đè người chơi (đẩy ra như xe máy hiện có), đua có kết quả xác định theo hạt giống,
xích đu có trần tinh thần.

## Lượt 11 — NPC sống động hơn

- **Mặt & tóc**: thêm 4 kiểu tóc (tóc dài, cắt ngắn, cột, hói), thêm râu, kính, mũ bảo hiểm; mỗi nhân vật
  cố định có ngoại hình riêng chứ không trùng.
- **Lời thoại hai giọng**: mỗi nhóm nhân vật có câu dễ thương và câu thô tục, chọn theo tính cách và theo
  việc người chơi vừa làm (đánh họ thì thô, giúp họ thì dễ thương).
- **Âm thanh cảm xúc**: khi xin tiền, NPC đáp bằng tiếng "ừ" ấm hay "hứ" lạnh (WebAudio, không tải tệp).
- **NPC tạp hoá nhỏ**: bánh mì dạo, xe nước mía, cà phê dạo, sữa đậu nành — mua tại chỗ, hồi no/khát/tinh
  thần, rẻ hơn quán cơm.

**Kiểm thử:** mọi NPC có ngoại hình hợp lệ, thoại không trùng, âm thanh không làm sập khi tắt tiếng.

---

## Nguyên tắc chung cho cả sáu lượt

- Mỗi lượt: `tsc` sạch, kiểm thử mới đi kèm, probe không lỗi console, ảnh chụp trước/sau, cập nhật README
  và DESIGN, build `docs/`, một PR riêng.
- Bản lưu: mọi lượt đụng vào `Game` đều phải tăng `SAVE_VERSION` và viết `migrate()` cho bản cũ.
- Không tải tài nguyên ngoài: hình vẽ bằng hình học, tiếng động bằng WebAudio.
