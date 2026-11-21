// Lượt 53: thanh thể lực (thanh "chạy") hồi nhanh/chậm theo MÁU và PIN NĂNG LƯỢNG, và người yếu tụt nhanh hơn.
import { describe, it, expect } from 'vitest';
import * as R from '../src/sim/rules';
import { fresh } from './helpers';

/** Ván có máu/pin chỉnh tay; các chỉ số khác để mức bình thường. */
function withStats(health: number, energy: number) {
  const g = fresh();
  g.st.health = health; g.st.energy = energy;
  g.st.hunger = 80; g.st.thirst = 80;        // no đủ để trần thể lực là 1
  return g;
}

describe('thanh chạy hồi theo máu và pin (lượt 53)', () => {
  it('người khoẻ hồi đúng như con số cũ: 0,09/giây khi đứng, 0,05/giây khi đi', () => {
    const g = withStats(95, 95);
    expect(R.staminaRegenMul(g)).toBe(1);
    expect(R.staminaRegen(g, false)).toBeCloseTo(0.09, 5);
    expect(R.staminaRegen(g, true)).toBeCloseTo(0.05, 5);
    expect(R.staminaDrain(g)).toBeCloseTo(0.1, 5);
  });

  it('máu 20 thì hồi còn đúng một nửa', () => {
    const weak = withStats(20, 100);
    expect(R.staminaHpMul(weak)).toBeCloseTo(0.5, 5);
    expect(R.staminaRegen(weak, false) / R.staminaRegen(withStats(95, 100), false)).toBeCloseTo(0.5, 5);
    // 22 giây đứng chờ mới đầy thanh, so với 11 giây khi khoẻ
    expect(R.staminaRefillSecs(weak)).toBeGreaterThan(20);
    expect(R.staminaRefillSecs(withStats(95, 100))).toBeCloseTo(11.11, 1);
  });

  it('máu càng thấp hồi càng chậm, nhưng luôn còn hồi được (không kẹt ở 0)', () => {
    const secs = [100, 70, 60, 45, 30, 20, 5].map((hp) => R.staminaRefillSecs(withStats(hp, 100)));
    for (let i = 1; i < secs.length; i++) expect(secs[i]).toBeGreaterThanOrEqual(secs[i - 1]);
    expect(secs[0]).toBeLessThanOrEqual(11.12);
    expect(secs[secs.length - 1]).toBeLessThan(40);            // vẫn hồi, chỉ chậm
    expect(R.staminaRegenMul(withStats(0, 0))).toBeGreaterThanOrEqual(0.28);
  });

  it('cạn pin thì hồi chậm thêm, và cộng với máu thấp cũng không thành đứng im', () => {
    const tired = withStats(95, 0);
    expect(R.staminaRegenMul(tired)).toBeLessThan(0.85);
    expect(R.staminaRegenMul(tired)).toBeGreaterThan(0.7);
    const both = withStats(20, 0);
    expect(R.staminaRegenMul(both)).toBeLessThan(R.staminaRegenMul(tired));
    expect(R.staminaRegenMul(both)).toBeGreaterThan(0.3);
  });

  it('người yếu TỤT nhanh hơn khi chạy: chạy liền được ngắn hơn hẳn', () => {
    const ok = withStats(95, 95), hurt = withStats(25, 100);
    expect(R.staminaDrain(hurt)).toBeGreaterThan(R.staminaDrain(ok));
    expect(R.staminaRunSecs(hurt)).toBeLessThan(R.staminaRunSecs(ok));
    expect(R.staminaRunSecs(ok)).toBeCloseTo(10, 5);            // 0,1/giây ⇒ đúng 10 giây
    expect(R.staminaDrain(withStats(0, 0))).toBeCloseTo(0.16, 5); // trần 1,6 lần, không phạt vô hạn
  });

  it('trần thể lực vẫn chỉ do đói/khát quyết định, không dính tới luật mới', () => {
    const g = withStats(20, 100);
    expect(R.staminaMax(g)).toBe(1);
    g.st.hunger = 20; g.st.thirst = 20;
    expect(R.staminaMax(g)).toBeLessThan(1);
    expect(R.staminaMax(g)).toBeGreaterThanOrEqual(0.35);
  });
});
