// Người chơi báo "bánh mì / sữa bỏ vào quầy rồi biến mất". Thực ra là đồ hỏng bị dọn qua đêm mà KHÔNG nói gì.
// Bài này canh ba việc: (1) bỏ quầy thì vẫn còn nguyên tới ngày hôm sau, (2) lúc dọn phải báo tên món hỏng,
// (3) bánh mì giữ được lâu gấp đôi trước.
import { describe, it, expect } from 'vitest';
import { fresh, withStall, give, IDLE } from './helpers';
import { advance, shopRows, shopPrice, canTakeFromStore, nearStall } from '../src/sim/rules';
import { SHOPS } from '../src/data/shops';
import { countOf } from '../src/sim/state';
import { INGS } from '../src/data/ingredients';
import { bus } from '../src/core/bus';

const toasts = () => { const out: string[] = []; const off = bus.on('toast', (t) => out.push(t.text)); return { out, off }; };

describe('đồ bỏ vào quầy không biến mất oan', () => {
  it('bánh mì và sữa để trong quầy vẫn còn nguyên qua nhiều giờ trong ngày', () => {
    const g = withStall();
    g.min = 8 * 60;
    give(g, 'banhmi', 4, 100);
    give(g, 'suatuoi', 2, 100);
    advance(g, 8 * 60, IDLE); // 8 tiếng, chưa qua ngày mới
    expect(countOf([g.stall.store], 'banhmi')).toBe(4);
    expect(countOf([g.stall.store], 'suatuoi')).toBe(2);
  });
  it('bánh mì để được 2 ngày (52,8 giờ), gấp đôi mức cũ 26,4 giờ', () => {
    expect(INGS.banhmi.shelf).toBe(52.8);
    const g = withStall();
    g.min = 8 * 60;
    give(g, 'banhmi', 3, 100);
    advance(g, 30 * 60, IDLE); // hơn một ngày
    expect(countOf([g.stall.store], 'banhmi')).toBe(3);
  });
  it('tới lúc phải bỏ thì báo rõ tên món, không im lặng', () => {
    const g = withStall();
    g.min = 8 * 60;
    give(g, 'banhmi', 2, 100);
    // món rất mau hỏng: tôm để ngoài quầy không tủ nay được ~40 giờ (lượt 41b), nên chờ tới lúc đó
    give(g, 'tom', 1, 100);
    const t = toasts();
    // Đồ chỉ bị dọn lúc sang ngày mới, nên chạy tới khi có lời báo (tôm hỏng ở giờ thứ ~40, dọn ở lần sang ngày kế).
    for (let i = 0; i < 120 && !t.out.some((x) => /Đồ hỏng phải bỏ/.test(x)); i++) advance(g, 60, IDLE);
    t.off();
    const line = t.out.find((x) => /Đồ hỏng phải bỏ/.test(x));
    expect(line, `không thấy lời báo hỏng, chỉ có: ${t.out.join(' | ')}`).toBeTruthy();
    expect(line!).toMatch(/Tôm/);
    expect(countOf([g.stall.store], 'tom')).toBe(0);
  });
});

describe('app Quản lý cửa hàng nhắc đồ sắp hỏng', () => {
  it('bánh mì để lâu trong quầy thì app báo tên món, kho sạch thì không báo', () => {
    const g = withStall();
    g.min = 8 * 60;
    give(g, 'banhmi', 3, 100);
    expect(shopRows(g)[0].spoilKinds).toBe(0);
    advance(g, 36 * 60, IDLE); // ~1,5 ngày: bánh mì xuống dưới 35% tươi
    const row = shopRows(g)[0];
    expect(row.spoilKinds).toBeGreaterThan(0);
    expect(row.spoilNames).toContain('Bánh mì');
  });
});

describe('giá bánh mì giống nhau ở mọi chỗ hiển thị', () => {
  it('bảng giá trên kệ (menu của sạp) khớp với giá tính tiền thật', () => {
    const g = withStall();
    for (const id of ['bakery', 'mart', 'kiosk']) {
      const shop = SHOPS[id];
      if (!shop.items.includes('banhmi')) continue;
      for (const hour of [6, 12, 18]) {
        g.min = hour * 60;
        const shown = shopPrice(g, shop, 'banhmi');
        expect(shown, `${id} lúc ${hour}h`).toBe(shopPrice(g, shop, 'banhmi'));
        expect(shown).toBeGreaterThanOrEqual(500);
      }
    }
  });
  it('cuối buổi ở lò bánh mì thì rẻ hơn buổi sáng (xả hàng)', () => {
    const g = withStall();
    const shop = SHOPS.bakery;
    g.min = 6 * 60; const early = shopPrice(g, shop, 'banhmi');
    g.min = 19 * 60; const late = shopPrice(g, shop, 'banhmi');
    expect(late).toBeLessThan(early);
  });
});

describe('cảnh báo đồ cần lạnh để ở quầy', () => {
  it('không có tủ đá thì báo tên món + số giờ; có tủ đông thì thôi báo', () => {
    const g = withStall();
    g.min = 10 * 60;
    give(g, 'suatuoi', 1, 100);
    const row = shopRows(g)[0];
    expect(row.coldKinds).toBe(1);
    expect(row.coldNames).toContain('Sữa tươi');
    expect(row.coldHours).toBeGreaterThan(0);
    // sữa hộp giữ được lâu hơn thịt, nhưng vẫn ngắn hơn nhiều so với để ở tủ lạnh
    expect(row.coldHours).toBeLessThan(48);
    expect(row.coldHours).toBeGreaterThan(1);

    g.gear.tu_dong = 100;                      // lắp tủ đông công nghiệp
    expect(shopRows(g)[0].coldKinds).toBe(0);

    delete g.gear.tu_dong; g.gear.thungda = 100; give(g, 'da', 2);
    expect(shopRows(g)[0].coldKinds).toBe(0);  // thùng đá + đá viên cũng giữ được
  });
  it('thịt để trong quầy không tủ thì hỏng trong khoảng một ngày rưỡi — cảnh báo nói đúng con số thật', () => {
    const g = withStall();
    g.min = 10 * 60;
    give(g, 'heo', 3, 100);
    const row = shopRows(g)[0];
    expect(row.coldNames).toContain('Thịt heo nạc');
    expect(row.coldHours).toBeLessThanOrEqual(60);   // thịt heo nay ~2 ngày trong quầy không tủ
    expect(row.coldHours).toBeGreaterThan(30);
  });
});

// Lượt 37 — người chơi xin: "lấy đồ ra khỏi quầy mà không cần đặt quầy vào chỗ bán".
describe('lấy đồ ra khỏi kho quầy ở mọi lúc', () => {
  it('quầy đang mang theo / để ở nhà: vẫn lấy được đồ ra, nhưng bỏ vào thì phải ở gần quầy', () => {
    const g = withStall();
    give(g, 'banhmi', 5);
    expect(canTakeFromStore(g)).toBe(true);

    g.stall.where = 'carried';                       // đang gánh trên vai
    expect(canTakeFromStore(g)).toBe(true);
    expect(nearStall(g, 9999, 9999)).toBe(true);      // mang theo người thì lúc nào cũng "gần"

    g.stall.where = 'placed'; g.stall.x = 0; g.stall.z = 0;
    expect(nearStall(g, 2, 0)).toBe(true);            // đứng cạnh quầy
    expect(nearStall(g, 40, 0)).toBe(false);          // đi chợ xa: bỏ vào không được…
    expect(canTakeFromStore(g)).toBe(true);           // …nhưng vẫn lấy ra được
  });
  it('chưa có quầy thì không có kho để lấy', () => {
    const g = fresh();
    expect(canTakeFromStore(g)).toBe(false);
    expect(nearStall(g, 0, 0)).toBe(false);
  });
});

// Lượt 39 — người chơi xin tăng hạn dùng cho bánh phở/bún và đồ nguội, giống bánh mì.
describe('đồ nguội ăn liền để được 2 ngày trong quầy', () => {
  it('bánh phở, bún, xúc xích, giò, chả, đậu hũ đều sống qua một ngày trong quầy', () => {
    const g = withStall();
    g.min = 8 * 60;
    for (const id of ['banhpho', 'bun', 'xucxich', 'gio', 'chaca', 'dauhu']) give(g, id, 1, 100);
    // trôi từng giờ: máy làm hỏng đồ chạy theo từng giờ một, tua một cục qua ngày thì nó không chạy
    for (let i = 0; i < 20; i++) advance(g, 60, IDLE);   // 8h sáng → 4h sáng hôm sau
    for (const id of ['banhpho', 'bun', 'xucxich', 'gio', 'chaca', 'dauhu']) {
      expect(countOf([g.stall.store], id), id).toBe(1);
    }
  });
  it('thịt tươi sống qua được một ngày, nhưng tới ngày thứ hai thì hỏng thật', () => {
    const g = withStall();
    g.min = 8 * 60;
    give(g, 'heo', 2, 100);
    // Ngày thứ nhất: vẫn còn dùng được (trước đây 12 giờ là mất trắng, người chơi kêu).
    for (let i = 0; i < 14; i++) advance(g, 60, IDLE);
    expect(countOf([g.stall.store], 'heo')).toBe(2);
    // Sang ngày thứ hai (thêm 56 giờ) thì phải hỏng.
    for (let i = 0; i < 56; i++) advance(g, 60, IDLE);
    expect(countOf([g.stall.store], 'heo')).toBe(0);
  });
});
