// BẬC 6 (NHÀ HÀNG BÌNH DÂN) & BẬC 7 (CHUỖI CỬA HÀNG) — kiểm thử toàn diện nhánh kinh doanh #1.
import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { TIERS, GEAR, FUTURE_TIERS } from '../src/data/gear';
import { RECIPES } from '../src/data/recipes';
import { RNG } from '../src/core/util';
import { migrate, absMin } from '../src/sim/state';
import { withStall, persona, give, IDLE } from './helpers';

describe('Bậc 6 (Nhà hàng bình dân) & Bậc 7 (Chuỗi cửa hàng) — dữ liệu & nâng cấp', () => {
  it('mở đủ 7 bậc kinh doanh, chỉ số và giá tăng dần hợp lý', () => {
    expect(FUTURE_TIERS).toEqual([]);
    expect(TIERS).toHaveLength(8); // 0..7
    const t5 = TIERS[5], t6 = TIERS[6], t7 = TIERS[7];
    expect(t6.id).toBe('nhahang');
    expect(t6.name).toBe('Nhà hàng bình dân');
    expect(t7.id).toBe('chuoi');
    expect(t7.name).toBe('Chuỗi cửa hàng');

    for (const k of ['cap', 'coldCap', 'queue', 'menu', 'trays', 'visible'] as const) {
      expect(t6[k]).toBeGreaterThan(t5[k]);
      expect(t7[k]).toBeGreaterThan(t6[k]);
    }
    expect(GEAR.nhahang.price).toBeGreaterThan(GEAR.quanngoi.price);
    expect(GEAR.chuoi.price).toBeGreaterThan(GEAR.nhahang.price);
  });

  it('seatCount, isRestaurant, isChain phản ánh đúng bậc 6 và bậc 7', () => {
    const g = withStall(101);
    g.stall.tier = 5;
    expect(R.seatCount(g)).toBe(6);
    expect(R.isRestaurant(g)).toBe(false);
    expect(R.isChain(g)).toBe(false);

    g.stall.tier = 6;
    expect(R.seatCount(g)).toBe(8);
    expect(R.isRestaurant(g)).toBe(true);
    expect(R.isChain(g)).toBe(false);

    g.stall.tier = 7;
    expect(R.seatCount(g)).toBe(8);
    expect(R.isRestaurant(g)).toBe(true);
    expect(R.isChain(g)).toBe(true);
  });
});

describe('Bậc 6 — Phụ bếp, Khách đoàn & Đặt bàn trước', () => {
  it('thuê phụ bếp ở bậc 6 giúp giữ cốt sơ chế lâu hơn ×1,5, nấu dễ hơn và tự động nấu bù khi khay vơi', () => {
    const g = withStall(202);
    g.cash = 500000;
    g.stall.tier = 5;
    // Chưa lên bậc 6 thì không thuê được phụ bếp
    expect(R.hireChef(g)).toBe(false);

    g.stall.tier = 6;
    g.stall.where = 'placed';
    g.stall.spot = 'matbang_tb';
    g.stall.open = true;
    const ease0 = R.cookEase(g);
    expect(R.hireChef(g, R.CHEF_POOL[0])).toBe(true);
    expect(g.chef?.name).toBe(R.CHEF_POOL[0].name);
    expect(R.cookEase(g)).toBeCloseTo(ease0 + 0.15, 5);

    // Giữ cốt sơ chế tươi lâu hơn ×1,5
    const r = RECIPES.pho_bo;
    const at = absMin(g) - Math.floor(r.hold * 1.2);
    expect(R.holdFactor(g, r, at)).toBe(1);

    // Phụ bếp tự động làm sẵn món đang bật khi khay vơi
    for (const k of Object.keys(g.rec)) g.rec[k].on = false;
    g.rec.tra_da.known = true;
    g.rec.tra_da.on = true;
    give(g, 'tra', 10);
    give(g, 'da', 10);
    give(g, 'than', 5);
    g.stall.ready = [];
    const cooked = R.chefAutoCook(g);
    expect(cooked?.id).toBe('tra_da');
    expect(R.readyCount(g, 'tra_da')).toBeGreaterThan(0);
  });

  it('nhà hàng bậc 6 có sổ đặt bàn trước mỗi ngày và phục vụ đoàn đặt bàn nhận thưởng + uy tín', () => {
    const g = withStall(303);
    g.stall.tier = 6;
    g.stall.where = 'placed';
    g.stall.spot = 'matbang_dc';
    g.stall.open = true;

    const bks = R.ensureBookings(g);
    expect(bks).toHaveLength(3);
    const b0 = bks[0];
    expect(b0.pax).toBeGreaterThanOrEqual(2);
    expect(b0.pax).toBeLessThanOrEqual(4);

    // Chưa đủ phần làm sẵn trên khay → từ chối phục vụ đoàn
    g.stall.ready = [];
    expect(R.fulfillBooking(g, b0.id).ok).toBe(false);

    // Có đủ phần trên khay → phục vụ đoàn thành công, cộng doanh thu + thưởng giữ bàn + uy tín
    g.stall.ready.push({ rid: b0.rid, n: b0.pax, q: 0.92, at: absMin(g), cost: 4000 });
    const cash0 = g.cash, rep0 = g.rep;
    const res = R.fulfillBooking(g, b0.id);
    expect(res.ok).toBe(true);
    expect(g.cash).toBe(cash0 + res.rev + res.bonus);
    expect(g.rep).toBeGreaterThan(rep0);
    expect(b0.done).toBe(true);
    // Không phục vụ trùng lần 2
    expect(R.fulfillBooking(g, b0.id).ok).toBe(false);
  });

  it('nhà hàng bậc 6 đón khách đi theo đoàn (group order 2–4 phần)', () => {
    const g = withStall(404);
    g.stall.tier = 6;
    g.stall.where = 'placed';
    g.stall.spot = 'matbang_tb';
    g.stall.open = true;
    g.min = 12 * 60;
    g.rec.com_suon.known = true;
    g.rec.com_suon.on = true;
    g.stall.ready.push({ rid: 'com_suon', n: 50, q: 0.9, at: absMin(g), cost: 8000 });

    let groups = 0;
    const rng = new RNG(999);
    for (let i = 0; i < 60; i++) {
      const d = R.decide(g, persona('vanphong', 120000), false, rng);
      if (d.order?.group) {
        groups++;
        expect(d.order.n).toBeGreaterThanOrEqual(2);
        expect(d.order.n).toBeLessThanOrEqual(4);
      }
    }
    expect(groups).toBeGreaterThan(5);
  });
});

describe('Bậc 7 — Chuỗi cửa hàng & Chi nhánh thứ hai', () => {
  it('mở Chi nhánh 2 ở mặt bằng khác, tự động bán hàng theo giờ và thu phí đầu ngày', () => {
    const g = withStall(505);
    g.cash = 2000000;
    g.rep = 50;
    g.stall.tier = 7;
    g.stall.where = 'placed';
    g.stall.spot = 'matbang_dc';
    g.stall.open = true;

    // Không được mở trùng điểm với quán chính
    expect(R.openBranch(g, 'matbang_dc').ok).toBe(false);

    const spots = R.branchSpots(g);
    expect(spots.some((s) => s.id === 'matbang_tb')).toBe(true);
    expect(spots.some((s) => s.id === 'matbang_dc')).toBe(false);

    const res = R.openBranch(g, 'matbang_tb', R.BRANCH_MANAGERS[0]);
    expect(res.ok).toBe(true);
    expect(g.branch?.spot).toBe('matbang_tb');
    expect(g.branch?.open).toBe(true);

    // Mô phỏng 1 giờ bán hàng của Chi nhánh 2 lúc 12h trưa
    const cashBefore = g.cash;
    const hr = R.tickBranchHour(g, 12, new RNG(123));
    expect(hr.sold).toBeGreaterThan(0);
    expect(hr.rev).toBeGreaterThan(0);
    expect(g.cash).toBe(cashBefore + hr.rev);
    expect(g.branch?.todaySold).toBe(hr.sold);
    expect(g.branch?.totalSold).toBe(hr.sold);

    // Qua ngày mới: tự động đóng phí mặt bằng Chi nhánh 2 + lương Quản lý, reset todaySold nhưng giữ totalSold
    g.min = 23 * 60 + 50;
    R.advance(g, 20, IDLE, new RNG(456));
    expect(g.branch?.todaySold).toBe(0);
    expect(g.branch?.totalSold).toBeGreaterThanOrEqual(hr.sold);
    expect(g.branch?.todayRent).toBeGreaterThan(0);

    // Kiểm tra migrate bảo toàn dữ liệu chef, bookings, branch
    const copy = migrate(JSON.parse(JSON.stringify(g)))!;
    expect(copy.stall.tier).toBe(7);
    expect(copy.branch?.spot).toBe('matbang_tb');
  });
});
