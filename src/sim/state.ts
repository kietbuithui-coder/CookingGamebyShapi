// TRẠNG THÁI GAME — toàn bộ dữ liệu cần lưu. Chỉ là dữ liệu thuần (JSON), không phụ thuộc đồ hoạ.
import { ING_LIST, INGS } from '../data/ingredients';
import { RECIPE_LIST, START_RECIPES } from '../data/recipes';
import { JUNK } from '../data/gear';
import type { WeatherId } from '../data/world';
import { PLACES } from '../world/layout';

export const SAVE_VERSION = 3;
/** Một lô nguyên liệu. fresh 0–100, q chất lượng 0–1, cost giá vốn mỗi đơn vị. */
export interface Stack { id: string; n: number; fresh: number; q: number; cost: number; }
/** Mẻ sơ chế sẵn ("cốt" món). */
export interface Prep { rid: string; n: number; q: number; at: number; cost: number; }
/** Phần ăn đã hoàn thiện, đang để trên khay. */
export interface Ready { rid: string; n: number; q: number; at: number; cost: number; }
export interface Debt { id: number; lender: string; principal: number; owed: number; due: number; late: number; taken: number; ext: number; }
export interface LedgerDay {
  day: number; revenue: number; tips: number; side: number; cogs: number; fees: number; rent: number; gear: number; loss: number; interest: number;
  food: number; other: number; sold: number; customers: number; lost: number; stars: number; rated: number;
}
export interface Stats { hunger: number; thirst: number; energy: number; health: number; hygiene: number; mood: number; }
export interface RecState { known: boolean; price: number; on: boolean; made: number; best: number; }
export interface Rel { v: number; n: number; last: number; owe?: number; }
export interface ActiveEvent { id: string; until: number; data?: any; }
export interface Stall {
  tier: number; where: 'none' | 'home' | 'carried' | 'placed'; spot: string | null; x: number; z: number; yaw: number;
  cond: number; open: boolean; store: Stack[]; preps: Prep[]; ready: Ready[]; fuel: number; fuelKind: string; paidDay: number; dirt: number;
}
export interface Game {
  v: number; seed: number; ac: 'anh' | 'chị';
  day: number; min: number;
  cash: number; bank: number;
  st: Stats; rep: number; xp: number;
  pos: { x: number; z: number; yaw: number; pitch: number };
  bag: Stack[]; junk: Record<string, number>; meals: Ready[];
  gear: Record<string, number>;
  housing: string; paidUntil: number; home: Stack[];
  stall: Stall;
  rec: Record<string, RecState>;
  debts: Debt[]; debtSeq: number; credit: number;
  led: LedgerDay; hist: LedgerDay[];
  rel: Record<string, Rel>;
  flags: Record<string, number>;
  weather: { now: WeatherId; until: number; next: WeatherId; flood: number; wet: number };
  ev: { active: ActiveEvent[]; last: Record<string, number>; check: number; lastStart: number };
  wd: { litterDay: number; picked: number[]; bins: Record<number, number>; sacks: number; plates: number; deliveries: number; begTired: number; outOf: string[]; haggled: Record<string, number>; job: any; };
  tot: { served: number; earned: number; begged: number; scrap: number; best: number; bankrupt: number };
  quest: number;
}

export const absMin = (g: Game) => g.day * 1440 + g.min;
export const hourOf = (g: Game) => g.min / 60;
export function newLedger(day: number): LedgerDay {
  return { day, revenue: 0, tips: 0, side: 0, cogs: 0, fees: 0, rent: 0, gear: 0, loss: 0, interest: 0, food: 0, other: 0, sold: 0, customers: 0, lost: 0, stars: 0, rated: 0 };
}
export function emptyStall(): Stall {
  return { tier: 0, where: 'none', spot: null, x: 0, z: 0, yaw: 0, cond: 100, open: false, store: [], preps: [], ready: [], fuel: 0, fuelKind: '', paidDay: -1, dirt: 0 };
}

export function newGame(seed = (Math.random() * 1e9) | 0, ac: 'anh' | 'chị' = 'anh'): Game {
  const rec: Record<string, RecState> = {};
  for (const r of RECIPE_LIST) rec[r.id] = { known: START_RECIPES.includes(r.id), price: r.ref, on: false, made: 0, best: 0 };
  return {
    v: SAVE_VERSION, seed, ac, day: 0, min: 6 * 60 + 10, cash: 18000, bank: 0,
    st: { hunger: 58, thirst: 55, energy: 82, health: 92, hygiene: 42, mood: 45 }, rep: 0, xp: 0,
    pos: { x: PLACES.camp.x, z: PLACES.camp.z - 1.2, yaw: Math.PI, pitch: 0 },
    bag: [], junk: {}, meals: [], gear: {}, housing: 'gamcau', paidUntil: 0, home: [],
    stall: emptyStall(), rec, debts: [], debtSeq: 1, credit: 0,
    led: newLedger(0), hist: [], rel: {}, flags: {},
    weather: { now: 'nang', until: 6 * 60 + 10 + 420, next: 'nang', flood: 0, wet: 0 },
    ev: { active: [], last: {}, check: 9 * 60, lastStart: -999 },
    wd: { litterDay: -1, picked: [], bins: {}, sacks: 0, plates: 0, deliveries: 0, begTired: 0, outOf: [], haggled: {}, job: null },
    tot: { served: 0, earned: 0, begged: 0, scrap: 0, best: 0, bankrupt: 0 }, quest: 0,
  };
}

/** Chuyển save cũ lên phiên bản mới (giữ dữ liệu người chơi khi game cập nhật). */
export function migrate(raw: any): Game | null {
  if (!raw || typeof raw !== 'object' || typeof raw.day !== 'number') return null;
  const base = newGame(raw.seed ?? 1, raw.ac ?? 'anh');
  const g: Game = { ...base, ...raw, st: { ...base.st, ...raw.st }, stall: { ...base.stall, ...raw.stall }, weather: { ...base.weather, ...raw.weather },
    ev: { ...base.ev, ...raw.ev }, wd: { ...base.wd, ...raw.wd }, tot: { ...base.tot, ...raw.tot }, led: { ...base.led, ...raw.led }, rec: { ...base.rec } };
  for (const r of RECIPE_LIST) if (raw.rec?.[r.id]) g.rec[r.id] = { ...base.rec[r.id], ...raw.rec[r.id] };
  const clean = (l: Stack[]) => (Array.isArray(l) ? l.filter((s) => s && INGS[s.id] && s.n > 0) : []);
  g.bag = clean(g.bag); g.home = clean(g.home); g.stall.store = clean(g.stall.store);
  for (const k of Object.keys(g.junk)) if (!JUNK[k]) delete g.junk[k];
  g.v = SAVE_VERSION;
  return g;
}

// ───────── Kho & túi đồ ─────────
export function addStack(list: Stack[], s: Stack) {
  if (s.n <= 0) return;
  const t = list.find((x) => x.id === s.id && Math.abs(x.fresh - s.fresh) < 12 && Math.abs(x.q - s.q) < 0.08);
  if (t) {
    const n = t.n + s.n;
    t.fresh = (t.fresh * t.n + s.fresh * s.n) / n; t.q = (t.q * t.n + s.q * s.n) / n; t.cost = (t.cost * t.n + s.cost * s.n) / n; t.n = n;
  } else list.push({ ...s });
}
export const countOf = (lists: Stack[][], id: string) => lists.reduce((a, l) => a + l.reduce((b, s) => b + (s.id === id ? s.n : 0), 0), 0);
export const weightOf = (list: Stack[]) => list.reduce((a, s) => a + s.n * (INGS[s.id]?.kg ?? 0), 0);
export const coldWeightOf = (list: Stack[]) => list.reduce((a, s) => a + (INGS[s.id]?.cold ? s.n * INGS[s.id].kg : 0), 0);
export const junkWeight = (g: Game) => Object.entries(g.junk).reduce((a, [k, n]) => a + n * (JUNK[k]?.kg ?? 0), 0);
/** Độ tươi → hệ số chất lượng (trên 60 gần như nguyên vẹn, dưới 10 coi như hỏng). */
export const freshFactor = (f: number) => (f >= 60 ? 1 : f >= 35 ? 0.82 + (f - 35) * 0.0072 : f >= 10 ? 0.45 + (f - 10) * 0.0148 : 0.12);
export const isSpoiled = (s: Stack) => s.fresh < 10;

/** Lấy n đơn vị (ưu tiên lô cũ nhất/kém tươi nhất). Trả về chất lượng & giá vốn trung bình, hoặc null nếu thiếu. */
export function takeFrom(lists: Stack[][], id: string, n: number): { q: number; cost: number; fresh: number } | null {
  if (n <= 1e-9) return { q: 1, cost: 0, fresh: 100 };
  if (countOf(lists, id) < n - 1e-6) return null;
  const all: { l: Stack[]; s: Stack }[] = [];
  for (const l of lists) for (const s of l) if (s.id === id) all.push({ l, s });
  all.sort((a, b) => a.s.fresh - b.s.fresh);
  let left = n, q = 0, cost = 0, fresh = 0;
  for (const { l, s } of all) {
    const k = Math.min(left, s.n);
    q += k * s.q * freshFactor(s.fresh); cost += k * s.cost; fresh += k * s.fresh;
    s.n -= k; left -= k;
    if (s.n <= 1e-6) l.splice(l.indexOf(s), 1);
    if (left <= 1e-9) break;
  }
  return { q: q / n, cost, fresh: fresh / n };
}
/** Chuyển nguyên liệu giữa hai kho, giới hạn theo sức chứa (kg). Trả về số đơn vị đã chuyển. */
export function moveStack(from: Stack[], to: Stack[], idx: number, n: number, roomKg: number): number {
  const s = from[idx]; if (!s) return 0;
  const kg = INGS[s.id].kg, fit = kg > 0 ? Math.floor((roomKg + 1e-6) / kg * 100) / 100 : n;
  const k = Math.min(n, s.n, fit);
  if (k <= 0) return 0;
  addStack(to, { ...s, n: k }); s.n -= k;
  if (s.n <= 1e-6) from.splice(idx, 1);
  return k;
}
/** Làm hỏng dần nguyên liệu theo thời gian. hours: số giờ trôi qua · mul: hệ số thời tiết · chilled: kho có giữ lạnh. */
export function spoil(list: Stack[], hours: number, mul: number, chilled: boolean) {
  for (const s of list) {
    const d = INGS[s.id]; if (!d || d.shelf > 9000) continue;
    const rate = (100 / d.shelf) * (chilled ? 0.22 : d.cold ? 2.6 * mul : mul);
    s.fresh = Math.max(0, s.fresh - rate * hours);
  }
}
/** Bỏ đồ hỏng, trả về tổng giá trị bị mất. */
export function purge(list: Stack[]): { lost: number; names: string[] } {
  let lost = 0; const names: string[] = [];
  for (let i = list.length - 1; i >= 0; i--) if (isSpoiled(list[i])) { lost += list[i].n * list[i].cost; names.push(INGS[list[i].id].name); list.splice(i, 1); }
  return { lost, names };
}
export const ALL_ING_IDS = ING_LIST.map((i) => i.id);
