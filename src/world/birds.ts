// CHIM TRỜI — vài đàn chim bay vòng trên khu phố, thỉnh thoảng hót. Chỉ để thành phố có sự sống: số lượng
// giảm theo mức đồ hoạ, ban đêm và lúc mưa thì chim đi ngủ (không vẽ, không kêu).
import * as THREE from 'three';
import { ctx, QUALITY } from '../game/ctx';
import { MB, MAT } from '../gfx/mb';
import { RNG, TAU, dist2 } from '../core/util';
import { NAV } from '../world/layout';

interface Bird {
  g: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh;
  cx: number; cz: number; r: number; y: number; a: number; w: number; flap: number; bob: number;
}
let _body: THREE.BufferGeometry | null = null, _wing: THREE.BufferGeometry | null = null;
function bodyGeo() {
  if (!_body) { const m = new MB(); m.sph(0, 0, 0, 0.1, 0.09, 0.24, 0xb0a898, 6); m.sph(0, 0.055, 0.2, 0.065, 0.06, 0.065, 0x6f6a60, 5); m.box(0, 0.005, -0.26, 0.12, 0.02, 0.12, 0x8a857a); _body = m.build(); }
  return _body;
}
function wingGeo() {
  // một cánh: gốc ở x=0, vuông ra +x; hình tam giác dẹt để nhìn từ dưới vẫn ra cánh chim
  if (!_wing) { const m = new MB(); m.quad(0, 0, 0.08, 0, 0, -0.06, 0.42, 0.015, -0.14, 0.42, 0.015, 0.03, 0xc8bfa8); _wing = m.build(); }
  return _wing;
}

export class Birds {
  group = new THREE.Group(); private list: Bird[] = []; private R = new RNG(9081); private chirpT = 6;
  constructor() { ctx.scene.add(this.group); this.sync(); }
  /** Số chim theo mức đồ hoạ hiện tại (0 → 1 con, cao nhất → 7 con). */
  private want() { return QUALITY[ctx.set.quality]?.birds ?? 4; }
  private mk(): Bird {
    const R = this.R, g = new THREE.Group(), wingL = new THREE.Mesh(wingGeo(), MAT.litDouble), wingR = new THREE.Mesh(wingGeo(), MAT.litDouble);
    wingL.scale.x = -1;                                                        // cánh trái lật ngược
    g.add(new THREE.Mesh(bodyGeo(), MAT.litDouble), wingL, wingR);
    g.scale.setScalar(R.range(1.25, 1.85));
    this.group.add(g);
    const b: Bird = { g, wingL, wingR, cx: 0, cz: 0, r: R.range(14, 36), y: R.range(9, 18), a: R.range(0, TAU), w: R.range(0.16, 0.34) * (R.chance(0.5) ? 1 : -1), flap: R.range(0, TAU), bob: R.range(0, TAU) };
    this.flock(b); return b;
  }
  /** Chọn một quỹ đạo vòng quanh một điểm cách người chơi 25–70 m (trên đầu khu phố, không phải giữa nhà). */
  private flock(b: Bird) {
    const R = this.R, p = ctx.player, n = NAV[R.int(0, NAV.length - 1)];
    const far = Math.sqrt(dist2(n.x, n.z, p.x, p.z));
    b.cx = far > 20 && far < 75 ? n.x : p.x + R.range(-45, 45);
    b.cz = far > 20 && far < 75 ? n.z : p.z + R.range(-45, 45);
  }
  sync() {
    const want = this.want();
    while (this.list.length > want) { const b = this.list.pop()!; this.group.remove(b.g); }
    while (this.list.length < want) this.list.push(this.mk());
  }
  update(dt: number) {
    const q = QUALITY[ctx.set.quality];
    if ((q?.birds ?? 0) !== this.list.length) this.sync();
    const night = ctx.env.night, rain = ctx.env.rainAmt, p = ctx.player;
    const show = ctx.mode !== 'menu' && night < 0.72 && rain < 0.65;
    this.group.visible = show;
    if (!show) return;
    const vd = ctx.env.fog.far * 0.9;
    for (const b of this.list) {
      b.a += b.w * dt; b.flap += dt * (9 + Math.sin(b.a * 3) * 2);
      const x = b.cx + Math.cos(b.a) * b.r, z = b.cz + Math.sin(b.a) * b.r, y = b.y + Math.sin(b.a * 2 + b.bob) * 0.5;
      b.g.position.set(x, y, z); b.g.rotation.y = -b.a;
      const f = Math.sin(b.flap) * 0.85;
      b.wingL.rotation.z = -f; b.wingR.rotation.z = f;
      b.g.visible = dist2(x, z, p.x, p.z) < vd * vd;
      if (dist2(b.cx, b.cz, p.x, p.z) > 95 * 95) this.flock(b);
    }
    // thỉnh thoảng một con hót: chọn con gần nhất, càng xa càng nhỏ
    this.chirpT -= dt;
    if (this.chirpT <= 0) {
      this.chirpT = 6 + this.R.range(0, 12);
      let best: Bird | null = null, bd = Infinity;
      for (const b of this.list) { const d = dist2(b.g.position.x, b.g.position.z, p.x, p.z); if (d < bd) { bd = d; best = b; } }
      if (best && !ctx.acts.sheltered && rain < 0.2) {
        const d = Math.sqrt(bd), vol = Math.max(0, 1 - d / 55);
        if (vol > 0.05) ctx.sound.chirp(this.R.chance(0.2) ? 'dove' : 'sparrow', vol);
      }
    }
  }
}
