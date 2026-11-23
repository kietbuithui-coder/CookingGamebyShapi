// XE ÔM CHÚ BA — giá theo quãng đường, giờ làm việc, gọi điện hẹn rước.
// Tệp này là LUẬT (dữ liệu thuần, không DOM, không three) để test chạy được trong Node:
// phần dựng xe ngoài phố nằm ở `world/city.ts`, phần nói chuyện nằm ở `game/acts.ts`.
//
// Chú Ba là **người thật** đứng dưới gầm cầu (nhân vật cố định `FIXED.chu_ba`, neo `v_chu_ba`)
// và cũng là khách quen ăn trưa trong `REGULARS` — cùng một người, cùng một mã, nên quan hệ
// (thân quen, ăn chịu) tính chung.
import { Game, absMin, hourOf } from './state';
import { WEATHER } from '../data/world';
import { isOn, CALL_FEE } from './phone';

/** Mã nhân vật / mã liên lạc — trùng với `FIXED.chu_ba` và `REGULARS.chu_ba`. */
export const XEOM_ID = 'chu_ba';
/** Giờ ổng ra đứng dưới gầm cầu (trùng `PLACE_HOURS.chu_ba`). */
export const XEOM_HOURS: [number, number] = [5, 22.5];
/** Ba mức giá theo quãng: trong xóm / sang phố bên / ra tận chợ hay bến. */
export const FARE_IN = 3000, FARE_MID = 5000, FARE_FAR = 8000;
/** Trời mưa thì phụ phí (ướt áo, chạy chậm, dễ bị công an kêu). */
export const RAIN_FEE = 2000;
/** Chở thêm gánh hàng / xe đẩy thì nặng xe, ổng lấy thêm. */
export const HEAVY_FEE = 2000;
/** Đi bộ được khoảng 4,4 m mỗi phút trong game; xe máy chạy nhanh hơn ~3 lần. */
export const WALK_M_PER_MIN = 4.4;
export const RIDE_M_PER_MIN = 13;
/** Số phút game ổng chạy tới sau khi gọi (xe máy đi xa hơn đi bộ nhiều). */
export const PICKUP_MIN = 3;
/** Mỗi ngày gọi được mấy lần (gọi lại tính thêm cước như gọi điện thường). */
export const CALLS_PER_DAY = 2;

/** Đang mưa to (phụ phí) hay không — lấy đúng thời tiết của ván. */
export const raining = (g: Game) => WEATHER[g.weather.now].rain > 0.3;

/**
 * Tiền một chuyến: theo quãng (3 mức như bảng giá dán ở đầu hẻm), cộng phụ phí mưa,
 * trừ ơn thân quen (quen rồi bớt 1.000₫, thân thiết bớt 2.000₫). Không bao giờ dưới 2.000₫.
 */
export function fare(g: Game, dist: number, heavy = false): number {
  let base = dist < 45 ? FARE_IN : dist < 95 ? FARE_MID : FARE_FAR;
  if (raining(g)) base += RAIN_FEE;
  if (heavy) base += HEAVY_FEE;
  const rel = g.rel[XEOM_ID]?.v ?? 0;
  if (rel >= 60) base -= 2000;
  else if (rel >= 25) base -= 1000;
  return Math.max(2000, base);
}
/** Bao nhiêu phút game để chạy hết quãng đó (tối thiểu 1 phút). */
export function rideMinutes(dist: number): number { return Math.max(1, Math.round(dist / RIDE_M_PER_MIN)); }
/** Đi bộ hết quãng đó mất bao nhiêu phút — để nói “nhanh hơn đi bộ ba lần”. */
export function walkMinutes(dist: number): number { return Math.max(1, Math.round(dist / WALK_M_PER_MIN)); }

/** Chú Ba có đang đứng ở chỗ của ổng lúc này không (5h–22h30). */
export function onDuty(g: Game): boolean { const h = hourOf(g); return h >= XEOM_HOURS[0] && h < XEOM_HOURS[1]; }
/** Còn mấy lần gọi trong ngày. */
export function callsLeft(g: Game): number {
  const n = g.flags.xeomDay === g.day ? (g.flags.xeomN ?? 0) : 0;
  return Math.max(0, CALLS_PER_DAY - n);
}
/** Thời điểm ổng tới (phút tuyệt đối), -1 nếu không có chuyến nào đang hẹn. */
export function pickupAt(g: Game): number { const t = g.flags.xeomAt; return t === undefined || t < 0 ? -1 : t; }
/** Chuyến hẹn đã tới giờ chưa — dùng cho vòng cập nhật của `game/acts`. */
export function shouldArrive(g: Game): boolean {
  const t = pickupAt(g);
  // Hẹn quá cũ (người chơi bỏ đi cả ngày) thì bỏ, không để ổng “tới” vào hôm sau.
  return t >= 0 && absMin(g) >= t && absMin(g) - t <= 240;
}
export function waitingLeft(g: Game): number { const t = pickupAt(g); return t < 0 ? 0 : Math.max(0, t - absMin(g)); }
export function cancelPickup(g: Game) { delete g.flags.xeomAt; }

/**
 * Alo cho Chú Ba. Máy phải còn pin, đủ tiền cước, và không ăn chịu chưa trả (ổng dễ tính nhưng
 * không quên tiền cơm). Trả về câu ổng nói trên máy để hiện trong cuộc gọi.
 */
export function callXeom(g: Game): { ok: boolean; line: string; at?: number } {
  if (!isOn(g)) return { ok: false, line: 'Máy hết pin, không gọi được.' };
  if (pickupAt(g) >= 0) return { ok: false, line: 'Chú Ba đang trên đường tới rồi, đứng đó chờ nghen.' };
  const owe = g.rel[XEOM_ID]?.owe ?? 0;
  if (owe > 0) return { ok: false, line: `“Khoan đã con — còn ${Math.round(owe / 1000)} ngàn tiền cơm bữa trước chưa trả. Trả rồi chú chở.”` };
  if (!onDuty(g)) return { ok: false, line: '“Khuya rồi con, chú về nhà rồi. Sáng mai chú ra gầm cầu.”' };
  if (callsLeft(g) <= 0) return { ok: false, line: 'Hôm nay gọi hoài vậy — chú còn khách khác nữa. Mai nghen.' };
  if (g.cash < CALL_FEE) return { ok: false, line: 'Không đủ tiền cước.' };
  g.cash -= CALL_FEE; g.led.other += CALL_FEE;
  if (g.flags.xeomDay !== g.day) { g.flags.xeomDay = g.day; g.flags.xeomN = 0; }
  g.flags.xeomN = (g.flags.xeomN ?? 0) + 1;
  const at = absMin(g) + PICKUP_MIN;
  g.flags.xeomAt = at;
  return { ok: true, at, line: `Alo, chú Ba xe ôm đây. ${PICKUP_MIN} phút nữa chú tới chỗ con đứng — kiếm chỗ nào dễ thấy mà đứng nghen.` };
}
