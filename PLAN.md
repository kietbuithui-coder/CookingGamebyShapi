# Kế hoạch 6 lượt tiếp theo

Danh sách góp ý của người chơi khá dài (15 mục), trong đó nhiều mục đụng vào cùng một chỗ: sức khoẻ, vòng
đời một ngày của nhân vật, giao diện, rồi mới tới cảnh vật. Làm gộp một lượt sẽ vừa rối vừa khó kiểm, nên
chia thành sáu lượt, mỗi lượt tự chạy được, có kiểm thử và probe riêng, và **không làm hỏng bản lưu cũ**.

Thứ tự dưới đây xếp theo phụ thuộc kỹ thuật và theo mức "chơi là thấy khác":

| Lượt | Nội dung | Vì sao đứng ở vị trí này |
|---|---|---|
| 6 | Sửa lỗi vặt · nút nhảy & đánh · xỉu (mất tiền, mất đồ) · bệnh viện | Đụng vào máu, tiền, đồ — nền của mọi thứ phía sau |
| 7 | Công an, đồn, buồng giam, lao động khổ sai ✅ | Cần nút đánh và luật "gây sự" của lượt 6 |
| 8 | Điện thoại (3 mẫu máy, giờ, thu chi, tin nhắn, lướt web) ✅ | Là cái khung UI cho quán net |
| 9 | Quán net, chơi game, lướt web tăng tinh thần ✅ | Dùng lại UI + túi tiền theo giờ của lượt 8 |
| 10 | Ô tô đời 2005–2010 · xe đạp · event đua xe đạp · xích đu công viên ✅ | Chỉ là cảnh vật + một event, không phụ thuộc hệ nào |
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

## Lượt 7 — Công an phường, tạm giữ, lao động khổ sai ✅ đã xong

**Mức bị để ý.** Mỗi cú đấm cộng 18 điểm "bị để ý" (0–100), mỗi phút trong game tự nguôi 0,25 điểm. Từ 45
điểm thì công an phường bắt đầu để mắt: một chú từ nút đường gần đó đi thẳng tới, gọi lại hỏi giấy tờ.

**Xử lý tại chỗ.** Bốn lựa chọn: nộp phạt hành chính (60.000₫ + 900₫ mỗi điểm bị để ý + 40.000₫ mỗi lần đã
vào phường), cãi (40% được tha), bỏ chạy (45% thoát, trượt thì thêm điểm), hoặc đi theo chú về phường.

**Đồn Công an phường.** Một lô mới ở block 12S: biển xanh, băng đỏ, cột cờ, hòm thư góp ý, ghế nhựa ngoài
sân; trong nhà có bàn tiếp dân (chú Tám trực 24/24), tủ hồ sơ, bình nước, quạt trần, bảng tin, bảng nội quy;
vách ngăn có cửa song sắt dẫn vào **buồng tạm giữ** — hai giường sắt, chiếu cói, xô nước, cửa sổ song sắt,
một đống gạch và cây búa.

**Trong buồng.** Án 2–12 giờ tuỳ mức bị để ý và số lần tái phạm. Đập đá một giờ thì bớt một giờ (sàn còn 30
phút) nhưng mất máu, năng lượng, vệ sinh, tinh thần; nằm giường sắt thì chờ. Ra tù: uy tín −8, tinh thần
−10, vệ sinh −18, thả trước cửa đồn.

**Chưa làm trong lượt này:** chốt CSGT ở ngã tư, còi và loa phường, lao động công ích ngoài đường (quét
phố, bốc hàng ở bến) — để dành cho lượt sau khi có xe cộ.

**Kiểm thử:** `tests/police.test.ts` — 12 bài: mức bị để ý tăng/nguôi/ngưỡng gọi công an, tiền phạt theo mức
và tái phạm, nộp phạt không âm tiền, cãi được thì chỉ bị nhắc, án theo mức và tái phạm, đếm ngược trong
buồng, đập đá bớt giờ nhưng không dưới 30 phút, ra tù mất uy tín, bản lưu v5 nâng lên v6.

## Lượt 8 — Điện thoại ✅ đã xong

**Ba mẫu máy** bày trên tủ kính giữa tiệm Đồ Nghề: **cục gạch** 180.000₫ (sổ thu chi, danh bạ, tin nhắn),
**nắp gập** 520.000₫ (thêm radio, nghe nhạc), **cảm ứng** 1.450.000₫ (thêm lướt web WAP). Mua máy mới thì máy
cũ tự bán lại; bán máy thì mất sim.

**Mở máy** bằng nút trên HUD (chỉ hiện khi đã có máy) hoặc phím `P`. Sáu thẻ: Máy · Sổ thu chi · Danh bạ ·
Tin nhắn · Giải trí · Pin & sạc.

- **Giờ & pin:** pin tụt 2,2%/giờ trong game khi để trong túi, tốn thêm khi nghe nhạc/radio/web. Sạc đầy khi
  ngủ ở chỗ trọ trở lên (có ổ điện), hoặc sạc nhờ 5.000₫ ở tạp hoá Cô Ba / MiniMart. Hết pin thì khoá máy.
- **Sổ thu chi:** đúng bảng của sổ tay. Sổ giấy vẫn giữ trong sổ tay — người chưa có máy không bị mất bảng.
- **Danh bạ:** người đã quen + khách quen; gọi khách quen 1.000₫ một lần mỗi người mỗi ngày, thân thêm.
- **Tin nhắn:** nhắc nợ (kèm số ngày trễ), nhắc tiền phòng, tin khách quen, tin lừa “trúng thưởng xe Wave”,
  dự báo thời tiết 1080. Chưa đọc thì có chấm đỏ trên nút điện thoại.
- **Giải trí:** radio (15 phút, +6 tinh thần), nhạc (15 phút, +8), WAP (10 phút, +5).

**Khác kế hoạch:** không gỡ tab thu chi khỏi sổ tay giấy (bỏ đi thì người chưa có máy mất luôn bảng thu chi);
tab *Giờ & pin* gộp thành thẻ **Pin & sạc**; quán net để lượt sau.

**Kiểm thử:** `tests/phone.test.ts` — 13 bài: ba mẫu máy và chức năng, mua/bán máy đổi sim, pin tụt và khoá
máy khi hết pin, máy thiếu chức năng thì không dùng, chỉ nhà có điện mới sạc qua đêm, tin nhắn dựng đúng
(nợ, tiền phòng, tin lừa, thời tiết), đếm tin chưa đọc, danh bạ lọc người quen, gọi khách quen (cước, giới
hạn ngày, hết pin, thiếu tiền), bản lưu v6 lên v7.

## Lượt 9 — Quán net ✅ đã xong

Quán **NET HẢI ANH** dựng ở Khu Dân Cư, mặt tiền 9,5 m, mở 6h–23h: hai dãy bàn sát tường, 10 máy CRT (một
máy dán giấy *MÁY HỎNG*), ghế nhựa, quạt trần, poster game, bảng nội quy, quạt cây, bình nước nóng lạnh, thùng
lon. Quầy thu tiền có két, xấp thẻ máy, bảng **3K/1H**; tủ nước ngọt bên phải cửa; dãy ổ điện **SẠC NHỜ 2K**.
Ngoài đường có bảng giá 3.000₫/giờ và giờ mở cửa, ô cửa sổ song sắt nhìn vô thấy máy sáng đèn.

- **Thuê máy:** 3.000₫/giờ tính theo phút (làm tròn 500₫), xem phim thêm nửa giá. Bốn gói 30 phút · 1 tiếng ·
  2 tiếng · 4 tiếng, trả trước, hộp thoại ghi rõ được gì mất gì.
- **Hiệu ứng:** chơi game +9 tinh thần/giờ (mau đói khát), lướt web +5 (nhẹ người), xem phim +13. Ngồi quá
  120 phút một ngày là **mỏi mắt**: chỉ còn 45% tinh thần và mất 2 sức khoẻ, sang ngày mới tính lại.
- **Dịch vụ phụ:** sạc nhờ điện thoại 2.000₫ (chờ 20 phút, đầy pin — dùng lại hàm sạc của lượt 8), nước ngọt
  8.000₫/lon.
- **Người:** chị Hạnh giữ quầy (hai câu chuyện về quán), thằng Bi 16h–22h và con Nhung 18h–22h30 ngồi máy,
  nói chuyện được. Chạm máy 04 (ghế trống) cũng mở bảng dịch vụ.

**Khác kế hoạch:** không làm mini-game "bắn" riêng — chơi máy là một lượt ngồi có tính giờ, giống cách quán
cà phê và tiệm hớt tóc đang chạy; phần "chơi lâu thì mỏi mắt" thay cho mini-game để giữ đúng nhịp của game.

**Kiểm thử:** `tests/net.test.ts` — 11 bài (giá theo phút và phụ thu phim, bốn gói giờ, hiệu ứng từng kiểu chơi,
mỏi mắt sau 120 phút và tính lại sang ngày, ngồi máy làm đói khát tụt sức, trần tinh thần 100, giờ mở cửa và
số máy, sạc nhờ/nước ngọt, lô đất và ba nhân vật, bản lưu v7 → v8).

## Lượt 10 — Đường phố 2005–2010 ✅ đã xong

**Ô tô đời cũ** chạy chung dòng xe: Toyota Corolla, Daewoo Matiz, Kia CD5 và xe tải nhỏ — thân hộp vuông, kính
tối, bánh nhỏ, đèn trước vàng / đèn hậu đỏ. Chiếm 26% dòng xe nhưng luôn có ít nhất một chiếc, chạy làn ngoài,
chậm hơn xe máy (xe tải 4,2–5,6 m/s), nhả khói sau pô và bấm còi khi người chơi đứng gần lòng đường.

**Đua xe đạp chủ nhật** ở đường trước cổng công viên: vạch xuất phát kẻ ô caro + dãy cọc, bảng *ĐUA XE ĐẠP —
chủ nhật 15h · đăng ký tại đây*, con Lan đứng chờ. Đăng ký mất 5 phút và 12% sức (mỗi ngày một lượt, chỉ chủ
nhật 15h–17h30). Vào đua: ba vòng, chín nhịp, mỗi nhịp con chạy quét qua vùng xanh trong 1,55 giây — bấm **ĐẠP**
đúng giữa vùng ăn 1,0 điểm, lệch ra mép 0,45, trượt 0. Camera chạy dọc đường theo tiến độ, con Lan đạp bên
cạnh (sức cố định theo hạt giống). Thắng: 40.000₫, +2,5 uy tín, +14 tinh thần; thua: +0,5 uy tín, +5 tinh thần
và bị trêu. Bấm **Bỏ dở** thì chỉ mất năm phút đăng ký.

**Xích đu công viên**: ba mức 10/20/40 phút, miễn phí, +8/+14/+21 tinh thần, có trần nên không cày được bằng
xích đu.

**Khác kế hoạch:** xe đạp của học sinh đã có sẵn trong dòng xe từ lượt 2 nên không làm lại; phần "đua 3 vòng"
dùng đường thẳng trước cổng công viên (một chiều 38 m) thay vì vòng quanh hồ, cho camera chạy liền mạch không
phải cắt cảnh.

**Kiểm thử:** `tests/street.test.ts` — 12 bài: bốn mẫu ô tô và tốc độ chậm hơn xe máy, chín nhịp đua tất định
theo hạt giống, chấm điểm giữa vùng / mép / trượt, sức đối thủ, thắng–thua–hoà và tiền thưởng, chỉ chủ nhật
và đúng khung giờ, mỗi ngày một lượt, bản lưu v8 → v9, xích đu ba mức và giờ mở cửa.

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
