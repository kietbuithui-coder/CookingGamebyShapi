import { describe, it, expect } from 'vitest';
import { DEV_BUILD_TAG, DEV_PIN, DEV_PIN_LEN, devPinInput, getDevSections } from '../src/game/devPoints';

describe('menu Test & Dịch chuyển ẩn trong Cài đặt', () => {
  it('chỉ gồm mục của tính năng mới nhất + nhóm địa điểm tele nhanh', () => {
    expect(DEV_BUILD_TAG).toContain('Ông Bảy');
    expect(DEV_BUILD_TAG).toContain('ghim đường đi');
    const sections = getDevSections();
    expect(sections.length).toBe(2);
    expect(sections[0].title.toLowerCase()).toContain('ông bảy');
    expect(sections[0].title).toContain('lượt 52');
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
    // mục của lượt này: xem lời khuyên hiện tại, tele tới Ông Bảy, soát 96 mốc giờ
    for (const id of ['hobo_now', 'hobo_tele', 'hobo_audit']) expect(ids.has(id)).toBe(true);
    // tele nhanh vẫn còn nguyên
    const loc = sections[1].items.map((i) => i.id);
    for (const id of ['tp_equip', 'tp_matbang_tb', 'tp_ongtu', 'tp_scrap2', 'tp_canho', 'tp_hobo', 'tp_mart']) expect(loc).toContain(id);
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
      'phone_cucgach', 'phone_napgap', 'phone_camung', 'phone_unread',
      // lượt 23–24 (app Cửa hàng + công tắc bán)
      'setup_shopapp', 'shopapp_open', 'shopapp_loss', 'shopapp_far',
      // lượt 25 (soát giao diện Android)
      'and_full', 'and_phone3',
      // lượt 26 (cảnh báo sắp hết đồ)
      'short_empty', 'short_prep',
      // lượt 27–28 (hai tổng đài + điểm hẹn lừa đảo)
      'hot_wx', 'hot_scam', 'hot_bust',
      // lượt 30 (nhạc của máy + tin thật trên radio/WAP)
      'music_bgm', 'news_radio', 'news_wap', 'anim_radio', 'anim_wap', 'anim_call',
      // lượt 39 (hạn dùng đồ nguội)
      'spoil_all', 'spoil_meat',
      // lượt 40 (FPS + offline)
      'perf_now', 'offline_try',
      // lượt 41 (lâu hỏng + đau bụng + mức Cao), lượt 42 (nhảy qua vật thấp)
      'rau_lau_hong', 'thit_lau_hong', 'dau_bung', 'cao_that_su', 'nhay_thu', 'nhay_dem',
      // lượt 43 (đứng trên nóc), lượt 44 (bồn hoa/hồ/xe)
      'len_noc', 'noc_cao', 'nhay_bon', 'nhay_ho',
      // lượt 45 (vừa đi vừa nhảy/đấm)
      'vua_di_vua_nhay', 'vua_di_vua_dam',
      // lượt 46 (ít mưa + giảm giá thuê)
      'mua_it', 'gia_cho_re',
      // lượt 47 (hotfix màn hình đen)
      'kiem_tra_tai', 'sua_loi_tai',
      // lượt 48 (ngủ đỡ đói + biển đúng giá)
      'ngu_do_doi', 'bien_gia',
      // lượt 49 (xe chạy đúng đường + còi) — đã thay bằng mục của lượt 52
      'kiem_xe', 'thu_ba_coi']) expect(ids).not.toContain(old);
  });
});

describe('mã PIN của menu ẩn (7777)', () => {
  it('mã là 7777, đúng 4 số', () => {
    expect(DEV_PIN).toBe('7777');
    expect(DEV_PIN_LEN).toBe(4);
    expect(DEV_PIN).toHaveLength(DEV_PIN_LEN);
  });

  it('nhập đủ 4 số đúng thì mở menu', () => {
    let st = { next: '', result: 'more' as string };
    for (const d of DEV_PIN) st = devPinInput(st.next, d);
    expect(st.result).toBe('ok');
    expect(st.next).toBe('7777');
  });

  it('sai một số là xoá sạch, không đoán gần đúng', () => {
    expect(devPinInput('', '9')).toEqual({ next: '', result: 'wrong' });      // sai ngay số đầu
    expect(devPinInput('777', '8')).toEqual({ next: '', result: 'wrong' });    // đúng 3 số rồi sai
    expect(devPinInput('7777', '7').next).toBe('7777');                       // không nhận số thứ 5
  });

  it('nhập thiếu thì chưa mở, và không bao giờ mở khi mã khác 7777', () => {
    for (const bad of ['777', '77', '7', '7778', '1111', '0000', '1234']) {
      let r: { next: string; result: string } = { next: '', result: 'more' };
      for (const d of bad) r = devPinInput(r.next, d);
      expect(r.result, bad).not.toBe('ok');
    }
  });
});
