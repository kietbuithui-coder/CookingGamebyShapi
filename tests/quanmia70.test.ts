// Quán Nước Mía 3K — hai chỗ người chơi chỉ ra bằng ảnh (bổ sung trong lượt 70):
//   "tấm bảng … ở trong chưa có bàn ghế" ⇒ (1) bàn ghế phải ở TRƯỚC quầy, (2) bảng giá phải dính vách.
// Dự án không dựng được cảnh 3D trong vitest nên phần bố cục kiểm bằng nội dung tệp nguồn (cách làm của
// `tests/nghi55.test.ts`): đọc `src/world/mia.ts` rồi soi đúng những con số đã chốt.
import { describe, it, expect } from 'vitest';
import miaSrc from '../src/world/mia.ts?raw';

/** Lấy đoạn nguồn của `buildMiaShop` — chỉ soi trong hàm này, không lẫn với xe mía. */
const shopBody = (() => {
  const m = miaSrc.match(/export function buildMiaShop\([\s\S]*$/);
  expect(m, 'không thấy buildMiaShop()').toBeTruthy();
  return m![0];
})();

describe('quán nước mía: bàn ghế ở trước quầy (lượt 70)', () => {
  it('bàn đặt ở phía TRƯỚC quầy, không phải sau lưng chủ quán', () => {
    // tz = min(qz − 1,75; 1,35) ⇒ z bàn luôn NHỎ hơn z quầy (z nhỏ = về phía mặt tiền)
    expect(shopBody).toMatch(/const tz = Math\.min\(qz - 1\.75, 1\.35\)/);
    expect(shopBody).toContain('plasticTable(D, bx, 0.13, tz, col)');
    // Bản lượt 70 đặt bàn ở `qz + 1,15` / `qz + 1,35` (sau quầy) — không được quay lại.
    expect(shopBody).not.toMatch(/plasticTable\(D, bx, 0\.13, qz \+/);
  });

  it('mỗi bàn có ghế xếp quanh bàn và ly đặt đúng mặt bàn', () => {
    const stools = shopBody.match(/plasticStool\(D, bx[^)]*\)/g) ?? [];
    expect(stools.length).toBeGreaterThanOrEqual(3);
    // mặt bàn nhựa cao 0,13 + 0,55 = 0,68 m ⇒ ly đặt ở 0,70 chứ không lơ lửng ở 0,86 như bản nháp.
    expect(shopBody).toMatch(/D\.cyl\(bx - 0\.16 \+ i \* 0\.3, 0\.70, tz - 0\.1/);
  });

  it('hai bàn dạt hai bên, chừa lối đi ở giữa cho khách vào tới quầy', () => {
    const m = shopBody.match(/for \(const \[bx, col\] of \[\[([\d.]+), RED\], \[w - ([\d.]+), BLUE\]\]/);
    expect(m, 'không thấy vòng lặp kê hai bàn hai bên').toBeTruthy();
    const side = Number(m![1]);
    expect(side).toBeGreaterThan(0.8);
    expect(side).toBeLessThan(1.2);
    expect(Number(m![2])).toBe(side);
  });
});

describe('quán nước mía: bảng giá dính vách (lượt 70)', () => {
  it('bảng giá áp sát vách trái và quay mặt vào trong', () => {
    const m = shopBody.match(/b\.signAt\(([\d.]+), ([\d.]+), qz - [\d.]+, ([\d.]+), ([\d.]+), 'BẢNG GIÁ'[^;]*?, ([-1]+), ([-01]+),/);
    expect(m, 'không thấy signAt BẢNG GIÁ').toBeTruthy();
    const [x, y, w, h, nx, nz] = m!.slice(1).map(Number);
    // vách trái của lô nằm ở x = 0,15 → áp vách thì tâm bảng phải sát đó (nửa bề ngang + khe hở).
    expect(x).toBeLessThan(w / 2 + 0.35);
    expect(nx).toBe(1); expect(nz).toBe(0);
    // trên mặt quầy (0,97 m) nên không bị máy ép / két nước che, mà vẫn dưới mái hiên.
    expect(y).toBeGreaterThan(1.2);
    expect(y + h).toBeLessThan(2.5);
    expect(w).toBeGreaterThan(1.6);
  });

  it('không còn tấm biển nào treo lơ lửng giữa quán', () => {
    // Bản lượt 70: signAt(0,9; 2,1; qz − 0,9) — cách vách 0,75 m, cách quầy gần 1 m.
    expect(shopBody).not.toMatch(/signAt\(0\.9, 2\.1, qz - 0\.9/);
    // và cũng không treo bằng dây thép hay cắm đứng trên mặt quầy (hai phương án đã thử rồi bỏ).
    expect(shopBody).not.toMatch(/D\.rod\(w \/ 2 \+ dx, 2\.18/);
  });
});
