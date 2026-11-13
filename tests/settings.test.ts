// Cài đặt giao diện do người chơi tự chỉnh: dữ liệu đọc từ bộ nhớ trình duyệt có thể thiếu, hỏng, hoặc bị sửa tay.
import { describe, it, expect } from 'vitest';
import { cleanLayout, UI_SCALE, BTN_SCALE, BTN_KEYS } from '../src/game/ctx';

describe('bố cục nút do người chơi tự xếp', () => {
  it('chưa có gì thì dùng mặc định: cỡ 100%, không nút nào bị dời', () => {
    for (const raw of [null, undefined, 'abc', 42, {}]) expect(cleanLayout(raw)).toEqual({ scale: 1, L: {}, P: {} });
  });
  it('giữ nguyên dữ liệu hợp lệ, riêng cho màn ngang và màn dọc', () => {
    const raw = { scale: 1.2, L: { act: { x: -0.5, y: -0.1, s: 1.3 } }, P: { run: { x: 0.1, y: 0.2, s: 0.8 } } };
    expect(cleanLayout(raw)).toEqual(raw);
  });
  it('ép các số vượt giới hạn về trong khoảng cho phép', () => {
    const u = cleanLayout({ scale: 9, L: { act: { x: 7, y: -7, s: 0.01 }, cook: { x: 0, y: 0, s: 99 } } });
    expect(u.scale).toBe(UI_SCALE[1]);
    expect(u.L.act).toEqual({ x: 1, y: -1, s: BTN_SCALE[0] });
    expect(u.L.cook!.s).toBe(BTN_SCALE[1]);
    expect(cleanLayout({ scale: 0 }).scale).toBe(UI_SCALE[0]);
  });
  it('bỏ qua kiểu dữ liệu sai và tên nút lạ', () => {
    const u = cleanLayout({ scale: 'to', L: { act: 'giữa', khong_co: { x: 0, y: 0, s: 1 }, run: { x: NaN, y: 'a', s: null } }, P: [1, 2] });
    expect(u.scale).toBe(1);
    expect(u.L.act).toBeUndefined();
    expect((u.L as any).khong_co).toBeUndefined();
    expect(u.L.run).toEqual({ x: 0, y: 0, s: 1 });      // từng trường hỏng thì về mặc định của trường đó
    expect(u.P).toEqual({});
  });
  it('có đủ sáu nhóm nút: tương tác, chạy, đấm, nhảy, hàng nút menu, nút nấu ăn', () => {
    expect([...BTN_KEYS].sort()).toEqual(['act', 'cook', 'hit', 'jump', 'menu', 'run']);
  });
});
