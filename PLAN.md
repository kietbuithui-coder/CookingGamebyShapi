# Kế hoạch các lượt

> Những gì **chưa** làm thì gom ở `TODO.md`.

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
| 11 | Khuôn mặt & kiểu tóc · lời thoại dễ thương/thô tục · âm thanh cảm xúc · NPC tạp hoá nhỏ ✅ (lượt 14: 16 biểu cảm + 8 kiểu tóc) | Làm cuối vì phải rà lại toàn bộ nhân vật một lượt |

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

## Lượt 11 — NPC sống động hơn ✅ đã xong

**Lịch sinh hoạt.** Mỗi người đi đường có kế hoạch ba chỗ theo nhóm và theo giờ (`src/sim/life.ts`): công nhân
sáng ra chợ – tan ca ghé quán, học sinh sáng tới trường – chiều ra quán vặt và công viên, người lớn tuổi quanh
quẩn ghế đá, vô gia cư tối về gầm cầu. Trọng số điểm đến nhân theo giờ nên chợ đông buổi sáng, quán đông buổi
trưa, công viên đông lúc chiều tối.

**Giờ cao điểm.** 6h24–8h12 và 16h18–18h18 đi nhanh 1,3 lần; sau 22h chậm 0,9 lần.

**Chào hỏi.** Đi ngang trong 5,2 m thì chào: quen mặt (đã nói chuyện, uy tín > 6) → mưa → nóng/lạnh → buổi
trong ngày. Nói chuyện xong thì nhớ mặt.

**Mưa nắng, đi cặp, ghế đá.** Mưa thì che dù; một phần ba số người đi thành cặp vừa đi vừa nói chuyện; chiều tối
ra công viên thì tìm ghế trống ngồi, hết ghế mới đứng.

**Hàng xóm xem đua.** Vào cuộc đua xe đạp có bốn người đứng xem ở vỉa hè đối diện, về đích thì cổ vũ hoặc trêu.

**Cân bằng lại quán net.** Chơi game +18 tinh thần (cũ +9), −2 sức (cũ −4), −3 no (cũ −7), −4 nước (cũ −8);
lướt web +12 / 0 / −1 / −2; xem phim +22 / −1 / −2 / −3. Mỏi mắt sau 120 phút chỉ còn 70% tinh thần và −1 sức
khoẻ (cũ 45% và −2).

**Sửa lỗi kèm theo.** Bàn cờ Ông Tư dời khỏi ghế đá (52,2, −56,9); biển hiệu tự teo lại nếu mép cắm vào
tường/cột; người chơi tự bò ra khỏi vật cản nếu lỡ kẹt (hết cảnh camera trong tường).

**Kiểm thử:** `tests/life.test.ts` 5 bài + cập nhật `tests/net.test.ts` (thêm bài cân bằng mới) — tổng 226 bài /
15 tệp.

## Lượt 12 — Giao diện dễ đọc, giao hàng có người nhận ✅ đã xong

Mười góp ý của người chơi, gần hết là chuyện nhìn – chạm – đọc trên điện thoại; chỉ hai mục đụng vào
luật chơi (tiền) và cảnh vật.

**Sửa xe không có xe vẫn trừ tiền.** Chỗ chú Hậu trước đây bán "bơm bánh xe" 2.000₫ cho cả người đi bộ,
và "vá bánh, bơm hơi cho quầy" 8.000₫ cho cái quang gánh tre. Nay chỉ sửa cái đang có: có gánh tre thì
*chằng lại đòn gánh, vá thúng* 4.000₫ (+15% độ bền); có xe đẩy (bậc 2) mới có *vá bánh, bơm hơi* 8.000₫
và *bơm bánh* 2.000₫. Chưa có gì thì cả hai mục khoá, ví không hao một đồng.

**Gợi ý cho biểu tượng.** Rê chuột (máy tính) hay chạm (điện thoại) vào sáu thanh trạng thái, đồng hồ,
thời tiết, khu phố, tiền, uy tín, mức bị để ý, nợ và bốn nút góc phải đều hiện một câu giải thích ngay
dưới biểu tượng — ví dụ *"Vui vẻ: tinh thần — thấp thì nấu kém, khách bỏ đi"*. Chạm thì hiện 2,6 giây
rồi tự tắt, không che màn hình.

**Chữ to hơn một chút.** Số tiền bay cạnh nhân vật (nhận tiền, bị trừ tiền) từ 1,15 lên 1,5 em; bong
bóng thoại của người đi đường từ 1,05 lên 1,14 em; thông báo (kể cả câu từ chối) từ 0,92 lên 1,02 em.
Vẫn nhỏ đủ để HUD không choán màn hình.

**Cỡ giao diện.** Thanh trượt trong Cài đặt giờ chạy 70–160% (trước 80–140%), có nhãn phần trăm, có ô
xem trước ngay dưới (một chip, một thanh trạng thái, một nút) nên kéo là thấy đổi liền dù bảng cài đặt
đang che HUD. Mọi thứ trong `#ui` đều dùng đơn vị `em` nên chữ, nút, thanh trạng thái to nhỏ cùng nhau.

**Sổ tay công thức gọn.** Từ bốn dòng chữ mỗi món xuống một dòng: tên + loại + nguyên liệu + giá bán.
Chạm vào dòng mới mở chi tiết (số lượng từng thứ, dụng cụ, các bước sơ chế / nấu, số phần đã bán). Cả
danh sách 60 món đọc lướt được trong một màn hình.

**Chỗ giao hàng có người nhận.** Nhận đơn ở bảng tin xong là có người đứng chờ sẵn trước cửa nhà nhận,
hai chồng kiện hàng các-tông bên chân, nói một câu ("Hàng tới rồi hả?", "Chờ nãy giờ đó!"). Người này
không bị dọn theo khoảng cách như người đi đường. Cột sáng vàng có thêm vòng sáng dưới chân, còn chip
chỉ đường đổi sang màu đỏ có biểu tượng thùng hàng và số mét — nhìn từ xa là biết đang đi giao.

**Cô Hồng dời qua bên kia bức tường đỏ.** Từ vỉa hè ngay trước cổng chợ (chắn lối vào) sang bên trái
tường, trong cổng chợ một quãng: vẫn thấy từ ngoài đường, không còn che cổng.

**Gánh thay cho "Quang gánh".** Tên món trong túi đồ, câu hướng dẫn mở đầu và lời chỉ dẫn của chủ tiệm
đều gọi ngắn là **GÁNH**.

**Ô mục tiêu thu gọn được.** Thêm nút tròn `–` / `+` ở góc phải ô "MỤC TIÊU" (chạm cả ô vẫn thu gọn
như trước). Thu gọn xong chỉ còn một viên nhỏ, không che tầm nhìn khi đang dựng quầy.

**Bước tiếp theo của kế hoạch — âm thanh cảm xúc (phần đầu).** Người đi đường mở miệng là có tiếng nói
thật: ba tiếng ngắn, cao độ tính theo giới và tầm vóc (`voicePitch` trong `src/sim/life.ts`: nữ ~236 Hz,
nam ~152 Hz, trẻ con cao hơn, người lớn tuổi trầm hơn), ngữ điệu đổi theo biểu cảm — vui thì vút lên,
đang gắt thì giọng sắc hơn. Chỉ phát khi người chơi ở trong 22 m, mỗi 0,4 giây một lần để không rối.

**Kiểm thử:** thêm một bài cho `voicePitch` (nữ > nam, nhỏ con > tầm vóc lớn, luôn nằm trong 100–320 Hz)
— tổng **227 bài / 15 tệp**. Probe `tools/probe/steps/ui.mjs` kiểm từng mục: mục sửa xe khoá đúng ba
trường hợp (không có gì / có gánh / có xe đẩy), gợi ý hiện đúng câu, cỡ giao diện 80–150%, sổ tay còn
một dòng mỗi món, nút thu gọn mục tiêu, người nhận hàng xuất hiện và biến mất sau khi giao.
## Lượt 13 — Bậc 4: quán ăn nhỏ có chỗ ngồi ✅ đã xong

Bốn bậc kinh doanh còn lại trong kế hoạch (quán ăn nhỏ · quán có chỗ ngồi · nhà hàng bình dân · chuỗi cửa
hàng) làm mỗi lượt một bậc. Lượt này xong **quán ăn nhỏ**.

**Mua và dựng.** Tiệm Đồ Nghề Ba Tài bán thêm **Quán ăn nhỏ — 24.000.000₫** (phải có sạp cố định trước,
như luật cũ của các bậc). Mua xong quầy về trạng thái xách tay: phải tìm **mặt bằng có sân** mới dựng được.
Hai mặt bằng mới nằm trong dãy nhà (lô trống 9 m và 8 m, chen giữa ngân hàng – chỗ bán Phố Văn Phòng và
quán cà phê – chung cư Khu Căn Hộ):

| Mặt bằng | Phí/ngày | Khách |
|---|---|---|
| Mặt bằng Phố Văn Phòng | 160.000₫ | dân văn phòng, hệ số khách 1,45 |
| Mặt bằng Khu Căn Hộ | 120.000₫ | khách ăn sáng – trưa, hệ số 1,3 |

Đứng ở vỉa hè hẹp (Cổng Chợ, Hẻm Công Nhân…) mà dựng quán thì bị chặn kèm lời nhắc tìm mặt bằng — bậc 4
không chen vô chỗ 1,5 m.

**Quán trông thế nào.** Quầy gỗ dài 4,4 m, mặt bàn đá, mái tôn xanh 5,2 m có băng-rôn vàng, hai cột chống,
bảng hiệu chạy ngang ghi món. Phía trước là **hai bàn nhựa, bốn ghế** (xanh–đỏ) đặt trong sân.

**Khách ngồi ăn tại chỗ.** Hàng đợi của bậc 4 có 9 chỗ nhưng **bốn chỗ đầu là ghế**: khách được xếp vô bàn
trước (`freeSlot` ưu tiên ghế), đi tới là **ngồi xuống** (tư thế `sit`), kiên nhẫn ×1,5 (so với ×1,3 khi có
bàn ghế nhựa thường), và không bị trừ kiên nhẫn vì mưa khi đã có mái. Hết ghế mới đứng xếp hàng phía trước,
lùi ra sau bàn ghế 3,6 m.

**Sức chứa.** 150 kg (sạp 90), giữ lạnh 55 kg, bày **16 món**, 9 khách một lúc, 32 khay. Mái che luôn có
sẵn nên mưa không ai dỡ hàng; phí mặt bằng tự trừ đầu ngày như sạp.

**Kiểm thử:** `tests/stall.test.ts` thêm 4 bài — bậc 4 rộng hơn sạp ở cả 6 chỉ số và đòi đúng hai mặt bằng
(phí ≥ 100.000₫, không chỗ nào đòi quá bậc 4); tiền thuê ngày đúng bằng phí mặt bằng, thiếu tiền thì treo
cờ nợ; mua quán thì quầy về xách tay, phải dựng lại; thiếu tiền thì không đổi bậc. Tổng **231 bài / 15 tệp**.
Probe `tools/probe/steps/quan.mjs`: mua sạp → mua quán → bị chặn ở Cổng Chợ → dựng ở Khu Căn Hộ → 4 khách
vô ngồi (3 chỗ `sit`) → giao món có tiền → `stallRent` khớp phí mặt bằng; 144 lô, không sinh lô hẹp mới.

**Còn lại của nhánh kinh doanh:** quán có chỗ ngồi (bậc 5), nhà hàng bình dân (bậc 6), chuỗi cửa hàng (bậc 7).
Hướng làm: bậc 5 thêm người phụ bán và thực đơn theo buổi, bậc 6 có nhân viên + đặt bàn, bậc 7 mở điểm thứ hai.

## Lượt 14 — Con người & nhân vật: biểu cảm, kiểu tóc, người phụ việc ✅ đã xong

**Mười sáu biểu cảm.** Atlas mặt nới từ 8 × 8 lên **16 × 8** ô. Tám cột mới: cười mỉm, nháy mắt, buồn ngủ
(mí sụp + chữ “z”), đau (mắt nhắm tịt kiểu X + mồ hôi), sợ (mắt mở to, mồm há, hai giọt mồ hôi), khinh (mí
sụp, liếc bên), ăn ngon (mắt cong, mồm nhai, má hồng), phồng má hờn (má căng, môi chu). Tên biểu cảm nằm
trong `src/data/expr.ts` để không còn số trần rải khắp nơi; `Npc.say` cũng chọn giọng đọc (giận/vui/thường)
theo bảng đó, nên biểu cảm mới không bị đọc giọng giận như trước.

Gắn vào việc đang diễn ra: chào người quen cười mỉm, mưa càu nhàu, nắng nóng/khuya buồn ngủ, lạnh phồng má,
ăn đấm nhắn mặt, khách bỏ đi vì giá cười khẩy, khách chấm ≥ 4,7★ thì vừa nhai vừa gật.

**Tám kiểu tóc** (thêm xoăn, đuôi ngựa, húi cua, tém ngang vai) và chia lại cho 14 nhóm người đi đường; nữ
không còn bị gán kiểu hói, nam không còn bị gán đuôi ngựa.

**Người phụ việc ở quầy.** Người chơi dặn: chỉ xuất hiện khi quán **đã có doanh thu** và **sau một thời
gian**. Luật `helperGate` trong `src/sim/rules.ts` kiểm ba điều: bậc quầy ≥ 2 (xe đẩy trở lên), tổng doanh
thu bán hàng ≥ 250.000₫, và đã bán qua ≥ 2 ngày (`flags.firstSale` ghi ở lần bán đầu tiên). Đủ cả ba thì mới
thỉnh thoảng có người đi tới xin việc (240–420 giây một lần, chỉ khi quán đang mở và người chơi đứng gần);
hộp thoại có lời chào, lời xin việc riêng của từng ứng viên (5 người, lương 55.000–70.000₫/ngày, trả trước
một ngày) và hai lựa chọn nhận / hẹn sau.

Đang làm thì người phụ đứng cạnh quầy phía người bán, khách chờ lâu hơn **×1,3**, quầy bớt bẩn, và nói
chuyện theo tình huống với biểu cảm đi kèm (khách quậy → sợ, quầy bẩn → khó chịu, khách đông → vui, khuya →
buồn ngủ, doanh thu cao → rất vui, người chơi mệt → phồng má). Chạm vào để hỏi chuyện bán buôn, dặn dò, hoặc
cho nghỉ. Sáng hôm sau trừ lương; thiếu tiền thì họ xin nghỉ. Đóng quầy thì họ về.

**Bản lưu v10**: thêm `Game.help`; `migrate()` bỏ dữ liệu hỏng và ghi mốc `firstSale` cho bản lưu cũ đã bán
được hàng.

**Kiểm thử:** `tests/helper.test.ts` 16 bài (điều kiện theo doanh thu/ngày/bậc, doanh thu cộng dồn nhiều
ngày, ứng viên tất định, trả lương đầu ngày, hết tiền thì nghỉ, cho nghỉ, bản lưu v10). Tổng **247 bài / 16 tệp**.
Probe `tools/probe/steps/nguoi.mjs`: chụp atlas 16 biểu cảm, 8 kiểu tóc xếp hàng, ba mức của `helperGate`,
hộp thoại xin việc, nhận việc (trừ đúng 58.000₫), trò chuyện và câu nói theo tình huống.

**Còn lại của mục “Con người & nhân vật”:** tuỳ biến ngoại hình người chơi (cần gương ở nhà hoặc góc nhìn thứ
ba vì game đang ở góc nhìn thứ nhất), bộ thoại riêng cho từng nhân vật cố định, phản ứng khi người chơi
giàu/nghèo/bị công an để ý.

## Lượt 15 — góc nhìn thứ ba, tiệm cắt tóc, tiệm thời trang

Người chơi dặn: "làm góc nhìn thứ ba, khó thì để đó", và "làm luôn tiệm cắt tóc để cắt các kiểu vừa rồi với
tiệm thời trang, có sẵn thì tận dụng luôn". Góc nhìn thứ ba hoá ra không khó, vì `Rig` dựng người đi đường đã
có sẵn cả 8 kiểu tóc và bảng màu — chỉ cần một `Rig` riêng cho người chơi và một nhánh camera lùi sau lưng.

**Ngoại hình thành dữ liệu.** `src/data/looks.ts`: `PlayerLookData`, ba bảng bán (`HAIR_STYLES`, `HAIR_COLORS`,
`SHIRT_COLORS`, `PANTS_COLORS`, `SHOE_COLORS`, `GLASSES`), `defaultLook(fem)` và `cleanLook(raw, fem)`.
`Game.look` nằm trong bản lưu v11; `migrate()` cấp bộ đồ mặc định cho bản lưu cũ, `cleanLook()` kẹp lại nếu hỏng.

**Góc nhìn thứ ba.** `Player` có `rig`, `look`, `applyLook()`, `syncCarry()`, `toggleView()`. Camera lùi 3,0 m
(1,2 m nữa khi đẩy xe đạp, 0,35 m khi gánh), dò tường để nép lại, dưới 2,0 m thì giấu nhân vật. Phím **V** hoặc
nút trong Cài đặt; `Settings.cam3` được lưu lại. Góc nhìn thứ nhất vẫn là mặc định nên lối chơi cũ không đổi.

**Hai tiệm trong chợ Xóm Chiều.** Chú Bảy Kéo cắt tóc ở lối đi giữa hai dãy sạp (x ≈ −45,5 / z ≈ 8,2): ghế sắt,
gương, bàn đồ nghề, thùng nước, biển "CẮT TÓC 15.000₫"; bán 8 kiểu tóc và 4 màu nhuộm. Cô Ngọc bán quần áo ở
cùng dãy, phía nam (z ≈ −8,2): giá treo áo, bàn gấp đồ, khay kính, khay giày; bán áo (6 màu), quần (5 màu),
giày (3 đôi), kính (cận / đen). Cả hai dùng chung `Acts.buyLook()`: trừ tiền, ghi `g.look`, `applyLook()` ngay,
+4 tinh thần, 15 phút. Ghế cắt tóc còn là chỗ ngồi nghỉ.

**Bản lưu v11**: thêm `Game.look`; cài đặt thêm `cam3`.

**Kiểm thử:** `tests/look.test.ts` 13 bài (bảng giá, mặc định nam/nữ, `cleanLook` với dữ liệu rác, bản lưu
v10 → v11, hai người bán mới). Tổng **260 bài / 17 tệp**. Probe `tools/probe/steps/nguoi3.mjs`: bấm V ở bờ kè,
tiệm cắt tóc và tiệm thời trang trong chợ, menu kiểu tóc, uốn xoăn trừ đúng 45.000₫, mua áo đỏ + quần xanh bò +
kính đen, và ngoại hình vào bản lưu v11 — chạy cả desktop 1500×820 lẫn mobile 844×390.

## Lượt 16 — Bậc 5: quán có chỗ ngồi, thực đơn theo buổi, gọi thêm món ✅ đã xong

Tiếp nhánh kinh doanh sau bậc 4 (quán ăn nhỏ): mở **bậc 5 — Quán có chỗ ngồi** (`quanngoi`, 58.000.000₫ ở tiệm
Đồ Nghề Ba Tài, cần có quán ăn nhỏ trước). Lúc làm lượt này `FUTURE_TIERS` còn 2 bậc; hiện chỉ còn `Chuỗi cửa hàng`
(bậc 6 đã xong trong mã, xem mục 4.26 của `DESIGN.md`).

**Chỉ số và mặt bằng.** Chứa 200 kg, giữ lạnh 70 kg, bày **20 món**, 12 khách cùng lúc, 40 khay, độ thu hút 1,6.
Dựng tại hai mặt bằng có sân (`matbang_tb` Phố Văn Phòng 160.000₫/ngày, `matbang_dc` Khu Căn Hộ 120.000₫/ngày).

**Mô hình quán.** Quầy gỗ dài 5,6 m mặt đá + yếm đỏ, hiên mái tôn xanh 6,9 × 5,9 m có diềm vàng, vách thấp hai
bên, hai bồn cây phía trước chừa lối vào rộng ở giữa, nền **gạch bông ca-rô đỏ–kem**, quầy thu ngân nhỏ bên hông,
và **ba bàn gỗ – sáu ghế tựa lưng** (trên bàn có hộp khăn giấy và chai nước tương). Bộ bàn nhựa rời (`ghe`) tự ẩn
khi đã lên bậc 5.

**Sáu ghế ăn tại chỗ & hàng đợi ngoài hiên.** `seatCount(tier)` trả về 6 cho bậc 5 (4 cho bậc 4), `dineIn(tier)`
bật từ bậc 5. Sáu chỗ đầu (`SEATS5`) ngồi vào ba bàn gỗ (`pose = 'sit'`), kiên nhẫn **×1,9**; khách thứ 7 trở đi
xếp hàng ngoài hiên (`lz = 5,4 m`) để không đứng chen giữa bàn ăn.

**Thực đơn theo buổi.** Bốn buổi (`PERIODS`: *Buổi sáng*, *Buổi trưa*, *Buổi chiều*, *Khuya*) tính từ `mealSlot(h)`.
Món hợp buổi (`fitsPeriod(dish, h)` khi `dish.hours[slot] ≥ 0,8`) được nhân **×1,35** sức hút ở quán `dineIn`, và
`decide()` chọn món theo xác suất có trọng số (`w³`) thay vì chọn cứng `argmax` nên vừa tăng rõ tỉ lệ bán món hợp
buổi (~+5 điểm phần trăm), vừa giữ đa dạng thực đơn. Bảng Quầy hiện nhãn xanh **`hợp buổi này`** / vàng **`ngoài buổi`**
trên từng món và hiện số ghế, buổi đang bán, số món hợp buổi trong thẻ Thông tin.

**Khách gọi thêm món (`secondOrder`).** Khách ngồi ghế ở quán bậc 5, sau khi ăn món đầu hài lòng (`stars ≥ 3,8`),
có 32–54% cơ hội ngồi lại gọi thêm một món **nước uống** hoặc **tráng miệng** (`drink` / `sweet`) đang bán và còn
nguyên liệu (`o.more = true`, kiên nhẫn ×1,8 × `helperPatience`, câu thoại riêng trong `LINES.order_more`). Giao
xong món thứ hai khách mới đứng dậy về.

**Kiểm thử:** `tests/quanngoi.test.ts` 18 bài — lúc đó tổng **278 bài / 18 tệp**; hiện là **377 bài / 27 tệp**. Probe `tools/probe/steps/quanngoi.mjs`:
mua `sap → quanan → quanngoi` ở tiệm Ba Tài → dựng ở Mặt bằng Khu Căn Hộ → mở bán, 6 khách ngồi vào 3 bàn gỗ trên
nền gạch bông ca-rô → giao món cho 4 khách, khách ngồi lại gọi thêm trà đá (`more: true`) → bảng quầy hiện nhãn
`hợp buổi này` / `ngoài buổi` → đóng quán, kiểm bản lưu v11 giữ nguyên bậc 5 và 6 ghế.

---

## Lượt 17 — Bậc 6: nhà hàng bình dân (mã đã xong, ghi chép bổ sung sau)

Bậc 6 (`nhahang`, 145.000.000₫ ở tiệm Đồ Nghề Ba Tài, cần quán có chỗ ngồi trước) đã nằm trong mã cùng 17 bài
kiểm thử của `tests/nhahang.test.ts`, nhưng chưa có mục kế hoạch riêng. Tài liệu chi tiết nay ở **`DESIGN.md` mục 4.26**:
chứa 280 kg · giữ lạnh 100 kg · 26 món · 16 khách · 56 khay, 8 ghế trong nhà kín, không mất khách vì mưa/tối,
tối đa 2 phục vụ + 2 phụ bếp, phụ bếp tự sơ chế/ra món phụ, đặt bàn trước (cọc 12.000₫/người, trần 4 phiếu, lỡ hẹn
−0,5 uy tín) và khách đoàn 3–4 người gọi chung một lượt.

**Còn lại của bậc 6:** chạy probe giao diện thật (`tools/probe/steps/nhahang.mjs`) ở cả 844×390 và 390×844 — hiện mới
có test luật.

---

## Lượt 18 — Bậc 7: chuỗi cửa hàng, điểm bán thứ hai & người trông coi ✅ đã xong

Bậc cuối của nhánh kinh doanh (`chuoi`, 320.000.000₫ ở tiệm Đồ Nghề Ba Tài, cần nhà hàng bình dân trước) — sau lượt
này `FUTURE_TIERS` **rỗng** và nhánh kinh doanh đủ **7/7 bậc**. Tài liệu chi tiết ở **`DESIGN.md` mục 4.27**.

**Một chi nhánh, không phải quầy thứ hai.** `Game.branch` mở ở một trong ba `BRANCH_SITES` (Sát cổng chợ 120.000₫/ngày
· Phố văn phòng 150.000₫ · Cổng công viên 90.000₫), thuê theo ngày, trả cùng lương người trông coi đầu mỗi ngày.
Người chơi vẫn bán ở quầy chính; chi nhánh bán hộ những **món đã nấu sẵn** được chuyển sang (`moveToBranch`, trần 6
loại món / 24 phần). Nhờ vậy không phải nhân đôi vòng khách 3D — toàn bộ sửa đổi nằm gọn trong một vòng tính theo phút
(`branchTick`, gọi từ `advance()` với `steps = clamp(round(dm), 1, 720)` nên ngủ dài/tua nhanh không mất doanh thu).

**Người trông coi.** `KEEPER_POOL` 3 ứng viên (lương 88.000–100.000₫/ngày). Không thuê thì chi nhánh không bán; món để
đó vẫn hao tươi. Trong thành phố có một NPC đứng sau quầy chi nhánh (`StallSys.updateKeeper`), quầy gỗ nhỏ + mái hiên
sọc + bảng hiệu đỏ *CHI NHÁNH · ĐANG BÁN* và khay món xếp theo lượng sẵn, tự ẩn khi người chơi ở xa hơn 90 m.

**Sổ từng điểm.** Chạm quầy chi nhánh (hoặc mở từ tab Nhân sự) ra bảng `'branch'`: doanh thu – đã bán – tip – mất khách
của hôm nay, tổng dồn nhiều ngày, thuê/cho nghỉ người trông coi, tạm đóng/mở lại, chuyển món hai chiều, 8 ngày lịch sử
và nút trả mặt bằng (hoàn nửa tiền thuê ngày đầu, bỏ món đang để đó).

**Kiểm thử:** `tests/chuoi.test.ts` 24 bài + 1 bài sửa cho `tests/devpoints.test.ts` — tổng **348 bài / 25 tệp** (lượt 19 thêm 17 bài → 365/26);
`npx tsc --noEmit`, `npm run build`, `npm run build:pages` sạch. Probe `tools/probe/steps/chuoi.mjs` chạy ở 844×390 và
390×844: lên bậc 7 → mở chi nhánh Cổng Chợ → thuê người trông coi → chuyển 14 phần sang → chạm đúng quầy để mở sổ →
tua 3 tiếng thấy bán hết 14 phần (280.000₫ + tip) → trả mặt bằng; không lỗi console. Menu ẩn (Cài đặt → bấm 7 lần chữ “Cài đặt”) được dọn lại: xoá hết mục test của lượt 14–17, thêm 9 mục cho bậc 7
(dựng chi nhánh ở 3 chỗ, tới quầy, đổ món, tua 3 tiếng, mở sổ, đổi người trông, trả mặt bằng) và **chỉ giữ** nhóm
“Địa điểm — tele nhanh”; probe `tools/probe/steps/devmenu.mjs` bấm lần lượt 17 mục, không lỗi.

---

## Lượt 19 — Giao người làm đi chợ mua nguyên liệu ✅ đã xong

Người chơi không còn phải tự ra từng sạp: **phụ quầy, bếp trưởng/bếp phó và người trông coi chi nhánh** đi chợ thay.
Chi tiết ở **`DESIGN.md` mục 4.28**.

**Cách dùng.** Chọn *món cần nấu* (một món, hoặc "đủ nguyên liệu 6 món đang bán") → game tính đúng phần còn thiếu →
tự tìm **sạp đang mở bán và rẻ nhất** cho từng nguyên liệu → trả tiền trước → người đó xách giỏ đi, **biến khỏi quầy**
12–68 phút tuỳ quãng đường → về chất hàng lên kho quầy với đúng độ tươi. Huỷ giữa đường hoàn 85%; qua ngày mới thì
chuyến dở tự huỷ. Vào bảng từ tab **Nhân sự**, hoặc nói chuyện với phụ quầy / phụ bếp.

**Sửa kèm lỗi bạn báo:** Má Bảy (người trông coi chi nhánh) hết đứng lọt trong quầy — nay đứng sau quầy 1,25 m và
quay mặt ra phía khách.

**Kiểm thử:** `tests/dicho.test.ts` 17 bài (tổng 365 bài / 26 tệp lúc đó; lượt 20 thêm 12 bài → 377/27); bản lưu nâng lên **v15** (`Game.errands`).
Probe `tools/probe/steps/dicho.mjs` ở 390×844: đo lại vị trí Má Bảy (`localZ = −1,25`, quay ra khách), mở bảng giao
chợ, chọn cơm sườn rồi bấm giao trên UI thật (9 loại, 109.801₫, về sau 12 phút), tua cho về thấy kho có 9 loại hàng,
người phụ quầy biến khỏi quầy trong lúc đi, giao người trông coi chi nhánh thì Má Bảy rời quầy; **console sạch**.

---

## Lượt 20 — Báo cáo sắp hết nguyên liệu & bếp trưởng tự duyệt đặt bàn ✅ đã xong

**Người làm tự canh kho.** Bếp trưởng / bếp phó / phụ quầy / người trông coi chi nhánh báo mỗi khi món đang bán còn
nấu được ≤ 1 phần: thiếu nguyên liệu gì, còn bao nhiêu, và **giao họ đi chợ thì hết bao nhiêu tiền** (dùng lại đúng
báo giá của mục 4.28). Bảng "Báo cáo & gợi ý của người làm" mở từ chip **“Sắp hết đồ N món”** trên HUD, từ tab Nhân
sự, hoặc menu ẩn; mỗi món có nút *Giao đi chợ* riêng. Tự nhắc bằng thoại + toast mỗi 25 giây khi tình hình đổi (quầy
tạm đóng vẫn nhắc).

**Quyền tự duyệt đặt bàn.** Nút **“Bếp trưởng tự duyệt đặt bàn”** (tab Nhân sự và trong bảng Báo cáo): bật thì khách
gọi đặt bàn được nhận luôn, không phải vào duyệt tay; bật giữa chừng thì nhận luôn các phiếu đang chờ. Vẫn giữ chỗ và
vẫn bị trừ uy tín nếu lỡ hẹn. Cờ nằm trong `flags` nên **không phải đổi bản lưu** (vẫn v15).

**Kiểm thử:** `tests/baocao.test.ts` 12 bài → tổng **377 bài / 27 tệp**. Probe `tools/probe/steps/baocao.mjs` ở
390×844: dựng nhà hàng + 2 bếp + 2 phụ quầy → dọn kho → bảng báo cáo hiện 4 món sắp hết, đúng danh sách thiếu và
163.475₫ → bấm *Giao đi chợ* ngay trong báo cáo mở đúng bảng với đúng người → bật tự duyệt thì phiếu mới `accepted`,
tắt thì `pending` → chip HUD mở được báo cáo; **console sạch**.

---

## Lượt 21 — Vựa ve chai thứ hai & bấm chuông mở cửa ✅ đã xong

**Vựa ve chai bên kia thành phố.** Người chơi than phải chạy về Xóm Lao Động mới bán được ve chai. Nay có thêm
**vựa Bà Chín** ở lô `21E` đường Khu Dân Cư (ngay đoạn đi qua lại giữa khu căn hộ và khu dân cư), rộng 7 m, dựng lại mô
hình bãi ve chai co theo bề ngang lô: bảng hiệu **VỰA VE CHAI BÀ CHÍN**, cân bàn, đống phế liệu, chủ vựa là bà Chín
ngồi bán 6h–19h như ông Tư Rác. Bán được đúng nhựa / lon / giấy / sắt với giá y như vựa cũ — luật "ai mua gì" gói
trong `junkAt(site, junk)` + `SCRAP_SITES` nên **không phải sửa `JUNK_LIST`** (bản lưu cũ vẫn đọc được, vẫn `SAVE_VERSION = 15`).
Panel túi đổi câu thành "Bán ở vựa ve chai (Tư Rác hoặc Bà Chín)", bảng việc làm và mấy câu thoại cũng nhắc cả hai vựa.

**Bấm chuông thì cửa mở ra.** Trước đây bấm chuông căn hộ An Bình chỉ thấy chủ nhà bước ra nói chuyện còn cánh cửa
đứng im: `openBellDoor` lọc cửa theo `d.d.home`, nhưng `DoorDef` **không có trường đó** — nó đánh dấu căn bằng `lock`.
Nay `Interact.doorHome(d)` trả `d.lock`, nên đúng cánh cửa của căn được đặt `want = 1` + hẹn giờ 16 giây: cửa xoay mở
86° trong ~1 giây, va chạm tắt nên đi qua được, hết giờ tự đóng lại (trừ khi người chơi đang ở trong căn). Áp dụng cho
cả nhà riêng và cửa hàng; bấm chuông ngoài giờ chủ nhà vẫn ra mở, gợi ý trên nút nói rõ điều đó.

**Menu ẩn:** xoá hết 13 mục test của các lượt 18–20, chỉ giữ nhóm *Địa điểm — tele nhanh* (thêm **Vựa ve chai Bà Chín**
và **Cửa căn hộ An Bình**) cùng 4 mục mới của lượt này: tới vựa Bà Chín kèm ve chai trong túi, bán hết ve chai, tới cửa
căn hộ, và bấm chuông ngay.

**Kiểm thử:** thêm `tests/vua2.test.ts` 11 bài → tổng **388 bài / 28 tệp**. Probe `tools/probe/steps/vua2.mjs` ở 390×844:
tele tới vựa Bà Chín (neo `v_scrap2` ở `x 78,6 / z −6,6`, Bà Chín hiện ra), bán 5 chai + 5 lon + 5 bìa + 5 sắt được
51.500₫ và `tot.scrap` cũng đúng 51.500₫ → tới cửa căn hộ bấm chuông: `want 0→1`, cửa xoay **−77°**, `box.on → false`,
chủ nhà bước ra ngoài hiên → tua hết 16 giây thì `want 0`, cửa đóng lại, `box.on → true`; **console sạch**.

**Vá sau khi chơi thử:** bỏ biển dọc chìa ra đường (nó che biển tiệm bên cạnh và che cả mặt tiền — ảnh người chơi gửi),
và sửa chuyện chủ nhà hiện ra **xuyên tường**: `ringBell` nay lấy tâm ô cửa + pháp tuyến của cánh cửa (qua
`Interact.bellDoor`) thay vì lấy neo chuông làm tâm, nên Cô Hạnh **đi ra qua đúng ô cửa**; thời gian chờ trước khi mở
lời thoại tăng 0,62 → 1,62 giây cho cửa kịp xoay mở.

---

## Lượt 22 — Ba giao diện điện thoại ✅ đã xong

Trước đây cả ba mẫu máy dùng chung một bảng tab. Nay **mỗi máy một giao diện thật** (`src/ui/phoneUI.ts`), mở lên là thấy
đúng cái máy đó và bấm theo đúng kiểu máy đó:

- **Cục gạch** (180.000₫): màn xanh xám chữ mono, danh sách dòng `▸`, phím cứng **▲ OK ▼**; chỉ có Sổ thu chi, Danh bạ, Tin nhắn, Pin.
- **Nắp gập** (520.000₫): màn màu nhỏ xoay vòng 8 icon + ô giữa là app đang chọn, **TÁCH** để mở; thêm Radio FM, Nghe nhạc.
- **Cảm ứng** (1.450.000₫): lưới icon 3 cột, **bấm thẳng** icon, nút **●** về màn hình chính; thêm Lướt web WAP.

Bàn phím máy tính cũng dùng được như phím cứng (↑ ↓ chọn, Enter mở, Esc lùi một màn). Cột bên phải hiện pin, giờ máy,
tiền mặt, tin chưa đọc. Sửa luôn lỗi bố cục gặp trong lúc làm: khung màn hình giờ bọc **mọi** màn, không chỉ màn hình
chính (trước đó mở app thì chữ hoà vào nền giấy).

**Kiểm thử:** `tests/phone3.test.ts` 5 bài → tổng **393 bài / 29 tệp**. Probe `tools/probe/steps/phone3.mjs` ở 390×844 mở
lần lượt cả ba máy: cục gạch bấm ▼ + OK mở Danh bạ, nắp gập TÁCH mở Sổ thu chi, cảm ứng bấm icon mở Tin nhắn rồi Sổ thu
chi; **console sạch**.

---

## Lượt 23 — App Quản lý cửa hàng trên điện thoại ✅ đã xong

Thêm app **Cửa hàng** cho **cả ba mẫu máy** (kể cả cục gạch): mỗi điểm bán một dòng gồm trạng thái đang bán/tạm đóng, số
phần đang bày, số món, món sắp hết, tiền thuê chỗ, doanh thu – số phần – số khách – khách mất của hôm nay, kèm **câu
gợi ý** đúng việc cần làm. Có **nút Mở/Đóng bán ngay trên máy** (`setShopOpen`) và mục **Bán lỗ so với giá vốn**
(`lossDishes`, so giá bán với `recipeCost`). Luật nằm ở `shopRows/setShopOpen/lossDishes` trong `src/sim/rules.ts`, UI
chỉ vẽ — nên test được mà không cần DOM.

**Kiểm thử:** `tests/shopapp.test.ts` 7 bài → tổng **400 bài / 30 tệp**. Probe `tools/probe/steps/shopapp.mjs` ở 390×844:
máy cảm ứng có icon Cửa hàng, mở ra thấy quầy chính + chi nhánh, bấm Đóng thì `stall.open = false`, bật chi nhánh từ
máy thì `branch.open = true`, đặt cơm sườn 2.000₫ thì hiện "lỗ 23.426₫/phần", máy cục gạch cũng có app; **console sạch**.
Sửa thêm một lỗi nhỏ gặp trong lúc làm: `reopenPanel` từng đưa điện thoại về màn hình chính, giờ chỉ `panel()` mới reset.

---

## Lượt 24 — Công tắc Mở/Đóng bán "hơi có vấn đề" trên điện thoại ✅ đã xong

Người chơi báo nút Mở/Đóng trong app Cửa hàng "hơi có vấn đề". Dựng lại đúng hoàn cảnh thì **quả thật có lỗi**, ba lỗi chồng nhau:

1. **Bấm Mở ở xa quầy thì 2 giây sau quầy tự tắt.** `StallSys.update()` có luật "đi xa > 40 m mà không có khách thì tự ngưng" —
   luật này ra đời từ trước khi có app, nên bật bán từ xa chỉ sống được ~2 giây rồi `close(true)`. Nút vì thế **tự nhảy về "Mở"**
   mà không ai bấm. Nay: cho **20 giây ân hạn** mỗi lần quầy chuyển sang mở (đặt ở `update()` nên bật ở đâu cũng tính, kể cả
   bấm ở quầy), và **nếu có người phụ việc/nhân viên (`g.help`, `g.help2`) thì quầy cứ bán** — chỉ nhắc nhẹ mỗi 45 giây.
   Câu toast mới nói rõ ai vắng mặt: "Bạn đi xa quá **mà không có ai bán** nên quầy tạm ngưng bán."
2. **Bấm không ăn mà không nói vì sao.** `setShopOpen` cũ chỉ trả `true/false`. Nay trả `'ok' | lý do`, thêm `shopToggleWhy()`
   (chưa đặt quầy, chưa bật món, quầy hư nặng, chưa có người trông coi chi nhánh) và **giới hạn giờ bán `SHOP_HOURS = [6, 22.5]`**;
   app hiện toast đúng lý do thay vì im lặng.
3. **Bấm xong bảng không vẽ lại.** Handler `acts.a` trong `panels.ts` chỉ `render()` khi `ui.modalName === name`, còn nút trong app
   lại đi qua `phoneToggleShop` → không có `data-i` và không ai vẽ lại; khi luật tự đổi trạng thái (quầy tự ngưng, khách vào) bảng
   cũng đứng im. Nay thêm `data-i="0"` cho nút, và `ui.ts` nghe `bus.on('ui', 'stall'|'branch')` → `reopenPanel` bảng đang mở
   (`phone`, `stall`, `branch`, `report`) nên **nhãn nút luôn khớp trạng thái thật**.

Thêm cảnh báo ngay trong app: `shopStaffWarn(g)` — "Quầy đang mở nhưng chỉ mình bạn bán — đi xa quá 40 m… khoảng 20 giây sau quầy
tự ngưng. Thuê người phụ quầy để bán từ xa." (mất cảnh báo khi đã có người phụ).

**Kiểm thử:** `tests/shopapp.test.ts` 8 bài (thêm bài `shopStaffWarn`) → tổng **401 bài / 30 tệp**. Probe mới
`tools/probe/steps/switchfar.mjs` (390×844) dựng đúng ca lỗi: đứng cách quầy 85 m, bấm Mở → sau 3 s `open: true, btn: "Đóng"`;
sau ~25 giây mô phỏng → `open: false, btn: "Mở"` (tự ngưng đúng luật, có toast); gắn người phụ việc rồi mở lại → sau 25 giây
**vẫn bán**, chỉ có câu nhắc; console sạch. Probe `steps/shopapp.mjs` vẫn xanh toàn bộ.

---

## Lượt 25 — Soát giao diện trên điện thoại Android ✅ đã xong

Người chơi xin "kiểm thử mọi giao diện trên Android xem có bị tràn / chật / khó chịu / đè gì không". Dựng probe đo đạc
`tools/probe/steps/android.mjs`: chạy qua **15 màn** (HUD, Cài đặt, Túi, Sổ tay, Quầy, Báo cáo, Chi nhánh, Bản đồ, Sai vặt,
ba mẫu điện thoại + app Cửa hàng, bảng sửa vị trí nút) ở **4 khổ 320×640 · 360×640 · 412×915 · 640×360** (máy cảm ứng thật,
`pointer: coarse`), đo cho từng phần tử: lọt khung, nút chồng nhau (cắt theo tổ tiên `overflow` nên không báo nhầm phần tử
đang cuộn), vùng chạm < 40×30, chữ bị cắt, phần tử dính sát mép trong vùng cử chỉ.

**Tìm ra và sửa 6 lỗi thật** (đều ở `src/ui/style.css`):

1. **Nút đóng bảng `.x` bị bóp còn 26×35** — tiêu đề + hàng tab dài ép nó lại. Nay `.x` có `flex: none` + `min-width`.
2. **Tiêu đề bảng bị bóp thành cột chữ** ("Chuỗi / cửa / hàng" mỗi chữ một dòng) trên máy hẹp. Nay trên máy cảm ứng
   `header` cho xuống hàng: tiêu đề + nút đóng một hàng, các tab xuống hàng riêng, không tab nào bị giãn hết bề ngang.
3. **Công tắc `.sw` bị cắt** (cần 35 px, khung chỉ 32 px, núm tràn ra ngoài) — thấy ở bảng Quầy. Nay rộng 3,3 em và núm
   đặt theo `calc(100% - 1.25em)` nên không phụ thuộc cỡ chữ.
4. **Chữ trong điện thoại quá nhỏ trên máy thật**: 8,2 px ở máy cảm ứng, 7,3 px ở nắp gập (chỉ đọc được khi soi). Nay trên
   máy cảm ứng màn hình máy là `1.16em`, chữ nhỏ nhất **10,4 px**; ô icon và phím cứng cũng to hơn.
5. **Màn hình máy phình vô hạn**: app Cửa hàng dài làm cả khung máy cao quá bảng, bị cắt mất nửa dưới (thấy rõ khi nằm ngang).
   Nay `.phonebox .ph` có `min-height: 0` + `max-height` và **tự cuộn bên trong khung máy**; nằm ngang thì máy thu nhỏ
   (13,5 em) để cả khung lọt trong bảng. Thêm `overflow-wrap` cho dòng dài và `nowrap` cho nhãn *đang bán / tạm đóng*.
6. **Vùng chạm nhỏ**: nút HUD 26 px, phím cứng cao 16–20 px, tab cao 23 px, `.btn.small` cao 19–22 px. Nay trên máy cảm ứng:
   `.ib` 2,9 em (≈38 px), `.btn.small` ≥ 32 px, `.tab` 30 px, phím cứng ≥ 32 px, nút thu nhỏ ô mục tiêu 30 px.

Thêm `94dvh` cho bảng (thanh địa chỉ Chrome Android ăn mất đáy) và `#hud-tr` cho phép xuống hàng với `#money` `nowrap`
(số tiền 4.936.000₫ từng thò ra ngoài mép phải ở 412 px).

**Kết quả sau khi sửa** — probe in `manHinh: 15, coVanDe: [], vungChamNho: []` ở **cả 4 khổ**. Ảnh chụp để trong
`anh_ket_qua/android/` (`01..08_dien_thoai_*/app_cua_hang/bang_cai_dat/bang_quay/sua_vi_tri_hud/ban_do_nam_ngang`).
Menu ẩn đổi sang `and_full` (dựng cảnh đầy đủ) + `and_phone3` (đổi ba mẫu máy), giữ nguyên nhóm tele nhanh.

---

## Lượt 26 — Cảnh báo "sắp hết đồ" nói rõ thiếu gì ✅ đã xong

Người chơi phản ánh chip đỏ *"Sắp hết đồ 2 món · xem báo cáo"* hiện ra mà **không biết thiếu cái gì**, và bấm **Sơ chế** thì
không có phản hồi gì (khi thiếu nguyên liệu). Kiểm tra thì đúng là ba lỗi chồng nhau:

1. **Câu quá chung.** `lowStockCount` chỉ đếm **số món** nấu tiếp được ≤ 1 phần, không nói nguyên liệu nào. Nay có
   `stockShortages(g)` (từng nguyên liệu: còn bao nhiêu, cần mua bao nhiêu, chợ nào bán, hết bao nhiêu tiền, chặn món nào),
   `shortageLine(g)` cho chip HUD ("Thiếu dầu ăn, bột mì…"), và `needsPrepCount(g)` để ca "đủ đồ nhưng chưa sơ chế" báo
   *"N món cần sơ chế trước"* thay vì đổ lỗi thiếu nguyên liệu.
2. **Nút Sơ chế khoá im lặng.** Khi thiếu đồ nút có class `.off` → `pointer-events: none`, bấm không ăn, không nói vì sao.
   Nay đổi thành class `.need`: vẫn bấm được, nhãn đổi thành **"Thiếu đồ — xem thiếu gì"**, bấm là hiện toast đúng nguyên
   liệu còn thiếu và **bảng vẫn mở** (`acts.prep` chặn trước khi đóng bảng).
3. **Ô thiếu đồ ngay trong bảng Quầy › Thực đơn**: khung đỏ *Thiếu nguyên liệu cho món đang bán*, mỗi dòng ghi
   *còn X đơn vị · cần thêm Y đơn vị · bán ở chợ nào · bao nhiêu tiền · cho món nào* (tối đa 6 dòng, còn lại chỉ sang tab
   Kho quầy). Số lượng đơn vị rời (chai, lon, quả, bó…) **làm tròn lên cả cái** — trước đó ra những con số vô nghĩa như
   "cần thêm 0,06 chai dầu ăn".

Sửa thêm hai lỗi bố cục gặp trong lúc kiểm: chip cảnh báo trên HUD **chen vào giữa hàng nút** (màn dọc) — nay nằm dưới hàng
nút, và nhãn *"đã sơ chế 0 phần"* từng **rơi vào giữa tên món** — nay là chip riêng.

**Kiểm thử:** `tests/baocao.test.ts` thêm 5 bài (17 bài tổng) → tổng **406 bài / 30 tệp**. Probe mới
`tools/probe/steps/shortage.mjs` (390×844, dựng quầy bậc 7 bán 2 món với kho trống): chip HUD ra *"Thiếu dầu ăn, bột mì…
· xem chi tiết"*, bảng Quầy có ô thiếu đồ 6 dòng đúng định dạng, nút Sơ chế đổi nhãn **"Thiếu đồ — xem thiếu gì"**, bấm
thì toast *"Chưa sơ chế … được — thiếu …"* và bảng còn mở; mua đủ đồ thì cảnh báo biến mất (`shorts: 0`); console sạch.

---

## Lượt 27 — Hai tổng đài trong danh bạ: 1080 và 1900 1234 ✅ đã xong

Người chơi xin thêm hai số điện thoại trong **Danh bạ**: một số gọi để nghe **dự báo thời tiết ngày mai**, một số gọi
để **nhận thưởng nhưng bị lừa** — và chuyện lừa chỉ được xảy ra **một lần**.

**1080 — Tổng đài dự báo thời tiết.** Có sẵn trong danh bạ từ đầu (đứng trên cả người quen), cước **2.000₫/lượt**,
mỗi ngày gọi tối đa **3 lần**. Nội dung đọc thẳng từ `WEATHER[g.weather.next]` nên **luôn đúng thời tiết kế tiếp**
(`g.weather.next` được `setWeather` gán sẵn, đổi sau mỗi lần trời trở): tên thời tiết, câu mô tả, kèm lời khuyên bán hàng
(trời nóng → món mát; se lạnh → món nóng; mưa to/giông → nhắc che quầy, đem ô). Tin nhắn `wx<ngày>` của 1080 cũng đổi
theo: chỉ nói **hôm nay** ra sao rồi mời gọi 1080 để biết **ngày mai**.

**1900 1234 — \"trúng thưởng\".** Ban đầu **không có trong danh bạ**. Từ **ngày thứ hai**, cứ **3 ngày một lần** số này
nhắn tin mời gọi (\"trúng một xe Wave, gọi lại để nhận\"); **có tin nhắn thì số mới xuất hiện trong danh bạ**. Gọi là mất
**15.000₫ cước** (5.000₫/phút × 3 phút dây dưa) và bị hẹn lên *\"văn phòng trúng thưởng ở cuối khu chợ\"* — mũi tên vàng
dẫn tới một **bức tường**, không có ai. Tới đó người chơi được **đúng MỘT cơ hội**: nghe ngóng rồi quay về (chỉ mất thời
gian, tinh thần nhẹ nhõm hơn) hoặc **vẫn tin** thì mất tiền thật (**40% tiền mặt, kẹp 20.000–200.000₫**) và mất buổi chiều.
Dính một lần là xong: lần sau gọi lại thì đầu dây bên kia \"không tồn tại\", **không mất thêm đồng nào**, và danh bạ vẫn giữ
số đó với nhãn *\"Số lừa đảo — bạn đã biết rồi\"*. Tin nhắn lừa cũng biến mất khỏi hộp thư sau khi gọi.

**Kiểm thử:** tệp mới `tests/phone4.test.ts` (**7 bài**) → tổng **413 bài / 31 tệp**. `tests/phone.test.ts` sửa 2 bài cho
khớp danh bạ mới (1080 có sẵn; tin 1080 nay mời gọi thay vì đọc dự báo hôm nay). Menu ẩn thay mục lượt 26 bằng ba mục
`hot_wx` / `hot_scam` / `hot_bust`. Probe mới `tools/probe/steps/hotline.mjs` (390×844): ngày 1 danh bạ chỉ có
*\"Tổng đài 1080\"*; gọi 1080 tốn đúng 2.000₫ và toast *\"Dự báo mai: nắng đẹp…\"*; sang ngày 2 hộp thư có tin *\"Chúc mừng!
… trúng thưởng một xe Wave\"* và dòng **1900 1234** xuất hiện đầu danh bạ; bấm gọi mất 15.000₫, `scamTrip` chỉ về cuối khu
chợ; đi tới nơi hiện hộp thoại **\"Bức tường cuối khu chợ\"** với đúng hai lựa chọn (quay về / vẫn tin); gọi lại thì
`fee: 0`. Console sạch. Ảnh: `anh_ket_qua/android/12_danhba_1080_ngay_dau.png` … `15_goi_1900_mat_cuoc.png`.

---

## Lượt 28 — Sửa nút ở điểm hẹn, dời chỗ hẹn, dọn sạp quần áo vào tiệm ✅ đã xong

Ba phản hồi của người chơi sau lượt 27:

1. **Bỏ dòng "dây dưa mất 15 phút"** — câu mời của 1900 1234 nay chỉ còn lời của đầu dây bên kia; cước ghi gọn
   *"cước 15.000₫"* trong danh bạ, không nhắc phút/giây nữa.
2. **Nút ở điểm hẹn bấm không ăn.** Nguyên nhân: `ActsSys.update()` gọi `scamBust()` **mỗi khung hình**, nên hộp thoại
   bị dựng lại liên tục và cú bấm rơi vào phần tử vừa bị xoá. Nay `scamBust()` chỉ chạy **một lần** (cờ `scamTalked`),
   và chỉ khi **không có hộp thoại/bảng nào đang mở** (`ui.isDialogOpen()` + `ui.modalName`) — bấm là ăn ngay.
3. **Dời chỗ hẹn cho hợp lý + thêm thùng bỏ tiền, dọn sạp quần áo đi.** Chỗ hẹn mới là **ngõ cụt ba bề tường sau dãy
   sạp phía nam chợ Xóm Chiều** (≈ −75, 18,6): tường gạch, **cửa cuốn đóng kín** có biển *"CHỜ THỦ TỤC · Văn phòng tạm
   đóng"*, tờ giấy dán tường, và **một cái thùng gỗ nhỏ có khe trên nắp + biển "LỆ PHÍ 5.000₫"** — nơi bỏ tiền nếu vẫn
   tin lời. Lựa chọn thứ hai của hộp thoại đổi thành *"Vẫn tin — bỏ "lệ phí" … vào thùng"*, câu kết cũng nói tới cái thùng.
   Sạp quần áo giữa chợ **bỏ hẳn**; Cô Ngọc dọn vào **căn nhà có sẵn ở mặt tiền tây Phố Trung Tâm** (cạnh Đồ Nghề Ba Tài),
   thành khối dựng mới `thoitrang`: cửa cuốn, biển **"QUẦN ÁO CÔ NGỌC"**, mái hiên, hai giá treo áo dọc hai bên, bàn gấp
   đồ + khay kính + khay giày, gương lớn áp tường, đèn trần; có neo `v_thoi_trang` mới trong tiệm nên Cô Ngọc đứng bán
   trong nhà. Lời thoại của cô thêm một câu giải thích vì sao dọn từ chợ ra mặt tiền.

**Kiểm thử:** `tests/phone4.test.ts` thêm 1 bài (vị trí ngõ cụt + thùng, câu mời không còn "dây dưa") → **8 bài**;
`tests/look.test.ts` thêm 1 bài (lô `thoitrang` là nhà thật ở Phố Trung Tâm, mặt tiền tây) → **15 bài**. Tổng **415 bài /
31 tệp**. Probe mới `tools/probe/steps/scamspot.mjs` (chụp ngõ cụt, cửa cuốn, thùng, mặt tiền và trong tiệm) và probe
`hotline.mjs` nâng lên 8 bước — bấm thật vào nút **"Thôi, quay về"** thì hộp thoại **đóng hẳn**, `fee: 0`,
`state: done`. Console sạch. Ảnh: `anh_ket_qua/android/17_ngo_cut_sau_cho.png` … `21_trong_tiem_quan_ao.png`.

---

## Lượt 29 — Hoạt ảnh ngay trên màn hình điện thoại ✅ đã xong

Người chơi muốn cái máy trong game **chạy thật**: lướt web, nghe radio, tin nhắn, cuộc gọi phải có hoạt ảnh
**hiện ngay trên màn hình điện thoại**, đúng phong cách từng mẫu máy.

**Cách làm.** Thêm lớp hoạt ảnh `actOverlay()` trong `src/ui/phoneUI.ts`: khi máy "đang làm gì đó", một lớp
phủ nằm **trong `.ph`** (khung màn hình máy), đè lên nội dung app; thanh trạng thái (giờ · pin) vẫn giữ ở trên.
Trạng thái giữ ở `ctx._pact` (`setPhoneAct` / `phoneAct` / `endPhoneAct` / `tickPhoneAct` / `phoneActNext`),
`ui.update(dt)` đếm ngược và vẽ lại bảng đúng lúc hoạt ảnh tắt hẳn. Toàn bộ chuyển động là **CSS keyframes**
(`src/ui/style.css`), nên chạy mượt mà không tốn khung hình vẽ lại.

* **Cuộc gọi** — chiếm cả màn hình: vòng sóng lan quanh chữ viết tắt tên người, “Đang gọi…” với ba chấm nhấp nháy,
  thanh tiến trình, nút **Tắt máy** (bấm là cúp, lớp biến mất). Hiện khi gọi khách quen, gọi 1080, gọi 1900 1234.
* **Radio / nghe nhạc** — thang tần số FM có **kim dò đài quét qua lại**, 16 **cột sóng nhảy** theo nhịp (CSS
  `scaleY`), dòng tin/bài đang phát **chạy ngang** (marquee), nút **Đổi đài / Bài khác** (đổi nội dung, chạy tiếp)
  và **Tắt**.
* **Lướt WAP** — ô địa chỉ trang, thanh tải chạy theo độ dài lượt lướt, **trang tin tự cuộn** (10 dòng tin trong
  game), “Đang tải…” nhấp nháy.
* **Tin nhắn** — mở hộp thư là màn hình chạy cảnh **soạn tin trả lời** người gửi mới nhất: bong bóng chat,
  ba chấm “đang gõ”, **bàn phím số** nhấp nháy từng phím.
* Ba mẫu máy giữ đúng chất: cục gạch dùng nền LCD xanh + chữ đơn cách, nắp gập nền xanh nhạt, cảm ứng nền trắng;
  nút trên lớp hoạt ảnh cao ≥ 36 px trên máy cảm ứng thật. Có `prefers-reduced-motion` để tắt chuyển động.
* Về màn hình chính (`phoneKey('home')`) là **cúp máy / tắt đài** luôn.

**Kiểm thử:** `tests/phoneanim.test.ts` (7 bài: bật/đếm ngược/tự tắt, đổi kênh, cúp máy, máy không có chức năng
thì không chạy) → tổng **422 bài / 32 tệp**. Menu Test & Dịch chuyển ẩn đổi sang ba mục của lượt này
(`anim_radio`, `anim_wap`, `anim_call`). Probe mới `tools/probe/steps/anim.mjs` (390×844: radio → đổi đài → WAP →
trang tự cuộn → gọi khách quen → bấm Tắt máy → tin nhắn trên cục gạch → nhạc trên nắp gập), `animland.mjs`
(khổ ngang), `devmenu29.mjs` (bấm menu ẩn). Console sạch, ảnh ở `anh_ket_qua/android/22_radio_tren_may.png` … `27_tat_hoat_anh.png`.

---

## Lượt 30 — Ba bài nhạc của máy (đổi được nhạc nền) + tin & giá thật trên radio/WAP ✅ đã xong

**Ba bài nhạc riêng của điện thoại** (`src/audio/songs.ts`): *Mưa chiều miền Trung*, *Mưa rơi trên phố chiều*,
*Chuyện người xe ôm* — mỗi bài viết tay 8 ô nhịp giai điệu + bè trầm theo ngũ cung, khác hẳn nhạc nền theo
ngữ cảnh. Máy có loa ngoài: bật **Nghe nhạc** là `ctx.sound.bgm` đổi sang bài của máy (nhạc nền thật sự đổi),
bấm **Bài khác** trên màn hình máy sang bài kế (hết bài cuối quay vòng), **Tắt**/về màn hình chính trả nhạc nền
về theo ngữ cảnh. Ba bài dùng chung khuôn `Track` nên bộ tổng hợp âm thanh không phải sửa gì.

**Tin thật trong ván** (`src/sim/news.ts`, mới): radio và WAP chỉ nói chuyện đang thật sự xảy ra — thời tiết đang
có (đúng câu `WEATHER[...].say`), giá món ở chợ **đúng bằng `shopPrice`** hôm nay kèm so sánh với hôm qua (dùng
lại cùng hàm nên không thể lệch giá), sự kiện đang diễn ra (đúng tên + lời của bảng sự kiện), sạp xả hàng cuối
buổi, chợ hết hàng (nêu tên món), nợ quá hạn, tiền phòng tới hạn, quầy đang đóng / còn bao nhiêu phần, pin máy
yếu, hàng trong quầy sắp hỏng, giờ mở cửa sạp. **Radio**: mỗi lần **Đổi đài** đọc sang một tin thật khác.
**WAP**: mỗi trang **đúng 5 tin thật**, bấm **Trang khác** sang trang kế (xoay vòng hết danh sách); tin giá kèm
bảng giá thật (món rẻ nhất + đắt nhất đang bán), và món nào đã có tin riêng trên trang thì bảng giá không nhắc lại.

**Kiểm thử:** `tests/music.test.ts` (6 bài: ba bài riêng, cấu trúc bản nhạc, bộ tổng hợp nhận cả ba bài, bật nhạc
đổi BGM, Bài khác đi hết ba bài rồi quay vòng, Tắt trả BGM về ngữ cảnh) và `tests/news.test.ts` (7 bài: tin thời
tiết đúng ván, giá đúng `shopPrice`, sang ngày thì giá đổi và tin nói đúng lên/xuống, sự kiện vào bản tin, tin giá
kèm bảng giá không trùng, mỗi trang WAP đúng 5 tin và sang trang là tin khác, chuyện của người chơi vào bản tin)
→ tổng **436 bài / 34 tệp**.

**Sửa ngay sau khi người chơi bắt lỗi:** bản tin có câu *“Chú Ba đứng đầu hẻm từ 5 giờ, chở hàng nặng thì nhớ trả
thêm vài ngàn”* — **bịa**: Chú Ba xe ôm trong game chỉ là **khách quen** (`REGULARS`, giờ 11,5) thỉnh thoảng ghé
quán ăn trưa, không có dịch vụ xe ôm nào và không có ai đứng ở hẻm. Câu đó bỏ hẳn; thay bằng tin khách quen chỉ
xuất hiện **khi người chơi đã thực sự bán cho họ** (`g.rel[id].n > 0`), và nói đúng số lần ghé + giờ hay tới + ghi
chú của người đó trong dữ liệu. Thêm 1 bài kiểm canh đúng lỗi này ("chưa quen ai thì bản tin không nhắc ai, không
có 'đầu hẻm'") → **436 bài / 34 tệp**. Menu Test & Dịch chuyển ẩn thêm ba mục `music_bgm`, `news_radio`, `news_wap`.
Probe `steps/anim30.mjs` + `animshot30.mjs` (390×844): bật nhạc → `bgm: phone_mua_chieu`, Bài khác →
`phone_pho_chieu`, radio đọc “Thời tiết sáng: nắng đẹp…”, WAP trang 1 có 5 tin + `Giá chợ hôm nay`. Console sạch.
Ảnh: `anh_ket_qua/android/28_nhac_tren_may.png` … `32_wap_trang_gia.png`.

## Lượt 31 — Con người: dáng người · râu · nón · thoại riêng · ca làm ✅ đã xong

Mục §5 trong `TODO.md` (dòng "Còn thiếu: gương ở nhà, đổi dáng người – chiều cao, mũ/nón, bộ đồ riêng theo nghề;
râu, kính, mũ đa dạng hơn; bộ thoại riêng cho từng nhân vật cố định...; nhiều người phụ việc, chia ca sáng/tối").

- **Dáng người** (`SHAPES` trong `src/data/looks.ts`, mua ở tiệm Quần áo Cô Ngọc): gọn gàng / vừa vặn / đậm người,
  15.000–18.000₫, đổi **cả bề ngang lẫn chiều cao**. Có tác dụng thật, không chỉ đổi hình: `bodyType()` + `BODY_SPEED`
  (±6% tốc độ đi) và `BODY_DRAIN` (±12% hao sức) trong `src/sim/rules.ts` — người chơi cảm thấy khác ngay dưới chân.
- **Râu** (`beard` 0–3: sạch / mép / cằm / quai nón) vẽ thêm trong `buildBody` (`src/gfx/people.ts`), mua ở ghế Chú Bảy
  (cạo 5.000₫, để râu 8.000₫). Chỉ nam; nữ và bản lưu cũ luôn là 0.
- **Nón** (`HATS`: nón lá / lưỡi trai / bảo hiểm, 20.000–55.000₫) ở tiệm may, đội lên thấy ngay trên đầu.
- **Thoại riêng**: `LINES.own` + `fillLine()`/`ownLine()` (`src/data/people.ts`) — 15 nhân vật cố định có 1–3 câu
  riêng, xoay theo ngày, thay cho câu chung của nghề. `{you}`/`{self}` điền đúng cách gọi.
- **Ca làm của người phụ quầy**: `Shift = 'sang' | 'chieu' | 'full'` (5–14h / 14–22h / 5–22h) trong `state.ts`,
  `shiftLeft()`/`onShift()` trong `rules.ts`; ai ngoài ca thì **không tới quầy** (`src/game/stall.ts`), bảng Quầy ›
  Nhân sự có nút **Sang ca chiều / Làm cả ngày / Về ca sáng** + số giờ còn lại. Bản lưu **v16** (migration: người 1 cả
  ngày, người 2 ca sáng — y như hành vi cũ).
- **Bớt chữ thừa theo góp ý "UI đừng như app do AI làm"**: bỏ 10 dòng `sub` giải thích lại đúng điều nút đã nói
  ("Xem gánh, xe đẩy, sạp…", "Sáu màu, vải mát", "Tốn sức, nhớ ăn uống đầy đủ", "No bụng, ấm lòng"…). Bảng chọn
  giờ chỉ nói giá + tình trạng thật; chỗ nào cần cảnh báo mới có chữ nhỏ.
- **Bộ đồ theo nghề**: từ xe đẩy trở lên người chơi tự mặc **tạp dề đỏ** của người bán (`Player.syncApron()`), thấy rõ
  ở góc nhìn thứ ba; quán lên bậc nào là hình đổi theo bậc đó.

**Kiểm thử:** `tests/nguoi.test.ts` (16 bài) → tổng **452 bài / 35 tệp**. `tsc` sạch, `build` + `build:pages` OK.
Probe `tools/probe/steps/nguoi31.mjs` (390×844): tiệm may có mục Dáng người/Nón, đặt `fat 1.12` → `bodyType 2`,
`moveMul` 94% (chậm hơn thật), râu quai nón + nón lá hiện trên mặt, bảng Nhân sự 2 phụ quầy, 20h thì ca sáng
`cóMặt: false` còn ca chiều `true · còn 120 phút`. Console `errors: none`.
Ảnh: `anh_ket_qua/android/33_tiem_may_dang_nguoi.png`, `34_rau_quai_non_non_la.png`, `35_ca_lam_phu_quay.png`.

## Lượt 32 — Menu ẩn của lượt 31 · khách lựa hàng · người đi đường nhận ra người chơi ✅ đã xong

Phần còn lại của mục §5 trong `TODO.md`, cộng thêm chỗ tôi quên ở lượt 31 (menu ẩn).

- **Menu ẩn** (`src/game/devPoints.ts`) đổi sang nhóm của lượt 31: `look_shape` (tiệm may + dáng + nón), `look_beard`
  (ghế Chú Bảy + râu), `look_apron` (dựng xe đẩy để thấy tạp dề), `talk_own` (nghe câu riêng của Chú Ba Tài & Ông Bảy),
  `shift_help` (bảng Quầy › Nhân sự lúc 20h), `shift_watch` (đứng ở quầy xem một người vắng mặt). Sáu mục của lượt 30
  đã chuyển sang danh sách "không được còn sót" trong `tests/devpoints.test.ts`.
- **Khách lựa hàng ở tiệm nhỏ** (`src/game/shopbrowse.ts`, mới): người đi đường ghé **tạp hoá Cô Ba** hoặc **MiniMart**,
  đi bộ dọc hai dãy kệ (ba điểm dừng thật trong tiệm), tới quầy nói **đúng tên món và đúng giá hôm nay**
  (`shopPrice()`), đứng một chút rồi đi ra. Người chơi đứng cạnh thì họ **nhờ lấy giùm món trên kệ cao** —
  bấm giúp thì uy tín +0.2 và họ cảm ơn thật (`acts.browserTalk()`). Bấm vào họ để nói chuyện
  (`interact.ts`: nhánh riêng cho `actor === 'browse'`).
- **Người đi đường nhận ra người chơi** (`src/sim/life.ts` + `src/data/people.ts`): `greetKind()` có thêm ba kiểu
  **`rich`** (≥ 5 triệu và uy tín > 10), **`poor`** (< 5.000₫) và **`wanted`** (bị công an để ý ≥ 45), xếp trước cả
  "quen mặt" và thời tiết. Mỗi kiểu có 3–4 câu riêng. Không truyền `cash` (chỗ gọi cũ) thì giữ nguyên cách chào cũ.

**Kiểm thử:** `tests/life.test.ts` thêm 2 bài; tổng **454 bài / 35 tệp**. `tsc` sạch, build OK.
Probe `tools/probe/steps/nguoi32.mjs` (390×844): menu ẩn hiện đúng nhóm lượt 31 + nhóm địa điểm; khách vào tạp hoá
(`sốKhách: 1, tiệm: kiosk`), bấm nói chuyện thì hiện “Anh ơi, lấy giùm tôi hộp … trên kệ cao với” với nút
**“Để tôi lấy giùm.”**; `greetKind` trả `known / rich / poor / wanted` đúng bốn trường hợp. Console `errors: none`.
Ảnh: `anh_ket_qua/android/36_menu_an_luot31.png`, `37_khach_lua_hang.png`, `38_nho_lay_giup_mon.png`.

## Lượt 35 — Sửa lỗi: quán thường mất nút "Giao đi chợ…" ✅ đã xong

Người chơi báo *"mất nút giao mua đồ"* trong bảng Quầy, và hỏi có phải do dev mode không. **Không phải dev mode.**

- **Nguyên nhân**: tab **Nhân sự** chỉ được thêm vào bảng Quầy khi `isRestaurant(g)` (bậc ≥ 6). Nhưng từ lượt 31,
  quán bậc 3–5 đã thuê được người phụ quầy (và phải giao được họ đi chợ) → quán nhỏ **thuê được người mà không có
  tab nào chứa nút**. Khối `errandBlock()` thì nằm sâu trong nhánh "nhà hàng + chuỗi cửa hàng".
- **Sửa** (`src/ui/panels.ts`): điều kiện tab đổi từ `rest` sang `hasStaff = rest || helperCount > 0 || errands.length > 0
  || branch?.keeper`. Nhãn tab là **"Nhân sự"** ở quán thường, **"Nhân sự & Đặt bàn"** ở nhà hàng. Phần **Đặt bàn trước**
  bọc trong `if (rest)`, khối **chi nhánh** trong `if (R.isChain(g))`, còn **đi chợ + báo cáo** nằm ngoài, luôn hiện.
- **Bớt chữ thừa**: quán thường không còn bày mục "Nhân viên phụ bếp (0/0)" (chưa có bếp riêng) và dòng
  "Bếp trưởng tự duyệt đặt bàn — cần có bếp trưởng (nhà hàng bình dân)" — chỉ dặn việc chưa làm được.
- **Menu ẩn** (`devPoints.ts`) đổi sang nhóm của lượt này: `staff_shop5` (quán bậc 5 có phụ quầy → mở Quầy › Nhân sự,
  có nút giao đi chợ) và `staff_rest6` (lên nhà hàng bình dân → thêm Đặt bàn trước). Nhóm "Địa điểm — tele nhanh" giữ nguyên.

**Kiểm thử:** `tests/helper.test.ts` thêm 2 bài (`hasStaff` + chuyến đi chợ còn chạy), `tests/devpoints.test.ts` cập nhật
→ tổng **456 bài / 35 tệp**. `tsc` sạch, `build` + `build:pages` OK.
Probe `tools/probe/steps/checkstaff.mjs` (390×844), kết quả `đạt: true`:

| Trường hợp | Tab | Có "Giao đi chợ…" | Có "Đặt bàn trước" | Tự duyệt đặt bàn |
|---|---|---|---|---|
| Quán thường bậc 5, 1 phụ quầy | `Nhân sự` | ✅ | ❌ (đúng) | ❌ (đúng) |
| Nhà hàng bình dân bậc 6 | `Nhân sự & Đặt bàn` | ✅ | ✅ | có bếp trưởng mới hiện |

`tools/probe/steps/checkdev35.mjs`: mở menu ẩn 8 lần bấm → bấm "Chạy" ở mục đầu → ra bảng Quầy có tab **Nhân sự** và nút
**Giao đi chợ…** (`nútChợ: ["Giao đi chợ…"]`, `errors: none`).
Ảnh: `anh_ket_qua/android/39_quan_thuong_co_nhan_su.png`, `40_nha_hang_nhan_su_dat_ban.png`.

## Lượt 36 — Đồ bỏ vào quầy "biến mất": bánh mì lâu hỏng hơn + cảnh báo đồ cần lạnh ✅ đã xong

Người chơi báo *"bánh mì và sữa tôi bỏ vào quầy lại biến mất"*, nghi lỗi khác nhau giữa điện thoại và PC.
**Kiểm bằng probe thật trước khi sửa** (`tools/probe/steps/stallvanish.mjs`, 390×844): mua bánh mì + sữa bằng
`acts.take`, bỏ vào quầy bằng nút "› Quầy", rồi cho trôi 1 ngày → **không có lỗi mất đồ**; đồ vẫn nằm trong kho
(`banhmi×2 @41%`). Cái làm người chơi tưởng "biến mất" là ba thứ im lặng:

1. **Đồ hỏng bị dọn mà không nói món gì.** `newDay()` purge cả túi/quầy/nhà rồi chỉ báo "mất bao nhiêu tiền".
   Nay báo đích danh: *"Đồ hỏng phải bỏ: Tôm. Đồ nguội để vài hôm vẫn được, thịt cá chưa nấu thì không."*
2. **Bánh mì hỏng sau ~22 giờ** — mua chiều hôm nay, sáng mai mở ra đã mất. Người chơi xin **tăng 100% thời gian
   hỏng**: `banhmi.shelf` 22 → **44 giờ** (×1,2 hệ số chung của bảng = **52,8 giờ**, đúng gấp đôi mức cũ 26,4).
3. **Đồ cần lạnh để ở quầy mà không có tủ đá** thì hỏng nhanh **2,6 lần** (sữa, thịt) — im lặng hoàn toàn.
   Thêm `hoursLeft()` + `coldUnprotected()` trong `src/sim/rules.ts`, hiện ở **bảng Kho quầy (PC)** và **app Quản lý
   cửa hàng (điện thoại)**: *"Sữa tươi, Thịt heo nạc cần lạnh mà quầy không có tủ đá — để đây khoảng 4 giờ nữa là hỏng."*

**Cho PC và điện thoại thấy giống nhau** (người chơi dặn "kiểm các món khác với trên đt và pc"): app Quản lý cửa hàng
nay có thêm dòng **"Kho nguyên liệu: N loại · X kg"** (trước chỉ có số phần đã nấu), dòng cảnh báo **sắp hỏng** kèm tên
món, và cảnh báo **đồ cần lạnh**. Nút **"Bỏ"** trong bảng Túi đổi thành **"Vứt"** + toast *"Đã vứt 2 ổ bánh mì đi."*
(trước đây vứt cả lô mà không nói gì — cũng là một kiểu "biến mất").

**Sữa Tartieen**: kiểm hết `src/data/ingredients.ts` + `src/data/shops.ts` — game **không có** mục "sữa Tartieen";
chỉ có **Sữa tươi** (`suatuoi`, hộp 1 kg, 32.000₫, bán ở MiniMart) và **Sữa đặc** (`suadac`, lon, bán ở MiniMart).
Nên nếu bạn ấy "mua hộp sữa Tartieen rồi biến mất" thì đó là do **hỏng** (sữa là đồ cần lạnh). Chưa thêm món mới vì
chưa rõ ý người chơi — sẽ hỏi.

**Kiểm thử:** `tests/hong.test.ts` (8 bài: đồ bỏ quầy còn nguyên, bánh mì 52,8 giờ, báo tên món hỏng, app báo sắp hỏng,
cảnh báo đồ lạnh có/không tủ đá, thịt ≤ 6 giờ, giá bánh mì khớp giữa các chỗ hiển thị, cuối buổi lò bánh mì xả hàng rẻ hơn)
+ `tests/data.test.ts` cập nhật → tổng **464 bài / 36 tệp**. `tsc` sạch, `build` + `build:pages` OK.
Probe `stallvanish.mjs` (`errors: none`): `store` sau khi bỏ = `banhmi×2`, báo hỏng đúng tên **Tôm**, app có
`Kho nguyên liệu: 2 loại · 0,6 kg` + `Đồ trong kho sắp hỏng: Bánh mì`. Probe `coldwarn.mjs`: bảng Kho quầy báo
*"…để đây khoảng 40 giờ nữa là hỏng"* cho sữa; app báo cùng nội dung. Probe `dev36.mjs`: hai mục menu ẩn chạy đúng.
Ảnh: `anh_ket_qua/android/41_banh_mi_trong_quay.png`, `42_canh_bao_do_lanh.png`, `43_app_bao_do_lanh.png`.

## Lượt 37 — Lấy đồ ra khỏi kho quầy ở bất cứ đâu ✅ đã xong

Người chơi xin: *"cho phép lấy đồ ra khỏi quầy mà không cần đặt quầy vào chỗ bán"*.

- **`rules.ts`**: thêm `canTakeFromStore(g)` (có quầy là lấy được) và `nearStall(g, x, z)` (đang mang quầy coi như
  ở cạnh; quầy đặt ở chỗ bán / ở nhà thì phải trong 8 m). Bảng `panels.ts` dùng chung hàm này thay cho biến `near` cũ.
- **Bảng Túi đồ** có thêm tab **"Kho quầy"** (`bag` → `Nguyên liệu · Kho quầy · Dụng cụ`): xem kho quầy và bấm
  **"› Túi"** để lấy ra, ở bất cứ đâu — đang gánh quầy, quầy để ở nhà, hay đang đứng giữa chợ. Dòng đầu ghi rõ
  *"Kho quầy (chỗ ở) · 0,2/14 kg — lấy ra được ở bất cứ đâu."*
- **Chỉ chiều bỏ VÀO** kho mới cần ở gần quầy (giữ luật cũ: không thành túi không đáy).
- Tab tự ẩn khi chưa có quầy (tier 0) — lúc đó không có kho nào để lấy.

**Kiểm thử:** `tests/hong.test.ts` thêm 2 bài (carried/placed/home; chưa có quầy), `tests/devpoints.test.ts` cập nhật
→ tổng **466 bài / 36 tệp**. `tsc` sạch, `build` + `build:pages` OK.
Probe `takestore.mjs` (`errors: none`): quầy `carried` → tab `Nguyên liệu · Kho quầy · Dụng cụ`, lấy 4 ổ bánh mì ra túi
(`túi: banhmi×4`, `store: heo×2`); quầy `home` đứng ngoài đường vẫn lấy được (`túi: banhmi×7`).
Probe `dev37.mjs`: hai mục menu ẩn (`take_store`, `take_store_home`) chạy đúng.
Ảnh: `anh_ket_qua/android/44_lay_do_tu_kho_quay.png`, `45_kho_quay_o_nha.png`.

## Lượt 38 — Nhật ký phát triển xem được trong Cài đặt ✅ đã xong

Người chơi xin: *"làm thêm 1 dev log coi được trong Cài đặt (chỉ cần từ bản trước đến bản này và các bản sau)
những gì đã làm"*.

- **`src/data/changelog.ts`** (mới): mảng `CHANGELOG` — mới nhất ở đầu, mỗi bản gồm `v` ("Lượt 37"), `tag` (một dòng
  tóm tắt) và `items` (những việc đã làm, viết như kể cho người chơi nghe, không phải câu commit). Hiện có **5 bản**:
  lượt 31, 32, 35, 36, 37. Bản sau chỉ cần thêm một mục vào đầu mảng; giữ tối đa 8 bản (bài test canh).
- **Màn hình mới `changelog`** (`src/ui/panels.ts`): mở từ **Cài đặt › khối "Nhật ký phát triển" › nút "Xem các bản
  gần đây"**, liệt kê từng bản; bản chưa đọc có nhãn **"mới"**; đọc xong lưu `g.flags.logSeen = 37` để lần sau nhãn biến mất.
- Khối trong Cài đặt có sẵn dòng phụ đề *"Lượt 37 · Lấy đồ ra khỏi quầy ở bất cứ đâu"* — không cần mở mới biết bản mới nhất.

**Kiểm thử:** `tests/changelog.test.ts` (4 bài: thứ tự giảm dần + ≤ 8 bản, bản mới nhất là lượt 37, mỗi bản ≥ 2 việc và
câu đủ dài, không lặp câu) → tổng **470 bài / 37 tệp**. `tsc` sạch, `build` + `build:pages` OK.
Probe `changelog.mjs` (`errors: none`): Cài đặt có khối + nhãn "mới"; mở ra đủ **20 việc** của 5 bản, đầu đề đúng thứ tự
`Lượt 37 … Lượt 31`; `logSeen: 0 → 37`; mở lại Cài đặt thì nhãn "mới" đã mất.
Ảnh: `anh_ket_qua/android/46_nhat_ky_phat_trien.png`.

## Lượt 39 — Bánh phở, bún và đồ nguội cũng để được 2 ngày ✅ đã xong

Người chơi chốt: *(1) không thêm "Sữa Tartieen", (2) "ok sửa luôn"* phần tăng hạn dùng cho đồ nguội như bánh mì.

| Nguyên liệu | Trước (giờ) | Sau (giờ) | Ghi chú |
|---|---|---|---|
| Bánh phở | 30 | **60** | ×1,2 của bảng → 72 giờ thực tế |
| Bún tươi | 26 | **52** | → 62,4 giờ |
| Xúc xích | 60 | **120** | → 144 giờ |
| Giò lụa | 40 | **80** | → 96 giờ |
| Chả cá | 30 | **60** | → 72 giờ |
| Đậu hũ | 36 | **72** | → 86,4 giờ |

**Giữ nguyên** (không nới): thịt, cá, hải sản tươi sống — `heo` 12 giờ, `tom` 8,4 giờ… để lâu vẫn hỏng thật.
Dòng nhắc trong bảng Kho quầy đổi thành *"bánh mì, bánh phở, bún tươi và đồ nguội để được **2 ngày**; thịt cá chưa nấu chỉ vài giờ"*.
Sữa Tartieen: người chơi chọn **không thêm** — giữ nguyên sữa tươi + sữa đặc.

**Nhật ký phát triển** (lượt 38) đã thêm bản **Lượt 39** lên đầu — đúng cơ chế đã làm: chỉ cần thêm một mục vào `CHANGELOG`.

**Kiểm thử:** `tests/data.test.ts` canh đúng 6 con số mới + 2 con số thịt cá *không* đổi; `tests/hong.test.ts` thêm 2 bài
(6 món đồ nguội sống qua một ngày trong quầy; thịt heo thì vẫn hỏng) → tổng **472 bài / 37 tệp**. `tsc` sạch, build OK.
Probe `spoil39.mjs` (`errors: none`): sau 20 giờ trong quầy còn `banhpho@73% bun@69% xucxich@65% gio@47% chaca@30% dauhu@41%`,
riêng thịt heo bị dọn và báo **"Đồ hỏng phải bỏ: Thịt heo nạc."**
Ảnh: `anh_ket_qua/android/47_do_nguoi_2_ngay.png`.

## Lượt 40 — Mượt hơn trên điện thoại + chơi offline ✅ đã xong

Người chơi hỏi: *"cải thiện FPS trên điện thoại (không mượt), cho vài cách tối ưu nhất"* và *"game offline chưa?"*.

### Tối ưu FPS (đo thật, cùng máy, cùng cảnh — Chrome 390×844, DPR 3)

| Mức | Trước | Sau | FPS trước → sau |
|---|---|---|---|
| Rất thấp | pr 0,7 · 10 NPC · view 100 | **pr 0,6 · 8 NPC · view 90 · không lớp chi tiết** | 25,9 → **29,8** |
| Thấp | pr 1 · không bóng | pr 0,8 · 12 NPC · view 115 | 19,6 |
| **Vừa** (mặc định đt) | **pr 1,5 · bóng 1024 · 2 đèn · 22 NPC · view 165** | **pr 1 · không bóng · 1 đèn · 18 NPC · view 145** | **5,5 → 14,1** (×2,6) |
| Cao | pr 2 · bóng 2048 · 4 đèn · 32 NPC | giữ nguyên (máy tính) | 5,9 |

Số đo của mức "Cao" thấp vì trình duyệt không giao diện dùng WebGL phần mềm — chỉ dùng để **so sánh tương đối** giữa các mức,
không phải FPS của máy thật.

Sáu thay đổi, xếp theo mức lợi:
1. **Pixel ratio**: đt chặn trần 1,25; mức "Vừa" 1,5 → 1. Đây là thứ tốn GPU nhất (giảm 55 % số điểm ảnh phải tô).
2. **Tắt bóng đổ ở mọi mức trừ "Cao"**: `shadowMap.enabled = q.shadow > 0` (trước đây bật vô điều kiện nên Three.js vẫn vẽ bản đồ bóng mỗi khung).
3. **MSAA**: `antialias` chỉ bật khi không phải điện thoại **và** mức là "Cao" — trên màn hình mật độ cao gần như không thấy khác biệt.
4. **Lớp chi tiết khu phố** (`detail`): mức "Rất thấp" tắt hẳn; các mức khác vẫn cull theo tầm nhìn như cũ.
5. **Đèn điểm**: 2 → 1 ở "Vừa", 0 ở hai mức thấp.
6. **Tự hạ đồ hoạ**: hạ sau **5 giây** giật (trước 6), máy **dưới 22 FPS hạ thẳng 2 mức**, và **không hạ khi đã trên 45 FPS** (trước đây ngưỡng 23 làm hạ oan máy chạy 30 FPS).

### Chơi offline

- `public/sw.js` — service worker: trang thì lấy bản lưu trước (mở tức thì), tài nguyên có hàm băm trong tên thì lấy mạng trước rồi rơi về bản lưu; có `message: 'cache-all'` để trang xin lưu sẵn toàn bộ tệp đang dùng.
- `src/core/offline.ts` — đăng ký SW sau khi game lên hình (1,2 giây), đếm dung lượng đã lưu qua `performance.getEntriesByType('resource')`, hàm `downloadForOffline()`.
- Cài đặt có mục **"Chơi offline"**: nút "Lưu để chơi offline" + dòng "Đã lưu · x MB — mất mạng vẫn mở được". Tiến trình vẫn nằm trong `localStorage`.
- Menu ẩn (7 lần bấm "Cài đặt") đổi sang **lượt 40**: `perf_now` (đo FPS 3 giây, báo cả lệnh vẽ / tam giác / pixel ratio) và `offline_try` (lưu offline rồi báo trạng thái SW + số kho lưu).

### Kiểm chứng

- `tests/quality.test.ts` — **7 bài mới** canh: mức mặc định đt không bóng & pr ≤ 1, chỉ mức cao nhất có bóng, các mức tăng dần, thiết bị mới chọn đúng mức.
- `tests/changelog.test.ts` → "Lượt 40"; `tests/devpoints.test.ts` → id `perf_now` / `offline_try`, và `spoil_all`/`spoil_meat` vào danh sách "không còn sót".
- Tổng **479 bài / 38 tệp** pass; `tsc` sạch; `npm run build` OK.
- Probe `fps40.mjs` (đt 390×844, DPR 3, `errors: none`): mức mặc định = "Vừa", `pr 1`, `shadows false`; FPS 4 mức `25,9 / 19,6 / 13,7 / 5,9`; **SW `activated`, kho `ganhhang-v1`, 16 tệp sau khi bấm nút**; **cắt mạng + tải lại trang → game vẫn chạy (chế độ menu), FPS 14,7**.
- Probe `fps40c.mjs` (máy tính 1366×768): mặc định "Cao", `shadows true`; mức "Vừa" tắt bóng hẳn (`shadowMap false`, `sun.castShadow false`); mức "Rất thấp" `detailOn false`.
- Ảnh: `anh_ket_qua/android/48_fps_toi_uu.png`, `49_cai_dat_offline.png`, `50_offline_that.png`, `anh_ket_qua/51_pc_cai_dat_offline.png`.

## Lượt 41 — Rau củ lâu hỏng, ăn quán no lâu, bệnh đau bụng ✅ đã xong

Người chơi: *"buff rau/củ bán chợ +200–300 % độ lâu hỏng, sản phẩm nước trong quán cà phê/cơm tăng hiệu quả 200–300 %,
tăng nhẹ tỉ lệ đau bụng khi uống nước ở công viên, cần mua thuốc uống để hết, ăn sản phẩm mình nấu từ 2 sao trở lên
thì tỉ lệ thấp"*; chốt thêm: **giữ nguyên khoai tây/khoai lang/hành**, mục 2 chọn **(a) no lâu hơn**.

### Rau củ ở chợ (giờ thực tế = bảng × 1,2)
| Món | Trước | Sau | Ghi chú |
|---|---|---|---|
| Rau muống | 30 | **105** | 126 giờ |
| Rau thơm | 24 | **84** | 100,8 giờ |
| Hành lá | 36 | **126** | 151 giờ |
| Giá đỗ | 24 | **84** | 100,8 giờ |
| Xà lách | 30 | **105** | 126 giờ |
| Cà rốt / bắp cải | 120 | **360** | 432 giờ |
| Cà chua / dưa leo / bắp | 72 | **216** | 259 giờ |
| Ớt | 120 | **360** | 432 giờ |
| Chanh | 150 | **450** | 540 giờ |
| Xoài xanh | 40 | **140** | 168 giờ |
| Chuối | 60 | **210** | 252 giờ |
| **Khoai tây, khoai lang, hành tây** | 300 | **300 (không đổi)** | người chơi chốt giữ |
| Tỏi, gừng, sả | 600/600/200 | không đổi | vốn đã bền |
| Thịt heo / tôm / cá | 12 / 8,4 / 8,4 | không đổi | vẫn hỏng trong ngày |

### No lâu hơn 2,5 lần (mục 2 = (a))
`acts.playFun` nhân `hunger` × 2,5; quán cơm Bà Tư `h 60→150`, bữa cơm rửa chén `45→112,5`, cơm chay chùa `48→120`.
Đồ uống (cà phê sữa) **không** nhân độ no vì vốn không có `hunger`. Giá bán không đổi.

### Bệnh đau bụng (mới)
- `rules.sickStomach(g, why, mins=90)` — đặt `flags.dauBung` (số phút). Giờ đau trừ máu **dần** (−0,05/phút), sức −0,04, tinh thần −0,02; hết giờ thì tự dịu. Bản cũ trừ thẳng 18 máu rồi thôi.
- `stomachChance(g, {selfMade, stars, bought, rank, risky})`: đồ mua sẵn **6 %**, nước vòi/quán cà phê **+12 %/+8 %**, đồ tự nấu **3 sao = 0 %, 2 sao = 2 %, dưới 2 sao = 8 %**; đang đau thì giảm nửa.
- `MEDS.daubung` — **Thuốc đau bụng 12.000₫** ở quầy thuốc bệnh viện **và** mua trực tiếp ở Nhà thuốc An Tâm (menu Cô Hiền). Uống là `flags.dauBung = 0`.
- Bác sĩ khám ra đau bụng và chỉ ra quầy thuốc. HUD có chip **“Đau bụng 3h”**.
- `risky` cũ (ăn đồ ôi, thùng rác, đồ hỏng) giờ đi qua `sickStomach` thay vì trừ 18 máu.

### 41b — thịt/cá/hải sản tươi để được 2 ngày (người chơi: *"tăng thời gian thịt hỏng, ít nhất 1–2 ngày"*)
Thịt phải giữ lạnh nên hỏng nhanh gấp **2,6 lần** rau củ; vì vậy con số trong bảng phải lớn hơn mới ra 2 ngày thật:

| Nhóm | Bảng trước | Bảng sau | **Thời gian thật trong quầy không tủ** (đo bằng probe) |
|---|---|---|---|
| Thịt heo / ba chỉ / sườn / bò | 10 | **140** | 3,5–5 giờ → **58 giờ (2,4 ngày)** |
| Thịt gà / vịt | 9 | **128** | → **53 giờ (2,2 ngày)** |
| Tôm / cá / mực / cua / nghêu / sò | 7–8 | **116** | → **48 giờ (2 ngày)** |

Đo thật: sau 14 giờ thịt heo còn **78 %**, tôm còn **74 %**; sau 48 giờ heo còn 18 %, tôm/cá 1 % (sắp hỏng).
Có tủ đá/tủ đông thì lâu hơn nhiều; nắng gắt vẫn hao nhanh hơn. Bảng Kho quầy nay ghi *"thịt cá chưa nấu được 2 ngày"*.
Test cũ canh "thịt hỏng trong ngày" đã đổi thành "qua được ngày thứ nhất, tới ngày thứ hai mới hỏng".

### Kiểm chứng
- `tests/rau41.test.ts` — **18 bài mới**; `tests/health.test.ts` cập nhật 3 → 4 món thuốc + chỉ `daubung` chữa đau bụng.
- Tổng **497 bài / 39 tệp** pass; `tsc` sạch; `npm run build` OK.
- Probe `thit41b.mjs` (`errors: none`): thịt heo còn 58 giờ, gà 53 giờ, tôm/cá/mực/cua 48 giờ; để 14 giờ còn 74–78 % tươi.
- Probe `rau41.mjs` (`errors: none`): sau 12 giờ trong kho quầy còn `raumuong 113 · rauthom 91 · xalach 113 · carot 389 · cachua 233 · bapcai 389`, khoai tây/hành tây 324, **thịt heo 4 giờ**; một dĩa cơm 20 → 125 độ no; uống nước vòi 12 % (26/200 lần); đau bụng 90 → 87 máu sau 1 giờ, chip “Đau bụng 3h”, mua thuốc 12.000₫ là `còn đau = false`.
- Nhật ký trong game: bản **Lượt 41** ở đầu (bỏ bản 31 cho đúng trần 8 bản).
- Ảnh: `anh_ket_qua/android/56_nhat_ky_41.png`, `57_dau_bung.png`.
