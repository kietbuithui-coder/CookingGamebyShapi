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

export const DEV_BUILD_TAG = 'Ông Bảy gợi ý theo đúng tình cảnh của ván (máu, cái bụng, túi tiền, giờ), mỗi câu kèm khoảng cách và nút ghim đường đi';

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
      title: 'Mới nhất — Ông Bảy gợi ý theo tình cảnh thật, PIN 7777 (lượt 52)',
      items: [
        {
          id: 'hobo_now',
          label: 'Ông Bảy đang khuyên gì lúc này?',
          sub: 'Tính lại từ trạng thái thật: máu, bụng, tiền, giờ, quầy, nợ, thời tiết',
          tone: 'green',
          closePanel: true,
          run: () => {
            const g = ctx.g;
            const list = advice(g, { x: ctx.player.x, z: ctx.player.z, anchors: ctx.world.anchors });
            const lines = list.slice(0, 6).map((a, i) => `${i + 1}. [${a.urgent}] ${a.id} → ${LANDMARK_BY_ID[a.place]?.name ?? a.place}\n${a.text}`);
            ctx.ui.dialog({
              who: 'Ông Bảy — lời khuyên hiện tại', npc: undefined,
              text: `Giờ ${nowText(g)} · máu ${Math.round(g.st.health)} · bụng ${Math.round(g.st.hunger)} · sức ${Math.round(g.st.energy)} · túi ${money(g.cash)} · ${list.length} câu đang đúng, câu gấp nhất ở trên:\n\n` + lines.join('\n\n'),
              opts: [{ t: 'Đóng' }],
            });
          },
        },
        {
          id: 'hobo_tele',
          label: 'Tele tới gầm cầu, hỏi Ông Bảy ngay',
          sub: 'Đứng trước mặt ông rồi tự mở hộp thoại — thử câu khuyên trong game thật',
          tone: 'yellow',
          closePanel: true,
          run: () => {
            const a = ctx.world.anchors.v_hobo;
            if (a) tpTo(a.x, a.z + 2.2, Math.PI, 'Đã tới gầm cầu — chạm Ông Bảy để hỏi.');
            const n = ctx.npcs.fixed.get('hobo');
            if (n) { ctx.player.face(n.x, n.z); setTimeout(() => ctx.acts.talk(n), 350); }
          },
        },
        {
          id: 'hobo_audit',
          label: 'Soát 96 lần trong ngày: có câu nào chỉ chỗ đã đóng cửa không?',
          sub: 'Đổi giờ 0h→23h (mỗi lần 15 phút) rồi tính lại — câu nào cũng phải trỏ đích có thật & đang mở',
          tone: 'green',
          closePanel: false,
          run: () => {
            const g = ctx.g, old = g.min, bad: string[] = [];
            let n = 0;
            for (let k = 0; k < 96; k++) {
              g.min = Math.floor(k / 4) * 60 + (k % 4) * 15;
              for (const a of advice(g)) {
                n++;
                const lm = LANDMARK_BY_ID[a.place];
                if (!lm) bad.push(`${k}: mã lạ ${a.place}`);
                else if (!lm.always && !destOpen(g, a.place)) bad.push(`${nowText(g)} ${a.id} → ${lm.name} (đóng cửa)`);
              }
            }
            g.min = old;
            toast(bad.length ? `${bad.length}/${n} câu sai: ${bad.slice(0, 3).join(' · ')}` : `Soát ${n} câu trong 96 mốc giờ: không câu nào chỉ chỗ đã đóng cửa.`, bad.length ? 'bad' : 'good', 'bolt', true);
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
