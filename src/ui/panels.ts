// CÁC BẢNG LỚN: túi đồ, quầy hàng (thực đơn – giá – sơ chế – kho), chỗ cất đồ, sổ tay (công thức, sổ sách, nợ), bản đồ, cài đặt.
import { ctx, QUALITY, saveSettings, canFullscreen, toggleFullscreen, UI_SCALE } from '../game/ctx';
import { DEV_BUILD_TAG, getDevSections } from '../game/devPoints';
import type { UI } from './ui';
import { ic, el, esc, dishIcon } from './ui';
import { INGS } from '../data/ingredients';
import { RECIPE_LIST, RECIPES, CAT_LABEL, STEP_NAME, toolsFor, RecipeDef } from '../data/recipes';
import { GEAR, GEAR_LIST, HOUSING, LENDERS, JUNK, TIERS } from '../data/gear';
import { SHOPS } from '../data/shops';
import { REGULARS, FIXED } from '../data/people';
import { WEATHER } from '../data/world';
import { Game, Stack, LedgerDay, STAT_MAX, weightOf, moveStack, junkWeight, hourOf, purge, isSpoiled } from '../sim/state';
import * as R from '../sim/rules';
/** Nhãn ca làm — dùng chung cho bảng Quầy. */
const SHIFT_LABEL: Record<string, string> = { sang: 'Ca sáng 5–14h', chieu: 'Ca chiều 14–22h', full: 'Cả ngày 5–22h' };
/** Nút bấm để chuyển sang ca kế tiếp. */
const SHIFT_NEXT: Record<string, string> = { sang: 'Sang ca chiều', chieu: 'Làm cả ngày', full: 'Về ca sáng' };
import * as PH from '../sim/phone';
import * as PUI from './phoneUI';
import { FEAT_LABEL } from '../data/phone';
import { money, qty, clamp, round1k, dist2, hhmm } from '../core/util';
import { toast, sfx, bus } from '../core/bus';
import { BX, CORR, SPOTS, LOTS, lotPoint, DISTRICT, MAP } from '../world/layout';

let tab = '';
const fresh = (s: Stack) => { const d = INGS[s.id]; if (d.shelf > 9000) return ''; const f = Math.round(s.fresh); return `<span class="tag ${f < 35 ? 'bad' : f < 60 ? 'warn' : 'good'}">${f < 10 ? 'hỏng' : 'tươi ' + f + '%'}</span>`; };
export const profitOf = (l: LedgerDay) => l.revenue + l.tips + l.side - l.cogs - l.fees - l.rent - l.gear - l.loss - l.interest - l.food - l.other;
const stallNear = (g: Game) => g.stall.tier > 0 && (g.stall.where === 'carried' || ((g.stall.where === 'placed' || g.stall.where === 'home') && dist2(g.stall.x, g.stall.z, ctx.player.x, ctx.player.z) < 8 * 8));

/** Bảng sổ thu chi trong ngày — dùng chung cho sổ tay giấy và sổ trong điện thoại. */
export function ledgerBody(g: Game): string {
  const L = g.led, kv = (k: string, v: number, neg = false) => (v ? `<div class="kv"><span>${k}</span><b class="${neg ? 'neg' : 'pos'}">${neg ? '−' : '+'}${money(v)}</b></div>` : ''), pf = profitOf(L);
  return `<div class="grid2"><div><h4>Hôm nay (ngày ${g.day + 1})</h4>${kv('Doanh thu bán hàng', L.revenue)}${kv('Tiền boa', L.tips)}${kv('Việc ngoài, xin, ve chai', L.side)}${kv('Giá vốn hàng đã bán', L.cogs, true)}${kv('Phí chỗ, tiền phạt, bảo kê', L.fees, true)}${kv('Tiền nhà', L.rent, true)}${kv('Mua sắm dụng cụ', L.gear, true)}${kv('Hao hụt, đồ hỏng, mất trộm', L.loss, true)}${kv('Lãi vay và phí', L.interest, true)}${kv('Ăn uống', L.food, true)}${kv('Chi khác', L.other, true)}
          <div class="kv sum"><span>Lãi / lỗ trong ngày</span><b class="${pf < 0 ? 'neg' : 'pos'}">${money(pf)}</b></div><p class="muted">Phục vụ ${L.customers} khách (${L.sold} phần) · mất ${L.lost} khách · điểm trung bình ${L.rated ? (L.stars / L.rated).toFixed(1).replace('.', ',') : '—'} ${ic('starf')}</p></div>
          <div><h4>Những ngày qua</h4>${g.hist.length ? g.hist.slice(-8).reverse().map((d) => `<div class="kv"><span>Ngày ${d.day + 1} · ${d.sold} phần</span><b class="${profitOf(d) < 0 ? 'neg' : 'pos'}">${money(profitOf(d))}</b></div>`).join('') : '<p class="muted">Chưa có dữ liệu.</p>'}
          <h4>Tổng kết</h4><div class="kv"><span>Tổng số phần đã bán</span><b>${g.tot.served}</b></div><div class="kv"><span>Ngày bán chạy nhất</span><b>${money(g.tot.best)}</b></div><div class="kv"><span>Tiền xin được</span><b>${money(g.tot.begged)}</b></div><div class="kv"><span>Tiền bán ve chai</span><b>${money(g.tot.scrap)}</b></div></div></div>`;
}

/** Khối "bếp trưởng tự duyệt đặt bàn" + lối vào bảng Báo cáo (tab Nhân sự). */
function autoBookBlock(g: Game): string {
  const can = R.canAutoBook(g), on = R.autoBookOn(g);
  const low = R.lowStockCount(g);
  return `<h4 style="margin-top:.8em">Báo cáo & đặt bàn</h4>` +
    `<div class="item"><div class="grow"><b>Báo cáo của người làm</b><small>${low ? `${low} món sắp hết nguyên liệu — xem gợi ý đi chợ` : 'Kho còn đủ cho món đang bán'}</small></div><button class="btn small${low ? ' yellow' : ''}" data-a="reportOpen">Mở báo cáo</button></div>` +
    // Không có bếp trưởng thì giấu hẳn dòng này: quán nhỏ không có đặt bàn, bày ra chỉ là lời dặn thừa.
    (can ? `<div class="item"><div class="grow"><b>Bếp trưởng tự duyệt đặt bàn</b><small>${on ? 'Đang bật: khách đặt là bếp nhận luôn' : 'Đang tắt: bạn tự nhận / từ chối'}</small></div><button class="btn small${on ? ' green' : ''}" data-a="autoBook2">${on ? 'Đang tự duyệt' : 'Bật tự duyệt'}</button></div>` : '');
}

/** Khối "giao đi chợ" dùng trong tab Nhân sự: ai đang đi, giao cho ai, huỷ chuyến. */
function errandBlock(g: Game): string {
  const slots: (0 | 1 | 2 | 3)[] = [0, 1, 2, 3];
  const who = slots.map((sl) => ({ sl, w: R.errandWho(g, sl) })).filter((x) => x.w);
  if (!who.length) return '';
  const running = g.errands.map((e) => `<div class="item"><div class="grow"><b>${e.who}</b><small>${e.back ? 'đang trên đường về' : 'đang ở chợ'} · còn ${Math.max(0, e.legs - e.t)} phút · ${e.lines.length} loại · ${money(e.total)}</small></div></div>`).join('');
  return `<h4 style="margin-top:.8em">Đi chợ mua nguyên liệu</h4>` +
    (running ? `<div class="list">${running}</div>` : '<p class="muted">Chưa ai đi chợ. Giao người làm đi mua đúng thứ còn thiếu cho món đang bán.</p>') +
    `<div style="display:flex;gap:.4em;flex-wrap:wrap;margin-top:.4em"><button class="btn small green" data-a="errandOpen">Giao đi chợ…</button></div>`;
}

export function openPanel(ui: UI, name: string) {
  const M = ui.$('modal'), g = ctx.g;
  let devTaps = 0, devOpen = false;
  const draw = (title: string, tabs: [string, string][], body: string, foot = '') => {
    M.innerHTML = `<div class="panel"><header><h2>${title}</h2><div class="tabs">${tabs.map(([id, t]) => `<button class="tab${id === tab ? ' on' : ''}" data-tab="${id}">${t}</button>`).join('')}</div><button class="x" data-a="close">${ic('x')}</button></header><div class="body">${body}</div>${foot ? `<div class="foot">${foot}</div>` : ''}</div>`;
  };
  const toggleAutoBook = () => {
    const on = !R.autoBookOn(g);
    if (!R.setAutoBook(g, on)) { toast('Cần bếp trưởng trước đã.', 'warn', 'star'); return; }
    if (on) g.bookings.filter((b) => b.status === 'pending').forEach((b) => R.acceptBooking(g, b.id));
    toast(on ? 'Bếp trưởng tự duyệt đặt bàn từ giờ.' : 'Bếp trưởng thôi tự duyệt — bạn tự nhận bàn.', 'info', 'star');
  };
  const acts: Record<string, (i: number, e: HTMLElement) => void> = {
    close: () => ui.closePanel(), errandOpen: () => ui.panel('errand'), reportOpen: () => ui.panel('report'),
    autoBook2: () => toggleAutoBook(), autoBook: () => toggleAutoBook(),
  };
  const render = () => { const sc = (M.querySelector('.body') as HTMLElement | null)?.scrollTop ?? 0; build(); const b = M.querySelector('.body') as HTMLElement | null; if (b) b.scrollTop = sc; };
  M.onclick = (e) => {
    const t = e.target as HTMLElement; if (t === M) { ui.closePanel(); return; }
    if (name === 'settings' && !devOpen && t.closest('#dev-unlock')) {
      devTaps++;
      if (devTaps >= 7) { devOpen = true; sfx('coin'); toast('Đã mở bảng Test & Dịch chuyển ẩn!', 'good', 'bolt'); render(); }
      return;
    }
    const tb = t.closest('[data-tab]') as HTMLElement | null; if (tb) { tab = tb.dataset.tab!; sfx('ui'); render(); return; }
    const a = t.closest('[data-a]') as HTMLElement | null; if (a && !a.classList.contains('off')) { const f = acts[a.dataset.a!]; if (f) { f(+(a.dataset.i ?? 0), a); if (ui.modalName === name) render(); } }
  };
  const stackList = (list: Stack[], btns: (s: Stack, i: number) => string, empty: string) => list.length ? `<div class="list">${list.map((s, i) => { const d = INGS[s.id]; return `<div class="item"><div class="grow"><b>${d.name} <span class="muted">× ${qty(s.n)} ${d.unit}</span></b><small>${(s.n * d.kg).toFixed(2).replace('.', ',')} kg · vốn ${money(s.cost)}/${d.unit} ${d.cold ? '· cần lạnh' : ''}</small></div>${fresh(s)}${btns(s, i)}</div>`; }).join('')}</div>` : `<p class="muted">${empty}</p>`;

  function build() {
    const s = g.stall, T = R.tier(g);
    if (name === 'bag') {
      if (!['bag', 'gear'].includes(tab)) tab = 'bag';
      const near = stallNear(g), cap = R.carryCap(g), w = R.bagWeight(g);
      acts.eat = (i) => ctx.acts.eat(g.bag, i);
      // "Bỏ" là vứt cả lô — phải nói rõ vứt món gì, bao nhiêu, để không ai tưởng đồ tự dưng biến mất.
      acts.drop = (i) => {
        const st = g.bag[i]; if (!st) return;
        const d = INGS[st.id]; g.bag.splice(i, 1);
        toast(`Đã vứt ${qty(st.n)} ${d.unit} ${d.name.toLowerCase()} đi.`, 'info', 'box');
      }; acts.dropj = (_i, e) => { delete g.junk[e.dataset.k!]; };
      acts.toStall = (i) => { const k = moveStack(g.bag, s.store, i, 1e9, R.stallRoom(g)); if (!k) toast('Quầy đầy rồi.', 'warn'); else sfx('pick'); };
      let body = '';
      if (tab === 'bag') {
        body = `<div class="bar"><b style="width:${clamp(w / cap) * 100}%;background:${w > cap ? 'var(--red)' : ''}"></b></div><p class="muted">Đang mang ${w.toFixed(1).replace('.', ',')} / ${cap} kg${w > cap * 0.85 ? ' — nặng quá nên đi chậm!' : ''}</p>` +
          stackList(g.bag, (st, i) => (INGS[st.id].eat ? `<button class="btn small green" data-a="eat" data-i="${i}">${INGS[st.id].eat!.t && !INGS[st.id].eat!.h ? 'Uống' : 'Ăn'}</button>` : '') + (near ? `<button class="btn small" data-a="toStall" data-i="${i}">› Quầy</button>` : '') + `<button class="btn small" data-a="drop" data-i="${i}">Vứt</button>`, 'Túi trống trơn. Ra chợ mua nguyên liệu: tự tay bốc hàng ở sạp rồi đưa người bán tính tiền.');
        const junk = Object.entries(g.junk).filter(([, n]) => n > 0);
        if (junk.length) body += `<h4>Đồ nhặt được</h4><div class="list">${junk.map(([k, n]) => `<div class="item"><div class="grow"><b>${JUNK[k].name} × ${n}</b><small>Bán ở ${JUNK[k].where === 'scrap' ? 'vựa ve chai (Tư Rác hoặc Bà Chín)' : 'tiệm cầm đồ Chú Lâm'}: ${money(JUNK[k].price * n)}</small></div><button class="btn small" data-a="dropj" data-k="${k}">Bỏ</button></div>`).join('')}</div>`;
      } else {
        const ids = Object.keys(g.gear);
        body = ids.length ? `<div class="list">${ids.map((id) => `<div class="item"><div class="grow"><b>${GEAR[id].name}</b><small>${GEAR[id].desc}</small></div>${GEAR[id].wear ? `<span class="tag ${g.gear[id] < 25 ? 'bad' : ''}">còn ${Math.round(g.gear[id])}%</span>` : ''}</div>`).join('')}</div>` : '<p class="muted">Chưa có dụng cụ nào. Ghé tiệm Đồ Nghề Ba Tài ở Phố Trung Tâm.</p>';
        body += `<h4>Chỗ ở</h4><p>${HOUSING[g.housing].name} — ${HOUSING[g.housing].desc}${HOUSING[g.housing].rent ? ` Đã trả tới hết ngày ${g.paidUntil}.` : ''}</p>`;
      }
      draw(`${ic('bag')} Túi đồ`, [['bag', 'Nguyên liệu'], ['gear', 'Dụng cụ']], body, `<span class="muted">Tiền mặt ${money(g.cash)}${g.bank ? ' · ngân hàng ' + money(g.bank) : ''}</span>`);
    } else if (name === 'stall') {
      const rest = R.isRestaurant(g);
      // Nhân sự không chỉ có ở nhà hàng: từ bậc 3 đã thuê được người phụ quầy và phải giao họ đi chợ được.
      const hasStaff = rest || R.helperCount(g) > 0 || g.errands.length > 0 || !!g.branch?.keeper;
      const validTabs = hasStaff ? ['menu', 'store', 'staff', 'info'] : ['menu', 'store', 'info'];
      if (!validTabs.includes(tab)) tab = 'menu';
      const placed = s.where === 'placed';
      acts.sw = (_i, e) => { const rs = g.rec[e.dataset.k!], on = R.menuOf(g).length; if (!rs.on && on >= T.menu) { toast(`${T.name} chỉ bán được tối đa ${T.menu} món cùng lúc.`, 'warn'); return; } rs.on = !rs.on; sfx('ui'); };
      acts.pm = (_i, e) => { const rs = g.rec[e.dataset.k!]; rs.price = clamp(rs.price + +e.dataset.d!, 1000, 500000); };
      acts.sug = (_i, e) => { const r = RECIPES[e.dataset.k!]; g.rec[r.id].price = R.suggestPrice(g, r); };
      // Thiếu nguyên liệu: báo ngay trên bảng (toast trôi mất, người chơi không kịp đọc) rồi mới đóng bảng.
      acts.prep = (_i, e) => {
        const r = RECIPES[e.dataset.k!], miss = R.missingFor(g, r, 'prep');
        if (R.prepPossible(g, r) < 1 && miss.length) { toast(`Chưa sơ chế ${r.short.toLowerCase()} được — thiếu ${miss.map((x) => x.toLowerCase()).join(', ')}.`, 'warn', 'box'); render(); return; }
        ui.closePanel(); ctx.cook.prep(r);
      };
      acts.make = (_i, e) => { const r = RECIPES[e.dataset.k!]; ui.closePanel(); ctx.cook.finish(r); };
      acts.eatd = (i) => ctx.acts.eatDish(i);
      acts.toBag = (i) => { const room = R.carryCap(g) - R.bagWeight(g), k = moveStack(s.store, g.bag, i, 1e9, room); if (!k) toast('Túi đầy rồi.', 'warn'); else sfx('pick'); };
      acts.toStall = (i) => { const k = moveStack(g.bag, s.store, i, 1e9, R.stallRoom(g)); if (!k) toast('Quầy đầy rồi.', 'warn'); else sfx('pick'); };
      acts.open = () => { if (s.open) ctx.stall.close(); else if (ctx.stall.open()) ui.closePanel(); };
      acts.pack = () => { if (ctx.stall.pickUp()) ui.closePanel(); };
      acts.clean = () => { ctx.player.gesture('work', 0.9); R.advance(g, 12, ctx.acts.act()); s.dirt = 0; g.st.hygiene = clamp(g.st.hygiene - 1.5, 0, STAT_MAX); sfx('splash'); toast('Lau dọn quầy sạch bong.', 'good'); };
      acts.dump = () => { const lost = s.ready.reduce((a, x) => a + x.n * x.cost, 0) + purge(s.store).lost; s.ready = []; g.led.loss += lost; toast(`Đổ bỏ đồ ế và đồ hỏng (${money(lost)}).`, 'info'); };
      acts.hireSous = () => { const c = R.sousCandidate(g); if (!R.hireSous(g, c)) { toast(`Không đủ ${money(c.wage)} trả ngày lương đầu cho ${c.name}.`, 'bad', 'cash'); return; } sfx('coin'); toast(`Đã thuê phụ bếp ${c.name} (${money(c.wage)}/ngày).`, 'good', 'heart'); };
      acts.fireSous = (i) => { const old = R.fireSous(g, i === 2 ? 2 : 1); if (old) toast(`Đã cho phụ bếp ${old.name} nghỉ việc.`, 'info', 'heart'); };
      acts.hireHelp = () => { const c = R.helperCandidate(g); if (!R.hireHelper(g, c)) { toast(`Không đủ ${money(c.wage)} trả ngày lương đầu cho ${c.name}.`, 'bad', 'cash'); return; } sfx('coin'); toast(`Đã thuê phục vụ ${c.name} (${money(c.wage)}/ngày).`, 'good', 'heart'); };
      acts.fireHelp = (i) => { const old = R.fireHelper(g, i === 2 ? 2 : 1); if (old) toast(`Đã cho nhân viên phục vụ ${old.name} nghỉ việc.`, 'info', 'heart'); };
      // Đổi ca: sáng → chiều → cả ngày → sáng. Người ngoài ca không tới quầy.
      acts.shiftHelp = (i) => {
        const slot: 1 | 2 = i === 2 ? 2 : 1, cur = g.helpShift[slot];
        const next = cur === 'sang' ? 'chieu' : cur === 'chieu' ? 'full' : 'sang';
        g.helpShift[slot] = next;
        toast(`Ca của ${(slot === 2 ? g.help2 : g.help)?.name ?? 'nhân viên'}: ${SHIFT_LABEL[next].toLowerCase()}.`, 'info', 'clock');
      };
      acts.accBook = (_i, e) => { const b = R.acceptBooking(g, +e.dataset.k!); if (b) { sfx('coin'); toast(`Đã nhận đặt bàn của ${b.name} (${b.size} người).`, 'good', 'star'); } };
      acts.rejBook = (_i, e) => { R.rejectBooking(g, +e.dataset.k!); sfx('ui'); toast('Đã huỷ / từ chối đặt bàn.', 'info'); };
      acts.hireKeeper = () => { const c = R.keeperCandidate(g); if (!R.hireKeeper(g, c)) { toast(`Không đủ ${money(c.wage)} trả ngày lương đầu cho ${c.name}.`, 'bad', 'cash'); return; } sfx('coin'); toast(`Đã thuê ${c.name} trông coi chi nhánh (${money(c.wage)}/ngày).`, 'good', 'heart'); };
      acts.fireKeeper = () => { const old = R.fireKeeper(g); if (old) toast(`Đã cho ${old.name} nghỉ — chi nhánh tạm đóng cửa.`, 'info', 'heart'); };
      acts.toBranch = (_i, e) => { const rid = e.dataset.k!, n = +(e.dataset.n ?? 1); const k = R.moveToBranch(g, rid, n); if (!k) { toast('Chi nhánh hết khay trống hoặc chỉ để được 6 món — lấy bớt về trước.', 'warn'); return; } sfx('pick'); toast(`Chuyển ${k} phần ${RECIPES[rid].short.toLowerCase()} sang chi nhánh.`, 'info', 'shop'); };
      acts.fromBranch = (_i, e) => { const rid = e.dataset.k!, n = +(e.dataset.n ?? 1); const k = R.moveFromBranch(g, rid, n); if (!k) { toast('Khay quầy chính đầy rồi.', 'warn'); return; } sfx('pick'); toast(`Mang ${k} phần ${RECIPES[rid].short.toLowerCase()} về quầy.`, 'info', 'shop'); };
      acts.toggleBranch = () => { if (!g.branch) return; g.branch.open = !g.branch.open; sfx('ui'); toast(g.branch.open ? 'Chi nhánh mở bán lại.' : 'Đã tạm đóng chi nhánh (vẫn phải đóng tiền thuê).', 'info', 'shop'); };
      acts.closeBranch = () => { if (!g.branch) return; if (g.branch.ready.length && !confirm('Trả mặt bằng sẽ bỏ hết món sẵn ở chi nhánh. Chắc chắn?')) return; R.closeBranch(g); toast('Đã trả mặt bằng chi nhánh.', 'info'); };
      acts.findBook = () => { const b = R.createBooking(g); if (!b) { toast('Lịch đặt bàn đã kín (tối đa 4 bàn).', 'warn'); return; } sfx('order'); toast(`Có khách mới đặt bàn: ${b.name} (${b.size} người).`, 'good', 'star'); };
      let body = '';
      if (tab === 'menu') {
        const known = RECIPE_LIST.filter((r) => g.rec[r.id].known);
        // Thiếu nguyên liệu cho món đang bật: nói thẳng thiếu gì, còn bao nhiêu, chợ nào bán, hết bao nhiêu tiền.
        const shorts = R.stockShortages(g).filter((x) => x.dishes.some((d) => known.some((r) => r.short === d && g.rec[r.id].on)));
        const shortBox = shorts.length ? `<div class="shortage"><b>${ic('box')} Thiếu nguyên liệu cho món đang bán</b>${shorts.slice(0, 6).map((x) => `<div class="srow"><span>${esc(x.name)} <span class="muted">còn ${qty(x.left)} ${esc(x.unit)}</span></span><b>cần thêm ${qty(x.need)} ${esc(x.unit)}</b><small>${x.shop ? `bán ở ${esc(x.shop)} · ${money(x.cost)}` : 'không chợ nào bán'}${x.dishes.length ? ` · cho ${esc(x.dishes.slice(0, 2).join(', '))}` : ''}</small></div>`).join('')}${shorts.length > 6 ? `<div class="srow"><span class="muted">… và ${shorts.length - 6} thứ nữa (xem tab Kho quầy)</span></div>` : ''}</div>` : '';
        body = shortBox + `<p class="muted">Bật món muốn bán (tối đa ${T.menu} món), chỉnh giá theo giá vốn. Giá cao quá khách bỏ đi; chất lượng và uy tín càng cao thì khách càng chịu trả. Uy tín hiện tại ${Math.round(g.rep)}.</p><div class="list">` + known.map((r) => {
          const rs = g.rec[r.id], c = R.recipeCost(g, r), mg = R.marginOf(rs.price, c.total), miss = R.missingTools(g, r), rd = R.readyCount(g, r.id), pr = s.preps.filter((p) => p.rid === r.id).reduce((a, p) => a + p.n, 0), can = R.finishPossible(g, r), pp = R.prepPossible(g, r);
          let tags = miss.length ? `<span class="tag bad">thiếu ${miss.map((t) => (t === 'bep' ? 'bếp' : GEAR[t].name.toLowerCase())).join(', ')}</span>` : `<span class="tag ${rd ? 'good' : ''}">sẵn ${rd}</span>` + (R.hasPrep(r) ? `<span class="tag ${pr ? 'good' : 'warn'}">đã sơ chế ${pr} phần</span>` : '') + `<span class="tag ${can ? '' : 'bad'}">làm được ${can > 900 ? '—' : can} phần</span>`;
          // Quán có chỗ ngồi: đánh dấu món hợp buổi để người chơi biết nên bày gì.
          if (R.dineIn(g)) tags += `<span class="tag ${R.fitsPeriod(r, hourOf(g)) ? 'good' : 'warn'}">${R.fitsPeriod(r, hourOf(g)) ? 'hợp buổi này' : 'ngoài buổi'}</span>`;
          const ri = s.ready.findIndex((x) => x.rid === r.id);
          return `<div class="item${miss.length ? ' off' : ''}" style="flex-wrap:wrap"><img src="${dishIcon(r)}" style="width:2.6em;height:2.6em" alt=""><div class="grow"><b>${r.name}</b><small>Vốn ${money(c.total)}/phần · thị trường ~${money(r.ref)} · <span class="${mg < 0.2 ? 'neg' : 'pos'}">lãi ${Math.round(mg * 100)}%</span></small>${tags}</div>
            <div class="price"><button class="btn small" data-a="pm" data-k="${r.id}" data-d="-1000">−</button><b>${money(rs.price)}</b><button class="btn small" data-a="pm" data-k="${r.id}" data-d="1000">+</button></div>
            <button class="sw${rs.on ? ' on' : ''}${miss.length ? ' off' : ''}" data-a="sw" data-k="${r.id}"></button>
            <div style="flex-basis:100%;display:flex;gap:.3em;flex-wrap:wrap;justify-content:flex-end">${R.hasPrep(r) ? `<button class="btn small yellow${!placed || miss.length ? ' off' : ''}${pp < 1 ? ' need' : ''}" data-a="prep" data-k="${r.id}">${ic('knife')} ${pp < 1 ? 'Thiếu đồ — xem thiếu gì' : `Sơ chế ${pp} phần`}</button>` : ''}<button class="btn small${!placed || miss.length || can < 1 ? ' off' : ''}" data-a="make" data-k="${r.id}">${ic('fire')} Làm sẵn ${Math.min(r.serve, can)}</button>${ri >= 0 ? `<button class="btn small green" data-a="eatd" data-i="${ri}">Ăn 1 phần</button>` : ''}<button class="btn small" data-a="sug" data-k="${r.id}">Giá gợi ý</button></div></div>`;
        }).join('') + '</div>' + (placed ? '' : '<p class="muted">Quầy chưa đặt ở chỗ bán nên chưa nấu được — hãy gánh tới một vòng sáng vàng.</p>');
      } else if (tab === 'store') {
        const chilled = R.stallChilled(g);
        const chillTag = R.has(g, 'tu_dong') ? ' · tủ đông công nghiệp' : chilled ? ' · đang ướp đá' : '';
        // Kho quầy đồ nguội/khô tự hỏng: nói rõ mốc, để người chơi không tưởng "bỏ vào quầy là mất".
        const spoilHint = s.store.some((st) => INGS[st.id].shelf < 9000)
          ? `<p class="muted">Đồ trong quầy vẫn hỏng tiếp: bánh mì để được <b>2 ngày</b>, thịt cá chưa nấu chỉ vài giờ. Qua ngày là bỏ (${R.has(g, 'tu_dong') ? 'riêng tủ đông công nghiệp giữ được gần như cả tuần' : 'muốn giữ lâu thì mua tủ đông công nghiệp'}).</p>` : '';
        // Đồ lạnh để trong quầy mà không có tủ đá: hỏng nhanh gấp 2,6 lần — phải nói ngay ở đây,
        // vì người chơi tưởng "bỏ vào quầy là an toàn rồi" nên thấy mất thì tưởng bị lỗi.
        const cold = R.coldUnprotected(g);
        const coldLeft = cold.kinds ? Math.min(...s.store.filter((st) => INGS[st.id]?.cold && INGS[st.id].shelf < 9000).map((st) => R.hoursLeft(g, st))) : 0;
        const coldHint = cold.kinds
          ? `<p class="neg">${cold.names.join(', ')} cần lạnh mà quầy không có tủ đá — để đây khoảng ${Math.max(1, Math.round(coldLeft))} giờ nữa là hỏng. Cất ở nhà (tủ lạnh) hoặc mua thùng đá ở tiệm Ba Tài.</p>` : '';
        body = `<div class="grid2"><div><h4>Trong quầy (${weightOf(s.store).toFixed(1).replace('.', ',')}/${R.stallCap(g)} kg)${chillTag}</h4>${stackList(s.store, (_s, i) => `<button class="btn small" data-a="toBag" data-i="${i}">› Túi</button>`, 'Quầy chưa có nguyên liệu.')}${coldHint}${spoilHint}</div><div><h4>Trong túi (${R.bagWeight(g).toFixed(1).replace('.', ',')}/${R.carryCap(g)} kg)</h4>${stackList(g.bag, (_s, i) => `<button class="btn small" data-a="toStall" data-i="${i}">› Quầy</button>`, 'Túi trống.')}</div></div>` +
          (s.preps.length ? `<h4>Đã sơ chế</h4>${s.preps.map((p) => `<span class="tag ${R.holdFactor(g, RECIPES[p.rid], p.at) < 1 ? 'warn' : 'good'}">${RECIPES[p.rid].short}: ${p.n} phần · ${Math.round(p.q * 100)}đ${R.holdFactor(g, RECIPES[p.rid], p.at) < 1 ? ' · để lâu, kém ngon' : ''}</span>`).join('')}` : '') +
          (R.has(g, 'tu_dong') ? '<p class="muted">Tủ đông công nghiệp đang giữ lạnh tự động (+80 kg sức chứa, không cần mua đá viên).</p>' : R.has(g, 'thungda') && !chilled ? '<p class="muted">Có thùng đá nhưng chưa có đá viên — mua đá ở tạp hoá Cô Ba để giữ lạnh thịt cá.</p>' : !R.has(g, 'thungda') ? '<p class="muted">Chưa có thùng đá: thịt cá để ngoài trời nóng rất mau hỏng.</p>' : '');
      } else if (tab === 'staff') {
        const cand = R.sousCandidate(g), hCand = R.helperCandidate(g);
        const sousList = [g.sous, g.sous2].map((x, idx) => x ? { slot: idx + 1, h: x } : null).filter(Boolean) as { slot: number; h: NonNullable<typeof g.sous> }[];
        const helpList = [g.help, g.help2].map((x, idx) => x ? { slot: idx + 1, h: x } : null).filter(Boolean) as { slot: number; h: NonNullable<typeof g.help> }[];
        const activeBooks = g.bookings.filter((b) => b.status === 'pending' || b.status === 'accepted' || b.status === 'seated');
        const fmtHour = (h: number) => `${Math.floor(h)}h${Math.round((h - Math.floor(h)) * 60) ? String(Math.round((h - Math.floor(h)) * 60)).padStart(2, '0') : '00'}`;
        const sousCol = R.maxSous(g) ? `<h4>Nhân viên phụ bếp (${R.sousCount(g)}/${R.maxSous(g)})</h4>` +
          sousList.map(({ slot, h }) => `<div class="item"><div class="grow"><b>${h.name}</b><small>Đứng phòng bếp riêng, tự sơ chế & nấu sẵn món thiếu · lương ${money(h.wage)}/ngày</small></div><span class="tag good">bếp ${slot}</span><button class="btn small" data-a="fireSous" data-i="${slot}">Cho nghỉ</button></div>`).join('') +
          (R.sousCount(g) < R.maxSous(g)
            ? `<div class="item"><div class="grow"><b>${cand.name}</b><small>${cand.ask.replace('{ac}', g.ac)} · tốc độ ×${cand.speed.toFixed(2).replace('.', ',')}</small></div><button class="btn small green${g.cash < cand.wage ? ' off' : ''}" data-a="hireSous">Thuê — ${money(cand.wage)}/ngày</button></div>`
            : '') : '';
        const staffCol = sousCol + `<h4>Nhân viên phục vụ (${R.helperCount(g)}/${R.maxHelpers(g)})</h4>` +
          helpList.map(({ slot, h }) => {
            const sh = g.helpShift[slot === 2 ? 2 : 1], on = R.onShift(g, slot === 2 ? 2 : 1), left = R.shiftLeft(g, slot === 2 ? 2 : 1);
            // Không có dòng chú thích dài: ca + số giờ còn lại + tiền lương là đủ hiểu.
            return `<div class="item"><div class="grow"><b>${h.name}</b><small>${SHIFT_LABEL[sh]} · ${on ? `còn ${Math.floor(left / 60)}h${String(left % 60).padStart(2, '0')}` : 'chưa tới ca'}</small><small>${money(h.wage)}/ngày</small></div><span class="tag ${on ? 'good' : ''}">bàn ${slot}</span><button class="btn small" data-a="shiftHelp" data-i="${slot}">${SHIFT_NEXT[sh]}</button><button class="btn small" data-a="fireHelp" data-i="${slot}">Cho nghỉ</button></div>`;
          }).join('') +
          (R.helperCount(g) < R.maxHelpers(g)
            ? `<div class="item"><div class="grow"><b>${hCand.name}</b><small>${hCand.ask.replace('{ac}', g.ac)}</small></div><button class="btn small green${g.cash < hCand.wage ? ' off' : ''}" data-a="hireHelp">Thuê — ${money(hCand.wage)}/ngày</button></div>`
            : '');
        // Cột phải: đặt bàn trước chỉ có ở nhà hàng bình dân; chi nhánh thì chuỗi nào cũng có.
        let besideCol = '';
        if (rest) {
          besideCol +=
            `<h4>Đặt bàn trước (${activeBooks.length}/${R.BOOKING_MAX})</h4>` +
            (activeBooks.length ? `<div class="list">${activeBooks.map((b) => `<div class="item"><div class="grow"><b>${b.name} · ${b.size} người</b><small>${b.day > g.day ? 'Ngày mai ' : 'Hôm nay '}${fmtHour(b.hour)} · cọc ${money(b.deposit)}${b.dish && RECIPES[b.dish] ? ' · thích ' + RECIPES[b.dish].short.toLowerCase() : ''}</small></div>` +
              (b.status === 'pending' ? `<button class="btn small green" data-a="accBook" data-k="${b.id}">Nhận bàn</button><button class="btn small" data-a="rejBook" data-k="${b.id}">Từ chối</button>`
                : b.status === 'accepted' ? `<span class="tag good">đã nhận</span><button class="btn small" data-a="rejBook" data-k="${b.id}">Huỷ</button>`
                : `<span class="tag warn">đang ngồi</span>`) + `</div>`).join('')}</div>`
              : '<p class="muted">Chưa có bàn đặt trước nào. Khách quen hoặc dân văn phòng sẽ gửi yêu cầu khi nhà hàng hoạt động.</p>') +
            `<div style="margin-top:.5em"><button class="btn small${activeBooks.length >= R.BOOKING_MAX ? ' off' : ''}" data-a="findBook">Nhận thêm khách đặt bàn</button></div>`
        }
        if (R.isChain(g)) {
          besideCol +=
            `<h4 style="margin-top:.8em">Chi nhánh (chuỗi cửa hàng)</h4>` + (g.branch
              ? `<div class="item"><div class="grow"><b>${SPOTS.find((x) => x.id === g.branch!.spot)?.name ?? ''}</b><small>${g.branch.keeper ? g.branch.keeper.name + ' trông coi · ' + (g.branch.open ? 'đang bán' : 'đang đóng cửa') : 'Chưa có người trông coi'} · ${R.branchStock(g)} phần sẵn</small></div><button class="btn small" data-tab="branch">Mở sổ</button></div>`
              : `<p class="muted">Đã có bảng hiệu chuỗi nhưng chưa thuê chi nhánh. Ghé tiệm Ba Tài mở thêm điểm bán thứ hai.</p>`);
        }
        body = (besideCol ? `<div class="grid2"><div>${staffCol}</div><div>${besideCol}</div></div>` : staffCol) +
          errandBlock(g) + autoBookBlock(g);
      } else {
        const sp = ctx.stall.spot(), rate = R.arrivalRate(g);
        const seatLabel = R.isRestaurant(g) ? `${R.seatCount(g)} ghế trong nhà kín (4 bàn · phòng bếp riêng)` : `${R.seatCount(g)} ghế${R.dineIn(g) ? ' trong nhà' : ' nhựa ngoài sân'}`;
        const upgList = GEAR_LIST.filter((x) => (x.minTier ?? 0) >= 1 && (x.minTier ?? 0) <= T.tier);
        const ownedUpg = upgList.filter((x) => R.has(g, x.id));
        body = `<div class="grid2"><div><div class="kv"><span>Loại quầy</span><b>${T.name}</b></div><div class="kv"><span>Vị trí</span><b>${sp ? sp.name : s.where === 'home' ? 'Ở chỗ ở' : '—'}</b></div><div class="kv"><span>Phí chỗ</span><b>${sp ? (sp.fee ? money(sp.fee) + '/ngày' : 'miễn phí') : '—'}</b></div><div class="kv"><span>Tình trạng</span><b class="${s.cond < 40 ? 'neg' : ''}">${Math.round(s.cond)}%</b></div><div class="kv"><span>Độ bẩn</span><b class="${s.dirt > 40 ? 'neg' : ''}">${Math.round(s.dirt)}%</b></div><div class="kv"><span>Độ thu hút</span><b>${Math.round(R.stallAppeal(g) * 100)}%</b></div><div class="kv"><span>Ước lượng khách</span><b>${s.open ? '~' + rate.toFixed(1).replace('.', ',') + ' người/giờ' : 'chưa mở'}</b></div>${R.seatCount(g) ? `<div class="kv"><span>Chỗ ngồi</span><b>${seatLabel}</b></div>` : ''}<div class="kv"><span>Buổi bán</span><b>${R.periodName(g)}</b></div>${R.dineIn(g) ? `<div class="kv"><span>Hợp buổi</span><b>${R.periodMenu(g).length} món</b></div>` : ''}${rest ? `<div class="kv"><span>Nhân sự</span><b>${R.sousCount(g)} phụ bếp · ${R.helperCount(g)} phục vụ</b></div><div class="kv"><span>Đặt bàn</span><b>${g.bookings.filter((b) => b.status === 'accepted').length} bàn đã nhận</b></div>` : ''}</div>
          <div><p class="muted">${sp ? sp.note : 'Gánh quầy tới một chỗ bán (vòng vàng) để bày hàng.'} Mua thêm đồ tiện lợi & thiết bị ở tiệm Đồ Nghề Ba Tài (Phố Trung Tâm) để hút khách và phục vụ nhanh hơn.</p>` +
          (ownedUpg.length ? `<h4>Tiện nghi & thiết bị đã lắp (${ownedUpg.length}/${upgList.length})</h4><p>${ownedUpg.map((x) => `<span class="tag good">${x.name}</span>`).join(' ')}</p>` : `<p class="muted">Chưa lắp thêm tiện nghi nâng cấp nào (${upgList.length} món có thể mua ở tiệm Ba Tài).</p>`) +
          (T.tier >= 3 && g.flags.sapNo ? '<p class="neg">Đang nợ phí chỗ — mở bán sẽ trừ tiền trước.</p>' : '') + `<div style="display:flex;gap:.4em;flex-wrap:wrap"><button class="btn${s.dirt < 3 ? ' off' : ''}" data-a="clean">Lau dọn quầy (12 phút)</button><button class="btn${s.ready.length || s.store.some(isSpoiled) ? '' : ' off'}" data-a="dump">Đổ bỏ đồ ế, đồ hỏng</button></div></div></div>`;
      }
      const stallTabs: [string, string][] = hasStaff
        ? [['menu', 'Thực đơn'], ['store', 'Kho quầy'], ['staff', rest ? 'Nhân sự & Đặt bàn' : 'Nhân sự'], ['info', 'Quầy']]
        : [['menu', 'Thực đơn'], ['store', 'Kho quầy'], ['info', 'Quầy']];
      draw(`${ic('shop')} ${T.name}`, stallTabs, body, placed ? `<button class="btn ${s.open ? 'red' : 'green'}" data-a="open">${s.open ? 'Đóng quầy' : 'MỞ BÁN'}</button>${T.tier < 3 ? `<button class="btn" data-a="pack">Dọn hàng, mang đi</button>` : ''}<span class="muted">Hôm nay: ${g.led.sold} phần · ${money(g.led.revenue + g.led.tips)}</span>` : T.tier < 3 ? `<button class="btn" data-a="pack">Mang quầy đi</button>` : `<span class="muted">Chạm vào vòng sáng vàng ngoài phố để đặt sạp.</span>`);
    } else if (name === 'home') {
      const h = HOUSING[g.housing];
      acts.take = (i) => { const k = moveStack(g.home, g.bag, i, 1e9, R.carryCap(g) - R.bagWeight(g)); if (!k) toast('Túi đầy rồi.', 'warn'); else sfx('pick'); };
      acts.put = (i) => { const k = moveStack(g.bag, g.home, i, 1e9, R.homeRoom(g)); if (!k) toast('Chỗ cất đã đầy.', 'warn'); else sfx('pick'); };
      draw(`${ic('home')} ${h.name}`, [], `<p class="muted">${h.desc} Độ an toàn ${Math.round(h.safety * 100)}%${R.homeChilled(g) ? ' · có giữ lạnh' : ''}.</p><div class="grid2"><div><h4>Đang cất (${weightOf(g.home).toFixed(1).replace('.', ',')}/${h.storage} kg)</h4>${stackList(g.home, (_s, i) => `<button class="btn small" data-a="take" data-i="${i}">› Túi</button>`, 'Chưa cất gì.')}</div><div><h4>Trong túi</h4>${stackList(g.bag, (_s, i) => `<button class="btn small" data-a="put" data-i="${i}">→ Cất</button>`, 'Túi trống.')}</div></div>`);
    } else if (name === 'book') {
      if (!['rec', 'led', 'debt'].includes(tab)) tab = 'rec';
      let body = '';
      if (tab === 'rec') {
        // Gọn: mỗi món một dòng — tên, loại, nguyên liệu chính; chi tiết (số lượng, dụng cụ, các bước) mở ra khi chạm.
        const row = (r: RecipeDef) => {
          const rs = g.rec[r.id], tools = toolsFor(r).map((t) => (t === 'bep' ? 'bếp' : GEAR[t].name.toLowerCase()));
          const ings = Object.keys(r.ings).map((id) => INGS[id].name.toLowerCase());
          if (!rs.known) return `<div class="item off"><img src="${dishIcon(r)}" style="width:2em;height:2em;filter:grayscale(1)" alt=""><div class="grow"><b>${r.name}</b><small>Học từ ${R.hasMet(g, r.learn!.from) ? FIXED[r.learn!.from]?.name : R.fixedLabel(g, r.learn!.from).toLowerCase()} — ${money(r.learn!.cost)} · cần cấp ${r.learn!.skill}</small></div></div>`;
          return `<details class="item rec"><summary><img src="${dishIcon(r)}" style="width:2em;height:2em" alt=""><span class="grow"><b>${r.name} <span class="tag">${CAT_LABEL[r.cat]}</span></b><small>${ings.join(' · ')} · bán ~${money(r.ref)}</small></span><span class="moreb">▾</span></summary>
            <div class="more"><small><b>Một phần:</b> ${Object.entries(r.ings).map(([id, n]) => `${INGS[id].name.toLowerCase()} ${qty(n)} ${INGS[id].unit}`).join(' · ')}</small>
            <small><b>Dụng cụ:</b> ${tools.join(', ') || 'không cần'} · <b>Sơ chế</b> (mẻ ${r.batch} phần): ${r.prep.map((s) => ('label' in s && s.label ? s.label : s.t === 'cut' ? `thái ${INGS[s.ing].name.toLowerCase()}` : STEP_NAME[s.t])).join(' › ') || 'không'} · <b>Khi khách gọi:</b> ${r.finish.map((s) => ('label' in s && s.label ? s.label : STEP_NAME[s.t])).join(' › ')}</small>
            <small>Đã bán ${rs.made} phần · ngon nhất ${Math.round(rs.best * 100)} điểm</small></div></details>`;
        };
        body = `<p class="muted">Tay nghề cấp ${R.level(g)} · ${RECIPE_LIST.filter((r) => g.rec[r.id].known).length}/${RECIPE_LIST.length} món đã biết. Chạm một món để xem số lượng, dụng cụ và các bước. Nguyên liệu: Chợ Xóm Chiều (rẻ, tươi buổi sáng), MiniMart 24h (mở 24/7 suốt ngày đêm), tạp hoá Cô Ba (than, gas, đá).</p><div class="list">${RECIPE_LIST.filter((r) => g.rec[r.id].known).map(row).join('')}</div><h4>Chưa học</h4><div class="list">${RECIPE_LIST.filter((r) => !g.rec[r.id].known).map(row).join('')}</div>`;
      } else if (tab === 'led') {
        body = ledgerBody(g);
      } else {
        body = `<h4>Nợ nần</h4>` + (g.debts.length ? `<div class="list">${g.debts.map((d) => `<div class="item"><div class="grow"><b>${LENDERS[d.lender].name}: ${money(d.owed)}</b><small>Vay ${money(d.principal)} ngày ${d.taken + 1} · lãi ${(LENDERS[d.lender].rate * 100).toFixed(1)}%/ngày</small></div><span class="tag ${g.day > d.due ? 'bad' : g.day === d.due ? 'warn' : ''}">${g.day > d.due ? 'QUÁ HẠN ' + (g.day - d.due) + ' ngày' : 'hạn: ngày ' + (d.due + 1)}</span></div>`).join('')}</div>` : '<p class="muted">Không nợ ai đồng nào.</p>') +
          `<p class="muted">Tiết kiệm ngân hàng: ${money(g.bank)}. ${g.credit > g.day ? 'Bạn đang bị ngân hàng từ chối cho vay tới ngày ' + (g.credit + 1) + '.' : ''} Trả nợ tại chỗ người cho vay: Ngân hàng Sao Vàng (Phố Văn Phòng), Hùng Sẹo (sân trong Xóm Lao Động), Cô Ba (tạp hoá).</p>
          <h4>Khách quen</h4><div class="list">${REGULARS.map((r) => { const rel = R.hasMet(g, r.id) ? g.rel[r.id] : undefined; return `<div class="item${rel?.n ? '' : ' off'}"><div class="grow"><b>${rel?.n ? r.name : '???'}</b><small>${rel?.n ? r.note + ' Thường ghé lúc ' + hhmm(r.hour * 60) + '. Thích: ' + r.likes.map((c) => CAT_LABEL[c].toLowerCase()).join(', ') + '.' : 'Chưa quen ai ở giờ này.'}</small></div><span class="tag ${(rel?.v ?? 0) > 20 ? 'good' : ''}">${rel?.n ? 'thân ' + Math.round(rel.v) : '—'}</span></div>`; }).join('')}</div>`;
      }
      draw(`${ic('book')} Sổ tay`, [['rec', 'Công thức'], ['led', 'Sổ sách'], ['debt', 'Nợ & khách quen']], body);
    } else if (name === 'errand') {
      const slots: (0 | 1 | 2 | 3)[] = [0, 1, 2, 3];
      const workers = slots.map((sl) => ({ sl, who: R.errandWho(g, sl), run: g.errands.find((e) => e.slot === sl) })).filter((w) => w.who);
      if (!workers.length) {
        draw(`${ic('bag')} Giao đi chợ`, [], '<p class="muted">Chưa có ai để giao việc. Thuê người phụ quầy (từ xe đẩy), phụ bếp (nhà hàng bình dân) hoặc người trông coi chi nhánh (chuỗi cửa hàng) trước đã.</p>');
        return;
      }
      let sel = +(ui.modalArg?.slot ?? workers[0].sl) as 0 | 1 | 2 | 3;
      if (!workers.some((w) => w.sl === sel)) sel = workers[0].sl;
      const target = +(ui.modalArg?.dish ? 1 : 1);
      void target;
      const pickDish = (ui.modalArg?.dish ? String(ui.modalArg.dish) : '');
      const menu = R.menuOf(g);
      const plan: [string, number][] = pickDish && RECIPES[pickDish]
        ? R.errandPlanFor(g, RECIPES[pickDish], 2)
        : R.errandPlanForAll(g, menu.slice(0, 6));
      const quote = R.errandQuote(g, plan);
      const names = new Map<string, string>();
      for (const l of quote.lines) names.set(l.shop, SHOPS[l.shop]?.name ?? l.shop);
      acts.erPick = (i) => { ui.reopenPanel('errand', { ...(ui.modalArg ?? {}), slot: workers[i].sl }); };
      acts.erDish = (_i, e) => { ui.reopenPanel('errand', { slot: sel, dish: e.dataset.k! }); };
      acts.erSend = () => {
        const e = R.startErrand(g, sel, quote.lines, quote.total);
        if (!e) { toast(g.cash < quote.total ? `Không đủ tiền — cần ${money(quote.total)}.` : 'Không giao được chuyến này.', 'warn', 'cash'); return; }
        sfx('coin');
        toast(`${e.who} xách giỏ đi chợ: ${e.lines.length} loại, ${money(e.total)}, về sau ${e.legs} phút.`, 'good', 'bag');
        ui.closePanel();
      };
      const rows = workers.map((w, i) => `<button class="btn small${w.sl === sel ? ' yellow' : ''}" data-a="erPick" data-i="${i}">${w.who!.name} <span class="muted">· ${w.who!.role}</span>${w.run ? ' — đang đi chợ' : ''}</button>`).join(' ');
      const lines = quote.lines.length
        ? `<div class="list">${quote.lines.map((l) => `<div class="item"><div class="grow"><b>${INGS[l.id].name} <span class="muted">× ${qty(l.n)} ${INGS[l.id].unit}</span></b><small>${names.get(l.shop) ?? ''} · tươi ${Math.round(l.fresh)}% · ${money(l.price)}/${INGS[l.id].unit}</small></div><b>${money(l.price * l.n)}</b></div>`).join('')}</div>`
        : '<p class="muted">Không còn gì phải mua: kho quầy đã đủ nguyên liệu cho các món này.</p>';
      const body = `<p class="muted">Người làm tự đi các sạp ở cổng chợ lúc cửa hàng đang mở, trả tiền mặt của bạn, rồi mang hàng về chất lên kho quầy. Đi và về mất khoảng nửa giờ tuỳ quãng đường. Bạn trả tiền trước, họ không tự thương lượng giá.</p>
        <h4>Giao cho ai</h4><div style="display:flex;gap:.4em;flex-wrap:wrap">${rows}</div>
        <h4>Mua gì</h4><div style="display:flex;gap:.4em;flex-wrap:wrap"><button class="btn small${pickDish ? '' : ' yellow'}" data-a="erDish" data-k="">Đủ nguyên liệu 6 món đang bán</button>${menu.map((r) => `<button class="btn small${pickDish === r.id ? ' yellow' : ''}" data-a="erDish" data-k="${r.id}">${RECIPES[r.id].short}</button>`).join('')}</div>
        <h4>Tạm tính (${quote.lines.length} loại)</h4>${lines}
        ${quote.missing.length ? `<p class="warn">Giờ này không đâu bán: ${quote.missing.join(', ')}.</p>` : ''}
        <div class="kv sum"><span>Tổng tiền trả trước</span><b class="${g.cash < quote.total ? 'neg' : 'pos'}">${money(quote.total)}</b></div>
        ${(g.errands.length ? `<h4>Đang đi chợ</h4><div class="list">${g.errands.map((e) => `<div class="item"><div class="grow"><b>${e.who}</b><small>${e.back ? 'đang về' : 'đang ở chợ'} · còn ${Math.max(0, e.legs - e.t)} phút · ${e.lines.length} loại</small></div><button class="btn small" data-a="erCancel" data-n="${e.slot}">Huỷ</button></div>`).join('')}</div>` : '')}`;
      acts.erCancel = (i, e) => { const sl = +(e.dataset.n ?? 0) as 0 | 1 | 2 | 3; R.cancelErrand(g, sl); toast('Đã huỷ chuyến, hoàn 85% tiền.', 'info', 'cash'); };
      draw(`${ic('bag')} Giao đi chợ mua nguyên liệu`, [], body,
        `<button class="btn green${quote.lines.length ? '' : ' off'}" data-a="erSend">Giao ${workers.find((w) => w.sl === sel)?.who?.name ?? ''} đi chợ — ${money(quote.total)}</button><button class="btn" data-a="close">Thôi</button>`);
    } else if (name === 'report') {
      const reps = R.staffReports(g);
      const dishMenu = R.menuOf(g);
      if (!reps.length) {
        draw(`${ic('book')} Báo cáo của người làm`, [], '<p class="muted">Chưa có ai để báo cáo. Thuê người phụ quầy (từ xe đẩy), phụ bếp (nhà hàng bình dân) hoặc người trông coi chi nhánh (chuỗi cửa hàng) là họ tự canh kho và báo bạn.</p>');
        return;
      }
      acts.repErrand = (_i, e) => { ui.panel('errand', { slot: +(e.dataset.k ?? 0), dish: e.dataset.rid || '' }); };
      acts.repCheck = () => { bus.emit('ui', 'staffReportCheck'); render(); };
      const low = R.lowStockCount(g);
      const cards = reps.map((r) => {
        const dishes = r.dishes.length
          ? r.dishes.map((d) => `<div class="item"><div class="grow"><b>${RECIPES[d.rid].short} <span class="muted">· còn nấu được ${d.canMake} phần</span></b><small>${d.canMake === 0 ? 'hết đồ, món này không ra được' : 'đủ cho khoảng một phần nữa'}</small></div><button class="btn small" data-a="repErrand" data-k="${r.slot}" data-rid="${d.rid}">Giao đi chợ</button></div>`).join('')
          : '<p class="muted">Kho còn đủ cho mọi món đang bán.</p>';
        const ings = r.ings.length
          ? `<div class="list">${r.ings.map((x) => `<div class="kv"><span>${INGS[x.id].name}</span><b class="${x.left <= 0 ? 'neg' : 'warn'}">còn ${qty(x.left)} ${INGS[x.id].unit} · cần ${qty(x.need)}</b></div>`).join('')}</div>`
          : '';
        return `<div style="margin-bottom:.9em">
          <div class="item"><div class="grow"><b>${r.name} <span class="muted">· ${r.role}</span></b><small>${r.text}</small></div>${r.urgent ? '<span class="tag bad">gấp</span>' : r.dishes.length ? '<span class="tag warn">sắp hết</span>' : '<span class="tag good">đủ hàng</span>'}</div>
          ${dishes}${ings}
          ${r.cost ? `<button class="btn small green" data-a="repErrand" data-k="${r.slot}">Giao ${r.name} đi chợ — ${money(r.cost)}</button>` : ''}
        </div>`;
      }).join('');
      const body = `<p class="muted">Người làm tự canh kho và báo mỗi khi nguyên liệu cho món đang bán còn đủ nấu ≤ 1 phần. Bấm "Giao đi chợ" là họ đi mua đúng thứ còn thiếu.</p>
        ${low ? `<p class="warn">${low} món đang bán sắp hết nguyên liệu${R.stockShortages(g).length ? ` — thiếu ${R.stockShortages(g).slice(0, 4).map((x) => x.name.toLowerCase()).join(', ')}` : ''}.</p>` : ''}
        ${cards}
        <h4>Đặt bàn trước</h4>
        <div class="item"><div class="grow"><b>Bếp trưởng tự duyệt đặt bàn</b><small>${R.canAutoBook(g) ? 'Khách gọi đặt bàn là bếp nhận luôn (vẫn trừ uy tín nếu lỡ hẹn). Tắt thì bạn tự nhận/từ chối trong tab Nhân sự.' : 'Cần có bếp trưởng (nhà hàng bình dân) mới giao được quyền này.'}</small></div>${R.canAutoBook(g) ? `<button class="btn small${R.autoBookOn(g) ? ' green' : ''}" data-a="autoBook">${R.autoBookOn(g) ? 'Đang tự duyệt — bấm để tắt' : 'Bật tự duyệt'}</button>` : ''}</div>
        <h4>Thực đơn đang bán (${dishMenu.length} món)</h4>
        ${dishMenu.length ? `<div class="list">${dishMenu.map((r) => { const can = R.finishPossible(g, r); return `<div class="item"><div class="grow"><b>${r.name}</b><small>nấu được thêm ${can} phần</small></div>${can <= 1 ? '<span class="tag bad">sắp hết</span>' : can <= 3 ? '<span class="tag warn">ít</span>' : '<span class="tag good">ok</span>'}</div>`; }).join('')}</div>` : '<p class="muted">Chưa bật món nào trên thực đơn.</p>'}`;
      draw(`${ic('book')} Báo cáo & gợi ý của người làm`, [], body, `<button class="btn" data-a="repCheck">Kiểm tra lại kho</button><button class="btn" data-a="close">Đóng</button>`);
    } else if (name === 'branch') {
      const b = g.branch;
      if (!b) { draw(`${ic('shop')} Chi nhánh`, [], '<p class="muted">Chưa mở chi nhánh nào. Cần bậc 7 (Chuỗi cửa hàng) rồi ghé tiệm Đồ Nghề Ba Tài.</p>'); return; }
      const sp = SPOTS.find((x) => x.id === b.spot);
      const cand = R.keeperCandidate(g);
      {
        const body = `<div class="grid2"><div>
          <p class="muted">${sp ? sp.name : b.spot} · thuê ${money(b.rent)}/ngày · mở từ ngày ${b.since + 1}. ${R.branchSelling(g) ? 'Người trông coi đang bán.' : b.keeper ? (b.open ? 'Có người trông nhưng khay trống — chuyển món sẵn qua.' : 'Chi nhánh đang đóng cửa.') : 'Chưa có người trông coi.'}</p>
          <div class="kv"><span>Doanh thu hôm nay</span><b class="pos">${money(b.led.revenue + b.led.tips)}</b></div>
          <div class="kv"><span>Đã bán</span><b>${b.led.sold} phần · ${b.led.customers} khách</b></div>
          <div class="kv"><span>Mất khách (hết món)</span><b class="${b.led.lost ? 'neg' : ''}">${b.led.lost}</b></div>
          <div class="kv"><span>Chi hôm nay</span><b class="neg">thuê ${money(b.led.fees)} · lương ${money(b.led.wage)} · bỏ món ế ${money(b.led.loss)}</b></div>
          <div class="kv"><span>Tổng cộng dồn</span><b>${money(b.tot.revenue + b.tot.tips)} · ${b.tot.sold} phần / ${b.tot.days} ngày</b></div>
          <h4>Người trông coi</h4>
          ${b.keeper ? `<div class="item"><div class="grow"><b>${b.keeper.name}</b><small>Tự bán món sẵn theo giá bạn đặt · lương ${money(b.keeper.wage)}/ngày</small></div><button class="btn small" data-a="fireKeeper">Cho nghỉ</button></div>`
            : `<div class="item"><div class="grow"><b>${cand.name}</b><small>${cand.ask.replace('{ac}', g.ac)}</small></div><button class="btn small green${g.cash < cand.wage ? ' off' : ''}" data-a="hireKeeper">Thuê — ${money(cand.wage)}/ngày</button></div>`}
          <div style="display:flex;gap:.4em;flex-wrap:wrap;margin-top:.5em">
            <button class="btn small" data-a="toggleBranch">${b.open ? 'Tạm đóng chi nhánh' : 'Mở lại chi nhánh'}</button>
            <button class="btn small" data-a="closeBranch">Trả mặt bằng</button>
          </div></div><div>
          <h4>Khay ở chi nhánh (${R.branchStock(g)}/${R.BRANCH_READY_CAP} phần · tối đa ${R.BRANCH_TRAY_CAP} món)</h4>
          ${b.ready.length ? `<div class="list">${b.ready.map((r) => `<div class="item"><div class="grow"><b>${RECIPES[r.rid].name}</b><small>${r.n} phần · ${Math.round(r.q * 100)} điểm · bán ${money(g.rec[r.rid].price)}</small></div><button class="btn small" data-a="fromBranch" data-k="${r.rid}" data-n="1">‹ 1 về quầy</button></div>`).join('')}</div>`
            : '<p class="muted">Khay trống. Chuyển món đã làm sẵn từ quầy chính sang bên dưới.</p>'}
          <h4>Món sẵn ở quầy chính chuyển được</h4>
          ${g.stall.ready.length ? `<div class="list">${g.stall.ready.map((r) => `<div class="item"><div class="grow"><b>${RECIPES[r.rid].name}</b><small>${r.n} phần sẵn · ${Math.round(r.q * 100)} điểm</small></div><button class="btn small green" data-a="toBranch" data-k="${r.rid}" data-n="${r.n}">Chuyển hết ›</button></div>`).join('')}</div>`
            : '<p class="muted">Chưa có món nào làm sẵn ở quầy chính. Làm trước rồi chuyển sang.</p>'}
          ${b.hist.length ? `<h4>Sổ những ngày qua</h4>${b.hist.slice().reverse().map((h) => `<div class="kv"><span>Ngày ${h.day + 1} · ${h.sold} phần${h.lost ? ' · mất ' + h.lost + ' khách' : ''}</span><b class="pos">${money(h.revenue + h.tips)}</b></div>`).join('')}` : ''}
          </div></div>`;
        draw(`${ic('shop')} Chi nhánh · ${sp?.name ?? ''}`, [['info', 'Sổ & khay']], body);
      }
    } else if (name === 'phone') {
      // Giao diện riêng cho từng mẫu máy — xem src/ui/phoneUI.ts
      const m = PH.phone(g);
      if (!m) {
        draw(`${ic('info')} Chưa có điện thoại`, [], `<p class="muted">Trong túi chưa có máy nào. Tiệm Đồ Nghề Ba Tài ở Phố Trung Tâm bán ba mẫu: cục gạch (180.000₫), nắp gập (520.000₫) và cảm ứng (1.450.000₫).</p>`);
        return;
      }
      acts.phonehome = () => { if (PUI.phoneView().app === 'home') ui.closePanel(); else PUI.phoneKey('home'); };
      acts.phoneup = () => PUI.phoneKey('up');
      acts.phonedown = () => PUI.phoneKey('down');
      acts.phoneok = () => PUI.phoneKey('ok');
      acts.phonepick = (i) => PUI.phoneKey('pick', i);
      acts.phoneopen = (_i, e) => PUI.phoneKey('open', e.dataset.k!);
      acts.phonerow = (i) => PUI.phoneRow(i);
      acts.phshop = (_i, e) => PUI.phoneToggleShop(e.dataset.k as 'main' | 'branch');
      // nút trên lớp hoạt ảnh của màn hình máy: đổi kênh cho màn hình chạy tiếp / tắt hẳn
      acts.phoneactnext = () => { PUI.phoneActNext(); };
      acts.phoneactoff = () => { PUI.stopPhoneAct(); };
      const sh = PUI.phoneShell(g, m);
      draw(sh.title, [], sh.html, sh.foot);
    } else if (name === 'map') {
      const places = ctx.acts.places(); acts.go = (i) => { ctx.acts.way = places[i]; ui.closePanel(); toast(`Đã ghim: ${places[i].name}. Đi theo mũi tên và cột sáng vàng.`, 'info', 'pin'); }; acts.clear = () => { ctx.acts.way = null; };
      draw(`${ic('map')} Bản đồ khu phố`, [], `<div class="grid2"><canvas id="map" width="640" height="610"></canvas><div><p class="muted">Chạm một địa điểm để ghim đường đi.</p><div class="list">${places.map((p, i) => `<button class="btn small" style="justify-content:flex-start" data-a="go" data-i="${i}">${ic('pin')} ${p.name} <span class="muted">· ${Math.round(Math.hypot(p.x - ctx.player.x, p.z - ctx.player.z))} m</span></button>`).join('')}</div></div></div>`, ctx.acts.way ? `<button class="btn" data-a="clear">Bỏ ghim “${esc(ctx.acts.way.name)}”</button>` : '');
      drawMap(document.getElementById('map') as HTMLCanvasElement, places);
    } else if (name === 'settings') {
      if (devOpen) {
        const sections = getDevSections();
        acts.devBack = () => { devOpen = false; };
        acts.devLock = () => { devOpen = false; devTaps = 0; toast('Đã ẩn lại menu Test & Dịch chuyển.', 'info'); };
        acts.devRun = (_i, el) => {
          const id = el.dataset.k;
          for (const sec of sections) {
            const act = sec.items.find((x) => x.id === id);
            if (act) {
              if (act.closePanel !== false) ui.closePanel();
              act.run();
              return;
            }
          }
        };
        const body = `<p class="muted"><b>Phiên bản mới nhất:</b> ${DEV_BUILD_TAG}. Danh sách này được làm mới mỗi lần cập nhật tính năng.</p>` +
          sections.map((sec) => `<h4>${sec.title}</h4><div class="list">${sec.items.map((it) => `<div class="item"><div class="grow"><b>${it.label}</b><small>${it.sub}</small></div><button class="btn small${it.tone ? ' ' + it.tone : ''}" data-a="devRun" data-k="${it.id}">Chạy</button></div>`).join('')}</div>`).join('');
        draw(`${ic('bolt')} Menu Test & Dịch chuyển (Ẩn)`, [], body, `<button class="btn" data-a="devBack">Quay lại Cài đặt</button><button class="btn" data-a="devLock">Ẩn & Reset (7 lần)</button>`);
        return;
      }
      const st = ctx.set;
      acts.q = (i) => { st.quality = i; st.auto = false; ctx.applyQuality(); saveSettings(); }; acts.cam3 = () => { ctx.ui.switchView(); ctx.ui.panel('settings'); }; acts.fps = () => { st.fps = !st.fps; saveSettings(); }; acts.auto = () => { st.auto = !st.auto; saveSettings(); };
      acts.fs = () => { void toggleFullscreen(); }; acts.layout = () => ui.editLayout(); acts.save = () => { ctx.save('thu cong'); toast('Đã lưu game.', 'good'); }; acts.menu = () => { ctx.save('ve menu'); ui.closePanel(); ctx.toMenu(); };
      draw(`${ic('gear')} <span id="dev-unlock" style="cursor:pointer;user-select:none">Cài đặt</span>`, [], `<h4>Đồ hoạ</h4><div style="display:flex;gap:.4em;flex-wrap:wrap">${QUALITY.map((q, i) => `<button class="btn${st.quality === i ? ' yellow' : ''}" data-a="q" data-i="${i}">${q.name}</button>`).join('')}<button class="btn${st.auto ? ' green' : ''}" data-a="auto">Tự hạ khi giật: ${st.auto ? 'bật' : 'tắt'}</button><button class="btn${st.fps ? ' green' : ''}" data-a="fps">Hiện FPS: ${st.fps ? 'bật' : 'tắt'}</button>${canFullscreen() ? '<button class="btn" data-a="fs">Toàn màn hình</button>' : ''}</div>
        <h4>Góc nhìn</h4><div style="display:flex;gap:.6em;align-items:center;flex-wrap:wrap"><button class="btn ${st.cam3 ? 'green' : ''}" data-a="cam3">${st.cam3 ? 'Đang ở góc nhìn thứ ba' : 'Đang ở góc nhìn thứ nhất'} — bấm để đổi</button><span class="muted">Góc nhìn thứ ba cho thấy quần áo, kiểu tóc bạn mua. Phím tắt: V.</span></div>
        <h4>Nút bấm và cỡ chữ</h4><div style="display:flex;gap:.6em;align-items:center;flex-wrap:wrap"><button class="btn yellow" data-a="layout">Sắp xếp vị trí, độ lớn các nút</button><span class="muted">Kéo từng nút tới chỗ vừa tay, phóng to hay thu nhỏ tuỳ ý.</span></div>
        <h4>Cỡ chữ, nút và thanh trạng thái <span class="muted" id="uiscale-v">${Math.round(st.ui.scale * 100)}%</span></h4>
        <div class="uiscale"><span class="muted">Nhỏ</span><input type="range" min="${UI_SCALE[0] * 100}" max="${UI_SCALE[1] * 100}" step="5" value="${Math.round(st.ui.scale * 100)}" data-r="uiscale"><span class="muted">To</span></div>
        <div class="uiprev" id="uiprev"><span class="chip">${ic('dish')} Độ no</span><span class="stat" style="color:#fff7e4"><span style="display:flex;align-items:center;gap:.25em">${ic('smile')}<i style="display:block;width:3.3em;height:.5em;background:rgba(255,255,255,.22);border-radius:.3em;overflow:hidden"><b style="display:block;height:100%;width:70%;background:var(--green)"></b></i></span></span><button class="ib" style="pointer-events:none">${ic('bag')}</button></div>
        <h4>Âm thanh hiệu ứng</h4><input type="range" min="0" max="100" value="${Math.round(st.sfx * 100)}" data-r="sfx"><h4>Nhạc nền</h4><input type="range" min="0" max="100" value="${Math.round(st.music * 100)}" data-r="music"><h4>Độ nhạy xoay góc nhìn</h4><input type="range" min="30" max="250" value="${Math.round(st.sens * 100)}" data-r="sens">
        <h4>Cách chơi</h4><p class="muted">Điện thoại: ngón trái kéo để đi, ngón phải vuốt để nhìn, chạm vào người hoặc đồ vật (hay nút tròn vàng) để tương tác. Máy tính: W A S D đi, giữ Shift chạy, kéo chuột để nhìn, E tương tác, Tab túi đồ, B sổ tay, M bản đồ. Game tự lưu sau mỗi việc quan trọng.</p>`,
        `<button class="btn green" data-a="save">Lưu ngay</button><button class="btn" data-a="menu">Về màn hình chính</button>`);
      M.querySelectorAll('input[type=range]').forEach((inp) => ((inp as HTMLInputElement).oninput = () => { const k = (inp as HTMLElement).dataset.r as 'sfx' | 'music' | 'sens' | 'uiscale', v = +(inp as HTMLInputElement).value / 100; if (k === 'uiscale') { st.ui.scale = v; ui.layout(); const lab = M.querySelector('#uiscale-v'); if (lab) lab.textContent = Math.round(v * 100) + '%'; } else st[k] = v; ctx.sound.setVol(st.sfx, st.music); saveSettings(); }));
    } else if (name === 'summary') {
      const L = g.hist[g.hist.length - 1]; if (!L) { ui.closePanel(); return; }
      const pf = profitOf(L), kv = (k: string, v: number, neg = false) => (v ? `<div class="kv"><span>${k}</span><b class="${neg ? 'neg' : 'pos'}">${neg ? '−' : '+'}${money(v)}</b></div>` : '');
      const due = g.debts.map((d) => `${LENDERS[d.lender].name}: ${money(d.owed)} (${g.day > d.due ? 'QUÁ HẠN' : 'hạn ngày ' + (d.due + 1)})`).join(' · ');
      draw(`${ic('book')} Tổng kết ngày ${L.day + 1}`, [], `<div class="grid2"><div>${kv('Doanh thu bán hàng', L.revenue)}${kv('Tiền boa', L.tips)}${kv('Thu nhập khác', L.side)}${kv('Giá vốn hàng bán', L.cogs, true)}${kv('Phí, phạt', L.fees, true)}${kv('Tiền nhà', L.rent, true)}${kv('Dụng cụ', L.gear, true)}${kv('Hao hụt', L.loss, true)}${kv('Lãi vay', L.interest, true)}${kv('Ăn uống', L.food, true)}${kv('Chi khác', L.other, true)}<div class="kv sum"><span>${pf >= 0 ? 'Lãi' : 'Lỗ'}</span><b class="${pf < 0 ? 'neg' : 'pos'}">${money(pf)}</b></div></div>
        <div><p>Bán ${L.sold} phần cho ${L.customers} khách, để mất ${L.lost} khách.${L.rated ? ` Điểm trung bình ${(L.stars / L.rated).toFixed(1).replace('.', ',')} ${ic('starf')}.` : ''}</p><p>Uy tín: <b>${Math.round(g.rep)}</b> · Tay nghề cấp <b>${R.level(g)}</b> · Tiền mặt <b>${money(g.cash)}</b></p>${due ? `<p class="neg">Nợ: ${due}</p>` : ''}<p class="muted">Thời tiết sáng nay: ${WEATHER[g.weather.now].name.toLowerCase()}. ${WEATHER[g.weather.now].say}</p></div></div>`, `<button class="btn green" data-a="close">Sang ngày mới</button>`);
    } else if (name === 'bankrupt') {
      acts.again = () => { R.goBankrupt(g); ctx.stall.reset(); const a = ctx.world.anchors.bed_gamcau; ctx.player.place(a.x, a.z - 1.2, Math.PI); ui.closePanel(); toast('Trắng tay. Nhưng bạn vẫn còn đôi bàn tay và những công thức đã học.', 'info', 'heart', true); };
      draw(`${ic('skull')} Phá sản`, [], `<p style="font-family:'Patrick Hand';font-size:1.25em">Nợ chồng nợ, quầy hàng bị siết, tiền nhà không còn. Chủ nợ lấy sạch những gì bạn có rồi mới chịu buông tha.</p><p>Bạn trở lại gầm cầu với vài đồng lẻ. Uy tín sụt giảm, ngân hàng từ chối cho vay một thời gian — nhưng các công thức đã học và tay nghề thì không ai lấy được.</p>`, `<button class="btn red" data-a="again">Làm lại từ đầu ở gầm cầu</button>`);
      (M.querySelector('.x') as HTMLElement).style.display = 'none';
    }
  }
  tab = name === ui.modalName && tab ? tab : tab; build();
  void bus; void TIERS; void junkWeight; void round1k; void hourOf;
}

function drawMap(c: HTMLCanvasElement | null, places: { x: number; z: number; name: string }[]) {
  if (!c) return; const g = c.getContext('2d')!, W = c.width, H = c.height, x0 = MAP.x0 - 4, z0 = MAP.z0 - 4, sx = W / (MAP.x1 - MAP.x0 + 8), sz = H / (MAP.z1 - MAP.z0 + 8), X = (x: number) => (x - x0) * sx, Z = (z: number) => (z - z0) * sz;
  g.fillStyle = '#cfc6b2'; g.fillRect(0, 0, W, H); g.fillStyle = '#8fb6c9'; g.fillRect(0, Z(108), W, H); g.fillStyle = '#9a968c'; g.fillRect(0, Z(95), W, Z(108) - Z(95));
  g.fillStyle = '#6b6f78'; for (const k of CORR) { g.fillRect(X(k - 3.5), 0, 7 * sx, Z(92)); g.fillRect(0, Z(k - 3.5), W, 7 * sz); }
  const cols: Record<string, string> = { vanphong: '#b8c6d2', nhagiau: '#efe6d6', congvien: '#8fc77a', cho: '#f2d98c', trungtam: '#f4c7b8', dancu: '#d9e6a8', laodong: '#d6c1a8', nhanghi: '#e8b59a', khobai: '#a8b0a8' };
  const names = [['vanphong', 'nhagiau', 'congvien'], ['cho', 'trungtam', 'dancu'], ['laodong', 'nhanghi', 'khobai']];
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let bz = 0; bz < 3; bz++) for (let bx = 0; bx < 3; bx++) { const d = names[bz][bx]; g.fillStyle = cols[d]; g.fillRect(X(BX[bx][0]), Z(BX[bz][0]), 46 * sx, 46 * sz); g.strokeStyle = '#7a6252'; g.lineWidth = 1.5; g.strokeRect(X(BX[bx][0]), Z(BX[bz][0]), 46 * sx, 46 * sz);
    g.fillStyle = 'rgba(59,42,30,.55)'; g.font = '700 15px "Baloo 2", sans-serif'; g.fillText(DISTRICT[d as keyof typeof DISTRICT].name, X((BX[bx][0] + BX[bx][1]) / 2), Z((BX[bz][0] + BX[bz][1]) / 2)); }
  g.fillStyle = 'rgba(59,42,30,.6)'; g.fillText('Gầm Cầu Vượt', W / 2, Z(101.5));
  for (const l of LOTS) if (l.id && l.kind !== 'spot') { const [x, z] = lotPoint(l, l.w / 2, l.d / 2); g.fillStyle = '#7a4a32'; g.fillRect(X(x) - 5, Z(z) - 5, 10, 10); }
  for (const sp of SPOTS) { g.strokeStyle = '#d9463c'; g.lineWidth = 3; g.beginPath(); g.arc(X(sp.x), Z(sp.z), 8, 0, 7); g.stroke(); g.fillStyle = '#ffd24d'; g.fill(); }
  g.font = '600 12px "Baloo 2", sans-serif'; g.lineWidth = 3; g.strokeStyle = 'rgba(255,247,228,.9)';
  for (const p of places) { g.fillStyle = '#3b2a1e'; g.beginPath(); g.arc(X(p.x), Z(p.z), 3.5, 0, 7); g.fill(); const t = p.name.replace(/ \(.*\)/, ''); g.strokeText(t, X(p.x), Z(p.z) - 11); g.fillText(t, X(p.x), Z(p.z) - 11); }
  const s = ctx.g.stall; if (s.where === 'placed' || s.where === 'home') { g.fillStyle = '#d9463c'; g.beginPath(); g.moveTo(X(s.x), Z(s.z) - 12); g.lineTo(X(s.x) + 9, Z(s.z) + 6); g.lineTo(X(s.x) - 9, Z(s.z) + 6); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
  const w = ctx.acts.way; if (w) { g.strokeStyle = '#f5c531'; g.lineWidth = 4; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(X(ctx.player.x), Z(ctx.player.z)); g.lineTo(X(w.x), Z(w.z)); g.stroke(); g.setLineDash([]); }
  const p = ctx.player; g.save(); g.translate(X(p.x), Z(p.z)); g.rotate(-p.yaw + Math.PI); g.fillStyle = '#2f8fd5'; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -13); g.lineTo(9, 10); g.lineTo(0, 5); g.lineTo(-9, 10); g.closePath(); g.fill(); g.stroke(); g.restore();
}
