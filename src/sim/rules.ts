// LUẬT CHƠI — kinh tế, giá vốn, nhu cầu khách, đánh giá, chỉ số sinh tồn, thời tiết, sự kiện, nợ nần.
// Toàn bộ là logic thuần, không đụng tới đồ hoạ hay DOM (xem tests/ để thấy cách kiểm thử).
import { clamp, RNG, rnd, round1k, round500, hashStr, money, lerp } from '../core/util';
import { bus, toast } from '../core/bus';
import { INGS } from '../data/ingredients';
import { SHOPS, SHOP_LIST, ShopDef } from '../data/shops';
import { RECIPES, RecipeDef, fuelPerPortion, toolsFor, RECIPE_LIST } from '../data/recipes';
import { GEAR, HOUSING, LENDERS, TIERS, JUNK, junkAt, BRANCH_SITES, BRANCH_WAGE, BranchSite } from '../data/gear';
import { ARCH, ArchDef, HELPER_POOL, HelperDef, SOUS_POOL, SousDef, KEEPER_POOL, LINES, FIXED, FIXED_ROLE, NAMES } from '../data/people';
import { EVENTS, EVENT_LIST, EventDef, WEATHER, WeatherDef, WeatherId, floodZone, hourCurve } from '../data/world';
import { EXPR } from '../data/expr';
import { District, DISTRICT, SPOTS, districtAt, spotById } from '../world/layout';
import { PLACE_HOURS } from '../data/hours';
import { Game, Stack, Helper, Booking, Branch, Ready, Errand, STAT_MAX, absMin, addStack, countOf, hourOf, newLedger, purge, spoil, takeFrom, weightOf, junkWeight, emptyStall, Debt, coldWeightOf } from './state';
import * as PH from './phone';

export { STAT_MAX };

// ───────────────────────── Tiện ích chung ─────────────────────────
export const wx = (g: Game): WeatherDef => WEATHER[g.weather.now];
export const level = (g: Game) => Math.min(10, Math.floor(Math.sqrt(g.xp / 30)));
export const tier = (g: Game) => TIERS[g.stall.tier];
/** Chỗ ngồi ăn tại chỗ: quán ăn nhỏ (bậc 4) 4 ghế, quán có chỗ ngồi (bậc 5) 6 ghế, nhà hàng bình dân (bậc 6) 8 ghế (4 bàn). */
export const seatCount = (g: Game) => (g.stall.tier >= 6 ? 8 : g.stall.tier >= 5 ? 6 : g.stall.tier >= 4 ? 4 : 0);
/** Quán đã có chỗ ngồi trong nhà chưa (bậc 5+): khách ăn lâu hơn và gọi thêm tráng miệng. */
export const dineIn = (g: Game) => g.stall.tier >= 5;
/** Đã lên Nhà hàng bình dân (bậc 6) chưa: nội thất trong nhà kín, phòng bếp riêng, đặt bàn trước, phụ bếp và khách đoàn. */
export const isRestaurant = (g: Game) => g.stall.tier >= 6;
/** Bốn buổi trong ngày, khớp thứ tự `RecipeDef.meal`: sáng, trưa, chiều tối, khuya. */
export const PERIODS = ['Buổi sáng', 'Buổi trưa', 'Buổi chiều', 'Khuya'] as const;
export const mealSlot = (h: number) => (h < 10 ? 0 : h < 14.5 ? 1 : h < 20 ? 2 : 3);
export const periodName = (g: Game) => PERIODS[mealSlot(hourOf(g))];
/** Món này có đúng buổi không (điểm hợp buổi từ 0,8 trở lên). */
export const fitsPeriod = (r: RecipeDef, h: number) => r.meal[mealSlot(h)] >= 0.8;
/** Những món đang bật của quán mà hợp với buổi hiện tại — quán có chỗ ngồi ưu tiên bán mấy món này. */
export const periodMenu = (g: Game) => menuOf(g).filter((r) => fitsPeriod(r, hourOf(g)));
export const has = (g: Game, gear: string) => g.gear[gear] !== undefined && g.gear[gear] > 0;
export const stove = (g: Game): 'bepgas' | 'bepthan' | null => (has(g, 'bepgas') || has(g, 'bep_cn') ? 'bepgas' : has(g, 'bepthan') ? 'bepthan' : null);
export const hasTool = (g: Game, t: string) => (t === 'bep' ? stove(g) !== null : has(g, t));
export const carryCap = (g: Game) => 7 + (has(g, 'gio') ? 6 : 0);
export const bagWeight = (g: Game) => weightOf(g.bag) + junkWeight(g) + g.meals.reduce((a, m) => a + m.n * 0.3, 0);
export const stallCap = (g: Game) => tier(g).cap + (has(g, 'tu_dong') ? 80 : 0);
export const stallQueueCap = (g: Game) => tier(g).queue + (has(g, 'hopmangve') ? 2 : 0);
export const stallTrayCap = (g: Game) => tier(g).trays + (has(g, 'tu_kinh') ? 8 : 0);
export const stallRoom = (g: Game) => stallCap(g) - weightOf(g.stall.store);
/**
 * Có lấy được đồ ra khỏi kho quầy hay không — KHÔNG cần đứng cạnh quầy.
 * Người chơi yêu cầu (lượt 37): "cho phép lấy đồ ra khỏi quầy mà không cần đặt quầy vào chỗ bán".
 * Kho quầy vẫn luôn mở để LẤY đồ ra (kể cả khi đang mang theo hay đang để ở nhà); chỉ việc BỎ VÀO thì
 * mới cần có quầy trong tầm tay, để không thành cái túi không đáy.
 */
export const canTakeFromStore = (g: Game) => g.stall.tier > 0;
/** Ở gần quầy (hoặc đang mang quầy) thì mới bỏ đồ vào kho quầy được. */
export const nearStall = (g: Game, x: number, z: number) => {
  const s = g.stall;
  if (s.tier <= 0) return false;
  if (s.where === 'carried') return true;
  if (s.where !== 'placed' && s.where !== 'home') return true;
  return (s.x - x) ** 2 + (s.z - z) ** 2 < 8 * 8;
};
export const homeRoom = (g: Game) => HOUSING[g.housing].storage - weightOf(g.home);
/** Nhà thuê theo tuần thì cắm được tủ lạnh của mình. */
export const PLUGGABLE = ['tro', 'canho', 'nharieng', 'cuahang'];
export const homeChilled = (g: Game) => HOUSING[g.housing].cold || (PLUGGABLE.includes(g.housing) && has(g, 'tulanh') && !blackoutAt(g, 'dancu'));
export const stallChilled = (g: Game) => (has(g, 'tu_dong') && (!g.stall.spot || !blackoutAt(g, districtAt(g.stall.x, g.stall.z)))) || (has(g, 'thungda') && countOf([g.stall.store], 'da') > 0);
/**
 * Số giờ còn bán được của một lô trong kho quầy (ước lượng, dùng cho lời nhắc).
 * Đồ cần lạnh mà quầy không có tủ đá/thùng đá thì hỏng nhanh gấp 2,6 lần — đây chính là lý do
 * người chơi thấy "sữa bỏ vào quầy rồi mất": nó hỏng chứ không bị ai lấy.
 */
export function hoursLeft(g: Game, st: Stack): number {
  const d = INGS[st.id];
  if (!d || d.shelf > 9000) return Infinity;
  const chilled = stallChilled(g), w = wx(g);
  const perHour = (100 / d.shelf) * (chilled ? 0.22 * (has(g, 'tu_dong') ? 0.35 : 1) : d.cold ? 2.6 * w.spoil : w.spoil);
  if (perHour <= 0) return Infinity;
  return Math.max(0, (st.fresh - 10) / perHour); // dưới 10% tươi là hỏng hẳn
}
/** Đồ cần lạnh đang để ở quầy mà quầy không có gì giữ lạnh: đếm số loại + tên vài món. */
export function coldUnprotected(g: Game): { kinds: number; names: string[] } {
  if (stallChilled(g)) return { kinds: 0, names: [] };
  const cold = g.stall.store.filter((st) => INGS[st.id]?.cold && INGS[st.id].shelf < 9000);
  return { kinds: cold.length, names: [...new Set(cold.map((st) => INGS[st.id].name))].slice(0, 3) };
}
export const activeEvents = (g: Game): EventDef[] => g.ev.active.map((a) => EVENTS[a.id]).filter(Boolean);
export const eventOn = (g: Game, id: string) => g.ev.active.some((a) => a.id === id);
export const blackoutAt = (g: Game, d: District) => activeEvents(g).some((e) => e.blackout?.includes(d));
export const isNight = (g: Game) => hourOf(g) >= 18.4 || hourOf(g) < 5.6;
export function spend(g: Game, amount: number, key: keyof Game['led'] | null = 'other'): boolean {
  if (amount <= 0) return true;
  if (g.cash < amount) return false;
  g.cash -= amount; if (key) (g.led[key] as number) += amount;
  bus.emit('cash', -amount); return true;
}
export function earn(g: Game, amount: number, key: 'revenue' | 'tips' | 'side' | null) {
  if (amount <= 0) return;
  g.cash += amount; if (key) g.led[key] += amount; g.tot.earned += amount;
  bus.emit('cash', amount);
}

// ───────────────────────── Giá cả ở cửa hàng ─────────────────────────
export function shopOpen(g: Game, shop: ShopDef): boolean {
  const h = hourOf(g);
  if (activeEvents(g).some((e) => e.closed?.includes(shop.id))) return false;
  return h >= shop.open[0] && h < shop.open[1];
}
export function shopPrice(g: Game, shop: ShopDef, ingId: string): number {
  const d = INGS[ingId]; let p = d.price * shop.priceMul;
  for (const e of activeEvents(g)) { p *= e.price?.[d.cat] ?? 1; p *= e.shop?.[shop.id] ?? 1; }
  // giá dao động nhẹ theo ngày, cố định trong ngày
  const f = (hashStr(ingId + shop.id + g.day + g.seed) % 1000) / 1000;
  p *= 0.93 + f * 0.14;
  if (shop.lateSale && d.shelf < 240 && hourOf(g) >= shop.open[1] - 2) p *= 0.75;   // xả hàng cuối buổi
  if (floodPct(g) > 0.5 && d.cat === 'veg') p *= 1.15;
  return Math.max(500, p >= 5000 ? round500(p) : Math.round(p / 100) * 100);
}
export const shopHas = (g: Game, shop: ShopDef, ingId: string) => !(shop.id.startsWith('m_') && g.wd.outOf.includes(ingId));
/**
 * Việc ở một địa danh có đang mở ở giờ hiện tại không: sạp bán nguyên liệu theo giờ của sạp,
 * nơi khác theo `PLACE_HOURS`, nơi không ghi giờ thì coi như mở cả ngày.
 * Dùng chung cho lời khuyên của Ông Bảy và cho Bản đồ (để câu “đang mở” không bao giờ sai).
 */
export function placeOpenAt(g: Game, id: string): boolean {
  const h = hourOf(g), shop = SHOPS[id];
  if (shop) return shopOpen(g, shop);
  const p = PLACE_HOURS[id]; return !p || (h >= p[0] && h < p[1]);
}
/** Độ tươi của hàng: chợ sáng tươi nhất, càng về chiều càng kém. */
export function shopFresh(g: Game, shop: ShopDef, ingId: string, R: RNG = rnd): number {
  const d = INGS[ingId]; if (d.shelf > 9000) return 100;
  const t = clamp((hourOf(g) - shop.open[0]) / Math.max(1, shop.open[1] - shop.open[0]));
  return clamp(lerp(shop.fresh[1], shop.fresh[0], t) - (d.shelf < 14.4 ? t * 14 : 0) + R.range(-2, 2), 30, 100);
}
/** Mặc cả: trả về mức giảm giá đạt được (0 nếu thất bại). ask: 0.05–0.25 */
export function haggle(g: Game, shop: ShopDef, ask: number, total: number, R: RNG = rnd): { ok: boolean; line: string } {
  const rel = g.rel[shop.id]?.v ?? 0;
  let p = shop.haggle * (1.15 - ask * 3.2) + rel / 220 + (g.st.mood - 50) / 260 + (g.st.hygiene < 25 ? -0.12 : 0) + (total >= 100000 ? 0.12 : 0);
  if (shop.lateSale && hourOf(g) >= shop.open[1] - 2.5) p += 0.2;
  g.wd.haggled[shop.id] = (g.wd.haggled[shop.id] ?? 0) + 1;
  if (g.wd.haggled[shop.id] > 2) p -= 0.25 * (g.wd.haggled[shop.id] - 2);
  const ok = shop.haggle > 0 && R.next() < clamp(p, 0.02, 0.92);
  const good = ['Thôi được, bớt cho đó, mai nhớ ghé nữa nghen.', 'Mua mở hàng nên cô bớt cho.', 'Ừ, lấy giá đó đi, khổ ghê.', 'Rồi rồi, bớt chút lấy thảo.'];
  const bad = ['Giá đó sao bán nổi con ơi!', 'Bớt nữa là lỗ vốn đó.', 'Không bớt được đâu, hàng lên giá rồi.', 'Trả vậy kỳ quá à.'];
  if (!ok) changeRel(g, shop.id, ask > 0.15 ? -3 : -1);
  return { ok, line: R.pick(ok ? good : bad) };
}
/** Đã từng làm quen với người này chưa (nhân vật cố định: đã nói chuyện; khách quen: đã bán cho họ một lần)? */
export const hasMet = (g: Game, id: string) => g.met[id] !== undefined;
/** Ghi nhận lần đầu làm quen. Trả về true nếu đúng là lần đầu. */
export function meet(g: Game, id: string): boolean { if (g.met[id] !== undefined) return false; g.met[id] = g.day; return true; }
/** Tên hiện ra của một người đứng quầy: chưa quen thì chỉ biết họ làm gì ở đó. */
export const fixedLabel = (g: Game, id: string) => (hasMet(g, id) ? FIXED[id]?.name : FIXED_ROLE[id]) ?? 'Người lạ';
export function changeRel(g: Game, id: string, dv: number, visit = false) {
  const r = (g.rel[id] ??= { v: 0, n: 0, last: -1 });
  r.v = clamp(r.v + dv, -100, 100);
  if (visit && r.last !== g.day) { r.n++; r.last = g.day; }
}

// ───────────────────────── Giá vốn & nguyên liệu cho món ─────────────────────────
/** Giá vốn một đơn vị nguyên liệu: bình quân theo số đang có (quầy + túi + nhà); nếu không có thì lấy giá chợ. */
export function unitCost(g: Game, id: string): number {
  let n = 0, c = 0;
  for (const l of [g.stall.store, g.bag, g.home]) for (const s of l) if (s.id === id) { n += s.n; c += s.n * s.cost; }
  return n > 0 ? c / n : INGS[id].price;
}
export function fuelUnitCost(g: Game): number {
  const k = stove(g) === 'bepgas' ? 'gas' : 'than';
  return unitCost(g, k) / (k === 'gas' ? 14 : 22);
}
/** Giá vốn MỘT phần ăn = nguyên liệu + bao bì + nhiên liệu. */
export function recipeCost(g: Game, r: RecipeDef): { ing: number; pack: number; fuel: number; total: number } {
  let ing = 0;
  for (const [id, q] of Object.entries(r.ings)) ing += q * unitCost(g, id);
  const fuel = fuelPerPortion(r) * fuelUnitCost(g);
  return { ing, pack: r.pack, fuel, total: ing + r.pack + fuel };
}
export const marginOf = (price: number, cost: number) => (price > 0 ? (price - cost) / price : 0);
// ───────────────────────── Việc làm thêm ─────────────────────────
/** Tiền công một ca chạy bàn (60 phút): theo uy tín và tinh thần lúc nhận việc. */
export const cafeWage = (rep: number, mood: number) => round1k(38000 + Math.max(0, rep) * 120 + Math.max(0, mood - 50) * 120);
/** Tiền công một ca bốc cá (110 phút): 52.000–68.000₫, chia bậc theo số ngẫu nhiên 0–1. */
export const dockWage = (roll: number) => round1k(52000 + clamp(roll, 0, 1) * 16000);
export const suggestPrice = (g: Game, r: RecipeDef) => Math.max(round1k(recipeCost(g, r).total * 1.9), r.ref);
export const prepIngs = (r: RecipeDef) => Object.entries(r.ings).filter(([id]) => !r.fin.includes(id));
export const finIngs = (r: RecipeDef) => Object.entries(r.ings).filter(([id]) => r.fin.includes(id));
export const hasPrep = (r: RecipeDef) => r.prep.length > 0;
const stores = (g: Game) => [g.stall.store, g.bag];
/** Số phần có thể sơ chế từ nguyên liệu đang có (tối đa một mẻ). */
export function prepPossible(g: Game, r: RecipeDef): number {
  let n = r.batch;
  for (const [id, q] of prepIngs(r)) n = Math.min(n, Math.floor(countOf(stores(g), id) / q + 1e-6));
  return Math.max(0, n);
}
/** Số phần có thể hoàn thiện ngay (đủ "cốt" đã sơ chế và nguyên liệu hoàn thiện). */
export function finishPossible(g: Game, r: RecipeDef): number {
  let n = hasPrep(r) ? g.stall.preps.filter((p) => p.rid === r.id).reduce((a, p) => a + p.n, 0) : 999;
  for (const [id, q] of finIngs(r)) n = Math.min(n, Math.floor(countOf(stores(g), id) / q + 1e-6));
  return Math.max(0, n);
}
export const readyCount = (g: Game, rid: string) => g.stall.ready.filter((x) => x.rid === rid).reduce((a, x) => a + x.n, 0);
export const missingTools = (g: Game, r: RecipeDef) => toolsFor(r).filter((t) => !hasTool(g, t));
export const canSell = (g: Game, r: RecipeDef) => g.rec[r.id].known && missingTools(g, r).length === 0;
/** Có thể phục vụ món này ngay bây giờ không (có sẵn hoặc làm được)? */
export const available = (g: Game, r: RecipeDef) => readyCount(g, r.id) + finishPossible(g, r) > 0;
export const missingFor = (g: Game, r: RecipeDef, phase: 'prep' | 'fin', portions = 1): string[] =>
  (phase === 'prep' ? prepIngs(r) : finIngs(r)).filter(([id, q]) => countOf(stores(g), id) < q * portions - 1e-6).map(([id]) => INGS[id].name);

/** Trừ nguyên liệu cho bước sơ chế. Trả về chất lượng nguyên liệu (0–1) và tổng giá vốn. */
export function consumePrep(g: Game, r: RecipeDef, portions: number) {
  let q = 0, cost = 0, k = 0;
  for (const [id, per] of prepIngs(r)) { const t = takeFrom(stores(g), id, per * portions); if (!t) continue; q += t.q; cost += t.cost; k++; }
  return { q: k ? q / k : 1, cost };
}
export function consumeFinish(g: Game, r: RecipeDef, portions: number) {
  let q = 0, cost = 0, k = 0;
  for (const [id, per] of finIngs(r)) { const t = takeFrom(stores(g), id, per * portions); if (!t) continue; q += t.q; cost += t.cost; k++; }
  let pq = 1, pc = 0;
  if (hasPrep(r)) {
    let left = portions, sq = 0;
    for (const p of g.stall.preps.filter((x) => x.rid === r.id).sort((a, b) => a.at - b.at)) {
      const take = Math.min(left, p.n); sq += take * p.q * holdFactor(g, r, p.at); pc += take * p.cost; p.n -= take; left -= take;
      if (left <= 0) break;
    }
    g.stall.preps = g.stall.preps.filter((p) => p.n > 0);
    pq = sq / portions;
  }
  return { q: k ? q / k : 1, prepQ: pq, cost: cost + pc + r.pack * portions };
}
/** Đồ sơ chế để lâu quá hạn `hold` thì xuống chất lượng. */
export function holdFactor(g: Game, r: RecipeDef, at: number): number {
  if (r.hold <= 0) return 1;
  const over = (absMin(g) - at - r.hold) / r.hold;
  return over <= 0 ? 1 : clamp(1 - over * 0.5, 0.4, 1);
}
/** Dùng nhiên liệu cho một lần đứng bếp. Trả về false nếu hết. */
export function useFuel(g: Game, units = 1): boolean {
  const s = g.stall, kind = stove(g); if (!kind) return false;
  const item = kind === 'bepgas' ? 'gas' : 'than';
  const need = units * (has(g, 'bep_cn') && item === 'gas' ? 0.65 : 1);
  if (s.fuelKind !== item) { s.fuel = 0; s.fuelKind = item; }
  while (s.fuel < need) {
    const t = takeFrom(stores(g), item, 1); if (!t) return false;
    s.fuel += item === 'gas' ? 14 : 22;
  }
  s.fuel -= need; return true;
}
/** Tổng hợp chất lượng một mẻ: điểm thao tác + chất lượng nguyên liệu + tay nghề. */
export function dishQuality(g: Game, r: RecipeDef, stepScore: number, ingQ: number, prepQ = 1): number {
  const mastery = clamp(g.rec[r.id].made / 60) * 0.06, char = stove(g) === 'bepthan' && r.finish.some((s) => s.t === 'grill') ? 0.04 : 0;
  const proStove = has(g, 'bep_cn') && toolsFor(r).includes('bep') ? 0.05 : 0;
  const drinkEq = has(g, 'mayep') && (r.cat === 'nuoc' || r.cat === 'che') ? 0.08 : 0;
  return clamp((0.55 * stepScore + 0.45 * stepScore * prepQ) * (0.35 + 0.65 * ingQ) + mastery + char + proStove + drinkEq, 0.02, 1);
}
/** Độ khó thao tác nấu (cửa sổ thời gian rộng hay hẹp). >1 dễ hơn. */
export function cookEase(g: Game): number {
  let e = 1 + level(g) * 0.03;
  if (has(g, 'bep_cn')) e *= 1.12;
  if (g.st.energy < 35) e *= 0.62 + g.st.energy / 92;      // thiếu ngủ → run tay
  if (g.st.mood < 20) e *= 0.92;
  if (g.st.hunger < 15) e *= 0.9;
  return e;
}

// ───────────────────────── Nhu cầu & quyết định của khách ─────────────────────────
export interface Mods { traffic: number; budget: number; demand: Partial<Record<string, number>>; rival: boolean; festive: boolean; }
export function mods(g: Game, d: District): Mods {
  const m: Mods = { traffic: 1, budget: 1, demand: {}, rival: false, festive: false };
  for (const e of activeEvents(g)) {
    m.traffic *= (e.traffic?.[d] ?? 1) * (e.traffic?.all ?? 1); m.budget *= e.budget ?? 1;
    if (e.demand) for (const [k, v] of Object.entries(e.demand)) m.demand[k] = (m.demand[k] ?? 1) * v!;
    if (e.rival && g.stall.spot && spotById(g.stall.spot)?.district === d) m.rival = true;
    if (e.festive) m.festive = true;
  }
  return m;
}
export const menuOf = (g: Game): RecipeDef[] => RECIPE_LIST.filter((r) => g.rec[r.id].on && canSell(g, r));
/** Độ hấp dẫn của quầy (0.2–2.2): bảng hiệu, ô dù, loa, tủ kính, máy lạnh, đèn, vệ sinh, tình trạng. */
export function stallAppeal(g: Game): number {
  let a = tier(g).visible;
  if (has(g, 'bien')) a *= 1.15;
  if (has(g, 'odu')) a *= 1.06;
  if (has(g, 'ghe')) a *= 1.1;
  if (has(g, 'loa')) a *= 1.12;
  if (has(g, 'tu_kinh')) a *= 1.12;
  if (has(g, 'mayep') && wx(g).hot > 0.2) a *= 1.1;
  if (has(g, 'dieu_hoa') && isRestaurant(g)) a *= 1.18;
  if (isNight(g)) a *= isRestaurant(g) ? (has(g, 'den') ? 1.0 : 0.72) : (has(g, 'den') ? 0.95 : 0.3);
  if (wx(g).rain > 0.3) a *= isRestaurant(g) ? 1.0 : (has(g, 'odu') ? 0.95 : 0.45);
  a *= 0.6 + 0.4 * clamp(g.stall.cond / 70);
  a *= 1 - clamp(g.stall.dirt / 100) * 0.35;
  if (g.st.hygiene < 30) a *= 0.55 + g.st.hygiene / 66;
  return clamp(a, 0.1, 2.35);
}
/** Số khách tìm đến quầy mỗi giờ game. */
export function arrivalRate(g: Game): number {
  const s = g.stall; if (!s.open || s.where !== 'placed' || !s.spot) return 0;
  const sp = spotById(s.spot); if (!sp) return 0;
  const menu = menuOf(g).filter((r) => available(g, r)); if (!menu.length) return 0;
  const m = mods(g, sp.district), w = wx(g);
  const priceAppeal = menu.reduce((a, r) => a + clamp(Math.pow(r.ref / g.rec[r.id].price, 1.3), 0.25, 1.6), 0) / menu.length;
  const variety = 0.8 + Math.min(menu.length, 6) * 0.07;
  let rate = 4.6 * sp.traffic * hourCurve(hourOf(g), sp.district) * w.cust * m.traffic * stallAppeal(g) * (0.75 + g.rep / 50) * priceAppeal * variety;   // quầy mới vẫn có khách đều; uy tín 100 đông gấp ~3,7 lần
  if (m.rival) rate *= 0.68;
  if (floodPct(g) > 0.5 && floodZone(s.x, s.z)) rate *= 0.25;
  return rate;
}
export interface Persona { arch: ArchDef; budget: number; noise: number; regular?: string; likes?: string[]; }
export interface Order { rid: string; n: number; price: number; ratio: number; line: string; mood: 'ok' | 'pricey' | 'cheap'; /** món gọi thêm sau khi ăn xong (quán có chỗ ngồi) */ more?: boolean; /** số khách trong đoàn nếu là khách đoàn (bậc 6) */ group?: number; /** id bàn đặt trước nếu là khách đặt bàn */ bookingId?: number; }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export function say(tpl: string, a: ArchDef, fem: boolean, g: Game, extra: Record<string, string | number> = {}): string {
  const self = a.self[fem ? 1 : 0], you = a.you.replace('{ac}', g.ac);
  const v: Record<string, string | number> = { self, you, Self: cap(self), You: cap(you), ...extra };
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
}
/** Giá mà khách cho là "hợp lý" đối với một món ở quầy này. */
export function fairPrice(g: Game, r: RecipeDef, p: Persona, d: District): number {
  const m = mods(g, d);
  // Quầy mới (uy tín 0) bán đúng giá thị trường thì phần lớn khách bình dân vẫn mua (công nhân ~80%, học sinh ~60%); uy tín càng cao càng nâng giá được.
  const repMul = 1.1 + g.rep / 250 + clamp(g.rec[r.id].best - 0.6, 0, 0.4) * 0.25;
  return r.ref * p.arch.wtp * repMul * m.budget * p.noise * (m.rival ? 0.9 : 1) * (0.9 + DISTRICT[d].wealth * 0.1);
}
/** Khách đứng trước bảng giá và quyết định. Trả về đơn hàng hoặc lý do bỏ đi. */
export function decide(g: Game, p: Persona, fem: boolean, R: RNG = rnd): { order?: Order; leave?: string; why?: 'price' | 'none' | 'dirty' } {
  const sp = spotById(g.stall.spot ?? ''), d = sp?.district ?? districtAt(g.stall.x, g.stall.z), w = wx(g), m = mods(g, d), h = hourOf(g);
  if (g.st.hygiene < 18 && R.chance(0.5 - g.st.hygiene / 60)) return { leave: say(R.pick(LINES.dirty), p.arch, fem, g), why: 'dirty' };
  const menu = menuOf(g).filter((r) => available(g, r));
  if (!menu.length) return { leave: say(R.pick(LINES.none), p.arch, fem, g), why: 'none' };
  const slot = mealSlot(h), w5 = g.stall.tier >= 5;
  // Chọn món theo trọng số chứ không phải "món điểm cao nhất": thực đơn càng nhiều món thì khách
  // càng gọi đa dạng, và món đúng buổi (quán có chỗ ngồi) được ưu tiên rõ rệt.
  const cands: { r: RecipeDef; u: number; ratio: number }[] = [];
  let sum = 0;
  for (const r of menu) {
    const price = g.rec[r.id].price, ratio = price / fairPrice(g, r, p, d);
    let u = (p.arch.pref[r.cat] ?? 0.8) * (0.35 + r.meal[slot]) * (1 + 0.35 * w.hot * r.hot) * (m.demand[r.cat] ?? 1) * Math.pow(1 / ratio, 1.2) * R.range(0.7, 1.3);
    if (p.likes?.includes(r.cat)) u *= 1.6;
    // Quán có chỗ ngồi: khách ăn tại chỗ nên thích món đúng buổi hơn hẳn (sáng ăn sáng, trưa ăn cơm…).
    if (w5 && r.meal[slot] >= 0.8) u *= 1.35;
    if (price > p.budget) u *= 0.05;
    if (!(u > 0)) continue;
    cands.push({ r, u, ratio }); sum += u;
  }
  if (!cands.length) return { leave: say(R.pick(LINES.none), p.arch, fem, g), why: 'none' };
  let roll = R.range(0, sum), pick = cands[cands.length - 1];
  for (const c of cands) { roll -= c.u; if (roll <= 0) { pick = c; break; } }
  const r = pick.r, br = pick.ratio, price = g.rec[r.id].price;
  const k = 5 * r.elastic * Math.sqrt(p.arch.sens), pBuy = price > p.budget * 1.25 ? 0.03 : 1 / (1 + Math.exp((br - 1.15) * k));
  if (!R.chance(pBuy)) return { leave: say(R.pick(LINES.pricey_leave), p.arch, fem, g, { dish: r.name.toLowerCase(), price: money(price) }), why: 'price' };
  let n = 1;
  if (r.fill < 30 && R.chance(0.3)) n = 2;
  if (p.arch.id === 'phuhuynh' && R.chance(0.45)) n = 2;
  n = Math.min(n, readyCount(g, r.id) + finishPossible(g, r), Math.max(1, Math.floor(p.budget / price)));
  const mood: Order['mood'] = br > 1.12 ? 'pricey' : br < 0.72 ? 'cheap' : 'ok';
  const pool = mood === 'pricey' ? LINES.pricey_buy : p.regular && R.chance(0.6) ? LINES.order_regular : LINES.order;
  const line = say(R.pick(pool), p.arch, fem, g, { dish: r.name.toLowerCase(), n: n === 1 ? 'một' : 'hai', price: money(price) });
  return { order: { rid: r.id, n, price, ratio: br, line, mood } };
}
/** Quyết định gọi món cho khách đoàn (3–4 người) tại Nhà hàng bình dân: cả nhóm gọi chung một lượt. */
export function decideGroup(g: Game, p: Persona, size: number, fem: boolean, R: RNG = rnd, preferredDish?: string): { order?: Order; leave?: string; why?: 'price' | 'none' | 'dirty' } {
  const sp = spotById(g.stall.spot ?? ''), d = sp?.district ?? districtAt(g.stall.x, g.stall.z), w = wx(g), m = mods(g, d), h = hourOf(g);
  if (g.st.hygiene < 18 && R.chance(0.45 - g.st.hygiene / 65)) return { leave: say(R.pick(LINES.dirty), p.arch, fem, g), why: 'dirty' };
  const menu = menuOf(g).filter((r) => readyCount(g, r.id) + finishPossible(g, r) >= Math.min(2, size));
  if (!menu.length) return { leave: say(R.pick(LINES.none), p.arch, fem, g), why: 'none' };
  const slot = mealSlot(h), grpBudget = p.budget * size;
  const cands: { r: RecipeDef; u: number; ratio: number }[] = [];
  let sum = 0;
  for (const r of menu) {
    const price = g.rec[r.id].price, ratio = price / fairPrice(g, r, p, d);
    let u = (p.arch.pref[r.cat] ?? 0.8) * (0.4 + r.meal[slot]) * (1 + 0.35 * w.hot * r.hot) * (m.demand[r.cat] ?? 1) * Math.pow(1 / ratio, 1.15) * R.range(0.75, 1.25);
    if (r.meal[slot] >= 0.8) u *= 1.35;
    if (preferredDish && r.id === preferredDish) u *= 2.8;
    if (readyCount(g, r.id) + finishPossible(g, r) >= size) u *= 1.6;
    if (price > p.budget * 1.15) u *= 0.15;
    if (!(u > 0)) continue;
    cands.push({ r, u, ratio }); sum += u;
  }
  if (!cands.length) return { leave: say(R.pick(LINES.none), p.arch, fem, g), why: 'none' };
  let roll = R.range(0, sum), pick = cands[cands.length - 1];
  for (const c of cands) { roll -= c.u; if (roll <= 0) { pick = c; break; } }
  const r = pick.r, br = pick.ratio, price = g.rec[r.id].price;
  const k = 4.6 * r.elastic * Math.sqrt(p.arch.sens), pBuy = price > p.budget * 1.3 ? 0.05 : 1 / (1 + Math.exp((br - 1.2) * k));
  if (!R.chance(pBuy)) return { leave: say(R.pick(LINES.pricey_leave), p.arch, fem, g, { dish: r.name.toLowerCase(), price: money(price) }), why: 'price' };
  const stock = readyCount(g, r.id) + finishPossible(g, r);
  const n = clamp(Math.min(size, stock, Math.max(1, Math.floor(grpBudget / price))), 1, size);
  const mood: Order['mood'] = br > 1.12 ? 'pricey' : br < 0.72 ? 'cheap' : 'ok';
  const line = say(R.pick(LINES.order_group), p.arch, fem, g, { dish: r.name.toLowerCase(), n, price: money(price) });
  return { order: { rid: r.id, n, price, ratio: br, line, mood, group: size } };
}
/** Số sao của một phần đã nấu sẵn (dùng cho chất lượng ăn lại, và cho tỉ lệ đau bụng). 0–1 → 1–5 sao. */
export const dishStars = (rd: { q: number }) => clamp(1 + clamp(rd.q, 0, 1) * 4, 1, 5);

export interface Review { stars: number; rep: number; tip: number; line: string; face: number; back: boolean; }
/** Khách đánh giá sau khi nhận món. quality 0–1, wait: tỉ lệ thời gian đã chờ so với sự kiên nhẫn. */
/** Khách ngồi ăn xong có thể gọi thêm một món tráng miệng / đồ uống (chỉ quán có chỗ ngồi, bậc 5). */
export function secondOrder(g: Game, p: Persona, first: Order, fem = false, R: RNG = rnd): Order | null {
  if (!dineIn(g)) return null;
  const slot = mealSlot(hourOf(g)), left = p.budget - first.price * first.n;
  const cand = menuOf(g).filter((r) => r.id !== first.rid && available(g, r) && ['che', 'nuoc', 'anvat'].includes(r.cat) && r.meal[slot] >= 0.6 && g.rec[r.id].price <= left);
  if (!cand.length) return null;
  // Ăn món nhẹ (bánh tráng, gỏi cuốn…) thì dễ gọi thêm; món no thì thôi.
  const light = RECIPES[first.rid].fill < 30;
  if (!R.chance(light ? 0.5 : 0.3)) return null;
  const r = cand[Math.min(cand.length - 1, Math.floor(R.range(0, cand.length)))];
  const price = g.rec[r.id].price;
  const line = say(R.pick(LINES.order_more), p.arch, fem, g, { dish: r.name.toLowerCase(), price: money(price) });
  return { rid: r.id, n: 1, price, ratio: price / fairPrice(g, r, p, districtAt(g.stall.x, g.stall.z)), line, mood: 'ok', more: true };
}

export function review(g: Game, p: Persona, fem: boolean, o: Order, quality: number, wait: number, R: RNG = rnd): Review {
  const value = clamp(1.35 - o.ratio, 0, 1), hyg = (g.st.hygiene < 30 ? (30 - g.st.hygiene) / 100 : 0) + clamp(g.stall.dirt / 100) * 0.12;
  const service = (g.st.mood < 25 ? -0.05 : g.st.mood > 70 ? 0.03 : 0)
    + (has(g, 'ghe') ? 0.03 : 0)
    + (has(g, 'hopmangve') ? 0.03 : 0)
    + (has(g, 'binh_tra') ? 0.03 : 0)
    + (has(g, 'may_quat') ? 0.04 : 0)
    + (has(g, 'may_tinh_tien') ? 0.04 : 0)
    + (has(g, 'dieu_hoa') && isRestaurant(g) ? 0.06 : 0)
    + (has(g, 'wc_lavabo') && isRestaurant(g) && (p.arch.id === 'khotinh' || p.arch.id === 'phebinh' || p.arch.id === 'nhagiau') ? 0.06 : 0);
  const picky = p.arch.id === 'khotinh' || p.arch.id === 'phebinh' ? 0.08 : 0;
  const s = clamp(0.12 + 0.63 * quality + 0.13 * (1 - clamp(wait)) + 0.12 * value + service - hyg - picky);
  const stars = clamp(1 + s * 4.3, 1, 5);
  const damp = 1 / (1 + g.rep / 60);
  let rep = (stars - 3.25) * 0.55 * (stars > 3.25 ? damp : 1);
  if (p.arch.id === 'phebinh') rep = (stars - 3.6) * 7;
  if (p.arch.id === 'nhagiau' && stars > 4.2) rep += 0.6;
  let tip = 0;
  const posTip = has(g, 'may_tinh_tien') ? 0.08 : 0;
  if (stars >= 4.3 && R.chance(p.arch.tip * 2.2 + (stars - 4.3) + posTip)) tip = Math.max(1000, round1k(o.price * o.n * R.range(0.06, 0.2)));
  const key = quality < 0.2 ? 'awful' : stars >= 4.5 ? 'great' : stars >= 3.7 ? 'good' : stars >= 2.8 ? 'ok' : stars >= 1.9 ? 'bad' : 'awful';
  let line = say(R.pick(LINES[key]), p.arch, fem, g);
  if (tip > 0) line += ' ' + say(R.pick(LINES.tip), p.arch, fem, g);
  else if (o.mood === 'cheap' && stars >= 3.7 && R.chance(0.5)) line = say(R.pick(LINES.cheap), p.arch, fem, g);
  const face = stars >= 4.7 ? EXPR.savor : stars >= 4.4 ? EXPR.joy : stars >= 3.7 ? EXPR.happy : stars >= 2.8 ? EXPR.normal : stars >= 1.9 ? EXPR.annoyed : EXPR.angry;
  return { stars, rep, tip, line, face, back: stars >= 3.9 };
}
/** Ghi nhận một lần bán: tiền, sổ sách, uy tín. */
export function settleSale(g: Game, o: Order, cost: number, rv: Review, quality: number) {
  if (typeof g.flags.firstSale !== 'number') g.flags.firstSale = g.day;
  earn(g, o.price * o.n, 'revenue'); if (rv.tip) earn(g, rv.tip, 'tips');
  g.led.cogs += cost; g.led.sold += o.n; g.led.customers++; g.led.stars += rv.stars; g.led.rated++;
  g.tot.served += o.n; g.rep = clamp(g.rep + rv.rep, 0, 100);
  const rs = g.rec[o.rid]; rs.made += o.n; rs.best = Math.max(rs.best, quality);
  g.st.mood = clamp(g.st.mood + (rv.stars - 3) * 1.2, 0, STAT_MAX);
  const dirtMul = has(g, 'hut_mui') ? 0.45 : has(g, 'tu_kinh') ? 0.65 : 1;
  g.stall.dirt = clamp(g.stall.dirt + 0.8 * o.n * dirtMul, 0, 100);
}
export function lostCustomer(g: Game, why: 'wait' | 'price' | 'none' | 'dirty') {
  g.led.lost++;
  g.rep = clamp(g.rep - (why === 'wait' ? 0.5 : why === 'dirty' ? 0.35 : why === 'price' ? 0.08 : 0.05), 0, 100);
  if (why === 'wait') g.st.mood = clamp(g.st.mood - 2, 0, STAT_MAX);
}

// ───────────────────────── Chỉ số sinh tồn ─────────────────────────
export interface Activity { moving: boolean; running: boolean; sleeping: boolean; sheltered: boolean; working: boolean; load: number; sleepQ: number; }
export const staminaMax = (g: Game) => clamp(0.35 + 0.65 * Math.min(g.st.hunger, g.st.thirst) / 55, 0.35, 1);

// ───────────── Thanh chạy: hồi nhanh hay chậm tuỳ MÁU và PIN (lượt 53) ─────────────
// Trước đây thanh thể lực hồi với một con số cố định (0,09/giây khi đứng, 0,05/giây khi đi),
// nên người đang mất máu 20 vẫn chạy khoẻ y như người đầy đủ. Giờ tốc độ hồi do hai chỉ số quyết định:
// máu (đang thương/ốm thì thở dốc) và pin năng lượng (thiếu ngủ thì hụt hơi), và người yếu còn
// TỤT nhanh hơn khi chạy — chạy được quãng ngắn hơn hẳn.
/** Hệ số hồi thể lực theo máu: 0,5 khi máu 20 (hồi đúng một nửa), 1 khi máu từ 70 trở lên, sàn 0,3. */
export function staminaHpMul(g: Game): number {
  return clamp(0.5 + 0.5 * (g.st.health - 20) / 50, 0.3, 1);
}
/** Hệ số hồi thể lực theo pin năng lượng: 1 khi pin từ 60 trở lên, 0,45 khi cạn pin. */
export function staminaEnergyMul(g: Game): number {
  return clamp(0.45 + 0.55 * g.st.energy / 60, 0.45, 1);
}
/**
 * Gộp máu và pin thành MỘT hệ số hồi: máu là thứ chính (máu 20 ⇒ đúng một nửa), pin chỉ phụ
 * (cạn pin thì chậm thêm nhiều nhất 22 %, không cộng dồn cho thành gần như không hồi).
 * Sàn 0,28 khi cả hai cùng tệ, để người chơi vẫn hồi được chứ không kẹt vĩnh viễn.
 */
export function staminaRegenMul(g: Game): number {
  return clamp(staminaHpMul(g) * (0.6 + 0.4 * staminaEnergyMul(g)), 0.28, 1);
}
/**
 * Thể lực hồi mỗi giây (thang 0–1). Đứng yên hồi nhanh hơn vừa đi bộ — y như cũ,
 * chỉ khác là nhân thêm hệ số sức khoẻ. Người khoẻ: 11 giây đầy thanh; máu 20: 22 giây.
 */
export function staminaRegen(g: Game, moving: boolean): number {
  return (moving ? 0.05 : 0.09) * staminaRegenMul(g);
}
/** Thể lực mất mỗi giây khi chạy — máu thấp/pin cạn thì mau đuối hơn, tối đa gấp 1,6 lần. */
export function staminaDrain(g: Game): number {
  return 0.1 * clamp(1 + (1 - staminaHpMul(g)) * 0.6 + (1 - staminaEnergyMul(g)) * 0.4, 1, 1.6);
}
/** Chạy liên tục được bao nhiêu giây từ thanh đầy (thang 0–1) — để menu test và tài liệu so sánh. */
export const staminaRunSecs = (g: Game) => 1 / staminaDrain(g);
/** Hồi từ cạn tới đầy mất bao nhiêu giây (đứng yên) — dùng để so người khoẻ với người đang thương. */
export const staminaRefillSecs = (g: Game) => 1 / staminaRegen(g, false);
/** Thể trạng cơ thể: 0 gọn gàng (đi nhanh, mau đói), 1 vừa, 2 đậm (chậm hơn nhưng lì sức). Đổi ở tiệm may. */
export function bodyType(g: Game): 0 | 1 | 2 {
  const fat = g.look.fat;
  return fat < 0.98 ? 0 : fat > 1.06 ? 2 : 1;
}
/** Hệ số tốc độ đi bộ theo thể trạng — gọn thì nhanh hơn đậm khoảng 6%. */
export const BODY_SPEED = [1.06, 1, 0.94] as const;
/** Hệ số hao sức khi làm việc theo thể trạng — đậm thì lì hơn, gọn mau đuối. */
export const BODY_DRAIN = [1.12, 1, 0.9] as const;

export function moveMul(g: Game, x: number, z: number): number {
  let m = wx(g).walk * BODY_SPEED[bodyType(g)];
  if (g.st.health < 45) m *= 0.62 + 0.38 * g.st.health / 45;          // bị thương/ốm → đi chậm
  if (g.st.energy < 12) m *= 0.8;
  if (floodPct(g) > 0.35 && floodZone(x, z)) m *= lerp(1, 0.55, clamp((floodPct(g) - 0.35) * 2.5));
  return m;
}
export const floodPct = (g: Game) => clamp(g.weather.flood);
export function tickStats(g: Game, dm: number, a: Activity) {
  const s = g.st, w = wx(g);
  const work = (a.running ? 1.7 : a.working ? 1.35 : a.moving ? 1.1 : 1) * (a.sleeping ? 1 : BODY_DRAIN[bodyType(g)]), load = 1 + clamp(a.load) * 0.5;
  if (a.sleeping) {
    // Ngủ ở chỗ tử tế (khách sạn, phòng trọ, căn hộ, nhà riêng) thì đói và khát tụt ít hơn hẳn —
    // người chơi: "ngủ ở khách sạn và trọ thì đồ ăn, nước chỉ số tụt sẽ giảm đi đáng kể (không tụt nhiều)".
    // Ngủ gầm cầu / ghế đá thì vẫn tụt gần như cũ (chỗ tồi thì ngủ dậy vẫn mệt và đói).
    const rest = clamp((a.sleepQ - 0.4) / 0.9, 0, 1);   // 0 = ngủ tệ nhất, 1 = khách sạn
    const drainMul = 1 - 0.6 * rest;                    // khách sạn giảm 60 %, phòng trọ giảm 40 %
    // Hồi năng lượng CHẬM DẦN khi gần đầy: giường xịn (1,25) và ghế đá (0,5) trước đây đều chạm trần 100
    // sau đúng 8 tiếng, nên chỗ ngủ tốt chẳng có lợi gì. Giờ giường khách sạn đầy pin sớm hơn, và chỗ ngủ
    // xịn còn dư đà để hồi máu/tinh thần trong phần còn lại của giấc.
    const room = 1 - clamp(s.energy / STAT_MAX);              // 1 khi kiệt sức, 0 khi đã đầy
    s.energy += dm * 0.215 * a.sleepQ * (0.35 + 0.65 * room);
    s.hunger -= dm * 0.03 * drainMul; s.thirst -= dm * 0.04 * drainMul;
    s.health += dm * 0.03 * a.sleepQ; s.mood += dm * 0.02 * (a.sleepQ - 0.7);
  } else {
    s.energy -= dm * 0.085 * work * load; s.hunger -= dm * 0.1 * work; s.thirst -= dm * 0.15 * work * (w.id === 'nong' ? 1.6 : 1);
  }
  s.hygiene -= dm * 0.04 * (a.working ? 1.5 : 1);
  // ướt mưa
  const exposed = !a.sheltered && !has(g, 'aomua');
  g.weather.wet = clamp(g.weather.wet + (exposed ? w.wet : -25) * dm / 60, 0, 100);
  if (g.weather.wet > 55) { s.health -= dm * 0.04; s.mood -= dm * 0.05; if (!g.flags.sick && rnd.chance(dm * 0.004)) { g.flags.sick = 1; toast('Bạn bị cảm lạnh vì dầm mưa. Mua thuốc ở nhà thuốc An Tâm.', 'bad', 'heart', true); } }
  if (g.flags.sick) { s.health -= dm * 0.035; s.energy -= dm * 0.03; }
  // đau bụng: máu tụt dần, sức cũng tụt; hết vài giờ thì tự dịu, nhưng uống thuốc thì khỏi ngay
  const stom = stomachLeft(g);
  if (stom > 0) {
    s.health -= dm * 0.05; s.energy -= dm * 0.04; s.mood -= dm * 0.02;
    (g.flags as any).dauBung = Math.max(0, stom - dm);
    if (stom - dm <= 0) toast('Cơn đau bụng đã dịu xuống, người nhẹ hẳn.', 'good', 'heart');
  }
  if (s.hunger <= 0) s.health -= dm * 0.09;
  if (s.thirst <= 0) s.health -= dm * 0.13;
  if (s.energy <= 0) s.health -= dm * 0.05;
  if (s.hunger > 40 && s.thirst > 40 && s.energy > 30 && !g.flags.sick && stom <= 0) s.health += dm * 0.012;
  // tinh thần trôi dần về mức nền
  const base = clamp(42 + HOUSING[g.housing].mood + (s.hunger < 25 ? -14 : 0) + (s.hygiene < 25 ? -10 : 0) + (g.debts.some((d) => g.day > d.due) ? -15 : 0) + (g.rep > 40 ? 8 : 0), 5, 90);
  s.mood += (base - s.mood) * clamp(dm * 0.0025);
  for (const k of Object.keys(s) as (keyof typeof s)[]) s[k] = clamp(s[k], 0, STAT_MAX);
}
/** Ăn/uống một món. */
export function consume(g: Game, eff: { h?: number; t?: number; m?: number; hp?: number; e?: number; hy?: number }, risky = 0) {
  const s = g.st;
  s.hunger = clamp(s.hunger + (eff.h ?? 0), 0, STAT_MAX); s.thirst = clamp(s.thirst + (eff.t ?? 0), 0, STAT_MAX); s.mood = clamp(s.mood + (eff.m ?? 0), 0, STAT_MAX);
  s.health = clamp(s.health + (eff.hp ?? 0), 0, STAT_MAX); s.energy = clamp(s.energy + (eff.e ?? 0), 0, STAT_MAX); s.hygiene = clamp(s.hygiene + (eff.hy ?? 0), 0, STAT_MAX);
  if ((eff.hp ?? 0) >= 20 && g.flags.sick) { delete g.flags.sick; toast('Hết cảm rồi, khoẻ lại rồi!', 'good', 'heart'); }
  if (risky > 0 && rnd.chance(risky)) sickStomach(g, 'Ăn đồ ôi thiu');
}

// ───────────────────────── Đau bụng (lượt 41) ─────────────────────────
/**
 * Đau bụng: ăn/uống đồ không đảm bảo thì có thể bị. Không trừ máu ngay như trước —
 * máu tụt dần theo thời gian cho tới khi mua thuốc đau bụng (hoặc uống thuốc bổ) ở nhà thuốc.
 * Lý do đổi: bản cũ trừ thẳng 18 máu rồi thôi, người chơi mất máu mà không có cách chữa rõ ràng.
 */
export const STOMACH_FEE = 12000;
export function sickStomach(g: Game, why: string, mins = 90) {
  const f = g.flags as any;
  if (typeof f.dauBung === 'number' && f.dauBung > 0) return false; // đang đau sẵn thì không chồng thêm
  f.dauBung = mins;
  g.st.mood = clamp(g.st.mood - 8, 0, STAT_MAX);
  toast(`${why} — đau bụng quá! Ghé nhà thuốc An Tâm mua thuốc đau bụng, hoặc vào bệnh viện khám.`, 'bad', 'heart', true);
  return true;
}
/** Còn đau bụng không, và còn bao nhiêu phút. */
export const stomachLeft = (g: Game) => Math.max(0, Number((g.flags as any).dauBung ?? 0));
export const isStomach = (g: Game) => stomachLeft(g) > 0;
/**
 * Tỉ lệ đau bụng khi ăn/uống thứ gì đó.
 * Đồ mình tự nấu: từ 2 sao trở lên thì gần như không sao, dưới 2 sao thì vẫn có rủi ro.
 * Đồ mua sẵn / nước ở chỗ công cộng: rủi ro cao hơn hẳn.
 */
export function stomachChance(g: Game, src: { selfMade?: boolean; stars?: number; bought?: boolean; rank?: number; risky?: number }): number {
  let p = src.risky ?? 0;
  if (src.bought) p += 0.06;
  if (src.selfMade) {
    const st = src.stars ?? 3;
    p += st >= 3 ? 0 : st >= 2 ? 0.02 : 0.08;   // đồ mình nấu: 3 sao = 0 %, 2 sao = 2 %, dưới 2 sao = 8 %
  }
  if (typeof src.rank === 'number') p += src.rank;  // nước ở chỗ công cộng (vòi nước, công viên)
  if (isStomach(g)) p *= 0.5;                        // đang đau bụng thì bớt chồng thêm
  return clamp(p, 0, 0.9);
}

// ───────────────────────── Sức khoẻ: xỉu & bệnh viện ─────────────────────────
/** Phí khám bác sĩ. Khám xong mới biết bệnh, nhưng vẫn phải trả trước. */
export const EXAM_FEE = 20000;
/** Giá một giờ nằm phòng hồi sức. */
export const RECOVER_FEE = 5000;
/** Tiền xe cấp cứu cộng viện phí khi ngất — luôn có mức trần để người mới chơi không sạt nghiệp. */
export const FAINT_FEE = 30000;

export interface MedDef { id: string; name: string; price: number; desc: string; hp: number; e: number; cures?: 'sick' | 'stomach'; }
/** Quầy thuốc trong bệnh viện: bán đúng thứ người bệnh cần, dùng ngay tại chỗ. */
export const MEDS: Record<string, MedDef> = {
  cam: { id: 'cam', name: 'Thuốc cảm', price: 15000, desc: 'Một liều là hết sợi cảm, người nhẹ hẳn.', hp: 8, e: 4, cures: 'sick' },
  bang: { id: 'bang', name: 'Bông băng', price: 8000, desc: 'Băng vết trầy, cầm máu, đỡ rát.', hp: 14, e: 0 },
  bo: { id: 'bo', name: 'Thuốc bổ', price: 25000, desc: 'Uống cho lại sức, bớt chóng mặt.', hp: 22, e: 14 },
  daubung: { id: 'daubung', name: 'Thuốc đau bụng', price: STOMACH_FEE, desc: 'Uống một liều là cơn đau bụng dịu ngay, khỏi phải nằm.', hp: 6, e: 2, cures: 'stomach' },
};
export const MED_LIST = Object.values(MEDS);

/** Mua thuốc ở quầy bệnh viện: trả tiền rồi dùng luôn. false nếu không đủ tiền. */
export function buyMed(g: Game, id: string): boolean {
  const m = MEDS[id];
  if (!m || !spend(g, m.price, 'other')) return false;
  consume(g, { hp: m.hp, e: m.e });
  if (m.cures === 'sick' && g.flags.sick) { delete g.flags.sick; toast('Uống thuốc cảm, trong người nhẹ hẳn ra.', 'good', 'heart'); }
  if (m.cures === 'stomach' && isStomach(g)) { (g.flags as any).dauBung = 0; toast('Uống thuốc đau bụng, cơn đau dịu hẳn. Đỡ hơn nhiều rồi.', 'good', 'heart'); }
  return true;
}

/** Khám bệnh: trả phí rồi bác sĩ nói bệnh gì. null nếu không đủ tiền khám. */
export function exam(g: Game): string | null {
  if (!spend(g, EXAM_FEE, 'other')) return null;
  g.flags.exam = g.day;
  const s = g.st;
  if (g.flags.sick) return 'Bác sĩ nói bạn bị cảm nặng, ho cả tuần rồi. Ra quầy thuốc mua thuốc cảm uống liền đi.';
  if (isStomach(g)) return 'Bác sĩ nghe bụng rồi gật gù: rối loạn tiêu hoá, ăn uống bậy bạ phải không? Ra quầy thuốc mua liều thuốc đau bụng, uống là dịu ngay.';
  if (s.health < 35) return 'Bác sĩ lắc đầu: suy nhược, thiếu ăn thiếu ngủ. Nằm phòng hồi sức vài giờ rồi hẵng đi làm.';
  if (s.hunger < 25) return 'Không bệnh gì, chỉ là đói quá thôi. Kiếm gì bỏ bụng rồi tính tiếp.';
  if (s.hygiene < 30) return 'Bác sĩ nhíu mày: người lem luốc quá, dễ nhiễm trùng. Tắm rửa sạch sẽ rồi quay lại.';
  return 'Bác sĩ nghe tim, đo huyết áp rồi cười: trong người ổn, cứ ăn ngủ đều là được.';
}

/** Tiền giường phòng hồi sức cho số giờ nằm. */
export const recoverCost = (hours: number) => RECOVER_FEE * Math.max(1, Math.round(hours));
/** Nằm phòng hồi sức: trả tiền giường, mỗi giờ hồi một ít sức khoẻ. false nếu không đủ tiền. */
export function recover(g: Game, hours: number): boolean {
  const h = Math.max(1, Math.round(hours));
  if (!spend(g, recoverCost(h), 'other')) return false;
  consume(g, { hp: 14 * h, e: 10 * h, h: -3 * h, t: -3 * h, m: 3 * h });
  return true;
}

/** Nhận lại đồ rơi lúc ngất — chỉ trong ngày hôm đó, ở bệnh viện. Trả về danh sách đã nhận. */
export function claimLost(g: Game): Stack[] {
  if (!g.lostBag?.length || g.lostDay !== g.day) return [];
  const items = g.lostBag;
  g.lostBag = []; g.lostDay = -1;
  for (const s of items) addStack(weightOf(g.bag) + weightOf([s]) <= carryCap(g) ? g.bag : g.home, s);
  return items;
}

export interface FaintResult { fee: number; lost: Stack[]; }
/**
 * Ngất vì sức khoẻ về 0: người đi đường đưa vào bệnh viện.
 * Mất tiền xe cấp cứu + viện phí (tối đa 30.000₫ + 15% số tiền đang có, không bao giờ âm),
 * rơi lại một phần đồ trong ba lô, tỉnh dậy thì sức khoẻ chỉ còn 45.
 */
export function faint(g: Game): FaintResult {
  const fee = Math.min(g.cash, round1k(FAINT_FEE + g.cash * 0.15));
  spend(g, fee, 'other');
  const n = Math.min(g.bag.length, Math.ceil(g.bag.length * 0.4));
  const lost = n > 0 ? g.bag.splice(g.bag.length - n, n) : [];
  if (lost.length) { g.lostBag = lost.map((s) => ({ ...s })); g.lostDay = g.day; }
  const s = g.st;
  s.health = 45; s.energy = Math.max(s.energy, 40);
  s.mood = clamp(s.mood - 18, 0, STAT_MAX); s.hygiene = clamp(s.hygiene - 22, 0, STAT_MAX);
  s.hunger = clamp(s.hunger - 8, 0, STAT_MAX); s.thirst = clamp(s.thirst - 8, 0, STAT_MAX);
  g.rep = clamp(g.rep - 6, 0, 100);
  g.flags.faint = (g.flags.faint ?? 0) + 1; g.flags.faintDay = g.day;
  return { fee, lost };
}

// ───────────────────────── Thời tiết ─────────────────────────
export function nextWeather(cur: WeatherId, R: RNG = rnd): WeatherId {
  const opts = Object.entries(WEATHER[cur].next) as [WeatherId, number][];
  return R.weighted(opts, (o) => o[1])![0];
}
export function setWeather(g: Game, id: WeatherId, R: RNG = rnd, announce = true) {
  const w = WEATHER[id], changed = g.weather.now !== id;
  g.weather.now = id; g.weather.until = absMin(g) + R.range(w.dur[0], w.dur[1]) * 60; g.weather.next = nextWeather(id, R);
  if (changed) { bus.emit('weather', id); if (announce) toast(w.say, id === 'bao' || id === 'giong' ? 'warn' : 'info', w.icon); }
}

// ───────────────────────── Đạo diễn sự kiện ─────────────────────────
function eligible(g: Game, e: EventDef): boolean {
  const h = hourOf(g);
  if (g.day < (e.minDay ?? 0)) return false;
  if (e.hours && (h < e.hours[0] || h > e.hours[1])) return false;
  if (g.ev.last[e.id] !== undefined && g.day - g.ev.last[e.id] < e.cool) return false;
  if (eventOn(g, e.id)) return false;
  const s = g.stall;
  switch (e.need) {
    case 'stall': return s.tier > 0;
    case 'open': return s.open;
    case 'debt': return g.debts.length > 0 && g.cash < 100000;
    case 'rep20': return g.rep >= 20 && s.where === 'placed';
    case 'rep40': return g.rep >= 40 && s.open;
    case 'spot_hem': return s.open && s.spot === 'hem' && (g.flags.gangPaid ?? -9) < g.day;
    case 'poor': return HOUSING[g.housing].safety < 0.5 && (g.home.length > 0 || s.where === 'home');
    case 'home': return g.housing !== 'gamcau';
  }
  if (e.weather && (g.weather.now === 'bao')) return false;
  if (e.festive && activeEvents(g).some((x) => x.festive)) return false;
  return true;
}
export function startEvent(g: Game, id: string, R: RNG = rnd): boolean {
  const e = EVENTS[id]; if (!e || eventOn(g, id)) return false;
  const a = { id, until: absMin(g) + e.dur * 60, data: undefined as any };
  g.ev.active.push(a); g.ev.last[id] = g.day; g.ev.lastStart = absMin(g);
  if (e.outOf) {
    const pool = Object.values(SHOPS).filter((s) => s.id.startsWith('m_')).flatMap((s) => s.items);
    g.wd.outOf = R.shuffle(pool.slice()).slice(0, e.outOf);
    toast(e.text + ' Hết: ' + g.wd.outOf.map((i) => INGS[i].name).join(', ') + '.', 'event', e.icon, true);
  } else toast(e.text, e.danger ? 'warn' : 'event', e.icon, true);
  if (e.weather) setWeather(g, e.weather, R, false);
  if (e.gift) { earn(g, e.gift, 'side'); g.st.mood = clamp(g.st.mood + 20, 0, STAT_MAX); }
  bus.emit('event', { id, on: true });
  return true;
}
export function endEvent(g: Game, id: string) {
  const i = g.ev.active.findIndex((a) => a.id === id); if (i < 0) return;
  g.ev.active.splice(i, 1);
  if (EVENTS[id]?.outOf) g.wd.outOf = [];
  bus.emit('event', { id, on: false });
}
function directEvents(g: Game, R: RNG) {
  const now = absMin(g);
  for (const a of g.ev.active.slice()) if (now >= a.until) endEvent(g, a.id);
  if (now < g.ev.check) return;
  g.ev.check = now + 60;
  if (g.ev.active.filter((a) => !EVENTS[a.id].price).length >= 2 || now - g.ev.lastStart < 150) return;
  const pool = EVENT_LIST.filter((e) => eligible(g, e)); if (!pool.length) return;
  const sum = pool.reduce((a, e) => a + e.w, 0);
  if (!R.chance(clamp(0.05 + sum * 0.012, 0, 0.3))) return;
  startEvent(g, R.weighted(pool, (e) => e.w)!.id, R);
}

// ───────────────────────── Nợ nần ─────────────────────────
export const totalDebt = (g: Game) => g.debts.reduce((a, d) => a + d.owed, 0);
export const overdue = (g: Game) => g.debts.filter((d) => g.day > d.due);
export function loanLimit(g: Game, lender: string): number {
  const L = LENDERS[lender]; if (!L) return 0;
  if (g.credit > g.day && lender !== 'tab') return 0;
  if (L.need === 'tro' && g.housing !== 'tro' && g.housing !== 'khachsan') return 0;
  const owed = g.debts.filter((d) => d.lender === lender).reduce((a, d) => a + d.owed, 0);
  return Math.max(0, L.max(g.rep, g.day) - owed);
}
export function borrow(g: Game, lender: string, amount: number): boolean {
  const L = LENDERS[lender]; if (!L || amount <= 0 || amount > loanLimit(g, lender)) return false;
  g.debts.push({ id: g.debtSeq++, lender, principal: amount, owed: amount, due: g.day + L.term, late: 0, taken: g.day, ext: 0 });
  if (lender !== 'tab') { g.cash += amount; bus.emit('cash', amount); }
  bus.emit('save', 'vay'); return true;
}
export function repay(g: Game, debtId: number, amount: number): number {
  const d = g.debts.find((x) => x.id === debtId); if (!d) return 0;
  const pay = Math.min(amount, d.owed, g.cash); if (pay <= 0) return 0;
  g.cash -= pay; d.owed -= pay; bus.emit('cash', -pay);
  if (d.owed < 1) { g.debts.splice(g.debts.indexOf(d), 1); changeRel(g, d.lender, d.late ? 2 : 8); if (d.lender === 'bank') g.rep = clamp(g.rep + 0.5, 0, 100); }
  bus.emit('save', 'tra no'); return pay;
}
/** Xin khất nợ: thành công thì lùi hạn, trả phí. */
export function extend(g: Game, debtId: number, R: RNG = rnd): { ok: boolean; fee: number; line: string } {
  const d = g.debts.find((x) => x.id === debtId)!; const L = LENDERS[d.lender];
  const fee = round1k(d.owed * (d.lender === 'shark' ? 0.08 : 0.03));
  const p = clamp(0.75 - d.ext * 0.3 + (g.rel[d.lender]?.v ?? 0) / 150 + (g.st.mood - 50) / 300, 0.05, 0.95);
  if (g.cash < fee) return { ok: false, fee, line: d.lender === 'shark' ? 'Không có tiền phí mà đòi khất? Biến!' : 'Bạn cần đóng phí gia hạn trước.' };
  if (!R.chance(p)) { changeRel(g, d.lender, -4); return { ok: false, fee, line: d.lender === 'shark' ? 'Khất hoài! Tao hết kiên nhẫn rồi đó.' : 'Rất tiếc, hồ sơ của bạn không được gia hạn thêm.' }; }
  g.cash -= fee; g.led.interest += fee; bus.emit('cash', -fee); d.due = Math.max(d.due, g.day) + (d.lender === 'shark' ? 3 : 7); d.ext++; d.late = 0;
  return { ok: true, fee, line: d.lender === 'shark' ? `Ừ, cho thêm ba ngày. Phí ${money(fee)}. Lần sau là tao lấy đồ.` : `Đã gia hạn thêm 7 ngày, phí ${money(fee)}.` };
}
export const gearResale = (g: Game, id: string) => Math.round(GEAR[id].price * 0.5 * (0.4 + 0.6 * (g.gear[id] ?? 100) / 100) / 1000) * 1000;
export function sellGear(g: Game, id: string): number {
  if (!has(g, id)) return 0;
  const v = gearResale(g, id); removeGear(g, id); g.cash += v; bus.emit('cash', v); return v;
}
export function removeGear(g: Game, id: string) {
  delete g.gear[id];
  const d = GEAR[id];
  if (d.kind === 'phone') PH.deactivate(g, id);
  if (d.kind === 'stall' && d.tier === g.stall.tier) {
    // mất quầy: nguyên liệu trong quầy rơi lại túi (phần xách nổi), còn lại mất
    const lower = TIERS.filter((t) => t.tier > 0 && t.tier < d.tier! && has(g, t.id)).pop();
    const keep = g.stall.store;
    g.stall = { ...emptyStall(), cond: 100 };
    if (lower) { g.stall.tier = lower.tier; g.stall.where = 'carried'; g.stall.store = keep; }
    else for (const s of keep) if (bagWeight(g) + s.n * INGS[s.id].kg <= carryCap(g)) addStack(g.bag, s);
  }
}
function seize(g: Game, d: Debt): string[] {
  const taken: string[] = [];
  const ids = Object.keys(g.gear).sort((a, b) => GEAR[b].price - GEAR[a].price);
  for (const id of ids) {
    if (d.owed <= 0) break;
    d.owed -= gearResale(g, id) * 0.8; taken.push(GEAR[id].name); removeGear(g, id);
  }
  return taken;
}
function dailyDebts(g: Game) {
  for (const d of g.debts.slice()) {
    const L = LENDERS[d.lender];
    const interest = Math.round(d.principal * L.rate); d.owed += interest; g.led.interest += interest;
    if (g.day > d.due) {
      d.late++; const fee = Math.round(d.principal * L.lateFee); d.owed += fee; g.led.interest += fee;
      if (d.lender === 'shark') {
        if (d.late === 1) toast('Hùng Sẹo nhắn: "Trễ hạn rồi đó. Mai không trả là tao tới lấy đồ."', 'warn', 'skull', true);
        else if (d.late >= 2) {
          const pay = Math.min(g.cash, d.owed); g.cash -= pay; d.owed -= pay;
          const taken = d.owed > 0 ? seize(g, d) : [];
          toast('Đàn em Hùng Sẹo tới siết nợ' + (pay ? `, lấy ${money(pay)}` : '') + (taken.length ? ` và ${taken.join(', ')}` : '') + '!', 'bad', 'skull', true);
          g.st.mood = clamp(g.st.mood - 25, 0, STAT_MAX); g.st.health = clamp(g.st.health - (d.owed > 0 ? 15 : 0), 5, STAT_MAX); g.rep = clamp(g.rep - 3, 0, 100);
        }
      } else if (d.lender === 'bank') {
        if (d.late === 1) toast('Ngân hàng Sao Vàng: khoản vay đã quá hạn, bắt đầu tính phí phạt.', 'warn', 'cash', true);
        if (d.late >= 3) {
          const pay = Math.min(g.bank + g.cash, d.owed), fromBank = Math.min(g.bank, pay); g.bank -= fromBank; g.cash -= pay - fromBank; d.owed -= pay;
          const taken = d.owed > 0 && d.late >= 5 ? seize(g, d) : [];
          if (pay || taken.length) toast('Ngân hàng thu hồi nợ: ' + (pay ? money(pay) : '') + (taken.length ? ' + kê biên ' + taken.join(', ') : ''), 'bad', 'cash', true);
          g.credit = Math.max(g.credit, g.day + 6);
        }
      } else if (d.lender === 'tab' && d.late === 1) { changeRel(g, 'kiosk', -15); toast('Cô Ba: "Con thiếu sổ quá hạn rồi nghen, trả đi rồi mới mua tiếp được."', 'warn', 'cash', true); }
    } else if (g.day === d.due) toast(`Hôm nay là hạn trả ${money(d.owed)} cho ${L.name}.`, 'warn', 'cash', true);
    if (d.owed < 1) g.debts.splice(g.debts.indexOf(d), 1);
  }
}
/** Phá sản: không còn gì để siết mà nợ quá hạn vẫn còn sau nhiều ngày. */
export function checkBankrupt(g: Game): boolean {
  const od = overdue(g).filter((d) => d.lender !== 'tab' && d.late >= 3);
  if (!od.length) return false;
  const assets = g.cash + g.bank + Object.keys(g.gear).reduce((a, id) => a + gearResale(g, id), 0);
  return assets < od.reduce((a, d) => a + d.owed, 0) * 0.5 || Object.keys(g.gear).length === 0;
}
export function goBankrupt(g: Game) {
  g.debts = []; g.gear = {}; g.stall = emptyStall(); g.bank = 0; g.cash = clamp(g.cash, 5000, 15000); g.home = []; g.bag = []; g.meals = [];
  g.housing = 'gamcau'; g.credit = g.day + 10; g.rep = Math.round(g.rep * 0.4); g.tot.bankrupt++; g.quest = 0;   // mất cả gánh nên phần hướng dẫn quay về bước đầu; các bước sau tự nhảy khi đủ điều kiện
  g.st.mood = 12; for (const r of RECIPE_LIST) g.rec[r.id].on = false;
  bus.emit('save', 'pha san');
}

// ───────────────────────── Chỗ ở ─────────────────────────
export function rentDue(g: Game): number { const h = HOUSING[g.housing]; return h.per === 'tuần' && g.day >= g.paidUntil ? h.rent : 0; }
/** Uy tín cần có để thuê chỗ này (0 nếu không đòi hỏi gì). */
export function rentNeed(id: string): number { return HOUSING[id]?.needRep ?? 0; }
export function canRent(g: Game, id: string): boolean { return g.rep >= rentNeed(id); }
/** Khoảng biến thiên thời gian khách đợi (-15% tới +30%, trung bình +7,5%). */
export const PATIENCE_RANGE: readonly [number, number] = [0.85, 1.3];

export function buyHousing(g: Game, id: string): boolean {
  const h = HOUSING[id];
  if (!h?.buy || !canRent(g, id)) return false;
  if (!spend(g, h.buy, 'rent')) return false;
  g.flags['lived_' + id] = 1;
  g.flags['owned_' + id] = 1;
  g.housing = id;
  g.paidUntil = 999999;
  bus.emit('save', 'mua nha');
  return true;
}

export function payHousing(g: Game, id: string): boolean {
  const h = HOUSING[id];
  if (!h || !canRent(g, id)) return false;
  if (g.flags['owned_' + id]) { g.housing = id; g.paidUntil = 999999; bus.emit('save', 'cho o'); return true; }
  if (h.rent > 0 && !spend(g, h.rent, 'rent')) return false;
  if (g.housing !== id) { // chuyển nhà: đồ ở chỗ cũ theo người chơi nếu là gầm cầu thì để lại
    g.flags['lived_' + id] = 1;
  }
  g.housing = id; g.paidUntil = g.day + (h.per === 'tuần' ? 7 : h.per === 'đêm' ? 1 : 9999);
  bus.emit('save', 'cho o'); return true;
}
function dailyHousing(g: Game) {
  const h = HOUSING[g.housing];
  if (g.flags['owned_' + g.housing]) return;
  if (h.per === 'tuần' && g.day >= g.paidUntil) {
    const late = g.day - g.paidUntil;
    if (late === 0) toast(`Tới hạn đóng ${money(h.rent)} tiền nhà ${h.name} tuần này. Ghé chỗ thuê để đóng.`, 'warn', 'home', true);
    else if (late >= 2) {
      const lost = g.home.reduce((a, s) => a + s.n * s.cost, 0); g.home = []; g.led.loss += lost; g.housing = 'gamcau'; g.paidUntil = 9999;
      if (has(g, 'tulanh')) delete g.gear.tulanh;
      toast(`Chủ nhà đã lấy lại ${h.name} vì nợ tiền nhà. Đồ để trong phòng bị giữ hết.`, 'bad', 'home', true); g.st.mood = clamp(g.st.mood - 20, 0, STAT_MAX);
    } else toast(`Chủ nhà nhắc: mai không đóng tiền nhà là trả lại ${h.name}.`, 'warn', 'home', true);
  }
  if (h.per === 'đêm' && g.day >= g.paidUntil) { g.housing = 'gamcau'; g.paidUntil = 9999; }
}

// ───────────────────────── Dòng thời gian ─────────────────────────
function hourly(g: Game, R: RNG) {
  const w = wx(g), s = g.stall;
  spoil(g.bag, 1, w.spoil, false);
  spoil(s.store, 1, w.spoil, stallChilled(g), has(g, 'tu_dong') ? 0.35 : 1);
  spoil(g.home, 1, w.spoil * (g.housing === 'gamcau' ? 1.15 : 0.9), homeChilled(g));
  // đá tan dần
  for (const l of [s.store, g.bag, g.home]) for (const st of l) if (st.id === 'da' && st.fresh <= 0) st.n = 0;
  for (const l of [s.store, g.bag, g.home]) for (let i = l.length - 1; i >= 0; i--) if (l[i].n <= 1e-6) l.splice(i, 1);
  g.weather.flood = clamp(g.weather.flood + w.flood, 0, 1);
  // quầy hư hại vì thời tiết
  if (s.where === 'placed' || (s.where === 'home' && g.housing === 'gamcau')) {
    let dmg = w.damage * (has(g, 'odu') ? 0.25 : 1) * (s.where === 'home' ? 0.3 : 1);
    if (floodPct(g) > 0.5 && floodZone(s.x, s.z)) dmg += 2.5;
    if (dmg > 0) { s.cond = clamp(s.cond - dmg, 0, 100); if (s.cond < 25 && s.open) { s.open = false; toast('Quầy hư hại nặng vì mưa gió — phải dọn hàng! Sửa ở tiệm Đồ Nghề Ba Tài.', 'bad', 'storm', true); } }
  }
  if (s.open && w.id === 'bao') { s.open = false; toast('Bão quá lớn, không thể bán tiếp!', 'bad', 'storm'); }
  // đồ đã làm sẵn nguội dần (tủ kính giữ nóng lâu hơn)
  const coolLimit = has(g, 'tu_kinh') ? 150 : 90;
  for (const rd of s.ready) { const r = RECIPES[rd.rid]; if (absMin(g) - rd.at > coolLimit) rd.q = Math.max(0.15, rd.q - 0.06); void r; }
  if (g.weather.until <= absMin(g) && !activeEvents(g).some((e) => e.weather)) setWeather(g, g.weather.next, R);
}
// ───────────────────────── Người phụ việc ở quầy ─────────────────────────
/** Điều kiện nhận phụ việc: quán phải đã bán được tiền thật và đã bán qua vài ngày. */
export const HELPER_MIN_REVENUE = 250000;
export const HELPER_MIN_DAYS = 2;
export const HELPER_MIN_TIER = 2;
/** Tổng doanh thu bán hàng từ trước tới giờ (sổ của ngày hôm nay + các ngày đã khoá sổ). */
export function stallRevenue(g: Game): number { return g.led.revenue + g.hist.reduce((a, h) => a + h.revenue, 0); }
export const maxHelpers = (g: Game) => (isRestaurant(g) ? 2 : 1);
export const helperCount = (g: Game) => (g.help ? 1 : 0) + (g.help2 && isRestaurant(g) ? 1 : 0);
/** Ca đang trong giờ: sáng 5–14h, chiều 14–22h, cả ngày 5–22h. Trả về số phút còn lại của ca (0 = hết ca). */
export function shiftLeft(g: Game, slot: 1 | 2): number {
  const h = hourOf(g), sh = g.helpShift?.[slot] ?? 'full';
  const from = sh === 'chieu' ? 14 : 5, to = sh === 'sang' ? 14 : 22;
  if (h < from || h >= to) return 0;
  return Math.round((to - h) * 60);
}
/** Người ở ca này có đang trong giờ làm không. Người không có ca (bản lưu cũ) coi như cả ngày. */
export const onShift = (g: Game, slot: 1 | 2) => shiftLeft(g, slot) > 0;
export interface HelperGate { ok: boolean; revenue: number; days: number; tier: boolean; why: string; }
/** Vì sao chưa có người phụ việc — dùng cho gợi ý trong UI và cho test. */
export function helperGate(g: Game): HelperGate {
  const revenue = stallRevenue(g), first = g.flags.firstSale, days = typeof first === 'number' ? g.day - first : 0;
  const tier = g.stall.tier >= HELPER_MIN_TIER;
  const full = helperCount(g) >= maxHelpers(g);
  const ok = !full && tier && revenue >= HELPER_MIN_REVENUE && days >= HELPER_MIN_DAYS;
  const why = full ? (isRestaurant(g) ? 'Đã đủ 2 người phụ quầy' : 'Đã có người phụ quầy')
    : !tier ? 'Cần xe đẩy trở lên mới thuê được người'
    : revenue < HELPER_MIN_REVENUE ? `Doanh thu mới ${money(revenue)} — cần ${money(HELPER_MIN_REVENUE)} mới nuôi nổi người phụ`
    : days < HELPER_MIN_DAYS ? `Mới bán được ${days + 1} ngày — bán quen tay đã rồi hẵng thuê`
    : '';
  return { ok, revenue, days, tier, why };
}
/** Người ứng viên kế tiếp (chọn theo seed + ngày, tránh trùng người đang làm). */
export function helperCandidate(g: Game): HelperDef {
  const taken = new Set([g.help?.name, g.help2?.name].filter(Boolean));
  const start = (Math.abs(g.seed) + g.day * 3) % HELPER_POOL.length;
  for (let i = 0; i < HELPER_POOL.length; i++) {
    const c = HELPER_POOL[(start + i) % HELPER_POOL.length];
    if (!taken.has(c.name)) return c;
  }
  return HELPER_POOL[start];
}
/** Nhận người phụ việc: ghi vào sổ, ứng lương trước một ngày. Trả về false nếu thiếu tiền hoặc đã đủ chỗ. */
export function hireHelper(g: Game, d: HelperDef = helperCandidate(g)): boolean {
  if (helperCount(g) >= maxHelpers(g)) return false;
  if (!spend(g, d.wage, 'fees')) return false;
  const h: Helper = { name: d.name, fem: d.fem, face: d.face, hairStyle: d.hairStyle, shirt: d.shirt, pants: d.pants, hair: d.hair, skin: d.skin, wage: d.wage, since: g.day, paid: g.day, hired: true };
  if (!g.help) g.help = h;
  else g.help2 = h;
  return true;
}
/** Cho người phụ việc nghỉ (slot 1 hoặc slot 2). */
export function fireHelper(g: Game, slot: 1 | 2 = 1): Helper | null {
  if (slot === 2) { const h = g.help2; g.help2 = null; return h; }
  const h = g.help; g.help = g.help2 ?? null; g.help2 = null; return h;
}
/** Tỉ lệ khách chờ lâu hơn nhờ có người phụ dỗ khách và tiện nghi quán. */
export function helperPatience(g: Game): number {
  let m = 1;
  if (g.help) m += 0.3;
  if (g.help2 && isRestaurant(g)) m += 0.28;
  if (has(g, 'binh_tra')) m += 0.12;
  if (has(g, 'wifi_nhac')) m += 0.2;
  if (has(g, 'dieu_hoa') && isRestaurant(g)) m += 0.22;
  else if (has(g, 'may_quat') && wx(g).hot > 0.2) m += 0.22;
  return m;
}

// ───────────────────────── Nhân viên phụ bếp (Bậc 6) ─────────────────────────
export const maxSous = (g: Game) => (isRestaurant(g) ? 2 : 0);
export const sousCount = (g: Game) => (g.sous ? 1 : 0) + (g.sous2 && isRestaurant(g) ? 1 : 0);
export interface SousGate { ok: boolean; tier: boolean; why: string; }
export function sousGate(g: Game): SousGate {
  const tierOk = isRestaurant(g);
  const full = sousCount(g) >= maxSous(g);
  const ok = !full && tierOk;
  const why = !tierOk ? 'Cần Nhà hàng bình dân (bậc 6) mới có phòng bếp riêng cho phụ bếp' : full ? 'Đã đủ 2 phụ bếp trong phòng bếp' : '';
  return { ok, tier: tierOk, why };
}
export function sousCandidate(g: Game): SousDef {
  const taken = new Set([g.sous?.name, g.sous2?.name].filter(Boolean));
  const start = (Math.abs(g.seed) + g.day * 5) % SOUS_POOL.length;
  for (let i = 0; i < SOUS_POOL.length; i++) {
    const c = SOUS_POOL[(start + i) % SOUS_POOL.length];
    if (!taken.has(c.name)) return c;
  }
  return SOUS_POOL[start];
}
export function hireSous(g: Game, d: SousDef = sousCandidate(g)): boolean {
  if (!isRestaurant(g) || sousCount(g) >= maxSous(g)) return false;
  if (!spend(g, d.wage, 'fees')) return false;
  const h: Helper = { name: d.name, fem: d.fem, face: d.face, hairStyle: d.hairStyle, shirt: d.shirt, pants: d.pants, hair: d.hair, skin: d.skin, wage: d.wage, since: g.day, paid: g.day, hired: true };
  if (!g.sous) g.sous = h;
  else g.sous2 = h;
  return true;
}
export function fireSous(g: Game, slot: 1 | 2 = 1): Helper | null {
  if (slot === 2) { const h = g.sous2; g.sous2 = null; return h; }
  const h = g.sous; g.sous = g.sous2 ?? null; g.sous2 = null; return h;
}
function hasFuelFor(g: Game, units: number): boolean {
  if (units <= 0) return true;
  const kind = stove(g); if (!kind) return false;
  const item = kind === 'bepgas' ? 'gas' : 'than', per = item === 'gas' ? 14 : 22;
  const cur = g.stall.fuelKind === item ? g.stall.fuel : 0;
  return cur + countOf(stores(g), item) * per >= units;
}
export interface SousWorkResult { kind: 'prep' | 'ready'; rid: string; n: number; }
/** Phụ bếp tự sơ chế mẻ thiếu hoặc ra sẵn 1 phần món đang bật trong thực đơn. */
export function sousWork(g: Game, nowMin = absMin(g)): SousWorkResult | null {
  const s = g.stall;
  if (!g.sous || !isRestaurant(g) || s.where !== 'placed' || !s.open) return null;
  const menu = menuOf(g);
  if (!menu.length) return null;
  // Ưu tiên 1: sơ chế món có bước sơ chế khi lượng cốt < 2 phần
  for (const r of menu) {
    if (!hasPrep(r)) continue;
    const prepped = s.preps.filter((p) => p.rid === r.id).reduce((a, p) => a + p.n, 0);
    if (prepped >= 2) continue;
    const n = prepPossible(g, r);
    if (n <= 0) continue;
    const needFuel = r.prep.some((st) => st.t === 'boil' || st.t === 'fry' || st.t === 'grill') ? Math.max(0.5, fuelPerPortion(r) * 0.5) : 0;
    if (!hasFuelFor(g, needFuel) || (needFuel > 0 && !useFuel(g, needFuel))) continue;
    const c = consumePrep(g, r, n);
    const q = clamp(0.76 + level(g) * 0.015, 0.76, 0.92);
    s.preps.push({ rid: r.id, n, q: clamp(q * (0.4 + 0.6 * c.q), 0.3, 0.94), at: nowMin, cost: c.cost / n });
    return { kind: 'prep', rid: r.id, n };
  }
  // Ưu tiên 2: hoàn thiện sẵn 1 phần nếu khay còn chỗ và món đó hiện có < 2 phần sẵn
  const totalTrays = s.ready.reduce((a, x) => a + x.n, 0);
  if (totalTrays >= stallTrayCap(g)) return null;
  for (const r of menu) {
    if (readyCount(g, r.id) >= 2) continue;
    if (finishPossible(g, r) < 1) continue;
    const needFuel = toolsFor(r).includes('bep') ? fuelPerPortion(r) : 0;
    if (!hasFuelFor(g, needFuel) || (needFuel > 0 && !useFuel(g, needFuel))) continue;
    const c = consumeFinish(g, r, 1);
    const q = dishQuality(g, r, clamp(0.78 + level(g) * 0.015, 0.78, 0.93), c.q, c.prepQ);
    s.ready.push({ rid: r.id, n: 1, q, at: nowMin, cost: c.cost });
    g.rec[r.id].made += 1;
    g.rec[r.id].best = Math.max(g.rec[r.id].best, q);
    return { kind: 'ready', rid: r.id, n: 1 };
  }
  return null;
}


// ───────────────────────── Giao người làm đi chợ (phụ quầy / bếp trưởng / người trông coi) ─────────────────────────
/** Trần chi tiêu mỗi chuyến đi chợ (người làm tự mua, không mang hết gia tài đi). */
export const ERRAND_MAX = 2000000;
/** Mỗi chuyến đi bộ chợ–quầy mất bao nhiêu phút (khứ hồi), chia theo khoảng cách thật. */
export const errandLegs = (dist: number) => Math.round(clamp(Math.hypot(dist, 0) / 26, 6, 34) * 2);
/** Có người nào đi chợ được trong slot này chưa (và chưa có chuyến nào). */
export function canErrand(g: Game, slot: 0 | 1 | 2 | 3): boolean {
  if (g.errands.some((e) => e.slot === slot)) return false;
  if (slot === 0) return !!g.help;
  if (slot === 1) return !!g.sous;
  if (slot === 2) return !!g.sous2;
  const b = g.branch;
  return !!b && !!b.keeper && b.spot !== '';
}
/** Tên + chức danh của người sẽ đi chợ. */
export function errandWho(g: Game, slot: 0 | 1 | 2 | 3): { name: string; role: string } | null {
  if (slot === 0) return g.help ? { name: g.help.name, role: 'phụ quầy' } : null;
  if (slot === 1) return g.sous ? { name: g.sous.name, role: 'bếp trưởng' } : null;
  if (slot === 2) return g.sous2 ? { name: g.sous2.name, role: 'bếp phó' } : null;
  return g.branch?.keeper ? { name: g.branch.keeper.name, role: 'người trông coi chi nhánh' } : null;
}
/**
 * Cửa hàng tốt nhất cho một nguyên liệu: đang mở cửa, có bán món đó, giá sau giảm là thấp nhất.
 * Trả về `null` nếu giờ này không đâu bán.
 */
export function errandShopFor(g: Game, ingId: string): ShopDef | null {
  let best: ShopDef | null = null, bestP = Infinity;
  for (const shop of Object.values(SHOPS)) {
    if (!shop.items.includes(ingId) || !shopOpen(g, shop) || !shopHas(g, shop, ingId)) continue;
    const p = shopPrice(g, shop, ingId);
    if (p < bestP) { bestP = p; best = shop; }
  }
  return best;
}
export interface ErrandQuote { lines: { id: string; n: number; price: number; fresh: number; q: number; shop: string }[]; total: number; missing: string[]; }
/**
 * Báo giá một chuyến đi chợ: mua cho đủ `plan` (số phần mỗi món cần nấu), trừ những gì đã có sẵn.
 * `plan` = danh sách `[id nguyên liệu, số phần cần]`. Nguyên liệu nào không đâu bán trong giờ này thì vào `missing`.
 */
export function errandQuote(g: Game, plan: [string, number][]): ErrandQuote {
  const lines: ErrandQuote['lines'] = [], missing: string[] = [];
  let total = 0;
  for (const [id, portions] of plan) {
    const d = INGS[id]; if (!d || portions <= 0) continue;
    const shop = errandShopFor(g, id);
    if (!shop) { missing.push(d.name); continue; }
    const n = Math.max(1, Math.ceil(portions));
    const price = shopPrice(g, shop, id) * (d.kg > 0 ? d.kg : 1);
    if (total + price * n > ERRAND_MAX) continue;
    total += price * n;
    lines.push({ id, n, price, fresh: shopFresh(g, shop, id), q: shop.q, shop: shop.id });
  }
  return { lines, total: Math.round(total), missing };
}
/** Nguyên liệu còn thiếu cho một món, quy ra số phần cần mua (dùng cho nút "đi chợ món này"). */
export function errandPlanFor(g: Game, r: RecipeDef, portions = 1): [string, number][] {
  const out: [string, number][] = [];
  const have = (id: string) => countOf([g.stall.store, g.bag], id);
  for (const [id, q] of Object.entries(r.ings)) {
    const need = q * portions, cur = have(id);
    if (cur < need - 1e-6) out.push([id, need - cur]);
  }
  return out;
}
/** Gộp nguyên liệu còn thiếu cho nhiều món (mỗi món 1 phần) — dùng cho nút "đủ nguyên liệu N món đang bán". */
export function errandPlanForAll(g: Game, recipes: RecipeDef[], portions = 1): [string, number][] {
  const need = new Map<string, number>();
  for (const r of recipes) for (const [id, n] of errandPlanFor(g, r, portions)) need.set(id, Math.max(need.get(id) ?? 0, n));
  return [...need.entries()];
}
/**
 * Giao một chuyến đi chợ. `lines` là hàng sẽ mua, `total` là tiền trả trước (đã báo giá).
 * Trả về `null` nếu không giao được; ngược lại là chuyến vừa tạo.
 */
export function startErrand(g: Game, slot: 0 | 1 | 2 | 3, lines: ErrandQuote['lines'], total: number): Errand | null {
  const who = errandWho(g, slot);
  if (!who || !canErrand(g, slot) || !lines.length) return null;
  if (!spend(g, Math.min(total, ERRAND_MAX), 'cogs')) return null;
  const legs = errandLegs(Math.hypot(g.stall.x - (SPOTS.find((s) => s.id === 'cho')?.x ?? 0), g.stall.z - (SPOTS.find((s) => s.id === 'cho')?.z ?? 0)));
  const e: Errand = {
    slot, who: who.name, day: g.day, legs, t: 0,
    lines: lines.map((l) => ({ id: l.id, n: l.n, price: l.price, fresh: l.fresh, q: l.q })),
    shop: lines[0]?.shop ?? '', total: Math.round(total), back: false,
  };
  g.errands.push(e);
  bus.emit('save', 'giao di cho');
  return e;
}
/** Huỷ chuyến: người làm quay về tay không, mất 15% tiền đã đưa (đi đường rồi). */
export function cancelErrand(g: Game, slot: 0 | 1 | 2 | 3): boolean {
  const i = g.errands.findIndex((e) => e.slot === slot);
  if (i < 0) return false;
  const e = g.errands[i];
  g.errands.splice(i, 1);
  if (!e.back) earn(g, Math.round(e.total * 0.85), null);   // hoàn 85% (đi đường rồi), không ghi vào doanh thu
  return true;
}
/** Người trông coi chi nhánh đã mua xong: hàng về chi nhánh (món nấu sẵn) thay vì quầy chính. */
/**
 * Tiến một chuyến thêm `dm` phút. Trả về thông tin khi chuyến vừa xong, ngược lại `null`.
 * Hàng mua được chất vào kho quầy (hoặc để ở chi nhánh nếu là người trông coi).
 */
export function errandTick(g: Game, dm: number, _R?: RNG): Errand[] {
  const done: Errand[] = [];
  if (!g.errands.length || dm <= 0) return done;
  for (const e of g.errands.slice()) {
    e.t += dm;
    if (!e.back && e.t >= e.legs / 2) { e.back = true; }
    if (e.t < e.legs) continue;
    // Về tới nơi: chất hàng vào kho (đồ tươi thì ưu tiên tủ lạnh của quầy).
    // Người trông coi chi nhánh cũng chất hàng về kho quầy chính (nơi duy nhất có tủ lạnh);
    // chi nhánh chỉ nhận món đã nấu sẵn nên không thể để nguyên liệu sống ở đó.
    const part = e.slot === 3 ? `${e.who} (chi nhánh)` : e.who;
    for (const l of e.lines) addStack(g.stall.store, { id: l.id, n: l.n, fresh: l.fresh, q: l.q, cost: l.price });
    g.errands.splice(g.errands.indexOf(e), 1);
    done.push(e);
    bus.emit('save', 'di cho ve');
    toast(`${part} đi chợ về: ${e.lines.length} loại hàng đã chất lên kho quầy.`, 'good', 'box');
  }
  return done;
}
/** Toạ độ người làm đang đứng trong chuyến đi chợ (để vẽ NPC đi bộ), `null` nếu không có chuyến. */
export function errandSpot(g: Game, e: Errand): { x: number; z: number } {
  const a = SPOTS.find((s) => s.id === 'cho') ?? SPOTS[0];
  const b = { x: g.stall.x, z: g.stall.z };
  const half = Math.max(1, e.legs / 2), u = e.back ? clamp((e.t - half) / half, 0, 1) : clamp(e.t / half, 0, 1);
  const from = e.back ? a : b, to = e.back ? b : a;
  return { x: from.x + (to.x - from.x) * u, z: from.z + (to.z - from.z) * u };
}

/** Qua ngày mới: chuyến nào còn đi dở thì người làm về tay không, hoàn 85% tiền đã đưa. */
export function errandsNewDay(g: Game) {
  if (!g.errands.length) return;
  for (const e of g.errands) { if (!e.back) earn(g, Math.round(e.total * 0.85), null); }
  const n = g.errands.length;
  g.errands = [];
  if (n) toast(`${n} chuyến đi chợ dở dang đã huỷ (hoàn 85% tiền).`, 'warn', 'box');
}

// ───────────────────────── Báo cáo của người làm: sắp hết nguyên liệu & tự duyệt đặt bàn ─────────────────────────
export interface StaffReport {
  /** 0 = phụ quầy, 1–2 = bếp trưởng/bếp phó, 3 = người trông coi chi nhánh. */
  slot: 0 | 1 | 2 | 3;
  name: string;
  role: string;
  /** Món đang bán mà kho sắp hết nguyên liệu (nấu được ≤ 1 phần). */
  dishes: { rid: string; canMake: number }[];
  /** Nguyên liệu sắp hết, kèm số phần còn nấu được. */
  ings: { id: string; left: number; need: number }[];
  /** Tổng tiền nếu giao người này đi chợ mua cho các món đó (0 nếu kho còn đủ). */
  cost: number;
  /** Có nên báo động không (để UI tô đỏ). */
  urgent: boolean;
  text: string;
}
/**
 * Người làm tự nhìn kho và báo: món nào sắp hết nguyên liệu, thiếu gì, đi chợ hết bao nhiêu.
 * Chỉ báo món **đang bật bán** (menu đang mở) và chỉ tính nguyên liệu còn nấu được ≤ 1 phần.
 */
export function staffReport(g: Game, slot: 0 | 1 | 2 | 3): StaffReport | null {
  const who = errandWho(g, slot);
  if (!who) return null;
  const menu = menuOf(g);
  const dishes: StaffReport['dishes'] = [];
  const ing = new Map<string, { left: number; need: number }>();
  for (const r of menu) {
    const can = finishPossible(g, r);
    if (can > 1) continue;
    for (const [id, q] of Object.entries(r.ings)) {
      const left = countOf([g.stall.store, g.bag], id);
      if (left >= q * 2 - 1e-6) continue;
      const cur = ing.get(id);
      if (!cur || left < cur.left) ing.set(id, { left, need: q * 2 });
    }
    dishes.push({ rid: r.id, canMake: Math.max(0, can) });
  }
  const ings = [...ing.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => a.left - b.left).slice(0, 6);
  const quote = dishes.length ? errandQuote(g, errandPlanForAll(g, dishes.map((d) => RECIPES[d.rid]), 2)) : { total: 0 };
  const cost = Math.min(quote.total, ERRAND_MAX);
  const urgent = ings.length > 0 && (dishes.length >= 2 || ings.some((i) => i.left <= 0));
  const text = !menu.length
    ? `Chưa bật món nào trên thực đơn ${g.ac} ơi, con không biết phải chuẩn bị gì.`
    : !dishes.length
      ? `Kho còn đủ đồ cho cả ${menu.length} món đang bán. Cứ bán tiếp, cần gì con báo.`
      : `Sắp hết đồ cho ${dishes.length} món (${dishes.slice(0, 3).map((d) => RECIPES[d.rid].short).join(', ')}${dishes.length > 3 ? '…' : ''}). Thiếu ${ings.length} thứ, đặt chợ hết khoảng ${money(cost)}. Giao con đi mua một chuyến là đủ bán tiếp.`;
  return { slot, name: who.name, role: who.role, dishes, ings, cost, urgent, text };
}
/** Ai đang có mặt để báo cáo: phụ quầy, bếp trưởng/bếp phó, người trông coi chi nhánh. */
export function staffReports(g: Game): StaffReport[] {
  const out: StaffReport[] = [];
  for (const sl of [1, 2, 0, 3] as (0 | 1 | 2 | 3)[]) {
    if (g.errands.some((e) => e.slot === sl)) continue;      // đang đi chợ thì không báo
    const r = staffReport(g, sl);
    if (r) out.push(r);
  }
  return out;
}
export interface StockShortage {
  /** Nguyên liệu còn thiếu (hoặc sắp hết) để nấu tiếp món đang bán. */
  id: string; name: string; unit: string;
  /** Còn bao nhiêu trong quầy + túi. */
  left: number;
  /** Cần thêm bao nhiêu cho đủ một mẻ nữa của món cần nhiều nhất. */
  need: number;
  /** Món nào đang bị vì thiếu thứ này. */
  dishes: string[];
  /** Chợ gần nhất có bán (rỗng nếu không chợ nào bán). */
  shop: string;
  /** Giá chợ rẻ nhất cho số lượng cần (đã tính giá chợ). */
  cost: number;
}
/**
 * Soát kho cho người chơi: món nào đang bán mà **không nấu tiếp được**, thiếu đúng nguyên liệu gì, còn bao nhiêu,
 * cần thêm bao nhiêu, chợ nào bán và hết bao nhiêu tiền. Dùng cho chip trên HUD, bảng Quầy và báo cáo của người làm —
 * để "sắp hết đồ" không còn là câu chung chung mà nói thẳng thiếu gì.
 */
export function stockShortages(g: Game): StockShortage[] {
  const menu = menuOf(g);
  if (!menu.length) return [];
  const map = new Map<string, StockShortage>();
  for (const r of menu) {
    if (finishPossible(g, r) > 1) continue;
    // đang có phần sơ chế sẵn cho món này thì không tính nguyên liệu sơ chế nữa
    const prepared = hasPrep(r) && g.stall.preps.some((x) => x.rid === r.id && x.n > 0);
    for (const [id, q] of Object.entries(r.ings)) {
      if (prepared && !r.fin.includes(id)) continue;   // đã sơ chế sẵn thì chỉ còn thiếu đồ bước hoàn thiện
      const left = countOf(stores(g), id);
      if (left >= q * 2 - 1e-6) continue;
      // Cần mua bao nhiêu: đơn vị rời (chai, lon, quả, bó…) thì làm tròn LÊN 1 đơn vị vì phải mua cả cái;
      // đơn vị cân (kg, lạng) thì một chữ số thập phân là đủ.
      const raw = Math.max(0, q * 2 - left);
      const loose = INGS[id].unit === 'kg' ? 1 : INGS[id].unit === 'lạng' ? 10 : 1;
      const need = loose === 1 ? Math.ceil(raw - 1e-6) : Math.ceil(raw * loose - 1e-6) / loose;
      const cur = map.get(id);
      if (cur) { cur.need = Math.max(cur.need, need); cur.dishes.push(r.short); continue; }
      map.set(id, { id, name: INGS[id].name, unit: INGS[id].unit, left, need, dishes: [r.short], shop: '', cost: 0 });
    }
  }
  const out = [...map.values()];
  for (const s of out) {
    const def = INGS[s.id];
    const shops = SHOP_LIST.filter((sh) => sh.items.includes(s.id));
    // chợ gần nhất theo giá: ưu tiên chợ rẻ, cùng giá thì chợ mở cả ngày
    const best = shops.slice().sort((a, b) => a.priceMul - b.priceMul || b.open[1] - a.open[1])[0];
    s.shop = best ? best.name : '';
    s.cost = Math.round(def.price * (best?.priceMul ?? 1) * Math.max(s.need, 1));
  }
  // thiếu thứ ảnh hưởng nhiều món lên trước, cùng số món thì thứ đã cạn lên trước
  return out.sort((a, b) => (b.dishes.length - a.dishes.length) || (a.left - b.left) || a.name.localeCompare(b.name));
}
/**
 * Bao nhiêu món đang bán mà **kho đủ nguyên liệu nhưng chưa sơ chế** (nên chưa làm ra phần nào).
 * Ca này hay bị hiểu nhầm là "thiếu đồ" — HUD nói rõ "cần sơ chế trước" thay vì đổ lỗi cho nguyên liệu.
 */
export function needsPrepCount(g: Game): number {
  if (!menuOf(g).length) return 0;
  return menuOf(g).filter((r) => hasPrep(r) && finishPossible(g, r) <= 1 && prepPossible(g, r) >= 1).length;
}
/** Câu ngắn để hiện trên HUD: "Thiếu thịt heo nạc, trứng". Rỗng nếu kho còn đủ. */
export function shortageLine(g: Game, max = 2): string {
  const l = stockShortages(g);
  if (!l.length) return '';
  const names = l.slice(0, max).map((x) => x.name.toLowerCase()).join(', ');
  return l.length > max ? `${names}…` : names;
}
/** Bao nhiêu món đang bán có nguy cơ hết nguyên liệu (dùng cho chấm đỏ trên HUD). */
export function lowStockCount(g: Game): number {
  if (!menuOf(g).length) return 0;
  return menuOf(g).filter((r) => finishPossible(g, r) <= 1).length;
}
/** Bật/tắt quyền tự duyệt đặt bàn cho bếp trưởng (chỉ khi đã có ít nhất một bếp). */
export function canAutoBook(g: Game): boolean { return !!g.sous || !!g.sous2; }
export function autoBookOn(g: Game): boolean { return canAutoBook(g) && g.flags.autoBook === 1; }
export function setAutoBook(g: Game, on: boolean): boolean {
  if (!canAutoBook(g)) return false;
  g.flags.autoBook = on ? 1 : 0;
  bus.emit('save', 'tu dong duyet dat ban');
  return true;
}

// ───────────────────────── Bảng điều khiển cửa hàng trên điện thoại ─────────────────────────
/** Một dòng trong app "Quản lý cửa hàng": quầy chính và (nếu có) chi nhánh. Luật thuần, UI chỉ vẽ. */
export interface ShopRow {
  id: 'main' | 'branch';
  name: string;
  /** Đang bán / tạm đóng. */
  open: boolean;
  /** Có người đứng bán (quầy chính: người chơi; chi nhánh: người trông coi). */
  staffed: boolean;
  /** Số phần đang bày, số món khác nhau, món sắp hết (≤ 1 phần). */
  stock: number; kinds: number; low: number;
  /** Tiền thuê chỗ mỗi ngày (quầy chính: phí chỗ sạp, 0 nếu chưa tới bậc 3; chi nhánh: rent). */
  rent: number;
  /** Sổ hôm nay. */
  revenue: number; sold: number; customers: number; lost: number;
  /** Nguyên liệu trong kho quầy sắp hỏng (tươi < 35%): số loại và tên vài món. Rỗng = không có gì sắp hỏng. */
  spoilKinds: number; spoilNames: string[];
  /** Nguyên liệu thô trong kho (không phải món đã nấu): số loại + số kg. App phải thấy giống bảng Quầy trên PC. */
  storeKinds: number; storeKg: number;
  /** Đồ cần lạnh đang để ở quầy mà không có tủ đá/thùng đá: số loại + tên vài món, và số giờ còn bán được. */
  coldKinds: number; coldNames: string[]; coldHours: number;
  /** Câu gợi ý ngắn cho người chơi biết nên làm gì tiếp. */
  hint: string;
  canToggle: boolean;
  canStock: boolean;
}
/** Quầy chính: đọc từ g.stall; chi nhánh: đọc từ g.branch. Dùng cho app điện thoại. */
export function shopRows(g: Game): ShopRow[] {
  const s = g.stall, out: ShopRow[] = [];
  const ready = s.ready.filter((r) => r.n > 1e-6);
  // Đồ trong kho quầy vẫn hỏng tiếp — app phải nhắc, để người chơi không tưởng "bỏ vào quầy là mất".
  const spoiling = s.store.filter((st) => INGS[st.id] && INGS[st.id].shelf < 9000 && st.fresh < 35);
  const spoilNames = [...new Set(spoiling.map((st) => INGS[st.id].name))];
  const cold = coldUnprotected(g);
  const coldHours = cold.kinds ? Math.min(...s.store.filter((st) => INGS[st.id]?.cold).map((st) => hoursLeft(g, st))) : 0;
  const stock = ready.reduce((a, r) => a + r.n, 0);
  const placed = s.where === 'placed';
  out.push({
    id: 'main', name: placed ? `Quầy chính · ${spotById(s.spot ?? '')?.name ?? 'ngoài phố'}` : 'Quầy chính · đang mang theo',
    open: !!s.open, staffed: placed, stock, kinds: ready.length, low: ready.filter((r) => r.n <= 1).length,
    rent: s.tier >= 3 ? stallRent(g) : 0,
    spoilKinds: spoilNames.length, spoilNames: spoilNames.slice(0, 3),
    storeKinds: s.store.length, storeKg: Math.round(weightOf(s.store) * 10) / 10,
    coldKinds: cold.kinds, coldNames: cold.names, coldHours: Math.round(coldHours),
    revenue: g.led.revenue, sold: g.led.sold, customers: g.led.customers, lost: g.led.lost,
    hint: !placed ? 'Quầy chưa đặt ra phố — ra mặt bằng rồi dựng quầy mới bán được.'
      : !menuOf(g).length ? 'Chưa bật món nào trong thực đơn.'
      : stock <= 0 ? 'Không còn phần nào trên khay — nấu thêm hoặc chuyển món từ kho.'
      : !s.open ? 'Đang tạm đóng — mở bán đi.' : low0Text(ready.length),
    canToggle: placed, canStock: stock > 0,
  });
  const b = g.branch;
  if (b) {
    const br = b.ready.filter((r) => r.n > 1e-6);
    out.push({
      id: 'branch', name: `Chi nhánh · ${spotById(b.spot)?.name ?? '?'}`,
      open: !!b.open, staffed: !!b.keeper, stock: br.reduce((a, r) => a + r.n, 0), kinds: br.length,
      low: br.filter((r) => r.n <= 1).length, rent: b.rent, spoilKinds: 0, spoilNames: [], storeKinds: 0, storeKg: 0,
      coldKinds: 0, coldNames: [], coldHours: 0,
      revenue: b.led.revenue, sold: b.led.sold, customers: b.led.customers, lost: b.led.lost,
      hint: !b.keeper ? 'Chưa có người trông coi — thuê người thì chi nhánh mới bán.'
        : !b.open ? 'Chi nhánh đang đóng (thiếu tiền thuê hoặc bạn tắt) — mở lại đi.'
        : br.length === 0 ? 'Khay trống — chuyển món đã làm sẵn sang đây.'
        : `Đang bán · còn ${br.reduce((a, r) => a + r.n, 0)} phần`,
      canToggle: !!b.keeper, canStock: br.length > 0,
    });
  }
  return out;
}
const low0Text = (kinds: number) => (kinds ? 'Đang bán — có món sắp hết, nấu thêm.' : 'Đang bán.');
/** Vì sao chưa bật/tắt bán được điểm này — câu người chơi đọc được (rỗng = làm được). */
export function shopToggleWhy(g: Game, id: 'main' | 'branch'): string {
  if (id === 'main') {
    const s = g.stall;
    if (s.where !== 'placed') return 'Quầy chưa đặt ra phố — ra mặt bằng dựng quầy trước.';
    if (!menuOf(g).length) return 'Chưa bật món nào trong thực đơn.';
    if (s.cond < 25) return 'Quầy hư nặng quá, phải sửa ở tiệm Ba Tài.';
    return '';
  }
  const b = g.branch;
  if (!b) return 'Chưa mở chi nhánh nào.';
  if (!b.keeper) return 'Chưa có người trông coi — thuê người rồi mới mở bán được.';
  return '';
}
/** Cảnh báo hiện ngay trong app: quầy đang mở nhưng không có ai đứng bán thì sẽ tự ngưng khi đi xa (sau 20 giây ân hạn). */
export function shopStaffWarn(g: Game): string {
  if (!g.stall.open || g.stall.where !== 'placed') return '';
  if (g.help || g.help2) return '';
  return 'Quầy đang mở nhưng chỉ mình bạn bán — đi xa quá 40 m mà không có khách thì khoảng 20 giây sau quầy tự ngưng. Thuê người phụ quầy để bán từ xa.';
}
/** Giới hạn giờ bán, đúng như luật ngoài đời trong trò chơi. */
export const SHOP_HOURS: [number, number] = [6, 22.5];
/**
 * Bật/tắt bán một điểm (chỉ đổi cờ, không đụng tới khách đang ăn — phần đó do StallSys lo).
 * Trả về `'ok'` hoặc lý do không làm được, để UI báo thẳng cho người chơi.
 */
export function setShopOpen(g: Game, id: 'main' | 'branch', on: boolean): 'ok' | string {
  const why = shopToggleWhy(g, id);
  if (why) return why;
  const h = hourOf(g);
  if (on && (h < SHOP_HOURS[0] || h >= SHOP_HOURS[1])) return `Ngoài giờ bán (${SHOP_HOURS[0]}h–${SHOP_HOURS[1]}h).`;
  if (id === 'main') { g.stall.open = on; bus.emit('ui', 'stall'); }
  else { g.branch!.open = on; bus.emit('ui', 'branch'); }
  bus.emit('save', 'mo/dong ban');
  return 'ok';
}
/** Cảnh báo loại "bán lỗ": món nào đang bán giá thấp hơn giá vốn nguyên liệu + công. */
export function lossDishes(g: Game): { rid: string; price: number; cost: number }[] {
  const out: { rid: string; price: number; cost: number }[] = [];
  for (const r of menuOf(g)) {
    const price = g.rec[r.id]?.price ?? 0;
    const cost = recipeCost(g, r).total;
    if (price > 0 && cost > 0 && price < cost) out.push({ rid: r.id, price, cost });
  }
  return out.sort((a, b) => a.price - a.cost - (b.price - b.cost));
}

// ───────────────────────── Chuỗi cửa hàng (bậc 7) — chi nhánh & người trông coi ─────────────────────────
/** Đã lên Chuỗi cửa hàng (bậc 7) chưa: chỉ bậc này mới mở được chi nhánh thứ hai. */
export const isChain = (g: Game) => g.stall.tier >= 7;
/** Đã mở chi nhánh nào chưa. */
export const hasBranch = (g: Game) => !!g.branch;
/** Chỗ bán còn trống cho chi nhánh: bỏ chỗ của quán chính, hai mặt bằng có sân, hẻm (thuê được nhưng vắng). */
export const branchSite = (id: string | null | undefined): BranchSite | undefined => BRANCH_SITES.find((s) => s.spot === id);
/** Chi nhánh đang thật sự bán được: có người trông coi, đang mở, và còn món sẵn trên khay. */
export const branchSelling = (g: Game): boolean => !!g.branch && g.branch.open && !!g.branch.keeper && g.branch.ready.some((r) => r.n > 0);
/** Tổng số phần sẵn có ở chi nhánh. */
export const branchStock = (g: Game) => (g.branch ? g.branch.ready.reduce((a, r) => a + r.n, 0) : 0);
/** Số món khác nhau đang bày ở chi nhánh (tối đa 6 — quầy nhỏ). */
export const BRANCH_TRAY_CAP = 6;
/** Số phần tối đa chi nhánh giữ được. */
export const BRANCH_READY_CAP = 24;
/** Ứng viên người trông coi: xoay theo hạt giống và ngày để mỗi ngày một người khác nhau. */
export function keeperCandidate(g: Game): HelperDef {
  const start = (Math.abs(g.seed) + g.day * 7) % KEEPER_POOL.length;
  for (let i = 0; i < KEEPER_POOL.length; i++) {
    const c = KEEPER_POOL[(start + i) % KEEPER_POOL.length];
    if (c.name !== g.branch?.keeper?.name) return c;
  }
  return KEEPER_POOL[start];
}
export interface BranchGate { ok: boolean; tier: boolean; site: boolean; why: string; }
/** Vì sao chưa mở được chi nhánh — dùng cho UI và test (luôn kèm lý do người chơi đọc được). */
export function branchGate(g: Game, spot: string, takenByStall = false): BranchGate {
  const tier = isChain(g);
  const site = !!branchSite(spot);
  const ok = tier && site && !takenByStall && !g.branch;
  const why = !tier ? `Cần mở Chuỗi cửa hàng (bậc 7) mới thuê được chi nhánh`
    : g.branch ? 'Đã có một chi nhánh — bán tốt rồi hẵng tính điểm thứ ba'
    : takenByStall ? 'Chỗ này đang là quán chính của bạn'
    : !site ? 'Chỗ này không cho thuê chi nhánh'
    : '';
  return { ok, tier, site, why };
}
/** Thuê chỗ và mở chi nhánh (chưa có người trông coi thì chưa bán). Trả về chi nhánh vừa mở, hoặc null. */
export function openBranch(g: Game, spot: string, takenByStall = false): Branch | null {
  if (!branchGate(g, spot, takenByStall).ok) return null;
  const site = branchSite(spot)!;
  // đặt cọc một ngày thuê — nói trước, trừ trước, đúng kiểu chợ.
  if (!spend(g, site.rent, 'fees')) return null;
  g.branch = {
    spot, since: g.day, rent: site.rent, keeper: null, ready: [], open: true,
    led: { revenue: 0, tips: 0, sold: 0, customers: 0, lost: 0, fees: 0, wage: 0, loss: 0 },
    tot: { revenue: 0, tips: 0, sold: 0, days: 0 }, hist: [],
  };
  bus.emit('save', 'mo chi nhanh');
  return g.branch;
}
/** Đóng chi nhánh (trả lại mặt bằng): mất món sẵn còn trên khay, không hoàn tiền thuê. */
export function closeBranch(g: Game): boolean {
  if (!g.branch) return false;
  g.branch = null;
  bus.emit('save', 'dong chi nhanh');
  return true;
}
/** Thuê người trông coi: trả trước một ngày lương như thuê phụ quầy. */
export function hireKeeper(g: Game, d: HelperDef = keeperCandidate(g)): boolean {
  const b = g.branch;
  if (!b || b.keeper) return false;
  if (!spend(g, d.wage, 'fees')) return false;
  b.keeper = { name: d.name, fem: d.fem, face: d.face, hairStyle: d.hairStyle, shirt: d.shirt, pants: d.pants, hair: d.hair, skin: d.skin, wage: d.wage, since: g.day, paid: g.day, hired: true };
  bus.emit('save', 'thue trong coi');
  return true;
}
/** Cho người trông coi nghỉ việc: chi nhánh đóng cửa nhưng vẫn giữ mặt bằng. */
export function fireKeeper(g: Game): Helper | null {
  const k = g.branch?.keeper ?? null;
  if (g.branch) g.branch.keeper = null;
  return k;
}
/** Chuyển món đã làm sẵn từ quầy chính sang chi nhánh. Trả về số phần chuyển được. */
export function moveToBranch(g: Game, rid: string, n: number): number {
  const b = g.branch;
  if (!b || n <= 0) return 0;
  const src = g.stall.ready.filter((r) => r.rid === rid && r.n > 0).sort((a, x) => a.at - x.at);
  if (!src.length) return 0;
  const roomN = Math.max(0, BRANCH_READY_CAP - branchStock(g));
  const kinds = new Set(b.ready.map((r) => r.rid));
  const kindRoom = kinds.has(rid) || kinds.size < BRANCH_TRAY_CAP ? roomN : 0;
  let left = Math.min(n, kindRoom);
  let moved = 0;
  while (left > 0 && src.length) {
    const s = src[0];
    const take = Math.min(left, s.n);
    const dst = b.ready.find((r) => r.rid === rid);
    if (dst) { const total = dst.n + take; dst.q = (dst.q * dst.n + s.q * take) / total; dst.n = total; dst.cost = (dst.cost * (total - take) + s.cost * take) / total; }
    else b.ready.push({ rid, n: take, q: s.q, at: absMin(g), cost: s.cost });
    s.n -= take; left -= take; moved += take;
    if (s.n <= 0) src.shift();
  }
  g.stall.ready = g.stall.ready.filter((r) => r.n > 0);
  return moved;
}
/** Lấy món từ chi nhánh về quầy chính (bán không hết thì mang về). */
export function moveFromBranch(g: Game, rid: string, n: number): number {
  const b = g.branch;
  if (!b || n <= 0) return 0;
  const src = b.ready.filter((r) => r.rid === rid && r.n > 0);
  if (!src.length) return 0;
  const trayCap = stallTrayCap(g);
  const roomN = Math.max(0, trayCap - g.stall.ready.reduce((a, r) => a + r.n, 0));
  let left = Math.min(n, roomN), moved = 0;
  while (left > 0 && src.length) {
    const s = src[0]; const take = Math.min(left, s.n);
    const dst = g.stall.ready.find((r) => r.rid === rid);
    if (dst) { const total = dst.n + take; dst.q = (dst.q * dst.n + s.q * take) / total; dst.n = total; dst.cost = (dst.cost * (total - take) + s.cost * take) / total; }
    else g.stall.ready.push({ rid, n: take, q: s.q, at: absMin(g), cost: s.cost });
    s.n -= take; left -= take; moved += take;
    if (s.n <= 0) src.shift();
  }
  b.ready = b.ready.filter((r) => r.n > 0);
  return moved;
}
export interface BranchTick { sold: number; revenue: number; tips: number; lost: number; waste: number; }
/**
 * Một phút bán hàng ở chi nhánh: người trông coi bán món sẵn cho khách của khu đó.
 * Đơn giá lấy theo giá người chơi đặt ở quầy chính (không tự đổi giá), tiền boa nhỏ hơn quầy chính
 * vì người trông coi chỉ bán, không nêm nếm theo ý khách. Luật thuần, RNG truyền vào để test.
 */
export function branchTick(g: Game, dm: number, R: RNG = rnd): BranchTick {
  const b = g.branch, out: BranchTick = { sold: 0, revenue: 0, tips: 0, lost: 0, waste: 0 };
  if (!b || !b.open || !b.keeper) return out;
  const sp = spotById(b.spot);
  const steps = Math.max(1, Math.min(720, Math.round(dm)));
  for (let step = 0; step < steps; step++) {
  const inDay = hourOf(g) >= 6 && hourOf(g) < 22.5;
  if (inDay) {
    const d = sp?.district ?? 'cho';
    const h = hourOf(g), w = wx(g);
    // khách tới: đường cong giờ của khu × độ hút của chỗ × thời tiết × tay nghề người trông coi
    const rate = hourCurve(h, d) * (sp?.traffic ?? 1) * (w.rain > 0.3 ? 0.55 : 1) * (h > 19 ? 0.7 : 1);
    const perMin = rate * 0.11 * (b.keeper.wage >= 95000 ? 1.06 : 1);
    const n = R.chance(Math.min(0.9, perMin)) ? 1 : 0;
    if (n > 0) {
      const kinds = b.ready.filter((r) => r.n > 0 && RECIPES[r.rid]);
      if (!kinds.length) out.lost += 1;
      else {
        // ưu tiên món hợp buổi và món đắt lời, nhưng vẫn ngẫu nhiên để không bán cứng một món
        const slot = mealSlot(h);
        const weights = kinds.map((r) => (0.4 + RECIPES[r.rid].meal[slot]) * (1 + R.range(0, 0.5)));
        const sum = weights.reduce((a, x) => a + x, 0);
        let roll = R.range(0, sum), pick = kinds[kinds.length - 1];
        for (let i = 0; i < kinds.length; i++) { roll -= weights[i]; if (roll <= 0) { pick = kinds[i]; break; } }
        const price = Math.max(1000, g.rec[pick.rid].price);
        const nPort = Math.min(pick.n, 1 + (R.chance(0.18) ? 1 : 0));
        const revenue = price * nPort;
        const tip = R.chance(0.16) ? round500(price * R.range(0.03, 0.1)) : 0;
        pick.n -= nPort;
        earn(g, revenue, null); g.led.revenue += revenue; g.led.sold += nPort; g.led.customers += 1; g.led.tips += tip;
        b.led.revenue += revenue; b.led.tips += tip; b.led.sold += nPort; b.led.customers += 1;
        b.tot.revenue += revenue; b.tot.tips += tip; b.tot.sold += nPort;
        if (tip) earn(g, tip, null);
        out.sold += nPort; out.revenue += revenue; out.tips += tip;
      }
    }
  }
  }
  // món để lâu vẫn nguội dần giống quầy chính
  for (const rd of b.ready) if (absMin(g) - rd.at > 120) rd.q = Math.max(0.15, rd.q - 0.04);
  b.ready = b.ready.filter((r) => r.n > 1e-6);
  return out;
}
/** Khoá sổ ngày của chi nhánh (đầu ngày): ghi lịch sử, trả lương người trông coi, thu tiền thuê chỗ. */
export function branchNewDay(g: Game): void {
  const b = g.branch;
  if (!b) return;
  // món ế qua đêm thì bỏ
  let waste = 0;
  for (const r of b.ready) waste += r.n * r.cost;
  b.ready = [];
  b.led.loss += waste;
  b.hist.push({ day: g.day, revenue: b.led.revenue, tips: b.led.tips, sold: b.led.sold, lost: b.led.lost });
  if (b.hist.length > 8) b.hist.shift();
  b.tot.days += 1;
  if (b.led.revenue > 0) toast(`Chi nhánh ${spotById(b.spot)?.name ?? ''}: hôm qua bán được ${money(b.led.revenue + b.led.tips)}.`, 'good', 'shop');
  if (waste > 500) toast(`Chi nhánh bỏ món ế: mất ${money(waste)}.`, 'warn', 'box');
  // tiền thuê chỗ: luôn phải đóng, thiếu thì đóng cửa chi nhánh
  if (spend(g, b.rent, 'fees')) { b.led.fees += b.rent; if (!b.open) toast(`Đã đóng tiền thuê chi nhánh ${money(b.rent)} — mở lại được rồi.`, 'info', 'cash'); b.open = true; }
  else { b.open = false; toast(`Không đủ ${money(b.rent)} thuê chi nhánh — chi nhánh đóng cửa hôm nay.`, 'bad', 'cash', true); }
  // lương người trông coi
  if (b.keeper) {
    if (spend(g, b.keeper.wage, 'fees')) { b.keeper.paid = g.day; b.led.wage += b.keeper.wage; }
    else { const n = b.keeper.name; b.keeper = null; b.open = false; toast(`${n} nghỉ vì chưa có lương — chi nhánh đóng cửa.`, 'bad', 'heart', true); }
  }
  b.led = { revenue: 0, tips: 0, sold: 0, customers: 0, lost: 0, fees: 0, wage: 0, loss: 0 };
}

// ───────────────────────── Đặt bàn trước (Bậc 6) ─────────────────────────
export const BOOKING_MAX = 4;
const BOOKABLE_ARCHES = ['vanphong', 'phuhuynh', 'nhagiau', 'dukhach', 'congnhan'] as const;
/** Tạo một yêu cầu đặt bàn trước mới cho Nhà hàng bình dân. Trả về null nếu chưa đủ điều kiện hoặc đã đầy lịch. */
export function createBooking(g: Game, R: RNG = rnd): Booking | null {
  if (!isRestaurant(g)) return null;
  const active = g.bookings.filter((b) => b.status === 'pending' || b.status === 'accepted');
  if (active.length >= BOOKING_MAX) return null;
  const archId = R.pick([...BOOKABLE_ARCHES]);
  const fem = R.chance(ARCH[archId].fem);
  const name = (fem ? R.pick(['Chị', 'Cô']) : R.pick(['Anh', 'Chú'])) + ' ' + R.pick(fem ? NAMES.nu : NAMES.nam);
  const hNow = hourOf(g);
  let day = g.day;
  let hour: number;
  if (hNow < 19.2) {
    const minH = Math.max(8, Math.ceil(hNow + 1.25));
    const maxH = 21;
    if (minH > maxH) { day = g.day + 1; hour = R.pick([11.5, 12, 18.5, 19]); }
    else hour = clamp(Math.round(R.range(minH, maxH) * 2) / 2, minH, maxH);
  } else {
    day = g.day + 1;
    hour = R.pick([11.5, 12, 18, 19, 19.5]);
  }
  const size = R.pick([2, 3, 4]);
  const menu = menuOf(g);
  const dish = menu.length ? R.pick(menu).id : undefined;
  const deposit = round1k(size * 12000);
  const b: Booking = { id: g.bookSeq++, name, fem, arch: archId, size, day, hour, deposit, dish, status: 'pending' };
  g.bookings.push(b);
  // Bếp trưởng được giao quyền tự duyệt: nhận luôn thay người chơi (vẫn trừ uy tín nếu sau đó lỡ hẹn).
  if (autoBookOn(g)) b.status = 'accepted';
  return b;
}
/** Nhận đặt bàn trước: giữ chỗ cho khách vào khung giờ hẹn. */
export function acceptBooking(g: Game, id: number): Booking | null {
  const b = g.bookings.find((x) => x.id === id && x.status === 'pending');
  if (!b) return null;
  b.status = 'accepted';
  return b;
}
/** Từ chối hoặc huỷ đặt bàn. Huỷ bàn đã nhận làm giảm nhẹ uy tín. */
export function rejectBooking(g: Game, id: number): boolean {
  const idx = g.bookings.findIndex((x) => x.id === id);
  if (idx < 0) return false;
  const b = g.bookings[idx];
  if (b.status === 'accepted') g.rep = clamp(g.rep - 0.5, 0, 100);
  g.bookings.splice(idx, 1);
  return true;
}
/** Tìm bàn đặt trước đã tới giờ đón khách (trong khung -15 phút tới +60 phút quanh giờ hẹn). */
export function dueBooking(g: Game): Booking | null {
  const h = hourOf(g);
  return g.bookings.find((b) => b.status === 'accepted' && b.day === g.day && h >= b.hour - 0.25 && h <= b.hour + 1.0) ?? null;
}
/** Số ghế đang giữ cho các bàn đặt trước sắp tới trong ±30 phút. */
export function reservedSeats(g: Game): number {
  const h = hourOf(g);
  return g.bookings
    .filter((b) => b.status === 'accepted' && b.day === g.day && Math.abs(h - b.hour) <= 0.5)
    .reduce((a, b) => a + b.size, 0);
}
/** Xoá/chuyển trạng thái những bàn quá giờ hẹn. Trả về các bàn đã nhận nhưng bị lỡ hẹn. */
export function expireBookings(g: Game): Booking[] {
  const h = hourOf(g), missed: Booking[] = [];
  for (const b of g.bookings) {
    if (b.status !== 'pending' && b.status !== 'accepted') continue;
    const overdue = g.day > b.day || (g.day === b.day && h > b.hour + 1.15);
    if (!overdue) continue;
    if (b.status === 'accepted') {
      b.status = 'missed';
      g.rep = clamp(g.rep - 0.5, 0, 100);
      missed.push(b);
    } else {
      b.status = 'missed';
    }
  }
  // Giữ lịch gọn: chỉ giữ bàn đang hoạt động hoặc mới kết thúc trong ngày
  g.bookings = g.bookings.filter((b) => b.status === 'pending' || b.status === 'accepted' || b.status === 'seated' || b.day >= g.day);
  return missed;
}

function newDay(g: Game, R: RNG) {
  // khoá sổ ngày cũ
  const s = g.stall;
  let waste = 0;
  for (const rd of s.ready) waste += rd.n * rd.cost; s.ready = [];
  for (const p of s.preps.slice()) { const r = RECIPES[p.rid]; if (absMin(g) - p.at > Math.max(r.hold, 300)) { waste += p.n * p.cost; s.preps.splice(s.preps.indexOf(p), 1); } }
  // Dọn đồ hỏng qua đêm: phải NÓI rõ món nào hỏng, nếu không người chơi tưởng đồ bỏ vào quầy bị mất trộm.
  const spoiled: string[] = [];
  for (const l of [g.bag, s.store, g.home]) { const p = purge(l); waste += p.lost; spoiled.push(...p.names); }
  g.led.loss += waste;
  if (spoiled.length) {
    const uniq = [...new Set(spoiled)];
    toast(`Đồ hỏng phải bỏ: ${uniq.slice(0, 3).join(', ')}${uniq.length > 3 ? ` và ${uniq.length - 3} món nữa` : ''}. Đồ nguội để vài hôm vẫn được, thịt cá chưa nấu thì không.`, 'warn', 'box');
  }
  branchNewDay(g);
  errandsNewDay(g);
  g.hist.push(g.led); if (g.hist.length > 30) g.hist.shift();
  g.tot.best = Math.max(g.tot.best, g.led.revenue);
  g.day++; g.min -= 1440; g.led = newLedger(g.day);
  if (waste > 500) toast(`Tổng thiệt hại đồ bỏ đi: ${money(waste)}.`, 'bad', 'box');
  g.wd.picked = []; g.wd.sacks = 0; g.wd.plates = 0; g.wd.deliveries = 0; g.wd.begTired = Math.max(0, g.wd.begTired - 60); g.wd.haggled = {}; g.wd.litterDay = g.day;
  s.dirt = clamp(s.dirt + 6, 0, 100); s.open = false;
  dailyDebts(g); dailyHousing(g);
  // sạp cố định: phí chỗ tính tự động mỗi ngày, thiếu tiền thì quầy phải đóng
  if (stallRent(g) > 0) {
    const rent = stallRent(g);
    if (payStallRent(g)) toast(`Phí chỗ sạp hôm nay: ${money(rent)}.`, 'info', 'cash');
    else toast(`Không đủ ${money(rent)} đóng phí chỗ sạp — quầy đóng cửa tới khi đóng đủ.`, 'bad', 'cash', true);
  }
  // người phụ việc: trả lương đầu ngày, không có tiền thì họ nghỉ
  if (g.help) {
    if (spend(g, g.help.wage, 'fees')) { g.help.paid = g.day; toast(`Trả lương ${money(g.help.wage)} cho ${g.help.name}.`, 'info', 'cash'); }
    else { const n = g.help.name; g.help = g.help2 ?? null; g.help2 = null; toast(`${n} xin nghỉ vì chưa được trả lương. Quầy lại vắng tay.`, 'bad', 'heart', true); }
  }
  if (g.help2) {
    if (spend(g, g.help2.wage, 'fees')) { g.help2.paid = g.day; toast(`Trả lương ${money(g.help2.wage)} cho ${g.help2.name}.`, 'info', 'cash'); }
    else { const n = g.help2.name; g.help2 = null; toast(`${n} xin nghỉ vì chưa được trả lương.`, 'bad', 'heart', true); }
  }
  // nhân viên phụ bếp (bậc 6): trả lương đầu ngày
  if (g.sous) {
    if (spend(g, g.sous.wage, 'fees')) { g.sous.paid = g.day; toast(`Trả lương phụ bếp ${money(g.sous.wage)} cho ${g.sous.name}.`, 'info', 'cash'); }
    else { const n = g.sous.name; g.sous = g.sous2 ?? null; g.sous2 = null; toast(`Phụ bếp ${n} xin nghỉ vì thiếu lương.`, 'bad', 'heart', true); }
  }
  if (g.sous2) {
    if (spend(g, g.sous2.wage, 'fees')) { g.sous2.paid = g.day; toast(`Trả lương phụ bếp ${money(g.sous2.wage)} cho ${g.sous2.name}.`, 'info', 'cash'); }
    else { const n = g.sous2.name; g.sous2 = null; toast(`Phụ bếp ${n} xin nghỉ vì thiếu lương.`, 'bad', 'heart', true); }
  }
  expireBookings(g);
  // gửi ngân hàng có lãi nhỏ
  if (g.bank > 0) g.bank += Math.floor(g.bank * 0.0008);
  bus.emit('day', g.day);
  if (checkBankrupt(g)) bus.emit('bankrupt', undefined);
  bus.emit('save', 'ngay moi');
}
/** Tiến thời gian thêm dm phút game. */
export function advance(g: Game, dm: number, act: Activity, R: RNG = rnd) {
  if (dm <= 0) return;
  const h0 = Math.floor(absMin(g) / 60);
  g.min += dm;
  PH.tick(g, dm);
  tickStats(g, dm, act);
  branchTick(g, dm, R);
  errandTick(g, dm, R);
  if (g.min >= 1440) newDay(g, R);
  const h1 = Math.floor(absMin(g) / 60);
  for (let h = h0; h < h1; h++) hourly(g, R);
  directEvents(g, R);
}

// ───────────────────────── Việc vặt & mua bán lặt vặt ─────────────────────────
export function sellJunk(g: Game, where: 'scrap' | 'scrap2' | 'pawn'): number {
  let sum = 0;
  for (const [id, n] of Object.entries(g.junk)) { const j = JUNK[id]; if (!junkAt(where, j) || n <= 0) continue; sum += j.price * n; delete g.junk[id]; }
  // `earn(..., 'side')` chỉ cộng vào thu nhập & sổ sách; `tot.scrap` là mục riêng ở bảng tổng kết.
  if (sum > 0) { earn(g, sum, 'side'); g.tot.scrap += sum; }
  return sum;
}
export function buyGear(g: Game, id: string): 'ok' | 'cash' | 'have' | 'tier' {
  if (has(g, id)) return 'have';
  const d = GEAR[id];
  if (!d) return 'have';
  if (d.minTier && g.stall.tier < d.minTier) return 'tier';
  if (!spend(g, d.price, 'gear')) return 'cash';
  if (d.kind === 'phone') { PH.activate(g, id); bus.emit('save', 'mua dien thoai'); return 'ok'; }
  g.gear[id] = 100;
  if (d.kind === 'stall' && d.tier! > g.stall.tier) {
    const old = g.stall;
    g.stall = { ...old, tier: d.tier!, where: 'carried', spot: null, open: false, cond: 100 };
  }
  bus.emit('save', 'mua do'); return 'ok';
}
/** Phí chỗ mỗi ngày của quầy đang đặt (chỉ sạp cố định mới đóng theo ngày; gánh/xe đẩy đóng lúc đặt chỗ). */
export function stallRent(g: Game): number {
  const s = g.stall;
  if (s.tier < 3 || s.where !== 'placed' || !s.spot) return 0;
  return SPOTS.find((p) => p.id === s.spot)?.fee ?? 0;
}
/** Thu phí chỗ đầu ngày. Trả về true nếu đã đóng (hoặc không phải đóng). */
export function payStallRent(g: Game): boolean {
  const rent = stallRent(g);
  if (rent <= 0) { delete g.flags.sapNo; return true; }
  if (!spend(g, rent, 'fees')) { g.flags.sapNo = 1; return false; }
  delete g.flags.sapNo; g.stall.paidDay = g.day; return true;
}
export function repairCost(g: Game): number { return round1k((100 - g.stall.cond) * (300 + g.stall.tier * 500)); }
/**
 * Món tự mở khi lên cấp: lấy những món chưa biết, tay nghề đã đủ, xếp theo giá tham chiếu tăng dần
 * — cấp càng cao thì món mở ra càng đắt lời. Mỗi cấp chỉ mở một hai món để người chơi kịp làm quen.
 */
export function unlockRecipes(g: Game, n = 2): RecipeDef[] {
  const lvl = level(g);
  const pool = RECIPE_LIST.filter((r) => !g.rec[r.id].known && (!r.learn || r.learn.skill <= lvl)).sort((a, b) => a.ref - b.ref || a.id.localeCompare(b.id));
  const out: RecipeDef[] = [];
  for (let i = 0; i < n && i < pool.length; i++) { g.rec[pool[i].id].known = true; out.push(pool[i]); }
  return out;
}
export function addXp(g: Game, score: number) {
  const l0 = level(g); g.xp += 1 + score * 3;
  if (level(g) <= l0) return;
  const lv = level(g), got = unlockRecipes(g, lv <= 1 ? 1 : 2);
  toast(`Tay nghề lên cấp ${lv}! Thao tác nấu dễ chuẩn hơn.`, 'good', 'star');
  if (got.length) { toast(`Tự nghĩ ra ${got.length > 1 ? 'hai món mới' : 'một món mới'}: ${got.map((r) => r.name).join(', ')}. Xem trong Sổ tay.`, 'good', 'dish', true); bus.emit('save', 'len cap'); }
}
