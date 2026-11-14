// Đường phố 2005–2010: ô tô đời cũ, đua xe đạp chủ nhật, xích đu công viên.
import { describe, it, expect } from 'vitest';
import { SAVE_VERSION, migrate, newGame } from '../src/sim/state';
import { CARS, CAR_BY, CAR_MAX_LEN } from '../src/data/cars';
import { FUN_LIST, funAt, funOpenAt } from '../src/data/fun';
import { FIXED } from '../src/data/people';
import {
  BEATS, BEATS_PER_LAP, LAPS, BEAT_SECONDS, PRIZE, ENTRY_ENERGY, RACE_HOURS,
  makeBeats, quality, rivalScore, verdict, isRaceDay, raceOpen, racedToday,
} from '../src/sim/race';
import { fresh } from './helpers';

describe('ô tô đời cũ', () => {
  it('bốn mẫu xe, mẫu nào cũng có tên và bảng màu riêng', () => {
    expect(CARS).toHaveLength(4);
    expect(new Set(CARS.map((c) => c.id)).size).toBe(4);
    expect(new Set(CARS.map((c) => c.name)).size).toBe(4);
    for (const c of CARS) {
      expect(c.name.length).toBeGreaterThan(3);
      expect(c.colors.length).toBeGreaterThanOrEqual(3);
      expect(c.len).toBeGreaterThan(2.2);
      expect(c.len).toBeLessThan(4);
      expect(CAR_BY[c.id]).toBe(c);
    }
  });
  it('chạy chậm hơn xe máy (7–11 m/s) và xe tải là chậm nhất', () => {
    for (const c of CARS) expect(c.speed[1]).toBeLessThan(7.4);
    const mid = (c: { speed: [number, number] }) => (c.speed[0] + c.speed[1]) / 2;
    const truck = CAR_BY.truck;
    for (const c of CARS) if (c !== truck) expect(mid(c)).toBeGreaterThan(mid(truck));
    expect(CAR_MAX_LEN).toBe(CAR_BY.truck.len);
  });
});

describe('đua xe đạp chủ nhật', () => {
  it('chín nhịp cho ba vòng, mỗi vòng ba nhịp', () => {
    expect(LAPS * BEATS_PER_LAP).toBe(BEATS);
    expect(BEATS).toBe(9);
    expect(BEAT_SECONDS).toBeGreaterThan(1);
  });
  it('vùng ăn điểm nằm trong khung và cùng hạt giống thì y hệt', () => {
    const a = makeBeats(4242), b = makeBeats(4242), c = makeBeats(99);
    expect(a).toHaveLength(BEATS);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    for (const beat of a) {
      expect(beat.lo).toBeGreaterThanOrEqual(0.1 - 1e-9);
      expect(beat.hi).toBeLessThanOrEqual(0.76 + 1e-9);
      expect(beat.hi - beat.lo).toBeGreaterThanOrEqual(0.22 - 1e-9);
      expect(beat.hi - beat.lo).toBeLessThanOrEqual(0.30 + 1e-9);
    }
  });
  it('bấm đúng giữa vùng được trọn điểm, lệch ra mép thì ít, trượt thì không', () => {
    const b = { lo: 0.3, hi: 0.55 }, mid = (b.lo + b.hi) / 2;
    expect(quality(mid, b)).toBeCloseTo(1, 6);
    expect(quality(b.lo, b)).toBeGreaterThan(0.4);
    expect(quality(b.lo, b)).toBeLessThan(0.5);
    expect(quality(b.hi + 0.001, b)).toBe(0);
    expect(quality(0.0, b)).toBe(0);
    // càng xa giữa vùng thì càng ít điểm, tính từ hai phía
    expect(quality(mid - 0.02, b)).toBeGreaterThan(quality(mid - 0.1, b));
    expect(quality(mid + 0.02, b)).toBeGreaterThan(quality(mid + 0.1, b));
  });
  it('con nhỏ đua cùng mạnh yếu cố định theo hạt giống', () => {
    const s = rivalScore(7), s2 = rivalScore(7), other = rivalScore(8);
    expect(s).toBe(s2);
    expect(s).not.toBe(other);
    expect(s).toBeGreaterThanOrEqual(0.42);
    expect(s).toBeLessThanOrEqual(0.72);
  });
  it('thắng thì có tiền thưởng, thua thì chỉ được an ủi', () => {
    const g = fresh();
    const strong = verdict(g, 3, BEATS);
    expect(strong.win).toBe(true);
    expect(strong.prize).toBe(PRIZE);
    const weak = verdict(g, 3, 0);
    expect(weak.win).toBe(false);
    expect(weak.prize).toBe(0);
    expect(strong.rep).toBeGreaterThan(weak.rep);
    expect(strong.mood).toBeGreaterThan(weak.mood);
    // hoà coi như thắng
    const rival = rivalScore(3) * BEATS;
    expect(verdict(g, 3, rival).win).toBe(true);
  });
  it('chỉ chủ nhật, chỉ trong khung giờ đăng ký, mỗi ngày một lượt', () => {
    const g = fresh();
    expect(isRaceDay(g)).toBe(true);            // ngày đầu của ván là chủ nhật
    const [h0, h1] = RACE_HOURS;
    expect(raceOpen(g, h0)).toBe(true);
    expect(raceOpen(g, h1 - 0.1)).toBe(true);
    expect(raceOpen(g, h1 + 0.5)).toBe(false);
    expect(raceOpen(g, h0 - 1)).toBe(false);
    for (let d = 1; d < 7; d++) { const gg = fresh(); gg.day = d; expect(isRaceDay(gg)).toBe(false); }
    const next = fresh(); next.day = 7; expect(isRaceDay(next)).toBe(true);
    expect(racedToday(g)).toBe(false);
    g.flags.raceDay = g.day; expect(racedToday(g)).toBe(true);
    expect(ENTRY_ENERGY).toBeGreaterThan(0);
  });
  it('bản lưu cũ (v8) mở lên có sổ ngày đua', () => {
    const g = newGame(77);
    const raw = JSON.parse(JSON.stringify(g));
    raw.v = 8; delete raw.flags.raceDay; delete raw.flags.raceWin;
    const m = migrate(raw)!;
    expect(m.v).toBe(SAVE_VERSION);
    expect(m.flags.raceDay).toBe(-1);
    expect(m.flags.raceWin).toBe(0);
    expect(racedToday(m)).toBe(false);
  });
  it('có con Lan đứng ở vạch xuất phát', () => {
    expect(FIXED.dua.name).toBe('Con Lan');
    expect(FIXED.dua.fem).toBe(true);
  });
});

describe('xích đu công viên', () => {
  it('ba mức thời gian, đu lâu hơn thì lên tinh thần nhiều hơn nhưng mỏi chân hơn', () => {
    const swings = funAt('xich_du');
    expect(swings).toHaveLength(3);
    const byMins = [...swings].sort((a, b) => a.mins - b.mins);
    for (let i = 1; i < byMins.length; i++) {
      expect(byMins[i].mood).toBeGreaterThan(byMins[i - 1].mood);
      expect(byMins[i].energy!).toBeLessThanOrEqual(byMins[i - 1].energy!);
    }
    // đu là chỗ chơi miễn phí, và có trần: 40 phút không thể quá 22 tinh thần
    for (const s of swings) { expect(s.cost).toBe(0); expect(s.mood).toBeLessThanOrEqual(22); }
  });
  it('sân chơi mở ban ngày, đêm thì đóng', () => {
    expect(funOpenAt('xich_du', 9)).toHaveLength(3);
    expect(funOpenAt('xich_du', 23)).toHaveLength(0);
    expect(FUN_LIST.some((f) => f.anchor === 'xich_du')).toBe(true);
  });
});
