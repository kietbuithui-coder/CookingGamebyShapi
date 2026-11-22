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

### 41c — trả lại mức "Cao" như cũ trên điện thoại (người chơi: *"đồ hoạ cao của đt khôi phục mức cũ đi, thấy không đẹp lắm"*)
Lượt 40 chặn pixel ratio điện thoại ở 1,25 cho **mọi** mức — kể cả "Cao", nên ai chọn Cao vẫn bị mờ. Nay:
```ts
const prMax = ctx.mobile && q.pr < 1.5 ? Math.min(q.pr, 1.25) : q.pr;
```
Chỉ các mức dưới 1,5 điểm ảnh mới bị hạ trần; **"Cao" giữ nguyên 2 điểm ảnh + bóng đổ 2048 + 4 đèn + 32 NPC**.
Mức "Vừa" (mặc định điện thoại) vẫn nhẹ như lượt 40 — đó mới là mức chống giật.

Đo trên trình duyệt điện thoại 390×844 DPR 3 (`cao41c.mjs`, `errors: none`): mức Cao → `pixelRatio 2`, `shadowMap true`, `mapSize 2048`, `viewDist 210`, `lights 4`; mức Vừa → `pr 1`, `shadowMap false`, `lights 1`.
Cài đặt hiện đúng nút "Cao ← đang chọn". Ảnh: `anh_ket_qua/android/59_dt_muc_cao.png`, `60_cai_dat_muc_cao.png`.

### Kiểm chứng
- `tests/rau41.test.ts` — **18 bài mới**; `tests/health.test.ts` cập nhật 3 → 4 món thuốc + chỉ `daubung` chữa đau bụng.
- Tổng **497 bài / 39 tệp** pass; `tsc` sạch; `npm run build` OK.
- Probe `thit41b.mjs` (`errors: none`): thịt heo còn 58 giờ, gà 53 giờ, tôm/cá/mực/cua 48 giờ; để 14 giờ còn 74–78 % tươi.
- Probe `rau41.mjs` (`errors: none`): sau 12 giờ trong kho quầy còn `raumuong 113 · rauthom 91 · xalach 113 · carot 389 · cachua 233 · bapcai 389`, khoai tây/hành tây 324, **thịt heo 4 giờ**; một dĩa cơm 20 → 125 độ no; uống nước vòi 12 % (26/200 lần); đau bụng 90 → 87 máu sau 1 giờ, chip “Đau bụng 3h”, mua thuốc 12.000₫ là `còn đau = false`.
- Nhật ký trong game: bản **Lượt 41** ở đầu (bỏ bản 31 cho đúng trần 8 bản).
- Ảnh: `anh_ket_qua/android/56_nhat_ky_41.png`, `57_dau_bung.png`.

### 42 — nút nhảy thật sự vượt được vật thấp (người chơi: *"làm nút nhảy có thể thật sự chạy qua các vật hoặc cấu trúc thấp"*)
Người chơi chọn **mức 1** (nhảy cao + bỏ va chạm khi đang bay) và **tất cả vật thấp dưới ~1 m**, kể cả nội thất trong nhà.
Không làm mức 2 (đứng/đi trên nóc vật) và mức 3 (trèo mái nhà) — đã nói thẳng là quá phức tạp và không cần.

Va chạm trước đây là 2D hoàn toàn nên `Box2` không có chiều cao. Nay:
```ts
export interface Box2 { x0: number; z0: number; x1: number; z1: number; top?: number }   // top bỏ trống = tường vô hạn
const over = (o: Box2 | Circ, feet: number) => o.top !== undefined && feet >= o.top - 0.02;
```
`world.resolve(x, z, r, out, feet = 0)` bỏ qua vật nào `over()`; thêm `lowTopAt(x, z)` (nóc vật thấp dưới chân) và `isLow()`.
`Builder.collide(..., top?)` và `wall()` nay tự gắn `top` cho thanh thấp dưới 1,4 m.

Nhảy `vy 3.4 → 4.86` → đỉnh **0,99 m** (công thức `vy²/(2·12.5)`). Vòng lặp di chuyển truyền `this.jumpY` vào `resolve`, và
đáp xuống nóc vật thấp thì đứng trên đó (`jumpY = top`), bước ra mép là rơi — nhờ vậy rơi trúng đồ không bị kẹt.

**Đã khai báo `top` cho 80 vật**: ghế đá 0,6 · thùng rác 0,93 · bàn nhựa trà đá 0,5 · két nước 0,45 · bàn cờ ông Tư 0,52 ·
băng ngồi chợ 0,45 · kệ/bàn/quầy thấp trong nhà 0,83–0,89 · lề đường theo chiều cao thật của nó.
Đo trên 390×844 DPR 2 (`nhay42.mjs`, `errors: none`): đỉnh nhảy **0,99 m**; ghế đá đẩy ra 0,55 m khi đứng dưới đất, đang bay 0,9 m thì lệch 0,000;
tường nhà thử ở độ cao 0 · 1 · 5 · 20 m đều **không lọt vào**; 80 vật thấp / 669 tường cao.

### 43 — MỨC 2: đứng và đi lại trên nóc vật thấp (người chơi: *"continue mức 2"*)
Lượt 42 chỉ cho **bay qua**. Nay đứng hẳn trên nóc được:

- `world.lowTopAt(x, z, r = 0.1)` — nóc vật ngay dưới chân (bán kính nhỏ để không "đứng trên không" ở mép).
  Vật tròn (thùng rác) chỉ đỡ khi tâm người nằm trong `r * 0.8`, tức là đứng thật trên miệng thùng.
- `world.supportAt(x, z, feet)` — nóc chỉ được tính nếu `top <= feet + 0.02`.
- `blocked(x, z, r, feet = 0)` — trước đây luôn tính `feet = 0`, nên đứng trên ghế là bị đá văng ra. Nay người chơi truyền `this.jumpY`.
- `Player.jump()` — đứng dưới đất: `vy = 4.86` (0,99 m). Đang trên nóc: chỉ thêm **0,5 m** và không bao giờ vượt 0,98 m,
  nên không thể nhảy vọt từ ghế đá lên mái nhà hay nóc cao hơn.
- Vòng lặp độ cao viết lại: `if (vy !== 0 || |jumpY - floor| > 0.02)` → rơi tới `floor` thì dừng; bước ra khỏi mép (`floor` tụt về 0) là rơi.
  Tiếng bước chân khi tiếp đất chỉ kêu khi rơi thật (trên 0,12 m hoặc vận tốc < −1,6), không kêu lạch cạch mỗi khung hình.

**Bẫy đã phát hiện và bịt:** `shell()` khai báo **bệ cửa sổ** bằng `b.collide(op.x0, 0, op.x1, 0.2)` (0,8–1,1 m).
Phía trên cửa sổ không có vật cản nào khác, nên nếu gắn `top` cho bệ thì người chơi **nhảy qua bệ cửa sổ chui vào nhà người ta**.
Đã bỏ `top` ở dòng đó (kèm ghi chú), nhờ vậy số vật thấp giảm 97 → **80** và tường/cột còn 669.
`traffic.ts` vẫn giữ luật cũ: `jumpY < 0.9` (xe máy) / `< 1.45` (ô tô) mới bị đụng — đứng trên nóc vẫn an toàn.

Đo trên 390×844 DPR 2 (`noc43.mjs`, `errors: none`): nhảy lên ghế đá → `jumpY 0.6`, đứng yên 2 giây vẫn 0,6; đi 1,2 m trên mặt ghế vẫn ở 0,6
và **không lệch ngang** (0,00 m); đi hết mặt ghế → rơi về 0; đứng trên nóc nhảy tiếp → đỉnh 1,01 m rồi về đúng 0,6; thùng rác đứng giữa 0,93, ra ngoài → 0;
vẫn qua được ghế khi bay 0,9 m và vẫn bị chặn khi chỉ bay 0,2 m. Ảnh: `anh_ket_qua/android/62_dung_tren_noc.png`.

### 44 — nhảy qua bồn hoa / hồ nước / xe máy + sửa chữ dính khi bới thùng rác
Người chơi gửi ảnh bồn hoa công viên: *"nhảy qua đc cái này 1 bồn nước cv và xe nx, sửa lỗi chữ bị dính khi lục đồ thùng rác"*.

- `Builder.circle(lx, lz, r, top?, kind?)` — vật tròn nay cũng khai báo được chiều cao. Bồn hoa 0,42 m (8 cái quanh hồ),
  xe máy 0,75 m (69 chiếc), thùng/sọt quanh chợ lấy đúng chiều cao vừa vẽ (0,3–0,7 + 0,12).
- Hồ nước công viên: thành hồ 0,62 m **nhảy qua được**, nhưng thêm `kind: 'trough'` → `lowTopAt()` bỏ qua nó
  (mặt nước không đỡ được ai), `jump()` từ trong nước trả `false`, và độ cao chân luôn về 0.
  Nhờ vậy nhảy vào hồ là chìm xuống đáy, **không lơ lửng trên mặt nước**.
- Hàng rào chợ nâng 1,25 → **1,45 m** để không lọt vào diện "vật thấp nhảy qua được" (wall() tự gắn top cho mọi thanh < 1,4 m):
  chợ vẫn phải đi cổng.
- Chữ dính: `rummage()` trước đây gọi `ui.float()` cho **từng món** ở cùng một toạ độ → "+2 Chai nhựa" đè lên "+1 Lon nhôm".
  Nay gộp thành một dòng (`+1 Chai nhựa · +2 Lon nhôm`), và `ui.float()` tự xếp lớp: chữ nào nổi ở cùng chỗ (< 0,4 m)
  thì nâng lên 0,34 m mỗi lớp, không bao giờ đè nhau.

**Sửa luôn bài test chập chờn:** `tests/hong.test.ts` ("thịt qua được một ngày") thỉnh thoảng hỏng vì **thời tiết ngẫu nhiên**
(nắng gắt ×1,7 làm hỏng sớm, se lạnh ×0,6 thì lâu). Nay ghim `g.weather` về "nắng đẹp" trong bài đó — chạy 10/10 lần pass.

Đo trên 390×844 DPR 2 (`muc44.mjs`, `errors: none`): bồn hoa 8 cái, nóc 0,42; đi bộ lệch **1,55 m**, nhảy qua lệch **0,000**;
thành hồ 0,62 đi bộ chặn / nhảy qua được / `lowTopAt` = 0 / `troughAt` = true; đứng giữa hồ: `jump()` = false, độ cao 0;
69 xe máy yên 0,75 đi bộ chặn, nhảy qua được; bới 4 thùng rác: mỗi lần **đúng 1 dòng chữ**, **0 cặp chồng**.

### 45 — điện thoại: vừa đi vừa nhảy / vừa đi vừa đấm (người chơi: *"sửa android chưa vừa chạy/đi vừa nhảy/đấm đc"*)
Đo bằng CDP hai ngón thật trên giả lập Android 390×844, cả 3 khâu đều hỏng:
- đang giữ cần ảo + chạm nút Nhảy → `clicks=0`, `jumpY=0`, **`mz` tụt về 0**, `stick=false`: không nhảy, mất luôn cần ảo.

Ba nguyên nhân, sửa cả ba:
1. `#act2 button` nằm trong `#ui` (mà `#ui { pointer-events: none }`) nhưng không bật `pointer-events: auto`
   → ngón thứ hai **xuyên qua nút**, rơi xuống canvas và bị canvas cướp. Nay bật cả trong CSS **và** bằng JS
   (`b.style.pointerEvents = 'auto'`) để không phụ thuộc thứ tự nạp CSS.
2. Nút dùng `onclick` (chỉ chạy khi `pointerup`), mà cử chỉ 2 ngón hay bị huỷ giữa chừng → nay `pointerdown` + `preventDefault` + `stopPropagation`.
3. Canvas nghe cả `pointerout` / `pointerleave` → vừa rời ngón là **nhả cần ảo**. Nay chỉ nghe `pointerup` / `pointercancel`,
   và `setPointerCapture` chỉ gọi khi **thật sự** bắt đầu cần ảo / vuốt nhìn (trước đây chiếm mọi `pointerdown`).

Đo lại trên cùng giả lập (`errors: none`):

| Bước | Kết quả |
|---|---|
| đang đi | `mz 0,86` · `stick true` · đã đi 0,64 m |
| **+ bấm NHẢY** | `jumpY 0,78` **và** `mz 0,86` — vừa nhảy vừa đi |
| đi tiếp | `jumpY 1,04` · đi 2,09 m — cần ảo không rơi |
| **+ bấm ĐẤM** | `punchCd 0,75` **và** `mz 0,86` — vừa đấm vừa đi |
| nhấc hết tay | `mz 0` · `stick false` — dừng đúng |

PC kiểm tra lại không hỏng gì (900×560, tắt cảnh 3D cho headless đủ khung hình): W đi (`mz 1`), W+Space nhảy 0,81 m **vẫn đi**,
W+F đấm `punchCd 0,7` **vẫn đi**, kéo chuột nhìn quanh trong lúc đi vẫn đi, nhả tay dừng đúng.

### 46 — ít mưa hơn + giảm 40 % giá thuê ở chợ và công viên (người chơi: *"giảm tỉ lệ lệ trời muă và giảm giá thuê ở chợ cv đi 40%"*)
**Mưa.** Bảng chuyển thời tiết `WEATHER[].next` (src/data/world.ts) — không phải sửa tỉ lệ "mỗi ngày", mà sửa trọng số chuyển tiếp:

| Từ | Trước | Sau |
|---|---|---|
| Nắng đẹp | mưa nhỏ 2 · mưa to 0,6 | mưa nhỏ **0,9** · mưa to **0,25** (nắng 3→3, nắng gắt 2,5→2,8) |
| Nắng gắt | giông 2 · mưa nhỏ 1,2 | giông **1,2** · mưa nhỏ **0,6** (nắng gắt 1→1,6) |
| Mưa nhỏ | mưa to 2 | **0,6** (nắng 3→3,2, se lạnh 1,2→1,4) |
| Mưa to | mưa nhỏ 3 | **1,2** (nắng 1,5→3) |
| Giông | mưa to 2 · mưa nhỏ 2 | **0,6 / 1,2** (nắng 2→3) |
| Gió lớn / Se lạnh | mưa 1,5 | **0,7** |

Đo bằng đúng luật của game (chạy 40.000 lần `nextWeather`):
**37,2 % → 18,2 % thời gian có mưa** — mưa nhỏ 21,8 → 11,1 %, mưa to 9,7 → 2,6 %, giông 5,8 → 4,4 %.
Đo lại trong game chạy thật (3.000 lần `setWeather` trên trình duyệt): **18,9 %**. Nắng vẫn là thời tiết phổ biến nhất (1268/3000).

**Giá thuê.** Có hai con số khác nhau, sửa cả hai cho khỏi lệch:
- Phí chỗ hằng ngày (`SPOTS` trong `src/world/layout.ts`): Cổng Chợ **30.000 → 18.000₫**, Cổng Công Viên **20.000 → 12.000₫**.
- Giá thuê chi nhánh (`BRANCH_SITES` trong `src/data/gear.ts`): chợ **120.000 → 72.000₫**, công viên **90.000 → 54.000₫**.
- Chỗ khác giữ nguyên: Phố Văn Phòng 60.000₫ phí chỗ / 150.000₫ chi nhánh, Hẻm 0₫.

Đo trên trình duyệt bằng chính hàm thu tiền (`stallRent` / `payStallRent`): `cho 18.000`, `cv 12.000`, `vp 60.000`, `hem 0`;
thu tiền thật thì ví trừ đúng **18.000** và **12.000**, `paidDay` khớp ngày. `branchSite` trả 72.000 / 54.000 / 150.000.

### 47 — hotfix: điện thoại mở lên không vào được menu (màn hình đen)
**Tái hiện đúng lỗi.** Chặn tệp JS của bản build (như khi mạng chập chờn, hoặc service worker đời cũ trả về tệp JS đã bị xoá sau một lần cập nhật) rồi mở trên khung 390×844:
`document.body.innerText` = **rỗng**, **0 nút** bấm được, ảnh chụp chỉ một màu `#1b1512` trơn. Đo được: `#bootload`/`#booterr` **không tồn tại** vì toàn bộ giao diện do JS dựng; còn service worker cũ thì "bộ nhớ đệm trước" cho cả trang lẫn tài nguyên → điện thoại kẹt vĩnh viễn ở bản cũ, tệp JS cũ đã bị xoá nên 404.

**Sửa.**
- `index.html`: tự mang `#bootload` (Đang dựng thành phố…) + `#booterr` (bảng báo lỗi) + 2 nút **Thử lại** / **Sửa lỗi tải** + CSS riêng, tất cả nằm ngay trong trang nên **không phụ thuộc tệp JS/CSS của game**. Bắt lỗi bằng: sự kiện `error` của thẻ `<script>`, hẹn giờ 15 giây, và `?reset` để xoá bản cũ. "Sửa lỗi tải" xoá `caches` + `serviceWorker.unregister()` rồi mở lại `?v=<thời gian>` (giữ nguyên tiến trình trong localStorage).
- `src/main.ts`: gọi `__boot.stage()` khi dựng xong khung hình, `__boot.ok()` khi menu thật đã lên, và `__boot.fail(...)` trong `boot().catch(...)` → không bao giờ còn màn hình đen câm.
- `public/sw.js` (và bản trong `docs/`): `ganhhang-v1 → v2`, đổi sang **mạng trước, mất mạng mới dùng bản lưu** cho cả trang lẫn tài nguyên.
- `devPoints.ts`: thêm nhóm "Kiểm tra bộ nhớ đệm & bản đang chạy" và "Sửa lỗi tải" để người chơi tự cứu máy mình ngay trong Cài đặt.

**Đo lại trên bản build (390×844, DPR 3).**
| Tình huống | Kết quả |
|---|---|
| Chạy bình thường | menu lên, bảng lỗi **ẩn**, chữ chờ ẩn ✔ |
| Tệp JS 404 | bảng lỗi **hiện**, lời báo đúng, nút "Sửa lỗi tải" **111×47 px**, `elementFromPoint` = chính nút → bấm được ✔ |
| Bấm "Sửa lỗi tải" | `caches` `["ganhhang-v2"]` → **`[]`**, địa chỉ thành `?v=…` ✔ |
| CPU chậm 6× | vẫn lên menu sau **5,1 s** (bình thường 1,5 s) — không phải lỗi máy yếu ✔ |

### 48 — ngủ ở trọ/khách sạn đỡ tụt chỉ số, ghế đá tốt hơn, biển chỗ bán hết sai giá
Người chơi: *"ngủ ở bệnh viện, khách sạn và trọ… đồ ăn, nước chỉ số tụt sẽ giảm đi đáng kể (không tụt nhiều) · tăng nhẹ hiệu quả nghỉ ở ghế đá · làm lại 2 biển chỗ thuê đang sai giá"*.

**1. Ngủ (`src/sim/rules.ts` · `tickStats`).** Thêm hệ số theo chất lượng chỗ ngủ:
`rest = clamp((sleepQ − 0,4)/0,9, 0, 1)` · `drainMul = 1 − 0,6·rest` → đói `0,045 → 0,03·drainMul`, khát `0,06 → 0,04·drainMul`.
Đo 8 tiếng ngủ (480 phút game), bắt đầu đói 60 / khát 60:

| Chỗ ngủ | sleepQ | Đói | Khát | Năng lượng |
|---|---|---|---|---|
| Ghế đá | 0,5 | −13,4 | −17,9 | +42,9 |
| Gầm cầu | 0,6 | −12,5 | −16,6 | +50,2 |
| Nhà nghỉ | 0,9 | −9,6 | −12,8 | +69,9 |
| Phòng trọ | 1,0 | −8,6 | −11,5 | +75,7 |
| **Khách sạn** | 1,25 | **−6,2** | **−8,3** | **+89,1** |

**2. Năng lượng hồi chậm dần khi gần đầy** (`0,215·sleepQ·(0,35 + 0,65·(1 − energy/100))`).
Trước đây ghế đá và khách sạn **đều chạm trần 43** sau 8 tiếng (năng lượng 10 → 53 là trần vì test cũ chạy từ 10; thực tế cả hai đều đầy 100) nên chỗ ngủ xịn chẳng có lợi gì. Giờ khách sạn +89 so với ghế đá +43.

**3. Nghỉ ghế đá** (`acts.rest`): tinh thần **+7 → +9**, năng lượng **+4 → +6**, thời gian vẫn 20 phút, vẫn miễn phí. Lời mời tương tác ghi đúng "20 phút · tinh thần +9, năng lượng +6".

**4. Biển chỗ bán.** Có tới **ba** tấm biển ghi cứng giá cũ: chợ `30.000`, công viên `20.000` (trong `city.ts`) và **Phố Văn Phòng `60.000`** (trong `places.ts`, phát hiện khi đọc thẳng atlas chữ của biển ra ảnh). Giờ cả ba đọc thẳng từ `SPOTS`:
`feeText(fee)` trong `city.ts` và `SPOTS.find((q) => q.id === l.id)?.fee` trong `places.ts`. Chỗ phí 0 vẫn ghi "Hẻm Công Nhân — tự do".
Đọc lại atlas chữ vẽ ra: Mặt bằng Phố Văn Phòng **160.000**, Phố Văn Phòng **60.000**, Mặt bằng Khu Căn Hộ **120.000**, Hẻm "tự do". Hai biển chợ/công viên dùng đúng chuỗi `Phí chỗ 18.000₫/ngày` và `Phí chỗ 12.000₫/ngày` (đo trong trình duyệt: `SPOTS` trả 18000 / 12000, chuỗi sinh ra đúng).

### 49 — xe cộ chỉ chạy trên đường thật + 3 màu sơn mới + còi xe hơi riêng
Người chơi: *"sửa các xe sau cho chúng không xuất hiện từ chỗ không hợp lí (chỗ gầm cầu là 1 ví dụ), thêm 3 màu cho xe và tiếng còi cảnh báo của xe hơi"*.

**Lỗi gốc.** `Traffic` chỉ biết tâm tuyến (`CORR`) rồi đặt xe vào làn và chạy thẳng, trong khi mặt đường thật chỉ có trong `z ∈ [−92; 92]`, `x ∈ [−96; 96]` (`ground()` trong `city.ts`). Ngoài khoảng đó là **bãi đất gầm cầu** (z 94,5–107), **bờ kênh** (z ≥ 108,4) và đất trống hai bên → xe "mọc" từ gầm cầu và chạy xuyên bãi rác.

**Sửa: tách luật đường đi ra `src/game/roads.ts`** (không phụ thuộc 3D nên kiểm thử được):
- `roadSpan(axis, sign, road)` — mặt đường thật theo chiều xe chạy: dọc trục x là −92 → +92; dọc trục z, ba tuyến giữa −92 → +92, còn vành ngoài ±88,5 chỉ nối tới giao lộ cuối (nam 88,5, bắc 92).
- `pickSpawn(...)` — sinh xe **sau lưng** người chơi 35–85 m (lùi dần nếu sát mép), nếu hết chỗ phía sau thì nhận điểm rất xa phía trước (≥ 140 m), **không bao giờ kẹp vị trí** (kẹp = hiện ra trước mặt). Tuyến vành ngoài hết chỗ thì tự rẽ sang tuyến giữa. Không còn chỗ nào hợp lệ → `pos: null`, hệ xe **hoãn** (ẩn, thử lại sau 0,5 s) thay vì đặt bừa.
- `inWasherGround(x, z)` — chốt an toàn trong `update()`: lỡ xe rơi vào bãi gầm cầu thì sinh lại ngay.
- Chạy hết mặt đường (`front`) thì sinh lại từ phía sau, không phóng ra bãi đất.

**Màu & còi.** `CAR_EXTRA_COLORS = [đỏ đô #8e2b2b, xanh rêu #2f5f4a, vàng taxi #e0b235]` — mỗi mẫu xe con 3 màu cũ + 3 màu mới (xe tải thêm 3 màu thùng riêng).
Phát hiện khi đo: hệ xe **tái dùng cùng một mesh** cho mỗi "chỗ" trên đường, nên cả phiên chơi chỉ thấy đúng màu ban đầu → thêm `repaint()` sơn lại mỗi lần xe vào lại đường (đo được **31 geometry** khác nhau sau 30 lần vào lại).
Còi: `CarSpec.horn` = `beep` (Matiz — "bíp bíp" 880/1100 Hz) · `honk` (Corolla, CD5 — "bìm" 370/466 Hz) · `truck` (xe tải — "bừm" 196/247 Hz, ngân 0,42 s). Ba tiếng mới `horn_beep`/`horn_honk`/`horn_truck`; xe máy/xe đạp vẫn dùng `horn` cũ.

**Đo trên trình duyệt (game chạy thật, `?debug`).**
| Phép đo | Kết quả |
|---|---|
| 6.000 khung hình × 6 vị trí người chơi (có gầm cầu) | 1.200 lượt kiểm: **0 ngoài đường, 0 trong bãi gầm cầu** |
| 1.000 lượt kiểm ở gầm cầu (đứng tại `49, 100`) | **0 xe** trong bãi |
| Sơn lại 30 lần | **31 geometry khác nhau**, kho màu 6 |
| Ảnh chụp 6 xe cạnh nhau | vàng taxi · xanh rêu · đỏ đô hiện rõ cạnh 3 màu cũ |

### Kiểm chứng
- `tests/xe49.test.ts` — **13 bài mới**: bãi gầm cầu/bờ kênh không có đường, mọi tuyến không vượt 92, vành ngoài là đường cụt, sinh 5.000 xe ở mọi hướng đều nằm trên đường (0 lọt bãi), không sinh xe trước mặt, 3 màu mới (6 màu/mẫu, không trùng), ba kiểu còi đúng tần số và dùng đúng chỗ.
- `tests/nghi48.test.ts` — **11 bài mới**: mức tụt đói/khát theo từng chỗ ngủ (khách sạn < 60 % ghế đá), chỗ tử tế giảm ≥ 20 %, vẫn tụt chút ít, năng lượng theo chất lượng giường, ghế đá +9/+6, và **mọi** biển đọc giá từ `SPOTS` (không còn chuỗi 30.000 / 20.000 / 60.000 ghi cứng).
- `tests/boot47.test.ts` — **7 bài mới** canh: bảng báo lỗi + 2 nút có trong trang, xoá cache/SW, hẹn giờ 15 s, bắt lỗi thẻ script, CSS nằm trong trang, `?reset`, và service worker v2 "mạng trước".
- `tests/mua46.test.ts` — **8 bài mới** (tỉ lệ mưa 3 hạt giống, nắng vẫn nhiều nhất, phí chỗ + thuê chi nhánh giảm 40 %, chỗ khác không đụng).
- `tests/android45.test.ts` — **4 bài mới** canh đúng 3 nguyên nhân trên.
- `tests/muc44.test.ts` — **3 bài mới** (bồn hoa, xe máy, hồ nước).
- `tests/nhay42.test.ts` — **7 bài mới** (lượt 42) + **3 bài mức 2** (lượt 43): nhảy qua ghế đá, vẫn chặn khi chưa đủ cao, tường cao chặn ở mọi độ cao, `lowTopAt` đúng.
- Tổng **560 bài / 46 tệp** pass; `tsc` sạch; `npm run build` + `build:pages` OK.
- Nhật ký trong game: bản **Lượt 49** ở đầu (bỏ bản 41 cho đúng trần 8 bản).
- Ảnh: `/tmp/probe/nhay42/66_nhay.png`.

### 50 — soát giao diện trên màn thấp (báo cáo, không phải bản phát hành)

**Lượt này không sinh ra mã và không có commit riêng.** Nó là một vòng *soát* giao diện: chạy probe trên khổ màn thấp
(740×360) rồi liệt kê chỗ hỏng để lượt sau sửa. Vì vậy đừng tìm commit hay PR tên “Lượt 50”.
Báo cáo này chỉ còn được nhắc trong commit message của lượt 51 — chi tiết gốc không nằm trong repo.

Những gì lượt 51 phải sửa (suy ra từ danh sách đó, đã **xác minh lại trong mã** ngày 2026-11-21):

| Chỗ hỏng | Bằng chứng trong mã hiện tại |
|---|---|
| Ô mục tiêu đè lên thanh chỉ số khi cửa sổ hẹp | `ui.ts:228 fitQuest()` — đo `#hud-tl`/`#hud-tr` rồi bật `.qlow` |
| Chữ HUD nhỏ, số chỉ số không đọc được | `style.css:6` `clamp(12.5px, …)` · `.stat .n` chỉ hiện khi < 45 (sau đó **bỏ hẳn**, xem dưới) |
| Nút dưới 44 px | `style.css:37 .ib` 2,5em · `#act2 button` min 44 px · `#cook .quit` |
| Toast chồng thành mảng giữa màn hình | `ui.ts toast()` — chỉ giữ 2 thẻ |
| Bấm lại phím tắt (M/B/Tab/P) không đóng bảng | `ui.ts panel()` — `TABS_CLOSE` |
| Chạm xa vẫn tương tác nhầm | `interact.ts:25 TAP_REACH = 1.3`, `tapRadius()` |
| Nút Chạy không có nhãn, ngưỡng chạy 0,93 gần như không bấm được | `input.ts RUN_AT = 0.8` · nút đổi nhãn ĐI/CHẠY |
| “Bỏ dở” mất cả mẻ khi lỡ tay | `ui.ts` — bấm lần đầu đổi nhãn “Chắc chưa?” |

### 51 — sửa hết mục báo cáo lượt 50 (giao diện màn thấp + điều khiển máy tính)

Commit `a152a6f`. Chủ yếu là **CSS + vòng đời giao diện**, không đụng luật chơi kinh tế và **không thêm tệp test mới**
(giữ chốt `changelog` = Lượt 49, `devpoints` = lượt 49 theo quy tắc menu ẩn). Tổng kết: `tsc` sạch · **560/560** test ·
`build` + `build:pages` OK.

**Giao diện (src/ui/style.css, +57/−21):**

- `#ui` cỡ chữ gốc `clamp(12.5px, 3.5vh, 17px)`; màn hẹp `clamp(12.5px, 3.6vw, 16px)`.
- Ô mục tiêu: `max-width: min(40vw, 34em, max(12em, calc(100vw − 56em)))` để chừa chỗ cho **cả hai** khối HUD;
  thêm `.qlow` (kèm `!important`) đẩy ô mục tiêu + chip hướng đi + chip sự kiện xuống dưới HUD khi hai khối bên
  chạm vào nhau.
- `.ib` 2,5em; `#act2 button` ≥ 44×44 px; `#cook .quit` ≥ 44 px; `.qmin` ≥ 30 px.
- `#hud-tl` xuống `.5em` ở màn ≤ 540 px chiều cao; `#runb` right 8,4em · `#act2` right 12,9em (hết chồng nhau).
- ~~`.stat .n` hiện số thật khi chỉ số < 45~~ → **đã bỏ cùng ngày** (người chơi: *"mình hong muốn có 2 số đó"*):
  hai con số chen giữa hai thanh chỉ số trông rối, và màn hẹp thì hai thanh sát nhau nên số dễ bị hiểu là của thanh bên cạnh.
  Mức thấp vẫn báo bằng **thanh đỏ + nhấp nháy** như trước; số chính xác vẫn xem được trong lời giải thích (rê/chạm).
  Đã xoá cả `<span class="n">` trong `ui.ts` và luật `.stat .n` trong `style.css`.

**Đo được (probe 740×360, 640/740/844 cho màn nấu ăn):** `qlow` top **81 px**, chồng `#hud-tl` = **0**;
`#cook .top` chồng 0 ở cả ba khổ; toast tối đa 2 thẻ (~57–74 px).

**Điều khiển & vòng đời (TS):**

- **Chạm để tương tác phải đứng đủ gần** (`interact.ts`): `TAP_REACH = 1.3 m` — trước đây chỉ cần trong bán kính
  tương tác (tới 2,6 m) nên đang xoay camera quanh quầy là mở bảng Quầy. `tapRadius()` = `max(44, 7,5 % chiều cao)`
  thay cho `max(64, 11 %)` (màn thấp bấm nhầm nhiều).
- **Cần ảo**: vùng nhận tính từ **12 %** chiều cao (trước 28 %) — trên 740×360 vùng cũ đã bị HUD chiếm hết;
  `RUN_AT = 0,8` (trước 0,93 chỉ còn ~4 px hữu dụng ở mép cần).
- **Khoá con trỏ chuột** (tuỳ chọn mới `Settings.mouseLock`, mặc định tắt): rê chuột là xoay, Esc nhả khoá thì có
  toast giải thích, không bám khoá lại ngay.
- **Nút cảm ứng trên máy tính** (`Settings.touchBtns`, mặc định chỉ bật trên điện thoại) + mục Cài đặt mới.
- **Phím Z xoay phải** (`player.ts`) — nhánh `e && false` trước đây là mã chết, máy tính không có phím xoay phải.
- **Xoá bản lưu** (`ctx.resetSave`, `SAVE_KEY`) trong Cài đặt — bấm hai lần mới xoá (lần đầu chỉ hỏi lại, tự hết hạn 5 s).
- **`fitQuest()`** đo HUD thật rồi đặt `--q-top`/`.qlow`; chỉ ghi style khi giá trị đổi (không tính lại bố cục mỗi khung hình).
- **Bấm lại phím tắt để đóng bảng** (`TABS_CLOSE`: túi, sổ tay, bản đồ, điện thoại).
- **Tooltip**: chạm để mở và **giữ**, chạm lại đúng biểu tượng thì tắt (trước tự tắt sau 2,8 s khi đang đọc).
- **“Bỏ dở” mẻ nấu**: bấm lần đầu chỉ đổi nhãn thành “Chắc chưa?” trong 3 s.
- **Toast** tối đa 2 thẻ cùng lúc (trước 4–5 thẻ dựng thành mảng ~200 px giữa tầm nhìn).
- **Màn dọc**: nút “Cứ chơi dọc” nhớ lựa chọn (`portraitOk`) — tải lại trang không bị lớp phủ che nút Chơi mới/Chơi tiếp.
- **FPS mặc định tắt trên điện thoại** (con số chỉ dành cho người chỉnh đồ hoạ).
- **Nút Chạy** có nhãn **ĐI/CHẠY** + nhắc một lần (`ui.runTip`, lưu vào cài đặt nên không nhắc lại).
- Cài đặt có mục “Cách điều khiển” viết rõ phím cho máy tính và điện thoại.

**Chưa kiểm được:** probe lượt này chạy trên Chrome không giao diện (không GPU) nên FPS thật, cảm giác chạm trên
điện thoại thật, và pointer-lock trên Safari/iOS vẫn chưa ai thử. Không có test tự động mới cho lượt này —
`tools/probe/steps/` là lưới an toàn duy nhất.

---

## Lượt 52 — Ông Bảy gợi ý đúng lúc ✅ đã xong

**Người chơi:** *"tạo 1 pull rq cho repo… đọc các thứ cần thiết trong repo"* → làm tiếp mục 3 của `TODO.md`:
`case 'hobo'` bốc ngẫu nhiên trong 6 câu viết sẵn, không biết người chơi đang ở đâu trong ván.

### Luật mới: `src/sim/advice.ts` (thuần, test được trong Node)

`advice(g, where)` trả về mảng câu **đã sắp theo mức cấp thiết**, mỗi câu `{ id, text, place, urgent }`:
máu < 30 → bệnh viện · đói/sức < 20–25 → quán cơm nếu đang mở, không thì chùa 11–13h, không nữa thì
MiniMart/Tạp hoá còn mở · tiền < 30.000₫ → bến bốc hàng (4h30–10h) → rửa chén Bà Tư → bảng việc làm ·
chưa có gánh → Đồ Nghề Ba Tài (7–20h) / gầm cầu · có quầy → nhắc đặt xuống, mở bán, giờ đông nhất
(`hourCurve` của đúng khu), **món thiếu nguyên liệu + sạp đang mở bán món đó** · nợ Hùng Sẹo ≤ 2 ngày →
số tiền + số ngày (đêm: nói rõ 9h sáng mới gặp) · sắp mưa → áo mưa · 22h–5h → về đúng căn đang thuê
(`HOME_LANDMARK`). Không câu nào gấp → câu chung, cũng chỉ vào chỗ **đang mở**.

### Dữ liệu & phụ thuộc

- `src/data/landmarks.ts` — **31 đích đến**: mã, tên, `anchor` hoặc `spot`, cờ `always` (dùng được bất kể giờ),
  `openWith` (Chợ Xóm Chiều gộp 7 sạp: một sạp mở là chợ dùng được), `HOME_LANDMARK`. Bản đồ và lời khuyên
  cùng đọc danh sách này nên không lệch nhau.
- `src/data/hours.ts` — `PLACE_HOURS` rời khỏi `game/npc.ts` (tệp có three/DOM) để `sim` đọc được;
  `game/npc.ts` **re-export đúng tên cũ**, thêm `R.placeOpenAt(g, id)` dùng chung.
- `Acts.places()` đọc `LANDMARK_LIST`; thêm `placeOf(id)` / `goPlace(id)` để nút ghim đường đi dùng chung
  cơ chế cột sáng vàng với Bản đồ.

### Trong hộp thoại (`acts.ts`, `case 'hobo'`)

Câu đầu = câu cấp thiết nhất (kèm khoảng cách thật tới neo), nút **“Chỉ con đường tới …”** ghim `acts.way`,
thêm tối đa 2 câu khác đang đúng. `rememberAdvice` giữ 3 mã câu gần nhất (`g.flags.hoboSeen` chỉ để biết đã
nói lần nào) nên ghé liền ba lần là ba câu khác nhau.

### Kiểm chứng

- `tests/hobo.test.ts` — **23 bài**: 120 trạng thái ngẫu nhiên (giờ, tiền, chỉ số, thời tiết, chỗ ở, nợ,
  quầy đóng/mở) → mọi câu trỏ đích **có thật** và **đang dùng được**; 9 tình huống cụ thể; không lặp câu;
  `shopFor` không chọn sạp đã đóng và trả `null` khi không chỗ nào đang bán; dữ liệu đích đến không trùng.
- Probe `tools/probe/steps/hobo.mjs` (844×390, Chrome không giao diện) — 4 trạng thái, ảnh trong
  `tools/probe/out/hobo_*.png`; bấm nút ghim thì `acts.way` = “MiniMart 24h (17, 22)”, console sạch.
- `npm test` 583/583 (47 tệp) · `npm run typecheck` ✅ · `npm run build` ✅.

### Menu ẩn: cập nhật nội dung + đặt mã PIN

- **Nội dung làm mới theo lượt 52**: *Ông Bảy đang khuyên gì lúc này?* (in cả danh sách câu đang đúng, kèm mức cấp
  thiết), *Tele tới gầm cầu, hỏi Ông Bảy ngay*, *Soát 96 mốc giờ* (quét 0h→23h45, đo được **316 câu / 0 câu sai**).
  Nhóm tele thêm **Gầm cầu — Ông Bảy** và **MiniMart 24h**.
- **Mã PIN `7777`** (`DEV_PIN`, hàm thuần `devPinInput()`): bấm 7 lần chữ “Cài đặt” → bàn phím số 4 chấm → gõ đúng
  mới vào. Mở đúng một lần thì nhớ trong phiên chơi; “Ẩn & khoá lại” thì lần sau phải nhập lại. Không phải bảo mật —
  chỉ để người chơi không vô tình mở bảng test (đã ghi rõ trong README).
- Test `tests/devpoints.test.ts` (6 bài, thêm 4 bài cho PIN): mã đúng 7777, nhập đủ thì mở, sai một số là xoá sạch,
  không nhận số thứ 5, `777/7778/1111/0000/1234` đều không mở. Probe `tools/probe/steps/devpin.mjs` (40 bước):
  bấm sai 1234 → ở lại bàn phím; bấm 7777 → menu mở với 3 mục lượt 52 + 15 mục tele; chạy nút soát → “316 câu, 0 sai”;
  đóng/mở lại vẫn vào; “Ẩn & khoá lại” → phải nhập lại; console sạch.

**Chưa kiểm được:** đọc trên điện thoại thật (môi trường không có GPU); câu chữ dài trên màn dọc 390×844 —
probe lượt này chỉ chạy màn ngang. Chưa có câu cho sự kiện đang diễn ra (đã ghi vào `TODO.md`).

### Lượt 53 — thanh chạy hồi theo máu và pin

Người chơi hỏi: *"chỉnh lại tốc độ hồi của thanh dùng để chạy (nhanh chậm dựa theo sức và máu nhân vật)"*.
Hỏi lại ba câu trước khi làm, người chơi chọn: **máu + năng lượng**, đổi **cả hồi lẫn tụt**, máu thấp thì hồi
**khoảng một nửa**.

- `src/sim/rules.ts`: `staminaHpMul` (máu 20 ⇒ 0,5, sàn 0,3), `staminaEnergyMul` (pin cạn ⇒ 0,45),
  `staminaRegenMul` gộp lại = `clamp(hpMul · (0,6 + 0,4·pinMul), 0,28, 1)`, `staminaRegen(g, moving)`,
  `staminaDrain` (0,1 → tối đa 0,16/giây), `staminaRunSecs`, `staminaRefillSecs`.
- `src/game/player.ts`: hai hằng số cứng 0,1 / 0,05 / 0,09 thay bằng `staminaDrain(g)` / `staminaRegen(g, moving)`.
- `src/ui/ui.ts`: thanh thể lực có `data-tip` nói rõ hồi bao nhiêu phần trăm tốc độ, vì mất máu hay thiếu ngủ,
  chạy liền được mấy giây, cạn rồi chờ bao lâu.
- Menu ẩn làm mới theo luật “mỗi lượt thay mục test cũ”: bốn mục `stam_now` / `stam_compare` / `stam_hurt` / `stam_heal`;
  `DEV_BUILD_TAG` mô tả thanh chạy; `tests/devpoints.test.ts` cập nhật theo.
- `tests/stamina53.test.ts` (6 bài) + probe `tools/probe/steps/stam53.mjs` đo bằng đồng hồ mô phỏng sau khi giữ Shift thật:
  máu 90 → 0,09/giây, máu 20 → 0,045/giây, máu 20 + pin 10 → 0,037/giây, tụt khi chạy 0,1 → 0,13/giây.
- Changelog **Lượt 53** (7 dòng) + `tests/changelog.test.ts` trỏ sang bản mới; DESIGN §4.36 (bảng công thức) và §4.1;
  README mục “Thanh chạy”; PLAYBOOK cập nhật hằng số + số test/probe.
- `npm test` **593/593 (48 tệp)** · typecheck ✅ · `build:pages` ✅ · probe `errors: none` (ảnh `stam53_menu.png`,
  `stam53_compare.png`).

**Chưa kiểm được:** cảm giác chạy trên điện thoại thật (môi trường không có GPU); probe chạy 844×390 nên chưa đo lại
bố cục thanh thể lực trên màn dọc 390×844.

### Lượt 54 — bánh ở Tiệm bánh Anh Bảo + nước tăng lực Shapi

Người chơi xin ba việc: *“nước tăng lực có nhãn Shapi bán ở kệ minimart/tạp hoá”*, *“ở chợ thêm một số loại bánh ở tiệm
bánh mì và sửa tiệm bánh mì thành tiệm bánh”*, *“bánh no và vui vẻ tuỳ giá”*. Hỏi lại 4 câu trước khi làm, người chơi
chọn: **5–6 loại bánh chỉ bán sẵn (không thêm công thức)**, **Shapi hồi 30 % thanh giá 9.000₫**, **“Tiệm bánh Anh Bảo”**,
**no và vui tăng tuyến tính theo giá**.

- `src/data/ingredients.ts`: 5 bánh mới (`banhmique` 5.000₫, `banhtieu` 7.000₫, `banhbao` 12.000₫, `banhsu` 15.000₫,
  `banhbonglan` 25.000₫) + `shapi` 9.000₫; cột `Eat` thêm `st` (hồi thanh thể lực). No/vui theo công thức
  1.000₫ ≈ 1,6 no + 0,5 vui.
- `src/data/shops.ts`: `bakery` đổi tên **Tiệm bánh Anh Bảo**, bán 6 món; `mart` (22 ô) và `kiosk` (13 ô) thêm `shapi`.
- `src/sim/rules.ts`: `staminaGain`, `staminaAfter` (kẹp theo trần) — thanh thể lực nằm trên player nên sim chỉ cung cấp
  luật, `game/acts.ts` mới cộng vào thanh khi ăn/uống (`if (d.eat.st)`), gỡ `tired`, báo toast.
- `src/world/places.ts`: sạp chợ chia ô theo nhóm 8 (trước 5, tiệm bánh 6 món bị rơi mất 1), MiniMart 8+8+8 ô,
  tạp hoá 7+6 ô trên quầy, kệ giữa MiniMart thôi đăng ký ô trùng.
- Menu ẩn làm mới theo lượt: `banh_list` (bảng bánh), `banh_tele`, `shapi_drink` (uống thử), `shapi_tele`;
  `tests/devpoints.test.ts` cập nhật.
- `tests/banh54.test.ts` (8 bài) + probe `tools/probe/steps/banh54.mjs` (bấm thật: chạm ô, tính tiền, ăn, uống).
- Changelog **Lượt 54**, `tests/changelog.test.ts` trỏ sang bản mới (bản Lượt 45 rơi khỏi danh sách 8 bản).
  DESIGN §4.37 + README; PLAYBOOK cập nhật số test/probe/hằng số.

**Chưa kiểm được:** cảm giác ăn bánh trên điện thoại thật; probe chạy màn ngang 844×390 nên chưa xem lại quầy tạp hoá
13 ô ở màn dọc 390×844 (biển giá trên quầy dày 0,78 m — nếu chật sẽ phải giảm còn 6+6 ô).

### Vẽ lại hình 3 chiếc bánh (theo yêu cầu sau lượt 54)

Người chơi: *"vẽ lại bánh su kem, bánh tiêu và bánh mì que pa-tê (giống bánh mì nhưng dài và nhỏ hơn chứ)"*. Ba loại này
trước đó mượn hình chung (`long` / `round` / `round`) nên trên quầy giống hệt nhau.

- `src/data/ingredients.ts`: thêm ba mã hình `baguette`, `sesame`, `choux` và gán cho `banhmique`, `banhtieu`, `banhsu`;
  đổi màu cho khớp thực tế (vỏ bánh mì que vàng nâu, bánh tiêu vàng đậm, vỏ su kem nâu).
- `src/gfx/props.ts`: ba `case` mới trong `ingModel` — bánh mì que ngắn/mảnh, thon hai đầu, nứt dọc lưng, giấy gói
  quấn ngang một đầu; bánh tiêu đĩa dẹt phồng + 9 hạt mè; bánh su kem vỏ choux + kem trắng trên đầu.
- `tests/banh54.test.ts` thêm 1 bài canh hình riêng (không tái dùng `loaf`/`round`/`long`).
- Probe `tools/probe/steps/banhdraw54.mjs` (mới, chụp cận cảnh từng loại + đặt cạnh nhau) và ảnh `banh54_counter.png`
  trong `banh54.mjs`; `npm test` **602/602**; console sạch.

Bài học ghi vào PLAYBOOK: tự đặt `camera.position` trong probe **không ăn** — `player.update()` ghi đè mỗi khung hình,
phải dùng `player.camTo`.

---

## Lượt 55 — tên sạp Dì Sáu, khách không xuyên quầy, hết kẹt khi ngủ, buồng tắm có vòi sen ✅ đã xong

Người chơi: *"Trứng - Giò chả Dì Sáu đổi tên thành Trứng - Sữa - Giò Dì Sáu"* · *"sửa lỗi khi bán gánh ở chợ và cv npc
đi từng đằng sau lưng rồi đi xuyên qua quầy (đt pc đều bị)"* · *"sửa lỗi khi sử dụng giường nhà nghỉ / trọ người chơi
bị văng vào 1 khung gian khác và kẹt (có thể dời vị trí giường nếu cần), vẽ thêm chi tiết một tí cho vòi hoa sen và
phòng"*. Người chơi cho phép **dời giường** nếu cần — kết luận là không cần, chỉ cần tìm chỗ đứng ngoài khung giường.

### 55a — tên sạp (`data/shops.ts`, `data/people.ts`)
- `m_trung`: `name` = “Trứng – Sữa – Giò Dì Sáu”, `items` thêm `suatuoi` (32.000₫, hộp, cần giữ lạnh) và `suadac`
  (24.000₫, lon) — cả hai đã có sẵn trong `data/ingredients.ts` nên không đẻ thêm mặt hàng ma.
- `say` của Dì Sáu nhắc cả sữa; `FIXED_ROLE.m_trung` = “Người bán trứng, sữa, giò chả”.

### 55b — khách xuyên quầy (`game/stall.ts`)
- `counterBox()`: `hw` theo bậc (0,95 / 1,4 / 2,3 / 2,9), `z0` −0,5 hoặc −0,6, `z1` 0,62; `onCounter()` ráp bán kính thân người.
- `safeApproach()` chạy cho **mọi bậc**: bậc < 5 đi vòng qua đầu quầy `±(hw + 0,85)` rồi ra `z = z1 + 1,05`.
- `resolveNpcWalls()` có nhánh bậc < 5: đẩy NPC lọt trong quầy ra mép gần nhất, và chèn waypoint vòng đầu quầy cho
  khách `toStall`/`actor` đang ở phía sau.
- **Đo:** `fix55b5.mjs` — chợ và CV, ba khách dừng ở local `z ≈ 1,5`, `cross: []` (trước khi sửa: khách đứng trong
  quầy ở local `(−0,28; 0,38)`, `blocked: true`). Bán ở chợ vẫn chạy: 40 phần trà, tiền 112.000 → 327.000₫.

### 55c — kẹt giường (`game/acts.ts`)
- `bedSpot(a)` quét `d` 1,55 / 1,75 / 1,35 / 1,95 / 1,15 × 7 hướng, lấy chỗ `!blocked(x, z, 0,36)`.
- `sleep()` đặt người chơi ở chỗ đó thay vì đúng tâm nệm; `wake()` bước ra nếu `blocked(p0, 0,32)`.
- `bedStand()` (công khai) trả chỗ đứng + hướng quay vào giường, để menu test tele tới mà không chui vào giường.
- **Đo:** `fix55a3.mjs` — nhà nghỉ (−8,15; 39,9) và nhà trọ (39,35; −3,6), `after.blocked: false` cả hai, bước ra bốn
  hướng vẫn quanh chỗ cũ (3,35 m là do vướng tường rồi `resolve` trượt dọc tường, không phải xuyên vách).

### 55d — buồng tắm + đồ đạc (`world/places.ts`)
- Hàm mới `shower(b, x, z, nx, nz, h)` thay hai khay phẳng ở `wash_nhanghi` (7,0; 4,6) và `wash_tro` (3,7; 5,3):
  tường ốp gạch có ron, khay men + lỗ thoát, cột sen + tay gạt đỏ, ống đứng, tay vươn, đầu sen 16 cạnh có 6 lỗ phun,
  kệ ba chai, khăn, gương + đèn, tấm chắn kính có `collide`.
- Nhà nghỉ thêm tủ đầu giường + đèn + sách, quạt treo tường, ti vi, rèm hai tấm, thảm, móc áo, ghế nhựa, bàn tròn;
  nhà trọ thêm kệ đầu giường + đèn + khăn, quạt cây, dây phơi ba áo, ấm nước + ly, lịch + công tắc, chiếu.
- **Lỗi đã vấp:** `mb.cyl(x,y,z,r,h,col,seg,rTop)` — tham số cuối là bán kính **ĐỈNH tuyệt đối**; truyền 0,82 làm cái
  đĩa sen thành mâm 4 m. Dùng 0,105 cho đĩa bán kính 0,125.

### 55e — menu test & tài liệu
- `devPoints.ts`: bỏ bộ test lượt 54, thêm 7 mục lượt 55 (bảng hàng Dì Sáu · tele sạp · ngủ thử nhà nghỉ / trọ ·
  buồng tắm nhà nghỉ / trọ · dựng gánh trà đá ở Cổng Chợ). `DEV_BUILD_TAG` đổi theo.
- Thêm hai helper dùng chung cho menu: `tpFront(a, msg)` (đứng phía khách của sạp, thử 4 khoảng cách) và
  `standNear(x, z, msg)` (chỗ trống quanh một món đồ). Cả hai có nhánh báo “chỗ này chật quá” thay vì đứng trong vách.
- **Bẫy đã vấp:** mỏ neo sạp `v_m_trung` quay mặt VÀO quầy (yaw = π sau khi cộng khung chợ), cộng `z + 2` là ra sau
  lưng sạp; và viết `v_trung` (thiếu `m_`) thì `tpTo(undefined…)` ra NaN rồi `resolve` ném người chơi sang toạ độ rác
  (49; 100,3). `tpFront` nay kiểm `blocked` và báo khi không thấy mỏ neo.
- Test: `tests/nghi55.test.ts` (12 bài) + `tests/devpoints.test.ts` và `tests/changelog.test.ts` cập nhật theo bộ mục mới.
- Probe: `fix55a3.mjs`, `fix55b5.mjs`, `fix55c.mjs` (4 ảnh), `fix55d.mjs` (bấm cả bộ mục + cho khách kéo tới quầy),
  `fix55e.mjs` (kiểm `interact.focus` sau mỗi lần tele).

---

## Lượt 56 — mặt Bà Chín Ve Chai đen lại một tí ✅ đã xong

Người chơi: *"sửa mặt bà bán ve chai đen một tí"*. Hỏi lại (`ask_user`) vì "đen" có thể là **da ngăm** hoặc **khuôn mặt
tối/dữ**; người chơi chọn **da ngăm/đen hơn cho ra dáng người phơi nắng**, nên không đụng tới biểu cảm.

- Tìm ra nguyên nhân: `lookFromFixed()` chọn màu da bằng `SKINS[(face*3 + hat) % 5]`; Bà Chín (`scrap2`, face 4, hat 1)
  rơi đúng `#f6d6b6` — màu **sáng nhất** bảng.
- `data/people.ts`: `FixedNpcDef` thêm `skin?: number`; `scrap2` khai `skin: 0xb8804f` (tối hơn ~82 điểm độ sáng,
  vẫn tông da ấm). Không ai khác khai `skin` nên cả thành phố giữ nguyên màu da.
- `gfx/people.ts`: `lookFromFixed()` đọc `f.skin ?? SKINS[...]`.
- Test `tests/mat56.test.ts` (4 bài) + cập nhật `tests/devpoints.test.ts`, `tests/changelog.test.ts`.
- Probe `tools/probe/steps/scrap56.mjs`: ảnh `f56_ba_chin_mat.png` / `f56_ba_chin_cheo.png`.
  **Bẫy khi chụp:** nhãn tương tác `#focus` và bong bóng hội thoại của NPC hay mọc đúng giữa mặt — phải
  `ui.$('focus').style.display='none'`, `interact.focus=null`, `ui.unsay(n)` cho từng NPC trước khi chụp.
- Menu test thay bằng 3 mục `t56_*` (soi mặt · đọc bảng màu cũ/mới · tele sang vựa ông Tư Rác để so).

---

## Lượt 57 — rào “Cấm đường” chặn được cả xe cộ ✅ đã xong

Người chơi: *"sửa hàng rào xe đang chạy qua được ở 2 đầu cấm đường (không cho xe qua khu vực đó)"*.

**Nguyên nhân:** hệ xe (`game/traffic.ts` + `game/roads.ts`) hoàn toàn không biết sự kiện `cam_duong`. Chỉ
`stall.onEvent` làm hai việc: thêm cạnh vào `NAV_BLOCK` (đồ thị đi bộ) và bật `city.roadblock.visible`. Rào dựng ở
`world/city.ts` phủ `x −33,1 … −25,9` tại `z = ±25`, đúng hai làn xe `x = −31,2 / −27,8` của tuyến dọc `x = −29,5`
⇒ mọi xe dọc tuyến xuyên qua cả hai hàng rào, đúng như người chơi báo.

**Sửa:**
- `game/roads.ts`: thêm `ROADBLOCK` (khai đúng toạ độ rào), `setRoadblock`/`roadblockActive`, `barrierStop`,
  `spawnInBlock`; `pickSpawn()` xếp tuyến đang rào xuống cuối và từ chối điểm sinh nằm trong `pad` của rào.
- `game/traffic.ts`: trong `update()`, so **vị trí sắp tới** với vạch rào — vượt thì dừng ở vạch, đảo `sign`, đảo
  `lane` (sang làn ngược), hãm 1,2 s.
- `game/stall.ts`: `onEvent('cam_duong')` gọi `setRoadblock(on)` song song `NAV_BLOCK`; nhánh khôi phục ván gọi
  `setRoadblock(false)` trước khi áp lại sự kiện.
- Test `tests/camduong57.test.ts` (8 bài) + cập nhật `tests/devpoints.test.ts`, `tests/changelog.test.ts`.
- Menu test thay bằng 3 mục `t57_*` (bật rào + tele ra trước rào · đọc số xe trong đoạn cấm · dỡ rào).
- Probe `tools/probe/steps/camduong57.mjs` (đo + ảnh `f57_rao_cam_duong.png`) và `fix55f.mjs` (bấm đúng 3 mục menu).

**Đo:** bật cấm đường → 4 đợt × ~1.000 mẫu, **0** mẫu xe nằm trong đoạn cấm; tắt luật rào cho xe (đối chứng như
trước lượt 57) → **570** mẫu lọt vào, xe ở `x = −27,8` chạy qua `z = −25 … −22`.

**Bài học:** hai hệ (người đi bộ và xe) từng có hai bản đồ chặn đường riêng. Từ nay mọi thứ “chặn đường” khai ở
`roads.ts` và cả hai bên cùng đọc một biến.

---

## Lượt 58 — mini game bánh tráng trộn: 5 topping nằm ngẫu nhiên mỗi ván ✅ đã xong

Người chơi: *"làm mini game của bánh tráng trộn 5 tp random vị trí"*, chốt qua câu hỏi: kiểu chơi **“chạm đúng topping
đang được gọi”** (phản xạ), và **thay** bước trình bày của riêng món này (không thêm bước mới).

**Trước lượt này:** bánh tráng trộn dùng chung `AssembleGame` — 5 chén xếp vòng cung ở vị trí cố định, bày theo phiếu;
vị trí không bao giờ đổi nên học thuộc một lần là xong.

**Sửa:**
- `cook/tron.ts` (mới, thuần, không Three.js/DOM): `tronSpots` chia vòng elip thành 5 khoang rồi rải ngẫu nhiên
  (đẩy xa nhau tới khi mọi cặp cách > 0,15 m > 2 · bán kính ăn tay), `tronCalls` (2 vòng × 5, không gọi trùng hai lần
  liền), `tronTapAt`, `tronLimit`, `tronScore`.
- `cook/games.ts`: `TronGame implements Mini` — đĩa giấy + hình nguyên liệu thật, vòng vàng đánh dấu đĩa đang gọi, đĩa
  chạm đúng bay vào hộp, hết một vòng thì đảo thau, xong ván thì bày 5 lớp vào hộp có thành (thành phẩm nhìn vẫn ra
  bánh tráng trộn). **Mỗi ván lấy hạt giống mới** nên vị trí đổi.
- `data/recipes.ts`: thêm `TronStep` (`t: 'tron'`), `STEP_NAME.tron = 'Trộn topping'`, `STEP_TOOLS.tron = []`,
  `fuelPerPortion` coi `tron` là bước không dùng lửa; bánh tráng trộn đổi `finish` sang `tron(...)` với đúng 5 lớp cũ.
- `cook/cook.ts`: `case 'tron'` → `TronGame`; ba chỗ lọc bước dùng lửa thêm `tron`; thêm getter `current` để bảng test
  đọc được ván đang mở.
- `ui/ui.ts`: `cookCard(items, title)` — màn trộn hiện “Máy đang gọi (vòng 1/2)”; `dishIcon` đọc màu topping từ `tron`.
- `main.ts`: cửa hậu `?debug` thêm `__rec` (bảng công thức) để probe mở đúng món.
- Test `tests/tron58.test.ts` (10 bài) + cập nhật `tests/devpoints.test.ts`, `tests/changelog.test.ts`.
- Menu test thay bằng 3 mục `t58_*` (chuẩn bị quầy + sơ chế sẵn · vào thẳng mini game · đọc toạ độ 5 đĩa của ván đang mở).
- Changelog thêm “Lượt 58”, bỏ bản cũ nhất (lượt 49) để giữ 8 bản.

**Đo:** 60 hạt giống ⇒ vị trí luôn gọn trên bàn và mọi cặp cách > 0,105 m; 40 hạt giống ⇒ **40 cách xếp khác nhau**.
Probe `tools/probe/steps/tron58.mjs`: 2 ván liền nhau cho 5 toạ độ khác hẳn; chạm sai → `miss 0 → 1`, `k` không tăng;
để hết giờ → `miss 1 → 2`, tự sang lượt sau; bấm đúng hết 10 lượt → ra món, chất lượng **0,94** (ván 2, không sai) và
**0,65** (ván 1, sai + trễ 2 lượt) — đúng ý “chạm nhầm thì mất điểm”.

**Bài học:** phần “ngẫu nhiên” phải tách khỏi lớp vẽ thì mới đo được bằng máy — vị trí rải nằm trong `tron.ts` nên
test khẳng định được “40 ván ⇒ 40 cách xếp”, còn nếu rải tay trong `TronGame` thì chỉ nhìn ảnh mà đoán.

**Hotfix ngay sau lượt 58** (người chơi báo: *“topping trên khay biến mất khi ấn 1 lần”*): bản đầu ẩn **cả đĩa** sau
lần chạm đúng, mà ván gọi 2 vòng nên sang vòng 2 máy gọi vào chỗ trống. Nay đĩa nằm lại suốt ván, chỉ một **mẩu** topping
bay vào hộp (`bits`), đĩa vơi dần rồi đầy lại khi hết vòng, nhãn vẽ theo đĩa còn topping; đĩa bánh tráng đổi sang nắm sợi
(nhìn rõ, không còn giống đĩa trống). Test thêm 1 bài (`tests/tron58.test.ts` → 11 bài) + probe `tron58.mjs` chặn đúng
lỗi này: chạm đúng 1 lần ⇒ `đĩaHiện: 5`, hết vòng 1 ⇒ `cònTopping: [1,1,1,1,1]`.

## Lượt 59 — trần việc làm thêm mỗi ngày + bảng việc làm đọc số thật ✅ đã xong

Người chơi: *“giới hạn số lần có thể làm ca bốc cá và ca chạy bàn cafe xuống, tăng số bao có thể bốc vác lên và bổ sung
chuẩn bảng việc làm”*. Ba nghề trong nhóm việc làm thêm đang lệch nhau: hai nghề trả cao (bốc cá 110 phút · 52.000–68.000₫,
chạy bàn 60 phút · ≥ 38.000₫ + boa) **không có trần** nên đứng bấm cả buổi là ra tiền, còn vác bao thì chặn cứng ở 12 bao
(72.000₫/ngày) — nghề nào cũng có mà vác bao thành vô nghĩa.

**Sửa:**
- `sim/rules.ts`: thêm hằng số dùng chung `DOCK_SACKS_DAY = 20` (trước 12), `DOCK_SACK_PAY = 6000`,
  `DOCK_SHIFTS_DAY = 2`, `CAFE_SHIFTS_DAY = 3`, `DOCK_WAGE_MIN/MAX`; ba hàm đếm `sacksLeft`, `dockShiftsLeft`,
  `cafeShiftsLeft` (không bao giờ âm, `?? 0` cho bản lưu cũ).
- `sim/state.ts`: `wd.cargoShifts`, `wd.cafeShifts` + reset theo ngày ở `rules.ts`; **không** tăng `SAVE_VERSION`
  (merge `{ ...base.wd, ...raw.wd }` đã lo bản lưu cũ).
- `game/acts.ts`: trần áp trong chính hàm nhận ca — `cafeShift` (3 cửa vào: menu Sáu Lực, quán Bóng Đá, quán Sân Vườn),
  `dockShift`, `dockTake`, `dockDrop`; ca bị chặn có câu giải thích riêng. `dockDrop` còn kiểm trần để không vác lố bao
  thứ 21 (trả bao lại, không trả công). Toast sau mỗi ca ghi còn mấy ca.
- `game/acts.ts` `jobListText()` (mới): bảng việc làm 7 dòng, mỗi dòng ghi số thật của hôm nay và giờ mở cửa; việc hết
  hạn mức thì ghi thẳng lý do thay vì bỏ dòng.
- `game/interact.ts`: nhãn `Đã vác x/12 bao` → đọc `R.sacksLeft(g)` / `R.DOCK_SACKS_DAY`, tiền `+6.000₫` → `money(R.DOCK_SACK_PAY)`.
- Menu ẩn (`game/devPoints.ts`): thay mục test của lượt 58 bằng **6 mục `t59_*`** — mở bảng việc làm · về bến cảng 5h sáng
  (đủ sức, sạch, 200.000₫) · làm hết 2 ca bốc cá rồi thử ca 3 · làm hết 3 ca chạy bàn rồi thử ca 4 · vác tới bao cuối rồi
  thử vác lố · đọc sổ việc làm hôm nay. `DEV_BUILD_TAG` đổi sang câu của lượt 59.
- Test `tests/jobs59.test.ts` (10 bài) + `tests/time.test.ts` cập nhật theo hằng số + `tests/devpoints.test.ts` (mục `t59_*`,
  `t58_*` vào danh sách phải biến mất); changelog “Lượt 59” (bỏ bản cũ nhất).

**Đo:** `npx tsc --noEmit` sạch · `npx vitest run` **647/647 (54 tệp)** · `npm run build:pages` OK.
Probe `tools/probe/steps/jobs59.mjs` (`errors: none`): ca bốc cá 1 → 2, ca 3 **bị chặn** (tiền đứng 140.000₫, toast nói
“đã bốc đủ 2 ca”); chạy bàn 1 → 3, ca 4 **bị chặn**; vác đủ trần rồi `dockDrop` **không** cộng bao (20, không phải 21);
nút ca bốc cá trong hội thoại anh Sáu Lực ở trạng thái `off` kèm lý do; bảng việc làm 5h sáng đọc `20/20 bao`, `2/2 ca`,
`3/3 ca`, `4/4 đơn`; sang ngày mới cả ba trần mở lại (`20`, `2`, `3`).
Probe `tools/probe/steps/dev59.mjs` (mở menu ẩn bằng 7 lần bấm + mã 7777, `errors: none`): 6 mục `t59_*` hiện đủ trong bảng;
bấm “làm hết ca bốc cá” ⇒ `2/2` rồi bấm ca lần nữa `bịChặn: true`; “làm hết ca chạy bàn” ⇒ `3/3`; “vác tới bao cuối” ⇒
`20/20` và thử vác lố vẫn `20/20`; “đọc sổ việc làm” in `Bây giờ: 9h41 · ngày 1 · Bao 20/20 · Ca bốc cá 1/2 · Ca chạy bàn 3/3`.

## Lượt 60 — sửa lỗi không cho được nguyên liệu vào nồi (trà đá bấm mãi không qua) ✅ đã xong

Người chơi báo kèm ảnh: mở nồi nấu trà đá, nồi trống, chén “Trà khô” nằm trên bàn, chạm mãi không vào.

**Nguyên nhân đo được:** `Cook.local()` cắt tia chạm ở một mặt phẳng `mini.planeH`; `BoilGame` đặt nó ở **mặt nước** (0,355 m) trong khi
chén ở **mặt bàn** (~0,03 m) ⇒ điểm rơi lệch **0,208 m**, gấp đôi bán kính ăn 0,11 m. Ảnh hưởng **mọi món có bước nấu/ninh/luộc/pha**.

**Sửa:**
- `cook/cook.ts`: `Mini.planes` (khai thêm độ cao) + `Mini.pickPoint` (lớp tự chọn điểm); `local()` cắt tia ở mọi độ cao rồi
  `pickPoint(list) ?? list[0].p` — lớp không khai thì hành vi y như cũ.
- `cook/games.ts`: `BoilGame` khai `planes = [0.03]` + `pickPoint` (đang cho nguyên liệu → mặt bàn; đang nấu → mặt nước/giữa bọt).
  Ghi chú rõ độ cao ở các lớp khác (thái 0,06 · chảo 0,2 · vỉ 0,25 · trình bày 0,04 · trộn 0,05 · rửa 0,03).
- Test `tests/nau59.test.ts` (6 bài) + `tests/devpoints.test.ts` (thêm mục `t59_noi`) + changelog “Lượt 60”.
- Menu ẩn: thêm mục **`t59_noi`** mở thẳng bước “Cho nguyên liệu” của nồi trà đá.

**Đo:** `tsc` sạch · **653/653 test (55 tệp)** · probe `steps/nau59.mjs` (`errors: none`): chiếu chén ra màn hình rồi hỏi `local()`
⇒ lệch **0,004 m** (trước 0,208 m); **chạm màn hình thật** ⇒ `fly -1 → 0,52` (chén bay vào nồi), hết chén thì hiện nút “Quạt lửa /
Lọc ra”, bấm Lọc ra ⇒ ra món điểm 1,00. Probe `steps/nau59b.mjs` rà 7 bàn: thái ăn (lệch 0,019), chiên đảo được (`tossN 0 → 1`),
nướng lật được, trình bày lệch 0,008, trộn `k 0 → 1`, rửa chén `hp 1 → 0,19`.
