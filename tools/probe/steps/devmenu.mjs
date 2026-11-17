// Kiểm tra menu Test & Dịch chuyển ẩn trong Cài đặt (bấm 7 lần vào chữ "Cài đặt").
import { boot, fresh } from '../lib.mjs';

export default [
  boot,
  fresh(11 * 60),
  { label: '① mở Cài đặt và bấm 6 lần (chưa mở), bấm lần 7 (mở menu ẩn)' },
  {
    eval: async () => {
      const g0 = window.__game;
      g0.ui.panel('settings');
      await new Promise((r) => setTimeout(r, 150));
      const el = document.querySelector('#dev-unlock');
      for (let i = 0; i < 6; i++) el.click();
      await new Promise((r) => setTimeout(r, 100));
      const before7 = document.querySelector('#modal header h2')?.textContent?.trim();
      el.click();
      await new Promise((r) => setTimeout(r, 200));
      const after7 = document.querySelector('#modal header h2')?.textContent?.trim();
      const count = document.querySelectorAll('#modal [data-a="devRun"]').length;
      return { before7, after7, count };
    },
    wait: 300,
    shot: 'devmenu_open',
  },
  { label: '② chạy Setup full Nhà hàng + 13 nâng cấp + 2 bếp 2 bàn' },
  {
    eval: async () => {
      const btn = document.querySelector('#modal [data-k="setup_nhahang_full"]');
      btn.click();
      await new Promise((r) => setTimeout(r, 300));
      const g0 = window.__game, R = window.__R;
      return {
        modalOpen: !document.querySelector('#modal')?.classList.contains('hide'),
        tier: g0.g.stall.tier,
        open: g0.g.stall.open,
        cap: R.stallCap(g0.g),
        sous: R.sousCount(g0.g),
        helpers: R.helperCount(g0.g),
      };
    },
    wait: 400,
  },
  { label: '③ mở lại Cài đặt -> xác nhận reset bộ đếm -> test Va chạm Nặng & Hồi 125/125' },
  {
    eval: async () => {
      const g0 = window.__game;
      g0.ui.panel('settings');
      await new Promise((r) => setTimeout(r, 150));
      const resetOk = !!document.querySelector('#dev-unlock');
      const el = document.querySelector('#dev-unlock');
      for (let i = 0; i < 7; i++) el.click();
      await new Promise((r) => setTimeout(r, 150));
      document.querySelector('#modal [data-k="hit_heavy"]').click();
      await new Promise((r) => setTimeout(r, 150));
      const hpAfterHit = g0.g.st.health;
      const stun = g0.player.stunT;
      // Mở lại để test nút hồi 125/125
      g0.ui.panel('settings');
      await new Promise((r) => setTimeout(r, 150));
      for (let i = 0; i < 7; i++) document.querySelector('#dev-unlock').click();
      await new Promise((r) => setTimeout(r, 150));
      document.querySelector('#modal [data-k="stats_full_125"]').click();
      await new Promise((r) => setTimeout(r, 150));
      const hpRestored = g0.g.st.health;
      return { resetOk, hpAfterHit, stun: +stun.toFixed(2), hpRestored };
    },
    wait: 300,
  },
];
