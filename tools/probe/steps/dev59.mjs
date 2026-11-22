// Lượt 59 — menu ẩn (Cài đặt › bấm 7 lần › mã 7777): các mục test mới của trần việc làm + bảng việc làm.
// Chạy: cd tools/probe && node play.mjs steps/dev59.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';

/** Bấm 7 lần chỗ mở khoá rồi nhập 7777 như người chơi thật. */
const moMenu = () => {
  const g0 = window.__game;
  g0.ui.panel('settings');
  const u = document.querySelector('#dev-unlock');
  if (!u) return { lỗi: 'không thấy #dev-unlock' };
  for (let i = 0; i < 7; i++) u.click();
  for (const d of '7777') document.querySelector(`[data-pin="${d}"]`)?.click();
  return { mở: !!document.querySelector('[data-a="devRun"]') };
};
/** Đọc danh sách mục trong menu ẩn. */
const danhSách = () => ({
  tag: document.querySelector('#modal .body p b')?.innerText,
  tiêuĐề: [...document.querySelectorAll('#modal .body h4')].map((h) => h.innerText),
  mục: [...document.querySelectorAll('#modal .body .item')].map((it) => ({ t: it.querySelector('b')?.innerText, id: it.querySelector('button')?.dataset.k })),
});
/** Bấm "Chạy" một mục theo mã. */
const chạy = (id) => {
  const b = document.querySelector(`[data-a="devRun"][data-k="${id}"]`);
  if (!b) return { lỗi: 'không thấy mục ' + id };
  b.click();
  return { bấm: id, modal: !document.querySelector('#modal').classList.contains('hide'), dlg: !document.querySelector('#dlg').classList.contains('hide') };
};
/** Mở lại menu ẩn (đã nhớ trong phiên) sau khi một mục đóng bảng. */
// `panel()` bấm lại đúng bảng đang mở là ĐÓNG (toggle) ⇒ phải đóng hẳn trước rồi mới mở lại.
const lại = () => {
  const g0 = window.__game;
  g0.ui.closeDialog(); g0.ui.closePanel(); g0.ui.panel('settings');
  return { mở: !!document.querySelector('[data-a="devRun"]') };
};
const số = () => {
  const g = window.__game.g, R = window.__R;
  return { giờ: +(window.__S.hourOf(g)).toFixed(2), bao: `${g.wd.sacks}/${R.DOCK_SACKS_DAY}`, caCá: `${g.wd.cargoShifts}/${R.DOCK_SHIFTS_DAY}`, caQuán: `${g.wd.cafeShifts}/${R.CAFE_SHIFTS_DAY}`, tiền: g.cash };
};
const toastCuối = () => [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText.replace(/\n/g, ' ')).slice(-2);

export default [boot, fresh(9 * 60),
  { label: '① bấm 7 lần chữ Cài đặt + nhập 7777 → menu ẩn mở' },
  { eval: (moMenu) => eval('(' + moMenu + ')()'), args: [moMenu.toString()], wait: 500 },
  { eval: (danhSách) => eval('(' + danhSách + ')()'), args: [danhSách.toString()], max: 2000 },
  { shot: OUT + 'dev59_menu' },

  { label: '② mục “Mở bảng việc làm” → hộp thoại bảng việc làm, không phải bảng test' },
  { eval: (chạy) => eval('(' + chạy + ')')('t59_viec_bang'), args: [chạy.toString()], wait: 400 },
  { eval: () => { const d = document.querySelector('#dlg'); return { mở: !d.classList.contains('hide'), chữ: d.querySelector('p')?.innerText?.split('\n')[0], dòng: d.querySelector('p')?.innerText?.split('\n').length }; } },
  { shot: OUT + 'dev59_bang_viec' },

  { label: '③ mục “Chuẩn bị 5h sáng” → về bến cảng, đầy sức khoẻ, có tiền' },
  { eval: (lại) => eval('(' + lại + ')()'), args: [lại.toString()] },
  { eval: (chạy) => eval('(' + chạy + ')')('t59_viec_sang'), args: [chạy.toString()], wait: 900 },
  { eval: (số) => eval('(' + số + ')()'), args: [số.toString()] },
  { shot: OUT + 'dev59_ben_cang' },

  { label: '④ mục “Làm hết ca bốc cá” → 2/2 ca, ca thứ 3 bị chặn' },
  { eval: (lại) => eval('(' + lại + ')()'), args: [lại.toString()] },
  { eval: (chạy) => eval('(' + chạy + ')')('t59_viec_ca_bo'), args: [chạy.toString()], wait: 600 },
  { eval: (số) => eval('(' + số + ')()'), args: [số.toString()] },
  { eval: (toastCuối) => eval('(' + toastCuối + ')()'), args: [toastCuối.toString()] },
  { eval: () => { const g0 = window.__game, g = g0.g; const before = g.cash; g0.acts.dockShift(); return { bịChặn: g.cash === before, toast: [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText.replace(/\n/g, ' ')).slice(-1) }; } },

  { label: '⑤ mục “Làm hết ca chạy bàn” → 3/3 ca, ca thứ 4 bị chặn' },
  { eval: (lại) => eval('(' + lại + ')()'), args: [lại.toString()] },
  { eval: (chạy) => eval('(' + chạy + ')')('t59_viec_ca_quan'), args: [chạy.toString()], wait: 600 },
  { eval: (số) => eval('(' + số + ')()'), args: [số.toString()] },
  { eval: (toastCuối) => eval('(' + toastCuối + ')()'), args: [toastCuối.toString()] },

  { label: '⑥ mục “Vác tới bao cuối rồi thử vác lố” → phải dừng ở 20, không lên 21' },
  { eval: (lại) => eval('(' + lại + ')()'), args: [lại.toString()] },
  { eval: (chạy) => eval('(' + chạy + ')')('t59_viec_bao'), args: [chạy.toString()], wait: 600 },
  { eval: (số) => eval('(' + số + ')()'), args: [số.toString()] },
  { eval: (toastCuối) => eval('(' + toastCuối + ')()'), args: [toastCuối.toString()] },

  { label: '⑦ mục “Đọc sổ việc làm” → số trên sổ khớp bảng việc làm' },
  { eval: (lại) => eval('(' + lại + ')()'), args: [lại.toString()] },
  { eval: (chạy) => eval('(' + chạy + ')')('t59_viec_so'), args: [chạy.toString()], wait: 400 },
  { eval: () => document.querySelector('#dlg p')?.innerText },
];
