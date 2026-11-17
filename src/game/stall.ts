// QUẦY HÀNG trong thế giới 3D: mô hình theo cấp, đặt/dọn, hàng khách xếp hàng thật, phục vụ, và các nhân vật sự kiện tìm đến.
import * as THREE from 'three';
import { ctx, MIN_PER_SEC } from './ctx';
import { MB, MAT } from '../gfx/mb';
import { ganhModel, cartModel, charcoalStove, gasStove, boardModel, knifeModel, panModel, potModel, grateModel, iceBox, lanternModel, umbrellaModel, plasticStool, plasticTable, ingModel, signBoardModel, speakerModel, takeawayRackModel, juicerModel, glassCaseModel, teaSetModel, standFanModel, posCounterModel, wifiSpeakerModel, commercialFridgeModel, commercialStoveModel, rangeHoodModel, washBasinModel, acUnitModel } from '../gfx/props';
import { takeawayBag, servingTray, Look } from '../gfx/people';
import { SPOTS, Spot, spotById, groundY, NAV_BLOCK, CORNER, edgeKey } from '../world/layout';
import { Game, Helper, Booking, STAT_MAX, absMin, hourOf, addStack } from '../sim/state';
import { arrivalRate, has, tier, menuOf, available, decide, decideGroup, review, settleSale, lostCustomer, readyCount, finishPossible, spend, earn, stove, changeRel, meet, wx, eventOn, Persona, addXp, canSell, missingFor, hasPrep, stallRoom, stallQueueCap, isNight, level, stallRent, payStallRent, helperGate, hireHelper, fireHelper, helperCandidate, helperPatience, sousCandidate, sousWork, createBooking, dueBooking, reservedSeats, expireBookings, seatCount, dineIn, isRestaurant, secondOrder, periodName, PATIENCE_RANGE } from '../sim/rules';
import { RECIPES, RecipeDef } from '../data/recipes';
import { INGS } from '../data/ingredients';
import { ARCH, HelperDef, LINES, REGULARS, RegularDef } from '../data/people';
import { EVENTS } from '../data/world';
import { TIERS } from '../data/gear';
import { bus, toast, sfx } from '../core/bus';
import { rnd, clamp, dist2, money, round1k } from '../core/util';
import { cupProp, type Npc } from './npc';
import { clipboardProp, notebookProp, batonProp, bottleProp } from './anim';
import { who } from './who';
import type { Box2, Circ } from '../world/build';
import { SignAtlas } from '../gfx/tex';
import { EXPR } from '../data/expr';

export interface Station { x: number; y: number; z: number; yaw: number; cam: THREE.Vector3; look: THREE.Vector3; }
export class StallSys {
  group = new THREE.Group(); body: THREE.Mesh | null = null; stock: THREE.Mesh | null = null; tools = new THREE.Group(); sign: THREE.Mesh | null = null;
  customers: Npc[] = []; private acc = 0; private builtKey = ''; private stockKey = ''; private stockT = 0; private cols: (Box2 | Circ)[] = [];
  private actorT = 0; private actorId = ''; private actorTries = 0; busy: Npc | null = null; rowdy = 0; private signAtlas = new SignAtlas(512); private signMat: THREE.Material;
  private marks: THREE.Mesh[] = []; private regT = 30;
  /** Người phụ việc đang đứng quầy + nhân vật tới xin việc + nhịp nói chuyện/lau quầy. */
  helper: Npc | null = null; helper2: Npc | null = null; private offerNpc: Npc | null = null; private offerT = 45; private helperChat = 40; private helper2Chat = 55; private helperWipe = 50; private helperRetry = 0; private helper2Retry = 0;
  private helperTask: Record<1 | 2, { mode: 'idle' | 'toCounter' | 'toCustomer' | 'serve' | 'toWipe' | 'wipe' | 'return'; target?: Npc; holdT: number; wipeCd: number; yaw: number }> = {
    1: { mode: 'idle', holdT: 0, wipeCd: 8, yaw: 0 },
    2: { mode: 'idle', holdT: 0, wipeCd: 14, yaw: 0 },
  };
  /** Nhân viên phụ bếp (bậc 6) đứng phòng bếp riêng + đặt bàn trước + khách đoàn. */
  sous: Npc | null = null; sous2: Npc | null = null; private sousT = 18; private sous2T = 22; private sousWorkAnim = 0; private sous2WorkAnim = 0; private sousRetry = 0; private sous2Retry = 0;
  private sousPhase: Record<1 | 2, { idx: number; moveCd: number }> = { 1: { idx: 0, moveCd: 7 }, 2: { idx: 0, moveCd: 9 } };
  private bookT = 45; private expireT = 12; private groupSeq = 1;
  constructor() {
    ctx.scene.add(this.group); this.group.add(this.tools); this.group.visible = false;
    this.signMat = new THREE.MeshBasicMaterial({ map: this.signAtlas.texture });
    for (let i = 0; i < 44; i++) { const b: Circ = { x: 0, z: 0, r: 0.3, on: false }; this.cols.push(b); ctx.world.dyn.push(b); }
    // mũi tên phát sáng trên các chỗ bán còn trống
    const mg = new THREE.RingGeometry(1.35, 1.5, 28).rotateX(-Math.PI / 2), mm = new THREE.MeshBasicMaterial({ color: 0xffd24d, transparent: true, opacity: 0.55, depthWrite: false });
    for (const s of SPOTS) { const m = new THREE.Mesh(mg, mm); m.position.set(s.x, groundY(s.x, s.z) + 0.03, s.z); m.visible = false; ctx.scene.add(m); this.marks.push(m); }
    bus.on('event', (e) => this.onEvent(e.id, e.on));
  }
  get s() { return ctx.g.stall; }
  /** Gánh đã cất gọn trong balo: không vẽ trên vai, đi nhanh như tay không. */
  stowed = false;
  stow(): boolean {
    const s = this.s;
    if (s.tier === 0) { toast('Chưa có gánh mà cất.', 'info'); return false; }
    // Đang dựng quầy: nút này là "dọn quầy" — gói cả gánh lẫn đồ nghề vào ba lô.
    if (s.where === 'placed' || s.where === 'home') {
      if (Math.hypot(s.x - ctx.player.x, s.z - ctx.player.z) > 6) { toast('Quầy ở xa quá, lại gần mới dọn được.', 'warn'); sfx('nope'); return false; }
      if (s.open && this.customers.length) { toast(`Đang có ${this.customers.length} khách — đóng quầy rồi hẵng dọn, kẻo mất khách.`, 'warn', 'shop'); sfx('nope'); return false; }
      if (!this.pickUp()) return false; toast('Dọn quầy, gói gánh vào ba lô. Muốn bán tiếp thì tìm chỗ khác dựng lại.', 'info', 'bag'); return true; }
    this.stowed = !this.stowed;
    ctx.player.setCarry(this.stowed ? '' : s.tier === 1 ? 'ganh' : 'xeday');
    sfx('pick');
    toast(this.stowed ? 'Cất gánh vào balo. Tay không, đi nhanh hơn — cần bán thì lấy ra.' : 'Lấy gánh ra, quàng lên vai.', 'info', 'bag');
    return true;
  }
  spot(): Spot | undefined { return this.s.spot ? spotById(this.s.spot) : undefined; }
  /** Vị trí làm bếp của quầy hiện tại (toạ độ thế giới). */
  station(): Station {
    const s = this.s, t = s.tier, c = Math.cos(s.yaw), sn = Math.sin(s.yaw), gy = groundY(s.x, s.z);
    const L = (lx: number, ly: number, lz: number) => new THREE.Vector3(s.x + lx * c + lz * sn, gy + ly, s.z - lx * sn + lz * c);
    if (t <= 1) { const o = L(0, 0.03, -0.72); return { x: o.x, y: o.y, z: o.z, yaw: s.yaw, cam: L(0, 1.08, -1.5), look: L(0, 0.05, -0.6) }; }
    const o = L(0, 0.925, 0.02); return { x: o.x, y: o.y, z: o.z, yaw: s.yaw, cam: L(0, 1.86, -0.86), look: L(0, 0.95, 0.06) };
  }
  /** Chỗ người chơi đứng bán. */
  standPos(): [number, number] { const s = this.s, d = s.tier <= 1 ? -1.5 : -1.0; return [s.x + Math.sin(s.yaw) * d, s.z + Math.cos(s.yaw) * d]; }
  /** Quy đổi toạ độ cục bộ của quầy/nhà hàng sang toạ độ thế giới. */
  private localPos(lx: number, lz: number): [number, number] {
    const s = this.s, c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
    return [s.x + lx * c + lz * sn, s.z - lx * sn + lz * c];
  }
  /** Quy đổi toạ độ thế giới sang toạ độ cục bộ của quầy/nhà hàng. */
  private worldToLocal(wx0: number, wz0: number): [number, number] {
    const s = this.s, c = Math.cos(s.yaw), sn = Math.sin(s.yaw), dx = wx0 - s.x, dz = wz0 - s.z;
    return [dx * c - dz * sn, dx * sn + dz * c];
  }
  /** Kiểm tra điểm thế giới có nằm lọt trong khối nhà hàng bậc 5–6 không. */
  insideFootprint(wx0: number, wz0: number): boolean {
    const s = this.s;
    if (s.where !== 'placed' || s.tier < 5) return false;
    const [lx, lz] = this.worldToLocal(wx0, wz0);
    return s.tier >= 6 ? (Math.abs(lx) < 3.68 && lz > -2.68 && lz < 4.08) : (Math.abs(lx) < 3.55 && lz > -0.45 && lz < 4.55);
  }
  /** Tự tìm đường thoát khi một NPC bị kẹt quá lâu quanh nhà hàng (trong phòng ăn, sau chậu cây, hay ngoài tường). */
  unstuck(n: Npc): boolean {
    const s = this.s;
    if (s.where !== 'placed' || s.tier < 5 || dist2(n.x, n.z, s.x, s.z) > 10 * 10) return false;
    const [lx, lz] = this.worldToLocal(n.x, n.z);
    if (s.tier >= 6) {
      // Đang ở trong phòng bếp hoặc phòng ăn -> dẫn ra qua đúng cửa bếp / cửa chính
      if (Math.abs(lx) < 3.58 && lz > -2.6 && lz < 3.95) {
        if (lz < 0.41) {
          if (n.actor?.startsWith('sous')) {
            const target = n.path[n.path.length - 1] ?? this.sousSpot(n.actor === 'sous2' ? 2 : 1, 0);
            n.path = [this.localPos(0, -1.05), target]; n.pi = 0; return true;
          }
          n.path.splice(n.pi, 0, this.localPos(2.85, -0.8), this.localPos(2.85, 0.4), this.localPos(2.85, 1.5), this.localPos(0, 1.5), this.localPos(0, 3.85), this.localPos(0, 5.15));
          return true;
        }
        if (n.state === 'toStall') {
          const last = n.path[n.path.length - 1];
          const [, tlz] = last ? this.worldToLocal(last[0], last[1]) : [0, 1.5];
          const aisleZ = tlz <= 2.2 ? 1.5 : 3.0;
          if (last) { n.path = [this.localPos(0, aisleZ), last]; n.pi = 0; return true; }
        }
        const aisleZ = lz <= 2.2 ? 1.5 : 3.0;
        const exitPts = [this.localPos(0, aisleZ), this.localPos(0, 3.85), this.localPos(0, 5.15)];
        if (n.actor?.startsWith('helper') && n.path.length) n.path = [...exitPts, ...n.path.slice(n.pi)];
        else n.path.splice(n.pi, 0, ...exitPts);
        n.pi = 0;
        return true;
      }
      // Đang ở bên ngoài (cạnh chậu cây, tường mặt tiền, tường bên, tường hậu) -> vòng ra hành lang vỉa hè ngoài (lz = 5.15)
      const sideX = lx < 0 ? -4.35 : 4.35;
      const [tlx, tlz] = n.path[n.pi] ? this.worldToLocal(n.path[n.pi][0], n.path[n.pi][1]) : [lx, 5.15];
      if (n.actor?.startsWith('helper')) {
        const slot: 1 | 2 = n.actor === 'helper2' ? 2 : 1;
        const hx = slot === 2 ? 2.18 : -2.18;
        const dest = n.path[n.path.length - 1];
        const [, dlz] = dest ? this.worldToLocal(dest[0], dest[1]) : [hx, 4.36];
        if (dlz < 4.0) n.path = [this.localPos(lx < 0 ? -2.18 : 2.18, 5.0), this.localPos(0, 5.0), this.localPos(0, 3.85), ...n.path.slice(Math.max(n.pi, n.path.length - 2))];
        else n.path = [this.localPos(lx < 0 ? -2.18 : 2.18, 5.0), this.localPos(hx, 5.0), this.helperSpot(slot)];
        n.pi = 0; return true;
      }
      if (n.state === 'toStall') {
        const tail = n.path.slice(n.pi).filter((pt) => { const [, pz] = this.worldToLocal(pt[0], pt[1]); return pz < 4.2; });
        const pre = lz < 4.3 ? [this.localPos(sideX, 5.15)] : [];
        n.path = [...pre, this.localPos(0, 5.15), this.localPos(0, 3.85), ...(tail.length ? tail : [this.localPos(0, 2.2)])];
        n.pi = 0; return true;
      }
      const dstSide = tlx < 0 ? -4.35 : 4.35;
      const detour: [number, number][] = [];
      if (lz < 4.6) detour.push(this.localPos(Math.abs(lx) < 3.6 ? (lx < 0 ? -2.18 : 2.18) : sideX, 5.15));
      if (tlz < 4.3) detour.push(this.localPos(dstSide, 5.15));
      if (detour.length) { n.path.splice(n.pi, 0, ...detour); return true; }
    } else if (s.tier === 5) {
      if (Math.abs(lx) < 3.4 && lz > 0.4 && lz < 4.3) {
        n.path.splice(n.pi, 0, this.localPos(0, 2.4), this.localPos(0, 4.95));
        return true;
      }
      const sideX = lx < 0 ? -4.2 : 4.2;
      n.path.splice(n.pi, 0, this.localPos(lz < 4.5 ? sideX : 0, 5.2));
      return true;
    }
    return false;
  }
  /** Nếu điểm tiếp cận nằm phía sau hoặc hai bên hông nhà hàng, thêm góc vỉa hè ngoài để không cắt xuyên tường. */
  safeApproach(fromX: number, fromZ: number): [number, number][] {
    const s = this.s;
    if (s.where !== 'placed' || s.tier < 5) return [];
    const [lx0, lz0] = this.worldToLocal(fromX, fromZ);
    if (lz0 >= 4.75) return [];
    const sideX = lx0 < 0 ? -4.35 : 4.35;
    const pts: [number, number][] = [];
    if (lz0 < -2.2) pts.push(this.localPos(sideX, -3.2));
    pts.push(this.localPos(sideX, 5.2));
    return pts;
  }
  /** Chặn NPC không đi xuyên tường nhà hàng bậc 5–6 (chừa cửa chính & cửa bếp) và tự vòng qua vỉa hè trước. */
  resolveNpcWalls(n: Npc, dt = 0.016) {
    const s = this.s;
    if (s.where !== 'placed' || s.tier < 5 || n.state === 'queue') return;
    if (dist2(n.x, n.z, s.x, s.z) > 9.0 * 9.0) return;
    let [lx, lz] = this.worldToLocal(n.x, n.z);
    // Nếu người đi đường có lộ trình cắt ngang qua nhà hàng (do vỉa hè mặc định đi xuyên qua mặt bằng), chèn điểm vòng qua trước cửa
    if (n.state === 'walk' && !n.persona && !n.actor && n.path.length && n.pi < n.path.length) {
      const [tlx, tlz] = this.worldToLocal(n.path[n.pi][0], n.path[n.pi][1]);
      const bx = s.tier >= 6 ? 3.68 : 3.55, bz0 = s.tier >= 6 ? -2.68 : -0.45, bz1 = s.tier >= 6 ? 4.08 : 4.55;
      const inFootprint = Math.abs(lx) < bx && lz > bz0 && lz < bz1;
      const viaDoor = s.tier >= 6 && Math.abs(lx) < 1.08 && Math.abs(tlx) < 1.08 && lz > 0.4 && tlz > 0.4;
      if (inFootprint && lz > 0.55 && Math.abs(tlx) > 1.2) {
        const door0 = this.localPos(0, 3.85), door1 = this.localPos(0, 5.15);
        if (dist2(door0[0], door0[1], n.path[n.pi][0], n.path[n.pi][1]) > 0.64) n.path.splice(n.pi, 0, door0, door1);
      } else if (!inFootprint && Math.abs(tlx) < bx && tlz > bz0 && tlz < bz1) {
        n.path[n.pi] = this.localPos((lz >= bz1 ? tlx : lx) < 0 ? -4.35 : 4.35, 5.15);
      } else if (!inFootprint && !viaDoor) {
        let t0 = 0, t1 = 1;
        const dx = tlx - lx, dz = tlz - lz;
        let hitSeg = true;
        for (const [p, q] of [[-dx, lx + bx], [dx, bx - lx], [-dz, lz - bz0], [dz, bz1 - lz]] as const) {
          if (Math.abs(p) < 1e-6) { if (q < 0) { hitSeg = false; break; } }
          else { const r0 = q / p; if (p < 0) { if (r0 > t1) { hitSeg = false; break; } if (r0 > t0) t0 = r0; } else { if (r0 < t0) { hitSeg = false; break; } if (r0 < t1) t1 = r0; } }
        }
        if (hitSeg && t0 <= t1) {
          const curSide = lx < 0 ? -4.35 : 4.35, dstSide = Math.abs(tlx) < 0.5 ? curSide : (tlx < 0 ? -4.35 : 4.35);
          const detour: [number, number][] = [];
          if (lz < bz1 + 0.35) detour.push(this.localPos(curSide, 5.15));
          if (curSide !== dstSide || lz >= bz1 + 0.35) detour.push(this.localPos(dstSide, 5.15));
          while (detour.length && dist2(detour[detour.length - 1][0], detour[detour.length - 1][1], n.path[n.pi][0], n.path[n.pi][1]) <= 0.64) detour.pop();
          if (detour.length) n.path.splice(n.pi, 0, ...detour);
        }
      }
    }
    const r = 0.3;
    const boxes: readonly [number, number, number, number][] = s.tier >= 6
      ? [
          [-3.58, -2.62, 3.58, -2.38],    // Tường hậu
          [-3.58, -2.55, -3.34, 3.96],   // Tường trái
          [3.34, -2.55, 3.58, 3.96],     // Tường phải
          [-3.55, 3.74, -1.08, 3.96],    // Mặt tiền trái (chừa cửa đôi |lx| < 1.08)
          [1.08, 3.74, 3.55, 3.96],      // Mặt tiền phải
          [-1.77, 3.93, -1.33, 4.37],    // Chậu cây trái trước cửa
          [1.33, 3.93, 1.77, 4.37],      // Chậu cây phải trước cửa
          [2.62, 3.98, 3.48, 4.38],      // Bảng hiệu đứng bên phải
          [-3.45, 0.28, 2.32, 0.52],     // Vách ngăn bếp (chừa cửa bếp lx ∈ [2.32, 3.34])
        ]
      : [
          [-3.48, 0.5, -3.22, 4.15],     // Vách trái bậc 5
          [3.22, 0.5, 3.48, 4.15],       // Vách phải bậc 5
          [-3.38, 4.32, -1.85, 4.56],    // Chậu cây trái
          [1.85, 4.32, 3.38, 4.56],      // Chậu cây phải
          [-2.85, -0.38, 2.85, 0.58],    // Quầy gỗ bậc 5
        ];
    const hasTgt = n.path.length > n.pi;
    const [tlx, tlz] = hasTgt ? this.worldToLocal(n.path[n.pi][0], n.path[n.pi][1]) : [lx, lz];
    let hit = false, slideX = 0, slideZ = 0;
    for (const [x0, z0, x1, z1] of boxes) {
      const cx = clamp(lx, x0, x1), cz = clamp(lz, z0, z1);
      const dx = lx - cx, dz = lz - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      hit = true;
      let nx = 0, nz = 0;
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        nx = dx / d; nz = dz / d;
        lx = cx + nx * r; lz = cz + nz * r;
      } else {
        const dl = lx - x0, dr = x1 - lx, dt0 = lz - z0, db = z1 - lz;
        const m = Math.min(dl, dr, dt0, db);
        if (m === dl) { lx = x0 - r; nx = -1; }
        else if (m === dr) { lx = x1 + r; nx = 1; }
        else if (m === dt0) { lz = z0 - r; nz = -1; }
        else { lz = z1 + r; nz = 1; }
      }
      // Trượt dọc theo tường hoặc chậu cây theo hướng thoát tự nhiên
      if (Math.abs(nx) > 0.7 && Math.abs(lx) > 3.2) slideZ = 1;
      else if (Math.abs(nx) > 0.7 && lz > 3.6 && lz < 4.5) slideZ = 1;
      else if (Math.abs(nx) > 0.7 && hasTgt && Math.abs(tlz - lz) > 0.15) slideZ = tlz > lz ? 1 : -1;
      else if (nz < -0.7 && lz < -2.3) slideX = lx < 0 ? -1 : 1;
      else if (Math.abs(nz) > 0.7 && lz > 3.5) {
        if (hasTgt && Math.abs(tlx - lx) > 0.15) slideX = tlx > lx ? 1 : -1;
        else slideX = (n.state === 'toStall' || n.state === 'actor') ? (lx < 0 ? 1 : -1) : (lx < 0 ? -1 : 1);
      }
    }
    if (hit) {
      const sp = Math.max(1.2, n.speed) * dt;
      if (slideZ) lz += slideZ * sp;
      if (slideX) lx += slideX * sp;
      const [nx, nz] = this.localPos(lx, lz);
      n.x = nx; n.z = nz;
    }
  }
  /** Toạ độ cục bộ của một chỗ (ghế hoặc hàng đợi) để tính lộ trình cửa ra vào. */
  private slotLocal(i: number, n: number): [number, number] {
    const s = this.s;
    if (this.seated(i)) {
      const arr = s.tier >= 6 ? StallSys.SEATS6 : s.tier >= 5 ? StallSys.SEATS5 : StallSys.SEATS4;
      return arr[((i % arr.length) + arr.length) % arr.length];
    }
    if (s.tier >= 6) {
      const k = i - seatCount(ctx.g), side = k % 2 === 0 ? -1 : 1, col = Math.floor(k / 2);
      return [side * (1.45 + (col % 2) * 0.85), 4.65 + Math.floor(col / 2) * 0.8];
    }
    const lx = (i - (n - 1) / 2) * 0.82, lz = s.tier <= 1 ? 1.5 : s.tier >= 5 ? 5.2 : s.tier >= 4 ? 3.8 : 1.35;
    return [lx, lz];
  }
  /** Lộ trình các điểm mốc từ ngoài cửa đi qua cửa chính vào tận ghế (không đi xuyên tường). */
  private entryWaypoints(i: number, n: number, fromX?: number, fromZ?: number): [number, number][] {
    const s = this.s, [lx, lz] = this.slotLocal(i, n);
    const pre: [number, number][] = [];
    if (fromX !== undefined && fromZ !== undefined && s.tier >= 5) {
      const [lx0, lz0] = this.worldToLocal(fromX, fromZ);
      // Nếu khách bắt đầu ở sau lưng hoặc hai bên hông nhà hàng: vòng qua góc vỉa hè ngoài trước khi tới cửa chính
      if (lz0 < 4.55) {
        const sideX = lx0 < 0 ? -4.35 : 4.35;
        if (lz0 < -2.2) pre.push(this.localPos(sideX, -3.2));
        pre.push(this.localPos(sideX, 5.15));
      }
    }
    if (s.tier >= 6) {
      if (!this.seated(i)) return [...pre, this.localPos(lx, lz + 0.55), this.localPos(lx, lz)];
      const aisleZ = lz <= 2.2 ? 1.5 : 3.0;
      const sideX = lx < 0 ? -0.55 : 0.55;
      return [...pre, this.localPos(0, 5.15), this.localPos(0, 3.85), this.localPos(0, aisleZ), this.localPos(sideX, lz), this.localPos(lx, lz)];
    }
    if (s.tier === 5 && this.seated(i)) {
      const aisleZ = lz <= 2.45 ? 1.7 : 3.2;
      return [...pre, this.localPos(0, 4.9), this.localPos(0, aisleZ), this.localPos(lx, lz)];
    }
    if (s.tier === 4 && this.seated(i)) {
      return [this.localPos(lx < 0 ? -1.75 : 1.75, 3.8), this.localPos(lx, lz)];
    }
    return [...pre, this.localPos(lx, lz)];
  }
  /** Lộ trình rời quán qua lối đi & cửa chính ra vỉa hè. */
  private exitWaypoints(n: Npc): [number, number][] | null {
    const s = this.s;
    if (s.tier >= 6) {
      const [lx, lz] = this.worldToLocal(n.x, n.z);
      if (lz < 4.1) {
        const aisleZ = lz <= 2.2 ? 1.5 : 3.0;
        const sideX = lx < 0 ? -0.55 : 0.55;
        return [this.localPos(sideX, lz), this.localPos(0, aisleZ), this.localPos(0, 3.85), this.localPos(0, 5.15)];
      }
    } else if (s.tier === 5 && this.seated(n.slot)) {
      return [this.localPos(0, 4.9)];
    }
    return null;
  }
  /** Hướng quay mặt đúng vào bàn khi ngồi ghế ở bậc 4–6. */
  private seatYaw(slot: number): number {
    const s = this.s;
    if (s.tier >= 6) return s.yaw + (slot % 2 === 0 ? 0 : Math.PI);
    if (s.tier >= 5) return s.yaw + (slot % 2 === 1 ? 0 : Math.PI);
    return s.yaw + (slot % 2 === 1 ? 0 : Math.PI);
  }
  /** Số ghế tối đa (bậc 6): bốn bàn gỗ, mỗi bàn hai ghế. */
  static readonly MAX_SEATS = 8;
  /** Bốn ghế nhựa của quán ăn nhỏ (bậc 4) — hai bàn ngoài sân. */
  private static readonly SEATS4: [number, number][] = [[-1.75, 2.85], [-1.75, 1.45], [1.75, 2.85], [1.75, 1.45]];
  /** Sáu ghế bàn gỗ kê trong nhà (bậc 5) — ba bàn, mỗi bàn hai ghế đối nhau. */
  private static readonly SEATS5: [number, number][] = [[-2.3, 3.2], [-2.3, 1.7], [0, 3.2], [0, 1.7], [2.3, 3.2], [2.3, 1.7]];
  /** Tám ghế trong nhà kín của Nhà hàng bình dân (bậc 6) — bốn bàn (hai dãy trái/phải, chừa lối đi giữa). */
  private static readonly SEATS6: [number, number][] = [
    [-1.85, 0.92], [-1.85, 2.08],
    [1.85, 0.92], [1.85, 2.08],
    [-1.85, 2.42], [-1.85, 3.58],
    [1.85, 2.42], [1.85, 3.58],
  ];
  seatPos(i: number): [number, number] {
    const s = this.s, c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
    const arr = s.tier >= 6 ? StallSys.SEATS6 : s.tier >= 5 ? StallSys.SEATS5 : StallSys.SEATS4;
    const [lx, lz] = arr[((i % arr.length) + arr.length) % arr.length];
    return [s.x + lx * c + lz * sn, s.z - lx * sn + lz * c];
  }
  /** Chỗ này có ghế ngồi ăn tại chỗ không (bậc 4 trở lên; bậc 5 có 6 ghế, bậc 6 có 8 ghế). */
  seated(i: number): boolean { return i >= 0 && i < seatCount(ctx.g); }
  slotPos(i: number, n: number): [number, number] {
    const [lx, lz] = this.slotLocal(i, n);
    return this.localPos(lx, lz);
  }

  // ───────── mô hình ─────────
  rebuild() {
    const g = ctx.g, s = g.stall, UP = ['daothot', 'vi', 'chao', 'noi', 'thungda', 'odu', 'bien', 'den', 'ghe', 'loa', 'hopmangve', 'mayep', 'binh_tra', 'tu_kinh', 'may_quat', 'wifi_nhac', 'may_tinh_tien', 'tu_dong', 'bep_cn', 'wc_lavabo', 'hut_mui', 'dieu_hoa'];
    const key = [s.tier, s.where, s.x.toFixed(1), s.z.toFixed(1), stove(g), ...UP.map((k) => (has(g, k) ? 1 : 0)), g.housing].join('|');
    if (key === this.builtKey) return; this.builtKey = key;
    if (this.body) { this.group.remove(this.body); this.body.geometry.dispose(); this.body = null; }
    if (this.sign) { this.group.remove(this.sign); this.sign.geometry.dispose(); this.sign = null; }
    if (this.toolMesh) { this.group.remove(this.toolMesh); this.toolMesh.geometry.dispose(); this.toolMesh = null; }
    for (const c of this.cols) c.on = false;
    const show = s.tier > 0 && (s.where === 'placed' || s.where === 'home');
    this.group.visible = show;
    const carryId = s.tier >= 3 ? '' : s.tier === 1 ? 'ganh' : 'xeday'; // sạp cố định không vác lên vai
    ctx.player.setCarry(s.where === 'carried' && !this.stowed ? carryId : ctx.player.carry === 'ganh' || ctx.player.carry === 'xeday' ? '' : ctx.player.carry);
    if (!show) return;
    this.group.position.set(s.x, groundY(s.x, s.z), s.z); this.group.rotation.y = s.yaw;
    const m = new MB(), tm = new MB(), st = stove(g), placed = s.where === 'placed';
    if (s.tier === 1) {
      ganhModel(m, 0, 0, 0, !placed);
      if (placed) {
        m.rod(0, 0.05, 0.42, 0.022, 1.5, 0x9a7a44, 0, Math.PI / 2, 6);                                   // đòn gánh đặt nằm
        m.box(0, 0, -0.72, 1.3, 0.025, 0.8, 0xc9b27a, 0xd9c38a); for (let i = -3; i <= 3; i++) m.box(i * 0.18, 0.026, -0.72, 0.012, 0.002, 0.8, 0xa98f5a);   // chiếu
        m.cyl(-0.62, 0.24, 0, 0.3, 0.014, 0xd9c38a, 14); m.cyl(0.62, 0.24, 0, 0.3, 0.014, 0xd9c38a, 14);  // mẹt đậy thúng
        plasticStool(tm, 0, 0, -1.42, 0x2f8fd5, 0.2);   // ghế của người bán: ẩn khi vào màn nấu để khỏi lọt vào khung hình
        if (st === 'bepthan') charcoalStove(tm, 0.42, 0.026, -0.86, 0.9); else if (st === 'bepgas') gasStove(tm, 0.42, 0.026, -0.86, 0.85);
        if (has(g, 'daothot')) { boardModel(tm, -0.38, 0.026, -0.88, 0.34, 0.22); knifeModel(tm, -0.3, 0.053, -0.86); }
        if (has(g, 'noi')) potModel(tm, -0.46, 0.026, -0.52, 0.7);
        if (has(g, 'chao')) panModel(tm, 0.0, 0.03, -0.98, 0.72);
        if (has(g, 'vi')) grateModel(tm, 0.42, st ? 0.22 : 0.04, -0.86, 0.36, 0.26);
        if (has(g, 'thungda')) iceBox(m, -1.25, 0, -0.5, 0.9);
        if (has(g, 'den')) lanternModel(m, 0.62, 0.255, 0.12);
        if (has(g, 'loa')) speakerModel(m, -0.62, 0.255, -0.2);
        if (has(g, 'hopmangve')) takeawayRackModel(m, 0.4, 0.026, -0.5);
      }
    } else if (s.tier === 2) {
      cartModel(m, 0, 0, 0);
      if (st === 'bepthan') charcoalStove(tm, 0.55, 0.91, -0.05, 0.8); else if (st === 'bepgas') gasStove(tm, 0.55, 0.91, -0.05, 0.8);
      if (has(g, 'daothot')) { boardModel(tm, -0.5, 0.91, -0.1, 0.34, 0.24); knifeModel(tm, -0.42, 0.937, -0.08); }
      if (has(g, 'noi')) potModel(tm, -0.62, 0.91, 0.22, 0.6); if (has(g, 'chao')) panModel(tm, 0.1, 0.915, 0.25, 0.6); if (has(g, 'vi')) grateModel(tm, 0.55, st ? 1.08 : 0.93, -0.05, 0.34, 0.24);
      if (has(g, 'thungda')) iceBox(m, -1.3, 0, -0.4, 0.95); if (has(g, 'den')) lanternModel(m, 0.78, 0.91, 0.3);
      if (has(g, 'loa')) speakerModel(m, -0.82, 0.91, 0.34);
      if (has(g, 'hopmangve')) takeawayRackModel(m, -0.2, 0.91, 0.34);
      if (has(g, 'mayep')) juicerModel(m, 0.35, 0.91, 0.34);
    } else if (s.tier === 3) {
      m.box(0, 0, 0.1, 2.6, 0.9, 0.9, 0x8a6a4a, 0xd9c8a8, 0.12); m.box(0, 0.3, 0.552, 2.5, 0.5, 0.004, 0xd9463c); m.box(0, 0.9, 0.1, 2.7, 0.035, 1.0, 0xe9e2d0, 0xf3efe6, 0, true);
      for (const sx of [-1.28, 1.28]) for (const sz of [-0.36, 0.56]) m.box(sx, 0.9, sz, 0.05, 1.5, 0.05, 0x8a8f96);
      m.box(0, 2.4, 0.1, 3.0, 0.06, 1.5, 0x2f8fd5, 0xf3f0e8, 0, true); m.box(0, 2.16, 0.86, 3.0, 0.24, 0.02, 0xf5c531, 0xf5c531, 0, true);
      if (st === 'bepthan') charcoalStove(tm, 0.9, 0.935, 0, 0.9); else if (st === 'bepgas') gasStove(tm, 0.9, 0.935, 0, 0.9);
      if (has(g, 'daothot')) { boardModel(tm, -0.8, 0.935, -0.05, 0.36, 0.24); knifeModel(tm, -0.7, 0.962, -0.03); }
      if (has(g, 'noi')) potModel(tm, -1.0, 0.935, 0.3, 0.7); if (has(g, 'chao')) panModel(tm, 0.3, 0.94, 0.3, 0.7); if (has(g, 'vi')) grateModel(tm, 0.9, st ? 1.12 : 0.95, 0, 0.36, 0.26);
      if (has(g, 'thungda')) iceBox(m, -1.75, 0, -0.3, 1); if (has(g, 'den')) lanternModel(m, 1.2, 0.935, 0.4);
      if (has(g, 'loa')) speakerModel(m, -1.16, 0.935, 0.42);
      if (has(g, 'hopmangve')) takeawayRackModel(m, -0.45, 0.935, 0.42);
      if (has(g, 'mayep')) juicerModel(m, 0.55, 0.935, 0.4);
      if (has(g, 'binh_tra')) teaSetModel(m, 0.0, 0.935, 0.42);
      if (has(g, 'tu_kinh')) glassCaseModel(m, -0.05, 0.935, 0.36, 1.0);
    } else if (s.tier === 4) {
      // Bậc 4 — quán ăn nhỏ: quầy gỗ dài 4,4 m, mái tôn xanh, sân phía trước kê hai bàn nhựa bốn ghế.
      m.box(0, 0, 0.1, 4.4, 0.92, 0.9, 0x8a6a4a, 0xd9c8a8, 0.12); m.box(0, 0.3, 0.552, 4.3, 0.5, 0.004, 0xd9463c); m.box(0, 0.92, 0.1, 4.5, 0.04, 1.02, 0xe9e2d0, 0xf3efe6, 0, true);
      for (const sx of [-2.18, 2.18]) for (const sz of [-0.36, 0.56]) m.box(sx, 0.92, sz, 0.05, 1.7, 0.05, 0x8a8f96);
      m.box(0, 2.62, 0.1, 5.2, 0.07, 1.8, 0x2f6fb5, 0xf3f0e8, 0, true); m.box(0, 2.34, 0.98, 5.2, 0.26, 0.02, 0xf5c531, 0xf5c531, 0, true);
      m.box(-2.18, 1.7, 0.6, 0.06, 1.6, 0.06, 0x8a8f96); m.box(2.18, 1.7, 0.6, 0.06, 1.6, 0.06, 0x8a8f96);
      if (st === 'bepthan') charcoalStove(tm, 1.5, 0.955, 0, 0.9); else if (st === 'bepgas') gasStove(tm, 1.5, 0.955, 0, 0.9);
      if (has(g, 'daothot')) { boardModel(tm, -1.2, 0.955, -0.05, 0.36, 0.24); knifeModel(tm, -1.1, 0.982, -0.03); }
      if (has(g, 'noi')) potModel(tm, -1.6, 0.955, 0.3, 0.7); if (has(g, 'chao')) panModel(tm, 0.5, 0.96, 0.3, 0.7); if (has(g, 'vi')) grateModel(tm, 1.5, st ? 1.14 : 0.97, 0, 0.36, 0.26);
      if (has(g, 'thungda')) iceBox(m, -2.6, 0, -0.3, 1); if (has(g, 'den')) lanternModel(m, 1.9, 0.955, 0.42);
      if (has(g, 'loa')) speakerModel(m, -2.0, 0.955, 0.42);
      if (has(g, 'hopmangve')) takeawayRackModel(m, -0.85, 0.955, 0.42);
      if (has(g, 'mayep')) juicerModel(m, 0.95, 0.955, 0.42);
      if (has(g, 'tu_kinh')) glassCaseModel(m, 0.0, 0.955, 0.38, 1.15);
      if (has(g, 'may_quat')) standFanModel(m, -2.55, 0, 1.8);
      // bàn ghế nhựa trong sân — khách ngồi ăn tại chỗ
      for (const bx of [-1.75, 1.75]) {
        plasticTable(m, bx, 0, 2.15); plasticStool(m, bx, 0, 2.85, 0x2f8fd5); plasticStool(m, bx, 0, 1.45, 0xd9463c);
        if (has(g, 'binh_tra')) teaSetModel(m, bx, 0.59, 2.15);
      }
    } else if (s.tier === 5) {
      // Bậc 5 — quán có chỗ ngồi: quầy gỗ dài 5,6 m, hiên có mái, nền gạch bông, ba bàn gỗ sáu ghế tựa lưng.
      m.box(0, 0, 0.1, 5.6, 0.92, 0.9, 0x8a6a4a, 0xd9c8a8, 0.12); m.box(0, 0.3, 0.552, 5.5, 0.5, 0.004, 0xd9463c); m.box(0, 0.92, 0.1, 5.7, 0.04, 1.02, 0xe9e2d0, 0xf3efe6, 0, true);
      for (const sx of [-2.78, 2.78]) for (const sz of [-0.36, 0.56]) m.box(sx, 0, sz, 0.06, 0.92, 0.06, 0x7d6a52);
      // nền gạch bông ca-rô + mái tôn + vách thấp hai bên
      m.box(0, 0, 1.9, 6.6, 0.05, 5.0, 0xd0c4ae, 0xdcd2bc);
      for (let ix = -5; ix <= 5; ix++) for (let iz = -3; iz <= 3; iz++) if (!((ix + iz) & 1)) m.box(ix * 0.6, 0.052, 1.9 + iz * 0.6, 0.58, 0.008, 0.58, 0xa8534a);
      m.box(0, 2.95, 1.7, 6.9, 0.08, 5.9, 0x2f6fb5, 0xf3f0e8, 0, true); m.box(0, 2.62, 4.62, 6.9, 0.3, 0.02, 0xf5c531, 0xf5c531, 0, true);
      for (const sx of [-3.35, 3.35]) m.box(sx, 0, 2.4, 0.12, 1.05, 3.6, 0xe4dcc8, 0xf0e9d8, 0, true);
      for (const sx of [-3.3, 3.3]) m.box(sx, 0, 4.58, 0.12, 2.95, 0.12, 0xb8ae9c, 0xc8beac);
      // chậu cây thấp hai bên, chừa lối vô ở giữa cho khách
      for (const sx of [-2.6, 2.6]) { m.box(sx, 0, 4.44, 1.5, 0.6, 0.16, 0xb8b0a0, 0xd0c8b8); m.box(sx, 0.6, 4.44, 1.4, 0.12, 0.24, 0x6a8a4a, 0x7a9a52); }
      // ba bàn gỗ, mỗi bàn hai ghế có tựa lưng
      for (const bx of [-2.3, 0, 2.3]) {
        m.box(bx, 0.72, 2.45, 0.9, 0.06, 0.9, 0x9a6a42, 0xb0805a, 0.04, true);
        for (const dx of [-0.36, 0.36]) for (const dz of [-0.36, 0.36]) m.box(bx + dx, 0, 2.45 + dz, 0.06, 0.72, 0.06, 0x6a4a32);
        for (const cz of [1.7, 3.2]) {
          const bz = cz > 2.45 ? 0.22 : -0.22;
          m.box(bx, 0.45, cz, 0.46, 0.05, 0.46, 0x9a6a42, 0xb0805a, 0.04, true);
          for (const dx of [-0.19, 0.19]) for (const dz of [-0.19, 0.19]) m.box(bx + dx, 0, cz + dz, 0.045, 0.45, 0.045, 0x6a4a32);
          for (const dx of [-0.19, 0.19]) m.box(bx + dx, 0.5, cz + bz, 0.04, 0.5, 0.04, 0x6a4a32);
          m.box(bx, 0.9, cz + bz, 0.46, 0.14, 0.05, 0x9a6a42, 0xb0805a, 0.03, true);
        }
        // khăn giấy + chai nước tương trên bàn
        m.box(bx + 0.3, 0.78, 2.24, 0.1, 0.1, 0.1, 0xe9e2d0, 0xf3efe6);
        m.cyl(bx - 0.32, 0.78, 2.29, 0.035, 0.16, 0x4a2f1a, 8);
        if (has(g, 'binh_tra')) teaSetModel(m, bx, 0.78, 2.45);
      }
      if (has(g, 'bep_cn')) commercialStoveModel(tm, 1.75, 0.955, 0, 0.92);
      else if (st === 'bepthan') charcoalStove(tm, 1.9, 0.955, 0, 0.9); else if (st === 'bepgas') gasStove(tm, 1.9, 0.955, 0, 0.9);
      if (has(g, 'daothot')) { boardModel(tm, -1.5, 0.955, -0.05, 0.36, 0.24); knifeModel(tm, -1.4, 0.982, -0.03); }
      if (has(g, 'noi')) potModel(tm, -1.95, 0.955, 0.3, 0.7); if (has(g, 'chao')) panModel(tm, 0.8, 0.96, 0.3, 0.7); if (has(g, 'vi')) grateModel(tm, 1.9, st ? 1.14 : 0.97, 0, 0.36, 0.26);
      if (has(g, 'tu_dong')) commercialFridgeModel(m, -3.2, 0, -0.5);
      else if (has(g, 'thungda')) iceBox(m, -3.2, 0, -0.3, 1);
      if (has(g, 'den')) lanternModel(m, 2.4, 0.955, 0.42);
      if (has(g, 'loa')) speakerModel(m, -2.55, 0.955, 0.42);
      if (has(g, 'hopmangve')) takeawayRackModel(m, -1.0, 0.955, 0.42);
      if (has(g, 'mayep')) juicerModel(m, 1.25, 0.955, 0.42);
      if (has(g, 'tu_kinh')) glassCaseModel(m, 0.0, 0.955, 0.38, 1.25);
      if (has(g, 'may_quat')) standFanModel(m, 3.0, 0, 2.2);
      if (has(g, 'wifi_nhac')) wifiSpeakerModel(m, -3.0, 0.56, 1.0);
      // quầy thu ngân nhỏ bên hông
      m.box(-3.0, 0.5, 0.9, 0.7, 0.06, 0.5, 0x8a6a4a, 0xa07c56, 0.04, true);
      for (const dz of [-0.2, 0.2]) m.box(-3.0, 0, 0.9 + dz, 0.05, 0.5, 0.05, 0x6a4a32);
      if (has(g, 'may_tinh_tien')) posCounterModel(m, -3.0, 0.56, 0.86);
    } else {
      // Bậc 6 — Nhà hàng bình dân: không gian trong nhà kín (7.0 x 6.35 m), phòng bếp riêng có vách ngăn & cửa thông bếp,
      // phòng ăn lát gạch ấm áp với 4 bàn gỗ (8 ghế), cửa kính mặt tiền & đèn trần.
      // Sàn nhà: phòng bếp lát gạch xám sạch sẽ, phòng ăn lát gạch kem ấm (tách mép tại z=0.38/0.39 để không nhiễu)
      m.box(0, 0, -1.06, 7.0, 0.06, 2.88, 0xb8bec4, 0xcbd0d6);
      m.box(0, 0, 2.12, 7.0, 0.06, 3.46, 0xe8ddc6, 0xf2e9d6);
      for (let ix = -5; ix <= 5; ix++) for (let iz = -2; iz <= 2; iz++) if (!((ix + iz) & 1)) m.box(ix * 0.62, 0.062, 2.15 + iz * 0.62, 0.58, 0.008, 0.58, 0xd2b48c);
      // Tường hậu + hai tường bên kín (có cửa sổ kính hai bên phòng ăn)
      m.box(0, 0, -2.5, 7.1, 3.05, 0.14, 0xefe7d6, 0xf7f0e2, 0, true);
      for (const sx of [-3.46, 3.46]) {
        // Vách phòng bếp kín
        m.box(sx, 0, -1.06, 0.14, 3.05, 2.88, 0xefe7d6, 0xf7f0e2, 0, true);
        // Vách phòng ăn có cửa sổ lớn thoáng nhìn vào trong
        m.box(sx, 0, 2.12, 0.14, 0.95, 3.46, 0xefe7d6, 0xf7f0e2, 0, true);
        m.box(sx, 2.25, 2.12, 0.14, 0.8, 3.46, 0xefe7d6, 0xf7f0e2, 0, true);
        m.box(sx, 0.95, 0.55, 0.14, 1.3, 0.3, 0xefe7d6, 0xf7f0e2, 0, true);
        m.box(sx, 0.95, 3.7, 0.14, 1.3, 0.3, 0xefe7d6, 0xf7f0e2, 0, true);
        m.box(sx, 0.95, 2.12, 0.08, 1.3, 0.08, 0x6b3e24);
      }
      // Mặt tiền cửa sổ thoáng (lz = +3.85), chừa cửa đôi rộng ở giữa (lx ∈ [-1.1, +1.1])
      for (const sx of [-2.3, 2.3]) {
        m.box(sx, 0, 3.85, 2.4, 0.88, 0.14, 0x9b5a3a, 0xb8734b, 0, true);
        m.box(sx, 0.88, 3.85, 0.08, 1.37, 0.12, 0x6b3e24);
        m.box(sx, 2.25, 3.85, 2.4, 0.8, 0.14, 0xefe7d6, 0xf7f0e2, 0, true);
      }
      m.box(0, 2.25, 3.85, 2.2, 0.8, 0.14, 0xefe7d6, 0xf7f0e2, 0, true);
      // Khung cửa ra vào + bảng hiệu mặt tiền
      for (const dx of [-1.1, 1.1]) m.box(dx, 0, 3.85, 0.08, 2.25, 0.16, 0x6b3e24);
      m.box(0, 2.52, 3.94, 4.6, 0.44, 0.05, 0x7a241b, 0x9a3022, 0, true);
      // Vách ngăn phòng bếp riêng (lz = +0.41): cửa sổ ra món ở giữa (lx ∈ [-1.32, +1.32]) & cửa bếp bên phải (lx ∈ [2.44, 3.38])
      m.box(-2.36, 0, 0.41, 2.08, 3.05, 0.12, 0xeae0cc, 0xf4ece0, 0, true);
      m.box(1.88, 0, 0.41, 1.12, 3.05, 0.12, 0xeae0cc, 0xf4ece0, 0, true);
      m.box(0, 0, 0.41, 2.64, 0.92, 0.12, 0xeae0cc, 0xf4ece0, 0, true);
      m.box(0, 2.1, 0.41, 2.64, 0.95, 0.12, 0xeae0cc, 0xf4ece0, 0, true);
      m.box(2.91, 2.2, 0.41, 0.94, 0.85, 0.12, 0xeae0cc, 0xf4ece0, 0, true);
      // Trần & mái kín + đèn trần ấm trong nhà
      m.box(0, 3.05, 0.68, 7.24, 0.12, 6.55, 0x3b4d5e, 0x56697a, 0, true);
      for (const lz of [-0.9, 1.6, 3.1]) for (const lx of [-1.5, 1.5]) m.box(lx, 2.97, lz, 0.65, 0.04, 0.22, 0xfff3cc, 0xfff9e0);
      // Quầy ra món chính giữa phòng bếp (lz = -0.02, tách hẳn khỏi mặt trước vách ngăn z=0.47 để không z-fighting) & bàn sơ chế sau bếp
      m.box(0, 0, -0.02, 4.2, 0.92, 0.72, 0x8d959e, 0xd8dfe6, 0.06);
      m.box(0, 0.92, -0.02, 4.3, 0.045, 0.78, 0xe3e8ee, 0xf3f6fa, 0, true);
      m.box(-0.3, 0, -2.0, 4.2, 0.86, 0.72, 0x8d959e, 0xc7cfd6, 0.06);
      m.box(-0.3, 0.86, -2.0, 4.3, 0.04, 0.78, 0xe3e8ee, 0xf3f6fa, 0, true);
      // Kệ inox treo tường trong bếp
      m.box(-0.3, 1.65, -2.32, 3.2, 0.04, 0.34, 0xc7cfd6, 0xe3e8ee);
      // Quầy thu ngân góc trái phòng ăn + hai chậu cây trước cửa
      m.box(-2.75, 0, 0.78, 0.95, 0.96, 0.54, 0x7b4c2d, 0x9b643e, 0.05);
      for (const px of [-1.55, 1.55]) { m.box(px, 0, 4.15, 0.44, 0.42, 0.44, 0xa8534a, 0xc46b5f); m.box(px, 0.42, 4.15, 0.36, 0.38, 0.36, 0x4f7f3e, 0x679c4f); }
      // Bốn bàn gỗ (8 ghế tựa lưng) kê hai bên lối đi chính
      for (const [bx, bz] of [[-1.85, 1.5], [1.85, 1.5], [-1.85, 3.0], [1.85, 3.0]] as const) {
        m.box(bx, 0.72, bz, 0.92, 0.06, 0.92, 0x8b5a34, 0xa87148, 0.04, true);
        for (const dx of [-0.36, 0.36]) for (const dz of [-0.36, 0.36]) m.box(bx + dx, 0, bz + dz, 0.06, 0.72, 0.06, 0x5f3d23);
        for (const cz of [bz - 0.58, bz + 0.58]) {
          const back = cz > bz ? 0.21 : -0.21;
          m.box(bx, 0.45, cz, 0.44, 0.05, 0.44, 0x8b5a34, 0xa87148, 0.04, true);
          for (const dx of [-0.18, 0.18]) for (const dz of [-0.18, 0.18]) m.box(bx + dx, 0, cz + dz, 0.045, 0.45, 0.045, 0x5f3d23);
          for (const dx of [-0.18, 0.18]) m.box(bx + dx, 0.5, cz + back, 0.04, 0.5, 0.04, 0x5f3d23);
          m.box(bx, 0.9, cz + back, 0.44, 0.14, 0.05, 0x8b5a34, 0xa87148, 0.03, true);
        }
        // Khăn giấy, chai nước tương & lọ hoa nhỏ trên mỗi bàn
        m.box(bx + 0.28, 0.78, bz - 0.18, 0.1, 0.1, 0.1, 0xe9e2d0, 0xf3efe6);
        m.cyl(bx - 0.28, 0.78, bz + 0.16, 0.035, 0.15, 0x4a2f1a, 8);
        m.cyl(bx, 0.78, bz, 0.04, 0.12, 0xf2f0ea, 8); m.cyl(bx, 0.91, bz, 0.055, 0.06, 0xd94e67, 7);
        if (has(g, 'binh_tra')) teaSetModel(m, bx - 0.22, 0.78, bz - 0.16);
      }
      // Dụng cụ nấu trong phòng bếp riêng
      if (has(g, 'bep_cn')) commercialStoveModel(tm, 1.35, 0.965, 0, 0.95);
      else if (st === 'bepthan') charcoalStove(tm, 1.35, 0.965, 0, 0.95); else if (st === 'bepgas') gasStove(tm, 1.35, 0.965, 0, 0.95);
      if (has(g, 'daothot')) { boardModel(tm, -1.1, 0.965, -0.04, 0.38, 0.25); knifeModel(tm, -1.0, 0.992, -0.02); }
      if (has(g, 'noi')) potModel(tm, -1.55, 0.965, 0.22, 0.72);
      if (has(g, 'chao')) panModel(tm, 0.45, 0.97, 0.22, 0.72);
      if (has(g, 'vi')) grateModel(tm, 1.35, st ? 1.15 : 0.98, 0, 0.38, 0.26);
      if (has(g, 'tu_dong')) commercialFridgeModel(m, -2.9, 0, -1.85);
      else if (has(g, 'thungda')) iceBox(m, -2.85, 0, -1.75, 1.05);
      if (has(g, 'den')) lanternModel(m, 1.85, 2.38, 3.92);
      // Tiện nghi & thiết bị nhà hàng (Bậc 6)
      if (has(g, 'loa')) speakerModel(m, 2.0, 0.965, 0.22);
      if (has(g, 'hopmangve')) takeawayRackModel(m, -1.7, 0.965, 0.22);
      if (has(g, 'mayep')) juicerModel(m, 0.85, 0.965, 0.22);
      if (has(g, 'tu_kinh')) glassCaseModel(m, -0.15, 0.965, 0.2, 1.35);
      if (has(g, 'may_tinh_tien')) posCounterModel(m, -2.75, 0.96, 0.78);
      if (has(g, 'wifi_nhac')) { wifiSpeakerModel(m, -2.4, 0.96, 0.72); speakerModel(m, 3.22, 2.25, 2.1); }
      if (has(g, 'hut_mui')) rangeHoodModel(m, 1.35, 2.02, 0.0);
      if (has(g, 'wc_lavabo')) washBasinModel(m, -3.12, 0.06, 2.15);
      if (has(g, 'dieu_hoa')) { acUnitModel(m, -3.28, 2.45, 1.5, true); acUnitModel(m, 3.28, 2.45, 2.8, false); }
      if (has(g, 'may_quat') && !has(g, 'dieu_hoa')) standFanModel(m, 3.05, 0.06, 1.25);
    }
    if (placed) {
      if (has(g, 'odu') && s.tier < 3) umbrellaModel(m, s.tier === 1 ? -1.05 : -1.15, 0, s.tier === 1 ? -0.9 : -0.55, 1.7, 2.5);
      if (has(g, 'ghe') && s.tier < 5) { plasticTable(m, 2.3, 0, 0.5); plasticStool(m, 2.3, 0, 1.15, 0x2f8fd5); plasticStool(m, 1.65, 0, 0.5, 0xd9463c); plasticStool(m, 2.95, 0, 0.5, 0xd9463c); }
      if (has(g, 'bien')) signBoardModel(m, s.tier >= 6 ? 3.05 : 1.45, s.tier >= 6 ? 0 : 0.62, s.tier >= 6 ? 4.18 : 0.75, 0.86, 0.5);
    }
    this.body = new THREE.Mesh(m.build(), MAT.litDouble); this.body.castShadow = true; this.group.add(this.body);
    if (tm.count) { this.toolMesh = new THREE.Mesh(tm.build(), MAT.lit); this.toolMesh.visible = !this.isCooking; this.group.add(this.toolMesh); }
    if (placed && (has(g, 'bien') || s.tier >= 6)) {
      const names = menuOf(g).slice(0, 3).map((r) => r.short).join(' · ') || 'Ngon · Rẻ · Sạch';
      const subTitle = s.tier >= 6 ? 'Nhà Hàng ' + (g.ac === 'anh' ? 'Anh' : 'Chị') + ' Hai' : 'Quán ' + (g.ac === 'anh' ? 'Anh' : 'Chị') + ' Hai';
      const uv = this.signAtlas.draw(s.tier >= 6 ? 'NHÀ HÀNG BÌNH DÂN' : names, s.tier >= 6 ? 2.2 / 0.38 : 0.8 / 0.44, { bg: s.tier >= 6 ? '#7a241b' : '#2a3a2e', fg: '#fff3c2', font: s.tier >= 6 ? 'display' : 'hand', sub: s.tier >= 6 ? names : subTitle, subFg: '#ffd24d' }, 120), sm = new MB(true);
      if (s.tier >= 6) sm.quad(-1.1, 2.34, 3.97, 1.1, 2.34, 3.97, 1.1, 2.71, 3.97, -1.1, 2.71, 3.97, 0xffffff, 0, uv.u0, uv.v0, uv.u1, uv.v1);
      else sm.quad(1.45 - 0.4, 0.65, 0.768, 1.45 + 0.4, 0.65, 0.768, 1.45 + 0.4, 1.09, 0.768, 1.45 - 0.4, 1.09, 0.768, 0xffffff, 0, uv.u0, uv.v0, uv.u1, uv.v1);
      this.sign = new THREE.Mesh(sm.build(), this.signMat); this.group.add(this.sign);
    }
    if (placed) {
      const c = Math.cos(s.yaw), sn = Math.sin(s.yaw), W = (lx: number, lz: number): [number, number] => [s.x + lx * c + lz * sn, s.z - lx * sn + lz * c];
      const pts: [number, number, number][] = s.tier === 1 ? [[-0.62, 0, 0.34], [0.62, 0, 0.34]]
        : s.tier === 2 ? [[-0.5, 0, 0.5], [0.5, 0, 0.5]]
        : s.tier === 4 ? [[-2.1, 0.1, 0.62], [2.1, 0.1, 0.62], [0, 0.1, 0.62]]
        : s.tier >= 6 ? [
            // Vách ngăn bếp & quầy ra món (chừa lối bếp bên phải lx ∈ [2.3, 3.3])
            [-2.2, 0.4, 0.45], [-1.2, 0.4, 0.45], [0, 0.4, 0.45], [1.2, 0.4, 0.45], [1.9, 0.4, 0.45],
            // Tường trái & tường phải kín từ lz = -2.4 tới +3.85
            [-3.45, -2.0, 0.42], [-3.45, -1.0, 0.42], [-3.45, 0.0, 0.42], [-3.45, 1.0, 0.42], [-3.45, 2.0, 0.42], [-3.45, 3.0, 0.42], [-3.45, 3.85, 0.42],
            [3.45, -2.0, 0.42], [3.45, -1.0, 0.42], [3.45, 0.0, 0.42], [3.45, 1.0, 0.42], [3.45, 2.0, 0.42], [3.45, 3.0, 0.42], [3.45, 3.85, 0.42],
            // Tường hậu kín
            [-2.4, -2.45, 0.45], [-1.2, -2.45, 0.45], [0, -2.45, 0.45], [1.2, -2.45, 0.45], [2.4, -2.45, 0.45],
            // Mặt tiền cửa kính hai bên (chừa cửa đôi rộng ở giữa lx ∈ [-1.1, +1.1])
            [-2.9, 3.85, 0.42], [-2.0, 3.85, 0.42], [-1.45, 3.85, 0.36],
            [1.45, 3.85, 0.36], [2.0, 3.85, 0.42], [2.9, 3.85, 0.42],
          ]
        : s.tier === 5 ? [
            [-2.2, 0.1, 0.52], [-0.8, 0.1, 0.52], [0.8, 0.1, 0.52], [2.2, 0.1, 0.52],
            [-3.35, 1.2, 0.4], [-3.35, 2.4, 0.4], [-3.35, 3.6, 0.4],
            [3.35, 1.2, 0.4], [3.35, 2.4, 0.4], [3.35, 3.6, 0.4],
            [-2.6, 4.44, 0.45], [2.6, 4.44, 0.45],
          ]
        : [[-0.85, 0.1, 0.62], [0.85, 0.1, 0.62], [0, 0.1, 0.62]];
      pts.slice(0, this.cols.length).forEach(([lx, lz, r], i) => { const b = this.cols[i] as Circ, [x, z] = W(lx, lz); b.x = x; b.z = z; b.r = r; b.on = true; });
      if (has(g, 'odu') || s.tier >= 3) { const [x, z] = W(0, s.tier >= 6 ? 0.7 : s.tier >= 4 ? 0.8 : -0.4); const r = s.tier >= 6 ? 3.6 : s.tier >= 4 ? 3.2 : 1.9; this.roof = { x0: x - r, z0: z - r, x1: x + r, z1: z + r }; if (!ctx.world.roofs.includes(this.roof)) ctx.world.roofs.push(this.roof); }
    }
    if (!placed || !(has(g, 'odu') || s.tier >= 3)) { const i = ctx.world.roofs.indexOf(this.roof); if (i >= 0) ctx.world.roofs.splice(i, 1); }
    this.stockKey = '';
  }
  private roof: Box2 = { x0: 0, z0: 0, x1: 0, z1: 0 }; private toolMesh: THREE.Mesh | null = null; private isCooking = false;
  /** Khi đang nấu: giấu dụng cụ để yên trên quầy (bàn bếp có bản sao đang dùng). */
  cooking(on: boolean) { this.isCooking = on; if (this.toolMesh) this.toolMesh.visible = !on; if (this.stock) this.stock.visible = !on; }
  /** Hiển thị nguyên liệu và phần ăn làm sẵn ngay trên quầy. */
  private rebuildStock() {
    const s = this.s, key = s.store.map((x) => x.id + Math.ceil(x.n)).join(',') + '#' + s.ready.map((r) => r.rid + r.n).join(',') + '#' + s.preps.map((p) => p.rid + p.n).join(',');
    if (key === this.stockKey) return; this.stockKey = key;
    if (this.stock) { this.group.remove(this.stock); this.stock.geometry.dispose(); this.stock = null; }
    if (s.where !== 'placed' && s.where !== 'home') return;
    const m = new MB(), t = s.tier, R = rnd;
    const base: [number, number, number] = t === 1 ? [-0.62, 0.255, 0] : t === 2 ? [-0.3, 0.91, -0.22] : [-0.2, 0.935, -0.2];
    s.store.slice(0, t === 1 ? 5 : 8).forEach((st, i) => {
      const d = INGS[st.id]; if (!d || d.shape === 'bag' || d.shape === 'coal' || d.shape === 'cubes') return;
      const a = i * 1.25, r = t === 1 ? 0.15 : 0, x = base[0] + (t === 1 ? Math.cos(a) * r : (i % 4) * 0.2), z = base[2] + (t === 1 ? Math.sin(a) * r : Math.floor(i / 4) * 0.2);
      for (let k = 0; k < Math.min(3, Math.ceil(st.n)); k++) ingModel(m, d, x + R.range(-0.03, 0.03), base[1] + k * 0.03, z + R.range(-0.03, 0.03), 0.8, R);
    });
    const rb: [number, number, number] = t === 1 ? [0.62, 0.255, 0] : t === 2 ? [0.2, 0.91, 0.24] : [0.4, 0.935, 0.3];
    let k = 0; for (const r of s.ready) for (let i = 0; i < r.n && k < 8; i++, k++) { const x = rb[0] + ((k % 4) - 1.5) * 0.12, z = rb[2] + (k < 4 ? -0.07 : 0.07); m.box(x, rb[1], z, 0.1, 0.07, 0.1, 0xf3ead2, 0xe9dcb8, 0.08); m.box(x, rb[1] + 0.07, z, 0.06, 0.02, 0.06, 0xd98a4a); }
    const pb: [number, number, number] = t === 1 ? [0.0, 0.03, -0.4] : t === 2 ? [-0.1, 0.91, 0.2] : [-0.5, 0.935, 0.3];
    s.preps.slice(0, 4).forEach((p, i) => { const x = pb[0] + (i - 1.5) * 0.19; m.cyl(x, pb[1], pb[2], 0.07, 0.05, 0xdfe6ea, 10, 0.085, false); m.cyl(x, pb[1] + 0.035, pb[2], 0.075, 0.006, [0x8fbf6a, 0xd98a4a, 0xf3e2a8, 0xc86a5a][i % 4], 10); });
    if (m.count) { this.stock = new THREE.Mesh(m.build(), MAT.food); this.stock.visible = !this.isCooking; this.group.add(this.stock); }
  }

  // ───────── đặt / dọn / mang quầy ─────────
  nearSpot(x: number, z: number): Spot | undefined { return SPOTS.find((sp) => dist2(sp.x, sp.z, x, z) < 4.5 * 4.5); }
  /** Danh sách chỗ bán (bản đồ, công cụ kiểm thử). */
  spots(): Spot[] { return SPOTS; }
  placeAt(sp: Spot): boolean {
    const g = ctx.g, s = g.stall;
    if (s.tier < sp.minTier) { toast(`Chỗ này cần ${TIERS[sp.minTier].name.toLowerCase()} trở lên.`, 'warn'); return false; }
    // Bậc 4 trở lên chỉ dựng được ở mặt bằng có sân (điểm vàng ghi “Mặt bằng”), không chen vô vỉa hè hẹp.
    if (s.tier >= 4 && sp.minTier < 4) { toast(`Quán ăn nhỏ cần MẶT BẰNG có sân kê bàn ghế — ${sp.name} hẹp quá. Tìm điểm vàng có chữ “Mặt bằng”.`, 'warn', 'shop'); return false; }
    if (sp.fee > 0 && s.paidDay !== g.day) { if (!spend(g, sp.fee, 'fees')) { toast(`Không đủ ${money(sp.fee)} phí chỗ ở ${sp.name}.`, 'bad', 'cash'); return false; } toast(`Đã đóng ${money(sp.fee)} phí chỗ hôm nay.`, 'info', 'cash'); }
    s.paidDay = g.day; s.where = 'placed'; s.spot = sp.id; s.x = sp.x; s.z = sp.z; s.yaw = sp.yaw; s.open = false; this.stowed = false;
    if (s.tier >= 6) { delete g.flags.sapNo; toast(`Nhà hàng bình dân mở ở ${sp.name}! Không gian trong nhà kín gồm 4 bàn (8 ghế) và phòng bếp riêng — hỗ trợ đặt bàn trước, thuê phụ bếp và đón khách đoàn.`, 'good', 'shop', true); }
    else if (s.tier >= 5) { delete g.flags.sapNo; toast(`Quán có chỗ ngồi mở ở ${sp.name}. Sáu ghế bàn gỗ trong nhà, khách ăn tại chỗ lâu hơn và hay gọi thêm tráng miệng — nhớ ${periodName(g).toLowerCase()} mà bày món hợp buổi.`, 'good', 'shop', true); }
    else if (s.tier >= 4) { delete g.flags.sapNo; toast(`Quán ăn nhỏ mở ở ${sp.name}. Mỗi ngày đóng ${money(sp.fee)} phí mặt bằng; bốn chỗ ngồi cho khách ăn tại chỗ nên ai cũng đợi lâu hơn.`, 'good', 'shop', true); }
    else if (s.tier >= 3) { delete g.flags.sapNo; toast(`Sạp đặt cố định ở ${sp.name}. Từ nay mỗi ngày đóng ${money(sp.fee)} phí chỗ, đổi ${money(sp.fee)} lấy chỗ đông khách và không ai dọn được quầy của bạn.`, 'good', 'shop', true); }
    sfx('place'); this.rebuild(); bus.emit('save', 'dat quay'); return true;
  }
  /** Để quầy ở chỗ ở (cạnh giường). */
  storeHome(): boolean {
    const g = ctx.g, s = g.stall;
    if (s.tier >= 3) { toast('Sạp cố định chỉ đặt ngoài chỗ bán, không đưa về nhà được.', 'warn'); return false; }
    const a = ctx.world.anchors['store_' + g.housing] ?? ctx.world.anchors['bed_' + g.housing]; if (!a) return false;
    s.where = 'home'; s.spot = null; s.open = false; const off = g.housing === 'gamcau' ? [2.6, -0.4] : [0.2, -1.0];
    s.x = a.x + off[0] * Math.cos(a.yaw) + off[1] * Math.sin(a.yaw); s.z = a.z - off[0] * Math.sin(a.yaw) + off[1] * Math.cos(a.yaw); s.yaw = a.yaw; sfx('place'); this.rebuild(); return true;
  }
  pickUp(): boolean {
    const s = this.s; if (s.tier === 0 || s.tier >= 3) { toast('Sạp cố định không dời đi được.', 'warn'); return false; }
    this.close(true); for (const n of this.customers.slice()) this.dismiss(n, false);
    s.where = 'carried'; s.spot = null; this.stowed = false; sfx('pick'); this.rebuild(); return true;
  }
  open(): boolean {
    const g = ctx.g, s = g.stall;
    if (s.where !== 'placed') return false;
    if (s.tier >= 3 && g.flags.sapNo) {
      if (!payStallRent(g)) { toast(`Còn nợ ${money(stallRent(g))} phí chỗ sạp — đóng rồi mới mở bán được.`, 'bad', 'cash'); return false; }
      toast(`Đã đóng ${money(stallRent(g))} phí chỗ sạp.`, 'info', 'cash');
    }
    if (wx(g).id === 'bao') { toast('Đang bão, không thể mở bán!', 'bad', 'storm'); return false; }
    if (s.cond < 25) { toast('Quầy hư nặng quá, phải sửa ở tiệm Ba Tài đã.', 'bad'); return false; }
    const menu = menuOf(g); if (!menu.length) { toast('Chưa chọn món nào để bán. Bật món trong thực đơn trước.', 'warn'); return false; }
    if (!menu.some((r) => available(g, r))) { toast('Chưa có gì để bán: hãy sơ chế hoặc mua thêm nguyên liệu.', 'warn'); return false; }
    s.open = true; this.acc = 0.6; sfx('open'); toast('Mở bán! ' + (isNight(g) && !has(g, 'den') ? 'Trời tối mà không có đèn nên khách khó thấy quầy.' : 'Chúc đắt hàng.'), 'good', 'shop'); this.builtKey = ''; bus.emit('ui', 'stall'); return true;
  }
  close(silent = false) { const s = this.s; if (!s.open) return; s.open = false; if (!silent) { sfx('close'); toast('Đã đóng quầy.', 'info', 'shop'); } bus.emit('ui', 'stall'); }

  // ───────── khách ─────────
  private persona(n: Npc, reg?: RegularDef): Persona {
    const a = n.arch, R = rnd, g = ctx.g, sp = this.spot(), bud = R.range(a.budget[0], a.budget[1]) * (sp ? 1 : 1);
    return { arch: a, budget: round1k(bud * (eventOn(g, 'ngay_luong') ? 1.35 : 1)), noise: R.range(0.86, 1.2), regular: reg?.id, likes: reg?.likes };
  }
  private send(reg?: RegularDef, archId?: string): Npc | null {
    const s = this.s, N = ctx.npcs;
    let n: Npc | null = null;
    if (reg || archId) n = N.spawnPed(s.x, s.z, 16, 40, ARCH[(reg?.arch ?? archId) as keyof typeof ARCH]);
    else n = N.recruit(s.x, s.z, 34) ?? N.spawnPed(s.x, s.z, 16, 38);
    if (!n) return null;
    if (reg) { n.name = reg.name; n.regular = reg; if (n.fem !== reg.fem) n.fem = reg.fem; }
    n.persona = this.persona(n, reg); n.state = 'toStall'; n.slot = this.freeSlot(); this.customers.push(n);
    N.gotoPath(n, this.entryWaypoints(n.slot, stallQueueCap(ctx.g), n.x, n.z), (c) => this.arrived(c));
    return n;
  }
  private freeSlot(): number {
    const used = new Set(this.customers.map((c) => c.slot)), q = stallQueueCap(ctx.g);
    const mid = Array.from({ length: q }, (_, i) => i).sort((a, b) => Math.abs(a - (q - 1) / 2) - Math.abs(b - (q - 1) / 2));
    // Quán ăn nhỏ: khách ngồi vô bàn trước, hết ghế mới đứng xếp hàng.
    const seats = seatCount(ctx.g);
    const order = seats ? [...mid.filter((i) => i < seats), ...mid.filter((i) => i >= seats)] : mid;
    return order.find((i) => !used.has(i)) ?? 0;
  }
  private freeSeats(need: number): number[] {
    const seats = seatCount(ctx.g), used = new Set(this.customers.map((c) => c.slot));
    const free: number[] = [];
    // Ưu tiên ghép đôi từng bàn (0-1, 2-3, 4-5, 6-7) để cả đoàn ngồi chung bàn gần nhau.
    for (let i = 0; i < seats; i += 2) {
      if (!used.has(i) && !used.has(i + 1) && i + 1 < seats) { free.push(i, i + 1); }
    }
    for (let i = 0; i < seats; i++) if (!used.has(i) && !free.includes(i)) free.push(i);
    return free.slice(0, need);
  }
  sendGroup(size: number, booking?: Booking): boolean {
    const g = ctx.g, s = this.s, N = ctx.npcs;
    if (!booking && this.customers.length + size > stallQueueCap(g)) return false;
    const slots = this.freeSeats(size);
    if (slots.length < size) return false;
    const archId = (booking?.arch ?? rnd.pick(['vanphong', 'congnhan', 'phuhuynh', 'dukhach', 'nhagiau'])) as keyof typeof ARCH;
    const members: Npc[] = [];
    for (let i = 0; i < size; i++) {
      const n = N.spawnPed(s.x, s.z, 16, 40, ARCH[archId]);
      if (!n) { for (const m of members) N.leave(m); return false; }
      members.push(n);
    }
    const gid = this.groupSeq++, leader = members[0];
    if (booking) {
      leader.name = booking.name;
      if (leader.fem !== booking.fem) leader.fem = booking.fem;
    }
    leader.persona = this.persona(leader);
    if (booking) leader.persona.budget = Math.max(leader.persona.budget, 120000);
    leader.data = { groupId: gid, leader, members, size, bookingId: booking?.id, bookingDish: booking?.dish, bookingDeposit: booking?.deposit };
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      m.state = 'toStall'; m.slot = slots[i];
      if (i > 0) m.data = { groupId: gid, leader, isCompanion: true };
      this.customers.push(m);
      N.gotoPath(m, this.entryWaypoints(m.slot, stallQueueCap(g), m.x, m.z), (c) => i === 0 ? this.arrived(c) : this.arrivedCompanion(c));
    }
    return true;
  }
  private arrivedCompanion(n: Npc) {
    const s = this.s, sit = this.seated(n.slot);
    if (sit) {
      const [sx, sz] = this.slotPos(n.slot, stallQueueCap(ctx.g));
      n.x = sx; n.z = sz;
    }
    n.yaw = sit ? this.seatYaw(n.slot) : s.yaw + Math.PI;
    n.state = 'queue'; n.pose = sit ? 'sit' : 'idle'; n.rig.seated = sit;
  }
  private arrived(n: Npc) {
    const g = ctx.g, s = g.stall, N = ctx.npcs, sit = this.seated(n.slot);
    if (sit) {
      const [sx, sz] = this.slotPos(n.slot, stallQueueCap(g));
      n.x = sx; n.z = sz;
    }
    n.yaw = sit ? this.seatYaw(n.slot) : s.yaw + Math.PI; n.state = 'queue'; n.pose = sit ? 'sit' : 'idle'; n.rig.seated = sit;
    if (n.actor === 'inspector') { n.rig.hold(clipboardProp()); n.pose = 'read'; }
    else if (n.actor === 'critic') { n.rig.hold(notebookProp()); n.pose = 'read'; }
    else if (n.actor === 'gang') { n.rig.hold(batonProp()); n.pose = 'angry'; }
    else if (n.actor === 'rowdy') { n.rig.hold(bottleProp()); n.pose = 'angry'; }
    if (n.actor && n.actor !== 'critic' && n.actor !== 'vip') { this.actorTalk(n); return; }
    if (!s.open) { this.dismiss(n, false); return; }
    const grpSize: number = n.data?.size ?? 0;
    if (grpSize >= 2) {
      const bid: number | undefined = n.data?.bookingId;
      const b = bid ? g.bookings.find((x) => x.id === bid) : undefined;
      if (b && b.status === 'accepted') {
        b.status = 'seated';
        earn(g, b.deposit, 'revenue');
        toast(`Bàn đặt trước của ${b.name} (${b.size} người) đã tới! +${money(b.deposit)} tiền cọc.`, 'good', 'star');
        N.say(n, rnd.pick(LINES.booking_arrive).replace('{Self}', n.arch.self[n.fem ? 1 : 0]).replace('{self}', n.arch.self[n.fem ? 1 : 0]).replace('{you}', n.arch.you.replace('{ac}', g.ac)).replace('{n}', String(b.size)), 2.8, EXPR.happy);
      }
      const res = decideGroup(g, n.persona!, grpSize, n.fem, rnd, n.data?.bookingDish);
      if (!res.order) {
        if (b) b.status = 'done';
        N.say(n, res.leave!, 3, res.why === 'price' ? EXPR.smug : EXPR.sad);
        lostCustomer(g, res.why ?? 'none');
        if (res.why === 'price') sfx('nope');
        setTimeout(() => this.dismiss(n, false), 1400);
        return;
      }
      n.order = res.order;
      if (bid) n.order.bookingId = bid;
      const a = n.arch;
      n.patience = rnd.range(a.patience[0], a.patience[1]) * rnd.range(PATIENCE_RANGE[0], PATIENCE_RANGE[1]) * 2.15 * helperPatience(g);
      n.waited = 0;
      setTimeout(() => { if (this.customers.includes(n) && n.order) N.say(n, res.order!.line, 3.2, res.order!.mood === 'pricey' ? EXPR.annoyed : EXPR.happy); }, b ? 1100 : 0);
      ctx.ui.order(n, res.order.rid, res.order.n); sfx('order');
      return;
    }
    const res = decide(g, n.persona!, n.fem);
    if (!res.order) { N.say(n, res.leave!, 3, res.why === 'price' ? EXPR.smug : EXPR.sad); lostCustomer(g, res.why ?? 'none'); if (res.why === 'price') sfx('nope'); setTimeout(() => this.dismiss(n, false), 1400); return; }
    n.order = res.order; if (n.actor === 'vip') n.order.n = Math.min(3, Math.max(n.order.n, 2), readyCount(g, n.order.rid) + finishPossible(g, RECIPES[n.order.rid]));
    const a = n.arch; n.patience = rnd.range(a.patience[0], a.patience[1]) * rnd.range(PATIENCE_RANGE[0], PATIENCE_RANGE[1]) * (sit ? (dineIn(g) ? 1.9 : 1.5) : has(g, 'ghe') ? 1.3 : 1) * (wx(g).rain > 0.3 && !has(g, 'odu') && s.tier < 4 ? 0.75 : 1) * helperPatience(g); n.waited = 0;
    N.say(n, res.order.line, 3.2, res.order.mood === 'pricey' ? EXPR.annoyed : EXPR.happy); ctx.ui.order(n, res.order.rid, res.order.n); sfx('order');
    if (n.regular) changeRel(g, n.regular.id, 0, true);
  }
  /** Khách ngồi ăn xong: hỏi thêm một món (tráng miệng/đồ uống) hoặc đứng dậy đi. */
  private maybeSecond(n: Npc, happy: boolean) {
    const g = ctx.g;
    if (!this.customers.includes(n) || !g.stall.open || n.state === 'gone') { this.dismiss(n, happy); return; }
    const more = secondOrder(g, n.persona!, n.order!, n.fem);
    if (!more) { this.dismiss(n, happy); return; }
    n.order = more; n.waited = 0;
    n.patience = rnd.range(n.arch.patience[0], n.arch.patience[1]) * rnd.range(PATIENCE_RANGE[0], PATIENCE_RANGE[1]) * 1.8 * helperPatience(g);
    ctx.npcs.say(n, more.line, 3.4, EXPR.happy); ctx.ui.order(n, more.rid, more.n); sfx('order');
    toast(`Khách ngồi lại gọi thêm ${RECIPES[more.rid].name.toLowerCase()} — làm rồi bưng ra cho họ.`, 'info', 'dish');
  }
  dismiss(n: Npc, happy: boolean) {
    if (Array.isArray(n.data?.members)) {
      const members: Npc[] = n.data.members;
      n.data = undefined;
      for (const m of members) this.dismiss(m, happy);
      return;
    }
    const i = this.customers.indexOf(n); if (i >= 0) this.customers.splice(i, 1);
    if (this.busy === n) this.busy = null;
    n.rig.seated = false; n.rig.inner.rotation.z = 0;
    ctx.ui.unorder(n); n.base = happy ? 1 : 0;
    if (n.state !== 'gone') {
      const via = this.exitWaypoints(n);
      if (via) ctx.npcs.leaveVia(n, via); else ctx.npcs.leave(n);
    }
  }
  /** Người chơi chạm vào khách: giao món nếu có sẵn, không thì bắt tay vào làm. */
  serve(n: Npc) {
    const g = ctx.g, o = n.order; if (!o) return;
    const r = RECIPES[o.rid];
    if (readyCount(g, o.rid) >= o.n) { this.handOver(n); return; }
    if (ctx.cook.active) return;
    if (finishPossible(g, r) < 1) {
      const miss = hasPrep(r) && g.stall.preps.filter((p) => p.rid === r.id).reduce((a, p) => a + p.n, 0) < 1 ? ['phần sơ chế (vào Thực đơn › Sơ chế)'] : missingFor(g, r, 'fin');
      toast(`Không làm được ${r.name}: thiếu ${miss.join(', ') || 'nguyên liệu'}.`, 'warn'); ctx.npcs.say(n, 'Ủa, hết rồi hả? Thôi vậy.', 2.5, 5); lostCustomer(g, 'none'); setTimeout(() => this.dismiss(n, false), 1200); return;
    }
    this.busy = n; ctx.cook.finish(r, () => { if (this.customers.includes(n) && readyCount(g, o.rid) >= 1) { o.n = Math.min(o.n, readyCount(g, o.rid)); this.handOver(n); } this.busy = null; });
  }
  private handOver(n: Npc, byHelper = false) {
    if (!byHelper) ctx.player.gesture('work', 0.45);
    const g = ctx.g, o = n.order!, s = g.stall; let q = 0, cost = 0, left = o.n;
    for (const rd of s.ready.filter((x) => x.rid === o.rid).sort((a, b) => a.at - b.at)) { const k = Math.min(left, rd.n); q += k * rd.q; cost += k * rd.cost; rd.n -= k; left -= k; if (left <= 0) break; }
    s.ready = s.ready.filter((x) => x.n > 0); q /= o.n;
    const rv = review(g, n.persona!, n.fem, o, q, n.waited / n.patience);
    settleSale(g, o, cost, rv, q); addXp(g, q);
    ctx.npcs.say(n, rv.line, 3.2, rv.face); n.base = rv.face; n.rig.hold(takeawayBag()); sfx(rv.tip ? 'tip' : 'coin'); if (rv.stars >= 4.5) sfx('yay'); else if (rv.stars < 2.5) sfx('boo');
    ctx.ui.float(`+${money(o.price * o.n + rv.tip)}`, n, rv.stars >= 3.7 ? 'good' : 'warn'); ctx.ui.stars(n, rv.stars);
    if (n.regular) { changeRel(g, n.regular.id, (rv.stars - 3) * 3); if (meet(g, n.regular.id)) setTimeout(() => toast(`Vị khách vừa rồi tự giới thiệu: ${n.regular!.name}. Có vẻ sẽ còn ghé lại.`, 'info', 'heart'), 2200); }
    if (n.actor === 'critic') { g.flags.critic = g.day; toast(rv.stars >= 4.2 ? `Nhà phê bình viết: "Viên ngọc ẩn của ẩm thực đường phố!" Uy tín tăng vọt.` : rv.stars >= 3 ? 'Nhà phê bình viết một bài nhận xét thường thường bậc trung.' : 'Nhà phê bình chê thậm tệ trên báo. Uy tín giảm mạnh!', rv.stars >= 4.2 ? 'good' : rv.stars >= 3 ? 'info' : 'bad', 'pen', true); }
    if (n.actor === 'vip' && rv.stars >= 4.2) { const bonus = 50000 + round1k(rnd.range(0, 100000)); earn(g, bonus, 'tips'); toast(`Vị khách VIP boa thêm ${money(bonus)} và hứa giới thiệu bạn bè!`, 'good', 'star', true); g.rep = clamp(g.rep + 2, 0, 100); }
    if (Array.isArray(n.data?.members)) { for (const m of n.data.members) if (m !== n) m.base = rv.face; }
    if (o.bookingId) {
      const b = g.bookings.find((x) => x.id === o.bookingId);
      if (b) { b.status = 'done'; if (rv.stars >= 3.8) { g.rep = clamp(g.rep + 0.35, 0, 100); } }
    }
    // Quán có chỗ ngồi: khách ăn tại chỗ (lẻ) thường gọi thêm món tráng miệng; khách đoàn ăn xong rồi cùng ra về.
    if (dineIn(g) && this.seated(n.slot) && !n.actor && !o.group) setTimeout(() => this.maybeSecond(n, rv.stars >= 3.7), 3200);
    else setTimeout(() => this.dismiss(n, rv.stars >= 3.7), o.group ? 2600 : 1500);
    if (!menuOf(g).some((r) => available(g, r))) { toast('Hết sạch hàng rồi! Sơ chế thêm hoặc đóng quầy đi mua nguyên liệu.', 'warn', 'box'); }
    bus.emit('ui', 'sale'); if (g.quest === 6) bus.emit('quest', 7);
  }

  // ───────── người phụ việc ─────────
  /** Chỗ nhân viên phục vụ đứng trực: ở bậc 6 đứng ngay cạnh hai chậu cây trước cửa đón khách (thoát hẳn tường & chậu); bậc 5 cạnh chậu cây trái. */
  private helperSpot(slot: 1 | 2 = 1): [number, number] {
    const s = this.s;
    if (s.tier >= 6) return this.localPos(slot === 2 ? 2.18 : -2.18, 4.36);
    if (s.tier === 5) return this.localPos(slot === 2 ? 1.55 : -1.55, 4.65);
    return this.localPos(slot === 2 ? 1.45 : -1.1, s.tier <= 1 ? -1.55 : s.tier >= 4 ? 3.5 : -1.1);
  }
  /** Lộ trình nhân viên đi từ chỗ đứng (ngoài chậu cây) vòng trước chậu cây qua cửa chính vào điểm trong nhà hàng (không vướng tường hay chậu cây). */
  private staffEnterPath(n: Npc, targetLx: number, targetLz: number): [number, number][] {
    const s = this.s;
    if (s.tier >= 6) {
      const [lx0, lz0] = this.worldToLocal(n.x, n.z);
      const aisleZ = targetLz <= 2.2 ? 1.5 : 3.0;
      if (lz0 > 4.0) {
        const pts: [number, number][] = [];
        if (Math.abs(lx0) > 1.0) pts.push(this.localPos(lx0 < 0 ? -2.18 : 2.18, 5.0));
        pts.push(this.localPos(0, 5.0), this.localPos(0, 3.85), this.localPos(0, aisleZ), this.localPos(targetLx, targetLz));
        return pts;
      }
      return [this.localPos(0, lz0 <= 2.2 ? 1.5 : 3.0), this.localPos(0, aisleZ), this.localPos(targetLx, targetLz)];
    }
    if (s.tier === 5) {
      const [, lz0] = this.worldToLocal(n.x, n.z);
      const aisleZ = targetLz <= 2.45 ? 1.7 : 3.2;
      if (lz0 > 4.25) return [this.localPos(0, 4.9), this.localPos(0, aisleZ), this.localPos(targetLx, targetLz)];
      return [this.localPos(0, aisleZ), this.localPos(targetLx, targetLz)];
    }
    return [this.localPos(targetLx, targetLz)];
  }
  /** Lộ trình nhân viên quay từ trong nhà hàng qua cửa chính, vòng trước chậu cây về lại vị trí đón khách. */
  private staffReturnPath(n: Npc, slot: 1 | 2): [number, number][] {
    const s = this.s;
    if (s.tier >= 6) {
      const [lx0, lz0] = this.worldToLocal(n.x, n.z);
      const sideX = slot === 2 ? 2.18 : -2.18;
      if (lz0 < 4.0) {
        const aisleZ = lz0 <= 2.2 ? 1.5 : 3.0;
        return [this.localPos(0, aisleZ), this.localPos(0, 3.85), this.localPos(0, 5.0), this.localPos(sideX, 5.0), this.helperSpot(slot)];
      }
      if (Math.abs(lx0 - sideX) > 0.7 && lz0 < 4.85) return [this.localPos(0, 5.0), this.localPos(sideX, 5.0), this.helperSpot(slot)];
      return [this.localPos(sideX, 5.0), this.helperSpot(slot)];
    } else if (s.tier === 5) {
      const [, lz0] = this.worldToLocal(n.x, n.z);
      if (lz0 < 4.3) return [this.localPos(0, 4.9), this.helperSpot(slot)];
    }
    return [this.helperSpot(slot)];
  }
  /** Điểm nhân viên phục vụ tới đứng bên cạnh bàn của khách để bưng đồ ăn ra (không đâm xuyên bàn/ghế). */
  private staffServeLocal(c: Npc): [number, number] {
    const s = this.s;
    if (s.tier >= 6 && this.seated(c.slot)) {
      const [lx, lz] = this.slotLocal(c.slot, stallQueueCap(ctx.g));
      return [lx < 0 ? -0.75 : 0.75, lz];
    }
    if (s.tier >= 4 && this.seated(c.slot)) {
      const [lx, lz] = this.slotLocal(c.slot, stallQueueCap(ctx.g));
      return [lx < 0 ? lx + 0.72 : lx - 0.72, lz];
    }
    const [cx, cz] = this.worldToLocal(c.x, c.z);
    return [clamp(cx * 0.65, -1.2, 1.2), Math.max(4.45, cz - 0.55)];
  }
  /** Điểm quầy nhận món mà nhân viên chạy ra lấy khay. */
  private staffCounterLocal(slot: 1 | 2): [number, number] {
    const s = this.s;
    if (s.tier >= 6) return [slot === 2 ? 0.55 : -0.55, 1.05];
    if (s.tier >= 4) return [slot === 2 ? 0.55 : -0.55, 0.95];
    return [slot === 2 ? 0.5 : -0.5, -1.0];
  }
  /** Điểm bàn hoặc mặt quầy để nhân viên đi tới lau dọn. */
  private staffWipeLocal(slot: 1 | 2): [number, number, number] {
    const s = this.s;
    if (s.tier >= 6) {
      const lx = slot === 2 ? 0.78 : -0.78, lz = slot === 2 ? 2.8 : 1.5;
      const [x, z] = this.localPos(lx, lz);
      const [tx, tz] = this.localPos(slot === 2 ? 1.85 : -1.85, lz);
      return [lx, lz, Math.atan2(tx - x, tz - z)];
    }
    if (s.tier >= 4) {
      const lx = slot === 2 ? 0.75 : -0.75, lz = 2.15;
      const [x, z] = this.localPos(lx, lz);
      const [tx, tz] = this.localPos(slot === 2 ? 1.75 : -1.75, lz);
      return [lx, lz, Math.atan2(tx - x, tz - z)];
    }
    return [slot === 2 ? 0.8 : -0.8, -1.0, s.yaw];
  }
  private staffMoveTo(n: Npc, pts: [number, number][], onDone: () => void) {
    n.path = pts; n.pi = 0; n.enter = false; n.pose = n.pose === 'serve' ? 'serve' : 'walk'; n.onArrive = onDone;
  }
  private helperLook(h: Helper): Look {
    return { face: h.face, fem: h.fem, shirt: h.shirt, pants: h.pants, hair: h.hair, hat: 0, hairStyle: h.hairStyle, fat: 1.02, h: 0.97, skin: h.skin, bag: 0, hatCol: 0x2f6fb5, long: false, apron: 0xc9473f, shoe: 0x2a2a2e };
  }
  /** Dựng (hoặc giữ) người phụ việc ở quầy và cho đi phục vụ bàn / lau dọn thật (1–2 người). */
  private updateHelper(dt: number) {
    const g = ctx.g, s = g.stall, N = ctx.npcs;
    const stepHelper = (slot: 1 | 2, want: boolean) => {
      const cur = slot === 2 ? this.helper2 : this.helper;
      const task = this.helperTask[slot];
      if (cur && (!want || cur.state === 'gone')) {
        if (slot === 2) this.helper2 = null; else this.helper = null;
        task.mode = 'idle'; task.target = undefined;
        if (cur.state !== 'gone') {
          cur.rig.hold(null);
          this.sayLine(cur, (slot === 2 ? g.help2 : g.help) ? '' : (slot === 2 ? 'Em xin phép nghỉ ca đây ạ.' : 'Con về nghen, mai con qua sớm.'), 2.6, EXPR.smile);
          const via = this.exitWaypoints(cur);
          if (via) N.leaveVia(cur, via); else N.leave(cur);
        }
        return;
      }
      if (want && !cur) {
        if (slot === 2) { this.helper2Retry -= dt; if (this.helper2Retry <= 0) { this.helper2Retry = 3; this.spawnHelper(2); } }
        else { this.helperRetry -= dt; if (this.helperRetry <= 0) { this.helperRetry = 3; this.spawnHelper(1); } }
        return;
      }
      const n = slot === 2 ? this.helper2 : this.helper;
      if (!n) return;
      n.state = 'actor'; n.timer = 1e9;
      if (slot === 1) {
        this.helperChat -= dt;
        if (this.helperChat <= 0) { this.helperChat = rnd.range(50, 85); this.helperLine(n); }
        this.helperWipe -= dt;
        if (this.helperWipe <= 0) { this.helperWipe = rnd.range(45, 75); if (s.dirt > 4) s.dirt = Math.max(0, s.dirt - (g.help2 ? 5 : 3)); }
      } else {
        this.helper2Chat -= dt;
        if (this.helper2Chat <= 0) { this.helper2Chat = rnd.range(55, 95); this.helperLine(n); }
      }
      // Nếu đang bưng món hoặc đi đón món mà khách vừa bỏ đi thì hủy chuyến (đi đúng cửa quay về chậu cây)
      if ((task.mode === 'toCounter' || task.mode === 'toCustomer' || task.mode === 'serve') && (!task.target || !this.customers.includes(task.target) || !task.target.order)) {
        n.rig.hold(null); n.pose = 'walk'; task.target = undefined; task.mode = 'return';
        this.staffMoveTo(n, this.staffReturnPath(n, slot), () => { task.mode = 'idle'; n.pose = 'idle'; task.yaw = s.yaw; });
      }
      if (task.mode === 'serve' || task.mode === 'wipe') {
        n.yaw = task.yaw;
        task.holdT -= dt;
        if (task.holdT <= 0) {
          if (task.mode === 'serve') {
            const c = task.target;
            if (c && c.order && this.customers.includes(c) && readyCount(g, c.order.rid) >= c.order.n) {
              this.handOver(c, true);
            }
            n.rig.hold(null);
            task.target = undefined;
          } else {
            if (s.dirt > 1) s.dirt = Math.max(0, s.dirt - 3.5);
          }
          task.mode = 'return'; n.pose = 'walk';
          this.staffMoveTo(n, this.staffReturnPath(n, slot), () => { task.mode = 'idle'; n.pose = 'idle'; task.yaw = s.yaw; });
        }
        return;
      }
      if (task.mode === 'toCounter' || task.mode === 'toCustomer' || task.mode === 'toWipe' || task.mode === 'return') return;

      // Đang rảnh đứng hai bên chậu cây đón khách (mặt hướng ra đường)
      n.yaw = s.yaw;
      n.pose = 'idle';
      const otherTarget = this.helperTask[slot === 1 ? 2 : 1].target;
      const readyCust = this.customers.find((c) => c.state === 'queue' && c.order && c !== this.busy && c !== otherTarget && readyCount(g, c.order.rid) >= c.order.n);
      if (readyCust) {
        task.target = readyCust; task.mode = 'toCounter'; n.pose = 'walk';
        const [clx, clz] = this.staffCounterLocal(slot);
        this.staffMoveTo(n, this.staffEnterPath(n, clx, clz), () => {
          if (!task.target || !this.customers.includes(task.target) || !task.target.order) {
            task.mode = 'return'; n.pose = 'walk';
            this.staffMoveTo(n, this.staffReturnPath(n, slot), () => { task.mode = 'idle'; n.pose = 'idle'; task.yaw = s.yaw; });
            return;
          }
          const c = task.target;
          n.rig.hold(servingTray()); n.pose = 'serve'; task.mode = 'toCustomer';
          const [slx, slz] = this.staffServeLocal(c);
          const pts: [number, number][] = s.tier >= 6
            ? (slz > 4.0 ? [this.localPos(0, 1.5), this.localPos(0, 3.85), this.localPos(0, 4.75), this.localPos(slx, slz)] : [this.localPos(0, 1.5), this.localPos(0, slz <= 2.2 ? 1.5 : 3.0), this.localPos(slx, slz)])
            : [this.localPos(slx, slz)];
          this.staffMoveTo(n, pts, () => {
            task.mode = 'serve'; task.holdT = 0.75;
            task.yaw = Math.atan2(c.x - n.x, c.z - n.z);
            n.yaw = task.yaw; n.pose = 'work';
          });
        });
        return;
      }
      // Không có khách chờ bưng món: định kỳ đi qua cửa vào lau bàn / lau quầy cho có hoạt động
      task.wipeCd -= dt;
      if (task.wipeCd <= 0 && (s.dirt > 2 || s.tier >= 4)) {
        task.wipeCd = rnd.range(12, 19);
        const [wlx, wlz, wyaw] = this.staffWipeLocal(slot);
        task.mode = 'toWipe'; n.pose = 'walk';
        this.staffMoveTo(n, this.staffEnterPath(n, wlx, wlz), () => {
          task.mode = 'wipe'; task.holdT = 3.2; task.yaw = wyaw; n.yaw = wyaw; n.pose = 'wipe';
        });
      }
    };
    stepHelper(1, !!g.help && s.open);
    stepHelper(2, !!g.help2 && isRestaurant(g) && s.open);
    if (this.offerNpc && (!s.open || this.offerNpc.state === 'gone')) this.offerNpc = null;
    this.offerHelper(dt);
  }
  private spawnHelper(slot: 1 | 2 = 1) {
    const g = ctx.g, h = slot === 2 ? g.help2 : g.help; if (!h) return;
    const [x, z] = this.helperSpot(slot), n = ctx.npcs.spawnPed(this.s.x, this.s.z, 18, 34, ARCH.hangrong);
    if (!n) return;
    n.kind = 'actor'; n.actor = slot === 2 ? 'helper2' : 'helper'; n.name = h.name; n.fem = h.fem; n.rig.setLook(this.helperLook(h));
    n.rig.hold(null); n.path = []; n.pi = 0; n.vel = 0; n.onArrive = undefined;
    n.state = 'actor'; n.pose = 'idle'; n.timer = 1e9; n.plan = []; n.base = EXPR.normal; n.greetT = 9999;
    n.x = x; n.z = z; n.y = groundY(x, z); n.yaw = this.s.yaw; n.rig.root.position.set(x, n.y, z); n.rig.root.rotation.y = n.yaw;
    this.helperTask[slot] = { mode: 'idle', holdT: 0, wipeCd: slot === 2 ? 5 : 3, yaw: n.yaw };
    if (slot === 2) this.helper2 = n; else this.helper = n;
    this.sayLine(n, rnd.pick([`Con tới rồi ${g.ac} ơi!`, `Dạ ${g.ac}, con nhận ca đây.`, `Quầy sạch rồi ${g.ac} ơi.`]), 3, EXPR.happy);
    toast(`${h.name} đã tới nhận ca phục vụ.`, 'good', 'heart');
  }
  /** Nói một câu với biểu cảm; nói nhỏ nếu người chơi ở xa. */
  private sayLine(n: Npc, text: string, secs: number = 3, expr: number = EXPR.normal) { if (text) ctx.npcs.say(n, text, secs, expr); }
  /** Câu thoại của người phụ việc, chọn theo tình huống đang diễn ra. */
  private helperLine(n: Npc) {
    const g = ctx.g, s = g.stall, ac = g.ac, h = hourOf(g), R = rnd;
    const pool: [string, number][] = [];
    if (this.rowdy > 0) pool.push([`Mấy người đó nhìn ghê quá ${ac} ơi…`, EXPR.fear]);
    if (s.dirt > 45) pool.push(['Quầy bẩn quá, con lau lại một lượt nghen.', EXPR.annoyed]);
    if (this.customers.length >= 2) pool.push([`Khách đông quá, con bưng ra phụ ${ac} nghen!`, EXPR.happy]);
    if (wx(g).rain > 0.3) pool.push(['Trời mưa mà khách vẫn ghé, mừng ghê.', EXPR.smile]);
    if (h >= 21 || h < 5) pool.push([`Tối rồi ${ac}, ${ac} nghỉ sớm đi, con coi quầy cho.`, EXPR.sleepy]);
    if (g.led.revenue >= 300000) pool.push([`Hôm nay bán được ${money(g.led.revenue)} rồi đó ${ac}!`, EXPR.joy]);
    if (g.led.lost >= 3) pool.push(['Nãy có mấy người bỏ đi vì chờ lâu, tiếc quá.', EXPR.sad]);
    if (g.st.mood < 30) pool.push([`${ac} mệt hả? Để con lo, ${ac} ngồi nghỉ chút.`, EXPR.pout]);
    pool.push([`Con rửa chén trước nghen, ${ac} cứ lo nấu.`, EXPR.smile]);
    pool.push([`Món ${ac} nấu thơm quá, khách đứng ngoài hít mùi hoài.`, EXPR.savor]);
    const [text, ex] = R.pick(pool);
    this.sayLine(n, text, 3.2, ex);
  }
  /** Thỉnh thoảng có người ghé xin làm phụ — chỉ khi quán đã có doanh thu và bán đủ lâu. */
  private offerHelper(dt: number) {
    const g = ctx.g, s = g.stall;
    if (this.offerNpc || g.help || ctx.mode !== 'play' || !s.open) return;
    if (!helperGate(g).ok) return;
    if (dist2(ctx.player.x, ctx.player.z, s.x, s.z) > 14 * 14) return;
    if (this.customers.some((c) => c.state === 'queue' && c.order) && this.offerT > 0) { /* khách đang ăn: vẫn cho tới, chỉ chậm hơn */ }
    this.offerT -= dt;
    if (this.offerT > 0) return;
    this.offerT = rnd.range(240, 420);
    const d = helperCandidate(g), n = ctx.npcs.spawnPed(s.x, s.z, 18, 30, ARCH.hangrong);
    if (!n) { this.offerT = 60; return; }
    n.kind = 'actor'; n.actor = 'offer'; n.name = d.name; n.fem = d.fem;
    n.rig.setLook({ face: d.face, fem: d.fem, shirt: d.shirt, pants: d.pants, hair: d.hair, hat: 0, hairStyle: d.hairStyle, fat: 1, h: 0.97, skin: d.skin, bag: 0, hatCol: 0x2f6fb5, long: false, apron: 0, shoe: 0x2a2a2e });
    this.offerNpc = n;
    const [x, z] = this.helperSpot();
    ctx.npcs.goto(n, x, z, (c) => this.offerArrive(c, d));
  }
  private offerArrive(n: Npc, d: HelperDef) {
    const g = ctx.g;
    n.state = 'stand'; n.pose = 'idle'; n.timer = 1e9; n.yaw = this.s.yaw; n.rig.root.rotation.y = n.yaw;
    ctx.npcs.say(n, rnd.pick([`Chào ${g.ac}, con ghé xin việc một chút được hông?`, `Dạ ${g.ac} rảnh năm phút hông ạ?`]), 3.4, EXPR.smile);
    const off = g.cash < d.wage;
    ctx.ui.dialog({
      who: d.name, npc: n, text: d.ask.replace('{ac}', g.ac),
      opts: [
        { t: `Nhận làm phụ quầy — ${money(d.wage)}/ngày`, sub: off ? 'Không đủ tiền trả ngày đầu' : 'Trả trước một ngày lương', off, fn: () => {
          if (!hireHelper(g, d)) { toast('Không đủ tiền trả ngày lương đầu tiên.', 'bad', 'cash'); return; }
          toast(`${d.name} nhận làm phụ quầy. Từ nay khách chờ lâu hơn, quầy cũng sạch hơn.`, 'good', 'heart', true);
          ctx.npcs.say(n, 'Dạ con cảm ơn! Con làm liền.', 3, EXPR.joy);
          n.actor = 'helper'; n.state = 'actor'; n.path = []; n.pi = 0; n.vel = 0; n.onArrive = undefined; this.helper = n; this.offerNpc = null; this.helperChat = 25; this.helperTask[1] = { mode: 'idle', holdT: 0, wipeCd: 4, yaw: this.s.yaw };
        } },
        { t: 'Để hôm khác', fn: () => {
          ctx.npcs.say(n, rnd.pick(['Dạ thôi con đi nghen.', 'Vậy con xin phép.', 'Khi nào cần thì kêu con.']), 2.6, EXPR.pout);
          this.offerNpc = null; setTimeout(() => { if (n.state !== 'gone') ctx.npcs.leave(n); }, 1400);
        } },
      ],
    });
  }
  /** Trò chuyện với người phụ việc: hỏi chuyện, dặn dò, hoặc cho nghỉ. */
  talkHelper(slot: 1 | 2 = 1) {
    const g = ctx.g, h = slot === 2 ? g.help2 : g.help, n = slot === 2 ? this.helper2 : this.helper; if (!h) return;
    ctx.ui.dialog({
      who: `${h.name} — phục vụ`, npc: n ?? undefined, text: rnd.pick([
        `Dạ ${g.ac} cần con làm gì ạ?`, 'Con đang lau mấy cái bàn, khách tới là con tiếp liền.', `Quầy hôm nay ${g.led.customers ? `có ${g.led.customers} khách` : 'còn vắng'} ${g.ac} ơi.`,
      ]),
      opts: [
        { t: 'Hỏi chuyện bán buôn', fn: () => this.helperTalkSales(slot) },
        { t: 'Dặn khách chờ thì dỗ dành', fn: () => {
          if (n) ctx.npcs.say(n, 'Dạ con biết rồi, khách chờ con rót nước mời.', 3, EXPR.smile);
          g.st.mood = Math.min(STAT_MAX, g.st.mood + 2); toast('Dặn dò xong. Khách chờ sẽ được dỗ, quầy đỡ căng.', 'info', 'heart');
        } },
        { t: `Cho ${h.name} nghỉ việc`, fn: () => {
          const name = h.name; fireHelper(g, slot);
          if (n) { ctx.npcs.say(n, rnd.pick(['Dạ… con đi nghen.', 'Vậy con cảm ơn ' + g.ac + ' mấy bữa nay.', 'Thôi con về.']), 3, EXPR.sad); }
          toast(`${name} đã nghỉ việc.`, 'info', 'heart');
        } },
        { t: 'Thôi, làm việc đi', fn: () => { if (n) ctx.npcs.say(n, 'Dạ.', 1.6, EXPR.smile); } },
      ],
    });
  }
  private helperTalkSales(slot: 1 | 2 = 1) {
    const g = ctx.g, h = slot === 2 ? g.help2 : g.help, n = slot === 2 ? this.helper2 : this.helper; if (!h) return;
    const rev = g.led.revenue, cust = g.led.customers;
    const text = cust === 0 ? `Hôm nay chưa có khách nào ${g.ac} ơi. Hay mình dọn quầy rồi ra chợ sớm?`
      : rev >= 300000 ? `Hôm nay ${cust} khách, doanh thu ${money(rev)} — đắt lắm ${g.ac}! Con thấy mấy người quay lại lần hai.`
      : `Hôm nay ${cust} khách, được ${money(rev)}. Con thấy khách thích món của ${g.ac} lắm, chỉ ngại chờ hơi lâu.`;
    ctx.ui.dialog({ who: `${h.name} — phụ quầy`, npc: n ?? undefined, text, opts: [
      { t: `Lương ${money(h.wage)}/ngày, trả sáng mai`, sub: 'Con giữ đúng giá đó', fn: () => { if (n) ctx.npcs.say(n, 'Dạ con cảm ơn.', 2, EXPR.happy); } },
      { t: 'Thôi', fn: () => { if (n) ctx.npcs.say(n, 'Dạ, con ra tiếp khách.', 2, EXPR.normal); } },
    ] });
  }

  // ───────── nhân viên phụ bếp (Bậc 6: tối đa 2 phụ bếp trong phòng bếp riêng) ─────────
  private sousSpot(slot: 1 | 2 = 1, idx = 0): [number, number] {
    const s = this.s;
    const pts: [number, number][] = slot === 2
      ? [[-1.15, -0.92], [-2.15, -1.5], [-0.35, -0.92]]
      : [[1.35, -0.88], [0.45, -0.92], [1.65, -1.35]];
    const [lx, lz] = pts[idx % pts.length];
    return this.localPos(lx, lz);
  }
  private sousLook(h: Helper): Look {
    return { face: h.face, fem: h.fem, shirt: h.shirt, pants: h.pants, hair: h.hair, hat: 0, hairStyle: h.hairStyle, fat: 1.03, h: 0.98, skin: h.skin, bag: 0, hatCol: 0x2f6fb5, long: false, apron: 0x2f6fb5, shoe: 0x2a2a2e };
  }
  private updateSous(dt: number) {
    const g = ctx.g, s = g.stall, N = ctx.npcs;
    const stepOne = (slot: 1 | 2) => {
      const h = slot === 2 ? g.sous2 : g.sous;
      const cur = slot === 2 ? this.sous2 : this.sous;
      const want = !!h && isRestaurant(g) && s.where === 'placed' && s.open;
      if (cur && (!want || cur.state === 'gone')) {
        if (slot === 2) this.sous2 = null; else this.sous = null;
        if (cur.state !== 'gone') {
          this.sayLine(cur, `Con dọn bếp xong rồi ${g.ac} ơi, mai gặp lại.`, 2.4, EXPR.smile);
          N.leaveVia(cur, [this.localPos(2.85, -0.8), this.localPos(2.85, 0.4), this.localPos(2.85, 1.5), this.localPos(0, 1.5), this.localPos(0, 3.85), this.localPos(0, 5.15)]);
        }
      }
      if (want && !cur) {
        if (slot === 2) { this.sous2Retry -= dt; if (this.sous2Retry <= 0) { this.sous2Retry = 3; this.spawnSous(2); } }
        else { this.sousRetry -= dt; if (this.sousRetry <= 0) { this.sousRetry = 3; this.spawnSous(1); } }
      }
      const npc = slot === 2 ? this.sous2 : this.sous;
      if (!npc) return;
      npc.state = 'actor'; npc.timer = 1e9;
      const ph = this.sousPhase[slot];
      const canCook = menuOf(g).some((r) => available(g, r));
      if (!npc.path.length) {
        npc.yaw = s.yaw;
        ph.moveCd -= dt;
        if (ph.moveCd <= 0) {
          ph.moveCd = rnd.range(6, 10);
          ph.idx = (ph.idx + 1) % 3;
          const [nx, nz] = this.sousSpot(slot, ph.idx);
          this.staffMoveTo(npc, [[nx, nz]], () => { npc.yaw = s.yaw; npc.pose = canCook ? 'work' : 'idle'; });
        }
      }
      if (slot === 2) {
        if (!npc.path.length) npc.pose = this.sous2WorkAnim > 0 || canCook ? 'work' : 'idle';
        if (this.sous2WorkAnim > 0) this.sous2WorkAnim -= dt;
        this.sous2T -= dt;
        if (this.sous2T <= 0) {
          this.sous2T = 20;
          const res = sousWork(g);
          if (res) { this.sous2WorkAnim = 3.2; this.stockKey = ''; const rn = RECIPES[res.rid]?.short ?? res.rid; ctx.ui.float(res.kind === 'prep' ? `+${res.n} sơ chế ${rn}` : `+1 ${rn} sẵn`, npc, 'good'); }
        }
      } else {
        if (!npc.path.length) npc.pose = this.sousWorkAnim > 0 || canCook ? 'work' : 'idle';
        if (this.sousWorkAnim > 0) this.sousWorkAnim -= dt;
        this.sousT -= dt;
        if (this.sousT <= 0) {
          const cand = sousCandidate(g);
          this.sousT = 18 / (cand.speed || 1);
          const res = sousWork(g);
          if (res) { this.sousWorkAnim = 3.2; this.stockKey = ''; const rn = RECIPES[res.rid]?.short ?? res.rid; ctx.ui.float(res.kind === 'prep' ? `+${res.n} sơ chế ${rn}` : `+1 ${rn} sẵn`, npc, 'good'); }
        }
      }
    };
    stepOne(1); stepOne(2);
  }
  private spawnSous(slot: 1 | 2 = 1) {
    const g = ctx.g, h = slot === 2 ? g.sous2 : g.sous; if (!h) return;
    const [x, z] = this.sousSpot(slot, 0), n = ctx.npcs.spawnPed(this.s.x, this.s.z, 18, 34, ARCH.hangrong);
    if (!n) return;
    n.kind = 'actor'; n.actor = slot === 2 ? 'sous2' : 'sous'; n.name = h.name; n.fem = h.fem; n.rig.setLook(this.sousLook(h));
    n.rig.hold(null); n.path = []; n.pi = 0; n.vel = 0; n.onArrive = undefined;
    n.state = 'actor'; n.pose = 'work'; n.timer = 1e9; n.plan = []; n.base = EXPR.normal; n.greetT = 9999;
    n.x = x; n.z = z; n.y = groundY(x, z); n.yaw = this.s.yaw; n.rig.root.position.set(x, n.y, z); n.rig.root.rotation.y = n.yaw;
    this.sousPhase[slot] = { idx: 0, moveCd: slot === 2 ? 7 : 5 };
    if (slot === 2) this.sous2 = n; else this.sous = n;
    this.sayLine(n, `Phòng bếp sẵn sàng rồi ${g.ac}!`, 2.6, EXPR.happy);
  }
  talkSous(slot: 1 | 2 = 1) {
    const g = ctx.g, h = slot === 2 ? g.sous2 : g.sous, n = slot === 2 ? this.sous2 : this.sous; if (!h) return;
    const preps = g.stall.preps.reduce((a, p) => a + p.n, 0), ready = g.stall.ready.reduce((a, r) => a + r.n, 0);
    ctx.ui.dialog({
      who: `${h.name} — phụ bếp`, npc: n ?? undefined,
      text: `Trong bếp hiện có ${preps} phần sơ chế và ${ready} phần ra món sẵn. ${g.ac} cần con phụ gì nữa không?`,
      opts: [
        { t: 'Ưu tiên nấu nhanh thêm món', fn: () => {
          const res = sousWork(g);
          if (res) { if (slot === 2) this.sous2WorkAnim = 2.6; else this.sousWorkAnim = 2.6; this.stockKey = ''; const nm = RECIPES[res.rid]?.name.toLowerCase() ?? res.rid; if (n) ctx.npcs.say(n, `Xong ngay một phần ${nm} rồi ${g.ac}!`, 2.6, EXPR.happy); toast(`Phụ bếp ${h.name} vừa làm thêm ${nm}.`, 'good', 'dish'); }
          else { if (n) ctx.npcs.say(n, `Bếp đang đủ đồ sẵn hoặc thiếu nguyên liệu/nhiên liệu rồi ${g.ac} ơi.`, 2.8, EXPR.normal); }
        } },
        { t: `Cho ${h.name} nghỉ việc`, fn: () => {
          if (slot === 2) g.sous2 = null; else { g.sous = g.sous2 ?? null; g.sous2 = null; }
          if (n) ctx.npcs.say(n, `Dạ, vậy con xin phép nghỉ nghen ${g.ac}.`, 2.6, EXPR.sad);
          toast(`Phụ bếp ${h.name} đã nghỉ.`, 'info', 'heart');
        } },
        { t: 'Cứ làm tiếp đi', fn: () => { if (n) ctx.npcs.say(n, 'Dạ, để con lo bếp!', 1.8, EXPR.smile); } },
      ],
    });
  }

  // ───────── nhân vật sự kiện ─────────
  private onEvent(id: string, on: boolean) {
    const e = EVENTS[id]; if (!e) return;
    if (e.roadblock) {
      const ks = [edgeKey(CORNER['01NE'].id, CORNER['11NW'].id), edgeKey(CORNER['01SE'].id, CORNER['11SW'].id)];
      for (const k of ks) on ? NAV_BLOCK.add(k) : NAV_BLOCK.delete(k); ctx.city.roadblock.visible = on;
    }
    if (on && e.actor && this.s.where === 'placed') { this.actorId = e.actor; this.actorT = rnd.range(6, 18); this.actorTries = 0; }
  }
  private spawnActor() {
    const s = this.s, id = this.actorId, N = ctx.npcs; this.actorId = '';
    if (s.where !== 'placed') return;
    const defs: Record<string, [keyof typeof ARCH, string]> = { inspector: ['congan', 'Thanh tra Vệ sinh'], critic: ['phebinh', 'Nhà phê bình ẩm thực'], gang: ['giangho', 'Đàn em Hùng Sẹo'], rowdy: ['taixe', 'Ông khách say xỉn'], vip: ['nhagiau', 'Vị khách sang trọng'], credit: ['congnhan', 'Khách quen'] };
    const d = defs[id]; if (!d) return;
    let n: Npc | null;
    if (id === 'credit') { const cand = REGULARS.filter((r) => (ctx.g.rel[r.id]?.n ?? 0) > 0); const reg = rnd.pick(cand.length ? cand : REGULARS); n = N.spawnActor(reg.arch, reg.name, id, s.x, s.z, reg.fem); if (n) n.regular = reg; }
    else n = N.spawnActor(d[0], d[1], id, s.x, s.z);
    // Chưa tìm được chỗ xuất hiện khuất tầm mắt → lát nữa thử lại, đừng để sự kiện trôi qua mà không ai tới.
    if (!n) { if (++this.actorTries < 30) { this.actorId = id; this.actorT = 1.5; } return; }
    if (id === 'critic' || id === 'vip') { n.persona = { arch: n.arch, budget: 300000, noise: 1.1 }; }
    n.state = 'actor'; n.slot = this.freeSlot(); this.customers.push(n); if (id === 'rowdy' || id === 'gang') n.base = 4;
    N.gotoPath(n, this.entryWaypoints(n.slot, stallQueueCap(ctx.g), n.x, n.z), (c) => this.arrived(c));
  }
  private actorTalk(n: Npc) {
    const g = ctx.g, s = g.stall, ui = ctx.ui, N = ctx.npcs, done = (happy = false) => this.dismiss(n, happy), R = rnd;
    const bad = s.store.some((x) => x.fresh < 35 && INGS[x.id].shelf < 9000);
    switch (n.actor) {
      case 'inspector': {
        const clean = g.st.hygiene >= 45 && s.dirt < 40 && !bad;
        if (clean) { ui.dialog({ who: who(n), npc: n, text: 'Đoàn kiểm tra vệ sinh an toàn thực phẩm đây. …Ừm, quầy sạch sẽ, nguyên liệu tươi, người bán gọn gàng. Tốt lắm, cứ thế phát huy!', opts: [{ t: 'Dạ, cảm ơn anh.', fn: () => { g.rep = clamp(g.rep + 2, 0, 100); toast('Qua kiểm tra vệ sinh: uy tín +2.', 'good', 'badge'); done(true); } }] }); break; }
        const fine = round1k(50000 + s.dirt * 600 + (bad ? 50000 : 0) + (g.st.hygiene < 30 ? 30000 : 0));
        const why = [s.dirt >= 40 ? 'quầy bẩn' : '', bad ? 'có nguyên liệu ôi' : '', g.st.hygiene < 45 ? 'người bán lem luốc' : ''].filter(Boolean).join(', ');
        n.base = 3; ui.dialog({ who: who(n), npc: n, text: `Kiểm tra vệ sinh an toàn thực phẩm. Tôi thấy ${why}. Lập biên bản phạt ${money(fine)}.`, opts: [
          { t: `Nộp phạt ${money(fine)}`, off: g.cash < fine, fn: () => { spend(g, fine, 'fees'); s.dirt = Math.max(0, s.dirt - 10); toast(`Nộp phạt ${money(fine)}.`, 'bad', 'badge'); done(); } },
          { t: 'Năn nỉ xin giảm', sub: 'Uy tín cao và ăn nói vui vẻ thì dễ được châm chước', fn: () => { if (R.chance(clamp(0.3 + g.rep / 150 + (g.st.mood - 50) / 200, 0.1, 0.8))) { const f = round1k(fine * 0.3); spend(g, Math.min(f, g.cash), 'fees'); N.say(n, 'Thôi được, lần đầu tôi nhắc nhở. Phạt nhẹ thôi, lần sau dọn cho sạch.', 3.5); toast(`Được giảm, chỉ nộp ${money(Math.min(f, g.cash))}.`, 'info', 'badge'); } else { spend(g, Math.min(fine, g.cash), 'fees'); N.say(n, 'Không xin xỏ gì hết. Nộp phạt!', 3, 4); toast(`Vẫn phải nộp ${money(Math.min(fine, g.cash))}.`, 'bad', 'badge'); } setTimeout(done, 1600); } },
          { t: 'Dúi 30.000₫ "cà phê"', sub: 'Rủi ro: bị bắt quả tang thì phạt gấp đôi', off: g.cash < 30000, fn: () => { if (R.chance(0.55)) { spend(g, 30000, 'fees'); N.say(n, 'E hèm… lần sau chú ý nhé.', 3); toast('Thoát phạt, tốn 30.000₫.', 'info', 'badge'); } else { const f = Math.min(g.cash, fine * 2); spend(g, f, 'fees'); g.rep = clamp(g.rep - 3, 0, 100); this.close(); N.say(n, 'Hối lộ người thi hành công vụ à? Phạt gấp đôi, đình chỉ bán hôm nay!', 3.5, 4); toast(`Bị phạt ${money(f)}, đình chỉ bán, uy tín −3.`, 'bad', 'badge', true); } setTimeout(done, 1800); } },
          { t: 'Không có tiền…', off: g.cash >= fine, fn: () => { this.close(); toast('Không nộp được phạt: bị đình chỉ bán hôm nay.', 'bad', 'badge'); done(); } }] });
        break;
      }
      case 'gang': {
        const fee = g.rep > 40 ? 60000 : 40000;
        ui.dialog({ who: who(n), npc: n, text: `Ê, bán ở khu này phải biết luật. Đại ca Hùng Sẹo thu ${money(fee)} "phí bảo kê". Đưa đây!`, opts: [
          { t: `Đưa ${money(fee)}`, off: g.cash < fee, fn: () => { spend(g, fee, 'fees'); g.flags.gangPaid = g.day + 2; N.say(n, 'Biết điều đó. Ba bữa nữa tụi tao ghé.', 3); toast('Đã nộp tiền bảo kê, yên thân được 3 ngày.', 'info', 'skull'); setTimeout(done, 1500); } },
          { t: 'Xin khất tới mai', sub: 'Chỉ được một lần', off: !!g.flags.gangDefer && g.flags.gangDefer >= g.day - 3, fn: () => { g.flags.gangDefer = g.day; g.flags.gangPaid = g.day; N.say(n, 'Mai mà không có là dẹp quầy nghe chưa!', 3, 4); setTimeout(done, 1500); } },
          { t: 'Không đưa!', sub: 'Có thể bị đập quầy', fn: () => { if (R.chance(0.5)) { n.pose = 'work'; s.cond = clamp(s.cond - 35, 0, 100); const lost = s.ready.reduce((a, x) => a + x.n * x.cost, 0); s.ready = []; g.led.loss += lost; g.st.health = clamp(g.st.health - 10, 5, STAT_MAX); g.st.mood = clamp(g.st.mood - 12, 0, STAT_MAX); N.say(n, 'Cứng đầu hả? Đập!', 2.5, 4); sfx('crash'); toast('Bọn chúng đập quầy! Quầy hư hại nặng, đồ làm sẵn đổ hết.', 'bad', 'skull', true); this.builtKey = ''; } else { g.rep = clamp(g.rep + 1, 0, 100); g.flags.gangPaid = g.day; N.say(n, 'Được… mày giỏi. Cứ chờ đó.', 3, 4); toast('Chúng bỏ đi — lần này thôi. Bà con trong hẻm nể bạn hơn.', 'good', 'skull'); } setTimeout(done, 1600); } }] });
        break;
      }
      case 'rowdy': {
        n.pose = 'angry'; this.rowdy = 70; const tea = RECIPES.tra_da && readyCount(g, 'tra_da') + finishPossible(g, RECIPES.tra_da) > 0 && g.rec.tra_da.on;
        ui.dialog({ who: who(n), npc: n, text: 'Ê… hức… bán cái gì đây? Đồ ăn gì mà… hức… dở ẹc! Tao nói cho cả phố biết!', opts: [
          { t: 'Mời ly trà đá giải rượu', off: !tea, sub: tea ? 'Tốn một ly trà đá' : 'Quầy không có trà đá', fn: () => { this.rowdy = 0; n.pose = 'drink'; n.rig.hold(cupProp()); n.rig.inner.rotation.z = 0; n.base = 1; g.rep = clamp(g.rep + 0.5, 0, 100); if (readyCount(g, 'tra_da') > 0) { const rd = s.ready.find((x) => x.rid === 'tra_da')!; rd.n--; s.ready = s.ready.filter((x) => x.n > 0); } N.say(n, 'Ờ… mát ghê. Xin lỗi nha, tui xỉn quá.', 3, 1); toast('Ông khách dịu lại rồi bỏ đi. Khách xung quanh khen bạn khéo.', 'good'); setTimeout(() => done(true), 1800); } },
          { t: 'Lớn tiếng đuổi đi', fn: () => { if (R.chance(0.6)) { this.rowdy = 0; N.say(n, 'Đi thì đi! Làm gì dữ vậy…', 2.5, 5); } else { n.pose = 'work'; const lost = s.ready.reduce((a, x) => a + x.n * x.cost, 0); s.ready = []; g.led.loss += lost; g.st.mood = clamp(g.st.mood - 10, 0, STAT_MAX); this.rowdy = 0; sfx('crash'); N.say(n, 'Dám đuổi tao hả!', 2.5, 4); toast('Ông ta hất đổ đồ ăn làm sẵn rồi mới chịu đi.', 'bad'); } setTimeout(done, 1600); } },
          { t: 'Mặc kệ ông ta', sub: 'Khách sẽ ngại ghé một lúc', fn: () => { N.say(n, 'Hức… bán với chả buôn…', 3, 4); setTimeout(done, 45000); } }] });
        break;
      }
      case 'credit': {
        const r = menuOf(g).find((x) => available(g, x)), reg = n.regular!;
        if (!r) { done(); break; }
        n.base = 5; ui.dialog({ who: who(n), npc: n, text: `${g.ac === 'anh' ? 'Anh' : 'Chị'} Hai ơi… tháng này tui kẹt quá, lương chưa về. Cho tui ăn chịu một phần ${r.name.toLowerCase()} được không? Có tiền tui trả liền.`, opts: [
          { t: 'Cho ăn chịu', sub: 'Phần lớn sẽ quay lại trả, có khi trả hậu', fn: () => { if (this.giveFree(r)) { changeRel(g, reg.id, 15); (g.rel[reg.id] ??= { v: 0, n: 0, last: -1 }).owe = g.rec[r.id].price; g.flags['owe_' + reg.id] = g.day + R.int(1, 2); N.say(n, 'Cảm ơn nhiều lắm! Tui không quên ơn đâu.', 3, 1); n.rig.hold(takeawayBag()); } setTimeout(() => done(true), 1600); } },
          { t: 'Tặng luôn, khỏi trả', fn: () => { if (this.giveFree(r)) { changeRel(g, reg.id, 22); g.st.mood = clamp(g.st.mood + 6, 0, STAT_MAX); g.rep = clamp(g.rep + 0.6, 0, 100); N.say(n, 'Trời ơi, quý hoá quá! Tui sẽ kêu cả xóm tới ủng hộ.', 3.2, 2); n.rig.hold(takeawayBag()); } setTimeout(() => done(true), 1600); } },
          { t: 'Từ chối khéo', fn: () => { changeRel(g, reg.id, -4); N.say(n, 'Ừ… tui hiểu mà. Buôn bán cũng khó.', 3, 5); setTimeout(done, 1500); } }] });
        break;
      }
      default: done();
    }
  }
  /** Lấy một phần ăn không tính tiền (cho/tặng). */
  private giveFree(r: RecipeDef): boolean {
    const g = ctx.g, s = g.stall, rd = s.ready.find((x) => x.rid === r.id);
    if (rd) { rd.n--; g.led.loss += rd.cost; s.ready = s.ready.filter((x) => x.n > 0); return true; }
    toast(`Chưa có sẵn ${r.name} — hãy làm trước rồi đưa sau.`, 'warn'); return false;
  }

  update(dt: number) {
    const g = ctx.g, s = g.stall, N = ctx.npcs;
    this.rebuild(); this.stockT -= dt; if (this.stockT <= 0) { this.stockT = 0.5; this.rebuildStock(); }
    // vòng đánh dấu chỗ bán khi đang mang quầy
    const carrying = s.where === 'carried'; this.marks.forEach((m, i) => { m.visible = carrying && dist2(SPOTS[i].x, SPOTS[i].z, ctx.player.x, ctx.player.z) < 60 * 60; if (m.visible) m.scale.setScalar(1 + Math.sin(ctx.time * 3) * 0.05); });
    if (s.where !== 'placed') { if (this.customers.length) for (const n of this.customers.slice()) this.dismiss(n, false); return; }
    // người chơi đi quá xa → khách không chờ
    const away = dist2(ctx.player.x, ctx.player.z, s.x, s.z) > 12 * 12;
    if (s.open) {
      const crowdSlow = 1 / (1 + Math.max(0, this.customers.length - 3) * 0.35);
      const perSec = (arrivalRate(g) * MIN_PER_SEC) / 60 * (this.rowdy > 0 ? 0.3 : 1) * (away ? 0 : 1) * crowdSlow;
      this.acc += perSec * dt * rnd.range(0.4, 1.6);
      const naturalCap = seatCount(g) > 0 ? Math.min(stallQueueCap(g), seatCount(g) + 2) : Math.min(stallQueueCap(g), 7);
      if (this.acc >= 1 && this.customers.length < naturalCap && ctx.mode !== 'sleep') {
        this.acc = 0;
        // khách quen ghé đúng giờ của họ
        const h = hourOf(g), reg = REGULARS.find((r) => Math.abs(h - r.hour) < 1.4 && (g.rel[r.id]?.last ?? -1) !== g.day && !this.customers.some((c) => c.regular === r) && rnd.chance(0.22 + (g.rel[r.id]?.v ?? 0) / 110 + g.rep / 300));
        // Nhà hàng bình dân (bậc 6): đón khách đoàn 3–4 người khi còn đủ bàn trống (chừa chỗ cho bàn đặt trước sắp tới).
        const freeN = seatCount(g) - this.customers.filter((c) => this.seated(c.slot)).length - reservedSeats(g);
        const wantGroup = isRestaurant(g) && !reg && freeN >= 3 && (naturalCap - this.customers.length) >= 3 && rnd.chance(0.24);
        const ok = wantGroup ? this.sendGroup(freeN >= 4 && (naturalCap - this.customers.length) >= 4 && rnd.chance(0.45) ? 4 : 3) : !!this.send(reg);
        if (!ok) this.acc = 0.85;   // chưa có ai quanh đây để ghé → thử lại sớm, không bỏ mất lượt khách
      } else if (this.acc > 1.5) this.acc = 1.5;
      if (away && this.customers.length === 0 && dist2(ctx.player.x, ctx.player.z, s.x, s.z) > 40 * 40) { this.close(true); toast('Bạn đi xa quá nên quầy tạm ngưng bán.', 'warn', 'shop'); }
    }
    if (this.rowdy > 0) this.rowdy -= dt;
    this.updateHelper(dt);
    this.updateSous(dt);
    if (isRestaurant(g)) {
      this.expireT -= dt;
      if (this.expireT <= 0) {
        this.expireT = 12;
        for (const m of expireBookings(g)) toast(`Lỡ hẹn bàn đặt trước của ${m.name} (${m.size} người) — uy tín −0.5.`, 'bad', 'clock');
      }
      if (s.open) {
        const due = dueBooking(g);
        if (due && this.freeSeats(due.size).length >= due.size) this.sendGroup(due.size, due);
        this.bookT -= dt;
        if (this.bookT <= 0) {
          this.bookT = rnd.range(85, 135);
          const pendingCnt = g.bookings.filter((b) => b.status === 'pending' || b.status === 'accepted').length;
          if (pendingCnt < 2) {
            const b = createBooking(g);
            if (b) {
              const hh = Math.floor(b.hour), mm = Math.round((b.hour - hh) * 60);
              const hm = `${hh}h${mm ? String(mm).padStart(2, '0') : ''}`;
              toast(`Có khách đặt bàn trước: ${b.name} (${b.size} người, ${b.day > g.day ? 'ngày mai ' : ''}${hm}) — mở Quầy › Nhân sự & Đặt bàn để nhận!`, 'info', 'star');
            }
          }
        }
      }
    }
    if (this.actorId) { this.actorT -= dt; if (this.actorT <= 0) this.spawnActor(); }
    // khách quen trả nợ
    this.regT -= dt; if (this.regT <= 0) { this.regT = 20; for (const r of REGULARS) { const due = g.flags['owe_' + r.id], rel = g.rel[r.id]; if (due !== undefined && g.day >= due && rel?.owe && s.open) { delete g.flags['owe_' + r.id]; if (rnd.chance(0.75)) { const pay = round1k(rel.owe * rnd.range(1, 1.6)); earn(g, pay, 'revenue'); toast(`${r.name} ghé trả ${money(pay)} tiền ăn chịu hôm trước. "Cảm ơn ${g.ac} đã thương!"`, 'good', 'heart', true); changeRel(g, r.id, 5); } else toast(`Nghe nói ${r.name} đã chuyển đi nơi khác… khoản ăn chịu coi như mất.`, 'bad', 'heart'); rel.owe = 0; } } }
    // sự kiên nhẫn của khách đang chờ
    for (const n of this.customers.slice()) {
      if (n.state !== 'queue' || !n.order) continue;
      n.waited += dt * (this.busy === n ? 0.35 : 1) * (away ? 2.5 : 1);
      const f = n.waited / n.patience; ctx.ui.patience(n, 1 - f);
      if (f > 0.55 && !n.data?.warn) { n.data = { warn: 1 }; N.say(n, LINES.wait[(n.id + g.day) % LINES.wait.length].replace('{you}', n.arch.you.replace('{ac}', g.ac)).replace('{Self}', n.arch.self[n.fem ? 1 : 0]).replace('{self}', n.arch.self[n.fem ? 1 : 0]), 2.4, 3); n.base = 3; }
      if (f >= 1 && this.busy !== n) { const a = n.arch, line = rnd.pick(LINES.leave_wait).replace('{self}', a.self[n.fem ? 1 : 0]); N.say(n, line, 2.6, 4); sfx('boo'); lostCustomer(g, 'wait'); if (n.regular) changeRel(g, n.regular.id, -4); this.dismiss(n, false); n.base = 4; }
    }
  }
  /** Nạp lại sau khi tải save. */
  reset() { for (const n of this.customers.slice()) this.dismiss(n, false); this.builtKey = ''; this.stockKey = ''; this.busy = null; this.actorId = ''; this.rowdy = 0; this.helper = null; this.helper2 = null; this.helperTask = { 1: { mode: 'idle', holdT: 0, wipeCd: 8, yaw: 0 }, 2: { mode: 'idle', holdT: 0, wipeCd: 14, yaw: 0 } }; this.sous = null; this.sous2 = null; this.sousPhase = { 1: { idx: 0, moveCd: 7 }, 2: { idx: 0, moveCd: 9 } }; this.offerNpc = null; this.offerT = 45; this.sousT = 18; this.sous2T = 22; this.bookT = 45; ctx.city.roadblock.visible = eventOn(ctx.g, 'cam_duong'); NAV_BLOCK.clear(); if (eventOn(ctx.g, 'cam_duong')) this.onEvent('cam_duong', true); }
  refresh() { this.builtKey = ''; this.stockKey = ''; }
}
export function stallHint(g: Game, stowed = false): string {
  const s = g.stall; if (s.tier === 0) return 'Chưa có quầy';
  return s.where === 'carried' ? (s.tier >= 3 ? 'Chưa chọn chỗ đặt' : stowed ? 'Cất trong ba lô' : 'Đang mang theo') : s.where === 'home' ? 'Để ở chỗ ở' : s.open ? 'Đang mở bán' : 'Đã đặt, chưa mở';
}
export { level, canSell, stallRoom, addStack, absMin };
