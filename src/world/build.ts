// Builder: công cụ dựng thế giới. Gom hình học vào vài lưới lớn, đồng thời ghi lại va chạm, điểm mốc (anchor),
// cửa, đèn đường… để phần gameplay dùng. Prefab viết trong hệ toạ độ cục bộ của từng lô nhà.
import * as THREE from 'three';
import { MB, shade, mix } from '../gfx/mb';
import { SignAtlas, SignStyle, GroundKind } from '../gfx/tex';
import { Frame, Lot, toWorld } from './layout';
import { RNG } from '../core/util';

export interface Box2 { x0: number; z0: number; x1: number; z1: number; on?: boolean; }
export interface Circ { x: number; z: number; r: number; on?: boolean; }
export interface Anchor { x: number; y: number; z: number; yaw: number; }
export interface DoorDef { name: string; x: number; z: number; yaw: number; w: number; h: number; col: number; box: Box2; lock?: string; }
export interface ShutterDef { shop: string; x: number; z: number; yaw: number; w: number; h: number; box: Box2; }
export interface SlotDef { shop: string; idx: number; x: number; y: number; z: number; gate?: string; }

const CELL = 4, OFF = 160, DIM = 80;
export class World {
  boxes: Box2[] = []; circs: Circ[] = []; dyn: (Box2 | Circ)[] = [];
  anchors: Record<string, Anchor> = {};
  doors: DoorDef[] = []; lamps: [number, number, number][] = []; slots: SlotDef[] = [];
  bins: Anchor[] = []; benches: Anchor[] = []; litter: [number, number][] = []; taps: Anchor[] = [];
  shutters: ShutterDef[] = []; spotsMark: Anchor[] = [];
  /** Danh sách lô đất (kèm khung toạ độ) — dùng cho bản đồ, chỉ đường và công cụ thử nghiệm. */
  lots: Lot[] = [];
  /** Vùng có mái che (trú mưa): hộp chữ nhật trong toạ độ thế giới. */
  roofs: Box2[] = [];
  covered(x: number, z: number) { for (const r of this.roofs) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return true; return false; }
  private gb = new Map<number, number[]>(); private gc = new Map<number, number[]>();
  private key(ix: number, iz: number) { return ix * DIM + iz; }
  addBox(b: Box2) {
    const i = this.boxes.push(b) - 1;
    for (let ix = Math.floor((b.x0 + OFF) / CELL); ix <= Math.floor((b.x1 + OFF) / CELL); ix++)
      for (let iz = Math.floor((b.z0 + OFF) / CELL); iz <= Math.floor((b.z1 + OFF) / CELL); iz++) {
        const k = this.key(ix, iz); (this.gb.get(k) ?? this.gb.set(k, []).get(k)!).push(i);
      }
  }
  addCirc(c: Circ) {
    const i = this.circs.push(c) - 1;
    for (let ix = Math.floor((c.x - c.r + OFF) / CELL); ix <= Math.floor((c.x + c.r + OFF) / CELL); ix++)
      for (let iz = Math.floor((c.z - c.r + OFF) / CELL); iz <= Math.floor((c.z + c.r + OFF) / CELL); iz++) {
        const k = this.key(ix, iz); (this.gc.get(k) ?? this.gc.set(k, []).get(k)!).push(i);
      }
  }
  /** Đẩy một hình tròn (người) ra khỏi mọi vật cản. Trả về vị trí đã sửa. */
  resolve(x: number, z: number, r: number, out: { x: number; z: number }) {
    for (let it = 0; it < 2; it++) {
      const ix0 = Math.floor((x - r + OFF) / CELL), ix1 = Math.floor((x + r + OFF) / CELL), iz0 = Math.floor((z - r + OFF) / CELL), iz1 = Math.floor((z + r + OFF) / CELL);
      for (let ix = ix0; ix <= ix1; ix++) for (let iz = iz0; iz <= iz1; iz++) {
        const k = this.key(ix, iz), bs = this.gb.get(k), cs = this.gc.get(k);
        if (bs) for (const i of bs) { const b = this.boxes[i]; if (b.on === false) continue; const p = pushBox(x, z, r, b); if (p) { x = p[0]; z = p[1]; } }
        if (cs) for (const i of cs) { const c = this.circs[i]; if (c.on === false) continue; const p = pushCirc(x, z, r, c); if (p) { x = p[0]; z = p[1]; } }
      }
      for (const d of this.dyn) {
        if (d.on === false) continue;
        const p = 'r' in d ? pushCirc(x, z, r, d) : pushBox(x, z, r, d);
        if (p) { x = p[0]; z = p[1]; }
      }
    }
    out.x = x; out.z = z;
  }
  /** Điểm có nằm trong vật cản tĩnh không (dùng khi rải vật phẩm). */
  blocked(x: number, z: number, r = 0.3): boolean { const o = { x, z }; this.resolve(x, z, r, o); return Math.abs(o.x - x) + Math.abs(o.z - z) > 1e-4; }
}
function pushBox(x: number, z: number, r: number, b: Box2): [number, number] | null {
  const cx = x < b.x0 ? b.x0 : x > b.x1 ? b.x1 : x, cz = z < b.z0 ? b.z0 : z > b.z1 ? b.z1 : z;
  const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return null;
  if (d2 > 1e-9) { const d = Math.sqrt(d2), k = (r - d) / d; return [x + dx * k, z + dz * k]; }
  // tâm nằm trong hộp: đẩy theo trục gần mép nhất
  const l = x - b.x0, rr = b.x1 - x, t = z - b.z0, bb = b.z1 - z, m = Math.min(l, rr, t, bb);
  if (m === l) return [b.x0 - r, z]; if (m === rr) return [b.x1 + r, z]; if (m === t) return [x, b.z0 - r]; return [x, b.z1 + r];
}
function pushCirc(x: number, z: number, r: number, c: Circ): [number, number] | null {
  const dx = x - c.x, dz = z - c.z, rr = r + c.r, d2 = dx * dx + dz * dz;
  if (d2 >= rr * rr) return null;
  const d = Math.sqrt(d2) || 1e-4, k = (rr - d) / d;
  return [x + (dx || 1e-4) * k, z + dz * k];
}

export interface ChunkSet { id: string; cx: number; cz: number; lit: MB; glow: MB; unlit: MB; detail: MB; sign: MB; tileIn: MB; }
export class Builder {
  chunks = new Map<string, ChunkSet>(); cur!: ChunkSet;
  lit!: MB; glow!: MB; unlit!: MB; detail!: MB; sign!: MB; tileIn!: MB;
  marks = new MB(); festive = new MB(); roadblock = new MB();
  /** Các biển hiệu đủ lớn đã dựng (toạ độ thế giới) — để cây xanh, đồ vỉa hè… biết đường tránh, không che mất biển. */
  signs: { x: number; z: number; y0: number; y1: number; w: number; nx: number; nz: number }[] = [];
  ground: Record<GroundKind, MB> = { asphalt: new MB(true), pave: new MB(true), grass: new MB(true), dirt: new MB(true), tile: new MB(true), concrete: new MB(true), water: new MB(true), wood: new MB(true) };
  private all: MB[] = [];
  fr: Frame = { tx: 0, tz: 0, yaw: 0 }; ox = 0; oz = 0;
  constructor(public world: World, public atlas: SignAtlas) { this.chunk('misc', 0, 0); }
  /** Chuyển sang một "mảnh" thành phố: mỗi mảnh là vài lưới riêng để GPU bỏ qua phần ngoài tầm nhìn. */
  chunk(id: string, cx: number, cz: number) {
    let c = this.chunks.get(id);
    if (!c) { c = { id, cx, cz, lit: new MB(), glow: new MB(), unlit: new MB(false, true), detail: new MB(), sign: new MB(true), tileIn: new MB(true) }; this.chunks.set(id, c); }
    this.cur = c; this.lit = c.lit; this.glow = c.glow; this.unlit = c.unlit; this.detail = c.detail; this.sign = c.sign; this.tileIn = c.tileIn;
    this.all = [c.lit, c.glow, c.unlit, c.detail, c.sign, c.tileIn, this.marks, this.festive, this.roadblock, ...Object.values(this.ground)];
    return this.frame(this.fr, this.ox, this.oz);
  }
  frame(fr: Frame, ox = 0, oz = 0) { this.fr = fr; this.ox = ox; this.oz = oz; for (const m of this.all) { m.frame(fr.tx, fr.tz, fr.yaw); m.off(ox, oz); } return this; }
  /** Dựng một vật trong hệ toạ độ con (dịch + xoay so với khung hiện tại). */
  sub(lx: number, lz: number, ry: number, fn: () => void) {
    const f = this.fr, ox = this.ox, oz = this.oz, [tx, tz] = this.W(lx, lz);
    this.frame({ tx, tz, yaw: f.yaw + ry }); fn(); this.frame(f, ox, oz);
  }
  W(lx: number, lz: number): [number, number] { return toWorld(this.fr, lx + this.ox, lz + this.oz); }
  /** Ngược của W: toạ độ thế giới → toạ độ cục bộ của khung hiện tại. */
  L(wx: number, wz: number): [number, number] {
    const c = Math.cos(this.fr.yaw), s = Math.sin(this.fr.yaw), dx = wx - this.fr.tx, dz = wz - this.fr.tz;
    return [dx * c - dz * s - this.ox, dx * s + dz * c - this.oz];
  }
  /** Hướng (vectơ) thế giới → cục bộ. */
  Ldir(wx: number, wz: number): [number, number] { const c = Math.cos(this.fr.yaw), s = Math.sin(this.fr.yaw); return [wx * c - wz * s, wx * s + wz * c]; }
  collide(lx0: number, lz0: number, lx1: number, lz1: number): Box2 {
    const [ax, az] = this.W(lx0, lz0), [bx, bz] = this.W(lx1, lz1);
    const b = { x0: Math.min(ax, bx), z0: Math.min(az, bz), x1: Math.max(ax, bx), z1: Math.max(az, bz) };
    this.world.addBox(b); return b;
  }
  circle(lx: number, lz: number, r: number) { const [x, z] = this.W(lx, lz); this.world.addCirc({ x, z, r }); }
  /** phi: hướng nhìn cục bộ (0 = +z vào trong lô, π = quay ra đường). */
  anchor(name: string, lx: number, y: number, lz: number, phi = Math.PI): Anchor {
    const [x, z] = this.W(lx, lz), a = { x, y, z, yaw: this.fr.yaw + phi };
    this.world.anchors[name] = a; return a;
  }
  slot(shop: string, idx: number, lx: number, y: number, lz: number, gate?: string) { const [x, z] = this.W(lx, lz); this.world.slots.push({ shop, idx, x, y, z, gate }); }

  /** Biển chữ: (x,y,z) là tâm cạnh dưới; (nx,nz) pháp tuyến cục bộ (mặc định quay ra đường). */
  signAt(x: number, y: number, z: number, w: number, h: number, text: string, st: SignStyle, nx = 0, nz = -1, px = 64, both = false) {
    const rx = nz, rz = -nx;
    // Biển mà mép cắm vào tường nhà bên cạnh / cột điện / thùng thì teo lại cho vừa khung.
    // Trước đây cứ vẽ đủ bề ngang nên có tấm bảng thò hẳn sang nhà kế bên, nhìn như biển nhô ra.
    let hw = w / 2;
    const okW = (k: number) => {
      const [ax, az] = this.W(x - rx * hw * k, z - rz * hw * k), [bx, bz] = this.W(x + rx * hw * k, z + rz * hw * k);
      return !this.world.blocked(ax, az, 0.02) && !this.world.blocked(bx, bz, 0.02);
    };
    if (!okW(1)) for (const k of [0.93, 0.86, 0.78, 0.7]) { if (okW(k)) { hw *= k; break; } }
    const uv = this.atlas.draw(text, (hw * 2) / h, st, px > 40 ? Math.round(px * 0.7) : px);
    this.sign.quad(x - rx * hw, y, z - rz * hw, x + rx * hw, y, z + rz * hw, x + rx * hw, y + h, z + rz * hw, x - rx * hw, y + h, z - rz * hw, 0xffffff, 0, uv.u0, uv.v0, uv.u1, uv.v1);
    if (both) this.sign.quad(x + rx * hw, y, z + rz * hw, x - rx * hw, y, z - rz * hw, x - rx * hw, y + h, z - rz * hw, x + rx * hw, y + h, z + rz * hw, 0xffffff, 0, uv.u0, uv.v0, uv.u1, uv.v1);
    if (hw * 2 * h >= 0.25) {
      const [wx, wz] = this.W(x, z), c = Math.cos(this.fr.yaw), s = Math.sin(this.fr.yaw);
      this.signs.push({ x: wx, z: wz, y0: y, y1: y + h, w: hw * 2, nx: nx * c + nz * s, nz: -nx * s + nz * c });
    }
  }
  /**
   * Biển hiệu nào nằm sau một vật cao đặt ở (lx, lz) cục bộ, bán kính r, trên dãy nhà có mặt tiền z = 0?
   * Trả về mép trên cao nhất của các biển đó (0 nếu không có biển nào).
   */
  signTopBehind(lx: number, r: number): number {
    let top = 0;
    for (const sg of this.signs) {
      if (sg.y1 < 2) continue;                                       // biển thấp dưới tầm tán cây
      const [sx, sz] = this.L(sg.x, sg.z); if (sz < -1.9 || sz > 2.6) continue;      // không thuộc dãy nhà này
      const [nx] = this.Ldir(sg.nx, sg.nz), half = Math.abs(nx) > 0.7 ? 0.45 : sg.w / 2;   // biển dọc chìa ra: chỉ tính bề dày
      if (Math.abs(sx - lx) < r + half - 0.15) top = Math.max(top, sg.y1);
    }
    return top;
  }
  /** Thanh nối hai điểm (dây điện, lan can, cán ô…). */
  beam(mb: MB, ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number, col: number, seg = 5) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz) || 1e-4;
    mb.rod((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, r, L, col, Math.acos(dy / L), 0, seg, Math.atan2(dx, dz));
  }
  /** Tường thẳng theo trục cục bộ (có va chạm). */
  wall(x0: number, z0: number, x1: number, z1: number, h: number, col: number, t = 0.2, y = 0, mb: MB = this.lit, collide = true, skip = 0) {
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1), za = Math.min(z0, z1), zb = Math.max(z0, z1);
    const sx = Math.max(t, xb - xa), sz = Math.max(t, zb - za);
    mb.box((xa + xb) / 2, y, (za + zb) / 2, sx, h, sz, col, col, 0.06, y > 0, skip);
    if (collide && y < 1.2) this.collide((xa + xb) / 2 - sx / 2, (za + zb) / 2 - sz / 2, (xa + xb) / 2 + sx / 2, (za + zb) / 2 + sz / 2);
  }
  /** Lót nội thất: sàn, trần và 4 mặt tường quay vào trong (vật liệu tự sáng). gaps: khoảng hở cửa ở mặt trước [x0,x1]. */
  interior(x0: number, z0: number, x1: number, z1: number, h: number, wallCol: number, floor: number | 'tile', ceil: number, frontGaps: [number, number][] = [], doorH = 2.3) {
    const u = this.unlit, e = 0.132;
    if (floor === 'tile') this.tileIn.floor(x0, z0, x1, z1, e, 0xffffff, 2.4);
    else u.quad(x0, e, z1, x1, e, z1, x1, e, z0, x0, e, z0, floor);
    u.quad(x0, h, z0, x1, h, z0, x1, h, z1, x0, h, z1, ceil);                                   // trần (nhìn từ dưới)
    u.quad(x1, 0, z1, x0, 0, z1, x0, h, z1, x1, h, z1, wallCol, 0.1);                            // tường sau, quay về -z
    u.quad(x0, 0, z1, x0, 0, z0, x0, h, z0, x0, h, z1, wallCol, 0.1);                            // tường trái, quay về +x
    u.quad(x1, 0, z0, x1, 0, z1, x1, h, z1, x1, h, z0, wallCol, 0.1);                            // tường phải, quay về -x
    let x = x0;                                                                                  // tường trước, quay về +z
    for (const [g0, g1] of frontGaps.slice().sort((a, b) => a[0] - b[0])) {
      if (g0 > x) u.quad(x, 0, z0, g0, 0, z0, g0, h, z0, x, h, z0, wallCol, 0.1);
      if (doorH < h) u.quad(g0, doorH, z0, g1, doorH, z0, g1, h, z0, g0, h, z0, wallCol);
      x = g1;
    }
    if (x < x1) u.quad(x, 0, z0, x1, 0, z0, x1, h, z0, x, h, z0, wallCol, 0.1);
  }
  door(name: string, lx: number, lz: number, w: number, phi: number, col: number, lock?: string, h = 2.2) {
    // bản lề tại (lx,lz), cánh cửa chạy theo hướng phi (0 = +x cục bộ, π/2 = +z…)
    const ex = lx + Math.cos(phi) * w, ez = lz + Math.sin(phi) * w;
    const [x, z] = this.W(lx, lz), [ax, az] = this.W(Math.min(lx, ex) - 0.06, Math.min(lz, ez) - 0.06), [bx, bz] = this.W(Math.max(lx, ex) + 0.06, Math.max(lz, ez) + 0.06);
    const box: Box2 = { x0: Math.min(ax, bx), z0: Math.min(az, bz), x1: Math.max(ax, bx), z1: Math.max(az, bz), on: true };
    this.world.dyn.push(box);
    // hướng cánh cửa trong thế giới
    const [wx, wz] = this.W(ex, ez);
    this.world.doors.push({ name, x, z, yaw: Math.atan2(wz - z, wx - x), w, h, col, box, lock });
  }

  /** Cửa cuốn của cửa hàng: đóng lại khi hết giờ (có va chạm). Nằm trên đường thẳng z = lz, từ x0 tới x1. */
  shutter(shop: string, x0: number, x1: number, lz: number, h: number) {
    const [x, z] = this.W((x0 + x1) / 2, lz), [ax, az] = this.W(x0, lz - 0.1), [bx, bz] = this.W(x1, lz + 0.1);
    const box: Box2 = { x0: Math.min(ax, bx), z0: Math.min(az, bz), x1: Math.max(ax, bx), z1: Math.max(az, bz), on: false };
    this.world.dyn.push(box); this.world.shutters.push({ shop, x, z, yaw: this.fr.yaw, w: x1 - x0, h, box });
  }
  roofed(lx0: number, lz0: number, lx1: number, lz1: number) {
    const [ax, az] = this.W(lx0, lz0), [bx, bz] = this.W(lx1, lz1);
    this.world.roofs.push({ x0: Math.min(ax, bx), z0: Math.min(az, bz), x1: Math.max(ax, bx), z1: Math.max(az, bz) });
  }
  plant(x: number, y: number, z: number, R: RNG, s = 1, mb: MB = this.detail) {
    mb.cyl(x, y, z, 0.13 * s, 0.24 * s, R.pick([0xb5653c, 0x9c9388, 0x3f6a8a, 0xd9d2c0]), 7, 0.18 * s);
    mb.sph(x, y + 0.46 * s, z, 0.26 * s, 0.3 * s, 0.26 * s, R.pick([0x4f9a47, 0x3f8a40, 0x6fb85a]), 6, 0x7fc468);
  }
  // ───────── Vật dụng đường phố ─────────
  /**
   * Cây bóng mát. shape: 'std' tán thấp và rộng · 'tall' thân cao, tán gọn nằm trên 4,8 m (không che biển hiệu, mặt tiền)
   * · 'none' không trồng (vẫn tiêu đúng số ngẫu nhiên như khi trồng để phần còn lại của thành phố không đổi).
   */
  tree(x: number, z: number, R: RNG, h = 5.2, flower = false, planter = true, shape: 'std' | 'tall' | 'none' = 'std') {
    const d = this.lit, trunk = 0x7a5a3c;
    const g = [0x4f9a47, 0x5fae4f, 0x3f8a40, 0x6fb85a], c1 = R.pick(g), c2 = R.pick(g), c3 = R.pick(g), c4 = R.pick(g);
    if (shape === 'none') return;
    if (planter) d.box(x, 0, z, 1.1, 0.16, 1.1, 0xa59f93, 0x5b4636);
    if (shape === 'tall') {
      const top = 5.0 + (h - 4.6) * 0.3, r = 1.7 + (h - 4.6) * 0.12, yc = top + 1.25;
      d.cyl(x, 0, z, 0.22, top + 0.3, trunk, 6, 0.12);
      d.sph(x, yc, z, r, r * 0.82, r, c1, 7, c2);
      d.sph(x + r * 0.5, yc + 0.15, z + r * 0.2, r * 0.6, r * 0.5, r * 0.6, c3, 6);
      d.sph(x - r * 0.45, yc + 0.3, z - r * 0.3, r * 0.62, r * 0.5, r * 0.62, c4, 6);
      this.circle(x, z, 0.26);
      return;
    }
    d.cyl(x, 0, z, 0.2, h * 0.55, trunk, 6, 0.13);
    const r = h * 0.36;
    d.sph(x, h * 0.72, z, r, r * 0.78, r, c1, 7, c2);
    d.sph(x + r * 0.55, h * 0.62, z + r * 0.2, r * 0.62, r * 0.5, r * 0.62, c3, 6);
    d.sph(x - r * 0.5, h * 0.66, z - r * 0.35, r * 0.66, r * 0.52, r * 0.66, c4, 6);
    if (flower) for (let i = 0; i < 9; i++) { const a = R.range(0, 6.28), rr = R.range(0.3, 1) * r; this.detail.sph(x + Math.cos(a) * rr, h * 0.74 + R.range(-0.2, 0.5) * r, z + Math.sin(a) * rr, 0.22, 0.14, 0.22, R.pick([0xe2402f, 0xf0562f, 0xff7a3d]), 5); }
    this.circle(x, z, 0.24);
  }
  lamp(x: number, z: number, armX: number, armZ: number) {
    const d = this.lit, c = 0x4c5560;
    d.cyl(x, 0, z, 0.09, 5.4, c, 6, 0.06); d.cyl(x, 0, z, 0.16, 0.5, 0x3d444d, 6);
    this.beam(d, x, 5.3, z, x + armX * 1.3, 5.6, z + armZ * 1.3, 0.04, c);
    this.glow.box(x + armX * 1.4, 5.46, z + armZ * 1.4, 0.5, 0.12, 0.26, 0xfff2cf, 0xdfe3e6, 0, true);
    const [wx, wz] = this.W(x + armX * 1.4, z + armZ * 1.4); this.world.lamps.push([wx, 5.4, wz]);
    this.circle(x, z, 0.14);
  }
  pole(x: number, z: number, R: RNG) {
    const d = this.lit, c = 0x8e8a82;
    d.cyl(x, 0, z, 0.13, 7.2, c, 6, 0.09);
    d.box(x, 6.5, z, 1.5, 0.1, 0.1, 0x6b665e, undefined, 0, true); d.box(x, 6.0, z, 1.1, 0.08, 0.08, 0x6b665e, undefined, 0, true);
    if (R.chance(0.35)) this.detail.box(x, 4.6, z + 0.25, 0.5, 0.7, 0.36, 0x7d848c, undefined, 0, true);
    this.circle(x, z, 0.16);
  }
  /** Xe máy đỗ. */
  bike(x: number, z: number, ry: number, col: number) {
    this.sub(x, z, ry, () => {
      const d = this.detail, k = 0x22252a;
      for (const wx of [-0.62, 0.62]) d.rod(wx, 0.29, 0, 0.29, 0.1, k, Math.PI / 2, 0, 9);
      d.box(0, 0.36, 0, 0.9, 0.3, 0.26, col, shade(col, 1.15), 0.15, true);           // thân
      d.box(-0.25, 0.66, 0, 0.74, 0.11, 0.3, 0x2c2c30, 0x3a3a40, 0, true);            // yên
      d.box(0.5, 0.42, 0, 0.16, 0.62, 0.3, col, undefined, 0.1, true);                // yếm
      d.box(0.56, 1.0, 0, 0.06, 0.06, 0.62, 0x9aa0a6, undefined, 0, true);            // ghi đông
      d.sph(0.66, 0.9, 0, 0.09, 0.09, 0.09, 0xf7f3d0, 6);                             // đèn
      d.box(-0.72, 0.56, 0, 0.2, 0.06, 0.2, 0xb8221f, undefined, 0, true);            // đèn hậu
    });
    this.circle(x, z, 0.42);
  }
  bin(x: number, z: number, name?: string) {
    this.lit.cyl(x, 0, z, 0.3, 0.86, 0x2f7d4f, 8, 0.36); this.lit.cyl(x, 0.86, z, 0.38, 0.07, 0x25633f, 8);
    this.circle(x, z, 0.36);
    const [wx, wz] = this.W(x, z); this.world.bins.push({ x: wx, y: 0.9, z: wz, yaw: 0 });
  }
  /** Ghế đá công viên. phi: hướng người ngồi nhìn. */
  bench(x: number, z: number, ry: number) {
    this.sub(x, z, ry, () => {
      const d = this.lit, c = 0xd8d4cb;
      d.box(0, 0.4, 0, 1.7, 0.09, 0.5, c, 0xe6e2da, 0, true); d.box(0, 0.5, 0.24, 1.7, 0.5, 0.08, c, undefined, 0.05, true);
      for (const sx of [-0.68, 0.68]) d.box(sx, 0, 0, 0.14, 0.4, 0.46, 0xbdb8ae);
      this.collide(-0.85, -0.25, 0.85, 0.3);
      const [wx, wz] = this.W(0, -0.05); this.world.benches.push({ x: wx, y: 0.5, z: wz, yaw: this.fr.yaw + Math.PI });
    });
  }
  stool(x: number, z: number, col: number, h = 0.44) { this.detail.cyl(x, 0, z, 0.19, h, col, 7, 0.15); }
  table(x: number, z: number, w: number, d: number, h: number, col: number, mb: MB = this.detail, legs = 0x8a8f96) {
    mb.box(x, h - 0.05, z, w, 0.05, d, col, shade(col, 1.1), 0, true);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mb.box(x + sx * (w / 2 - 0.05), 0, z + sz * (d / 2 - 0.05), 0.045, h - 0.05, 0.045, legs);
  }
  crate(x: number, y: number, z: number, w: number, h: number, d: number, col: number, mb: MB = this.detail, fillCol?: number) {
    mb.box(x, y, z, w, h, d, col, fillCol ?? shade(col, 0.55), 0.12, y > 0.05);
  }
  pot(x: number, z: number, R: RNG, s = 1) {
    this.detail.cyl(x, 0, z, 0.17 * s, 0.3 * s, R.pick([0xb5653c, 0x9c9388, 0x3f6a8a]), 7, 0.22 * s);
    this.detail.sph(x, 0.55 * s, z, 0.3 * s, 0.34 * s, 0.3 * s, R.pick([0x4f9a47, 0x3f8a40, 0x6fb85a]), 6);
  }
  barrier(x: number, z: number, w: number, alongX = true) {
    const d = this.lit, sx = alongX ? w : 0.12, sz = alongX ? 0.12 : w;
    for (let i = 0; i < 2; i++) d.box(x, 0.45 + i * 0.36, z, sx, 0.2, sz, i ? 0xe5482f : 0xf3f0e8, undefined, 0, true);
    for (const s of [-1, 1]) d.box(x + (alongX ? s * (w / 2 - 0.1) : 0), 0, z + (alongX ? 0 : s * (w / 2 - 0.1)), 0.1, 1.0, 0.1, 0x555a60);
    this.collide(x - sx / 2, z - sz / 2, x + sx / 2, z + sz / 2);
  }
  /** Mái hiên/bạt che dốc ra phía -z. */
  awning(x0: number, x1: number, y: number, depth: number, col: number, stripe = 0xffffff, z = 0) {
    const d = this.lit, n = Math.max(2, Math.round((x1 - x0) / 0.55)), w = (x1 - x0) / n, y2 = y - depth * 0.32;
    for (let i = 0; i < n; i++) {
      const c = i % 2 ? stripe : col, xa = x0 + i * w, xb = xa + w;
      d.quad(xb, y2, z - depth, xa, y2, z - depth, xa, y, z, xb, y, z, c);                         // mặt trên
      d.quad(xa, y2 - 0.005, z - depth, xb, y2 - 0.005, z - depth, xb, y - 0.005, z, xa, y - 0.005, z, shade(c, 0.72)); // mặt dưới
      d.quad(xb, y2 - 0.22, z - depth, xa, y2 - 0.22, z - depth, xa, y2, z - depth, xb, y2, z - depth, c); // diềm
    }
  }
  /** Ô dù tròn (sạp chợ, quán nước). */
  parasol(x: number, z: number, h: number, r: number, c1: number, c2 = 0xffffff) {
    const d = this.lit, n = 8;
    d.cyl(x, 0, z, 0.03, h, 0x8a8f96, 5);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832, c = i % 2 ? c2 : c1;
      const ax = x + Math.cos(a0) * r, az = z + Math.sin(a0) * r, bx = x + Math.cos(a1) * r, bz = z + Math.sin(a1) * r;
      d.quad(bx, h - 0.45, bz, ax, h - 0.45, az, x, h, z, x, h, z, c);
      d.quad(ax, h - 0.46, az, bx, h - 0.46, bz, x, h - 0.01, z, x, h - 0.01, z, shade(c, 0.7));
    }
  }
  /** Dây cờ tam giác giăng ngang. */
  flags(ax: number, az: number, bx: number, bz: number, y: number, R: RNG) {
    const n = Math.round(Math.hypot(bx - ax, bz - az) / 0.7), cols = [0xe2402f, 0xf5c531, 0x2f8fd5, 0x3fae5a, 0xf08a2f, 0xe86f9a];
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 0.7) / n, sag = (t: number) => y - Math.sin(t * Math.PI) * 0.7;
      const x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1, c = cols[i % cols.length];
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, my = Math.min(sag(t0), sag(t1)) - 0.42;
      this.detail.quad(x0, sag(t0), z0, x1, sag(t1), z1, mx, my, mz, mx, my, mz, c);
      this.detail.quad(x1, sag(t1), z1, x0, sag(t0), z0, mx, my, mz, mx, my, mz, c);
    }
  }
}
export { shade, mix };

export function vndPhone(R: RNG) { return `09${R.int(0, 9)}${R.int(0, 9)} ${R.int(100, 999)} ${R.int(100, 999)}`; }
export const CSS = (hex: number) => '#' + hex.toString(16).padStart(6, '0');
export const V3 = THREE.Vector3;
