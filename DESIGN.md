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

1. **`src/sim` không biết gì về đồ hoạ hay DOM.** Nó báo việc cần hiển thị qua `core/bus.ts` (toast, âm thanh, yêu cầu lưu). Nhờ vậy 128 bài kiểm thử chạy trong Node trong chưa tới 2 giây.
2. **Mọi ngẫu nhiên trong luật chơi nhận một `RNG` có hạt giống** làm tham số cuối, nên kết quả kiểm thử lặp lại được.

Vòng lặp chính (`src/main.ts`): đọc điều khiển → `advance()` cho thời gian game trôi (0,75 phút game mỗi giây thật, một ngày = 32 phút thật; khi ngủ 48 phút game mỗi giây) → cập nhật người chơi, NPC, quầy, nấu ăn, môi trường → vẽ. `dt` bị chặn ở 50 ms nên máy rất chậm thì game chạy chậm lại chứ không nhảy cóc.

## 3. Thế giới

- 3×3 ô phố, mỗi ô 46 m, đường rộng 7 m, vỉa hè 3 m; thêm dải gầm cầu vượt phía nam. 149 lô đất, 273 nút đường đi.
- 10 khu với độ giàu và độ an toàn khác nhau; lượng người theo giờ lấy từ `hourCurve(giờ, khu)`.
- 4 chỗ bán: Hẻm Công Nhân (miễn phí, ×0,85 người qua lại), Cổng Công Viên (20.000₫, ×1,05), Cổng Chợ (30.000₫, ×1,35), Phố Văn Phòng (60.000₫, ×1,25, cần xe đẩy).
- Hình học tĩnh được gộp sẵn theo từng khu thành vài lưới lớn; biển hiệu vẽ chung vào một tấm atlas. Nhân vật là khung khối hộp có khuôn mặt vẽ từ atlas.
- **Không để hai mặt trùng phẳng.** Hai mặt cùng hướng nằm đúng một mặt phẳng sẽ tranh nhau hiển thị (nhấp nháy). Vỏ nhà (`shell`) bỏ mặt trong của tường bao vì lớp lót nội thất đã phủ đúng chỗ đó (`MB.box(..., skip)` với các hằng `FACE`); thứ gì dán lên tường thì nhô ra ít nhất 1–2 cm; vật liệu biển hiệu dùng `polygonOffset` để thắng tấm nền khi nhìn từ xa. `tools/probe/steps/audit.mjs` dò lại toàn thành phố.
- **Biển hiệu phải đọc được từ dưới đường.** `Builder.signAt` ghi mọi biển đủ lớn vào `Builder.signs`. Biển cửa hàng treo ở mặt trước ban công tầng 1 (nếu có) hoặc là hộp đèn nhô khỏi mép mái; biển dọc chìa ra ngoài tầm ban công. Cây vỉa hè hỏi `signTopBehind()`: sau cây có biển thì trồng dáng thân cao (tán trên 4,8 m), biển cao quá 4,78 m thì để trống chỗ đó. Cây bị bỏ vẫn tiêu đúng số lần gọi ngẫu nhiên nên phần còn lại của thành phố không đổi.
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

## 5. Điều khiển cảm ứng

- Chạm trong vùng bên trái (42% bề ngang, trừ dải 28% trên cùng) rồi kéo = cần đi; nơi khác = vuốt nhìn.
- **Chạm nhanh** (nhấc tay trong 0,6 giây, xê dịch dưới 14 px) ở bất kỳ đâu = chạm vào vật gần điểm chạm nhất trong bán kính `max(64 px, 11% chiều cao)`. Thời lượng đo bằng mốc thời gian của chính sự kiện nên máy giật vẫn nhận đúng.
- Nút tròn vàng thực hiện hành động với vật đang ở giữa màn hình.
- Trong mini-game, mọi thao tác trỏ được chuyển thẳng cho mini-game.
- **Người chơi tự xếp nút** (`ui/layout.ts`): bốn nhóm — nút tương tác, nút chạy, hàng nút túi/sổ/bản đồ/cài đặt, các nút khi nấu ăn. Mỗi nhóm lưu độ lệch so với chỗ mặc định tính theo phần bề ngang/bề cao màn hình và một hệ số phóng 0,6–1,8, riêng cho màn ngang và màn dọc. Áp bằng `transform`, và mỗi lần áp đều ép nút nằm trọn trong màn hình. Cỡ chung của giao diện là biến CSS `--ui-scale` (0,8–1,4) nhân vào cỡ chữ gốc; mọi kích thước HUD đều tính bằng `em` nên phóng theo.

## 6. Lưu game

`localStorage`, khoá `ganhhang.save.v1` (trạng thái) và `ganhhang.settings.v1` (cài đặt). Tự lưu sau việc quan trọng, mỗi 45 giây và khi rời trang. `SAVE_VERSION = 4`; `migrate()` nạp được bản lưu cũ thiếu trường và loại bỏ nguyên liệu không còn tồn tại. Bản lưu trước v4 chưa có sổ `met` nên được coi như đã quen hết người đứng quầy. Cài đặt có thêm `ui` (cỡ giao diện và cách xếp nút); `cleanLayout()` làm sạch dữ liệu đọc lên.

## 7. Kiểm thử

- `tests/state.test.ts` — ván mới, kho, hư hỏng, nâng cấp bản lưu.
- `tests/economy.test.ts` — tiền, giá chợ, mặc cả, giá vốn, nhiên liệu, sơ chế/hoàn thiện, đồ nghề, vay nợ, phá sản.
- `tests/customers.test.ts` — quyết định mua, đánh giá, lượng khách.
- `tests/time.test.ts` — thời gian, chỉ số sinh tồn, thời tiết, sự kiện, chỗ ở, mô phỏng 45 ngày.
- `tests/data.test.ts` — tính nhất quán dữ liệu (nguyên liệu nào cũng mua được, dụng cụ nào cũng có bán, lưới đường đi liên thông, nhãn người lạ không lộ nghề hay tên…).
- `tests/settings.test.ts` — làm sạch dữ liệu bố cục nút.

Phần đồ hoạ và thao tác được chạy thử bằng các kịch bản trong `tools/probe/`: một trình chạy Puppeteer điều khiển Chrome không giao diện (WebGL phần mềm, giả lập cảm ứng), bấm chạm như người chơi, chụp màn hình để xem bằng mắt, và soát hình học cả thành phố (mặt trùng phẳng, biển hiệu bị che). Danh sách cụ thể những gì đã và chưa chạy thử nằm trong README.

## 8. Việc còn dang dở

Người chơi đã thử bản đầu và gửi danh sách góp ý; việc được chia thành ba lượt. **Lượt 1 đã xong** (tường nhấp nháy, biển hiệu bị che, tên và nghề của người lạ, tự xếp nút). Còn lại, theo thứ tự sẽ làm:

**Lượt 2 — đường phố sống động hơn**

1. Một ít NPC thô lỗ, tỉ lệ thấp: ném giấy vào người chơi, khạc nhổ khi bị xin tiền, chửi đuổi.
2. Tên người: thêm tên đẹp và tên kiểu "teen", biệt danh trêu đùa — hiện ra khi đã làm quen.
3. NPC chạy xe trên đường.
4. Chim bay và tiếng chim, thỉnh thoảng và nho nhỏ.
5. Nhân vật phụ có tên, tính cách, câu chuyện riêng.
6. Các điểm nhỏ: góc hip hop, quán trà đá vỉa hè, chỗ làm thêm.

**Lượt 3 — nội dung còn thiếu so với bản mô tả đầy đủ**

1. Món ăn và nguyên liệu: tra cứu các món phổ biến ở Việt Nam, bổ sung cho đủ 60 món (đang 26).
2. Chỗ ở: thêm 3 kiểu (đang 5/8).
3. Mở sạp cố định (bậc 3) — mô hình, sức chứa, hàng chờ đã có; còn thiếu bước chọn chỗ đặt khi mua, phí chỗ tính tự động mỗi ngày, và rà lại các nhánh `tier < 3` — rồi tới quán ăn, nhà hàng.
4. Hệ thống băng nhóm, nhân viên phụ bán.

**Việc nền chưa làm**

- Đo trên điện thoại thật: người chơi báo máy của họ chạy trên 50 khung hình/giây, nhưng chưa rõ đó là máy nào. Nếu máy yếu chạy chậm: gộp các khối cơ thể NPC thành một lưới, dùng instancing cho đồ vật lặp lại, bỏ sương mù theo điểm ảnh ở mức thấp, thêm LOD cho khu ở xa.
- Nghe thử và cân chỉnh âm thanh.
- Cân bằng nhịp độ qua chơi thử: tốc độ kiếm vốn ngày đầu, lượng khách lúc uy tín thấp, độ khó các mini-game.
- Kỹ thuật: tách gói JavaScript (hiện một tệp khoảng 930 kB, nén còn 280 kB), service worker để chơi ngoại tuyến, nội thất cửa hàng chi tiết hơn.

Lỗi nhỏ đã biết: dòng "Dụng cụ" và "Sơ chế" trong Sổ tay còn thừa dấu "·" ở cuối; ở màn dọc HUD chật (game khuyên xoay ngang).
