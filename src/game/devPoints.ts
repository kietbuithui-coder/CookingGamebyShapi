// MENU TEST & DỊCH CHUYỂN ẨN (mở bằng cách bấm 7 lần vào chữ "Cài đặt", rồi nhập mã PIN của dev).
// Lưu ý bảo trì: mỗi lượt thêm tính năng mới thì THAY mục test cũ bằng mục của tính năng mới,
// chỉ giữ lại nhóm "Địa điểm — tele nhanh". Đừng để menu phình thành bãi rác test cũ.
import { ctx, QUALITY, saveSettings } from './ctx';
import * as R from '../sim/rules';
import { RECIPES } from '../data/recipes';
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

export const DEV_BUILD_TAG = 'Sạp Dì Sáu đổi tên thành Trứng – Sữa – Giò + khách không còn đi xuyên quầy gánh + hết kẹt khi ngủ ở nhà nghỉ/nhà trọ, buồng tắm có vòi sen dựng thật';

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
      title: 'Mới nhất — tên sạp Dì Sáu, khách không xuyên quầy, ngủ ở nhà nghỉ/trọ, buồng tắm (lượt 55)',
      items: [
        {
          id: 't55_sap_tensach',
          label: 'Sạp Dì Sáu giờ tên gì, bán những gì?',
          sub: 'Đọc thẳng bảng hàng của sạp trong chợ: trứng, sữa, giò chả — kèm giá và giờ mở',
          tone: 'green',
          closePanel: true,
          run: () => {
            const s = SHOPS.m_trung;
            const lines = s.items.map((id) => {
              const d = INGS[id];
              return `· ${d.name} — ${money(d.price)}/${d.unit}`;
            });
            ctx.ui.dialog({
              who: s.vendor,
              text: `Sạp ${s.name}, mở ${s.open[0]}h–${s.open[1]}h trong chợ.\n\n${lines.join('\n')}\n\n“${s.say}”`,
              opts: [{ t: 'Đóng' }],
            });
          },
        },
        {
          id: 't55_sap_tele',
          label: 'Tele tới sạp Trứng – Sữa – Giò Dì Sáu',
          sub: 'Đứng ngay trước sạp trong chợ để bấm hỏi mua từng món',
          tone: 'yellow',
          closePanel: true,
          run: () => {
            tpFront(ctx.world.anchors.v_m_trung, 'Đã tới sạp Dì Sáu trong chợ — bấm vào ô hàng để hỏi mua.');
          },
        },
        {
          id: 't55_ngu_nhanghi',
          label: 'Ngủ thử ở nhà nghỉ — xem có tỉnh dậy trong gian khác không',
          sub: 'Thuê sẵn phòng 3 đêm rồi mở bảng ngủ; tỉnh dậy phải đứng cạnh giường, không lọt sang gian bên',
          tone: 'green',
          closePanel: true,
          run: () => {
            const g = ctx.g;
            g.housing = 'nhanghi'; g.paidUntil = Math.max(g.paidUntil, g.day + 3);
            const sp = ctx.acts.bedStand('nhanghi');
            if (sp) tpTo(sp.x, sp.z, sp.yaw, 'Nhà nghỉ Bình Dân — bấm vào giường rồi chọn ngủ.');
          },
        },
        {
          id: 't55_ngu_tro',
          label: 'Ngủ thử ở phòng trọ — cùng phép thử',
          sub: 'Thuê sẵn phòng trọ 1 tuần rồi mở bảng ngủ ở giường cuối phòng',
          tone: 'green',
          closePanel: true,
          run: () => {
            const g = ctx.g;
            g.housing = 'tro'; g.paidUntil = Math.max(g.paidUntil, g.day + 7);
            const sp = ctx.acts.bedStand('tro');
            if (sp) tpTo(sp.x, sp.z, sp.yaw, 'Phòng trọ Bác Năm — bấm vào giường rồi chọn ngủ.');
          },
        },
        {
          id: 't55_sen_nhanghi',
          label: 'Buồng tắm nhà nghỉ — vòi sen vừa vẽ lại',
          sub: 'Nhìn vào góc tắm cuối phòng: tường ốp gạch, khay có lỗ thoát, đầu sen có lỗ phun',
          tone: 'yellow',
          closePanel: true,
          run: () => {
            const g = ctx.g; g.housing = 'nhanghi'; g.paidUntil = Math.max(g.paidUntil, g.day + 3);
            const w = ctx.world.anchors.wash_nhanghi;
            if (w) standNear(w.x, w.z - 0.3, 'Buồng tắm nhà nghỉ — đứng đây ngắm vòi sen.');
          },
        },
        {
          id: 't55_sen_tro',
          label: 'Buồng tắm nhà trọ — cùng vòi sen đó',
          sub: 'Góc tắm cuối phòng trọ: sen treo trên vách ngăn, cạnh bàn thấp có ấm nước',
          tone: 'yellow',
          closePanel: true,
          run: () => {
            const g = ctx.g; g.housing = 'tro'; g.paidUntil = Math.max(g.paidUntil, g.day + 7);
            const w = ctx.world.anchors.wash_tro;
            if (w) standNear(w.x, w.z - 0.3, 'Góc tắm phòng trọ — đứng đây ngắm vòi sen.');
          },
        },
        {
          id: 't55_ganh_cho',
          label: 'Bán gánh ở Cổng Chợ — xem khách có đi xuyên quầy',
          sub: 'Đặt gánh ở chợ, dọn 40 phần trà đá rồi mở bán: khách phải vòng qua đầu quầy, không cắt ngang thân quầy',
          tone: 'green',
          closePanel: true,
          run: () => {
            const g = ctx.g, S = ctx.stall;
            if (g.stall.tier > 2) { toast('Phép thử này dành cho gánh / xe đẩy (bậc 1–2) — quầy của anh chị đang ở bậc cao hơn.', 'warn'); return; }
            g.cash = Math.max(g.cash, 500000);
            for (const id of ['ganh', 'daothot', 'bepthan', 'noi', 'chao']) if (!R.has(g, id)) R.buyGear(g, id);
            if (g.stall.tier > 2) { toast('Không mua được gánh — quầy đang ở bậc cao hơn.', 'warn'); return; }
            for (const [id, n] of [['tra', 80], ['da', 80]] as const) addStack(g.stall.store, { id, n, fresh: 95, q: 0.9, cost: 1000 });
            g.rec.tra_da.known = true; g.rec.tra_da.on = true;
            if (!g.stall.ready.some((r) => r.rid === 'tra_da')) g.stall.ready.push({ rid: 'tra_da', n: 40, q: 0.9, cost: 3000, at: g.min });
            const sp = SPOTS.find((s) => s.id === 'cho');
            if (!sp) return;
            if (!S.placeAt(sp)) return;
            const [px, pz] = S.standPos();
            ctx.player.place(px, pz, g.stall.yaw, -0.2);
            S.open();
            toast('Gánh trà đá đã mở ở Cổng Chợ — đứng đây nhìn khách đi vòng qua đầu quầy.', 'good', 'shop', true);
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
