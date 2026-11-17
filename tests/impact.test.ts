import { describe, it, expect } from 'vitest';
import {
  classifyVehicleHit,
  combatHitSpec,
  applyVehicleImpactToStats,
  applyCombatImpactToStats,
} from '../src/sim/impact';
import { newGame, STAT_MAX } from '../src/sim/state';

describe('va chạm xe cộ & đánh đấm (src/sim/impact.ts)', () => {
  it('phân loại đủ 3 cấp độ va chạm xe cộ: nhẹ, trung bình, nặng', () => {
    const bike = classifyVehicleHit('bicycle', 4.5, false);
    const motoGraze = classifyVehicleHit('moto', 8.0, true);
    const motoDirect = classifyVehicleHit('moto', 8.5, false);
    const carSlowGraze = classifyVehicleHit('car', 7.5, true);
    const carDirect = classifyVehicleHit('car', 11.5, false);
    const truckDirect = classifyVehicleHit('truck', 9.0, false);

    expect(bike.tier).toBe('light');
    expect(motoGraze.tier).toBe('light');
    expect(motoDirect.tier).toBe('medium');
    expect(carSlowGraze.tier).toBe('medium');
    expect(carDirect.tier).toBe('heavy');
    expect(truckDirect.tier).toBe('heavy');

    expect(bike.hpLoss).toBeLessThan(motoDirect.hpLoss);
    expect(motoDirect.hpLoss).toBeLessThan(carDirect.hpLoss);
    expect(carDirect.hpLoss).toBeLessThanOrEqual(truckDirect.hpLoss);
    expect(bike.knockSpeed).toBeLessThan(motoDirect.knockSpeed);
    expect(motoDirect.knockSpeed).toBeLessThan(carDirect.knockSpeed);
    expect(bike.fallSec).toBe(0);
    expect(motoDirect.fallSec).toBeGreaterThan(0);
    expect(carDirect.fallSec).toBeGreaterThan(motoDirect.fallSec);
  });

  it('tính lực đánh đấm giữa người chơi và các kiểu NPC', () => {
    const pLight = combatHitSpec('player', false);
    const pHeavy = combatHitSpec('player', true);
    const ped = combatHitSpec('ped');
    const rowdy = combatHitSpec('rowdy');
    const gang = combatHitSpec('gang');

    expect(pHeavy.knockSpeed).toBeGreaterThan(pLight.knockSpeed);
    expect(ped.hpLoss).toBeLessThan(rowdy.hpLoss);
    expect(rowdy.hpLoss).toBeLessThan(gang.hpLoss);
    expect(gang.flash).toBeGreaterThan(ped.flash);
  });

  it('áp dụng va chạm xe cộ trừ máu, tinh thần, vệ sinh và báo ngất khi máu về 0', () => {
    const g = newGame();
    g.st.health = STAT_MAX;
    g.st.mood = 80;
    g.st.hygiene = 80;

    const spec = classifyVehicleHit('moto', 8.5, false);
    const res1 = applyVehicleImpactToStats(g, spec);
    expect(res1.fainted).toBe(false);
    expect(g.st.health).toBe(STAT_MAX - spec.hpLoss);
    expect(g.st.mood).toBe(80 - spec.moodLoss);
    expect(g.st.hygiene).toBe(80 - spec.hygLoss);

    g.st.health = 10;
    const heavy = classifyVehicleHit('truck', 10, false);
    const res2 = applyVehicleImpactToStats(g, heavy);
    expect(res2.fainted).toBe(true);
    expect(g.st.health).toBe(0);
  });

  it('áp dụng đòn đánh vào người chơi trừ máu/tinh thần và kích hoạt ngất khi hết máu', () => {
    const g = newGame();
    g.st.health = 12;
    g.st.mood = 50;

    const gang = combatHitSpec('gang');
    const res = applyCombatImpactToStats(g, gang);
    expect(res.fainted).toBe(true);
    expect(g.st.health).toBe(0);
    expect(g.st.mood).toBe(50 - gang.moodLoss);
  });
});
