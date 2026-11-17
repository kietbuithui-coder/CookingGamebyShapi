import { describe, it, expect } from 'vitest';
import { DEV_BUILD_TAG, getDevSections } from '../src/game/devPoints';

describe('menu Test & Dịch chuyển ẩn trong Cài đặt', () => {
  it('có đầy đủ danh sách mục test & dịch chuyển không trùng id', () => {
    expect(DEV_BUILD_TAG.length).toBeGreaterThan(10);
    const sections = getDevSections();
    expect(sections.length).toBe(3);
    const ids = new Set<string>();
    for (const sec of sections) {
      expect(sec.items.length).toBeGreaterThan(0);
      for (const item of sec.items) {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
        expect(typeof item.run).toBe('function');
      }
    }
    expect(ids.has('setup_nhahang_full')).toBe(true);
    expect(ids.has('hit_heavy')).toBe(true);
    expect(ids.has('play_chess_std')).toBe(true);
    expect(ids.has('stats_full_125')).toBe(true);
  });
});
