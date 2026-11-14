// Lượt 14 — "Con người & nhân vật": 16 biểu cảm, 8 kiểu tóc, người phụ việc ở quầy.
// Chạy: cd tools/probe && OUT=/tmp/probe/nguoi node play.mjs steps/nguoi.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(9 * 60),

  { label: '① bảng biểu cảm: 16 cột × 8 hàng (8 biểu cảm mới ở nửa phải)' },
  { eval: () => window.__faces(), wait: 700 },
  { shot: OUT + 'bieu_cam' },
  { eval: () => { document.getElementById('__faces')?.remove(); return true; }, wait: 200 },

  { label: '② tám kiểu tóc xếp hàng (0 ngắn, 1 dài, 2 búi, 3 hói, 4 xoăn, 5 đuôi ngựa, 6 húi cua, 7 tém)' },
  { eval: async () => {
    const g0 = window.__game;
    const sp = g0.stall.spots().find((s) => s.id === 'cv');
    const cx = sp.x, cz = sp.z + 2.6, p = { x: cx, z: cz + 2.7 };
    g0.world.resolve(p.x, p.z, 0.5, p);
    g0.player.place(p.x, p.z, Math.atan2(cx - p.x, cz - p.z));
    const shirts = [0x2f8fd5, 0xe86f9a, 0xf5c531, 0x6a8a4a, 0xb9a88a, 0xf3f0e8, 0x8a5a9a, 0x4a5a6a];
    const hair = [0x1e1a18, 0x3a2a22, 0x6a3a22, 0xd9d9d6];
    const out = [];
    for (let i = 0; i < 8; i++) {
      const n = g0.npcs.spawnPed(p.x, p.z, 18, 30);
      if (!n) { out.push({ i, loi: 'không spawn được' }); continue; }
      n.kind = 'actor'; n.state = 'stand'; n.pose = 'idle'; n.timer = 1e9; n.plan = []; n.greetT = 1e9;
      n.fem = i === 1 || i === 2 || i === 5 || i === 7;
      n.rig.setLook({ face: i === 3 || i === 4 ? 0 : i % 8, fem: n.fem, shirt: shirts[i], pants: 0x2a2e3a, hair: hair[i % 4], hat: 0,
        hairStyle: i, fat: 1, h: 1, skin: 0xf2c9a4, bag: 0, hatCol: 0x2f6fb5, long: false, apron: 0, shoe: 0x2a2a2a });
      n.y = g0.player.y;
      n.x = cx + (i - 3.5) * 0.74; n.z = cz; n.yaw = Math.atan2(p.x - n.x, p.z - n.z);
      out.push({ i, hairStyle: n.rig.look.hairStyle });
    }
    window.__cam(cx, 1.95, cz + 3.4, cx, 1.05, cz);
    await new Promise((r) => setTimeout(r, 900));
    return out;
  }, wait: 1400 },
  { shot: OUT + 'kieu_toc' },

  { label: '③ điều kiện người phụ việc: doanh thu + số ngày bán + bậc quầy' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, R = window.__R;
    const sp = g0.stall.spots().find((s) => s.id === 'cho');
    g.stall = { ...g.stall, tier: 3, where: 'placed', spot: sp.id, x: sp.x, z: sp.z, yaw: sp.yaw, open: false };
    g.cash = 20000000; g.led.revenue = 0; delete g.flags.firstSale;
    const chuaCoGi = R.helperGate(g);
    g.led.revenue = 420000; g.flags.firstSale = g.day;
    const moiBan = R.helperGate(g);
    g.flags.firstSale = g.day - 3;
    const duDieuKien = R.helperGate(g);
    return { chuaCoGi: { ok: chuaCoGi.ok, why: chuaCoGi.why }, moiBanMotNgay: { ok: moiBan.ok, why: moiBan.why },
      duDieuKien: { ok: duDieuKien.ok, revenue: duDieuKien.revenue, days: duDieuKien.days } };
  }, wait: 300 },

  { label: '④ người tới xin việc (hộp thoại + biểu cảm)' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, R = window.__R;
    const sp = g0.stall.spots().find((s) => s.id === 'cho');
    g.stall.open = true;
    const [sx, sz] = g0.stall.standPos();
    g0.player.place(sx, sz, Math.atan2(sp.x - sx, sp.z - sz));
    const d = R.helperCandidate(g);
    const n = g0.npcs.spawnPed(sp.x, sp.z, 18, 30);
    n.kind = 'actor'; n.name = d.name; n.fem = d.fem;
    n.rig.setLook({ face: d.face, fem: d.fem, shirt: d.shirt, pants: d.pants, hair: d.hair, hat: 0, hairStyle: d.hairStyle,
      fat: 1, h: 0.97, skin: d.skin, bag: 0, hatCol: 0x2f6fb5, long: false, apron: 0, shoe: 0x2a2a2a });
    const [hx, hz] = g0.stall.helperSpot();
    n.x = hx; n.z = hz; n.y = g0.player.y; n.yaw = sp.yaw; n.state = 'stand'; n.pose = 'idle'; n.timer = 1e9;
    g0.stall.offerArrive(n, d);
    window.__cam(hx + 1.7, 1.9, hz + 2.2, hx, 1.15, hz);
    await new Promise((r) => setTimeout(r, 900));
    return { ungVien: d.name, luong: d.wage, hoiThoai: document.querySelector('#dlg p')?.textContent?.slice(0, 90) };
  }, wait: 1200 },
  { shot: OUT + 'phu_viec_xin_viec' },

  { label: '⑤ nhận việc: trả trước một ngày lương' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    const truoc = g.cash;
    const btn = [...document.querySelectorAll('#dlg .btn')][0];
    const nhan = btn?.textContent?.replace(/\s+/g, ' ').trim();
    btn?.click();
    g0.ui.closeDialog();
    await new Promise((r) => setTimeout(r, 1600));
    return { nut: nhan, daTru: truoc - g.cash, help: g.help && { ten: g.help.name, luong: g.help.wage, tuNgay: g.help.since },
      coNguoiDungQuay: !!g0.stall.helper, patience: +window.__R.helperPatience(g).toFixed(2) };
  }, wait: 1800 },
  { shot: OUT + 'phu_viec_dung_quay' },

  { label: '⑥ trò chuyện với người phụ việc' },
  { eval: async () => {
    const g0 = window.__game;
    g0.stall.talkHelper();
    await new Promise((r) => setTimeout(r, 500));
    return { hoiThoai: document.querySelector('#dlg p')?.textContent?.slice(0, 80), soNut: document.querySelectorAll('#dlg .btn').length };
  }, wait: 800 },
  { shot: OUT + 'phu_viec_tro_chuyen' },

  { label: '⑦ người phụ việc phản ứng theo tình huống (biểu cảm + câu nói)' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    g0.ui.closeDialog();
    const ra = [];
    const cases = [['khách đông', () => { g0.g.stall.dirt = 10; }, 0], ['trời mưa', null, 1], ['khuya', null, 2], ['bẩn quầy', () => { g.stall.dirt = 80; }, 3]];
    for (const [ten] of cases) { g0.stall.helperLine(g0.stall.helper); await new Promise((r) => setTimeout(r, 260)); ra.push(ten); }
    const bubbles = [...document.querySelectorAll('.bub')].map((b) => b.textContent.trim()).slice(0, 4);
    await new Promise((r) => setTimeout(r, 500));
    return { thu: ra, bongBong: bubbles, expr: g0.stall.helper?.rig?.expr };
  }, wait: 1400 },
  { shot: OUT + 'phu_viec_noi' },
];
