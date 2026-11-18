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
import { RECIPES } from '../data/recipes';
import { toast } from '../core/bus';

export type PhoneApp = 'ledger' | 'contacts' | 'sms' | 'radio' | 'music' | 'wap' | 'battery' | 'shop';

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

// ───────────────────────── Hoạt ảnh ngay trên màn hình máy ─────────────────────────
// Đang nghe radio / phát nhạc / lướt WAP / soạn tin / gọi điện thì trên màn hình máy hiện một dải đang chạy
// (gọi điện thì chiếm cả màn hình như máy thật). Chỉ là hiệu ứng cho thấy "máy đang làm gì" — luật chơi
// (thời gian trôi, pin tụt) vẫn do src/sim/phone.ts quyết định ở acts.phoneFun / phoneCall.
export type PhoneAct = 'radio' | 'music' | 'wap' | 'call' | 'sms';
export interface ActState {
  /** Việc máy đang làm. */
  k: PhoneAct;
  /** Còn chạy bao nhiêu giây thật. */
  t: number;
  /** Tổng thời gian (để thanh tiến trình chạy đúng nhịp). */
  dur: number;
  /** Dòng phụ: tên người được gọi, tên bài, địa chỉ trang… */
  line: string;
  /** Người đang gọi (nếu là cuộc gọi). */
  who: string;
}
const actSlot = () => ctx as unknown as { _pact?: ActState };
/** Việc máy đang làm, hoặc `null`. */
export const phoneAct = (): ActState | null => { const a = actSlot()._pact; return a && a.t > 0 ? a : null; };
/** Cho màn hình máy "chạy" một việc trong `secs` giây thật. */
export function setPhoneAct(k: PhoneAct, secs: number, line = '', who = '') {
  actSlot()._pact = { k, t: secs, dur: secs, line, who };
}
/** Tắt ngay (bấm "Tắt máy" trên màn hình cuộc gọi). */
export function endPhoneAct() { const a = actSlot()._pact; if (a) a.t = 0; }
/** Đếm ngược; trả `true` đúng lúc vừa hết để lớp bảng vẽ lại cho sạch. */
export function tickPhoneAct(dt: number): boolean {
  const a = actSlot()._pact; if (!a || a.t <= 0) return false;
  a.t -= dt;
  if (a.t > 0) return false;
  a.t = 0; return true;
}

// ───────────────────────── Biểu tượng: mỗi mẫu máy một kiểu vẽ ─────────────────────────
const GLYPH: Record<string, string> = {
  ledger: '<path d="M6 4h9l3 3v13H6z"/><path d="M9 9h6M9 12h6M9 15h4"/>',
  contacts: '<rect x="5" y="4" width="14" height="16" rx="2"/><circle cx="12" cy="10" r="2.4"/><path d="M8.6 17c.6-2 5.6-2 6.2 0"/>',
  sms: '<path d="M4 5h16v10H10l-5 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
  radio: '<circle cx="12" cy="13" r="6"/><path d="M12 13l4-3M9 4l9-1"/>',
  music: '<path d="M9 18V6l9-2v12"/><circle cx="7" cy="18" r="2.2"/><circle cx="16" cy="16" r="2.2"/>',
  wap: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c4 5 4 11 0 16M12 4c-4 5-4 11 0 16"/>',
  battery: '<rect x="3" y="7" width="15" height="10" rx="2"/><path d="M20 10v4"/><path d="M6 10h6v4H6z" fill="currentColor" stroke="none"/>',
  wx: '<circle cx="12" cy="12" r="5"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19"/>',
  scam: '<path d="M12 3l8 4v5c0 4.4-3.2 7.7-8 9-4.8-1.3-8-4.6-8-9V7z"/><path d="M12 8v4M12 15.4v.6"/>',
  shop: '<path d="M4 9l1-4h14l1 4M5 9v11h14V9M4 9h16"/><path d="M9.5 20v-5h5v5"/>',
};
const GLYPH_OLD: Record<string, string> = {
  ledger: '<path d="M6 5h11v14H6z"/><path d="M8 9h7M8 12h7M8 15h4"/><path d="M6 3h11"/>',
  contacts: '<circle cx="12" cy="9" r="3"/><path d="M6 19c1-4 11-4 12 0"/>',
  sms: '<path d="M5 6h14v9H11l-4 4v-4H5z"/>',
  radio: '<path d="M4 10h16v9H4z"/><path d="M8 10V7M16 10V7"/><circle cx="12" cy="14" r="2"/>',
  music: '<path d="M10 17V7l7-2v10"/><circle cx="8" cy="17" r="1.8"/>',
  wap: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M5 9h14M5 16h14"/>',
  battery: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 7h4v6h-4z" fill="currentColor" stroke="none"/>',
  shop: '<path d="M5 10h14v10H5z"/><path d="M4 6h16l-1 4H5z"/><path d="M10 20v-5h4v5"/>',
};
export const appGlyph = (id: string, old = false) => `<svg viewBox="0 0 24 24" class="pg">${(old ? GLYPH_OLD : GLYPH)[id] ?? (old ? GLYPH_OLD : GLYPH).battery}</svg>`;

// ───────────────────────── Nội dung từng app ─────────────────────────
function rowsOf(g: Game, m: PhoneDef, app: PhoneApp): { b: string; s: string; act?: string; k?: string; off?: boolean }[] {
  const on = PH.isOn(g);
  const dra = (n: number) => (g.phone ? (n += 0) : n);
  void dra;
  if (app === 'contacts') {
    const list = PH.contacts(g);
    return list.map((c: Contact) => {
      if (c.hot === 'wx') return { b: c.name, s: c.where, act: 'hotwx', k: 'wx', off: !on || g.cash < PH.WX_FEE };
      if (c.hot === 'scam') return { b: c.name, s: c.where, act: 'hotscam', k: 'scam', off: !on || g.cash < 5000 };
      return {
        b: c.name, s: c.where + (c.regular && g.flags['call_' + c.id] === g.day ? ' · hôm nay gọi rồi' : ''),
        act: c.regular ? 'call' : undefined, k: c.id, off: c.regular && (!on || g.cash < PH.CALL_FEE || g.flags['call_' + c.id] === g.day),
      };
    });
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
  if (row.act === 'hotwx') { ctx.acts.phoneWeather(); return true; }
  if (row.act === 'hotscam') { ctx.acts.phoneScam(); return true; }
  if (row.act === 'fun' && row.k) { ctx.acts.phoneFun(row.k as 'radio' | 'music' | 'wap'); return true; }
  if (row.act === 'shopopen' && row.k) { return R.setShopOpen(g, row.k as 'main' | 'branch', !(row.k === 'main' ? g.stall.open : !!g.branch?.open)) === 'ok'; }
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
  if (app === 'shop') {
    return `${dead}<p class="muted">Xem quầy chính và chi nhánh, bật/tắt bán ngay trên máy — không cần chạy ra quầy.</p>
      <div class="plist">${R.shopRows(g).map((r) => `<div class="row"><span class="g"><b>${esc(r.name)} <em class="${r.open ? 'ok' : 'bad'}">${r.open ? 'đang bán' : 'tạm đóng'}</em></b>
        <s>${r.stock} phần · ${r.kinds} món${r.low ? ` · ${r.low} món sắp hết` : ''} · thuê ${money(r.rent)}/ngày</s>
        <s>Hôm nay: ${money(r.revenue)} · ${r.sold} phần · ${r.customers} khách${r.lost ? ` · mất ${r.lost} khách` : ''}</s>
        <s class="hint">${esc(r.hint)}</s></span>
        <button class="btn small${r.open ? '' : ' green'}" data-a="phshop" data-i="0" data-k="${r.id}"${r.canToggle ? '' : ' disabled'}>${r.open ? 'Đóng' : 'Mở'}</button></div>`).join('')}</div>
      ${R.shopStaffWarn(g) ? `<p class="muted warnline">⚠ ${R.shopStaffWarn(g)}</p>` : ''}
      ${R.lossDishes(g).length ? `<h4>Bán lỗ so với giá vốn</h4><div class="plist">${R.lossDishes(g).map((l) => `<div class="row"><span class="g"><b>${RECIPES[l.rid].name}</b><s>đang bán ${money(l.price)} · vốn ${money(l.cost)} — lỗ ${money(l.cost - l.price)}/phần</s></span></div>`).join('')}</div>` : ''}
      ${g.branch ? '' : '<p class="muted">Chưa có chi nhánh nào. Lên Chuỗi cửa hàng (bậc 7) rồi thuê mặt bằng thứ hai.</p>'}`;
  }
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

// ───────────────────────── Vẽ hoạt ảnh lên màn hình máy ─────────────────────────
/** Chữ chạy trên màn hình máy theo từng việc — đổi kênh thì đổi câu. */
const RADIO_LINES = [
  'Đài Sài Gòn 99,9 · bản tin 6 giờ sáng',
  '“Mưa chiều miền Trung” — bolero theo yêu cầu',
  'Quảng cáo: nước tương Hiệp Thành, mua 2 tặng 1',
  'Đài Tiếng nói nhân dân: giá rau sáng nay giảm',
];
const MUSIC_LINES = [
  'Mưa rơi trên phố chiều · 3:42',
  'Thà rằng như thế · 4:05',
  'Chuyện người đàn bà · 3:18',
];
const WAP_PAGES = ['wap.vinaphone.vn/tin-tuc', 'wap.vietbao.vn/the-thao', 'wap.24h.vn/gia-vang'];
let actIdx = 0;
/** Đổi nội dung đang phát (đổi đài / đổi bài / sang trang khác) rồi vẽ lại màn hình. */
export function phoneActNext(): boolean {
  const a = phoneAct(); if (!a) return false;
  actIdx++;
  if (a.k === 'radio') a.line = RADIO_LINES[actIdx % RADIO_LINES.length];
  else if (a.k === 'music') a.line = MUSIC_LINES[actIdx % MUSIC_LINES.length];
  else if (a.k === 'wap') a.line = WAP_PAGES[actIdx % WAP_PAGES.length];
  else return false;
  a.t = a.dur;   // đổi kênh thì máy "chạy" tiếp từ đầu
  return true;
}

/** Lớp hoạt ảnh phủ lên màn hình máy. Rỗng khi máy không làm gì. */
export function actOverlay(g: Game, m: PhoneDef): string {
  const a = phoneAct(); if (!a) return '';
  const mono = m.id === 'cucgach';
  const bar = (label: string) => `<div class="pactbar" title="${esc(label)}"><i style="animation-duration:${a.dur.toFixed(2)}s"></i></div>`;
  if (a.k === 'call') {
    const name = a.who || 'Số lạ';
    return `<div class="pact call${mono ? ' mono' : ''}">
      <div class="pcalltop"><span class="psig"></span><span>${esc(HOT_OR_CALL)}</span></div>
      <div class="pcallmid">
        <div class="pcallav"><i></i><b>${esc(name.slice(0, 2).toUpperCase())}</b></div>
        <div class="pcallwho">${esc(name)}</div>
        <div class="pcallst">Đang gọi<span class="pdots"><i></i><i></i><i></i></span></div>
        <div class="pcallhint">giữ máy sát tai · cước tính theo phút</div>
      </div>
      ${bar('Đang gọi')}
      <div class="pcallbtns"><button class="phang" data-a="phoneactoff">Tắt máy</button></div>
    </div>`;
  }
  if (a.k === 'sms') {
    return `<div class="pact sms${mono ? ' mono' : ''}">
      <div class="psmsfrom">Đang soạn tin cho <b>${esc(a.who || 'khách quen')}</b></div>
      <div class="pbub me">Dạ, mai em mở quầy từ 5 giờ sáng, cô ghé nghen<span class="pdots"><i></i><i></i><i></i></span></div>
      <div class="pkeypad">${'123456789*0#'.split('').map((k) => `<i>${k}</i>`).join('')}</div>
      ${bar('Đang gửi')}
    </div>`;
  }
  if (a.k === 'wap') {
    return `<div class="pact wap${mono ? ' mono' : ''}">
      <div class="purl">${esc(a.line || WAP_PAGES[0])}</div>
      ${bar('Đang tải trang')}
      <div class="pwin"><div class="pwscroll">
        ${['TIN NHANH TRONG NGÀY', 'Giá vàng SJC tăng 40.000đ/chỉ', 'Chợ Xóm Chiều họp từ 4 giờ sáng', 'Xăng A92 tăng 320đ/lít từ 15 giờ', 'Tuyển thợ phụ quán ăn sáng, bao ăn ở', 'Nhạc chuông HOT: Mưa chiều miền Trung', 'Rao vặt: xe đạp cũ 350.000đ, còn tốt', 'Bảng giá rau củ chợ đầu mối Bình Điền', 'Dự báo thời tiết 3 ngày tới', 'Tin giật gân: “trúng thưởng 1900 1234” là lừa'].map((l, i) => `<p class="${i % 4 === 0 ? 'h' : ''}">${esc(l)}</p>`).join('')}
      </div></div>
      <div class="ploading">Đang tải<span class="pdots"><i></i><i></i><i></i></span></div>
    </div>`;
  }
  const isRadio = a.k === 'radio';
  const line = a.line || (isRadio ? RADIO_LINES[0] : MUSIC_LINES[0]);
  return `<div class="pact ${isRadio ? 'radio' : 'music'}${mono ? ' mono' : ''}">
    <div class="pmid">
    <div class="ptuner">
      <div class="pticks">${Array.from({ length: 21 }, (_, i) => `<i class="${i % 5 === 0 ? 't' : ''}"></i>`).join('')}</div>
      <span class="pneedle"></span>
      <span class="pmark l">87,5</span><span class="pmark r">108,0</span>
    </div>
    <div class="pwave">${Array.from({ length: 16 }, (_, i) => `<i style="animation-delay:${(i * 0.09).toFixed(2)}s"></i>`).join('')}</div>
    <div class="pmq"><span class="prun"><i class="pspeaker"></i>${esc(line)}</span></div>
    </div>
    <div class="pactbtns"><button class="pbtn" data-a="phoneactnext">${isRadio ? 'Đổi đài' : 'Bài khác'}</button><button class="pbtn off2" data-a="phoneactoff">Tắt</button></div>
  </div>`;
}
/** Nhãn nhỏ trên màn hình cuộc gọi. */
const HOT_OR_CALL = 'ĐANG GỌI · 1.000₫/phút';

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
  // Hoạt ảnh (sóng radio, trang WAP đang tải, cuộc gọi…) nằm ngay trong màn hình máy, đè lên nội dung app.
  const act = actOverlay(g, m);
  const html = `<div class="phonewrap"><div class="phonebox ${m.id}"><div class="ph ${m.id}${act ? ' busy' : ''}">${inner}${act}</div>${keys}</div>
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

/** Mở hộp thư: màn hình máy chạy cảnh soạn tin trả lời người gửi mới nhất (bàn phím + dấu chấm đang gõ). */
function smsAct(g: Game) {
  if (!PH.isOn(g)) return;
  const list = PH.smsList(g);
  if (list.length) setPhoneAct('sms', 10, '', list[0].from);
}

/** Xử lý phím cứng / icon của từng mẫu máy. Trả `true` nếu cần vẽ lại. */
export function phoneKey(k: 'up' | 'down' | 'ok' | 'home' | 'pick' | 'open', arg?: string | number): boolean {
  const v = phoneView(), g = ctx.g, m = PH.phone(g);
  if (!m) return false;
  const apps = appsOf(m);
  // Về màn hình chính là cúp máy / tắt đài — màn hình trở lại bình thường.
  if (k === 'home') { v.app = 'home'; v.sel = 0; v.sub = ''; endPhoneAct(); return true; }
  if (k === 'open' && typeof arg === 'string') {
    v.app = arg as PhoneApp; v.sel = 0; v.sub = '';
    // Mở hộp thư còn tin chưa đọc: màn hình máy chạy cảnh soạn tin trả lời (bàn phím + dấu chấm đang gõ).
    if (v.app === 'sms') smsAct(g);
    return true;
  }
  if (k === 'pick' && typeof arg === 'number') { v.idx = arg; return true; }
  if (k === 'up' || k === 'down') {
    const step = k === 'up' ? -1 : 1;
    if (v.app === 'home') { v.idx = (v.idx + step + apps.length) % apps.length; return true; }
    const rows = rowsOf(g, m, v.app as PhoneApp);
    if (!rows.length) return true;
    v.sel = (v.sel + step + rows.length) % rows.length; return true;
  }
  if (k === 'ok') {
    if (v.app === 'home') {
      const pick = apps[v.idx]; if (!pick) return false;
      v.app = pick.id; v.sel = 0;
      if (pick.id === 'sms') smsAct(g);
      return true;
    }
    const rows = rowsOf(g, m, v.app as PhoneApp), row = rows[v.sel];
    if (row && !row.off) return runRow(v.app as PhoneApp, row);
    return false;
  }
  return false;
}
/** Bấm nút Mở/Đóng của một điểm bán trong app Quản lý cửa hàng. */
export function phoneToggleShop(id: 'main' | 'branch'): boolean {
  const g = ctx.g, on = id === 'main' ? !!g.stall.open : !!g.branch?.open;
  const r = R.setShopOpen(g, id, !on);
  if (r !== 'ok') { toast(r, 'warn', 'shop'); return false; }
  ctx.sound.play('ui');
  toast(`${id === 'main' ? 'Quầy chính' : 'Chi nhánh'}: ${on ? 'đã tạm đóng' : 'mở bán'} ✓`, 'good', 'shop');
  return true;
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
