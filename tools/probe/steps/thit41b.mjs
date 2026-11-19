// Lượt 41b — thịt/cá/hải sản tươi nay để được 1,5–2 ngày (trước chỉ vài giờ).
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(8 * 60), { wait: 2200 },
  { label: '① số giờ còn lại của từng loại thịt cá (vừa mua, để trong quầy)', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      g.cash = 500000;
      for (const id of ['ganh', 'daothot', 'bepthan', 'vi', 'noi']) if (!R.has(g, id)) R.buyGear(g, id);
      const sp = g0.stall.spots().find((s) => s.id === 'cv');
      g.stall.tier = 1; g.stall.where = 'placed'; g.stall.spot = sp.id; g.stall.x = sp.x; g.stall.z = sp.z; g.stall.yaw = sp.yaw;
      g0.stall.refresh();
      for (const id of ['heo', 'bo', 'ga', 'tom', 'ca', 'muc', 'cua']) window.__give(id, 1, 'store');
      const out = {};
      for (const id of ['heo', 'bo', 'ga', 'tom', 'ca', 'muc', 'cua']) {
        const s = g.stall.store.find((x) => x.id === id);
        out[id] = s ? Math.round(R.hoursLeft(g, s)) : null;
      }
      return out;
    }, max: 400 },
  { label: '② để 14 giờ (qua một đêm): thịt còn hay mất?', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      for (let i = 0; i < 14; i++) { R.advance(g, 60, { moving: false, running: false, working: false, sleeping: false, sleepQ: 1, sheltered: true, load: 0 }); }
      g0.stall.refresh();
      const left = (id) => { const s = g.stall.store.find((x) => x.id === id); return s ? Math.round(s.fresh) + '%' : 'mất'; };
      return { sau_14h: { heo: left('heo'), ga: left('ga'), tom: left('tom'), ca: left('ca') } };
    }, max: 400 },
  { label: '③ để thêm 34 giờ nữa (tổng 48 giờ): phải hỏng', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      for (let i = 0; i < 34; i++) { R.advance(g, 60, { moving: false, running: false, working: false, sleeping: false, sleepQ: 1, sheltered: true, load: 0 }); }
      g0.stall.refresh();
      const left = (id) => { const s = g.stall.store.find((x) => x.id === id); return s ? Math.round(s.fresh) + '%' : 'mất'; };
      const toast = document.querySelector('#toasts')?.textContent?.replace(/\s+/g, ' ') ?? '';
      return { sau_48h: { heo: left('heo'), bo: left('bo'), ga: left('ga'), tom: left('tom'), ca: left('ca'), muc: left('muc'), cua: left('cua') },
        'báo hỏng': /Thịt heo|Cá|Tôm/i.test(toast) };
    }, max: 500 },
  { label: '④ bảng Kho quầy nói đúng con số mới', eval: async () => {
      const g0 = window.__game, g = g0.g, R = window.__R;
      for (const id of ['heo', 'ga', 'tom']) window.__give(id, 1, 'store');
      g0.stall.refresh();
      g0.ui.closePanel(); g0.ui.panel('stall'); await new Promise((r) => setTimeout(r, 500));
      [...document.querySelectorAll('#modal .tab')].find((b) => /Kho quầy/.test(b.textContent))?.click();
      await new Promise((r) => setTimeout(r, 600));
      const txt = document.querySelector('#modal')?.textContent?.replace(/\s+/g, ' ') ?? '';
      const m = txt.match(/thịt cá chưa nấu[^.]*\./i) ?? txt.match(/1,5–2 ngày[^.]*\./i);
      return { câu_nhắc: m ? m[0] : '(không thấy)', 'có_1_5_2_ngày': /1,5–2 ngày/.test(txt) };
    }, shot: '62_thit_1_5_ngay', max: 400 },
];
