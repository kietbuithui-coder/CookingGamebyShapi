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

export const DEV_BUILD_TAG = 'Menu ẩn dựng sẵn bếp + nồi + than cho trà đá và trà chanh (chạm chén là vào nồi)'

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

/**
 * Dựng sẵn mọi thứ để nấu một món nước có bước nấu: quầy đã đặt, bếp + nồi + than, đủ nguyên liệu.
 * Người chơi báo (lượt 61): bấm “Chạy” trên ván trắng thì nồi không mở — vì ván mới chỉ có 18.000₫,
 * chưa có gánh nên `placeAt` từ chối (cần cấp 1), và thiếu bếp/nồi/than. Hàm này lo hết ba thứ đó.
 */
function chuanBiNoi(rid: string): boolean {
  const g = ctx.g, r = RECIPES[rid];
  if (g.cash < 400000) g.cash = 400000;                        // đủ tiền gánh + bếp + nồi + than
  for (const id of ['ganh', 'bepthan', 'noi', 'daothot'] as const) if (!R.has(g, id)) R.buyGear(g, id);
  if (g.stall.where !== 'placed') { const sp = SPOTS.find((x) => x.id === 'cv') ?? SPOTS[0]; ctx.stall.placeAt(sp); }
  const kho = (id: string) => g.stall.store.filter((x) => x.id === id).reduce((a, b) => a + b.n, 0);
  const cho = (id: string, need: number) => { const have = kho(id); if (have < need) addStack(g.stall.store, { id: id as never, n: need - have, fresh: 100, q: 1, cost: R.unitCost(g, id) }); };
  if (kho('than') < 6) cho('than', 6);
  if (!g.rec[rid]) g.rec[rid] = { known: false, price: r.ref, on: false, made: 0, best: 0 } as typeof g.rec[string];
  g.rec[rid].known = true; g.rec[rid].on = true;
  g.stall.preps = g.stall.preps.filter((p) => p.rid !== rid);
  // Mỗi lượt nấu 12 phần: cho đủ 2 lượt + dư 1 để không phải đi chợ giữa chừng.
  for (const [id, kg] of Object.entries(r.ings)) cho(id, Math.ceil(kg * 24) + 1);
  return ctx.cook.prep(r);
}

export function getDevSections(): DevSection[] {
  return [
    {
      title: 'Mới nhất — dựng sẵn bếp trà (lượt 60) + trần việc làm mỗi ngày (lượt 59)',
      items: [
        {
          id: 't59_viec_bang',
          label: 'Mở bảng việc làm',
          sub: 'Xem đủ 7 việc kèm số còn lại thật của hôm nay — mở lúc 5h sáng để thấy mọi hạn mức còn nguyên',
          tone: 'yellow',
          closePanel: false,
          run: () => {
            const g = ctx.g;
            if (g.min < 270 || g.min >= 22 * 60) g.min = 5 * 60;
            ctx.acts.board();
          },
        },
        {
          id: 't59_viec_sang',
          label: 'Chuẩn bị: 5h sáng, đủ sức, sạch sẽ, không thiếu tiền',
          sub: 'Về bến cảng (4h50), cho đầy sức khoẻ và 200.000₫ để thử ngay ca bốc cá lẫn vác bao',
          tone: 'green',
          closePanel: true,
          run: () => {
            const g = ctx.g;
            g.min = 4 * 60 + 50;
            g.st.energy = 100; g.st.hunger = 100; g.st.thirst = 100; g.st.hygiene = 100; g.st.mood = 80;
            g.cash = Math.max(g.cash, 200000);
            const a = ctx.world.anchors.v_dock;
            if (a) tpTo(a.x + 1.6, a.z + 1.6, Math.PI, 'Đã về bến cảng lúc 4h50 — bấm E vào anh Sáu Lực để thử ca bốc cá / vác bao.');
          },
        },
        {
          id: 't59_viec_ca_bo',
          label: 'Làm hết ca bốc cá của hôm nay (2 ca)',
          sub: 'Gọi thẳng 2 ca rồi ca thứ 3 — phải bị chặn kèm lời nhắc “mai ra sớm nha”',
          tone: 'yellow',
          closePanel: false,
          run: () => {
            const g = ctx.g, R2 = R;
            if (g.min < 270 || g.min >= 600) g.min = 5 * 60;
            g.st.energy = 100;
            let done = 0;
            while (R2.dockShiftsLeft(g) > 0 && done < 5) { ctx.acts.dockShift(); done++; }
            const tr = Math.floor(g.min % 1440);
            if (R2.dockShiftsLeft(g) > 0) { toast('Chưa đủ ca — kiểm giờ (4h30–10h) và sức khoẻ ≥ 35.', 'warn'); return; }
            toast(`Đã làm ${done} ca bốc cá (tới ${Math.floor(tr / 60)}h${String(tr % 60).padStart(2, '0')}). Bấm lại nút ca để thấy câu chặn.`, 'good', 'cash', true);
          },
        },
        {
          id: 't59_viec_ca_quan',
          label: 'Làm hết ca chạy bàn của hôm nay (3 ca)',
          sub: 'Gọi thẳng 3 ca ở quán Bóng Đá rồi ca thứ 4 — phải bị chặn, kể cả sang quán Sân Vườn',
          tone: 'yellow',
          closePanel: false,
          run: () => {
            const g = ctx.g;
            if (g.min < 6 * 60 || g.min >= 21 * 60) g.min = 7 * 60;
            g.st.energy = 100;
            let done = 0;
            while (R.cafeShiftsLeft(g) > 0 && done < 6) { (ctx.acts as unknown as { cafeShift: (garden?: boolean) => void }).cafeShift(false); done++; }
            if (R.cafeShiftsLeft(g) > 0) { toast('Chưa đủ ca — kiểm giờ (6h–22h) và sức khoẻ ≥ 28.', 'warn'); return; }
            toast(`Đã chạy ${done} ca (còn ${R.cafeShiftsLeft(g)} ca). Thử xin thêm ở quán Sân Vườn — cũng bị chặn.`, 'good', 'cash', true);
          },
        },
        {
          id: 't59_viec_bao',
          label: 'Vác tới bao cuối rồi thử vác lố',
          sub: 'Đặt sổ về 19/20 bao, vác 1 bao cho đủ trần, rồi thử vác thêm — phải bị chặn ở đúng 20, không lên 21',
          tone: 'yellow',
          closePanel: false,
          run: () => {
            const g = ctx.g;
            if (g.min < 270 || g.min >= 600) g.min = 6 * 60;
            g.st.energy = 100;
            const j = ctx.acts.job;
            if (j?.kind === 'dock' && j.carrying) ctx.acts.dockDrop();
            g.wd.sacks = Math.max(0, R.DOCK_SACKS_DAY - 1);
            ctx.acts.job = { kind: 'dock', carrying: true };
            ctx.acts.dockDrop();
            const full = g.wd.sacks;
            ctx.acts.job = { kind: 'dock', carrying: true };
            ctx.acts.dockDrop();
            toast(`Sổ ngày: ${full}/${R.DOCK_SACKS_DAY} bao sau bao cuối; thử vác lố → vẫn ${g.wd.sacks}/${R.DOCK_SACKS_DAY} (không lên ${R.DOCK_SACKS_DAY + 1}).`, g.wd.sacks <= R.DOCK_SACKS_DAY ? 'good' : 'bad', 'box', true);
          },
        },
        {
          id: 't61_tra',
          label: 'Dựng sẵn bếp cho TRÀ ĐÁ và TRÀ CHANH',
          sub: 'Đặt quầy, mua bếp + nồi + than, đủ nguyên liệu 2 món — chọn món rồi vào ngay bước cho nguyên liệu',
          tone: 'green',
          closePanel: true,
          run: () => {
            const mở = (rid: string) => { if (!chuanBiNoi(rid)) toast('Không mở được nồi — xem dòng lỗi trên màn hình.', 'warn'); };
            chuanBiNoi('tra_da');        // dựng bếp + nguyên liệu cả 2 món trước
            chuanBiNoi('tra_chanh');
            ctx.ui.closePanel();
            ctx.ui.dialog({
              who: 'Bếp trà đã dựng sẵn',
              text: 'Chọn món để vào ngay bước “Cho nguyên liệu”.\nBếp than, nồi và trà đã có sẵn trên bàn.',
              opts: [
                { t: 'Trà đá', fn: () => mở('tra_da') },
                { t: 'Trà chanh', fn: () => mở('tra_chanh') },
                { t: 'Đóng' },
              ],
            });
          },
        },
        {
          id: 't61_noi_da',
          label: 'Vào thẳng nồi TRÀ ĐÁ (cho nguyên liệu)',
          sub: 'Không hỏi gì thêm — bếp, nồi, than và trà đã dựng sẵn, chỉ việc chạm chén',
          tone: 'green',
          closePanel: true,
          run: () => { if (!chuanBiNoi('tra_da')) toast('Không mở được nồi trà đá — xem dòng lỗi trên màn hình.', 'warn'); else toast('Chạm chén “Trà khô” trên bàn để cho vào nồi.', 'info', 'dish', true); },
        },
        {
          id: 't61_noi_chanh',
          label: 'Vào thẳng nồi TRÀ CHANH (cho nguyên liệu)',
          sub: 'Cùng cách dựng bếp như trà đá, nhưng món trà chanh (thêm chanh + đường)',
          tone: 'green',
          closePanel: true,
          run: () => { if (!chuanBiNoi('tra_chanh')) toast('Không mở được nồi trà chanh — xem dòng lỗi trên màn hình.', 'warn'); else toast('Chạm chén “Trà khô” trên bàn để cho vào nồi.', 'info', 'dish', true); },
        },
        {
          id: 't59_viec_so',
          label: 'Đọc sổ việc làm hôm nay',
          sub: 'In ra số bao / ca bốc cá / ca chạy bàn còn lại + giờ trong ván, để so với bảng việc làm',
          tone: 'yellow',
          closePanel: false,
          run: () => {
            const g = ctx.g, tr = Math.floor(g.min % 1440), hh = Math.floor(tr / 60), mm = Math.floor(tr % 60);
            ctx.ui.dialog({
              who: 'Sổ việc làm',
              text: `Bây giờ: ${hh}h${String(mm).padStart(2, '0')} · ngày ${g.day + 1}\n`
                + `Bao đã vác: ${g.wd.sacks}/${R.DOCK_SACKS_DAY} (còn ${R.sacksLeft(g)})\n`
                + `Ca bốc cá: ${g.wd.cargoShifts}/${R.DOCK_SHIFTS_DAY} (còn ${R.dockShiftsLeft(g)})\n`
                + `Ca chạy bàn: ${g.wd.cafeShifts}/${R.CAFE_SHIFTS_DAY} (còn ${R.cafeShiftsLeft(g)})\n`
                + `Rửa chén: ${g.wd.plates}/2 · Giao hàng: ${g.wd.deliveries}/4`,
              opts: [{ t: 'Đóng' }],
            });
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
