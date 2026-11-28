// BĂNG ĐẢNG — dữ liệu thuần: phe phái, thứ bậc (thăng chức), hàng cấm, việc làm, án phạt.
//
// Lượt 71: người chơi xin *“làm băng đảng đi… hàng cấm vài loại / hình phạt nặng / xem băng đảng chi tiết /
// phe phái / nv băng đảng event / thăng chức”*. Tệp này chỉ có **số và chữ** (không Three.js, không DOM) để
// `tests/gang.test.ts` kiểm được; luật nằm ở `sim/gang.ts`, giao diện ở `game/acts.ts` + `game/stall.ts`.
//
// Nguyên tắc nội dung: đây là băng nhóm **đòi nợ / bảo kê / hàng lậu** của một khu chợ trong game — không có
// ma tuý, không có vũ khí, không có chữ nào cổ vũ bạo lực ngoài đời. Người chơi được ăn chia, và cái giá phải
// trả là **tiền phạt, ngồi buồng, mất uy tín với phố** — luôn nặng hơn tiền kiếm được.
//
// ── CON DAO HAI LƯỠI (lượt 72) ──
// Người chơi dặn: *“đảm bảo băng đảng là con dao hai lưỡi”*. Lưỡi thứ nhất là `GANGS`/`GANG_JOBS`/`GANG_RANKS`
// ở trên: tiền, uy tín, bậc. Lưỡi thứ hai nằm ở ĐÂY —
//   • `GANG_DOWNSIDE`: mỗi bậc cao thêm thì **khách sợ không dám ăn**, **phí chỗ tăng**, **công an để ý** —
//     ba con số này trừ thẳng vào doanh thu quán, để tiền băng kiếm được không phải tiền chùa.
//   • `GANG_CUTSCENE`: bốn cảnh “làm việc cho băng” — mỗi cảnh có một cái giá về **tinh thần / sức khoẻ /
//     uy tín với phố**, không cảnh nào cho không.
//   • Bốn cách **thoát băng**, và cách nào cũng có giá (xem `sim/gang.ts` → `leaveWays`).
// Tinh thần: chơi băng phải **được nhiều mà mất cũng nhiều**; ai chỉ muốn kiếm tiền nhanh sẽ thấy quán mình
// tàn dần, còn ai chịu được thì băng là con đường thật.

/** Mã phe. `hem` = băng Hẻm Công Nhân (Hùng Sẹo), `cho` = băng Chợ Cá (Bà Năm Lửa). */
export type GangId = 'hem' | 'cho';

export interface GangRank {
  /** Bậc 1…6, dùng để so sánh và hiện “bậc 3/6”. */
  tier: number;
  name: string;
  /** Điểm uy tín tối thiểu trong băng để lên bậc này. */
  respect: number;
  /** Phần trăm ăn chia mỗi chuyến hàng (0…0,3). */
  cut: number;
  /** Quyền mở thêm khi lên bậc — chỉ là câu mô tả, mở khoá thật nằm trong `sim/gang.ts`. */
  perk: string;
}

/**
 * Sáu bậc. Người chơi vào băng là **đàn em mới**, lên tới **đại ca** phải làm đủ việc và đủ uy tín —
 * không mua được bằng tiền, để “thăng chức” có nghĩa.
 */
export const GANG_RANKS: GangRank[] = [
  { tier: 1, name: 'Đàn em mới', respect: 0, cut: 0, perk: 'Được nhận việc lặt vặt: canh gác, bốc hàng.' },
  { tier: 2, name: 'Thằng lính', respect: 40, cut: 0.05, perk: 'Được mua hàng cấm của băng với giá gốc.' },
  { tier: 3, name: 'Giữ hàng', respect: 120, cut: 0.08, perk: 'Giữ hàng qua đêm mà không bị băng đòi lại; lãi mỗi chuyến tăng.' },
  { tier: 4, name: 'Thu nợ', respect: 260, cut: 0.12, perk: 'Được đi thu nợ thuê — người ta trả cho băng, mình ăn phần trăm.' },
  { tier: 5, name: 'Cánh tay phải', respect: 460, cut: 0.2, perk: 'Dắt được hai đàn em đi giao hàng: chuyến lớn hơn, bị bắt thì có đứa gánh.' },
  { tier: 6, name: 'Đại ca', respect: 720, cut: 0.3, perk: 'Đứng tên một góc chợ: mỗi ngày có tiền bảo kê chảy về, nhưng công an để ý gấp đôi.' },
];

export interface GangDef {
  id: GangId;
  name: string;
  /** Đại ca của băng — mã nhân vật cố định trong `data/people.ts`. */
  boss: string;
  /** Chỗ đứng của đại ca (neo trong `world`), cũng là chỗ nhận việc. */
  anchor: string;
  /** Phe đối đầu — quan hệ giữa hai băng quyết định mức rủi ro hai bên. */
  rival: GangId;
  /** Giọng của đại ca khi nói chuyện với người chơi. */
  line: string;
  /** Khu băng này coi là địa bàn (mã quận trong `world/layout.ts`). */
  turf: string;
  /** Tiền “vào băng” (đồ lễ) — băng chợ cá rẻ hơn vì ít tiếng. */
  fee: number;
}

export const GANGS: Record<GangId, GangDef> = {
  hem: {
    id: 'hem', name: 'Băng Hẻm Công Nhân', boss: 'shark', anchor: 'v_shark', rival: 'cho',
    line: 'Vô đây thì phải biết ai là anh. Làm được việc thì có ăn, lươn lẹo là ra đường.',
    turf: 'laodong', fee: 200000,
  },
  cho: {
    // Bà Năm Lửa đứng ngay sạp cá số 3 trong Chợ Xóm Chiều (neo `v_ba_nam`, xem `world/places.ts`).
    id: 'cho', name: 'Băng Chợ Cá', boss: 'ba_nam', anchor: 'v_ba_nam', rival: 'hem',
    line: 'Băng chợ cá tụi tao không đánh người, chỉ đánh vào mối làm ăn. Muốn theo thì theo, đừng phản.',
    turf: 'cho', fee: 120000,
  },
};

export const GANG_LIST: GangDef[] = Object.values(GANGS);

/** Một loại hàng cấm: giá gốc của băng, giá bán ra, mức “nặng” khi bị công an bắt. */
export interface Contraband {
  id: string;
  name: string;
  /** Giá băng bán cho người chơi (mua vào). */
  buy: number;
  /** Giá băng thu lại (bán ra) — thấp hơn giá bán lẻ ngoài phố, vì băng ăn phần. */
  sell: number;
  /** Một đơn vị nặng bao nhiêu kg (tính vào khối lượng mang theo). */
  kg: number;
  /** Hệ số phạt khi bị bắt: tiền phạt = giá trị hàng × `fineMul`, cộng thêm giờ tạm giữ. */
  fineMul: number;
  /** Giờ tạm giữ cộng thêm nếu bị bắt với món này. */
  jail: number;
  /** Bậc thấp nhất được mua (bậc 2 trở lên mới được đụng hàng cấm). */
  minTier: number;
  desc: string;
}

export const CONTRABAND: Record<string, Contraband> = {
  thuocla: { id: 'thuocla', name: 'Thuốc lá lậu', buy: 40000, sell: 52000, kg: 0.4, fineMul: 1.4, jail: 2, minTier: 2, desc: 'Một cây thuốc ngoại, bao bì không tem. Bán cho quán cà phê, quán nhậu là hết.' },
  ruou: { id: 'ruou', name: 'Rượu ngoại lậu', buy: 90000, sell: 118000, kg: 1.2, fineMul: 1.6, jail: 3, minTier: 2, desc: 'Chai rượu không nhãn phụ, chở trong thùng xốp. Lãi đậm, mà công an thấy là giữ xe.' },
  phao: { id: 'phao', name: 'Pháo lậu', buy: 60000, sell: 84000, kg: 2.0, fineMul: 2.2, jail: 6, minTier: 3, desc: 'Bó pháo đỏ bọc giấy báo. Cấm bán, cấm chở, cấm giữ — bị bắt là nặng nhất trong mấy món này.' },
  hangdien: { id: 'hangdien', name: 'Hàng điện tử trôi nổi', buy: 150000, sell: 186000, kg: 1.6, fineMul: 1.2, jail: 2, minTier: 4, desc: 'Điện thoại, tai nghe không hoá đơn. Băng lấy từ xe hàng về trễ, bán lại cho tiệm nhỏ.' },
};
export const CONTRA_LIST: Contraband[] = Object.values(CONTRABAND);

/** Loại việc băng giao. `mins` là phút trong game; `pay` là tiền công chưa chia. */
export interface GangJob {
  id: string;
  name: string;
  mins: number;
  pay: number;
  /** Mức bị công an để ý thêm khi làm xong (0–100). */
  heat: number;
  /** Điểm uy tín trong băng được cộng. */
  respect: number;
  /** Bậc tối thiểu. */
  minTier: number;
  /** Số ca tối đa mỗi ngày. */
  perDay: number;
  /** Trả bằng hàng cấm thay vì tiền (mã hàng, số lượng). */
  reward?: { id: string; n: number };
  desc: string;
}

export const GANG_JOBS: Record<string, GangJob> = {
  gac: { id: 'gac', name: 'Canh gác kho hàng', mins: 45, pay: 40000, heat: 3, respect: 8, minTier: 1, perDay: 2, desc: 'Ngồi trước cửa kho, thấy lạ thì huýt sáo. Việc nhẹ nhất, tiền ít nhất.' },
  boc: { id: 'boc', name: 'Bốc hàng từ xe tải', mins: 60, pay: 70000, heat: 6, respect: 14, minTier: 1, perDay: 2, desc: 'Hàng không khai báo, bốc lúc trời còn tối. Nặng, mà nhanh có tiền.' },
  giao: { id: 'giao', name: 'Chở hàng đi giao', mins: 75, pay: 120000, heat: 12, respect: 24, minTier: 2, perDay: 2, desc: 'Chở thùng hàng tới mối ở phố khác. Đi đường lớn là dễ bị hỏi thăm nhất.' },
  giu: { id: 'giu', name: 'Giữ hàng qua đêm', mins: 120, pay: 90000, heat: 4, respect: 18, minTier: 3, perDay: 1, reward: { id: 'thuocla', n: 1 }, desc: 'Để hàng trong nhà mình một đêm. Không mất sức, mà bị khám nhà là dính.' },
  thu: { id: 'thu', name: 'Đi thu nợ thuê', mins: 90, pay: 150000, heat: 16, respect: 40, minTier: 4, perDay: 1, desc: 'Cầm sổ đi đòi người ta. Đòi được thì ăn phần trăm, không thì bị chửi.' },
};

export const GANG_JOB_LIST: GangJob[] = Object.values(GANG_JOBS);

/** Bậc hiện tại của người chơi trong băng (mặc định 1 khi đã vào băng). */
export function rankAt(respect: number): GangRank {
  let out = GANG_RANKS[0];
  for (const r of GANG_RANKS) if (respect >= r.respect) out = r;
  return out;
}
/** Bậc kế tiếp (null = đã đại ca). */
export function nextRank(respect: number): GangRank | null {
  return GANG_RANKS.find((r) => r.respect > respect) ?? null;
}

/** Tiền phạt khi bị công an bắt với hàng cấm: theo giá trị hàng, nhân hệ số của món. */
export function contrabandFine(stock: Record<string, number>): number {
  let v = 0;
  for (const [id, n] of Object.entries(stock)) { const c = CONTRABAND[id]; if (c) v += c.sell * Math.max(0, n); }
  if (v <= 0) return 0;
  let mul = 1;
  for (const [id, n] of Object.entries(stock)) { const c = CONTRABAND[id]; if (c && n > 0) mul = Math.max(mul, c.fineMul); }
  return Math.round((v * mul) / 1000) * 1000;
}
/** Số giờ tạm giữ cộng thêm vì hàng cấm (lấy món nặng nhất đang giữ). */
export function contrabandJail(stock: Record<string, number>): number {
  let h = 0;
  for (const [id, n] of Object.entries(stock)) { const c = CONTRABAND[id]; if (c && n > 0) h = Math.max(h, c.jail); }
  return h;
}
/** Tổng khối lượng hàng cấm đang giữ. */
export function contrabandKg(stock: Record<string, number>): number {
  let kg = 0;
  for (const [id, n] of Object.entries(stock)) { const c = CONTRABAND[id]; if (c) kg += c.kg * Math.max(0, n); }
  return Math.round(kg * 10) / 10;
}

// ───────────────────────── CON DAO HAI LƯỠI ─────────────────────────

/**
 * Mặt trái của việc theo băng, tính theo **bậc**. Ba con số, trừ thẳng vào quán của người chơi:
 * - `fear`: phần khách bỏ đi vì sợ dính tới băng (0…0,35). Bậc càng cao thì người trong xóm càng né.
 * - `rent`: phí chỗ đội thêm (0…0,6) — “băng đỡ đầu” thì chủ mặt bằng cũng đòi phần.
 * - `heat`: mức bị để ý cộng mỗi ngày (0…6). Bậc cao = công an nhớ mặt.
 */
export interface GangDownside { tier: number; fear: number; rent: number; heat: number; note: string }
export const GANG_DOWNSIDE: GangDownside[] = [
  { tier: 1, fear: 0.06, rent: 0, heat: 1, note: 'Mới vào băng: trong xóm bắt đầu để ý mặt mình.' },
  { tier: 2, fear: 0.12, rent: 0.15, heat: 2, note: 'Có tên trong băng: chủ mặt bằng bắt đầu hỏi chuyện.' },
  { tier: 3, fear: 0.18, rent: 0.3, heat: 3, note: 'Giữ hàng cho băng: khách quen bớt ghé, sợ dính chuyện.' },
  { tier: 4, fear: 0.24, rent: 0.4, heat: 4, note: 'Đi thu nợ: cả xóm biết mình là người của băng.' },
  { tier: 5, fear: 0.3, rent: 0.5, heat: 5, note: 'Cánh tay phải: công an gọi mình lên phường “hỏi thăm” đều hơn.' },
  { tier: 6, fear: 0.36, rent: 0.6, heat: 6, note: 'Đại ca: quán thì vắng dần, mà phí chỗ với công an thì dày thêm.' },
];
/** Mặt trái theo bậc đang đứng (chưa theo băng ⇒ toàn số 0). */
export const downsideAt = (tier: number): GangDownside =>
  GANG_DOWNSIDE[Math.max(0, Math.min(GANG_DOWNSIDE.length - 1, (tier || 1) - 1))];

/** Một cách rời băng — cách nào cũng có giá, không có nút “thoát sạch”. */
export interface GangLeave {
  id: string;
  name: string;
  /** Câu người chơi đọc khi chọn cách này. */
  line: string;
  /** Tiền phải trả (0 = không mất tiền, nhưng mất thứ khác). */
  cost: number;
  /** Số bậc bị tụt khi rời băng (tính từ bậc hiện tại). */
  tierLoss: number;
  /** Mất bao nhiêu uy tín NGOÀI PHỐ (dân có còn tin mình bán hàng không). */
  rep: number;
  /** Mất bao nhiêu tinh thần. */
  mood: number;
  /** Bao nhiêu ngày bị băng “để mắt” sau khi rời (0 = không). */
  watchDays: number;
  /** Bậc tối thiểu mới dùng được cách này (vd. “trả nợ máu” chỉ có nghĩa khi đã là đại ca). */
  minTier: number;
}
export const GANG_LEAVES: GangLeave[] = [
  {
    id: 'tra_no', name: 'Trả nợ máu rồi đi',
    line: 'Đưa đủ phần băng đã ứng cho mình, rồi xin ra. Băng nhận tiền và không nhắc tên mình nữa.',
    cost: 400000, tierLoss: 3, rep: 0, mood: -8, watchDays: 0, minTier: 1,
  },
  {
    id: 'pha_dao', name: 'Phản băng, đi khai với công an',
    line: 'Khai hết những gì mình biết cho chú công an khu vực. Băng sụp, mà cả xóm biết mình là kẻ chỉ điểm.',
    cost: 0, tierLoss: 6, rep: -25, mood: -14, watchDays: 10, minTier: 2,
  },
  {
    id: 'bo_di', name: 'Bỏ đi, đổi khu khác bán',
    line: 'Dọn quầy, đổi sang khu khác ở. Không ai biết mình từng theo băng — mà cũng không còn ai quen mình.',
    cost: 800000, tierLoss: 6, rep: -6, mood: -10, watchDays: 0, minTier: 1,
  },
  {
    id: 'bi_duoi', name: 'Làm ăn thua lỗ để băng tự đuổi',
    line: 'Để băng thấy mình vô dụng rồi đuổi. Không mất tiền, nhưng mất mặt cả xóm.',
    cost: 0, tierLoss: 6, rep: -12, mood: -18, watchDays: 3, minTier: 1,
  },
];

/** Một cảnh “đi làm việc cho băng” — chơi bằng chữ, nhưng có giá thật. */
export interface GangCut {
  id: string;
  /** Việc nào (mã trong `GANG_JOBS`) thì có cảnh này. */
  job: string;
  title: string;
  /** Lời kể, từng đoạn một — mỗi đoạn là một nút bấm “Tiếp”. */
  beats: string[];
  /** Lựa chọn cuối: rút lui (mất uy tín nhẹ) hay làm tới (ăn thêm, mà thêm heat + tinh thần). */
  stop: string;
  go: string;
  /** Phần thưởng thêm khi làm tới cùng. */
  bonus: number;
  /** Giá phải trả khi làm tới cùng. */
  cost: { mood: number; health: number; heat: number; rep: number };
}
export const GANG_CUTS: Record<string, GangCut> = {
  gac: {
    id: 'gac', job: 'gac', title: 'Canh kho tới sáng',
    beats: [
      'Kho là cái nhà kho sau hẻm, cửa sắt, đèn vàng. Mày ngồi trên cái ghế nhựa, muỗi đốt hai chân.',
      'Ba giờ sáng có hai thằng lạ đi ngang, nhìn vào trong rồi đi tiếp. Tim mày đập một nhịp.',
      'Bốn giờ, một thằng quay lại, đứng cách cửa ba mét, không nói gì.',
    ],
    stop: 'Ngồi im, coi như không thấy. Xong ca.',
    go: 'Đứng dậy, cầm cây gậy sắt bước ra hỏi nó muốn gì.',
    bonus: 45000, cost: { mood: -7, health: -4, heat: 6, rep: 0 },
  },
  boc: {
    id: 'boc', job: 'boc', title: 'Bốc hàng lúc trời còn tối',
    beats: [
      'Xe tải đậu sau chợ, thùng nào cũng nặng như đá. Bốc hai mươi thùng lên xe ba gác.',
      'Thùng thứ mười bảy bị bung, bên trong là mấy hộp không nhãn. Mày giả vờ không thấy.',
      'Chủ xe dúi thêm một xấp tiền: “Bốc thêm hai chuyến nữa, đừng nói ai.”',
    ],
    stop: 'Cầm tiền công, về. Đủ rồi.',
    go: 'Bốc thêm hai chuyến. Trời sáng là công an đi tuần.',
    bonus: 60000, cost: { mood: -6, health: -12, heat: 10, rep: 0 },
  },
  giao: {
    id: 'giao', job: 'giao', title: 'Chở hàng qua phố khác',
    beats: [
      'Thùng hàng buộc sau xe, chạy qua ba con đường mới tới chỗ hẹn — một quán nhậu không tên.',
      'Giữa đường, một chú công an đứng ở ngã tư, mắt nhìn theo cái thùng.',
      'Tới quán, người nhận mở thùng, đếm hàng, rồi nói: “Thiếu một món.”',
    ],
    stop: 'Xin lỗi, nhận tiền công rồi đi.',
    go: 'Cãi: “Tao giao đủ, mày tự lấy bớt.”',
    bonus: 90000, cost: { mood: -10, health: -3, heat: 14, rep: -2 },
  },
  giu: {
    id: 'giu', job: 'giu', title: 'Giữ hàng trong nhà một đêm',
    beats: [
      'Mày kê thùng hàng vào góc nhà, lấy chiếu đậy lên, rồi nằm xuống cạnh nó.',
      'Mười một giờ, có tiếng gõ cửa. Không phải hàng xóm — hàng xóm ngủ hết rồi.',
      'Tiếng gõ lần thứ hai, mạnh hơn.',
    ],
    stop: 'Nằm im, thở khẽ, chờ tiếng bước chân đi xa.',
    go: 'Mở cửa, ra xem ai.',
    bonus: 70000, cost: { mood: -12, health: -6, heat: 8, rep: 0 },
  },
  thu: {
    id: 'thu', job: 'thu', title: 'Cầm sổ đi thu nợ',
    beats: [
      'Người nợ là bà bán tạp hoá đầu hẻm. Bà biết mày từ hồi mày còn đi bán vé số.',
      'Bà nói: “Tháng này ế, cho bà khất tới cuối tháng.” Tay bà run khi cầm cái sổ.',
      'Đàn em đi cùng đứng sau lưng mày, chờ mày nói một câu.',
    ],
    stop: 'Ghi sổ: khất tới cuối tháng. Về chịu phạt với băng.',
    go: 'Nói: “Băng không nghe khất. Bà lấy đồ ra đây.”',
    bonus: 120000, cost: { mood: -18, health: -2, heat: 8, rep: -8 },
  },
};

/**
 * Tin xấu tới sau khi người chơi đã ở trong băng một thời gian. Chọn ngẫu nhiên theo ngày để đời sống băng
 * không êm — nhưng **không bao giờ hai ngày liền**, và không cướp tiền của người chơi ngoài mức họ thấy trước.
 */
export interface GangTrouble {
  id: string;
  title: string;
  text: string;
  /** Tiền bị đòi (0 = không đòi tiền). */
  cash: number;
  /** Uy tín trong băng bị trừ (thường là 0 — mất tiền đã đủ đau). */
  respect: number;
  /** Có bị công an để ý thêm không. */
  heat: number;
  /** Người chơi được chọn: nộp hay chịu. Chịu thì nặng hơn nhưng không mất tiền. */
  refuseText: string;
  refuse: { respect: number; heat: number; rep: number; mood: number };
  minTier: number;
}
export const GANG_TROUBLE: GangTrouble[] = [
  {
    id: 'nop_phan', title: 'Băng đòi phần tháng này',
    text: 'Đàn em cầm sổ tới: tháng này mày nợ băng phần ăn chia. Nộp thì xong, không nộp thì băng tự trừ vào uy tín.',
    cash: 180000, respect: 0, heat: 0,
    refuseText: 'Không nộp. Mất uy tín, bị băng để mắt, và cả xóm nghe chuyện.',
    refuse: { respect: 40, heat: 4, rep: -6, mood: -8 }, minTier: 1,
  },
  {
    id: 'siet_no', title: 'Băng “ứng” tiền chữa cháy',
    text: 'Băng nói có chuyến hàng bị bắt, cần tiền “chạy việc”. Ai trong băng cũng phải góp.',
    cash: 320000, respect: 0, heat: 0,
    refuseText: 'Không góp. Băng ghi tên mày vào sổ nợ, và đàn em bắt đầu đi ngang quán mày.',
    refuse: { respect: 60, heat: 6, rep: -8, mood: -10 }, minTier: 2,
  },
  {
    id: 'khach_so', title: 'Khách quen sợ, không dám ghé',
    text: 'Mấy người khách cũ đứng ngoài nhìn vào quán rồi đi. Một người nói với hàng xóm: “Quán đó dính băng.”',
    cash: 0, respect: 0, heat: 0,
    refuseText: 'Ra đứng nói chuyện với họ, mời ăn một bữa. Mất uy tín với băng nhưng cứu được khách.',
    refuse: { respect: 15, heat: 0, rep: 0, mood: -6 }, minTier: 1,
  },
  {
    id: 'cong_an_hoi', title: 'Công an gọi lên phường hỏi thăm',
    text: 'Chú công an khu vực gọi mày lên phường uống nước, hỏi chuyện “cho biết”. Không bắt, chỉ hỏi.',
    cash: 0, respect: 0, heat: 5,
    refuseText: 'Không lên. Chú ghi tên, và từ nay đi ngang là nhìn.',
    refuse: { respect: 0, heat: 14, rep: -4, mood: -6 }, minTier: 2,
  },
];
