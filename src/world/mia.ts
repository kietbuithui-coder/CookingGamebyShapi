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
/**
 * XE NƯỚC MÍA trong Chợ Xóm Chiều (lượt 69; DỜI CHỖ + dựng lại gọn ở lượt 70).
 *
 * Người chơi báo hai lỗi ở bản lượt 69: (1) xe đứng ngay lối đi chính của chợ, tấm biển "NƯỚC MÍA 3.000₫"
 * to bằng cái chiếu dựng trước mặt nên **che cả dãy sạp** phía sau; (2) biển treo lơ lửng, nhìn như "bay".
 *
 * Nay:
 * - Xe nằm ở góc tây-bắc của chợ, sát **cổng trái** (cổng phụ ở x = −60), quay mặt vào trong chợ ⇒ lối đi
 *   chính ở giữa chợ vẫn trống, và khách đứng mua ở phía trong, không ai bị chắn mắt.
 * - Toàn bộ tấm biển thu về **một tấm bảng nhỏ gắn hẳn trên nóc xe** (có hai cọc chống xuống mặt bàn), không
 *   còn tấm nào lơ lửng giữa trời.
 * - Mọi thứ cao quá 1,7 m đều bỏ: dù che nắng hạ xuống sát xe (2,0 m) và chỉ phủ đúng cái xe.
 */
export function buildMiaCart(b: Builder) {
  const s = MIA_SPOTS.cart;
  // Lượt 70 (sửa lỗi): phải ĐỔI MẢNH trước rồi mới lấy tham chiếu `b.lit/b.detail/b.unlit` —
  // bản trước lấy tham chiếu trước khi gọi `chunk()` nên phần inox/thùng xe/sign lại rơi vào mảnh
  // của khu vừa dựng xong (mảnh đó bị ẩn khi đi xa) ⇒ nhìn quanh xe chỉ thấy vài món lặt vặt,
  // còn thân xe, mặt bàn inox và tấm biển thì "biến mất". Giờ mọi thứ vào đúng mảnh `b01` của chợ.
  b.chunk('b01', s.x, s.z);
  b.frame({ tx: s.x, tz: s.z, yaw: s.yaw });
  const D = b.detail, L = b.lit, U = b.unlit;
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
  // ── lọ muối ớt ──
  U.cyl(0.72, 1.06, 0.34, 0.07, 0.14, 0xf7f7f2, 8, 0.07); D.cyl(0.72, 1.2, 0.34, 0.055, 0.02, 0xd9533a, 8);
  // ── bã mía trong bao tải bên dưới (dấu hiệu của quán mía thật) ──
  D.box(0.72, 0.12, -0.78, 0.52, 0.44, 0.44, 0xb9a878, 0xa89060, 0.14, true);
  for (let i = 0; i < 5; i++) D.rod(0.6 + (i % 3) * 0.1, 0.52, -0.9 + Math.floor(i / 3) * 0.12, 0.026, 0.22, CANE_D, 0.6 + i * 0.2, 0.3, 4);
  // ── bó mía tươi dựng cạnh xe + mía nằm trên giá ──
  caneBundle(b, -1.28, -0.12, 0);
  for (let i = 0; i < 4; i++) D.rod(-1.05 + i * 0.05, 1.12, -0.28 + i * 0.02, 0.04, 0.9, i % 2 ? CANE : CANE_D, 0.22, 1.35, 6);
  // ── DÙ CHE NẮNG hạ thấp, phủ đúng cái xe (bản cũ dựng cột 2,3 m + tán 1,2 m nên che cả dãy sạp) ──
  for (const [dx, dz] of [[-0.98, 0.72], [0.98, 0.72]] as const) D.cyl(dx, 0.12, dz, 0.032, 1.92, STEEL_D, 6);
  L.quad(-1.12, 2.02, 0.86, 1.12, 2.02, 0.86, 1.12, 2.16, -0.7, -1.12, 2.16, -0.7, RED);          // mặt trên dù
  L.quad(-1.12, 1.99, 0.86, 1.12, 1.99, 0.86, 1.12, 2.13, -0.7, -1.12, 2.13, -0.7, 0xb03a32);      // mặt dưới
  for (let i = 0; i < 4; i++) {                                                                      // diềm dù
    const xa = -1.12 + i * 0.56, xb = xa + 0.56;
    L.quad(xb, 1.78, 0.86, xa, 1.78, 0.86, xa, 2.02, 0.86, xb, 2.02, 0.86, i % 2 ? 0xf7f3e6 : RED);
  }
  // ── BẢNG HIỆU GẮN TRÊN NÓC XE: hai cọc chống xuống mặt bàn, không lơ lửng ──
  // Lượt 70: bảng dời sang NỬA TRÁI của xe (chỗ có thùng đá) và nâng lên 1,55 m, để nửa phải — nơi đặt
  // máy ép — nhìn từ phía khách vẫn thấy trục ép quay và nước chảy xuống xô.
  for (const sx of [-1.35, -0.28]) D.box(sx, 1.06, -0.44, 0.045, 0.9, 0.045, 0x6a4a32);
  D.box(-0.82, 1.9, -0.44, 1.16, 0.04, 0.06, 0x6a4a32);
  b.signAt(-0.82, 1.5, -0.47, 1.06, 0.36, 'NƯỚC MÍA 3.000₫', { bg: '#fff7d6', fg: '#7a0f1e', border: '#c8102e', sub: 'Ép tại chỗ · Ly lớn 5.000₫', subFg: '#1e7a3c', font: 'hand' }, 0, -1, 72);
  // ── ghế nhựa quanh xe cho khách ngồi uống ──
  plasticStool(D, -0.9, 0.13, -1.5, RED, 0.4);
  plasticStool(D, 0.1, 0.13, -1.66, BLUE, 0.4);
  plasticStool(D, 1.15, 0.13, -1.5, RED, 0.38);
  plasticStool(D, 1.6, 0.13, -0.2, BLUE, 0.4);
  plasticTable(D, 0.1, 0.13, -2.3, BLUE);
  for (let i = 0; i < 3; i++) D.cyl(-0.14 + i * 0.22, 0.85, -2.34, 0.04, 0.12, 0xd0ecf7, 8, 0.045);
  // thùng rác nhỏ
  D.cyl(1.85, 0.12, 0.3, 0.19, 0.46, 0x3f8a5a, 10, 0.1);
  // ── neo cho chỗ khách đứng mua và cho người bán (Cô Hai đứng SAU xe, phía trong chợ) ──
  b.anchor('v_mia_xe', 0, 0.13, -0.92, 0);
  b.anchor('mia_xe', 0, 1.06, 0.9, Math.PI);
  b.world.litter.push([s.x + 1.6, s.z - 1.9], [s.x - 1.9, s.z + 1.4]);
}

/**
 * QUÁN NƯỚC MÍA 3K trên mặt tiền Phố Trung Tâm (lượt 69; sửa bố cục ở lượt 70).
 *
 * Lỗi người chơi báo: ở bản cũ quầy + máy ép kê **sát mặt tiền** (z ≈ 1,35 m tính từ vách trước), nên đứng
 * ngoài đường nhìn vào là **bức tường sau quầy chắn hết**, không thấy máy ép, không thấy bàn khách, cũng không
 * biết trong quán có gì. Quán thì hẹp mà quầy lại chiếm chỗ đẹp nhất.
 *
 * Nay bố cục đảo lại, đúng kiểu quán nước mía thật ngoài đời:
 * - **Mặt tiền để trống**: chỉ còn cửa cuốn + mái hiên + biển, nhìn thẳng vào trong thấy ngay máy ép.
 * - **Quầy lùi sâu vào giữa quán** (z ≈ 3,1 m), máy ép quay mặt ra đường ⇒ khách đứng phía trước quầy (z ≈ 2,2 m)
 *   nhìn thấy trục ép quay, thấy nước mía chảy xuống xô.
 * - Bàn nhựa + bó mía dồn về hai bên và phía sau quầy, không chen giữa lối vào.
 * - Hai neo đổi theo: `v_mia_quan` = chỗ khách đứng mua (trước quầy), `mia_quan` = chỗ Chú Tư đứng (sau quầy).
 */
export function buildMiaShop(b: Builder, w: number, d: number) {
  const D = b.detail, L = b.lit, U = b.unlit;
  const col = 0xe9f3d6;
  const qz = Math.min(d - 1.55, 3.1);                 // quầy lùi sâu vào trong (cũ: 1,35)
  // vỏ tiệm: vách hai bên, vách sau, mái, sàn
  L.box(w / 2, 0, 0.1, w, 0.24, 0.2, 0xd9d2c0, 0xc9c2b2, 0.06);
  for (const sx of [0.15, w - 0.15]) L.box(sx, 0, (d + 0.2) / 2, 0.3, 3.4, d, col, 0xcfc6b0, 0.1);
  L.box(w / 2, 0, d - 0.15, w, 3.4, 0.3, col, 0xcfc6b0, 0.1);
  L.box(w / 2, 3.34, d / 2, w, 0.22, d, 0xbfb6a6, 0xa9a093, 0.1);
  b.ground.tile.floor(0.3, 0.3, w - 0.3, d - 0.3, 0.126, 0xffffff, 2.6);
  b.collide(0, d - 0.3, w, d);
  // mặt tiền: KHÔNG kê gì — chỉ biển + mái hiên + cửa cuốn
  b.signAt(w / 2, 3.0, -0.03, Math.min(w - 0.6, 5.2), 0.78, 'NƯỚC MÍA 3K', { bg: '#f5c531', fg: '#7a0f1e', border: '#c8102e', sub: 'Ép mía tươi tại chỗ · Ly 3.000₫', subFg: '#1e5a2e' }, 0, -1, 128);
  b.awning(0.25, w - 0.25, 2.7, 1.2, 0xf5c531, 0xf7f3e6);
  // bảng giá treo trên vách bên trong, cạnh quầy (nhìn từ ngoài vẫn đọc được)
  b.signAt(0.9, 2.1, qz - 0.9, 1.12, 0.55, 'BẢNG GIÁ', { bg: '#ffffff', fg: '#7a0f1e', border: '#c8102e', sub: 'Mía đá 3.000₫ · Ly lớn 5.000₫', subFg: '#55585e' }, 0, -1, 56);
  // ── QUẦY + MÁY ÉP, lùi sâu: máy ép quay hẳn mặt ra đường ──
  const qw = w - 1.0;
  L.box(w / 2, 0.13, qz, qw, 0.84, 0.7, 0x8a6a4a, 0xb99a72, 0.12);
  b.collide(0.5, qz - 0.35, w - 0.5, qz + 0.35, 0.98);
  canePress(b, w / 2 - 0.75, 0.98, qz + 0.07, Math.PI);         // máy ép trên quầy, trục ép hướng ra đường
  // két nước mía ép sẵn + ly xếp + thùng đá sau quầy
  U.box(w / 2 + 0.95, 0.98, qz, 0.6, 0.34, 0.52, 0xc9ced4, 0xeef1f4, 0.04, true);
  U.cyl(w / 2 + 0.95, 1.32, qz, 0.18, 0.24, 0x2f6fa8, 12, 0.18);
  D.cyl(w / 2 + 0.95, 1.54, qz, 0.16, 0.02, JUICE, 12);
  for (let i = 0; i < 3; i++) U.cyl(w / 2 + 1.5 - i * 0.08, 0.98, qz - 0.12 + i * 0.12, 0.045, 0.16, 0xd0ecf7, 8, 0.045);
  // thùng đá + bó mía dựa góc sau quầy (khách nhìn qua vẫn thấy mía thật)
  D.box(w - 1.0, 0.13, d - 1.15, 0.7, 0.5, 0.6, 0xf3f0e8, 0xdfe9f7, 0.08, true);
  D.cyl(w - 1.0, 0.63, d - 1.15, 0.24, 0.06, ICE, 12, 0.24, false);
  caneBundle(b, 0.95, d - 1.05, 0.3);
  b.collide(0.55, d - 1.4, 1.35, d - 0.7, 1.2);
  // ── bàn nhựa + ghế dồn hai bên, CHỪA lối đi giữa từ cửa vào tới quầy ──
  for (const [bx, bz] of [[0.95, qz + 1.15], [w - 0.95, qz + 1.35]] as const) {
    plasticTable(D, bx, 0.13, bz, bz > qz + 1.2 ? BLUE : RED);
    plasticStool(D, bx - 0.55, 0.13, bz + 0.62, bx > w / 2 ? RED : BLUE, 0.4);
    plasticStool(D, bx + 0.1, 0.13, bz - 0.66, bx > w / 2 ? BLUE : RED, 0.4);
    for (let i = 0; i < 2; i++) D.cyl(bx - 0.16 + i * 0.3, 0.72, bz - 0.1, 0.04, 0.12, 0xd0ecf7, 8, 0.045);
    b.collide(bx - 0.36, bz - 0.36, bx + 0.36, bz + 0.36, 0.72);
  }
  // quạt treo tường + đèn trần
  D.cyl(w - 0.36, 2.1, qz + 1.5, 0.28, 0.06, 0xdfe6ea, 12, 0.28, false);
  D.rod(w - 0.36, 2.1, qz + 1.5, 0.02, 0.3, STEEL_D, 0, 0, 5);
  L.box(w / 2, 3.12, qz + 0.2, 1.6, 0.06, 0.3, 0xfff2cf, 0xfff2cf, 0, true);
  b.world.lamps.push([b.W(w / 2, qz)[0], 3.0, b.W(w / 2, qz)[1]]);
  // cửa cuốn đóng/mở theo giờ như mọi tiệm (id = 'mia_quan')
  b.shutter('mia_quan', 0.4, w - 0.4, 0.1, 2.6);
  // ── neo: KHÁCH đứng trước quầy (nhìn thấy máy ép), CHỦ QUÁN đứng sau quầy ──
  b.anchor('v_mia_quan', w / 2, 0.13, qz - 0.95, 0);
  b.anchor('mia_quan', w / 2, 1.06, qz + 0.55, Math.PI);
}

