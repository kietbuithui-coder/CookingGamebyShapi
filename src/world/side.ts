// Những góc nhỏ ven đường: quán trà đá vỉa hè, chỗ nhảy đường phố dưới gầm cầu, tiệm vá xe ngoài lề đường,
// chỗ cô hát rong ngồi, bàn cờ tướng trong công viên, cậu bé đánh giày. Không phải toà nhà — chỉ là đồ đạc bày ra
// trên vỉa hè, đủ để có chỗ dừng chân và một người để làm quen. Mỗi chỗ đều ghi neo (anchor): "v_<id>" cho nhân vật
// phụ đứng đó, và một neo tương tác cho chỗ người chơi dùng được.
import { Builder } from './build';
import { RNG } from '../core/util';
import { plasticStool } from '../gfx/props';

/** Dựng cả sáu góc nhỏ. Gọi một lần sau khi đã dựng xong các lô nhà (để không đè lên biển hiệu, cây, cột đèn). */
/** Màu tối hơn một chút để làm đường may/viền. */
const shadeOf = (c: number, k = 0.78) => { const r = Math.max(0, ((c >> 16) & 255) * k), g2 = Math.max(0, ((c >> 8) & 255) * k), b2 = Math.max(0, (c & 255) * k); return (Math.round(r) << 16) | (Math.round(g2) << 8) | Math.round(b2); };
export function buildSide(b: Builder) {
  const R = new RNG(3071);
  const D = () => b.detail, L = () => b.lit;

  // ───────── 1. Quán trà đá của Cô Thắm — vỉa hè phía trước tạp hoá Cô Ba (Xóm Lao Động) ─────────
  // Mặt tiền hướng Đông: ban công/ô văng của tạp hoá che nắng phía trên, vỉa hè rộng 3 m ở phía +x.
  // Quán đứng sát mép lòng đường (x ≈ −34,3) để không chắn quầy hàng của tạp hoá; bảng giá treo trên
  // cây cột dựng cạnh bàn chứ không dán lên tường nhà người ta.
  b.chunk('b02', -59, 59).frame({ tx: 0, tz: 0, yaw: 0 });
  {
    const x = -34.3, z = 53.4, d = D();
    // bàn nhựa + 4 ly trà đá + bình trà nóng
    b.table(x, z, 0.62, 0.62, 0.42, 0x2f8fd5, d);
    for (const [ox, oz] of [[-0.16, -0.15], [0.16, -0.15], [-0.16, 0.16], [0.16, 0.16]] as const) {
      d.cyl(x + ox, 0.42, z + oz, 0.038, 0.1, 0xcfe6f2, 7, 0.045); d.cyl(x + ox, 0.42, z + oz, 0.042, 0.012, 0xffffff, 7);
    }
    d.cyl(x + 0.02, 0.42, z + 0.0, 0.07, 0.09, 0x9a5a2a, 8, 0.05); d.cyl(x + 0.02, 0.51, z, 0.035, 0.04, 0x7a4a22, 8);
    // bình thuỷ + thùng xốp đá + két nước ngọt
    d.cyl(x - 0.36, 0.13, z + 0.38, 0.13, 0.3, 0xd9dde2, 9, 0.11); d.cyl(x - 0.36, 0.43, z + 0.38, 0.055, 0.06, 0xd9463c, 8);
    d.box(x - 0.4, 0.13, z - 0.42, 0.46, 0.3, 0.36, 0xf3f0e8, 0xdfe9f7, 0.06, true);
    for (let i = 0; i < 4; i++) d.cyl(x - 0.52 + (i % 2) * 0.18, 0.4, z - 0.5 + Math.floor(i / 2) * 0.16, 0.036, 0.16, 0x9a6a2a, 6);
    // ghế nhựa cho khách
    plasticStool(d, x + 0.42, 0.13, z - 0.34, 0xd9463c, 0.4); plasticStool(d, x + 0.46, 0.13, z + 0.34, 0x2f8fd5, 0.4);
    plasticStool(d, x - 0.44, 0.13, z + 0.02, 0xd9463c, 0.38);                                    // ghế của cô
    // bảng giá dựng cạnh quán, quay ra lòng đường
    for (const sz of [-0.32, 0.32]) d.box(x + 0.72, 0.13, z + sz, 0.05, 1.42, 0.05, 0x8a6a4a);
    b.signAt(x + 0.7, 1.12, z, 0.9, 0.32, 'TRÀ ĐÁ 3.000₫', { bg: '#fff7d6', fg: '#7a0f1e', border: '#c8102e' }, 1, 0, 44, true);
    b.collide(x - 0.36, z - 0.36, x + 0.36, z + 0.36); b.collide(x - 0.63, z - 0.6, x - 0.17, z - 0.24);
    b.anchor('v_tra_da', x - 0.44, 0.13, z + 0.02, Math.PI / 2);          // ngồi trên ghế nhựa (mông tự hạ xuống mặt ghế)
    b.anchor('tra_ban', x, 0.55, z, -Math.PI / 2);
  }

  // ───────── 1b. Tiệm cắt tóc vỉa hè của Chú Bảy Kéo — trong sạp chợ, dãy phía bắc ─────────
  // Chỗ này là quầy nhỏ trong lòng chợ (lối đi giữa hai dãy sạp): một cái ghế, tấm gương, hộp đồ nghề và cái bảng giá.
  b.chunk('b01', -59, 0).frame({ tx: 0, tz: 0, yaw: 0 });
  {
    const x = -45.5, z = 8.2, d = D(), L2 = L();
    // ghế cắt tóc: đế sắt, cột, đệm ngồi, tựa lưng có gối đầu, tay vịn mạ crôm
    d.box(x, 0.14, z, 0.44, 0.06, 0.44, 0x3a3c42, 0x4a4c52, 0.03, true);
    d.cyl(x, 0.34, z, 0.055, 0.36, 0x9aa0a6, 8);
    d.box(x, 0.58, z, 0.5, 0.1, 0.46, 0x7d2f34, 0x9a3d42, 0.05, true);
    d.box(x, 0.84, z - 0.2, 0.48, 0.44, 0.08, 0x7d2f34, 0x9a3d42, 0.04, true);
    d.cyl(x, 1.1, z - 0.2, 0.11, 0.1, 0x5c2126, 8, 0.09);
    for (const sx of [-0.28, 0.28]) { d.cyl(x + sx, 0.72, z + 0.04, 0.026, 0.3, 0x9aa0a6, 6); d.box(x + sx, 0.87, z + 0.04, 0.05, 0.04, 0.3, 0xb9c0c6); }
    d.box(x, 0.36, z + 0.38, 0.34, 0.04, 0.22, 0x9aa0a6);
    d.quad(x, 0.545, z + 0.4, x - 0.26, 0.06, z - 0.42, x + 0.26, 0.06, z - 0.42, x, 0.06, z + 0.44, 0x2c3038);   // tấm lót chân
    // gương soi: khung gỗ + mặt kính, dựng PHÍA SAU ghế
    for (const sx of [-0.36, 0.36]) d.box(x + sx, 0.62, z - 0.66, 0.06, 1.24, 0.05, 0x8a6a4a);
    d.box(x, 1.22, z - 0.7, 0.94, 0.9, 0.03, 0x6a4a32, 0x8a6a4a);
    L2.box(x, 1.22, z - 0.67, 0.84, 0.78, 0.02, 0xcfe0ea, 0xe6eef4, 0.02, true);
    // bàn đồ nghề: kéo, lược, tông đơ, chai nước hoa
    d.box(x - 0.86, 0.5, z + 0.34, 0.5, 0.05, 0.34, 0x9aa0a6, 0xb9c0c6, 0.02, true);
    for (const sx of [-0.2, 0.2]) d.box(x - 0.86 + sx, 0.26, z + 0.34 + sx * 0.3, 0.04, 0.48, 0.04, 0x6a6e74);
    for (let i = 0; i < 3; i++) d.box(x - 0.96 + i * 0.1, 0.545, z + 0.28, 0.02, 0.02, 0.16, i % 2 ? 0xc9ced4 : 0xd9463c);
    d.cyl(x - 0.7, 0.56, z + 0.4, 0.035, 0.11, 0xdfe9f7, 7, 0.03);
    d.cyl(x - 1.0, 0.6, z + 0.36, 0.055, 0.15, 0x2f6fb5, 8, 0.05);
    d.box(x - 0.68, 0.53, z + 0.46, 0.16, 0.03, 0.05, 0x2a2e3a);                 // tông đơ
    // thùng nước + khăn treo + áo choàng
    d.cyl(x + 0.72, 0.24, z - 0.06, 0.19, 0.38, 0x2f6fb5, 10, 0.15);
    for (let i = 0; i < 3; i++) d.rod(x + 0.72, 0.44 + i * 0.02, z - 0.06, 0.02, 0.22, 0xf3f0e8, 0, 0.2 + i * 0.25, 4);
    d.box(x - 0.62, 1.02, z - 0.66, 0.3, 0.5, 0.03, 0xdfe9f7, 0xf3f4f6, 0.02, true);  // áo choàng trắng treo gương
    // biển hiệu treo trên khung gương (hai dây thép buộc lên xà), bóng đèn tròn, áo choàng trải trên ghế
    b.signAt(x - 0.02, 1.86, z - 0.5, 0.92, 0.28, 'CẮT TÓC 15.000₫', { bg: '#20304a', fg: '#f7e9a0', border: '#c8102e' }, 0, 1, 44, true);
    for (const sx of [-0.38, 0.38]) d.rod(x + sx, 2.3, z - 0.5, 0.008, 0.44, 0x9aa0a6, 0, 0, 4);
    L2.box(x - 0.02, 2.4, z - 0.28, 0.09, 0.09, 0.09, 0xfff2c4, 0xfff6d8, 0.5, true);
    d.box(x, 0.635, z, 0.54, 0.02, 0.48, 0xf3f4f6);
    b.collide(x - 0.34, z - 0.34, x + 0.34, z + 0.34);
    b.collide(x - 0.98, z + 0.14, x - 0.46, z + 0.48);
    b.collide(x + 0.5, z - 0.14, x + 0.86, z + 0.24);
    b.anchor('v_hot_toc', x + 0.86, 0.13, z + 0.02, -Math.PI / 2);  // thợ đứng bên ghế, quay mặt vô ghế
    b.anchor('hot_toc_ghe', x + 0.02, 0.66, z, 0);                   // khách ngồi lên ghế
  }

  // ───────── 1c. Sạp quần áo của Cô Ngọc — cùng dãy chợ, phía nam ─────────
  {
    const x = -45.5, z = -8.2, d = D(), L2 = L();
    // giá treo quần áo: hai cột sắt + thanh ngang 2 m, áo treo bằng móc
    for (const sx of [-1.0, 1.0]) { d.cyl(x + sx, 0.86, z, 0.03, 1.5, 0x9aa0a6, 8); d.box(x + sx, 0.08, z, 0.32, 0.06, 0.32, 0x6a6e74); }
    d.rod(x, 1.6, z, 0.025, 2.0, 0xb9c0c6, 0, Math.PI / 2, 6);
    const shirtCols = [0xc8442f, 0xd8b13a, 0x2f8fd5, 0x3fae5a, 0xe9e5da, 0xd8799c, 0x7a5ec4, 0x3a3f4a];
    for (let i = 0; i < 7; i++) {
      const sx = -0.75 + i * 0.25, col = shirtCols[i];
      d.cyl(x + sx, 1.55, z, 0.006, 0.1, 0xc9ced4, 4, 0.06);                      // móc áo
      d.box(x + sx, 1.34, z, 0.17, 0.3, 0.04, col, col, 0.02, true);              // thân áo
      d.box(x + sx, 1.47, z, 0.24, 0.05, 0.05, col);                              // vai + tay áo
      for (const sx2 of [-0.095, 0.095]) d.box(x + sx + sx2, 1.4, z, 0.04, 0.12, 0.032, shadeOf(col, 0.9));
      d.box(x + sx, 1.17, z, 0.15, 0.025, 0.035, shadeOf(col));                   // lai áo
      d.box(x + sx, 1.48, z + 0.024, 0.05, 0.028, 0.02, 0xe9e5da);                // cổ áo
    }
    // bàn gấp đồ + chồng áo + giá kính
    d.box(x + 1.62, 0.5, z - 0.2, 0.8, 0.05, 0.56, 0xd9dee3, 0xeef1f4, 0.02, true);
    for (const sx of [-0.32, 0.32]) for (const sz of [-0.2, 0.18]) d.box(x + 1.62 + sx, 0.25, z - 0.2 + sz, 0.04, 0.48, 0.04, 0x9aa0a6);
    for (let i = 0; i < 4; i++) d.box(x + 1.56 + (i % 2) * 0.18, 0.55 + Math.floor(i / 2) * 0.055, z - 0.28 + (i % 2) * 0.09, 0.26, 0.05, 0.2, shirtCols[(i + 3) % shirtCols.length]);
    d.box(x + 1.36, 0.58, z + 0.05, 0.3, 0.03, 0.2, 0x2a2e3a);                    // khay kính
    for (let i = 0; i < 2; i++) for (const sx of [-0.05, 0.05]) d.box(x + 1.36 + i * 0.12 + sx, 0.605, z + 0.05, 0.07, 0.04, 0.02, i ? 0x1b1c1f : 0x6a4a32);
    // khay giày dưới đất: ba đôi
    d.box(x + 1.62, 0.06, z + 0.62, 0.86, 0.08, 0.44, 0xd9dee3, 0xeef1f4, 0.02, true);
    const shoeCols = [0x2a2e3a, 0xe9e5da, 0xc8442f];
    for (let i = 0; i < 3; i++) for (const sx of [-0.07, 0.08]) {
      d.box(x + 1.4 + i * 0.22 + sx, 0.13, z + 0.62, 0.11, 0.05, 0.26, shoeCols[i]);
      d.box(x + 1.4 + i * 0.22 + sx, 0.165, z + 0.56, 0.1, 0.06, 0.16, shadeOf(shoeCols[i]));
    }
    b.signAt(x - 0.55, 1.82, z + 0.16, 0.86, 0.26, 'QUẦN ÁO 25.000₫', { bg: '#7a0f2e', fg: '#ffe9c9', border: '#f5c531' }, 0, 1, 44, true);
    for (const sx of [-0.9, -0.2]) d.rod(x + sx, 2.06, z + 0.16, 0.008, 0.24, 0x9aa0a6, 0, 0, 4);
    b.collide(x - 1.2, z - 0.22, x + 1.2, z + 0.22);
    b.collide(x + 1.24, z - 0.52, x + 2.16, z + 0.12);
    L2.quad(x - 1.2, 0.125, z + 1.2, x - 0.9, 0.125, z + 0.4, x + 1.2, 0.125, z + 0.4, x + 1.1, 0.125, z + 1.2, 0xb99a6a);
    b.anchor('v_thoi_trang', x - 1.5, 0.13, z + 0.1, Math.PI / 2);   // cô đứng cạnh giá, mặt hướng ra lối đi
  }

  // ───────── 2. Góc nhảy đường phố dưới gầm cầu vượt (chỗ Bin tập bài) ─────────
  // Tường vẽ nằm ngay mép gầm cầu, mặt có hình hướng ra phố (phía −z); Bin nhảy trước tường, quay mặt ra đường.
  b.chunk('south', 0, 100).frame({ tx: 0, tz: 0, yaw: 0 });
  {
    const cx = -21.8, wz = 96.6, d = D();
    L().box(cx - 0.2, 0.12, wz, 5.0, 2.6, 0.18, 0xb0a898, 0x9a9288, 0.1, true);
    b.collide(cx - 2.7, wz - 0.1, cx + 2.3, wz + 0.1);
    // hình vẽ trên mặt hướng ra phố; mỗi lớp nhô ra một chút để không trùng mặt phẳng
    const face = wz - 0.09, cols = [0xe2402f, 0xf5c531, 0x2f8fd5, 0x3fae5a, 0x8a5fd0, 0xe86f9a];
    for (let i = 0; i < 16; i++) {
      const z2 = face - 0.004 - 0.003 * i, gx = cx - 2.2 + R.range(0, 4.1), gy = 0.55 + R.range(0, 1.5), w = R.range(0.2, 0.7), h = R.range(0.12, 0.4);
      const c = R.pick(cols);
      if (R.chance(0.5)) d.quad(gx - w, gy, z2, gx - w, gy + h, z2, gx + w, gy + h, z2, gx + w, gy, z2, c);
      else d.rod(gx, gy + h / 2, z2, 0.06 + h * 0.25, w * 1.4, c, 0, 0, 5);
    }
    // vài vòng tròn xịt sơn cho ra dáng hình vẽ đường phố
    for (let i = 0; i < 7; i++) {
      const z4 = face - 0.05 - 0.004 * i, gx = cx - 2.1 + R.range(0, 3.9), gy = 0.7 + R.range(0, 1.3), rr = R.range(0.1, 0.24);
      d.rod(gx, gy, z4, rr, 0.02, R.pick(cols), Math.PI / 2, 0, 10);
      if (R.chance(0.5)) d.rod(gx, gy, z4 - 0.006, rr * 0.5, 0.02, 0xf7f3e4, Math.PI / 2, 0, 8);
    }
    const z3 = face - 0.08;
    d.quad(cx - 2.35, 0.4, z3, cx - 2.35, 0.48, z3, cx + 2.35, 0.48, z3, cx + 2.35, 0.4, z3, 0x1b1c1f);
    // thùng gỗ + loa đài đặt sát chân tường, bên trái
    const bx = cx - 2.55, bz = wz - 0.45;
    d.box(bx, 0.13, bz, 0.5, 0.5, 0.5, 0x8a6a4a, 0xb99a72, 0.1, true);
    d.box(bx, 0.63, bz, 0.56, 0.24, 0.2, 0x2a2c30, 0x3a3c42, 0.06, true);
    for (const s2 of [-0.16, 0.16]) { d.cyl(bx + s2, 0.75, bz - 0.11, 0.07, 0.02, 0x55585e, 8, 0.07); d.cyl(bx + s2, 0.75, bz - 0.125, 0.035, 0.01, 0x1b1c1f, 6); }
    d.rod(bx + 0.2, 0.95, bz, 0.008, 0.42, 0x8a8f96, 0, 0.35, 4);
    // tấm các-tông làm sàn nhảy, trước tường
    const fz = wz - 1.0;
    L().quad(cx - 1.9, 0.132, fz + 0.6, cx - 1.5, 0.132, fz - 1.4, cx + 2.1, 0.132, fz - 1.4, cx + 1.7, 0.132, fz + 0.6, 0xb99a6a);
    L().quad(cx + 1.7, 0.131, fz + 0.6, cx + 2.1, 0.131, fz - 1.4, cx + 2.4, 0.131, fz - 1.2, cx + 2.3, 0.131, fz + 0.5, 0xa98a5a);
    // thùng nhựa đựng lon nước + chai nước
    d.box(cx + 2.6, 0.13, wz - 0.6, 0.42, 0.4, 0.36, 0x2f6fb5, 0x3f7fc5, 0.06, true);
    for (let i = 0; i < 3; i++) d.cyl(cx + 2.5 + (i % 2) * 0.12, 0.53, wz - 0.65 + Math.floor(i / 2) * 0.1, 0.03, 0.14, i % 2 ? 0xd9463c : 0x3fae5a, 6);
    for (const [x, z] of [[cx - 3.0, wz - 0.9], [cx + 3.0, wz - 1.1]] as const) b.bin(x, z);
    b.collide(cx - 2.8, wz - 0.72, cx - 2.3, wz - 0.18);
    b.collide(cx + 2.38, wz - 0.8, cx + 2.82, wz - 0.4);
    b.anchor('v_rap', cx - 0.36, 0.13, wz - 1.55, Math.PI);          // Bin đứng trên sàn nhảy, mặt hướng ra phố
    b.anchor('rap_floor', cx + 0.1, 0.2, wz - 1.2, Math.PI);
  }

  // ───────── 3. Tiệm vá xe ngoài lề đường của Chú Hậu — vỉa hè phía bắc chợ ─────────
  b.chunk('b01', -59, 0).frame({ tx: 0, tz: 0, yaw: 0 });
  {
    const x = -45.5, z = -24.2, d = D(), L2 = L();
    // bạt xanh căng trên hai cây sào, nghiêng ra phía đường
    for (const s of [-1.5, 1.6]) { L2.cyl(x + s, 0.12, z - 0.9, 0.035, 2.15, 0x8a8f96, 5); }
    L2.quad(x + 1.85, 2.18, z - 1.25, x - 1.75, 2.18, z - 1.25, x - 1.75, 2.55, z + 0.65, x + 1.85, 2.55, z + 0.65, 0x2f6fb5);
    d.quad(x - 1.75, 2.17, z - 1.25, x + 1.85, 2.17, z - 1.25, x + 1.85, 2.54, z + 0.65, x - 1.75, 2.54, z + 0.65, 0x275f9c);
    // xe đang sửa trên giá gỗ
    b.bike(x - 0.55, z, 0.18, 0xd9b84a);
    d.box(x - 0.55, 0.13, z + 0.1, 0.9, 0.28, 0.28, 0x8a6a4a, 0xa98a62, 0.08);
    // đồ nghề: thùng gỗ, cờ-lê, bơm tay, vỏ xe dựng
    d.box(x + 0.9, 0.13, z - 0.1, 0.62, 0.42, 0.44, 0x8a6a4a, 0xb99a72, 0.1, true);
    for (let i = 0; i < 4; i++) d.rod(x + 0.75 + i * 0.11, 0.58, z - 0.08, 0.014, 0.26, 0x9aa0a6, Math.PI / 2, 0.1 * i, 5);
    d.rod(x + 1.55, 0.3, z - 0.3, 0.05, 0.55, 0xc8102e, 1.0, 0, 6); d.box(x + 1.62, 0.62, z - 0.44, 0.22, 0.06, 0.1, 0x55585e);
    d.rod(x - 1.7, 0.42, z - 0.5, 0.32, 0.1, 0x1e2024, Math.PI / 2, 0, 10); d.rod(x - 1.55, 0.42, z - 0.5, 0.32, 0.1, 0x2a2c30, Math.PI / 2, 0, 10);
    d.box(x + 0.15, 0.13, z - 1.0, 0.5, 0.14, 0.36, 0x55585e, 0x8a8f96, 0.05);                    // khay ốc
    // biển treo dưới mép bạt
    b.signAt(x + 0.95, 1.62, z - 1.28, 1.25, 0.36, 'VÁ XE · BƠM HƠI', { bg: '#ffffff', fg: '#0b5ea8', border: '#0b5ea8' }, 0, -1, 44);
    b.collide(x - 1.2, z - 0.4, x + 1.2, z + 0.35);
    b.anchor('v_sua_xe', x - 0.5, 0.13, z + 0.75, Math.PI);
  }

  // ───────── 4. Cô Hồng hát rong — trong cổng chợ, bên trái bức tường đỏ ─────────
  // (Trước đây cô đứng ngay trên vỉa hè trước cổng, chắn tầm nhìn lối vào chợ.
  //  Dời qua bên kia tường, vô trong cổng một quãng — vẫn thấy từ ngoài đường mà không chắn cửa.)
  b.chunk('b01', -59, 0).frame({ tx: 0, tz: 0, yaw: 0 });
  {
    const x = -40.6, z = -5.6, d = D();
    plasticStool(d, x, 0.13, z, 0x2f8fd5, 0.42);
    d.box(x + 0.55, 0.13, z + 0.42, 0.34, 0.28, 0.26, 0x2a2c30, 0x3a3c42, 0.05, true);          // loa nhỏ
    d.cyl(x + 0.55, 0.41, z + 0.42, 0.09, 0.02, 0x55585e, 8);
    d.box(x + 0.5, 0.13, z - 0.4, 0.32, 0.22, 0.26, 0xc9aa7a, 0xb99a6a, 0.05, true);             // thùng quyên góp
    b.signAt(x + 0.34, 0.24, z - 0.4, 0.3, 0.14, 'ỦNG HỘ', { bg: '#fff7d6', fg: '#7a0f1e' }, 1, 0, 26);
    // cây đàn cũ dựng bên ghế
    d.sph(x - 0.4, 0.32, z + 0.34, 0.17, 0.22, 0.09, 0x9a5a2a, 8); d.rod(x - 0.4, 0.62, z + 0.34, 0.035, 0.55, 0x6a3a1a, 0.25, 0, 5);
    b.collide(x + 0.3, z - 0.6, x + 0.85, z + 0.6);
    b.anchor('v_hat_rong', x, 0.13, z, Math.PI / 2);
  }

  // ───────── 5. Bàn cờ tướng của Ông Tư — trong công viên, bên lối đi ngang hồ ─────────
  // (Trước đây bàn đặt ngay trước ghế đá ở (57, −72,5) nên ghế với bàn lồng vào nhau, ông ngồi lọt thỏm
  // giữa hai cái. Dời ra khoảng trống phía bắc lối đi, cách hồ nước và bồn hoa đủ xa.)
  b.chunk('b20', 59, -59).frame({ tx: 0, tz: 0, yaw: 0 });
  {
    const x = 52.2, z = -56.9, d = D();
    b.table(x, z, 0.66, 0.66, 0.48, 0xd9d2c0, d);
    d.box(x, 0.48, z, 0.56, 0.02, 0.56, 0xe9d9a8, 0xf3e6bc, 0, true);                            // bàn cờ (nằm trên mặt bàn)
    for (let i = 1; i < 8; i++) {
      d.box(x - 0.28 + i * 0.07, 0.504, z, 0.006, 0.004, 0.5, 0x8a6a4a);
      d.box(x, 0.504, z - 0.28 + i * 0.07, 0.5, 0.004, 0.006, 0x8a6a4a);
    }
    for (let i = 0; i < 6; i++) { d.cyl(x - 0.22 + (i % 3) * 0.22, 0.51, z - 0.16, 0.028, 0.03, i % 2 ? 0xc8102e : 0x1b1c1f, 6); d.cyl(x - 0.22 + (i % 3) * 0.22, 0.51, z + 0.18, 0.028, 0.03, i % 2 ? 0x1b1c1f : 0xc8102e, 6); }
    plasticStool(d, x - 0.06, 0.13, z - 0.72, 0xd9463c, 0.4); plasticStool(d, x + 0.1, 0.13, z + 0.74, 0x2f8fd5, 0.4);
    b.collide(x - 0.34, z - 0.34, x + 0.34, z + 0.34);
    b.anchor('v_danh_co', x - 0.06, 0.13, z - 0.72, 0);                   // ngồi trên ghế nhựa (mông tự hạ xuống mặt ghế)
  }

  // ───────── 6. Bé Bo đánh giày — vỉa hè phố bến xe ─────────
  b.chunk('b12', 0, 59).frame({ tx: 0, tz: 0, yaw: 0 });
  {
    const x = -24.85, z = 64.7, d = D();
    d.box(x, 0.13, z, 0.36, 0.4, 0.36, 0x8a6a4a, 0xb99a72, 0.08, true);                          // thùng gỗ làm ghế
    d.box(x + 0.32, 0.13, z + 0.34, 0.28, 0.22, 0.22, 0x9a4a2a, 0xb0552e, 0.06, true);           // hộp xi
    for (let i = 0; i < 3; i++) d.cyl(x + 0.28 + (i % 2) * 0.1, 0.36, z + 0.3 + Math.floor(i / 2) * 0.1, 0.025, 0.05, i % 2 ? 0x1b1c1f : 0xf3f0e8, 5);
    d.rod(x + 0.5, 0.2, z + 0.2, 0.03, 0.22, 0x8a5a3a, 0.4, 0.3, 5);                              // bàn chải
    plasticStool(d, x - 0.5, 0.13, z - 0.06, 0x2f8fd5, 0.36);                                     // ghế khách
    b.signAt(-23.03, 1.15, z, 0.95, 0.34, 'ĐÁNH GIÀY 5.000₫', { bg: '#fff7d6', fg: '#7a0f1e', border: '#c8102e' }, -1, 0, 36);
    b.collide(x - 0.2, z - 0.2, x + 0.46, z + 0.46);
    b.anchor('v_danh_giay', x, 0.13, z, -Math.PI / 2);                     // ngồi trên thùng gỗ (hạ theo tư thế ngồi)
  }
}
