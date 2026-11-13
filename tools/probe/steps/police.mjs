// Lượt 7 — công an phường: đồn trong thành phố, bị để ý, phạt hành chính, buồng tạm giữ, đập đá, ra tù.
// Chạy: cd tools/probe && node play.mjs steps/police.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(16 * 60),
  { label: '① đồn công an có thật: neo, chú công an trực, buồng giam sau vách' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors, cop = g0.npcs.fixed.get('police');
    const d = (p, q) => +Math.hypot(p.x - q.x, p.z - q.z).toFixed(1);
    return {
      neo: ['v_police', 'giuong_giam', 'lao_dong', 'cua_don'].map((k) => `${k}:${A[k] ? 'có' : 'THIẾU'}`),
      chuCongAn: cop ? { ten: cop.name, trangThai: cop.state } : null,
      cachBanc: d(A.v_police, A.giuong_giam), cachDongGach: d(A.giuong_giam, A.lao_dong),
      lo: g0.world.lots.filter((l) => l.kind === 'police').map((l) => [l.id, l.w]),
    };
  } },
  { label: '② nhìn mặt tiền đồn từ bên kia đường' },
  { eval: () => {
    const g0 = window.__game, lot = g0.world.lots.find((l) => l.kind === 'police'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const out = pt(lot.w / 2, -9.0), door = pt(lot.w / 2, 0.8);
    g0.player.place(out.x, out.z + 1, Math.atan2(door.x - out.x, door.z - out.z), 0.05);
    window.__cam(out.x, 3.0, out.z, door.x, 5.0, door.z);
    return { rong: +lot.w.toFixed(1) };
  }, quiet: true, wait: 3400 },
  { shot: OUT + 'cong_an_ngoai' },
  { label: '③ trong đồn: bàn tiếp dân, vách ngăn, buồng tạm giữ phía sau' },
  { eval: () => {
    const g0 = window.__game, lot = g0.world.lots.find((l) => l.kind === 'police'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const cam = pt(2.0, 0.6), look = pt(4.6, 7.4);
    g0.player.place(cam.x, cam.z, Math.atan2(look.x - cam.x, look.z - cam.z), 0);
    window.__cam(cam.x, 1.8, cam.z, look.x, 1.4, look.z);
    return 1;
  }, quiet: true, wait: 3400 },
  { shot: OUT + 'cong_an_trong' },
  { label: '④ đứng trước chú công an: bấm được để nói chuyện' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors;
    window.__cam();
    const a = A.v_police;
    g0.player.place(a.x, a.z + 2.2, Math.PI, -0.2);
    return { dat: [+a.x.toFixed(1), +a.z.toFixed(1)] };
  }, quiet: true, wait: 1500 },
  { eval: () => { const g0 = window.__game; g0.interact.update(0.05); return { focus: g0.interact.focus && g0.interact.focus.label, sub: g0.interact.focus && g0.interact.focus.sub }; } },
  { label: '④b nằm giường buồng giam & đống gạch cũng bấm được' },
  { eval: () => { const g0 = window.__game, b = g0.world.anchors.giuong_giam; g0.player.place(b.x + 1.6, b.z, -Math.PI / 2, -0.32); return 1; }, quiet: true, wait: 1500 },
  { eval: () => { const g0 = window.__game; g0.interact.update(0.05); return { giuong: g0.interact.focus && g0.interact.focus.label }; } },
  { eval: () => { const g0 = window.__game, b = g0.world.anchors.lao_dong; g0.player.place(b.x, b.z - 1.7, 0, -0.32); return 1; }, quiet: true, wait: 1500 },
  { eval: () => { const g0 = window.__game; g0.interact.update(0.05); return { dongGach: g0.interact.focus && g0.interact.focus.label }; } },
  { label: '⑤ đấm người: mức bị để ý tăng, công an đi tuần được gọi ra' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, p = g0.player;
    const lot = g0.world.lots.find((l) => l.id === 'kiosk'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const me = pt(lot.w / 2, -2.7), out = pt(lot.w / 2, -6.2), face = pt(lot.w / 2, 2);
    const yaw = Math.atan2(face.x - me.x, face.z - me.z);
    p.place(me.x, me.z, yaw, -0.03);
    const n = g0.npcs.list.find((x) => (x.kind === 'ped' || x.kind === 'actor') && !x.hidden && x.state !== 'queue');
    if (!n) return { loi: 'không có người đi đường' };
    n.x = me.x + Math.sin(yaw) * 1.2; n.z = me.z + Math.cos(yaw) * 1.2; n.state = 'stand'; n.path = []; n.speed = 0;
    g0.acts.punch();
    const sauDam = +g.wanted.toFixed(0);
    g.wanted = 60;
    const cop = g0.npcs.sendPolice();
    if (cop) window.__cam(out.x + 0.9, 2.1, out.z, cop.x, 1.4, cop.z);
    return { wantedSau1Dam: sauDam, cop: cop ? cop.name : null, state: cop && cop.state, xa: cop ? +Math.hypot(cop.x - me.x, cop.z - me.z).toFixed(1) : null, wanted: g.wanted };
  }, wait: 1500 },
  { shot: OUT + 'cong_an_goi_lai' },
  { label: '⑥ chú công an đứng sát: hội thoại xử lý vi phạm mở ra' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, p = g0.player;
    const cop = g0.npcs.list.find((n) => n.state === 'cop') || g0.npcs.sendPolice();
    if (!cop) return { loi: 'không có công an' };
    g.cash = 400000;
    p.place(cop.x, cop.z + 1.4, Math.PI, -0.3);
    cop.state = 'stand'; cop.hit = false; cop.path = [];
    g0.acts.caught(cop);
    await new Promise((r) => setTimeout(r, 300));
    const d = document.querySelector('#dlg');
    return { hien: !d.classList.contains('hide'), cau: [...d.querySelectorAll('.btn')].map((b) => b.textContent.trim().slice(0, 40)), phi: g.wanted };
  }, wait: 400 },
  { shot: OUT + 'hoi_thoai_cong_an' },
  { label: '⑦ theo chú về phường: bị đưa vào buồng tạm giữ, đồng hồ chạy' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    g.wanted = 70;
    g0.acts.sendToJail(g0.npcs.list.find((n) => n.state === 'cop') || null, '');
    await new Promise((r) => setTimeout(r, 1700));
    const A = g0.world.anchors.giuong_giam, p = g0.player;
    const lot = g0.world.lots.find((l) => l.kind === 'police'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const cam = pt(8.5, 6.6), look = pt(2.6, 8.7);
    window.__cam(cam.x, 2.1, cam.z, look.x, 0.9, look.z);
    const gio = +((g.jailUntil - (g.day * 1440 + g.min)) / 60).toFixed(1);
    return { trongBuong: g.jailUntil > 0, conLai: gio, wanted: g.wanted, soLanVao: g.flags.jail, cachGiuong: +Math.hypot(p.x - A.x, p.z - A.z).toFixed(1), dongBang: p.frozen };
  }, wait: 2600 },
  { shot: OUT + 'buong_tam_giu' },
  { label: '⑧ đập đá mỗi giờ bớt một giờ, sức tụt; nằm giường chờ' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    const before = { gio: +((g.jailUntil - (g.day * 1440 + g.min)) / 60).toFixed(1), hp: Math.round(g.st.health), en: Math.round(g.st.energy), hy: Math.round(g.st.hygiene) };
    g0.acts.prisonLabour();
    const sau1 = { gio: +((g.jailUntil - (g.day * 1440 + g.min)) / 60).toFixed(1), hp: Math.round(g.st.health), en: Math.round(g.st.energy) };
    g0.acts.prisonLabour();
    const sau2 = { gio: +((g.jailUntil - (g.day * 1440 + g.min)) / 60).toFixed(1) };
    g0.acts.prisonRest();
    const sau3 = { gio: +((g.jailUntil - (g.day * 1440 + g.min)) / 60).toFixed(1), en: Math.round(g.st.energy) };
    return { before, sau1, sau2, sau3, soBuoiDapDa: 2 };
  } },
  { label: '⑨ hết hạn: thả ra trước cửa đồn, uy tín & tinh thần tụt' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, p = g0.player;
    g.rep = 55; g.st.mood = 62; g.st.hygiene = 70;
    const truoc = { rep: g.rep, mood: Math.round(g.st.mood), hy: Math.round(g.st.hygiene), gio: g.min, ngay: g.day };
    g.jailUntil = g.day * 1440 + g.min - 1;
    await new Promise((r) => setTimeout(r, 2400));
    const A = g0.world.anchors.cua_don, A2 = g0.world.anchors.v_police;
    const ref = A || A2;
    const fr = g0.world.lots.find((l) => l.kind === 'police').fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s2 = Math.sin(fr.yaw), L = ref.x * 0 + lx; return { x: fr.tx + L * c + lz * s2, z: fr.tz - L * s2 + lz * c }; };
    const out = pt(4.5, -9.5);
    window.__cam(out.x, 2.9, out.z, ref.x, 2.4, ref.z);
    return { truoc, sauRep: +g.rep.toFixed(1), mood: Math.round(g.st.mood), hy: Math.round(g.st.hygiene), trongBuong: g.jailUntil > 0, cachCua: +Math.hypot(p.x - ref.x, p.z - ref.z).toFixed(1) };
  }, wait: 900 },
  { shot: OUT + 'ra_tu' },
  { label: '⑩ HUD: chip “Bị để ý” hiện khi mức để ý cao' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    window.__cam();
    g.wanted = 62;
    await new Promise((r) => setTimeout(r, 600));
    const w = document.getElementById('wanted'), r = w.getBoundingClientRect();
    const hud = document.getElementById('hud-tr').getBoundingClientRect();
    return { hien: !w.classList.contains('hide'), chu: w.textContent.trim(), o: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], hud: [Math.round(hud.width), Math.round(hud.height)], mau: w.style.background };
  }, wait: 1400 },
  { shot: OUT + 'hud_bi_de_y' },
  { label: '⑪ bấm chú công an trực: menu tự thú / hỏi chuyện' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, cop = g0.npcs.fixed.get('police');
    g.wanted = 50; g.cash = 300000;
    g0.player.place(cop.x, cop.z + 2.0, Math.PI, -0.2);
    g0.acts.talk(cop);
    const d = document.querySelector('#dlg');
    return { hien: !d.classList.contains('hide'), cau: [...d.querySelectorAll('.btn')].map((b) => b.textContent.trim().slice(0, 40)) };
  }, wait: 500 },
  { shot: OUT + 'hoi_thoai_truc_ban' },
];
