// Ông Bảy gợi ý đúng lúc (lượt 52): mở hộp thoại thật ở bốn trạng thái khác nhau và chụp lại.
// Chạy: node play.mjs steps/hobo.mjs   (URL mặc định http://127.0.0.1:4173/?debug)
import { boot, fresh } from '../lib.mjs';
const dlg = () => { const d = document.querySelector('#dlg'); return d.classList.contains('hide') ? null : { title: d.querySelector('h3').innerText, text: d.querySelector('p').innerText.slice(0, 160), opts: [...d.querySelectorAll('.btn')].map((b) => b.innerText.split('\n')[0]) }; };
// Đứng trước mặt Ông Bảy (neo v_hobo ở gầm cầu) rồi mở hộp thoại như người chơi chạm vào ông.
const talk = (setup) => ({ eval: (code) => {
  const g0 = window.__game, g = g0.g, v = g0.npcs.fixed.get('hobo');
  // eslint-disable-next-line no-new-func
  new Function('g0', 'g', code)(g0, g);
  g0.player.place(v.x - 0.5, v.z - 2.4, 0, -0.02);
  g0.player.place(g0.player.x, g0.player.z, Math.atan2(v.x - g0.player.x, v.z - g0.player.z), -0.02);
  g0.mode = 'play'; g0.ui.closeDialog();
  return { cash: g.cash, min: g.min, health: Math.round(g.st.health), hunger: Math.round(g.st.hunger) };
}, args: [setup], wait: 1200 });
const open = { eval: () => { const g0 = window.__game; const n = g0.npcs.fixed.get('hobo'); g0.acts.talk(n); return 1; }, quiet: true, wait: 900 };
const close = { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; return 1; }, quiet: true, wait: 400 };
export default [boot, fresh(11.5 * 60),
  { label: 'A · lính mới, 9h sáng, 18.000₫ trong túi' },
  talk(''), open, { eval: dlg }, { shot: 'hobo_a_new' },
  { label: 'B · ghé lần hai liền đó: câu phải khác câu vừa nói' },
  close, open, { eval: dlg }, { shot: 'hobo_b_again' },
  { label: 'C · sắp ngất + nợ Hùng Sẹo còn 1 ngày' },
  close,
  talk("g.st.health = 18; g.min = 15 * 60; g.cash = 50000; g.debts.push({ id: 7, lender: 'shark', principal: 200000, owed: 260000, due: g.day + 1, late: 0, taken: 0, ext: 0 });"),
  open, { eval: dlg }, { shot: 'hobo_c_urgent' },
  { label: 'D · 23h30, quán đóng hết: câu nào cũng phải trỏ chỗ còn dùng được' },
  close,
  talk("g.st.health = 90; g.st.hunger = 12; g.min = 23.5 * 60;"),
  open, { eval: dlg }, { shot: 'hobo_d_late' },
  { label: 'bấm nút ghim đường đi đầu tiên' },
  { eval: () => { const g0 = window.__game; const b = document.querySelector('#dlg .btn'); b && b.click(); return 1; }, quiet: true, wait: 800 },
  { eval: () => { const a = window.__game.acts; return a.way ? { way: a.way.name, x: Math.round(a.way.x), z: Math.round(a.way.z) } : null; }, label: 'đã ghim' },
  { shot: 'hobo_e_pinned' },
];
