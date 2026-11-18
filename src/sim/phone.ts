// ĐIỆN THOẠI: pin, sổ thu chi, danh bạ, tin nhắn, radio – nhạc – web WAP.
// Máy nào cũng chỉ là đồ trong ba lô (g.gear); g.phone giữ máy đang cắm sim và mức pin.
import { Game, absMin } from './state';
import { PHONES, PhoneDef, PhoneFeat } from '../data/phone';
import { FIXED, FIXED_ROLE, REGULARS } from '../data/people';
import { HOUSING, LENDERS } from '../data/gear';
import { WEATHER, WeatherId } from '../data/world';
import { clamp, money, round1k } from '../core/util';

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
  if (hasScamSms(g) && scammed(g) === 'none') out.push({ id: 'spam' + g.day, from: '1900 1234', text: 'Chúc mừng! Số điện thoại của bạn trúng thưởng một xe Wave. Gọi lại số này để nhận (phí 5.000₫/phút).', at: g.day * 1440 + 8 * 60 });
  const wn = WEATHER[g.weather.now];
  out.push({ id: 'wx' + g.day, from: 'Tổng đài 1080', text: `Hôm nay ${wn.name.toLowerCase()}. Cần biết ngày mai ra sao thì gọi 1080 (2.000₫/phút) — có trong danh bạ.`, at: g.day * 1440 + 5 * 60 + 30 });
  return out.filter((s) => s.at <= now).sort((a, b) => b.at - a.at);
}
export function unread(g: Game): number {
  const seen = g.flags.smsSeen ?? 0;
  return smsList(g).filter((s) => s.at > seen).length;
}
export function markSeen(g: Game) { g.flags.smsSeen = Math.max(g.flags.smsSeen ?? 0, absMin(g)); }

export interface Contact {
  id: string; name: string; where: string; regular: boolean;
  /** Số tổng đài đặc biệt: `'wx'` = 1080 dự báo thời tiết, `'scam'` = 1900 1234 trúng thưởng. */
  hot?: 'wx' | 'scam';
}

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
  // Hai số tổng đài đứng đầu danh bạ. 1900 1234 chỉ xuất hiện sau khi tin nhắn mời gọi tới máy.
  out.unshift({ id: 'wx1080', name: 'Tổng đài 1080', where: 'Dự báo thời tiết ngày mai · 2.000₫/phút', regular: false, hot: 'wx' });
  if (knowsScam(g)) out.unshift({
    id: 'scam1900', name: '1900 1234', regular: false, hot: 'scam',
    where: scammed(g) === 'done' ? 'Số lừa đảo — bạn đã biết rồi' : 'Số lạ gửi tin “trúng thưởng” · cước 15.000₫',
  });
  return out.sort((a, b) => Number(!!b.hot) - Number(!!a.hot) || Number(b.regular) - Number(a.regular) || a.name.localeCompare(b.name, 'vi'));
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

// ───────────────────────── Hai số đặc biệt: 1080 (dự báo) và 1900 1234 (lừa đảo) ─────────────────────────
/** Cước một phút gọi tổng đài 1080 (tính tròn 1 phút cho gọn). */
export const WX_FEE = 2000;
/** Số lần gọi 1080 mỗi ngày (gọi lại thì tính tiền tiếp nhưng vẫn nghe lại được). */
export const WX_PER_DAY = 3;
/** Tổng đài 1080 có trong danh bạ ngay từ đầu, 1900 1234 chỉ hiện sau khi nhận tin nhắn mời gọi. */
export const HOTLINES = { wx: '1080', scam: '1900 1234' } as const;
/** Tin nhắn mời gọi của 1900 1234 tới từ ngày thứ hai — ngày đầu máy còn “sạch”, chỉ có tổng đài 1080. */
export const SCAM_SMS_EVERY = 3;
export const SCAM_SMS_DAY = 1;
/**
 * Dự báo thời tiết cho ngày mai — nói ra cho người chơi nghe (tổng đài 1080).
 * Trời đang mưa/giông/bão thì "mai" là thời tiết kế tiếp sau khi tan; còn lại thì chính là `weather.next`.
 * Trả `null` khi máy không gọi được (chưa có máy / hết pin / không đủ tiền).
 */
export function weatherForecast(g: Game, force = false): { ok: boolean; line: string; fee: number; next: WeatherId } {
  const next = g.weather.until <= absMin(g) ? g.weather.now : g.weather.next;
  const w = WEATHER[next];
  const n = g.flags.wxDay === g.day ? (g.flags.wxCall ?? 0) : 0;
  if (!isOn(g)) return { ok: false, line: 'Máy hết pin, không gọi được. Sạc rồi gọi lại.', fee: 0, next };
  if (g.cash < WX_FEE) return { ok: false, line: 'Không đủ tiền cước, cần 2.000₫.', fee: 0, next };
  if (!force && n >= WX_PER_DAY) return { ok: false, line: 'Tổng đài báo hôm nay gọi nhiều lần rồi — mai gọi lại nghen.', fee: 0, next };
  g.cash -= WX_FEE; g.led.other += WX_FEE; g.flags.wxCall = n + 1; g.flags.wxDay = g.day; drain(g, 1.5);
  const temp = w.hot > 0.3 ? 'trời nóng, ai cũng thèm món mát' : w.hot < -0.3 ? 'trời se lạnh, món nóng dễ bán' : 'thời tiết dễ chịu';
  const warn = w.rain > 0.5 ? ' Nhớ đem ô dù và che quầy nghen.' : w.wind > 0.6 ? ' Gió lớn, coi chừng bếp lửa.' : w.damage > 0 ? ' Mưa gió làm hư quầy đó nghen.' : '';
  return {
    ok: true, fee: WX_FEE, next,
    line: `“Chào bạn, tổng đài 1080. Dự báo mai: ${w.name.toLowerCase()}. ${w.say}” — ${temp}.${warn}`,
  };
}
/**
 * Tin mời gọi của 1900 1234 có tới máy hôm nay không: không phải ngày nào cũng nhắn — cứ cách ba hôm
 * lại nhắn một lần (ngày 1, 4, 7…), và thôi nhắn hẳn khi người chơi đã gọi.
 */
export function hasScamSms(g: Game): boolean {
  return scammed(g) === 'none' && g.day >= SCAM_SMS_DAY && g.day % SCAM_SMS_EVERY === SCAM_SMS_DAY % SCAM_SMS_EVERY;
}
/** Đã từng nhận tin của 1900 1234 (hoặc đã gọi) — từ đó số này nằm luôn trong danh bạ. */
export function knowsScam(g: Game): boolean { return g.day >= SCAM_SMS_DAY || scammed(g) !== 'none'; }
/** Cước một lần gọi 1900 1234. */
export const SCAM_FEE = 15000;
/** Kết quả gọi 1900 1234: `'once'` nghĩa là còn một cơ hội quay lại, `'done'` là đã gọi hết. */
export function scammed(g: Game): 'none' | 'once' | 'done' {
  const n = g.flags.scamCall ?? 0;
  return n <= 0 ? 'none' : n === 1 ? 'once' : 'done';
}
/**
 * Gọi 1900 1234 — tổng đài "trúng thưởng". Luôn lừa: mất 15.000₫ cước và bị hẹn lên một "văn phòng"
 * ở ngõ cụt sau chợ. Tới nơi người chơi được MỘT cơ hội nghe ngóng rồi quay về (không mất gì); nếu vẫn tin
 * lời thì bỏ tiền vào cái thùng ở đó và mất thật. Chuyện chỉ xảy ra một lần — gọi lại thì đầu dây kia im luôn.
 */
export function callScam(g: Game): { ok: boolean; line: string; fee: number; bait?: { place: string; x: number; z: number } } {
  const st = scammed(g);
  if (!isOn(g)) return { ok: false, line: 'Máy hết pin, không gọi được.', fee: 0 };
  if (st === 'done') return { ok: true, line: '“Thuê bao quý khách vừa gọi không tồn tại. Vui lòng kiểm tra lại.” — Bạn cúp máy, tự cười: lừa một lần là đủ.', fee: 0 };
  if (st === 'once') return { ok: true, line: 'Bạn đang trên đường tới điểm hẹn nhận thưởng rồi — đi tới đó trước đã (mũi tên vàng).', fee: 0 };
  const fee = Math.min(SCAM_FEE, g.cash);
  if (fee <= 0) return { ok: false, line: 'Không còn đồng nào để trả cước — cũng may.', fee: 0 };
  g.cash -= fee; g.led.other += fee; g.flags.scamCall = 1; g.flags.scamDay = g.day; drain(g, 3);
  const bait = { ...SCAM_SPOT };
  g.flags.scamX = bait.x; g.flags.scamZ = bait.z;
  return { ok: true, fee, bait, line: `Đầu dây bên kia: “Chúc mừng quý khách trúng một xe Wave! Mời lên văn phòng nhận thưởng trước 17 giờ, mang theo 5.000₫ lệ phí.”` };
}

/** Đang trên đường đi nhận thưởng (đã gọi 1900 1234 và chưa tới nơi). */
export function scamTrip(g: Game): { x: number; z: number; place: string } | null {
  if (scammed(g) !== 'once') return null;
  return { x: g.flags.scamX ?? SCAM_SPOT.x, z: g.flags.scamZ ?? SCAM_SPOT.z, place: SCAM_SPOT.place };
}
/**
 * Chỗ hẹn “nhận thưởng”: một ngõ cụt sau dãy sạp phía nam chợ Xóm Chiều — tường gạch, cửa cuốn đóng,
 * cái thùng gỗ họ bảo bỏ “lệ phí” vào. Không có văn phòng nào cả.
 */
export const SCAM_SPOT = { x: -75.2, z: 18.6, place: 'Ngõ cụt sau chợ Xóm Chiều' };
/** Mức mất tiền nếu vẫn tin lời “nhận thưởng”: 40% tiền mặt, kẹp trong 20.000–200.000₫. */
export const scamLoss = (cash: number) => clamp(round1k(cash * 0.4), 20000, 200000);
/**
 * Tới chỗ hẹn nhận thưởng: không có văn phòng nào, cũng chẳng có xe Wave — chỉ có tờ giấy dán tường ghi
 * “1900 1234 là số lừa đảo”. `'back'` = người chơi nghe ngóng rồi quay về (chỉ mất thời gian đi lại);
 * `'in'` = vẫn tin, đưa tiền “lệ phí” rồi bị dắt lòng vòng cả buổi.
 */
export function scamArrive(g: Game, choice: 'in' | 'back'): { lost: number; min: number; line: string } {
  if (scammed(g) !== 'once') return { lost: 0, min: 0, line: '' };
  g.flags.scamCall = 2; g.flags.scamDay = g.day;
  if (choice === 'back') {
    g.st.mood = clamp(g.st.mood + 4, 0, 100);
    return { lost: 0, min: 20, line: 'Bạn đứng ngó một lúc: cửa cuốn đóng, không một bóng người, chỉ có tờ giấy dán tường “1900 1234 là số lừa đảo”. Quay về, trong bụng vừa may vừa tức.' };
  }
  const lost = Math.min(g.cash, scamLoss(g.cash));
  g.cash -= lost; g.led.other += lost;
  g.st.mood = clamp(g.st.mood - 16, 0, 100); g.st.energy = clamp(g.st.energy - 8, 0, 100);
  return { lost, min: 90, line: `Bạn bỏ ${money(lost)} vào thùng rồi đứng chờ. Chờ mãi, chờ mãi — tới khi trời tối mới hiểu: không có xe Wave nào cả, chỉ có buổi chiều mất trắng.` };
}
