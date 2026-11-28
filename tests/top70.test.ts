// Người chơi (bổ sung lượt 70): “vẽ lại khoai lang và xúc xích cho chuẩn, rework mini game bánh tráng trộn
// cho chuẩn (khối vuông thả xuống quá xấu)”.
//   • khoai lang & xúc xích trước đây dùng chung hình 'long' (một khúc trụ tròn) ⇒ đổi sang hình riêng.
//   • mini-game: topping trên đĩa và mẩu bay vào hộp phải là ĐỒ ĂN THẬT, không phải gói/hộp/khối hộp.
// vitest không dựng được cảnh 3D nên phần hình khối kiểm bằng nội dung tệp nguồn (cách làm của `tests/banh54.test.ts`).
import { describe, it, expect } from 'vitest';
import { INGS } from '../src/data/ingredients';
import propsSrc from '../src/gfx/props.ts?raw';
import gamesSrc from '../src/cook/games.ts?raw';

describe('khoai lang & xúc xích có hình riêng (lượt 70)', () => {
  it('hai nguyên liệu không còn mượn hình “long” của cà rốt / dưa leo / sả', () => {
    expect(INGS.khoailang.shape).toBe('sweetpotato');
    expect(INGS.xucxich.shape).toBe('sausage');
    for (const other of ['carot', 'dualeo', 'sa', 'mia'] as const) expect(INGS[other].shape, other).not.toBe(INGS.khoailang.shape);
  });

  it('mỗi hình mới có nhánh vẽ riêng trong props.ts', () => {
    expect(propsSrc).toMatch(/case 'sweetpotato': \{/);
    expect(propsSrc).toMatch(/case 'sausage': \{/);
    // Xúc xích: hai đầu bấm kẹp + nếp gấp ngang trên vỏ (không phải khúc trụ trơn).
    const sausage = propsSrc.slice(propsSrc.indexOf("case 'sausage': {"), propsSrc.indexOf("case 'leafy'") + 400);
    expect(sausage).toMatch(/đầu bấm kẹp/i);
    expect(sausage).toMatch(/nếp gấp ngang/i);
    // Khoai lang: MỘT khối liền có bụng phình + hai đầu lộ ruột vàng, không ghép ba cục tròn.
    const sweet = propsSrc.slice(propsSrc.indexOf("case 'sweetpotato': {"), propsSrc.indexOf("case 'sausage': {"));
    expect(sweet).toMatch(/bụng phình/);
    expect(sweet).toMatch(/mb\.rod\(/);
    expect((sweet.match(/mb\.sph\(/g) ?? []).length).toBeLessThan(6);   // không còn ghép chùm elipxoit
  });

  it('trên vỉ nướng, món dài được xếp rộng hơn và xoay mỗi cái một góc riêng', () => {
    expect(gamesSrc).toMatch(/const long = \['sweetpotato', 'sausage', 'long', 'corn'\]\.includes\(d\.shape\), gap = long \? 0\.15 : 0\.115/);
    expect(gamesSrc).toMatch(/const tilt = Math\.PI \/ 2 \+ /);
  });
});

describe('bánh tráng trộn: topping là đồ ăn thật (lượt 70)', () => {
  const tron = gamesSrc.slice(gamesSrc.indexOf('export class TronGame'), gamesSrc.indexOf('// ───────────────────────── Việc làm thêm'));

  it('không còn gọi ingModel nguyên con cho từng topping (gói đậu phộng = cả cái hộp nâu)', () => {
    expect(tron).not.toMatch(/ingModel\(im, INGS\[l\.ing\]/);
    expect(tron).toMatch(/private topping\(top: THREE\.Group, ing: string, look: string, c: number\)/);
    for (const look of ['nest', 'sprinkle', 'greens', 'drizzle']) expect(tron, look).toContain(`case '${look}'`);
  });

  it('rau thơm bày thành ngọn có lá + cuống, chanh là lát mỏng nhiều múi', () => {
    expect(tron).toMatch(/BA NGỌN RAU/);
    expect(tron).toMatch(/cuống non/);
    expect(tron).toMatch(/6 múi|vành mỏng/);
  });

  it('mẩu bay vào hộp mang đúng hình của thứ đang gắp, không phải một khối chung', () => {
    const take = tron.slice(tron.indexOf('private takeBit('), tron.indexOf('private penalty('));
    for (const g of ['GEO.box', 'GEO.disc', 'GEO.sph']) expect(take, g).toContain(g);
    expect(take).toMatch(/l\.look === 'greens'/);
    expect(take).toMatch(/l\.ing === 'chanh'/);
    // mẩu không teo quá nhanh khi bay (trước đây nhỏ còn 65 % nên nhìn như hạt bụi rơi)
    expect(tron).toMatch(/1 - k \* 0\.2/);
  });
});
