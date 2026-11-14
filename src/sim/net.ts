// QUÁN NET: tính tiền theo giờ, chơi game – lướt web – xem phim, sạc nhờ điện thoại, mỏi mắt.
import { Game } from './state';
import { round500 } from '../core/util';

/** Giá một giờ máy (đời 2005–2010 ở xóm lao động). */
export const NET_RATE = 3000;
/** Xem phim tính thêm 50% vì tốn băng đĩa của quán. */
export const FILM_MUL = 1.5;
/** Quá chừng này phút trong một ngày là mỏi mắt, chơi tiếp chẳng còn vui. */
export const EYE_LIMIT = 120;
export const CHARGE_FEE = 2000;
export const DRINK_PRICE = 8000;

export type NetKind = 'game' | 'web' | 'film';
export interface NetAct { name: string; mood: number; energy: number; hunger: number; thirst: number; }
/** Hiệu ứng mỗi giờ chơi. */
export const NET_ACTS: Record<NetKind, NetAct> = {
  game: { name: 'Chơi game', mood: 18, energy: -2, hunger: -3, thirst: -4 },
  web: { name: 'Lướt web', mood: 12, energy: 0, hunger: -1, thirst: -2 },
  film: { name: 'Xem phim', mood: 22, energy: -1, hunger: -2, thirst: -3 },
};
/** Các gói giờ bán ở quán (phút). */
export const NET_PACKS = [30, 60, 120, 240];
/** Số máy trong quán (một máy hỏng, tính 9 máy dùng được). */
export const MACHINES = 10;

export function cost(kind: NetKind, minutes: number): number {
  return round500((NET_RATE * minutes) / 60 * (kind === 'film' ? FILM_MUL : 1));
}
/** Số phút đã ngồi quán hôm nay. */
export function todayMinutes(g: Game): number {
  return g.flags.netDay === g.day ? g.flags.netMin || 0 : 0;
}
/** Ngồi thêm chừng này phút nữa thì có bị mỏi mắt không. */
export function strain(g: Game, minutes: number): boolean {
  return todayMinutes(g) + minutes > EYE_LIMIT;
}

export interface Session {
  kind: NetKind; minutes: number; cost: number; mood: number; energy: number; hunger: number; thirst: number; health: number; tired: boolean;
}

/** Tính trước một lượt ngồi máy: tốn bao nhiêu, được gì. */
export function plan(g: Game, kind: NetKind, minutes: number): Session {
  const a = NET_ACTS[kind], h = minutes / 60, tired = strain(g, minutes);
  return {
    kind, minutes, cost: cost(kind, minutes),
    mood: Math.round(a.mood * h * (tired ? 0.7 : 1)),
    energy: Math.round(a.energy * h), hunger: Math.round(a.hunger * h), thirst: Math.round(a.thirst * h),
    health: tired ? -1 : 0, tired,
  };
}
/** Ghi nhận đã ngồi bao nhiêu phút trong ngày (để tính mỏi mắt). */
export function commit(g: Game, s: Session) {
  if (g.flags.netDay !== g.day) { g.flags.netDay = g.day; g.flags.netMin = 0; }
  g.flags.netMin = (g.flags.netMin || 0) + s.minutes;
}
/** Quán chỉ mở buổi sáng tới đêm. */
export const NET_OPEN = [6, 23] as const;
