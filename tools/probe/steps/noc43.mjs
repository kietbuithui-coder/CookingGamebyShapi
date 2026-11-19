// Lượt 43 — MỨC 2: nhảy lên đứng trên nóc vật thấp, đi lại trên nóc, bước ra mép thì rơi.
import { boot, fresh } from '../lib.mjs';


export default [boot, fresh(8 * 60), { wait: 2200 },
  { label: '① nhảy lên nóc ghế đá rồi đứng yên trên đó', eval: async () => {
      const g0 = window.__game, p = g0.player;
      p.place(48, -52, 0);                 // đúng giữa ghế đá (48, −52), nóc 0,6 m
      const dưới_đất = { jumpY: +p.jumpY.toFixed(3), nóc: g0.world.lowTopAt(48, -52) };
      p.jump(); for (let i = 0; i < 40; i++) p.update(1 / 60);               // bay lên rồi rơi lại
      const đứng = { jumpY: +p.jumpY.toFixed(3), vẫn_trên_nóc: Math.abs(p.jumpY - 0.6) < 0.02 };
      for (let i = 0; i < 120; i++) p.update(1 / 60);                        // đứng yên 2 giây
      return { dưới_đất, sau_khi_nhảy: đứng, đứng_yên_2s: +p.jumpY.toFixed(3), onGround: p.onGround };
    }, max: 400 },
  { label: '② đi lại TRÊN nóc ghế — không bị đẩy văng xuống', eval: async () => {
      const g0 = window.__game, p = g0.player;
      p.place(48, -52, Math.PI / 2); p.jumpY = 0.6; p.vy = 0;
      // đi ngang trên mặt ghế (ghế dài 1,7 m theo trục z vì xoay PI/2)
      const trước = { x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +p.jumpY.toFixed(2) };
      g0.input.mx = 1; g0.input.mz = 0;
      let thấpNhất = 9, lệchX = 0;
      for (let i = 0; i < 12; i++) { p.update(1 / 60); thấpNhất = Math.min(thấpNhất, p.jumpY); lệchX = Math.max(lệchX, Math.abs(p.x - 48)); }
      const giữa = { x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +p.jumpY.toFixed(2) };
      // đi tiếp tới hết mặt ghế → phải rơi xuống, và KHÔNG bị đẩy ngang
      for (let i = 0; i < 40; i++) p.update(1 / 60);
      const sau = { x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +p.jumpY.toFixed(2) };
      g0.input.mx = 0; g0.input.mz = 0;
      return { trước, 'giữa(mặt ghế)': giữa, sau, 'cao_giữ_được_khi_trên_mặt': Math.abs(thấpNhất - 0.6) < 0.05,
        'không_bị_đẩy_ngang': lệchX < 0.05, 'đã_đi_được': Math.hypot(giữa.x - trước.x, giữa.z - trước.z) > 0.15, 'rơi_khi_hết_ghế': sau.y < 0.6 };
    }, max: 400 },
  { label: '③ bước ra khỏi mép nóc → rơi xuống đất', eval: async () => {
      const g0 = window.__game, p = g0.player;
      p.place(48, -52, 0); p.jumpY = 0.6; p.vy = 0;
      p.x = 48; p.z = -52;
      p.x = 44.5; p.z = -52;               // dịch hẳn ra ngoài ghế
      for (let i = 0; i < 60; i++) p.update(1 / 60);
      return { nóc_dưới_chân: g0.world.lowTopAt(p.x, p.z), độ_cao: +p.jumpY.toFixed(3), 'đã_về_đất': p.jumpY < 0.02 };
    }, max: 300 },
  { label: '④ đứng trên nóc vẫn nhảy tiếp được nhưng không vọt lên nóc cao hơn', eval: async () => {
      const g0 = window.__game, p = g0.player;
      p.place(48, -52, 0); p.jumpY = 0.6; p.vy = 0;
      const lại = p.jump();
      let peak = 0; for (let i = 0; i < 100; i++) { p.update(1 / 60); peak = Math.max(peak, p.jumpY); }
      return { nhảy_được: lại, đỉnh: +peak.toFixed(2), 'cao_thêm_0,5m': peak - 0.6 < 0.55, 'về_lại_nóc': Math.abs(p.jumpY - 0.6) < 0.05, 'jumpY': +p.jumpY.toFixed(2) };
    }, max: 400 },
  { label: '⑤ đứng trên nóc thùng rác (vật tròn) rồi trượt ra mép', eval: async () => {
      const g0 = window.__game, p = g0.player;
      // tìm một thùng rác thật
      const bin = g0.world.circs.find((c) => c.top !== undefined);
      p.place(bin.x, bin.z, 0); p.jumpY = bin.top; p.vy = 0;
      const giữa = +p.jumpY.toFixed(2);
      p.x = bin.x + bin.r * 2; p.z = bin.z;   // nhảy ra ngoài
      for (let i = 0; i < 60; i++) p.update(1 / 60);
      return { 'nóc_thùng': +bin.top.toFixed(2), 'đứng_giữa': giữa, 'ra_ngoài_về_đất': p.jumpY < 0.02 };
    }, max: 400 },
  { label: '⑥ mức 2 không phá nhảy qua: vẫn qua được ghế khi bay 0,9 m', eval: async () => {
      const g0 = window.__game, w = g0.world;
      const o = { x: 48, z: -52 }; w.resolve(48, -52, 0.3, o, 0.9);
      const b = { x: 48, z: -52 }; w.resolve(48, -52, 0.3, b, 0.2);
      return { 'bay_0,9_qua_được': Math.hypot(o.x - 48, o.z + 52) < 0.01, 'bay_0,2_bị_chặn': Math.hypot(b.x - 48, b.z + 52) > 0.1 };
    }, max: 300 },
  { label: '⑦ dựng cảnh đứng trên nóc ghế đá để chụp ảnh', eval: async () => {
      const g0 = window.__game, p = g0.player;
      g0.ui.closePanel && g0.ui.closePanel();
      if (!g0.set.cam3) p.toggleView();
      p.place(48, -52, Math.PI / 2);
      p.jumpY = 0.6; p.vy = 0;
      for (let i = 0; i < 20; i++) p.update(1 / 60);
      return { x: p.x, z: p.z, độ_cao: p.jumpY, cam3: g0.set.cam3 };
    }, max: 400 },
  { wait: 900 },
  { shot: '67_dung_tren_noc' },
];
