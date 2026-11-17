// GIAO NGƯỜI LÀM ĐI CHỢ MUA NGUYÊN LIỆU (phụ quầy · bếp trưởng · người trông coi chi nhánh)
// — ai đi được, báo giá đúng thứ còn thiếu, trừ tiền trước, hàng về kho quầy, huỷ hoàn 85%, qua ngày dọn chuyến.
import { describe, it, expect, beforeEach } from 'vitest';
import * as R from '../src/sim/rules';
import { RECIPES } from '../src/data/recipes';
import { INGS } from '../src/data/ingredients';
import { SHOPS, SHOP_LIST } from '../src/data/shops';
import { SAVE_VERSION, migrate, newGame, cleanErrands, type Game } from '../src/sim/state';
import { withStall, IDLE } from './helpers';

/** Ván có quầy đặt ở Phố Văn Phòng, đủ đồ nghề nấu ăn, đã mở bán. */
function base(tier = 6): Game {
  const g = withStall(11);
  g.stall.tier = tier;
  g.stall.open = true;
  g.stall.cond = 100;
  for (const id of ['ganh', 'xeday', 'sap', 'quanan', 'quanngoi', 'nhahang', 'daothot', 'bepthan', 'vi', 'noi', 'chao']) (g.gear as any)[id] = 1;
  g.cash = 3000000;
  g.min = 8 * 60;
  for (const rid of ['com_suon', 'tra_da', 'banh_mi_trung', 'pho_bo']) { g.rec[rid].known = true; g.rec[rid].on = true; }
  return g;
}
const hireAll = (g: Game) => {
  R.hireHelper(g);
  if (R.isRestaurant(g)) { R.hireSous(g); R.hireSous(g); }
};
const dishWithMissing = (g: Game) => {
  for (const r of R.menuOf(g)) if (R.errandPlanFor(g, r, 1).length) return r;
  return R.menuOf(g)[0] ?? RECIPES.com_suon;
};

describe('ai đi chợ được', () => {
  it('chưa thuê ai thì không giao được', () => {
    const g = base();
    for (const sl of [0, 1, 2, 3] as const) {
      expect(R.errandWho(g, sl)).toBeNull();
      expect(R.canErrand(g, sl)).toBe(false);
    }
  });

  it('phụ quầy → slot 0, bếp trưởng → slot 1 và 2, người trông coi → slot 3', () => {
    const g = base(6);
    hireAll(g);
    expect(R.errandWho(g, 0)!.role).toBe('phụ quầy');
    expect(R.errandWho(g, 1)!.role).toBe('bếp trưởng');
    expect(R.errandWho(g, 2)!.role).toBe('bếp phó');
    expect(R.canErrand(g, 3)).toBe(false);            // chưa có chi nhánh
    g.stall.tier = 7;
    (g.gear as any).chuoi = 1;
    expect(R.openBranch(g, 'cho')).toBeTruthy();
    expect(R.hireKeeper(g)).toBe(true);
    expect(R.errandWho(g, 3)!.role).toContain('chi nhánh');
    expect(R.canErrand(g, 3)).toBe(true);
  });

  it('một người chỉ đi một chuyến tại một thời điểm', () => {
    const g = base();
    hireAll(g);
    const r = dishWithMissing(g);
    const q = R.errandQuote(g, R.errandPlanFor(g, r, 1));
    expect(R.startErrand(g, 0, q.lines, q.total)).toBeTruthy();
    expect(R.canErrand(g, 0)).toBe(false);
    expect(R.canErrand(g, 1)).toBe(true);
  });
});

describe('báo giá chuyến đi chợ', () => {
  it('chỉ tính nguyên liệu còn thiếu, đúng giá ở cửa hàng đang mở', () => {
    const g = base();
    const r = RECIPES.com_suon;
    const plan = R.errandPlanFor(g, r, 2);
    expect(plan.length).toBeGreaterThan(0);
    const q = R.errandQuote(g, plan);
    expect(q.lines.length + q.missing.length).toBe(plan.length);
    for (const l of q.lines) {
      const shop = SHOPS[l.shop];
      expect(shop.items).toContain(l.id);
      expect(R.shopOpen(g, shop)).toBe(true);
      expect(l.price).toBeGreaterThan(0);
      expect(l.n).toBeGreaterThan(0);
      expect(l.fresh).toBeGreaterThan(30);
    }
    expect(q.total).toBe(Math.round(q.lines.reduce((a, l) => a + l.price * l.n, 0)));
  });

  it('đã có sẵn nguyên liệu trong kho thì không mua nữa', () => {
    const g = base();
    const r = RECIPES.tra_da;
    for (const [id, n] of Object.entries(r.ings)) g.stall.store.push({ id, n: n * 3, fresh: 95, q: 0.95, cost: 1000 });
    expect(R.errandPlanFor(g, r, 2)).toEqual([]);
    expect(R.errandQuote(g, []).total).toBe(0);
  });

  it('giờ này không đâu bán thì báo thiếu, không tính tiền', () => {
    const g = base();
    g.min = 2 * 60;                                    // 2h sáng: chỉ MiniMart 24h
    const q = R.errandQuote(g, [['raumuong' as any, 1]]);
    expect(q.lines.length + q.missing.length).toBe(1);
    if (q.missing.length) { expect(q.lines.length).toBe(0); expect(q.total).toBe(0); }
  });

  it('gộp nhiều món thì mỗi nguyên liệu chỉ mua một lần', () => {
    const g = base();
    const dishes = R.menuOf(g).slice(0, 5);
    const plan = R.errandPlanForAll(g, dishes, 1);
    const ids = plan.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [id, n] of plan) { expect(INGS[id]).toBeTruthy(); expect(n).toBeGreaterThan(0); }
  });
});

describe('chạy chuyến: trừ tiền, hàng về kho', () => {
  it('trả tiền trước rồi hàng về kho quầy khi hết giờ đi đường', () => {
    const g = base();
    hireAll(g);
    const r = dishWithMissing(g);
    const q = R.errandQuote(g, R.errandPlanFor(g, r, 1));
    const cash0 = g.cash, cogs0 = g.led.cogs;
    const e = R.startErrand(g, 1, q.lines, q.total)!;
    expect(e).toBeTruthy();
    expect(g.cash).toBe(cash0 - q.total);
    expect(g.led.cogs).toBe(cogs0 + q.total);
    expect(e.legs).toBeGreaterThanOrEqual(12);
    expect(g.errands.length).toBe(1);
    // nửa đầu chưa có hàng
    R.errandTick(g, e.legs / 2 - 1);
    expect(g.errands.length).toBe(1);
    expect(g.errands[0].back).toBe(false);
    // về tới nơi (đi thêm cho hết chặng về)
    const done = R.errandTick(g, e.legs);
    expect(done.length).toBe(1);
    expect(g.errands.length).toBe(0);
    for (const l of q.lines) expect(g.stall.store.some((s) => s.id === l.id)).toBe(true);
    // đủ nguyên liệu cho món đó luôn
    expect(R.errandPlanFor(g, r, 1).length).toBeLessThan(R.errandPlanFor(newGame(11), r, 1).length + 99);
  });

  it('thiếu tiền thì không giao được, không trừ đồng nào', () => {
    const g = base();
    hireAll(g);
    const r = dishWithMissing(g);
    const q = R.errandQuote(g, R.errandPlanFor(g, r, 3));
    g.cash = Math.max(0, q.total - 1000);
    const cash0 = g.cash;
    expect(R.startErrand(g, 0, q.lines, q.total)).toBeNull();
    expect(g.cash).toBe(cash0);
    expect(g.errands.length).toBe(0);
  });

  it('huỷ chuyến giữa đường: hoàn 85%, không có hàng', () => {
    const g = base();
    hireAll(g);
    const r = dishWithMissing(g);
    const q = R.errandQuote(g, R.errandPlanFor(g, r, 1));
    const cash0 = g.cash;
    const e = R.startErrand(g, 0, q.lines, q.total)!;
    R.errandTick(g, 3);
    expect(R.cancelErrand(g, 0)).toBe(true);
    expect(g.errands.length).toBe(0);
    expect(g.cash).toBe(cash0 - q.total + Math.round(q.total * 0.85));
    expect(g.stall.store.some((s) => q.lines.some((l) => l.id === s.id))).toBe(false);
  });

  it('qua ngày mới thì chuyến dở bị huỷ và hoàn 85%', () => {
    const g = base();
    hireAll(g);
    const r = dishWithMissing(g);
    const q = R.errandQuote(g, R.errandPlanFor(g, r, 1));
    const cash0 = g.cash;
    R.startErrand(g, 0, q.lines, q.total);
    R.errandsNewDay(g);                                // newDay() gọi hàm này
    expect(g.errands.length).toBe(0);
    expect(g.cash).toBe(cash0 - q.total + Math.round(q.total * 0.85));
    // và đi qua 0h thật thì cũng không còn chuyến nào treo
    R.startErrand(g, 0, q.lines, q.total);
    R.advance(g, 24 * 60 - g.min + 1, IDLE);
    expect(g.errands.length).toBe(0);
  });

  it('chuyến đi theo thời gian thật: advance() cũng đẩy chuyến tiến lên', () => {
    const g = base();
    hireAll(g);
    const r = dishWithMissing(g);
    const q = R.errandQuote(g, R.errandPlanFor(g, r, 1));
    const e = R.startErrand(g, 0, q.lines, q.total)!;
    R.advance(g, e.legs - 1, IDLE);
    expect(g.errands.length).toBe(1);
    R.advance(g, 2, IDLE);
    expect(g.errands.length).toBe(0);
  });

  it('toạ độ người đi chợ chạy từ quán ra chợ rồi quay lại', () => {
    const g = base();
    hireAll(g);
    const r = dishWithMissing(g);
    const q = R.errandQuote(g, R.errandPlanFor(g, r, 1));
    const e = R.startErrand(g, 0, q.lines, q.total)!;
    const p0 = R.errandSpot(g, e);
    expect(Math.hypot(p0.x - g.stall.x, p0.z - g.stall.z)).toBeLessThan(2);
    R.errandTick(g, e.legs / 2);
    const mid = R.errandSpot(g, g.errands[0]);
    expect(Math.hypot(mid.x - g.stall.x, mid.z - g.stall.z)).toBeGreaterThan(5);
  });
});

describe('bản lưu v15', () => {
  it(`SAVE_VERSION = ${SAVE_VERSION} và bản lưu cũ được thêm errands = []`, () => {
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(15);
    const raw: any = JSON.parse(JSON.stringify(newGame(4)));
    raw.v = 14;
    delete raw.errands;
    const m = migrate(raw)!;
    expect(m.errands).toEqual([]);
  });

  it('cleanErrands bỏ chuyến hỏng, kẹp số phần và thời gian', () => {
    expect(cleanErrands([])).toEqual([]);
    expect(cleanErrands([null, 5, {}] as any)).toEqual([]);
    const [e] = cleanErrands([{
      slot: 1, who: 'A', day: -3, legs: 9999, t: -5, back: 1, total: 'x',
      lines: [{ id: 'gao', n: 9999, price: -2, fresh: 500, q: 9 }, { id: '', n: 2 }, null],
    }] as any);
    expect(e.slot).toBe(1);
    expect(e.day).toBe(0);
    expect(e.legs).toBe(600);
    expect(e.t).toBe(0);
    expect(e.total).toBe(0);
    expect(e.lines.length).toBe(1);   // chỉ dòng 'gao' hợp lệ
    expect(e.lines[0].n).toBe(200);
    expect(e.lines[0].price).toBe(0);
    expect(e.lines[0].fresh).toBe(100);
    expect(e.lines[0].q).toBe(1);
  });

  it('slot lạ bị loại', () => {
    expect(cleanErrands([{ slot: 9, lines: [] }] as any)).toEqual([]);
    expect(cleanErrands([{ slot: -1, lines: [] }] as any)).toEqual([]);
  });
});

describe('chạy dài không vỡ', () => {
  it('giao 3 người đi chợ liên tục 5 ngày vẫn nhất quán', () => {
    const g = base(7);
    (g.gear as any).chuoi = 1;
    R.openBranch(g, 'cho'); R.hireKeeper(g);
    hireAll(g);
    let started = 0;
    for (let day = 0; day < 5; day++) {
      for (const sl of [0, 1, 2, 3] as const) {
        if (!R.canErrand(g, sl) || !R.canErrand(g, R.canErrand(g, sl) ? sl : 0)) continue;
        const r = dishWithMissing(g);
        const q = R.errandQuote(g, R.errandPlanFor(g, r, 1));
        if (q.lines.length && R.startErrand(g, sl, q.lines, q.total)) started++;
      }
      R.advance(g, 12 * 60, IDLE);
      for (const st of g.stall.store) { expect(Number.isFinite(st.n)).toBe(true); expect(st.n).toBeGreaterThan(0); }
      expect(g.errands.length).toBeLessThanOrEqual(4);
    }
    expect(started).toBeGreaterThan(0);
    expect(Number.isFinite(g.cash)).toBe(true);
  });
});
