// Sức khoẻ: ngất vì máu về 0, viện phí, đồ rơi, bệnh viện Phước An và quầy thuốc.
import { describe, it, expect } from 'vitest';
import { SAVE_VERSION, migrate, newGame, weightOf } from '../src/sim/state';
import { faint, claimLost, buyMed, exam, recover, recoverCost, MEDS, MED_LIST, EXAM_FEE, RECOVER_FEE, FAINT_FEE, carryCap, bagWeight } from '../src/sim/rules';
import { LOTS } from '../src/world/layout';
import { fresh, give } from './helpers';

/** Ván chơi có sẵn đồ trong ba lô để thử chuyện rơi đồ. */
function loaded() {
  const g = fresh(7);
  give(g, 'gao', 2, 95, 0.9, 5000, 'bag');
  give(g, 'muoi', 1, 95, 0.9, 2000, 'bag');
  give(g, 'hanh', 3, 95, 0.9, 1000, 'bag');
  give(g, 'da', 2, 95, 0.9, 1000, 'bag');
  return g;
}

describe('bệnh viện Phước An', () => {
  it('có lô riêng, đủ rộng, nằm trên phố trung tâm', () => {
    const lot = LOTS.find((l) => l.kind === 'hospital');
    expect(lot).toBeTruthy();
    expect(lot!.id).toBe('hospital');
    expect(lot!.w).toBeGreaterThanOrEqual(8);
    expect(lot!.district).toBe('trungtam');
  });

  it('quầy thuốc có ba món, giá dương, chỉ thuốc cảm là chữa cảm', () => {
    expect(MED_LIST.length).toBe(3);
    const cures = MED_LIST.filter((m) => m.cures === 'sick').map((m) => m.id);
    expect(cures).toEqual(['cam']);
    for (const m of MED_LIST) { expect(m.price).toBeGreaterThan(0); expect(m.hp).toBeGreaterThan(0); expect(m.desc.length).toBeGreaterThan(8); }
    expect(MEDS.bang.price).toBeLessThan(MEDS.bo.price);
  });

  it('mua thuốc cảm thì hết bệnh, mất đúng tiền, máu tăng', () => {
    const g = fresh(); g.cash = 100000; g.flags.sick = 1; g.st.health = 50;
    expect(buyMed(g, 'cam')).toBe(true);
    expect(g.cash).toBe(100000 - MEDS.cam.price);
    expect(g.flags.sick).toBeUndefined();
    expect(g.st.health).toBe(50 + MEDS.cam.hp);
  });

  it('không đủ tiền mua thuốc thì không mua được, không mất gì', () => {
    const g = fresh(); g.cash = 1000; g.flags.sick = 1; g.st.health = 50;
    expect(buyMed(g, 'cam')).toBe(false);
    expect(g.cash).toBe(1000); expect(g.flags.sick).toBe(1); expect(g.st.health).toBe(50);
  });

  it('khám bệnh tốn phí, bác sĩ nói đúng bệnh', () => {
    const g = fresh(); g.cash = 100000;
    const d = exam(g);
    expect(d).toBeTruthy();
    expect(g.cash).toBe(100000 - EXAM_FEE);
    expect(g.flags.exam).toBe(g.day);
    expect(d!).toContain('ổn');
    g.flags.sick = 1;
    expect(exam(g)!).toContain('thuốc cảm');
  });

  it('không đủ tiền khám thì bác sĩ không khám', () => {
    const g = fresh(); g.cash = EXAM_FEE - 1000;
    expect(exam(g)).toBeNull();
    expect(g.cash).toBe(EXAM_FEE - 1000);
  });

  it('phòng hồi sức tính theo giờ và hồi máu, không vượt 100', () => {
    expect(recoverCost(1)).toBe(RECOVER_FEE);
    expect(recoverCost(4)).toBe(4 * RECOVER_FEE);
    const g = fresh(); g.cash = 100000; g.st.health = 40;
    expect(recover(g, 2)).toBe(true);
    expect(g.cash).toBe(100000 - recoverCost(2));
    expect(g.st.health).toBe(40 + 28);
    recover(g, 8); expect(g.st.health).toBeLessThanOrEqual(100);
  });

  it('nghèo thì không nằm phòng hồi sức được', () => {
    const g = fresh(); g.cash = 1000; g.st.health = 30;
    expect(recover(g, 4)).toBe(false);
    expect(g.cash).toBe(1000); expect(g.st.health).toBe(30);
  });
});

describe('ngất vì kiệt sức', () => {
  it('viện phí có trần và tiền không bao giờ âm', () => {
    const cases = [0, 1, 5000, 18000, 25000, 120000, 1000000];
    for (const cash of cases) {
      const g = fresh(); g.cash = cash; g.st.health = 0;
      const r = faint(g);
      expect(g.cash).toBeGreaterThanOrEqual(0);
      expect(r.fee).toBeLessThanOrEqual(cash);
      expect(g.cash).toBe(cash - r.fee);
      if (cash >= FAINT_FEE * 2) expect(r.fee).toBeLessThan(cash); // người có tiền không bị lột sạch
    }
  });

  it('tỉnh dậy với 45 máu, tinh thần và uy tín tụt, có ghi nhận lần ngất', () => {
    const g = fresh(); g.cash = 50000; g.st.health = 0.5; g.st.mood = 70; g.st.hygiene = 60; g.rep = 40;
    const before = { mood: g.st.mood, hy: g.st.hygiene, rep: g.rep };
    faint(g);
    expect(g.st.health).toBe(45);
    expect(g.st.mood).toBeLessThan(before.mood);
    expect(g.st.hygiene).toBeLessThan(before.hy);
    expect(g.rep).toBeLessThan(before.rep);
    expect(g.flags.faint).toBe(1);
    expect(g.flags.faintDay).toBe(g.day);
  });

  it('rơi khoảng 40% đồ trong ba lô, phần còn lại vẫn giữ', () => {
    const g = loaded();
    const n = g.bag.length;
    expect(n).toBe(4);
    const r = faint(g);
    expect(r.lost.length).toBe(Math.ceil(n * 0.4));
    expect(g.bag.length).toBe(n - r.lost.length);
    expect(g.lostBag.length).toBe(r.lost.length);
    expect(g.lostDay).toBe(g.day);
  });

  it('ba lô rỗng thì không mất gì, chỉ mất tiền', () => {
    const g = fresh(); g.cash = 40000; g.st.health = 0;
    expect(g.bag.length).toBe(0);
    const r = faint(g);
    expect(r.lost).toEqual([]);
    expect(g.cash).toBeGreaterThanOrEqual(0);
  });

  it('quay lại bệnh viện nhận đồ trong cùng ngày, hôm sau thì mất', () => {
    const g = loaded(); g.st.health = 0;
    const r = faint(g);
    const w = weightOf(r.lost);
    const got = claimLost(g);
    expect(got.length).toBe(r.lost.length);
    expect(weightOf(got)).toBeCloseTo(w, 5);
    // thu lại được: nằm trong ba lô hoặc trong nhà
    expect(weightOf(g.bag) + weightOf(g.home)).toBeGreaterThanOrEqual(bagWeight(g) - weightOf(g.bag) + w - 1e-6);
    expect(claimLost(g)).toEqual([]);

    const g2 = loaded(); g2.st.health = 0;
    faint(g2); g2.day += 1;
    expect(claimLost(g2)).toEqual([]);
  });

  it('đồ nhặt lại không vượt sức chứa: chật thì cất về nhà', () => {
    const g = fresh(9); g.st.health = 0;
    for (let i = 0; i < 4; i++) give(g, 'gao', 5, 95, 0.9, 5000, 'bag');
    const r = faint(g);
    expect(r.lost.length).toBeGreaterThan(0);
    claimLost(g);
    expect(bagWeight(g)).toBeLessThanOrEqual(carryCap(g) + 1e-6);
  });
});

describe('bản lưu v5', () => {
  it('bản lưu cũ đang ở máu 0 thì mở lên không ngất liền', () => {
    const raw = JSON.parse(JSON.stringify(newGame(3, 'anh')));
    raw.v = 4; raw.st.health = 0; delete raw.lostBag; delete raw.lostDay;
    const g = migrate(raw)!;
    expect(g).toBeTruthy();
    expect(g.v).toBe(SAVE_VERSION);
    expect(g.st.health).toBe(45);
    expect(g.flags.faint).toBe(0);
    expect(g.lostBag).toEqual([]);
    expect(g.lostDay).toBe(-1);
  });
});
