// Lượt 67 — soát lại MENU ẨN sau lượt 66: bấm 8 lần chữ “Cài đặt” + mã 438291 có mở được không,
// có đúng 1 nhóm “Địa điểm — tele nhanh” không, và TỪNG MỤC có đưa người chơi tới đúng chỗ,
// đứng trên sàn (không kẹt trong tường/quầy), cách cái neo của nhân vật đúng vài mét hay không.
// Bấm bằng CHUỘT THẬT vào toạ độ nút trên màn hình, không gọi hàm.
//
// Lưu ý cho người viết probe: `page.mouse.click()` của puppeteer chỉ nhận số NGUYÊN. Toạ độ trả về mà lẻ
// (r.x + r.width/2 = 770.375) thì `clickEval` chết với “Failed to deserialize params.x” và click không xảy ra —
// luôn `Math.round` trước khi trả, và trả về mảng phẳng (không bọc trong mảng của mảng hai lớp).
import { boot, fresh } from '../lib.mjs';
const OUT = 'dev67/';
/**
 * Toạ độ tâm một nút — số nguyên (puppeteer chỉ nhận số nguyên), và MỞ LẠI bảng Cài đặt nếu vừa bị đóng:
 * bấm “Chạy” một mục đi nhanh là `ui.closePanel()` đóng bảng, nên muốn bấm mục kế phải mở lại (menu ẩn đã nhớ
 * mã trong phiên nên mở lại là thấy danh sách ngay, không phải gõ lại 6 số).
 */
const tâm = (sel) => { const g0 = window.__game;
  if (!document.querySelector(sel)) { if (g0.ui.modalName !== 'settings') g0.ui.panel('settings'); }
  const b = document.querySelector(sel); if (!b) return null;
  b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect();
  return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; };
// Gọi panel('settings') khi bảng Cài đặt ĐANG mở là bấm-tắt nó (panel tự toggle) — chỉ mở khi chưa mở.
const mởCàiĐặt = () => { const g0 = window.__game; if (g0.ui.modalName !== 'settings') g0.ui.panel('settings'); return g0.ui.modalName; };
const bấmLần = (n) => { const u = document.querySelector('#dev-unlock'); for (let i = 0; i < n; i++) u.click(); return !!document.querySelector('[data-pin]'); };
const bànPhím = () => ({ có: !!document.querySelector('[data-pin]'), phím: [...document.querySelectorAll('[data-pin]')].map((b) => b.dataset.pin), chấm: document.querySelectorAll('#modal .body div span').length });
const menuMở = () => ({ đãMở: !!document.querySelector('[data-a="devRun"]'),
  nhóm: [...document.querySelectorAll('#modal .body h4')].map((h) => h.innerText),
  sốMục: document.querySelectorAll('[data-a="devRun"]').length,
  mục: [...document.querySelectorAll('[data-a="devRun"]')].map((b) => b.dataset.k),
  bảnDựng: (document.querySelector('#modal .body p')?.innerText || '').slice(0, 110) });
const ởĐâu = (anchor) => { const g0 = window.__game, p = g0.player, a = g0.world.anchors[anchor];
  const d = a ? Math.hypot(p.x - a.x, p.z - a.z) : -1;
  return { neo: anchor, x: +p.x.toFixed(1), z: +p.z.toFixed(1), cách: +d.toFixed(2),
    kẹt: g0.world.blocked(p.x, p.z, 0.34), y: +(p.y ?? 0).toFixed(2), phút: Math.round(g0.g.min) }; };
/** Đọc đồng hồ trong ván (phút tuyệt đối) — dùng để canh “đi nhanh KHÔNG đổi giờ”. */
const đồngHồ = () => { const g = window.__game.g; return { phút: Math.round(g.min), giờ: +(g.min % 1440 / 60).toFixed(2), ngày: g.day }; };
const toastCuối = () => ([...(document.querySelectorAll('#toasts .toast'))].map((t) => t.innerText.replace(/\s+/g, ' ').trim()).slice(-2));

/** [mã mục, neo, khoảng cách hợp lý tối thiểu, tối đa] — mục nào cũng phải đứng SÁT neo của người đó. */
const MỤC = [
  ['tp_equip', 'v_equip', 0.8, 3.2],
  ['tp_mart', 'v_mart', 0.8, 3.2],
  ['tp_wholesale', 'v_wholesale', 0.8, 3.2],
  ['tp_kiosk', 'v_kiosk', 0.8, 3.2],
  ['tp_eatery', 'v_eatery', 0.8, 3.2],
  ['tp_pharmacy', 'v_pharmacy', 0.8, 3.2],
  ['tp_bank', 'v_bank', 0.8, 3.2],
  ['tp_pawn', 'v_pawn', 0.8, 3.2],
  ['tp_hot_toc', 'v_hot_toc', 0.8, 3.2],
  ['tp_thoi_trang', 'v_thoi_trang', 0.8, 3.2],
  ['tp_canho', 'bell_canho', 0.8, 3.6],
  ['tp_tro', 'v_tro', 0.8, 3.2],
  ['tp_hotel', 'v_hotel', 0.8, 3.2],
  ['tp_motel', 'v_motel', 0.8, 3.2],
  ['tp_hospital', 'v_hospital', 0.8, 3.2],
  ['tp_police', 'v_police', 0.8, 3.2],
  ['tp_hobo', 'v_hobo', 1.2, 3.8],
  ['tp_chu_ba', 'v_chu_ba', 0.8, 3.2],
  ['tp_tra_da', 'v_tra_da', 0.8, 3.2],
  ['tp_sua_xe', 'v_sua_xe', 0.8, 3.2],
  ['tp_hat_rong', 'v_hat_rong', 0.8, 3.2],
  ['tp_danh_co', 'v_danh_co', 0.8, 3.2],
  ['tp_danh_giay', 'v_danh_giay', 0.8, 3.2],
  ['tp_rap', 'v_rap', 0.8, 3.2],
  ['tp_dua', 'v_dua', 0.8, 3.2],
  ['tp_net', 'v_net', 0.8, 3.2],
  ['tp_cafe', 'v_cafe', 0.8, 3.2],
  ['tp_scrap2', 'v_scrap2', 0.8, 3.2],
];

const steps = [boot, fresh(9 * 60),
  { label: '① bấm 7 lần: CHƯA hiện bàn phím (đủ khó để không bấm nhầm)' },
  { eval: (s) => eval('(' + s + ')()'), args: [mởCàiĐặt.toString()] },
  { eval: (s, n) => eval('(' + s + ')')(n), args: [bấmLần.toString(), 7], max: 300 },
  { label: '② bấm lần thứ 8: hiện bàn phím số (10 số + Xoá + C)' },
  { eval: (s) => eval('(' + s + ')()'), args: [mởCàiĐặt.toString()] },
  { eval: (s, n) => eval('(' + s + ')')(n), args: [bấmLần.toString(), 8], max: 300 },
  { eval: (s) => eval('(' + s + ')()'), args: [bànPhím.toString()], max: 600 },
  { shot: OUT + '01_ban_phim' },
  { label: '③ gõ mã 438291 bằng chuột thật → menu mở' },
];
for (const d of '438291') steps.push({ clickEval: (s, k) => { const p = eval('(' + s + ')')(k); return p ? [p] : []; }, args: [tâm.toString(), `[data-pin="${d}"]`], gap: 200 });
steps.push({ eval: (s) => eval('(' + s + ')()'), args: [menuMở.toString()], max: 1600 });
steps.push({ shot: OUT + '02_menu' });

steps.push({ label: '④ đồng hồ TRƯỚC khi bấm bất kỳ mục nào' });
steps.push({ eval: (s) => eval('(' + s + ')()'), args: [đồngHồ.toString()], max: 300 });
for (const [id, neo] of MỤC) {
  steps.push({ label: '④ ' + id + ' → đo chỗ đứng so với ' + neo });
  steps.push({ clickEval: (s, k) => { const p = eval('(' + s + ')')(k); return p ? [p] : []; }, args: [tâm.toString(), `[data-a="devRun"][data-k="${id}"]`], gap: 300 });
  steps.push({ eval: (s, a) => eval('(' + s + ')')(a), args: [ởĐâu.toString(), neo], wait: 500, max: 400 });
}

steps.push({ label: '⑤ đồng hồ SAU 28 lần bấm — phải y nguyên (không tua)' });
steps.push({ eval: () => { const g = window.__game.g; return { phút: Math.round(g.min), giờ: +(g.min % 1440 / 60).toFixed(2) }; }, max: 300 });
steps.push({ label: '⑥ hai mục mặt bằng (không có neo riêng) — đo chỗ đứng, đồng hồ vẫn không đổi' });
steps.push({ eval: () => { const g0 = window.__game, p = g0.player; return { spot: 'giữa đường', x: +p.x.toFixed(1), z: +p.z.toFixed(1), kẹt: g0.world.blocked(p.x, p.z, 0.34) }; } });
for (const id of ['tp_matbang_tb', 'tp_matbang_dc']) {
  steps.push({ clickEval: (s, k) => { const p = eval('(' + s + ')')(k); return p ? [p] : []; }, args: [tâm.toString(), `[data-a="devRun"][data-k="${id}"]`], gap: 300 });
  steps.push({ eval: () => { const g0 = window.__game, p = g0.player; return { x: +p.x.toFixed(1), z: +p.z.toFixed(1), kẹt: g0.world.blocked(p.x, p.z, 0.34), y: +(p.y ?? 0).toFixed(2) }; }, wait: 500, max: 300 });
}
steps.push({ label: '⑦ bồn rửa tay khi CHƯA dựng nhà hàng → phải báo “Cần dựng nhà hàng trước.”' });
steps.push({ clickEval: (s, k) => { const p = eval('(' + s + ')')(k); return p ? [p] : []; }, args: [tâm.toString(), '[data-a="devRun"][data-k="tp_lavabo"]'], gap: 400 });
steps.push({ eval: (s) => eval('(' + s + ')()'), args: [toastCuối.toString()], wait: 300, max: 400 });
steps.push({ shot: OUT + '03_lavabo' });
steps.push({ label: '⑧ ẩn & khoá lại → mở Cài đặt phải đòi mã lại' });
steps.push({ eval: (s) => eval('(' + s + ')')(), args: [mởCàiĐặt.toString()] });
steps.push({ clickEval: (s, k) => { const p = eval('(' + s + ')')(k); return p ? [p] : []; }, args: [tâm.toString(), '[data-a="devLock"]'], gap: 400 });
steps.push({ eval: () => ({ lộMenuNgay: !!document.querySelector('[data-a="devRun"]'), chữ: (document.querySelector('#modal .body')?.innerText || '').slice(0, 70) }), max: 300 });
export default steps;
