// Lượt 40 — đo FPS thật ở cả 4 mức đồ hoạ (điện thoại 390×844, DPR 3) + kiểm chứng chơi offline.
import { boot, fresh } from '../lib.mjs';

// Hàm đo dùng chung, chèn vào trang dưới dạng chuỗi để mỗi bước eval tự dựng lại.
const MEASURE = `async function measure(ms){
  const t0 = performance.now(); let n = 0, worst = 0, last = t0;
  await new Promise((done) => { const tick = (now) => { const d = now - last; last = now; if (d > worst) worst = d; n++;
    if (now - t0 < ms) requestAnimationFrame(tick); else done(); }; requestAnimationFrame(tick); });
  return { fps: +(n / ((performance.now() - t0) / 1000)).toFixed(1), worstMs: +worst.toFixed(1) };
}`;

export default [boot, fresh(8 * 60), { wait: 2500 },
  { label: '⓪ mức mặc định cho điện thoại', eval: async () => {
      const g0 = window.__game;
      return { mức: g0.set.quality, tên: ['Rất thấp', 'Thấp', 'Vừa', 'Cao'][g0.set.quality], mobile: g0.mobile, dpr: devicePixelRatio,
        pr: g0.renderer.getPixelRatio(), shadows: g0.renderer.shadowMap.enabled };
    } },
  { label: '① đo FPS ở 4 mức đồ hoạ', eval: async (src) => {
      const measure = new Function('return (' + src + ')')();
      const g0 = window.__game, out = [];
      for (const q of [0, 1, 2, 3]) {
        g0.set.quality = q; g0.applyQuality(); await new Promise((r) => setTimeout(r, 1200));
        const m = await measure(1800);
        out.push({ mức: ['Rất thấp', 'Thấp', 'Vừa', 'Cao'][q], ...m,
          calls: g0.renderer.info.render.calls, tris: g0.renderer.info.render.triangles,
          pr: g0.renderer.getPixelRatio(), shadows: g0.renderer.shadowMap.enabled });
      }
      return out;
    }, args: [MEASURE], shot: '50_fps_theo_muc', max: 1200 },
  { label: '② đo lại ở mốc mặc định điện thoại (đo dài 2,5 giây)', eval: async (src) => {
      const measure = new Function('return (' + src + ')')();
      const g0 = window.__game; g0.set.quality = 2; g0.applyQuality(); await new Promise((r) => setTimeout(r, 1500));
      return measure(2500);
    }, args: [MEASURE], max: 500 },
  { label: '③ service worker có đăng ký và có kho lưu không', eval: async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const keys = await caches.keys();
      let tệp = 0, bytes = 0;
      for (const k of keys) { const c = await caches.open(k); for (const r of await c.keys()) { tệp++; const res = await c.match(r); bytes += (await res?.blob())?.size || 0; } }
      return { cóSW: !!reg, trạngThái: reg?.active?.state ?? 'không', khoLưu: keys, tệpĐãLưu: tệp, mb: +(bytes / 1048576).toFixed(2) };
    }, max: 400 },
  { label: '④ Cài đặt có nút "Lưu để chơi offline"', eval: async () => {
      const g0 = window.__game; g0.ui.panel('settings'); await new Promise((r) => setTimeout(r, 500));
      const btn = [...document.querySelectorAll('#modal button')].find((b) => /offline/i.test(b.textContent));
      const row = btn?.closest('div')?.textContent?.replace(/\s+/g, ' ').trim();
      return { cóNút: !!btn, chữ: btn?.textContent, dòng: row };
    }, shot: '51_cai_dat_offline', max: 300 },
  { label: '⑤ bấm nút lưu offline', eval: async () => {
      const btn = [...document.querySelectorAll('#modal button')].find((b) => /offline/i.test(b.textContent));
      btn?.click(); await new Promise((r) => setTimeout(r, 2000));
      const keys = await caches.keys(); let tệp = 0;
      for (const k of keys) tệp += (await caches.open(k).then((c) => c.keys())).length;
      return { đãBấm: !!btn, tệpĐãLưu: tệp };
    }, max: 200 },
  { offline: true, reload: true, wait: 4000 },
  { label: '⑥ sau khi tải lại lúc MẤT MẠNG', eval: async (src) => {
      const measure = new Function('return (' + src + ')')();
      const cv = document.getElementById('gl');
      let fps = 0;
      try { fps = (await measure(1200)).fps; } catch { /* chưa vào game */ }
      return { cóCanvas: !!cv, gameChạy: !!window.__game, chếĐộ: window.__game?.mode ?? null, fpsOffline: fps,
        dòngBáo: document.getElementById('load')?.textContent?.slice(0, 80) ?? '' };
    }, args: [MEASURE], max: 400 },
  { shot: '52_offline_sau_khi_tai_lai' },
  { offline: false },
];
