// Kiểm: bảng Quầy › Nhân sự có nút "Giao đi chợ…" ở CẢ quán thường (bậc 5) lẫn nhà hàng (bậc 6).
// Lỗi cũ: tab Nhân sự chỉ tồn tại khi isRestaurant → quán bậc 3–5 thuê phụ quầy mà không giao đi chợ được.
import { boot, fresh } from '../lib.mjs';

const openStaff = `(async () => {
  window.__game.ui.panel('stall');
  await new Promise((r) => setTimeout(r, 250));
  [...document.querySelectorAll('#modal .tab')].find((b) => /Nhân sự/i.test(b.textContent))?.click();
  await new Promise((r) => setTimeout(r, 350));
  return { h4: [...document.querySelectorAll('#modal h4')].map((x) => x.textContent.trim()),
    tabs: [...document.querySelectorAll('#modal .tab')].map((x) => x.textContent.trim()),
    btns: [...document.querySelectorAll('#modal button')].map((b) => b.textContent.trim()) };
})()`;

export default [boot, fresh(10 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 200)); } return 1; } },
  { args: [openStaff], eval: async (openStaffSrc) => {
      const g = window.__game.g, R = window.__R;
      g.cash = 5000000; g.flags.firstSale = g.day - 6; g.led.revenue = 900000;
      for (const id of ['ganh', 'xeday', 'sap', 'quanan']) if (!R.has(g, id)) R.buyGear(g, id);
      // quán thường (bậc 5, chưa phải nhà hàng) — đúng trường hợp người chơi báo mất nút
      g.stall.tier = 5; g.stall.where = 'placed'; g.gear.nhahang = 0; g.sous = null;
      if (!g.help) R.hireHelper(g);
      const b5 = await window.eval(openStaffSrc);
      window.__b5 = b5;
      return { bậc5: b5 };
    }, wait: 700 },
  { shot: 'chk-nhan-su.png' },
  { args: [openStaff], eval: async (openStaffSrc) => {
      const g = window.__game.g, R = window.__R;
      // lần 2: nhà hàng bình dân (bậc 6) — phải có thêm phần "Đặt bàn trước"
      if (!R.has(g, 'nhahang')) R.buyGear(g, 'nhahang');
      g.stall.tier = 6;
      const b6 = await window.eval(openStaffSrc);
      const b5 = window.__b5;
      return { bậc6: b6,
        đạt: b5.btns.some((t) => /chợ/i.test(t)) && !b5.h4.some((t) => /Đặt bàn/.test(t)) &&
          b5.tabs.includes('Nhân sự') &&
          b6.btns.some((t) => /chợ/i.test(t)) && b6.h4.some((t) => /Đặt bàn/.test(t)) &&
          // quán thường không được bày dòng "tự duyệt đặt bàn" (chưa có bếp trưởng)
          b5.btns.every((t) => !/tự duyệt/i.test(t)) };
    }, wait: 700 },
  { shot: 'chk-nhan-su-nhahang.png' },
];
