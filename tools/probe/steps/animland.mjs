// kiểm lớp hoạt ảnh: máy dọc (390×844) và máy xoay ngang (844×390)
import { boot, fresh } from '../lib.mjs';
const box = { eval: () => {
  const ph = document.querySelector('.ph').getBoundingClientRect();
  const act = document.querySelector('.ph .pact');
  const btns = [...document.querySelectorAll('.pactbtns .pbtn, .pact .phang')];
  return { ph: [Math.round(ph.width), Math.round(ph.height)], act: act ? [Math.round(act.getBoundingClientRect().width), Math.round(act.getBoundingClientRect().height)] : null, nut: btns.map((b) => Math.round(b.getBoundingClientRect().height)), tran: act ? act.scrollHeight > act.clientHeight + 2 : null };
} };
export default [boot, fresh(9 * 60),
  { eval: async () => {
    const g = window.__game.g; g.gear['camung'] = 100; g.phone = { id: 'camung', battery: 82 }; g.cash = 500000;
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    await new Promise((r) => setTimeout(r, 250));
    window.__PUI.setPhoneAct('radio', 20, 'ban tin sang');
    window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 500));
    return 1;
  }, wait: 400 },
  box,
  { shot: 'p29-x-doc.png' },
  { eval: async () => { window.__game.ui.closePanel(); await new Promise((r) => setTimeout(r, 300)); window.dispatchEvent(new Event('resize')); return 1; } },
];
