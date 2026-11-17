// Kiểm tra các bổ sung: thời gian chờ khách (-15%..+30%) và mua đứt nhà cửa.
import { describe, it, expect } from 'vitest';
import { HOUSING } from '../src/data/gear';
import { PATIENCE_RANGE, buyHousing, payHousing, advance } from '../src/sim/rules';
import { fresh, IDLE } from './helpers';

describe('cải tiến 5 hạng mục', () => {
  it('khoảng dao động kiên nhẫn khách nằm đúng [-15%, +30%]', () => {
    expect(PATIENCE_RANGE[0]).toBeCloseTo(0.85, 5);
    expect(PATIENCE_RANGE[1]).toBeCloseTo(1.3, 5);
  });

  it('mua đứt nhà (canho / nharieng / cuahang): trừ đúng tiền, miễn thuê vĩnh viễn và dọn về lại miễn phí', () => {
    for (const id of ['canho', 'nharieng', 'cuahang'] as const) {
      const h = HOUSING[id];
      expect(h.buy).toBeGreaterThan(h.rent * 10);
      const g = fresh();
      g.rep = 80;
      g.cash = h.buy! + 100000;
      expect(buyHousing(g, id)).toBe(true);
      expect(g.cash).toBe(100000);
      expect(g.housing).toBe(id);
      expect(g.flags['owned_' + id]).toBe(1);
      expect(g.paidUntil).toBeGreaterThanOrEqual(999999);

      // Qua nhiều ngày không bị đuổi hoặc trừ tiền thuê
      for (let d = 0; d < 10; d++) advance(g, 1440, IDLE);
      expect(g.housing).toBe(id);
      expect(g.cash).toBe(100000);

      // Tạm dọn ra chỗ khác rồi dọn về lại nhà đã mua: không mất tiền
      g.housing = 'gamcau';
      expect(payHousing(g, id)).toBe(true);
      expect(g.housing).toBe(id);
      expect(g.cash).toBe(100000);
    }
  });

  it('không đủ tiền hoặc uy tín chưa đủ thì không thể mua đứt nhà', () => {
    const g = fresh();
    g.rep = 10;
    g.cash = 999999999;
    expect(buyHousing(g, 'canho')).toBe(false);
    g.rep = 90;
    g.cash = 1000;
    expect(buyHousing(g, 'canho')).toBe(false);
    expect(g.housing).toBe('gamcau');
  });
});
