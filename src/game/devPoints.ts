// MENU ẨN (mở bằng cách bấm DEV_TAPS = 8 lần vào chữ "Cài đặt", rồi nhập mã PIN của dev).
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
import * as GANGSIM from '../sim/gang';
import { advice, destOpen, nowText } from '../sim/advice';
import { LANDMARK_BY_ID } from '../data/landmarks';
import { CHANGELOG } from '../data/changelog';
import { FIGHTS } from '../data/gang';
import { DAYS_PER_MONTH } from '../data/gear';
import { RECIPES } from '../data/recipes';
import { money } from '../core/util';
import * as THREE from 'three';
const PUIphone = () => PUI;

/**
 * Dòng “Phiên bản mới nhất” trong menu ẩn.
 * Lượt 66 người chơi báo *“chưa cập nhật menu ẩn”*: câu này là một chuỗi viết tay nên nó đứng
 * nguyên ở bản lượt 62 (đá viên tan chậm) suốt bốn lượt, trong khi menu đã thêm Chú Ba xe ôm.
 * Nay lấy thẳng `CHANGELOG[0].tag` — thêm bản mới vào nhật ký là menu ẩn tự đúng, không có gì để quên.
 * `tests/devpoints.test.ts` canh đúng điều đó.
 */
export const DEV_BUILD_TAG = CHANGELOG[0]?.tag ?? '';

/**
 * MÃ PIN CỦA MENU ẨN. Bấm 8 lần chữ "Cài đặt" (`DEV_TAPS`) chỉ mở bàn phím số; nhập đúng mã này mới thấy menu.
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
  /**
   * Neo trong `world.anchors` mà mục này đưa người chơi tới (chỉ mục đi nhanh mới có).
   * `tests/devpoints.test.ts` canh trường này: mọi mục `tp_…` phải khai một cái neo có thật trong `src/world`,
   * để lần sau ai dời/xoá nhân vật ngoài phố là test đỏ ngay chứ không đợi người chơi bấm hụt.
   */
  anchor?: string;
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

/**
 * Đứng CẠNH một cái neo rồi quay mặt vào đó (mặc định cách 1,7 m).
 * Toạ độ cứng rất dễ rơi vào cột cầu, quầy, kệ hay vách kính — đã gặp ở Chú Ba và ở sạp chợ — nên thử năm
 * khoảng cách × mười hướng, chỗ nào đi được thì đứng. Neo lấy từ `world.anchors` thật, nên dời nhân vật ngoài
 * phố là menu đi theo.
 *
 * **Không đụng tới đồng hồ.** Bản lượt 67 có tua giờ tới giờ mở cửa của chỗ sắp tới; người chơi yêu cầu bỏ
 * hẳn (lượt 68) — đi nhanh mà nhảy cả giờ trong ngày là sửa cả luật chơi. Nơi đóng cửa thì tới đúng lúc nó
 * đóng, đúng như khi tự đi bộ ra đó.
 */
function tpNear(anchor: string, label: string, opt: { d?: number; msg?: string } = {}) {
  const a = ctx.world.anchors[anchor];
  if (!a) { toast(`Không thấy chỗ ${label} ngoài phố.`, 'warn'); return; }
  const base = opt.d ?? 1.7, msg = opt.msg ?? `Đã tới ${label}.`;
  for (const d of [base, base + 0.4, base - 0.3, base + 0.9, base + 1.5]) {
    for (const ang of [0, 0.5, -0.5, 1.0, -1.0, Math.PI, Math.PI / 2, -Math.PI / 2, 2.2, -2.2]) {
      const x = a.x + Math.sin(ang) * d, z = a.z + Math.cos(ang) * d;
      if (ctx.world.blocked(x, z, 0.34)) continue;
      tpTo(x, z, Math.atan2(a.x - x, a.z - z), msg);
      return;
    }
  }
  toast(`Chỗ ${label} chật quá, không tìm được chỗ đứng cạnh.`, 'warn');
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

/**
 * MỐC “VỪA THAY ĐỔI” — BẢN MỚI NHẤT Ở ĐẦU MENU (người chơi yêu cầu, lượt 69).
 *
 * Người chơi nói: *“menu ẩn nên có 1 mục vừa thay đổi để khi ấn ng dev sẽ test được”*. Đúng vấn đề: sau mỗi lượt,
 * menu chỉ có 34 chỗ đi nhanh, nên người làm game muốn thử cái vừa sửa thì phải tự nhớ nó nằm ở đâu, tự đi tới,
 * tự mở đúng bảng. Nay nhóm này **tự dựng từ nội dung của lượt đang làm**:
 *
 * - Khai một `DevStep` cho mỗi việc vừa làm, gắn `since` = nhãn bản (`CHANGELOG[0].v`) lúc làm nó.
 * - `since` khác bản mới nhất ⇒ mục tự ẩn khỏi menu (không ai phải nhớ dọn; xem `latestSteps`).
 *   Riêng mục `log` (đọc lại nhật ký) thì luôn còn, vì nó là mục “kiểm tra bản này đã lên chưa”.
 * - NHÓM NÀY **KHÔNG** đụng tới đồng hồ, không cho tiền, không mở khoá gì: bấm là **đứng đúng chỗ** và **mở sẵn
 *   bảng tương tác** y như người chơi tự bấm, để người làm game thấy đúng cái người chơi sẽ thấy.
 *   Chỉ hai việc nó làm hộ: dựng quán/nhà hàng nếu chưa có (mục có ghi rõ “dựng hộ”), và **đổi CHỖ ĐỨNG**.
 *
 * `tests/devpoints.test.ts` canh: mọi mục ở nhóm đầu phải `since === CHANGELOG[0].v` (không có mục mốc cũ nằm lại),
 * `run` phải là hàm, và mục nào đi tới neo thì `anchor` phải có thật trong `src/world`.
 */
export interface DevStep extends DevAction {
  /** Nhãn bản mà mục này thuộc về (`CHANGELOG[0].v` tại lúc viết). Khác bản mới nhất thì tự ẩn. */
  since: string;
}

/**
 * Đứng đúng `d` mét từ neo rồi QUAY MẶT vào nó — dùng cho mục “vừa thay đổi” (không cần đứng chéo như `tpNear`).
 * `dirs` là thứ tự hướng thử (radian, 0 = phía +z của neo). Quán mía là ví dụ cần đổi: hướng 0 rơi vào phía
 * đường, người chơi quay lưng vào quán nên ảnh “vừa thay đổi” chụp ra toàn đường phố — muốn ngó bàn ghế và
 * bảng giá thì phải đứng phía trong (π), nhìn ra quầy.
 */
function standAt(anchor: string, d = 1.6, msg?: string, dirs?: number[]) {
  const a = ctx.world.anchors[anchor];
  if (!a) return false;
  for (const dd of [d, d + 0.4, d - 0.3, d + 0.9]) {
    for (const ang of dirs ?? [0, 0.5, -0.5, 1.0, -1.0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
      const x = a.x + Math.sin(ang) * dd, z = a.z + Math.cos(ang) * dd;
      if (ctx.world.blocked(x, z, 0.34)) continue;
      ctx.player.place(x, z, Math.atan2(a.x - x, a.z - z));
      ctx.acts.way = null;
      if (msg) toast(msg, 'info', 'pin');
      return true;
    }
  }
  return false;
}

/**
 * Dựng lại các mục “vừa thay đổi” của **bản mới nhất**. Gọi từ `getDevSections()` mỗi lần mở menu nên danh sách
 * luôn khớp `CHANGELOG[0]`: sang lượt sau, các mục dưới đây tự rơi ra, chỉ cần khai mục mới cho lượt đó.
 */
function latestSteps(): DevStep[] {
  const v = CHANGELOG[0]?.v ?? '';
  const g = () => ctx.g;
  const all: DevStep[] = [
    {
      since: 'Lượt 73', id: 'mx_de_doa', tone: 'yellow',
      label: '① Đe doạ người lạ — bậc 4 mới có quyền',
      sub: 'Dựng ván bậc 4 của băng Hẻm rồi đứng giữa phố: thanh tiện ích có nút ĐE DOẠ, bấm vào mở ba mức (xin để yên / lấy đồ quý / siết nợ) kèm mức bị để ý và xác suất bị báo công an',
      run: () => {
        const gg = g();
        if (!gg.gang) { gg.cash = Math.max(gg.cash, 500000); GANGSIM.joinGang(gg, 'hem'); }
        if (gg.gang) { gg.gang.respect = Math.max(gg.gang.respect, 300); gg.gang.tier = 4; }
        // Đứng ngay chợ (đông người) để có người mà đe doạ.
        ctx.player.place(-52, 12, 0);
        ctx.acts.way = null;
        toast('Đã dựng ván bậc 4 ở Chợ Xóm Chiều — mở thanh ☰ rồi bấm ĐE DOẠ.', 'info', 'skull');
        ctx.ui.closePanel();
      },
    },
    {
      since: 'Lượt 73', id: 'mx_danh_nhau', tone: 'yellow',
      label: '② Thử một ván đánh nhau có cảnh 3D',
      sub: 'Dựng ván bậc 4, bật ngay ván “bị úp sọt”: cảnh 3D có ba đứa xông vào, ba nút ĐẤM / ĐỠ / LÙI, đối thủ loạng choạng rồi gục — hết ván mới trả tiền và uy tín',
      run: () => {
        const gg = g();
        if (!gg.gang) { gg.cash = Math.max(gg.cash, 500000); GANGSIM.joinGang(gg, 'hem'); }
        if (gg.gang) { gg.gang.respect = Math.max(gg.gang.respect, 300); gg.gang.tier = 4; }
        ctx.ui.closeDialog(); ctx.ui.closePanel();
        setTimeout(() => ctx.acts.openFight(FIGHTS[0]), 300);
        toast('Ba đứa đang bước ra từ trong hẻm…', 'bad', 'angry');
      },
    },
    {
      since: 'Lượt 73', id: 'mx_giao_dien_android', tone: 'green',
      label: '③ Giao diện kiểu Android — thanh trên cùng + ngăn kéo',
      sub: 'Bật kiểu giao diện mới: thanh trên cùng có giờ + tiền, và nút ☰ mở ngăn kéo chứa Túi đồ / Sổ tay / Bản đồ / Điện thoại / Cài đặt — HUD chỉ còn hai nút nổi (đấm, nhảy)',
      run: () => {
        ctx.set.android = true; saveSettings();
        ctx.ui.applyAndroid?.();
        toast('Đã bật giao diện Android: chạm ☰ ở góc phải trên để mở ngăn kéo.', 'good', 'gear', true);
      },
    },
    {
      since: 'Lượt 72', id: 'mx_bang_cai_gia', tone: 'yellow',
      label: '① Băng là con dao hai lưỡi — mở bảng “cái giá”',
      sub: 'Dựng ván đang ở bậc 4 của băng Hẻm rồi mở thẳng bảng cái giá: mất bao nhiêu phần trăm khách, phí chỗ đội thêm bao nhiêu, công an để ý mấy điểm mỗi ngày',
      run: () => {
        const gg = g();
        if (!gg.gang) { gg.cash = Math.max(gg.cash, 500000); GANGSIM.joinGang(gg, 'hem'); }
        if (gg.gang) { gg.gang.respect = Math.max(gg.gang.respect, 300); gg.gang.tier = 4; gg.gang.paid = Math.max(gg.gang.paid, 6); }
        if (!standAt('v_shark', 1.7, 'Sào huyệt băng Hẻm — xem cái giá của việc theo băng.')) return toast('Không thấy sào huyệt băng Hẻm.', 'warn');
        const n = ctx.npcs.fixed.get('shark');
        if (n) setTimeout(() => ctx.acts.talk(n), 140);
      },
    },
    {
      since: 'Lượt 72', id: 'mx_bang_canh_lam', tone: 'yellow',
      label: '② Thử một cảnh đi làm — hai lựa chọn đều có giá',
      sub: 'Dựng ván bậc 4, đứng trước đại ca: mở Sổ việc rồi chọn “Đi thu nợ thuê” — cảnh kể chuyện bà bán tạp hoá, cuối cảnh phải chọn làm tới (mất tinh thần, uy tín phố) hay rút',
      run: () => {
        const gg = g();
        if (!gg.gang) { gg.cash = Math.max(gg.cash, 500000); GANGSIM.joinGang(gg, 'hem'); }
        if (gg.gang) { gg.gang.respect = Math.max(gg.gang.respect, 300); gg.gang.tier = 4; gg.st.energy = 100; }
        if (!standAt('v_shark', 1.7, 'Sào huyệt băng Hẻm — thử một cảnh đi làm việc.')) return toast('Không thấy sào huyệt băng Hẻm.', 'warn');
        const n = ctx.npcs.fixed.get('shark');
        if (n) setTimeout(() => ctx.acts.talk(n), 140);
      },
    },
    {
      since: 'Lượt 72', id: 'mx_bang_tin_xau', tone: 'yellow',
      label: '③ Bật thử một tin xấu của băng',
      sub: 'Đặt sẵn tin “băng đòi phần tháng này” rồi đợi vài giây: hộp thoại hiện ra với hai lựa chọn nộp tiền hay chịu mất uy tín — cả hai đều có giá',
      run: () => {
        const gg = g();
        if (!gg.gang) { gg.cash = Math.max(gg.cash, 500000); GANGSIM.joinGang(gg, 'hem'); }
        if (gg.gang) { gg.gang.trouble = 'nop_phan'; gg.gang.since = Math.min(gg.gang.since, gg.day - 3); }
        toast('Tin xấu của băng sẽ hiện trong vài giây — để ý hộp thoại.', 'info', 'skull');
        ctx.ui.closePanel();
      },
    },
    {
      since: 'Lượt 71', id: 'mx_bang_dang', tone: 'yellow',
      label: '① Theo băng đảng — đứng trước đại ca, mở sổ việc',
      sub: 'Dựng sẵn một ván đang ở bậc 2 của băng Hẻm, đủ tiền, đứng ngay trước Hùng Sẹo: xem sáu bậc, nhận một ca việc, mở sổ hàng cấm, rồi thử mua một món để thấy giá và mức phạt',
      run: () => {
        const gg = g();
        // Dựng đúng cảnh cần thử: đã theo băng, có uy tín thật (không phải đồ giả đặt vào biến rồi tự khen).
        if (!gg.gang) {
          gg.cash = Math.max(gg.cash, 400000);
          GANGSIM.joinGang(gg, 'hem');
        }
        if (gg.gang) {
          gg.gang.respect = Math.max(gg.gang.respect, 60);
          gg.gang.paid = Math.max(gg.gang.paid, 2);
          gg.cash = Math.max(gg.cash, 500000);
          gg.st.energy = 100;
        }
        if (!standAt('v_shark', 1.7, 'Sào huyệt băng Hẻm — nói chuyện với Hùng Sẹo.')) return toast('Không thấy sào huyệt băng Hẻm.', 'warn');
        const n = ctx.npcs.fixed.get('shark');
        if (n) setTimeout(() => ctx.acts.talk(n), 140);
      },
    },
    {
      since: 'Lượt 71', id: 'mx_bang_dong_nam', tone: 'green',
      label: '② Băng Chợ Cá — Bà Năm Lửa ở vựa cá',
      sub: 'Đứng cạnh sạp cá số 3 trong Chợ Xóm Chiều rồi bấm: hội thoại của phe thứ hai (khác giọng Hùng Sẹo), xem phe phái đang đối đầu bên nào',
      run: () => {
        if (!standAt('v_ba_nam', 1.7, 'Vựa cá trong chợ — Bà Năm Lửa.')) return toast('Không thấy Bà Năm Lửa trong chợ.', 'warn');
        const n = ctx.npcs.fixed.get('ba_nam');
        if (n) setTimeout(() => ctx.acts.talk(n), 140);
      },
    },
    {
      since: 'Lượt 71', id: 'mx_bang_phat', tone: 'yellow',
      label: '③ Thử án phạt hàng cấm',
      sub: 'Đang giữ 3 món hàng cấm (nặng nhất là pháo) rồi gọi thẳng màn hình bị khám: xem tiền phạt, số giờ tù, và mất bao nhiêu uy tín. Huỷ hộp thoại là không mất gì',
      run: () => {
        const gg = g();
        if (!gg.gang) { gg.cash = Math.max(gg.cash, 400000); GANGSIM.joinGang(gg, 'hem'); }
        if (gg.gang) { gg.gang.stock = { phao: 3, thuocla: 2 }; gg.cash = Math.max(gg.cash, 3000000); }
        toast(`Nếu bị khám bây giờ: phạt ${money(GANGSIM.bustFine(gg))}, tạm giữ thêm ${GANGSIM.bustJail(gg)} giờ.`, 'warn', 'badge');
        ctx.ui.panel('devmenu');
      },
    },
    {
      since: 'Lượt 70', id: 'mx_gop_y', tone: 'green',
      label: '① Nút Góp ý & báo lỗi — gửi và đọc lại',
      sub: 'Mở thẳng bảng góp ý: chọn loại, gõ, bấm Gửi rồi xem mục “Đã gửi” bên dưới (cũng mở bằng phím G)',
      run: () => ctx.ui.panel('feedback'),
    },
    {
      since: 'Lượt 70', id: 'mx_mia_xe_moi', anchor: 'v_mia_xe', tone: 'green',
      label: '② Xe nước mía — chỗ mới sát cổng trái chợ',
      sub: 'Xe dời ra cạnh cổng phụ phía nam, quay vào chợ; đứng đây nhìn thẳng vào xe, biển gắn trên nóc chứ không lơ lửng',
      run: () => {
        if (!standAt('v_mia_xe', 1.7, 'Xe nước mía — chỗ mới sát cổng trái chợ.')) return toast('Không thấy xe nước mía trong chợ.', 'warn');
        const n = ctx.npcs.fixed.get('mia_xe');
        if (n) setTimeout(() => ctx.acts.talk(n), 120);
      },
    },
    {
      since: 'Lượt 70', id: 'mx_mia_quan_lui', anchor: 'v_mia_quan', tone: 'green',
      label: '③ Quán Nước Mía 3K — quầy lùi sâu, có bàn ghế ngồi',
      sub: 'Hai bàn nhựa kê TRƯỚC quầy (đỏ bên trái, xanh bên phải), mỗi bàn ba ghế và ly đặt sẵn trên mặt — chừa lối đi ở giữa. Bảng giá áp vách trái, không còn treo lơ lửng',
      run: () => {
        if (!standAt('v_mia_quan', 1.8, 'Quán Nước Mía 3K — quầy lùi sâu, mặt tiền trống.')) return toast('Không thấy quán nước mía ngoài phố.', 'warn');
        const n = ctx.npcs.fixed.get('mia_quan');
        if (n) setTimeout(() => ctx.acts.talk(n), 120);
      },
    },
    {
      since: 'Lượt 70', id: 'mx_ban_ghe_quan_mia', tone: 'green',
      label: '④ Quán mía — bàn ghế & bảng giá đã sửa',
      sub: 'Đứng trong quán ngó quanh: bàn nhựa + ghế nằm ngay trước quầy cho khách ngồi uống, bảng giá dán sát vách thay vì lơ lửng giữa quán',
      run: () => {
        // Đứng PHÍA TRONG quán (dirs π) nhìn ra quầy: hướng 0 là phía đường nên trước đây bấm vào là quay
        // lưng lại quán, chẳng thấy bàn ghế lẫn bảng giá.
        if (!standAt('v_mia_quan', 3.0, 'Quán nước mía — bàn ghế trước quầy, bảng giá dán vách.', [Math.PI, Math.PI + 0.35, Math.PI - 0.35, Math.PI + 0.7, Math.PI - 0.7])) return toast('Không thấy quán nước mía ngoài phố.', 'warn');
        ctx.player.pitch = -0.22;
      },
    },
    {
      since: 'Lượt 70', id: 'mx_mai_cong_truong', anchor: 'v_site', tone: 'yellow',
      label: '⑤ Công trường — chòi tuyển thợ không còn mái bạt',
      sub: 'Bạt sọc xanh–trắng đã dỡ; bàn ghi tên + ghế chờ đứng trơ dưới nắng, bảng “TUYỂN PHỤ HỒ” dán trên vách rào',
      run: () => {
        if (!standAt('v_site', 1.5, 'Chòi tuyển phụ hồ — hết mái bạt, bảng dán thẳng lên vách rào xanh.')) return toast('Không thấy chòi công trình.', 'warn');
        ctx.player.pitch = -0.2;
      },
    },
    {
      since: 'Lượt 70', id: 'mx_ca_phu_ho_dai', anchor: 'site_phu', tone: 'yellow',
      label: '⑥ Ca phụ hồ dài hơn một phút — thử ngay',
      sub: 'Ba xe cút kít × năm xẻng, giữa các xe có nhịp đẩy xe; cả ca khoảng 1 phút 10 giây thời gian thực',
      run: () => {
        if (!standAt('site_phu', 1.7, 'Chòi công trình — xin ca phụ hồ để chơi mini-game xúc đất.')) return toast('Không thấy chòi công trình ngoài phố.', 'warn');
        const n = ctx.npcs.fixed.get('site');
        if (n) setTimeout(() => ctx.acts.talk(n), 120);
      },
    },
    {
      since: 'Lượt 70', id: 'mx_nhat_ky70', tone: 'green',
      label: '⑦ Đọc lại nhật ký bản này',
      sub: 'Mở đúng trang Nhật ký phát triển (cũng là cách kiểm bản dựng đã lên chưa)',
      run: () => ctx.ui.panel('changelog'),
    },
    {
      since: 'Lượt 70', id: 'mx_hinh_khoai_xucxich', tone: 'yellow',
      label: '⑧ Khoai lang & xúc xích — đã vẽ lại',
      sub: 'Dựng ba củ khoai và mấy cây xúc xích ngay trước mặt (cỡ phóng to) để soi hình mới: củ thon hai đầu có mắt củ, xúc xích có nếp gấp ngang và hai đầu bấm kẹp',
      run: async () => {
        // Gắn thẳng bốn món vào ỐNG KÍNH (toạ độ cục bộ của camera) — luôn nằm giữa khung hình, không bị
        // quầy/bàn/tường che, không bị mô hình người chơi chắn. 3,5 giây sau tự dọn.
        const g0 = ctx as unknown as { camera: import('three').Object3D; scene: { add(o: unknown): void; remove(o: unknown): void } };
        g0.scene.add(g0.camera);            // camera chưa nằm trong scene ⇒ đồ gắn vào nó sẽ không được vẽ
        const mod = await import('../gfx/props');
        const w = window as unknown as { __devShapes?: unknown[] };
        (w.__devShapes ?? []).forEach((m) => g0.camera.remove(m as import('three').Object3D));
        const keep: unknown[] = [];
        ['khoailang', 'xucxich', 'khoailang', 'xucxich'].forEach((id, i) => {
          const m = mod.ingMesh(id, 0.9);
          m.position.set((i - 1.5) * 0.26, -0.02 + (i % 2) * 0.05, -0.62);
          // thân món dựng dọc trục Z ⇒ xoay thêm 90° quanh Y để cả cây nằm NGANG khung hình,
          // không thì nhìn dọc trục, củ khoai chỉ còn là một cục tròn.
          m.rotation.set(0.1, -0.22 + i * 0.12, 0.05);
          g0.camera.add(m); keep.push(m);
        });
        w.__devShapes = keep;
        toast('Khoai lang (tím, có mắt củ) & xúc xích (đỏ, có nếp gấp) — soi trước ống kính 3,5 giây.', 'info', 'pin');
        setTimeout(() => { keep.forEach((m) => g0.camera.remove(m as import('three').Object3D)); w.__devShapes = []; }, 3500);
      },
    },
    {
      since: 'Lượt 70', id: 'mx_tron_moi', tone: 'green',
      label: '⑨ Bánh tráng trộn — topping mới trên đĩa',
      sub: 'Mở thẳng mini-game trộn: đậu phộng là hạt có vỏ lụa, rau thơm là ngọn có lá, chanh là lát mỏng sáu múi — hết cảnh hộp nâu to đùng và khối vuông rơi xuống',
      run: () => {
        const gg = g();
        const r = RECIPES.banh_trang_tron;
        if (gg.stall.where !== 'placed') {
          const sp = SPOTS.find((x) => x.id === 'cv');
          if (sp) { if (gg.cash < 400000) gg.cash = 400000; ctx.stall.placeAt(sp); }
        }
        const s = gg.stall;
        if (!R.has(gg, 'ganh')) R.buyGear(gg, 'ganh');
        if (!R.has(gg, 'daothot')) R.buyGear(gg, 'daothot');
        gg.rec.banh_trang_tron.known = true; gg.rec.banh_trang_tron.on = true;
        const have = (id: string) => [s.store, gg.bag].some((l) => l.some((x) => x.id === id && x.n > 0));
        for (const id of Object.keys(r.ings)) {
          if (!have(id)) s.store.push({ id, n: 6, fresh: 100, q: 1, cost: R.unitCost(gg, id) });
        }
        s.preps.push({ rid: 'banh_trang_tron', n: 1, q: 0.92, at: gg.day * 1440 + gg.min, cost: 2000 });
        ctx.stall.refresh();
        if (!ctx.cook.finish(r)) toast('Chưa đủ nguyên liệu cho bánh tráng trộn.', 'warn');
      },
    },
    {
      since: 'Lượt 70', id: 'mx_su_kien_ong_bay', tone: 'yellow',
      label: '⑩ Sự kiện đang chạy — Ông Bảy nói về nó',
      sub: 'Bật một sự kiện của thành phố rồi tới gầm cầu: câu đầu tiên của Ông Bảy phải nhắc đúng sự kiện đó, kèm nút “Chỉ con đường tới…” ghim thẳng chỗ làm ăn được. Trước lượt này ông chỉ nói máu/tiền/nợ/mưa',
      run: () => {
        const gg = g();
        // Bật một sự kiện nếu đang không có cái nào — dùng đúng hàm của game nên nhật ký sự kiện, dòng tin
        // trên radio và ảnh hưởng lên giá/dòng người đều chạy như lúc sự kiện tự tới.
        if (!R.activeEvents(gg).length) R.startEvent(gg, 'le_hoi');
        if (!standAt('v_hobo', 1.6, 'Gầm cầu — hỏi Ông Bảy chuyện đang xảy ra trong phố.')) return toast('Không thấy gầm cầu ngoài phố.', 'warn');
        ctx.player.pitch = -0.05;
        const n = ctx.npcs.fixed.get('hobo');
        if (n) setTimeout(() => ctx.acts.talk(n), 140);
      },
    },
    {
      since: 'Lượt 69', id: 'mx_mia_xe', anchor: 'v_mia_xe', tone: 'green',
      label: '① Xe nước mía trong chợ — bán/mua tại chỗ',
      sub: 'Đứng cạnh xe rồi MỞ SẴN bảng của Cô Hai Mía: mua ly 3.000₫ / ly lớn 5.000₫, xin phụ bán một ca',
      run: () => {
        if (!standAt('v_mia_xe', 1.5, 'Xe nước mía — bấm nói chuyện với Cô Hai Mía.')) return toast('Không thấy xe nước mía ngoài phố.', 'warn');
        const n = ctx.npcs.fixed.get('mia_xe');
        if (n) setTimeout(() => ctx.acts.talk(n), 120);
      },
    },
    {
      since: 'Lượt 69', id: 'mx_mia_quan', anchor: 'v_mia_quan', tone: 'green',
      label: '② Quán Nước Mía 3K trên phố — học nghề, mua ly',
      sub: 'Quán ở mặt tiền bắc Phố Trung Tâm (cạnh quán cơm Bà Tư) — mở sẵn bảng của Chú Tư Mía',
      run: () => {
        if (!standAt('v_mia_quan', 1.6, 'Quán Nước Mía 3K — bấm nói chuyện với Chú Tư Mía.')) return toast('Không thấy quán nước mía ngoài phố.', 'warn');
        const n = ctx.npcs.fixed.get('mia_quan');
        if (n) setTimeout(() => ctx.acts.talk(n), 120);
      },
    },
    {
      since: 'Lượt 69', id: 'mx_phu_ho', anchor: 'site_phu', tone: 'yellow',
      label: '③ Công trường — xin một ca phụ hồ',
      sub: '90 phút, 38.000–52.000₫/ca, 3 ca/ngày, chỉ 7h–16h — mở sẵn bảng của Anh Sáu Lực',
      run: () => {
        if (!standAt('site_phu', 1.7, 'Chòi công trình — bấm nói chuyện với Anh Sáu Lực.')) return toast('Không thấy chòi công trình ngoài phố.', 'warn');
        const n = ctx.npcs.fixed.get('site');
        if (n) setTimeout(() => ctx.acts.talk(n), 120);
      },
    },
    {
      since: 'Lượt 69', id: 'mx_bon_cho', anchor: 'fridge_tro', tone: 'green',
      label: '④ Bốn chỗ dựng sẵn nay chạm được',
      sub: 'Tủ lạnh trong nhà trọ (đang đứng đây) · rồi bàn trà đá Cô Thắm, sàn nhảy của Bin, tiệm quần áo Cô Ngọc',
      run: () => {
        if (!standAt('fridge_tro', 1.5, 'Tủ lạnh nhà trọ — chạm để đặt tủ / mở kho lạnh. Ba chỗ kia nằm trong nhóm Địa điểm.')) toast('Không thấy tủ lạnh nhà trọ.', 'warn');
      },
    },
    {
      since: 'Lượt 69', id: 'mx_mua_mon', tone: 'green',
      label: '⑤ Món nước mía + giá tháng vừa đổi',
      sub: 'Đọc con số thật: giá vốn một ly nước mía, và tiền thuê tháng của bốn chỗ (28 ngày, −20 %)',
      run: () => {
        const gg = g(), r = RECIPES.nuoc_mia;
        const cost = r ? R.recipeCost(gg, r).total : 0;
        const rent = ['tro', 'canho', 'nharieng', 'cuahang'].map((id) => {
          const h = HOUSING[id];
          return `${h.name}: ${money(h.month ?? 0)}/tháng`;
        }).join(' · ');
        const biet = gg.rec.nuoc_mia?.known ? 'đã biết' : 'CHƯA biết (học ở quán 20.000₫)';
        ctx.ui.dialog({ who: 'Con số của bản này', text:
          `Nước mía: giá vốn ${money(cost)}/ly, bán ${money(r?.ref ?? 3000)} — ${biet}.\n`
          + `Thuê theo tháng (${DAYS_PER_MONTH} ngày, rẻ hơn 4 tuần lẻ 20 %): ${rent}.\n`
          + `Hôm nay: bán ${gg.wd.miaSold} ly · phụ bán ${gg.wd.miaShifts} ca nước mía · ${gg.wd.siteShifts} ca phụ hồ.`,
          opts: [{ t: 'Rõ rồi.' }, { t: 'Mở sổ tay xem món', fn: () => ctx.ui.panel('book', 'rec') }] });
      },
    },
    {
      since: 'Lượt 69', id: 'mx_nhat_ky', tone: 'green',
      label: '⑥ Đọc lại nhật ký bản này',
      sub: 'Mở đúng trang Nhật ký phát triển (cũng là cách kiểm bản dựng đã lên chưa)',
      run: () => ctx.ui.panel('changelog'),
    },
  ];
  return all.filter((x) => x.since === v);
}

export function getDevSections(): DevSection[] {
  // Mọi mục đi nhanh đều đứng CẠNH một cái neo thật (`tpNear`) và khai `anchor` để test canh neo còn tồn tại.
  // Không mục nào được đụng tới `g.min` — đi nhanh chỉ đổi chỗ đứng, không đổi giờ trong ngày.
  // Thêm nhân vật ngoài phố chỉ cần thêm một dòng ở đây.
  const di = (id: string, anchor: string, label: string, sub: string, opt: { d?: number } = {}) =>
    ({ id, anchor, label, sub, run: () => tpNear(anchor, label, opt) });
  const moi = latestSteps();
  return [
    // Nhóm đầu tiên: đúng những gì VỪA ĐỔI ở bản đang chơi (`CHANGELOG[0]`). Sang lượt sau các mục này tự rơi ra.
    ...(moi.length ? [{ title: `Vừa thay đổi — ${CHANGELOG[0]?.v ?? ''} (bấm là tới đúng chỗ, mở sẵn bảng)`, items: moi as DevAction[] }] : []),
    {
      title: 'Địa điểm — tele nhanh',
      items: [
        // ── mua bán, đồ nghề ──
        di('tp_equip', 'v_equip', 'Tiệm Đồ Nghề Ba Tài', 'Quầy mua đồ nghề & nâng cấp — mở 7h–20h'),
        di('tp_mart', 'v_mart', 'MiniMart 24h', 'Chỗ mua đồ ăn/nguyên liệu lúc khuya mà quán khác đóng'),
        di('tp_wholesale', 'v_wholesale', 'Vựa đầu mối Tám Lúa', 'Mua sỉ — giá rẻ hơn chợ, mở từ 3 giờ sáng'),
        di('tp_kiosk', 'v_kiosk', 'Tạp hoá Cô Ba', 'Gạo, mắm muối, than, gas, nước đá — ngay Xóm Lao Động'),
        di('tp_eatery', 'v_eatery', 'Quán cơm Bà Tư', 'Ăn cho no, nghe chuyện trong xóm'),
        di('tp_pharmacy', 'v_pharmacy', 'Nhà thuốc An Tâm', 'Thuốc đau bụng, bông băng'),
        di('tp_bank', 'v_bank', 'Ngân hàng', 'Vay vốn, trả nợ, gửi tiền'),
        di('tp_pawn', 'v_pawn', 'Cầm đồ Chú Lâm', 'Cắm đồ lúc túng, chuộc lại sau'),
        di('tp_hot_toc', 'v_hot_toc', 'Tiệm hớt tóc', 'Cắt tóc, đổi kiểu đầu'),
        di('tp_thoi_trang', 'v_thoi_trang', 'Tiệm quần áo Cô Ngọc', 'Mua đồ mặc cho góc nhìn thứ ba'),
        // ── chỗ đặt quầy / mặt bằng ──
        { id: 'tp_matbang_tb', label: 'Mặt bằng Phố Văn Phòng', sub: 'Chỗ dựng quán ăn nhỏ / quán có chỗ ngồi / nhà hàng', run: () => tpSpot('matbang_tb', 'Mặt bằng Phố Văn Phòng') },
        { id: 'tp_matbang_dc', label: 'Mặt bằng Khu Căn Hộ', sub: 'Chỗ dựng quán ăn nhỏ / quán có chỗ ngồi / nhà hàng', run: () => tpSpot('matbang_dc', 'Mặt bằng Khu Căn Hộ') },
        { id: 'tp_cho', label: 'Cổng Chợ', sub: 'Chỗ đặt sạp / quán ăn nhỏ, và là một chỗ mở chi nhánh', run: () => tpSpot('cho', 'Cổng Chợ') },
        { id: 'tp_cv', label: 'Cổng Công Viên', sub: 'Chỗ đặt quầy thường ngày, cũng mở được chi nhánh', run: () => tpSpot('cv', 'Cổng Công Viên') },
        { id: 'tp_road', label: 'Giữa đường lớn', sub: 'Làn xe chạy ở ngã tư Phố Văn Phòng — coi chừng xe tông', run: () => tpTo(CORR[1], CORR[0] + 12, 0, 'Đang đứng giữa lòng đường — coi chừng xe tông!') },
        // ── chỗ ở, giấy tờ ──
        di('tp_canho', 'bell_canho', 'Cửa căn hộ An Bình', 'Bấm chuông gọi Cô Hạnh ra nói chuyện thuê / mua căn hộ'),
        di('tp_tro', 'v_tro', 'Nhà trọ', 'Phòng trọ rẻ, có tủ lạnh'),
        di('tp_hotel', 'v_hotel', 'Khách sạn', 'Ngủ một đêm cho lại sức, có buồng tắm'),
        di('tp_motel', 'v_motel', 'Nhà nghỉ', 'Nghỉ vài tiếng cho đỡ mệt'),
        di('tp_hospital', 'v_hospital', 'Bệnh viện', 'Khám bệnh, mua thuốc, nằm giường'),
        di('tp_police', 'v_police', 'Công an khu vực', 'Bị để ý thì tới đây'),
        // ── người quen ngoài phố ──
        di('tp_hobo', 'v_hobo', 'Gầm cầu — Ông Bảy', 'Chỗ hỏi lời khuyên; ban đêm có thùng lửa sưởi', { d: 2.2 }),
        di('tp_chu_ba', 'v_chu_ba', 'Chú Ba xe ôm', 'Gầm cầu — nhờ chở đi, hoặc nói chuyện để lấy số trong danh bạ'),
        di('tp_tra_da', 'v_tra_da', 'Quán trà đá Cô Thắm', 'Ngồi nghỉ, nghe chuyện trong xóm'),
        di('tp_sua_xe', 'v_sua_xe', 'Chú Hậu vá xe', 'Vá xe, bơm hơi ngoài lề đường'),
        di('tp_hat_rong', 'v_hat_rong', 'Cô Hồng hát rong', 'Nghe hát, bỏ tiền vào thùng ủng hộ'),
        di('tp_danh_co', 'v_danh_co', 'Bàn cờ Ông Tư', 'Ghế đánh cờ cạnh hồ công viên'),
        di('tp_danh_giay', 'v_danh_giay', 'Bé Bo đánh giày', 'Đánh giày 5.000₫ ở vỉa hè phố bến xe'),
        di('tp_rap', 'v_rap', 'Góc nhảy của Bin', 'Sàn các-tông dưới gầm cầu, cạnh tường vẽ'),
        di('tp_dua', 'v_dua', 'Chỗ đua xe đạp', 'Ba tay đua tập ở công viên, 14h30–18h'),
        di('tp_net', 'v_net', 'Quán net', 'Chơi game, lướt web, sạc nhờ'),
        di('tp_cafe', 'v_cafe', 'Quán cà phê', 'Uống cà phê, nghe tin trong xóm'),
        di('tp_scrap2', 'v_scrap2', 'Vựa ve chai Bà Chín', 'Khu Dân Cư — bán ve chai cho tiện, khỏi chạy về Xóm Lao Động'),
        // ── trong nhà hàng ──
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
