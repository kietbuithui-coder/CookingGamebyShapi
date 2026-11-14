// Ngoại hình người chơi: dữ liệu kiểu tóc / màu áo quần, giá cả, và cách đọc lại từ bản lưu cũ.
// (Tiệm cắt tóc và tiệm thời trang trong chợ ghi thẳng vào `Game.look`, nên dữ liệu này phải bền.)
import { describe, it, expect } from 'vitest';
import { HAIR_STYLES, HAIR_COLORS, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS, GLASSES, defaultLook, cleanLook } from '../src/data/looks';
import { newGame, migrate, SAVE_VERSION } from '../src/sim/state';
import { FIXED, SIDE, FIXED_ROLE } from '../src/data/people';
import { fresh } from './helpers';

describe('bảng giá ngoại hình', () => {
  it('8 kiểu tóc, id liền nhau từ 0, giá tăng dần theo độ cầu kỳ', () => {
    expect(HAIR_STYLES).toHaveLength(8);
    HAIR_STYLES.forEach((s, i) => expect(s.id).toBe(i));
    for (const s of HAIR_STYLES) expect(s.price).toBeGreaterThan(0);
    expect(HAIR_STYLES[3].price).toBeLessThan(HAIR_STYLES[4].price); // cạo sát rẻ hơn uốn xoăn
  });
  it('mọi bảng màu có giá dương và màu khác nhau', () => {
    for (const list of [HAIR_COLORS, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS]) {
      expect(list.length).toBeGreaterThanOrEqual(3);
      for (const c of list) expect(c.price).toBeGreaterThan(0);
      expect(new Set(list.map((c) => c.col)).size).toBe(list.length);
    }
    expect(GLASSES[0].price).toBe(0); // bỏ kính thì miễn phí
  });
  it('giá trong tầm một buổi bán hàng, không phải mua sắm xa xỉ', () => {
    const max = Math.max(...HAIR_STYLES.map((s) => s.price), ...SHIRT_COLORS.map((s) => s.price), ...SHOE_COLORS.map((s) => s.price));
    expect(max).toBeLessThanOrEqual(60000);
    expect(GLASSES[2].price).toBeLessThanOrEqual(60000);
  });
});

describe('ngoại hình mặc định', () => {
  it('nam và nữ khác nhau ở tóc, áo, dáng người', () => {
    const a = defaultLook(false), b = defaultLook(true);
    expect(a.fem).toBe(false); expect(b.fem).toBe(true);
    expect(a.hairStyle).not.toBe(b.hairStyle);
    expect(a.shirt).not.toBe(b.shirt);
    expect(b.fat).toBeLessThan(a.fat);
  });
  it('ván mới của nhân vật chị thì là nữ', () => {
    expect(newGame(1, 'chị').look.fem).toBe(true);
    expect(newGame(1, 'anh').look.fem).toBe(false);
  });
});

describe('cleanLook — đọc bản lưu cho khỏi vỡ hình', () => {
  it('dữ liệu rác thì trả về mặc định', () => {
    expect(cleanLook(null, false)).toEqual(defaultLook(false));
    expect(cleanLook({}, true)).toEqual(defaultLook(true));
    expect(cleanLook({ hairStyle: 'xoăn', shirt: NaN, fat: Infinity }, false)).toEqual(defaultLook(false));
  });
  it('kiểu tóc ngoài phạm vi bị kẹp lại, số lẻ thì làm tròn', () => {
    expect(cleanLook({ hairStyle: 99 }, false).hairStyle).toBe(7);
    expect(cleanLook({ hairStyle: -5 }, false).hairStyle).toBe(0);
    expect(cleanLook({ hairStyle: 4.6 }, false).hairStyle).toBe(5);
  });
  it('màu bị cắt về 24 bit, không có alpha lạ', () => {
    expect(cleanLook({ shirt: 0xff112233 }, false).shirt).toBe(0x112233);
    expect(cleanLook({ hair: 0x1e1a18 }, false).hair).toBe(0x1e1a18);
  });
  it('dáng người bị kẹp trong khoảng dựng được', () => {
    expect(cleanLook({ fat: 9 }, false).fat).toBe(1.3);
    expect(cleanLook({ h: 0.1 }, false).h).toBe(0.85);
  });
});

describe('bản lưu', () => {
  it('ván mới ghi phiên bản 11 và có ngoại hình', () => {
    const g = newGame(3);
    expect(g.v).toBe(SAVE_VERSION);
    expect(g.v).toBe(11);
    expect(g.look.hairStyle).toBe(0);
  });
  it('bản lưu v10 (chưa có look) được thêm ngoại hình mặc định', () => {
    const g = fresh(); const raw: any = JSON.parse(JSON.stringify(g));
    raw.v = 10; delete raw.look;
    const m = migrate(raw)!;
    expect(m.v).toBe(SAVE_VERSION);
    expect(m.look).toEqual(defaultLook(false));
  });
  it('bản lưu v11 giữ nguyên ngoại hình đã mua', () => {
    const g = fresh(); const raw: any = JSON.parse(JSON.stringify(g));
    raw.look = { ...raw.look, hairStyle: 4, shirt: 0xa8323a, face: 6 };
    const m = migrate(raw)!;
    expect(m.look.hairStyle).toBe(4);
    expect(m.look.shirt).toBe(0xa8323a);
    expect(m.look.face).toBe(6);
  });
});

describe('người bán trong hai tiệm mới', () => {
  it('có mặt trong danh sách nhân vật cố định, kèm nghề và lời thoại', () => {
    for (const id of ['hot_toc', 'thoi_trang']) {
      expect(FIXED[id]).toBeTruthy();
      expect(FIXED_ROLE[id]).toBeTruthy();
      expect(SIDE[id]?.intro.length).toBeGreaterThan(40);
      expect(SIDE[id]?.topics.length).toBeGreaterThanOrEqual(2);
    }
    expect(FIXED.hot_toc.name).toBe('Chú Bảy Kéo');
    expect(FIXED.thoi_trang.name).toBe('Cô Ngọc');
  });
});
