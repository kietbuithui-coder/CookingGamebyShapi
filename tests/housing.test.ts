// Chỗ ở thuê: giá, sức chứa, uy tín đòi hỏi, và chuyện bị đuổi khi nợ tiền nhà.
import { describe, it, expect } from 'vitest';
import { HOUSING, HOUSING_LIST } from '../src/data/gear';
import { payHousing, canRent, rentNeed, advance, has, PLUGGABLE } from '../src/sim/rules';
import { LOTS } from '../src/world/layout';
import { fresh, give, IDLE } from './helpers';

const NEW = ['canho', 'nharieng', 'cuahang'];

describe('chỗ ở', () => {
  it('mã chỗ ở không trùng nhau và mỗi chỗ có đủ tên, mô tả, mỏ neo', () => {
    const ids = HOUSING_LIST.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(HOUSING_LIST.length).toBe(8);
    for (const h of HOUSING_LIST) {
      expect(h.name.length).toBeGreaterThan(2);
      expect(h.desc.length).toBeGreaterThan(10);
      expect(h.anchor).toBe('bed_' + h.id);
      expect(h.storage).toBeGreaterThanOrEqual(0);
    }
  });

  it('thuê theo tuần: giá cao hơn thì chứa được nhiều hơn và đòi uy tín cao hơn', () => {
    const weekly = HOUSING_LIST.filter((h) => h.per === 'tuần').sort((a, b) => a.rent - b.rent);
    expect(weekly.map((h) => h.id)).toEqual(['tro', 'canho', 'nharieng', 'cuahang']);
    for (let i = 1; i < weekly.length; i++) {
      expect(weekly[i].storage).toBeGreaterThan(weekly[i - 1].storage);
      expect(weekly[i].needRep ?? 0).toBeGreaterThan(weekly[i - 1].needRep ?? 0);
      expect(weekly[i].rent).toBeGreaterThan(weekly[i - 1].rent);
      expect(weekly[i].sleep).toBeGreaterThan(0.9);
    }
  });

  it('ba chỗ mới đều có lô đất trong thành phố, đúng khu đã định', () => {
    for (const id of NEW) {
      const lot = LOTS.find((l) => l.id === id && l.kind === id);
      expect(lot, `thiếu lô ${id}`).toBeTruthy();
      expect(HOUSING[id].needRep ?? 0).toBeGreaterThan(0);
    }
    expect(LOTS.find((l) => l.id === 'canho')!.kind).toBe('canho');
    expect(LOTS.find((l) => l.id === 'nharieng')!.kind).toBe('nharieng');
    expect(LOTS.find((l) => l.id === 'cuahang')!.kind).toBe('cuahang');
  });

  it('chưa đủ uy tín thì không cho thuê, tiền còn nguyên', () => {
    const g = fresh();
    g.cash = 5000000; g.rep = rentNeed('canho') - 1;
    expect(canRent(g, 'canho')).toBe(false);
    expect(payHousing(g, 'canho')).toBe(false);
    expect(g.housing).toBe('gamcau');
    expect(g.cash).toBe(5000000);
    g.rep = rentNeed('canho');
    expect(canRent(g, 'canho')).toBe(true);
    expect(payHousing(g, 'canho')).toBe(true);
    expect(g.housing).toBe('canho');
    expect(g.paidUntil).toBe(g.day + 7);
    expect(g.cash).toBe(5000000 - HOUSING.canho.rent);
    expect(g.flags.lived_canho).toBe(1);
  });

  it('không đủ tiền thì ở lại chỗ cũ', () => {
    const g = fresh();
    g.cash = 1000; g.rep = 60;
    expect(payHousing(g, 'nharieng')).toBe(false);
    expect(g.housing).toBe('gamcau');
    expect(g.cash).toBe(1000);
  });

  it('mã chỗ ở lạ thì trả về false chứ không làm sập ván', () => {
    const g = fresh();
    g.cash = 900000; g.rep = 100;
    expect(() => payHousing(g, 'bietthu')).not.toThrow();
    expect(payHousing(g, 'bietthu')).toBe(false);
    expect(canRent(g, 'bietthu')).toBe(true); // không đòi uy tín thì coi như mở
    expect(g.housing).toBe('gamcau');
  });

  it('nợ tiền nhà hai ngày thì mất chỗ, đồ trong nhà bị giữ, tủ lạnh cũng mất', () => {
    const g = fresh();
    g.cash = 5000000; g.rep = 60;
    expect(payHousing(g, 'cuahang')).toBe(true);
    g.gear.tulanh = 100;
    give(g, 'gao', 3, 90, 0.9, 12000, 'home');
    g.paidUntil = g.day - 2;              // trễ hai ngày
    g.cash = 0;
    expect(has(g, 'tulanh')).toBe(true);
    advance(g, 1440, IDLE);                // qua ngày mới → chủ nhà lấy lại
    expect(g.housing).toBe('gamcau');
    expect(g.home.length).toBe(0);
    expect(has(g, 'tulanh')).toBe(false);
  });

  it('nhà thuê theo tuần cắm được tủ lạnh, gầm cầu và ghế đá thì không', () => {
    expect(PLUGGABLE).toEqual(['tro', 'canho', 'nharieng', 'cuahang']);
    for (const id of NEW) expect(PLUGGABLE).toContain(id);
    expect(PLUGGABLE).not.toContain('gamcau');
    expect(PLUGGABLE).not.toContain('ghe');
  });
});
