// MENU TEST & DỊCH CHUYỂN ẨN (mở bằng cách bấm 7 lần vào chữ "Cài đặt").
// Lưu ý bảo trì: mỗi lượt thêm tính năng mới thì THAY mục test cũ bằng mục của tính năng mới,
// chỉ giữ lại nhóm "Địa điểm — tele nhanh". Đừng để menu phình thành bãi rác test cũ.
import { ctx } from './ctx';
import * as R from '../sim/rules';
import { RECIPES } from '../data/recipes';
import { SPOTS, CORR } from '../world/layout';
import { toast } from '../core/bus';
import * as PUI from '../ui/phoneUI';
const PUIphone = () => PUI;

export const DEV_BUILD_TAG = 'App Quản lý cửa hàng trên điện thoại: xem quầy chính + chi nhánh, bật/tắt bán từ xa, cảnh báo bán lỗ';

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
      title: 'Mới nhất — App Quản lý cửa hàng trên điện thoại (lượt 23)',
      items: [
        {
          id: 'setup_shopapp',
          label: 'Dựng nhà hàng bậc 7 + quầy đang bán + chi nhánh có người trông coi, mở app',
          sub: 'Bày 2 món sẵn (một món còn đúng 1 phần), chi nhánh có 3 phần — xem app báo gì',
          tone: 'green',
          closePanel: false,
          run: () => {
            const g = ctx.g;
            g.cash = Math.max(g.cash, 3000000); g.stall.tier = 7; g.stall.where = 'placed'; g.stall.spot = 'cho';
            for (const id of ['daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas']) if (!R.has(g, id)) R.buyGear(g, id);
            for (const rid of ['com_suon', 'tra_da']) { g.rec[rid].known = true; g.rec[rid].on = true; g.rec[rid].price = R.suggestPrice(g, RECIPES[rid]); }
            g.stall.ready = [{ rid: 'com_suon', n: 5, q: 1, at: 0, cost: 12000 }, { rid: 'tra_da', n: 1, q: 1, at: 0, cost: 3000 }];
            if (!g.branch) { R.openBranch(g, 'cho'); if (g.branch) R.hireKeeper(g); }
            if (g.branch && !g.branch.keeper) R.hireKeeper(g);
            if (g.branch) R.moveToBranch(g, 'com_suon', 3);
            g.gear.camung = 100; g.phone = { id: 'camung', battery: 72 };
            ctx.stall.refresh();
            ctx.ui.closePanel(); ctx.ui.panel('phone');
            // mở thẳng app Cửa hàng
            const P = PUIphone();
            P.phoneKey('open', 'shop');
            ctx.ui.reopenPanel('phone');
          },
        },
        {
          id: 'shopapp_open',
          label: 'Mở thẳng app Quản lý cửa hàng (máy cảm ứng)',
          sub: 'Xem quầy chính + chi nhánh, số phần đang bày, tiền thuê, doanh thu hôm nay và câu gợi ý',
          closePanel: false,
          run: () => {
            const g = ctx.g;
            if (!g.phone) { g.gear.camung = 100; g.phone = { id: 'camung', battery: 72 }; }
            ctx.ui.closePanel(); ctx.ui.panel('phone');
            PUIphone().phoneKey('open', 'shop');
            ctx.ui.reopenPanel('phone');
          },
        },
        {
          id: 'shopapp_loss',
          label: 'Đặt giá cơm sườn xuống 2.000₫ để xem cảnh báo bán lỗ',
          sub: 'App so giá bán với giá vốn thật của món rồi báo lỗ bao nhiêu một phần',
          tone: 'yellow',
          closePanel: false,
          run: () => {
            const g = ctx.g, rid = 'com_suon';
            if (!g.rec[rid]) { toast('Chưa có món cơm sườn.', 'warn'); return; }
            g.rec[rid].price = 2000; g.rec[rid].on = true;
            toast('Giá cơm sườn giờ còn 2.000₫ — mở app xem cảnh báo bán lỗ.', 'info', 'cash');
            ctx.ui.closePanel(); ctx.ui.panel('phone');
            PUIphone().phoneKey('open', 'shop');
            ctx.ui.reopenPanel('phone');
          },
        },
        {
          id: 'shopapp_toggle',
          label: 'Bật/tắt bán quầy chính và chi nhánh từ điện thoại',
          sub: 'Chạy thẳng luật setShopOpen — không cần chạy ra quầy, cũng không cần đứng gần',
          closePanel: false,
          run: () => {
            const g = ctx.g;
            const before = [g.stall.open, !!g.branch?.open];
            R.setShopOpen(g, 'main', !g.stall.open);
            if (g.branch?.keeper) R.setShopOpen(g, 'branch', !g.branch.open);
            toast(`Quầy chính: ${g.stall.open ? 'mở' : 'đóng'} · chi nhánh: ${g.branch ? (g.branch.open ? 'mở' : 'đóng') : 'chưa có'} (trước: ${before[0] ? 'mở' : 'đóng'}/${before[1] ? 'mở' : 'đóng'}).`, 'good', 'shop');
            ctx.ui.closePanel(); ctx.ui.panel('phone');
            PUIphone().phoneKey('open', 'shop');
            ctx.ui.reopenPanel('phone');
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
