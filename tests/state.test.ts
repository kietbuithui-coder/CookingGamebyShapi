import { describe, it, expect } from 'vitest';
import { newGame, migrate, addStack, takeFrom, moveStack, spoil, purge, isSpoiled, freshFactor, countOf, weightOf, SAVE_VERSION, Stack } from '../src/sim/state';
import { START_RECIPES, RECIPE_LIST } from '../src/data/recipes';
import { INGS } from '../src/data/ingredients';
import { FIXED, REGULARS } from '../src/data/people';
import * as R from '../src/sim/rules';

describe('ván mới', () => {
  it('bắt đầu ở gầm cầu lúc 06:10 với 18.000₫ và 4 công thức', () => {
    const g = newGame(1);
    expect(g.day).toBe(0);
    expect(g.min).toBe(6 * 60 + 10);
    expect(g.cash).toBe(18000);
    expect(g.housing).toBe('gamcau');
    expect(g.stall.tier).toBe(0);
    const known = RECIPE_LIST.filter((r) => g.rec[r.id].known).map((r) => r.id).sort();
    expect(known).toEqual([...START_RECIPES].sort());
    expect(g.v).toBe(SAVE_VERSION);
  });
  it('giá bán mặc định của mỗi món là giá thị trường', () => {
    const g = newGame(1);
    for (const r of RECIPE_LIST) expect(g.rec[r.id].price).toBe(r.ref);
  });
  it('trạng thái lưu được qua JSON nguyên vẹn', () => {
    const g = newGame(7);
    expect(JSON.parse(JSON.stringify(g))).toEqual(g);
  });
});

describe('kho nguyên liệu', () => {
  it('addStack gộp các lô gần giống nhau và tính bình quân gia quyền', () => {
    const l: Stack[] = [];
    addStack(l, { id: 'cachua', n: 2, fresh: 90, q: 0.9, cost: 3000 });
    addStack(l, { id: 'cachua', n: 2, fresh: 86, q: 0.9, cost: 5000 });
    expect(l).toHaveLength(1);
    expect(l[0].n).toBe(4);
    expect(l[0].fresh).toBeCloseTo(88);
    expect(l[0].cost).toBeCloseTo(4000);
  });
  it('addStack giữ riêng lô có độ tươi chênh nhiều', () => {
    const l: Stack[] = [];
    addStack(l, { id: 'cachua', n: 2, fresh: 90, q: 0.9, cost: 3000 });
    addStack(l, { id: 'cachua', n: 2, fresh: 40, q: 0.9, cost: 3000 });
    expect(l).toHaveLength(2);
  });
  it('takeFrom dùng lô kém tươi trước và trả về null khi thiếu', () => {
    const a: Stack[] = [{ id: 'cachua', n: 2, fresh: 90, q: 1, cost: 3000 }];
    const b: Stack[] = [{ id: 'cachua', n: 2, fresh: 40, q: 1, cost: 1000 }];
    const t = takeFrom([a, b], 'cachua', 2)!;
    expect(t.cost).toBe(2000);                    // lấy hết lô cũ, giá 1.000₫/quả
    expect(b).toHaveLength(0);
    expect(a[0].n).toBe(2);
    expect(t.q).toBeCloseTo(freshFactor(40));
    expect(takeFrom([a, b], 'cachua', 5)).toBeNull();
    expect(a[0].n).toBe(2);                       // thiếu thì không đụng vào kho
  });
  it('moveStack tôn trọng sức chứa tính theo kg', () => {
    const from: Stack[] = [{ id: 'bap', n: 10, fresh: 90, q: 1, cost: 4000 }], to: Stack[] = [];
    const kg = INGS.bap.kg;
    const moved = moveStack(from, to, 0, 10, kg * 3);
    expect(moved).toBeCloseTo(3);
    expect(countOf([from], 'bap')).toBeCloseTo(7);
    expect(weightOf(to)).toBeLessThanOrEqual(kg * 3 + 1e-6);
  });
});

describe('hư hỏng', () => {
  it('đồ cần giữ lạnh hỏng nhanh hơn nhiều khi để ngoài, và chậm hẳn khi có đá', () => {
    const out: Stack[] = [{ id: 'heo', n: 1, fresh: 100, q: 1, cost: 1 }];
    const iced: Stack[] = [{ id: 'heo', n: 1, fresh: 100, q: 1, cost: 1 }];
    spoil(out, 4, 1, false); spoil(iced, 4, 1, true);
    expect(INGS.heo.cold).toBe(true);
    expect(out[0].fresh).toBeLessThan(iced[0].fresh);
    expect(100 - out[0].fresh).toBeGreaterThan((100 - iced[0].fresh) * 5);
  });
  it('trời nóng làm hỏng nhanh hơn', () => {
    const cool: Stack[] = [{ id: 'rauthom', n: 1, fresh: 100, q: 1, cost: 1 }];
    const hot: Stack[] = [{ id: 'rauthom', n: 1, fresh: 100, q: 1, cost: 1 }];
    spoil(cool, 5, 1, false); spoil(hot, 5, 1.6, false);
    expect(hot[0].fresh).toBeLessThan(cool[0].fresh);
  });
  it('đồ khô (muối, than) không bao giờ hỏng', () => {
    const l: Stack[] = [{ id: 'muoi', n: 1, fresh: 100, q: 1, cost: 1 }, { id: 'than', n: 1, fresh: 100, q: 1, cost: 1 }];
    spoil(l, 24 * 30, 2, false);
    expect(l.every((s) => s.fresh === 100)).toBe(true);
  });
  it('purge bỏ lô đã hỏng và báo giá trị mất', () => {
    const l: Stack[] = [{ id: 'cachua', n: 3, fresh: 5, q: 1, cost: 2000 }, { id: 'bap', n: 2, fresh: 80, q: 1, cost: 4000 }];
    expect(isSpoiled(l[0])).toBe(true);
    const r = purge(l);
    expect(r.lost).toBe(6000);
    expect(r.names).toEqual([INGS.cachua.name]);
    expect(l.map((s) => s.id)).toEqual(['bap']);
  });
  it('độ tươi càng thấp thì hệ số chất lượng càng giảm, không bao giờ tăng', () => {
    let prev = 2;
    for (let f = 100; f >= 0; f -= 5) { const v = freshFactor(f); expect(v).toBeLessThanOrEqual(prev); prev = v; }
    expect(freshFactor(100)).toBe(1);
  });
});

describe('người lạ và người quen', () => {
  it('ván mới chưa quen ai: người đứng quầy chỉ hiện việc họ làm, nói chuyện rồi mới biết tên', () => {
    const g = newGame(1);
    expect(g.met).toEqual({});
    const role = R.fixedLabel(g, 'eatery');
    expect(role).not.toBe(FIXED.eatery.name);
    expect(role).not.toContain('Tư');                  // không lộ tên riêng
    expect(R.meet(g, 'eatery')).toBe(true);
    expect(R.meet(g, 'eatery')).toBe(false);           // chỉ "lần đầu" một lần
    expect(R.fixedLabel(g, 'eatery')).toBe('Bà Tư');
    expect(R.fixedLabel(g, 'equip')).not.toBe(FIXED.equip.name);
  });
  it('khách quen: lần đầu ghé vẫn là người lạ', () => {
    const g = newGame(1), r = REGULARS[0];
    R.changeRel(g, r.id, 0, true);                      // họ vừa tới quầy lần đầu
    expect(R.hasMet(g, r.id)).toBe(false);
    R.meet(g, r.id);                                    // bán xong mới biết tên
    expect(R.hasMet(g, r.id)).toBe(true);
  });
});
describe('nâng cấp bản lưu', () => {
  it('từ chối dữ liệu rác', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate('abc')).toBeNull();
    expect(migrate({})).toBeNull();
  });
  it('bản lưu cũ thiếu trường mới vẫn đọc được và giữ tiến độ', () => {
    const old = { v: 1, seed: 5, day: 12, min: 600, cash: 345000, rep: 22, st: { hunger: 10 }, rec: { tra_da: { known: true, price: 7000, on: true, made: 40, best: 0.9 } }, stall: { tier: 2 } };
    const g = migrate(old)!;
    expect(g.v).toBe(SAVE_VERSION);
    expect(g.day).toBe(12);
    expect(g.cash).toBe(345000);
    expect(g.st.hunger).toBe(10);
    expect(g.st.energy).toBeGreaterThan(0);            // trường thiếu lấy mặc định
    expect(g.stall.tier).toBe(2);
    expect(Array.isArray(g.stall.store)).toBe(true);
    expect(g.rec.tra_da.price).toBe(7000);
    expect(g.rec.pho_bo).toBeDefined();                // công thức thêm sau vẫn có mặt
    expect(g.wd.picked).toEqual([]);
  });
  it('bản lưu cũ (trước v4) coi như đã quen hết người đứng quầy và những khách quen từng ghé', () => {
    const old: any = { v: 3, seed: 5, day: 12, min: 600, cash: 1000, rel: { chu_ba: { v: 12, n: 3, last: 11 }, co_lan: { v: 0, n: 0, last: -1 } } };
    const g = migrate(old)!;
    for (const id of Object.keys(FIXED)) expect(R.hasMet(g, id), id).toBe(true);
    expect(R.hasMet(g, 'chu_ba')).toBe(true);
    expect(R.hasMet(g, 'co_lan')).toBe(false);          // chưa từng ghé thì vẫn là người lạ
    expect(R.fixedLabel(g, 'eatery')).toBe(FIXED.eatery.name);
  });
  it('bản lưu v4 giữ nguyên sổ "đã quen"', () => {
    const raw: any = newGame(3); raw.met = { eatery: 2 };
    const g = migrate(JSON.parse(JSON.stringify(raw)))!;
    expect(g.met).toEqual({ eatery: 2 });
    expect(R.hasMet(g, 'equip')).toBe(false);
  });
  it('bỏ nguyên liệu và ve chai không còn tồn tại trong game', () => {
    const raw: any = newGame(3);
    raw.bag = [{ id: 'khong_co_that', n: 2, fresh: 50, q: 1, cost: 1 }, { id: 'bap', n: 1, fresh: 50, q: 1, cost: 1 }, { id: 'bap', n: 0, fresh: 50, q: 1, cost: 1 }];
    raw.junk = { chai: 3, vat_la: 9 };
    const g = migrate(JSON.parse(JSON.stringify(raw)))!;
    expect(g.bag).toHaveLength(1);
    expect(g.junk).toEqual({ chai: 3 });
  });
});
