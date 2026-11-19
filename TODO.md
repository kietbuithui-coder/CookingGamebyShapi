# Việc còn lại

Danh sách những gì **chưa làm**, rà theo mã ngày 2026-11-17 (`main` = `5de6014`, sau khi gộp PR #33). Đã xong: 60/60 món · 8/8 kiểu chỗ ở ·
7/7 bậc kinh doanh · 8 thời tiết · 22 sự kiện · 75 nguyên liệu · 12 nơi bán · 37 món đồ nghề · 16 nhóm người ·
11 khách quen · 44 nhân vật cố định · chuỗi 11 mục tiêu hướng dẫn · điện thoại · quán net · công an · bệnh viện ·
đua xe đạp · NPC sinh hoạt theo giờ · giao diện dễ đọc · 16 biểu cảm · 8 kiểu tóc · người phụ việc ·
ngoại hình người chơi (góc nhìn thứ ba, cắt tóc, thời trang) · quán có chỗ ngồi (sáu ghế bàn gỗ, thực đơn theo buổi, gọi thêm) ·
nhà hàng bình dân (8 ghế trong nhà kín, đặt bàn trước, phụ bếp, khách đoàn) ·
chuỗi cửa hàng (chi nhánh thứ hai, người trông coi, sổ từng điểm) · giao người làm đi chợ mua nguyên liệu · báo cáo sắp hết đồ của người làm · bếp trưởng tự duyệt đặt bàn · vựa ve chai thứ hai (Bà Chín) · bấm chuông thì cửa mở · ba giao diện điện thoại · app Quản lý cửa hàng (bật/tắt bán từ xa, cảnh báo bán lỗ, công tắc khớp trạng thái thật, ân hạn 20 giây) · cảnh báo thiếu nguyên liệu nói rõ thiếu gì + mua ở đâu (chip HUD, bảng Quầy, nút Sơ chế) · giao diện điện thoại Android soát bằng probe 4 khổ (không còn tràn/cắt, vùng chạm ≥ 30 px) · hai tổng đài trong danh bạ: gọi 1080 nghe dự báo thời tiết ngày mai (2.000₫/lượt, 3 lượt/ngày), gọi 1900 1234 thì bị lừa — số chỉ hiện trong danh bạ sau khi nhận tin mời gọi, và chỉ dính một lần (quay về được) · sửa nút ở điểm hẹn (hộp thoại bị dựng lại mỗi khung hình), dời chỗ hẹn vào ngõ cụt sau chợ có thùng bỏ “lệ phí”, dọn sạp quần áo giữa chợ vào tiệm QUẦN ÁO CÔ NGỌC ở mặt tiền Phố Trung Tâm · màn hình điện thoại chạy hoạt ảnh ngay trên khung máy: cuộc gọi (chuông lan, nút Tắt máy), radio/nhạc (kim dò đài, cột sóng, chữ chạy), WAP (trang tự cuộn, thanh tải), tin nhắn (bong bóng đang gõ, bàn phím nhấp nháy) · ba bài nhạc riêng của máy đổi được nhạc nền (Bài khác / Tắt) · radio và WAP đọc tin thật trong ván (thời tiết, giá chợ đúng giá sạp, sự kiện, nợ, pin), WAP mỗi trang 5 tin + bảng giá · bỏ tin bịa “xe ôm Chú Ba đứng đầu hẻm”, tin khách quen chỉ hiện khi đã bán cho họ · dáng người – râu – nón mua được thật · câu thoại riêng cho 15 nhân vật cố định · ca sáng/chiều cho hai người phụ quầy · khách lựa hàng thật ở tạp hoá & MiniMart · người đi đường nhận ra người chơi giàu/túng/bị để ý · quán thường (bậc 3–5) có tab Nhân sự và giao được người đi chợ · bánh mì trong quầy để được 2 ngày (tăng 100%) · cảnh báo đồ cần lạnh để ở quầy không có tủ đá (bảng Kho quầy + app điện thoại) · dọn đồ hỏng thì báo đích danh món · lấy đồ trong kho quầy ra ở bất cứ đâu (tab Kho quầy trong Túi đồ, không cần đặt quầy ở chỗ bán) · nhật ký phát triển xem trong Cài đặt (6 bản gần nhất, có nhãn "mới") · bánh phở/bún/đồ nguội tăng gấp đôi hạn dùng (thịt cá tươi giữ nguyên) · 472 bài kiểm thử / 37 tệp.

---

## 1. Nhánh kinh doanh — đã đủ 7/7 bậc

| Bậc | Tên | Cần gì để làm |
|---|---|---|
| ✅ 5 | Quán có chỗ ngồi | **Đã xong (lượt 16):** 58.000.000₫, 200 kg, 20 món, 12 khách, hiên mái tôn + nền gạch bông + 3 bàn gỗ 6 ghế tựa lưng, thực đơn theo buổi (sáng/trưa/chiều/khuya, `fitsPeriod` ×1,35), khách ăn tại chỗ kiên nhẫn ×1,9 và gọi thêm món tráng miệng/nước (`secondOrder`) |
| ✅ 6 | Nhà hàng bình dân | **Đã xong:** 145.000.000₫, 280 kg, 26 món, 16 khách, nội thất trong nhà kín (4 bàn 8 ghế, phòng bếp riêng có vách ngăn & cửa bếp, không ngại mưa/tối), đặt bàn trước (nhận/từ chối/giữ chỗ/tiền cọc), nhân viên phụ bếp (`sous` tự sơ chế & nấu phụ), khách đoàn 3–4 người (`decideGroup`) |
| ✅ 7 | Chuỗi cửa hàng | **Đã xong (lượt 18):** 320.000.000₫, 320 kg, 30 món, 18 khách, 64 khay; chi nhánh thứ hai ở 3 chỗ đặt (120.000/150.000/90.000₫ mỗi ngày), thuê người trông coi bán hộ món nấu sẵn (trần 6 món / 24 phần), sổ từng điểm + 8 ngày lịch sử, quầy nhỏ & NPC trông coi dựng thật ngoài phố |

`FUTURE_TIERS` trong `src/data/gear.ts` nay là mảng rỗng — nhánh kinh doanh hết bậc. Còn thiếu của bậc 7: **nhiều chi nhánh cùng lúc** (hiện đúng 1), nâng cấp riêng cho chi nhánh (máy tính tiền, tủ lạnh, bảng menu), và **quản lý qua điện thoại** thay vì phải chạy tới quầy.

## 2. Xe ôm Chú Ba — chưa làm, mới là ý tưởng

Hiện **Chú Ba xe ôm** chỉ là khách quen ăn trưa (`REGULARS.chu_ba`, giờ 11,5, thích `com`/`nuoc`), do `src/game/stall.ts`
thỉnh thoảng cho spawn. **Không có** xe, không có chỗ đứng, không có dịch vụ chở khách, và `src/sim/news.ts` đã bỏ câu bịa
“đứng đầu hẻm từ 5 giờ”. Muốn thành tính năng thật thì:

- [ ] **Dựng xe & chỗ đứng**: thêm `xe_om` vào `FIXED` (`src/data/people.ts`) + anchor `v_xe_om` trong `src/world/places.ts`
      (đầu hẻm lô `02E`, tránh spot `hem` của Hùng Sẹo) — `src/game/npc.ts:80` chỉ tạo NPC cố định khi có anchor.
      Cần thêm mô hình xe số + nón bảo hiểm (2 nón) cạnh NPC.
- [ ] **Bấm vào xe/Chú Ba để đi nhờ**: bảng giá theo khoảng cách (ví dụ 3.000₫ trong xóm, 5.000₫ sang phố bên, 8.000₫ ra chợ,
      +2.000₫ nếu trời mưa), trả tiền qua `R.spend`, tốn thời gian theo quãng đường (nhanh hơn đi bộ ~3 lần).
- [ ] **Chọn điểm đến**: dùng lại danh sách của Bản đồ (`ctx.acts.places()`) hoặc chỉ cho tới các điểm đã ghim (`acts.way`).
      Đi nhờ xe thì đặt vị trí người chơi tại cửa địa điểm, không cắt cảnh.
- [ ] **Gọi bằng điện thoại**: thêm mục riêng trong danh bạ (`src/sim/phone.ts`, chỗ `out.unshift` hai tổng đài) — “Chú Ba xe ôm”,
      gọi thì Chú Ba chạy tới điểm hẹn gần nhất sau ~2–4 phút trong game; nếu đang mưa/khuya thì phụ phí hoặc từ chối.
      Tôn trọng giới hạn một cuộc/ngày như `call()` hiện có, hoặc cho gọi lại nhưng tính thêm cước.
- [ ] **Quan hệ & giá**: khách quen thân (`g.rel.chu_ba.v` cao) thì bớt 1.000–2.000₫, thỉnh thoảng chở miễn phí; uy tín thấp thì
      đòi trả trước. Ăn chịu (`owe`) chưa trả thì Chú Ba từ chối chở.
- [ ] **Nói đúng sự thật vào bản tin**: khi đã có NPC thật thì mới thêm lại tin radio/WAP về xe ôm, và tin phải lấy giờ/giá thật
      từ dữ liệu NPC (cùng nguyên tắc với `news.ts` hiện nay).
- [ ] Test: `tests/xeom.test.ts` — giá theo quãng/tình trạng mưa, trừ tiền đúng, không cho đi khi thiếu tiền, gọi điện giới hạn
      ngày, thân thiết thì giảm giá, tin radio chỉ xuất hiện khi NPC tồn tại. Probe ảnh NPC + xe ở đầu hẻm, bảng chọn điểm đến.

## 3. Ông Bảy gợi ý đúng lúc — mới có 6 câu cứng

`src/game/acts.ts` (nhánh `case 'hobo'`) đang `rnd.pick` trong **6 câu viết sẵn**, không biết người chơi đang ở đâu trong ván.
Muốn “hỏi gợi ý” thật thì:

- [ ] Đổi mảng cứng thành hàm `hoboAdvice(g)` trả về câu **theo trạng thái thật**, xếp theo mức cấp thiết:
      máu/thanh lực thấp → ăn gì ở đâu · tiền < 30.000₫ → việc gần nhất đang mở (`dock` sáng, `dishes` 10–14h30) ·
      chưa có gánh → nhắc tiệm Đồ Nghề Ba Tài · có quán nhưng vắng khách → nhắc giờ đông, món thiếu nguyên liệu ·
      nợ Hùng Sẹo sắp tới hạn → cảnh báo số ngày · trời sắp mưa → nhắc mua áo mưa/đổi món · đêm khuya → nhắc chỗ ngủ.
- [ ] Mỗi câu phải **trỏ đúng chỗ**: tên quán/tiệm + khoảng cách thật tính từ `ctx.player`, và bấm một nút là **ghim đường đi**
      (`acts.way`) tới đó thay vì chỉ nói suông.
- [ ] Không lặp: nhớ câu vừa nói trong `g.flags` để lần sau nói câu khác; hết câu mới thì quay lại câu chung.
- [ ] Câu phải khớp dữ liệu — có test canh: mỗi câu gợi ý sinh ra trong 50 trạng thái ngẫu nhiên đều phải nhắc một địa điểm
      **có thật** trong `places()` và việc **đang mở được** ở giờ đó (giống bài canh tin bịa của `news.test.ts`).

## 4. Băng nhóm

- Chưa có **lãnh địa**: hiện chỉ có sự kiện thu tiền bảo kê và chủ nợ Hùng Sẹo.
- Chưa có **đánh nhau** (đấm người đi đường đã có, nhưng chưa có đụng độ băng nhóm, không có máu/đồng bọn).
- Chưa có **nhiệm vụ băng nhóm** (đòi nợ thuê, giữ hàng, chở hàng lậu…) và chưa có quan hệ tốt/xấu với Hùng Sẹo.
- Chưa có chủ đề "làm ăn với băng nhóm" (được bảo kê đổi lấy phần trăm).

## 5. Con người & nhân vật

- ✅ **Ngoại hình người chơi** (lượt 15): góc nhìn thứ ba (phím V) để thấy chính mình; tiệm cắt tóc Chú Bảy Kéo đổi 8 kiểu tóc + 4 màu nhuộm; tiệm thời trang Cô Ngọc đổi áo (6 màu), quần (5 màu), giày (3 đôi), kính (cận / đen). Ngoại hình nằm trong bản lưu v11. ✅ **Lượt 31:** đổi **dáng người – chiều cao** (ba dáng, ảnh hưởng tốc độ đi & hao sức thật) và **nón** (nón lá / lưỡi trai / bảo hiểm) ở tiệm may. Còn thiếu: **gương ở nhà** và bộ đồ riêng theo nghề (tạp dề, áo bảo hộ).
- ✅ **Khuôn mặt & kiểu tóc** (lượt 14): atlas **16 × 8** với 16 biểu cảm, **8 kiểu tóc** (thêm xoăn, đuôi ngựa, húi cua, tém ngang vai) chia theo giới tính và nhóm người. ✅ **Lượt 31:** **râu** (mép / cằm / quai nón, cạo ở ghế Chú Bảy) và **nón** ba kiểu (ở tiệm may). Còn thiếu: kính đa dạng hơn.
- **Lời thoại**: đã có câu chào, câu thô lỗ, câu mặc cả, câu vu vơ theo nhóm người; ✅ **Lượt 31:** **câu riêng cho 15 nhân vật cố định** (`LINES.own`, xoay theo ngày, người quen nói giọng của họ). ✅ **Lượt 32:** người đi đường **nhận ra** người chơi vừa giàu (≥ 5 triệu, uy tín > 10), đang túng (< 5.000₫) hay đang bị công an để ý — ba kiểu chào mới trong `greetKind()`.
- **Nhân vật phụ ở tiệm nhỏ**: ✅ **Lượt 32** — tạp hoá Cô Ba và MiniMart có **khách thật vào lựa hàng**: đi dọc kệ, nói đúng tên món + đúng giá hôm nay ở quầy, nhờ người chơi lấy giùm món trên kệ cao (`src/game/shopbrowse.ts`). Còn thiếu: việc vặt riêng của từng tiệm và khách ở tiệm cầm đồ.
- ✅ **Người phụ việc** (lượt 14): chỉ hiện khi quầy ≥ xe đẩy, doanh thu ≥ 250.000₫ và đã bán qua ≥ 2 ngày; thuê theo ngày, dỗ khách chờ (kiên nhẫn ×1,3), lau quầy, có thoại + biểu cảm theo tình huống. ✅ **Lượt 31:** hai người cùng lúc (nhà hàng bình dân) và **chia ca sáng / chiều / cả ngày** — ngoài ca thì không tới quầy. ✅ **Lượt 35:** bảng **Nhân sự** (giao đi chợ, báo cáo) có cả ở quán thường bậc 3–5, không chỉ nhà hàng. Còn thiếu: tự bưng món ra cho khách.

## 6. Kỹ thuật & hiệu năng

- **Chưa đo trên máy yếu thật**: người chơi báo máy chạy trên 50 khung hình/giây nhưng chưa rõ máy nào.
- Khi cần tối ưu: gộp các khối cơ thể NPC thành một lưới, dùng instancing cho đồ vật lặp lại (ghế, cây, xe), bỏ sương mù theo điểm ảnh ở mức đồ hoạ thấp, thêm LOD cho khu ở xa.
- **Tách gói JavaScript**: hiện một tệp khoảng 1,23 MB (nén còn ~384 kB). Nên tách phần dựng thành phố ra khỏi phần giao diện.
- **Báo cáo của người làm**: ✅ đã báo sắp hết nguyên liệu + gợi ý đi chợ + tự duyệt đặt bàn; ✅ app điện thoại đã báo **giá bán lỗ** so với giá vốn và bật/tắt bán từ xa. Còn thiếu: báo **bàn đặt trước bị trùng giờ / quá chỗ** và tuỳ chọn **chỉ nhận bàn ≤ N người**.
- **Đi chợ thuê người**: mới có một kiểu chuyến (mua theo món cần, giá tốt nhất trong giờ). Còn thiếu: **mặc cả hộ** (người làm có thể trả giá theo độ thân với người bán), **mua theo danh sách tự soạn** (tự chọn từng nguyên liệu + số lượng), **đi chợ bị mưa/ kẹt xe nên về muộn**, và **mua hộ cho chi nhánh** (hiện người trông coi vẫn chất hàng về kho quầy chính).
- **Chơi ngoại tuyến**: chưa có service worker; mất mạng là không mở được.
- **Lưu đám mây**: chưa có; xoá dữ liệu trình duyệt là mất bản lưu (bản lưu v15, tự lưu sau mỗi việc quan trọng).
- **Nội thất cửa hàng**: một số tiệm còn sơ sài (kệ hàng, quầy, biển giá mới ở mức khối hộp).

## 7. Cân chỉnh

- **Âm thanh**: chưa nghe thử trên tai nghe/loa điện thoại thật để cân lại nhạc nền với hiệu ứng.
- **Nhịp độ**: chưa chơi thử dài để cân tốc độ kiếm vốn ngày đầu, lượng khách khi uy tín thấp, độ khó các mini-game (nấu, đua xe đạp).
- **Màn dọc**: HUD vẫn chật khi điện thoại để dọc (đã có thanh cỡ giao diện 70–160% và lời khuyên xoay ngang, nhưng chưa bố trí lại riêng cho màn dọc).
- **Bậc 6 chưa có probe giao diện**: luật đã có test (`tests/nhahang.test.ts`), nhưng chưa chạy `tools/probe` cho nhà hàng bình dân (8 ghế, khách đoàn, bảng đặt bàn trước, phụ bếp) ở cả màn ngang và màn dọc.

## 8. Việc nhỏ đã biết

- Dòng "Dụng cụ" / "Sơ chế" trong Sổ tay từng thừa dấu "·" — đã sửa khi viết lại mục công thức ở lượt 12, cần rà lại lần nữa sau khi thêm bậc 4–6.
- Bảng "Nợ & khách quen" chưa có nút nhắc nợ qua điện thoại (chỉ nhắc khi gặp mặt).
- Đã xoá `HANDOFF.md` (bàn giao lượt cờ vua, số liệu 292 bài đã lỗi thời), 13 ảnh lẻ ở `anh_ket_qua/` không tài liệu nào dùng, và 2 probe chưa từng được gọi (`hatrong.mjs`, `staff_anim.mjs`) — đừng tìm lại.
- Chưa có bảng thành tích / thống kê sau khi chơi xong (mới có tổng kết cuối ngày).
