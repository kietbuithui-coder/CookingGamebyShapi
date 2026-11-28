# SỬA NHANH — bảng tra “muốn đổi cái này thì mở tệp nào”

Mục đích: lần sau người chơi báo một câu (“cái bảng giá treo sai chỗ”, “ông Bảy nói vô lý”, “quán mía tối
quá”), đọc bảng này là ra tệp + hàm, khỏi phải `rg` lại từ đầu.

Đọc kèm: `PLAYBOOK.md` §6 (cạm bẫy — **đọc trước khi sửa**, có mấy lỗi đã dính rồi) · `DESIGN.md` (luật & con số)
· `TODO.md` §0 (còn việc gì).

Quy ước cột **“Sửa ở”**: `tệp:dòng` của lần rà gần nhất — số dòng sẽ trôi, tìm theo **tên hàm** là chắc nhất.

---

## 1. Câu chữ người chơi đọc

| Muốn đổi | Sửa ở | Ghi chú |
|---|---|---|
| Câu Ông Bảy nói (đói, hết tiền, nợ, mưa, khuya…) | `src/sim/advice.ts` → `advice()` | mỗi câu phải trỏ đích **có thật** trong `data/landmarks.ts`; `tests/hobo.test.ts` canh |
| Câu Ông Bảy nói khi **có sự kiện** (lượt 70c) | `src/sim/advice.ts` → `eventRule()` | một `switch` theo mã sự kiện; trả `null` = đừng nói câu đó |
| Nhật ký phát triển trong Cài đặt | `src/data/changelog.ts` | **chỉ giữ 8 bản gần nhất**, câu là câu người chơi đọc; `tag` của bản đầu tự thành dòng “bản mới nhất” ở menu ẩn |
| Tên sự kiện / mô tả sự kiện | `src/data/world.ts` → `EVENT_LIST` | `text` là câu hiện trên màn hình khi sự kiện bắt đầu |
| Tin nhắn thoại của NPC cố định | `src/data/people.ts` → `LINES` | `LINES.own[id]` là câu riêng của 15 nhân vật |
| Nhãn nút, tiêu đề bảng | `src/ui/panels.ts` | nhánh theo `ui.modalName` |

## 2. Địa điểm & chỉ đường

| Muốn đổi | Sửa ở | Ghi chú |
|---|---|---|
| Thêm / đổi tên một chỗ trên Bản đồ | `src/data/landmarks.ts` → `LANDMARK_LIST` | cần `anchor` **có thật** trong `src/world`, hoặc `spot` trong `SPOTS` |
| Chỗ nào chỉ mở khi có sự kiện | `src/sim/advice.ts` → `ONLY_IN_EVENT` | ví dụ `cafe_bongda` chỉ mở khi `bong_da` đang chạy |
| Ghim đường đi tới một chỗ | `src/game/acts.ts` → `goPlace()` / `placeOf()` | `placeOf` dò theo **mã**, đừng đổi sang chỉ số |
| Giờ mở cửa của quán / tiệm | `src/data/hours.ts` → `PLACE_HOURS` | sạp trong chợ có giờ riêng ở `data/shops.ts` |
| Toạ độ lô đất, chỗ dựng quầy | `src/world/layout.ts` → `SPOTS`, `MIA_SPOTS` | toạ độ **chỉ nằm ở đây**, nơi khác đọc lại |

## 3. Nội dung kinh doanh

| Muốn đổi | Sửa ở |
|---|---|
| Món ăn, nguyên liệu của món, giá tham chiếu | `src/data/recipes.ts` |
| Nguyên liệu (hạn dùng, hình khối, màu) | `src/data/ingredients.ts` |
| Bảy bậc kinh doanh (giá, sức chứa, số khách) | `src/data/gear.ts` → `TIERS` |
| Luật kinh tế, giá bán, lương, phí chỗ | `src/sim/rules.ts` |
| Sự kiện của thành phố (22 cái) | `src/data/world.ts` → `EVENT_LIST` |
| Thời tiết | `src/data/world.ts` → `WEATHER` |

## 4. Hình khối 3D

| Muốn đổi | Sửa ở | Bẫy |
|---|---|---|
| Hình một nguyên liệu | `src/gfx/props.ts` → `ingModel()` | **luôn mở ảnh chụp ra soi** — đã ba lần tự tin sai (củ khoai ra “con sâu”, rồi “khúc ống”) |
| Ghế nhựa / bàn nhựa | `src/gfx/props.ts` → `plasticStool()` / `plasticTable()` | hàm dùng chung ~15 chỗ trong thành phố: sửa một chỗ là cả phố đổi |
| Dựng một quán / lô đất | `src/world/places.ts`, `src/world/mia.ts` | **`b.chunk()` / `b.frame()` phải gọi TRƯỚC `const D = …`** (lỗi “xe mía biến mất” ở lượt 70) |
| Màu / vật liệu nền | `src/gfx/mb.ts` → `MAT` | |

## 5. Mini-game khi nấu

| Muốn đổi | Sửa ở | Ghi chú |
|---|---|---|
| Luật chơi, điểm, giới hạn thời gian | `src/cook/tron.ts`, `src/cook/mia.ts`… (phần **thuần**, không Three.js) | phần này test được trong Node ⇒ sửa ở đây rồi mới nối vào hình |
| Hình trong mini-game | `src/cook/games.ts` (từng lớp `*Game`) | toạ độ là **toạ độ cục bộ của camera của mini-game**, không phải toạ độ thế giới |
| Độ dài một ca làm | `src/cook/games.ts` + hằng số trong `sim/rules.ts` | `tests/feedback.test.ts` canh ca phụ hồ phải 60–120 s thực |

## 6. Menu ẩn (bấm 8 lần “Cài đặt”, PIN `438291`)

| Muốn đổi | Sửa ở |
|---|---|
| Mục “Vừa thay đổi” (nhóm đầu) | `src/game/devPoints.ts` → `latestSteps()`, mỗi mục khai `since: 'Lượt NN'` |
| Mục đi nhanh tới địa điểm (nhóm hai) | `src/game/devPoints.ts` → `getDevSections()`, hàm `di(id, anchor, …)` |
| Đổi mã PIN | `DEV_PIN` cùng tệp + câu trong `README.md` (test canh theo hằng số) |
| Số lần bấm “Cài đặt” | `DEV_TAPS` cùng tệp |

**Luật của menu ẩn** (test canh, đừng phá): mục nào có `anchor` thì neo phải có thật trong `src/world` và **không
mục nào trùng neo**; `latestSteps()` không được gán `g.min` (đi nhanh không đổi giờ trong ngày); nhóm đầu phải có
≥ 3 mục `mx_*`; mục mới chỉ sống đúng một lượt rồi tự rơi ra khi sang bản mới.

## 7. Giao diện & bàn phím

| Muốn đổi | Sửa ở |
|---|---|
| Nút góc phải, phím tắt | `src/ui/ui.ts` |
| Bảng (Túi đồ, Quầy, Cài đặt, Góp ý…) | `src/ui/panels.ts` |
| Màn hình điện thoại | `src/ui/phoneUI.ts` |
| CSS | `src/style.css` (một tệp, ~563 dòng) |

## 8. Kiểm tra & chụp ảnh

| Việc | Lệnh |
|---|---|
| Soát kiểu | `npx tsc --noEmit` |
| Toàn bộ luật chơi | `npx vitest run` (~13 s, 722 bài) |
| Dựng bản chơi được (ghi vào `docs/`) | `npm run build:pages` — **probe đọc `docs/`, sửa nguồn mà không build là probe ra bản cũ** |
| Chụp ảnh / bấm chuột thật trong game | `cd tools/probe && node play.mjs steps/<tên>.mjs` → ảnh ở `tools/probe/out/<tên>/` |
| Soát hình học (mặt trùng phẳng, biển bị che) | `steps/audit.mjs` |

## 9. Ba thứ **không** đo được ở đây

Tai nghe/loa thật · FPS trên GPU thật · ngón tay thật trên điện thoại. Thay bằng: probe Chrome headless (bố cục,
vùng chạm ≥ 30 px), `steps/fps*.mjs` (so sánh tương đối), ảnh chụp từng khổ màn hình. **Đừng nói “đã thử trên
điện thoại”** khi chỉ chạy probe — người chơi sẽ phát hiện ra.
