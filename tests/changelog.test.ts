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
  it('bản mới nhất là bản vừa làm xong (lượt 51)', () => {
    expect(CHANGELOG[0].v).toBe('Lượt 51');
    // Lượt 51 = sửa giao diện theo báo cáo lượt 50 (chồng HUD màn thấp, chạm tương tác, chơi dọc).
    expect(CHANGELOG[0].items.some((t) => /mục tiêu/i.test(t))).toBe(true);
    expect(CHANGELOG[0].items.some((t) => /cần ảo|cần đi/i.test(t))).toBe(true);
    // Người chơi không muốn hai con số chen giữa thanh chỉ số (bản sửa 2026-11-21).
    expect(CHANGELOG[0].items.some((t) => /không còn chen số/i.test(t))).toBe(true);
    expect(CHANGELOG[0].items.some((t) => /chơi dọc/i.test(t))).toBe(true);
    expect(CHANGELOG[0].tag.length).toBeGreaterThan(5);
    // Bản ngay dưới vẫn là lượt 49 (lượt 50 là báo cáo, không phải bản phát hành).
    expect(CHANGELOG[1].v).toBe('Lượt 49');
    expect(CHANGELOG[1].items.some((t) => /gầm cầu/i.test(t))).toBe(true);
    expect(CHANGELOG[1].items.some((t) => /3 màu|Ba màu/i.test(t))).toBe(true);
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
