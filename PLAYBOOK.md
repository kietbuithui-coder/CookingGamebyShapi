# PLAYBOOK — Gánh Hàng Đường Phố

> Cẩm nang làm việc cho agent và contributor: đọc gì trước, sửa ở đâu, giữ luật gì, kiểm bằng lệnh nào, và những cái bẫy đã biết.
> Tài liệu này **không** thay `README.md` (người chơi) / `DESIGN.md` (thiết kế & con số) / `TODO.md` (việc còn lại) / `PLAN.md` (lộ trình từng lượt).
> Mọi con số trong đây được **đo từ mã** ngày 2026-11-17 trên `main` = `ca6c3d6`; khi sửa mã làm số liệu đổi thì sửa luôn tệp này.

---

## 0. Bảng nhanh (đọc 30 giây là làm được)

| Việc | Lệnh / tệp |
|---|---|
| Cài & chạy | `npm install` → `npm run dev` (bind `0.0.0.0`, `allowedHosts: true`) |
| Kiểm tối thiểu trước khi báo xong | `npm test` → `npm run typecheck` → `npm run build` |
| Kiểm đầy đủ trước khi phát hành | `npm run build:pages` (typecheck + test + đóng gói vào `docs/`) |
| Luật chơi ở đâu | `src/sim/rules.ts` (1.088 dòng), `src/sim/state.ts` (236) |
| Dữ liệu ở đâu | `src/data/*.ts` (11 tệp, 1.232 dòng) |
| Bản đồ / toạ độ | `src/world/layout.ts` (275) |
| Quầy hàng & nấu ở world | `src/game/stall.ts` (1.403), `src/cook/*` |
| Hội thoại / menu NPC | `src/game/acts.ts` (1.124) |
| HUD / bảng | `src/ui/ui.ts` (308), `src/ui/panels.ts` (297), `src/ui/style.css` |
| Test | `tests/*.test.ts` — **26 tệp, 365 bài**, `environment: 'node'` |
| Thử giao diện thật | `tools/probe/` (34 kịch bản `.mjs` trong `steps/`, Chrome headless) |
| Bản phát hành | `docs/` — **sinh ra bởi `build:pages`, không sửa tay** |

Trạng thái đo được hôm nay: **typecheck ✅ · 322/322 test ✅ · build ✅ · build:pages ✅**.

---

## 1. Nguyên tắc làm việc

1. **Đọc trước khi sửa.** `README.md` (người chơi thấy gì) → `DESIGN.md` (luật & con số) → `TODO.md` / `PLAN.md` (đang ở đâu) → mã + test liên quan. Chạy `git status` trước, không đè thay đổi có sẵn.
2. **Mã là sự thật cuối cùng.** Tài liệu trong repo này đã từng lệch (xem §8). Khi tài liệu nói "5/7 bậc" mà `TIERS` có 7 bậc có id, tin mã. Sai thì **sửa tài liệu**, đừng sửa mã cho khớp câu chữ cũ.
3. **Ưu tiên trải nghiệm trọn vẹn.** Mỗi thay đổi phải trả lời được: người chơi thấy gì, nghe gì, biết vì sao, và bước tiếp theo là gì — kể cả khi thiếu tiền, sai giờ, hết đồ, đóng panel giữa chừng, tải lại trang.
4. **Thay đổi nhỏ, đảo ngược được.** Sửa một lỗi thì đừng refactor cả hệ. Không thêm dependency (`three`, `@fontsource/*` là đủ; dev: `vite`, `vitest`, `typescript`).
5. **Không đoán.** Không tự dựng id nguyên liệu, công thức, luật giá, toạ độ hay tên người. `rg` định nghĩa → đọc call site → sửa.
6. **Báo cáo trung thực.** Nêu tệp đã sửa, hành vi đổi, lệnh đã chạy + kết quả, và **cái chưa kiểm được**. Không nói "đã thử trên điện thoại" khi chỉ chạy Node/probe.
7. **Không tự commit/push/đổi nhánh** trừ khi người dùng yêu cầu.

---

## 2. Bản đồ mã nguồn (52 tệp `.ts`, ~14.772 dòng)

```
src/
├── sim/        1.837 dòng — LUẬT THUẦN, không DOM, không three
│   ├── rules.ts     kinh tế, khách, đánh giá, sự kiện, nợ, bậc quầy, đặt bàn, phụ bếp
│   ├── state.ts     kiểu Game/Stack/Stall, newGame, migrate, kho đồ, hư hỏng
│   ├── phone.ts     pin, sổ thu chi, tin nhắn      life.ts  lịch sinh hoạt theo giờ
│   ├── police.ts    mức bị để ý, tạm giữ            impact.ts va chạm xe
│   ├── net.ts       quán net                        race.ts   đua xe đạp
├── data/       1.232 dòng — dữ liệu tĩnh: ingredients(75), recipes(60), shops(12),
│               gear(36 món + 7 bậc + 8 chỗ ở), people(43 nhân vật + 11 khách quen),
│               world(8 thời tiết, 22 sự kiện), phone, looks, fun, expr, cars
├── world/      2.462 dòng — layout.ts (lô đất, SPOTS, NAV), city.ts, build.ts, places.ts, side.ts, env.ts, birds.ts
├── gfx/          930 dòng — mb.ts (gộp lưới), tex.ts (hoạ tiết canvas), props.ts, people.ts
├── game/       6.534 dòng — anim.ts(1.567), stall.ts(1.403), acts.ts(1.124), npc.ts(706),
│               chess.ts(537), devPoints.ts, player.ts, interact.ts, traffic.ts, input.ts, who.ts, race.ts, ctx.ts
├── cook/        609 dòng — cook.ts (điều phối) + games.ts (5 mini-game)
├── ui/          709 dòng + 289 dòng CSS — ui.ts (HUD), panels.ts (bảng), layout.ts (tự xếp nút)
├── audio/       196 dòng — tổng hợp Web Audio, không tệp âm thanh
└── main.ts      154 dòng — vòng lặp chính, khởi động
```

Luồng chuẩn khi thêm/sửa một tính năng:

```
xác định luật + dữ liệu (sim/data)
      → nối hành động & giao diện (game/acts, game/interact, ui/)
      → dựng hình nếu cần (world/, gfx/)
      → test luật (tests/)
      → probe giao diện nếu đổi UI/hình học (tools/probe/steps/)
      → cập nhật README (nếu người chơi thấy) + DESIGN (số liệu) + TODO/PLAN
      → npm test && npm run typecheck && npm run build
```

### Mấy tệp "nặng" cần cẩn thận
- `src/game/anim.ts` (1.567 dòng) gánh cả hoạt ảnh NPC lẫn bàn cờ. Sửa ở đây phải chạy thêm `tests/chess.test.ts`.
- `src/game/stall.ts` (1.403) là nơi khách, phụ việc, phụ bếp, bàn ghế cùng sống. Side effect theo frame rất dễ sinh ở đây (xem §6.3).
- `src/game/acts.ts` (1.124) chứa toàn bộ menu hội thoại; nút nào cũng phải có đường thoát ("Thôi…", "Để con tính lại").

---

## 3. Hợp đồng kiến trúc (đừng phá)

1. **`src/sim` không được biết DOM/three.** Nó chỉ báo việc ra ngoài qua `src/core/bus.ts` (`bus.emit('toast' | 'sfx' | 'cash' | 'save' | 'day' | 'ui' | 'quest' | 'bankrupt')`, tiện dụng: `toast()`, `sfx()`). Đây là lý do 322 test chạy trong Node ~7 giây.
2. **Mọi ngẫu nhiên trong luật nhận `RNG` có hạt giống** làm tham số cuối (`advance(g, dm, act, R)`, `decideGroup(g, p, size, fem, R)`, `newDay(g, R)`). Test phải truyền RNG cố định, không dùng `Math.random()`.
3. **UI không tự tính luật kinh tế.** Giá, giá vốn, lượng khách, hư hỏng, phí chỗ đều ở `sim/rules.ts`; UI chỉ hiển thị và gọi hàm.
4. **`src/world/layout.ts` là nguồn chuẩn của toạ độ.** `LOTS`, `SPOTS`, `PLACES`, `NAV`, `DISTRICT`, `MAP`. Thêm địa điểm phải có lô đất + neo `v_<id>` + nút NAV liên thông (có test lo việc này, xem §5).
5. **Save là hợp đồng với người chơi.** Xem §7 — không đổi cấu trúc mà không tăng `SAVE_VERSION` và viết nhánh `migrate()`.

### Hằng số gốc phải nhớ
| Hằng | Giá trị | Ở đâu |
|---|---|---|
| `STAT_MAX` | 125 | `sim/state.ts:23` |
| `SAVE_VERSION` | 13 | `sim/state.ts:10` |
| `MAP` | x −96…96, z −96…108 | `world/layout.ts:8` |
| `BLOCK / DEPTH / SIDEWALK / ROAD_HALF` | 46 / 11 / 3 / 3.5 | `world/layout.ts:5` |
| Khoá localStorage | `ganhhang.save.v1`, `ganhhang.settings.v1` | `game/ctx.ts:59` |
| `DEV_BUILD_TAG` | chuỗi phiên bản + danh sách mục trong menu ẩn (bấm 7 lần chữ “Cài đặt”) | `game/devPoints.ts` |

### Số liệu nội dung (kiểm bằng `tests/data.test.ts`)
60 công thức · 75 nguyên liệu · 12 nơi bán · 37 món đồ nghề (7 bậc quầy + 5 dụng cụ + 3 bếp + 2 kho + 14 tiện nghi + 2 đồ mang + 1 đồ nhà + 3 điện thoại) · 8 kiểu chỗ ở · 8 bậc quầy (`TIERS[0..7]`, `FUTURE_TIERS = []`) · 6 chỗ bán (`SPOTS`) · 3 chỗ mở chi nhánh (`BRANCH_SITES`) · 16 nhóm người · 43 nhân vật cố định · 11 khách quen · 5 người phụ việc · 3 phụ bếp · 3 người trông coi chi nhánh (`KEEPER_POOL`) · 22 sự kiện · 8 thời tiết.

**Bậc quầy hiện có** (giá → `TIERS`): Gánh 120.000₫ → Xe đẩy 2.400.000₫ → Sạp cố định 9.000.000₫ → Quán ăn nhỏ 24.000.000₫ → Quán có chỗ ngồi 58.000.000₫ → Nhà hàng bình dân 145.000.000₫ → **Chuỗi cửa hàng 320.000.000₫** (mở chi nhánh thứ hai ở `BRANCH_SITES`, thuê người trông coi). Nhánh kinh doanh đã đủ 7/7 bậc, `FUTURE_TIERS` rỗng.

---

## 4. Quy trình cho mỗi yêu cầu

### 4.1 Trước khi sửa
- **Dịch yêu cầu thành kết quả người chơi thấy** (một câu). Nếu không viết được câu đó thì chưa hiểu yêu cầu.
- `rg` điểm vào: `rg "tênHàm|tênTrường" src tests`, đọc định nghĩa + mọi call site trước khi sửa chữ ký.
- Liệt kê **tình huống biên** theo danh sách dưới — đây là checklist bắt buộc:
  - tiền vừa đủ / thiếu 1.000₫ / âm (không được âm ngoài cơ chế nợ)
  - kho đầy, balo quá nặng, nguyên liệu hết hạn hoặc hỏng
  - ngoài giờ mở cửa, quán đóng, sự kiện đang bật/tắt
  - bấm lặp liên tiếp (double-tap), giữ nút, mở lại panel
  - rời khu vực / đi xa / ngất giữa chừng
  - F5 giữa thao tác, save cũ (v11, v12), save hỏng
  - màn ngang 844×390 **và** màn dọc 390×844, cảm ứng **và** bàn phím
- Mơ hồ thì **chọn phương án nhỏ nhất và ghi rõ giả định**; chỉ hỏi khi quyết định đổi thiết kế hoặc không thể làm đúng.

### 4.2 Trong khi sửa
- Luật vào `sim`, dữ liệu vào `data`, hiệu ứng vào `game|ui|world|gfx`. Không nhét luật kinh tế vào UI.
- Bảo vệ invariant (§6.1).
- Mọi thứ đụng tiền / thời gian / uy tín / máu / hàng hoá / bản lưu ⇒ **phải có phản hồi cho người chơi** (toast, sfx, số bay, thoại) **và test**.
- Không tạo side effect lặp: kiểm tra lại mỗi lần frame update / mở panel / retry tương tác.
- Hình học: scale, hướng mặt, mặt trùng phẳng (nhấp nháy), vật cản, điểm neo, biển hiệu bị che, hiệu năng. Dùng tiện ích dựng có sẵn trong `gfx/mb.ts`, `gfx/props.ts` — đừng tạo `Mesh` rời rạc trong vòng lặp.
- Giao diện: chạm được ≥ 44 px, không che HUD quan trọng, không tràn khi chữ to 160%, `Esc`/nút đóng luôn nhất quán.

### 4.3 Sau khi sửa
```bash
npm test            # 365 bài hiện tại; đếm lại nếu bạn thêm bài
npm run typecheck
npm run build
git diff --check    # lỗi khoảng trắng / xung đột sót
git status --short  # không để rác: dist/ và node_modules/ đã .gitignore
```
Trước khi phát hành hoặc khi đổi UI/hình học: `npm run build:pages` (sinh lại `docs/`), rồi commit **cả** `docs/`.
Nếu lệnh không chạy được (thiếu dep, sandbox không mạng) ⇒ ghi **chính xác** lý do; **không** tuyên bố pass.

### 4.4 Khi nào dùng probe
`tools/probe/` chạy game thật trong Chrome headless (WebGL phần mềm, giả lập cảm ứng). Bắt buộc khi: thêm/đổi màn hình, nút, bố cục; đổi mô hình 3D; đổi luồng mở bán / nấu / khách.
```bash
npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
cd tools/probe && npm install          # tải Chromium ~60 MB, một lần
node play.mjs steps/flow.mjs           # W=390 H=844 cho màn dọc
node play.mjs steps/audit.mjs          # soát mặt trùng phẳng + biển bị che
```
Máy không GPU chỉ đạt 2–14 FPS và thời gian trong game trôi tối đa 0,05 s/frame ⇒ dùng `waitFor`, **không** `wait` dài; gọi `__fast(true)` khi chỉ cần luật chơi chạy. Biến gỡ lỗi chỉ bật khi URL có `?debug` (`__game`, `__R`, `__S`, `__give`, `__cam`).
Ảnh chụp **không thay thế** test luật; probe phải báo `errors: none` mới tính là đạt.

---

## 5. Tiêu chuẩn kiểm thử

- **Mỗi sửa lỗi có một test tái hiện lỗi** (viết trước hoặc cùng lúc, không viết sau cho có).
- Mỗi tính năng mới test: chuẩn · ranh giới (0, đúng ngưỡng, vượt ngưỡng) · thiếu tiền/thiếu đồ · đầu vào sai/save hỏng · tương thích save cũ · RNG cố định.
- Test khẳng định **kết quả nhìn từ gameplay** (tiền, số khách, số ghế, cờ trong `Game.flags`), không khẳng định chi tiết cài đặt.
- Dùng `tests/helpers.ts`: `fresh(seed)` · `withStall(seed)` · `sellingTea(seed)` · `give(g, id, n)` · `persona(arch, budget)` · `IDLE`. Đừng tự dựng `Game` bằng tay.
- Test mô phỏng nhiều ngày: `tests/time.test.ts` đã có bài 45 ngày (không NaN, tiền không âm). Thêm bài dài thì giữ dưới ~2 giây.
- Viết tiếng Việt, mô tả hành vi; tên file theo hệ (`nhahang.test.ts`, `quanngoi.test.ts`…).

Những test "gác cổng" dễ bị quên:
| Test | Gác điều gì |
|---|---|
| `data.test.ts` › *lưới đường đi của NPC liên thông* | `SPOTS` nào cũng tới được từ gầm cầu |
| `data.test.ts` › *quanh mỗi chỗ bán luôn có đủ nút đường đi* | ≥6 nút cách quầy 18–38 m ⇒ khách/sự kiện còn spawn được |
| `data.test.ts` › *dụng cụ cần cho mỗi món đều mua được* | không có công thức dùng đồ nghề không bán |
| `data.test.ts` › *thông số kinh tế hợp lệ* | `ref % 1000 === 0`, `meal` đủ 4 buổi |
| `nhahang.test.ts` › *FUTURE_TIERS* | danh sách bậc chưa làm khớp với việc đã làm |
| `time.test.ts` › *45 ngày* | bất biến "tiền không âm, không NaN" |
| `settings.test.ts` | `cleanLayout()` chặn dữ liệu bố cục nút rác |

---

## 6. Bất biến & cạm bẫy (phần đáng giá nhất)

### 6.1 Bất biến phải giữ
- **Tiền**: `g.cash ≥ 0` ngoài cơ chế nợ có chủ đích (`g.debts`, `g.credit`). Mọi khoản trừ đi qua `R.spend(g, n, key)` — nó **trả `false`** khi thiếu, nên phải kiểm giá trị trả về. Mọi khoản cộng qua `R.earn(g, n, key)` để sổ `led` và `tot` khớp.
- **Sổ sách**: `spend` ghi vào `g.led[key]` cùng lúc với `g.cash`; đừng `g.cash -= n` trực tiếp (trừ vài chỗ UI cố ý như gửi tiết kiệm có `bus.emit('cash')` kèm theo — đọc kỹ trước khi bắt chước).
- **Chỉ số**: luôn trong `0…STAT_MAX(125)`, đi qua `R.consume(g, {h,t,m,hp,e,hy})` để không lệch clamp.
- **Chỗ ngồi**: `seatCount(g)` = 0/4/6/8 theo bậc; `dineIn(g)` = bậc ≥ 5; `isRestaurant(g)` = bậc ≥ 6. Đừng so sánh `tier === 5` rải rác trong mã — dùng ba hàm này.
- **Nhân sự**: `maxHelpers`/`maxSous` = 2 khi bậc 6; slot 2 (`help2`, `sous2`) chỉ có hiệu lực khi `isRestaurant(g)`.
- **Giờ & địa điểm**: giờ luôn qua `hourOf(g)` / `absMin(g)`; đóng/mở cửa qua `placeOpen(id)`; không tự so `g.min`.
- **Kho đồ**: `addStack` / `takeFrom` / `moveStack` / `spoil` / `purge` trong `sim/state.ts`; `takeFrom` trả `null` khi không đủ — luôn kiểm.
- **Save**: sau khi đổi cấu trúc, dữ liệu đọc lên phải qua `migrate()` + hàm làm sạch (`cleanLook`, `cleanLayout`) và bị **kẹp** lại từng trường.

### 6.2 Những chỗ đã từng sai (đừng tái phạm)
- Trừ tiền rồi mới kiểm điều kiện (vá xe khi không có xe) ⇒ **kiểm trước, trừ sau**.
- Cộng thưởng lặp khi bấm lại nút sau khi ván đã kết thúc (cờ vua) ⇒ dùng cờ "đã thưởng" trong `g.flags`.
- Gợi ý/hint còn sót sau khi trạng thái đã đổi (chiếu bí rồi "Đi lại 1 nước") ⇒ xoá hint cùng lúc đổi trạng thái.
- Neo nhân vật đặt cao hơn mặt ghế (người bay lơ lửng) ⇒ neo theo tư thế, không theo đồ vật.
- Biển hiệu cắm lọt tường / bị cây che ⇒ chạy `steps/audit.mjs` sau khi thêm biển.
- Hai mặt phẳng trùng nhau cùng hướng khác màu ⇒ nhấp nháy; lệch ≥ 2 mm hoặc bỏ một mặt.

### 6.3 Chống side effect lặp
- Trong `update(dt)` chỉ **tính**, đừng **phát** (toast, sfx, earn). Phát khi chuyển trạng thái.
- Panel mở lại nhiều lần ⇒ dựng lại nội dung từ `g`, không giữ biến đếm trong closure UI.
- Hành động "retry" (nấu lại, mặc cả lại) phải tốn tài nguyên mỗi lần; nếu không, người chơi spam được.
- Mọi thứ phát sinh theo frame phải có `Ref`/`key` (ví dụ `g.stall.refresh()` khi đổi `stockKey`) để không rebuild mỗi frame.

### 6.4 Đo được gì, không đo được gì (trung thực)
| Đo được | Không đo được ở sandbox |
|---|---|
| Luật chơi (322 test), typecheck, build, bundle size | FPS thật trên GPU (máy không có GPU; README đang ghi 1,23 MB JS / ~384 kB gzip) |
| Luồng UI trong Chrome headless ở 844×390 và 390×844 | Cảm giác chạm trên điện thoại thật, tai nghe/loa thật |
| Hình học: mặt trùng phẳng, biển bị che (`audit.mjs`) | Chơi trọn nhiều giờ liên tục, trộm đêm, chuỗi mục tiêu theo trình tự thật |

---

## 7. Save & di trú

- Khoá: `ganhhang.save.v1` (trạng thái) · `ganhhang.settings.v1` (cài đặt). Tự lưu sau việc quan trọng, mỗi 45 giây, khi rời trang.
- `SAVE_VERSION = 13`. Bản lưu hiện tại đã đi qua các mốc: v4 sổ `met` · v5 bệnh viện + `lostBag` · v6 công an · v7 điện thoại · v8 quán net · v9 đua xe · v10 người phụ việc + `firstSale` · v11 ngoại hình (`look`) · v12 nhà hàng (`sous`, `bookings`, `bookSeq`) · v13 slot nhân sự thứ 2 (`help2`, `sous2`).
- **Quy tắc**: cần đổi cấu trúc ⇒ tăng `SAVE_VERSION` + thêm nhánh `if ((raw.v ?? 0) < N)` trong `migrate()`, chịu được **dữ liệu cũ thiếu trường** *và* **dữ liệu hỏng** (kiểu sai, `null`, mảng không phải mảng). Không đụng tiến trình không liên quan (tiền, ngày, quan hệ, công thức).
- Bản lưu hỏng nặng ⇒ `migrate()` trả `null` và game mở ván mới; đừng để crash trắng màn hình.
- Sửa `migrate()` ⇒ thêm test kiểu `bản lưu v11 lên v13` trong `tests/nhahang.test.ts` / `look.test.ts`.

---

## 8. Tài liệu nào nói gì

| Tệp | Vai trò | Chú ý |
|---|---|---|
| `README.md` | người chơi: cách chơi, điều khiển, đã có gì, đã kiểm gì | số liệu đã khớp mã (§9); thêm tính năng người chơi thấy ⇒ sửa ở đây |
| `DESIGN.md` | kiến trúc, luật & con số cân bằng, save, kiểm thử | mục 4.26 là bậc 6; mục 6 ghi `SAVE_VERSION = 13` |
| `TODO.md` | việc **còn** thiếu tại thời điểm viết | chỉ giữ việc chưa xong; xoá mục khi làm xong thay vì đánh dấu ✅ |
| `PLAN.md` | lộ trình theo lượt, mỗi lượt có kết quả & test | tới lượt 17 (bậc 6); mỗi lượt mới thêm một mục `## Lượt N` |
| `HANDOFF.md` | bàn giao một lượt cụ thể (cờ vua, 292 test) | là ảnh chụp lịch sử, **không** phải trạng thái hiện tại |
| `PLAYBOOK.md` | tệp này: quy trình + bản đồ + bất biến | cập nhật khi số liệu nền đổi |

Quy ước cập nhật: `README` = cái người chơi thấy & lệnh chạy **đã xác nhận** · `DESIGN` = số liệu & luật · `TODO` = chỉ việc còn lại (xoá mục đã xong) · `PLAN` = theo lượt · hai tài liệu bất đồng ⇒ xác minh bằng mã/test rồi sửa tài liệu sai, **không chép mù số cũ**.

---

## 9. Nợ tài liệu — đã trả (2026-11-17)

Trước đây tài liệu lệch mã khá nhiều; nay đã sửa xong cả 8 chỗ, các con số dưới là **đã khớp** với mã:

1. `README.md` – **7/7 bậc** kinh doanh chơi được (bậc 6 `nhahang`, bậc 7 `chuoi`) + giao người làm đi chợ.
2. `README.md` – số bài kiểm thử luôn theo mã: nay **365 bài / 26 tệp** (kèm 17 bài `tests/nhahang.test.ts`, 25 bài `tests/chuoi.test.ts`, 17 bài `tests/dicho.test.ts`).
3. `README.md` – **43** nhân vật cố định (trước ghi 34 và 38 ở hai chỗ).
4. `README.md` – số món đồ nghề / chỗ bán luôn theo mã: nay **37** món, **6** chỗ bán (4 chỗ thường + 2 mặt bằng) và **3** chỗ mở chi nhánh.
5. `TODO.md` – đầu tệp cập nhật theo mã: 7/7 bậc · 75 nguyên liệu · 12 nơi bán · 37 đồ nghề · 43 nhân vật · 365/26; thêm mục
   "bậc 6 chưa có probe giao diện"; tách khỏi mâu thuẫn "bậc 6 đã xong" ở bảng bên dưới.
6. `DESIGN.md` – 365 bài; `SAVE_VERSION = 15` kèm nhánh v12–v15; 144 lô đất / 268 nút đường đi; 6 chỗ bán;
   `FUTURE_TIERS` rỗng.
7. `DESIGN.md` – thêm **mục 4.26** cho bậc 6 (nhà hàng bình dân, đặt bàn trước, phụ bếp, khách đoàn) + dòng mô tả
   `tests/nhahang.test.ts` trong mục 7.
8. `PLAN.md` – thêm **lượt 17** (bậc 6) và **lượt 18** (bậc 7), sửa ghi chú "278 bài / 18 tệp" thành số hiện tại.

**Quy tắc menu ẩn (`src/game/devPoints.ts`):** mỗi lượt làm xong thì **thay** nhóm “Mới nhất — …” bằng mục test của
tính năng vừa làm (3–9 mục: dựng sẵn, tới chỗ, mở bảng, tua thời gian, dọn), **xoá** mục test của lượt cũ, và chỉ giữ
lại nhóm thứ hai **“Địa điểm — tele nhanh”**. Cập nhật `DEV_BUILD_TAG`. `tests/devpoints.test.ts` chặn tái phạm: đúng
2 nhóm, nhóm 2 toàn `tp_*`, và một danh sách id cũ (setup/test của lượt trước) không được xuất hiện lại. Chạy
`tools/probe/steps/devmenu.mjs` (bấm lần lượt **mọi** mục) sau mỗi lần sửa menu ẩn.

**Cách giữ cho khỏi lệch lại:** đổi nội dung ⇒ sửa luôn con số ở §0/§3 của tệp này; đổi bậc quầy ⇒ `TIERS` +
`GEAR` + `README` §"Đã có" + `TODO` §1 + `DESIGN` (một mục 4.x) + `PLAN` (một lượt). Chạy `rg "278|292|5/7|34 nhân vật|22 món đồ nghề" *.md`
trước khi push là đủ bắt các số cũ quay lại.

## 10. Mẫu báo cáo khi xong việc

```
(1) Đã làm: <một câu nói theo góc người chơi thấy>
(2) Tệp chính: src/... , tests/... , tài liệu đã cập nhật
(3) Kiểm tra: npm test → 322/322 · npm run typecheck → sạch · npm run build → OK
    [nếu có] node play.mjs steps/<x>.mjs → errors: none, ảnh tools/probe/out/<x>.png
(4) Chưa kiểm được: <FPS máy thật / âm thanh / màn dọc trên máy thật / …>
```

Ngắn, cụ thể, không tô hồng. Nếu một lệnh fail thì **nói fail** kèm thông điệp lỗi.
