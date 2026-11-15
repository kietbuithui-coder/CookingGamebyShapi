// NẤU ĂN — bộ điều phối: đưa camera xuống bàn bếp của quầy, chạy lần lượt từng thao tác (cắt, xào, nướng, nấu, trình bày)
// bằng vật thể 3D thật và cử chỉ tay, rồi quy điểm thao tác + chất lượng nguyên liệu thành chất lượng món.
import * as THREE from 'three';
import { ctx } from '../game/ctx';
import { RecipeDef, Step, STEP_NAME, RECIPES } from '../data/recipes';
import { absMin } from '../sim/state';
import { prepPossible, finishPossible, consumePrep, consumeFinish, dishQuality, useFuel, stove, missingTools, missingFor, hasPrep, cookEase, addXp, wx, has, recipeCost, fuelUnitCost } from '../sim/rules';
import { GEAR } from '../data/gear';
import { toast, sfx, bus } from '../core/bus';
import { clamp } from '../core/util';
import { softDot } from '../gfx/tex';
import type { PtrHandler } from '../game/input';
import type { Station } from '../game/stall';
import { CutGame, FryGame, GrillGame, BoilGame, AssembleGame, WashGame } from './games';

export interface Mini {
  /** local y của mặt phẳng nhận thao tác tay */
  planeH: number;
  /** Khung hình cần thấy: [rộng, cao (đã chiếu lên màn hình), tâm z] tính bằng mét trên bàn bếp. */
  frame?: [number, number, number];
  start(): void; update(dt: number): number | null;   // trả về điểm 0–1 khi xong
  down?(p: THREE.Vector3, sx: number, sy: number): void; move?(p: THREE.Vector3, sx: number, sy: number): void; up?(p: THREE.Vector3 | null, sx: number, sy: number): void;
  btn?(id: string, down: boolean): void; slide?(v: number): void;
}
const matCache = new Map<number, THREE.MeshPhongMaterial>();
export function pm(col: number, opts?: { opacity?: number; emissive?: number; flat?: boolean }): THREE.MeshPhongMaterial {
  if (opts) return new THREE.MeshPhongMaterial({ color: col, shininess: 40, specular: 0x333333, transparent: opts.opacity !== undefined, opacity: opts.opacity ?? 1, emissive: opts.emissive ?? 0, flatShading: !!opts.flat });
  let m = matCache.get(col); if (!m) { m = new THREE.MeshPhongMaterial({ color: col, shininess: 40, specular: 0x333333 }); matCache.set(col, m); } return m;
}
export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(0.5, 10, 8), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14), disc: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
  cone: new THREE.ConeGeometry(0.5, 1, 8), ring: new THREE.TorusGeometry(0.5, 0.06, 6, 20).rotateX(Math.PI / 2),
};
export function mk(geo: THREE.BufferGeometry, col: number, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0, parent?: THREE.Object3D): THREE.Mesh {
  const m = new THREE.Mesh(geo, pm(col)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); parent?.add(m); return m;
}
/** Mô hình bếp + bộ điều khiển nhiệt dùng chung cho xào/nướng/nấu. */
export class Heat {
  flame = 0.35; temp = 0.25; gas: boolean; fire: number; top: number; glow: THREE.Mesh; private gust = 4;
  constructor(public cook: Cook, parent: THREE.Object3D) {
    const g = ctx.g; this.gas = stove(g) === 'bepgas';
    this.fire = clamp(wx(g).fire * (has(g, 'odu') || g.stall.tier >= 2 ? 0.3 : 1) * (this.gas ? 0.25 : 1));
    this.top = this.gas ? 0.125 : 0.2;
    const mb = cook.mb(); if (this.gas) cook.props.gasStove(mb, 0, 0, 0, 1); else cook.props.charcoalStove(mb, 0, 0, 0, 1);
    parent.add(cook.meshOf(mb));
    this.glow = new THREE.Mesh(GEO.disc, new THREE.MeshBasicMaterial({ color: this.gas ? 0x4aa8ff : 0xff6a1a, transparent: true, opacity: 0.6 }));
    this.glow.scale.set(this.gas ? 0.15 : 0.27, 0.01, this.gas ? 0.15 : 0.27); this.glow.position.set(this.gas ? -0.04 : 0, this.top - (this.gas ? 0.01 : 0.045), 0); parent.add(this.glow);
    if (this.gas) { this.flame = 0.4; ctx.ui.cookSlider(this.flame); } else ctx.ui.cookSlider(null);
  }
  fan() { if (this.gas) return; this.flame = Math.min(1, this.flame + 0.14); sfx('fan'); this.cook.puff(0, this.top, 0, 0xffa040, 3); }
  update(dt: number) {
    if (!this.gas) {
      this.flame = Math.max(0.04, this.flame - dt * (0.055 + this.fire * 0.1));
      if (this.fire > 0.25) { this.gust -= dt; if (this.gust <= 0) { this.gust = 3 + Math.random() * 5; this.flame *= 1 - this.fire * 0.45; ctx.ui.cookHint(wx(ctx.g).rain > 0.3 ? 'Mưa tạt làm than nguội — quạt mạnh lên!' : 'Gió thổi tạt lửa — quạt lên!'); } }
    } else if (this.fire > 0.4 && Math.random() < dt * 0.25) this.flame = Math.max(0.1, this.flame - 0.15);
    this.temp += (this.flame - this.temp) * Math.min(1, dt * (this.gas ? 1.9 : 1.3));
    const m = this.glow.material as THREE.MeshBasicMaterial; m.opacity = 0.25 + this.flame * 0.7; if (!this.gas) m.color.setHSL(0.03 + this.flame * 0.06, 1, 0.25 + this.flame * 0.35); else this.glow.scale.setScalar(0.1 + this.flame * 0.12), this.glow.scale.y = 0.01;
  }
}

import * as props from '../gfx/props';
import { MB, MAT } from '../gfx/mb';
export class Cook implements PtrHandler {
  active = false; group = new THREE.Group(); stage = new THREE.Group(); props = props;
  private mini: Mini | null = null; private steps: Step[] = []; private idx = 0; private scores: number[] = []; private r!: RecipeDef; private phase: 'prep' | 'finish' | 'job' = 'prep';
  private portions = 1; private done: (() => void) | null = null; private gradeT = 0; private st!: Station; private ray = new THREE.Raycaster(); private ndc = new THREE.Vector2(); private v = new THREE.Vector3();
  private puffs: { s: THREE.Sprite; life: number; vy: number; vx: number }[] = []; private puffTex = softDot('rgba(255,255,255,.9)', 'rgba(255,255,255,0)', 64, 0.1);
  private light = new THREE.PointLight(0xffe2b0, 0, 4, 1.5); ease = 1; time = 0; private aspect = 0; private jobDone: ((score: number) => void) | null = null;
  constructor() {
    ctx.scene.add(this.group); this.group.add(this.stage, this.light); this.group.visible = false; this.light.position.set(0.2, 0.9, 0.5);
    for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.puffTex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; this.group.add(s); this.puffs.push({ s, life: 0, vy: 0, vx: 0 }); }
  }
  mb() { return new MB(); }
  meshOf(mb: MB, mat: THREE.Material = MAT.food) { const m = new THREE.Mesh(mb.build(), mat); return m; }
  /** Khói / hơi nước / tàn lửa. */
  puff(x: number, y: number, z: number, col = 0xffffff, n = 1, size = 0.12) {
    for (let k = 0; k < n; k++) { const p = this.puffs.find((q) => q.life <= 0); if (!p) return; p.life = 0.9 + Math.random() * 0.6; p.vy = 0.22 + Math.random() * 0.2; p.vx = (Math.random() - 0.5) * 0.12 + wx(ctx.g).wind * 0.15;
      p.s.position.set(x + (Math.random() - 0.5) * 0.08, y, z + (Math.random() - 0.5) * 0.08); p.s.scale.setScalar(size * (0.7 + Math.random() * 0.6)); (p.s.material as THREE.SpriteMaterial).color.setHex(col); p.s.visible = true; }
  }
  /** Sơ chế một mẻ. */
  prep(r: RecipeDef, done?: () => void): boolean {
    const g = ctx.g, n = prepPossible(g, r);
    if (!this.check(r)) return false;
    if (n < 1) { toast(`Thiếu nguyên liệu để sơ chế ${r.name}: ${missingFor(g, r, 'prep').join(', ')}.`, 'warn', 'box'); return false; }
    if (!this.fuel(r.prep)) return false;
    this.begin(r, 'prep', r.prep, n, done ?? null); return true;
  }
  /** Hoàn thiện món cho khách. */
  finish(r: RecipeDef, done?: () => void): boolean {
    const g = ctx.g, n = Math.min(r.serve, finishPossible(g, r));
    if (!this.check(r)) { done?.(); return false; }
    if (n < 1) { toast(hasPrep(r) && !g.stall.preps.some((p) => p.rid === r.id) ? `Chưa sơ chế ${r.name}. Mở Thực đơn › Sơ chế trước đã.` : `Thiếu nguyên liệu: ${missingFor(g, r, 'fin').join(', ')}.`, 'warn', 'box'); done?.(); return false; }
    if (!this.fuel(r.finish)) { done?.(); return false; }
    this.begin(r, 'finish', r.finish, n, done ?? null); return true;
  }
  /** Việc rửa chén ở quán cơm (dùng chung cơ chế bàn thao tác). */
  wash(st: Station, plates: number, done: (score: number) => void) {
    this.r = RECIPES.tra_da; this.phase = 'job'; this.steps = []; this.idx = 0; this.scores = []; this.jobDone = done; this.enter(st);
    ctx.ui.cookShow('Rửa chén thuê — Quán cơm Bà Tư', ['Rửa chén'], 0); this.setMini(new WashGame(this, plates));
  }
  /** Điều kiện chung: quầy đã đặt, đủ dụng cụ. Không tiêu hao gì. */
  private check(r: RecipeDef): boolean {
    const g = ctx.g, s = g.stall;
    if (s.where !== 'placed') { toast('Phải đặt quầy xuống một chỗ bán rồi mới nấu được.', 'warn'); return false; }
    const miss = missingTools(g, r); if (miss.length) { toast(`Thiếu dụng cụ: ${miss.map((t) => (t === 'bep' ? 'bếp (than hoặc gas)' : GEAR[t].name.toLowerCase())).join(', ')}. Mua ở tiệm Đồ Nghề Ba Tài.`, 'warn', 'tool'); return false; }
    return true;
  }
  /** Đốt nhiên liệu cho các bước dùng lửa — chỉ gọi sau khi đã chắc đủ nguyên liệu. */
  private fuel(steps: Step[]): boolean {
    const g = ctx.g;
    const heats = steps.filter((x) => x.t !== 'cut' && x.t !== 'assemble').length;
    if (heats) {
      if (wx(g).id === 'bao') { toast('Bão thế này không nhóm bếp nổi!', 'bad', 'storm'); return false; }
      if (!useFuel(g, heats)) { toast(stove(g) === 'bepgas' ? 'Hết gas! Mua bình gas mini ở tạp hoá Cô Ba.' : 'Hết than! Mua than ở tạp hoá Cô Ba hoặc vựa đầu mối.', 'warn', 'fire'); return false; }
    }
    return true;
  }
  private enter(st: Station) {
    this.st = st; this.active = true; ctx.mode = 'cook'; ctx.input.reset(); ctx.input.capture = this; this.time = 0;
    this.group.position.set(st.x, st.y, st.z); this.group.rotation.y = st.yaw + Math.PI; this.group.visible = true; this.group.updateMatrixWorld(true);
    this.aspect = 0; this.frameCam(); this.ease = cookEase(ctx.g); this.light.intensity = 2.2 * ctx.env.night;
    ctx.ui.onCookBtn = (id, down) => { if (id === 'quit') { if (down) this.abort(); } else this.mini?.btn?.(id, down); }; ctx.ui.onCookSlide = (v) => this.mini?.slide?.(v);
  }
  /**
   * Đặt camera sao cho BÀN THAO TÁC (rộng ~0,84 m, sâu ~0,66 m) lấp đầy phần màn hình không bị giao diện che,
   * bất kể máy ngang hay dọc — để ngón tay bấm trúng được trên điện thoại.
   */
  private frameCam() {
    const cam = ctx.camera, asp = cam.aspect, fr = this.mini?.frame ?? [0.84, 0.7, 0], key = asp + fr[0] * 7 + fr[1] * 13 + fr[2] * 3; if (Math.abs(key - this.aspect) < 0.005) return; this.aspect = key;
    const land = asp > 1.05, fov = land ? 40 : 54, tv = Math.tan((fov * Math.PI) / 360), th = tv * asp;
    const W = fr[0], H = fr[1], fw = land ? 0.62 : 0.97, fh = land ? 0.78 : 0.52;
    const d = Math.max(W / (2 * th * fw), H / (2 * tv * fh)), pitch = 0.94, down = (land ? 0.09 : 0.04) * 2 * tv * d / Math.sin(pitch);
    const cy = 0.08, cz = fr[2] - down;
    const pos = this.group.localToWorld(new THREE.Vector3(0, cy + d * Math.sin(pitch), cz + d * Math.cos(pitch))), look = this.group.localToWorld(new THREE.Vector3(0, cy, cz));
    ctx.player.view(pos, look, fov);
  }
  private begin(r: RecipeDef, phase: 'prep' | 'finish', steps: Step[], n: number, done: (() => void) | null) {
    this.r = r; this.phase = phase; this.steps = steps; this.idx = 0; this.scores = []; this.portions = n; this.done = done;
    const [px, pz] = ctx.stall.standPos(); ctx.player.x = px; ctx.player.z = pz; ctx.player.yaw = ctx.g.stall.yaw; ctx.player.pitch = -0.5;
    ctx.stall.cooking(true); this.enter(ctx.stall.station()); this.next();
  }
  private setMini(m: Mini) { this.clearStage(); this.mini = m; m.start(); this.frameCam(); }
  private next() {
    const s = this.steps[this.idx], g = ctx.g, r = this.r;
    ctx.ui.cookShow(`${this.phase === 'prep' ? 'Sơ chế' : 'Làm món'}: ${r.name}` + (this.portions > 1 ? ` (${this.portions} phần)` : ''), this.steps.map((x) => ('label' in x && x.label ? x.label : STEP_NAME[x.t])), this.idx);
    ctx.ui.cookButtons([]); ctx.ui.cookHeat(null); ctx.ui.cookProg(null); ctx.ui.cookSlider(null); ctx.ui.cookLabels([]); ctx.ui.cookCard(null);
    switch (s.t) {
      case 'cut': this.setMini(new CutGame(this, s)); break;
      case 'fry': this.setMini(new FryGame(this, s, this.portions)); break;
      case 'grill': this.setMini(new GrillGame(this, s, r, this.portions)); break;
      case 'boil': this.setMini(new BoilGame(this, s)); break;
      case 'assemble': this.setMini(new AssembleGame(this, s, r)); break;
    }
    void g;
  }
  private clearStage() {
    for (const c of this.stage.children.slice()) { this.stage.remove(c); c.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry && !Object.values(GEO).includes(m.geometry as any) && !m.userData.shared) m.geometry.dispose(); }); }
    for (const p of this.puffs) { p.life = 0; p.s.visible = false; }
  }
  private local(sx: number, sy: number): THREE.Vector3 | null {
    this.ndc.set((sx / window.innerWidth) * 2 - 1, -(sy / window.innerHeight) * 2 + 1); this.ray.setFromCamera(this.ndc, ctx.camera);
    const o = this.ray.ray.origin, d = this.ray.ray.direction, py = this.st.y + (this.mini?.planeH ?? 0), t = (py - o.y) / d.y; if (!(t > 0)) return null;
    return this.group.worldToLocal(this.v.copy(o).addScaledVector(d, t)).clone();
  }
  down(x: number, y: number) { if (!this.mini || this.gradeT > 0) return; const p = this.local(x, y); if (p) this.mini.down?.(p, x, y); }
  move(x: number, y: number) { if (!this.mini || this.gradeT > 0) return; const p = this.local(x, y); if (p) this.mini.move?.(p, x, y); }
  up(x: number, y: number) { if (!this.mini || this.gradeT > 0) return; this.mini.up?.(this.local(x, y), x, y); }
  /** Vị trí thế giới của một điểm trên bàn bếp (để đặt nhãn/hiệu ứng chữ). */
  world(x: number, y: number, z: number) { return this.group.localToWorld(new THREE.Vector3(x, y, z)); }
  update(dt: number) {
    if (!this.active) return;
    this.time += dt; this.frameCam();
    for (const p of this.puffs) if (p.life > 0) { p.life -= dt; p.s.position.y += p.vy * dt; p.s.position.x += p.vx * dt; p.s.scale.multiplyScalar(1 + dt * 0.9); (p.s.material as THREE.SpriteMaterial).opacity = clamp(p.life) * 0.5; if (p.life <= 0) p.s.visible = false; }
    if (this.gradeT > 0) { this.gradeT -= dt; if (this.gradeT <= 0) this.advance(); return; }
    if (!this.mini) return;
    const sc = this.mini.update(dt);
    if (sc !== null) {
      const s = clamp(sc); this.scores.push(s); this.gradeT = 1.15;
      ctx.ui.cookGrade(s, s >= 0.9 ? 'Tuyệt hảo!' : s >= 0.75 ? 'Rất khéo' : s >= 0.55 ? 'Tạm được' : s >= 0.3 ? 'Hơi vụng' : 'Hỏng rồi…'); sfx(s >= 0.75 ? 'good' : s >= 0.4 ? 'ok' : 'bad');
      ctx.ui.cookButtons([]); ctx.ui.cookLabels([]);
    }
  }
  private advance() {
    if (this.phase === 'job') { const s = this.scores[0] ?? 0; this.exit(); this.jobDone?.(s); this.jobDone = null; return; }
    this.idx++;
    if (this.idx < this.steps.length) { this.next(); return; }
    // tổng kết: trừ nguyên liệu, tính chất lượng, cất thành phẩm
    const g = ctx.g, r = this.r, n = this.portions, score = this.scores.reduce((a, b) => a + b, 0) / Math.max(1, this.scores.length), now = absMin(g);
    const fuel = this.steps.filter((x) => x.t !== 'cut' && x.t !== 'assemble').length * fuelUnitCost(g);
    if (this.phase === 'prep') {
      const c = consumePrep(g, r, n), q = clamp(score * (0.35 + 0.65 * c.q), 0.02, 1);
      g.stall.preps.push({ rid: r.id, n, q, at: now, cost: (c.cost + fuel) / n });
      toast(`Sơ chế xong ${n} phần ${r.name} — ${q >= 0.8 ? 'rất đạt' : q >= 0.55 ? 'ổn' : 'hơi kém'}.`, q >= 0.55 ? 'good' : 'warn', 'knife');
      if (g.quest === 4) bus.emit('quest', 5);
    } else {
      const c = consumeFinish(g, r, n), q = dishQuality(g, r, score, c.q, c.prepQ);
      g.stall.ready.push({ rid: r.id, n, q, at: now, cost: (c.cost + fuel) / n });
      if (n > 1) toast(`Ra lò ${n} phần ${r.name}. Phần dư để sẵn trên khay.`, 'info', 'dish');
    }
    for (const st of this.steps) for (const t of st.t === 'cut' ? ['daothot'] : st.t === 'fry' ? ['chao'] : st.t === 'grill' ? ['vi'] : st.t === 'boil' ? ['noi'] : []) this.wear(t);
    if (this.steps.some((x) => x.t !== 'cut' && x.t !== 'assemble')) this.wear(stove(g)!);
    g.stall.dirt = clamp(g.stall.dirt + 1.5 + (1 - score) * 2, 0, 100); g.st.hygiene = clamp(g.st.hygiene - 0.6, 0, 100); addXp(g, score);
    void recipeCost;
    const d = this.done; this.exit(); d?.(); bus.emit('ui', 'cook');
  }
  private wear(id: string) {
    const g = ctx.g, d = GEAR[id]; if (!d?.wear || g.gear[id] === undefined) return;
    g.gear[id] -= d.wear * 0.5; if (g.gear[id] <= 1) { delete g.gear[id]; toast(`${d.name} đã hỏng hẳn vì dùng quá lâu! Phải mua cái mới ở tiệm Ba Tài.`, 'bad', 'tool', true); ctx.stall.refresh(); }
  }
  abort() { if (!this.active) return; const d = this.done; if (this.phase === 'job') { this.exit(); this.jobDone?.(-1); this.jobDone = null; return; } toast('Bỏ dở giữa chừng.', 'warn'); this.exit(); d?.(); }
  private exit() {
    this.clearStage(); this.mini = null; this.active = false; this.group.visible = false; this.gradeT = 0; this.done = null;
    ctx.input.capture = null; ctx.input.reset(); ctx.player.view(null); ctx.mode = 'play'; ctx.ui.cookHide(); ctx.stall.cooking(false);
  }
}
