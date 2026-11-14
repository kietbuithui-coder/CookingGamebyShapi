import { describe, it, expect } from 'vitest';
import { newGame } from '../src/sim/state';
import {
  fmtAc, consume, dishWindow, canWashDishes, finishDishes, DISH_MEAL_CHANCE,
  canLearnRecipes, hasStartedSelling, sackPay, chessOutcome, curbFineRisk, curbFineAmount,
} from '../src/sim/rules';
import {
  HEAT_STEAL, REP_STEAL_CAUGHT, REP_STEAL_ESCAPE, WANTED_ALERT,
  triggerShoplift, confiscateStolen, escapeShoplift, shouldStop,
} from '../src/sim/police';
import { SIDE, HELPER_POOL } from '../src/data/people';
import { SHOPS } from '../src/data/shops';
import { SPOTS } from '../src/world/layout';
import { bus } from '../src/core/bus';
import { RNG } from '../src/core/util';

describe('Round 17 — Xưng hô linh hoạt, việc làm thêm, hàng rong vỉa hè & ăn cắp', () => {
  it('fmtAc thay thế {ac} và {Ac} đúng theo giới tính người chơi, không còn chuỗi anh/chị cứng', () => {
    const gNam = newGame(1, 'anh');
    const gNu = newGame(1, 'chị');
    expect(gNam.ac).toBe('anh');
    expect(gNu.ac).toBe('chị');

    expect(fmtAc(SIDE.danh_giay.intro, gNam)).toContain('Anh ơi');
    expect(fmtAc(SIDE.danh_giay.intro, gNu)).toContain('Chị ơi');
    expect(fmtAc(SIDE.danh_giay.again, gNam)).toContain('Anh tới nữa hả');
    expect(fmtAc(SIDE.danh_giay.again, gNu)).toContain('Chị tới nữa hả');
    expect(fmtAc(SHOPS.mart.say, gNam)).toBe('Dạ, em chào anh ạ.');
    expect(fmtAc(SHOPS.mart.say, gNu)).toBe('Dạ, em chào chị ạ.');

    for (const h of HELPER_POOL) {
      const m = fmtAc(h.ask, gNam), f = fmtAc(h.ask, gNu);
      expect(m).not.toContain('{ac}');
      expect(m).not.toContain('{Ac}');
      expect(f).not.toContain('{ac}');
      expect(f).not.toContain('{Ac}');
    }
  });

  it('uống nước lã tại vòi nước công cộng báo đau bụng do nước lã chứ không báo ăn đồ ôi thiu', () => {
    const g = newGame(2);
    const msgs: string[] = [];
    bus.on('toast', (t: { text: string }) => msgs.push(t.text));
    consume(g, { t: 35 }, 1.0, 'Uống nước lã chưa đun — đau bụng quá!');
    expect(msgs).toContain('Uống nước lã chưa đun — đau bụng quá!');
    expect(msgs).not.toContain('Ăn đồ ôi thiu — đau bụng quá!');

    msgs.length = 0;
    consume(g, { h: 20 }, 1.0);
    expect(msgs).toContain('Ăn đồ ôi thiu — đau bụng quá!');
  });

  it('rửa chén quán Bà Tư: mỗi khung giờ (10h–14h30, 17h30–21h) chỉ rửa 1 lần và tỉ lệ nhỏ mới có cơm dư', () => {
    const g = newGame(3);
    g.min = 9 * 60; // 9:00 sáng — ngoài giờ
    expect(dishWindow(9)).toBe(0);
    expect(canWashDishes(g).ok).toBe(false);

    g.min = 11 * 60; // 11:00 trưa — ca 1
    expect(dishWindow(11)).toBe(1);
    expect(canWashDishes(g).ok).toBe(true);

    const r1 = finishDishes(g, 0.8, new RNG(101));
    expect(r1.pay).toBeGreaterThanOrEqual(24000);
    expect(g.wd.plates).toBe(1);
    // Vẫn trong ca trưa → không được rửa tiếp
    g.min = 12.5 * 60;
    expect(canWashDishes(g).ok).toBe(false);
    expect(canWashDishes(g).why).toContain('Ca trưa hôm nay rửa rồi');

    // Sang ca tối (18:00) → được rửa thêm 1 lần
    g.min = 18 * 60;
    expect(dishWindow(18)).toBe(2);
    expect(canWashDishes(g).ok).toBe(true);
    finishDishes(g, 0.9, new RNG(202));
    expect(g.wd.plates).toBe(2);
    expect(canWashDishes(g).ok).toBe(false);

    // Kiểm tra xác suất được cho cơm dư (~22%, không phải 100%)
    let meals = 0;
    const R = new RNG(777);
    for (let i = 0; i < 100; i++) {
      const gi = newGame(100 + i);
      gi.min = 11 * 60;
      if (finishDishes(gi, 0.8, R).meal) meals++;
    }
    expect(DISH_MEAL_CHANCE).toBeLessThan(0.5);
    expect(meals).toBeGreaterThan(5);
    expect(meals).toBeLessThan(45);
  });

  it('chỉ mở gợi ý học công thức và UI bán hàng sau khi bắt đầu có quầy', () => {
    const g = newGame(4);
    expect(g.stall.tier).toBe(0);
    expect(canLearnRecipes(g)).toBe(false);
    expect(hasStartedSelling(g)).toBe(false);

    g.stall.tier = 1;
    expect(canLearnRecipes(g)).toBe(true);
    expect(hasStartedSelling(g)).toBe(true);
  });

  it('mini-game bốc hàng và đánh cờ trả thưởng & kết quả hợp lý theo điểm số', () => {
    expect(sackPay(0)).toBe(6000);
    expect(sackPay(1)).toBe(9000);
    expect(sackPay(0.5)).toBeGreaterThan(6000);

    const win = chessOutcome(0.9);
    const draw = chessOutcome(0.6);
    const lose = chessOutcome(0.2);
    expect(win.result).toBe('win');
    expect(draw.result).toBe('draw');
    expect(lose.result).toBe('lose');
    expect(win.mood).toBeGreaterThan(draw.mood);
    expect(draw.mood).toBeGreaterThan(lose.mood);
  });

  it('có các vị trí vỉa hè miễn phí cho gánh hàng rong nhưng có nguy cơ bị phạt lấn chiếm vỉa hè', () => {
    const curbSpots = SPOTS.filter((s) => s.fee === 0 && (s.curbRisk ?? 0) > 0);
    expect(curbSpots.length).toBeGreaterThanOrEqual(3);
    for (const sp of curbSpots) {
      expect(sp.minTier).toBe(1);
      expect(sp.maxTier).toBe(2);
    }

    const g = newGame(5);
    g.stall.tier = 1;
    g.stall.where = 'placed';
    g.stall.spot = curbSpots[0].id;
    g.stall.open = false;
    expect(curbFineRisk(g)).toBe(0);

    g.stall.open = true;
    expect(curbFineRisk(g)).toBeGreaterThan(0.15);
    expect(curbFineAmount(g)).toBe(35000);

    // Chỗ hợp thức có đóng phí thì không bị phạt lấn chiếm vỉa hè
    g.stall.spot = 'cho';
    expect(curbFineRisk(g)).toBe(0);
  });

  it('cơ chế ăn cắp: bỏ đi khi chưa tính tiền bị công an rượt, bị bắt thì tịch thu, trốn thoát thì giữ hàng nhưng giảm nặng uy tín', () => {
    // Trường hợp 1: Bị bắt → tịch thu đồ ăn cắp, giữ nguyên đồ mua hợp pháp
    const g1 = newGame(6);
    g1.rep = 30;
    g1.bag.push({ id: 'gao', n: 2, fresh: 95, q: 0.9, cost: 12000 }); // đồ đã mua
    const cnt = triggerShoplift(g1, 'm_thit', [
      { id: 'heo', n: 2, fresh: 90, q: 0.9 },
      { id: 'bo', n: 1, fresh: 90, q: 0.9 },
    ]);
    expect(cnt).toBe(3);
    expect(g1.wanted).toBeGreaterThanOrEqual(HEAT_STEAL);
    expect(shouldStop(g1)).toBe(true);
    expect(g1.bag.filter((s) => s.stolen).length).toBe(2);

    const removed = confiscateStolen(g1);
    expect(removed).toBe(3);
    expect(g1.bag.some((s) => s.stolen)).toBe(false);
    expect(g1.bag.find((s) => s.id === 'gao')?.n).toBe(2);
    expect(g1.rep).toBe(30 - REP_STEAL_CAUGHT);

    // Trường hợp 2: Trốn thoát → giữ được đồ nhưng danh tiếng giảm nặng
    const g2 = newGame(7);
    g2.rep = 40;
    triggerShoplift(g2, 'mart', [{ id: 'suatuoi', n: 3, fresh: 95, q: 0.96 }]);
    const esc = escapeShoplift(g2);
    expect(esc.kept).toBe(3);
    expect(esc.repDrop).toBe(REP_STEAL_ESCAPE);
    expect(g2.rep).toBe(40 - REP_STEAL_ESCAPE);
    expect(g2.bag.find((s) => s.id === 'suatuoi')?.n).toBe(3);
    expect(g2.bag.some((s) => s.stolen)).toBe(false);
    expect(g2.wanted).toBeLessThan(WANTED_ALERT);
  });
});
