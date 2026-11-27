// ───────── NƯỚC MÍA (lượt 69) ─────────
// Người chơi yêu cầu hai chỗ:
//  1. MỘT XE NƯỚC MÍA dựng trong Chợ Xóm Chiều, ở vị trí hợp lí, "xe phải nhìn ổn": có cần ép, ly, ghế
//     nhựa quanh xe…;
//  2. MỘT QUÁN NƯỚC MÍA có sẵn trên phố (biển "Nước Mía 3K" vốn đã nằm trong danh sách tên tiệm ngẫu nhiên
//     của `city.ts` mà chưa có chỗ nào tương tác được) ⇒ nay dựng hẳn ở Phố Trung Tâm, bán được.
//
// Tệp này chỉ DỰNG CẢNH (đồ hoạ + va chạm + neo). Toạ độ lấy từ `world/layout.ts` (`MIA_SPOTS`), luật bán
// và tiền công nằm ở `sim/rules.ts`, chữ nghĩa ở `game/acts.ts`. Dựng bằng đúng những mảnh đồ có sẵn trong
// dự án (MB của `gfx/mb`, ghế nhựa/bàn nhựa của `gfx/props`) nên không thêm hình khối lạ nào.
import { Builder } from './build';
import { plasticStool, plasticTable } from '../gfx/props';
import { MIA_SPOTS } from './layout';

const STEEL = 0x9aa0a6, STEEL_D = 0x6a7078, RUBBER = 0x2a2c30;
const CANE = 0x9fb84a, CANE_D = 0x7a9a2f, JUICE = 0xc8d96a, ICE = 0xd0ecf7;
const RED = 0xd9463c, BLUE = 0x2f8fd5, YELLOW = 0xf5c531;

/**
 * Cái máy ép mía: bệ gỗ + mô-tơ + hai bánh răng ép + máng hứng nước + cần quay.
 * Quay theo trục `yaw` của khung đang vẽ: người bán đứng phía +z, khách đứng phía −z.
 */
function canePress(b: Builder, x: number, y: number, z: number, yaw: number) {
  const D = b.detail, L = b.lit, U = b.unlit;
  b.sub(x, z, yaw, () => {
    // bệ gỗ kê máy
    L.box(0, y, 0, 1.24, 0.62, 0.86, 0x8a6a4a, 0xa98a62, 0.12);
    b.collide(-0.64, -0.45, 0.64, 0.45, 0.72);
    // mô-tơ + vỏ máy inox
    U.box(0, y + 0.78, 0.02, 1.0, 0.42, 0.62, STEEL, 0xc9ced4, 0.06, true);
    U.cyl(-0.42, y + 0.99, 0.02, 0.16, 0.3, 0x3a6a9a, 10, 0.16);
    for (let i = 0; i < 5; i++) U.box(-0.42, y + 0.86 + i * 0.045, -0.13, 0.22, 0.02, 0.02, STEEL_D);
    // hai trục ép (bánh răng) nhô lên trên vỏ máy — đây là chỗ nhìn ra "máy ép mía" ngay
    for (const sz of [-0.13, 0.13]) {
      U.cyl(0.16, y + 1.02, sz, 0.13, 0.34, 0xb9c0c6, 12, 0.13);
      U.cyl(0.16, y + 0.95, sz, 0.155, 0.04, STEEL_D, 12);
      U.cyl(0.16, y + 1.09, sz, 0.155, 0.04, STEEL_D, 12);
    }
    // máng hứng nước mía chảy xuống xô
    U.box(0.16, y + 0.74, -0.34, 0.3, 0.05, 0.26, STEEL, 0xd9dee3, 0.02);
    // cần quay (tay quay) bên hông máy
    U.rod(-0.56, y + 0.86, -0.26, 0.026, 0.34, STEEL_D, 0, Math.PI / 2, 6);
    U.rod(-0.56, y + 0.7, -0.26, 0.022, 0.3, 0x8a6a4a, Math.PI / 2, 0, 6);
    // xô nước mía hứng dưới máng + ít bọt
    U.cyl(0.2, y + 0.34, -0.34, 0.19, 0.32, 0xb9c0c6, 12, 0.19);
    D.cyl(0.2, y + 0.66, -0.34, 0.17, 0.02, JUICE, 12);
  });
}

/** Dãy mía dựng nghiêng trong ống/bó tre: nhìn là biết quán có mía tươi. */
function caneBundle(b: Builder, x: number, z: number, yaw: number, n = 7) {
  const D = b.detail, U = b.unlit;
  b.sub(x, z, yaw, () => {
    D.cyl(0, 0, 0, 0.24, 0.5, 0x8a6a4a, 10, 0.02, false);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = 0.1;
      const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
      // thân mía nghiêng ra ngoài, cao 1,3 m
      const tilt = 0.16;
      U.rod(cx, 0.12, cz, 0.042, 1.3, i % 3 === 0 ? CANE_D : CANE, Math.sin(a) * tilt, Math.cos(a) * tilt, 6);
      D.cyl(cx + Math.sin(a) * tilt * 0.5, 1.22, cz + Math.cos(a) * tilt * 0.5, 0.046, 0.05, 0x8a6a4a, 6);
    }
    // dây buộc hai vòng
    for (const hy of [0.42, 0.86]) D.cyl(0, hy, 0, 0.2, 0.035, 0x6a5a3a, 12, 0.2, false);
    b.circle(x, z, 0.3, 1.3);
  });
}

/**
 * XE NƯỚC MÍA Ở CHỢ XÓM CHIỀU — dựng ở lối đi giữa chợ, cạnh cột mái tôn, đủ chỗ cho khách đứng uống.
 * Xe kiểu xe đẩy sắt: máy ép trên thùng xe, thùng đá bên cạnh, ly nhựa xếp sẵn, ghế nhựa quây quanh,
 * dù che nắng, biển hiệu "NƯỚC MÍA 3.000₫".
 */
export function buildMiaCart(b: Builder) {
  const s = MIA_SPOTS.cart, D = b.detail, L = b.lit, U = b.unlit;
  b.chunk('b01', s.x, s.z);
  b.frame({ tx: s.x, tz: s.z, yaw: s.yaw });
  // ── khung xe đẩy: thùng sắt sơn xanh, bốn bánh xe nhỏ, tay đẩy ──
  L.box(0, 0.12, 0, 2.0, 0.86, 1.0, 0x2f6fa8, 0x3a7fbc, 0.12);
  b.collide(-1.0, -0.5, 1.0, 0.5, 0.98);
  for (const sx of [-0.82, 0.82]) for (const sz of [-0.34, 0.34]) {
    D.rod(sx, 0.2, sz, 0.16, 0.06, RUBBER, 0, Math.PI / 2, 10);
    D.cyl(sx, 0.2, sz, 0.05, 0.02, STEEL, 8);
  }
  // mặt bàn inox trên thùng xe
  L.box(0, 1.0, 0, 2.06, 0.06, 1.06, 0xc9ced4, 0xeef1f4, 0.04);
  // tay đẩy hai bên (hai ống sắt uốn)
  for (const sx of [-0.97, 0.97]) { D.rod(sx, 1.02, 0.42, 0.03, 0.62, STEEL_D, 0, 0, 6); D.rod(sx, 1.62, 0.42, 0.03, 0.5, STEEL_D, 0, Math.PI / 2, 6); }
  // ── máy ép đặt trên thùng xe (quay ra phía khách −z) ──
  canePress(b, 0.42, 1.06, 0.02, 0);
  // ── thùng xốp đá + xô nước mía thành phẩm ──
  D.box(-0.62, 1.06, 0.06, 0.62, 0.34, 0.56, 0xf3f0e8, 0xdfe9f7, 0.06, true);
  D.cyl(-0.62, 1.44, 0.06, 0.2, 0.1, ICE, 12, 0.2, false);
  for (let i = 0; i < 4; i++) D.box(-0.86 + (i % 2) * 0.5, 1.44, -0.06 + Math.floor(i / 2) * 0.26, 0.2, 0.06, 0.18, ICE);
  // xô nhựa lớn đựng nước mía ép sẵn
  U.cyl(-0.68, 1.06, -0.34, 0.19, 0.36, 0x2f6fa8, 12, 0.19);
  D.cyl(-0.68, 1.42, -0.34, 0.17, 0.02, JUICE, 12);
  // ── ly nhựa xếp chồng + ống hút + ca múc ──
  for (let i = 0; i < 3; i++) U.cyl(0.98, 1.06, -0.3 + i * 0.1, 0.045, 0.16, 0xd0ecf7, 8, 0.045);
  for (let i = 0; i < 3; i++) U.cyl(0.98 + i * 0.02, 1.24, -0.3 + i * 0.1, 0.048, 0.012, 0xf7f7f7, 8);
  D.cyl(0.86, 1.06, -0.06, 0.06, 0.14, 0x2a2c30, 8);
  for (let i = 0; i < 9; i++) D.rod(0.86 + (i % 3 - 1) * 0.014, 1.12, -0.06 + (Math.floor(i / 3) - 1) * 0.014, 0.006, 0.24, i % 2 ? 0xf5c531 : 0xd9463c, 0.16, 0, 4);
  // ── lọ muối ớt + kệ ly trên thành xe ──
  U.cyl(0.72, 1.06, 0.34, 0.07, 0.14, 0xf7f7f2, 8, 0.07); D.cyl(0.72, 1.2, 0.34, 0.055, 0.02, 0xd9533a, 8);
  // ── bã mía trong bao tải bên dưới (dấu hiệu của quán mía thật) ──
  D.box(0.72, 0.12, -0.78, 0.52, 0.44, 0.44, 0xb9a878, 0xa89060, 0.14, true);
  for (let i = 0; i < 5; i++) D.rod(0.6 + (i % 3) * 0.1, 0.52, -0.9 + Math.floor(i / 3) * 0.12, 0.026, 0.22, CANE_D, 0.6 + i * 0.2, 0.3, 4);
  // ── bó mía tươi dựng cạnh xe + giá để mía nằm ──
  caneBundle(b, -1.28, -0.12, 0);
  for (let i = 0; i < 4; i++) D.rod(-1.05 + i * 0.05, 1.12, -0.28 + i * 0.02, 0.04, 0.9, i % 2 ? CANE : CANE_D, 0.22, 1.35, 6);
  // ── dù che nắng: cọc sắt + tán dù vải đỏ ──
  D.cyl(-1.0, 0.12, 0.86, 0.035, 2.3, STEEL_D, 6);
  L.cyl(-1.0, 2.42, 0.86, 1.18, 0.16, RED, 14, 0.5, false);
  L.cyl(-1.0, 2.5, 0.86, 1.2, 0.1, 0xf7f3e6, 14, 0.6, false);
  L.cyl(-1.0, 2.58, 0.86, 0.06, 0.1, RED, 8);
  // ── biển hiệu treo trước xe ──
  for (const sx of [-0.78, 0.78]) D.box(sx, 1.06, -0.52, 0.05, 0.7, 0.05, 0x6a4a32);
  b.signAt(0, 1.62, -0.55, 1.84, 0.52, 'NƯỚC MÍA 3.000₫', { bg: '#fff7d6', fg: '#7a0f1e', border: '#c8102e', sub: 'Ép tại chỗ · Ly lớn 5.000₫', subFg: '#1e7a3c', font: 'hand' }, 0, -1, 80);
  // ── ghế nhựa quanh xe cho khách ngồi uống ──
  plasticStool(D, -0.9, 0.13, -1.5, RED, 0.4);
  plasticStool(D, 0.1, 0.13, -1.66, BLUE, 0.4);
  plasticStool(D, 1.15, 0.13, -1.5, RED, 0.38);
  plasticStool(D, 1.6, 0.13, -0.2, BLUE, 0.4);
  plasticTable(D, 0.1, 0.13, -2.3, BLUE);
  for (let i = 0; i < 3; i++) D.cyl(-0.14 + i * 0.22, 0.72, -2.34, 0.04, 0.12, 0xd0ecf7, 8, 0.045);
  // thùng rác nhỏ + bao nilon đựng ly
  D.cyl(1.85, 0.12, 0.3, 0.19, 0.46, 0x3f8a5a, 10, 0.1);
  // ── neo cho người bán (Cô Hai) và cho chỗ khách đứng mua ──
  b.anchor('v_mia_xe', 0, 0.13, 0.92, Math.PI);
  b.anchor('mia_xe', 0, 1.06, -0.9, 0);
  b.world.litter.push([s.x + 1.6, s.z - 1.9], [s.x - 1.9, s.z + 1.4]);
}

/**
 * QUÁN NƯỚC MÍA 3K ở Phố Trung Tâm — mặt tiền có cửa cuốn (mở theo giờ như mọi tiệm khác), trong quán
 * kê máy ép, két nước mía ép sẵn, bàn nhựa cho khách ngồi, và biển hiệu to đúng tên "NƯỚC MÍA 3K".
 */
export function buildMiaShop(b: Builder, w: number, d: number) {
  const di = 4.6, D = b.detail, L = b.lit, U = b.unlit;
  const col = 0xe9f3d6;
  // vỏ tiệm: tường, cửa cuốn, mái, sàn
  L.box(w / 2, 0, 0.1, w, 0.24, 0.2, 0xd9d2c0, 0xc9c2b2, 0.06);
  for (const sx of [0.15, w - 0.15]) L.box(sx, 0, (d + 0.2) / 2, 0.3, 3.4, d, col, 0xcfc6b0, 0.1);
  L.box(w / 2, 0, d - 0.15, w, 3.4, 0.3, col, 0xcfc6b0, 0.1);
  L.box(w / 2, 0, 0.12, w - 0.3, 3.1, 0.06, 0xdfe9d0);
  L.box(w / 2, 3.34, d / 2, w, 0.22, d, 0xbfb6a6, 0xa9a093, 0.1);
  b.ground.tile.floor(0.3, 0.3, w - 0.3, d - 0.3, 0.126, 0xffffff, 2.6);
  b.collide(0, d - 0.3, w, d);
  // biển hiệu lớn phía trên + mái hiên
  b.signAt(w / 2, 3.0, -0.03, Math.min(w - 0.6, 5.2), 0.78, 'NƯỚC MÍA 3K', { bg: '#f5c531', fg: '#7a0f1e', border: '#c8102e', sub: 'Ép mía tươi tại chỗ · Ly 3.000₫', subFg: '#1e5a2e' }, 0, -1, 128);
  b.awning(0.25, w - 0.25, 2.7, 1.2, 0xf5c531, 0xf7f3e6, -0.05);
  // bảng giá treo cạnh cửa
  b.signAt(0.9, 1.55, -0.02, 1.3, 0.62, 'BẢNG GIÁ', { bg: '#ffffff', fg: '#7a0f1e', border: '#c8102e', sub: 'Mía đá 3.000₫ · Ly lớn 5.000₫', subFg: '#55585e' }, 0, -1, 56);
  // ── quầy bán + máy ép trong quán ──
  L.box(w / 2, 0.13, 1.35, w - 1.0, 0.84, 0.7, 0x8a6a4a, 0xb99a72, 0.12);
  b.collide(0.5, 1.0, w - 0.5, 1.7, 0.98);
  canePress(b, w / 2 - 0.75, 0.98, 1.42, Math.PI);
  // két nước mía ép sẵn + ly xếp + thùng đá
  U.box(w / 2 + 0.95, 0.98, 1.35, 0.6, 0.34, 0.52, 0xc9ced4, 0xeef1f4, 0.04, true);
  U.cyl(w / 2 + 0.95, 1.32, 1.35, 0.18, 0.24, 0x2f6fa8, 12, 0.18);
  D.cyl(w / 2 + 0.95, 1.54, 1.35, 0.16, 0.02, JUICE, 12);
  for (let i = 0; i < 3; i++) U.cyl(w / 2 + 1.5 - i * 0.08, 0.98, 1.2 + i * 0.12, 0.045, 0.16, 0xd0ecf7, 8, 0.045);
  D.box(w - 1.0, 0.13, 2.5, 0.7, 0.5, 0.6, 0xf3f0e8, 0xdfe9f7, 0.08, true);
  D.cyl(w - 1.0, 0.63, 2.5, 0.24, 0.06, ICE, 12, 0.24, false);
  // bó mía tươi dựng ở góc quán (khách nhìn thấy mía thật)
  caneBundle(b, 0.95, 3.1, 0.3);
  b.collide(0.55, 2.75, 1.35, 3.45, 1.2);
  // ── bàn nhựa + ghế cho khách ngồi uống tại chỗ ──
  for (const [bx, bz] of [[w / 2 - 1.1, 3.15], [w / 2 + 1.25, 3.35]] as const) {
    plasticTable(D, bx, 0.13, bz, bz > 3.2 ? BLUE : RED);
    plasticStool(D, bx - 0.62, 0.13, bz, bx > w / 2 ? RED : BLUE, 0.4);
    plasticStool(D, bx + 0.62, 0.13, bz + 0.05, bx > w / 2 ? BLUE : RED, 0.4);
    for (let i = 0; i < 2; i++) D.cyl(bx - 0.16 + i * 0.3, 0.72, bz - 0.1, 0.04, 0.12, 0xd0ecf7, 8, 0.045);
    b.collide(bx - 0.36, bz - 0.36, bx + 0.36, bz + 0.36, 0.72);
  }
  // quạt treo tường + đèn
  D.cyl(w - 0.36, 2.1, 2.9, 0.28, 0.06, 0xdfe6ea, 12, 0.28, false);
  D.rod(w - 0.36, 2.1, 2.9, 0.02, 0.3, STEEL_D, 0, 0, 5);
  L.box(w / 2, 3.12, 2.6, 1.6, 0.06, 0.3, 0xfff2cf, 0xfff2cf, 0, true);
  b.world.lamps.push([b.W(w / 2, 2.6)[0], 3.0, b.W(w / 2, 2.6)[1]]);
  // cửa cuốn đóng/mở theo giờ như mọi tiệm (id = 'mia_quan')
  b.shutter('mia_quan', 0.4, w - 0.4, 0.1, 2.6);
  // neo: chỗ khách đứng mua (trước quầy) và chỗ chủ quán đứng (sau quầy)
  b.anchor('mia_quan', w / 2, 1.06, 0.55, Math.PI);
  b.anchor('v_mia_quan', w / 2, 0.13, 2.15, Math.PI);
}

/** Hai neo để `interact.ts` biết chạm vào đâu; giữ ở đây để khỏi chép tay chuỗi ở nhiều nơi. */
export const MIA_ANCHORS = { cart: 'mia_xe', shop: 'mia_quan' } as const;
