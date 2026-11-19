// Lượt 41c — điện thoại chọn mức "Cao" phải ra đúng như cũ: 2 điểm ảnh, bóng đổ 2048, 4 đèn, 32 NPC.
import { boot, fresh } from '../lib.mjs';

const shot = (name) => ({ eval: async () => 1, shot: name });

export default [boot, fresh(8 * 60), { wait: 2000 },
  { label: '⓪ máy đang giả lập là điện thoại?', eval: async () => {
      const g0 = window.__game;
      g0.ui.closePanel();
      return { mobile: g0.mobile, dpr: devicePixelRatio, màn: [innerWidth, innerHeight] };
    }, max: 200 },
  { label: '① mức "Cao" trên điện thoại: thông số thật', eval: async () => {
      const g0 = window.__game, r = g0.renderer;
      g0.set.quality = 3; g0.applyQuality(); await new Promise((res) => setTimeout(res, 1500));
      const q = g0.set.quality;
      return { mức: q, pixelRatio: r.getPixelRatio(), 'kỳ vọng pr': 2,
        shadowMap: r.shadowMap.enabled, 'bóng mapSize': g0.env.sun.shadow.mapSize.x, viewDist: g0.env.viewDist,
        lights: g0.env.lights.length, detail: g0.detailOn, calls: r.info.render.calls,
        msaa: r.getContext().getContextAttributes().antialias };
    }, max: 400 },
  shot('63_dt_cao'),
  { label: '② mức "Vừa" vẫn nhẹ như đã tối ưu (không quay lại bóng đổ)', eval: async () => {
      const g0 = window.__game, r = g0.renderer;
      g0.set.quality = 2; g0.applyQuality(); await new Promise((res) => setTimeout(res, 1200));
      return { pixelRatio: r.getPixelRatio(), shadowMap: r.shadowMap.enabled, 'bóng mapSize': g0.env.sun.shadow.mapSize.x, lights: g0.env.lights.length };
    }, max: 300 },
  { label: '③ mức "Cao" không bị tự hạ oan khi FPS còn ổn', eval: async () => {
      const g0 = window.__game;
      g0.set.quality = 3; g0.applyQuality(); g0.set.auto = true;
      const before = g0.set.quality;
      // giả lập FPS cao bằng cách đặt thẳng giá trị UI đọc
      await new Promise((res) => setTimeout(res, 2500));
      return { trước: before, sau: g0.set.quality, fps: Math.round(g0.ui.fpsVal) };
    }, max: 300 },
  { label: '④ chụp ảnh ở mức Cao để so độ nét', eval: async () => {
      const g0 = window.__game; g0.set.quality = 3; g0.applyQuality(); g0.ui.closePanel(); await new Promise((res) => setTimeout(res, 2000)); return 1;
    } },
  shot('64_dt_cao_canh'),
  { label: '⑤ Cài đặt hiện đúng mức đang chọn', eval: async () => {
      const g0 = window.__game; g0.ui.panel('settings'); await new Promise((res) => setTimeout(res, 600));
      const btns = [...document.querySelectorAll('#modal button')].filter((b) => /Rất thấp|Thấp|Vừa|Cao/.test(b.textContent));
      return { nút: btns.map((b) => b.textContent.trim() + (b.className.includes('yellow') ? ' ← đang chọn' : '')) };
    }, shot: '65_cai_dat_cao', max: 300 },
];
