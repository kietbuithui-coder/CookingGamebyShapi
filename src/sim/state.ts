// TRẠNG THÁI GAME — toàn bộ dữ liệu cần lưu. Chỉ là dữ liệu thuần (JSON), không phụ thuộc đồ hoạ.
import { ING_LIST, INGS } from '../data/ingredients';
import { RECIPE_LIST, START_RECIPES } from '../data/recipes';
import { JUNK } from '../data/gear';
import { FIXED, REGULARS } from '../data/people';
import type { WeatherId } from '../data/world';
import { PLACES } from '../world/layout';
import { PlayerLookData, defaultLook, cleanLook } from '../data/looks';

export const SAVE_VERSION = 16;
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
/** Giới hạn tối đa của tất cả thanh chỉ số nhân vật (tăng +25% từ 100 lên 125). */
export const STAT_MAX = 125;
export interface Stats { hunger: number; thirst: number; energy: number; health: number; hygiene: number; mood: number; }
export interface RecState { known: boolean; price: number; on: boolean; made: number; best: number; }
export interface Rel { v: number; n: number; last: number; owe?: number; }
export interface ActiveEvent { id: string; until: number; data?: any; }
export interface Stall {
  tier: number; where: 'none' | 'home' | 'carried' | 'placed'; spot: string | null; x: number; z: number; yaw: number;
  cond: number; open: boolean; store: Stack[]; preps: Prep[]; ready: Ready[]; fuel: number; fuelKind: string; paidDay: number; dirt: number;
}
/** Người phụ việc ở quầy: chỉ nhận sau khi quán đã có doanh thu và bán được vài ngày (xem helperGate). */
/** Ca làm của người phụ quầy. */
export type Shift = 'sang' | 'chieu' | 'full';
export interface Helper {
  name: string; fem: boolean; face: number; hairStyle: number; shirt: number; pants: number; hair: number; skin: number;
  /** Lương mỗi ngày (trừ vào sáng hôm sau) và ngày bắt đầu làm, ngày đã trả lương gần nhất. */
  wage: number; since: number; paid: number; hired: boolean;
}
/** Chi nhánh thứ hai của Chuỗi cửa hàng (bậc 7): một điểm bán khác, người trông coi tự bán món sẵn. */
export interface Branch {
  /** Chỗ bán (id trong SPOTS) — nơi dựng quầy chi nhánh. */
  spot: string;
  /** Ngày mở chi nhánh. */
  since: number;
  /** Tiền thuê chỗ mỗi ngày (khác với phí chỗ của quầy chính). */
  rent: number;
  /** Người trông coi (null = chưa thuê, chi nhánh đóng cửa). */
  keeper: Helper | null;
  /** Món sẵn đã chuyển sang chi nhánh (bán hết thì thôi, người trông coi không tự nấu). */
  ready: Ready[];
  /** Sổ riêng của chi nhánh: doanh thu, tiền boa, số phần, khách, phí, lương, hao hụt. */
  led: { revenue: number; tips: number; sold: number; customers: number; lost: number; fees: number; wage: number; loss: number };
  /** Tổng cộng dồn và doanh thu từng ngày (8 ngày gần nhất) để hiện trong sổ sách. */
  tot: { revenue: number; tips: number; sold: number; days: number };
  hist: { day: number; revenue: number; tips: number; sold: number; lost: number }[];
  /** Chi nhánh đang mở bán hay tạm đóng (đóng thì không bán, không thu tiền thuê? vẫn thu). */
  open: boolean;
}

/** Đặt bàn trước của khách tại Nhà hàng bình dân (bậc 6). */
export interface Booking {
  id: number; name: string; fem: boolean; arch: string; size: number;
  day: number; hour: number; deposit: number; dish?: string; regular?: string;
  status: 'pending' | 'accepted' | 'seated' | 'done' | 'missed';
}
/** Một chuyến đi chợ giao cho người làm: phụ quầy (1), bếp trưởng (2–3) hoặc người trông coi chi nhánh (4). */
export interface Errand {
  /** 1 = phụ quầy, 2/3 = bếp trưởng (phụ bếp), 4 = người trông coi chi nhánh. */
  slot: 0 | 1 | 2 | 3;
  /** Tên người đi chợ (đã chốt lúc giao việc). */
  who: string;
  /** Ngày bắt đầu chuyến (g.day). */
  day: number;
  /** Số phút đi đường khứ hồi: đi chợ (nửa) + về quầy (nửa). */
  legs: number;
  /** Phút đã trôi của chuyến. */
  t: number;
  /** Hàng đã mua, chờ chất lên quầy khi về. */
  lines: { id: string; n: number; price: number; fresh: number; q: number }[];
  /** Nơi đã mua (id cửa hàng) — để hiện trong sổ. */
  shop: string;
  total: number;
  /** Đang ở chặng về (đã mua xong). */
  back: boolean;
}

export interface Game {
  v: number; seed: number; ac: 'anh' | 'chị';
  /** Ngoại hình người chơi (đổi ở tiệm cắt tóc / tiệm thời trang, xem ở góc nhìn thứ ba). */
  look: PlayerLookData;
  day: number; min: number;
  cash: number; bank: number;
  st: Stats; rep: number; xp: number;
  pos: { x: number; z: number; yaw: number; pitch: number };
  bag: Stack[]; junk: Record<string, number>; meals: Ready[];
  /** Đồ rơi lúc ngất: còn ở bệnh viện tới hết ngày hôm đó thì quay lại nhận được. */
  lostBag: Stack[]; lostDay: number;
  /** Mức bị công an để ý (0–100) và giờ còn bị tạm giữ ở phường (0 = tự do). */
  wanted: number; jailUntil: number;
  gear: Record<string, number>;
  /** Máy đang dùng (null = chưa có điện thoại) và pin 0–100. */
  phone: { id: string; battery: number } | null;
  housing: string; paidUntil: number; home: Stack[];
  stall: Stall;
  /** Người phụ việc đang làm ở quầy (null = chưa thuê ai). */
  help: Helper | null;
  /** Người phụ việc thứ 2 cho Nhà hàng bình dân (bậc 6). */
  help2: Helper | null;
  /** Ca của người phụ quầy: 'sang' 5–14h, 'chieu' 14–22h, 'full' cả ngày. Người nghỉ ca thì không tới. */
  helpShift: { 1: Shift; 2: Shift };
  /** Nhân viên phụ bếp đứng phòng bếp riêng ở bậc 6 (null = chưa thuê). */
  sous: Helper | null;
  /** Nhân viên phụ bếp thứ 2 trong phòng bếp riêng (bậc 6). */
  sous2: Helper | null;
  /** Chi nhánh thứ hai của Chuỗi cửa hàng (bậc 7), null = chưa mở chi nhánh. */
  branch: Branch | null;
  /** Chuyến đi chợ đang giao cho người làm (tối đa 3: phụ quầy + 2 bếp trưởng + người trông coi). */
  errands: Errand[];
  /** Tổng doanh thu của chi nhánh qua các ngày (để tính thành tích). */
  /** Danh sách đặt bàn trước (bậc 6). */
  bookings: Booking[];
  bookSeq: number;
  rec: Record<string, RecState>;
  debts: Debt[]; debtSeq: number; credit: number;
  led: LedgerDay; hist: LedgerDay[];
  rel: Record<string, Rel>;
  /** Những người đã quen (id nhân vật cố định hoặc khách quen → ngày làm quen). Chưa quen thì chưa biết tên. */
  met: Record<string, number>;
  flags: Record<string, number>;
  weather: { now: WeatherId; until: number; next: WeatherId; flood: number; wet: number };
  ev: { active: ActiveEvent[]; last: Record<string, number>; check: number; lastStart: number };
  wd: { litterDay: number; picked: number[]; bins: Record<number, number>; sacks: number; plates: number; deliveries: number; cargoShifts: number; cafeShifts: number; begTired: number; outOf: string[]; haggled: Record<string, number>; job: any; };
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
    v: SAVE_VERSION, seed, ac, look: defaultLook(ac === 'chị'), day: 0, min: 6 * 60 + 10, cash: 18000, bank: 0,
    st: { hunger: 58, thirst: 55, energy: 82, health: 92, hygiene: 42, mood: 45 }, rep: 0, xp: 0,
    pos: { x: PLACES.camp.x, z: PLACES.camp.z - 1.2, yaw: Math.PI, pitch: 0 },
    bag: [], junk: {}, meals: [], lostBag: [], lostDay: -1, wanted: 0, jailUntil: 0, gear: {}, phone: null, housing: 'gamcau', paidUntil: 0, home: [],
    stall: emptyStall(), helpShift: { 1: 'full', 2: 'sang' }, help: null, help2: null, sous: null, sous2: null, branch: null, errands: [], bookings: [], bookSeq: 1, rec, debts: [], debtSeq: 1, credit: 0,
    led: newLedger(0), hist: [], rel: {}, met: {}, flags: {},
    weather: { now: 'nang', until: 6 * 60 + 10 + 420, next: 'nang', flood: 0, wet: 0 },
    ev: { active: [], last: {}, check: 9 * 60, lastStart: -999 },
    wd: { litterDay: -1, picked: [], bins: {}, sacks: 0, plates: 0, deliveries: 0, cargoShifts: 0, cafeShifts: 0, begTired: 0, outOf: [], haggled: {}, job: null },
    tot: { served: 0, earned: 0, begged: 0, scrap: 0, best: 0, bankrupt: 0 }, quest: 0,
  };
}

/** Làm sạch danh sách chuyến đi chợ đọc từ bản lưu (bỏ chuyến hỏng, kẹp số phần và thời gian). */
export function cleanErrands(raw: any[]): Errand[] {
  const ok = (v: unknown) => typeof v === 'number' && isFinite(v);
  return raw.filter((e) => e && typeof e === 'object' && ok(e.slot) && e.slot >= 0 && e.slot <= 3)
    .slice(0, 4)
    .map((e) => ({
      slot: e.slot as Errand['slot'],
      who: typeof e.who === 'string' ? e.who.slice(0, 24) : 'Người làm',
      day: ok(e.day) ? Math.max(0, Math.floor(e.day)) : 0,
      legs: ok(e.legs) ? Math.max(10, Math.min(600, Math.round(e.legs))) : 60,
      t: ok(e.t) ? Math.max(0, Math.round(e.t)) : 0,
      shop: typeof e.shop === 'string' ? e.shop : '',
      total: ok(e.total) ? Math.max(0, Math.round(e.total)) : 0,
      back: !!e.back,
      lines: Array.isArray(e.lines) ? e.lines.filter((l: any) => l && typeof l.id === 'string' && l.id.length > 0 && ok(l.n) && l.n > 0)
        .slice(0, 24)
        .map((l: any) => ({ id: l.id, n: Math.min(200, Math.max(1, Math.round(l.n))), price: ok(l.price) ? Math.max(0, l.price) : 0, fresh: ok(l.fresh) ? Math.max(0, Math.min(100, l.fresh)) : 80, q: ok(l.q) ? Math.max(0, Math.min(1, l.q)) : 0.9 })) : [],
    }));
}

/** Làm sạch dữ liệu chi nhánh đọc từ bản lưu (có thể thiếu trường, hỏng, hoặc chỗ bán không còn). */
export function cleanBranch(raw: any): Branch | null {
  if (!raw || typeof raw !== 'object' || typeof raw.spot !== 'string') return null;
  const safe = (v: unknown, lo = 0, hi = Number.MAX_SAFE_INTEGER) => (typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo);
  const keeperRaw = raw.keeper;
  const keeper: Helper | null = keeperRaw && typeof keeperRaw.name === 'string' && typeof keeperRaw.wage === 'number'
    ? { name: keeperRaw.name, fem: !!keeperRaw.fem, face: safe(keeperRaw.face, 0, 15), hairStyle: safe(keeperRaw.hairStyle, 0, 7), shirt: safe(keeperRaw.shirt), pants: safe(keeperRaw.pants), hair: safe(keeperRaw.hair), skin: safe(keeperRaw.skin), wage: Math.max(1000, keeperRaw.wage), since: safe(keeperRaw.since), paid: safe(keeperRaw.paid), hired: true }
    : null;
  const ready: Ready[] = Array.isArray(raw.ready) ? raw.ready.filter((r: any) => r && typeof r.rid === 'string' && r.n > 0).map((r: any) => ({ rid: r.rid, n: safe(r.n), q: safe(r.q, 0, 1), at: safe(r.at), cost: safe(r.cost) })) : [];
  const led = raw.led ?? {}, tot = raw.tot ?? {};
  return {
    spot: raw.spot, since: safe(raw.since), rent: safe(raw.rent), keeper, ready,
    led: { revenue: safe(led.revenue), tips: safe(led.tips), sold: safe(led.sold), customers: safe(led.customers), lost: safe(led.lost), fees: safe(led.fees), wage: safe(led.wage), loss: safe(led.loss) },
    tot: { revenue: safe(tot.revenue), tips: safe(tot.tips), sold: safe(tot.sold), days: safe(tot.days) },
    hist: Array.isArray(raw.hist) ? raw.hist.filter((h: any) => h && typeof h.day === 'number').slice(-8).map((h: any) => ({ day: h.day, revenue: safe(h.revenue), tips: safe(h.tips), sold: safe(h.sold), lost: safe(h.lost) })) : [],
    open: raw.open !== false,
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
  // Bản lưu trước v4 chưa có sổ "đã quen": người chơi cũ đã thấy tên mọi người rồi nên coi như quen hết,
  // còn khách quen thì tính những ai từng ghé.
  if ((raw.v ?? 0) < 4 || !raw.met || typeof raw.met !== 'object') {
    g.met = {};
    for (const id of Object.keys(FIXED)) g.met[id] = 0;
    for (const r of REGULARS) if ((g.rel[r.id]?.n ?? 0) > 0) g.met[r.id] = 0;
  }
  // v5: bệnh viện Phước An + chuyện ngất. Bản lưu cũ có thể đang ở máu 0 (nếu vừa kiệt sức lúc lưu)
  // — mở lên là ngất liền, nên nâng tối thiểu lên 45 và ghi nhận số lần ngất.
  if ((raw.v ?? 0) < 5) {
    if (typeof g.st.health !== 'number' || g.st.health <= 0) g.st.health = 45;
    if (typeof g.flags.faint !== 'number') g.flags.faint = 0;
    g.lostBag = [];
    g.lostDay = -1;
  }
  // v6: công an phường. Bản lưu cũ chưa có mức bị để ý và hạn tạm giữ.
  if ((raw.v ?? 0) < 6) { g.wanted = 0; g.jailUntil = 0; }
  // v7: điện thoại. Bản lưu cũ chưa có máy, chưa có gì trong danh bạ điện thoại.
  if ((raw.v ?? 0) < 7) {
    g.phone = null;
    if (typeof g.flags.smsSeen !== 'number') g.flags.smsSeen = 0;
  }
  if (g.phone && (typeof g.phone.id !== 'string' || typeof g.phone.battery !== 'number')) g.phone = null;
  // v8: quán net. Bản lưu cũ chưa có số phút ngồi máy trong ngày.
  if ((raw.v ?? 0) < 8) { g.flags.netDay = -1; g.flags.netMin = 0; }
  // v9: đua xe đạp chủ nhật. Bản lưu cũ chưa có sổ ngày đua và số lần thắng.
  if ((raw.v ?? 0) < 9) { g.flags.raceDay = -1; g.flags.raceWin = 0; }
  // v11: ngoại hình người chơi. Bản lưu cũ chưa có thì lấy mặc định theo anh/chị.
  if ((raw.v ?? 0) < 11 || !raw.look) g.look = defaultLook(g.ac === 'chị');
  else g.look = cleanLook(raw.look, g.ac === 'chị');
  // v10: người phụ việc ở quầy. Bản lưu cũ chưa từng thuê ai; dọn luôn dữ liệu hỏng.
  if ((raw.v ?? 0) < 10 || !raw.help) g.help = null;
  else if (typeof g.help?.name !== 'string' || typeof g.help?.wage !== 'number') g.help = null;
  if (g.help) { g.help.hired = true; if (typeof g.help.since !== 'number') g.help.since = g.day; if (typeof g.help.paid !== 'number') g.help.paid = g.day; }
  // v12: nhà hàng bình dân (bậc 6) — nhân viên phụ bếp và đặt bàn trước.
  if ((raw.v ?? 0) < 12) {
    g.sous = null;
    g.bookings = [];
    g.bookSeq = 1;
  } else {
    if (!g.sous || typeof g.sous.name !== 'string' || typeof g.sous.wage !== 'number') g.sous = null;
    if (g.sous) { g.sous.hired = true; if (typeof g.sous.since !== 'number') g.sous.since = g.day; if (typeof g.sous.paid !== 'number') g.sous.paid = g.day; }
    g.bookings = Array.isArray(raw.bookings) ? raw.bookings.filter((b: any) => b && typeof b.id === 'number' && typeof b.size === 'number' && typeof b.hour === 'number') : [];
    g.bookSeq = typeof raw.bookSeq === 'number' && raw.bookSeq >= 1 ? raw.bookSeq : 1;
  }
  if ((raw.v ?? 0) < 13) {
    if (!g.help2 || typeof g.help2 !== 'object') g.help2 = null;
    if (!g.sous2 || typeof g.sous2 !== 'object') g.sous2 = null;
  }
  // v14: chi nhánh của Chuỗi cửa hàng (bậc 7). Bản lưu cũ chưa có chi nhánh nào.
  if ((raw.v ?? 0) < 14 || !raw.branch) g.branch = null;
  else g.branch = cleanBranch(raw.branch);
  // v16: ca làm của hai người phụ quầy (sáng / chiều / cả ngày). Bản lưu cũ: người thứ nhất cả ngày, người thứ hai ca sáng.
  const sh = raw.helpShift;
  const okShift = (v: any): v is Shift => v === 'sang' || v === 'chieu' || v === 'full';
  g.helpShift = { 1: okShift(sh?.[1]) ? sh[1] : 'full', 2: okShift(sh?.[2]) ? sh[2] : 'sang' };
  // v15: giao người làm đi chợ (phụ quầy / bếp trưởng / người trông coi chi nhánh). Bản lưu cũ chưa có chuyến nào.
  g.errands = (raw.v ?? 0) < 15 || !Array.isArray(raw.errands) ? [] : cleanErrands(raw.errands);
  if (typeof g.flags.firstSale !== 'number' && (g.hist.some((h) => h.revenue > 0) || g.led.revenue > 0)) g.flags.firstSale = 0;
  for (const k of Object.keys(g.st) as (keyof Stats)[]) g.st[k] = Math.min(STAT_MAX, Math.max(0, Number.isFinite(g.st[k]) ? g.st[k] : base.st[k]));
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
/** Làm hỏng dần nguyên liệu theo thời gian. hours: số giờ trôi qua · mul: hệ số thời tiết · chilled: kho có giữ lạnh · coldMul: hệ số giữ lạnh thêm (tủ đông công nghiệp). */
export function spoil(list: Stack[], hours: number, mul: number, chilled: boolean, coldMul = 1) {
  for (const s of list) {
    const d = INGS[s.id]; if (!d || d.shelf > 9000) continue;
    const rate = (100 / d.shelf) * (chilled ? 0.22 * coldMul : d.cold ? 2.6 * mul : mul);
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
