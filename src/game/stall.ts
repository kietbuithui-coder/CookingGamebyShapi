// QUẦY HÀNG trong thế giới 3D: mô hình theo cấp, đặt/dọn, hàng khách xếp hàng thật, phục vụ, và các nhân vật sự kiện tìm đến.
import * as THREE from 'three';
import { ctx, MIN_PER_SEC } from './ctx';
import { MB, MAT } from '../gfx/mb';
import { ganhModel, cartModel, charcoalStove, gasStove, boardModel, knifeModel, panModel, potModel, grateModel, iceBox, lanternModel, umbrellaModel, plasticStool, plasticTable, ingModel, signBoardModel } from '../gfx/props';
import { takeawayBag } from '../gfx/people';
import { SPOTS, Spot, spotById, groundY, NAV_BLOCK, CORNER, edgeKey } from '../world/layout';
import { Game, absMin, hourOf, addStack } from '../sim/state';
import { arrivalRate, has, tier, menuOf, available, decide, review, settleSale, lostCustomer, readyCount, finishPossible, spend, earn, stove, changeRel, meet, wx, eventOn, Persona, addXp, canSell, missingFor, hasPrep, stallRoom, isNight, level } from '../sim/rules';
import { RECIPES, RecipeDef } from '../data/recipes';
import { INGS } from '../data/ingredients';
import { ARCH, LINES, REGULARS, RegularDef } from '../data/people';
import { EVENTS } from '../data/world';
import { TIERS } from '../data/gear';
import { bus, toast, sfx } from '../core/bus';
import { rnd, clamp, dist2, money, round1k } from '../core/util';
import type { Npc } from './npc';
import { who } from './who';
import type { Box2, Circ } from '../world/build';
import { SignAtlas } from '../gfx/tex';

export interface Station { x: number; y: number; z: number; yaw: number; cam: THREE.Vector3; look: THREE.Vector3; }
export class StallSys {
  group = new THREE.Group(); body: THREE.Mesh | null = null; stock: THREE.Mesh | null = null; tools = new THREE.Group(); sign: THREE.Mesh | null = null;
  customers: Npc[] = []; private acc = 0; private builtKey = ''; private stockKey = ''; private stockT = 0; private cols: (Box2 | Circ)[] = [];
  private actorT = 0; private actorId = ''; private actorTries = 0; busy: Npc | null = null; rowdy = 0; private signAtlas = new SignAtlas(512); private signMat: THREE.Material;
  private marks: THREE.Mesh[] = []; private regT = 30;
  constructor() {
    ctx.scene.add(this.group); this.group.add(this.tools); this.group.visible = false;
    this.signMat = new THREE.MeshBasicMaterial({ map: this.signAtlas.texture });
    for (let i = 0; i < 3; i++) { const b: Circ = { x: 0, z: 0, r: 0.3, on: false }; this.cols.push(b); ctx.world.dyn.push(b); }
    // mũi tên phát sáng trên các chỗ bán còn trống
    const mg = new THREE.RingGeometry(1.35, 1.5, 28).rotateX(-Math.PI / 2), mm = new THREE.MeshBasicMaterial({ color: 0xffd24d, transparent: true, opacity: 0.55, depthWrite: false });
    for (const s of SPOTS) { const m = new THREE.Mesh(mg, mm); m.position.set(s.x, groundY(s.x, s.z) + 0.03, s.z); m.visible = false; ctx.scene.add(m); this.marks.push(m); }
    bus.on('event', (e) => this.onEvent(e.id, e.on));
  }
  get s() { return ctx.g.stall; }
  /** Gánh đã cất gọn trong balo: không vẽ trên vai, đi nhanh như tay không. */
  stowed = false;
  stow(): boolean {
    const s = this.s;
    if (s.tier === 0) { toast('Chưa có gánh mà cất.', 'info'); return false; }
    // Đang dựng quầy: nút này là "dọn quầy" — gói cả gánh lẫn đồ nghề vào ba lô.
    if (s.where === 'placed' || s.where === 'home') {
      if (Math.hypot(s.x - ctx.player.x, s.z - ctx.player.z) > 6) { toast('Quầy ở xa quá, lại gần mới dọn được.', 'warn'); sfx('nope'); return false; }
      if (!this.pickUp()) return false; toast('Dọn quầy, gói gánh vào ba lô. Muốn bán tiếp thì tìm chỗ khác dựng lại.', 'info', 'bag'); return true; }
    this.stowed = !this.stowed;
    ctx.player.setCarry(this.stowed ? '' : s.tier === 1 ? 'ganh' : 'xeday');
    sfx('pick');
    toast(this.stowed ? 'Cất gánh vào balo. Tay không, đi nhanh hơn — cần bán thì lấy ra.' : 'Lấy gánh ra, quàng lên vai.', 'info', 'bag');
    return true;
  }
  spot(): Spot | undefined { return this.s.spot ? spotById(this.s.spot) : undefined; }
  /** Vị trí làm bếp của quầy hiện tại (toạ độ thế giới). */
  station(): Station {
    const s = this.s, t = s.tier, c = Math.cos(s.yaw), sn = Math.sin(s.yaw), gy = groundY(s.x, s.z);
    const L = (lx: number, ly: number, lz: number) => new THREE.Vector3(s.x + lx * c + lz * sn, gy + ly, s.z - lx * sn + lz * c);
    if (t <= 1) { const o = L(0, 0.03, -0.72); return { x: o.x, y: o.y, z: o.z, yaw: s.yaw, cam: L(0, 1.08, -1.5), look: L(0, 0.05, -0.6) }; }
    const o = L(0, 0.925, 0.02); return { x: o.x, y: o.y, z: o.z, yaw: s.yaw, cam: L(0, 1.86, -0.86), look: L(0, 0.95, 0.06) };
  }
  /** Chỗ người chơi đứng bán. */
  standPos(): [number, number] { const s = this.s, d = s.tier <= 1 ? -1.5 : -1.0; return [s.x + Math.sin(s.yaw) * d, s.z + Math.cos(s.yaw) * d]; }
  slotPos(i: number, n: number): [number, number] { const s = this.s, lx = (i - (n - 1) / 2) * 0.82, lz = s.tier <= 1 ? 1.5 : 1.35; return [s.x + lx * Math.cos(s.yaw) + lz * Math.sin(s.yaw), s.z - lx * Math.sin(s.yaw) + lz * Math.cos(s.yaw)]; }

  // ───────── mô hình ─────────
  private rebuild() {
    const g = ctx.g, s = g.stall, key = [s.tier, s.where, s.x.toFixed(1), s.z.toFixed(1), stove(g), ...['daothot', 'vi', 'chao', 'noi', 'thungda', 'odu', 'bien', 'den', 'ghe'].map((k) => (has(g, k) ? 1 : 0)), g.housing].join('|');
    if (key === this.builtKey) return; this.builtKey = key;
    if (this.body) { this.group.remove(this.body); this.body.geometry.dispose(); this.body = null; }
    if (this.sign) { this.group.remove(this.sign); this.sign.geometry.dispose(); this.sign = null; }
    if (this.toolMesh) { this.group.remove(this.toolMesh); this.toolMesh.geometry.dispose(); this.toolMesh = null; }
    for (const c of this.cols) c.on = false;
    const show = s.tier > 0 && (s.where === 'placed' || s.where === 'home');
    this.group.visible = show;
    const carryId = s.tier === 1 ? 'ganh' : 'xeday';
    ctx.player.setCarry(s.where === 'carried' && !this.stowed ? carryId : ctx.player.carry === 'ganh' || ctx.player.carry === 'xeday' ? '' : ctx.player.carry);
    if (!show) return;
    this.group.position.set(s.x, groundY(s.x, s.z), s.z); this.group.rotation.y = s.yaw;
    const m = new MB(), tm = new MB(), st = stove(g), placed = s.where === 'placed';
    if (s.tier === 1) {
      ganhModel(m, 0, 0, 0, !placed);
      if (placed) {
        m.rod(0, 0.05, 0.42, 0.022, 1.5, 0x9a7a44, 0, Math.PI / 2, 6);                                   // đòn gánh đặt nằm
        m.box(0, 0, -0.72, 1.3, 0.025, 0.8, 0xc9b27a, 0xd9c38a); for (let i = -3; i <= 3; i++) m.box(i * 0.18, 0.026, -0.72, 0.012, 0.002, 0.8, 0xa98f5a);   // chiếu
        m.cyl(-0.62, 0.24, 0, 0.3, 0.014, 0xd9c38a, 14); m.cyl(0.62, 0.24, 0, 0.3, 0.014, 0xd9c38a, 14);  // mẹt đậy thúng
        plasticStool(tm, 0, 0, -1.42, 0x2f8fd5, 0.2);   // ghế của người bán: ẩn khi vào màn nấu để khỏi lọt vào khung hình
        if (st === 'bepthan') charcoalStove(tm, 0.42, 0.026, -0.86, 0.9); else if (st === 'bepgas') gasStove(tm, 0.42, 0.026, -0.86, 0.85);
        if (has(g, 'daothot')) { boardModel(tm, -0.38, 0.026, -0.88, 0.34, 0.22); knifeModel(tm, -0.3, 0.053, -0.86); }
        if (has(g, 'noi')) potModel(tm, -0.46, 0.026, -0.52, 0.7);
        if (has(g, 'chao')) panModel(tm, 0.0, 0.03, -0.98, 0.72);
        if (has(g, 'vi')) grateModel(tm, 0.42, st ? 0.22 : 0.04, -0.86, 0.36, 0.26);
        if (has(g, 'thungda')) iceBox(m, -1.25, 0, -0.5, 0.9);
        if (has(g, 'den')) lanternModel(m, 0.62, 0.255, 0.12);
      }
    } else if (s.tier === 2) {
      cartModel(m, 0, 0, 0);
      if (st === 'bepthan') charcoalStove(tm, 0.55, 0.91, -0.05, 0.8); else if (st === 'bepgas') gasStove(tm, 0.55, 0.91, -0.05, 0.8);
      if (has(g, 'daothot')) { boardModel(tm, -0.5, 0.91, -0.1, 0.34, 0.24); knifeModel(tm, -0.42, 0.937, -0.08); }
      if (has(g, 'noi')) potModel(tm, -0.62, 0.91, 0.22, 0.6); if (has(g, 'chao')) panModel(tm, 0.1, 0.915, 0.25, 0.6); if (has(g, 'vi')) grateModel(tm, 0.55, st ? 1.08 : 0.93, -0.05, 0.34, 0.24);
      if (has(g, 'thungda')) iceBox(m, -1.3, 0, -0.4, 0.95); if (has(g, 'den')) lanternModel(m, 0.78, 0.91, 0.3);
    } else {
      m.box(0, 0, 0.1, 2.6, 0.9, 0.9, 0x8a6a4a, 0xd9c8a8, 0.12); m.box(0, 0.3, 0.552, 2.5, 0.5, 0.004, 0xd9463c); m.box(0, 0.9, 0.1, 2.7, 0.035, 1.0, 0xe9e2d0, 0xf3efe6, 0, true);
      for (const sx of [-1.28, 1.28]) for (const sz of [-0.36, 0.56]) m.box(sx, 0.9, sz, 0.05, 1.5, 0.05, 0x8a8f96);
      m.box(0, 2.4, 0.1, 3.0, 0.06, 1.5, 0x2f8fd5, 0xf3f0e8, 0, true); m.box(0, 2.16, 0.86, 3.0, 0.24, 0.02, 0xf5c531, 0xf5c531, 0, true);
      if (st === 'bepthan') charcoalStove(tm, 0.9, 0.935, 0, 0.9); else if (st === 'bepgas') gasStove(tm, 0.9, 0.935, 0, 0.9);
      if (has(g, 'daothot')) { boardModel(tm, -0.8, 0.935, -0.05, 0.36, 0.24); knifeModel(tm, -0.7, 0.962, -0.03); }
      if (has(g, 'noi')) potModel(tm, -1.0, 0.935, 0.3, 0.7); if (has(g, 'chao')) panModel(tm, 0.3, 0.94, 0.3, 0.7); if (has(g, 'vi')) grateModel(tm, 0.9, st ? 1.12 : 0.95, 0, 0.36, 0.26);
      if (has(g, 'thungda')) iceBox(m, -1.75, 0, -0.3, 1); if (has(g, 'den')) lanternModel(m, 1.2, 0.935, 0.4);
    }
    if (placed) {
      if (has(g, 'odu') && s.tier < 3) umbrellaModel(m, s.tier === 1 ? -1.05 : -1.15, 0, s.tier === 1 ? -0.9 : -0.55, 1.7, 2.5);
      if (has(g, 'ghe')) { plasticTable(m, 2.3, 0, 0.5); plasticStool(m, 2.3, 0, 1.15, 0x2f8fd5); plasticStool(m, 1.65, 0, 0.5, 0xd9463c); plasticStool(m, 2.95, 0, 0.5, 0xd9463c); }
      if (has(g, 'bien')) signBoardModel(m, 1.45, 0.62, 0.75, 0.86, 0.5);
    }
    this.body = new THREE.Mesh(m.build(), MAT.litDouble); this.body.castShadow = true; this.group.add(this.body);
    if (tm.count) { this.toolMesh = new THREE.Mesh(tm.build(), MAT.lit); this.toolMesh.visible = !this.isCooking; this.group.add(this.toolMesh); }
    if (placed && has(g, 'bien')) {
      const names = menuOf(g).slice(0, 3).map((r) => r.short).join(' · ') || 'Ngon · Rẻ · Sạch';
      const uv = this.signAtlas.draw(names, 0.8 / 0.44, { bg: '#2a3a2e', fg: '#fff3c2', font: 'hand', sub: 'Quán ' + (g.ac === 'anh' ? 'Anh' : 'Chị') + ' Hai', subFg: '#ffd24d' }, 120), sm = new MB(true);
      sm.quad(1.45 - 0.4, 0.65, 0.768, 1.45 + 0.4, 0.65, 0.768, 1.45 + 0.4, 1.09, 0.768, 1.45 - 0.4, 1.09, 0.768, 0xffffff, 0, uv.u0, uv.v0, uv.u1, uv.v1);
      this.sign = new THREE.Mesh(sm.build(), this.signMat); this.group.add(this.sign);
    }
    if (placed) {
      const c = Math.cos(s.yaw), sn = Math.sin(s.yaw), W = (lx: number, lz: number): [number, number] => [s.x + lx * c + lz * sn, s.z - lx * sn + lz * c];
      const pts: [number, number, number][] = s.tier === 1 ? [[-0.62, 0, 0.34], [0.62, 0, 0.34]] : s.tier === 2 ? [[-0.5, 0, 0.5], [0.5, 0, 0.5]] : [[-0.85, 0.1, 0.62], [0.85, 0.1, 0.62], [0, 0.1, 0.62]];
      pts.forEach(([lx, lz, r], i) => { const b = this.cols[i] as Circ, [x, z] = W(lx, lz); b.x = x; b.z = z; b.r = r; b.on = true; });
      if (has(g, 'odu') || s.tier === 3) { const [x, z] = W(0, -0.4); this.roof = { x0: x - 1.9, z0: z - 1.9, x1: x + 1.9, z1: z + 1.9 }; if (!ctx.world.roofs.includes(this.roof)) ctx.world.roofs.push(this.roof); }
    }
    if (!placed || !(has(g, 'odu') || s.tier === 3)) { const i = ctx.world.roofs.indexOf(this.roof); if (i >= 0) ctx.world.roofs.splice(i, 1); }
    this.stockKey = '';
  }
  private roof: Box2 = { x0: 0, z0: 0, x1: 0, z1: 0 }; private toolMesh: THREE.Mesh | null = null; private isCooking = false;
  /** Khi đang nấu: giấu dụng cụ để yên trên quầy (bàn bếp có bản sao đang dùng). */
  cooking(on: boolean) { this.isCooking = on; if (this.toolMesh) this.toolMesh.visible = !on; if (this.stock) this.stock.visible = !on; }
  /** Hiển thị nguyên liệu và phần ăn làm sẵn ngay trên quầy. */
  private rebuildStock() {
    const s = this.s, key = s.store.map((x) => x.id + Math.ceil(x.n)).join(',') + '#' + s.ready.map((r) => r.rid + r.n).join(',') + '#' + s.preps.map((p) => p.rid + p.n).join(',');
    if (key === this.stockKey) return; this.stockKey = key;
    if (this.stock) { this.group.remove(this.stock); this.stock.geometry.dispose(); this.stock = null; }
    if (s.where !== 'placed' && s.where !== 'home') return;
    const m = new MB(), t = s.tier, R = rnd;
    const base: [number, number, number] = t === 1 ? [-0.62, 0.255, 0] : t === 2 ? [-0.3, 0.91, -0.22] : [-0.2, 0.935, -0.2];
    s.store.slice(0, t === 1 ? 5 : 8).forEach((st, i) => {
      const d = INGS[st.id]; if (d.shape === 'bag' || d.shape === 'coal' || d.shape === 'cubes') return;
      const a = i * 1.25, r = t === 1 ? 0.15 : 0, x = base[0] + (t === 1 ? Math.cos(a) * r : (i % 4) * 0.2), z = base[2] + (t === 1 ? Math.sin(a) * r : Math.floor(i / 4) * 0.2);
      for (let k = 0; k < Math.min(3, Math.ceil(st.n)); k++) ingModel(m, d, x + R.range(-0.03, 0.03), base[1] + k * 0.03, z + R.range(-0.03, 0.03), 0.8, R);
    });
    const rb: [number, number, number] = t === 1 ? [0.62, 0.255, 0] : t === 2 ? [0.2, 0.91, 0.24] : [0.4, 0.935, 0.3];
    let k = 0; for (const r of s.ready) for (let i = 0; i < r.n && k < 8; i++, k++) { const x = rb[0] + ((k % 4) - 1.5) * 0.12, z = rb[2] + (k < 4 ? -0.07 : 0.07); m.box(x, rb[1], z, 0.1, 0.07, 0.1, 0xf3ead2, 0xe9dcb8, 0.08); m.box(x, rb[1] + 0.07, z, 0.06, 0.02, 0.06, 0xd98a4a); }
    const pb: [number, number, number] = t === 1 ? [0.0, 0.03, -0.4] : t === 2 ? [-0.1, 0.91, 0.2] : [-0.5, 0.935, 0.3];
    s.preps.slice(0, 4).forEach((p, i) => { const x = pb[0] + (i - 1.5) * 0.19; m.cyl(x, pb[1], pb[2], 0.07, 0.05, 0xdfe6ea, 10, 0.085, false); m.cyl(x, pb[1] + 0.035, pb[2], 0.075, 0.006, [0x8fbf6a, 0xd98a4a, 0xf3e2a8, 0xc86a5a][i % 4], 10); });
    if (m.count) { this.stock = new THREE.Mesh(m.build(), MAT.food); this.stock.visible = !this.isCooking; this.group.add(this.stock); }
  }

  // ───────── đặt / dọn / mang quầy ─────────
  nearSpot(x: number, z: number): Spot | undefined { return SPOTS.find((sp) => dist2(sp.x, sp.z, x, z) < 4.5 * 4.5); }
  placeAt(sp: Spot): boolean {
    const g = ctx.g, s = g.stall;
    if (s.tier < sp.minTier) { toast(`Chỗ này cần ${TIERS[sp.minTier].name.toLowerCase()} trở lên.`, 'warn'); return false; }
    if (sp.fee > 0 && s.paidDay !== g.day) { if (!spend(g, sp.fee, 'fees')) { toast(`Không đủ ${money(sp.fee)} phí chỗ ở ${sp.name}.`, 'bad', 'cash'); return false; } toast(`Đã đóng ${money(sp.fee)} phí chỗ hôm nay.`, 'info', 'cash'); }
    s.paidDay = g.day; s.where = 'placed'; s.spot = sp.id; s.x = sp.x; s.z = sp.z; s.yaw = sp.yaw; s.open = false; this.stowed = false; sfx('place'); this.rebuild(); bus.emit('save', 'dat quay'); return true;
  }
  /** Để quầy ở chỗ ở (cạnh giường). */
  storeHome(): boolean {
    const g = ctx.g, s = g.stall, a = ctx.world.anchors['store_' + g.housing] ?? ctx.world.anchors['bed_' + g.housing]; if (!a) return false;
    s.where = 'home'; s.spot = null; s.open = false; const off = g.housing === 'gamcau' ? [2.6, -0.4] : [0.2, -1.0];
    s.x = a.x + off[0] * Math.cos(a.yaw) + off[1] * Math.sin(a.yaw); s.z = a.z - off[0] * Math.sin(a.yaw) + off[1] * Math.cos(a.yaw); s.yaw = a.yaw; sfx('place'); this.rebuild(); return true;
  }
  pickUp(): boolean {
    const s = this.s; if (s.tier === 0 || s.tier >= 3) { toast('Sạp cố định không dời đi được.', 'warn'); return false; }
    this.close(true); for (const n of this.customers.slice()) this.dismiss(n, false);
    s.where = 'carried'; s.spot = null; this.stowed = false; sfx('pick'); this.rebuild(); return true;
  }
  open(): boolean {
    const g = ctx.g, s = g.stall;
    if (s.where !== 'placed') return false;
    if (wx(g).id === 'bao') { toast('Đang bão, không thể mở bán!', 'bad', 'storm'); return false; }
    if (s.cond < 25) { toast('Quầy hư nặng quá, phải sửa ở tiệm Ba Tài đã.', 'bad'); return false; }
    const menu = menuOf(g); if (!menu.length) { toast('Chưa chọn món nào để bán. Bật món trong thực đơn trước.', 'warn'); return false; }
    if (!menu.some((r) => available(g, r))) { toast('Chưa có gì để bán: hãy sơ chế hoặc mua thêm nguyên liệu.', 'warn'); return false; }
    s.open = true; this.acc = 0.6; sfx('open'); toast('Mở bán! ' + (isNight(g) && !has(g, 'den') ? 'Trời tối mà không có đèn nên khách khó thấy quầy.' : 'Chúc đắt hàng.'), 'good', 'shop'); this.builtKey = ''; bus.emit('ui', 'stall'); return true;
  }
  close(silent = false) { const s = this.s; if (!s.open) return; s.open = false; if (!silent) { sfx('close'); toast('Đã đóng quầy.', 'info', 'shop'); } bus.emit('ui', 'stall'); }

  // ───────── khách ─────────
  private persona(n: Npc, reg?: RegularDef): Persona {
    const a = n.arch, R = rnd, g = ctx.g, sp = this.spot(), bud = R.range(a.budget[0], a.budget[1]) * (sp ? 1 : 1);
    return { arch: a, budget: round1k(bud * (eventOn(g, 'ngay_luong') ? 1.35 : 1)), noise: R.range(0.86, 1.2), regular: reg?.id, likes: reg?.likes };
  }
  private send(reg?: RegularDef, archId?: string): Npc | null {
    const s = this.s, N = ctx.npcs;
    let n: Npc | null = null;
    if (reg || archId) n = N.spawnPed(s.x, s.z, 16, 40, ARCH[(reg?.arch ?? archId) as keyof typeof ARCH]);
    else n = N.recruit(s.x, s.z, 34) ?? N.spawnPed(s.x, s.z, 16, 38);
    if (!n) return null;
    if (reg) { n.name = reg.name; n.regular = reg; if (n.fem !== reg.fem) n.fem = reg.fem; }
    n.persona = this.persona(n, reg); n.state = 'toStall'; n.slot = this.freeSlot(); this.customers.push(n);
    const [x, z] = this.slotPos(n.slot, tier(ctx.g).queue);
    N.goto(n, x, z, (c) => this.arrived(c));
    return n;
  }
  private freeSlot(): number { const used = new Set(this.customers.map((c) => c.slot)), q = tier(ctx.g).queue, order = Array.from({ length: q }, (_, i) => i).sort((a, b) => Math.abs(a - (q - 1) / 2) - Math.abs(b - (q - 1) / 2)); return order.find((i) => !used.has(i)) ?? 0; }
  private arrived(n: Npc) {
    const g = ctx.g, s = g.stall, N = ctx.npcs;
    n.yaw = s.yaw + Math.PI; n.state = 'queue'; n.pose = 'idle';
    if (n.actor && n.actor !== 'critic' && n.actor !== 'vip') { this.actorTalk(n); return; }
    if (!s.open) { this.dismiss(n, false); return; }
    const res = decide(g, n.persona!, n.fem);
    if (!res.order) { N.say(n, res.leave!, 3, res.why === 'price' ? 3 : 5); lostCustomer(g, res.why ?? 'none'); if (res.why === 'price') sfx('nope'); setTimeout(() => this.dismiss(n, false), 1400); return; }
    n.order = res.order; if (n.actor === 'vip') n.order.n = Math.min(3, Math.max(n.order.n, 2), readyCount(g, n.order.rid) + finishPossible(g, RECIPES[n.order.rid]));
    const a = n.arch; n.patience = rnd.range(a.patience[0], a.patience[1]) * (has(g, 'ghe') ? 1.3 : 1) * (wx(g).rain > 0.3 && !has(g, 'odu') ? 0.75 : 1); n.waited = 0;
    N.say(n, res.order.line, 3.2, res.order.mood === 'pricey' ? 3 : 1); ctx.ui.order(n, res.order.rid, res.order.n); sfx('order');
    if (n.regular) changeRel(g, n.regular.id, 0, true);
  }
  dismiss(n: Npc, happy: boolean) {
    const i = this.customers.indexOf(n); if (i >= 0) this.customers.splice(i, 1);
    if (this.busy === n) this.busy = null;
    ctx.ui.unorder(n); n.base = happy ? 1 : 0; if (n.state !== 'gone') ctx.npcs.leave(n);
  }
  /** Người chơi chạm vào khách: giao món nếu có sẵn, không thì bắt tay vào làm. */
  serve(n: Npc) {
    const g = ctx.g, o = n.order; if (!o) return;
    const r = RECIPES[o.rid];
    if (readyCount(g, o.rid) >= o.n) { this.handOver(n); return; }
    if (ctx.cook.active) return;
    if (finishPossible(g, r) < 1) {
      const miss = hasPrep(r) && g.stall.preps.filter((p) => p.rid === r.id).reduce((a, p) => a + p.n, 0) < 1 ? ['phần sơ chế (vào Thực đơn › Sơ chế)'] : missingFor(g, r, 'fin');
      toast(`Không làm được ${r.name}: thiếu ${miss.join(', ') || 'nguyên liệu'}.`, 'warn'); ctx.npcs.say(n, 'Ủa, hết rồi hả? Thôi vậy.', 2.5, 5); lostCustomer(g, 'none'); setTimeout(() => this.dismiss(n, false), 1200); return;
    }
    this.busy = n; ctx.cook.finish(r, () => { if (this.customers.includes(n) && readyCount(g, o.rid) >= 1) { o.n = Math.min(o.n, readyCount(g, o.rid)); this.handOver(n); } this.busy = null; });
  }
  private handOver(n: Npc) {
    const g = ctx.g, o = n.order!, s = g.stall; let q = 0, cost = 0, left = o.n;
    for (const rd of s.ready.filter((x) => x.rid === o.rid).sort((a, b) => a.at - b.at)) { const k = Math.min(left, rd.n); q += k * rd.q; cost += k * rd.cost; rd.n -= k; left -= k; if (left <= 0) break; }
    s.ready = s.ready.filter((x) => x.n > 0); q /= o.n;
    const rv = review(g, n.persona!, n.fem, o, q, n.waited / n.patience);
    settleSale(g, o, cost, rv, q); addXp(g, q);
    ctx.npcs.say(n, rv.line, 3.2, rv.face); n.base = rv.face; n.rig.hold(takeawayBag()); sfx(rv.tip ? 'tip' : 'coin'); if (rv.stars >= 4.5) sfx('yay'); else if (rv.stars < 2.5) sfx('boo');
    ctx.ui.float(`+${money(o.price * o.n + rv.tip)}`, n, rv.stars >= 3.7 ? 'good' : 'warn'); ctx.ui.stars(n, rv.stars);
    if (n.regular) { changeRel(g, n.regular.id, (rv.stars - 3) * 3); if (meet(g, n.regular.id)) setTimeout(() => toast(`Vị khách vừa rồi tự giới thiệu: ${n.regular!.name}. Có vẻ sẽ còn ghé lại.`, 'info', 'heart'), 2200); }
    if (n.actor === 'critic') { g.flags.critic = g.day; toast(rv.stars >= 4.2 ? `Nhà phê bình viết: "Viên ngọc ẩn của ẩm thực đường phố!" Uy tín tăng vọt.` : rv.stars >= 3 ? 'Nhà phê bình viết một bài nhận xét thường thường bậc trung.' : 'Nhà phê bình chê thậm tệ trên báo. Uy tín giảm mạnh!', rv.stars >= 4.2 ? 'good' : rv.stars >= 3 ? 'info' : 'bad', 'pen', true); }
    if (n.actor === 'vip' && rv.stars >= 4.2) { const bonus = 50000 + round1k(rnd.range(0, 100000)); earn(g, bonus, 'tips'); toast(`Vị khách VIP boa thêm ${money(bonus)} và hứa giới thiệu bạn bè!`, 'good', 'star', true); g.rep = clamp(g.rep + 2, 0, 100); }
    setTimeout(() => this.dismiss(n, rv.stars >= 3.7), 1500);
    if (!menuOf(g).some((r) => available(g, r))) { toast('Hết sạch hàng rồi! Sơ chế thêm hoặc đóng quầy đi mua nguyên liệu.', 'warn', 'box'); }
    bus.emit('ui', 'sale'); if (g.quest === 6) bus.emit('quest', 7);
  }

  // ───────── nhân vật sự kiện ─────────
  private onEvent(id: string, on: boolean) {
    const e = EVENTS[id]; if (!e) return;
    if (e.roadblock) {
      const ks = [edgeKey(CORNER['01NE'].id, CORNER['11NW'].id), edgeKey(CORNER['01SE'].id, CORNER['11SW'].id)];
      for (const k of ks) on ? NAV_BLOCK.add(k) : NAV_BLOCK.delete(k); ctx.city.roadblock.visible = on;
    }
    if (on && e.actor && this.s.where === 'placed') { this.actorId = e.actor; this.actorT = rnd.range(6, 18); this.actorTries = 0; }
  }
  private spawnActor() {
    const s = this.s, id = this.actorId, N = ctx.npcs; this.actorId = '';
    if (s.where !== 'placed') return;
    const defs: Record<string, [keyof typeof ARCH, string]> = { inspector: ['congan', 'Thanh tra Vệ sinh'], critic: ['phebinh', 'Nhà phê bình ẩm thực'], gang: ['giangho', 'Đàn em Hùng Sẹo'], rowdy: ['taixe', 'Ông khách say xỉn'], vip: ['nhagiau', 'Vị khách sang trọng'], credit: ['congnhan', 'Khách quen'] };
    const d = defs[id]; if (!d) return;
    let n: Npc | null;
    if (id === 'credit') { const cand = REGULARS.filter((r) => (ctx.g.rel[r.id]?.n ?? 0) > 0); const reg = rnd.pick(cand.length ? cand : REGULARS); n = N.spawnActor(reg.arch, reg.name, id, s.x, s.z, reg.fem); if (n) n.regular = reg; }
    else n = N.spawnActor(d[0], d[1], id, s.x, s.z);
    // Chưa tìm được chỗ xuất hiện khuất tầm mắt → lát nữa thử lại, đừng để sự kiện trôi qua mà không ai tới.
    if (!n) { if (++this.actorTries < 30) { this.actorId = id; this.actorT = 1.5; } return; }
    if (id === 'critic' || id === 'vip') { n.persona = { arch: n.arch, budget: 300000, noise: 1.1 }; }
    n.state = 'actor'; n.slot = this.freeSlot(); this.customers.push(n); if (id === 'rowdy' || id === 'gang') n.base = 4;
    const [x, z] = this.slotPos(n.slot, tier(ctx.g).queue); N.goto(n, x, z, (c) => this.arrived(c));
  }
  private actorTalk(n: Npc) {
    const g = ctx.g, s = g.stall, ui = ctx.ui, N = ctx.npcs, done = (happy = false) => this.dismiss(n, happy), R = rnd;
    const bad = s.store.some((x) => x.fresh < 35 && INGS[x.id].shelf < 9000);
    switch (n.actor) {
      case 'inspector': {
        const clean = g.st.hygiene >= 45 && s.dirt < 40 && !bad;
        if (clean) { ui.dialog({ who: who(n), npc: n, text: 'Đoàn kiểm tra vệ sinh an toàn thực phẩm đây. …Ừm, quầy sạch sẽ, nguyên liệu tươi, người bán gọn gàng. Tốt lắm, cứ thế phát huy!', opts: [{ t: 'Dạ, cảm ơn anh.', fn: () => { g.rep = clamp(g.rep + 2, 0, 100); toast('Qua kiểm tra vệ sinh: uy tín +2.', 'good', 'badge'); done(true); } }] }); break; }
        const fine = round1k(50000 + s.dirt * 600 + (bad ? 50000 : 0) + (g.st.hygiene < 30 ? 30000 : 0));
        const why = [s.dirt >= 40 ? 'quầy bẩn' : '', bad ? 'có nguyên liệu ôi' : '', g.st.hygiene < 45 ? 'người bán lem luốc' : ''].filter(Boolean).join(', ');
        n.base = 3; ui.dialog({ who: who(n), npc: n, text: `Kiểm tra vệ sinh an toàn thực phẩm. Tôi thấy ${why}. Lập biên bản phạt ${money(fine)}.`, opts: [
          { t: `Nộp phạt ${money(fine)}`, off: g.cash < fine, fn: () => { spend(g, fine, 'fees'); s.dirt = Math.max(0, s.dirt - 10); toast(`Nộp phạt ${money(fine)}.`, 'bad', 'badge'); done(); } },
          { t: 'Năn nỉ xin giảm', sub: 'Uy tín cao và ăn nói vui vẻ thì dễ được châm chước', fn: () => { if (R.chance(clamp(0.3 + g.rep / 150 + (g.st.mood - 50) / 200, 0.1, 0.8))) { const f = round1k(fine * 0.3); spend(g, Math.min(f, g.cash), 'fees'); N.say(n, 'Thôi được, lần đầu tôi nhắc nhở. Phạt nhẹ thôi, lần sau dọn cho sạch.', 3.5); toast(`Được giảm, chỉ nộp ${money(Math.min(f, g.cash))}.`, 'info', 'badge'); } else { spend(g, Math.min(fine, g.cash), 'fees'); N.say(n, 'Không xin xỏ gì hết. Nộp phạt!', 3, 4); toast(`Vẫn phải nộp ${money(Math.min(fine, g.cash))}.`, 'bad', 'badge'); } setTimeout(done, 1600); } },
          { t: 'Dúi 30.000₫ "cà phê"', sub: 'Rủi ro: bị bắt quả tang thì phạt gấp đôi', off: g.cash < 30000, fn: () => { if (R.chance(0.55)) { spend(g, 30000, 'fees'); N.say(n, 'E hèm… lần sau chú ý nhé.', 3); toast('Thoát phạt, tốn 30.000₫.', 'info', 'badge'); } else { const f = Math.min(g.cash, fine * 2); spend(g, f, 'fees'); g.rep = clamp(g.rep - 3, 0, 100); this.close(); N.say(n, 'Hối lộ người thi hành công vụ à? Phạt gấp đôi, đình chỉ bán hôm nay!', 3.5, 4); toast(`Bị phạt ${money(f)}, đình chỉ bán, uy tín −3.`, 'bad', 'badge', true); } setTimeout(done, 1800); } },
          { t: 'Không có tiền…', off: g.cash >= fine, fn: () => { this.close(); toast('Không nộp được phạt: bị đình chỉ bán hôm nay.', 'bad', 'badge'); done(); } }] });
        break;
      }
      case 'gang': {
        const fee = g.rep > 40 ? 60000 : 40000;
        ui.dialog({ who: who(n), npc: n, text: `Ê, bán ở khu này phải biết luật. Đại ca Hùng Sẹo thu ${money(fee)} "phí bảo kê". Đưa đây!`, opts: [
          { t: `Đưa ${money(fee)}`, off: g.cash < fee, fn: () => { spend(g, fee, 'fees'); g.flags.gangPaid = g.day + 2; N.say(n, 'Biết điều đó. Ba bữa nữa tụi tao ghé.', 3); toast('Đã nộp tiền bảo kê, yên thân được 3 ngày.', 'info', 'skull'); setTimeout(done, 1500); } },
          { t: 'Xin khất tới mai', sub: 'Chỉ được một lần', off: !!g.flags.gangDefer && g.flags.gangDefer >= g.day - 3, fn: () => { g.flags.gangDefer = g.day; g.flags.gangPaid = g.day; N.say(n, 'Mai mà không có là dẹp quầy nghe chưa!', 3, 4); setTimeout(done, 1500); } },
          { t: 'Không đưa!', sub: 'Có thể bị đập quầy', fn: () => { if (R.chance(0.5)) { s.cond = clamp(s.cond - 35, 0, 100); const lost = s.ready.reduce((a, x) => a + x.n * x.cost, 0); s.ready = []; g.led.loss += lost; g.st.health = clamp(g.st.health - 10, 5, 100); g.st.mood = clamp(g.st.mood - 12, 0, 100); N.say(n, 'Cứng đầu hả? Đập!', 2.5, 4); sfx('crash'); toast('Bọn chúng đập quầy! Quầy hư hại nặng, đồ làm sẵn đổ hết.', 'bad', 'skull', true); this.builtKey = ''; } else { g.rep = clamp(g.rep + 1, 0, 100); g.flags.gangPaid = g.day; N.say(n, 'Được… mày giỏi. Cứ chờ đó.', 3, 4); toast('Chúng bỏ đi — lần này thôi. Bà con trong hẻm nể bạn hơn.', 'good', 'skull'); } setTimeout(done, 1600); } }] });
        break;
      }
      case 'rowdy': {
        n.pose = 'angry'; this.rowdy = 70; const tea = RECIPES.tra_da && readyCount(g, 'tra_da') + finishPossible(g, RECIPES.tra_da) > 0 && g.rec.tra_da.on;
        ui.dialog({ who: who(n), npc: n, text: 'Ê… hức… bán cái gì đây? Đồ ăn gì mà… hức… dở ẹc! Tao nói cho cả phố biết!', opts: [
          { t: 'Mời ly trà đá giải rượu', off: !tea, sub: tea ? 'Tốn một ly trà đá' : 'Quầy không có trà đá', fn: () => { this.rowdy = 0; n.pose = 'idle'; n.base = 1; g.rep = clamp(g.rep + 0.5, 0, 100); if (readyCount(g, 'tra_da') > 0) { const rd = s.ready.find((x) => x.rid === 'tra_da')!; rd.n--; s.ready = s.ready.filter((x) => x.n > 0); } N.say(n, 'Ờ… mát ghê. Xin lỗi nha, tui xỉn quá.', 3, 1); toast('Ông khách dịu lại rồi bỏ đi. Khách xung quanh khen bạn khéo.', 'good'); setTimeout(() => done(true), 1800); } },
          { t: 'Lớn tiếng đuổi đi', fn: () => { if (R.chance(0.6)) { this.rowdy = 0; N.say(n, 'Đi thì đi! Làm gì dữ vậy…', 2.5, 5); } else { const lost = s.ready.reduce((a, x) => a + x.n * x.cost, 0); s.ready = []; g.led.loss += lost; g.st.mood = clamp(g.st.mood - 10, 0, 100); this.rowdy = 0; sfx('crash'); N.say(n, 'Dám đuổi tao hả!', 2.5, 4); toast('Ông ta hất đổ đồ ăn làm sẵn rồi mới chịu đi.', 'bad'); } setTimeout(done, 1600); } },
          { t: 'Mặc kệ ông ta', sub: 'Khách sẽ ngại ghé một lúc', fn: () => { N.say(n, 'Hức… bán với chả buôn…', 3, 4); setTimeout(done, 45000); } }] });
        break;
      }
      case 'credit': {
        const r = menuOf(g).find((x) => available(g, x)), reg = n.regular!;
        if (!r) { done(); break; }
        n.base = 5; ui.dialog({ who: who(n), npc: n, text: `${g.ac === 'anh' ? 'Anh' : 'Chị'} Hai ơi… tháng này tui kẹt quá, lương chưa về. Cho tui ăn chịu một phần ${r.name.toLowerCase()} được không? Có tiền tui trả liền.`, opts: [
          { t: 'Cho ăn chịu', sub: 'Phần lớn sẽ quay lại trả, có khi trả hậu', fn: () => { if (this.giveFree(r)) { changeRel(g, reg.id, 15); (g.rel[reg.id] ??= { v: 0, n: 0, last: -1 }).owe = g.rec[r.id].price; g.flags['owe_' + reg.id] = g.day + R.int(1, 2); N.say(n, 'Cảm ơn nhiều lắm! Tui không quên ơn đâu.', 3, 1); n.rig.hold(takeawayBag()); } setTimeout(() => done(true), 1600); } },
          { t: 'Tặng luôn, khỏi trả', fn: () => { if (this.giveFree(r)) { changeRel(g, reg.id, 22); g.st.mood = clamp(g.st.mood + 6, 0, 100); g.rep = clamp(g.rep + 0.6, 0, 100); N.say(n, 'Trời ơi, quý hoá quá! Tui sẽ kêu cả xóm tới ủng hộ.', 3.2, 2); n.rig.hold(takeawayBag()); } setTimeout(() => done(true), 1600); } },
          { t: 'Từ chối khéo', fn: () => { changeRel(g, reg.id, -4); N.say(n, 'Ừ… tui hiểu mà. Buôn bán cũng khó.', 3, 5); setTimeout(done, 1500); } }] });
        break;
      }
      default: done();
    }
  }
  /** Lấy một phần ăn không tính tiền (cho/tặng). */
  private giveFree(r: RecipeDef): boolean {
    const g = ctx.g, s = g.stall, rd = s.ready.find((x) => x.rid === r.id);
    if (rd) { rd.n--; g.led.loss += rd.cost; s.ready = s.ready.filter((x) => x.n > 0); return true; }
    toast(`Chưa có sẵn ${r.name} — hãy làm trước rồi đưa sau.`, 'warn'); return false;
  }

  update(dt: number) {
    const g = ctx.g, s = g.stall, N = ctx.npcs;
    this.rebuild(); this.stockT -= dt; if (this.stockT <= 0) { this.stockT = 0.5; this.rebuildStock(); }
    // vòng đánh dấu chỗ bán khi đang mang quầy
    const carrying = s.where === 'carried'; this.marks.forEach((m, i) => { m.visible = carrying && dist2(SPOTS[i].x, SPOTS[i].z, ctx.player.x, ctx.player.z) < 60 * 60; if (m.visible) m.scale.setScalar(1 + Math.sin(ctx.time * 3) * 0.05); });
    if (s.where !== 'placed') { if (this.customers.length) for (const n of this.customers.slice()) this.dismiss(n, false); return; }
    // người chơi đi quá xa → khách không chờ
    const away = dist2(ctx.player.x, ctx.player.z, s.x, s.z) > 12 * 12;
    if (s.open) {
      const perSec = (arrivalRate(g) * MIN_PER_SEC) / 60 * (this.rowdy > 0 ? 0.3 : 1) * (away ? 0 : 1);
      this.acc += perSec * dt * rnd.range(0.4, 1.6);
      if (this.acc >= 1 && this.customers.length < tier(g).queue && ctx.mode !== 'sleep') {
        this.acc = 0;
        // khách quen ghé đúng giờ của họ
        const h = hourOf(g), reg = REGULARS.find((r) => Math.abs(h - r.hour) < 1.4 && (g.rel[r.id]?.last ?? -1) !== g.day && !this.customers.some((c) => c.regular === r) && rnd.chance(0.22 + (g.rel[r.id]?.v ?? 0) / 110 + g.rep / 300));
        if (!this.send(reg)) this.acc = 0.85;   // chưa có ai quanh đây để ghé → thử lại sớm, không bỏ mất lượt khách
      } else if (this.acc > 1.5) this.acc = 1.5;
      if (away && this.customers.length === 0 && dist2(ctx.player.x, ctx.player.z, s.x, s.z) > 40 * 40) { this.close(true); toast('Bạn đi xa quá nên quầy tạm ngưng bán.', 'warn', 'shop'); }
    }
    if (this.rowdy > 0) this.rowdy -= dt;
    if (this.actorId) { this.actorT -= dt; if (this.actorT <= 0) this.spawnActor(); }
    // khách quen trả nợ
    this.regT -= dt; if (this.regT <= 0) { this.regT = 20; for (const r of REGULARS) { const due = g.flags['owe_' + r.id], rel = g.rel[r.id]; if (due !== undefined && g.day >= due && rel?.owe && s.open) { delete g.flags['owe_' + r.id]; if (rnd.chance(0.75)) { const pay = round1k(rel.owe * rnd.range(1, 1.6)); earn(g, pay, 'revenue'); toast(`${r.name} ghé trả ${money(pay)} tiền ăn chịu hôm trước. "Cảm ơn ${g.ac} đã thương!"`, 'good', 'heart', true); changeRel(g, r.id, 5); } else toast(`Nghe nói ${r.name} đã chuyển đi nơi khác… khoản ăn chịu coi như mất.`, 'bad', 'heart'); rel.owe = 0; } } }
    // sự kiên nhẫn của khách đang chờ
    for (const n of this.customers.slice()) {
      if (n.state !== 'queue' || !n.order) continue;
      n.waited += dt * (this.busy === n ? 0.35 : 1) * (away ? 2.5 : 1);
      const f = n.waited / n.patience; ctx.ui.patience(n, 1 - f);
      if (f > 0.55 && !n.data?.warn) { n.data = { warn: 1 }; N.say(n, LINES.wait[(n.id + g.day) % LINES.wait.length].replace('{you}', n.arch.you.replace('{ac}', g.ac)).replace('{Self}', n.arch.self[n.fem ? 1 : 0]).replace('{self}', n.arch.self[n.fem ? 1 : 0]), 2.4, 3); n.base = 3; }
      if (f >= 1 && this.busy !== n) { const a = n.arch, line = rnd.pick(LINES.leave_wait).replace('{self}', a.self[n.fem ? 1 : 0]); N.say(n, line, 2.6, 4); sfx('boo'); lostCustomer(g, 'wait'); if (n.regular) changeRel(g, n.regular.id, -4); this.dismiss(n, false); n.base = 4; }
    }
  }
  /** Nạp lại sau khi tải save. */
  reset() { for (const n of this.customers.slice()) this.dismiss(n, false); this.builtKey = ''; this.stockKey = ''; this.busy = null; this.actorId = ''; this.rowdy = 0; ctx.city.roadblock.visible = eventOn(ctx.g, 'cam_duong'); NAV_BLOCK.clear(); if (eventOn(ctx.g, 'cam_duong')) this.onEvent('cam_duong', true); }
  refresh() { this.builtKey = ''; this.stockKey = ''; }
}
export function stallHint(g: Game, stowed = false): string {
  const s = g.stall; if (s.tier === 0) return 'Chưa có quầy';
  return s.where === 'carried' ? (stowed ? 'Cất trong ba lô' : 'Đang mang theo') : s.where === 'home' ? 'Để ở chỗ ở' : s.open ? 'Đang mở bán' : 'Đã đặt, chưa mở';
}
export { level, canSell, stallRoom, addStack, absMin };
