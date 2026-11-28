// HOẠT ĐỘNG của người chơi ngoài việc nấu: mua hàng tận tay, trò chuyện – mặc cả, xin tiền, nhặt ve chai, làm thuê,
// ngủ nghỉ, tắm rửa, thuê chỗ ở, vay mượn. Mọi việc đều diễn ra tại địa điểm thật trong thành phố.
import * as THREE from 'three';
import { ctx, MIN_PER_SEC } from './ctx';
import type { Npc } from './npc';
import { placeOpen } from './npc';
import { who } from './who';
import type { SlotDef } from '../world/build';
import { SHOPS, ShopDef } from '../data/shops';
import { INGS } from '../data/ingredients';
import { GEAR, GEAR_LIST, HOUSING, LENDERS, JUNK, JUNK_LIST, junkAt, TIERS, BRANCH_SITES, DAYS_PER_MONTH } from '../data/gear';
import { RECIPE_LIST, RECIPES, toolsFor } from '../data/recipes';
import { FIXED, LINES, SIDE, ownLine } from '../data/people';
import { FunDef, funHoursText, funOpenAt } from '../data/fun';
import { HAIR_STYLES, HAIR_COLORS, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS, GLASSES, SHAPES, HATS, ColorDef } from '../data/looks';
/** Tên ba dáng người — dùng cho thông báo và bảng chọn ở tiệm may. */
const DÁNG = ['dáng gọn gàng', 'dáng vừa vặn', 'dáng đậm người'];
/** Tên bốn kiểu râu ở ghế Chú Bảy (0 là cạo sạch, xử riêng trong bảng chọn). */
const RÂU = ['', 'râu mép', 'râu cằm', 'râu quai nón'];
import { EXPR } from '../data/expr';
import { Game, STAT_MAX, addStack, hourOf, absMin, Stack, weightOf } from '../sim/state';
import * as R from '../sim/rules';
import * as P from '../sim/police';
import * as PH from '../sim/phone';
import * as XE from '../sim/xeom';
import * as PUI from '../ui/phoneUI';
import * as NEWS from '../sim/news';
import { SONGS } from '../audio/songs';
import * as N from '../sim/net';
import * as RC from '../sim/race';
import { bus, toast, sfx } from '../core/bus';
import { rnd, RNG, clamp, money, dist2, round1k, round500, qty, hhmm } from '../core/util';
import { NAV, groundY, districtAt, DISTRICT, SPOTS, spotById } from '../world/layout';
import { LANDMARK_LIST } from '../data/landmarks';
import { advice, pickAdvice, rememberAdvice } from '../sim/advice';
import * as GANGTALK from './gangTalk';
import * as GANGSIM from '../sim/gang';
import { GANG_TROUBLE as GANGS2 } from '../data/gang';
import { MB, MAT } from '../gfx/mb';
import { ingModel } from '../gfx/props';

export interface CartLine { id: string; n: number; price: number; fresh: number; q: number; }
export interface Opt { t: string; sub?: string; off?: boolean; fn?: () => void; }
export interface Way { x: number; z: number; name: string; }
/** 30 → “30 phút”, 120 → “2 tiếng”. */
const hhmmMin = (m: number) => (m % 60 === 0 ? `${m / 60} tiếng` : `${m} phút`);

const QUESTS = [
  'Kiếm tiền (xin người qua đường, nhặt ve chai bán cho vựa Tư Rác hoặc Bà Chín, vác hàng ở chợ, rửa chén quán Bà Tư) rồi mua GÁNH ở tiệm Đồ Nghề Ba Tài.',
  'Sắm dụng cụ cho món đầu tiên: DAO THỚT để làm bánh tráng trộn, hoặc BẾP THAN + VỈ để nướng khoai (thêm dao thớt là nướng được bắp mỡ hành).',
  'Ra Chợ Xóm Chiều mua nguyên liệu cho món bạn định bán (xem công thức trong Sổ tay).',
  'Gánh hàng tới một CHỖ BÁN HÀNG (vòng sáng màu vàng) rồi đặt xuống.',
  'Chạm vào quầy › Thực đơn: bật món, đặt giá, bấm Sơ chế nếu món cần.',
  'Bấm MỞ BÁN rồi tự tay làm món cho vị khách đầu tiên.',
  'Bán được 10 phần trong một ngày.',
  'Thuê phòng trọ của Bác Năm ở Khu Dân Cư để ngủ ngon và cất đồ an toàn.',
  'Dành dụm 2.400.000₫ để nâng cấp lên XE ĐẨY.',
  'Đạt uy tín 50 và không còn nợ nần.',
  'Bạn đã là tay bán hàng có tiếng của khu phố! Học thêm món mới, mở rộng thực đơn và đón chờ bản cập nhật sau.',
];
/** Mã nhân vật chủ nhà → mã loại chỗ ở (mấy chỗ mới trùng mã nên tự map về chính nó). */
const HOME_OF: Record<string, string> = { motel: 'nhanghi', hotel: 'khachsan', tro: 'tro', canho: 'canho', nharieng: 'nharieng', cuahang: 'cuahang' };
const HOME_BLURB: Record<string, string> = {
  tro: 'Phòng trọ 280.000₫ một tuần, có khoá, có vòi nước, để đồ thoải mái. Tiền nhà đóng trước.',
  nhanghi: 'Phòng đơn 80.000₫ một đêm, có nước nóng, ngủ qua giấc rồi đi.',
  khachsan: 'Kính chào quý khách. Phòng tiêu chuẩn 350.000₫ một đêm, có máy lạnh và tủ mát.',
  canho: 'Căn hộ một phòng 900.000₫ một tuần: bếp riêng, máy lạnh, cửa sổ nhìn phố, để được 80 kg đồ.',
  nharieng: 'Nhà 1.400.000₫ một tuần: sân trước, phòng khách, hai buồng ngủ. Ở đàng hoàng thì giá đó.',
  cuahang: 'Cửa hàng kiêm nhà ở 1.800.000₫ một tuần: mặt tiền bán được, trong là chỗ ở, chứa 140 kg.',
};
/** Chỗ ở coi là "ổn định": có khoá, có địa chỉ — dùng cho vay vốn và bước hướng dẫn. */
const STABLE_HOME = ['tro', 'khachsan', 'canho', 'nharieng', 'cuahang'];
const HOME_TIP: Record<string, string> = {
  tro: 'Phòng số 1, cửa xanh bên trái.', nhanghi: 'Phòng ngay sau quầy lễ tân.', khachsan: 'Phòng 101, cuối sảnh bên trái.',
  canho: 'Căn 102, khoá cửa cẩn thận.', nharieng: 'Cửa gỗ bên phải, sân để xe.', cuahang: 'Buồng trong, đi lối cửa hông.',
};
export class Acts {
  cart: { shop: string; lines: CartLine[]; disc: number; haggled: boolean } | null = null;
  /** Đã nói chuyện ở ngõ “nhận thưởng” chưa — mỗi lần dính lừa chỉ hỏi một lần. */
  private scamTalked = false;
  job: { kind: 'dock'; carrying: boolean } | { kind: 'dishes' } | { kind: 'delivery'; x: number; z: number; name: string; pay: number; until: number } | null = null;
  way: Way | null = null; beacon: THREE.Mesh; ring: THREE.Mesh; /** người đứng chờ nhận hàng ở điểm giao */ private receiver: Npc | null = null; litterMesh: THREE.Mesh | null = null; private glint: THREE.Mesh | null = null; litter: { i: number; x: number; z: number; id: string }[] = []; private litterKey = '';
  private sleepUntil = 0; private sleepQ = 1; private sleepWhere = ''; private qT = 1; sheltered = false; working = 0;
  /** Ba câu Ông Bảy vừa nói (mã câu) — chỉ để trong phiên chơi; số lượng lưu lại trong `g.flags.hoboSeen`. */
  hoboSeen: string[] = [];
  /** Hồi chiêu của đấm và nhảy (giây) + cờ chống ngất liên tục. */
  punchCd = 0; jumpCd = 0; private fainting = false;
  /** Nhịp kiểm tra công an + thời gian game đã trôi để nguôi mức bị để ý. */
  private copT = 2; private coolT = 0;
  constructor() {
    this.beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 30, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd24d, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.beacon.visible = false; ctx.scene.add(this.beacon);
    // vòng sáng dưới chân cột: đứng xa vẫn thấy chỗ cần tới
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.35, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd24d, transparent: true, opacity: 0.5, depthWrite: false, fog: false }));
    this.ring.visible = false; ctx.scene.add(this.ring);
    bus.on('day', () => { this.spawnLitter(); });
  }
  get g(): Game { return ctx.g; }
  D(who: string, npc: Npc | undefined, text: string, opts: Opt[]) { ctx.ui.dialog({ who, npc, text, opts }); }
  quest() { return QUESTS[Math.min(this.g.quest, QUESTS.length - 1)]; }

  // ───────────────────────── Mua hàng tận tay ─────────────────────────
  cartTotal() { const c = this.cart; return c ? round500(c.lines.reduce((a, l) => a + l.n * l.price, 0) * (1 - c.disc)) : 0; }
  cartKg() { return this.cart ? this.cart.lines.reduce((a, l) => a + l.n * INGS[l.id].kg, 0) : 0; }
  /** Sức chứa còn lại khi đi chợ: túi xách + quầy nếu đang mang theo/đặt ngay gần. */
  room(): number {
    const g = this.g, s = g.stall, near = s.where === 'carried' || (s.where === 'placed' && dist2(s.x, s.z, ctx.player.x, ctx.player.z) < 64);
    return R.carryCap(g) - R.bagWeight(g) + (near ? Math.max(0, R.stallRoom(g)) : 0) - this.cartKg();
  }
  take(sl: SlotDef, many = false) {
    const g = this.g, shop = SHOPS[sl.shop], id = shop.items[sl.idx], d = INGS[id];
    if (!R.shopOpen(g, shop)) { toast(`${shop.name} đã đóng cửa (mở ${hhmm(shop.open[0] * 60)}–${hhmm(shop.open[1] * 60)}).`, 'warn'); return; }
    if (!R.shopHas(g, shop, id)) { toast(`Hôm nay ${shop.name} hết ${d.name.toLowerCase()} rồi.`, 'warn', 'box'); return; }
    if (this.cart && this.cart.shop !== shop.id) { toast(`Bạn để lại hàng chưa tính tiền ở ${SHOPS[this.cart.shop].name}.`, 'info'); this.cart = null; }
    let n = (shop.bulk ?? 1) * (many ? 5 : 1); const room = this.room();
    if (d.kg > 0 && n * d.kg > room + 1e-6) n = Math.floor((room + 1e-6) / d.kg);
    if (n < 1) { toast(g.stall.tier ? 'Xách hết nổi rồi! Mang quầy theo hoặc cất bớt đồ.' : 'Xách hết nổi rồi! (Giỏ xách ở tiệm Ba Tài giúp mang thêm 6 kg.)', 'warn', 'bag'); return; }
    this.cart ??= { shop: shop.id, lines: [], disc: 0, haggled: false };
    const ln = this.cart.lines.find((l) => l.id === id);
    if (ln) ln.n += n; else this.cart.lines.push({ id, n, price: R.shopPrice(g, shop, id), fresh: R.shopFresh(g, shop, id), q: shop.q });
    ctx.player.gesture('work', 0.36);
    sfx('pick'); ctx.ui.float(`+${n} ${d.unit} ${d.name}`, { x: sl.x, y: sl.y + 0.25, z: sl.z }, 'info'); bus.emit('ui', 'cart');
  }
  dropCart() { if (this.cart) { this.cart = null; bus.emit('ui', 'cart'); } }
  private pay(tab = false): boolean {
    const g = this.g, c = this.cart!, total = this.cartTotal();
    if (tab) { if (!R.borrow(g, 'tab', total)) return false; } else if (!R.spend(g, total, null)) { toast('Không đủ tiền!', 'bad', 'cash'); return false; }
    const s = g.stall, near = s.where === 'carried' || (s.where === 'placed' && dist2(s.x, s.z, ctx.player.x, ctx.player.z) < 64), k = 1 - c.disc;
    for (const l of c.lines) {
      const d = INGS[l.id], cap = d.kg > 0 ? Math.max(0, Math.floor(((R.carryCap(g) - R.bagWeight(g)) / d.kg) + 1e-6)) : l.n, toBag = near && d.cold && R.stallRoom(g) >= l.n * d.kg ? 0 : Math.min(l.n, cap);
      const st: Stack = { id: l.id, n: toBag, fresh: l.fresh, q: l.q, cost: l.price * k };
      if (toBag > 0) addStack(g.bag, st); if (l.n - toBag > 0) addStack(s.store, { ...st, n: l.n - toBag });
    }
    R.changeRel(g, c.shop, 1.5 + total / 100000, true); sfx('coin'); this.cart = null; bus.emit('ui', 'cart'); bus.emit('save', 'mua hang'); return true;
  }

  // ───────────────────────── Trò chuyện với người bán & nhân vật cố định ─────────────────────────
  /** Nói chuyện với người đứng quầy. Lần đầu: hộp thoại còn ghi theo việc họ làm; nói xong mới biết tên. */
  talk(n: Npc) {
    if (n.madUntil && ctx.time < n.madUntil) { ctx.npcs.say(n, 'Đừng lại gần tao!', 2.2, 4); toast(`${n.name} vẫn còn giận, chưa muốn nói chuyện.`, 'warn', 'angry'); return; }
    ctx.npcs.markMet(n);
    this.talkTo(n);
    if (n.fixedId && R.meet(this.g, n.fixedId)) { toast(`Bạn vừa làm quen với ${n.name}.`, 'info', 'heart'); bus.emit('save', 'lam quen'); }
  }
  private talkTo(n: Npc) {
    // Khách đang lựa hàng trong tiệm: nói chuyện thật với họ (nhờ lấy giùm món trên kệ cao).
    if (n.actor === 'browse') { this.browserTalk(n); return; }
    const id = n.fixedId!, g = this.g, shop = SHOPS[id], bye: Opt = { t: 'Thôi, chào nha.' };
    // Người quen nói giọng của chính họ (mỗi người 2–3 câu riêng, xoay theo ngày) chứ không chỉ câu chung của nghề.
    ctx.npcs.say(n, ownLine(id, n, g.ac, n.id + g.day) ?? shop?.say ?? 'Sao đó?', 1.2);
    if (shop) return this.shopTalk(n, shop);
    // Lượt 69: ba người mới (hai chủ quán nước mía, cai công trình) vừa có câu chuyện riêng trong `SIDE`
    // vừa có thực đơn của chỗ họ bán — `sideMenu` đã gắn `sideOpts` (thực đơn) vào cùng hộp thoại.
    if (SIDE[id]) return this.sideMenu(n, id);
    switch (id) {
      case 'equip': {
        const rc = R.repairCost(g), opts: Opt[] = [];
        if (g.stall.tier > 0 && g.stall.cond < 96) opts.push({ t: `Sửa quầy — ${money(rc)}`, sub: `Tình trạng hiện tại ${Math.round(g.stall.cond)}%`, off: g.cash < rc, fn: () => { R.spend(g, rc, 'gear'); g.stall.cond = 100; sfx('fix'); toast('Quầy đã được sửa như mới.', 'good', 'tool'); } });
        opts.push({ t: 'Nâng cấp quán & mặt bằng', fn: () => {
          const tiers = GEAR_LIST.filter((x) => x.kind === 'stall');
          this.D(who(n), n, 'Từ cặp gánh tới nhà hàng bình dân, muốn lên đời cỡ nào chú cũng có mối lo giấy tờ mặt bằng cho.', [
            ...tiers.map((x) => ({
              t: R.has(g, x.id) ? `${x.name} (đã có)` : `${x.name} — ${money(x.price)}`,
              sub: x.desc,
              off: R.has(g, x.id),
              fn: () => this.buyGear(x.id),
            })),
            bye,
          ]);
        } });
        opts.push({ t: 'Đồ tiện lợi cho quầy & quán nhỏ', fn: () => {
          const items = GEAR_LIST.filter((x) => (x.minTier ?? 0) >= 1 && (x.minTier ?? 0) <= 4);
          this.D(who(n), n, 'Mấy món gọn nhẹ này gắn lên gánh, xe đẩy hay quán nhỏ đều đắt khách hơn hẳn.', [
            ...items.map((x) => ({
              t: R.has(g, x.id) ? `${x.name} (đã có)` : `${x.name} — ${money(x.price)}`,
              sub: `${x.desc}${x.minTier && g.stall.tier < x.minTier ? ` · cần ${TIERS[x.minTier].name}` : ''}`,
              off: R.has(g, x.id) || (!!x.minTier && g.stall.tier < x.minTier),
              fn: () => this.buyGear(x.id),
            })),
            bye,
          ]);
        } });
        opts.push({ t: 'Thiết bị công nghiệp & tiện nghi nhà hàng', fn: () => {
          const items = GEAR_LIST.filter((x) => (x.minTier ?? 0) >= 5);
          this.D(who(n), n, 'Lên quán lớn hay nhà hàng bình dân rồi thì sắm dàn bếp công nghiệp với máy lạnh, bồn rửa tay cho bài bản.', [
            ...items.map((x) => ({
              t: R.has(g, x.id) ? `${x.name} (đã có)` : `${x.name} — ${money(x.price)}`,
              sub: `${x.desc}${x.minTier && g.stall.tier < x.minTier ? ` · cần ${TIERS[x.minTier].name}` : ''}`,
              off: R.has(g, x.id) || (!!x.minTier && g.stall.tier < x.minTier),
              fn: () => this.buyGear(x.id),
            })),
            bye,
          ]);
        } });
        opts.push({ t: 'Nói chuyện mở CHI NHÁNH (chuỗi cửa hàng)', sub: 'Cần đã có Nhà hàng bình dân; chi nhánh là điểm bán thứ hai do người trông coi tự bán', off: g.stall.tier < 6 && !R.has(g, 'chuoi'), fn: () => this.branchTalk(n) });
        opts.push({ t: 'Bán lại đồ nghề cũ', off: !Object.keys(g.gear).length, fn: () => this.sellGearMenu(n) });
        opts.push({ t: 'Nên mua gì trước hả chú?', fn: () => this.D(who(n), n, 'Mới vô nghề thì cặp GÁNH trước đã. Rồi DAO THỚT là làm được bánh tráng trộn. Có BẾP THAN với VỈ thì nướng khoai, nướng bắp. Muốn pha trà đá thì thêm cái NỒI. Cứ đi quanh tiệm, thấy món nào thì chạm vô coi giá.', [bye]) });
        this.D(who(n), n, 'Tiệm Ba Tài, xe đẩy bếp núc gì cũng có! Hàng bày quanh đó, ưng món nào cứ chạm vô.', [...opts, bye]); break;
      }
      case 'net': this.netMenu(n); break;
      case 'dua': case 'dua_mai': case 'dua_thao': this.raceMenu(n); break;
      case 'hospital': this.hospitalMenu(n); break;
      case 'police': this.policeMenu(n); break;
      case 'bank': this.bankMenu(n); break;
      // Hùng Sẹo kiêm đại ca băng Hẻm Công Nhân (lượt 71): vay nóng vẫn như cũ, thêm mục băng đảng.
      case 'shark': this.sharkMenu(n); break;
      case 'ba_nam': GANGTALK.gangMenu(this as unknown as GANGTALK.TalkHost, 'cho', n); break;
      case 'motel': case 'hotel': case 'tro': case 'canho': case 'nharieng': case 'cuahang': {
        const hid = HOME_OF[id] ?? id, h = HOUSING[hid], mine = g.housing === hid, owned = !!g.flags['owned_' + hid], due = !owned && mine && g.day >= g.paidUntil, need = R.rentNeed(hid), opts: Opt[] = [];
        if (!mine && need > 0 && !R.canRent(g, hid)) opts.push({ t: `Cần uy tín ${need} mới cho thuê / bán`, sub: `Uy tín của bạn hiện là ${Math.round(g.rep)} — bán hàng đều tay rồi hãy quay lại.`, off: true });
        else if (!mine && owned) opts.push({ t: 'Dọn về lại nhà đã mua (miễn phí)', sub: h.desc, fn: () => { this.moveOut(); R.payHousing(g, hid); sfx('coin'); toast(`Đã dọn về ${h.name} của bạn.`, 'good', 'home', true); ctx.stall.refresh(); } });
        else if (!mine) {
          opts.push({ t: `Thuê — ${money(h.rent)}/${h.per}`, sub: h.desc, off: g.cash < h.rent, fn: () => { this.moveOut(); if (R.payHousing(g, hid, 'tuần')) { sfx('coin'); toast(`Đã thuê ${h.name}. ${HOME_TIP[hid] ?? ''}`, 'good', 'home', true); ctx.stall.refresh(); } } });
          // Lượt 69 — THUÊ THEO THÁNG: chỉ chỗ thuê tuần mới có gói tháng, và giá tháng đã chiết khấu
          // 20 % so với 4 tuần lẻ (`HOUSING[id].month`, xem `gear.monthRent`). Câu chữ tự tính phần tiết kiệm.
          if (R.hasMonthPlan(hid)) opts.push({
            t: `Thuê theo tháng — ${money(h.month!)}/tháng`,
            sub: `Ở trọn ${DAYS_PER_MONTH} ngày, rẻ hơn đóng 4 tuần lẻ ${money(h.rent * 4 - h.month!)} (~20 %)`,
            off: g.cash < h.month!,
            fn: () => { this.moveOut(); if (R.payHousing(g, hid, 'tháng')) { sfx('coin'); toast(`Đã thuê ${h.name} theo tháng: ở tới hết ngày ${g.paidUntil}, tiết kiệm ${money(h.rent * 4 - h.month!)}.`, 'good', 'home', true); ctx.stall.refresh(); } },
          });
          if (h.buy) opts.push({ t: `Mua đứt vĩnh viễn — ${money(h.buy)}`, sub: 'Sở hữu trọn đời, không bao giờ phải đóng tiền thuê hàng tuần nữa', off: g.cash < h.buy, fn: () => { this.moveOut(); if (R.buyHousing(g, hid)) { sfx('buy'); toast(`Chúc mừng! Bạn đã mua đứt ${h.name} làm nhà riêng vĩnh viễn!`, 'good', 'home', true); ctx.stall.refresh(); } } });
        } else {
          // Đóng tiếp đúng gói đang thuê: tới hạn thì luôn có nút; đang ở gói tuần thì mời luôn đóng tháng
          // (đổi gói được bất cứ lúc nào — đóng sớm thì ngày còn lại vẫn giữ nguyên, `R.renewHousing` cộng dồn).
          const plan = R.rentPlanOf(g, hid), fee = R.nextRent(g, hid);
          if (!owned && (due || h.per === 'đêm')) opts.push({ t: `Đóng tiền ${plan === 'tháng' ? 'tháng' : h.per} tiếp — ${money(fee)}`, off: g.cash < fee, fn: () => { if (R.renewHousing(g, plan === 'tháng' ? 'tháng' : 'tuần')) { sfx('coin'); toast(`Đã đóng tiền, ở được tới hết ngày ${g.paidUntil}.`, 'good', 'home'); } } });
          if (!owned && R.hasMonthPlan(hid) && plan === 'tuần' && !due) opts.push({
            t: `Đổi sang gói tháng — ${money(h.month!)}`,
            sub: `Đóng thêm trọn ${DAYS_PER_MONTH} ngày tính từ hôm nay · tiết kiệm ${money(h.rent * 4 - h.month!)} so với 4 tuần`,
            off: g.cash < h.month!,
            fn: () => { if (R.renewHousing(g, 'tháng')) { sfx('coin'); toast(`Đã đổi sang gói tháng, ở tới hết ngày ${g.paidUntil}.`, 'good', 'home', true); } },
          });
          if (!owned && h.buy) opts.push({ t: `Mua đứt căn này — ${money(h.buy)}`, sub: 'Trả một lần, sở hữu vĩnh viễn không tốn tiền thuê', off: g.cash < h.buy, fn: () => { if (R.buyHousing(g, hid)) { sfx('buy'); toast(`Chúc mừng! Bạn đã mua đứt ${h.name} làm tài sản riêng!`, 'good', 'home', true); } } });
        }
        if (mine) opts.push({ t: owned ? 'Tạm dọn đi chỗ khác' : 'Trả phòng', sub: 'Đồ đang cất trong phòng sẽ được dọn theo (phần xách nổi)', fn: () => { this.moveOut(); g.housing = 'gamcau'; g.paidUntil = 9999; toast(owned ? 'Đã dọn ra tạm ngoài phố (nhà đã mua vẫn giữ nguyên chủ quyền).' : 'Đã trả phòng. Về lại gầm cầu.', 'info', 'home'); ctx.stall.refresh(); } });
        this.D(who(n), n, owned ? (mine ? `Nhà này của ${g.ac} rồi, cứ ở thoải mái nhé!` : `Căn ${h.name} này thuộc sở hữu của ${g.ac}, lúc nào muốn dọn về ở lại cứ nói.`) : mine ? (due ? `Tới hạn đóng ${money(R.nextRent(g, hid))} (gói ${R.rentPlanOf(g, hid)}) rồi đó nghen.` : `Ở có thoải mái không? ${R.rentPlanOf(g, hid) === 'tháng' ? 'Đang thuê gói tháng, ' : ''}Đã đóng tới hết ngày ${g.paidUntil}.`) : !R.canRent(g, hid) ? `${h.name} thì phải quen biết mới nói chuyện thuê mua được. Uy tín ${need} trở lên hãy ghé lại.` : HOME_BLURB[hid] ?? `${h.name} ${money(h.rent)}/${h.per}.`, [...opts, bye]); break;
      }
      case 'eatery': {
        const h = hourOf(g), wash = (h >= 10 && h < 14.5) || (h >= 17.5 && h < 21), opts: Opt[] = [
          { t: 'Ăn dĩa cơm bình dân — 25.000₫', off: g.cash < 25000, fn: () => { R.spend(g, 25000, 'food'); R.consume(g, { h: 60 * 2.5, t: 12 * 2.5, m: 6 }); sfx('eat'); R.advance(g, 15, this.act()); toast('Một dĩa cơm thịt kho nóng hổi. No căng bụng, no tới chiều!', 'good', 'dish'); } },
          { t: 'Xin rửa chén thuê', sub: wash ? (g.wd.plates >= 2 ? 'Hôm nay rửa đủ rồi' : 'Được 4.000₫ mỗi cái đĩa + một bữa cơm') : 'Chỉ cần người lúc 10–14h30 và 17h30–21h', off: !wash || g.wd.plates >= 2, fn: () => { this.job = { kind: 'dishes' }; this.setWay('sink', 'Bồn rửa chén'); this.D(who(n), n, 'Ừ, vô bếp phía sau đi con. Chồng đĩa dơ ở cạnh bồn rửa đó. Rửa cho sạch nghen!', [{ t: 'Dạ, con làm liền.' }]); } },
          ...this.learnOpts('eatery', n)];
        this.D(who(n), n, 'Quán cơm Bà Tư đây. Ăn gì con? Hay kiếm việc?', [...opts, bye]); break;
      }
      case 'scrap': case 'scrap2': case 'pawn': {
        const list = JUNK_LIST.filter((j) => junkAt(id, j) && (g.junk[j.id] ?? 0) > 0), sum = list.reduce((a, j) => a + j.price * g.junk[j.id], 0);
        this.D(who(n), n, id === 'scrap' || id === 'scrap2' ? (list.length ? 'Để coi… ' + list.map((j) => `${g.junk[j.id]} ${j.name.toLowerCase()}`).join(', ') + `. Tui lấy hết ${money(sum)}.` : (id === 'scrap2' ? 'Ve chai, lon, giấy, sắt hả con? Đem lại đây bà cân cho. Bên này khu dân cư, lượm được nhiều lắm.' : 'Có ve chai, lon, giấy vụn, sắt thì đem lại đây tui cân. Lượm quanh công viên với mấy thùng rác á.'))
          : (list.length ? 'Đồ lượm được hả? ' + list.map((j) => `${j.name} ${money(j.price)}`).join(', ') + `. Tổng ${money(sum)}, bán không?` : 'Có gì đáng giá thì mang tới. Đồng hồ cũ, radio, nhẫn… tui mua hết.'),
          [{ t: `Bán hết — ${money(sum)}`, off: !list.length, fn: () => { const v = R.sellJunk(g, id); sfx('coin'); toast(`Bán được ${money(v)}.`, 'good', 'cash'); } }, bye]); break;
      }
      case 'dock': {
        const on = this.job?.kind === 'dock';
        const left = R.sacksLeft(g), cargoLeft = R.dockShiftsLeft(g);
        this.D(who(n), n,
          on ? `Vác được ${g.wd.sacks}/${R.DOCK_SACKS_DAY} bao rồi. Còn sức thì làm tiếp!`
            : left <= 0 ? `Hôm nay em vác đủ ${R.DOCK_SACKS_DAY} bao rồi, hết hàng. Mai ra sớm nha.`
              : `Cần người vác bao từ xe tải vô sạp gạo Bà Hai. ${money(R.DOCK_SACK_PAY)} một bao, hôm nay còn ${left} bao. Làm không?`,
          [on ? { t: 'Em nghỉ, cảm ơn anh.', fn: () => { this.job = null; ctx.player.setCarry(''); this.way = null; } }
            : { t: 'Dạ làm!', sub: `Còn ${left} bao hôm nay`, off: left <= 0, fn: () => { this.job = { kind: 'dock', carrying: false }; this.setWay('dock', 'Xe tải — lấy bao hàng'); toast('Ra đuôi xe tải lấy bao hàng, vác tới sạp gạo Bà Hai.', 'info', 'box', true); } },
            { t: 'Có ca bốc cá không anh? — 110 phút', sub: cargoLeft > 0 ? `${money(R.DOCK_WAGE_MIN)}–${money(R.DOCK_WAGE_MAX)} · còn ${cargoLeft}/${R.DOCK_SHIFTS_DAY} ca hôm nay · 4h30–10h` : `Hôm nay anh nhận đủ ${R.DOCK_SHIFTS_DAY} ca rồi`,
              off: this.g.st.energy < 35 || hourOf(this.g) < 4.5 || hourOf(this.g) >= 10 || cargoLeft <= 0, fn: () => this.dockShift() }, bye]); break;
      }
      case 'hobo': {
        // Lượt 52: không còn sáu câu cứng. Ông Bảy nói câu **đúng trạng thái thật của ván** (sim/advice.ts):
        // đang đói / sắp ngất / túi còn bao nhiêu, việc nào đang mở ở giờ này, quầy chưa mở, món thiếu nguyên
        // liệu gì và mua ở sạp nào, nợ Hùng Sẹo còn mấy ngày, trời sắp mưa, đã khuya. Câu nào cũng bấm một nút
        // là ghim đường đi tới đúng chỗ. Ghé liền ba lần thì câu không lặp (nhớ 3 câu gần nhất trong g.flags).
        const first = !g.flags.hobo; g.flags.hobo = 1;
        const seen = (g.flags.hoboSeen ?? 0) > 0 ? this.hoboSeen : [];
        const w = advice(g, { x: ctx.player.x, z: ctx.player.z, anchors: ctx.world.anchors });
        const main = pickAdvice(g, seen, { x: ctx.player.x, z: ctx.player.z, anchors: ctx.world.anchors });
        this.hoboSeen = rememberAdvice(seen, main.id);
        g.flags.hoboSeen = 1 + this.hoboSeen.length;
        const opts: Opt[] = [
          { t: `Chỉ con đường tới ${LANDMARK_LIST.find((l) => l.id === main.place)?.name ?? 'đó'}`, sub: 'Ghim đường đi — đi theo mũi tên và cột sáng vàng', fn: () => this.goPlace(main.place) },
        ];
        // Những câu khác đang đúng (khác câu vừa nói, tối đa 2 câu) để người chơi chọn việc khác nếu muốn.
        for (const a of w.filter((x) => x.id !== main.id).slice(0, 2)) {
          const lm = LANDMARK_LIST.find((l) => l.id === a.place);
          opts.push({ t: `Hỏi chuyện khác — ${lm?.name ?? 'chỗ khác'}`, sub: a.text.slice(0, 96) + (a.text.length > 96 ? '…' : ''), fn: () => {
            this.hoboSeen = rememberAdvice(this.hoboSeen, a.id); g.flags.hoboSeen = 1 + this.hoboSeen.length;
            this.D(who(n), n, a.text, [{ t: `Ghim đường tới ${lm?.name ?? 'đó'}`, fn: () => this.goPlace(a.place) }, bye]);
          } });
        }
        this.D(who(n), n, (first ? 'Lính mới hả? Tui là Bảy, "trưởng khu" gầm cầu này hai chục năm rồi. Nè, cầm ổ bánh mì ăn đỡ đi. ' : 'Sao, bữa nay tính làm gì? ') + main.text, [...opts, bye]);
        if (first) { addStack(g.bag, { id: 'banhmi', n: 1, fresh: 80, q: 0.8, cost: 0 }); toast('Ông Bảy cho bạn một ổ bánh mì.', 'good', 'heart'); } break;
      }
      // Chú Ba xe ôm: đứng dưới gầm cầu, có xe thật, chở người chơi tới đích theo bảng giá quãng đường.
      case 'chu_ba': this.xeomMenu(n); break;
      default: this.D(who(n), n, '…', [bye]);
    }
  }
  /**
   * Học nghề: KHÔNG bao giờ liệt kê công thức ra một danh sách. Chỉ khi đã trò chuyện đủ nhiều với người này
   * (ghé 3 ngày khác nhau, hoặc đã thân) họ mới chỉ MỘT món mỗi lần — món rẻ nhất mà họ biết và người chơi chưa có.
   * Tay nghề chưa đủ cấp thì họ chỉ hứa để đó.
   */
  private learnOpts(from: string, n: Npc): Opt[] {
    const g = this.g, h = hourOf(g);
    const pool = RECIPE_LIST.filter((r) => r.learn?.from === from && !g.rec[r.id].known).sort((a, b) => a.ref - b.ref);
    const r = pool[0]; if (!r) return [];
    const rel = g.rel[from] ?? { v: 0, n: 0, last: -1 }, trust = rel.n >= 3 || rel.v >= 25, lvl = R.level(g), need = r.learn!.skill;
    if (!trust) return [{ t: 'Hỏi thăm chuyện nghề', sub: 'Chưa thân, người ta chưa chỉ bí quyết', fn: () => {
      R.changeRel(g, from, 1, true);
      this.D(who(n), n, rnd.pick(['Nghề này làm lâu mới quen tay con. Cứ ghé chơi hoài rồi tui chỉ cho.', 'Mỗi nhà mỗi bí quyết, đâu có dễ chỉ người dưng. Qua lại vài bữa coi sao đã.', 'Con siêng quá hén. Từ từ rồi tui mách nước cho nghề này.']), [{ t: 'Dạ, con ghé hoài.' }]);
    } }];
    if (lvl < need) return [{ t: 'Hỏi xin chỉ nghề', sub: `Người ta chỉ khi tay nghề con lên cấp ${need} (đang cấp ${lvl})`, fn: () => {
      this.D(who(n), n, rnd.pick(['Tay nghề con còn non, chỉ giờ phí công. Nấu nhiều lên đã.', 'Món này khó lắm, con chưa đủ tay nghề đâu. Cứ luyện thêm.', 'Để già tay đi rồi tui chỉ. Giờ chỉ cũng hỏng món.']), [{ t: 'Dạ, con sẽ luyện thêm.' }]);
    } }];
    return [{ t: 'Hỏi xin chỉ một món', sub: `Người ta chỉ một món mỗi lần · học phí tính sau`, off: g.cash < r.learn!.cost, fn: () => {
      const r2 = r;
      this.D(who(n), n, `Thấy con chịu khó, tui chỉ cho món ${r2.name.toLowerCase()}. Học phí ${money(r2.learn!.cost)}. Học không?`, [
        { t: `Học — ${money(r2.learn!.cost)}`, off: g.cash < r2.learn!.cost, fn: () => {
          if (!R.spend(g, r2.learn!.cost, 'other')) return;
          g.rec[r2.id].known = true; sfx('learn'); R.changeRel(g, from, 5, true);
          toast(`Đã học được món ${r2.name}! Công thức nằm trong Sổ tay.`, 'good', 'star', true);
          ctx.npcs.say(n, 'Nhớ kỹ nghen, bí quyết nhà nghề đó!', 3, 1); bus.emit('save', 'hoc mon');
        } },
        { t: 'Để bữa khác.' },
      ]);
    } }];
  }
  private shopTalk(n: Npc, shop: ShopDef) {
    const g = this.g, c = this.cart && this.cart.shop === shop.id ? this.cart : null, total = this.cartTotal(), opts: Opt[] = [], bye: Opt = { t: 'Thôi, chào nha.' };
    if (c) {
      const list = c.lines.map((l) => `${qty(l.n)} ${INGS[l.id].unit} ${INGS[l.id].name.toLowerCase()}`).join(', ');
      opts.push({ t: `Trả tiền — ${money(total)}`, off: g.cash < total, sub: g.cash < total ? `Bạn chỉ có ${money(g.cash)}` : undefined, fn: () => { if (this.pay()) ctx.npcs.say(n, rnd.pick(['Cảm ơn nha, mai ghé nữa!', 'Rồi, của con đây.', 'Buôn may bán đắt nghen!']), 2.5, 1); } });
      if (shop.haggle > 0 && !c.haggled) for (const ask of [0.1, 0.2]) opts.push({ t: `Mặc cả: xin bớt ${ask * 100}%`, sub: ask > 0.15 ? 'Khó hơn, dễ làm người bán phật ý' : 'Mua nhiều, khách quen thì dễ được bớt', fn: () => { const r = R.haggle(g, shop, ask, total); c.haggled = true; if (r.ok) { c.disc = ask; sfx('good'); } else sfx('nope'); ctx.npcs.say(n, r.line, 3, r.ok ? 1 : 3); setTimeout(() => this.shopTalk(n, shop), 900); } });
      if (shop.id === 'kiosk') { const lim = R.loanLimit(g, 'tab'); opts.push({ t: `Ghi sổ nợ — ${money(total)}`, sub: `Cô Ba cho thiếu tối đa 100.000₫, trả trong 3 ngày (còn thiếu được ${money(lim)})`, off: total > lim, fn: () => { if (this.pay(true)) ctx.npcs.say(n, 'Ừ, cô ghi sổ. Ba bữa nữa nhớ trả nghen con.', 3); } }); }
      opts.push({ t: 'Trả lại hàng', fn: () => this.dropCart() });
      this.D(who(n), n, `${list}. ${c.disc ? `Bớt rồi còn ${money(total)}.` : `Hết thảy ${money(total)}.`}`, [...opts, bye]); return;
    }
    if (shop.id === 'kiosk') { const d = g.debts.find((x) => x.lender === 'tab'); if (d) opts.push({ t: `Trả sổ nợ — ${money(d.owed)}`, off: g.cash < d.owed, fn: () => { R.repay(g, d.id, d.owed); sfx('coin'); ctx.npcs.say(n, 'Sòng phẳng vậy cô quý!', 2.5, 1); } }); }
    if (PH.canChargeAt(shop.id) && PH.hasPhone(g) && PH.battery(g) < 99) opts.push({ t: `Sạc nhờ điện thoại — ${money(PH.CHARGE_FEE)}`, sub: `Pin đang ${Math.round(PH.battery(g))}% · ngồi chờ 20 phút`, off: g.cash < PH.CHARGE_FEE, fn: () => this.phoneCharge(shop.id) });
    opts.push(...this.learnOpts(shop.id, n));
    // Thuốc đau bụng: mua ngay tại quầy nhà thuốc, uống là khỏi (lượt 41).
    if (shop.id === 'pharmacy') {
      const stom = R.stomachLeft(g), med = R.MEDS.daubung;
      opts.push({ t: `Mua ${med.name.toLowerCase()} — ${money(med.price)}`, sub: stom > 0 ? `Đang đau bụng (còn ~${Math.ceil(stom)} phút) — uống là dịu ngay` : 'Mua sẵn để dành, lỡ ăn uống bậy còn có thuốc', off: g.cash < med.price,
        fn: () => { if (!R.buyMed(g, 'daubung')) { toast('Không đủ tiền mua thuốc.', 'bad', 'cash'); return; } sfx('coin'); toast(`Mua ${med.name.toLowerCase()}, uống liền tại chỗ.`, 'good', 'heart'); this.shopTalk(n, shop); } });
    }
    if (shop.id === 'pharmacy') opts.push({ t: 'Cho em hỏi về sức khoẻ', fn: () => this.D(who(n), n, R.isStomach(g) ? 'Bụng em sôi ục ục hả? Ăn uống bậy bạ rồi. Lấy liều thuốc đau bụng trên quầy, uống là dịu liền.' : g.flags.sick ? 'Em bị cảm rồi đó. Lấy vỉ thuốc cảm trên quầy, uống xong nghỉ ngơi, đừng dầm mưa nữa.' : g.st.health < 50 ? 'Trông em xanh xao lắm. Ăn uống đủ bữa, ngủ đủ giấc là khoẻ lại thôi.' : 'Em khoẻ mạnh bình thường. Nhớ uống đủ nước nha.', [bye]) });
    opts.push({ t: 'Dạo này buôn bán sao?', fn: () => {
      const ev = R.activeEvents(g).filter((e) => e.price || e.outOf || e.shop);
      this.D(who(n), n, ev.length ? ev[0].text : shop.lateSale && hourOf(g) >= shop.open[1] - 2 ? 'Cuối buổi rồi, đồ tươi cô bán rẻ cho hết hàng. Lựa lẹ đi con!' : rnd.pick(['Sáng sớm hàng mới về là tươi nhất đó. Chiều thì rẻ mà hết ngon.', 'Mua quen cô bớt cho. Cứ ghé hoài là thành mối.', 'Ra đường thấy trời chuyển mưa thì bán đồ nóng, đắt như tôm tươi.', 'Vựa đầu mối Tám Lúa bên Khu Kho Bãi bán sỉ rẻ lắm, mà phải đi từ 3 giờ sáng.']), [bye]);
    } });
    this.D(who(n), n, `${shop.say} ${shop.id === 'mart' || shop.id === 'pharmacy' ? 'Anh chị cứ lấy hàng trên kệ rồi ra quầy tính tiền ạ.' : 'Lựa gì cứ bốc bỏ giỏ, xong đưa đây tính tiền.'}`, [...opts, bye]);
  }
  // ───────────────────────── Chuỗi cửa hàng (bậc 7): mở chi nhánh thứ hai ─────────────────────────
  /** Nói chuyện về chi nhánh: giải thích, mở chi nhánh mới, hoặc quản lý chi nhánh đang có. */
  branchTalk(n: Npc) {
    const g = this.g, b = g.branch, opts: Opt[] = [];
    if (!R.isChain(g)) {
      opts.push({ t: `Mua bảng hiệu Chuỗi cửa hàng — ${money(GEAR.chuoi.price)}`, sub: 'Cần có Nhà hàng bình dân (bậc 6) trước', off: g.cash < GEAR.chuoi.price || g.stall.tier < 6, fn: () => this.buyGear('chuoi') });
    }
    if (R.isChain(g) && !b) {
      opts.push({ t: 'Thuê chỗ mở chi nhánh', sub: 'Chọn một chỗ bán khác với quán chính — trả một ngày thuê trước', fn: () => this.branchSiteMenu(n) });
    }
    if (b) {
      const sp = SPOTS.find((x) => x.id === b.spot);
      opts.push({ t: `Chi nhánh ${sp?.name ?? ''} — xem sổ (${b.keeper ? 'có người trông' : 'chưa có người'})`, fn: () => { ctx.ui.panel('branch'); } });
    }
    const text = !R.isChain(g)
      ? 'Muốn mở chi nhánh thứ hai hả? Phải có cái nhà hàng đàng hoàng trước đã, rồi chú lo cho cái bảng hiệu chuỗi với giấy thuê mặt bằng.'
      : !b
        ? 'Được, có chuỗi rồi thì mở thêm điểm thứ hai. Chú giới thiệu ba chỗ còn trống, mỗi chỗ một giá. Nhớ: quán chính là chỗ nào thì chi nhánh phải chỗ khác.'
        : `Chi nhánh ${SPOTS.find((x) => x.id === b.spot)?.name ?? ''} đang ${b.keeper ? (b.open ? 'bán' : 'đóng cửa') : 'chưa có người trông'}. Mở sổ ra coi doanh thu, rồi tính chuyện thuê người hay chuyển thêm món qua.`;
    this.D(who(n), n, text, [...opts, { t: 'Rồi, để con tính.' }]);
  }
  /** Chọn chỗ thuê chi nhánh. */
  private branchSiteMenu(n: Npc) {
    const g = this.g, opts: Opt[] = [];
    for (const site of BRANCH_SITES) {
      const sp = SPOTS.find((x) => x.id === site.spot);
      if (!sp) continue;
      const takenByStall = g.stall.spot === site.spot;
      const gate = R.branchGate(g, site.spot, takenByStall);
      opts.push({
        t: `${sp.name} — thuê ${money(site.rent)}/ngày`,
        sub: `${site.note}${gate.why ? ' · ' + gate.why : ''}`,
        off: !gate.ok || g.cash < site.rent,
        fn: () => {
          const br = R.openBranch(g, site.spot, takenByStall);
          if (!br) { toast('Không mở được chi nhánh ở chỗ này.', 'warn'); return; }
          sfx('buy'); toast(`Đã thuê ${sp.name} làm chi nhánh! Giờ tìm người trông coi và chuyển món sẵn qua.`, 'good', 'shop', true);
          this.branchTalk(n);
        },
      });
    }
    this.D(who(n), n, 'Ba chỗ này còn trống, chú giữ giấy cho. Chỗ đông thì thuê đắt hơn nhưng bán được nhiều hơn.', [...opts, { t: 'Để con tính lại.' }]);
  }
  private sellGearMenu(n: Npc) {
    const g = this.g, ids = Object.keys(g.gear);
    this.D(who(n), n, 'Đồ cũ tui mua lại nửa giá, tuỳ còn mới hay không.', [...ids.slice(0, 7).map((id) => ({ t: `${GEAR[id].name} — ${money(R.gearResale(g, id))}`, fn: () => { const v = R.sellGear(g, id); sfx('coin'); toast(`Bán ${GEAR[id].name.toLowerCase()} được ${money(v)}.`, 'info', 'cash'); ctx.stall.refresh(); } })), { t: 'Thôi, để dùng tiếp.' }]);
  }
  private bankMenu(n: Npc) {
    const g = this.g, L = LENDERS.bank, lim = R.loanLimit(g, 'bank'), debt = g.debts.filter((d) => d.lender === 'bank'), opts: Opt[] = [];
    for (const a of [100000, 500000]) opts.push({ t: `Gửi tiết kiệm ${money(a)}`, off: g.cash < a, fn: () => { g.cash -= a; g.bank += a; bus.emit('cash', -a); sfx('coin'); this.bankMenu(n); } });
    if (g.bank > 0) opts.push({ t: `Rút hết ${money(g.bank)}`, fn: () => { const a = g.bank; g.cash += a; g.bank = 0; bus.emit('cash', a); sfx('coin'); this.bankMenu(n); } });
    for (const a of L.amounts) if (a <= lim) opts.push({ t: `Vay ${money(a)}`, sub: `Lãi ${(L.rate * 100).toFixed(1)}%/ngày, trả trong ${L.term} ngày ~ ${money(a * (1 + L.rate * L.term))}`, fn: () => { R.borrow(g, 'bank', a); sfx('coin'); toast(`Đã vay ngân hàng ${money(a)}.`, 'info', 'cash'); } });
    for (const d of debt) { opts.push({ t: `Trả nợ ${money(Math.min(d.owed, g.cash))} / ${money(d.owed)}`, off: g.cash < 1000, fn: () => { R.repay(g, d.id, g.cash); sfx('coin'); this.bankMenu(n); } }); if (g.day >= d.due - 1) opts.push({ t: 'Xin gia hạn thêm 7 ngày', fn: () => { const r = R.extend(g, d.id); ctx.npcs.say(n, r.line, 3.5, r.ok ? 0 : 3); } }); }
    const why = lim > 0 ? `Hạn mức vay hiện tại của anh chị là ${money(lim)}.` : !STABLE_HOME.includes(g.housing) ? 'Để vay vốn cần có chỗ ở ổn định (trọ, khách sạn, căn hộ…) và uy tín từ 15.' : g.rep < 15 ? 'Uy tín kinh doanh của anh chị chưa đủ 15 để vay.' : 'Anh chị đã vay hết hạn mức.';
    this.D(who(n), n, `Ngân hàng Sao Vàng xin chào. Số dư tiết kiệm: ${money(g.bank)} (lãi nhỏ mỗi ngày, không sợ mất trộm). ${why}`, [...opts.slice(0, 7), { t: 'Cảm ơn chị.' }]);
  }
  private sharkMenu(n: Npc) {
    const g = this.g, L = LENDERS.shark, lim = R.loanLimit(g, 'shark'), debt = g.debts.filter((d) => d.lender === 'shark'), opts: Opt[] = [];
    for (const a of L.amounts) if (a <= lim) opts.push({ t: `Vay nóng ${money(a)}`, sub: `Lãi 3%/ngày, ${L.term} ngày phải trả ~ ${money(a * (1 + L.rate * L.term))}. Trễ là bị siết đồ!`, fn: () => { R.borrow(g, 'shark', a); sfx('coin'); ctx.npcs.say(n, 'Tiền đây. Năm ngày. Nhớ mặt tao đó.', 3, 0); toast(`Đã vay nóng ${money(a)} của Hùng Sẹo.`, 'warn', 'skull', true); } });
    for (const d of debt) { opts.push({ t: `Trả ${money(Math.min(d.owed, g.cash))} / ${money(d.owed)}`, off: g.cash < 1000, fn: () => { R.repay(g, d.id, g.cash); sfx('coin'); this.sharkMenu(n); } }); opts.push({ t: 'Xin khất thêm 3 ngày', sub: 'Mất phí 8%', fn: () => { const r = R.extend(g, d.id); ctx.npcs.say(n, r.line, 3.5, r.ok ? 0 : 4); } }); }
    // Băng đảng (lượt 71) đặt lên đầu: đã theo băng thì việc băng mới là chuyện chính, vay nóng là chuyện phụ.
    // (Trước đây tôi `push` xuống cuối rồi `slice(0, 7)` — có nợ là mục băng bị cắt mất, không ai bấm được.)
    const gang: Opt = { t: 'Nói chuyện băng đảng', sub: GANGTALK.gangLine(g), fn: () => GANGTALK.gangMenu(this as unknown as GANGTALK.TalkHost, 'hem', n) };
    this.D(who(n), n, debt.length ? `Mày còn nợ tao ${money(debt.reduce((a, d) => a + d.owed, 0))}. Hạn ngày ${debt[0].due}. Hôm nay là ngày ${g.day}.` : 'Cần tiền hả? Ở đây không cần giấy tờ. Chỉ cần mày nhớ trả đúng hẹn.', [gang, ...opts.slice(0, 6), { t: 'Dạ thôi, em đi.' }]);
  }
  /** Dọn đồ khỏi chỗ ở cũ (mang theo phần xách nổi). */
  private moveOut() { const g = this.g; for (const s of g.home.slice()) { const room = R.carryCap(g) - R.bagWeight(g), k = INGS[s.id].kg > 0 ? Math.min(s.n, Math.floor(room / INGS[s.id].kg)) : s.n; if (k > 0) addStack(g.bag, { ...s, n: k }); } g.home = []; if (g.stall.where === 'home') g.stall.where = 'carried'; }

  buyGear(id: string) {
    const g = this.g, d = GEAR[id], n = ctx.npcs.fixed.get('equip');
    if (!placeOpen('equip')) { toast('Tiệm Ba Tài đã đóng cửa (mở 7h–20h).', 'warn'); return; }
    if (R.has(g, id)) { toast(`Bạn đã có ${d.name.toLowerCase()} rồi.`, 'info'); return; }
    const need = d.kind === 'stall' && d.tier! > 1 && !R.has(g, TIERS[d.tier! - 1].id) ? `Nên có ${TIERS[d.tier! - 1].name.toLowerCase()} trước.` : '';
    const tierReq = d.minTier && g.stall.tier < d.minTier ? `Cần nâng cấp lên ${TIERS[d.minTier].name} trở lên mới lắp được món này.` : '';
    const block = id === 'tulanh' && !['tro', 'canho', 'nharieng', 'cuahang'].includes(g.housing) ? 'Phải thuê chỗ ở có khoá (trọ, căn hộ, nhà) mới đặt được tủ lạnh.' : '';
    this.D(n ? who(n) : 'Chủ tiệm đồ nghề', n, `${d.name} — ${money(d.price)}. ${d.desc} ${need}${tierReq}${block}` + (id === 'sap' ? ' Mua rồi phải chọn chỗ đặt ngoài phố (chỗ nào cũng được), đặt xuống là cố định, mỗi ngày đóng phí chỗ. Bù lại chứa được 90 kg, bày 10 món, 7 khách xếp hàng, mưa gió không ai dỡ hàng.'
        : id === 'quanan' ? ' Quán phải dựng ở MẶT BẰNG có sân (điểm vàng ghi “Mặt bằng”, hai chỗ: Phố Văn Phòng và Khu Căn Hộ), mỗi ngày đóng phí mặt bằng. Đổi lại chứa 150 kg, bày 16 món, 9 khách một lúc và bốn chỗ ngồi ăn tại chỗ.'
        : id === 'quanngoi' ? ' Cũng dựng ở MẶT BẰNG có sân. Đổi lại chứa 200 kg, bày 20 món, 12 khách một lúc, sáu ghế bàn gỗ kê trong nhà — khách ngồi ăn lâu hơn gấp rưỡi và ăn xong hay gọi thêm tráng miệng, mà món đúng buổi thì bán chạy hơn.'
        : id === 'nhahang' ? ' Dựng ở MẶT BẰNG lớn (Phố Văn Phòng hoặc Khu Căn Hộ). Không gian trong nhà kín gồm 4 bàn (8 ghế) và phòng bếp riêng; chứa 280 kg, bày 26 món, 16 khách cùng lúc, nhận đặt bàn trước, thuê phụ bếp tự sơ chế/nấu phụ và đón khách đoàn.' : ''), [{ t: `Mua — ${money(d.price)}`, off: g.cash < d.price || !!block || !!tierReq, sub: tierReq || (g.cash < d.price ? `Còn thiếu ${money(d.price - g.cash)}` : undefined), fn: () => {
      if (R.buyGear(g, id) === 'ok') {
        sfx('buy'); ctx.stall.refresh();
        if (id === 'sap') { toast('Sạp đã mua! Giờ tìm một CHỖ BÁN (vòng sáng vàng) ngoài phố, chạm vào để dựng sạp — đặt rồi thì không dời được nữa.', 'good', 'shop', true); if (g.stall.tier >= 3) this.way = null; }
        else if (id === 'nhahang') { toast('Nhà hàng bình dân đã mua! Tìm MẶT BẰNG (điểm vàng “Mặt bằng”: Phố Văn Phòng hoặc Khu Căn Hộ) để mở nhà hàng — 4 bàn 8 ghế trong nhà kín, phòng bếp riêng, đặt bàn trước, phụ bếp & khách đoàn.', 'good', 'shop', true); }
        else if (id === 'quanngoi') { toast('Quán có chỗ ngồi đã mua! Tìm MẶT BẰNG có sân (điểm vàng “Mặt bằng”: Phố Văn Phòng hoặc Khu Căn Hộ) để dựng quán — sáu ghế trong nhà, khách ăn tại chỗ.', 'good', 'shop', true); }
        else if (id === 'quanan') { toast('Quán ăn nhỏ đã mua! Tìm MẶT BẰNG (điểm vàng có chữ “Mặt bằng”: Phố Văn Phòng hoặc Khu Căn Hộ), chạm vào để dựng quán — mỗi ngày đóng phí mặt bằng.', 'good', 'shop', true); }
        else if (d.kind === 'phone') { toast(`Đã mua ${d.name.toLowerCase()}, cắm sim vô liền. Bấm nút điện thoại trên màn hình (hoặc phím P) để mở.`, 'good', 'tool', true); toast('Máy có sổ thu chi, danh bạ, tin nhắn. Pin tụt dần — ngủ ở nhà có điện thì đầy pin, hoặc sạc nhờ ở tạp hoá 5.000₫.', 'info', 'bolt'); }
        else toast(`Đã mua ${d.name.toLowerCase()}!` + (d.kind === 'stall' ? ' Bạn đang mang quầy theo người.' : ''), 'good', 'tool', true);
      }
    } }, { t: 'Để con tính lại.' }]);
  }

  // ───────────────────────── Nhân vật phụ (góc trà đá, sân nhảy, vá xe…) ─────────────────────────
  /** Menu chuyện trò của một nhân vật phụ: câu nào chưa hỏi thì hiện, cộng thêm việc dùng được ở chỗ đó. */
  private sideMenu(n: Npc, id: string, text?: string) {
    const g = this.g, S = SIDE[id], opts: Opt[] = [];
    S.topics.forEach((t, i) => {
      const key = `side_${id}_${i}`; if (g.flags[key]) return;
      opts.push({ t: t.q, fn: () => { g.flags[key] = 1; R.consume(g, { m: 1 }); toast(`Bạn hiểu thêm về ${FIXED[id]?.name ?? 'người này'}.`, 'info', 'heart'); this.sideMenu(n, id, t.a); } });
    });
    opts.push(...this.sideOpts(n, id));
    if (!opts.length) opts.push({ t: 'Không còn gì để hỏi.' });
    const done = S.topics.every((_, i) => g.flags[`side_${id}_${i}`]);
    this.D(who(n), n, text ?? (done ? S.again : S.intro), [...opts, { t: 'Thôi, đi nha.' }]);
  }
  /** Nói chuyện với khách đang lựa hàng: họ nhờ lấy giùm món trên kệ cao, lấy xong thì cảm ơn thật. */
  browserTalk(n: Npc) {
    const g = this.g, bye: Opt = { t: 'Thôi, anh/chị cứ tự nhiên.' };
    const ask = ctx.browse.askNear();
    if (!ask || ask.b.n !== n) { this.D(who(n), n, rnd.pick(['Tôi lựa chút đồ rồi về nấu cơm.', 'Tiệm này đủ thứ hết ha.', 'Đang coi giá, tháng này mắc quá.']), [bye]); return; }
    this.D(who(n), n, ask.line, [
      { t: 'Để tôi lấy giùm.', fn: () => {
          R.advance(g, 2, this.act()); R.consume(g, { e: -1 }); ctx.player.gesture('work', 0.6);
          g.rep = clamp(g.rep + 0.2, 0, 100);
          ctx.npcs.say(n, rnd.pick(['Cảm ơn nhiều nghen!', 'Nhờ vậy tôi mới lấy được.', 'Thiệt tình, cảm ơn anh/chị.']), 3, EXPR.happy);
          toast('Lấy giùm hộp đồ trên kệ cao — bà con trong xóm nể hơn chút.', 'good', 'heart');
        } },
      bye,
    ]);
  }

  // ───────────────────────── Ngoại hình: tiệm cắt tóc & tiệm thời trang ─────────────────────────
  /** Mua một lựa chọn ngoại hình: trừ tiền, ghi vào bản lưu, dựng lại nhân vật ngay. */
  private buyLook(n: Npc, key: 'hairStyle' | 'hair' | 'shirt' | 'pants' | 'shoe' | 'face' | 'beard' | 'shape', val: number, price: number, what: string, line: string) {
    const g = this.g;
    if (price > 0 && !R.spend(g, price, 'other')) { toast('Không đủ tiền.', 'bad', 'cash'); return false; }
    // 'shape' đổi cả bề ngang lẫn chiều cao nên phải ghi hai trường.
    if (key === 'shape') { const sh = SHAPES[val]; g.look.fat = sh.fat; g.look.h = sh.h; if (g.look.fem) g.look.fat *= 0.94; }
    else (g.look as any)[key] = val;
    // Đổi hình thì phải đổi luôn tốc độ đi & độ hao sức — người chơi cảm thấy khác ngay dưới chân.
    ctx.player.applyLook();
    R.advance(g, 15, this.act()); R.consume(g, { m: 4 }); sfx('coin');
    ctx.npcs.say(n, line, 3, EXPR.happy);
    toast(`Đã đổi ${what} (${money(price)}).` + (ctx.set.cam3 ? '' : ' Bấm V để ngắm mình ở góc nhìn thứ ba.'), 'good', 'heart');
    return true;
  }
  /** Dáng người: chọn ở tiệm may. Ba mức, đổi luôn tốc độ đi và độ hao sức. */
  private shopShape(n: Npc) {
    const g = this.g, cur = R.bodyType(g);
    const opts: Opt[] = SHAPES.map((sh, i) => ({
      t: `${sh.name} — ${money(sh.price)}`, off: i === cur || g.cash < sh.price,
      fn: () => { if (this.buyLook(n, 'shape', i, sh.price, DÁNG[i], 'Đứng thẳng lên coi, được đó.')) this.shopShape(n); },
    }));
    this.D(who(n), n, 'Cô Ngọc lấy thước dây ra: “Con muốn may dáng nào?”', [...opts, { t: 'Thôi, giữ dáng này.' }]);
  }
  /** Râu: chỉ nam mới có, ngồi ghế Chú Bảy cạo hoặc để. */
  private barberBeard(n: Npc) {
    const g = this.g, cur = g.look.fem ? -1 : g.look.beard;
    if (g.look.fem) { this.D(who(n), n, 'Chú Bảy cười: “Con gái thì để vậy cho gọn.”', [{ t: 'Dạ.' }]); return; }
    const opts: Opt[] = [0, 1, 2, 3].map((b) => ({
      t: b === 0 ? 'Cạo sạch — 5.000₫' : `${RÂU[b]} — 8.000₫`, off: b === cur || g.cash < (b ? 8000 : 5000),
      fn: () => { if (this.buyLook(n, 'beard', b, b ? 8000 : 5000, b ? RÂU[b].toLowerCase() : 'râu sạch sẽ', b ? 'Để vậy nhìn có uy hơn đó.' : 'Cạo xong nhìn trẻ ra hẳn.')) this.barberBeard(n); },
    }));
    this.D(who(n), n, 'Chú Bảy mài dao cạo: “Râu kẽm còn không?”', [...opts, { t: 'Thôi, để vậy.' }]);
  }
  /** Nón: mua ở tiệm may. Đội lên là thấy liền. */
  private shopHats(n: Npc) {
    const g = this.g, cur = g.look.hatCol;
    const opts: Opt[] = HATS.map((ht) => ({
      t: ht.col ? `${ht.name} — ${money(ht.price)}` : 'Không đội — miễn phí', off: (ht.col === 0 ? !g.look.hatCol : g.look.hat === ht.col) || g.cash < ht.price,
      fn: () => {
        if (ht.price > 0 && !R.spend(g, ht.price, 'other')) { toast('Không đủ tiền.', 'bad', 'cash'); return; }
        // HATS[1] nón lá → hat 1, HATS[2] lưỡi trai → 2, HATS[3] bảo hiểm → 3 (khớp cách vẽ trong gfx/people).
        const shape = HATS.findIndex((x) => x.col === ht.col);
        g.look.hat = ht.col ? Math.min(3, Math.max(1, shape)) : 0;
        g.look.hatCol = ht.col; ctx.player.applyLook(); sfx('coin');
        toast(ht.col ? `Đội ${ht.name.toLowerCase()} lên rồi.` : 'Bỏ nón ra, đầu nhẹ hẳn.', 'good', 'heart');
        this.shopHats(n);
      },
    }));
    this.D(who(n), n, 'Cô Ngọc chỉ dãy nón trên kệ: “Nắng này đội một cái cho đỡ.”', [...opts, { t: 'Thôi, đầu trần cho mát.' }]);
  }
  /** Ngồi vào ghế của Chú Bảy (neo `hot_toc_ghe`): chào một câu rồi mở bảng kiểu tóc. */
  barberChair(n: Npc) {
    this.D(who(n), n, 'Ngồi đi con, ghế này là để cắt tóc đó. Muốn kiểu nào?', [
      { t: 'Cắt kiểu mới', fn: () => this.barberStyles(n) },
      { t: 'Nhuộm tóc', fn: () => this.barberColors(n) },
      { t: 'Ngồi nghỉ chút thôi.', fn: () => { R.advance(this.g, 20, this.act()); R.consume(this.g, { m: 6 }); toast('Ngồi nghỉ trên ghế cắt tóc, người nhẹ hẳn.', 'info', 'heart'); ctx.anim.startBarber(n, 'nghỉ chân & tỉa sơ', this.g.look.hair); } },
    ]);
  }
  private barberStyles(n: Npc) {
    const g = this.g, cur = g.look.hairStyle;
    const opts: Opt[] = HAIR_STYLES.map((hs) => ({
      t: `${hs.name} — ${money(hs.price)}`, sub: hs.id === cur ? 'Đang để kiểu này' : hs.id >= 4 ? 'Kiểu mới về, hơi lâu một chút' : undefined,
      off: hs.id === cur || g.cash < hs.price,
      fn: () => { if (this.buyLook(n, 'hairStyle', hs.id, hs.price, `kiểu tóc “${hs.name.toLowerCase()}”`, 'Xong rồi đó. Soi gương coi được không.')) ctx.anim.startBarber(n, `kiểu tóc “${hs.name.toLowerCase()}”`, g.look.hair); },
    }));
    this.D(who(n), n, 'Chú Bảy vỗ vỗ cái ghế sắt: “Lên ngồi đi, muốn kiểu nào?”', [...opts, { t: 'Thôi, để hôm khác.' }]);
  }
  private barberColors(n: Npc) {
    const g = this.g;
    const opts: Opt[] = HAIR_COLORS.map((c) => ({
      t: `${c.name} — ${money(c.price)}`, off: g.look.hair === c.col || g.cash < c.price,
      sub: g.look.hair === c.col ? 'Đang nhuộm màu này' : undefined,
      fn: () => { if (this.buyLook(n, 'hair', c.col, c.price, `màu tóc ${c.name.toLowerCase()}`, 'Màu này hợp với con đó.')) ctx.anim.startBarber(n, `màu tóc ${c.name.toLowerCase()}`, c.col); },
    }));
    this.D(who(n), n, 'Chú Bảy mở hộp thuốc nhuộm: “Muốn màu nào? Nhuộm xong ba chục phút mới gội nghen.”', [...opts, { t: 'Thôi, để màu tự nhiên.' }]);
  }
  private shopColors(n: Npc, key: 'shirt' | 'pants' | 'shoe', list: ColorDef[], what: string) {
    const g = this.g;
    const opts: Opt[] = list.map((c) => ({
      t: `${c.name} — ${money(c.price)}`, sub: g.look[key] === c.col ? 'Đang mặc cái này' : undefined,
      off: g.look[key] === c.col || g.cash < c.price,
      fn: () => { if (this.buyLook(n, key, c.col, c.price, what + ' màu ' + c.name.toLowerCase(), 'Mặc vô coi bộ được đó con.')) this.shopColors(n, key, list, what); },
    }));
    this.D(who(n), n, `Cô Ngọc kéo giá đồ ra: “Lựa ${what} đi con, màu nào cũng có.”`, [...opts, { t: 'Thôi, để coi đã.' }]);
  }
  private shopGlasses(n: Npc) {
    const g = this.g, base = g.look.fem ? 1 : 0;
    const cur = g.look.face >= 5 ? g.look.face : 0;
    const opts: Opt[] = [
      { t: 'Bỏ kính — miễn phí', off: cur === 0, fn: () => { this.buyLook(n, 'face', base, 0, 'kính', 'Đây, mặt mày nhìn rõ hơn rồi đó.'); this.shopGlasses(n); } },
      { t: `Kính cận gọng đen — ${money(GLASSES[1].price)}`, off: cur === 5 || g.cash < GLASSES[1].price, fn: () => { this.buyLook(n, 'face', 5, GLASSES[1].price, 'kính cận', 'Cận thì đeo vô, chữ nhỏ xíu cũng thấy.'); this.shopGlasses(n); } },
      { t: `Kính đen — ${money(GLASSES[2].price)}`, off: cur === 6 || g.cash < GLASSES[2].price, fn: () => { this.buyLook(n, 'face', 6, GLASSES[2].price, 'kính đen', 'Ui, nhìn ngầu ghê. Đi bán hàng hơi khó thấy đường đó nghen.'); this.shopGlasses(n); } },
    ];
    this.D(who(n), n, 'Cô Ngọc mở hộp kính: “Đeo thử coi, kính này mốt lắm.”', [...opts, { t: 'Thôi, mắt con còn tốt.' }]);
  }

  /** Việc dùng được ngay tại chỗ của từng nhân vật phụ. */
  private sideOpts(n: Npc, id: string): Opt[] {
    const g = this.g, h = hourOf(g), say = (t: string) => ctx.npcs.say(n, t, 2.8, 1);
    switch (id) {
      case 'tra_da': return [
        { t: 'Mua một ly trà đá — 3.000₫', sub: `Khát ${Math.round(Math.max(0, (1 - g.st.thirst / STAT_MAX) * 100))}%`, off: g.cash < 3000,
          fn: () => { if (!R.spend(g, 3000, 'food')) return; R.consume(g, { t: 18, m: 3 }); sfx('drink'); say('Ly này cô thêm đá cho mát. Ngồi chơi chút đi con.'); ctx.anim.startIcedTea(n); } },
        { t: 'Phụ bưng trà đá một buổi — 40 phút', sub: h >= 6 && h < 21 ? 'Công 12.000₫, hơi mệt' : 'Ngoài giờ cô bán', off: !(h >= 6 && h < 21) || g.st.energy < 18,
          fn: () => { R.advance(g, 40, this.act()); R.earn(g, 12000, 'side'); R.consume(g, { e: -9, t: -6, m: 2 }); sfx('coin'); ctx.ui.float('+12.000₫', n, 'good'); say('Giỏi quá. Cầm lấy, mai ghé nữa nghen con.'); ctx.anim.startTeaShift(n); } },
      ];
      case 'rap': return [
        { t: 'Nhảy thử một bài theo nhịp', sub: g.st.energy < 12 ? 'Đang mệt quá' : 'Vui thì vui, hơi tốn sức', off: g.st.energy < 12,
          fn: () => { R.advance(g, 12, this.act()); R.consume(g, { e: -6, m: 9 }); sfx('yay'); say('Ờ được đó! Chân trái chưa đều, mà có khiếu. Mai ghé tập chung.'); ctx.anim.startRap(n); } },
        { t: 'Xin một câu để đời', fn: () => this.D(who(n), n, 'Bin gõ gõ ngón tay lên thùng loa: “Nhảy sai thì tập lại. Bán ế thì mai bán tiếp. Bỏ cuộc mới là dở.”', [{ t: 'Câu này được đó.' }]) },
      ];
      case 'sua_xe': {
        // Chỉ sửa cái mình đang có: gánh tre thì chằng lại đòn gánh, xe đẩy mới có bánh để vá, bơm.
        // (Trước đây bán "bơm bánh xe cho con" cho cả người chưa có xe — bấm vô là mất 2.000₫ mà chẳng được gì.)
        const coXe = g.stall.tier >= 2 && g.stall.where !== 'carried', cond = Math.round(g.stall.cond);
        return [
          coXe
            ? { t: 'Vá bánh, bơm hơi cho xe đẩy — 8.000₫', sub: `Xe đang ${cond}%`, off: g.cash < 8000 || g.stall.cond > 99,
              fn: () => { if (!R.spend(g, 8000, 'gear')) return; g.stall.cond = Math.min(100, g.stall.cond + 18); sfx('fix'); toast(`Xe đã được vá lại: ${Math.round(g.stall.cond)}%.`, 'good', 'tool'); ctx.stall.refresh(); say('Xong rồi đó. Bánh căng, chạy êm ru.'); ctx.anim.startRepair(n, 'Vá bánh xe đẩy'); } }
            : { t: 'Chằng lại đòn gánh, vá thúng — 4.000₫', sub: g.stall.tier ? `Quang gánh đang ${cond}%` : 'Chưa có quang gánh để sửa', off: !g.stall.tier || g.cash < 4000 || g.stall.cond > 99,
              fn: () => { if (!R.spend(g, 4000, 'gear')) return; g.stall.cond = Math.min(100, g.stall.cond + 15); sfx('fix'); toast(`Quang gánh đã chắc lại: ${Math.round(g.stall.cond)}%.`, 'good', 'tool'); ctx.stall.refresh(); say('Chằng dây lại rồi, gánh đỡ lỏng rồi đó.'); ctx.anim.startRepair(n, 'Chằng đòn gánh'); } },
          { t: 'Bơm bánh xe đẩy cho căng — 2.000₫', sub: coXe ? `Xe đang ${cond}% · đẩy nhẹ hơn` : 'Chưa có xe đẩy nên không có bánh mà bơm', off: !coXe || g.cash < 2000 || g.stall.cond > 99,
            fn: () => { if (!R.spend(g, 2000, 'gear')) return; g.stall.cond = Math.min(100, g.stall.cond + 5); sfx('fix'); ctx.stall.refresh(); say('Bơm căng rồi, đẩy nhẹ hơn hẳn.'); ctx.anim.startRepair(n, 'Bơm căng bánh xe'); } },
        ];
      }
      case 'hat_rong': return [
        { t: 'Ngồi nghe một bài', fn: () => { R.advance(g, 10, this.act()); R.consume(g, { m: 8 }); sfx('good'); say('Cảm ơn con nghe hết bài. Người ta dừng lại nghe là cô vui rồi.'); ctx.anim.startBusker(n); } },
        { t: 'Bỏ vào thùng 5.000₫', off: g.cash < 5000, fn: () => { if (!R.spend(g, 5000, 'other')) return; g.rep = clamp(g.rep + 0.3, 0, 100); R.consume(g, { m: 2 }); sfx('coin'); say('Trời, con khéo quá. Cô chúc con buôn may bán đắt.'); } },
      ];
      case 'danh_co': return [
        { t: 'Chơi một ván cờ', sub: g.st.energy < 10 ? 'Đang mệt, chơi không nổi' : undefined, off: g.st.energy < 10,
          fn: () => { R.advance(g, 25, this.act()); R.consume(g, { e: -4, t: -4, m: 6 }); sfx('ok'); say('Hay lắm! Con đi xe pháo này là tui chịu rồi. Mai chơi tiếp nghen.'); ctx.anim.startChess(n); } },
        { t: 'Hỏi thăm sức khoẻ ông', fn: () => this.D(who(n), n, 'Ông Tư xoa đầu gối: “Lưng còn đau, mà ngồi đây có người nói chuyện là khoẻ hơn thuốc. Con lo làm ăn đi, đừng lo cho tui.”', [{ t: 'Ông giữ sức nghen.' }]) },
      ];
      case 'hot_toc': {
        // Bảng chọn tự nói giá và tình trạng hiện tại; chỉ chỗ cần cảnh báo mới có chữ nhỏ.
        const cur = g.look.hairStyle, beard = g.look.beard;
        return [
          { t: 'Cắt kiểu mới — 12.000–45.000₫', sub: HAIR_STYLES[cur]?.name, fn: () => this.barberStyles(n) },
          { t: 'Nhuộm tóc — 10.000–30.000₫', fn: () => this.barberColors(n) },
          { t: g.look.fem ? 'Cạo râu' : `Râu — ${beard ? RÂU[beard] : 'đang cạo sạch'}`, sub: g.look.fem ? 'Không có gì để cạo' : undefined, off: g.look.fem, fn: () => this.barberBeard(n) },
          { t: ctx.set.cam3 ? 'Đang nhìn mình' : 'Soi gương', off: ctx.set.cam3, fn: () => { ctx.ui.switchView(); } },
        ];
      }
      case 'thoi_trang': return [
        { t: 'Áo — 25.000–30.000₫', fn: () => this.shopColors(n, 'shirt', SHIRT_COLORS, 'cái áo') },
        { t: 'Quần — 18.000–24.000₫', fn: () => this.shopColors(n, 'pants', PANTS_COLORS, 'cái quần') },
        { t: 'Giày dép — 12.000–45.000₫', fn: () => this.shopColors(n, 'shoe', SHOE_COLORS, 'đôi giày') },
        { t: 'Kính — 45.000–60.000₫', fn: () => this.shopGlasses(n) },
        { t: 'Dáng người — 15.000–18.000₫', sub: SHAPES[R.bodyType(g)].name, fn: () => this.shopShape(n) },
        { t: 'Nón — 20.000–55.000₫', fn: () => this.shopHats(n) },
        { t: ctx.set.cam3 ? 'Đang nhìn mình' : 'Soi gương', off: ctx.set.cam3, fn: () => { ctx.ui.switchView(); } },
      ];
      case 'danh_giay': return [
        { t: 'Đánh giày — 5.000₫', sub: `Vệ sinh hiện tại ${Math.round(g.st.hygiene)}/${STAT_MAX}`, off: g.cash < 5000,
          fn: () => { if (!R.spend(g, 5000, 'other')) return; R.consume(g, { hy: 14, m: 3 }); sfx('fix'); say('Bóng chưa? Con đánh hai lớp đó nghen. Cảm ơn anh/chị!'); ctx.anim.startShoeshine(n); } },
        { t: 'Cho Bo 5.000₫ mua xi', off: g.cash < 5000, fn: () => { if (!R.spend(g, 5000, 'other')) return; g.rep = clamp(g.rep + 0.2, 0, 100); sfx('coin'); say('Thiệt hả anh/chị? Con để dành mua hộp xi mới. Con cảm ơn nhiều!'); } },
      ];
      case 'cafe': return this.gardenCafeOpts(n);
      // Lượt 69: hai chỗ bán nước mía (ly 3.000₫ / ly lớn 5.000₫) và cai công trình nhận phụ hồ. Ba người này
      // KHÔNG có nhánh riêng trong `switch` của `talkTo` (họ đi qua `sideMenu`), nên thực đơn của họ phải nằm ở đây.
      case 'mia_xe': return this.miaOpts(n, 'xe');
      case 'mia_quan': return this.miaOpts(n, 'quan');
      case 'site': return this.siteOpts(n);
    }
    return [];
  }

  /**
   * Thực đơn của một chỗ bán nước mía (lượt 69): mua một ly, mua ly lớn, học cách làm, xin phụ bán một ca.
   * Chỗ `where === 'xe'` là xe mía trong Chợ Xóm Chiều, `'quan'` là quán Nước Mía 3K ở Phố Trung Tâm.
   */
  private miaOpts(n: Npc, where: 'xe' | 'quan'): Opt[] {
    const g = this.g, h = hourOf(g), open = R.miaOpenAt(h, where);
    const name = FIXED[where === 'xe' ? 'mia_xe' : 'mia_quan']?.name ?? 'chủ quán';
    const say = (t: string) => ctx.npcs.say(n, t, 2.8, 1);
    const buy = (price: number, label: string) => ({
      t: `${label} — ${money(price)}`,
      sub: `Khát ${Math.round(Math.max(0, (1 - g.st.thirst / STAT_MAX) * 100))}% · uống tại chỗ cho mát`,
      off: g.cash < price,
      fn: () => {
        if (!R.spend(g, price, 'food')) return;
        // Ly lớn nhiều đá và nhiều nước hơn nên đỡ khát gấp rưỡi, tinh thần cũng lên một chút.
        R.consume(g, { t: price >= 5000 ? 42 : 30, m: 4 });
        sfx('drink'); g.wd.miaSold = R.miaSold(g) + 1;
        say(where === 'xe' ? 'Ly này cô ép thêm cây nữa cho ngọt. Uống đi con, nắng lắm.' : 'Chú ép liền cho nóng, đá đây rồi. Ngồi ghế kia uống cho mát.');
        ctx.anim.startMiaDrink(n);
      },
    });
    const opts: Opt[] = [];
    if (!open) opts.push({ t: 'Chưa tới giờ bán', sub: where === 'xe' ? 'Xe mía mở 6h–18h30' : 'Quán mở 7h–21h', off: true });
    else {
      opts.push(buy(R.MIA_CUP_PRICE, 'Một ly nước mía'));
      opts.push(buy(5000, 'Ly lớn'));
    }
    // Học nghề: chỉ chủ quán trên phố dạy (cần quen biết như mọi chỗ khác — `learnOpts` lo phần đó).
    if (where === 'quan') opts.push(...this.learnOpts('mia_quan', n));
    // Phụ bán một ca: chỉ khi quán đang mở, còn ca, và đủ sức.
    const left = R.miaShiftsLeft(g), pay = R.miaWage(g.rep);
    opts.push({
      t: `Xin phụ bán một ca — ${money(pay)}`,
      sub: !open ? 'Ngoài giờ bán' : left <= 0 ? `Hôm nay làm đủ ${R.MIA_SHIFTS_DAY} ca rồi` : `${R.MIA_SHIFT_MIN} phút · còn ${left}/${R.MIA_SHIFTS_DAY} ca hôm nay`,
      off: !open || left <= 0 || g.st.energy < 22,
      fn: () => this.miaShift(n, where),
    });
    // Chuyện nghề của hai người được kể trong `SIDE` (câu hỏi mở ra dần), ở đây chỉ một câu hỏi nhanh.
    opts.push({ t: 'Nước mía ở đây ép bằng gì?', fn: () => this.D(who(n), n, where === 'xe'
      ? 'Cô chỉ có cái máy ép quay tay này thôi. Cần ép cũ rồi, mà ép chậm nên nước không bị nóng, ngọt thanh hơn máy lớn ngoài tiệm.'
      : 'Máy ép chú mua lại của cái tiệm nước mía ngoài chợ Bình Điền. Mía thì bữa nào cũng lấy một bó, ép hết trong ngày — để qua đêm là chua, chú không bán.', [{ t: 'Ra vậy.' }]) });
    return opts;
  }

  /** Công trình thi công: xin một ca phụ hồ. Chỉ ban ngày, tối đa `R.SITE_SHIFTS_DAY` ca/ngày. */
  private siteOpts(n: Npc): Opt[] {
    const g = this.g, h = hourOf(g), open = R.siteOpenAt(h), left = R.siteShiftsLeft(g);
    const pay = R.siteWage(0.6);
    return [
      {
        t: 'Xin một ca phụ hồ — nặng nhưng trả liền',
        sub: !open ? `Công trình nhận người 7h–16h (bây giờ ${Math.floor(h)}h)` : left <= 0 ? `Hôm nay nhận đủ ${R.SITE_SHIFTS_DAY} ca rồi` : `${R.SITE_SHIFT_MIN} phút · ${money(R.SITE_WAGE_MIN)}–${money(R.SITE_WAGE_MAX)} · còn ${left}/${R.SITE_SHIFTS_DAY} ca`,
        off: !open || left <= 0 || g.st.energy < 30,
        fn: () => this.siteShift(n),
      },
      {
        t: 'Hỏi công trình còn mấy tầng',
        fn: () => this.D(who(n), n, 'Anh Sáu chỉ tay lên giàn giáo: “Đổ xong sàn ba là tới mái. Coi vậy mà chậm, mưa một bữa là nghỉ cả buổi. Làm nghề này phải quen với chuyện trời cho làm mới được làm.”', [{ t: 'Vâng anh.' }]),
      },
    ];
  }

  /** Một ca phụ hồ: khuân gạch, trộn hồ, xách nước — trả theo ca, nặng hơn chạy bàn nhưng không đòi uy tín. */
  /**
   * Trả tiền thưởng khéo tay của ca ép mía (lượt 70). Mini-game chấm `good`/`cups`; luật tiền nằm ở
   * `R.miaBonus` nên test được mà không cần dựng cảnh 3D.
   */
  miaBonusPay(good: number, cups: number) {
    const g = this.g, bonus = R.miaBonus(good, cups);
    if (bonus > 0) { R.earn(g, bonus, 'side'); toast(`Chủ quán thưởng thêm ${money(bonus)} vì rót khéo — ${good}/${cups} ly không tràn.`, 'good', 'cash', true); }
    else if (bonus < 0) { R.spend(g, -bonus, 'other'); toast(`Ép tràn mất ${money(-bonus)} tiền mía, chủ trừ vào công. Lần sau bấm đúng vùng xanh nghen.`, 'warn', 'cash', true); }
    g.wd.miaCups = 0;
    ctx.ui.float(`${bonus >= 0 ? '+' : ''}${money(bonus)}`, { x: ctx.player.x, y: 1.4, z: ctx.player.z }, bonus >= 0 ? 'good' : 'bad');
    sfx(bonus >= 0 ? 'coin' : 'nope');
  }
  /** Trả tiền thưởng/phạt của ca phụ hồ (lượt 70) — luật nằm ở `R.siteBonus`. */
  siteBonusPay(good: number, loads: number) {
    const g = this.g, bonus = R.siteBonus(good, loads);
    if (bonus > 0) { R.earn(g, bonus, 'side'); toast(`Cai công trình thưởng ${money(bonus)}: ${good}/${loads} xe đầy vừa, không đổ vãi.`, 'good', 'cash', true); }
    else if (bonus < 0) { R.spend(g, -bonus, 'other'); toast(`Đổ vãi mất ${money(-bonus)} tiền đất — bị trừ vào công. Canh tay lại nghen.`, 'warn', 'cash', true); }
    g.wd.siteCups = 0;
    ctx.ui.float(`${bonus >= 0 ? '+' : ''}${money(bonus)}`, { x: ctx.player.x, y: 1.4, z: ctx.player.z }, bonus >= 0 ? 'good' : 'bad');
  }
  private siteShift(n: Npc) {
    const g = this.g;
    if (!R.siteOpenAt(hourOf(g))) { toast('Công trình chỉ nhận người 7h–16h.', 'info', 'clock'); return; }
    if (R.siteShiftsLeft(g) <= 0) { toast(`Hôm nay bạn đã làm đủ ${R.SITE_SHIFTS_DAY} ca phụ hồ rồi — mai ra sớm nha.`, 'info', 'clock'); return; }
    if (g.st.energy < 30) { toast('Kiệt sức rồi, khuân gạch kiểu này thì ngã giữa công trình. Ăn ngủ rồi quay lại.', 'bad', 'bolt'); return; }
    const pay = R.siteWage(Math.random());
    R.advance(g, R.SITE_SHIFT_MIN, this.act());
    R.earn(g, pay, 'side');
    // Nặng nhất trong ba nghề phụ: tốn sức, bẩn người, nhưng đói nhanh nên cũng phải ăn.
    R.consume(g, { e: -24, h: -7, t: -8, hy: -7, m: -2 });
    g.wd.siteShifts = (g.wd.siteShifts ?? 0) + 1;
    const left = R.siteShiftsLeft(g);
    ctx.ui.float(`+${money(pay)}`, { x: ctx.player.x, y: 1.3, z: ctx.player.z }, 'good');
    sfx('fix');
    toast(`Phụ hồ một ca: nhận ${money(pay)}. Bụi đất bám đầy người nhưng có tiền cầm tay.` + (left > 0 ? ` Còn ${left} ca hôm nay.` : ` Hết ${R.SITE_SHIFTS_DAY} ca của ngày.`), 'good', 'cash', true);
    ctx.npcs.say(n, 'Được đó, làm không nghỉ tay. Cầm tiền đi, mai còn việc tui kêu.', 3, 1);
    // Lượt 70: ca phụ hồ nay có mini-game xúc đất (1–2 phút thật). Điểm khéo tay cộng/trừ vào công ở `siteBonusPay`.
    ctx.anim.startSiteShift(n);
  }

  /** Một ca phụ bán nước mía: rửa mía, ép, rót ly, lau bàn — có tiền công và hao sức. */
  private miaShift(n: Npc, where: 'xe' | 'quan') {
    const g = this.g;
    if (R.miaShiftsLeft(g) <= 0) { toast(`Hôm nay bạn đã phụ bán đủ ${R.MIA_SHIFTS_DAY} ca nước mía rồi — mai quay lại nhé.`, 'info', 'clock'); return; }
    if (!R.miaOpenAt(hourOf(g), where)) { toast('Ngoài giờ bán, chủ quán chưa cần người.', 'info', 'clock'); return; }
    if (g.st.energy < 22) { toast('Mệt quá, đứng ép mía cả tiếng không nổi. Ăn ngủ rồi quay lại.', 'bad', 'bolt'); return; }
    const pay = R.miaWage(g.rep);
    R.advance(g, R.MIA_SHIFT_MIN, this.act());
    R.earn(g, pay, 'side');
    R.consume(g, { e: -14, t: -6, hy: -3, m: 1 });
    g.wd.miaShifts = (g.wd.miaShifts ?? 0) + 1;
    const left = R.miaShiftsLeft(g);
    ctx.ui.float(`+${money(pay)}`, { x: ctx.player.x, y: 1.3, z: ctx.player.z }, 'good');
    sfx('coin');
    toast(`Phụ bán nước mía một ca: nhận ${money(pay)}. Tay mỏi nhừ nhưng có tiền.` + (left > 0 ? ` Còn ${left} ca hôm nay.` : ` Hết ${R.MIA_SHIFTS_DAY} ca của ngày rồi.`), 'good', 'cash', true);
    ctx.npcs.say(n, 'Giỏi lắm, khách đông mà con làm gọn. Cầm lấy, mai ghé nữa nghen.', 3, 1);
    ctx.anim.startMiaShift(n, where);
  }
  private gardenCafeOpts(n?: Npc): Opt[] {
    const g = this.g, h = hourOf(g), say = (t: string) => { if (n) ctx.npcs.say(n, t, 2.8, 1); };
    const drink = (name: string, cost: number, mins: number, m: number, t: number, e: number, msg: string): Opt => ({
      t: `${name} — ${money(cost)}`,
      sub: `${mins} phút · tinh thần +${m} · đỡ khát`,
      off: g.cash < cost,
      fn: () => {
        if (!R.spend(g, cost, 'food')) return;
        R.advance(g, mins, this.act());
        R.consume(g, { m, t, e });
        sfx('drink');
        toast(msg, 'good', 'star');
        say('Chờ anh chút, có liền nha em. Ra bàn ngồi cho mát!');
        ctx.anim.startGardenCafe(name);
      },
    });
    return [
      drink('Uống cà phê sữa đá', 25000, 30, 14, 14, 5, 'Cà phê pha phin thơm đậm, ngồi dưới tán cây mát rượi.'),
      drink('Uống trà đào cam sả', 30000, 25, 15, 22, 4, 'Trà đào thanh mát, thơm mùi sả và lát cam tươi.'),
      drink('Gọi bạc xỉu & đọc sách', 28000, 40, 18, 16, 6, 'Ly bạc xỉu béo nhẹ, đọc vài trang sách thấy đầu óc thư thái hẳn.'),
      {
        t: 'Xin phụ chạy bàn một ca — 60 phút',
        sub: R.cafeShiftsLeft(g) > 0 ? `Công ${money(this.cafePay())} · còn ${R.cafeShiftsLeft(g)}/${R.CAFE_SHIFTS_DAY} ca hôm nay (6h30–22h)` : `Hôm nay đã chạy đủ ${R.CAFE_SHIFTS_DAY} ca`,
        off: g.st.energy < 28 || h < 6.5 || h >= 22 || R.cafeShiftsLeft(g) <= 0,
        fn: () => this.cafeShift(true),
      },
    ];
  }
  gardenCafeMenu() {
    const n = ctx.npcs.fixed.get('cafe');
    this.D('Cà phê Sân Vườn', undefined, 'Quán cà phê bàn gỗ nhỏ xinh dưới hàng cây xanh, khách ngồi chuyện trò rôm rả. Chọn đồ uống hay làm một ca phụ quán?', [...this.gardenCafeOpts(n), { t: 'Thôi, đi nha.' }]);
  }

  // ───────────────────────── Xin tiền ─────────────────────────
  ringBell(hid: 'canho' | 'nharieng' | 'cuahang', bellAnchor?: { x: number; z: number; yaw: number }) {
    const p = ctx.player, n = ctx.npcs.fixed.get(hid);
    ctx.player.gesture('work', 0.42);
    ctx.sound.play('bell');
    ctx.interact.openBellDoor(hid, 16);
    if (!n) { toast('Đing đong! Nhưng không thấy ai ở nhà.', 'info'); return; }
    let ax = bellAnchor?.x ?? p.x, az = bellAnchor?.z ?? p.z;
    // Đi ra ĐÚNG ô cửa của căn: vị trí bản lề + nửa bề ngang cánh, đứng về phía người chơi.
    // (Trước đây lấy neo chuông làm tâm nên với cửa lệch khỏi neo thì nhân vật hiện ra ngay giữa tường.)
    const dr = ctx.interact.bellDoor(hid);
    if (dr) {
      const { x: hx, z: hz, yaw, w } = dr.d;
      const cx = hx + Math.cos(yaw) * w * 0.5, cz = hz + Math.sin(yaw) * w * 0.5;   // giữa ô cửa
      const nx = -Math.sin(yaw), nz = Math.cos(yaw);                                 // pháp tuyến của cánh cửa
      const side = (p.x - cx) * nx + (p.z - cz) * nz >= 0 ? 1 : -1;                   // phía người chơi đứng = phía ngoài
      ax = cx + nx * side * 0.15; az = cz + nz * side * 0.15;
    }
    const dl2 = Math.hypot(p.x - ax, p.z - az) || 1, ux = (p.x - ax) / dl2, uz = (p.z - az) / dl2;
    // Điểm đứng ngay trước cửa (ngoài hiên, đối diện người chơi) và điểm xuất phát ngay sau cánh cửa đang mở
    const outX = ax + ux * 0.9, outZ = az + uz * 0.9;
    const inX = ax - ux * 1.45, inZ = az - uz * 1.45;
    n.x = inX; n.z = inZ; n.hidden = false; n.rig.root.visible = true;
    n.bellOut = { x: outX, z: outZ, yaw: Math.atan2(p.x - outX, p.z - outZ), until: ctx.time + 27 };
    toast('Đing đong! Chủ nhà đang mở cửa bước ra...', 'info', 'home');
    ctx.npcs.say(n, 'Ai bấm chuông vậy? Chờ chút nha!', 3.2);
    // Chờ cửa xoay mở xong rồi mới nói chuyện (trước đây 0,62 giây, cửa chưa kịp mở đã thấy mặt).
    setTimeout(() => {
      if (ctx.mode === 'play') {
        ctx.player.face(n.x, n.z);
        this.talk(n);
      }
    }, 1620);
  }
  beg(n: Npc) {
    const g = this.g, a = n.arch;
    ctx.player.gesture('wave', 0.65);
    if (n.asked) { ctx.npcs.say(n, 'Hồi nãy xin rồi mà!', 2, 3); return; }
    const go = (style: 'lephep' | 'kekho' | 'naini') => {
      n.asked = true; const w = R.wx(g);
      let p = a.beg[style] * w.beg / (1 + g.wd.begTired / 9);
      if (g.stall.tier >= 2) p *= 0.3; if (g.st.hygiene < 30) p *= style === 'kekho' ? 1.15 : 0.85; if (g.st.health < 40) p *= 1.2; if (R.isNight(g)) p *= 0.7;
      g.wd.begTired += style === 'naini' ? 1.5 : 1; R.advance(g, 2, this.act());
      if (rnd.chance(clamp(p, 0, 0.92))) {
        if (rnd.chance(a.beg.food)) { addStack(g.bag, { id: 'banhmi', n: 1, fresh: 85, q: 0.8, cost: 0 }); ctx.npcs.say(n, R.say(rnd.pick(LINES.beg_food), a, n.fem, g), 3, 1); toast('Được cho một ổ bánh mì.', 'good', 'heart'); }
        else { const amt = Math.max(500, round500(rnd.range(a.beg.amt[0], a.beg.amt[1]) * (style === 'kekho' ? 1.15 : 1))); R.earn(g, amt, 'side'); g.tot.begged += amt; ctx.npcs.say(n, R.say(rnd.pick(LINES.beg_give), a, n.fem, g), 3, 1); sfx('coin'); ctx.ui.float(`+${money(amt)}`, n, 'good'); }
        g.st.mood = clamp(g.st.mood - 1, 0, STAT_MAX);
        if (rnd.chance(0.3)) setTimeout(() => n.state !== 'gone' && ctx.npcs.say(n, R.say(rnd.pick(LINES.beg_chat), a, n.fem, g), 4.5), 3200);
      } else {
        // hiếm khi người bị xin tiền mất bình tĩnh: khạc nhổ, có khi quay ra đuổi
        if (rnd.chance(0.08) && a.beg[style] > 0.15) { ctx.npcs.spit(n); return; }
        const annoyed = style === 'naini' && rnd.chance(0.5);
        if (annoyed && rnd.chance(0.22)) { ctx.npcs.chase(n, 3.6); g.st.mood = clamp(g.st.mood - 5, 0, STAT_MAX); g.rep = clamp(g.rep - 0.4, 0, 100); return; }
        ctx.npcs.say(n, R.say(rnd.pick(annoyed ? LINES.beg_annoyed : LINES.beg_refuse), a, n.fem, g), 2.6, annoyed ? 4 : 3); g.st.mood = clamp(g.st.mood - (annoyed ? 4 : 1.5), 0, STAT_MAX);
        if (annoyed) { g.rep = clamp(g.rep - 0.3, 0, 100); sfx('boo'); const cop = ctx.npcs.near(n.x, n.z, 18, (c) => c.arch.id === 'congan'); if (cop) setTimeout(() => { ctx.npcs.say(cop, 'Này! Không được đeo bám làm phiền người đi đường!', 3.5, 4); g.st.mood = clamp(g.st.mood - 5, 0, STAT_MAX); }, 1500); }
      }
    };
    if (a.id === 'congan') { ctx.npcs.say(n, 'Ăn xin ở đây là không được đâu nhé. Kiếm việc mà làm.', 3, 3); n.asked = true; return; }
    if (a.id === 'giangho') { ctx.npcs.say(n, 'Biến! Tao còn đang kẹt tiền đây.', 2.5, 4); n.asked = true; return; }
    this.D(who(n), n, 'Bạn bước tới, hơi ngượng. Mở lời thế nào đây?', [
      { t: 'Lễ phép xin giúp đỡ', sub: '"Dạ, cho con xin chút tiền lẻ mua ổ bánh mì…"', fn: () => go('lephep') },
      { t: 'Kể hoàn cảnh', sub: '"Con ở quê lên, mất hết giấy tờ, hai ngày chưa ăn gì…"', fn: () => go('kekho') },
      { t: 'Nài nỉ, bám theo', sub: 'Đôi khi được, nhưng dễ bị mắng — có công an gần đó thì càng rắc rối', fn: () => go('naini') },
      { t: 'Thôi, ngại quá.' }]);
  }

  // ───────────────────────── Nhặt ve chai & bới thùng rác ─────────────────────────
  spawnLitter() {
    const g = this.g, Rn = new RNG(g.seed + g.day * 977), pts = ctx.world.litter; this.litter = [];
    pts.forEach(([x, z], i) => { if (!Rn.chance(0.62) || ctx.world.blocked(x, z, 0.2)) return; const id = Rn.weighted(['chai', 'lon', 'bia', 'sat'], (k) => ({ chai: 5, lon: 4, bia: 2, sat: 0.8 }[k]!))!; if (!g.wd.picked.includes(i)) this.litter.push({ i, x, z, id }); });
    this.litterKey = '';
  }
  private drawLitter() {
    const key = this.litter.map((l) => l.i).join(','); if (key === this.litterKey) return; this.litterKey = key;
    if (this.litterMesh) { ctx.scene.remove(this.litterMesh); this.litterMesh.geometry.dispose(); this.litterMesh = null; }
    if (this.glint) { ctx.scene.remove(this.glint); this.glint.geometry.dispose(); this.glint = null; }
    if (!this.litter.length) return; const m = new MB(), gl = new MB(), Rn = new RNG(5);
    // Vẽ to hơn thật một chút và thêm đốm sáng lơ lửng phía trên — trên màn hình điện thoại đồ nhỏ rất khó thấy.
    for (const l of this.litter) { const y = groundY(l.x, l.z) + 0.01, j = JUNK[l.id];
      if (l.id === 'chai') { const a = Rn.range(0, 3); m.rod(l.x, y + 0.055, l.z, 0.055, 0.3, j.c, Math.PI / 2, 0, 7, a); m.rod(l.x + Math.sin(a) * 0.17, y + 0.055, l.z + Math.cos(a) * 0.17, 0.024, 0.05, 0x2f8fd5, Math.PI / 2, 0, 6, a); }
      else if (l.id === 'lon') { const a = Rn.range(0, 3); m.rod(l.x, y + 0.05, l.z, 0.05, 0.16, 0xd9463c, Math.PI / 2, 0, 7, a); m.rod(l.x + Math.sin(a) * 0.085, y + 0.05, l.z + Math.cos(a) * 0.085, 0.05, 0.012, j.c, Math.PI / 2, 0, 7, a); m.rod(l.x - Math.sin(a) * 0.085, y + 0.05, l.z - Math.cos(a) * 0.085, 0.05, 0.012, j.c, Math.PI / 2, 0, 7, a); }
      else if (l.id === 'bia') m.box(l.x, y, l.z, 0.5, 0.035, 0.36, j.c, 0xc9aa7a, 0.1); else { m.box(l.x, y, l.z, 0.32, 0.06, 0.09, j.c, 0x8a7a72); m.rod(l.x + 0.07, y + 0.04, l.z + 0.07, 0.022, 0.36, 0x6a5a52, Math.PI / 2, 0, 5, 1); }
      gl.sph(l.x, y + 0.5, l.z, 0.04, 0.065, 0.04, 0xffe066, 4, 0xfff6c8);
    }
    this.litterMesh = new THREE.Mesh(m.build(), MAT.lit); ctx.scene.add(this.litterMesh);
    this.glint = new THREE.Mesh(gl.build(), MAT.unlit); ctx.scene.add(this.glint);
  }
  pickLitter(l: { i: number; x: number; z: number; id: string }) {
    const g = this.g, j = JUNK[l.id];
    if (R.bagWeight(g) + j.kg > R.carryCap(g)) { toast('Túi đầy rồi, không nhặt thêm được.', 'warn', 'bag'); return; }
    ctx.player.gesture('rummage', 0.45);
    g.junk[l.id] = (g.junk[l.id] ?? 0) + 1; g.wd.picked.push(l.i); this.litter.splice(this.litter.indexOf(l), 1); sfx('pick'); ctx.ui.float(`+1 ${j.name}`, { x: l.x, y: 0.5, z: l.z }, 'info'); g.st.hygiene = clamp(g.st.hygiene - 0.4, 0, STAT_MAX);
  }
  rummage(i: number) {
    const g = this.g, b = ctx.world.bins[i];
    if (g.wd.bins[i] === g.day) { toast('Thùng này hôm nay bạn bới rồi, chẳng còn gì.', 'info'); return; }
    ctx.player.gesture('rummage', 0.95);
    g.wd.bins[i] = g.day; R.advance(g, 4, this.act()); g.st.hygiene = clamp(g.st.hygiene - 4, 0, STAT_MAX); sfx('rummage');
    // Gộp mọi thứ bới được vào MỘT dòng chữ: trước đây mỗi món một dòng nổi lên cùng một toạ độ nên chữ
    // chồng lên nhau, đọc không ra ("+2 Chai nhựa" đè lên "+1 Lon nhôm").
    const r = rnd.next(), got: string[] = [];
    const give = (id: string, n: number) => { g.junk[id] = (g.junk[id] ?? 0) + n; got.push(`+${n} ${JUNK[id].name}`); };
    if (r < 0.05) { const id = rnd.pick(['dongho', 'radio', 'nhan']); give(id, 1); toast(`Trúng mánh! Bới được ${JUNK[id].name.toLowerCase()} — đem ra tiệm cầm đồ Chú Lâm bán.`, 'good', 'star', true); }
    else if (r < 0.2) this.D('Thùng rác', undefined, 'Có nửa ổ bánh mì ai bỏ lại, còn khá lành lặn… Ăn không?', [{ t: 'Ăn luôn (đỡ đói, có thể đau bụng)', fn: () => { R.consume(g, { h: 16, m: -3 }, R.stomachChance(g, { risky: 0.3 })); sfx('eat'); } }, { t: 'Thôi, ghê quá.' }]);
    else if (r < 0.78) { give('chai', rnd.int(1, 3)); if (rnd.chance(0.6)) give('lon', rnd.int(1, 2)); if (rnd.chance(0.25)) give('bia', 1); }
    else toast('Chỉ toàn rác… chẳng có gì dùng được.', 'info');
    if (got.length) ctx.ui.float(got.join(' · '), { x: b.x, y: 1.1, z: b.z }, 'info');
    if (R.bagWeight(g) > R.carryCap(g)) toast('Túi nặng quá rồi, đi chậm hẳn. Đem ve chai đi bán thôi!', 'warn', 'bag');
  }

  // ───────────────────────── Việc làm thêm ─────────────────────────
  dockTake() {
    const j = this.job, g0 = this.g;
    if (j?.kind !== 'dock' || j.carrying) return;
    if (R.sacksLeft(g0) <= 0) { this.job = null; ctx.player.setCarry(''); this.way = null; toast(`Hôm nay đã vác đủ ${R.DOCK_SACKS_DAY} bao rồi. Mai ra sớm nha em.`, 'info', 'box'); return; }
    if (this.g.st.energy < 8) { toast('Kiệt sức rồi, không vác nổi nữa. Đi ăn rồi nghỉ đi.', 'bad'); return; }
    j.carrying = true; ctx.player.setCarry('sack'); sfx('pick'); this.setWay('v_m_kho', 'Sạp gạo Bà Hai — giao bao hàng');
  }
  dockDrop() {
    const j = this.job, g = this.g; if (j?.kind !== 'dock' || !j.carrying) return; j.carrying = false; ctx.player.setCarry('');
    // Đã lấy bao trên vai từ trước mà hôm nay vác đủ trần rồi thì trả bao lại, không trả tiền — nếu không sẽ vác lố.
    if (R.sacksLeft(g) <= 0) { this.job = null; this.way = null; toast(`Đủ ${R.DOCK_SACKS_DAY} bao hôm nay rồi, trả bao lại cho anh Sáu. Mai ra sớm nha.`, 'info', 'box'); return; }
    g.wd.sacks++; R.earn(g, R.DOCK_SACK_PAY, 'side'); sfx('coin'); g.st.energy = clamp(g.st.energy - 2.5, 0, STAT_MAX); g.st.hunger = clamp(g.st.hunger - 1.2, 0, STAT_MAX); g.st.hygiene = clamp(g.st.hygiene - 1, 0, STAT_MAX);
    ctx.ui.float(`+${money(R.DOCK_SACK_PAY)}`, { x: ctx.player.x + ctx.player.fwd[0], y: 1.3, z: ctx.player.z + ctx.player.fwd[1] }, 'good');
    if (R.sacksLeft(g) <= 0) { this.job = null; this.way = null; toast(`Vác đủ ${R.DOCK_SACKS_DAY} bao hôm nay rồi! Kiếm được ${money(R.DOCK_SACKS_DAY * R.DOCK_SACK_PAY)}.`, 'good', 'cash'); }
    else { this.setWay('dock', `Xe tải — lấy bao hàng (còn ${R.sacksLeft(g)} bao)`); toast(`Còn ${R.sacksLeft(g)} bao nữa là hết hàng hôm nay.`, 'info', 'box'); }
  }
  dishes() {
    const a = ctx.world.anchors.sink, g = this.g, c = Math.cos(a.yaw), s = Math.sin(a.yaw);
    const st = { x: a.x, y: a.y + 0.02, z: a.z, yaw: a.yaw, cam: new THREE.Vector3(a.x - s * 0.5, a.y + 0.78, a.z - c * 0.5), look: new THREE.Vector3(a.x + s * 0.02, a.y, a.z + c * 0.02) };
    ctx.player.x = a.x - s * 0.75; ctx.player.z = a.z - c * 0.75; ctx.player.yaw = a.yaw; this.way = null;
    ctx.cook.wash(st, 8, (score) => {
      this.job = null; if (score < 0) { toast('Bỏ ngang việc rửa chén, Bà Tư không trả công.', 'warn'); return; }
      const pay = round1k(8 * 4000 * (0.75 + 0.25 * score)); g.wd.plates++; R.earn(g, pay, 'side'); R.consume(g, { h: 45 * 2.5, t: 10 * 2.5, m: 3 }); g.st.hygiene = clamp(g.st.hygiene + 6, 0, STAT_MAX); g.st.energy = clamp(g.st.energy - 6, 0, STAT_MAX); R.changeRel(g, 'eatery', 4, true);
      const n = ctx.npcs.fixed.get('eatery'); toast(`Rửa xong 8 cái đĩa: nhận ${money(pay)} và một bữa cơm của Bà Tư.`, 'good', 'cash', true); if (n) ctx.npcs.say(n, 'Sạch đó! Ăn cơm đi con rồi hãy về.', 3, 1);
    });
  }
  board() {
    const g = this.g, j = this.job, opts: Opt[] = [];
    if (j?.kind === 'delivery') { this.D('Bảng việc làm', undefined, `Bạn đang nhận giao gói hàng tới ${j.name}. Hạn chót ${hhmm(j.until % 1440)}.`, [{ t: 'Trả lại gói hàng (bỏ việc)', fn: () => { this.dropReceiver(); this.job = null; ctx.player.setCarry(''); this.way = null; } }, { t: 'Đi giao tiếp.' }]); return; }
    if (g.wd.deliveries < 4 && !j) {
      const p = ctx.player, cands = NAV.filter((n) => n.tag === 'home' && n.door && dist2(n.x, n.z, p.x, p.z) > 50 * 50);
      for (let k = 0; k < 2 && cands.length; k++) {
        const n = cands[Math.floor(new RNG(g.seed + g.day * 31 + g.wd.deliveries * 7 + k).next() * cands.length)], d = Math.sqrt(dist2(n.x, n.z, p.x, p.z)), pay = round1k(9000 + d * 130), mins = Math.round(d / 3.0 / 60 * MIN_PER_SEC * 60 * 1.9 + 12);
        const name = `nhà số ${10 + (n.id * 7) % 180}, ${DISTRICT[n.district].name}`;
        opts.push({ t: `Giao hàng tới ${name}`, sub: `${Math.round(d)} m · công ${money(pay)} · trong ${mins} phút`, fn: () => {
          this.job = { kind: 'delivery', x: n.door![0], z: n.door![1], name, pay, until: absMin(g) + mins };
          ctx.player.setCarry('box'); this.way = { x: n.door![0], z: n.door![1], name: 'Giao hàng: ' + name }; g.wd.deliveries++; sfx('pick');
          this.receiver = ctx.npcs.deliverHere(n.door![0], n.door![1], 'Người nhận hàng');
          toast(`Đã nhận gói hàng. Tới ${name} — người nhận đứng chờ sẵn ở cửa, theo cột sáng vàng!`, 'info', 'box', true);
        } });
      }
    }
    const h = hourOf(g);
    this.D('Bảng việc làm hôm nay', undefined, this.jobListText(), [...opts, { t: 'Đóng' }]);
  }
  /**
   * Bảng việc làm (lượt 59): mỗi việc một dòng, ghi ĐÚNG số của ngày hôm nay — còn mấy bao, còn mấy ca,
   * còn mấy đơn giao — và ghi cả việc đã hết (kèm lý do) thay vì lặng lẽ bỏ đi. Trước đây bảng chỉ có bốn
   * dòng chữ cứng, số bao/ca bị chép tay nên lệch với luật thật trong mã.
   */
  jobListText() {
    const g = this.g, h = hourOf(g);
    const sackOn = h >= 4.5 && h < 10, cafeOn = h >= 6.5 && h < 22;
    const lines: string[] = [];
    // Đánh số chứ đừng dùng emoji: font của game không có bảng emoji, đầu dòng sẽ ra ô trống.
    // Mỗi việc gói trong MỘT dòng — trước đây mỗi việc hai dòng nên bảng 7 việc dài hơn hộp thoại, phải cuộn mới thấy nút.
    const add = (name: string, res: string) => lines.push(`${lines.length + 1}. ${name} — ${res}`);
    const left = R.sacksLeft(g);
    add('Vác hàng bến chợ (4h30–10h)', left > 0
      ? (sackOn ? `còn ${left}/${R.DOCK_SACKS_DAY} bao · ${money(R.DOCK_SACK_PAY)}/bao` : `còn ${left}/${R.DOCK_SACKS_DAY} bao, ngoài giờ`)
      : `đã vác đủ ${R.DOCK_SACKS_DAY} bao hôm nay`);
    const cargo = R.dockShiftsLeft(g);
    add('Ca bốc cá bến cảng (4h30–10h, 110 phút)', cargo > 0
      ? `còn ${cargo}/${R.DOCK_SHIFTS_DAY} ca · ${money(R.DOCK_WAGE_MIN)}–${money(R.DOCK_WAGE_MAX)}/ca`
      : `đã làm đủ ${R.DOCK_SHIFTS_DAY} ca hôm nay`);
    const cafe = R.cafeShiftsLeft(g);
    add('Chạy bàn cà phê Bóng Đá / Sân Vườn (6h–22h, 60 phút)', cafe > 0
      ? `còn ${cafe}/${R.CAFE_SHIFTS_DAY} ca · ${money(this.cafePay())}/ca + boa${cafeOn ? '' : ', ngoài giờ'}`
      : `đã chạy đủ ${R.CAFE_SHIFTS_DAY} ca hôm nay`);
    add('Rửa chén quán cơm Bà Tư (10h–14h30, 17h30–21h)', g.wd.plates >= 2 ? 'hôm nay rửa đủ 2 lượt rồi' : `còn ${2 - g.wd.plates}/2 lượt · 4.000₫/đĩa + một bữa cơm`);
    const del = Math.max(0, 4 - g.wd.deliveries);
    add('Giao hàng trong khu phố (nhận lúc nào cũng được)', del > 0 ? `còn ${del}/4 đơn hôm nay · 9.000₫ + 130₫/mét` : 'hết đơn hôm nay rồi, mai quay lại');
    add('Thu mua ve chai', 'lượm lon, chai, giấy quanh thùng rác — bán cho Ông Tư Rác hoặc Bà Chín');
    add('Việc khác', 'phụ bốc hàng ở chợ, xin tiền người qua đường, lao động ở buồng tạm giữ…');
    const warn = h < 4.5 || h >= 22 ? '\n\nGiờ này gần như không còn việc nào mở — nằm nghỉ, sáng mai ra sớm.' : '';
    return lines.join('\n') + warn;
  }
  private deliveryCheck() {
    const j = this.job, g = this.g; if (j?.kind !== 'delivery') return;
    if (dist2(ctx.player.x, ctx.player.z, j.x, j.z) < 2.6 * 2.6) {
      const late = absMin(g) > j.until, pay = late ? round1k(j.pay * 0.5) : j.pay;
      const who = this.receiver;
      R.earn(g, pay, 'side'); sfx('coin'); ctx.player.setCarry(''); this.job = null; this.way = null;
      if (who) { ctx.npcs.say(who, late ? 'Trễ vậy hả chú em… thôi để đó tui trả nửa.' : 'Đủ rồi, cảm ơn chú em nha!', 3.2, 1); ctx.npcs.remove(who); this.receiver = null; }
      toast(late ? `Giao trễ, chủ nhà chỉ trả ${money(pay)}.` : `Giao hàng đúng hẹn: nhận ${money(pay)}.`, late ? 'warn' : 'good', 'box', true);
      g.rep = clamp(g.rep + (late ? 0 : 0.2), 0, 100);
    }
  }

  // ───────────────────────── Ăn uống, tắm rửa, ngủ nghỉ ─────────────────────────
  eat(list: Stack[], idx: number) {
    const g = this.g, s = list[idx]; if (!s) return; const d = INGS[s.id]; if (!d.eat) return;
    const dr = !!(d.eat.t && !d.eat.h);
    ctx.player.gesture('drink', 0.8);
    // đồ ăn sẵn mua ngoài: rủi ro nền 6 %, thêm nếu để lâu; đồ uống đóng chai thì thấp hơn
    const risk = R.stomachChance(g, { bought: true, risky: s.fresh < 35 ? 0.30 : 0 });
    R.consume(g, d.eat, risk);
    // Đồ uống tăng lực (cột `st`, vd Shapi): hồi thẳng vào thanh thể lực của người chơi, kẹp theo trần hiện tại.
    if (d.eat.st) {
      const p = ctx.player, before = p.stamina, after = R.staminaAfter(before, p.staminaCap, d.eat.st);
      p.stamina = after; if (after > 0.3) p.tired = false;
      toast(`${d.name}: thanh thể lực +${Math.round((after - before) * 100)} % — chạy tiếp được rồi.`, 'good', 'bolt');
    }
    g.led.food += s.cost; s.n -= 1; if (s.n <= 1e-6) list.splice(idx, 1); sfx(dr ? 'drink' : 'eat'); bus.emit('ui', 'eat');
  }
  eatDish(i: number) {
    const g = this.g, rd = g.stall.ready[i]; if (!rd) return; const r = RECIPES[rd.rid];
    ctx.player.gesture('drink', 0.85);
    // tự nấu: từ 2 sao trở lên gần như không đau bụng, dưới 2 sao thì vẫn có rủi ro (thấy ở toast)
    const stars = R.dishStars(rd);
    const risk = R.stomachChance(g, { selfMade: true, stars });
    R.consume(g, { h: r.fill, t: r.cat === 'nuoc' || r.cat === 'che' ? 30 : 4, m: 2 + rd.q * 5 }, risk);
    g.led.food += rd.cost; rd.n--; if (rd.n <= 0) g.stall.ready.splice(i, 1); sfx('eat');
    const note = stars >= 3 ? ' · no lâu, bụng êm' : stars >= 2 ? ' · ăn ổn' : ' · hơi khó tiêu';
    toast(`Ăn một phần ${r.name.toLowerCase()} của chính mình. ${rd.q > 0.75 ? 'Ngon thật!' : rd.q > 0.45 ? 'Cũng được.' : 'Ờm… dở ẹc.'}${note}`, stars >= 2 ? 'good' : 'info', 'dish');
    bus.emit('ui', 'eat');
  }
  // ───────────────────────── Đấm & nhảy ─────────────────────────
  /** Bật nhảy tại chỗ. Tốn chút sức, không đổi gì trên bản đồ. */
  jump() {
    const g = this.g, p = ctx.player;
    if (ctx.mode !== 'play' || this.jumpCd > 0) return;
    if (p.carry === 'ganh' || p.carry === 'xeday' || p.carry === 'sack') { toast('Đang cõng hàng nặng, nhảy không nổi.', 'info'); this.jumpCd = 0.5; return; }
    if (g.st.energy < 3) { toast('Mệt rũ người, nhảy không nổi nữa.', 'warn', 'bolt'); this.jumpCd = 0.6; return; }
    if (!p.jump()) return;
    this.jumpCd = 0.5; g.st.energy = clamp(g.st.energy - 0.7, 0, STAT_MAX); sfx('jump');
  }
  /** Đấm một cái: trúng ai thì người đó la lên, có người quay lại đánh, có người bỏ chạy. */
  punch() {
    if (ctx.mode !== 'play' || this.punchCd > 0 || ctx.player.stunT > 0) return;
    const g = this.g, p = ctx.player;
    this.punchCd = 0.9;
    p.gesture('punch', 0.38);
    ctx.sound.play('whoosh');
    const [fx, fz] = p.fwd;
    let best: Npc | null = null, bd = 1.7 * 1.7;
    for (const n of ctx.npcs.list) {
      if (n.hidden || n.kind === 'kid') continue;
      const dx = n.x - p.x, dz = n.z - p.z, d2 = dx * dx + dz * dz; if (d2 > bd) continue;
      const dot = (dx * fx + dz * fz) / (Math.sqrt(d2) || 1); if (dot < 0.45) continue;
      bd = d2; best = n;
    }
    g.st.energy = clamp(g.st.energy - 1.2, 0, STAT_MAX);
    if (!best) { this.working = 0.25; return; }
    this.working = 0.35;
    ctx.npcs.hit(best);
    P.addHeat(g, P.HEAT_PUNCH);
  }
  // ───────────────────────── Bệnh viện Phước An ─────────────────────────
  /** Ngất vì sức khoẻ về 0: mất tiền, mất đồ, tỉnh dậy ở bệnh viện sáng hôm sau. */
  checkFaint() {
    const g = this.g;
    if (this.fainting || ctx.mode !== 'play' || g.st.health > 0) return;
    this.fainting = true;
    const res = R.faint(g);
    ctx.sound.play('boo'); ctx.player.frozen = true;
    ctx.ui.fade(true, 1.5);
    const now = g.day * 1440 + g.min, target = Math.floor(now / 1440) * 1440 + 360;
    const dm = target > now ? target - now : target + 1440 - now;
    setTimeout(() => {
      R.advance(g, dm, { moving: false, running: false, sleeping: true, sheltered: true, working: false, load: 0, sleepQ: 0.4 });
      // Bệnh viện cho ăn cháo và truyền nước: tỉnh dậy không thể kiệt sức tới mức ngất tiếp.
      g.st.health = Math.max(g.st.health, 45); g.st.hunger = Math.max(g.st.hunger, 30); g.st.thirst = Math.max(g.st.thirst, 30);
      // Đồ nhặt được giữ ở quầy thất lạc tới hết ngày hôm bạn tỉnh dậy.
      if (g.lostBag.length) g.lostDay = g.day;
      const a = ctx.world.anchors['giuong_benhvien'];
      if (a) ctx.player.place(a.x, a.z, a.yaw + Math.PI);
      ctx.player.frozen = false; ctx.ui.fade(false, 1.4);
      this.fainting = false;
      toast(`Bạn ngất giữa đường. Người đi đường đưa vào Bệnh viện Phước An, tỉnh dậy đã ${hhmm(g.min)} sáng hôm sau.`, 'bad', 'heart', true);
      toast(res.fee > 0 ? `Xe cấp cứu với viện phí hết ${money(res.fee)}.` : 'Không còn đồng nào, bệnh viện cho ghi sổ — nhớ trả.', res.fee > 0 ? 'bad' : 'warn', 'cash');
      if (res.lost.length) toast(`Rơi mất ${res.lost.reduce((a, x) => a + x.n, 0)} phần đồ trong ba lô dọc đường.`, 'warn', 'bag');
      sfx('wake'); bus.emit('save', 'ngat');
    }, 1600);
  }
  /** Nói chuyện với bác sĩ trực. */
  hospitalMenu(n: Npc) {
    const g = this.g, exams = g.flags.exam === g.day;
    const opts: Opt[] = [
      { t: `Khám bệnh — ${money(R.EXAM_FEE)}`, sub: exams ? 'Hôm nay khám rồi' : 'Bác sĩ xem rồi nói bệnh gì', off: g.cash < R.EXAM_FEE, fn: () => {
        const d = R.exam(g);
        if (!d) { toast('Không đủ tiền khám.', 'bad', 'cash'); return; }
        sfx('coin'); this.D(who(n), n, d, [{ t: 'Dạ, cảm ơn bác sĩ.', fn: () => this.hospitalMenu(n) }]);
      } },
      { t: 'Nằm phòng hồi sức', sub: `Hồi sức tính theo giờ · ${money(R.RECOVER_FEE)}/giờ`, fn: () => this.hospitalRest(n) },
      { t: 'Quầy thuốc ở đâu bác?', fn: () => this.D(who(n), n, 'Quầy thuốc ngay bên phải cửa ra vào đó con. Thuốc cảm, bông băng, thuốc bổ đều có — mua xong uống liền tại chỗ.', [{ t: 'Dạ, con ra liền.' }]) },
      ...(g.lostBag.length && g.lostDay === g.day ? [{ t: 'Hỏi đồ thất lạc', fn: () => {
        const items = R.claimLost(g);
        if (!items.length) { toast('Không có gì ở quầy thất lạc.', 'info'); return; }
        sfx('coin'); toast(`Nhận lại ${items.reduce((a, x) => a + x.n, 0)} phần đồ: ${items.map((x) => INGS[x.id]?.name ?? x.id).join(', ')}.`, 'good', 'bag', true);
      } }] : []),
    ];
    this.D(who(n), n, g.st.health < 40 ? 'Người gì mà xanh xao vậy con? Ngồi xuống đây, bác sĩ xem cho.' : 'Bệnh viện Phước An, khám bệnh hay mua thuốc gì cứ nói.', [...opts, { t: 'Thôi, con đi nha bác sĩ.' }]);
  }
  /** Menu phòng hồi sức: trả tiền giường rồi nằm hồi sức theo giờ. */
  hospitalRest(n?: Npc) {
    const g = this.g;
    const mk = (h: number, t: string): Opt => ({ t: `${t} — ${money(R.recoverCost(h))}`, sub: `${h} giờ · sức khoẻ +${14 * h}`, off: g.cash < R.recoverCost(h), fn: () => {
      if (!R.recover(g, h)) { toast('Không đủ tiền giường.', 'bad', 'cash'); return; }
      ctx.ui.fade(true, 0.6);
      setTimeout(() => { R.advance(g, h * 60, { ...this.act(), sleeping: true }); ctx.ui.fade(false, 0.8); sfx('wake'); toast(`Nằm phòng hồi sức ${h} giờ. Người khoẻ hơn hẳn.`, 'good', 'heart', true); bus.emit('save', 'hoi suc'); }, 700);
    } });
    this.D('Phòng hồi sức', n, `Giường trắng, rèm kéo, quạt trần chạy êm. Nằm tính theo giờ — ${money(R.RECOVER_FEE)} một giờ.`, [mk(2, 'Nằm 2 giờ'), mk(4, 'Nằm 4 giờ'), mk(8, 'Nằm qua đêm 8 giờ'), { t: 'Thôi, để bữa khác.' }]);
  }
  /** Quầy thuốc trong bệnh viện. */
  medMenu() {
    const g = this.g;
    const opts: Opt[] = R.MED_LIST.map((m) => ({
      t: `${m.name} — ${money(m.price)}`,
      sub: `${m.desc} · máu +${m.hp}${m.cures === 'sick' ? ' · hết cảm' : m.cures === 'stomach' ? ' · hết đau bụng' : ''}${m.e ? ` · sức +${m.e}` : ''}`,
      off: g.cash < m.price, fn: () => {
        if (!R.buyMed(g, m.id)) { toast('Không đủ tiền mua thuốc.', 'bad', 'cash'); return; }
        sfx('coin'); toast(`Mua ${m.name.toLowerCase()}, uống liền tại chỗ.`, 'good', 'heart'); this.medMenu();
      },
    }));
    this.D('Quầy thuốc', undefined, R.isStomach(g) ? 'Cô bán thuốc nhìn bạn ôm bụng: “Đau bụng hả con? Liều thuốc đau bụng uống vô là dịu liền.”' : g.flags.sick ? 'Cô bán thuốc nhìn bạn: “Cảm nặng vậy mà giờ mới tới hả?”' : 'Tủ thuốc kê sau quầy, hộp nào cũng có nhãn rõ ràng.', [...opts, { t: 'Thôi, không mua gì.' }]);
  }
  // ───────────────────────── Công an phường, tạm giữ, lao động ─────────────────────────
  /** Công an gọi lại hỏi giấy tờ: nộp phạt, cãi, bỏ chạy hay theo về phường. */
  caught(n: Npc) {
    if (ctx.mode !== 'play') return;
    const g = this.g;
    if (P.inJail(g)) return;
    ctx.sound.play('siren');
    // Lượt 71: đang giữ hàng cấm trong kho băng thì bị khám thêm — phạt theo bảng hàng cấm + tù cộng thêm,
    // mất sạch hàng và tụt uy tín cả trong băng lẫn ngoài phố. Đây là “hình phạt nặng” người chơi xin.
    const bustFine = GANGSIM.bustFine(g);
    if (bustFine > 0) { this.bustedForContraband(n); return; }
    const f = P.fine(g), canPay = g.cash >= f;
    this.D(n.name, n, 'Chú là công an khu vực. Đánh người giữa đường là gây rối trật tự rồi nghen. Giấy tờ đâu, đưa chú xem.', [
      { t: `Nộp phạt hành chính — ${money(f)}`, sub: canPay ? 'Xong chuyện, đi tiếp' : 'Không đủ tiền nộp', off: !canPay, fn: () => {
        if (!P.payFine(g)) { toast('Không đủ tiền nộp phạt.', 'bad', 'cash'); return; }
        sfx('coin'); toast('Nộp phạt xong, chú công an cho đi. Nhớ đừng đánh nhau nữa.', 'info', 'badge');
        ctx.npcs.leave(n); bus.emit('save', 'nop phat');
      } },
      { t: 'Cãi: “Tại nó chọc con trước”', sub: 'Khoảng 40% chú tin', fn: () => {
        if (rnd.chance(0.4)) { P.letGo(g); toast('Chú công an ghi sổ rồi nhắc: “Thôi được, lần này bỏ qua.”', 'info', 'badge'); ctx.npcs.leave(n); }
        else this.sendToJail(n, 'Cãi không được, theo chú về phường.');
      } },
      { t: 'Bỏ chạy', sub: 'Khoảng 45% thoát', fn: () => {
        if (rnd.chance(0.45)) { P.addHeat(g, 12); toast('Bạn lách vào hẻm, chạy thoát. Nhưng công an đã nhớ mặt.', 'warn', 'badge'); ctx.npcs.leave(n); }
        else { P.addHeat(g, 10); this.sendToJail(n, 'Chạy đâu cho thoát, chú túm lại rồi.'); }
      } },
      { t: 'Đi theo chú về phường', fn: () => this.sendToJail(n) },
    ]);
  }
  /**
   * Bị khám vì hàng cấm (lượt 71): phạt theo bảng hàng cấm, mất hết hàng, tù cộng thêm theo món nặng nhất.
   * Người chơi vẫn có lựa chọn như mọi lần bị gọi — nộp, cãi, chạy — nhưng mức phạt hiện rõ ngay trong câu thoại.
   */
  private bustedForContraband(n: Npc) {
    const g = this.g, fine = GANGSIM.bustFine(g), jail = GANGSIM.bustJail(g), canPay = g.cash >= fine;
    this.D(n.name, n, `Đứng lại. Trong sổ băng của mày có hàng không giấy tờ — ${Object.entries(GANGSIM.stockOf(g)).filter(([, k]) => k > 0).map(([id, k]) => `${k} ${GANGTALK.contraName(id)}`).join(', ')}. Đây là phạt ${money(fine)} cộng ${jail} giờ tạm giữ.`, [
      { t: `Nộp phạt — ${money(fine)}`, sub: canPay ? 'Mất hàng, mất tiền, nhưng xong chuyện' : 'Không đủ tiền nộp', off: !canPay, fn: () => {
        const r = GANGSIM.bust(g);
        if (r.paid < r.fine) { toast('Không đủ tiền nộp phạt — theo chú về phường.', 'bad', 'badge'); }
        toast(`Mất ${money(r.paid)}, mất hết hàng cấm, tụt ${r.respect} uy tín trong băng.`, 'bad', 'skull', true);
        ctx.npcs.leave(n); bus.emit('save', 'nop phat hang cam');
      } },
      { t: 'Cãi: “Hàng đó của người ta gửi”', sub: 'Khoảng 25% chú tin — hàng cấm khó cãi hơn đánh nhau', fn: () => {
        if (rnd.chance(0.25)) { P.letGo(g); toast('Chú công an ghi sổ rồi nhắc: “Lần này bỏ qua, đừng để tôi thấy nữa.”', 'info', 'badge'); ctx.npcs.leave(n); }
        else { const r = GANGSIM.bust(g); this.sendToJail(n, `Cãi không được. Mất ${money(r.paid)} tiền phạt, mất hết hàng.`, P.sentenceHours(g) + r.jail); }
      } },
      { t: 'Bỏ chạy', sub: 'Khoảng 35% thoát — hàng cấm mà chạy là bị để ý nặng', fn: () => {
        if (rnd.chance(0.35)) { P.addHeat(g, 20); toast('Bạn lách vào hẻm, chạy thoát — nhưng hàng vẫn nằm trong kho băng.', 'warn', 'badge'); ctx.npcs.leave(n); }
        else { const r = GANGSIM.bust(g); P.addHeat(g, 15); this.sendToJail(n, `Chạy không thoát. Mất ${money(r.paid)}, mất hết hàng.`, P.sentenceHours(g) + r.jail); }
      } },
      { t: 'Đi theo chú về phường', fn: () => { const r = GANGSIM.bust(g); this.sendToJail(n, `Theo chú về phường. Mất ${money(r.paid)} tiền phạt, mất hết hàng.`, P.sentenceHours(g) + r.jail); } },
    ]);
  }
  /** Đưa người chơi vào buồng tạm giữ ở Công an phường. */
  sendToJail(n: Npc | null, why = '', extraHours = 0) {
    const g = this.g, hours = P.sentenceHours(g) + Math.max(0, Math.round(extraHours));
    ctx.ui.fade(true, 0.9); ctx.player.frozen = true;
    setTimeout(() => {
      P.jail(g, hours);
      const a = ctx.world.anchors.giuong_giam;
      if (a) ctx.player.place(a.x + 1.3, a.z, -Math.PI / 2);
      ctx.ui.closeDialog(); ctx.ui.fade(false, 0.9); ctx.player.frozen = false;
      toast(`${why} Bị tạm giữ ${hours} giờ ở Công an phường.`, 'bad', 'badge', true);
      toast('Đập đá mỗi giờ thì bớt được giờ; nằm giường thì chờ cho qua.', 'info', 'tool');
      bus.emit('save', 'tam giu');
    }, 950);
    if (n) ctx.npcs.leave(n);
  }
  /** Hết hạn tạm giữ: thả ra trước cửa đồn, uy tín và tinh thần đều tụt. */
  jailOver() {
    if (ctx.anim?.active) ctx.anim.stop();
    const g = this.g;
    P.release(g);
    ctx.ui.fade(true, 0.8); ctx.player.frozen = true;
    setTimeout(() => {
      const a = ctx.world.anchors.cua_don ?? ctx.world.anchors.v_police;
      if (a) ctx.player.place(a.x, a.z, Math.PI);
      ctx.ui.fade(false, 0.9); ctx.player.frozen = false;
      toast('Cả xóm đã biết chuyện bạn vào phường. Uy tín tụt một mức.', 'bad', 'badge');
      bus.emit('save', 'ra tu');
    }, 850);
  }
  /** Đập đá một giờ trong buồng tạm giữ: bớt thêm một giờ, nhưng mất sức. */
  prisonLabour() {
    const g = this.g;
    if (!P.inJail(g)) { toast('Chỉ người bị tạm giữ mới phải làm việc này.', 'info'); return; }
    if (g.st.energy < 12) { toast('Kiệt sức rồi, xin nằm nghỉ một chút.', 'warn', 'bolt'); return; }
    R.advance(g, 60, this.act()); P.labour(g); sfx('chop');
    const left = Math.ceil(P.jailLeft(g) / 60);
    toast(left > 0 ? `Đập đá một tiếng, mồ hôi nhễ nhại. Còn ${left} giờ nữa.` : 'Đập đá một tiếng — vừa hết hạn tạm giữ!', 'info', 'tool');
    if (left > 0) ctx.anim.startPrisonLabour();
  }
  /** Nằm trên giường sắt chờ hết hạn. */
  prisonRest() {
    if (ctx.anim?.active) ctx.anim.stop();
    const g = this.g;
    if (!P.inJail(g)) { toast('Giường của buồng tạm giữ, chỉ người bị giữ mới nằm.', 'info'); return; }
    const wait = Math.min(120, Math.ceil(P.jailLeft(g)));
    R.advance(g, wait, { ...this.act(), sleeping: true }); R.consume(g, { e: 14, hp: 2, m: -2 });
    toast(`Nằm trên giường sắt ${wait} phút.`, 'info');
  }
  // ───────────────────────── Điện thoại ─────────────────────────
  /** Nghe radio, nghe nhạc hay lướt WAP: tốn thời gian, lên tinh thần, tụt pin. */
  phoneFun(f: 'radio' | 'music' | 'wap'): boolean {
    const g = this.g, c = PH.fun(g, f);
    if (!c) {
      if (!PH.hasPhone(g)) toast('Bạn chưa có điện thoại. Tiệm Đồ Nghề Ba Tài có bán.', 'info', 'tool');
      else if (PH.battery(g) <= 0.5) toast('Máy hết pin rồi. Sạc nhờ ở tạp hoá, hoặc ngủ ở nhà có điện.', 'warn', 'bolt');
      else toast('Máy này không có chức năng đó.', 'info');
      return false;
    }
    R.advance(g, c.min, this.act()); R.consume(g, { m: c.mood });
    const secs = Math.min(24, Math.max(6, c.min * 1.6));
    // Máy có loa ngoài: bật "Nghe nhạc" là đổi luôn nhạc nền sang bài của máy (bấm "Bài khác" để sang bài kế).
    if (f === 'music') {
      const next = PUI.phoneAct()?.k === 'music' && PUI.phoneSong() ? PUI.phoneSong() : 'phone_' + SONGS[0].id;
      const song = SONGS.find((x) => 'phone_' + x.id === next) ?? SONGS[0];
      ctx.sound.bgm = 'phone_' + song.id;
      PUI.setPhoneAct('music', secs, `${song.name} — ${song.by}`, '', 'phone_' + song.id);
      toast(`Máy đang phát “${song.name}” ${song.by} — nhạc nền đổi theo. Bấm “Bài khác” trên máy để sang bài khác.`, 'info', 'smile', true);
    } else if (f === 'radio') {
      // đài đọc tin thật trong ván (thời tiết, giá chợ, sự kiện đang diễn ra…)
      const line = NEWS.radioLines(g)[0];
      PUI.setPhoneAct('radio', secs, line);
      toast(`${c.line} Đài đang đọc: ${line}`, 'info', 'smile', true);
    } else {
      const p1 = NEWS.priceLine(g);
      PUI.setPhoneAct('wap', secs, '', '', '', 0);
      toast(`${c.line}${p1 ? ` Trang đầu có tin giá ${p1.name.toLowerCase()} ${money(p1.now)}/${p1.unit}.` : ''}`, 'info', 'smile', true);
    }
    sfx('good'); bus.emit('save', 'dien thoai');
    return true;
  }
  /** Gọi cho khách quen: tốn cước, thân hơn một chút, mỗi ngày một lần. */
  phoneCall(id: string): boolean {
    const g = this.g, r = PH.call(g, id);
    toast(r.line, r.ok ? 'good' : 'info', 'chat');
    if (r.ok) {
      R.advance(g, 5, this.act()); sfx('ok');
      PUI.setPhoneAct('call', 12, r.line, PH.contacts(g).find((c) => c.id === id)?.name ?? 'Khách quen');
    }
    return r.ok;
  }
  /** Gọi 1080: nghe dự báo thời tiết ngày mai. Tốn 2.000₫ cước và một phút. */
  phoneWeather(): boolean {
    const g = this.g, r = PH.weatherForecast(g);
    toast(r.line, r.ok ? 'info' : 'warn', 'sun', true);
    if (r.ok) { R.advance(g, 1, this.act()); sfx('ok'); bus.emit('save', 'goi 1080'); PUI.setPhoneAct('call', 9, r.line, 'Tổng đài 1080'); }
    return r.ok;
  }
  /** Gọi 1900 1234: “trúng thưởng” — luôn là lừa, và chỉ lừa được một lần. */
  phoneScam(): boolean {
    const g = this.g, r = PH.callScam(g);
    if (r.bait) {
      this.way = { x: r.bait.x, z: r.bait.z, name: r.bait.place };
      toast(r.line, 'good', 'gift', true);
      toast('Đi tới điểm hẹn (mũi tên vàng trên màn hình) để nhận thưởng — nhớ kỹ chỉ có một lần.', 'info', 'way', true);
      R.advance(g, 3, this.act()); sfx('order'); bus.emit('save', 'goi 1900');
      PUI.setPhoneAct('call', 10, r.line, '1900 1234');
      return true;
    }
    toast(r.line, 'info', 'phone');
    if (r.fee > 0) R.advance(g, 3, this.act());
    PUI.setPhoneAct('call', 8, r.line, '1900 1234');
    return r.fee > 0;
  }
  /** Đang đứng trong ngõ hẹn nhận thưởng hay không (dùng để chỉ hiện một cơ hội đúng một lần). */
  scamHere(): boolean { const t = PH.scamTrip(this.g); return !!t && dist2(t.x, t.z, ctx.player.x, ctx.player.z) < 7 * 7; }
  /** Vào ngõ hẹn nhận thưởng: hoá ra chỉ có tường và cái thùng — người chơi có MỘT cơ hội quay về. */
  scamBust(): void {
    const g = this.g;
    if (!PH.scamTrip(g) || this.scamTalked) return;
    this.scamTalked = true;
    this.way = null;
    const inCost = PH.scamLoss(g.cash);
    this.D(PH.SCAM_SPOT.place, undefined,
      'Ngõ cụt ba bề là tường, cửa cuốn đóng kín, chẳng có ai đợi. Trên tường dán tờ giấy: “1900 1234 là số lừa đảo — đừng bỏ tiền vào thùng cho ai”.',
      [
        { t: 'Thôi, quay về — may mà chưa bỏ tiền vào thùng', sub: 'Tỉnh người ra, mất buổi đi lại', fn: () => {
          const r = PH.scamArrive(g, 'back');
          toast(r.line, 'info', 'way', true); R.advance(g, r.min, this.act()); sfx('ok'); bus.emit('save', 'biet bi lua');
        } },
        { t: `Vẫn tin — bỏ “lệ phí” ${money(inCost)} vào thùng`, sub: inCost >= g.cash ? 'Bỏ hết tiền đang có vào thùng' : 'Số tiền này sẽ mất thật', off: g.cash <= 0, fn: () => {
          const r = PH.scamArrive(g, 'in');
          toast(r.line, 'bad', 'angry', true); R.advance(g, r.min, this.act()); sfx('nope'); bus.emit('save', 'bi lua that');
        } },
      ]);
  }
  /** Trả tiền sạc nhờ ở tạp hoá / siêu thị. */
  phoneCharge(shopId: string) {
    const g = this.g;
    if (!PH.hasPhone(g)) { toast('Bạn chưa có điện thoại.', 'info'); return; }
    if (!PH.canChargeAt(shopId)) { toast('Chỗ này không có ổ cắm cho khách.', 'info'); return; }
    if (!R.spend(g, PH.CHARGE_FEE, 'other')) { toast('Không đủ tiền sạc.', 'bad', 'cash'); return; }
    R.advance(g, 20, this.act()); PH.fullCharge(g); sfx('ok');
    toast(`Cắm sạc nhờ, ngồi chờ 20 phút. Pin đầy 100%.`, 'good', 'bolt', true);
  }
  // ───────────────────────── Đua xe đạp chủ nhật & xích đu ─────────────────────────
  /** Nói chuyện phiếm và đăng ký đua ba vòng với nhóm bé gái: chỉ chủ nhật, 15h–17h30, mỗi ngày một lượt. */
  raceMenu(n?: Npc, text?: string) {
    const g = this.g, h = hourOf(g), opts: Opt[] = [], bye: Opt = { t: 'Thôi, đi nha.' };
    if (!RC.isRaceDay(g)) opts.push({ t: 'Hôm nay không phải chủ nhật', sub: 'Tụi tao đua chủ nhật hằng tuần, 15 giờ', off: true });
    else if (!RC.raceOpen(g, h)) opts.push({ t: 'Chưa tới giờ đăng ký', sub: 'Chủ nhật 15h–17h30, đua xong thì nghỉ', off: true });
    else if (RC.racedToday(g)) opts.push({ t: 'Hôm nay đua rồi', sub: 'Tuần sau ghé lại nghen', off: true });
    else opts.push({ t: 'Đăng ký đua ba vòng', sub: `5 phút · cần ${RC.ENTRY_ENERGY}% sức · thắng ${money(RC.PRIZE)}`, off: g.st.energy < RC.ENTRY_ENERGY, fn: () => this.startRace() });
    const talk = (a: string) => () => this.raceMenu(n, a);
    opts.push({ t: 'Đua ở đâu, mấy giờ?', fn: talk('“Đua trên đường trước cổng công viên, ba vòng, chừng mười lăm phút. Chủ nhật ba giờ chiều tụi tao có mặt ở bàn đăng ký này. Xe thì tụi tao cho mượn, khỏi lo — mà đạp yếu là thua đó nghen.”') });
    opts.push({ t: 'Thắng được gì?', fn: talk('“Tụi tao góp tiền, đứa thắng lấy bốn chục. Mà vui là chính, chớ tiền đó bữa sau cũng vô quán nước hết. Mày mà thắng là cả xóm biết mặt.”') });
    opts.push({ t: 'Sao tụi mày ham đua dữ vậy?', fn: talk('“Rảnh thì đua chớ sao. Hồi nhỏ tụi tao đua vòng quanh hồ, giờ lớn rồi mà còn ham. Má tao nói con gái con lứa gì mà chạy xe như giặc. Mà kệ, vui.”') });
    const intro = n?.fixedId === 'dua_mai'
      ? 'Con Mai ngồi trên chiếc ghế nhựa đỏ cạnh bàn đăng ký, tay phe phẩy cuốn sổ ghi tên. “Ngồi tám chuyện chơi! Chủ nhật tụi tao có kèo đua xe đạp ba vòng đó, dám thử hông?”'
      : n?.fixedId === 'dua_thao'
        ? 'Con Thảo đang tựa lưng vô chiếc xe đạp bên vỉa hè công viên, cười toe toét. “Ê, lại đây nói chuyện chơi! Muốn ghi tên đua xe đạp với tụi tao thì nói nghen.”'
        : 'Con Lan đứng bên bàn đăng ký trên vỉa hè công viên, tay còn cầm miếng xoài. “Ủa, ghé tám chuyện hả? Chủ nhật này nhóm tụi tao đua xe đạp ba vòng, chơi không?”';
    const said = text ?? ((g.flags.raceWin ? `Nhóm con Lan nhớ mặt: “Đứa thắng ${g.flags.raceWin} lần rồi đó nghen.” ` : '') + intro);
    this.D(n ? who(n) : 'Nhóm đua xe đạp', n, said, [...opts, bye]);
  }
  /** Vào cuộc đua: mất năm phút đăng ký và một ít sức, phần còn lại do bộ điều khiển đua lo. */
  startRace() {
    const g = this.g;
    if (g.st.energy < RC.ENTRY_ENERGY) { toast(`Cần ít nhất ${RC.ENTRY_ENERGY}% sức mới đua nổi.`, 'warn', 'bolt'); return; }
    if (!RC.raceOpen(g, hourOf(g)) || RC.racedToday(g)) { toast('Giờ này không đua được.', 'info', 'clock'); return; }
    R.advance(g, RC.ENTRY_MINS, this.act());
    R.consume(g, { e: -RC.ENTRY_ENERGY });
    ctx.race.start();
  }
  // ───────────────────────── Quán net ─────────────────────────
  /** Bảng dịch vụ quán net: chơi máy tính giờ, sạc nhờ, nước ngọt. */
  netMenu(n?: Npc) {
    const g = this.g, opts: Opt[] = [];
    if (!placeOpen('net')) { toast('Quán net chưa mở. Người ta mở 6 giờ sáng tới 11 giờ đêm.', 'info', 'clock'); return; }
    const said = n
      ? 'Chị Hạnh ngồi sau quầy, tay quạt phành phạch, mắt vẫn liếc cái màn hình của mình. “Chơi hả em? Ba ngàn một giờ, trả trước nghen.”'
      : 'Máy 04 còn trống. Ghế nhựa còn ấm, màn hình đang chờ ai bấm nút.';
    if (PH.hasPhone(g) && PH.battery(g) < 99) opts.push({ t: `Sạc nhờ điện thoại — ${money(N.CHARGE_FEE)}`, sub: `Pin đang ${Math.round(PH.battery(g))}% · cắm 20 phút`, off: g.cash < N.CHARGE_FEE, fn: () => this.netCharge() });
    for (const k of ['game', 'web', 'film'] as N.NetKind[]) opts.push({ t: `Lấy máy — ${N.NET_ACTS[k].name.toLowerCase()}`, sub: k === 'film' ? 'Tính thêm nửa giá vì tốn đĩa' : `${money(N.NET_RATE)} một giờ`, off: g.cash < N.cost(k, 30), fn: () => this.netPacks(k) });
    opts.push({ t: `Mua nước ngọt — ${money(N.DRINK_PRICE)}`, sub: 'Ngồi máy lâu là khát', off: g.cash < N.DRINK_PRICE, fn: () => this.netDrink() });
    if (n) { const owner = n; opts.push({ t: 'Chị mở quán này lâu chưa?', fn: () => this.D(who(owner), owner, '“Hồi trước chỗ này là cái kho gạo. Hai vợ chồng tui dọn ra, kê mười cái máy, tới nay cũng bảy năm rồi. Tụi nhỏ trong xóm lớn lên ở đây hết — thằng Bi hồi đó mới lớp ba, giờ lên cấp ba rồi mà vẫn ngồi đúng cái ghế đó.”', [{ t: 'Mở quán net có mệt không?', fn: () => this.D(who(owner), owner, '“Mệt chớ. Mười giờ đêm đuổi tụi nó về, dọn lon, lau bàn, sáng sáu giờ mở cửa. Mà vui. Có đứa thi rớt cũng ra đây ngồi khóc, khóc xong chơi tiếp. Chị coi tụi nó như con.”', [{ t: 'Thôi, chào chị.' }]) }, { t: 'Thôi, chào chị.' }]) }); }
    this.D(n ? who(n) : 'Quán net', n, said, opts);
  }
  /** Chọn chơi bao nhiêu phút, tính tiền trước. */
  netPacks(kind: N.NetKind) {
    const g = this.g, opts: Opt[] = [];
    for (const m of N.NET_PACKS) {
      const s = N.plan(g, kind, m);
      const sub = `Tinh thần +${s.mood} · đói thêm ${-s.hunger}% · khát thêm ${-s.thirst}%${s.tired ? ' · mắt đã mỏi, chơi chẳng còn đã' : ''}`;
      opts.push({ t: `${hhmmMin(m)} — ${money(s.cost)}`, sub, off: g.cash < s.cost, fn: () => this.netPlay(kind, m) });
    }
    const said = kind === 'game' ? 'Cả dãy máy đang chơi kiếm hiệp. Tiếng phím lách cách, tiếng quạt trần quay đều.'
      : kind === 'web' ? 'Mở trình duyệt lên, quảng cáo nhảy tùm lum. Cũng gọi là có cái để coi.'
      : 'Chị Hạnh mở tủ đĩa ra: “Phim lẻ ba chục ngàn một đĩa, coi ở đây tính thêm nửa giá giờ.”';
    this.D('Quán net', undefined, said, opts);
  }
  /** Ngồi vô máy: trừ tiền, trôi thời gian, cộng tinh thần, trừ sức. */
  netPlay(kind: N.NetKind, minutes: number) {
    const g = this.g, s = N.plan(g, kind, minutes);
    if (!placeOpen('net')) { toast('Quán đóng cửa rồi.', 'info', 'clock'); return; }
    if (!R.spend(g, s.cost, 'other')) { toast('Không đủ tiền chơi.', 'bad', 'cash'); return; }
    R.advance(g, minutes, this.act());
    R.consume(g, { m: s.mood, e: s.energy, h: s.hunger, t: s.thirst, hp: s.health });
    N.commit(g, s);
    sfx('ok');
    const what = N.NET_ACTS[kind].name.toLowerCase();
    if (s.tired) toast(`${hhmmMin(minutes)} ${what} — ra khỏi quán mắt nhức, đầu ong ong. Tinh thần +${s.mood}.`, 'warn', 'bolt', true);
    else toast(`${hhmmMin(minutes)} ${what}. Đã đời. Tinh thần +${s.mood}.`, 'good', 'heart', true);
    ctx.anim.startNet(N.NET_ACTS[kind].name, Math.round((minutes / 60) * 10) / 10);
  }
  /** Cắm sạc nhờ ở quán net. */
  netCharge() {
    const g = this.g;
    if (!PH.hasPhone(g)) { toast('Bạn chưa có điện thoại.', 'info'); return; }
    if (!R.spend(g, N.CHARGE_FEE, 'other')) { toast('Không đủ tiền sạc.', 'bad', 'cash'); return; }
    R.advance(g, 20, this.act()); PH.fullCharge(g); sfx('ok');
    toast('Cắm sạc ở dãy ổ điện, ngồi chờ 20 phút. Pin đầy 100%.', 'good', 'bolt', true);
  }
  /** Mua lon nước ngọt ở tủ lạnh. */
  netDrink() {
    const g = this.g;
    if (!R.spend(g, N.DRINK_PRICE, 'food')) { toast('Không đủ tiền.', 'bad', 'cash'); return; }
    R.advance(g, 8, this.act()); R.consume(g, { t: 24, m: 3 }); sfx('coin');
    toast('Lon nước ngọt lạnh, uống một hơi hết nửa lon.', 'good', 'drop');
  }

  /** Nói chuyện với chú công an trực ban. */
  policeMenu(n: Npc) {
    const g = this.g, f = P.fine(g), opts: Opt[] = [];
    if (g.wanted > 0) opts.push({ t: `Tự thú chuyện đánh nhau — nộp phạt ${money(f)}`, sub: `Mức bị để ý ${Math.round(g.wanted)}%`, off: g.cash < f, fn: () => {
      if (!P.payFine(g)) { toast('Không đủ tiền nộp phạt.', 'bad', 'cash'); return; }
      sfx('coin'); toast('Chú công an ghi biên bản, thu tiền phạt rồi cho về.', 'info', 'badge');
    } });
    if (P.inJail(g)) opts.push({ t: 'Hỏi bao giờ được về', sub: `Còn ${Math.ceil(P.jailLeft(g) / 60)} giờ`, fn: () => this.D(who(n), n, 'Hết hạn thì chú mở cửa. Muốn về sớm thì vô đập đá, mỗi giờ bớt một giờ.', [{ t: 'Dạ con biết rồi.' }]) });
    opts.push({ t: 'Trong xóm dạo này có gì lạ không chú?', fn: () => this.D(who(n), n, 'Cũng thường. Cuối tháng hay có kiểm tra lấn chiếm lòng đường — bán hàng thì lo dọn cho gọn, đừng để người ta nhắc.', [{ t: 'Dạ con nhớ.' }]) });
    this.D(who(n), n, P.inJail(g) ? 'Chú đang trực. Trong buồng có giường, có đống gạch, muốn về sớm thì làm.' : 'Công an phường đây. Có việc gì cần thì nói, không thì đi cho người ta làm việc.', [...opts, { t: 'Dạ, con đi.' }]);
  }
  wash(kind: 'tap' | 'park' | 'room') {
    const g = this.g;
    if (kind === 'tap') { this.D('Vòi nước công cộng', undefined, 'Nước máy chảy mát lạnh.', [{ t: 'Uống cho đỡ khát', sub: 'Nước máy — hên xui', fn: () => { ctx.player.gesture('drink', 0.6); R.consume(g, { t: 35 }, R.stomachChance(g, { rank: 0.12 })); sfx('drink'); } }, { t: 'Rửa mặt mũi tay chân', sub: 'Sạch hơn một chút (tối đa 60%)', fn: () => { ctx.player.gesture('work', 0.85); g.st.hygiene = Math.max(g.st.hygiene, Math.min(60, g.st.hygiene + 14)); R.advance(g, 5, this.act()); sfx('splash'); toast('Mát mẻ, đỡ lem luốc hơn rồi.', 'good'); } }, { t: 'Thôi' }]); return; }
    if (kind === 'park') { if (!R.spend(g, 3000, 'other')) { toast('Tắm ở đây tốn 3.000₫ mà bạn không đủ tiền.', 'bad', 'cash'); return; } }
    ctx.ui.fade(true, 0.5); setTimeout(() => { g.st.hygiene = kind === 'park' ? Math.max(g.st.hygiene, 86) : STAT_MAX; g.st.mood = clamp(g.st.mood + 5, 0, STAT_MAX); g.weather.wet = 0; R.advance(g, 15, this.act()); sfx('splash'); ctx.ui.fade(false, 0.6); toast('Tắm rửa sạch sẽ thơm tho!', 'good'); }, 900);
  }
  temple() {
    const g = this.g, h = hourOf(g);
    if (h < 11 || h >= 13) { toast('Chùa Phước An phát cơm chay từ 11 giờ tới 13 giờ mỗi ngày.', 'info'); return; }
    if (g.flags.temple === g.day) { toast('Hôm nay bạn đã nhận cơm chay rồi. Nhường phần cho người khác nhé.', 'info'); return; }
    g.flags.temple = g.day; R.consume(g, { h: 48 * 2.5, t: 15 * 2.5, m: 5 }); sfx('eat'); R.advance(g, 12, this.act()); toast('Một dĩa cơm chay nóng với canh rau. Nam mô A Di Đà Phật.', 'good', 'heart', true);
    ctx.anim.startTempleMeal();
  }
  // ───────────────────────── Vui chơi, thư giãn ─────────────────────────
  /** Menu của một chỗ chơi (quán cà phê, chùa…): mọi hoạt động gắn với neo đó. */
  funMenu(at: string) {
    const g = this.g, h = hourOf(g), list = funOpenAt(at, h);
    const opts: Opt[] = list.map((f) => ({
      t: f.label, sub: [f.mins ? `${f.mins} phút` : '', f.cost ? money(f.cost) : 'miễn phí', f.note].filter(Boolean).join(' · '),
      off: g.cash < f.cost || (f.minEnergy !== undefined && g.st.energy < f.minEnergy),
      fn: () => this.playFun(f),
    }));
    if (at === 'tv_bongda') {
      if (R.eventOn(g, 'bong_da')) opts.unshift({ t: 'Chen vào xem trận bóng đang chiếu', sub: '30 phút · tinh thần +12', fn: () => { R.advance(g, 30, this.act()); R.consume(g, { m: 12 }); toast('Vàoooo! Cả quán vỡ oà. Tinh thần phấn chấn hẳn.', 'good'); sfx('yay'); ctx.anim.startFootball(); } });
      opts.push({ t: 'Xin chạy bàn một ca — 60 phút', sub: R.cafeShiftsLeft(g) > 0 ? `Công ${money(this.cafePay())} · còn ${R.cafeShiftsLeft(g)}/${R.CAFE_SHIFTS_DAY} ca hôm nay · cần sức khoẻ tốt` : `Hôm nay đã chạy đủ ${R.CAFE_SHIFTS_DAY} ca`, off: g.st.energy < 28 || h < 6 || h >= 22 || R.cafeShiftsLeft(g) <= 0, fn: () => this.cafeShift() });
      const cafeClosed = list.length ? '' : ` Quán đóng rồi (mở ${funHoursText('tv_bongda')}).`;
      this.D('Quán cà phê Bóng Đá', undefined, (g.st.mood < 35 ? 'Quán đông nghẹt, tiếng cười nói rôm rả. Ngồi đây một chút cũng thấy nhẹ người.' : 'Quán cà phê có tivi, ghế nhựa đỏ, nhạc mở nhỏ. Muốn ngồi chơi hay kiếm chút việc?') + cafeClosed, [...opts, { t: 'Thôi, đi nha.' }]);
      return;
    }
    if (at === 'xich_du') {
      this.D('Xích đu công viên', undefined,
        (g.st.mood > 70 ? 'Xích đu kẽo kẹt, gió lùa qua tóc. Đang vui sẵn, đu một chút cho đã.' : 'Cái xích đu sơn đã bong, dây xích kêu kẽo kẹt. Ngồi lên đu vài chục cái là thấy nhẹ người.')
        + (funOpenAt('xich_du', h).length ? '' : ` Sân chơi đóng cửa rồi (mở ${funHoursText('xich_du')}).`),
        [...opts, { t: 'Thôi, đi nha.' }]);
      return;
    }
    if (at === 'v_temple') {
      opts.unshift({ t: 'Nhận cơm chay từ thiện', sub: h >= 11 && h < 13 ? 'Cơm chay nóng' : 'Mỗi ngày 11h–13h', off: !(h >= 11 && h < 13) || g.flags.temple === g.day, fn: () => this.temple() });
      this.D('Chùa Phước An', undefined, 'Sân chùa mát rượi, khói nhang thơm. Mấy bà cụ ngồi niệm Phật dưới gốc bồ đề.' + (funOpenAt('v_temple', h).length ? '' : ` Cổng chùa đóng rồi (mở ${funHoursText('v_temple')}).`), [...opts, { t: 'Thôi, đi nha.' }]);
      return;
    }
    this.D('Chỗ chơi', undefined, `Giờ này đóng cửa rồi. Chỗ này mở ${funHoursText(at) || 'cả ngày'}.`, [{ t: 'Thôi, đi nha.' }]);
  }
  private playFun(f: FunDef) {
    const g = this.g;
    if (f.cost > 0 && !R.spend(g, f.cost, 'other')) { toast(`Không đủ ${money(f.cost)}.`, 'bad', 'cash'); return; }
    if (f.mins > 0) R.advance(g, f.mins, this.act());
    // nước ở quán cà phê / chỗ công cộng: thêm một chút rủi ro đau bụng (đá, nước máy)
    const risk = f.thirst && f.thirst > 0 ? R.stomachChance(g, { rank: f.id === 'cafe_sua' ? 0.08 : 0.05 }) : 0;
    // Ăn/uống ở quán no lâu hơn 2,5 lần (lượt 41): phần hồi độ no được nhân lên, không đổi giá.
    const fillMul = f.hunger && f.hunger > 0 ? 2.5 : 1;
    R.consume(g, { m: f.mood, e: f.energy ?? 0, t: f.thirst ?? 0, h: Math.round((f.hunger ?? 0) * fillMul), hy: f.hygiene ?? 0 }, risk);
    sfx(f.id === 'cafe_karaoke' ? 'yay' : f.id === 'temple_huong' ? 'good' : 'drink');
    toast({
      cafe_sua: 'Cà phê sữa đá đậm đặc, đá tan chậm. Ngồi nhìn xe qua lại một hồi, lòng dịu hẳn.',
      cafe_karaoke: 'Hát một bài tủ. Cả quán vỗ tay, có người còn xin hát chung. Tinh thần lên hẳn!',
      temple_huong: 'Thắp ba nén nhang, khấn một câu cho buôn may bán đắt. Khói tan, lòng nhẹ.',
      xich_du_10: 'Đu mười phút, gió tạt vô mặt. Đầu óc nhẹ đi một chút.',
      xich_du_20: 'Đu cao, chân đạp lấy đà, cười một mình như thằng khùng.',
      xich_du_40: 'Đu tới lúc chóng mặt mới chịu xuống. Tinh thần lên hẳn.',
    }[f.id] ?? 'Nghỉ một chút, thấy dễ chịu hơn.', 'good', 'star');
    if (f.id === 'cafe_sua') ctx.anim.startCafeDrink();
    else if (f.id === 'cafe_karaoke') ctx.anim.startKaraoke();
    else if (f.id === 'temple_huong') ctx.anim.startTempleIncense();
    else if (f.id.startsWith('xich_du')) ctx.anim.startSwing();
  }
  /** Nghỉ trên ghế đá (công viên, vỉa hè): miễn phí, chậm mà chắc. */
  rest() {
    const g = this.g;
    // Nghỉ ghế đá: tăng nhẹ hiệu quả (tinh thần +9 thay vì +7, năng lượng +6 thay vì +4), vẫn miễn phí.
    R.advance(g, 20, this.act()); R.consume(g, { m: 9, e: 6, t: -1 });
    sfx('good'); toast('Ngồi trên ghế đá, ngắm cây và người qua lại. Tinh thần dễ chịu hơn.', 'info', 'heart');
  }
  /** Công một ca chạy bàn: theo uy tín và tinh thần lúc nhận việc. */
  cafePay() { const g = this.g; return R.cafeWage(g.rep, g.st.mood); }
  private cafeShift(garden = false) {
    const g = this.g, h = hourOf(g);
    if (R.cafeShiftsLeft(g) <= 0) { toast(`Hôm nay bạn đã chạy đủ ${R.CAFE_SHIFTS_DAY} ca rồi — chủ quán sợ mang tiếng bóc lột, mai quay lại nhé.`, 'info', 'clock'); return; }
    if (g.st.energy < 28) { toast('Mệt quá rồi, xin ca này chủ quán cũng không dám nhận. Ăn ngủ rồi quay lại.', 'bad', 'bolt'); return; }
    if (h < (garden ? 6.5 : 6) || h >= 22) { toast(`Quán chỉ nhận người chạy bàn từ ${garden ? '6h30' : '6h'} tới 22h.`, 'info', 'clock'); return; }
    const pay = this.cafePay(), tip = Math.round(round1k(Math.random() * 8000 + (g.st.mood > 60 ? 6000 : 0)));
    R.advance(g, 60, this.act());
    R.earn(g, pay + tip, 'side');
    R.consume(g, { e: -18, h: -3, t: -7, m: -2 });
    g.wd.cafeShifts = (g.wd.cafeShifts ?? 0) + 1;
    const left = R.cafeShiftsLeft(g);
    ctx.ui.float(`+${money(pay + tip)}`, { x: ctx.player.x, y: 1.3, z: ctx.player.z }, 'good');
    sfx('coin'); toast(`Chạy bàn một ca: ${money(pay)} công + ${money(tip)} tiền boa. Mỏi chân nhưng có tiền.` + (left > 0 ? ` Còn ${left} ca hôm nay.` : ` Hết ca hôm nay rồi (${R.CAFE_SHIFTS_DAY} ca/ngày).`), 'good', 'cash', true);
    ctx.anim.startCafeShift(garden);
  }
  /** Ca bốc vác ở cầu cảng — việc nặng, trả cao, chỉ buổi sáng. */
  dockShift() {
    const g = this.g, h = hourOf(g);
    if (h < 4.5 || h >= 10) { toast('Ca bốc hàng ở cảng chỉ chạy 4h30–10h sáng.', 'info'); return; }
    if (R.dockShiftsLeft(g) <= 0) { toast(`Hôm nay bạn đã bốc đủ ${R.DOCK_SHIFTS_DAY} ca cá rồi — anh Sáu Lực không dám nhận thêm, mai ra sớm nha.`, 'info', 'clock'); return; }
    if (g.st.energy < 35) { toast('Kiệt sức rồi, ca này không vác nổi. Ăn ngủ rồi quay lại.', 'bad'); return; }
    const pay = R.dockWage(Math.random());
    R.advance(g, 110, this.act()); R.earn(g, pay, 'side'); R.consume(g, { e: -30, h: -6, t: -9, hy: -4 });
    g.wd.cargoShifts = (g.wd.cargoShifts ?? 0) + 1;
    const left = R.dockShiftsLeft(g);
    ctx.ui.float(`+${money(pay)}`, { x: ctx.player.x, y: 1.3, z: ctx.player.z }, 'good');
    sfx('coin'); toast(`Bốc cá lên xe cả ca: nhận ${money(pay)}. Vai rã rời nhưng đủ tiền chợ.` + (left > 0 ? ` Còn ${left} ca sáng nay.` : ` Hết ${R.DOCK_SHIFTS_DAY} ca của ngày rồi.`), 'good', 'cash', true);
    ctx.anim.startDockShift();
  }
  canSleep(where: string): string | null {
    const g = this.g; if (where === 'gamcau' || where === 'ghe') return null;
    if (g.housing !== where) return 'Đây không phải phòng của bạn.'; if (g.day >= g.paidUntil && HOUSING[where].per === 'đêm') return 'Phòng đã hết hạn thuê.'; return null;
  }
  sleepMenu(where: string) {
    const g = this.g, h = HOUSING[where], err = this.canSleep(where); if (err) { toast(err, 'warn'); return; }
    if (ctx.stall.customers.length) { toast('Còn khách đang chờ kìa!', 'warn'); return; }
    const hr = hourOf(g), night = hr >= 19 || hr < 5, till = hr < 5.5 ? 6 : 30, hrs = till - hr;
    this.D(h.name, undefined, `${h.desc} Bây giờ là ${hhmm(g.min)}. Năng lượng ${Math.round(g.st.energy)}/${STAT_MAX}.` + (g.stall.where === 'placed' && g.stall.tier < 3 ? ' CHÚ Ý: quầy vẫn đang để ngoài chỗ bán — để qua đêm rất dễ mất đồ!' : ''), [
      { t: night ? `Ngủ tới 6 giờ sáng (${hrs.toFixed(1)} tiếng)` : 'Ngủ một giấc dài (8 tiếng)', fn: () => this.sleep(where, night ? hrs : 8) },
      { t: 'Chợp mắt 2 tiếng', fn: () => this.sleep(where, 2) }, { t: 'Chưa buồn ngủ.' }]);
  }
  /**
   * Chỗ đứng cạnh giường để ngủ. Mỏ neo giường nằm ĐÚNG GIỮA nệm, mà cả khung giường là vật cản, nên đặt
   * người chơi ở đó là chui vào trong giường: khung hình bị đẩy ra, có lần lọt luôn qua vách sang gian bên
   * kia rồi kẹt (lỗi “ngủ ở nhà nghỉ/nhà trọ bị văng sang khung gian khác” — ghi nhận trên điện thoại).
   * Tìm một chỗ trống THẬT quanh giường, ưu tiên phía chân giường theo hướng của mỏ neo.
   */
  private bedSpot(a: { x: number; y: number; z: number; yaw: number }) {
    const W = ctx.world;
    for (const d of [1.55, 1.75, 1.35, 1.95, 1.15]) for (const off of [0, 0.45, -0.45, 0.9, -0.9, Math.PI / 2, -Math.PI / 2]) {
      const ang = a.yaw + off, x = a.x + Math.sin(ang) * d, z = a.z + Math.cos(ang) * d;
      if (!W.blocked(x, z, 0.36)) return { x, z, yaw: a.yaw };
    }
    return { x: a.x, z: a.z, yaw: a.yaw };
  }
  /** Chỗ đứng cạnh giường của một chỗ ở — dùng cho menu thử (tele tới giường mà không chui vào khung giường). */
  bedStand(where: string): { x: number; z: number; yaw: number } | null {
    const a = ctx.world.anchors[HOUSING[where]?.anchor]; if (!a) return null;
    const sp = this.bedSpot(a); return { x: sp.x, z: sp.z, yaw: Math.atan2(a.x - sp.x, a.z - sp.z) };
  }
  sleep(where: string, hours: number) {
    const g = this.g, h = HOUSING[where]; this.sleepWhere = where; this.sleepUntil = absMin(g) + hours * 60;
    const wet = where === 'ghe' && R.wx(g).rain > 0.2; this.sleepQ = h.sleep * (wet ? 0.45 : 1) * (g.st.hunger < 15 ? 0.8 : 1);
    ctx.mode = 'sleep'; ctx.speed = 48; ctx.stall.close(true); ctx.ui.fade(true, 0.8); ctx.ui.sleeping(true); ctx.input.reset(); sfx('sleep');
    const a = ctx.world.anchors[h.anchor];
    if (a) { const sp = this.bedSpot(a); ctx.player.place(sp.x, sp.z, sp.yaw, 0.2); ctx.player.eyeTarget = Math.max(0.45, a.y - 0.12 + 0.35); }
  }
  private wake(reason = '') {
    const g = this.g, where = this.sleepWhere, h = HOUSING[where];
    // Tỉnh dậy mà chân vẫn nằm trong khung giường / trong vách (bản lưu cũ, hoặc giường kê sát vách) thì
    // bước ra chỗ trống trước khi trả lại quyền điều khiển — nếu không người chơi bị đẩy lúc bước đi và lọt sang gian khác.
    const p0 = ctx.player;
    if (ctx.world.blocked(p0.x, p0.z, 0.32)) { const a = ctx.world.anchors[h.anchor]; if (a) { const sp = this.bedSpot(a); p0.place(sp.x, sp.z, sp.yaw); } }
    if (PH.hasPhone(g) && PH.hasPower(g) && PH.battery(g) < 99) { PH.fullCharge(g); toast('Cắm sạc qua đêm, điện thoại đầy pin.', 'info', 'bolt'); } ctx.mode = 'play'; ctx.speed = MIN_PER_SEC; ctx.player.eyeTarget = 1.6; ctx.ui.fade(false, 1.2); ctx.ui.sleeping(false); sfx('wake');
    toast(reason || `Tỉnh giấc lúc ${hhmm(g.min)}. Năng lượng ${Math.round(g.st.energy)}/${STAT_MAX}.`, 'info', 'moon');
    // trộm đêm
    const risk = (1 - h.safety) * 0.4 + (R.eventOn(g, 'trom') && h.safety < 0.6 ? 0.35 : 0);
    if (rnd.chance(risk)) {
      const cash = Math.min(g.cash, round1k(g.cash * rnd.range(0.2, 0.45))), lost = g.home.splice(0, Math.ceil(g.home.length / 2));
      g.cash -= cash; g.led.loss += cash + lost.reduce((a, s) => a + s.n * s.cost, 0); g.st.mood = clamp(g.st.mood - 10, 0, STAT_MAX);
      if (cash > 0 || lost.length) toast(`Bị trộm lúc đang ngủ! Mất ${money(cash)}` + (lost.length ? ' và một phần đồ cất ở đây.' : '.') + ' Gửi tiền ngân hàng hoặc thuê phòng có khoá sẽ an toàn hơn.', 'bad', 'skull', true);
    }
    const s = g.stall;
    if (s.where === 'placed' && s.tier < 3 && dist2(s.x, s.z, ctx.player.x, ctx.player.z) > 30 * 30 && rnd.chance(0.4)) { const v = s.store.reduce((a, x) => a + x.n * x.cost, 0); s.store = []; s.preps = []; s.cond = clamp(s.cond - 15, 0, 100); g.led.loss += v; toast('Quầy để ngoài đường qua đêm bị kẻ gian lấy sạch nguyên liệu!', 'bad', 'skull', true); ctx.stall.refresh(); }
    bus.emit('save', 'ngu day');
  }
  /** Trạng thái hoạt động hiện tại cho mô phỏng chỉ số. */
  act(): R.Activity {
    const p = ctx.player, g = this.g, sleeping = ctx.mode === 'sleep';
    return { moving: p.moving, running: p.running, sleeping, sheltered: this.sheltered, working: ctx.mode === 'cook' || p.carry === 'sack' || this.working > 0, load: clamp(R.bagWeight(g) / R.carryCap(g)) + (p.carry === 'ganh' ? 0.5 : p.carry === 'sack' ? 0.9 : 0), sleepQ: this.sleepQ };
  }
  /** Dọn người đứng chờ nhận hàng (bỏ việc hoặc đổi đơn khác). */
  dropReceiver() { if (this.receiver) { ctx.npcs.remove(this.receiver); this.receiver = null; } }
  setWay(anchor: string, name: string) { const a = ctx.world.anchors[anchor]; if (a) this.way = { x: a.x, z: a.z, name }; }

  /** Nhịp chờ trước khi mở hộp thoại tin xấu của băng (lượt 72). */
  private troubleT = 6;
  /** Nhịp kiểm tra đụng độ băng đối thủ (lượt 72). */
  private clashT = 2.5;
  update(dt: number) {
    const g = this.g, p = ctx.player;
    this.sheltered = ctx.world.covered(p.x, p.z);
    if (this.working > 0) this.working -= dt;
    if (this.punchCd > 0) this.punchCd -= dt;
    if (this.jumpCd > 0) this.jumpCd -= dt;
    this.checkFaint();
    // mức bị để ý nguôi dần theo giờ trong game
    this.coolT += dt * MIN_PER_SEC; P.cool(g, this.coolT); this.coolT = 0;
    this.copT -= dt;
    // Đụng độ băng đối thủ (lượt 72): bước vào địa bàn bên kia thì bị chặn. Chỉ hỏi mỗi 2,5 giây một lần và
    // chỉ khi đang rảnh, để không chen ngang lúc người chơi đang nấu hay đang nói chuyện.
    if (g.gang) {
      this.clashT -= dt;
      if (this.clashT <= 0) {
        this.clashT = 2.5;
        const d = districtAt(p.x, p.z);
        const c = GANGSIM.clashAt(g, d);
        if (c && ctx.mode === 'play' && !ctx.ui.isDialogOpen()) GANGTALK.clashScreen(this as unknown as GANGTALK.TalkHost, c);
      }
    }
    // Tin xấu của băng (lượt 72): lớp luật chỉ đặt cờ, lớp game mở hộp thoại khi người chơi đang rảnh.
    if (g.gang?.trouble) {
      this.troubleT -= dt;
      if (this.troubleT <= 0) {
        this.troubleT = 6;
        const t = GANGS2.find((x) => x.id === g.gang!.trouble);
        if (t && ctx.mode === 'play' && !ctx.ui.isDialogOpen()) {
          GANGTALK.troubleScreen(this as unknown as GANGTALK.TalkHost, g.gang.id as 'hem' | 'cho', t, undefined);
        }
      }
    }
    if (this.copT <= 0) {
      this.copT = 2.5;
      // Lượt 71: đang giữ hàng cấm mà tới giờ bị khám thì công an gọi lại — hộp thoại phạt nặng nằm trong
      // `caught()` (nhánh `bustedForContraband`), ở đây chỉ xin một chú đi tới.
      const swept = g.flags.sweepNow === 1;
      if (ctx.mode === 'play' && (swept || P.shouldStop(g))) {
        delete g.flags.sweepNow;
        const cop = ctx.npcs.sendPolice();
        if (!cop && swept) toast('Có chú công an đang nhìn về phía bạn — kho hàng cấm nên dọn sớm.', 'warn', 'badge');
      }
    }
    if (g.jailUntil > 0) {
      if (P.jailLeft(g) <= 0) this.jailOver();
      else { const c = ctx.world.anchors['giuong_giam']; if (c && dist2(c.x, c.z, p.x, p.z) > 6.5 * 6.5) { p.place(c.x + 1.3, c.z, -Math.PI / 2); toast('Chưa hết hạn tạm giữ, chú công an kéo lại vào buồng.', 'warn'); } }
    }
    this.drawLitter(); if (this.glint) { this.glint.position.y = Math.sin(ctx.time * 3) * 0.05; this.glint.visible = ctx.mode === 'play'; }
    if (ctx.mode === 'sleep') {
      const woke = absMin(g) >= this.sleepUntil ? '' : g.st.hunger <= 2 ? 'Đói cồn cào làm bạn tỉnh giấc.' : g.st.thirst <= 2 ? 'Khát khô cổ làm bạn tỉnh giấc.' : this.sleepWhere === 'ghe' && g.weather.wet > 60 ? 'Mưa tạt ướt sũng, không ngủ nổi!' : (g.st.energy >= STAT_MAX - 0.5 && hourOf(g) > 5.5 && hourOf(g) < 19) ? `Ngủ đẫy giấc rồi. Bây giờ là ${hhmm(g.min)}.` : null;
      if (woke !== null) this.wake(woke);
    }
    if (this.cart) { const v = ctx.npcs.fixed.get(this.cart.shop); if (v && dist2(v.x, v.z, p.x, p.z) > 17 * 17) { toast(`Bạn để lại hàng chưa tính tiền ở ${SHOPS[this.cart.shop].name}.`, 'info'); this.dropCart(); } }
    const j = this.job;
    if (j?.kind === 'dock') { const h = hourOf(g); if (h > 10.2 && !j.carrying) { this.job = null; this.way = null; toast('Hết giờ bốc hàng buổi sáng.', 'info'); } }
    this.deliveryCheck();
    // Vẫn còn trên đường đi “nhận thưởng” (kể cả sau khi mở lại bản lưu) thì dựng lại mũi tên chỉ đường.
    const trip = PH.scamTrip(g);
    if (trip && !this.way) this.way = { x: trip.x, z: trip.z, name: trip.place };
    if (!trip) { this.scamTalked = false; if (this.way?.name === PH.SCAM_SPOT.place) this.way = null; }
    const w = this.way, on = !!w && ctx.mode === 'play';
    this.beacon.visible = on; this.ring.visible = on;
    if (w) {
      this.beacon.position.set(w.x, 15, w.z); (this.beacon.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(ctx.time * 3) * 0.08;
      this.ring.position.set(w.x, 0.16, w.z); const k = 1 + Math.sin(ctx.time * 2.2) * 0.08; this.ring.scale.set(k, 1, k);
      (this.ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(ctx.time * 2.2) * 0.15;
      if (!j && dist2(w.x, w.z, p.x, p.z) < 9) this.way = null;
    }
    if (!ctx.ui.isDialogOpen() && !ctx.ui.modalName && this.scamHere()) this.scamBust();
    // Chú Ba hẹn tới rước: đúng giờ thì ổng chạy tới, mở luôn bảng chọn chỗ đi.
    if (!ctx.ui.isDialogOpen() && !ctx.ui.modalName && XE.pickupAt(this.g) >= 0) this.xeomTick();
    this.xeomReturn();
    // mục tiêu hướng dẫn
    this.qT -= dt; if (this.qT <= 0) { this.qT = 1; const q = g.quest, s = g.stall, sellable = RECIPE_LIST.filter((r) => R.canSell(g, r));
      const ok = [R.has(g, 'ganh') || s.tier > 0, sellable.length > 0, sellable.some((r) => (R.hasPrep(r) ? R.prepPossible(g, r) > 0 || s.preps.some((x) => x.rid === r.id) : R.finishPossible(g, r) > 0)) || s.ready.length > 0, s.where === 'placed',
        R.menuOf(g).some((r) => R.available(g, r)), g.tot.served >= 1, g.led.sold >= 10 || g.hist.some((d) => d.sold >= 10), STABLE_HOME.includes(g.housing), s.tier >= 2, g.rep >= 50 && g.debts.length === 0][q];
      if (ok && q < QUESTS.length - 1) { g.quest++; sfx('quest'); toast('Xong mục tiêu! Tiếp theo: ' + QUESTS[g.quest], 'good', 'star', true); bus.emit('ui', 'quest'); } }
  }
  // ───────────────────────── Xe ôm Chú Ba ─────────────────────────
  /** Ba mức giá dán ở đầu hẻm — để người chơi biết trước khi leo lên xe. */
  xeomFareText(): string {
    const g = this.g, km = (m: number) => money(m + (XE.raining(g) ? XE.RAIN_FEE : 0) + (this.carrying().heavy ? XE.HEAVY_FEE : 0));
    return `Trong xóm ${km(XE.FARE_IN)} · sang phố bên ${km(XE.FARE_MID)} · ra chợ, ra bến ${km(XE.FARE_FAR)}`;
  }
  /** Đang mang theo gánh / xe đẩy hay không (chở nặng thì ổng lấy thêm). */
  private carrying(): { heavy: boolean; note: string } {
    const c = ctx.player.carry;
    return c === 'ganh' ? { heavy: true, note: 'gánh hàng' } : c === 'xeday' ? { heavy: true, note: 'xe đẩy' } : { heavy: false, note: '' };
  }
  /** Một chuyến xe ôm từ chỗ đang đứng tới đích: trả tiền, tốn thời gian, đặt người chơi ở cửa đích. */
  xeomRide(to: Way): boolean {
    const g = this.g, p = ctx.player, d = Math.hypot(to.x - p.x, to.z - p.z);
    const carry = this.carrying();
    const fee = XE.fare(g, d, carry.heavy), mins = XE.rideMinutes(d);
    if (g.cash < fee) { toast(`Chú Ba lắc đầu: “${money(fee)} lận con, mà con còn ${money(g.cash)} — chú không chở thiếu được.”`, 'warn', 'cash'); return false; }
    R.spend(g, fee, 'fees');
    R.advance(g, mins, { ...this.act(), moving: false, running: false, working: false, load: 0 });
    // Đứng ở cửa đích, quay mặt ra đường — không cắt cảnh, chỉ đặt chỗ đứng (giống lúc tỉnh dậy).
    const dx = to.x - p.x, dz = to.z - p.z;
    // Neo của người bán đôi khi nằm sát quầy/kệ, nên chỗ đáp chật thì lùi ra một chút cho khỏi kẹt trong đồ.
    let lx = to.x, lz = to.z;
    if (ctx.world.blocked(lx, lz, 0.34)) {
      for (const [ox, oz] of [[0, 1.4], [1.4, 0], [0, -1.4], [-1.4, 0], [1.2, 1.2], [-1.2, 1.2], [1.2, -1.2], [-1.2, -1.2], [0, 2.4], [2.4, 0], [-2.4, 0], [0, -2.4]]) {
        if (!ctx.world.blocked(to.x + ox, to.z + oz, 0.34)) { lx = to.x + ox; lz = to.z + oz; break; }
      }
    }
    p.place(lx, lz, Math.atan2(dx, dz), 0);
    sfx('ok');
    toast(`Chú Ba chở tới ${to.name} — ${money(fee)}, ${hhmmMin(mins)} (đi bộ mất ${hhmmMin(XE.walkMinutes(d))}).` + (carry.heavy ? ` Chở thêm ${carry.note} nên có phụ phí.` : ''), 'good', 'way', true);
    return true;
  }
  /** Hỏi đi đâu: danh sách đích y như Bản đồ, kèm giá và số phút của từng chỗ. */
  xeomMenu(n?: Npc) {
    const g = this.g, p = ctx.player, carry = this.carrying();
    // Chỉ nhận chuyến xa hơn ~22 m: đi vài bước chân thì ổng không chở, mà cũng khỏi rối danh sách.
    const near = this.places().map((w) => ({ w, d: Math.hypot(w.x - p.x, w.z - p.z) })).filter((o) => o.d > 22).sort((a, b) => a.d - b.d);
    const rel = g.rel[XE.XEOM_ID]?.v ?? 0;
    const wait = XE.waitingLeft(g);
    const opts: Opt[] = near.slice(0, 10).map(({ w, d }) => ({
      t: `${w.name} — ${money(XE.fare(g, d, carry.heavy))}`,
      sub: `${Math.round(d)} m · xe ${hhmmMin(XE.rideMinutes(d))} (đi bộ ${hhmmMin(XE.walkMinutes(d))})`,
      off: g.cash < XE.fare(g, d, carry.heavy),
      fn: () => { this.xeomRide(w); },
    }));
    // Một lời mời tử tế: thân thì bớt tiền, có chuyến hẹn sẵn thì nhắc, đang mưa thì ổng nói thẳng.
    const hello = !g.flags.xeomMet
      ? 'Hả, nhỏ này ở đâu ra dưới gầm cầu vậy? Chú Ba đây, chạy xe ôm hai chục năm rồi. Đi đâu thì kêu chú chở — ngồi đi, chú tính rẻ.'
      : wait > 0 ? `Chú đang trên đường tới chỗ con hẹn, còn ${wait} phút nữa.` + (n ? ' Đứng đó chờ nghen.' : '')
      : XE.raining(g) ? 'Trời mưa thế này chạy hơi cực, con chịu phụ chú thêm ít ngàn nghen — ướt hết cả áo.'
      : rel >= 60 ? `Con đi hoài chú nhớ mặt rồi đó. Lên xe đi, chú tính rẻ cho.`
      : 'Đi đâu con? Chú chở tới tận cửa, khỏi đi bộ mỏi chân.';
    const spare: Opt[] = [];
    if (wait > 0) spare.push({ t: 'Thôi, con tự đi.', sub: 'Huỷ chuyến chú Ba đang chạy tới', fn: () => { XE.cancelPickup(g); toast('Bạn gọi lại cho Chú Ba: “Thôi chú ơi, con tự đi được.”', 'info', 'phone'); } });
    if (n) spare.push({ t: 'Hỏi chuyện chú Ba', fn: () => this.D(who(n), n, this.xeomSmallTalk(), [{ t: 'Vậy chú chở con đi.', fn: () => this.xeomMenu(n) }, { t: 'Thôi, con chào chú.' }]) });
    g.flags.xeomMet = 1;
    // Đứng sát ổng mà chọn đích gần quá (không có chỗ nào xa hơn 22 m) thì nói thẳng là không chở.
    const tooClose = near.length === 0;
    if (tooClose) opts.push({ t: 'Con đi bộ được rồi.', sub: 'Gần quá, chú không chở mấy bước chân', off: true });
    this.D(n ? who(n) : 'Chú Ba xe ôm', n, hello + `\n${this.xeomFareText()}`, [...opts, ...spare, { t: 'Thôi, con chào chú.' }]);
  }
  /** Câu chuyện vặt của Chú Ba — đúng chuyện đang xảy ra trong ván (mưa, giờ, quan hệ). */
  xeomSmallTalk(): string {
    const g = this.g, rel = g.rel[XE.XEOM_ID]?.v ?? 0;
    if (XE.raining(g)) return 'Mưa vầy chạy một chuyến bằng ba chuyến nắng. Con thấy ngoài đường có ai chạy đâu — chú cũng tính về, mà thấy con kêu thì chú ráng.';
    if (rel >= 60) return 'Chú coi con như con trong nhà rồi đó. Bữa nào quán ế quá thì kêu chú, chú chở đồ đi bán dùm — lấy tiền xăng thôi.';
    return 'Hồi trước chú chạy xe tải, sau bị tai nạn nên đổi qua xe ôm. Ngồi đây cả ngày, chuyện trong xóm chú biết hết. Ai giàu ai nghèo, ai nợ ai, chú đều rành.';
  }
  /** Gọi Chú Ba bằng điện thoại: ổng hẹn tới rước ở chỗ người chơi đang đứng. */
  phoneXeom(): boolean {
    const g = this.g, r = XE.callXeom(g);
    if (!r.ok) { toast(r.line, 'info', 'phone'); PUI.setPhoneAct('call', 7, r.line, 'Chú Ba xe ôm'); return false; }
    sfx('ok');
    toast(r.line, 'good', 'phone', true);
    toast(`Chú Ba sẽ tới chỗ bạn đứng sau ${XE.PICKUP_MIN} phút — chờ ở đó nghen.`, 'info', 'way', true);
    PUI.setPhoneAct('call', 9, r.line, 'Chú Ba xe ôm');
    return true;
  }
  /** Chuyến hẹn đã tới giờ: Chú Ba chạy tới, hỏi đi đâu. Gọi mỗi khung hình từ `update()`. */
  xeomTick() {
    const g = this.g;
    if (!XE.shouldArrive(g)) {
      // Hẹn quá cũ (đã qua hơn 4 tiếng) thì bỏ, kẻo ổng “tới” vào nửa đêm hôm sau.
      const at = XE.pickupAt(g);
      if (at >= 0 && absMin(g) - at > 240) { XE.cancelPickup(g); toast('Chú Ba chờ hoài không thấy bạn nên chạy về rồi.', 'info', 'phone'); }
      return;
    }
    XE.cancelPickup(g);
    const n = ctx.npcs.fixed.get(XE.XEOM_ID);
    if (n) {
      // Dựng ổng ngay cạnh người chơi (xe máy chạy tới rồi tấp lề) — chỉ đổi chỗ đứng, không cắt cảnh.
      // Nhớ chỗ đứng cũ để người chơi đi khỏi là ổng tự chạy về gầm cầu.
      this.xeomHome ??= n.home ? { ...n.home } : null;
      const p = ctx.player, dx = Math.cos(p.yaw), dz = -Math.sin(p.yaw);
      const o = { x: p.x + dx * 1.6, z: p.z + dz * 1.6 };
      ctx.world.resolve(o.x, o.z, 0.34, o);
      n.home = { x: o.x, z: o.z, yaw: Math.atan2(p.x - o.x, p.z - o.z) }; n.hidden = false;
      ctx.npcs.say(n, 'Tới rồi nè con! Lên xe đi, đi đâu?', 3, EXPR.smile);
    }
    sfx('ok');
    this.xeomMenu(n);
  }
  /** Chỗ đứng thật của Chú Ba (gầm cầu) — nhớ lại lúc ổng chạy tới rước để trả ổng về chỗ cũ. */
  private xeomHome: { x: number; z: number; yaw: number } | null = null;
  /** Người chơi đi khỏi chỗ hẹn thì Chú Ba chạy về gầm cầu, không đứng đó cả ngày. */
  private xeomReturn() {
    const n = ctx.npcs.fixed.get(XE.XEOM_ID); if (!n || !this.xeomHome) return;
    if (dist2(n.x, n.z, ctx.player.x, ctx.player.z) < 7 * 7) return;
    n.home = this.xeomHome; this.xeomHome = null;
  }
  /**
   * Điểm tới của mọi đích đến (dùng cho Bản đồ và cho nút “Ghim đường đi” trong lời khuyên của Ông Bảy).
   * Danh sách tên nằm ở `data/landmarks.ts`; ở đây chỉ đổi mã neo / mã chỗ bán thành toạ độ thật.
   */
  places(): Way[] {
    const A = ctx.world.anchors, S = (id: string) => spotById(id), out: Way[] = [];
    for (const l of LANDMARK_LIST) {
      const a = l.anchor ? A[l.anchor] : undefined, sp = l.spot ? S(l.spot) : undefined;
      const p = a ? { x: a.x, z: a.z } : sp ? { x: sp.x, z: sp.z } : null;
      if (p) out.push({ x: p.x, z: p.z, name: l.name });
    }
    return out;
  }
  /**
   * Địa danh theo mã (để lời khuyên của Ông Bảy ghim đúng chỗ, kể cả chỗ mới thêm ở lượt 70c).
   * Dò theo **mã** chứ không theo thứ tự trong `places()`: `places()` bỏ qua đích nào chưa có neo/chỗ bán, nên
   * lấy theo chỉ số là lệch một cái là ghim sai chỗ.
   */
  placeOf(id: string): Way | null {
    const l = LANDMARK_LIST.find((x) => x.id === id); if (!l) return null;
    const A = ctx.world.anchors, a = l.anchor ? A[l.anchor] : undefined, sp = l.spot ? spotById(l.spot) : undefined;
    const p = a ? { x: a.x, z: a.z } : sp ? { x: sp.x, z: sp.z } : null;
    return p ? { x: p.x, z: p.z, name: l.name } : null;
  }
  /** Ghim đường đi tới đích đến trong lời khuyên — cùng một cơ chế với Bản đồ (cột sáng vàng + mũi tên). */
  goPlace(id: string): boolean {
    const w = this.placeOf(id); if (!w) return false;
    this.way = w; sfx('ok'); toast(`Đã ghim: ${w.name}. Đi theo mũi tên và cột sáng vàng.`, 'info', 'pin'); return true;
  }
}
export { districtAt, weightOf };
