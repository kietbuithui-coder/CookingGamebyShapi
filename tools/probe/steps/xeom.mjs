// XE ÔM CHÚ BA (lượt 66): ổng đứng dưới gầm cầu cạnh lều người chơi, có xe máy dựng bên cạnh;
// nói chuyện thì mở bảng giá + danh sách đích; gọi điện thì ổng chạy tới rước đúng hẹn.
// Chạy: cd tools/probe && node play.mjs steps/xeom.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = 'xeom/';

/** Bấm nút đầu tiên trong hộp thoại có chữ cho trước (trả toạ độ để click). */
const pickOpt = (text) => ({ clickEval: (t) => {
  const bs = [...document.querySelectorAll('#dlg .opts .btn')];
  const b = bs.find((x) => x.textContent.toLowerCase().includes(String(t).toLowerCase()));
  if (!b) return [];
  const r = b.getBoundingClientRect();
  return [[r.x + r.width / 2, r.y + r.height / 2]];
}, args: [text] });

export default [boot, fresh(9 * 60),
  { label: '① Chú Ba có mặt dưới gầm cầu, đúng chỗ neo, có xe máy cạnh bên' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors, v = A.v_chu_ba;
    const n = g0.npcs.fixed.get('chu_ba');
    return {
      neo: v ? { x: +v.x.toFixed(2), z: +v.z.toFixed(2) } : null,
      nguoi: n ? { x: +n.x.toFixed(2), z: +n.z.toFixed(2), state: n.state, ten: n.name, hien: n.rig.root.visible } : null,
      cachLeu: +Math.hypot(49 - v.x, 101.5 - v.z).toFixed(2),
    };
  } },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_chu_ba; g0.player.place(v.x - 2.2, v.z + 1.6, 0.9, 0); window.__cam(v.x - 4.2, 2.4, v.z + 4.6, v.x, 1.0, v.z); return 1; }, quiet: true, wait: 3000 },
  { shot: OUT + '01_gam_cau' },
  { label: '①b nhìn từ phía lều người chơi: thấy biển XE ÔM CHÚ BA' },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_chu_ba; window.__cam(v.x + 2.6, 2.2, v.z + 5.2, v.x - 0.9, 1.2, v.z); return 1; }, quiet: true, wait: 2500 },
  { shot: OUT + '01b_bien' },
  { eval: () => { document.getElementById('qmin').click(); return document.querySelector('#quest').offsetHeight; }, quiet: true, wait: 400 },
  { label: '② đứng cạnh ổng: hiện nút nói chuyện' },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_chu_ba; g0.player.place(v.x - 0.4, v.z + 1.1, Math.PI, 0); g0.interact.update(0.05); const f = g0.interact.focus; return { focus: f && f.label, sub: f && f.sub }; }, wait: 1400 },
  { label: '③ nói chuyện → bảng giá theo quãng + danh sách chỗ đi' },
  { eval: () => { const g0 = window.__game, n = g0.npcs.fixed.get('chu_ba'); g0.acts.talk(n); const d = document.querySelector('#dlg'); return { mo: !d.classList.contains('hide'), chu: d.querySelector('p').textContent.slice(0, 220), soNut: d.querySelectorAll('.opts .btn').length, nutDau: [...d.querySelectorAll('.opts .btn')].slice(0, 3).map((b) => b.textContent) }; }, wait: 900 },
  { shot: OUT + '02_hoi_di_dau' },
  { label: '④ chọn một đích: trừ tiền đúng giá, tới đúng chỗ, tốn thời gian xe chạy' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, p = g0.player;
    const before = { cash: g.cash, min: g.min, x: +p.x.toFixed(1), z: +p.z.toFixed(1) };
    const btn = [...document.querySelectorAll('#dlg .opts .btn')][0];
    const label = btn.textContent;
    btn.click();
    return { before, nhanNut: label.slice(0, 80), after: { cash: g.cash, min: g.min, x: +p.x.toFixed(1), z: +p.z.toFixed(1) } };
  }, wait: 1200 },
  { shot: OUT + '03_sau_chuyen_di' },
  { label: '⑤ gọi điện: có số trong danh bạ sau khi biết mặt, gọi thì hẹn 3 phút' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, A = g0.world.anchors, v = A.v_chu_ba;
    g0.ui.closeDialog();
    g.met.chu_ba = g.day; g.cash = 60000; g0.player.place(v.x - 1.5, v.z + 1.8, 0, 0);
    if (!g.phone) g.phone = { id: 'cucgach', battery: 100 };
    const ok = g0.acts.phoneXeom();
    return { goiDuoc: ok, hen: g.flags.xeomAt, bayGio: g.day * 1440 + g.min, conLai: g.flags.xeomN };
  }, wait: 600 },
  { label: '⑥ tới giờ hẹn: ổng chạy tới chỗ người chơi và mở bảng chọn chỗ đi' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.min += 4; g0.acts.update(0.05); const n = g0.npcs.fixed.get('chu_ba'), p = g0.player; return { cach: +Math.hypot(n.x - p.x, n.z - p.z).toFixed(2), moBang: g0.ui.isDialogOpen(), dong: (document.querySelector('#dlg p') || {}).textContent }; }, wait: 1200 },
  { shot: OUT + '04_duoc_rước' },
  { label: '⑦ danh bạ: dòng “Chú Ba xe ôm” đứng sau hai tổng đài, bấm là gọi' },
  { eval: () => {
    const g0 = window.__game, g = g0.g;
    g0.ui.closeDialog(); window.__PUI.endPhoneAct();
    g.phone = { id: 'camung', battery: 100 }; g.gear.camung = 100;
    window.__PUI.phoneView().app = 'contacts';
    g0.ui.panel('phone');
    window.__PUI.phoneView().app = 'contacts';
    g0.ui.reopenPanel('phone');
    return 1;
  }, quiet: true, wait: 1200 },
  { eval: () => {
    const P = window.__PUI, g = window.__game.g;
    const list = P && document.querySelector('#modal').innerText;
    return {
      dongDanhBa: (list || '').split('\n').filter((t) => /Chú Ba|1080|1900/.test(t)).slice(0, 3),
      coSoChuBa: list.includes('Chú Ba xe ôm'),
      henConLai: g.flags.xeomAt,
    };
  } },
  { shot: OUT + '05_danh_ba' },
];
