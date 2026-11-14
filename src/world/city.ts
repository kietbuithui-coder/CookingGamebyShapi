// Dựng toàn bộ thành phố: mặt đường, vỉa hè, nhà phố, chợ, công viên, gầm cầu, hậu cảnh.
import * as THREE from 'three';
import { Builder, World, shade, mix } from './build';
import { BX, CORR, LOTS, Lot, DEPTH, CURB, ROAD_HALF, faceFrame, Face, MARKET_COLS, SPOTS, BLOCK } from './layout';
import { MB, MAT } from '../gfx/mb';
import { SignAtlas, SignStyle, groundTexture, GroundKind } from '../gfx/tex';
import { RNG, TAU } from '../core/util';
import { buildPlace, marketStall, spotMark } from './places';
import { buildSide } from './side';
import { plasticStool, plasticTable, basketModel, potModel } from '../gfx/props';

const PAL = {
  mid: [0xf2d98c, 0xbfe3d0, 0xf4c7b8, 0xbcd9ee, 0xf3ead2, 0xe8b59a, 0xd9e6a8, 0xe6d0e8, 0xf7e3a8, 0xc8e0e8],
  poor: [0xd9cdb0, 0xc9c2b2, 0xb8c4c0, 0xd6c1a8, 0xc4b79c, 0xcfc6b0, 0xc9d1c4, 0xd9b8a0],
  rich: [0xf7f3ea, 0xefe6d6, 0xe9eef0, 0xf3e9dc, 0xdfe7e2],
  office: [0x9fb6c8, 0xb8c6d2, 0x8aa2b8, 0xc9d3da, 0xa8b8c0, 0xd6dde2],
  ware: [0x8fa3b0, 0xa8b0a8, 0xb0a898, 0x7f93a8, 0x9a9a92],
};
const TRIM = [0xffffff, 0xf7f3ea, 0xe9e2d0], SHUT = [0x3f8a6a, 0x2f6fa8, 0x8a5a3a, 0x6a7a8a, 0xb5653c, 0x4a6a4a, 0x7a4a6a];
const AWN = [0xe2402f, 0x2f8fd5, 0x3fae5a, 0xf08a2f, 0xf5c531, 0x8a5fd0, 0x2fb5a8];
const WARM = [0xffd98a, 0xffc86a, 0xffe9b8, 0xffd98a, 0x9fd0ff], DARKWIN = 0x1c2530;
const BIKE = [0xd9261e, 0x2f6fb5, 0x1e1e22, 0xf3f0e8, 0x3f8a6a, 0xf08a2f];
const SHOP_NAMES = ['Tạp Hoá Thu Hà', 'Sửa Xe Út Hậu', 'Hớt Tóc Thanh', 'Photocopy Minh Anh', 'May Đo Kim Liên', 'Internet Game', 'Điện Thoại Hoàng Phát', 'Tiệm Vàng Kim Thành', 'Giặt Ủi Sạch Thơm',
  'Văn Phòng Phẩm Tri Thức', 'Gạo Sạch Ba Miền', 'Nha Khoa Nụ Cười', 'Hoa Tươi Lan', 'Sửa Khoá Tài', 'Điện Nước Phúc', 'Vé Số Đại Lý 9', 'Thú Cưng Miu Miu', 'Kính Mắt Sài Gòn', 'Áo Cưới Hạnh Phúc',
  'Trà Sữa Mộc', 'Nhà Sách Tuổi Thơ', 'Bánh Kẹo Ngọc Mai', 'Rửa Xe Tân Tiến', 'Spa Hồng Nhung', 'Đồ Chơi Bé Bi', 'Nước Mía 3K', 'Sinh Tố Cô Ba', 'Giày Dép Phú', 'Chụp Hình Thẻ', 'Thuốc Bắc An Hoà'];
const OFFICE_NAMES = ['TÒA NHÀ SAO VIỆT', 'Luật An Phát', 'Phần Mềm Tre Xanh', 'Bảo Hiểm Đại Dương', 'Du Lịch Bốn Mùa', 'Kế Toán Minh Bạch', 'Bất Động Sản Phú Gia', 'Trung Tâm Anh Ngữ'];
const WARE_NAMES = ['KHO VẬN TÂN CẢNG', 'KHO GẠO MIỀN TÂY', 'XƯỞNG CƠ KHÍ HÙNG', 'KHO LẠNH NAM HẢI', 'BÃI XE TẢI 24H'];
const SIGN_ST: SignStyle[] = [
  { bg: '#c8102e', fg: '#ffe14d' }, { bg: '#0b5ea8', fg: '#ffffff' }, { bg: '#ffd400', fg: '#c8102e' }, { bg: '#1e7a3c', fg: '#fff7c2' },
  { bg: '#ffffff', fg: '#c8102e', border: '#c8102e' }, { bg: '#2a2a2e', fg: '#ffcf5a' }, { bg: '#f08a2f', fg: '#ffffff' }, { bg: '#6a1e8a', fg: '#ffe9a8' },
];

function win(b: Builder, x0: number, y0: number, x1: number, y1: number, R: RNG, z = -0.04, lit = 0.55, frame = 0xffffff) {
  // x0 > x1 theo chiều nhìn từ ngoài đường (x cục bộ tăng về bên trái người nhìn)
  b.lit.box((x0 + x1) / 2, y0 - 0.06, z + 0.03, Math.abs(x1 - x0) + 0.14, y1 - y0 + 0.12, 0.05, frame, frame, 0, true);
  const hi = Math.max(x0, x1), lo = Math.min(x0, x1);
  b.glow.quad(hi, y0, z, lo, y0, z, lo, y1, z, hi, y1, z, R.chance(lit) ? R.pick(WARM) : DARKWIN);
}

function house(b: Builder, l: Lot, R: RNG) {
  const w = l.w, d = l.d, st = l.style, L = b.lit, D = b.detail;
  if (st === 'office') return tower(b, l, R);
  if (st === 'ware') return warehouse(b, l, R);
  const rich = st === 'rich', poor = st === 'poor';
  const floors = poor ? R.int(1, 3) : rich ? R.int(3, 5) : R.int(2, 4);
  const gh = 3.3, fh = 3.05, H = gh + (floors - 1) * fh, alc = 1.3;
  const col = R.pick(PAL[st]), trim = R.pick(TRIM), door = R.pick(SHUT);
  L.box(w / 2, gh, d / 2, w - 0.06, Math.max(0.2, H - gh), d, col, shade(col, 0.7), 0, true);
  L.box(w / 2, 0, alc + (d - alc) / 2, w - 0.06, gh, d - alc, shade(col, 0.62), col, 0.2);
  for (const px of [0.2, w - 0.2]) L.box(px, 0, alc / 2, 0.34, gh, alc, col, col, 0.16);
  b.collide(0, alc, w, d); b.collide(0, 0, 0.37, alc); b.collide(w - 0.37, 0, w, alc);
  L.box(w / 2, 0.12, alc / 2, w - 0.7, 0.04, alc, 0xb9b3a6, 0xc9c3b6);                          // bậc thềm
  // tầng trệt
  const kind = rich ? R.pick(['home', 'home', 'garage']) : R.pick(['shop', 'shop', 'shop', 'closed', 'home', 'home']);
  let shop: { name: string; st2: SignStyle; blade: number } | null = null, bal1 = false;
  if (kind === 'shop') {
    for (const y of [0.9, 1.5, 2.1]) { L.box(w / 2, y, alc - 0.16, w - 1.0, 0.04, 0.3, 0x8a6a4a, undefined, 0, true); for (let x = 0.7; x < w - 0.7; x += 0.34) if (R.chance(0.8)) D.box(x, y + 0.04, alc - 0.16, 0.24, R.range(0.12, 0.3), 0.2, R.pick(AWN), undefined, 0.15); }
    D.box(w / 2 + R.range(-0.5, 0.5), 0.16, alc - 0.75, Math.min(2.2, w - 1.6), 0.85, 0.5, R.pick([0x8a6a4a, 0xb9c0c8, 0xd9d2c0]), undefined, 0.15);
    const name = R.pick(SHOP_NAMES), st2 = R.pick(SIGN_ST);
    if (R.chance(0.6)) b.awning(0.3, w - 0.3, gh - 0.5, R.range(1.0, 1.5), R.pick(AWN), R.chance(0.6) ? 0xf7f3e6 : R.pick(AWN), -0.1);
    shop = { name, st2, blade: R.chance(0.3) ? (R.chance(0.5) ? 0.12 : w - 0.12) : 0 };
  } else if (kind === 'closed') {
    const c = R.pick([0x8a9aa8, 0x6a8a9a, 0x9a9a92, 0x5a7a6a]);
    L.box(w / 2, 0.12, 0.42, w - 0.74, 2.75, 0.06, c, c, 0.1); for (let y = 0.4; y < 2.8; y += 0.28) L.box(w / 2, y, 0.38, w - 0.76, 0.03, 0.03, shade(c, 0.8), shade(c, 1.2), 0, true);
    b.collide(0.37, 0.3, w - 0.37, 0.5);
    if (R.chance(0.5)) b.signAt(w / 2, 1.3, 0.36, 1.5, 0.5, R.pick(['CHO THUÊ', 'NGHỈ BÁN', 'SANG QUÁN', 'BÁN NHÀ']), { bg: '#ffffff', fg: '#c8102e', sub: 'ĐT: 09' + R.int(10, 99) + ' ' + R.int(100, 999) + ' ' + R.int(100, 999) }, 0, -1, 56);
  } else {
    const gx = kind === 'garage' ? w / 2 : w * 0.3, gw = kind === 'garage' ? w - 1.6 : 1.0;
    L.box(gx, 0.14, alc - 0.03, gw, kind === 'garage' ? 2.5 : 2.2, 0.06, door, door, 0.12);
    if (kind !== 'garage') { win(b, w * 0.55 + 1.3, 1.0, w * 0.55, 2.3, R, alc - 0.06, 0.5, trim); for (let i = 1; i < 5; i++) D.box(w * 0.55 + i * 0.26, 1.0, alc - 0.1, 0.025, 1.3, 0.025, 0x55585e); }
    for (let x = 0.5; x < w - 0.4; x += 0.22) D.box(x, 0.14, 0.2, 0.03, 1.5, 0.03, 0x3a3d42); L.box(w / 2, 1.64, 0.2, w - 0.7, 0.05, 0.05, 0x3a3d42, undefined, 0, true);
    b.collide(0.37, 0.1, w - 0.37, 0.3);
    if (R.chance(0.7)) b.plant(R.range(0.8, w - 0.8), 0.14, 0.75, R, 1);
  }
  // các tầng trên
  for (let f = 1; f < floors; f++) {
    const y0 = gh + (f - 1) * fh, bal = R.chance(0.78);
    if (f === 1) bal1 = bal;
    if (bal) {
      L.box(w / 2, y0 - 0.02, -0.42, w - 0.36, 0.12, 0.86, trim, trim, 0, true);
      if (rich) { L.box(w / 2, y0 + 0.1, -0.83, w - 0.4, 0.86, 0.04, 0xa8d0e0, 0xdfeef5, 0, true); }
      else if (R.chance(0.5)) L.box(w / 2, y0 + 0.1, -0.83, w - 0.4, 0.8, 0.07, mix(col, 0xffffff, 0.25), trim, 0.1, true);
      else { for (let x = 0.3; x < w - 0.2; x += 0.24) D.box(x, y0 + 0.1, -0.83, 0.028, 0.86, 0.028, 0x3a3d42); L.box(w / 2, y0 + 0.96, -0.83, w - 0.4, 0.05, 0.06, 0x3a3d42, undefined, 0, true); }
      if (R.chance(0.6)) b.plant(R.range(0.6, w - 0.6), y0 + 0.1, -0.55, R, 0.7);
      if (poor && R.chance(0.6)) for (let i = 0; i < 4; i++) { const x = 0.8 + i * (w - 1.6) / 4; D.box(x, y0 + 1.05, -0.6, 0.42, 0.62, 0.02, R.pick(AWN), undefined, 0.1, true); }
    }
    const n = w > 5.2 ? 2 : 1, seg = (w - 0.8) / n;
    for (let i = 0; i < n; i++) {
      const cx = 0.4 + seg * (i + 0.5);
      if (bal && i === 0) win(b, cx + 0.5, y0 + 0.1, cx - 0.5, y0 + 2.25, R, -0.04, 0.5, trim);
      else {
        win(b, cx + 0.65, y0 + 0.95, cx - 0.65, y0 + 2.2, R, -0.04, 0.55, trim);
        if (R.chance(0.55)) for (const s of [-1, 1]) L.box(cx + s * 0.92, y0 + 0.9, -0.07, 0.38, 1.36, 0.05, door, door, 0, true);
      }
    }
    if (R.chance(0.3)) D.box(w - 0.75, y0 + 2.35, -0.2, 0.8, 0.5, 0.32, 0xe6e9ec, 0xd0d4d8, 0.1, true);
  }
  // Biển cửa hàng. Ban công tầng 1 chìa ra 0,85 m ngay ngang tầm biển, nên nếu có ban công thì biển treo ở MẶT TRƯỚC
  // ban công (kiểu nhà phố quen thuộc); không có thì là hộp đèn gắn trên mặt tiền, nhô ra đủ để vượt mép mái hiên.
  if (shop) {
    const zf = bal1 ? -0.86 : -0.02, dep = bal1 ? 0.08 : 0.34, yb = bal1 ? gh - 0.14 : gh - 0.42;
    L.box(w / 2, yb, zf - dep / 2, w - 0.5, 0.78, dep, 0x2a2c30, 0x2a2c30, 0, true);
    b.signAt(w / 2, yb + 0.04, zf - dep - 0.012, w - 0.62, 0.7, shop.name, shop.st2, 0, -1, 64);
    if (shop.blade) {
      // biển dọc chìa ra đường: phải vượt qua ban công nhà mình lẫn nhà bên cạnh thì đi dọc phố mới đọc được
      const sx = shop.blade, zc = -1.32, txt = shop.name.split(' ').slice(0, 3).join(' ');
      L.box(sx, gh + 0.4, zc, 0.08, 2.2, 0.7, 0x2a2c30, 0x2a2c30, 0, true);
      for (const by of [gh + 0.75, gh + 2.2]) L.box(sx, by, -0.48, 0.04, 0.04, 0.98, 0x3a3d42, undefined, 0, true);
      b.signAt(sx - 0.052, gh + 0.45, zc, 0.62, 2.1, txt, { ...shop.st2, vertical: true }, -1, 0, 64, false);
      b.signAt(sx + 0.052, gh + 0.45, zc, 0.62, 2.1, txt, { ...shop.st2, vertical: true }, 1, 0, 64, false);
    }
  }
  // mái
  if (poor && R.chance(0.6)) { L.quad(w, H, -0.3, 0, H, -0.3, 0, H + 1.1, d / 2, w, H + 1.1, d / 2, 0xb5553a); L.quad(0, H, d, w, H, d, w, H + 1.1, d / 2, 0, H + 1.1, d / 2, 0xa24a32); }
  else {
    L.box(w / 2, H, 0.12, w - 0.06, 0.5, 0.18, col, trim, 0, true);
    if (R.chance(0.6)) { D.cyl(w * 0.3, H + 0.8, d * 0.3, 0.45, 1.1, 0xc9d0d6, 8); for (const sx of [-0.3, 0.3]) D.box(w * 0.3 + sx, H, d * 0.3, 0.06, 0.8, 0.06, 0x8a8f96); }
    if (R.chance(0.3)) D.box(w * 0.7, H, d * 0.6, 1.6, 1.9, 2.2, shade(col, 0.9), 0x9aa0a6, 0.1);
  }
  // đồ đạc trước nhà
  if (kind !== 'closed' && R.chance(0.5)) b.bike(R.range(0.9, w - 0.9), -0.55, Math.PI / 2 + R.range(-0.25, 0.25), R.pick(BIKE));
  else if (R.chance(0.35)) b.plant(R.range(0.6, w - 0.6), 0.12, -0.35, R, 1.1);
}

function tower(b: Builder, l: Lot, R: RNG) {
  const w = l.w, d = l.d, L = b.lit, floors = R.int(6, 11), fh = 3.3, gh = 4.0, H = gh + floors * fh, alc = 2.0;
  const col = R.pick(PAL.office), band = R.pick([0xffffff, 0xe9eef2, 0x2f3a52, 0x4a5a6a]);
  L.box(w / 2, gh, d / 2, w - 0.06, H - gh, d, col, shade(col, 0.6), 0, true);
  L.box(w / 2, 0, alc + (d - alc) / 2, w - 0.06, gh, d - alc, 0x2f3a48, col, 0.1);
  for (const px of [0.3, w - 0.3, w / 2]) L.box(px, 0, alc / 2, 0.5, gh, 0.5, band === 0x2f3a52 ? 0xdfe3e6 : band, undefined, 0.1);
  b.collide(0, alc, w, d); b.circle(0.3, alc / 2, 0.36); b.circle(w - 0.3, alc / 2, 0.36); b.circle(w / 2, alc / 2, 0.36);
  for (const s of [0.27, 0.73]) { b.glow.quad(w * s + 1.1, 0.14, alc - 0.02, w * s - 1.1, 0.14, alc - 0.02, w * s - 1.1, 2.8, alc - 0.02, w * s + 1.1, 2.8, alc - 0.02, 0xffe9c0); L.box(w * s, 0.14, alc - 0.05, 0.06, 2.66, 0.04, 0x8a8f96); }
  L.box(w / 2, gh - 0.9, -0.05, w - 1, 0.8, 0.08, 0x2a2c30, 0x2a2c30, 0, true);
  b.signAt(w / 2, gh - 0.86, -0.1, w - 1.2, 0.72, R.pick(OFFICE_NAMES), { bg: R.pick(['#1e2430', '#0b3a6a', '#f3f0e8']), fg: R.pick(['#ffd24d', '#ffffff', '#7fd6ff']) === '#ffffff' ? '#ffffff' : '#ffd24d' }, 0, -1, 72);
  const n = Math.max(3, Math.floor(w / 1.7)), pw = (w - 0.8) / n;
  for (let f = 0; f < floors; f++) {
    const y = gh + f * fh + 0.75;
    L.box(w / 2, gh + f * fh, -0.06, w - 0.06, 0.4, 0.14, band, band, 0, true);
    for (let i = 0; i < n; i++) { const x1 = 0.4 + (i + 1) * pw - 0.08, x0 = 0.4 + i * pw + 0.08; b.glow.quad(x1, y, -0.02, x0, y, -0.02, x0, y + 2.1, -0.02, x1, y + 2.1, -0.02, R.chance(0.45) ? R.pick([0xfff0c8, 0xe9f3ff, 0xffe2a0]) : DARKWIN); }
  }
  L.box(w / 2, H, d / 2, w - 0.06, 0.6, d, band, shade(col, 0.6), 0); b.detail.box(w * 0.3, H + 0.6, d * 0.5, 2, 1.2, 2, 0xb9c0c8, 0x9aa0a6, 0.1);
  if (R.chance(0.5)) b.detail.cyl(w * 0.7, H + 0.6, d * 0.4, 0.04, 5, 0x8a8f96, 4);
  for (const s of [0.15, 0.85]) b.plant(w * s, 0.12, -0.45, R, 1.3);
}

function warehouse(b: Builder, l: Lot, R: RNG) {
  const w = l.w, d = l.d, L = b.lit, D = b.detail, H = R.range(5.8, 7.2), col = R.pick(PAL.ware), dc = R.pick([0x4a6a8a, 0x6a7a6a, 0x8a5a3a, 0x55626c]);
  L.box(w / 2, 0, d / 2, w - 0.06, H, d, col, shade(col, 0.6), 0.14); b.collide(0, 0, w, d);
  for (let x = 0.5; x < w; x += 0.5) L.box(x, 0, -0.01, 0.06, H, 0.03, shade(col, 0.9), undefined, 0.14);
  L.quad(w, H, -0.2, 0, H, -0.2, 0, H + 1.0, d / 2, w, H + 1.0, d / 2, 0x7a8a96); L.quad(0, H, d, w, H, d, w, H + 1.0, d / 2, 0, H + 1.0, d / 2, 0x6a7a86);
  const dw = Math.min(4.6, w - 3);
  L.box(w * 0.45, 0.12, -0.04, dw, 4.0, 0.08, dc, dc, 0.12); for (let y = 0.5; y < 4; y += 0.4) L.box(w * 0.45, y, -0.085, dw, 0.04, 0.02, shade(dc, 0.75), shade(dc, 1.2), 0, true);
  L.box(w - 1.1, 0.12, -0.04, 0.95, 2.1, 0.06, shade(dc, 0.8));
  b.signAt(w / 2, 4.5, -0.06, Math.min(w - 1.5, 7), 0.9, R.pick(WARE_NAMES), { bg: '#f3f0e8', fg: '#1e2430', border: '#1e2430' }, 0, -1, 72);
  for (let i = 0; i < R.int(2, 5); i++) { const x = R.range(0.8, w - 0.8), s = R.range(0.5, 0.9); if (R.chance(0.5)) D.box(x, 0.12, -0.55, s, s, s, R.pick([0xb99a6a, 0xa98a5a, 0x8a7350]), undefined, 0.15); else D.cyl(x, 0.12, -0.5, 0.3, 0.9, R.pick([0x2f6fb5, 0xd9463c, 0x3f8a6a]), 10); b.circle(x, -0.52, 0.42); }
}

function alley(b: Builder, l: Lot, R: RNG) {
  const w = l.w, L = b.lit, D = b.detail;
  L.box(w / 2, 3.0, 0.2, w, 0.5, 0.2, 0x55585e, 0x55585e, 0, true);
  b.signAt(w / 2, 3.03, 0.09, w - 0.3, 0.44, 'HẺM ' + R.int(3, 98), { bg: '#0b5ea8', fg: '#ffffff' }, 0, -1, 48);
  for (let i = 0; i < 4; i++) b.beam(D, 0.1, 4.2 + R.range(0, 2), 1 + i * 2.6, w - 0.1, 4.4 + R.range(0, 2), 1.4 + i * 2.6, 0.012, 0x1b1c1f, 3);
  for (let z = 2; z < DEPTH - 1; z += 2.6) if (R.chance(0.5)) D.box(R.chance(0.5) ? 0.25 : w - 0.25, 0.12, z, 0.3, R.range(0.3, 0.7), 0.5, R.pick([0x8a7350, 0x6a7a8a, 0x4a6a4a]), undefined, 0.2);
  b.world.litter.push(b.W(w / 2, 5), b.W(w / 2 + 0.3, 9));
}

/** Đồ đạc trên vỉa hè quanh một ô phố. */
function sidewalkProps(b: Builder, bx: number, bz: number, R: RNG, dense: boolean) {
  const spans: Record<Face, number> = { N: BLOCK, S: BLOCK, E: BLOCK, W: BLOCK };
  for (const f of ['N', 'S', 'E', 'W'] as Face[]) {
    // khung riêng cho cả cạnh ô phố (kể cả hai góc), z=0 là mép nhà
    const fr = faceFrame(bx, bz, f); b.frame(fr, f === 'E' || f === 'W' ? -DEPTH : 0, 0);
    const lots = LOTS.filter((l) => l.bx === bx && l.bz === bz && l.face === f);
    const clearAt = (x: number) => lots.some((l) => (l.kind === 'spot' || l.kind === 'alley' || l.kind === 'scrap') && x > l.at + (f === 'E' || f === 'W' ? DEPTH : 0) - 1.2 && x < l.at + l.w + (f === 'E' || f === 'W' ? DEPTH : 0) + 1.2);
    // Mặt tiền của một địa chỉ có tên (căn hộ, nhà riêng, tạp hoá…): không trồng cây trước cửa cho khuất biển.
    const shopFront = (x: number) => lots.some((l) => !!l.id && x > l.at + (f === 'E' || f === 'W' ? DEPTH : 0) + 0.8 && x < l.at + l.w + (f === 'E' || f === 'W' ? DEPTH : 0) - 0.8);
    let k = 0;
    for (let x = 3.5; x < spans[f] - 2; x += 5.6, k++) {
      if (clearAt(x)) continue;
      if (k % 4 === 1) b.lamp(x, -2.62, 0, -1);
      else if (k % 4 === 3 && dense) b.pole(x, -2.66, R);
      else {
        // Tán cây thường nằm đúng tầm biển hiệu. Nếu sau cây có biển: trồng cây thân cao (tán trên 4,8 m);
        // biển quá cao (kho, khách sạn, biển dọc) thì chỗ đó để trống.
        if (shopFront(x)) continue;
        const tx = x + R.range(-0.4, 0.4), h = R.range(4.6, 6), top = b.signTopBehind(tx, h * 0.36 + 0.25);
        b.tree(tx, -2.55, R, h, false, true, top > 4.78 ? 'none' : top > 0 ? 'tall' : 'std');
      }
    }
    if (dense) for (let x = 6.5; x < spans[f] - 6; x += 22.4) { /* dây điện giữa các cột */ }
    b.bin(f === 'N' || f === 'S' ? 1.2 : spans[f] - 1.2, -2.5);
    b.world.litter.push(b.W(R.range(4, 20), -1.2), b.W(R.range(24, 42), -2.2), b.W(R.range(10, 36), -0.6));
  }
}

function ground(b: Builder) {
  const G = b.ground, M = b.marks, lo = -128, hi = 128, R = new RNG(5);
  b.frame({ tx: 0, tz: 0, yaw: 0 });
  // lòng đường: dải dọc chạy suốt, dải ngang xen giữa
  for (const c of CORR) G.asphalt.floor(c - ROAD_HALF, lo, c + ROAD_HALF, 92, 0, 0xffffff, 6);
  const xs = [lo, ...CORR.flatMap((c) => [c - ROAD_HALF, c + ROAD_HALF]), hi];
  for (const c of CORR) for (let i = 0; i < xs.length; i += 2) G.asphalt.floor(xs[i], c - ROAD_HALF, xs[i + 1], c + ROAD_HALF, 0, 0xffffff, 6);
  // vỉa hè + lõi ô phố
  for (let bz = 0; bz < 3; bz++) for (let bx = 0; bx < 3; bx++) {
    const [x0, x1] = BX[bx], [z0, z1] = BX[bz], park = bx === 2 && bz === 0, market = bx === 0 && bz === 1;
    G.pave.floor(x0 - 3, z0 - 3, x1 + 3, z0, CURB, 0xffffff, 4); G.pave.floor(x0 - 3, z1, x1 + 3, z1 + 3, CURB, 0xffffff, 4);
    G.pave.floor(x0 - 3, z0, x0, z1, CURB, 0xffffff, 4); G.pave.floor(x1, z0, x1 + 3, z1, CURB, 0xffffff, 4);
    (park ? G.grass : G.concrete).floor(x0, z0, x1, z1, CURB, 0xffffff, park ? 5 : market ? 3 : 4);
    const cb = 0xcfc8ba;
    M.quad(x0 - 3, 0, z0 - 3, x1 + 3, 0, z0 - 3, x1 + 3, CURB, z0 - 3, x0 - 3, CURB, z0 - 3, cb); M.quad(x1 + 3, 0, z1 + 3, x0 - 3, 0, z1 + 3, x0 - 3, CURB, z1 + 3, x1 + 3, CURB, z1 + 3, cb);
    M.quad(x0 - 3, 0, z1 + 3, x0 - 3, 0, z0 - 3, x0 - 3, CURB, z0 - 3, x0 - 3, CURB, z1 + 3, cb); M.quad(x1 + 3, 0, z0 - 3, x1 + 3, 0, z1 + 3, x1 + 3, CURB, z1 + 3, x1 + 3, CURB, z0 - 3, cb);
  }
  // vỉa hè vành ngoài
  const o = 92, e = 96.5;
  G.pave.floor(-e, -e, e, -o, CURB, 0xffffff, 4); G.pave.floor(-e, -o, -o, o, CURB, 0xffffff, 4); G.pave.floor(o, -o, e, o, CURB, 0xffffff, 4);
  G.dirt.floor(lo, 92, hi, 108.4, CURB, 0xffffff, 5);
  G.concrete.floor(lo, -lo * 0 - 128, -e, 92, CURB - 0.002, 0xffffff, 6); G.concrete.floor(e, -128, hi, 92, CURB - 0.002, 0xffffff, 6); G.concrete.floor(-e, -128, e, -e, CURB - 0.002, 0xffffff, 6);
  G.water.floor(lo, 108.4, hi, 150, -0.9, 0xffffff, 9);
  // vạch kẻ đường
  const W = 0xe9e6dc, Y = 0xf5c531, y = 0.012;
  for (const c of CORR) {
    for (let t = -124; t < 124; t += 6) {
      if (CORR.some((k) => Math.abs(t + 1.5 - k) < 8)) continue;
      if (t < 88) M.quad(c - 0.07, y, t + 3, c + 0.07, y, t + 3, c + 0.07, y, t, c - 0.07, y, t, Y);
      M.quad(t, y, c + 0.07, t + 3, y, c + 0.07, t + 3, y, c - 0.07, t, y, c - 0.07, Y);
    }
    // vạch qua đường tại mỗi ngã tư
    for (const k of CORR) for (const s of [-1, 1]) for (let i = -3; i <= 3; i++) {
      const u = k + s * 5.2, v = c + i * 0.95;
      if (u < 92) M.quad(c + i * 0.95 - 0.28, y, u + 0.9, c + i * 0.95 + 0.28, y, u + 0.9, c + i * 0.95 + 0.28, y, u - 0.9, c + i * 0.95 - 0.28, y, u - 0.9, W);
      M.quad(u - 0.9, y, v + 0.28, u + 0.9, y, v + 0.28, u + 0.9, y, v - 0.28, u - 0.9, y, v - 0.28, W);
    }
  }
  // nắp cống, vết vá
  for (let i = 0; i < 40; i++) { const c = R.pick(CORR), t = R.range(-90, 86), s = R.range(0.5, 1.4), h = R.chance(0.5); const x = h ? t : c + R.range(-2.4, 2.4), z = h ? c + R.range(-2.4, 2.4) : t; M.quad(x - s, 0.008, z + s * 0.7, x + s, 0.008, z + s * 0.7, x + s, 0.008, z - s * 0.7, x - s, 0.008, z - s * 0.7, R.pick([0x3a3d44, 0x55585e, 0x44474e])); }
}

function market(b: Builder, R: RNG) {
  const [x0, x1] = BX[0], [z0, z1] = BX[1];
  b.chunk('b01', (x0 + x1) / 2, 0).frame({ tx: 0, tz: 0, yaw: 0 });
  const L = b.lit, D = b.detail;
  // tường rào thấp quanh chợ, chừa cổng
  const fc = 0xe9d9a8, cap = 0xb5553a;
  const fence = (ax: number, az: number, bx2: number, bz2: number) => { b.wall(ax, az, bx2, bz2, 1.25, fc, 0.22); const mx = (ax + bx2) / 2, mz = (az + bz2) / 2; L.box(mx, 1.25, mz, Math.max(0.3, Math.abs(bx2 - ax)), 0.08, Math.max(0.3, Math.abs(bz2 - az)), cap, cap, 0, true); };
  fence(x0 + 0.3, z0 + 0.3, -63, z0 + 0.3); fence(-57, z0 + 0.3, x1 - 0.3, z0 + 0.3);
  fence(x0 + 0.3, z1 - 0.3, -63, z1 - 0.3); fence(-57, z1 - 0.3, x1 - 0.3, z1 - 0.3);
  fence(x1 - 0.3, z0 + 0.3, x1 - 0.3, -4.6); fence(x1 - 0.3, 12.8, x1 - 0.3, z1 - 0.3);
  fence(x0 + 0.3, z0 + 0.3, x0 + 0.3, -13); fence(x0 + 0.3, -2, x0 + 0.3, z1 - 0.3);
  // cổng chính phía Đông
  for (const z of [-4.6, 4.6]) { L.box(x1 - 0.3, 0, z, 0.7, 5.2, 0.7, 0xc8102e, 0xffd24d, 0.1); b.circle(x1 - 0.3, z, 0.5); }
  L.box(x1 - 0.3, 4.3, 0, 0.5, 1.5, 9.9, 0xc8102e, 0xb5553a, 0, true);
  b.signAt(x1 - 0.04, 4.45, 0, 8.6, 1.2, 'CHỢ XÓM CHIỀU', { bg: '#c8102e', fg: '#ffe14d' }, 1, 0, 128); b.signAt(x1 - 0.56, 4.45, 0, 8.6, 1.2, 'CHỢ XÓM CHIỀU', { bg: '#c8102e', fg: '#ffe14d' }, -1, 0, 128);
  for (const [gx, gz, nz] of [[-60, z0 + 0.3, -1], [-60, z1 - 0.3, 1]] as const) { for (const s of [-3, 3]) L.box(gx + s, 0, gz, 0.4, 3.6, 0.4, 0x2f6fb5); L.box(gx, 3.1, gz, 6.4, 0.7, 0.3, 0x2f6fb5, undefined, 0, true); b.signAt(gx, 3.14, gz + nz * 0.16, 5.6, 0.62, 'CHỢ XÓM CHIỀU', { bg: '#2f6fb5', fg: '#ffffff' }, 0, nz, 72); }
  // mái tôn lớn trên cột thép
  const rx0 = -73.5, rx1 = -38.5, rz = 16.2, ry = 4.6, top = 6.3;
  for (const x of [-72, -64, -56, -48, -40]) for (const z of [-15, -5.2, 5.2, 15]) { L.cyl(x, 0, z, 0.11, ry + (Math.abs(z) < 6 ? 1.1 : 0), 0x5a6a7a, 6); b.circle(x, z, 0.16); }
  L.quad(rx0, ry, rz, rx1, ry, rz, rx1, top, 0, rx0, top, 0, 0x7f9ab0); L.quad(rx1, ry, -rz, rx0, ry, -rz, rx0, top, 0, rx1, top, 0, 0x8aa4b8);
  L.quad(rx1, ry - 0.02, rz, rx0, ry - 0.02, rz, rx0, top - 0.02, 0, rx1, top - 0.02, 0, 0x5f7486); L.quad(rx0, ry - 0.02, -rz, rx1, ry - 0.02, -rz, rx1, top - 0.02, 0, rx0, top - 0.02, 0, 0x5f7486);
  for (const x of [-72, -64, -56, -48, -40]) { b.beam(L, x, ry, -15, x, top - 0.1, 0, 0.05, 0x5a6a7a); b.beam(L, x, ry, 15, x, top - 0.1, 0, 0.05, 0x5a6a7a); }
  b.world.roofs.push({ x0: rx0, z0: -rz, x1: rx1, z1: rz });
  for (const x of [-66, -56, -46]) for (const z of [-7, 7]) { b.glow.box(x, ry + 0.4, z, 1.2, 0.06, 0.14, 0xfff2cf, 0xfff2cf, 0, true); b.world.lamps.push([x, ry, z]); }
  b.flags(-72, -15, -40, -15, 4.3, R); b.flags(-72, 15, -40, 15, 4.3, R);
  // các sạp
  const north = ['m_rau', 'm_cu', 'm_trung', 'm_kho'], south = ['m_thit', 'm_haisan', 'm_giavi', 'bakery'], tarps = [0x3fae5a, 0xf08a2f, 0xf5c531, 0x2f8fd5, 0xe2402f, 0x2fb5a8, 0x8a5fd0, 0xd9a05a];
  MARKET_COLS.forEach((x, i) => {
    b.frame({ tx: x, tz: -11.6, yaw: Math.PI }); marketStall(b, north[i], R, tarps[i]);
    b.frame({ tx: x, tz: 11.6, yaw: 0 }); marketStall(b, south[i], R, tarps[i + 4]);
  });
  b.frame({ tx: 0, tz: 0, yaw: 0 });
  // xe tải + bao hàng (việc bốc vác)
  const tx = -79, tz = -8;
  L.box(tx, 0.55, tz - 0.4, 2.3, 2.2, 4.4, 0x3a6a9a, 0x2f5a86, 0.1, true); L.box(tx, 0.55, tz - 3.6, 2.2, 1.7, 1.8, 0xe9e2d0, 0xd9d2c0, 0.08, true);
  b.glow.quad(tx - 0.95, 1.45, tz - 4.51, tx + 0.95, 1.45, tz - 4.51, tx + 0.95, 2.1, tz - 4.51, tx - 0.95, 2.1, tz - 4.51, DARKWIN);
  for (const sx of [-1, 1]) for (const sz of [-3.4, 0.8]) D.rod(tx + sx * 1.05, 0.5, tz + sz, 0.46, 0.3, 0x1e2024, 0, Math.PI / 2, 10);
  b.collide(tx - 1.2, tz - 4.6, tx + 1.2, tz + 1.9);
  for (let i = 0; i < 9; i++) D.box(tx - 0.6 + (i % 3) * 0.62, 0.12 + Math.floor(i / 3) * 0.26, tz + 3.4, 0.58, 0.25, 0.9, i % 2 ? 0xd9cdb0 : 0xc9b890, undefined, 0.12);
  b.collide(tx - 1.0, tz + 2.9, tx + 0.95, tz + 3.9);
  b.frame({ tx: 0, tz: 0, yaw: 0 }); b.anchor('dock', tx + 0.1, 0.9, tz + 4.4, 0); b.anchor('v_dock', -76.6, 0.12, -4.4, 0);
  // bảng tin việc làm ở cổng
  b.frame({ tx: -38.6, tz: -7.2, yaw: -Math.PI / 2 });
  for (const s of [-0.9, 0.9]) L.box(s, 0, 0, 0.1, 2.3, 0.1, 0x6a4a32); L.box(0, 0.9, 0, 2.0, 1.3, 0.08, 0x3f6a4a, 0x6a4a32, 0, true);
  b.signAt(0, 1.85, -0.05, 1.7, 0.3, 'VIỆC LÀM HÔM NAY', { bg: '#ffd400', fg: '#1b1c1f' }, 0, -1, 44);
  for (let i = 0; i < 5; i++) L.box(-0.6 + (i % 3) * 0.6, 1.0 + Math.floor(i / 3) * 0.42, -0.045, 0.42, 0.3, 0.01, R.pick([0xfff7d6, 0xffe2e2, 0xe2f0ff]), undefined, 0, true);
  b.collide(-1, -0.1, 1, 0.1); b.anchor('board', 0, 1.4, -0.3, 0);
  b.frame({ tx: 0, tz: 0, yaw: 0 });
  // thùng, sọt, xe máy lặt vặt
  for (let i = 0; i < 16; i++) { const x = R.range(-80, -40), z = (R.chance(0.5) ? -1 : 1) * R.range(17.5, 21); D.box(x, 0.12, z, R.range(0.5, 0.9), R.range(0.3, 0.7), R.range(0.4, 0.7), R.pick([0xb99a6a, 0x8fbf6a, 0x6a8ab5, 0xd9a05a, 0xc9665a]), undefined, 0.15); b.circle(x, z, 0.45); }
  for (let i = 0; i < 7; i++) b.bike(-37.6, -21 + i * 1.3 + (i > 3 ? 29 : 0) * 0 - (i > 3 ? -30 : 0) * 0, R.range(-0.2, 0.2), R.pick(BIKE));
  for (let i = 0; i < 4; i++) b.bike(-37.6, 15 + i * 1.3, R.range(-0.2, 0.2), R.pick(BIKE));
  for (const [x, z] of [[-78, 10], [-78, 18], [-42, -19], [-50, 19]] as const) b.world.litter.push([x, z]);
  b.bin(-39, 5.4); b.bin(-74.5, 17);
  // chỗ bán "Cổng Chợ"
  const sp = SPOTS.find((s) => s.id === 'cho')!; b.frame({ tx: sp.x, tz: sp.z, yaw: sp.yaw + Math.PI }); spotMark(b, 0, 0);
  b.signAt(-2.2, 1.5, 0.9, 1.5, 0.5, 'CHỖ BÁN HÀNG', { bg: '#ffd400', fg: '#1b1c1f', border: '#1b1c1f', sub: 'Phí chỗ 30.000₫/ngày', subFg: '#c8102e' }, 0, -1, 56, true); L.box(-2.2, 0, 0.9, 0.06, 1.5, 0.06, 0x55585e);
}

function park(b: Builder, R: RNG) {
  const G = b.ground, [x0, x1] = BX[2], [z0, z1] = BX[0], cx = 59, cz = -59;
  b.chunk('b20', cx, cz).frame({ tx: 0, tz: 0, yaw: 0 });
  const L = b.lit, D = b.detail;
  // lối đi chữ thập + vòng quanh hồ
  G.pave.floor(cx - 1.6, z0, cx + 1.6, cz - 7, CURB + 0.004, 0xffffff, 4); G.pave.floor(cx - 1.6, cz + 7, cx + 1.6, z1, CURB + 0.004, 0xffffff, 4);
  G.pave.floor(x0, cz - 1.6, cx - 7, cz + 1.6, CURB + 0.004, 0xffffff, 4); G.pave.floor(cx + 7, cz - 1.6, x1, cz + 1.6, CURB + 0.004, 0xffffff, 4);
  G.pave.floor(cx - 7.5, cz - 7.5, cx + 7.5, cz + 7.5, CURB + 0.004, 0xffffff, 4);
  G.pave.floor(x0, z1 - 6.5, x0 + 9, z1, CURB + 0.004, 0xffffff, 4);
  // hồ nước giữa công viên
  L.cyl(cx, 0.12, cz, 4.6, 0.5, 0xd9d2c0, 20, 4.6, false); L.geo(new THREE.RingGeometry(4.1, 4.75, 20).rotateX(-Math.PI / 2), 1, 1, 1, cx, 0.625, cz, 0xe6e0d0);
  G.water.geo(new THREE.CircleGeometry(4.2, 20).rotateX(-Math.PI / 2), 1, 1, 1, cx, 0.5, cz, 0xffffff);
  L.cyl(cx, 0.12, cz, 0.5, 1.5, 0xc9c2b2, 10, 0.3); L.cyl(cx, 1.6, cz, 0.9, 0.14, 0xd9d2c0, 12, 1.1);
  b.circle(cx, cz, 4.7);
  // hàng rào cây thấp quanh công viên, chừa cổng
  const hedge = (ax: number, az: number, bx2: number, bz2: number) => { const sx = Math.max(0.7, Math.abs(bx2 - ax)), sz = Math.max(0.7, Math.abs(bz2 - az)); L.box((ax + bx2) / 2, 0.12, (az + bz2) / 2, sx, 0.85, sz, 0x3f8a40, 0x5fae4f, 0.2); b.collide((ax + bx2) / 2 - sx / 2, (az + bz2) / 2 - sz / 2, (ax + bx2) / 2 + sx / 2, (az + bz2) / 2 + sz / 2); };
  hedge(x0 + 0.4, z0 + 0.4, x1 - 0.4, z0 + 0.4); hedge(x1 - 0.4, z0 + 0.4, x1 - 0.4, z1 - 0.4);
  hedge(x0 + 9.5, z1 - 0.4, cx - 2.2, z1 - 0.4); hedge(cx + 2.2, z1 - 0.4, x1 - 0.4, z1 - 0.4);
  hedge(x0 + 0.4, z0 + 0.4, x0 + 0.4, cz - 2.2); hedge(x0 + 0.4, cz + 2.2, x0 + 0.4, z1 - 7);
  for (const [gx, gz, ax] of [[cx, z1 - 0.4, 1], [x0 + 0.4, cz, 0]] as const) for (const s of [-2.2, 2.2]) { L.box(gx + (ax ? s : 0), 0, gz + (ax ? 0 : s), 0.5, 2.6, 0.5, 0xe6e0d0, 0xb5553a, 0.1); b.circle(gx + (ax ? s : 0), gz + (ax ? 0 : s), 0.38); }
  L.box(cx, 2.6, z1 - 0.4, 5, 0.6, 0.3, 0x3f8a40, undefined, 0, true); b.signAt(cx, 2.63, z1 - 0.24, 4.6, 0.54, 'CÔNG VIÊN HOA PHƯỢNG', { bg: '#1e7a3c', fg: '#fff7c2' }, 0, 1, 72);
  // cây phượng, bồn hoa
  for (let i = 0; i < 26; i++) {
    const x = R.range(x0 + 3, x1 - 3), z = R.range(z0 + 3, z1 - 3);
    if (Math.abs(x - cx) < 3 || Math.abs(z - cz) < 3 || Math.hypot(x - cx, z - cz) < 9 || (x < x0 + 10 && z > z1 - 8)) continue;
    b.tree(x, z, R, R.range(5.5, 7.5), R.chance(0.6), false);
  }
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.4, x = cx + Math.cos(a) * 10.5, z = cz + Math.sin(a) * 10.5; if (Math.abs(x - cx) < 2.4 || Math.abs(z - cz) < 2.4) continue; L.cyl(x, 0.12, z, 1.2, 0.3, 0xd9d2c0, 10); for (let k = 0; k < 9; k++) D.sph(x + R.range(-0.8, 0.8), 0.5, z + R.range(-0.8, 0.8), 0.22, 0.16, 0.22, R.pick([0xe2402f, 0xf5c531, 0xe86f9a, 0xffffff, 0xf08a2f]), 5); b.circle(x, z, 1.25); }
  // ghế đá (ghế đầu tiên là chỗ ngủ được)
  b.bench(48, -52, Math.PI / 2); b.anchor('bed_ghe', 48, 0.56, -52, -Math.PI / 2);
  b.bench(48, -68, Math.PI / 2); b.bench(70, -68, -Math.PI / 2); b.bench(70, -50, -Math.PI / 2); b.bench(57, -72.5, 0); b.bench(61, -45.5, Math.PI);
  // nhà vệ sinh công cộng + vòi nước
  b.frame({ tx: 76.5, tz: -77, yaw: 0 });
  L.box(0, 0, 0, 4.4, 2.8, 3.2, 0xe9eef2, 0x2f8fd5, 0.1); b.collide(-2.2, -1.6, 2.2, 1.6); L.box(-1, 0.12, 1.62, 0.9, 2.1, 0.05, 0x2f6fb5); L.box(1, 0.12, 1.62, 0.9, 2.1, 0.05, 0xd9467a);
  b.signAt(0, 2.25, 1.63, 2.6, 0.42, 'NHÀ VỆ SINH · TẮM 3.000₫', { bg: '#ffffff', fg: '#0b5ea8', border: '#0b5ea8' }, 0, 1, 48);
  b.anchor('wash_park', 0, 1.2, 2.0, Math.PI);
  L.box(-3.4, 0.12, 1.2, 0.3, 0.9, 0.3, 0x9aa0a6); D.box(-3.4, 0.95, 1.38, 0.05, 0.05, 0.22, 0xd9dde2, undefined, 0, true); L.box(-3.4, 0.12, 1.55, 0.6, 0.18, 0.5, 0xb9b6ae, 0x6a8a9a);
  const [twx, twz] = b.W(-3.4, 1.9); b.world.taps.push({ x: twx, y: 0.95, z: twz, yaw: Math.PI });
  b.frame({ tx: 0, tz: 0, yaw: 0 });
  // sân chơi
  L.box(72, 0.12, -44, 0.12, 2.2, 0.12, 0xe2402f); L.box(75, 0.12, -44, 0.12, 2.2, 0.12, 0xe2402f); L.box(73.5, 2.3, -44, 3.2, 0.1, 0.12, 0xe2402f, undefined, 0, true);
  for (const x of [72.9, 74.1]) { D.box(x - 0.2, 0.7, -44, 0.02, 1.6, 0.02, 0x55585e); D.box(x + 0.2, 0.7, -44, 0.02, 1.6, 0.02, 0x55585e); D.box(x, 0.66, -44, 0.5, 0.04, 0.2, 0xf5c531, undefined, 0, true); }
  L.quad(66, 0.14, -41.5, 67.2, 0.14, -41.5, 67.2, 1.7, -44.5, 66, 1.7, -44.5, 0x2f8fd5); L.box(66.6, 0.12, -45.2, 1.3, 1.6, 1.3, 0xf5c531, 0xe2402f, 0.1); b.collide(65.9, -45.9, 67.3, -41.4);
  // ── vạch xuất phát đua xe đạp, chủ nhật, trên đường phía trước cổng công viên ──
  for (let i = 0; i < 8; i++) for (let k = 0; k < 2; k++) {
    const zx = -33.1 + k * 0.55;
    L.box(41 + (i % 2) * 0.55, 0.135, zx + (Math.floor(i / 2) % 2) * 0.55, 0.52, 0.02, 0.52, (i + k) % 2 ? 0xf7f3e6 : 0xd9463c, undefined, 0, true);
  }
  for (const cz2 of [-32.9, -31.6, -30.3]) { L.cyl(41, 0.12, cz2, 0.16, 0.5, 0xf08a2f, 8, 0.12); L.box(41, 0.34, cz2, 0.3, 0.08, 0.3, 0xf7f3e6, 0xe2402f, 0.02); }
  // bảng đăng ký + hai chiếc xe đạp dựng bên vỉa hè
  L.box(41, 0.12, -34.9, 0.1, 1.7, 0.1, 0x55585e); L.box(43.2, 0.12, -34.9, 0.1, 1.7, 0.1, 0x55585e);
  L.box(42.1, 1.55, -34.9, 2.4, 0.62, 0.08, 0x1e7a3c, 0xf7f3e6, 0.03);
  b.signAt(42.1, 1.55, -34.84, 2.3, 0.58, 'ĐUA XE ĐẠP', { bg: '#1e7a3c', fg: '#fff7c2', sub: 'Chủ nhật 15h · đăng ký tại đây', subFg: '#d9ffe6' }, 0, 1, 64);
  b.signAt(42.1, 1.55, -34.96, 2.3, 0.58, 'ĐUA XE ĐẠP', { bg: '#1e7a3c', fg: '#fff7c2', sub: 'Chủ nhật 15h · ba vòng quanh công viên', subFg: '#d9ffe6' }, 0, -1, 60);
  b.anchor('dua_xe', 41, 0.13, -34.1, 0);
  b.anchor('v_dua', 42.6, 0.13, -34.2, -0.4);
  // ── xích đu ở sân chơi ──
  b.signAt(73.5, 1.28, -44.9, 1.5, 0.42, 'XÍCH ĐU', { bg: '#f5c531', fg: '#8a3410', border: '#e2402f' }, 0, 1, 48);
  b.anchor('xich_du', 73.5, 0.13, -43.2, Math.PI);
  for (const p of [[44, -44], [52, -76], [74, -62], [64, -52], [50, -62], [68, -74], [56, -42]] as const) b.world.litter.push([p[0], p[1]]);
  b.bin(57, -38.5); b.bin(38.6, -57); b.bin(63, -66.5);
  for (const [x, z] of [[cx - 3, z1 - 3], [cx + 3, z0 + 12], [x0 + 12, cz + 3], [x1 - 12, cz - 3], [cx + 8.5, cz + 8.5], [cx - 8.5, cz - 8.5]] as const) b.lamp(x, z, 0.4, 0.4);
  // chỗ bán "Cổng Công Viên"
  const sp = SPOTS.find((s) => s.id === 'cv')!; b.frame({ tx: sp.x, tz: sp.z, yaw: sp.yaw + Math.PI }); spotMark(b, 0, 0);
  b.signAt(2.4, 1.5, 0.8, 1.5, 0.5, 'CHỖ BÁN HÀNG', { bg: '#ffd400', fg: '#1b1c1f', border: '#1b1c1f', sub: 'Phí chỗ 20.000₫/ngày', subFg: '#c8102e' }, 0, -1, 56, true); L.box(2.4, 0, 0.8, 0.06, 1.5, 0.06, 0x55585e);
  // dây cờ lễ hội (chỉ hiện khi có lễ hội)
  b.frame({ tx: 0, tz: 0, yaw: 0 });
  const F = b.festive, keep = b.detail; (b as any).detail = F;
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; b.flags(cx, cz, cx + Math.cos(a) * 19, cz + Math.sin(a) * 19, 5.2, R); }
  b.flags(cx - 12, z1 - 1, cx + 12, z1 - 1, 4.2, R); b.flags(x0 + 1, cz - 12, x0 + 1, cz + 12, 4.2, R);
  for (let i = 0; i < 5; i++) { const x = 44 + i * 7.5, z = -40.5; F.box(x, 0.12, z, 2.2, 0.8, 1.0, [0xe2402f, 0x2f8fd5, 0xf5c531, 0x3fae5a, 0xe86f9a][i], 0xf7f3e6, 0.1); F.quad(x + 1.3, 2.2, z - 0.8, x - 1.3, 2.2, z - 0.8, x - 1.3, 2.7, z + 0.8, x + 1.3, 2.7, z + 0.8, [0xf5c531, 0xe2402f, 0x3fae5a, 0xe86f9a, 0x2f8fd5][i]); for (const s of [-1.2, 1.2]) F.box(x + s, 0.12, z + 0.7, 0.05, 2.5, 0.05, 0x8a8f96); }
  (b as any).detail = keep;
}

function underpass(b: Builder, R: RNG) {
  b.chunk('south', 0, 100).frame({ tx: 0, tz: 0, yaw: 0 });
  const L = b.lit, D = b.detail;
  // cầu vượt
  const y = 7.2, c = 0xa9a6a0;
  L.box(0, y, 101, 262, 1.3, 11, c, 0x55585e, 0.1, true);
  for (const z of [95.6, 106.4]) L.box(0, y + 1.3, z, 262, 0.9, 0.3, 0xbfbcb4, 0xcfccc4, 0, true);
  for (let x = -121; x <= 121; x += 22) { L.box(x, 0, 101, 1.8, y, 2.4, c, c, 0.2); L.box(x, y - 0.9, 101, 2.6, 0.9, 9.6, shade(c, 0.92), c, 0, true); b.collide(x - 0.9, 99.8, x + 0.9, 102.2); if (Math.abs(x) < 100) for (let i = 0; i < 3; i++) L.box(x + R.range(-0.7, 0.7), R.range(0.6, 1.8), 99.79 - i * 0.012, R.range(0.4, 0.8), R.range(0.3, 0.6), 0.02 + i * 0.024, R.pick([0xe2402f, 0x2f8fd5, 0xf5c531, 0x3fae5a, 0xf3f0e8]), undefined, 0, true); }
  b.world.roofs.push({ x0: -130, z0: 95.5, x1: 130, z1: 106.6 });
  for (let x = -110; x <= 110; x += 22) { D.cyl(x + 11, y + 2.2, 96.2, 0.07, 4.5, 0x6a7078, 5); b.glow.box(x + 11, y + 6.6, 97, 0.5, 0.12, 1.2, 0xfff2cf, 0xdfe3e6, 0, true); }
  // tường chắn + lan can phía kênh
  L.box(0, 0, 108.2, 262, 1.0, 0.4, 0x9a968e, 0xb0aca4, 0.15); b.collide(-131, 108, 131, 109);
  for (let x = -128; x < 128; x += 2.4) D.box(x, 1.0, 108.2, 0.06, 0.7, 0.06, 0x55585e); L.box(0, 1.7, 108.2, 262, 0.06, 0.08, 0x55585e, undefined, 0, true);
  // lều của người chơi
  b.frame({ tx: 49, tz: 101.5, yaw: Math.PI });
  D.box(0, 0.12, 0.6, 1.0, 0.07, 2.0, 0xb99a6a, 0xc9aa7a, 0.1); D.box(0, 0.19, 1.25, 0.6, 0.08, 0.36, 0x8a7a9a); D.box(0, 0.19, 0.3, 0.9, 0.04, 1.2, 0x6a7a8a, 0x7a8a9a);
  b.anchor('bed_gamcau', 0, 0.3, 0.6, Math.PI);
  L.quad(-1.5, 0.12, 2.0, 1.5, 0.12, 2.0, 1.5, 1.7, 0.4, -1.5, 1.7, 0.4, 0x2f6fa8); L.quad(1.5, 0.12, 2.0, -1.5, 0.12, 2.0, -1.5, 1.7, 0.4, 1.5, 1.7, 0.4, 0x3f7fb8);
  for (const s of [-1.5, 1.5]) D.box(s, 0.12, 0.4, 0.05, 1.6, 0.05, 0x8a6a3a);
  D.box(1.9, 0.12, 0.9, 0.7, 0.5, 0.5, 0xb99a6a, 0x8a7350, 0.15); D.box(1.9, 0.62, 0.9, 0.74, 0.03, 0.54, 0xa98a5a, undefined, 0, true); b.collide(1.5, 0.6, 2.3, 1.2); b.anchor('store_gamcau', 1.9, 0.7, 0.9, Math.PI);
  D.cyl(-1.6, 0.12, -1.0, 0.3, 0.75, 0x55585e, 10); D.cyl(-1.6, 0.8, -1.0, 0.27, 0.06, 0x1c1614, 10); b.circle(-1.6, -1.0, 0.34); b.anchor('fire_gamcau', -1.6, 0.9, -1.0, 0);
  plasticStool(D, -0.7, 0.12, -1.3, 0x2f8fd5, 0.36);
  for (let i = 0; i < 5; i++) D.box(R.range(-3.5, 3.5), 0.12, R.range(2.4, 3.4), R.range(0.3, 0.6), R.range(0.1, 0.4), R.range(0.3, 0.5), R.pick([0xb99a6a, 0x6a7a8a, 0x8a8a84]), undefined, 0.2);
  // hàng xóm: ông Bảy lang thang
  b.frame({ tx: -8, tz: 100.5, yaw: Math.PI });
  D.box(0, 0.12, 0.6, 1.0, 0.07, 2.0, 0xa98a5a); L.quad(-1.4, 0.12, 1.9, 1.4, 0.12, 1.9, 1.4, 1.6, 0.4, -1.4, 1.6, 0.4, 0x6a8a4a); L.quad(1.4, 0.12, 1.9, -1.4, 0.12, 1.9, -1.4, 1.6, 0.4, 1.4, 1.6, 0.4, 0x7a9a5a);
  D.cyl(1.6, 0.12, -0.8, 0.3, 0.75, 0x6a4a32, 10); b.circle(1.6, -0.8, 0.34); for (let i = 0; i < 6; i++) D.sph(-1.8 + R.range(-0.4, 0.4), 0.3, 0.6 + R.range(-0.4, 0.4), 0.28, 0.22, 0.28, R.pick([0xbfe3f2, 0xdfe6ea, 0x2a2c30]), 5);
  b.anchor('v_hobo', 0.4, 0.12, -0.9, Math.PI);
  b.frame({ tx: 0, tz: 0, yaw: 0 });
  for (let i = 0; i < 26; i++) { const x = R.range(-90, 90), z = R.range(94.5, 107); if (Math.abs(x - 49) < 6 || Math.abs(x + 8) < 5) continue; if (R.chance(0.5)) D.box(x, 0.12, z, R.range(0.3, 1), R.range(0.1, 0.5), R.range(0.3, 0.8), R.pick([0x8a8a84, 0xb99a6a, 0x6a6258, 0x4a5a6a]), undefined, 0.2); else D.rod(x, 0.42, z, 0.4, 0.22, 0x1e2024, Math.PI / 2 + R.range(-0.2, 0.2), 0, 9); b.world.litter.push([x + 0.9, z + 0.3]); }
  for (const x of [-60, -20, 20, 70]) b.bin(x, 94.2);
  // bờ kênh bên kia
  L.box(0, -1, 152, 300, 1.3, 4, 0x8a8a84, 0x9a9a92);
}

function yards(b: Builder, R: RNG) {
  for (const [bx, bz] of [[1, 1], [0, 2], [1, 2]] as const) {
    const cx = (BX[bx][0] + BX[bx][1]) / 2, cz = (BX[bz][0] + BX[bz][1]) / 2;
    b.chunk(`b${bx}${bz}`, cx, cz).frame({ tx: cx, tz: cz, yaw: 0 });
    const L = b.lit, D = b.detail;
    for (let i = 0; i < 4; i++) b.beam(D, -12, 3.2 + i * 0.5, -10 + i * 6, 12, 3.4 + i * 0.4, -8 + i * 6, 0.012, 0x1b1c1f, 3);
    for (let i = 0; i < 9; i++) D.box(-9 + i * 2.1, 2.5, -9.4 + (i % 2) * 0.4, 0.7, 0.75, 0.02, R.pick(AWN), undefined, 0.1, true);
    for (let i = 0; i < 6; i++) { const x = R.range(-10, 10), z = R.range(-10, 10); if (Math.hypot(x, z) < 4) continue; b.world.litter.push(b.W(x, z)); }
    if (bx === 0) {
      // sào huyệt của Hùng Sẹo
      for (const [sx, sz] of [[-2, -1.6], [2, -1.6], [-2, 1.6], [2, 1.6]] as const) L.cyl(sx, 0, sz, 0.05, 2.7, 0x55585e, 5);
      L.quad(2.3, 2.6, -1.9, -2.3, 2.6, -1.9, -2.3, 2.9, 1.9, 2.3, 2.9, 1.9, 0x3a3d42); L.quad(-2.3, 2.59, -1.9, 2.3, 2.59, -1.9, 2.3, 2.89, 1.9, -2.3, 2.89, 1.9, 0x24262a);
      plasticTable(D, 0, 0.12, 0, 0x3a3d42); for (const [sx, sz] of [[0.75, 0], [-0.75, 0], [0, 0.75]] as const) plasticStool(D, sx, 0.12, sz, 0xd9463c);
      b.collide(-0.4, -0.4, 0.4, 0.4); b.anchor('v_shark', 0, 0.12, -0.95, Math.PI); b.world.roofs.push({ x0: cx - 2.3, z0: cz - 1.9, x1: cx + 2.3, z1: cz + 1.9 });
      for (let i = 0; i < 3; i++) b.bike(-5 + i * 1.2, 4, R.range(-0.2, 0.2), R.pick([0x1e1e22, 0xd9261e]));
      b.signAt(0, 1.9, -1.88, 2.6, 0.5, 'CHO VAY NÓNG — KHÔNG CẦN GIẤY TỜ', { bg: '#1b1c1f', fg: '#ff4d4d' }, 0, -1, 48);
    } else if (bx === 1 && bz === 1) {
      b.tree(0, 0, R, 7, false, true); for (let i = 0; i < 4; i++) b.bench(Math.cos(i * TAU / 4) * 2.6, Math.sin(i * TAU / 4) * 2.6, -i * TAU / 4 + Math.PI / 2);
      L.box(8, 0.12, -9, 1.2, 1.6, 0.9, 0xc8102e, 0xffd24d, 0.1); b.collide(7.4, -9.5, 8.6, -8.5); for (let i = 0; i < 4; i++) b.bike(-9 + i * 1.2, 8.5, R.range(-0.2, 0.2), R.pick(BIKE));
    } else {
      for (let i = 0; i < 7; i++) b.bike(-9 + i * 1.3, -7, Math.PI + R.range(-0.2, 0.2), R.pick(BIKE));
      b.tree(6, 5, R, 6.5, false, true); plasticTable(D, -5, 0.12, 6); for (const s of [-0.8, 0.8]) plasticStool(D, -5 + s, 0.12, 6, 0x2f8fd5); b.collide(-5.4, 5.6, -4.6, 6.4);
    }
    b.bin(-10.5, 10.5); b.lamp(10.5, -10.5, -0.5, 0.5);
  }
}

function backdrop(b: Builder, R: RNG) {
  b.chunk('edge', 0, 0).frame({ tx: 0, tz: 0, yaw: 0 });
  const L = b.lit;
  const gaps = CORR.map((c) => [c - 6.5, c + 6.5]);
  const inGap = (a: number, c: number) => gaps.some(([g0, g1]) => c > g0 && a < g1);
  const row = (side: 'N' | 'W' | 'E', off: number, depth: number, hmin: number, hmax: number) => {
    for (let t = -128; t < 128;) {
      const w = R.range(8, 16);
      if (inGap(t, t + w)) { t += 2; continue; }
      const h = R.range(hmin, hmax), col = R.pick([...PAL.mid, ...PAL.office, ...PAL.poor]), m = t + w / 2;
      if (side === 'N') L.box(m, 0, -off - depth / 2, w - 0.1, h, depth, col, shade(col, 0.6), 0.12); else L.box((side === 'W' ? -1 : 1) * (off + depth / 2), 0, m, depth, h, w - 0.1, col, shade(col, 0.6), 0.12);
      if (off < 100) for (let f = 0; f < Math.floor(h / 3.2) - 1; f++) for (let i = 0; i < Math.floor(w / 2.4); i++) {
        if (R.chance(0.25)) continue;
        const u = t + 1.2 + i * 2.4, y = 3.6 + f * 3.2, cc = R.chance(0.45) ? R.pick(WARM) : DARKWIN;
        if (side === 'N') b.glow.quad(u, y, -off + 0.02, u + 1.2, y, -off + 0.02, u + 1.2, y + 1.5, -off + 0.02, u, y + 1.5, -off + 0.02, cc);
        else if (side === 'W') b.glow.quad(-off + 0.02, y, u + 1.2, -off + 0.02, y, u, -off + 0.02, y + 1.5, u, -off + 0.02, y + 1.5, u + 1.2, cc);
        else b.glow.quad(off - 0.02, y, u, off - 0.02, y, u + 1.2, off - 0.02, y + 1.5, u + 1.2, off - 0.02, y + 1.5, u, cc);
      }
      t += w;
    }
  };
  for (const s of ['N', 'W', 'E'] as const) { row(s, 96.5, 13, 9, 24); row(s, 110, 16, 16, 38); }
  // chặn tầm nhìn cuối các con đường
  for (const c of CORR) { L.box(c, 0, -136, 22, R.range(20, 34), 8, R.pick(PAL.office), undefined, 0.15); L.box(-136, 0, c, 8, R.range(20, 34), 22, R.pick(PAL.office), undefined, 0.15); L.box(136, 0, c, 8, R.range(20, 34), 22, R.pick(PAL.office), undefined, 0.15); }
  // nhà bên kia kênh (phía Nam)
  for (let t = -150; t < 150;) { const w = R.range(10, 20), h = R.range(8, 30), col = R.pick([...PAL.mid, ...PAL.office]); L.box(t + w / 2, -1, 160, w - 0.2, h, 12, col, shade(col, 0.6), 0.12);
    for (let f = 0; f < Math.floor(h / 3.4) - 1; f++) for (let i = 0; i < Math.floor(w / 2.6); i++) if (R.chance(0.6)) { const u = t + 1.2 + i * 2.6, yy = 3 + f * 3.4; b.glow.quad(u + 1.3, yy, 153.98, u, yy, 153.98, u, yy + 1.6, 153.98, u + 1.3, yy + 1.6, 153.98, R.chance(0.5) ? R.pick(WARM) : DARKWIN); }
    t += w; }
  // trụ chặn xe ở rìa bản đồ
  for (const c of CORR) for (let i = -3; i <= 3; i++) { L.cyl(c + i * 1.1, 0, -96, 0.11, 0.8, 0xf5c531, 6); L.cyl(-96, 0, c + i * 1.1, 0.11, 0.8, 0xf5c531, 6); L.cyl(96, 0, c + i * 1.1, 0.11, 0.8, 0xf5c531, 6); }
}

export interface City {
  world: World; root: THREE.Group; chunks: { id: string; cx: number; cz: number; detail?: THREE.Mesh; group: THREE.Group }[];
  glowMat: THREE.MeshLambertMaterial; unlitMat: THREE.MeshBasicMaterial; signMat: THREE.MeshLambertMaterial; water: THREE.Texture;
  festive: THREE.Mesh; roadblock: THREE.Mesh; night: { value: number };
}

export function buildCity(): City {
  const world = new World(), atlas = new SignAtlas(2048), b = new Builder(world, atlas), R = new RNG(77);
  world.lots = LOTS;
  ground(b);
  for (let bz = 0; bz < 3; bz++) for (let bx = 0; bx < 3; bx++) {
    const cx = (BX[bx][0] + BX[bx][1]) / 2, cz = (BX[bz][0] + BX[bz][1]) / 2;
    b.chunk(`b${bx}${bz}`, cx, cz);
    for (const l of LOTS) {
      if (l.bx !== bx || l.bz !== bz) continue;
      const LR = new RNG(l.seed);
      b.frame(l.fr, l.at, 0);
      if (l.kind === 'house' || l.kind === 'tower' || l.kind === 'apartment') house(b, l, LR);
      else if (l.kind === 'alley') alley(b, l, LR);
      else buildPlace(b, l, LR);
    }
    if (!(bx === 2 && bz === 0) && !(bx === 0 && bz === 1)) sidewalkProps(b, bx, bz, new RNG(bx * 31 + bz * 7 + 3), BLOCK_DENSE[bz][bx]);
  }
  market(b, new RNG(41)); park(b, new RNG(42)); underpass(b, new RNG(43)); yards(b, new RNG(44));
  buildSide(b);                                          // góc trà đá, sân nhảy, vá xe, hát rong, bàn cờ, đánh giày
  backdrop(b, new RNG(45));
  // rào chắn "cấm đường" trước chợ (chỉ hiện khi có sự kiện)
  b.frame({ tx: 0, tz: 0, yaw: 0 }); const keepLit = b.lit; (b as any).lit = b.roadblock;
  for (const z of [-25, 25]) for (let i = 0; i < 3; i++) { const x = -32 + i * 2.5; for (let k = 0; k < 2; k++) b.roadblock.box(x, 0.45 + k * 0.36, z, 2.2, 0.2, 0.12, k ? 0xe5482f : 0xf3f0e8, undefined, 0, true); for (const s of [-1, 1]) b.roadblock.box(x + s, 0, z, 0.1, 1.0, 0.1, 0x555a60); }
  (b as any).lit = keepLit;

  // ───── tạo lưới Three.js ─────
  const root = new THREE.Group(); root.name = 'city';
  const night = { value: 0 };
  const glowMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  glowMat.onBeforeCompile = (sh) => {
    sh.uniforms.uNight = night;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uNight;')
      .replace('#include <color_fragment>', 'vec3 nightCol = vColor.rgb;\n float lum = dot(nightCol, vec3(0.3, 0.5, 0.2));\n diffuseColor.rgb = mix(vec3(0.17, 0.24, 0.32) + nightCol * 0.12, nightCol * 0.55, uNight);')
      .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance = nightCol * smoothstep(0.02, 0.2, lum) * uNight * 1.25;');
  };
  const unlitMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const signMat = new THREE.MeshLambertMaterial({ map: atlas.texture, emissive: 0xffffff, emissiveMap: atlas.texture, emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 });
  const mk = (mb: MB, mat: THREE.Material, name: string, parent: THREE.Object3D, shadow = 0) => {
    if (!mb.count) return undefined;
    const m = new THREE.Mesh(mb.build(), mat); m.name = name; m.matrixAutoUpdate = false; m.castShadow = shadow > 1; m.receiveShadow = shadow > 0; parent.add(m); mb.clear(); return m;
  };
  const kinds = Object.keys(b.ground) as GroundKind[];
  let water!: THREE.Texture;
  for (const k of kinds) {
    const t = groundTexture(k); if (k === 'water') water = t;
    const mat = new THREE.MeshLambertMaterial({ map: t, vertexColors: true });
    if (k !== 'asphalt' && k !== 'water') { mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -1; }
    mk(b.ground[k], mat, 'ground_' + k, root, 1);
  }
  const marksMat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  mk(b.marks, marksMat, 'marks', root, 1);
  const tileMat = new THREE.MeshBasicMaterial({ map: groundTexture('tile'), vertexColors: true });
  const chunks: City['chunks'] = [];
  for (const c of b.chunks.values()) {
    const g = new THREE.Group(); g.name = c.id; root.add(g);
    mk(c.lit, MAT.lit, 'lit', g, 2); mk(c.glow, glowMat, 'glow', g); mk(c.unlit, unlitMat, 'unlit', g); mk(c.sign, signMat, 'sign', g); mk(c.tileIn, tileMat, 'tile', g);
    const detail = mk(c.detail, MAT.lit, 'detail', g, 2);
    chunks.push({ id: c.id, cx: c.cx, cz: c.cz, detail, group: g });
  }
  const festive = mk(b.festive, MAT.litDouble, 'festive', root)!; festive.visible = false;
  const roadblock = mk(b.roadblock, MAT.lit, 'roadblock', root)!; roadblock.visible = false;
  atlas.texture.needsUpdate = true;
  return { world, root, chunks, glowMat, unlitMat, signMat, water, festive, roadblock, night };
}
const BLOCK_DENSE = [[false, false, false], [true, true, true], [true, true, true]];
export { CURB };
