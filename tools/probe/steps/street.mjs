// Lượt 10 — đường phố 2005–2010: ô tô đời cũ nhả khói, vạch xuất phát đua xe đạp chủ nhật, mini-game đạp,
// xích đu công viên.
// Chạy: cd tools/probe && node play.mjs steps/street.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(15 * 60 + 30),
  { label: '① ô tô đời cũ trên đường công viên (dựng một chiếc đứng lại cho chụp)' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, T = g0.traffic;
    g.min = 15 * 60 + 40;
    // dựng một chiếc ô tô đứng yên trên làn ngoài của đường công viên
    let car = null;
    for (let i = 0; i < 16; i++) {
      const r = T.spawn();
      if (r.car) { car = r; break; }
      T.group.remove(r.grp);
    }
    if (!car) return { loi: 'không dựng được ô tô' };
    car.grp.position.set(44, 0, -27.4);
    car.grp.rotation.y = Math.PI / 2;                // đầu xe quay về +x
    const me = { x: 49.6, z: -31.7 };
    g0.player.place(me.x, me.z, Math.atan2(44 - me.x, -27.4 - me.z), -0.1);
    window.__cam(me.x, 1.45, me.z, 44, 0.85, -27.4);
    T.puff(42.1, 0.32, -27.4); T.puff(42.0, 0.4, -27.3);
    const kinds = {};
    for (const r of T.list) if (r.car) kinds[r.car] = (kinds[r.car] || 0) + 1;
    return { loai: car.car, soOto: kinds, tongXe: T.list.length };
  }, wait: 900 },
  { shot: OUT + 'oto_doi_cu' },
  { label: '② vạch xuất phát + bảng đua ở đường công viên' },
  { eval: async () => {
    const g0 = window.__game, a = g0.world.anchors['dua_xe'];
    if (!a) return { loi: 'thiếu neo dua_xe' };
    const me = { x: a.x - 3.6, z: a.z + 5.2 };
    g0.player.place(me.x, me.z, Math.atan2(a.x - me.x, a.z - me.z), -0.05);
    await new Promise((r) => setTimeout(r, 500));
    window.__cam(me.x, 1.72, me.z, a.x + 1.2, 1.0, a.z - 0.4);
    const lan = g0.npcs.list.find((n) => n.fixedId === 'dua');
    return { neo: { x: +a.x.toFixed(1), z: +a.z.toFixed(1) }, lan: lan ? { ten: lan.name, x: +lan.x.toFixed(1), z: +lan.z.toFixed(1) } : null };
  }, wait: 1800 },
  { shot: OUT + 'vach_xuat_phat' },
  { label: '③ chạm con Lan: hộp thoại đăng ký đua' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g.cash = 200000; g.st.energy = 85; g.st.mood = 50;
    const n = g0.npcs.list.find((x) => x.fixedId === 'dua');
    if (!n) return { loi: 'không thấy con Lan' };
    g0.acts.talk(n);
    const opts = [...document.querySelectorAll('#dlg .btn')].map((b) => b.textContent.replace(/\s+/g, ' ').trim());
    return { ten: n.name, mo: !document.querySelector('#dlg').classList.contains('hide'), opts };
  }, wait: 900 },
  { shot: OUT + 'hop_thoai_dua' },
  { label: '④ vào cuộc đua: vòng 1, con chạy quét, nút ĐẠP' },
  { eval: async () => {
    const b = [...document.querySelectorAll('#dlg .btn')].find((e) => e.textContent.includes('Đăng ký đua'));
    if (b) b.click();
    await new Promise((r) => setTimeout(r, 500));
    const g0 = window.__game, race = g0.race;
    // đu tới giữa vùng ăn điểm để khung hình có con chạy trong vùng xanh
    const beat = race.beats[race.idx];
    if (beat) race.pos = (beat.lo + beat.hi) / 2;
    await new Promise((r) => setTimeout(r, 120));
    const cook = document.querySelector('#cook');
    return {
      dangDua: race.active, mode: g0.mode, hien: !cook.classList.contains('hide'),
      tieuDe: cook.querySelector('.title').textContent, goiY: cook.querySelector('.hint').textContent,
      nut: [...cook.querySelectorAll('.btns .btn')].map((x) => x.textContent.trim()),
      vong: cook.querySelector('.steps').textContent,
    };
  }, wait: 700 },
  { shot: OUT + 'dua_man_hinh' },
  { label: '⑤ bấm đúng nhịp cả chín lần: thắng ba vòng, nhận 40.000₫' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, race = g0.race;
    const truoc = { tien: g.cash, rep: Math.round(g.rep), mood: Math.round(g.st.mood), min: g.min, ngay: g.day };
    const diem = [];
    for (let i = 0; i < 14 && race.active; i++) {
      const beat = race.beats[race.idx];
      if (!beat) break;
      race.pos = (beat.lo + beat.hi) / 2;
      race.tap();
      diem.push(+race.scores[race.scores.length - 1].toFixed(2));
    }
    await new Promise((r) => setTimeout(r, 400));
    return { diem, conDua: race.active, mode: g0.mode, truoc, sau: { tien: g.cash, rep: Math.round(g.rep), mood: Math.round(g.st.mood), min: g.min }, raceDay: g.flags.raceDay, thang: g.flags.raceWin };
  }, wait: 1400 },
  { shot: OUT + 'dua_ket_qua' },
  { label: '⑥ đua xong thì không đăng ký lại được trong ngày' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g0.ui.closeDialog();
    const n = g0.npcs.list.find((x) => x.fixedId === 'dua');
    g0.acts.raceMenu(n);
    const opts = [...document.querySelectorAll('#dlg .btn')].map((b) => ({ t: b.textContent.replace(/\s+/g, ' ').trim(), off: b.classList.contains('off') }));
    return { opts };
  }, wait: 700 },
  { shot: OUT + 'dua_da_dua_roi' },
  { label: '⑦ xích đu ở sân chơi công viên' },
  { eval: async () => {
    const g0 = window.__game, a = g0.world.anchors['xich_du'];
    if (!a) return { loi: 'thiếu neo xich_du' };
    g0.ui.closeDialog();
    const me = { x: a.x + 0.4, z: a.z + 2.1 };
    g0.player.place(me.x, me.z, Math.atan2(a.x - me.x, a.z - me.z), -0.02);
    await new Promise((r) => setTimeout(r, 600));
    window.__cam(me.x, 1.55, me.z, a.x, 1.1, a.z - 2.2);
    const f = g0.interact.focus;
    return { neo: { x: +a.x.toFixed(1), z: +a.z.toFixed(1) }, nhan: f ? f.label : null };
  }, wait: 1600 },
  { shot: OUT + 'xich_du' },
  { label: '⑧ menu xích đu: ba mức thời gian' },
  { eval: () => {
    const g0 = window.__game;
    g0.acts.funMenu('xich_du');
    const opts = [...document.querySelectorAll('#dlg .btn')].map((b) => b.textContent.replace(/\s+/g, ' ').trim());
    return { opts };
  }, wait: 800 },
  { shot: OUT + 'xich_du_menu' },
  { label: '⑨ đu 40 phút: tinh thần lên, thời gian trôi' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    const truoc = { mood: Math.round(g.st.mood), min: g.min, energy: Math.round(g.st.energy) };
    const b = [...document.querySelectorAll('#dlg .btn')].find((e) => e.textContent.includes('40 phút'));
    if (b) b.click();
    await new Promise((r) => setTimeout(r, 300));
    return { truoc, sau: { mood: Math.round(g.st.mood), min: g.min, energy: Math.round(g.st.energy) } };
  }, wait: 900 },
  { shot: OUT + 'xich_du_xong' },
];
