// 5 CƠ CHẾ NẤU bằng tay + việc rửa chén. Toạ độ bàn bếp: +x = bên phải màn hình, −z = phía xa (khách), +z = phía người nấu.
import * as THREE from 'three';
import { ctx } from '../game/ctx';
import type { Cook, Mini } from './cook';
import { Heat, GEO, mk, pm } from './cook';
import type { CutStep, FryStep, GrillStep, BoilStep, AssembleStep, RecipeDef, Look, Vessel } from '../data/recipes';
import { INGS } from '../data/ingredients';
import { MB, MAT, mix, shade } from '../gfx/mb';
import { ingModel, boardModel, knifeModel, panModel, potModel, grateModel } from '../gfx/props';
import { clamp, lerp, RNG, hashStr } from '../core/util';
import { sfx } from '../core/bus';

const col = new THREE.Color(), GOLD = new THREE.Color(0xc8852e), BURNT = new THREE.Color(0x1a1410);
function timeFactor(t: number, target: number) { return t <= target ? 1 : clamp(1 - (t / target - 1) * 0.2, 0.75, 1); }
const ingCol = (id: string, c?: number) => c ?? INGS[id.replace('@', '')]?.c ?? 0xd9a05a;
const ingName = (id: string, n?: string) => n ?? INGS[id]?.name ?? id;

// ───────────────────────── 1. CẮT THÁI ─────────────────────────
export class CutGame implements Mini {
  planeH = 0.06; frame: [number, number, number] = [0.68, 0.46, 0.02]; private knife = new THREE.Group(); private segs: THREE.Mesh[] = []; private guides: number[] = []; private used: boolean[] = []; private marks: THREE.Mesh[] = [];
  private s: number[] = []; private t = 0; private chopT = 0; private doneT = -1; private mince: boolean; private n: number; private chops = 0; private bits: THREE.Mesh[] = []; private held = false; private aim!: THREE.Mesh;
  constructor(private cook: Cook, private step: CutStep) { this.mince = step.style === 'băm'; this.n = step.n; }
  start() {
    const st = this.cook.stage, d = INGS[this.step.ing], mb = new MB(); boardModel(mb, 0, 0, 0, 0.56, 0.34); st.add(this.cook.meshOf(mb));
    const L = 0.36, n = this.n, round = ['round', 'long', 'corn', 'roll', 'egg', 'bottle', 'head'].includes(d.shape), flat = ['stack', 'leafy', 'nest'].includes(d.shape);
    if (this.mince) {
      const R = new RNG(hashStr(d.id)); for (let i = 0; i < 16; i++) { const m = mk(GEO.box, i % 3 ? d.c : d.c2, 0.045, 0.03, 0.04, R.range(-0.09, 0.09), 0.04, R.range(-0.05, 0.05), st); m.rotation.y = R.range(0, 3); this.bits.push(m); }
      ctx.ui.cookHint(`Băm ${d.name.toLowerCase()}: chạm liên tục thật nhanh tay!`); ctx.ui.cookProg(0, 0, 0, 'Độ nhuyễn');
    } else {
      const w = L / (n + 1);
      for (let i = 0; i <= n; i++) {
        const x = -L / 2 + w * (i + 0.5), m = round ? mk(GEO.cyl, d.c, 0.075, w - 0.001, 0.075, x, 0.064, 0, st) : mk(GEO.box, d.c, w - 0.001, flat ? 0.02 : 0.05, flat ? 0.16 : 0.085, x, flat ? 0.036 : 0.051, 0, st);
        if (round) m.rotation.z = Math.PI / 2; m.userData.x = x; this.segs.push(m);
        if (i < n) { const gx = -L / 2 + w * (i + 1); this.guides.push(gx); this.used.push(false); this.marks.push(mk(GEO.box, 0xfff3b0, 0.004, 0.002, 0.3, gx, 0.027, 0, st)); }
      }
      // lõi màu ruột ở hai đầu
      for (const s of [-1, 1]) { const c = mk(GEO.cyl, d.c2, round ? 0.06 : 0.04, 0.002, round ? 0.06 : 0.07, s * (L / 2 + 0.001), round ? 0.064 : 0.05, 0, st); c.rotation.z = Math.PI / 2; }
      ctx.ui.cookHint(`Thái ${this.step.style} ${d.name.toLowerCase()}: kéo dao tới từng vạch vàng rồi thả tay.`); ctx.ui.cookProg(0, 0, 0, `0/${n} nhát`);
    }
    const kb = new MB(); knifeModel(kb, 0, 0, 0); this.knife.add(this.cook.meshOf(kb, MAT.lit)); this.knife.position.set(0, 0.2, 0.03); st.add(this.knife);
    // vệt ngắm dưới lưỡi dao: thấy rõ nhát cắt sẽ rơi vào đâu dù ngón tay che mất dao
    this.aim = mk(GEO.box, 0xe2402f, 0.005, 0.002, 0.44, 0, 0.03, 0.02, st); this.aim.material = new THREE.MeshBasicMaterial({ color: 0xe2402f });
  }
  down(p: THREE.Vector3) { this.held = true; this.knife.position.x = clamp(p.x, -0.24, 0.24); }
  move(p: THREE.Vector3) { if (this.held) this.knife.position.x = clamp(p.x, -0.24, 0.24); }
  up() { if (!this.held || this.doneT >= 0) return; this.held = false; this.chop(this.knife.position.x); }
  private chop(x: number) {
    this.chopT = 0.16; sfx('chop');
    if (this.mince) {
      this.chops++; for (const b of this.bits) { b.scale.multiplyScalar(0.93); b.position.x += (Math.random() - 0.5) * 0.02; b.position.z += (Math.random() - 0.5) * 0.015; b.position.y = 0.03 + b.scale.y / 2; b.rotation.y += 0.7; }
      ctx.ui.cookProg(this.chops / this.n, 0, 0, 'Độ nhuyễn'); if (this.chops >= this.n) this.doneT = 0.3; return;
    }
    let gi = -1, bd = 1e9; this.guides.forEach((gx, i) => { if (!this.used[i] && Math.abs(gx - x) < bd) { bd = Math.abs(gx - x); gi = i; } });
    if (gi < 0) return;
    const w = 0.36 / (this.n + 1), err = bd / w;
    if (err > 0.62) { ctx.ui.floatAt('Trượt rồi!', this.cook.world(x, 0.12, 0), 'bad'); this.s.push(0); this.used[gi] = true; }
    else { const sc = clamp(1 - Math.max(0, err - 0.13 * this.cook.ease) * 1.7); this.s.push(sc); this.used[gi] = true; ctx.ui.floatAt(sc > 0.85 ? 'Đều tay!' : sc > 0.5 ? 'Được' : 'Lệch!', this.cook.world(x, 0.12, 0), sc > 0.85 ? 'good' : sc > 0.5 ? 'info' : 'warn'); }
    this.marks[gi].visible = false;
    for (let i = gi + 1; i < this.segs.length; i++) this.segs[i].userData.x += 0.009; for (let i = 0; i <= gi; i++) this.segs[i].userData.x -= 0.003;
    const done = this.used.filter(Boolean).length; ctx.ui.cookProg(done / this.n, 0, 0, `${done}/${this.n} nhát`);
    if (done >= this.n) this.doneT = 0.35;
  }
  update(dt: number) {
    this.t += dt; if (this.chopT > 0) this.chopT -= dt;
    this.knife.position.y = 0.2 - (this.chopT > 0 ? Math.sin((1 - this.chopT / 0.16) * Math.PI) * 0.13 : 0); this.knife.rotation.x = this.chopT > 0 ? -0.35 : -0.1;
    this.aim.position.x = this.knife.position.x; this.aim.visible = !this.mince && this.doneT < 0;
    for (const s of this.segs) s.position.x += (s.userData.x - s.position.x) * Math.min(1, dt * 14);
    if (this.doneT >= 0) { this.doneT -= dt; if (this.doneT < 0) { if (this.mince) return clamp(1.15 - Math.max(0, this.t / (this.n * 0.42 + 1) - 1) * 0.5, 0.4, 1); return (this.s.reduce((a, b) => a + b, 0) / Math.max(1, this.s.length)) * timeFactor(this.t, this.n * 1.5 + 2.5); } }
    return null;
  }
}

// ───────────────────────── 2. XÀO / CHIÊN / ỐP LA ─────────────────────────
export class FryGame implements Mini {
  planeH = 0.2; frame: [number, number, number] = [0.74, 0.62, 0]; private heat!: Heat; private pan = new THREE.Group(); private pieces: { m: THREE.Mesh; base: THREE.Color; vy: number; y: number }[] = [];
  private cookV = 0; private burn = 0; private tossN = 0; private missed = 0; private prompt = 0; private lo: number; private hi: number; private result: number | null = null; private sx = 0; private sy = 0; private smokeT = 0; private single: boolean; private flipped = 0;
  constructor(private cook: Cook, private step: FryStep, private portions: number) { const w = 0.13 * clamp(cook.ease, 0.7, 1.35); this.lo = step.heat - w; this.hi = step.heat + w; this.single = step.mode === 'ốp la'; }
  start() {
    const st = this.cook.stage; this.heat = new Heat(this.cook, st); this.planeH = this.heat.top + 0.04;
    const mb = new MB(); panModel(mb, 0, 0, 0, 1); this.pan.add(this.cook.meshOf(mb, MAT.lit)); this.pan.position.y = this.heat.top + 0.012; st.add(this.pan);
    mk(GEO.disc, 0xd9b84a, 0.28, 0.003, 0.28, 0, 0.011, 0, this.pan).material = pm(0xe9c85a, { opacity: 0.35 });   // lớp dầu
    const R = new RNG(7), ings = this.step.ings;
    if (this.single) {
      const egg = ings[0] === 'trung';
      for (let k = 0; k < Math.min(2, this.portions); k++) { const x = (k - (Math.min(2, this.portions) - 1) / 2) * 0.13; const m = mk(GEO.disc, egg ? 0xfdfbf2 : 0xa8554a, egg ? 0.12 : 0.11, egg ? 0.008 : 0.024, egg ? 0.11 : 0.11, x, 0.018, 0, this.pan); m.material = pm(egg ? 0xfdfbf2 : 0xa8554a, {}); this.pieces.push({ m, base: new THREE.Color(egg ? 0xfdfbf2 : 0xa8554a), vy: 0, y: 0.018 });
        if (egg) mk(GEO.sph, 0xf5a81e, 0.3, 2.2, 0.32, 0, 0.6, 0, m); }
    } else for (const id of ings) for (let i = 0; i < clamp(Math.round(12 / ings.length), 3, 7); i++) {
      const d = INGS[id], a = R.range(0, 6.28), r = Math.sqrt(R.next()) * 0.105, ball = ['balls', 'round', 'egg', 'shrimp'].includes(d.shape), long = ['nest', 'leafy', 'long'].includes(d.shape);
      const m = mk(ball ? GEO.sph : GEO.box, d.c, ball ? 0.034 : long ? 0.06 : 0.03, ball ? 0.034 : long ? 0.008 : 0.02, ball ? 0.034 : long ? 0.01 : 0.03, Math.cos(a) * r, 0.025, Math.sin(a) * r, this.pan);
      m.material = pm(d.c, {}); m.rotation.y = R.range(0, 3); this.pieces.push({ m, base: new THREE.Color(i % 2 ? d.c : d.c2), vy: 0, y: 0.025 });
    }
    ctx.ui.cookButtons([...(this.heat.gas ? [] : [{ id: 'fan', t: 'Quạt lửa' }]), { id: 'toss', t: this.single ? 'Lật mặt' : 'Đảo' }, { id: 'take', t: 'Nhấc chảo', hot: true }]);
    ctx.ui.cookHint((this.heat.gas ? 'Kéo cần chỉnh lửa vào vùng xanh. ' : 'Quạt để giữ lửa trong vùng xanh. ') + (this.single ? 'Lật một lần rồi nhấc chảo khi vừa chín.' : 'Vuốt lên trên chảo để đảo khi được nhắc.'));
  }
  btn(id: string, down: boolean) { if (!down) return; if (id === 'fan') this.heat.fan(); else if (id === 'toss') this.toss(); else if (id === 'take') this.take(); }
  slide(v: number) { this.heat.flame = v; }
  down(_p: THREE.Vector3, sx: number, sy: number) { this.sx = sx; this.sy = sy; }
  up(_p: THREE.Vector3 | null, sx: number, sy: number) { if (this.sy - sy > 34 && Math.abs(sx - this.sx) < 140) this.toss(); }
  private toss() {
    const need = this.single ? 1 : this.step.toss, due = (this.tossN + 1) / (need + 1);
    for (const p of this.pieces) { p.vy = 0.9 + Math.random() * 0.5; if (!this.single) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 0.105; p.m.userData.tx = Math.cos(a) * r; p.m.userData.tz = Math.sin(a) * r; } else p.m.userData.flip = Math.PI; }
    sfx('toss'); this.cook.puff(0, this.heat.top + 0.1, 0, 0xffffff, 2);
    if (this.tossN >= need) return;
    if (this.prompt > 0 || this.cookV >= due - 0.05) { this.tossN++; this.prompt = 0; this.flipped++; ctx.ui.floatAt(this.single ? 'Lật đẹp!' : 'Đảo đều!', this.cook.world(0, 0.4, 0), 'good'); }
    else { this.heat.temp *= 0.9; ctx.ui.floatAt('Còn sớm', this.cook.world(0, 0.4, 0), 'info'); }
  }
  private take() {
    const c = this.cookV, cs = c < 0.9 ? clamp((c - 0.4) / 0.5) : c <= 1.12 ? 1 : clamp(1 - (c - 1.12) * 3);
    const need = this.single ? 1 : this.step.toss, lack = Math.max(0, need - this.tossN);
    this.result = cs * (1 - clamp(this.burn * 1.5)) * (1 - 0.1 * this.missed - 0.12 * lack);
    ctx.ui.floatAt(c < 0.75 ? 'Còn sống!' : c > 1.2 || this.burn > 0.3 ? 'Khét rồi!' : 'Vừa chín tới!', this.cook.world(0, 0.4, 0), c < 0.75 || this.burn > 0.3 ? 'bad' : 'good');
  }
  update(dt: number) {
    const H = this.heat, t = H.temp; H.update(dt);
    const f = t < this.lo ? 0.3 + 0.7 * (t / this.lo) * (t / this.lo) : t <= this.hi ? 1 : 1.3;
    this.cookV += (dt / this.step.secs) * f * 1.02;
    if (t > this.hi) this.burn += dt * (t - this.hi) * 1.1; if (this.cookV > 1.14) this.burn += dt * 0.14;
    const need = this.single ? 1 : this.step.toss;
    if (this.tossN < need) { const due = (this.tossN + 1) / (need + 1); if (this.cookV >= due && this.prompt === 0) { this.prompt = 2.6; ctx.ui.cookHint(this.single ? 'LẬT MẶT ngay!' : 'ĐẢO ngay! Vuốt lên trên chảo.'); sfx('ding'); }
      if (this.prompt > 0) { this.prompt -= dt; if (this.prompt <= 0) { this.prompt = 0; this.tossN++; this.missed++; this.burn += 0.1; ctx.ui.floatAt('Dính chảo!', this.cook.world(0, 0.4, 0), 'bad'); } } }
    const k = clamp(this.cookV * 0.8), b = clamp(this.burn * 1.6);
    for (const p of this.pieces) {
      (p.m.material as THREE.MeshPhongMaterial).color.copy(p.base).lerp(GOLD, k * (this.single && p.base.r > 0.9 ? 0.25 : 0.7)).lerp(BURNT, b);
      if (p.vy !== 0 || p.m.position.y > p.y) { p.m.position.y += p.vy * dt; p.vy -= 5.5 * dt; if (p.m.userData.tx !== undefined) { p.m.position.x += (p.m.userData.tx - p.m.position.x) * dt * 6; p.m.position.z += (p.m.userData.tz - p.m.position.z) * dt * 6; p.m.rotation.x += dt * 9; }
        if (p.m.userData.flip > 0) { const d = Math.min(p.m.userData.flip, dt * 9); p.m.rotation.x += d; p.m.userData.flip -= d; }
        if (p.m.position.y <= p.y) { p.m.position.y = p.y; p.vy = 0; if (!this.single) p.m.rotation.x = 0; } }
      else if (t > 0.3 && !this.single) { p.m.position.y = p.y + Math.abs(Math.sin(this.cook.time * 30 + p.m.id)) * 0.003 * t; }
    }
    this.pan.position.x = this.prompt > 0 ? Math.sin(this.cook.time * 40) * 0.004 : 0;
    this.smokeT -= dt; if (this.smokeT <= 0) { this.smokeT = 0.25; if (t > 0.35) this.cook.puff(0, H.top + 0.08, 0, b > 0.15 || t > this.hi + 0.1 ? 0x4a4642 : 0xf3f3f3, 1, t > this.hi ? 0.16 : 0.1); }
    ctx.sound.loop('sizzle', clamp(t * 1.2) * (this.result === null ? 1 : 0));
    ctx.ui.cookHeat(t, this.lo, this.hi); ctx.ui.cookProg(this.cookV / 1.4, 0.9 / 1.4, 1.12 / 1.4, 'Độ chín');
    if (this.burn >= 0.7 && this.result === null) { this.result = 0.05; ctx.ui.floatAt('Cháy đen!', this.cook.world(0, 0.4, 0), 'bad'); }
    if (this.cookV > 0.9 && this.cookV < 0.96 && this.tossN >= need) ctx.ui.cookHint('Chín tới rồi — NHẤC CHẢO!');
    if (this.result !== null) { ctx.sound.loop('sizzle', 0); return this.result; }
    return null;
  }
}

// ───────────────────────── 3. NƯỚNG ─────────────────────────
export class GrillGame implements Mini {
  planeH = 0.25; frame: [number, number, number] = [0.74, 0.62, 0.02]; private heat!: Heat; private items: { g: THREE.Group; mat: THREE.MeshPhongMaterial; dot: THREE.Mesh; d: [number, number]; down: 0 | 1; x: number; flip: number }[] = [];
  private result: number | null = null; private smokeT = 0; private lo = 0.48; private hi = 0.8; private said = false;
  constructor(private cook: Cook, private step: GrillStep, private r: RecipeDef, private portions: number) { const w = clamp(cook.ease, 0.7, 1.35); this.lo = 0.64 - 0.16 * w; this.hi = 0.64 + 0.16 * w; }
  start() {
    const st = this.cook.stage, d = INGS[this.step.ing]; this.heat = new Heat(this.cook, st); const top = this.heat.top + 0.014; this.planeH = top + 0.03;
    const mb = new MB(); grateModel(mb, 0, top, 0, 0.5, 0.32); st.add(this.cook.meshOf(mb, MAT.lit));
    const n = clamp(this.portions, 1, 4), look = this.step.look ?? 'whole';
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 0.115, g = new THREE.Group(), mat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 30, specular: 0x222222 }), im = new MB();
      if (look === 'whole') { im.frame(0, 0, Math.PI / 2); ingModel(im, d, 0, -0.03, 0, d.shape === 'corn' || d.shape === 'long' ? 1.05 : 0.95); }
      else if (look === 'skewer') { im.rod(0, 0, 0.02, 0.004, 0.3, 0xd9c38a, Math.PI / 2, 0, 5); for (let k = 0; k < 4; k++) im.sph(0, 0, -0.1 + k * 0.055, 0.026, 0.022, 0.026, k % 2 ? d.c : d.c2, 7); }
      else { im.box(0, -0.012, 0, 0.09, 0.024, 0.15, d.c, d.c2, 0, true); im.box(0.02, 0.012, 0, 0.012, 0.004, 0.13, d.c2); }
      g.add(new THREE.Mesh(im.build(), mat)); g.position.set(x, top + 0.035, 0); st.add(g);
      const dot = mk(GEO.sph, 0xffffff, 0.026, 0.026, 0.026, x, top + 0.02, 0.2, st); dot.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.items.push({ g, mat, dot, d: [0, 0], down: 0, x, flip: 0 });
    }
    ctx.ui.cookButtons([...(this.heat.gas ? [] : [{ id: 'fan', t: 'Quạt than' }]), { id: 'take', t: 'Gắp ra', hot: true }]);
    ctx.ui.cookHint('Chạm từng món để lật. Chấm tròn chuyển XANH là mặt dưới vừa chín, ĐỎ là sắp khét.');
  }
  btn(id: string, down: boolean) { if (!down) return; if (id === 'fan') this.heat.fan(); else if (id === 'take') this.take(); }
  slide(v: number) { this.heat.flame = v; }
  down(p: THREE.Vector3) {
    let best = -1, bd = 0.07; this.items.forEach((it, i) => { const dd = Math.abs(it.x - p.x); if (dd < bd && Math.abs(p.z) < 0.24) { bd = dd; best = i; } });
    if (best < 0) return; const it = this.items[best]; if (it.flip > 0) return;
    it.down = it.down ? 0 : 1; it.flip = Math.PI; sfx('flip'); this.cook.puff(it.x, this.heat.top + 0.08, 0, 0xdddddd, 2);
  }
  private sc(d: number) { return d < 0.85 ? clamp((d - 0.3) / 0.55) : d <= 1.3 ? 1 : clamp(1 - (d - 1.3) * 2); }
  private take() { this.result = this.items.reduce((a, it) => a + (this.sc(it.d[0]) + this.sc(it.d[1])) / 2, 0) / this.items.length; const mn = Math.min(...this.items.flatMap((i) => i.d)), mx = Math.max(...this.items.flatMap((i) => i.d)); ctx.ui.floatAt(mx > 1.55 ? 'Khét mất rồi!' : mn < 0.7 ? 'Còn sống!' : 'Thơm lừng!', this.cook.world(0, 0.45, 0), mx > 1.55 || mn < 0.7 ? 'bad' : 'good'); }
  update(dt: number) {
    const H = this.heat, t = H.temp; H.update(dt);
    const f = t < this.lo ? 0.25 + 0.75 * (t / this.lo) * (t / this.lo) : t <= this.hi ? 1 : 1.55;
    let ready = true, burnt = true;
    for (const it of this.items) {
      const mul = 1.14 - Math.abs(it.x) * 1.5; it.d[it.down] += (dt / this.step.secs) * 2 * f * mul * (it.d[it.down] > 1 ? 0.6 : 1);   // chín rồi thì sém chậm lại: kịp tay lật 3–4 món
      if (it.flip > 0) { const d = Math.min(it.flip, dt * 12); it.g.rotation.z += d; it.flip -= d; it.g.position.y = this.heat.top + 0.049 + Math.sin(it.flip) * 0.05; }
      const up = it.d[it.down ? 0 : 1], dn = it.d[it.down];
      col.setRGB(1, 1, 1).lerp(GOLD, clamp(up * 0.85)).lerp(BURNT, clamp((up - 1.15) * 1.8)); it.mat.color.copy(col); it.mat.emissive.setRGB(0.25 * clamp(dn - 0.2) * t, 0.06 * t, 0);
      (it.dot.material as THREE.MeshBasicMaterial).color.setHex(dn < 0.55 ? 0xf3f0e8 : dn < 0.85 ? 0xf5c531 : dn <= 1.3 ? 0x3fd06a : 0xe2402f); it.dot.scale.setScalar(dn >= 0.85 && dn <= 1.3 ? 0.032 + Math.sin(this.cook.time * 10) * 0.005 : 0.026);
      if (it.d[0] < 0.85 || it.d[1] < 0.85) ready = false; if (it.d[0] < 1.8 || it.d[1] < 1.8) burnt = false;
      if (dn > 1.35 && Math.random() < dt * 3) this.cook.puff(it.x, this.heat.top + 0.06, 0, 0x3a3632, 1, 0.12);
    }
    this.smokeT -= dt; if (this.smokeT <= 0) { this.smokeT = 0.3; if (t > 0.3) this.cook.puff((Math.random() - 0.5) * 0.3, H.top + 0.06, 0, 0xe9e9e9, 1, 0.09); }
    ctx.sound.loop('sizzle', clamp(t) * 0.7 * (this.result === null ? 1 : 0)); ctx.ui.cookHeat(t, this.lo, this.hi);
    const avg = this.items.reduce((a, it) => a + Math.min(1, it.d[0]) + Math.min(1, it.d[1]), 0) / (this.items.length * 2); ctx.ui.cookProg(avg, 0.85, 1, 'Độ chín');
    if (ready && !this.said) { this.said = true; ctx.ui.cookHint('Chín đều hai mặt rồi — GẮP RA kẻo khét!'); sfx('ding'); }
    if (burnt && this.result === null) this.result = 0.03;
    if (this.result !== null) { ctx.sound.loop('sizzle', 0); return this.result; }
    return null;
  }
}

// ───────────────────────── 4. NẤU / NINH / LUỘC / PHA ─────────────────────────
export class BoilGame implements Mini {
  planeH = 0.3; frame: [number, number, number] = [1.06, 0.74, -0.03]; private heat!: Heat; private bowls: { g: THREE.Group; x: number; z: number; id: string; fly: number }[] = []; private liquid!: THREE.Mesh; private bub: THREE.Mesh[] = []; private foam: THREE.Mesh[] = [];
  private phase: 'add' | 'cook' = 'add'; private prog = 0; private zoneT = 0; private total = 0; private pen = 0; private overT = 0; private skimDone = 0; private foamT = 0; private result: number | null = null; private lo = 0.45; private hi = 0.7; private brew: boolean; private surf = 0;
  private c0 = new THREE.Color(0xcfe6f2); private c1: THREE.Color;
  constructor(private cook: Cook, private step: BoilStep) {
    this.brew = step.mode === 'pha'; const w = clamp(cook.ease, 0.7, 1.35), mid = step.mode === 'luộc' ? 0.74 : step.mode === 'cơm' ? 0.58 : 0.55; this.lo = mid - 0.14 * w; this.hi = mid + 0.14 * w; this.c1 = new THREE.Color(step.col);
  }
  start() {
    const st = this.cook.stage; this.heat = new Heat(this.cook, st); const top = this.heat.top; this.surf = top + 0.155; this.planeH = this.surf;
    const mb = new MB(); potModel(mb, 0, top, 0, 1); st.add(this.cook.meshOf(mb, MAT.lit));
    this.liquid = mk(GEO.disc, 0xcfe6f2, 0.335, 0.004, 0.335, 0, this.surf, 0, st); this.liquid.material = pm(0xcfe6f2, { opacity: 0.92 });
    for (let i = 0; i < 7; i++) { const b = mk(GEO.sph, 0xffffff, 0.02, 0.012, 0.02, 0, this.surf + 0.004, 0, st); b.material = pm(0xffffff, { opacity: 0.6 }); b.visible = false; this.bub.push(b); }
    const adds = this.step.adds, n = adds.length;
    adds.forEach((id, i) => {
      const x = n === 1 ? -0.38 : -0.44 + (0.88 * i) / (n - 1), z = -0.26 + Math.abs(x) * 0.5, g = new THREE.Group(), d = INGS[id];
      mk(GEO.disc, 0xf3f0e8, 0.15, 0.03, 0.15, 0, 0.015, 0, g); const im = new MB(); ingModel(im, d, 0, 0.03, 0, d.shape === 'bag' || d.shape === 'coal' ? 0.35 : 0.62); g.add(this.cook.meshOf(im));
      g.position.set(x, 0, z); st.add(g); this.bowls.push({ g, x, z, id, fly: -1 });
    });
    this.labels(); ctx.ui.cookHint('Chạm từng chén nguyên liệu để cho vào nồi.'); ctx.ui.cookProg(0, 0, 0, 'Cho nguyên liệu');
  }
  private labels() { ctx.ui.cookLabels(this.bowls.filter((b) => b.fly < 0).map((b) => ({ t: INGS[b.id].name, p: this.cook.world(b.x, 0.1, b.z) }))); }
  btn(id: string, down: boolean) {
    if (!down) return; if (id === 'fan') this.heat.fan();
    if (id === 'done' && this.brew) { const s = this.prog; this.result = (s < 0.78 ? Math.pow(clamp(s / 0.78), 1.6) : s <= 1.0 ? 1 : clamp(1 - (s - 1) * 2.6)) - this.pen; ctx.ui.floatAt(s < 0.7 ? 'Còn nhạt!' : s > 1.08 ? 'Đắng chát!' : 'Vừa đậm!', this.cook.world(0, 0.5, 0), s < 0.7 || s > 1.08 ? 'bad' : 'good'); }
  }
  slide(v: number) { this.heat.flame = v; }
  down(p: THREE.Vector3) {
    if (this.phase === 'add') { for (const b of this.bowls) if (b.fly < 0 && Math.hypot(b.x - p.x, b.z - p.z) < 0.11) { b.fly = 0; sfx('plop'); this.labels(); break; } }
    else this.move(p);
  }
  move(p: THREE.Vector3) { for (const f of this.foam) if (f.visible && Math.hypot(f.position.x - p.x, f.position.z - p.z) < 0.055) { f.visible = false; sfx('skim'); this.cook.puff(f.position.x, this.surf + 0.03, f.position.z, 0xffffff, 1, 0.06); } }
  update(dt: number) {
    const H = this.heat; H.update(dt); const t = H.temp, st = this.step;
    for (const b of this.bowls) if (b.fly >= 0 && b.fly < 1) { b.fly = Math.min(1, b.fly + dt * 2.6); const k = b.fly; b.g.position.set(lerp(b.x, 0, k), Math.sin(k * Math.PI) * 0.22 + this.surf * k, lerp(b.z, 0, k)); b.g.scale.setScalar(1 - k * 0.7); if (k >= 1) { b.g.visible = false; this.cook.puff(0, this.surf + 0.05, 0, 0xffffff, 3, 0.08); } }
    if (this.phase === 'add') {
      if (this.bowls.every((b) => b.fly >= 1)) {
        this.phase = 'cook'; ctx.ui.cookLabels([]);
        ctx.ui.cookButtons([...(H.gas ? [] : [{ id: 'fan', t: 'Quạt lửa' }]), ...(this.brew ? [{ id: 'done', t: 'Lọc ra', hot: true }] : [])]);
        ctx.ui.cookHint(this.brew ? 'Ủ cho vừa đậm rồi bấm LỌC RA đúng lúc thanh chạy vào vùng xanh.' : st.mode === 'cơm' ? 'Giữ lửa vừa (vùng xanh) cho cơm chín đều, đừng để trào.' : 'Giữ lửa liu riu trong vùng xanh' + (st.skim ? ', vuốt ngang mặt nồi để vớt bọt.' : '.'));
        if (this.brew) H.flame = Math.max(H.flame, 0.6);
      }
      ctx.ui.cookHeat(t, this.lo, this.hi); return null;
    }
    this.total += dt;
    if (this.brew) { this.prog += (dt / st.secs) * (0.6 + 0.4 * clamp(t / 0.5)); ctx.ui.cookProg(this.prog / 1.3, 0.78 / 1.3, 1 / 1.3, 'Độ đậm'); if (this.prog > 1.3 && this.result === null) this.result = 0.2; }
    else {
      const inZ = t >= this.lo && t <= this.hi; if (inZ) this.zoneT += dt;
      this.prog += (dt / st.secs) * (inZ ? 1 : t < this.lo ? 0.3 + 0.4 * (t / this.lo) : 0.85);
      if (t > this.hi + 0.1) { this.overT += dt; if (this.overT > 1.6) { this.overT = 0; this.pen += 0.12; ctx.ui.floatAt('Trào nồi!', this.cook.world(0, 0.5, 0), 'bad'); this.cook.puff(0, this.surf + 0.05, 0, 0xffffff, 5, 0.14); sfx('hiss'); } } else this.overT = Math.max(0, this.overT - dt);
      if (this.skimDone < st.skim && this.prog >= (this.skimDone + 1) / (st.skim + 1)) { this.skimDone++; this.foamT = 5; ctx.ui.cookHint('Bọt nổi lên — VUỐT ngang mặt nồi để vớt!'); sfx('ding');
        for (let i = 0; i < 4; i++) { let f = this.foam.find((q) => !q.visible); if (!f) { f = mk(GEO.sph, 0xfffdf2, 0.07, 0.02, 0.06, 0, 0, 0, this.cook.stage); this.foam.push(f); } const a = Math.random() * 6.28, r = 0.03 + Math.random() * 0.09; f.position.set(Math.cos(a) * r, this.surf + 0.008, Math.sin(a) * r); f.visible = true; } }
      if (this.foamT > 0) { this.foamT -= dt; if (this.foamT <= 0) for (const f of this.foam) if (f.visible) { f.visible = false; this.pen += 0.06; ctx.ui.floatAt('Nước đục', this.cook.world(f.position.x, 0.5, 0), 'warn'); } }
      ctx.ui.cookProg(this.prog, 0, 0, st.mode === 'cơm' ? 'Cơm chín' : 'Tiến độ');
      if (this.prog >= 1 && this.result === null) this.result = clamp(0.42 + 0.58 * (this.zoneT / Math.max(0.1, this.total)) + 0.06 - this.pen, 0.03, 1);
    }
    (this.liquid.material as THREE.MeshPhongMaterial).color.copy(this.c0).lerp(this.c1, clamp(Math.sqrt(Math.max(0, this.prog)) * 1.05));
    this.bub.forEach((b, i) => { const on = t > 0.28; b.visible = on; if (on) { const ph = (this.cook.time * (0.8 + t * 2.2) + i * 0.37) % 1; if (ph < dt * 3) { const a = Math.random() * 6.28, r = Math.random() * 0.13; b.position.set(Math.cos(a) * r, this.surf + 0.004, Math.sin(a) * r); } b.scale.setScalar(0.008 + ph * 0.03 * (0.4 + t)); b.scale.y *= 0.6; } });
    if (t > 0.4 && Math.random() < dt * 4 * t) this.cook.puff((Math.random() - 0.5) * 0.2, this.surf + 0.05, 0, 0xffffff, 1, 0.1);
    ctx.sound.loop('boil', clamp((t - 0.25) * 1.6) * (this.result === null ? 1 : 0)); ctx.ui.cookHeat(t, this.lo, this.hi);
    if (this.result !== null) { ctx.sound.loop('boil', 0); return clamp(this.result); }
    return null;
  }
}

// ───────────────────────── 5. TRÌNH BÀY ─────────────────────────
const VES: Record<Vessel, { R: number; y0: number; H: number }> = {
  bowl: { R: 0.085, y0: 0.02, H: 0.05 }, plate: { R: 0.11, y0: 0.014, H: 0.004 }, box: { R: 0.075, y0: 0.012, H: 0.02 }, bread: { R: 0.062, y0: 0.034, H: 0.004 }, cup: { R: 0.04, y0: 0.008, H: 0.09 },
  glass: { R: 0.036, y0: 0.008, H: 0.11 }, paper: { R: 0.08, y0: 0.012, H: 0.004 }, bun: { R: 0.062, y0: 0.03, H: 0.004 }, roll: { R: 0.085, y0: 0.007, H: 0.003 },
};
export class AssembleGame implements Mini {
  planeH = 0.04; frame: [number, number, number] = [1.0, 0.6, -0.03]; private bowls: { g: THREE.Group; x: number; z: number; li: number; shake: number }[] = []; private cur = 0; private mistakes = 0; private pours: number[] = []; private pouring = false; private fill = 0; private t = 0; private doneT = -1;
  private ves = new THREE.Group(); private y = 0; private liq: THREE.Mesh | null = null; private stream!: THREE.Mesh; private V: { R: number; y0: number; H: number }; private R = new RNG(11); private topper: THREE.Object3D | null = null; private pourBowl = -1;
  constructor(private cook: Cook, private step: AssembleStep, private r: RecipeDef) { this.V = VES[r.vessel]; this.y = this.V.y0; }
  start() {
    const st = this.cook.stage, v = this.r.vessel, mb = new MB(), W = 0xfbfaf5;
    if (v === 'bowl') { mb.cyl(0, 0, 0, 0.06, 0.075, W, 16, 0.118, false, 0xffffff); mb.cyl(0, 0, 0, 0.06, 0.012, 0xe9e6dc, 16); mb.cyl(0, 0.012, 0, 0.058, 0.06, 0xdfdcd2, 16, 0.112, false); mb.cyl(0, 0.012, 0, 0.058, 0.003, 0xf3f1ea, 16); }
    else if (v === 'plate') { mb.cyl(0, 0, 0, 0.1, 0.014, W, 20, 0.15, true, 0xffffff); mb.cyl(0, 0.0145, 0, 0.118, 0.002, 0xf1efe8, 20); }
    else if (v === 'box') { mb.box(0, 0, 0, 0.22, 0.045, 0.16, 0xf7f3e6, 0xfdfbf2, 0.06); mb.box(0, 0.011, 0, 0.2, 0.002, 0.14, 0xffffff); mb.box(0, 0.04, -0.155, 0.22, 0.012, 0.15, 0xf3eedc, 0xfbf8ee, 0, true); }
    else if (v === 'bread') { mb.sph(0, 0.016, 0.012, 0.15, 0.022, 0.05, 0xd9a05a, 9, 0xe9b56a); mb.box(0, 0.03, 0.012, 0.25, 0.004, 0.07, 0xf7e9c8); }
    else if (v === 'cup' || v === 'glass') { const h = v === 'cup' ? 0.11 : 0.13, r = v === 'cup' ? 0.043 : 0.038; mb.cyl(0, 0, 0, r, 0.008, 0xdfe9ee, 14); }
    else if (v === 'paper') { mb.box(0, 0, 0, 0.24, 0.012, 0.15, 0xf3e6c8, 0xf9efd6, 0.05); }
    else if (v === 'bun') { mb.cyl(0, 0, 0, 0.066, 0.03, 0xd9a05a, 14, 0.07, true, 0xe9b56a); mb.cyl(0, 0.03, 0, 0.066, 0.002, 0xf7e2b0, 14); }
    else if (v === 'roll') { mb.cyl(0, 0, 0, 0.125, 0.006, 0xfbfaf0, 20); }
    this.ves.add(this.cook.meshOf(mb, MAT.food));
    if (v === 'cup' || v === 'glass') { const h = v === 'cup' ? 0.11 : 0.13, r = v === 'cup' ? 0.045 : 0.04, wall = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.2, r, h, 16, 1, true), pm(0xdff2fa, { opacity: 0.28 })); wall.position.y = h / 2; wall.renderOrder = 4; (wall.material as THREE.Material).side = THREE.DoubleSide; (wall.material as THREE.Material).depthWrite = false; this.ves.add(wall); }
    this.ves.position.set(0, 0, 0.1); st.add(this.ves);
    this.stream = mk(GEO.cyl, 0xffffff, 0.012, 1, 0.012, 0, 0, 0, st); this.stream.visible = false;
    // xếp các chén nguyên liệu theo hình vòng cung, vị trí cố định cho từng món để người chơi quen tay
    const L = this.step.layers, n = L.length, order = new RNG(hashStr(this.r.id)).shuffle(L.map((_, i) => i));
    order.forEach((li, k) => {
      const l = L[li], x = (k - (n - 1) / 2) * Math.min(0.2, 0.96 / n), z = -0.21 + Math.abs(x) * 0.42, g = new THREE.Group(), c = ingCol(l.ing, l.col), liquid = l.look === 'liquid';
      if (liquid) { mk(GEO.cyl, 0xc9d3da, 0.1, 0.12, 0.1, 0, 0.06, 0, g); mk(GEO.disc, c, 0.09, 0.004, 0.09, 0, 0.121, 0, g); mk(GEO.box, 0xc9d3da, 0.03, 0.012, 0.06, 0, 0.1, 0.07, g); }
      else { mk(GEO.disc, 0xf3f0e8, 0.15, 0.028, 0.15, 0, 0.014, 0, g); if (l.look === 'ice') for (let i = 0; i < 5; i++) mk(GEO.box, 0xdff4ff, 0.028, 0.028, 0.028, (i % 3 - 1) * 0.035, 0.045 + (i > 2 ? 0.02 : 0), (i % 2 - 0.5) * 0.04, g).material = pm(0xdff4ff, { opacity: 0.75 });
        else if (INGS[l.ing] && ['whole', 'slices', 'chunks'].includes(l.look) && !l.col) { const im = new MB(); ingModel(im, INGS[l.ing], 0, 0.028, 0, 0.6); g.add(this.cook.meshOf(im)); }
        else mk(GEO.sph, c, 0.12, 0.05, 0.12, 0, 0.035, 0, g); }
      g.position.set(x, 0, z); st.add(g); this.bowls.push({ g, x, z, li, shake: 0 });
    });
    this.refresh(); ctx.ui.cookHint('Cho từng thứ vào theo đúng thứ tự trên phiếu. Với nước: nhấn giữ để rót, thả tay khi vào vùng xanh.');
  }
  private refresh() {
    const L = this.step.layers; ctx.ui.cookCard(L.map((l, i) => ({ t: ingName(l.ing, l.name), state: i < this.cur ? 2 : i === this.cur ? 1 : 0 })));
    ctx.ui.cookLabels(this.bowls.map((b) => ({ t: ingName(L[b.li].ing, L[b.li].name), p: this.cook.world(b.x, 0.16, b.z), cur: b.li === this.cur, done: b.li < this.cur })));
    ctx.ui.cookProg(L[this.cur]?.look === 'liquid' ? 0 : null, 0.8 / 1.25, 1.02 / 1.25, 'Mực rót');
  }
  down(p: THREE.Vector3) {
    if (this.doneT >= 0) return; const L = this.step.layers;
    const bi = this.bowls.findIndex((b) => Math.hypot(b.x - p.x, b.z - p.z) < 0.095); if (bi < 0) return; const b = this.bowls[bi];
    if (b.li !== this.cur) { if (b.li < this.cur) return; this.mistakes++; b.shake = 0.35; sfx('bad'); ctx.ui.floatAt('Sai thứ tự!', this.cook.world(b.x, 0.2, b.z), 'bad'); return; }
    const l = L[this.cur];
    if (l.look === 'liquid') { this.pouring = true; this.pourBowl = bi; if (!this.liq) { this.liq = mk(GEO.disc, ingCol(l.ing, l.col), this.V.R * 2, 0.004, this.V.R * 2, 0, this.y, 0, this.ves); this.liq.material = pm(ingCol(l.ing, l.col), { opacity: 0.88 }); } (this.stream.material as THREE.Material) = pm(ingCol(l.ing, l.col)); }
    else { this.add(l.look, ingCol(l.ing, l.col)); sfx('plop'); this.nextLayer(); }
  }
  up() {
    if (!this.pouring) return; this.pouring = false; this.stream.visible = false; ctx.sound.loop('pour', 0);
    if (this.fill < 0.45) { ctx.ui.floatAt('Rót thêm chút nữa', this.cook.world(0, 0.3, 0.1), 'info'); return; }
    this.endPour();
  }
  private endPour() {
    const f = this.fill, s = f < 0.8 ? clamp(f / 0.8) : f <= 1.02 ? 1 : clamp(1 - (f - 1.02) * 4); this.pours.push(s);
    ctx.ui.floatAt(f < 0.75 ? 'Hơi ít' : f > 1.06 ? 'Tràn rồi!' : 'Vừa đẹp!', this.cook.world(0, 0.3, 0.1), s > 0.9 ? 'good' : 'warn');
    this.y += this.V.H * Math.min(1, f) + 0.002; this.fill = 0; this.liq = null; this.pouring = false; this.stream.visible = false; ctx.sound.loop('pour', 0); this.nextLayer();
  }
  private nextLayer() { this.cur++; if (this.cur >= this.step.layers.length) { this.doneT = 0.7; this.finishLook(); ctx.ui.cookLabels([]); ctx.ui.cookCard(this.step.layers.map((l) => ({ t: ingName(l.ing, l.name), state: 2 }))); ctx.ui.cookProg(null); } else this.refresh(); }
  private finishLook() {
    const v = this.r.vessel;
    if (v === 'bun') { const m = new MB(); m.sph(0, this.y + 0.012, 0, 0.07, 0.04, 0.07, 0xd9a05a, 10, 0xe9b56a); this.topper = this.cook.meshOf(m, MAT.food); this.topper.position.y = 0.25; this.ves.add(this.topper); }
    if (v === 'bread') { const m = new MB(); m.sph(0, this.y + 0.012, -0.012, 0.15, 0.026, 0.045, 0xd9a05a, 9, 0xe9b56a); this.topper = this.cook.meshOf(m, MAT.food); this.topper.position.y = 0.25; this.ves.add(this.topper); }
    if (v === 'roll') this.ves.userData.roll = 1;
  }
  /** Thêm một lớp hình ảnh vào món. */
  private add(look: Look, c: number) {
    const V = this.V, R = this.R, g = this.ves, y = this.y, wide = this.r.vessel === 'bread' ? 2 : 1, tiny = V.R < 0.05;
    const P = (geo: THREE.BufferGeometry, cc: number, sx: number, sy: number, sz: number, x: number, yy: number, z: number) => { const m = mk(geo, cc, sx, sy, sz, x * wide, yy, z, g); m.userData.pop = 0; return m; };
    switch (look) {
      case 'nest': P(GEO.sph, c, V.R * 1.75 * wide, 0.05, V.R * 1.75, 0, y + 0.012, 0); for (let i = 0; i < 5; i++) P(GEO.ring, shade(c, 0.93), V.R * (0.5 + i * 0.2), 0.03, V.R * (0.5 + i * 0.2), R.range(-0.01, 0.01), y + 0.03, R.range(-0.01, 0.01)); this.y += 0.03; break;
      case 'mound': P(GEO.sph, c, V.R * 1.2, 0.085, V.R * 1.15, -V.R * 0.42, y + 0.018, 0); this.y += 0.012; break;
      case 'slices': for (let i = 0; i < 4; i++) { const m = P(GEO.disc, i % 2 ? c : shade(c, 1.12), 0.045, 0.006, 0.045, tiny ? 0 : (i - 1.5) * 0.03 + V.R * 0.25, y + 0.006 + i * 0.003, tiny ? 0 : V.R * 0.2); m.rotation.z = 0.25; } this.y += 0.014; break;
      case 'chunks': for (let i = 0; i < 5; i++) P(GEO.box, i % 2 ? c : shade(c, 0.85), 0.032, 0.024, 0.028, R.range(-0.4, 0.5) * V.R, y + 0.012, R.range(-0.5, 0.5) * V.R).rotation.y = R.range(0, 3); this.y += 0.018; break;
      case 'greens': for (let i = 0; i < 7; i++) P(GEO.sph, i % 2 ? c : shade(c, 1.2), 0.034, 0.006, 0.02, R.range(-0.7, 0.7) * V.R, y + 0.006 + i * 0.001, R.range(-0.7, 0.7) * V.R).rotation.y = R.range(0, 3); this.y += 0.007; break;
      case 'drizzle': for (let i = 0; i < 6; i++) P(GEO.box, c, V.R * 1.3, 0.003, 0.007, 0, y + 0.004, (i - 2.5) * V.R * 0.28).rotation.y = i % 2 ? 0.5 : -0.5; this.y += 0.004; break;
      case 'sprinkle': for (let i = 0; i < 12; i++) P(GEO.sph, c, 0.011, 0.008, 0.011, R.range(-0.8, 0.8) * V.R, y + 0.005, R.range(-0.8, 0.8) * V.R); this.y += 0.004; break;
      case 'whole': for (let i = 0; i < 2; i++) P(GEO.sph, c, 0.085, 0.03, 0.05, V.R * 0.25 + i * 0.02, y + 0.015 + i * 0.012, (i - 0.5) * 0.05).rotation.y = 0.4; this.y += 0.022; break;
      case 'ice': for (let i = 0; i < 5; i++) { const m = P(GEO.box, 0xdff4ff, 0.024, 0.024, 0.024, R.range(-0.5, 0.5) * V.R, y + 0.012 + i * 0.012, R.range(-0.5, 0.5) * V.R); m.material = pm(0xdff4ff, { opacity: 0.7 }); m.rotation.set(R.next(), R.next(), 0); } this.y += tiny ? 0.012 : 0.02; break;
      case 'egg': P(GEO.disc, 0xfdfbf2, 0.11, 0.006, 0.1, 0, y + 0.004, 0); P(GEO.sph, 0xf5a81e, 0.04, 0.022, 0.04, 0.01, y + 0.012, 0); this.y += 0.012; break;
      case 'balls': for (let i = 0; i < 6; i++) P(GEO.sph, c, tiny ? 0.016 : 0.03, tiny ? 0.016 : 0.03, tiny ? 0.016 : 0.03, R.range(-0.6, 0.6) * V.R, y + 0.012 + (tiny ? i * 0.004 : 0), R.range(-0.6, 0.6) * V.R); this.y += tiny ? 0.02 : 0.022; break;
      case 'sticks': for (let i = 0; i < 4; i++) P(GEO.box, c, 0.09, 0.012, 0.012, 0, y + 0.008, (i - 1.5) * 0.02); this.y += 0.014; break;
      case 'patty': P(GEO.disc, c, 0.125, 0.022, 0.125, 0, y + 0.011, 0); this.y += 0.022; break;
      default: break;
    }
  }
  update(dt: number) {
    this.t += dt;
    for (const b of this.bowls) { if (b.shake > 0) { b.shake -= dt; b.g.position.x = b.x + Math.sin(b.shake * 60) * 0.008; } else b.g.position.x = b.x; const cur = b.li === this.cur; b.g.position.y = cur ? 0.008 + Math.sin(this.t * 5) * 0.006 : 0; b.g.visible = b.li >= this.cur || this.pourBowl === this.bowls.indexOf(b); if (b.li < this.cur) b.g.scale.setScalar(0.8); }
    for (const m of this.ves.children) if (m.userData.pop !== undefined && m.userData.pop < 1) { m.userData.pop = Math.min(1, m.userData.pop + dt * 6); m.position.y += (1 - m.userData.pop) * 0.004; }
    if (this.pouring) {
      this.fill += dt * 0.62; const b = this.bowls[this.pourBowl]; ctx.sound.loop('pour', 0.8);
      if (this.liq) { this.liq.position.y = this.y + this.V.H * Math.min(1.1, this.fill); const s = this.V.R * (this.r.vessel === 'bowl' ? 1.4 + 0.9 * Math.min(1, this.fill) : 2); this.liq.scale.set(s, 0.004, s); }
      const ax = b.x, ay = 0.26, az = b.z + 0.06, bx = 0, by = this.y + 0.02, bz = 0.1, len = Math.hypot(ax - bx, ay - by, az - bz);
      this.stream.visible = true; this.stream.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); this.stream.scale.set(0.012, len, 0.012); this.stream.lookAt(this.cook.world(bx, by, bz)); this.stream.rotateX(Math.PI / 2);
      b.g.position.y = 0.2; b.g.rotation.z = b.x > 0 ? 0.7 : -0.7;
      ctx.ui.cookProg(this.fill / 1.25, 0.8 / 1.25, 1.02 / 1.25, 'Mực rót'); if (this.fill > 1.22) this.endPour();
    } else if (this.pourBowl >= 0) { this.bowls[this.pourBowl].g.rotation.z = 0; }
    if (this.topper) this.topper.position.y = Math.max(0, this.topper.position.y - dt * 0.7);
    if (this.ves.userData.roll) { const k = Math.min(1, (0.7 - this.doneT) / 0.5); this.ves.scale.set(1, 1 + k * 2.2, 1 - k * 0.62); }
    if (this.doneT >= 0) { this.doneT -= dt; if (this.doneT < 0) { const n = this.step.layers.length, pour = this.pours.length ? this.pours.reduce((a, b) => a + b, 0) / this.pours.length : 1; return clamp((1 - 0.17 * this.mistakes) * (0.4 + 0.6 * pour) * timeFactor(this.t, n * 2 + 3)); } }
    return null;
  }
}

// ───────────────────────── Việc làm thêm: RỬA CHÉN ─────────────────────────
export class WashGame implements Mini {
  planeH = 0.03; frame: [number, number, number] = [0.92, 0.62, -0.04]; private plate = new THREE.Group(); private dirt: THREE.Mesh[] = []; private sponge!: THREE.Mesh; private n = 0; private t = 0; private slideT = 0; private held = false;
  constructor(private cook: Cook, private total: number) {}
  start() {
    const st = this.cook.stage; mk(GEO.box, 0x5f6f7a, 0.62, 0.02, 0.42, 0, -0.01, 0, st); mk(GEO.box, 0x8fc6e0, 0.58, 0.004, 0.38, 0, 0.004, 0, st).material = pm(0x8fc6e0, { opacity: 0.55 });
    mk(GEO.disc, 0xfbfaf5, 0.27, 0.012, 0.27, 0, 0.012, 0, this.plate); mk(GEO.disc, 0xf1efe8, 0.19, 0.002, 0.19, 0, 0.019, 0, this.plate); st.add(this.plate);
    this.sponge = mk(GEO.box, 0xf5c531, 0.07, 0.03, 0.05, 0.2, 0.04, 0.12, st); mk(GEO.box, 0x3f8a40, 1, 0.3, 1, 0, 0.6, 0, this.sponge);
    for (let i = 0; i < 7; i++) mk(GEO.disc, 0xfbfaf5, 0.24, 0.01, 0.24, 0.33 + (i % 2) * 0.01, 0.008 + i * 0.011, -0.3, st);
    this.newPlate(); ctx.ui.cookHint('Chà miếng rửa chén lên các vết bẩn cho tới khi đĩa sạch bong.'); ctx.ui.cookProg(0, 0, 0, `0/${this.total} cái`);
  }
  private newPlate() {
    for (const d of this.dirt) this.plate.remove(d); this.dirt = [];
    for (let i = 0; i < 5; i++) { const a = Math.random() * 6.28, r = Math.random() * 0.085, m = mk(GEO.sph, [0x8a5a2a, 0xa8552e, 0x6a7a3a, 0xc9a04a][i % 4], 0.05 + Math.random() * 0.03, 0.006, 0.04 + Math.random() * 0.03, Math.cos(a) * r, 0.022, Math.sin(a) * r, this.plate); m.userData.hp = 1; this.dirt.push(m); }
  }
  down(p: THREE.Vector3) { this.held = true; this.move(p); }
  up() { this.held = false; }
  move(p: THREE.Vector3) {
    if (!this.held || this.slideT > 0) return; const px = clamp(p.x, -0.28, 0.28), pz = clamp(p.z, -0.18, 0.18), dx = px - this.sponge.position.x, dz = pz - this.sponge.position.z, moved = Math.hypot(dx, dz);
    this.sponge.position.x = px; this.sponge.position.z = pz;
    for (const d of this.dirt) if (d.visible && Math.hypot(d.position.x - px, d.position.z - pz) < 0.055) { d.userData.hp -= moved * 4.5; d.scale.multiplyScalar(Math.max(0.6, 1 - moved * 2)); if (Math.random() < 0.3) this.cook.puff(px, 0.05, pz, 0xffffff, 1, 0.05); if (d.userData.hp <= 0) { d.visible = false; sfx('skim'); } }
    if (this.dirt.every((d) => !d.visible)) { this.n++; this.slideT = 0.45; sfx('ding'); ctx.ui.cookProg(this.n / this.total, 0, 0, `${this.n}/${this.total} cái`); }
  }
  update(dt: number) {
    this.t += dt;
    if (this.slideT > 0) { this.slideT -= dt; this.plate.position.x = (1 - this.slideT / 0.45) * 0.36; this.plate.position.z = -(1 - this.slideT / 0.45) * 0.3; if (this.slideT <= 0) { this.plate.position.set(0, 0, 0); if (this.n >= this.total) return clamp(1.2 - this.t / (this.total * 5.5), 0.4, 1); this.newPlate(); } }
    return null;
  }
}
export { mix };
