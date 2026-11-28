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

## 3b. Băng đảng (lượt 71)

| Muốn đổi | Sửa ở | Ghi chú |
|---|---|---|
| Hai băng, đại ca, địa bàn, tiền lễ vào băng, phe đối đầu | `src/data/gang.ts` → `GANGS` | thêm băng thì phải có **nhân vật trong `data/people.ts` → `FIXED`** và **một neo** trong `src/world` |
| Sáu bậc, mốc uy tín, phần ăn chia, quyền lợi mỗi bậc | `src/data/gang.ts` → `GANG_RANKS` | bậc là **do đại ca công nhận**, lưu ở `g.gang.tier` — đổi mốc uy tín không tự nhảy bậc |
| Bốn món hàng cấm: giá mua/bán, kg, hệ số phạt, giờ tù, bậc tối thiểu | `src/data/gang.ts` → `CONTRABAND` | bị bắt = `sell × mul` + giờ tù; **test canh “bắt một chuyến pháo lỗ hơn ba chuyến giao hàng”** |
| Năm việc làm: ca/ngày, tiền công, heat, uy tín, bậc tối thiểu, giờ được làm | `src/data/gang.ts` → `GANG_JOBS` | `mins` là phút trong game; `boc` chỉ 3–9 giờ, `thu` chỉ 9–19 giờ (viết trong `sim/gang.ts` → `jobWhy`) |
| Luật: vào/ra băng, làm việc, mua–bán, thăng chức, án phạt, tiền bảo kê | `src/sim/gang.ts` | phần **thuần**, `tests/gang.test.ts` canh |
| Câu thoại của đại ca / màn hình chi tiết băng / phe phái / sổ hàng cấm | `src/game/gangTalk.ts` | `gangMenu`, `detailScreen`, `rivalScreen`, `contrabandMenu` |
| Chỗ bị khám hàng cấm (hộp thoại phạt nặng) | `src/game/acts.ts` → `bustedForContraband()` | vào từ `caught()` khi `bustFine > 0`; xác suất ở `sim/police.ts` → `contrabandRisk`/`contrabandSweep` |
| Dữ liệu băng trong bản lưu | `src/sim/state.ts` → `GangState`, `cleanGang` | `SAVE_VERSION` = **17**; bản lưu cũ tự thành “chưa theo băng” |
| Ba sự kiện băng đảng | `src/data/world.ts` → `EVENT_LIST` (`bang_goi`, `bang_doi`, `bang_dap`) + `src/sim/advice.ts` | điều kiện `need: 'gang'` / `'rival'` ở `sim/rules.ts` → `eligible` |

## 3c. Con dao hai lưỡi của băng (lượt 72)

| Muốn đổi | Sửa ở | Ghi chú |
|---|---|---|
| Mức **khách bỏ đi / phí chỗ / công an để ý** theo từng bậc | `src/data/gang.ts` → `GANG_DOWNSIDE` | ba con số trừ thẳng vào doanh thu; `tests/gang.test.ts` canh bậc sau phải nặng hơn bậc trước |
| Chỗ khách bị trừ trong công thức khách | `src/sim/rules.ts` → `arrivalRate()` (`gangFearMul`) | **đừng** cộng ở `stallAppeal` — nơi đó còn dùng cho bảng xem trước |
| Phí chỗ đội thêm | `src/sim/rules.ts` → `stallRent()` + `src/sim/gang.ts` → `gangRentExtra()` | ⚠ `gangRentExtra` **không được gọi lại `stallRent`** (đệ quy vô hạn — đã dính một lần) |
| Mức bị để ý cộng mỗi ngày | `src/sim/rules.ts` → `newDay()` (`dailyGangHeat`) | có toast nói rõ số vừa cộng |
| Cảnh đi làm việc (chữ kể + cái giá) | `src/data/gang.ts` → `GANG_CUTS` | mỗi cảnh phải có ít nhất một cái giá; `resolveCut()` trong `sim/gang.ts` áp số |
| Bốn cách rời băng | `src/data/gang.ts` → `GANG_LEAVES` | cách nào cũng `tierLoss > 0` (test canh) |
| Tin xấu của băng (đòi phần, khách sợ, công an gọi) | `src/data/gang.ts` → `GANG_TROUBLE` + `sim/gang.ts` → `troubleToday()` | cờ `g.gang.trouble` do lớp luật đặt, `acts.update` mở hộp thoại |
| Đụng độ băng đối thủ | `src/sim/gang.ts` → `clashAt()/resolveClash()` + `src/game/gangTalk.ts` → `clashScreen()` | chỉ từ bậc 3; mỗi ngày một lần |
| Đàn em đi theo (bậc 5–6) | `src/sim/gang.ts` → `maxCrew/crewCut/crewCover` | dắt theo: ăn ít hơn, bị để ý hơn, bị bắt thì gánh bớt |
| App **Sổ băng** trên điện thoại | `src/data/phone.ts` (`appsOf(m, inGang)`) + `src/ui/phoneUI.ts` → `gangBody()` | chỉ hiện khi `g.gang`; **màn máy chỉ ~16 em** — viết ngắn, đừng thêm thanh/dòng dài |

## 3d. Đe doạ người lạ · đánh nhau · giao diện Android (lượt 73)

| Muốn đổi | Sửa ở | Ghi chú / bẫy |
|---|---|---|
| Ba mức **đe doạ** (tiền, đồ quý, mức bị để ý, xác suất bị báo) | `src/data/gang.ts` → `THREAT_KINDS` | `minTier` 4 / 5 / 6; test canh mức sau phải đắt và rủi ro hơn mức trước |
| Điều kiện được đe doạ (bậc 4+) | `src/sim/gang.ts` → `canThreat()` | **chỉ một chỗ này** — `acts.threat()` và ngăn kéo Android đều đọc nó |
| Luật đe doạ (tiền, heat, bị báo, phạt) | `src/sim/gang.ts` → `threaten()` | trả số liệu thật để câu thoại nói đúng; đừng tự tính lại trong `acts.ts` |
| Tiền phạt / giờ tù khi bị báo | `src/data/gang.ts` → `threatFine()`, `threatJail()` | cố ý **nặng hơn án hàng cấm**; `tests/danhnhau73.test.ts` canh |
| Khách sợ vì đã đe doạ | `src/sim/gang.ts` → `threatFear()` (cộng trong `fearRate`) | trần 12 % |
| Số lần đã đe (lưu vào bản lưu) | `src/sim/state.ts` → `GangState.threats`, `cleanGang`, `SAVE_VERSION` = **19** | thiếu trường ⇒ 0, không NaN |
| Nút ĐE DOẠ | `src/ui/ui.ts` → ngăn kéo (`ANDROID_GRID`, lọc ở `androidGrid()`) + phím **T** | chỉ hiện từ bậc 4; ẩn hẳn dưới bậc đó chứ không chỉ mờ đi |
| Bốn kiểu **đánh nhau** (số đối thủ, máu, tiền, dàn xếp) | `src/data/gang.ts` → `FIGHTS` | `settle: 0` = không dàn xếp được (chỉ kiểu đòi nợ) |
| Khi nào mở ván đánh | `src/sim/gang.ts` → `fightAt()` (nhịp hỏi 4 s ở `acts.update`, `fightT`) | một ngày một ván (`g.flags.gangFightDay`); **phải có `!ctx.anim.active`** khi mở hộp thoại khác, không là cảnh bị dẹp giữa chừng |
| Cơ hội thắng | `src/sim/gang.ts` → `fightChance()` | bậc, máu, đàn em, uy tín phố; kẹp 0,12…0,95 |
| Kết quả ba lựa chọn | `src/sim/gang.ts` → `resolveFight()` | đánh thắng / đánh thua / chạy / dàn xếp — không cửa nào miễn phí |
| Cảnh đánh 3D (ba nút, máu, camera) | `src/game/anim.ts` → `startFight()` / `fightPunch()` / `fightGuard()` / `fightBack()` | `AnimKind` = `'danh_nhau'`; khối `update` cùng tên |
| Ba dáng người mới | `src/gfx/people.ts` → `Pose` + `Rig.update()` | `block` (đỡ), `stagger` (trúng đòn), `threat` (đe doạ); thêm dáng thì phải thêm cả nhánh trong `update` |
| Mượn/trả rig người cho cảnh | `src/game/npc.ts` → `acquire()` / `release()` + `Rig.slot` | dùng hồ, **đừng `new Rig()`** mỗi ván (cấp phát hình học = giật hình trên máy yếu) |
| Giao diện Android (thanh trên cùng, ngăn kéo) | `src/ui/ui.ts` → `#topbar`, `#drawer`, `applyAndroid()`, `ANDROID_GRID` + `src/ui/style.css` → khối `#ui.android` | bật/tắt ở `Settings.android` (`src/game/ctx.ts`, mặc định bật trên điện thoại) và Cài đặt › **Giao diện** |
| Nút nào nằm trong ngăn kéo | `src/ui/ui.ts` → `ANDROID_GRID` | mỗi mục là `{ p, icon, label, tip }`; `need: 'threat' | 'phone'` để lọc theo tình trạng ván |
| Đóng ngăn kéo | `UI.closeDrawer` (gọi trong `panel()` và `setHud(false)`) | ⚠ bộ hẹn 190 ms của lần đóng **phải được huỷ khi mở lại**, không là ngăn kéo tự giấu mình |

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
| Toàn bộ luật chơi | `npx vitest run` (~15 s, 797 bài / 64 tệp) |
| Dựng bản chơi được (ghi vào `docs/`) | `npm run build:pages` — **probe đọc `docs/`, sửa nguồn mà không build là probe ra bản cũ** |
| Chụp ảnh / bấm chuột thật trong game | `cd tools/probe && node play.mjs steps/<tên>.mjs` → ảnh ở `tools/probe/out/<tên>/` |
| Soát hình học (mặt trùng phẳng, biển bị che) | `steps/audit.mjs` |

## 9. Ba thứ **không** đo được ở đây

Tai nghe/loa thật · FPS trên GPU thật · ngón tay thật trên điện thoại. Thay bằng: probe Chrome headless (bố cục,
vùng chạm ≥ 30 px), `steps/fps*.mjs` (so sánh tương đối), ảnh chụp từng khổ màn hình. **Đừng nói “đã thử trên
điện thoại”** khi chỉ chạy probe — người chơi sẽ phát hiện ra.
