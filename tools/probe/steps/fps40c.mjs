// Lượt 40 — kiểm trên MÁY TÍNH: mức Cao vẫn có bóng đổ, MSAA bật; các mức thấp tắt bóng hẳn.
import { boot, fresh } from '../lib.mjs';

const MEASURE = `async function measure(ms){
  const t0 = performance.now(); let n = 0, worst = 0, last = t0;
  await new Promise((done) => { const tick = (now) => { const d = now - last; last = now; if (d > worst) worst = d; n++;
    if (now - t0 < ms) requestAnimationFrame(tick); else done(); }; requestAnimationFrame(tick); });
  return { fps: +(n / ((performance.now() - t0) / 1000)).toFixed(1), worstMs: +worst.toFixed(1) };
}`;

export default [boot, fresh(8 * 60), { wait: 2000 },
  { label: '⓪ mức mặc định trên máy tính', eval: async () => {
      const g0 = window.__game;
      return { mức: g0.set.quality, tên: ['Rất thấp', 'Thấp', 'Vừa', 'Cao'][g0.set.quality], mobile: g0.mobile,
        pr: g0.renderer.getPixelRatio(), shadows: g0.renderer.shadowMap.enabled, sunShadow: g0.env.sun.castShadow };
    } },
  { label: '① mức Cao: bóng đổ + MSAA', eval: async (src) => {
      const measure = new Function('return (' + src + ')')();
      const g0 = window.__game; g0.set.quality = 3; g0.applyQuality(); await new Promise((r) => setTimeout(r, 1500));
      return { ...(await measure(1500)), shadows: g0.renderer.shadowMap.enabled, pr: g0.renderer.getPixelRatio(), calls: g0.renderer.info.render.calls };
    }, args: [MEASURE], max: 300 },
  { label: '② mức Vừa trên máy tính: phải TẮT bóng hẳn', eval: async () => {
      const g0 = window.__game; g0.set.quality = 2; g0.applyQuality(); await new Promise((r) => setTimeout(r, 1200));
      return { shadowMap: g0.renderer.shadowMap.enabled, sunCast: g0.env.sun.castShadow, pr: g0.renderer.getPixelRatio(), detail: g0.detailOn };
    }, max: 300 },
  { label: '③ mức Rất thấp: tắt cả lớp chi tiết', eval: async () => {
      const g0 = window.__game; g0.set.quality = 0; g0.applyQuality(); await new Promise((r) => setTimeout(r, 1200));
      const det = g0.scene.children.length;
      return { detailOn: g0.detailOn, pr: g0.renderer.getPixelRatio(), calls: g0.renderer.info.render.calls };
    }, max: 300 },
  { label: '④ ảnh giao diện máy tính ở mức Vừa', eval: async () => {
      const g0 = window.__game; g0.set.quality = 2; g0.applyQuality(); g0.ui.panel('settings'); await new Promise((r) => setTimeout(r, 700)); return 1;
    } },
  { shot: '54_pc_cai_dat_offline' },
];
