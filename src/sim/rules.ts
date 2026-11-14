// LUẬT CHƠI — kinh tế, giá vốn, nhu cầu khách, đánh giá, chỉ số sinh tồn, thời tiết, sự kiện, nợ nần.
// Toàn bộ là logic thuần, không đụng tới đồ hoạ hay DOM (xem tests/ để thấy cách kiểm thử).
import { clamp, RNG, rnd, round1k, round500, hashStr, money, lerp } from '../core/util';
import { bus, toast } from '../core/bus';
import { INGS } from '../data/ingredients';
import { SHOPS, ShopDef } from '../data/shops';
import { RECIPES, RecipeDef, fuelPerPortion, toolsFor, RECIPE_LIST } from '../data/recipes';
import { GEAR, HOUSING, LENDERS, TIERS, JUNK } from '../data/gear';
import { ARCH, ArchDef, HELPER_POOL, HelperDef, LINES, FIXED, FIXED_ROLE } from '../data/people';
import { EVENTS, EVENT_LIST, EventDef, WEATHER, WeatherDef, WeatherId, floodZone, hourCurve } from '../data/world';
import { EXPR } from '../data/expr';
import { District, DISTRICT, SPOTS, districtAt, spotById } from '../world/layout';
import { Game, Stack, Helper, Chef, Booking, Branch, absMin, addStack, countOf, hourOf, newLedger, purge, spoil, takeFrom, weightOf, junkWeight, emptyStall, Debt, coldWeightOf } from './state';
import * as PH from './phone';

// ───────────────────────── Tiện ích chung ─────────────────────────
export const wx = (g: Game): WeatherDef => WEATHER[g.weather.now];
export const level = (g: Game) => Math.min(10, Math.floor(Math.sqrt(g.xp / 30)));
export const tier = (g: Game) => TIERS[g.stall.tier];
/** Chỗ ngồi ăn tại chỗ: quán ăn nhỏ (bậc 4) bốn ghế nhựa, quán có chỗ ngồi (bậc 5) sáu ghế, nhà hàng (bậc 6+) tám ghế bàn gỗ. */
export const seatCount = (g: Game) => (g.stall.tier >= 6 ? 8 : g.stall.tier >= 5 ? 6 : g.stall.tier >= 4 ? 4 : 0);
/** Quán đã có chỗ ngồi trong nhà chưa (bậc 5+): khách ăn lâu hơn và gọi thêm tráng miệng. */
export const dineIn = (g: Game) => g.stall.tier >= 5;
/** Đã lên Nhà hàng bình dân (bậc 6+) chưa: có phòng bếp riêng, thuê được phụ bếp, nhận khách đoàn & đặt bàn trước. */
export const isRestaurant = (g: Game) => g.stall.tier >= 6;
/** Đã lên Chuỗi cửa hàng (bậc 7) chưa: mở được chi nhánh thứ hai hoạt động song song. */
export const isChain = (g: Game) => g.stall.tier >= 7;
/** Bốn buổi trong ngày, khớp thứ tự `RecipeDef.meal`: sáng, trưa, chiều tối, khuya. */
export const PERIODS = ['Buổi sáng', 'Buổi trưa', 'Buổi chiều', 'Khuya'] as const;
export const mealSlot = (h: number) => (h < 10 ? 0 : h < 14.5 ? 1 : h < 20 ? 2 : 3);
export const periodName = (g: Game) => PERIODS[mealSlot(hourOf(g))];
/** Món này có đúng buổi không (điểm hợp buổi từ 0,8 trở lên). */
export const fitsPeriod = (r: RecipeDef, h: number) => r.meal[mealSlot(h)] >= 0.8;
/** Những món đang bật của quán mà hợp với buổi hiện tại — quán có chỗ ngồi ưu tiên bán mấy món này. */
export const periodMenu = (g: Game) => menuOf(g).filter((r) => fitsPeriod(r, hourOf(g)));
export const has = (g: Game, gear: string) => g.gear[gear] !== undefined && g.gear[gear] > 0;
export const stove = (g: Game): 'bepgas' | 'bepthan' | null => (has(g, 'bepgas') ? 'bepgas' : has(g, 'bepthan') ? 'bepthan' : null);
export const hasTool = (g: Game, t: string) => (t === 'bep' ? stove(g) !== null : has(g, t));
export const carryCap = (g: Game) => 7 + (has(g, 'gio') ? 6 : 0);
export const bagWeight = (g: Game) => weightOf(g.bag) + junkWeight(g) + g.meals.reduce((a, m) => a + m.n * 0.3, 0);
export const stallRoom = (g: Game) => tier(g).cap - weightOf(g.stall.store);
export const homeRoom = (g: Game) => HOUSING[g.housing].storage - weightOf(g.home);
/** Nhà thuê theo tuần thì cắm được tủ lạnh của mình. */
export const PLUGGABLE = ['tro', 'canho', 'nharieng', 'cuahang'];
export const homeChilled = (g: Game) => HOUSING[g.housing].cold || (PLUGGABLE.includes(g.housing) && has(g, 'tulanh') && !blackoutAt(g, 'dancu'));
export const stallChilled = (g: Game) => has(g, 'thungda') && countOf([g.stall.store], 'da') > 0;
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
  if (shop.lateSale && d.shelf < 200 && hourOf(g) >= shop.open[1] - 2) p *= 0.75;   // xả hàng cuối buổi
  if (floodPct(g) > 0.5 && d.cat === 'veg') p *= 1.15;
  return Math.max(500, p >= 5000 ? round500(p) : Math.round(p / 100) * 100);
}
export const shopHas = (g: Game, shop: ShopDef, ingId: string) => !(shop.id.startsWith('m_') && g.wd.outOf.includes(ingId));
/** Độ tươi của hàng: chợ sáng tươi nhất, càng về chiều càng kém. */
export function shopFresh(g: Game, shop: ShopDef, ingId: string, R: RNG = rnd): number {
  const d = INGS[ingId]; if (d.shelf > 9000) return 100;
  const t = clamp((hourOf(g) - shop.open[0]) / Math.max(1, shop.open[1] - shop.open[0]));
  return clamp(lerp(shop.fresh[1], shop.fresh[0], t) - (d.shelf < 12 ? t * 14 : 0) + R.range(-2, 2), 30, 100);
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
/** Đồ sơ chế để lâu quá hạn `hold` thì xuống chất lượng (có phụ bếp ở bậc 6+ giữ tươi lâu hơn ×1,5). */
export function holdFactor(g: Game, r: RecipeDef, at: number): number {
  if (r.hold <= 0) return 1;
  const lim = r.hold * (g.stall.tier >= 6 && g.chef ? 1.5 : 1);
  const over = (absMin(g) - at - lim) / lim;
  return over <= 0 ? 1 : clamp(1 - over * 0.5, 0.4, 1);
}
/** Dùng nhiên liệu cho một lần đứng bếp. Trả về false nếu hết. */
export function useFuel(g: Game, units = 1): boolean {
  const s = g.stall, kind = stove(g); if (!kind) return false;
  const item = kind === 'bepgas' ? 'gas' : 'than';
  if (s.fuelKind !== item) { s.fuel = 0; s.fuelKind = item; }
  while (s.fuel < units) {
    const t = takeFrom(stores(g), item, 1); if (!t) return false;
    s.fuel += item === 'gas' ? 14 : 22;
  }
  s.fuel -= units; return true;
}
/** Tổng hợp chất lượng một mẻ: điểm thao tác + chất lượng nguyên liệu + tay nghề. */
export function dishQuality(g: Game, r: RecipeDef, stepScore: number, ingQ: number, prepQ = 1): number {
  const mastery = clamp(g.rec[r.id].made / 60) * 0.06, char = stove(g) === 'bepthan' && r.finish.some((s) => s.t === 'grill') ? 0.04 : 0;
  return clamp((0.55 * stepScore + 0.45 * stepScore * prepQ) * (0.35 + 0.65 * ingQ) + mastery + char, 0.02, 1);
}
/** Độ khó thao tác nấu (cửa sổ thời gian rộng hay hẹp). >1 dễ hơn. */
export function cookEase(g: Game): number {
  let e = 1 + level(g) * 0.03 + (g.stall.tier >= 6 && g.chef ? 0.15 : 0);
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
/** Độ hấp dẫn của quầy (0.2–2): bảng hiệu, ô dù, đèn, vệ sinh, tình trạng. */
export function stallAppeal(g: Game): number {
  let a = tier(g).visible;
  if (has(g, 'bien')) a *= 1.15;
  if (has(g, 'odu')) a *= 1.06;
  if (has(g, 'ghe')) a *= 1.1;
  if (isNight(g)) a *= has(g, 'den') ? 0.95 : 0.3;
  if (wx(g).rain > 0.3) a *= has(g, 'odu') ? 0.95 : 0.45;
  a *= 0.6 + 0.4 * clamp(g.stall.cond / 70);
  a *= 1 - clamp(g.stall.dirt / 100) * 0.35;
  if (g.st.hygiene < 30) a *= 0.55 + g.st.hygiene / 66;
  return clamp(a, 0.1, 2);
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
export interface Order { rid: string; n: number; price: number; ratio: number; line: string; mood: 'ok' | 'pricey' | 'cheap'; /** món gọi thêm sau khi ăn xong (quán có chỗ ngồi) */ more?: boolean; /** khách đi theo đoàn ở nhà hàng bình dân (bậc 6+) */ group?: boolean; }
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
  let n = 1, group = false;
  if (g.stall.tier >= 6 && R.chance(slot === 1 || slot === 2 ? 0.35 : 0.2)) {
    n = R.int(2, 4); group = true;
  } else {
    if (r.fill < 30 && R.chance(0.3)) n = 2;
    if (p.arch.id === 'phuhuynh' && R.chance(0.45)) n = 2;
  }
  const maxAfford = Math.max(1, Math.floor((group ? p.budget * n : p.budget) / price));
  n = Math.min(n, readyCount(g, r.id) + finishPossible(g, r), maxAfford);
  if (n < 2) group = false;
  const mood: Order['mood'] = br > 1.12 ? 'pricey' : br < 0.72 ? 'cheap' : 'ok';
  const pool = mood === 'pricey' ? LINES.pricey_buy : p.regular && R.chance(0.6) ? LINES.order_regular : LINES.order;
  const nWord = n === 1 ? 'một' : n === 2 ? 'hai' : n === 3 ? 'ba' : 'bốn';
  const line = group
    ? `Bàn ${p.arch.self[fem ? 1 : 0]} đi đoàn ${n} người, cho ${nWord} phần ${r.name.toLowerCase()} nghen!`
    : say(R.pick(pool), p.arch, fem, g, { dish: r.name.toLowerCase(), n: nWord, price: money(price) });
  return { order: { rid: r.id, n, price, ratio: br, line, mood, ...(group ? { group: true } : {}) } };
}
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
  const service = (g.st.mood < 25 ? -0.05 : g.st.mood > 70 ? 0.03 : 0) + (has(g, 'ghe') ? 0.03 : 0);
  const picky = p.arch.id === 'khotinh' || p.arch.id === 'phebinh' ? 0.08 : 0;
  const s = clamp(0.12 + 0.63 * quality + 0.13 * (1 - clamp(wait)) + 0.12 * value + service - hyg - picky);
  const stars = clamp(1 + s * 4.3, 1, 5);
  const damp = 1 / (1 + g.rep / 60);
  let rep = (stars - 3.25) * 0.55 * (stars > 3.25 ? damp : 1);
  if (p.arch.id === 'phebinh') rep = (stars - 3.6) * 7;
  if (p.arch.id === 'nhagiau' && stars > 4.2) rep += 0.6;
  if (o.group && stars >= 3.8) rep += 0.25;
  let tip = 0;
  if (stars >= (o.group ? 4.0 : 4.3) && R.chance(p.arch.tip * 2.2 + (stars - 4.3) + (o.group ? 0.28 : 0))) {
    tip = Math.max(o.group ? 3000 : 1000, round1k(o.price * o.n * R.range(o.group ? 0.08 : 0.06, o.group ? 0.24 : 0.2)));
  }
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
  g.st.mood = clamp(g.st.mood + (rv.stars - 3) * 1.2, 0, 100);
  g.stall.dirt = clamp(g.stall.dirt + 0.8 * o.n, 0, 100);
}
export function lostCustomer(g: Game, why: 'wait' | 'price' | 'none' | 'dirty') {
  g.led.lost++;
  g.rep = clamp(g.rep - (why === 'wait' ? 0.5 : why === 'dirty' ? 0.35 : why === 'price' ? 0.08 : 0.05), 0, 100);
  if (why === 'wait') g.st.mood = clamp(g.st.mood - 2, 0, 100);
}

// ───────────────────────── Chỉ số sinh tồn ─────────────────────────
export interface Activity { moving: boolean; running: boolean; sleeping: boolean; sheltered: boolean; working: boolean; load: number; sleepQ: number; }
export const staminaMax = (g: Game) => clamp(0.35 + 0.65 * Math.min(g.st.hunger, g.st.thirst) / 55, 0.35, 1);
export function moveMul(g: Game, x: number, z: number): number {
  let m = wx(g).walk;
  if (g.st.health < 45) m *= 0.62 + 0.38 * g.st.health / 45;          // bị thương/ốm → đi chậm
  if (g.st.energy < 12) m *= 0.8;
  if (floodPct(g) > 0.35 && floodZone(x, z)) m *= lerp(1, 0.55, clamp((floodPct(g) - 0.35) * 2.5));
  return m;
}
export const floodPct = (g: Game) => clamp(g.weather.flood);
export function tickStats(g: Game, dm: number, a: Activity) {
  const s = g.st, w = wx(g);
  const work = a.running ? 1.7 : a.working ? 1.35 : a.moving ? 1.1 : 1, load = 1 + clamp(a.load) * 0.5;
  if (a.sleeping) {
    s.energy += dm * 0.215 * a.sleepQ; s.hunger -= dm * 0.045; s.thirst -= dm * 0.06;
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
  if (s.hunger <= 0) s.health -= dm * 0.09;
  if (s.thirst <= 0) s.health -= dm * 0.13;
  if (s.energy <= 0) s.health -= dm * 0.05;
  if (s.hunger > 40 && s.thirst > 40 && s.energy > 30 && !g.flags.sick) s.health += dm * 0.012;
  // tinh thần trôi dần về mức nền
  const base = clamp(42 + HOUSING[g.housing].mood + (s.hunger < 25 ? -14 : 0) + (s.hygiene < 25 ? -10 : 0) + (g.debts.some((d) => g.day > d.due) ? -15 : 0) + (g.rep > 40 ? 8 : 0), 5, 90);
  s.mood += (base - s.mood) * clamp(dm * 0.0025);
  for (const k of Object.keys(s) as (keyof typeof s)[]) s[k] = clamp(s[k], 0, 100);
}
/** Ăn/uống một món. */
export function consume(g: Game, eff: { h?: number; t?: number; m?: number; hp?: number; e?: number; hy?: number }, risky = 0, badMsg = 'Ăn đồ ôi thiu — đau bụng quá!') {
  const s = g.st;
  s.hunger = clamp(s.hunger + (eff.h ?? 0), 0, 100); s.thirst = clamp(s.thirst + (eff.t ?? 0), 0, 100); s.mood = clamp(s.mood + (eff.m ?? 0), 0, 100);
  s.health = clamp(s.health + (eff.hp ?? 0), 0, 100); s.energy = clamp(s.energy + (eff.e ?? 0), 0, 100); s.hygiene = clamp(s.hygiene + (eff.hy ?? 0), 0, 100);
  if ((eff.hp ?? 0) >= 20 && g.flags.sick) { delete g.flags.sick; toast('Hết cảm rồi, khoẻ lại rồi!', 'good', 'heart'); }
  if (risky > 0 && rnd.chance(risky)) { s.health = clamp(s.health - 18, 0, 100); s.mood = clamp(s.mood - 8, 0, 100); toast(badMsg, 'bad', 'heart'); }
}

// ───────────────────────── Sức khoẻ: xỉu & bệnh viện ─────────────────────────
/** Phí khám bác sĩ. Khám xong mới biết bệnh, nhưng vẫn phải trả trước. */
export const EXAM_FEE = 20000;
/** Giá một giờ nằm phòng hồi sức. */
export const RECOVER_FEE = 5000;
/** Tiền xe cấp cứu cộng viện phí khi ngất — luôn có mức trần để người mới chơi không sạt nghiệp. */
export const FAINT_FEE = 30000;

export interface MedDef { id: string; name: string; price: number; desc: string; hp: number; e: number; cures?: 'sick'; }
/** Quầy thuốc trong bệnh viện: bán đúng thứ người bệnh cần, dùng ngay tại chỗ. */
export const MEDS: Record<string, MedDef> = {
  cam: { id: 'cam', name: 'Thuốc cảm', price: 15000, desc: 'Một liều là hết sợi cảm, người nhẹ hẳn.', hp: 8, e: 4, cures: 'sick' },
  bang: { id: 'bang', name: 'Bông băng', price: 8000, desc: 'Băng vết trầy, cầm máu, đỡ rát.', hp: 14, e: 0 },
  bo: { id: 'bo', name: 'Thuốc bổ', price: 25000, desc: 'Uống cho lại sức, bớt chóng mặt.', hp: 22, e: 14 },
};
export const MED_LIST = Object.values(MEDS);

/** Mua thuốc ở quầy bệnh viện: trả tiền rồi dùng luôn. false nếu không đủ tiền. */
export function buyMed(g: Game, id: string): boolean {
  const m = MEDS[id];
  if (!m || !spend(g, m.price, 'other')) return false;
  consume(g, { hp: m.hp, e: m.e });
  if (m.cures === 'sick' && g.flags.sick) { delete g.flags.sick; toast('Uống thuốc cảm, trong người nhẹ hẳn ra.', 'good', 'heart'); }
  return true;
}

/** Khám bệnh: trả phí rồi bác sĩ nói bệnh gì. null nếu không đủ tiền khám. */
export function exam(g: Game): string | null {
  if (!spend(g, EXAM_FEE, 'other')) return null;
  g.flags.exam = g.day;
  const s = g.st;
  if (g.flags.sick) return 'Bác sĩ nói bạn bị cảm nặng, ho cả tuần rồi. Ra quầy thuốc mua thuốc cảm uống liền đi.';
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
  s.mood = clamp(s.mood - 18, 0, 100); s.hygiene = clamp(s.hygiene - 22, 0, 100);
  s.hunger = clamp(s.hunger - 8, 0, 100); s.thirst = clamp(s.thirst - 8, 0, 100);
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
  if (e.gift) { earn(g, e.gift, 'side'); g.st.mood = clamp(g.st.mood + 20, 0, 100); }
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
          g.st.mood = clamp(g.st.mood - 25, 0, 100); g.st.health = clamp(g.st.health - (d.owed > 0 ? 15 : 0), 5, 100); g.rep = clamp(g.rep - 3, 0, 100);
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
export function payHousing(g: Game, id: string): boolean {
  const h = HOUSING[id];
  if (!h || !canRent(g, id)) return false;
  if (h.rent > 0 && !spend(g, h.rent, 'rent')) return false;
  if (g.housing !== id) { // chuyển nhà: đồ ở chỗ cũ theo người chơi nếu là gầm cầu thì để lại
    g.flags['lived_' + id] = 1;
  }
  g.housing = id; g.paidUntil = g.day + (h.per === 'tuần' ? 7 : h.per === 'đêm' ? 1 : 9999);
  bus.emit('save', 'cho o'); return true;
}
function dailyHousing(g: Game) {
  const h = HOUSING[g.housing];
  if (h.per === 'tuần' && g.day >= g.paidUntil) {
    const late = g.day - g.paidUntil;
    if (late === 0) toast(`Tới hạn đóng ${money(h.rent)} tiền nhà ${h.name} tuần này. Ghé chỗ thuê để đóng.`, 'warn', 'home', true);
    else if (late >= 2) {
      const lost = g.home.reduce((a, s) => a + s.n * s.cost, 0); g.home = []; g.led.loss += lost; g.housing = 'gamcau'; g.paidUntil = 9999;
      if (has(g, 'tulanh')) delete g.gear.tulanh;
      toast(`Chủ nhà đã lấy lại ${h.name} vì nợ tiền nhà. Đồ để trong phòng bị giữ hết.`, 'bad', 'home', true); g.st.mood = clamp(g.st.mood - 20, 0, 100);
    } else toast(`Chủ nhà nhắc: mai không đóng tiền nhà là trả lại ${h.name}.`, 'warn', 'home', true);
  }
  if (h.per === 'đêm' && g.day >= g.paidUntil) { g.housing = 'gamcau'; g.paidUntil = 9999; }
}

// ───────────────────────── Dòng thời gian ─────────────────────────
function hourly(g: Game, R: RNG) {
  const w = wx(g), s = g.stall;
  spoil(g.bag, 1, w.spoil, false);
  spoil(s.store, 1, w.spoil, stallChilled(g));
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
  // đồ đã làm sẵn nguội dần
  for (const rd of s.ready) { const r = RECIPES[rd.rid]; if (absMin(g) - rd.at > 90) rd.q = Math.max(0.15, rd.q - 0.06); void r; }
  if (g.stall.tier >= 6) ensureBookings(g, R);
  if (g.stall.tier >= 7) tickBranchHour(g, hourOf(g), R);
  if (g.weather.until <= absMin(g) && !activeEvents(g).some((e) => e.weather)) setWeather(g, g.weather.next, R);
}
// ───────────────────────── Bậc 6: Phụ bếp & Đặt bàn trước · Bậc 7: Chuỗi cửa hàng ─────────────────────────
export interface ChefDef { id: string; name: string; fem: boolean; wage: number; bio: string; }
export const CHEF_POOL: ChefDef[] = [
  { id: 'sau_bep', name: 'Chú Sáu Bếp', fem: false, wage: 95000, bio: 'Đứng bếp 10 năm, sơ chế lẹ và giữ cốt món tươi lâu gấp rưỡi.' },
  { id: 'tu_nau', name: 'Chị Tư Nấu', fem: true, wage: 100000, bio: 'Chuyên nấu tiệc đoàn, tự động chuẩn bị món khi khay vơi.' },
  { id: 'hoang_bep', name: 'Anh Hoàng Bếp', fem: false, wage: 110000, bio: 'Đầu bếp tay nghề vững, giúp thao tác nấu nhẹ nhàng và ra món đều.' },
];
/** Nhận phụ bếp (cần bậc 6 — Nhà hàng bình dân trở lên): ứng trước 1 ngày lương. */
export function hireChef(g: Game, d: ChefDef = CHEF_POOL[0]): boolean {
  if (g.stall.tier < 6 || g.chef) return false;
  if (!spend(g, d.wage, 'fees')) return false;
  g.chef = { name: d.name, fem: d.fem, wage: d.wage, since: g.day, paid: g.day };
  return true;
}
/** Cho phụ bếp nghỉ việc. */
export function fireChef(g: Game): Chef | null { const c = g.chef; g.chef = null; return c; }
/** Phụ bếp tự động sơ chế và nấu thêm món đang bật khi khay vơi (< 2 phần). */
export function chefAutoCook(g: Game): RecipeDef | null {
  const s = g.stall;
  if (s.tier < 6 || !g.chef || !s.open || s.where !== 'placed') return null;
  for (const r of menuOf(g)) {
    if (readyCount(g, r.id) >= Math.min(4, r.serve * 2)) continue;
    let did = false;
    const prepped = s.preps.filter((p) => p.rid === r.id).reduce((a, p) => a + p.n, 0);
    if (hasPrep(r) && prepped < r.serve && prepPossible(g, r) >= 1) {
      const n = prepPossible(g, r), c = consumePrep(g, r, n);
      s.preps.push({ rid: r.id, n, q: clamp(c.q * 0.9, 0.5, 0.96), at: absMin(g), cost: c.cost / n });
      did = true;
    }
    const fin = finishPossible(g, r);
    if (fin >= 1) {
      const n = Math.min(r.serve, fin), needFuel = fuelPerPortion(r) * n;
      if (needFuel <= 0 || useFuel(g, needFuel)) {
        const c = consumeFinish(g, r, n), q = dishQuality(g, r, 0.86, c.q, c.prepQ);
        s.ready.push({ rid: r.id, n, q, at: absMin(g), cost: c.cost / n });
        did = true;
      }
    }
    if (did) return r;
  }
  return null;
}
const BOOKING_NAMES = ['Đoàn công ty Sao Mai', 'Nhóm bạn chú Hùng', 'Gia đình cô Lan', 'Đoàn khách du lịch', 'Hội đồng hương Xóm Chiều', 'Phòng kế toán Ngân hàng'];
/** Tạo danh sách đặt bàn trước trong ngày cho Nhà hàng bình dân (bậc 6+). */
export function ensureBookings(g: Game, R: RNG = rnd): Booking[] {
  if (g.stall.tier < 6) return [];
  if (g.bookings.length > 0 && g.bookings[0].day === g.day) return g.bookings;
  const pool = menuOf(g).length ? menuOf(g) : RECIPE_LIST.filter((r) => g.rec[r.id]?.known);
  if (!pool.length) return [];
  const hours = [11.5, 13.0, 18.5];
  g.bookings = hours.map((hr, idx) => {
    const r = pool[(Math.abs(g.seed) + g.day * 5 + idx * 3) % pool.length];
    const pax = 2 + ((Math.abs(g.seed) + g.day + idx * 2) % 3); // 2..4 khách
    const name = BOOKING_NAMES[(Math.abs(g.seed) + g.day * 2 + idx) % BOOKING_NAMES.length];
    const bonus = round1k((15000 + pax * 4000) * (1 + g.rep / 200));
    return { id: idx + 1, day: g.day, name, pax, rid: r.id, hour: hr, bonus, done: false };
  });
  void R;
  return g.bookings;
}
/** Phục vụ một đơn đặt bàn trước: giao đủ số phần đã làm sẵn trên khay, nhận tiền món + tiền thưởng giữ bàn + uy tín. */
export function fulfillBooking(g: Game, bookingId: number): { ok: boolean; rev: number; bonus: number; why?: string } {
  if (g.stall.tier < 6) return { ok: false, rev: 0, bonus: 0, why: 'Cần Nhà hàng bình dân (bậc 6) trở lên.' };
  ensureBookings(g);
  const b = g.bookings.find((x) => x.id === bookingId);
  if (!b) return { ok: false, rev: 0, bonus: 0, why: 'Không tìm thấy đơn đặt bàn.' };
  if (b.done) return { ok: false, rev: 0, bonus: 0, why: 'Đoàn khách này đã được phục vụ rồi.' };
  const r = RECIPES[b.rid];
  if (readyCount(g, b.rid) < b.pax) {
    return { ok: false, rev: 0, bonus: 0, why: `Cần làm sẵn ít nhất ${b.pax} phần ${r.name} trên khay (đang có ${readyCount(g, b.rid)} phần).` };
  }
  let left = b.pax, cost = 0, q = 0;
  for (const rd of g.stall.ready.filter((x) => x.rid === b.rid).sort((a, y) => a.at - y.at)) {
    const k = Math.min(left, rd.n);
    cost += k * rd.cost; q += k * rd.q; rd.n -= k; left -= k;
    if (left <= 0) break;
  }
  g.stall.ready = g.stall.ready.filter((x) => x.n > 0);
  q /= b.pax;
  const price = g.rec[b.rid]?.price ?? r.ref, rev = price * b.pax;
  earn(g, rev, 'revenue');
  earn(g, b.bonus, 'tips');
  g.led.cogs += round1k(cost);
  g.led.sold += b.pax;
  g.led.customers++;
  g.led.stars += 4.8;
  g.led.rated++;
  g.tot.served += b.pax;
  g.rep = clamp(g.rep + 0.8, 0, 100);
  g.rec[b.rid].made += b.pax;
  g.rec[b.rid].best = Math.max(g.rec[b.rid].best, q);
  b.done = true;
  return { ok: true, rev, bonus: b.bonus };
}

export interface BranchManagerDef { id: string; name: string; wage: number; bio: string; }
export const BRANCH_MANAGERS: BranchManagerDef[] = [
  { id: 'minh_ql', name: 'Anh Minh Quản Lý', wage: 90000, bio: 'Quản lý chuỗi quán ăn 6 năm, sổ sách minh bạch, điều phối nguyên liệu chuẩn.' },
  { id: 'lan_ql', name: 'Chị Lan Quản Lý', wage: 95000, bio: 'Từng quản lý cửa hàng ăn uống ở Phố Văn Phòng, giữ chân khách quen rất khéo.' },
];
/** Các điểm bán hợp lệ để mở Chi nhánh thứ hai (không trùng điểm đang đặt quán chính, không phải vỉa hè lấn chiếm). */
export const branchSpots = (g: Game) => SPOTS.filter((s) => s.minTier >= 3 && !s.curbRisk && s.id !== g.stall.spot);
/** Mở Chi nhánh thứ hai (cần bậc 7 — Chuỗi cửa hàng): đóng phí mặt bằng ngày đầu + ứng lương quản lý. */
export function openBranch(g: Game, spotId: string, mgr: BranchManagerDef = BRANCH_MANAGERS[0]): { ok: boolean; why?: string } {
  if (g.stall.tier < 7) return { ok: false, why: 'Cần nâng cấp lên Chuỗi cửa hàng (bậc 7) trước.' };
  if (spotId === g.stall.spot) return { ok: false, why: 'Chi nhánh thứ hai phải đặt ở điểm bán khác với quán chính.' };
  const sp = spotById(spotId);
  if (!sp || sp.curbRisk) return { ok: false, why: 'Điểm bán không hợp lệ cho chi nhánh cố định.' };
  const fee = sp.fee + mgr.wage;
  if (!spend(g, fee, 'fees')) return { ok: false, why: `Cần ${money(fee)} (phí mặt bằng ${money(sp.fee)} + lương quản lý ${money(mgr.wage)}).` };
  g.branch = {
    spot: spotId, manager: mgr.name, wage: mgr.wage, open: true,
    todaySold: 0, todayRev: 0, todayCost: 0, todayRent: fee,
    totalSold: g.branch?.totalSold ?? 0, totalRev: g.branch?.totalRev ?? 0,
  };
  return { ok: true };
}
export function toggleBranch(g: Game): boolean {
  if (!g.branch || !g.branch.spot) return false;
  g.branch.open = !g.branch.open;
  return g.branch.open;
}
export function closeBranch(g: Game) { g.branch = null; }
/** Mô phỏng doanh thu 1 giờ của Chi nhánh thứ hai (hoạt động tự động từ 7h đến 21h dưới sự trông coi của quản lý). */
export function tickBranchHour(g: Game, h: number, R: RNG = rnd): { sold: number; rev: number; cost: number } {
  const b = g.branch;
  if (g.stall.tier < 7 || !b || !b.open || !b.spot || !b.manager) return { sold: 0, rev: 0, cost: 0 };
  if (h < 7 || h >= 21 || wx(g).id === 'bao') return { sold: 0, rev: 0, cost: 0 };
  const sp = spotById(b.spot);
  if (!sp) return { sold: 0, rev: 0, cost: 0 };
  const menu = menuOf(g).length ? menuOf(g) : RECIPE_LIST.filter((r) => g.rec[r.id]?.known).slice(0, 6);
  if (!menu.length) return { sold: 0, rev: 0, cost: 0 };
  const rate = 2.6 * sp.traffic * hourCurve(h, sp.district) * (0.75 + g.rep / 65) * R.range(0.8, 1.25);
  const sold = Math.max(1, Math.round(rate));
  let rev = 0, cost = 0;
  for (let i = 0; i < sold; i++) {
    const r = menu[(i + g.day + Math.floor(h)) % menu.length];
    const p = g.rec[r.id]?.price ?? r.ref;
    const c = round1k(recipeCost(g, r).total * 0.88);
    rev += p; cost += c;
    g.rec[r.id].made++;
  }
  earn(g, rev, 'revenue');
  g.led.cogs += cost;
  g.led.sold += sold;
  g.led.customers += Math.max(1, Math.round(sold * 0.75));
  g.tot.served += sold;
  g.rep = clamp(g.rep + sold * 0.04, 0, 100);
  b.todaySold += sold; b.todayRev += rev; b.todayCost += cost;
  b.totalSold += sold; b.totalRev += rev;
  return { sold, rev, cost };
}
// ───────────────────────── Người phụ việc ở quầy ─────────────────────────
/** Điều kiện nhận phụ việc: quán phải đã bán được tiền thật và đã bán qua vài ngày. */
export const HELPER_MIN_REVENUE = 250000;
export const HELPER_MIN_DAYS = 2;
export const HELPER_MIN_TIER = 2;
/** Tổng doanh thu bán hàng từ trước tới giờ (sổ của ngày hôm nay + các ngày đã khoá sổ). */
export function stallRevenue(g: Game): number { return g.led.revenue + g.hist.reduce((a, h) => a + h.revenue, 0); }
export interface HelperGate { ok: boolean; revenue: number; days: number; tier: boolean; why: string; }
/** Vì sao chưa có người phụ việc — dùng cho gợi ý trong UI và cho test. */
export function helperGate(g: Game): HelperGate {
  const revenue = stallRevenue(g), first = g.flags.firstSale, days = typeof first === 'number' ? g.day - first : 0;
  const tier = g.stall.tier >= HELPER_MIN_TIER;
  const ok = !g.help && tier && revenue >= HELPER_MIN_REVENUE && days >= HELPER_MIN_DAYS;
  const why = g.help ? 'Đã có người phụ quầy'
    : !tier ? 'Cần xe đẩy trở lên mới thuê được người'
    : revenue < HELPER_MIN_REVENUE ? `Doanh thu mới ${money(revenue)} — cần ${money(HELPER_MIN_REVENUE)} mới nuôi nổi người phụ`
    : days < HELPER_MIN_DAYS ? `Mới bán được ${days + 1} ngày — bán quen tay đã rồi hẵng thuê`
    : '';
  return { ok, revenue, days, tier, why };
}
/** Người ứng viên kế tiếp (chọn theo seed + ngày để mỗi ván mỗi khác nhưng vẫn tất định). */
export function helperCandidate(g: Game): HelperDef { return HELPER_POOL[(Math.abs(g.seed) + g.day * 3) % HELPER_POOL.length]; }
/** Nhận người phụ việc: ghi vào sổ, ứng lương trước một ngày. Trả về false nếu thiếu tiền. */
export function hireHelper(g: Game, d: HelperDef = helperCandidate(g)): boolean {
  if (g.help) return false;
  if (!spend(g, d.wage, 'fees')) return false;
  const h: Helper = { name: d.name, fem: d.fem, face: d.face, hairStyle: d.hairStyle, shirt: d.shirt, pants: d.pants, hair: d.hair, skin: d.skin, wage: d.wage, since: g.day, paid: g.day, hired: true };
  g.help = h;
  return true;
}
/** Cho người phụ việc nghỉ. */
export function fireHelper(g: Game): Helper | null { const h = g.help; g.help = null; return h; }
/** Tỉ lệ khách chờ lâu hơn nhờ có người phụ dỗ khách. */
export function helperPatience(g: Game): number { return g.help ? 1.3 : 1; }

function newDay(g: Game, R: RNG) {
  // khoá sổ ngày cũ
  const s = g.stall;
  let waste = 0;
  for (const rd of s.ready) waste += rd.n * rd.cost; s.ready = [];
  for (const p of s.preps.slice()) { const r = RECIPES[p.rid]; if (absMin(g) - p.at > Math.max(r.hold, 300)) { waste += p.n * p.cost; s.preps.splice(s.preps.indexOf(p), 1); } }
  for (const l of [g.bag, s.store, g.home]) waste += purge(l).lost;
  g.led.loss += waste;
  g.hist.push(g.led); if (g.hist.length > 30) g.hist.shift();
  g.tot.best = Math.max(g.tot.best, g.led.revenue);
  g.day++; g.min -= 1440; g.led = newLedger(g.day);
  if (waste > 500) toast(`Đồ ôi thiu và đồ ế phải bỏ: mất ${money(waste)}.`, 'bad', 'box');
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
    else { const n = g.help.name; g.help = null; toast(`${n} xin nghỉ vì chưa được trả lương. Quầy lại một mình.`, 'bad', 'heart', true); }
  }
  // phụ bếp nhà hàng (bậc 6+): trả lương đầu ngày
  if (g.chef) {
    if (spend(g, g.chef.wage, 'fees')) { g.chef.paid = g.day; toast(`Trả lương phụ bếp ${money(g.chef.wage)} cho ${g.chef.name}.`, 'info', 'cash'); }
    else { const n = g.chef.name; g.chef = null; toast(`Phụ bếp ${n} xin nghỉ vì chưa được trả lương.`, 'bad', 'heart', true); }
  }
  // chi nhánh 2 của chuỗi cửa hàng (bậc 7): khoá sổ ngày cũ và đóng phí mặt bằng + lương quản lý ngày mới
  if (g.stall.tier >= 7 && g.branch && g.branch.spot) {
    const sp = spotById(g.branch.spot), fee = (sp?.fee ?? 0) + g.branch.wage;
    g.branch.todaySold = 0; g.branch.todayRev = 0; g.branch.todayCost = 0; g.branch.todayRent = 0;
    if (spend(g, fee, 'fees')) {
      g.branch.todayRent = fee;
      toast(`Chi nhánh 2 (${sp?.name ?? g.branch.spot}): đã đóng ${money(fee)} phí chỗ & lương quản lý ${g.branch.manager}.`, 'info', 'cash');
    } else {
      g.branch.open = false;
      toast(`Không đủ ${money(fee)} duy trì Chi nhánh 2 — chi nhánh tạm đóng cửa hôm nay.`, 'bad', 'cash', true);
    }
  }
  if (g.stall.tier >= 6) ensureBookings(g, R);
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
  if (g.min >= 1440) newDay(g, R);
  const h1 = Math.floor(absMin(g) / 60);
  for (let h = h0; h < h1; h++) hourly(g, R);
  directEvents(g, R);
}

// ───────────────────────── Việc vặt & mua bán lặt vặt ─────────────────────────
export function sellJunk(g: Game, where: 'scrap' | 'pawn'): number {
  let sum = 0;
  for (const [id, n] of Object.entries(g.junk)) { const j = JUNK[id]; if (j.where !== where || n <= 0) continue; sum += j.price * n; delete g.junk[id]; }
  if (sum > 0) { earn(g, sum, 'side'); g.tot.scrap += sum; }
  return sum;
}
export function buyGear(g: Game, id: string): 'ok' | 'cash' | 'have' {
  if (has(g, id)) return 'have';
  const d = GEAR[id];
  if (!spend(g, d.price, 'gear')) return 'cash';
  if (d.kind === 'phone') { PH.activate(g, id); bus.emit('save', 'mua dien thoai'); return 'ok'; }
  g.gear[id] = 100;
  if (d.kind === 'stall' && d.tier! > g.stall.tier) {
    const old = g.stall;
    g.stall = { ...old, tier: d.tier!, where: 'carried', spot: null, open: false, cond: 100 };
    if (d.tier! >= 6) ensureBookings(g);
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

/** Thay {ac} / {Ac} bằng đại từ nhân xưng đúng giới tính của người chơi ('anh'/'chị', 'Anh'/'Chị'). */
export const fmtAc = (s: string, g: Game): string =>
  s.replace(/\{ac\}/g, g.ac).replace(/\{Ac\}/g, g.ac === 'anh' ? 'Anh' : 'Chị');

/** Người chơi đã bắt đầu buôn bán chưa (đã sắm quầy hoặc đã từng bán ít nhất một phần). */
export const hasStartedSelling = (g: Game): boolean =>
  g.stall.tier > 0 || g.tot.served > 0 || typeof g.flags.firstSale === 'number';

/** Chỉ cho học công thức nấu ăn và nghe lời khuyên mở quán sau khi đã bắt đầu có quầy bán hàng. */
export const canLearnRecipes = (g: Game): boolean => g.stall.tier > 0;

/** Tỉ lệ Bà Tư cho thêm một phần cơm dư sau khi rửa chén xong. */
export const DISH_MEAL_CHANCE = 0.22;
/** Khung giờ rửa chén ở quán Bà Tư: 1 = ca trưa (10h–14h30), 2 = ca tối (17h30–21h), 0 = ngoài giờ. */
export const dishWindow = (h: number): 0 | 1 | 2 => (h >= 10 && h < 14.5 ? 1 : h >= 17.5 && h < 21 ? 2 : 0);
/** Có thể nhận rửa chén ở quán Bà Tư lúc này không (đúng khung giờ và chưa rửa ca đó trong ngày). */
export function canWashDishes(g: Game): { ok: boolean; win: 0 | 1 | 2; why: string } {
  const win = dishWindow(hourOf(g));
  if (!win) return { ok: false, win: 0, why: 'Chỉ cần người lúc 10–14h30 và 17h30–21h' };
  const done = g.flags['dish_' + win] === g.day || g.wd.plates >= 2;
  if (done) return { ok: false, win, why: win === 1 ? 'Ca trưa hôm nay rửa rồi — tối 17h30 ghé lại' : 'Ca tối hôm nay rửa rồi — mai ghé lại' };
  return { ok: true, win, why: 'Được 4.000₫ mỗi cái đĩa · đôi khi có cơm dư' };
}
/** Hoàn tất một ca rửa chén: trả tiền công, ghi nhận đã rửa ca hiện tại, và có tỉ lệ nhỏ được cho cơm dư. */
export function finishDishes(g: Game, score: number, R: RNG = rnd): { pay: number; meal: boolean } {
  const win = dishWindow(hourOf(g)) || (g.flags.dish_1 === g.day ? 2 : 1);
  g.flags['dish_' + win] = g.day;
  g.wd.plates++;
  const pay = round1k(8 * 4000 * (0.75 + 0.25 * clamp(score)));
  earn(g, pay, 'side');
  g.st.hygiene = clamp(g.st.hygiene + 6, 0, 100);
  g.st.energy = clamp(g.st.energy - 6, 0, 100);
  changeRel(g, 'eatery', 4, true);
  const meal = R.chance(DISH_MEAL_CHANCE);
  if (meal) consume(g, { h: 45, t: 10, m: 3 });
  return { pay, meal };
}

/** Tiền công một chuyến bốc vác + xếp bao hàng ở kho theo điểm mini-game (6.000₫ – 9.000₫). */
export const sackPay = (score: number): number => round1k(6000 + 3000 * clamp(score));

/** Kết quả ván cờ tướng với Ông Tư theo điểm mini-game. */
export function chessOutcome(score: number): { result: 'win' | 'draw' | 'lose'; mood: number; rel: number; line: string } {
  const s = clamp(score);
  if (s >= 0.75) return { result: 'win', mood: 10, rel: 6, line: 'Khá lắm! Nước Xe Pháo liên hoàn đó làm tui trở tay không kịp. Bữa sau tái đấu nghen!' };
  if (s >= 0.45) return { result: 'draw', mood: 7, rel: 4, line: 'Cờ ngang ngửa đó! Ván này hoà, mai bày thế khác chơi tiếp.' };
  return { result: 'lose', mood: 4, rel: 2, line: 'Nước đó con vội quá nên hở sườn bị chiếu bí. Thôi thua keo này bày keo khác!' };
}

/** Nguy cơ bị phạt lấn chiếm vỉa hè khi mở bán ở chỗ miễn phí vỉa hè. */
export function curbFineRisk(g: Game): number {
  const s = g.stall;
  if (!s.open || s.where !== 'placed' || !s.spot) return 0;
  const sp = SPOTS.find((p) => p.id === s.spot);
  if (!sp?.curbRisk) return 0;
  return clamp(sp.curbRisk * (s.tier <= 1 ? 1 : 1.25), 0, 0.85);
}
/** Mức tiền phạt hành chính khi bị lập biên bản lấn chiếm vỉa hè. */
export const curbFineAmount = (g: Game): number => (g.stall.tier <= 1 ? 35000 : 60000);

