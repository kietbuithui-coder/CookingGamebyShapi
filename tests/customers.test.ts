import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { RNG } from '../src/core/util';
import { RECIPES } from '../src/data/recipes';
import { ARCH } from '../src/data/people';
import { sellingTea, withStall, persona, give } from './helpers';

/** Tỉ lệ khách chịu mua trong N lần thử với RNG có hạt giống. */
function buyRate(setup: (g: ReturnType<typeof sellingTea>) => void, arch: Parameters<typeof persona>[0] = 'congnhan', N = 600): number {
  const rng = new RNG(2024); let buy = 0;
  for (let i = 0; i < N; i++) {
    const g = sellingTea(i + 1); setup(g);
    const p = persona(arch, undefined, 0.86 + (i % 35) * 0.01);
    if (R.decide(g, p, i % 2 === 0, rng).order) buy++;
  }
  return buy / N;
}

describe('khách quyết định mua', () => {
  it('quầy mới bán đúng giá thị trường: phần lớn khách bình dân chịu mua', () => {
    const rate = buyRate(() => {});
    expect(rate).toBeGreaterThan(0.6);
    expect(rate).toBeLessThan(0.98);
  });
  it('tăng giá thì khách bỏ đi nhiều hơn, giảm giá thì mua nhiều hơn', () => {
    const ref = RECIPES.tra_da.ref;
    const normal = buyRate(() => {});
    const pricey = buyRate((g) => { g.rec.tra_da.price = Math.round(ref * 1.6); });
    const cheap = buyRate((g) => { g.rec.tra_da.price = Math.round(ref * 0.8); });
    expect(pricey).toBeLessThan(normal - 0.3);
    expect(cheap).toBeGreaterThan(normal);
  });
  it('uy tín cao cho phép bán giá cao hơn', () => {
    const ref = RECIPES.tra_da.ref;
    const low = buyRate((g) => { g.rec.tra_da.price = Math.round(ref * 1.3); });
    const high = buyRate((g) => { g.rec.tra_da.price = Math.round(ref * 1.3); g.rep = 90; });
    expect(high).toBeGreaterThan(low + 0.25);
  });
  it('khách giàu ít nhạy giá hơn học sinh', () => {
    const ref = RECIPES.tra_da.ref, up = (g: ReturnType<typeof sellingTea>) => { g.rec.tra_da.price = Math.round(ref * 1.4); };
    expect(buyRate(up, 'nhagiau')).toBeGreaterThan(buyRate(up, 'hocsinh') + 0.3);
  });
  it('hết hàng thì khách bỏ đi với lý do "không có gì"', () => {
    const g = withStall();
    const d = R.decide(g, persona('congnhan'), false, new RNG(1));
    expect(d.order).toBeUndefined();
    expect(d.why).toBe('none');
    expect(d.leave).toBeTruthy();
  });
  it('giá vượt túi tiền thì gần như không ai mua', () => {
    const rate = buyRate((g) => { g.rec.tra_da.price = 60000; }, 'hocsinh');
    expect(rate).toBeLessThan(0.05);
  });
  it('người bán quá bẩn làm một phần khách quay đi', () => {
    const rng = new RNG(5); let dirty = 0;
    for (let i = 0; i < 300; i++) { const g = sellingTea(i + 1); g.st.hygiene = 3; if (R.decide(g, persona('vanphong'), true, rng).why === 'dirty') dirty++; }
    expect(dirty).toBeGreaterThan(60);
  });
  it('đơn hàng không vượt quá số phần còn làm được', () => {
    const rng = new RNG(8);
    for (let i = 0; i < 200; i++) {
      const g = sellingTea(i + 1); g.stall.preps[0].n = 1;
      const o = R.decide(g, persona('phuhuynh'), true, rng).order;
      if (o) { expect(o.n).toBe(1); expect(o.price).toBe(g.rec.tra_da.price); }
    }
  });
  it('chọn món hợp khẩu vị khi thực đơn có nhiều món', () => {
    const rng = new RNG(11); const pick: Record<string, number> = {};
    for (let i = 0; i < 400; i++) {
      const g = sellingTea(i + 1);
      for (const id of RECIPES.banh_trang_tron.fin) give(g, id, 50);
      g.stall.preps.push({ rid: 'banh_trang_tron', n: 8, q: 0.9, at: g.day * 1440 + g.min, cost: 2600 }); g.rec.banh_trang_tron.on = true;
      const o = R.decide(g, persona('hocsinh'), false, rng).order; if (o) pick[o.rid] = (pick[o.rid] ?? 0) + 1;
    }
    expect(ARCH.hocsinh.pref.anvat).toBeGreaterThan(ARCH.hocsinh.pref.nuoc ?? 0.8);
    expect(pick.banh_trang_tron).toBeGreaterThan(pick.tra_da ?? 0);
  });
});

describe('đánh giá sau khi ăn', () => {
  const order = (ratio = 1): R.Order => ({ rid: 'tra_da', n: 1, price: 5000, ratio, line: '', mood: 'ok' });
  const avg = (quality: number, wait: number, ratio = 1, tweak: (g: ReturnType<typeof sellingTea>) => void = () => {}) => {
    const rng = new RNG(3); let s = 0; const N = 200;
    for (let i = 0; i < N; i++) { const g = sellingTea(i + 1); tweak(g); s += R.review(g, persona('congnhan'), false, order(ratio), quality, wait, rng).stars; }
    return s / N;
  };
  it('món ngon được nhiều sao hơn món dở, luôn trong khoảng 1–5', () => {
    const good = avg(0.95, 0.1), bad = avg(0.2, 0.1);
    expect(good).toBeGreaterThan(bad + 1.5);
    expect(good).toBeLessThanOrEqual(5);
    expect(bad).toBeGreaterThanOrEqual(1);
  });
  it('bắt khách chờ lâu bị trừ sao', () => {
    expect(avg(0.8, 0.95)).toBeLessThan(avg(0.8, 0.05));
  });
  it('bán đắt so với giá khách thấy hợp lý bị trừ sao', () => {
    expect(avg(0.8, 0.2, 1.4)).toBeLessThan(avg(0.8, 0.2, 0.8));
  });
  it('người bán mất vệ sinh bị trừ sao', () => {
    expect(avg(0.8, 0.2, 1, (g) => { g.st.hygiene = 5; })).toBeLessThan(avg(0.8, 0.2));
  });
  it('món ngon tăng uy tín, món dở giảm uy tín', () => {
    const g = sellingTea();
    expect(R.review(g, persona('congnhan'), false, order(), 0.98, 0.05, new RNG(1)).rep).toBeGreaterThan(0);
    expect(R.review(g, persona('congnhan'), false, order(), 0.1, 0.9, new RNG(1)).rep).toBeLessThan(0);
  });
  it('tiền boa chỉ có khi khách thật sự hài lòng', () => {
    const rng = new RNG(4);
    for (let i = 0; i < 200; i++) { const g = sellingTea(i + 1); const rv = R.review(g, persona('dukhach'), false, order(), 0.3, 0.5, rng); expect(rv.tip).toBe(0); }
    let tips = 0;
    for (let i = 0; i < 200; i++) { const g = sellingTea(i + 1); const rv = R.review(g, persona('dukhach'), false, order(), 1, 0, rng); if (rv.tip > 0) { tips++; expect(rv.tip).toBeGreaterThanOrEqual(1000); } }
    expect(tips).toBeGreaterThan(20);
  });
  it('settleSale ghi doanh thu, giá vốn, số phần và cập nhật uy tín', () => {
    const g = sellingTea(), o = { ...order(), n: 2 };
    const rv: R.Review = { stars: 4.6, rep: 0.7, tip: 1000, line: '', face: 1, back: true };
    R.settleSale(g, o, 1800, rv, 0.9);
    expect(g.cash).toBe(500000 + 10000 + 1000);
    expect(g.led.revenue).toBe(10000);
    expect(g.led.tips).toBe(1000);
    expect(g.led.cogs).toBe(1800);
    expect(g.led.sold).toBe(2);
    expect(g.tot.served).toBe(2);
    expect(g.rep).toBeCloseTo(0.7);
    expect(g.rec.tra_da.made).toBe(2);
    expect(g.rec.tra_da.best).toBe(0.9);
  });
  it('để khách bỏ đi vì chờ lâu làm giảm uy tín nhiều hơn vì giá', () => {
    const a = sellingTea(); a.rep = 10; R.lostCustomer(a, 'wait');
    const b = sellingTea(); b.rep = 10; R.lostCustomer(b, 'price');
    expect(a.rep).toBeLessThan(b.rep);
    expect(a.led.lost).toBe(1);
  });
});

describe('lượng khách ghé quầy', () => {
  it('quầy đóng hoặc hết món thì không có khách', () => {
    const g = sellingTea();
    expect(R.arrivalRate(g)).toBeGreaterThan(0);
    g.stall.open = false; expect(R.arrivalRate(g)).toBe(0);
    const empty = withStall(); expect(R.arrivalRate(empty)).toBe(0);
  });
  it('uy tín càng cao khách càng đông', () => {
    const lo = sellingTea(), hi = sellingTea(); hi.rep = 60;
    expect(R.arrivalRate(hi)).toBeGreaterThan(R.arrivalRate(lo) * 2);
  });
  it('trời mưa to vắng khách hơn trời nắng', () => {
    const sun = sellingTea(), rain = sellingTea(); rain.weather.now = 'muato';
    expect(R.arrivalRate(rain)).toBeLessThan(R.arrivalRate(sun));
  });
  it('bán đắt thì ít người ghé', () => {
    const a = sellingTea(), b = sellingTea(); b.rec.tra_da.price = 12000;
    expect(R.arrivalRate(b)).toBeLessThan(R.arrivalRate(a));
  });
  it('giữa đêm khuya vắng hơn buổi chiều', () => {
    const day = sellingTea(), night = sellingTea(); night.min = 2 * 60;
    expect(R.arrivalRate(night)).toBeLessThan(R.arrivalRate(day));
  });
  it('quầy mới vẫn có khách đều: bán cả ngày đủ sức đạt mốc 10 phần', () => {
    const g = sellingTea(); let sum = 0;
    for (let h = 7; h < 21; h++) { g.min = h * 60; sum += R.arrivalRate(g); }
    expect(sum * 0.6).toBeGreaterThan(10);
  });
});
