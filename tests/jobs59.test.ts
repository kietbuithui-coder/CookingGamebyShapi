// Lượt 59: trần việc làm thêm mỗi ngày — ca bốc cá, ca chạy bàn, bao vác ở bến chợ — và bảng việc làm đọc đúng số thật.
import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { RNG } from '../src/core/util';
// @ts-expect-error — bài kiểm thử chạy trên Node; dự án không cài @types/node cho phần game
import { readFileSync } from 'node:fs';
import { fresh } from './helpers';
import { dockWage, DOCK_WAGE_MIN, DOCK_WAGE_MAX } from '../src/sim/rules';

describe('trần việc làm thêm mỗi ngày', () => {
  it('hằng số có lý: tăng số bao so với 12 cũ, trần ca nhỏ và trả công một ngày không quá cao', () => {
    expect(R.DOCK_SACKS_DAY).toBeGreaterThan(12);
    expect(R.DOCK_SACKS_DAY * R.DOCK_SACK_PAY).toBeGreaterThan(12 * 6000);
    expect(R.DOCK_SHIFTS_DAY).toBeGreaterThanOrEqual(1);
    expect(R.DOCK_SHIFTS_DAY).toBeLessThanOrEqual(3);
    expect(R.CAFE_SHIFTS_DAY).toBeGreaterThanOrEqual(1);
    expect(R.CAFE_SHIFTS_DAY).toBeLessThanOrEqual(4);
    // Cân bằng: trước đây 12 bao (72.000₫) thua xa một buổi bốc cá (2 ca sàn = 104.000₫) nên vác bao vô nghĩa.
    // Nay một ngày vác bao phải ≥ một ngày bốc cá ở mức sàn, mà vẫn cần sức khoẻ suốt buổi sáng nên không lạm phát.
    expect(R.DOCK_SACKS_DAY * R.DOCK_SACK_PAY).toBeGreaterThanOrEqual(R.DOCK_SHIFTS_DAY * DOCK_WAGE_MIN);
    expect(R.DOCK_SACKS_DAY * R.DOCK_SACK_PAY).toBeLessThan(R.DOCK_SHIFTS_DAY * DOCK_WAGE_MAX + 30000);
  });
  it('đếm số còn lại: mới chơi thì đủ, làm hết thì về 0 và không âm', () => {
    const g = fresh();
    expect(R.sacksLeft(g)).toBe(R.DOCK_SACKS_DAY);
    expect(R.dockShiftsLeft(g)).toBe(R.DOCK_SHIFTS_DAY);
    expect(R.cafeShiftsLeft(g)).toBe(R.CAFE_SHIFTS_DAY);
    g.wd.sacks = 5;
    expect(R.sacksLeft(g)).toBe(R.DOCK_SACKS_DAY - 5);
    g.wd.cargoShifts = R.DOCK_SHIFTS_DAY;
    expect(R.dockShiftsLeft(g)).toBe(0);
    g.wd.cafeShifts = R.CAFE_SHIFTS_DAY + 3;
    expect(R.cafeShiftsLeft(g)).toBe(0); // dữ liệu cũ / sửa tay không làm số âm
    g.wd.sacks = R.DOCK_SACKS_DAY + 99;
    expect(R.sacksLeft(g)).toBe(0);
  });
  it('trần ca làm lại được vào ngày hôm sau, còn số bao thì reset', () => {
    const g = fresh();
    g.wd.cargoShifts = R.DOCK_SHIFTS_DAY;
    g.wd.cafeShifts = R.CAFE_SHIFTS_DAY;
    g.wd.sacks = R.DOCK_SACKS_DAY;
    g.wd.plates = 2;
    g.wd.deliveries = 4;
    R.advance(g, 1440 - g.min + 1, { moving: false, running: false, sleeping: false, sheltered: true, working: false, load: 0, sleepQ: 1 }, new RNG(5));
    expect(R.dockShiftsLeft(g)).toBe(R.DOCK_SHIFTS_DAY);
    expect(R.cafeShiftsLeft(g)).toBe(R.CAFE_SHIFTS_DAY);
    expect(R.sacksLeft(g)).toBe(R.DOCK_SACKS_DAY);
  });
  it('tiền công một ca bốc cá vẫn nằm trong khung cũ, hằng số hai đầu khớp hàm', () => {
    expect(DOCK_WAGE_MIN).toBe(dockWage(0));
    expect(DOCK_WAGE_MAX).toBe(dockWage(1));
    expect(DOCK_WAGE_MIN).toBe(52000);
    expect(DOCK_WAGE_MAX).toBe(68000);
    // ca bốc cá nặng hơn (110 phút, khoẻ ≥ 35) nên trần ngày phải siết hơn trần ca chạy bàn (60 phút)
    expect(R.DOCK_SHIFTS_DAY * 110).toBeLessThan(R.CAFE_SHIFTS_DAY * 60 * 2);
  });
  it('ván mới có sẵn hai bộ đếm bằng 0 (không cần tăng SAVE_VERSION)', () => {
    const g = fresh();
    expect(g.wd.cargoShifts).toBe(0);
    expect(g.wd.cafeShifts).toBe(0);
    // ván cũ (thiếu field) vẫn đọc được nhờ merge trong load — mô phỏng bằng object thô
    const old = JSON.parse(JSON.stringify(g));
    delete old.wd.cargoShifts; delete old.wd.cafeShifts;
    expect(old.wd.cargoShifts).toBeUndefined();
    expect(R.dockShiftsLeft({ ...g, wd: { ...g.wd, cargoShifts: undefined } } as any)).toBe(R.DOCK_SHIFTS_DAY);
    expect(R.cafeShiftsLeft({ ...g, wd: { ...g.wd, cafeShifts: undefined } } as any)).toBe(R.CAFE_SHIFTS_DAY);
    expect(R.sacksLeft({ ...g, wd: { ...g.wd, sacks: undefined } } as any)).toBe(R.DOCK_SACKS_DAY);
  });
});

describe('mã nguồn: trần việc làm phải áp ở mọi cửa vào', () => {
  const src = readFileSync(new URL('../src/game/acts.ts', import.meta.url), 'utf8');
  const body = (name: string, sig: string) => {
    const i = src.indexOf(sig);
    expect(i, name).toBeGreaterThan(0);
    const next = src.indexOf('\n  }', i);
    return src.slice(i, next);
  };
  it('cafeShift chặn khi hết ca, và tăng bộ đếm sau khi nhận ca', () => {
    const f = body('cafeShift', 'private cafeShift(garden = false) {');
    expect(f).toContain('R.cafeShiftsLeft(g) <= 0');
    expect(f).toContain('g.wd.cafeShifts = (g.wd.cafeShifts ?? 0) + 1');
  });
  it('dockShift chặn khi hết ca, và tăng bộ đếm sau khi nhận ca', () => {
    const f = body('dockShift', '  dockShift() {');
    expect(f).toContain('R.dockShiftsLeft(g) <= 0');
    expect(f).toContain('g.wd.cargoShifts = (g.wd.cargoShifts ?? 0) + 1');
  });
  it('dockDrop chặn bao vượt trần (kể cả khi đã lỡ lấy bao trên vai), dockTake cũng chặn', () => {
    const drop = body('dockDrop', '  dockDrop() {');
    expect(drop).toContain('R.sacksLeft(g) <= 0');
    const take = body('dockTake', '  dockTake() {');
    expect(take).toContain('R.sacksLeft(g0) <= 0');
  });
  it('không còn con số 12 hay 6.000₫ chép tay trong phần việc làm', () => {
    const i = src.indexOf('// ───────────────────────── Việc làm thêm ─────────────────────────');
    const job = src.slice(i);
    expect(job).not.toMatch(/wd\.sacks >= 12/);
    expect(job).not.toMatch(/6\.000₫/);
    expect(job).toContain('R.DOCK_SACKS_DAY');
  });
  it('bảng việc làm đọc số thật: có đủ 7 dòng việc và dùng hàm đếm của rules', () => {
    const f = body('jobListText', '  jobListText() {');
    for (const s of ['R.sacksLeft', 'R.dockShiftsLeft', 'R.cafeShiftsLeft', 'g.wd.plates', 'g.wd.deliveries', 'DOCK_SACK_PAY', 'CAFE_SHIFTS_DAY']) expect(f).toContain(s);
    // đánh số 1…7 chứ không dùng emoji (font game không có bảng emoji ⇒ đầu dòng ra ô trống)
    expect(f).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    for (const name of ['Vác hàng bến chợ', 'Ca bốc cá bến cảng', 'Chạy bàn cà phê', 'Rửa chén quán cơm Bà Tư', 'Giao hàng trong khu phố', 'Thu mua ve chai', 'Việc khác']) expect(f).toContain(name);
  });
});
