// Hai số tổng đài trong danh bạ: 1080 dự báo thời tiết ngày mai, 1900 1234 "trúng thưởng" lừa đảo.
import { describe, it, expect } from 'vitest';
import { advance } from '../src/sim/rules';
import { WEATHER } from '../src/data/world';
import {
  activate, contacts, smsList, unread, markSeen, weatherForecast, callScam, scamTrip, scamArrive,
  scammed, knowsScam, hasScamSms, scamLoss,
  WX_FEE, WX_PER_DAY, SCAM_FEE, SCAM_SMS_DAY,
} from '../src/sim/phone';
import { fresh, IDLE } from './helpers';

const at = (g: ReturnType<typeof fresh>, minutes: number) => advance(g, minutes, IDLE);
const ready = (cash = 60000) => { const g = fresh(); activate(g, 'cucgach'); g.cash = cash; return g; };
const nextDay = (g: ReturnType<typeof fresh>) => at(g, 24 * 60 + 120); // sang ngày mới, 8 giờ sáng
const hotOf = (g: ReturnType<typeof fresh>) => contacts(g).filter((c) => c.hot).map((c) => c.hot);

describe('hai tổng đài trong danh bạ', () => {
  it('1080 có trong danh bạ từ đầu; 1900 1234 chỉ hiện sau khi nhận được tin nhắn', () => {
    const g = ready();
    expect(hotOf(g)).toEqual(['wx']);
    expect(g.day).toBeLessThan(SCAM_SMS_DAY);
    expect(knowsScam(g)).toBe(false);
    expect(smsList(g).some((s) => s.from === '1900 1234')).toBe(false);

    // sang ngày thứ hai, 8 giờ sáng: tin mời gọi tới máy → số lạ vào danh bạ
    at(g, 24 * 60 + 120);
    expect(g.day).toBe(1);
    expect(smsList(g).some((s) => s.from === '1900 1234' && s.text.includes('trúng thưởng'))).toBe(true);
    expect(hotOf(g)).toEqual(['scam', 'wx']);
    // số tổng đài đứng đầu, người quen xếp sau
    const list = contacts(g);
    expect(list.slice(0, 2).map((c) => c.hot)).toEqual(['scam', 'wx']);
  });

  it('gọi 1080: nghe dự báo ngày mai đúng với thời tiết kế tiếp, tốn 2.000₫ cước', () => {
    const g = ready();
    g.weather.now = 'nang'; g.weather.next = 'muato';
    at(g, 30);
    const before = g.cash;
    const r = weatherForecast(g);
    expect(r.ok).toBe(true);
    expect(r.next).toBe('muato');
    expect(r.line).toContain(WEATHER.muato.name.toLowerCase());
    expect(g.cash).toBe(before - WX_FEE);
    expect(g.led.other).toBe(WX_FEE);
    // dự báo đổi theo thời tiết, không phải câu cố định
    g.weather.next = 'lanh';
    const r2 = weatherForecast(g);
    expect(r2.next).toBe('lanh');
    expect(r2.line).not.toBe(r.line);
  });

  it('1080: hết pin, hết tiền thì không gọi được; gọi quá số lần trong ngày thì tổng đài từ chối', () => {
    const g = ready(100000);
    for (let i = 0; i < WX_PER_DAY; i++) expect(weatherForecast(g).ok).toBe(true);
    expect(weatherForecast(g).ok).toBe(false);
    expect(g.flags.wxCall).toBe(WX_PER_DAY);
    // mai lại gọi được
    at(g, 24 * 60);
    expect(weatherForecast(g).ok).toBe(true);

    const poor = ready(500); at(poor, 30);
    expect(weatherForecast(poor).ok).toBe(false);
    expect(poor.cash).toBe(500);
  });

  it('gọi 1900 1234: mất cước và bị hẹn lên chỗ không có ai — nhưng được một cơ hội quay về', () => {
    const g = ready(100000);
    nextDay(g);
    const before = g.cash;
    const r = callScam(g);
    expect(r.ok).toBe(true);
    expect(r.fee).toBe(SCAM_FEE);
    expect(g.cash).toBe(before - SCAM_FEE);
    expect(r.bait).toBeTruthy();
    expect(scammed(g)).toBe('once');
    // đang trên đường đi: mũi tên chỉ về đúng chỗ hẹn
    const trip = scamTrip(g)!;
    expect(trip.x).toBe(r.bait!.x);
    // gọi lại giữa đường thì không mất thêm tiền
    const mid = g.cash;
    expect(callScam(g).fee).toBe(0);
    expect(g.cash).toBe(mid);
  });

  it('cơ hội thứ nhất: quay về thì không mất tiền; vẫn tin thì mất thật, và chỉ bị lừa một lần', () => {
    const g = ready(100000);
    nextDay(g);
    const saved = ready(100000); nextDay(saved);
    callScam(saved);
    const cash0 = saved.cash, mood0 = saved.st.mood;
    const back = scamArrive(saved, 'back');
    expect(back.lost).toBe(0);
    expect(back.min).toBeGreaterThan(0);
    expect(saved.cash).toBe(cash0);
    expect(saved.st.mood).toBeGreaterThanOrEqual(mood0 - 2);
    expect(scammed(saved)).toBe('done');
    expect(scamTrip(saved)).toBe(null);
    // gọi lại sau đó: không mất thêm đồng nào
    expect(callScam(saved).fee).toBe(0);
    expect(saved.cash).toBe(cash0);

    callScam(g);
    const cash1 = g.cash;
    const lose = scamArrive(g, 'in');
    expect(lose.lost).toBeGreaterThan(0);
    expect(lose.lost).toBeLessThanOrEqual(scamLoss(cash1));
    expect(g.cash).toBe(cash1 - lose.lost);
    expect(g.led.other).toBeGreaterThanOrEqual(SCAM_FEE + lose.lost);
    expect(scammed(g)).toBe('done');
    // đã biết là lừa rồi thì không bị dắt thêm lần nữa
    expect(scamArrive(g, 'in').lost).toBe(0);
    expect(callScam(g).ok).toBe(true);
    expect(g.cash).toBe(cash1 - lose.lost);
  });

  it('mất tiền theo số tiền đang có, luôn trong khoảng 20.000–200.000₫', () => {
    expect(scamLoss(30000)).toBe(20000);
    expect(scamLoss(100000)).toBe(40000);
    expect(scamLoss(5000000)).toBe(200000);
    // có bao nhiêu đưa bấy nhiêu, không âm tiền
    const g = ready(12000); nextDay(g); callScam(g);
    const all = scamArrive(g, 'in');
    expect(all.lost).toBe(g.cash + all.lost);
    expect(g.cash).toBe(0);
  });

  it('tin 1900 1234 chỉ còn khi chưa gọi; gọi xong thì hộp thư sạch tin lừa và số vẫn nằm trong danh bạ', () => {
    const g = ready();
    nextDay(g);
    expect(hasScamSms(g)).toBe(true);
    markSeen(g);
    expect(unread(g)).toBe(0);
    callScam(g); scamArrive(g, 'back');
    expect(hasScamSms(g)).toBe(false);
    expect(smsList(g).some((s) => s.from === '1900 1234')).toBe(false);
    expect(hotOf(g)).toContain('scam');
  });
});
