// Lượt 45 — trên điện thoại phải VỪA ĐI VỪA NHẢY / VỪA ĐI VỪA ĐẤM được.
// Lỗi cũ: giữ cần ảo rồi chạm nút Nhảy/Đấm thì (a) nút không nhận cú chạm (ngón tay rơi xuống canvas),
// (b) cần ảo bị nhả ra nên người chơi khựng lại. Ba nguyên nhân, canh cả ba:
//   1. #act2 button thiếu `pointer-events: auto` (vì #ui đặt pointer-events: none),
//   2. nút dùng `onclick` nên chờ pointerup — mà ngón thứ hai thường bị huỷ cử chỉ giữa chừng,
//   3. canvas nghe `pointerout`/`pointerleave` nên nhả cần ảo ngay khi ngón thứ hai chạm nút.
import { describe, it, expect } from 'vitest';
// Vite cho đọc thẳng nội dung tệp qua `?raw` — khỏi phải dùng fs/process (tsconfig không có kiểu Node).
import ui from '../src/ui/ui.ts?raw';
import input from '../src/game/input.ts?raw';

describe('điện thoại: vừa đi vừa nhảy / vừa đi vừa đấm', () => {
  it('nút Nhảy/Đấm nhận được chạm (pointer-events bật thẳng bằng JS lẫn CSS)', () => {
    // Bật bằng JS để không phụ thuộc CSS: #ui có pointer-events: none, thiếu là ngón tay rơi xuống canvas.
    const tap = ui.slice(ui.indexOf('const tapBtn'), ui.indexOf('tapBtn(hitB'));
    expect(tap).toContain("pointerEvents = 'auto'");
    expect(tap).toContain('stopPropagation');
    expect(tap).toContain('preventDefault');
  });

  it('Nhảy/Đấm ăn ngay ở pointerdown, không chờ click', () => {
    expect(ui).toContain("b.addEventListener('pointerdown'");
    expect(ui).toContain('tapBtn(hitB');
    expect(ui).toContain('tapBtn(jumpB');
    // không còn gán qua onclick (chờ pointerup mới chạy)
    expect(ui).not.toMatch(/hitB\.onclick\s*=/);
    expect(ui).not.toMatch(/jumpB\.onclick\s*=/);
  });

  it('canvas không nhả cần ảo khi ngón thứ hai chạm vào nút', () => {
    // chỉ nghe pointerup / pointercancel — KHÔNG nghe pointerout / pointerleave
    expect(input).toContain("for (const t of ['pointerup', 'pointercancel'] as const)");
    expect(input).not.toContain("'pointerup', 'pointercancel', 'pointerout', 'pointerleave'");
  });

  it('chỉ chiếm pointer (setPointerCapture) khi thật sự bắt đầu điều khiển', () => {
    const down = input.slice(input.indexOf('private down('), input.indexOf('private move('));
    // lệnh chiếm pointer không được đứng trước mọi nhánh xử lý
    const firstCapture = down.indexOf('setPointerCapture');
    const firstBranch = down.indexOf('if (this.capture)');
    expect(firstBranch).toBeGreaterThan(-1);
    expect(firstCapture === -1 || firstCapture > firstBranch, 'setPointerCapture còn nằm trước nhánh xử lý').toBe(true);
  });
});
