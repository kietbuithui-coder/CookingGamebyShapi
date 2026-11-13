// Tiện ích dùng chung: toán, ngẫu nhiên, định dạng. Không phụ thuộc Three.js.

export const TAU = Math.PI * 2;
export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Tiến dần a→b theo hàm mũ, không phụ thuộc tốc độ khung hình. */
export const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));
export const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const remap = (v: number, a: number, b: number, c: number, d: number) => c + (d - c) * clamp((v - a) / (b - a));
export const sign = (v: number) => (v < 0 ? -1 : 1);
export function angDiff(a: number, b: number) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}
export const dist2 = (ax: number, az: number, bx: number, bz: number) => (ax - bx) * (ax - bx) + (az - bz) * (az - bz);
export const dist = (ax: number, az: number, bx: number, bz: number) => Math.sqrt(dist2(ax, az, bx, bz));

/** Bộ sinh số ngẫu nhiên có hạt giống (mulberry32). */
export class RNG {
  s: number;
  constructor(seed = 1) { this.s = (seed >>> 0) || 1; }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number) { return a + (b - a) * this.next(); }
  int(a: number, b: number) { return Math.floor(this.range(a, b + 1)); }
  chance(p: number) { return this.next() < p; }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  weighted<T>(items: readonly T[], w: (t: T) => number): T | undefined {
    let sum = 0;
    for (const it of items) sum += Math.max(0, w(it));
    if (sum <= 0) return undefined;
    let r = this.next() * sum;
    for (const it of items) { r -= Math.max(0, w(it)); if (r <= 0) return it; }
    return items[items.length - 1];
  }
}
/** RNG chung cho gameplay (không cần tái lập). */
export const rnd = new RNG((Math.random() * 2 ** 31) | 0);

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** 35000 → "35.000₫" */
export function money(n: number): string {
  const v = Math.round(n);
  const s = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (v < 0 ? '-' : '') + s + '₫';
}
/** 35000 → "35k", 1250000 → "1,25tr" */
export function moneyShort(n: number): string {
  const v = Math.round(n), a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(a % 1e6 === 0 ? 0 : 2).replace('.', ',').replace(/,?0+$/, '') + 'tr';
  if (a >= 1000) return (v / 1000).toFixed(a % 1000 === 0 ? 0 : 1).replace('.', ',') + 'k';
  return String(v);
}
/** phút trong ngày → "06:05" */
export function hhmm(min: number): string {
  const m = ((Math.floor(min) % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
/** làm tròn tới 2 chữ số thập phân, bỏ số 0 thừa */
export function qty(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}
export const round1k = (n: number) => Math.round(n / 1000) * 1000;
export const round500 = (n: number) => Math.round(n / 500) * 500;

type Fn<T> = (v: T) => void;
export class Emitter<M extends Record<string, any>> {
  private m = new Map<keyof M, Set<Fn<any>>>();
  on<K extends keyof M>(k: K, f: Fn<M[K]>) { (this.m.get(k) ?? this.m.set(k, new Set()).get(k)!).add(f); return () => this.m.get(k)?.delete(f); }
  emit<K extends keyof M>(k: K, v: M[K]) { this.m.get(k)?.forEach((f) => f(v)); }
}

export function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : ''));
}
