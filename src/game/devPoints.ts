// MENU ẨN (mở bằng cách bấm 7 lần vào chữ "Cài đặt", rồi nhập mã PIN của dev).
// Lưu ý bảo trì (lượt 63): người chơi yêu cầu XOÁ HẾT mục test, menu chỉ còn nhóm "Địa điểm — tele nhanh".
// Đừng thêm mục thử tính năng vào đây nữa — muốn thử thì viết probe trong tools/probe/steps/.
import { ctx, QUALITY, saveSettings } from './ctx';
import * as R from '../sim/rules';
import { SPOTS, CORR } from '../world/layout';
import { HOUSING } from '../data/gear';
import { toast } from '../core/bus';
import { downloadForOffline } from '../core/offline';
import * as PUI from '../ui/phoneUI';
import * as PH from '../sim/phone';
import { REGULARS } from '../data/people';
import { advice, destOpen, nowText } from '../sim/advice';
import { LANDMARK_BY_ID } from '../data/landmarks';
import { SHOPS } from '../data/shops';
import { money } from '../core/util';
const PUIphone = () => PUI;

export const DEV_BUILD_TAG = 'Đá viên tan chậm 3 lần và hiển thị theo độ lạnh thay vì “hỏng”; menu ẩn đã dọn, chỉ còn dịch chuyển nhanh'

/**
 * MÃ PIN CỦA MENU ẨN. Bấm 7 lần chữ "Cài đặt" chỉ mở bàn phím số; nhập đúng mã này mới thấy menu.
 * Đây KHÔNG phải bảo mật (mã nằm trong gói JavaScript, ai mở DevTools cũng thấy) — chỉ để người chơi
 * không vô tình mở trúng bảng dành cho người làm game rồi tưởng là tính năng của game.
 *
 * Lượt 64 — người chơi báo “chỉ nhập được số 7, chưa có nút xoá, mã quá dễ đoán”:
 * - Mã cũ `7777`: gõ tới đâu so tới đó nên chữ số ĐẦU TIÊN khác 7 là bị xoá ngay ⇒ tưởng bàn phím hỏng.
 * - Nay mã 6 số không lặp (`438 291`), và chỉ so khi đã gõ đủ 6 số, nên gõ số nào cũng được.
 * - Số SAI thì KHÔNG nói sai ở số nào (không dò ra mã bằng cách thử từng số), xoá sạch và bắt gõ lại.
 */
export const DEV_PIN = '438291';
/** Độ dài mã PIN — dùng chung cho bàn phím số và test. */
export const DEV_PIN_LEN = DEV_PIN.length;

/**
 * Xử lý một lần bấm trên bàn phím số của menu ẩn.
 * - `'ok'`   — đúng mã, mở menu.
 * - `'wrong'`— đủ số mà sai: xoá sạch, báo sai (không nói sai ở đâu).
 * - `'more'` — còn nhập tiếp.
 * - `'del'`  — vừa xoá một số.
 *
 * Nút XOÁ gửi `digit = ''` (hoặc `'del'`), nút C xoá sạch gửi `'clear'`.
 * Trước đây hàm này so tiền tố từng số nên chữ số đầu khác `7` là bị đá ra ngay — người chơi tưởng
 * “chỉ nhập được số 7”. Nay hệ số đúng/sai chỉ lộ ra khi đã gõ đủ cả mã.
 */
export function devKey(entered: string, digit: string): { next: string; result: 'ok' | 'wrong' | 'more' | 'del' } {
  if (digit === 'del' || digit === '') return { next: entered.slice(0, -1), result: 'del' };
  if (digit === 'clear') return { next: '', result: 'del' };
  if (!/^[0-9]$/.test(digit)) return { next: entered, result: 'more' };
  const next = (entered + digit).slice(0, DEV_PIN_LEN);
  if (next.length < DEV_PIN_LEN) return { next, result: 'more' };
  return next === DEV_PIN ? { next, result: 'ok' } : { next: '', result: 'wrong' };
}
/** Tên cũ của `devKey` (giữ để mã cũ và test cũ không gãy). */
export const devPinInput = devKey;

/** Số lần bấm vào chữ “Cài đặt” để hiện bàn phím số (đủ khó để không bấm nhầm). */
export const DEV_TAPS = 8;
/** Số lần gõ sai liên tiếp thì khoá bàn phím 30 giây (chống dò mã bằng cách bấm liên tục). */
export const DEV_PIN_TRIES = 5;
export const DEV_PIN_LOCK_MS = 30000;

export interface DevAction {
  id: string;
  label: string;
  sub: string;
  tone?: 'green' | 'yellow' | 'red';
  /** Đóng bảng Cài đặt sau khi bấm (mặc định true cho dịch chuyển / test trực tiếp ngoài phố). */
  closePanel?: boolean;
  run: () => void;
}

export interface DevSection {
  title: string;
  items: DevAction[];
}

function tpTo(x: number, z: number, yaw = 0, msg?: string) {
  ctx.player.place(x, z, yaw);
  ctx.acts.way = null;
  if (msg) toast(msg, 'info', 'pin');
}

/** Đi tới điểm đặt quầy/mặt bằng theo id trong SPOTS (đứng lùi ra một chút, quay vào quầy). */
function tpSpot(id: string, label: string) {
  const sp = SPOTS.find((s) => s.id === id);
  if (!sp) { toast('Không tìm thấy điểm đặt này.', 'warn'); return; }
  const sn = Math.sin(sp.yaw), c = Math.cos(sp.yaw);
  tpTo(sp.x + 4.6 * sn, sp.z + 4.6 * c, sp.yaw + Math.PI, `Đã tới ${label}.`);
}

/**
 * Đứng trước mặt một sạp trong chợ. Mỏ neo `v_<shop>` nằm đúng chỗ NGƯỜI BÁN đứng (quay vào quầy), nên chỗ của
 * khách là lùi về phía sau lưng người bán — cộng thẳng vào trục z như trước là ra sau lưng sạp, chẳng bấm được gì.
 */
function tpFront(a: { x: number; z: number; yaw: number } | undefined, msg: string) {
  if (!a) { toast('Không tìm thấy sạp này ngoài phố.', 'warn'); return; }
  // Mỏ neo quay mặt VÀO quầy, nên chỗ khách là đi tiếp qua quầy theo đúng hướng đó ~3 m.
  const dx = Math.sin(a.yaw), dz = Math.cos(a.yaw);
  for (const d of [2.95, 2.7, 3.2, 2.4]) {
    const x = a.x + dx * d, z = a.z + dz * d;
    if (ctx.world.blocked(x, z, 0.34)) continue;
    tpTo(x, z, Math.atan2(a.x - x, a.z - z), msg);
    return;
  }
  toast('Chỗ này chật quá, không tìm được chỗ đứng trước sạp.', 'warn');
}

/**
 * Đứng ở chỗ TRỐNG gần một món đồ rồi quay mặt vào nó. Buồng tắm nằm sát vách nên toạ độ cứng rất dễ rơi
 * vào khung kính / thành khay — quét vài khoảng cách quanh món đồ, chỗ nào đi được thì đứng.
 */
function standNear(ax: number, az: number, msg: string): boolean {
  for (const d of [1.7, 1.5, 1.9, 2.1, 1.3]) for (const a of [0, 0.4, -0.4, 0.8, -0.8, Math.PI / 2, -Math.PI / 2, 2.2, -2.2]) {
    const x = ax + Math.sin(a) * d, z = az + Math.cos(a) * d;
    if (ctx.world.blocked(x, z, 0.34)) continue;
    tpTo(x, z, Math.atan2(ax - x, az - z), msg);
    return true;
  }
  toast('Chỗ này chật quá, không tìm được chỗ đứng — đi bộ lại gần xem.', 'warn');
  return false;
}

/** Dựng sẵn Chuỗi cửa hàng (bậc 7) + một chi nhánh có người trông coi và món sẵn để thử. */
function setupChain(site: 'cho' | 'vp' | 'cv' = 'cho') {
  const g = ctx.g, S = ctx.stall;
  g.cash = Math.max(g.cash, 800000000);
  for (const id of ['ganh', 'xeday', 'sap', 'quanan', 'quanngoi', 'nhahang', 'chuoi',
    'daothot', 'bepthan', 'vi', 'noi', 'chao', 'ghe', 'bepgas', 'bien', 'den']) {
    if (!R.has(g, id)) R.buyGear(g, id);
  }
  const sp = SPOTS.find((s) => s.id === 'matbang_tb') ?? SPOTS[0];
  if (g.stall.where !== 'placed' || g.stall.spot !== sp.id) S.placeAt(sp);
  g.stall.cond = 100; g.stall.dirt = 0; g.min = 10 * 60;
  for (const rid of ['com_suon', 'banh_mi_trung', 'tra_da', 'pho_bo']) if (g.rec[rid]) { g.rec[rid].known = true; g.rec[rid].on = true; }
  if (!g.stall.ready.length) g.stall.ready.push({ rid: 'tra_da', n: 10, q: 0.92, cost: 3000, at: g.min });
  if (!g.stall.ready.some((r) => r.rid === 'com_suon')) g.stall.ready.push({ rid: 'com_suon', n: 8, q: 0.9, cost: 12000, at: g.min });
  if (g.branch && g.branch.spot !== site) R.closeBranch(g);
  if (!g.branch) R.openBranch(g, site);
  if (!g.branch?.keeper) R.hireKeeper(g);
  for (const r of g.stall.ready.slice()) R.moveToBranch(g, r.rid, Math.min(r.n, 8));
  if (g.branch?.ready.length === 0) { g.stall.ready.push({ rid: 'tra_da', n: 6, q: 0.9, cost: 3000, at: g.min }); R.moveToBranch(g, 'tra_da', 4); }
  if (!g.stall.open) S.open();
  S.refresh();
  const siteName = SPOTS.find((x) => x.id === site)?.name ?? site;
  toast(`Đã dựng Chuỗi cửa hàng + chi nhánh ${siteName} có người trông coi. Chạm quầy chi nhánh để xem sổ.`, 'good', 'shop', true);
}

export function getDevSections(): DevSection[] {
  return [
    {
      title: 'Địa điểm — tele nhanh',
      items: [
        { id: 'tp_equip', label: 'Tiệm Đồ Nghề Ba Tài', sub: 'Mở giờ 10h00 rồi tới quầy mua đồ nghề & nâng cấp', run: () => {
          const g = ctx.g;
          g.min = Math.max(g.min, 10 * 60);
          if (g.min >= 19 * 60) g.min = 10 * 60;
          const a = ctx.world.anchors.v_equip;
          if (a) tpTo(a.x, a.z + 1.4, Math.PI, 'Đã tới tiệm Đồ Nghề Ba Tài.');
        } },
        { id: 'tp_matbang_tb', label: 'Mặt bằng Phố Văn Phòng', sub: 'Chỗ dựng quán ăn nhỏ / quán có chỗ ngồi / nhà hàng', run: () => tpSpot('matbang_tb', 'Mặt bằng Phố Văn Phòng') },
        { id: 'tp_matbang_dc', label: 'Mặt bằng Khu Căn Hộ', sub: 'Chỗ dựng quán ăn nhỏ / quán có chỗ ngồi / nhà hàng', run: () => tpSpot('matbang_dc', 'Mặt bằng Khu Căn Hộ') },
        { id: 'tp_scrap2', label: 'Vựa ve chai Bà Chín', sub: 'Khu Dân Cư — bán ve chai cho tiện, khỏi chạy về Xóm Lao Động', run: () => {
          const g = ctx.g; g.min = Math.max(g.min, 7 * 60);
          const a = ctx.world.anchors.v_scrap2;
          if (a) tpTo(a.x, a.z + 1.6, Math.PI, 'Đã tới vựa ve chai Bà Chín.');
        } },
        { id: 'tp_canho', label: 'Cửa căn hộ An Bình', sub: 'Bấm chuông gọi Cô Hạnh ra nói chuyện thuê / mua căn hộ', run: () => {
          const a = ctx.world.anchors.bell_canho;
          if (a) tpTo(a.x + Math.sin(a.yaw) * 1.9, a.z + Math.cos(a.yaw) * 1.9, a.yaw + Math.PI, 'Đã tới cửa căn hộ An Bình.');
        } },
        { id: 'tp_cho', label: 'Cổng Chợ', sub: 'Chỗ đặt sạp / quán ăn nhỏ, và là một chỗ mở chi nhánh', run: () => tpSpot('cho', 'Cổng Chợ') },
        { id: 'tp_cv', label: 'Cổng Công Viên', sub: 'Chỗ đặt quầy thường ngày, cũng mở được chi nhánh', run: () => tpSpot('cv', 'Cổng Công Viên') },
        { id: 'tp_road', label: 'Giữa đường lớn', sub: 'Làn xe chạy ở ngã tư Phố Văn Phòng — coi chừng xe tông', run: () => tpTo(CORR[1], CORR[0] + 12, 0, 'Đang đứng giữa lòng đường — coi chừng xe tông!') },
        { id: 'tp_ongtu', label: 'Bàn cờ Ông Tư', sub: 'Ghế đánh cờ cạnh hồ công viên', run: () => {
          const a = ctx.world.anchors.v_danh_co;
          if (a) tpTo(a.x, a.z - 0.9, 0, 'Đã tới bàn cờ của Ông Tư.');
        } },
        { id: 'tp_hobo', label: 'Gầm cầu — Ông Bảy', sub: 'Chỗ hỏi lời khuyên; ban đêm có thùng lửa sưởi', run: () => {
          const a = ctx.world.anchors.v_hobo;
          if (a) tpTo(a.x, a.z + 2.2, Math.PI, 'Đã tới gầm cầu — chỗ Ông Bảy ngồi.');
        } },
        { id: 'tp_chu_ba', label: 'Chú Ba xe ôm', sub: 'Gầm cầu — nhờ chở đi, hoặc nói chuyện để lấy số trong danh bạ', run: () => {
          const g = ctx.g, a = ctx.world.anchors.v_chu_ba;
          g.min = Math.max(g.min, 6 * 60);
          if (a) tpTo(a.x - 1.6, a.z + 1.8, Math.atan2(a.x - (a.x - 1.6), a.z - (a.z + 1.8)), 'Đã tới chỗ Chú Ba xe ôm đứng.');
        } },
        { id: 'tp_mart', label: 'MiniMart 24h', sub: 'Chỗ mua đồ ăn/nguyên liệu lúc khuya mà quán khác đóng', run: () => {
          const a = ctx.world.anchors.v_mart;
          if (a) tpTo(a.x, a.z + 1.5, Math.PI, 'Đã tới MiniMart 24h.');
        } },
        { id: 'tp_lavabo', label: 'Bồn rửa tay trong nhà hàng', sub: 'Lắp bồn rửa (nếu chưa có) rồi đứng cạnh để thử rửa tay', run: () => {
          const g = ctx.g;
          if (!R.isRestaurant(g) || g.stall.where !== 'placed') { toast('Cần dựng nhà hàng trước.', 'warn'); return; }
          if (!R.has(g, 'wc_lavabo')) R.buyGear(g, 'wc_lavabo');
          ctx.stall.rebuild();
          const s = g.stall, c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
          const wx = s.x - 3.12 * c + 2.15 * sn, wz = s.z + 3.12 * sn + 2.15 * c;
          tpTo(wx + 0.9 * c, wz - 0.9 * sn, s.yaw + Math.PI * 0.5, 'Đứng cạnh bồn rửa tay — bấm E hoặc nút tương tác!');
        } },
      ],
    },
  ];
}
