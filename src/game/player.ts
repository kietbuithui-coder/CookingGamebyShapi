// Người chơi: góc nhìn thứ nhất, đi bộ có va chạm, thể lực, vật đang mang trên tay/vai.
import * as THREE from 'three';
import { ctx, baseFov } from './ctx';
import { clamp, damp, TAU } from '../core/util';
import { groundY, MAP } from '../world/layout';
import { moveMul, staminaMax, tier, bagWeight, carryCap, floodPct } from '../sim/rules';
import { floodZone } from '../data/world';
import { MB, MAT } from '../gfx/mb';
import { ganhModel, cartModel, basketModel } from '../gfx/props';
import { sackMesh, Rig, Look } from '../gfx/people';

export type Carry = '' | 'ganh' | 'xeday' | 'sack' | 'box';
const _o = { x: 0, z: 0 };
export class Player {
  /** Nhân vật của chính mình — chỉ hiện ở góc nhìn thứ ba (phím V hoặc trong Cài đặt). */
  rig = new Rig(); look: Look | null = null; private rigCarry = new THREE.Group(); private carryMesh: Partial<Record<Carry, THREE.Object3D>> = {};
  private camP = new THREE.Vector3(); private camDist = 3; private camOn = false;
  x = 0; z = 0; yaw = Math.PI; pitch = 0; eye = 1.6; eyeTarget = 1.6; y = 0.12;
  stamina = 1; /** Trần sức bền hiện tại (tụt khi đói, khát). */ staminaCap = 1; tired = false; moving = false; running = false; speed = 0; phase = 0; bob = 0;
  holder = new THREE.Group(); carry: Carry = ''; private models: Partial<Record<Carry, THREE.Object3D>> = {};
  /** Khi đặt, camera trượt tới tư thế cố định (nấu ăn, ngủ, rửa chén…). */
  camTo: { pos: THREE.Vector3; look: THREE.Vector3; fov?: number } | null = null; private camK = 0; private from = new THREE.Vector3(); private fromQ = new THREE.Quaternion(); private fromFov = 68;
  frozen = false; private stepSide = 0;
  /** Độ cao đang nhảy (mét) và vận tốc lên — chỉ để cảm giác, không đổi va chạm. */
  jumpY = 0; private vy = 0;
  constructor() {
    const cam = ctx.camera; cam.rotation.order = 'YXZ'; cam.add(this.holder); ctx.scene.add(cam);
    const mk = (fn: (m: MB) => void) => { const m = new MB(); fn(m); const mesh = new THREE.Mesh(m.build(), MAT.lit); mesh.visible = false; this.holder.add(mesh); return mesh; };
    // quang gánh trên vai: thấy đòn gánh và chiếc thúng phía trước
    this.models.ganh = mk((m) => { m.rod(0.3, -0.2, -0.55, 0.02, 1.7, 0x9a7a44, Math.PI / 2 - 0.05, 0, 6); basketModel(m, 0.3, -1.0, -1.3, 0.27, 0.22); for (let i = 0; i < 3; i++) { const a = i * TAU / 3; m.rod(0.3 + Math.cos(a) * 0.12, -0.5, -1.3 + Math.sin(a) * 0.12, 0.005, 0.62, 0x8a6a3a, Math.sin(a) * 0.4, -Math.cos(a) * 0.4, 4); } m.cyl(0.3, -0.79, -1.3, 0.25, 0.012, 0xd9c38a, 12); });
    this.models.xeday = mk((m) => { m.frame(0, -1.5, Math.PI, -1.62); cartModel(m, 0, 0, 0); });
    const sack = sackMesh(); sack.position.set(0.42, 0.16, -0.42); sack.rotation.set(0.2, 0.5, 0.1); sack.visible = false; this.holder.add(sack); this.models.sack = sack;
    this.models.box = mk((m) => { m.box(0, -0.62, -0.6, 0.44, 0.3, 0.32, 0xc9a56a, 0xd9b87a, 0.08, true); m.box(0, -0.32, -0.6, 0.06, 0.004, 0.32, 0xe9d9a8); });
    // Đồ mang theo, dựng lại trong không gian của nhân vật (góc nhìn thứ ba).
    this.rig.root.add(this.rigCarry); ctx.scene.add(this.rig.root); this.rig.root.visible = false;
    const mkCarry = (fn: (m: MB) => void, pos: [number, number, number]) => { const mm = new MB(); fn(mm); const mesh = new THREE.Mesh(mm.build(), MAT.lit); mesh.position.set(...pos); mesh.visible = false; this.rigCarry.add(mesh); return mesh; };
    this.carryMesh.ganh = mkCarry((m) => ganhModel(m, 0, 0.42, 0), [0, 0, 0]);
    this.carryMesh.xeday = mkCarry((m) => cartModel(m, 0, 0, 0), [0, 0, 1.35]);
    this.carryMesh.sack = mkCarry((m) => { m.sph(0.24, 1.12, 0.02, 0.3, 0.15, 0.21, 0xd9cdb0, 8, 0xe9dfc8); }, [0, 0, 0]);
    this.carryMesh.box = mkCarry((m) => { m.box(0, 1.02, 0.42, 0.44, 0.3, 0.32, 0xc9a56a, 0xd9b87a, 0.08, true); }, [0, 0, 0]);
  }
  /** Còn đang trên đất thì mới nhảy được. */
  get onGround() { return this.jumpY <= 0.001; }
  /** Bật nhảy tại chỗ. false nếu đang ở trên không hoặc đang bị khoá điều khiển. */
  jump(): boolean {
    if (!this.onGround || this.frozen || this.camTo) return false;
    this.vy = 3.4; return true;
  }
  place(x: number, z: number, yaw: number, pitch = 0) { this.x = x; this.z = z; this.yaw = yaw; this.pitch = pitch; this.y = groundY(x, z); }
  setCarry(c: Carry) { if (c === this.carry) return; this.carry = c; for (const [k, m] of Object.entries(this.models)) m!.visible = k === c; this.syncCarry(); }
  /** Đồ mang theo: bản gắn vào camera (góc nhìn 1) và bản gắn vào nhân vật (góc nhìn 3). */
  private syncCarry() { for (const [k, m] of Object.entries(this.carryMesh)) m!.visible = k === this.carry; }
  /** Dựng lại nhân vật theo ngoại hình đang lưu (sau khi cắt tóc, mua đồ, mở bản lưu). */
  applyLook() {
    const d = ctx.g?.look; if (!d) return;
    this.look = { face: d.face, fem: d.fem, shirt: d.shirt, pants: d.pants, hair: d.hair, hat: d.hat, hairStyle: d.hairStyle, fat: d.fat, h: d.h, skin: d.skin, bag: 0, hatCol: d.hatCol, long: false, apron: 0, shoe: d.shoe };
    this.rig.setLook(this.look); this.rig.root.visible = !!ctx.set.cam3;
  }
  /** Bật/tắt góc nhìn thứ ba; trả về trạng thái mới. */
  toggleView(): boolean { ctx.set.cam3 = !ctx.set.cam3; this.camOn = false; this.rig.root.visible = !!ctx.set.cam3; return ctx.set.cam3; }
  get fwd(): [number, number] { return [Math.sin(this.yaw), Math.cos(this.yaw)]; }
  update(dt: number) {
    const g = ctx.g, inp = ctx.input, s = ctx.set;
    const [lx, ly] = inp.consumeLook();
    if (!this.frozen && !this.camTo) {
      const k = 0.0042 * s.sens * (ctx.mobile ? 1.15 : 1);
      this.yaw -= lx * k; this.pitch = clamp(this.pitch - ly * k, -1.35, 1.2);
      if (inp.keys.has('q')) this.yaw += dt * 2; if (inp.keys.has('e') && false) this.yaw -= dt * 2;
    }
    // di chuyển
    let mx = inp.mx, mz = inp.mz; if (this.frozen || this.camTo) mx = mz = 0;
    const mag = Math.min(1, Math.hypot(mx, mz)); this.moving = mag > 0.08;
    const maxSt = this.staminaCap = staminaMax(g); this.stamina = Math.min(this.stamina, maxSt);
    const wantRun = inp.run && this.moving && mz > 0.3 && !this.tired && this.carry === '';
    this.running = wantRun;
    if (wantRun) { this.stamina -= dt * 0.1; if (this.stamina <= 0.02) this.tired = true; } else { this.stamina = Math.min(maxSt, this.stamina + dt * (this.moving ? 0.05 : 0.09)); if (this.stamina > 0.3) this.tired = false; }
    let sp = (wantRun ? 5.5 : 3.35) * moveMul(g, this.x, this.z);
    if (this.carry === 'ganh' || this.carry === 'xeday') sp *= tier(g).speed || 0.7; else if (this.carry === 'sack') sp *= 0.62; else if (this.carry === 'box') sp *= 0.85;
    const load = bagWeight(g) / carryCap(g); if (load > 0.85) sp *= clamp(1.25 - load * 0.4, 0.55, 1);
    if (mz < -0.1) sp *= 0.7;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), rx = -fz, rz = fx;
    const vx = (fx * mz + rx * mx) * sp, vz = (fz * mz + rz * mx) * sp;
    this.speed = Math.hypot(vx, vz);
    if (this.moving) {
      let nx = this.x + vx * dt, nz = this.z + vz * dt;
      ctx.world.resolve(nx, nz, 0.3, _o); nx = clamp(_o.x, MAP.x0 + 0.5, MAP.x1 - 0.5); nz = clamp(_o.z, MAP.z0 + 0.5, MAP.z1 - 0.7);
      // lỡ bị kẹt trong vật cản (khe hẹp, góc tường, cửa hẹp) thì bò ra chỗ trống gần nhất,
      // nếu không camera sẽ nằm gọn trong tường và màn hình chỉ còn một màu nâu.
      if (ctx.world.blocked(nx, nz, 0.28)) {
        outer: for (let r = 0.25; r <= 1.75; r += 0.25) for (let i = 0; i < 16; i++) {
          const a = (i * Math.PI) / 8, tx = nx + Math.cos(a) * r, tz = nz + Math.sin(a) * r;
          if (!ctx.world.blocked(tx, tz, 0.28)) { nx = tx; nz = tz; break outer; }
        }
      }
      this.x = nx; this.z = nz;
      const prev = this.phase; this.phase += dt * (wantRun ? 11.5 : 8.2) * clamp(this.speed / 3.3, 0.4, 1.4);
      if (Math.floor(prev / Math.PI) !== Math.floor(this.phase / Math.PI)) { this.stepSide ^= 1; const wet = ctx.env.wet > 0.4 || (floodPct(g) > 0.3 && floodZone(this.x, this.z)); ctx.sound.step(wet ? 'wet' : 'dry', wantRun ? 1 : 0.7); }
    }
    // nhảy: lên rồi rơi xuống, chạm đất thì kêu một tiếng
    if (this.vy !== 0 || this.jumpY > 0) {
      this.jumpY += this.vy * dt; this.vy -= 12.5 * dt;
      if (this.jumpY <= 0) { this.jumpY = 0; this.vy = 0; ctx.sound.step('dry', 1.15); }
    }
    this.bob = damp(this.bob, this.moving ? 1 : 0, 8, dt);
    this.y = damp(this.y, groundY(this.x, this.z), 14, dt); this.eye = damp(this.eye, this.eyeTarget, 6, dt);
    const cam = ctx.camera, by = Math.sin(this.phase * 2) * 0.03 * this.bob, bx = Math.cos(this.phase) * 0.02 * this.bob;
    const px = this.x + rx * bx, py = this.y + this.eye + by + this.jumpY, pz = this.z + rz * bx;
    if (this.camTo) {
      if (this.camK === 0) { this.from.copy(cam.position); this.fromQ.copy(cam.quaternion); this.fromFov = cam.fov; }
      this.camK = Math.min(1, this.camK + dt * 2.6); const t = this.camK * this.camK * (3 - 2 * this.camK);
      cam.position.lerpVectors(this.from, this.camTo.pos, t);
      _m.lookAt(this.camTo.pos, this.camTo.look, _up); _q.setFromRotationMatrix(_m); cam.quaternion.slerpQuaternions(this.fromQ, _q, t);
      const f = this.fromFov + ((this.camTo.fov ?? baseFov(cam.aspect)) - this.fromFov) * t; if (Math.abs(f - cam.fov) > 0.01) { cam.fov = f; cam.updateProjectionMatrix(); }
    } else {
      const bf = baseFov(cam.aspect);
      if (this.camK > 0) { // trở lại góc nhìn nhân vật
        this.camK = Math.max(0, this.camK - dt * 3.2); const t = 1 - this.camK;
        _e.set(this.pitch, this.yaw + Math.PI, 0, 'YXZ'); _q.setFromEuler(_e); cam.position.lerp(_v.set(px, py, pz), t * t); cam.quaternion.slerp(_q, t * t);
        cam.fov += (bf - cam.fov) * t * t; cam.updateProjectionMatrix();
      } else if (ctx.set.cam3) {
        // Góc nhìn thứ ba: camera lùi ra sau lưng, chạm tường thì nép sát lại để không nhìn xuyên tường.
        const cp = Math.cos(this.pitch), sp2 = Math.sin(this.pitch), dirx = Math.sin(this.yaw) * cp, diry = sp2, dirz = Math.cos(this.yaw) * cp;
        let want = 3.0 + (this.carry === 'xeday' ? 1.2 : 0) + (this.carry === 'ganh' ? 0.35 : 0);
        for (; want > 1.6; want -= 0.2) { if (!ctx.world.blocked(px - dirx * want, pz - dirz * want, 0.26)) break; }
        const wasOn = this.camOn;
        this.camDist = wasOn ? damp(this.camDist, want, 10, dt) : want; this.camOn = true;
        const tx = px - dirx * this.camDist, tz = pz - dirz * this.camDist, ty = Math.max(groundY(tx, tz) + 0.4, py - diry * this.camDist);
        if (!wasOn) this.camP.set(tx, ty, tz); else { this.camP.x = damp(this.camP.x, tx, 14, dt); this.camP.y = damp(this.camP.y, ty, 14, dt); this.camP.z = damp(this.camP.z, tz, 14, dt); }
        cam.position.copy(this.camP); cam.rotation.set(this.pitch, this.yaw + Math.PI, 0, 'YXZ');
        if (cam.fov !== bf) { cam.fov = bf; cam.updateProjectionMatrix(); }
        this.rig.root.position.set(this.x, this.y + this.jumpY, this.z); this.rig.root.rotation.y = this.yaw;
        this.rig.pose = this.moving ? 'walk' : 'idle'; this.rig.update(dt, this.speed);
      } else {
        this.camOn = false;
        cam.position.set(px, py, pz); cam.rotation.set(this.pitch, this.yaw + Math.PI, 0, 'YXZ'); if (cam.fov !== bf) { cam.fov = bf; cam.updateProjectionMatrix(); }
      }
    }
    // nép sát quá thì giấu nhân vật đi, đừng để camera chui vô trong đầu
    this.rig.root.visible = !!ctx.set.cam3 && (this.camDist > 2.0 || !!this.camTo);
    // vật mang theo đung đưa
    this.holder.position.set(Math.cos(this.phase) * 0.012 * this.bob, Math.abs(Math.sin(this.phase)) * -0.025 * this.bob, 0);
    this.holder.rotation.x = -this.pitch * 0.55; this.holder.visible = !this.camTo && this.camK === 0 && !ctx.set.cam3;
    g.pos.x = this.x; g.pos.z = this.z; g.pos.yaw = this.yaw; g.pos.pitch = this.pitch;
  }
  /** Bật/tắt tư thế camera cố định. */
  view(pos: THREE.Vector3 | null, look?: THREE.Vector3, fov?: number) { if (pos && look) { if (!this.camTo) this.camK = 0; this.camTo = { pos: pos.clone(), look: look.clone(), fov }; } else this.camTo = null; }
  /** Quay mặt về một điểm. */
  face(x: number, z: number) { this.yaw = Math.atan2(x - this.x, z - this.z); this.pitch = damp(this.pitch, -0.08, 1, 1); }
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _e = new THREE.Euler(), _v = new THREE.Vector3();
