// Lượt 57: bật sự kiện “Cấm đường” rồi đo xe cộ thật — có chiếc nào lọt vào đoạn giữa hai hàng rào không.
// Đoạn cấm: tuyến dọc z có tâm x = −29,5, hai vạch z = ±25 (rào dựng ở city.ts).
import { boot, fresh } from '../lib.mjs';
const setup = { eval: async () => {
  const g0 = window.__game, g = g0.g, R = window.__R;
  const L = await import('/src/world/layout.ts');
  g0.set.quality = 3; g0.applyQuality();                 // mức Cao: 5 xe
  g.min = 8 * 60;
  R.startEvent(g, 'cam_duong');
  // đứng gần đoạn cấm để xe sinh quanh đó
  g0.player.place(-29.5, -12, 0, 0);
  window.__seen = []; window.__inBlock = [];
  window.__z = (r) => (r.axis === 0 ? r.road + r.lane : r.pos);
  window.__x = (r) => (r.axis === 0 ? r.pos : r.road + r.lane);
  return { roadblock: g0.city.roadblock.visible, cars: g0.traffic.list.length };
}, wait: 600 };
const run = (n) => ({ eval: async (n) => {
  const g0 = window.__game;
  for (let i = 0; i < n; i++) {
    g0.traffic.update(0.05);
    for (const r of g0.traffic.list) {
      const x = window.__x(r), z = window.__z(r);
      if (Math.abs(x + 29.5) < 9) {
        window.__seen.push({ x: +x.toFixed(1), z: +z.toFixed(1) });
        if (z > -25 && z < 25) window.__inBlock.push({ x: +x.toFixed(1), z: +z.toFixed(1) });
      }
    }
    if (i % 40 === 0) await new Promise((r) => setTimeout(r, 2));
  }
  return { samples: window.__seen.length, inBlock: window.__inBlock.slice(0, 8), inBlockCount: window.__inBlock.length };
}, args: [n], timeout: 180000 });
export default [boot, fresh(8 * 60),
  { label: '① bật cấm đường, đứng cạnh đoạn bị rào' }, setup,
  { eval: () => { window.__fast(true); return 1; }, quiet: true, wait: 400 },
  run(300), run(300), run(300), run(300),
  { label: '② đối chứng: tắt luật rào cho xe (như trước lượt 57) — phải thấy xe lọt vào đoạn cấm' },
  { eval: async () => {
    const R2 = await import('/src/game/roads.ts');
    R2.setRoadblock(false);            // chỉ tắt phần XE; rào vẫn vẽ, NPC vẫn đi vòng như cũ
    window.__seen.length = 0; window.__inBlock.length = 0;
    return { daTat: !R2.roadblockActive() };
  }, wait: 200 },
  run(300), run(300),
  { eval: async () => {
    const R2 = await import('/src/game/roads.ts');
    R2.setRoadblock(true);
    return { batLai: R2.roadblockActive(), xuyenRao: window.__inBlock.length };
  }, wait: 200 },
  { eval: () => {
    window.__fast(false);
    const g0 = window.__game;
    // quay camera về phía rào bắc cho dễ nhìn
    // đứng ngay trên tuyến bị rào, nhìn về hàng rào phía bắc (z = 25) từ trên cao
    g0.player.place(-29.5, 30, Math.PI, 0);
    g0.player.camTo = { pos: g0.camera.position.clone().set(-29.5, 3.2, 34), look: g0.camera.position.clone().set(-29.5, 0.9, 25), fov: 62 };
    g0.ui.$('quest').style.display = 'none'; g0.ui.$('toasts').style.display = 'none';
    return { zRange: [+Math.min(...window.__seen.map((s) => s.z)).toFixed(1), +Math.max(...window.__seen.map((s) => s.z)).toFixed(1)] };
  }, wait: 1500 },
  { shot: 'f57_rao_cam_duong' },
  { eval: () => { const g0 = window.__game; g0.player.camTo = null; g0.ui.$('quest').style.display = ''; g0.ui.$('toasts').style.display = ''; return 1; }, quiet: true },
];
