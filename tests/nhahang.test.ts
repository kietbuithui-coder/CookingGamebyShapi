// BẬC 6 — NHÀ HÀNG BÌNH DÂN: nội thất trong nhà kín (4 bàn 8 ghế, phòng bếp riêng),
// đặt bàn trước, nhân viên phụ bếp tự sơ chế & nấu phụ, và khách đoàn 3–4 người.
import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { RNG } from '../src/core/util';
import { RECIPES } from '../src/data/recipes';
import { TIERS, GEAR, FUTURE_TIERS } from '../src/data/gear';
import { SOUS_POOL } from '../src/data/people';
import { SAVE_VERSION, migrate, newGame, type Game } from '../src/sim/state';
import { withStall, persona, IDLE } from './helpers';

function restaurantAt(min = 11 * 60 + 30): Game {
  const g = withStall(66001);
  g.stall = { ...g.stall, tier: 6, where: 'placed', spot: 'matbang_tb', open: true, cond: 100 };
  g.gear.nhahang = 1;
  g.cash = 5000000;
  g.min = min;
  return g;
}

function stockAndEnable(g: Game, rid: string, qtyEach = 10) {
  const r = RECIPES[rid];
  g.rec[rid].known = true;
  g.rec[rid].on = true;
  for (const [id, per] of Object.entries(r.ings)) {
    g.stall.store.push({ id, n: per * qtyEach, fresh: 95, q: 0.9, cost: 3000 });
  }
  g.stall.store.push({ id: 'gas', n: 3, fresh: 99999, q: 1, cost: 28000 });
  g.stall.store.push({ id: 'than', n: 3, fresh: 99999, q: 1, cost: 20000 });
}

describe('dữ liệu bậc 6 — Nhà hàng bình dân', () => {
  it('TIERS[6] rộng hơn bậc 5 về sức chứa, thực đơn, hàng chờ và tầm nhìn', () => {
    const t5 = TIERS[5], t6 = TIERS[6];
    expect(t6).toBeTruthy();
    expect(t6.id).toBe('nhahang');
    expect(t6.name).toBe('Nhà hàng bình dân');
    expect(t6.cap).toBeGreaterThan(t5.cap);
    expect(t6.coldCap).toBeGreaterThan(t5.coldCap);
    expect(t6.menu).toBeGreaterThan(t5.menu);
    expect(t6.queue).toBeGreaterThan(t5.queue);
    expect(t6.visible).toBeGreaterThan(t5.visible);
    expect(t6.trays).toBeGreaterThan(t5.trays);
  });

  it('GEAR.nhahang hợp lệ; bậc 7 có dữ liệu nên FUTURE_TIERS rỗng', () => {
    const d = GEAR.nhahang;
    expect(d.kind).toBe('stall');
    expect(d.tier).toBe(6);
    expect(d.price).toBeGreaterThan(GEAR.quanngoi.price);
    expect(FUTURE_TIERS).toEqual([]);
    expect(GEAR.chuoi.tier).toBe(7);
  });
});

describe('nội thất trong nhà kín & chỗ ngồi', () => {
  it('bậc 6 có 8 ghế (4 bàn) và bật cờ isRestaurant + dineIn', () => {
    const g = restaurantAt();
    expect(R.seatCount(g)).toBe(8);
    expect(R.dineIn(g)).toBe(true);
    expect(R.isRestaurant(g)).toBe(true);
    expect(R.isRestaurant(withStall(1))).toBe(false);
  });

  it('nhà hàng trong nhà kín không mất khách vì mưa và giữ sáng tốt hơn vào ban đêm', () => {
    const r = restaurantAt(20 * 60);
    const s5 = restaurantAt(20 * 60);
    s5.stall.tier = 5;
    delete r.gear.den; delete s5.gear.den;
    r.weather.now = 'muato'; s5.weather.now = 'muato';
    expect(R.stallAppeal(r)).toBeGreaterThan(R.stallAppeal(s5));
  });
});

describe('nhân viên phụ bếp', () => {
  it('chỉ cho thuê khi đạt Nhà hàng bình dân (bậc 6)', () => {
    const g5 = restaurantAt();
    g5.stall.tier = 5;
    expect(R.sousGate(g5).ok).toBe(false);

    const g6 = restaurantAt();
    expect(R.sousGate(g6).ok).toBe(true);
  });

  it('hireSous trừ ngày lương đầu và fireSous cho nghỉ sạch sẽ', () => {
    const g = restaurantAt();
    const cand = SOUS_POOL[0];
    const cash0 = g.cash;
    expect(R.hireSous(g, cand)).toBe(true);
    expect(g.sous?.name).toBe(cand.name);
    expect(g.cash).toBe(cash0 - cand.wage);
    expect(R.hireSous(g, SOUS_POOL[1])).toBe(true);
    expect(R.hireSous(g, SOUS_POOL[2])).toBe(false);

    const old = R.fireSous(g, 1);
    expect(old?.name).toBe(cand.name);
    expect(g.sous?.name).toBe(SOUS_POOL[1].name);
    R.fireSous(g, 1);
    expect(g.sous).toBeNull();
  });

  it('sousWork tự sơ chế mẻ thiếu và nấu sẵn phần ăn khi đủ nguyên liệu & nhiên liệu', () => {
    const g = restaurantAt();
    expect(R.hireSous(g, SOUS_POOL[0])).toBe(true);
    stockAndEnable(g, 'banh_mi_trung', 8);

    const w1 = R.sousWork(g);
    expect(w1).not.toBeNull();
    if (w1?.kind === 'prep') {
      expect(g.stall.preps.some((p) => p.rid === 'banh_mi_trung' && p.n > 0)).toBe(true);
      const w2 = R.sousWork(g);
      expect(w2?.kind).toBe('ready');
    } else {
      expect(w1?.kind).toBe('ready');
    }
    expect(R.readyCount(g, 'banh_mi_trung')).toBeGreaterThanOrEqual(1);
  });

  it('sousWork không làm rò nguyên liệu khi hết nhiên liệu', () => {
    const g = restaurantAt();
    expect(R.hireSous(g, SOUS_POOL[0])).toBe(true);
    g.rec.com_suon.known = true; g.rec.com_suon.on = true;
    for (const [id, per] of Object.entries(RECIPES.com_suon.ings)) {
      g.stall.store.push({ id, n: per * 4, fresh: 95, q: 0.9, cost: 3000 });
    }
    // Không thêm gas/than
    g.stall.fuel = 0;
    const before = g.stall.store.map((s) => ({ ...s }));
    const res = R.sousWork(g);
    expect(res).toBeNull();
    expect(g.stall.store).toEqual(before);
  });

  it('sang ngày mới trừ lương phụ bếp nếu đủ tiền, thiếu tiền thì phụ bếp nghỉ', () => {
    const g = restaurantAt(23 * 60 + 50);
    const cand = SOUS_POOL[1];
    R.hireSous(g, cand);
    const before = g.cash;
    R.advance(g, 20, IDLE, new RNG(1));
    expect(g.day).toBe(1);
    expect(g.sous).not.toBeNull();
    expect(g.cash).toBe(before - cand.wage - R.stallRent(g));

    g.cash = 1000;
    g.min = 23 * 60 + 50;
    R.advance(g, 20, IDLE, new RNG(2));
    expect(g.day).toBe(2);
    expect(g.sous).toBeNull();
  });
});

describe('đặt bàn trước', () => {
  it('tạo, nhận, đếm ghế giữ chỗ, khớp giờ hẹn và từ chối đặt bàn', () => {
    const g = restaurantAt(10 * 60);
    const b = R.createBooking(g, new RNG(42))!;
    expect(b).toBeTruthy();
    expect(b.status).toBe('pending');
    expect(b.size).toBeGreaterThanOrEqual(2);
    expect(b.size).toBeLessThanOrEqual(4);
    expect(b.deposit).toBe(b.size * 12000);

    expect(R.acceptBooking(g, b.id)?.status).toBe('accepted');
    g.day = b.day;
    g.min = Math.round(b.hour * 60);
    expect(R.dueBooking(g)?.id).toBe(b.id);
    expect(R.reservedSeats(g)).toBe(b.size);

    const repBefore = g.rep;
    expect(R.rejectBooking(g, b.id)).toBe(true);
    expect(g.bookings.length).toBe(0);
    expect(g.rep).toBeLessThanOrEqual(repBefore);
  });

  it('giới hạn tối đa BOOKING_MAX đặt bàn hoạt động và phạt nhẹ uy tín nếu lỡ hẹn bàn đã nhận', () => {
    const g = restaurantAt(9 * 60);
    g.rep = 20;
    const rng = new RNG(7);
    for (let i = 0; i < R.BOOKING_MAX; i++) expect(R.createBooking(g, rng)).not.toBeNull();
    expect(R.createBooking(g, rng)).toBeNull();

    const first = g.bookings[0];
    R.acceptBooking(g, first.id);
    g.day = first.day + 1;
    const missed = R.expireBookings(g);
    expect(missed.some((m) => m.id === first.id)).toBe(true);
    expect(g.rep).toBeLessThan(20);
  });
});

describe('khách đoàn', () => {
  it('decideGroup gọi chung một lượt theo cỡ đoàn (3–4 người)', () => {
    const g = restaurantAt(12 * 60);
    g.rec.com_suon.known = true; g.rec.com_suon.on = true;
    g.stall.ready.push({ rid: 'com_suon', n: 6, q: 0.9, at: g.day * 1440 + g.min, cost: 12000 });
    const p = persona('vanphong', 90000);
    const res = R.decideGroup(g, p, 4, false, new RNG(11), 'com_suon');
    expect(res.order).toBeTruthy();
    expect(res.order!.group).toBe(4);
    expect(res.order!.n).toBe(4);
    expect(res.order!.line).toContain('4');
  });

  it('khi món còn ít hơn cỡ đoàn thì giới hạn phần gọi theo lượng có sẵn', () => {
    const g = restaurantAt(12 * 60);
    g.rec.banh_mi_trung.known = true; g.rec.banh_mi_trung.on = true;
    g.stall.ready.push({ rid: 'banh_mi_trung', n: 2, q: 0.9, at: g.day * 1440 + g.min, cost: 5000 });
    const p = persona('congnhan', 80000);
    const res = R.decideGroup(g, p, 4, true, new RNG(5));
    expect(res.order).toBeTruthy();
    expect(res.order!.n).toBe(2);
    expect(res.order!.group).toBe(4);
  });
});

describe('di trú bản lưu v11 -> phiên bản mới nhất', () => {
  it('bản lưu v11 được nâng lên SAVE_VERSION với sous null và bookings rỗng', () => {
    const g = newGame(9);
    const raw: any = JSON.parse(JSON.stringify(g));
    raw.v = 11;
    delete raw.sous;
    delete raw.bookings;
    delete raw.bookSeq;
    const m = migrate(raw)!;
    expect(m.v).toBe(SAVE_VERSION);
    expect(m.sous).toBeNull();
    expect(m.sous2).toBeNull();
    expect(m.help2).toBeNull();
    expect(m.bookings).toEqual([]);
    expect(m.bookSeq).toBe(1);
  });
});
