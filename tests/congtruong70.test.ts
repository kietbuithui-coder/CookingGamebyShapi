// Công trường: người chơi chỉ đúng ảnh chụp và bảo "bỏ mái che bạc xanh chỗ này" (bổ sung lượt 70).
// Ảnh cho thấy tấm bạt sọc xanh–trắng kiểu mái hiên quán ăn mọc giữa công trường. Kiểm bằng nội dung tệp nguồn.
import { describe, it, expect } from 'vitest';
import placesSrc from '../src/world/places.ts?raw';

const siteBody = (() => {
  const m = placesSrc.match(/case 'site': \{[\s\S]*?for \(let i = 0; i < 4; i\+\+\) for \(let j = 0; j < 3; j\+\+\) L\.box/);
  expect(m, "không thấy nhánh case 'site'").toBeTruthy();
  return m![0];
})();

describe('công trường: đã dỡ mái bạt', () => {
  it('chòi tuyển thợ không còn gọi b.awning ⇒ không còn vệt sọc xanh–trắng', () => {
    expect(siteBody).not.toMatch(/b\.awning\(/);
    expect(siteBody).not.toMatch(/0x2f6fa8/);      // xanh bạt cũ
    expect(siteBody).not.toMatch(/0xdfe9f7/);      // sọc trắng cũ
  });

  it('bảng “TUYỂN PHỤ HỒ” dán lên vách rào xanh thay vì treo dưới mép bạt', () => {
    const m = siteBody.match(/b\.signAt\(cx, ([\d.]+), ([\d.]+), 2\.2, ([\d.]+), 'TUYỂN PHỤ HỒ'/);
    expect(m, 'không thấy bảng TUYỂN PHỤ HỒ').toBeTruthy();
    const [y, z, h] = m!.slice(1).map(Number);
    expect(z).toBeLessThan(0.3);                  // sát vách rào (vách ở z = 0,1)
    expect(y).toBeGreaterThan(1.2);               // ngang tầm mắt người đứng ngoài
    expect(y + h).toBeLessThan(2.2);
  });
});
