// Lượt 71 — BĂNG ĐẢNG: thử bằng tay như người chơi.
// 1) theo băng qua hội thoại thật (nộp lễ), 2) mở “Xem băng đảng chi tiết” thấy đủ sáu bậc,
// 3) nhận một ca việc, 4) mở sổ hàng cấm mua một món, 5) xem màn hình phe phái,
// 6) gọi công an tới khi đang giữ hàng → hộp thoại phạt nặng hiện đúng số.
//
// Lưu ý: mỗi `eval`/`tapsEval` chạy trong ngữ cảnh riêng (không có `fs`, không dùng chung biến khai báo ngoài),
// nên mọi helper phải khai BÊN TRONG từng bước. Muốn giữ thứ gì giữa các bước thì gắn vào `window`.
import { boot, fresh } from '../lib.mjs';

/** Mã dùng chung: tìm nút theo chữ trong hộp thoại và trả toạ độ tâm (số nguyên — puppeteer chỉ nhận số nguyên). */
const NÚT = `const nut = (text) => { const bs = [...document.querySelectorAll('#dlg button, #modal button')];
  const b = bs.find((x) => (x.innerText || '').trim().toLowerCase().includes(text));
  if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect();
  return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; };`;
/** Đọc hộp thoại đang mở: tên người nói, câu nói, danh sách nút. */
const ĐỌC = `const doc = () => { const d = document.querySelector('#dlg');
  return { tiêu: (d?.querySelector('h3')?.innerText || '').trim(),
    bài: (d?.querySelector('p')?.innerText || '').replace(/\\s+/g, ' ').slice(0, 800),
    nút: [...(d?.querySelectorAll('button') || [])].map((b) => (b.innerText || '').replace(/\\s+/g, ' ').trim()).filter(Boolean) }; };`;
/** Đọc tình trạng băng trong ván thật. */
const TÌNH = `const tinh = () => { const g = window.__game.g;
  return { cash: g.cash, gang: g.gang && { phe: g.gang.id, uyTin: g.gang.respect, bac: g.gang.tier, chuyen: g.gang.paid, hang: g.gang.stock }, wanted: g.wanted }; };`;
// `tapsEval` phải trả MỘT MẢNG CÁC ĐIỂM ([[x, y]]) — trả [x, y] thì `play.mjs` coi mỗi số là một điểm và
// `touchscreen.tap(624, undefined)` chết với “double value expected”.
const bấm = (text) => ({ tapsEval: new Function(`${NÚT}; const p = nut(${JSON.stringify(text)}); return p ? [p] : [];`), gap: 320 });

export default [
  boot, fresh(15 * 60),
  // Đứng sát sào huyệt Hùng Sẹo rồi nói chuyện thật.
  { eval: () => { const g0 = window.__game, a = g0.world.anchors.v_shark;
      g0.player.place(a.x + 0.6, a.z + 1.4, Math.PI); window.__fast(true);
      window.__n = g0.npcs.fixed.get('shark'); return { cóShark: !!window.__n, neo: !!a }; } },
  { eval: () => { window.__game.acts.talk(window.__n); return document.querySelector('#dlg h3')?.innerText; } },
  { wait: 400 }, { shot: 'shark-menu' },
  bấm('băng đảng'),
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'gang-chua-theo' },
  // Có tiền rồi mở lại, bấm “Xin theo băng”.
  { eval: () => { window.__game.g.cash = 500000; window.__game.acts.talk(window.__n); return 1; } },
  { wait: 300 }, bấm('băng đảng'), bấm('xin theo băng'),
  { eval: new Function(`${TÌNH}; return tinh();`) }, { shot: 'da-theo-bang' },
  // Bấm “Xem băng đảng chi tiết”.
  bấm('xem băng đảng chi tiết'),
  { eval: new Function(`${ĐỌC}; const d = doc(); return { bài: d.bài, soBac: (d.bài.match(/[·✔] \\d\\./g) || []).length, nút: d.nút };`) },
  { shot: 'chi-tiet-bang' },
  bấm('quay lại'), bấm('phe phái'),
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'phe-phai' },
  bấm('quay lại'),
  // Nhận một ca việc.
  { eval: () => { const g = window.__game.g; g.min = Math.floor(g.min / 1440) * 1440 + 15 * 60; g.st.energy = 100; return g.min % 1440 / 60; } },
  bấm('sổ việc hôm nay'), bấm('canh gác kho'),
  { eval: new Function(`${TÌNH}; return { tình: tinh(), toast: [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText.slice(0, 80)).slice(-1) };`) },
  { shot: 'sau-mot-ca' },
  // Sổ hàng cấm.
  bấm('hàng cấm của băng'),
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'so-hang-cam' },
  { eval: () => { const g0 = window.__game, g = g0.g; g.gang.tier = 3; g.cash = 2000000; g0.ui.closeDialog(); g0.acts.talk(window.__n);
      return { mở: g0.ui.isDialogOpen(), nút: [...(document.querySelector('#dlg')?.querySelectorAll('button') || [])].map((b) => b.innerText.slice(0, 40)) }; } },
  { wait: 300 }, bấm('băng đảng'),
  { eval: new Function(`${ĐỌC}; return doc();`) },
  bấm('hàng cấm của băng'), bấm('mua pháo'),
  { eval: new Function(`${TÌNH}; return tinh();`) }, { shot: 'mua-phao' },
  // Đóng hội thoại, gọi một chú công an tới, để chú đi tới gần rồi bấm vào chú.
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.g.wanted = 90; return 1; } },
  { eval: () => { window.__cop = window.__game.npcs.sendPolice(); return !!window.__cop; } },
  { waitFor: () => { const n = window.__cop; if (!n) return false; const p = window.__game.player;
      return Math.hypot(n.x - p.x, n.z - p.z) < 3.5; }, timeout: 30000 },
  { eval: () => { const g0 = window.__game; g0.player.place(window.__cop.x + 0.7, window.__cop.z + 0.7, 0);
      return { cách: +Math.hypot(window.__cop.x - g0.player.x, window.__cop.z - g0.player.z).toFixed(2) }; } },
  { eval: () => { window.__game.acts.caught(window.__cop); return 1; } },
  { wait: 600 },
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'bi-kham-hang-cam' },
];
