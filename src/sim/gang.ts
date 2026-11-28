// LUẬT BĂNG ĐẢNG — phần thuần (không Three.js, không DOM) nên `tests/gang.test.ts` kiểm được.
//
// Lượt 71. Bốn thứ người chơi yêu cầu, mỗi thứ nằm ở đây một hàm:
//   • **thăng chức**   → `respectTo*`, `rankOf`, `promoteWhy`, `promote()`
//   • **hàng cấm**     → `buyContraband()`, `sellContraband()`, `carryOk()`, `bustFine()`
//   • **hình phạt nặng** → `bustFine()`, `bustJail()`, `bust()` (dùng chung với `sim/police.ts`)
//   • **việc làm băng** → `jobLeft()`, `doJob()`
//
// Nguyên tắc số học — dễ đọc, và quan trọng là **cái giá luôn lớn hơn cái lời**: bị bắt một chuyến là mất
// nhiều hơn tiền lời của ba chuyến, cộng giờ tù và uy tín ngoài phố. Test canh đúng điều đó.
import { Game, addStack, hourOf } from './state';
import { clamp, rnd } from '../core/util';
import * as G from '../data/gang';
import * as R from './rules';
import { SPOTS } from '../world/layout';

/** Người chơi đã vào băng chưa. */
export const inGang = (g: Game) => (g.gang?.id ? true : false);
/** Phe của người chơi (null = chưa theo băng nào). */
export const gangOf = (g: Game): G.GangId | null => (g.gang?.id as G.GangId) ?? null;
/**
 * Bậc hiện tại trong băng. Bậc là **giá trị đã được đại ca công nhận** (lưu trong `gang.tier`), không tự nhảy
 * theo uy tín — uy tín là điều kiện, còn “thăng chức” phải do người chơi tới xin, đúng ý “việc làm + thăng chức”.
 */
export const rankOf = (g: Game) => G.GANG_RANKS[Math.max(0, Math.min(G.GANG_RANKS.length - 1, (g.gang?.tier ?? 1) - 1))];
/** Hàng cấm đang giữ (mã → số lượng), luôn trả về đối tượng mới để không sửa trộm bản lưu. */
export const stockOf = (g: Game): Record<string, number> => ({ ...(g.gang?.stock ?? {}) });
/** Tổng tiền hàng cấm đang giữ, tính theo giá băng thu lại. */
export function stockValue(g: Game): number {
  let v = 0;
  for (const [id, n] of Object.entries(g.gang?.stock ?? {})) { const c = G.CONTRABAND[id]; if (c) v += c.sell * n; }
  return v;
}

/** Vào băng: trả tiền lễ, uy tín bắt đầu từ 0, bậc 1. */
export function joinGang(g: Game, id: G.GangId): 'ok' | 'poor' | 'already' {
  if (inGang(g)) return 'already';
  const def = G.GANGS[id];
  if (g.cash < def.fee) return 'poor';
  R.spend(g, def.fee, 'other');
  g.gang = { id, respect: 0, since: g.day, jobsToday: 0, jobDay: g.day, stock: {}, paid: 0, turfDay: -1 };
  return 'ok';
}
/** Ra băng (rửa tay): mất hết uy tín trong băng, hàng cấm vẫn còn nhưng không ai mua nữa. */
export function leaveGang(g: Game) {
  if (!g.gang) return;
  g.gang = null;
  g.flags.gangQuit = (g.flags.gangQuit ?? 0) + 1;
}

/** Cộng uy tín trong băng (không vượt trần của bậc đại ca). */
export function addRespect(g: Game, n: number) {
  if (!g.gang) return;
  const top = G.GANG_RANKS[G.GANG_RANKS.length - 1].respect;
  g.gang.respect = clamp((g.gang.respect ?? 0) + n, 0, top);
}
/** Bậc kế tiếp + còn thiếu bao nhiêu uy tín (null = đã đại ca). */
export function promoteNeed(g: Game): { next: G.GangRank; need: number } | null {
  if (!g.gang) return null;
  const cur = rankOf(g);
  const nx = G.GANG_RANKS[cur.tier] ?? null;
  return nx ? { next: nx, need: Math.max(0, nx.respect - (g.gang.respect ?? 0)) } : null;
}
/**
 * Được thăng chức chưa. Trả **lý do** khi chưa được (để câu thoại nói đúng thứ còn thiếu, không nói chung
 * chung) — và cần thêm điều kiện thật, không chỉ uy tín: phải làm ít nhất vài việc cho băng.
 */
export function promoteWhy(g: Game): { ok: true; next: G.GangRank } | { ok: false; why: string } {
  if (!g.gang) return { ok: false, why: 'Mày chưa theo băng nào.' };
  const p = promoteNeed(g);
  if (!p) return { ok: false, why: 'Mày đã là đại ca rồi, còn lên đâu nữa.' };
  const done = g.gang.paid ?? 0;
  if (p.need > 0) return { ok: false, why: `Còn thiếu ${p.need} uy tín nữa mới lên ${p.next.name.toLowerCase()}.` };
  if (done < p.next.tier - 1) return { ok: false, why: `Uy tín đủ rồi, mà mày mới làm ${done} chuyến cho băng — làm thêm ${p.next.tier - 1 - done} chuyến nữa tao mới tin.` };
  return { ok: true, next: p.next };
}
/** Thăng chức (đã kiểm bằng `promoteWhy` trước khi gọi). */
export function promote(g: Game): G.GangRank | null {
  const w = promoteWhy(g);
  if (!w.ok || !g.gang) return null;
  g.gang.tier = w.next.tier;
  g.gang.promotedDay = g.day;
  return w.next;
}

/** Còn bao nhiêu ca việc làm hôm nay (mọi loại việc cộng lại, theo `perDay` của từng việc thì kiểm riêng). */
export function jobLeft(g: Game, id: string): number {
  const j = G.GANG_JOBS[id];
  if (!j || !g.gang) return 0;
  if (g.gang.jobDay !== g.day) return j.perDay;
  return Math.max(0, j.perDay - (g.gang.jobsToday ?? 0));
}
/** Việc này có làm được bây giờ không — trả lý do khi không, để câu thoại nói đúng. */
export function jobWhy(g: Game, id: string): { ok: boolean; why: string } {
  const j = G.GANG_JOBS[id];
  if (!j) return { ok: false, why: 'Việc gì lạ vậy?' };
  if (!g.gang) return { ok: false, why: 'Mày chưa theo băng.' };
  const tier = rankOf(g).tier;
  if (tier < j.minTier) return { ok: false, why: `Việc này của bậc ${j.minTier} trở lên, mày mới bậc ${tier}.` };
  if (jobLeft(g, id) <= 0) return { ok: false, why: 'Hôm nay làm đủ ca này rồi, mai quay lại.' };
  if (g.st.energy < 25) return { ok: false, why: 'Hết sức rồi, ăn gì ngủ chút đã.' };
  // Việc khuya (bốc hàng) chỉ làm lúc trời còn sớm, đúng như đời thật.
  const h = hourOf(g);
  if (id === 'boc' && (h < 3 || h > 9)) return { ok: false, why: 'Bốc hàng chỉ làm lúc 3–9 giờ sáng, xe về sớm rồi đi.' };
  if (id === 'thu' && (h < 9 || h > 19)) return { ok: false, why: 'Đi thu nợ ban ngày thôi, tối người ta đóng cửa hết.' };
  return { ok: true, why: '' };
}
/**
 * Làm một ca. Trả tiền công **đã chia phần cho băng** (`rank.cut`), cộng uy tín, cộng mức bị để ý.
 * Hàng cấm thưởng (việc `giu`) vào thẳng `gang.stock`, không vào túi đồ — băng giữ hộ.
 */
export function doJob(g: Game, id: string): { pay: number; respect: number; heat: number; got?: { id: string; n: number } } | null {
  const chk = jobWhy(g, id);
  if (!chk.ok || !g.gang) return null;
  const j = G.GANG_JOBS[id], rank = rankOf(g);
  if (g.gang.jobDay !== g.day) { g.gang.jobDay = g.day; g.gang.jobsToday = 0; }
  g.gang.jobsToday = (g.gang.jobsToday ?? 0) + 1;
  g.gang.paid = (g.gang.paid ?? 0) + 1;
  // Đàn em (bậc 5+) ăn thêm một phần công, đổi lại đi theo thì bị để ý gấp rưỡi — hai lưỡi của chính nó.
  const pay = Math.round((j.pay * (1 - rank.cut) * (1 - crewCut(g))) / 1000) * 1000;
  R.earn(g, pay, 'side');
  addRespect(g, j.respect);
  g.wanted = clamp(g.wanted + j.heat * crewHeatMul(g), 0, 100);
  g.st.energy = clamp(g.st.energy - 8, 0, R.STAT_MAX);
  let got: { id: string; n: number } | undefined;
  if (j.reward) {
    const s = (g.gang.stock ??= {});
    s[j.reward.id] = (s[j.reward.id] ?? 0) + j.reward.n;
    got = { ...j.reward };
  }
  return { pay, respect: j.respect, heat: j.heat, got };
}

/** Cấm mang hàng cấm trong người — băng giữ hộ, không ai chở hàng cấm trong túi đi dạo. */
export const carryOk = (g: Game, id: string) => !!g.gang && rankOf(g).tier >= (G.CONTRABAND[id]?.minTier ?? 99);
/** Mua hàng cấm của băng: trừ tiền, cộng vào kho băng. */
export function buyContraband(g: Game, id: string, n = 1): 'ok' | 'poor' | 'locked' | 'nog' {
  const c = G.CONTRABAND[id];
  if (!c || !g.gang) return 'nog';
  if (rankOf(g).tier < c.minTier) return 'locked';
  const cost = c.buy * n;
  if (g.cash < cost) return 'poor';
  R.spend(g, cost, 'other');
  const s = (g.gang.stock ??= {});
  s[id] = (s[id] ?? 0) + n;
  return 'ok';
}
/** Bán lại hàng cấm cho băng (băng ăn phần, nên giá thấp hơn bán lẻ). */
export function sellContraband(g: Game, id: string, n = 1): { ok: boolean; got: number } {
  const c = G.CONTRABAND[id];
  const have = g.gang?.stock?.[id] ?? 0;
  if (!c || !g.gang || have <= 0) return { ok: false, got: 0 };
  const k = Math.min(have, Math.max(1, Math.floor(n)));
  g.gang.stock![id] = have - k;
  if (g.gang.stock![id] <= 0) delete g.gang.stock![id];
  const got = c.sell * k;
  R.earn(g, got, 'side');
  addRespect(g, 2 * k);
  return { ok: true, got };
}

/** Tiền phạt khi bị bắt vì hàng cấm (chỉ tính hàng đang giữ trong kho băng). */
export const bustFine = (g: Game) => G.contrabandFine(g.gang?.stock ?? {});
/** Giờ tạm giữ cộng thêm vì hàng cấm. */
export const bustJail = (g: Game) => G.contrabandJail(g.gang?.stock ?? {});
/**
 * Bị bắt vì hàng cấm: mất hết hàng, mất tiền phạt (tới mức còn lại), cộng mức bị để ý, tụt uy tín trong băng
 * và **tụt uy tín ngoài phố**. Trả số liệu để câu thoại nói đúng chuyện vừa xảy ra.
 */
export function bust(g: Game): { fine: number; paid: number; jail: number; respect: number } {
  // Đàn em gánh bớt: có đứa đi cùng thì công an bắt cả nhóm, phần mình nhẹ hơn — nhưng không bao giờ bằng 0.
  const fine = Math.round((bustFine(g) * (1 - crewCover(g))) / 1000) * 1000, jail = bustJail(g);
  const paid = Math.min(g.cash, fine);
  if (paid > 0) { g.cash -= paid; g.led.other += paid; }
  // Bị bắt thì đàn em bỏ đi hết (không ai ở lại với đứa đang bị giữ).
  if (g.gang?.crew) g.gang.crew = 0;
  const lostRespect = 30;
  g.gang && (g.gang.stock = {});
  g.gang && (g.gang.respect = Math.max(0, (g.gang.respect ?? 0) - lostRespect));
  g.wanted = clamp(g.wanted + 20, 0, 100);
  g.rep = clamp(g.rep - 4, 0, 100);
  return { fine, paid, jail, respect: lostRespect };
}

/** Tiền bảo kê mỗi ngày ở bậc đại ca (đứng tên một góc chợ). */
export function turfPay(g: Game): number {
  if (!g.gang || rankOf(g).tier < 6) return 0;
  if (g.gang.turfDay === g.day) return 0;
  return 60000 + Math.round((g.gang.respect ?? 0) / 20) * 1000;
}
/** Nhận tiền bảo kê hôm nay (mỗi ngày một lần). */
export function claimTurf(g: Game): number {
  const pay = turfPay(g);
  if (pay <= 0 || !g.gang) return 0;
  g.gang.turfDay = g.day;
  R.earn(g, pay, 'side');
  g.wanted = clamp(g.wanted + 4, 0, 100);
  return pay;
}

/** Tên băng đang theo (chuỗi rỗng nếu chưa theo) — dùng trong câu thông báo của `rules.ts`. */
export const gangName = (g: Game): string => (g.gang ? G.GANGS[g.gang.id as G.GangId].name : '');

/** Câu mô tả tình trạng băng, dùng cho hội thoại và app điện thoại: “Bậc 3/6 · Giữ hàng · 128 uy tín”. */
export const gangLine = (g: Game): string => {
  if (!g.gang) return 'Chưa theo băng nào.';
  const def = G.GANGS[g.gang.id as G.GangId], r = rankOf(g);
  return `${def.name} · bậc ${r.tier}/6 ${r.name} · ${Math.round(g.gang.respect ?? 0)} uy tín`;
};

// ═════════════════════ LƯỠI THỨ HAI ═════════════════════
// Từ đây trở xuống là **cái giá** của việc theo băng. Người chơi dặn “đảm bảo băng đảng là con dao hai lưỡi”,
// nên mấy hàm này cố ý **trừ** chứ không cộng: quán vắng khách, phí chỗ đội lên, công an để ý, tinh thần tụt,
// và bốn cách rời băng — cách nào cũng có giá.

/** Mặt trái theo bậc đang đứng (chưa theo băng ⇒ toàn số 0). */
export const downside = (g: Game): G.GangDownside =>
  g.gang ? G.downsideAt(rankOf(g).tier) : { tier: 0, fear: 0, rent: 0, heat: 0, note: '' };

/**
 * Tỷ lệ khách bị mất vì người ta sợ dính tới băng (0…0,5).
 * Cộng thêm phần “bị để mắt” sau khi rời băng (`flags.gangWatch` — băng cũ còn dòm mình tới ngày đó).
 */
export function fearRate(g: Game): number {
  let f = downside(g).fear;
  // Lỗi đã dính: viết `(flags.gangWatch ?? 0) >= g.day` thì ngày 1 của ván mới (day 0, chưa có cờ) cũng thành
  // “đang bị băng để mắt”, cộng oan 8%. Phải đòi mốc thật > 0.
  const watch = g.flags.gangWatch ?? 0;
  if (watch > 0 && watch >= g.day) f += 0.08;
  if ((g.flags.gangRatted ?? 0) > 0) f += 0.06;      // từng đi khai băng: cả xóm nhớ mặt
  f += threatFear(g);                                 // đã đe doạ người trong xóm: càng nhiều càng vắng khách
  return clamp(f, 0, 0.5);
}
/** Hệ số khách tới quán sau khi trừ phần sợ băng (1 = không mất ai). */
export const fearMul = (g: Game) => 1 - fearRate(g);

/**
 * Phí chỗ đội thêm vì băng “đỡ đầu” — cộng vào phí chỗ mỗi ngày.
 * Tự tính phí gốc ở đây thay vì gọi `rules.stallRent`: `stallRent` **cũng** gọi hàm này để cộng phần băng, nên
 * gọi ngược lại là đệ quy vô hạn (đã dính một lần: `RangeError: Maximum call stack size exceeded` trong
 * `tests/stall.test.ts`).
 */
export function gangRentExtra(g: Game): number {
  const s = g.stall;
  if (!g.gang || s.tier < 3 || s.where !== 'placed' || !s.spot) return 0;
  const base = SPOTS.find((p) => p.id === s.spot)?.fee ?? 0;
  if (base <= 0) return 0;
  return Math.round((base * downside(g).rent) / 1000) * 1000;
}
/** Mức bị để ý cộng thêm mỗi ngày vì đang ở trong băng (bậc càng cao càng nhiều). */
export const gangHeatPerDay = (g: Game): number => downside(g).heat;

/** Gọi đầu ngày: cộng mức bị để ý vì băng. Trả số vừa cộng (0 = không có gì). */
export function dailyGangHeat(g: Game): number {
  const h = gangHeatPerDay(g);
  if (h <= 0) return 0;
  g.wanted = clamp(g.wanted + h, 0, 100);
  return h;
}

/**
 * Chơi hết một cảnh “đi làm việc cho băng”. `go = true` là làm tới cùng: ăn thêm tiền, nhưng mất tinh thần,
 * sức khoẻ, bị để ý và có khi mất uy tín ngoài phố. `go = false` là rút lui: không mất gì ngoài một ít uy tín
 * trong băng (băng coi là nhát).
 */
export function resolveCut(g: Game, jobId: string, go: boolean): { bonus: number; respect: number; heat: number; mood: number; health: number; rep: number } | null {
  const c = G.GANG_CUTS[jobId];
  if (!c || !g.gang) return null;
  if (!go) {
    addRespect(g, -4);
    return { bonus: 0, respect: -4, heat: 0, mood: 0, health: 0, rep: 0 };
  }
  R.earn(g, c.bonus, 'side');
  g.st.mood = clamp(g.st.mood + c.cost.mood, 0, R.STAT_MAX);
  g.st.health = clamp(g.st.health + c.cost.health, 0, R.STAT_MAX);
  g.wanted = clamp(g.wanted + c.cost.heat, 0, 100);
  g.rep = clamp(g.rep + c.cost.rep, 0, 100);
  addRespect(g, 6);
  g.flags.gangHard = (g.flags.gangHard ?? 0) + 1;
  return { bonus: c.bonus, respect: 6, heat: c.cost.heat, mood: c.cost.mood, health: c.cost.health, rep: c.cost.rep };
}

/** Tình huống xấu hôm nay có tới không: 60% mỗi ngày, chỉ khi đã ở trong băng ≥ 3 ngày, không hai ngày liền. */
export function troubleToday(g: Game): G.GangTrouble | null {
  if (!g.gang) return null;
  if (g.day - (g.gang.since ?? 0) < 3) return null;
  if ((g.flags.gangTroubleDay ?? -99) === g.day - 1) return null;
  if ((g.flags.gangTroubleDay ?? -99) === g.day) return null;
  const pool = G.GANG_TROUBLE.filter((t) => t.minTier <= rankOf(g).tier);
  if (!pool.length) return null;
  return pool[(g.day * 7 + (g.gang.respect | 0)) % pool.length];
}
/** Bị đòi tiền nhưng không có tiền: băng tự trừ uy tín (đau hơn mất tiền với người chơi nghèo). */
export function troubleUnpaid(g: Game, t: G.GangTrouble) { addRespect(g, -(t.respect || 30)); }

/** Bốn cách rời băng — cách nào cũng mất thứ gì. Lọc theo bậc đang đứng và số tiền đang có. */
export const leaveWays = (g: Game): G.GangLeave[] =>
  !g.gang ? [] : G.GANG_LEAVES.filter((l) => l.minTier <= rankOf(g).tier);

/**
 * Rời băng theo một cách. Trả số liệu thật để câu thoại nói đúng — không có đường nào “sạch”.
 * `tra_no` cần đủ tiền; thiếu thì trả `null` để hội thoại nói “còn thiếu bao nhiêu”.
 */
export function leaveBy(g: Game, id: string): { cash: number; rep: number; mood: number; watch: number } | null {
  const w = G.GANG_LEAVES.find((l) => l.id === id);
  if (!w || !g.gang) return null;
  if (g.cash < w.cost) return null;
  if (w.cost > 0) R.spend(g, w.cost, 'other');
  g.rep = clamp(g.rep + w.rep, 0, 100);
  g.st.mood = clamp(g.st.mood + w.mood, 0, R.STAT_MAX);
  if (w.watchDays > 0) g.flags.gangWatch = g.day + w.watchDays;
  if (id === 'pha_dao') { g.flags.gangRatted = (g.flags.gangRatted ?? 0) + 1; g.wanted = clamp(g.wanted + 10, 0, 100); }
  if (id === 'bo_di') g.flags.gangMoved = (g.flags.gangMoved ?? 0) + 1;
  leaveGang(g);
  return { cash: w.cost, rep: w.rep, mood: w.mood, watch: w.watchDays };
}

/** Tóm tắt “cái giá” đang phải chịu — dùng cho bảng chi tiết và app điện thoại. */
export function downsideLine(g: Game): string {
  if (!g.gang) return '';
  const d = downside(g), f = Math.round(fearRate(g) * 100), r = gangRentExtra(g);
  return `Khách bỏ đi vì sợ băng: ${f}% · phí chỗ đội thêm ${r > 0 ? `${Math.round(r / 1000)}.000₫/ngày` : 'chưa có'} · bị để ý +${d.heat}/ngày`;
}

// ───────────────────────── ĐÀN EM ĐI THEO (bậc 5–6) ─────────────────────────
/**
 * Bậc 5 mở quyền **dắt đàn em**: đi giao hàng có đứa đi kèm. Đàn em không phải “cộng thêm tiền miễn phí” —
 * nó làm **mức bị để ý tăng gấp rưỡi** (ba thằng đi thành nhóm thì ai cũng nhìn) và **ăn chia thêm một phần**;
 * đổi lại, bị bắt thì đàn em gánh bớt một phần tiền phạt. Đây là con dao hai lưỡi thu nhỏ của cả hệ thống.
 */
export const maxCrew = (g: Game): number => {
  const t = g.gang ? rankOf(g).tier : 0;
  return t >= 6 ? 3 : t >= 5 ? 2 : 0;
};
/** Đang dắt mấy đứa (0 = đi một mình). */
export const crewOf = (g: Game): number => (g.gang?.crew ?? 0);
/** Dắt thêm/bớt đàn em (không vượt `maxCrew`). Trả số đang dắt sau khi đổi. */
export function setCrew(g: Game, n: number): number {
  if (!g.gang) return 0;
  g.gang.crew = Math.max(0, Math.min(maxCrew(g), Math.floor(n)));
  return g.gang.crew;
}
/** Hệ số mức bị để ý khi làm việc có đàn em đi kèm (1 = đi một mình). */
export const crewHeatMul = (g: Game) => 1 + crewOf(g) * 0.25;
/** Phần tiền phạt được đàn em gánh khi bị bắt (0,35 mỗi đứa, tối đa 0,7 — có đứa chạy trước). */
export const crewCover = (g: Game) => clamp(crewOf(g) * 0.35, 0, 0.7);
/** Tiền công bị chia thêm cho đàn em (mỗi đứa 12% phần của mình). */
export const crewCut = (g: Game) => clamp(crewOf(g) * 0.12, 0, 0.3);

// ───────────────────────── ĐỤNG ĐỘ HAI PHE (lượt 72) ─────────────────────────
/**
 * Đụng độ với băng đối thủ: người chơi đi vào địa bàn bên kia thì bị chặn, và phải chọn — nói chuyện, quay
 * đầu, hay đứng lại. Mọi lựa chọn đều có giá: **nói chuyện** thì có thể qua được nhưng bị nhớ mặt (heat +
 * quan hệ xấu hơn); **quay đầu** thì mất uy tín trong băng mình (băng coi là nhát); **đứng lại** thì dễ thành
 * ẩu đả — mất sức khoẻ, bị để ý, và băng đối thủ ghi tên.
 *
 * Không có cửa nào “đi qua mà không ai thấy”: đây là cái giá của việc có phe.
 */
export interface Clash {
  /** Băng đối thủ đang chặn đường. */
  rival: G.GangId;
  /** Câu chặn đường. */
  line: string;
  /** Đi qua được hay không (tính sẵn để hội thoại nói đúng). */
  pass: boolean;
}
/** Quan hệ với băng đối thủ (−100…0): càng thấp thì càng khó đi qua địa bàn bên kia. */
export const rivalRel = (g: Game): number => {
  if (!g.gang) return 0;
  const key = 'rel_' + G.GANGS[g.gang.id as G.GangId].rival;
  return Math.min(0, g.flags[key] ?? 0);
};
/**
 * Đi vào địa bàn băng đối thủ: có bị chặn không. Chỉ chặn khi **đang ở trong băng** (người ngoài thì hai bên
 * không quan tâm), và càng lên bậc thì càng dễ bị nhận ra.
 */
export function clashAt(g: Game, district: string): Clash | null {
  if (!g.gang) return null;
  const mine = G.GANGS[g.gang.id as G.GangId], rival = G.GANGS[mine.rival];
  if (district !== rival.turf) return null;
  // Chỉ chặn khi đủ “mặt mũi”: bậc 3 trở lên, hoặc đang bị băng bên kia để mắt.
  // Biết mặt mới chặn: bậc 3 trở lên (đã có tên trong băng), hoặc đã có hiềm khích với bên kia từ trước.
  // (Bản đầu tôi viết thêm một điều kiện ngày tháng sai dấu nên ngày 1 ván mới đã bị chặn oan — test bắt được.)
  const tier = rankOf(g).tier;
  if (tier < 3 && rivalRel(g) > -20) return null;
  if ((g.flags.gangClashDay ?? -99) === g.day) return null;   // mỗi ngày tối đa một lần
  const pass = tier >= 5 && rnd.chance(0.5);
  return { rival: rival.id, pass, line: pass
    ? `Đàn em ${rival.name} nhận ra mày rồi né ra: “Đi đi, đại ca dặn đừng đụng.” — nhưng họ ghi tên mày vào sổ.`
    : `Hai đứa ${rival.name} chặn trước mặt: “Bên kia qua đây làm gì? Địa bàn này không phải của mày.”` };
}
/** Đã xử lý đụng độ hôm nay (để không lặp trong cùng một ngày). */
export const markClash = (g: Game) => { g.flags.gangClashDay = g.day; };

/** Kết quả ba cách xử lý đụng độ. Trả số liệu để câu thoại nói đúng chuyện vừa xảy ra. */
export function resolveClash(g: Game, how: 'noi' | 'quay' | 'dung'): { health: number; heat: number; respect: number; rep: number; rel: number; line: string } | null {
  if (!g.gang) return null;
  const mine = G.GANGS[g.gang.id as G.GangId], key = 'rel_' + mine.rival;
  markClash(g);
  if (how === 'noi') {
    // Nói chuyện: tuỳ uy tín. Bậc cao thì bên kia nể, bậc thấp thì bị khinh.
    const ok = rankOf(g).tier >= 4;
    g.flags[key] = Math.min(0, (g.flags[key] ?? 0) + (ok ? 4 : -8));
    g.wanted = clamp(g.wanted + 3, 0, 100);
    return { health: 0, heat: 3, respect: ok ? 4 : -6, rep: 0, rel: ok ? 4 : -8,
      line: ok ? 'Nói chuyện phải phép, bên kia gật đầu cho qua — nhưng từ nay họ biết mặt mày.' : 'Nói chuyện không lại, bên kia cười khinh rồi cho qua. Băng mình nghe chuyện, trừ uy tín.' };
  }
  if (how === 'quay') {
    g.flags[key] = Math.min(0, (g.flags[key] ?? 0) + 6);
    addRespect(g, -10);
    g.st.mood = clamp(g.st.mood - 5, 0, R.STAT_MAX);
    return { health: 0, heat: 0, respect: -10, rep: 0, rel: 6,
      line: 'Quay đầu đi đường khác. Bên kia không đụng, mà băng mình nghe chuyện là mất mặt — trừ 10 uy tín.' };
  }
  // Đứng lại: ẩu đả. Không ai chết, nhưng mất sức khoẻ, bị để ý, và cả hai băng đều ghi tên.
  const hurt = 8 + rankOf(g).tier * 2;
  g.st.health = clamp(g.st.health - hurt, 1, R.STAT_MAX);
  g.wanted = clamp(g.wanted + 12, 0, 100);
  g.rep = clamp(g.rep - 3, 0, 100);
  g.flags[key] = Math.min(0, (g.flags[key] ?? 0) - 12);
  addRespect(g, 8);
  return { health: -hurt, heat: 12, respect: 8, rep: -3, rel: -12,
    line: `Đứng lại, hai bên xô nhau giữa đường. Mày bị đấm một cái vào vai, bên kia cũng rách áo. Công an tới thì cả hai bỏ chạy — băng mình ghi công, mà xóm thì thấy hết.` };
}

// ───────────────────────── ĐE DOẠ NGƯỜI LẠ (bậc 4+) ─────────────────────────
/**
 * Đe doạ người lạ: **ra tiền ngay**, không tốn sức, nhưng là chỗ lỗ nặng nhất của hệ thống băng.
 * - Mỗi lần: +heat theo loại, −uy tín ngoài phố, +1 lần đe (`g.gang.threats`).
 * - Xác suất `report`: người bị đe đi báo công an ⇒ phạt **theo mức bị để ý** (nặng hơn án hàng cấm), tù 6–12 giờ,
 *   mất toàn bộ tiền vừa lấy (trả lại) và tụt uy tín phố thêm.
 * - Đe nhiều thì `fearRate` càng tăng (khách sợ), và công an để ý sẵn ⇒ lần sau càng dễ bị bắt.
 */
export const canThreat = (g: Game): boolean => !!g.gang && rankOf(g).tier >= 4;
/** Đe doạ người lạ. `rnd` lấy ngẫu nhiên trong khoảng; trả số liệu thật để câu thoại nói đúng. */
export function threaten(g: Game, id: string): { cash: number; loot: string | null; heat: number; rep: number; reported: boolean; fine: number; jail: number } | null {
  const k = G.THREAT_KINDS.find((x) => x.id === id);
  if (!k || !canThreat(g) || !g.gang) return null;
  const r = Math.random();
  const cash = Math.round((k.cash[0] + (k.cash[1] - k.cash[0]) * r) / 1000) * 1000;
  R.earn(g, cash, 'side');
  const loot = k.loot && Math.random() < 0.6 ? k.loot : null;
  if (loot) g.junk[loot] = (g.junk[loot] ?? 0) + 1;
  g.wanted = clamp(g.wanted + k.heat, 0, 100);
  g.rep = clamp(g.rep + k.rep, 0, 100);
  g.st.mood = clamp(g.st.mood - 4, 0, R.STAT_MAX);
  const times = (g.gang.threats = (g.gang.threats ?? 0) + 1);
  addRespect(g, 3);
  // Bị báo công an: xác suất tăng theo số lần đã đe (người trong xóm truyền tai nhau).
  const reported = Math.random() < Math.min(0.85, k.report + times * 0.03);
  if (!reported) return { cash, loot, heat: k.heat, rep: k.rep, reported: false, fine: 0, jail: 0 };
  const fine = G.threatFine(g.wanted, times);
  const paid = Math.min(g.cash, fine);
  if (paid > 0) { g.cash -= paid; g.led.other += paid; }
  g.rep = clamp(g.rep - 6, 0, 100);
  addRespect(g, -20);
  return { cash, loot, heat: k.heat, rep: k.rep - 6, reported: true, fine, jail: G.threatJail(times) };
}
/** Số lần đã đe doạ (dùng cho câu thoại và app điện thoại). */
export const threatsOf = (g: Game): number => g.gang?.threats ?? 0;
/** Phần khách bỏ đi thêm vì đã đe doạ người trong xóm (tối đa +12%). */
export const threatFear = (g: Game): number => clamp(threatsOf(g) * 0.015, 0, 0.12);

// ───────────────────────── SỰ KIỆN ĐÁNH NHAU (lượt 73) ─────────────────────────
// Bảng bốn kiểu ẩu đả nằm ở `data/gang.ts` (`FIGHTS`) để test đọc được; ở đây là luật: khi nào xảy ra, đánh
// thắng bao nhiêu phần, và ba lựa chọn có giá thế nào.
export type FightKind = G.FightKind;
const FIGHTS = G.FIGHTS;

/** Cơ hội thắng ván đánh (0,12…0,95): bậc, máu, đàn em và uy tín phố đều tính. */
export const fightChance = (g: Game, k: FightKind): number => {
  const tier = g.gang ? rankOf(g).tier : 0;
  const base = 0.34 + tier * 0.055 + (g.st.health - 50) / 420 + crewOf(g) * 0.05 + (g.rep - 40) / 900;
  return clamp(base - (k.foes - 1) * 0.07, 0.12, 0.95);
};

/** Có nợ quá hạn thật (không tính sổ nợ của quán) — dùng cho ván “giang hồ tới đòi nợ”. */
export const hasLateDebt = (g: Game): boolean => g.debts.some((d) => d.lender !== 'tab' && g.day > d.due);

/**
 * Có nên mở ván đánh nhau không — mỗi ngày tối đa một ván.
 *
 * Bốn kiểu, bốn điều kiện khác nhau (không kiểu nào là “đánh nhau vô cớ”):
 * - `up_sot`: đã trong băng từ bậc 3, quan hệ với băng đối thủ ≤ −20 (đi vào địa bàn bên kia là bị úp sọt);
 * - `chap_nhan`: đã đe doạ người ta từ 3 lần (người nhà kéo tới);
 * - `doi_no`: có nợ quá hạn, bất kể có theo băng hay không (giang hồ đòi nợ là chuyện của chủ nợ);
 * - `bao_ke`: quán đang bán tốt mà chưa theo băng nào (không có băng đỡ lưng thì ai cũng muốn ăn phần).
 *
 * Cơ hội mở mỗi lần gọi rất thấp (8–12 %) và `acts` chỉ hỏi 4 giây một lần, nên một ngày chơi bình thường
 * gần như không gặp; gặp hay không là do tình trạng thật của ván, không phải tung xúc xắc cho vui.
 */
export function fightAt(g: Game): FightKind | null {
  if ((g.flags.gangFightDay ?? -99) === g.day) return null;
  // Bị úp sọt: đang ở địa bàn đối thủ, quan hệ đã xấu hẳn, bậc 3 trở lên.
  if (g.gang && rankOf(g).tier >= 3 && rivalRel(g) <= -20 && g.flags.sweepNow !== 1 && rnd.chance(0.3)) return FIGHTS[0];
  // Người nhà tới hỏi chuyện: đã đe doạ từ 3 lần trở lên.
  if (g.gang && threatsOf(g) >= 3 && rnd.chance(0.22)) return FIGHTS[2];
  // Giang hồ tới đòi nợ: có nợ quá hạn (không tính sổ ghi nợ của quán).
  if (hasLateDebt(g) && rnd.chance(0.12)) return FIGHTS[1];
  // Băng khác tới phá quán: đang bán tốt, có quầy đặt ở chỗ bán, và KHÔNG thuộc băng nào (không có ai đỡ lưng).
  if (!g.gang && g.stall.where === 'placed' && (g.led.sold >= 8 || g.tot.served >= 20) && rnd.chance(0.1)) return FIGHTS[3];
  return null;
}
export const markFight = (g: Game) => { g.flags.gangFightDay = g.day; };

/** Kết quả một ván đánh. `win` do cảnh 3D quyết định (người chơi đấm trúng nhiều hơn). */
export function resolveFight(g: Game, k: FightKind, how: 'danh' | 'chay' | 'dan_xep', win = false): { hp: number; rep: number; respect: number; cash: number; heat: number; mood: number; line: string } {
  markFight(g);
  if (how === 'chay') {
    addRespect(g, -8);
    g.st.mood = clamp(g.st.mood - 4, 0, R.STAT_MAX);
    g.wanted = clamp(g.wanted + 4, 0, 100);
    return { hp: -3, rep: 0, respect: -8, cash: 0, heat: 4, mood: -4,
      line: 'Bỏ chạy. Không mất máu, nhưng cả xóm thấy, và băng mình coi là nhát — trừ 8 uy tín.' };
  }
  if (how === 'dan_xep') {
    const paid = Math.min(g.cash, k.settle);
    if (paid > 0) { g.cash -= paid; g.led.other += paid; }
    addRespect(g, -4);
    g.wanted = clamp(g.wanted + 2, 0, 100);
    return { hp: 0, rep: 0, respect: -4, cash: -paid, heat: 2, mood: -2,
      line: `Dàn xếp: đưa ${Math.round(paid / 1000)} nghìn, họ bỏ đi. Không mất máu — mà băng mình nghe chuyện thì cho là hèn.` };
  }
  if (win) {
    const spoils = 40000 + k.foes * 35000;
    R.earn(g, spoils, 'side');
    g.wanted = clamp(g.wanted + 9, 0, 100);
    g.rep = clamp(g.rep - 2, 0, 100);
    g.st.health = clamp(g.st.health - k.hit, 1, R.STAT_MAX);
    addRespect(g, k.respectWin);
    g.st.mood = clamp(g.st.mood + 3, 0, R.STAT_MAX);
    return { hp: -k.hit, rep: -2, respect: k.respectWin, cash: spoils, heat: 9, mood: 3,
      line: `Thắng. ${k.foes} đứa bỏ chạy, để lại ${Math.round(spoils / 1000)} nghìn trong túi rơi. Công an sẽ hỏi thăm.` };
  }
  const lost = k.loseHp;
  g.st.health = clamp(g.st.health - lost, 1, R.STAT_MAX);
  g.wanted = clamp(g.wanted + 14, 0, 100);
  g.rep = clamp(g.rep - 6, 0, 100);
  addRespect(g, -2);
  g.st.mood = clamp(g.st.mood - 6, 0, R.STAT_MAX);
  return { hp: -lost, rep: -6, respect: -2, cash: 0, heat: 14, mood: -6,
    line: `Bị đánh gục. Máu −${lost}, uy tín phố −6 — may mà người đi đường can.` };
}
