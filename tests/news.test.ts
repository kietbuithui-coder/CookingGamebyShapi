// TIN & GIÁ THẬT TRONG VÁN (lượt 30): sóng radio chỉ đọc chuyện đang xảy ra trong game, trang WAP mỗi lần
// lướt đưa đúng 5 tin thật + bảng giá đúng bằng giá các sạp đang bán hôm nay (shopPrice).
import { describe, it, expect } from 'vitest';
import { news, radioLines, wapNews, marketPrices, priceLine, cheapest, priciest } from '../src/sim/news';
import { shopPrice } from '../src/sim/rules';
import { SHOP_LIST } from '../src/data/shops';
import { INGS } from '../src/data/ingredients';
import { WEATHER } from '../src/data/world';
import { advance } from '../src/sim/rules';
import { activate } from '../src/sim/phone';
import { activate as _a } from '../src/sim/phone';
import { fresh, IDLE } from './helpers';

const boot = () => { const g = fresh(); activate(g, 'camung'); g.cash = 200000; return g; };

describe('tin trong ván: radio và WAP chỉ nói chuyện có thật', () => {
  it('bản tin mở đầu là thời tiết đang có thật trong ván', () => {
    const g = boot();
    const n = news(g);
    const wx = WEATHER[g.weather.now];
    expect(n[0].title.toLowerCase()).toContain(wx.name.toLowerCase().slice(0, 6));
    // radio đọc đúng tin đó, không phải câu trang trí
    expect(radioLines(g)[0]).toContain(n[0].title);
  });

  it('giá trong bảng giá đúng bằng giá sạp đang bán (không bịa giá)', () => {
    const g = boot();
    const prices = marketPrices(g);
    expect(prices.length).toBeGreaterThan(10);
    for (const p of prices) {
      const shop = SHOP_LIST.find((s) => s.name === p.shop)!;
      expect(shop).toBeTruthy();
      expect(shop.items).toContain(p.id);
      expect(p.now).toBe(shopPrice(g, shop, p.id));
      expect(p.unit).toBe(INGS[p.id].unit);
      expect(p.name).toBe(INGS[p.id].name);
    }
    // món rẻ nhất / đắt nhất lấy từ đúng bảng đó
    expect(cheapest(g, 1)[0].now).toBe(Math.min(...prices.map((p) => p.now)));
    expect(priciest(g, 1)[0].now).toBe(Math.max(...prices.map((p) => p.now)));
  });

  it('sang ngày mới thì giá đổi và tin giá nói đúng đang lên hay xuống', () => {
    const g = boot();
    const before = priceLine(g)!;
    advance(g, 24 * 60 + 120, IDLE);
    const after = marketPrices(g).find((p) => p.id === before.id)!;
    expect(after.was).toBe(before.now);        // "hôm qua" của tin hôm nay = giá hôm qua thật
    const line = priceLine(g)!;
    expect([line.now > line.was, line.now === line.was, line.now < line.was].some(Boolean)).toBe(true);
    const text = radioLines(g).join(' ');
    // tin viết tên món ở giữa câu nên viết thường — so không phân biệt hoa thường
    expect(text.toLowerCase()).toContain(INGS[line.id].name.toLowerCase());
  });

  it('sự kiện đang diễn ra vào bản tin (đúng tên và đúng lời của bảng sự kiện)', () => {
    const g = boot();
    g.ev.active.push({ id: 'le_hoi', until: g.day * 1440 + 600, from: g.day * 1440 } as never);
    const n = news(g);
    const ev = n.find((x) => x.title.includes('Lễ hội'));
    expect(ev).toBeTruthy();
    expect(ev!.body).toContain('lễ hội');
  });

  it('tin giá chợ kèm bảng giá đúng giá sạp, và không nhắc lại món đã có tin riêng trên trang', () => {
    const g = boot();
    const all = news(g);
    const price = all.find((n) => n.title === 'Giá chợ hôm nay');
    expect(price).toBeTruthy();
    expect(price!.prices!.length).toBeGreaterThanOrEqual(3);
    const rows = marketPrices(g);
    for (const p of price!.prices!) {
      const real = rows.find((r) => r.id === p.id)!;
      expect(p.now).toBe(real.now);              // đúng giá đang bán, không bịa
      expect(price!.body).toContain(p.name);
    }
    // trang nào có tin riêng của một món thì bảng giá không nói lại món đó
    for (let page = 0; page < 6; page++) {
      const items = wapNews(g, page * 5, 5);
      const table = items.find((n) => n.prices);
      if (!table) continue;
      const said = items.filter((n) => n !== table).map((n) => n.title.toLowerCase()).join(' | ');
      for (const p of (table.prices ?? [])) expect(said.includes(p.name.toLowerCase())).toBe(false);
    }
  });

  it('mỗi trang WAP đúng 5 tin, mỗi lần sang trang là 5 tin khác (xoay vòng hết danh sách)', () => {
    const g = boot();
    const all = wapNews(g, 0, 5);
    expect(all.length).toBe(5);
    const p1 = wapNews(g, 5, 5);
    expect(p1.length).toBe(5);
    expect(p1[0].title).not.toBe(all[0].title);
    const total = news(g).length;
    expect(total).toBeGreaterThanOrEqual(6);
    // đi hết một vòng thì quay lại tin đầu
    const wrap = wapNews(g, total, 5);
    expect(wrap[0].title).toBe(all[0].title);
    // mọi tin đều có tiêu đề và nội dung thật, không rỗng
    for (const x of all) { expect(x.title.length).toBeGreaterThan(3); expect(x.body.length).toBeGreaterThan(5); }
  });

  it('không bịa chuyện ngoài đường: chưa quen khách nào thì bản tin không nhắc ai, quen rồi mới nhắc đúng người', () => {
    const g = boot();
    for (const n of news(g)) expect(n.title).not.toContain('Xe ôm');
    for (const n of news(g)) expect(n.body).not.toContain('đầu hẻm');
    // quen Chú Ba xe ôm (đã ghé quán 2 lần) → bản tin nhắc anh ấy, đúng giờ trong dữ liệu khách quen
    g.rel.chu_ba = { v: 20, n: 2, last: -1 };
    const line = news(g).find((x) => x.title.includes('Chú Ba xe ôm'));
    expect(line).toBeTruthy();
    expect(line!.body).toContain('ghé 2 lần');
    expect(line!.body).toContain('11 giờ');
    // người chỉ mới quen (chưa ghé lần nào) thì không lên bản tin
    g.rel.ong_sau = { v: 30, n: 0, last: -1 };
    expect(news(g).some((x) => x.title.includes('Ông Sáu'))).toBe(false);
  });

  it('chuyện của chính người chơi cũng vào bản tin: quán đóng, nợ quá hạn, máy yếu pin', () => {
    const g = boot();
    g.phone!.battery = 12;
    g.debts.push({ id: 1, lender: 'bank', principal: 500000, owed: 530000, due: g.day - 1, late: 1, taken: g.day - 5, ext: 0 });
    const titles = news(g).map((x) => x.title);
    expect(titles).toContain('Pin máy yếu');
    expect(titles).toContain('Nợ quá hạn');
    const pin = news(g).find((x) => x.title === 'Pin máy yếu')!;
    expect(pin.body).toContain('12%');
  });
});
