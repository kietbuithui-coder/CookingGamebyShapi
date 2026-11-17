// LƯỢT 22 — Giao diện riêng cho cả 3 mẫu điện thoại (cục gạch · nắp gập · cảm ứng):
// mở máy là thấy đúng cái máy đó, bấm icon (hoặc ▲▼ + OK) để xem từng app.
// Chạy: cd tools/probe && OUT=/tmp/probe/phone3 node play.mjs steps/phone3.mjs
import { boot, fresh } from '../lib.mjs';

const usePhone = (id) => ({ eval: (id) => {
  const g = window.__game.g, R = window.__R;
  R.buyGear ? null : null;
  g.gear[id] = 100; g.phone = { id, battery: 78 };
  window.__game.ui.closePanel(); window.__game.ui.panel('phone');
  return g.phone.id;
}, args: [id] });

const snap = () => ({ eval: () => {
  const box = document.querySelector('.phonebox');
  const home = box?.querySelector('.pgrid, .plist, .pring');
  const body = document.querySelector('#modal .body')?.textContent ?? '';
  return {
    cls: box?.className ?? null,
    title: document.querySelector('#modal h2')?.textContent?.trim() ?? '',
    cells: box?.querySelectorAll('.pgrid .cell').length ?? 0,
    rows: box?.querySelectorAll('.plist .row').length ?? 0,
    keys: box?.querySelectorAll('.pkeys .key').length ?? 0,
    hasHome: !!home, hasPin: !!box?.querySelector('.pstat'),
    snippet: body.replace(/\s+/g, ' ').slice(0, 110),
  };
} });

export default [boot, fresh(9 * 60),
  { label: '0 màn dọc: đóng lời nhắc xoay ngang' },
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return !!b; } },

  { label: '① CỤC GẠCH — màn hình chính dạng danh sách + phím cứng', eval: async () => { const g = window.__game.g; g.gear.cucgach = 100; g.phone = { id: 'cucgach', battery: 78 }; window.__game.ui.closePanel(); window.__game.ui.panel('phone'); await new Promise((r) => setTimeout(r, 400)); return g.phone.id; }, wait: 600 },
  { shot: 'p3-01-cucgach.png' },
  snap(),
  { label: '①b bấm ▼ rồi OK để mở app thứ 2 (danh bạ)', eval: async () => {
    const btn = (sel) => document.querySelector(sel);
    btn('.pkeys .key:nth-child(3)')?.click(); await new Promise((r) => setTimeout(r, 200));
    btn('.pkeys .key.mid')?.click(); await new Promise((r) => setTimeout(r, 300));
    return { app: window.__game.ui.modalName, title: document.querySelector('#modal h2')?.textContent?.trim() };
  }, wait: 700 },
  { shot: 'p3-02-cucgach-danhb.png' },

  { label: '② NẮP GẬP — xoay vòng icon, TÁCH để mở', eval: async () => { const g = window.__game.g; g.phone = { id: 'napgap', battery: 64 }; window.__game.ui.closePanel(); window.__game.ui.panel('phone'); await new Promise((r) => setTimeout(r, 400)); return g.phone.id; }, wait: 600 },
  { shot: 'p3-03-napgap.png' },
  snap(),
  { label: '②b bấm TÁCH mở app đang chọn', eval: async () => {
    document.querySelector('.pkeys .key.mid')?.click(); await new Promise((r) => setTimeout(r, 300));
    return { body: (document.querySelector('#modal .body')?.textContent ?? '').replace(/\s+/g, ' ').slice(0, 90) };
  }, wait: 500 },
  { shot: 'p3-04-napgap-app.png' },

  { label: '③ CẢM ỨNG — lưới icon, bấm thẳng', eval: async () => { const g = window.__game.g; g.phone = { id: 'camung', battery: 41 }; window.__game.ui.closePanel(); window.__game.ui.panel('phone'); await new Promise((r) => setTimeout(r, 400)); return g.phone.id; }, wait: 600 },
  { shot: 'p3-05-camung.png' },
  snap(),
  { label: '③b bấm icon Tin nhắn', eval: async () => {
    const cells = [...document.querySelectorAll('.pgrid .cell')];
    const sms = cells.find((c) => c.textContent.includes('Tin nhắn'));
    sms?.click(); await new Promise((r) => setTimeout(r, 300));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { clicked: !!sms, rows: document.querySelectorAll('.plist .row').length, snippet: body.replace(/\s+/g, ' ').slice(0, 90) };
  }, wait: 500 },
  { shot: 'p3-06-camung-sms.png' },
  { label: '③c quay lại màn hình chính rồi mở Sổ thu chi', eval: async () => {
    document.querySelector('[data-a="phonehome"]')?.click(); await new Promise((r) => setTimeout(r, 250));
    const led = [...document.querySelectorAll('.pgrid .cell')].find((c) => c.textContent.includes('Sổ sách'));
    led?.click(); await new Promise((r) => setTimeout(r, 300));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { hasLedger: body.includes('Lãi / lỗ'), snippet: body.replace(/\s+/g, ' ').slice(0, 80) };
  }, wait: 500 },
  { shot: 'p3-07-camung-so.png' },
];
