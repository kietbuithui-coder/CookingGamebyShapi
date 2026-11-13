// MB — bộ dựng lưới: gom rất nhiều hình khối (hộp, trụ, cầu…) có màu theo đỉnh vào MỘT BufferGeometry.
// Nhờ vậy cả một khu phố chỉ tốn vài draw call — yếu tố quyết định hiệu năng trên Android.
import * as THREE from 'three';

const colCache = new Map<number, [number, number, number]>();
const _tc = new THREE.Color();
function rgb(hex: number): [number, number, number] {
  let c = colCache.get(hex);
  if (!c) { _tc.setHex(hex); c = [_tc.r, _tc.g, _tc.b]; colCache.set(hex, c); }
  return c;
}
/** Pha hai màu hex (không gian sRGB), t=0 → a. */
export function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}
export const shade = (c: number, f: number) => (f >= 1 ? mix(c, 0xffffff, f - 1) : mix(0x000000, c, f));

const geoCache = new Map<string, THREE.BufferGeometry>();
function unitCyl(seg: number, ratio: number, cap: boolean) {
  const k = `c${seg}|${ratio.toFixed(3)}|${cap ? 1 : 0}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.CylinderGeometry(ratio, 1, 1, seg, 1, !cap); geoCache.set(k, g); }
  return g;
}
function unitSph(seg: number) {
  const k = `s${seg}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.SphereGeometry(1, seg, Math.max(4, Math.round(seg * 0.7))); geoCache.set(k, g); }
  return g;
}

export class MB {
  p: number[] = []; n: number[] = []; c: number[] = []; uv: number[] = []; idx: number[] = [];
  // biến đổi: world = T + Ry(yaw) * (local + O)
  tx = 0; ty = 0; tz = 0; cs = 1; sn = 0; ox = 0; oz = 0;
  /** baked=true: nướng sẵn sáng tối vào màu đỉnh (dùng với vật liệu không cần đèn, ví dụ nội thất). */
  constructor(public withUV = false, public baked = false) {}
  get count() { return this.p.length / 3; }

  frame(tx: number, tz: number, yaw = 0, ty = 0) { this.tx = tx; this.tz = tz; this.ty = ty; this.cs = Math.cos(yaw); this.sn = Math.sin(yaw); this.ox = 0; this.oz = 0; return this; }
  off(ox: number, oz = 0) { this.ox = ox; this.oz = oz; return this; }

  private vert(x: number, y: number, z: number, nx: number, ny: number, nz: number, r: number, g: number, b: number, u = 0, v = 0) {
    x += this.ox; z += this.oz;
    const wx = this.tx + x * this.cs + z * this.sn, wz = this.tz - x * this.sn + z * this.cs;
    const wnx = nx * this.cs + nz * this.sn, wnz = -nx * this.sn + nz * this.cs;
    if (this.baked) {
      const l = 0.6 + 0.4 * Math.max(0, wnx * 0.35 + ny * 0.85 + wnz * 0.4) + (ny < -0.5 ? -0.12 : 0);
      r *= l; g *= l; b *= l;
    }
    this.p.push(wx, y + this.ty, wz); this.n.push(wnx, ny, wnz); this.c.push(r, g, b);
    if (this.withUV) this.uv.push(u, v);
  }

  /** Tứ giác a,b (cạnh dưới) c,d (cạnh trên), ngược chiều kim đồng hồ khi nhìn từ mặt ngoài. g: làm tối cạnh dưới. */
  quad(ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx: number, cy: number, cz: number, dx: number, dy: number, dz: number,
    col: number, g = 0, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az, e2x = dx - ax, e2y = dy - ay, e2z = dz - az;
    let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const [r, gg, b] = rgb(col), k = 1 - g, i = this.count;
    this.vert(ax, ay, az, nx, ny, nz, r * k, gg * k, b * k, u0, v0);
    this.vert(bx, by, bz, nx, ny, nz, r * k, gg * k, b * k, u1, v0);
    this.vert(cx, cy, cz, nx, ny, nz, r, gg, b, u1, v1);
    this.vert(dx, dy, dz, nx, ny, nz, r, gg, b, u0, v1);
    this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
    return this;
  }

  /** Hộp: (x,z) là tâm, y là đáy. top: màu mặt trên, g: tối dần xuống đáy, bottom: có mặt đáy. */
  box(x: number, y: number, z: number, sx: number, sy: number, sz: number, col: number, top: number = col, g = 0, bottom = false) {
    const hx = sx / 2, hz = sz / 2, y1 = y + sy;
    this.quad(x + hx, y, z + hz, x + hx, y, z - hz, x + hx, y1, z - hz, x + hx, y1, z + hz, col, g);
    this.quad(x - hx, y, z - hz, x - hx, y, z + hz, x - hx, y1, z + hz, x - hx, y1, z - hz, col, g);
    this.quad(x - hx, y, z + hz, x + hx, y, z + hz, x + hx, y1, z + hz, x - hx, y1, z + hz, col, g);
    this.quad(x + hx, y, z - hz, x - hx, y, z - hz, x - hx, y1, z - hz, x + hx, y1, z - hz, col, g);
    this.quad(x - hx, y1, z + hz, x + hx, y1, z + hz, x + hx, y1, z - hz, x - hx, y1, z - hz, top);
    if (bottom) this.quad(x - hx, y, z - hz, x + hx, y, z - hz, x + hx, y, z + hz, x - hx, y, z + hz, shade(col, 0.7));
    return this;
  }

  /** Mặt phẳng nằm ngang (nhìn từ trên xuống) với UV theo toạ độ thế giới / uvScale. */
  floor(x0: number, z0: number, x1: number, z1: number, y: number, col: number, uvScale = 1) {
    // UV tính theo toạ độ cục bộ để hoa văn liền mạch
    this.quad(x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z0, col, 0, x0 / uvScale, z1 / uvScale, x1 / uvScale, z0 / uvScale);
    return this;
  }

  /** Thêm một BufferGeometry bất kỳ với tỉ lệ + xoay Y + tịnh tiến (trước biến đổi khung). */
  geo(g: THREE.BufferGeometry, sx: number, sy: number, sz: number, x: number, y: number, z: number, col: number, ry = 0, rx = 0, rz = 0, col2?: number) {
    const P = g.attributes.position as THREE.BufferAttribute, N = g.attributes.normal as THREE.BufferAttribute, I = g.index;
    const base = this.count, [r, gg, b] = rgb(col), c2 = col2 !== undefined ? rgb(col2) : null;
    const cy = Math.cos(ry), sy_ = Math.sin(ry), cx = Math.cos(rx), sx_ = Math.sin(rx), cz = Math.cos(rz), sz_ = Math.sin(rz);
    const rot = (vx: number, vy: number, vz: number): [number, number, number] => {
      // thứ tự: Z rồi X rồi Y
      let x1 = vx * cz - vy * sz_, y1 = vx * sz_ + vy * cz, z1 = vz;
      const y2 = y1 * cx - z1 * sx_, z2 = y1 * sx_ + z1 * cx;
      const x3 = x1 * cy + z2 * sy_, z3 = -x1 * sy_ + z2 * cy;
      return [x3, y2, z3];
    };
    for (let i = 0; i < P.count; i++) {
      const py = P.getY(i);
      const [vx, vy, vz] = rot(P.getX(i) * sx, py * sy, P.getZ(i) * sz);
      let [nx, ny, nz] = rot(N.getX(i) / sx, N.getY(i) / sy, N.getZ(i) / sz);
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      if (c2) { const t = clamp01(py + 0.5); this.vert(x + vx, y + vy, z + vz, nx, ny, nz, r + (c2[0] - r) * t, gg + (c2[1] - gg) * t, b + (c2[2] - b) * t); }
      else this.vert(x + vx, y + vy, z + vz, nx, ny, nz, r, gg, b);
    }
    if (I) for (let i = 0; i < I.count; i++) this.idx.push(base + I.getX(i));
    else for (let i = 0; i < P.count; i++) this.idx.push(base + i);
    return this;
  }

  /** Trụ đứng: (x,z) tâm, y đáy. r2: bán kính đỉnh (0 = nón). col2: màu chuyển dần lên đỉnh. */
  cyl(x: number, y: number, z: number, r: number, h: number, col: number, seg = 8, r2: number = r, cap = true, col2?: number) {
    return this.geo(unitCyl(seg, r > 0 ? r2 / r : 1, cap), r, h, r, x, y + h / 2, z, col, 0, 0, 0, col2);
  }
  /** Trụ nằm theo hướng bất kỳ (xoay rx/rz quanh tâm). (x,y,z) là tâm. */
  rod(x: number, y: number, z: number, r: number, len: number, col: number, rx = 0, rz = 0, seg = 6, ry = 0, r2: number = r) {
    return this.geo(unitCyl(seg, r > 0 ? r2 / r : 1, true), r, len, r, x, y, z, col, ry, rx, rz);
  }
  /** Elipxoit, (x,y,z) là tâm. */
  sph(x: number, y: number, z: number, rx: number, ry: number, rz: number, col: number, seg = 8, col2?: number) {
    return this.geo(unitSph(seg), rx, ry, rz, x, y, z, col, 0, 0, 0, col2);
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (this.withUV) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  clear() { this.p.length = this.n.length = this.c.length = this.uv.length = this.idx.length = 0; }
}
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Vật liệu dùng chung (ít vật liệu = ít lần đổi trạng thái GPU). */
export const MAT = {
  lit: new THREE.MeshLambertMaterial({ vertexColors: true }),
  litDouble: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  unlit: new THREE.MeshBasicMaterial({ vertexColors: true }),
  glow: new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0xffc46b, emissiveIntensity: 0 }),
  lamp: new THREE.MeshBasicMaterial({ vertexColors: true }),
  food: new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 55, specular: 0x555555 }),
  skin: new THREE.MeshLambertMaterial({ vertexColors: true }),
};

export function meshOf(mb: MB, mat: THREE.Material, name = ''): THREE.Mesh {
  const m = new THREE.Mesh(mb.build(), mat);
  m.name = name; m.matrixAutoUpdate = false;
  return m;
}
