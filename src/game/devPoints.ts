// MENU TEST & DỊCH CHUYỂN ẨN (mở bằng cách bấm 7 lần vào chữ "Cài đặt").
// Lưu ý bảo trì: mỗi lượt thêm tính năng mới thì THAY mục test cũ bằng mục của tính năng mới,
// chỉ giữ lại nhóm "Địa điểm — tele nhanh". Đừng để menu phình thành bãi rác test cũ.
import { ctx } from './ctx';
import * as R from '../sim/rules';
import { SPOTS, CORR } from '../world/layout';
import { toast } from '../core/bus';

export const DEV_BUILD_TAG = 'Bậc 7 Chuỗi cửa hàng · chi nhánh thứ hai · người trông coi · sổ từng điểm';

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
      title: 'Mới nhất — Bậc 7 Chuỗi cửa hàng (lượt 18)',
      items: [
        {
          id: 'setup_chuoi',
          label: 'Dựng Chuỗi cửa hàng + chi nhánh Cổng Chợ',
          sub: 'Cấp vốn, lên bậc 7, mở chi nhánh, thuê người trông coi, chuyển món sẵn sang',
          tone: 'green',
          run: () => setupChain('cho'),
        },
        {
          id: 'setup_chuoi_vp',
          label: 'Dựng chi nhánh ở Phố Văn Phòng',
          sub: 'Như trên nhưng đặt chi nhánh ở Phố Văn Phòng (thuê 150.000₫/ngày, đông khách nhất)',
          run: () => setupChain('vp'),
        },
        {
          id: 'setup_chuoi_cv',
          label: 'Dựng chi nhánh ở Cổng Công Viên',
          sub: 'Như trên nhưng đặt chi nhánh ở Cổng Công Viên (thuê 90.000₫/ngày, vắng hơn)',
          run: () => setupChain('cv'),
        },
        {
          id: 'tp_chinhanh',
          label: 'Tới quầy chi nhánh',
          sub: 'Dịch chuyển tới quầy chi nhánh hiện tại để chạm mở sổ',
          run: () => {
            const sp = SPOTS.find((x) => x.id === (ctx.g.branch?.spot ?? 'cho'));
            if (!sp) { toast('Chưa có chi nhánh nào.', 'warn'); return; }
            const sn = Math.sin(sp.yaw), c = Math.cos(sp.yaw);
            tpTo(sp.x + 3.0 * sn, sp.z + 3.0 * c, sp.yaw + Math.PI, 'Đã tới quầy chi nhánh — chạm vào quầy để mở sổ.');
          },
        },
        {
          id: 'branch_fill',
          label: 'Chuyển hết món sẵn ở quầy sang chi nhánh',
          sub: 'Đổ đầy chi nhánh (trần 6 loại món / 24 phần) để xem người trông coi bán',
          tone: 'yellow',
          run: () => {
            const g = ctx.g, b = g.branch;
            if (!b) { toast('Chưa mở chi nhánh — bấm mục dựng chi nhánh trước.', 'warn'); return; }
            if (!b.keeper) R.hireKeeper(g);
            let n = 0;
            for (const r of g.stall.ready.slice()) n += R.moveToBranch(g, r.rid, r.n);
            b.open = true; ctx.stall.refresh();
            toast(`Đã chuyển ${n} phần sang chi nhánh (còn ${R.branchStock(g)} phần sẵn).`, n ? 'good' : 'warn', 'shop');
          },
        },
        {
          id: 'branch_skip',
          label: 'Tua 3 tiếng cho chi nhánh bán hàng',
          sub: 'Cho qua 180 phút bằng chính luật trong game để xem doanh thu, tip và món hết',
          closePanel: false,
          run: () => {
            const g = ctx.g, b = g.branch;
            if (!b) { toast('Chưa mở chi nhánh.', 'warn'); return; }
            if (!b.keeper) R.hireKeeper(g);
            b.open = true;
            for (let i = 0; i < 180; i++) { g.min += 1; R.branchTick(g, 1); }
            const l = b.led;
            toast(`3 tiếng: bán ${l.sold} phần · ${l.revenue.toLocaleString('vi-VN')}₫ + tip ${l.tips.toLocaleString('vi-VN')}₫.`, 'good', 'coin');
          },
        },
        {
          id: 'branch_panel',
          label: 'Mở sổ chi nhánh',
          sub: 'Mở thẳng bảng Chi nhánh: doanh thu, người trông coi, món sẵn, 8 ngày lịch sử',
          closePanel: false,
          run: () => ctx.ui.panel('branch'),
        },
        {
          id: 'branch_keeper',
          label: 'Đổi người trông coi (cho nghỉ rồi thuê lại)',
          sub: 'Xem danh sách ứng viên trong KEEPER_POOL đổi lương/ngoại hình',
          closePanel: false,
          run: () => {
            const g = ctx.g;
            if (!g.branch) { toast('Chưa mở chi nhánh.', 'warn'); return; }
            if (g.branch.keeper) R.fireKeeper(g);
            const ok = R.hireKeeper(g), k = g.branch.keeper;
            toast(ok && k ? `${k.name} nhận trông coi (${k.wage.toLocaleString('vi-VN')}₫/ngày).` : 'Không thuê được người trông coi.', ok ? 'good' : 'warn', 'heart');
            ctx.ui.panel('branch');
          },
        },
        {
          id: 'branch_close',
          label: 'Trả mặt bằng chi nhánh (dọn sạch)',
          sub: 'Đóng chi nhánh, hoàn nửa tiền thuê ngày đầu, bỏ món đang để ở đó',
          tone: 'red',
          run: () => {
            if (!ctx.g.branch) { toast('Chưa có chi nhánh nào.', 'warn'); return; }
            R.closeBranch(ctx.g); ctx.stall.refresh();
            toast('Đã trả mặt bằng chi nhánh.', 'info', 'shop');
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
