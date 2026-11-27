// MỤC “VỪA THAY ĐỔI” TRONG MENU ẨN (lượt 69). Người chơi yêu cầu: menu ẩn phải có một mục cho đúng cái vừa
// sửa, để người làm game bấm là thử được ngay. Probe bấm CHUỘT THẬT: 8 lần “Cài đặt” → mã 438291 → nhóm đầu
// có đúng đồ của bản mới nhất; bấm “Chạy” từng mục ⇒ đứng đúng chỗ, mở sẵn bảng tương tác, đồng hồ KHÔNG nhích.
// Chạy: cd tools/probe && node play.mjs steps/menu69.mjs
import { boot, fresh } from '../lib.mjs';
import { mkdirSync } from 'node:fs';
const OUT = 'menu69/';
try { mkdirSync(new URL('../out/' + OUT, import.meta.url), { recursive: true }); } catch { /* đã có */ }

export default [boot, fresh(9 * 60),
  // `page.evaluate` chỉ mang được DỮ LIỆU vào trang, không mang được hàm ⇒ gắn bộ helper vào `window` một lần.
  { eval: () => {
    const g0 = () => window.__game;
    window.__h = {
      moCaiDat: () => { const g = g0(); if (g.ui.modalName !== 'settings') g.ui.panel('settings'); return g.ui.modalName; },
      goMa: () => {
        const u = document.querySelector('#dev-unlock'); if (u) for (let i = 0; i < 8; i++) u.click();
        for (const d of '438291') { const b = document.querySelector(`[data-pin="${d}"]`); if (b) b.click(); }
        return !!document.querySelector('[data-a="devRun"]');
      },
      menu: () => ({ nhóm: [...document.querySelectorAll('#modal .body h4')].map((h) => h.innerText.replace(/\s+/g, ' ').trim()),
        mục: [...document.querySelectorAll('[data-a="devRun"]')].map((b) => b.dataset.k) }),
      /** Bấm CHUỘT THẬT vào nút “Chạy” của một mục — trả toạ độ nguyên cho puppeteer. */
      run: (id) => { const g = g0();
        if (!document.querySelector(`[data-a="devRun"][data-k="${id}"]`)) { if (g.ui.modalName !== 'settings') g.ui.panel('settings'); }
        const b = document.querySelector(`[data-a="devRun"][data-k="${id}"]`); if (!b) return [];
        b.scrollIntoView({ block: 'center' });
        const r = b.getBoundingClientRect();
        return [[Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]];
      },
      oDau: () => { const g = g0(), p = g.player;
        return { x: +p.x.toFixed(1), z: +p.z.toFixed(1), kẹt: g.world.blocked(p.x, p.z, 0.34), phút: Math.round(g.g.min) }; },
      noi: () => { const d = document.querySelector('#dlg');
        return { mo: !!d && !d.classList.contains('hide'), soNut: d ? d.querySelectorAll('.opts .btn').length : 0,
          chu: (d?.querySelector('p')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 100) }; },
      dongHo: () => ({ phút: Math.round(g0().g.min), ngày: g0().g.day }),
    };
    return Object.keys(window.__h);
  }, quiet: true },
  { label: '① mở menu ẩn bằng chuột thật: 8 lần “Cài đặt” → mã 438291' },
  { eval: () => window.__h.moCaiDat(), quiet: true, wait: 400 },
  { eval: () => window.__h.goMa(), wait: 500 },
  { eval: () => window.__h.menu() },
  { shot: OUT + '01_menu' },
  { label: '② bấm mục ① xe nước mía: đứng cạnh xe + mở sẵn bảng của Cô Hai Mía, đồng hồ không nhích' },
  { eval: () => window.__h.dongHo(), quiet: true },
  { clickEval: () => window.__h.run('mx_mia_xe'), wait: 900 },
  { eval: () => (() => ({ chỗ: window.__h.oDau(), nói: window.__h.noi() }))(), wait: 900 },
  { shot: OUT + '02_xe_mia' },
  { label: '③ mục ② quán nước mía trên phố: tới quán + mở sẵn bảng Chú Tư Mía' },
  { eval: () => window.__h.dongHo(), quiet: true },
  { clickEval: () => window.__h.run('mx_mia_quan'), wait: 900 },
  { eval: () => (() => ({ chỗ: window.__h.oDau(), nói: window.__h.noi() }))(), wait: 900 },
  { shot: OUT + '03_quan_mia' },
  { label: '④ mục ③ công trường: tới chòi công trình + mở sẵn bảng Anh Sáu Lực' },
  { clickEval: () => window.__h.run('mx_phu_ho'), wait: 900 },
  { eval: () => (() => ({ chỗ: window.__h.oDau(), nói: window.__h.noi() }))(), wait: 900 },
  { shot: OUT + '04_phu_ho' },
  { label: '⑤ mục ⑤ con số: giá vốn nước mía + tiền thuê tháng' },
  { clickEval: () => window.__h.run('mx_mua_mon'), wait: 800 },
  { eval: () => ({ mở: !document.querySelector('#dlg')?.classList.contains('hide'),
    chu: (document.querySelector('#dlg p')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 400) }) },
  { shot: OUT + '05_con_so' },
  { label: '⑥ mục ⑥ mở lại nhật ký: bản mới nhất là Lượt 69' },
  { clickEval: () => window.__h.run('mx_nhat_ky'), wait: 800 },
  { eval: () => ({ bảng: window.__game.ui.modalName, chu: (document.querySelector('#modal .body')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 160) }) },
  { shot: OUT + '06_nhat_ky' },
  { label: '⑦ đồng hồ trong ngày vẫn y nguyên (540 phút = 9h) và không lỗi console' },
  { eval: () => window.__h.dongHo() },
];
