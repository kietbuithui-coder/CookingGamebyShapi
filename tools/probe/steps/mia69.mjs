// NƯỚC MÍA + PHỤ HỒ + THUÊ THÁNG (lượt 69): xe mía trong chợ và quán Nước Mía 3K trên phố đều chạm được,
// bán/mua/học nghề/phụ ca chạy thật; công trường có chòi tuyển phụ hồ; gói tháng thuê nhà đúng 28 ngày −20 %.
// Chạy: cd tools/probe && node play.mjs steps/mia69.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'mia69/';
// Thư mục ảnh phải có sẵn (probe không tự tạo); thiếu là mọi bước `shot` báo ENOENT.
import { mkdirSync } from 'node:fs';
try { mkdirSync(new URL('../out/' + OUT, import.meta.url), { recursive: true }); } catch { /* đã có */ }

const pickOpt = (text) => ({ clickEval: (t) => {
  const bs = [...document.querySelectorAll('#dlg .opts .btn')];
  const b = bs.find((x) => x.textContent.toLowerCase().includes(String(t).toLowerCase()));
  if (!b) return [];
  const r = b.getBoundingClientRect();
  return [[r.x + r.width / 2, r.y + r.height / 2]];
}, args: [text] });

export default [boot, fresh(9 * 60),
  { label: '① xe mía có thật trong Chợ Xóm Chiều, Cô Hai Mía đứng đó' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors;
    const cart = A.v_mia_xe, n = g0.npcs.fixed.get('mia_xe');
    return {
      neoXe: cart ? { x: +cart.x.toFixed(2), z: +cart.z.toFixed(2) } : null,
      nguoi: n ? { ten: n.name, state: n.state, x: +n.x.toFixed(2), z: +n.z.toFixed(2) } : null,
      tenHang: Object.keys(g0.world.anchors).filter((k) => /mia/.test(k)),
    };
  } },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_mia_xe; g0.player.place(v.x + 1.0, v.z + 3.4, 0, 0); window.__cam(v.x + 2.2, 2.4, v.z + 6.4, v.x, 1.0, v.z); return 1; }, quiet: true, wait: 3000 },
  { shot: OUT + '01_xe_mia' },
  { label: '② chạm vào xe: mở thực đơn nước mía (ly 3.000₫ / ly lớn 5.000₫)' },
  { eval: () => { const g0 = window.__game, n = g0.npcs.fixed.get('mia_xe'); g0.acts.talk(n); const d = document.querySelector('#dlg'); return { chu: d.querySelector('p').textContent.slice(0, 160), nut: [...d.querySelectorAll('.opts .btn')].map((b) => b.textContent) }; }, wait: 700 },
  { shot: OUT + '02_thuc_don' },
  { label: '③ mua một ly: trừ 3.000₫, giải khát, ghi vào sổ bán trong ngày' },
  pickOpt('3.000'),
  { eval: () => { const g = window.__game.g; return { tien: g.cash, khat: Math.round(g.st.thirst), daBan: g.wd.miaSold }; }, wait: 600 },
  { label: '④ xin phụ bán một ca: 45 phút, có công, đếm ca' },
  { eval: () => { const g0 = window.__game, n = g0.npcs.fixed.get('mia_xe'); g0.g.st.energy = 90; g0.acts.talk(n); return document.querySelectorAll('#dlg .opts .btn').length; }, wait: 700 },
  pickOpt('phụ bán'),
  { eval: () => { const g = window.__game.g; return { gio: +(g.min / 60).toFixed(2), ca: g.wd.miaShifts, tien: g.cash }; }, wait: 900 },
  { shot: OUT + '03_phu_ca' },
  { label: '⑤ quán Nước Mía 3K trên phố: đúng lô mặt tiền, có người bán' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors, n = g0.npcs.fixed.get('mia_quan');
    const v = A.v_mia_quan;
    return { neo: v ? { x: +v.x.toFixed(2), z: +v.z.toFixed(2) } : null, nguoi: n ? { ten: n.name, state: n.state } : null };
  } },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_mia_quan; g0.player.place(v.x + 1.2, v.z + 3.8, 0, 0); window.__cam(v.x + 2.6, 2.6, v.z + 7.0, v.x, 1.1, v.z); return 1; }, quiet: true, wait: 3000 },
  { shot: OUT + '04_quan_mia' },
  { label: '⑥ học nghề nước mía ở quán (20.000₫) rồi sơ chế thử ở nhà' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.rel.mia_quan = { v: 30, n: 4, last: -1 }; g.st.mood = 60; g0.acts.talk(g0.npcs.fixed.get('mia_quan')); const d = document.querySelector('#dlg'); return { chu: d.querySelector('p').textContent.slice(0, 120), nut: [...d.querySelectorAll('.opts .btn')].map((b) => b.textContent) }; }, wait: 700 },
  pickOpt('Hỏi xin chỉ'),
  { eval: () => {
    const bs = [...document.querySelectorAll('#dlg .opts .btn')], b = bs.find((x) => /^Học/.test(x.textContent));
    return b ? { coNutHoc: true, nut: bs.map((x) => x.textContent) } : { coNutHoc: false, nut: bs.map((x) => x.textContent) };
  }, wait: 500 },
  { clickEval: () => {
    const bs = [...document.querySelectorAll('#dlg .opts .btn')], b = bs.find((x) => /^Học/.test(x.textContent));
    if (!b) return [];
    const r = b.getBoundingClientRect();
    return [[Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]];
  }, wait: 800 },
  { eval: () => { const g = window.__game.g; return { biet: g.rec.nuoc_mia.known, tien: g.cash }; }, wait: 600 },
  { label: '⑦ công trường: chòi tuyển phụ hồ + Anh Sáu Lực, xin một ca 90 phút' },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_site; g0.player.place(v.x + 0.6, v.z + 2.2, Math.PI, 0); window.__cam(v.x + 2.0, 2.4, v.z + 6.0, v.x, 1.1, v.z); return { neo: { x: +v.x.toFixed(2), z: +v.z.toFixed(2) }, nguoi: !!g0.npcs.fixed.get('site') }; }, quiet: true, wait: 2600 },
  { shot: OUT + '05_cong_truong' },
  { eval: () => { const g0 = window.__game, n = g0.npcs.fixed.get('site'); g0.g.min = 8 * 60; g0.acts.talk(n); const d = document.querySelector('#dlg'); return { chu: d.querySelector('p').textContent.slice(0, 140), nut: [...d.querySelectorAll('.opts .btn')].map((b) => b.textContent) }; }, wait: 800 },
  { shot: OUT + '06_phu_ho' },
  { label: '⑧ thuê nhà theo tháng: 28 ngày, rẻ hơn 4 tuần lẻ 20 %' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.cash = 9000000; g.rep = 60; return { truoc: g.housing, tien: g.cash }; } },
  { eval: () => {
    const g = window.__game.g, R = window.__R;
    const tuan = R.planRent('tro', 'tuần'), thang = R.planRent('tro', 'tháng');
    const ok = R.payHousing(g, 'tro', 'tháng');
    const o = { o: g.housing, ok, toiNgay: g.paidUntil, goi: R.rentPlanOf(g), tien: g.cash, tuan, thang, bot: +(1 - thang / (tuan * 4)).toFixed(2) };
    return o;
  }, wait: 300 },
  { eval: () => { const g = window.__game.g, R = window.__R; g.rentPlan = g.rentPlan || {}; g.paidUntil = g.day + 28; return { thangSau: R.nextRent(g), nhan: R.rentDue(g), goi: R.rentPlanOf(g) }; } },
  { label: '⑨ không lỗi console' },
];
