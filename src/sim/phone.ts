// ĐIỆN THOẠI: pin, sổ thu chi, danh bạ, tin nhắn, radio – nhạc – web WAP.
// Máy nào cũng chỉ là đồ trong ba lô (g.gear); g.phone giữ máy đang cắm sim và mức pin.
import { Game, absMin } from './state';
import { PHONES, PhoneDef, PhoneFeat } from '../data/phone';
import { FIXED, FIXED_ROLE, REGULARS } from '../data/people';
import { HOUSING, LENDERS } from '../data/gear';
import { WEATHER } from '../data/world';
import { clamp, money } from '../core/util';

/** Pin tụt bao nhiêu phần trăm mỗi giờ trong game khi chỉ để trong túi. */
export const DRAIN_PER_HOUR = 2.2;
export const CALL_FEE = 1000;
export const CHARGE_FEE = 5000;

/** Ba việc giải trí: mất bao lâu (phút), lên tinh thần bao nhiêu, tốn bao nhiêu phần trăm pin. */
export const FUN: Record<'radio' | 'music' | 'wap', { min: number; mood: number; pin: number; line: string }> = {
  radio: { min: 15, mood: 6, pin: 3, line: 'Radio FM đang đọc bản tin buổi sáng, xen mấy bài nhạc vàng. Nghe cũng đỡ buồn.' },
  music: { min: 15, mood: 8, pin: 4, line: 'Mở loa ngoài nghe nhạc, cả xóm nghe ké. Có bà hàng xóm còn hát theo.' },
  wap: { min: 10, mood: 5, pin: 6, line: 'WAP chậm rì, mỗi trang chờ cả phút. Nhưng cũng vào được tin tức với giá vàng.' },
};

export function phone(g: Game): PhoneDef | null { return g.phone ? PHONES[g.phone.id] ?? null : null; }
export function hasPhone(g: Game): boolean { return !!phone(g); }
export function battery(g: Game): number { return g.phone ? clamp(g.phone.battery, 0, 100) : 0; }
/** Máy còn pin thì mới mở được. */
export function isOn(g: Game): boolean { return hasPhone(g) && battery(g) > 0.5; }
export function canUse(g: Game, f: PhoneFeat): boolean { const m = phone(g); return !!m && m.feats.includes(f) && isOn(g); }

/** Thời gian trôi qua thì pin tụt. */
export function tick(g: Game, minutes: number) {
  if (!g.phone || minutes <= 0) return;
  g.phone.battery = clamp(g.phone.battery - (DRAIN_PER_HOUR * minutes) / 60, 0, 100);
}
export function drain(g: Game, pct: number) {
  if (!g.phone) return;
  g.phone.battery = clamp(g.phone.battery - pct, 0, 100);
}
/** Cắm sạc đầy (ngủ ở nhà có điện, hoặc trả tiền sạc nhờ). */
export function fullCharge(g: Game) { if (g.phone) g.phone.battery = 100; }
/** Nhà có điện để sạc qua đêm: chỗ thuê trả tiền mới có ổ cắm. */
export function hasPower(g: Game): boolean { return HOUSING[g.housing]?.rent > 0; }
export function canChargeAt(shopId: string): boolean { return shopId === 'kiosk' || shopId === 'mart'; }

export interface Sms { id: string; from: string; text: string; at: number; }

/** Tin nhắn trong máy — dựng từ tình hình hiện tại, không cần lưu vào bản lưu. */
export function smsList(g: Game): Sms[] {
  const now = absMin(g), out: Sms[] = [];
  for (const d of g.debts) {
    const L = LENDERS[d.lender], late = g.day > d.due;
    out.push({
      id: 'debt' + d.id, from: L.name,
      text: late ? `Khoản vay ${money(d.owed)} đã TRỄ ${g.day - d.due} ngày. Trả liền kẻo phí chồng phí.` : `Nhắc khoản vay ${money(d.owed)} — hạn ngày ${d.due + 1}. Trả đúng hẹn giùm.`,
      at: Math.max(0, d.taken * 1440 + 7 * 60),
    });
  }
  const h = HOUSING[g.housing];
  if (h && h.rent > 0 && g.day >= g.paidUntil) {
    out.push({ id: 'rent', from: 'Chủ trọ', text: `Tiền phòng ${money(h.rent)}/${h.per} tới hạn rồi nghen con.`, at: g.day * 1440 + 7 * 60 });
  }
  for (const r of REGULARS) {
    const rel = g.rel[r.id];
    if (rel && rel.v >= 15) out.push({ id: 'reg' + r.id, from: r.name, text: `Mai ${r.hour < 12 ? 'ghé sớm' : 'ghé'} nghen, có món gì ngon để dành cho cô/chú một phần.`, at: g.day * 1440 + 7 * 60 + 20 });
  }
  out.push({ id: 'spam' + g.day, from: '1900 1234', text: 'Chúc mừng! Số điện thoại của bạn trúng thưởng một xe Wave. Gọi lại để nhận (phí 5.000₫/phút).', at: g.day * 1440 + 8 * 60 });
  out.push({ id: 'wx' + g.day, from: 'Tổng đài 1080', text: `Dự báo hôm nay: ${WEATHER[g.weather.now].name.toLowerCase()}. ${WEATHER[g.weather.now].say}`, at: g.day * 1440 + 5 * 60 + 30 });
  return out.filter((s) => s.at <= now).sort((a, b) => b.at - a.at);
}
export function unread(g: Game): number {
  const seen = g.flags.smsSeen ?? 0;
  return smsList(g).filter((s) => s.at > seen).length;
}
export function markSeen(g: Game) { g.flags.smsSeen = Math.max(g.flags.smsSeen ?? 0, absMin(g)); }

export interface Contact { id: string; name: string; where: string; regular: boolean; }

/** Danh bạ: người đã quen (nhân vật cố định) và khách quen từng ghé. */
export function contacts(g: Game): Contact[] {
  const out: Contact[] = [];
  for (const id of Object.keys(FIXED)) {
    if (g.met[id] === undefined) continue;
    out.push({ id, name: FIXED[id].name, where: FIXED_ROLE[id] ?? 'Người trong xóm', regular: false });
  }
  for (const r of REGULARS) {
    const rel = g.rel[r.id];
    if (!rel || rel.n <= 0) continue;
    out.push({ id: r.id, name: r.name, where: `Khách quen · thường ghé ${Math.floor(r.hour)}h`, regular: true });
  }
  return out.sort((a, b) => Number(b.regular) - Number(a.regular) || a.name.localeCompare(b.name, 'vi'));
}

/** Gọi cho khách quen: tốn tiền cước, mỗi người một lần một ngày, thân hơn một chút. */
export function call(g: Game, id: string): { ok: boolean; line: string } {
  const r = REGULARS.find((x) => x.id === id);
  if (!r) return { ok: false, line: 'Số này không gọi được.' };
  if (!isOn(g)) return { ok: false, line: 'Máy hết pin, không gọi được.' };
  if (g.flags['call_' + id] === g.day) return { ok: false, line: 'Hôm nay gọi rồi, để mai.' };
  if (g.cash < CALL_FEE) return { ok: false, line: 'Không đủ tiền cước.' };
  g.cash -= CALL_FEE; g.led.other += CALL_FEE; g.flags['call_' + id] = g.day;
  const rel = g.rel[id] ?? (g.rel[id] = { v: 0, n: 0, last: -1 });
  rel.v = clamp(rel.v + 2, 0, 100);
  drain(g, 2);
  return { ok: true, line: `Alo… ${r.name} nghe máy: “Ừ, mai ghé nghen. Nghe tiếng là biết ai rồi.”` };
}

/** Nghe radio / nhạc / lướt WAP. Trả về null nếu máy không có chức năng đó hoặc đã hết pin. */
export function fun(g: Game, f: 'radio' | 'music' | 'wap') {
  if (!canUse(g, f)) return null;
  const c = FUN[f];
  drain(g, c.pin);
  return c;
}

/** Mua máy mới: máy cũ bị bán lại, máy mới pin đầy và cắm sim luôn. */
export function activate(g: Game, id: string) {
  for (const p of Object.values(PHONES)) if (p.id !== id) delete g.gear[p.id];
  g.gear[id] = 100;
  g.phone = { id, battery: 100 };
}
export function deactivate(g: Game, id: string) {
  if (g.phone?.id !== id) return;
  const other = Object.values(PHONES).find((p) => p.id !== id && g.gear[p.id] !== undefined);
  g.phone = other ? { id: other.id, battery: 100 } : null;
}
