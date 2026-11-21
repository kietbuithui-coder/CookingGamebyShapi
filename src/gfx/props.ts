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
    // ── Ba loại bánh của lượt 54, mỗi loại một hình riêng (trước đây dùng chung 'long'/'round' nên
    // bấm vào đâu cũng ra một cục giống nhau) ──
    // Bánh mì que pa-tê: ổ bánh mì THU NHỎ và DÀI đúng kiểu bánh mì que — thon hai đầu, nứt dọc trên lưng,
    // lớp vỏ vàng nâu bóng, một đầu nhô ra khỏi vỏ giấy gói (giấy nâu quấn quanh thân).
    case 'baguette': {
      const len = 0.26 * s, rad = 0.02 * s;
      mb.rod(x, y + rad + 0.004 * s, z, rad, len, c, 0, Math.PI / 2, 8, r(-0.25, 0.25), rad * 0.82);
      // hai đầu bầu tròn cho khỏi cụt
      for (const sx of [-1, 1]) mb.sph(x + sx * len * 0.48, y + rad + 0.004 * s, z, rad * 0.95, rad * 0.85, rad * 0.82, shade(c, 1.05), 7);
      // đường nứt dọc trên lưng (màu ruột bánh) + vài vết rắc bột
      for (let i = -2; i <= 2; i++) mb.box(x + i * len * 0.16, y + rad * 1.72, z, len * 0.1, 0.004 * s, rad * 0.5, c2);
      mb.box(x, y + rad * 1.85, z, len * 0.35, 0.003 * s, rad * 0.22, shade(c2, 1.1));
      // giấy gói: một ống giấy BỌC QUANH một đầu ổ bánh (nằm ngang theo ổ bánh, không phải ống đứng),
      // đầu kia hở để thấy vỏ bánh — đúng kiểu bánh mì que bán ngoài tiệm.
      mb.rod(x - len * 0.22, y + rad + 0.004 * s, z, rad * 1.14, len * 0.52, 0xcaa972, 0, Math.PI / 2, 8, 0, rad * 1.14);
      mb.rod(x - len * 0.46, y + rad + 0.004 * s, z, rad * 1.2, rad * 0.34, 0xb08f52, 0, Math.PI / 2, 8, 0, rad * 1.06);
      break;
    }
    // Bánh tiêu: đĩa tròn dẹt, phồng ở giữa, rắc mè trắng — nhìn là biết bánh chiên, không phải ổ bánh mì.
    case 'sesame': {
      const R0 = 0.082 * s;
      mb.sph(x, y + 0.03 * s, z, R0, 0.026 * s, R0, c, 14, shade(c, 1.12));            // thân phồng
      mb.cyl(x, y + 0.004 * s, z, R0 * 0.94, 0.012 * s, shade(c, 0.86), 14);            // đáy chiên vàng đậm
      mb.sph(x, y + 0.05 * s, z, R0 * 0.55, 0.03 * s, R0 * 0.55, shade(c, 1.15), 8);    // chỗ phồng cao nhất
      // mè trắng rắc lốm đốm trên mặt
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7 + r(-0.2, 0.2), rr = (i % 3) * 0.24 * R0 + 0.1 * R0;
        mb.box(x + Math.cos(a) * rr, y + 0.05 * s + Math.cos(a * 2) * 0.006 * s, z + Math.sin(a) * rr, 0.012 * s, 0.005 * s, 0.008 * s, c2);
      }
      break;
    }
    // Bánh su kem: vỏ choux nở tròn, nâu vàng, có rãnh nứt ngang; kem trắng phía trên lộ ra (không phủ sô-cô-la).
    case 'choux': {
      const R0 = 0.045 * s;
      mb.sph(x, y + R0 * 0.95, z, R0, R0 * 0.98, R0, c, 12, shade(c, 1.14));
      mb.cyl(x, y, z, R0 * 0.6, 0.005 * s, shade(c, 0.84), 10);                         // đế bánh (nằm gọn dưới đáy)
      // vết nứt ngang lưng bánh — vẽ 4 mẩu rời cho khỏi thành cái đĩa phẳng
      for (let i = 0; i < 4; i++) {
        const a = i * 1.57 + 0.4;
        mb.box(x + Math.cos(a) * R0 * 0.62, y + R0 * 0.86, z + Math.sin(a) * R0 * 0.62, 0.016 * s, 0.006 * s, 0.008 * s, shade(c, 1.24));
      }
      // kem bơm phía trên: một núm xoáy trắng ngà
      mb.sph(x, y + R0 * 1.62, z, R0 * 0.62, R0 * 0.4, R0 * 0.62, c2, 8);
      mb.sph(x, y + R0 * 1.92, z, R0 * 0.34, R0 * 0.3, R0 * 0.34, 0xffffff, 7);
      mb.cyl(x, y + R0 * 2.08, z, R0 * 0.1, R0 * 0.16, 0xffffff, 5);
      break;
    }
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
    // ba mẫu điện thoại bày trên quầy tiệm Đồ Nghề (dựng nghiêng trên giá bìa)
    case 'cucgach':
      mb.box(x, y, z, 0.16, 0.03, 0.12, 0xa89a7a, 0xc9bb98, 0.02);
      mb.box(x, y + 0.03, z, 0.075, 0.17, 0.045, 0x26282c, 0x4a4c52, 0.02);
      mb.box(x, y + 0.12, z - 0.024, 0.05, 0.055, 0.006, 0x9fd6a8, 0xcfe6d2);
      break;
    case 'napgap':
      mb.box(x, y, z, 0.16, 0.03, 0.12, 0xa89a7a, 0xc9bb98, 0.02);
      mb.box(x, y + 0.03, z, 0.085, 0.11, 0.04, 0x2a3a5a, 0x3f5480, 0.02);
      mb.box(x, y + 0.03, z + 0.055, 0.085, 0.16, 0.03, 0x2a3a5a, 0x3f5480, 0.02);
      mb.box(x, y + 0.09, z - 0.021, 0.06, 0.04, 0.006, 0xbfe6ff, 0xe0f2ff);
      break;
    case 'camung':
      mb.box(x, y, z, 0.18, 0.03, 0.13, 0xa89a7a, 0xc9bb98, 0.02);
      mb.box(x, y + 0.03, z, 0.1, 0.2, 0.035, 0x1e2024, 0x3a3c42, 0.02);
      mb.box(x, y + 0.07, z - 0.019, 0.082, 0.12, 0.006, 0x5a8fc9, 0x9fc6e8);
      break;
  }
}

export function speakerModel(mb: MB, x: number, y: number, z: number) {
  mb.box(x, y, z, 0.16, 0.24, 0.13, 0x1e2228, 0x2d333d, 0.08, true);
  mb.cyl(x, y + 0.07, z + 0.068, 0.045, 0.01, 0x3b4452, 10);
  mb.cyl(x, y + 0.17, z + 0.068, 0.032, 0.01, 0x2f8fd5, 10);
}
export function takeawayRackModel(mb: MB, x: number, y: number, z: number) {
  for (let i = 0; i < 4; i++) mb.box(x - 0.08, y + i * 0.024, z, 0.14, 0.02, 0.12, 0xf3f2ec, 0xffffff);
  mb.cyl(x + 0.1, y, z, 0.045, 0.16, 0xf3f2ec, 10, 0.055);
  mb.cyl(x + 0.1, y + 0.16, z, 0.058, 0.012, 0xd9463c, 10);
}
export function juicerModel(mb: MB, x: number, y: number, z: number) {
  mb.box(x, y, z, 0.22, 0.1, 0.22, 0xc5cbd2, 0xe3e8ee, 0.06, true);
  mb.box(x, y + 0.1, z, 0.18, 0.22, 0.18, 0xf3b83a, 0xffd268, 0.04);
  mb.box(x, y + 0.32, z, 0.2, 0.03, 0.2, 0x2f8fd5, 0x4ba6e8, 0.04);
}
export function glassCaseModel(mb: MB, x: number, y: number, z: number, w = 0.85) {
  // khung inox mảnh quanh tủ kính để không che khuất món ăn bên trong
  mb.box(x, y, z, w, 0.02, 0.34, 0xc5cbd2, 0xe3e8ee);
  mb.box(x, y + 0.38, z, w, 0.02, 0.34, 0xc5cbd2, 0xe3e8ee);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mb.box(x + sx * (w / 2 - 0.015), y + 0.02, z + sz * 0.155, 0.022, 0.36, 0.022, 0x9aa2ab);
  mb.box(x, y + 0.19, z, w - 0.04, 0.015, 0.3, 0xd8eef8, 0xeaf7fc);
}
export function teaSetModel(mb: MB, x: number, y: number, z: number) {
  mb.cyl(x - 0.07, y, z, 0.065, 0.19, 0x2f6fb5, 10);
  mb.cyl(x - 0.07, y + 0.19, z, 0.07, 0.022, 0xe9eef4, 10);
  mb.cyl(x + 0.07, y, z, 0.04, 0.11, 0xb8734b, 8);
  mb.rod(x + 0.06, y + 0.11, z, 0.008, 0.09, 0xd8b47c, 0.12, 0, 5);
  mb.rod(x + 0.085, y + 0.11, z, 0.008, 0.09, 0xd8b47c, -0.1, 0, 5);
}
export function standFanModel(mb: MB, x: number, y: number, z: number) {
  mb.cyl(x, y, z, 0.2, 0.04, 0x26282c, 12);
  mb.cyl(x, y + 0.04, z, 0.025, 1.08, 0xc5cbd2, 8);
  mb.cyl(x, y + 1.24, z, 0.22, 0.05, 0x2f8fd5, 14);
  mb.cyl(x, y + 1.24, z + 0.04, 0.06, 0.03, 0x26282c, 10);
}
export function posCounterModel(mb: MB, x: number, y: number, z: number) {
  mb.box(x, y, z, 0.38, 0.07, 0.28, 0x26282c, 0x353940);
  mb.box(x - 0.06, y + 0.07, z, 0.22, 0.2, 0.04, 0x1e2024, 0x2c3038);
  mb.box(x - 0.06, y + 0.09, z + 0.022, 0.19, 0.15, 0.006, 0x5fa8d3, 0x89c7eb);
  mb.box(x + 0.13, y + 0.07, z + 0.03, 0.1, 0.09, 0.12, 0xe8edf2, 0xffffff);
}
export function wifiSpeakerModel(mb: MB, x: number, y: number, z: number) {
  mb.box(x, y, z, 0.22, 0.04, 0.14, 0x1e2024, 0x32363e);
  for (const dx of [-0.07, 0.07]) mb.cyl(x + dx, y + 0.04, z - 0.04, 0.008, 0.14, 0x1e2024, 5);
  mb.box(x + 0.04, y + 0.04, z + 0.04, 0.04, 0.008, 0.02, 0x38d96c, 0x38d96c);
}
export function commercialFridgeModel(mb: MB, x: number, y: number, z: number) {
  mb.box(x, y, z, 0.92, 1.88, 0.64, 0xb8c0c8, 0xd8dfe6, 0.04, true);
  for (const sx of [-0.22, 0.22]) {
    mb.box(x + sx, y + 0.06, z + 0.325, 0.42, 1.76, 0.02, 0xdde3ea, 0xedf2f7);
    mb.box(x + sx * 0.22, y + 0.78, z + 0.345, 0.025, 0.45, 0.025, 0x4b525a);
  }
}
export function commercialStoveModel(mb: MB, x: number, y: number, z: number, s = 1) {
  mb.box(x, y, z, 0.92 * s, 0.16 * s, 0.46 * s, 0x9aa2ab, 0xd8dfe6, 0.06, true);
  for (const bx of [-0.24 * s, 0.24 * s]) {
    mb.cyl(x + bx, y + 0.16 * s, z, 0.11 * s, 0.03 * s, 0x1f2226, 12);
    mb.cyl(x + bx, y + 0.19 * s, z, 0.14 * s, 0.02 * s, 0x353940, 8);
    mb.rod(x + bx, y + 0.08 * s, z + 0.24 * s, 0.024 * s, 0.025 * s, 0xd9361e, Math.PI / 2, 0, 8);
  }
}
export function rangeHoodModel(mb: MB, x: number, y: number, z: number) {
  mb.box(x, y, z, 1.35, 0.22, 0.62, 0xb8c0c8, 0xdde3ea, 0.04, true);
  mb.box(x, y + 0.22, z, 0.42, 0.78, 0.36, 0xa8b0b8, 0xc8d0d8);
}
export function washBasinModel(mb: MB, x: number, y: number, z: number) {
  mb.box(x, y, z, 0.56, 0.78, 0.42, 0xdce4ea, 0xeef4f8, 0.04, true);
  mb.box(x, y + 0.78, z, 0.6, 0.08, 0.46, 0xf7f9fb, 0xffffff);
  mb.box(x, y + 1.02, z - 0.18, 0.46, 0.58, 0.025, 0x9ad1ea, 0xcfeef9);
  mb.cyl(x, y + 0.86, z - 0.12, 0.018, 0.12, 0xc5cbd2, 8);
}
export function acUnitModel(mb: MB, x: number, y: number, z: number, leftSide = true) {
  mb.box(x, y, z, 0.18, 0.28, 0.92, 0xf3f5f7, 0xffffff, 0.06, true);
  mb.box(x + (leftSide ? 0.092 : -0.092), y + 0.04, z + 0.26, 0.008, 0.03, 0.14, 0x2f8fd5, 0x56b4f5);
}
export { MAT, mix };
