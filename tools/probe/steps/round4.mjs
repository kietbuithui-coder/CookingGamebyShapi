// Lượt 4: sạp cố định (bậc 3) + các lỗi nhỏ đã sửa (báo/ly trên tay khi đi bộ, chặn dọn quầy khi còn khách, giờ đóng cửa).
// Chạy: cd tools/probe && node play.mjs steps/round4.mjs
import { boot, fresh, rich } from '../lib.mjs';
const SPOT = { id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 20000, minTier: 1 };
const dlg = () => { const d = document.querySelector('#dlg'); return d.classList.contains('hide') ? null : { t: d.querySelector('h3').innerText, text: d.querySelector('p').innerText.slice(0, 90), opts: [...d.querySelectorAll('.btn')].map((b) => b.innerText.split('\n')[0]) }; };
const toast = () => document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-160);
const chip = () => { const c = document.querySelector('#stallchip'); return c.classList.contains('hide') ? null : c.innerText.replace(/\n+/g, ' '); };
const click = (txt) => ({ eval: (txt) => { const b = [...document.querySelectorAll('#dlg .btn')].find((x) => x.innerText.includes(txt)); if (!b) return 'không có'; if (b.disabled) return 'bị khoá'; b.click(); return 'ok'; }, args: [txt], wait: 900 });
const close = { eval: () => { window.__game.ui.closeDialog(); window.__game.mode = 'play'; return 1; }, quiet: true, wait: 350 };
export default [boot, fresh(9 * 60), rich,
  { label: '① mua sạp cố định ở tiệm đồ nghề' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.cash = 12000000; const n = g0.npcs.fixed.get('equip'); g0.player.place(n.x + 1.5, n.z + 0.2, -Math.PI / 2, 0); g0.acts.buyGear('sap'); return { open: !n.hidden }; }, wait: 1200 },
  { eval: dlg, max: 500 },
  { eval: () => { const g0 = window.__game; return { chipTrước: (document.querySelector('#stallchip') || {}).innerText, carry: g0.player.carry }; } },
  click('Mua —'),
  { eval: () => { const g0 = window.__game, g = g0.g; return { tier: g.stall.tier, where: g.stall.where, cash: g.cash, chip: document.querySelector('#stallchip').innerText.replace(/\n+/g, ' '), carry: g0.player.carry, stowẨn: getComputedStyle(document.querySelector('#stowb')).display, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-90) }; } },
  { shot: 'r4_buy' },
  close,
  { label: '② chọn chỗ đặt sạp' },
  { eval: async () => { const g0 = window.__game; g0.player.place(41, -34.6, Math.PI, -0.02); await new Promise((r) => setTimeout(r, 1400)); const f = g0.interact.focus; return { focus: f && f.label, sub: f && f.sub }; }, timeout: 30000 },
  { eval: () => { const g0 = window.__game; g0.g.cash = 300000; g0.interact.trigger(); return 1; }, quiet: true, wait: 1200 },
  { eval: () => { const g0 = window.__game, g = g0.g; return { tier: g.stall.tier, where: g.stall.where, spot: g.stall.spot, cash: g.cash, open: g.stall.open, chip: document.querySelector('#stallchip').innerText.replace(/\n+/g, ' '), toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-150) }; } },
  { shot: 'r4_placed' },
  { label: '③ sạp không vác lên vai, không dọn được' },
  { eval: () => { const g0 = window.__game; g0.stall.stow(); g0.stall.pickUp(); g0.stall.storeHome(); return { where: g0.g.stall.where, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-110) }; } },
  { label: '④ mở bán với sạp, đủ 10 món' },
  { eval: () => { const g0 = window.__game, g = g0.g, R = window.__R; for (const [id, n] of [['banhtrang', 12], ['dauphong', 8], ['rauthom', 8], ['tuongot', 8], ['chanh', 8], ['bap', 12], ['tra', 10], ['da', 12], ['than', 4], ['duong', 3]]) window.__give(id, n, 'store'); const now = g.day * 1440 + g.min; g.rec.banh_trang_tron.on = true; g.rec.bap_nuong.on = true; g.stall.preps.push({ rid: 'bap_nuong', n: 6, q: 0.9, at: now, cost: 900 }); g.stall.ready.push({ rid: 'banh_trang_tron', n: 4, q: 0.9, at: now, cost: 1500 }); const tier = R.tier(g); const ok = g0.stall.open(); return { ok, menuMax: tier.menu, queue: tier.queue, cap: tier.cap, chip: document.querySelector('#stallchip').innerText.replace(/\n+/g, ' ') }; }, wait: 1600 },
  { shot: 'r4_open' },
  { label: '⑤ chặn dọn quầy khi còn khách' },
  { eval: () => { const g0 = window.__game; g0.stall.open(); g0.g.stall.open = true; g0.stall.customers.push({}); const r = g0.stall.stow(); return { dọn: r, open: g0.g.stall.open, where: g0.g.stall.where, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-75) }; }, wait: 700 },
  { eval: () => { const g0 = window.__game; g0.stall.customers.length = 0; return 1; }, quiet: true },
  { label: '⑥ phí chỗ tính đầu ngày' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.cash = 200000; g.min = 23 * 60 + 50; window.__c0 = g.cash; g0.acts.sleep ? 0 : 0; window.__R.advance(g, 20, g0.acts.act()); return { day: g.day, cash: g.cash, mất: window.__c0 - g.cash, chip: document.querySelector('#stallchip').innerText.replace(/\n+/g, ' '), toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-80) }; }, wait: 900 },
  { label: '⑦ NPC đi bộ thì bỏ báo/ly khỏi tay' },
  { eval: () => { const g0 = window.__game; g0.g.min = 12 * 60; g0.set.quality = 3; g0.applyQuality(); g0.ui.closeDialog(); g0.mode = 'play'; g0.player.place(0, 0, 0, 0); for (let i = 0; i < 16; i++) g0.npcs.manageShoppers(); const peds = g0.npcs.list.filter((n) => n.kind === 'ped' && n.state === 'stand' && !n.persona); for (const n of peds) n.talkT = 0; let k = 0; while (k++ < 200 && peds.some((n) => n.pose === 'idle')) for (const n of peds) if (n.pose === 'idle') g0.npcs.idleAct(n); window.__n = peds.find((n) => n.pose === 'read' || n.pose === 'drink'); return { n: peds.length, poses: peds.map((n) => n.pose), held: !!(window.__n && window.__n.rig.held) }; }, wait: 1600 },
  { eval: async () => { const g0 = window.__game, n = window.__n; if (!n) return 'không ai'; n.timer = 0.05; await new Promise((r) => setTimeout(r, 900)); return { pose: n.pose, held: !!n.rig.held, idleT2: n.idleT2 ?? null }; }, timeout: 30000 },
  { label: '⑧ ngoài giờ chơi thì báo giờ mở cửa' },
  { eval: () => { const g0 = window.__game; g0.g.min = 23 * 60 + 30; g0.acts.funMenu('tv_bongda'); return 1; }, quiet: true, wait: 800 },
  { eval: dlg, max: 500 },
  { shot: 'r4_closed' },
  { label: '⑨ nấu ăn với sạp (camera bàn bếp)' },
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; g0.g.min = 9 * 60; const [x, z] = g0.stall.standPos(); g0.player.place(x, z, g0.g.stall.yaw, -0.2); g0.g.stall.open = true; const r = window.__R.menuOf(g0.g).find((q) => q.id === 'bap_nuong'); window.__done = 0; g0.cook.finish(r, () => { window.__done = 1; }); return { mode: g0.mode, rid: r && r.id, ok: window.__R.finishPossible(g0.g, r), thiếu: window.__R.missingFor(g0.g, r), fuel: g0.g.stall.fuel, than: g0.g.gear.bepthan, vi: g0.g.gear.vi }; }, wait: 3000 },
  { shot: 'r4_cook' },
  { eval: () => ({ mode: window.__game.mode, cam: window.__game.camera.position.toArray().map((v) => +v.toFixed(2)) }) },
];
