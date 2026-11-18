// LƯỚT 26 — cảnh báo "sắp hết đồ" nói thẳng thiếu gì: chip HUD, ô trong bảng Quầy, và nút Sơ chế khi thiếu đồ.
import { boot, fresh } from '../lib.mjs';
const setupEmpty = { eval: async () => {
  const G = window.__game, g = G.g, R = window.__R;
  const RECIPES = (await import('/src/data/recipes.ts')).RECIPES;
  g.cash = 3000000; g.stall.tier = 7; g.stall.where = 'placed'; g.stall.spot = 'cho';
  for (const id of ['daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas']) g.gear[id] = 100;
  for (const rid of ['com_suon', 'banh_xeo']) { g.rec[rid].known = true; g.rec[rid].on = true; g.rec[rid].price = R.suggestPrice(g, RECIPES[rid]); }
  g.stall.store = []; g.bag = []; g.stall.preps = []; g.stall.ready = [];
  G.player.place(g.stall.x + 2, g.stall.z + 2, 0);
  await new Promise((r) => setTimeout(r, 500));
  return { shorts: R.stockShortages(g).slice(0, 4).map((x) => `${x.name}: còn ${x.left}, cần ${x.need} ${x.unit} @ ${x.shop} ${x.cost}₫`), line: R.shortageLine(g) };
}, wait: 600 };
export default [boot, fresh(600),
  { eval: () => { document.getElementById('rotok')?.click(); return 1; }, quiet: true, wait: 250 },
  { label: 'a quầy bậc 7 bán 2 món, kho trống', eval: setupEmpty.eval, wait: 600 },
  { label: 'b chip HUD', eval: () => { const c = document.querySelector('#lowchip'); return { text: c?.textContent.trim(), tip: (c?.dataset.tip ?? '').slice(0, 90) }; } },
  { shot: 's1-chip-hud' },
  { label: 'c bảng Quầy › Thực đơn: ô thiếu nguyên liệu', eval: async () => {
    const G = window.__game; G.ui.closePanel(); G.ui.panel('stall'); await new Promise((r) => setTimeout(r, 600));
    return { has: !!document.querySelector('#modal .shortage'), first: [...document.querySelectorAll('#modal .shortage .srow')].slice(0, 2).map((r) => r.textContent.replace(/\s+/g, ' ').trim()) };
  }, wait: 700 },
  { shot: 's2-bang-quay' },
  { label: 'd nút Sơ chế đổi thành "Thiếu đồ — xem thiếu gì" và bấm được', eval: async () => {
    const btn = [...document.querySelectorAll('#modal .body button')].filter((b) => b.dataset.a === 'prep')[0];
    const label = btn?.textContent.replace(/\s+/g, ' ').trim();
    const locked = btn?.classList.contains('off');
    btn?.click(); await new Promise((r) => setTimeout(r, 500));
    return { label, locked, modalStillOpen: window.__game.ui.modalName, toast: (document.querySelector('#toasts')?.textContent ?? '').slice(-120) };
  }, wait: 700 },
  { shot: 's3-nut-so-che' },
  { label: 'e mua đủ đồ → cảnh báo biến mất', eval: async () => {
    const G = window.__game, g = G.g, R = window.__R;
    const { INGS } = await import('/src/data/ingredients.ts');
    g.stall.store = []; g.stall.preps = [];
    for (const rid of ['com_suon', 'banh_xeo']) for (const [id, q] of Object.entries(window.__RECIPES?.[rid]?.ings ?? {})) void q;
    const RECIPES = (await import('/src/data/recipes.ts')).RECIPES;
    for (const rid of ['com_suon', 'banh_xeo']) for (const id of Object.keys(RECIPES[rid].ings)) if (!g.stall.store.some((x) => x.id === id)) g.stall.store.push({ id, n: 40, q: 1, cost: INGS[id].price, fresh: 100 });
    G.ui.closePanel(); await new Promise((r) => setTimeout(r, 500));
    return { shorts: R.stockShortages(g).length, chip: !!document.querySelector('#lowchip') };
  }, wait: 600 },
];
