// Ngữ cảnh dùng chung của game: nơi các hệ thống tìm thấy nhau mà không cần import vòng.
import type * as THREE from 'three';
import type { Game } from '../sim/state';
import type { City } from '../world/city';
import type { World } from '../world/build';
import type { Env } from '../world/env';
import type { Player } from './player';
import type { Input } from './input';
import type { Npcs } from './npc';
import type { StallSys } from './stall';
import type { UI } from '../ui/ui';
import type { Sound } from '../audio/audio';
import type { Interact } from './interact';
import type { Cook } from '../cook/cook';
import type { Acts } from './acts';

/** Các nhóm nút người chơi tự xếp được: nút tương tác, nút chạy, hàng nút túi/sổ/bản đồ/cài đặt, các nút khi nấu ăn. */
export type BtnKey = 'act' | 'run' | 'menu' | 'cook';
export const BTN_KEYS: BtnKey[] = ['act', 'run', 'menu', 'cook'];
/** x, y: độ lệch so với chỗ mặc định, tính bằng phần bề ngang / bề cao màn hình (để xoay máy, đổi máy vẫn hợp lý) · s: hệ số phóng. */
export interface BtnPlace { x: number; y: number; s: number; }
/** scale: cỡ chữ và nút của cả giao diện · L / P: cách xếp riêng cho màn ngang và màn dọc. */
export interface UiLayout { scale: number; L: Partial<Record<BtnKey, BtnPlace>>; P: Partial<Record<BtnKey, BtnPlace>>; }
export const UI_SCALE: [number, number] = [0.8, 1.4], BTN_SCALE: [number, number] = [0.6, 1.8];
const num = (v: unknown, lo: number, hi: number, def: number) => (typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def);
/** Làm sạch phần giao diện đọc từ bộ nhớ (có thể thiếu, hỏng hoặc do bản cũ ghi). */
export function cleanLayout(raw: any): UiLayout {
  const side = (o: any) => { const out: Partial<Record<BtnKey, BtnPlace>> = {}; if (o && typeof o === 'object') for (const k of BTN_KEYS) { const p = o[k]; if (p && typeof p === 'object') out[k] = { x: num(p.x, -1, 1, 0), y: num(p.y, -1, 1, 0), s: num(p.s, BTN_SCALE[0], BTN_SCALE[1], 1) }; } return out; };
  return { scale: num(raw?.scale, UI_SCALE[0], UI_SCALE[1], 1), L: side(raw?.L), P: side(raw?.P) };
}
export interface Settings { quality: number; sfx: number; music: number; sens: number; fps: boolean; auto: boolean; ui: UiLayout; }
/** pr: tỉ lệ điểm ảnh tối đa (so với điểm ảnh CSS) · blob: bóng tròn dưới chân NPC khi không có bóng đổ thật. */
export const QUALITY = [
  { name: 'Rất thấp', pr: 0.7, shadow: 0, shadowSize: 0, npcs: 10, view: 100, lights: 0, blob: true },
  { name: 'Thấp', pr: 1, shadow: 0, shadowSize: 0, npcs: 14, view: 125, lights: 0, blob: true },
  { name: 'Vừa', pr: 1.5, shadow: 1024, shadowSize: 30, npcs: 22, view: 165, lights: 2, blob: false },
  { name: 'Cao', pr: 2, shadow: 2048, shadowSize: 38, npcs: 32, view: 210, lights: 4, blob: false },
];
/** Mức mặc định: điện thoại "Vừa", máy tính "Cao". */
export const Q_DEFAULT_MOBILE = 2, Q_DEFAULT_DESKTOP = 3;
/** Góc nhìn khi đi bộ: màn dọc cần góc rộng hơn để không bị "ống nhòm". */
export const baseFov = (aspect: number) => (aspect < 1 ? 82 : 68);
export const MIN_PER_SEC = 0.75;      // 1 giây thật = 0,75 phút game → một ngày dài 32 phút
export type Mode = 'menu' | 'play' | 'cook' | 'panel' | 'sleep' | 'job';
export interface Ctx {
  g: Game; set: Settings; mode: Mode; time: number; mobile: boolean;
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  city: City; world: World; env: Env; player: Player; input: Input; npcs: Npcs; stall: StallSys; ui: UI; sound: Sound; interact: Interact; cook: Cook; acts: Acts;
  /** phút game trôi thêm mỗi giây thật (ngủ thì tua nhanh) */
  speed: number;
  save(reason?: string): void; applyQuality(): void; newGame(ac: 'anh' | 'chị'): void; toMenu(): void;
}
export const ctx = { mode: 'menu', time: 0, speed: MIN_PER_SEC } as Ctx;
export const SAVE_KEY = 'ganhhang.save.v1', SET_KEY = 'ganhhang.settings.v1';
export function loadSettings(mobile: boolean): Settings {
  const def: Settings = { quality: mobile ? Q_DEFAULT_MOBILE : Q_DEFAULT_DESKTOP, sfx: 0.8, music: 0.5, sens: 1, fps: true, auto: true, ui: cleanLayout(null) };
  try { const s = { ...def, ...JSON.parse(localStorage.getItem(SET_KEY) || '{}') }; s.quality = Math.max(0, Math.min(QUALITY.length - 1, s.quality | 0)); s.ui = cleanLayout(s.ui); return s; } catch { return def; }
}
export function saveSettings() { try { localStorage.setItem(SET_KEY, JSON.stringify(ctx.set)); } catch { /* bộ nhớ đầy hoặc bị chặn */ } }

/** Bật/tắt toàn màn hình và khoá xoay ngang (nếu trình duyệt cho phép). iPhone không hỗ trợ: hãy dùng "Thêm vào màn hình chính". */
export const canFullscreen = () => typeof document !== 'undefined' && !!document.documentElement.requestFullscreen && document.fullscreenEnabled !== false;
export async function toggleFullscreen(): Promise<boolean> {
  try {
    if (document.fullscreenElement) { await document.exitFullscreen(); return false; }
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    try { await (screen.orientation as any)?.lock?.('landscape'); } catch { /* máy không cho khoá hướng */ }
    return true;
  } catch { return false; }
}
