// Lượt 46 — người chơi xin: "giảm tỉ lệ trời mưa" và "giảm giá thuê ở chợ, cv đi 40%".
import { describe, it, expect } from 'vitest';
import { WEATHER, WeatherId } from '../src/data/world';
import { SPOTS } from '../src/world/layout';
import { BRANCH_SITES } from '../src/data/gear';
import { RNG } from '../src/core/util';

/** Chạy chuỗi thời tiết thật (đúng hàm nextWeather) rồi đếm tỉ lệ mưa. */
function rainShare(seed: number, n = 40000) {
  const R = new RNG(seed); let cur: WeatherId = 'nang'; const cnt: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    cnt[cur] = (cnt[cur] ?? 0) + 1;
    const opts = Object.entries(WEATHER[cur].next) as [WeatherId, number][];
    cur = R.weighted(opts, (o) => o[1])![0];
  }
  const rain = (['mua', 'muato', 'giong', 'bao'] as WeatherId[]).reduce((a, k) => a + (cnt[k] ?? 0), 0) / n;
  return { rain, small: (cnt.mua ?? 0) / n, big: (cnt.muato ?? 0) / n, storm: (cnt.giong ?? 0) / n };
}

describe('giảm tỉ lệ trời mưa (lượt 46)', () => {
  it('mưa chỉ còn khoảng 18 % thời gian (trước là 37 %)', () => {
    for (const seed of [7, 99, 2024]) {
      const r = rainShare(seed);
      expect(r.rain, `seed ${seed}`).toBeLessThan(0.24);
      expect(r.rain, `seed ${seed}`).toBeGreaterThan(0.12);   // vẫn phải có mưa, đừng khô hạn
    }
  });

  it('mưa nhỏ không còn chiếm hơn 1/5 thời gian', () => {
    expect(rainShare(7).small).toBeLessThan(0.2);
  });

  it('nắng vẫn là thời tiết phổ biến nhất', () => {
    const R = new RNG(7); let cur: WeatherId = 'nang'; const cnt: Record<string, number> = {};
    for (let i = 0; i < 40000; i++) { cnt[cur] = (cnt[cur] ?? 0) + 1; const o = Object.entries(WEATHER[cur].next) as [WeatherId, number][]; cur = R.weighted(o, (x) => x[1])![0]; }
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe('nang');
  });
});

describe('giảm 40 % giá thuê ở chợ và công viên (lượt 46)', () => {
  it('phí chỗ Cổng Chợ 30.000 → 18.000/ngày', () => {
    expect(SPOTS.find((s) => s.id === 'cho')!.fee).toBe(18000);
  });
  it('phí chỗ Cổng Công Viên 20.000 → 12.000/ngày', () => {
    expect(SPOTS.find((s) => s.id === 'cv')!.fee).toBe(12000);
  });
  it('giá thuê chi nhánh ở chợ và công viên cũng giảm 40 %', () => {
    expect(BRANCH_SITES.find((s) => s.spot === 'cho')!.rent).toBe(72000);   // 120.000 → 72.000
    expect(BRANCH_SITES.find((s) => s.spot === 'cv')!.rent).toBe(54000);    // 90.000 → 54.000
  });
  it('chỗ khác không bị đụng tới', () => {
    expect(SPOTS.find((s) => s.id === 'vp')!.fee).toBe(60000);
    expect(SPOTS.find((s) => s.id === 'hem')!.fee).toBe(0);
    expect(BRANCH_SITES.find((s) => s.spot === 'vp')!.rent).toBe(150000);
  });
  it('mọi phí chỗ vẫn là số dương hoặc 0, và rẻ hơn trước', () => {
    for (const s of SPOTS) expect(s.fee).toBeGreaterThanOrEqual(0);
    expect(SPOTS.find((s) => s.id === 'cho')!.fee).toBeLessThan(30000);
    expect(SPOTS.find((s) => s.id === 'cv')!.fee).toBeLessThan(20000);
  });
});
