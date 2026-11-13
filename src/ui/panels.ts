// CÁC BẢNG LỚN: túi đồ, quầy hàng (thực đơn – giá – sơ chế – kho), chỗ cất đồ, sổ tay (công thức, sổ sách, nợ), bản đồ, cài đặt.
import { ctx, QUALITY, saveSettings, canFullscreen, toggleFullscreen, UI_SCALE } from '../game/ctx';
import type { UI } from './ui';
import { ic, el, esc, dishIcon } from './ui';
import { INGS } from '../data/ingredients';
import { RECIPE_LIST, RECIPES, CAT_LABEL, STEP_NAME, toolsFor, RecipeDef } from '../data/recipes';
import { GEAR, HOUSING, LENDERS, JUNK, TIERS } from '../data/gear';
import { SHOPS } from '../data/shops';
import { REGULARS, FIXED } from '../data/people';
import { WEATHER } from '../data/world';
import { Game, Stack, LedgerDay, weightOf, moveStack, junkWeight, hourOf, purge, isSpoiled } from '../sim/state';
import * as R from '../sim/rules';
import { money, qty, clamp, round1k, dist2, hhmm } from '../core/util';
import { toast, sfx, bus } from '../core/bus';
import { BX, CORR, SPOTS, LOTS, lotPoint, DISTRICT, MAP } from '../world/layout';

let tab = '';
const fresh = (s: Stack) => { const d = INGS[s.id]; if (d.shelf > 9000) return ''; const f = Math.round(s.fresh); return `<span class="tag ${f < 35 ? 'bad' : f < 60 ? 'warn' : 'good'}">${f < 10 ? 'hỏng' : 'tươi ' + f + '%'}</span>`; };
export const profitOf = (l: LedgerDay) => l.revenue + l.tips + l.side - l.cogs - l.fees - l.rent - l.gear - l.loss - l.interest - l.food - l.other;
const stallNear = (g: Game) => g.stall.tier > 0 && (g.stall.where === 'carried' || ((g.stall.where === 'placed' || g.stall.where === 'home') && dist2(g.stall.x, g.stall.z, ctx.player.x, ctx.player.z) < 8 * 8));

export function openPanel(ui: UI, name: string) {
  const M = ui.$('modal'), g = ctx.g;
  const draw = (title: string, tabs: [string, string][], body: string, foot = '') => {
    M.innerHTML = `<div class="panel"><header><h2>${title}</h2><div class="tabs">${tabs.map(([id, t]) => `<button class="tab${id === tab ? ' on' : ''}" data-tab="${id}">${t}</button>`).join('')}</div><button class="x" data-a="close">${ic('x')}</button></header><div class="body">${body}</div>${foot ? `<div class="foot">${foot}</div>` : ''}</div>`;
  };
  const acts: Record<string, (i: number, e: HTMLElement) => void> = { close: () => ui.closePanel() };
  const render = () => { const sc = (M.querySelector('.body') as HTMLElement | null)?.scrollTop ?? 0; build(); const b = M.querySelector('.body') as HTMLElement | null; if (b) b.scrollTop = sc; };
  M.onclick = (e) => {
    const t = e.target as HTMLElement; if (t === M) { ui.closePanel(); return; }
    const tb = t.closest('[data-tab]') as HTMLElement | null; if (tb) { tab = tb.dataset.tab!; sfx('ui'); render(); return; }
    const a = t.closest('[data-a]') as HTMLElement | null; if (a && !a.classList.contains('off')) { const f = acts[a.dataset.a!]; if (f) { f(+(a.dataset.i ?? 0), a); if (ui.modalName === name) render(); } }
  };
  const stackList = (list: Stack[], btns: (s: Stack, i: number) => string, empty: string) => list.length ? `<div class="list">${list.map((s, i) => { const d = INGS[s.id]; return `<div class="item"><div class="grow"><b>${d.name} <span class="muted">× ${qty(s.n)} ${d.unit}</span></b><small>${(s.n * d.kg).toFixed(2).replace('.', ',')} kg · vốn ${money(s.cost)}/${d.unit} ${d.cold ? '· cần lạnh' : ''}</small></div>${fresh(s)}${btns(s, i)}</div>`; }).join('')}</div>` : `<p class="muted">${empty}</p>`;

  function build() {
    const s = g.stall, T = R.tier(g);
    if (name === 'bag') {
      if (!['bag', 'gear'].includes(tab)) tab = 'bag';
      const near = stallNear(g), cap = R.carryCap(g), w = R.bagWeight(g);
      acts.eat = (i) => ctx.acts.eat(g.bag, i); acts.drop = (i) => { g.bag.splice(i, 1); }; acts.dropj = (_i, e) => { delete g.junk[e.dataset.k!]; };
      acts.toStall = (i) => { const k = moveStack(g.bag, s.store, i, 1e9, R.stallRoom(g)); if (!k) toast('Quầy đầy rồi.', 'warn'); else sfx('pick'); };
      let body = '';
      if (tab === 'bag') {
        body = `<div class="bar"><b style="width:${clamp(w / cap) * 100}%;background:${w > cap ? 'var(--red)' : ''}"></b></div><p class="muted">Đang mang ${w.toFixed(1).replace('.', ',')} / ${cap} kg${w > cap * 0.85 ? ' — nặng quá nên đi chậm!' : ''}</p>` +
          stackList(g.bag, (st, i) => (INGS[st.id].eat ? `<button class="btn small green" data-a="eat" data-i="${i}">${INGS[st.id].eat!.t && !INGS[st.id].eat!.h ? 'Uống' : 'Ăn'}</button>` : '') + (near ? `<button class="btn small" data-a="toStall" data-i="${i}">› Quầy</button>` : '') + `<button class="btn small" data-a="drop" data-i="${i}">Bỏ</button>`, 'Túi trống trơn. Ra chợ mua nguyên liệu: tự tay bốc hàng ở sạp rồi đưa người bán tính tiền.');
        const junk = Object.entries(g.junk).filter(([, n]) => n > 0);
        if (junk.length) body += `<h4>Đồ nhặt được</h4><div class="list">${junk.map(([k, n]) => `<div class="item"><div class="grow"><b>${JUNK[k].name} × ${n}</b><small>Bán ở ${JUNK[k].where === 'scrap' ? 'vựa ve chai Tư Rác' : 'tiệm cầm đồ Chú Lâm'}: ${money(JUNK[k].price * n)}</small></div><button class="btn small" data-a="dropj" data-k="${k}">Bỏ</button></div>`).join('')}</div>`;
      } else {
        const ids = Object.keys(g.gear);
        body = ids.length ? `<div class="list">${ids.map((id) => `<div class="item"><div class="grow"><b>${GEAR[id].name}</b><small>${GEAR[id].desc}</small></div>${GEAR[id].wear ? `<span class="tag ${g.gear[id] < 25 ? 'bad' : ''}">còn ${Math.round(g.gear[id])}%</span>` : ''}</div>`).join('')}</div>` : '<p class="muted">Chưa có dụng cụ nào. Ghé tiệm Đồ Nghề Ba Tài ở Phố Trung Tâm.</p>';
        body += `<h4>Chỗ ở</h4><p>${HOUSING[g.housing].name} — ${HOUSING[g.housing].desc}${HOUSING[g.housing].rent ? ` Đã trả tới hết ngày ${g.paidUntil}.` : ''}</p>`;
      }
      draw(`${ic('bag')} Túi đồ`, [['bag', 'Nguyên liệu'], ['gear', 'Dụng cụ']], body, `<span class="muted">Tiền mặt ${money(g.cash)}${g.bank ? ' · ngân hàng ' + money(g.bank) : ''}</span>`);
    } else if (name === 'stall') {
      if (!['menu', 'store', 'info'].includes(tab)) tab = 'menu';
      const placed = s.where === 'placed';
      acts.sw = (_i, e) => { const rs = g.rec[e.dataset.k!], on = R.menuOf(g).length; if (!rs.on && on >= T.menu) { toast(`${T.name} chỉ bán được tối đa ${T.menu} món cùng lúc.`, 'warn'); return; } rs.on = !rs.on; sfx('ui'); };
      acts.pm = (_i, e) => { const rs = g.rec[e.dataset.k!]; rs.price = clamp(rs.price + +e.dataset.d!, 1000, 500000); };
      acts.sug = (_i, e) => { const r = RECIPES[e.dataset.k!]; g.rec[r.id].price = R.suggestPrice(g, r); };
      acts.prep = (_i, e) => { const r = RECIPES[e.dataset.k!]; ui.closePanel(); ctx.cook.prep(r); };
      acts.make = (_i, e) => { const r = RECIPES[e.dataset.k!]; ui.closePanel(); ctx.cook.finish(r); };
      acts.eatd = (i) => ctx.acts.eatDish(i);
      acts.toBag = (i) => { const room = R.carryCap(g) - R.bagWeight(g), k = moveStack(s.store, g.bag, i, 1e9, room); if (!k) toast('Túi đầy rồi.', 'warn'); else sfx('pick'); };
      acts.toStall = (i) => { const k = moveStack(g.bag, s.store, i, 1e9, R.stallRoom(g)); if (!k) toast('Quầy đầy rồi.', 'warn'); else sfx('pick'); };
      acts.open = () => { if (s.open) ctx.stall.close(); else if (ctx.stall.open()) ui.closePanel(); };
      acts.pack = () => { if (ctx.stall.pickUp()) ui.closePanel(); };
      acts.clean = () => { R.advance(g, 12, ctx.acts.act()); s.dirt = 0; g.st.hygiene = clamp(g.st.hygiene - 1.5, 0, 100); sfx('splash'); toast('Lau dọn quầy sạch bong.', 'good'); };
      acts.dump = () => { const lost = s.ready.reduce((a, x) => a + x.n * x.cost, 0) + purge(s.store).lost; s.ready = []; g.led.loss += lost; toast(`Đổ bỏ đồ ế và đồ hỏng (${money(lost)}).`, 'info'); };
      let body = '';
      if (tab === 'menu') {
        const known = RECIPE_LIST.filter((r) => g.rec[r.id].known);
        body = `<p class="muted">Bật món muốn bán (tối đa ${T.menu} món), chỉnh giá theo giá vốn. Giá cao quá khách bỏ đi; chất lượng và uy tín càng cao thì khách càng chịu trả. Uy tín hiện tại ${Math.round(g.rep)}.</p><div class="list">` + known.map((r) => {
          const rs = g.rec[r.id], c = R.recipeCost(g, r), mg = R.marginOf(rs.price, c.total), miss = R.missingTools(g, r), rd = R.readyCount(g, r.id), pr = s.preps.filter((p) => p.rid === r.id).reduce((a, p) => a + p.n, 0), can = R.finishPossible(g, r), pp = R.prepPossible(g, r);
          const tags = miss.length ? `<span class="tag bad">thiếu ${miss.map((t) => (t === 'bep' ? 'bếp' : GEAR[t].name.toLowerCase())).join(', ')}</span>` : `<span class="tag ${rd ? 'good' : ''}">sẵn ${rd}</span>` + (R.hasPrep(r) ? `<span class="tag ${pr ? 'good' : 'warn'}">đã sơ chế ${pr} phần</span>` : '') + `<span class="tag ${can ? '' : 'bad'}">làm được ${can > 900 ? '—' : can} phần</span>`;
          const ri = s.ready.findIndex((x) => x.rid === r.id);
          return `<div class="item${miss.length ? ' off' : ''}" style="flex-wrap:wrap"><img src="${dishIcon(r)}" style="width:2.6em;height:2.6em" alt=""><div class="grow"><b>${r.name}</b><small>Vốn ${money(c.total)}/phần · thị trường ~${money(r.ref)} · <span class="${mg < 0.2 ? 'neg' : 'pos'}">lãi ${Math.round(mg * 100)}%</span></small>${tags}</div>
            <div class="price"><button class="btn small" data-a="pm" data-k="${r.id}" data-d="-1000">−</button><b>${money(rs.price)}</b><button class="btn small" data-a="pm" data-k="${r.id}" data-d="1000">+</button></div>
            <button class="sw${rs.on ? ' on' : ''}${miss.length ? ' off' : ''}" data-a="sw" data-k="${r.id}"></button>
            <div style="flex-basis:100%;display:flex;gap:.3em;flex-wrap:wrap;justify-content:flex-end">${R.hasPrep(r) ? `<button class="btn small yellow${!placed || miss.length || pp < 1 ? ' off' : ''}" data-a="prep" data-k="${r.id}">${ic('knife')} Sơ chế ${pp || ''} phần</button>` : ''}<button class="btn small${!placed || miss.length || can < 1 ? ' off' : ''}" data-a="make" data-k="${r.id}">${ic('fire')} Làm sẵn ${Math.min(r.serve, can)}</button>${ri >= 0 ? `<button class="btn small green" data-a="eatd" data-i="${ri}">Ăn 1 phần</button>` : ''}<button class="btn small" data-a="sug" data-k="${r.id}">Giá gợi ý</button></div></div>`;
        }).join('') + '</div>' + (placed ? '' : '<p class="muted">Quầy chưa đặt ở chỗ bán nên chưa nấu được — hãy gánh tới một vòng sáng vàng.</p>');
      } else if (tab === 'store') {
        const chilled = R.stallChilled(g);
        body = `<div class="grid2"><div><h4>Trong quầy (${weightOf(s.store).toFixed(1).replace('.', ',')}/${T.cap} kg)${chilled ? ' · đang ướp đá' : ''}</h4>${stackList(s.store, (_s, i) => `<button class="btn small" data-a="toBag" data-i="${i}">› Túi</button>`, 'Quầy chưa có nguyên liệu.')}</div><div><h4>Trong túi (${R.bagWeight(g).toFixed(1).replace('.', ',')}/${R.carryCap(g)} kg)</h4>${stackList(g.bag, (_s, i) => `<button class="btn small" data-a="toStall" data-i="${i}">› Quầy</button>`, 'Túi trống.')}</div></div>` +
          (s.preps.length ? `<h4>Đã sơ chế</h4>${s.preps.map((p) => `<span class="tag ${R.holdFactor(g, RECIPES[p.rid], p.at) < 1 ? 'warn' : 'good'}">${RECIPES[p.rid].short}: ${p.n} phần · ${Math.round(p.q * 100)}đ${R.holdFactor(g, RECIPES[p.rid], p.at) < 1 ? ' · để lâu, kém ngon' : ''}</span>`).join('')}` : '') +
          (R.has(g, 'thungda') && !chilled ? '<p class="muted">Có thùng đá nhưng chưa có đá viên — mua đá ở tạp hoá Cô Ba để giữ lạnh thịt cá.</p>' : !R.has(g, 'thungda') ? '<p class="muted">Chưa có thùng đá: thịt cá để ngoài trời nóng rất mau hỏng.</p>' : '');
      } else {
        const sp = ctx.stall.spot(), rate = R.arrivalRate(g);
        body = `<div class="grid2"><div><div class="kv"><span>Loại quầy</span><b>${T.name}</b></div><div class="kv"><span>Vị trí</span><b>${sp ? sp.name : s.where === 'home' ? 'Ở chỗ ở' : '—'}</b></div><div class="kv"><span>Phí chỗ</span><b>${sp ? (sp.fee ? money(sp.fee) + '/ngày' : 'miễn phí') : '—'}</b></div><div class="kv"><span>Tình trạng</span><b class="${s.cond < 40 ? 'neg' : ''}">${Math.round(s.cond)}%</b></div><div class="kv"><span>Độ bẩn</span><b class="${s.dirt > 40 ? 'neg' : ''}">${Math.round(s.dirt)}%</b></div><div class="kv"><span>Độ thu hút</span><b>${Math.round(R.stallAppeal(g) * 100)}%</b></div><div class="kv"><span>Ước lượng khách</span><b>${s.open ? '~' + rate.toFixed(1).replace('.', ',') + ' người/giờ' : 'chưa mở'}</b></div></div>
          <div><p class="muted">${sp ? sp.note : 'Gánh quầy tới một chỗ bán (vòng vàng) để bày hàng.'} Bảng hiệu, ô dù, đèn, bàn ghế đều làm quầy hút khách hơn. Quầy bẩn hoặc người bán lem luốc sẽ bị chê và dễ bị phạt khi kiểm tra.</p>' + (T.tier >= 3 && g.flags.sapNo ? '<p class="neg">Đang nợ phí chỗ — mở bán sẽ trừ tiền trước.</p>' : '') + '<div style="display:flex;gap:.4em;flex-wrap:wrap"><button class="btn${s.dirt < 3 ? ' off' : ''}" data-a="clean">Lau dọn quầy (12 phút)</button><button class="btn${s.ready.length || s.store.some(isSpoiled) ? '' : ' off'}" data-a="dump">Đổ bỏ đồ ế, đồ hỏng</button></div></div></div>`;
      }
      draw(`${ic('shop')} ${T.name}`, [['menu', 'Thực đơn'], ['store', 'Kho quầy'], ['info', 'Quầy']], body, placed ? `<button class="btn ${s.open ? 'red' : 'green'}" data-a="open">${s.open ? 'Đóng quầy' : 'MỞ BÁN'}</button>${T.tier < 3 ? `<button class="btn" data-a="pack">Dọn hàng, mang đi</button>` : ''}<span class="muted">Hôm nay: ${g.led.sold} phần · ${money(g.led.revenue + g.led.tips)}</span>` : T.tier < 3 ? `<button class="btn" data-a="pack">Mang quầy đi</button>` : `<span class="muted">Chạm vào vòng sáng vàng ngoài phố để đặt sạp.</span>`);
    } else if (name === 'home') {
      const h = HOUSING[g.housing];
      acts.take = (i) => { const k = moveStack(g.home, g.bag, i, 1e9, R.carryCap(g) - R.bagWeight(g)); if (!k) toast('Túi đầy rồi.', 'warn'); else sfx('pick'); };
      acts.put = (i) => { const k = moveStack(g.bag, g.home, i, 1e9, R.homeRoom(g)); if (!k) toast('Chỗ cất đã đầy.', 'warn'); else sfx('pick'); };
      draw(`${ic('home')} ${h.name}`, [], `<p class="muted">${h.desc} Độ an toàn ${Math.round(h.safety * 100)}%${R.homeChilled(g) ? ' · có giữ lạnh' : ''}.</p><div class="grid2"><div><h4>Đang cất (${weightOf(g.home).toFixed(1).replace('.', ',')}/${h.storage} kg)</h4>${stackList(g.home, (_s, i) => `<button class="btn small" data-a="take" data-i="${i}">› Túi</button>`, 'Chưa cất gì.')}</div><div><h4>Trong túi</h4>${stackList(g.bag, (_s, i) => `<button class="btn small" data-a="put" data-i="${i}">→ Cất</button>`, 'Túi trống.')}</div></div>`);
    } else if (name === 'book') {
      if (!['rec', 'led', 'debt'].includes(tab)) tab = 'rec';
      let body = '';
      if (tab === 'rec') {
        const row = (r: RecipeDef) => { const rs = g.rec[r.id], tools = toolsFor(r).map((t) => (t === 'bep' ? 'bếp' : GEAR[t].name.toLowerCase()));
          if (!rs.known) return `<div class="item off"><img src="${dishIcon(r)}" style="width:2.4em;height:2.4em;filter:grayscale(1)" alt=""><div class="grow"><b>${r.name}</b><small>Học từ ${R.hasMet(g, r.learn!.from) ? FIXED[r.learn!.from]?.name : R.fixedLabel(g, r.learn!.from).toLowerCase()} (${SHOPS[r.learn!.from]?.name ?? 'Quán cơm Bà Tư'}) — ${money(r.learn!.cost)} · cần tay nghề cấp ${r.learn!.skill}</small></div></div>`;
          return `<div class="item" style="align-items:flex-start"><img src="${dishIcon(r)}" style="width:2.8em;height:2.8em" alt=""><div class="grow"><b>${r.name} <span class="tag">${CAT_LABEL[r.cat]}</span></b><small>${r.desc}</small>
            <small><b>Một phần:</b> ${Object.entries(r.ings).map(([id, n]) => `${INGS[id].name.toLowerCase()} ${qty(n)} ${INGS[id].unit}`).join(' · ')}</small>
            <small><b>Dụng cụ:</b> ${tools.join(', ') || 'không cần'} · <b>Sơ chế</b> (mẻ ${r.batch} phần): ${r.prep.map((s) => ('label' in s && s.label ? s.label : s.t === 'cut' ? `thái ${INGS[s.ing].name.toLowerCase()}` : STEP_NAME[s.t])).join(' › ') || 'không'} · <b>Khi khách gọi:</b> ${r.finish.map((s) => ('label' in s && s.label ? s.label : STEP_NAME[s.t])).join(' › ')}</small>
            <small>Đã bán ${rs.made} phần · ngon nhất ${Math.round(rs.best * 100)} điểm · giá thị trường ~${money(r.ref)}</small></div></div>`; };
        body = `<p class="muted">Tay nghề cấp ${R.level(g)}. Nguyên liệu mua ở Chợ Xóm Chiều (rẻ, tươi nhất buổi sáng), MiniMart (đắt hơn, mở khuya) hay tạp hoá Cô Ba (than, gas, đá).</p><div class="list">${RECIPE_LIST.filter((r) => g.rec[r.id].known).map(row).join('')}</div><h4>Chưa học</h4><div class="list">${RECIPE_LIST.filter((r) => !g.rec[r.id].known).map(row).join('')}</div>`;
      } else if (tab === 'led') {
        const L = g.led, kv = (k: string, v: number, neg = false) => (v ? `<div class="kv"><span>${k}</span><b class="${neg ? 'neg' : 'pos'}">${neg ? '−' : '+'}${money(v)}</b></div>` : ''), pf = profitOf(L);
        body = `<div class="grid2"><div><h4>Hôm nay (ngày ${g.day + 1})</h4>${kv('Doanh thu bán hàng', L.revenue)}${kv('Tiền boa', L.tips)}${kv('Việc ngoài, xin, ve chai', L.side)}${kv('Giá vốn hàng đã bán', L.cogs, true)}${kv('Phí chỗ, tiền phạt, bảo kê', L.fees, true)}${kv('Tiền nhà', L.rent, true)}${kv('Mua sắm dụng cụ', L.gear, true)}${kv('Hao hụt, đồ hỏng, mất trộm', L.loss, true)}${kv('Lãi vay và phí', L.interest, true)}${kv('Ăn uống', L.food, true)}${kv('Chi khác', L.other, true)}
          <div class="kv sum"><span>Lãi / lỗ trong ngày</span><b class="${pf < 0 ? 'neg' : 'pos'}">${money(pf)}</b></div><p class="muted">Phục vụ ${L.customers} khách (${L.sold} phần) · mất ${L.lost} khách · điểm trung bình ${L.rated ? (L.stars / L.rated).toFixed(1).replace('.', ',') : '—'} ${ic('starf')}</p></div>
          <div><h4>Những ngày qua</h4>${g.hist.length ? g.hist.slice(-8).reverse().map((d) => `<div class="kv"><span>Ngày ${d.day + 1} · ${d.sold} phần</span><b class="${profitOf(d) < 0 ? 'neg' : 'pos'}">${money(profitOf(d))}</b></div>`).join('') : '<p class="muted">Chưa có dữ liệu.</p>'}
          <h4>Tổng kết</h4><div class="kv"><span>Tổng số phần đã bán</span><b>${g.tot.served}</b></div><div class="kv"><span>Ngày bán chạy nhất</span><b>${money(g.tot.best)}</b></div><div class="kv"><span>Tiền xin được</span><b>${money(g.tot.begged)}</b></div><div class="kv"><span>Tiền bán ve chai</span><b>${money(g.tot.scrap)}</b></div></div></div>`;
      } else {
        body = `<h4>Nợ nần</h4>` + (g.debts.length ? `<div class="list">${g.debts.map((d) => `<div class="item"><div class="grow"><b>${LENDERS[d.lender].name}: ${money(d.owed)}</b><small>Vay ${money(d.principal)} ngày ${d.taken + 1} · lãi ${(LENDERS[d.lender].rate * 100).toFixed(1)}%/ngày</small></div><span class="tag ${g.day > d.due ? 'bad' : g.day === d.due ? 'warn' : ''}">${g.day > d.due ? 'QUÁ HẠN ' + (g.day - d.due) + ' ngày' : 'hạn: ngày ' + (d.due + 1)}</span></div>`).join('')}</div>` : '<p class="muted">Không nợ ai đồng nào.</p>') +
          `<p class="muted">Tiết kiệm ngân hàng: ${money(g.bank)}. ${g.credit > g.day ? 'Bạn đang bị ngân hàng từ chối cho vay tới ngày ' + (g.credit + 1) + '.' : ''} Trả nợ tại chỗ người cho vay: Ngân hàng Sao Vàng (Phố Văn Phòng), Hùng Sẹo (sân trong Xóm Lao Động), Cô Ba (tạp hoá).</p>
          <h4>Khách quen</h4><div class="list">${REGULARS.map((r) => { const rel = R.hasMet(g, r.id) ? g.rel[r.id] : undefined; return `<div class="item${rel?.n ? '' : ' off'}"><div class="grow"><b>${rel?.n ? r.name : '???'}</b><small>${rel?.n ? r.note + ' Thường ghé lúc ' + hhmm(r.hour * 60) + '. Thích: ' + r.likes.map((c) => CAT_LABEL[c].toLowerCase()).join(', ') + '.' : 'Chưa quen ai ở giờ này.'}</small></div><span class="tag ${(rel?.v ?? 0) > 20 ? 'good' : ''}">${rel?.n ? 'thân ' + Math.round(rel.v) : '—'}</span></div>`; }).join('')}</div>`;
      }
      draw(`${ic('book')} Sổ tay`, [['rec', 'Công thức'], ['led', 'Sổ sách'], ['debt', 'Nợ & khách quen']], body);
    } else if (name === 'map') {
      const places = ctx.acts.places(); acts.go = (i) => { ctx.acts.way = places[i]; ui.closePanel(); toast(`Đã ghim: ${places[i].name}. Đi theo mũi tên và cột sáng vàng.`, 'info', 'pin'); }; acts.clear = () => { ctx.acts.way = null; };
      draw(`${ic('map')} Bản đồ khu phố`, [], `<div class="grid2"><canvas id="map" width="640" height="610"></canvas><div><p class="muted">Chạm một địa điểm để ghim đường đi.</p><div class="list">${places.map((p, i) => `<button class="btn small" style="justify-content:flex-start" data-a="go" data-i="${i}">${ic('pin')} ${p.name} <span class="muted">· ${Math.round(Math.hypot(p.x - ctx.player.x, p.z - ctx.player.z))} m</span></button>`).join('')}</div></div></div>`, ctx.acts.way ? `<button class="btn" data-a="clear">Bỏ ghim “${esc(ctx.acts.way.name)}”</button>` : '');
      drawMap(document.getElementById('map') as HTMLCanvasElement, places);
    } else if (name === 'settings') {
      const st = ctx.set;
      acts.q = (i) => { st.quality = i; st.auto = false; ctx.applyQuality(); saveSettings(); }; acts.fps = () => { st.fps = !st.fps; saveSettings(); }; acts.auto = () => { st.auto = !st.auto; saveSettings(); };
      acts.fs = () => { void toggleFullscreen(); }; acts.layout = () => ui.editLayout(); acts.save = () => { ctx.save('thu cong'); toast('Đã lưu game.', 'good'); }; acts.menu = () => { ctx.save('ve menu'); ui.closePanel(); ctx.toMenu(); };
      draw(`${ic('gear')} Cài đặt`, [], `<h4>Đồ hoạ</h4><div style="display:flex;gap:.4em;flex-wrap:wrap">${QUALITY.map((q, i) => `<button class="btn${st.quality === i ? ' yellow' : ''}" data-a="q" data-i="${i}">${q.name}</button>`).join('')}<button class="btn${st.auto ? ' green' : ''}" data-a="auto">Tự hạ khi giật: ${st.auto ? 'bật' : 'tắt'}</button><button class="btn${st.fps ? ' green' : ''}" data-a="fps">Hiện FPS: ${st.fps ? 'bật' : 'tắt'}</button>${canFullscreen() ? '<button class="btn" data-a="fs">Toàn màn hình</button>' : ''}</div>
        <h4>Nút bấm và cỡ chữ</h4><div style="display:flex;gap:.6em;align-items:center;flex-wrap:wrap"><button class="btn yellow" data-a="layout">Sắp xếp vị trí, độ lớn các nút</button><span class="muted">Kéo từng nút tới chỗ vừa tay, phóng to hay thu nhỏ tuỳ ý.</span></div>
        <h4>Cỡ chữ và nút của cả màn hình</h4><input type="range" min="${UI_SCALE[0] * 100}" max="${UI_SCALE[1] * 100}" step="5" value="${Math.round(st.ui.scale * 100)}" data-r="uiscale">
        <h4>Âm thanh hiệu ứng</h4><input type="range" min="0" max="100" value="${Math.round(st.sfx * 100)}" data-r="sfx"><h4>Nhạc nền</h4><input type="range" min="0" max="100" value="${Math.round(st.music * 100)}" data-r="music"><h4>Độ nhạy xoay góc nhìn</h4><input type="range" min="30" max="250" value="${Math.round(st.sens * 100)}" data-r="sens">
        <h4>Cách chơi</h4><p class="muted">Điện thoại: ngón trái kéo để đi, ngón phải vuốt để nhìn, chạm vào người hoặc đồ vật (hay nút tròn vàng) để tương tác. Máy tính: W A S D đi, giữ Shift chạy, kéo chuột để nhìn, E tương tác, Tab túi đồ, B sổ tay, M bản đồ. Game tự lưu sau mỗi việc quan trọng.</p>`,
        `<button class="btn green" data-a="save">Lưu ngay</button><button class="btn" data-a="menu">Về màn hình chính</button>`);
      M.querySelectorAll('input[type=range]').forEach((inp) => ((inp as HTMLInputElement).oninput = () => { const k = (inp as HTMLElement).dataset.r as 'sfx' | 'music' | 'sens' | 'uiscale', v = +(inp as HTMLInputElement).value / 100; if (k === 'uiscale') { st.ui.scale = v; ui.layout(); } else st[k] = v; ctx.sound.setVol(st.sfx, st.music); saveSettings(); }));
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
