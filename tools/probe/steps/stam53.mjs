// Thanh thể lực (thanh chạy) lượt 53: máu + pin quyết định hồi nhanh hay chậm, người yếu tụt nhanh hơn.
// Đo bằng ĐỒNG HỒ THẬT của game: đứng chờ cho hồi, rồi giữ Shift mà chạy, ghi lại mốc thanh và tốc độ.
import { boot, fresh } from '../lib.mjs';
/** Cho nhân vật một trạng thái chỉ số, rồi đổ đầy thanh thể lực để đo lần hồi tiếp theo. */
const setStats = (hp, en) => ({ eval: async (hp, en) => {
  const g0 = window.__game, p = g0.player;
  // Chờ nhịp khung hình ổn định (headless hay khựng vài giây đầu) rồi mới đặt mốc, nếu không tốc độ đo bị nhiễu.
  await new Promise((r) => setTimeout(r, 1200));
  g0.g.st.health = hp; g0.g.st.energy = en; g0.g.st.hunger = 85; g0.g.st.thirst = 85; g0.g.st.mood = 60;
  p.stamina = 0.05; p.staminaCap = 1; p.tired = true;
  return { hp: g0.g.st.health, en: g0.g.st.energy, stam: +p.stamina.toFixed(3) };
}, args: [hp, en] });
/** Đứng yên tới khi đồng hồ GAME trôi `sec` giây rồi trả về tốc độ hồi đo được (%/giây) và thanh hiện tại.
 *  Đo theo `__game.time` (thời gian mô phỏng) chứ không theo đồng hồ treo tường: mỗi khung hình dt bị chặn ở 0,05 s,
 *  nên máy chậm chạy 5 khung/giây vẫn đo ra đúng luật. */
const measureRegen = (sec = 1.2) => ({ eval: async (sec) => {
  const g0 = window.__game, p = g0.player;
  const s0 = p.stamina, t0 = g0.time; const wall = performance.now();
  while (g0.time - t0 < sec) await new Promise((r) => requestAnimationFrame(r));
  return {
    perSec: +((p.stamina - s0) / (g0.time - t0)).toFixed(4),
    from: +s0.toFixed(3), to: +p.stamina.toFixed(3),
    simSec: +(g0.time - t0).toFixed(2), wallSec: +((performance.now() - wall) / 1000).toFixed(2),
  };
}, args: [sec] });
/** Giữ Shift + W cho chạy tới khi đồng hồ game trôi `sec` giây, trả về tốc độ tụt (%/giây). */
const measureDrain = (sec = 0.9) => ({ eval: async (sec) => {
  const g0 = window.__game, p = g0.player;
  p.stamina = 1; p.tired = false;
  g0.input.keys.add('w'); g0.input.keys.add('shift');
  await new Promise((r) => setTimeout(r, 250));              // chờ một khung hình nhận phím
  const s0 = p.stamina, t0 = g0.time, ran = p.running;
  while (g0.time - t0 < sec) await new Promise((r) => requestAnimationFrame(r));
  const r = { ran, drainPerSec: +((s0 - p.stamina) / (g0.time - t0)).toFixed(4), to: +p.stamina.toFixed(3) };
  g0.input.keys.clear(); return r;
}, args: [sec] });
export default [boot, fresh(9 * 60),
  { label: 'không ở chế độ chơi thì thanh không hiện (kiểm tra lớp .hide)' },
  { eval: () => { const g0 = window.__game; g0.mode = 'play'; g0.g.st.health = 90; g0.g.st.energy = 90; g0.player.stamina = 0.5; return g0.mode; } },

  { label: '① NGƯỜI KHOẺ (máu 90, pin 90): hồi ~9%/giây khi đứng yên' },
  setStats(90, 90), measureRegen(1.2),
  { eval: () => { const st = document.querySelector('#stam'); return { visible: !!st && !st.classList.contains('hide'), width: st ? st.firstElementChild.style.width : '', tip: st ? st.dataset.tip : '' }; } },

  { label: '② MÁU 20 (pin 100): hồi còn khoảng một nửa' },
  setStats(20, 100), measureRegen(1.2),

  { label: '③ MÁU 20 + PIN 10: hồi chậm hơn nữa nhưng vẫn phải hồi' },
  setStats(20, 10), measureRegen(1.2),

  { label: '④ GIỮ SHIFT MÀ CHẠY khi đang thương (máu 20): tụt nhanh hơn 0,1/giây' },
  setStats(20, 100), measureDrain(0.9),
  { eval: () => ({ keysLeft: window.__game.input.keys.size, running: window.__game.player.running }) },

  { label: '⑤ NGƯỜI KHOẺ chạy cùng quãng: đúng 0,1/giây (chậm hơn người thương)' },
  setStats(95, 95), measureDrain(0.9),
  { eval: () => ({ keysLeft: window.__game.input.keys.size, running: window.__game.player.running }) },

  // Lượt 54 đã thay các mục menu của lượt 53 bằng mục bánh/Shapi (đúng luật “mỗi lượt thay mục test cũ”),
  // nên probe này chỉ đo luật tốc độ; menu ẩn do `devpin.mjs` canh.
];
