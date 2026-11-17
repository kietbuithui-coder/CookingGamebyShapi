// GIAO DIỆN ĐIỆN THOẠI THEO TỪNG MẪU MÁY (mở bằng tay: bấm nút điện thoại trên HUD hoặc phím P).
// Ba đời máy khác nhau hẳn về cách nhìn và cách bấm:
//   · Cục gạch  — màn đen trắng, một danh sách dòng chọn + phím cứng, giống Nokia 1110i.
//   · Nắp gập   — màn màu nhỏ, xoay vòng 12 biểu tượng, mở app bằng phím mềm giữa.
//   · Cảm ứng   — màn lớn, lưới icon 3 cột kiểu PDA, bấm thẳng vào icon, thanh trạng thái trên cùng.
// Chỉ là lớp hiển thị: mọi luật chơi vẫn nằm trong src/sim/phone.ts.
import { ctx } from '../game/ctx';
import type { Game } from '../sim/state';
import { hhmm, money, clamp } from '../core/util';
import { esc } from './ui';
import { PhoneDef, PhoneFeat, appsOf } from '../data/phone';
import * as R from '../sim/rules';
import * as PH from '../sim/phone';
import type { Contact } from '../sim/phone';
import { ledgerBody } from './panels';

export type PhoneApp = 'ledger' | 'contacts' | 'sms' | 'radio' | 'music' | 'wap' | 'battery';

export { appsOf };
export interface PhoneView {
  /** Màn hình đang mở: `'home'` là màn hình chính. */
  app: PhoneApp | 'home';
  /** Dòng đang chọn trên máy có phím cứng (cục gạch) / icon đang chọn trên nắp gập. */
  idx: number;
  /** Dòng đang chọn trong danh sách của app (danh bạ, tin nhắn, giải trí). */
  sel: number;
  /** Màn hình con mở từ app, ví dụ `'ledger'`… (dùng cho nắp gập: app mở ra rồi mới tới danh sách). */
  sub: string;
}

export const phoneView = (): PhoneView => {
  const P = ctx as unknown as { _phone?: PhoneView };
  if (!P._phone) P._phone = { app: 'home', idx: 0, sel: 0, sub: '' };
  return P._phone;
};
export const resetPhoneView = () => { const v = phoneView(); v.app = 'home'; v.idx = 0; v.sel = 0; v.sub = ''; };

// ───────────────────────── Biểu tượng: mỗi mẫu máy một kiểu vẽ ─────────────────────────
const GLYPH: Record<string, string> = {
  ledger: '<path d="M6 4h9l3 3v13H6z"/><path d="M9 9h6M9 12h6M9 15h4"/>',
  contacts: '<rect x="5" y="4" width="14" height="16" rx="2"/><circle cx="12" cy="10" r="2.4"/><path d="M8.6 17c.6-2 5.6-2 6.2 0"/>',
  sms: '<path d="M4 5h16v10H10l-5 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
  radio: '<circle cx="12" cy="13" r="6"/><path d="M12 13l4-3M9 4l9-1"/>',
  music: '<path d="M9 18V6l9-2v12"/><circle cx="7" cy="18" r="2.2"/><circle cx="16" cy="16" r="2.2"/>',
  wap: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c4 5 4 11 0 16M12 4c-4 5-4 11 0 16"/>',
  battery: '<rect x="3" y="7" width="15" height="10" rx="2"/><path d="M20 10v4"/><path d="M6 10h6v4H6z" fill="currentColor" stroke="none"/>',
};
const GLYPH_OLD: Record<string, string> = {
  ledger: '<path d="M6 5h11v14H6z"/><path d="M8 9h7M8 12h7M8 15h4"/><path d="M6 3h11"/>',
  contacts: '<circle cx="12" cy="9" r="3"/><path d="M6 19c1-4 11-4 12 0"/>',
  sms: '<path d="M5 6h14v9H11l-4 4v-4H5z"/>',
  radio: '<path d="M4 10h16v9H4z"/><path d="M8 10V7M16 10V7"/><circle cx="12" cy="14" r="2"/>',
  music: '<path d="M10 17V7l7-2v10"/><circle cx="8" cy="17" r="1.8"/>',
  wap: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M5 9h14M5 16h14"/>',
  battery: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 7h4v6h-4z" fill="currentColor" stroke="none"/>',
};
export const appGlyph = (id: string, old = false) => `<svg viewBox="0 0 24 24" class="pg">${(old ? GLYPH_OLD : GLYPH)[id] ?? (old ? GLYPH_OLD : GLYPH).battery}</svg>`;

// ───────────────────────── Nội dung từng app ─────────────────────────
function rowsOf(g: Game, m: PhoneDef, app: PhoneApp): { b: string; s: string; act?: string; k?: string; off?: boolean }[] {
  const on = PH.isOn(g);
  const dra = (n: number) => (g.phone ? (n += 0) : n);
  void dra;
  if (app === 'contacts') {
    const list = PH.contacts(g);
    return list.map((c: Contact) => ({
      b: c.name, s: c.where + (c.regular && g.flags['call_' + c.id] === g.day ? ' · hôm nay gọi rồi' : ''),
      act: c.regular ? 'call' : undefined, k: c.id, off: c.regular && (!on || g.cash < PH.CALL_FEE || g.flags['call_' + c.id] === g.day),
    }));
  }
  if (app === 'sms') {
    if (on) PH.markSeen(g);
    return PH.smsList(g).map((sm) => ({ b: sm.from, s: sm.text, act: undefined, k: sm.id }));
  }
  if (app === 'radio' || app === 'music' || app === 'wap') {
    const f = PH.FUN[app];
    return [{ b: PH_FEAT_NAME[app], s: `${f.min} phút · tinh thần +${f.mood} · pin −${f.pin}% · ${on ? 'mở được' : 'máy hết pin'}`, act: 'fun', k: app, off: !on || !m.feats.includes(app) }];
  }
  if (app === 'battery') {
    const pin = Math.round(PH.battery(g));
    return [{ b: `Pin ${pin}%`, s: `Để trong túi dùng được ~${(PH.battery(g) / PH.DRAIN_PER_HOUR).toFixed(1).replace('.', ',')} giờ nữa` },
      { b: 'Sạc pin', s: 'Ngủ ở chỗ trọ trở lên (có ổ điện) là đầy pin · hoặc sạc nhờ tạp hoá 5.000₫', act: 'charge', off: !PH.hasPower(g) && !PH.canChargeAt('kiosk') }];
  }
  return [];
}
const PH_FEAT_NAME: Record<string, string> = { radio: 'Radio FM', music: 'Nghe nhạc', wap: 'Lướt web WAP' };

/** Kết quả bấm một dòng trong app: trả về `true` nếu có thay đổi để vẽ lại. */
export function runRow(app: PhoneApp, row: { act?: string; k?: string }) {
  const g = ctx.g;
  if (row.act === 'call' && row.k) { ctx.acts.phoneCall(row.k); return true; }
  if (row.act === 'fun' && row.k) { ctx.acts.phoneFun(row.k as 'radio' | 'music' | 'wap'); return true; }
  if (row.act === 'charge') { ctx.ui.closePanel(); ctx.ui.panel('map'); return true; }
  void g;
  return false;
}

// ───────────────────────── Ba bộ khung ─────────────────────────
const pinner = (g: Game) => `<div class="pinner"><i style="width:${clamp(Math.round(PH.battery(g)), 0, 100)}%"></i></div>`;

/** MÀN HÌNH CHÍNH của từng mẫu máy. */
export function homeScreen(g: Game, m: PhoneDef): string {
  const apps = appsOf(m), un = PH.unread(g), pin = Math.round(PH.battery(g)), on = PH.isOn(g);
  const v = phoneView();
  const head = `${m.name} <span class="muted">${m.brand}</span>`;
  if (m.id === 'cucgach') {
    // danh sách dòng + phím cứng bên dưới
    const items = apps.map((a, i) => `<div class="row mono${v.idx === i ? ' sel' : ''}" data-a="phonepick" data-i="${i}"><span class="mk">${v.idx === i ? '▸' : ' '}</span>${a.short}${a.id === 'sms' && un ? ` <b>(${un})</b>` : ''}</div>`).join('');
    return `<div class="pstat"><span>${hhmm(g.min)}</span><span class="pbatt${pin < 20 ? ' low' : ''}">${'▮'.repeat(Math.max(0, Math.round(pin / 20)))}${'▯'.repeat(Math.max(0, 5 - Math.round(pin / 20)))}</span></div>
      <div class="pmain mono">${pinner(g)}<div class="plist">${items}</div>
        <div class="pfoot mono"><b>Chọn</b> · mũi tên <b>Lên/Xuống</b> · phím <b>giữa</b> để mở</div></div>`;
  }
  if (m.id === 'napgap') {
    // xoay vòng 12 icon: 4 trên × 4 giữa × riêng cái đang chọn ở giữa
    const cell = (a: (typeof apps)[number], i: number) => `<div class="cell${v.idx === i ? ' sel' : ''}" data-a="phonepick" data-i="${i}">${appGlyph(a.id, true)}<span>${a.short}</span>${a.id === 'sms' && un ? '<s class="dot"></s>' : ''}</div>`;
    const top = apps.slice(0, 4).map(cell).join(''), bot = apps.slice(4).map((a, i) => cell(a, i + 4)).join('');
    const cur = apps[v.idx];
    return `<div class="pstat"><span>${hhmm(g.min)}</span><span>${on ? 'SÓNG' : 'HẾT PIN'}</span><span class="pbatt${pin < 20 ? ' low' : ''}">${pin}%</span></div>
      <div class="pmain"><div class="pring"><div class="row">${top}</div><div class="cur">${cur ? appGlyph(cur.id, true) : ''}<b>${cur?.short ?? ''}</b></div><div class="row">${bot}</div></div>
        <div class="psoft"><button class="sbtn" data-a="phonehome">Quay lại</button><button class="sbtn go" data-a="phoneok">Chọn</button></div></div>`;
  }
  // cảm ứng: lưới icon + thanh trạng thái
  const grid = apps.map((a, i) => `<div class="cell${v.idx === i ? ' on' : ''}" data-a="phoneopen" data-k="${a.id}"><span class="bub">${appGlyph(a.id)}${a.id === 'sms' && un ? '<s class="dot"></s>' : ''}</span><span>${a.short}</span></div>`).join('');
  return `<div class="pstat"><span>${hhmm(g.min)}</span><span>${head}</span><span class="pbatt${pin < 20 ? ' low' : ''}">${pin}%</span></div>
    <div class="pmain"><div class="phome"><div class="pgrid">${grid}</div>
      <div class="pfoot">${on ? 'Bấm một biểu tượng để mở · nút ● để về màn hình chính' : 'Máy hết pin — sạc rồi mở lại'}</div></div></div>`;
}

/** MÀN HÌNH TRONG MỘT APP. */
export function appScreen(g: Game, m: PhoneDef, app: PhoneApp): string {
  const v = phoneView(), on = PH.isOn(g), a = appsOf(m).find((x) => x.id === app)!;
  const dead = on ? '' : `<p class="pdead">Máy hết pin. Sạc ở nhà hoặc sạc nhờ tạp hoá 5.000₫.</p>`;
  if (app === 'ledger') return `${dead}${ledgerBody(g)}`;
  if (app === 'battery') {
    const pin = Math.round(PH.battery(g));
    return `<p>Pin còn <b>${pin}%</b> · để trong túi dùng được khoảng <b>${(PH.battery(g) / PH.DRAIN_PER_HOUR).toFixed(1).replace('.', ',')} giờ</b> nữa.</p>
      <div class="bar"><b style="width:${pin}%;background:${pin < 20 ? 'var(--red)' : pin < 50 ? '#d9a441' : 'var(--green)'}"></b></div>
      <p class="muted">Ngủ ở phòng trọ, nhà nghỉ, căn hộ, nhà riêng, cửa hàng (có ổ điện) là đầy pin sáng hôm sau. Ở gầm cầu hay ghế đá công viên thì không có điện.</p>
      <p class="muted">Máy này nghe được ${m.feats.map((f) => FEAT(f).toLowerCase()).join(', ')}.</p>`;
  }
  const rows = rowsOf(g, m, app);
  if (!rows.length) return `${dead}<p class="muted">${app === 'contacts' ? 'Danh bạ trống. Đi chào hỏi trong xóm rồi mở lại.' : 'Hộp thư trống trơn.'}</p>`;
  const list = rows.map((r, i) => {
    const sel = m.id === 'cucgach' ? v.sel === i : m.id === 'napgap' ? v.sel === i : false;
    const tag = m.id === 'cucgach' ? `<span class="mk">${sel ? '▸' : ' '}</span>` : '';
    return `<div class="row${sel ? ' sel' : ''}${r.off ? ' off' : ''}" data-a="phonerow" data-i="${i}">${tag}<span class="g"><b>${esc(r.b)}</b><s>${esc(r.s)}</s></span>${r.act && m.id === 'camung' ? '<i class="go">›</i>' : ''}</div>`;
  }).join('');
  const foot = m.id === 'cucgach' ? '<div class="pfoot mono">Phím giữa để làm · <b>Quay lại</b> để thoát</div>'
    : m.id === 'napgap' ? '<div class="psoft"><button class="sbtn" data-a="phonehome">Quay lại</button><button class="sbtn go" data-a="phoneok">Chọn</button></div>' : '';
  return `${dead}<div class="ptitle">${appGlyph(a.id, m.id !== 'camung')} ${a.name}</div><div class="plist">${list}</div>${foot}`;
}
const FEAT = (f: PhoneFeat) => ({ ledger: 'Sổ thu chi', contacts: 'Danh bạ', sms: 'Tin nhắn', radio: 'Radio FM', music: 'Nghe nhạc', wap: 'Lướt web' } as Record<PhoneFeat, string>)[f];

/** Toàn bộ thân máy (khung viền + màn hình + phím cứng tuỳ mẫu). Thay cho `.body` của bảng. */
export function phoneShell(g: Game, m: PhoneDef): { title: string; html: string; foot: string } {
  const v = phoneView(), apps = appsOf(m), a = v.app === 'home' ? null : v.app;
  const inner = a ? appScreen(g, m, a) : homeScreen(g, m);
  const back = `<button class="btn small" data-a="phonehome">${a ? '‹ Quay lại' : 'Đóng máy'}</button>`;
  const up = apps.find((x) => x.id === a);
  const keys = m.id === 'cucgach'
    ? `<div class="pkeys"><button class="key" data-a="phoneup">▲</button><button class="key mid" data-a="phoneok">OK</button><button class="key" data-a="phonedown">▼</button></div>`
    : m.id === 'napgap' ? `<div class="pkeys"><button class="key" data-a="phoneup">▲</button><button class="key mid" data-a="phoneok">TÁCH</button><button class="key" data-a="phonedown">▼</button></div>`
      : `<div class="pkeys touch"><button class="key home" data-a="phonehome">●</button></div>`;
  const title = a ? `${icPhone()} ${m.name} · ${up?.name ?? a}` : `${icPhone()} ${m.name}`;
  const html = `<div class="phonewrap"><div class="phonebox ${m.id}"><div class="ph ${m.id}">${inner}</div>${keys}</div>
    <div class="phoneside"><p class="muted">${m.desc}</p>
      <div class="kv"><span>Pin</span><b>${Math.round(PH.battery(g))}%</b></div>
      <div class="kv"><span>Giờ máy</span><b>${hhmm(g.min)} · ngày ${g.day + 1}</b></div>
      <div class="kv"><span>Tiền mặt</span><b>${money(g.cash)}</b></div>
      <div class="kv"><span>Tin chưa đọc</span><b>${PH.unread(g)}</b></div>
      <p class="muted">${m.id === 'cucgach' ? 'Máy phím cứng: dùng ▲ ▼ chọn, OK để mở, OK lần nữa để làm.' : m.id === 'napgap' ? 'Máy nắp gập: ▲ ▼ xoay vòng chọn app, TÁCH để mở/đóng.' : 'Máy cảm ứng: bấm thẳng vào biểu tượng.'}</p></div></div>`;
  void R;
  return { title, html, foot: back };
}
const icPhone = () => '<svg class="ic" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10.5 5.5h3M11 18.5h2"/></svg>';

/** Xử lý phím cứng / icon của từng mẫu máy. Trả `true` nếu cần vẽ lại. */
export function phoneKey(k: 'up' | 'down' | 'ok' | 'home' | 'pick' | 'open', arg?: string | number): boolean {
  const v = phoneView(), g = ctx.g, m = PH.phone(g);
  if (!m) return false;
  const apps = appsOf(m);
  if (k === 'home') { v.app = 'home'; v.sel = 0; v.sub = ''; return true; }
  if (k === 'open' && typeof arg === 'string') { v.app = arg as PhoneApp; v.sel = 0; v.sub = ''; return true; }
  if (k === 'pick' && typeof arg === 'number') { v.idx = arg; return true; }
  if (k === 'up' || k === 'down') {
    const step = k === 'up' ? -1 : 1;
    if (v.app === 'home') { v.idx = (v.idx + step + apps.length) % apps.length; return true; }
    const rows = rowsOf(g, m, v.app as PhoneApp);
    if (!rows.length) return true;
    v.sel = (v.sel + step + rows.length) % rows.length; return true;
  }
  if (k === 'ok') {
    if (v.app === 'home') { const pick = apps[v.idx]; if (!pick) return false; v.app = pick.id; v.sel = 0; return true; }
    const rows = rowsOf(g, m, v.app as PhoneApp), row = rows[v.sel];
    if (row && !row.off) return runRow(v.app as PhoneApp, row);
    return false;
  }
  return false;
}
/** Bấm một dòng trong danh sách (máy cảm ứng bấm thẳng, máy phím thì bấm = chọn + làm). */
export function phoneRow(i: number): boolean {
  const v = phoneView(), g = ctx.g, m = PH.phone(g);
  if (!m || v.app === 'home') return false;
  const rows = rowsOf(g, m, v.app as PhoneApp), row = rows[i];
  if (!row) return false;
  v.sel = i;
  if (row.off) return true;
  if (row.act) return runRow(v.app as PhoneApp, row);
  return true;
}
