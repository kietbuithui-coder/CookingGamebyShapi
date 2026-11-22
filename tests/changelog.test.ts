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
  it('bản mới nhất là bản vừa làm xong (lượt 58)', () => {
    expect(CHANGELOG[0].v).toBe('Lượt 58');
    // Lượt 58 = mini game bánh tráng trộn, 5 topping nằm ngẫu nhiên mỗi ván.
    expect(CHANGELOG[0].items.some((t) => /bánh tráng trộn/i.test(t))).toBe(true);
    expect(CHANGELOG[0].items.some((t) => /ngẫu nhiên|chỗ khác/i.test(t))).toBe(true);
    expect(CHANGELOG[0].items.some((t) => /topping/i.test(t))).toBe(true);
    expect(CHANGELOG[0].tag.length).toBeGreaterThan(5);
    // Bản ngay dưới là lượt 57 (rào cấm đường chặn xe).
    expect(CHANGELOG[1].v).toBe('Lượt 57');
    expect(CHANGELOG[1].items.some((t) => /rào/i.test(t))).toBe(true);
    expect(CHANGELOG[1].items.some((t) => /quay đầu/i.test(t))).toBe(true);
    // rồi tới lượt 56 (mặt Bà Chín) và lượt 55 (sạp Dì Sáu, xuyên quầy, buồng tắm).
    expect(CHANGELOG[2].v).toBe('Lượt 56');
    expect(CHANGELOG[2].items.some((t) => /Bà Chín/i.test(t))).toBe(true);
    expect(CHANGELOG[3].v).toBe('Lượt 55');
    expect(CHANGELOG[3].items.some((t) => /Dì Sáu/i.test(t))).toBe(true);
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
