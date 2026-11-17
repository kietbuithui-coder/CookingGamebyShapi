// Menu Test & Dịch chuyển ẩn: bấm LẦN LƯỢT mọi mục để chắc mục nào cũng chạy, không lỗi console.
// Chạy: cd tools/probe && OUT=/tmp/probe/dev node play.mjs steps/devmenu.mjs
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(9 * 60),
  { label: '① danh sách mục trong menu ẩn' },
  { eval: async () => {
    const m = await import('/src/game/devPoints.ts');
    const secs = m.getDevSections();
    window.__devMod = m;
    return { tag: m.DEV_BUILD_TAG, sections: secs.map((s) => ({ title: s.title, ids: s.items.map((i) => i.id) })) };
  }, wait: 200 },

  { label: '② bấm từng mục, ghi lại toast / lỗi' },
  { eval: async () => {
    const g0 = window.__game, m = window.__devMod, R = window.__R;
    const out = [];
    for (const sec of m.getDevSections()) {
      for (const it of sec.items) {
        const before = JSON.stringify({ cash: g0.g.cash, day: g0.g.day, min: Math.round(g0.g.min), branch: g0.g.branch?.spot ?? null, tier: g0.g.stall.tier });
        let err = '';
        try { it.run(); } catch (e) { err = String(e && e.message || e).slice(0, 160); }
        await new Promise((r) => setTimeout(r, 260));
        if (!it.closePanel) g0.ui.closePanel();
        out.push({ id: it.id, err, before, after: JSON.stringify({ cash: g0.g.cash, day: g0.g.day, min: Math.round(g0.g.min), branch: g0.g.branch?.spot ?? null, tier: g0.g.stall.tier }) });
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    return { ran: out.length, errors: out.filter((o) => o.err), detail: out };
  }, wait: 800, max: 4000 },

  { label: '③ sau khi bấm hết: chi nhánh còn sống, sổ mở được, quầy chi nhánh có trong cảnh' },
  { eval: async () => {
    const g0 = window.__game, R = window.__R;
    g0.ui.closePanel();
    const b = g0.g.branch;
    const a = g0.stall.branchAnchor();
    return { branch: b && b.spot, keeper: b?.keeper?.name, stock: R.branchStock(g0.g), anchor: a && { x: Math.round(a.x), z: Math.round(a.z) }, visible: g0.stall.branchGroup.visible, keeperNpc: !!g0.stall.keeper };
  }, wait: 300 },

  { label: '③b dựng lại chi nhánh rồi TỚI quầy để chụp' },
  { eval: async () => {
    const m = window.__devMod, g0 = window.__game;
    m.getDevSections()[0].items.find((i) => i.id === 'setup_chuoi').run();
    await new Promise((r) => setTimeout(r, 400));
    m.getDevSections()[0].items.find((i) => i.id === 'branch_fill').run();
    await new Promise((r) => setTimeout(r, 200));
    m.getDevSections()[0].items.find((i) => i.id === 'tp_chinhanh').run();
    await new Promise((r) => setTimeout(r, 1500));
    g0.ui.closeDialog();
    const a = g0.stall.branchAnchor();
    return { branch: g0.g.branch?.spot, stock: window.__R.branchStock(g0.g), anchor: !!a, visible: g0.stall.branchGroup.visible, keeperNpc: !!g0.stall.keeper };
  }, wait: 1000 },
  { shot: 'dev01-chinhanh.png' },

  { label: '④ mở menu ẩn đúng đường người chơi: bấm 7 lần chữ “Cài đặt”' },
  { eval: async () => {
    const g0 = window.__game;
    g0.ui.panel('settings');
    await new Promise((r) => setTimeout(r, 300));
    const el = document.getElementById('dev-unlock');
    for (let i = 0; i < 7; i++) { el.click(); await new Promise((r) => setTimeout(r, 90)); }
    await new Promise((r) => setTimeout(r, 400));
    const h = [...document.querySelectorAll('#modal .panel h2, #modal .panel h3, #modal .panel h4')].map((e) => e.textContent.trim()).slice(0, 4);
    const rows = [...document.querySelectorAll('#modal .item')].map((e) => e.querySelector('b')?.textContent?.trim()).filter(Boolean);
    return { headers: h, rows: rows.length, first: rows.slice(0, 4) };
  }, wait: 500 },
  { shot: 'dev02-menu-an.png' },

  { label: '⑤ bấm thử nút “Chạy” của mục đầu tiên trong menu ẩn (đường UI thật)' },
  { eval: async () => {
    const g0 = window.__game;
    const btns = [...document.querySelectorAll('#modal button[data-a="devRun"]')];
    const info = btns.slice(0, 3).map((b) => b.dataset.k);
    if (btns[2]) btns[2].click();     // branch_fill
    await new Promise((r) => setTimeout(r, 600));
    return { buttons: btns.length, kinds: info, stockAfter: window.__R.branchStock(g0.g) };
  }, wait: 700 },
  { shot: 'dev03-sau-khi-chay.png' },
];
