// Bố cục thành phố — dữ liệu thuần (không Three.js): ô phố, lô nhà, địa điểm, chỗ bán hàng, đồ thị đường đi của NPC.
// Thành phố gồm 3×3 ô phố, mỗi ô 46 m, ngăn bởi các tuyến đường rộng 13 m (lòng đường 7 m + 2 vỉa hè 3 m).
import { RNG, dist } from '../core/util';

export const BLOCK = 46, DEPTH = 11, SIDEWALK = 3, ROAD_HALF = 3.5;
export const CORR = [-88.5, -29.5, 29.5, 88.5];               // tâm các tuyến đường (cả hai trục)
export const BX: [number, number][] = [[-82, -36], [-23, 23], [36, 82]];
export const MAP = { x0: -96, x1: 96, z0: -96, z1: 108 };
export const RING = 2.0;                                       // NPC đi cách mép nhà 2 m
export const CURB = 0.12;

export type District = 'vanphong' | 'nhagiau' | 'congvien' | 'cho' | 'trungtam' | 'dancu' | 'laodong' | 'nhanghi' | 'khobai' | 'gamcau';
export const DISTRICT: Record<District, { name: string; wealth: number; safety: number; gang: boolean }> = {
  vanphong: { name: 'Phố Văn Phòng', wealth: 1.5, safety: 0.95, gang: false },
  nhagiau: { name: 'Khu Căn Hộ', wealth: 1.7, safety: 0.95, gang: false },
  congvien: { name: 'Công Viên Hoa Phượng', wealth: 1.1, safety: 0.7, gang: false },
  cho: { name: 'Chợ Xóm Chiều', wealth: 0.9, safety: 0.75, gang: false },
  trungtam: { name: 'Phố Trung Tâm', wealth: 1.1, safety: 0.85, gang: false },
  dancu: { name: 'Khu Dân Cư', wealth: 1.0, safety: 0.85, gang: false },
  laodong: { name: 'Xóm Lao Động', wealth: 0.6, safety: 0.45, gang: true },
  nhanghi: { name: 'Phố Bến Xe', wealth: 0.7, safety: 0.5, gang: true },
  khobai: { name: 'Khu Kho Bãi', wealth: 0.7, safety: 0.6, gang: false },
  gamcau: { name: 'Gầm Cầu Vượt', wealth: 0.3, safety: 0.3, gang: false },
};
const BLOCK_DISTRICT: District[][] = [ // [bz][bx]
  ['vanphong', 'nhagiau', 'congvien'],
  ['cho', 'trungtam', 'dancu'],
  ['laodong', 'nhanghi', 'khobai'],
];
export function districtAt(x: number, z: number): District {
  if (z > 93) return 'gamcau';
  const ix = x < -29.5 ? 0 : x < 29.5 ? 1 : 2, iz = z < -29.5 ? 0 : z < 29.5 ? 1 : 2;
  return BLOCK_DISTRICT[iz][ix];
}
export function isRoad(x: number, z: number): boolean {
  if (z > 95 || Math.abs(x) > 125 || z < -125) return false;
  for (const c of CORR) { if (Math.abs(x - c) < ROAD_HALF && z < 92) return true; if (Math.abs(z - c) < ROAD_HALF) return true; }
  return false;
}
export const groundY = (x: number, z: number) => (isRoad(x, z) ? 0 : CURB);

// ───────── Mặt tiền ô phố & hệ toạ độ cục bộ ─────────
// Trong hệ cục bộ của một mặt tiền: x chạy dọc mặt tiền, z=0 là mép nhà, z>0 đi sâu vào trong ô, z<0 là vỉa hè.
export type Face = 'N' | 'S' | 'E' | 'W';
export interface Frame { tx: number; tz: number; yaw: number; }
export function faceFrame(bx: number, bz: number, f: Face): Frame {
  const [x0, x1] = BX[bx], [z0, z1] = BX[bz];
  switch (f) {
    case 'N': return { tx: x0, tz: z0, yaw: 0 };
    case 'S': return { tx: x1, tz: z1, yaw: Math.PI };
    case 'E': return { tx: x1, tz: z0 + DEPTH, yaw: -Math.PI / 2 };
    case 'W': return { tx: x0, tz: z1 - DEPTH, yaw: Math.PI / 2 };
  }
}
export function toWorld(fr: Frame, lx: number, lz: number): [number, number] {
  const c = Math.cos(fr.yaw), s = Math.sin(fr.yaw);
  return [fr.tx + lx * c + lz * s, fr.tz - lx * s + lz * c];
}
/** Hướng nhìn (yaw của nhân vật, +z cục bộ = mặt) để quay mặt RA đường từ một mặt tiền. */
export const faceOutYaw = (fr: Frame) => fr.yaw + Math.PI;

export type Style = 'office' | 'rich' | 'mid' | 'poor' | 'ware';
export type LotKind = 'house' | 'alley' | 'minimart' | 'equip' | 'eatery' | 'bank' | 'hotel' | 'tro' | 'kiosk' | 'scrap' | 'site' | 'motel'
  | 'pawn' | 'cafe' | 'temple' | 'depot' | 'school' | 'spot' | 'pharmacy' | 'tower' | 'apartment'
  | 'canho' | 'nharieng' | 'cuahang' | 'hospital';
export interface Lot { bx: number; bz: number; face: Face; at: number; w: number; d: number; kind: LotKind; style: Style; fr: Frame; seed: number; id?: string; district: District; }

interface Special { at: number; w: number; kind: LotKind; id?: string; d?: number; }
const SPECIALS: Record<string, Special[]> = {
  // Phố văn phòng (TB)
  '00S': [{ at: 8, w: 12, kind: 'bank', id: 'bank' }, { at: 29, w: 6, kind: 'spot', id: 'vp' }],
  '00E': [{ at: 5, w: 14, kind: 'hotel', id: 'hotel' }],
  // Khu căn hộ (B)
  '10S': [{ at: 16, w: 10, kind: 'cafe', id: 'cafe' }, { at: 26, w: 12, kind: 'canho', id: 'canho' }],
  // Phố trung tâm (giữa)
  '11S': [{ at: 4, w: 14, kind: 'minimart', id: 'minimart' }, { at: 18, w: 12, kind: 'cuahang', id: 'cuahang' }, { at: 30, w: 5.5, kind: 'pharmacy', id: 'pharmacy' }, { at: 35.5, w: 10.5, kind: 'hospital', id: 'hospital' }],
  '11W': [{ at: 0, w: 10, kind: 'equip', id: 'equip' }, { at: 10, w: 2.4, kind: 'alley' }],
  '11N': [{ at: 6, w: 12, kind: 'eatery', id: 'eatery' }],
  '11E': [{ at: 11, w: 2.4, kind: 'alley' }],
  // Khu dân cư (Đ)
  '21N': [{ at: 8, w: 30, kind: 'school', id: 'school' }],
  '21W': [{ at: 6, w: 11, kind: 'tro', id: 'tro' }],
  '21S': [{ at: 12, w: 12, kind: 'nharieng', id: 'nharieng' }],
  // Xóm lao động (TN)
  '02E': [{ at: 2, w: 6, kind: 'kiosk', id: 'kiosk' }, { at: 8, w: 2.4, kind: 'alley' }, { at: 14, w: 6, kind: 'spot', id: 'hem' }],
  '02S': [{ at: 14, w: 16, kind: 'scrap', id: 'scrap' }],
  '02N': [{ at: 26, w: 16, kind: 'site', id: 'site' }, { at: 12, w: 2.4, kind: 'alley' }],
  '02W': [{ at: 11, w: 2.4, kind: 'alley' }],
  // Phố bến xe (N)
  '12N': [{ at: 5, w: 13, kind: 'motel', id: 'motel' }, { at: 30, w: 2.4, kind: 'alley' }],
  '12W': [{ at: 8, w: 8, kind: 'pawn', id: 'pawn' }],
  '12E': [{ at: 7, w: 10, kind: 'cafe', id: 'bongda' }],
  '12S': [{ at: 21, w: 2.4, kind: 'alley' }],
  // Kho bãi (ĐN)
  '22N': [{ at: 6, w: 18, kind: 'temple', id: 'temple' }],
  '22W': [{ at: 5, w: 12, kind: 'depot', id: 'depot' }],
};
const BLOCK_STYLE: Style[][] = [
  ['office', 'rich', 'mid'],
  ['mid', 'mid', 'mid'],
  ['poor', 'poor', 'ware'],
];

export const LOTS: Lot[] = [];
(function planLots() {
  const R = new RNG(20261113);
  for (let bz = 0; bz < 3; bz++) for (let bx = 0; bx < 3; bx++) {
    if ((bx === 2 && bz === 0) || (bx === 0 && bz === 1)) continue; // công viên & chợ dựng riêng
    const style = BLOCK_STYLE[bz][bx], district = BLOCK_DISTRICT[bz][bx];
    for (const face of ['N', 'S', 'E', 'W'] as Face[]) {
      const len = face === 'N' || face === 'S' ? BLOCK : BLOCK - 2 * DEPTH;
      const sp = (SPECIALS[`${bx}${bz}${face}`] ?? []).slice().sort((a, b) => a.at - b.at);
      const fr = faceFrame(bx, bz, face);
      let x = 0, si = 0;
      const [wmin, wmax] = style === 'office' ? [9, 13] : style === 'rich' ? [6.5, 9] : style === 'ware' ? [9, 14] : style === 'poor' ? [3.8, 5.2] : [4.4, 6.2];
      while (x < len - 0.01) {
        const next = si < sp.length ? sp[si] : null;
        if (next && x >= next.at - 0.01) {
          LOTS.push({ bx, bz, face, at: next.at, w: next.w, d: next.d ?? DEPTH, kind: next.kind, style, fr, seed: R.int(1, 1e9), id: next.id, district });
          x = next.at + next.w; si++; continue;
        }
        const limit = next ? next.at : len, room = limit - x;
        let w = R.range(wmin, wmax);
        if (room < wmin * 1.6) w = room; else if (room - w < wmin * 0.8) w = room / 2;
        const kind: LotKind = style === 'office' ? 'tower' : style === 'rich' && w > 7.5 ? 'apartment' : 'house';
        LOTS.push({ bx, bz, face, at: x, w, d: DEPTH, kind, style, fr, seed: R.int(1, 1e9), district });
        x += w;
      }
    }
  }
})();
export const lotById = (id: string) => LOTS.find((l) => l.id === id)!;
/** Điểm thế giới của toạ độ cục bộ trong một lô (lx tính từ mép trái lô). */
export function lotPoint(l: Lot, lx: number, lz: number): [number, number] { return toWorld(l.fr, l.at + lx, lz); }

// ───────── Chỗ bán hàng ─────────
export interface Spot { id: string; name: string; x: number; z: number; yaw: number; fee: number; traffic: number; district: District; minTier: number; note: string; }
function spotFromLot(id: string, name: string, fee: number, traffic: number, minTier: number, note: string): Spot {
  const l = lotById(id), [x, z] = lotPoint(l, l.w / 2, 0.95);
  return { id, name, x, z, yaw: faceOutYaw(l.fr), fee, traffic, district: l.district, minTier, note };
}
export const SPOTS: Spot[] = [
  spotFromLot('hem', 'Hẻm Công Nhân', 0, 0.85, 1, 'Miễn phí, khách bình dân. Đất của băng Hùng Sẹo.'),
  { id: 'cho', name: 'Cổng Chợ', x: -37.2, z: 9, yaw: Math.PI / 2, fee: 30000, traffic: 1.35, district: 'cho', minTier: 1, note: 'Đông người qua lại, hay bị kiểm tra.' },
  { id: 'cv', name: 'Cổng Công Viên', x: 41, z: -37.3, yaw: 0, fee: 20000, traffic: 1.05, district: 'congvien', minTier: 1, note: 'Gia đình, sinh viên, khách du lịch.' },
  spotFromLot('vp', 'Phố Văn Phòng', 60000, 1.25, 2, 'Khách chịu chi nhưng khó tính. Cần xe đẩy trở lên.'),
];
export const spotById = (id: string) => SPOTS.find((s) => s.id === id);

// ───────── Điểm mốc cố định ─────────
export const PLACES = {
  camp: { x: 49, z: 101.5 },             // gầm cầu — nơi bắt đầu
  marketGate: { x: -36.5, z: 0 },
  marketCenter: { x: -59, z: 0 },
  dock: { x: -79, z: -3.6 },
  parkCenter: { x: 59, z: -59 },
  parkGateS: { x: 59, z: -36 },
  parkGateW: { x: 36, z: -59 },
};

// ───────── Đồ thị đường đi cho NPC ─────────
export interface NavNode { id: number; x: number; z: number; e: number[]; tag?: string; lot?: Lot; door?: [number, number]; district: District; }
export const NAV: NavNode[] = [];
export const TAGS = new Map<string, number[]>();
function addNode(x: number, z: number, tag?: string): NavNode {
  const n: NavNode = { id: NAV.length, x, z, e: [], tag, district: districtAt(x, z) };
  NAV.push(n);
  if (tag) (TAGS.get(tag) ?? TAGS.set(tag, []).get(tag)!).push(n.id);
  return n;
}
function link(a: NavNode, b: NavNode) { if (a === b) return; if (!a.e.includes(b.id)) a.e.push(b.id); if (!b.e.includes(a.id)) b.e.push(a.id); }
export const nodesByTag = (tag: string) => TAGS.get(tag) ?? [];

export const MARKET_COLS = [-44, -52, -60, -68];
const corner: Record<string, NavNode> = {};
export const CORNER = corner;
/** Các cạnh đang bị chặn (sự kiện cấm đường). */
export const NAV_BLOCK = new Set<number>();
export const edgeKey = (a: number, b: number) => (a < b ? a * 4096 + b : b * 4096 + a);
(function buildNav() {
  for (let bz = 0; bz < 3; bz++) for (let bx = 0; bx < 3; bx++) {
    const [x0, x1] = BX[bx], [z0, z1] = BX[bz];
    // các điểm trên vành vỉa hè, theo tham số s chạy quanh ô
    const pts: { s: number; n: NavNode }[] = [];
    const W = BLOCK + 2 * RING, per = 4 * W;
    const at = (s: number): [number, number] => {
      s = ((s % per) + per) % per;
      if (s < W) return [x0 - RING + s, z0 - RING];                 // cạnh Bắc: T→Đ
      if (s < 2 * W) return [x1 + RING, z0 - RING + (s - W)];        // cạnh Đông: B→N
      if (s < 3 * W) return [x1 + RING - (s - 2 * W), z1 + RING];    // cạnh Nam: Đ→T
      return [x0 - RING, z1 + RING - (s - 3 * W)];                   // cạnh Tây: N→B
    };
    const names = ['NW', 'NE', 'SE', 'SW'];
    for (let k = 0; k < 4; k++) { const [x, z] = at(k * W); const n = addNode(x, z); corner[`${bx}${bz}${names[k]}`] = n; pts.push({ s: k * W, n }); }
    for (let k = 0; k < 4; k++) { const [x, z] = at(k * W + W / 2); pts.push({ s: k * W + W / 2, n: addNode(x, z, `mid${bx}${bz}`) }); }
    // cửa của từng lô
    for (const l of LOTS) {
      if (l.bx !== bx || l.bz !== bz) continue;
      const lx = l.at + l.w / 2;
      let s: number;
      if (l.face === 'N') s = RING + lx; else if (l.face === 'E') s = W + RING + DEPTH + lx; else if (l.face === 'S') s = 2 * W + RING + lx; else s = 3 * W + RING + DEPTH + lx;
      const [x, z] = at(s);
      const tag = l.kind === 'house' || l.kind === 'apartment' ? 'home' : l.kind === 'tower' ? 'office' : l.kind === 'alley' ? 'alley' : l.id ?? l.kind;
      const n = addNode(x, z, tag); n.lot = l; n.door = toWorld(l.fr, lx, l.kind === 'alley' ? 12.6 : 0.1);
      pts.push({ s, n });
    }
    pts.sort((a, b) => a.s - b.s);
    for (let i = 0; i < pts.length; i++) link(pts[i].n, pts[(i + 1) % pts.length].n);
  }
  // vạch qua đường giữa các ô kề nhau
  for (let bz = 0; bz < 3; bz++) for (let bx = 0; bx < 3; bx++) {
    if (bx < 2) { link(corner[`${bx}${bz}NE`], corner[`${bx + 1}${bz}NW`]); link(corner[`${bx}${bz}SE`], corner[`${bx + 1}${bz}SW`]); }
    if (bz < 2) { link(corner[`${bx}${bz}SW`], corner[`${bx}${bz + 1}NW`]); link(corner[`${bx}${bz}SE`], corner[`${bx}${bz + 1}NE`]); }
  }
  // lối ra khỏi khu phố (đầu các tuyến đường)
  for (const b of [0, 1]) {
    for (const [side, cn] of [['NE', 0], ['NW', 1]] as const) { const c = corner[`${b + cn}0${side}`]; link(c, addNode(c.x, -112, 'exit')); }
    for (const [side, cn] of [['SW', 0], ['NW', 1]] as const) { const c = corner[`0${b + cn}${side}`]; link(c, addNode(-112, c.z, 'exit')); }
    for (const [side, cn] of [['SE', 0], ['NE', 1]] as const) { const c = corner[`2${b + cn}${side}`]; link(c, addNode(112, c.z, 'exit')); }
  }
  // công viên: lối đi chữ thập + ghế
  const pc = addNode(59, -59, 'park'), pS = addNode(59, -40, 'park'), pW = addNode(40, -59, 'park'), pN = addNode(59, -76, 'park'), pE = addNode(76, -59, 'park');
  for (const n of [pS, pW, pN, pE]) link(pc, n);
  const near = (x: number, z: number) => NAV.filter((n) => !n.tag || n.tag.startsWith('mid')).reduce((a, b) => (dist(a.x, a.z, x, z) < dist(b.x, b.z, x, z) ? a : b));
  link(pS, near(59, -34)); link(pW, near(34, -59));
  const pg = addNode(41.5, -40, 'park'); link(pg, pS); link(pg, pW); link(pg, corner['20SW']);
  for (const [x, z] of [[48, -70], [70, -70], [70, -48], [48, -50]] as const) { const n = addNode(x, z, 'bench'); link(n, pc); }
  // chợ: lối chính giữa + các sạp
  const mg = addNode(-38, 0, 'market'); link(mg, near(-34, 0));
  let prev = mg; const cols: NavNode[] = [];
  for (const x of MARKET_COLS) { const m = addNode(x, 0, 'market'); link(prev, m); prev = m; cols.push(m); for (const dz of [-8.8, 8.8]) link(m, addNode(x, dz, 'stall')); }
  const mS = addNode(-60, 21, 'market'); link(cols[2], mS); link(mS, near(-60, 25));
  const mN = addNode(-60, -21, 'market'); link(cols[2], mN); link(mN, near(-60, -25));
  const dk = addNode(-75, -1, 'dock'); link(prev, dk);
  // gầm cầu
  const u1 = addNode(49, 98, 'camp'), u2 = addNode(20, 99, 'under'), u3 = addNode(-8, 99, 'hobo'), u4 = addNode(-40, 99, 'under');
  link(u1, u2); link(u2, u3); link(u3, u4);
  link(u1, near(59, 84)); link(u2, corner['12SE']); link(u2, corner['22SW']); link(u4, near(-59, 84)); link(u3, near(0, 84));
  // sân trong các ô có hẻm
  for (const key of ['11', '02', '12']) {
    const bx = +key[0], bz = +key[1], c = addNode((BX[bx][0] + BX[bx][1]) / 2, (BX[bz][0] + BX[bz][1]) / 2, 'yard');
    for (const n of NAV) if (n.tag === 'alley' && n.lot && n.lot.bx === bx && n.lot.bz === bz) { const inner = addNode(n.door![0], n.door![1]); link(n, inner); link(inner, c); }
  }
})();

/** Tìm đường A* trên đồ thị. Trả về danh sách id nút (gồm cả đầu và cuối). */
export function findPath(from: number, to: number): number[] {
  if (from === to) return [from];
  const N = NAV.length, gs = new Float32Array(N).fill(Infinity), fs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const open: number[] = [from]; gs[from] = 0; fs[from] = dist(NAV[from].x, NAV[from].z, NAV[to].x, NAV[to].z);
  while (open.length) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (fs[open[i]] < fs[open[bi]]) bi = i;
    const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (cur === to) { const path = [cur]; let c = cur; while (came[c] >= 0) { c = came[c]; path.push(c); } return path.reverse(); }
    closed[cur] = 1;
    const a = NAV[cur];
    for (const nb of a.e) {
      if (closed[nb] || (NAV_BLOCK.size && NAV_BLOCK.has(edgeKey(cur, nb)))) continue;
      const b = NAV[nb], g = gs[cur] + dist(a.x, a.z, b.x, b.z);
      if (g < gs[nb]) { came[nb] = cur; gs[nb] = g; fs[nb] = g + dist(b.x, b.z, NAV[to].x, NAV[to].z); if (!open.includes(nb)) open.push(nb); }
    }
  }
  return [from, to];
}
export function nearestNode(x: number, z: number, filter?: (n: NavNode) => boolean): NavNode {
  let best = NAV[0], bd = Infinity;
  for (const n of NAV) { if (filter && !filter(n)) continue; const d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z); if (d < bd) { bd = d; best = n; } }
  return best;
}
