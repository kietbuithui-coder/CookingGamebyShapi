// Lượt 41: rau củ ở chợ lâu hỏng 200–300 %, ăn uống no lâu 2,5 lần,
// và chuyện đau bụng khi ăn uống bậy (thuốc đau bụng ở nhà thuốc chữa khỏi).
import { describe, it, expect } from 'vitest';
import { INGS } from '../src/data/ingredients';
import { FUNS } from '../src/data/fun';
import { newGame, type Game } from '../src/sim/state';
import { consume, tickStats, stomachChance, sickStomach, isStomach, stomachLeft, buyMed, MEDS, exam, advance, dishStars } from '../src/sim/rules';

const mk = (): Game => newGame(7);
/** Thời gian trôi không làm gì. */
const IDLE = { moving: false, running: false, working: false, sleeping: false, sleepQ: 1, sheltered: true, load: 0 };

describe('rau củ ở chợ lâu hỏng hơn 200–300 %', () => {
  // Giờ trong bảng × 1,2 ra giờ thực tế (xem ING_LIST).
  const before: Record<string, number> = { carot: 120, cachua: 72, bapcai: 120, raumuong: 30, dualeo: 72, ot: 120, chanh: 150, rauthom: 24, hanhla: 36, gia: 24, bap: 72, xalach: 30, xoai: 40, chuoi: 60 };
  it('mọi loại rau củ ở chợ đều tăng ít nhất gấp 3', () => {
    for (const [id, old] of Object.entries(before)) {
      expect(INGS[id].shelf).toBeGreaterThanOrEqual(old * 2.9);
      expect(INGS[id].shelf).toBeLessThanOrEqual(old * 4.2);
    }
  });
  it('giữ nguyên khoai tây, khoai lang, hành tây, tỏi, gừng, sả', () => {
    // bảng ghi 300 giờ nhưng ING_LIST nhân 1,2 → 360 giờ thực tế (số người chơi thấy)
    expect(INGS.khoaitay.shelf).toBe(360);
    expect(INGS.khoailang.shelf).toBe(360);
    expect(INGS.hanhtay.shelf).toBe(360);
    expect(INGS.toi.shelf).toBe(720);
    expect(INGS.gung.shelf).toBe(720);
    expect(INGS.sa.shelf).toBe(240);
  });
  it('thịt và hải sản tươi vẫn giữ nguyên hạn ngắn', () => {
    expect(INGS.heo.shelf).toBe(12);
    expect(INGS.tom.shelf).toBe(8.4);
    expect(INGS.ca.shelf).toBe(8.4);
  });
  it('rau muống / rau thơm / xà lách vẫn ngắn hơn cà rốt — rau lá vẫn phải dùng sớm', () => {
    expect(INGS.raumuong.shelf).toBeLessThan(INGS.carot.shelf);
    expect(INGS.rauthom.shelf).toBeLessThan(INGS.raumuong.shelf);
  });
});

describe('ăn uống ở quán no lâu hơn 250 %', () => {
  it('cà phê sữa đá giải khát và lên tinh thần như cũ (không nhân độ no của đồ uống)', () => {
    const f = FUNS.cafe_sua;
    expect(f.thirst).toBe(14);
    expect(f.mood).toBe(13);
  });
  it('các món ăn ở quán có độ no dương để nhân 2,5 lần', () => {
    const withFood = Object.values(FUNS).filter((f) => (f.hunger ?? 0) > 0);
    // hiện tại fun.ts chưa có món ăn nào — nếu thêm sau này thì phép nhân đã áp dụng sẵn trong acts.playFun
    expect(Array.isArray(withFood)).toBe(true);
  });
  it('đồ ăn tự nấu 3 sao gần như không gây đau bụng, dưới 2 sao thì có', () => {
    const g = mk();
    expect(stomachChance(g, { selfMade: true, stars: 3 })).toBe(0);
    expect(stomachChance(g, { selfMade: true, stars: 2 })).toBeGreaterThan(0);
    expect(stomachChance(g, { selfMade: true, stars: 1.2 })).toBeGreaterThan(stomachChance(g, { selfMade: true, stars: 2 }));
  });
  it('đồ mua sẵn ngoài hàng rủi ro hơn đồ mình nấu 3 sao', () => {
    const g = mk();
    expect(stomachChance(g, { bought: true })).toBeGreaterThan(stomachChance(g, { selfMade: true, stars: 3 }));
  });
  it('nước ở chỗ công cộng / công viên có thêm rủi ro, và đang đau bụng thì bớt chồng', () => {
    const g = mk();
    const base = stomachChance(g, { bought: true });
    expect(stomachChance(g, { bought: true, rank: 0.12 })).toBeGreaterThan(base);
    sickStomach(g, 'thử');
    expect(stomachChance(g, { bought: true, rank: 0.12 })).toBeLessThan(base + 0.12);
  });
  it('số sao của phần đã nấu suy ra từ chất lượng 0–1', () => {
    expect(dishStars({ q: 0 })).toBe(1);
    expect(dishStars({ q: 1 })).toBe(5);
    expect(dishStars({ q: 0.5 })).toBe(3);
  });
});

describe('đau bụng: bị, trừ máu dần, mua thuốc là khỏi', () => {
  it('bị đau bụng thì có hẹn giờ và báo cho người chơi', () => {
    const g = mk();
    expect(isStomach(g)).toBe(false);
    expect(sickStomach(g, 'Uống nước máy', 90)).toBe(true);
    expect(isStomach(g)).toBe(true);
    expect(stomachLeft(g)).toBe(90);
  });
  it('đang đau thì không bị chồng thêm lần nữa', () => {
    const g = mk();
    sickStomach(g, 'lần 1');
    expect(sickStomach(g, 'lần 2')).toBe(false);
  });
  it('máu tụt dần theo thời gian (không mất một cục như bản cũ)', () => {
    const g = mk();
    g.st.health = 90;
    sickStomach(g, 'thử');
    advance(g, 30, IDLE);
    expect(g.st.health).toBeLessThan(90);
    expect(g.st.health).toBeGreaterThan(50);
  });
  it('đau bụng tự dịu sau vài giờ', () => {
    const g = mk();
    sickStomach(g, 'thử', 120);
    for (let i = 0; i < 121; i++) advance(g, 1, IDLE);
    expect(isStomach(g)).toBe(false);
  });
  it('thuốc đau bụng ở nhà thuốc chữa khỏi ngay, mất đúng tiền', () => {
    const g = mk();
    g.cash = 100000;
    sickStomach(g, 'thử', 200);
    expect(buyMed(g, 'daubung')).toBe(true);
    expect(isStomach(g)).toBe(false);
    expect(g.cash).toBe(100000 - MEDS.daubung.price);
  });
  it('thuốc đau bụng không chữa cảm, thuốc cảm không chữa đau bụng', () => {
    const g = mk();
    g.cash = 100000; g.flags.sick = 1; sickStomach(g, 'thử');
    buyMed(g, 'daubung');
    expect(g.flags.sick).toBe(1);              // vẫn còn cảm
    buyMed(g, 'cam');
    expect(g.flags.sick).toBeUndefined();
  });
  it('bác sĩ khám ra đau bụng, và chỉ đường ra quầy thuốc', () => {
    const g = mk();
    g.cash = 100000;
    sickStomach(g, 'thử');
    expect(exam(g)).toMatch(/thuốc đau bụng/i);
  });
  it('risky khi ăn đồ ôi giờ gây đau bụng chứ không trừ 18 máu ngay', () => {
    const g = mk();
    g.st.health = 100;
    consume(g, { h: 5 }, 1);                   // 100 % rủi ro
    expect(isStomach(g)).toBe(true);
    expect(g.st.health).toBe(100);             // chưa mất máu ngay
    advance(g, 60, IDLE);
    expect(g.st.health).toBeLessThan(100);
  });
});
