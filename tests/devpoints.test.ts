import { describe, it, expect } from 'vitest';
import { DEV_BUILD_TAG, getDevSections } from '../src/game/devPoints';

describe('menu Test & Dịch chuyển ẩn trong Cài đặt', () => {
  it('chỉ gồm mục của tính năng mới nhất + nhóm địa điểm tele nhanh', () => {
    expect(DEV_BUILD_TAG).toContain('Bậc 7');
    const sections = getDevSections();
    expect(sections.length).toBe(2);
    expect(sections[0].title).toContain('Bậc 7');
    expect(sections[1].title).toContain('Địa điểm');
    const ids = new Set<string>();
    for (const sec of sections) {
      expect(sec.items.length).toBeGreaterThan(0);
      for (const item of sec.items) {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
        expect(typeof item.run).toBe('function');
        expect(item.label.length).toBeGreaterThan(3);
        expect(item.sub.length).toBeGreaterThan(3);
      }
    }
    // mục mới của lượt 18
    for (const id of ['setup_chuoi', 'setup_chuoi_vp', 'setup_chuoi_cv', 'tp_chinhanh', 'branch_fill', 'branch_skip', 'branch_panel', 'branch_keeper', 'branch_close']) {
      expect(ids.has(id)).toBe(true);
    }
    // tele nhanh vẫn còn
    const loc = sections[1].items.map((i) => i.id);
    expect(loc).toContain('tp_equip');
    expect(loc).toContain('tp_matbang_tb');
    expect(loc).toContain('tp_ongtu');
    for (const id of loc) expect(id.startsWith('tp_')).toBe(true);
  });

  it('không còn sót mục test của các lượt cũ', () => {
    const ids = getDevSections().flatMap((s) => s.items.map((i) => i.id));
    for (const old of ['setup_nhahang_full', 'test_group', 'test_booking', 'hit_light', 'hit_medium', 'hit_heavy', 'spawn_rude_npc', 'play_chess_std', 'play_chess_puzzle', 'stats_full_125', 'stats_low_hp']) {
      expect(ids).not.toContain(old);
    }
  });
});
