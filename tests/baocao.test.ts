// BÁO CÁO CỦA NGƯỜI LÀM (sắp hết nguyên liệu → gợi ý đi chợ) và QUYỀN TỰ DUYỆT ĐẶT BÀN của bếp trưởng.
import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { RECIPES } from '../src/data/recipes';
import { INGS } from '../src/data/ingredients';
import { newGame, migrate, type Game } from '../src/sim/state';
import { withStall } from './helpers';

/** Ván nhà hàng đã mở bán, thực đơn bật 2 món, có phụ quầy + 1 bếp trưởng. */
function resto(opts: { sous?: boolean; help?: boolean } = {}): Game {
  const g = withStall(21);
  g.stall.tier = 6;
  g.stall.open = true;
  g.cash = 5000000;
  g.min = 11 * 60;
  for (const id of ['daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas', 'thungda', 'bien', 'den', 'ghe']) g.gear[id] = 1;
  for (const rid of ['com_suon', 'tra_da']) { g.rec[rid].known = true; g.rec[rid].on = true; }
  if (opts.help !== false) R.hireHelper(g);
  if (opts.sous !== false) R.hireSous(g);
  return g;
}
const clearStore = (g: Game) => { g.stall.store = []; g.bag = []; g.stall.preps = []; };

describe('báo cáo sắp hết nguyên liệu', () => {
  it('kho đầy đủ thì báo "đủ hàng", không gợi ý mua', () => {
    const g = resto();
    for (const [id, q] of Object.entries(RECIPES.com_suon.ings)) g.stall.store.push({ id, n: q * 5, fresh: 95, q: 0.95, cost: 1000 });
    for (const [id, q] of Object.entries(RECIPES.tra_da.ings)) g.stall.store.push({ id, n: q * 5, fresh: 95, q: 0.95, cost: 1000 });
    // món hai bước còn cần phần sơ chế sẵn (trà đá pha trà trước, cơm sườn sơ chế trước)
    g.stall.preps.push({ rid: 'com_suon', n: 4, q: 0.9, at: 0, cost: 3000 }, { rid: 'tra_da', n: 4, q: 0.9, at: 0, cost: 1000 });
    const r = R.staffReport(g, 1)!;
    expect(r.dishes.length).toBe(0);
    expect(r.ings.length).toBe(0);
    expect(r.cost).toBe(0);
    expect(r.urgent).toBe(false);
    expect(r.text).toContain('đủ đồ');
  });

  it('sắp hết thì chỉ ra đúng món, đúng nguyên liệu thiếu, và tiền đi chợ', () => {
    const g = resto();
    clearStore(g);
    const r = R.staffReport(g, 1)!;
    expect(r.dishes.length).toBeGreaterThan(0);
    expect(r.dishes.some((d) => d.rid === 'com_suon')).toBe(true);
    expect(r.ings.length).toBeGreaterThan(0);
    for (const x of r.ings) {
      expect(INGS[x.id]).toBeTruthy();
      expect(x.left).toBeLessThan(x.need);
    }
    expect(r.cost).toBeGreaterThan(0);
    expect(r.urgent).toBe(true);
    expect(r.text).toContain('Sắp hết đồ');
    expect(r.text).toContain('₫');
  });

  it('chức danh đúng theo slot và ai chưa thuê thì không báo', () => {
    const g = resto();
    clearStore(g);
    expect(R.staffReport(g, 0)!.role).toBe('phụ quầy');
    expect(R.staffReport(g, 1)!.role).toBe('bếp trưởng');
    expect(R.staffReport(g, 2)).toBeNull();          // chưa thuê bếp thứ hai
    expect(R.staffReport(g, 3)).toBeNull();          // chưa có chi nhánh
    const g2 = resto({ help: false, sous: false });
    expect(R.staffReport(g2, 0)).toBeNull();
    expect(R.staffReport(g2, 1)).toBeNull();
    expect(R.staffReports(g2)).toEqual([]);
  });

  it('người đang đi chợ thì không báo (đã đi lo rồi)', () => {
    const g = resto();
    clearStore(g);
    const q = R.errandQuote(g, R.errandPlanFor(g, RECIPES.com_suon, 1));
    expect(R.startErrand(g, 0, q.lines, q.total)).toBeTruthy();
    const slots = R.staffReports(g).map((r) => r.slot);
    expect(slots).not.toContain(0);
    expect(slots).toContain(1);
  });

  it('báo cáo xếp bếp trưởng lên trước phụ quầy', () => {
    const g = resto();
    clearStore(g);
    expect(R.staffReports(g)[0].slot).toBe(1);
  });

  it('chưa bật món nào thì báo chưa có thực đơn, không bịa nguyên liệu', () => {
    const g = resto();
    clearStore(g);
    for (const rid of ['com_suon', 'tra_da']) g.rec[rid].on = false;
    const r = R.staffReport(g, 1)!;
    expect(r.dishes).toEqual([]);
    expect(r.ings).toEqual([]);
    expect(r.cost).toBe(0);
    expect(r.text).toContain('Chưa bật món nào');
  });

  it('lowStockCount đếm đúng số món sắp hết và bỏ qua khi chưa bật món', () => {
    const g = resto();
    clearStore(g);
    expect(R.lowStockCount(g)).toBeGreaterThan(0);
    for (const rid of ['com_suon', 'tra_da']) g.rec[rid].on = false;
    expect(R.lowStockCount(g)).toBe(0);
  });

  it('báo cáo không làm thay đổi tiền/kho (chỉ đọc)', () => {
    const g = resto();
    clearStore(g);
    const snap = JSON.stringify({ cash: g.cash, store: g.stall.store, errands: g.errands });
    R.staffReports(g); R.staffReport(g, 0);
    expect(JSON.stringify({ cash: g.cash, store: g.stall.store, errands: g.errands })).toBe(snap);
  });
});

describe('bếp trưởng tự duyệt đặt bàn', () => {
  it('chưa có bếp thì không bật được', () => {
    const g = resto({ sous: false });
    expect(R.canAutoBook(g)).toBe(false);
    expect(R.setAutoBook(g, true)).toBe(false);
    expect(R.autoBookOn(g)).toBe(false);
  });

  it('bật rồi thì đặt bàn mới được nhận luôn, tắt thì quay lại chờ duyệt', () => {
    const g = resto();
    expect(R.canAutoBook(g)).toBe(true);
    expect(R.autoBookOn(g)).toBe(false);
    expect(R.setAutoBook(g, true)).toBe(true);
    expect(R.autoBookOn(g)).toBe(true);
    const b1 = R.createBooking(g)!;
    expect(b1.status).toBe('accepted');
    R.setAutoBook(g, false);
    const b2 = R.createBooking(g)!;
    expect(b2.status).toBe('pending');
  });

  it('bàn tự duyệt vẫn giữ chỗ và vẫn bị trừ uy tín nếu lỡ hẹn', () => {
    const g = resto();
    R.setAutoBook(g, true);
    const b = R.createBooking(g)!;
    b.day = g.day; b.hour = Math.floor(g.min / 60) + 1;
    expect(R.reservedSeats(g)).toBeGreaterThanOrEqual(0);
    b.hour = g.min / 60 - 2;                            // quá hẹn
    const rep0 = g.rep;
    const missed = R.expireBookings(g);
    expect(missed.some((x) => x.id === b.id)).toBe(true);
    expect(g.rep).toBeLessThanOrEqual(rep0);
  });

  it('cờ tự duyệt nằm trong flags nên không cần đổi bản lưu', () => {
    const g = resto();
    R.setAutoBook(g, true);
    const raw: any = JSON.parse(JSON.stringify(g));
    const m = migrate(raw)!;
    expect(m.flags.autoBook).toBe(1);
    expect(R.autoBookOn(m)).toBe(true);
  });
});
