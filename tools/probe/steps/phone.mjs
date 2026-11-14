// Lượt 8 — điện thoại đời 2005–2010: ba máy bày ở tiệm Đồ Nghề, pin, sổ thu chi, danh bạ, tin nhắn, radio.
// Chạy: cd tools/probe && node play.mjs steps/phone.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(15 * 60),
  { label: '① tiệm Đồ Nghề bày ba mẫu máy, chạm vào xem giá được' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, lot = g0.world.lots.find((l) => l.id === 'equip'), fr = lot.fr;
    const pt = (lx, lz) => { const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw), L = lot.at + lx; return { x: fr.tx + L * c + lz * s, z: fr.tz - L * s + lz * c }; };
    g.cash = 3000000;
    window.__cam();
    const out = {};
    for (const pair of [['cucgach', 2.2], ['napgap', 2.6], ['camung', 3.0]]) {
      const id = pair[0], x = pair[1];
      const p = pt(x, 4.6), me = pt(x, 3.0);
      g0.player.place(me.x, me.z, 0, -0.2);
      window.__cam(me.x, 1.55, me.z, p.x, 1.0, p.z);
      await new Promise((r) => setTimeout(r, 800));
      window.__cam(me.x, 1.55, me.z, p.x, 1.0, p.z);
      g0.interact.update(0.05);
      out[id] = g0.interact.focus ? g0.interact.focus.label : null;
    }
    const cam = pt(2.6, 2.9), look = pt(2.6, 4.6);
    g0.player.place(cam.x, cam.z, Math.atan2(look.x - cam.x, look.z - cam.z), -0.22);
    window.__cam(cam.x, 1.62, cam.z, look.x, 0.95, look.z);
    return out;
  }, wait: 2200 },
  { shot: OUT + 'dien_thoai_trong_tiem' },
  { label: '② mua máy cục gạch: cắm sim, pin đầy' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    window.__cam();
    g.cash = 3000000;
    g0.acts.buyGear('cucgach');
    const hop = document.querySelector('#dlg .btn');
    if (hop) hop.click();
    return { may: g.phone, coMay: !!g.phone, tien: g.cash, gear: Object.keys(g.gear) };
  }, wait: 900 },
  { label: '③ mở điện thoại: màn hình chính, đủ chức năng của máy' },
  { eval: () => {
    const g0 = window.__game;
    g0.ui.panel('phone');
    const d = document.querySelector('#modal');
    return { mo: !d.classList.contains('hide'), tab: [...d.querySelectorAll('.tab')].map((b) => b.textContent.trim()), tieuDe: d.querySelector('h2') && d.querySelector('h2').textContent.trim() };
  }, wait: 700 },
  { shot: OUT + 'dt_man_hinh' },
  { label: '④ sổ thu chi trong máy' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.led.revenue = 240000; g.led.cogs = 96000; g.led.rent = 80000; g.led.side = 35000; (document.querySelector('#modal [data-tab=led]')).click(); const d = document.querySelector('#modal'); return { tab: (d.querySelector('.tab.on')).textContent, coBang: !!d.querySelector('.kv') }; }, wait: 800 },
  { shot: OUT + 'dt_so_thu_chi' },
  { label: '⑤ tin nhắn: nhắc nợ, nhắc tiền phòng, tin lừa, dự báo thời tiết' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g.debts.push({ id: 9, lender: 'bank', principal: 500000, owed: 530000, due: g.day + 2, late: 0, taken: g.day, ext: 0 });
    g.housing = 'tro'; g.paidUntil = g.day - 1;
    (document.querySelector('#modal [data-tab=sms]')).click();
    const d = document.querySelector('#modal');
    const list = [...d.querySelectorAll('.item b')].map((b) => b.textContent.trim());
    return { nguoiGui: list, soTin: d.querySelectorAll('.item').length };
  }, wait: 800 },
  { shot: OUT + 'dt_tin_nhan' },
  { label: '⑥ danh bạ: người quen + khách quen, gọi được' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g.met['kiosk'] = 0; g.met['eatery'] = 0; g.rel['chu_ba'] = { v: 22, n: 4, last: 0 }; g.cash = 200000;
    (document.querySelector('#modal [data-tab=book]')).click();
    const d = document.querySelector('#modal');
    const rows = [...d.querySelectorAll('.item')].map((e) => e.textContent.trim().slice(0, 40));
    const b = d.querySelector('.btn[data-a=call]');
    const truoc = g.cash; b.click();
    return { rows, goi: { truoc, sau: g.cash, than: g.rel.chu_ba.v } };
  }, wait: 900 },
  { shot: OUT + 'dt_danh_ba' },
  { label: '⑦ mua máy nắp gập: nghe radio, pin tụt, tinh thần lên' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    g.cash = 3000000;
    g0.acts.buyGear('napgap');
    const hop = document.querySelector('#dlg .btn');
    if (hop) hop.click();
    g0.ui.panel('phone');
    (document.querySelector('#modal [data-tab=fun]')).click();
    const pin0 = g.phone.battery, mood0 = g.st.mood;
    (document.querySelector('#modal [data-a=fun][data-i="0"]')).click();
    await new Promise((r) => setTimeout(r, 400));
    const d = document.querySelector('#modal');
    return { may: g.phone.id, tab: (d.querySelector('.tab.on')).textContent, pin: [pin0, +g.phone.battery.toFixed(1)], mood: [Math.round(mood0), Math.round(g.st.mood)], toast: [...document.querySelectorAll('#toasts .toast')].map((t) => t.textContent.trim().slice(0, 60)) };
  }, wait: 900 },
  { shot: OUT + 'dt_giai_tri' },
  { label: '⑧ HUD có nút điện thoại và chấm tin chưa đọc' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    g0.ui.closePanel();
    g.min += 200; g.day += 1;
    g0.ui.update(0.5);
    await new Promise((r) => setTimeout(r, 500));
    const b = document.getElementById('phoneb'), dot = document.getElementById('phonedot');
    const r = b.getBoundingClientRect();
    return { hien: getComputedStyle(b).display !== 'none', o: [Math.round(r.width), Math.round(r.height)], cham: !dot.classList.contains('hide'), seen: g.flags.smsSeen, now: g.day * 1440 + g.min, lop: dot.className };
  }, wait: 700 },
  { shot: OUT + 'dt_hud' },
  { label: '⑨ sạc nhờ ở tạp hoá: trả 5.000₫, pin đầy' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g.phone.battery = 12; const truoc = g.cash;
    g0.acts.phoneCharge('kiosk');
    return { pin: Math.round(g.phone.battery), mat: truoc - g.cash };
  } },
  { label: '⑩ hết pin: mở máy không được, bảng báo rõ' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g.phone.battery = 0;
    g0.ui.panel('phone');
    const d = document.querySelector('#modal');
    (d.querySelector('[data-tab=sms]')).click();
    const dd = document.querySelector('#modal');
    return { tieuDe: dd.querySelector('h2').textContent.trim(), baoHetPin: dd.textContent.includes('hết pin'), camKet: dd.querySelectorAll('.item .btn').length };
  }, wait: 700 },
  { shot: OUT + 'dt_het_pin' },
  { label: '⑪ chưa có máy: bảng nói rõ bán ở đâu' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g0.ui.closePanel();
    g.phone = null;
    for (const k of ['cucgach', 'napgap', 'camung']) delete g.gear[k];
    g0.ui.panel('phone');
    const d = document.querySelector('#modal');
    return { tieuDe: d.querySelector('h2').textContent.trim(), loiKhuyen: d.textContent.includes('Đồ Nghề') };
  }, wait: 600 },
  { shot: OUT + 'dt_chua_co_may' },
];
