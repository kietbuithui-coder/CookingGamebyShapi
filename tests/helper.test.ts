// Người phụ việc ở quầy: chỉ nhận khi quán đã có doanh thu và đã bán được vài ngày (yêu cầu của người chơi),
// rồi thì ăn lương theo ngày, dỗ khách chờ lâu hơn.
import { describe, it, expect } from 'vitest';
import { helperGate, hireHelper, fireHelper, helperPatience, helperCandidate, stallRevenue, HELPER_MIN_REVENUE, HELPER_MIN_DAYS, advance } from '../src/sim/rules';
import { SAVE_VERSION, migrate, newGame } from '../src/sim/state';
import { HELPER_POOL } from '../src/data/people';
import { fresh, IDLE } from './helpers';
import type { Game } from '../src/sim/state';

/** Quán đã bán được `revenue` và bắt đầu bán cách đây `days` ngày. */
function stallWith(revenue: number, days: number, tier = 2, cash = 300000): Game {
  const g = fresh();
  g.stall = { ...g.stall, tier, where: 'placed', spot: 'cv', x: 0, z: 0, yaw: 0, open: true };
  g.led.revenue = revenue;
  g.flags.firstSale = g.day - days;
  g.cash = cash;
  return g;
}

describe('người phụ việc — điều kiện xuất hiện', () => {
  it('ván mới thì chưa có ai, vì chưa có doanh thu', () => {
    const g = fresh();
    const gate = helperGate(g);
    expect(gate.ok).toBe(false);
    expect(gate.revenue).toBe(0);
    expect(stallRevenue(g)).toBe(0);
  });
  it('có doanh thu nhưng chưa bán đủ lâu thì chưa nhận', () => {
    const g = stallWith(HELPER_MIN_REVENUE + 50000, HELPER_MIN_DAYS - 1);
    const gate = helperGate(g);
    expect(gate.ok).toBe(false);
    expect(gate.why).toMatch(/ngày/);
  });
  it('bán đủ lâu nhưng doanh thu còn ít thì chưa nhận', () => {
    const g = stallWith(HELPER_MIN_REVENUE - 1000, HELPER_MIN_DAYS + 3);
    expect(helperGate(g).ok).toBe(false);
    expect(helperGate(g).why).toMatch(/Doanh thu/);
  });
  it('gánh hàng rong thì chưa thuê được người', () => {
    const g = stallWith(HELPER_MIN_REVENUE * 3, HELPER_MIN_DAYS + 1, 1);
    expect(helperGate(g).ok).toBe(false);
    expect(helperGate(g).tier).toBe(false);
  });
  it('đủ doanh thu + đủ ngày + quầy từ xe đẩy trở lên thì nhận', () => {
    const g = stallWith(HELPER_MIN_REVENUE, HELPER_MIN_DAYS);
    expect(helperGate(g).ok).toBe(true);
    expect(helperGate(g).why).toBe('');
  });
  it('doanh thu cộng dồn cả sổ hôm nay lẫn các ngày trước', () => {
    const g = stallWith(100000, 4);
    g.hist.push({ ...g.led, day: 1, revenue: 200000 });
    expect(stallRevenue(g)).toBe(300000);
    expect(helperGate(g).ok).toBe(true);
  });
  it('đã có người phụ thì không nhận thêm', () => {
    const g = stallWith(HELPER_MIN_REVENUE, HELPER_MIN_DAYS);
    expect(hireHelper(g)).toBe(true);
    expect(helperGate(g).ok).toBe(false);
    expect(helperGate(g).why).toMatch(/Đã có/);
  });
});

describe('người phụ việc — hợp đồng và lương', () => {
  it('ứng viên chọn theo seed + ngày nên tất định', () => {
    const g = fresh(777);
    const a = helperCandidate(g);
    expect(HELPER_POOL).toContain(a);
    expect(helperCandidate(g)).toBe(a);
    g.day += 1;
    expect(HELPER_POOL).toContain(helperCandidate(g));
  });
  it('nhận người thì trừ trước một ngày lương và ghi sổ', () => {
    const g = stallWith(HELPER_MIN_REVENUE, HELPER_MIN_DAYS, 2, 300000);
    const c = helperCandidate(g);
    expect(hireHelper(g, c)).toBe(true);
    expect(g.help?.name).toBe(c.name);
    expect(g.cash).toBe(300000 - c.wage);
    expect(g.help?.paid).toBe(g.day);
    expect(helperPatience(g)).toBeGreaterThan(1);
  });
  it('không đủ tiền thì không nhận được ai', () => {
    const g = stallWith(HELPER_MIN_REVENUE, HELPER_MIN_DAYS, 2, 1000);
    const c = helperCandidate(g);
    expect(hireHelper(g, c)).toBe(false);
    expect(g.help).toBeNull();
    expect(g.cash).toBe(1000);
  });
  it('sáng hôm sau tự trả lương; hết tiền thì người phụ xin nghỉ', () => {
    const g = stallWith(HELPER_MIN_REVENUE, HELPER_MIN_DAYS, 2, 300000);
    const c = helperCandidate(g);
    hireHelper(g, c);
    g.cash = 0;
    advance(g, 1440 - g.min + 30, IDLE);
    expect(g.help).toBeNull();
  });
  it('còn tiền thì qua ngày mới vẫn giữ người và trừ lương', () => {
    const g = stallWith(HELPER_MIN_REVENUE, HELPER_MIN_DAYS, 2, 300000);
    const c = helperCandidate(g);
    hireHelper(g, c);
    const before = g.cash;
    advance(g, 1440 - g.min + 30, IDLE);
    expect(g.help?.name).toBe(c.name);
    expect(g.cash).toBeLessThan(before);
    expect(g.help?.paid).toBe(g.day);
  });
  it('cho nghỉ thì quầy lại một mình', () => {
    const g = stallWith(HELPER_MIN_REVENUE, HELPER_MIN_DAYS);
    hireHelper(g);
    expect(fireHelper(g)?.name).toBeTruthy();
    expect(g.help).toBeNull();
    expect(helperPatience(g)).toBe(1);
  });
});

describe('bản lưu v10', () => {
  it('bản lưu v9 chưa có người phụ thì mở lên là không có ai', () => {
    const raw: any = JSON.parse(JSON.stringify(newGame(5, 'anh')));
    raw.v = 9; delete raw.help;
    const g = migrate(raw)!;
    expect(g.v).toBe(SAVE_VERSION);
    expect(g.help).toBeNull();
  });
  it('dữ liệu người phụ hỏng thì bỏ, không làm vỡ ván', () => {
    const raw: any = JSON.parse(JSON.stringify(newGame(5, 'anh')));
    raw.v = 9; raw.help = { name: 123 };
    expect(migrate(raw)!.help).toBeNull();
  });
  it('người phụ đang làm thì giữ nguyên qua lần lưu/mở', () => {
    const g = stallWith(HELPER_MIN_REVENUE, HELPER_MIN_DAYS);
    hireHelper(g);
    const back = migrate(JSON.parse(JSON.stringify(g)))!;
    expect(back.help?.name).toBe(g.help?.name);
    expect(back.help?.wage).toBe(g.help?.wage);
    expect(back.help?.hired).toBe(true);
  });
});
