// MENU TEST & DỊCH CHUYỂN ẨN (mở bằng cách bấm 7 lần vào chữ "Cài đặt", rồi nhập mã PIN của dev).
// Lưu ý bảo trì: mỗi lượt thêm tính năng mới thì THAY mục test cũ bằng mục của tính năng mới,
// chỉ giữ lại nhóm "Địa điểm — tele nhanh". Đừng để menu phình thành bãi rác test cũ.
import { ctx, QUALITY, saveSettings } from './ctx';
import * as R from '../sim/rules';
import { RECIPES, RECIPE_LIST } from '../data/recipes';
import { SPOTS, CORR } from '../world/layout';
import { HOUSING } from '../data/gear';
import { toast } from '../core/bus';
import { downloadForOffline } from '../core/offline';
import { addStack } from '../sim/state';
import * as PUI from '../ui/phoneUI';
import * as PH from '../sim/phone';
import { REGULARS } from '../data/people';
import { advice, destOpen, nowText } from '../sim/advice';
import { LANDMARK_BY_ID } from '../data/landmarks';
import { SHOPS } from '../data/shops';
import { INGS } from '../data/ingredients';
import { money } from '../core/util';
const PUIphone = () => PUI;

export const DEV_BUILD_TAG = 'Bánh tráng trộn có mini game riêng: 5 topping rải ở vị trí ngẫu nhiên mỗi ván, máy gọi tên thứ nào thì chạm đúng đĩa đó';

/**
 * MÃ PIN CỦA MENU ẨN. Bấm 7 lần chữ "Cài đặt" chỉ mở bàn phím số; nhập đúng mã này mới thấy menu test.
 * Đây KHÔNG phải bảo mật (mã nằm trong gói JavaScript, ai mở DevTools cũng thấy) — chỉ để người chơi
 * không vô tình mở trúng bảng test rồi tưởng là tính năng của game. Mở xong thì nhớ trong phiên chơi,
 * mở lại Cài đặt là vào thẳng menu cho tiện làm việc.
 */
export const DEV_PIN = '7777';
/** Độ dài mã PIN (4 số) — dùng chung cho bàn phím số và test. */
export const DEV_PIN_LEN = 4;
/**
 * Kết quả một lần bấm phím số: `'ok'` mở menu, `'wrong'` là sai (xoá hết số đã nhập), `'more'` là còn nhập tiếp.
 * Số SAI không bao giờ gần đúng: so cả chuỗi, nhập 4 số là phán một lần.
 */
export function devPinInput(entered: string, digit: string): { next: string; result: 'ok' | 'wrong' | 'more' } {
  const next = (entered + digit).slice(0, DEV_PIN_LEN);
  if (next.length < DEV_PIN_LEN) {
    // Nhập tới đâu đã sai tới đó thì báo luôn, không bắt gõ đủ 4 số mới biết sai.
    if (!DEV_PIN.startsWith(next)) return { next: '', result: 'wrong' };
    return { next, result: 'more' };
  }
  return next === DEV_PIN ? { next, result: 'ok' } : { next: '', result: 'wrong' };
}

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
      title: 'Mới nhất — bánh tráng trộn: 5 topping nằm ngẫu nhiên mỗi ván (lượt 58)',
      items: [
        {
          id: 't58_tron_setup',
          label: 'Chuẩn bị: quầy + nguyên liệu + sơ chế sẵn bánh tráng trộn',
          sub: 'Dựng quầy ở cổng công viên, cho đủ 5 nguyên liệu và 8 phần đã sơ chế — bấm xong là nấu được ngay',
          tone: 'green',
          closePanel: true,
          run: () => {
            const g = ctx.g, S = ctx.stall;
            g.cash = Math.max(g.cash, 3000000);
            for (const id of ['ganh', 'daothot']) if (!R.has(g, id)) R.buyGear(g, id);
            for (const [id, n] of [['banhtrang', 12], ['dauphong', 8], ['rauthom', 8], ['tuongot', 8], ['chanh', 8]] as [string, number][])
              addStack(g.stall.store, { id, n, fresh: 100, q: 1, cost: R.unitCost(g, id) });
            const sp = SPOTS.find((x) => x.id === 'cv') ?? SPOTS[0];
            if (g.stall.where !== 'placed' || g.stall.spot !== sp.id) S.placeAt(sp);
            g.stall.cond = 100; g.stall.dirt = 0; g.min = 10 * 60;
            // Quầy bậc 1 chỉ bày được 3 món: bật món bánh tráng trộn lên và tắt bớt món khác cho vừa chỗ.
            for (const rd of RECIPE_LIST) if (g.rec[rd.id]) g.rec[rd.id].on = false;
            g.rec.banh_trang_tron.known = true; g.rec.banh_trang_tron.on = true;
            g.stall.preps = g.stall.preps.filter((p) => p.rid !== 'banh_trang_tron');
            g.stall.preps.push({ rid: 'banh_trang_tron', n: g.stall.preps.reduce((a, p) => a + (p.rid === 'banh_trang_tron' ? p.n : 0), 0) + 8, q: 0.92, at: g.day * 1440 + g.min, cost: 2600 });
            S.refresh();
            toast('Đã chuẩn bị xong quầy bánh tráng trộn + 8 phần sơ chế — mở Thực đơn để làm món.', 'good', 'dish', true);
          },
        },
        {
          id: 't58_tron_choi',
          label: 'Vào thẳng mini game trộn topping (bỏ qua bước sơ chế)',
          sub: 'Mở bàn nấu bánh tráng trộn: 5 topping rải ngẫu nhiên, máy gọi tên từng thứ — chạm đúng cái đang gọi',
          tone: 'green',
          closePanel: true,
          run: () => {
            const g = ctx.g, S = ctx.stall;
            if (g.stall.where !== 'placed') { toast('Đặt quầy xuống chỗ bán trước đã.', 'warn'); return; }
            if (!g.stall.preps.some((p) => p.rid === 'banh_trang_tron'))
              g.stall.preps.push({ rid: 'banh_trang_tron', n: 2, q: 0.92, at: g.day * 1440 + g.min, cost: 2600 });
            for (const [id, n] of [['dauphong', 2], ['tuongot', 2], ['chanh', 2]] as [string, number][])
              if (![g.stall.store, g.bag].some((l) => l.some((st) => st.id === id && st.n > 0)))
                addStack(g.stall.store, { id, n, fresh: 100, q: 1, cost: R.unitCost(g, id) });
            S.refresh();
            ctx.cook.finish(RECIPES.banh_trang_tron);
          },
        },
        {
          id: 't58_tron_do',
          label: 'Đọc vị trí 5 topping của ván đang mở',
          sub: 'In ra toạ độ từng đĩa + thứ tự máy gọi, để so hai ván liền nhau xem vị trí có đổi thật không',
          tone: 'yellow',
          closePanel: false,
          run: () => {
            const m = ctx.cook.current as unknown as { spots?: { x: number; z: number; li: number }[]; calls?: number[]; k?: number; miss?: number } | null;
            if (!m || !m.spots) { toast('Chưa mở mini game trộn — bấm mục “Vào thẳng mini game” trước.', 'info'); return; }
            const st = RECIPES.banh_trang_tron.finish[0] as { layers: { ing: string }[] };
            const rows = m.spots.map((s) => `· ${INGS[st.layers[s.li].ing].name} — (${s.x.toFixed(3)}; ${s.z.toFixed(3)})`);
            ctx.ui.dialog({ who: 'Ván trộn topping', text: `Toạ độ 5 đĩa trên bàn (mét):\n${rows.join('\n')}\n\nThứ tự gọi: ${(m.calls ?? []).map((c) => c + 1).join(' → ')}\nĐang ở lượt ${(m.k ?? 0) + 1}, chạm nhầm ${m.miss ?? 0} lần.`, opts: [{ t: 'Đóng' }] });
          },
        },
      ],
    },
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
