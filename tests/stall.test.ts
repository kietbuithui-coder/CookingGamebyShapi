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
});
