import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { RECIPES } from '../src/data/recipes';
import { SAVE_VERSION, migrate, newGame, absMin, type Game } from '../src/sim/state';
import { withStall, persona, IDLE } from './helpers';

function tierAt(t: number): Game {
  const g = withStall(88001);
  g.stall = { ...g.stall, tier: t, where: 'placed', spot: t >= 4 ? 'matbang_tb' : 'cho', open: true, cond: 100 };
  if (t >= 6) g.gear.nhahang = 1;
  g.cash = 50000000;
  g.min = 12 * 60;
  return g;
}

describe('nâng cấp tiện lợi, thiết bị công nghiệp & đa nhân sự', () => {
  it('kiểm tra điều kiện bậc quầy khi mua thiết bị nâng cấp', () => {
    const g = tierAt(1);
    expect(R.buyGear(g, 'bep_cn')).toBe('tier');
    expect(R.buyGear(g, 'dieu_hoa')).toBe('tier');
    expect(R.buyGear(g, 'loa')).toBe('ok');
    expect(R.buyGear(g, 'hopmangve')).toBe('ok');
    expect(R.stallQueueCap(g)).toBe(5);
  });

  it('đồ tiện lợi bậc thấp và trung bình tăng sức hút, chất lượng nước/chè và khay chứa', () => {
    const g = tierAt(3);
    const baseAppeal = R.stallAppeal(g);
    const baseTrays = R.stallTrayCap(g);

    expect(R.buyGear(g, 'loa')).toBe('ok');
    expect(R.buyGear(g, 'tu_kinh')).toBe('ok');
    expect(R.buyGear(g, 'mayep')).toBe('ok');
    expect(R.buyGear(g, 'binh_tra')).toBe('ok');

    expect(R.stallAppeal(g)).toBeGreaterThan(baseAppeal * 1.2);
    expect(R.stallTrayCap(g)).toBe(baseTrays + 8);
    expect(R.helperPatience(g)).toBeGreaterThan(1.1);

    const tra = RECIPES.tra_da;
    const gPlain = tierAt(3);
    expect(R.dishQuality(g, tra, 0.8, 0.85, 1)).toBeGreaterThan(R.dishQuality(gPlain, tra, 0.8, 0.85, 1));
  });

  it('bếp Á công nghiệp & tủ đông công nghiệp ở bậc 5–6 hoạt động đúng', () => {
    const g = tierAt(5);
    expect(R.buyGear(g, 'bep_cn')).toBe('ok');
    expect(R.buyGear(g, 'tu_dong')).toBe('ok');

    expect(R.stove(g)).toBe('bepgas');
    expect(R.stallCap(g)).toBe(280);
    expect(R.stallChilled(g)).toBe(true);
    expect(R.cookEase(g)).toBeGreaterThan(1.1);

    // Kiểm tra tiết kiệm gas 35%
    g.stall.store.push({ id: 'gas', n: 2, fresh: 99999, q: 1, cost: 28000 });
    expect(R.useFuel(g, 1)).toBe(true);
    expect(g.stall.fuel).toBeCloseTo(14 - 0.65, 4);
  });

  it('tiện nghi nhà hàng (máy lạnh, lavabo, hút mùi, POS, wifi) tăng đánh giá & giảm độ bẩn', () => {
    const gClean = tierAt(6);
    const gPlain = tierAt(6);
    for (const id of ['wc_lavabo', 'hut_mui', 'dieu_hoa', 'may_tinh_tien', 'wifi_nhac']) {
      expect(R.buyGear(gClean, id)).toBe('ok');
    }

    const p = persona('khotinh');
    const order = { rid: 'pho_bo', n: 2, price: 35000, ratio: 1, line: '2 phở', mood: 'ok' as const };
    const rClean = R.review(gClean, p, true, order, 0.82, 0.3);
    const rPlain = R.review(gPlain, p, true, order, 0.82, 0.3);
    expect(rClean.stars).toBeGreaterThan(rPlain.stars);
    expect(R.helperPatience(gClean)).toBeGreaterThan(R.helperPatience(gPlain) + 0.35);

    R.settleSale(gClean, order, 20000, rClean, 0.82);
    R.settleSale(gPlain, order, 20000, rPlain, 0.82);
    expect(gClean.stall.dirt).toBeLessThan(gPlain.stall.dirt);
  });

  it('nhà hàng bình dân bậc 6 thuê được tối đa 2 phụ bếp & 2 nhân viên phục vụ không trùng tên', () => {
    const g5 = tierAt(5);
    expect(R.maxHelpers(g5)).toBe(1);
    expect(R.maxSous(g5)).toBe(0);

    const g = tierAt(6);
    expect(R.maxHelpers(g)).toBe(2);
    expect(R.maxSous(g)).toBe(2);

    expect(R.hireSous(g)).toBe(true);
    expect(R.hireSous(g)).toBe(true);
    expect(R.hireSous(g)).toBe(false);
    expect(R.sousCount(g)).toBe(2);
    expect(g.sous!.name).not.toBe(g.sous2!.name);

    expect(R.hireHelper(g)).toBe(true);
    expect(R.hireHelper(g)).toBe(true);
    expect(R.hireHelper(g)).toBe(false);
    expect(R.helperCount(g)).toBe(2);
    expect(g.help!.name).not.toBe(g.help2!.name);
    expect(R.helperPatience(g)).toBeGreaterThan(1.5);

    // Cho người đầu nghỉ thì người thứ 2 dồn lên vị trí chính
    const secondHelp = g.help2!.name;
    R.fireHelper(g, 1);
    expect(R.helperCount(g)).toBe(1);
    expect(g.help!.name).toBe(secondHelp);
    expect(g.help2).toBeNull();

    // Sang ngày mới trả lương cho cả nhân viên thứ 2
    const beforeCash = g.cash;
    R.advance(g, 13 * 60, IDLE);
    expect(g.cash).toBeLessThan(beforeCash);
  });

  it('di trú save từ v12 lên phiên bản mới nhất giữ nguyên dữ liệu', () => {
    const old = newGame(123, 'chị');
    old.v = 12;
    delete (old as any).help2;
    delete (old as any).sous2;
    const m = migrate(old)!;
    expect(m.v).toBe(SAVE_VERSION);
    expect(m.help2).toBeNull();
    expect(m.sous2).toBeNull();
  });
});
