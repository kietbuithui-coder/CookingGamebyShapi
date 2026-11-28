// Lượt 72 — CON DAO HAI LƯỠI: kiểm bằng chạm thật, không gọi hàm luật.
// 1) menu băng có mục “cái giá”, 2) cảnh đi thu nợ kể chuyện rồi bắt chọn, 3) tin xấu của băng hiện hộp thoại,
// 4) app “Sổ băng” trên điện thoại hiện đúng số, 5) rời băng có bốn cách với giá ghi trước.
import { boot, fresh } from '../lib.mjs';
const NÚT = `const nut = (text) => { const bs = [...document.querySelectorAll('#dlg button, #modal button')];
  const b = bs.find((x) => (x.innerText || '').trim().toLowerCase().includes(text));
  if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect();
  return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; };`;
const ĐỌC = `const doc = () => { const d = document.querySelector('#dlg');
  return { tiêu: (d?.querySelector('h3')?.innerText || '').trim(),
    bài: (d?.querySelector('p')?.innerText || '').replace(/\\s+/g, ' ').slice(0, 900),
    nút: [...(d?.querySelectorAll('button') || [])].map((b) => (b.innerText || '').replace(/\\s+/g, ' ').trim()).filter(Boolean) }; };`;
const bấm = (t) => ({ tapsEval: new Function(`${NÚT}; const p = nut(${JSON.stringify(t)}); return p ? [p] : [];`), gap: 300 });
const bậc4 = () => ({ eval: () => { const g0 = window.__game, g = g0.g;
  g.cash = 700000; if (!g.gang) window.__R ? null : null;
  return 1; } });

export default [
  boot, fresh(12 * 60),
  // Dựng ván: đang ở bậc 4 băng Hẻm, đứng trước Hùng Sẹo.
  { eval: () => { const g0 = window.__game, g = g0.g, a = g0.world.anchors.v_shark;
      g.cash = 800000; window.__gangmod = g0; g0.player.place(a.x + 0.6, a.z + 1.4, Math.PI);
      window.__fast(true); window.__n = g0.npcs.fixed.get('shark');
      g.gang = { id: 'hem', respect: 300, tier: 4, since: 0, jobsToday: 0, jobDay: -1, stock: {}, paid: 8, turfDay: -1, crew: 0 };
      g.st.energy = 100; g.min = 12 * 60;
      g0.acts.talk(window.__n); return { ok: true }; } },
  { wait: 300 },
  { eval: new Function(`${ĐỌC}; return doc();`) },
  bấm('băng đảng'),
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'menu-bang-72' },
  // 1. Bảng cái giá
  bấm('mất gì'),
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'cai-gia' },
  bấm('bốn cách rời băng'),
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'roi-bang' },
  bấm('thôi, con ở lại'),
  // 2. Cảnh đi thu nợ
  bấm('sổ việc hôm nay'), bấm('thu nợ thuê'),
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'canh-1' },
  bấm('tiếp'), bấm('rồi sao'), bấm('nào'),
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'canh-lua-chon' },
  { eval: () => { const g = window.__game.g; return { mood: g.st.mood, rep: g.rep, cash: g.cash, respect: g.gang.respect }; } },
  bấm('làm tới'),
  { eval: () => { const g = window.__game.g; return { mood: +g.st.mood.toFixed(1), rep: +g.rep.toFixed(1), cash: g.cash, respect: g.gang.respect,
      toast: [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText.slice(0, 90)).slice(-1) }; } },
  { shot: 'sau-canh' },
  // 3. Tin xấu của băng — đặt cờ rồi đợi lớp game mở
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.g.gang.trouble = 'nop_phan';
      g0.acts.troubleT = 0; return 'set'; } },
  { waitFor: () => !!document.querySelector('#dlg:not(.hide) h3'), timeout: 15000 },
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'tin-xau' },
  bấm('kệ nó'),
  // 4. App Sổ băng trên điện thoại
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.g.phone = { id: 'camung', battery: 90, on: true, sim: 1 };
      g0.ui.panel('phone'); return g0.ui.modalName; } },
  { wait: 500 }, { shot: 'phone-home' },
  { eval: () => { const cells = [...document.querySelectorAll('.pgrid .cell')]; return cells.map((c) => c.innerText.trim()); } },
  { eval: () => { const c = [...document.querySelectorAll('.pgrid .cell')].find((x) => /Sổ băng|Sổ/.test(x.innerText));
      if (!c) return null; const r = c.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; } },
  { eval: () => { const c = [...document.querySelectorAll('.pgrid .cell')].find((x) => /Sổ băng/.test(x.innerText));
      if (c) c.click(); return document.querySelector('.pmain')?.innerText?.replace(/\s+/g, ' ').slice(0, 700); } },
  { wait: 400 }, { shot: 'phone-so-bang' },
];
