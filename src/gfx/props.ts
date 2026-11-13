// Mô hình 3D dựng bằng code: nguyên liệu, dụng cụ nấu, đồ nghề. Tất cả vẽ vào một MB nên dùng được cả trong
// thế giới (nướng sẵn vào lưới thành phố) lẫn làm vật thể rời (trên thớt, trong chảo, ở quầy).
import * as THREE from 'three';
import { MB, MAT, shade, mix } from './mb';
import { IngDef, INGS } from '../data/ingredients';
import { RNG, TAU } from '../core/util';

/** Vẽ một nguyên liệu tại (x,y,z) — y là mặt đặt. s: tỉ lệ. */
export function ingModel(mb: MB, d: IngDef, x: number, y: number, z: number, s = 1, R?: RNG) {
  const c = d.c, c2 = d.c2, r = (a: number, b: number) => (R ? R.range(a, b) : (a + b) / 2);
  switch (d.shape) {
    case 'round': mb.sph(x, y + 0.05 * s, z, 0.055 * s, 0.048 * s, 0.055 * s, c, 8, shade(c, 1.12)); mb.cyl(x, y + 0.09 * s, z, 0.008 * s, 0.018 * s, c2, 4); break;
    case 'egg': mb.sph(x, y + 0.03 * s, z, 0.026 * s, 0.034 * s, 0.026 * s, c, 8, shade(c, 1.1)); break;
    case 'long': mb.rod(x, y + 0.028 * s, z, 0.028 * s, 0.19 * s, c, 0, Math.PI / 2, 7, r(-0.3, 0.3), 0.016 * s); mb.sph(x - 0.1 * s, y + 0.028 * s, z, 0.02 * s, 0.02 * s, 0.02 * s, c2, 5); break;
    case 'corn': mb.rod(x, y + 0.035 * s, z, 0.034 * s, 0.2 * s, c, 0, Math.PI / 2, 8, 0, 0.022 * s); mb.rod(x - 0.07 * s, y + 0.035 * s, z, 0.04 * s, 0.1 * s, c2, 0, Math.PI / 2, 6, 0, 0.03 * s); break;
    case 'loaf': mb.sph(x, y + 0.035 * s, z, 0.11 * s, 0.036 * s, 0.042 * s, c, 8, shade(c, 1.15)); for (let i = -1; i <= 1; i++) mb.box(x + i * 0.05 * s, y + 0.062 * s, z, 0.012 * s, 0.01 * s, 0.05 * s, c2); break;
    case 'leafy': for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.22; mb.rod(x + Math.sin(a) * 0.05 * s, y + 0.02 * s + i % 2 * 0.012 * s, z, 0.022 * s, 0.24 * s, i % 2 ? c : c2, Math.PI / 2, 0, 5, a, 0.006 * s); }
      mb.cyl(x, y, z + 0.1 * s, 0.03 * s, 0.03 * s, 0xc9b28a, 6); break;
    case 'head': mb.sph(x, y + 0.075 * s, z, 0.085 * s, 0.075 * s, 0.085 * s, c, 8, c2); mb.sph(x + 0.03 * s, y + 0.06 * s, z + 0.03 * s, 0.07 * s, 0.06 * s, 0.07 * s, shade(c, 0.9), 6); break;
    case 'slab': mb.box(x, y, z, 0.16 * s, 0.045 * s, 0.11 * s, c, shade(c, 1.1), 0.1); mb.box(x, y + 0.012 * s, z - 0.045 * s, 0.162 * s, 0.035 * s, 0.022 * s, c2); mb.box(x + 0.03 * s, y + 0.046 * s, z, 0.03 * s, 0.002, 0.09 * s, c2); break;
    case 'bird': mb.sph(x, y + 0.04 * s, z, 0.075 * s, 0.04 * s, 0.05 * s, c, 7, shade(c, 1.1)); mb.rod(x + 0.08 * s, y + 0.035 * s, z, 0.022 * s, 0.09 * s, c2, 0, Math.PI / 2 + 0.3, 5); break;
    case 'fish': mb.sph(x, y + 0.02 * s, z, 0.1 * s, 0.02 * s, 0.045 * s, c, 7, c2); mb.box(x + 0.1 * s, y + 0.005, z, 0.04 * s, 0.02 * s, 0.05 * s, shade(c, 0.85)); break;
    case 'shrimp': for (let i = 0; i < 4; i++) { const a = i * 0.5; mb.sph(x + Math.cos(a) * 0.04 * s - 0.02 * s, y + 0.02 * s, z + Math.sin(a) * 0.04 * s, 0.022 * s * (1 - i * 0.12), 0.02 * s, 0.022 * s, i % 2 ? c : c2, 5); } break;
    case 'crab': mb.sph(x, y + 0.03 * s, z, 0.07 * s, 0.03 * s, 0.055 * s, c, 7, c2); for (const sx of [-1, 1]) { mb.sph(x + sx * 0.08 * s, y + 0.025 * s, z - 0.04 * s, 0.025 * s, 0.018 * s, 0.03 * s, c2, 5); mb.box(x + sx * 0.07 * s, y + 0.005, z + 0.03 * s, 0.05 * s, 0.012 * s, 0.012 * s, c); } break;
    case 'squid': mb.cyl(x, y, z, 0.035 * s, 0.13 * s, c, 7, 0.012 * s, true, c2); for (let i = 0; i < 4; i++) mb.rod(x + Math.cos(i * 1.6) * 0.035 * s, y + 0.012 * s, z + Math.sin(i * 1.6) * 0.035 * s, 0.008 * s, 0.07 * s, c2, Math.PI / 2, 0, 4, i * 1.6); break;
    case 'shell': for (let i = 0; i < 5; i++) mb.sph(x + Math.cos(i * 1.3) * 0.045 * s * (i ? 1 : 0), y + 0.018 * s + (i === 0 ? 0.02 * s : 0), z + Math.sin(i * 1.3) * 0.045 * s * (i ? 1 : 0), 0.032 * s, 0.018 * s, 0.026 * s, i % 2 ? c : c2, 6); break;
    case 'balls': for (let i = 0; i < 5; i++) mb.sph(x + Math.cos(i * 1.26) * 0.04 * s * (i ? 1 : 0), y + 0.024 * s + (i === 0 ? 0.034 * s : 0), z + Math.sin(i * 1.26) * 0.04 * s * (i ? 1 : 0), 0.025 * s, 0.025 * s, 0.025 * s, i % 2 ? c : c2, 6); break;
    case 'bag': case 'coal': mb.box(x, y, z, 0.2 * s, 0.26 * s, 0.11 * s, c, shade(c, 0.92), 0.08); mb.box(x, y + 0.08 * s, z - 0.056 * s, 0.15 * s, 0.1 * s, 0.004, c2); mb.box(x, y + 0.26 * s, z, 0.17 * s, 0.025 * s, 0.03 * s, shade(c, 0.85)); break;
    case 'nest': mb.sph(x, y + 0.028 * s, z, 0.085 * s, 0.03 * s, 0.085 * s, c, 8, c2); mb.sph(x + 0.02 * s, y + 0.045 * s, z - 0.01 * s, 0.05 * s, 0.02 * s, 0.05 * s, c2, 6); break;
    case 'bottle': mb.cyl(x, y, z, 0.035 * s, 0.17 * s, c, 8); mb.cyl(x, y + 0.17 * s, z, 0.035 * s, 0.05 * s, c, 8, 0.014 * s); mb.cyl(x, y + 0.22 * s, z, 0.016 * s, 0.03 * s, c2, 6); mb.cyl(x, y + 0.05 * s, z, 0.0365 * s, 0.07 * s, c2, 8, 0.0365 * s, false); break;
    case 'gascan': mb.cyl(x, y, z, 0.034 * s, 0.2 * s, c, 8); mb.cyl(x, y + 0.2 * s, z, 0.03 * s, 0.02 * s, c2, 8, 0.012 * s); mb.cyl(x, y + 0.06 * s, z, 0.0355 * s, 0.06 * s, c2, 8, 0.0355 * s, false); break;
    case 'jar': mb.cyl(x, y, z, 0.04 * s, 0.09 * s, c, 8); mb.cyl(x, y + 0.09 * s, z, 0.043 * s, 0.022 * s, c2, 8); break;
    case 'can': mb.cyl(x, y, z, 0.036 * s, 0.11 * s, c, 8); mb.cyl(x, y + 0.03 * s, z, 0.0375 * s, 0.05 * s, c2, 8, 0.0375 * s, false); mb.cyl(x, y + 0.11 * s, z, 0.034 * s, 0.006 * s, 0xc9ccd2, 8); break;
    case 'carton': mb.box(x, y, z, 0.075 * s, 0.17 * s, 0.075 * s, c, c, 0.05); mb.box(x, y + 0.04 * s, z - 0.039 * s, 0.07 * s, 0.07 * s, 0.003, c2); mb.box(x, y + 0.17 * s, z, 0.075 * s, 0.03 * s, 0.02 * s, shade(c, 0.9)); break;
    case 'box': mb.box(x, y, z, 0.13 * s, 0.07 * s, 0.09 * s, c, shade(c, 1.08), 0.06); mb.box(x, y + 0.02 * s, z - 0.046 * s, 0.09 * s, 0.035 * s, 0.003, c2); break;
    case 'block': mb.box(x, y, z, 0.11 * s, 0.055 * s, 0.08 * s, c, shade(c, 1.06), 0.06); mb.box(x, y + 0.02 * s, z, 0.112 * s, 0.012 * s, 0.082 * s, c2); break;
    case 'mushroom': for (let i = 0; i < 3; i++) { const ox = (i - 1) * 0.05 * s; mb.cyl(x + ox, y, z, 0.012 * s, 0.04 * s, c, 5); mb.sph(x + ox, y + 0.045 * s, z, 0.03 * s, 0.022 * s, 0.03 * s, i % 2 ? c : c2, 6); } break;
    case 'stack': for (let i = 0; i < 4; i++) mb.cyl(x, y + i * 0.008 * s, z, 0.1 * s, 0.006 * s, i % 2 ? c : c2, 10); break;
    case 'roll': mb.rod(x, y + 0.04 * s, z, 0.04 * s, 0.16 * s, c2, 0, Math.PI / 2, 8); mb.rod(x + 0.081 * s, y + 0.04 * s, z, 0.036 * s, 0.004, c, 0, Math.PI / 2, 8); break;
    case 'cubes': mb.box(x, y, z, 0.18 * s, 0.14 * s, 0.12 * s, c, c2, 0.05); for (let i = 0; i < 4; i++) mb.box(x + (i % 2 - 0.5) * 0.08 * s, y + 0.14 * s, z + (i > 1 ? 0.03 : -0.03) * s, 0.04 * s, 0.035 * s, 0.04 * s, c2, 0xffffff); break;
  }
}

const geoCache = new Map<string, THREE.BufferGeometry>();
/** Hình học của một nguyên liệu (có lưu đệm) — dùng cho vật thể rời. */
export function ingGeo(id: string, s = 1): THREE.BufferGeometry {
  const k = id + '|' + s;
  let g = geoCache.get(k);
  if (!g) { const mb = new MB(); ingModel(mb, INGS[id], 0, 0, 0, s); g = mb.build(); geoCache.set(k, g); }
  return g;
}
export const ingMesh = (id: string, s = 1) => new THREE.Mesh(ingGeo(id, s), MAT.food);

// ───────────────────────── Dụng cụ ─────────────────────────
const STEEL = 0xc5cbd2, DARK = 0x2a2c30, WOOD = 0xb98a56, BAMBOO = 0xc9a868, CLAY = 0xb5653c;
export function potModel(mb: MB, x: number, y: number, z: number, s = 1) {
  mb.cyl(x, y, z, 0.17 * s, 0.2 * s, STEEL, 14, 0.18 * s, false); mb.cyl(x, y, z, 0.17 * s, 0.012 * s, shade(STEEL, 0.8), 14);
  mb.geo(ringGeo(14), 0.18 * s, 0.012 * s, 0.18 * s, x, y + 0.2 * s, z, shade(STEEL, 1.1));
  mb.cyl(x, y + 0.012 * s, z, 0.165 * s, 0.19 * s, shade(STEEL, 0.6), 14, 0.175 * s, false);   // lòng nồi (mặt trong vẽ như mặt ngoài tối)
  for (const sx of [-1, 1]) mb.box(x + sx * 0.2 * s, y + 0.15 * s, z, 0.05 * s, 0.014 * s, 0.07 * s, DARK, DARK, 0, true);
}
export function panModel(mb: MB, x: number, y: number, z: number, s = 1) {
  mb.cyl(x, y, z, 0.15 * s, 0.045 * s, DARK, 16, 0.19 * s, false); mb.cyl(x, y, z, 0.15 * s, 0.008 * s, 0x1e2024, 16);
  mb.cyl(x, y + 0.008 * s, z, 0.148 * s, 0.002, 0x3a3d42, 16);
  mb.rod(x, y + 0.045 * s, z + 0.3 * s, 0.014 * s, 0.24 * s, 0x1b1c1f, Math.PI / 2 - 0.12, 0, 6);
}
export function grateModel(mb: MB, x: number, y: number, z: number, w = 0.46, d = 0.3) {
  const c = 0x55585e;
  for (let i = 0; i <= 10; i++) mb.box(x - w / 2 + (w * i) / 10, y, z, 0.006, 0.006, d, c, 0x888c92, 0, true);
  for (const sz of [-1, 1]) mb.box(x, y, z + sz * d / 2, w, 0.008, 0.008, c, 0x888c92, 0, true);
}
export function charcoalStove(mb: MB, x: number, y: number, z: number, s = 1) {
  mb.cyl(x, y, z, 0.13 * s, 0.2 * s, CLAY, 12, 0.17 * s, false, shade(CLAY, 1.15)); mb.cyl(x, y, z, 0.13 * s, 0.01, shade(CLAY, 0.7), 12);
  mb.geo(ringGeo(12), 0.17 * s, 0.02 * s, 0.17 * s, x, y + 0.2 * s, z, shade(CLAY, 0.85));
  mb.box(x, y + 0.03 * s, z - 0.14 * s, 0.08 * s, 0.05 * s, 0.03 * s, 0x1a1210);                // cửa gió
  mb.cyl(x, y + 0.13 * s, z, 0.15 * s, 0.03 * s, 0x1c1614, 10);                                 // lớp than
}
export function gasStove(mb: MB, x: number, y: number, z: number, s = 1) {
  mb.box(x, y, z, 0.38 * s, 0.09 * s, 0.3 * s, 0x2f6fb5, 0xd8dde2, 0.1); mb.cyl(x - 0.04 * s, y + 0.09 * s, z, 0.08 * s, 0.02 * s, DARK, 10);
  for (let i = 0; i < 4; i++) mb.box(x - 0.04 * s + Math.cos(i * TAU / 4) * 0.09 * s, y + 0.09 * s, z + Math.sin(i * TAU / 4) * 0.09 * s, 0.03 * s, 0.035 * s, 0.03 * s, 0x1b1c1f);
  mb.rod(x + 0.13 * s, y + 0.05 * s, z - 0.155 * s, 0.022 * s, 0.02 * s, 0x1b1c1f, Math.PI / 2, 0, 8);
  mb.rod(x + 0.15 * s, y + 0.1 * s, z + 0.02 * s, 0.035 * s, 0.2 * s, 0xd9361e, Math.PI / 2, 0, 8);
}
export function boardModel(mb: MB, x: number, y: number, z: number, w = 0.4, d = 0.26) {
  mb.box(x, y, z, w, 0.025, d, WOOD, shade(WOOD, 1.12), 0.1, true);
}
export function knifeModel(mb: MB, x: number, y: number, z: number) {
  // lưỡi dao nằm dọc trục z, cán về +z
  mb.box(x, y, z - 0.09, 0.003, 0.05, 0.19, 0xdfe5ea, 0xf5f8fa, 0, true); mb.box(x, y + 0.012, z + 0.06, 0.02, 0.026, 0.11, 0x3a2a22, 0x4a362c, 0, true);
}
export function basketModel(mb: MB, x: number, y: number, z: number, r = 0.3, h = 0.2, col = BAMBOO) {
  mb.cyl(x, y, z, r * 0.78, h, col, 12, r, false, shade(col, 1.12)); mb.cyl(x, y, z, r * 0.78, 0.012, shade(col, 0.75), 12);
  mb.geo(ringGeo(12), r, 0.022, r, x, y + h, z, shade(col, 0.85));
  mb.cyl(x, y + 0.012, z, r * 0.76, h - 0.02, shade(col, 0.6), 12, r * 0.97, false);
}
export function iceBox(mb: MB, x: number, y: number, z: number, s = 1) {
  mb.box(x, y, z, 0.46 * s, 0.3 * s, 0.3 * s, 0xf08a2f, 0xf3f0e8, 0.08); mb.box(x, y + 0.3 * s, z, 0.48 * s, 0.045 * s, 0.32 * s, 0xf7f5ee, 0xffffff, 0, true);
}
export function lanternModel(mb: MB, x: number, y: number, z: number) {
  mb.cyl(x, y, z, 0.05, 0.02, DARK, 8); mb.cyl(x, y + 0.02, z, 0.04, 0.11, 0xfff0b8, 8); mb.cyl(x, y + 0.13, z, 0.055, 0.025, DARK, 8, 0.02);
}
export function signBoardModel(mb: MB, x: number, y: number, z: number, w = 0.7, h = 0.4) {
  mb.box(x, y, z, w, h, 0.03, 0x2a3a2e, 0x6a4a32, 0, true);
  for (const sx of [-1, 1]) mb.box(x + sx * (w / 2 - 0.03), y - 0.5, z + 0.04, 0.03, 0.5, 0.03, 0x6a4a32);
}
export function plasticStool(mb: MB, x: number, y: number, z: number, col: number, h = 0.4) {
  mb.cyl(x, y, z, 0.17, h, col, 4, 0.13, true, shade(col, 1.15));
}
export function plasticTable(mb: MB, x: number, y: number, z: number, col = 0xd9463c) {
  mb.box(x, y + 0.55, z, 0.7, 0.04, 0.7, col, shade(col, 1.15), 0, true);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mb.box(x + sx * 0.3, y, z + sz * 0.3, 0.04, 0.55, 0.04, shade(col, 0.85));
}
/** Quang gánh: hai thúng tre + đòn gánh. Tâm ở giữa, đòn dọc trục x. */
export function ganhModel(mb: MB, x: number, y: number, z: number, withPole = true) {
  for (const sx of [-1, 1]) {
    basketModel(mb, x + sx * 0.62, y, z, 0.3, 0.24);
    if (withPole) for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.5; mb.rod(x + sx * 0.62 + Math.cos(a) * 0.14, y + 0.52, z + Math.sin(a) * 0.14, 0.006, 0.66, 0x8a6a3a, -Math.sin(a) * 0.42, Math.cos(a) * 0.42, 4); }
  }
  if (withPole) mb.rod(x, y + 0.86, z, 0.022, 1.5, 0x9a7a44, 0, Math.PI / 2, 6);
}
/** Xe đẩy inox có mái. Mặt bán hàng quay về +z. */
export function cartModel(mb: MB, x: number, y: number, z: number) {
  const body = 0xd9dee3, red = 0xd9463c;
  mb.box(x, y + 0.32, z, 1.7, 0.56, 0.8, body, 0xeef1f4, 0.12, true);
  mb.box(x, y + 0.34, z + 0.402, 1.66, 0.5, 0.004, red);
  mb.box(x, y + 0.88, z, 1.74, 0.03, 0.84, 0xf2f4f6, 0xffffff, 0, true);
  for (const sx of [-1, 1]) { mb.rod(x + sx * 0.6, y + 0.3, z, 0.3, 0.06, 0x24262a, Math.PI / 2, 0, 12, Math.PI / 2); mb.box(x + sx * 0.8, y + 0.91, z - 0.38, 0.03, 1.15, 0.03, 0x9aa0a6); mb.box(x + sx * 0.8, y + 0.91, z + 0.38, 0.03, 1.15, 0.03, 0x9aa0a6); }
  mb.box(x, y + 2.06, z, 1.9, 0.05, 1.1, red, 0xf3f0e8, 0, true);
  mb.box(x, y + 1.9, z + 0.55, 1.9, 0.16, 0.02, 0xf5c531, 0xf5c531, 0, true);
  mb.rod(x, y + 0.86, z - 0.55, 0.018, 1.5, 0x8a8f96, 0, Math.PI / 2, 6);
  for (const sx of [-1, 1]) mb.box(x + sx * 0.72, y + 0.6, z - 0.47, 0.03, 0.03, 0.18, 0x8a8f96, 0x8a8f96, 0, true);
}
/** Ô dù lớn. */
export function umbrellaModel(mb: MB, x: number, y: number, z: number, r = 1.25, h = 2.25, c1 = 0xe2402f, c2 = 0xf7f3e6) {
  mb.cyl(x, y, z, 0.022, h, 0x8a8f96, 6); mb.cyl(x, y, z, 0.16, 0.06, 0x55585e, 8);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, c = i % 2 ? c2 : c1;
    const ax = x + Math.cos(a0) * r, az = z + Math.sin(a0) * r, bx = x + Math.cos(a1) * r, bz = z + Math.sin(a1) * r;
    mb.quad(bx, y + h - 0.42, bz, ax, y + h - 0.42, az, x, y + h, z, x, y + h, z, c);
    mb.quad(ax, y + h - 0.43, az, bx, y + h - 0.43, bz, x, y + h - 0.01, z, x, y + h - 0.01, z, shade(c, 0.7));
  }
}
export function fridgeModel(mb: MB, x: number, y: number, z: number) {
  mb.box(x, y, z, 0.6, 1.5, 0.58, 0xe6eaee, 0xf3f5f7, 0.06); mb.box(x, y + 0.95, z - 0.292, 0.58, 0.012, 0.004, 0x9aa0a6); mb.box(x + 0.24, y + 0.6, z - 0.3, 0.02, 0.25, 0.02, 0x9aa0a6);
}
let _ring: Map<number, THREE.BufferGeometry> | null = null;
function ringGeo(seg: number): THREE.BufferGeometry {
  _ring ??= new Map();
  let g = _ring.get(seg);
  // vành mảnh: bán kính 1, dày ngang 0,07; cao đúng 1 đơn vị để tham số sy của mb.geo chính là chiều cao thật
  if (!g) { g = new THREE.TorusGeometry(1, 0.07, 4, seg); g.rotateX(Math.PI / 2); g.scale(1, 0.5 / 0.07, 1); g.computeVertexNormals(); _ring.set(seg, g); }
  return g;
}
/** Vẽ mô hình trưng bày của một món đồ nghề (tiệm Ba Tài). */
export function gearModel(mb: MB, id: string, x: number, y: number, z: number) {
  switch (id) {
    case 'ganh': ganhModel(mb, x, y, z); break;
    case 'xeday': cartModel(mb, x, y, z); break;
    case 'sap': mb.box(x, y, z, 1.4, 0.8, 0.7, 0x8a6a4a, 0xc9a878, 0.1); mb.box(x, y + 1.9, z, 1.6, 0.06, 0.9, 0x2f8fd5, 0xf3f0e8, 0, true); for (const sx of [-1, 1]) mb.box(x + sx * 0.72, y + 0.8, z, 0.04, 1.1, 0.04, 0x8a8f96); break;
    case 'daothot': boardModel(mb, x, y, z, 0.36, 0.24); knifeModel(mb, x + 0.06, y + 0.027, z + 0.02); break;
    case 'bepthan': charcoalStove(mb, x, y, z, 1.1); break;
    case 'bepgas': gasStove(mb, x, y, z, 1.1); break;
    case 'vi': grateModel(mb, x, y + 0.02, z, 0.44, 0.3); break;
    case 'chao': panModel(mb, x, y, z, 1); break;
    case 'noi': potModel(mb, x, y, z, 1); break;
    case 'thungda': iceBox(mb, x, y, z, 1); break;
    case 'odu': umbrellaModel(mb, x, y, z, 0.8, 1.9); break;
    case 'bien': signBoardModel(mb, x, y + 0.55, z, 0.7, 0.4); break;
    case 'den': lanternModel(mb, x, y, z); break;
    case 'ghe': plasticTable(mb, x, y, z); plasticStool(mb, x + 0.6, y, z, 0x2f8fd5); plasticStool(mb, x - 0.6, y, z, 0xd9463c); break;
    case 'gio': basketModel(mb, x, y, z, 0.2, 0.22, 0xd9a05a); mb.geo(ringGeo(10), 0.16, 0.012, 0.16, x, y + 0.36, z, 0xb5803a, 0, Math.PI / 2); break;
    case 'aomua': mb.box(x, y, z, 0.3, 0.06, 0.22, 0x2f8fd5, 0x4fa8e8, 0.05); break;
    case 'tulanh': fridgeModel(mb, x, y, z); break;
  }
}
export { MAT, mix };
