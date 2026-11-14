// Lượt 9 — quán net: mặt tiền, trong quán, dãy máy, chủ quán, khách ngồi máy, bảng giờ, mỏi mắt.
// Chạy: cd tools/probe && node play.mjs steps/net.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(15 * 60),
  { label: '① mặt tiền quán net nhìn từ vỉa hè' },
  { eval: () => {
    const g0 = window.__game, lot = g0.world.lots.find((l) => l.id === 'net');
    if (!lot) return { loi: 'không tìm thấy lô net' };
    const fr = lot.fr, pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const me = pt(lot.w / 2 - 1.2, -6.6), look = pt(lot.w / 2 - 0.4, 2.2);
    g0.player.place(me.x, me.z, Math.atan2(look.x - me.x, look.z - me.z), -0.1);
    window.__cam(me.x, 1.66, me.z, look.x, 1.85, look.z);
    return { w: lot.w, d: lot.d };
  }, wait: 2600 },
  { eval: async () => {
    const g0 = window.__game, lot = g0.world.lots.find((l) => l.id === 'net'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const me = pt(lot.w / 2 - 1.2, -6.6), look = pt(lot.w / 2 - 0.4, 2.2);
    await new Promise((r) => setTimeout(r, 400));
    window.__cam(me.x, 1.66, me.z, look.x, 1.85, look.z);
    await new Promise((r) => setTimeout(r, 700));
    window.__cam(me.x, 1.66, me.z, look.x, 1.85, look.z);
  }, wait: 1200 },
  { shot: OUT + 'net_mat_tien' },
  { label: '② trong quán: quầy, hai dãy máy, quạt trần, tủ nước' },
  { eval: () => {
    const g0 = window.__game, lot = g0.world.lots.find((l) => l.id === 'net'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const me = pt(4.6, 0.9), look = pt(4.4, 7.6);
    g0.player.place(me.x, me.z, Math.atan2(look.x - me.x, look.z - me.z), -0.13);
    window.__cam(me.x, 1.68, me.z, look.x, 1.15, look.z);
  }, wait: 1200 },
  { shot: OUT + 'net_trong_quan' },
  { label: '③ dãy máy bên trái, màn hình sáng, một máy dán giấy HỎNG' },
  { eval: () => {
    const g0 = window.__game, lot = g0.world.lots.find((l) => l.id === 'net'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const me = pt(4.9, 6.4), look = pt(0.9, 6.0);
    g0.player.place(me.x, me.z, Math.atan2(look.x - me.x, look.z - me.z), -0.12);
    window.__cam(me.x, 1.5, me.z, look.x, 1.15, look.z);
  }, wait: 1200 },
  { shot: OUT + 'net_day_may' },
  { label: '④ chủ quán: hộp thoại dịch vụ, có sạc nhờ và ba kiểu chơi' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g.cash = 500000;
    if (!g.phone) { g.phone = { id: 'cucgach', battery: 26 }; }
    const n = g0.npcs.list.find((x) => x.fixedId === 'net');
    if (!n) return { loi: 'không thấy chị Hạnh' };
    const a = g0.world.anchors['v_net'];
    const me = { x: a.x, z: a.z + 1.9 };
    g0.player.place(me.x, me.z, Math.atan2(a.x - me.x, a.z - me.z), -0.1);
    g0.acts.talk(n);
    const opts = [...document.querySelectorAll('#dlg .btn')].map((b) => b.textContent.replace(/\s+/g, ' ').trim());
    return { ten: n.name, coMat: true, opts, mo: !document.querySelector('#dlg').classList.contains('hide') };
  }, wait: 900 },
  { shot: OUT + 'net_hop_thoai' },
  { label: '⑤ bảng chọn gói giờ: 30 phút / 1 tiếng / 2 tiếng / 4 tiếng' },
  { eval: () => {
    const b = [...document.querySelectorAll('#dlg .btn')].find((e) => e.textContent.includes('chơi game'));
    if (b) b.click();
    const opts = [...document.querySelectorAll('#dlg .btn')].map((e) => e.textContent.replace(/\s+/g, ' ').trim());
    return { opts };
  }, wait: 800 },
  { shot: OUT + 'net_goi_gio' },
  { label: '⑥ chơi 2 tiếng: trừ tiền 6.000₫, tinh thần lên, thời gian trôi' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    const truoc = { tien: g.cash, min: g.min, mood: g.st.mood, doik: g.st.hunger, khat: g.st.thirst, ngay: g.day };
    const b = [...document.querySelectorAll('#dlg .btn')].find((e) => e.textContent.includes('2 tiếng'));
    if (b) b.click();
    return { truoc, sau: { tien: g.cash, min: g.min, mood: Math.round(g.st.mood), doik: Math.round(g.st.hunger), khat: Math.round(g.st.thirst) }, netMin: g.flags.netMin, netDay: g.flags.netDay };
  }, wait: 1400 },
  { shot: OUT + 'net_choi_xong' },
  { label: '⑦ ngồi quá 2 tiếng: gói giờ cảnh báo mỏi mắt, chơi tiếp mất sức' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g.flags.netDay = g.day; g.flags.netMin = 115;
    const n = g0.npcs.list.find((x) => x.fixedId === 'net');
    g0.acts.netMenu(n);
    const opts = [...document.querySelectorAll('#dlg .btn')].map((e) => e.textContent.replace(/\s+/g, ' ').trim());
    const b = [...document.querySelectorAll('#dlg .btn')].find((e) => e.textContent.includes('chơi game'));
    if (b) b.click();
    const opts2 = [...document.querySelectorAll('#dlg .btn')].map((e) => e.textContent.replace(/\s+/g, ' ').trim());
    return { opts, opts2, hp: Math.round(g.st.health) };
  }, wait: 800 },
  { shot: OUT + 'net_moi_mat' },
  { label: '⑧ chạm vào máy 04: hiện gợi ý ngồi vào máy' },
  { eval: async () => {
    const g0 = window.__game, a = g0.world.anchors['may_net'];
    g0.ui.closeDialog();
    await new Promise((r) => setTimeout(r, 300));
    const me = { x: a.x + 1.3, z: a.z };
    g0.player.place(me.x, me.z, Math.atan2(a.x - me.x, a.z - me.z), -0.1);
    window.__cam(me.x, 1.55, me.z, a.x, 0.95, a.z);
    await new Promise((r) => setTimeout(r, 600));
    window.__cam(me.x, 1.55, me.z, a.x, 0.95, a.z);
    g0.interact.update(0.05);
    const f = g0.interact.focus;
    return { nhan: f ? f.label : null };
  }, wait: 1200 },
  { shot: OUT + 'net_may_04' },
  { label: '⑨ 7 giờ tối: thằng Bi ngồi máy bên trái, mũ lưỡi trai, ghế nhựa' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    g0.ui.closeDialog();
    g.min = 19 * 60 + 20;
    await new Promise((r) => setTimeout(r, 1600));
    const lot = g0.world.lots.find((l) => l.id === 'net'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const me = pt(3.4, 4.3), look = pt(1.9, 4.3);
    g0.player.place(me.x, me.z, Math.atan2(look.x - me.x, look.z - me.z), -0.1);
    window.__cam(me.x, 1.42, me.z, look.x, 0.95, look.z);
    const list = g0.npcs.list.filter((n) => n.fixedId === 'net_bi' || n.fixedId === 'net_nhung');
    return { khach: list.map((n) => ({ ten: n.name, pose: n.pose, state: n.state })) };
  }, wait: 2000 },
  { shot: OUT + 'net_khach_ngoi_may' },
  { label: '⑩ con Nhung bên dãy máy phải, đang chat' },
  { eval: () => {
    const g0 = window.__game, lot = g0.world.lots.find((l) => l.id === 'net'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    const me = pt(5.4, 8.5), look = pt(8.0, 8.5);
    g0.player.place(me.x, me.z, Math.atan2(look.x - me.x, look.z - me.z), -0.1);
    window.__cam(me.x, 1.45, me.z, look.x, 0.98, look.z);
    return { n: g0.npcs.list.filter((n) => n.fixedId === 'net_nhung').length };
  }, wait: 1400 },
  { shot: OUT + 'net_nhung_chat' },
];
