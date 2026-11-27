import { describe, it, expect } from 'vitest';
// @ts-expect-error — chỉ dùng trong test, không cần kiểu của node
import { readFileSync } from 'node:fs';
import { DEV_BUILD_TAG, DEV_PIN, DEV_PIN_LEN, DEV_PIN_LOCK_MS, DEV_PIN_TRIES, DEV_TAPS, devKey, devPinInput, getDevSections } from '../src/game/devPoints';
import { CHANGELOG } from '../src/data/changelog';

describe('menu Test & Dịch chuyển ẩn trong Cài đặt', () => {
  it('nhóm đầu là “Vừa thay đổi” của bản mới nhất; nhóm sau là “Địa điểm — tele nhanh” (lượt 63 + 69)', () => {
    const sections = getDevSections();
    // Lượt 69: người chơi yêu cầu menu có MỘT mục “vừa thay đổi” để người làm game bấm là thử được ngay.
    // Nhóm đó tự dựng từ `latestSteps()` và chỉ giữ mục của CHANGELOG[0] ⇒ sang lượt sau nó tự đổi/gọn lại.
    expect(sections.length).toBe(2);
    expect(sections[0].title).toContain('Vừa thay đổi');
    expect(sections[0].title).toContain(CHANGELOG[0].v);
    expect(sections[0].items.length).toBeGreaterThanOrEqual(3);
    for (const it of sections[0].items) {
      expect(it.id.startsWith('mx_')).toBe(true);
      expect(typeof it.run).toBe('function');
      expect(it.label.length).toBeGreaterThan(5);
      expect(it.sub.length).toBeGreaterThan(10);
    }
    expect(sections[1].title).toContain('Địa điểm');
    // Không còn mục test cũ nào trong nhóm đi nhanh: mọi mã đều phải là `tp_…`.
    const ids = sections[1].items.map((i) => i.id);
    expect(ids.length).toBeGreaterThan(5);
    for (const id of ids) expect(id.startsWith('tp_')).toBe(true);
    // Lượt 67: các mục cũ đổi tên theo đúng người/chỗ (tp_ongtu → tp_danh_co), và thêm mục cho mọi
    // nhân vật cố định ngoài phố. Đòi cả nhóm cốt lõi lẫn ba mục mới của lượt 66–67.
    for (const id of ['tp_equip', 'tp_matbang_tb', 'tp_danh_co', 'tp_scrap2', 'tp_canho', 'tp_hobo', 'tp_mart',
      'tp_chu_ba', 'tp_wholesale', 'tp_kiosk', 'tp_tro', 'tp_hotel', 'tp_motel', 'tp_hospital', 'tp_police',
      'tp_tra_da', 'tp_sua_xe', 'tp_hat_rong', 'tp_danh_giay', 'tp_rap', 'tp_dua', 'tp_net', 'tp_cafe']) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of sections[1].items) {
      expect(typeof item.run).toBe('function');
      expect(item.label.length).toBeGreaterThan(3);
      expect(item.sub.length).toBeGreaterThan(3);
    }
    // Dòng mô tả bản dựng vẫn còn (để biết đang chơi bản nào).
    expect(DEV_BUILD_TAG.length).toBeGreaterThan(10);
  });

  it('nhóm “Vừa thay đổi” tự dọn: chỉ giữ mục của CHANGELOG[0], sang bản sau là mục cũ rơi ra', () => {
    const src = readFileSync('src/game/devPoints.ts', 'utf8');
    // Nguồn: danh sách mục khai `since`, và `latestSteps()` lọc đúng theo `CHANGELOG[0].v` — không có mảng viết tay
    // nào phải nhớ dọn mỗi lượt.
    expect(src).toContain('interface DevStep');
    expect(src).toContain('x.since === v');
    expect(src).toContain('const v = CHANGELOG[0]?.v');
    const src69 = readFileSync('src/game/devPoints.ts', 'utf8').match(/since: 'Lượt (\d+)'/g) ?? [];
    expect(src69.length).toBeGreaterThanOrEqual(3);
    // Mánh: nếu ai đó khai `since` của bản cũ mà quên xoá thì nhóm sẽ rỗng dần — test đòi ít nhất 3 mục ở bản mới nhất.
    expect(getDevSections()[0].items.length).toBeGreaterThanOrEqual(3);
    // Mục “vừa thay đổi” KHÔNG đụng đồng hồ (cùng luật với đi nhanh từ lượt 68). Chỉ soát phần `latestSteps()` —
    // trong tệp còn `setupChain()` của các lượt trước vẫn đặt `g.min` khi dựng sẵn chuỗi cửa hàng.
    const block = src.slice(src.indexOf('function latestSteps'), src.indexOf('export function getDevSections'));
    expect(block.length).toBeGreaterThan(500);
    expect(block).not.toMatch(/g\.min\s*=/);
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
      // lượt 49 (xe chạy đúng đường + còi), lượt 52 (Ông Bảy) — đã thay bằng mục của lượt 53
      'kiem_xe', 'thu_ba_coi', 'hobo_now', 'hobo_tele', 'hobo_audit',
      // lượt 53 (thanh chạy theo máu/pin), lượt 54 (bánh + Shapi) — đã thay bằng mục của lượt 56
      'stam_now', 'stam_compare', 'stam_hurt', 'stam_heal',
      'banh_list', 'banh_tele', 'shapi_drink', 'shapi_tele',
      // lượt 55 (sạp Dì Sáu, xuyên quầy, kẹt giường, buồng tắm) — đã thay từ lượt 56
      't55_sap_tensach', 't55_sap_tele', 't55_ngu_nhanghi', 't55_ngu_tro',
      't55_sen_nhanghi', 't55_sen_tro', 't55_ganh_cho',
      // lượt 56 (mặt Bà Chín), lượt 57 (rào cấm đường chặn xe) — đã thay bằng mục của lượt 58
      't56_mat_soi', 't56_mat_so_sanh', 't56_vua_tu_rac',
      't57_cam_duong_bat', 't57_cam_duong_do', 't57_cam_duong_tat',
      // lượt 58 (bánh tráng trộn) — đã thay bằng mục của lượt 59
      't58_tron_setup', 't58_tron_choi', 't58_tron_do']) expect(ids).not.toContain(old);
  });
});

describe('bàn phím PIN của menu ẩn (lượt 64)', () => {
  it('mã khó đoán: 6 số, không lặp, không phải dãy số hiển nhiên', () => {
    expect(DEV_PIN_LEN).toBe(6);
    expect(DEV_PIN).toHaveLength(DEV_PIN_LEN);
    expect(new Set(DEV_PIN).size).toBe(DEV_PIN_LEN);          // không có số nào lặp lại
    expect(DEV_PIN).not.toBe('7777');
    for (const dãy of ['123456', '654321', '111111', '000000', '438290']) expect(DEV_PIN).not.toBe(dãy);
  });

  it('nhập đủ 6 số đúng thì mở menu', () => {
    let st = { next: '', result: 'more' as string };
    for (const d of DEV_PIN) st = devKey(st.next, d);
    expect(st.result).toBe('ok');
    expect(st.next).toBe(DEV_PIN);
  });

  /**
   * LỖI NGƯỜI CHƠI BÁO: “chỉ nhập được số 7”. Bàn phím cũ so tiền tố từng số, nên gõ 4 (chữ số đầu khác 7)
   * là bị xoá ngay lập tức ⇒ tưởng bàn phím chỉ nhận số 7. Nay gõ số nào cũng được, đủ 6 số mới phán.
   */
  it('gõ được MỌI chữ số, không đá ra giữa chừng', () => {
    for (const d of '0123456789') {
      const r = devKey('', d);
      expect(r.result, 'số ' + d).toBe('more');
      expect(r.next).toBe(d);
    }
    // Gõ dở một mã sai vẫn giữ nguyên các số đã gõ, không xoá sạch.
    let st = { next: '', result: 'more' as string };
    for (const d of '4382') st = devKey(st.next, d);
    expect(st).toEqual({ next: '4382', result: 'more' });
  });

  it('nút XOÁ ⌫ xoá một số, nút C xoá sạch', () => {
    expect(devKey('4382', 'del')).toEqual({ next: '438', result: 'del' });
    expect(devKey('4382', '')).toEqual({ next: '438', result: 'del' });      // ô trống cũng là xoá
    expect(devKey('', 'del')).toEqual({ next: '', result: 'del' });          // xoá khi đã trống: không lỗi
    expect(devKey('4382', 'clear')).toEqual({ next: '', result: 'del' });
    // Xoá bớt rồi gõ lại đúng mã vẫn mở được.
    let st = { next: '', result: 'more' as string };
    for (const d of '439') st = devKey(st.next, d);
    st = devKey(st.next, 'del');                                            // 43
    st = devKey(st.next, 'del');                                            // 4
    for (const d of '38291') st = devKey(st.next, d);
    expect(st.result).toBe('ok');
  });

  it('đủ 6 số mà sai thì xoá sạch, và KHÔNG nói sai ở số nào', () => {
    let r = { next: '', result: 'more' as string };
    for (const d of '111111') r = devKey(r.next, d);
    expect(r).toEqual({ next: '', result: 'wrong' });
    // Sai ở số cuối cũng chỉ trả về “wrong” trống — không lộ vị trí sai.
    let r2 = { next: '', result: 'more' as string };
    for (const d of DEV_PIN.slice(0, -1) + '0') r2 = devKey(r2.next, d);
    expect(r2.result).toBe('wrong');
    expect(r2.next).toBe('');
  });

  it('không nhận phím lạ và không nhận quá 6 số', () => {
    expect(devKey('438', 'x')).toEqual({ next: '438', result: 'more' });
    expect(devKey(DEV_PIN_LEN === 6 ? DEV_PIN.slice(0, 5) : '', '1').next).toHaveLength(DEV_PIN_LEN);
  });

  it('chống dò: sai 5 lần là khoá 30 giây, và bấm 8 lần mới hiện bàn phím', () => {
    expect(DEV_PIN_TRIES).toBe(5);
    expect(DEV_PIN_LOCK_MS).toBe(30000);
    expect(DEV_TAPS).toBe(8);
  });

  it('tên cũ devPinInput vẫn dùng được (tương thích)', () => {
    expect(devPinInput).toBe(devKey);
  });

  /**
   * Lượt 63: người chơi yêu cầu xoá hết mục test, chỉ giữ nhóm dịch chuyển nhanh.
   * Giữ lại bài canh NGUỒN của hàm dựng bếp trà (`chuanBiNoi`) để nếu sau này dùng lại thì vẫn đúng thứ tự
   * “tiền → gánh → đặt chỗ → dụng cụ → nhiên liệu”, nhưng không đòi mục test phải còn trong menu.
   */
  it('hàm dựng bếp trà (nếu còn dùng) vẫn mua gánh TRƯỚC khi đặt chỗ và cho đủ than', () => {
    const src = readFileSync('src/game/devPoints.ts', 'utf8');
    if (!src.includes('function chuanBiNoi')) return;   // đã xoá hẳn cùng các mục test
    const fn = src.slice(src.indexOf('function chuanBiNoi'), src.indexOf('export function getDevSections'));
    expect(fn).toContain('g.cash < 400000');
    expect(fn.indexOf('buyGear')).toBeLessThan(fn.indexOf('placeAt'));
    for (const id of ['ganh', 'bepthan', 'noi', 'daothot']) expect(fn).toContain(`'${id}'`);
    expect(fn).toContain('than');
  });

  /**
   * Đúng lỗi người chơi báo: “chỉ nhập được số 7”. Nguyên nhân là `startsWith` (so tiền tố) — gõ số đầu khác 7
   * là bị đá ra ngay. Bài này canh mã nguồn để không ai vô tình đưa kiểu so tiền tố trở lại.
   */
  it('không so tiền tố từng số (nguyên nhân lỗi “chỉ nhập được số 7”)', () => {
    const src = readFileSync('src/game/devPoints.ts', 'utf8');
    const fn = src.slice(src.indexOf('export function devKey'), src.indexOf('/** Tên cũ của `devKey`'));
    expect(fn).not.toContain('startsWith');
    // Chỉ phán đúng/sai khi đã gõ đủ số.
    expect(fn).toContain('next.length < DEV_PIN_LEN');
    // Có nhánh xoá.
    expect(fn).toContain("'del'");
    // Bàn phím trong UI phải có nút xoá và nút xoá sạch.
    const ui = readFileSync('src/ui/panels.ts', 'utf8');
    expect(ui).toContain('key(\'del\'');
    expect(ui).toContain('key(\'clear\'');
    // Không dùng hình ⌫ nữa (phông game không có ký tự đó).
    expect(ui).not.toContain('⌫');
  });
});

/**
 * Lượt 67 — người chơi: *“chưa cập nhật menu ẩn và các tính năng được sửa”*.
 *
 * Ba lỗi thật của menu ẩn sau lượt 66:
 * 1. Dòng “Phiên bản mới nhất” viết tay, đứng nguyên ở bản lượt 62 suốt bốn lượt.
 * 2. Mục Chú Ba đứng cách ổng 2,4 m (lệch góc) thay vì sát bên; nhiều nhân vật ngoài phố (vựa sỉ, tạp hoá,
 *    nhà trọ, khách sạn, bệnh viện, công an, cô hát rong, bé đánh giày, Bin, nhóm đua, quán net, cà phê…)
 *    không có mục nào để tới.
 * 3. Bấm “Chạy” lúc nơi đó đóng cửa thì tới nơi chẳng có ai (người bán đi ngủ).
 */
describe('menu ẩn — mục đi nhanh khớp dữ liệu thật (lượt 67)', () => {
  const items = () => getDevSections().flatMap((s) => s.items);
  /** Gom neo khai trong `src/world`: `b.anchor('v_xxx', …)`. */
  const anchorsInCode = () => {
    // Lượt 69: thêm `mia` — xe nước mía và quán Nước Mía 3K dựng trong tệp riêng `src/world/mia.ts`.
    const src = ['city', 'places', 'side', 'mia'].map((f) => readFileSync(`src/world/${f}.ts`, 'utf8')).join('\n');
    const out = new Set<string>();
    for (const m of src.matchAll(/anchor\(\s*'([^']+)'/g)) out.add(m[1]);
    // Neo dựng qua biến: `b.anchor('v_' + shop, …)` và `'v_' + (l.id ?? 'scrap')` ⇒ khai tường minh.
    for (const m of src.matchAll(/anchor\(\s*'v_' \+\s*(\w+)/g)) {
      void m;
    }
    for (const s of ['m_rau', 'm_cu', 'm_thit', 'm_haisan', 'm_kho', 'm_giavi', 'm_trung', 'bakery', 'kiosk', 'pawn', 'pharmacy']) out.add('v_' + s);
    for (const s of ['scrap', 'scrap2']) out.add('v_' + s);
    return out;
  };

  it('dòng “Bản mới nhất” không viết tay: luôn bằng tóm tắt bản mới nhất trong nhật ký', () => {
    expect(DEV_BUILD_TAG).toBe(CHANGELOG[0].tag);
    expect(DEV_BUILD_TAG).not.toMatch(/đá viên tan chậm/i);   // câu của lượt 62 phải biến mất
    expect(DEV_BUILD_TAG.length).toBeGreaterThan(20);
    // Nguồn: không được viết cứng chuỗi nữa.
    const src = readFileSync('src/game/devPoints.ts', 'utf8');
    const line = src.split('\n').find((l: string) => l.startsWith('export const DEV_BUILD_TAG'))!;
    expect(line).toContain('CHANGELOG[0]');
  });

  it('mỗi mục tp_… khai một neo CÓ THẬT trong src/world (dời/xoá nhân vật là test đỏ)', () => {
    const have = anchorsInCode();
    const withAnchor = items().filter((i) => i.anchor);
    expect(withAnchor.length).toBeGreaterThanOrEqual(25);
    for (const it of withAnchor) expect(have, `mục ${it.id} trỏ vào neo ${it.anchor}`).toContain(it.anchor!);
  });

  it('phủ hết nhân vật cố định ngoài phố: mỗi người có đúng một mục đi nhanh', () => {
    const anchors = items().filter((i) => i.anchor).map((i) => i.anchor!);
    for (const a of ['v_chu_ba', 'v_hobo', 'v_tra_da', 'v_sua_xe', 'v_hat_rong', 'v_danh_co', 'v_danh_giay',
      'v_rap', 'v_dua', 'v_net', 'v_cafe', 'v_wholesale', 'v_kiosk', 'v_bank', 'v_pawn', 'v_hot_toc',
      'v_thoi_trang', 'v_tro', 'v_hotel', 'v_motel', 'v_hospital', 'v_police', 'v_scrap2', 'v_mart', 'v_eatery',
      'v_pharmacy', 'bell_canho']) expect(anchors, 'thiếu mục tới ' + a).toContain(a);
    // Không mục nào trùng neo (bấm hai chỗ ra cùng một người là dấu hiệu copy-paste).
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  /**
   * Lượt 68: người chơi yêu cầu **bỏ hẳn** cơ chế tua đồng hồ của lượt 67 — “đi nhanh” không được phép
   * nhảy cả giờ trong ngày, vì như thế là menu sửa luật chơi chứ không còn là chỗ đi nhanh.
   * Bài này canh cả ba chỗ từng tua giờ: `openNow()`, tuỳ chọn `hour` của `tpNear`, và mục `tp_equip`
   * tự đẩy `g.min` lên 10 giờ.
   */
  it('đi nhanh KHÔNG đụng tới đồng hồ (không tua giờ, không đẩy giờ lên)', () => {
    const src = readFileSync('src/game/devPoints.ts', 'utf8');
    expect(src).not.toContain('function openNow(');
    expect(src).not.toContain('openNow(');
    expect(src).not.toContain('hour?: boolean');
    expect(src).not.toContain("import { PLACE_HOURS }");
    expect(src).not.toContain("import { SHOPS }");
    // Không mục nào được gán `g.min`.
    const sections = src.slice(src.indexOf('export function getDevSections'));
    expect(sections).not.toMatch(/g\.min\s*=/);
    // Vẫn giữ phần chống kẹt + quay mặt vào người đó (thứ duy nhất menu được làm với người chơi).
    const near = src.slice(src.indexOf('function tpNear('), src.indexOf('/** Đi tới điểm đặt quầy'));
    expect(near).toContain('ctx.world.blocked');
    expect(near).toContain('Math.atan2(a.x - x, a.z - z)');       // quay mặt VÀO người đó
    expect(near).not.toContain('ctx.g.min');
  });

  it('nhãn nút khoá đọc DEV_TAPS, không viết cứng “7 lần”', () => {
    const ui = readFileSync('src/ui/panels.ts', 'utf8');
    expect(ui).toContain('Ẩn & khoá lại (${DEV_TAPS} lần + mã PIN)');
    expect(ui).not.toContain('(7 lần + mã PIN)');
  });
});
