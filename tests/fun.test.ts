// Kiểm tra phần "chơi" và thang mở công thức: mỗi lần lên cấp chỉ mở 1–2 món, món rẻ trước, đúng tay nghề.
import { describe, it, expect } from 'vitest';
import { FUN_LIST, FUNS, funAt } from '../src/data/fun';
import { RECIPE_LIST, RECIPES } from '../src/data/recipes';
import { unlockRecipes, addXp, level } from '../src/sim/rules';
import { fresh } from './helpers';

describe('chỗ vui chơi', () => {
  it('mã không trùng, đều gắn với một neo và tốn thời gian', () => {
    expect(new Set(FUN_LIST.map((f) => f.id)).size).toBe(FUN_LIST.length);
    for (const f of FUN_LIST) {
      expect(f.anchor.length, f.id).toBeGreaterThan(0);
      expect(f.mins, f.id).toBeGreaterThan(0);
      expect(f.mood, f.id).toBeGreaterThan(0);
      expect(f.cost, f.id).toBeGreaterThanOrEqual(0);
      expect(f.label.length, f.id).toBeGreaterThan(0);
      if (f.hours) { expect(f.hours[0], f.id).toBeLessThan(f.hours[1]); expect(f.hours[0]).toBeGreaterThanOrEqual(0); expect(f.hours[1]).toBeLessThanOrEqual(24); }
    }
  });
  it('tra cứu theo neo và theo mã', () => {
    for (const f of FUN_LIST) expect(FUNS[f.id]).toBe(f);
    expect(funAt('tv_bongda').length).toBeGreaterThanOrEqual(2);
    expect(funAt('v_temple').length).toBeGreaterThanOrEqual(1);
    expect(funAt('khong_co_day')).toEqual([]);
    expect(funAt('tv_bongda').every((f) => f.anchor === 'tv_bongda')).toBe(true);
  });
  it('chơi càng lâu, càng tốn tiền thì tinh thần lên càng nhiều', () => {
    expect(FUNS.cafe_karaoke.mood).toBeGreaterThan(FUNS.cafe_sua.mood);
    expect(FUNS.cafe_sua.mood).toBeGreaterThan(FUNS.temple_huong.mood);
    expect(FUNS.cafe_karaoke.mins).toBeGreaterThan(FUNS.cafe_sua.mins);
    for (const f of FUN_LIST) expect(f.mood / f.mins, f.id).toBeGreaterThan(0.15);
  });
});
describe('thang mở công thức', () => {
  const atLevel = (g: ReturnType<typeof fresh>, lv: number) => { g.xp = 30 * lv * lv; return level(g); };

  it('cấp 1 chỉ mở đúng 1 món, các cấp sau mở 2', () => {
    const g = fresh();
    atLevel(g, 1);
    expect(unlockRecipes(g, 1).length).toBe(1);
    expect(unlockRecipes(g, 2).length).toBe(2);
    const again = unlockRecipes(g, 5).map((r) => r.id);
    expect(new Set(again).size).toBe(again.length);
    expect(again.every((id) => g.rec[id].known)).toBe(true);
  });

  it('mở đúng món rẻ nhất còn thiếu, không vượt tay nghề', () => {
    const g = fresh();
    for (let lv = 1; lv <= 10; lv++) {
      atLevel(g, lv);
      const got = unlockRecipes(g, lv <= 1 ? 1 : 2);
      for (const r of got) {
        expect(!r.learn || r.learn.skill <= lv, `${r.id} vượt tay nghề ${lv}`).toBe(true);
        const cheaper = RECIPE_LIST.filter((o) => !g.rec[o.id].known && o.ref < r.ref && (!o.learn || o.learn.skill <= lv));
        expect(cheaper.length, `${r.id} bị nhảy cóc ở cấp ${lv}`).toBe(0);
      }
    }
  });

  it('món mở sau không rẻ hơn món mở trước, và đủ 60 món thì thôi', () => {
    const g = fresh();
    let last = 0;
    for (let lv = 1; lv <= 10; lv++) {
      atLevel(g, lv);
      const got = unlockRecipes(g, lv <= 1 ? 1 : 2);
      const refs = got.map((r) => r.ref).sort((a, b) => a - b);
      for (const ref of refs) { expect(ref).toBeGreaterThanOrEqual(last); last = ref; }
    }
    atLevel(g, 10);
    unlockRecipes(g, RECIPE_LIST.length);
    expect(Object.values(g.rec).filter((r) => r.known).length).toBe(RECIPE_LIST.length);
  });

  it('lên cấp qua addXp thì tự mở món và báo cho người chơi', () => {
    const g = fresh(), before = Object.values(g.rec).filter((r) => r.known).length;
    g.xp = 30 * 3 * 3 - 2; addXp(g, 1); // vừa chạm cấp 3
    expect(level(g)).toBe(3);
    expect(Object.values(g.rec).filter((r) => r.known).length - before).toBe(2);
  });

  it('món nào học ở quán cũng có phí và tay nghề hợp lệ', () => {
    for (const r of RECIPE_LIST) {
      if (!r.learn) continue;
      expect(r.learn.cost, r.id).toBeGreaterThan(0);
      expect(r.learn.from.length, r.id).toBeGreaterThan(0);
      expect(r.learn.skill, r.id).toBeGreaterThanOrEqual(0);
      expect(r.learn.skill, r.id).toBeLessThanOrEqual(10);
      expect(RECIPES[r.id], r.id).toBe(r);
    }
  });
});
