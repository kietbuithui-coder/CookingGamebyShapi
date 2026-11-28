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
  it('bản mới nhất là bản vừa làm xong (lượt 72 — mặt trái của băng đảng: khách sợ, phí chỗ, đụng độ)', () => {
    expect(CHANGELOG[0].v).toBe('Lượt 72');
    expect(CHANGELOG[0].items.some((t) => /khách bỏ đi|sợ băng/i.test(t))).toBe(true);
    expect(CHANGELOG[0].items.some((t) => /rời băng/i.test(t))).toBe(true);
    expect(CHANGELOG[0].items.some((t) => /đụng độ/i.test(t))).toBe(true);
    expect(CHANGELOG[0].items.some((t) => /Sổ băng|điện thoại/i.test(t))).toBe(true);
    // Lượt 68: người chơi yêu cầu BỎ cơ chế tua đồng hồ ⇒ nhật ký không được nhắc lại nó nữa.
    expect(CHANGELOG[0].items.some((t) => /tua/i.test(t))).toBe(false);
    expect(CHANGELOG[0].tag).not.toMatch(/tua/i);
    // Bản ngay dưới là lượt 71 (băng đảng: phe, bậc, hàng cấm, án phạt).
    expect(CHANGELOG[1].v).toBe('Lượt 71');
    expect(CHANGELOG[1].items.some((t) => /băng/i.test(t))).toBe(true);
    expect(CHANGELOG[1].items.some((t) => /hàng cấm/i.test(t))).toBe(true);
    expect(CHANGELOG[2].v).toBe('Lượt 70');
    expect(CHANGELOG[2].items.some((t) => /góp ý/i.test(t))).toBe(true);
    expect(CHANGELOG[2].items.some((t) => /xe nước mía/i.test(t))).toBe(true);
    expect(CHANGELOG[3].v).toBe('Lượt 69');
    expect(CHANGELOG[3].items.some((t) => /nước mía/i.test(t))).toBe(true);
    expect(CHANGELOG[4].v).toBe('Lượt 67');
    expect(CHANGELOG[4].items.some((t) => /menu ẩn|đi nhanh/i.test(t))).toBe(true);
    expect(CHANGELOG[5].v).toBe('Lượt 66');
    expect(CHANGELOG[5].items.some((t) => /xe ôm/i.test(t))).toBe(true);
    expect(CHANGELOG[6].v).toBe('Lượt 64');
    expect(CHANGELOG[6].items.some((t) => /bàn phím/i.test(t))).toBe(true);
    expect(CHANGELOG[7].v).toBe('Lượt 63');
    // 63 = dọn menu test ẩn, chỉ còn dịch chuyển nhanh.
    expect(CHANGELOG[7].items.some((t) => /dịch chuyển nhanh/i.test(t))).toBe(true);
    expect(CHANGELOG[0].tag.length).toBeGreaterThan(5);
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
