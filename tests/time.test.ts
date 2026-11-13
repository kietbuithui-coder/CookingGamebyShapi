import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { RNG } from '../src/core/util';
import { WEATHER, WeatherId, EVENT_LIST, EVENTS } from '../src/data/world';
import { SHOPS } from '../src/data/shops';
import { HOUSING } from '../src/data/gear';
import { fresh, withStall, give, IDLE } from './helpers';

describe('thời gian trôi', () => {
  it('advance cộng phút và sang ngày mới lúc nửa đêm', () => {
    const g = fresh(); const m0 = g.min;
    R.advance(g, 30, IDLE, new RNG(1));
    expect(g.min).toBe(m0 + 30);
    expect(g.day).toBe(0);
    R.advance(g, 1440 - g.min + 5, IDLE, new RNG(1));
    expect(g.day).toBe(1);
    expect(g.min).toBeCloseTo(5);
  });
  it('sang ngày: sổ hôm qua vào lịch sử, sổ mới trắng, việc vặt được làm lại', () => {
    const g = fresh(); R.earn(g, 20000, 'side'); g.wd.sacks = 12; g.wd.begTired = 9; g.wd.picked = [1, 2, 3];
    R.advance(g, 1440 - g.min + 1, IDLE, new RNG(2));
    expect(g.hist).toHaveLength(1);
    expect(g.hist[0].side).toBe(20000);
    expect(g.led.day).toBe(1);
    expect(g.led.side).toBe(0);
    expect(g.wd.sacks).toBe(0);
    expect(g.wd.begTired).toBe(0);
    expect(g.wd.picked).toEqual([]);
  });
  it('đói, khát tăng dần khi thức; ngủ thì hồi năng lượng', () => {
    const g = fresh(); const s0 = { ...g.st };
    R.advance(g, 240, { ...IDLE, moving: true, sheltered: false }, new RNG(3));
    expect(g.st.hunger).toBeLessThan(s0.hunger);
    expect(g.st.thirst).toBeLessThan(s0.thirst);
    expect(g.st.energy).toBeLessThan(s0.energy);
    const e1 = g.st.energy;
    R.advance(g, 240, { ...IDLE, sleeping: true }, new RNG(3));
    expect(g.st.energy).toBeGreaterThan(e1);
  });
  it('chạy tốn sức hơn đi bộ', () => {
    const a = fresh(), b = fresh();
    R.advance(a, 60, { ...IDLE, moving: true, sheltered: false }, new RNG(4));
    R.advance(b, 60, { ...IDLE, moving: true, running: true, sheltered: false }, new RNG(4));
    expect(b.st.energy).toBeLessThan(a.st.energy);
  });
  it('ăn uống hồi chỉ số và không vượt quá 100', () => {
    const g = fresh(); g.st.hunger = 20; g.st.thirst = 95;
    R.consume(g, { h: 40, t: 30 });
    expect(g.st.hunger).toBe(60);
    expect(g.st.thirst).toBe(100);
  });
  it('các chỉ số luôn nằm trong 0–100 dù bỏ đói nhiều ngày', () => {
    const g = fresh();
    for (let i = 0; i < 24 * 6; i++) R.advance(g, 60, { ...IDLE, moving: true, sheltered: false }, new RNG(i + 1));
    for (const v of Object.values(g.st)) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
    expect(g.st.health).toBeLessThan(92);                       // đói khát lâu ngày thì đổ bệnh
    expect(R.staminaMax(g)).toBeLessThan(1);
  });
  it('nguyên liệu tươi để ngoài quầy hỏng dần theo giờ', () => {
    const g = withStall(); give(g, 'heo', 2, 100);
    R.advance(g, 300, IDLE, new RNG(5));
    const s = g.stall.store.find((x) => x.id === 'heo');
    expect(!s || s.fresh < 100).toBe(true);
  });
  it('thùng đá có đá giữ đồ lạnh tươi lâu hơn', () => {
    const a = withStall(), b = withStall();
    give(a, 'heo', 2, 100); give(b, 'heo', 2, 100);
    b.gear.thungda = 100; give(b, 'da', 6, 100);
    expect(R.stallChilled(b)).toBe(true);
    R.advance(a, 180, IDLE, new RNG(6)); R.advance(b, 180, IDLE, new RNG(6));
    const fa = a.stall.store.find((x) => x.id === 'heo')?.fresh ?? 0, fb = b.stall.store.find((x) => x.id === 'heo')?.fresh ?? 0;
    expect(fb).toBeGreaterThan(fa);
  });
});

describe('thời tiết', () => {
  it('mọi chuyển tiếp thời tiết đều dẫn tới kiểu thời tiết hợp lệ', () => {
    const rng = new RNG(9);
    for (const id of Object.keys(WEATHER) as WeatherId[]) for (let i = 0; i < 50; i++) expect(WEATHER[R.nextWeather(id, rng)]).toBeDefined();
  });
  it('chạy 60 ngày thì gặp ít nhất 4 kiểu thời tiết, trong đó có mưa', () => {
    const g = fresh(77), rng = new RNG(77), seen = new Set<string>();
    for (let i = 0; i < 60 * 24; i++) { R.advance(g, 60, { ...IDLE, sleeping: g.min < 300 }, rng); seen.add(g.weather.now); g.st.hunger = 80; g.st.thirst = 80; g.st.health = 90; }
    expect(seen.size).toBeGreaterThanOrEqual(4);
    expect([...seen].some((w) => WEATHER[w as WeatherId].rain > 0)).toBe(true);
  });
  it('dầm mưa ngoài trời thì ướt, đứng dưới mái che thì không', () => {
    const wet = fresh(), dry = fresh();
    wet.weather.now = 'muato'; wet.weather.until = 1e9; dry.weather.now = 'muato'; dry.weather.until = 1e9;
    R.tickStats(wet, 30, { ...IDLE, sheltered: false }); R.tickStats(dry, 30, IDLE);
    expect(wet.weather.wet).toBeGreaterThan(dry.weather.wet);
  });
});

describe('sự kiện', () => {
  it('mọi sự kiện đều bật và tắt được mà không lỗi', () => {
    for (const e of EVENT_LIST) {
      const g = withStall(); g.day = 20; g.rep = 50;
      expect(R.startEvent(g, e.id, new RNG(1)), e.id).toBe(true);
      expect(R.eventOn(g, e.id)).toBe(true);
      expect(R.startEvent(g, e.id, new RNG(1))).toBe(false);     // không chồng hai lần
      R.mods(g, 'congvien'); R.arrivalRate(g);
      R.endEvent(g, e.id);
      expect(R.eventOn(g, e.id)).toBe(false);
      expect(g.wd.outOf).toEqual([]);
    }
  });
  it('sự kiện tăng giá nguyên liệu thật sự làm chợ đắt lên', () => {
    const e = EVENT_LIST.find((x) => x.price && Object.values(x.price).some((v) => v! > 1))!;
    const g = fresh(); g.min = 8 * 60;
    let checked = 0;
    for (const s of Object.values(SHOPS)) for (const id of s.items) {
      const before = R.shopPrice(g, s, id); R.startEvent(g, e.id, new RNG(1)); const after = R.shopPrice(g, s, id); R.endEvent(g, e.id);
      expect(after).toBeGreaterThanOrEqual(before);
      if (after > before) checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
  it('sự kiện hết hạn tự tắt khi thời gian trôi qua', () => {
    const g = withStall(); const e = EVENT_LIST.find((x) => !x.weather && !x.actor)!;
    R.startEvent(g, e.id, new RNG(1));
    R.advance(g, e.dur * 60 + 5, IDLE, new RNG(1));
    expect(R.eventOn(g, e.id)).toBe(false);
  });
  it('cúp điện làm tủ lạnh phòng trọ mất tác dụng', () => {
    const e = EVENT_LIST.find((x) => x.blackout?.includes('dancu'));
    if (!e) return;
    const g = fresh(); g.housing = 'tro'; g.gear.tulanh = 100;
    expect(R.homeChilled(g)).toBe(true);
    R.startEvent(g, e.id, new RNG(1));
    expect(R.homeChilled(g)).toBe(false);
  });
  it('mô phỏng 45 ngày liên tục: không lỗi, không NaN, tiền không âm', () => {
    const g = withStall(4242), rng = new RNG(4242); g.cash = 300000;
    const started = new Set<string>();
    for (let i = 0; i < 45 * 48; i++) {
      const h = g.min / 60;
      R.advance(g, 30, { ...IDLE, sleeping: h < 5.5 || h > 22, sheltered: h < 5.5 || h > 22, moving: h > 6 && h < 20 }, rng);
      if (g.st.hunger < 30) R.consume(g, { h: 60, t: 40 }); if (g.st.thirst < 30) R.consume(g, { t: 60 });
      for (const a of g.ev.active) started.add(a.id);
      expect(Number.isFinite(g.cash)).toBe(true);
      expect(g.cash).toBeGreaterThanOrEqual(0);
      expect(g.min).toBeGreaterThanOrEqual(0); expect(g.min).toBeLessThan(1440);
      for (const v of Object.values(g.st)) expect(Number.isFinite(v)).toBe(true);
      expect(g.rep).toBeGreaterThanOrEqual(0); expect(g.rep).toBeLessThanOrEqual(100);
    }
    expect(g.day).toBe(45);
    expect(g.hist.length).toBeGreaterThan(0);
    expect(started.size).toBeGreaterThanOrEqual(5);              // Đạo diễn sự kiện có hoạt động
    for (const id of started) expect(EVENTS[id]).toBeDefined();
  });
});

describe('chỗ ở', () => {
  it('thuê phòng trọ trừ tiền thuê và đổi chỗ ở', () => {
    const g = fresh(); g.cash = 1000000;
    expect(R.payHousing(g, 'tro')).toBe(true);
    expect(g.housing).toBe('tro');
    expect(g.cash).toBe(1000000 - HOUSING.tro.rent);
    expect(g.led.rent).toBe(HOUSING.tro.rent);
    expect(g.paidUntil).toBeGreaterThan(g.day);
  });
  it('không đủ tiền thì không thuê được', () => {
    const g = fresh();
    expect(R.payHousing(g, 'tro')).toBe(false);
    expect(g.housing).toBe('gamcau');
  });
  it('chỗ ở tốt hơn thì ngủ ngon và an toàn hơn', () => {
    expect(HOUSING.tro.sleep).toBeGreaterThan(HOUSING.gamcau.sleep);
    expect(HOUSING.tro.safety).toBeGreaterThan(HOUSING.gamcau.safety);
    expect(HOUSING.tro.storage).toBeGreaterThan(HOUSING.gamcau.storage);
  });
});
