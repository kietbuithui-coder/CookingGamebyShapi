# Việc còn lại & Ghi chú Kế hoạch Tổng hợp

Danh sách những gì **đã hoàn thành** và **các kế hoạch còn lại** tính tới **Lượt 18**.

Đã xong:
- **7/7 bậc kinh doanh** (Gánh hàng rong · Xe đẩy · Sạp cố định · Quán ăn nhỏ · Quán có chỗ ngồi · **Nhà hàng bình dân** · **Chuỗi cửa hàng**)
- **60/60 món ăn** · **8/8 kiểu chỗ ở** · **8 thời tiết** · **22 sự kiện** · **76 nguyên liệu** · **14 cửa hàng** · **24 món đồ nghề/cấp quầy**
- **16 nhóm người** · **11 khách quen** · **39 nhân vật cố định** · **chuỗi 11 mục tiêu hướng dẫn**
- **Điện thoại (3 mẫu máy)** · **Quán net Hải Anh** · **Đồn Công an & tạm giữ** · **Bệnh viện Phước An** · **Đua xe đạp Chủ nhật**
- **NPC sinh hoạt theo giờ** · **16 biểu cảm & 8 kiểu tóc** · **Người phụ việc ở quầy** · **Góc nhìn thứ ba, Tiệm cắt tóc & Tiệm thời trang**
- **Xưng hô linh hoạt theo giới tính (`anh`/`chị`)** · **Mini-game 3D cho Bốc hàng, Bốc cá, Đánh cờ tướng** · **Sạp chợ tự dọn hàng ban đêm** · **Điểm bán vỉa hè miễn phí & phạt lấn chiếm vỉa hè** · **Cơ chế ăn cắp (`shoplifting`) & truy đuổi của công an**
- **20 tệp kiểm thử / 291 bài kiểm thử tự động**.

---

## 1. Nhánh kinh doanh — ✅ ĐÃ HOÀN THÀNH ĐỦ 7/7 BẬC (Lượt 18)

| Bậc | Tên | Trạng thái & Tính năng |
|---|---|---|
| ✅ 1 | Gánh hàng rong | 120.000₫, 14 kg, 3 món, 3 khách; đứng được cả ở 3 điểm vỉa hè miễn phí (có rủi ro phạt lấn chiếm) |
| ✅ 2 | Xe đẩy | 2.400.000₫, 40 kg, 6 món, 5 khách; vá/bơm bánh ở chỗ Chú Hậu |
| ✅ 3 | Sạp cố định | 9.000.000₫, 90 kg, 10 món, 7 khách, có mái che cố định, đóng phí chỗ theo ngày |
| ✅ 4 | Quán ăn nhỏ | 24.000.000₫, 150 kg, 16 món, 9 khách, dựng ở mặt bằng có sân, 4 ghế nhựa ngoài sân |
| ✅ 5 | Quán có chỗ ngồi | 58.000.000₫, 200 kg, 20 món, 12 khách, hiên mái tôn + nền gạch bông + 3 bàn gỗ 6 ghế tựa lưng, thực đơn theo buổi (`fitsPeriod` ×1,35), khách gọi thêm món tráng miệng/nước (`secondOrder`) |
| ✅ 6 | Nhà hàng bình dân | **Đã xong (Lượt 18):** 135.000.000₫, 280 kg, giữ lạnh 100 kg, 28 món, 16 khách, phòng ăn 4 bàn gỗ lớn **8 ghế tựa lưng** + vách phòng bếp riêng + bàn lễ tân; thuê **Phụ bếp** (`CHEF_POOL`: giữ cốt sơ chế tươi lâu ×1,5, nấu dễ hơn, tự nấu bù khi khay vơi & nhân viên tự bưng món làm sẵn ra bàn); đón **khách đoàn** (`group`: 2–4 phần/lượt) và **Sổ đặt bàn trước theo ngày** (`bookings`) |
| ✅ 7 | Chuỗi cửa hàng | **Đã xong (Lượt 18):** 280.000.000₫, 360 kg, giữ lạnh 140 kg, 40 món, 20 khách; mở thêm **Chi nhánh thứ 2** ở điểm bán khác hoạt động song song (7h–21h), thuê **Quản lý cửa hàng** (`BRANCH_MANAGERS`) trông coi, tự động bán hàng theo giờ và có **bảng sổ sách thu–chi tách riêng từng điểm bán** |

---

## 2. Hệ thống Băng nhóm & Giang hồ (Kế hoạch tiếp theo)

- **Lãnh địa băng nhóm** theo từng khu phố (ngoài sự kiện thu tiền bảo kê ngẫu nhiên và vay nóng Hùng Sẹo hiện có).
- **Đụng độ / đánh nhau với băng nhóm** (có đồng bọn, máu/sức chiến đấu khi xô xát).
- **Nhiệm vụ băng nhóm** (đòi nợ thuê, giữ hàng, chở hàng lậu…) và điểm **quan hệ tốt/xấu với Hùng Sẹo**.
- **Làm ăn với băng nhóm**: đóng phần trăm doanh thu để được bảo kê cố định (không bị khách quậy, không bị đòi bảo kê lẻ).

---

## 3. Con người, Nhân vật & Người phụ việc (Các phần mở rộng)

- **Ngoại hình người chơi (mở rộng sau Lượt 15)**:
  - **Gương soi ở trong nhà trọ/nhà ở** để xem và đổi đồ ngay tại nhà.
  - Chỉnh **dáng người / chiều cao** (`fat`, `h`), mua **mũ/nón**, và **trang phục theo nghề** (tạp dề đầu bếp, áo bảo hộ…).
  - NPC trên phố có thêm **râu, kính, mũ** đa dạng hơn.
- **Người phụ việc ở quầy (mở rộng sau Lượt 14 & 18)**:
  - Đã có **Phụ bếp** (Bậc 6), **Quản lý chi nhánh** (Bậc 7) và **tự động bưng món làm sẵn ra bàn** khi ở Nhà hàng.
  - Còn có thể mở rộng thêm: **chia ca sáng / tối** cho nhiều nhân viên phục vụ bàn cùng lúc.
- **Lời thoại & tương tác xã hội sâu hơn**:
  - Bộ thoại riêng phong phú hơn cho từng nhân vật cố định.
  - Phản ứng của người dân thay đổi rõ theo vị thế người chơi (**khi giàu có / khi nghèo rớt / khi đang bị công an để ý**).
  - Các tiệm nhỏ (tạp hoá, MiniMart, tiệm cầm đồ) có thêm **việc vặt riêng** cho người chơi nhận làm và khách đứng lựa hàng trò chuyện được.

---

## 4. Công an & Đường phố (Phần để dành từ Lượt 7)

- **Chốt CSGT đứng ở ngã tư**.
- **Còi và loa phát thanh phường** theo khung giờ sáng/chiều.
- **Lao động công ích ngoài đường** (quét phố, bốc vác công ích ngoài bến để giảm án/trừ phạt thay vì chỉ đập đá trong buồng giam).

---

## 5. Điện thoại, Sổ tay & Tiện ích nhỏ

- **Nhắc nợ qua điện thoại**: Thêm nút gọi/nhắn **đòi nợ khách quen mua chịu** từ xa trong bảng *"Nợ & khách quen"* hoặc ứng dụng Danh bạ (hiện chỉ đòi được khi gặp mặt trực tiếp).
- **Bảng Thành tích / Thống kê tổng kết sự nghiệp**: Thêm bảng Thành tích (Achievements / Milestones) cho toàn bộ quá trình chơi bên cạnh bảng tổng kết cuối mỗi ngày.
- **Bố cục riêng cho màn hình dọc (Portrait)**: Tối ưu lại bố cục HUD riêng cho điện thoại cầm dọc.

---

## 6. Kỹ thuật, Nội thất & Hiệu năng

- **Nội thất cửa hàng chi tiết hơn**: Bổ sung kệ hàng, quầy và biển giá chi tiết hơn cho một số tiệm nhỏ.
- **Chơi ngoại tuyến (Offline PWA)**: Thêm `Service Worker` để mở game khi mất mạng.
- **Lưu đám mây / Xuất–Nhập bản lưu (Export/Import Save)**: Cho phép xuất/nhập chuỗi bản lưu để không mất tiến trình khi xoá dữ liệu trình duyệt.
- **Tối ưu gói JS & đồ hoạ máy yếu**: Tách chunk (`code-splitting`) để giảm kích thước gói tải ban đầu; thêm `InstancedMesh` / `LOD` cho vật thể lặp lại trên máy yếu.
