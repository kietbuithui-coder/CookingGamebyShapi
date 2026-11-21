// Lượt 54: tiệm bánh (đổi tên từ "Lò bánh mì") bán thêm 5 loại bánh sẵn — no và vui theo giá;
// nước tăng lực Shapi bán ở MiniMart 24h và Tạp hoá Cô Ba, uống là hồi 30 % thanh thể lực.
import { describe, it, expect } from 'vitest';
import { INGS } from '../src/data/ingredients';
import { SHOPS } from '../src/data/shops';
import { RECIPE_LIST } from '../src/data/recipes';
import * as R from '../src/sim/rules';
import { fresh } from './helpers';

/** Bánh mới của lượt 54, kèm giá gốc để canh luật "no/vui theo giá". */
const CAKES = ['banhmique', 'banhtieu', 'banhbao', 'banhsu', 'banhbonglan'] as const;

describe('tiệm bánh có thêm bánh bán sẵn (lượt 54)', () => {
  it('tiệm bánh đã đổi tên và bán 6 loại (bánh mì + 5 loại mới)', () => {
    const b = SHOPS.bakery;
    expect(b.name).toBe('Tiệm bánh Anh Bảo');
    expect(b.items).toEqual(['banhmi', ...CAKES]);
    for (const id of b.items) expect(INGS[id], id).toBeDefined();
  });

  it('bánh mới chỉ BÁN SẴN — không có công thức nào dùng chúng (đúng yêu cầu "không tự làm")', () => {
    for (const id of CAKES) {
      for (const r of RECIPE_LIST) {
        expect(Object.keys(r.ings), `${r.id} dùng ${id}`).not.toContain(id);
      }
    }
  });

  it('bánh là đồ ăn liền: bấm Ăn được ngay trong túi, có hạn dùng thật', () => {
    for (const id of CAKES) {
      expect(INGS[id].eat, id).toBeDefined();
      expect(INGS[id].shelf, id).toBeGreaterThan(0);
      expect(INGS[id].shelf, id).toBeLessThan(1000);       // không phải loại để được mãi
    }
  });

  it('bánh đắt thì no hơn và vui hơn: no/vui tăng đều theo giá', () => {
    const list = [...CAKES].map((id) => ({ id, price: INGS[id].price, h: INGS[id].eat!.h!, m: INGS[id].eat!.m! }))
      .sort((a, b) => a.price - b.price);
    for (let i = 1; i < list.length; i++) {
      expect(list[i].price, list[i].id).toBeGreaterThan(list[i - 1].price);
      expect(list[i].h, `${list[i].id} no`).toBeGreaterThan(list[i - 1].h);
      expect(list[i].m, `${list[i].id} vui`).toBeGreaterThan(list[i - 1].m);
    }
    // đúng tỉ lệ đã ghi trong ingredients.ts: ~1,6 no và 0,5 vui cho mỗi 1.000₫
    for (const c of list) {
      expect(Math.abs(c.h - c.price / 1000 * 1.6), `${c.id} no theo giá`).toBeLessThanOrEqual(1.5);
      expect(Math.abs(c.m - c.price / 1000 * 0.5), `${c.id} vui theo giá`).toBeLessThanOrEqual(0.6);
    }
    // và bánh đắt nhất phải no hơn hẳn ổ bánh mì rẻ nhất
    const big = list[list.length - 1], mi = INGS.banhmi;
    expect(big.h).toBeGreaterThan(mi.eat!.h!);
    expect(big.m).toBeGreaterThan(mi.eat!.m!);
  });
});

describe('nước tăng lực Shapi (lượt 54)', () => {
  it('bán ở MiniMart 24h và Tạp hoá Cô Ba, giá gốc 9.000₫', () => {
    expect(SHOPS.mart.items).toContain('shapi');
    expect(SHOPS.kiosk.items).toContain('shapi');
    expect(INGS.shapi.price).toBe(9000);
    expect(INGS.shapi.name).toBe('Nước tăng lực Shapi');
    expect(INGS.shapi.cat).toBe('drink');
  });

  it('uống là hồi 30 % thanh thể lực và vẫn đỡ khát như nước ngọt', () => {
    expect(INGS.shapi.eat!.st).toBeCloseTo(0.3, 5);
    expect(INGS.shapi.eat!.t).toBeGreaterThanOrEqual(INGS.nuocngot.eat!.t!);
  });

  it('hồi đúng 30 % khi thanh đang thấp, không vượt trần khi gần đầy', () => {
    expect(R.staminaAfter(0.1, 1, 0.3)).toBeCloseTo(0.4, 5);
    expect(R.staminaAfter(0.85, 1, 0.3)).toBe(1);
    expect(R.staminaAfter(0.9, 0.6, 0.3)).toBeCloseTo(0.6, 5);   // trần thấp (đang đói) vẫn tôn trọng
    expect(R.staminaGain(-1)).toBe(0);                            // không có chuyện hồi âm
    expect(R.staminaGain(2)).toBe(1);
  });

  it('uống Shapi giúp chạy lâu hơn hẳn: thanh 0,1 chạy được thêm ~2 giây', () => {
    const g = fresh(); g.st.health = 90; g.st.energy = 90;
    const before = R.staminaAfter(0.1, 1, 0);
    const after = R.staminaAfter(0.1, 1, INGS.shapi.eat!.st!);
    const secs = (v: number) => v / R.staminaDrain(g);
    expect(secs(after) - secs(before)).toBeGreaterThan(1.5);
  });
});
