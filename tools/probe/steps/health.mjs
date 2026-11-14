// Lượt 6 — sức khoẻ: nút đấm & nhảy, ngất vì máu về 0, Bệnh viện Phước An (khám bệnh, quầy thuốc, phòng hồi sức).
// Chạy: cd tools/probe && node play.mjs steps/health.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(9 * 60),
  { label: '① bệnh viện có thật trong thành phố: ba chỗ tương tác' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors, yta = g0.npcs.fixed.get('hospital');
    const d = (p, q) => +Math.hypot(p.x - q.x, p.z - q.z).toFixed(1);
    return {
      neo: ['v_hospital', 'quay_thuoc', 'giuong_benhvien'].map((k) => `${k}:${A[k] ? 'có' : 'THIẾU'}`),
      bacSi: yta ? { ten: yta.name, dung: yta.state } : null,
      cachNhaThuoc: d(A.v_hospital, A.v_pharmacy), cachCho: d(A.v_hospital, A.v_mart),
      doSau: d(A.v_hospital, A.giuong_benhvien),
    };
  } },
  { label: '② nhìn mặt tiền bệnh viện từ bên kia đường' },
  { eval: () => {
    const g0 = window.__game, lot = g0.world.lots.find((l) => l.kind === 'hospital'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const out = pt(lot.w / 2, -9.5), door = pt(lot.w / 2, 0.8);
    g0.player.place(out.x, out.z + 1, Math.atan2(door.x - out.x, door.z - out.z), 0.05);
    window.__cam(out.x, 3.0, out.z, door.x, 5.2, door.z);
    return { rong: +lot.w.toFixed(1), truoc: [+out.x.toFixed(1), +out.z.toFixed(1)] };
  }, quiet: true, wait: 3400 },
  { shot: OUT + 'benh_vien_ngoai' },
  { label: '③ trong sảnh: quầy thuốc bên phải, phòng hồi sức sau vách' },
  { eval: () => {
    const g0 = window.__game, lot = g0.world.lots.find((l) => l.kind === 'hospital'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const cam = pt(5.3, 0.7), look = pt(2.4, 7.6);
    g0.player.place(cam.x, cam.z, Math.atan2(look.x - cam.x, look.z - cam.z), 0);
    window.__cam(cam.x, 1.8, cam.z, look.x, 1.5, look.z);
    return 1;
  }, quiet: true, wait: 3400 },
  { shot: OUT + 'benh_vien_trong' },
  { label: '④ đứng trước quầy thuốc thì bấm được quầy thuốc' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors;
    window.__cam();
    const q = A.quay_thuoc;
    g0.player.place(q.x, q.z - 1.5, 0, -0.32);
    return { dat: [+q.x.toFixed(1), +q.z.toFixed(1)] };
  }, quiet: true, wait: 1400 },
  { eval: () => { const g0 = window.__game; g0.interact.update(0.05); return { focus: g0.interact.focus && g0.interact.focus.label, sub: g0.interact.focus && g0.interact.focus.sub }; } },
  { label: '④b giường hồi sức cũng bấm được' },
  { eval: () => { const g0 = window.__game, b = g0.world.anchors.giuong_benhvien; g0.player.place(b.x + 1.5, b.z, -Math.PI / 2, -0.32); return 1; }, quiet: true, wait: 1400 },
  { eval: () => { const g0 = window.__game; g0.interact.update(0.05); return { focus: g0.interact.focus && g0.interact.focus.label, sub: g0.interact.focus && g0.interact.focus.sub }; } },
  { label: '④c bác sĩ đứng sau quầy tiếp nhận' },
  { eval: () => { const g0 = window.__game, a = g0.world.anchors.v_hospital; g0.player.place(a.x, a.z + 2.4, Math.PI, -0.2); return 1; }, quiet: true, wait: 1400 },
  { eval: () => { const g0 = window.__game; g0.interact.update(0.05); return { focus: g0.interact.focus && g0.interact.focus.label }; } },
  { label: '⑤ mua thuốc cảm hết bệnh, nằm hồi sức hồi máu' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, R = window.__R;
    g.cash = 200000; g.st.health = 40; g.flags.sick = 1;
    const cam = R.buyMed(g, 'cam');
    const sauThuoc = { cash: g.cash, health: g.st.health, sick: !!g.flags.sick };
    const nghi = R.recover(g, 2);
    const sauNghi = { cash: g.cash, health: g.st.health };
    const kham = R.exam(g);
    return { cam, sauThuoc, nghi, sauNghi, kham: kham ? kham.slice(0, 36) : null, conTien: g.cash };
  } },
  { label: '⑥ đấm: người đi đường la lên, uy tín tụt' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, p = g0.player;
    g.rep = 60; g.st.mood = 50;
    const lot = g0.world.lots.find((l) => l.id === 'kiosk'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const me = pt(lot.w / 2, -2.7), out = pt(lot.w / 2, -6.4), face = pt(lot.w / 2, 2);
    const yaw = Math.atan2(face.x - me.x, face.z - me.z);
    p.place(me.x, me.z, yaw, -0.03);
    const n = g0.npcs.list.find((x) => (x.kind === 'ped' || x.kind === 'actor') && !x.hidden && x.state !== 'queue');
    if (!n) return { loi: 'không có người đi đường' };
    n.x = me.x + Math.sin(yaw) * 1.2; n.z = me.z + Math.cos(yaw) * 1.2; n.state = 'stand'; n.path = []; n.speed = 0;
    const truoc = g.rep;
    g0.acts.punch();
    window.__cam(out.x + 0.9, 2.0, out.z, n.x, 1.3, n.z);
    const sau1 = { rep: +g.rep.toFixed(1), hurt: n.hurt, state: n.state, cd: +g0.acts.punchCd.toFixed(2) };
    g0.acts.punch();
    return { ten: n.name, truoc, sau1, repBam2Lan: +g.rep.toFixed(1) };
  }, wait: 1200 },
  { shot: OUT + 'dam_nguoi' },
  { label: '⑦ nhảy: người chơi lên khỏi mặt đất rồi rơi xuống' },
  { eval: async () => {
    const g0 = window.__game, p = g0.player;
    window.__cam();
    g0.set.auto = false;
    await new Promise((r) => setTimeout(r, 1400));
    const truoc = { camTo: !!p.camTo, frozen: p.frozen, energy: +g0.g.st.energy.toFixed(0), carry: p.carry };
    g0.acts.jump();
    await new Promise((r) => setTimeout(r, 200));
    const len = p.jumpY;
    await new Promise((r) => setTimeout(r, 4000));
    return { ...truoc, cd: +g0.acts.jumpCd.toFixed(2), lenDinh: +len.toFixed(2), sauKhiRoi: +p.jumpY.toFixed(2) };
  }, wait: 200 },
  { label: '⑧ máu về 0: ngất, mất tiền, tỉnh dậy ở bệnh viện sáng hôm sau' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    g.cash = 120000; g.st.health = 0;
    g.bag = [{ id: 'gao', n: 4, fresh: 95, q: 0.9, cost: 5000 }, { id: 'muoi', n: 2, fresh: 95, q: 0.9, cost: 2000 }, { id: 'hanh', n: 3, fresh: 95, q: 0.9, cost: 1000 }];
    const truoc = { cash: g.cash, ngay: g.day, gio: g.min, bag: g.bag.length };
    g0.acts.checkFaint();
    await new Promise((r) => setTimeout(r, 2800));
    const A = g0.world.anchors.giuong_benhvien, p = g0.player;
    return {
      truoc, cashSau: g.cash, health: Math.round(g.st.health), ngaySau: g.day, gioSau: g.min,
      cachGiuong: +Math.hypot(p.x - A.x, p.z - A.z).toFixed(2), bagCon: g.bag.length, doRoi: g.lostBag.length,
      soLanNgat: g.flags.faint, mode: g0.mode, dongBang: p.frozen,
    };
  }, wait: 300 },
  { shot: OUT + 'tinh_day_benh_vien' },
  { label: '⑨ nhận lại đồ thất lạc trong ngày' },
  { eval: () => { const g0 = window.__game, g = g0.g, R = window.__R; const got = R.claimLost(g); return { nhan: got.length, bag: g.bag.length, conLai: g.lostBag.length, lan2: R.claimLost(g).length }; } },
  { label: '⑩ bấm thử bác sĩ: hội thoại bệnh viện mở ra' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors, yta = g0.npcs.fixed.get('hospital');
    g0.g.cash = 100000;
    g0.acts.talk(yta);
    const d = document.querySelector('#dlg');
    return { hien: !d.classList.contains('hide'), cau: [...d.querySelectorAll('.btn')].map((b) => b.textContent.trim().slice(0, 34)) };
  }, wait: 400 },
  { shot: OUT + 'hoi_thoai_bac_si' },
  { label: '⑪ nút đấm & nút nhảy có trên màn hình' },
  { eval: () => {
    const h = document.querySelector('#act2 .hit'), j = document.querySelector('#act2 .jump');
    const r = (e) => { const b = e.getBoundingClientRect(); return b.width > 20 ? Math.round(b.width) + 'x' + Math.round(b.height) : 'ẩn'; };
    return { nutDam: r(h), nutNhay: r(j), hien: getComputedStyle(document.getElementById('act2')).display };
  } },
];
