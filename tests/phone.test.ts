// Điện thoại đời 2005–2010: ba mẫu máy, pin, sổ thu chi, danh bạ, tin nhắn, radio – nhạc – WAP.
import { describe, it, expect } from 'vitest';
import { SAVE_VERSION, migrate, newGame, absMin } from '../src/sim/state';
import { advance, buyGear, sellGear } from '../src/sim/rules';
import { PHONE_LIST, PHONES, FEAT_LABEL } from '../src/data/phone';
import {
  hasPhone, phone, battery, isOn, canUse, tick, drain, fullCharge, hasPower, canChargeAt,
  smsList, unread, markSeen, contacts, call, fun, activate, deactivate,
  DRAIN_PER_HOUR, CALL_FEE,
} from '../src/sim/phone';
import { fresh, IDLE } from './helpers';

const at = (g: ReturnType<typeof fresh>, minutes: number) => advance(g, minutes, IDLE);
const withPhone = (id = 'cucgach') => { const g = fresh(); activate(g, id); return g; };

describe('điện thoại', () => {
  it('ba mẫu máy: càng đắt càng nhiều chức năng, mẫu rẻ nhất cũng có sổ thu chi', () => {
    expect(PHONE_LIST).toHaveLength(3);
    const price = PHONE_LIST.map((p) => p.price);
    expect(price).toEqual([...price].sort((a, b) => a - b));
    for (const p of PHONE_LIST) {
      expect(p.feats).toContain('ledger');
      expect(p.feats).toContain('contacts');
      expect(p.feats).toContain('sms');
      expect(p.hours).toBeGreaterThan(10);
      for (const f of p.feats) expect(FEAT_LABEL[f]).toBeTruthy();
    }
    expect(PHONES.cucgach.feats).not.toContain('music');
    expect(PHONES.napgap.feats).toContain('music');
    expect(PHONES.camung.feats).toContain('wap');
  });

  it('mua máy: cắm sim, pin đầy, máy cũ bị bán lại', () => {
    const g = fresh(); g.cash = 3000000;
    expect(hasPhone(g)).toBe(false);
    expect(buyGear(g, 'cucgach')).toBe('ok');
    expect(phone(g)!.id).toBe('cucgach');
    expect(battery(g)).toBe(100);
    drain(g, 60);
    expect(buyGear(g, 'napgap')).toBe('ok');
    expect(phone(g)!.id).toBe('napgap');
    expect(g.gear.cucgach).toBeUndefined();
    expect(battery(g)).toBe(100);
  });

  it('bán máy thì mất sim, còn máy khác thì chuyển sang máy đó', () => {
    const g = fresh(); g.cash = 3000000;
    activate(g, 'cucgach'); activate(g, 'camung');
    expect(phone(g)!.id).toBe('camung');
    g.cash = 0;
    g.gear.cucgach = 100; // giả sử vẫn còn máy cũ trong ba lô
    sellGear(g, 'camung');
    expect(phone(g)!.id).toBe('cucgach');
    sellGear(g, 'cucgach');
    expect(hasPhone(g)).toBe(false);
  });

  it('pin tụt theo thời gian, không xuống dưới 0; hết pin thì không mở được', () => {
    const g = withPhone();
    at(g, 600); // 10 giờ
    expect(battery(g)).toBeCloseTo(100 - DRAIN_PER_HOUR * 10, 1);
    at(g, 2400); // quá 45 giờ là cạn pin
    expect(battery(g)).toBe(0);
    expect(isOn(g)).toBe(false);
    expect(canUse(g, 'sms')).toBe(false);
    fullCharge(g);
    expect(battery(g)).toBe(100);
    expect(isOn(g)).toBe(true);
  });

  it('máy không có chức năng thì không dùng được', () => {
    const g = withPhone('cucgach');
    expect(canUse(g, 'radio')).toBe(false);
    expect(fun(g, 'radio')).toBeNull();
    const g2 = withPhone('napgap');
    expect(canUse(g2, 'radio')).toBe(true);
    const r = fun(g2, 'radio')!;
    expect(r.mood).toBeGreaterThan(0);
    expect(battery(g2)).toBeLessThan(100);
  });

  it('sạc: chỉ nhà có điện mới sạc qua đêm, tạp hoá và siêu thị cho sạc nhờ', () => {
    const g = fresh();
    expect(hasPower(g)).toBe(false); // gầm cầu
    g.housing = 'tro';
    expect(hasPower(g)).toBe(true);
    expect(canChargeAt('kiosk')).toBe(true);
    expect(canChargeAt('mart')).toBe(true);
    expect(canChargeAt('equip')).toBe(false);
  });

  it('tin nhắn: nhắc nợ, nhắc tiền phòng, quảng cáo lừa, dự báo thời tiết', () => {
    const g = fresh();
    g.min = 12 * 60;
    g.debts.push({ id: 1, lender: 'bank', principal: 100000, owed: 120000, due: g.day + 2, late: 0, taken: g.day, ext: 0 });
    g.housing = 'tro'; g.paidUntil = g.day - 1;
    const list = smsList(g);
    const from = list.map((s) => s.from);
    expect(from).toContain('Ngân hàng Sao Vàng');
    expect(from).toContain('Chủ trọ');
    expect(from).toContain('Tổng đài 1080');
    expect(list.some((s) => s.text.includes('trúng thưởng'))).toBe(true);
    // tin nào cũng có thời điểm không ở tương lai
    for (const s of list) expect(s.at).toBeLessThanOrEqual(absMin(g));
  });

  it('tin chưa đọc đếm đúng, mở ra thì hết', () => {
    const g = fresh(); g.min = 12 * 60;
    const n = unread(g);
    expect(n).toBeGreaterThan(0);
    markSeen(g);
    expect(unread(g)).toBe(0);
    // hôm sau có tin mới
    g.day += 1;
    expect(unread(g)).toBeGreaterThan(0);
  });

  it('danh bạ chỉ có người đã quen, khách quen xếp trước', () => {
    const g = fresh();
    expect(contacts(g)).toHaveLength(0);
    g.met['kiosk'] = 0;
    g.rel['chu_ba'] = { v: 40, n: 3, last: 0 };
    const list = contacts(g);
    expect(list).toHaveLength(2);
    expect(list[0].regular).toBe(true);
    expect(list[1].name).toBe('Cô Ba');
  });

  it('gọi khách quen: mỗi người một lần một ngày, tốn cước, thân hơn', () => {
    const g = fresh(); g.cash = 50000;
    g.rel['chu_ba'] = { v: 10, n: 2, last: 0 };
    activate(g, 'cucgach');
    const before = g.cash, rel = g.rel['chu_ba'].v;
    expect(call(g, 'chu_ba').ok).toBe(true);
    expect(g.cash).toBe(before - CALL_FEE);
    expect(g.rel['chu_ba'].v).toBeGreaterThan(rel);
    expect(call(g, 'chu_ba').ok).toBe(false); // gọi lại trong ngày
    // người không phải khách quen
    g.met['kiosk'] = 0;
    expect(call(g, 'kiosk').ok).toBe(false);
    // hết pin
    const dead = withPhone(); drain(dead, 100); dead.cash = 50000;
    dead.rel['chu_ba'] = { v: 10, n: 2, last: 0 };
    expect(call(dead, 'chu_ba').ok).toBe(false);
  });

  it('không đủ tiền cước thì không gọi được', () => {
    const g = fresh(); g.cash = 0;
    g.rel['chu_ba'] = { v: 10, n: 2, last: 0 };
    activate(g, 'cucgach');
    expect(call(g, 'chu_ba').ok).toBe(false);
  });

  it('bản lưu cũ (v6) mở lên thì chưa có máy, không lỗi', () => {
    const raw = JSON.parse(JSON.stringify(newGame(7, 'anh')));
    raw.v = 6; delete raw.phone;
    const g = migrate(raw)!;
    expect(g.phone).toBeNull();
    expect(g.v).toBe(SAVE_VERSION);
  });

  it('bản lưu có máy thì giữ đúng pin', () => {
    const g = withPhone('camung'); drain(g, 35);
    const back = migrate(JSON.parse(JSON.stringify(g)))!;
    expect(back.phone!.id).toBe('camung');
    expect(back.phone!.battery).toBeCloseTo(65, 3);
  });
});
