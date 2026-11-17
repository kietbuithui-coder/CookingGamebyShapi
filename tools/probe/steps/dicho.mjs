// KIỂM 2 VIỆC LƯỢT 19:
// ① Má Bảy (người trông coi) KHÔNG còn đứng lọt trong quầy chi nhánh — đứng sau quầy, quay mặt ra khách.
// ② Giao người làm (phụ quầy / bếp trưởng / người trông coi chi nhánh) đi chợ mua nguyên liệu.
// Chạy: cd tools/probe && OUT=/tmp/probe/dicho node play.mjs steps/dicho.mjs
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(9 * 60),
  { label: '①a màn dọc: đóng lời nhắc xoay ngang' },
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return !!b; } },

  { label: '①b dựng chuỗi + chi nhánh Cổng Chợ, tới quầy, đo vị trí Má Bảy so với quầy' },
  { eval: async () => {
    const g0 = window.__game, m = await import('/src/game/devPoints.ts');
    window.__dev = m;
    m.getDevSections()[0].items.find((i) => i.id === 'setup_chuoi').run();
    await new Promise((r) => setTimeout(r, 400));
    m.getDevSections()[0].items.find((i) => i.id === 'branch_fill').run();
    m.getDevSections()[0].items.find((i) => i.id === 'tp_chinhanh').run();
    await new Promise((r) => setTimeout(r, 1500));
    g0.ui.closeDialog();
    return { branch: g0.g.branch?.spot, keeper: g0.g.branch?.keeper?.name, stock: window.__R.branchStock(g0.g) };
  }, wait: 1200 },
  { waitFor: () => !!(window.__game.stall.keeper && window.__game.stall.keeper.state !== 'gone'), timeout: 12000 },
  { eval: async () => {
    const g0 = window.__game, k = g0.stall.keeper, b = g0.g.branch;
    const sp = g0.stall.spots().find((s) => s.id === b.spot);
    const lx = (k.x - sp.x) * Math.cos(sp.yaw) - (k.z - sp.z) * Math.sin(sp.yaw);
    const lz = (k.x - sp.x) * Math.sin(sp.yaw) + (k.z - sp.z) * Math.cos(sp.yaw);
    const dy = Math.abs(((k.yaw - sp.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    // quầy cao 0.86 m tính từ mặt đất; người đứng sau quầy phải có lz < -0.55 (ra phía sau)
    return { localX: +lx.toFixed(2), localZ: +lz.toFixed(2), behindStall: lz < -0.55, facingCustomer: dy < 0.35, y: +k.y.toFixed(2), pose: k.pose };
  }, wait: 200 },
  { shot: 'dicho01-ma-bay-sau-quay.png' },

  { label: '② thuê phụ quầy + 2 bếp trưởng, mở bảng Giao đi chợ' },
  { eval: async () => {
    const g0 = window.__game, R = window.__R, G = g0.g;
    m0(R, G);
    function m0(R, G) {
      for (const id of ['daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas', 'thungda', 'bien', 'den', 'ghe']) if (!R.has(G, id)) R.buyGear(G, id);
      while (R.helperCount(G) < R.maxHelpers(G)) R.hireHelper(G);
      while (R.sousCount(G) < R.maxSous(G)) R.hireSous(G);
    }
    g0.ui.panel('errand');
    await new Promise((r) => setTimeout(r, 400));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { helpers: R.helperCount(G), sous: R.sousCount(G), hasPanel: body.includes('Giao cho ai'), hasDishes: body.includes('Đủ nguyên liệu'), chars: body.length };
  }, wait: 500 },
  { shot: 'dicho02-bang-giao-di-cho.png' },

  { label: '③ chọn món cơm sườn rồi bấm nút giao trên UI thật' },
  { eval: async () => {
    const g0 = window.__game;
    const dishBtn = [...document.querySelectorAll('#modal button[data-a="erDish"]')].find((b) => b.dataset.k === 'com_suon');
    dishBtn?.click();
    await new Promise((r) => setTimeout(r, 300));
    const send = document.querySelector('#modal button[data-a="erSend"]');
    const label = send?.textContent ?? '';
    const cash0 = g0.g.cash;
    send?.click();
    await new Promise((r) => setTimeout(r, 500));
    const e = g0.g.errands[0];
    return { sendLabel: (label || '').slice(0, 60), started: !!e, who: e?.who, legs: e?.legs, lines: e?.lines.length, paid: cash0 - g0.g.cash, panelClosed: !g0.ui.modalName };
  }, wait: 600 },
  { shot: 'dicho03-sau-khi-giao.png' },

  { label: '④ người đi chợ BIẾN MẤT khỏi quầy trong lúc đi, rồi tua cho về' },
  { eval: async () => {
    const g0 = window.__game, R = window.__R;
    await new Promise((r) => setTimeout(r, 1500));
    const helper = g0.stall.helper, sous = g0.stall.sous;
    const store0 = g0.g.stall.store.length;
    const legs = Math.max(1, ...g0.g.errands.map((e) => e.legs));
    R.errandTick(g0.g, legs);
    await new Promise((r) => setTimeout(r, 400));
    return { helperHiddenWhileAway: !helper || helper.state === 'gone', sousStillThere: !!sous, storeBefore: store0, storeAfter: g0.g.stall.store.length, errandsLeft: g0.g.errands.length };
  }, wait: 800 },

  { label: '⑤ tab Nhân sự có khối Đi chợ + menu nói chuyện với người làm có mục giao chợ' },
  { eval: async () => {
    const g0 = window.__game;
    g0.ui.panel('stall');
    await new Promise((r) => setTimeout(r, 300));
    document.querySelector('#modal .tab[data-tab="staff"]')?.click();
    await new Promise((r) => setTimeout(r, 300));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    const hasBlock = body.includes('Đi chợ mua nguyên liệu');
    const runBtn = !!document.querySelector('#modal button[data-a="errandOpen"]');
    g0.ui.closePanel();
    // hội thoại với phụ quầy
    g0.stall.helper = null;
    return { hasBlock, runBtn };
  }, wait: 400 },

  { label: '⑤b giao NGƯỜI TRÔNG COI CHI NHÁNH đi chợ → Má Bảy rời quầy' },
  { eval: async () => {
    const g0 = window.__game, R = window.__R, G = g0.g;
    const RC = await import('/src/data/recipes.ts');
    G.cash = Math.max(G.cash, 2000000);
    const q = R.errandQuote(G, R.errandPlanFor(G, RC.RECIPES.tra_da, 4));
    const e = R.startErrand(G, 3, q.lines, q.total);
    await new Promise((r) => setTimeout(r, 1500));
    return { started: !!e, lines: e?.lines.length, keeperNpcGone: !g0.stall.keeper || g0.stall.keeper.state === 'gone', errands: G.errands.length };
  }, wait: 900 },

  { label: '⑥ hội thoại người phụ quầy có mục giao đi chợ' },
  { eval: async () => {
    const g0 = window.__game;
    g0.stall.talkHelper(1);
    await new Promise((r) => setTimeout(r, 300));
    const opts = [...document.querySelectorAll('#dlg .btn')].map((b) => b.textContent.slice(0, 44));
    return { opts };
  }, wait: 400 },
  { shot: 'dicho04-hoi-thoai.png' },
];
