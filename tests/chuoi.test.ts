// BẬC 7 — CHUỖI CỬA HÀNG: mở chi nhánh thứ hai ở chỗ bán khác, thuê người trông coi tự bán,
// chuyển món sẵn sang — hai chiều, sổ sách riêng, lương/thuê/hao hụt tính đầu ngày, và bản lưu v13 -> v14.
import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { RNG } from '../src/core/util';
import { RECIPES } from '../src/data/recipes';
import { INGS } from '../src/data/ingredients';
import { TIERS, GEAR, BRANCH_SITES, BRANCH_WAGE, FUTURE_TIERS } from '../src/data/gear';
import { KEEPER_POOL } from '../src/data/people';
import { SPOTS, spotById } from '../src/world/layout';
import { SAVE_VERSION, migrate, newGame, cleanBranch, type Game } from '../src/sim/state';
import { withStall, IDLE } from './helpers';

/** Ván đã lên Chuỗi cửa hàng, quán chính dựng ở mặt bằng, chưa mở chi nhánh. */
function chainAt(min = 9 * 60): Game {
  const g = withStall(12345);
  g.cash = 400000000;
  g.stall = { ...g.stall, tier: 7, where: 'placed', spot: 'matbang_tb', open: true, cond: 100 };
  g.gear.chuoi = 1;
  g.min = min;
  return g;
}
/** Mở chi nhánh ở cổng chợ + thuê người trông coi + đẩy sẵn món. */
function branchReady(g: Game, portions = 10): Game {
  R.openBranch(g, 'cho');
  R.hireKeeper(g, KEEPER_POOL[0]);
  g.stall.ready.push({ rid: 'com_suon', n: portions, q: 0.9, at: g.day * 1440 + g.min, cost: 12000 });
  g.rec.com_suon.known = true; g.rec.com_suon.on = true; g.rec.com_suon.price = 35000;
  R.moveToBranch(g, 'com_suon', portions);
  return g;
}

describe('dữ liệu bậc 7 — Chuỗi cửa hàng', () => {
  it('TIERS[7] rộng hơn bậc 6 và không mang đi được', () => {
    const t6 = TIERS[6], t7 = TIERS[7];
    expect(t7.id).toBe('chuoi');
    expect(t7.name).toBe('Chuỗi cửa hàng');
    expect(t7.cap).toBeGreaterThan(t6.cap);
    expect(t7.coldCap).toBeGreaterThan(t6.coldCap);
    expect(t7.menu).toBeGreaterThan(t6.menu);
    expect(t7.queue).toBeGreaterThan(t6.queue);
    expect(t7.speed).toBe(0);
    expect(FUTURE_TIERS).toEqual([]);
  });

  it('đồ nghề chuỗi đắt hơn nhà hàng bình dân và FUTURE_TIERS đã rỗng', () => {
    expect(GEAR.chuoi.kind).toBe('stall');
    expect(GEAR.chuoi.tier).toBe(7);
    expect(GEAR.chuoi.price).toBe(320000000);
    expect(GEAR.chuoi.price).toBeGreaterThan(GEAR.nhahang.price);
  });

  it('mỗi chỗ chi nhánh là chỗ bán có thật, giá thuê dương và khác chỗ của hai mặt bằng', () => {
    expect(BRANCH_SITES.length).toBeGreaterThanOrEqual(2);
    const ids = new Set<string>();
    for (const s of BRANCH_SITES) {
      expect(spotById(s.spot), s.spot).toBeTruthy();
      expect(s.rent).toBeGreaterThan(0);
      expect(s.note.length).toBeGreaterThan(10);
      expect(ids.has(s.spot)).toBe(false);
      ids.add(s.spot);
      // không chiếm chỗ của hai mặt bằng quán chính
      expect(['matbang_tb', 'matbang_dc']).not.toContain(s.spot);
    }
    expect(BRANCH_WAGE).toBeGreaterThan(0);
  });

  it('có ít nhất 2 ứng viên trông coi, ai cũng có tên, giới, lương và câu xin việc', () => {
    expect(KEEPER_POOL.length).toBeGreaterThanOrEqual(2);
    for (const k of KEEPER_POOL) {
      expect(k.name.length).toBeGreaterThan(0);
      expect(k.wage).toBeGreaterThan(0);
      expect(k.ask.length).toBeGreaterThan(20);
    }
  });
});

describe('luật mở chi nhánh', () => {
  it('chưa lên bậc 7 thì không mở được, có lý do rõ ràng', () => {
    const g = withStall();
    g.cash = 400000000;
    const gate = R.branchGate(g, 'cho');
    expect(gate.ok).toBe(false);
    expect(gate.tier).toBe(false);
    expect(gate.why.length).toBeGreaterThan(5);
    expect(R.openBranch(g, 'cho')).toBeNull();
    expect(g.branch).toBeNull();
  });

  it('mở chi nhánh trừ đúng một ngày thuê và ghi sổ riêng rỗng', () => {
    const g = chainAt();
    const before = g.cash;
    const site = BRANCH_SITES.find((s) => s.spot === 'cho')!;
    const b = R.openBranch(g, 'cho')!;
    expect(b).toBeTruthy();
    expect(g.cash).toBe(before - site.rent);
    expect(b.spot).toBe('cho');
    expect(b.rent).toBe(site.rent);
    expect(b.keeper).toBeNull();
    expect(b.ready).toEqual([]);
    expect(b.led.revenue).toBe(0);
    expect(b.open).toBe(true);
    expect(g.led.fees).toBe(site.rent);
  });

  it('không đủ tiền thuê thì không mở, không mất gì', () => {
    const g = chainAt();
    g.cash = 1000;
    expect(R.openBranch(g, 'cho')).toBeNull();
    expect(g.branch).toBeNull();
    expect(g.cash).toBe(1000);
  });

  it('không cho mở chi nhánh ngay chỗ quán chính, không mở hai chi nhánh, chỗ lạ thì từ chối', () => {
    const g = chainAt();
    expect(R.branchGate(g, 'matbang_tb', true).ok).toBe(false);
    expect(R.openBranch(g, 'matbang_tb', true)).toBeNull();
    expect(R.branchGate(g, 'khong_co').ok).toBe(false);
    expect(R.openBranch(g, 'cho')).toBeTruthy();
    expect(R.branchGate(g, 'vp').ok).toBe(false);
    expect(R.openBranch(g, 'vp')).toBeNull();
  });

  it('đóng chi nhánh: trả mặt bằng, mất món sẵn còn trên khay, không hoàn tiền thuê', () => {
    const g = branchReady(chainAt(), 5);
    const cash = g.cash;
    expect(R.closeBranch(g)).toBe(true);
    expect(g.branch).toBeNull();
    expect(g.cash).toBe(cash);
  });
});

describe('người trông coi & chuyển món', () => {
  it('thuê người trông coi trả trước một ngày lương; cho nghỉ thì chi nhánh hết người', () => {
    const g = chainAt();
    R.openBranch(g, 'cho');
    const k = KEEPER_POOL[0];
    const before = g.cash;
    expect(R.hireKeeper(g, k)).toBe(true);
    expect(g.cash).toBe(before - k.wage);
    expect(g.branch!.keeper!.name).toBe(k.name);
    expect(g.branch!.keeper!.paid).toBe(g.day);
    expect(R.hireKeeper(g, k)).toBe(false); // đã có người
    const old = R.fireKeeper(g);
    expect(old!.name).toBe(k.name);
    expect(g.branch!.keeper).toBeNull();
  });

  it('chưa mở chi nhánh thì không thuê được ai', () => {
    const g = chainAt();
    expect(R.hireKeeper(g, KEEPER_POOL[0])).toBe(false);
    expect(R.fireKeeper(g)).toBeNull();
  });

  it('chuyển món sẵn sang chi nhánh: đúng số phần, giữ giá vốn và chất lượng, quầy chính trừ đi', () => {
    const g = chainAt();
    R.openBranch(g, 'cho');
    g.stall.ready.push({ rid: 'tra_da', n: 6, q: 0.8, at: 0, cost: 700 });
    expect(R.moveToBranch(g, 'tra_da', 4)).toBe(4);
    expect(R.branchStock(g)).toBe(4);
    expect(g.stall.ready[0].n).toBe(2);
    const b = g.branch!.ready[0];
    expect(b.rid).toBe('tra_da');
    expect(b.cost).toBe(700);
    expect(b.q).toBeCloseTo(0.8, 5);
  });

  it('khay chi nhánh có trần số phần và trần số món; món khác loại không chen được khi đã đủ 6 món', () => {
    const g = chainAt();
    R.openBranch(g, 'cho');
    expect(R.BRANCH_TRAY_CAP).toBe(6);
    expect(R.BRANCH_READY_CAP).toBeGreaterThan(6);
    g.stall.ready.push({ rid: 'tra_da', n: 40, q: 0.9, at: 0, cost: 700 });
    expect(R.moveToBranch(g, 'tra_da', 40)).toBe(R.BRANCH_READY_CAP);
    expect(R.branchStock(g)).toBe(R.BRANCH_READY_CAP);
    // khay đầy: không chuyển thêm được
    g.stall.ready.push({ rid: 'banhmi', n: 5, q: 0.9, at: 0, cost: 3000 });
    expect(R.moveToBranch(g, 'banhmi', 5)).toBe(0);
  });

  it('mang món từ chi nhánh về quầy chính khi bán không hết', () => {
    const g = branchReady(chainAt(), 8);
    expect(R.branchStock(g)).toBe(8);
    expect(R.moveFromBranch(g, 'com_suon', 3)).toBe(3);
    expect(R.branchStock(g)).toBe(5);
    expect(R.readyCount(g, 'com_suon')).toBe(3);
  });

  it('chưa mở chi nhánh thì mọi thao tác chuyển món trả 0, không lỗi', () => {
    const g = chainAt();
    expect(R.moveToBranch(g, 'com_suon', 5)).toBe(0);
    expect(R.moveFromBranch(g, 'com_suon', 5)).toBe(0);
    expect(R.branchStock(g)).toBe(0);
    expect(R.branchSelling(g)).toBe(false);
  });
});

describe('bán hàng ở chi nhánh', () => {
  it('có người trông coi + còn món thì bán được, doanh thu vào sổ chính lẫn sổ chi nhánh', () => {
    const g = branchReady(chainAt(10 * 60), 20);
    const R0 = new RNG(7);
    let sold = 0;
    for (let i = 0; i < 120; i++) { g.min += 1; sold += R.branchTick(g, 1, R0).sold; }
    expect(sold).toBeGreaterThan(0);
    expect(g.branch!.led.sold).toBe(sold);
    expect(g.branch!.led.revenue).toBeGreaterThan(0);
    expect(g.led.revenue).toBeGreaterThanOrEqual(g.branch!.led.revenue);
    expect(g.branch!.tot.sold).toBe(sold);
    expect(R.branchStock(g)).toBeLessThan(20);
  });

  it('không có người trông coi, hoặc khay trống, hoặc đóng cửa thì không bán', () => {
    const g = chainAt(10 * 60);
    R.openBranch(g, 'cho');
    const R0 = new RNG(3);
    expect(R.branchTick(g, 60, R0).sold).toBe(0);          // chưa thuê ai
    R.hireKeeper(g, KEEPER_POOL[1]);
    expect(R.branchTick(g, 60, R0).sold).toBe(0);          // khay trống
    g.branch!.ready.push({ rid: 'com_suon', n: 5, q: 0.9, at: 0, cost: 12000 });
    g.rec.com_suon.known = true; g.rec.com_suon.price = 35000;
    g.branch!.open = false;
    expect(R.branchTick(g, 60, R0).sold).toBe(0);          // đang đóng
  });

  it('ngoài giờ bán (2h sáng) chi nhánh không bán', () => {
    const g = branchReady(chainAt(2 * 60), 20);
    const R0 = new RNG(11);
    let sold = 0;
    for (let i = 0; i < 60; i++) sold += R.branchTick(g, 1, R0).sold;
    expect(sold).toBe(0);
  });

  it('giá bán lấy đúng giá người chơi đặt, không tự tăng; bán nhiều phút thì nhiều khách hơn', () => {
    const g = branchReady(chainAt(11 * 60 + 30), 24);
    g.rec.com_suon.price = 40000;
    const R0 = new RNG(21);
    const one = R.branchTick(g, 1, R0);
    const many = R.branchTick(g, 60, R0);
    expect(one.revenue % 40000 === 0 || one.revenue === 0).toBe(true);
    expect(many.revenue).toBeGreaterThan(0);
    expect(many.revenue % 40000).toBe(0);
  });
});

describe('đầu ngày: thuê chỗ, lương, món ế', () => {
  it('khoá sổ: ghi lịch sử, bỏ món ế, trừ tiền thuê và lương, mở lại chi nhánh', () => {
    const g = branchReady(chainAt(20 * 60), 10);
    const R0 = new RNG(5);
    for (let i = 0; i < 90; i++) { g.min += 1; R.branchTick(g, 1, R0); }
    const rev = g.branch!.led.revenue, tips = g.branch!.led.tips;
    const rent = g.branch!.rent, wage = g.branch!.keeper!.wage;
    const cash = g.cash, ledFeesBefore = g.led.fees;
    g.branch!.ready.push({ rid: 'com_suon', n: 4, q: 0.9, at: 0, cost: 12000 });
    g.min = 23 * 60 + 50;
    R.advance(g, 20, IDLE, new RNG(9));
    expect(g.day).toBe(1);
    const b = g.branch!;
    expect(b.hist.length).toBeGreaterThan(0);
    const last = b.hist[b.hist.length - 1];
    expect(last.revenue).toBe(rev);
    expect(last.tips).toBe(tips);
    expect(b.ready).toEqual([]);                     // món ế bỏ hết qua đêm
    expect(b.tot.days).toBe(1);
    expect(b.tot.revenue).toBeGreaterThanOrEqual(rev);
    expect(b.led.revenue).toBe(0);                   // sổ ngày mới mở lại từ đầu
    expect(b.led.fees).toBe(0);                       // sổ hôm nay của chi nhánh đã mở lại từ đầu
    expect(b.open).toBe(true);
    // Sổ của ngày vừa khoá (đã vào lịch sử) ghi đúng 2 khoản của chi nhánh: tiền thuê + một ngày lương.
    const archived = g.hist[g.hist.length - 1];
    expect(archived.fees).toBe(ledFeesBefore + rent + wage);
    void cash;
  });

  it('thiếu tiền thuê thì chi nhánh đóng cửa hôm đó; thiếu lương thì người trông coi nghỉ', () => {
    const g = branchReady(chainAt(23 * 60 + 40), 2);
    g.cash = 0;
    g.min = 23 * 60 + 50;
    R.advance(g, 20, IDLE, new RNG(4));
    expect(g.branch!.keeper).toBeNull();
    expect(g.branch!.open).toBe(false);
    expect(g.cash).toBeGreaterThanOrEqual(0);
  });
});

describe('bản lưu v13 -> v14', () => {
  it('bản lưu cũ không có branch thì được thêm branch = null', () => {
    const g = newGame(9);
    const raw: any = JSON.parse(JSON.stringify(g));
    raw.v = 13;
    delete raw.branch;
    const m = migrate(raw)!;
    expect(m.v).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(14);
    expect(m.branch).toBeNull();
  });

  it('chi nhánh hỏng bị bỏ, chi nhánh hợp lệ thì giữ nguyên sổ sách', () => {
    expect(cleanBranch(null)).toBeNull();
    expect(cleanBranch({ spot: 5 })).toBeNull();
    expect(cleanBranch({ spot: 'cho', rent: 'x', keeper: { name: 3 } })).not.toBeNull();
    const g = branchReady(chainAt(), 6);
    const raw: any = JSON.parse(JSON.stringify(g));
    const m = migrate(raw)!;
    expect(m.branch).toBeTruthy();
    expect(m.branch!.spot).toBe('cho');
    expect(m.branch!.keeper!.name).toBe(KEEPER_POOL[0].name);
    expect(m.branch!.ready[0].n).toBe(6);
    expect(m.branch!.rent).toBe(g.branch!.rent);
  });

  it('chi nhánh đọc lên luôn kẹp số về giá trị hợp lệ', () => {
    const b = cleanBranch({ spot: 'vp', rent: -5, ready: [{ rid: 'tra_da', n: -3 }, { rid: 'tra_da', n: 4, q: 9 }], led: { revenue: NaN }, hist: [{ day: 1, revenue: 1000 }] })!;
    expect(b.rent).toBe(0);
    expect(b.ready.length).toBe(1);
    expect(b.ready[0].q).toBe(1);
    expect(b.led.revenue).toBe(0);
    expect(b.hist.length).toBe(1);
  });
});

describe('bất biến', () => {
  it('mở chi nhánh + bán 3 ngày liên tục: tiền không âm, không NaN, món không âm', () => {
    const g = branchReady(chainAt(8 * 60), 20);
    const R0 = new RNG(13);
    for (let d = 0; d < 3; d++) {
      for (let i = 0; i < 24 * 60; i += 5) {
        g.min += 5;
        R.advance(g, 5, IDLE, R0);
        if (!g.branch) break;
        if (g.branch.ready.every((r) => r.n <= 0) && g.stall.ready.length) {
          g.stall.ready.push({ rid: 'com_suon', n: 10, q: 0.9, at: g.day * 1440 + g.min, cost: 12000 });
          R.moveToBranch(g, 'com_suon', 10);
        }
      }
      if (!g.branch) break;
      g.cash = Math.max(g.cash, 400000);   // đủ tiền thuê + lương cho ngày kế
    }
    expect(Number.isFinite(g.cash)).toBe(true);
    expect(g.cash).toBeGreaterThanOrEqual(0);
    if (g.branch) for (const r of g.branch.ready) expect(r.n).toBeGreaterThan(0);
    expect(INGS.heo.kg).toBeGreaterThanOrEqual(0);
    expect(RECIPES.com_suon.name.length).toBeGreaterThan(0);
    expect(SPOTS.length).toBeGreaterThan(0);
  });
});
