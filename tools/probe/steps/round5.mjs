// Lượt 5: ba chỗ ở mới (căn hộ, nhà riêng, cửa hàng kiêm nhà ở) — vào nhà, ngủ, thuê, đòi uy tín.
// Chạy: cd tools/probe && node play.mjs steps/round5.mjs
import { boot, fresh, rich } from '../lib.mjs';
const dlg = () => { const d = document.querySelector('#dlg'); return d.classList.contains('hide') ? null : { t: d.querySelector('h3').innerText, text: d.querySelector('p').innerText.slice(0, 110), opts: [...d.querySelectorAll('.btn')].map((b) => (b.disabled ? '✗ ' : '') + b.innerText.split('\n')[0]) }; };
const toast = () => document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-140);
const T = 'document.querySelector("#toasts").innerText.replace(/\\n+/g, " | ").slice(-140)';
const click = (txt) => ({ eval: (txt) => { const b = [...document.querySelectorAll('#dlg .btn')].find((x) => x.innerText.includes(txt)); if (!b) return 'không có'; if (b.disabled) return 'bị khoá'; b.click(); return 'ok'; }, args: [txt], wait: 900 });
const close = { eval: () => { window.__game.ui.closeDialog(); window.__game.mode = 'play'; if (window.__cam) window.__cam(); return 1; }, quiet: true, wait: 300 };
/** Đứng trước cửa một chỗ ở rồi bấm vào cửa để vào trong. */
const enter = (anchor, dx = 0, dz = 2.6) => ({ eval: async (a, dx, dz) => {
  const g0 = window.__game, an = g0.world.anchors[a];
  if (!an) return 'thiếu mỏ neo ' + a;
  if (window.__cam) window.__cam();
  g0.player.place(an.x + dx, an.z + dz, Math.PI, 0);
  await new Promise((r) => setTimeout(r, 1500));
  g0.interact.update(0.05);
  const f = g0.interact.focus;
  return { anchor: a, at: [+an.x.toFixed(1), +an.z.toFixed(1)], focus: f && f.label, sub: f && f.sub };
}, args: [anchor, dx, dz], timeout: 30000 });
export default [boot, fresh(8 * 60), rich,
  { label: '⓪ ba chỗ ở mới đã dựng trong thành phố' },
  { eval: () => { const g0 = window.__game, A = g0.world.anchors; const need = ['bed_canho', 'store_canho', 'wash_canho', 'v_canho', 'bed_nharieng', 'store_nharieng', 'wash_nharieng', 'v_nharieng', 'bed_cuahang', 'store_cuahang', 'wash_cuahang', 'v_cuahang']; const miss = need.filter((k) => !A[k]); const lots = (g0.world.doors || []).length; const doors = (g0.world.doors || []).map((d) => d.name).filter((n) => /canho|nharieng|cuahang/.test(n)); const houseDoors = (g0.world.doors || []).filter((d) => /^door_house/.test(d.name)).length; return { thiếu: miss, sốCửa: lots, doors, cửaNhàPhụ: houseDoors }; } },
  { label: '① căn hộ An Bình: vào trong, có bếp, có giường' },
  enter('v_canho'),
  { eval: () => { const g0 = window.__game; return { mode: g0.mode, cam: g0.camera.position.toArray().map((v) => +v.toFixed(1)), inside: !!g0.world.anchors.bed_canho }; } },
  { eval: () => { const g0 = window.__game, A = g0.world.anchors, v = A.v_canho, b = A.bed_canho; g0.mode = 'play'; window.__cam(v.x, 1.7, v.z - 1.2, b.x - 1.2, 0.55, b.z); return { cam: g0.camera.position.toArray().map((n) => +n.toFixed(1)) }; }, wait: 2000 },
  { shot: 'r5_canho' },
  { label: '①b cửa còn khoá vì chưa thuê' },
  { eval: () => { const g0 = window.__game, d = g0.world.doors.find((x) => x.name === 'door_canho'); g0.player.place(d.x, d.z + 2.0, Math.PI, 0); window.__cam(d.x, 1.8, d.z + 3.2, d.x, 1.1, d.z); return { cửa: d.name, yaw: +d.yaw.toFixed(2) }; }, wait: 2600 },
  { eval: () => { const g0 = window.__game; g0.interact.update(0.05); const f = g0.interact.focus; g0.interact.trigger(); return { focus: f && f.label, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-90) }; }, wait: 900 },
  close,
  { label: '② ngủ ở căn hộ — thuê chưa đủ uy tín thì bị từ chối' },
  { eval: () => { const g0 = window.__game, g = g0.g; g0.ui.closeDialog(); g0.mode = 'play'; const an = g0.world.anchors.bed_canho; g0.player.place(an.x, an.z + 0.9, 0, 0); g0.acts.sleepMenu('canho'); return { housing: g.housing, rep: g.rep, min: g.min }; }, wait: 900 },
  { eval: dlg, max: 400 },
  { eval: () => ({ dlg: !!document.querySelector('#dlg').classList.contains('hide'), toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-120) }) },
  close,
  { label: '③ thuê căn hộ khi đủ uy tín và đủ tiền' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.rep = 40; g.cash = 2500000; const n = g0.npcs.fixed.get('canho'); if (!n) return 'thiếu chủ nhà'; g0.player.place(n.x + 1.4, n.z + 0.3, -Math.PI / 2, 0); g0.interact.update(0.05); const f = g0.interact.focus; return { npc: n.name, focus: f && f.label, hidden: n.hidden }; }, wait: 900 },
  { eval: () => { const g0 = window.__game; g0.acts.talk(g0.npcs.fixed.get('canho')); return 1; }, quiet: true, wait: 1200 },
  { eval: dlg, max: 400 },
  click('Thuê —'),
  { eval: () => { const g0 = window.__game, g = g0.g; return { housing: g.housing, paidUntil: g.paidUntil, cash: g.cash, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-130) }; } },
  { eval: () => { const g0 = window.__game, d = g0.world.doors.find((x) => x.name === 'door_canho'); g0.player.place(d.x, d.z + 2.0, Math.PI, 0); window.__cam(d.x, 1.8, d.z + 3.2, d.x, 1.1, d.z); return 1; }, quiet: true, wait: 2600 },
  { eval: () => { const g0 = window.__game; g0.interact.update(0.05); const f = g0.interact.focus; return { focus: f && f.label }; } },
  { shot: 'r5_rent' },
  close,
  { label: '④ ngủ một giấc trong căn hộ đã thuê' },
  { eval: () => { const g0 = window.__game, g = g0.g; const an = g0.world.anchors.bed_canho; g0.player.place(an.x, an.z + 0.9, 0, 0); g0.acts.sleepMenu('canho'); return { opts: [...document.querySelectorAll('#dlg .btn')].map((b) => b.innerText.split('\n')[0]) }; }, wait: 900 },
  click('Ngủ'),
  { eval: async () => { const g0 = window.__game, g = g0.g; const e0 = g.st.energy; await new Promise((r) => setTimeout(r, 2500)); return { energy: [Math.round(e0), Math.round(g.st.energy)], min: g.min, mode: g0.mode, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-130) }; }, timeout: 30000 },
  { shot: 'r5_sleep' },
  { label: '⑤ nhà số 12 (nhà riêng): vào sân, vào buồng ngủ' },
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; if (window.__cam) window.__cam(); g0.g.min = 9 * 60; return 1; }, quiet: true },
  enter('v_nharieng', 0, 3.2),
  { eval: () => ({ cam: window.__game.camera.position.toArray().map((v) => +v.toFixed(1)) }), wait: 400 },
  { eval: () => { const g0 = window.__game, A = g0.world.anchors, v = A.v_nharieng, b = A.bed_nharieng; g0.player.place(v.x, v.z, Math.atan2(b.x - v.x, b.z - v.z), -0.1); return { yaw: +g0.player.yaw.toFixed(2) }; }, wait: 1600 },
  { shot: 'r5_nharieng' },
  { label: '⑥ tạp hoá Bình An: quầy bán phía trước, buồng ngủ phía sau' },
  enter('v_cuahang', 0, 3.0),
  { eval: () => { const g0 = window.__game, A = g0.world.anchors, v = A.v_cuahang, b = A.bed_cuahang; g0.player.place(v.x, v.z, Math.atan2(b.x - v.x, b.z - v.z), -0.1); return { yaw: +g0.player.yaw.toFixed(2) }; }, wait: 1600 },
  { shot: 'r5_cuahang' },
  { label: '⑦ nhân viên/chủ nhà đứng đúng chỗ, giờ mở cửa đúng' },
  { eval: () => { const g0 = window.__game, out = {}; for (const id of ['canho', 'nharieng', 'cuahang']) { const n = g0.npcs.fixed.get(id); out[id] = n ? { name: n.name, x: +n.x.toFixed(1), z: +n.z.toFixed(1), pose: n.pose } : 'thiếu'; } const R = window.__R, P = g0.npcs; g0.g.min = 8 * 60; out.gioMo = ['canho', 'nharieng', 'cuahang', 'tro'].map((k) => k + ':' + window.__open(k)); g0.g.min = 23 * 60; out.gioDong = ['canho', 'nharieng', 'cuahang'].map((k) => k + ':' + window.__open(k)); g0.g.min = 9 * 60; return out; } },
  { label: '⑧ nợ tiền nhà thì chủ nhà lấy lại (câu chung, không chỉ Bác Năm)' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.cash = 2500000; g.rep = 40; window.__R.payHousing(g, 'nharieng'); g.home.push({ id: 'gao', n: 2, fresh: 90, q: 0.9, cost: 12000 }); g.paidUntil = g.day - 2; g.cash = 0; g.min = 23 * 60 + 50; window.__R.advance(g, 20, g0.acts.act()); return { housing: g.housing, home: g.home.length, toast: document.querySelector('#toasts').innerText.replace(/\n+/g, ' | ').slice(-160) }; }, wait: 900 },
];
