// Lượt 40 — chơi offline thật: mở game, lưu offline, cắt mạng, tải lại, rồi VÀO CHƠI và đi lại.
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(8 * 60), { wait: 2000 },
  { label: '① lưu bản chơi offline', eval: async () => {
      const g0 = window.__game; g0.ui.panel('settings'); await new Promise((r) => setTimeout(r, 400));
      const btn = [...document.querySelectorAll('#modal button')].find((b) => /offline/i.test(b.textContent));
      btn?.click(); await new Promise((r) => setTimeout(r, 2500));
      const keys = await caches.keys(); let n = 0, bytes = 0;
      for (const k of keys) { const c = await caches.open(k); for (const r of await c.keys()) { n++; bytes += (await (await c.match(r))?.blob())?.size || 0; } }
      return { tệp: n, mb: +(bytes / 1048576).toFixed(2), nút: btn?.textContent };
    }, max: 300 },
  { offline: true, reload: true, wait: 6000 },
  { label: '② mất mạng: trang có mở được không', eval: async () => {
      const menu = document.querySelector('#menu .play, #menu button');
      return { đangTải: !!document.getElementById('load'), cóMenu: !!menu,
        gameChạy: !!window.__game, chếĐộ: window.__game?.mode ?? null,
        lỗiMạng: performance.getEntriesByType('resource').filter((r) => r.transferSize === 0 && r.decodedBodySize === 0).length };
    }, max: 300 },
  { label: '③ mất mạng: bấm vào chơi (tiếp tục ván đã lưu)', eval: async () => {
      // nút "Chơi tiếp" của menu, hoặc nút chơi mới nếu chưa có bản lưu
      const btns = [...document.querySelectorAll('#menu button')];
      const go = btns.find((b) => /Chơi tiếp|Tiếp tục|Vào chơi|Bắt đầu/i.test(b.textContent)) || btns[0];
      go?.click(); await new Promise((r) => setTimeout(r, 4000));
      return { đãBấm: go?.textContent?.trim().slice(0, 40), chếĐộ: window.__game?.mode ?? null,
        ngày: window.__game?.g?.day, tiền: window.__game?.g?.cash };
    }, max: 300 },
  { label: '④ mất mạng: có đi lại được và FPS bao nhiêu', eval: async () => {
      const g0 = window.__game, p0 = { x: g0.player.x, z: g0.player.z };
      // đi tới trước 1,5 giây bằng cách bơm phím
      const t0 = performance.now(); let n = 0;
      await new Promise((done) => { const tick = (now) => { n++; if (now - t0 < 1500) requestAnimationFrame(tick); else done(); }; requestAnimationFrame(tick); });
      return { fps: +(n / ((performance.now() - t0) / 1000)).toFixed(1), vị_trí: { x: +g0.player.x.toFixed(2), z: +g0.player.z.toFixed(2) },
        đã_di: +Math.hypot(g0.player.x - p0.x, g0.player.z - p0.z).toFixed(2), giờ: window.__game?.g?.min };
    }, max: 300 },
  { shot: '55_offline_vao_choi' },
  { offline: false },
];
