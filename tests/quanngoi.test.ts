// BẬC 5 — QUÁN CÓ CHỖ NGỒI: sáu ghế bàn gỗ trong nhà, thực đơn theo buổi,
// và khách ngồi ăn xong còn gọi thêm món tráng miệng (lượt 16).
import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { RNG } from '../src/core/util';
import { RECIPES, RECIPE_LIST } from '../src/data/recipes';
import { TIERS, GEAR, FUTURE_TIERS } from '../src/data/gear';
import { withStall, persona } from './helpers';
import type { Game } from '../src/sim/state';
import type { Order } from '../src/sim/rules';

/** Quán đang mở ở bậc cho trước, đủ đồ nghề, giờ tuỳ chọn. */
function stallAt(tier: number, min = 7 * 60): Game {
  const g = withStall(99001);
  g.stall = { ...g.stall, tier, where: 'placed', spot: 'cv', open: true, cond: 100 };
  g.min = min;
  return g;
}
/** Đặt sẵn vài phần ăn trên quầy và bật món. */
function ready(g: Game, rid: string, n = 5) {
  g.rec[rid].known = true; g.rec[rid].on = true;
  g.stall.ready.push({ rid, n, q: 0.92, at: g.day * 1440 + g.min, cost: 1000 });
}

describe('dữ liệu bậc 5', () => {
  it('có bậc 5 tên "Quán có chỗ ngồi", rộng hơn hẳn bậc 4', () => {
    const t4 = TIERS[4], t5 = TIERS[5];
    expect(t5).toBeTruthy();
    expect(t5.name).toBe('Quán có chỗ ngồi');
    expect(t5.id).toBe('quanngoi');
    expect(t5.cap).toBeGreaterThan(t4.cap);
    expect(t5.menu).toBeGreaterThan(t4.menu);
    expect(t5.queue).toBeGreaterThan(t4.queue);
    expect(t5.visible).toBeGreaterThan(t4.visible);
  });
  it('bán ở tiệm Ba Tài, giá cao hơn quán ăn nhỏ, mô tả nói rõ sáu chỗ ngồi', () => {
    const d = GEAR.quanngoi;
    expect(d.kind).toBe('stall');
    expect(d.tier).toBe(5);
    expect(d.price).toBeGreaterThan(GEAR.quanan.price);
    expect(d.desc).toContain('Sáu chỗ ngồi');
  });
  it('danh sách bậc tương lai còn hai bậc', () => {
    expect(FUTURE_TIERS).toEqual(['Nhà hàng bình dân', 'Chuỗi cửa hàng']);
  });
  it('bậc 5 là bậc cuối cùng đang mở', () => {
    expect(TIERS[TIERS.length - 1].tier).toBe(5);
    expect(TIERS.every((t, i) => t.tier === i)).toBe(true);
  });
});

describe('chỗ ngồi', () => {
  it('chưa lên quán thì không có ghế; bậc 4 bốn ghế, bậc 5 sáu ghế', () => {
    for (const tier of [0, 1, 2, 3]) expect(R.seatCount(stallAt(tier))).toBe(0);
    expect(R.seatCount(stallAt(4))).toBe(4);
    expect(R.seatCount(stallAt(5))).toBe(6);
  });
  it('chỉ quán có chỗ ngồi mới là ăn tại chỗ trong nhà', () => {
    expect(R.dineIn(stallAt(4))).toBe(false);
    expect(R.dineIn(stallAt(5))).toBe(true);
  });
});

describe('buổi bán', () => {
  it('chia đúng bốn buổi theo giờ', () => {
    expect(R.mealSlot(5)).toBe(0);
    expect(R.mealSlot(9.99)).toBe(0);
    expect(R.mealSlot(10)).toBe(1);
    expect(R.mealSlot(14.49)).toBe(1);
    expect(R.mealSlot(14.5)).toBe(2);
    expect(R.mealSlot(19.99)).toBe(2);
    expect(R.mealSlot(20)).toBe(3);
    expect(R.mealSlot(23.5)).toBe(3);
    expect(R.PERIODS).toEqual(['Buổi sáng', 'Buổi trưa', 'Buổi chiều', 'Khuya']);
  });
  it('bánh mì trứng hợp buổi sáng, bắp nướng hợp buổi chiều', () => {
    expect(R.fitsPeriod(RECIPES.banh_mi_trung, 7)).toBe(true);
    expect(R.fitsPeriod(RECIPES.banh_mi_trung, 18)).toBe(false);
    expect(R.fitsPeriod(RECIPES.bap_nuong, 18)).toBe(true);
    expect(R.fitsPeriod(RECIPES.bap_nuong, 7)).toBe(false);
  });
  it('periodMenu chỉ trả về món đang bật và hợp buổi', () => {
    const g = stallAt(5, 7 * 60);
    ready(g, 'banh_mi_trung'); ready(g, 'bap_nuong');
    const ids = R.periodMenu(g).map((r) => r.id);
    expect(ids).toContain('banh_mi_trung');
    expect(ids).not.toContain('bap_nuong');
    g.min = 18 * 60;
    expect(R.periodMenu(g).map((r) => r.id)).toContain('bap_nuong');
  });
});

describe('khách chọn món theo buổi', () => {
  const MENU = ['banh_mi_trung', 'bap_nuong', 'com_suon', 'pho_bo', 'xien_nuong', 'mi_xao_bo', 'hu_tieu', 'com_chien_trung', 'banh_cuon', 'tra_da'];
  /** Tỉ lệ khách gọi đúng món hợp buổi, cùng một thực đơn, khác bậc quán. */
  function fitShare(tier: number, h: number, N = 1500): number {
    let fit = 0;
    for (let i = 0; i < N; i++) {
      const g = stallAt(tier, h * 60);
      for (const rid of MENU) ready(g, rid, 30);
      const o = R.decide(g, persona('congnhan', undefined, 0.86 + (i % 35) * 0.01), i % 2 === 0, new RNG(i + 7)).order;
      if (o && R.fitsPeriod(RECIPES[o.rid], h)) fit++;
    }
    return fit / N;
  }
  it('quán có chỗ ngồi bán được nhiều món đúng buổi hơn quán ăn nhỏ', () => {
    for (const h of [7, 12, 18, 22]) expect(fitShare(5, h)).toBeGreaterThan(fitShare(4, h) + 0.02);
  });
  it('thực đơn nhiều món thì khách gọi đa dạng, không dồn vô một món', () => {
    const seen = new Set<string>();
    const g = stallAt(5, 12 * 60);
    for (const rid of MENU) ready(g, rid, 30);
    for (let i = 0; i < 300; i++) { const o = R.decide(g, persona('congnhan', undefined, 0.86 + (i % 35) * 0.01), i % 2 === 0, new RNG(i + 11)).order; if (o) seen.add(o.rid); }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});

describe('ăn xong gọi thêm', () => {
  const first: Order = { rid: 'banh_mi_trung', n: 1, price: 15000, ratio: 1, line: '', mood: 'ok' };
  it('quán ăn nhỏ thì không có món gọi thêm', () => {
    const g = stallAt(4); ready(g, 'tra_da');
    expect(R.secondOrder(g, persona('congnhan'), first, false, new RNG(1))).toBeNull();
  });
  it('quán có chỗ ngồi: món gọi thêm là tráng miệng / đồ uống / ăn vặt, một phần', () => {
    let got = 0;
    for (let i = 0; i < 200; i++) {
      const g = stallAt(5, 18 * 60); ready(g, 'che_dau_xanh'); ready(g, 'tra_da'); ready(g, 'banh_trang_tron');
      const o = R.secondOrder(g, persona('congnhan', 120000), first, false, new RNG(i + 3));
      if (!o) continue;
      got++;
      expect(['che', 'nuoc', 'anvat']).toContain(RECIPES[o.rid].cat);
      expect(o.rid).not.toBe(first.rid);
      expect(o.n).toBe(1);
      expect(o.more).toBe(true);
      expect(o.price).toBeLessThanOrEqual(120000 - first.price);
    }
    expect(got).toBeGreaterThan(30);
  });
  it('không đủ tiền thì thôi, không gọi thêm', () => {
    const g = stallAt(5, 18 * 60); ready(g, 'che_dau_xanh');
    expect(R.secondOrder(g, persona('congnhan', 15000), first, false, new RNG(5))).toBeNull();
  });
  it('thực đơn không có món tráng miệng nào thì cũng thôi', () => {
    const g = stallAt(5, 18 * 60); ready(g, 'com_suon');
    for (let i = 0; i < 40; i++) expect(R.secondOrder(g, persona('congnhan', 200000), first, false, new RNG(i))).toBeNull();
  });
  it('kết quả lặp lại được với cùng hạt giống', () => {
    const run = (seed: number) => {
      const g = stallAt(5, 18 * 60); ready(g, 'che_dau_xanh'); ready(g, 'tra_da');
      return R.secondOrder(g, persona('congnhan', 200000), first, false, new RNG(seed));
    };
    expect(run(42)?.rid).toBe(run(42)?.rid ?? run(42)?.rid);
  });
});

describe('món trong thực đơn', () => {
  it('mọi món đều có điểm hợp buổi trong khoảng 0–1 cho cả bốn buổi', () => {
    for (const r of RECIPE_LIST) {
      expect(r.meal).toHaveLength(4);
      for (const v of r.meal) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    }
  });
  it('mỗi buổi đều có ít nhất ba món hợp', () => {
    for (const h of [7, 12, 18, 22]) {
      const fits = RECIPE_LIST.filter((r) => R.fitsPeriod(r, h));
      expect(fits.length).toBeGreaterThanOrEqual(3);
    }
  });
});
