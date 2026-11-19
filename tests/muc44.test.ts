// Lượt 44 — bồn hoa / bồn nước công viên / xe máy nhảy qua được, và chữ khi bới thùng rác không dính nhau.
import { describe, it, expect } from 'vitest';
import { World } from '../src/world/build';

describe('lượt 44 — bồn hoa, bồn nước, xe', () => {
  it('vành bồn hoa 0,42 m: đi bộ chặn, nhảy qua được, đứng lên được', () => {
    const w = new World();
    w.addCirc({ x: 0, z: 0, r: 1.25, top: 0.42 });
    const walk = { x: 0, z: 0 }; w.resolve(0, 0, 0.3, walk, 0);
    expect(walk.x).not.toBe(0);
    const jump = { x: 0, z: 0 }; w.resolve(0, 0, 0.3, jump, 0.5);
    expect(jump.x).toBe(0);
    expect(w.lowTopAt(0, 0)).toBeCloseTo(0.42, 5);
  });

  it('xe máy: yên 0,75 m vẫn trong tầm nhảy 0,99 m', () => {
    const w = new World();
    w.addCirc({ x: 3, z: 3, r: 0.42, top: 0.75 });
    expect(w.blocked(3, 3, 0.3, 0)).toBe(true);
    expect(w.blocked(3, 3, 0.3, 0.85)).toBe(false);
  });

  it('hồ nước: thành 0,62 m nhảy qua được, nhưng đứng trong nước thì không nhảy tiếp được', () => {
    const w = new World();
    w.addCirc({ x: 0, z: 0, r: 4, top: 0.62, kind: 'trough' });
    const walk = { x: 0, z: 0 }; w.resolve(0, 0, 0.3, walk, 0);
    expect(walk.x).not.toBe(0);
    const jump = { x: 0, z: 0 }; w.resolve(0, 0, 0.3, jump, 0.8);
    expect(jump.x).toBe(0);
    // mặt nước không đỡ được ai
    expect(w.lowTopAt(0, 0)).toBe(0);
    expect(w.troughAt(0, 0)).toBe(true);
    expect(w.troughAt(6, 0)).toBe(false);
  });
});
