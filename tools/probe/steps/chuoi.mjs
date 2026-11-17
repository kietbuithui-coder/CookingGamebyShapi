// Bậc 7 — CHUỖI CỬA HÀNG: mở chi nhánh thứ hai ở chỗ bán khác, dựng quầy ngoài phố,
// thuê người trông coi, chuyển món sẵn sang, bán hàng tự động và mở sổ chi nhánh.
// Chạy: cd tools/probe && OUT=/tmp/probe/chuoi node play.mjs steps/chuoi.mjs   (W=390 H=844 cho màn dọc)
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(9 * 60),
  { label: '①a màn dọc: đóng lời nhắc xoay ngang để chạm được' },
  { eval: async () => {
    const b = document.getElementById('rotok');
    if (b) { b.click(); await new Promise((r) => setTimeout(r, 300)); }
    return { dismissed: !!b, portrait: innerHeight > innerWidth };
  } },

  { label: '① lên bậc 7 và mở chi nhánh ở Cổng Chợ' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, R = window.__R;
    G.cash = 800000000;
    for (const id of ['ganh', 'xeday', 'sap', 'quanan', 'quanngoi', 'nhahang', 'chuoi', 'daothot', 'bepgas', 'vi', 'noi', 'chao', 'ghe', 'bien', 'den']) R.buyGear(G, id);
    const sp = g0.stall.spots().find((s) => s.id === 'matbang_tb');
    g0.stall.placeAt(sp);
    const before = G.cash;
    const b = R.openBranch(G, 'cho');
    const after = G.cash;
    R.hireKeeper(G);
    return { tier: G.stall.tier, tierName: R.tier(G).name, isChain: R.isChain(G), branch: b && b.spot, rent: b && b.rent, charged: before - after, keeper: G.branch?.keeper?.name, cash: after };
  }, wait: 500 },

  { label: '② làm sẵn món và chuyển sang chi nhánh' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, R = window.__R;
    for (const rid of ['tra_da', 'com_suon', 'banh_mi_trung']) { G.rec[rid].known = true; G.rec[rid].on = true; }
    G.stall.ready.push({ rid: 'tra_da', n: 8, q: 0.92, cost: 3000, at: G.min });
    G.stall.ready.push({ rid: 'com_suon', n: 6, q: 0.9, cost: 12000, at: G.min });
    const m1 = R.moveToBranch(G, 'tra_da', 8);
    const m2 = R.moveToBranch(G, 'com_suon', 6);
    g0.stall.refresh();
    return { moved: m1 + m2, branchStock: R.branchStock(G), kinds: G.branch.ready.map((r) => r.rid + '×' + r.n), selling: R.branchSelling(G) };
  }, wait: 300 },

  { label: '③ tới cổng chợ, chụp quầy chi nhánh' },
  { eval: async () => {
    const g0 = window.__game;
    const sp = g0.stall.spots().find((s) => s.id === 'cho');
    const sn = Math.sin(sp.yaw), c = Math.cos(sp.yaw);
    g0.player.x = sp.x + 2.6 * sn; g0.player.z = sp.z + 2.6 * c; g0.player.yaw = sp.yaw + Math.PI;
    return { x: Math.round(g0.player.x), z: Math.round(g0.player.z) };
  } },
  { waitFor: () => { const a = window.__game.stall.branchAnchor(); return !!a; }, timeout: 15000 },
  { wait: 1200 },
  { eval: async () => { const g0 = window.__game; g0.ui.closeDialog(); await new Promise((r) => setTimeout(r, 400)); return { dlg: !!document.querySelector('#dlg:not(.hide)') }; } },
  { wait: 600 },
  { shot: 'chuoi01-quay-chi-nhanh.png' },

  { label: '③c chụp toàn cảnh quầy chi nhánh từ xa (góc nhìn người chơi khác)' },
  { eval: async () => {
    const g0 = window.__game;
    const sp = g0.stall.spots().find((s) => s.id === 'cho');
    const sn = Math.sin(sp.yaw), c = Math.cos(sp.yaw);
    g0.player.x = sp.x + 7.5 * sn + 1.6 * c; g0.player.z = sp.z + 7.5 * c - 1.6 * sn; g0.player.yaw = sp.yaw + Math.PI;
    await new Promise((r) => setTimeout(r, 1200));
    return { px: Math.round(g0.player.x), pz: Math.round(g0.player.z) };
  }, wait: 1400 },
  { shot: 'chuoi01b-toan-canh.png' },
  { eval: async () => { const N = window.__game.npcs; const k = [...(N.list || N.npcs || [])].find((n) => n.actor === 'keeper'); return { keeperNpc: !!k, name: k && k.name, pose: k && k.pose }; }, wait: 200 },
  { eval: async () => {
    const g0 = window.__game;
    const sp = g0.stall.spots().find((s) => s.id === 'cho');
    const sn = Math.sin(sp.yaw), c = Math.cos(sp.yaw);
    g0.player.x = sp.x + 2.6 * sn; g0.player.z = sp.z + 2.6 * c; g0.player.yaw = sp.yaw + Math.PI;
    await new Promise((r) => setTimeout(r, 900));
    return { back: true };
  }, wait: 900 },

  { label: '④ chạm vào quầy chi nhánh (toạ độ chiếu từ 3D) → sổ mở' },
  { tapsEval: () => {
    const g0 = window.__game, a = g0.stall.branchAnchor();
    return [window.__proj({ x: a.x, y: a.y, z: a.z })];
  }, gap: 400 },
  { waitFor: () => !!document.querySelector('#modal .panel h2')?.textContent?.includes('Chi nhánh'), timeout: 8000 },
  { eval: async () => {
    const t = document.querySelector('#modal .panel h2')?.textContent ?? '';
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { title: t, hasRent: body.includes('thuê'), hasKeeper: body.includes('trông coi') };
  }, wait: 300 },
  { shot: 'chuoi02-so-chi-nhanh.png' },

  { label: '⑤ cho thời gian trôi để người trông coi bán, rồi đọc sổ' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, R = window.__R;
    g0.ui.closePanel();
    G.stall.open = true; g0.mode = 'play';
    // tua 3 tiếng bằng chính hàm luật (không chờ thời gian thật)
    for (let i = 0; i < 180; i++) { G.min += 1; R.branchTick(G, 1); }
    const t1 = G.branch.led;
    return { sold: t1.sold, revenue: t1.revenue, tips: t1.tips, stockLeft: R.branchStock(G), min: G.min };
  }, wait: 300 },

  { label: '⑥ chụp quầy chi nhánh lúc người trông coi đang bán + kiểm console' },
  { eval: async () => {
    const g0 = window.__game;
    g0.ui.panel('branch');
    await new Promise((r) => setTimeout(r, 300));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { hasRevenue: body.includes('Doanh thu hôm nay'), soldInBody: /Đã bán\s*\d+/.test(body) };
  }, wait: 400 },
  { shot: 'chuoi03-so-sau-khi-ban.png' },

  { label: '⑦ đóng chi nhánh trả mặt bằng, kiểm trạng thái sạch' },
  { eval: async () => {
    const g0 = window.__game, G = g0.g, R = window.__R;
    g0.ui.closePanel();
    R.closeBranch(G);
    g0.stall.refresh();
    await new Promise((r) => setTimeout(r, 400));
    g0.ui.panel('branch');
    await new Promise((r) => setTimeout(r, 250));
    return { branch: G.branch, anchor: g0.stall.branchAnchor(), panelText: document.querySelector('#modal .body')?.textContent?.slice(0, 70) };
  }, wait: 600 },
];
