// Lượt 56: Bà Chín Ve Chai có nước da rám nắng riêng (trước đây lấy màu da sáng nhất trong bảng).
// Bảng da của NPC cố định chỉ có 5 màu và chọn theo công thức, nên muốn "đen một tí" thì phải cho phép khai riêng.
import { describe, it, expect } from 'vitest';
import { FIXED } from '../src/data/people';
import { SKINS } from '../src/gfx/people';
import peopleRaw from '../src/gfx/people.ts?raw';

const lum = (c: number) => 0.2126 * ((c >> 16) & 255) + 0.7152 * ((c >> 8) & 255) + 0.0722 * (c & 255);

describe('mặt Bà Chín Ve Chai (lượt 56)', () => {
  it('có màu da riêng, không rơi vào màu sáng nhất của bảng', () => {
    const skin = FIXED.scrap2.skin;
    expect(skin, 'Bà Chín chưa khai màu da riêng').toBeTypeOf('number');
    const brightest = Math.max(...SKINS.map(lum));
    expect(lum(skin!)).toBeLessThan(lum(SKINS[0]));
    expect(lum(skin!)).toBeLessThan(brightest - 60);   // phải tối hơn hẳn, không phải nhích một chút
  });

  it('vẫn là da người, không phải da xám hay da tái', () => {
    const s = FIXED.scrap2.skin!;
    const r = (s >> 16) & 255, g = (s >> 8) & 255, b = s & 255;
    expect(r).toBeGreaterThan(g);        // đỏ > lục: tông da ấm
    expect(g).toBeGreaterThan(b);        // lục > lam
    expect(r - b).toBeGreaterThan(60);   // đủ ngả nâu, không bị xám
  });

  it('chỉ những người làm nghề ngoài nắng mới có màu da riêng — không lây sang người khác', () => {
    const withSkin = Object.values(FIXED).filter((f) => f.skin !== undefined).map((f) => f.id);
    // Bà Chín ve chai (lượt 56) + Chú Ba xe ôm (lượt 66: chạy xe ngoài đường cả ngày, da ngăm)
    // + Anh Sáu Lực cai công trình (lượt 69: đứng ngoài nắng cả ngày ở công trường).
    expect(withSkin.sort()).toEqual(['chu_ba', 'scrap2', 'site']);
  });

  it('màu da khai riêng thắng công thức chọn da của bảng', () => {
    expect(peopleRaw).toMatch(/skin: f\.skin \?\? SKINS\[/);
  });
});
