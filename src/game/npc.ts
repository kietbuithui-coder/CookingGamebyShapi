// NPC: người đi đường (có lộ trình, công việc, giờ giấc), người bán cố định, khách của quầy và các nhân vật sự kiện.
import * as THREE from 'three';
import { ctx, QUALITY } from './ctx';
import { Rig, Look, lookFromArch, lookFromFixed, Pose } from '../gfx/people';
import { ARCH, ARCH_LIST, ArchDef, ArchId, FIXED, LINES, NAMES, RegularDef, RUDE, SIDE } from '../data/people';
import { NAV, NavNode, findPath, nearestNode, groundY, districtAt, District } from '../world/layout';
import { RNG, rnd, clamp, angDiff, dist2, damp } from '../core/util';
import { hourCurve } from '../data/world';
import { hourOf } from '../sim/state';
import { wx, mods, Persona, Order, say, shopOpen } from '../sim/rules';
import { SHOPS } from '../data/shops';
import { MB, MAT } from '../gfx/mb';
import { toast } from '../core/bus';

export type NState = 'walk' | 'stand' | 'sit' | 'toStall' | 'queue' | 'fixed' | 'follow' | 'actor' | 'chase' | 'cop' | 'gone';
export interface Npc {
  id: number; rig: Rig; kind: 'ped' | 'fixed' | 'actor' | 'kid'; arch: ArchDef; fem: boolean; name: string; fixedId?: string; regular?: RegularDef;
  x: number; z: number; y: number; yaw: number; speed: number; vel: number; state: NState; pose: Pose; base: number;
  path: [number, number][]; pi: number; enter: boolean; timer: number; ox: number; oz: number; dest?: NavNode;
  persona?: Persona; order?: Order; patience: number; waited: number; slot: number; asked: boolean; served: boolean; barkT: number;
  parent?: Npc; onArrive?: (n: Npc) => void; hidden: boolean; talkT: number; actor?: string; data?: any; home?: { x: number; z: number; yaw: number };
  /** hành động lúc rảnh (đọc báo / uống nước / tám chuyện) và người đang nói cùng */ idleT?: number; idleT2?: number; chatWith?: number;
  /** Bị đấm mấy lần + còn giận tới lúc nào (giây ctx.time). */ hurt?: number; madUntil?: number;
  /** nhảy tại chỗ (nhân vật phụ ở góc hip hop) */ dance?: boolean;
  /** đếm ngược tới lần gây sự kế tiếp; chaseT: còn đuổi bao lâu; hit: đã xô người chơi lần này chưa */ rudeT: number; chaseT?: number; hit?: boolean;
}
/** Giờ mở cửa của những nơi không phải cửa hàng nguyên liệu. */
export const PLACE_HOURS: Record<string, [number, number]> = { equip: [7, 20], bank: [8, 17], eatery: [6, 21.5], pawn: [8, 21], scrap: [6, 19], dock: [4.5, 10], motel: [0, 24], hotel: [0, 24], tro: [6, 22], shark: [9, 24], hobo: [0, 24],
  canho: [6, 22], nharieng: [6, 22], cuahang: [6, 21],
  police: [0, 24],
  hospital: [0, 24],
  // nhân vật phụ: mỗi người chỉ ở chỗ của mình trong một quãng giờ nhất định
  net: [6, 23], net_bi: [16, 22], net_nhung: [18, 22.5],
  tra_da: [5.5, 22], rap: [14.5, 23], sua_xe: [7, 19], hat_rong: [9, 21], danh_co: [6.5, 18.5], danh_giay: [6, 19.5] };
export function placeOpen(id: string): boolean {
  const g = ctx.g, h = hourOf(g);
  if (SHOPS[id]) return shopOpen(g, SHOPS[id]);
  const p = PLACE_HOURS[id]; return !p || (h >= p[0] && h < p[1]);
}
let _newsGeo: THREE.BufferGeometry | null = null, _cupGeo: THREE.BufferGeometry | null = null;
/** Tờ báo gấp đôi — cầm ở tay phải khi đứng đọc. */
function paperProp(): THREE.Mesh {
  if (!_newsGeo) { const m = new MB(); m.box(-0.11, 0, 0, 0.22, 0.3, 0.006, 0xf7f4ea, 0xd9d2c0, 0, true); m.box(0.11, 0, 0, 0.22, 0.3, 0.006, 0xfbf8f0, 0xe6dfcb, 0, true); for (let i = 0; i < 5; i++) { m.box(-0.11, 0.04 + i * 0.05, 0.004, 0.16, 0.012, 0.002, 0x9a927f); m.box(0.11, 0.04 + i * 0.05, 0.004, 0.16, 0.012, 0.002, 0x9a927f); } _newsGeo = m.build(); }
  return new THREE.Mesh(_newsGeo, MAT.litDouble);
}
/** Ly nước nhựa. */
function cupProp(): THREE.Mesh {
  if (!_cupGeo) { const m = new MB(); m.cyl(0, 0, 0, 0.035, 0.1, 0xd0ecf7, 8, 0.042); m.cyl(0, 0.05, 0, 0.034, 0.05, 0x8a5a22, 8); m.cyl(0, 0.1, 0, 0.04, 0.012, 0xf7f7f7, 8); _cupGeo = m.build(); }
  return new THREE.Mesh(_cupGeo, MAT.lit);
}
let _paperGeo: THREE.BufferGeometry | null = null;
/** Cục giấy vo tròn (dùng chung một hình cho mọi lần ném). */
function paperGeo(): THREE.BufferGeometry {
  if (!_paperGeo) { const m = new MB(); m.sph(0, 0, 0, 0.1, 0.09, 0.1, 0xfbf8ef, 6); m.sph(0.042, 0.03, 0.014, 0.07, 0.062, 0.07, 0xeee7d4, 5); m.sph(-0.036, -0.028, 0.026, 0.068, 0.06, 0.068, 0xe6dfcb, 5); _paperGeo = m.build(); }
  return _paperGeo;
}
const APRON: Record<string, number> = { m_thit: 0xf3f0e8, m_haisan: 0x2f6fa8, bakery: 0xf3f0e8, eatery: 0xd9463c, mart: 0x1f9d55, m_trung: 0xf3ead2 };

export class Npcs {
  list: Npc[] = []; fixed = new Map<string, Npc>(); private seq = 1; private spawnT = 0; private R = new RNG((Math.random() * 1e9) | 0); private barkCd = 4;
  private browses: { n: Npc; shop: string }[] = []; private browseT = 6;
  private rudeCd = 20; private paper: { m: THREE.Mesh; t: number; dur: number; from: THREE.Vector3; to: THREE.Vector3 }[] = [];
  group = new THREE.Group(); private pool: Rig[] = [];
  constructor() {
    ctx.scene.add(this.group);
    for (const f of Object.values(FIXED)) {
      const a = ctx.world.anchors['v_' + f.id]; if (!a) continue;
      const arch = f.id === 'shark' ? ARCH.giangho : f.fem ? ARCH.hangrong : ARCH.taixe;
      const n = this.make('fixed', arch, f.fem, lookFromFixed(f, APRON[f.id] ?? 0), a.x, a.z, a.yaw);
      n.name = f.name; n.fixedId = f.id; n.state = 'fixed'; n.home = { x: a.x, z: a.z, yaw: a.yaw }; n.y = a.y - 0.0; this.fixed.set(f.id, n);
      if (f.id === 'shark' || f.id === 'tro' || f.id === 'net_bi' || f.id === 'net_nhung' || f.id === 'tra_da' || f.id === 'danh_co' || f.id === 'danh_giay') n.pose = 'sit';
      if (f.id === 'rap') n.dance = true;
    }
  }
  private make(kind: Npc['kind'], arch: ArchDef, fem: boolean, look: Look, x: number, z: number, yaw: number): Npc {
    const rig = this.pool.pop() ?? new Rig(); rig.setLook(look); rig.pose = 'idle'; rig.hold(null); this.group.add(rig.root);
    const n: Npc = { id: this.seq++, rig, kind, arch, fem, name: '', x, z, y: groundY(x, z), yaw, speed: arch.speed, vel: 0, state: 'stand', pose: 'idle', base: 0, path: [], pi: 0, enter: false, timer: 0, rudeT: this.R.range(30, 120),
      ox: this.R.range(-0.45, 0.45), oz: this.R.range(-0.45, 0.45), patience: 0, waited: 0, slot: -1, asked: false, served: false, barkT: this.R.range(2, 20), hidden: false, talkT: 0 };
    rig.root.position.set(x, n.y, z); rig.root.rotation.y = yaw;
    this.list.push(n); return n;
  }
  remove(n: Npc) {
    const i = this.list.indexOf(n); if (i >= 0) this.list.splice(i, 1);
    n.state = 'gone'; this.group.remove(n.rig.root); n.rig.hold(null); this.pool.push(n.rig); ctx.ui.unsay(n);
  }
  name(fem: boolean) { const R = this.R; return (fem ? R.pick(['Chị', 'Cô', 'Bé', 'Dì']) : R.pick(['Anh', 'Chú', 'Bác', 'Cậu'])) + ' ' + R.pick(fem ? NAMES.nu : NAMES.nam); }
  /** Chọn nhóm người phù hợp với khu phố và giờ giấc. */
  pickArch(d: District, h: number): ArchDef {
    return this.R.weighted(ARCH_LIST, (a) => (h >= a.hours[0] && h <= a.hours[1] ? a.w * (a.where[d] ?? 0.25) : 0)) ?? ARCH.congnhan;
  }
  private destFor(n: Npc, from: NavNode): NavNode {
    const R = this.R, h = hourOf(ctx.g);
    for (let i = 0; i < 12; i++) {
      const c = NAV[R.int(0, NAV.length - 1)], d2 = dist2(c.x, c.z, from.x, from.z);
      if (d2 < 30 * 30 || d2 > 150 * 150 || !c.tag || c.tag.startsWith('mid')) continue;
      let w = (n.arch.where[c.district] ?? 0.3);
      if (c.tag === 'bench' || c.tag === 'park') w *= h > 15 || h < 8 ? 2 : 0.8;
      if (c.tag === 'stall' || c.tag === 'market') w *= h < 11 ? 2.5 : h > 18 ? 0.2 : 1;
      if (c.tag === 'school') w *= n.arch.id === 'hocsinh' ? 4 : 0.2;
      if (c.tag === 'office') w *= n.arch.id === 'vanphong' ? 3 : 0.5;
      if (c.tag === 'exit') w *= 0.6; if (c.tag === 'camp' || c.tag === 'hobo' || c.tag === 'under') w *= n.arch.id === 'vogiacu' ? 3 : 0.05; if (c.tag === 'yard' || c.tag === 'dock') w *= 0.3;
      if (R.chance(clamp(w / 3))) return c;
    }
    return NAV[R.int(0, NAV.length - 1)];
  }
  /** Đặt lộ trình đi bộ tới một nút của đồ thị. */
  route(n: Npc, to: NavNode, fromDoor = false) {
    const from = nearestNode(n.x, n.z), ids = findPath(from.id, to.id);
    n.path = ids.map((id) => [NAV[id].x + n.ox, NAV[id].z + n.oz]);
    if (fromDoor && from.door) n.path.unshift([from.door[0], from.door[1]]);
    n.enter = !!to.door && to.tag !== 'alley'; if (n.enter) n.path.push([to.door![0], to.door![1]]);
    n.pi = 0; n.dest = to; n.state = 'walk'; n.pose = 'walk';
  }
  goto(n: Npc, x: number, z: number, onArrive?: (n: Npc) => void) {
    // đi theo đồ thị tới gần rồi rẽ thẳng vào điểm đích
    const from = nearestNode(n.x, n.z), to = nearestNode(x, z), ids = dist2(n.x, n.z, x, z) > 14 * 14 ? findPath(from.id, to.id) : [];
    n.path = ids.map((id) => [NAV[id].x + n.ox, NAV[id].z + n.oz] as [number, number]); n.path.push([x, z]); n.pi = 0; n.enter = false; n.pose = 'walk'; n.onArrive = onArrive;
  }
  spawnPed(nearX: number, nearZ: number, minD = 34, maxD = 80, arch?: ArchDef): Npc | null {
    const R = this.R, h = hourOf(ctx.g), p = ctx.player, [fx, fz] = p.fwd;
    // Chỉ bốc trong số các nút nằm đúng vành khoảng cách. (Trước đây bốc đại trên cả bản đồ nên vành hẹp quanh quầy
    // hay trượt hết cả 14 lần → khách hoặc nhân vật sự kiện lặng lẽ không xuất hiện.)
    const ring = NAV.filter((c) => { const d2 = dist2(c.x, c.z, nearX, nearZ); return d2 >= minD * minD && d2 <= maxD * maxD && c.tag !== 'alley'; });
    for (let t = 0; t < 14 && ring.length; t++) {
      const c = ring.splice(R.int(0, ring.length - 1), 1)[0];
      const sx = c.door ? c.door[0] : c.x, sz = c.door ? c.door[1] : c.z, pd = Math.sqrt(dist2(sx, sz, p.x, p.z));
      const inView = ((sx - p.x) * fx + (sz - p.z) * fz) / (pd || 1) > 0.5;
      if (pd < 16 || (!c.door && inView && pd < 60)) continue;
      const a = arch ?? this.pickArch(c.district, h), fem = R.chance(a.fem);
      const n = this.make('ped', a, fem, lookFromArch(a, R, fem), sx, sz, R.range(0, 6.28));
      n.name = this.name(fem); n.speed = a.speed * R.range(0.9, 1.1); this.route(n, this.destFor(n, c), false);
      if (c.door) n.path.unshift([c.x + n.ox, c.z + n.oz]);
      if (a.id === 'phuhuynh' && R.chance(0.55)) { const k = this.make('kid', ARCH.treem, R.chance(0.5), lookFromArch(ARCH.treem, R), sx, sz, 0); k.parent = n; k.state = 'follow'; k.pose = 'walk'; k.speed = 2; k.name = 'Bé ' + R.pick(NAMES.nu); }
      return n;
    }
    return null;
  }
  /** Tìm người đi đường gần đó để trở thành khách của quầy. */
  recruit(x: number, z: number, r: number): Npc | null {
    let best: Npc | null = null, bd = r * r;
    for (const n of this.list) { if (n.kind !== 'ped' || n.state !== 'walk' || n.served || n.persona || n.arch.id === 'giangho' || n.arch.id === 'congan') continue; const d = dist2(n.x, n.z, x, z); if (d < bd && d > 9) { bd = d; best = n; } }
    return best;
  }
  spawnActor(archId: ArchId, name: string, actor: string, x: number, z: number, fem?: boolean): Npc | null {
    const a = ARCH[archId], n = this.spawnPed(x, z, 18, 42, a); if (!n) return null;
    n.kind = 'actor'; n.actor = actor; n.name = name; if (fem !== undefined && fem !== n.fem) { n.fem = fem; n.rig.setLook(lookFromArch(a, this.R, fem)); }
    return n;
  }
  say(n: Npc, text: string, secs = 3.2, expr = -1) { ctx.ui.say(n, text, secs); n.talkT = Math.min(secs, 2.2); if (expr >= 0) n.rig.setExpr(expr, secs); else n.rig.exprT = Math.min(secs, 2.2); }
  /** Khạc nhổ (khi xin tiền bị từ chối, hoặc gặp người khó ở). */
  spit(n: Npc) {
    if (ctx.mode !== 'play') return;
    ctx.sound.play('spit'); this.say(n, this.R.pick(LINES.rude.spit), 2.2, 4);
    ctx.g.st.mood = clamp(ctx.g.st.mood - 3, 0, 100);
    toast('Ai đó khạc nhổ ngay trước mặt bạn. Chỉ còn biết lắc đầu đi tiếp.', 'warn');
  }
  /**
   * Ăn một cú đấm: la lên, mất uy tín, người xung quanh nhìn thấy.
   * Người đi đường thì một nửa quay lại đánh, nửa kia bỏ chạy; người đứng bán thì giận, không nói chuyện nữa một lúc.
   */
  hit(n: Npc) {
    if (ctx.mode !== 'play') return;
    const R = this.R, g = ctx.g, L = LINES.hit;
    ctx.sound.play('thud');
    n.hurt = (n.hurt ?? 0) + 1;
    this.say(n, R.pick(L.cry), 2.4, 4);
    g.st.mood = clamp(g.st.mood + 1, 0, 100);
    g.rep = clamp(g.rep - 3, 0, 100);
    // người đứng gần thấy hết: mỗi hai người chứng kiến thì mất thêm uy tín
    let seen = 0;
    for (const o of this.list) { if (o === n || o.hidden) continue; if (dist2(o.x, o.z, n.x, n.z) < 9 && seen < 4) { seen++; if (seen <= 2) this.say(o, R.pick(L.witness), 2, 5); } }
    if (seen >= 2) g.rep = clamp(g.rep - 1, 0, 100);
    toast(n.hurt > 1 ? `Bạn đánh ${n.name} lần nữa. Người đi đường bắt đầu né ra xa.` : `Bạn đấm ${n.name}. Cả khúc đường quay lại nhìn.`, 'bad', 'angry');
    if (n.state === 'fixed') { n.madUntil = ctx.time + 90; this.say(n, R.pick(L.cry), 2.4, 4); return; }
    // khách đang chờ thì bỏ đi
    if (n.state === 'queue' || n.state === 'toStall') { n.order = undefined; ctx.ui.unorder(n); }
    n.path = []; n.pose = 'angry';
    if (n.hurt >= 3 || R.chance(0.55)) this.chase(n, 3.4);
    else { this.say(n, R.pick(L.run), 2.6, 4); this.leave(n); }
  }
  /** Công an phường đi tuần: gọi một chú lại gần để hỏi giấy tờ khi người chơi bị để ý. */
  sendPolice(): Npc | null {
    if (ctx.mode !== 'play') return null;
    if (this.list.some((n) => n.state === 'cop')) return null;
    const p = ctx.player;
    // spawnPed chỉ bốc nút cách người chơi ≥16 m, mà công an phải đi bộ tới được ngay → tự bốc nút gần.
    const ring = NAV.filter((c) => { const d = Math.sqrt(dist2(c.x, c.z, p.x, p.z)); return d >= 9 && d <= 26 && c.tag !== 'alley'; });
    if (!ring.length) return null;
    const c = ring[this.R.int(0, ring.length - 1)];
    const a = ARCH.congan, fem = this.R.chance(a.fem);
    const n = this.make('ped', a, fem, lookFromArch(a, this.R, fem), c.door ? c.door[0] : c.x, c.door ? c.door[1] : c.z, this.R.range(0, 6.28));
    n.speed = 2.6; n.state = 'cop'; n.path = []; n.pose = 'walk'; n.hit = false; n.talkT = 0;
    n.name = 'Công an khu vực';
    this.say(n, this.R.pick(['Đứng lại chú em!', 'Chú em ơi, lại đây một chút.', 'Giấy tờ đâu, cho xem qua.']), 2.6);
    ctx.sound.play('shout');
    return n;
  }
  /** Đuổi theo người chơi một quãng rồi bỏ đi. */
  chase(n: Npc, secs = 4.5) {
    if (ctx.mode !== 'play' || n.state === 'chase' || n.state === 'fixed') return;
    n.state = 'chase'; n.chaseT = secs; n.path = []; n.pose = 'angry'; n.hit = false;
    this.say(n, this.R.pick(LINES.rude.chase), 2.6, 4);
    ctx.sound.play('shout');
  }
  /** Một phen xấc xược: ném giấy, khạc nhổ, mắng rồi đuổi. Chỉ thỉnh thoảng mới xảy ra (xem RUDE). */
  private rude(n: Npc, force?: 'paper' | 'spit' | 'curse') {
    const R = this.R, L = LINES.rude, p = ctx.player, w = RUDE[n.arch.id] ?? 1;
    const act = force ?? R.weighted(['paper', 'spit', 'curse'] as const, (k) => (k === 'paper' ? 1.7 : k === 'spit' ? 1 : w > 2 ? 1.6 : 0.7));
    if (act === 'paper') {
      this.say(n, R.pick(L.paper), 2, 4);
      const m = new THREE.Mesh(paperGeo(), MAT.lit);
      const from = new THREE.Vector3(n.x, n.y + 1.15, n.z), to = new THREE.Vector3(p.x, p.y + 1.3, p.z);
      m.position.copy(from); m.castShadow = false; ctx.scene.add(m);
      this.paper.push({ m, t: 0, dur: 0.5 + R.range(0, 0.25), from, to });
    } else if (act === 'spit') this.spit(n);
    else if (R.chance(0.55)) this.chase(n);
    else { this.say(n, R.pick(L.curse), 2.6, 4); ctx.sound.play('shout'); n.talkT = 2.2; }
  }
  near(x: number, z: number, r: number, f?: (n: Npc) => boolean): Npc | null {
    let best: Npc | null = null, bd = r * r;
    for (const n of this.list) { if (n.hidden || (f && !f(n))) continue; const d = dist2(n.x, n.z, x, z); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  /** Cho NPC rời đi (đi tiếp tới nơi khác). */
  leave(n: Npc) { n.persona = undefined; n.order = undefined; n.slot = -1; n.served = true; ctx.ui.unorder(n); n.state = 'walk'; this.route(n, this.destFor(n, nearestNode(n.x, n.z))); n.kind = n.kind === 'actor' ? 'ped' : n.kind; }

  update(dt: number) {
    const g = ctx.g, p = ctx.player, h = hourOf(g), R = this.R, q = QUALITY[ctx.set.quality], w = wx(g);
    // mật độ người theo giờ, thời tiết, sự kiện
    const d = districtAt(p.x, p.z), m = mods(g, d);
    const dens = clamp(hourCurve(h, d) * 0.85 * (0.35 + 0.65 * w.cust) * Math.min(m.traffic, 1.8), 0.06, 1.35);
    const want = Math.round(clamp(q.npcs * dens, 3, q.npcs * 1.15));
    let peds = 0; for (const n of this.list) if (n.kind === 'ped' || n.kind === 'actor') peds++;
    this.spawnT -= dt;
    if (peds < want && this.spawnT <= 0 && ctx.mode !== 'menu') { this.spawnT = peds < want * 0.5 ? 0.15 : 0.9; this.spawnPed(p.x, p.z, peds < 4 ? 22 : 34, 85); }
    this.barkCd -= dt; this.rudeCd -= dt;
    this.browseT -= dt; if (this.browseT <= 0) { this.browseT = R.range(2.5, 6); this.manageShoppers(); }
    const rainHurry = w.rain > 0.3 ? 1.3 : 1, viewD = Math.min(95, ctx.env.fog.far * 0.62);
    for (let i = this.list.length - 1; i >= 0; i--) {
      const n = this.list[i], pd2 = dist2(n.x, n.z, p.x, p.z);
      if (n.state === 'fixed') { this.updFixed(n, pd2, dt); continue; }
      if (pd2 > 105 * 105 && n.state !== 'toStall' && n.state !== 'queue' && n.state !== 'actor') { if (n.kind !== 'kid') this.remove(n); else if (!n.parent || n.parent.state === 'gone') this.remove(n); continue; }
      n.vel = 0;
      if (n.state === 'follow') {
        const par = n.parent!; if (par.state === 'gone') { this.remove(n); continue; }
        const tx = par.x - Math.sin(par.yaw) * 0.6 + Math.cos(par.yaw) * 0.45, tz = par.z - Math.cos(par.yaw) * 0.6 - Math.sin(par.yaw) * 0.45;
        this.step(n, tx, tz, par.vel > 0.1 ? par.speed * 1.15 : 1.2, dt, 0.35); n.pose = n.vel > 0.1 ? 'walk' : par.pose === 'sit' ? 'idle' : 'idle';
      } else if (n.path.length && n.pi < n.path.length && (n.state === 'walk' || n.state === 'toStall' || n.state === 'actor')) {
        const [tx, tz] = n.path[n.pi];
        const sp = n.speed * rainHurry * (n.state === 'toStall' ? 1.1 : 1);
        if (this.step(n, tx, tz, sp, dt, n.pi === n.path.length - 1 ? 0.18 : 0.5)) {
          n.pi++;
          if (n.pi >= n.path.length) {
            n.path = [];
            if (n.onArrive) { const f = n.onArrive; n.onArrive = undefined; n.pose = 'idle'; f(n); }
            else if (n.enter) { this.remove(n); continue; }
            else this.arrive(n);
          }
        }
        this.idleOff(n); // đang đi thì không cầm báo, không cầm ly
        n.pose = n.state === 'walk' || n.vel > 0.1 ? 'walk' : n.pose;
      } else if (n.state === 'cop') {
        // đi thẳng tới người chơi rồi gọi lại hỏi giấy tờ
        n.pose = 'walk';
        const dd = Math.sqrt(pd2) || 0.001;
        if (dd > 1.9) this.step(n, p.x, p.z, n.speed, dt, 0.9);
        else if (!n.hit) { n.hit = true; n.state = 'stand'; n.chaseT = 0; ctx.acts.caught(n); }
      } else if (n.state === 'chase') {
        n.chaseT = (n.chaseT ?? 2) - dt; n.pose = 'angry';
        const dd = Math.sqrt(pd2) || 0.001;
        if (dd > 1.3) this.step(n, p.x, p.z, n.speed * 1.5, dt, 0.9);
        else if (!n.hit) {
          // xô một cái: người chơi lùi lại vài bước, tinh thần tụt
          n.hit = true; ctx.sound.play('shout');
          if (ctx.mode === 'play') {
            const k = 0.6 / dd, o = { x: p.x + (p.x - n.x) * k, z: p.z + (p.z - n.z) * k };
            ctx.world.resolve(o.x, o.z, 0.3, o); p.x = o.x; p.z = o.z;
          }
          g.st.mood = clamp(g.st.mood - 4, 0, 100);
          toast('Bị xô một cái. Bạn lùi lại vài bước cho lành.', 'bad');
        }
        if (n.chaseT <= 0) { n.hit = false; n.state = 'walk'; n.pose = 'walk'; n.persona = undefined; n.served = true; this.route(n, this.destFor(n, nearestNode(n.x, n.z))); }
      } else if (n.state === 'stand' || n.state === 'sit') {
        n.timer -= dt; if (n.timer <= 0) { this.idleOff(n); n.pose = 'walk'; this.route(n, this.destFor(n, nearestNode(n.x, n.z))); }
      }
      // né người chơi
      if (pd2 < 0.55 * 0.55 && n.state !== 'queue') { const dd = Math.sqrt(pd2) || 0.01; n.x += ((n.x - p.x) / dd) * dt * 1.5; n.z += ((n.z - p.z) / dd) * dt * 1.5; }
      // lời vu vơ
      if (n.kind === 'ped' && n.state === 'walk' && pd2 < 30 && this.barkCd <= 0 && ctx.mode === 'play') { n.barkT -= dt; if (n.barkT <= 0) { n.barkT = 60; this.barkCd = R.range(7, 15);
        const pool = w.rain > 0.3 && R.chance(0.4) ? LINES.rain : w.id === 'nong' && R.chance(0.4) ? LINES.hot : w.id === 'lanh' && R.chance(0.3) ? LINES.cold : LINES.bark[n.arch.id];
        this.say(n, say(R.pick(pool), n.arch, n.fem, g), 2.6); } }
      // thỉnh thoảng có người xấc xược: chỉ những nhóm trong bảng RUDE, chỉ khi đi ngang gần, và rất thưa
      if (n.kind === 'ped' && !n.persona && (n.state === 'walk' || n.state === 'stand') && pd2 < 7.5 * 7.5 && this.rudeCd <= 0) {
        n.rudeT -= dt;
        if (n.rudeT <= 0) {
          n.rudeT = R.range(80, 240);
          if ((RUDE[n.arch.id] ?? 0) > 0 && R.chance(0.3)) { this.rudeCd = R.range(50, 110); this.rude(n); }
        }
      }
      this.pose(n, pd2, dt, viewD);
    }
    // cục giấy đang bay
    for (let i = this.paper.length - 1; i >= 0; i--) {
      const f = this.paper[i], k = Math.min(1, (f.t += dt) / f.dur);
      f.m.position.set(f.from.x + (f.to.x - f.from.x) * k, f.from.y + (f.to.y - f.from.y) * k + Math.sin(k * Math.PI) * 0.8, f.from.z + (f.to.z - f.from.z) * k);
      f.m.rotation.x += dt * 8; f.m.rotation.z += dt * 5;
      if (k >= 1) {
        ctx.scene.remove(f.m); this.paper.splice(i, 1);
        ctx.sound.play('paper');
        if (dist2(f.to.x, f.to.z, p.x, p.z) < 4) { g.st.mood = clamp(g.st.mood - 2, 0, 100); toast('Một cục giấy bay trúng vai bạn. Ai đó cười khẩy phía sau.', 'info'); }
      }
    }
  }
  private arrive(n: Npc) {
    const R = this.R, tag = n.dest?.tag;
    if (tag === 'bench') { n.state = 'sit'; n.pose = 'sit'; n.timer = R.range(18, 45); const b = ctx.world.benches.reduce((a, c) => (dist2(c.x, c.z, n.x, n.z) < dist2(a.x, a.z, n.x, n.z) ? c : a)); if (dist2(b.x, b.z, n.x, n.z) < 30) { n.x = b.x + R.range(-0.4, 0.4) * Math.cos(b.yaw); n.z = b.z - R.range(-0.4, 0.4) * Math.sin(b.yaw); n.yaw = b.yaw; n.y = 0.12 + 0.2; } }
    else if (tag === 'stall') { n.state = 'stand'; n.pose = R.chance(0.5) ? 'talk' : 'idle'; n.timer = R.range(7, 16); n.yaw = n.z < 0 ? Math.PI : 0; }
    else if (tag === 'park' || tag === 'market' || tag === 'yard' || tag === 'hobo' || tag === 'camp' || tag === 'under') { n.state = 'stand'; n.pose = 'idle'; n.timer = R.range(3, 10); }
    else if (tag === 'exit') this.remove(n);
    else { n.state = 'stand'; n.pose = 'idle'; n.timer = R.range(1, 4); }
  }
  /** Bước về phía (tx,tz). Trả về true khi tới nơi. */
  private step(n: Npc, tx: number, tz: number, sp: number, dt: number, tol: number): boolean {
    const dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz);
    if (d < tol) return true;
    const s = Math.min(d, sp * dt); n.x += (dx / d) * s; n.z += (dz / d) * s; n.vel = sp;
    n.yaw += angDiff(n.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 9);
    return false;
  }
  private pose(n: Npc, pd2: number, dt: number, viewD: number) {
    const rig = n.rig, vis = pd2 < viewD * viewD;
    if (rig.root.visible !== vis) rig.root.visible = vis;
    if (!vis) return;
    if (n.state !== 'sit') n.y = damp(n.y, groundY(n.x, n.z), 12, dt);
    rig.root.position.set(n.x, n.y, n.z); rig.root.rotation.y = n.yaw;
    if (n.talkT > 0) n.talkT -= dt;
    // hành động lúc rảnh
    if (n.idleT2 !== undefined) {
      n.idleT2 -= dt;
      if (n.idleT2 <= 0) this.idleOff(n);
    } else if (n.state === 'stand' && !n.persona && pd2 < 26 * 26) {
      n.idleT = (n.idleT ?? this.R.range(8, 22)) - dt;
      if (n.idleT <= 0 && this.R.chance(0.4)) this.idleAct(n);
    }
    rig.pose = n.talkT > 0 && n.pose !== 'sit' && n.pose !== 'walk' && n.pose !== 'angry' ? 'talk' : n.pose;
    if (pd2 < 45 * 45) rig.update(dt, n.vel, n.base); 
    rig.shadow(QUALITY[ctx.set.quality].blob && pd2 < 26 * 26);
  }
  /** Giữ cho mỗi quán đang mở có một hai người đứng mua — phố đỡ vắng, tiệm đỡ như bỏ hoang. */
  private manageShoppers() {
    const R = this.R, g = ctx.g, p = ctx.player, q = QUALITY[ctx.set.quality];
    for (let i = this.browses.length - 1; i >= 0; i--) { const b = this.browses[i]; if (b.n.state !== 'stand' || b.n.hidden || !this.list.includes(b.n)) this.browses.splice(i, 1); }
    const want = clamp(Math.round((q?.npcs ?? 16) / 12), 1, 3);
    if (ctx.mode !== 'play' || this.browses.length >= want) return;
    if (this.list.length >= Math.round(q.npcs * 1.15)) return; // đừng vượt hạn mức người của mức đồ hoạ
    const cands: string[] = [];
    for (const id of Object.keys(SHOPS)) {
      const a = ctx.world.anchors['v_' + id]; if (!a || !FIXED[id] || this.browses.some((b) => b.shop === id)) continue;
      const d2 = dist2(a.x, a.z, p.x, p.z);
      if (!placeOpen(id) || d2 < 9 * 9 || d2 > 52 * 52) continue;
      cands.push(id);
    }
    if (!cands.length) return;
    const id = R.pick(cands), a = ctx.world.anchors['v_' + id];
    const side = R.chance(0.5) ? -1 : 1, dist = R.range(1.35, 1.95), c = Math.cos(a.yaw), sn = Math.sin(a.yaw);
    const pos = { x: a.x + sn * dist + c * side * 0.72, z: a.z + c * dist - sn * side * 0.72 };
    ctx.world.resolve(pos.x, pos.z, 0.34, pos);
    const arch = this.pickArch(districtAt(pos.x, pos.z), hourOf(g)), fem = R.chance(arch.fem);
    const n = this.make('ped', arch, fem, lookFromArch(arch, this.R, fem), pos.x, pos.z, a.yaw + Math.PI);
    n.name = this.name(fem); n.state = 'stand'; n.pose = 'idle'; n.timer = R.range(16, 42); n.base = R.range(-0.04, 0.04);
    this.list.push(n); this.browses.push({ n, shop: id });
    if (R.chance(0.55)) this.say(n, R.pick(['Bán cho tôi một phần nghen.', 'Cái này bao nhiêu vậy chú?', 'Cho con thêm ít rau.', 'Tính tiền giúp tôi.', 'Còn tươi không cô?']), 2.6);
  }
  /** Thôi đọc báo / uống nước / tám chuyện: trả về dáng đứng thường và bỏ đồ khỏi tay. */
  private idleOff(n: Npc) {
    if (n.idleT2 === undefined && n.chatWith === undefined) return;
    const o = n.chatWith !== undefined ? this.list.find((x) => x.id === n.chatWith) : undefined;
    n.idleT2 = undefined; n.chatWith = undefined;
    if (n.pose === 'read' || n.pose === 'drink' || n.pose === 'chat') n.pose = 'idle';
    n.rig.hold(null); n.idleT = this.R.range(18, 50);
    if (o) { o.chatWith = undefined; if (o.pose === 'chat') o.pose = 'idle'; o.rig.hold(null); }
  }
  /** Việc lúc rảnh: đọc báo, uống nước, tám chuyện với người bên cạnh (thưa, chỉ khi đang đứng chờ). */
  private idleAct(n: Npc) {
    const R = this.R;
    if (n.talkT > 0 || n.persona) return;
    const k = R.pick(['read', 'drink', 'chat'] as const), dur = R.range(5, 11);
    if (k === 'chat') {
      const o = this.list.find((x) => x !== n && x.kind === 'ped' && (x.state === 'stand' || x.state === 'sit') && !x.persona && dist2(x.x, x.z, n.x, n.z) < 3.4 * 3.4);
      if (!o) { n.pose = 'idle'; return; }
      o.pose = 'chat'; o.idleT2 = dur; o.chatWith = n.id; n.chatWith = o.id;
      o.yaw = Math.atan2(n.x - o.x, n.z - o.z); n.yaw = Math.atan2(o.x - n.x, o.z - n.z);
      if (R.chance(0.5)) this.say(n, 'Chuyện đó thiệt hả?', 2.2);
    }
    n.pose = k; n.idleT2 = dur;
    n.rig.hold(k === 'read' ? paperProp() : k === 'drink' ? cupProp() : null);
  }
  private updFixed(n: Npc, pd2: number, dt: number) {
    const open = placeOpen(n.fixedId!), vis = open && pd2 < 60 * 60;
    n.hidden = !open;
    if (n.rig.root.visible !== vis) n.rig.root.visible = vis;
    if (!vis) return;
    const p = ctx.player, hm = n.home!;
    if (pd2 < 16 && n.pose !== 'sit') n.yaw += angDiff(n.yaw, Math.atan2(p.x - n.x, p.z - n.z)) * Math.min(1, dt * 5); else n.yaw += angDiff(n.yaw, hm.yaw) * Math.min(1, dt * 3);
    n.rig.root.position.set(n.x, n.y, n.z); n.rig.root.rotation.y = n.yaw;
    if (n.talkT > 0) n.talkT -= dt;
    n.rig.pose = n.pose === 'sit' ? 'sit' : n.talkT > 0 ? 'talk' : n.dance && pd2 < 26 * 26 ? 'dance' : 'idle';
    if (pd2 < 40 * 40) n.rig.update(dt, 0, n.base);
    n.rig.shadow(false);
  }
}
