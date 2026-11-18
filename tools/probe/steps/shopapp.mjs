// LƯỢT 23 — App "Quản lý cửa hàng" trên điện thoại: xem quầy chính + chi nhánh, bật/tắt bán từ xa, cảnh báo bán lỗ.
// Chạy: cd tools/probe && OUT=/tmp/probe/shopapp node play.mjs steps/shopapp.mjs
import { boot, fresh } from '../lib.mjs';

const setup = { label: 'a dựng nhà hàng bậc 7 + bật 2 món + bày phần sẵn + có chi nhánh', eval: async () => {
  const G = window.__game, g = G.g, R = window.__R, m = await import('/src/game/devPoints.ts');
  window.__dev = m;
  const sec = m.getDevSections().find((s) => s.title.includes('Vựa')) ?? m.getDevSections()[0];
  void sec;
  g.cash = 3000000; g.stall.tier = 7; g.stall.where = 'placed'; g.stall.spot = 'cho';
  for (const id of ['daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas']) g.gear[id] = 100;
  const RECIPES = (await import('/src/data/recipes.ts')).RECIPES;
  for (const rid of ['com_suon', 'tra_da']) { g.rec[rid].known = true; g.rec[rid].on = true; g.rec[rid].price = R.suggestPrice(g, RECIPES[rid]); }
  g.stall.ready = [{ rid: 'com_suon', n: 5, q: 1, at: 0, cost: 12000 }, { rid: 'tra_da', n: 1, q: 1, at: 0, cost: 3000 }];
  R.openBranch(g, 'cho');
  if (g.branch) { R.hireKeeper(g); R.moveToBranch(g, 'com_suon', 3); }
  g.phone = { id: 'camung', battery: 72 }; g.gear.camung = 100;
  G.ui.closePanel(); G.ui.panel('phone');
  await new Promise((r) => setTimeout(r, 400));
  const apps = [...document.querySelectorAll('.pgrid .cell')].map((c) => c.textContent.trim());
  return { apps, hasShopApp: apps.some((a) => a.includes('Cửa hàng')), branch: !!g.branch, rows: R.shopRows(g).map((r) => [r.id, r.stock, r.open]) };
}, wait: 800 };

export default [boot, fresh(10 * 60),
  { label: '0 màn dọc: đóng lời nhắc xoay ngang' },
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return !!b; } },
  setup,
  { shot: 'shop01-may-cam-ung-app.png' },

  { label: 'b bấm icon Cửa hàng → thấy quầy chính + chi nhánh', eval: async () => {
    const cell = [...document.querySelectorAll('.pgrid .cell')].find((c) => c.textContent.includes('Cửa hàng'));
    cell?.click(); await new Promise((r) => setTimeout(r, 350));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { clicked: !!cell, hasMain: body.includes('Quầy chính'), hasBranch: body.includes('Chi nhánh'),
      buttons: [...document.querySelectorAll('#modal .body button[data-a="phshop"]')].map((b) => b.textContent.trim()) };
  }, wait: 500 },
  { shot: 'shop02-app-cua-hang.png' },

  { label: 'c bấm "Đóng" ở quầy chính → quầy tắt bán thật', eval: async () => {
    const g = window.__game.g;
    g.stall.open = true;
    const btn = [...document.querySelectorAll('#modal .body button[data-a="phshop"]')][0];
    btn?.click(); await new Promise((r) => setTimeout(r, 350));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { after: g.stall.open, label: body.includes('tạm đóng') };
  }, wait: 500 },

  { label: 'd bật bán chi nhánh từ điện thoại', eval: async () => {
    const g = window.__game.g;
    g.branch.open = false;
    const btns = [...document.querySelectorAll('#modal .body button[data-a="phshop"]')];
    btns[btns.length - 1]?.click(); await new Promise((r) => setTimeout(r, 350));
    return { branchOpen: g.branch.open, keeper: !!g.branch.keeper };
  }, wait: 500 },

  { label: 'e đặt giá bán lỗ → app cảnh báo đúng món', eval: async () => {
    const g = window.__game.g, R = window.__R;
    g.rec.com_suon.price = 2000;
    window.__game.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 300));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { loss: R.lossDishes(g).map((l) => l.rid), warned: body.includes('Bán lỗ'), snippet: body.replace(/\s+/g, ' ').slice(-90) };
  }, wait: 500 },
  { shot: 'shop03-canh-bao-ban-lo.png' },

  { label: 'e2 mở lại máy KHÔNG bị nhảy về màn hình chính (đang ở app Cửa hàng)', eval: async () => {
    const G = window.__game;
    // đang ở app Cửa hàng sau bước e; vẽ lại cùng tên bảng không được reset
    G.ui.reopenPanel('phone');
    await new Promise((r) => setTimeout(r, 250));
    const body = document.querySelector('#modal .body')?.textContent ?? '';
    return { stillApp: body.includes('Quầy chính'), hasGrid: !!document.querySelector('.pgrid') };
  }, wait: 400 },

  { label: 'f máy cục gạch cũng có app Cửa hàng', eval: async () => {
    const g = window.__game.g; g.phone = { id: 'cucgach', battery: 55 };
    window.__game.ui.closePanel(); window.__game.ui.panel('phone');
    await new Promise((r) => setTimeout(r, 300));
    const rows = [...document.querySelectorAll('.plist .row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim());
    return { rows, has: rows.some((r) => r.includes('Cửa hàng')) };
  }, wait: 400 },
  { shot: 'shop04-cucgach-co-app.png' },
];
