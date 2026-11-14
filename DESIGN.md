# Gánh Hàng Đường Phố — ghi chú thiết kế (v0.1)

Tài liệu này mô tả game **đúng như mã hiện tại**, các con số cân bằng đang dùng, cách đã kiểm thử, và những việc còn dang dở. Khi sửa luật chơi, hãy sửa cả tài liệu này và bài kiểm thử tương ứng.

## 1. Mục tiêu của bản đầu

Một vòng chơi trọn vẹn và thật sự chạy được: **tay trắng → kiếm vốn → sắm gánh → mua nguyên liệu → tự tay nấu → bán → lời lỗ → ngủ → ngày mới**, trên điện thoại (cảm ứng, màn ngang) lẫn máy tính. Ưu tiên mọi thứ đã làm phải hoạt động, hơn là làm nhiều nội dung nửa vời.

## 2. Kiến trúc

| Lớp | Thư mục | Vai trò | Phụ thuộc |
|---|---|---|---|
| Dữ liệu | `src/data` | Bảng nguyên liệu, cửa hàng, công thức, đồ nghề, nhóm khách, thời tiết, sự kiện | không |
| Luật chơi | `src/sim` | `state.ts` (trạng thái lưu được, JSON thuần) và `rules.ts` (mọi công thức tính) | chỉ `data`, `core`, `world/layout` |
| Bản đồ | `src/world/layout.ts` | Toạ độ lô đất, chỗ bán, lưới đường đi của NPC — dữ liệu thuần | `core` |
| Dựng hình | `src/world`, `src/gfx` | Sinh lưới tam giác, hoạ tiết canvas, bầu trời, mưa | three.js |
| Trò chơi | `src/game`, `src/cook` | Người chơi, NPC, quầy, tương tác, mini-game | mọi lớp trên |
| Giao diện | `src/ui`, `src/audio` | HUD và bảng bằng DOM, âm thanh Web Audio | — |

Hai nguyên tắc giữ cho mã kiểm thử được:

1. **`src/sim` không biết gì về đồ hoạ hay DOM.** Nó báo việc cần hiển thị qua `core/bus.ts` (toast, âm thanh, yêu cầu lưu). Nhờ vậy 172 bài kiểm thử chạy trong Node trong chưa tới 2 giây.
2. **Mọi ngẫu nhiên trong luật chơi nhận một `RNG` có hạt giống** làm tham số cuối, nên kết quả kiểm thử lặp lại được.

Vòng lặp chính (`src/main.ts`): đọc điều khiển → `advance()` cho thời gian game trôi (0,75 phút game mỗi giây thật, một ngày = 32 phút thật; khi ngủ 48 phút game mỗi giây) → cập nhật người chơi, NPC, quầy, nấu ăn, môi trường → vẽ. `dt` bị chặn ở 50 ms nên máy rất chậm thì game chạy chậm lại chứ không nhảy cóc.

## 3. Thế giới

- 3×3 ô phố, mỗi ô 46 m, đường rộng 7 m, vỉa hè 3 m; thêm dải gầm cầu vượt phía nam. 146 lô đất, 270 nút đường đi (ba công trình mới rộng hơn nên thay chỗ của ba nhà ống).
- 10 khu với độ giàu và độ an toàn khác nhau; lượng người theo giờ lấy từ `hourCurve(giờ, khu)`.
- 4 chỗ bán: Hẻm Công Nhân (miễn phí, ×0,85 người qua lại), Cổng Công Viên (20.000₫, ×1,05), Cổng Chợ (30.000₫, ×1,35), Phố Văn Phòng (60.000₫, ×1,25, cần xe đẩy).
- Hình học tĩnh được gộp sẵn theo từng khu thành vài lưới lớn; biển hiệu vẽ chung vào một tấm atlas. Nhân vật là khung khối hộp có khuôn mặt vẽ từ atlas.
- **Không để hai mặt trùng phẳng.** Hai mặt cùng hướng nằm đúng một mặt phẳng sẽ tranh nhau hiển thị (nhấp nháy). Vỏ nhà (`shell`) bỏ mặt trong của tường bao vì lớp lót nội thất đã phủ đúng chỗ đó (`MB.box(..., skip)` với các hằng `FACE`); thứ gì dán lên tường thì nhô ra ít nhất 1–2 cm; vật liệu biển hiệu dùng `polygonOffset` để thắng tấm nền khi nhìn từ xa. `tools/probe/steps/audit.mjs` dò lại toàn thành phố.
- **Biển hiệu phải đọc được từ dưới đường.** `Builder.signAt` ghi mọi biển đủ lớn vào `Builder.signs`. Biển cửa hàng treo ở mặt trước ban công tầng 1 (nếu có) hoặc là hộp đèn nhô khỏi mép mái; biển dọc chìa ra ngoài tầm ban công. Cây vỉa hè hỏi `signTopBehind()`: sau cây có biển thì trồng dáng thân cao (tán trên 4,8 m), biển cao quá 4,78 m thì để trống chỗ đó. Cây bị bỏ vẫn tiêu đúng số lần gọi ngẫu nhiên nên phần còn lại của thành phố không đổi.
- **Sáu góc phố nhỏ** (`world/side.ts`) không phải toà nhà: bàn trà đá + ghế nhựa trước tạp hoá, tường vẽ dưới gầm cầu (mặt có hình hướng ra phố, Bin nhảy trước tường trên tấm các-tông), bạt vá xe căng trên hai cây sào, ghế hát rong + thùng ủng hộ, bàn cờ tướng trong công viên, thùng gỗ đánh giày. Mỗi chỗ ghi neo `v_<id>` cho nhân vật (ngồi trên đúng mặt ghế: neo cao 0,53 m với ghế nhựa/thùng gỗ) và một neo dùng được (`tra_ban`…). Đồ đạc nhỏ đều nằm trong lưới `detail` của khu, có `collide` riêng.
- **Xe cộ** (`game/traffic.ts`): người đi đường chạy xe máy/xe đạp trên các trục đường trong `CORR`, đúng làn (lệch 1,7 m), có mũ bảo hiểm, bấm còi khi người chơi đứng gần lòng đường. Xe vào cảnh từ 35–85 m phía sau người chơi và được thay khi ra khỏi tầm nhìn, nên luôn có xe để thấy mà không phải vẽ cả thành phố. Không tương tác được.
- **Chim trời** (`world/birds.ts`): 1–7 con bay vòng ở độ cao 9–18 m quanh một nút đường gần người chơi, vỗ cánh bằng cách xoay hai cánh, quỹ đạo được chọn lại khi bay quá xa. Ban đêm (độ tối > 0,72) và mưa to thì chim đi ngủ. Tiếng hót phát qua `Sound.chirp()` theo khoảng cách (xa thì nhỏ), chỉ khi người chơi không ở trong nhà.
- Bầu trời là shader riêng (mây lấy từ một tấm nhiễu 256² tạo sẵn), mưa là tối đa 2.400 vệt chạy trên GPU, không rơi dưới mái che. Hễ có mưa, trời chuyển dần sang xám (độ u ám `Env.ov`), nắng dịu đi và mặt đường sẫm lại.

## 4. Các hệ thống và con số

### 4.1 Sinh tồn
Sáu chỉ số 0–100: no, khát, năng lượng, sức khoẻ, vệ sinh, tinh thần. Đói/khát kéo sức bền tối đa xuống (`staminaMax`), thiếu ngủ làm thao tác nấu khó hơn (`cookEase`), bẩn làm khách quay đi và bị phạt khi thanh tra. Chỗ ngủ quyết định chất lượng giấc ngủ và nguy cơ mất trộm:

| Chỗ ngủ | Giá | Ngủ | An toàn | Kho |
|---|---|---|---|---|
| Gầm cầu | miễn phí | 0,6 | 0,35 | 12 kg |
| Ghế đá công viên | miễn phí | 0,5 | 0,25 | — |
| Nhà nghỉ Bình Dân | 80.000₫/đêm | 0,9 | 0,9 | 20 kg |
| Phòng trọ | 280.000₫/tuần | 1,0 | 0,95 | 60 kg |
| Khách sạn Hoa Sen | 350.000₫/đêm | 1,25 | 1,0 | 20 kg |
| Căn hộ An Bình | 900.000₫/tuần | 1,10 | 0,98 | 80 kg |
| Nhà riêng (Nhà số 12) | 1.400.000₫/tuần | 1,15 | 1,0 | 120 kg |
| Cửa hàng kiêm nhà ở | 1.800.000₫/tuần | 1,05 | 1,0 | 140 kg |

Ba chỗ thuê cao cấp đòi **uy tín** mới cho thuê: căn hộ 12, nhà riêng 30, cửa hàng 45 (`needRep` trong `HOUSING_LIST`, chặn ở `canRent`/`payHousing`; dưới mức đó chủ nhà chỉ nói chuyện, không mở cửa). Chỗ nào chưa thuê thì cửa khoá thật (`door.lock`), và ba chỗ này đều có bếp/buồng tắm/chỗ cất đồ riêng nên cắm được tủ lạnh (`PLUGGABLE`). Nợ tiền nhà hai ngày là mất chỗ, đồ trong nhà bị giữ — câu nhắc giờ đọc theo tên chỗ ở chứ không chỉ "Bác Năm".

### 4.2 Nguyên liệu
Mỗi lô hàng có số lượng, độ tươi, chất lượng và giá vốn. Mỗi giờ độ tươi giảm `100 / hạn_dùng`, nhân 0,22 nếu được giữ lạnh, nhân 2,6 × thời tiết nếu là đồ cần lạnh mà để ngoài. Dưới 10 là hỏng và bị bỏ. Khi nấu, lô kém tươi được dùng trước.

Giá ở cửa hàng = giá gốc × hệ số cửa hàng × sự kiện × dao động ±7% theo ngày; hàng tươi giảm 25% trong 2 giờ cuối buổi chợ. Mặc cả thành công theo xác suất phụ thuộc mức xin bớt, độ thân quen, tinh thần, vệ sinh; mỗi ngày mặc cả quá 2 lần ở một sạp thì khó dần.

### 4.3 Nấu ăn
Mỗi công thức gồm khâu **sơ chế** (làm theo mẻ, để được một thời gian `hold`) và khâu **hoàn thiện** (làm khi khách gọi, ra `serve` phần mỗi lần). Mỗi bước là một mini-game cho điểm 0–1:

| Mini-game | Thao tác | Điểm dựa trên |
|---|---|---|
| Cắt thái | kéo dao tới vạch rồi thả; băm thì chạm liên tục | độ lệch so với vạch, tốc độ |
| Xào / chiên | giữ lửa trong vùng xanh, vuốt lên để đảo đúng lúc, nhấc chảo khi chín | độ chín, cháy, số lần đảo hụt |
| Nướng | chạm từng món để lật, gắp ra khi cả hai mặt chín | độ chín từng mặt |
| Nấu / pha | cho nguyên liệu, giữ lửa, vuốt vớt bọt; pha trà thì lọc đúng lúc | thời gian trong vùng lửa đúng, trào nồi, bọt |
| Trình bày | cho từng thứ theo đúng thứ tự, giữ để rót vừa mực | sai thứ tự, mực rót, thời gian |

Chất lượng món = `(0,55·điểm + 0,45·điểm·chất_lượng_sơ_chế) × (0,35 + 0,65·chất_lượng_nguyên_liệu)` + thưởng quen tay (tối đa 0,06) + 0,04 nếu nướng bằng than.

Bếp than tự nguội, phải bấm quạt; gió và mưa (không có ô dù) làm tắt lửa. Một bao than đứng bếp được 22 lần, một bình gas 14 lần.

**Thang mở công thức** (`unlockRecipes` trong `sim/rules.ts`): 4 món biết sẵn, 56 món còn lại chia theo tay nghề 0–4 trong `learn.skill`. Mỗi lần lên cấp, `addXp` gọi `unlockRecipes(g, cấp ≤ 1 ? 1 : 2)`: lọc những món chưa biết mà `learn.skill ≤ cấp`, xếp theo `ref` (giá bán) tăng dần, lấy 1–2 món đầu. Vì `ref` là giá bán chứ không phải giá vốn, thang này cũng chính là thang lãi gộp: cấp càng cao, món càng đắt, lãi càng dày. Cấp tối đa 10 nên mở hết được cả 60 món.

Học tại quán (`acts.learnOpts`) thì khác: mỗi quán chỉ bày **một món rẻ nhất còn thiếu** trong số món quán đó dạy, và chỉ bày khi đã đủ thân (`rel.n ≥ 3` lần nói chuyện, hoặc `rel.v ≥ 25` uy tín) và đủ tay nghề. Nhờ vậy bảng công thức trong Sổ tay không bị lộ hết một lượt — món chỉ hiện ra khi người chơi lên cấp hoặc khi trò chuyện đủ nhiều.

Camera nấu ăn tự đóng khung theo từng mini-game sao cho vùng thao tác chiếm khoảng 60% bề ngang màn ngang (hoặc gần hết bề ngang màn dọc) — xem `Cook.frameCam`.

### 4.4 Khách hàng
Lượng khách mỗi giờ game:

```
4,6 × người_qua_lại(chỗ bán) × đường_cong_giờ × thời_tiết × sự_kiện
    × sức_hút_quầy × (0,75 + uy_tín/50) × sức_hút_giá × độ_đa_dạng_thực_đơn
```

Ở uy tín 0, bán một món đúng giá ở cổng công viên được khoảng 19 khách mỗi ngày; uy tín 100 đông gấp khoảng 3,7 lần.

Mỗi khách có "giá thấy hợp lý" = `giá thị trường × mức chịu chi của nhóm × (1,1 + uy_tín/250 + thưởng món tủ) × sự kiện × ngẫu nhiên 0,86–1,2 × độ giàu của khu`. Gọi `tỉ lệ = giá bán / giá hợp lý`; xác suất mua = `1 / (1 + e^((tỉ lệ − 1,15) × 5 × độ co giãn của món × √độ nhạy giá của nhóm))`. Với trà đá bán đúng giá thị trường ở quầy mới (uy tín 0): khoảng 82% công nhân, 60% học sinh và gần như toàn bộ dân văn phòng chịu mua.

Sau khi ăn: `s = 0,12 + 0,63·chất lượng + 0,13·(1 − tỉ lệ thời gian chờ) + 0,12·độ hời + phục vụ − mất vệ sinh − khó tính`, số sao = `1 + 4,3·s` (1–5). Uy tín đổi `(sao − 3,25) × 0,55`, phần tăng bị hãm dần khi uy tín đã cao. Từ 4,3 sao trở lên có thể được boa.

### 4.5 Tiền bạc

| Nguồn vay | Lãi | Hạn | Hạn mức | Điều kiện |
|---|---|---|---|---|
| Sổ nợ Cô Ba | 0% | 3 ngày | 100.000₫ (chỉ mua hàng) | — |
| Ngân hàng Sao Vàng | 0,6%/ngày | 14 ngày | 1–5 triệu theo uy tín | có phòng trọ, uy tín ≥ 15 |
| Hùng Sẹo | 3%/ngày | 5 ngày | 0,5–2 triệu | — |

Nợ quá hạn 3 ngày mà tài sản dưới một nửa số nợ thì phá sản: mất đồ nghề, xoá nợ, về gầm cầu với 5.000–15.000₫, bị khoá tín dụng 10 ngày, uy tín còn 40%, phần hướng dẫn quay về bước sắm gánh.

Mọi món bán đúng giá thị trường đều có lãi gộp trên 30% khi mua nguyên liệu giá chợ (có bài kiểm thử canh điều này).

### 4.6 Sự kiện
"Đạo diễn sự kiện" mỗi giờ game gieo xúc xắc, tối đa 2 sự kiện không phải biến động giá cùng lúc, cách nhau ít nhất 150 phút. Sự kiện đổi lượng người, túi tiền, nhu cầu theo nhóm món, giá nguyên liệu, đóng cửa hàng, ép thời tiết, hoặc cử một nhân vật tới quầy (thanh tra, nhà phê bình, đàn em bảo kê, khách say, khách quen xin chịu, khách VIP).

### 4.7 Người lạ và người quen
Màn hình chỉ cho biết điều người chơi thật sự biết. `who(npc)` (trong `game/who.ts`) trả về:

- người đi đường: nhãn theo vẻ ngoài lấy từ `SEEN` — chỉ những gì nhìn là thấy (đồng phục học sinh, sắc phục công an, tuổi tác, vẻ lang thang, khách Tây), còn lại đều là "Người lạ". Tên và nghề không bao giờ hiện;
- người đứng quầy: trước lần nói chuyện đầu tiên là việc họ làm ở đó (`FIXED_ROLE`, ví dụ "Bà chủ quán cơm"); sau đó là tên. Hộp thoại đầu tiên vẫn ghi nhãn cũ, nói xong mới có thông báo làm quen;
- khách quen: lần đầu ghé là người lạ; bán xong lần đầu thì họ tự giới thiệu.

Sổ "đã quen" là `Game.met` (id → ngày làm quen), có trong bản lưu.

Tên trong phố có hai giọng: tên đẹp và tên kiểu nhà trường ("Cà Rốt", "Mèo Mun"…), dùng cho khách quen nhóm học sinh — chỉ hiện sau lần bán đầu tiên. Nhân vật phụ đều có tên riêng ngay từ đầu vì họ tự xưng khi mở chuyện.

### 4.8 Người xấc xược
Bảng `RUDE` (trong `data/people.ts`) chỉ gán trọng số cho vài nhóm: giang hồ 3,4 · khó tính 2,4 · học sinh 1,7 · công nhân 1,1 · tài xế 1 · shipper 0,7 · khách du lịch 0,4. Nhóm không có trong bảng thì không bao giờ thô lỗ.

- Mỗi người đi đường có đồng hồ riêng `rudeT` (30–120 giây, sau mỗi lần lại 80–240 giây). Chỉ tính khi họ đang đi bộ hay đứng gần người chơi (dưới 7,5 m), không phải khách đang chờ mua, và cả phố chỉ có một phen thô lỗ mỗi 50–110 giây (`rudeCd`), thêm 30% may rủi nữa — nên rất thưa.
- Ba kiểu: **ném giấy** (cục giấy bay theo đường vòng cung 0,5–0,75 giây, trúng thì −2 tinh thần), **khạc nhổ** (−3 tinh thần), **mắng rồi đuổi** (55% trong số đó là đuổi theo 4,5 giây; chạm được thì xô người chơi lùi lại, −4 tinh thần). Tất cả đều hiện lời thoại ngắn và có âm thanh riêng.
- Khi xin tiền bị từ chối: 8% người có phản ứng xấu (nài nỉ, kể khổ) sẽ khạc nhổ; 22% trong số bị làm phiền sẽ quay ra đuổi và trừ uy tín. Đây là đường duy nhất để "xin tiền" mất bình tĩnh.

### 4.9 Nhân vật phụ
Sáu người trong bảng `SIDE`: Cô Thắm (trà đá), Bin (nhảy dưới gầm cầu), Chú Hậu (vá xe), Cô Hồng (hát rong), Ông Tư (cờ tướng), Bé Bo (đánh giày). Mỗi người có câu mở đầu, câu chào lại khi đã kể hết, và 3 câu chuyện riêng. Mỗi câu chỉ kể được một lần (cờ `side_<id>_<số>` trong `Game.flags`), hết chuyện thì menu chỉ còn việc dùng được ở chỗ đó: mua ly trà đá 3.000₫, phụ bưng trà 40 phút +12.000₫, nhảy thử một bài, nghe hát 10 phút, chơi cờ 25 phút, đánh giày 5.000₫, vá bơm quầy 8.000₫… Các việc này đi qua đúng hệ thống của game (`R.advance`, `R.spend`, `R.consume`, `R.earn`) nên tốn thời gian, tiền và chỉ số như mọi việc khác.

### 4.10 Khách đứng mua và việc lúc rảnh của người đi đường

`Npcs.manageShoppers()` chạy mỗi 2,5–6 giây: với mỗi tiệm có người đứng quầy (`FIXED`) và đang trong giờ mở cửa, cách người chơi 9–52 m, nếu chưa có ai đứng đó thì thêm một người đi đường đứng lựa hàng. Số người tối đa theo mức đồ hoạ (`npcs/12`, 1–3 người). Người này đứng lệch 1,35–1,95 m trước quầy, 16–42 giây rồi đi, thỉnh thoảng thốt một câu ("Cái này bao nhiêu vậy chú?", "Cho con thêm ít rau.").

Người đi đường đứng chờ (không phải khách quen, không phải người đứng quầy) có đồng hồ `idleT` 8–22 giây; hết giờ thì 40% cơ hội làm một việc trong 5–11 giây: **đọc báo** (hai tay cầm tờ báo gấp đôi), **uống nước** (cầm ly nhựa trước bụng — mô hình một khúc tay nên không đưa lên tới miệng được), **tám chuyện** (chỉ khi có người đứng trong 3,4 m; hai người quay vào nhau, tay khoa trước). Sau đó nghỉ 18–50 giây mới tới lượt tiếp theo, nên cả phố chỉ lác đác vài người đang làm gì đó.

### 4.11 Chỗ chơi và hai việc làm thêm

Bảng `FUN_LIST` (`data/fun.ts`) gắn hoạt động vào một cái neo, có giờ mở cửa và giá:

| Chỗ | Hoạt động | Giá | Thời gian | Tinh thần |
|---|---|---|---|---|
| Quán cà phê Bóng Đá (`tv_bongda`) | cà phê sữa đá | 20.000₫ | 30 phút | +13 (khát +14) |
| | hát karaoke | 30.000₫ | 40 phút | +19 (sức −6) |
| | chen xem trận bóng (khi có sự kiện `bong_da`) | 0 | 30 phút | +12 |
| Chùa Phước An (`v_temple`) | thắp nhang cầu an | 5.000₫ | 12 phút | +11 |
| Ghế đá ngoài phố | ngồi nghỉ | 0 | 20 phút | +7 (sức +4) |

Ghế đá nào đã là chỗ ngủ (ghế trong công viên) thì giữ nguyên lời mời ngủ, không thêm lời mời nghỉ — tránh hai nút chồng nhau.

Hai việc làm thêm nằm trong hội thoại chứ không phải bảng riêng: **chạy bàn** ở quán cà phê, 60 phút, công `38.000₫ + uy_tín×120 + max(0, tinh_thần−50)×120`, boa thêm 0–8.000₫ (6.000₫ nếu tinh thần trên 60), đổi lại mất 18 sức, 3 đói, 7 khát; **bốc cá ở cảng**, chỉ 4h30–10h, cần 35 sức, 110 phút, 52.000–68.000₫, mất 30 sức. Cả hai đi qua `R.advance`/`R.earn`/`R.consume` như mọi việc khác.

**Nút cất gánh** (`#stowb` trên HUD, chỉ hiện khi đã có quầy): đang gánh thì đổi qua lại giữa "gánh trên vai" và "gánh trong ba lô" (`Stall.stowed`, `player.setCarry('')`); đang dựng quầy thì nút này gọi `pickUp()` — dọn cả quầy vào ba lô (chỉ khi đứng trong 6 m và quầy không còn khách xếp hàng). Sạp cố định (bậc 3) không dọn được nên nút ẩn.

### 4.12 Sạp cố định (bậc 3)

Sạp là bậc cuối của nghề: 9.000.000₫ ở tiệm Đồ Nghề Ba Tài, chứa 90 kg, bày 10 món, 7 khách xếp hàng, 20 khay, có mái che thật (`world.roofs`) nên nấu ăn không sợ mưa. Mô hình là quầy gỗ 2,6 m có mái bạt xanh–vàng, cột, có thể thêm bàn ghế nhựa, bảng hiệu, ô dù như mọi bậc khác.

- **Đặt chỗ**: mua xong sạp nằm "trong ba lô" (không vác lên vai, `carryId` rỗng); người chơi chạm vào vòng sáng vàng của một chỗ bán để dựng (`placeAt`). Đặt rồi thì `pickUp()`/`storeHome()` đều từ chối — sạp cố định đúng nghĩa.
- **Phí chỗ theo ngày**: `stallRent(g)` trả về phí của chỗ đang đặt; đầu mỗi ngày `newDay` gọi `payStallRent(g)` để trừ vào sổ `fees`. Thiếu tiền thì cờ `flags.sapNo` được bật, quầy đóng và chỉ mở lại được khi đóng đủ (`Stall.open()` thử trừ tiền trước). Panel Quầy hiện phí chỗ và nhắc khi đang nợ.
- **Đổi lại**: quầy để ngoài đường qua đêm **không bị dỡ trộm** (mọi bậc khác đều bị), và bão/ngập chỉ làm hỏng quầy như bình thường.
- Nhánh `tier < 3` đã rà hết: `pickUp`, `storeHome`, trộm đêm, ô dù (không cần vì đã có mái), nút "Dọn hàng, mang đi" trong panel và nút cất gánh trên HUD đều ẩn với bậc 3.

### 4.13 Ba chỗ ở mới

Thêm ba địa chỉ có nội thất thật, không phải mô hình trang trí — đi vào bằng cửa, ngủ ở giường, cất đồ ở kệ, tắm ở buồng tắm:

| Nơi | Lô đất | Chủ nhà | Nội thất |
|---|---|---|---|
| Căn hộ An Bình (Căn 102) | `10S` đường Khu Căn Hộ | Cô Hạnh, quản lý căn hộ | phòng khách sofa + ti vi, bếp riêng có bồn rửa và tủ lạnh, buồng ngủ có kệ đồ, buồng tắm khay sen; mặt tiền có hộp thư, bảng "CĂN 102", chuông cửa |
| Nhà số 12 | `21S` đường Khu Dân Cư | Chú Vinh, chủ nhà | sân gạch có xe máy, phòng khách có bàn thờ, hai buồng ngủ, bếp sau, buồng tắm |
| Tạp hoá Bình An | `11S` Phố Trung Tâm | Cô Lệ, chủ tạp hoá | mặt tiền bán hàng có quầy + ba dãy kệ, mái bạt; phía sau là buồng ngủ, bếp và buồng tắm |

Mỗi nơi có đủ mỏ neo `bed_/store_/wash_/v_` nên mọi hệ thống sẵn có (ngủ, cất đồ, tắm, nói chuyện, giờ mở cửa, bản đồ) chạy mà không cần nhánh riêng. Cửa khoá theo `g.housing`; giờ mở cửa 6–22h (tạp hoá 6–21h).

### 4.14 Sức khoẻ, ngất và Bệnh viện Phước An

Sức khoẻ tụt khi đói, khát, hết năng lượng hoặc đi mưa lâu (`tickStats`). Về 0 là **ngất**, không phải chết:

- **Viện phí**: `min(tiền đang có, 30.000₫ + 15% tiền đang có)`, làm tròn nghìn (`faint()` trong `sim/rules.ts`). Không bao giờ âm tiền; nghèo quá thì bệnh viện cho ghi sổ.
- **Rơi đồ**: mất `ceil(40%)` số món đang mang trong ba lô (lấy từ cuối danh sách). Số đồ ấy nằm ở quầy thất lạc của bệnh viện tới hết **ngày hôm bạn tỉnh dậy** — hỏi bác sĩ "Hỏi đồ thất lạc" là nhận lại; chật ba lô thì cất về nhà.
- **Tỉnh dậy**: 6 giờ sáng hôm sau, trên giường phòng hồi sức; sức khoẻ 45, tinh thần −18, vệ sinh −22, uy tín −6, đói/khát −8. Bệnh viện cho ăn cháo nên không thể ngất tiếp ngay.
- Bản lưu v4 đang ở máu 0 được nâng lên 45 khi nạp (xem mục 6).

**Bệnh viện Phước An** — lô riêng trên Phố Trung Tâm, mở 0–24 giờ, có ba chỗ tương tác:

| Chỗ | Việc | Giá |
|---|---|---|
| Bác sĩ Hạnh (bàn tiếp nhận) | Khám bệnh, nói đúng bệnh đang có (cảm, suy nhược, đói, bẩn) | 20.000₫ |
| Quầy thuốc | Thuốc cảm (hết `flags.sick`), bông băng, thuốc bổ — uống ngay tại chỗ | 15.000 / 8.000 / 25.000₫ |
| Phòng hồi sức (giường + rèm) | Nằm hồi sức theo giờ: +14 máu, +10 năng lượng mỗi giờ | 5.000₫/giờ |

### 4.15 Đấm và nhảy

- **Nhảy** (`Space`, nút mũi tên): nảy 0,46 m trong 0,55 giây, tốn 0,7 năng lượng. Đang cõng gánh/xe đẩy/bao hàng thì không nhảy.
- **Đấm** (`F`, nút nắm tay): hồi chiêu 0,9 giây, tầm 1,7 m và phải đang nhìn về phía người đó (cos > 0,45), tốn 1,2 năng lượng. Trúng thì người đó la lên, **uy tín −3**, người xung quanh nhìn thấy (−1 nữa nếu từ hai người trở lên), tinh thần +1 (xả). Người đi đường: 55% quay lại đuổi đánh (`chase`), còn lại bỏ đi; đánh ba lần thì chắc chắn bị đuổi. Người đứng bán thì giận 90 giây, không nói chuyện. Trẻ con thì không đấm được.
- Đấm ai thì **mức bị để ý** tăng 18 điểm (xem 4.16). Không đấm được trẻ con.

### 4.16 Công an phường, tạm giữ và lao động

**Mức bị để ý (`wanted`, 0–100).** Mỗi cú đấm +18. Mỗi phút trong game tự nguôi 0,25 điểm, nên đánh lẻ tẻ
thì vài tiếng sau là hết. Từ **45 điểm** trở lên thì công an phường bắt đầu để mắt: cứ 2,5 giây một lần, nếu
chưa có chú nào đang đi tới thì gọi một chú (`Npcs.sendPolice()`) từ nút đường cách 9–26 m, chú đi thẳng tới
người chơi rồi mở hội thoại xử lý. Nộp phạt xong thì được yên 60 phút, `letGo()` (cãi thắng) trừ 15 điểm và
cho yên 45 phút.

**Đồn Công an phường** là lô thứ tư của block `12S` (rộng 9 m): mặt tiền biển xanh "CÔNG AN PHƯỜNG" +
băng đỏ, cột cờ, hòm thư góp ý, ghế nhựa ngoài sân. Trong nhà: bàn tiếp dân (chú Tám đứng sau), tủ hồ sơ,
bình nước, quạt trần, đồng hồ, bảng tin và bảng nội quy; vách ngăn ở z 6,0 có cửa song sắt dẫn vào **buồng
tạm giữ** — hai giường sắt, chiếu cói, xô nước, cửa sổ song sắt, một đống gạch và cây búa để lao động.

**Xử lý vi phạm** (`acts.caught`): bốn lựa chọn — nộp phạt hành chính (không đủ tiền thì khoá lựa chọn),
cãi (40% được tha), bỏ chạy (45% thoát, trượt thì thêm 10 điểm bị để ý) và đi theo chú về phường.

| Việc | Số |
|---|---|
| Tiền phạt | `60.000₫ + 900₫ × mức bị để ý + 40.000₫ × số lần đã vào phường` (làm tròn nghìn) |
| Án tạm giữ | `2 + ⌊mức bị để ý / 18⌋ + 2 × số lần` giờ, chặn trong 2–12 giờ |
| Đập đá một giờ | −60 phút tù (sàn 30 phút còn lại), −5 máu, −12 năng lượng, −8 vệ sinh, −6 tinh thần, −8 no |
| Nằm giường sắt | tua 2 giờ (hoặc tới hạn), +14 năng lượng, +2 máu, −2 tinh thần |
| Ra tù | uy tín −8, tinh thần −10, vệ sinh −18, thả trước cửa đồn |

Vào buồng thì `jailUntil` được đặt, `wanted` về 0, `flags.jail` +1. Trong lúc bị giữ, đi xa quá 6,5 m khỏi
giường là bị kéo lại kèm lời nhắc. Hết hạn thì `acts.jailOver()` gọi `release()` rồi đặt người chơi trước cửa.

**Chú Tám** (nhân vật cố định `police`, trực 24/24) bấm vào có menu: tự thú để nộp phạt, hỏi bao giờ được
về (khi đang bị giữ), và chuyện kiểm tra lấn chiếm lòng đường. Chip **"Bị để ý xx%"** hiện ở góc phải HUD,
đỏ khi từ 45% trở lên.

### 4.17 Điện thoại

Ba mẫu máy bán ở tiệm Đồ Nghề Ba Tài, bày trên tủ kính giữa tiệm (bấm vào từng máy để xem giá):

| Máy | Giá | Chức năng | Pin |
|---|---|---|---|
| Cục gạch (Nokia 1110i) | 180.000₫ | sổ thu chi, danh bạ, tin nhắn | 54 giờ |
| Nắp gập (Samsung E250) | 520.000₫ | thêm radio FM, nghe nhạc | 46 giờ |
| Cảm ứng (O2 Xphone) | 1.450.000₫ | thêm lướt web WAP | 40 giờ |

**Mở máy** bằng nút điện thoại trên HUD (chỉ hiện khi đã có máy) hoặc phím `P`. Chưa có máy thì bảng
nhắc bán ở đâu. Máy chỉ mở được khi còn pin.

- **Pin:** tụt 2,2%/giờ trong game khi để trong túi, cộng thêm khi nghe radio (−3%), nghe nhạc (−4%), lướt WAP
  (−6%), gọi điện (−2%). Hết pin thì mọi chức năng khoá. Sạc đầy khi ngủ ở chỗ trọ trở lên (nhà có ổ điện);
  gầm cầu và ghế đá công viên thì không. Tạp hoá Cô Ba và MiniMart cho **sạc nhờ 5.000₫** (ngồi chờ 20 phút).
- **Sổ thu chi:** đúng bảng của sổ tay giấy (doanh thu, giá vốn, tiền nhà, lãi lỗ, khách, điểm sao). Sổ giấy
  trong sổ tay vẫn giữ — ai chưa có máy thì không mất bảng này.
- **Danh bạ:** người đã quen + khách quen từng ghé. Gọi khách quen tốn 1.000₫ cước, mỗi người một lần một
  ngày, thân thêm 2 điểm (khách quen nhớ mặt, mai ghé sớm hơn).
- **Tin nhắn:** dựng từ tình hình hiện tại chứ không lưu vào bản lưu — nhắc khoản vay (kèm số ngày trễ), nhắc
  tiền phòng, tin của khách quen (khi thân từ 15 điểm trở lên), tin lừa "trúng thưởng xe Wave", dự báo thời
  tiết của tổng đài 1080. Chưa đọc thì có chấm đỏ trên nút điện thoại.
- **Giải trí:** radio 15 phút (+6 tinh thần), nhạc 15 phút (+8), WAP 10 phút (+5).

Mua máy mới thì máy cũ tự bán lại (chỉ giữ một máy trong ba lô). Bán máy ở tiệm thì mất sim.

### 4.18 Quán net

Một lô riêng ở Khu Dân Cư, mặt tiền 9,5 m: bảng hiệu *QUÁN NET HẢI ANH*, mái hiên sọc xanh, hai bảng nhỏ
dán tường (**3.000₫/GIỜ — trả trước · sạc nhờ 2.000₫** và **MỞ 6H — 23H**), cửa mở, ô cửa sổ có song sắt
nhìn vô thấy dãy máy sáng đèn.

**Trong quán:** hai dãy bàn sát tường, mỗi dãy 5 máy CRT (màn hình phát sáng, màu khác nhau, một máy dán giấy
*MÁY HỎNG*), ghế nhựa xanh, quạt trần, hai poster game dán vách, bảng nội quy, quạt cây, bình nước nóng lạnh,
thùng lon, đồng hồ treo tường. Quầy thu tiền bên trái cửa có két tiền, xấp thẻ máy và bảng **3K/1H**; tủ kem
nước ngọt bên phải. Dãy ổ điện trên tường có bảng **SẠC NHỜ 2K**.

| Dịch vụ | Giá | Ghi chú |
|---|---|---|
| Chơi game · lướt web | 3.000₫/giờ | tính theo phút, làm tròn 500₫ |
| Xem phim | 4.500₫/giờ | tính thêm nửa giá vì tốn đĩa |
| Sạc nhờ điện thoại | 2.000₫ | ngồi chờ 20 phút, pin đầy 100% |
| Nước ngọt | 8.000₫ | khát −24, tinh thần +3 |

- **Bốn gói giờ:** 30 phút · 1 tiếng · 2 tiếng · 4 tiếng. Trả tiền trước, hộp thoại ghi rõ được gì mất gì.
- **Hiệu ứng mỗi giờ:** chơi game +18 tinh thần, −2 sức, −3 no, −4 nước; lướt web +12, 0, −1, −2; xem phim +22,
  −1, −2, −3. (Lượt 11 nới tay: ngồi máy là chỗ thư giãn, không phải đi làm ngoài nắng — trước đây chơi game
  một tiếng đã mất 7 no 8 nước nên ngồi được một lát là vừa đói vừa khát.)
- **Mỏi mắt:** ngồi quá **120 phút một ngày** thì mọi gói giờ sau đó chỉ còn **70% tinh thần** và mất 1 sức khoẻ.
  Sang ngày mới thì tính lại từ đầu (nhật ký `flags.netDay` / `flags.netMin`).
- **Giờ mở cửa:** 6h–23h. Ngoài giờ đó thì chị chủ nói quán chưa mở.
- **Người:** chị Hạnh (chủ quán, đứng sau quầy, bán máy – sạc – nước, có hai câu chuyện về quán), thằng Bi
  (16h–22h, ngồi máy bên trái, mê kiếm hiệp) và con Nhung (18h–22h30, máy bên phải, chat với bạn trên Sài Gòn).
  Cả hai ngồi ghế nhựa, nói chuyện được, mỗi người hai câu chuyện.
- **Vào quán:** chạm vào chị Hạnh ở quầy, hoặc chạm **máy 04** (ghế trống) — cả hai mở cùng một bảng dịch vụ.

### 4.19 Đường phố 2005–2010: ô tô, đua xe đạp, xích đu

**Ô tô đời cũ** chạy chung dòng xe với xe máy và xe đạp (`src/data/cars.ts`, `src/game/traffic.ts`): Toyota
Corolla, Daewoo Matiz, Kia CD5 và xe tải nhỏ. Thân hộp vuông, kính phẳng tối, bánh nhỏ, hai đèn trước vàng và
hai đèn hậu đỏ. Ô tô chiếm 26% dòng xe nhưng **luôn có ít nhất một chiếc**; chạy làn ngoài (±2,1 m), tốc độ
4,2–7,2 m/s (xe tải chậm nhất, xe máy 7–11 m/s vẫn vượt), nhả khói xám sau pô mỗi 0,22 giây và bấm còi khi
người chơi đứng gần lòng đường. Xe tải có ca-bin có kính và thùng hàng phủ bạt.

**Đua xe đạp chủ nhật** (`src/sim/race.ts` luật thuần, `src/game/race.ts` phần chạy):

| Mục | Con số |
|---|---|
| Ngày, giờ | chủ nhật (`g.day % 7 === 0`), đăng ký 15h–17h30 |
| Vào cuộc | 5 phút đăng ký · cần 12% sức · mỗi ngày một lượt |
| Đường đua | vạch xuất phát ở x = 41 trên đường trước cổng công viên, chạy 38 m tới x = 79 |
| Nhịp đạp | 3 vòng × 3 nhịp, mỗi nhịp con chạy quét 0→1 trong 1,55 giây |
| Ăn điểm | trúng giữa vùng xanh 1,0 · lệch ra mép 0,45 · trượt 0 |
| Đối thủ | con Lan, sức cố định theo hạt giống (0,42–0,72 mỗi nhịp) |
| Thưởng | thắng 40.000₫ + 2,5 uy tín + 14 tinh thần (hoà tính như thắng); thua +0,5 uy tín, +5 tinh thần |

Người chơi đứng ở vạch rồi camera chạy dọc đường theo tiến độ; con Lan đạp bên cạnh, mạnh yếu thấy được bằng
mắt. Chín nhịp xong thì cộng thời gian (25 phút), trả thưởng, ghi `flags.raceDay`/`flags.raceWin`. Bấm **Bỏ dở**
thì mất năm phút đăng ký, không mất gì thêm, và vẫn đua lại được trong ngày.

**Xích đu công viên** (`xich_du` ở sân chơi, ba mức trong `src/data/fun.ts`): 10 phút +8 tinh thần, 20 phút +14,
40 phút +21, đều miễn phí, mở 6h–21h, mất chút sức và nước. Đu là chỗ chơi **có trần** — 40 phút là mức cao
nhất, không cày tinh thần bằng xích đu được.

### 4.20 Phố sống động: lịch sinh hoạt, chào hỏi, mưa nắng

`src/sim/life.ts` giữ phần luật thuần (kiểm thử được), `src/game/npc.ts` áp vào đời sống của người đi đường.

**Lịch sinh hoạt.** Mỗi người đi đường được phát một *kế hoạch* ba chỗ hay lui tới theo nhóm và theo giờ
(`routineFor`): công nhân sáng ra chợ, tan ca ghé quán; học sinh sáng tới trường, chiều ra quán vặt và công
viên; người lớn tuổi quanh quẩn ghế đá; vô gia cư ban ngày lân la chợ, tối về gầm cầu. Điểm đến được chấm
trọng số thêm theo giờ (`crowdWeight`) — chợ đông 6–10h, quán đông 10–14h, công viên và ghế đá đông sau
17h — và nhân thêm 3,5 lần nếu chỗ đó nằm trong kế hoạch của người ấy. Kết quả: phố đông đúng chỗ thay vì
rải rác ngẫu nhiên.

**Giờ cao điểm.** 6h24–8h12 và 16h18–18h18 mọi người đi nhanh 1,3 lần (`rushMul`), sau 22h thì chậm lại 0,9 —
tan tầm nhìn thấy rõ là phố vội hơn.

**Chào hỏi.** Đi ngang trong 5,2 m, mỗi người chào một câu (thưa, 35–90 giây một lần mỗi người) và chọn kiểu
chào theo thứ tự: **quen mặt** (đã nói chuyện với người chơi ít nhất một lần và uy tín > 6) → **mưa** → **nóng /
lạnh** → **buổi trong ngày**. Nói chuyện xong thì `markMet` ghi nhớ, lần sau họ chào thân hơn.

**Mưa nắng và đi cặp.** Trời mưa (rain > 0,35) người đang đi hoặc đứng tự động cầm dù (hai màu, tán dù che
qua đầu). Khoảng một phần ba số người đi đường xuất hiện thành **cặp**: hai người cùng chỗ hẹn, lệch nhau
khoảng nửa mét, vừa đi vừa nói chuyện, dừng lại thì đứng tám với nhau (kể cả lúc đang ngồi ghế đá).

**Ngồi ghế đá.** Chiều tối (sau 15h30 hoặc trước 8h) ra công viên thì tìm ghế trống mà ngồi (`sitOnBench`, bỏ
qua ghế đã có người), hết ghế mới đứng ngắm cảnh. Người lớn tuổi, học sinh tan trường, phụ huynh dắt con —
ai cũng có chỗ.

**Đám đông xem đua.** Khi vào cuộc đua xe đạp chủ nhật, bốn người hàng xóm được dựng ra vỉa hè đối diện,
quay mặt vào đường đua, nói một câu kiểu *“Ủa đua hả? Coi coi!”*. Về đích thì họ cổ vũ nếu thắng
(*“Đạp dữ thần!”*) và trêu nếu thua (*“Thua con Lan hả, bữa sau phục thù.”*).

**Sửa kèm trong lượt này**

- Bàn cờ của Ông Tư trước đây đặt ngay trước ghế đá ở (57, −72,5) nên ghế với bàn lồng vào nhau, ông ngồi
  lọt giữa. Dời ra khoảng trống phía bắc lối đi ngang hồ, ở (52,2, −56,9), cách ghế gần nhất 7 m.
- Biển hiệu mà mép cắm vào tường nhà bên cạnh / cột / thùng thì tự teo lại cho vừa khung (`Builder.signAt`),
  không còn tấm bảng thò hẳn sang nhà kế bên.
- Lỡ bị kẹt trong vật cản (khe hẹp, góc tường) thì người chơi tự bò ra chỗ trống gần nhất, không còn cảnh
  camera nằm gọn trong tường và màn hình chỉ còn một màu nâu.

### 4.21 Giao diện dễ đọc trên điện thoại

**Gợi ý cho biểu tượng.** Mọi thứ có thể chạm trên HUD đều mang thuộc tính `data-tip` — sáu thanh trạng
thái, đồng hồ, thời tiết, khu phố, tiền, uy tín, mức bị để ý, nợ, và bốn nút túi đồ / sổ tay / bản đồ / cài
đặt. Rê chuột thì hiện ngay, chạm (điện thoại) thì hiện 2,6 giây rồi tắt. Một ô `#ui .tip` duy nhất, định
vị dưới biểu tượng, tự lật lên trên nếu sát mép dưới màn hình.

**Cỡ giao diện.** `--ui-scale` đặt trên `#ui` (`applyLayout` trong `src/ui/layout.ts`), giới hạn 0,7–1,6
(`UI_SCALE` trong `src/game/ctx.ts`). Vì mọi kích thước trong `#ui` là `em`, đổi một biến là chữ, nút,
thanh trạng thái, chip, bong bóng thoại to nhỏ cùng lúc. Bảng cài đặt có ô xem trước ngay dưới thanh trượt
để thấy kết quả trước khi đóng bảng.

**Sổ tay công thức.** Mỗi món là một `<details>`: dòng đầu tên + loại + nguyên liệu + giá bán (~40 px),
mở ra mới thấy số lượng, dụng cụ, các bước và số phần đã bán. 60 món vẫn đọc lướt được.

**Chỗ giao hàng.** Điểm giao là cửa nhà người đặt; khi nhận đơn, một người nhận hàng được dựng ngay đó
(`NpcSys.deliverHere`, kèm hai chồng kiện các-tông) và được miễn luật dọn theo khoảng cách 105 m. Giao
xong (hoặc trả lại gói hàng) thì người này đi mất. Cột sáng chỉ đường thêm vòng sáng nhấp nháy dưới chân,
chip chỉ đường đổi màu đỏ và thêm biểu tượng thùng hàng khi đang giao.

**Âm thanh cảm xúc.** `Sound.voice(base, mood)` phát hai–ba tiếng ngắn mỗi khi một người đi đường mở miệng
(qua `NpcSys.say`), cao độ lấy từ `voicePitch(fem, size)` — nữ ~236 Hz, nam ~152 Hz, trẻ con cao hơn, người
tầm vóc lớn trầm hơn. Biểu cảm khó chịu (khi mắng, khi bị từ chối) thì dùng sóng răng cưa và ngữ điệu
vút lên. Chỉ phát trong 22 m, tối đa 2,5 lần/giây.

## 5. Điều khiển cảm ứng

- Chạm trong vùng bên trái (42% bề ngang, trừ dải 28% trên cùng) rồi kéo = cần đi; nơi khác = vuốt nhìn.
- **Chạm nhanh** (nhấc tay trong 0,6 giây, xê dịch dưới 14 px) ở bất kỳ đâu = chạm vào vật gần điểm chạm nhất trong bán kính `max(64 px, 11% chiều cao)`. Thời lượng đo bằng mốc thời gian của chính sự kiện nên máy giật vẫn nhận đúng.
- Nút tròn vàng thực hiện hành động với vật đang ở giữa màn hình.
- Trong mini-game, mọi thao tác trỏ được chuyển thẳng cho mini-game.
- **Người chơi tự xếp nút** (`ui/layout.ts`): sáu nhóm — nút tương tác, nút chạy, nút đấm, nút nhảy, hàng nút túi/sổ/bản đồ/cài đặt, các nút khi nấu ăn. Bàn phím: `E`/`Enter` tương tác, `F` đấm, `Space` nhảy, `R` hành động phụ, `M`/`B`/`Tab`/`P` (điện thoại), `Esc`. Mỗi nhóm lưu độ lệch so với chỗ mặc định tính theo phần bề ngang/bề cao màn hình và một hệ số phóng 0,6–1,8, riêng cho màn ngang và màn dọc. Áp bằng `transform`, và mỗi lần áp đều ép nút nằm trọn trong màn hình. Cỡ chung của giao diện là biến CSS `--ui-scale` (0,8–1,4) nhân vào cỡ chữ gốc; mọi kích thước HUD đều tính bằng `em` nên phóng theo.

## 6. Lưu game

`localStorage`, khoá `ganhhang.save.v1` (trạng thái) và `ganhhang.settings.v1` (cài đặt). Tự lưu sau việc quan trọng, mỗi 45 giây và khi rời trang. `SAVE_VERSION = 9`; `migrate()` nạp được bản lưu cũ thiếu trường và loại bỏ nguyên liệu không còn tồn tại. Bản lưu trước v4 chưa có sổ `met` nên được coi như đã quen hết người đứng quầy. Bản lưu trước v5 (chưa có bệnh viện) được nâng sức khoẻ lên 45 nếu đang ở 0 — nếu không, mở lên là ngất liền — và thêm sổ đồ thất lạc rỗng. Bản lưu trước v6 được cấp `wanted = 0` và `jailUntil = 0` (chưa ai biết mặt). Bản lưu trước v7 chưa có điện thoại (`phone = null`). Bản lưu trước v8 chưa có sổ phút ngồi quán net (`netDay = -1`, `netMin = 0`). Bản lưu trước v9 chưa có sổ ngày đua xe đạp (`raceDay = -1`, `raceWin = 0`). Cài đặt có thêm `ui` (cỡ giao diện và cách xếp nút); `cleanLayout()` làm sạch dữ liệu đọc lên.

## 7. Kiểm thử

- `tests/state.test.ts` — ván mới, kho, hư hỏng, nâng cấp bản lưu.
- `tests/economy.test.ts` — tiền, giá chợ, mặc cả, giá vốn, nhiên liệu, sơ chế/hoàn thiện, đồ nghề, vay nợ, phá sản.
- `tests/customers.test.ts` — quyết định mua, đánh giá, lượng khách.
- `tests/time.test.ts` — thời gian, chỉ số sinh tồn, thời tiết, sự kiện, chỗ ở, mô phỏng 45 ngày.
- `tests/data.test.ts` — tính nhất quán dữ liệu (nguyên liệu nào cũng mua được, dụng cụ nào cũng có bán, lưới đường đi liên thông, nhãn người lạ không lộ nghề hay tên…).
- `tests/settings.test.ts` — làm sạch dữ liệu bố cục nút.
- `tests/stall.test.ts` — sạp cố định: phí chỗ theo ngày, trừ tiền đầu ngày, thiếu tiền thì đóng quầy và treo nợ, mua sạp thì lên bậc 3 và chưa có chỗ.
- `tests/housing.test.ts` — chỗ ở: mã không trùng, thuê theo tuần thì giá cao hơn phải chứa nhiều hơn và đòi uy tín cao hơn, ba chỗ mới có đúng lô đất, chưa đủ uy tín thì không cho thuê và không trừ tiền, mã lạ thì trả về `false`, nợ hai ngày thì mất chỗ và mất tủ lạnh, chỉ nhà thuê theo tuần mới cắm được tủ lạnh.
- `tests/health.test.ts` — bệnh viện (lô đất riêng, ba món thuốc, chỉ thuốc cảm chữa cảm), mua thuốc/khám bệnh/nằm hồi sức kể cả khi không đủ tiền, ngất thì viện phí có trần và tiền không âm, rơi đúng 40% đồ và nhận lại được trong ngày, đồ nhặt lại không vượt sức chứa, bản lưu v4 đang ở máu 0.
- `tests/life.test.ts` — 6 bài về sinh hoạt của phố: giờ cao điểm nhanh/chậm, chợ–quán–công viên đông đúng giờ, lịch của từng nhóm người (không nhóm nào trả về danh sách rỗng hay trùng chỗ), kiểu câu chào theo quen mặt – mưa – nóng lạnh – giờ, bộ câu chào/cổ vũ dùng được cho mọi nhóm người, và cao độ giọng nói theo giới – tầm vóc.
- `tests/street.test.ts` — 12 bài về đường phố 2005–2010: bốn mẫu ô tô (tên, màu, cỡ, chậm hơn xe máy, xe tải chậm nhất), chín nhịp đua và vùng ăn điểm tất định theo hạt giống, chấm điểm giữa vùng/mép/trượt, sức đối thủ cố định, thắng–thua–hoà và tiền thưởng, chỉ chủ nhật và đúng khung giờ, mỗi ngày một lượt, bản lưu v8 lên v9, xích đu ba mức (lâu hơn thì nhiều tinh thần hơn, có trần, miễn phí, đêm đóng cửa).
- `tests/net.test.ts` — quán net: giá theo phút và phụ thu phim, bốn gói giờ, hiệu ứng từng kiểu chơi, mỏi mắt sau 120 phút (tinh thần còn 45%, mất 2 sức khoẻ) và tính lại khi sang ngày, ngồi máy làm đói khát tụt sức, tinh thần không vượt 100, giờ mở cửa và số máy, sạc nhờ/nước ngọt, lô đất và ba nhân vật của quán, bản lưu v7 lên v8.
- `tests/fun.test.ts` — bảng chỗ chơi (mã không trùng, có neo, có giờ hợp lệ, chơi lâu hơn thì lên tinh thần nhiều hơn) và thang mở công thức (cấp 1 mở đúng 1 món, cấp sau mở 2; luôn là món rẻ nhất còn thiếu; không vượt tay nghề; món sau không rẻ hơn món trước; cấp 10 mở đủ 60 món).

Ba bài mới ở lượt 2: mỗi nhân vật phụ phải có tên, nhãn việc, câu mở đầu và ít nhất hai câu chuyện đủ dài; bảng `RUDE` chỉ được có tối đa 8 nhóm và phải có đủ lời cho cả năm kiểu (giấy, khạc nhổ, mắng, đuổi, khạc nhổ khi bị xin tiền); khách quen không được trùng id hay tên và phải có cả tên kiểu học sinh.

Phần đồ hoạ và thao tác được chạy thử bằng các kịch bản trong `tools/probe/`: một trình chạy Puppeteer điều khiển Chrome không giao diện (WebGL phần mềm, giả lập cảm ứng), bấm chạm như người chơi, chụp màn hình để xem bằng mắt, và soát hình học cả thành phố (mặt trùng phẳng, biển hiệu bị che). Danh sách cụ thể những gì đã và chưa chạy thử nằm trong README.

## 8. Việc còn dang dở

Người chơi đã thử bản đầu và gửi danh sách góp ý; việc được chia thành ba lượt. **Lượt 1 đã xong** (tường nhấp nháy, biển hiệu bị che, tên và nghề của người lạ, tự xếp nút). Còn lại, theo thứ tự sẽ làm:

**Lượt 2 — đường phố sống động hơn: đã xong** (NPC thô lỗ với tỉ lệ thấp, tên đẹp và tên kiểu học sinh, xe chạy trên đường, chim bay và tiếng chim, sáu nhân vật phụ có chuyện riêng, sáu góc phố nhỏ). Chi tiết ở mục 4.7–4.9 và mục 3.

**Lượt 3 — nội dung còn thiếu so với bản mô tả đầy đủ: đã xong phần chính** (60 món và thang mở công thức, chỗ chơi lên tinh thần, khách đứng mua, việc lúc rảnh của người đi đường, nút cất gánh, chạy bàn và bốc cảng). Chi tiết ở mục 4.3, 4.10, 4.11.

**Lượt 6 — sức khoẻ và bệnh viện: đã xong** (ngất vì máu 0, viện phí có trần, rơi đồ nhặt lại được trong ngày, Bệnh viện Phước An với khám bệnh – quầy thuốc – phòng hồi sức, nút đấm và nút nhảy). Chi tiết ở mục 4.14–4.15. **Lượt 7 — công an phường, tạm giữ, lao động: đã xong** (mức bị để ý, công an đi tuần gọi lại, đồn Công an phường có buồng tạm giữ, nộp phạt / cãi / bỏ chạy / theo về phường, đập đá bớt giờ, ra tù mất uy tín). Chi tiết ở mục 4.16. **Lượt 8 — điện thoại: đã xong** (ba mẫu máy, pin, sổ thu chi, danh bạ, tin nhắn, radio – nhạc – WAP, sạc). Chi tiết ở mục 4.17. **Lượt 9 — quán net: đã xong** (quán 10 máy ở Khu Dân Cư, thuê máy theo phút, chơi game – lướt web – xem phim, mỏi mắt sau 2 tiếng, sạc nhờ, nước ngọt, chủ quán và hai đứa nhỏ ngồi máy). Chi tiết ở mục 4.18. **Lượt 10 — đường phố 2005–2010: đã xong** (ô tô đời cũ nhả khói và bấm còi, đua xe đạp chủ nhật ba vòng bằng cách bấm nhịp, xích đu công viên). Chi tiết ở mục 4.19. **Lượt 11 — phố sống động: đã xong** (lịch sinh hoạt theo giờ, giờ cao điểm, chào hỏi theo quen mặt – mưa nắng, dù khi mưa, đi cặp, ngồi ghế đá, hàng xóm xem đua; sửa bàn cờ Ông Tư, biển lọt tường, kẹt trong tường; quán net nhẹ bụng hơn). Chi tiết ở mục 4.20. **Lượt 12 — giao diện dễ đọc: đã xong** (gợi ý cho biểu tượng HUD, chữ tiền/thoại to hơn một chút, cỡ giao diện 70–160% có ô xem trước, sổ tay công thức gọn một dòng mỗi món, chỗ giao hàng có người nhận đứng chờ với kiện hàng, cô Hồng dời qua bên kia tường cổng chợ, "Quang gánh" gọi ngắn là "Gánh", ô mục tiêu có nút thu gọn, tiếng nói cảm xúc cho người đi đường; sửa lỗi sửa xe không có xe vẫn trừ tiền). Chi tiết ở mục 4.21. Kế hoạch các lượt nằm ở `PLAN.md`.

Còn lại:

1. **Đã xong 3 kiểu chỗ ở mới: căn hộ, nhà riêng, cửa hàng kiêm nhà ở** (8/8) — xem mục 4.13.
2. **Đã xong sạp cố định (bậc 3)** — xem mục 4.12. Việc kế tiếp của nhánh này: quán ăn nhỏ, quán có chỗ ngồi, nhà hàng bình dân, chuỗi cửa hàng (mới có tên trong `FUTURE_TIERS`).
3. Hệ thống băng nhóm, nhân viên phụ bán.

**Việc nền chưa làm**

- Đo trên điện thoại thật: người chơi báo máy của họ chạy trên 50 khung hình/giây, nhưng chưa rõ đó là máy nào. Nếu máy yếu chạy chậm: gộp các khối cơ thể NPC thành một lưới, dùng instancing cho đồ vật lặp lại, bỏ sương mù theo điểm ảnh ở mức thấp, thêm LOD cho khu ở xa.
- Nghe thử và cân chỉnh âm thanh.
- Cân bằng nhịp độ qua chơi thử: tốc độ kiếm vốn ngày đầu, lượng khách lúc uy tín thấp, độ khó các mini-game.
- Kỹ thuật: tách gói JavaScript (hiện một tệp khoảng 930 kB, nén còn 280 kB), service worker để chơi ngoại tuyến, nội thất cửa hàng chi tiết hơn.

Lỗi nhỏ đã biết: dòng "Dụng cụ" và "Sơ chế" trong Sổ tay còn thừa dấu "·" ở cuối; ở màn dọc HUD chật (game khuyên xoay ngang).
