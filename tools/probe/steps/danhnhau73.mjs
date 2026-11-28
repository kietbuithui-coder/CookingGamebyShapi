// LƯỢT 73 — ĐE DOẠ · ĐÁNH NHAU · GIAO DIỆN ANDROID: kiểm bằng chạm và ảnh thật.
// 1) giao diện Android: thanh trên cùng + ☰ mở ngăn kéo, nút cũ #menub đã ẩn;
// 2) nút Đe doạ chỉ hiện từ bậc 4, và bấm vào thì mở bảng ba mức kèm giá;
// 3) ván đánh nhau: cảnh 3D có đối thủ thật, ba nút, máu đối thủ tụt khi đấm;
// 4) chụp ảnh từng bước để người chơi xem tận mắt.
import { boot, fresh } from '../lib.mjs';
const TOẠ = `const tam = (sel) => { const e = document.querySelector(sel); if (!e) return null;
  const r = e.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; };`;

export default [
  boot, fresh(10 * 60),
  { eval: () => { const g0 = window.__game; g0.set.android = true; g0.ui.applyAndroid(); return { android: g0.set.android, topbar: !!document.querySelector('#topbar:not(.hide)'), menub: getComputedStyle(document.querySelector('#menub')).display }; } },
  { wait: 500 }, { shot: 'a73-1-android' },
  // Mở ngăn kéo bằng ☰ (chạm thật)
  { tapsEval: new Function(`${TOẠ}; return [tam('#tbburger')].filter(Boolean);`) },
  { wait: 500 },
  { eval: () => ({ open: document.querySelector('#drawer').classList.contains('on'), items: [...document.querySelectorAll('#dgrid .dbtn')].map((b) => b.innerText.trim()) }) },
  { shot: 'a73-2-ngan-keo' },
  // Chưa theo băng: KHÔNG có nút đe doạ
  { eval: () => ({ coDeDoa: !!document.querySelector('#dgrid [data-p=threat]') }) },
  // Dựng ván bậc 4 rồi mở lại ngăn kéo
  { eval: () => { const g0 = window.__game, g = g0.g; g.cash = 800000;
      g.gang = { id: 'hem', respect: 300, tier: 4, since: 0, jobsToday: 0, jobDay: -1, stock: {}, paid: 8, turfDay: -1, crew: 0, threats: 0 };
      g0.player.place(-52, 12, 0); g0.ui.closeDrawer(); g0.ui.closePanel();
      document.querySelector('#tbburger').click(); return { coDeDoa: !!document.querySelector('#dgrid [data-p=threat]') }; } },
  { wait: 400 }, { shot: 'a73-3-ngan-keo-bang' },
  // Bấm ĐE DOẠ: cần có người gần (4 m). Đặt một người đi đường ngay cạnh rồi bấm thật.
  { eval: () => { const g0 = window.__game; const n = g0.npcs.list.find((x) => x.kind === 'ped' && !x.hidden);
      if (n) { n.x = g0.player.x + 1.3; n.z = g0.player.z + 0.6; n.path = []; n.state = 'stand'; n.timer = 600; }
      return { nguoi: !!n }; } },
  { tapsEval: new Function(`${TOẠ}; return [tam('#dgrid [data-p=threat]')].filter(Boolean);`) },
  { wait: 800 },
  { eval: () => { const d = document.querySelector('#dlg'); return { mo: !d.classList.contains('hide'),
      tieu: (d.querySelector('h3')?.innerText || '').trim(),
      cau: (d.querySelector('p')?.innerText || '').replace(/\s+/g, ' ').slice(0, 200),
      nut: [...d.querySelectorAll('button')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean) }; } },
  { shot: 'a73-4-de-doa' },
  // Bấm mức nhẹ nhất (bấm toạ độ, không gọi hàm)
  { tapsEval: new Function(`${TOẠ}; const bs = [...document.querySelectorAll('#dlg button')];
      const b = bs.find((x) => (x.innerText || '').includes('Xin để yên')); if (!b) return [];
      const r = b.getBoundingClientRect(); return [[Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]];`) },
  { wait: 1200 },
  { eval: () => { const g = window.__game.g; return { cash: g.cash, wanted: Math.round(g.wanted), rep: Math.round(g.rep), threats: g.gang.threats }; } },
  { shot: 'a73-5-sau-de-doa' },
  // ── VÁN ĐÁNH NHAU ──
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.ui.closePanel(); g0.ui.closeDrawer();
      g0.acts.openFight(window.__FIGHTS[0]); return { mo: g0.ui.isDialogOpen() }; } },
  // Bấm được nút thật chỉ khi hộp thoại đã đóng hẳn: `UI.dialog` để `ctx.mode = 'panel'` cho tới lúc đóng,
  // mà chế độ panel thì lệnh chơi bị khoá — đây là hiểu nhầm của chính tôi lúc viết kịch bản, không phải lỗi
  // của game (nút vẫn nằm dưới ngón tay, `elementFromPoint` trả về đúng BUTTON như đo trong `tmp78`).
  { wait: 700 },
  { eval: () => { const d = document.querySelector('#dlg'); return { nut: [...d.querySelectorAll('button')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean) }; } },
  { shot: 'a73-6-chon-cach-danh' },
  { tapsEval: new Function(`${TOẠ}; const bs = [...document.querySelectorAll('#dlg button')];
      const b = bs.find((x) => (x.innerText || '').includes('Đánh tới')); if (!b) return [];
      const r = b.getBoundingClientRect(); return [[Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]];`) },
  { wait: 900 },
  { eval: () => { const a = window.__game.anim; return { active: a.active, kind: a.kind, doiThu: a.fightRigs?.length, foeHp: Math.round(a.foeHp), hp: Math.round(a.fightHp), nut: [...document.querySelectorAll('#cook .btns button')].map((b) => b.innerText.trim()) }; } },
  { shot: 'a73-7-canh-danh' },
  // Đấm ba lần bằng nút thật
  { eval: () => { const g0 = window.__game, c = document.querySelector('#cook'); const b = document.querySelector('#cook .btns button');
      return { mode: g0.mode, modal: g0.ui.modalName, dlg: g0.ui.isDialogOpen(), kind: g0.anim.kind, active: g0.anim.active, cookCls: c.className,
        dlgText: (document.querySelector('#dlg p')?.innerText || '').slice(0, 90), rect: b ? (() => { const r = b.getBoundingClientRect(); return [r.x|0,r.y|0,r.width|0,r.height|0]; })() : null }; } },
  { tapsEval: new Function(`${TOẠ}; return [tam('#cook .btns button')].filter(Boolean);`) },
  { wait: 400 },
  { eval: () => { const a = window.__game.anim; return { foeHp: Math.round(a.foeHp), hp: Math.round(a.fightHp), guc: a.fightRigs.filter((f) => f.down).length, active: a.active }; } },
  { shot: 'a73-8-sau-cu-dam' },
  // Đấm 8 phát bằng CHẠM THẬT (`.click()` không đi qua `pointerdown` nên không ăn — xem ghi chú cuối tệp).
  { tapsEval: new Function(`${TOẠ}; const p = tam('#cook .btns button'); return p ? Array.from({ length: 8 }, () => p) : [];`), gap: 700 },
  { wait: 600 },
  { eval: () => { const g = window.__game.g; return { toc: (document.querySelector('#toasts')?.innerText || '').slice(-260), wanted: Math.round(g.wanted), health: Math.round(g.st.health), respect: g.gang.respect }; } },
  { shot: 'a73-9-ket-qua' },
];
