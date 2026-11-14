// Sạp cố định (bậc 3): phí chỗ tính theo ngày, thiếu tiền thì quầy phải đóng — nên kiểm riêng.
import { describe, it, expect } from 'vitest';
import { stallRent, payStallRent, buyGear, advance, has } from '../src/sim/rules';
import { SPOTS } from '../src/world/layout';
import { TIERS } from '../src/data/gear';
import { fresh, IDLE } from './helpers';

const placedT3 = (cash = 500000) => {
  const g = fresh();
  g.cash = cash;
  g.gear.sap = 100;
  g.stall = { ...g.stall, tier: 3, where: 'placed', spot: 'cho', x: 0, z: 0, yaw: 0, open: false, cond: 100 };
  return g;
};

describe('sạp cố định', () => {
  it('chỉ sạp đã đặt chỗ mới phải đóng phí, gánh và xe đẩy thì không', () => {
    const g = placedT3();
    expect(stallRent(g)).toBe(SPOTS.find((s) => s.id === 'cho')!.fee);
    g.stall = { ...g.stall, tier: 2 };
    expect(stallRent(g)).toBe(0);
    g.stall = { ...g.stall, tier: 3, where: 'carried', spot: null };
    expect(stallRent(g)).toBe(0);
  });
  it('đóng phí thì trừ tiền, ghi sổ và xoá cờ nợ', () => {
    const g = placedT3(), fee = stallRent(g);
    g.flags.sapNo = 1;
    expect(payStallRent(g)).toBe(true);
    expect(g.cash).toBe(500000 - fee);
    expect(g.flags.sapNo).toBeUndefined();
    expect(g.stall.paidDay).toBe(g.day);
  });
  it('thiếu tiền thì không trừ, treo cờ nợ', () => {
    const g = placedT3(1000);
    expect(payStallRent(g)).toBe(false);
    expect(g.cash).toBe(1000);
    expect(g.flags.sapNo).toBe(1);
  });
  it('qua ngày mới tự trừ phí chỗ', () => {
    const g = placedT3();
    const fee = stallRent(g), cash0 = g.cash, day0 = g.day;
    g.min = 23 * 60 + 50;
    advance(g, 20, IDLE);
    expect(g.day).toBe(day0 + 1);
    expect(g.cash).toBe(cash0 - fee);
    expect(g.flags.sapNo).toBeUndefined();
  });
  it('qua ngày mà không đủ tiền thì quầy đóng và bị treo nợ phí', () => {
    const g = placedT3(500);
    g.stall.open = true; g.min = 23 * 60 + 50;
    advance(g, 20, IDLE);
    expect(g.flags.sapNo).toBe(1);
    expect(g.stall.open).toBe(false);
  });
  it('mua sạp thì lên bậc 3, đang cầm trong người và chưa có chỗ', () => {
    const g = fresh(); g.cash = 9000000; g.gear.xeday = 100; g.gear.ganh = 100;
    expect(buyGear(g, 'sap')).toBe('ok');
    expect(has(g, 'sap')).toBe(true);
    expect(g.stall.tier).toBe(3);
    expect(g.stall.where).toBe('carried');
    expect(g.stall.spot).toBe(null);
    expect(g.cash).toBe(0);
  });
  it('bậc 3 rộng hơn hẳn xe đẩy', () => {
    const t2 = TIERS[2], t3 = TIERS[3];
    expect(t3.cap).toBeGreaterThan(t2.cap);
    expect(t3.menu).toBeGreaterThan(t2.menu);
    expect(t3.queue).toBeGreaterThan(t2.queue);
    expect(t3.trays).toBeGreaterThan(t2.trays);
  });

  it('bậc 4 (quán ăn nhỏ) rộng hơn sạp, giá đắt hơn và đòi mặt bằng có sân', () => {
    const t1 = TIERS[3], t4 = TIERS[4];
    expect(t4.id).toBe('quanan');
    for (const k of ['cap', 'coldCap', 'queue', 'menu', 'trays', 'visible'] as const) expect(t4[k]).toBeGreaterThan(t1[k]);
    expect(t4.queue).toBeGreaterThanOrEqual(9);
    // hai mặt bằng cho quán ăn nhỏ, phí cao hơn hẳn chỗ bán thường, và không chỗ nào đòi quá bậc 4
    const big = SPOTS.filter((s) => s.minTier >= 4);
    expect(big.length).toBe(2);
    for (const s of big) expect(s.fee).toBeGreaterThanOrEqual(100000);
    for (const s of SPOTS) expect(s.minTier).toBeLessThanOrEqual(4);
  });
  it('đặt quán ăn nhỏ ở mặt bằng thì tiền thuê ngày đúng bằng phí mặt bằng', () => {
    const g = placedT3();
    g.gear.quanan = 100; g.stall = { ...g.stall, tier: 4, spot: 'matbang_dc', where: 'placed' };
    const sp = SPOTS.find((s) => s.id === 'matbang_dc')!;
    expect(stallRent(g)).toBe(sp.fee);
    // đóng tiền thì trừ ví, hết tiền thì treo cờ nợ và quầy không mở được
    g.cash = sp.fee + 5000;
    expect(payStallRent(g)).toBe(true);
    expect(g.cash).toBe(5000);
    g.cash = 0; g.stall = { ...g.stall, paidDay: g.day - 1 };
    expect(payStallRent(g)).toBe(false);
    expect(g.flags.sapNo).toBe(1);
  });
  it('mua quán ăn nhỏ thì quầy về trạng thái xách tay, phải chọn mặt bằng mới dựng lại', () => {
    const g = fresh(); g.cash = 30000000; g.gear.sap = 100;
    g.stall = { ...g.stall, tier: 3, where: 'placed', spot: 'cho', x: 0, z: 0, yaw: 0, open: true };
    expect(buyGear(g, 'quanan')).toBe('ok');
    expect(has(g, 'quanan')).toBe(true);
    expect(g.stall.tier).toBe(4);
    expect(g.stall.where).toBe('carried');
    expect(g.stall.spot).toBe(null);
    expect(g.stall.open).toBe(false);
  });
  it('mua quán ăn nhỏ khi không đủ tiền thì không đổi bậc quầy', () => {
    const g = fresh(); g.cash = 100000; g.gear.sap = 100;
    g.stall = { ...g.stall, tier: 3, where: 'placed', spot: 'cho' };
    expect(buyGear(g, 'quanan')).toBe('cash');
    expect(g.stall.tier).toBe(3);
    expect(g.cash).toBe(100000);
  });
});
