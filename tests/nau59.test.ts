// Lượt 59 (hotfix): mọi mini game nấu nướng phải nhận tay ở ĐÚNG độ cao mà đồ vật nằm.
//
// Lỗi gốc: `Cook.local()` chỉ cắt tia chạm ở MỘT mặt phẳng `mini.planeH`. Ở nồi nấu, `planeH` là MẶT NƯỚC
// (0,355 m) trong khi chén nguyên liệu nằm trên MẶT BÀN (~0,03 m) ⇒ chạm đúng chén lại ra toạ độ lệch 0,21 m,
// gấp đôi bán kính ăn 0,11 m, nên không món nào nấu/ninh/luộc/pha cho được nguyên liệu vào nồi.
// Nay mỗi lớp khai thêm các độ cao khác (`Mini.planes`) và tự chọn điểm (`Mini.pickPoint`).
import { describe, it, expect } from 'vitest';
// @ts-expect-error — bài kiểm thử chạy trên Node; dự án không cài @types/node cho phần game
import { readFileSync } from 'node:fs';
import { RECIPE_LIST } from '../src/data/recipes';
import type { CutStep, FryStep, GrillStep, BoilStep, AssembleStep, TronStep } from '../src/data/recipes';

const src = readFileSync(new URL('../src/cook/games.ts', import.meta.url), 'utf8');
const cook = readFileSync(new URL('../src/cook/cook.ts', import.meta.url), 'utf8');
/** Lấy đúng thân một lớp mini game (cắt theo `export class …` kế tiếp). */
const cls = (name: string) => {
  const i = src.indexOf(`export class ${name} implements Mini`);
  expect(i, name).toBeGreaterThan(0);
  const j = src.indexOf('export class ', i + 10);
  return src.slice(i, j > 0 ? j : src.length);
};

describe('tia chạm của bàn nấu ăn', () => {
  it('Cook.local cắt tia ở nhiều độ cao và để lớp game tự chọn điểm', () => {
    expect(cook).toMatch(/planes\?: number\[\]/);
    expect(cook).toMatch(/pickPoint\?\(/);
    expect(cook).toMatch(/for \(const h of \[this\.mini\.planeH, \.\.\.\(this\.mini\.planes \?\? \[\]\)\]\)/);
    // mặc định vẫn là mặt phẳng chính (không đổi hành vi của lớp không khai pickPoint)
    expect(cook).toContain('this.mini.pickPoint?.(list) ?? list[0].p');
  });

  it('nồi nấu: nhận tay ở cả mặt bàn (chén) lẫn mặt nước (vớt bọt), và lúc cho nguyên liệu thì cắt ở mặt bàn', () => {
    const f = cls('BoilGame');
    expect(f).toMatch(/planes: number\[\] = \[0\.03\]/);
    expect(f).toContain('pickPoint');
    // giai đoạn 'add' phải trả về ứng viên THẤP NHẤT (mặt bàn), không phải mặt nước
    expect(f).toMatch(/if \(this\.phase === 'add'\) return list\.reduce\(\(a, b\) => \(b\.h < a\.h \? b : a\)\)\.p/);
  });

  it('mặt phẳng chính của nồi vẫn là mặt nước để bong bóng/vớt bọt đúng chỗ', () => {
    const f = cls('BoilGame');
    expect(f).toContain('this.planeH = this.surf');
    expect(f).toContain('this.surf = top + 0.155');
  });

  it('mọi lớp mini game đều khai planeH và không lớp nào khai độ cao âm (tay luôn ở trên bàn)', () => {
    for (const name of ['CutGame', 'FryGame', 'GrillGame', 'BoilGame', 'AssembleGame', 'TronGame', 'WashGame']) {
      const f = cls(name);
      const m = f.match(/planeH = (-?[\d.]+)/);
      expect(m, name).toBeTruthy();
      expect(Number(m![1]), name).toBeGreaterThanOrEqual(0);
    }
  });

  it('các lớp cắt thái / trình bày / rửa chén / trộn: mặt phẳng chính nằm sát đồ vật (≤ 6 cm)', () => {
    for (const name of ['CutGame', 'AssembleGame', 'TronGame', 'WashGame']) {
      const m = cls(name).match(/planeH = (-?[\d.]+)/)!;
      expect(Number(m[1]), name).toBeLessThanOrEqual(0.06);
    }
  });

  it('mọi công thức có bước nấu/ninh/luộc/pha đều đi qua BoilGame (nên đều được sửa)', () => {
    const boil: string[] = [];
    for (const r of RECIPE_LIST) {
      for (const s of [...r.prep, ...r.finish]) if ((s as BoilStep).t === 'boil') boil.push(r.id);
    }
    expect(boil.length).toBeGreaterThan(10);
    expect(new Set(boil).size).toBeGreaterThan(10);
    // và mọi bước cần tay đều thuộc một lớp có mặt trong games.ts
    const kinds = new Set<string>();
    for (const r of RECIPE_LIST) for (const s of [...r.prep, ...r.finish]) kinds.add(s.t);
    for (const k of kinds) expect(['cut', 'fry', 'grill', 'boil', 'assemble', 'tron'], k).toContain(k);
  });
});
