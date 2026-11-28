// LƯỢT 73 — ĐE DOẠ NGƯỜI LẠ · SỰ KIỆN ĐÁNH NHAU · GIAO DIỆN KIỂU ANDROID.
// Người chơi dặn: “thêm nút đe doạ người lạ (tiền/đồ quý) khi thành viên băng cấp 4+”, “thêm event đánh nhau”,
// “animation chuẩn”, “giao diện gọn kiểu Android”. Bài này canh đúng mấy yêu cầu đó bằng số và bằng chữ.
import { describe, it, expect } from 'vitest';
import * as G from '../src/data/gang';
import * as GG from '../src/sim/gang';
import { SAVE_VERSION, cleanGang, Game } from '../src/sim/state';
import { fresh } from './helpers';

const withGang = (tier = 4, respect = 400) => {
  const g = fresh();
  g.gang = { id: 'hem', respect, tier, since: 0, jobsToday: 0, jobDay: -1, paid: 0, stock: {}, turfDay: -1 };
  return g as Game;
};

describe('đe doạ người lạ — chỉ bậc 4 trở lên', () => {
  it('ba mức đe doạ, mức càng nặng càng cần bậc cao và càng dễ bị báo công an', () => {
    expect(G.THREAT_KINDS.length).toBe(3);
    const tiers = G.THREAT_KINDS.map((k) => k.minTier);
    expect(tiers).toEqual([4, 5, 6]);
    // Tiền và mức bị để ý đều tăng dần: mức nặng phải đáng làm, nhưng có giá hơn.
    for (let i = 1; i < G.THREAT_KINDS.length; i++) {
      const a = G.THREAT_KINDS[i - 1], b = G.THREAT_KINDS[i];
      expect(b.cash[0]).toBeGreaterThan(a.cash[0]);
      expect(b.heat).toBeGreaterThan(a.heat);
      expect(b.report).toBeGreaterThan(a.report);
    }
    for (const k of G.THREAT_KINDS) {
      expect(k.say.length).toBeGreaterThan(10);
      expect(k.desc.length).toBeGreaterThan(10);
      // Lợi ích luôn kèm giá: mỗi mức đều làm xấu uy tín ngoài phố.
      expect(k.rep).toBeLessThan(0);
    }
  });

  it('chưa đủ bậc 4 thì không đe doạ được, và không mất gì', () => {
    for (const tier of [1, 2, 3]) {
      const g = withGang(tier);
      expect(GG.canThreat(g)).toBe(false);
      const cash = g.cash, heat = g.wanted;
      expect(GG.threaten(g, 'xin_de')).toBeNull();
      expect(g.cash).toBe(cash);
      expect(g.wanted).toBe(heat);
    }
    // người ngoài băng cũng không đe doạ được
    expect(GG.canThreat(fresh())).toBe(false);
  });

  it('bậc 4: đe doạ ra tiền thật, nhưng tăng mức bị để ý, tụt uy tín phố, và đếm số lần', () => {
    const g = withGang(4, 400);
    g.cash = 1000000; g.wanted = 10; g.rep = 50;
    const r = GG.threaten(g, 'xin_de')!;
    expect(r).not.toBeNull();
    expect(g.cash).toBeGreaterThan(1000000);      // tiền vào túi (có thể trừ phạt nếu bị báo)
    expect(r.cash).toBeGreaterThanOrEqual(30000);
    expect(r.cash).toBeLessThanOrEqual(70000);
    expect(r.heat).toBe(8);
    expect(GG.threatsOf(g)).toBe(1);
    expect(g.wanted).toBeGreaterThanOrEqual(18);   // 10 + 8, có thể thêm nếu bị báo
    expect(g.rep).toBeLessThan(50);
    expect(g.gang!.respect!).toBeGreaterThan(400); // uy tín TRONG băng tăng (băng ghi công)
  });

  it('bị báo công an thì tiền phạt tính theo mức bị để ý, và phạt nặng hơn hàng cấm', () => {
    // Cùng một mức để ý: án đe doạ nặng hơn án hàng cấm (đe doạ NGƯỜI, không phải hàng).
    expect(G.threatFine(40, 1)).toBeGreaterThan(GG.bustFine({ ...withGang(4), gang: { ...withGang(4).gang!, stock: { thuoc_la: 2 } } } as Game) + 1);
    expect(G.threatFine(60, 4)).toBeGreaterThan(G.threatFine(40, 1));
    expect(G.threatJail(0)).toBe(6);
    expect(G.threatJail(6)).toBeLessThanOrEqual(12);
  });

  it('đe doạ nhiều làm khách sợ bỏ đi (cộng vào fearRate), nhưng có trần 12 %', () => {
    const g = withGang(4);
    expect(GG.threatFear(g)).toBe(0);
    g.gang!.threats = 2;
    expect(GG.threatFear(g)).toBeCloseTo(0.03, 5);
    g.gang!.threats = 100;
    expect(GG.threatFear(g)).toBeCloseTo(0.12, 5);
  });

  it('số lần đe doạ được lưu vào bản lưu (v19) và đọc lại đúng', () => {
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(19);
    const raw: any = { id: 'hem', respect: 300, tier: 4, threats: 7 };
    expect(cleanGang(raw)!.threats).toBe(7);
    // dữ liệu rác thì về 0 chứ không NaN
    expect(cleanGang({ id: 'hem', threats: 'x' } as any)!.threats).toBe(0);
  });
});

describe('sự kiện đánh nhau', () => {
  it('bốn kiểu ẩu đả, kiểu nào cũng có câu mở lời, số đối thủ và giá phải trả', () => {
    expect(G.FIGHTS.length).toBe(4);
    for (const k of G.FIGHTS) {
      expect(k.foes).toBeGreaterThanOrEqual(2);
      expect(k.foes).toBeLessThanOrEqual(3);
      expect(k.line.length).toBeGreaterThan(30);
      expect(k.note.length).toBeGreaterThan(10);
      expect(k.loseHp).toBeGreaterThan(k.hit);   // thua nặng hơn trúng một đòn
      expect(k.respectWin).toBeGreaterThan(0);  // thắng được uy tín trong băng
    }
    // đòi nợ là kiểu duy nhất không dàn xếp được — với chủ nợ thì chỉ có trả, đánh, hoặc chạy.
    expect(G.FIGHTS.filter((k) => k.settle === 0).map((k) => k.id)).toEqual(['doi_no']);
  });

  it('cơ hội thắng: bậc cao, máu nhiều, có đàn em thì dễ hơn; đông đối thủ thì khó hơn', () => {
    const k = G.FIGHTS[0];
    const low = withGang(1, 0); low.st.health = 30;
    const high = withGang(6, 2000); high.st.health = 100;
    expect(GG.fightChance(high, k)).toBeGreaterThan(GG.fightChance(low, k));
    // luôn nằm trong khoảng an toàn: không bao giờ chắc thắng 100 %, cũng không bao giờ vô vọng
    for (const gg of [low, high, withGang(4)]) for (const kk of G.FIGHTS) {
      const c = GG.fightChance(gg, kk);
      expect(c).toBeGreaterThan(0.1);
      expect(c).toBeLessThan(0.96);
    }
    const solo = withGang(5, 800); solo.st.health = 80;
    const crew = withGang(5, 800); crew.st.health = 80; crew.gang!.crew = 2;
    expect(GG.fightChance(crew, G.FIGHTS[2])).toBeGreaterThan(GG.fightChance(solo, G.FIGHTS[2]));
  });

  it('ba lựa chọn đều có giá, không có cửa miễn phí', () => {
    const k = G.FIGHTS[0];
    // bỏ chạy: giữ máu, nhưng mất uy tín trong băng và bị để ý
    const chay = withGang(4, 500); chay.st.health = 80; chay.wanted = 5;
    const rc = GG.resolveFight(chay, k, 'chay');
    expect(rc.respect).toBeLessThan(0);
    expect(rc.heat).toBeGreaterThan(0);
    expect(rc.hp).toBeGreaterThan(-5);
    // dàn xếp: mất đúng số tiền ghi trong bảng
    const dx = withGang(4, 500); dx.cash = 500000;
    const rd = GG.resolveFight(dx, k, 'dan_xep');
    expect(rd.cash).toBe(-k.settle);
    expect(dx.cash).toBe(500000 - k.settle);
    // thắng: có tiền, có uy tín băng, nhưng bị để ý nặng
    const win = withGang(4, 500); win.st.health = 90;
    const rw = GG.resolveFight(win, k, 'danh', true);
    expect(rw.cash).toBeGreaterThan(0);
    expect(rw.respect).toBe(k.respectWin);
    expect(rw.heat).toBeGreaterThan(rd.heat);
    // thua: mất máu theo bảng, vẫn còn sống (không giết người chơi trong một đòn)
    const lose = withGang(4, 500); lose.st.health = 90;
    const rl = GG.resolveFight(lose, k, 'danh', false);
    expect(rl.hp).toBe(-k.loseHp);
    expect(lose.st.health).toBeGreaterThan(0);
  });

  it('giang hồ tới đòi nợ và băng khác phá quán xảy ra được cả khi KHÔNG theo băng', () => {
    // Có nợ quá hạn (không tính sổ ghi nợ của quán) ⇒ một ngày nào đó giang hồ gõ cửa.
    const g = fresh();
    g.debts.push({ id: 1, lender: 'shark', principal: 300000, owed: 360000, due: g.day - 1, late: 3, taken: 0, ext: 0 });
    let seen: string | null = null;
    for (let d = 0; d < 500 && !seen; d++) { g.flags.gangFightDay = -1; seen = GG.fightAt(g)?.id ?? null; }
    expect(seen).toBe('doi_no');
    // Sổ ghi nợ của quán (lender 'tab') thì không tính — chủ nợ là quán, không phải giang hồ.
    const t = fresh();
    t.debts.push({ id: 1, lender: 'tab', principal: 100000, owed: 100000, due: t.day - 1, late: 3, taken: 0, ext: 0 });
    for (let d = 0; d < 200; d++) { t.flags.gangFightDay = -1; expect(GG.fightAt(t)?.id === 'doi_no').toBe(false); }
    // Bán tốt mà không có băng đỡ lưng ⇒ có ngày bị tới phá quán.
    const s = fresh();
    s.stall.where = 'placed'; s.tot.served = 40; s.gang = null;
    let bao: string | null = null;
    for (let d = 0; d < 500 && !bao; d++) { s.flags.gangFightDay = -1; bao = GG.fightAt(s)?.id ?? null; }
    expect(bao).toBe('bao_ke');
  });

  it('mỗi ngày tối đa một ván; người ngoài băng thì không có ván nào', () => {
    expect(GG.fightAt(fresh())).toBeNull();
    const g = withGang(4, 500);
    g.flags.gangFightDay = g.day;   // hôm nay đánh rồi
    // dù điều kiện khác đúng, cũng không mở ván thứ hai trong ngày
    g.flags.rel_cho = -60; g.gang!.threats = 20;
    for (let i = 0; i < 40; i++) expect(GG.fightAt(g)).toBeNull();
  });

  it('bị úp sọt chỉ xảy ra khi quan hệ với băng đối thủ đã xấu hẳn (≤ −20)', () => {
    const g = withGang(4, 500);
    g.flags.rel_cho = 0;
    g.gang!.threats = 0;
    // quan hệ còn tốt mà đe doạ chưa tới 3 lần ⇒ không có ván nào, dù quay bao nhiêu lần
    for (let d = 0; d < 30; d++) { g.flags.gangFightDay = -1; expect(GG.fightAt(g)).toBeNull(); }
    // nới quan hệ xuống mức xấu ⇒ có ngày bị úp sọt
    let seen = false;
    for (let d = 0; d < 400 && !seen; d++) { g.flags.gangFightDay = -1; g.flags.rel_cho = -40; if (GG.fightAt(g)) seen = true; }
    expect(seen).toBe(true);
  });
});
