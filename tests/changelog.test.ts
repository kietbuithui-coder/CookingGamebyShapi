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
  it('bản mới nhất là bản vừa làm xong (lượt 60 — sửa lỗi nồi nấu)', () => {
    expect(CHANGELOG[0].v).toBe('Lượt 60');
    // 60 = chạm chén không vào được nồi ở mọi món nấu/ninh/luộc/pha.
    expect(CHANGELOG[0].items.some((t) => /nồi/i.test(t))).toBe(true);
    expect(CHANGELOG[0].items.some((t) => /trà/i.test(t))).toBe(true);
    expect(CHANGELOG[0].tag.length).toBeGreaterThan(5);
    // Bản ngay dưới là lượt 59 (trần việc làm + bảng việc làm).
    expect(CHANGELOG[1].v).toBe('Lượt 59');
    expect(CHANGELOG[1].items.some((t) => /ca bốc cá/i.test(t))).toBe(true);
    // rồi tới lượt 58 (bánh tráng trộn) và lượt 57 (rào cấm đường).
    expect(CHANGELOG[2].v).toBe('Lượt 58');
    expect(CHANGELOG[2].items.some((t) => /topping/i.test(t))).toBe(true);
    expect(CHANGELOG[3].v).toBe('Lượt 57');
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
