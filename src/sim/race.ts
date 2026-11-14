// ĐUA XE ĐẠP CHỦ NHẬT — luật thuần: 9 nhịp đạp (3 vòng × 3 khúc), ai bấm đúng giữa vùng thì ăn điểm.
// Tách khỏi phần đồ hoạ để kiểm thử được: cùng hạt giống thì cùng vùng ăn điểm, cùng đối thủ.
import { Game } from './state';
import { RNG } from '../core/util';

/** Số vòng và số nhịp mỗi vòng. */
export const LAPS = 3, BEATS_PER_LAP = 3, BEATS = LAPS * BEATS_PER_LAP;
/** Một nhịp quét từ 0 tới 1 trong chừng này giây. */
export const BEAT_SECONDS = 1.55;
/** Đăng ký mất bao nhiêu phút, đua mất bao nhiêu phút. */
export const ENTRY_MINS = 5, RACE_MINS = 25;
/** Thưởng cho người thắng, và uy tín cộng thêm. */
export const PRIZE = 40000, WIN_REP = 2.5, LOSE_REP = 0.5;
export const WIN_MOOD = 14, LOSE_MOOD = 5;
export const ENTRY_ENERGY = 12;
/** Giờ mở đăng ký (chủ nhật). */
export const RACE_HOURS = [14.5, 17.5] as const;

export interface Beat { lo: number; hi: number; }
export interface RaceTick { beat: number; pos: number; scores: number[]; done: boolean; }

/** Chủ nhật: ngày đầu tiên của ván là chủ nhật, rồi 7 ngày một lần. */
export const isRaceDay = (g: Game) => g.day % 7 === 0;
export const raceOpen = (g: Game, hour: number) => isRaceDay(g) && hour >= RACE_HOURS[0] && hour < RACE_HOURS[1];

/** Chín vùng ăn điểm của một lượt đua — cùng hạt giống thì y hệt nhau. */
export function makeBeats(seed: number): Beat[] {
  const R = new RNG(seed), out: Beat[] = [];
  for (let i = 0; i < BEATS; i++) {
    const w = 0.22 + R.range(0, 0.08), lo = 0.1 + R.range(0, 0.66 - w);
    out.push({ lo, hi: lo + w });
  }
  return out;
}
/** Bấm lúc con chạy ở `pos`: trúng giữa vùng được 1 điểm, lệch ra mép còn 0,45, trượt thì 0. */
export function quality(pos: number, b: Beat): number {
  if (pos < b.lo || pos > b.hi) return 0;
  const mid = (b.lo + b.hi) / 2, half = (b.hi - b.lo) / 2;
  return 1 - 0.55 * (Math.abs(pos - mid) / half);
}
/** Điểm của con nhỏ đua cùng: 0,42–0,72 mỗi nhịp, cố định theo hạt giống. */
export function rivalScore(seed: number): number {
  const h = Math.abs(Math.imul(seed | 0, 2654435761) % 1000) / 1000;
  return 0.42 + h * 0.3;
}
export interface Result { win: boolean; mine: number; rival: number; prize: number; rep: number; mood: number; }
/** So điểm 9 nhịp: hoà thì tính như thắng (nhóm con gái chấp). */
export function verdict(g: Game, seed: number, mine: number): Result {
  const rival = rivalScore(seed) * BEATS, win = mine >= rival - 1e-9;
  return {
    win, mine, rival, prize: win ? PRIZE : 0,
    rep: win ? WIN_REP : LOSE_REP, mood: win ? WIN_MOOD : LOSE_MOOD,
  };
}
/** Đã đua hôm nay chưa (mỗi ngày một lượt). */
export const racedToday = (g: Game) => g.flags.raceDay === g.day;
