// Lượt 72 — ĐỤNG ĐỘ HAI PHE: ở bậc 4 băng Hẻm, đi sang địa bàn Băng Chợ Cá thì bị chặn; ba lựa chọn đều có giá.
import { boot, fresh } from '../lib.mjs';
const NÚT = `const nut = (t) => { const bs = [...document.querySelectorAll('#dlg button')];
  const b = bs.find((x) => (x.innerText || '').trim().toLowerCase().includes(t)); if (!b) return null;
  b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect();
  return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; };`;
const ĐỌC = `const doc = () => { const d = document.querySelector('#dlg');
  return { tiêu: (d?.querySelector('h3')?.innerText || '').trim(), bài: (d?.querySelector('p')?.innerText || '').replace(/\\s+/g,' ').slice(0,600),
    nút: [...(d?.querySelectorAll('button') || [])].map((b) => b.innerText.replace(/\\s+/g,' ').trim()) }; };`;
const bấm = (t) => ({ tapsEval: new Function(`${NÚT}; const p = nut(${JSON.stringify(t)}); return p ? [p] : [];`), gap: 300 });

export default [
  boot, fresh(12 * 60),
  // Đứng ngay giữa Chợ Xóm Chiều (địa bàn băng Chợ Cá) với thân phận bậc 4 băng Hẻm.
  { eval: () => { const g0 = window.__game, g = g0.g; window.__fast(true);
      g.gang = { id: 'hem', respect: 300, tier: 4, since: 0, jobsToday: 0, jobDay: -1, stock: {}, paid: 8, turfDay: -1, crew: 0 };
      g.st.health = 90; g.rep = 40; g.wanted = 0;
      // Chợ Xóm Chiều: lô (bx=0, bz=1) → tâm chợ ở khoảng x −60, z 0..+40. Đứng trong sân chợ, không trong nhà.
      g0.player.place(-52, 12, 0);
      g0.ui.closeDialog(); g0.mode = 'play'; g0.acts.clashT = 0;
      return { x: +g0.player.x.toFixed(1), z: +g0.player.z.toFixed(1) }; } },
  // Hội thoại mở đầu tự bật lại sau khi vào ván — đóng nó rồi mới đợi đụng độ.
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; g0.acts.clashT = 0; return g0.mode; } },
  { waitFor: () => { const h = document.querySelector('#dlg:not(.hide) h3'); return !!h && /Chợ Cá/.test(h.innerText); }, timeout: 25000 },
  { eval: new Function(`${ĐỌC}; return doc();`) }, { shot: 'dung-do' },
  bấm('đứng lại'),
  { eval: () => { const g = window.__game.g; return { health: +g.st.health.toFixed(1), rep: +g.rep.toFixed(1), wanted: +g.wanted.toFixed(1), respect: g.gang.respect,
      toast: [...document.querySelectorAll('#toasts .toast')].map((t) => t.innerText.slice(0, 120)).slice(-1) }; } },
  { shot: 'sau-dung-do' },
];
