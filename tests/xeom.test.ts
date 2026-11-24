// XE ÔM CHÚ BA (lượt 66) — ổng là người thật đứng dưới gầm cầu, có xe, có bảng giá theo quãng,
// chở được người chơi tới đích, và gọi điện thì chạy tới rước.
// Bài này canh đúng luật: giá theo quãng + mưa + chở nặng, thân quen thì bớt, không đủ tiền thì không chở,
// ăn chịu chưa trả thì từ chối, mỗi ngày giới hạn số lần gọi, và bản tin chỉ nhắc khi ổng THẬT SỰ đang đứng đó.
import { describe, it, expect } from 'vitest';
import { FIXED, FIXED_ROLE, REGULARS } from '../src/data/people';
import { PLACE_HOURS } from '../src/data/hours';
import { LANDMARK_BY_ID } from '../src/data/landmarks';
import { activate, contacts, CALL_FEE } from '../src/sim/phone';
import { advance } from '../src/sim/rules';
import { news } from '../src/sim/news';
import {
  XEOM_ID, XEOM_HOURS, FARE_IN, FARE_MID, FARE_FAR, RAIN_FEE, HEAVY_FEE, CALLS_PER_DAY, PICKUP_MIN,
  fare, rideMinutes, walkMinutes, onDuty, callsLeft, callXeom, pickupAt, shouldArrive, cancelPickup, waitingLeft,
} from '../src/sim/xeom';
import { fresh, IDLE } from './helpers';
// Chỉ đọc mã nguồn để canh chỗ dựng xe ngoài phố (giống cách các bài khác canh mã nguồn).
import sideRaw from '../src/world/side.ts?raw';

const boot = (cash = 60000) => { const g = fresh(); g.min = 9 * 60; activate(g, 'cucgach'); g.cash = cash; return g; };
const at = (g: ReturnType<typeof fresh>, m: number) => advance(g, m, IDLE);

describe('Chú Ba là người thật ngoài phố', () => {
  it('có trong danh sách nhân vật cố định, có nghề, có giờ đứng, và có neo trên bản đồ', () => {
    expect(FIXED[XEOM_ID]).toBeTruthy();
    expect(FIXED[XEOM_ID].name).toBe('Chú Ba xe ôm');
    expect(FIXED_ROLE[XEOM_ID]).toBeTruthy();
    expect(FIXED_ROLE[XEOM_ID]).not.toContain('Ba');          // chưa quen thì chưa biết tên
    expect(PLACE_HOURS[XEOM_ID]).toEqual(XEOM_HOURS);
    expect(LANDMARK_BY_ID.xeom.anchor).toBe('v_chu_ba');
  });

  it('vẫn là khách quen ăn trưa như cũ (một người, hai vai)', () => {
    const r = REGULARS.find((x) => x.id === XEOM_ID);
    expect(r).toBeTruthy();
    expect(r!.name).toBe('Chú Ba xe ôm');
    expect(r!.hour).toBeGreaterThan(10);
    expect(r!.hour).toBeLessThan(13);
  });

  it('dựng xe thật ngoài phố: neo v_chu_ba + xe máy + bảng giá ở đúng chỗ gầm cầu', () => {
    expect(sideRaw).toContain("b.anchor('v_chu_ba'");
    expect(sideRaw).toContain('b.bike(');
    expect(sideRaw).toContain('XE ÔM CHÚ BA');
    // neo phải nằm trong khối dựng gầm cầu (z ≈ 99) chứ không lạc sang chỗ khác
    const i = sideRaw.indexOf("b.anchor('v_chu_ba'");
    const block = sideRaw.slice(Math.max(0, i - 1200), i);
    expect(block).toContain("b.chunk('south', 0, 100)");
  });

  it('đúng giờ mới đứng đó: 5 giờ sáng tới 22 giờ 30', () => {
    const g = boot();
    g.min = 4 * 60; expect(onDuty(g)).toBe(false);
    g.min = 5 * 60; expect(onDuty(g)).toBe(true);
    g.min = 22 * 60; expect(onDuty(g)).toBe(true);
    g.min = 22 * 60 + 40; expect(onDuty(g)).toBe(false);
  });
});

describe('giá theo quãng đường', () => {
  it('ba mức giá dán ở đầu hẻm: trong xóm / phố bên / ra chợ', () => {
    const g = boot();
    expect(fare(g, 20)).toBe(FARE_IN);
    expect(fare(g, 44)).toBe(FARE_IN);
    expect(fare(g, 46)).toBe(FARE_MID);
    expect(fare(g, 94)).toBe(FARE_MID);
    expect(fare(g, 96)).toBe(FARE_FAR);
    expect(fare(g, 200)).toBe(FARE_FAR);
    // đi gần tới mức nào cũng không rẻ hơn mức sàn
    expect(fare(g, 0)).toBe(FARE_IN);
  });

  it('mưa thì phụ phí, chở gánh hàng / xe đẩy cũng phụ phí', () => {
    const g = boot();
    g.weather.now = 'nang'; expect(fare(g, 20)).toBe(FARE_IN);
    g.weather.now = 'mua';  expect(fare(g, 20)).toBe(FARE_IN + RAIN_FEE);
    expect(fare(g, 20, true)).toBe(FARE_IN + RAIN_FEE + HEAVY_FEE);
  });

  it('thân quen thì bớt tiền, nhưng không bao giờ dưới 2.000₫', () => {
    const g = boot();
    g.weather.now = 'nang';
    expect(fare(g, 20)).toBe(FARE_IN);
    g.rel[XEOM_ID] = { v: 30, n: 1, last: 0 };
    expect(fare(g, 20)).toBe(FARE_IN - 1000);
    g.rel[XEOM_ID] = { v: 70, n: 3, last: 0 };
    expect(fare(g, 20)).toBe(2000);            // 3.000 − 2.000 = 1.000 → chặn ở mức sàn
    expect(fare(g, 70)).toBe(FARE_MID - 2000); // quãng xa thì vẫn thấy rõ ơn thân quen
    g.rel[XEOM_ID] = { v: 100, n: 9, last: 0 };
    expect(fare(g, 20)).toBe(2000);
  });

  it('xe chạy nhanh hơn đi bộ khoảng ba lần', () => {
    for (const d of [30, 60, 90, 150]) {
      const ride = rideMinutes(d), walk = walkMinutes(d);
      expect(ride).toBeLessThan(walk);
      expect(walk / ride).toBeGreaterThanOrEqual(2.5);
      expect(walk / ride).toBeLessThanOrEqual(3.5);
    }
    expect(rideMinutes(0)).toBe(1);            // luôn mất ít nhất một phút
  });
});

describe('gọi điện nhờ ổng tới rước', () => {
  it('gọi được: tốn cước, hẹn giờ tới, tối đa 2 lần một ngày', () => {
    const g = boot();
    const before = g.cash;
    const r = callXeom(g);
    expect(r.ok).toBe(true);
    expect(g.cash).toBe(before - CALL_FEE);
    expect(pickupAt(g)).toBe(g.day * 1440 + g.min + PICKUP_MIN);
    expect(callsLeft(g)).toBe(CALLS_PER_DAY - 1);

    // đang có chuyến hẹn thì gọi nữa là vô ích (không trừ tiền)
    const cash2 = g.cash;
    expect(callXeom(g).ok).toBe(false);
    expect(g.cash).toBe(cash2);

    // huỷ rồi gọi lại tới khi hết lượt trong ngày
    cancelPickup(g); expect(callXeom(g).ok).toBe(true);
    cancelPickup(g);
    expect(callsLeft(g)).toBe(0);
    const cash3 = g.cash;
    expect(callXeom(g).ok).toBe(false);
    expect(g.cash).toBe(cash3);

    // sang ngày mới thì có lượt lại
    at(g, 24 * 60);
    expect(callsLeft(g)).toBe(CALLS_PER_DAY);
  });

  it('không gọi được khi: hết pin, ngoài giờ, không đủ cước, hoặc còn nợ tiền cơm', () => {
    const g = boot();
    g.phone!.battery = 0; expect(callXeom(g).ok).toBe(false); g.phone!.battery = 90;

    g.min = 3 * 60; expect(callXeom(g).ok).toBe(false); g.min = 9 * 60;   // khuya ổng về nhà

    g.cash = 500; expect(callXeom(g).ok).toBe(false); g.cash = 60000;      // không đủ cước

    g.rel[XEOM_ID] = { v: 20, n: 2, last: 0, owe: 35000 };
    const r = callXeom(g);
    expect(r.ok).toBe(false);
    expect(r.line).toContain('tiền cơm');
    delete g.rel[XEOM_ID].owe;
    expect(callXeom(g).ok).toBe(true);
  });

  it('tới đúng giờ hẹn, và quá 4 tiếng thì chuyến hẹn tự bỏ', () => {
    const g = boot();
    expect(callXeom(g).ok).toBe(true);
    expect(shouldArrive(g)).toBe(false);
    at(g, PICKUP_MIN);
    expect(shouldArrive(g)).toBe(true);
    expect(waitingLeft(g)).toBe(0);
    cancelPickup(g);
    expect(shouldArrive(g)).toBe(false);

    // hẹn rồi bỏ đi cả buổi → không để ổng “tới” vào nửa đêm
    expect(callXeom(g).ok).toBe(true);
    at(g, 300);
    expect(shouldArrive(g)).toBe(false);
  });
});

describe('danh bạ và bản tin', () => {
  it('biết mặt ổng (hoặc đã bán cho ổng) là có số trong danh bạ, đúng một dòng', () => {
    const g = boot();
    expect(contacts(g).some((c) => c.id === XEOM_ID)).toBe(false);
    g.met[XEOM_ID] = 0;
    const list = contacts(g).filter((c) => c.id === XEOM_ID);
    expect(list).toHaveLength(1);
    expect(list[0].hot).toBe('xeom');
    expect(list[0].name).toBe('Chú Ba xe ôm');
    expect(list[0].where).toContain('rước');
    // đã bán cho ổng lần nào cũng là quen → có số (không nhân đôi dòng)
    const g2 = boot(); g2.rel[XEOM_ID] = { v: 10, n: 2, last: 0 };
    expect(contacts(g2).filter((c) => c.id === XEOM_ID)).toHaveLength(1);
  });

  it('bản tin chỉ nhắc xe ôm đúng lúc ổng đứng dưới gầm cầu, và nói đúng giá đang áp', () => {
    const g = boot();
    g.min = 9 * 60;
    const n = news(g).find((x) => x.title.includes('Xe ôm'))!;
    expect(n).toBeTruthy();
    expect(n.body).toContain('gầm cầu');
    expect(n.body).toContain('3.000₫');
    expect(n.body).not.toContain('6.000₫');            // chưa mưa thì không có phụ phí

    g.weather.now = 'mua';
    const rain = news(g).find((x) => x.title.includes('Xe ôm'))!;
    expect(rain.body).toContain((FARE_IN + RAIN_FEE).toLocaleString('vi-VN').replace(/\u00a0/g, '.') + '₫');
    expect(rain.tone).toBe('hot');

    g.min = 1 * 60;                                      // 1 giờ sáng: ổng ngủ rồi
    expect(news(g).some((x) => x.title.includes('Xe ôm'))).toBe(false);
  });
});
