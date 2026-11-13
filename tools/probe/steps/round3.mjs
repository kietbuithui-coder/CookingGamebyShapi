// Lượt 3: thang mở công thức, chỗ chơi (cà phê/chùa/ghế đá), khách đứng mua, NPC đọc báo–uống nước–tám chuyện,
// nút cất gánh, ca chạy bàn và ca bốc vác ở cảng.
// Chạy: cd tools/probe && node play.mjs steps/round3.mjs
import { boot, fresh, rich } from '../lib.mjs';
const SPOT = { id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 20000, minTier: 1 };
const dlg = () => { const d = document.querySelector('#dlg'); return d.classList.contains('hide') ? null : { t: d.querySelector('h3').innerText, text: d.querySelector('p').innerText.slice(0, 55), opts: [...d.querySelectorAll('.btn')].map((b) => b.innerText.split('\n')[0]) }; };
const toast = () => document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-120);
const click = (txt) => ({ eval: (txt) => { const b = [...document.querySelectorAll('#dlg .btn')].find((x) => x.innerText.includes(txt)); if (!b) return 'không có'; if (b.disabled) return 'bị khoá'; b.click(); return 'ok'; }, args: [txt], wait: 1000 });
const trig = { eval: () => { window.__game.interact.trigger(); return 1; }, quiet: true, wait: 1000 };
const close = { eval: () => { window.__game.ui.closeDialog(); window.__game.mode = 'play'; return 1; }, quiet: true, wait: 400 };
// Dò quanh một cái neo — camera bám theo người chơi nên phải chờ vài khung hình mới biết đang ngắm vào đâu.
const scan = (key, want, list) => ({ eval: async (key, want, list) => {
  const g0 = window.__game, A = g0.world.anchors, a = A[key]; if (!a) return 'thiếu neo ' + key;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const spots = list || [1.2, 1.8, 2.4].flatMap((d) => [...Array(12)].map((_, i) => [d, i / 12 * Math.PI * 2]));
  for (const [d, th] of spots) {
    const x = a.x + Math.sin(th) * d, z = a.z + Math.cos(th) * d, yaw = Math.atan2(a.x - x, a.z - z);
    if (list) { const b = g0.world.benches[key]; g0.player.place(b.x, b.z + 1.0, Math.PI, 0); } else g0.player.place(x, z, yaw, -0.05);
    await sleep(380); const f = g0.interact.focus;
    if (f && (!want || f.label.includes(want))) return { x: +(list ? g0.world.benches[key].x : x).toFixed(1), z: +(list ? g0.world.benches[key].z : z).toFixed(1), label: f.label, sub: f.sub, d };
  }
  return { miss: true, focus: g0.interact.focus && g0.interact.focus.label, at: { x: +a.x.toFixed(1), z: +a.z.toFixed(1), yaw: +a.yaw.toFixed(2) } };
}, args: [key, want, list], timeout: 60000, wait: 200 });
const go = (x, z, yaw, min) => ({ eval: (x, z, yaw, min) => { const g0 = window.__game; if (min !== null) g0.g.min = min; g0.player.place(x, z, yaw, -0.06); return 1; }, args: [x, z, yaw, min], wait: 1000 });
export default [boot, fresh(9 * 60), rich,
  { label: '① thang mở công thức — mỗi cấp 1–2 món, món rẻ trước' },
  { eval: () => { const g0 = window.__game, g = g0.g, k = Object.keys(g.rec).filter((i) => g.rec[i].known); return { cấp: window.__R.level(g), đãBiết: k.length, món: k }; }, max: 700 },
  { eval: () => { const g0 = window.__game, g = g0.g, b = new Set(Object.keys(g.rec).filter((k) => g.rec[k].known)); const r = window.__lvl(2); return { cấp: r.lvl, mới: Object.keys(g.rec).filter((k) => g.rec[k].known && !b.has(k)), tổng: r.known, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-85) }; }, wait: 800 },
  { eval: () => { const g0 = window.__game, g = g0.g, b = new Set(Object.keys(g.rec).filter((k) => g.rec[k].known)); const r = window.__lvl(4); return { cấp: r.lvl, mới: Object.keys(g.rec).filter((k) => g.rec[k].known && !b.has(k)), tổng: r.known }; }, wait: 800 },
  { eval: () => { const g0 = window.__game, g = g0.g, b = new Set(Object.keys(g.rec).filter((k) => g.rec[k].known)); const r = window.__lvl(7); return { cấp: r.lvl, mới: Object.keys(g.rec).filter((k) => g.rec[k].known && !b.has(k)), tổng: r.known, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-85) }; }, wait: 800 },
  { shot: 'r3_levelup' },
  { label: '② nút cất gánh' },
  { eval: (SPOT) => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; g0.stall.placeAt(SPOT); const [x, z] = g0.stall.standPos(); g0.player.place(x, z, g0.g.stall.yaw, -0.06); return { where: g0.g.stall.where, hiện: getComputedStyle(document.querySelector('#stowb')).display, title: document.querySelector('#stowb').title }; }, args: [SPOT], wait: 1500 },
  { eval: () => { document.querySelector('#stowb').click(); return 1; }, quiet: true, wait: 1200 },
  { eval: () => { const g0 = window.__game; return { where: g0.g.stall.where, carry: g0.player.carry, cls: document.querySelector('#stowb').className, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-70) }; } },
  { eval: () => { const g0 = window.__game, g = g0.g; g0.stall.placeAt({ id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 0, minTier: 1 }); g0.stall.pickUp(); const [x, z] = g0.stall.standPos(); g0.player.place(x, z, g.stall.yaw, -0.06); return { where: g.stall.where, carry: g0.player.carry, title: document.querySelector('#stowb').title, hiện: getComputedStyle(document.querySelector('#stowb')).display }; }, wait: 1600 },
  { shot: 'r3_stow_carry' },
  { eval: () => { document.querySelector('#stowb').click(); return 1; }, quiet: true, wait: 1400 },
  { eval: () => { const g0 = window.__game; return { where: g0.g.stall.where, stowed: g0.stall.stowed, carry: g0.player.carry, cls: document.querySelector('#stowb').className, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-70) }; } },
  { shot: 'r3_stow_on' },
  { eval: () => { document.querySelector('#stowb').click(); return 1; }, quiet: true, wait: 1200 },
  { eval: () => ({ stowed: window.__game.stall.stowed, carry: window.__game.player.carry, cls: document.querySelector('#stowb').className }) , max: 300 },
  { label: '③ khách đứng mua trước các tiệm' },
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.set.quality = 3; g0.applyQuality(); g0.g.min = 12 * 60; g0.player.place(0, 0, 0, 0); for (let i = 0; i < 16; i++) g0.npcs.manageShoppers(); return { tiệm: g0.npcs.browses.map((b) => b.shop), npcs: g0.npcs.list.length }; }, wait: 2600 },
  { eval: () => { const g0 = window.__game; const peds = g0.npcs.list.filter((n) => n.kind === 'ped' && n.state === 'stand'); let k = 0; while (k++ < 60 && peds.some((n) => n.pose === 'idle')) for (const n of peds) if (n.pose === 'idle') g0.npcs.idleAct(n); return { người: peds.length, dáng: peds.map((n) => n.pose) }; }, wait: 1600 },
  { eval: async () => { const g0 = window.__game; const n = g0.npcs.list.find((x) => x.pose === 'read' || x.pose === 'drink' || x.pose === 'chat') || g0.npcs.list.find((x) => x.kind === 'ped' && x.state === 'stand'); if (!n) return 'không ai'; const th = n.yaw + Math.PI * 0.8; g0.player.place(n.x + Math.sin(th) * 2.2, n.z + Math.cos(th) * 2.2, Math.atan2(n.x - g0.player.x, n.z - g0.player.z), -0.02); await new Promise((r) => setTimeout(r, 1500)); return { pose: n.pose, x: +n.x.toFixed(1), z: +n.z.toFixed(1), focus: g0.interact.focus && g0.interact.focus.label }; }, timeout: 30000 },
  { eval: async () => { const g0 = window.__game, b = g0.npcs.browses[0]; if (!b) return 'không có khách'; const a = g0.world.anchors['v_' + b.shop]; g0.player.setCarry(''); const d = 4.6, x = a.x + Math.sin(a.yaw) * d, z = a.z + Math.cos(a.yaw) * d; g0.player.place(x, z, Math.atan2(a.x - x, a.z - z), 0.02); await new Promise((r) => setTimeout(r, 1600)); return { shop: b.shop, khách: g0.npcs.browses.map((v) => v.n.pose), focus: g0.interact.focus && g0.interact.focus.label }; }, timeout: 30000 },
  { shot: 'r3_shoppers' },
  { eval: async () => { const g0 = window.__game; const n = g0.npcs.list.find((x) => x.pose === 'read') || g0.npcs.list.find((x) => x.pose === 'drink' || x.pose === 'chat'); if (!n) return 'không ai'; const th = n.yaw + Math.PI; g0.player.place(n.x + Math.sin(th) * 2.6, n.z + Math.cos(th) * 2.6, Math.atan2(n.x - g0.player.x, n.z - g0.player.z), -0.16); await new Promise((r) => setTimeout(r, 1500)); return { pose: n.pose }; }, timeout: 30000 },
  { shot: 'r3_idle' },
  { eval: () => { const c = {}; for (const n of window.__game.npcs.list) c[n.pose] = (c[n.pose] || 0) + 1; return { dáng: c, kháchĐứng: window.__game.npcs.browses.length }; } },
  { label: '④ quán cà phê Bóng Đá' },
  scan('tv_bongda', 'Bóng Đá'),
  { eval: () => { const g0 = window.__game; g0.g.cash = 400000; g0.g.st.mood = 30; window.__m0 = Math.round(g0.g.st.mood); window.__c0 = g0.g.cash; g0.interact.trigger(); return 1; }, quiet: true, wait: 1000 },
  { eval: dlg, max: 1400 },
  { shot: 'r3_cafe' },
  click('karaoke'),
  { eval: () => { const g0 = window.__game; return { tinhThần: `${window.__m0} → ${Math.round(g0.g.st.mood)}`, tiền: window.__c0 - g0.g.cash, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-70) }; }, wait: 900 },
  { eval: () => { window.__game.interact.trigger(); return 1; }, quiet: true, wait: 900 },
  { eval: dlg, max: 1400 },
  click('chạy bàn'),
  { eval: () => { const g = window.__game.g; return { cash: g.cash, side: g.led.side, năngLượng: Math.round(g.st.energy), giờ: Math.round(g.min) }; }, wait: 1000 },
  close,
  { label: '⑤ chùa Phước An' },
  scan('v_temple', 'chùa'),
  { eval: () => { const g0 = window.__game; g0.g.min = 12 * 60 + 10; g0.interact.trigger(); return 1; }, quiet: true, wait: 1000 },
  { eval: dlg, max: 1400 },
  { shot: 'r3_temple' },
  click('nhang'),
  { eval: () => ({ tinhThần: Math.round(window.__game.g.st.mood), cash: window.__game.g.cash, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-70) }), wait: 900 },
  close,
  { label: '⑥ ghế đá phố' },
  { eval: async () => { const g0 = window.__game, sleep = (ms) => new Promise((r) => setTimeout(r, ms)); for (let i = 0; i < g0.world.benches.length; i++) { const b = g0.world.benches[i]; g0.player.place(b.x, b.z + 1.0, Math.PI, 0); await sleep(600); const f = g0.interact.focus; if (f && f.label.includes('ghế đá')) { window.__bench = i; return { i, x: +b.x.toFixed(0), z: +b.z.toFixed(0), label: f.label, sub: f.sub }; } } return 'không có ghế nào ngồi nghỉ được'; }, timeout: 40000 },
  { eval: () => { const g0 = window.__game, b = g0.world.benches[window.__bench]; window.__m1 = Math.round(g0.g.st.mood); g0.interact.trigger(); return { mood0: window.__m1 }; }, wait: 1200 },
  { eval: () => ({ tinhThần: `${window.__m1} → ${Math.round(window.__game.g.st.mood)}`, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-60) }), max: 350 },
  { shot: 'r3_bench' },
  { label: '⑦ cảng: ca bốc vác' },
  { eval: () => { const g0 = window.__game; g0.g.min = 7 * 60; g0.g.st.energy = 90; g0.g.cash = 100000; window.__c2 = g0.g.cash; const n = g0.npcs.fixed.get('dock'); if (!n) return 'thiếu NPC cảng'; g0.player.place(n.x + 1.7, n.z + 0.3, -Math.PI / 2, 0); return { name: n.name, ẩn: n.hidden, x: +n.x.toFixed(1), z: +n.z.toFixed(1) }; }, wait: 1400 },
  { eval: () => { const g0 = window.__game; g0.g.min = 7 * 60; g0.acts.talk(g0.npcs.fixed.get('dock')); return 1; }, quiet: true, wait: 1100 },
  { eval: dlg, max: 1400 },
  { shot: 'r3_dock' },
  click('bốc cá'),
  { eval: () => { const g = window.__game.g; return { cash: g.cash, lời: g.cash - window.__c2, năngLượng: Math.round(g.st.energy), side: g.led.side, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-70) }; }, wait: 900 },
  close,
  { eval: () => ({ toasts: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-140) }) },
];
