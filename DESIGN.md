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

1. **`src/sim` không biết gì về đồ hoạ hay DOM.** Nó báo việc cần hiển thị qua `core/bus.ts` (toast, âm thanh, yêu cầu lưu). Nhờ vậy 560 bài kiểm thử (46 tệp) chạy trong Node trong khoảng 15 giây.
2. **Mọi ngẫu nhiên trong luật chơi nhận một `RNG` có hạt giống** làm tham số cuối, nên kết quả kiểm thử lặp lại được.

Vòng lặp chính (`src/main.ts`): đọc điều khiển → `advance()` cho thời gian game trôi (0,75 phút game mỗi giây thật, một ngày = 32 phút thật; khi ngủ 48 phút game mỗi giây) → cập nhật người chơi, NPC, quầy, nấu ăn, môi trường → vẽ. `dt` bị chặn ở 50 ms nên máy rất chậm thì game chạy chậm lại chứ không nhảy cóc.

## 3. Thế giới

- 3×3 ô phố, mỗi ô 46 m, đường rộng 7 m, vỉa hè 3 m; thêm dải gầm cầu vượt phía nam. 144 lô đất (121 ô đất phân biệt — vài lô bị thay khi dựng tiệm cắt tóc, tiệm thời trang và các mặt bằng lớn), 268 nút đường đi.
- 10 khu với độ giàu và độ an toàn khác nhau; lượng người theo giờ lấy từ `hourCurve(giờ, khu)`.
- 6 chỗ bán: Hẻm Công Nhân (miễn phí, ×0,85 người qua lại), Cổng Công Viên (20.000₫, ×1,05), Cổng Chợ (30.000₫, ×1,35), Phố Văn Phòng (60.000₫, ×1,25, cần xe đẩy), và hai **mặt bằng có sân** cho quán ăn nhỏ trở lên: Mặt bằng Phố Văn Phòng (160.000₫, ×1,45, cần bậc 4) và Mặt bằng Khu Căn Hộ (120.000₫, ×1,30, cần bậc 4).
- Hình học tĩnh được gộp sẵn theo từng khu thành vài lưới lớn; biển hiệu vẽ chung vào một tấm atlas. Nhân vật là khung khối hộp có khuôn mặt vẽ từ atlas.
- **Không để hai mặt trùng phẳng.** Hai mặt cùng hướng nằm đúng một mặt phẳng sẽ tranh nhau hiển thị (nhấp nháy). Vỏ nhà (`shell`) bỏ mặt trong của tường bao vì lớp lót nội thất đã phủ đúng chỗ đó (`MB.box(..., skip)` với các hằng `FACE`); thứ gì dán lên tường thì nhô ra ít nhất 1–2 cm; vật liệu biển hiệu dùng `polygonOffset` để thắng tấm nền khi nhìn từ xa. `tools/probe/steps/audit.mjs` dò lại toàn thành phố.
- **Biển hiệu phải đọc được từ dưới đường.** `Builder.signAt` ghi mọi biển đủ lớn vào `Builder.signs`. Biển cửa hàng treo ở mặt trước ban công tầng 1 (nếu có) hoặc là hộp đèn nhô khỏi mép mái; biển dọc chìa ra ngoài tầm ban công. Cây vỉa hè hỏi `signTopBehind()`: sau cây có biển thì trồng dáng thân cao (tán trên 4,8 m), biển cao quá 4,78 m thì để trống chỗ đó. Cây bị bỏ vẫn tiêu đúng số lần gọi ngẫu nhiên nên phần còn lại của thành phố không đổi.
- **Sáu góc phố nhỏ** (`world/side.ts`) không phải toà nhà: bàn trà đá + ghế nhựa trước tạp hoá, tường vẽ dưới gầm cầu (mặt có hình hướng ra phố, Bin nhảy trước tường trên tấm các-tông), bạt vá xe căng trên hai cây sào, ghế hát rong + thùng ủng hộ, bàn cờ tướng trong công viên, thùng gỗ đánh giày. Mỗi chỗ ghi neo `v_<id>` cho nhân vật (ngồi trên đúng mặt ghế: neo cao 0,53 m với ghế nhựa/thùng gỗ) và một neo dùng được (`tra_ban`…). Đồ đạc nhỏ đều nằm trong lưới `detail` của khu, có `collide` riêng.
- **Xe cộ** (`game/traffic.ts`): người đi đường chạy xe máy/xe đạp trên các trục đường trong `CORR`, đúng làn (lệch 1,7 m), có mũ bảo hiểm, bấm còi khi người chơi đứng gần lòng đường. Xe vào cảnh từ 35–85 m phía sau người chơi và được thay khi ra khỏi tầm nhìn, nên luôn có xe để thấy mà không phải vẽ cả thành phố. Không tương tác được.
- **Chim trời** (`world/birds.ts`): 1–7 con bay vòng ở độ cao 9–18 m quanh một nút đường gần người chơi, vỗ cánh bằng cách xoay hai cánh, quỹ đạo được chọn lại khi bay quá xa. Ban đêm (độ tối > 0,72) và mưa to thì chim đi ngủ. Tiếng hót phát qua `Sound.chirp()` theo khoảng cách (xa thì nhỏ), chỉ khi người chơi không ở trong nhà.
- Bầu trời là shader riêng (mây lấy từ một tấm nhiễu 256² tạo sẵn), mưa là tối đa 2.400 vệt chạy trên GPU, không rơi dưới mái che. Hễ có mưa, trời chuyển dần sang xám (độ u ám `Env.ov`), nắng dịu đi và mặt đường sẫm lại.

## 4. Các hệ thống và con số

### 4.1 Sinh tồn
Sáu chỉ số 0–100: no, khát, năng lượng, sức khoẻ, vệ sinh, tinh thần. Đói/khát kéo sức bền tối đa xuống (`staminaMax`), thiếu ngủ làm thao tác nấu khó hơn (`cookEase`), bẩn làm khách quay đi và bị phạt khi thanh tra. **Máu và năng lượng còn quyết định tốc độ hồi thanh thể lực** (`staminaRegenMul`, §4.36): người đang thương hồi khoảng một nửa tốc độ và tụt nhanh hơn khi chạy. Chỗ ngủ quyết định chất lượng giấc ngủ và nguy cơ mất trộm:

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

### 4.22 Bậc 4 — quán ăn nhỏ

`TIERS[4]` (`src/data/gear.ts`): chứa 150 kg, giữ lạnh 55 kg, hàng đợi 9, bày 16 món, 32 khay, độ hiện 1,5.
Đồ nghề `quanan` giá 24.000.000₫, bán ở tiệm Đồ Nghề Ba Tài, đòi có sạp cố định trước (luật `TIERS[tier-1]`
sẵn có). `buyGear` đưa quầy về `where: 'carried'` nên phải chọn chỗ dựng lại.

**Mặt bằng.** Hai lô trống mới trong `SPECIALS` của `src/world/layout.ts` (`matbang_tb` 9 m ở Phố Văn Phòng,
`matbang_dc` 8 m ở Khu Căn Hộ) tương ứng hai `SPOTS` cùng tên với `minTier: 4`, phí 160.000₫ và 120.000₫.
`StallSys.placeAt` chặn bậc ≥ 4 ở chỗ có `minTier < 4`. Tiền thuê ngày dùng chung đường `stallRent` của sạp.

**Mô hình** (`StallSys.rebuild`): quầy gỗ 4,4 × 0,9 m, mặt bàn đá, mái tôn xanh 5,2 m có băng-rôn vàng và
hai cột, bảng hiệu chạy ngang; sân trước có hai bàn nhựa ở ±1,75 m và bốn ghế đẩu (z 1,45 và 2,85). Dụng cụ
bếp (bếp, vỉ, nồi, chảo, thớt) bày trên mặt quầy rộng, thùng đá và đèn lệch ra hai đầu.

**Chỗ ngồi.** `StallSys.SEATS = 4`, `seatPos(i)` là toạ độ thế giới của bốn ghế; `slotPos` trả về chỗ ngồi
cho `i < 4` và chỗ đứng (lz 3,6) cho phần còn lại; `freeSlot` xếp khách vô ghế trước rồi mới tới chỗ đứng.
`arrived` đặt `pose = 'sit'` cho khách có ghế, và kiên nhẫn ×1,5 (mưa không trừ vì đã có mái). Khách vẫn
được phục vụ như cũ: chạm vào khách, giao món, tính tiền, rồi đứng dậy đi.

### 4.23 Biểu cảm, kiểu tóc và người phụ việc

**Atlas mặt 16 × 8.** `FACE_COLS = 16`, `FACE_ROWS = 8` (`src/gfx/tex.ts`): 8 cột cũ (thường, vui, rất vui,
khó chịu, giận, buồn, ngạc nhiên/nói, chớp mắt) và 8 cột mới — 8 cười mỉm, 9 nháy mắt, 10 buồn ngủ, 11 đau,
12 sợ, 13 khinh, 14 ăn ngon, 15 phồng má hờn. Tên đặt trong `src/data/expr.ts` (`EXPR`, `EXPR_NAMES`) — tệp
thuần dữ liệu để `src/sim/rules.ts` dùng được mà không kéo three.js vào phần kiểm thử. `faceAtlas()` và
`Rig.setExpr` tính UV từ `FACE_COLS`/`FACE_ROWS` nên đổi bề ngang atlas là đủ; `drawFace` chỉ thêm nhánh theo
`ex` (mắt cong cho 2/8/14, nháy mắt một bên cho 9, X cho 11, mắt mở to + mồ hôi cho 12, mí sụp 0,6 cho 13,
mồm nghiến cho 11, chu môi cho 15, chữ “z” cho 10). Giọng đọc trong `Npc.say` cũng đổi theo bảng này:
giận = 3/4/11/13, vui = 1/2/8/9/14.

**Gắn với tình huống** (`npc.ts`, `stall.ts`, `rules.review`): chào người quen → cười mỉm, mưa → khó chịu,
nắng nóng/khuya → buồn ngủ, lạnh → phồng má hờn, bị đấm → đau, khách bỏ đi vì giá → khinh, khách hài lòng
→ ăn ngon (≥ 4,7★) hoặc rất vui (≥ 4,4★).

**Tám kiểu tóc** (`Look.hairStyle`, dựng trong `buildBody`): 0 ngắn, 1 dài, 2 búi, 3 hói, 4 xoăn (chùm lọn
nhỏ phủ đỉnh đầu), 5 đuôi ngựa (buộc sau gáy, đuôi dài 0,3 m), 6 húi cua (sát da đầu, hai bên cao), 7 tém
ngang vai. `lookFromArch` lọc lại theo giới tính (nam: 1/5/7 → 0 hoặc 6; nữ: 3 → 2, 6 → 7) và dữ liệu nhóm
người (`src/data/people.ts`) đã chia kiểu tóc mới cho công nhân, học sinh, dân văn phòng, shipper, tài xế,
phụ huynh, trẻ em, du khách, người giàu, vô gia cư, phê bình, hàng rong, giang hồ, công an.

**Người phụ việc.** Luật thuần trong `src/sim/rules.ts` (`helperGate`, `hireHelper`, `fireHelper`,
`helperPatience`, `helperCandidate`), dữ liệu ứng viên trong `HELPER_POOL` (5 người, lương 55.000–70.000₫).
Chỉ được nhận khi **cả ba**: quầy từ xe đẩy trở lên (`tier ≥ 2`), **tổng doanh thu bán hàng ≥ 250.000₫**
(`stallRevenue` = sổ hôm nay + 30 ngày đã khoá), và **đã bán qua ≥ 2 ngày** (`firstSale` ghi ở lần bán đầu).
Đủ điều kiện thì `StallSys.offerHelper` mới thỉnh thoảng (240–420 giây, chỉ khi quán mở và người chơi ở gần)
cho một người đi tới xin việc; hộp thoại có hai lựa chọn, nhận việc thì trả trước một ngày lương
(`hireHelper` gọi `spend(..., 'fees')`).

Đang làm việc (`Game.help`, lưu vào bản lưu v10) thì người phụ đứng cạnh quầy phía người bán
(`helperSpot`, lệch 1,1 m), giữ kiên nhẫn khách ×1,3 (`helperPatience` trong `arrived`), tự lau quầy
(–3 độ bẩn mỗi 45–75 giây) và nói theo tình huống mỗi 50–85 giây: khách quậy → sợ, quầy bẩn → khó chịu,
khách đông → vui, mưa → cười mỉm, khuya → buồn ngủ, doanh thu ≥ 300.000₫ → rất vui, khách bỏ đi → buồn,
người chơi mệt → phồng má hờn. Sáng hôm sau `newDay` trừ lương; không đủ tiền thì người phụ xin nghỉ. Chạm vào
người phụ để mở hộp thoại: hỏi chuyện bán buôn (doanh thu + số khách hôm nay), dặn dò khách chờ (tinh thần +2),
hoặc cho nghỉ việc. Đóng quầy thì họ về.

### 4.24 Góc nhìn thứ ba, tiệm cắt tóc và tiệm thời trang

**Dữ liệu ngoại hình.** `src/data/looks.ts` là dữ liệu thuần (không kéo three.js vào phần kiểm thử):
`PlayerLookData` gồm `face, fem, hairStyle, hair, shirt, pants, skin, shoe, hat, hatCol, fat, h`. Ba bảng bán:
`HAIR_STYLES` (8 kiểu, 12.000–45.000₫), `HAIR_COLORS` (4 màu, 10.000–30.000₫), `SHIRT_COLORS` (6 × 25.000–30.000₫),
`PANTS_COLORS` (5 × 18.000–24.000₫), `SHOE_COLORS` (3 × 12.000–45.000₫), `GLASSES` (bỏ kính / gọng cận / kính đen,
0–60.000₫). `defaultLook(fem)` là bộ đồ mở ván (nam nữ khác nhau), `cleanLook(raw, fem)` kẹp mọi trường đọc từ bản
lưu — kiểu tóc 0–7, mũ 0–4, dáng 0,8–1,3, cao 0,85–1,12, màu cắt về 24 bit — nên bản lưu hỏng không làm vỡ hình.

**Góc nhìn thứ ba** (`src/game/player.ts`, `Settings.cam3`, phím **V**, nút trong Cài đặt). `Player` giữ sẵn một
`Rig` riêng (`rig`, `rigCarry`) — đúng mô hình dùng cho người đi đường — và `applyLook()` bơm `Game.look` vào đó;
`syncCarry()` gắn bản sao gánh / xe đạp / bao / thùng lên lưng khi đang mang. Bật cam3 thì camera lùi **3,0 m** sau
lưng (thêm 1,2 m khi đẩy xe đạp, 0,35 m khi gánh), dò lùi từng 0,2 m để không xuyên tường và nép tới 1,6 m; dưới
2,0 m thì giấu nhân vật đi để camera không chui vào trong đầu. Vị trí và độ lùi làm mượt bằng `camP` / `camDist`;
lần đầu bật (hoặc sau khi dịch chuyển) thì đặt thẳng chứ không trượt. Góc nhìn thứ nhất vẫn là mặc định, mọi thứ
khác (bán hàng, nấu, chạm, cần ảo) không đổi.

**Tiệm cắt tóc "Chú Bảy Kéo"** — trong chợ Xóm Chiều, lối đi giữa hai dãy sạp (x ≈ −45,5, z ≈ 8,2, mở 7–19h):
ghế sắt có tựa lưng, tay vịn, gối đầu, tấm lót chân; gương khung gỗ treo biển **CẮT TÓC 15.000₫** và bóng đèn tròn;
bàn đồ nghề (kéo, lược, tông đơ, chai nước hoa), thùng nước, khăn, áo choàng. Neo `v_hot_toc` cho thợ và
`hot_toc_ghe` cho khách ngồi. Menu hai bảng: **8 kiểu tóc** (`barberStyles`) và **4 màu nhuộm** (`barberColors`).
Ngồi vào ghế (`barberChair`) mở lại hai bảng đó, hoặc nghỉ 20 phút +6 tinh thần.

**Tiệm thời trang "Cô Ngọc"** — cùng dãy chợ, phía nam (z ≈ −8,2, mở 7h30–20h): giá sắt treo 7 áo (móc, vai, tay,
lai, cổ áo), bàn gấp đồ có chồng áo, khay kính, khay ba đôi giày, biển **QUẦN ÁO 25.000₫**. Menu bốn mục — áo,
quần, giày, kính — dùng chung `shopColors()`; kính là `face` 5 (gọng cận) và 6 (kính đen), "bỏ kính" miễn phí.

**Một đường mua chung** (`Acts.buyLook`): trừ tiền qua `spend(..., 'other')`, ghi thẳng vào `g.look`, gọi
`ctx.player.applyLook()` để thấy ngay, cộng 4 tinh thần, mất 15 phút, tiếng xu và câu cảm ơn kèm biểu cảm vui của
người bán. Bấm V khi chưa bật góc nhìn thứ ba thì toast nhắc — đó là cách duy nhất thấy bộ đồ mình vừa mua.

### 4.25 Bậc 5 — quán có chỗ ngồi, thực đơn theo buổi và gọi thêm món

`TIERS[5]` (`src/data/gear.ts`): chứa 200 kg, giữ lạnh 70 kg, hàng đợi 12, bày 20 món, 40 khay, độ hiện 1,6.
Đồ nghề `quanngoi` giá 58.000.000₫ ở tiệm Đồ Nghề Ba Tài, đòi có **quán ăn nhỏ (bậc 4)** trước. Dựng tại hai mặt
bằng có sân (`matbang_tb` Phố Văn Phòng 160.000₫/ngày, `matbang_dc` Khu Căn Hộ 120.000₫/ngày). Bậc 6 xem mục 4.26, bậc 7 (chuỗi cửa hàng) xem mục 4.27 — `FUTURE_TIERS` nay rỗng.

**Mô hình** (`StallSys.rebuild`): quầy gỗ dài 5,6 m mặt đá + yếm đỏ, hiên mái tôn xanh 6,9 × 5,9 m có diềm vàng,
hai vách thấp hai bên, hai bồn cây phía trước chừa lối vào rộng ở giữa, nền gạch bông ca-rô đỏ–kem, quầy thu ngân
nhỏ bên hông, và **ba bàn gỗ – sáu ghế tựa lưng** (trên mỗi bàn có hộp khăn giấy và chai nước tương). Khi đã lên
bậc 5 thì bộ bàn nhựa rời (`ghe`) không vẽ đè lên sân gạch bông nữa.

**Chỗ ngồi và ăn tại chỗ.** `seatCount(tier)` (`src/sim/rules.ts`) trả về 6 cho bậc ≥ 5, 4 cho bậc 4, 0 cho bậc ≤ 3;
`dineIn(tier)` là `true` từ bậc 5 trở lên. Hàng đợi lùi ra `lz = 5,4 m` (ngoài hiên) để không đứng chen vào ba bàn
gỗ; sáu chỗ đầu (`SEATS5`) ngồi vào 6 ghế (`pose = 'sit'`), kiên nhẫn **×1,9** (nhân thêm `helperPatience` nếu có
người phụ việc).

**Thực đơn theo buổi.** Bốn buổi trong `PERIODS`: *Buổi sáng* (< 10h), *Buổi trưa* (10h–14h30), *Buổi chiều*
(14h30–20h), *Khuya* (≥ 20h). `fitsPeriod(dish, h)` kiểm `dish.hours[mealSlot(h)] ≥ 0,8`; `periodMenu(g)` đếm số
món đang bật hợp buổi hiện tại. Trong `decide()`, khách chọn món theo xác suất có trọng số tỉ lệ với `w³` (thay vì
chọn cứng `argmax`), và ở quán `dineIn` món hợp buổi được nhân thêm **×1,35** — nên khách vừa ưu tiên món đúng buổi
rõ rệt (tăng ~5 điểm phần trăm tỉ lệ chọn món hợp buổi), vừa giữ đủ độ đa dạng cho cả thực đơn 20 món. Bảng Quầy
gắn nhãn xanh **`hợp buổi này`** / vàng **`ngoài buổi`** trên từng món khi quầy từ bậc 5 trở lên, và thẻ Thông tin
quầy hiện thêm *Chỗ ngồi (6 ghế trong nhà)*, *Buổi bán*, *Hợp buổi (N món)*.

**Gọi thêm món (`secondOrder`).** Khách ngồi ghế ở quán `dineIn`, không phải nhân vật sự kiện (`!n.actor`), mới gọi
lần đầu (`!o.more`), sau khi ăn món chính hoặc món vặt hài lòng (`stars ≥ 3,8`) sẽ có xác suất `0,28 + 0,22 × (stars − 3,8)`
(khoảng 32–54%) ngồi lại gọi thêm một món **nước uống** hoặc **tráng miệng** (`drink` / `sweet`) đang bật trên thực
đơn và còn nguyên liệu (trừ món vừa ăn), với giá thấy hợp lý ≥ 85% giá bán. Đơn gọi thêm đánh dấu `o.more = true`,
kiên nhẫn ×1,8 × `helperPatience`, câu thoại lấy từ `LINES.order_more` (*"Cho thêm ly nước nữa nha."*, *"Ngon quá,
bán thêm phần tráng miệng đi!"*…). Khi giao món đầu mà khách gọi thêm thì khách **vẫn ngồi tại ghế** chờ món thứ hai;
ăn xong món thứ hai mới đứng dậy ra về.

### 4.26 Bậc 6 — nhà hàng bình dân, đặt bàn trước, phụ bếp và khách đoàn

`TIERS[6]` (`src/data/gear.ts`): chứa 280 kg, giữ lạnh 100 kg, hàng đợi 16, bày 26 món, 56 khay, độ hiện 1,85.
Đồ nghề `nhahang` giá 145.000.000₫ ở tiệm Đồ Nghề Ba Tài, đòi có **quán có chỗ ngồi (bậc 5)** trước. Dựng ở hai
**mặt bằng** có sân như bậc 4–5 (`matbang_tb` 160.000₫/ngày, `matbang_dc` 120.000₫/ngày). Bậc cuối (chuỗi cửa
hàng) xem mục 4.27 — `FUTURE_TIERS` nay rỗng.

**Trong nhà kín.** `isRestaurant(g)` = `tier >= 6` là cờ duy nhất cho cả cụm tính năng dưới đây — đừng so sánh
`tier === 6` rải rác. Nhờ `isRestaurant`, ban đêm không có đèn chỉ còn ×0,72 sức hút (bậc ≤ 5 là ×0,3) và trời mưa
**không mất khách** (`stallAppeal`: `wx.rain > 0,3` ⇒ ×1,0 thay vì ×0,45); `dieu_hoa` cộng thêm ×1,18 và `wc_lavabo`
cộng điểm hài lòng cho nhóm khó tính. `seatCount(g)` trả **8** (4 bàn), `dineIn(g)` vẫn `true` nên khách ăn tại chỗ,
ngồi lâu ×1,9 và vẫn gọi thêm nước/tráng miệng như mục 4.25.

**Nhân sự (tối đa 4 người).** `maxHelpers = 2` (phục vụ) và `maxSous = 2` (phụ bếp) khi là nhà hàng, mỗi slot lưu
riêng (`help`/`help2`, `sous`/`sous2` trong `Game`; slot 2 chỉ có hiệu lực khi `isRestaurant`). `helperPatience`
cộng ×0,28 khi có người phụ quầy thứ hai và ×0,22 khi có `dieu_hoa`. `sousGate(g)` chặn thuê phụ bếp dưới bậc 6 với
lý do hiện cho người chơi; `hireSous` trừ **một ngày lương** ngay (95.000–110.000₫ tuỳ người trong `SOUS_POOL`),
`fireSous(g, slot)` cho nghỉ sạch. Sang ngày, `newDay` trừ lương phụ bếp; thiếu tiền thì người đó nghỉ và có toast.

**Phụ bếp tự làm (`sousWork`).** Gọi mỗi ~18–22 giây khi quầy đang mở: (1) ưu tiên **sơ chế** một món trong thực đơn
có bước sơ chế mà lượng sơ chế sẵn còn dưới 2 phần, (2) nếu không thì **ra sẵn 1 phần** cho món còn dưới 2 phần trên
khay và khay còn chỗ. Cả hai đều kiểm **nhiên liệu trước khi tiêu** (`hasFuelFor`) nên không bao giờ rò nguyên liệu
khi hết gas/than; chất lượng do phụ bếp làm thấp hơn tay người chơi (≈0,76–0,93 nhân dần theo cấp tay nghề).

**Đặt bàn trước (`createBooking`, `acceptBooking`, `rejectBooking`, `dueBooking`, `reservedSeats`, `expireBookings`).**
Chỉ khi `isRestaurant`. Khách vãng lai gọi `createBooking` mỗi 85–135 giây nếu đang có dưới 2 phiếu; mỗi phiếu có
tên, giới, nhóm người (văn phòng/phụ huynh/nhà giàu/du khách/công nhân), **cỡ 2–4 người**, ngày + giờ hẹn (làm tròn
nửa giờ, trong khoảng 8h–21h), món dự kiến và **tiền cọc 12.000₫/người** (làm tròn nghìn). Trần `BOOKING_MAX = 4`
phiếu đang mở. Người chơi **nhận** (giữ chỗ) hay **từ chối** trong Quầy › Nhân sự & Đặt bàn. `reservedSeats` trừ số
ghế đã giữ khỏi chỗ trống khi đón khách thường, nên bàn đặt trước không bị người khác ngồi mất. Đến giờ hẹn ±(15
phút trước, 60 phút sau) thì khách tới và được xếp vào đúng số ghế; quá hẹn mà chưa đón ⇒ `expireBookings` trả về
phiếu lỡ, người chơi **mất 0,5 uy tín** kèm toast cảnh báo.

**Khách đoàn (`decideGroup`).** Ở bậc 6, mỗi lượt sinh khách có 24% là **đoàn 3–4 người** (4 người nếu còn đủ 4 ghế
trống và đủ hàng chờ, xác suất 45%) — nhưng chỉ khi còn ≥ 3 ghế trống sau khi trừ `reservedSeats`. Cả đoàn **gọi
chung một lượt**: `Order.group = size`, `Order.n` = số phần gọi (kẹp theo lượng sẵn có và ngân sách nhóm
`budget × size`), câu gọi có nhắc số người. Món nào còn đủ cho cả đoàn được nhân ưu tiên ×1,6 nên khách đoàn ít khi
gọi món chỉ còn 1–2 phần.

### 4.27 Bậc 7 — chuỗi cửa hàng: điểm bán thứ hai, người trông coi và sổ từng điểm

`TIERS[7]` (`chuoi`, `src/data/gear.ts`): chứa 320 kg, giữ lạnh 120 kg, hàng đợi 18, bày 30 món, 64 khay, độ hiện 2,0.
Đồ nghề `chuoi` giá **320.000.000₫** ở tiệm Đồ Nghề Ba Tài, đòi **nhà hàng bình dân (bậc 6)** trước. Đây là bậc cuối:
`FUTURE_TIERS` nay là mảng rỗng. `isChain(g)` = `tier >= 7` là cờ duy nhất cho cụm tính năng dưới đây.

**Chi nhánh là gì.** `Game.branch` (`Branch`, `src/sim/state.ts`) là **một** điểm bán thứ hai, **không** phải quầy thứ
hai có khách 3D: người chơi vẫn bán ở quầy chính, còn chi nhánh do **người trông coi** bán hộ các món đã nấu sẵn ở
quầy chính (chuyển sang theo từng món). Nhờ vậy toàn bộ luồng khách, hàng đợi, chỗ ngồi hiện có **không phải sửa** —
chi nhánh chỉ có một vòng tính theo phút.

**Chỗ đặt (`BRANCH_SITES`).** Ba điểm cố định trong thành phố, khác nhau về tiền thuê và sức hút:

| id | Tên | Thuê/ngày | Sức hút |
|---|---|---|---|
| `cho` | Sát cổng chợ | 120.000₫ | 1,15 |
| `vp` | Phố văn phòng | 150.000₫ | 1,25 |
| `cv` | Cổng công viên | 90.000₫ | 0,95 |

`branchGate(g)` kiểm: đã bậc 7, chưa có chi nhánh, đủ tiền **thuê ngày đầu**; `openBranch(g, site)` trừ tiền thuê ngày
đầu rồi tạo `Branch { spot, rent, open: true, keeper: null, ready: [], led, tot, hist }`. `closeBranch(g)` dọn chi
nhánh, trả lại **một nửa** tiền thuê ngày đầu và bỏ toàn bộ món đang để ở đó (món đã nấu thì không mang về được).

**Người trông coi (`KEEPER_POOL`, `src/data/people.ts`).** Ba ứng viên cố định có tên – giới – ngoại hình – lương
riêng (88.000–100.000₫/ngày). `hireKeeper` / `fireKeeper`; `keeper.wage` trả mỗi đầu ngày cùng tiền thuê. Không có
người trông coi thì chi nhánh **không bán** (`branchSelling(g)` = `false`) — món để đó vẫn hao tươi theo ngày.

**Chuyển món (`moveToBranch` / `moveFromBranch`).** Chỉ chuyển **món đã nấu sẵn** (`stall.ready`), theo từng phần,
không chuyển nguyên liệu. Trần `BRANCH_TRAY_CAP = 6` loại món và `BRANCH_READY_CAP = 24` phần ở chi nhánh; chuyển
ngược lại thì bị chặn bởi trần khay của quầy chính. Mỗi phần giữ nguyên `q` (độ tươi) và `cost` để tính lãi.

**Bán hàng (`branchTick`).** Gọi từ `advance()` (mỗi phút một bước, `steps = clamp(round(dm), 1, 720)` nên ngủ dài hay
tua nhanh vẫn không mất doanh thu) và **không** gọi trong `StallSys.update` (thời gian đã trôi qua `advance`).
Mỗi phút: `p = base × hourCurve(h) × site.pull × (open ? 1 : 0)`, bán 1 phần nếu `chance(p)`, giá = giá bán đang đặt
của món × hệ số tươi, cộng **tip 16%** khi `q ≥ 0,8`. Doanh thu vào `b.led.revenue`, tip vào `b.led.tips`; sổ của
người chơi (`g.led.revenue`) **không** cộng vì đây là tiền của điểm thứ hai — chỉ tổng kết cuối ngày mới nhập vào
`g.hist` qua tiền mặt. Món hết hoặc `q` cạn thì thôi bán.

**Đầu ngày (`branchNewDay`).** Chạy trong `newDay()` **trước** `g.hist.push(g.led)` để sổ ngày vừa khoá còn nguyên số:
ghi một dòng `b.hist` (tối đa 8 ngày: doanh thu, tip, số phần bán, số món), cộng dồn `b.tot`, trừ **tiền thuê + lương**
vào tiền mặt, bỏ món ế (`ready` về rỗng — món để qua đêm hỏng), rồi mở lại `b.led` từ 0 và `open = true`.

**Nhìn thấy trong thành phố.** `StallSys.rebuildBranch()` dựng ở toạ độ `BRANCH_SITES[i].spot` một quầy gỗ nhỏ 1,9 m
có yếm đỏ, mái hiên sọc xanh–trắng, bảng hiệu đỏ *CHI NHÁNH · ĐANG BÁN* (hoặc *· ĐÓNG*), khay món xếp dần theo lượng
sẵn, thùng đá và ghế nhựa; cả cụm **ẩn khi người chơi ở xa hơn 90 m**. `StallSys.updateKeeper()` cho **một NPC** mang
tên người trông coi đứng sau quầy ở `pose = 'serve'`, tự biến mất khi chi nhánh đóng / mất người / bị dẹp.

**Chạm để mở sổ.** `interact.ts` thêm `Kind 'branch'` với bán kính 3,9 m quanh `StallSys.branchAnchor()`; nhãn hiện
*Chi nhánh · đang bán / tạm đóng / chưa có người trông* kèm số phần sẵn. Chạm mở bảng `'branch'` (`src/ui/panels.ts`):
sổ hôm nay (doanh thu, đã bán, tip, mất khách, chi hôm nay, tổng dồn), nút **thuê / cho nghỉ** người trông coi, nút
**tạm đóng / mở lại**, danh sách món ở chi nhánh kèm nút *← về quầy*, danh sách món sẵn ở quầy chính kèm nút
*1 về quầy* chuyển sang, 8 ngày lịch sử và nút **trả mặt bằng**. Tab Nhân sự ở quầy chính cũng có khối Chi nhánh và
nút mở sổ; menu nói chuyện với Ba Tài có mục *Nói chuyện mở chi nhánh* / *Xem sổ chi nhánh*.

**Bản lưu v14.** `SAVE_VERSION = 14`; bản lưu trước v14 hoặc thiếu `branch` ⇒ `branch = null`. `cleanBranch()` kẹp lại
dữ liệu đọc lên: `rent` vô lý về 0, bỏ phần `ready` sai hình dạng hoặc quá trần, cắt `hist` còn 8 dòng, mọi số trong
`led`/`tot` bị NaN thì về 0.

**Menu ẩn.** Nhóm “Mới nhất — Bậc 7” của lượt 18 **đã bị xoá** ở lượt 63 cùng toàn bộ mục thử khác; từ đó menu ẩn chỉ
còn một nhóm **“Địa điểm — tele nhanh”** (lượt 67 phủ đủ 34 chỗ, xem §4.35 và §4.49). `tests/devpoints.test.ts` khoá
lại quy tắc “không có mục test nào trong menu”.

**Kiểm thử.** `tests/chuoi.test.ts` (25 bài): dữ liệu `TIERS[7]`/`GEAR.chuoi`/`BRANCH_SITES`/`KEEPER_POOL`, chặn mở
chi nhánh khi chưa bậc 7 hoặc thiếu tiền, mở/đóng và hoàn tiền, thuê/đuổi người trông coi, chuyển món hai chiều và
trần khay, `branchTick` bán đúng phần – đúng giá – có tip, `branchNewDay` ghi lịch sử + trừ tiền thuê/lương + bỏ món ế,
nâng cấp bản lưu v13 → v14 cùng `cleanBranch`, và một lượt chạy bất biến (tiền mặt không âm, tồn kho không âm).

### 4.28 Giao người làm đi chợ mua nguyên liệu (phụ quầy · bếp trưởng · người trông coi)

Trước đây muốn có nguyên liệu thì **chỉ người chơi** tự ra sạp lấy từng món. Từ bản lưu v15, ba loại người làm đi
chợ thay được: **phụ quầy** (`Game.help`), **bếp trưởng / bếp phó** (`Game.sous`, `Game.sous2`) và **người trông coi
chi nhánh** (`Game.branch.keeper`). Dữ liệu nằm ở `Game.errands: Errand[]` (`src/sim/state.ts`), luật ở
`src/sim/rules.ts` mục *Giao người làm đi chợ*.

**Bốn slot cố định.** `slot` 0 = phụ quầy, 1–2 = bếp trưởng thứ nhất/thứ hai, 3 = người trông coi chi nhánh.
`errandWho(g, slot)` trả về tên + chức danh, `canErrand(g, slot)` chặn khi chưa thuê người hoặc **người đó đang đi
chuyến khác** (mỗi người một chuyến, tối đa 4 chuyến cùng lúc).

**Báo giá trước, trả tiền trước.** Người chơi chọn *món cần nấu* (một món, hoặc "đủ nguyên liệu 6 món đang bán") chứ
không tự chọn từng món hàng: `errandPlanFor(g, r, portions)` / `errandPlanForAll(g, recipes)` tính **đúng phần còn
thiếu** so với kho quầy + túi, rồi `errandQuote(g, plan)` tìm cho mỗi nguyên liệu **cửa hàng đang mở bán món đó và rẻ
nhất** (`errandShopFor`, dùng lại `shopOpen` / `shopPrice` / `shopFresh` / `shopHas` nên vẫn ăn theo giờ mở cửa, xả
hàng cuối buổi, sự kiện tăng giá, hàng hết trong ngày). Nguyên liệu nào giờ này không đâu bán thì vào `missing` và
**không** tính tiền. Chuyến bị chặn ở `ERRAND_MAX = 2.000.000₫` để không mang cả gia tài ra chợ.

**Đi và về theo thời gian thật.** `errandLegs(đường chim bay tới cổng chợ)` → 12–68 phút khứ hồi; `errandTick(g, dm)`
được gọi trong `advance()` nên ngủ trưa, ngồi quán net hay tua nhanh đều đẩy chuyến đi đúng như thời gian thật. Hết
nửa đường (`back = true`) là đã mua xong; về tới nơi thì hàng được `addStack` vào **kho quầy** (giữ nguyên độ tươi và
giá vốn đã trả), có toast + `bus.emit('save')`. Người trông coi chi nhánh cũng chất hàng về kho quầy chứ không để ở
chi nhánh, vì chi nhánh chỉ nhận món đã nấu và không có tủ lạnh.

**Trong lúc đi thì không đứng quầy.** `StallSys.errandHide(slot)` làm `updateHelper` / `updateSous` / `updateKeeper`
coi như người đó vắng mặt, nên NPC biến khỏi quầy (và Má Bảy rời quầy chi nhánh) cho tới khi về. Người đi chợ vẫn
dùng `errandSpot(g, e)` để biết đang ở đâu trên đường (dùng cho hiệu ứng/toast, không spawn thêm NPC).

**Tiền và huỷ.** Trả trước toàn bộ khi giao (`spend(..., 'cogs')`), nên sổ thu chi thấy ngay khoản giá vốn. `cancelErrand`
giữa đường hoàn **85%** (đi đường rồi), `errandsNewDay` trong `newDay()` huỷ mọi chuyến còn dở và hoàn 85% — không để
chuyến treo qua đêm.

**Giao diện.** Bảng `'errand'` (`src/ui/panels.ts`) có 4 nút chọn người, dãy nút chọn món, danh sách hàng kèm sạp + độ
tươi + đơn giá, cảnh báo món không đâu bán, tổng tiền và nút giao. Vào từ 3 chỗ: tab **Nhân sự** của quầy (khối "Đi
chợ mua nguyên liệu"), hội thoại **phụ quầy** (`talkHelper`) và **phụ bếp** (`talkSous`) — cả hai qua
`StallSys.errandOpt(slot)`; nói chuyện với người đang đi chợ thì mở bảng kèm số phút còn lại. `UI.panel(name, arg)` nay
nhận tham số phụ và `UI.reopenPanel` vẽ lại bảng giữ nguyên lựa chọn (`modalArg`), nhờ vậy đổi người / đổi món không
đóng bảng.

**Sửa kèm: người trông coi chi nhánh đứng lọt trong quầy.** Toạ độ cũ đặt Má Bảy ở `lz = -0.95` với quầy sâu 0.8 m nên
thân người nằm trong khối gỗ. Nay đứng ở `lz = -1.25` (sau quầy) và **quay mặt ra phía khách** (cùng hướng với quầy,
trước đây quay vào trong). Probe `tools/probe/steps/dicho.mjs` đo lại `localZ = -1.25` và lệch hướng < 0.35 rad.

**Kiểm thử.** `tests/dicho.test.ts` (17 bài): ai đi được theo từng slot, một người một chuyến, báo giá chỉ tính phần
thiếu + đúng sạp đang mở, kho đã đủ thì không mua, giờ không đâu bán thì báo thiếu, gộp nhiều món không trùng nguyên
liệu, trả tiền trước + hàng về kho + hết chuyến, thiếu tiền không trừ đồng nào, huỷ hoàn 85%, `errandsNewDay`, `advance`
đẩy chuyến, toạ độ `errandSpot` chạy ra chợ rồi về, `cleanErrands` kẹp dữ liệu hỏng, và một lượt 5 ngày liên tục.

### 4.29 Báo cáo sắp hết nguyên liệu của người làm & quyền tự duyệt đặt bàn

**Báo cáo (`staffReport`).** Người làm tự canh kho thay người chơi. `staffReport(g, slot)` đọc **thực đơn đang bán**
(`menuOf`) và với mỗi món tính `finishPossible` — nấu thêm được bao nhiêu phần; món nào ≤ 1 phần thì vào danh sách
`dishes`, kèm các nguyên liệu còn thiếu (`INGS` + số còn lại / số cần cho 2 phần, tối đa 6 dòng). Tiền đi chợ lấy từ
chính `errandPlanForAll` + `errandQuote` của mục 4.28, nên con số trong báo cáo **đúng bằng** con số trên nút giao chợ.
`urgent` bật khi có ≥ 2 món sắp hết hoặc có nguyên liệu đã về 0. Báo cáo **chỉ đọc**: không trừ tiền, không đụng kho.
`staffReports(g)` gom phụ quầy + bếp trưởng + bếp phó + người trông coi chi nhánh (bỏ người đang đi chợ), xếp bếp
trưởng lên trước vì đó là người lo bếp. `lowStockCount(g)` đếm số món đang bán sắp hết — dùng cho chip trên HUD.

**Nhắc tự động.** `StallSys.staffReportTick` chạy mỗi 25 giây khi quầy đã dựng và thực đơn có món: nếu số món sắp hết
đổi (khoá `low|giờ/2`) thì người làm nói một câu tại chỗ (`ctx.npcs.say`) và hiện toast kèm câu gợi ý đi chợ. Quầy
**tạm đóng vẫn báo** — vì đó là lúc cần đi mua nhất.

**Bảng `'report'`.** "Báo cáo & gợi ý của người làm": mỗi người một thẻ gồm câu nói, danh sách món sắp hết (kèm số
phần còn nấu được), danh sách nguyên liệu (còn/cần), và nút **Giao … đi chợ — số tiền** mở thẳng bảng `'errand'` với
đúng người và đúng món; cuối bảng là danh sách cả thực đơn kèm nhãn `sắp hết / ít / ok`. Vào từ 3 chỗ: chip
**“Thiếu thịt heo nạc, trứng… · xem chi tiết”** trên HUD (dải sự kiện; rê chuột xem từng thứ còn bao nhiêu / cần bao nhiêu),
nút **Mở báo cáo** trong tab Nhân sự, và menu ẩn.

**Nói rõ thiếu gì (lượt 26).** Câu cũ “Sắp hết đồ N món” không cho biết thiếu gì, và con số *món* lại đến từ
`lowStockCount` (đếm món nấu tiếp được ≤ 1 phần) nên người chơi phải mở báo cáo mới hiểu. Nay `stockShortages(g)` trả
`{ id, name, unit, left, need, dishes, shop, cost }` cho **từng nguyên liệu** đang chặn món đã bật: còn bao nhiêu, cần
mua thêm bao nhiêu (đơn vị rời như chai/lon/quả/bó thì **làm tròn lên cả cái**, kg/lạng một chữ số thập phân), chợ nào bán
rẻ nhất và hết bao nhiêu tiền; `shortageLine(g)` là câu ngắn cho chip HUD. Thứ chặn nhiều món lên trước. Ca “đủ nguyên
liệu nhưng chưa sơ chế” thì `needsPrepCount(g)` báo **“N món cần sơ chế trước”** thay vì đổ lỗi thiếu đồ. Bảng **Quầy ›
Thực đơn** có ô đỏ *Thiếu nguyên liệu cho món đang bán* (tối đa 6 dòng + “xem tab Kho quầy”), và nút **Sơ chế** khi thiếu
đồ **không còn bị khoá im lặng** mà đổi thành “Thiếu đồ — xem thiếu gì” (class `.need`, vẫn bấm được), bấm là hiện toast
đúng nguyên liệu còn thiếu và bảng vẫn mở (`acts.prep` chặn trước khi đóng bảng).

**Quyền tự duyệt đặt bàn.** `setAutoBook(g, on)` ghi `g.flags.autoBook` (dùng `flags` nên **không cần đổi bản lưu**),
`autoBookOn(g)` chỉ trả `true` khi đã có bếp trưởng (`canAutoBook`). Khi bật, `createBooking` tạo phiếu ở trạng thái
`accepted` luôn thay vì `pending`; bật giữa lúc đang có phiếu chờ thì các phiếu đó được nhận luôn. Bàn tự duyệt vẫn
giữ chỗ như bàn nhận tay và **vẫn bị trừ 0,5 uy tín nếu lỡ hẹn** (`expireBookings`) — quyền tự duyệt không miễn trách
nhiệm. Nút bật/tắt có ở tab **Nhân sự** và trong bảng Báo cáo; toast tạo phiếu đổi câu thành "… đã tự nhận bàn".

**Kiểm thử.** `tests/baocao.test.ts` (12 bài): kho đầy thì báo "đủ đồ", thiếu thì chỉ đúng món + nguyên liệu + tiền,
chức danh theo slot và người chưa thuê thì không báo, người đang đi chợ không báo, thứ tự bếp trước phụ quầy, chưa
bật món thì không bịa nguyên liệu, `lowStockCount`, báo cáo không đổi tiền/kho, và phần tự duyệt: chưa có bếp thì
không bật được, bật → phiếu `accepted` / tắt → `pending`, phiếu tự duyệt vẫn bị trừ uy tín khi lỡ hẹn, cờ nằm trong
`flags` nên qua `migrate()` vẫn giữ.

### 4.30 Vựa ve chai thứ hai & bấm chuông thì chủ nhà mở cửa

**Vựa ve chai Bà Chín.** `JUNK_LIST` vẫn chỉ có 7 loại với trường `where`, nhưng `SCRAP_SITES = ['scrap','scrap2']`
(`src/data/gear.ts`) khai báo **hai** vựa thu mua ve chai: vựa Tư Rác ở lô `02S` (Xóm Lao Động, 16 m) và vựa **Bà Chín**
ở lô `21E` (Khu Dân Cư, 7 m) — ngay đầu đường, người chơi đi qua lại giữa khu căn hộ và khu dân cư là gặp. Hàm
`junkAt(site, junk)` gói luật "ai mua gì": mọi vựa trong `SCRAP_SITES` thu nhựa/lon/giấy/sắt (`where === 'scrap'`),
còn tiệm cầm đồ chỉ thu đồ giá trị. Nhờ vậy `sellJunk(g, site)` và hộp thoại `case 'scrap' | 'scrap2' | 'pawn'` dùng
chung một luật, không phải sửa `JUNK_LIST` (bản lưu cũ vẫn đọc được). `PLACE_HOURS.scrap2 = [6,19]` như vựa cũ; chủ
vựa là `FIXED.scrap2` — **Bà Chín Ve Chai** — với neo `v_scrap2` để bán và để tele nhanh. Lô 7 m dùng lại đúng mô
hình bãi ve chai của lô 16 m nhưng co toạ độ theo bề ngang lô (`S()` trong `places.ts`), nên bảng hiệu, cân bàn, đống
phế liệu không tràn sang nhà bên cạnh. `sellJunk` cộng tiền qua `earn(...,'side')` rồi tự cộng `g.tot.scrap` (mục riêng ở
bảng tổng kết) — bài kiểm thử canh đúng hai việc đó, không cộng trùng.

**Bấm chuông thì cửa mở.** Lỗi cũ: `openBellDoor` lọc `this.doors` theo `d.d.home`, nhưng `DoorDef` (`src/world/build.ts`)
**không có trường `home`** — nó đánh dấu căn bằng `lock` (`door_canho … lock: 'canho'`). Vì thế vòng lặp không khớp
được cánh cửa nào, `want` không được đặt, cửa đứng im dù chủ nhà vẫn bước ra nói chuyện. Nay `Interact.doorHome(d)`
trả `d.lock`; `openBellDoor` đặt `want = 1` + `bellUntil = time + 16` cho **đúng** cửa của căn, `update()` so cũng bằng
`doorHome` khi hết hạn (chỉ tự đóng nếu người chơi không ở trong căn đó). Cửa xoay mở 86° trong ~1 giây (đo bằng
probe: `rotY` đổi −77°, `box.on` → `false` nên đi qua được), hết 16 giây tự đóng lại. Chủ nhà vẫn ra ngoài hiên và
bấm chuông **ngoài giờ** vẫn mở cửa; gợi ý trên nút đổi theo giờ: "Ngoài giờ (6h–22h) nhưng bấm chuông thì chủ nhà
vẫn ra mở cửa". Cùng cơ chế này dùng cho nhà riêng và cửa hàng.

**Chủ nhà bước ra đúng ô cửa.** Trước đây `ringBell` lấy **neo chuông** làm tâm rồi đẩy nhân vật ra theo hướng người chơi,
nên với cửa lệch khỏi neo (căn hộ An Bình: cửa `(6,2 … 8,0)` còn neo `bell_canho` ở `x 5,05`) chủ nhà hiện ra **xuyên
tường**, chỗ tấm biển “CĂN 102”, chứ không qua cánh cửa. Nay `Interact.bellDoor(homeId)` trả cánh cửa của căn đang mở to
nhất; `ringBell` lấy **tâm ô cửa** (`bản lề + yaw * w/2`) và **pháp tuyến của cánh cửa**, tự chọn phía người chơi đang đứng
làm phía ngoài, rồi mới đặt điểm đi ra (+0,9 m) và điểm xuất phát (−1,45 m). Nhân vật vì thế **đi qua ô cửa**: probe đo
được lúc đầu ở phía trong (cách mặt cửa −1,3 m), sau 1,3 giây đã ở phía ngoài, lệch dọc theo ô cửa **0 m**. Đồng thời
chờ **1,62 giây** (trước 0,62) mới mở lời thoại để cửa kịp xoay mở, và lời nhắc tại chỗ dài 3,2 giây.

**Bỏ biển dọc chìa ra đường.** Mỗi tiệm ở dãy phố sinh ngẫu nhiên có 30% gắn thêm biển dọc “Tiệm Vàng Kim” chìa ra
lòng đường (`shop.blade`, `src/world/city.ts`). Nó vượt qua ban công nhà mình nhưng lại **che mất biển ngang của tiệm bên
cạnh** và che cả mặt tiền — người chơi phản ánh. Nay bỏ hẳn; hai lần gọi `R.chance` vẫn giữ để cách bốc ngẫu nhiên của
cả khu phố không đổi (không xáo tung toàn bộ thành phố đã quen mắt).

**Kiểm thử.** `tests/vua2.test.ts` (11 bài): hai vựa là hai lô `kind: 'scrap'` ở hai khu khác nhau, mỗi vựa có chủ
riêng và cùng giờ mở cửa, ve chai không bán nhầm ở tiệm cầm đồ, bán ở vựa nào cũng ra đúng giá và `tot.scrap` chỉ
cộng một lần, bán vựa này không mất đồ của vựa kia, cộng thêm 3 bài canh chuyện cửa: cửa căn hộ An Bình có `lock`
là `'canho'`, `openBellDoor` so theo `lock` (không còn `d.d.home`), chủ nhà ra mở cửa kể cả ngoài giờ, chủ nhà đi ra đúng ô cửa (so tâm cửa + pháp tuyến, chờ ≥ 1,2 giây mới nói), và
không còn biển dọc chìa ra đường.

### 4.31 Ba giao diện điện thoại — mỗi mẫu máy một kiểu

Điện thoại trước đây dùng chung một bảng tab cho cả ba máy. Nay mỗi mẫu **mở lên là thấy đúng cái máy đó**
(`src/ui/phoneUI.ts`), cả về hình thức lẫn cách bấm:

| Máy | Màn hình chính | Cách mở app | App có trên máy |
|---|---|---|---|
| **Cục gạch** (Nokia 1110i, 180.000₫) | nền xanh xám, chữ đơn cách mono, danh sách dòng có dấu `▸` | phím cứng **▲ OK ▼** hoặc bấm vào dòng | Sổ thu chi · Danh bạ · Tin nhắn · Pin |
| **Nắp gập** (Samsung E250, 520.000₫) | màn màu nhỏ, xoay vòng 4 icon trên + 4 dưới, ô giữa là app đang chọn | **▲ ▼** xoay vòng, **TÁCH** để mở, hai phím mềm Quay lại/Chọn | thêm Radio FM · Nghe nhạc |
| **Cảm ứng** (O2 Xphone, 1.450.000₫) | lưới icon 3 cột trên nền sáng, thanh trạng thái đen | **bấm thẳng icon**, nút **●** về màn hình chính | thêm Lướt web WAP |

**Dùng chung một chỗ.** Danh mục app nằm trong `src/data/phone.ts` (`PHONE_APPS`, `appsOf(m)`) nên `tests/phone3.test.ts`
kiểm được "máy nào có app nào" mà không cần DOM. Phần hiển thị giữ trạng thái `{ app, idx, sel }` trong `phoneView()`;
`phoneKey()` xử lý phím cứng, `phoneRow()` xử lý bấm dòng. Bàn phím máy tính cũng là phím cứng của máy: **↑ ↓** chọn,
**Enter** mở/làm, **Esc** lùi một màn rồi mới đóng. Bấm ✕ hoặc phím **● / Quay lại** ở màn hình chính mới đóng máy.
Cột bên phải mỗi máy hiện pin, giờ máy, tiền mặt, số tin chưa đọc và mô tả máy — thay cho tab "Máy" cũ.

**Bố cục.** Khung màn hình (`.ph`) bọc **mọi** màn hình chứ không chỉ màn hình chính (lỗi đã sửa trong lúc làm: mở app
thì mất nền màn hình, chữ hoà vào giấy). Ba máy ăn theo tỉ lệ chữ của game nên `min(15em, 68vw) … min(21em, 86vw)`
vẫn vừa màn dọc 390 px mà không phải cuộn ngang.

**Kiểm thử.** `tests/phone3.test.ts` (5 bài): ba mẫu máy khác tên/hãng, app đúng theo chức năng (cục gạch chỉ 4 mục,
nắp gập 6, cảm ứng 7), tên app đủ ngắn để vừa lưới 3 cột và danh sách máy phím, không app nào bị bỏ quên, và máy
chưa mua thì không có gì để mở. Probe `tools/probe/steps/phone3.mjs` ở 390×844: mở lần lượt ba máy — cục gạch
4 dòng + 3 phím, bấm ▼ rồi OK mở đúng **Danh bạ**; nắp gập 8 icon + ô giữa, TÁCH mở **Sổ thu chi**; cảm ứng 7 icon,
bấm icon mở **Tin nhắn** (2 tin) rồi mở **Sổ thu chi** — console sạch.

### 4.32 App "Quản lý cửa hàng" trên điện thoại

Mở máy (nút điện thoại trên HUD hoặc phím P) là có thêm một app **Cửa hàng** trên **cả ba mẫu máy** — kể cả cục gạch
rẻ nhất, vì điện thoại nào cũng phải xem được quầy của mình. App gom mọi thứ về hai điểm bán vào một chỗ, khỏi phải
chạy ra quầy:

- **Mỗi điểm bán một dòng**: quầy chính và (nếu có) chi nhánh — tên chỗ, trạng thái **đang bán / tạm đóng**, số phần
  đang bày, số món, số món sắp hết, tiền thuê chỗ mỗi ngày, doanh thu − số phần − số khách − số khách mất của hôm nay,
  và **một câu gợi ý** nói đúng việc nên làm ("Khay trống — chuyển món đã làm sẵn sang đây", "Chưa có người trông coi…").
- **Nút Mở / Đóng bán ngay trên máy** (`setShopOpen`): quầy chính chỉ mở được khi đã đặt ra phố và có món bật trong thực
  đơn; chi nhánh chỉ mở được khi đã có người trông coi. Không cần đứng gần quầy.
- **Cảnh báo bán lỗ** (`lossDishes`): so giá đang bán với `recipeCost(...).total` (nguyên liệu + bao bì + nhiên liệu) và
  liệt kê món nào bán dưới giá vốn, lỗ bao nhiêu một phần. Đây là việc "báo giá bán lỗ" còn treo trong `TODO.md`.
- Chưa có chi nhánh thì app nói rõ cần lên **Chuỗi cửa hàng (bậc 7)** rồi thuê mặt bằng thứ hai.

**Luật tách khỏi giao diện.** `shopRows(g)` trả `ShopRow[]` (thuần, không DOM) nên `tests/shopapp.test.ts` kiểm được
số phần, trạng thái, gợi ý và chuyện bật/tắt; `src/ui/phoneUI.ts` chỉ vẽ. Trạng thái app đang mở nằm ở `phoneView()`,
nên bấm sang tab khác rồi quay lại vẫn đứng đúng chỗ; mở lại máy từ HUD mới về màn hình chính (`ui.panel('phone')`
reset, `reopenPanel` thì không).

**Công tắc phải khớp trạng thái thật (lượt 24).** Ba chỗ từng làm nút "như bị lỗi": (1) `StallSys.update()` tự đóng quầy khi
người chơi ở xa > 40 m mà không có khách — luật có từ trước khi có app, nên bật bán từ xa chỉ sống vài giây; nay **ân hạn 20 giây**
mỗi lần quầy chuyển sang mở và **có người phụ việc (`g.help`, `g.help2`) thì quầy cứ bán** (chỉ nhắc mỗi 45 giây); (2) `setShopOpen`
trả `'ok' | lý do` (qua `shopToggleWhy`, kèm `SHOP_HOURS = [6, 22.5]`) để app báo thẳng vì sao không bật được thay vì im lặng;
(3) bảng đang mở tự vẽ lại khi `bus.emit('ui', 'stall' | 'branch')`, nên nút và nhãn *đang bán / tạm đóng* không bao giờ lệch với
`s.stall.open` thật. App còn hiện `shopStaffWarn(g)` khi quầy đang mở mà chỉ có mình người chơi bán.

**Kiểm thử.** `tests/shopapp.test.ts` (8 bài): máy nào cũng có app, không chi nhánh thì một dòng kèm số phần/số món/số
món sắp hết, bật/tắt bán quầy chính và chi nhánh (chưa có người trông coi thì không mở được), quầy chưa đặt ra phố hoặc
chưa bật món thì không mở được, câu gợi ý đúng ba tình huống (khay trống / chưa bật món / đang đóng), cảnh báo bán lỗ
chỉ ra đúng món, và chi nhánh hiện đúng số phần sau khi chuyển món sang. Probe `tools/probe/steps/shopapp.mjs` ở
390×844: máy cảm ứng có icon **Cửa hàng** thứ 8, mở ra thấy 2 dòng (quầy chính tạm đóng + chi nhánh đang bán), bấm
**Đóng** thì `stall.open` thành `false`, bật chi nhánh từ máy thì `branch.open` thành `true`, đặt cơm sườn 2.000₫ thì
app hiện mục **Bán lỗ so với giá vốn** ("đang bán 2.000₫ · vốn 25.426₫ — lỗ 23.426₫/phần"), và máy cục gạch cũng có
dòng "Cửa hàng" trong danh sách; **console sạch**.

### 4.35 Menu ẩn: bấm nhiều lần + mã PIN (lượt 52; mã & nội dung đổi ở lượt 64, 67 — xem §4.47, §4.49)

Bấm **8 lần** (`DEV_TAPS`) chữ “Cài đặt” mới hiện **bàn phím số 0–9** với sáu chấm tròn báo số đã nhập; gõ đúng
**`438291`** (`DEV_PIN`) mới vào menu ẩn. Bảy lần đầu không có gì xảy ra — đủ khó để không bấm nhầm khi đang chỉnh
đồ hoạ.

- `devKey(entered, digit)` là hàm thuần dùng chung cho UI và test: chỉ phán đúng/sai khi đã gõ **đủ 6 số**, sai thì
  xoá sạch và **không nói sai ở số nào**; có `del` (bỏ một số) và `clear` (xoá hết).
- Sai **5 lần** liên tiếp ⇒ bàn phím **khoá 30 giây** (`DEV_PIN_TRIES`, `DEV_PIN_LOCK_MS`) — hết dò mã bằng cách bấm lần lượt.
- Mở đúng một lần là **nhớ trong phiên chơi** (`DEV_UNLOCKED` trong `ui/panels.ts`): đóng Cài đặt rồi mở lại vẫn vào
  thẳng danh sách; nút **“Ẩn & khoá lại (8 lần + mã PIN)”** xoá cờ đó. Nhãn nút đọc chính `DEV_TAPS` nên không
  lệch số lần như trước (đã từng ghi 7 trong khi mã đòi 8).
- Mã **không phải bảo mật** (nằm trong gói JS) — mục đích chỉ là để người chơi không vô tình mở bảng của người làm game.

**Nội dung menu (lượt 63 → 67).** Lượt 63 xoá **hết** mục thử: menu chỉ còn một nhóm **“Địa điểm — tele nhanh”**.
Lượt 67 phủ nhóm đó cho đủ **34 chỗ**: mọi nhân vật cố định ngoài phố (Chú Ba xe ôm, Ông Bảy, Cô Thắm, chú vá xe,
cô hát rong, Ông Tư, bé đánh giày, Bin, nhóm đua xe đạp, quán net, quán cà phê…), các sạp/tiệm mua bán (tiệm đồ nghề,
MiniMart, vựa sỉ Tám Lúa, tạp hoá Cô Ba, quán cơm Bà Tư, nhà thuốc, ngân hàng, cầm đồ, hớt tóc, quần áo), chỗ ở
(trọ, khách sạn, nhà nghỉ, căn hộ), bệnh viện, công an, bốn chỗ đặt quầy/mặt bằng, và bồn rửa tay trong nhà hàng.
Chi tiết cơ chế + số đo ở **§4.49**.

### 4.36 Thanh thể lực hồi theo máu và pin (lượt 53)

Trước đây thanh thể lực (thanh vàng dưới đáy màn hình, hiện khi đang chạy) hồi **một tốc độ cố định cho mọi người**:
đứng yên +0,09/giây, vừa đi +0,05/giây, chạy −0,1/giây. Nghĩa là người đang mất máu 20 vẫn chạy khoẻ y như người
đầy đủ — chỉ số máu và pin chẳng liên quan gì tới việc chạy. Nay ba con số đó được nhân với hệ số sức khoẻ.

| Luật | Công thức (trong `src/sim/rules.ts`) | Người khoẻ | Máu 20 | Máu 20 + cạn pin |
|---|---|---|---|---|
| Hệ số hồi theo máu | `staminaHpMul = clamp(0,5 + 0,5·(máu−20)/50, 0,3, 1)` | 1,0 | **0,5** | 0,5 |
| Hệ số hồi theo pin | `staminaEnergyMul = clamp(0,45 + 0,55·pin/60, 0,45, 1)` | 1,0 | 1,0 | 0,45 |
| Hệ số gộp | `staminaRegenMul = clamp(hpMul · (0,6 + 0,4·pinMul), 0,28, 1)` | 1,0 | 0,5 | **0,39** |
| Hồi khi đứng yên | `0,09 · regenMul` mỗi giây | 0,09 (11 giây đầy thanh) | 0,045 (22 giây) | 0,035 (28 giây) |
| Tụt khi chạy | `0,1 · clamp(1 + 0,6·(1−hpMul) + 0,4·(1−pinMul), 1, 1,6)` | 0,1 (chạy 10 giây) | 0,13 (7,7 giây) | **0,16 (6,2 giây)** |

Bốn quyết định có chủ ý:

1. **Máu là thứ chính, pin chỉ phụ** (`0,6 + 0,4·pinMul`): người chọn “máu + năng lượng” nhưng không muốn cạn pin một
   mình đã làm thanh gần như đứng im. Cạn pin riêng lẻ chỉ chậm thêm nhiều nhất 22 %.
2. **Sàn 0,28** (hệ số gộp) và **trần 1,6** (tụt): cùng lúc tệ nhất thì hồi vẫn còn ~1/3 tốc độ, chạy được ~6 giây —
   người chơi bị phạt rõ nhưng không kẹt vĩnh viễn ở 0.
3. **Trần thanh thể lực (`staminaMax`) không đổi** — vẫn chỉ do đói/khát quyết định, để luật mới không giẫm lên luật cũ.
4. **Tốc độ chạy (m/s) không đổi**: `moveMul` vốn đã phạt máu thấp khi đi bộ; lượt này chỉ đụng tới thanh thể lực.

Thanh thể lực có `data-tip` đọc thẳng từ luật: hồi bao nhiêu phần trăm tốc độ, vì “đang mất máu” hay “thiếu ngủ”, chạy
liền được mấy giây, cạn rồi đứng chờ bao lâu mới đầy — người chơi không phải đoán. `tests/stamina53.test.ts` (6 bài) canh
đúng các mốc trong bảng trên; probe `tools/probe/steps/stam53.mjs` đo bằng **đồng hồ mô phỏng** (`__game.time`) sau khi
giữ Shift thật: máu 90 → **0,09/giây**, máu 20 → **0,045/giây**, máu 20 + pin 10 → **0,037/giây**, tụt khi chạy
**0,1 → 0,13/giây**, console sạch.

### 4.37 Bánh sẵn & nước tăng lực Shapi (lượt 54)

**Tiệm bánh Anh Bảo** (sạp giữa chợ, `shops.ts` id `bakery`) đổi tên từ “Lò bánh mì Anh Bảo” và bán thêm 5 loại bánh
ăn liền. Mặt hàng mới là nguyên liệu trong `data/ingredients.ts` với cột `eat` — **không có công thức nào dùng chúng**
(người chơi chọn “chỉ bán sẵn”), và `tests/banh54.test.ts` canh đúng điều đó để sau này không ai lỡ nhét bánh vào món.

| Bánh | Giá | No | Vui | Hạn dùng |
|---|---|---|---|---|
| Bánh mì (nền, có từ trước) | 3.500₫ | 26 | 1 | 52,8 giờ |
| Bánh mì que pa-tê | 5.000₫ | 8 | 3 | 36 giờ |
| Bánh tiêu | 7.000₫ | 11 | 4 | 31 giờ |
| Bánh bao nhân thịt | 12.000₫ | 19 | 6 | 36 giờ |
| Bánh su kem | 15.000₫ | 24 | 8 | 28,8 giờ (phải giữ lạnh) |
| Bánh bông lan | 25.000₫ | 40 | 13 | 48 giờ |

Luật “bánh no và vui vẻ tuỳ giá”: **cứ 1.000₫ ≈ 1,6 no và 0,5 vui**, làm tròn — bánh đắt thật sự no hơn và vui hơn chứ
không phải cùng một ổ bánh gắn giá khác. Bánh mì ổ đứng ngoài thang này vì nó là **nguyên liệu nền** (mua về làm bánh
mì trứng, bánh mì thịt…) chứ không phải món ăn vặt; menu test của người làm game tách riêng hai nhóm cho khỏi đọc nhầm.
Bánh mua ở quầy vào túi là bấm **Ăn** được ngay, không qua mini-game nấu.

**Hình 3D riêng cho từng loại** (`gfx/props.ts`, `case` mới trong `ingModel`): lượt 54 vẽ lại ba loại vì trước đó chúng
mượn hình chung — bánh mì que dùng `long` (ống tròn), bánh tiêu và bánh su kem đều dùng `round` (cục tròn), nên trên
quầy nhìn không phân biệt được. Nay mỗi loại một mã hình (`baguette` / `sesame` / `choux`), `tests/banh54.test.ts` canh
để không ai gán lại `round`/`long`:

| Mã hình | Vẽ gì | Dùng cho |
|---|---|---|
| `baguette` | ổ **dài và nhỏ hơn bánh mì** (0,26 m so với 0,22 m nhưng mảnh hơn nhiều), thon hai đầu, đường nứt dọc lưng, giấy nâu quấn quanh **một đầu** theo chiều nằm ngang | bánh mì que pa-tê |
| `sesame` | đĩa tròn **dẹt và phồng**, đáy chiên vàng đậm, mè trắng rắc 9 hạt lốm đốm, mặt trên phồng cao | bánh tiêu |
| `choux` | vỏ choux tròn nâu vàng, đế nhỏ, 4 vết nứt rời trên lưng, **kem trắng ngà phía trên** (không phủ sô-cô-la) | bánh su kem |

Ảnh soi cận cảnh: `tools/probe/out/banhdraw_mique.png`, `banhdraw_tieu.png`, `banhdraw_su.png`,
`banhdraw_lineup.png` (đặt cạnh nhau) và `banh54_counter.png` (trên quầy thật).

**Nước tăng lực Shapi** (`shapi`, 9.000₫/lon) là lon **rẻ nhất** trong nhóm đồ uống có ga, bán ở MiniMart 24h (kệ đá
cuối tiệm, ô số 2) và Tạp hoá Cô Ba. Vì thanh thể lực nằm trên **người chơi** (`player.stamina`) chứ không nằm trong
`g.st`, `src/sim` không tự cộng được: `data/ingredients.ts` khai `eat.st = 0,3`, `sim/rules.ts` có hai hàm thuần
`staminaGain` / `staminaAfter(now, cap, amount)` (kẹp theo trần hiện tại), còn `game/acts.ts` đọc `st` khi ăn/uống, cộng
vào thanh, gỡ cờ `tired` và báo bằng toast “thanh thể lực +30 %”. Uống lúc thanh gần đầy thì chỉ đầy tới trần — không
tích luỹ, nên không có chuyện uống 5 lon rồi chạy vô hạn.

Hai chỗ bày hàng phải nới ô để **mỗi mặt hàng chỉ nằm đúng một chỗ**: sạp chợ chia hàng theo nhóm 8 ô (trước cố định 5
ô/hàng, tiệm bánh 6 món thì món thứ 6 không hiện), MiniMart 8 + 8 + 8 ô (trước 6 + 6 + 6, thiếu ô nên món 19–22 không
bày được), tạp hoá 7 + 6 ô trên quầy. Kệ giữa MiniMart trước đây đăng ký trùng ô 12–13 với kệ sau — nay chỉ để trưng
bày, không đăng ký ô.

**Kiểm:** `tests/banh54.test.ts` (8 bài: 6 món + tên tiệm, không công thức nào dùng bánh, bánh ăn liền, no/vui tăng đơn
điệu theo giá đúng tỉ lệ, Shapi bán đúng hai chỗ, hồi 30 % và không vượt trần, uống giúp chạy thêm ~2 giây) · probe
`tools/probe/steps/banh54.mjs` bấm thật: chạm ô bánh bông lan (24.000₫) + bánh mì que (4.500₫) → tính tiền 28.500₫ →
ăn bánh bông lan no 20→58, bánh mì que no 20→28; chạm lon Shapi ở MiniMart → tính tiền; uống khi thanh 0,1 → **0,40**;
uống khi thanh 0,85 → **1,0** (không vượt trần); tạp hoá ô 13 lấy được lon Shapi · console sạch.

### 4.38 Sạp Dì Sáu, khách không xuyên quầy, hết kẹt khi ngủ, buồng tắm (lượt 55)

**Tên sạp.** `shops.ts` id `m_trung` đổi thành **“Trứng – Sữa – Giò Dì Sáu”** và bán thêm hai món có thật trong bảng
nguyên liệu là `suatuoi` (Sữa tươi, hộp giấy, 32.000₫, phải giữ lạnh) và `suadac` (Sữa đặc, lon, 24.000₫) — quầy không
treo chữ “Sữa” rồi bán thiếu sữa. Lời chào của Dì Sáu nhắc cả sữa, chức danh người đứng quầy (`data/people.ts`) đổi
thành “Người bán trứng, sữa, giò chả”.

**Khách đi xuyên quầy (bậc 1–4).** `game/stall.ts` trước đây chỉ chặn NPC ở nhà hàng (bậc 5–6 vốn có tường trong
`rebuild`), còn gánh / xe đẩy / sạp / quán ăn nhỏ thì NPC không đụng vật cản nào, nên khách đi từ sau lưng người bán
rồi xuyên thẳng qua thân quầy. Nay mọi bậc đều có **hộp thân quầy** trong toạ độ cục bộ:

| Bậc | Mô hình | Nửa bề ngang `hw` | Khoảng z của thân quầy |
|---|---|---|---|
| 1 | Gánh hàng rong | 0,95 | −0,5 … 0,62 |
| 2 | Xe đẩy | 0,95 | −0,5 … 0,62 |
| 3 | Sạp cố định | 1,4 | −0,6 … 0,62 |
| 4 | Quán ăn nhỏ | 2,3 | −0,6 … 0,62 |
| 5–6 | Quán có chỗ ngồi / nhà hàng | — (đã có tường riêng) | — |

`resolveNpcWalls` đẩy NPC ra khỏi hộp đó theo mép gần nhất (ưu tiên phía trước quầy), còn khách đang trong trạng thái
`toStall` / `actor` mà ở phía sau thì được **chèn waypoint vòng qua đầu quầy** (ngang `±(hw + 0,85)`, rồi ra
`z = 0,62 + 1,05 = 1,67`). `safeApproach` cũng chạy cho mọi bậc thay vì chỉ bậc 5–6, nên khách từ xa tới cũng đi
vòng trước chứ không cắt chéo. Không đụng tới `World.resolve` của người chơi — chỉ đường đi của NPC đổi.

**Kẹt khi ngủ.** Mỏ neo giường nằm **đúng giữa nệm**, mà cả khung giường là vật cản, nên `sleep()` đặt người chơi vào
trong giường: `World.resolve` bắn ra mép gần nhất, có lần xuyên luôn vách sang gian bên kia rồi kẹt (báo trên điện
thoại). Nay `acts.bedSpot(a)` quét 5 khoảng cách × 7 hướng quanh mỏ neo, lấy chỗ đầu tiên mà `blocked(x, z, 0,36)`
sai, và `sleep()` đặt người chơi ở đó; `wake()` kiểm lại một lần nữa — chân còn trong vật cản (bản lưu cũ, giường kê
sát vách) thì bước ra trước khi trả quyền đi lại. Toạ độ giường **không đổi** (người chơi cho phép dời, nhưng không cần).

**Buồng tắm.** `world/places.ts` có hàm `shower(b, x, z, nx, nz, h)` dựng một góc tắm thật thay cho chiếc khay phẳng
cũ, dùng cho cả nhà nghỉ (`7,0; 4,6` quay về `−z`) và nhà trọ (`3,7; 5,3`): tường ốp gạch men có đường ron ngang,
khay men có gờ + nắp thoát nước, hộp khoá nước + tay gạt nóng/lạnh màu đỏ, ống đứng inox, tay vươn, đầu vòi hoa sen
16 cạnh (bán kính đáy 0,125 m, đỉnh 0,105 m) có **6 lỗ phun**, kệ ba chai dầu gội, khăn treo, gương soi + đèn, và một
tấm chắn kính có va chạm. Mỏ neo `wash_nhanghi` / `wash_tro` giữ nguyên nên lời mời “Tắm vòi sen” vẫn nằm đúng chỗ.

**Đồ đạc thêm.** Nhà nghỉ: tủ đầu giường + đèn ngủ + sách, quạt treo tường, ti vi nhỏ, rèm hai tấm trên thanh treo,
thảm chân giường, móc áo trên vách đầu giường, ghế nhựa, bàn tròn. Nhà trọ: kệ đầu giường + đèn + khăn gấp, quạt cây,
dây phơi với ba cái áo, ấm nước + ly trên bàn thấp, lịch treo tường và công tắc cạnh cửa, chiếu trải giữa phòng. Mọi
món có va chạm đều khai `b.collide`, nên không mở ra lối đi xuyên đồ.

**Kiểm:** `tests/nghi55.test.ts` (12 bài) · probe `tools/probe/steps/fix55a3.mjs` (ngủ rồi tỉnh ở cả hai chỗ: mọi lần
`blocked: false`, bước ra 4 hướng không nhảy chỗ) · `fix55b5.mjs` (chợ + công viên: ba khách dừng ở `z ≈ 1,5` phía
trước quầy, `cross: []`) · `fix55c.mjs` (4 ảnh `f55c_nhanghi_wash`, `f55c_tro_wash`, `f55c_nhanghi_room`,
`f55c_tro_room`) · `fix55e.mjs` (bấm từng mục test mới: `focus` ra đúng “Nói chuyện với người bán trứng, sữa, giò
chả”, “Tắm vòi sen” ×2, “Ngủ — Nhà nghỉ Bình Dân”, “Ngủ — Phòng trọ”) · console sạch.

### 4.39 Nước da của nhân vật cố định (lượt 56)

Người chơi: *“sửa mặt bà bán ve chai đen một tí”*. Mặt Bà Chín Ve Chai (`FIXED.scrap2`, vựa ve chai ở Khu Dân Cư)
trước đây **không có màu da riêng**: `lookFromFixed()` chọn da bằng công thức
`SKINS[(face * 3 + hat) % SKINS.length]`, và với `face 4, hat 1` thì rơi đúng ô `#f6d6b6` — **màu sáng nhất** trong
bảng 5 màu. Một bà cụ cân ve chai ngoài nắng cả ngày mà da sáng hơn cả nhân viên ngân hàng, nên ảnh soi cận trông
sai hẳn.

`FixedNpcDef` có thêm trường tuỳ chọn `skin`, `lookFromFixed()` đọc `f.skin ?? SKINS[...]` — ai không khai thì giữ
nguyên hành vi cũ, nên **không nhân vật nào khác đổi màu da** (`tests/mat56.test.ts` canh: chỉ `scrap2` có `skin`).
Bà Chín dùng `#b8804f`: tối hơn màu cũ **~82 điểm độ sáng** (136 so với 218,5 theo công thức Rec.709), vẫn là tông da
ấm (đỏ > lục > lam, `r − b = 104`) chứ không thành da xám. Khuôn mặt (`face 4` — bà cụ, tóc bạc, có nếp nhăn), nón lá,
kiểu tóc và dáng người **giữ nguyên**: chỉ đổi nước da, không đổi người.

**Kiểm:** `tests/mat56.test.ts` (4 bài: có da riêng + tối hơn hẳn bảng màu · vẫn là tông da ấm · không ai khác bị đổi ·
`lookFromFixed` ưu tiên `f.skin`) · probe `tools/probe/steps/scrap56.mjs` (2 ảnh soi cận `f56_ba_chin_mat`,
`f56_ba_chin_cheo`, in ra `skin: #b8804f`) · menu test 3 mục `t56_*` · console sạch.

### 4.40 Rào “Cấm đường” chặn cả xe cộ (lượt 57)

Người chơi: *“hàng rào xe đang chạy qua được ở 2 đầu cấm đường, không cho xe qua khu vực đó”*. Lỗi có thật và rất
rõ: rào chỉ chặn **người đi bộ**. `stall.onEvent('cam_duong')` thêm hai cạnh vào `NAV_BLOCK` (đồ thị đi bộ) và bật
`city.roadblock.visible`, còn `game/traffic.ts` thì **không biết sự kiện nào tồn tại** — xe chỉ đọc `roadSpan()` /
`pickSpawn()` trong `game/roads.ts`.

Toạ độ khớp đúng chỗ người chơi thấy: rào dựng ở `world/city.ts` gồm 6 tấm (`x = −32 / −29,5 / −27`, rộng 2,2 m ⇒
phủ `x −33,1 … −25,9`) ở **z = ±25**, tức hai đầu đoạn của tuyến dọc `x = −29,5`. Hai làn xe của tuyến này là
`x = −31,2` và `−27,8` — cả hai nằm gọn trong bề rộng rào, nên mọi xe chạy dọc tuyến đều xuyên qua cả hai hàng rào.

**Sửa — một nguồn sự thật duy nhất trong `game/roads.ts`:**

| Thành phần | Việc |
|---|---|
| `ROADBLOCK` | `{ axis: 1, road: −29,5, v0: −25, v1: 25, pad: 6,5 }` — đúng toạ độ rào vẽ ở `city.ts` (test canh để hai bên không lệch) |
| `setRoadblock(on)` / `roadblockActive()` | bật/tắt; `stall.onEvent` gọi **cùng lúc** với `NAV_BLOCK`, và lúc khôi phục ván gọi `setRoadblock(false)` |
| `barrierStop(axis, road, pos, sign)` | vạch mà xe **đang chạy tới** phải dừng; `null` nếu không vướng (xe ở phía bên kia rào, hoặc đã lỡ nằm trong đoạn cấm thì đi thẳng ra) |
| `spawnInBlock(axis, road, pos)` | điểm sinh có rơi vào đoạn cấm (kể cả hai làn + bề dày rào) hay không |

`traffic.update()` so **vị trí sắp tới** (`pos + sign·speed·dt`) với vạch rào: vượt thì đặt xe ở `stop − sign·0,1`,
đảo `sign`, đảo `lane` (sang làn ngược) và hãm `brakeT = 1,2 s`. So với vị trí sắp tới chứ không phải vị trí hiện tại
vì một khung hình dài 0,1 s ở 9 m/s là 0,9 m — so sai sẽ lọt rào ở đúng những khung hình đó. `pickSpawn()` xếp tuyến
đang rào xuống cuối danh sách và **không nhận** điểm sinh nằm trong `pad` của rào.

**Đo được** (`tools/probe/steps/camduong57.mjs`, mức đồ hoạ Cao = 5 xe):

| Trạng thái | Mẫu đo gần tuyến bị rào | Số mẫu xe nằm trong đoạn cấm |
|---|---|---|
| Bật cấm đường (sau khi sửa) | ~1.000/đợt, 4 đợt | **0** |
| Tắt luật rào cho xe (đối chứng, như trước lượt 57) | 1.482 | **570** — xe `x = −27,8` chạy xuyên qua `z = −25 … −22` |

Ảnh `tools/probe/out/f57_rao_cam_duong.png`: ba tấm rào đỏ–trắng chắn ngang đường trước chợ; `tests/camduong57.test.ts`
(8 bài) canh toạ độ rào ↔ luật, chiều quay đầu, mô phỏng 4.000 bước không lọt rào, và không sinh xe trong đoạn cấm.

### 4.41 Mini game bánh tráng trộn — 5 topping nằm ngẫu nhiên mỗi ván (lượt 58)

Người chơi: *“làm mini game của bánh tráng trộn 5 tp random vị trí”*. Trước lượt này bánh tráng trộn
(`RECIPES.banh_trang_tron`) dùng chung `AssembleGame` với 59 món còn lại: 5 chén nguyên liệu xếp vòng cung ở
**vị trí cố định** (chỉ đổi thứ tự giữa các chén theo `hashStr(id)`) và người chơi bày lớp theo phiếu in sẵn —
học thuộc một lần là bấm được mãi, còn “vị trí” thì không bao giờ đổi.

Bước hoàn thiện của món này đổi sang **bước `tron`** (`TronStep` trong `data/recipes.ts`), các món khác giữ nguyên
`assemble`. Luật chơi:

| Thành phần | Việc |
|---|---|
| `cook/tron.ts` | phần **thuần** (không Three.js, không DOM) nên test được: `tronSpots`, `tronCalls`, `tronTapAt`, `tronScore`, `tronLimit`, `TRON_*` |
| `TronGame` (`cook/games.ts`) | 5 đĩa giấy trên bàn (hình nguyên liệu thật: xấp bánh tráng, chai tương ớt, gói đậu phộng, bó rau thơm, quả chanh), hộp giấy có thành ở phía trước, vòng vàng nhấp nháy đánh dấu đĩa **đang được gọi** |
| Luật chơi | mỗi ván **2 vòng × 5 lượt**; mỗi lượt có đồng hồ riêng (`tronLimit(k) = max(1,1; 3,1 − 0,16k)`); chạm nhầm / chạm ra ngoài / để hết giờ đều tính một lần `miss` |
| Điểm | `tronScore = clamp((1 − 1,5·miss/tổng) · phạt-chậm · 0,97, 0,05 … 1)` — chạm đúng hết và nhanh thì ≈ 0,97, chậm quá hoặc sai nhiều thì tụt |

**Vị trí rải (`tronSpots`)** — đây là phần người chơi yêu cầu phải ngẫu nhiên:

- 5 chỗ nằm trên vòng elip `x ∈ ±0,36 m`, `z = −0,06 ± 0,20 m` (bàn nấu rộng ~0,84 × 0,70 m, hộp bánh ở `z = 0,32`),
  mỗi chỗ rơi vào **một khoang riêng** của vòng tròn (chia đều 5 khoang, lệch ngẫu nhiên ≤ ±0,18 khoang).
- Vòng lặp đẩy xa 40 lượt bảo đảm **hai chỗ bất kỳ cách nhau > `TRON_GAP` = 0,15 m > 2 · bán kính ăn tay
  `TRON_HIT` = 0,105 m**; nếu không, ngón tay chạm chỗ này lại ra chỗ kia.
- Mỗi ván **lấy hạt giống mới** (`new RNG(Math.random() * 2³¹)`), nên nấu lại là 5 đĩa đổi chỗ: đo trên 40 hạt giống
  ⇒ **40 cách xếp khác nhau**, và cùng hạt giống thì tái lập được (để probe chụp lại đúng một ván).
- Thứ tự gọi (`tronCalls`) cũng trộn đều mỗi vòng, và **không gọi trùng tên hai lần liền** (kể cả ở chỗ nối hai vòng —
  nghe như máy bị kẹt).

**Đĩa phải nằm lại suốt ván (hotfix sau lượt 58).** Người chơi chạm đúng một lần rồi báo *“topping trên khay biến
mất”*. Nguyên nhân: bản đầu cho **cả cái đĩa** bay vào hộp rồi `d.g.visible = false`; nhưng một ván gọi **2 vòng**
(`tronCalls` gọi mỗi topping 2 lần) ⇒ sang vòng 2 máy gọi đúng những topping vừa biến mất, trên khay chỉ còn cái nhãn
trơ giữa bàn. Nay chỉ **một mẩu nhỏ** của topping tách khỏi đĩa và bay vào hộp (`bits`, bay vòng cung rồi xoá khỏi sân
khấu), đĩa + phần topping còn lại **luôn hiện** (`d.g.visible = true`), đĩa vơi dần (nhỏ lại 18 %) và **đầy lại khi hết
vòng** (`full = 1`); nhãn chỉ vẽ cho đĩa còn topping nên nhãn cũng tự trở lại. Đĩa bánh tráng vẽ thành **nắm sợi** có
bóng đổ thay vì xấp bánh mỏng cùng màu đĩa — xấp cũ trông như đĩa trống, đúng chỗ dễ tưởng topping “biến mất”.

**Thẻ góc màn hình**: `UI.cookCard(items, title)` nhận tiêu đề; màn trộn hiện *“Máy đang gọi (vòng 1/2)”* thay vì
*“Thứ tự cho vào”* (bày theo phiếu không còn đúng nghĩa), hết ván đổi thành *“Đã trộn đủ 5 thứ”*.

**Ăn khớp phần còn lại:** `tron` là bước **không dùng lửa** (`fuelPerPortion` = 0 và cả 3 chỗ lọc `!== 'assemble'`
trong `cook.ts` thêm `!== 'tron'`), không cần dụng cụ (`STEP_TOOLS.tron = []`, món vẫn chỉ cần dao thớt), và biểu tượng
món trong thực đơn (`dishIcon`) đọc màu topping từ bước `tron` như đọc bước `assemble`.

**Lượt 70 (bổ sung) — làm lại phần hình, theo lời người chơi *“khối vuông thả xuống quá xấu”*.** Bản lượt 58 gọi
`ingModel` **nguyên con** cho mỗi topping, nên gói đậu phộng thành **cả cái hộp nâu to** dựng đứng giữa đĩa, rau thơm
thành chùm que xoè như ngôi sao, còn tương ớt và chanh thì bị đè thêm một cục tròn vô nghĩa. Mẩu gắp được thì luôn là
một khối hộp to rơi vào hộp. Nay mỗi thứ có hình ăn được bày **sát mặt đĩa** (`TronGame.topping()`), và mẩu bay mang
đúng hình của thứ đang gắp:

| Topping | Trên đĩa | Mẩu bay vào hộp |
|---|---|---|
| bánh tráng | nắm **sợi** nằm ngang chồng chéo, có bóng đổ mờ | một sợi mảnh |
| đậu phộng | hạt có **vỏ lụa** + đường nứt, rắc lấm tấm | một hạt |
| rau thơm | ba **ngọn** (cuống + 4 lá có gân) | một chiếc lá |
| chanh | lát **mỏng 2,5 mm**, vỏ chỉ còn vành mỏng, 6 múi | một lát mỏng |
| tương ớt | chén sốt đỏ + vệt rưới quanh miệng chén | một vệt sốt |

Hộp thành phẩm cũng đổi theo: trước là cầu bẹp + vòng xuyến (nhìn như đống hạt xốp), nay sợi bánh tráng nằm gọn trong
lòng hộp (dài ≤ 0,13 m, nghiêng ≤ 0,55 rad để không thò ra ngoài thành), chanh là hai lát trên mặt, tương ớt là vệt đỏ.
Hộp lùi về `z = 0,31` và vòng rải lùi về `TRON_CZ = −0,10` để **không bị cắt ở mép dưới màn hình 844 × 390**.

**Khoai lang & xúc xích** (cùng lượt): cả hai trước đây dùng chung hình `'long'` — một khúc trụ tròn y hệt củ cà rốt/cây
sả. Nay có hình riêng: `'sweetpotato'` = **một khối liền** (trụ thuôn + bụng phình + hai đầu vát, đầu lộ ruột vàng cam,
vệt sẫm dọc vỏ và mấy mắt củ) và `'sausage'` = cây đỏ hồng có **nếp gấp ngang** trên vỏ, **hai đầu bấm kẹp** dẹt + núm
dây buộc, vệt bóng dầu trên lưng. Trên vỉ nướng món dài được xếp **rộng hơn** (`gap 0,15` thay 0,115) và **xoay mỗi cái
một góc riêng** — trước đây ba củ nằm sát nhau thành một thanh ngang liền khối.

**Kiểm:** `tests/tron58.test.ts` (10 bài) · `tests/top70.test.ts` (6 bài) · probe `tools/probe/steps/tron58.mjs` (2 ảnh
`tron58_ban.png`, `tron58_thanh_pham.png`) · menu test 3 mục `t58_*` · console sạch.

## 5. Điều khiển cảm ứng

- Chạm trong vùng bên trái (42% bề ngang, trừ dải 28% trên cùng) rồi kéo = cần đi; nơi khác = vuốt nhìn.
- **Máy cảm ứng thật (`pointer: coarse`, lượt 25):** mọi vùng chạm ≥ 30 px (`.ib` 2,9 em, `.btn.small` ≥ 32 px, tab 30 px, phím cứng ≥ 32 px), tiêu đề bảng cho xuống hàng thay vì bóp thành cột chữ, và màn hình điện thoại tự cuộn trong khung máy (`max-height` + `min-height: 0`) nên app dài không đẩy khung máy ra ngoài bảng; nằm ngang thì máy thu nhỏ để cả khung lọt. Bảng dùng `94dvh`. Probe `tools/probe/steps/android.mjs` đo 15 màn ở 4 khổ (320×640 · 360×640 · 412×915 · 640×360) và phải ra `coVanDe: []`.
- **Chạm nhanh** (nhấc tay trong 0,6 giây, xê dịch dưới 14 px) ở bất kỳ đâu = chạm vào vật gần điểm chạm nhất trong bán kính `max(64 px, 11% chiều cao)`. Thời lượng đo bằng mốc thời gian của chính sự kiện nên máy giật vẫn nhận đúng.
- Nút tròn vàng thực hiện hành động với vật đang ở giữa màn hình.
- Trong mini-game, mọi thao tác trỏ được chuyển thẳng cho mini-game.
- **Người chơi tự xếp nút** (`ui/layout.ts`): sáu nhóm — nút tương tác, nút chạy, nút đấm, nút nhảy, hàng nút túi/sổ/bản đồ/cài đặt, các nút khi nấu ăn. Bàn phím: `E`/`Enter` tương tác, `F` đấm, `Space` nhảy, `R` hành động phụ, `M`/`B`/`Tab`/`P` (điện thoại), `Esc`. Mỗi nhóm lưu độ lệch so với chỗ mặc định tính theo phần bề ngang/bề cao màn hình và một hệ số phóng 0,6–1,8, riêng cho màn ngang và màn dọc. Áp bằng `transform`, và mỗi lần áp đều ép nút nằm trọn trong màn hình. Cỡ chung của giao diện là biến CSS `--ui-scale` (0,8–1,4) nhân vào cỡ chữ gốc; mọi kích thước HUD đều tính bằng `em` nên phóng theo.

## 6. Lưu game

`localStorage`, khoá `ganhhang.save.v1` (trạng thái) và `ganhhang.settings.v1` (cài đặt). Tự lưu sau việc quan trọng, mỗi 45 giây và khi rời trang. `SAVE_VERSION = 16`; `migrate()` nạp được bản lưu cũ thiếu trường và loại bỏ nguyên liệu không còn tồn tại. Bản lưu trước v4 chưa có sổ `met` nên được coi như đã quen hết người đứng quầy. Bản lưu trước v5 (chưa có bệnh viện) được nâng sức khoẻ lên 45 nếu đang ở 0 — nếu không, mở lên là ngất liền — và thêm sổ đồ thất lạc rỗng. Bản lưu trước v6 được cấp `wanted = 0` và `jailUntil = 0` (chưa ai biết mặt). Bản lưu trước v7 chưa có điện thoại (`phone = null`). Bản lưu trước v8 chưa có sổ phút ngồi quán net (`netDay = -1`, `netMin = 0`). Bản lưu trước v9 chưa có sổ ngày đua xe đạp (`raceDay = -1`, `raceWin = 0`). Bản lưu trước v10 chưa có người phụ việc (`help = null`); dữ liệu `help` hỏng cũng bị bỏ, và bản lưu cũ đã từng bán được hàng thì được ghi mốc `firstSale = 0`. Bản lưu trước v11 chưa có ngoại hình người chơi (`Game.look`): `migrate()` cấp `defaultLook()` theo giới tính của ván, còn `look` hỏng thì `cleanLook()` kẹp lại từng trường. Bản lưu trước v12 chưa có nhà hàng bình dân (`sous = null`, `bookings = []`, `bookSeq = 1`); bản lưu trước v13 chưa có slot nhân sự thứ hai (`help2 = null`, `sous2 = null`). Bản lưu trước v14 chưa có chi nhánh (`branch = null`) — mở bậc 7 rồi mới mở được chi nhánh, và `cleanBranch()` kẹp lại dữ liệu chi nhánh đọc lên. Bản lưu trước v15 chưa có chuyến đi chợ (`errands = []`); `cleanErrands()` bỏ chuyến sai hình dạng và kẹp số phần/thời gian. Bản lưu trước v16 chưa có ca làm của người phụ quầy (`helpShift`): người thứ nhất nhận ca cả ngày, người thứ hai ca sáng — y như hành vi trước đó; giá trị ca lạ bị bỏ và thay bằng mặc định. `Game.look` có thêm `beard` (0–3, nữ luôn 0) và dáng người là hai trường `fat`/`h` đã có sẵn. Cài đặt có thêm `ui` (cỡ giao diện và cách xếp nút) và `cam3` (góc nhìn thứ ba); `cleanLayout()` làm sạch dữ liệu đọc lên.

### 4.42 Trần việc làm thêm mỗi ngày + bảng việc làm đọc số thật (lượt 59)

Người chơi: *“giới hạn số lần có thể làm ca bốc cá và ca chạy bàn cafe xuống, tăng số bao có thể bốc vác lên và bổ sung
chuẩn bảng việc làm”*. Trước lượt này hai nghề trả cao nhất trong nhóm việc làm thêm **không có trần**: `dockShift()`
(110 phút, 52.000–68.000₫) và `cafeShift()` (60 phút, sàn 38.000₫ + boa) cứ bấm là ra tiền, trong khi vác bao bị chặn
cứng ở 12 bao (72.000₫/ngày) và rửa chén chỉ 2 lượt. Ai biết chỗ thì đứng bấm ca cả buổi, còn vác bao thành việc vô nghĩa.

| Việc | Trước | Sau (lượt 59) | Ghi chú |
|---|---|---|---|
| Vác bao (bến chợ) | 12 bao/ngày · 6.000₫/bao | **20 bao/ngày** · 6.000₫/bao (tối đa 120.000₫) | `DOCK_SACKS_DAY`, `DOCK_SACK_PAY` |
| Ca bốc cá | không giới hạn · 52.000–68.000₫/ca | **2 ca/ngày** (4h30–10h) | `DOCK_SHIFTS_DAY` |
| Ca chạy bàn / phụ quán | không giới hạn · ≥ 38.000₫ + boa | **3 ca/ngày**, chung cho cả hai quán (6h–22h / 6h30–22h) | `CAFE_SHIFTS_DAY` |
| Rửa chén | 2 lượt/ngày (8 đĩa) | giữ nguyên | `wd.plates` |
| Giao hàng | 4 đơn/ngày | giữ nguyên | `wd.deliveries` |

**Cân bằng:** trước đây một buổi bốc cá (2 ca sàn = 104.000₫) đã hơn cả ngày vác 12 bao (72.000₫), nên không ai vác bao.
Nay 20 bao = 120.000₫ ≥ 104.000₫ (mức sàn của 2 ca), nhưng vác bao tốn sức rải ra nhiều chuyến và chỉ mở 4h30–10h —
hai nghề cùng buổi sáng thì người chơi phải chọn. Test `tests/jobs59.test.ts` canh đúng bất đẳng thức này.

**Bộ đếm:** hai trường mới `wd.cargoShifts`, `wd.cafeShifts` (đếm trong ngày, reset cùng `wd.sacks`… ở `rules.ts`).
Không tăng `SAVE_VERSION`: `load` merge `{ ...base.wd, ...raw.wd }` nên bản lưu cũ thiếu trường vẫn chạy, và mọi hàm đếm
đều dùng `?? 0`. Ba hàm thuần trong `sim/rules.ts` — `sacksLeft`, `dockShiftsLeft`, `cafeShiftsLeft` — trả số còn lại
(không bao giờ âm, kể cả khi dữ liệu cũ có số lớn hơn trần).

**Áp ở mọi cửa vào.** `cafeShift` được gọi từ **ba** chỗ (menu Sáu Lực, quán Bóng Đá `funMenu('tv_bongda')`, quán Sân Vườn
`gardenCafeOpts`) và `dockShift` từ một chỗ; `dockTake`/`dockDrop` từ nhãn tương tác ở xe tải và sạp gạo. Trần đặt trong
chính các hàm nhận ca, còn hộp thoại chỉ **hiện** số (“còn 2/3 ca hôm nay”) và tắt nút khi hết — nếu chỉ chặn ở hộp thoại
thì vẫn còn đường spam. Ca bị chặn đều có câu giải thích riêng (hết ca hôm nay, mai quay lại).

**Vác lố bao:** người chơi có thể nhận bao khi còn hạn mức rồi mới đặt xuống. `dockDrop` nay kiểm `sacksLeft` trước khi
cộng tiền; hết trần thì **trả bao lại**, không trả công (probe đo đúng: `wd.sacks` đứng ở 20, không lên 21).

**Bảng việc làm (`Acts.jobListText`).** Bản cũ chỉ bốn câu chữ cứng, số bao/ca chép tay nên lệch luật. Nay 7 dòng — vác bao,
ca bốc cá, chạy bàn, rửa chén, giao hàng, ve chai, việc khác — mỗi dòng ghi **số thật của hôm nay** (còn mấy bao/ca/lượt/đơn,
giờ mở cửa) và ghi rõ khi đã hết hạn mức thay vì lặng lẽ bỏ dòng. Nhãn tương tác `Đã vác x/12 bao` cũng đổi theo hằng số.
`tests/jobs59.test.ts` quét mã nguồn để chặn số chép tay tái phát (`wd.sacks >= 12`, `6.000₫`).

**Menu ẩn:** 6 mục `t59_*` thay cho mục của lượt 58 — mở bảng việc làm, về bến cảng 5h sáng, làm hết 2 ca bốc cá, làm hết 3 ca
chạy bàn, vác tới bao cuối rồi thử vác lố, đọc sổ việc làm. `DEV_BUILD_TAG` đổi theo lượt 59.

### 4.43 Tia chạm nhiều độ cao — sửa lỗi “không cho được nguyên liệu vào nồi” (lượt 60)

Người chơi báo: mở nồi nấu trà đá, chạm mãi chén **Trà khô** mà nồi vẫn trống, không qua được bước *“Cho nguyên liệu”*.

**Nguyên nhân (đo được, không phải đoán).** `Cook.local()` đổi điểm chạm màn hình thành toạ độ bàn bếp bằng cách cắt tia ở **một**
mặt phẳng `mini.planeH`. `BoilGame` đặt `planeH = surf` = **mặt nước** (top + 0,155 = 0,355 m) — đúng cho việc vớt bọt — nhưng chén
nguyên liệu nằm trên **mặt bàn** (~0,03 m). Camera nhìn chếch xuống nên cắt tia ở độ cao sai làm điểm rơi bị kéo về phía người nấu:
chiếu chén (−0,38; −0,07) ra màn hình rồi hỏi `local()` thì nó trả về (−0,281; 0,113) — **lệch 0,208 m**, gấp đôi bán kính ăn
0,11 m của chén ⇒ không chén nào ăn được. Lỗi nằm ở tầng chung nên **ảnh hưởng mọi món có bước nấu/ninh/luộc/pha**, không riêng trà đá.

**Cách sửa.** Thêm vào `Mini` hai thành phần tuỳ chọn:

| Thành phần | Việc |
|---|---|
| `planes?: number[]` | các độ cao khác mà tay chạm tới trong cùng ván (mét, trên bàn bếp) |
| `pickPoint?(list)` | lớp game tự chọn điểm trong các ứng viên `{ h, p }` cắt ở từng độ cao |

`Cook.local()` cắt tia ở `planeH` + `planes`, rồi trả `pickPoint(list) ?? list[0].p` — lớp nào không khai thì **hành vi y như cũ**.
`BoilGame` khai `planes = [0.03]` (mặt bàn) và `pickPoint`: giai đoạn *cho nguyên liệu* lấy ứng viên **thấp nhất** (mặt bàn);
giai đoạn nấu chỉ nhận điểm nằm gần bọt đang nổi, còn lại trả về mặt nước như trước.

**Rà cả 7 bàn thao tác** (probe `steps/nau59b.mjs`, đo độ lệch giữa chỗ chạm và chỗ game hiểu):

| Bàn | Độ lệch đo được | Ngưỡng ăn | Kết luận |
|---|---|---|---|
| Thái/băm (CutGame) | 0,019 m | vạch rộng ~0,045 m | đạt — nhát cắt ăn |
| Chiên/xào (FryGame) | thao tác theo cử chỉ (sx/sy), không dùng toạ độ | — | đạt — vuốt lên là đảo |
| Nướng (GrillGame) | 0,007 m | 0,07 m | đạt — chạm là lật |
| Nấu/ninh (BoilGame) | **0,208 m → 0,004 m** | 0,11 m | **đã sửa** |
| Trình bày (AssembleGame) | 0,008 m | 0,095 m | đạt |
| Trộn topping (TronGame) | chạm theo đĩa (toạ độ tuyệt đối) | 0,105 m | đạt |
| Rửa chén (WashGame) | 0,001 m | 0,055 m | đạt |

**Canh tái phát:** `tests/nau59.test.ts` (6 bài) khẳng định `Cook.local` cắt ở nhiều độ cao, `BoilGame` khai mặt bàn, nhánh `add`
lấy ứng viên thấp nhất, mặt phẳng chính vẫn là mặt nước, các lớp cắt/trình bày/rửa/trộn có mặt phẳng sát đồ vật (≤ 6 cm), và mọi
công thức có `boil` đều đi qua lớp đã sửa.

### 4.44 Menu ẩn dựng sẵn bếp trà — vì sao “Chạy” trên ván mới không mở được nồi (lượt 61)

Người chơi bấm mục test cũ (“Mở thẳng bước *Cho nguyên liệu* của nồi”) trên **ván mới** và vẫn thấy nồi trống.
Đo bằng probe `tools/probe/steps/dev60.mjs` (mở menu ẩn thật: **8 lần** chữ Cài đặt › `438291` › bấm nút *Chạy* — mã và số lần bấm hiện nay; lúc đo năm đó là 7 lần › `7777`):

| Thứ tự kiểm tra trong `Cook.prep()` | Ván mới có gì | Kết quả |
|---|---|---|
| `stall.where === 'placed'` | `'none'` — chưa đặt quầy | ✗ dừng ngay |
| `placeAt()` đòi `s.tier ≥ sp.minTier` | `tier = 0` (chưa có gánh) | ✗ *“Chỗ này cần gánh hàng rong trở lên.”* |
| `missingTools()` | không có bếp/nồi | ✗ *“Thiếu dụng cụ”* |
| `useFuel()` | không có than | ✗ *“Hết than!”* |
| tiền | 18.000₫ (chưa đủ mua gánh 120.000₫) | ✗ |

Tức lỗi **không phải ở cảm ứng** (đo chạm vẫn ăn, xem §4.43) mà ở chỗ mục test chỉ cho nguyên liệu, **không dựng
quầy/bếp/nồi/than**. Nay có hàm dùng chung `chuanBiNoi(rid)` trong `game/devPoints.ts`:

1. nâng tiền lên 400.000₫ nếu ít hơn, 2. mua `ganh` → `bepthan` → `noi` → `daothot` (**gánh trước** để `placeAt` không từ chối),
3. đặt quầy ở Cổng Công Viên, 4. cho ≥ 6 than, 5. bật `rec[rid].known/on`, 6. cho đủ nguyên liệu của **2 lượt nấu + dư 1**, 7. `cook.prep(r)`.

Ba mục dùng nó: `t61_tra` (hỏi chọn Trà đá / Trà chanh), `t61_noi_da`, `t61_noi_chanh` (vào thẳng).

**Đo lại:** cả hai món — `cook.r.id` đúng món, `mini` là `BoilGame`, `phase 'add'`; chạm chén ⇒ `fly −1 → 1`, `phase 'add' → 'cook'`,
nút *Quạt lửa* / *Lọc ra* hiện ra. Ảnh `tools/probe/out/fix/dev61_da.png`, `dev61_chanh.png`, `dev60_cham_da.png`.

**Bài học:** mục test nào mở thẳng một *bước* của bàn thao tác thì phải dựng đủ **tiền → cấp quầy → chỗ → dụng cụ → nhiên liệu → nguyên liệu**,
theo đúng thứ tự mà `prep()` kiểm tra; thiếu một khâu là người chơi chỉ thấy một câu cảnh báo và tưởng lỗi cảm ứng vẫn còn.

### 4.45 Đá tan chậm 3 lần và hiển thị “độ lạnh” (lượt 62)

Người chơi: *“×3 độ lâu tan của đá và để là độ lạnh thay vì hỏng”* — hai việc tách nhau.

**(1) Thời gian.** `Đá viên` là đồ uống hạn dùng 9 h (nạp thành 10,8 h) và được đánh dấu `cold` ⇒ bị nhân thêm 2,6 lần khi
không có gì giữ lạnh: **3,4 giờ là tan sạch**, quá ngắn so với một bịch đá 5.000₫. Nay `ICE_MELT_MUL = 3` trong
`sim/state.ts`, áp riêng cho `id === 'da'` bên trong `spoil()` và trong `hoursLeft()` (lời nhắc phải khớp tốc độ thật):

| Nơi để | Trước | Sau |
|---|---|---|
| Ngoài trời / ba lô | tan sạch sau **3,4 giờ** | còn dùng được **~11 giờ** |
| Thùng đá ở quầy (hệ số 0,22) | tan sạch sau **~1,8 ngày** | **~5,5 ngày** |

Đo bằng probe `tools/probe/steps/da62.mjs` (menu ẩn → “Tua 8 tiếng”): 79 % → 25 %, còn 10 viên.

**(2) Câu chữ.** Đá **tan**, không **ôi**; ghi “hỏng” làm người chơi tưởng mua phải hàng ôi. Thêm `freshLabel(st)` trong
`sim/state.ts` trả `{ text, level }` dùng chung cho mọi chỗ hiển thị:

| Độ tươi | Nhãn | Mức |
|---|---|---|
| ≥ 50 % | `lạnh 82%` | good / warn |
| 10–49 % | `đá tan 40%` | bad |
| < 10 % | `tan hết` | bad |

Áp dụng ở: bảng Túi đồ + Kho quầy (`ui/panels.ts`), giá chợ, tin số 10 trên điện thoại (`sim/news.ts`), và câu báo qua đêm
(`sim/rules.ts` — tách “đá trong thùng tan hết” khỏi danh sách “đồ hỏng phải bỏ”). `shopRows()` loại `da` khỏi
`spoilKinds/spoilNames` để app Quản lý cửa hàng không báo “đồ sắp hỏng” cho đá.

**Bài học:** “hỏng” và “tan” là hai chuyện khác nhau — chỉ dùng chung `fresh` 0–100 làm số liệu, còn câu chữ phải theo
bản chất từng nguyên liệu; và mọi câu “còn mấy giờ” phải tính bằng đúng công thức của `spoil()`, nếu không lời nhắc sẽ sai.

### 4.46 Menu ẩn chỉ còn dịch chuyển nhanh (lượt 63)

Người chơi: *“trừ dịch chuyển, xoá các kiểm thử còn lại”*. `getDevSections()` nay trả **một** section
`Địa điểm — tele nhanh` với 12 mục `tp_…`; toàn bộ mục `t5x/t6x` của các lượt trước và hàm `chuanBiNoi()` (chỉ phục vụ mục test
bếp trà) đã xoá, kèm các import không còn dùng. `DEV_BUILD_TAG` giữ để biết đang chạy bản nào.

Canh tái phát trong `tests/devpoints.test.ts`: đúng 1 nhóm, tên có “Địa điểm”, **mọi** mã mục bắt đầu `tp_`, danh sách còn đủ
`tp_equip / tp_matbang_tb / tp_ongtu / tp_scrap2 / tp_canho / tp_hobo / tp_mart`, mã không trùng, mỗi mục có `run` + `label` + `sub`.
Probe `tools/probe/steps/dev63.mjs`: menu hiện `["Địa điểm — tele nhanh"]`, 12 mục, `mụcTest: []`, bấm `tp_cv` thì người chơi
đứng ở `(41, −32,7)` — tele vẫn chạy.

### 4.47 Bàn phím mã PIN của menu ẩn — sửa lỗi “chỉ nhập được số 7” (lượt 64)

Người chơi: *“menu ẩn pass đang có vấn đề (chỉ nhập đc số 7, chưa có nút xoá, quá dễ đoán)”*.

**Nguyên nhân (tái hiện bằng probe `steps/devpin.mjs`):** `devPinInput()` cũ so **tiền tố** ngay khi gõ:

```ts
if (!DEV_PIN.startsWith(next)) return { next: '', result: 'wrong' };   // ← gõ 4 khi mã là 7777 ⇒ xoá sạch tức thì
```

Mã cũ `7777` nên chỉ có chữ số `7` “sống sót” qua lần gõ đầu ⇒ cảm giác bàn phím chỉ nhận số 7. Bàn phím cũng
**không có nút xoá** (gõ nhầm là phải quay ra vào lại) và mã lặp 4 lần quá dễ đoán.

**Sửa:**
| Việc | Trước | Sau |
|---|---|---|
| So mã | so tiền tố từng số | chỉ so khi đã gõ **đủ 6 số** (`devKey`) |
| Bàn phím | 10 số, không xoá | 10 số + **Xoá** (bỏ 1 số) + **C** (xoá hết) |
| Mã | `7777` | `438291` — 6 số, không lặp |
| Số lần bấm để hiện | 7 | **8** |
| Chống dò | không có | sai **5 lần** ⇒ khoá bàn phím **30 giây** (`DEV_PIN_TRIES`, `DEV_PIN_LOCK_MS`) |
| Lộ thông tin | báo sai ngay ở số đầu | đủ 6 số mới báo “sai mã”, **không nói sai ở số nào** |

Nhãn nút dùng **chữ** (“Xoá”, “C”) chứ không dùng ký tự hình bàn phím xoá — phông của game không có ký tự đó nên
trên máy yếu sẽ ra ô trống (đã thấy trong ảnh probe). Nút “Xem mã”: bản chạy `?debug` hiện mã để tự động hoá, bản phát
cho người chơi chỉ nhắc mã nằm trong tài liệu.

**Đo** (probe `tools/probe/steps/devpin64.mjs`, bấm **chuột thật** vào toạ độ nút): bàn phím `["1"…"9","del","0","clear"]`;
gõ `4,3,8` rồi **Xoá** rồi `8,2,9,1` ⇒ menu mở (`đãMở: true`); gõ sai 30 lần ⇒ *“Sai quá 5 lần — chờ 30 giây rồi gõ lại.”*
Test `tests/devpoints.test.ts`: gõ được **mọi** chữ số, `del`/`clear`, đủ 6 số sai thì xoá sạch và không lộ vị trí sai,
và bài canh **nguồn** (không còn `startsWith` trong `devKey`) để lỗi này không quay lại.

### 4.48 Xe ôm Chú Ba — ổng chở, hoặc gọi là ổng tới rước (lượt 66)

Người chơi: *“làm xe ôm Chú Ba — gọi là ổng đến rước đi hoặc kêu khi gặp ổng”*. Trước lượt này `chu_ba` **chỉ** là một
khách quen ăn trưa trong `REGULARS` (`src/game/stall.ts` thỉnh thoảng cho ghé), không có xe, không có chỗ đứng; tin bịa
“đứng đầu hẻm” đã bị xoá từ lượt 52 vì nói về một người **không tồn tại ngoài phố**.

**Nguyên tắc:** hai đường dùng, cùng một người, cùng một bảng giá —
(a) **gặp ổng** dưới gầm cầu rồi nhờ chở; (b) **gọi điện** (số trong danh bạ) rồi 3 phút sau ổng chạy tới chỗ mình đứng.

| Việc | Chỗ sửa | Ghi chú |
|---|---|---|
| Người thật | `data/people.ts` `FIXED.chu_ba` + `FIXED_ROLE.chu_ba` | da ngăm `0xb8804f`, nón bảo hiểm `hat: 3`; `npc.ts` tự dựng vì có neo `v_chu_ba` |
| Chỗ đứng + xe | `world/side.ts` khối 7 | `b.bike()` + bạt che + biển **XE ÔM CHÚ BA** + ghế nhựa; neo ở (65,5; 98,4) — **giữa hai trụ cầu** (trụ ở x = 55 / 77), tránh bị cột che khi nhìn từ lều |
| Giờ đứng | `data/hours.ts` `chu_ba: [5, 22.5]` | `npc.updFixed` ẩn ổng ngoài giờ; `sim/xeom.onDuty` dùng cùng mốc |
| Luật giá | `sim/xeom.ts` (mới) | 3.000 / 5.000 / 8.000₫ theo quãng (<45 m / <95 m / xa hơn), +2.000 mưa, +2.000 chở gánh/xe đẩy, −1.000 (thân ≥ 25) / −2.000 (thân ≥ 60), sàn 2.000₫ |
| Thời gian | `sim/xeom.rideMinutes` | 13 m/phút so với đi bộ 4,4 m/phút ⇒ nhanh ~3 lần; mỗi chuyến ít nhất 1 phút |
| Gọi điện | `sim/phone.ts` `Contact.hot = 'xeom'` | Chú Ba vào danh bạ **một dòng** khi `g.met.chu_ba` hoặc đã bán cho ổng; xếp sau 2 tổng đài. 2 cuộc/ngày, cước `CALL_FEE`, còn `rel.owe` thì từ chối |
| Hộp thoại | `game/acts.ts` `xeomMenu/xeomRide/xeomSmallTalk/phoneXeom/xeomTick/xeomReturn` | danh sách đích = `acts.places()` (cùng nguồn với Bản đồ), cách > 22 m; mỗi nút ghi giá + mét + phút xe/phút đi bộ |
| Tới rước | `xeomTick` (gọi từ `Acts.update`) | đúng hẹn ⇒ dời `n.home` của ổng tới cạnh người chơi rồi mở bảng chỗ đi; người chơi đi khỏi > 7 m ⇒ `xeomReturn` trả ổng về gầm cầu |
| Bản tin | `sim/news.ts` mục 9c | chỉ hiện khi `onDuty(g)`, nói đúng giá đang áp (mưa có phụ phí) — cùng nguyên tắc “tin phải thật” của lượt 30 |
| Dịch chuyển thử | `game/devPoints.ts` `tp_chu_ba` | menu ẩn vẫn chỉ có nhóm `tp_…` (luật lượt 63) |

**Đo:** `tsc` sạch · **679/679 test (57 tệp)** · probe `steps/xeom.mjs` (ảnh `out/xeom/01…04`): ổng ở `(65,5; 98,4)` `state='fixed'`,
nói chuyện ⇒ 12 nút, giá 3.000/5.000/8.000₫; chọn “Vựa đầu mối Tám Lúa — 5.000₫ (52 m, xe 4 phút, đi bộ 12 phút)” ⇒ tiền 18.000 → 13.000,
giờ 546 → 550, người chơi ở `(37,2; 55,1)`; gọi điện ⇒ hẹn +3 phút; +4 phút ⇒ ổng tới cách 2,3 m, mở bảng chỗ đi. `errors: none`.

## 7. Kiểm thử

- `tests/xeom.test.ts` — lượt 66: Chú Ba là người thật (neo + xe + biển ở đúng gầm cầu, giờ 5–22h30), giá theo quãng/mưa/chở nặng, ơn thân quen + sàn 2.000₫, xe nhanh hơn đi bộ ~3 lần, gọi điện (cước, 2 lần/ngày, hết pin/ngoài giờ/nợ tiền cơm thì từ chối, hẹn 3 phút, hẹn quá 4 tiếng tự bỏ), danh bạ một dòng, tin radio chỉ hiện đúng giờ + đúng giá.
- `tests/nau59.test.ts` — lượt 60: tia chạm của bàn nấu ăn cắt ở nhiều độ cao (sửa lỗi không cho được nguyên liệu vào nồi).
- `tests/jobs59.test.ts` — lượt 59: trần việc làm thêm mỗi ngày (bốc cá 2 ca, chạy bàn 3 ca, vác 20 bao), đếm số còn lại không âm, reset qua ngày, và quét mã nguồn canh số chép tay + bảng việc làm đủ 7 dòng.
- `tests/top70.test.ts` — lượt 70: khoai lang & xúc xích có hình riêng (và cách xếp trên vỉ nướng), topping bánh tráng trộn là đồ ăn thật, mẩu bay đúng hình.
- `tests/tron58.test.ts` — lượt 58: bánh tráng trộn có mini game riêng — 5 topping rải ngẫu nhiên mỗi ván, thứ tự do máy gọi, chấm điểm theo số lần chạm nhầm/chậm.
- `tests/camduong57.test.ts` — lượt 57: rào cấm đường chặn cả xe cộ (quay đầu ở vạch, không sinh xe trong đoạn cấm).
- `tests/mat56.test.ts` — lượt 56: Bà Chín Ve Chai có nước da rám nắng riêng, không ai khác bị đổi da theo.
- `tests/nghi55.test.ts` — lượt 55: tên sạp Dì Sáu + hai món sữa, hộp thân quầy đủ mọi bậc, khách vòng đầu quầy, `bedSpot`/`wake` chống kẹt giường, chi tiết buồng tắm.
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
- `tests/look.test.ts` — ngoại hình: 8 kiểu tóc liền id và giá tăng theo độ cầu kỳ, mọi bảng màu có giá dương và không trùng màu, giá trong tầm một buổi bán, `defaultLook` khác nhau nam/nữ, `cleanLook` chặn dữ liệu rác (kiểu tóc ngoài phạm vi, màu lẫn alpha, dáng người vô lý), bản lưu v10 lên v11, và hai người bán mới có đủ tên – nghề – lời thoại.
- `tests/quanngoi.test.ts` — 18 bài về bậc 5 quán có chỗ ngồi: chỉ số `TIERS[5]` lớn hơn bậc 4, `FUTURE_TIERS` còn 2 bậc, mua chuỗi sạp → quán ăn nhỏ → quán có chỗ ngồi, dựng ở hai mặt bằng có sân, 6 ghế ăn tại chỗ (`seatCount` = 6, `dineIn` = true), bốn buổi trong ngày (`mealSlot`, `periodName`, `fitsPeriod`, `periodMenu`), khách ưu tiên món hợp buổi hơn ở bậc 5 mà vẫn giữ đa dạng thực đơn, gọi thêm nước/tráng miệng (`secondOrder`: chỉ khi ngồi ghế bậc 5, hài lòng ≥ 3,8★, đúng nhóm `drink`/`sweet`, không gọi lần 3, không áp cho nhân vật sự kiện), và nâng cấp bản lưu giữ nguyên bậc 5.
- `tests/nhahang.test.ts` — 17 bài về bậc 6 nhà hàng bình dân: `TIERS[6]` rộng hơn bậc 5 về sức chứa/giữ lạnh/thực đơn/hàng chờ/độ hiện, `GEAR.nhahang` là đồ nghề bậc 6 đắt hơn quán có chỗ ngồi, 8 ghế (4 bàn) và cờ `isRestaurant`/`dineIn`, trong nhà kín không mất khách vì mưa và sáng hơn ban đêm, `sousGate` chỉ mở từ bậc 6, `hireSous` trừ ngày lương đầu và `fireSous` cho nghỉ sạch, `sousWork` tự sơ chế/ra món phụ và không rò nguyên liệu khi hết nhiên liệu, sang ngày trừ lương phụ bếp (thiếu tiền thì nghỉ), `createBooking`/`acceptBooking`/`reservedSeats`/`rejectBooking` và trần `BOOKING_MAX`, `decideGroup` cho đoàn 3–4 người (kể cả khi món còn ít hơn cỡ đoàn), và bản lưu v11 lên v13.
- `tests/fun.test.ts` — bảng chỗ chơi (mã không trùng, có neo, có giờ hợp lệ, chơi lâu hơn thì lên tinh thần nhiều hơn) và thang mở công thức (cấp 1 mở đúng 1 món, cấp sau mở 2; luôn là món rẻ nhất còn thiếu; không vượt tay nghề; món sau không rẻ hơn món trước; cấp 10 mở đủ 60 món).

Ba bài mới ở lượt 2: mỗi nhân vật phụ phải có tên, nhãn việc, câu mở đầu và ít nhất hai câu chuyện đủ dài; bảng `RUDE` chỉ được có tối đa 8 nhóm và phải có đủ lời cho cả năm kiểu (giấy, khạc nhổ, mắng, đuổi, khạc nhổ khi bị xin tiền); khách quen không được trùng id hay tên và phải có cả tên kiểu học sinh.

Các tệp còn lại (mỗi tệp canh đúng một lượt việc, tên tệp theo hệ): `rau41`, `nhay42`, `muc44`, `android45`, `mua46`, `boot47`, `nghi48`, `xe49`, `changelog`, `devpoints`, `settings`, `quality`, `music`, `phoneanim`, `news`, `phone3`, `phone4`, `shopapp`, `vua2`, `dicho`, `baocao`, `nguoi`, `helper`, `hong`, `polish5`, `impact`, `hobo` — tổng cộng **587 bài / 47 tệp** (`npm test`, `environment: 'node'`, chạy ~12 giây).

Phần đồ hoạ và thao tác được chạy thử bằng các kịch bản trong `tools/probe/`: một trình chạy Puppeteer điều khiển Chrome không giao diện (WebGL phần mềm, giả lập cảm ứng), bấm chạm như người chơi, chụp màn hình để xem bằng mắt, và soát hình học cả thành phố (mặt trùng phẳng, biển hiệu bị che). Danh sách cụ thể những gì đã và chưa chạy thử nằm trong README.

## 8. Việc còn dang dở

Người chơi đã thử bản đầu và gửi danh sách góp ý; việc được chia thành ba lượt. **Lượt 1 đã xong** (tường nhấp nháy, biển hiệu bị che, tên và nghề của người lạ, tự xếp nút). Còn lại, theo thứ tự sẽ làm:

**Lượt 2 — đường phố sống động hơn: đã xong** (NPC thô lỗ với tỉ lệ thấp, tên đẹp và tên kiểu học sinh, xe chạy trên đường, chim bay và tiếng chim, sáu nhân vật phụ có chuyện riêng, sáu góc phố nhỏ). Chi tiết ở mục 4.7–4.9 và mục 3.

**Lượt 3 — nội dung còn thiếu so với bản mô tả đầy đủ: đã xong phần chính** (60 món và thang mở công thức, chỗ chơi lên tinh thần, khách đứng mua, việc lúc rảnh của người đi đường, nút cất gánh, chạy bàn và bốc cảng). Chi tiết ở mục 4.3, 4.10, 4.11.

**Lượt 6 — sức khoẻ và bệnh viện: đã xong** (ngất vì máu 0, viện phí có trần, rơi đồ nhặt lại được trong ngày, Bệnh viện Phước An với khám bệnh – quầy thuốc – phòng hồi sức, nút đấm và nút nhảy). Chi tiết ở mục 4.14–4.15. **Lượt 7 — công an phường, tạm giữ, lao động: đã xong** (mức bị để ý, công an đi tuần gọi lại, đồn Công an phường có buồng tạm giữ, nộp phạt / cãi / bỏ chạy / theo về phường, đập đá bớt giờ, ra tù mất uy tín). Chi tiết ở mục 4.16. **Lượt 8 — điện thoại: đã xong** (ba mẫu máy, pin, sổ thu chi, danh bạ, tin nhắn, radio – nhạc – WAP, sạc). Chi tiết ở mục 4.17. **Lượt 9 — quán net: đã xong** (quán 10 máy ở Khu Dân Cư, thuê máy theo phút, chơi game – lướt web – xem phim, mỏi mắt sau 2 tiếng, sạc nhờ, nước ngọt, chủ quán và hai đứa nhỏ ngồi máy). Chi tiết ở mục 4.18. **Lượt 10 — đường phố 2005–2010: đã xong** (ô tô đời cũ nhả khói và bấm còi, đua xe đạp chủ nhật ba vòng bằng cách bấm nhịp, xích đu công viên). Chi tiết ở mục 4.19. **Lượt 11 — phố sống động: đã xong** (lịch sinh hoạt theo giờ, giờ cao điểm, chào hỏi theo quen mặt – mưa nắng, dù khi mưa, đi cặp, ngồi ghế đá, hàng xóm xem đua; sửa bàn cờ Ông Tư, biển lọt tường, kẹt trong tường; quán net nhẹ bụng hơn). Chi tiết ở mục 4.20. **Lượt 12 — giao diện dễ đọc: đã xong** (gợi ý cho biểu tượng HUD, chữ tiền/thoại to hơn một chút, cỡ giao diện 70–160% có ô xem trước, sổ tay công thức gọn một dòng mỗi món, chỗ giao hàng có người nhận đứng chờ với kiện hàng, cô Hồng dời qua bên kia tường cổng chợ, "Quang gánh" gọi ngắn là "Gánh", ô mục tiêu có nút thu gọn, tiếng nói cảm xúc cho người đi đường; sửa lỗi sửa xe không có xe vẫn trừ tiền). Chi tiết ở mục 4.21. **Lượt 13 — bậc 4 quán ăn nhỏ: đã xong** (bán ở tiệm Ba Tài 24.000.000₫, dựng ở hai mặt bằng có sân 160.000₫/120.000₫ mỗi ngày, quầy gỗ 4,4 m có mái tôn, bốn chỗ ngồi cho khách ăn tại chỗ, 150 kg – 16 món – 9 khách). Chi tiết ở mục 4.22, kế hoạch ba bậc còn lại ở `PLAN.md`.

Còn lại:

1. **Đã xong 3 kiểu chỗ ở mới: căn hộ, nhà riêng, cửa hàng kiêm nhà ở** (8/8) — xem mục 4.13.
2. **Đã xong sạp cố định (bậc 3)** — mục 4.12, **quán ăn nhỏ (bậc 4)** — mục 4.22, và **quán có chỗ ngồi (bậc 5)** — mục 4.25, **nhà hàng bình dân (bậc 6)** — mục 4.26, **chuỗi cửa hàng (bậc 7)** — mục 4.27, **giao người làm đi chợ** — mục 4.28, **báo cáo sắp hết đồ + tự duyệt đặt bàn** — mục 4.29, **vựa ve chai thứ hai + bấm chuông mở cửa** — mục 4.30, **ba giao diện điện thoại** — mục 4.31, **app Quản lý cửa hàng** — mục 4.32, **cảnh báo thiếu nguyên liệu nói rõ thiếu gì** — mục 4.29, **hai tổng đài 1080 & 1900 1234 trong danh bạ** — mục 4.33. Nhánh kinh doanh đã đủ **7/7 bậc**; việc kế tiếp là hệ thống băng nhóm.
3. Hệ thống băng nhóm.
4. Danh sách đầy đủ những gì còn lại nằm ở `TODO.md`.

**Việc nền chưa làm**

- Đo trên điện thoại thật: người chơi báo máy của họ chạy trên 50 khung hình/giây, nhưng chưa rõ đó là máy nào. Nếu máy yếu chạy chậm: gộp các khối cơ thể NPC thành một lưới, dùng instancing cho đồ vật lặp lại, bỏ sương mù theo điểm ảnh ở mức thấp, thêm LOD cho khu ở xa.
- Nghe thử và cân chỉnh âm thanh.
- Cân bằng nhịp độ qua chơi thử: tốc độ kiếm vốn ngày đầu, lượng khách lúc uy tín thấp, độ khó các mini-game.
- Kỹ thuật: tách gói JavaScript (một tệp 1.369 kB, nén còn 432 kB — đo trên bản build 2026-11-22) và nội thất cửa hàng chi tiết hơn. Chơi ngoại tuyến đã xong (lượt 40: service worker `public/sw.js` + nút trong Cài đặt).

Lỗi nhỏ đã biết: ở màn dọc HUD chật (game khuyên xoay ngang). Dòng "Dụng cụ"/"Sơ chế" trong Sổ tay đã rà ngày 2026-11-21 (`src/ui/panels.ts:273`) — không còn dấu "·" thừa.

### 4.34 Ông Bảy gợi ý đúng lúc (lượt 52)

Trước đây `case 'hobo'` trong `acts.ts` bốc ngẫu nhiên trong **6 câu viết sẵn** — ông Bảy nói về Hùng Sẹo, về chùa, về
thùng rác… bất kể người chơi đang ở đâu trong ván. Nay lời khuyên **đọc đúng trạng thái thật** và **chỉ trỏ chỗ đang
dùng được**, bằng một hệ luật thuần mới `src/sim/advice.ts` (không DOM, không three → test chạy trong Node).

**Đích đến là dữ liệu, toạ độ vẫn ở world.** `src/data/landmarks.ts` là danh sách `LANDMARK_LIST` (31 mục): mã, tên
người chơi đọc, và **cách tra toạ độ** — hoặc một khoá neo (`anchor: 'v_eatery'`), hoặc một chỗ bán (`spot: 'cho'`).
Toạ độ thật vẫn do `world/layout.ts` + lúc dựng cảnh quyết định, đúng luật "một nguồn toạ độ" của dự án; Bản đồ
(`Acts.places()`) và lời khuyên cùng đọc danh sách này nên **không thể lệch nhau**.
Ba cờ đi kèm: `always` (giường ngủ, bảng việc làm, bệnh viện, công an, gầm cầu, chỗ dựng quầy — dùng được bất kể giờ),
`openWith` (Chợ Xóm Chiều gộp 7 sạp, **một sạp mở là chợ dùng được**) và `HOME_LANDMARK` (mã chỗ ở → đích ghim).

**Bảng giờ tách ra `src/data/hours.ts`.** `PLACE_HOURS` + `placeHours()` trước nằm trong `game/npc.ts` (tệp kéo theo
three/DOM) nên `sim` không đọc được. Nay là dữ liệu thuần; `game/npc.ts` **re-export đúng tên cũ** (`PLACE_HOURS`,
`placeOpen`) nên mọi call site giữ nguyên, và `R.placeOpenAt(g, id)` (thêm vào `sim/rules.ts`) là bản dùng được ở cả
hai nơi. Nhờ vậy câu "đang mở" trong lời khuyên và cửa sắt của tiệm ngoài phố **luôn khớp nhau**.

**Bảy nhóm câu, xếp theo mức cấp thiết** (`advice(g, where)` trả về mảng đã sắp, mỗi câu có `id`, `text`, `place`,
`urgent`):

| Nhóm | Khi nào | Trỏ tới đâu |
|---|---|---|
| `health` (100) | máu < 30 | Bệnh viện Phước An, kèm giá khám 20.000₫ / hồi sức 5.000₫/giờ |
| `eat` (90) | đói < 25 hoặc sức < 20 | Quán Bà Tư nếu đang mở → chùa 11–13h → **MiniMart 24h/Tạp hoá còn mở** → chùa (mở cả ngày) |
| `job` (80) | tiền < 30.000₫ | Bến bốc hàng (4h30–10h) → rửa chén quán Bà Tư (đang mở) → Bảng việc làm |
| `noStall` (70) | chưa có gánh | Đồ Nghề Ba Tài (7–20h) → gầm cầu nếu tiệm đóng |
| `carry` / `closed` / `peak` (40–62) | có quầy | Cổng Chợ; giờ đông nhất tính từ `hourCurve` của đúng khu quầy đang đứng |
| `stock` (55) | món đang bán thiếu đồ | **đúng sạp đang mở và có món đó**, nói rõ thiếu nguyên liệu nào |
| `debt` (75) | nợ Hùng Sẹo còn ≤ 2 ngày (kể cả trễ) | Hùng Sẹo, kèm số tiền + số ngày; đêm thì nói rõ sáng 9h mới gặp được |
| `rain` (35–50) | trời sắp mưa | chưa có áo mưa → chỗ bán áo mưa còn mở; có rồi → nhắc bán món nóng ở quầy |
| `night` (42) | 22h–5h | đúng căn mình đang thuê (`HOME_LANDMARK`), chưa có nhà thì gầm cầu |
| `dirty` (45) | vệ sinh < 22 | Nhà tắm công viên |
| `idle` (10) | không có gì gấp | chợ / tiệm đồ nghề **đang mở**, khuya thì bảng việc làm |

Câu nào cũng **kèm khoảng cách thật** tính từ `ctx.player` tới neo của đích ("cách đây 82 m").

**Trong hộp thoại** (`case 'hobo'`): câu đầu là câu cấp thiết nhất, dưới là nút **"Chỉ con đường tới …"** ghim thẳng
`acts.way` (cùng cơ chế cột sáng vàng + mũi tên của Bản đồ), cộng tối đa hai câu khác đang đúng để người chơi chọn.
Không lặp: `rememberAdvice` giữ **3 mã câu gần nhất** (`g.flags.hoboSeen` chỉ để biết đã nói lần nào), nói hết câu
mới thì quay lại câu gấp nhất — nên ghé liền ba lần không nghe lại y một câu.

**Kiểm thử.** `tests/hobo.test.ts` (23 bài): trên **120 trạng thái ngẫu nhiên** (giờ, tiền, chỉ số, thời tiết, chỗ ở,
nợ, quầy đóng/mở) mọi câu phải trỏ một đích **có thật** và **đang dùng được**; từng tình huống cụ thể (sắp ngất, đói
12h / 23h30, hết tiền 6h / 11h / 2h, chưa có gánh ngày / đêm, quầy chưa mở, thiếu đá cho trà đá, nợ còn 1 ngày, sắp
mưa, khuya về đúng căn trọ); không lặp câu; `shopFor` không bao giờ chọn sạp đã đóng và im lặng khi không chỗ nào
đang bán. Probe `tools/probe/steps/hobo.mjs` chạy hộp thoại thật ở 4 trạng thái (844×390) và bấm nút ghim — console sạch.

### 4.33 Hai tổng đài trong danh bạ: 1080 (dự báo mai) và 1900 1234 (lừa đảo, một lần)

Danh bạ điện thoại trước đây chỉ có người quen và khách quen. Nay có thêm **số tổng đài** — `Contact.hot` đánh dấu
`'wx' | 'scam'`, và `contacts(g)` **luôn xếp số tổng đài lên đầu** (trước cả khách quen), vì đó là số người chơi mở ra
để *dùng*, không phải để chào hỏi.

**1080 — dự báo thời tiết ngày mai.** Có sẵn từ đầu. `weatherForecast(g)` đọc thẳng `g.weather.next` (đã được `setWeather`
gán sẵn sau mỗi lần trời trở) nên **không bao giờ nói sai**; câu trả lời = tên thời tiết + `WEATHER[id].say` + một câu
khuyên bán hàng suy ra từ chính các hệ số của thời tiết đó (`hot < -0.3` → món nóng dễ bán, `hot > 0.3` → món mát,
`rain > 0.5` → nhắc ô dù/che quầy, `wind > 0.6` → nhắc bếp lửa). Cước **`WX_FEE = 2.000₫`** trừ thẳng vào `cash`/`led.other`,
mỗi ngày **`WX_PER_DAY = 3` lần** (đếm theo `flags.wxDay` + `flags.wxCall`, sang ngày tự reset) — gọi quá thì tổng đài từ
chối chứ không im lặng trừ tiền. Tin nhắn `wx<ngày>` đổi nội dung cho khớp: **hôm nay** thế nào, muốn biết **mai** thì gọi 1080.

**1900 1234 — \"trúng thưởng\".** Không nằm trong danh bạ lúc đầu. `SCAM_SMS_DAY = 1` và `SCAM_SMS_EVERY = 3`: từ ngày thứ
hai, **cách ba ngày** số này nhắn một tin mời gọi (`hasScamSms`); **có tin mới có số** — `knowsScam(g)` là điều kiện để
`contacts` thêm dòng `1900 1234`. Gọi (`callScam`) là mất **`SCAM_FEE = 15.000₫`** cho 3 phút dây dưa và bị hẹn lên
*\"văn phòng trúng thưởng ở cuối khu chợ\"*: toạ độ lấy từ **nút đường đi xa nhất của khu chợ** (`nodesByTag('market')`), lưu
vào `flags.scamX/scamZ`, và `scamTrip(g)` dựng lại mũi tên vàng **kể cả sau khi mở lại bản lưu** (trong `ActsSys.update`).

**Đúng một cơ hội.** `scammed(g)` là máy trạng thái ba nấc qua `flags.scamCall`: `'none'` → gọi được, `'once'` → đang trên
đường đi, `'done'` → đã biết. Tới nơi (`scamArrive(g, choice)`) hiện hộp thoại **\"Bức tường cuối khu chợ\"** với đúng hai
lựa chọn: **quay về** (mất 20 phút đi lại, tinh thần *tăng* 4 vì may mà chưa đưa tiền) hoặc **vẫn tin** — mất
`scamLoss(cash)` = **40% tiền mặt, kẹp 20.000–200.000₫** (bỏ vào cái thùng gỗ ở ngõ), tinh thần −16, sức lực −8, mất 90 phút. Dù chọn gì thì
`scamCall = 2`, nên **lần sau gọi lại chỉ nghe \"thuê bao không tồn tại\", `fee: 0`** — không bao giờ bị lừa hai lần. Số vẫn
nằm trong danh bạ với nhãn *\"Số lừa đảo — bạn đã biết rồi\"*, còn tin nhắn lừa thì biến mất khỏi hộp thư.

**Kiểm thử.** `tests/phone4.test.ts` (8 bài): danh bạ ngày 1 chỉ có 1080 và 1900 1234 chỉ hiện sau khi có tin; gọi 1080
đúng 2.000₫ + dự báo khớp `weather.next` + đổi theo thời tiết; hết pin/hết tiền/quá 3 lần một ngày thì không gọi được;
gọi 1900 1234 mất 15.000₫ và `scamTrip` trỏ đúng điểm hẹn; quay về thì **không mất đồng nào**, vẫn tin thì mất thật và
**chỉ một lần**; `scamLoss` đúng khoảng 20k–200k và không bao giờ âm tiền; gọi xong thì hộp thư sạch tin lừa mà danh bạ
vẫn giữ số; điểm hẹn đúng `SCAM_SPOT` và câu mời không còn nhắc "dây dưa". Probe `tools/probe/steps/hotline.mjs`
(390×844) chạy 8 bước trên bằng cú bấm thật — bấm *"Thôi, quay về"* thì hộp thoại đóng hẳn, `fee: 0` — console sạch.

### 4.49 Menu ẩn theo kịp game — 34 chỗ đi nhanh (lượt 67; bỏ cơ chế tua giờ ở lượt 68)

Người chơi: *“um bạn chưa cập nhật menu ẩn và các tính năng đc sửa”* — đúng. Sau lượt 66, menu ẩn có ba chỗ lệch:

**① Dòng “Phiên bản mới nhất” đứng nguyên ở bản lượt 62.** Câu đó là một chuỗi viết tay trong `devPoints.ts`
(`Đá viên tan chậm 3 lần…`) nên suốt bốn lượt nó không nhắc gì tới đồ nghề mới. Nay `DEV_BUILD_TAG` lấy thẳng
`CHANGELOG[0].tag`: thêm bản mới vào nhật ký là menu tự đúng, **không còn gì để quên**. Test canh cả giá trị lẫn
nguồn (dòng khai phải chứa `CHANGELOG[0]`).

**② Thiếu chỗ tới và đứng lệch.** Lượt 63 dọn menu còn 13 mục; nhiều nhân vật ngoài phố (vựa sỉ Tám Lúa, tạp hoá Cô Ba,
quán cơm Bà Tư, nhà thuốc, ngân hàng, cầm đồ, hớt tóc, quần áo, trọ/khách sạn/nhà nghỉ, bệnh viện, công an, trà đá,
vá xe, cô hát rong, bé đánh giày, Bin, nhóm đua xe đạp, quán net, quán cà phê) **không có mục nào**. Mục Chú Ba thì
đặt `(a.x − 1,6; a.z + 1,8)` — lệch 2,4 m và quay mặt sai hướng. Nay có **34 mục**, mỗi mục khai `anchor` (neo thật
trong `world.anchors`) và dùng chung `tpNear(anchor, label)`:

| Việc | Trước | Sau |
|---|---|---|
| Chỗ đứng | toạ độ cứng, dễ lọt vào cột/quầy/kệ | `tpNear`: thử **5 khoảng cách × 10 hướng**, bỏ qua chỗ `world.blocked(x, z, 0.34)`, rồi **quay mặt vào neo** |
| Danh sách | 13 mục viết tay | 34 mục; thêm nhân vật ngoài phố chỉ cần `di('tp_x', 'v_x', …)` một dòng |
| Giờ trong ngày | — | **menu không đụng tới đồng hồ.** Lượt 67 có tua giờ tới giờ mở cửa; lượt 68 người chơi yêu cầu bỏ hẳn — xem khối dưới |
| Neo | không ai canh | `DevAction.anchor` + test đối chiếu `b.anchor('v_…')` trong `src/world/{city,places,side}.ts` |
| Nhãn nút khoá | viết cứng “7 lần” trong khi mã đòi 8 | đọc `${DEV_TAPS}` |

**③ Nút khoá ghi sai số lần bấm** (“7 lần” trong khi `DEV_TAPS = 8`): nay nhãn lấy từ hằng số.

**Đo** (probe `tools/probe/steps/dev67.mjs`, bấm **chuột thật**: 7 lần → chưa có bàn phím; lần 8 → bàn phím `1…9, del, 0, clear`
với 6 chấm; gõ `438291` → menu mở, `nhóm: ["Địa điểm — tele nhanh"]`, `sốMục: 34`; bấm lần lượt **28 mục** có neo riêng và đo khoảng
cách tới neo):

| Mục | Neo đo | Cách | Kẹt? |
|---|---|---|---|
| `tp_equip` | `v_equip` | 1,70 m | không |
| `tp_chu_ba` | `v_chu_ba` | **1,70 m** (trước 2,4 m) | không |
| `tp_hobo` | `v_hobo` | 2,20 m | không |
| `tp_canho` | `bell_canho` | 1,70 m | không |
| `tp_bank` / `tp_hotel` / `tp_net` / `tp_cafe` | neo tương ứng | 1,70 m | không |
| `tp_rap` / `tp_dua` / `tp_net` | `v_rap` / `v_dua` / `v_net` | 1,70 m | không |
| các mục còn lại (28 mục có neo) | neo của người đó | 1,70 m | không |

**Đồng hồ đứng yên (lượt 68).** Bản lượt 67 tua đồng hồ tới giờ mở cửa của chỗ sắp tới; người chơi đọc dòng nhật ký
đó và yêu cầu **bỏ hẳn cơ chế**, không chỉ xoá câu chữ. Đúng là nên bỏ: menu dành cho người làm game, mà việc “đi nhanh”
mà nhảy cả giờ trong ngày là **sửa luật chơi** — bỏ đói, bỏ mất khách, đổi cả thời tiết và lịch sinh hoạt của NPC.
Nay `tpNear()` chỉ đặt chỗ đứng, **không** đọc/ghi `g.min`; `tp_equip` cũng thôi tự đẩy giờ lên 10h. Tới lúc nào thì
gặp đúng chuyện lúc đó, y như tự đi bộ ra. Đã xoá `openNow()`, tuỳ chọn `hour`, hai import `PLACE_HOURS`/`SHOPS`, và
`tests/devpoints.test.ts` canh bằng bài *“đi nhanh KHÔNG đụng tới đồng hồ”* (không `openNow`, không `hour?`, và
phần `getDevSections` không được có `g.min =`).

Bấm `tp_lavabo` khi chưa dựng nhà hàng ⇒ toast *“Cần dựng nhà hàng trước.”* (đúng ý). Bấm “Ẩn & khoá lại” rồi mở
Cài đặt ⇒ **không** lộ menu, phải gõ mã lại. `errors: none`.
Test: `tests/devpoints.test.ts` **17 bài** (tag = `CHANGELOG[0].tag` và không viết tay; mọi `anchor` có thật trong
`src/world`; phủ đủ 27 neo nhân vật; chống kẹt + quay mặt vào neo; nhãn nút đọc `DEV_TAPS`), cả bộ **684 bài / 57 tệp**.

**Cạm bẫy probe (ghi lại để lần sau khỏi mất thời gian):** `page.mouse.click()` của puppeteer chỉ nhận **số nguyên** —
toạ độ lẻ (`770.375`) làm click chết với *“Failed to deserialize params.x”* mà **không** báo lỗi ở bước đó; và `clickEval`
phải trả **mảng các điểm** `[[x, y]]` chứ không phải một điểm trần. Ngoài ra `ui.panel('settings')` gọi khi bảng **đang
mở** là bấm-tắt nó (panel tự toggle) — muốn chắc thì kiểm `ui.modalName` trước.

**Tiệm quần áo Cô Ngọc (lượt 28).** Sạp vải dựng giữa chợ (khối `1c` trong `side.ts`) **đã bỏ**; Cô Ngọc dọn vào một căn
nhà có sẵn ở **mặt tiền tây Phố Trung Tâm** (`LOTS` 11W, cạnh Đồ Nghề Ba Tài) — nay là `kind: 'thoitrang'` dựng trong
`places.ts`: vỏ nhà có cửa cuốn + mái hiên + biển **QUẦN ÁO CÔ NGỌC**, hai giá treo áo dọc hai bên, bàn gấp đồ có khay
kính, khay giày dưới đất, gương lớn áp tường, đèn trần; neo `v_thoi_trang` nằm trong tiệm nên cô đứng bán bên trong.
`tests/look.test.ts` kiểm lô này là nhà thật (đúng ô phố, mặt tiền, đủ rộng).

### 4.50 Xe nước mía, quán nước mía, nghề phụ hồ, bốn chỗ dựng sẵn thành chạm được, và thuê nhà theo tháng (lượt 69)

Người chơi đặt năm việc: *“dựng xe nước mía ở Chợ Xóm Chiều tương tác được, bán/mua được, thêm nước mía thành món mới”*;
*“cửa hàng có sẵn nước mía trên map cũng phải chạm được”*; *“thêm kiểu thuê theo tháng”*; *“chọn 5 chỗ đã dựng nhưng chưa
tương tác mà làm cho chạm được”*; *“mở rộng nghề / ca làm”*. Hai chỗ hỏi lại đã chốt: **làm cả hai** (xe ở chợ **và** quán
cố định trên phố) và **tháng = 4 tuần × 0,8 (giảm 20 %)**.

**① Nước mía là món thật, không phải câu chữ.** `src/data/ingredients.ts` thêm nguyên liệu `mia` (Cây mía, 12.000₫/cây,
tươi 480 phút, dạng “cây” dài 1,4 m để dựng được thành bó). `src/data/recipes.ts` thêm `nuoc_mia`: **1/8 cây mía + một chút
đá**, mẻ sơ chế **8 ly**, ly **3.000₫** (ly lớn 5.000₫), `hold: 300`, danh mục `nuoc`, ly thuỷ tinh. Giá vốn ≈ 1.900₫/ly
⇒ lãi gộp ~37 %, thấp hơn mọi món quán nhưng đúng kiểu hàng rong: lời mỏng, bán nhiều. Con số này bị `tests/economy.test.ts`
(*“mọi món bán đúng giá thị trường đều có lãi gộp”*, đòi giá vốn < 70 % giá bán) canh, nên **đừng** nâng `pack` hay hạ `ref`.

**② Món nước mía KHÔNG tự mở theo tay nghề.** Trước đây `unlockRecipes` mở mọi món chưa biết theo giá tăng dần. Một món
3.000₫ sẽ chen vào **đầu** thang, làm gãy hai bài của `tests/fun.test.ts` (món rẻ nhất phải mở trước; món cuối phải là
`xien_nuong`) — và tệ hơn, nó lấy mất ý nghĩa của việc *ra quán học nghề*. Nay có `autoUnlockable(r)` = “món không có
`learn` HOẶC có `learn` nhưng vẫn thuộc thang tự mở”; riêng `nuoc_mia` khai `learn: { from: 'mia_quan', cost: 20000, skill: 1 }`
nên **chỉ** học được ở quán (20.000₫). Ba chỗ phải cùng hiểu luật này: `unlockRecipes` (lọc `autoUnlockable`), bài
*“mở đúng món rẻ nhất”* (không tính món không tự mở là “bị nhảy cóc”), và bài *“đủ 60 món thì thôi”* (nay đếm
`RECIPE_LIST.filter(autoUnlockable)` thay vì `RECIPE_LIST.length`).

**③ Hai chỗ bán dựng thật.** `src/world/mia.ts` (mới) có hai hàm:
- `buildMiaCart(b)` — **xe nước mía trong Chợ Xóm Chiều**, đúng chất xe đẩy: thùng xanh, `canePress()` (trục ép + tay quay,
  quay được), xô nước, thùng đá, ly xếp chồng, `caneBundle()` (bó mía dựng góc), dù đỏ, biển **“NƯỚC MÍA 3.000₫”**,
  hai ghế nhựa + bàn, bao bã mía. Neo `v_mia_xe` + `mia_xe`, chunk `b01`.
- `buildMiaShop(b, w, d)` — **quán Nước Mía 3K ở mặt tiền bắc Phố Trung Tâm**, cạnh quán cơm Bà Tư: vỏ nhà, mái hiên,
  bảng giá, quầy, `canePress` **quay 180° ra phía khách**, két nước, thùng đá, bó mía, hai bàn nhựa, quạt, đèn, cửa cuốn.
  Neo `v_mia_quan` + `mia_quan`.

**Cạm bẫy đã trả giá — ĐỪNG thêm lô vào `SPECIALS`.** Ban đầu quán được đặt bằng một lô mới trong `SPECIALS['11N']`.
`planLots()` bốc số ngẫu nhiên **theo thứ tự lô**, nên thêm một lô là lệch cả chuỗi RNG phía sau: bề rộng các lô mặt tiền
tây đổi, và lô `thoitrang` (đòi `w > 6,5`) **biến mất** ⇒ `tests/look.test.ts` đỏ với `expected undefined to be truthy`.
Cách đúng, và là cách dự án vẫn làm cho barber/boutique: **chuyển hoá một lô `house` có sẵn** — ở đây là
`LOTS.find(l => l.bx===1 && l.bz===1 && l.face==='N' && l.at===18 && l.kind==='house' && !l.id)`, gán `kind:'mia'`,
`id:'mia_quan'`. Đo lại: `mia_quan` rộng **5,47 m** (lô thật, không phải hằng số bịa), `thoitrang` vẫn còn (`w` 6,91 m),
tổng số lô 145. Vì thế `MIA_SPOTS.shop` **không** khai `w` nữa — bề rộng do `planLots()` quyết định.

**④ Một thực đơn cho cả hai chỗ.** `acts.miaOpts(n, 'xe' | 'quan')`: mua ly 3.000₫ / ly lớn 5.000₫ (trừ tiền, giải khát,
`g.wd.miaSold++`), học cách làm ở quán, xin phụ bán một ca, và câu hỏi nghề. Ba người mới (`mia_xe`, `mia_quan`, `site`)
đều có mục trong `SIDE` nên đi qua `sideMenu` — `sideMenu` gắn `sideOpts` vào **cùng** hộp thoại, nên không cần nhánh riêng
trong `switch` của `talkTo`. Nhánh `case 'mia_xe' | 'mia_quan' | 'site'` trong `switch` chỉ còn là chỗ chết; đừng nối lại
(truy hồi: `sideMenu` đã `return` trước đó).

**⑤ Nghề phụ hồ.** Chỗ “công trình thi công” (`site '02N'`) trước chỉ có tấm biển. Nay trong `places.ts` dựng thêm chòi
công trình: bàn ghi tên + sổ chấm công, ghế chờ, biển **“TUYỂN PHỤ HỒ”** dán trên vách rào xanh (**đã bỏ mái bạt** —
người chơi chỉ ảnh bảo bỏ, nên không còn bạt sọc xanh–trắng lẫn bốn cọc chống giữa công trường), neo `site_phu` + `v_site`; phụ đề của
biển đổi thành *“… · Cần người phụ hồ”*. `rules.ts`: `SITE_SHIFT_MIN = 90`, `SITE_SHIFTS_DAY = 3`, `SITE_HOURS = [7, 16]`,
`SITE_WAGE_MIN = 38000`, `SITE_WAGE_MAX = 52000`, `siteWage(roll)`, `siteOpenAt`, `siteShiftsLeft`. Một ca: tiên 90 phút,
công 38–52k, hao `e-24 h-7 t-8 hy-7`, cần energy ≥ 30, `wd.siteShifts++`. Anh Sáu Lực (`FIXED.site`, vai *“Cai công trình”*)
là người nhận ca; vì đứng ngoài nắng cả ngày nên ổng có **màu da riêng** (`skin: 0xb8804f`) — `tests/mat56.test.ts` đòi
khai đủ, nên danh sách da rám nay là `['chu_ba', 'scrap2', 'site']`.

**⑥ Bốn chỗ dựng sẵn nữa thành chạm được** (đủ 5 với công trường ở trên):
| Chỗ | Neo | Làm gì |
|---|---|---|
| Tủ lạnh trong nhà trọ | `fridge_tro` | Chưa có tủ thì bán tủ (`buyGear('tulanh')`); có rồi thì mở kho lạnh tại chỗ (`R.homeChilled`) |
| Bàn trà ngoài hè | `tra_ban` | `spotOf(anchor, label, sub)`: ngồi nghỉ, nghe chuyện xóm |
| Sàn nhảy của Bin | `rap_floor` | Nói chuyện với Bin, vô nhảy một bài |
| Tiệm quần áo Cô Ngọc | `thoi_trang_gia` | `spotOf(...)`: lựa đồ, hỏi giá |

Neo mới phải đụng **đủ ba nơi**, không thì chạm không ăn: dựng trong `src/world/*` → khai trong mảng cứng của
`interact.ts` (dòng 74) → thêm nhánh trong `resolve()`. Thứ tự dựng còn ảnh hưởng RNG (xem ③).

**⑦ Thuê nhà theo tháng.** `src/data/gear.ts`: `DAYS_PER_MONTH = 28`, `MONTH_DISCOUNT = 0.2`,
`monthRent(weekRent) = round(weekRent × 4 × 0,8 / 1000) × 1000` ⇒ trọ **896.000₫**, căn hộ **2.880.000₫**, nhà riêng
**4.480.000₫**, cửa hàng **5.760.000₫** (tuần 280k/900k/1,4tr/1,8tr). Gói đang thuê nằm ở `g.rentPlan[id]` (dữ liệu **ván**,
không phải cờ sự kiện), ván cũ thiếu khoá thì mặc định `'tuần'`; `migrate` không cần đụng. `rules.ts`:
`planDays`, `planRent`, `hasMonthPlan`, `rentPlanOf`, `nextRent`, `payHousing(g, id, plan)`, `renewHousing(g, plan)`.
`dailyHousing` đọc đúng gói để nhắc đúng số tiền. Hộp thoại chủ nhà có thêm nút **“Thuê theo tháng”** (kèm số tiền tiết
kiệm thật) và, khi đang ở gói tuần chưa tới hạn, nút **“Đổi sang gói tháng”** — đóng sớm thì **cộng dồn** từ ngày đang
còn ở, không mất ngày đã trả. Bảng “Túi đồ” hiện `Gói tháng · đã trả tới hết ngày N`. **Lưu ý:** `hotel`/`motel` thuê theo
**đêm** nên **không** có gói tháng (`planRent(id,'tháng')` trả 0) — `hasMonthPlan` canh đúng bốn chỗ `per: 'tuần'`.

**Đo.** `npx tsc --noEmit` sạch. `npx vitest run` **686 bài / 57 tệp, xanh hết** (thêm 2 bài ở `tests/housing.test.ts`:
giá tháng = 4 tuần − 20 % và chỉ bốn chỗ có gói tháng; gói tuần vẫn là mặc định, đổi sang tháng khi đang trễ hạn thì tính
từ hôm nay). `tests/mat56.test.ts` + `tests/changelog.test.ts` + `tests/fun.test.ts` được cập nhật theo luật mới.

### 4.51 Nhóm “Vừa thay đổi” ở đầu menu ẩn — người làm game bấm là thử được cái vừa sửa (lượt 69)

Người chơi: *“um menu ẩn nên có 1 mục vừa thay đổi để khi ấn ng dev sẽ test được á bạn”*. Đúng chỗ đau: menu ẩn sau lượt 63
chỉ còn 34 chỗ đi nhanh, nên sau mỗi lượt người làm game muốn thử cái vừa sửa phải **tự nhớ** nó ở đâu, tự đi tới, tự mở
đúng bảng — và hay quên mất một mục.

**Cách làm.** `devPoints.ts` thêm `interface DevStep extends DevAction { since: string }` và hàng `latestSteps()`:
mỗi việc vừa làm khai một mục với `since` = nhãn bản lúc viết; `latestSteps()` lọc `x.since === CHANGELOG[0].v`.
`getDevSections()` chèn nhóm đó **lên đầu**, tiêu đề `Vừa thay đổi — <bản> (bấm là tới đúng chỗ, mở sẵn bảng)`.

Ba tính chất quan trọng:

| Tính chất | Vì sao |
|---|---|
| **Tự dọn** | Sang bản sau, `since` cũ không còn khớp `CHANGELOG[0].v` ⇒ mục tự rơi ra. Không ai phải nhớ xoá, đúng bài học của `DEV_BUILD_TAG` (lượt 67). |
| **Không sửa luật chơi** | Mục chỉ **đổi chỗ đứng** (`standAt()` — đứng cách neo 1,5–1,7 m, quay mặt vào neo, bỏ qua ô bị chặn) và **mở sẵn hộp thoại** y như người chơi tự bấm. Không cho tiền, không mở khoá, **không đụng `g.min`** (luật lượt 68). Test canh riêng phần `latestSteps()` không có `g.min =`. |
| **Có neo thật** | Mục nào đi tới đâu thì khai `anchor`, và test đối chiếu với neo dựng trong `src/world` — dời nhân vật là test đỏ. |

**Sáu mục của lượt 69** (`mx_…`): ① xe nước mía trong chợ ② quán Nước Mía 3K trên phố ③ chòi công trình (xin ca phụ hồ)
④ tủ lạnh nhà trọ (đại diện bốn chỗ dựng sẵn vừa nối) ⑤ **con số của bản** — đọc giá vốn một ly nước mía, giá tháng của
bốn chỗ thuê, số ly/số ca đã làm hôm nay ⑥ mở thẳng nhật ký phát triển.

**Đo** (probe `tools/probe/steps/menu69.mjs`, bấm chuột thật): 8 lần “Cài đặt” → gõ `438291` → `nhóm: ["Vừa thay đổi —
Lượt 69 (bấm là tới đúng chỗ, mở sẵn bảng)", "Địa điểm — tele nhanh"]`, 6 mục `mx_*` + 34 mục `tp_*`. Bấm từng mục:
xe mía → đứng `(-46; -4,2)` không kẹt, hộp thoại Cô Hai Mía **8 nút**; quán mía → `(-2,3; -19,3)`, Chú Tư Mía 8 nút;
công trường → `(-43,6; 39,3)`, Anh Sáu Lực 5 nút; “con số” đọc *“giá vốn 1.950₫/ly, bán 3.000₫ … trọ 896.000₫/tháng …”*;
nhật ký mở đúng bảng `changelog`. Đồng hồ 540 → 545 phút (chỉ nhích do hộp thoại tự trôi thời gian như mọi cuộc nói
chuyện, **không** phải menu tua). `errors: none`.

`tests/devpoints.test.ts` **18 bài** (thêm bài “nhóm Vừa thay đổi tự dọn”): nhóm đầu phải mang đúng nhãn `CHANGELOG[0].v`,
mọi mục `mx_` phải có `run`/`label`/`sub`, ít nhất 3 mục ở bản mới nhất, `latestSteps()` không đụng `g.min`, và danh sách
neo phải quét cả tệp mới `src/world/mia.ts`. Cả bộ **687 bài / 57 tệp**.

### 4.52 Góp ý trong game, xe mía ra cổng chợ, quán mía lùi quầy, mái công trường và hai mini-game mới (lượt 70)

Người chơi gửi mười tấm ảnh chụp trong lúc chơi và bốn yêu cầu. Bốn ảnh về bàn sơ chế là **bằng chứng lỗi**, không phải
gợi ý; lỗi **mất mái che ở công trường** được xếp **nghiêm trọng**, sửa trước mọi thứ khác.

**1. Nút Góp ý & báo lỗi + chỗ lưu góp ý.** Tệp mới `src/game/feedback.ts` lo toàn bộ phần lưu trữ (thuần dữ liệu, không
Three.js): `FB_KEY = 'ganhhang.feedback.v1'`, trần `FB_MAX = 40` góp ý, chữ từ `FB_TEXT_MIN = 8` tới `FB_TEXT_MAX = 600`,
ba loại `loi / gopy / khac` (mỗi loại có câu gợi ý riêng), `cleanText` gộp khoảng trắng rồi cắt trần, `checkText` trả **lý do**
chứ không im lặng, `makeId` ra mã đọc được bằng mắt (`L001-1` = báo lỗi, ngày 1, cái thứ nhất), và `exportFeedback` gom thành
một khối chữ để dán gửi đi. Mỗi góp ý tự đính **mã, ngày giờ, chỗ đang đứng, khu phố và nhãn bản dựng** (`CHANGELOG[0].v`)
— đủ để người làm game dựng lại đúng cảnh mà không hỏi lại.

Giao diện: `ui/ui.ts` thêm icon `note`, một nút `ib` `data-p="feedback"` **ngay trước nút Túi đồ**, phím **G**, và
`'feedback'` vào `TABS_CLOSE` (bấm lại là đóng). `ui/panels.ts` thêm nhánh `name === 'feedback'`: ba nút chọn loại, ô nhập
`#fbdraft`, hàng nút **Gửi góp ý · Sao chép hết · Xem khối chữ · Xoá hết (n)**, rồi danh sách “Đã gửi (n/40)” có nút Sửa/Xoá
từng cái. Bảng vẽ lại sau **mỗi** thao tác nên chữ đang gõ và trạng thái “đang mở khối chữ” phải nhớ **ngoài closure** —
đây là lỗi suýt xảy ra: `fbShow` đầu tiên bật/tắt một class trên DOM, mà DOM vừa bị vẽ lại thì class ấy mất ngay. Nay trạng
thái nằm ở biến cấp tệp `fbExportOpen`, và khối chữ là `<textarea readonly>` chứa sẵn `exportFeedback(list)`.

**2. Xe nước mía ra sát cổng trái chợ + sửa lỗi xe “biến mất”.** `MIA_SPOTS.cart` dời từ `(-46; −1,8)` (giữa lối đi, biển to
chắn cả dãy sạp) về `(-63,6; 20,2)`, quay mặt vào trong chợ — sát cổng phụ phía nam (x = −60, z = 23), lối đi chính giữa chợ
trống trở lại. Dù che hạ xuống 2,02 m phủ đúng cái xe, biển thu về **một tấm nhỏ gắn hai cọc trên nóc xe**.

Lỗi nặng hơn nằm ở **thứ tự lấy tham chiếu**: `buildMiaCart()` gọi `const D = b.detail, L = b.lit, U = b.unlit` **trước**
`b.chunk('b01', …)`, nên thân xe inox, mặt bàn và tấm biển rơi vào mảnh của khu vừa dựng xong — mảnh ấy bị ẩn khi người chơi
đi xa, thành ra nhìn quanh xe chỉ còn vài món lặt vặt. Nay đổi mảnh **trước**, lấy tham chiếu **sau**; `b.world.litter` cũng
tính lại theo `s.x/s.z` thay vì toạ độ viết cứng.

**3. Quán Nước Mía 3K — quầy lùi sâu, bàn ghế ra trước quầy, bảng giá áp vách.** Bản cũ kê quầy + máy ép sát mặt tiền
(z ≈ 1,35 m) nên đứng ngoài đường chỉ thấy bức vách sau quầy. Nay `qz = min(d − 1,55; 3,1)`: mặt tiền để **trống** (chỉ cửa
cuốn, mái hiên, biển), máy ép quay mặt ra đường, neo đổi theo — `v_mia_quan` phía trước quầy, `mia_quan` sau quầy (cách nhau
1,5 m, đúng tầm một người đứng bán).

Người chơi gửi thêm một ảnh ngay trong lượt này (“tấm bảng … ở trong chưa có bàn ghế”) ⇒ sửa hai chỗ:

- **Bàn ghế phải ở TRƯỚC quầy.** Bản lượt 70 đặt hai bàn ở `qz + 1,15` và `qz + 1,35` — tức **sau lưng chủ quán**, sâu hun
  hút trong quán; khách đứng ở mặt tiền vừa không thấy vừa không tới được. Nay `tz = min(qz − 1,75; 1,35)`, hai bàn dạt hai
  bên (đỏ trái, xanh phải), mỗi bàn ba ghế, ly đặt đúng mặt bàn (y = 0,70 chứ không phải 0,86 như bản nháp đầu — ly lơ lửng
  trên không), chừa lối đi ~1,6 m ở giữa cho khách bước vào tới quầy.
- **Bảng giá phải dính vào vách.** Bản lượt 70 đặt `signAt(0,9; 2,1; qz − 0,9)` mà vách trái nằm tận `x = 0,15` ⇒ tấm biển
  **cách tường 0,75 m, lơ lửng giữa quán**. Nay `signAt(0,3; 1,75; qz − 0,15; …; nx = 1)` — áp sát vách, quay mặt vào trong,
  cao 1,75–2,37 m: trên mặt quầy 0,97 m nên không bị máy ép/két nước che.

Ba phương án đã thử và loại, ghi lại để khỏi đi lại: (a) treo bảng trên cao 2,02 m thì mái hiên (2,33 m ở mép ngoài) cắt
ngang đúng chữ; (b) treo bằng hai dây thép từ trần thì vẫn lơ lửng, chỉ đổi kiểu lơ lửng; (c) cắm bảng **đứng trên mặt quầy**
(bệ nhôm + hai chân) thì bị két nước `U.box(w/2 + 0,95; …)` che mất nửa bên phải. Chỉ có áp vách là đọc được từ cả hai phía.

**4. Công trường: mái về, chòi ra chỗ thoáng.** Nguyên nhân mất mái: bản lượt 69 vẽ mái bằng **một** `L.quad`, mà quad chỉ có
một mặt ⇒ đứng phía dưới (đúng chỗ nói chuyện) là trần trơn. Nay dùng `b.awning()` (mặt trên + mặt dưới + diềm) **và** thêm
hai quad ngược chiều làm tấm phẳng, bốn cọc chống xuống đất. Chòi dời về `cx = 5,2; cz = 1,5` — khoảng trống sát lối vào,
trước giàn giáo — kèm bàn ghi tên, sổ điểm danh, ca nước, hai ghế nhựa và bảng `TUYỂN PHỤ HỒ`.

**5. Hai mini-game thật.**

| | Ép mía (`mia_phu`) | Xúc đất (`site_phu`) |
|---|---|---|
| Nhịp | con chạy qua lại trên thanh, bấm khi vào **vùng xanh** `[0,34; 0,74]` | **giữ** nút cho kim dâng, **nhả** khi vào **vùng vàng** `[0,62; 0,86]` |
| Sai thì sao | bấm lệch ⇒ nước tràn, vẫn tính một ly nhưng mất nước | nhả non ⇒ được nửa xe; giữ tràn ⇒ đất đổ ra ngoài, mất xẻng |
| Độ dài | 6 ly (`MIA_CUPS`), con chạy **nhanh dần** theo số ly | **3 xe × 5 xẻng**, mỗi xẻng ~4 s, giữa hai xe có nhịp **đẩy xe** 3,4 s ⇒ **≈ 70 s thực** |
| Thưởng | `R.miaBonus(good, 6)` | `R.siteBonus(good, 5)` (quy đổi từ số xe đầy vừa) |

Người chơi dặn ca phụ hồ phải dài **1–2 phút thời gian thực** — nên bản đầu (5 lượt × 1,5 s ≈ 8 s) bị thay bằng vòng
“3 xe × 5 xẻng + đẩy xe”, và `tests/feedback.test.ts` **canh bằng số**: `3×5×4 + 3×3,4 = 70,2 s`, phải nằm trong `[60, 120]`,
mỗi thang không dưới 2 s để còn kịp canh bằng mắt. Đo bằng `ctx.dt` (giây thực), **không** phải phút trong game.

**6. Luật tiền tách khỏi giao diện.** `sim/rules.ts` giữ `MIA_CUPS_SHIFT = 6`, `miaBonus()`, `siteBonus()`; `acts.ts` chỉ còn
`miaBonusPay()` / `siteBonusPay()` (earn/spend + toast + chữ nổi). `sim/state.ts` thêm `wd.miaCups`, `wd.siteCups` (khai báo,
khởi tạo, reset cuối ngày trong `rules.ts`).

**7. Camera mini-game ép mía.** Camera của `startMiaShift`/`startMiaDrink` ghép bằng sin/cos theo một quy ước khác với
quy ước dựng xe (`a` = chỗ người bán, `a.yaw` = hướng người bán nhìn) nên lần đầu dời xe xong là camera lọt vào trong thùng
inox — màn hình chỉ còn mặt kệ. Nay mọi điểm đứng tính bằng `P(side, front) = a + (sin yaw · front − cos yaw · side,
cos yaw · front + sin yaw · side)`: người chơi đứng sát mép thùng, camera chếch hông 2,9 m / cao 3,15 m nhìn chéo xuống
máy ép. Tấm biển trên nóc xe dời về **nửa trái** (nâng lên 1,55 m) để nửa phải — chỗ đặt máy ép — nhìn từ phía khách vẫn
thấy trục ép và xô nước.

Camera **quán** thì không suy ra bằng công thức được: quán hẹp, có mái hiên ở mặt tiền nên lùi ra đường là chạm bạt, mà
đứng sát quầy thì cái đầu người chơi che đúng chỗ máy ép. Cách chốt: lấy **trục khách–người bán** từ hai neo `v_mia_quan` →
`mia_quan` làm hệ quy chiếu (đơn vị `u` = hướng từ người bán ra khách, `s` = pháp tuyến), rồi đặt camera ở `v + u·0,9 + s·1,5`
cao 2,5 m — tức đứng **ngay chỗ khách đứng**, chỉ lệch hông, nhìn chéo xuống. Góc này đọc được cả máy ép, két nước, bàn nhựa
và người bán, nên không phải đoán toạ độ nữa.

**8. Camera mini-game phụ hồ + chỗ đứng của Anh Sáu Lực.** Ảnh chụp mini-game phụ hồ cho thấy hai lỗi cùng lúc: khung hình
đầy mặt bàn ghi tên (camera đặt sau lưng người chơi, hướng vào bàn), và Anh Sáu Lực **đứng chênh trên mặt bàn** vì neo
`site_phu` đặt ở `y = 0,9` — đúng độ cao mặt bàn — thay vì dưới đất. Nay neo dời ra **sau bàn** (`cx; cz − 0,55; y = 0,13`)
với `yaw = 0`, tức cùng quy ước “neo = chỗ người đứng, `yaw` = hướng nhìn ra phía khách” như neo xe mía/quán mía. Người chơi
đứng trước bàn 1,15 m (quay mặt vào bàn, tay chống xẻng); camera lùi sâu vào trong sân 0,75 m sau neo, lệch hông 2,9 m, cao
1,85 m — thấp hơn tầm mắt người đứng nói chuyện (bản trước còn mái bạt 2,2 m, nay mái đã dỡ nên chỉ cần tránh cột). Trục cột giàn giáo ở `cx − 0,6` lại đúng
đường nối camera–chủ thể nếu đứng thẳng phía trước, nên phải lệch hẳn sang hông: khung hình mới thấy cả người xúc lẫn bàn ghi tên.

Bài học dùng lại được: với mọi cảnh quay trong nhà/hàng quán, **kiểm tra ba thứ theo thứ tự** — (1) độ cao camera so với mái
che gần nhất, (2) có cột/kệ nào nằm trên đường nối camera–chủ thể không, (3) đầu người chơi có che đúng vật đáng nhìn không.
Cả ba lỗi trên đều lọt qua vì trước đó chỉ chỉnh `side`/`front` mà không nhìn ảnh chụp.

**Đo.** `npx tsc --noEmit` sạch; `npx vitest run` **702 bài / 58 tệp xanh hết** (thêm `tests/feedback.test.ts` 15 bài: kho góp
ý, mã, cắt chữ, sửa/xoá, trần 40, hỏng dữ liệu không làm sập game, xuất khối chữ; và hai bài canh độ dài ca phụ hồ);
`npm run build:pages` OK. Probe `tools/probe/steps/fix70.mjs` (bấm chuột thật, 13 bước): nút góp ý đứng **ngay trước** Túi đồ,
gửi được góp ý `L001-1` kèm bối cảnh, khối chữ xuất đúng, phím G mở / Esc đóng; xe mía cách cổng trái chợ **5 m**, người
bán đứng ở `y = 0,13` (dưới đất); quán mía khách–chủ cách nhau **1,5 m**; chòi công trường không còn mái bạt nên không vướng tầm nhìn; mini-game
ép mía chạy đủ 6 ly, mini-game xúc đất chạy đủ 3 xe và trả thưởng. `errors: none`.

### 4.53 Nhóm “Vừa thay đổi” có thêm mục cho củ khoai / xúc xích / bánh tráng trộn, và mấy chỗ chỉnh hình (lượt 70b)

Người chơi: *“bạn forgot update menu ẩn”*. Yêu cầu không phải “thêm một mục cho có”: vào menu ẩn, bấm đúng mục thì
phải **đứng ngay chỗ nhìn thấy cái vừa sửa**, không phải tự đi tìm.

Ba mục mới (giữ số của bảy mục cũ, mục mới xếp sau để người đã quen menu không phải học lại):

| # | id | Bấm vào thì |
|---|---|---|
| ④ | `mx_ban_ghe_quan_mia` | đứng **trong** quán mía, cách neo `v_mia_quan` 3,0 m nhìn ra quầy — thấy cùng lúc hai bàn nhựa + ghế + ly trên mặt bàn + bảng giá áp vách trái |
| ⑧ | `mx_hinh_khoai_xucxich` | bày củ khoai và cây xúc xích **trước ống kính** 3,5 s (xem dưới) |
| ⑨ | `mx_tron_moi` | dựng sạp bánh tráng trộn nếu chưa có, mua gánh + dao thớt, bật món, cấp sẵn 6 nguyên liệu rồi `cook.finish()` — vào thẳng ván trộn |

**④ — hướng đứng quan trọng hơn khoảng cách.** `standAt()` thử hướng 0 trước (phía +z của neo), mà neo `v_mia_quan` nằm
phía trước quầy ⇒ hướng 0 rơi ra ngoài đường, người chơi **quay lưng vào quán** và ảnh “vừa thay đổi” toàn là mặt đường.
Nay `standAt(anchor, d, msg, dirs?)` nhận thêm **thứ tự hướng ưu tiên**; mục ④ truyền `[π, π±0,35, π±0,7]` (đứng phía trong),
`pitch −0,22` để khung hình hạ xuống ngang mặt bàn. Đây là tham số tuỳ chọn nên ⑤⑥ (công trường, ca phụ hồ) không đổi.

**⑧ — vì sao phải gắn vào camera.** Ba cách đặt món “trước mặt người chơi” đều hỏng: đặt cách 2 m thì đầu/thân nhân vật
che mất; lùi ra 2,2 m thì món nhỏ như hạt đậu; đặt theo `camTo` (camera lùi sau lưng) thì đâm vào quầy, vào bàn hoặc chui
vào mái. Ẩn `rig.root` cũng vô ích vì `player.update()` ghi lại `rig.root.visible` **mỗi khung**.
Cách chạy được: đặt bốn món ở **toạ độ cục bộ của camera** (`x` lệch `±0,39`, `y −0,02…+0,03`, `z −0,62`) — luôn nằm giữa
khung hình, không bị gì che — **và** `scene.add(camera)`, vì camera không nằm trong scene thì mọi thứ con của nó **không
được vẽ**. Renderer dùng camera riêng nên `camTo`/`set.cam3` không ảnh hưởng. 3,5 s sau tự `remove()` và xoá `__devShapes`.
Quan trọng: xoay `rotation.y ≈ 0` (thân món dựng dọc **trục Z**, tức hướng về camera) — lần đầu để nguyên nên nhìn **dọc
trục**, củ khoai chỉ còn là một cục tròn, không đọc được hình gì.

**Hình củ khoai — lần thứ ba mới ra.** (1) Ghép ba elipxoit ⇒ ra **con sâu**; (2) ghép trụ vát nối tiếp ⇒ **lộ mối nối**,
nhìn thành đùi gà; (3) trụ liền + hai đầu vát ngược ⇒ ra **khúc ống** cụt, vẫn không ra củ. Chốt: **một elipxoit dài làm
thân** (`L·0,55 × Rr × Rr·0,9`, tức dài ≈ 3,4 lần đường kính), thêm **một bụng phình lệch phía cuống**, hai đầu cong nhẹ
(mũi củ vểnh xuống, đầu cuống hơi ngửa lên), một cuống khô ngắn, một chỗ vỏ mỏng lộ ruột vàng và ba mắt củ nhỏ nổi.
Xúc xích giữ nguyên dáng trụ hai đầu bấm kẹp nhưng **bỏ mặt cắt hở** ở hai chỏm (thêm chỏm bầu kín) — trước đó nhìn đầu
ống rỗng. Trên vỉ nướng, `k` (hệ số thu nhỏ) nay tách riêng: khoai `0,62`, xúc xích `0,54`, `gap 0,15`.

**Ghế nhựa.** `plasticStool` cũ là **một khối trụ 4 cạnh thuôn lên** ⇒ đứng xa nhìn ra “cái thùng nhựa”. Nay: mặt ngồi
0,36 × 0,36 dày 3,5 cm + gờ dưới + bốn chân thon chụm nhẹ. Hàm dùng chung ở ~15 chỗ trong thành phố nên chỗ nào có ghế
nhựa cũng đổi theo; `h` (chiều cao) giữ nguyên nghĩa nên các chỗ gọi không phải sửa.

**Đo.** `npx tsc --noEmit` sạch; `npx vitest run` **715 bài / 61 tệp xanh**; `npm run build:pages` OK. Probe
`tools/probe/steps/dbg.mjs` (đã xoá sau khi dùng): bấm 8 lần Cài đặt → PIN `438291` → menu hiện **9 mục `mx_*`** đúng
thứ tự (`gop_y, mia_xe_moi, mia_quan_lui, ban_ghe_quan_mia, mai_cong_truong, ca_phu_ho_dai, nhat_ky70, hinh_khoai_xucxich,
tron_moi`) rồi 32 mục `tp_*`; ⑨ vào được ván trộn (`đangChơi: true`, 5 đĩa); ảnh ④⑧⑨ chụp lại đúng thứ cần thấy.

### 4.54 Ông Bảy nói đúng chuyện đang diễn ra trong phố (lượt 70c)

Lỗ hổng của lượt 52: lời khuyên đọc đúng máu / tiền / quầy / nợ / mưa / khuya, nhưng **22 sự kiện của thành phố
thì chỉ radio và WAP biết**. Có lễ hội ở công viên, có trận bóng, chợ lên giá thịt — người dẫn đường duy nhất
trong game không nói một câu nào. Nay `eventRule(g, e)` trong `sim/advice.ts` trả về **một câu cho mỗi sự kiện**.

**Ba luật của câu sự kiện** (canh bằng `tests/hobo.test.ts`, 6 bài mới):

1. **Đích phải có thật và đang dùng được.** Mỗi câu khai `place` trong `LANDMARK_LIST`; bộ test chạy **cả 22 sự
   kiện × 4 mốc giờ** rồi đòi `destOpen()` đúng. Hai đích mới chỉ sống khi sự kiện chạy — `cafe_bongda`
   (`bong_da`) và `net_tro` (`tan_su_kien`) — khai trong `ONLY_IN_EVENT`, nên “tối nay có trận bóng” không còn
   được nói vào 9 giờ sáng hôm sau.
2. **Câu về quầy chỉ nói khi đang bán thật.** Đoàn kiểm tra, nhà phê bình, khách VIP, khách quậy, khách quen ăn
   chịu, đối thủ mở quán: `selling && s.open` mới nói, và ghim **đúng chỗ quầy đang đứng** (`spot_*`). Vì vậy
   `LANDMARK_LIST` có thêm `spot_vp`, `spot_matbang_tb`, `spot_matbang_dc` — trước đó lời khuyên chỉ biết Cổng Chợ.
3. **Mức cấp thiết nằm giữa hai nhóm.** Sự kiện chỉ kéo dài vài giờ nên phải nói **trước** chuyện thường
   (quầy trên vai 60, thiếu nguyên liệu 55) nhưng **sau** chuyện nguy hiểm tới thân (sắp ngất 100, bão 102,
   đoàn kiểm tra 90). Lần đầu đặt 44–66 thì câu sự kiện rơi xuống mục “Hỏi chuyện khác” — ảnh probe cho thấy
   ngay; đã nâng +6 và kiểm lại bằng ảnh.

**Sửa thêm một lỗi thật gặp lúc làm:** `acts.placeOf(id)` lấy `places()[indexOf(id)]`, mà `places()` **bỏ qua**
đích nào chưa có neo/chỗ bán ⇒ thêm ba đích mới là chỉ số lệch, ghim đường đi sang chỗ khác. Nay `placeOf` dò
thẳng theo **mã** rồi tự đổi `anchor`/`spot` thành toạ độ.

**Chữ trong câu** lấy từ chính `EVENTS[id]`: mức tăng giá đọc từ `price` (hải sản `1.5` ⇒ “+50%”), thời gian còn
lại tính từ `g.ev.active[].until` (“còn khoảng 10 tiếng nữa”), nên không có con số viết tay nào trôi khỏi luật.

**Đo.** `tsc` sạch · `vitest` **722 bài / 61 tệp** xanh · `build:pages` OK · probe `steps/ev70c.mjs`: menu ẩn có
**10 mục `mx_*`** (thêm ⑩), bấm ⑩ thì bật `le_hoi`, đứng cách Ông Bảy **1,6 m**, câu chính là câu sự kiện, nút
“Chỉ con đường tới Cổng Công Viên”, bấm nút thì `acts.way = Cổng Công Viên (41; −37,3)` — đúng `SPOTS.cv`,
HUD báo “149 m”. `errors: none`.

**Sổ tra cứu mới:** `SUA_NHANH.md` — bảng “muốn đổi cái này thì mở tệp nào”, 9 nhóm, kèm luật của menu ẩn và ba
thứ không đo được ở đây, để lần sau sửa khỏi phải dò lại từ đầu.


---

## Lượt 71 — BĂNG ĐẢNG

Người chơi xin sáu thứ: *hàng cấm vài loại · hình phạt nặng · xem băng đảng chi tiết · phe phái · nv băng đảng event
· thăng chức*. Cả sáu đã có, số liệu nằm ở `src/data/gang.ts`, luật ở `src/sim/gang.ts`.

**Hai phe.** `hem` — Băng Hẻm Công Nhân, đại ca **Hùng Sẹo** (neo `v_shark`, lễ 200.000₫), giữ Xóm Lao Động.
`cho` — Băng Chợ Cá, đại ca **Bà Năm Lửa** (nhân vật mới, neo `c_ba_nam` ở vựa cá trong Chợ Xóm Chiều, lễ
120.000₫). Mỗi băng có `rival`; đã theo bên này thì bên kia **không nhận và không nói chuyện làm ăn**.

**Sáu bậc** theo uy tín: 0 · 40 · 120 · 260 · 460 · 720 (Đàn em mới → Thằng lính → Giữ hàng → Thu nợ → Cánh tay
phải → Đại ca). Băng ăn chia `cut` 0 / 5 / 8 / 12 / 20 / 30 % — **càng lên càng ít phần mình trên mỗi chuyến**,
đổi lại mở việc và món hàng mới, và bậc 6 có tiền bảo kê mỗi ngày. Thăng chức **không mua bằng tiền**: cần đủ
uy tín **và** đã làm đủ số chuyến (`gang.paid`), và phải tới xin đại ca — bậc lưu ở `gang.tier`, không tự nhảy.

**Bốn món hàng cấm:** thuốc lá lậu, rượu ngoại, pháo, hàng điện tử trôi nổi. Có `buy`/`sell`/`kg`/`fineMul`/
`jail`/`minTier`. Hàng do **băng giữ hộ** trong `gang.stock`, người chơi không chở trong túi.
Phạt = `sell × fineMul` (1,2–2,2) + `jail` 2–6 giờ; bị bắt là **mất sạch hàng, tụt 30 uy tín trong băng, −4
uy tín ngoài phố, +20 mức bị để ý**. Ràng buộc test: *bắt một chuyến pháo phải lỗ hơn tiền lời ba chuyến giao
hàng* — cái giá luôn nặng hơn cái lời, đó là chủ ý nội dung (không ma tuý, không vũ khí).

**Năm việc:** canh kho · bốc hàng (3–9 giờ) · chở hàng · giữ hàng qua đêm (trả bằng hàng) · thu nợ thuê
(9–19 giờ). Mỗi việc có `perDay` 1–2, tiền công, heat, uy tín, bậc tối thiểu.

**Bị khám bất ngờ:** `sim/police.ts` → `contrabandRisk` (4–30 % theo mức bị để ý) và `contrabandSweep` gọi mỗi
giờ; lớp game nhận cờ `flags.sweepNow` rồi cho công an lại gần, `acts.caught()` thấy `bustFine > 0` thì mở
`bustedForContraband()` (nộp / cãi 25 % / chạy 35 % / theo về phường).

**Sự kiện:** `bang_goi`, `bang_doi` (`need: 'gang'`), `bang_dap` (`need: 'rival'`) — người chưa theo băng không
bao giờ thấy; Ông Bảy có câu riêng cho cả ba (`advice.ts` → `eventRule`).

**Bản lưu:** `SAVE_VERSION` **17**, `GangState` + `cleanGang()` (chỉ nhận phe có thật, mã hàng có trong bảng, số
kẹp trần); bản lưu cũ ⇒ `gang = null`, không hỏng ván.


---

## Lượt 72 — BĂNG ĐẢNG LÀ CON DAO HAI LƯỠI

Người chơi dặn: *“làm hết cái thứ còn thiếu và đảm bảo băng đảng là con dao hai lưỡi”*. Lượt 71 cho **lưỡi thứ
nhất** (tiền, uy tín, bậc, hàng cấm). Lượt 72 làm **lưỡi thứ hai** cho nặng, và làm nốt ba thứ còn thiếu.

### Lưỡi thứ hai — cái giá (đều là số thật, trừ vào ván)
- **Khách bỏ đi vì sợ băng**: `GANG_DOWNSIDE[].fear` 6% → 36% theo bậc. Áp trong `arrivalRate()` bằng
  `fearMul(g)`. Cộng thêm +8% nếu đang bị băng cũ để mắt (`flags.gangWatch`), +6% nếu từng đi khai băng.
- **Phí chỗ đội thêm**: `rent` 0 → 60% phí gốc, cộng trong `stallRent()` (⚠ không gọi ngược `stallRent` từ
  `gangRentExtra` — đệ quy vô hạn).
- **Công an để ý**: `heat` +1 → +6 mỗi ngày, cộng ở `newDay()` kèm toast.
- **Cảnh đi làm việc** (`GANG_CUTS`): mỗi việc một cảnh kể 3 đoạn, cuối cảnh **bắt buộc chọn** — làm tới (ăn
  thêm tiền, mất tinh thần/sức khoẻ/bị để ý/uy tín phố) hay rút (mất 4 uy tín trong băng). Không lựa chọn nào
  miễn phí; test canh “cảnh nào cũng có ít nhất một cái giá”.
- **Tin xấu của băng** (`GANG_TROUBLE`): đòi phần tháng, đòi tiền chạy việc, khách quen bỏ đi, công an gọi lên
  phường. Từ ngày thứ 3 trong băng, tối đa một tin/ngày, **không hai ngày liền**. Nộp tiền hay chịu — cả hai
  đều mất.
- **Bốn cách rời băng** (`GANG_LEAVES`): trả nợ máu 400k · phản băng (mất 25 uy tín phố, bị để mắt 10 ngày) ·
  bỏ đi đổi khu 800k · làm ăn thua lỗ để bị đuổi (mất nhiều tinh thần nhất). Cách nào cũng mất hết bậc.

### Ba thứ còn thiếu của lượt 71 — đã làm
1. **Đụng độ hai phe**: `clashAt()` — từ bậc 3, bước sang địa bàn đối thủ là bị chặn (mỗi ngày một lần).
   Ba lựa chọn: nói chuyện (bậc ≥4 thì được nể, dưới thì bị khinh), quay đầu (−10 uy tín băng), đứng lại
   (mất sức khoẻ theo bậc, +12 bị để ý, −3 uy tín phố, +8 uy tín băng).
2. **Đàn em đi theo**: bậc 5 dắt 2, đại ca dắt 3. `crewCut` chia thêm 12%/đứa, `crewHeatMul` +25%/đứa bị để ý,
   `crewCover` gánh 35% tiền phạt mỗi đứa khi bị bắt — và **bị bắt là đàn em bỏ đi hết**.
3. **App “Sổ băng” trên điện thoại**: chỉ hiện khi đang theo băng (`appsOf(m, inGang)`), chỉ **đọc** — bậc, uy
   tín còn thiếu, “cái giá” (khách −%, phí chỗ, CA/ngày), kho hàng cấm. Mua hàng/nhận việc vẫn phải tới đại ca.

### Lỗi tự bắt được khi tự thử (probe)
- Menu chính của lượt 71 bị `slice(0,7)` cắt mất mục hàng cấm/phe phái khi có đủ 5 việc → tách **sổ việc** riêng.
- Cờ `flags.gangWatch` mặc định 0 so `>= g.day` thành **đúng ở ngày 1** ⇒ cộng oan 8% sợ băng.
- `stallRent` ↔ `gangRentExtra` gọi vòng ⇒ `RangeError: Maximum call stack size exceeded`.
- Cảnh đi làm hiện tên “Hùng Sẹo” như thể đại ca đi thu nợ ⇒ đổi tên người nói thành **“Chuyến đi”**.
- App Sổ băng trên máy cục gạch/nắp gập bị cắt đáy ⇒ viết ngắn, bỏ thanh tiến trình.
- Câu đụng độ in trùng tên hai băng hai lần.
