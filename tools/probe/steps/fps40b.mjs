// Lượt 40 — so sánh FPS mức "Vừa" KIỂU CŨ (pr 1.5, bóng 1024, 2 đèn, 22 NPC, view 165)
// với kiểu MỚI (pr 1, không bóng, 1 đèn, 18 NPC, view 145) trên cùng một máy.
import { boot, fresh } from '../lib.mjs';

const MEASURE = `async function measure(ms){
  const t0 = performance.now(); let n = 0, worst = 0, last = t0;
  await new Promise((done) => { const tick = (now) => { const d = now - last; last = now; if (d > worst) worst = d; n++;
    if (now - t0 < ms) requestAnimationFrame(tick); else done(); }; requestAnimationFrame(tick); });
  return { fps: +(n / ((performance.now() - t0) / 1000)).toFixed(1), worstMs: +worst.toFixed(1) };
}`;

const OLD = `async function oldQuality(){
  const g0 = window.__game; const R = g0.renderer;
  g0.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  g0.scene.traverse(()=>{});
  R.shadowMap.enabled = true;
  g0.env.setShadows(true, 30, 1024); g0.env.setLights(2); g0.env.viewDist = 165;
  g0.camera.far = 225; g0.camera.updateProjectionMatrix();
  g0.detailOn = true;
  // NPC: mức cũ cho phép 22 — nâng hạn mức để dân phố đông lại như trước
  window.__QOLD = 2;
}`;

export default [boot, fresh(8 * 60), { wait: 2500 },
  { label: '⓪ ép mức đồ hoạ KIỂU CŨ rồi đo', eval: async (src, old) => {
      const measure = new Function('return (' + src + ')')();
      await new Function('return (' + old + ')')()();
      const g0 = window.__game;
      // đặt lại hạn mức NPC cũ bằng cách sửa bảng QUALITY trong bộ nhớ (chỉ trong lần đo này)
      g0.set.quality = 2; await new Promise((r) => setTimeout(r, 2500));
      return { kiểu: 'cũ (trước lượt 40)', ...(await measure(2500)), calls: g0.renderer.info.render.calls, tris: g0.renderer.info.render.triangles, pr: g0.renderer.getPixelRatio(), shadows: g0.renderer.shadowMap.enabled };
    }, args: [MEASURE, OLD], max: 500 },
  { label: '① chuyển sang mức "Vừa" MỚI rồi đo', eval: async (src) => {
      const measure = new Function('return (' + src + ')')();
      const g0 = window.__game; g0.set.quality = 2; g0.applyQuality(); await new Promise((r) => setTimeout(r, 2500));
      return { kiểu: 'mới (sau lượt 40)', ...(await measure(2500)), calls: g0.renderer.info.render.calls, tris: g0.renderer.info.render.triangles, pr: g0.renderer.getPixelRatio(), shadows: g0.renderer.shadowMap.enabled };
    }, args: [MEASURE], max: 500 },
  { label: '② mức "Rất thấp" (dành cho máy yếu nhất)', eval: async (src) => {
      const measure = new Function('return (' + src + ')')();
      const g0 = window.__game; g0.set.quality = 0; g0.applyQuality(); await new Promise((r) => setTimeout(r, 2500));
      return { kiểu: 'rất thấp', ...(await measure(2500)), calls: g0.renderer.info.render.calls, pr: g0.renderer.getPixelRatio(), shadows: g0.renderer.shadowMap.enabled };
    }, args: [MEASURE], max: 500 },
  { eval: async () => { const g0 = window.__game; g0.set.quality = 2; g0.applyQuality(); return 1; } },
  { shot: '53_sau_toi_uu' },
];
