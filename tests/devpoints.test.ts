import { describe, it, expect } from 'vitest';
import { DEV_BUILD_TAG, getDevSections } from '../src/game/devPoints';

describe('menu Test & Dịch chuyển ẩn trong Cài đặt', () => {
  it('chỉ gồm mục của tính năng mới nhất + nhóm địa điểm tele nhanh', () => {
    expect(DEV_BUILD_TAG).toContain('Quản lý cửa hàng');
    expect(DEV_BUILD_TAG).toContain('bật/tắt bán');
    const sections = getDevSections();
    expect(sections.length).toBe(2);
    expect(sections[0].title).toContain('Quản lý cửa hàng');
    expect(sections[0].title).toContain('lượt 23');
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
    // mục của lượt này: vựa ve chai thứ hai + bấm chuông mở cửa
    for (const id of ['setup_shopapp', 'shopapp_open', 'shopapp_loss', 'shopapp_toggle']) expect(ids.has(id)).toBe(true);
    // tele nhanh vẫn còn, có thêm vựa mới và cửa căn hộ
    const loc = sections[1].items.map((i) => i.id);
    for (const id of ['tp_equip', 'tp_matbang_tb', 'tp_ongtu', 'tp_scrap2', 'tp_canho']) expect(loc).toContain(id);
    for (const id of loc) expect(id.startsWith('tp_')).toBe(true);
  });

  it('không còn sót mục test của các lượt cũ', () => {
    const ids = getDevSections().flatMap((s) => s.items.map((i) => i.id));
    for (const old of ['setup_nhahang_full', 'test_group', 'test_booking', 'hit_light', 'hit_medium', 'hit_heavy',
      'spawn_rude_npc', 'play_chess_std', 'play_chess_puzzle', 'stats_full_125', 'stats_low_hp',
      // lượt 18–20
      'setup_chuoi', 'setup_chuoi_vp', 'setup_chuoi_cv', 'tp_chinhanh', 'branch_fill', 'branch_skip', 'branch_panel', 'branch_keeper', 'branch_close',
      'setup_dicho', 'dicho_send', 'dicho_skip', 'dicho_keeper',
      'setup_baocao', 'baocao_clear', 'book_auto',
      // lượt 21 (vựa ve chai + bấm chuông)
      'setup_vua2', 'vua2_sell', 'bell_canho', 'bell_now',
      // lượt 22 (ba giao diện điện thoại)
      'phone_cucgach', 'phone_napgap', 'phone_camung', 'phone_unread']) expect(ids).not.toContain(old);
  });
});
