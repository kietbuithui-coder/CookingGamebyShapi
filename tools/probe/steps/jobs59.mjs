// Lượt 59 — trần việc làm thêm mỗi ngày (bốc cá, chạy bàn, bao vác) + bảng việc làm liệt kê đúng số thật.
// Chạy: cd tools/probe && node play.mjs steps/jobs59.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';

/** Đọc trạng thái sổ ngày + số còn lại mà người chơi sẽ thấy. */
const số = () => {
  const g0 = window.__game, g = g0.g, R = window.__R;
  return {
    giờ: +window.__S.hourOf(g).toFixed(2),
    bao: `${g.wd.sacks}/${R.DOCK_SACKS_DAY}`, baoCòn: R.sacksLeft(g),
    caCá: `${g.wd.cargoShifts}/${R.DOCK_SHIFTS_DAY}`, caCáCòn: R.dockShiftsLeft(g),
    caQuán: `${g.wd.cafeShifts}/${R.CAFE_SHIFTS_DAY}`, caQuánCòn: R.cafeShiftsLeft(g),
    tiền: g.cash,
  };
};
/** Bấm một mục trong hộp thoại theo chữ (để đi đúng đường người chơi đi). */
const bấmChữ = (txt) => {
  const b = [...document.querySelectorAll('#dlg .opts button')].find((x) => x.innerText.includes(txt));
  if (!b) return { khôngThấy: txt, có: [...document.querySelectorAll('#dlg .opts button')].map((x) => x.innerText.replace(/\n/g, ' ‹ ')) };
  const off = b.classList.contains('off'); b.click();
  return { bấm: txt, off };
};
/** Mở bảng việc làm và đọc từng dòng + trạng thái tắt của nút. */
const bảngViệc = () => {
  const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play';
  g0.acts.board();
  const dlg = document.querySelector('#dlg');
  return {
    mở: !dlg.classList.contains('hide'),
    tiêuĐề: dlg.querySelector('h3')?.innerText,
    chữ: dlg.querySelector('p')?.innerText,
    nút: [...dlg.querySelectorAll('.opts button')].map((b) => ({ t: b.innerText.replace(/\n/g, ' ‹ '), off: b.classList.contains('off') })),
  };
};
/** Gọi thẳng ca làm (đường tắt, không qua hộp thoại) để đếm trần. */
const gọiCa = (kind) => {
  const g0 = window.__game, g = g0.g, R = window.__R;
  const before = { caCá: g.wd.cargoShifts, caQuán: g.wd.cafeShifts, tiền: g.cash };
  if (kind === 'ca') g0.acts.dockShift(); else g0.acts.cafeShift();
  return {
    trước: before,
    sau: { caCá: g.wd.cargoShifts, caQuán: g.wd.cafeShifts, tiền: g.cash },
    toast: [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText.replace(/\n/g, ' ')).slice(-2),
  };
};

export default [boot, fresh(5 * 60),
  { label: '① bảng việc làm đầu ngày (5h00) — đủ 7 việc, số liệu thật' },
  { eval: (bảngViệc) => eval('(' + bảngViệc + ')()'), args: [bảngViệc.toString()], max: 1600 },
  { eval: (số) => eval('(' + số + ')()'), args: [số.toString()], quiet: true },
  { shot: OUT + 'jobs59_bang_sang' },

  { label: '② bốc cá ca 1' },
  { eval: (gọiCa) => eval('(' + gọiCa + ')')('ca'), args: [gọiCa.toString()], wait: 400 },
  { label: '③ bốc cá ca 2 (đủ trần 2/2)' },
  { eval: (gọiCa) => eval('(' + gọiCa + ')')('ca'), args: [gọiCa.toString()], wait: 400 },
  { label: '④ bốc cá ca 3 — phải bị chặn, sổ vẫn 2/2' },
  { eval: (gọiCa) => eval('(' + gọiCa + ')')('ca'), args: [gọiCa.toString()], wait: 400 },
  { eval: (số) => eval('(' + số + ')()'), args: [số.toString()] },

  { label: '⑤ 7h00: chạy bàn 3 ca rồi ca thứ 4 — phải bị chặn' },
  { eval: () => { const g0 = window.__game; g0.g.min = 7 * 60; g0.g.st.energy = 100; return window.__S.hourOf(g0.g); } },
  { eval: (gọiCa) => eval('(' + gọiCa + ')')('quán'), args: [gọiCa.toString()], wait: 300 },
  { eval: (gọiCa) => eval('(' + gọiCa + ')')('quán'), args: [gọiCa.toString()], wait: 300 },
  { eval: (gọiCa) => eval('(' + gọiCa + ')')('quán'), args: [gọiCa.toString()], wait: 300 },
  { eval: (gọiCa) => eval('(' + gọiCa + ')')('quán'), args: [gọiCa.toString()], wait: 300 },
  { eval: (số) => eval('(' + số + ')()'), args: [số.toString()] },
  { eval: (gọiCa) => eval('(' + gọiCa + ')')('quán'), args: [gọiCa.toString()] },

  { label: '⑥ 8h: hỏi anh Sáu Lực — nút ca bốc cá phải TẮT và ghi lý do' },
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; const n = g0.npcs.fixed.get('dock') || [...g0.npcs.fixed.values()].find((x) => x.fixedId === 'dock' || x.arch?.id === 'dock'); if (!n) return { có: false, keys: [...g0.npcs.fixed.keys()].slice(0, 40) }; g0.player.x = n.x; g0.player.z = n.z; g0.acts.talk(n); return { có: true, who: n.arch?.id }; } },
  { eval: () => { const d = document.querySelector('#dlg'); return { lời: d.querySelector('p')?.innerText, nút: [...d.querySelectorAll('.opts button')].map((b) => ({ t: b.innerText.replace(/\n/g, ' ‹ '), off: b.classList.contains('off') })) }; } },
  { shot: OUT + 'jobs59_sauLuc' },

  { label: '⑦ vác bao: trần mới 20 bao, vác quá thì bị chặn + bảng việc ghi đủ' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.min = 6 * 60; g.wd.sacks = window.__R.DOCK_SACKS_DAY; const j = (g0.acts.job = { kind: 'dock', carrying: true }); const before = g.cash; g0.acts.dockDrop(); return { ghi: g.wd.sacks, còn: window.__R.sacksLeft(g), lời: [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText.replace(/\n/g, ' ')).slice(-1) }; } },
  { eval: (bảngViệc) => eval('(' + bảngViệc + ')()'), args: [bảngViệc.toString()], max: 1600 },
  { shot: OUT + 'jobs59_bang_het' },

  { label: '⑧ sang ngày mới: mọi trần phải mở lại' },
  { eval: () => { const g0 = window.__game, g = g0.g, R = window.__R; R.advance(g, 1440 - g.min + 1, { moving: false, running: false, sleeping: true, sheltered: true, working: false, load: 0, sleepQ: 1 }); return { ngày: g.day, bao: R.sacksLeft(g), caCá: R.dockShiftsLeft(g), caQuán: R.cafeShiftsLeft(g) }; } },
];
