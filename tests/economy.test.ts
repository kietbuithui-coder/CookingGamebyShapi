import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { RNG } from '../src/core/util';
import { SHOPS } from '../src/data/shops';
import { INGS } from '../src/data/ingredients';
import { RECIPES, fuelPerPortion } from '../src/data/recipes';
import { GEAR, LENDERS } from '../src/data/gear';
import { fresh, give, withStall, IDLE } from './helpers';

describe('tiền mặt và sổ sách', () => {
  it('spend từ chối khi không đủ tiền và không ghi sổ', () => {
    const g = fresh();
    expect(R.spend(g, 50000, 'gear')).toBe(false);
    expect(g.cash).toBe(18000);
    expect(g.led.gear).toBe(0);
  });
  it('spend / earn cập nhật tiền và đúng cột trong sổ ngày', () => {
    const g = fresh();
    expect(R.spend(g, 5000, 'food')).toBe(true);
    R.earn(g, 12000, 'side');
    expect(g.cash).toBe(18000 - 5000 + 12000);
    expect(g.led.food).toBe(5000);
    expect(g.led.side).toBe(12000);
    expect(g.tot.earned).toBe(12000);
  });
});

describe('giá ở chợ và cửa hàng', () => {
  it('giá cố định trong ngày, dao động quanh giá gốc, không dưới 500₫', () => {
    const g = fresh(); g.min = 8 * 60;
    for (const shop of Object.values(SHOPS)) for (const id of shop.items) {
      const p = R.shopPrice(g, shop, id);
      expect(R.shopPrice(g, shop, id)).toBe(p);
      expect(p).toBeGreaterThanOrEqual(500);
      const base = INGS[id].price * shop.priceMul;
      if (base >= 2000) { expect(p).toBeGreaterThan(base * 0.55); expect(p).toBeLessThan(base * 1.25); }
    }
  });
  it('MiniMart đắt hơn chợ cho cùng một món', () => {
    const g = fresh(); g.min = 8 * 60;
    const market = Object.values(SHOPS).filter((s) => s.id.startsWith('m_'));
    let cmp = 0;
    for (const id of SHOPS.mart.items) {
      const m = market.find((s) => s.items.includes(id)); if (!m) continue;
      cmp++;
      expect(SHOPS.mart.priceMul).toBeGreaterThan(m.priceMul);
    }
    expect(cmp).toBeGreaterThan(0);
  });
  it('cuối buổi chợ xả hàng tươi rẻ hơn', () => {
    const shop = Object.values(SHOPS).find((s) => s.lateSale)!;
    const id = shop.items.find((i) => INGS[i].shelf < 200)!;
    const g = fresh(); g.min = (shop.open[0] + 1) * 60;
    const morning = R.shopPrice(g, shop, id);
    g.min = (shop.open[1] - 1) * 60;
    expect(R.shopPrice(g, shop, id)).toBeLessThan(morning);
  });
  it('hàng buổi sáng tươi hơn buổi chiều', () => {
    const shop = SHOPS.m_rau, id = shop.items.find((i) => INGS[i].shelf < 9000)!;
    const g = fresh(), rng = () => new RNG(1);
    g.min = shop.open[0] * 60 + 10; const am = R.shopFresh(g, shop, id, rng());
    g.min = shop.open[1] * 60 - 10; const pm = R.shopFresh(g, shop, id, rng());
    expect(am).toBeGreaterThan(pm);
  });
  it('cửa hàng đóng ngoài giờ mở cửa', () => {
    const g = fresh(), shop = SHOPS.m_rau;
    g.min = (shop.open[0] - 1) * 60; expect(R.shopOpen(g, shop)).toBe(false);
    g.min = (shop.open[0] + 1) * 60; expect(R.shopOpen(g, shop)).toBe(true);
  });
});

describe('mặc cả', () => {
  const tries = (ask: number, setup: (g: ReturnType<typeof fresh>) => void = () => {}) => {
    let ok = 0; const N = 400, rng = new RNG(99);
    for (let i = 0; i < N; i++) { const g = fresh(i + 1); g.min = 8 * 60; setup(g); if (R.haggle(g, SHOPS.m_rau, ask, 40000, rng).ok) ok++; }
    return ok / N;
  };
  it('xin bớt 10% dễ hơn xin bớt 20%', () => {
    expect(tries(0.1)).toBeGreaterThan(tries(0.2) + 0.1);
  });
  it('khách quen dễ được bớt hơn người lạ', () => {
    expect(tries(0.2, (g) => { g.rel.m_rau = { v: 80, n: 20, last: 0 }; })).toBeGreaterThan(tries(0.2) + 0.15);
  });
  it('mặc cả hoài trong một ngày thì càng khó, thất bại làm mất lòng người bán', () => {
    const g = fresh(); g.min = 8 * 60;
    const never = { next: () => 0.999, pick: <T,>(a: readonly T[]) => a[0] } as unknown as RNG;
    for (let i = 0; i < 4; i++) expect(R.haggle(g, SHOPS.m_rau, 0.2, 40000, never).ok).toBe(false);
    expect(g.wd.haggled.m_rau).toBe(4);
    expect(g.rel.m_rau.v).toBeLessThan(0);
  });
  it('siêu thị không cho mặc cả', () => {
    expect(SHOPS.mart.haggle).toBe(0);
    const g = fresh(); g.min = 10 * 60;
    const always = { next: () => 0, pick: <T,>(a: readonly T[]) => a[0] } as unknown as RNG;
    expect(R.haggle(g, SHOPS.mart, 0.1, 500000, always).ok).toBe(false);
  });
});

describe('giá vốn món ăn', () => {
  it('giá vốn = nguyên liệu + bao bì + nhiên liệu, tính theo giá đã mua', () => {
    const g = withStall(), r = RECIPES.bap_nuong;
    for (const id of Object.keys(r.ings)) give(g, id, 10, 95, 0.9, 2000);
    give(g, 'than', 2, 100, 1, 22000);
    const c = R.recipeCost(g, r);
    const ing = Object.values(r.ings).reduce((a, q) => a + q * 2000, 0);
    expect(c.ing).toBeCloseTo(ing);
    expect(c.pack).toBe(r.pack);
    expect(c.fuel).toBeCloseTo(fuelPerPortion(r) * 1000);       // 22.000₫ / 22 lần đứng bếp
    expect(c.total).toBeCloseTo(c.ing + c.pack + c.fuel);
  });
  it('chưa có hàng trong kho thì ước theo giá chợ', () => {
    const g = fresh();
    expect(R.unitCost(g, 'bap')).toBe(INGS.bap.price);
  });
  it('mọi món bán đúng giá thị trường đều có lãi gộp', () => {
    const g = withStall();
    for (const r of Object.values(RECIPES)) {
      const c = R.recipeCost(g, r).total;
      expect(c, r.name).toBeLessThan(r.ref * 0.7);
      expect(R.marginOf(r.ref, c), r.name).toBeGreaterThan(0.3);
    }
  });
  it('giá gợi ý không thấp hơn giá thị trường', () => {
    const g = withStall();
    for (const r of Object.values(RECIPES)) expect(R.suggestPrice(g, r)).toBeGreaterThanOrEqual(r.ref);
  });
});

describe('nhiên liệu', () => {
  it('không có bếp thì không nấu được', () => {
    const g = fresh(); give(g, 'than', 3);
    expect(R.useFuel(g, 1)).toBe(false);
  });
  it('một bao than dùng được 22 lần đứng bếp rồi mới lấy bao tiếp theo', () => {
    const g = withStall(); give(g, 'than', 2);
    for (let i = 0; i < 22; i++) expect(R.useFuel(g, 1)).toBe(true);
    expect(g.stall.store.find((s) => s.id === 'than')!.n).toBe(1);
    expect(R.useFuel(g, 1)).toBe(true);
    expect(g.stall.store.find((s) => s.id === 'than')).toBeUndefined();
  });
  it('hết than thì báo thất bại', () => {
    const g = withStall();
    expect(R.useFuel(g, 1)).toBe(false);
  });
});

describe('sơ chế và hoàn thiện', () => {
  it('số phần làm được bị giới hạn bởi nguyên liệu ít nhất', () => {
    const g = withStall(), r = RECIPES.bap_nuong;
    for (const id of Object.keys(r.ings)) give(g, id, 100);
    expect(R.prepPossible(g, r)).toBeGreaterThan(0);
    expect(R.missingFor(g, r, 'prep')).toEqual([]);
    const g2 = withStall();
    expect(R.prepPossible(g2, r)).toBe(0);
    expect(R.missingFor(g2, r, 'prep').length).toBeGreaterThan(0);
  });
  it('món cần sơ chế thì chưa bán được khi chưa có mẻ sơ chế', () => {
    const g = withStall(), r = RECIPES.bap_nuong;
    for (const id of Object.keys(r.ings)) give(g, id, 100);
    g.rec[r.id].on = true;
    expect(R.finishPossible(g, r)).toBe(0);
    expect(R.available(g, r)).toBe(false);
    g.stall.preps.push({ rid: r.id, n: 8, q: 0.9, at: g.day * 1440 + g.min, cost: 900 });
    expect(R.finishPossible(g, r)).toBe(8);
    expect(R.available(g, r)).toBe(true);
  });
  it('hoàn thiện trừ đúng nguyên liệu, mẻ sơ chế và cộng tiền bao bì', () => {
    const g = withStall(), r = RECIPES.bap_nuong;
    for (const id of r.fin) give(g, id, 10, 95, 0.9, 1000);
    g.stall.preps.push({ rid: r.id, n: 8, q: 0.9, at: g.day * 1440 + g.min, cost: 900 });
    const before = g.stall.store.find((s) => s.id === 'bap')!.n;
    const out = R.consumeFinish(g, r, 3);
    expect(g.stall.store.find((s) => s.id === 'bap')!.n).toBeCloseTo(before - 3 * r.ings.bap);
    expect(g.stall.preps[0].n).toBe(5);
    expect(out.cost).toBeGreaterThan(3 * r.pack);
    expect(out.prepQ).toBeCloseTo(0.9);
  });
  it('mẻ sơ chế để quá lâu thì xuống chất lượng', () => {
    const g = withStall(), r = RECIPES.bap_nuong, now = g.day * 1440 + g.min;
    expect(R.holdFactor(g, r, now)).toBe(1);
    expect(R.holdFactor(g, r, now - r.hold * 2)).toBeLessThan(1);
    expect(R.holdFactor(g, r, now - r.hold * 50)).toBeGreaterThanOrEqual(0.4);
  });
  it('thiếu dụng cụ thì chưa bán được món đó', () => {
    const g = fresh();
    expect(R.missingTools(g, RECIPES.bap_nuong).length).toBeGreaterThan(0);
    expect(R.canSell(g, RECIPES.bap_nuong)).toBe(false);
    const g2 = withStall();
    expect(R.canSell(g2, RECIPES.bap_nuong)).toBe(true);
    expect(R.canSell(g2, RECIPES.pho_bo)).toBe(false);          // chưa học công thức
  });
  it('chất lượng món tăng theo điểm thao tác và độ tươi nguyên liệu', () => {
    const g = withStall(), r = RECIPES.banh_trang_tron;
    expect(R.dishQuality(g, r, 1, 1)).toBeGreaterThan(R.dishQuality(g, r, 0.5, 1));
    expect(R.dishQuality(g, r, 1, 1)).toBeGreaterThan(R.dishQuality(g, r, 1, 0.4));
    expect(R.dishQuality(g, r, 0, 0)).toBeGreaterThan(0);
    expect(R.dishQuality(g, r, 1, 1)).toBeLessThanOrEqual(1);
  });
  it('đói, mệt làm thao tác nấu khó hơn; lên tay nghề thì dễ hơn', () => {
    const g = withStall(); const base = R.cookEase(g);
    g.st.energy = 10; expect(R.cookEase(g)).toBeLessThan(base);
    g.st.energy = 90; g.xp = 30 * 25; expect(R.level(g)).toBe(5); expect(R.cookEase(g)).toBeGreaterThan(base);
  });
});

describe('mua sắm đồ nghề', () => {
  it('không đủ tiền thì không mua được', () => {
    const g = fresh();
    expect(R.buyGear(g, 'ganh')).toBe('cash');
    expect(R.has(g, 'ganh')).toBe(false);
  });
  it('mua quang gánh: trừ tiền, lên bậc 1 và đang mang theo người', () => {
    const g = fresh(); g.cash = 200000;
    expect(R.buyGear(g, 'ganh')).toBe('ok');
    expect(g.cash).toBe(200000 - GEAR.ganh.price);
    expect(g.stall.tier).toBe(1);
    expect(g.stall.where).toBe('carried');
    expect(g.led.gear).toBe(GEAR.ganh.price);
    expect(R.buyGear(g, 'ganh')).toBe('have');
  });
  it('nâng lên xe đẩy giữ nguyên hàng trong kho quầy', () => {
    const g = withStall(); g.cash = 3000000; give(g, 'bap', 5);
    expect(R.buyGear(g, 'xeday')).toBe('ok');
    expect(g.stall.tier).toBe(2);
    expect(g.stall.store.find((s) => s.id === 'bap')!.n).toBe(5);
    expect(R.tier(g).cap).toBeGreaterThan(14);
  });
  it('bán ve chai đúng nơi thu mua', () => {
    const g = fresh(); g.junk = { chai: 9, lon: 5, dongho: 1 };
    expect(R.sellJunk(g, 'scrap')).toBe(9 * 1000 + 5 * 1800);
    expect(g.junk).toEqual({ dongho: 1 });
    expect(R.sellJunk(g, 'pawn')).toBe(60000);
    expect(g.cash).toBe(18000 + 18000 + 60000);
  });
});

describe('vay nợ', () => {
  it('ngân hàng không cho vay khi chưa có chỗ ở đàng hoàng hoặc uy tín thấp', () => {
    const g = fresh(); g.rep = 50;
    expect(R.loanLimit(g, 'bank')).toBe(0);
    g.housing = 'tro'; expect(R.loanLimit(g, 'bank')).toBe(2000000);
    g.rep = 5; expect(R.loanLimit(g, 'bank')).toBe(0);
  });
  it('vay nóng nhận tiền ngay, hạn 5 ngày; vay quá hạn mức bị từ chối', () => {
    const g = fresh(); g.day = 3;
    expect(R.borrow(g, 'shark', 5000000)).toBe(false);
    expect(R.borrow(g, 'shark', 500000)).toBe(true);
    expect(g.cash).toBe(518000);
    expect(g.debts[0].due).toBe(3 + LENDERS.shark.term);
    expect(R.totalDebt(g)).toBe(500000);
    expect(R.loanLimit(g, 'shark')).toBe(1500000);
  });
  it('ghi sổ ở tạp hoá không đưa tiền mặt, tối đa 100.000₫', () => {
    const g = fresh();
    expect(R.borrow(g, 'tab', 60000)).toBe(true);
    expect(g.cash).toBe(18000);
    expect(R.borrow(g, 'tab', 60000)).toBe(false);
    expect(R.loanLimit(g, 'tab')).toBe(40000);
  });
  it('trả nợ từng phần rồi trả dứt', () => {
    const g = fresh(); g.day = 3; R.borrow(g, 'shark', 500000);
    const id = g.debts[0].id;
    expect(R.repay(g, id, 200000)).toBe(200000);
    expect(g.debts[0].owed).toBe(300000);
    expect(R.repay(g, id, 9e9)).toBe(300000);
    expect(g.debts).toHaveLength(0);
    expect(g.cash).toBe(18000);
  });
  it('nợ quá hạn tính lãi phạt mỗi ngày và có thể dẫn tới phá sản', () => {
    const g = fresh(); g.day = 3; R.borrow(g, 'shark', 500000); g.cash = 0;
    const owed0 = g.debts[0].owed;
    for (let d = 0; d < 12; d++) R.advance(g, 1440, { ...IDLE, sleeping: true }, new RNG(d + 1));
    expect(g.debts.length === 0 || g.debts[0].owed > owed0 || g.tot.bankrupt > 0).toBe(true);
    if (g.debts.length) { expect(R.overdue(g).length).toBe(1); expect(g.debts[0].late).toBeGreaterThanOrEqual(3); expect(R.checkBankrupt(g)).toBe(true); }
  });
  it('phá sản: mất đồ nghề, xoá nợ, về gầm cầu và bị khoá tín dụng', () => {
    const g = withStall(); g.day = 4; R.borrow(g, 'shark', 500000);
    R.goBankrupt(g);
    expect(g.debts).toHaveLength(0);
    expect(Object.keys(g.gear)).toHaveLength(0);
    expect(g.stall.tier).toBe(0);
    expect(g.housing).toBe('gamcau');
    expect(g.cash).toBeLessThanOrEqual(15000);
    expect(R.loanLimit(g, 'shark')).toBe(0);
    expect(g.tot.bankrupt).toBe(1);
  });
});
