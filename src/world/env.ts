// Môi trường: bầu trời, mặt trời/mặt trăng, ngày–đêm, sương mù, mưa, sấm chớp, ngập nước, vệt sáng đèn đường.
import * as THREE from 'three';
import { clamp, lerp, damp, rnd } from '../core/util';
import type { City } from './city';
import type { WeatherDef } from '../data/world';
import { softDot } from '../gfx/tex';
import { groundY } from './layout';

interface Key { h: number; top: number; hor: number; sun: number; si: number; amb: number; gnd: number; }
// h: giờ · top/hor: màu đỉnh trời & chân trời · sun: màu nắng · si: cường độ nắng · amb: ánh sáng môi trường
const KEYS: Key[] = [
  { h: 0, top: 0x070d1f, hor: 0x18223f, sun: 0x8fa8ff, si: 0.22, amb: 0.42, gnd: 0x1a1f2e },
  { h: 4.6, top: 0x0a1228, hor: 0x1e2a4a, sun: 0x8fa8ff, si: 0.22, amb: 0.42, gnd: 0x1a1f2e },
  { h: 5.6, top: 0x3a5a9a, hor: 0xf0a070, sun: 0xffb27a, si: 0.7, amb: 0.62, gnd: 0x5a4a44 },
  { h: 7.0, top: 0x4a94dc, hor: 0xc6e2f5, sun: 0xfff0d6, si: 1.75, amb: 0.95, gnd: 0x8a8478 },
  { h: 12, top: 0x3582d6, hor: 0xcfe9fb, sun: 0xfffaf0, si: 2.2, amb: 1.05, gnd: 0x9a9488 },
  { h: 16.2, top: 0x4488d2, hor: 0xf3dfb8, sun: 0xffe2b0, si: 1.85, amb: 0.95, gnd: 0x8f8676 },
  { h: 17.8, top: 0x4a5c9c, hor: 0xf58c4c, sun: 0xff9a5a, si: 1.15, amb: 0.75, gnd: 0x6a5648 },
  { h: 18.7, top: 0x1f2b55, hor: 0x74506c, sun: 0xc88aa0, si: 0.4, amb: 0.52, gnd: 0x33304a },
  { h: 19.6, top: 0x0a1228, hor: 0x1e2a4a, sun: 0x8fa8ff, si: 0.22, amb: 0.42, gnd: 0x1a1f2e },
  { h: 24, top: 0x070d1f, hor: 0x18223f, sun: 0x8fa8ff, si: 0.22, amb: 0.42, gnd: 0x1a1f2e },
];
const ca = new THREE.Color(), cb = new THREE.Color(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _t = new THREE.Vector3();
function lerpHex(a: number, b: number, t: number, out: THREE.Color) { ca.setHex(a); cb.setHex(b); return out.copy(ca).lerp(cb, t); }

const SKY_VS = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`;
// Mây lấy từ một tấm nhiễu fBm lát kín được tạo sẵn (2 lần tra texture) thay vì tính nhiễu 4 quãng tám cho từng điểm ảnh —
// nhẹ hơn hẳn cho GPU điện thoại. Sao cũng nằm trong kênh G của cùng tấm ảnh.
const SKY_FS = `varying vec3 vDir;
uniform vec3 uTop, uHor, uSunDir, uSunCol; uniform float uNight, uCloud, uTime, uFlash; uniform sampler2D uNoise;
void main(){
  vec3 d = normalize(vDir); float h = max(d.y, 0.0);
  vec3 col = mix(uHor, uTop, pow(h, 0.55));
  float sd = max(dot(d, uSunDir), 0.0);
  col += uSunCol * (pow(sd, 900.0) * 3.0 + pow(sd, 18.0) * 0.28 * (1.0 - uCloud)) * (1.0 - uNight * 0.55);
  if (d.y > -0.02) {
    vec2 cp = d.xz / (d.y + 0.22);
    vec4 n1 = texture2D(uNoise, cp * 0.21 + vec2(uTime * 0.0012, uTime * 0.0006));
    float c = n1.r * 0.72 + texture2D(uNoise, cp * 0.57 - vec2(uTime * 0.0021, 0.0)).r * 0.28;
    if (uNight > 0.05) { float tw = 0.65 + 0.35 * sin(uTime * 2.0 + n1.b * 40.0); col += vec3(texture2D(uNoise, cp * 1.9).g * tw) * uNight * (1.0 - uCloud) * smoothstep(0.02, 0.25, d.y); }
    float cover = mix(0.6, 0.2, uCloud); float m = smoothstep(cover, cover + 0.3, c) * smoothstep(-0.02, 0.2, d.y);
    vec3 cc = mix(vec3(1.0), uHor, 0.35) * mix(1.0, 0.42, uCloud) * mix(1.0, 0.24, uNight) + uSunCol * 0.12 * pow(sd, 4.0);
    col = mix(col, cc, m * mix(0.85, 0.97, uCloud)); }
  col = mix(col, uHor, smoothstep(0.1, -0.05, d.y));
  col += vec3(0.75, 0.8, 1.0) * uFlash;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
/** Tấm nhiễu lát kín: R = mây fBm, G = sao lấm tấm, B = pha nhấp nháy. */
function skyNoise(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4), R = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const lattice = (per: number, seed: number) => { const g = new Float32Array(per * per); for (let i = 0; i < g.length; i++) g[i] = R(i * 1.37 + seed * 91.7); return g; };
  const octs = [4, 8, 16, 32, 64].map((per, i) => ({ per, g: lattice(per, i + 1), a: 0.5 ** (i + 1) }));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const o of octs) {
      const fx = (x / size) * o.per, fy = (y / size) * o.per, ix = Math.floor(fx), iy = Math.floor(fy); let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const a = o.g[(iy % o.per) * o.per + (ix % o.per)], b = o.g[(iy % o.per) * o.per + ((ix + 1) % o.per)], c = o.g[((iy + 1) % o.per) * o.per + (ix % o.per)], d = o.g[((iy + 1) % o.per) * o.per + ((ix + 1) % o.per)];
      v += o.a * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
    }
    const i = (y * size + x) * 4; data[i] = Math.max(0, Math.min(255, (v / 0.97) * 255)); data[i + 1] = 0; data[i + 2] = R(x * 3.1 + y * 17.3) * 255; data[i + 3] = 255;
  }
  for (let k = 0; k < 150; k++) { const x = Math.floor(R(k * 7.7) * size), y = Math.floor(R(k * 13.3 + 5) * size), br = 120 + R(k * 3.3) * 135; data[(y * size + x) * 4 + 1] = br; if (R(k * 5.1) > 0.7) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) data[(((y + dy + size) % size) * size + ((x + dx + size) % size)) * 4 + 1] = br * 0.35; }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
}
const RAIN_VS = `attribute float aEnd; uniform float uTime, uSpeed, uLen; uniform vec3 uCam; uniform vec2 uWind; uniform vec4 uRoof[6]; uniform float uNear; varying float vA;
void main(){ vec3 b = position; float H = 20.0, S = 30.0;
  float y = mod(b.y - uTime * uSpeed * (0.85 + fract(b.x * 7.31) * 0.3), H);
  vec2 xz = b.xz + uWind * (H - y) * 0.09;
  xz = mod(xz - uCam.xz + S * 0.5, S) - S * 0.5 + uCam.xz;
  vec3 p = vec3(xz.x, y + uCam.y - 7.0, xz.y);
  p.y += aEnd * uLen; p.xz += uWind * aEnd * uLen * 0.09;
  float hide = 0.0;
  for (int i = 0; i < 6; i++) { vec4 r = uRoof[i]; if (p.x > r.x && p.x < r.z && p.z > r.y && p.z < r.w && p.y < 7.0) hide = 1.0; }
  if (length(p.xz - uCam.xz) < uNear) hide = 1.0;
  vA = (1.0 - hide) * (0.35 + 0.65 * aEnd);
  gl_Position = hide > 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(p, 1.0); }`;
/** Số vệt mưa tối đa (mưa to trở lên vẽ hết; mưa nhỏ vẽ khoảng 2/3). */
const RAIN_N = 2400;
const RAIN_FS = `uniform vec3 uCol; uniform float uAlpha; varying float vA; void main(){ gl_FragColor = vec4(uCol, uAlpha * vA); }`;

export class Env {
  sun = new THREE.DirectionalLight(0xffffff, 2); hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
  sky: THREE.Mesh; skyU: Record<string, THREE.IUniform>; rain: THREE.LineSegments; rainU: Record<string, THREE.IUniform>;
  fog = new THREE.Fog(0xcfe9fb, 30, 200); pools: THREE.Mesh; poolMat: THREE.MeshBasicMaterial; lights: THREE.PointLight[] = [];
  flood: THREE.Mesh; night = 0; flash = 0; private flashT = 6; rainAmt = 0; private lampT = 0; private time = 0; wet = 0;
  /** Độ u ám 0–1 của bầu trời, chuyển dần khi đổi thời tiết. Trời mưa thì luôn u ám rõ rệt. */
  ov = 0;
  private groundMats: THREE.MeshLambertMaterial[] = []; sunDir = new THREE.Vector3(0.4, 0.8, 0.3); viewDist = 190; shadowOn = true; shadowSize = 34;
  thunder: (() => void) | null = null; blackout = false; private dark = 0;
  constructor(public scene: THREE.Scene, public city: City) {
    scene.fog = this.fog; scene.add(this.hemi, this.sun, this.sun.target);
    this.sun.castShadow = true; const sc = this.sun.shadow.camera; sc.near = 1; sc.far = 220; this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.04;
    this.skyU = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 }, uCloud: { value: 0 }, uTime: { value: 0 }, uFlash: { value: 0 }, uNoise: { value: skyNoise() } };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.ShaderMaterial({ vertexShader: SKY_VS, fragmentShader: SKY_FS, uniforms: this.skyU, side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false }));
    this.sky.frustumCulled = false; this.sky.renderOrder = 10; this.sky.scale.setScalar(50); scene.add(this.sky);
    // mưa
    const N = RAIN_N, pos = new Float32Array(N * 6), end = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) { const x = Math.random() * 30, y = Math.random() * 20, z = Math.random() * 30; pos.set([x, y, z, x, y, z], i * 6); end[i * 2] = 0; end[i * 2 + 1] = 1; }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rg.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    this.rainU = { uTime: { value: 0 }, uSpeed: { value: 16 }, uLen: { value: 0.7 }, uCam: { value: new THREE.Vector3() }, uWind: { value: new THREE.Vector2() }, uCol: { value: new THREE.Color(0xe6eff7) }, uAlpha: { value: 0 }, uNear: { value: 0 },
      uRoof: { value: Array.from({ length: 6 }, () => new THREE.Vector4(1e5, 1e5, 1e5, 1e5)) } };
    this.rain = new THREE.LineSegments(rg, new THREE.ShaderMaterial({ vertexShader: RAIN_VS, fragmentShader: RAIN_FS, uniforms: this.rainU, transparent: true, depthWrite: false }));
    this.rain.frustumCulled = false; this.rain.visible = false; this.rain.renderOrder = 5; scene.add(this.rain);
    // vệt sáng dưới chân đèn đường
    const lp = city.world.lamps, P: number[] = [], UV: number[] = [], I: number[] = [];
    lp.forEach(([x, , z], i) => { const r = 6.2, y = groundY(x, z) + 0.03, b = i * 4; P.push(x - r, y, z + r, x + r, y, z + r, x + r, y, z - r, x - r, y, z - r); UV.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(b, b + 1, b + 2, b, b + 2, b + 3); });
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); pg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); pg.setIndex(I);
    this.poolMat = new THREE.MeshBasicMaterial({ map: softDot('rgba(255,214,150,.85)', 'rgba(255,190,110,0)', 128, 0.05), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, fog: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    this.pools = new THREE.Mesh(pg, this.poolMat); this.pools.renderOrder = 2; this.pools.visible = false; scene.add(this.pools);
    // nước ngập khu trũng
    const fg = new THREE.PlaneGeometry(130, 62).rotateX(-Math.PI / 2);
    this.flood = new THREE.Mesh(fg, new THREE.MeshLambertMaterial({ color: 0x8a7a5c, transparent: true, opacity: 0.72, map: city.water }));
    { const uv = fg.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 16, uv.getY(i) * 8); }
    this.flood.position.set(-35, 0, 63.5); this.flood.visible = false; this.flood.renderOrder = 3; scene.add(this.flood);
    city.root.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial; if (o.name.startsWith('ground_') && m) this.groundMats.push(m); });
  }
  /** Số đèn điểm thật quanh người chơi (đắt trên di động nên giới hạn). */
  setLights(n: number) {
    while (this.lights.length > n) { const l = this.lights.pop()!; this.scene.remove(l); l.dispose(); }
    while (this.lights.length < n) { const l = new THREE.PointLight(0xffc98a, 0, 15, 1.6); this.lights.push(l); this.scene.add(l); }
  }
  setShadows(on: boolean, size: number, map: number) {
    this.shadowOn = on; this.shadowSize = size; this.sun.castShadow = on;
    const sc = this.sun.shadow.camera; sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.updateProjectionMatrix();
    if (this.sun.shadow.mapSize.x !== map) { this.sun.shadow.mapSize.set(map, map); this.sun.shadow.map?.dispose(); (this.sun.shadow as any).map = null; }
  }
  update(dt: number, hour: number, w: WeatherDef, cam: THREE.Camera, covered: boolean, floodPct: number, festive: boolean) {
    this.time += dt;
    let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1].h <= hour) i++;
    const a = KEYS[i], b = KEYS[i + 1], t = clamp((hour - a.h) / (b.h - a.h));
    const U = this.skyU, top = U.uTop.value as THREE.Color, hor = U.uHor.value as THREE.Color, sunC = U.uSunCol.value as THREE.Color;
    lerpHex(a.top, b.top, t, top); lerpHex(a.hor, b.hor, t, hor); lerpHex(a.sun, b.sun, t, sunC);
    const dim = clamp(w.dim, -0.2, 1), dayT = clamp((hour - 5.4) / 13.2);
    const isDay = hour > 5.4 && hour < 18.6;
    this.night = damp(this.night, hour < 5.2 || hour > 19 ? 1 : hour < 6 ? (6 - hour) / 0.8 : hour > 18 ? hour - 18 : 0, 3, dt);
    // màu trời bị mây che: hễ có mưa là trời phải xám hẳn, nếu không nhìn như nắng đẹp mà lại mưa
    this.ov = damp(this.ov, clamp(Math.max(Math.max(0, dim) * 1.5, w.rain > 0 ? 0.55 + w.rain * 0.4 : 0)), 0.7, dt);
    const d = this.ov, grey = ca.setRGB(0.56, 0.59, 0.64).multiplyScalar(lerp(1, 0.32, this.night));
    top.lerp(grey, d * 0.92); hor.lerp(cb.copy(grey).multiplyScalar(1.12), d * 0.88);
    // hướng mặt trời (ban đêm dùng làm trăng)
    const ang = isDay ? dayT * Math.PI : clamp(((hour + 24 - 18.6) % 24) / 10.8) * Math.PI;
    this.sunDir.set(Math.cos(ang) * 0.82, Math.sin(ang) * 0.92 + 0.14, isDay ? 0.36 : -0.3).normalize();
    (U.uSunDir.value as THREE.Vector3).copy(this.sunDir); U.uNight.value = this.night; U.uCloud.value = d; U.uTime.value = this.time;
    const si = lerp(a.si, b.si, t) * (1 - d * 0.8), amb = lerp(a.amb, b.amb, t) * (1 - d * 0.28);
    this.sun.color.copy(sunC); this.sun.intensity = si * 1.55 + this.flash * 2.5;
    this.hemi.color.copy(top).lerp(cb.setRGB(1, 1, 1), 0.55); lerpHex(a.gnd, b.gnd, t, this.hemi.groundColor); this.hemi.intensity = amb * 2.5 + this.flash * 2;
    const p = cam.position;
    // bám theo người chơi, "bắt dính" theo ô điểm ảnh của bản đồ bóng để bóng không rung khi di chuyển
    const texel = (this.shadowSize * 2) / this.sun.shadow.mapSize.x, rt = _r.set(this.sunDir.z, 0, -this.sunDir.x).normalize(), up = _u.crossVectors(this.sunDir, rt).normalize();
    const tp = _t.set(p.x, 0, p.z), sx = tp.dot(rt), sy = tp.dot(up);
    tp.addScaledVector(rt, Math.round(sx / texel) * texel - sx).addScaledVector(up, Math.round(sy / texel) * texel - sy);
    this.sun.position.copy(tp).addScaledVector(this.sunDir, 90); this.sun.target.position.copy(tp);
    if (this.shadowOn) { const on = si > 0.3; if (this.sun.castShadow !== on) this.sun.castShadow = on; }
    // sương mù & tầm nhìn
    this.fog.color.copy(hor); const fd = this.viewDist * (1 - clamp(w.fog) * 0.55); this.fog.far = damp(this.fog.far, fd, 1.2, dt); this.fog.near = this.fog.far * 0.22;
    this.sky.position.copy(p);
    // đêm: cửa sổ sáng đèn, biển hiệu phát sáng, vệt đèn đường
    const dk = this.blackout ? 0.12 : 1; this.dark = damp(this.dark, dk, 4, dt);
    this.city.night.value = this.night * this.dark; this.city.signMat.emissiveIntensity = this.night * 0.62 * this.dark;
    this.city.unlitMat.color.setScalar(lerp(0.3, lerp(1, 0.86, this.night), this.dark));
    this.poolMat.opacity = this.night * 0.5 * this.dark; this.pools.visible = this.night > 0.03;
    this.lampT -= dt;
    if (this.lampT <= 0 && this.lights.length) {
      this.lampT = 0.4;
      const ls = this.city.world.lamps.map((l) => ({ l, d: (l[0] - p.x) ** 2 + (l[2] - p.z) ** 2 })).sort((x, y) => x.d - y.d);
      this.lights.forEach((L, k) => { const q = ls[k]; if (q && q.d < 900) { L.position.set(q.l[0], Math.min(q.l[1] - 0.6, 4.6), q.l[2]); L.userData.on = 1; } else L.userData.on = 0; });
    }
    for (const L of this.lights) L.intensity = damp(L.intensity, L.userData.on ? this.night * 42 * this.dark : 0, 5, dt);
    // mưa
    this.rainAmt = damp(this.rainAmt, w.rain, 0.8, dt);
    const R = this.rainU; this.rain.visible = this.rainAmt > 0.02;
    if (this.rain.visible) {
      R.uTime.value = this.time; (R.uCam.value as THREE.Vector3).copy(p); R.uAlpha.value = 0.3 + this.rainAmt * 0.4; R.uSpeed.value = 13 + this.rainAmt * 9; R.uLen.value = 0.55 + this.rainAmt * 0.85;
      (R.uWind.value as THREE.Vector2).set(w.wind * 9, w.wind * 4); R.uNear.value = covered ? 2.2 : 0;
      this.rain.geometry.setDrawRange(0, Math.floor(RAIN_N * clamp(0.3 + this.rainAmt)) * 2);
      const roofs = this.city.world.roofs, near = roofs.map((r) => ({ r, d: Math.max(r.x0 - p.x, p.x - r.x1, 0) + Math.max(r.z0 - p.z, p.z - r.z1, 0) })).sort((x, y) => x.d - y.d);
      (R.uRoof.value as THREE.Vector4[]).forEach((v, k) => { const q = near[k]; if (q && q.d < 26) v.set(q.r.x0, q.r.z0, q.r.x1, q.r.z1); else v.set(1e5, 1e5, 1e5, 1e5); });
    }
    // mặt đường ướt → sẫm màu
    this.wet = damp(this.wet, this.rainAmt > 0.05 ? 1 : 0, this.rainAmt > 0.05 ? 0.25 : 0.03, dt);
    const g = lerp(1, 0.66, this.wet); for (const m of this.groundMats) m.color.setRGB(g, g, lerp(1, 0.72, this.wet));
    // sấm chớp
    this.flash = Math.max(0, this.flash - dt * 5); U.uFlash.value = this.flash * 0.5;
    if (w.id === 'giong' || w.id === 'bao') { this.flashT -= dt; if (this.flashT <= 0) { this.flashT = rnd.range(4, 13); this.flash = 1; this.thunder?.(); } }
    // ngập
    this.flood.visible = floodPct > 0.12;
    if (this.flood.visible) { this.flood.position.y = 0.02 + (floodPct - 0.12) * 0.4; (this.flood.material as THREE.MeshLambertMaterial).opacity = clamp(0.35 + floodPct * 0.5, 0, 0.8); }
    this.city.water.offset.set(this.time * 0.012, this.time * 0.007);
    this.city.festive.visible = festive;
  }
}
