// Điều khiển: cảm ứng (cần ảo bên trái, vuốt bên phải để nhìn, chạm để tương tác) + bàn phím/chuột trên máy tính.
import { clamp } from '../core/util';

export interface Tap { x: number; y: number; }
/** Một lần chạm: nhấc tay trong 0,6 giây và gần như không xê dịch. Đo bằng mốc thời gian của chính sự kiện để máy giật khung hình vẫn nhận đúng. */
const TAP_MS = 600, TAP_MOVE = 14;
export type PtrHandler = { down(x: number, y: number, id: number): void; move(x: number, y: number, id: number): void; up(x: number, y: number, id: number): void };
export class Input {
  mx = 0; mz = 0;                 // hướng đi (−1..1): mx = phải, mz = tới
  lookX = 0; lookY = 0;           // lượng xoay tích luỹ (điểm ảnh), đọc xong thì xoá
  run = false; taps: Tap[] = []; keys = new Set<string>();
  stick: { id: number; ox: number; oy: number; x: number; y: number; t: number; moved: number } | null = null;
  private look = new Map<number, { x: number; y: number; sx: number; sy: number; t: number; moved: number }>();
  /** Khi đặt, mọi thao tác trỏ được chuyển cho mini-game thay vì điều khiển nhân vật. */
  capture: PtrHandler | null = null; enabled = true;
  onKey: ((k: string) => void) | null = null; onStick: ((on: boolean, ox: number, oy: number, dx: number, dy: number) => void) | null = null;
  constructor(public el: HTMLElement) {
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => this.down(e)); el.addEventListener('pointermove', (e) => this.move(e));
    for (const t of ['pointerup', 'pointercancel', 'pointerout', 'pointerleave'] as const) el.addEventListener(t, (e) => this.up(e));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => { if ((e.target as HTMLElement)?.tagName === 'INPUT') return; const k = e.key.toLowerCase(); if (!this.keys.has(k)) this.onKey?.(k); this.keys.add(k); if (k === ' ' || k === 'tab') e.preventDefault(); });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this.stick = null; this.look.clear(); this.onStick?.(false, 0, 0, 0, 0); });
  }
  private down(e: PointerEvent) {
    try { this.el.setPointerCapture(e.pointerId); } catch { /* không hỗ trợ */ }
    if (this.capture) { this.capture.down(e.clientX, e.clientY, e.pointerId); return; }
    if (!this.enabled) return;
    const w = window.innerWidth, h = window.innerHeight, touch = e.pointerType !== 'mouse';
    if (touch && !this.stick && e.clientX < w * 0.42 && e.clientY > h * 0.28) {
      this.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0, t: e.timeStamp, moved: 0 }; this.onStick?.(true, e.clientX, e.clientY, 0, 0);
    } else this.look.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: e.timeStamp, moved: 0 });
  }
  private move(e: PointerEvent) {
    if (this.capture) { this.capture.move(e.clientX, e.clientY, e.pointerId); return; }
    const s = this.stick;
    if (s && s.id === e.pointerId) {
      const R = Math.min(70, window.innerHeight * 0.16); let dx = e.clientX - s.ox, dy = e.clientY - s.oy; const d = Math.hypot(dx, dy);
      s.moved = Math.max(s.moved, d); if (d > R) { dx *= R / d; dy *= R / d; }
      s.x = dx / R; s.y = dy / R; this.onStick?.(true, s.ox, s.oy, dx, dy); return;
    }
    const l = this.look.get(e.pointerId); if (!l) return;
    const dx = e.clientX - l.x, dy = e.clientY - l.y; l.x = e.clientX; l.y = e.clientY; l.moved += Math.abs(dx) + Math.abs(dy);
    this.lookX += dx; this.lookY += dy;
  }
  private up(e: PointerEvent) {
    if (this.capture) { if (e.type === 'pointerup' || e.type === 'pointercancel') this.capture.up(e.clientX, e.clientY, e.pointerId); return; }
    if (this.stick && this.stick.id === e.pointerId) {
      // chạm nhanh ở nửa trái mà không kéo = chạm vào vật (không phải điều khiển cần)
      const st = this.stick; if (e.type === 'pointerup' && st.moved < TAP_MOVE && e.timeStamp - st.t < TAP_MS && this.enabled) this.taps.push({ x: e.clientX, y: e.clientY });
      this.stick = null; this.onStick?.(false, 0, 0, 0, 0); return;
    }
    const l = this.look.get(e.pointerId); if (!l) return; this.look.delete(e.pointerId);
    if (e.type === 'pointerup' && l.moved < TAP_MOVE && e.timeStamp - l.t < TAP_MS && this.enabled) this.taps.push({ x: e.clientX, y: e.clientY });
  }
  /** Gọi mỗi khung hình: gộp bàn phím và cần ảo. */
  poll() {
    const k = this.keys; let x = 0, z = 0;
    if (k.has('w') || k.has('arrowup')) z += 1; if (k.has('s') || k.has('arrowdown')) z -= 1; if (k.has('d') || k.has('arrowright')) x += 1; if (k.has('a') || k.has('arrowleft')) x -= 1;
    if (this.stick) { x += this.stick.x; z -= this.stick.y; }
    const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; }
    this.mx = this.enabled ? x : 0; this.mz = this.enabled ? z : 0;
    this.run = k.has('shift') || (!!this.stick && Math.hypot(this.stick.x, this.stick.y) > 0.93 && this.runLock);
  }
  runLock = false;
  consumeLook(): [number, number] { const r: [number, number] = [this.lookX, this.lookY]; this.lookX = this.lookY = 0; return r; }
  reset() { this.stick = null; this.look.clear(); this.taps.length = 0; this.lookX = this.lookY = 0; this.onStick?.(false, 0, 0, 0, 0); }
}
export const clamp01 = clamp;
