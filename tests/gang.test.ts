// BĂNG ĐẢNG (lượt 71) — canh luật thuần: vào/ra băng, thăng chức, việc làm, hàng cấm, án phạt, tiền bảo kê.
// Người chơi yêu cầu: “hàng cấm vài loại / hình phạt nặng / xem băng đảng chi tiết / phe phái / nv băng đảng
// event / thăng chức”. Bài này canh đúng mấy chữ ấy bằng số.
import { describe, it, expect } from 'vitest';
import * as G from '../src/data/gang';
import * as R from '../src/sim/rules';
import * as GG from '../src/sim/gang';
import { fresh } from './helpers';
import { SAVE_VERSION, cleanGang, Game } from '../src/sim/state';

const withGang = (id: G.GangId = 'hem', respect = 0, tier = 1) => {
  const g = fresh();
  g.gang = { id, respect, tier, since: 0, jobsToday: 0, jobDay: -1, paid: 0, stock: {}, turfDay: -1 };
  return g as Game;
};

describe('dữ liệu băng đảng', () => {
  it('có hai phe, mỗi phe có đại ca thật trong danh sách nhân vật và một băng đối đầu', () => {
    expect(G.GANG_LIST.length).toBe(2);
    for (const def of G.GANG_LIST) {
      expect(G.GANGS[def.rival], def.id).toBeTruthy();
      expect(def.rival).not.toBe(def.id);
      expect(def.boss.length).toBeGreaterThan(2);
      expect(def.anchor.startsWith('v_') || def.anchor.startsWith('c_')).toBe(true);
      expect(def.fee).toBeGreaterThan(0);
      expect(def.line.length).toBeGreaterThan(30);
    }
  });

  it('sáu bậc: uy tín tăng dần, phần ăn chia tăng dần, mỗi bậc có quyền lợi viết rõ', () => {
    expect(G.GANG_RANKS.length).toBe(6);
    for (let i = 1; i < G.GANG_RANKS.length; i++) {
      expect(G.GANG_RANKS[i].respect).toBeGreaterThan(G.GANG_RANKS[i - 1].respect);
      expect(G.GANG_RANKS[i].cut).toBeGreaterThanOrEqual(G.GANG_RANKS[i - 1].cut);
    }
    expect(G.GANG_RANKS[0].respect).toBe(0);
    expect(G.GANG_RANKS[5].cut).toBeLessThanOrEqual(0.3);        // ăn chia không vượt 30%: băng phải còn lời
    for (const r of G.GANG_RANKS) expect(r.perk.length).toBeGreaterThan(15);
  });

  it('“vài loại” hàng cấm như người chơi xin: 4 món, càng nặng càng phạt nặng và cấm bậc thấp', () => {
    expect(G.CONTRA_LIST.length).toBe(4);
    for (const c of G.CONTRA_LIST) {
      expect(c.sell).toBeGreaterThan(c.buy);                      // băng bán ra phải có lãi
      expect(c.fineMul).toBeGreaterThan(1);
      expect(c.jail).toBeGreaterThanOrEqual(2);
      expect(c.minTier).toBeGreaterThanOrEqual(2);
      expect(c.desc.length).toBeGreaterThan(25);
    }
    // Món nặng nhất (pháo) phải phạt nặng nhất
    const worst = G.CONTRA_LIST.slice().sort((a, b) => b.fineMul - a.fineMul)[0];
    expect(worst.id).toBe('phao');
  });

  it('pháo lậu phạt nặng hơn một chuyến giao hàng kiếm được — luôn lỗ khi bị bắt', () => {
    const stock = { phao: 2 };
    const fine = G.contrabandFine(stock);
    const oneJob = G.GANG_JOBS.giao.pay;
    expect(fine).toBeGreaterThan(oneJob);                          // bắt một lần là mất hơn một chuyến
  });
});

describe('vào băng, ra băng, thăng chức', () => {
  it('vào băng phải trả tiền lễ; thiếu tiền thì không vào được', () => {
    const g = fresh(); g.cash = 1000;
    expect(GG.joinGang(g, 'cho')).toBe('poor');
    expect(g.gang).toBeNull();
    g.cash = 500000;
    expect(GG.joinGang(g, 'cho')).toBe('ok');
    expect(g.gang!.id).toBe('cho');
    expect(g.cash).toBe(500000 - G.GANGS.cho.fee);
    expect(GG.joinGang(g, 'hem')).toBe('already');                 // đã theo một băng thì không theo băng khác
  });

  it('bậc là do đại ca công nhận: đủ uy tín vẫn phải làm đủ chuyến mới lên', () => {
    const g = withGang('hem', 1000, 1);                            // uy tín vượt xa bậc 2
    const w = GG.promoteWhy(g);
    expect(w.ok).toBe(false);
    if (!w.ok) expect(w.why).toContain('chuyến');
    g.gang!.paid = 5;
    const ok = GG.promoteWhy(g);
    expect(ok.ok).toBe(true);
    const r = GG.promote(g);
    expect(r!.tier).toBe(2);
    expect(GG.rankOf(g).name).toBe('Thằng lính');
  });

  it('thiếu uy tín thì lý do nói đúng còn thiếu bao nhiêu', () => {
    const g = withGang('hem', 0, 1);
    const w = GG.promoteWhy(g);
    expect(w.ok).toBe(false);
    if (!w.ok) expect(w.why).toContain(String(G.GANG_RANKS[1].respect));
  });

  it('đại ca rồi thì không lên nữa; ra băng thì mất băng nhưng giữ số lần đã ra', () => {
    const g = withGang('hem', 5000, 6);
    expect(GG.promoteNeed(g)).toBeNull();
    expect(GG.promoteWhy(g).ok).toBe(false);
    GG.leaveGang(g);
    expect(g.gang).toBeNull();
    expect(g.flags.gangQuit).toBe(1);
  });

  it('phần ăn chia theo bậc: lên bậc thì tiền công thực nhận tăng', () => {
    const low = withGang('hem', 0, 1), high = withGang('hem', 800, 6);
    low.st.energy = 100; high.st.energy = 100; high.min = 6 * 60;
    const a = GG.doJob(low, 'gac')!, b = GG.doJob(high, 'gac')!;
    expect(a.pay).toBe(G.GANG_JOBS.gac.pay);                       // bậc 1 ăn chia 0%
    expect(b.pay).toBeLessThan(a.pay);                             // đại ca bị trích phần trăm
    expect(b.pay).toBe(Math.round((G.GANG_JOBS.gac.pay * (1 - G.GANG_RANKS[5].cut)) / 1000) * 1000);
  });
});

describe('việc làm băng', () => {
  it('mỗi việc có bậc tối thiểu, số ca mỗi ngày, và tiền công khác nhau', () => {
    expect(G.GANG_JOB_LIST.length).toBe(5);
    for (const j of G.GANG_JOB_LIST) {
      expect(j.pay).toBeGreaterThan(0);
      expect(j.perDay).toBeGreaterThan(0);
      expect(j.respect).toBeGreaterThan(0);
      expect(j.heat).toBeGreaterThan(0);
    }
    expect(G.GANG_JOBS.thu.minTier).toBeGreaterThan(G.GANG_JOBS.gac.minTier);
  });

  it('chưa theo băng thì không làm được việc nào, và lý do nói rõ', () => {
    const g = fresh();
    expect(GG.jobWhy(g, 'gac').ok).toBe(false);
    expect(GG.jobWhy(g, 'gac').why).toContain('băng');
    expect(GG.doJob(g, 'gac')).toBeNull();
  });

  it('bậc thấp không nhận việc của bậc cao; hết ca trong ngày thì nghỉ', () => {
    const g = withGang('hem', 0, 1); g.min = 12 * 60; g.st.energy = 100;
    expect(GG.jobWhy(g, 'thu').ok).toBe(false);
    expect(GG.jobWhy(g, 'gac').ok).toBe(true);
    GG.doJob(g, 'gac');
    GG.doJob(g, 'gac');
    expect(GG.jobLeft(g, 'gac')).toBe(0);
    expect(GG.jobWhy(g, 'gac').why).toContain('mai');
    g.day += 1;                                                    // qua ngày thì đếm lại
    expect(GG.jobLeft(g, 'gac')).toBe(G.GANG_JOBS.gac.perDay);
  });

  it('làm việc thì được tiền + uy tín + bị để ý, và tốn sức', () => {
    const g = withGang('hem', 0, 1); g.min = 12 * 60; g.st.energy = 100; g.wanted = 0;
    const cash0 = g.cash;
    const r = GG.doJob(g, 'gac')!;
    expect(g.cash).toBe(cash0 + r.pay);
    expect(g.gang!.respect).toBe(G.GANG_JOBS.gac.respect);
    expect(g.wanted).toBe(G.GANG_JOBS.gac.heat);
    expect(g.st.energy).toBe(92);
    expect(g.gang!.paid).toBe(1);
  });

  it('việc bốc hàng chỉ làm 3–9 giờ sáng, thu nợ chỉ ban ngày', () => {
    const g = withGang('hem', 0, 4); g.st.energy = 100;
    g.min = 14 * 60;
    expect(GG.jobWhy(g, 'boc').ok).toBe(false);
    g.min = 5 * 60;
    expect(GG.jobWhy(g, 'boc').ok).toBe(true);
    g.min = 21 * 60;
    expect(GG.jobWhy(g, 'thu').ok).toBe(false);
  });

  it('việc giữ hàng trả bằng hàng cấm, vào kho băng chứ không vào túi', () => {
    const g = withGang('hem', 0, 3); g.min = 12 * 60; g.st.energy = 100;
    const r = GG.doJob(g, 'giu')!;
    expect(r.got).toEqual(G.GANG_JOBS.giu.reward);
    expect(g.gang!.stock[G.GANG_JOBS.giu.reward!.id]).toBe(G.GANG_JOBS.giu.reward!.n);
    expect(g.bag.some((s) => s.id === G.GANG_JOBS.giu.reward!.id)).toBe(false);
  });
});

describe('hàng cấm', () => {
  it('bậc 1 không mua được; bậc 2 mua thuốc lá được nhưng chưa mua pháo', () => {
    const g = withGang('hem', 0, 1); g.cash = 1000000;
    expect(GG.buyContraband(g, 'thuocla')).toBe('locked');
    g.gang!.tier = 2;
    expect(GG.buyContraband(g, 'thuocla')).toBe('ok');
    expect(GG.buyContraband(g, 'phao')).toBe('locked');
    expect(g.gang!.stock.thuocla).toBe(1);
    expect(g.cash).toBe(1000000 - G.CONTRABAND.thuocla.buy);
  });

  it('không đủ tiền thì không mua, kho không đổi', () => {
    const g = withGang('hem', 0, 3); g.cash = 1000;
    expect(GG.buyContraband(g, 'ruou')).toBe('poor');
    expect(g.gang!.stock.ruou).toBeUndefined();
  });

  it('bán lại cho băng được đúng giá thu, và bán hết thì mã đó rời kho', () => {
    const g = withGang('hem', 0, 3); g.cash = 1000000;
    GG.buyContraband(g, 'thuocla', 2);
    const before = g.cash;
    const r = GG.sellContraband(g, 'thuocla', 2);
    expect(r.ok).toBe(true);
    expect(r.got).toBe(G.CONTRABAND.thuocla.sell * 2);
    expect(g.cash).toBe(before + r.got);
    expect(g.gang!.stock.thuocla).toBeUndefined();
    expect(GG.sellContraband(g, 'thuocla', 1).ok).toBe(false);     // hết hàng thì không bán được nữa
  });

  it('khối lượng và giá trị kho hàng cấm tính đúng theo bảng', () => {
    const g = withGang('hem', 0, 4);
    g.gang!.stock = { thuocla: 3, ruou: 1 };
    expect(GG.stockValue(g)).toBe(G.CONTRABAND.thuocla.sell * 3 + G.CONTRABAND.ruou.sell);
    expect(G.contrabandKg(g.gang!.stock)).toBeCloseTo(G.CONTRABAND.thuocla.kg * 3 + G.CONTRABAND.ruou.kg, 5);
  });
});

describe('hình phạt nặng', () => {
  it('bị bắt: mất hết hàng, mất tiền phạt, bị để ý, tụt uy tín trong băng và ngoài phố', () => {
    const g = withGang('hem', 300, 4);
    g.gang!.stock = { phao: 3 };
    g.cash = 10000000; g.wanted = 10; g.rep = 40;
    const r = GG.bust(g);
    expect(r.fine).toBeGreaterThan(0);
    expect(r.paid).toBe(r.fine);
    expect(g.cash).toBe(10000000 - r.fine);
    expect(g.gang!.stock).toEqual({});                              // mất sạch hàng
    expect(g.gang!.respect).toBe(300 - r.respect);
    expect(g.wanted).toBeGreaterThan(10);
    expect(g.rep).toBeLessThan(40);
    expect(r.jail).toBe(G.CONTRABAND.phao.jail);
  });

  it('không đủ tiền thì chỉ mất tới mức còn lại, không âm', () => {
    const g = withGang('hem', 0, 3);
    g.gang!.stock = { phao: 5 };
    g.cash = 5000;
    const r = GG.bust(g);
    expect(r.paid).toBe(5000);
    expect(g.cash).toBe(0);
    expect(r.fine).toBeGreaterThan(5000);
  });

  it('bắt một chuyến pháo là lỗ hơn tiền lời của cả ba chuyến giao hàng', () => {
    const g = withGang('hem', 0, 3);
    g.gang!.stock = { phao: 3 };
    g.cash = 50000000;
    const fine = GG.bust(g).fine;
    expect(fine).toBeGreaterThan(G.GANG_JOBS.giao.pay * 3);
  });
});

describe('tiền bảo kê (bậc đại ca) và câu mô tả', () => {
  it('chưa tới đại ca thì chưa có tiền bảo kê; đại ca nhận được mỗi ngày một lần', () => {
    const low = withGang('hem', 500, 5);
    expect(GG.turfPay(low)).toBe(0);
    const g = withGang('hem', 800, 6);
    const pay = GG.turfPay(g);
    expect(pay).toBeGreaterThan(0);
    expect(GG.claimTurf(g)).toBe(pay);
    expect(GG.claimTurf(g)).toBe(0);                                // hôm nay nhận rồi
    g.day += 1;
    expect(GG.claimTurf(g)).toBeGreaterThan(0);
  });

  it('câu mô tả đọc được: tên băng, bậc mấy trên sáu, tên bậc, uy tín', () => {
    const g = withGang('cho', 130, 3);
    const line = GG.gangLine(g);
    expect(line).toContain('Băng Chợ Cá');
    expect(line).toContain('bậc 3/6');
    expect(line).toContain('Giữ hàng');
    expect(line).toContain('130');
    expect(GG.gangLine(fresh())).toContain('Chưa theo băng');
  });
});

describe('bản lưu', () => {
  it('bản lưu cũ (chưa có băng) vẫn mở được, gang = null', () => {
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(18);
    expect(cleanGang(undefined)).toBeNull();
    expect(cleanGang({ id: 'la' })).toBeNull();                     // phe không có thật
  });

  it('dữ liệu băng lành thì giữ nguyên; dữ liệu hỏng thì dọn chứ không vứt cả khối', () => {
    const ok = cleanGang({ id: 'hem', respect: 321, tier: 4, since: 2, paid: 9, stock: { thuocla: 2, la: 5, ruou: -3 } });
    expect(ok!.id).toBe('hem');
    expect(ok!.respect).toBe(321);
    expect(ok!.tier).toBe(4);
    expect(ok!.stock).toEqual({ thuocla: 2 });                      // bỏ mã lạ và số âm
    expect(cleanGang({ id: 'cho', respect: -50 })!.respect).toBe(0);
    expect(cleanGang({ id: 'cho', tier: 99 })!.tier).toBe(6);       // bậc kẹp trần
  });
});

// ═════════════════════ CON DAO HAI LƯỠI (lượt 72) ═════════════════════
// Người chơi dặn: *“đảm bảo băng đảng là con dao hai lưỡi”*. Nhóm này canh đúng **cái giá**: mỗi bậc lên thì
// khách bớt, phí chỗ tăng, công an để ý — và bốn cách rời băng đều mất thứ gì.

describe('mặt trái: bậc càng cao thì càng đắt', () => {
  it('mỗi bậc có đủ ba con số và bậc sau nặng hơn bậc trước', () => {
    expect(G.GANG_DOWNSIDE.length).toBe(6);
    for (let i = 1; i < G.GANG_DOWNSIDE.length; i++) {
      const a = G.GANG_DOWNSIDE[i - 1], b = G.GANG_DOWNSIDE[i];
      expect(b.fear).toBeGreaterThan(a.fear);
      expect(b.rent).toBeGreaterThan(a.rent);
      expect(b.heat).toBeGreaterThan(a.heat);
    }
    for (const d of G.GANG_DOWNSIDE) {
      expect(d.fear).toBeGreaterThan(0);
      expect(d.fear).toBeLessThan(0.5);          // không bao giờ mất quá nửa khách — quán vẫn còn để bán
      expect(d.note.length).toBeGreaterThan(20);
    }
  });

  it('chưa theo băng thì không mất gì; theo rồi thì phải mất', () => {
    const free = fresh();
    expect(GG.downside(free)).toEqual({ tier: 0, fear: 0, rent: 0, heat: 0, note: '' });
    expect(GG.fearMul(free)).toBe(1);
    expect(GG.fearRate(free)).toBe(0);
    expect(GG.gangRentExtra(free)).toBe(0);
    expect(GG.gangHeatPerDay(free)).toBe(0);

    const g = withGang('hem', 0, 6);
    expect(GG.fearMul(g)).toBeLessThan(0.7);
    expect(GG.fearRate(free)).toBe(0);
    expect(GG.gangHeatPerDay(g)).toBe(6);
  });

  it('khách tới quán giảm thật khi đang ở trong băng — đây là chỗ trừ vào doanh thu', () => {
    const free = fresh(), g = withGang('hem', 0, 4);
    // So hệ số khách (thuần) chứ không gọi `arrivalRate`: hàm đó còn đọc thời tiết/giờ/ngẫu nhiên nên hai ván
    // khác nhau có thể ra 0 cả hai và phép so vô nghĩa.
    expect(GG.fearMul(g)).toBeLessThan(GG.fearMul(free));
    expect(GG.fearMul(g)).toBeCloseTo(1 - G.GANG_DOWNSIDE[3].fear, 5);
  });

  it('phí chỗ đội thêm đúng theo bậc, và chỉ khi đã đặt sạp cố định', () => {
    const g = withGang('hem', 0, 3);
    g.stall.tier = 3; g.stall.where = 'placed'; g.stall.spot = 'cho';
    const base = R.stallRent(fresh2(withGang('hem', 0, 1), 'cho'));
    const extra = GG.gangRentExtra(g);
    expect(extra).toBeGreaterThan(0);
    expect(R.stallRent(g)).toBe(base + extra);
    // Chưa đặt sạp (mang trên vai) thì không có phí chỗ, cũng không có phần đội thêm.
    const carry = withGang('hem', 0, 6); carry.stall.tier = 1; carry.stall.where = 'carried';
    expect(GG.gangRentExtra(carry)).toBe(0);
  });

  it('mỗi ngày trong băng thì bị để ý thêm — và đúng bằng số của bậc', () => {
    const g = withGang('hem', 0, 2); g.wanted = 10;
    expect(GG.dailyGangHeat(g)).toBe(G.GANG_DOWNSIDE[1].heat);
    expect(g.wanted).toBe(10 + G.GANG_DOWNSIDE[1].heat);
  });
});

/** Đặt sạp ở một chỗ cho sẵn — dùng để tính phí gốc của chỗ đó. */
function fresh2(g: Game, spot: string) { g.stall.tier = 3; g.stall.where = 'placed'; g.stall.spot = spot; return g; }

describe('cảnh làm việc: làm tới thì ăn thêm, mà trả giá', () => {
  it('mỗi việc có một cảnh, đủ đoạn để kể, và có lựa chọn rút / làm tới', () => {
    for (const j of G.GANG_JOB_LIST) {
      const c = G.GANG_CUTS[j.id];
      expect(c, j.id).toBeTruthy();
      expect(c.beats.length).toBeGreaterThanOrEqual(2);
      expect(c.stop.length).toBeGreaterThan(10);
      expect(c.go.length).toBeGreaterThan(10);
      expect(c.bonus).toBeGreaterThan(0);
      // Không cảnh nào “cho không”: luôn có ít nhất một cái giá.
      const cost = c.cost;
      expect(Math.abs(cost.mood) + Math.abs(cost.health) + cost.heat + Math.abs(cost.rep)).toBeGreaterThan(0);
    }
  });

  it('làm tới cùng: được thêm tiền, mất tinh thần/sức khoẻ/uy tín đúng như cảnh ghi', () => {
    const g = withGang('hem', 0, 4); g.cash = 0; g.st.mood = 70; g.st.health = 90; g.rep = 50; g.wanted = 10;
    const c = G.GANG_CUTS.thu;
    const r = GG.resolveCut(g, 'thu', true)!;
    expect(r.bonus).toBe(c.bonus);
    expect(g.cash).toBeGreaterThanOrEqual(c.bonus);               // tiền vào thật
    expect(g.st.mood).toBe(70 + c.cost.mood);
    expect(g.st.health).toBe(90 + c.cost.health);
    expect(g.rep).toBe(50 + c.cost.rep);
    expect(g.wanted).toBe(10 + c.cost.heat);
    expect(g.gang!.respect).toBe(6);
  });

  it('rút lui: không mất tiền, nhưng mất uy tín trong băng — không có lựa chọn miễn phí', () => {
    const g = withGang('hem', 20, 2);
    const r = GG.resolveCut(g, 'gac', false)!;
    expect(r.bonus).toBe(0);
    expect(g.gang!.respect).toBe(16);
  });

  it('cảnh “thu nợ bà bán tạp hoá” là cảnh nặng nhất về tinh thần và uy tín phố', () => {
    const worst = G.GANG_JOB_LIST.map((j) => G.GANG_CUTS[j.id]).sort((a, b) => a.cost.mood - b.cost.mood)[0];
    expect(worst.id).toBe('thu');
    expect(worst.cost.rep).toBeLessThan(0);
  });
});

describe('tin xấu của băng', () => {
  it('có bốn loại, mỗi loại đều đòi được thứ gì (tiền hoặc uy tín)', () => {
    expect(G.GANG_TROUBLE.length).toBe(4);
    for (const t of G.GANG_TROUBLE) {
      expect(t.title.length).toBeGreaterThan(5);
      expect(t.text.length).toBeGreaterThan(30);
      expect(t.refuse.respect + t.refuse.heat + Math.abs(t.refuse.rep) + Math.abs(t.refuse.mood)).toBeGreaterThan(0);
    }
  });

  it('mới vào băng thì ba ngày đầu chưa bị đòi gì', () => {
    const g = withGang('hem', 0, 1); g.day = 2; g.gang!.since = 2;
    expect(GG.troubleToday(g)).toBeNull();
  });

  it('không bao giờ hai ngày liền — đời sống băng khó chịu nhưng không dồn dập', () => {
    const g = withGang('hem', 100, 3); g.gang!.since = 0; g.day = 10;
    g.flags.gangTroubleDay = 9;
    expect(GG.troubleToday(g)).toBeNull();
  });

  it('bậc thấp chưa bị đòi tiền chạy việc', () => {
    const g = withGang('hem', 0, 1); g.gang!.since = 0;
    for (let d = 4; d < 40; d++) { g.day = d; const t = GG.troubleToday(g);
      if (t) expect(t.minTier).toBeLessThanOrEqual(1); }
  });
});

describe('bốn cách rời băng — không có đường sạch', () => {
  it('cách nào cũng mất bậc; có cách mất tiền, có cách mất uy tín phố', () => {
    const g = withGang('hem', 200, 4);
    const ways = GG.leaveWays(g);
    expect(ways.length).toBeGreaterThanOrEqual(3);
    for (const w of ways) {
      expect(w.tierLoss).toBeGreaterThan(0);
      expect(w.line.length).toBeGreaterThan(20);
    }
    expect(ways.some((w) => w.cost > 0)).toBe(true);
    expect(ways.some((w) => w.rep < 0)).toBe(true);
  });

  it('“trả nợ máu” mất tiền; thiếu tiền thì không đi được cách đó', () => {
    const g = withGang('hem', 200, 4); g.cash = 1000;
    expect(GG.leaveBy(g, 'tra_no')).toBeNull();
    expect(g.gang).not.toBeNull();
    g.cash = 1000000;
    const r = GG.leaveBy(g, 'tra_no')!;
    expect(r.cash).toBe(G.GANG_LEAVES.find((l) => l.id === 'tra_no')!.cost);
    expect(g.cash).toBe(1000000 - r.cash);
    expect(g.gang).toBeNull();
  });

  it('“phản băng” không mất tiền nhưng mất uy tín phố, bị để mắt, và cả xóm nhớ mặt', () => {
    const g = withGang('hem', 200, 3); g.rep = 60; g.cash = 0;
    const r = GG.leaveBy(g, 'pha_dao')!;
    expect(r.cash).toBe(0);
    expect(g.rep).toBeLessThan(60);
    expect(g.flags.gangWatch).toBeGreaterThan(g.day);
    expect(g.flags.gangRatted).toBe(1);
    // Bị cả xóm nhớ mặt thì khách còn sợ hơn lúc đang trong băng.
    expect(GG.fearRate(g)).toBeGreaterThan(0);
  });

  it('“làm ăn thua lỗ để bị đuổi” mất nhiều tinh thần nhất', () => {
    const worst = G.GANG_LEAVES.slice().sort((a, b) => a.mood - b.mood)[0];
    expect(worst.id).toBe('bi_duoi');
  });

  it('rời băng rồi thì mọi thứ trở lại: không sợ băng, không phí đội thêm, không bị để ý thêm', () => {
    const g = withGang('hem', 200, 4); g.cash = 1000000;
    g.stall.tier = 3; g.stall.where = 'placed'; g.stall.spot = 'cho';
    GG.leaveBy(g, 'tra_no');
    expect(GG.downside(g).fear).toBe(0);
    expect(GG.gangRentExtra(g)).toBe(0);
    expect(GG.gangHeatPerDay(g)).toBe(0);
  });
});

describe('đàn em đi theo (bậc 5–6)', () => {
  it('bậc dưới 5 chưa dắt được ai', () => {
    expect(GG.maxCrew(withGang('hem', 300, 4))).toBe(0);
    const g = withGang('hem', 300, 4);
    expect(GG.setCrew(g, 2)).toBe(0);
  });

  it('bậc 5 dắt 2, đại ca dắt 3 — và không vượt trần', () => {
    expect(GG.maxCrew(withGang('hem', 500, 5))).toBe(2);
    const g = withGang('hem', 800, 6);
    expect(GG.maxCrew(g)).toBe(3);
    expect(GG.setCrew(g, 9)).toBe(3);
  });

  it('dắt đàn em thì ăn ít hơn mà bị để ý nhiều hơn — hai lưỡi thu nhỏ', () => {
    const solo = withGang('hem', 800, 6), crew = withGang('hem', 800, 6);
    GG.setCrew(crew, 2);
    for (const x of [solo, crew]) { x.min = 12 * 60; x.st.energy = 100; x.wanted = 0; }
    const a = GG.doJob(solo, 'gac')!, b = GG.doJob(crew, 'gac')!;
    expect(b.pay).toBeLessThan(a.pay);
    expect(crew.wanted).toBeGreaterThan(solo.wanted);
    expect(GG.crewCover(crew)).toBeGreaterThan(0.5);
  });

  it('bị bắt thì đàn em gánh bớt tiền phạt, nhưng vẫn mất hàng và mất đàn em', () => {
    const solo = withGang('hem', 300, 5), crew = withGang('hem', 300, 5);
    GG.setCrew(crew, 2);
    for (const x of [solo, crew]) { x.gang!.stock = { phao: 2 }; x.cash = 50000000; }
    const a = GG.bust(solo), b = GG.bust(crew);
    expect(b.fine).toBeLessThan(a.fine);
    expect(b.fine).toBeGreaterThan(0);
    expect(crew.gang!.crew).toBe(0);                              // bị bắt là đàn em bỏ đi hết
    expect(crew.gang!.stock).toEqual({});
  });
});

describe('đụng độ hai phe (lượt 72)', () => {
  it('chưa theo băng thì đi đâu cũng không bị chặn', () => {
    const g = fresh();
    expect(GG.clashAt(g, 'cho')).toBeNull();
    expect(GG.clashAt(g, 'laodong')).toBeNull();
  });

  it('đứng ở địa bàn mình thì không bị chặn; sang địa bàn đối thủ thì bị', () => {
    const g = withGang('hem', 0, 1);
    expect(GG.clashAt(g, 'laodong')).toBeNull();            // địa bàn băng mình
    // bậc 1 nên chưa ai nhận ra — chưa bị chặn
    expect(GG.clashAt(g, 'cho')).toBeNull();
    g.gang!.tier = 3;                                       // đủ “mặt mũi” thì bị chặn
    const c = GG.clashAt(g, 'cho');
    expect(c).not.toBeNull();
    expect(c!.rival).toBe('cho');
    expect(c!.line.length).toBeGreaterThan(30);
  });

  it('mỗi ngày chỉ một lần đụng độ, và “nói chuyện” lúc bậc thấp bị khinh', () => {
    const g = withGang('hem', 0, 2);
    const r = GG.resolveClash(g, 'noi')!;
    expect(r.respect).toBeLessThan(0);
    expect(r.rel).toBeLessThan(0);
    const c = GG.clashAt(g, 'cho');
    expect(c).toBeNull();                                    // hôm nay xử lý rồi
  });

  it('quay đầu mất uy tín trong băng nhưng không bị đụng', () => {
    const g = withGang('hem', 50, 3);
    const r = GG.resolveClash(g, 'quay')!;
    expect(g.gang!.respect).toBe(40);
    expect(r.health).toBe(0);
    expect(r.heat).toBe(0);
  });

  it('đứng lại: mất sức khoẻ thật, bị để ý, uy tín phố giảm — đổi lại uy tín trong băng tăng', () => {
    const g = withGang('hem', 50, 3); g.st.health = 90; g.rep = 40; g.wanted = 0;
    const r = GG.resolveClash(g, 'dung')!;
    expect(g.st.health).toBeLessThan(90);
    expect(g.st.health).toBeGreaterThan(0);                   // không bao giờ đánh chết người chơi
    expect(g.wanted).toBe(12);
    expect(g.rep).toBe(37);
    expect(g.gang!.respect).toBe(58);
    expect(r.rel).toBeLessThan(0);
  });
});

describe('bản lưu (lượt 72: đàn em + tin xấu)', () => {
  it('bản lưu cũ không dắt đàn em, không có tin xấu đang chờ', () => {
    const g = cleanGang({ id: 'cho', respect: 100, tier: 3 })!;
    expect(g.crew ?? 0).toBe(0);
    expect(g.trouble).toBeUndefined();
  });

  it('đàn em kẹp trần 3; mã tin xấu lạ thì bỏ', () => {
    expect(cleanGang({ id: 'cho', respect: 0, crew: 99 })!.crew).toBe(3);
    expect(cleanGang({ id: 'cho', respect: 0, trouble: 'la_hoac' })!.trouble).toBeUndefined();
    expect(cleanGang({ id: 'cho', respect: 0, trouble: 'nop_phan' })!.trouble).toBe('nop_phan');
  });
});
