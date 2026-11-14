// TƯƠNG TÁC: tìm vật/người mà người chơi đang nhìn vào (hoặc chạm vào trên màn hình) và gọi hành động tương ứng.
// Cũng quản lý cửa phòng và cửa cuốn của các tiệm (đóng mở theo giờ).
import * as THREE from 'three';
import { ctx } from './ctx';
import type { Npc } from './npc';
import { placeOpen } from './npc';
import { who, whoIn, known } from './who';
import { SHOPS } from '../data/shops';
import { INGS } from '../data/ingredients';
import { GEAR_LIST, HOUSING, JUNK } from '../data/gear';
import { RECIPES } from '../data/recipes';
import { SPOTS, groundY } from '../world/layout';
import * as R from '../sim/rules';
import { hourOf } from '../sim/state';
import { money, dist2, qty, damp, hhmm } from '../core/util';
import { toast, sfx } from '../core/bus';
import { MB, MAT, shade } from '../gfx/mb';

type Kind = 'slot' | 'npc' | 'stall' | 'spot' | 'door' | 'bed' | 'store' | 'wash' | 'tap' | 'bin' | 'litter' | 'anchor' | 'homeStall' | 'bench';
interface Cand { kind: Kind; ref: any; x: number; y: number; z: number; r: number; prio: number; }
export interface Focus { label: string; sub?: string; act: () => void; alt?: { label: string; act: () => void }; x: number; y: number; z: number; }
const _v = new THREE.Vector3(), _f = new THREE.Vector3();
export class Interact {
  focus: Focus | null = null; private cands: Cand[] = []; private doors: { d: any; m: THREE.Mesh; open: number; want: number }[] = []; private shut: { s: any; m: THREE.Mesh; k: number }[] = []; private T = 0;
  constructor() {
    const W = ctx.world;
    for (const d of W.doors) {
      const mb = new MB(); mb.box(d.w / 2, 0, 0, d.w, d.h, 0.05, d.col, shade(d.col, 1.1), 0.08, true); mb.box(d.w - 0.1, 1.0, 0.04, 0.03, 0.12, 0.04, 0xd9b84a); mb.box(d.w - 0.1, 1.0, -0.04, 0.03, 0.12, 0.04, 0xd9b84a);
      const m = new THREE.Mesh(mb.build(), MAT.litDouble); m.position.set(d.x, 0.13, d.z); m.rotation.y = -d.yaw; ctx.scene.add(m); this.doors.push({ d, m, open: 0, want: 0 });
    }
    for (const s of W.shutters) {
      const mb = new MB(); mb.box(0, 0, 0, s.w, s.h, 0.06, 0x9aa4ad, 0x9aa4ad, 0.12, true); for (let y = 0.15; y < s.h; y += 0.22) mb.box(0, y, -0.035, s.w, 0.03, 0.012, 0x7d8790);
      const m = new THREE.Mesh(mb.build(), MAT.lit); m.position.set(s.x, 0.12, s.z); m.rotation.y = s.yaw; ctx.scene.add(m); this.shut.push({ s, m, k: 0 });
    }
  }
  private add(kind: Kind, ref: any, x: number, y: number, z: number, r = 2.3, prio = 0) { this.cands.push({ kind, ref, x, y, z, r, prio }); }
  private collect() {
    const C = this.cands, p = ctx.player, W = ctx.world, g = ctx.g, A = W.anchors, px = p.x, pz = p.z; C.length = 0;
    const near = (x: number, z: number, r: number) => dist2(x, z, px, pz) < r * r;
    for (const s of W.slots) if (near(s.x, s.z, 2.6)) this.add('slot', s, s.x, s.y, s.z, s.shop === 'equip' ? 2.6 : 2.3);
    for (const n of ctx.npcs.list) { if (n.hidden || n.kind === 'kid' || !near(n.x, n.z, n.state === 'fixed' ? 3.6 : 3)) continue; this.add('npc', n, n.x, n.y + n.rig.headY - 0.35, n.z, n.state === 'fixed' ? 3.6 : n.state === 'queue' ? 3.4 : 2.6, n.state === 'queue' && n.order ? 0.25 : n.state === 'fixed' ? 0.1 : 0); }
    const s = g.stall;
    if ((s.where === 'placed' || s.where === 'home') && near(s.x, s.z, 3.2)) this.add(s.where === 'home' ? 'homeStall' : 'stall', null, s.x, groundY(s.x, s.z) + (s.tier <= 1 ? 0.35 : 0.95), s.z, 3, 0.05);
    if (s.where === 'carried') for (const sp of SPOTS) if (near(sp.x, sp.z, 4.2)) this.add('spot', sp, sp.x, 0.4, sp.z, 4.2, 0.3);
    for (const d of this.doors) if (near(d.d.x, d.d.z, 2.6)) this.add('door', d, d.d.x + Math.cos(d.d.yaw) * d.d.w * 0.5, 1.1, d.d.z + Math.sin(d.d.yaw) * d.d.w * 0.5, 2.4);
    for (const k of Object.keys(HOUSING)) {
      const b = A['bed_' + k]; if (b && near(b.x, b.z, 2.6)) this.add('bed', k, b.x, b.y, b.z, 2.5);
      const st = A['store_' + k]; if (st && near(st.x, st.z, 2.4) && g.housing === k) this.add('store', k, st.x, st.y, st.z, 2.3);
      const w = A['wash_' + k]; if (w && near(w.x, w.z, 2.2) && g.housing === k) this.add('wash', 'room', w.x, w.y, w.z, 2.1);
    }
    if (s.where === 'carried' && s.tier < 3) { const a = A['store_' + g.housing] ?? A['bed_' + g.housing]; if (a && near(a.x, a.z, 4) && this.atHome()) this.add('anchor', 'dropHome', a.x, 0.6, a.z, 4, 0.2); }
    const wp = A.wash_park; if (wp && near(wp.x, wp.z, 2.4)) this.add('wash', 'park', wp.x, wp.y, wp.z, 2.3);
    // ghế đá: chỗ ngồi nghỉ, lên tinh thần (miễn phí, chỉ tốn thời gian).
    // Ghế nào đã là chỗ ngủ (ghế đá công viên) thì để nguyên lời mời ngủ, không tranh chỗ.
    ctx.world.benches.forEach((b, i) => {
      const bed = C.some((c) => (c.kind === 'bed' || c.kind === 'spot') && dist2(c.x, c.z, b.x, b.z) < 2.6 * 2.6);
      if (!bed && near(b.x, b.z, 2.2)) this.add('bench', i, b.x, b.y ?? 0.32, b.z, 2.1, 0.05);
    });
    for (const t of W.taps) if (near(t.x, t.z, 2.2)) this.add('tap', t, t.x, t.y, t.z, 2.1);
    W.bins.forEach((b, i) => { if (near(b.x, b.z, 2.1)) this.add('bin', i, b.x, b.y, b.z, 2); });
    for (const l of ctx.acts.litter) if (near(l.x, l.z, 2.2)) this.add('litter', l, l.x, groundY(l.x, l.z) + 0.08, l.z, 2.2, 0.15);
    for (const k of ['dock', 'board', 'sink', 'v_temple', 'tv_bongda', 'fire_gamcau', 'seat_eatery', 'giuong_benhvien', 'quay_thuoc', 'giuong_giam', 'lao_dong', 'may_net']) { const a = A[k]; if (a && near(a.x, a.z, 2.8)) this.add('anchor', k, a.x, a.y, a.z, 2.7, k === 'dock' ? 0.2 : k === 'giuong_benhvien' || k === 'quay_thuoc' ? 0.05 : 0); }
    const j = ctx.acts.job; if (j?.kind === 'dock' && j.carrying) { const a = A.v_m_kho; if (a && near(a.x, a.z, 4.2)) this.add('anchor', 'dockDrop', a.x, 0.9, a.z, 4.2, 0.4); }
  }
  private atHome() { const g = ctx.g, a = ctx.world.anchors['bed_' + g.housing]; return !!a && dist2(a.x, a.z, ctx.player.x, ctx.player.z) < 36; }
  /** Diễn giải một ứng viên thành nhãn + hành động. */
  private resolve(c: Cand): Focus | null {
    const g = ctx.g, A = ctx.acts, mk = (label: string, act: () => void, sub?: string, alt?: Focus['alt']): Focus => ({ label, sub, act, alt, x: c.x, y: c.y, z: c.z });
    switch (c.kind) {
      case 'slot': {
        const sl = c.ref;
        if (sl.shop === 'equip') { const d = GEAR_LIST[sl.idx]; return mk(`${d.name} — ${R.has(g, d.id) ? 'đã có' : money(d.price)}`, () => A.buyGear(d.id), d.desc); }
        const shop = SHOPS[sl.shop], id = shop.items[sl.idx], d = INGS[id]; if (!d) return null;
        if (!R.shopOpen(g, shop)) return mk(`${shop.name} — đã đóng cửa`, () => toast(`Mở cửa ${hhmm(shop.open[0] * 60)}–${hhmm(shop.open[1] * 60)}.`, 'info'));
        if (!R.shopHas(g, shop, id)) return mk(`${d.name} — hết hàng`, () => A.take(sl));
        const n = shop.bulk ?? 1, pr = R.shopPrice(g, shop, id);
        return mk(`Lấy ${n > 1 ? n + ' ' : ''}${d.unit} ${d.name.toLowerCase()} — ${money(pr * n)}`, () => A.take(sl), d.shelf < 9000 ? `Tươi ${Math.round(R.shopFresh(g, shop, id, undefined))}% · để được ~${d.shelf < 24 ? d.shelf + ' giờ' : Math.round(d.shelf / 24) + ' ngày'}${d.cold ? ' · cần giữ lạnh' : ''}` : undefined, { label: `×${n * 5}`, act: () => A.take(sl, true) });
      }
      case 'npc': {
        const n: Npc = c.ref;
        if (n.state === 'fixed') { const cart = A.cart && A.cart.shop === n.fixedId; return mk(cart ? `Tính tiền — ${money(A.cartTotal())}` : `Nói chuyện với ${whoIn(n)}`, () => { ctx.player.face(n.x, n.z); A.talk(n); }); }
        if (n.state === 'queue' && n.order) { const r = RECIPES[n.order.rid], have = R.readyCount(g, r.id) >= n.order.n; return mk(have ? `Giao ${n.order.n} ${r.short}` : `Làm ${r.short} cho khách`, () => ctx.stall.serve(n), who(n) + (n.regular && known(n) ? ' · khách quen' : '')); }
        if (n.state === 'toStall' || n.state === 'actor' || n.state === 'queue' || n.kind === 'actor') return null;
        if (g.stall.open) return null;
        return mk(`Xin tiền ${whoIn(n)}`, () => { ctx.player.face(n.x, n.z); A.beg(n); });
      }
      case 'stall': return mk(g.stall.open ? 'Quầy hàng (đang mở bán)' : 'Quầy hàng', () => ctx.ui.panel('stall'), 'Thực đơn · Sơ chế · Kho quầy');
      case 'homeStall': return mk('Mang quầy đi', () => { ctx.stall.pickUp(); }, 'Chạm để gánh lên vai', { label: 'Kho', act: () => ctx.ui.panel('stall') });
      case 'spot': {
        const sp = c.ref, sap = g.stall.tier >= 3;
        return mk(`${sap ? 'Dựng sạp' : 'Đặt quầy'} tại ${sp.name}`, () => ctx.stall.placeAt(sp),
          (sp.fee ? `Phí chỗ ${money(sp.fee)}/ngày` : 'Miễn phí') + ' · ' + sp.note + (sap ? ' · đặt rồi không dời được' : ''));
      }
      case 'door': {
        const d = c.ref, lock = d.d.lock as string | undefined, ok = !lock || (g.housing === lock && (HOUSING[lock].per !== 'đêm' || g.day < g.paidUntil));
        return mk(d.want ? 'Đóng cửa' : ok ? 'Mở cửa' : 'Cửa khoá', () => { if (!ok) { toast(`Phòng này phải thuê mới vào được (${HOUSING[lock!].name}: ${money(HOUSING[lock!].rent)}/${HOUSING[lock!].per}).`, 'warn', 'home'); sfx('nope'); return; } d.want = d.want ? 0 : 1; sfx('door'); });
      }
      case 'bed': { const k = c.ref as string, err = A.canSleep(k); return mk(err ? HOUSING[k].name : `Ngủ — ${HOUSING[k].name}`, () => A.sleepMenu(k), err ?? `Giấc ngủ ${Math.round(HOUSING[k].sleep * 100)}% · an toàn ${Math.round(HOUSING[k].safety * 100)}%`); }
      case 'store': return mk('Mở chỗ cất đồ', () => ctx.ui.panel('home'), `Cất được ${HOUSING[c.ref].storage} kg` + (R.homeChilled(g) ? ' · có giữ lạnh' : ''));
      case 'wash': return mk(c.ref === 'park' ? 'Tắm — 3.000₫' : 'Tắm vòi sen', () => A.wash(c.ref), `Vệ sinh hiện tại ${Math.round(g.st.hygiene)}%`);
      case 'bench': { const b = ctx.world.benches[c.ref]; return mk('Ngồi nghỉ trên ghế đá', () => { ctx.player.face(b.x, b.z); A.rest(); }, '20 phút · tinh thần +7'); }
      case 'tap': return mk('Dùng vòi nước', () => A.wash('tap'));
      case 'bin': return mk(g.wd.bins[c.ref] === g.day ? 'Thùng rác (đã bới)' : 'Bới thùng rác', () => A.rummage(c.ref));
      case 'litter': return mk(`Nhặt ${JUNK[c.ref.id].name.toLowerCase()}`, () => A.pickLitter(c.ref), `Bán được ${money(JUNK[c.ref.id].price)}`);
      case 'anchor': {
        const k = c.ref as string, j = A.job, h = hourOf(g);
        if (k === 'dock') return j?.kind === 'dock' ? (j.carrying ? null : mk('Vác một bao hàng', () => A.dockTake(), `Đã vác ${g.wd.sacks}/12 bao`)) : null;
        if (k === 'dockDrop') return mk('Đặt bao hàng xuống', () => A.dockDrop(), '+6.000₫');
        if (k === 'board') return mk('Xem bảng việc làm', () => A.board());
        if (k === 'may_net') return mk('Ngồi vào máy 04', () => A.netMenu(), `3.000₫/giờ · ${Math.round(g.st.energy)}% sức`);
        if (k === 'giuong_benhvien') return mk('Nằm phòng hồi sức', () => A.hospitalRest(), `${money(R.RECOVER_FEE)}/giờ · hồi sức khoẻ`);
        if (k === 'quay_thuoc') return mk('Quầy thuốc bệnh viện', () => A.medMenu(), 'Thuốc cảm · bông băng · thuốc bổ');
        if (k === 'giuong_giam') return mk('Nằm giường buồng tạm giữ', () => A.prisonRest(), 'Chờ hết hạn · hồi sức một chút');
        if (k === 'lao_dong') return mk('Đập đá một giờ', () => A.prisonLabour(), 'Bớt thêm một giờ tạm giữ · mất sức');
        if (k === 'sink') return j?.kind === 'dishes' ? mk('Rửa chồng đĩa', () => A.dishes()) : null;
        if (k === 'v_temple') return mk('Cổng chùa Phước An', () => A.funMenu('v_temple'), 'Cơm chay 11h–13h · thắp nhang cầu an');
        if (k === 'dropHome') return mk('Cất quầy ở đây', () => ctx.stall.storeHome(), 'Để quầy cạnh chỗ ngủ');
        if (k === 'tv_bongda') return mk('Quán cà phê Bóng Đá', () => A.funMenu('tv_bongda'), 'Uống cà phê · hát karaoke · xin chạy bàn' + (R.eventOn(g, 'bong_da') ? ' · có trận bóng' : ''));
        if (k === 'fire_gamcau') return R.isNight(g) ? mk('Sưởi bên thùng lửa', () => { g.weather.wet = Math.max(0, g.weather.wet - 40); g.st.mood = Math.min(100, g.st.mood + 3); R.advance(g, 10, A.act()); toast('Hơ tay bên đống lửa, ấm người hẳn.', 'info'); }) : null;
        return null;
      }
    }
    return null;
  }
  trigger() { const f = this.focus; if (f && ctx.mode === 'play') { f.act(); ctx.acts.working = 0.3; } }
  triggerAlt() { const f = this.focus; if (f?.alt && ctx.mode === 'play') f.alt.act(); }
  update(dt: number) {
    const g = ctx.g, cam = ctx.camera;
    // cửa phòng & cửa cuốn
    this.T -= dt; const tick = this.T <= 0; if (tick) this.T = 0.5;
    for (const d of this.doors) { d.open = damp(d.open, d.want, 9, dt); d.m.rotation.y = -d.d.yaw - d.open * 1.5; d.d.box.on = d.open < 0.5; }
    for (const s of this.shut) { if (tick) s.s.box.on = !placeOpen(s.s.shop) || (s.s.shop === 'mart' && R.eventOn(g, 'cup_dien')); const want = s.s.box.on ? 1 : 0; s.k = damp(s.k, want, 3, dt); s.m.visible = s.k > 0.02; s.m.position.y = 0.12 + (1 - s.k) * s.s.h; s.m.scale.y = Math.max(0.02, s.k); }
    if (ctx.mode !== 'play') { this.focus = null; ctx.input.taps.length = 0; return; }
    this.collect();
    cam.getWorldDirection(_f);
    const p = ctx.player; let best: Cand | null = null, bs = -1e9;
    for (const c of this.cands) {
      const dh = Math.sqrt(dist2(c.x, c.z, p.x, p.z)); if (dh > c.r) continue;
      _v.set(c.x - cam.position.x, c.y - cam.position.y, c.z - cam.position.z); const dl = _v.length() || 1e-3, dot = _v.dot(_f) / dl;
      if (dot < 0.8 && !(dh < 1.0 && dot > 0.3)) continue;
      const sc = dot * 3 - dl * 0.22 + c.prio; if (sc > bs) { bs = sc; best = c; }
    }
    // chạm trực tiếp vào vật trên màn hình
    const taps = ctx.input.taps;
    if (taps.length) {
      const t = taps[taps.length - 1]; taps.length = 0; let tb: Cand | null = null, td = Math.max(64, window.innerHeight * 0.11);
      for (const c of this.cands) {
        const dh = Math.sqrt(dist2(c.x, c.z, p.x, p.z)); if (dh > c.r) continue;
        _v.set(c.x, c.y, c.z).project(cam); if (_v.z > 1) continue;
        const sx = (_v.x * 0.5 + 0.5) * window.innerWidth, sy = (-_v.y * 0.5 + 0.5) * window.innerHeight, d = Math.hypot(sx - t.x, sy - t.y) - c.prio * 40;
        if (d < td) { td = d; tb = c; }
      }
      const f = tb ? this.resolve(tb) : null; if (f) { this.focus = f; f.act(); ctx.acts.working = 0.3; ctx.ui.focus(f); return; }
    }
    this.focus = best ? this.resolve(best) : null; ctx.ui.focus(this.focus);
  }
}
export { qty };
