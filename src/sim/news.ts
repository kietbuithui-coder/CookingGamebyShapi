// TIN TỨC TRONG GAME — sóng radio và trang WAP chỉ được nói những chuyện **đang thật sự xảy ra trong ván**:
// thời tiết hôm nay, giá rau/thịt/hải sản ở chợ (đúng giá shopPrice đang bán), sự kiện đang diễn ra (lễ hội,
// cúp điện, chợ hết hàng, cấm đường…), nợ tới hạn, tiền phòng, máy hết pin, quầy đang đóng…
// Nhờ vậy nghe đài / lướt web là một cách *thu thập thông tin thật* trong game, không phải câu trang trí.
//
// Chỉ đọc dữ liệu, không sửa gì: mọi thứ dựng lại từ `Game` mỗi lần mở máy.
import { Game, hourOf } from './state';
import { WEATHER } from '../data/world';
import { INGS } from '../data/ingredients';
import { SHOPS, SHOP_LIST } from '../data/shops';
import { HOUSING } from '../data/gear';
import { REGULARS } from '../data/people';
import { money } from '../core/util';
import * as R from './rules';

/** Một tin: tiêu đề ngắn (dòng đậm) + nội dung. `tone` để màn hình máy tô màu. */
export interface News {
  title: string; body: string; tone: 'hot' | 'good' | 'bad' | 'info';
  /** Tin giá: kèm luôn bảng giá để màn hình máy in thành danh sách (không phải tin chữ dài). */
  prices?: PriceLine[];
}
/** Giá một món ở chợ, kèm giá hôm qua để biết đang lên hay xuống. */
export interface PriceLine { id: string; name: string; shop: string; now: number; was: number; unit: string; }

const CAT_LABEL: Record<string, string> = { meat: 'thịt', seafood: 'hải sản', veg: 'rau củ', starch: 'gạo bún', spice: 'gia vị', drink: 'đồ uống', special: 'đồ đặc biệt', other: 'đồ khác' };

/** Ba món chợ đang bán: rẻ nhất, đắt nhất, và một món đang lên giá mạnh nhất — đúng như sạp đang bán hôm nay. */
export function marketPrices(g: Game): PriceLine[] {
  const seen = new Set<string>(); const out: PriceLine[] = [];
  for (const shop of SHOP_LIST.filter((s) => !s.id.startsWith('m_') || s.id === 'm_rau' || s.id === 'm_thit' || s.id === 'm_haisan')) {
    for (const id of shop.items) {
      if (seen.has(id) || !INGS[id] || !R.shopHas(g, shop, id)) continue;
      seen.add(id);
      const now = R.shopPrice(g, shop, id);
      const was = R.shopPrice({ ...g, day: Math.max(0, g.day - 1) } as Game, shop, id);
      out.push({ id, name: INGS[id].name, shop: shop.name, now, was, unit: INGS[id].unit });
    }
  }
  return out;
}

/** Câu "giá đang lên/xuống": chọn món biến động mạnh nhất, nếu giá đứng im thì nói giá đứng. */
export function priceLine(g: Game): PriceLine | null {
  const all = marketPrices(g);
  if (!all.length) return null;
  return all.slice().sort((a, b) => Math.abs(b.now - b.was) - Math.abs(a.now - a.was))[0];
}
/** Một món cụ thể đang bán ở chợ — dùng cho WAP (mỗi lần lướt một món khác). */
export function priceOf(g: Game, id: string): PriceLine | null {
  return marketPrices(g).find((p) => p.id === id) ?? null;
}
/** Vài món rẻ nhất / đắt nhất đang bán, để trang WAP có bảng giá thật. */
export function cheapest(g: Game, n = 3): PriceLine[] { return marketPrices(g).sort((a, b) => a.now - b.now).slice(0, n); }
export function priciest(g: Game, n = 2): PriceLine[] { return marketPrices(g).sort((a, b) => b.now - a.now).slice(0, n); }

/** Toàn bộ tin đang có trong ván — dùng chung cho radio và WAP (mỗi bên chọn cách đọc khác nhau). */
export function news(g: Game): News[] {
  const out: News[] = [];
  const h = hourOf(g), wx = WEATHER[g.weather.now];
  // 1. thời tiết + ngập
  const flood = R.floodPct(g);
  out.push({
    title: `Thời tiết ${h < 11 ? 'sáng' : h < 14 ? 'trưa' : h < 18 ? 'chiều' : 'tối'}: ${wx.name.toLowerCase()}`,
    body: flood > 0.4 ? `Mưa lớn, nước ngập ${Math.round(flood * 100)}% ở khu trũng — đi lại coi chừng.` : `${wx.say}`,
    tone: flood > 0.4 ? 'bad' : 'info',
  });
  // 2. giá chợ thật
  const pl = priceLine(g);
  if (pl) {
    const up = pl.now > pl.was, same = pl.now === pl.was;
    out.push({
      title: `Giá ${pl.name.toLowerCase()} ở ${pl.shop}`,
      body: `${money(pl.now)}/${pl.unit}${same ? ` — đứng giá như hôm qua` : up ? ` — tăng ${money(pl.now - pl.was)} so với hôm qua` : ` — giảm ${money(pl.was - pl.now)} so với hôm qua`}.`,
      tone: same ? 'info' : up ? 'bad' : 'good',
    });
  }
  // 3. sự kiện đang diễn ra (đúng tên và đúng nội dung của bảng sự kiện)
  for (const e of R.activeEvents(g)) out.push({ title: e.name, body: e.text, tone: e.danger ? 'bad' : e.festive ? 'good' : 'hot' });
  // 3b. sạp nào đang xả hàng cuối buổi — đúng giờ và đúng luật shopPrice (giảm 25%)
  for (const shop of SHOP_LIST) {
    if (!shop.lateSale || h < shop.open[1] - 2 || !R.shopOpen(g, shop)) continue;
    const item = shop.items.find((id) => INGS[id] && INGS[id].shelf < 240 && R.shopHas(g, shop, id));
    if (!item) continue;
    const onSale = R.shopPrice(g, shop, item) < R.shopPrice({ ...g, min: Math.max(0, g.min - 120) } as Game, shop, item);
    if (onSale) { out.push({ title: `${shop.name} xả hàng cuối buổi`, body: `${INGS[item].name} giảm còn ${money(R.shopPrice(g, shop, item))}/${INGS[item].unit} — sắp đóng sạp.`, tone: 'good' }); break; }
  }
  // 4. cửa hàng đóng / hết hàng
  for (const shop of SHOP_LIST) {
    if (shop.id.startsWith('m_') && !R.shopOpen(g, shop)) { out.push({ title: `${shop.name} đóng cửa`, body: `Giờ này sạp chưa mở (mở ${Math.floor(shop.open[0])}h–${Math.floor(shop.open[1])}h).`, tone: 'info' }); break; }
  }
  // 5. chợ hết hàng: nói thẳng món gì đang thiếu
  if (g.wd?.outOf?.length) {
    const names = g.wd.outOf.slice(0, 3).map((id) => INGS[id]?.name ?? id).join(', ');
    out.push({ title: 'Chợ đang thiếu hàng', body: `Hôm nay xe hàng về trễ: ${names} — mấy sạp trong chợ tạm hết.`, tone: 'bad' });
  }
  // 5b. bảng giá thật ở chợ: món rẻ nhất và đắt nhất đang bán, đúng giá sạp (không bịa giá)
  const prices = [...cheapest(g, 3), ...priciest(g, 2)];
  if (prices.length) {
    out.push({
      title: 'Giá chợ hôm nay',
      body: prices.map((p) => `${p.name} ${money(p.now)}/${p.unit} ở ${p.shop}`).join(' · ') + '.',
      tone: 'info',
      prices,
    });
  }
  // 6. nợ và tiền phòng của chính người chơi
  for (const d of g.debts) {
    const late = g.day > d.due;
    out.push({ title: late ? 'Nợ quá hạn' : 'Nhắc nợ', body: `Khoản vay ${money(d.owed)} ${late ? `đã trễ ${g.day - d.due} ngày` : `tới hạn ngày ${d.due + 1}`}.`, tone: late ? 'bad' : 'info' });
    break;
  }
  const hs = HOUSING[g.housing];
  if (hs && hs.rent > 0 && g.day >= g.paidUntil) out.push({ title: 'Tiền phòng tới hạn', body: `${hs.name}: ${money(hs.rent)}/${hs.per} — chủ trọ đang chờ.`, tone: 'bad' });
  // 7. chuyện của chính quán
  if (g.stall.tier > 0) {
    if (!g.stall.open) out.push({ title: 'Quán đang đóng', body: 'Quầy của bạn đang tạm đóng — mở bán thì mới có khách.', tone: 'info' });
    else {
      const left = g.stall.ready.reduce((a, r) => a + r.n, 0);
      out.push({ title: 'Quán đang bán', body: `Khay còn ${left} phần sẵn. Hôm nay đã bán ${g.led.sold} phần, thu ${money(g.led.revenue)}.`, tone: left > 0 ? 'good' : 'hot' });
    }
  }
  // 8. máy của chính mình
  if (g.phone) {
    const pin = Math.round(g.phone.battery);
    if (pin < 25) out.push({ title: 'Pin máy yếu', body: `Điện thoại còn ${pin}% — sạc ở nhà hoặc sạc nhờ tạp hoá 5.000₫.`, tone: 'bad' });
  }
  // 9. chuyện trong xóm (đúng người, đúng giờ)
  out.push({ title: 'Chợ Xóm Chiều', body: `Chợ họp từ 4 giờ sáng, đông nhất ${h < 9 ? 'lúc này' : 'khoảng 6–8 giờ'}. Sạp rau Cô Bảy hay xả hàng cuối buổi.`, tone: 'info' });
  // 9b. khách quen: chỉ nói khi ĐÚNG là người đã từng ghé quán (g.rel), và nói đúng giờ/lý do của họ trong dữ liệu
  for (const r of REGULARS) {
    const rel = g.rel[r.id];
    if (!rel || rel.n <= 0) continue;
    const dueH = Math.floor(r.hour), dueM = Math.round((r.hour - dueH) * 60);
    const when = h < r.hour ? `khoảng ${dueH} giờ ${dueM ? dueM + ' ' : ''}` : 'giờ này';
    out.push({ title: `${r.name} quen quán`, body: `Khách quen đã ghé ${rel.n} lần, hay tới ${when}. ${r.note}`, tone: 'info' });
    break;
  }
  // 10. hàng trong quầy của mình có còn tươi không (món dễ hỏng nhất)
  const spoilable = [...g.stall.store, ...g.home].filter((st) => INGS[st.id] && INGS[st.id].shelf < 9000).sort((a, b) => a.fresh - b.fresh)[0];
  if (spoilable) {
    const f = Math.round(spoilable.fresh);
    out.push({ title: `Hàng ${INGS[spoilable.id].name.toLowerCase()} ${f < 35 ? 'sắp hỏng' : 'còn tươi'}`, body: `Trong quầy còn ${spoilable.n} ${INGS[spoilable.id].unit}, tươi ${f}%${f < 35 ? ' — bán gấp kẻo bỏ' : ''}.`, tone: f < 35 ? 'bad' : 'good' });
  }
  // 11. giờ mở cửa của sạp gần nhất (để canh đi chợ)
  const near = SHOP_LIST.find((s) => s.id === 'mart')!;
  out.push({ title: 'Giờ chợ hôm nay', body: `${near.name} mở ${Math.floor(near.open[0])}h–${Math.floor(near.open[1])}h, bán cả thẻ. Đi trễ là hết hàng ngon.`, tone: 'info' });
  const cho = SHOP_LIST.find((s) => s.id === 'm_rau')!;
  out.push({ title: `${cho.name}`, body: `Mở ${Math.floor(cho.open[0])}h–${Math.floor(cho.open[1])}h. ${cho.say}`, tone: 'info' });
  return out;
}

/** Tin cho sóng radio: lấy tin thật rồi đọc thành lời của phát thanh viên. */
export function radioLines(g: Game): string[] {
  const n = news(g);
  const out = n.map((x) => `${x.title}. ${x.body}`);
  return out.length ? out : ['Đài Sài Gòn 99,9 · bản tin buổi sáng'];
}

/** Năm tin cho một trang WAP — mỗi lần lướt lại chọn năm tin khác (xoay vòng theo lượt lướt). */
export function wapNews(g: Game, from = 0, count = 5): News[] {
  const all = news(g);
  if (!all.length) return [];
  const out: News[] = [];
  for (let i = 0; i < Math.min(count, all.length); i++) out.push(all[(from + i) % all.length]);
  // Món nào đã có tin riêng trên trang này thì bảng giá thôi nhắc lại.
  const said = out.filter((n) => !n.prices).map((n) => n.title.toLowerCase()).join(' | ');
  return out.map((n) => {
    if (!n.prices) return n;
    const prices = n.prices.filter((p) => !said.includes(p.name.toLowerCase()));
    return { ...n, prices, body: prices.map((p) => `${p.name} ${money(p.now)}/${p.unit} ở ${p.shop}`).join(' · ') + '.' };
  });
}
