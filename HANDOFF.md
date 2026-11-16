# Bàn giao công việc — Cờ vua và kiểm thử di động

> Cập nhật 2026-11-16 (trên nhánh `arena/df95efa5-cookinggamebyshapi`, gốc `e470fd5aaed4336eb2b09b2048ff860335b48b0e` của `main`).

## Các mục handoff đã hoàn tất

1. **Rà soát nhánh kết thúc ván & nút "Đi lại 1 nước" (`src/game/anim.ts`, `src/game/chess.ts`):**
   - Sửa lỗi nút **"Đi lại 1 nước"** trước đây không xóa `cookHint(...)` sau khi ván đã kết thúc (chiếu bí / pat / hòa).
   - Chống cộng điểm tinh thần (`+4 mood`) lặp lại bằng cách chiếu bí rồi đi lại (`chessWinRewarded`).
   - Đặt lại vị trí 2 quân cờ 3D đại diện khi khởi tạo lại hoặc đi lại; cache gợi ý nước đi tốt nhất theo từng tham chiếu bàn cờ.
   - Bổ sung `moveLabel` cho nhập thành (`Nhập thành cánh Vua (O-O)` / `Nhập thành cánh Hậu (O-O-O)`) và bắt tốt qua đường (`(bắt tốt qua đường)`).
2. **Chính sách hòa theo chuẩn FIDE (`src/game/chess.ts`, `src/game/anim.ts`):**
   - Tách `autoDrawReason` (thiếu quân, 75 nước, lặp 5 lần — tự động xử hòa) và `claimableDrawReason` (50 nước, lặp 3 lần — quyền yêu cầu hòa), đồng thời giữ `drawReason` tương thích ngược.
   - Khi đủ điều kiện 50 nước hoặc lặp 3 lần ở lượt người chơi, nút **"Yêu cầu hòa"** và gợi ý tương ứng sẽ hiện để người chơi chọn hòa hoặc đánh tiếp; ở lượt Ông Tư, AI tự yêu cầu hòa nếu không chiếm ưu thế rõ rệt (`evaluateBoard >= -50`) và đánh tiếp nếu đang thắng thế.
3. **Tính tương đương thế cờ khi lặp có bắt tốt qua đường bị ghim (`src/game/chess.ts`):**
   - Thêm `canLegallyEnPassant` trong `positionKey` (kiểm tra giả lập không đệ quy) để bỏ ô `enPassant` khỏi khóa lặp thế cờ nếu mọi Tốt đứng cạnh đều bị ghim khiến bắt qua đường là bất hợp lệ.
4. **Luật thiếu quân theo định nghĩa "dead position" (`src/game/chess.ts`, `tests/chess.test.ts`):**
   - Ghi chú rõ quy tắc dead position (K vs K, K+B/N vs K, chỉ còn các Tượng cùng màu ô) và bổ sung test cho cả trường hợp dead position lẫn các tổ hợp Vua/Tượng/Mã vẫn chiếu bí hợp lệ được (`K+B(trắng) vs K+B(đen)`, `K+B vs K+N`, `K+N vs K+N`, `K+N+N vs K`, `K+B+N vs K`).
5. **Màu SVG & bố cục màn dọc (`src/ui/style.css`, `src/game/anim.ts`):**
   - Thêm class phân phe cho quân bị ăn (`.chess-cap-p.w/.b`) và nút phong cấp (`.chess-promo.w`) để đồng bộ ép màu `fill`/`stroke` dưới chế độ `forced-colors`.
   - Căn giữa và xếp dọc `.chess-wrap` trong `@media (orientation: portrait)` để bàn cờ không lệch phải; ẩn `#cook .hint:empty` khi không có thông báo.

## Kiểm thử đã xác nhận

- `npm run typecheck` và `npm run build:pages` thành công: **19 test suites, 292 tests** (thêm unit test cho `autoDrawReason`/`claimableDrawReason`, lặp thế cờ khi en passant bị ghim, và các tổ hợp dead position / non-dead K-B-N).
- Probe Chromium giả lập cảm ứng (`tools/probe/steps/chess.mjs`) chạy ở cả **`844×390` (ngang)** và **`390×844` (dọc)** không lỗi console (`errors: none`): kiểm màu SVG Trắng/Đen và nút phong cấp, không đè `#cook .top` hay `#cook .btns`, e2–e4 và AI đáp Mã g8–f6, phong cấp chọn Tượng, chiếu bí rồi bấm "Đi lại 1 nước" (xóa sạch hint), và yêu cầu hòa 50 nước.

## Còn lại (cần người dùng / thiết bị thật)

- **Thử trên điện thoại thật** (đặc biệt máy từng ép hai phe thành đen / dark mode / forced-colors) và đánh giá trải nghiệm HUD màn dọc thực tế — môi trường sandbox không có thiết bị vật lý.
