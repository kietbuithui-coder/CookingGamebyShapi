// LƯỢT 73 — GIAO DIỆN GỌN KIỂU ANDROID.
// Người chơi dặn *“cập nhật giao diện gọn kiểu Android”*. Bài này canh bằng chữ trên tệp nguồn (không dựng
// được DOM trong vitest) rằng: có thanh trên cùng + ngăn kéo, nút cũ ĐÃ ẨN khi bật Android, ngăn kéo có đủ
// mục của bảy nút nổi cũ, và nút ĐE DOẠ nằm trong ngăn kéo (đúng chỗ người chơi dặn “thêm nút đe doạ”).
import { describe, it, expect } from 'vitest';
import ui from '../src/ui/ui.ts?raw';
import types from '../src/game/ctx.ts?raw';
// @ts-expect-error — bài kiểm thử chạy trên Node; dự án không cài @types/node cho phần game
import { readFileSync } from 'node:fs';
// `?raw` không nhận tệp .css (Vite trả chuỗi rỗng) ⇒ đọc thẳng bằng fs như các bài khác.
const css = readFileSync(new URL('../src/ui/style.css', import.meta.url), 'utf8');

describe('giao diện kiểu Android', () => {
  it('cài đặt có công tắc, mặc định bật trên điện thoại', () => {
    expect(types).toContain('android: boolean');
    expect(types).toMatch(/android:\s*mobile/);
  });

  it('có thanh trên cùng (giờ · tiền · ☰) và ngăn kéo riêng', () => {
    expect(ui).toContain("add('topbar'");
    expect(ui).toContain("add('drawer'");
    expect(ui).toContain("id=\"tbburger\"");
    expect(ui).toContain('applyAndroid');
    // bật Android thì hàng bảy nút nổi cũ phải ẩn, không thì hai bộ nút chồng nhau.
    expect(css).toContain('#ui.android #menub { display: none !important; }');
    expect(css).toContain('#ui.android #topbar');
  });

  it('ngăn kéo có đủ mục của bảy nút nổi cũ + nút Đe doạ', () => {
    for (const p of ['bag', 'book', 'map', 'phone', 'feedback', 'settings', 'stow']) {
      expect(ui, `ngăn kéo thiếu mục ${p}`).toContain(`p: '${p}'`);
    }
    expect(ui).toContain("p: 'threat'");
    // Nút Đe doạ chỉ hiện từ bậc 4 — đúng điều kiện người chơi dặn.
    expect(ui).toContain('rank >= 4');
  });

  it('nút trong ngăn kéo đủ to để chạm (≥ 44 px) và có hiệu ứng trượt', () => {
    expect(css).toMatch(/#drawer \.dbtn[^}]*min-height: 3\.1em/);
    expect(css).toContain('transform: translateX(103%)');
    expect(css).toContain('#drawer.on .sheet { transform: translateX(0); }');
  });

  it('ngăn kéo đóng lại khi mở bảng khác hoặc khi vào cảnh nấu ăn (không đè lên bảng)', () => {
    expect(ui).toContain('this.closeDrawer(); this.modalName = name;');
    expect(ui).toMatch(/if \(!on\) this\.closeDrawer\(\);/);
  });
});
