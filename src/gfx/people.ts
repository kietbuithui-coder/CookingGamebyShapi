// Nhân vật: dựng bằng code theo phong cách "chibi low-poly" — thân bầu, đầu to, mặt vẽ tay đổi được biểu cảm.
// Mỗi người = 6 lưới (thân+đầu, mặt, 2 tay, 2 chân) → nhẹ cho điện thoại mà vẫn có hoạt hình đi/đứng/ngồi/nói.
import * as THREE from 'three';
import { MB, MAT, shade, mix } from './mb';
import { faceAtlas, FACE_COLS, FACE_ROWS, softDot } from './tex';
import { RNG, clamp, damp } from '../core/util';
import type { ArchDef, FixedNpcDef } from '../data/people';

export interface Look {
  face: number; fem: boolean; shirt: number; pants: number; hair: number; hat: number; hairStyle: number; fat: number; h: number;
  skin: number; bag: number; hatCol: number; long: boolean; apron: number; shoe: number;
}
export const SKINS = [0xf2c9a4, 0xecbe94, 0xe0aa7c, 0xf6d6b6, 0xd49a6a];
export type Pose = 'idle' | 'walk' | 'sit' | 'talk' | 'work' | 'carry' | 'wave' | 'lie' | 'angry' | 'dance' | 'ride' | 'read' | 'drink' | 'chat';

export function lookFromArch(a: ArchDef, R: RNG, fem = R.chance(a.fem)): Look {
  let face = R.pick(a.faces);
  if (fem && (face === 0 || face === 7)) face = 1; if (!fem && face === 1) face = 0; if (fem && face === 3) face = 4; if (!fem && face === 4) face = 3;
  let hs = R.pick(a.hairStyle); if (!fem && (hs === 1 || hs === 2) && a.id !== 'vogiacu') hs = 0; if (fem && hs === 3) hs = 2; if (fem && hs === 0 && R.chance(0.6)) hs = 1;
  return {
    face, fem, shirt: R.pick(a.shirts), pants: R.pick(a.pants), hair: R.pick(a.hair), hat: R.pick(a.hats), hairStyle: hs, fat: R.range(a.fat[0], a.fat[1]) * (fem ? 0.94 : 1),
    h: R.range(a.h[0], a.h[1]) * (fem ? 0.96 : 1), skin: R.pick(SKINS), bag: R.chance(a.bag) ? R.pick([0x2a2e3a, 0x8a3a2a, 0x2f6fa8, 0x3f6a4a, 0xd9a05a]) : 0,
    hatCol: R.pick([0x2a2e3a, 0xd9261e, 0x2f6fb5, 0xf3f0e8, 0x3f8a6a, 0xf5c531]), long: a.id === 'vanphong' || a.id === 'nhagiau' || a.id === 'congan', apron: 0, shoe: R.pick([0x2a2a2e, 0x5a4636, 0xf3f0e8, 0x3a4a6a]),
  };
}
export function lookFromFixed(f: FixedNpcDef, apron = 0): Look {
  return { face: f.face, fem: f.fem, shirt: f.shirt, pants: f.pants, hair: f.hair, hat: f.hat, hairStyle: f.hairStyle, fat: f.fat, h: f.h, skin: SKINS[(f.face * 3 + f.hat) % SKINS.length], bag: 0, hatCol: 0x2f6fb5, long: false, apron, shoe: 0x2a2a2e };
}

let _faceTex: THREE.Texture | null = null, _faceMat: THREE.Material | null = null, _blobMat: THREE.Material | null = null, _blobGeo: THREE.BufferGeometry | null = null, _faceGeo: THREE.BufferGeometry | null = null;
const HEAD_Y = 1.43, HRX = 0.168, HRY = 0.182, HIP_Y = 0.77, SHOULDER_Y = 1.19;
function faceMaterial() {
  if (!_faceMat) { _faceTex = faceAtlas(); _faceMat = new THREE.MeshLambertMaterial({ map: _faceTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); }
  return _faceMat;
}
function faceGeometry(): THREE.BufferGeometry {
  if (_faceGeo) return _faceGeo.clone();
  const N = 4, pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const u = i / N, v = j / N, a = (u - 0.5) * 1.62, b = (v - 0.5) * 1.5 - 0.06;
    const dx = Math.sin(a) * Math.cos(b), dy = Math.sin(b), dz = Math.cos(a) * Math.cos(b);
    pos.push(dx * HRX * 1.015, HEAD_Y + dy * HRY * 1.015, dz * HRX * 1.015); nor.push(dx, dy, dz); uv.push(u, v);
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  _faceGeo = g; return g.clone();
}
export function blobShadow(r = 0.36): THREE.Mesh {
  _blobMat ??= new THREE.MeshBasicMaterial({ map: softDot('rgba(0,0,0,.5)', 'rgba(0,0,0,0)', 64, 0.25), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, fog: false });
  _blobGeo ??= new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(_blobGeo, _blobMat); m.scale.set(r * 2, 1, r * 2); m.position.y = 0.012; m.renderOrder = 1; return m;
}

function buildBody(l: Look): THREE.BufferGeometry {
  const m = new MB(), f = l.fat, sk = l.skin;
  m.sph(0, HIP_Y + 0.02, 0, 0.172 * f, 0.135, 0.128 * f, l.pants, 8);
  m.sph(0, 1.0, 0, 0.198 * f, 0.265, 0.132 * f + (f > 1.12 ? 0.03 : 0), l.shirt, 9, shade(l.shirt, 1.1));
  if (l.fem && l.apron === 0) m.cyl(0, HIP_Y - 0.03, 0, 0.19 * f, 0.13, shade(l.shirt, 0.92), 8, 0.16 * f, false);      // vạt áo
  if (l.apron) { m.box(0, 0.74, 0.118 * f + 0.022, 0.26 * f, 0.44, 0.02, l.apron, shade(l.apron, 1.1)); m.box(0, 1.17, 0.1 * f + 0.02, 0.12, 0.06, 0.02, l.apron); }
  m.cyl(0, 1.2, 0, 0.055, 0.1, sk, 6);
  m.sph(0, HEAD_Y, 0, HRX, HRY, HRX, sk, 10, mix(sk, 0xffffff, 0.08));
  for (const s of [-1, 1]) m.sph(s * HRX * 0.98, HEAD_Y - 0.01, 0, 0.028, 0.042, 0.03, shade(sk, 0.95), 5);
  // tóc
  const hc = l.hair, covered = l.hat === 3;
  if (l.hairStyle === 3) { m.sph(0, HEAD_Y + 0.0, -0.035, HRX * 1.03, 0.11, HRX * 0.98, hc, 8); }
  else if (!covered) {
    m.sph(0, HEAD_Y + 0.045, -0.03, HRX * 1.06, HRY * 0.94, HRX * 1.04, hc, 9, shade(hc, 1.25));
    if (l.hairStyle === 1) { m.sph(0, HEAD_Y - 0.13, -0.085, HRX * 0.95, 0.2, 0.085, hc, 8); for (const s of [-1, 1]) m.sph(s * 0.135, HEAD_Y - 0.08, -0.01, 0.045, 0.15, 0.07, hc, 6); }
    if (l.hairStyle === 2) m.sph(0, HEAD_Y + 0.14, -0.13, 0.07, 0.065, 0.07, hc, 7);
    if (l.hairStyle === 0 && !l.fem) m.sph(0, HEAD_Y + 0.13, 0.06, 0.12, 0.05, 0.1, shade(hc, 1.15), 6);                    // mái
  }
  // nón
  const top = HEAD_Y + HRY;
  if (l.hat === 1) { m.cyl(0, top - 0.1, 0, 0.36, 0.2, 0xe6d6a0, 12, 0.01, false, 0xf3e8c0); m.cyl(0, top - 0.1, 0, 0.36, 0.004, 0xcdbb84, 12); }
  else if (l.hat === 2) { m.sph(0, top - 0.06, -0.01, HRX * 1.1, 0.11, HRX * 1.1, l.hatCol, 8); m.box(0, top - 0.075, 0.2, 0.2, 0.02, 0.16, l.hatCol, shade(l.hatCol, 1.15), 0, true); }
  else if (l.hat === 3) { m.sph(0, top - 0.09, -0.005, HRX * 1.17, 0.16, HRX * 1.2, l.hatCol, 9, shade(l.hatCol, 1.3)); m.box(0, top - 0.11, 0.19, 0.2, 0.02, 0.07, 0x1e2024, 0x2a2c30, 0, true); }
  else if (l.hat === 4) { m.cyl(0, top - 0.09, 0, HRX * 1.08, 0.12, l.hatCol, 9, HRX * 0.95); m.cyl(0, top - 0.1, 0, 0.27, 0.018, shade(l.hatCol, 0.9), 10, 0.2); }
  if (l.bag) { m.box(0, 0.86, -0.135 * f - 0.07, 0.25, 0.34, 0.13, l.bag, shade(l.bag, 1.2), 0.1, true); for (const s of [-1, 1]) m.box(s * 0.11, 0.98, 0.0, 0.035, 0.24, 0.27 * f + 0.02, shade(l.bag, 0.8)); }
  return m.build();
}
function buildArm(l: Look): THREE.BufferGeometry {
  const m = new MB();
  m.cyl(0, -0.2, 0, 0.05, 0.22, l.shirt, 6, 0.058);
  m.cyl(0, -0.45, 0, 0.04, 0.26, l.long ? l.shirt : l.skin, 6, 0.048);
  m.sph(0, -0.48, 0, 0.048, 0.055, 0.048, l.skin, 6);
  return m.build();
}
function buildLeg(l: Look): THREE.BufferGeometry {
  const m = new MB();
  m.cyl(0, -0.7, 0, 0.058, 0.72, l.pants, 6, 0.08);
  m.box(0, -0.765, 0.035, 0.105, 0.075, 0.21, l.shoe, shade(l.shoe, 1.2), 0, true);
  return m.build();
}

const EMPTY = new THREE.BufferGeometry();
export class Rig {
  root = new THREE.Group(); inner = new THREE.Group();
  body: THREE.Mesh; face: THREE.Mesh; armL: THREE.Mesh; armR: THREE.Mesh; legL: THREE.Mesh; legR: THREE.Mesh; blob: THREE.Mesh; held: THREE.Mesh | null = null;
  look!: Look; phase = Math.random() * 6; expr = 0; exprT = 0; blinkT = Math.random() * 4; pose: Pose = 'idle'; t = Math.random() * 10;
  private sit = 0; private lie = 0;
  constructor() {
    this.body = new THREE.Mesh(EMPTY, MAT.lit); this.face = new THREE.Mesh(faceGeometry(), faceMaterial());
    this.armL = new THREE.Mesh(EMPTY, MAT.lit); this.armR = new THREE.Mesh(EMPTY, MAT.lit); this.legL = new THREE.Mesh(EMPTY, MAT.lit); this.legR = new THREE.Mesh(EMPTY, MAT.lit);
    this.blob = blobShadow();
    this.inner.add(this.body, this.face, this.armL, this.armR, this.legL, this.legR); this.root.add(this.inner, this.blob);
    this.legL.position.set(-0.085, HIP_Y, 0); this.legR.position.set(0.085, HIP_Y, 0);
    this.face.renderOrder = 2;
  }
  setLook(l: Look) {
    this.dispose(); this.look = l;
    this.body.geometry = buildBody(l); const arm = buildArm(l), leg = buildLeg(l);
    this.armL.geometry = arm; this.armR.geometry = arm; this.legL.geometry = leg; this.legR.geometry = leg;
    const sx = 0.2 * l.fat + 0.035; this.armL.position.set(-sx, SHOULDER_Y, 0); this.armR.position.set(sx, SHOULDER_Y, 0);
    this.inner.scale.setScalar(l.h); this.blob.scale.set(0.74 * l.h * l.fat, 1, 0.74 * l.h * l.fat);
    this.expr = -1; this.setExpr(0);
  }
  get headY() { return (HEAD_Y + 0.3) * this.look.h; }
  setExpr(col: number, hold = 0) {
    if (hold > 0) this.exprT = hold;
    if (col === this.expr) return; this.expr = col;
    const uv = this.face.geometry.attributes.uv as THREE.BufferAttribute, N = 4, row = this.look.face;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) uv.setXY(j * (N + 1) + i, (col + i / N) / FACE_COLS, 1 - (row + 1 - j / N) / FACE_ROWS);
    uv.needsUpdate = true;
  }
  /** Gắn vật cầm tay (túi đồ ăn, bao hàng…). */
  hold(mesh: THREE.Mesh | null) { if (this.held) this.armR.remove(this.held); this.held = mesh; if (mesh) { mesh.position.set(0, -0.52, 0.02); this.armR.add(mesh); } }
  shadow(on: boolean) { this.body.castShadow = on; }
  /** speed: m/s đang đi (0 = đứng). base: biểu cảm nền. */
  update(dt: number, speed: number, base = 0) {
    this.t += dt;
    const p = this.pose, walking = speed > 0.05 && (p === 'walk' || p === 'carry');
    if (walking) this.phase += dt * (3.2 + speed * 3.4);
    const sw = walking ? Math.sin(this.phase) * clamp(0.3 + speed * 0.3, 0, 0.85) : 0, k = Math.min(1, dt * 12);
    const sitT = p === 'sit' || p === 'ride' ? 1 : 0, lieT = p === 'lie' ? 1 : 0;
    this.sit = damp(this.sit, sitT, 8, dt); this.lie = damp(this.lie, lieT, 6, dt);
    let lL = sw, lR = -sw, aL = -sw * 0.8, aR = sw * 0.8, aLz = 0.06, aRz = -0.06;
    if (this.sit > 0.01) { lL = lR = -1.45 * this.sit; aL = aR = -0.5 * this.sit; }
    if (p === 'talk') { aR = -0.75 + Math.sin(this.t * 7) * 0.18; aL = -0.15; }
    else if (p === 'work') { aR = -1.05 + Math.sin(this.t * 9) * 0.22; aL = -0.95 + Math.cos(this.t * 7.3) * 0.2; }
    else if (p === 'carry') { aL = -2.5; aR = -2.5; aLz = -0.25; aRz = 0.25; }
    else if (p === 'wave') { aR = -2.7 + Math.sin(this.t * 10) * 0.3; aRz = -0.35; }
    else if (p === 'angry') { aR = -1.9 + Math.sin(this.t * 14) * 0.25; aL = -0.3; }
    else if (p === 'ride') { aL = aR = -1.28; aLz = -0.12; aRz = 0.12; }             // hai tay nắm ghi-đông
    else if (p === 'dance') {
      const d = this.t * 6.4;
      aL = -1.75 + Math.sin(d) * 0.75; aR = -1.75 - Math.sin(d) * 0.75; aLz = -0.45; aRz = 0.45;
      lL = 0.15 + Math.sin(d) * 0.42; lR = 0.15 - Math.sin(d) * 0.42;
    }
    else if (p === 'read') { aL = aR = -1.12; aLz = -0.34; aRz = 0.34; }                   // hai tay cầm tờ báo
    else if (p === 'drink') { aR = -1.05 + Math.sin(this.t * 1.6) * 0.07; aRz = 0.26; aL = -0.16; }   // cầm ly trước bụng, thỉnh thoảng nhấp một ngụm
    else if (p === 'chat') { aR = -1.15 + Math.sin(this.t * 3.1) * 0.42; aL = -0.55 + Math.cos(this.t * 2.3) * 0.22; aRz = 0.25; aLz = -0.18; }
    else if (p === 'idle') { aL += Math.sin(this.t * 1.3) * 0.04; aR -= Math.sin(this.t * 1.3) * 0.04; }
    const L = this.legL.rotation, R = this.legR.rotation, A = this.armL.rotation, B = this.armR.rotation;
    L.x += (lL - L.x) * k; R.x += (lR - R.x) * k; A.x += (aL - A.x) * k; B.x += (aR - B.x) * k; A.z += (aLz - A.z) * k; B.z += (aRz - B.z) * k;
    const h = this.look.h;
    this.inner.position.y = (walking ? Math.abs(Math.cos(this.phase)) * 0.028 : Math.sin(this.t * 1.6) * 0.004) * h - this.sit * 0.33 * h - this.lie * 0.62 * h
      + (p === 'dance' ? Math.abs(Math.sin(this.t * 6.4)) * 0.05 * h : 0);
    this.inner.rotation.x = -this.lie * 1.5 + (walking ? 0.04 : 0) + (p === 'read' ? 0.16 : p === 'drink' ? -0.08 : 0); this.inner.position.z = this.lie * 0.75 * h;
    this.inner.rotation.z = walking ? Math.sin(this.phase) * 0.025 : 0;
    // biểu cảm: giữ tạm thời rồi về nền, thỉnh thoảng chớp mắt, mấp máy khi nói
    if (this.exprT > 0) { this.exprT -= dt; if (p === 'talk' && this.expr !== 4 && this.expr !== 3) this.setExpr(Math.sin(this.t * 11) > 0 ? 6 : base); }
    else { this.blinkT -= dt; if (this.blinkT < 0) { this.setExpr(7); if (this.blinkT < -0.12) { this.blinkT = 2 + Math.random() * 4; this.setExpr(base); } } else if (this.expr !== base && this.expr !== 7) this.setExpr(base); }
  }
  dispose() {
    for (const m of [this.body, this.armL, this.legL]) if (m.geometry !== EMPTY) m.geometry.dispose();
    this.body.geometry = this.armL.geometry = this.armR.geometry = this.legL.geometry = this.legR.geometry = EMPTY;
  }
}

/** Hình chiếc túi giấy/bao hàng nhỏ (khách xách đồ ăn mang đi). */
let _bagGeo: THREE.BufferGeometry | null = null, _sackGeo: THREE.BufferGeometry | null = null;
export function takeawayBag(): THREE.Mesh {
  if (!_bagGeo) { const m = new MB(); m.box(0, -0.16, 0, 0.17, 0.16, 0.09, 0xf3ead2, 0xe9dcb8, 0.06, true); m.box(0, 0, 0, 0.1, 0.035, 0.012, 0xc9b890); _bagGeo = m.build(); }
  return new THREE.Mesh(_bagGeo, MAT.lit);
}
export function sackMesh(): THREE.Mesh {
  if (!_sackGeo) { const m = new MB(); m.sph(0, 0, 0, 0.36, 0.17, 0.25, 0xd9cdb0, 8, 0xe9dfc8); m.box(0.3, -0.04, 0, 0.12, 0.08, 0.2, 0xc9b890); _sackGeo = m.build(); }
  return new THREE.Mesh(_sackGeo, MAT.lit);
}
export { HEAD_Y };
