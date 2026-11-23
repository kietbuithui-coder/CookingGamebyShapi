// Nhật ký phát triển: đọc được trong Cài đặt, chỉ giữ các bản gần đây, mục mới nhất ở trên.
import { describe, it, expect } from 'vitest';
import { CHANGELOG } from '../src/data/changelog';

describe('nhật ký phát triển trong Cài đặt', () => {
  it('có danh sách bản, mới nhất ở đầu, không quá 8 bản', () => {
    expect(CHANGELOG.length).toBeGreaterThan(0);
    expect(CHANGELOG.length).toBeLessThanOrEqual(8);
    const nums = CHANGELOG.map((e) => Number(e.v.replace(/\D/g, '')));
    expect(nums.every((n) => n > 0)).toBe(true);
    const sorted = [...nums].sort((a, b) => b - a);
    expect(nums).toEqual(sorted);              // bản mới nhất ở trên cùng
    expect(new Set(nums).size).toBe(nums.length);
  });
  it('bản mới nhất là bản vừa làm xong (lượt 66 — xe ôm Chú Ba)', () => {
    expect(CHANGELOG[0].v).toBe('Lượt 66');
    expect(CHANGELOG[0].items.some((t) => /xe ôm/i.test(t))).toBe(true);
    expect(CHANGELOG[0].items.some((t) => /danh bạ/i.test(t))).toBe(true);
    // bản ngay dưới là lượt 64 (bàn phím mã PIN của menu ẩn)
    expect(CHANGELOG[1].v).toBe('Lượt 64');
    expect(CHANGELOG[1].items.some((t) => /bàn phím/i.test(t))).toBe(true);
    expect(CHANGELOG[2].v).toBe('Lượt 63');
    // 63 = dọn menu test ẩn, chỉ còn dịch chuyển nhanh.
    expect(CHANGELOG[2].items.some((t) => /dịch chuyển nhanh/i.test(t))).toBe(true);
    expect(CHANGELOG[3].v).toBe('Lượt 62');
    // 62 = ×3 thời gian tan của đá + nhãn “độ lạnh” thay cho “tươi/hỏng”.
    expect(CHANGELOG[3].items.some((t) => /tan chậm|3 lần/.test(t))).toBe(true);
    expect(CHANGELOG[3].items.some((t) => /lạnh/.test(t))).toBe(true);
    expect(CHANGELOG[0].tag.length).toBeGreaterThan(5);
    // Bản ngay dưới là lượt 61 (menu ẩn dựng sẵn bếp trà), rồi lượt 60 (sửa lỗi chạm chén không vào nồi).
    expect(CHANGELOG[4].v).toBe('Lượt 61');
    expect(CHANGELOG[4].items.some((t) => /trà chanh/i.test(t))).toBe(true);
    expect(CHANGELOG[5].v).toBe('Lượt 60');
    expect(CHANGELOG[5].items.some((t) => /mặt nước/i.test(t))).toBe(true);
  });
  it('mỗi bản có tóm tắt và ít nhất 2 việc đã làm, câu chữ đủ dài để đọc hiểu', () => {
    for (const e of CHANGELOG) {
      expect(e.v).toMatch(/^Lượt \d+$/);
      expect(e.tag.length).toBeGreaterThan(8);
      expect(e.items.length).toBeGreaterThanOrEqual(2);
      for (const t of e.items) expect(t.trim().length).toBeGreaterThan(20);
    }
  });
  it('không lặp câu giữa các bản', () => {
    const all = CHANGELOG.flatMap((e) => e.items);
    expect(new Set(all).size).toBe(all.length);
  });
});
