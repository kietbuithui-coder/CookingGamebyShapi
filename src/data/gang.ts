// BĂNG ĐẢNG — dữ liệu thuần: phe phái, thứ bậc (thăng chức), hàng cấm, việc làm, án phạt.
//
// Lượt 71: người chơi xin *“làm băng đảng đi… hàng cấm vài loại / hình phạt nặng / xem băng đảng chi tiết /
// phe phái / nv băng đảng event / thăng chức”*. Tệp này chỉ có **số và chữ** (không Three.js, không DOM) để
// `tests/gang.test.ts` kiểm được; luật nằm ở `sim/gang.ts`, giao diện ở `game/acts.ts` + `game/stall.ts`.
//
// Nguyên tắc nội dung: đây là băng nhóm **đòi nợ / bảo kê / hàng lậu** của một khu chợ trong game — không có
// ma tuý, không có vũ khí, không có chữ nào cổ vũ bạo lực ngoài đời. Người chơi được ăn chia, và cái giá phải
// trả là **tiền phạt, ngồi buồng, mất uy tín với phố** — luôn nặng hơn tiền kiếm được.

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
