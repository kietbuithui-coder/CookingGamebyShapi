// LUẬT CHƠI — kinh tế, giá vốn, nhu cầu khách, đánh giá, chỉ số sinh tồn, thời tiết, sự kiện, nợ nần.
// Toàn bộ là logic thuần, không đụng tới đồ hoạ hay DOM (xem tests/ để thấy cách kiểm thử).
import { clamp, RNG, rnd, round1k, round500, hashStr, money, lerp } from '../core/util';
import { bus, toast } from '../core/bus';
import { INGS } from '../data/ingredients';
import { SHOPS, ShopDef } from '../data/shops';
import { RECIPES, RecipeDef, fuelPerPortion, toolsFor, RECIPE_LIST } from '../data/recipes';
import { GEAR, HOUSING, LENDERS, TIERS, JUNK } from '../data/gear';
import { ARCH, ArchDef, LINES, FIXED, FIXED_ROLE } from '../data/people';
import { EVENTS, EVENT_LIST, EventDef, WEATHER, WeatherDef, WeatherId, floodZone, hourCurve } from '../data/world';
import { District, DISTRICT, SPOTS, districtAt, spotById } from '../world/layout';
import { Game, Stack, absMin, addStack, countOf, hourOf, newLedger, purge, spoil, takeFrom, weightOf, junkWeight, emptyStall, Debt, coldWeightOf } from './state';
import * as PH from './phone';

// ───────────────────────── Tiện ích chung ─────────────────────────
export const wx = (g: Game): WeatherDef => WEATHER[g.weather.now];
export const level = (g: Game) => Math.min(10, Math.floor(Math.sqrt(g.xp / 30)));
export const tier = (g: Game) => TIERS[g.stall.tier];
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
  let e = 1 + level(g) * 0.03;
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
export interface Order { rid: string; n: number; price: number; ratio: number; line: string; mood: 'ok' | 'pricey' | 'cheap'; }
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
  const slot = h < 10 ? 0 : h < 14.5 ? 1 : h < 20 ? 2 : 3;
  let best: RecipeDef | null = null, bu = -1, br = 1;
  for (const r of menu) {
    const price = g.rec[r.id].price, ratio = price / fairPrice(g, r, p, d);
    let u = (p.arch.pref[r.cat] ?? 0.8) * (0.35 + r.meal[slot]) * (1 + 0.35 * w.hot * r.hot) * (m.demand[r.cat] ?? 1) * Math.pow(1 / ratio, 1.2) * R.range(0.7, 1.3);
    if (p.likes?.includes(r.cat)) u *= 1.6;
    if (price > p.budget) u *= 0.05;
    if (u > bu) { bu = u; best = r; br = ratio; }
  }
  const r = best!, price = g.rec[r.id].price;
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
export interface Review { stars: number; rep: number; tip: number; line: string; face: number; back: boolean; }
/** Khách đánh giá sau khi nhận món. quality 0–1, wait: tỉ lệ thời gian đã chờ so với sự kiên nhẫn. */
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
  let tip = 0;
  if (stars >= 4.3 && R.chance(p.arch.tip * 2.2 + (stars - 4.3))) tip = Math.max(1000, round1k(o.price * o.n * R.range(0.06, 0.2)));
  const key = quality < 0.2 ? 'awful' : stars >= 4.5 ? 'great' : stars >= 3.7 ? 'good' : stars >= 2.8 ? 'ok' : stars >= 1.9 ? 'bad' : 'awful';
  let line = say(R.pick(LINES[key]), p.arch, fem, g);
  if (tip > 0) line += ' ' + say(R.pick(LINES.tip), p.arch, fem, g);
  else if (o.mood === 'cheap' && stars >= 3.7 && R.chance(0.5)) line = say(R.pick(LINES.cheap), p.arch, fem, g);
  const face = stars >= 4.5 ? 2 : stars >= 3.7 ? 1 : stars >= 2.8 ? 0 : stars >= 1.9 ? 3 : 4;
  return { stars, rep, tip, line, face, back: stars >= 3.9 };
}
/** Ghi nhận một lần bán: tiền, sổ sách, uy tín. */
export function settleSale(g: Game, o: Order, cost: number, rv: Review, quality: number) {
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
export function consume(g: Game, eff: { h?: number; t?: number; m?: number; hp?: number; e?: number; hy?: number }, risky = 0) {
  const s = g.st;
  s.hunger = clamp(s.hunger + (eff.h ?? 0), 0, 100); s.thirst = clamp(s.thirst + (eff.t ?? 0), 0, 100); s.mood = clamp(s.mood + (eff.m ?? 0), 0, 100);
  s.health = clamp(s.health + (eff.hp ?? 0), 0, 100); s.energy = clamp(s.energy + (eff.e ?? 0), 0, 100); s.hygiene = clamp(s.hygiene + (eff.hy ?? 0), 0, 100);
  if ((eff.hp ?? 0) >= 20 && g.flags.sick) { delete g.flags.sick; toast('Hết cảm rồi, khoẻ lại rồi!', 'good', 'heart'); }
  if (risky > 0 && rnd.chance(risky)) { s.health = clamp(s.health - 18, 0, 100); s.mood = clamp(s.mood - 8, 0, 100); toast('Ăn đồ ôi thiu — đau bụng quá!', 'bad', 'heart'); }
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
  if (g.weather.until <= absMin(g) && !activeEvents(g).some((e) => e.weather)) setWeather(g, g.weather.next, R);
}
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
