// Tuỳ chỉnh giao diện: cỡ chữ/nút chung và vị trí, độ lớn từng nhóm nút do người chơi tự xếp.
import { ctx, saveSettings, BtnKey, BtnPlace, BTN_SCALE } from '../game/ctx';

interface Item { key: BtnKey; sel: string; name: string; origin: string; }
/** origin: điểm neo khi phóng to/thu nhỏ — góc mà nút vốn bám vào, để đổi cỡ không làm nút trôi khỏi mép màn hình. */
const ITEMS: Item[] = [
  { key: 'act', sel: '#act', name: 'Nút tương tác', origin: '100% 100%' },
  { key: 'run', sel: '#runb', name: 'Nút chạy', origin: '50% 50%' },
  { key: 'menu', sel: '#menub', name: 'Túi · Sổ · Bản đồ · Cài đặt', origin: '100% 0%' },
  { key: 'cook', sel: '#cook .btns', name: 'Nút khi nấu ăn', origin: '100% 100%' },
];
export const orient = (): 'L' | 'P' => (window.innerWidth >= window.innerHeight ? 'L' : 'P');
/** Độ dời thực tế (px) đang áp cho từng nhóm nút sau khi đã ép vào trong màn hình. */
const applied: Partial<Record<BtnKey, { tx: number; ty: number }>> = {};

/** Áp cỡ giao diện và vị trí các nút theo cài đặt. Gọi lại mỗi khi đổi cài đặt, đổi kích thước hay xoay màn hình. */
export function applyLayout() {
  const root = document.getElementById('ui'); if (!root || !ctx.set) return;
  const u = ctx.set.ui, o = u[orient()], W = window.innerWidth, H = window.innerHeight, M = 4;
  root.style.setProperty('--ui-scale', String(u.scale));
  for (const it of ITEMS) {
    const el = root.querySelector(it.sel) as HTMLElement | null; if (!el) continue;
    const p = o[it.key]; let tx = p ? p.x * W : 0, ty = p ? p.y * H : 0; const s = p ? p.s : 1;
    const set = () => { el.style.transformOrigin = it.origin; el.style.transform = tx || ty || s !== 1 ? `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s})` : ''; };
    set();
    // Không để nút nào lọt ra ngoài màn hình (sau khi xoay máy, đổi cỡ giao diện, hoặc kéo quá tay).
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.width < W && r.height < H) {
      const dx = r.left < M ? M - r.left : r.right > W - M ? W - M - r.right : 0, dy = r.top < M ? M - r.top : r.bottom > H - M ? H - M - r.bottom : 0;
      if (dx || dy) { tx += dx; ty += dy; set(); }
    }
    applied[it.key] = { tx, ty };
  }
}

const mk = (cls: string, html: string, parent: HTMLElement) => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; parent.appendChild(e); return e; };

/**
 * Mở màn hình sắp xếp nút: kéo để dời, chạm để chọn rồi bấm Nhỏ/To để đổi cỡ. Gọi done() khi người chơi bấm Xong.
 * Có hai cảnh vì nút tương tác và các nút nấu ăn dùng chung một góc màn hình nhưng không bao giờ hiện cùng lúc:
 * "Khi đi lại" (tương tác, chạy, hàng nút túi/sổ/bản đồ/cài đặt) và "Khi nấu ăn".
 */
export function editLayout(done: () => void) {
  const root = document.getElementById('ui')!, u = ctx.set.ui;
  const lay = mk('', '', root); lay.id = 'layed';
  // Các nút nấu ăn bình thường chỉ hiện khi đang nấu: cho hiện tạm vài nút mẫu để xếp chỗ.
  const cook = root.querySelector('#cook') as HTMLElement, btns = cook.querySelector('.btns') as HTMLElement, cookHidden = cook.classList.contains('hide'), oldBtns = btns.innerHTML;
  root.classList.add('layout-edit');
  if (!btns.children.length) btns.innerHTML = '<button class="btn">Quạt than</button><button class="btn hot">Gắp ra</button>';
  let view: 'play' | 'cook' = 'play', sel: BtnKey = 'act';
  const shown = (it: Item) => (it.key === 'cook') === (view === 'cook');
  const place = (k: BtnKey): BtnPlace => (u[orient()][k] ??= { x: 0, y: 0, s: 1 });
  const bar = mk('ctl', `<div class="row"><button class="tab on" data-l="play">Khi đi lại</button><button class="tab" data-l="cook">Khi nấu ăn</button></div>
    <small>Kéo khung để dời chỗ. Chạm vào khung rồi bấm Nhỏ / To để đổi cỡ.</small>
    <div class="row"><button class="btn" data-l="minus">− Nhỏ</button><span class="cur"></span><button class="btn" data-l="plus">+ To</button></div>
    <div class="row"><button class="btn" data-l="reset">Về mặc định</button><button class="btn green" data-l="done">Xong</button></div>`, lay);
  const handles = new Map<BtnKey, HTMLElement>();
  const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const sync = () => {
    root.classList.toggle('layout-cook', view === 'cook'); cook.classList.toggle('hide', view !== 'cook');
    applyLayout();
    const rects: DOMRect[] = [];
    for (const it of ITEMS) {
      const h = handles.get(it.key)!; h.style.display = shown(it) ? '' : 'none'; if (!shown(it)) continue;
      const e = root.querySelector(it.sel) as HTMLElement, r = e.getBoundingClientRect(), pad = 5;
      h.style.left = r.left - pad + 'px'; h.style.top = r.top - pad + 'px'; h.style.width = r.width + pad * 2 + 'px'; h.style.height = r.height + pad * 2 + 'px';
      h.classList.toggle('on', it.key === sel); h.classList.toggle('below', r.top < 60); rects.push(h.getBoundingClientRect());
    }
    (bar.querySelector('.cur') as HTMLElement).textContent = `${ITEMS.find((i) => i.key === sel)!.name} · ${Math.round(place(sel).s * 100)}%`;
    for (const t of Array.from(bar.querySelectorAll('.tab'))) t.classList.toggle('on', (t as HTMLElement).dataset.l === view);
    // Bảng điều khiển né sang mép bên kia nếu đang đè lên một khung, để không che mất nút đang xếp.
    const over = () => rects.some((r) => hit(r, bar.getBoundingClientRect()));
    if (over()) { bar.classList.toggle('low'); if (over()) bar.classList.toggle('low'); }
  };
  /** Ghi lại vị trí thật trên màn hình (đã ép vào trong) để lần sau không "nhớ" một chỗ nằm ngoài màn hình. */
  const commit = (k: BtnKey) => { const a = applied[k], p = place(k); if (a) { p.x = a.tx / window.innerWidth; p.y = a.ty / window.innerHeight; } };
  for (const it of ITEMS) {
    const h = mk('h', `<span>${it.name}</span>`, lay); handles.set(it.key, h);
    let drag: { x: number; y: number; px: number; py: number } | null = null;
    h.addEventListener('pointerdown', (e) => { e.preventDefault(); sel = it.key; try { h.setPointerCapture(e.pointerId); } catch { /* không hỗ trợ */ } const p = place(it.key); drag = { x: e.clientX, y: e.clientY, px: p.x, py: p.y }; sync(); });
    h.addEventListener('pointermove', (e) => { if (!drag) return; const p = place(it.key); p.x = drag.px + (e.clientX - drag.x) / window.innerWidth; p.y = drag.py + (e.clientY - drag.y) / window.innerHeight; sync(); });
    const end = () => { if (!drag) return; drag = null; commit(it.key); sync(); };
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
  }
  const onResize = () => sync();
  window.addEventListener('resize', onResize);
  bar.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('[data-l]') as HTMLElement | null; if (!b) return;
    const a = b.dataset.l, p = place(sel);
    if (a === 'play' || a === 'cook') { view = a; sel = a === 'cook' ? 'cook' : 'act'; sync(); }
    else if (a === 'minus' || a === 'plus') { p.s = Math.round(Math.max(BTN_SCALE[0], Math.min(BTN_SCALE[1], p.s + (a === 'plus' ? 0.1 : -0.1))) * 10) / 10; sync(); commit(sel); sync(); }
    else if (a === 'reset') { for (const it of ITEMS) if (shown(it)) delete u[orient()][it.key]; sync(); }
    else if (a === 'done') {
      window.removeEventListener('resize', onResize); lay.remove(); root.classList.remove('layout-edit', 'layout-cook');
      btns.innerHTML = oldBtns; cook.classList.toggle('hide', cookHidden);
      // bỏ những mục vẫn ở nguyên chỗ mặc định cho gọn
      for (const o of ['L', 'P'] as const) for (const k of Object.keys(u[o]) as BtnKey[]) { const q = u[o][k]!; if (Math.abs(q.x) < 0.002 && Math.abs(q.y) < 0.002 && q.s === 1) delete u[o][k]; }
      saveSettings(); applyLayout(); done();
    }
  });
  sync();
}
