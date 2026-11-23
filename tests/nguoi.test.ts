// Kiểm thử lượt 31 (mục §5): ngoại hình sâu hơn (dáng người, râu, nón), thể trạng ảnh hưởng tới đi đứng,
// câu thoại riêng của từng nhân vật cố định, và ca làm của người phụ quầy.
import { describe, expect, it } from 'vitest';
import { Game, SAVE_VERSION, migrate, newGame } from '../src/sim/state';
import { defaultLook, cleanLook, SHAPES, HATS } from '../src/data/looks';
import { LINES, REGULARS, FIXED, fillLine, ownLine, ARCH } from '../src/data/people';
import * as R from '../src/sim/rules';

function boot(seed = 7): Game {
  return newGame(seed, 'anh');
}
/** Ván cũ ở phiên bản `v` (đọc qua migrate để kiểm phần nâng cấp bản lưu). */
function oldSave(v: number, seed = 3): Game {
  const g = newGame(seed, 'anh');
  const raw = { ...JSON.parse(JSON.stringify(g)), v };
  return migrate(raw)!;
}

describe('ngoại hình: dáng người, râu, nón', () => {
  it('ván mới: nam sạch râu, nữ luôn 0 râu', () => {
    expect(defaultLook(false).beard).toBe(0);
    expect(defaultLook(true).beard).toBe(0);
    expect(defaultLook(false).fat).toBe(1);
  });

  it('bản lưu cũ (chưa có trường beard) vẫn đọc được; râu chỉ dành cho nam', () => {
    const old = { ...defaultLook(false) } as any;
    delete old.beard;
    expect(cleanLook(old, false).beard).toBe(0);
    // nữ khai râu cũng bị dẹp về 0
    expect(cleanLook({ ...defaultLook(true), beard: 3, fem: true }, true).beard).toBe(0);
    // nam để râu 3 thì giữ 3
    expect(cleanLook({ ...defaultLook(false), beard: 3 }, false).beard).toBe(3);
    // số rác ngoài khoảng thì kẹp lại
    expect(cleanLook({ ...defaultLook(false), beard: 99 }, false).beard).toBe(3);
    expect(cleanLook({ ...defaultLook(false), beard: -5 }, false).beard).toBe(0);
  });

  it('ba dáng người có fat/h khác nhau và vẫn nằm trong giới hạn cleanLook cho phép', () => {
    expect(SHAPES).toHaveLength(3);
    for (const sh of SHAPES) {
      const l = cleanLook({ ...defaultLook(false), fat: sh.fat, h: sh.h }, false);
      expect(l.fat).toBeCloseTo(sh.fat, 5);
      expect(l.h).toBeCloseTo(sh.h, 5);
    }
    expect(SHAPES[0].fat).toBeLessThan(SHAPES[2].fat);
  });

  it('bốn lựa chọn nón, "không đội" luôn miễn phí', () => {
    expect(HATS).toHaveLength(4);
    expect(HATS[0].col).toBe(0);
    expect(HATS[0].price).toBe(0);
    expect(new Set(HATS.map((h) => h.col)).size).toBe(4);
  });
});

describe('thể trạng ảnh hưởng tới đi đứng', () => {
  it('gọn đi nhanh nhất, đậm chậm nhất; hao sức thì ngược lại', () => {
    expect(R.BODY_SPEED[0]).toBeGreaterThan(R.BODY_SPEED[1]);
    expect(R.BODY_SPEED[1]).toBeGreaterThan(R.BODY_SPEED[2]);
    expect(R.BODY_DRAIN[0]).toBeGreaterThan(R.BODY_DRAIN[2]);
  });

  it('bodyType đọc đúng từ g.look.fat', () => {
    const g = boot();
    g.look.fat = 0.9; expect(R.bodyType(g)).toBe(0);
    g.look.fat = 1; expect(R.bodyType(g)).toBe(1);
    g.look.fat = 1.12; expect(R.bodyType(g)).toBe(2);
  });

  it('moveMul khác nhau giữa ba dáng khi cùng thời tiết, cùng chỗ', () => {
    const g = boot();
    const at = (fat: number) => { g.look.fat = fat; return R.moveMul(g, g.pos.x, g.pos.z); };
    const a = at(0.9), b = at(1), c = at(1.12);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
    // chênh lệch có thật nhưng không tới mức làm hỏng nhịp chơi (dưới 15%)
    expect(a / c).toBeLessThan(1.15);
  });
});

describe('câu thoại riêng của nhân vật cố định', () => {
  it('điền {you}/{self} theo nhân vật và cách gọi người chơi', () => {
    const n = { fem: false, arch: ARCH.hangrong }, you = ARCH.hangrong.you.replace('{ac}', 'chị');
    const out = fillLine('Dạ {you} ơi, {self} tới rồi.', n, 'chị');
    expect(out).not.toContain('{');
    expect(out).toContain(you);
    expect(out).toContain(ARCH.hangrong.self[0]);
    // đổi sang nhân vật nữ thì cách tự gọi cũng đổi
    expect(fillLine('{self}', { fem: true, arch: ARCH.hangrong }, 'anh')).toBe(ARCH.hangrong.self[1]);
  });

  it('mỗi nhân vật cố định có câu riêng đều nằm trong FIXED, và mọi câu đều điền được', () => {
    const ids = Object.keys(LINES.own);
    expect(ids.length).toBeGreaterThanOrEqual(15);
    for (const id of ids) {
      expect(FIXED[id], `LINES.own có "${id}" nhưng FIXED không có người này`).toBeTruthy();
      const f = FIXED[id], arch = ARCH.taixe;
      for (const line of LINES.own[id]) {
        expect(line.length).toBeGreaterThan(8);
        const out = ownLine(id, { fem: f.fem, arch }, 'anh', 0);
        expect(out).not.toBeNull();
        expect(out!).not.toMatch(/\{(you|self|Self)\}/);
      }
    }
  });

  it('ownLine xoay câu theo k, người không có câu riêng thì trả null', () => {
    const n = { fem: false, arch: ARCH.taixe };
    const a = ownLine('hobo', n, 'anh', 0), b = ownLine('hobo', n, 'anh', 1);
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
    // k âm vẫn ra câu hợp lệ (không văng lỗi mảng)
    expect(ownLine('hobo', n, 'anh', -7)).toBeTruthy();
    expect(ownLine('khong_co_nguoi_nay', n, 'anh', 0)).toBeNull();
    expect(ownLine(undefined, n, 'anh', 0)).toBeNull();
  });

  it('không nhân vật nào nói câu "đứng đầu hẻm" (bài canh câu bịa trước đây)', () => {
    const all = JSON.stringify(LINES.own).toLowerCase();
    expect(all).not.toContain('đầu hẻm');
    // Từ lượt 66 Chú Ba xe ôm là người THẬT đứng dưới gầm cầu (FIXED.chu_ba + neo v_chu_ba),
    // nên câu của ổng được phép nói đúng chỗ đứng thật — nhưng vẫn không được bịa “đầu hẻm”.
    expect(all).toContain('xe ôm chú ba');
    expect(FIXED.chu_ba).toBeTruthy();
  });
});

describe('ca làm của người phụ quầy', () => {
  it('ca sáng 5–14h, ca chiều 14–22h, cả ngày 5–22h', () => {
    const g = boot();
    const at = (h: number) => { g.day = 1; g.min = Math.ceil(h * 60); };
    g.helpShift = { 1: 'sang', 2: 'chieu' };
    at(5); expect(R.onShift(g, 1)).toBe(true); expect(R.onShift(g, 2)).toBe(false);
    at(10); expect(R.onShift(g, 1)).toBe(true); expect(R.onShift(g, 2)).toBe(false);
    at(14); expect(R.onShift(g, 1)).toBe(false); expect(R.onShift(g, 2)).toBe(true);
    at(21.5); expect(R.onShift(g, 1)).toBe(false); expect(R.onShift(g, 2)).toBe(true);
    at(22.5); expect(R.onShift(g, 1)).toBe(false); expect(R.onShift(g, 2)).toBe(false);
    // 4h sáng chưa ai tới
    at(4); expect(R.onShift(g, 1)).toBe(false); expect(R.onShift(g, 2)).toBe(false);
  });

  it('cả ngày thì có mặt cả sáng lẫn chiều', () => {
    const g = boot();
    g.helpShift = { 1: 'full', 2: 'full' };
    g.day = 1;
    g.min = 9 * 60; expect(R.onShift(g, 1) && R.onShift(g, 2)).toBe(true);
    g.min = 18 * 60; expect(R.onShift(g, 1) && R.onShift(g, 2)).toBe(true);
    expect(R.shiftLeft(g, 1)).toBe((22 - 18) * 60);
  });

  it('bản lưu cũ (v15, chưa có helpShift) vẫn mở được: người 1 cả ngày, người 2 ca sáng', () => {
    const g = oldSave(15);
    expect(g).toBeTruthy();
    expect(g.helpShift).toEqual({ 1: 'full', 2: 'sang' });
    // ca rác trong bản lưu bị bỏ, không làm hỏng trạng thái
    const raw = { ...JSON.parse(JSON.stringify(newGame(3, 'anh'))), v: 16, helpShift: { 1: 'xyz', 2: 'chieu' } };
    const g2 = migrate(raw)!;
    expect(g2.helpShift).toEqual({ 1: 'full', 2: 'chieu' });
  });

  it('bản lưu v16 sau khi đọc lại vẫn giữ đúng ca đã chọn', () => {
    const g = boot();
    g.helpShift = { 1: 'chieu', 2: 'sang' };
    const raw = { ...JSON.parse(JSON.stringify(g)), v: SAVE_VERSION };
    const g2 = migrate(raw)!;
    expect(g2.helpShift).toEqual({ 1: 'chieu', 2: 'sang' });
    expect(g2.v).toBe(SAVE_VERSION);
  });

  it('khách quen vẫn là khách quen, không bị đổi thành nhân viên', () => {
    const g = boot();
    expect(REGULARS.find((r) => r.id === 'chu_ba')?.name).toBe('Chú Ba xe ôm');
    expect(g.help).toBeNull();
  });
});
