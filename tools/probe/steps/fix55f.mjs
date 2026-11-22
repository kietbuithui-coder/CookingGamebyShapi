// Lượt 57 (f): bấm đúng 3 mục test mới trong menu ẩn, kiểm rào bật/tắt và số xe nằm trong đoạn cấm.
import { boot, fresh } from '../lib.mjs';
const tap = (ids) => ({ eval: async (ids) => {
  const g0 = window.__game, D = await import('/src/game/devPoints.ts'), R2 = await import('/src/game/roads.ts');
  const all = D.getDevSections().flatMap((s) => s.items);
  const out = [];
  for (const id of ids) {
    const it = all.find((i) => i.id === id);
    if (!it) { out.push({ id, err: 'thiếu mục' }); continue; }
    g0.ui.closeDialog(); g0.mode = 'play';
    it.run();
    // đóng hộp thoại mục “đo” để đọc được nội dung, rồi bấm lại lần nữa cho chắc
    const txt = (document.querySelector('.dlg, #dlg') || { innerText: '' }).innerText.slice(0, 220);
    g0.ui.closeDialog(); g0.mode = 'play';
    const inBlock = g0.traffic.list.filter((r) => r.axis === 1 && Math.abs(r.road + 29.5) < 0.5 && r.pos > -25 && r.pos < 25).length;
    out.push({ id, roadblock: R2.roadblockActive(), cars: g0.traffic.list.length, inBlock, txt: id.includes('do') ? txt : undefined });
  }
  return out;
}, args: [ids], timeout: 60000, wait: 400 });
export default [boot, fresh(8 * 60),
  { eval: () => { window.__game.set.quality = 3; window.__game.applyQuality(); return 1; }, quiet: true, wait: 400 },
  tap(['t57_cam_duong_bat', 't57_cam_duong_do', 't57_cam_duong_tat']),
];
