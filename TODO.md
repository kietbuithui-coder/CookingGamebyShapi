# Việc còn lại

Danh sách những gì **chưa làm**, rà theo mã ngày 2026-11-17 (`main` = `ca6c3d6`). Đã xong: 60/60 món · 8/8 kiểu chỗ ở ·
7/7 bậc kinh doanh · 8 thời tiết · 22 sự kiện · 75 nguyên liệu · 12 nơi bán · 37 món đồ nghề · 16 nhóm người ·
11 khách quen · 44 nhân vật cố định · chuỗi 11 mục tiêu hướng dẫn · điện thoại · quán net · công an · bệnh viện ·
đua xe đạp · NPC sinh hoạt theo giờ · giao diện dễ đọc · 16 biểu cảm · 8 kiểu tóc · người phụ việc ·
ngoại hình người chơi (góc nhìn thứ ba, cắt tóc, thời trang) · quán có chỗ ngồi (sáu ghế bàn gỗ, thực đơn theo buổi, gọi thêm) ·
nhà hàng bình dân (8 ghế trong nhà kín, đặt bàn trước, phụ bếp, khách đoàn) ·
chuỗi cửa hàng (chi nhánh thứ hai, người trông coi, sổ từng điểm) · giao người làm đi chợ mua nguyên liệu · báo cáo sắp hết đồ của người làm · bếp trưởng tự duyệt đặt bàn · vựa ve chai thứ hai (Bà Chín) · bấm chuông thì cửa mở · ba giao diện điện thoại · 393 bài kiểm thử / 29 tệp.

---

## 1. Nhánh kinh doanh — đã đủ 7/7 bậc

| Bậc | Tên | Cần gì để làm |
|---|---|---|
| ✅ 5 | Quán có chỗ ngồi | **Đã xong (lượt 16):** 58.000.000₫, 200 kg, 20 món, 12 khách, hiên mái tôn + nền gạch bông + 3 bàn gỗ 6 ghế tựa lưng, thực đơn theo buổi (sáng/trưa/chiều/khuya, `fitsPeriod` ×1,35), khách ăn tại chỗ kiên nhẫn ×1,9 và gọi thêm món tráng miệng/nước (`secondOrder`) |
| ✅ 6 | Nhà hàng bình dân | **Đã xong:** 145.000.000₫, 280 kg, 26 món, 16 khách, nội thất trong nhà kín (4 bàn 8 ghế, phòng bếp riêng có vách ngăn & cửa bếp, không ngại mưa/tối), đặt bàn trước (nhận/từ chối/giữ chỗ/tiền cọc), nhân viên phụ bếp (`sous` tự sơ chế & nấu phụ), khách đoàn 3–4 người (`decideGroup`) |
| ✅ 7 | Chuỗi cửa hàng | **Đã xong (lượt 18):** 320.000.000₫, 320 kg, 30 món, 18 khách, 64 khay; chi nhánh thứ hai ở 3 chỗ đặt (120.000/150.000/90.000₫ mỗi ngày), thuê người trông coi bán hộ món nấu sẵn (trần 6 món / 24 phần), sổ từng điểm + 8 ngày lịch sử, quầy nhỏ & NPC trông coi dựng thật ngoài phố |

`FUTURE_TIERS` trong `src/data/gear.ts` nay là mảng rỗng — nhánh kinh doanh hết bậc. Còn thiếu của bậc 7: **nhiều chi nhánh cùng lúc** (hiện đúng 1), nâng cấp riêng cho chi nhánh (máy tính tiền, tủ lạnh, bảng menu), và **quản lý qua điện thoại** thay vì phải chạy tới quầy.

## 2. Băng nhóm

- Chưa có **lãnh địa**: hiện chỉ có sự kiện thu tiền bảo kê và chủ nợ Hùng Sẹo.
- Chưa có **đánh nhau** (đấm người đi đường đã có, nhưng chưa có đụng độ băng nhóm, không có máu/đồng bọn).
- Chưa có **nhiệm vụ băng nhóm** (đòi nợ thuê, giữ hàng, chở hàng lậu…) và chưa có quan hệ tốt/xấu với Hùng Sẹo.
- Chưa có chủ đề "làm ăn với băng nhóm" (được bảo kê đổi lấy phần trăm).

## 3. Con người & nhân vật

- ✅ **Ngoại hình người chơi** (lượt 15): góc nhìn thứ ba (phím V) để thấy chính mình; tiệm cắt tóc Chú Bảy Kéo đổi 8 kiểu tóc + 4 màu nhuộm; tiệm thời trang Cô Ngọc đổi áo (6 màu), quần (5 màu), giày (3 đôi), kính (cận / đen). Ngoại hình nằm trong bản lưu v11. Còn thiếu: **gương ở nhà**, đổi dáng người – chiều cao, mũ/nón, và bộ đồ riêng theo nghề (tạp dề, áo bảo hộ).
- ✅ **Khuôn mặt & kiểu tóc** (lượt 14): atlas **16 × 8** với 16 biểu cảm, **8 kiểu tóc** (thêm xoăn, đuôi ngựa, húi cua, tém ngang vai) chia theo giới tính và nhóm người. Còn thiếu: râu, kính, mũ đa dạng hơn.
- **Lời thoại**: đã có câu chào, câu thô lỗ, câu mặc cả, câu vu vơ theo nhóm người; còn thiếu bộ thoại riêng cho từng nhân vật cố định và phản ứng khi người chơi giàu/nghèo/bị công an để ý.
- **Nhân vật phụ ở tiệm nhỏ**: tạp hoá, MiniMart, tiệm cầm đồ mới có người bán cố định; chưa có khách lựa hàng nói chuyện, chưa có việc vặt riêng.
- ✅ **Người phụ việc** (lượt 14): chỉ hiện khi quầy ≥ xe đẩy, doanh thu ≥ 250.000₫ và đã bán qua ≥ 2 ngày; thuê theo ngày, dỗ khách chờ (kiên nhẫn ×1,3), lau quầy, có thoại + biểu cảm theo tình huống. Còn thiếu: nhiều người cùng lúc, chia ca sáng/tối, tự bưng món ra cho khách.

## 4. Kỹ thuật & hiệu năng

- **Chưa đo trên máy yếu thật**: người chơi báo máy chạy trên 50 khung hình/giây nhưng chưa rõ máy nào.
- Khi cần tối ưu: gộp các khối cơ thể NPC thành một lưới, dùng instancing cho đồ vật lặp lại (ghế, cây, xe), bỏ sương mù theo điểm ảnh ở mức đồ hoạ thấp, thêm LOD cho khu ở xa.
- **Tách gói JavaScript**: hiện một tệp khoảng 1,23 MB (nén còn ~384 kB). Nên tách phần dựng thành phố ra khỏi phần giao diện.
- **Báo cáo của người làm**: mới báo sắp hết nguyên liệu + gợi ý đi chợ + tự duyệt đặt bàn. Còn thiếu: báo **bàn đặt trước bị trùng giờ / quá chỗ**, báo **giá bán lỗ** so với giá vốn, và tuỳ chọn **chỉ nhận bàn ≤ N người**.
- **Đi chợ thuê người**: mới có một kiểu chuyến (mua theo món cần, giá tốt nhất trong giờ). Còn thiếu: **mặc cả hộ** (người làm có thể trả giá theo độ thân với người bán), **mua theo danh sách tự soạn** (tự chọn từng nguyên liệu + số lượng), **đi chợ bị mưa/ kẹt xe nên về muộn**, và **mua hộ cho chi nhánh** (hiện người trông coi vẫn chất hàng về kho quầy chính).
- **Chơi ngoại tuyến**: chưa có service worker; mất mạng là không mở được.
- **Lưu đám mây**: chưa có; xoá dữ liệu trình duyệt là mất bản lưu (bản lưu v15, tự lưu sau mỗi việc quan trọng).
- **Nội thất cửa hàng**: một số tiệm còn sơ sài (kệ hàng, quầy, biển giá mới ở mức khối hộp).

## 5. Cân chỉnh

- **Âm thanh**: chưa nghe thử trên tai nghe/loa điện thoại thật để cân lại nhạc nền với hiệu ứng.
- **Nhịp độ**: chưa chơi thử dài để cân tốc độ kiếm vốn ngày đầu, lượng khách khi uy tín thấp, độ khó các mini-game (nấu, đua xe đạp).
- **Màn dọc**: HUD vẫn chật khi điện thoại để dọc (đã có thanh cỡ giao diện 70–160% và lời khuyên xoay ngang, nhưng chưa bố trí lại riêng cho màn dọc).
- **Bậc 6 chưa có probe giao diện**: luật đã có test (`tests/nhahang.test.ts`), nhưng chưa chạy `tools/probe` cho nhà hàng bình dân (8 ghế, khách đoàn, bảng đặt bàn trước, phụ bếp) ở cả màn ngang và màn dọc.

## 6. Việc nhỏ đã biết

- Dòng "Dụng cụ" / "Sơ chế" trong Sổ tay từng thừa dấu "·" — đã sửa khi viết lại mục công thức ở lượt 12, cần rà lại lần nữa sau khi thêm bậc 4–6.
- Bảng "Nợ & khách quen" chưa có nút nhắc nợ qua điện thoại (chỉ nhắc khi gặp mặt).
- Chưa có bảng thành tích / thống kê sau khi chơi xong (mới có tổng kết cuối ngày).
