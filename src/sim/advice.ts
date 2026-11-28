// LỜI KHUYÊN CỦA ÔNG BẢY — thay sáu câu viết sẵn bằng câu **đọc đúng trạng thái thật của ván**:
// đang đói / hết sức / sắp ngất, túi còn bao nhiêu tiền, giờ nào có việc gì đang mở, đã có quầy chưa,
// món đang bán thiếu nguyên liệu gì, nợ Hùng Sẹo còn mấy ngày, trời sắp mưa hay đã khuya…
//
// Luật ở đây là logic thuần (không DOM, không three) nên test chạy được trong Node. Mọi câu **phải trỏ tới
// một đích đến có thật** trong `data/landmarks.ts`, và nếu đích đó chỉ mở theo giờ thì câu chỉ được nói
// khi nơi đó **đang dùng được**; `tests/hobo.test.ts` canh đúng hai điều đó (giống bài canh tin bịa của
// `news.test.ts`), cộng thêm từng tình huống cụ thể và chuyện không lặp câu.
import { Game, hourOf, countOf } from './state';
import { INGS } from '../data/ingredients';
import { SHOP_LIST } from '../data/shops';
import { RECIPE_LIST } from '../data/recipes';
import { HOUSING } from '../data/gear';
import { WEATHER, hourCurve, EVENTS, EventDef } from '../data/world';
import { LANDMARK_BY_ID, HOME_LANDMARK } from '../data/landmarks';
import { District, spotById } from '../world/layout';
import { money, dist } from '../core/util';
import * as R from './rules';

/** Một lời khuyên: câu nói + nơi cần tới (để bấm một nút là ghim đường đi). */
export interface Advice {
  /** Mã câu — dùng để ghé ba lần liền không nghe lại đúng một câu. */
  id: string;
  /** Lời của Ông Bảy, đọc là hiểu phải làm gì. */
  text: string;
  /** Mã đích đến trong `LANDMARK_LIST` (luôn có thật — test canh). */
  place: string;
  /** Cấp thiết: càng cao càng phải nói trước. */
  urgent: number;
}
/** Thông tin ngoài luật: người chơi đang đứng đâu và các neo trong thành phố (để nói đúng khoảng cách). */
export interface AdviceWhere {
  x?: number; z?: number;
  anchors?: Record<string, { x: number; z: number }>;
}
/** 22.5 → “22h30”. */
const hh = (h: number) => `${Math.floor(h)}h${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

/** Đích đến này có đang dùng được ở giờ hiện tại không (chỗ gộp nhiều sạp: một sạp mở là được). */
/**
 * Những đích CHỈ mở khi một sự kiện đang chạy (lượt 70c). Nếu không có bảng này, câu “trận bóng tối nay ở quán
 * cà phê Bóng Đá” vẫn được nói vào 9 giờ sáng hôm sau — chỉ tới một quán không có trận nào. Hết sự kiện là đích
 * đóng lại như mọi chỗ khác, nên lời khuyên lại chỉ còn những chỗ thật sự dùng được.
 */
const ONLY_IN_EVENT: Record<string, string> = { cafe_bongda: 'bong_da', net_tro: 'tan_su_kien' };
export function destOpen(g: Game, id: string): boolean {
  const l = LANDMARK_BY_ID[id];
  if (!l) return false;
  const need = ONLY_IN_EVENT[id];
  if (need) return R.eventOn(g, need) && R.placeOpenAt(g, id);
  if (l.always) return true;
  if (l.openWith?.some((s) => R.placeOpenAt(g, s))) return true;
  return R.placeOpenAt(g, id);
}
/** Sạp có đích riêng trên bản đồ thì ghim đúng sạp; sạp trong chợ thì ghim Chợ Xóm Chiều. */
export const shopLandmark = (shopId: string) => (LANDMARK_BY_ID[shopId] && !LANDMARK_BY_ID[shopId].openWith ? shopId : 'market');
/** Chỗ bán mua được đồ ăn bất kể giờ (mở khuya): MiniMart 24h, rồi tới tạp hoá. */
const anyShop = (g: Game, ids: string[]) => ids.find((id) => destOpen(g, id)) ?? null;
/** Cách đích đó bao nhiêu mét — chỉ nói khi biết người chơi đang đứng đâu. */
function far(place: string, w?: AdviceWhere): string {
  const a = w?.anchors?.[LANDMARK_BY_ID[place]?.anchor ?? ''];
  if (!a || w?.x === undefined || w?.z === undefined) return '';
  return ` (cách đây ${Math.round(dist(w.x, w.z, a.x, a.z))} m)`;
}
/** Giờ đông người qua lại nhất của một khu — lấy từ chính đường cong lượng người của ván. */
function peakHour(d: District): number {
  let best = 12, bv = -1;
  for (let h = 5; h <= 22; h += 0.5) { const v = hourCurve(h, d); if (v > bv) { bv = v; best = h; } }
  return best;
}
/** Sạp gần nhất đang mở và còn món đó — để câu “mua ở đâu” là đúng chỗ làm được ngay. */
export function shopFor(g: Game, ingId: string, w?: AdviceWhere): { id: string; name: string } | null {
  const cands = SHOP_LIST.filter((s) => s.items.includes(ingId) && R.shopOpen(g, s) && R.shopHas(g, s, ingId));
  if (!cands.length) return null;
  const at = w?.anchors, px = w?.x, pz = w?.z;
  if (at && px !== undefined && pz !== undefined) {
    const d = (s: typeof cands[number]) => { const a = at['v_' + s.id]; return a ? dist(px, pz, a.x, a.z) : 1e9; };
    cands.sort((a, b) => d(a) - d(b));
  }
  const s = cands[0];
  return { id: s.id, name: s.name };
}

// ───────────────────────── Sự kiện đang diễn ra (lượt 70c) ─────────────────────────
/**
 * Ông Bảy nói về **sự kiện đang chạy** — trước bản này ông chỉ nói máu/tiền/quầy/nợ/mưa, còn 22 sự kiện của
 * thành phố thì chỉ radio với WAP biết. Mỗi dòng ở đây trả về: câu nói (đã có tên chỗ thật), chỗ cần tới, và
 * một luật “câu này có dùng được ngay bây giờ không”.
 *
 * Nguyên tắc:
 * - `where` phải là đích **có thật trong `LANDMARK_LIST`**, và điều kiện `ok` phải bảo đảm chỗ đó đang mở —
 *   `tests/hobo.test.ts` chạy cả 22 sự kiện × nhiều giờ và đòi `destOpen` đúng.
 * - Quán đang bán thì câu phải **dùng được cho người đang bán**: “đoàn kiểm tra đang đi từng quầy” chỉ nói khi
 *   quầy đã mở, và ghim đúng chỗ quầy đang đứng (`spot_*`), không phải một chỗ dựa bừa.
 * - Không bịa con số: giá/mức tăng đọc từ chính `EVENTS[id]` (nếu có) hoặc viết đúng như sự kiện mô tả.
 * - **Mức cấp thiết cao hơn các câu thường** (quầy trên vai 60, chưa mở bán 62, thiếu nguyên liệu 55): sự kiện
 *   chỉ kéo dài vài giờ, bỏ qua là mất luôn cơ hội; còn “quầy trên vai” thì lúc nào nhắc cũng được. Nhưng vẫn
 *   phải **thấp hơn** chuyện nguy hiểm tới thân (sắp ngất 100, bão 96, đoàn kiểm tra 84).
 */
interface EventRule {
  /** Mã câu — ép theo mã sự kiện để `rememberAdvice` không lặp. */
  id: string;
  place: string;
  urgent: number;
  text: string;
}
/** Chỗ quầy đang đứng, viết thành đích đến trên bản đồ (dùng cho câu “đang làm ăn thì…”). */
const stallSpot = (g: Game): string | null => (g.stall.where === 'placed' && g.stall.spot ? 'spot_' + g.stall.spot : null);
/** Giờ kết thúc sự kiện còn lại, viết cho người đọc: “còn 2 tiếng nữa”. */
function evLeft(g: Game, id: string): string {
  const a = g.ev.active.find((x) => x.id === id);
  if (!a) return '';
  const h = (a.until - (g.day * 1440 + g.min)) / 60;
  if (h <= 0.5) return ' sắp hết rồi';
  return h >= 1.5 ? ` còn khoảng ${Math.round(h)} tiếng nữa` : ' còn chưa tới một tiếng';
}
/** Sự kiện này có đáng nói với người chơi lúc này không, và nói gì. `null` = đừng nói. */
function eventRule(g: Game, e: EventDef): EventRule | null {
  const s = g.stall, spot = stallSpot(g), selling = s.where === 'placed';
  const left = evLeft(g, e.id);
  const id = 'ev_' + e.id;
  switch (e.id) {
    // ── Nhóm kéo người về một chỗ: nói đúng chỗ đó, kèm thứ khách đang thèm ──
    case 'le_hoi':
      return { id, place: 'spot_cv', urgent: 64, text: `Công viên Hoa Phượng đang mở lễ hội, người ta đổ về nườm nượp${left}. Đem quầy ra Cổng Công Viên đi — món ăn vặt, xiên nướng, nước mát bán chạy gấp rưỡi ngày thường.` };
    case 'hoi_cho':
      return { id, place: 'spot_cho', urgent: 64, text: `Cổng chợ đang có hội chợ ẩm thực${left}. Dân sành ăn kéo tới đông lắm — quầy bán bún, phở, đồ nướng thì ra đó mà đứng.` };
    case 'bong_da':
      return destOpen(g, 'cafe_bongda') ? { id, place: 'cafe_bongda', urgent: 58, text: `Tối nay có trận bóng${left}. Quán cà phê Bóng Đá ở Phố Bến Xe chật kín, ai cũng kêu đồ nướng với nước — ghé đó mà bán, hoặc vô coi ké một trận.` } : null;
    case 'tan_su_kien':
      return { id, place: 'spot_hem', urgent: 62, text: `Khu kho bãi tan ca đêm${left} — công nhân đói bụng đổ ra đường. Cơm, bánh mì, mì gói bán chạy lắm, ra Hẻm Công Nhân mà dọn hàng.` };
    case 'ngay_luong':
      return { id, place: spot ?? 'spot_cho', urgent: 56, text: `Hôm nay công nhân lĩnh lương${left} — ai cũng rủng rỉnh. Đừng hạ giá, khách sẵn sàng trả hơn ngày thường, nhất là món ăn chơi.` };
    // ── Nhóm làm giá nguyên liệu nhảy: nói nên trữ gì, và nói thật là đang đắt ──
    case 'gia_thit':
    case 'gia_rau':
    case 'gia_haisan': {
      const cat = e.id === 'gia_thit' ? 'thịt' : e.id === 'gia_rau' ? 'rau củ' : 'hải sản';
      const mul = e.price ? Math.round((Object.values(e.price)[0] ?? 1) * 100 - 100) : 0;
      return { id, place: 'market', urgent: 50, text: `${cat[0].toUpperCase() + cat.slice(1)} ở chợ đang lên giá${mul ? ` ${mul}%` : ''}${left}. Có tiền thì mua trữ sẵn hôm nay, đừng đợi tới lúc nấu mới chạy ra chợ.` };
    }
    case 'het_hang':
      return { id, place: 'market', urgent: 52, text: `Xe hàng về trễ nên chợ đang thiếu món${left}. Ra sớm coi sạp nào còn thì lấy, không thì ghé vựa đầu mối Tám Lúa mua sỉ cho chắc.` };
    case 'sieu_thi_km':
      return { id, place: 'mart', urgent: 48, text: `MiniMart đang giảm 25% toàn bộ${left}. Đồ khô, nước ngọt, gia vị — mua dằn một ít, rẻ hơn chợ đấy.` };
    case 'cup_dien':
      return { id, place: 'kiosk', urgent: 54, text: `Cúp điện khu trung tâm${left} — MiniMart đóng cửa, tủ lạnh ngừng chạy. Đồ cần lạnh trong quầy lo mà dọn ra, hoặc qua Tạp hoá Cô Ba mua đá.` };
    case 'bao':
      return { id, place: R.has(g, 'aomua') ? 'camp' : 'kiosk', urgent: 102, text: `Bão đổ bộ kìa!${left ? left + '.' : ''} Dọn hàng, tìm chỗ trú ngay — chưa có áo mưa thì tạt vô tạp hoá mua cái rồi về, đừng đứng ngoài đường.` };
    case 'cam_duong':
      return { id, place: 'spot_cho', urgent: 46, text: `Đường trước chợ bị rào lại để sửa cống${left}. Dòng người dạt sang phố khác — quầy ở Cổng Chợ thì vắng, tính dời sang chỗ khác hoặc bán món giao đi.` };
    case 'trom':
      return { id, place: HOME_LANDMARK[g.housing] ?? 'camp', urgent: 72, text: `Đêm nay khu này hay mất trộm${left}. Về nhà ngủ, đừng để tiền với đồ nghề ngoài quầy — mất là mất luôn.` };
    // ── Nhóm “có người đang tìm tới quầy mình”: chỉ nói khi đang bán thật ──
    case 'kiem_tra':
      return selling && s.open ? { id, place: spot!, urgent: 90, text: `Đoàn kiểm tra an toàn thực phẩm đang đi từng quầy${left}. Quầy dơ là bị phạt: lau lại mặt bàn, đậy đồ ăn, đừng để thịt sống gần đồ chín.` } : null;
    case 'phe_binh':
      return selling && s.open ? { id, place: spot!, urgent: 76, text: `Nghe đồn có nhà phê bình ẩm thực đang dạo quanh khu này${left}. Nêm nếm cho tử tế, dọn quầy sạch — được một câu khen là khách tới cả tuần.` } : null;
    case 'khach_vip':
      return selling && s.open ? { id, place: spot!, urgent: 78, text: `Có vị khách sang đang tìm món ngon đường phố${left}. Bật món tủ của mình lên, đừng tiếc — khách loại này trả hơn giá niêm yết.` } : null;
    case 'khach_quay':
      return selling && s.open ? { id, place: spot!, urgent: 80, text: `Có ông khách say đang gây sự quanh đây${left}. Giữ bình tĩnh, đừng đôi co — cùng lắm gọi công an phường, đánh nhau là mình sai trước.` } : null;
    case 'khach_quen_kho':
      return selling && s.open ? { id, place: spot!, urgent: 60, text: `Một người khách quen đang kẹt tiền, muốn ăn chịu${left}. Cho chịu thì được lòng, mà nhớ ghi sổ — trong sổ nợ có mục theo dõi.` } : null;
    case 'bao_ke':
      return { id, place: spot ?? 'spot_hem', urgent: 84, text: `Đàn em Hùng Sẹo đang đi thu “phí bảo kê” trong hẻm${left}. Bán ở đó thì liệu đường: đóng cho yên, hoặc dọn sang chỗ khác — đừng một mình chống lại.` };
    case 'doi_thu':
      return selling ? { id, place: spot!, urgent: 66, text: `Có người mở quầy ngay sát chỗ con bán, giá rẻ hơn hẳn${left}. Đừng đua giá — nêm cho ngon hơn, giữ khách quen, rồi tính chuyện dời sang chỗ đông hơn.` } : null;
    case 'gia_dinh':
      return { id, place: HOME_LANDMARK[g.housing] ?? 'camp', urgent: 36, text: `Mẹ ở quê vừa gửi lên ít tiền kèm lá thư: “Ráng lên con.”${left} — cầm lấy mà trả bớt nợ, đừng tiêu hết một lượt.` };
  }
  return null;
}

/**
 * Toàn bộ lời khuyên **đúng với ván này**, xếp theo mức cấp thiết (cao trước).
 * Không bao giờ rỗng: không có gì gấp thì Ông Bảy nói câu chung.
 */
export function advice(g: Game, w?: AdviceWhere): Advice[] {
  const out: Advice[] = [], h = hourOf(g), st = g.st;
  const add = (id: string, urgent: number, place: string, text: string) => out.push({ id, urgent, place, text: text + far(place, w) });
  const wx = WEATHER[g.weather.now], next = WEATHER[g.weather.next];
  const rainSoon = next.rain >= 0.5 && wx.rain < 0.2;

  // ── 1. Sức khoẻ: sắp ngất thì vô bệnh viện, đói thì kiếm cái ăn ──
  if (st.health < 30) add('health', 100, 'hospital', 'Mặt con xanh lắm rồi. Vô Bệnh viện Phước An khám đi — khám 20.000₫, nằm phòng hồi sức 5.000₫/giờ, chứ ngất ngoài đường là mất đồ đấy.');
  if (st.hunger < 25 || st.energy < 20) {
    const eateryOpen = destOpen(g, 'eatery'), freeRice = h >= 11 && h < 13;
    if (eateryOpen) add('eat', 90, 'eatery', `Bụng con kêu rồi kìa. Ghé Quán cơm Bà Tư ăn dĩa cơm 25.000₫, no tới chiều${freeRice ? ' — hoặc 11–13h ghé chùa Phước An ăn cơm chay miễn phí' : ''}.`);
    else if (freeRice) add('eat', 90, 'temple', 'Giờ này quán cơm chưa mở. Chùa Phước An đang phát cơm chay 11–13h đó, vô ăn một dĩa rồi cảm ơn sư cô.');
    else {
      const shop = anyShop(g, ['mart', 'kiosk']);
      if (shop) add('eat', 88, shop, `Bụng con kêu rồi kìa. ${LANDMARK_BY_ID[shop].name} còn mở, vô mua gói mì hay ổ bánh mì ăn đỡ — đừng để đói quá rồi ngất.`);
      else add('eat', 86, 'temple', 'Đói mà giờ này hàng quán đóng hết rồi. Chùa Phước An mở cửa cả ngày, vô xin miếng nước, ngồi nghỉ đã rồi tính.');
    }
  }
  if (st.hygiene < 22) add('dirty', 45, 'wash_park', 'Người con hôi quá, khách ngửi thấy là quay đi. Ra Nhà tắm công viên tắm một trận, hoặc về phòng tắm vòi sen.');

  // ── 2. Tiền: còn ít thì chỉ đúng việc ĐANG mở ở giờ này ──
  if (g.cash < 30000) {
    if (destOpen(g, 'dock')) add('job', 80, 'dock', `Trong túi còn ${money(g.cash)} thì lo kiếm liền. Bến bốc hàng đang mở (4h30–10h): vác một bao 6.000₫, chục bao là có vốn.`);
    else if (destOpen(g, 'eatery')) add('job', 80, 'eatery', `Trong túi còn ${money(g.cash)}. Quán Bà Tư đang cần người rửa chén — 4.000₫/cái đĩa còn được một bữa cơm, ghé vô xin.`);
    else add('job', 78, 'board', `Trong túi còn ${money(g.cash)}, mà giờ này bến hàng với quán cơm đóng rồi. Ra Bảng việc làm nhận giao hàng, hoặc xin tiền người qua đường cho qua bữa.`);
  }

  // ── 3. Nghề: chưa có quầy thì nhắc tiệm đồ nghề; có quầy mà vắng thì nhắc giờ đông ──
  const s = g.stall;
  if (s.tier === 0 && !R.has(g, 'ganh')) {
    if (destOpen(g, 'equip')) add('noStall', 70, 'equip', 'Muốn bán hàng thì phải có quang gánh trước đã — tiệm Đồ Nghề Ba Tài bán 120.000₫, mở 7–20h. Tay không thì đứng ngoài đường cả ngày cũng chẳng ai mua.');
    else add('noStall', 68, 'camp', 'Tiệm Ba Tài đóng cửa rồi (mở 7–20h). Đêm nay về gầm cầu ngủ, sáng mai ra sớm sắm quang gánh — có gánh mới bán được.');
  } else if (s.tier > 0) {
    const sp = s.spot ? spotById(s.spot) : undefined;
    const district: District = sp?.district ?? 'trungtam';
    const peak = peakHour(district), busiestNow = hourCurve(h, district) >= hourCurve(peak, district) * 0.85;
    if (s.where !== 'placed') add('carry', 60, 'spot_cho', 'Quầy đang trên vai đó. Tới một chỗ bán có vòng sáng vàng rồi đặt xuống — Cổng Chợ đông nhất, kế đó Cổng Công Viên.');
    else if (!s.open) add('closed', 62, 'spot_cho', 'Quầy đặt đó mà chưa mở bán. Chạm vô quầy, bật món và bấm MỞ BÁN — khách chỉ ghé khi thấy đèn với thấy món.');
    else if (!busiestNow) add('peak', 40, 'spot_cho', `Giờ này vắng rồi. Đông khách nhất ở ${sp?.name ?? 'khu này'} là quãng ${hh(peak)} — ngồi giữ quầy tới đó, hoặc đi sơ chế sẵn cho kịp.`);

    // ── 4. Nguyên liệu: món đang bán mà thiếu đồ thì nói thiếu gì, mua ở đâu — đúng sạp đang mở ──
    for (const stuck of R.menuOf(g)) {
      if (R.available(g, stuck)) continue;
      const need = (R.hasPrep(stuck) ? R.prepIngs(stuck) : R.finIngs(stuck))
        .find(([id, per]) => countOf([g.stall.store, g.bag], id) < per - 1e-6);
      if (!need) continue;
      const ing = INGS[need[0]], shop = shopFor(g, need[0], w);
      if (!ing || !shop) continue;
      add('stock', 55, shopLandmark(shop.id), `Món ${stuck.name.toLowerCase()} hết ${ing.name.toLowerCase()} rồi. ${shop.name} đang mở, ghé lấy một ít rồi về nấu tiếp.`);
      break;
    }
  }

  // ── 5. Nợ: Hùng Sẹo tới hạn thì cảnh báo đúng số ngày còn lại (đêm thì nói rõ sáng mới gặp được nó) ──
  const shark = g.debts.find((d) => d.lender === 'shark');
  if (shark) {
    const left = shark.due - g.day;
    if (left <= 2) {
      const openNow = destOpen(g, 'shark'), tail = openNow ? '' : ' Giờ này nó đóng cửa rồi — về ngủ đã, 9 giờ sáng nó mới mở.';
      add('debt', 75, openNow ? 'shark' : 'camp', (left < 0
        ? `Nợ Hùng Sẹo trễ ${-left} ngày rồi! Nó tới siết đồ bây giờ. Lo trả ${money(shark.owed)} đi, đừng để nó đập quầy.`
        : `Còn ${left} ngày là tới hạn nợ Hùng Sẹo — ${money(shark.owed)}. Trễ hai ngày là nó siết đồ, liệu mà xoay.`) + tail);
    }
  }

  // ── 5b. Sự kiện đang diễn ra (lượt 70c): mỗi sự kiện một câu, câu nào cũng chỉ chỗ dùng được ngay ──
  for (const e of R.activeEvents(g)) {
    const r = eventRule(g, e);
    if (!r) continue;
    if (!destOpen(g, r.place)) continue;
    add(r.id, r.urgent, r.place, r.text);
  }

  // ── 6. Trời: sắp mưa thì nhắc áo mưa / bán món nóng; khuya thì nhắc chỗ ngủ ──
  const weatherShop = anyShop(g, ['mart', 'kiosk']);
  if (rainSoon && !R.has(g, 'aomua') && weatherShop) add('rain', 50, weatherShop, `Trời chuyển ${next.name.toLowerCase()} kìa. Chưa có áo mưa thì ghé ${LANDMARK_BY_ID[weatherShop].name} mua cái 20.000₫ — ướt mưa là cảm, mà bếp than cũng tắt ngúm.`);
  else if (destOpen(g, 'spot_cho')) add('rain', 35, 'spot_cho', 'Mưa thì bán đồ nóng mới chạy. Có món gì nước nước như bún, cháo, trà nóng thì bật lên — khách trú mưa là ăn liền.');
  if (h >= 22 || h < 5) {
    const home = HOUSING[g.housing], mine = home.id !== 'gamcau' && home.id !== 'ghe';
    add('night', 42, mine ? HOME_LANDMARK[home.id] ?? 'camp' : 'camp', mine
      ? `Khuya rồi, về ${home.name} ngủ đi. Ngủ ngoài đường ban đêm mất đồ như chơi.`
      : 'Khuya rồi mà còn ngoài đường. Về gầm cầu ngủ đỡ — nhưng coi chừng mất đồ, có tiền thì thuê phòng trọ Bác Năm cho chắc.');
  }

  // ── 7. Câu chung khi không có gì gấp: vẫn phải trỏ chỗ ĐANG mở ──
  if (!out.length) {
    const known = RECIPE_LIST.filter((r) => g.rec[r.id]?.known).length;
    const target = (known > 4 ? ['market', 'equip'] : ['equip', 'market']).find((id) => destOpen(g, id)) ?? 'board';
    if (target === 'market') add('idle', 10, 'market', 'Làm ăn khá rồi đó. Muốn lên tay nghề thì ra Chợ Xóm Chiều lựa đồ tươi, rồi học thêm món từ mấy người bán trong phố.');
    else if (target === 'equip') add('idle', 10, 'equip', 'Nghe tui: sáng ra chợ mua đồ tươi, chiều bán cho khách đi làm về. Ghé tiệm Đồ Nghề Ba Tài trước đã, chưa có đồ nghề thì bán gì cũng hỏng.');
    else add('idle', 10, 'board', 'Chợ với tiệm giờ này đóng cả rồi. Ra Bảng việc làm coi có đơn giao hàng nào không — kiếm đồng ra đồng vô, sáng mai ra chợ sớm.');
  }
  return out.sort((a, b) => b.urgent - a.urgent);
}

/**
 * Câu Ông Bảy sẽ nói lần này: câu cấp thiết nhất **khác câu vừa nói**. Nói hết câu rồi thì quay lại câu gấp nhất.
 * `seen` là các mã câu đã nói, mới nhất ở cuối.
 */
export function pickAdvice(g: Game, seen: string[] = [], w?: AdviceWhere): Advice {
  const all = advice(g, w), last = seen[seen.length - 1];
  return all.find((a) => a.id !== last) ?? all[0];
}
/** Nhớ câu vừa nói (giữ tối đa 3 câu gần nhất — đủ để không lặp, không phình bản lưu). */
export function rememberAdvice(seen: string[], id: string): string[] { return [...seen.slice(-2), id]; }
/** Giờ trong ván viết cho người đọc: “14h30”. */
export const nowText = (g: Game) => hh(hourOf(g));
