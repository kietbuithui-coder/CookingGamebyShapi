// Lượt 42 — nhảy thật: vượt được ghế đá/bàn nhựa/thùng rác, nhưng KHÔNG lọt qua tường nhà.
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(8 * 60), { wait: 2200 },
  { label: '① độ cao nhảy thật + nóc vật thấp quanh công viên', eval: async () => {
      const g0 = window.__game, p = g0.player;
      // nhảy thử và đo đỉnh
      p.place(48, -52 + 3, 0);            // cạnh ghế đá công viên (48, -52)
      p.jump();
      let peak = 0;
      for (let i = 0; i < 90; i++) { p.update(1 / 60); peak = Math.max(peak, p.jumpY); }
      return { đỉnh_nhảy: +peak.toFixed(2), 'kỳ vọng ≈0,95': true, dưới_đất_lại: p.jumpY < 0.01 };
    }, max: 300 },
  { label: '② nhảy qua ghế đá: đứng dưới đất thì bị chặn', eval: async () => {
      const g0 = window.__game, p = g0.player, w = g0.world;
      p.place(48, -52, 0);
      const o = { x: p.x, z: p.z };
      w.resolve(p.x, p.z, 0.3, o, 0);
      return { bị_đẩy: +Math.hypot(o.x - p.x, o.z - p.z).toFixed(2), 'nóc_ghế': w.lowTopAt(48, -52) };
    }, max: 300 },
  { label: '③ đang bay cao 0,9 m thì đi qua ghế đá được', eval: async () => {
      const g0 = window.__game, w = g0.world;
      const o = { x: 48, z: -52 };
      w.resolve(48, -52, 0.3, o, 0.9);
      return { lệch: +Math.hypot(o.x - 48, o.z + 52).toFixed(3), 'qua_được': Math.hypot(o.x - 48, o.z + 52) < 0.01 };
    }, max: 300 },
  { label: '④ tường nhà: bay cao 5 m vẫn KHÔNG lọt vào', eval: async () => {
      const g0 = window.__game, w = g0.world;
      // tìm một hộp cao (tường) gần người chơi
      const wall = w.boxes.find((b) => b.top === undefined && b.x1 - b.x0 > 2 && b.z1 - b.z0 > 2);
      const cx = (wall.x0 + wall.x1) / 2, cz = (wall.z0 + wall.z1) / 2;
      const res = [];
      for (const feet of [0, 1, 5, 20]) { const o = { x: cx, z: cz }; w.resolve(cx, cz, 0.3, o, feet); res.push({ feet, lọt_vào: Math.hypot(o.x - cx, o.z - cz) < 0.01 }); }
      return res;
    }, max: 400 },
  { label: '⑤ đếm vật thấp nhảy qua được trong thành phố', eval: async () => {
      const g0 = window.__game, w = g0.world;
      const lowBox = w.boxes.filter((b) => b.top !== undefined);
      const lowCirc = w.circs.filter((c) => c.top !== undefined);
      const heights = [...new Set(lowBox.map((b) => b.top))].sort((a, b) => a - b);
      return { 'hộp thấp': lowBox.length, 'tròn thấp': lowCirc.length, 'tổng': lowBox.length + lowCirc.length,
        'các mốc cao': heights.slice(0, 12), 'tường cao': w.boxes.filter((b) => b.top === undefined).length };
    }, max: 400 },
  { label: '⑥ cảnh báo: đồ thấp ở chợ/quầy vẫn bị chặn khi đi bộ', eval: async () => {
      const g0 = window.__game, w = g0.world, p = g0.player;
      // thử ở bàn trà đá (−34,3 ; 53,4) đã khai báo top 0,5
      const o1 = { x: -34.3, z: 53.4 }; w.resolve(-34.3, 53.4, 0.3, o1, 0);
      const o2 = { x: -34.3, z: 53.4 }; w.resolve(-34.3, 53.4, 0.3, o2, 0.9);
      return { 'dưới đất bị chặn': Math.hypot(o1.x + 34.3, o1.z - 53.4) > 0.1, 'bay qua được': Math.hypot(o2.x + 34.3, o2.z - 53.4) < 0.01 };
    }, max: 300 },
  { shot: '66_nhay' },
];
