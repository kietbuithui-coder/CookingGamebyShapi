// Lượt 44 — nhảy qua bồn hoa / hồ nước / xe máy; chữ khi bới thùng rác không dính nhau.
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(8 * 60), { wait: 2200 },
  { label: '① bồn hoa công viên (0,42 m): đo chiều cao + đi bộ bị chặn, nhảy qua được', eval: async () => {
      const g0 = window.__game, w = g0.world;
      const pot = w.circs.find((c) => c.top !== undefined && Math.abs(c.top - 0.42) < 0.001);
      if (!pot) return { 'không_tìm_thấy_bồn_hoa': true };
      const walk = { x: pot.x, z: pot.z }; w.resolve(pot.x, pot.z, 0.3, walk, 0);
      const jump = { x: pot.x, z: pot.z }; w.resolve(pot.x, pot.z, 0.3, jump, 0.5);
      return { 'nóc_bồn': +pot.top.toFixed(2), 'bán_kính': +pot.r.toFixed(2),
        'đi_bộ_lệch': +Math.hypot(walk.x - pot.x, walk.z - pot.z).toFixed(2),
        'nhảy_qua_lệch': +Math.hypot(jump.x - pot.x, jump.z - pot.z).toFixed(3),
        'tổng_bồn_hoa': w.circs.filter((c) => c.top === 0.42).length };
    }, max: 400 },
  { label: '② thành hồ nước công viên: nhảy qua được nhưng không đứng trên mặt nước', eval: async () => {
      const g0 = window.__game, w = g0.world;
      const hồ = w.circs.find((c) => c.kind === 'trough');
      if (!hồ) return { 'không_tìm_thấy_hồ': true };
      const walk = { x: hồ.x, z: hồ.z }; w.resolve(hồ.x, hồ.z, 0.3, walk, 0);
      const jump = { x: hồ.x, z: hồ.z }; w.resolve(hồ.x, hồ.z, 0.3, jump, 0.9);
      return { 'thành_hồ': +hồ.top.toFixed(2), 'đi_bộ_chặn': Math.hypot(walk.x - hồ.x, walk.z - hồ.z) > 0.1,
        'nhảy_qua_được': Math.hypot(jump.x - hồ.x, jump.z - hồ.z) < 0.01,
        'đứng_trên_nước': w.lowTopAt(hồ.x, hồ.z) !== 0, 'trong_nước': w.troughAt(hồ.x, hồ.z) };
    }, max: 400 },
  { label: '③ đứng giữa hồ nước: không nhảy được, không lơ lửng trên mặt nước', eval: async () => {
      const g0 = window.__game, p = g0.player, hồ = g0.world.circs.find((c) => c.kind === 'trough');
      p.place(hồ.x, hồ.z, 0); p.jumpY = 0; p.vy = 0;
      const nhảy = p.jump();
      for (let i = 0; i < 90; i++) p.update(1 / 60);
      return { 'nhảy_được_không': nhảy, 'độ_cao': +p.jumpY.toFixed(2), 'không_lơ_lửng': p.jumpY < 0.02 };
    }, max: 400 },
  { label: '④ xe máy (yên 0,75 m) nhảy qua được', eval: async () => {
      const g0 = window.__game, w = g0.world;
      const xe = w.circs.find((c) => c.top !== undefined && Math.abs(c.top - 0.75) < 0.001);
      if (!xe) return { 'không_tìm_thấy_xe': true };
      const walk = { x: xe.x, z: xe.z }; w.resolve(xe.x, xe.z, 0.3, walk, 0);
      const jump = { x: xe.x, z: xe.z }; w.resolve(xe.x, xe.z, 0.3, jump, 0.85);
      return { 'yên_xe': xe.top, 'đi_bộ_chặn': Math.hypot(walk.x - xe.x, walk.z - xe.z) > 0.1,
        'nhảy_qua_được': Math.hypot(jump.x - xe.x, jump.z - xe.z) < 0.01, 'số_xe': w.circs.filter((c) => c.top === 0.75).length };
    }, max: 400 },
  { label: '⑤ bới thùng rác: chữ nổi là MỘT dòng, không chồng lên nhau', eval: async () => {
      const g0 = window.__game, acts = window.__acts, ui = window.__PUI ? window.__PUI.ui ?? g0.ui : g0.ui;
      const bins = g0.world.bins;
      // bới thật 4 thùng khác nhau, đếm số dòng chữ bay lên trong lúc bới
      const số_dòng = [];
      for (let i = 0; i < 4 && i < bins.length; i++) {
        const before = ui.atts ? ui.atts.filter((a) => a.kind === 'flt').length : -1;
        acts.rummage(i);
        const flt = ui.atts ? ui.atts.filter((a) => a.kind === 'flt') : [];
        số_dòng.push({ thùng: i, mới: flt.length - Math.max(0, before), chữ: flt.map((a) => a.e.textContent) });
      }
      // đọc lại nội dung các dòng vừa hiện: dấu hiệu dính chữ là 2 dòng cùng toạ độ
      const chồng = [];
      for (const a of (ui.atts ?? []).filter((x) => x.kind === 'flt' && x.p)) {
        for (const b of (ui.atts ?? []).filter((x) => x.kind === 'flt' && x.p)) {
          if (a === b || Math.abs(a.p.x - b.p.x) > 0.01 || Math.abs(a.p.z - b.p.z) > 0.01) continue;
          if (Math.abs((a.dy ?? 0) - (b.dy ?? 0)) < 0.01) chồng.push([a.e.textContent, b.e.textContent]);
        }
      }
      return { số_dòng, 'số_cặp_chồng': chồng.length, 'ví_dụ': chồng.slice(0, 2) };
    }, max: 600 },
  { shot: '68_nhay_bon_hoa' },
];
