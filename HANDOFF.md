# Bàn giao công việc — Cờ vua và kiểm thử di động

> Cập nhật 2026-11-16. Tài liệu này dành cho agent tiếp quản công việc trên branch đang hoạt động; đọc `git status` và diff trước khi sửa tiếp.

## Trạng thái nhánh

- Branch hiện tại: `arena/9b732956-cookinggamebyshapi`.
- Điểm gốc: commit `1d2579da71396ba5eadeaa86f8342fb4a4d905cd` (merge PR #26).
- Các chỉnh sửa được liệt kê dưới đây **chưa commit/chưa merge**; không được giả định rằng merge PR #26 đã chứa chúng.
- Preview Vite chạy ở cổng `5180`; kiểm tra process/port trước khi chạy server thứ hai.

## Mục tiêu đang làm

Rà soát luật cờ vua, hoàn thiện luồng phong cấp và màu quân trên thiết bị di động; kiểm thử kỹ và ghi rõ giới hạn.

### Mã đã chỉnh

- `src/game/chess.ts`: state metadata bàn cờ; nhập thành và cập nhật quyền nhập thành; bắt tốt qua đường; phong cấp Hậu/Xe/Tượng/Mã; cấm bắt Vua và lọc nước đi tự chiếu; đếm nửa nước/nhận diện lặp thế; hòa thiếu quân, 50 nước, 3 lần lặp, 75 nước, 5 lần lặp. Khóa lặp thế xét màu tới lượt, quyền nhập thành và ô bắt tốt qua đường khi có Tốt bên tới lượt có thể bắt theo hình học.
- `src/game/anim.ts`: board khởi tạo có metadata; chọn quân phong cấp; thông báo kết quả hòa/chiếu bí; áp dụng hòa sau khi xác nhận bên tới lượt còn nước hợp lệ.
- `src/ui/style.css`: class theo phe và ép màu SVG để tránh forced-colors/auto-color làm hai phe cùng màu; CSS chọn phong cấp.
- `tests/chess.test.ts`: test nhập thành hợp lệ/bị cấm, mất quyền nhập thành, en passant (kể cả trường hợp làm hở Vua), phong cấp, cấm ăn Vua, hòa và pat.
- `docs/`: đã build lại với `npm run build:pages`.

## Kiểm thử đã xác nhận

- `npm run typecheck` thành công.
- `npm test` và `npm run build:pages` thành công: 19 test suites, 290 tests.
- `git diff --check` sạch.
- Chrome giả lập cảm ứng `844×390` và `390×844`: đi e2–e4 bằng chạm, AI đáp Mã g8–f6; kiểm tra luồng chạm chọn phong cấp và chọn Tượng (thế phong cấp được dựng bằng debug harness); 64 ô hiện; SVG Trắng/Đen có màu tính toán riêng; không có lỗi console ở lượt kiểm thử thành công.
- Kiểm thử trên là Chromium giả lập, không phải điện thoại vật lý. Lần phong cấp dựng thế cờ bằng debug harness, không phải chơi tự nhiên cả ván tới cuối.

## Việc còn lại / ưu tiên tiếp quản

1. **Đọc lại toàn bộ diff và xử lý trước khi merge.** E2E đã bắt được lỗi runtime thiếu import `drawReason` trong một lần; đã thêm import và chạy lại thành công. Rà tiếp các nhánh kết thúc ván, nhất là checkmate/stalemate khi chạm nước cuối và nút đi lại/đánh lại.
2. **Quyết định chính sách hòa cho đúng kỳ vọng sản phẩm.** Trò chơi hiện tự kết thúc tại mốc 50 nước/3 lần lặp, dù trong luật thi đấu FIDE đó thường là quyền yêu cầu hòa; mốc tự động là 75 nước/5 lần lặp. Hoặc giữ cách đơn giản hóa này và ghi rõ trong UI, hoặc thêm luồng yêu cầu hòa cho 50 nước/3 lần lặp.
3. **Rà tính tương đương thế cờ khi lặp.** Khóa hiện tại bỏ ô en passant nếu không có Tốt bên tới lượt bắt được theo hình học; nên đánh giá thêm tình huống Tốt đang bị ghim khiến bắt en passant là nước bất hợp lệ. Có thể thêm test chuyên biệt nếu cần.
4. **Rà lại luật thiếu quân theo định nghĩa “dead position”**, không chỉ khả năng buộc chiếu bí; bổ sung test các tổ hợp Vua/Tượng/Mã đã quyết định hỗ trợ.
5. **Thử trên thiết bị thật** (đặc biệt mẫu máy từng ép cả hai phe thành đen, chế độ tối/forced colors). Agent trong sandbox không có máy vật lý; cần người dùng hoặc thiết bị remote xác nhận.
6. **Màn dọc toàn game:** TODO.md ghi HUD còn chật ở portrait; mini-game cờ vẫn hoạt động trong viewport giả lập nhưng chưa có đánh giá usability bằng người chơi.
7. Sau khi xử lý, chạy `npm run build:pages`, `git diff --check`, xem `git status`, rồi báo kết quả. Không merge nếu chưa được yêu cầu.

## Ghi chú về tài liệu backlog hiện có

- `PLAN.md` mô tả các lượt tính năng lớn trước đây; chưa phải handoff cho thay đổi cờ vua hiện tại.
- `TODO.md` có backlog tổng thể nhưng header ghi trạng thái ở lượt 16 / commit cũ, vì vậy cần đối chiếu với source hiện tại trước khi coi mọi dòng là việc còn mở.
- `README.md` hướng dẫn dự án và build, không ghi trạng thái chi tiết của thay đổi cờ vua này.

Agent tiếp quản nên dùng `HANDOFF.md` cùng `git diff`; `HANDOFF.md` là ghi chú bàn giao, không thay cho việc xác minh thực tế.
