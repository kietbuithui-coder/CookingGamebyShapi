// BĂNG ĐẢNG (lượt 71) — canh luật thuần: vào/ra băng, thăng chức, việc làm, hàng cấm, án phạt, tiền bảo kê.
// Người chơi yêu cầu: “hàng cấm vài loại / hình phạt nặng / xem băng đảng chi tiết / phe phái / nv băng đảng
// event / thăng chức”. Bài này canh đúng mấy chữ ấy bằng số.
import { describe, it, expect } from 'vitest';
import * as G from '../src/data/gang';
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
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(17);
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
