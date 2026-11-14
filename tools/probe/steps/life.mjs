// Lượt 11 — phố sống động: lịch sinh hoạt theo giờ, chào hỏi, dù khi mưa, đám đông xem đua,
// bàn cờ của Ông Tư đã dời chỗ, và rà biển hiệu bị lọt vào tường.
// Chạy: cd tools/probe && OUT=/tmp/probe/life node play.mjs steps/life.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(15 * 60 + 30),
  { label: '⓪ rà biển hiệu: cái nào bị tường cắt ngang hoặc chìa ra quá thấp' },
  { eval: () => {
    const g0 = window.__game, world = g0.world, signs = g0.city.signs || [];
    const bad = [];
    for (const s of signs) {
      // mép biển chạy theo phương vuông góc pháp tuyến
      const tx = -s.nz, tz = s.nx, hw = s.w / 2;
      let inside = 0, total = 0;
      for (let i = 0; i <= 6; i++) {
        const k = -1 + (i / 6) * 2;
        const x = s.x + tx * hw * k, z = s.z + tz * hw * k;
        if (world.blocked(x, z, 0.06)) inside++;
        total++;
      }
      const frac = inside / total;
      const buried = frac > 0.88;                              // biển nằm gọn trong vật cản
      const low = s.y0 < 1.95;                                 // mép dưới thấp: người chơi đụng đầu
      if (buried || low) bad.push({ x: +s.x.toFixed(1), z: +s.z.toFixed(1), w: +s.w.toFixed(2), y0: +s.y0.toFixed(2), y1: +s.y1.toFixed(2), inside: +frac.toFixed(2), buried, low });
    }
    const lows = bad.filter((b) => b.low && !b.buried);
    return { tongBien: signs.length, nghiNgo: bad.length, thap: lows.length, dsThap: lows.slice(0, 20), dsChon: bad.filter((b) => b.buried).slice(0, 6) };
  } },

  { label: '⓪b chụp từng biển thấp để xem cái nào chìa ra lối đi' },
  { eval: () => {
    const g0 = window.__game;
    window.__lowSigns = (g0.city.signs || []).filter((s) => s.y0 < 1.95 && s.y0 > 0.9 && s.w >= 0.8);
    window.__signCam = (i) => {
      const s = window.__lowSigns[i]; if (!s) return null;
      const len = Math.hypot(s.nx, s.nz) || 1, d = 2.8;
      const cx = s.x + (s.nx / len) * d, cz = s.z + (s.nz / len) * d;
      g0.player.place(cx, cz, Math.atan2(s.x - cx, s.z - cz), -0.04);
      window.__cam(cx, 1.58, cz, s.x, s.y0 + 0.25, s.z);
      return { i, x: +s.x.toFixed(1), z: +s.z.toFixed(1), w: +s.w.toFixed(2), y0: +s.y0.toFixed(2) };
    };
    return { soBienThap: window.__lowSigns.length };
  } },
  ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [
    { eval: (i) => window.__signCam(i), args: [i], wait: 420 },
    { shot: OUT + 'bien_' + i },
  ]),
  { label: '① bàn cờ Ông Tư ở chỗ mới (công viên, cạnh lối đi ngang hồ)' },
  { eval: async () => {
    const g0 = window.__game, a = g0.world.anchors['v_danh_co'];
    if (!a) return { loi: 'thiếu neo v_danh_co' };
    const cu = g0.npcs.fixed.get('danh_co');
    // đứng chếch sau lưng ông, nhìn ngang bàn cờ
    const me = { x: a.x - 1.9, z: a.z + 3.3 };
    g0.player.place(me.x, me.z, Math.atan2(a.x - me.x, a.z - me.z), -0.16);
    await new Promise((r) => setTimeout(r, 400));
    window.__cam(me.x, 1.45, me.z, a.x + 0.15, 0.7, a.z + 0.1);
    // ghế đá gần nhất phải cách bàn ít nhất 2,5 m — trước đây bàn nằm ngay trước ghế
    let dMin = 999;
    for (const b of g0.world.benches) dMin = Math.min(dMin, Math.hypot(b.x - a.x, b.z - a.z));
    return { neo: { x: +a.x.toFixed(1), z: +a.z.toFixed(1) }, ong: cu ? { ten: cu.name, x: +cu.x.toFixed(1), z: +cu.z.toFixed(1), mo: !cu.hidden } : null, cachGhe: +dMin.toFixed(2) };
  }, wait: 1500 },
  { shot: OUT + 'ban_co_moi' },

  { label: '② 17h30 ở công viên: người đi bộ kéo về ghế đá, quán nước, sân chơi' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, p = g0.player;
    g.min = 17 * 60 + 30; g.weather.now = 'nang';
    p.place(59, -47.5, Math.PI, -0.02);
    // đứng chờ cho người đi đường bốc ra quanh công viên rồi kéo về ghế đá
    for (let i = 0; i < 700; i++) g0.npcs.update(0.2);
    await new Promise((r) => setTimeout(r, 600));
    window.__cam(59, 1.75, -47.5, 55.5, 1.15, -56.5);
    const peds = g0.npcs.list.filter((n) => n.kind === 'ped');
    const plan = {};
    for (const n of peds) for (const t of n.plan || []) plan[t] = (plan[t] || 0) + 1;
    const ngoi = peds.filter((n) => n.state === 'sit');
    return { soNguoi: peds.length, keHoach: plan, dangNgoi: ngoi.length, ai: ngoi.slice(0, 4).map((n) => `${n.name} (${n.arch.id})`) };
  }, wait: 1600 },
  { shot: OUT + 'cong_vien_chieu' },

  { label: '③ chào hỏi: lại gần một người, nghe câu chào theo giờ' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, p = g0.player;
    g.min = 12 * 60 + 10; g.rep = 12;
    const n = g0.npcs.list.filter((x) => x.kind === 'ped' && x.state !== 'sit').sort((a, b) => (a.x - p.x) ** 2 + (a.z - p.z) ** 2 - ((b.x - p.x) ** 2 + (b.z - p.z) ** 2))[0];
    if (!n) return { loi: 'không có ai quanh đây' };
    n.x = p.x + 1.6; n.z = p.z + 1.2; n.yaw = Math.atan2(p.x - n.x, p.z - n.z);
    n.greetT = 0; n.state = 'stand'; n.timer = 30; n.path = [];
    for (let i = 0; i < 20; i++) g0.npcs.update(0.1);
    await new Promise((r) => setTimeout(r, 400));
    window.__cam(p.x, 1.62, p.z, n.x, 1.35, n.z);
    const said = [...document.querySelectorAll('.bub')].map((e) => e.textContent.replace(/\s+/g, ' ').trim());
    g0.npcs.markMet(n);
    return { ten: n.name, nhom: n.arch.id, quenMat: !!n.met, noi: said.slice(0, 2) };
  }, wait: 900 },
  { shot: OUT + 'chao_hoi' },

  { label: '④ trời mưa: người đi đường che dù' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, p = g0.player;
    g.min = 16 * 60; g.weather.now = 'muato'; g.weather.until = g.min + 120;
    p.place(-9, 3.5, Math.PI / 2, -0.03);
    for (let i = 0; i < 40; i++) g0.npcs.update(0.15);
    await new Promise((r) => setTimeout(r, 900));
    const umb = g0.npcs.list.filter((n) => n.umb).length;
    const sample = g0.npcs.list.filter((n) => n.umb).slice(0, 3).map((n) => n.name);
    return { soDu: umb, vaiNguoi: sample };
  }, wait: 700 },
  { shot: OUT + 'mua_du' },

  { label: '⑤ chủ nhật: dân xóm kéo ra xem đua xe đạp' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, RC = window.__RC || null;
    g.min = 15 * 60 + 45; g.weather.now = 'nang'; g.weather.until = g.min + 600; g.weather.wet = 0; g.weather.flood = 0;
    g.day = 7;                                        // chủ nhật (day % 7 === 0)
    g.flags.raceDay = -1;
    void RC;
    const a = g0.world.anchors['dua_xe'];
    g0.player.place(a.x, a.z, Math.PI, 0);
    await new Promise((r) => setTimeout(r, 300));
    g0.race.start();
    await new Promise((r) => setTimeout(r, 900));
    const watchers = g0.npcs.list.filter((n) => n.cheer);
    window.__cam(a.x - 5.5, 2.6, a.z + 7.5, a.x + 11, 0.9, a.z + 1.5);
    return { dangDua: g0.race.active, soNguoiXem: watchers.length, ten: watchers.slice(0, 3).map((n) => n.name) };
  }, wait: 3200 },
  { shot: OUT + 'khan_gia_dua' },

  { label: '⑥ thắng xong: khán giả cổ vũ, rồi trả lại trạng thái' },
  { eval: async () => {
    const g0 = window.__game, race = g0.race;
    while (race.active) { race.pos = 0.5 * (race.beats[race.idx].lo + race.beats[race.idx].hi); race.tap(); }
    await new Promise((r) => setTimeout(r, 700));
    const said = [...document.querySelectorAll('.bub')].map((e) => e.textContent.replace(/\s+/g, ' ').trim());
    return { cash: g0.g.cash, rep: +g0.g.rep.toFixed(1), noi: said.slice(0, 3) };
  }, wait: 400 },
  { shot: OUT + 'co_vu' },
];
