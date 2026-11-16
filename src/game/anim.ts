// Hệ thống hoạt ảnh góc nhìn thứ ba & trò chơi nhỏ cho các hoạt động phố phường, giải trí và làm thêm.
import * as THREE from 'three';
import { ctx } from './ctx';
import { MB, MAT } from '../gfx/mb';
import { Pose } from '../gfx/people';
import { Npc, cupProp } from './npc';
import { clamp } from '../core/util';
import { toast } from '../core/bus';
import { LOTS, groundY, toWorld } from '../world/layout';
import {
  Board, Piece, ChessMove, CHESS_PRESETS, pieceSvg,
  boardFromRows, cloneBoard, isWhite, findKing, inCheck,
  legalMovesAt, allLegalMoves, applyMove, pickBestMove, moveLabel, sqName,
  autoDrawReason, claimableDrawReason, evaluateBoard,
} from './chess';

const sfx = (n: string) => ctx.sound.play(n);

// ── Đạo cụ 3D cầm tay cho nhân vật và các sự kiện (dùng lại BufferGeometry) ──────────
let _scissorsG: THREE.BufferGeometry | null = null;
let _guitarG: THREE.BufferGeometry | null = null;
let _brushG: THREE.BufferGeometry | null = null;
let _wrenchG: THREE.BufferGeometry | null = null;
let _trayG: THREE.BufferGeometry | null = null;
let _micG: THREE.BufferGeometry | null = null;
let _incenseG: THREE.BufferGeometry | null = null;
let _bowlG: THREE.BufferGeometry | null = null;
let _hammerG: THREE.BufferGeometry | null = null;
let _crateG: THREE.BufferGeometry | null = null;
let _clipG: THREE.BufferGeometry | null = null;
let _noteG: THREE.BufferGeometry | null = null;
let _batonG: THREE.BufferGeometry | null = null;
let _bottleG: THREE.BufferGeometry | null = null;

export function scissorsProp(): THREE.Mesh {
  if (!_scissorsG) {
    const m = new MB();
    m.box(-0.015, -0.02, 0.08, 0.012, 0.018, 0.22, 0xd8dee6, 0xf2f6fa);
    m.box(0.015, -0.02, 0.08, 0.012, 0.018, 0.22, 0xc2cad4, 0xe8eef5);
    m.cyl(-0.022, -0.02, -0.04, 0.022, 0.012, 0x2b2d30, 8);
    m.cyl(0.022, -0.02, -0.04, 0.022, 0.012, 0x2b2d30, 8);
    _scissorsG = m.build();
  }
  return new THREE.Mesh(_scissorsG, MAT.lit);
}

export function guitarProp(): THREE.Mesh {
  if (!_guitarG) {
    const m = new MB();
    m.cyl(0, -0.06, 0.14, 0.16, 0.07, 0xb86b2b, 12, 0.16, true, 0xd98a3c);
    m.cyl(0, -0.06, 0.28, 0.12, 0.07, 0xb86b2b, 12, 0.12, true, 0xd98a3c);
    m.cyl(0, 0.012, 0.21, 0.045, 0.005, 0x2a180c, 10);
    m.box(0, -0.03, -0.12, 0.04, 0.025, 0.36, 0x5c3618, 0x7a4822);
    _guitarG = m.build();
  }
  return new THREE.Mesh(_guitarG, MAT.lit);
}

export function brushProp(): THREE.Mesh {
  if (!_brushG) {
    const m = new MB();
    m.box(0, 0, 0.06, 0.06, 0.03, 0.16, 0x7c4d25, 0x996233, 0.06, true);
    m.box(0, -0.028, 0.06, 0.054, 0.028, 0.15, 0x22201e, 0x33302c, 0.05, true);
    _brushG = m.build();
  }
  return new THREE.Mesh(_brushG, MAT.lit);
}

export function wrenchProp(): THREE.Mesh {
  if (!_wrenchG) {
    const m = new MB();
    m.box(0, -0.01, 0.08, 0.028, 0.016, 0.24, 0x8d969e, 0xb8c2cc, 0.05, true);
    m.cyl(0, -0.01, 0.21, 0.038, 0.018, 0x9aa4ad, 8);
    _wrenchG = m.build();
  }
  return new THREE.Mesh(_wrenchG, MAT.lit);
}

export function trayProp(): THREE.Mesh {
  if (!_trayG) {
    const m = new MB();
    m.cyl(0, -0.02, 0.18, 0.22, 0.02, 0xc83e32, 12, 0.24, true, 0xe05245);
    m.cyl(-0.07, 0, 0.15, 0.04, 0.11, 0xcfe8ec, 8, 0.048, true, 0x99c85a);
    m.cyl(0.07, 0, 0.16, 0.04, 0.11, 0xcfe8ec, 8, 0.048, true, 0x6b3f1d);
    m.cyl(0, 0, 0.24, 0.04, 0.11, 0xcfe8ec, 8, 0.048, true, 0x99c85a);
    _trayG = m.build();
  }
  return new THREE.Mesh(_trayG, MAT.lit);
}

export function micProp(): THREE.Mesh {
  if (!_micG) {
    const m = new MB();
    m.cyl(0, -0.02, 0.06, 0.018, 0.16, 0x2b2d30, 8);
    m.sph(0, 0.15, 0.06, 0.034, 0.034, 0.034, 0xb8c2cc, 8, 0xe2e8f0);
    _micG = m.build();
  }
  return new THREE.Mesh(_micG, MAT.lit);
}

export function incenseProp(): THREE.Mesh {
  if (!_incenseG) {
    const m = new MB();
    for (const dx of [-0.015, 0, 0.015]) {
      m.cyl(dx, 0, 0.08, 0.005, 0.26, 0xa83228, 6);
      m.sph(dx, 0.265, 0.08, 0.01, 0.01, 0.01, 0xff6b2b, 6, 0xffd24c);
    }
    _incenseG = m.build();
  }
  return new THREE.Mesh(_incenseG, MAT.lit);
}

export function bowlProp(): THREE.Mesh {
  if (!_bowlG) {
    const m = new MB();
    m.cyl(0, -0.02, 0.1, 0.06, 0.08, 0xe8eef2, 10, 0.11, true, 0xffffff);
    m.sph(0, 0.055, 0.1, 0.09, 0.035, 0.09, 0xf7f4e8, 8, 0xffffff);
    _bowlG = m.build();
  }
  return new THREE.Mesh(_bowlG, MAT.lit);
}

export function hammerProp(): THREE.Mesh {
  if (!_hammerG) {
    const m = new MB();
    m.box(0, -0.02, 0.12, 0.028, 0.028, 0.38, 0x8a5a2b, 0xa67038, 0.05, true);
    m.box(0, -0.05, 0.30, 0.16, 0.09, 0.09, 0x52585e, 0x6e767e, 0.08, true);
    _hammerG = m.build();
  }
  return new THREE.Mesh(_hammerG, MAT.lit);
}

export function fishCrateProp(): THREE.Mesh {
  if (!_crateG) {
    const m = new MB();
    m.box(0, -0.04, 0.22, 0.42, 0.18, 0.30, 0x2868b5, 0x3882d6, 0.08, true);
    m.sph(-0.09, 0.12, 0.20, 0.11, 0.035, 0.045, 0xb8c6d4, 8, 0xe2ecf5);
    m.sph(0.08, 0.12, 0.24, 0.11, 0.035, 0.045, 0xa8b8c8, 8, 0xdbe7f2);
    _crateG = m.build();
  }
  return new THREE.Mesh(_crateG, MAT.lit);
}

/** Bảng kẹp giấy của Thanh tra Vệ sinh (Mục 14). */
export function clipboardProp(): THREE.Mesh {
  if (!_clipG) {
    const m = new MB();
    m.box(0, -0.02, 0.10, 0.18, 0.015, 0.24, 0x7c4d25, 0x945e30, 0.05, true);
    m.box(0, -0.004, 0.10, 0.15, 0.006, 0.20, 0xf7f4eb, 0xffffff);
    m.box(0, 0.002, 0.01, 0.06, 0.012, 0.025, 0x9aa4ad, 0xc2cad4);
    _clipG = m.build();
  }
  return new THREE.Mesh(_clipG, MAT.lit);
}

/** Sổ tay nhỏ bìa đỏ của Nhà phê bình ẩm thực (Mục 14). */
export function notebookProp(): THREE.Mesh {
  if (!_noteG) {
    const m = new MB();
    m.box(0, -0.01, 0.09, 0.14, 0.018, 0.18, 0x9e2a25, 0xb83730, 0.05, true);
    m.box(0.01, 0.008, 0.09, 0.12, 0.006, 0.16, 0xfaf6eb, 0xffffff);
    _noteG = m.build();
  }
  return new THREE.Mesh(_noteG, MAT.lit);
}

/** Cây gậy gỗ của đàn em Hùng Sẹo (Mục 14). */
export function batonProp(): THREE.Mesh {
  if (!_batonG) {
    const m = new MB();
    m.cyl(0, -0.04, 0.06, 0.024, 0.42, 0x6b4222, 8, 0.028, true, 0x8a5830);
    _batonG = m.build();
  }
  return new THREE.Mesh(_batonG, MAT.lit);
}

/** Chai bia xanh của ông khách say xỉn (Mục 14). */
export function bottleProp(): THREE.Mesh {
  if (!_bottleG) {
    const m = new MB();
    m.cyl(0, -0.08, 0.04, 0.036, 0.15, 0x246b35, 8, 0.036, true, 0x2f8544);
    m.cyl(0, 0.07, 0.04, 0.014, 0.07, 0x246b35, 8, 0.014, true, 0xd9a838);
    _bottleG = m.build();
  }
  return new THREE.Mesh(_bottleG, MAT.lit);
}

export type AnimKind =
  | 'rap' | 'danh_co' | 'barber' | 'hat_rong' | 'danh_giay' | 'sua_xe'
  | 'tra_da' | 'phu_tra_da' | 'swing' | 'cafe_sua' | 'karaoke' | 'bong_da'
  | 'net' | 'temple_huong' | 'temple_com' | 'labour' | 'cafe_shift' | 'dock_shift';

export class AnimSystem {
  active = false;
  placing = false;
  kind: AnimKind | '' = '';
  private grp = new THREE.Group();
  private t = 0;
  private dur = 4.5;
  private step = 0;
  private score = 0;
  private phase = 0;
  private amp = 0.32;
  private npc: Npc | null = null;
  private npcSaved: { x: number; y: number; z: number; yaw: number; pose: Pose; seated: boolean; held: THREE.Mesh | null } | null = null;
  private savedPos: { x: number; z: number; yaw: number; pitch: number } | null = null;
  private meshes: THREE.Object3D[] = [];
  // Trạng thái bàn cờ vua 8×8 với Ông Tư
  chessPresetIdx = 0;
  chessBoard: Board = boardFromRows(CHESS_PRESETS[0].rows);
  chessSel: [number, number] | null = null;
  chessLegal: ChessMove[] = [];
  chessLast: ChessMove | null = null;
  chessHintMove: ChessMove | null = null;
  chessTurn: 'w' | 'b' | 'end' = 'w';
  chessEndReason = '';
  chessPendingPromo: ChessMove[] | null = null;
  chessWinRewarded = false;
  private chessBestBoard: Board | null = null;
  private chessBestMove: ChessMove | null = null;
  chessAiTimer = 0;
  chessCapW: Piece[] = [];
  chessCapB: Piece[] = [];
  chessLog: string[] = [];
  chessHistory: { board: Board; last: ChessMove | null; capW: Piece[]; capB: Piece[]; log: string[] }[] = [];

  constructor() {
    ctx.scene.add(this.grp);
  }

  hasNpc(n: Npc): boolean {
    return this.npc === n;
  }

  private flt(x: number, y: number, z: number, text: string, kind: 'good' | 'bad' | 'info' = 'good') {
    ctx.ui.float(text, { x, y, z }, kind);
  }

  private setBtns(list: { label: string; hot?: boolean; fn: () => void }[]) {
    ctx.ui.cookButtons(list.map((b, i) => ({ id: 'b' + i, t: b.label, hot: b.hot ?? i === 0 })));
    ctx.ui.onCookBtn = (id, down) => {
      if (!down) return;
      if (id === 'quit') { this.stop(); return; }
      const idx = +id.slice(1);
      list[idx]?.fn();
    };
  }

  private begin(
    kind: AnimKind,
    title: string,
    steps: string[],
    hint: string,
    px: number,
    py: number,
    pz: number,
    pyaw: number,
    pose: Pose,
    seated: boolean,
    held: THREE.Mesh | null,
    camPos: [number, number, number],
    camLook: [number, number, number],
    dur = 5.0,
    npc: Npc | null = null,
  ) {
    if (this.active) this.stop();
    const p = ctx.player;
    this.savedPos = { x: p.x, z: p.z, yaw: p.yaw, pitch: p.pitch };
    this.active = true;
    this.kind = kind;
    this.t = 0;
    this.dur = dur;
    this.step = 0;
    this.score = 0;
    this.phase = 0;
    this.amp = 0.32;
    this.npc = npc;
    if (npc) {
      this.npcSaved = { x: npc.x, y: npc.y, z: npc.z, yaw: npc.yaw, pose: npc.pose, seated: npc.rig.seated, held: npc.rig.held };
      npc.hidden = false;
      npc.rig.root.visible = true;
    } else {
      this.npcSaved = null;
    }

    p.x = px; p.y = py; p.z = pz; p.yaw = pyaw;
    p.actPose = pose;
    p.actRigPos = { x: px, y: py, z: pz, yaw: pyaw, pitch: 0 };
    p.rig.seated = seated;
    p.rig.hold(held);
    p.view(new THREE.Vector3(...camPos), new THREE.Vector3(...camLook), 54);

    ctx.ui.cookShow(title, steps, 0);
    ctx.ui.cookHint(hint);
    ctx.ui.cookHeat(null);
    ctx.ui.cookSlider(null);
    ctx.ui.cookCard(null);
    ctx.ui.cookProg(0, 0.3, 0.78, '');
  }

  private addMesh(fn: (m: MB) => void, x = 0, y = 0, z = 0, ry = 0): THREE.Mesh {
    const m = new MB();
    fn(m);
    const mesh = new THREE.Mesh(m.build(), MAT.lit);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    this.grp.add(mesh);
    this.meshes.push(mesh);
    return mesh;
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this.kind = '';
    for (const o of this.meshes) {
      this.grp.remove(o);
      if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
    }
    this.meshes.length = 0;

    if (this.npc && this.npcSaved) {
      const n = this.npc, s = this.npcSaved;
      n.x = s.x; n.y = s.y; n.z = s.z; n.yaw = s.yaw;
      n.pose = s.pose; n.rig.seated = s.seated; n.rig.hold(s.held);
    }
    this.npc = null;
    this.npcSaved = null;

    const p = ctx.player;
    p.actPose = null;
    p.actRigPos = null;
    p.rig.seated = false;
    p.rig.hold(null);
    p.view(null);
    if (this.savedPos) {
      this.placing = true;
      p.place(this.savedPos.x, this.savedPos.z, this.savedPos.yaw, this.savedPos.pitch);
      this.placing = false;
      this.savedPos = null;
    }
    ctx.ui.onCookBtn = null;
    ctx.ui.cookHide();
  }

  // ── 1. Nhảy hip-hop cùng Bin dưới gầm cầu ──────────────────────────────────────────
  startRap(n: Npc) {
    const moves = ['Đạp nhịp', 'Đá chân', 'Xoay vai', 'Lắc đầu', 'Bật nhảy', 'Đóng băng!'];
    this.begin(
      'rap',
      'NHẢY HIP-HOP CÙNG BIN',
      moves,
      'Đợi vạch nhịp chạy vào vùng xanh rồi bấm “NHẢY ĐÚNG NHỊP!” (hoặc phím Cách).',
      -21.25, 0.13, 95.05, Math.PI,
      'dance', false, null,
      [-21.7, 1.55, 92.25], [-21.7, 1.0, 95.35],
      14, n,
    );
    n.yaw = Math.PI;
    n.pose = 'dance';
    this.addMesh((m) => m.cyl(0, 0, 0, 0.55, 0.012, 0x3fd0c9, 16, 0.55, true, 0x7ef2ec), -21.25, 0.15, 95.05);
    for (let i = 0; i < 3; i++) {
      this.addMesh((m) => {
        m.sph(0, 0, 0, 0.045, 0.035, 0.045, i % 2 ? 0xf2c94c : 0xe84a8a, 8);
        m.box(0.035, 0, 0, 0.012, 0.14, 0.012, i % 2 ? 0xf2c94c : 0xe84a8a);
      }, -24.35 + i * 0.22, 0.85 + i * 0.2, 96.1);
    }
    this.setupRapBtn(moves);
  }

  private setupRapBtn(moves: string[]) {
    this.setBtns([
      {
        label: `NHẢY ĐÚNG NHỊP! (${this.step + 1}/${moves.length})`,
        hot: true,
        fn: () => {
          const v = (Math.sin(this.t * 4.2) + 1) * 0.5;
          const good = v >= 0.3 && v <= 0.78;
          ctx.player.jumpY = 0.26;
          if (ctx.player.actRigPos) ctx.player.actRigPos.yaw = Math.PI + (this.step % 2 ? 0.35 : -0.35);
          if (good) {
            this.score++;
            sfx('yay');
            this.flt(-21.25, 1.9, 95.05, `♪ ${moves[this.step]} chuẩn nhịp!`, 'good');
          } else {
            sfx('pedal');
            this.flt(-21.25, 1.9, 95.05, 'Hơi lệch nhịp!', 'info');
          }
          this.step++;
          if (this.step >= moves.length) {
            if (this.score >= 3) {
              ctx.g.st.mood = clamp(ctx.g.st.mood + 2, 0, 100);
              if (this.npc) ctx.npcs.say(this.npc, 'Đỉnh quá bạn ơi! Vũ đạo đường phố thứ thiệt!', 3.2, 1);
            }
            this.stop();
          } else {
            ctx.ui.cookShow('NHẢY HIP-HOP CÙNG BIN', moves, this.step);
            ctx.ui.cookHint(`Động tác tiếp theo: ${moves[this.step]} — bấm khi vạch vào vùng xanh!`);
            this.setupRapBtn(moves);
          }
        },
      },
      { label: 'Nghỉ chân', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 2. Đánh cờ vua 8×8 trực tiếp với Ông Tư trong công viên ─────────────────────────
  startChess(n: Npc, presetIdx = 0) {
    this.begin(
      'danh_co',
      'ĐÁNH CỜ VỚI ÔNG TƯ',
      [],
      '',
      52.3, 0.13, -56.16, Math.PI,
      'sit', true, null,
      [54.55, 1.62, -56.85], [52.2, 0.78, -58.25],
      300, n,
    );
    n.rig.seated = true;
    n.pose = 'sit';
    ctx.ui.cookProg(null);
    // Hai quân cờ 3D đại diện trên mặt bàn đá dịch chuyển theo nước đi thực tế
    this.addMesh((m) => {
      m.cyl(0, 0, 0, 0.024, 0.055, 0xf7f2e4, 10, 0.015, true, 0xffffff);
      m.sph(0, 0.062, 0, 0.018, 0.018, 0.018, 0xffffff, 8);
    }, 52.2, 0.506, -56.72);
    this.addMesh((m) => {
      m.cyl(0, 0, 0, 0.024, 0.055, 0x221d1a, 10, 0.015, true, 0x3d3530);
      m.sph(0, 0.062, 0, 0.018, 0.018, 0.018, 0x3d3530, 8);
    }, 52.2, 0.506, -57.08);
    this.initChessPreset(presetIdx);
  }

  initChessPreset(idx: number) {
    this.chessPresetIdx = ((idx % CHESS_PRESETS.length) + CHESS_PRESETS.length) % CHESS_PRESETS.length;
    const preset = CHESS_PRESETS[this.chessPresetIdx];
    this.chessBoard = boardFromRows(preset.rows);
    this.chessSel = null;
    this.chessLegal = [];
    this.chessLast = null;
    this.chessHintMove = null;
    this.chessTurn = 'w';
    this.chessEndReason = '';
    this.chessPendingPromo = null;
    this.chessWinRewarded = false;
    this.chessBestBoard = null;
    this.chessBestMove = null;
    this.chessAiTimer = 0;
    this.chessCapW = [];
    this.chessCapB = [];
    this.chessLog = [];
    this.chessHistory = [];
    if (this.meshes[0]) this.meshes[0].position.set(52.2, 0.506, -56.72);
    if (this.meshes[1]) this.meshes[1].position.set(52.2, 0.506, -57.08);
    ctx.ui.cookShow('ĐÁNH CỜ VỚI ÔNG TƯ', [], 0);
    ctx.ui.cookHint('');
    ctx.ui.cookProg(null);
    this.renderChessUI();
  }

  private sqTo3D(r: number, c: number): [number, number] {
    return [52.2 - 0.2275 + c * 0.065, -56.9 - 0.2275 + r * 0.065];
  }

  private renderChessUI() {
    if (!this.active || this.kind !== 'danh_co') return;
    const b = this.chessBoard;
    const wChk = inCheck(b, true);
    const bChk = inCheck(b, false);
    const wKing = wChk ? findKing(b, true) : null;
    const bKing = bChk ? findKing(b, false) : null;

    let cells = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        const light = (r + c) % 2 === 0;
        const isSel = this.chessSel?.[0] === r && this.chessSel?.[1] === c;
        const isLast = (this.chessLast?.fr === r && this.chessLast?.fc === c) || (this.chessLast?.tr === r && this.chessLast?.tc === c);
        const isHint = (this.chessHintMove?.fr === r && this.chessHintMove?.fc === c) || (this.chessHintMove?.tr === r && this.chessHintMove?.tc === c);
        const leg = this.chessLegal.find((m) => m.tr === r && m.tc === c);
        const isChk = (wKing?.[0] === r && wKing?.[1] === c) || (bKing?.[0] === r && bKing?.[1] === c);

        const cls = [
          'chess-sq',
          light ? 'light' : 'dark',
          isLast ? 'last' : '',
          isSel ? 'sel' : '',
          isHint ? 'hint-sq' : '',
          isChk ? 'chk' : '',
          leg ? (leg.cap ? 'cap' : 'move') : '',
        ].filter(Boolean).join(' ');

        const rk = c === 0 ? `<span class="chess-rk">${8 - r}</span>` : '';
        const fl = r === 7 ? `<span class="chess-fl">${String.fromCharCode(97 + c)}</span>` : '';
        const glyph = p ? `<span class="chess-p ${isWhite(p) ? 'w' : 'b'}">${pieceSvg(p)}</span>` : '';
        cells += `<button type="button" class="${cls}" data-r="${r}" data-c="${c}" title="Ô ${sqName(r, c)}">${rk}${glyph}${fl}</button>`;
      }
    }

    const capWStr = this.chessCapW.map((p) => `<span class="chess-cap-p ${isWhite(p) ? 'w' : 'b'}">${pieceSvg(p)}</span>`).join('') || '<small class="muted">chưa ăn quân</small>';
    const capBStr = this.chessCapB.map((p) => `<span class="chess-cap-p ${isWhite(p) ? 'w' : 'b'}">${pieceSvg(p)}</span>`).join('') || '<small class="muted">chưa ăn quân</small>';
    const claimable = this.chessTurn === 'w' ? claimableDrawReason(b, true) : null;
    if (this.chessTurn === 'w') {
      ctx.ui.cookHint(
        this.chessPendingPromo
          ? 'Chọn quân muốn phong cấp cho Tốt.'
          : claimable
            ? `Đủ điều kiện ${claimable.toLowerCase()} — bấm “Yêu cầu hòa” hoặc đi tiếp.`
            : '',
      );
    }

    const statusTxt =
      this.chessTurn === 'end'
        ? this.chessEndReason || (inCheck(b, false) ? 'Bạn đã chiếu bí Ông Tư!' : inCheck(b, true) ? 'Ông Tư chiếu bí!' : 'Ván cờ hoà!')
        : this.chessTurn === 'b'
          ? 'Ông Tư đang suy nghĩ...'
          : wChk
            ? 'Vua bạn đang bị CHIẾU!'
            : bChk
              ? 'Bạn đang CHIẾU Vua Ông Tư!'
              : 'Lượt bạn (Quân Trắng)';

    const promoNames: Record<string, string> = { Q: 'Hậu', R: 'Xe', B: 'Tượng', N: 'Mã' };
    const promoHtml = this.chessPendingPromo
      ? `<div class="chess-promos"><b>Chọn quân phong cấp</b>${this.chessPendingPromo.map((m, i) => `<button type="button" class="chess-promo w" data-promo="${i}" aria-label="Phong ${promoNames[m.promo!.toUpperCase()]}">${pieceSvg(m.promo!)}<small>${promoNames[m.promo!.toUpperCase()]}</small></button>`).join('')}</div>`
      : '';
    const logHtml = this.chessLog.slice(-5).map((l) => `<div>${l}</div>`).join('');

    const box = ctx.ui.cookCustom(`
      <div class="chess-wrap">
        <div class="chess-frame">
          <div class="chess-bar">
            <span class="who"><i class="dot-b"></i>Ông Tư (Đen)</span>
            <span class="caps" title="Quân Trắng Ông Tư đã ăn">${capBStr}</span>
          </div>
          <div class="chess-board">${cells}</div>
          ${promoHtml}
          <div class="chess-bar">
            <span class="who"><i class="dot-w"></i>Bạn (Trắng)</span>
            <span class="caps" title="Quân Đen bạn đã ăn">${capWStr}</span>
          </div>
        </div>
        <div class="chess-side">
          <div>
            <h4><span>CỜ VUA</span><small>${this.chessHistory.length + 1} nước</small></h4>
            <div class="chess-status${wChk || bChk ? ' warn' : ''}">${statusTxt}</div>
          </div>
          ${logHtml ? `<div class="chess-log">${logHtml}</div>` : ''}
        </div>
      </div>
    `);

    box.querySelector('.chess-board')?.addEventListener('pointerdown', (e) => {
      const btn = (e.target as HTMLElement).closest('.chess-sq') as HTMLElement | null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      this.onChessSqClick(+btn.dataset.r!, +btn.dataset.c!);
    });

    box.querySelector('.chess-promos')?.addEventListener('pointerdown', (e) => {
      const btn = (e.target as HTMLElement).closest('.chess-promo') as HTMLElement | null;
      if (!btn || !this.chessPendingPromo) return;
      e.preventDefault();
      e.stopPropagation();
      const move = this.chessPendingPromo[+btn.dataset.promo!];
      if (move) this.execPlayerChessMove(move);
    });

    if (this.chessTurn === 'w') {
      if (this.chessBestBoard !== b) {
        this.chessBestBoard = b;
        this.chessBestMove = pickBestMove(b, true, 2);
      }
    } else {
      this.chessBestBoard = null;
      this.chessBestMove = null;
    }
    const best = this.chessBestMove;

    const btns: { label: string; hot: boolean; fn: () => void }[] = [
      {
        label: this.chessTurn === 'end'
          ? 'Đánh lại ván này'
          : best
            ? `Đi gợi ý: ${moveLabel(best)}`
            : 'Gợi ý nước đi',
        hot: true,
        fn: () => {
          if (this.chessTurn === 'end') {
            sfx('ui');
            this.initChessPreset(this.chessPresetIdx);
            return;
          }
          if (this.chessTurn !== 'w') return;
          const m = this.chessBestMove ?? pickBestMove(this.chessBoard, true, 2);
          if (m) this.execPlayerChessMove(m);
        },
      },
    ];
    if (claimable) {
      btns.push({
        label: 'Yêu cầu hòa',
        hot: false,
        fn: () => {
          if (this.chessTurn !== 'w') return;
          sfx('ui');
          this.chessTurn = 'end';
          this.chessPendingPromo = null;
          this.chessSel = null;
          this.chessLegal = [];
          this.chessEndReason = `Bạn yêu cầu ${claimable.toLowerCase()}.`;
          if (this.npc) ctx.npcs.say(this.npc, 'Được rồi, thế này tính hòa nhé cháu!', 3.2, 1);
          ctx.ui.cookHint(this.chessEndReason);
          this.renderChessUI();
        },
      });
    }
    btns.push(
      {
        label: 'Đi lại 1 nước',
        hot: false,
        fn: () => {
          const prev = this.chessHistory.pop();
          if (!prev) {
            toast('Đang ở nước đầu tiên của bàn cờ!', 'info');
            return;
          }
          sfx('pick');
          this.chessBoard = prev.board;
          this.chessLast = prev.last;
          this.chessCapW = prev.capW;
          this.chessCapB = prev.capB;
          this.chessLog = prev.log;
          this.chessSel = null;
          this.chessLegal = [];
          this.chessHintMove = null;
          this.chessPendingPromo = null;
          this.chessEndReason = '';
          this.chessBestBoard = null;
          this.chessBestMove = null;
          this.chessTurn = 'w';
          this.chessAiTimer = 0;
          if (this.meshes[0]) this.meshes[0].position.set(52.2, 0.506, -56.72);
          if (this.meshes[1]) this.meshes[1].position.set(52.2, 0.506, -57.08);
          ctx.ui.cookHint('');
          this.renderChessUI();
        },
      },
      {
        label: 'Xếp bàn cờ',
        hot: false,
        fn: () => this.stop(),
      },
    );
    this.setBtns(btns);
  }

  private onChessSqClick(r: number, c: number) {
    if (this.chessTurn !== 'w' || this.chessPendingPromo) return;
    const moves = this.chessLegal.filter((m) => m.tr === r && m.tc === c);
    if (moves.length) {
      const promotions = moves.filter((m) => m.promo);
      if (promotions.length > 1) {
        this.chessPendingPromo = promotions;
        this.renderChessUI();
      } else {
        this.execPlayerChessMove(moves[0]);
      }
      return;
    }
    const p = this.chessBoard[r][c];
    if (p && isWhite(p)) {
      sfx('pick');
      this.chessSel = [r, c];
      this.chessLegal = legalMovesAt(this.chessBoard, r, c);
      this.chessHintMove = null;
      this.renderChessUI();
    } else if (this.chessSel) {
      this.chessSel = null;
      this.chessLegal = [];
      this.renderChessUI();
    }
  }

  execPlayerChessMove(m: ChessMove) {
    this.chessHistory.push({
      board: cloneBoard(this.chessBoard),
      last: this.chessLast,
      capW: this.chessCapW.slice(),
      capB: this.chessCapB.slice(),
      log: this.chessLog.slice(),
    });
    this.chessBoard = applyMove(this.chessBoard, m);
    this.chessPendingPromo = null;
    this.chessEndReason = '';
    this.chessBestBoard = null;
    this.chessBestMove = null;
    if (m.cap) {
      this.chessCapW.push(m.cap);
      sfx('chop');
    } else {
      sfx('place');
    }
    this.chessLast = m;
    this.chessSel = null;
    this.chessLegal = [];
    this.chessHintMove = null;
    const turnNo = this.chessHistory.length;
    this.chessLog.push(`${turnNo}. Bạn: ${moveLabel(m)}`);

    // Hoạt ảnh tay nhân vật vươn ra đặt quân cờ 3D trên mặt bàn đá
    this.t = 0;
    ctx.player.actPose = 'work';
    const [wx, wz] = this.sqTo3D(m.tr, m.tc);
    if (this.meshes[0]) this.meshes[0].position.set(wx, 0.506, wz);
    this.flt(52.2, 0.95, -56.9, moveLabel(m), 'good');

    const bMoves = allLegalMoves(this.chessBoard, false);
    if (!bMoves.length) {
      this.chessTurn = 'end';
      if (inCheck(this.chessBoard, false)) {
        this.chessEndReason = 'Bạn đã chiếu bí Ông Tư!';
        sfx('yay');
        if (!this.chessWinRewarded) {
          this.chessWinRewarded = true;
          ctx.g.st.mood = clamp(ctx.g.st.mood + 4, 0, 100);
        }
        if (this.npc) ctx.npcs.say(this.npc, 'Chiếu bí đẹp quá! Bữa nay cháu cao cờ hơn ông Tư rồi, bái phục!', 4.0, 1);
        ctx.ui.cookGrade(1, 'CHIẾU BÍ ÔNG TƯ!');
        ctx.ui.cookHint('Chúc mừng! Bạn đã chiếu bí Ông Tư ngay trên bàn cờ công viên!');
      } else {
        this.chessEndReason = 'Ván cờ hòa do hết nước đi hợp lệ.';
        if (this.npc) ctx.npcs.say(this.npc, 'Thế cờ hoà pat rồi cháu ơi, ván này bất phân thắng bại!', 3.5, 1);
        ctx.ui.cookHint(this.chessEndReason);
      }
      this.renderChessUI();
      return;
    }
    const autoDraw = autoDrawReason(this.chessBoard, false);
    if (autoDraw) {
      this.chessTurn = 'end';
      this.chessEndReason = autoDraw;
      ctx.ui.cookHint(autoDraw);
      this.renderChessUI();
      return;
    }

    if (inCheck(this.chessBoard, false) && this.npc) {
      ctx.npcs.say(this.npc, 'Ái chà, chiếu tướng ông hả! Để ông Tư đỡ nước này...', 2.8, 1);
    }
    this.chessTurn = 'b';
    this.chessAiTimer = 0.38;
    this.renderChessUI();
  }

  private execAiChessMove() {
    if (this.chessTurn !== 'b') return;
    const aiClaimable = claimableDrawReason(this.chessBoard, false);
    if (aiClaimable && evaluateBoard(this.chessBoard) >= -50) {
      this.chessTurn = 'end';
      this.chessEndReason = `Ông Tư yêu cầu ${aiClaimable.toLowerCase()}.`;
      if (this.npc) ctx.npcs.say(this.npc, `Thế này ${aiClaimable.toLowerCase()}, ông Tư xin hòa ván này nghen!`, 3.5, 1);
      ctx.ui.cookHint(this.chessEndReason);
      this.renderChessUI();
      return;
    }
    const ai = pickBestMove(this.chessBoard, false, 2);
    if (!ai) {
      this.chessTurn = 'end';
      this.chessEndReason = autoDrawReason(this.chessBoard, false) ?? (inCheck(this.chessBoard, false) ? 'Ông Tư đang bị chiếu bí!' : 'Ván cờ hòa do hết nước đi hợp lệ.');
      ctx.ui.cookHint(this.chessEndReason);
      this.renderChessUI();
      return;
    }
    this.chessBoard = applyMove(this.chessBoard, ai);
    this.chessEndReason = '';
    this.chessBestBoard = null;
    this.chessBestMove = null;
    if (ai.cap) {
      this.chessCapB.push(ai.cap);
      sfx('chop');
    } else {
      sfx('place');
    }
    this.chessLast = ai;
    if (this.chessLog.length) {
      this.chessLog[this.chessLog.length - 1] += ` · Ông Tư: ${moveLabel(ai)}`;
    } else {
      this.chessLog.push(`Ông Tư: ${moveLabel(ai)}`);
    }

    this.t = 0;
    if (this.npc) {
      this.npc.pose = 'work';
      const [bx, bz] = this.sqTo3D(ai.tr, ai.tc);
      if (this.meshes[1]) this.meshes[1].position.set(bx, 0.506, bz);
      const wChk = inCheck(this.chessBoard, true);
      const line = wChk
        ? 'Chiếu tướng! Coi chừng Vua của cháu kìa!'
        : ai.cap
          ? `Ông Tư ăn quân ở ô ${sqName(ai.tr, ai.tc)} nhé!`
          : [
              'Nước cờ này của ông Tư hơi bị hiểm đó nghen!',
              'Tới lượt cháu đó, tính kỹ kẻo sập bẫy ông Tư!',
              'Chà, thế trận ngày càng gay cấn rồi đây!',
            ][this.chessHistory.length % 3];
      ctx.npcs.say(this.npc, line, 3.0, 1);
    }

    const wMoves = allLegalMoves(this.chessBoard, true);
    if (!wMoves.length) {
      this.chessTurn = 'end';
      if (inCheck(this.chessBoard, true)) {
        this.chessEndReason = 'Ông Tư đã chiếu bí!';
        ctx.ui.cookHint('Ông Tư đã chiếu bí! Bấm “Đánh lại ván này” hoặc “Đi lại 1 nước” để phục thù!');
      } else {
        this.chessEndReason = 'Ván cờ hòa do hết nước đi hợp lệ.';
        ctx.ui.cookHint(this.chessEndReason);
      }
    } else {
      const autoDraw = autoDrawReason(this.chessBoard, true);
      if (autoDraw) {
        this.chessTurn = 'end';
        this.chessEndReason = autoDraw;
        ctx.ui.cookHint(autoDraw);
      } else {
        this.chessTurn = 'w';
        ctx.ui.cookHint('');
      }
    }
    this.renderChessUI();
  }

  // ── 3. Ngồi ghế cắt tóc & nhuộm tóc ở Tiệm Chú Bảy Kéo ────────────────────────────
  startBarber(n: Npc, label: string, colorHex = 0x221d1a) {
    this.begin(
      'barber',
      'TIỆM HỚT TÓC BẢY KÉO',
      ['Quàng khăn', 'Tỉa kéo & chải lược', 'Soi gương'],
      `Chú Bảy đang chăm chút ${label} cho bạn trước gương lớn...`,
      56.15, 0.52, 20.35, Math.PI,
      'sit', true, null,
      [54.85, 1.48, 22.15], [56.0, 1.08, 20.1],
      4.5, n,
    );
    n.x = 55.62; n.z = 20.30; n.yaw = Math.atan2(56.15 - n.x, 20.35 - n.z);
    n.pose = 'work';
    n.rig.hold(scissorsProp());
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      this.addMesh((m) => m.box(0, 0, 0, 0.025, 0.012, 0.04, colorHex), 56.15 + Math.cos(a) * 0.22, 1.32, 20.35 + Math.sin(a) * 0.22);
    }
    this.setBtns([
      {
        label: 'Xoay đầu ngắm gương',
        hot: true,
        fn: () => {
          sfx('pick');
          if (ctx.player.actRigPos) {
            ctx.player.actRigPos.yaw = Math.PI + (Math.random() > 0.5 ? 0.38 : -0.38);
          }
          this.flt(56.15, 1.75, 20.35, '✨ Hợp khuôn mặt lắm!', 'good');
        },
      },
      { label: 'Đứng dậy', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 4. Ngồi nghe Cô Hồng hát rong trước cổng chợ ──────────────────────────────────
  startBusker(n: Npc) {
    this.begin(
      'hat_rong',
      'NGHE HÁT RONG — CÔ HỒNG',
      ['Khúc dạo đàn', 'Điệp khúc', 'Vỗ tay'],
      'Cô Hồng ôm đàn thùng gảy những hợp âm mộc mạc giữa chiều phố chợ...',
      -39.25, 0.13, -5.75, -Math.PI / 2,
      'sit', true, null,
      [-39.55, 1.38, -3.85], [-40.2, 0.85, -5.65],
      7.0, n,
    );
    n.rig.seated = true;
    n.pose = 'work';
    n.rig.hold(guitarProp());
    this.addMesh((m) => m.cyl(0, 0, 0, 0.15, 0.28, 0xc83e32, 8, 0.15, true, 0xe05245), -39.25, 0.13, -5.75);
    for (let i = 0; i < 3; i++) {
      this.addMesh((m) => {
        m.sph(0, 0, 0, 0.04, 0.032, 0.04, 0xf2c94c, 8);
        m.box(0.03, 0, 0, 0.01, 0.12, 0.01, 0xf2c94c);
      }, -40.35 + i * 0.18, 0.95 + i * 0.18, -5.55);
    }
    this.setBtns([
      {
        label: 'VỖ TAY THEO NHỊP!',
        hot: true,
        fn: () => {
          sfx('pick');
          ctx.player.actPose = 'wave';
          this.step = Math.min(2, this.step + 1);
          ctx.ui.cookShow('NGHE HÁT RONG — CÔ HỒNG', ['Khúc dạo đàn', 'Điệp khúc', 'Vỗ tay'], this.step);
          this.flt(-40.5, 1.55, -5.6, '♪ Tiếng đàn ấm áp quá!', 'good');
        },
      },
      { label: 'Đứng dậy đi tiếp', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 5. Đánh giày chỗ Bé Bo ở phố Bến Xe ──────────────────────────────────────────
  startShoeshine(n: Npc) {
    this.begin(
      'danh_giay',
      'ĐÁNH GIÀY — BÉ BO',
      ['Phủi bụi', 'Bôi xi bóng', 'Đánh bóng'],
      'Bé Bo thoăn thoắt đưa bàn chải đánh bóng từng mũi giày cho bạn...',
      -25.35, 0.13, 64.64, Math.PI / 2,
      'sit', true, null,
      [-25.1, 1.25, 66.25], [-25.1, 0.62, 64.67],
      5.5, n,
    );
    n.rig.seated = true;
    n.pose = 'work';
    n.rig.hold(brushProp());
    for (let i = 0; i < 3; i++) {
      this.addMesh((m) => m.sph(0, 0, 0, 0.028, 0.028, 0.028, 0xf5d77f, 6), -25.12 + i * 0.06, 0.24, 64.66);
    }
    this.setBtns([
      {
        label: 'ĐỔI CHÂN ĐÁNH TIẾP!',
        hot: true,
        fn: () => {
          sfx('skim');
          this.step = Math.min(2, this.step + 1);
          ctx.ui.cookShow('ĐÁNH GIÀY — BÉ BO', ['Phủi bụi', 'Bôi xi bóng', 'Đánh bóng'], this.step);
          this.flt(-25.1, 0.9, 64.66, '✨ Giày bóng loáng!', 'good');
          if (this.step >= 2) this.stop();
        },
      },
      { label: 'Xong rồi', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 6. Sửa gánh / Vá & bơm xe đẩy chỗ Chú Hậu ────────────────────────────────────
  startRepair(n: Npc, label: string) {
    this.begin(
      'sua_xe',
      'TIỆM SỬA XE VỈA HÈ — CHÚ HẬU',
      ['Kiểm tra khung', label, 'Siết ốc & bơm căng'],
      `Chú Hậu đang cặm cụi ${label.toLowerCase()} dưới tấm bạt xanh...`,
      -45.15, 0.13, -22.45, Math.PI,
      'idle', false, null,
      [-43.8, 1.45, -21.8], [-45.6, 0.85, -23.7],
      5.0, n,
    );
    n.pose = 'work';
    n.rig.hold(wrenchProp());
    for (let i = 0; i < 3; i++) {
      this.addMesh((m) => m.sph(0, 0, 0, 0.032, 0.032, 0.032, 0xffb84d, 6), -45.6 + i * 0.1, 0.55, -23.6);
    }
    this.setBtns([
      {
        label: 'PHỤ GIỮ XE / BƠM HƠI!',
        hot: true,
        fn: () => {
          sfx('fix');
          ctx.player.actPose = 'work';
          this.step = Math.min(2, this.step + 1);
          ctx.ui.cookShow('TIỆM SỬA XE VỈA HÈ — CHÚ HẬU', ['Kiểm tra khung', label, 'Siết ốc & bơm căng'], this.step);
          this.flt(-45.6, 1.25, -23.5, '🔧 Chắc chắn êm ru!', 'good');
          if (this.step >= 2) this.stop();
        },
      },
      { label: 'Xong rồi', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 7a. Uống trà đá vỉa hè chỗ Cô Thắm ────────────────────────────────────────────
  startIcedTea(n: Npc) {
    this.begin(
      'tra_da',
      'QUÁN TRÀ ĐÁ VỈA HÈ — CÔ THẮM',
      ['Rót trà đá', 'Nhấp ngụm mát lành'],
      'Ngồi ghế nhựa bên gốc cây, nhấp ngụm trà đá mát lạnh nghe chuyện phố phường...',
      -33.88, 0.13, 53.06, -Math.PI / 2,
      'drink', true, cupProp(),
      [-32.45, 1.28, 52.25], [-34.3, 0.72, 53.4],
      4.8, n,
    );
    this.setBtns([
      {
        label: 'KHÀ MỘT HƠI MÁT RUỘT!',
        hot: true,
        fn: () => {
          sfx('drink');
          this.flt(-33.88, 1.45, 53.06, '🧊 Tỉnh cả người!', 'good');
          this.stop();
        },
      },
      { label: 'Đứng dậy', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 7b. Phụ bưng trà đá chỗ Cô Thắm ───────────────────────────────────────────────
  startTeaShift(n: Npc) {
    const steps = ['Bàn khách 1', 'Bàn khách 2', 'Thu dọn ly'];
    this.begin(
      'phu_tra_da',
      'PHỤ BƯNG TRÀ ĐÁ — CÔ THẮM',
      steps,
      'Bưng khay trà đá mời khách quanh bàn nhựa vỉa hè của Cô Thắm!',
      -33.6, 0.13, 53.1, -Math.PI / 2,
      'carry', false, trayProp(),
      [-31.9, 1.55, 52.1], [-34.2, 0.85, 53.4],
      8.0, n,
    );
    this.setupShiftBtn('PHỤ BƯNG TRÀ ĐÁ — CÔ THẮM', steps, 'BƯNG TRÀ MỜI KHÁCH!', 'drink', [
      [-33.6, 53.05, -Math.PI / 2],
      [-33.6, 53.75, -Math.PI / 2],
      [-34.1, 53.4, -Math.PI / 2],
    ]);
  }

  // ── 8. Đu xích đu ở sân chơi công viên ────────────────────────────────────────────
  startSwing() {
    this.begin(
      'swing',
      'ĐU XÍCH ĐU CÔNG VIÊN',
      ['Ngồi lên ghế', 'Đạp lấy đà', 'Bay cao đón gió!'],
      'Bấm “ĐẠP LẤY ĐÀ!” đúng nhịp để chiếc xích đu văng cao đón gió mát công viên!',
      72.9, 0.56, -44.0, 0,
      'sit', true, null,
      [70.65, 1.48, -41.55], [73.0, 1.12, -44.0],
      9.0, null,
    );
    this.addMesh((m) => {
      m.box(0, 0, 0, 0.42, 0.04, 0.24, 0xc84b31, 0xe05d40, 0.05, true);
      m.cyl(-0.18, 0.02, 0, 0.01, 1.55, 0x9aa4ad, 6);
      m.cyl(0.18, 0.02, 0, 0.01, 1.55, 0x9aa4ad, 6);
    }, 72.9, 0.66, -44.0);
    this.setBtns([
      {
        label: 'ĐẠP LẤY ĐÀ!',
        hot: true,
        fn: () => {
          sfx('pedal');
          this.amp = Math.min(0.68, this.amp + 0.16);
          this.step = Math.min(2, this.step + 1);
          ctx.ui.cookShow('ĐU XÍCH ĐU CÔNG VIÊN', ['Ngồi lên ghế', 'Đạp lấy đà', 'Bay cao đón gió!'], this.step);
          this.flt(72.9, 1.85, -44.0, '🍃 Gió mát rượi!', 'good');
        },
      },
      { label: 'Nhảy xuống', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 9a. Uống cà phê sữa đá ở Quán Cà Phê Bóng Đá ──────────────────────────────────
  startCafeDrink() {
    const a = ctx.world.anchors.tv_bongda ?? { x: -49.5, y: 0.13, z: 3.0, yaw: -Math.PI / 2 };
    const s = Math.sin(a.yaw), c = Math.cos(a.yaw);
    this.begin(
      'cafe_sua',
      'QUÁN CÀ PHÊ BÓNG ĐÁ — LY SỮA ĐÁ',
      ['Khuấy đều sữa đặc', 'Nhấp ngụm cà phê đậm đà'],
      'Tiếng muỗng inox chạm thành ly thủy tinh lanh canh giữa quán cà phê quen...',
      a.x, a.y, a.z, a.yaw,
      'drink', true, cupProp(),
      [a.x - s * 2.1 + c * 1.1, 1.38, a.z - c * 2.1 - s * 1.1],
      [a.x + s * 0.6, 0.88, a.z + c * 0.6],
      5.0, null,
    );
    this.setBtns([
      {
        label: 'KHUẤY ĐÁ & UỐNG!',
        hot: true,
        fn: () => {
          sfx('drink');
          this.flt(a.x, 1.5, a.z, '☕ Thơm lừng tỉnh táo!', 'good');
          this.stop();
        },
      },
      { label: 'Đứng dậy', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 9b. Hát Karaoke ở Quán Cà Phê Bóng Đá ────────────────────────────────────────
  startKaraoke() {
    const a = ctx.world.anchors.tv_bongda ?? { x: -49.5, y: 0.13, z: 3.0, yaw: -Math.PI / 2 };
    const s = Math.sin(a.yaw), c = Math.cos(a.yaw);
    const px = a.x + s * 1.2, pz = a.z + c * 1.2, pyaw = a.yaw + Math.PI;
    const lyrics = [
      '♪ Đêm thành phố đầy sao...',
      '♪ Vùng lá me bay năm nào...',
      '♪ Đời bán hàng rong mưa nắng...',
      '♪ Cà phê đắng mà tình người thơm!',
    ];
    this.begin(
      'karaoke',
      'HÁT KARAOKE — DÀN MÁY 6 SỐ',
      ['Câu 1', 'Câu 2', 'Điệp khúc', 'Ngân cao!'],
      `Chữ chạy xanh đỏ trên màn hình: “${lyrics[0]}” — bấm “CẤT GIỌNG HÁT!” đúng nhịp!`,
      px, a.y, pz, pyaw,
      'wave', false, micProp(),
      [a.x - s * 1.4 + c * 0.9, 1.48, a.z - c * 1.4 - s * 0.9],
      [px, 1.05, pz],
      11.0, null,
    );
    for (let i = 0; i < 3; i++) {
      this.addMesh((m) => {
        m.sph(0, 0, 0, 0.04, 0.032, 0.04, i % 2 ? 0x3fd0c9 : 0xf2c94c, 8);
        m.box(0.03, 0, 0, 0.01, 0.12, 0.01, i % 2 ? 0x3fd0c9 : 0xf2c94c);
      }, px + (i - 1) * 0.25, 1.4 + i * 0.15, pz);
    }
    this.setupKaraokeBtn(lyrics, px, pz);
  }

  private setupKaraokeBtn(lyrics: string[], px: number, pz: number) {
    this.setBtns([
      {
        label: `CẤT GIỌNG HÁT! (${this.step + 1}/${lyrics.length})`,
        hot: true,
        fn: () => {
          sfx('yay');
          ctx.player.actPose = this.step % 2 === 0 ? 'wave' : 'talk';
          this.flt(px, 1.85, pz, lyrics[this.step], 'good');
          this.step++;
          if (this.step >= lyrics.length) {
            this.flt(px, 2.0, pz, '🎤 Chấm điểm: 99 ĐIỂM!', 'good');
            this.stop();
          } else {
            ctx.ui.cookShow('HÁT KARAOKE — DÀN MÁY 6 SỐ', ['Câu 1', 'Câu 2', 'Điệp khúc', 'Ngân cao!'], this.step);
            ctx.ui.cookHint(`Chữ chạy trên màn hình: “${lyrics[this.step]}”`);
            this.setupKaraokeBtn(lyrics, px, pz);
          }
        },
      },
      { label: 'Trả micro', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 9c. Xem trận bóng đá trực tiếp ở Quán Cà Phê Bóng Đá ─────────────────────────
  startFootball() {
    const a = ctx.world.anchors.tv_bongda ?? { x: -49.5, y: 0.13, z: 3.0, yaw: -Math.PI / 2 };
    const s = Math.sin(a.yaw), c = Math.cos(a.yaw);
    this.begin(
      'bong_da',
      'TRỰC TIẾP BÓNG ĐÁ — QUÁN CÀ PHÊ',
      ['Pha lên bóng', 'Sút xa!', 'VÀOOOOO!'],
      'Cả quán đang nín thở dõi theo pha phản công trên màn hình TV — bấm “HÔ VÀOOO!” cổ vũ!',
      a.x, a.y, a.z, a.yaw,
      'sit', true, cupProp(),
      [a.x - s * 1.9 + c * 0.9, 1.45, a.z - c * 1.9 - s * 0.9],
      [a.x + s * 1.6, 1.25, a.z + c * 1.6],
      7.0, null,
    );
    this.addMesh((m) => m.sph(0, 0, 0, 0.06, 0.06, 0.06, 0xffffff, 8), a.x + s * 3.1, 1.68, a.z + c * 3.1);
    this.setBtns([
      {
        label: 'HÔ VÀOOOOO!',
        hot: true,
        fn: () => {
          sfx('yay');
          ctx.player.rig.seated = false;
          ctx.player.actPose = 'wave';
          ctx.player.jumpY = 0.22;
          this.step = 2;
          ctx.ui.cookShow('TRỰC TIẾP BÓNG ĐÁ — QUÁN CÀ PHÊ', ['Pha lên bóng', 'Sút xa!', 'VÀOOOOO!'], 2);
          this.flt(a.x, 1.9, a.z, '⚽ VÀOOOOO! Cả quán vỡ òa!', 'good');
        },
      },
      { label: 'Xem xong', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 10. Ngồi máy ở Quán Net Hải Anh (MÁY 04) ─────────────────────────────────────
  startNet(title: string, hrs: number) {
    const a = ctx.world.anchors.may_net ?? { x: -49.0, y: 0.13, z: -20.0, yaw: -Math.PI / 2 };
    const s = Math.sin(a.yaw), c = Math.cos(a.yaw);
    this.begin(
      'net',
      `MÁY 04 — QUÁN NET HẢI ANH (${hrs} GIỜ)`,
      ['Đăng nhập Máy 04', title, 'Rời máy'],
      `Đang ngồi Máy 04 (${title.toLowerCase()}) — tiếng bàn phím cơ lách cách rộn cả phòng net!`,
      a.x, a.y, a.z, a.yaw,
      'work', true, null,
      [a.x - s * 1.55 + c * 0.85, 1.42, a.z - c * 1.55 - s * 0.85],
      [a.x + s * 0.45, 0.95, a.z + c * 0.45],
      6.0, null,
    );
    this.addMesh((m) => m.box(0, 0, 0, 0.04, 0.22, 0.28, 0x3ec8e8, 0x8ef2ff), a.x + s * 0.42, 0.96, a.z + c * 0.42, a.yaw);
    this.setBtns([
      {
        label: 'GÕ PHÍM / CLICK CHUỘT!',
        hot: true,
        fn: () => {
          sfx('pick');
          this.step = 1;
          ctx.ui.cookShow(`MÁY 04 — QUÁN NET HẢI ANH (${hrs} GIỜ)`, ['Đăng nhập Máy 04', title, 'Rời máy'], 1);
          this.flt(a.x, 1.55, a.z, '⌨️ Lách cách lách cách!', 'good');
        },
      },
      { label: 'Đứng dậy tính tiền', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 11a. Thắp hương cầu an ở Chùa Phước An ───────────────────────────────────────
  startTempleIncense() {
    const lot = LOTS.find((l) => l.kind === 'temple');
    const a = ctx.world.anchors.v_temple ?? { x: -45.0, y: 0.12, z: -65.0, yaw: Math.PI };
    let cx = a.x, cz = a.z, pyaw = a.yaw;
    if (lot) {
      [cx, cz] = toWorld(lot.fr, lot.at + 9, 3.0);
      pyaw = lot.fr.yaw;
    }
    const s = Math.sin(pyaw), c = Math.cos(pyaw);
    const px = cx - s * 1.15, pz = cz - c * 1.15;
    const steps = ['Khấn bình an', 'Khấn sức khoẻ', 'Cắm hương lên lư'];
    this.begin(
      'temple_huong',
      'THẮP HƯƠNG CẦU AN — CHÙA PHƯỚC AN',
      steps,
      'Chắp tay trước lư hương đá cổ kính giữa sân chùa, thành tâm vái 3 lạy...',
      px, 0.12, pz, pyaw,
      'read', false, incenseProp(),
      [px - s * 1.6 + c * 1.35, 1.48, pz - c * 1.6 - s * 1.35],
      [cx, 0.95, cz],
      9.0, null,
    );
    this.addMesh((m) => {
      for (const dx of [-0.04, 0, 0.04]) {
        m.cyl(dx, 0, 0, 0.006, 0.28, 0xa83228, 6);
        m.sph(dx, 0.285, 0, 0.012, 0.012, 0.012, 0xff5522, 6, 0xffdd55);
      }
    }, cx, 0.92, cz);
    for (let i = 0; i < 3; i++) {
      this.addMesh((m) => m.sph(0, 0, 0, 0.045 + i * 0.015, 0.035, 0.045 + i * 0.015, 0xe8eef2, 8), cx, 1.22 + i * 0.18, cz);
    }
    this.setBtns([
      {
        label: 'THÀNH TÂM VÁI LẠY!',
        hot: true,
        fn: () => {
          sfx('ding');
          this.step++;
          if (ctx.player.actRigPos) ctx.player.actRigPos.pitch = 0.42;
          const msg = ['🙏 Cầu bình an vô sự...', '🙏 Cầu sức khoẻ dồi dào...', '🙏 Cầu buôn may bán đắt!'][Math.min(2, this.step - 1)];
          this.flt(cx, 1.55, cz, msg, 'good');
          if (this.step >= 3) {
            ctx.player.rig.hold(null);
            this.stop();
          } else {
            ctx.ui.cookShow('THẮP HƯƠNG CẦU AN — CHÙA PHƯỚC AN', steps, this.step);
          }
        },
      },
      { label: 'Hoàn tất', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 11b. Nhận cơm chay từ thiện ở Chùa Phước An ──────────────────────────────────
  startTempleMeal() {
    const a = ctx.world.anchors.v_temple ?? { x: -45.0, y: 0.12, z: -65.0, yaw: Math.PI };
    const s = Math.sin(a.yaw), c = Math.cos(a.yaw);
    this.begin(
      'temple_com',
      'CƠM CHAY TỪ THIỆN — CHÙA PHƯỚC AN',
      ['Nhận phần cơm chay', 'Thưởng thức thanh đạm'],
      'Bát cơm chay nóng hổi với đậu hũ kho tương và rau luộc ấm lòng buổi sáng...',
      a.x + s * 0.85, a.y, a.z + c * 0.85, a.yaw + Math.PI,
      'drink', false, bowlProp(),
      [a.x + s * 2.3 + c * 1.1, 1.42, a.z + c * 2.3 - s * 1.1],
      [a.x + s * 0.4, 0.92, a.z + c * 0.4],
      4.8, null,
    );
    this.setBtns([
      {
        label: 'ĂN CƠM CHAY ẤM BỤNG!',
        hot: true,
        fn: () => {
          sfx('eat');
          this.flt(a.x, 1.5, a.z, '🍚 Cơm chay thanh tịnh!', 'good');
          this.stop();
        },
      },
      { label: 'Cảm ơn nhà chùa', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 12. Đập đá trong buồng tạm giữ Công an phường ────────────────────────────────
  startPrisonLabour() {
    const a = ctx.world.anchors.lao_dong ?? { x: 45.0, y: 0.13, z: -60.0, yaw: 0 };
    const s = Math.sin(a.yaw), c = Math.cos(a.yaw);
    const steps = ['Nhát búa 1', 'Nhát búa 2', 'Nhát búa 3', 'Vỡ vụn!'];
    this.begin(
      'labour',
      'LAO ĐỘNG CÔNG ÍCH — ĐẬP ĐÁ',
      steps,
      'Canh vạch lực rồi bấm “VUNG BÚA ĐẬP ĐÁ!” để đập nhỏ đống gạch đá trong sân tạm giữ!',
      a.x - s * 0.55, a.y, a.z - c * 0.55, a.yaw,
      'work', false, hammerProp(),
      [a.x - s * 2.1 + c * 1.2, 1.48, a.z - c * 2.1 - s * 1.2],
      [a.x, 0.65, a.z],
      9.0, null,
    );
    for (let i = 0; i < 4; i++) {
      this.addMesh((m) => m.box(0, 0, 0, 0.08, 0.06, 0.08, 0xb85238, 0xd46a4e, 0.08, true), a.x + (i - 1.5) * 0.12, 0.25, a.z);
    }
    this.setBtns([
      {
        label: 'VUNG BÚA ĐẬP ĐÁ!',
        hot: true,
        fn: () => {
          sfx('chop');
          sfx('thud');
          this.step++;
          this.flt(a.x, 0.95, a.z, '💥 CHÁT! Đá vỡ vụn!', 'good');
          if (this.step >= steps.length) {
            this.stop();
          } else {
            ctx.ui.cookShow('LAO ĐỘNG CÔNG ÍCH — ĐẬP ĐÁ', steps, this.step);
          }
        },
      },
      { label: 'Lau mồ hôi xong', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── 13a. Chạy bàn quán cà phê Bóng Đá ────────────────────────────────────────────
  startCafeShift() {
    const a = ctx.world.anchors.tv_bongda ?? { x: -49.5, y: 0.13, z: 3.0, yaw: -Math.PI / 2 };
    const s = Math.sin(a.yaw), c = Math.cos(a.yaw);
    const steps = ['Bưng bàn 1', 'Bưng bàn 2', 'Dọn ly bàn 3'];
    this.begin(
      'cafe_shift',
      'PHỤ BƯNG BÀN — QUÁN CÀ PHÊ BÓNG ĐÁ',
      steps,
      'Bưng khay cà phê sữa đá thoăn thoắt qua các bàn khách đang xem bóng đá!',
      a.x, a.y, a.z, a.yaw,
      'carry', false, trayProp(),
      [a.x - s * 2.2 + c * 1.3, 1.55, a.z - c * 2.2 - s * 1.3],
      [a.x + s * 0.5, 0.9, a.z + c * 0.5],
      8.0, null,
    );
    this.setupShiftBtn('PHỤ BƯNG BÀN — QUÁN CÀ PHÊ BÓNG ĐÁ', steps, 'BƯNG CÀ PHÊ RA BÀN!', 'pick', [
      [a.x, a.z, a.yaw],
      [a.x + c * 0.9, a.z - s * 0.9, a.yaw + 0.4],
      [a.x - c * 0.9, a.z + s * 0.9, a.yaw - 0.4],
    ]);
  }

  // ── 13b. Ca bốc cá ở cảng cùng Anh Sáu Lực ──────────────────────────────────────
  startDockShift() {
    const a = ctx.world.anchors.v_dock ?? { x: 45.0, y: 0.13, z: 95.0, yaw: 0 };
    const s = Math.sin(a.yaw), c = Math.cos(a.yaw);
    const steps = ['Khay cá thu', 'Khay cá nục', 'Chất lên thùng xe'];
    this.begin(
      'dock_shift',
      'CA BỐC CÁ BẾN CẢNG — ANH SÁU LỰC',
      steps,
      'Vác khay cá biển ướp đá lạnh buốt từ cầu cảng chất lên thùng xe tải!',
      a.x + c * 1.1, a.y, a.z - s * 1.1, a.yaw,
      'carry', false, fishCrateProp(),
      [a.x + c * 3.0 - s * 1.6, 1.65, a.z - s * 3.0 - c * 1.6],
      [a.x + c * 0.5, 0.95, a.z - s * 0.5],
      8.0, null,
    );
    this.setupShiftBtn('CA BỐC CÁ BẾN CẢNG — ANH SÁU LỰC', steps, 'VÁC KHAY CÁ LÊN XE!', 'thud', [
      [a.x + c * 1.1, a.z - s * 1.1, a.yaw],
      [a.x + c * 0.4, a.z - s * 0.4, a.yaw + 0.5],
      [a.x + c * 1.6, a.z - s * 1.6, a.yaw - 0.4],
    ]);
  }

  private setupShiftBtn(title: string, steps: string[], btnLabel: string, sound: string, pts: [number, number, number][]) {
    this.setBtns([
      {
        label: `${btnLabel} (${this.step + 1}/${steps.length})`,
        hot: true,
        fn: () => {
          sfx(sound);
          this.step++;
          const pt = pts[this.step % pts.length];
          if (ctx.player.actRigPos) {
            ctx.player.actRigPos.x = pt[0];
            ctx.player.actRigPos.y = groundY(pt[0], pt[1]);
            ctx.player.actRigPos.z = pt[1];
            ctx.player.actRigPos.yaw = pt[2];
          }
          this.flt(pt[0], 1.75, pt[1], `✔ Xong ${steps[this.step - 1]}!`, 'good');
          if (this.step >= steps.length) {
            sfx('coin');
            this.stop();
          } else {
            ctx.ui.cookShow(title, steps, this.step);
            this.setupShiftBtn(title, steps, btnLabel, sound, pts);
          }
        },
      },
      { label: 'Kết thúc ca', hot: false, fn: () => this.stop() },
    ]);
  }

  // ── Cập nhật hoạt ảnh 3D mỗi khung hình ──────────────────────────────────────────
  update(dt: number) {
    if (!this.active) return;
    this.t += dt;
    const p = ctx.player, rp = p.actRigPos;

    if (this.kind === 'rap') {
      const v = (Math.sin(this.t * 4.2) + 1) * 0.5;
      ctx.ui.cookProg(v, 0.3, 0.78, `nhịp ${this.step + 1}/6`);
      if (this.meshes[0]) {
        const sc = 1 + Math.sin(this.t * 8.4) * 0.18;
        this.meshes[0].scale.set(sc, 1, sc);
      }
      for (let i = 1; i < this.meshes.length; i++) {
        const m = this.meshes[i];
        m.position.y = 0.85 + ((this.t * 0.7 + i * 0.35) % 1.1);
        m.rotation.y += dt * 3;
      }
    } else if (this.kind === 'danh_co') {
      if (this.t > 0.65 && p.actPose === 'work') p.actPose = 'sit';
      if (this.npc && this.t > 0.65 && this.npc.pose === 'work') this.npc.pose = 'sit';
      if (this.chessTurn === 'b' && this.chessAiTimer > 0) {
        this.chessAiTimer -= dt;
        if (this.chessAiTimer <= 0) this.execAiChessMove();
      }
    } else if (this.kind === 'barber') {
      const prog = clamp(this.t / this.dur, 0, 1);
      ctx.ui.cookProg(prog, 0.2, 1.0, 'đang cắt tỉa');
      ctx.ui.cookShow('TIỆM HỚT TÓC BẢY KÉO', ['Quàng khăn', 'Tỉa kéo & chải lược', 'Soi gương'], Math.min(2, Math.floor(prog * 3)));
      if (Math.floor((this.t - dt) * 3.2) !== Math.floor(this.t * 3.2)) sfx('chop');
      for (let i = 0; i < this.meshes.length; i++) {
        const m = this.meshes[i];
        m.position.y = 1.38 - ((this.t * 0.55 + i * 0.25) % 0.65);
        m.rotation.z += dt * 5;
      }
      if (this.t >= this.dur) {
        toast('Đã cắt tỉa gọn gàng trước gương!', 'good');
        this.stop();
      }
    } else if (this.kind === 'hat_rong') {
      const prog = clamp(this.t / this.dur, 0, 1);
      ctx.ui.cookProg(prog, 0.2, 1.0, 'đang nghe hát');
      for (let i = 1; i < this.meshes.length; i++) {
        const m = this.meshes[i];
        m.position.y = 0.9 + ((this.t * 0.6 + i * 0.3) % 1.0);
        m.rotation.y += dt * 2.5;
      }
      if (this.t >= this.dur) this.stop();
    } else if (this.kind === 'danh_giay') {
      const prog = clamp(this.t / this.dur, 0, 1);
      ctx.ui.cookProg(prog, 0.2, 1.0, 'đánh bóng');
      if (Math.floor((this.t - dt) * 2.5) !== Math.floor(this.t * 2.5)) sfx('skim');
      for (let i = 0; i < this.meshes.length; i++) {
        const m = this.meshes[i];
        m.position.y = 0.22 + Math.abs(Math.sin(this.t * 6 + i)) * 0.14;
      }
      if (this.t >= this.dur) this.stop();
    } else if (this.kind === 'sua_xe') {
      const prog = clamp(this.t / this.dur, 0, 1);
      ctx.ui.cookProg(prog, 0.2, 1.0, 'đang sửa');
      if (Math.floor((this.t - dt) * 2.2) !== Math.floor(this.t * 2.2)) sfx('fix');
      for (let i = 0; i < this.meshes.length; i++) {
        const m = this.meshes[i];
        m.position.y = 0.45 + ((this.t * 0.8 + i * 0.25) % 0.5);
      }
      if (this.t >= this.dur) this.stop();
    } else if (this.kind === 'swing') {
      this.phase += dt * 2.85;
      const theta = Math.sin(this.phase) * this.amp;
      const L = 1.64;
      const sy = 2.3 - L * Math.cos(theta);
      const sz = -44.0 + L * Math.sin(theta);
      if (rp) {
        rp.x = 72.9;
        rp.y = sy - 0.12;
        rp.z = sz;
        rp.pitch = -theta * 0.75;
      }
      if (this.meshes[0]) {
        this.meshes[0].position.set(72.9, sy, sz);
        this.meshes[0].rotation.x = -theta;
      }
      ctx.ui.cookProg((Math.sin(this.phase) + 1) * 0.5, 0.35, 0.75, 'nhịp đu');
      if (this.t >= this.dur) this.stop();
    } else if (this.kind === 'karaoke') {
      const v = (Math.sin(this.t * 3.8) + 1) * 0.5;
      ctx.ui.cookProg(v, 0.3, 0.75, `câu ${this.step + 1}/4`);
      for (let i = 0; i < this.meshes.length; i++) {
        const m = this.meshes[i];
        m.position.y = 1.35 + ((this.t * 0.65 + i * 0.3) % 0.9);
        m.rotation.y += dt * 3;
      }
    } else if (this.kind === 'bong_da') {
      const prog = clamp(this.t / this.dur, 0, 1);
      ctx.ui.cookProg(prog, 0.2, 1.0, 'trực tiếp');
      if (this.meshes[0]) {
        this.meshes[0].position.y = 1.68 + Math.abs(Math.sin(this.t * 7)) * 0.12;
      }
      if (this.t >= this.dur) this.stop();
    } else if (this.kind === 'net') {
      const prog = clamp(this.t / this.dur, 0, 1);
      ctx.ui.cookProg(prog, 0.2, 1.0, 'đang ngồi máy');
      if (this.meshes[0]) {
        this.meshes[0].scale.y = 0.92 + Math.sin(this.t * 14) * 0.08;
      }
      if (this.t >= this.dur) this.stop();
    } else if (this.kind === 'temple_huong') {
      if (rp) rp.pitch = Math.max(0, Math.sin(this.t * 3.2) * 0.36);
      ctx.ui.cookProg(clamp((this.step + 0.3) / 3, 0, 1), 0.2, 1.0, `lạy ${Math.min(3, this.step + 1)}/3`);
      for (let i = 1; i < this.meshes.length; i++) {
        const m = this.meshes[i];
        m.position.y = 1.18 + ((this.t * 0.45 + i * 0.28) % 0.85);
      }
      if (this.t >= this.dur) this.stop();
    } else if (this.kind === 'labour') {
      const v = (Math.sin(this.t * 4.5) + 1) * 0.5;
      ctx.ui.cookProg(v, 0.35, 0.78, `nhát ${this.step + 1}/4`);
      for (let i = 0; i < this.meshes.length; i++) {
        const m = this.meshes[i];
        m.position.y = 0.2 + Math.abs(Math.sin(this.t * 5 + i)) * 0.18;
        m.rotation.x += dt * 6;
      }
      if (this.t >= this.dur) this.stop();
    } else {
      const prog = clamp(this.t / this.dur, 0, 1);
      ctx.ui.cookProg(prog, 0.2, 1.0, '');
      if (this.t >= this.dur) this.stop();
    }
  }
}
