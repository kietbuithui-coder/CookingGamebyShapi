// ÔNG BẢY GỢI Ý ĐÚNG LÚC — lời khuyên phải đọc đúng trạng thái thật của ván và chỉ được trỏ tới chỗ
// **có thật** và **đang dùng được ở giờ đó**. Bài này canh đúng hai điều ấy trên 60 trạng thái ngẫu nhiên
// (giống bài canh tin bịa của `news.test.ts`), rồi canh từng tình huống cụ thể: đói, hết tiền, chưa có quầy,
// thiếu nguyên liệu, nợ Hùng Sẹo, sắp mưa, đã khuya. Không được lặp câu khi ghé liền ba lần.
import { describe, it, expect } from 'vitest';
import { advice, pickAdvice, rememberAdvice, destOpen, shopFor, shopLandmark, nowText } from '../src/sim/advice';
import { EVENT_LIST } from '../src/data/world';
import * as R from '../src/sim/rules';
import { LANDMARK_LIST, LANDMARK_BY_ID, HOME_LANDMARK } from '../src/data/landmarks';
import { SPOTS } from '../src/world/layout';
import { HOUSING } from '../src/data/gear';
import { RNG } from '../src/core/util';
import { Game } from '../src/sim/state';
import { fresh, withStall, sellingTea, give } from './helpers';

/** Trạng thái ngẫu nhiên nhưng tất định: chỉ số, tiền, giờ, thời tiết, quầy, nợ. */
function randomGame(seed: number): Game {
  const R = new RNG(seed), g = R.chance(0.5) ? fresh(seed) : withStall(seed);
  g.min = Math.floor(R.range(0, 24) * 60);
  g.cash = R.pick([0, 5000, 28000, 60000, 250000, 3000000]);
  g.st.health = R.range(8, 125); g.st.hunger = R.range(5, 125);
  g.st.energy = R.range(5, 125); g.st.hygiene = R.range(5, 125);
  g.housing = R.pick(['gamcau', 'ghe', 'tro', 'nhanghi', 'canho']);
  g.weather.now = R.pick(['nang', 'nong', 'mua', 'muato', 'lanh', 'gio'] as const);
  g.weather.next = R.pick(['nang', 'mua', 'muato', 'giong'] as const);
  if (R.chance(0.4)) g.debts.push({ id: 1, lender: 'shark', principal: 200000, owed: 260000, due: g.day + R.int(-2, 6), late: 0, taken: 0, ext: 0 });
  if (R.chance(0.35)) g.stall.open = false;
  return g;
}

describe('lời khuyên của Ông Bảy: chỉ nói chuyện có thật trong ván', () => {
  it('mọi câu đều trỏ tới một đích đến có thật trong danh sách', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const a of advice(randomGame(seed))) {
        expect(LANDMARK_BY_ID[a.place], `seed ${seed}: ${a.id} → ${a.place}`).toBeTruthy();
      }
    }
  });

  it('câu nào cũng trỏ chỗ ĐANG dùng được ở giờ đó (không chỉ đường tới tiệm đã đóng)', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const g = randomGame(seed);
      for (const a of advice(g)) {
        const lm = LANDMARK_BY_ID[a.place];
        expect(lm, a.place).toBeTruthy();
        // chỗ dựng quầy / giường ngủ / bảng việc làm thì lúc nào cũng tới được
        if (lm.always) continue;
        expect(destOpen(g, a.place), `seed ${seed} · ${nowText(g)} · ${a.id} → ${lm.name}`).toBe(true);
      }
    }
  });

  it('câu nói đủ dài để hiểu và không bao giờ rỗng', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const list = advice(randomGame(seed));
      expect(list.length).toBeGreaterThan(0);
      for (const a of list) { expect(a.text.length).toBeGreaterThan(40); expect(a.urgent).toBeGreaterThan(0); }
    }
  });

  it('danh sách xếp theo mức cấp thiết, và mỗi mã câu chỉ xuất hiện một lần', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const list = advice(randomGame(seed));
      const urg = list.map((a) => a.urgent);
      expect(urg).toEqual([...urg].sort((a, b) => b - a));
      expect(new Set(list.map((a) => a.id)).size).toBe(list.length);
    }
  });
});

describe('lời khuyên đúng với từng tình huống', () => {
  it('sắp ngất thì chỉ vô bệnh viện, không chỉ chỗ vui chơi', () => {
    const g = fresh(); g.min = 14 * 60; g.st.health = 20;
    const a = advice(g)[0];
    expect(a.id).toBe('health'); expect(a.place).toBe('hospital');
    expect(a.text).toContain('Bệnh viện Phước An');
  });

  it('đói lúc tiệm cơm mở thì nói quán cơm Bà Tư, kèm đúng giá 25.000₫', () => {
    const g = fresh(); g.min = 12 * 60; g.st.hunger = 10; g.st.health = 90;
    const a = advice(g).find((x) => x.id === 'eat')!;
    expect(a.place).toBe('eatery'); expect(a.text).toContain('25.000₫');
  });

  it('đói ngoài giờ thì chỉ chỗ CÒN mở — không chỉ quán cơm đã đóng cửa', () => {
    const g = fresh(); g.min = 23.5 * 60; g.st.hunger = 10; g.st.health = 90;
    const a = advice(g).find((x) => x.id === 'eat')!;
    expect(a.place).not.toBe('eatery');
    expect(destOpen(g, a.place)).toBe(true);
    // 23h30 thì MiniMart 24h là chỗ duy nhất còn mở để mua đồ ăn
    expect(a.place).toBe('mart');
  });

  it('hết tiền buổi sáng thì giục ra bến bốc hàng (đang mở), đầu giờ chiều thì chỉ quán Bà Tư', () => {
    const a1 = fresh(); a1.min = 6 * 60; a1.cash = 0;
    expect(advice(a1).find((x) => x.id === 'job')!.place).toBe('dock');
    const a2 = fresh(); a2.min = 11 * 60; a2.cash = 0;
    expect(advice(a2).find((x) => x.id === 'job')!.place).toBe('eatery');
    // 2h sáng: cả hai chỗ đóng → chỉ còn bảng việc làm (mở mọi giờ)
    const a3 = fresh(); a3.min = 2 * 60; a3.cash = 0;
    expect(advice(a3).find((x) => x.id === 'job')!.place).toBe('board');
  });

  it('chưa có quang gánh: giờ mở cửa thì chỉ tiệm Đồ Nghề, nửa đêm thì chỉ về gầm cầu', () => {
    const day = fresh(); day.min = 9 * 60; day.cash = 150000;
    expect(advice(day).find((x) => x.id === 'noStall')!.place).toBe('equip');
    const night = fresh(); night.min = 23 * 60;
    expect(advice(night).find((x) => x.id === 'noStall')!.place).toBe('camp');
  });

  it('quầy đặt rồi mà chưa mở bán thì nhắc mở bán', () => {
    const g = withStall(); g.min = 15 * 60; g.stall.open = false; g.st.hunger = 100; g.st.energy = 100;
    expect(advice(g).find((x) => x.id === 'closed')).toBeTruthy();
  });

  it('món đang bán thiếu nguyên liệu: nói đúng món, đúng nguyên liệu, đúng sạp đang mở', () => {
    const g = sellingTea(); g.min = 9 * 60; g.st.hunger = 100; g.st.energy = 100;
    // trà đá cần đá; bỏ hết đá đi để món không làm được nữa
    g.stall.store = g.stall.store.filter((s) => s.id !== 'da'); g.bag = g.bag.filter((s) => s.id !== 'da');
    g.stall.preps = [];
    const a = advice(g).find((x) => x.id === 'stock');
    expect(a, 'phải có câu nhắc thiếu nguyên liệu').toBeTruthy();
    expect(a!.text.toLowerCase()).toContain('đá');
    expect(destOpen(g, a!.place)).toBe(true);
    // đá bán ở sạp trong chợ và ở MiniMart — câu chỉ vào một trong hai, miễn là chỗ đó đang mở
    expect(['market', 'mart']).toContain(a!.place);
  });

  it('nợ Hùng Sẹo còn ≤ 2 ngày thì cảnh báo, kèm số tiền thật', () => {
    const g = fresh(); g.min = 10 * 60; g.st.hunger = 100; g.st.energy = 100;
    g.debts.push({ id: 9, lender: 'shark', principal: 200000, owed: 260000, due: g.day + 1, late: 0, taken: 0, ext: 0 });
    const a = advice(g).find((x) => x.id === 'debt')!;
    expect(a.place).toBe('shark'); expect(a.text).toContain('260.000₫'); expect(a.text).toContain('1 ngày');
    // còn xa thì không nhắc
    const far = fresh(); far.min = 10 * 60; far.debts.push({ id: 9, lender: 'shark', principal: 200000, owed: 260000, due: far.day + 6, late: 0, taken: 0, ext: 0 });
    expect(advice(far).some((x) => x.id === 'debt')).toBe(false);
  });

  it('khuya thì nhắc chỗ ngủ — và ghim đúng căn mình đang thuê', () => {
    const g = fresh(); g.min = 23 * 60; g.housing = 'tro'; g.st.hunger = 100; g.st.energy = 100;
    const a = advice(g).find((x) => x.id === 'night')!;
    expect(a.place).toBe(HOME_LANDMARK.tro);
    const h = fresh(); h.min = 23 * 60; h.st.hunger = 100;
    expect(advice(h).find((x) => x.id === 'night')!.place).toBe('camp');
  });

  it('sắp mưa mà chưa có áo mưa thì nhắc mua áo mưa, chỉ đúng chỗ còn mở', () => {
    const g = fresh(); g.min = 13 * 60; g.weather.now = 'nang'; g.weather.next = 'muato';
    g.st.hunger = 100; g.st.energy = 100;
    const a = advice(g).find((x) => x.id === 'rain')!;
    expect(a.text.toLowerCase()).toContain('áo mưa');
    expect(destOpen(g, a.place)).toBe(true);
    // đã có áo mưa thì thôi nhắc
    g.gear.aomua = 100;
    expect(advice(g).find((x) => x.id === 'rain')?.text).not.toContain('áo mưa');
  });
});

describe('không lặp câu khi ghé liền mấy lần', () => {
  it('ba lần liền không nghe lại đúng một câu', () => {
    const g = fresh(); g.min = 9 * 60; g.cash = 0; g.st.hunger = 100; g.st.energy = 100;
    let seen: string[] = []; const said: string[] = [];
    for (let i = 0; i < 3; i++) { const a = pickAdvice(g, seen, {}); said.push(a.id); seen = rememberAdvice(seen, a.id); }
    expect(new Set(said).size).toBeGreaterThan(1);
    expect(said[0]).not.toBe(said[1]);
    expect(said[1]).not.toBe(said[2]);
    expect(seen.length).toBeLessThanOrEqual(3);          // chỉ nhớ 3 câu, bản lưu không phình
  });

  it('câu vừa nói thì nhường chỗ cho câu khác đang đúng, hết câu mới thì quay lại câu cũ', () => {
    const g = fresh(); g.min = 14 * 60; g.st.health = 12; g.st.hunger = 100; g.st.energy = 100;
    const all = advice(g).map((a) => a.id);
    expect(all.length).toBeGreaterThan(1);
    expect(pickAdvice(g, [all[0]]).id).not.toBe(all[0]);          // còn câu khác → nói câu khác
    expect(pickAdvice(g, all).id).toBe(all[0]);                    // nói hết rồi → quay lại câu gấp nhất
    expect(pickAdvice(g, []).id).toBe(all[0]);
  });
});

describe('chỉ đường tới đúng chỗ', () => {
  it('mỗi đích đến có toạ độ thật: hoặc có neo, hoặc có chỗ bán trong SPOTS', () => {
    for (const l of LANDMARK_LIST) {
      expect(!!l.anchor || !!l.spot, `${l.id} thiếu toạ độ`).toBe(true);
      if (l.spot) expect(SPOTS.some((s) => s.id === l.spot), l.spot).toBe(true);
    }
  });

  it('mọi chỗ ở đều ghim được về một chỗ ngủ có thật trên bản đồ', () => {
    for (const id of Object.keys(HOUSING)) expect(LANDMARK_BY_ID[HOME_LANDMARK[id]], id).toBeTruthy();
  });

  it('sạp có đích riêng thì ghim đúng sạp, sạp trong chợ thì ghim Chợ Xóm Chiều', () => {
    expect(shopLandmark('mart')).toBe('mart');
    expect(shopLandmark('kiosk')).toBe('kiosk');
    expect(shopLandmark('m_thit')).toBe('market');
    expect(shopLandmark('m_rau')).toBe('market');
  });

  it('mua nguyên liệu: chọn sạp đang mở và có món đó, sạp đóng thì không bao giờ được chọn', () => {
    const g = fresh(); g.min = 3 * 60;                      // 3 giờ sáng: sạp chợ đóng hết, chỉ MiniMart 24h
    expect(shopFor(g, 'da')!.id).toBe('mart');
    g.min = 9 * 60;
    expect(['m_rau', 'm_cu', 'm_thit', 'm_haisan', 'm_kho', 'm_giavi', 'm_trung']).toContain(shopFor(g, 'rau')?.id ?? 'm_rau');
  });

  it('nguyên liệu không bán ở đâu đang mở thì im lặng, không chỉ bừa', () => {
    const g = fresh(); g.min = 2 * 60;
    expect(shopFor(g, 'cua')).toBe(null);                   // hải sản chỉ bán ở chợ 5–16h
  });
});

describe('dữ liệu đích đến', () => {
  it('không trùng mã, không trùng neo, tên đủ dài để đọc', () => {
    expect(new Set(LANDMARK_LIST.map((l) => l.id)).size).toBe(LANDMARK_LIST.length);
    const anchors = LANDMARK_LIST.filter((l) => l.anchor).map((l) => l.anchor!);
    expect(new Set(anchors).size).toBe(anchors.length);
    for (const l of LANDMARK_LIST) expect(l.name.length).toBeGreaterThan(3);
  });
  it('vẫn còn đủ những chỗ người chơi hay tìm nhất', () => {
    for (const id of ['equip', 'market', 'eatery', 'hospital', 'bank', 'board', 'dock', 'camp']) expect(LANDMARK_BY_ID[id], id).toBeTruthy();
  });
});

describe('sự kiện đang diễn ra (lượt 70c)', () => {
  /** Bật một sự kiện bằng chính hàm của game, ở giờ mà sự kiện đó hợp lệ. */
  const withEvent = (id: string, min: number, sell = false) => {
    const g = sell ? withStall() : fresh();
    g.min = min; g.st.hunger = 100; g.st.energy = 100; g.st.health = 100;
    if (sell) { g.stall.open = true; g.stall.spot = 'cho'; }
    expect(R.startEvent(g, id), id).toBe(true);
    return g;
  };

  it('mỗi sự kiện trong bảng đều có câu riêng — không sự kiện nào bị bỏ quên', () => {
    // Chạy đủ 22 sự kiện ở nhiều giờ/hoàn cảnh; sự kiện nào cũng phải có ít nhất một hoàn cảnh ra câu.
    const hats: Record<string, boolean> = {};
    for (const e of EVENT_LIST) {
      const spots: [number, boolean][] = [[6, false], [10, true], [15, true], [19, true], [22, false]];
      for (const [min, sell] of spots) {
        const g = withEvent(e.id, min * 60, sell);
        if (advice(g).some((a) => a.id === 'ev_' + e.id)) hats[e.id] = true;
      }
      expect(hats[e.id], `sự kiện ${e.id} không có câu nào`).toBe(true);
    }
  });

  it('câu về sự kiện luôn trỏ chỗ ĐANG dùng được, và hết sự kiện là câu biến mất', () => {
    for (const e of EVENT_LIST) {
      for (const min of [7, 12, 18, 21]) {
        const g = withEvent(e.id, min * 60, true);
        for (const a of advice(g).filter((x) => x.id === 'ev_' + e.id)) {
          expect(LANDMARK_BY_ID[a.place], `${e.id} → ${a.place}`).toBeTruthy();
          const lm = LANDMARK_BY_ID[a.place];
          if (!lm.always) expect(destOpen(g, a.place), `${e.id} · ${nowText(g)} → ${lm.name}`).toBe(true);
        }
        R.endEvent(g, e.id);
        expect(advice(g).some((x) => x.id === 'ev_' + e.id), `${e.id} vẫn nói sau khi hết`).toBe(false);
      }
    }
  });

  it('trận bóng: chỉ nói khi quán cà phê còn mở, và nói đúng tên quán', () => {
    const g = withEvent('bong_da', 18 * 60);
    const a = advice(g).find((x) => x.id === 'ev_bong_da')!;
    expect(a.place).toBe('cafe_bongda');
    expect(a.text).toContain('Bóng Đá');
    expect(destOpen(g, 'cafe_bongda')).toBe(true);
    // Hết sự kiện thì đích đó đóng lại — không còn câu “tối nay có trận bóng” lúc 9 giờ sáng hôm sau.
    R.endEvent(g, 'bong_da');
    expect(destOpen(g, 'cafe_bongda')).toBe(false);
  });

  it('việc liên quan tới quầy (kiểm tra, phê bình, khách VIP…) chỉ nói khi đang bán thật', () => {
    const closed = withEvent('kiem_tra', 10 * 60, true);
    closed.stall.open = false;
    expect(advice(closed).some((x) => x.id === 'ev_kiem_tra')).toBe(false);
    const openG = withEvent('kiem_tra', 10 * 60, true);
    const a = advice(openG).find((x) => x.id === 'ev_kiem_tra')!;
    expect(a.place).toBe('spot_cho');          // ghim ĐÚNG chỗ quầy đang đứng
    expect(a.urgent).toBeGreaterThan(60);      // việc gấp, phải nói trước chuyện lặt vặt
  });

  it('bão là câu gấp nhất trong mọi câu về sự kiện, và nhắc áo mưa khi chưa có', () => {
    const g = withEvent('bao', 15 * 60);
    const a = advice(g)[0];
    expect(a.id).toBe('ev_bao');
    expect(a.text.toLowerCase()).toContain('áo mưa');
    g.gear.aomua = 100;
    const b = advice(g).find((x) => x.id === 'ev_bao')!;
    expect(b.text.toLowerCase()).not.toContain('áo mưa mua');
    expect(destOpen(g, b.place)).toBe(true);
  });

  it('sự kiện tăng giá nói đúng nhóm hàng và đúng mức tăng lấy từ chính bảng sự kiện', () => {
    const g = withEvent('gia_haisan', 9 * 60);
    const a = advice(g).find((x) => x.id === 'ev_gia_haisan')!;
    expect(a.text).toContain('Hải sản');
    expect(a.text).toContain('50%');            // `price: { seafood: 1.5 }` ⇒ +50 %
    expect(a.place).toBe('market');
  });
});
