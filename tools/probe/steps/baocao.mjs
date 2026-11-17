// LƯỢT 20 — ① bảng Báo cáo của người làm khi sắp hết nguyên liệu (kèm gợi ý đi chợ),
//            ② nút giao quyền TỰ DUYỆT ĐẶT BÀN cho bếp trưởng (khách đặt là nhận luôn).
// Chạy: cd tools/probe && OUT=/tmp/probe/baocao node play.mjs steps/baocao.mjs
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(10 * 60),
  { label: '①a màn dọc: đóng lời nhắc xoay ngang' },
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return !!b; } },

  { label: '①b dựng nhà hàng + 2 bếp + phụ quầy, dọn sạch kho, mở bảng Báo cáo' },
  { eval: async () => {
    const g0 = window.__game, R = window.__R, m = await import('/src/game/devPoints.ts');
    window.__dev = m;
    m.getDevSections()[0].items.find((i) => i.id === 'setup_baocao').run();
    await new Promise((r) => setTimeout(r, 500));
    m.getDevSections()[0].items.find((i) => i.id === 'baocao_clear').run();
    await new Promise((r) => setTimeout(r, 600));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return {
      sous: R.sousCount(g0.g), helpers: R.helperCount(g0.g),
      hasCards: body.includes('bếp trưởng') || body.includes('phụ quầy'),
      hasGap: body.includes('gấp') || body.includes('sắp hết'),
      hasCost: /Giao .* đi chợ — [\d.]+₫/.test(body),
      lowCount: R.lowStockCount(g0.g),
      snippet: body.replace(/\s+/g, ' ').slice(0, 180),
    };
  }, wait: 800 },
  { shot: 'baocao01-bang-bao-cao.png' },

  { label: '①c bấm nút "Giao … đi chợ" ngay trong báo cáo → mở bảng giao chợ đúng người' },
  { eval: async () => {
    const g0 = window.__game;
    const btn = [...document.querySelectorAll('#modal button[data-a="repErrand"]')].find((b) => b.textContent.includes('Giao'));
    btn?.click();
    await new Promise((r) => setTimeout(r, 400));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { clicked: !!btn, movedToErrand: body.includes('Giao cho ai'), hasLines: /Trả khô|Đậu|Trứng|Nước tương|Dầu ăn/.test(body) };
  }, wait: 500 },
  { shot: 'baocao02-giao-di-cho.png' },

  { label: '② công tắc tự duyệt: bật rồi tạo đặt bàn xem có được nhận luôn không' },
  { eval: async () => {
    const g0 = window.__game, R = window.__R;
    g0.ui.closePanel();
    const r = m0();
    function m0() { return window.__dev.getDevSections()[0].items.find((i) => i.id === 'book_auto'); }
    const before = R.autoBookOn(g0.g);
    r.run();
    await new Promise((resolve) => setTimeout(resolve, 250));
    const after = R.autoBookOn(g0.g);
    const last = g0.g.bookings[g0.g.bookings.length - 1];
    return { before, after, newBookingStatus: last?.status, autoAccepted: last?.status === 'accepted' };
  }, wait: 400 },

  { label: '②b tắt lại thì đặt bàn mới quay về trạng thái chờ duyệt' },
  { eval: async () => {
    const g0 = window.__game, R = window.__R;
    window.__dev.getDevSections()[0].items.find((i) => i.id === 'book_auto').run();
    await new Promise((r) => setTimeout(r, 250));
    const b = R.createBooking(g0.g);
    return { on: R.autoBookOn(g0.g), status: b?.status };
  }, wait: 300 },

  { label: '③ chip "Sắp hết đồ" trên HUD bấm được → mở báo cáo' },
  { eval: async () => {
    const g0 = window.__game;
    g0.ui.closePanel();
    await new Promise((r) => setTimeout(r, 1500));
    const chip = document.getElementById('lowchip');
    const text = chip?.textContent ?? '';
    chip?.click();
    await new Promise((r) => setTimeout(r, 400));
    return { chip: text.slice(0, 40), opened: g0.ui.modalName };
  }, wait: 600 },
  { shot: 'baocao03-tu-hud.png' },

  { label: '④ tab Nhân sự có nút mở Báo cáo + công tắc tự duyệt' },
  { eval: async () => {
    const g0 = window.__game;
    g0.ui.closePanel(); g0.ui.panel('stall');
    await new Promise((r) => setTimeout(r, 250));
    document.querySelector('#modal .tab[data-tab="staff"]')?.click();
    await new Promise((r) => setTimeout(r, 350));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return {
      hasReportBtn: !!document.querySelector('#modal button[data-a="reportOpen"]'),
      hasAutoBtn: !!document.querySelector('#modal button[data-a="autoBook2"]'),
      text: body.replace(/\s+/g, ' ').slice(0, 120),
    };
  }, wait: 400 },
  { shot: 'baocao04-tab-nhan-su.png' },
];
