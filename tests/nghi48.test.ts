// Lượt 48 — ba việc người chơi nhờ:
//   1. "ngủ ở bệnh viện, khách sạn và trọ… đồ ăn, nước chỉ số tụt á sẽ giảm đi đáng kể (không tụt nhiều)"
//   2. "tăng nhẹ hiệu quả nghỉ ở ghế đá"
//   3. "làm lại 2 biển chỗ thuê đang sai giá"
import { describe, it, expect } from 'vitest';
import { newGame } from '../src/sim/state';
import { tickStats, Activity } from '../src/sim/rules';
import { HOUSING } from '../src/data/gear';
import { SPOTS } from '../src/world/layout';
import cityRaw from '../src/world/city.ts?raw';
import actsRaw from '../src/game/acts.ts?raw';
import placesRaw from '../src/world/places.ts?raw';

/** Ngủ 8 tiếng (480 phút game) ở một chỗ, trả về mức tụt chỉ số. */
function sleepDrain(id: string) {
  const g = newGame(7, 'anh');
  g.weather.now = 'nang'; g.st.hunger = 60; g.st.thirst = 60;
  const a: Activity = { moving: false, running: false, sleeping: true, sheltered: true, working: false, load: 0, sleepQ: HOUSING[id].sleep };
  const h0 = g.st.hunger, t0 = g.st.thirst, e0 = g.st.energy;
  for (let i = 0; i < 480; i++) tickStats(g, 1, a);
  return { hunger: h0 - g.st.hunger, thirst: t0 - g.st.thirst, energy: g.st.energy - e0 };
}

describe('ngủ ở chỗ tử tế thì đói/khát tụt ít hơn hẳn (lượt 48)', () => {
  it('khách sạn: đói và khát tụt ít hơn gầm cầu/ghế đá rõ rệt', () => {
    const ks = sleepDrain('khachsan'), ghe = sleepDrain('ghe');
    expect(ks.hunger).toBeLessThan(ghe.hunger * 0.6);   // đo được: 6,2 so với 13,4
    expect(ks.thirst).toBeLessThan(ghe.thirst * 0.6);   // đo được: 8,3 so với 17,9
  });

  it('phòng trọ, nhà nghỉ, căn hộ cũng giảm đáng kể', () => {
    const ghe = sleepDrain('ghe');
    for (const id of ['tro', 'nhanghi', 'canho', 'nharieng']) {
      const d = sleepDrain(id);
      expect(d.hunger, id).toBeLessThan(ghe.hunger * 0.8);
      expect(d.thirst, id).toBeLessThan(ghe.thirst * 0.8);
    }
  });

  it('vẫn tụt chút ít chứ không đứng im (không thành bất tử)', () => {
    for (const id of ['khachsan', 'tro', 'nhanghi']) {
      const d = sleepDrain(id);
      expect(d.hunger, id).toBeGreaterThan(1);
      expect(d.thirst, id).toBeGreaterThan(1);
    }
  });

  it('năng lượng vẫn hồi theo chất lượng chỗ ngủ như trước', () => {
    expect(sleepDrain('khachsan').energy).toBeGreaterThan(sleepDrain('ghe').energy);
    expect(sleepDrain('ghe').energy).toBeGreaterThan(0);
  });
});

describe('nghỉ ở ghế đá hiệu quả hơn một chút (lượt 48)', () => {
  it('tinh thần +9 và năng lượng +6 (trước là +7 / +4)', () => {
    const m = actsRaw.match(/rest\(\)[\s\S]{0,400}?R\.consume\(g, \{([^}]*)\}\)/);
    expect(m, 'không tìm thấy hàm rest()').toBeTruthy();
    expect(m![1]).toMatch(/m:\s*9/);
    expect(m![1]).toMatch(/e:\s*6/);
  });

  it('lời mời tương tác ghi đúng con số mới', () => {
    expect(actsRaw).not.toContain('tinh thần +7');
  });
});

describe('mọi biển "CHỖ BÁN HÀNG" đọc giá từ SPOTS, không ghi cứng (lượt 48)', () => {
  it('không còn giá cũ 30.000 / 20.000 trong biển', () => {
    expect(cityRaw).not.toContain('Phí chỗ 30.000');
    expect(cityRaw).not.toContain('Phí chỗ 20.000');
  });

  it('biển dùng hàm feeText và lấy phí từ chỗ bán thật', () => {
    const signs = cityRaw.match(/signAt\([^;]*CHỖ BÁN HÀNG[^;]*/g) ?? [];
    expect(signs.length).toBe(2);
    for (const s of signs) expect(s).toContain('feeText(sp.fee)');
    expect(cityRaw).toContain("toLocaleString('vi-VN')");
  });

  it('giá trên biển khớp phí thật trong game: chợ 18.000, công viên 12.000', () => {
    const fee = (id: string) => SPOTS.find((s) => s.id === id)!.fee;
    const text = (n: number) => `Phí chỗ ${n.toLocaleString('vi-VN')}₫/ngày`;
    expect(text(fee('cho'))).toBe('Phí chỗ 18.000₫/ngày');
    expect(text(fee('cv'))).toBe('Phí chỗ 12.000₫/ngày');
  });

  it('biển ở Phố Văn Phòng / Hẻm cũng đọc phí từ SPOTS, không ghi cứng 60.000', () => {
    expect(placesRaw).not.toContain("'Phí chỗ 60.000₫/ngày'");
    expect(placesRaw).toContain('SPOTS.find((q) => q.id === l.id)?.fee');
    expect(placesRaw).toContain("'Hẻm Công Nhân — tự do'");
  });

  it('phí chỗ thật vẫn đúng sau khi sửa biển', () => {
    expect(SPOTS.find((s) => s.id === 'cho')!.fee).toBe(18000);
    expect(SPOTS.find((s) => s.id === 'cv')!.fee).toBe(12000);
  });
});
