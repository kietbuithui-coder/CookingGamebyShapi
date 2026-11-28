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
import { clamp } from '../core/util';
import * as G from '../data/gang';
import * as R from './rules';

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
  const pay = Math.round((j.pay * (1 - rank.cut)) / 1000) * 1000;
  R.earn(g, pay, 'side');
  addRespect(g, j.respect);
  g.wanted = clamp(g.wanted + j.heat, 0, 100);
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
  const fine = bustFine(g), jail = bustJail(g);
  const paid = Math.min(g.cash, fine);
  if (paid > 0) { g.cash -= paid; g.led.other += paid; }
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

/** Câu mô tả tình trạng băng, dùng cho hội thoại và app điện thoại: “Bậc 3/6 · Giữ hàng · 128 uy tín”. */
export const gangLine = (g: Game): string => {
  if (!g.gang) return 'Chưa theo băng nào.';
  const def = G.GANGS[g.gang.id as G.GangId], r = rankOf(g);
  return `${def.name} · bậc ${r.tier}/6 ${r.name} · ${Math.round(g.gang.respect ?? 0)} uy tín`;
};
