// App "Quản lý cửa hàng" trên điện thoại: xem quầy chính + chi nhánh, bật/tắt bán từ xa, cảnh báo bán lỗ.
import { describe, it, expect } from 'vitest';
import { shopRows, setShopOpen, lossDishes, openBranch, hireKeeper, moveToBranch, menuOf, suggestPrice } from '../src/sim/rules';
import { RECIPES } from '../src/data/recipes';
import { appsOf, PHONES, PHONE_APPS } from '../src/data/phone';
import { fresh, give } from './helpers';

/** Dựng một quán đang bán được: bậc 7, đủ đồ nghề, có nguyên liệu, có phần sẵn trên khay. */
function shop() {
  const g = fresh();
  g.stall.tier = 7; g.stall.where = 'placed'; g.stall.spot = 'cho'; g.cash = 5000000;
  // đồ nghề để món "bán được" (menuOf lọc theo missingTools)
  for (const id of ['daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas']) g.gear[id] = 100;
  give(g, 'gao', 20); give(g, 'thit', 20);
  g.rec.com_suon.known = true; g.rec.com_suon.on = true; g.rec.com_suon.price = suggestPrice(g, RECIPES.com_suon);
  g.rec.tra_da.known = true; g.rec.tra_da.on = true; g.rec.tra_da.price = 8000;
  g.stall.ready = [
    { rid: 'com_suon', n: 4, q: 1, at: 0, cost: 12000 },
    { rid: 'tra_da', n: 1, q: 1, at: 0, cost: 3000 },
  ];
  return g;
}

describe('app Quản lý cửa hàng trên điện thoại', () => {
  it('máy nào cũng có app Cửa hàng, kể cả cục gạch rẻ nhất', () => {
    for (const p of Object.values(PHONES)) expect(appsOf(p).some((a) => a.id === 'shop')).toBe(true);
    expect(PHONE_APPS.find((a) => a.id === 'shop')!.short.length).toBeLessThanOrEqual(9);
  });

  it('không có chi nhánh thì chỉ hiện quầy chính, kèm số phần và số món', () => {
    const g = shop();
    const rows = shopRows(g);
    expect(rows.length).toBe(1);
    const m = rows[0];
    expect(m.id).toBe('main');
    expect(m.stock).toBe(5);
    expect(m.kinds).toBe(2);
    expect(m.low).toBe(1);            // trà đá còn đúng 1 phần
    expect(m.revenue).toBe(g.led.revenue);
    expect(m.hint.length).toBeGreaterThan(5);
  });

  it('bật/tắt bán từ điện thoại: quầy chính và chi nhánh', () => {
    const g = shop();
    expect(setShopOpen(g, 'main', true)).toBe(true);
    expect(g.stall.open).toBe(true);
    expect(setShopOpen(g, 'main', false)).toBe(true);
    expect(g.stall.open).toBe(false);

    openBranch(g, 'cho');
    expect(setShopOpen(g, 'branch', true)).toBe(false);   // chưa có người trông coi thì không mở được
    hireKeeper(g);
    expect(setShopOpen(g, 'branch', true)).toBe(true);
    expect(g.branch!.open).toBe(true);
    expect(shopRows(g).length).toBe(2);
    expect(shopRows(g)[1].staffed).toBe(true);
  });

  it('quầy chưa đặt ra phố hoặc chưa bật món thì không mở bán được', () => {
    const g = shop();
    g.stall.where = 'carried';
    expect(setShopOpen(g, 'main', true)).toBe(false);
    expect(g.stall.open).toBe(false);
    g.stall.where = 'placed';
    for (const id of Object.keys(g.rec)) g.rec[id].on = false;
    expect(setShopOpen(g, 'main', true)).toBe(false);
    expect(menuOf(g).length).toBe(0);
  });

  it('gợi ý trong app nói đúng việc cần làm (khay trống / chưa bật món / đang đóng)', () => {
    const g = shop();
    g.stall.ready = [];
    expect(shopRows(g)[0].hint).toContain('Không còn phần nào');
    for (const id of Object.keys(g.rec)) g.rec[id].on = false;
    expect(shopRows(g)[0].hint).toContain('Chưa bật món');
    g.rec.com_suon.known = true; g.rec.com_suon.on = true; g.stall.ready = [{ rid: 'com_suon', n: 3, q: 1, at: 0, cost: 1 }];
    g.stall.open = false;
    expect(shopRows(g)[0].hint).toContain('tạm đóng');
  });

  it('cảnh báo bán lỗ: chỉ ra món có giá bán thấp hơn giá vốn', () => {
    const g = shop();
    g.rec.com_suon.price = 1000;                       // rẻ hơn giá vốn
    const loss = lossDishes(g);
    expect(loss.length).toBe(1);
    expect(loss[0].rid).toBe('com_suon');
    expect(loss[0].cost).toBeGreaterThan(loss[0].price);
    g.rec.com_suon.price = 90000;
    expect(lossDishes(g).length).toBe(0);
  });

  it('chi nhánh hiện đúng số phần đang bày sau khi chuyển món sang', () => {
    const g = shop();
    openBranch(g, 'cho'); hireKeeper(g);
    const moved = moveToBranch(g, 'com_suon', 3);
    expect(moved).toBe(3);
    const b = shopRows(g).find((r) => r.id === 'branch')!;
    expect(b.stock).toBe(3);
    expect(b.kinds).toBe(1);
    expect(b.rent).toBeGreaterThan(0);
  });
});
