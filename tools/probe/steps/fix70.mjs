// LƯỢT 70 — bốn việc người chơi báo, đo bằng chuột/bàn phím thật:
//  1. nút Góp ý / báo lỗi cạnh các nút HUD + chỗ lưu góp ý (gõ, gửi, đọc lại, xuất khối chữ, xoá)
//  2. xe nước mía dời ra sát cổng trái chợ, đứng dưới đất, biển không lơ lửng
//  3. quán nước mía: quầy lùi sâu, đứng ngoài đường vẫn thấy máy ép
//  4. công trường: mái bạt còn khi đứng DƯỚI nhìn lên + chòi tuyển thợ dời ra khoảng trống
//  5. mini-game ép mía (6 ly) và mini-game xúc đất (5 xe, ~1–2 phút) chạy thật
// Chạy: cd tools/probe && node play.mjs steps/fix70.mjs
import { boot, fresh } from '../lib.mjs';
import { mkdirSync } from 'node:fs';
const OUT = 'fix70/';
try { mkdirSync(new URL('../out/' + OUT, import.meta.url), { recursive: true }); } catch { /* đã có */ }

// Bấm một nút trong bảng bằng chuột thật (data-a, tuỳ chọn data-i).
const tapA = (a, i) => ({ clickEval: (a, i) => {
  const el = document.querySelector(`#modal [data-a="${a}"]${i ? `[data-i="${i}"]` : ''}`);
  if (!el) return [];
  const r = el.getBoundingClientRect();
  return [[Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]];
}, args: [a, i] });
// Chọn một dòng trong hộp thoại NPC.
const tapOpt = (t) => ({ eval: (t) => {
  const b = [...document.querySelectorAll('#dlg .opts .btn')].find((x) => x.textContent.toLowerCase().includes(String(t).toLowerCase()));
  if (!b) return { bấm: false, có: [...document.querySelectorAll('#dlg .opts .btn')].map((x) => x.textContent) };
  b.click();
  return { bấm: true, chữ: b.textContent.slice(0, 50) };
}, args: [t], wait: 900 });

export default [boot, fresh(9 * 60),
  { label: '① hàng nút HUD có thêm nút Góp ý / báo lỗi, nằm ngay cạnh Túi đồ' },
  { eval: () => {
    const bs = [...document.querySelectorAll('#menub .ib')];
    const i = bs.findIndex((b) => b.dataset.p === 'feedback');
    return { nút: bs.map((b) => b.dataset.p), vịTrí: i, kềSau: bs[i + 1]?.dataset.p ?? null,
      cóIcon: !!bs[i]?.querySelector('svg') };
  } },
  { label: '② bấm nút đó: bảng Góp ý mở, chọn loại, gõ, bấm Gửi — góp ý nằm trong kho' },
  { eval: () => { document.querySelector('#menub [data-p="feedback"]').click(); return window.__game.ui.modalName; }, wait: 700 },
  { eval: () => { const ta = document.getElementById('fbdraft');
    return { cóÔ: !!ta, loại: [...document.querySelectorAll('#modal [data-a="fbKind"]')].map((b) => b.textContent + (b.classList.contains('green') ? '*' : '')),
      tiêuĐề: document.querySelector('#modal h3')?.textContent }; } },
  { eval: () => { document.getElementById('fbdraft').value = 'Xe nước mía dời ra cổng trái rồi mà vẫn hơi chật, với lại bảng giá nên để thấp hơn cho dễ đọc.'; return 1; }, quiet: true },
  tapA('fbSend'),
  { eval: () => {
    const list = JSON.parse(localStorage.getItem('ganhhang.feedback.v1') || '[]');
    return { đãLưu: list.length, mã: list[0]?.id, loại: list[0]?.kind, chữ: list[0]?.text.slice(0, 40), bốiCảnh: list[0]?.ctx,
      bảngHiệnSố: document.querySelector('#modal')?.textContent.includes('1/40') };
  }, wait: 500 },
  { shot: OUT + '01_gop_y_da_luu' },
  { label: '③ góp ý thứ hai (loại Góp ý) rồi xuất khối chữ để dán gửi' },
  tapA('fbKind', 1),
  { eval: () => { document.getElementById('fbdraft').value = 'Mong có thêm chỗ ngồi chờ ở công trường, ngồi bệt xuống đất bụi lắm.'; return 1; }, quiet: true },
  tapA('fbSend'),
  tapA('fbShow'),
  { eval: () => { const ta = document.getElementById('fbexport');
    return { kho: JSON.parse(localStorage.getItem('ganhhang.feedback.v1') || '[]').length,
      khốiChữHiện: !!ta && !ta.classList.contains('hide'), dòngĐầu: ta?.value.split('\n').slice(0, 4) }; }, wait: 400 },
  { shot: OUT + '02_khoi_chu_gui_di' },
  { label: '④ phím G mở bảng góp ý từ màn chơi; Esc đóng lại' },
  { eval: () => { window.__game.ui.closePanel(); return window.__game.ui.modalName; }, wait: 400 },
  { eval: () => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', key: 'g' })); return window.__game.ui.modalName; }, wait: 500 },
  { eval: () => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' })); return { sau: window.__game.ui.modalName, mode: window.__game.mode }; }, wait: 500 },
  { label: '⑤ xe nước mía: sát cổng trái chợ, đứng dưới đất, không chắn lối vào' },
  { eval: () => {
    const g0 = window.__game, A = g0.world.anchors, n = g0.npcs.fixed.get('mia_xe');
    const v = A.v_mia_xe;
    return { neoXe: { x: +v.x.toFixed(2), z: +v.z.toFixed(2) }, ngườiBán: n ? { x: +n.x.toFixed(2), z: +n.z.toFixed(2), y: +n.y.toFixed(2) } : null,
      cáchCổngTráiChợ: +Math.hypot(v.x + 60, 22.7 - v.z).toFixed(1), biểnTrênXe: !!g0.world.anchors.mia_xe };
  } },
  { eval: () => { document.getElementById('quest')?.classList.add('hide'); const g0 = window.__game, v = g0.world.anchors.v_mia_xe;
    g0.player.place(v.x + 2.2, v.z + 3.0, 0, 0); window.__cam(v.x + 4.0, 2.8, v.z + 6.4, v.x, 1.2, v.z); return 1; }, quiet: true, wait: 2800 },
  { shot: OUT + '03_xe_mia_cong_trai' },
  { label: '⑥ đứng sát nhìn ngang: bánh xe phải chạm đất (hết lơ lửng)' },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_mia_xe;
    window.__cam(v.x + 2.6, 0.9, v.z + 2.4, v.x, 0.55, v.z); return 1; }, quiet: true, wait: 2400 },
  { shot: OUT + '04_xe_mia_chan_dat' },
  { label: '⑦ quán nước mía: quầy lùi sâu, đứng ngoài đường vẫn thấy máy ép + bàn khách' },
  { eval: () => { const g0 = window.__game, a = g0.world.anchors.v_mia_quan, c = g0.world.anchors.mia_quan;
    return { khách: { x: +a.x.toFixed(2), z: +a.z.toFixed(2) }, chủ: { x: +c.x.toFixed(2), z: +c.z.toFixed(2) },
      cáchNhau: +Math.hypot(a.x - c.x, a.z - c.z).toFixed(2) }; } },
  { eval: () => { const g0 = window.__game, a = g0.world.anchors.v_mia_quan;
    g0.player.place(a.x, a.z + 3.4, Math.PI, 0); window.__cam(a.x, 1.6, a.z + 6.4, a.x, 1.1, a.z - 1.4); return 1; }, quiet: true, wait: 2800 },
  { shot: OUT + '05_quan_mia_lui_sau' },
  { eval: () => { const g0 = window.__game, a = g0.world.anchors.v_mia_quan;
    window.__cam(a.x + 3.2, 2.6, a.z + 1.0, a.x, 1.0, a.z - 2.2); return 1; }, quiet: true, wait: 2400 },
  { shot: OUT + '06_quan_mia_nhin_ngang' },
  { label: '⑧ công trường: chòi tuyển thợ ở khoảng trống, mái bạt còn khi đứng dưới nhìn lên' },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_site;
    g0.player.place(v.x, v.z + 1.2, Math.PI, 0); window.__cam(v.x, 1.7, v.z + 3.0, v.x, 1.6, v.z - 0.6); return { chòi: { x: +v.x.toFixed(2), z: +v.z.toFixed(2) } }; }, quiet: true, wait: 2800 },
  { shot: OUT + '07_chòi_tuyển_thợ' },
  { label: '⑨ nhìn TỪ DƯỚI LÊN mái: phải thấy mặt dưới của bạt (lỗi ảnh 4 là mất hẳn)' },
  { eval: () => { const g0 = window.__game, v = g0.world.anchors.v_site;
    window.__cam(v.x + 0.2, 0.6, v.z + 1.6, v.x, 2.5, v.z); return 1; }, quiet: true, wait: 2400 },
  { shot: OUT + '08_mai_nhin_tu_duoi' },
  { label: '⑩ mini-game ép mía: bấm lệch bị tràn, canh vùng xanh mới ra ly' },
  { eval: () => { const g0 = window.__game, n = g0.npcs.fixed.get('mia_xe'), g = g0.g;
    g.min = 9 * 60; g.cash = 50000; g.st.energy = 90; g0.acts.talk(n); return [...document.querySelectorAll('#dlg .opts .btn')].length; }, wait: 700 },
  tapOpt('phụ bán'),
  { eval: () => { const a = window.__game.anim;
    return { đangChạy: a.active, loại: a.kind, ly: a.miaCup, chuẩn: a.miaGood,
      nút: [...document.querySelectorAll('#cook .btns button')].map((b) => b.textContent),
      gợiÝ: document.querySelector('#cook p')?.textContent.slice(0, 100) }; } },
  { shot: OUT + '09_minigame_ep_mia' },
  { eval: () => {
    // Một lượt bấm lệch (kim đang ngoài vùng xanh) rồi sáu lượt bấm đúng nhịp.
    // `miaReflex()` đọc `a.t` (đồng hồ của anim) nên canh bằng cách đặt `a.t` cho kim nằm giữa vùng xanh.
    const a = window.__game.anim, log = [];
    const sp = () => 1.15 + a.miaCup * 0.12;
    a.t = Math.PI / 2 / sp();                      // sin = 1 ⇒ kim ở mút phải, ngoài vùng xanh
    a.miaPress(); log.push({ lệch: true, ly: a.miaCup, chuẩn: a.miaGood });
    for (let i = 0; i < 6 && a.active; i++) {
      a.t = 0;                                     // sin = 0 ⇒ kim ở giữa, đúng vùng xanh
      a.miaPress(); log.push({ lệch: false, ly: a.miaCup, chuẩn: a.miaGood });
    }
    return { log, xong: !a.active, tiền: window.__game.g.cash, lyChuẩn: window.__game.g.wd.miaCups };
  }, wait: 900 },
  { shot: OUT + '10_ep_mia_xong_ca' },
  { label: '⑪ mini-game xúc đất: giữ cho kim dâng, nhả trong vùng vàng mới được xe đầy' },
  { eval: () => { const g0 = window.__game, g = g0.g, n = g0.npcs.fixed.get('site');
    g.min = 9 * 60; g.st.energy = 90; g.rep = 50; g0.acts.talk(n); return [...document.querySelectorAll('#dlg .opts .btn')].map((x) => x.textContent); }, wait: 700 },
  tapOpt('Xin một ca phụ hồ'),
  { eval: () => { const a = window.__game.anim;
    return { đangChạy: a.active, loại: a.kind, xe: a.siteCarts, xẻng: a.siteShovel,
      nút: [...document.querySelectorAll('#cook .btns button')].map((b) => b.textContent),
      gợiÝ: document.querySelector('#cook p')?.textContent.slice(0, 140) }; } },
  { shot: OUT + '11_minigame_xuc_dat' },
  { eval: () => {
    // Chơi thật: một xẻng non (kim thấp), rồi xúc cho hết ba xe — giữa các xe là nhịp ĐẨY XE.
    // Nút trên HUD bắt `pointerdown` chứ không phải `click`, nên gọi thẳng hai hàm mà nút gọi tới.
    const a = window.__game.anim, g0 = window.__game, log = [];
    a.siteGrip(); a.siteFill = 0.2; a.siteDrop();
    log.push({ non: true, xe: a.siteCarts, xẻng: a.siteShovel, nửa: a.siteHalf });
    for (let guard = 0; guard < 40 && a.active; guard++) {
      const t0 = performance.now();
      a.siteGrip(); a.siteFill = 0.74; a.siteDrop();     // canh đúng vùng vàng
      if (a.sitePushing) {
        log.push({ đẩyXe: true, xe: a.siteCarts, chuẩn: a.siteCartsGood, ms: Math.round(performance.now() - t0) });
        a.sitePush = 0.999; a.update(0.3);               // nhảy tới cuối nhịp đẩy cho probe khỏi chờ
      }
    }
    return { log, xong: !a.active, tiền: g0.g.cash, xeĐầyVừa: a.siteCartsGood, xeĐầy: g0.g.wd.siteCups };
  }, wait: 700 },
  { shot: OUT + '12_xuc_dat_xong_ca' },
  { label: '⑫ ca phụ hồ dài bao lâu (phải 1–2 phút thật, không phải vài giây)' },
  { eval: () => ({ xeMỗiCa: 3, xẻngMỗiXe: 5, giâyMỗiXẻng: 4, giâyĐẩyXe: 3.4, tổngGiây: 3 * 5 * 4 + 3 * 3.4 }) },
  { label: '⑬ không lỗi console' },
];
