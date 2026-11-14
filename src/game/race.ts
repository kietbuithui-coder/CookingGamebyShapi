// ĐUA XE ĐẠP CHỦ NHẬT — phần chạy thật: con chạy quét qua vùng ăn điểm, người chơi bấm ĐẠP đúng nhịp.
// Ba vòng, chín nhịp; camera chạy dọc đường trước cổng công viên, con nhỏ đua cùng chạy bên cạnh.
import * as THREE from 'three';
import { ctx } from './ctx';
import { MB, MAT } from '../gfx/mb';
import { Rig, lookFromArch } from '../gfx/people';
import { ARCH } from '../data/people';
import { clamp, money, RNG } from '../core/util';
import { toast, sfx } from '../core/bus';
import * as RC from '../sim/race';
import * as R from '../sim/rules';

const X0 = 40, X1 = 78;                 // vạch xuất phát → vạch đích trên đường công viên
const Z_ME = -31.7, Z_RIVAL = -30.0;    // hai làn, con nhỏ chạy phía trong
const YAW = Math.PI / 2;                // nhìn về phía +x

/** Xe đạp của con nhỏ đua cùng (hướng +x). */
function rivalBike(col: number) {
  const m = new MB();
  for (const dx of [-0.42, 0.42]) { m.rod(dx, 0.34, 0, 0.34, 0.05, 0x1e2024, Math.PI / 2, 0, 10); m.rod(dx, 0.34, 0, 0.13, 0.035, 0xb9c0c8, Math.PI / 2, 0, 7); }
  m.rod(0, 0.62, 0, 0.03, 0.86, col, 0, Math.PI / 2 - 0.12, 6);
  m.rod(0.28, 0.72, 0, 0.026, 0.44, col, 0, 0.5, 6);
  m.rod(0.42, 0.9, 0, 0.022, 0.46, 0x9aa0a6, Math.PI / 2, 0, 5);
  m.box(-0.2, 0.84, 0, 0.22, 0.05, 0.12, 0x2a2c30, 0x34363a, 0, true);
  return m.build();
}

export class RaceSystem {
  active = false;
  private beats: RC.Beat[] = [];
  private idx = 0; private pos = 0; private scores: number[] = [];
  private seed = 1; private t = 0;
  private grp = new THREE.Group(); private rival = new THREE.Group(); private rig!: Rig;
  constructor() {
    ctx.scene.add(this.grp); this.grp.visible = false;
    const mesh = new THREE.Mesh(rivalBike(0xe86f9a), MAT.lit); mesh.castShadow = false; mesh.scale.setScalar(1.15);
    const look = lookFromArch(ARCH.hocsinh, new RNG(9), true);
    look.shirt = 0xe86f9a; look.pants = 0x2a3a6a;
    const rig = new Rig(); rig.setLook(look); rig.pose = 'ride'; rig.shadow(false); rig.blob.visible = false;
    rig.root.position.y = 0.34; this.rig = rig;
    this.rival.add(mesh, rig.root); this.grp.add(this.rival);
  }
  /** Bắt đầu lượt đua: đặt người chơi lên vạch, dựng con nhỏ bên cạnh. */
  start() {
    if (this.active) return;
    const g = ctx.g;
    this.seed = (g.seed ?? 1) * 31 + g.day * 7 + (g.flags.raceWin || 0) * 13;
    this.beats = RC.makeBeats(this.seed);
    this.idx = 0; this.pos = 0; this.scores = []; this.t = 0; this.active = true;
    ctx.player.place(X0, Z_ME, YAW, -0.06);
    // con nhỏ chạy với tốc độ cố định theo hạt giống: mạnh hay yếu thấy được bằng mắt
    this.rival.position.set(X0 - 1.2, 0, Z_RIVAL);
    this.grp.visible = true;
    ctx.mode = 'cook';
    ctx.ui.onCookBtn = (id, down) => { if (!down) return; if (id === 'quit') this.abort(); else if (id === 'dap') this.tap(); };
    ctx.ui.cookShow('ĐUA XE ĐẠP', ['vòng 1', 'vòng 2', 'vòng 3'], 0);
    ctx.ui.cookButtons([{ id: 'dap', t: 'ĐẠP!', hot: true }]);
    // hàng xóm kéo ra đứng xem cho có không khí chợ
    ctx.npcs.spectate(X0 + 6, Z_ME + 4, 4);
    this.paint();
    sfx('order');
  }
  /** Một nhịp: bấm lúc con chạy đang ở đâu thì ăn điểm chừng đó. */
  tap() {
    if (!this.active) return;
    const b = this.beats[this.idx]; if (!b) return;
    const q = RC.quality(this.pos, b);
    this.scores.push(q);
    sfx(q > 0.8 ? 'pick' : q > 0 ? 'ok' : 'bad');
    this.next();
  }
  private next() {
    this.idx++; this.pos = 0;
    if (this.idx >= RC.BEATS) this.finish(); else { this.paint(); sfx('pedal'); }
  }
  private paint() {
    const b = this.beats[this.idx]; if (!b) return;
    const lap = Math.min(RC.LAPS - 1, Math.floor(this.idx / RC.BEATS_PER_LAP)), beat = this.idx % RC.BEATS_PER_LAP + 1;
    ctx.ui.cookShow(`ĐUA XE ĐẠP — vòng ${lap + 1}/${RC.LAPS}`, ['vòng 1', 'vòng 2', 'vòng 3'], lap);
    ctx.ui.cookProg(this.pos, b.lo, b.hi, `nhịp ${beat}/${RC.BEATS_PER_LAP}`);
    ctx.ui.cookHint(this.idx === 0 ? 'Bấm ĐẠP khi con chạy vào vùng xanh. Đúng giữa thì ăn trọn điểm.' : [
      'Đạp đều tay, đừng nhìn bánh xe.', 'Con nhỏ đang bám sát — cố lên.', 'Còn nước rút, đạp mạnh vô!',
    ][Math.min(2, lap)]);
  }
  update(dt: number) {
    if (!this.active) return;
    this.t += dt;
    const b = this.beats[this.idx];
    this.pos = Math.min(1, this.pos + dt / RC.BEAT_SECONDS);
    if (b) ctx.ui.cookProg(this.pos, b.lo, b.hi, `nhịp ${this.idx % RC.BEATS_PER_LAP + 1}/${RC.BEATS_PER_LAP}`);
    // người chơi: tiến theo số nhịp đã qua + phần đang chạy
    const prog = Math.min(1, (this.idx + this.pos) / RC.BEATS);
    const px = X0 + prog * (X1 - X0);
    ctx.player.place(px, Z_ME, YAW, -0.05);
    // con nhỏ: chạy đều, nhanh chậm theo sức của nó
    const rp = Math.min(1, (this.t / (RC.BEATS * RC.BEAT_SECONDS)) * (0.86 + RC.rivalScore(this.seed) * 0.42));
    this.rival.position.set(X0 - 1.2 + rp * (X1 - X0), 0, Z_RIVAL);
    this.rival.rotation.y = 0; this.rig.pose = 'ride'; this.rig.update(dt, 0, 0);
    if (this.pos >= 1 && b) { this.scores.push(0); this.next(); }   // trượt nhịp
  }
  /** Bỏ dở: không mất gì thêm, chỉ mất năm phút đăng ký. */
  abort() {
    if (!this.active) return;
    this.stop();
    toast('Bỏ cuộc giữa chừng. Con Lan nhìn theo, cười.', 'info');
    sfx('boo');
  }
  private stop() {
    this.active = false; this.grp.visible = false;
    ctx.ui.onCookBtn = null; ctx.ui.cookHide();
    ctx.player.place(41, -34.1, Math.PI, 0);
    if (ctx.mode === 'cook') ctx.mode = 'play';
  }
  private finish() {
    const g = ctx.g, mine = this.scores.reduce((a, b) => a + b, 0);
    const res = RC.verdict(g, this.seed, mine);
    R.advance(g, RC.RACE_MINS, ctx.acts.act());
    if (res.prize) R.earn(g, res.prize, 'side');
    g.rep = clamp(g.rep + res.rep, 0, 100);
    R.consume(g, { m: res.mood, e: -6, hy: -3, t: -8 });
    g.flags.raceDay = g.day;
    if (res.win) g.flags.raceWin = (g.flags.raceWin || 0) + 1;
    this.stop();
    ctx.npcs.cheer(res.win);
    const diem = `${mine.toFixed(1)}/${RC.BEATS}`;
    if (res.win) { sfx('yay'); toast(`Thắng rồi! Ba vòng, ${diem} điểm — nhận ${money(res.prize)}, cả xóm biết mặt.`, 'good', 'star', true); }
    else { sfx('boo'); toast(`Con Lan về trước. Điểm của bạn ${diem}. Nó cười: “Tập thêm đi nghen.”`, 'warn', 'heart', true); }
  }
}
