# Việc còn lại

Danh sách những gì **chưa làm** tính tới lượt 14 (`main` = `6992fa4`). Đã xong: 60/60 món · 8/8 kiểu chỗ ở ·
4/7 bậc kinh doanh · 8 thời tiết · 22 sự kiện · 76 nguyên liệu · 12 cửa hàng · 21 món đồ nghề · 16 nhóm người ·
11 khách quen · 37 nhân vật cố định · chuỗi 11 mục tiêu hướng dẫn · điện thoại · quán net · công an · bệnh viện ·
đua xe đạp · NPC sinh hoạt theo giờ · giao diện dễ đọc · 16 biểu cảm · 8 kiểu tóc · người phụ việc · 247 bài kiểm thử / 16 tệp.

---

## 1. Nhánh kinh doanh — còn 3 bậc

| Bậc | Tên | Cần gì để làm |
|---|---|---|
| 5 | Quán có chỗ ngồi | Đã có người phụ bán (lượt 14) — còn thực đơn theo buổi (sáng/trưa/chiều), khách ngồi ăn lâu hơn, bàn trong nhà thay vì bàn nhựa ngoài sân |
| 6 | Nhà hàng bình dân | Nội thất trong nhà (bàn ghế, quầy thu ngân), đặt bàn trước, nhân viên phụ bếp, khách đoàn |
| 7 | Chuỗi cửa hàng | Mở điểm bán thứ hai cùng lúc, quản lý từ xa (sổ sách từng điểm), thuê người trông coi |

Hiện `FUTURE_TIERS` trong `src/data/gear.ts` mới có tên; chưa có dữ liệu, mô hình, luật đặt chỗ và kiểm thử.

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
- **Tách gói JavaScript**: hiện một tệp khoảng 1,05 MB (nén còn ~328 kB). Nên tách phần dựng thành phố ra khỏi phần giao diện.
- **Chơi ngoại tuyến**: chưa có service worker; mất mạng là không mở được.
- **Lưu đám mây**: chưa có; xoá dữ liệu trình duyệt là mất bản lưu (bản lưu v10, tự lưu sau mỗi việc quan trọng).
- **Nội thất cửa hàng**: một số tiệm còn sơ sài (kệ hàng, quầy, biển giá mới ở mức khối hộp).

## 5. Cân chỉnh

- **Âm thanh**: chưa nghe thử trên tai nghe/loa điện thoại thật để cân lại nhạc nền với hiệu ứng.
- **Nhịp độ**: chưa chơi thử dài để cân tốc độ kiếm vốn ngày đầu, lượng khách khi uy tín thấp, độ khó các mini-game (nấu, đua xe đạp).
- **Màn dọc**: HUD vẫn chật khi điện thoại để dọc (đã có thanh cỡ giao diện 70–160% và lời khuyên xoay ngang, nhưng chưa bố trí lại riêng cho màn dọc).

## 6. Việc nhỏ đã biết

- Dòng "Dụng cụ" / "Sơ chế" trong Sổ tay từng thừa dấu "·" — đã sửa khi viết lại mục công thức ở lượt 12, cần rà lại lần nữa sau khi thêm bậc 4.
- Bảng "Nợ & khách quen" chưa có nút nhắc nợ qua điện thoại (chỉ nhắc khi gặp mặt).
- Chưa có bảng thành tích / thống kê sau khi chơi xong (mới có tổng kết cuối ngày).
