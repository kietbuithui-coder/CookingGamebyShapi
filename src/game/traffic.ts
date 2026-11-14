// XE CỘ — người đi đường chạy xe máy, xe đạp trên các trục đường. Không tương tác được: họ chỉ đi ngang,
// thỉnh thoảng bấm còi khi thấy người chơi đứng gần lòng đường. Số xe giảm theo mức đồ hoạ.
import * as THREE from 'three';
import { ctx, QUALITY } from './ctx';
import { CORR } from '../world/layout';
import { RNG, dist2 } from '../core/util';
import { MB, MAT } from '../gfx/mb';
import { Rig, lookFromArch } from '../gfx/people';
import { ARCH, ArchId } from '../data/people';
import { softDot } from '../gfx/tex';
import { CARS, CAR_BY, CAR_SHARE, CarKind } from '../data/cars';

const BIKE_COLS = [0xd9261e, 0x2f6fb5, 0x1e1e22, 0xf3f0e8, 0x3f8a6a, 0xf08a2f, 0x8a5fd0, 0x5a6a7a];
const RIDERS: ArchId[] = ['taixe', 'shipper', 'congnhan', 'vanphong', 'hangrong', 'dukhach'];

interface Rider {
  grp: THREE.Group; rig: Rig; moto: boolean; car: CarKind | null;
  axis: 0 | 1;                 // 0: chạy dọc trục x (z cố định) · 1: chạy dọc trục z (x cố định)
  sign: 1 | -1; road: number; lane: number; pos: number;
  speed: number; hornT: number; smokeT?: number;
}
/** Hình xe máy, hướng +z là phía trước. */
function motoGeo(col: number, dark: number) {
  const m = new MB();
  for (const z of [-0.56, 0.56]) { m.rod(0, 0.29, z, 0.29, 0.1, 0x1e2024, 0, Math.PI / 2, 9); m.rod(0, 0.29, z, 0.14, 0.11, 0x8a8f96, 0, Math.PI / 2, 7); }
  m.box(0, 0.4, 0, 0.34, 0.3, 1.05, col, dark, 0.12, true);                        // thân xe
  m.box(0, 0.62, -0.18, 0.32, 0.11, 0.62, 0x26282c, 0x34363a, 0, true);            // yên
  m.box(0, 0.62, 0.46, 0.36, 0.62, 0.14, col, undefined, 0.1, true);               // yếm trước
  m.rod(0, 0.95, 0.44, 0.028, 0.56, 0x9aa0a6, 0, Math.PI / 2, 5);                  // ghi-đông
  for (const s of [-1, 1]) m.rod(s * 0.28, 0.95, 0.44, 0.03, 0.14, 0x26282c);
  m.sph(0, 0.86, 0.53, 0.08, 0.08, 0.06, 0xf7f3d0, 6);                             // đèn
  m.box(0, 0.5, -0.56, 0.2, 0.08, 0.06, 0xc8302a, 0xd9463c, 0, true);              // đèn hậu
  m.box(0, 0.16, 0.3, 0.3, 0.05, 0.5, 0x2a2c30);                                   // sàn để chân
  return m.build();
}
/** Ô tô đời 2005–2010: hộp vuông, kính phẳng, bánh nhỏ. Hướng +z là phía trước. */
/** Dựng ô tô; trả về thân xe đã đặt trên mặt đất. */
function carGeo(kind: CarKind, col: number, dark: number) {
  const m = new MB(), truck = kind === 'truck';
  const spec = CAR_BY[kind], L = spec.len, W = spec.w;
  const bodyH = truck ? 0.62 : 0.52, bodyY = 0.46 + bodyH / 2;
  m.box(0, bodyY, 0.06, W, bodyH, L * 0.94, col, dark, 0.1, true);                       // thân dưới
  m.box(0, 0.34, 0.06, W + 0.06, 0.2, L * 0.9, dark, undefined, 0.06, true);              // gầm
  if (truck) {
    m.box(0, 0.92, L * 0.28, W, 0.62, L * 0.34, col, dark, 0.08, true);                   // ca-bin
    m.box(0, 1.06, L * 0.28 + 0.59, W - 0.16, 0.34, 0.05, 0x2a3644);                     // kính trước
    for (const s2 of [-1, 1]) m.box(s2 * (W / 2 - 0.005), 1.06, L * 0.28, 0.03, 0.32, L * 0.3, 0x2a3644);  // kính hông
    m.box(0, 1.08, L * 0.28 - 0.59, W - 0.3, 0.28, 0.05, 0x2a3644);                        // kính sau ca-bin
    m.box(0, 0.9, -L * 0.2, W + 0.04, 0.5, L * 0.52, 0x8a7a5a, 0x6f5f42, 0.06, true);     // thùng hàng
    m.box(0, 1.2, -L * 0.2, W, 0.1, L * 0.5, 0x6f8f6a, 0x546b50, 0.04, true);             // bạt
  } else {
    const cabL = kind === 'matiz' ? L * 0.56 : L * 0.52;
    m.box(0, bodyY + bodyH / 2 + 0.22, -0.06, W - 0.12, 0.44, cabL, col, dark, 0.12, true);       // ca-bin
    for (const s2 of [-1, 1]) m.box(s2 * (W / 2 - 0.07), bodyY + bodyH / 2 + 0.24, -0.06, 0.03, 0.28, cabL - 0.24, 0x2f3b48);  // kính hông
    m.box(0, bodyY + bodyH / 2 + 0.24, cabL / 2 - 0.06, W - 0.5, 0.26, 0.04, 0x2f3b48);           // kính trước
    m.box(0, bodyY + bodyH / 2 + 0.24, -cabL / 2 - 0.02, W - 0.5, 0.26, 0.04, 0x2f3b48);          // kính sau
    m.box(0, bodyY + bodyH / 2 + 0.45, -0.06, W - 0.2, 0.06, cabL + 0.04, dark, undefined, 0.05);  // mui
  }
  for (const sx of [-1, 1]) for (const sz of [1, -1]) {
    m.rod(sx * (W / 2 - 0.06), 0.3, sz * L * 0.31, 0.26, 0.11, 0x1e2024, 0, Math.PI / 2, 9);
    m.rod(sx * (W / 2 - 0.02), 0.3, sz * L * 0.31, 0.14, 0.075, 0xb9c0c8, 0, Math.PI / 2, 7);
  }
  const fy = bodyY + 0.1, front = L * 0.47;
  for (const sx of [-1, 1]) m.sph(sx * (W / 2 - 0.26), fy, front, 0.15, 0.1, 0.05, 0xf7f3d0, 6);       // đèn trước
  for (const sx of [-1, 1]) m.box(sx * (W / 2 - 0.26), fy, -front, 0.26, 0.12, 0.05, 0xc8302a, 0xd9463c); // đèn hậu
  m.box(0, 0.42, front + 0.03, W - 0.2, 0.12, 0.06, 0x55585e, 0x7a7e84, 0.02);                        // cản trước
  m.box(0, 0.42, -front - 0.03, W - 0.2, 0.12, 0.06, 0x55585e, 0x7a7e84, 0.02);                       // cản sau
  m.box(W / 2 - 0.14, bodyY + 0.26, -0.5, 0.03, 0.1, 0.16, 0x8a5a3a);                                 // tay nắm cửa
  return { geo: m.build(), len: L, w: W };
}
/** Hình xe đạp, hướng +z là phía trước. */
function pedalGeo(col: number) {
  const m = new MB();
  for (const z of [-0.52, 0.52]) m.rod(0, 0.34, z, 0.34, 0.055, 0x1e2024, 0, Math.PI / 2, 10);
  m.rod(0, 0.62, 0, 0.03, 0.9, col, Math.PI / 2 - 0.1, 0, 6);                      // khung
  m.rod(0, 0.72, 0.3, 0.028, 0.5, col, 0.5, 0, 6);                                 // càng trước
  m.rod(0, 0.9, 0.42, 0.024, 0.5, 0x9aa0a6, 0, Math.PI / 2, 5);                    // ghi-đông
  m.box(0, 0.84, -0.2, 0.12, 0.05, 0.24, 0x2a2c30, 0x34363a, 0, true);             // yên
  m.cyl(0, 0.42, 0, 0.1, 0.12, 0x55585e, 8);
  return m.build();
}

export class Traffic {
  group = new THREE.Group(); list: Rider[] = []; private R = new RNG(4211);
  constructor() { ctx.scene.add(this.group); this.sync(); }
  private want() { return QUALITY[ctx.set.quality]?.traffic ?? 3; }
  private spawn(): Rider {
    // luôn có ít nhất một chiếc ô tô trong dòng xe, còn lại chia theo tỉ lệ
    const R = this.R, roll = R.range(0, 1), car: CarKind | null = roll < CAR_SHARE || !this.list.some((r) => r.car) ? R.pick(CARS).id : null;
    const moto = !car && R.chance(0.72), col = R.pick(BIKE_COLS), arch = ARCH[R.pick(RIDERS)];
    const fem = R.chance(arch.fem), look = lookFromArch(arch, R, fem);
    look.hat = 3; look.hatCol = R.pick([0x2a2e3a, 0xd9261e, 0x2f6fb5, 0xf3f0e8, 0xf5c531]);   // đội mũ bảo hiểm
    const rig = new Rig(); rig.setLook(look); rig.pose = car ? 'idle' : 'ride'; rig.shadow(false); rig.blob.visible = false;
    const grp = new THREE.Group();
    let mesh: THREE.Mesh;
    if (car) {
      const g = carGeo(car, R.pick(CAR_BY[car].colors), 0x8a8578);
      mesh = new THREE.Mesh(g.geo, MAT.lit);
      // trong xe tối, không vẽ tài xế cho khỏi lòi đầu qua mui
      rig.root.visible = false;
    } else {
      mesh = new THREE.Mesh(moto ? motoGeo(col, 0x1e2024) : pedalGeo(col), MAT.lit);
      mesh.scale.setScalar(moto ? 1.3 : 1.15);
      rig.root.position.y = moto ? 0.26 : 0.34;
    }
    mesh.castShadow = QUALITY[ctx.set.quality].shadow > 0;
    grp.add(mesh, rig.root); this.group.add(grp);
    // ô tô chạy làn ngoài, chậm hơn xe máy; xe tải còn chậm hơn
    const lane = car ? (R.chance(0.5) ? -2.1 : 2.1) : (R.chance(0.5) ? -1.7 : 1.7);
    const r: Rider = {
      grp, rig, moto, car, axis: R.chance(0.5) ? 0 : 1, sign: R.chance(0.5) ? 1 : -1, road: 0, lane, pos: 0,
      speed: car ? R.range(CAR_BY[car].speed[0], CAR_BY[car].speed[1]) : moto ? R.range(7, 11) : R.range(3.6, 4.8),
      hornT: R.range(4, 16),
    };
    this.enter(r);
    return r;
  }
  /** Đặt xe vào một con đường gần người chơi (để có chuyện mà nhìn), rồi cho chạy tới. */
  private enter(r: Rider) {
    const R = this.R, p = ctx.player, along = r.axis === 0 ? p.x : p.z, across = r.axis === 0 ? p.z : p.x;
    // 3/4 số xe chọn con đường gần nhất theo trục của nó, còn lại chạy đường xa cho phố đỡ trống
    r.road = R.chance(0.75) ? CORR.reduce((b, c) => (Math.abs(c - across) < Math.abs(b - across) ? c : b), CORR[0]) : R.pick(CORR);
    r.pos = along - r.sign * R.range(35, 85);
  }
  private px(r: Rider) { return r.axis === 0 ? r.pos : r.road + r.lane; }
  private pz(r: Rider) { return r.axis === 0 ? r.road + r.lane : r.pos; }
  sync() {
    const want = this.want();
    while (this.list.length > want) { const r = this.list.pop()!; this.group.remove(r.grp); }
    while (this.list.length < want) this.list.push(this.spawn());
  }
  update(dt: number) {
    if (this.want() !== this.list.length) this.sync();
    const p = ctx.player, vd = ctx.env.fog.far * 0.85, on = ctx.mode !== 'menu';
    this.group.visible = on;
    if (!on) return;
    for (const r of this.list) {
      r.pos += r.sign * r.speed * dt;
      const lim = (r.axis === 0 ? p.x : p.z) + r.sign * 105;      // ra khỏi tầm nhìn thì vào lại từ phía sau
      if (r.sign > 0 ? r.pos > lim : r.pos < lim) this.enter(r);
      const x = this.px(r), z = this.pz(r);
      r.grp.position.set(x, 0, z);
      r.grp.rotation.y = r.axis === 0 ? (r.sign > 0 ? Math.PI / 2 : -Math.PI / 2) : (r.sign > 0 ? 0 : Math.PI);
      const d2 = dist2(x, z, p.x, p.z);
      r.grp.visible = d2 < vd * vd;
      if (r.grp.visible) r.rig.update(dt, 0, 0);
      // còi: chỉ khi người chơi ở gần lòng đường
      r.hornT -= dt;
      if (r.hornT <= 0) {
        r.hornT = this.R.range(7, 22);
        if (d2 < 15 * 15 && this.R.chance(r.car ? 0.8 : 0.45)) ctx.sound.play('horn');
      }
      // khói pô: ô tô nhả khói xám sau đuôi
      if (r.car && r.grp.visible) {
        r.smokeT = (r.smokeT ?? 0) - dt;
        if (r.smokeT <= 0) { r.smokeT = 0.22; this.puff(x - Math.sin(r.grp.rotation.y) * 1.7, 0.3, z - Math.cos(r.grp.rotation.y) * 1.7); }
      }
    }
    this.stepSmoke(dt);
  }
  // ── khói pô (dùng chung một texture, tái sử dụng sprite) ──
  private smoke: { s: THREE.Sprite; life: number; vy: number }[] = [];
  private smokeTex = softDot('rgba(200,200,196,.85)', 'rgba(200,200,196,0)', 48, 0.1);
  private puff(x: number, y: number, z: number) {
    if (this.smoke.length < 28) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.smokeTex, transparent: true, depthWrite: false, opacity: 0 })); this.group.add(s); this.smoke.push({ s, life: 0, vy: 0 }); }
    const p = this.smoke.find((q) => q.life <= 0); if (!p) return;
    p.life = 1.1; p.vy = 0.3 + Math.random() * 0.25;
    p.s.position.set(x, y, z); p.s.scale.setScalar(0.4); p.s.visible = true;
  }
  private stepSmoke(dt: number) {
    for (const p of this.smoke) {
      if (p.life <= 0) { if (p.s.visible) p.s.visible = false; continue; }
      p.life -= dt; p.s.position.y += p.vy * dt; p.s.scale.setScalar(0.4 + (1.1 - p.life) * 0.9);
      (p.s.material as THREE.SpriteMaterial).opacity = Math.max(0, p.life / 1.1) * 0.5;
      if (p.life <= 0) p.s.visible = false;
    }
  }
}
