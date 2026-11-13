# Công cụ thử giao diện

Chạy game thật trong Chrome không giao diện (WebGL phần mềm, giả lập cảm ứng), bấm chạm như người chơi, chụp màn hình và soát hình học thành phố. Không thuộc bản phát hành; cài riêng để `npm install` ở gốc kho vẫn nhẹ.

```bash
# ở gốc kho: đóng gói rồi phục vụ bản dist
npm run build && npx vite preview --port 4173 --host 127.0.0.1 &

cd tools/probe
npm install                      # tải Chromium (~60 MB), chỉ cần một lần
node play.mjs steps/flow.mjs     # vào ván mới bằng chạm, đi bằng cần ảo, nướng bắp, mở bán
node play.mjs steps/customers.mjs   # khách lạ / khách quen: nhãn hiện ra và việc làm quen
node play.mjs steps/names.mjs    # người đứng quầy: chưa quen → đã quen
node play.mjs steps/layout.mjs   # màn hình sắp xếp nút
node play.mjs steps/audit.mjs    # mặt trùng phẳng (nhấp nháy) + biển hiệu bị che
N=12 MODE=front node play.mjs steps/signshots.mjs   # chụp các biển bị che nhiều nhất
```

Ảnh chụp nằm trong `tools/probe/out/`. Biến môi trường: `URL` (mặc định `http://127.0.0.1:4173/?debug`), `W`/`H` (mặc định 844×390; đặt `W=390 H=844` để thử màn dọc), `DESKTOP=1` (chuột thay cho cảm ứng), `LOG=1` (in console của trang).

Game chỉ mở các biến gỡ lỗi (`__game`, `__R`, `__cam`, `__give`) khi địa chỉ có `?debug`.

## Viết kịch bản

Một kịch bản là mảng các bước; mỗi bước có thể gồm (thực hiện theo đúng thứ tự này):

| Khoá | Ý nghĩa |
|---|---|
| `eval`, `args` | chạy hàm trong trang, in kết quả |
| `waitFor`, `timeout` | chờ tới khi hàm trả về giá trị đúng |
| `tap` / `tapsEval`, `gap` | chạm tại toạ độ |
| `drag` / `dragEval`, `hold`, `holdUntil` | kéo ngón tay qua các điểm, giữ rồi nhả |
| `key`, `hold` | bấm phím |
| `wait` | chờ (ms) |
| `shot` | chụp màn hình vào `out/<tên>.png` |

Lưu ý: máy không có GPU chỉ chạy được 2–14 khung hình/giây và thời gian trong game trôi tối đa 0,05 giây mỗi khung hình, nên hãy dùng `waitFor` thay cho `wait` dài, và gọi `__fast(true)` (ẩn thành phố, hạ độ phân giải) khi chỉ cần luật chơi chạy nhanh.
