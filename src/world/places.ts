// Các địa điểm đặc biệt: cửa hàng, chỗ ở, chỗ làm thêm… Mỗi nơi là một không gian thật, người chơi tự đi bộ vào.
// Toạ độ cục bộ của lô: x ∈ [0,w] dọc mặt tiền, z ∈ [0,d] đi sâu vào trong, z < 0 là vỉa hè.
import { Builder, shade } from './build';
import { Lot } from './layout';
import { MB, mix, FACE } from '../gfx/mb';
import { RNG } from '../core/util';
import { SHOPS } from '../data/shops';
import { INGS } from '../data/ingredients';
import { GEAR_LIST } from '../data/gear';
import { ingModel, gearModel, potModel, plasticStool, plasticTable, fridgeModel, basketModel } from '../gfx/props';
import type { SignStyle } from '../gfx/tex';

export interface Open { x0: number; x1: number; sill?: number; top?: number; }
interface ShellOpt { w: number; d: number; di: number; h1: number; H: number; col: number; inner: number; floor: number | 'tile'; ceil?: number; opens: Open[]; roof?: number; }
const WHITE = 0xf5f2ea, STEEL = 0xb9c0c8, WOODC = 0xa97c50;

/** Vỏ nhà có tầng trệt rỗng để đi vào: tường ngoài, tường trong, sàn, trần, ô cửa. */
export function shell(b: Builder, o: ShellOpt) {
  const L = b.lit, { w, d, di, h1, H, col } = o, t = 0.2;
  if (H > h1 + 0.2) L.box(w / 2, h1, d / 2, w - 0.04, H - h1, d, col, o.roof ?? shade(col, 0.7), 0, true);
  else L.box(w / 2, h1, d / 2, w + 0.2, 0.16, d + 0.3, o.roof ?? shade(col, 0.75), o.roof ?? shade(col, 0.7), 0, true);
  // Mặt trong của tường bao đã có lớp lót nội thất (b.interior) nằm đúng trên mặt phẳng đó, nên bỏ đi kẻo hai lớp
  // trùng nhau nhấp nháy. Tường trước/sau chỉ chạy giữa hai tường hông để không chồng lên nhau ở góc.
  const X0 = 0.22, X1 = w - 0.22;
  b.wall(0.12, 0, 0.12, di, h1, col, t, 0, L, true, FACE.PX); b.wall(w - 0.12, 0, w - 0.12, di, h1, col, t, 0, L, true, FACE.NX);
  b.wall(X0, di - 0.1, X1, di - 0.1, h1, col, t, 0, L, true, FACE.NZ);
  if (di < d - 0.3) { L.box(w / 2, 0, (di + d) / 2, w - 0.04, h1, d - di, col, col, 0.1); b.collide(0, di, w, d); }
  let x = X0, top = h1;
  const ops = o.opens.slice().sort((a, c) => a.x0 - c.x0);
  for (const op of ops) {
    const tp = op.top ?? 2.5, mid = (op.x0 + op.x1) / 2, ww = op.x1 - op.x0; top = Math.min(top, tp);
    if (op.x0 > x + 0.01) b.wall(x, 0.1, op.x0, 0.1, h1, col, t, 0, L, true, FACE.PZ);
    if (op.sill) { L.box(mid, 0, 0.1, ww, op.sill, t, col, WHITE, 0.1); b.collide(op.x0, 0, op.x1, 0.2); }
    if (tp < h1) L.box(mid, tp, 0.1, ww, h1 - tp, t, col, col, 0, true, FACE.PZ);
    x = op.x1;
  }
  if (x < X1 - 0.01) b.wall(x, 0.1, X1, 0.1, h1, col, t, 0, L, true, FACE.PZ);
  b.interior(0.22, 0.2, w - 0.22, di - 0.2, h1 - 0.03, o.inner, o.floor, o.ceil ?? 0xf3f0e8, ops.map((p) => [p.x0, p.x1]), top);
  b.roofed(0, 0, w, d);
}
/** Vách ngăn trong nhà (hai mặt đều thấy được). */
function partition(b: Builder, x0: number, z0: number, x1: number, z1: number, h: number, col: number) {
  const U = b.unlit, xa = Math.min(x0, x1), xb = Math.max(x0, x1), za = Math.min(z0, z1), zb = Math.max(z0, z1), sx = Math.max(0.12, xb - xa), sz = Math.max(0.12, zb - za);
  U.box((xa + xb) / 2, 0.13, (za + zb) / 2, sx, h - 0.13, sz, col, col, 0.08);
  b.collide((xa + xb) / 2 - sx / 2, (za + zb) / 2 - sz / 2, (xa + xb) / 2 + sx / 2, (za + zb) / 2 + sz / 2);
}
function lintel(b: Builder, x0: number, z0: number, x1: number, z1: number, y: number, h: number, col: number) {
  const sx = Math.max(0.12, Math.abs(x1 - x0)), sz = Math.max(0.12, Math.abs(z1 - z0));
  b.unlit.box((x0 + x1) / 2, y, (z0 + z1) / 2, sx, h - y, sz, col, col, 0, true);
}
function ceilLight(b: Builder, x: number, y: number, z: number, w = 1.2) { b.unlit.box(x, y - 0.06, z, w, 0.05, 0.22, 0xffffff, 0xffffff, 0, true); }
/** Bày một mặt hàng lên kệ + đăng ký ô để người chơi tự lấy. */
export function display(b: Builder, mb: MB, shop: string, idx: number, x: number, y: number, z: number, R: RNG, tagDir: [number, number] = [0, -1], gate?: string) {
  const id = SHOPS[shop].items[idx]; if (!id) return;
  const d = INGS[id], big = d.shape === 'bag' || d.shape === 'coal' || d.shape === 'cubes';
  mb.box(x, y, z, 0.62, 0.05, 0.52, 0x8a6a4a, 0x6a4f38, 0, true);
  const n = big ? 2 : 5;
  for (let i = 0; i < n; i++) {
    const ox = big ? (i - 0.5) * 0.26 : ((i % 3) - 1) * 0.19 + R.range(-0.02, 0.02), oz = big ? 0 : (i < 3 ? -0.1 : 0.13) + R.range(-0.02, 0.02);
    ingModel(mb, d, x + ox, y + 0.05, z + oz, big ? 0.85 : 1.15, R);
  }
  const [nx, nz] = tagDir;
  b.signAt(x + nx * 0.28, y + 0.005, z + nz * 0.28, 0.5, 0.11, d.name, { bg: '#fff7d6', fg: '#3a2a1a', border: '#c8102e' }, nx, nz, 26);
  b.slot(shop, idx, x, y + 0.1, z, gate);
}
function shelfUnit(b: Builder, x0: number, z0: number, x1: number, z1: number, h: number, col: number, R: RNG, skipY = -1) {
  const U = b.unlit, alongZ = z1 - z0 > x1 - x0;
  U.box((x0 + x1) / 2, 0.13, (z0 + z1) / 2, x1 - x0, 0.1, z1 - z0, col);
  for (const y of [0.5, 0.95, 1.45, h]) U.box((x0 + x1) / 2, y - 0.03, (z0 + z1) / 2, x1 - x0, 0.03, z1 - z0, col, shade(col, 1.1), 0, true);
  const cols = [0xe2402f, 0xf5c531, 0x2f8fd5, 0x3fae5a, 0xf08a2f, 0xe86f9a, 0xf3f0e8, 0x8a5fd0];
  for (const y of [0.23, 0.5, 0.95, 1.45]) {
    if (Math.abs(y - skipY) < 0.01) continue;
    const len = alongZ ? z1 - z0 : x1 - x0, n = Math.floor(len / 0.3);
    for (let i = 0; i < n; i++) {
      if (R.chance(0.15)) continue;
      const p = 0.15 + i * 0.3, hh = R.range(0.14, 0.3), c = R.pick(cols);
      if (alongZ) U.box((x0 + x1) / 2, y, z0 + p, (x1 - x0) * 0.7, hh, 0.22, c, shade(c, 1.1), 0.1);
      else U.box(x0 + p, y, (z0 + z1) / 2, 0.22, hh, (z1 - z0) * 0.7, c, shade(c, 1.1), 0.1);
    }
  }
  b.collide(x0, z0, x1, z1);
}
function counter(b: Builder, x0: number, z0: number, x1: number, z1: number, col: number, h = 1.0, mb: MB = b.unlit) {
  mb.box((x0 + x1) / 2, 0.13, (z0 + z1) / 2, x1 - x0, h - 0.13, z1 - z0, col, shade(col, 1.25), 0.15);
  b.collide(x0, z0, x1, z1);
}
function bed(b: Builder, x: number, z: number, alongX: boolean, col: number, name: string, phi: number) {
  const U = b.unlit, sx = alongX ? 2.0 : 1.0, sz = alongX ? 1.0 : 2.0;
  U.box(x, 0.13, z, sx, 0.3, sz, WOODC, WOODC, 0.1); U.box(x, 0.43, z, sx - 0.06, 0.16, sz - 0.06, col, shade(col, 1.12), 0.05);
  U.box(x + (alongX ? -0.72 : 0), 0.59, z + (alongX ? 0 : 0.72), alongX ? 0.4 : 0.7, 0.1, alongX ? 0.7 : 0.4, 0xffffff, 0xffffff, 0.05);
  b.collide(x - sx / 2, z - sz / 2, x + sx / 2, z + sz / 2);
  b.anchor(name, x, 0.62, z, phi);
}
/** Bộ ghế sofa: nệm ngồi, tựa lưng, hai tay vịn, gối tựa. back = -1 thì tựa ở phía -z (nhìn về +z). */
function sofa(b: Builder, x: number, z: number, len: number, col: number, back: -1 | 1 = -1, d = 0.86) {
  const U = b.unlit, h0 = 0.13, seat = 0.36, bz = z + back * (d / 2 - 0.09);
  U.box(x, h0, z, len, seat, d, col, shade(col, 1.12), 0.12);                                     // nệm ngồi
  U.box(x, h0 + seat - 0.06, bz, len, 0.52, 0.18, shade(col, 0.88), shade(col, 0.94), 0.14);      // tựa lưng
  for (const sx of [-1, 1]) U.box(x + sx * (len / 2 - 0.09), h0 + 0.06, z, 0.18, seat + 0.16, d, shade(col, 0.8), shade(col, 0.92), 0.1);
  const n = len > 1.6 ? 2 : 1;
  for (let i = 0; i < n; i++) U.box(x + (n === 1 ? 0 : (i - 0.5) * len * 0.42), h0 + seat, z - back * 0.1, 0.4, 0.12, 0.34, 0xe9dcc0, 0xf3e8d2, 0.18);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) U.box(x + sx * (len / 2 - 0.14), h0 - 0.01, z + sz * (d / 2 - 0.12), 0.07, 0.13, 0.07, 0x4a3a2a);
  b.collide(x - len / 2, z - d / 2, x + len / 2, z + d / 2);
}
function bigSign(b: Builder, w: number, y: number, text: string, st: SignStyle, h = 0.95, frac = 0.82, px = 96) {
  const sw = Math.min(w * frac, w - 0.4);
  b.lit.box(w / 2, y - 0.06, -0.07, sw + 0.16, h + 0.12, 0.1, 0x2a2c30, 0x2a2c30, 0, true);
  b.signAt(w / 2, y, -0.125, sw, h, text, st, 0, -1, px);
}

export function buildPlace(b: Builder, l: Lot, R: RNG) {
  b.frame(l.fr, l.at, 0);
  const w = l.w, d = l.d, U = b.unlit, L = b.lit, D = b.detail;
  switch (l.kind) {
    case 'minimart': {
      const di = 10.6, col = 0xf3f5f2;
      shell(b, { w, d, di, h1: 3.4, H: 7.2, col, inner: 0xf7f7f2, floor: 'tile', opens: [{ x0: 1, x1: 5, sill: 0.8, top: 2.7 }, { x0: 5.8, x1: 8.2, top: 2.7 }, { x0: 9, x1: 13, sill: 0.8, top: 2.7 }] });
      L.box(w / 2, 3.25, -0.5, w - 0.4, 0.14, 1.1, 0x1f9d55, 0x1f9d55, 0, true);
      bigSign(b, w, 3.5, 'MiniMart 24h', { bg: '#1f9d55', fg: '#ffffff', sub: 'Tiện lợi · Tươi ngon · 6:00 – 22:30', subFg: '#d9ffe6' }, 1.15, 0.7, 120);
      for (let i = 0; i < 4; i++) b.glow.quad(11.6 - i * 3.1, 4.9, -0.02, 9.4 - i * 3.1, 4.9, -0.02, 9.4 - i * 3.1, 6.4, -0.02, 11.6 - i * 3.1, 6.4, -0.02, i % 2 ? 0xffe2a0 : 0x20262e);
      counter(b, 0.9, 2.3, 4.2, 2.9, 0x2f9d62); U.box(1.6, 1.0, 2.6, 0.4, 0.3, 0.35, 0x2a2c30); b.anchor('v_mart', 2.5, 0.13, 1.5, 0);
      shelfUnit(b, 0.26, 3.6, 0.85, 9.5, 1.9, WHITE, R, 0.95); for (let i = 0; i < 6; i++) display(b, U, 'mart', i, 0.56, 0.95, 4.1 + i * 0.98, R, [1, 0]);
      shelfUnit(b, w - 0.85, 1.0, w - 0.26, 9.5, 1.9, WHITE, R, 0.95); for (let i = 0; i < 6; i++) display(b, U, 'mart', 6 + i, w - 0.56, 0.95, 1.7 + i * 1.45, R, [-1, 0]);
      shelfUnit(b, 6.3, 4.4, 7.7, 8.0, 1.5, WHITE, R, 0.95); display(b, U, 'mart', 12, 6.62, 0.95, 5.3, R, [-1, 0]); display(b, U, 'mart', 13, 7.38, 0.95, 7.1, R, [1, 0]);
      // tủ mát cuối tiệm
      U.box(w / 2, 0.13, di - 0.55, 11.8, 2.0, 0.62, 0xe6eef2, 0xffffff, 0.04); U.box(w / 2, 0.9, di - 0.87, 11.6, 0.9, 0.02, 0xbfe6f7); b.collide(1.1, di - 0.9, 12.9, di - 0.2);
      for (let i = 0; i < 8; i++) display(b, U, 'mart', 14 + i, 1.9 + i * 1.45, 0.98, di - 1.15, R, [0, -1]);
      U.box(w / 2, 0.13, di - 1.15, 11.8, 0.85, 0.6, 0xdfe9ee, 0xcfe0e8); b.collide(1.1, di - 1.45, 12.9, di - 0.9);
      for (const z of [3, 6, 9]) { ceilLight(b, 3.5, 3.37, z, 2); ceilLight(b, 10.5, 3.37, z, 2); }
      b.shutter('mart', 5.8, 8.2, 0.1, 2.7);
      break;
    }
    case 'equip': {
      const di = 10.6, col = 0xe9c46a;
      shell(b, { w, d, di, h1: 3.4, H: 6.8, col, inner: 0xe9e2d0, floor: 0x9a968e, opens: [{ x0: 1, x1: 9, top: 2.9 }] });
      bigSign(b, w, 3.45, 'ĐỒ NGHỀ BA TÀI', { bg: '#0b5ea8', fg: '#ffe14d', sub: 'Xe đẩy · Bếp · Nồi niêu · Sửa chữa', subFg: '#ffffff' }, 1.1, 0.85, 110);
      counter(b, 0.8, 7.6, 3.4, 8.2, 0x8a6a4a); b.anchor('v_equip', 2.1, 0.13, 8.9, Math.PI);
      U.box(0.75, 0.13, 4.0, 0.9, 0.68, 5.8, 0x8a6a4a, 0xb99a72, 0.1); b.collide(0.3, 1.1, 1.2, 6.9);
      U.box(4.6, 0.13, 4.0, 2.0, 0.68, 2.0, 0x8a6a4a, 0xb99a72, 0.1); b.collide(3.6, 3.0, 5.6, 5.0);
      const pos: Record<string, [number, number, number]> = {
        ganh: [7.6, 0.13, 1.6], xeday: [7.7, 0.13, 4.6], sap: [7.7, 0.13, 7.9], daothot: [0.75, 0.82, 1.6], bepthan: [0.75, 0.82, 2.4], bepgas: [0.75, 0.82, 3.25], vi: [0.75, 0.82, 4.05],
        chao: [0.75, 0.82, 4.8], noi: [0.75, 0.82, 5.55], den: [0.75, 0.82, 6.2], aomua: [0.75, 0.82, 6.65], thungda: [4.05, 0.82, 3.5], gio: [5.2, 0.82, 3.5], bien: [4.6, 0.82, 4.55],
        odu: [5.3, 0.13, 6.6], ghe: [4.9, 0.13, 9.4], tulanh: [9.3, 0.13, 9.9],
      };
      GEAR_LIST.forEach((g, i) => { const p = pos[g.id]; if (!p) return; gearModel(U, g.id, p[0], p[1], p[2]); b.slot('equip', i, p[0], p[1] + (p[1] > 0.5 ? 0.15 : 0.7), p[2]); });
      b.collide(6.6, 4.1, 8.8, 5.1); b.collide(6.9, 7.5, 8.5, 8.3);
      for (const z of [3, 7]) ceilLight(b, 5, 3.37, z, 2.4);
      b.shutter('equip', 1, 9, 0.1, 2.9);
      break;
    }
    case 'bank': {
      const di = 8.2, col = 0xe9eef2;
      shell(b, { w, d, di, h1: 3.7, H: 17, col, inner: 0xf3efe6, floor: 'tile', opens: [{ x0: 1, x1: 4, sill: 0.9, top: 2.8 }, { x0: 4.8, x1: 7.2, top: 2.8 }, { x0: 8, x1: 11, sill: 0.9, top: 2.8 }] });
      bigSign(b, w, 3.8, 'NGÂN HÀNG SAO VÀNG', { bg: '#7a0f1e', fg: '#ffd24d' }, 0.95, 0.9, 110);
      for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) { const x1 = w - 0.7 - i * 1.85, y = 5.6 + f * 2.9; b.glow.quad(x1, y, -0.02, x1 - 1.5, y, -0.02, x1 - 1.5, y + 1.9, -0.02, x1, y + 1.9, -0.02, R.chance(0.4) ? 0xfff0c8 : 0x1c2530); }
      counter(b, 1.2, 5.0, 10.8, 5.6, 0x7a0f1e, 1.1); U.box(6, 1.1, 5.3, 9.4, 0.5, 0.03, 0xcfe6f2); b.anchor('v_bank', 6, 0.13, 6.5, Math.PI);
      for (let i = 0; i < 3; i++) U.box(1.6 + i * 0.7, 0.13, 1.4, 0.5, 0.42, 0.5, 0x2f3a52, 0x3a4868, 0.1);
      U.box(10.9, 0.13, 1.2, 0.8, 1.7, 0.6, 0x2f3a52, 0x2f3a52, 0.05); U.box(10.9, 1.05, 0.89, 0.5, 0.36, 0.02, 0x7fd6ff); b.collide(10.5, 0.9, 11.3, 1.5);
      for (const x of [3, 9]) ceilLight(b, x, 3.66, 2.8, 2.4);
      b.shutter('bank', 4.8, 7.2, 0.1, 2.8);
      break;
    }
    case 'hotel': {
      const di = 10.6, col = 0xf3e9dc;
      shell(b, { w, d, di, h1: 3.7, H: 20, col, inner: 0xf7ecd9, floor: 'tile', opens: [{ x0: 1.5, x1: 4.5, sill: 1.0, top: 2.6 }, { x0: 5.8, x1: 8.2, top: 2.8 }, { x0: 9.5, x1: 12.5, sill: 0.9, top: 2.8 }] });
      bigSign(b, w, 3.8, 'KHÁCH SẠN HOA SEN', { bg: '#1e4a3a', fg: '#ffe9a8', sub: '* * *', subFg: '#ffd24d' }, 1.1, 0.85, 110);
      L.box(7, 3.3, -0.9, 3.6, 0.14, 1.8, 0x7a0f1e, 0x7a0f1e, 0, true);
      for (let f = 0; f < 5; f++) for (let i = 0; i < 5; i++) { const x1 = w - 1 - i * 2.6, y = 5.4 + f * 2.9; L.box(x1 - 0.8, y - 0.14, -0.3, 2.0, 0.1, 0.6, WHITE, WHITE, 0, true); b.glow.quad(x1, y, -0.02, x1 - 1.6, y, -0.02, x1 - 1.6, y + 2, -0.02, x1, y + 2, -0.02, R.chance(0.5) ? 0xffdf9a : 0x1c2530); }
      counter(b, 9.2, 5.0, 12.8, 5.6, 0x5a3a26, 1.1); b.anchor('v_hotel', 11, 0.13, 6.5, Math.PI);
      U.box(7, 0.14, 2.6, 2, 0.02, 3.6, 0x9a1e2e);
      // phòng 101
      partition(b, 5.2, 4.4, 5.2, 10.4, 3.67, 0xf3e2c8); partition(b, 0.2, 4.4, 3.5, 4.4, 3.67, 0xf3e2c8); partition(b, 4.5, 4.4, 5.2, 4.4, 3.67, 0xf3e2c8); lintel(b, 3.5, 4.4, 4.5, 4.4, 2.2, 3.67, 0xf3e2c8);
      b.door('door_khachsan', 3.5, 4.4, 1.0, 0, 0x6a4a32, 'khachsan');
      bed(b, 2.2, 9.2, true, 0xf7f7ff, 'bed_khachsan', Math.PI); U.box(4.6, 0.13, 9.8, 0.9, 1.9, 0.6, 0x6a4a32, 0x7a5a42, 0.06); b.collide(4.1, 9.5, 5.1, 10.2); b.anchor('store_khachsan', 4.6, 1.0, 9.45, 0);
      U.box(0.75, 0.13, 5.2, 0.9, 0.02, 0.9, 0xbfe6f7); U.box(0.4, 1.9, 5.2, 0.06, 0.06, 0.3, STEEL, STEEL, 0, true); b.anchor('wash_khachsan', 0.8, 1.2, 5.2, 0);
      ceilLight(b, 2.6, 3.66, 7.4, 1.2); ceilLight(b, 9, 3.66, 2.6, 2.4);
      break;
    }
    case 'motel': {
      const di = 5.4, col = 0xe8b59a;
      shell(b, { w, d, di, h1: 3.2, H: 9.6, col, inner: 0xe9dcc0, floor: 0xa89a86, opens: [{ x0: 1.2, x1: 3.4, top: 2.5 }, { x0: 8.5, x1: 11, sill: 1.1, top: 2.3 }] });
      bigSign(b, w, 3.3, 'NHÀ NGHỈ BÌNH DÂN', { bg: '#c8102e', fg: '#ffe14d', sub: 'Phòng sạch · Nước nóng · 80.000₫/đêm', subFg: '#ffffff' }, 1.0, 0.8, 100);
      for (let f = 0; f < 2; f++) for (let i = 0; i < 4; i++) { const x1 = w - 1 - i * 3, y = 4.9 + f * 3; b.glow.quad(x1, y, -0.02, x1 - 1.3, y, -0.02, x1 - 1.3, y + 1.4, -0.02, x1, y + 1.4, -0.02, R.chance(0.5) ? 0xffd98a : 0x1c2530); L.box(x1 - 0.65, y - 0.1, -0.06, 1.6, 0.08, 0.12, WHITE, WHITE, 0, true); }
      counter(b, 3.4, 2.2, 5.6, 2.8, 0x8a5a3a); b.anchor('v_motel', 4.5, 0.13, 3.7, Math.PI);
      partition(b, 6, 0.2, 6, 1.2, 3.17, 0xe2d2b0); partition(b, 6, 2.2, 6, 5.2, 3.17, 0xe2d2b0); lintel(b, 6, 1.2, 6, 2.2, 2.2, 3.17, 0xe2d2b0);
      b.door('door_nhanghi', 6, 1.2, 1.0, Math.PI / 2, 0x7a5a3a, 'nhanghi');
      bed(b, 11.4, 3.9, true, 0xa8c8ec, 'bed_nhanghi', Math.PI); U.box(12.3, 0.13, 0.8, 0.8, 0.9, 0.6, 0x7a5a3a, 0x8a6a4a, 0.06); b.collide(11.9, 0.4, 12.7, 1.2); b.anchor('store_nhanghi', 12.3, 1.0, 1.15, Math.PI);
      U.box(7.0, 0.13, 4.6, 1.0, 0.02, 1.0, 0xbfe6f7); U.box(6.3, 1.9, 4.6, 0.3, 0.06, 0.06, STEEL, STEEL, 0, true); b.anchor('wash_nhanghi', 7.0, 1.2, 4.6, 0);
      ceilLight(b, 9.4, 3.16, 2.6, 1.2); ceilLight(b, 3.2, 3.16, 2.6, 1.2);
      break;
    }
    case 'tro': {
      const di = 10.6, col = 0xd9e6a8;
      shell(b, { w, d, di, h1: 3.0, H: 3.0, col, roof: 0xb5653c, inner: 0xdfe6c8, floor: 0xa89a86, opens: [{ x0: 0.6, x1: 2.6, top: 2.5 }, { x0: 5, x1: 8.5, sill: 1.0, top: 2.3 }] });
      L.quad(w + 0.1, 3.16, -0.4, -0.1, 3.16, -0.4, -0.1, 3.9, d / 2, w + 0.1, 3.9, d / 2, 0xb5653c); L.quad(-0.1, 3.16, d + 0.2, w + 0.1, 3.16, d + 0.2, w + 0.1, 3.9, d / 2, -0.1, 3.9, d / 2, 0xa85a36);
      b.signAt(1.6, 2.55, -0.06, 1.9, 0.42, 'NHÀ TRỌ BÁC NĂM', { bg: '#ffffff', fg: '#c8102e', border: '#c8102e' }, 0, -1, 48);
      b.anchor('v_tro', 3.7, 0.12, -0.7, Math.PI); plasticStool(D, 3.7, 0.12, -0.7, 0xd9463c);
      partition(b, 2.9, 0.2, 2.9, 2.0, 2.97, 0xd2dcb8); partition(b, 2.9, 3.0, 2.9, 10.4, 2.97, 0xd2dcb8); lintel(b, 2.9, 2.0, 2.9, 3.0, 2.2, 2.97, 0xd2dcb8);
      partition(b, 2.9, 6.0, 10.8, 6.0, 2.97, 0xd2dcb8);
      b.door('door_tro', 2.9, 2.0, 1.0, Math.PI / 2, 0x3f8a6a, 'tro');
      U.box(2.94, 0.13, 8.0, 0.05, 2.1, 0.9, 0x8a5a3a);                                               // cửa phòng hàng xóm (đóng)
      bed(b, 9.6, 4.9, true, 0xf2c8a8, 'bed_tro', Math.PI);
      U.box(10.35, 0.13, 1.2, 0.7, 1.7, 1.6, 0x8a6a4a, 0x9a7a5a, 0.06); for (const y of [0.6, 1.1]) U.box(10.33, y, 1.2, 0.66, 0.03, 1.5, 0xb99a72, 0xb99a72, 0, true);
      b.collide(10, 0.4, 10.7, 2.0); b.anchor('store_tro', 10.0, 1.0, 1.2, -Math.PI / 2);
      U.box(3.7, 0.13, 5.3, 1.0, 0.02, 1.0, 0xbfe6f7); U.box(3.2, 1.85, 5.3, 0.3, 0.06, 0.06, STEEL, STEEL, 0, true); b.anchor('wash_tro', 3.7, 1.2, 5.3, 0);
      b.anchor('fridge_tro', 4.2, 0.13, 0.75, 0);
      U.box(6.5, 0.13, 5.5, 1.1, 0.7, 0.6, 0x8a6a4a, 0xa98a62, 0.1); b.collide(5.95, 5.2, 7.05, 5.8);
      ceilLight(b, 6.5, 2.96, 3.2, 1.2); ceilLight(b, 1.6, 2.96, 5, 1);
      for (let i = 0; i < 3; i++) b.plant(0.6 + i * 0.5, 0.12, -0.4, R, 0.8);
      break;
    }
    // ── Căn hộ thuê: một phòng ở tầng trệt của khu cao tầng, có bếp riêng và cửa sổ nhìn phố ──
    case 'canho': {
      const di = 10.4, col = 0xefe6d8;
      shell(b, { w, d, di, h1: 3.4, H: 13.2, col, inner: 0xf6efe4, floor: 'tile', opens: [{ x0: 1.2, x1: 4.2, sill: 0.9, top: 2.6 }, { x0: 6.2, x1: 8.0, top: 2.35 }, { x0: 9.4, x1: 11.2, sill: 0.9, top: 2.6 }] });
      bigSign(b, w, 3.5, 'CĂN HỘ AN BÌNH', { bg: '#2a4a6a', fg: '#f3f7ff', sub: 'Cho thuê · 900.000₫/tuần', subFg: '#ffe14d' }, 0.95, 0.8, 100);
      for (let f = 0; f < 3; f++) for (let i = 0; i < 4; i++) { const x1 = w - 1 - i * 2.9, y = 5.4 + f * 2.8; b.glow.quad(x1, y, -0.02, x1 - 1.5, y, -0.02, x1 - 1.5, y + 1.5, -0.02, x1, y + 1.5, -0.02, R.chance(0.45) ? 0xffdf9a : 0x1c2530); }
      b.door('door_canho', 6.2, 0.14, 1.8, 0, 0x5a4a3a, 'canho');
      // hộp thư từng căn + bảng số căn + chuông cửa: chi tiết cho ra dáng chung cư
      for (let i = 0; i < 4; i++) { U.box(8.35 + i * 0.3, 1.15, -0.05, 0.24, 0.34, 0.12, 0xb9c0c8, 0xd4dade, 0.06); U.box(8.35 + i * 0.3, 1.32, -0.12, 0.16, 0.03, 0.02, 0x4a4f56); }
      b.signAt(8.8, 1.72, -0.06, 1.3, 0.26, 'HỘP THƯ', { bg: '#f3f0e8', fg: '#3a4048', border: '#8a8f96' }, 0, -1, 48);
      b.signAt(5.5, 2.05, -0.06, 1.0, 0.3, 'CĂN 102', { bg: '#2a4a6a', fg: '#ffffff' }, 0, -1, 48);
      U.box(5.05, 1.25, -0.05, 0.16, 0.3, 0.08, 0x8a9096, 0xb9c0c8, 0.05);
      // phòng khách: sofa, bàn, tivi, thảm
      U.box(2.6, 0.14, 2.4, 2.6, 0.014, 1.9, 0x8a4a4a);
      sofa(b, 2.6, 2.15, 2.4, 0x5a6a7a, 1);
      U.box(2.6, 0.55, 3.5, 1.2, 0.34, 0.62, WOODC, 0xb98a5a, 0.08); b.collide(2.0, 3.2, 3.2, 3.8);
      U.box(2.6, 1.15, 0.36, 1.5, 0.86, 0.06, 0x1b1c1f); b.glow.quad(2.6 + 0.7, 1.2, 0.31, 2.6 - 0.7, 1.2, 0.31, 2.6 - 0.7, 1.9, 0.31, 2.6 + 0.7, 1.9, 0.31, 0x2a3a5a);
      // bếp nhỏ bên phải
      counter(b, 9.2, 1.0, 11.7, 1.9, 0x8a6a4a, 0.95);
      U.box(9.9, 0.96, 1.45, 0.5, 0.03, 0.4, STEEL, STEEL, 0, true); U.box(10.9, 0.96, 1.45, 0.42, 0.1, 0.42, 0x2a2c30);
      fridgeModel(U, 11.2, 0.13, 3.1); b.collide(10.7, 2.6, 11.7, 3.6);
      // vách ngăn buồng ngủ + buồng tắm
      partition(b, 0.2, 6.2, 5.0, 6.2, 3.37, 0xe2d8c8); partition(b, 6.6, 6.2, 9.0, 6.2, 3.37, 0xe2d8c8); lintel(b, 5.0, 6.2, 6.6, 6.2, 2.2, 3.37, 0xe2d8c8);
      partition(b, 9.0, 6.2, 9.0, 10.2, 3.37, 0xe2d8c8); lintel(b, 9.0, 10.2, 9.0, 10.4, 2.2, 3.37, 0xe2d8c8);
      bed(b, 2.8, 8.4, true, 0xdfe8f2, 'bed_canho', Math.PI);
      U.box(7.6, 0.13, 9.4, 0.7, 1.9, 1.5, 0x8a6a4a, 0x9a7a5a, 0.06); for (const y of [0.7, 1.25]) U.box(7.58, y, 9.4, 0.66, 0.03, 1.4, 0xb99a72, 0xb99a72, 0, true); b.collide(7.25, 8.6, 7.95, 10.2);
      b.anchor('store_canho', 7.2, 1.0, 9.4, -Math.PI / 2);
      // buồng tắm: khay sen + vách kính
      U.box(10.7, 0.14, 8.6, 1.5, 0.02, 1.6, 0xbfe6f7); U.box(9.96, 1.9, 8.6, 0.04, 0.06, 0.24, STEEL, STEEL, 0, true);
      b.anchor('wash_canho', 10.7, 1.2, 8.6, -Math.PI / 2);
      b.anchor('v_canho', 9.0, 0.13, 4.6, Math.PI);
      ceilLight(b, 2.8, 3.34, 4.2); ceilLight(b, 10.4, 3.34, 1.5, 1); ceilLight(b, 6.0, 3.34, 8.4);
      break;
    }
    // ── Nhà riêng: sân trước, phòng khách có bàn thờ, hai buồng ngủ, bếp sau ──
    case 'nharieng': {
      const di = 10.4, col = 0xf2d9a8;
      shell(b, { w, d, di, h1: 3.3, H: 6.6, col, roof: 0xb5653c, inner: 0xf7f0dc, floor: 'tile', opens: [{ x0: 1.2, x1: 3.4, sill: 1.0, top: 2.55 }, { x0: 5.2, x1: 7.0, top: 2.4 }, { x0: 9.0, x1: 11.2, sill: 1.0, top: 2.55 }] });
      L.quad(w + 0.1, 3.42, -0.4, -0.1, 3.42, -0.4, -0.1, 3.95, 5.5, w + 0.1, 3.95, 5.5, 0xb5653c);
      b.signAt(6.1, 2.62, -0.06, 1.7, 0.4, 'NHÀ SỐ 12', { bg: '#ffffff', fg: '#1e4a6a', border: '#1e4a6a' }, 0, -1, 44);
      b.door('door_nharieng', 5.2, 0.14, 1.8, 0, 0x8a5a32, 'nharieng');
      for (let i = 0; i < 3; i++) b.plant(0.9 + i * 0.45, 0.12, -0.45, R, 0.8);
      // sân gạch + xe máy + kệ giày
      U.box(7.4, 0.135, 1.1, 2.8, 0.012, 2.0, 0xd9cbb0);
      U.box(8.2, 0.13, 1.4, 0.55, 0.95, 1.9, 0x8a2a2a, 0x9a3a3a, 0.14); b.collide(7.9, 0.45, 8.5, 2.35); U.box(8.2, 0.55, 1.4, 0.6, 0.2, 1.6, 0x2a2c30);
      U.box(4.6, 0.13, 0.55, 1.2, 0.3, 0.35, WOODC, 0xb98a5a, 0.06);
      // phòng khách: bộ ghế + tivi + bàn thờ
      U.box(2.6, 0.14, 3.0, 2.8, 0.014, 2.2, 0x8a4a4a);
      for (const [x, z] of [[1.6, 2.6], [3.6, 2.6]] as const) sofa(b, x, z, 0.95, 0x6a4a2a, 1, 0.85);
      U.box(2.6, 0.5, 4.0, 1.2, 0.3, 0.6, WOODC, 0xb98a5a, 0.08);
      U.box(11.2, 1.2, 3.0, 0.06, 0.9, 1.4, 0x1b1c1f); b.glow.quad(11.14, 1.25, 3.6, 11.14, 1.25, 2.4, 11.14, 2.0, 2.4, 11.14, 2.0, 3.6, 0x2a3a5a);
      // bàn thờ nhỏ sát vách sau
      U.box(2.2, 1.05, 10.1, 1.7, 0.55, 0.45, 0x7a2a22, 0x9a3a2a, 0.06); U.box(2.2, 0.7, 10.1, 1.5, 0.35, 0.35, WOODC, WOODC, 0); U.box(2.2, 1.62, 10.1, 0.22, 0.16, 0.22, 0xd9b84a);
      // vách: buồng ngủ trái, buồng tắm phải
      partition(b, 0.2, 6.4, 4.6, 6.4, 3.27, 0xe9dcc0); partition(b, 6.0, 6.4, 8.6, 6.4, 3.27, 0xe9dcc0); lintel(b, 4.6, 6.4, 6.0, 6.4, 2.2, 3.27, 0xe9dcc0);
      partition(b, 8.6, 4.6, 8.6, 10.2, 3.27, 0xe9dcc0); lintel(b, 8.6, 4.6, 8.6, 6.0, 2.2, 3.27, 0xe9dcc0);
      bed(b, 2.4, 8.6, true, 0xf2c8a8, 'bed_nharieng', Math.PI);
      U.box(6.6, 0.13, 9.6, 0.7, 1.9, 1.5, 0x8a6a4a, 0x9a7a5a, 0.06); b.collide(6.25, 8.8, 6.95, 10.4);
      b.anchor('store_nharieng', 6.6, 1.0, 9.6, -Math.PI / 2);
      U.box(10.6, 0.14, 8.4, 1.6, 0.02, 1.8, 0xbfe6f7); U.box(9.86, 1.9, 8.4, 0.04, 0.06, 0.24, STEEL, STEEL, 0, true);
      b.anchor('wash_nharieng', 10.6, 1.2, 8.4, -Math.PI / 2);
      b.anchor('v_nharieng', 7.9, 0.13, 1.6, Math.PI);
      ceilLight(b, 2.8, 3.24, 3.4); ceilLight(b, 4.4, 3.24, 8.6); ceilLight(b, 10.2, 3.24, 7.2, 1);
      break;
    }
    // ── Cửa hàng kiêm nhà ở: mặt tiền bán hàng, phía sau là chỗ ở ──
    case 'cuahang': {
      const di = 10.4, col = 0xe8dcc8;
      shell(b, { w, d, di, h1: 3.4, H: 8.4, col, inner: 0xf3ead9, floor: 'tile', opens: [{ x0: 0.6, x1: 5.6, top: 2.85 }, { x0: 7.0, x1: 8.6, top: 2.35 }] });
      bigSign(b, w, 3.45, 'TẠP HOÁ BÌNH AN', { bg: '#1e7a4a', fg: '#fff7c2', sub: 'Bán buôn bán lẻ · Mở 6h–21h', subFg: '#ffffff' }, 0.95, 0.8, 100);
      b.awning(0.4, 5.8, 2.9, 1.2, 0x2f8fd5, 0xf7f3e6, -0.04);
      b.door('door_cuahang', 7.0, 0.14, 1.6, 0, 0x3f8a6a, 'cuahang');
      // tầng trên: dãy cửa sổ + gờ tầng cho bớt mảng tường trống
      U.box(w / 2, 3.62, -0.03, w - 0.1, 0.14, 0.1, 0xd8cbb4, 0xe6dcc8, 0.05);
      for (let i = 0; i < 3; i++) {
        const wx = 1.6 + i * 3.6;
        U.box(wx, 4.2, -0.05, 1.5, 1.25, 0.06, 0x2a3a4a); U.box(wx, 4.14, -0.06, 1.65, 0.06, 0.1, 0xe6dcc8);
        U.box(wx, 4.2, -0.07, 0.06, 1.25, 0.05, 0xe6dcc8); U.box(wx, 4.82, -0.07, 1.5, 0.05, 0.05, 0xe6dcc8);
      }
      // quầy bán + kệ hàng hai bên
      counter(b, 1.8, 2.4, 5.4, 3.2, 0x8a6a4a, 1.05);
      U.box(3.6, 1.06, 2.8, 3.4, 0.05, 0.7, 0xd9c38a, 0xe9d8a8, 0.05);
      for (let i = 0; i < 5; i++) U.box(2.2 + i * 0.62, 1.11, 2.8, 0.42, 0.12, 0.5, [0xd9463c, 0xe9c23a, 0x3fae5a, 0x2f8fd5, 0xc98a4a][i], undefined, 0.1);
      for (const [k, y] of [[0, 0.35], [1, 0.95], [2, 1.55]] as const) { const sx = 0.4, wx = 3.6; U.box(wx, y + 0.13, 1.0, 4.6, 0.04, 0.5, 0xb9a88a, 0xc9b89a, 0, true); for (let i = 0; i < 6; i++) U.box(sx + i * 0.72, y + 0.19, 1.0, 0.34, 0.22, 0.34, [0xe9c23a, 0xd9603a, 0x3fae5a, 0x2f8fd5, 0xf3f0e8, 0xc98a4a][(i + k) % 6], undefined, 0.08); }
      b.collide(1.0, 0.7, 6.2, 1.3);
      // phía sau: vách ngăn, buồng ngủ + bếp + buồng tắm
      partition(b, 0.2, 5.6, 4.4, 5.6, 3.37, 0xe2d8c0); partition(b, 5.8, 5.6, 9.8, 5.6, 3.37, 0xe2d8c0); lintel(b, 4.4, 5.6, 5.8, 5.6, 2.2, 3.37, 0xe2d8c0);
      partition(b, 6.4, 5.6, 6.4, 10.2, 3.37, 0xe2d8c0);
      bed(b, 2.0, 8.4, true, 0xf2e0c0, 'bed_cuahang', Math.PI);
      counter(b, 7.0, 8.2, 9.8, 9.1, 0xb9c0c8, 0.95);
      U.box(7.6, 0.96, 8.65, 0.5, 0.03, 0.4, STEEL, STEEL, 0, true); U.box(8.9, 0.96, 8.65, 0.42, 0.1, 0.42, 0x2a2c30);
      U.box(5.0, 0.13, 9.6, 0.7, 1.9, 1.4, 0x8a6a4a, 0x9a7a5a, 0.06); b.collide(4.65, 8.9, 5.35, 10.3);
      b.anchor('store_cuahang', 5.0, 1.0, 9.6, -Math.PI / 2);
      U.box(8.8, 0.14, 6.6, 1.4, 0.02, 1.4, 0xbfe6f7); U.box(8.16, 1.9, 6.6, 0.04, 0.06, 0.24, STEEL, STEEL, 0, true);
      b.anchor('wash_cuahang', 8.8, 1.2, 6.6, -Math.PI / 2);
      b.anchor('v_cuahang', 8.6, 0.13, 1.4, Math.PI);
      ceilLight(b, 3.2, 3.34, 1.8, 1.6); ceilLight(b, 3.0, 3.34, 8.0); ceilLight(b, 8.4, 3.34, 8.6, 1.2);
      break;
    }
    case 'eatery': {
      const di = 10.6, col = 0xf2d98c;
      shell(b, { w, d, di, h1: 3.3, H: 6.5, col, inner: 0xf7efd0, floor: 'tile', opens: [{ x0: 0.8, x1: 11.2, top: 2.8 }] });
      bigSign(b, w, 3.35, 'QUÁN CƠM BÀ TƯ', { bg: '#c8102e', fg: '#ffe14d', sub: 'Cơm bình dân · Canh chua · Thịt kho', subFg: '#ffffff' }, 1.05, 0.85, 110);
      b.awning(0.6, 11.4, 2.95, 1.5, 0xe2402f, 0xf7f3e6, -0.05);
      for (const [x, z] of [[2.2, 1.8], [5.0, 1.8], [2.2, 4.4], [5.0, 4.4]] as const) {
        U.box(x, 0.68, z, 1.1, 0.04, 0.7, STEEL, 0xe6eaee, 0, true); for (const sx of [-1, 1]) U.box(x + sx * 0.45, 0.13, z, 0.04, 0.55, 0.5, 0x8a8f96);
        for (const [sx, sz] of [[-0.35, -0.62], [0.35, -0.62], [-0.35, 0.62], [0.35, 0.62]] as const) plasticStool(U, x + sx, 0.13, z + sz, R.pick([0xd9463c, 0x2f8fd5]), 0.42);
        b.collide(x - 0.55, z - 0.35, x + 0.55, z + 0.35);
      }
      b.anchor('seat_eatery', 2.55, 0.5, 1.18, 0);
      counter(b, 7, 5.0, 11.2, 5.7, 0xb9c0c8, 0.95); for (let i = 0; i < 5; i++) U.box(7.5 + i * 0.8, 0.95, 5.35, 0.6, 0.08, 0.5, [0x9a5a2a, 0x3f8a3a, 0xd9603a, 0xe9c23a, 0xc98a4a][i], undefined, 0.2);
      U.box(9.1, 1.03, 5.1, 4.0, 0.16, 0.02, 0xcfe6f2); b.anchor('v_eatery', 9.1, 0.13, 6.4, Math.PI);   // tấm chắn thấp để vẫn thấy mặt Bà Tư
      partition(b, 0.2, 7.3, 1.2, 7.3, 3.27, 0xe9dfb8); partition(b, 2.4, 7.3, 11.8, 7.3, 3.27, 0xe9dfb8); lintel(b, 1.2, 7.3, 2.4, 7.3, 2.3, 3.27, 0xe9dfb8);
      // bếp + bồn rửa chén
      counter(b, 3.6, 9.7, 11.6, 10.4, 0xb9c0c8, 0.9); U.box(5.6, 0.86, 10.05, 1.2, 0.05, 0.56, 0x6a7a86, 0x55626c); U.box(5.6, 1.0, 10.36, 0.04, 0.3, 0.04, STEEL); U.box(5.6, 1.28, 10.24, 0.04, 0.04, 0.26, STEEL, STEEL, 0, true);
      for (let i = 0; i < 6; i++) U.cyl(4.3, 0.9 + i * 0.02, 10.05, 0.14, 0.015, 0xf7f7f2, 10);
      potModel(U, 9.2, 0.9, 10.05, 1.3); potModel(U, 10.4, 0.9, 10.05, 1.0);
      b.anchor('sink', 5.6, 0.92, 10.05, 0);
      for (const z of [3, 8.8]) ceilLight(b, 6, 3.26, z, 2.4);
      b.shutter('eatery', 0.8, 11.2, 0.1, 2.8);
      break;
    }
    case 'kiosk': case 'pawn': case 'pharmacy': {
      const k = l.kind, di = 3.6;
      const cfg = k === 'kiosk' ? { col: 0xf4c7b8, sign: 'TẠP HOÁ CÔ BA', st: { bg: '#ffd400', fg: '#c8102e', sub: 'Gạo · Mắm muối · Than · Gas · Nước đá', subFg: '#7a0f1e' }, shop: 'kiosk' }
        : k === 'pawn' ? { col: 0xc9c2b2, sign: 'CẦM ĐỒ CHÚ LÂM', st: { bg: '#2a2a2e', fg: '#ffcf5a', sub: 'Thu mua đồ cũ · Giá cao', subFg: '#ffffff' }, shop: 'pawn' }
        : { col: 0xe9f3ee, sign: 'NHÀ THUỐC AN TÂM', st: { bg: '#1e7a3c', fg: '#ffffff', sub: 'Thuốc tây · Bông băng', subFg: '#d9ffe6' }, shop: 'pharmacy' };
      shell(b, { w, d, di, h1: 3.1, H: k === 'pawn' ? 6.3 : 6.8, col: cfg.col, inner: 0xe9e2d0, floor: 0xb0a898, opens: [{ x0: 0.4, x1: w - 0.4, top: 2.6 }] });
      bigSign(b, w, 3.05, cfg.sign, cfg.st as SignStyle, 0.9, 0.92, 96);
      if (k !== 'pharmacy') b.awning(0.3, w - 0.3, 2.75, 1.2, k === 'kiosk' ? 0x2f8fd5 : 0x6a7a8a, 0xf7f3e6, -0.05);
      for (let i = 0; i < 2; i++) b.glow.quad(w - 0.8 - i * (w / 2 - 0.2), 4.2, -0.02, w - 2.2 - i * (w / 2 - 0.2), 4.2, -0.02, w - 2.2 - i * (w / 2 - 0.2), 5.6, -0.02, w - 0.8 - i * (w / 2 - 0.2), 5.6, -0.02, i ? 0xffd98a : 0x1c2530);
      const cw = w - 0.9;
      U.box(w / 2, 0.13, 0.75, cw, 0.72, 0.6, 0x8a6a4a, 0xb99a72, 0.12); b.collide(0.4, 0.4, w - 0.4, 1.4);
      shelfUnit(b, 0.3, di - 0.75, w - 0.3, di - 0.25, 2.2, 0x8a6a4a, R);
      b.anchor('v_' + cfg.shop, w / 2, 0.13, 2.1, Math.PI);
      if (k === 'kiosk') {
        U.box(w / 2, 0.85, 1.12, cw, 0.3, 0.36, 0x8a6a4a, 0xb99a72, 0.1);
        for (let i = 0; i < 6; i++) display(b, U, 'kiosk', i, 0.95 + i * 0.82, 0.85, 0.66, R);
        for (let i = 0; i < 6; i++) display(b, U, 'kiosk', 6 + i, 0.95 + i * 0.82, 1.15, 1.12, R, [0, -1]);
        for (let i = 0; i < 5; i++) U.box(0.7 + i * 1.1, 2.3, 0.35, 0.3, 0.26, 0.05, [0xe2402f, 0xf5c531, 0x3fae5a, 0x2f8fd5, 0xe86f9a][i], undefined, 0, true);
      } else if (k === 'pharmacy') { display(b, U, 'pharmacy', 0, w / 2 + 1.2, 0.85, 0.72, R); U.box(w / 2 - 1, 0.85, 0.75, 0.5, 0.4, 0.3, 0xffffff, 0x1e7a3c); }
      else { for (let i = 0; i < 6; i++) U.box(0.9 + i * 1.05, 0.85, 0.75, 0.3, R.range(0.1, 0.3), 0.25, R.pick([0xd9b84a, 0x4a5a6a, 0x8a5a3a, 0xdfe6ea]), undefined, 0.1); for (let i = 0; i < 9; i++) U.box(0.7 + i * 0.8, 0.98, 0.5, 0.03, 1.6, 0.03, 0x55585e); }
      ceilLight(b, w / 2, 3.06, 1.8, 1.4);
      b.shutter(cfg.shop, 0.4, w - 0.4, 0.1, 2.6);
      break;
    }
    case 'depot': {
      const di = 8.2, col = 0x8fa3b0;
      shell(b, { w, d, di, h1: 4.6, H: 6.6, col, inner: 0xb8c0c4, floor: 0x8a8a84, ceil: 0x9aa2a8, opens: [{ x0: 2.2, x1: 9.8, top: 4.2 }] });
      bigSign(b, w, 4.7, 'VỰA ĐẦU MỐI TÁM LÚA', { bg: '#ffd400', fg: '#0b5ea8', sub: 'Bán sỉ từ 3 giờ sáng tới 9 giờ', subFg: '#7a0f1e' }, 1.2, 0.9, 110);
      for (let i = 0; i < 6; i++) display(b, U, 'wholesale', i, 1.5 + i * 1.8, 0.45, 3.0, R);
      for (let i = 0; i < 5; i++) display(b, U, 'wholesale', 6 + i, 2.4 + i * 1.8, 0.45, 5.6, R);
      for (let i = 0; i < 6; i++) { U.box(1.5 + i * 1.8, 0.13, 3.0, 1.2, 0.32, 0.9, 0xa98a62, 0x8a6a4a, 0.1); b.collide(0.9 + i * 1.8, 2.55, 2.1 + i * 1.8, 3.45); }
      for (let i = 0; i < 5; i++) { U.box(2.4 + i * 1.8, 0.13, 5.6, 1.2, 0.32, 0.9, 0xa98a62, 0x8a6a4a, 0.1); b.collide(1.8 + i * 1.8, 5.15, 3.0 + i * 1.8, 6.05); }
      for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) U.box(0.9 + i * 1.6, 0.13 + j * 0.3, 7.4, 1.3, 0.28, 0.7, j % 2 ? 0xd9cdb0 : 0xc9b890, undefined, 0.1);
      b.collide(0.2, 7.0, 11.8, 7.9);
      b.anchor('v_wholesale', 10.9, 0.13, 1.2, Math.PI);
      for (const x of [3.5, 8.5]) ceilLight(b, x, 4.56, 4, 2.4);
      b.shutter('wholesale', 2.2, 9.8, 0.1, 4.2);
      break;
    }
    case 'cafe': {
      const tv = l.id === 'bongda', di = 7.5, col = tv ? 0xd6c1a8 : 0xf7f3ea;
      shell(b, { w, d, di, h1: 3.3, H: tv ? 6.3 : 9.6, col, inner: tv ? 0xe2d2b0 : 0xf3e9dc, floor: tv ? 0x9a968e : 'tile', opens: [{ x0: 0.5, x1: w - 0.5, top: 2.8 }] });
      bigSign(b, w, 3.35, tv ? 'CÀ PHÊ BÓNG ĐÁ' : 'CÀ PHÊ SÂN VƯỜN', tv ? { bg: '#1e7a3c', fg: '#fff7c2', sub: 'Màn hình lớn · Trực tiếp mỗi tối', subFg: '#ffffff' } : { bg: '#5a3a26', fg: '#ffe9c8', sub: 'Coffee & Tea', subFg: '#e9c88a' }, 1.0, 0.85, 100);
      b.awning(0.4, w - 0.4, 2.95, 1.4, tv ? 0x1e7a3c : 0x5a3a26, 0xf7f3e6, -0.05);
      if (tv) {
        U.box(w / 2, 1.3, di - 0.3, 3.2, 1.8, 0.08, 0x1b1c1f); b.cur.glow.quad(w / 2 + 1.5, 1.4, di - 0.36, w / 2 - 1.5, 1.4, di - 0.36, w / 2 - 1.5, 3.0, di - 0.36, w / 2 + 1.5, 3.0, di - 0.36, 0x6fd08a);
        for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) plasticStool(U, 1.5 + i * 1.35, 0.13, 1.6 + r * 1.5, R.pick([0xd9463c, 0x2f8fd5, 0x3fae5a]), 0.4);
        b.anchor('tv_bongda', w / 2, 0.13, 3, 0);
      } else {
        for (const [x, z] of [[2, 2], [5, 2], [8, 2], [2, 5], [5, 5], [8, 5]] as const) { U.cyl(x, 0.13, z, 0.04, 0.62, 0x3a2a22, 6); U.cyl(x, 0.75, z, 0.4, 0.04, 0x8a5a3a, 10); for (const s of [-0.65, 0.65]) U.box(x + s, 0.13, z, 0.4, 0.42, 0.4, 0xd9b88a, 0xe9c8a0, 0.1); b.circle(x, z, 0.42); }
        for (let i = 0; i < 4; i++) b.plant(0.7 + i * (w - 1.4) / 3, 0.12, -0.5, R, 1.1);
      }
      counter(b, 0.6, di - 1.3, w - 0.6, di - 0.7, tv ? 0x8a6a4a : 0x5a3a26, 1.05);
      for (const x of [w * 0.3, w * 0.7]) ceilLight(b, x, 3.26, 3, 1.6);
      break;
    }
    case 'scrap': {
      // bãi ve chai: sân trống, hàng rào tôn, kho phía sau
      b.ground.dirt.floor(0, 0, w, 7.2, 0.125, 0xffffff, 3);
      for (const [x0, x1] of [[0, 5], [11, w]] as const) { L.box((x0 + x1) / 2, 0, 0.1, x1 - x0, 2.0, 0.08, 0x6a8a7a, 0x55706a, 0.15); b.collide(x0, 0, x1, 0.2); }
      b.wall(0.1, 0, 0.1, 7.2, 2.2, 0x8a8a84); b.wall(w - 0.1, 0, w - 0.1, 7.2, 2.2, 0x8a8a84);
      L.box(w / 2, 0, 9.1, w - 0.04, 3.8, 3.8, 0x9a9a92, 0x7a8a96, 0.15); b.collide(0, 7.2, w, d); L.box(w / 2, 0.12, 7.19, 5, 2.6, 0.04, 0x2a2c30);
      b.signAt(8, 2.7, -0.02, 6.2, 0.9, 'VỰA VE CHAI TƯ RÁC', { bg: '#ffffff', fg: '#0b5ea8', border: '#0b5ea8', sub: 'Thu mua nhựa · lon · giấy · sắt vụn', subFg: '#c8102e' }, 0, -1, 96);
      for (const x of [5, 11]) L.box(x, 0, 0.1, 0.16, 3.7, 0.16, 0x55585e); L.box(8, 2.62, 0.1, 6.4, 0.08, 0.1, 0x55585e, 0x55585e, 0, true);
      for (let i = 0; i < 5; i++) for (let j = 0; j < R.int(2, 5); j++) D.box(1.2 + i * 0.5 + R.range(-0.1, 0.1), 0.12 + j * 0.22, 5.4 + (i % 2) * 0.8, 0.9, 0.2, 0.7, mix(0xb99a6a, 0x8a7350, R.next()), undefined, 0.1);
      b.collide(0.6, 4.9, 4.0, 6.7);
      for (let i = 0; i < 4; i++) D.sph(13.2 + (i % 2) * 1.2, 0.6, 5.2 + Math.floor(i / 2) * 1.2, 0.65, 0.55, 0.65, [0xbfe3f2, 0xdfe6ea, 0xa8d8ec, 0xe9ecd0][i], 7); b.collide(12.6, 4.6, 15.2, 7.0);
      for (let i = 0; i < 12; i++) D.box(13.5 + R.range(-1, 1), 0.12 + R.range(0, 0.5), 1.8 + R.range(-0.6, 0.6), R.range(0.2, 0.8), R.range(0.06, 0.3), R.range(0.2, 0.6), mix(0x7a6a62, 0x4a4a52, R.next()), undefined, 0.1, true);
      b.collide(12.4, 1.1, 14.6, 2.5);
      D.box(8.2, 0.12, 3.0, 0.9, 0.08, 0.7, 0x55585e, 0x8a8f96); D.box(8.2, 0.2, 3.38, 0.08, 0.9, 0.08, 0x55585e); D.cyl(8.2, 1.1, 3.38, 0.2, 0.05, 0xf7f7f2, 10);
      b.anchor('v_scrap', 9.7, 0.12, 3.4, Math.PI); plasticStool(D, 10.5, 0.12, 3.9, 0x2f8fd5);
      break;
    }
    case 'site': {
      b.ground.dirt.floor(0, 0.2, w, d, 0.125, 0xffffff, 3);
      for (let i = 0; i < 8; i++) L.box(1 + i * 2, 0, 0.1, 1.96, 2.1, 0.06, i % 2 ? 0x3f8a6a : 0x4a9a7a, undefined, 0.12);
      b.collide(0, 0, w, 0.25); b.collide(0, 0.25, 0.3, d); b.collide(w - 0.3, 0.25, w, d);
      b.signAt(8, 1.0, -0.02, 5, 0.8, 'CÔNG TRÌNH ĐANG THI CÔNG', { bg: '#ffd400', fg: '#1b1c1f', border: '#1b1c1f', sub: 'Nguy hiểm — Không phận sự miễn vào', subFg: '#c8102e' }, 0, -1, 80);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) L.box(1.5 + i * 4.3, 0, 3 + j * 3.4, 0.4, 9.6, 0.4, 0xa9a6a0, undefined, 0.15);
      for (const y of [3.2, 6.4]) L.box(w / 2, y, 6.4, w - 2, 0.25, 7.6, 0xb9b6ae, 0xa9a6a0, 0, true);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) D.box(1.4 + i * 4.3 + k * 0.1, 9.6, 3 + j * 3.4, 0.03, 0.8, 0.03, 0x8a4a2a);
      D.sph(13.5, 0.2, 2.2, 1.4, 0.7, 1.2, 0xd9c890, 6); for (let i = 0; i < 10; i++) D.box(3 + (i % 5) * 0.5, 0.12 + Math.floor(i / 5) * 0.14, 1.6, 0.46, 0.13, 0.9, 0xb5653c, undefined, 0.1);
      for (const x of [0.6, w - 0.6]) { b.beam(D, x, 0, 0.5, x, 9.8, 0.5, 0.04, 0x8a8f96); }
      for (const y of [3.4, 6.6, 9.6]) b.beam(D, 0.6, y, 0.5, w - 0.6, y, 0.5, 0.035, 0x8a8f96);
      break;
    }
    case 'school': {
      const yel = 0xf2d27a;
      for (const [x0, x1] of [[0, 13], [17, w]] as const) { L.box((x0 + x1) / 2, 0, 0.15, x1 - x0, 0.8, 0.2, yel, WHITE, 0.1); for (let x = x0 + 0.3; x < x1; x += 0.3) D.box(x, 0.8, 0.15, 0.03, 1.2, 0.03, 0x3a5a8a); L.box((x0 + x1) / 2, 2.0, 0.15, x1 - x0, 0.06, 0.08, 0x3a5a8a, undefined, 0, true); }
      b.collide(0, 0, w, 0.3);
      for (const x of [13, 17]) L.box(x, 0, 0.15, 0.5, 3.6, 0.5, yel, WHITE, 0.1); L.box(15, 3.3, 0.15, 5, 0.9, 0.3, 0x2f6fb5, undefined, 0, true);
      b.signAt(15, 3.38, -0.02, 4.6, 0.72, 'TRƯỜNG THCS HOA PHƯỢNG', { bg: '#2f6fb5', fg: '#ffffff' }, 0, -1, 80);
      for (let x = 13.4; x < 16.9; x += 0.28) D.box(x, 0.12, 0.15, 0.04, 2.3, 0.04, 0x3a5a8a);
      L.box(w / 2, 0, 8.2, w - 0.04, 10.2, 5.6, yel, 0xb5653c, 0.08); b.collide(0, 5.4, w, d);
      L.quad(w + 0.2, 10.2, 5.0, -0.2, 10.2, 5.0, -0.2, 11.6, 8.2, w + 0.2, 11.6, 8.2, 0xb5553a);
      for (let f = 0; f < 3; f++) {
        L.box(w / 2, 3.25 + f * 3.3 - 3.3 + 3.2, 5.0, w - 0.2, 0.14, 1.0, WHITE, WHITE, 0, true);
        for (let i = 0; i < 9; i++) { const x1 = w - 1.2 - i * 3.2, y = 0.5 + f * 3.3; b.glow.quad(x1, y + 0.6, 5.38, x1 - 1.5, y + 0.6, 5.38, x1 - 1.5, y + 2.1, 5.38, x1, y + 2.1, 5.38, 0x1c2530); L.box(x1 - 2.2, y, 5.38, 0.8, 2.1, 0.05, 0x3a7a9a); }
      }
      D.cyl(15, 0.12, 2.6, 0.05, 7, 0xd9dde2, 6); D.quad(15, 6.1, 2.6, 16.3, 6.1, 2.6, 16.3, 7.0, 2.6, 15, 7.0, 2.6, 0xda251d); D.quad(16.3, 6.1, 2.6, 15, 6.1, 2.6, 15, 7.0, 2.6, 16.3, 7.0, 2.6, 0xda251d);
      for (const x of [5, 25]) b.tree(x, 2.8, R, 6.2, true);
      break;
    }
    case 'temple': {
      const red = 0xb5332a, tile = 0xa8502e, wallc = 0xf2d98c;
      for (const [x0, x1] of [[0, 7], [11, w]] as const) { L.box((x0 + x1) / 2, 0, 0.15, x1 - x0, 1.9, 0.25, wallc, tile, 0.1); b.collide(x0, 0, x1, 0.3); }
      for (const x of [7, 11]) L.box(x, 0, 0.15, 0.55, 4.2, 0.55, red, undefined, 0.1);
      L.box(9, 3.6, 0.15, 5.4, 0.6, 0.5, wallc, undefined, 0, true);
      L.quad(12.4, 4.2, -0.9, 5.6, 4.2, -0.9, 6.4, 5.3, 0.15, 11.6, 5.3, 0.15, tile); L.quad(5.6, 4.2, 1.2, 12.4, 4.2, 1.2, 11.6, 5.3, 0.15, 6.4, 5.3, 0.15, shade(tile, 0.85));
      b.signAt(9, 3.62, -0.11, 3.6, 0.56, 'CHÙA PHƯỚC AN', { bg: '#7a0f1e', fg: '#ffd24d' }, 0, -1, 80);
      b.ground.tile.floor(0.2, 0.3, w - 0.2, 5.6, 0.126, 0xffffff, 2.4);
      L.box(w / 2, 0, 8.3, w - 0.04, 5.2, 5.4, wallc, tile, 0.08); b.collide(0, 5.6, w, d);
      L.quad(w + 0.6, 5.0, 4.4, -0.6, 5.0, 4.4, 0.6, 7.4, 8.3, w - 0.6, 7.4, 8.3, tile);
      for (let i = 0; i < 5; i++) L.cyl(1.6 + i * 3.7, 0, 5.3, 0.22, 5.0, red, 8);
      for (let i = 0; i < 2; i++) L.box(6.2 + i * 5.6, 0.12, 5.58, 2.2, 3.2, 0.06, 0x6a2a1e);
      D.cyl(9, 0.12, 3.0, 0.5, 0.7, 0x8a8f86, 10, 0.62); D.cyl(9, 0.82, 3.0, 0.66, 0.1, 0x6a6f66, 10); for (let i = 0; i < 5; i++) D.cyl(9 + (i - 2) * 0.1, 0.9, 3.0, 0.008, 0.4, 0xc8442c, 4); b.circle(9, 3.0, 0.7);
      b.table(14.2, 2.6, 1.8, 0.8, 0.8, 0xf3f0e8, D); for (let i = 0; i < 4; i++) D.cyl(13.6 + i * 0.4, 0.92, 2.6, 0.11, 0.07, 0xf7f7f2, 8); potModel(D, 14.8, 0.8, 2.75, 0.9);
      b.collide(13.3, 2.2, 15.1, 3.0); b.anchor('v_temple', 14.2, 0.12, 3.6, Math.PI);
      b.signAt(14.2, 0.3, 2.18, 1.5, 0.38, 'Cơm chay từ thiện 11h', { bg: '#fff7d6', fg: '#7a0f1e', border: '#7a0f1e' }, 0, -1, 44);
      b.tree(3.4, 3.0, R, 6.5, false);
      break;
    }
    case 'hospital': {
      // Bệnh viện Phước An: sảnh tiếp nhận, quầy thuốc, phòng hồi sức phía sau vách ngăn.
      const di = 10.2, col = 0xeef3f4;
      shell(b, { w, d, di, h1: 3.7, H: 16.5, col, inner: 0xf7f9f7, floor: 'tile', opens: [{ x0: 0.8, x1: 2.8, sill: 0.9, top: 2.8 }, { x0: 3.6, x1: 6.9, top: 3.1 }, { x0: 7.8, x1: 9.8, sill: 0.9, top: 2.8 }] });
      bigSign(b, w, 3.4, 'BỆNH VIỆN PHƯỚC AN', { bg: '#0b5ea8', fg: '#ffffff', sub: 'Cấp cứu 24/24 · Khám bệnh · Nhà thuốc', subFg: '#d9f0ff' }, 0.95, 0.9, 104);
      // dấu thập đỏ trên mặt tiền
      L.box(w / 2, 5.05, -0.07, 0.62, 1.8, 0.12, 0xd81e2a, 0xd81e2a, 0, true);
      L.box(w / 2, 5.65, -0.07, 1.8, 0.62, 0.12, 0xd81e2a, 0xd81e2a, 0, true);
      for (let f = 0; f < 4; f++) for (let i = 0; i < 3; i++) { const x1 = w - 1.2 - i * 3.2, y = 5.0 + f * 3.2; L.box(x1 - 0.7, y - 0.12, -0.3, 1.6, 0.1, 0.5, WHITE, WHITE, 0, true); b.glow.quad(x1, y, -0.02, x1 - 1.4, y, -0.02, x1 - 1.4, y + 1.6, -0.02, x1, y + 1.6, -0.02, R.chance(0.45) ? 0xdfefff : 0x1c2530); }
      // mái che lối vào + bảng cấp cứu cho dễ nhận ra từ ngoài đường
      L.box(w / 2, 3.12, -0.95, 3.9, 0.14, 1.9, 0x0b5ea8, 0x0b5ea8, 0, true);
      for (const px of [3.75, 6.75]) L.box(px, 0, -1.72, 0.12, 3.12, 0.12, 0x9aa2a8, 0xb9c0c8, 0, true);
      U.box(w / 2, 0.0, -0.7, 3.4, 0.02, 1.5, 0xd8dee2);
      b.signAt(3.0, 2.62, -0.14, 1.5, 0.4, 'CẤP CỨU', { bg: '#d81e2a', fg: '#ffffff', border: '#ffffff' }, 0, -1, 56);
      // sảnh: ốp tường xanh nhạt, ghế chờ dọc tường trái
      for (let i = 0; i < 4; i++) { U.box(1.05, 0.13, 1.3 + i * 0.62, 0.52, 0.42, 0.5, 0x2f8fd5, 0x4aa8f0, 0.1); U.box(0.72, 0.55, 1.3 + i * 0.62, 0.1, 0.5, 0.5, 0x2f8fd5, 0x4aa8f0, 0.1); b.collide(0.75, 1.05 + i * 0.62, 1.35, 1.55 + i * 0.62); }
      // quầy thuốc + tủ thuốc bên phải
      shelfUnit(b, w - 0.78, 4.6, w - 0.24, 8.4, 2.0, 0xdfeef0, R);
      for (let i = 0; i < 5; i++) U.box(w - 0.52, 0.9, 5.0 + i * 0.72, 0.34, 0.26, 0.4, [0xffffff, 0xdfe9f2, 0xf3e8d2, 0xe9f3ee, 0xf7e6e6][i], 0xffffff, 0.06);
      counter(b, w - 1.35, 8.6, w - 0.35, 9.2, 0xdfeef0, 0.95);
      b.anchor('quay_thuoc', w - 0.95, 0.13, 7.6, Math.PI / 2);
      b.signAt(w - 0.52, 2.35, 4.58, 1.5, 0.34, 'NHÀ THUỐC', { bg: '#ffffff', fg: '#1e7a3c', border: '#1e7a3c' }, 0, -1, 48);
      // vách ngăn + cửa vào phòng hồi sức
      partition(b, 0.2, 4.5, 6.2, 4.5, 3.67, 0xd8e6ea); partition(b, 7.3, 4.5, w - 0.2, 4.5, 3.67, 0xd8e6ea);
      lintel(b, 6.2, 4.5, 7.3, 4.5, 2.3, 3.67, 0xd8e6ea);
      b.signAt(3.2, 2.9, 4.44, 2.2, 0.4, 'PHÒNG HỒI SỨC', { bg: '#0b5ea8', fg: '#ffffff', border: '#0b5ea8', sub: 'Nằm nghỉ tính theo giờ', subFg: '#d9f0ff' }, 0, -1, 64);
      // ốp chân tường màu xanh bệnh viện + bảng chỉ dẫn
      for (const [x0, x1, z0, z1, dx, dz] of [[0.23, 0.23, 0.3, 4.3, 1, 0], [w - 0.23, w - 0.23, 0.3, 4.3, -1, 0]] as const) {
        U.box(x0, 0.14, (z0 + z1) / 2, 0.04, 1.05, z1 - z0, 0x2f8fd5, 0x4aa8f0);
        b.signAt(x0 + dx * 0.03, 1.85, (z0 + z1) / 2 + 0.4, 0.9, 0.62, 'RỬA TAY SẠCH', { bg: '#ffffff', fg: '#0b5ea8', border: '#2f8fd5', sub: 'Trước khi vào khám', subFg: '#7a3a8a' }, dx, dz, 40);
      }
      U.box(3.0, 0.14, 4.45, 6.0, 1.05, 0.04, 0x2f8fd5, 0x4aa8f0);
      // quầy tiếp nhận phía sau
      counter(b, 6.6, 9.0, w - 0.3, 9.6, 0x8fa3b0, 1.05);
      U.box(8.3, 1.18, 9.3, 1.1, 0.36, 0.03, 0xcfe6f2);
      b.signAt(8.3, 2.45, 8.94, 2.2, 0.44, 'TIẾP NHẬN', { bg: '#0b5ea8', fg: '#ffffff', border: '#0b5ea8', sub: 'Khám bệnh · Viện phí · Thất lạc', subFg: '#d9f0ff' }, 0, -1, 64);
      // bảng gọi số điện tử
      U.box(8.3, 2.95, 8.98, 1.5, 0.5, 0.08, 0x1b1c1f, 0x2a2c30, 0.05);
      for (let i = 0; i < 3; i++) b.cur.glow.quad(7.9 + i * 0.4, 3.0, 8.93, 7.65 + i * 0.4, 3.0, 8.93, 7.65 + i * 0.4, 3.35, 8.93, 7.9 + i * 0.4, 3.35, 8.93, 0x6fd08a);
      b.anchor('v_hospital', 8.3, 0.13, 10.0, Math.PI);
      // hai giường bệnh, rèm trắng ngăn cách
      for (const z of [6.6, 9.0]) {
        U.box(2.0, 0.13, z, 1.0, 0.3, 2.0, WOODC, WOODC, 0.1);
        U.box(2.0, 0.43, z, 0.94, 0.16, 1.94, 0xe9f4ff, 0xffffff, 0.05);
        U.box(2.0, 0.59, z - 0.62, 0.7, 0.1, 0.4, 0xffffff, 0xffffff, 0.05);
        b.collide(1.5, z - 1.0, 2.5, z + 1.0);
        for (const [sx, sz] of [[-0.55, -1.05], [0.55, -1.05], [-0.55, 1.05], [0.55, 1.05]] as const) U.box(2.0 + sx, 0.13, z + sz, 0.06, 0.9, 0.06, 0x9aa2a8);
        U.box(2.0, 1.02, z - 1.05, 1.2, 0.05, 0.05, 0x9aa2a8);
        U.box(2.0, 0.75, z - 1.02, 1.14, 0.6, 0.03, 0xf2f7ff, 0xe6eef8, 0.02);
      }
      b.anchor('giuong_benhvien', 3.35, 0.13, 6.6, -Math.PI / 2);
      U.box(3.1, 0.13, 9.6, 0.5, 0.5, 0.5, 0xdfeef0, 0xffffff, 0.1);
      for (const [x, z] of [[4.6, 6.4], [4.6, 8.0], [8.4, 2.4]]) ceilLight(b, x, 3.66, z, 1.6);
      ceilLight(b, 2.0, 3.66, 2.4, 1.4);
      break;
    }
    case 'spot': {
      // khoảng trống lùi vào để đặt quầy hàng
      const H = 7.2, col = 0xbfb6a6;
      L.box(w / 2, 0, (3.6 + d) / 2, w - 0.04, H, d - 3.6, col, shade(col, 0.7), 0.15); b.collide(0, 3.6, w, d);
      for (let i = 0; i < 4; i++) L.box(0.8 + i * 1.4 + R.range(-0.2, 0.2), R.range(0.9, 1.6), 3.585, R.range(0.5, 0.9), R.range(0.6, 1.1), 0.02, R.pick([0xf3e2a8, 0xe9c8c8, 0xc8dce9, 0xf7f3ea, 0xe2402f]), undefined, 0, true);
      b.signAt(w / 2, 2.9, 3.58, 3.2, 0.7, 'CHỖ BÁN HÀNG', { bg: '#ffd400', fg: '#1b1c1f', border: '#1b1c1f', sub: l.id === 'vp' ? 'Phí chỗ 60.000₫/ngày' : 'Hẻm Công Nhân — tự do', subFg: '#c8102e' }, 0, -1, 80);
      spotMark(b, w / 2, 0.95);
      break;
    }
  }
}
/** Vạch sơn vàng đánh dấu chỗ đặt quầy. */
export function spotMark(b: Builder, x: number, z: number) {
  const M = b.marks, c = 0xf5c531, y = 0.135;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    M.quad(x + sx * 1.3 - 0.3, y, z + sz * 0.85 + 0.04, x + sx * 1.3 + 0.3, y, z + sz * 0.85 + 0.04, x + sx * 1.3 + 0.3, y, z + sz * 0.85 - 0.04, x + sx * 1.3 - 0.3, y, z + sz * 0.85 - 0.04, c);
  }
  const [wx, wz] = b.W(x, z); b.world.spotsMark.push({ x: wx, y: 0.13, z: wz, yaw: b.fr.yaw + Math.PI });
}

/** Sạp chợ ngoài trời: bàn hai tầng, mỗi ô một mặt hàng, người bán đứng phía sau. Khách đứng phía -z. */
export function marketStall(b: Builder, shop: string, R: RNG, tarp: number) {
  const D = b.detail, L = b.lit, def = SHOPS[shop];
  D.box(0, 0, -0.33, 4.5, 0.72, 0.62, 0x8a6a4a, 0xa98a62, 0.15); D.box(0, 0, 0.3, 4.5, 0.92, 0.62, 0x7a5c40, 0xa98a62, 0.15);
  b.collide(-2.25, -0.64, 2.25, 0.62);
  const wet = shop === 'm_thit' || shop === 'm_haisan';
  if (wet) { D.box(0, 0.72, -0.33, 4.4, 0.04, 0.58, 0xdfe9ee, 0xeef6fa); D.box(0, 0.92, 0.3, 4.4, 0.04, 0.58, 0xdfe9ee, 0xeef6fa); }
  for (let i = 0; i < def.items.length && i < 10; i++) {
    const row = i < 5 ? 0 : 1, k = i % 5, n = row === 0 ? Math.min(5, def.items.length) : def.items.length - 5;
    const x = (k - (n - 1) / 2) * 0.88;
    display(b, D, shop, i, x, row ? 0.96 : 0.76, row ? 0.3 : -0.33, R);
  }
  for (const sx of [-2.3, 2.3]) for (const sz of [-1.0, 1.9]) L.cyl(sx, 0, sz, 0.035, 2.9, 0x8a8f96, 5);
  L.quad(2.5, 2.55, -1.3, -2.5, 2.55, -1.3, -2.5, 2.95, 2.1, 2.5, 2.95, 2.1, tarp); L.quad(-2.5, 2.54, -1.3, 2.5, 2.54, -1.3, 2.5, 2.94, 2.1, -2.5, 2.94, 2.1, shade(tarp, 0.7));
  b.signAt(0, 2.1, -1.28, 3.4, 0.46, def.name, { bg: '#fff7d6', fg: '#7a0f1e', border: '#c8102e', font: 'hand' }, 0, -1, 56, true);
  b.anchor('v_' + shop, 0, 0.12, 1.35, Math.PI); plasticStool(D, 0.9, 0.12, 1.6, 0xd9463c, 0.36);
  for (let i = 0; i < 3; i++) D.box(-1.7 + i * 0.7, 0.12, 1.75, 0.55, R.range(0.25, 0.5), 0.4, R.pick([0x8fbf6a, 0xd9a05a, 0x6a8ab5, 0xc9b28a]), undefined, 0.15);
  D.box(1.9, 0.92, 0.3, 0.28, 0.06, 0.24, 0x55585e); D.cyl(1.9, 0.98, 0.3, 0.13, 0.02, 0xd9dde2, 8);
  b.collide(-2.2, 1.55, -0.2, 2.0);
}
export { fridgeModel, basketModel, plasticTable };
