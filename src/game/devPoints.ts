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
import { money } from '../core/util';
const PUIphone = () => PUI;

export const DEV_BUILD_TAG = 'Thanh thể lực hồi nhanh/chậm theo máu và pin năng lượng — người khoẻ chạy 10 giây, máu 20 chạy ngắn hơn và đứng chờ lâu gấp đôi mới đầy thanh';

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
      title: 'Mới nhất — thanh chạy hồi theo máu & pin (lượt 53)',
      items: [
        {
          id: 'stam_now',
          label: 'Thanh chạy của bạn lúc này hồi nhanh hay chậm?',
          sub: 'Đọc từ chính máu và pin hiện tại: bao nhiêu giây thì đầy, chạy liền được mấy giây',
          tone: 'green',
          closePanel: true,
          run: () => {
            const g = ctx.g;
            const regen = R.staminaRegen(g, false), drain = R.staminaDrain(g), mul = R.staminaRegenMul(g);
            ctx.ui.dialog({
              who: 'Thanh chạy lúc này',
              text: `Máu ${Math.round(g.st.health)}/100 · pin ${Math.round(g.st.energy)}/100 — thanh thể lực hồi ${Math.round(mul * 100)}% tốc độ bình thường.\n\n`
                + `Đứng yên: +${(regen * 100).toFixed(1)}%/giây → ${(1 / regen).toFixed(0)} giây thì đầy thanh.\n`
                + `Vừa đi vừa hồi: +${(R.staminaRegen(g, true) * 100).toFixed(1)}%/giây.\n`
                + `Chạy: −${(drain * 100).toFixed(1)}%/giây → thanh đầy chạy liền được ${(1 / drain).toFixed(1)} giây.\n\n`
                + `Máu càng thấp và pin càng cạn thì hồi càng chậm, tụt càng nhanh. Ăn no, ngủ đủ, đi khám khi mất máu là chạy dai nhất.`,
              opts: [{ t: 'Đóng' }],
            });
          },
        },
        {
          id: 'stam_compare',
          label: 'So ba mức: khoẻ / máu 45 / máu 20 (pin cạn theo)',
          sub: 'Bảng số thật của luật mới: hồi mấy giây đầy thanh và chạy liền được bao lâu',
          tone: 'yellow',
          closePanel: true,
          run: () => {
            const rows = [[95, 90], [45, 45], [20, 0]].map(([hp, en]) => {
              const h0 = ctx.g.st.health, e0 = ctx.g.st.energy;
              ctx.g.st.health = hp; ctx.g.st.energy = en;
              const mul = R.staminaRegenMul(ctx.g), drain = R.staminaDrain(ctx.g);
              ctx.g.st.health = h0; ctx.g.st.energy = e0;
              return `máu ${hp}/pin ${en}: hồi ${Math.round(mul * 100)}% → ${(1 / (0.09 * mul)).toFixed(0)} giây đầy, chạy liền ${(1 / drain).toFixed(1)} giây`;
            });
            ctx.ui.dialog({ who: 'Thanh chạy — hồi theo máu & pin', text: rows.join('\n'), opts: [{ t: 'Đóng' }] });
          },
        },
        {
          id: 'stam_hurt',
          label: 'Cho mình đang thương: máu 20, pin 10',
          sub: 'Đặt chỉ số rồi giữ Shift (hoặc đẩy cần ảo) để thấy chạy ngắn hơn và lâu đầy thanh hơn',
          tone: 'red',
          closePanel: true,
          run: () => {
            const g = ctx.g; g.st.health = 20; g.st.energy = 10;
            toast(`Máu 20, pin 10 — thanh thể lực giờ chỉ hồi ${Math.round(R.staminaRegenMul(g) * 100)}% tốc độ. Giữ Shift mà chạy thử.`, 'bad', 'heart', true);
          },
        },
        {
          id: 'stam_heal',
          label: 'Trả lại người khoẻ: máu 90, pin 90',
          sub: 'Để thử lại cảm giác chạy đủ đà, hoặc dọn chỉ số sau khi test xong',
          tone: 'green',
          closePanel: true,
          run: () => {
            const g = ctx.g; g.st.health = 90; g.st.energy = 90; g.st.hunger = Math.max(g.st.hunger, 70); g.st.thirst = Math.max(g.st.thirst, 70);
            toast('Đã trả máu 90, pin 90, bụng và nước đủ — thanh thể lực hồi lại bình thường.', 'good', 'heart');
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
