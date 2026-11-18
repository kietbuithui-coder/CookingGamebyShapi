// LƯỢT 31 (§5 Con người) — dáng người / râu / nón mua được thật, đổi hình trên nhân vật 3D, ca làm của phụ quầy.
import { boot, fresh } from '../lib.mjs';
const state = { eval: () => {
  const g = window.__game.g;
  return { look: { fat: +g.look.fat.toFixed(2), h: +g.look.h.toFixed(2), beard: g.look.beard, hat: g.look.hat, hairStyle: g.look.hairStyle },
    dáng: (window.__R.bodyType(g)), tốc: +(window.__R.moveMul(g, g.pos.x, g.pos.z) * 100).toFixed(1),
    ca: g.helpShift, người1: g.help?.name ?? null, người2: g.help2?.name ?? null };
} };
export default [boot, fresh(10 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); }
      const g = window.__game.g; g.cash = 200000; g.stall.tier = 3; g.stall.where = 'placed'; g.stall.open = true; window.__game.ui.switchView(); return 1; } },

  { label: '① tiệm may: bảng chọn đồ (tự nói giá, không còn dòng chú thích dài)' },
  { eval: () => { const n = window.__game.npcs.fixed.get('thoi_trang'); window.__game.acts.talk(n); return 1; }, wait: 500 },
  { shot: 'p31-01-tiem-may.png' },

  { label: '② mua dáng "Đậm người": nhân vật 3D đổi bề ngang, tốc độ đi giảm thật' },
  { eval: async () => {
      const g = window.__game.g; g.look.fat = 1.12; g.look.h = 1.03; window.__game.player.applyLook();
      return 1; } , wait: 300 },
  state,
  { eval: async () => {
      // đóng bảng và dựng camera kề vai để thấy đúng thân hình nhân vật
      window.__game.ui.closePanel(); window.__game.ui.closeDialog?.();
      const cam3 = window.__cam3(true);      // góc nhìn thứ ba: nhân vật 3D mới hiện ra để ngắm
      const p = window.__game.player, g = window.__game.g;
      const bx = Math.sin(p.yaw ?? 0), bz = Math.cos(p.yaw ?? 0);
      // dời ra chỗ trống (khỏi giường gầm cầu) rồi đứng đối diện để thấy mặt, râu, nón
      p.x += 7; p.z += 3;
      await new Promise((r) => setTimeout(r, 400));
      window.__cam(p.x + Math.sin(p.yaw) * 2.2, p.y + 1.5, p.z + Math.cos(p.yaw) * 2.2, p.x, p.y + 0.95, p.z);
      return { fat: g.look.fat, h: g.look.h, cam3, y: +p.y.toFixed(2) };
    }, wait: 900 },
  { shot: 'p31-02-dang-nguoi.png' },

  { label: '③ để râu quai nón + đội nón lá: thấy ngay trên đầu nhân vật' },
  { eval: async () => {
      const g = window.__game.g; g.look.beard = 3; g.look.hat = 1; g.look.hatCol = 0xe6d6a0; window.__game.player.applyLook();
      return 1; }, wait: 400 },
  state,
  { eval: async () => { const p = window.__game.player; window.__cam(p.x + Math.sin(p.yaw) * 2.2, p.y + 1.5, p.z + Math.cos(p.yaw) * 2.2, p.x, p.y + 0.95, p.z); return 1; }, wait: 900 },
  { shot: 'p31-03-rau-non.png' },

  { label: '③b tạp dề chủ quán: từ xe đẩy trở lên là mặc tạp dề đỏ' },
  { eval: async () => {
      const g = window.__game.g;
      g.stall.tier = 1; await new Promise((r) => setTimeout(r, 120)); const low = window.__game.player.look?.apron ?? 0;
      g.stall.tier = 3; await new Promise((r) => setTimeout(r, 250)); const hi = window.__game.player.look?.apron ?? 0;
      return { quánNhỏ: low, cóXeĐẩy: hi };
    }, wait: 600 },

  { label: '④ ghế Chú Bảy: kiểu tóc / râu / soi gương' },
  { eval: () => { const n = window.__game.npcs.fixed.get('hot_toc'); window.__game.acts.talk(n); return 1; }, wait: 500 },
  { shot: 'p31-04-cat-toc.png' },

  { label: '⑤ thuê 2 phụ quầy + đổi ca: người ngoài ca không tới quầy' },
  { eval: async () => {
      const g = window.__game.g, R = window.__R;
      g.gear.nhahang = 100; g.stall.tier = 6; g.flags.firstSale = g.day - 5; g.led.revenue = 900000;
      R.hireHelper(g); R.hireHelper(g);
      g.helpShift = { 1: 'sang', 2: 'chieu' };
      g.day = 1; g.min = 20 * 60;
      return { cóMặt: [R.onShift(g, 1), R.onShift(g, 2)], cònGiờ: [R.shiftLeft(g, 1), R.shiftLeft(g, 2)] };
    }, wait: 300 },
  { eval: async () => {
      // mở bảng Quầy để thấy đúng nút đổi ca mà người chơi sẽ bấm
      const g = window.__game.g; g.stall.where = 'placed'; g.stall.open = true;
      window.__game.ui.panel('stall');
      await new Promise((r) => setTimeout(r, 250));
      [...document.querySelectorAll('#modal .tab, #modal button')].find((b) => /Nhân sự/i.test(b.textContent))?.click();
      await new Promise((r) => setTimeout(r, 350));
      const btns = [...document.querySelectorAll('#modal button')].map((b) => b.textContent.trim());
      return { nút: btns.filter((t) => /ca|nghỉ/i.test(t)), tổng: btns.length };
    }, wait: 500 },
  state,
  { shot: 'p31-05-ca-lam.png' },
];
