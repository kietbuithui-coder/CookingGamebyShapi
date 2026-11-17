// MENU TEST & DỊCH CHUYỂN ẨN (mở bằng cách bấm 7 lần vào chữ "Cài đặt").
// Lưu ý bảo trì: luôn cập nhật / reset danh sách này mỗi khi thêm tính năng hoặc khu vực mới!
import { ctx } from './ctx';
import * as R from '../sim/rules';
import { STAT_MAX } from '../sim/state';
import { classifyVehicleHit, applyVehicleImpactToStats, VehicleKind } from '../sim/impact';
import { SPOTS, CORR } from '../world/layout';
import { ARCH } from '../data/people';
import { toast, sfx } from '../core/bus';

export const DEV_BUILD_TAG = 'Bậc 6 Nhà hàng · 13 Nâng cấp & Đa nhân sự · Va chạm 3 mức · Chỉ số 125 · Cờ vua Ông Tư';

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

function setupFullRestaurant(openIt = true) {
  const g = ctx.g, S = ctx.stall;
  g.cash = Math.max(g.cash, 350000000);
  for (const id of [
    'ganh', 'xeday', 'sap', 'quanan', 'quanngoi', 'nhahang',
    'daothot', 'bepthan', 'vi', 'noi', 'chao', 'bepgas', 'thungda', 'bien', 'den', 'odu', 'ghe',
    'loa', 'hopmangve', 'binh_tra', 'mayep', 'tu_kinh', 'may_quat',
    'wifi_nhac', 'may_tinh_tien', 'tu_dong', 'bep_cn', 'wc_lavabo', 'hut_mui', 'dieu_hoa',
  ]) {
    if (!R.has(g, id)) R.buyGear(g, id);
  }
  const sp = SPOTS.find((s) => s.id === 'matbang_tb') ?? SPOTS[0];
  S.placeAt(sp);
  g.stall.cond = 100;
  g.stall.dirt = 0;
  g.min = 12 * 60;
  if (!g.stall.store.some((x) => x.id === 'gas')) {
    g.stall.store.push(
      { id: 'gas', n: 4, fresh: 99999, q: 1, cost: 28000 },
      { id: 'tra', n: 20, fresh: 99999, q: 1, cost: 2000 },
      { id: 'da', n: 20, fresh: 99999, q: 1, cost: 1000 },
      { id: 'banhmi', n: 12, fresh: 99999, q: 1, cost: 3000 },
      { id: 'trung', n: 12, fresh: 99999, q: 1, cost: 3500 },
    );
  }
  if (!g.stall.ready.some((x) => x.rid === 'tra_da')) {
    g.stall.ready.push({ rid: 'tra_da', n: 10, q: 0.92, cost: 3000, at: g.min });
  }
  for (const rid of ['pho_bo', 'com_suon', 'banh_mi_trung', 'tra_da']) {
    if (g.rec[rid]) { g.rec[rid].known = true; g.rec[rid].on = true; }
  }
  while (R.sousCount(g) < R.maxSous(g)) R.hireSous(g);
  while (R.helperCount(g) < R.maxHelpers(g)) R.hireHelper(g);
  const c = Math.cos(sp.yaw), sn = Math.sin(sp.yaw);
  tpTo(sp.x - 2.6 * sn, sp.z - 2.6 * c, sp.yaw + Math.PI);
  if (openIt && !g.stall.open) S.open();
  S.rebuild();
  toast('Đã dựng Nhà hàng bình dân full 13 nâng cấp + 2 phụ bếp + 2 phục vụ.', 'good', 'shop');
}

/** Dựng sẵn Chuỗi cửa hàng (bậc 7) + một chi nhánh có người trông coi và món sẵn để thử. */
function setupChain() {
  const g = ctx.g, S = ctx.stall;
  g.cash = Math.max(g.cash, 400000000);
  for (const id of ['ganh', 'xeday', 'sap', 'quanan', 'quanngoi', 'nhahang', 'chuoi', 'daothot', 'bepthan', 'vi', 'noi', 'chao', 'ghe', 'bien', 'den']) {
    if (!R.has(g, id)) R.buyGear(g, id);
  }
  const sp = SPOTS.find((s) => s.id === 'matbang_tb') ?? SPOTS[0];
  if (g.stall.where !== 'placed' || g.stall.spot !== sp.id) S.placeAt(sp);
  g.stall.cond = 100; g.stall.dirt = 0; g.min = 10 * 60;
  for (const rid of ['com_suon', 'banh_mi_trung', 'tra_da', 'pho_bo']) if (g.rec[rid]) { g.rec[rid].known = true; g.rec[rid].on = true; }
  if (!g.stall.ready.length) g.stall.ready.push({ rid: 'tra_da', n: 8, q: 0.92, cost: 3000, at: g.min });
  if (!g.branch) R.openBranch(g, 'cho');
  if (!g.branch?.keeper) R.hireKeeper(g);
  for (const r of g.stall.ready.slice()) R.moveToBranch(g, r.rid, Math.min(r.n, 8));
  if (!g.stall.ready.length) { g.stall.ready.push({ rid: 'tra_da', n: 6, q: 0.9, cost: 3000, at: g.min }); R.moveToBranch(g, 'tra_da', 4); }
  if (!g.stall.open) S.open();
  S.refresh();
  toast('Đã dựng Chuỗi cửa hàng + chi nhánh ở Cổng Chợ có người trông coi. Chạm quầy chi nhánh để xem sổ.', 'good', 'shop', true);
}

function testVehicleHit(kind: VehicleKind, speed: number, grazing: boolean) {
  const p = ctx.player, g = ctx.g;
  const spec = classifyVehicleHit(kind, speed, grazing);
  const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
  p.hitCd = 0;
  p.knockback(-fx * 0.8 + fz * 0.6, -fz * 0.8 - fx * 0.6, spec.knockSpeed, spec.liftVy, spec.stunSec, spec.shake, spec.fallSec);
  ctx.ui.hitFlash(spec.flash);
  ctx.sound.play('horn');
  ctx.sound.play(spec.tier === 'heavy' ? 'crash' : spec.tier === 'medium' ? 'skid' : 'bonk');
  const res = applyVehicleImpactToStats(g, spec);
  toast(`[Test ${spec.tier}] ${spec.label} (Máu −${spec.hpLoss})`, spec.tier === 'light' ? 'warn' : 'bad', spec.tier === 'heavy' ? 'skull' : 'bolt', spec.tier === 'heavy');
  if (res.fainted) ctx.acts.checkFaint();
}

export function getDevSections(): DevSection[] {
  const g = ctx.g;
  return [
    {
      title: 'Bậc 7 — Chuỗi cửa hàng & chi nhánh',
      items: [
        {
          id: 'setup_chuoi',
          label: 'Dựng Chuỗi cửa hàng + chi nhánh Cổng Chợ',
          sub: 'Cấp vốn, lên bậc 7, thuê chi nhánh + người trông coi, chuyển món sẵn sang',
          tone: 'green',
          run: () => setupChain(),
        },
        {
          id: 'tp_chinhanh',
          label: 'Tới chi nhánh Cổng Chợ',
          sub: 'Dịch chuyển tới quầy chi nhánh để chạm mở sổ',
          run: () => {
            const sp = SPOTS.find((x) => x.id === (ctx.g.branch?.spot ?? 'cho'))!;
            const sn = Math.sin(sp.yaw), c = Math.cos(sp.yaw);
            tpTo(sp.x + 3.2 * sn, sp.z + 3.2 * c, sp.yaw + Math.PI, 'Đã tới quầy chi nhánh.');
          },
        },
      ],
    },
    {
      title: 'Bậc 6 — Nhà hàng bình dân & 13 Nâng cấp',
      items: [
        {
          id: 'tp_matbang_tb',
          label: 'Tới Mặt bằng Phố Văn Phòng',
          sub: 'Dịch chuyển tới điểm đặt Quán ăn / Nhà hàng bình dân ở Phố Văn Phòng',
          run: () => {
            const sp = SPOTS.find((s) => s.id === 'matbang_tb')!;
            const sn = Math.sin(sp.yaw), c = Math.cos(sp.yaw);
            tpTo(sp.x + 5.2 * sn, sp.z + 5.2 * c, sp.yaw, 'Đã tới Mặt bằng Phố Văn Phòng.');
          },
        },
        {
          id: 'tp_matbang_dc',
          label: 'Tới Mặt bằng Khu Căn Hộ',
          sub: 'Dịch chuyển tới điểm đặt Quán ăn / Nhà hàng bình dân ở Khu Căn Hộ',
          run: () => {
            const sp = SPOTS.find((s) => s.id === 'matbang_dc')!;
            const sn = Math.sin(sp.yaw), c = Math.cos(sp.yaw);
            tpTo(sp.x + 5.2 * sn, sp.z + 5.2 * c, sp.yaw, 'Đã tới Mặt bằng Khu Căn Hộ.');
          },
        },
        {
          id: 'tp_equip',
          label: 'Tới Tiệm Đồ Nghề Ba Tài',
          sub: 'Mở giờ 10h00 + dịch chuyển tới quầy Ba Tài để mua 13 nâng cấp mới',
          run: () => {
            g.min = Math.max(g.min, 10 * 60);
            if (g.min >= 19 * 60) g.min = 10 * 60;
            const a = ctx.world.anchors.v_equip;
            if (a) tpTo(a.x, a.z + 1.4, Math.PI, 'Đã tới tiệm Đồ Nghề Ba Tài.');
          },
        },
        {
          id: 'setup_nhahang_full',
          label: 'Setup full Nhà hàng + 13 nâng cấp + 2 bếp 2 bàn',
          sub: 'Cấp vốn, mua đủ 13 thiết bị, dựng Nhà hàng tại Phố Văn Phòng, thuê 4 nhân viên & mở cửa',
          tone: 'green',
          run: () => setupFullRestaurant(true),
        },
        {
          id: 'test_group',
          label: 'Gửi ngay Khách đoàn (4 người)',
          sub: 'Triệu hồi 1 đoàn 4 khách tới Nhà hàng bình dân (tự dựng nhà hàng nếu chưa mở)',
          tone: 'yellow',
          run: () => {
            if (!R.isRestaurant(g) || g.stall.where !== 'placed' || !g.stall.open) setupFullRestaurant(true);
            const ok = ctx.stall.sendGroup(4);
            toast(ok ? 'Đoàn 4 khách đang đi vào nhà hàng!' : 'Chưa có khách quanh phố hoặc hết chỗ trống.', ok ? 'good' : 'warn');
          },
        },
        {
          id: 'test_booking',
          label: 'Tạo Đặt bàn trước & mở bảng Nhân sự',
          sub: 'Tạo 1 lịch đặt bàn mới và mở ngay tab Nhân sự & Đặt bàn',
          closePanel: false,
          run: () => {
            if (!R.isRestaurant(g)) { g.gear.nhahang = 1; g.stall.tier = 6; }
            const b = R.createBooking(g);
            if (b) { sfx('order'); toast(`Có khách đặt bàn: ${b.name} (${b.size} người).`, 'good', 'star'); }
            else toast('Đã đủ 4 đặt bàn hoạt động.', 'warn');
            ctx.ui.panel('stall');
            setTimeout(() => {
              const btn = document.querySelector('#modal .tab[data-tab="staff"]') as HTMLElement | null;
              if (btn) btn.click();
            }, 30);
          },
        },
        {
          id: 'tp_lavabo',
          label: 'Tới Bồn rửa tay trong nhà hàng (wc_lavabo)',
          sub: 'Lắp wc_lavabo và dịch chuyển tới bồn rửa tay để test tương tác vệ sinh',
          run: () => {
            if (!R.isRestaurant(g) || g.stall.where !== 'placed') setupFullRestaurant(true);
            if (!R.has(g, 'wc_lavabo')) R.buyGear(g, 'wc_lavabo');
            ctx.stall.rebuild();
            const s = g.stall, c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
            const wx = s.x + -3.12 * c + 2.15 * sn, wz = s.z - -3.12 * sn + 2.15 * c;
            tpTo(wx + 0.9 * c, wz - 0.9 * sn, s.yaw + Math.PI * 0.5, 'Đứng cạnh bồn rửa tay — bấm E hoặc nút tương tác!');
          },
        },
      ],
    },
    {
      title: 'Va chạm giao thông 3 mức & Đẩy lùi chiến đấu',
      items: [
        {
          id: 'tp_road',
          label: 'Ra giữa đường lớn (xe chạy nhiều)',
          sub: 'Dịch chuyển ra làn xe chạy ở ngã tư Phố Văn Phòng để thử va chạm thật',
          run: () => {
            tpTo(CORR[1], CORR[0] + 12, 0, 'Đang đứng giữa lòng đường — coi chừng xe tông!');
          },
        },
        {
          id: 'hit_light',
          label: 'Test Va chạm Nhẹ (Xe đạp quẹt)',
          sub: 'Đẩy lùi nhẹ, rung nhỏ, chớp nhẹ, âm bonk',
          run: () => testVehicleHit('bicycle', 4.5, true),
        },
        {
          id: 'hit_medium',
          label: 'Test Va chạm Vừa (Xe máy tông)',
          sub: 'Đẩy lùi vừa, ngã ngắn, âm skid + còi, chớp đỏ vừa',
          tone: 'yellow',
          run: () => testVehicleHit('moto', 8.5, false),
        },
        {
          id: 'hit_heavy',
          label: 'Test Va chạm Nặng (Ô tô húc bay)',
          sub: 'Hất tung mạnh, choáng + nằm ngửa, rung mạnh + flash đỏ đậm',
          tone: 'red',
          run: () => testVehicleHit('car', 11.5, false),
        },
        {
          id: 'spawn_rude_npc',
          label: 'Gọi NPC tới gần để test Đấm & Đẩy lùi',
          sub: 'Đặt 1 người đi đường ngay trước mặt (2m) — bấm nút Đấm để xem đẩy lùi & rung',
          run: () => {
            const p = ctx.player, fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
            const tx = p.x + fx * 2.0, tz = p.z + fz * 2.0;
            let npc = ctx.npcs.list.find((n) => n.kind === 'ped' && !n.hidden && n.state !== 'fixed');
            if (!npc) npc = ctx.npcs.spawnPed(tx, tz, 1, 3, ARCH.congnhan ?? Object.values(ARCH)[0]) ?? undefined;
            if (npc) {
              npc.x = tx; npc.z = tz; npc.state = 'stand'; npc.timer = 12; npc.chaseT = 0;
              npc.rig.root.position.set(tx, npc.y, tz);
              toast('Đã đặt NPC ngay trước mặt — thử bấm Đấm hoặc chọc giận!', 'info', 'bolt');
            } else {
              toast('Không tìm thấy NPC trống quanh đây.', 'warn');
            }
          },
        },
      ],
    },
    {
      title: 'Cờ vua Ông Tư & Chỉ số 125/125',
      items: [
        {
          id: 'tp_ongtu',
          label: 'Tới Bàn cờ Ông Tư (Công viên)',
          sub: 'Dịch chuyển thẳng tới ghế đánh cờ với Ông Tư cạnh hồ công viên',
          run: () => {
            const a = ctx.world.anchors.v_danh_co;
            if (a) tpTo(a.x, a.z - 0.9, 0, 'Đã tới bàn cờ của Ông Tư.');
            else tpTo(52.14, -58.4, 0, 'Đã tới bàn cờ của Ông Tư.');
          },
        },
        {
          id: 'play_chess_std',
          label: 'Mở ngay ván Cờ vua với Ông Tư',
          sub: 'Vào thẳng bàn cờ 8×8 tiêu chuẩn (đủ 32 quân)',
          tone: 'green',
          run: () => {
            const n = ctx.npcs.fixed.get('danh_co');
            if (!n) { toast('Không tìm thấy Ông Tư.', 'warn'); return; }
            ctx.anim.startChess(n, 0);
          },
        },
        {
          id: 'play_chess_puzzle',
          label: 'Mở Thế cờ chiếu bí (Ông Tư)',
          sub: 'Thử thế cờ công sát 1–2 nước chiếu bí',
          run: () => {
            const n = ctx.npcs.fixed.get('danh_co');
            if (!n) { toast('Không tìm thấy Ông Tư.', 'warn'); return; }
            ctx.anim.startChess(n, 1);
          },
        },
        {
          id: 'stats_full_125',
          label: 'Hồi đầy mọi chỉ số lên 125/125',
          sub: 'Đặt No, Nước, Thể lực, Máu, Vệ sinh, Tinh thần = 125/125 & xoá choáng',
          tone: 'green',
          closePanel: false,
          run: () => {
            g.st.hunger = STAT_MAX; g.st.thirst = STAT_MAX; g.st.energy = STAT_MAX;
            g.st.health = STAT_MAX; g.st.hygiene = STAT_MAX; g.st.mood = STAT_MAX;
            ctx.player.stunT = 0; ctx.player.fallT = 0; ctx.player.hitCd = 0;
            sfx('coin');
            toast(`Đã hồi đầy mọi chỉ số lên ${STAT_MAX}/${STAT_MAX}!`, 'good', 'heart');
          },
        },
        {
          id: 'stats_low_hp',
          label: 'Đặt Máu còn 25/125 (test cảnh báo / ngất)',
          sub: 'Thử phản ứng hồi sức / ngất khi va chạm xe hoặc bị đánh',
          tone: 'red',
          closePanel: false,
          run: () => {
            g.st.health = 25;
            toast('Đã đặt Máu = 25/125.', 'warn', 'heart');
          },
        },
      ],
    },
  ];
}
