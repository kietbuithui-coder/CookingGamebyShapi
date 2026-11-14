// Lượt 12 — HUD dễ hiểu hơn: gợi ý biểu tượng, chữ số tiền to hơn, cỡ giao diện, sổ tay gọn,
// thu gọn ô mục tiêu; sửa vụ sửa xe không có xe vẫn trừ tiền; chỗ giao hàng có người nhận hàng; cô hát rong dời chỗ.
// Chạy: cd tools/probe && OUT=/tmp/probe/ui node play.mjs steps/ui.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
const tap = (sel) => `[...document.querySelectorAll('${sel}')].find((b) => b.offsetParent !== null)`;
export default [boot, fresh(10 * 60 + 20),
  { label: '① sửa xe: chưa có xe đẩy thì mục bơm bánh phải khoá, không trừ tiền' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, n = g0.npcs.fixed.get('sua_xe');
    if (!n) return { loi: 'không thấy chú sửa xe' };
    g.cash = 50000; g.stall.tier = 1; g.stall.where = 'carried';   // mới có gánh tre, chưa có xe đẩy
    g.stall.cond = 60;
    g0.acts.talk(n);
    const opts = [...document.querySelectorAll('#dlg .btn')].map((b) => ({ t: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 46), off: b.classList.contains('off') }));
    const bom = [...document.querySelectorAll('#dlg .btn')].find((b) => b.textContent.includes('Bơm bánh'));
    const truoc = g.cash;
    if (bom && !bom.classList.contains('off')) bom.click();
    return { tuyChon: opts, cashTruoc: truoc, cashSau: g.cash, coXeDay: g.stall.tier >= 2 };
  }, wait: 700 },
  { shot: OUT + 'sua_xe' },
  { label: '①b chưa có gánh, chưa có xe: cả hai mục sửa đều khoá, ví không hao' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, n = g0.npcs.fixed.get('sua_xe');
    g0.ui.closeDialog(); g.cash = 50000; g.stall.tier = 0; g.stall.where = 'none'; g.stall.cond = 0;
    g0.acts.talk(n);
    const opts = [...document.querySelectorAll('#dlg .btn')].map((b) => ({ t: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), off: b.classList.contains('off') }));
    const sua = opts.filter((o) => /sửa|vá|chằng|bơm/i.test(o.t));
    const truoc = g.cash; document.querySelectorAll('#dlg .btn').forEach((b) => { if (!b.classList.contains('off') && /sửa|vá|chằng|bơm/i.test(b.textContent)) b.click(); });
    return { mucSua: sua, cashTruoc: truoc, cashSau: g.cash };
  }, wait: 500 },
  { label: '② có xe đẩy thì bơm bánh được, trừ đúng 2.000₫' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, n = g0.npcs.fixed.get('sua_xe');
    g0.ui.closeDialog(); g.cash = 50000; g.stall.tier = 2; g.stall.where = 'placed'; g.stall.cond = 60;
    g0.acts.talk(n);
    const bom = [...document.querySelectorAll('#dlg .btn')].find((b) => b.textContent.includes('Bơm bánh'));
    const ok = bom && !bom.classList.contains('off');
    const truoc = g.cash; if (ok) { bom.click(); }
    return { bamDuoc: ok, cashTruoc: truoc, cashSau: g.cash, huong: bom ? bom.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : null };
  }, wait: 500 },

  { label: '③ gợi ý biểu tượng HUD: rê chuột vào thanh "Vui vẻ"' },
  { eval: async () => {
    const g0 = window.__game; g0.ui.closeDialog(); g0.g.min = 11 * 60;
    const stat = document.querySelector('.stat[data-k=mood]');
    if (!stat) return { loi: 'thiếu thanh vui vẻ' };
    const r = stat.getBoundingClientRect();
    for (const t of ['pointerover', 'pointerenter']) stat.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: r.left + 6, clientY: r.top + 4 }));
    await new Promise((x) => setTimeout(x, 200));
    const tip = document.querySelector('#ui .tip');
    return { hien: !!tip && !tip.classList.contains('hide'), chu: tip ? tip.textContent : null };
  }, wait: 500 },
  { shot: OUT + 'goi_y_hud' },
  { label: '④ gợi ý cho nút trên góc phải (Sổ tay)' },
  { eval: async () => {
    const b = document.querySelector('#menub [data-p=book]');
    const r = b.getBoundingClientRect();
    b.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, clientX: r.left + 8, clientY: r.top + 8 }));
    await new Promise((x) => setTimeout(x, 200));
    const tip = document.querySelector('#ui .tip');
    return { chu: tip.textContent };
  }, wait: 500 },
  { shot: OUT + 'goi_y_nut' },

  { eval: () => { const t = document.querySelector('#ui .tip'); if (t) t.classList.add('hide'); return 'tip off'; }, wait: 120 },
  { label: '⑤ chữ tiền nhận được to hơn (số bay cạnh nhân vật)' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    g0.ui.closeDialog();
    g0.ui.float('+40.000₫', { x: g0.player.x, y: 1.6, z: g0.player.z - 1.4 }, 'good');
    g0.ui.float('−2.000₫', { x: g0.player.x + 0.9, y: 1.6, z: g0.player.z - 1.4 }, 'bad');
    await new Promise((x) => setTimeout(x, 120));
    const f = document.querySelector('.flt');
    const fs = f ? getComputedStyle(f).fontSize : null;
    return { coChu: fs, soLuong: document.querySelectorAll('.flt').length };
  }, wait: 400 },
  { shot: OUT + 'so_tien_to' },

  { eval: () => { const t = document.querySelector('#ui .tip'); if (t) t.classList.add('hide'); return 'tip off'; }, wait: 120 },
  { label: '⑥ cỡ giao diện 80% và 130%' },
  { eval: async () => { window.__game.g.set ??= null; const g0 = window.__game; g0.set.ui.scale = 0.8; g0.ui.layout(); await new Promise((r) => setTimeout(r, 250)); return { scale: g0.set.ui.scale, co: getComputedStyle(document.getElementById('ui')).fontSize }; }, wait: 500 },
  { shot: OUT + 'co_ui_80' },
  { eval: async () => { const g0 = window.__game; g0.set.ui.scale = 1.3; g0.ui.layout(); await new Promise((r) => setTimeout(r, 250)); return { scale: g0.set.ui.scale, co: getComputedStyle(document.getElementById('ui')).fontSize }; }, wait: 500 },
  { shot: OUT + 'co_ui_130' },
  { eval: async () => { const g0 = window.__game; g0.set.ui.scale = 1; g0.ui.layout(); await new Promise((r) => setTimeout(r, 200)); return 'ok'; } },

  { label: '⑥b cài đặt: thanh cỡ giao diện có ô xem trước, kéo là thấy đổi ngay' },
  { eval: async () => {
    const g0 = window.__game;
    g0.ui.panel('settings');
    await new Promise((r) => setTimeout(r, 300));
    const inp = document.querySelector('#modal input[data-r=uiscale]');
    if (!inp) return { loi: 'thiếu thanh cỡ giao diện' };
    inp.value = '150'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 250));
    const box = document.querySelector('#modal .card, #modal .sheet, #modal > div');
    const sc = [...document.querySelectorAll('#modal *')].find((e) => e.scrollHeight > e.clientHeight + 20);
    const lab0 = document.querySelector('#uiscale-v');
    if (sc && lab0) sc.scrollTop = Math.max(0, lab0.offsetTop - 150);
    await new Promise((r) => setTimeout(r, 200));
    void box;
    const lab = document.querySelector('#uiscale-v');
    return { min: inp.min, max: inp.max, giaTri: inp.value, nhan: lab ? lab.textContent : null, co: getComputedStyle(document.getElementById('ui')).fontSize, coOTruoc: !!document.querySelector('#uiprev') };
  }, wait: 600 },
  { shot: OUT + 'co_ui_cai_dat' },
  { eval: async () => {
    const g0 = window.__game; const inp = document.querySelector('#modal input[data-r=uiscale]');
    inp.value = '100'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    g0.ui.closePanel(); await new Promise((r) => setTimeout(r, 250)); return 'ok';
  }, wait: 400 },

  { label: '⑦ sổ tay công thức gọn: mỗi món một dòng, chạm để mở chi tiết' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    g0.ui.closeDialog(); g.quest = 3;
    g0.ui.panel('book');
    await new Promise((r) => setTimeout(r, 350));
    const rows = document.querySelectorAll('#modal .item.rec');
    const h = rows.length ? rows[0].getBoundingClientRect().height : 0;
    return { soMon: rows.length, caoDong: Math.round(h), coChiTiet: !!document.querySelector('#modal .item.rec .more') };
  }, wait: 400 },
  { shot: OUT + 'so_tay_gon' },
  { eval: async () => {
    const d = document.querySelector('#modal details.item.rec'); if (d) d.open = true;
    await new Promise((r) => setTimeout(r, 250));
    return { moChiTiet: !!d && d.open };
  }, wait: 300 },
  { shot: OUT + 'so_tay_chi_tiet' },
  { eval: async () => { window.__game.ui.closePanel(); return 'ok'; }, wait: 300 },

  { label: '⑧ ô mục tiêu có nút thu gọn' },
  { eval: async () => {
    const g0 = window.__game, q = document.getElementById('quest');
    const btn = document.getElementById('qmin');
    const truoc = q.classList.contains('min');
    btn.click();
    await new Promise((r) => setTimeout(r, 250));
    return { coNut: !!btn, chuNut: btn.textContent, truoc, sau: q.classList.contains('min') };
  }, wait: 500 },
  { shot: OUT + 'muc_tieu_gon' },

  { label: '⑨ nhận đơn giao hàng: người nhận đứng chờ với kiện hàng' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g;
    document.getElementById('qmin').click();
    g.wd.deliveries = 0; g.job = null;
    g0.acts.board ? g0.acts.board() : g0.ui.closeDialog();
    await new Promise((r) => setTimeout(r, 200));
    const btns = [...document.querySelectorAll('#dlg .btn')];
    const b = btns.find((x) => x.textContent.includes('Giao hàng tới'));
    if (!b) return { loi: 'không có đơn giao hàng', opts: btns.map((x) => x.textContent.slice(0, 40)) };
    b.click();
    await new Promise((r) => setTimeout(r, 400));
    const j = g0.acts.job, rec = g0.npcs.list.find((n) => n.data && n.data.parcels);
    const a = g0.world.anchors['dua_xe'];
    void a;
    return { don: j ? j.name : null, coNguoiNhan: !!rec, ten: rec ? rec.name : null, cachCua: rec ? Math.round(Math.hypot(rec.x - j.x, rec.z - j.z) * 10) / 10 : null, cachWay: j ? Math.round(Math.hypot(j.x - g0.acts.way.x, j.z - g0.acts.way.z)) : null };
  }, wait: 700 },
  { eval: async () => {
    const g0 = window.__game, j = g0.acts.job, rec = g0.npcs.list.find((n) => n.data && n.data.parcels);
    if (!j) return { loi: 'chưa có đơn' };
    const me = { x: j.x + 5.0, z: j.z + 5.5 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(j.x - me.x, j.z - me.z), -0.05);
    await new Promise((r) => setTimeout(r, 400));
    window.__cam(me.x, 1.62, me.z, rec ? rec.x : j.x, 1.05, rec ? rec.z : j.z);
    return { coNguoiNhan: !!rec };
  }, wait: 1400 },
  { shot: OUT + 'giao_hang_diem_hen' },
  { label: '⑩ giao tới nơi: nhận tiền, người nhận cảm ơn rồi đi' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, j = g0.acts.job;
    const truoc = g.cash;
    g0.player.place(j.x, j.z - 0.6, 0, 0);
    for (let i = 0; i < 8; i++) g0.acts.update(0.2);
    await new Promise((r) => setTimeout(r, 300));
    return { cashTruoc: truoc, cashSau: g.cash, conDon: !!g0.acts.job, conNguoiNhan: g0.npcs.list.some((n) => n.data && n.data.parcels) };
  }, wait: 500 },
  { shot: OUT + 'giao_hang_xong' },

  { label: '⑪ cô hát rong: đang đứng chỗ nào' },
  { eval: async () => {
    const g0 = window.__game, a = g0.world.anchors['v_hat_rong'];
    if (!a) return { loi: 'thiếu neo v_hat_rong' };
    const me = { x: a.x + 4.2, z: a.z + 4.6 };
    g0.player.place(me.x, me.z, Math.atan2(a.x - me.x, a.z - me.z), -0.06);
    await new Promise((r) => setTimeout(r, 400));
    window.__cam(me.x, 1.62, me.z, a.x, 1.05, a.z);
    const n = g0.npcs.fixed.get('hat_rong');
    return { neo: { x: +a.x.toFixed(2), z: +a.z.toFixed(2) }, coCo: !!n, x: n ? +n.x.toFixed(2) : null };
  }, wait: 1300 },
  { shot: OUT + 'hat_rong_truoc' },
];
