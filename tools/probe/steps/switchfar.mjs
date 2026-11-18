// LƯỢT 24 — công tắc Mở/Đóng trong app Cửa hàng khi đứng xa quầy: ân hạn 20 giây, tự ngưng có lời giải thích, có người phụ thì vẫn bán.
// Chạy: cd tools/probe && W=390 H=844 OUT=/tmp/probe/switchfar node play.mjs steps/switchfar.mjs
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(600),
  { label: 'a setup quán bậc 7, 2 món, KHÔNG nhân viên, đứng xa 85 m', eval: async () => {
    const G = window.__game, g = G.g, R = window.__R;
    const RECIPES = (await import('/src/data/recipes.ts')).RECIPES;
    g.cash = 5000000; g.stall.tier = 7; g.stall.where = 'placed'; g.stall.spot = 'cho'; g.stall.open = false;
    g.help = null; g.help2 = null;
    for (const id of ['daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas']) g.gear[id] = 100;
    for (const rid of ['com_suon', 'tra_da']) { g.rec[rid].known = true; g.rec[rid].on = true; g.rec[rid].price = R.suggestPrice(g, RECIPES[rid]); }
    g.stall.ready = [{ rid: 'com_suon', n: 5, q: 1, at: 0, cost: 12000 }];
    g.phone = { id: 'camung', battery: 70 }; g.gear.camung = 100;
    G.player.place(g.stall.x + 60, g.stall.z + 60, 0);
    return { dist: Math.round(Math.hypot(G.player.x - g.stall.x, G.player.z - g.stall.z)), warn: R.shopStaffWarn(g).slice(0, 40) };
  } },
  { label: 'b mở app Cửa hàng', eval: async () => {
    const G = window.__game; G.ui.closePanel(); G.ui.panel('phone'); await new Promise((r) => setTimeout(r, 500));
    [...document.querySelectorAll('.pgrid .cell')].find((c) => c.textContent.includes('Cửa hàng'))?.click();
    await new Promise((r) => setTimeout(r, 600));
    return { btns: [...document.querySelectorAll('#modal .body button[data-a="phshop"]')].map((b) => b.textContent.trim()) };
  }, wait: 700 },
  { label: 'c bấm Mở khi đứng xa → 3 s sau vẫn mở (ân hạn 20 s), nút là "Đóng"', eval: async () => {
    const g = window.__game.g;
    document.querySelectorAll('#modal .body button[data-a="phshop"]')[0].click();
    await new Promise((r) => setTimeout(r, 3000));
    return { open: g.stall.open, btn: document.querySelectorAll('#modal .body button[data-a="phshop"]')[0].textContent.trim() };
  }, wait: 3400 },
  { label: 'd chờ hết 20 s ân hạn → quầy tự ngưng, nút tự về "Mở", có toast giải thích', eval: async () => {
    const g = window.__game.g;
    const t0 = window.__game.time; await new Promise((r) => setTimeout(r, 46000)); const dtSim = window.__game.time - t0;
    const G = window.__game;
    return { dtSim: +dtSim.toFixed(1), dist: Math.round(Math.hypot(G.player.x - g.stall.x, G.player.z - g.stall.z)), pals: G.npcs.pals?.length, open: g.stall.open, btn: document.querySelectorAll('#modal .body button[data-a="phshop"]')[0].textContent.trim(),
      toast: (/Bạn đi xa quá[^.]*\./.exec(document.querySelector('#toasts')?.textContent ?? '') ?? [null])[0] };
  }, wait: 200 },
  { shot: 'zz3-tu-dong-ngung.png' },
  { label: 'e có người phụ việc → mở từ xa 25 s vẫn bán, chỉ nhắc nhẹ', eval: async () => {
    const G = window.__game, g = G.g;
    const R = window.__R;
    g.help = { name: 'Thím Bảy', fem: true, face: 0, hairStyle: 0, shirt: 0x2f6fb5, pants: 0x333333, hair: 0x222222, skin: 0xdcae87, wage: 200000, since: 1, paid: 1, hired: true };
    g.stall.open = false; await new Promise((r) => setTimeout(r, 300));
    document.querySelectorAll('#modal .body button[data-a="phshop"]')[0].click();
    await new Promise((r) => setTimeout(r, 400));
    await new Promise((r) => setTimeout(r, 46000));
    return { open: g.stall.open, btn: document.querySelectorAll('#modal .body button[data-a="phshop"]')[0].textContent.trim(),
      warm: (/vẫn có người bán[^.]*\./.exec(document.querySelector('#toasts')?.textContent ?? '') ?? [null])[0], warn: R.shopStaffWarn(g) };
  }, wait: 200 },
];
