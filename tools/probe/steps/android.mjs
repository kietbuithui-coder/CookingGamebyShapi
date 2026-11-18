// LƯỢT 25 — soát giao diện trên khổ điện thoại Android: tràn ngang, phần tử lọt khung, nút chồng nhau,
// vùng chạm quá nhỏ, chữ bị cắt, dính sát mép. Chạy ở 4 khổ: 320×640, 360×640, 412×915, 640×360.

// Chạy: cd tools/probe && W=360 H=640 OUT=/tmp/probe/android node play.mjs steps/android.mjs
import { boot, fresh } from '../lib.mjs';

const auditFn = (name) => {
  const V = { w: innerWidth, h: innerHeight };
  const label = (e) => e.id ? '#' + e.id : (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : e.tagName.toLowerCase());
  const txt = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22);
  const root = document.querySelector('#ui');
  const st0 = getComputedStyle(document.documentElement);
  const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > .05; };
  // phần tử nằm trong vùng cuộn (bảng .body, màn hình máy .ph) thì nằm ngoài khung là bình thường
  const scrollParent = (e) => { for (let p = e.parentElement; p && p !== root; p = p.parentElement) { const s = getComputedStyle(p); if (/auto|scroll/.test(s.overflowY) || /auto|scroll/.test(s.overflowX)) return p; } return null; };
  // phần tử bị cuộn ra khỏi khung nhìn của khung cuộn → coi như không thấy, đừng tính là chồng/chạm mép
  const hiddenInScroll = (e, r) => { const p = scrollParent(e); if (!p) return false; const q = p.getBoundingClientRect(); return r.bottom < q.top - 1 || r.top > q.bottom + 1 || r.right < q.left - 1 || r.left > q.right + 1; };
  // khung nhìn thật của phần tử: cắt theo mọi tổ tiên có overflow khác visible (rect của DOM không tự cắt)
  const visRect = (e) => {
    let r = e.getBoundingClientRect(); let l = r.left, t = r.top, ri = r.right, b = r.bottom;
    for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p); if (!/hidden|auto|scroll|clip/.test(s.overflowY + s.overflowX)) continue;
      const q = p.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); ri = Math.min(ri, q.right); b = Math.min(b, q.bottom);
    }
    return { left: l, top: t, right: ri, bottom: b, width: Math.max(0, ri - l), height: Math.max(0, b - t), hidden: ri - l < 1 || b - t < 1 };
  };
  const modal = document.querySelector('#modal');
  const inModal = modal && vis(modal);
  const all = [...root.querySelectorAll('*')].filter(vis);
  const R = { name, view: V, modal: window.__game.ui.modalName || null, scrollX: document.documentElement.scrollWidth > V.w + 1,
    outside: [], overlap: [], small: [], clipped: [], edge: [], fonts: Infinity, bodyScroll: null };
  const targets = [];
  for (const e of all) {
    // bỏ qua HUD khi đang mở bảng (HUD nằm dưới lớp phủ, không tương tác được)
    if (inModal && !e.closest('#modal')) continue;
    const r = e.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (e.children.length === 0 && txt(e) && fs < R.fonts) R.fonts = +fs.toFixed(1);
    const sp = scrollParent(e), hid = hiddenInScroll(e, r);
    if (hid) continue;
    const b0 = visRect(e);
    if (b0.hidden) continue;
    if (!sp && (r.left < -1 || r.top < -1 || r.right > V.w + 1 || r.bottom > V.h + 1)) R.outside.push({ el: label(e), t: txt(e), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), par: label(e.parentElement || document.body) });
    const s = getComputedStyle(e);
    if (e.children.length === 0 && e.scrollWidth > e.clientWidth + 2 && !/auto|scroll/.test(s.overflowX)) R.clipped.push({ el: label(e), t: txt(e), need: e.scrollWidth, have: e.clientWidth });
    const clickable = !e.closest('#layed') && e.matches('button, [data-a], .cell, .tab, .row[data-a], [data-p]');
    if (clickable) { const vr = visRect(e); if (vr.hidden) continue; targets.push({ e, r: vr }); if (r.width < 40 || r.height < 30) R.small.push({ el: label(e), t: txt(e), w: Math.round(r.width), h: Math.round(r.height) }); }
    // dính sát mép dưới (vùng cử chỉ Android) hoặc mép cạnh
    if (clickable && !sp && (b0.bottom > V.h - 8 || b0.left < 4 || b0.right > V.w - 4)) R.edge.push({ el: label(e), t: txt(e), b: Math.round(V.h - r.bottom), l: Math.round(r.left), r: Math.round(V.w - r.right) });
  }
  for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) {
    const a = targets[i].r, b = targets[j].r;
    if (targets[i].e.contains(targets[j].e) || targets[j].e.contains(targets[i].e)) continue;
    const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ox <= 2 || oy <= 2) continue;
    const cov = (ox * oy) / Math.min(a.width * a.height, b.width * b.height);
    if (cov > .5) R.overlap.push({ a: label(targets[i].e) + ' "' + txt(targets[i].e) + '"', b: label(targets[j].e) + ' "' + txt(targets[j].e) + '"', cov: +cov.toFixed(2) });
  }
  const body = document.querySelector('#modal .body');
  if (body && inModal) R.bodyScroll = { scrollH: body.scrollHeight, clientH: body.clientHeight, canScroll: /auto|scroll/.test(getComputedStyle(body).overflowY), hiddenBottom: Math.max(0, body.scrollHeight - body.clientHeight) };
  for (const k of ['outside', 'overlap', 'small', 'clipped', 'edge']) R[k] = R[k].slice(0, 6);
  (window.__AUD ||= []).push(R);
  return { name, outside: R.outside.length, overlap: R.overlap.length, small: R.small.length, clipped: R.clipped.length };
};

const open = (panel, arg) => ({ eval: async (p, a) => { const G = window.__game; G.ui.closePanel(); await new Promise((r) => setTimeout(r, 120)); G.ui.panel(p, a); await new Promise((r) => setTimeout(r, 550)); return G.ui.modalName; }, args: [panel, arg ?? null], wait: 250 });
const audit = (name) => ({ eval: auditFn, args: [name], wait: 60 });

export default [boot, fresh(600),
  { label: 'dựng cảnh đầy đủ: bậc 7, chi nhánh, điện thoại, có khách', eval: async () => {
    const G = window.__game, g = G.g, R = window.__R;
    const RECIPES = (await import('/src/data/recipes.ts')).RECIPES;
    g.cash = 5000000; g.stall.tier = 7; g.stall.where = 'placed'; g.stall.spot = 'cho';
    for (const id of ['daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas', 'camung']) g.gear[id] = 100;
    for (const rid of ['com_suon', 'tra_da', 'banh_xeo']) if (g.rec[rid]) { g.rec[rid].known = true; g.rec[rid].on = true; g.rec[rid].price = R.suggestPrice(g, RECIPES[rid]); }
    g.stall.ready = [{ rid: 'com_suon', n: 5, q: 1, at: 0, cost: 12000 }, { rid: 'tra_da', n: 1, q: 1, at: 0, cost: 3000 }];
    if (!g.branch) R.openBranch(g, 'cho');
    if (g.branch && !g.branch.keeper) R.hireKeeper(g);
    if (g.branch) R.moveToBranch(g, 'com_suon', 3);
    g.phone = { id: 'camung', battery: 72 }; g.stall.open = true;
    G.player.place(g.stall.x + 3, g.stall.z + 3, 0);
    window.__AUD = [];
    return { branch: !!g.branch, phone: g.phone.id };
  }, wait: 400 },
  { eval: () => { document.getElementById('rotok')?.click(); return 1; }, quiet: true, wait: 300 },
  audit('hud'),
  { shot: 'a1-hud' },

  { ...open('settings'), quiet: true }, audit('cai-dat'), { shot: 'a2-cai-dat' },
  { label: 'cuộn hết bảng cài đặt', eval: async () => { const b = document.querySelector('#modal .body'); b.scrollTop = b.scrollHeight; await new Promise((r) => setTimeout(r, 350)); return b.scrollTop; }, wait: 400 },
  { shot: 'a2b-cai-dat-cuoi' },
  { ...open('bag'), quiet: true }, audit('tui-do'), { shot: 'a3-tui' },
  { ...open('book'), quiet: true }, audit('so-tay'), { shot: 'a4-so' },
  { ...open('stall'), quiet: true }, audit('quay'), { shot: 'a5-quay' },
  { ...open('report'), quiet: true }, audit('bao-cao'), { shot: 'a6-bao-cao' },
  { ...open('branch'), quiet: true }, audit('chi-nhanh'), { shot: 'a7-chi-nhanh' },
  { ...open('map'), quiet: true }, audit('ban-do'), { shot: 'a8-ban-do' },
  { ...open('errand'), quiet: true }, audit('sai-vat'), { shot: 'a9-sai-vat' },
  { ...open('phone'), quiet: true }, audit('dt-cam-ung'), { shot: 'b1-dt-cam-ung' },
  { label: 'app Cửa hàng (máy cảm ứng)', eval: async () => { [...document.querySelectorAll('.pgrid .cell')].find((c) => c.textContent.includes('Cửa hàng'))?.click(); await new Promise((r) => setTimeout(r, 450)); return 1; }, quiet: true, wait: 500 },
  audit('dt-cam-ung-cua-hang'), { shot: 'b2-dt-shop' },
  { label: 'máy nắp gập', eval: async () => { const g = window.__game.g; g.phone = { id: 'napgap', battery: 66 }; window.__game.ui.closePanel(); window.__game.ui.panel('phone'); await new Promise((r) => setTimeout(r, 550)); return g.phone.id; }, wait: 300 },
  audit('dt-nap-gap'), { shot: 'b3-dt-napgap' },
  { label: 'máy cục gạch', eval: async () => { const g = window.__game.g; g.phone = { id: 'cucgach', battery: 55 }; window.__game.ui.closePanel(); window.__game.ui.panel('phone'); await new Promise((r) => setTimeout(r, 550)); return g.phone.id; }, wait: 300 },
  audit('dt-cuc-gach'), { shot: 'b4-dt-cucgach' },
  { label: 'máy cục gạch — app Cửa hàng (danh sách chữ)', eval: async () => { const g = window.__game.g; const P = await import('/src/ui/phoneUI.ts'); P.phoneKey('open', 'shop'); window.__game.ui.reopenPanel('phone'); await new Promise((r) => setTimeout(r, 450)); return P.phoneView().app; }, wait: 500 },
  audit('dt-cuc-gach-shop'), { shot: 'b5-dt-cucgach-shop' },
  { label: 'bảng chọn vị trí nút (tuỳ chỉnh HUD)', eval: async () => { const G = window.__game; G.ui.closePanel(); G.ui.panel('settings'); await new Promise((r) => setTimeout(r, 500)); document.querySelector('#modal [data-a=layout]')?.click(); await new Promise((r) => setTimeout(r, 700)); return !!document.querySelector('#layed'); }, wait: 800 },
  audit('sua-hud'), { shot: 'b6-sua-hud' },
  { label: 'tổng hợp', eval: () => {
    const A = window.__AUD;
    const bad = A.filter((r) => r.outside.length || r.overlap.length || r.edge.length || r.clipped.length);
    const tiny = A.flatMap((r) => r.small.map((s) => r.name + ' ' + s.el + ' ' + s.w + 'x' + s.h)).filter((s) => / (2[0-9]|1[0-9])x/.test(s));
    window.__BAD = bad; window.__TINY = tiny;
    return { manHinh: A.length, coVanDe: bad.map((r) => r.name + ': ngoài ' + JSON.stringify(r.outside) + ', chồng ' + r.overlap.length + ', mép ' + r.edge.length + ', cắt ' + r.clipped.length), vungChamNho: tiny };
  }, max: 9000 },
];
