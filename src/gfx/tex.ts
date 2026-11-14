// Toàn bộ texture của game được vẽ bằng Canvas 2D lúc khởi động — không tải ảnh nào từ ngoài.
import * as THREE from 'three';
import { RNG, TAU } from '../core/util';

export const FONT_DISPLAY = '"Baloo 2", system-ui, sans-serif';
export const FONT_HAND = '"Patrick Hand", "Baloo 2", system-ui, sans-serif';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}
function tex(c: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 2;
  return t;
}
function speckle(g: CanvasRenderingContext2D, R: RNG, n: number, size: number, cols: string[], amin = 0.05, amax = 0.25, S = 256) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = R.range(amin, amax); g.fillStyle = R.pick(cols);
    const s = R.range(0.5, size), x = R.range(0, S), y = R.range(0, S);
    g.fillRect(x, y, s, s);
    if (x + s > S) g.fillRect(x - S, y, s, s);
    if (y + s > S) g.fillRect(x, y - S, s, s);
  }
  g.globalAlpha = 1;
}

export type GroundKind = 'asphalt' | 'pave' | 'grass' | 'dirt' | 'tile' | 'concrete' | 'water' | 'wood';

export function groundTexture(kind: GroundKind): THREE.CanvasTexture {
  const S = 256, [c, g] = canvas(S, S), R = new RNG(kind.length * 7919 + kind.charCodeAt(0));
  switch (kind) {
    case 'asphalt':
      g.fillStyle = '#4b4f58'; g.fillRect(0, 0, S, S);
      speckle(g, R, 2600, 3, ['#2e3138', '#666b75', '#7a7f88', '#3a3d45']);
      g.strokeStyle = 'rgba(25,26,30,.35)'; g.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) { g.beginPath(); let x = R.range(0, S), y = R.range(0, S); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += R.range(-22, 22); y += R.range(-22, 22); g.lineTo(x, y); } g.stroke(); }
      break;
    case 'pave': {
      g.fillStyle = '#b9ab98'; g.fillRect(0, 0, S, S);
      const n = 8, t = S / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const v = R.next();
        g.fillStyle = v < 0.12 ? '#b3705c' : v < 0.2 ? '#c98f6a' : ['#c4b6a2', '#bdae9a', '#cabdaa', '#b5a793'][Math.floor(R.next() * 4)];
        g.fillRect(i * t + 1, j * t + 1, t - 2, t - 2);
      }
      speckle(g, R, 900, 2.5, ['#8d8172', '#e0d6c6'], 0.05, 0.2);
      break;
    }
    case 'grass':
      g.fillStyle = '#5f9b45'; g.fillRect(0, 0, S, S);
      speckle(g, R, 2200, 5, ['#4c8438', '#77b356', '#8cc463', '#427530'], 0.1, 0.35);
      g.lineWidth = 1;
      for (let i = 0; i < 500; i++) { g.strokeStyle = R.pick(['rgba(140,200,100,.5)', 'rgba(50,100,40,.45)']); const x = R.range(0, S), y = R.range(0, S); g.beginPath(); g.moveTo(x, y); g.lineTo(x + R.range(-2, 2), y - R.range(3, 7)); g.stroke(); }
      break;
    case 'dirt':
      g.fillStyle = '#8a7763'; g.fillRect(0, 0, S, S);
      speckle(g, R, 2400, 5, ['#6f5e4d', '#a08c76', '#7b6a58', '#b09c86'], 0.08, 0.3);
      break;
    case 'concrete':
      g.fillStyle = '#a9a6a0'; g.fillRect(0, 0, S, S);
      speckle(g, R, 1800, 4, ['#8f8c86', '#bebbb4', '#9b9892'], 0.06, 0.22);
      g.strokeStyle = 'rgba(70,68,64,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, S - 2, S - 2);
      break;
    case 'tile': {
      g.fillStyle = '#d9d2c3'; g.fillRect(0, 0, S, S);
      const n = 4, t = S / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#efe9dc' : '#e3dccd'; g.fillRect(i * t + 1.5, j * t + 1.5, t - 3, t - 3); }
      speckle(g, R, 500, 3, ['#c9c1b0', '#ffffff'], 0.04, 0.15);
      break;
    }
    case 'wood':
      g.fillStyle = '#a97c50'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 8; i++) { g.fillStyle = ['#9c7046', '#b48759', '#a2764b'][i % 3]; g.fillRect(0, i * 32 + 1, S, 30); }
      g.strokeStyle = 'rgba(70,45,20,.25)'; g.lineWidth = 1;
      for (let i = 0; i < 60; i++) { const y = R.range(0, S); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + R.range(-4, 4), 170, y + R.range(-4, 4), S, y); g.stroke(); }
      break;
    case 'water':
      g.fillStyle = '#3d7f86'; g.fillRect(0, 0, S, S);
      g.lineWidth = 2;
      for (let i = 0; i < 70; i++) {
        g.strokeStyle = R.pick(['rgba(190,235,230,.28)', 'rgba(30,80,90,.3)']);
        const x = R.range(0, S), y = R.range(0, S), w = R.range(14, 40);
        for (const dx of [0, -S, S]) { g.beginPath(); g.moveTo(x + dx, y); g.quadraticCurveTo(x + dx + w / 2, y - 4, x + dx + w, y); g.stroke(); }
      }
      break;
  }
  return tex(c);
}

/** Chấm tròn mềm (hạt khói, bóng đổ giả, vệt sáng đèn đường). */
export function softDot(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 64, hard = 0.0): THREE.CanvasTexture {
  const [c, g] = canvas(size, size), r = size / 2;
  const gr = g.createRadialGradient(r, r, r * hard, r, r, r);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = tex(c, false); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ───────────────────────── Khuôn mặt NPC ─────────────────────────
export const FACE_COLS = 16, FACE_ROWS = 8;
/** Tên các biểu cảm — dùng thay số trần để khỏi phải nhớ cột nào là gì. */
export { EXPR } from '../data/expr';
export type { ExprId } from '../data/expr';
/** Cột: 0 thường, 1 vui, 2 rất vui, 3 khó chịu, 4 giận, 5 buồn, 6 ngạc nhiên/nói, 7 chớp mắt,
 *  8 cười mỉm, 9 nháy mắt, 10 buồn ngủ, 11 đau, 12 sợ, 13 khinh, 14 ăn ngon (nhai), 15 phồng má hờn.
 *  Hàng: 0 nam trẻ, 1 nữ trẻ, 2 trẻ em, 3 ông cụ, 4 bà cụ, 5 đeo kính, 6 kính đen (giang hồ), 7 chú có ria. */
export function faceAtlas(): THREE.CanvasTexture {
  const C = 128, [c, g] = canvas(C * FACE_COLS, C * FACE_ROWS);
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (let row = 0; row < FACE_ROWS; row++) for (let col = 0; col < FACE_COLS; col++) {
    g.save(); g.translate(col * C, row * C); drawFace(g, row, col); g.restore();
  }
  const t = tex(c, false);
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
function drawFace(g: CanvasRenderingContext2D, id: number, ex: number) {
  const ink = '#2a1c18', kid = id === 2, old = id === 3 || id === 4, fem = id === 1 || id === 4;
  const eyeY = kid ? 60 : 56, ex0 = 64 - 23, ex1 = 64 + 23, erx = kid ? 12 : 10, ery = kid ? 15 : fem ? 13 : 12;
  const arc = ex === 2 || ex === 8 || ex === 14;                       // mắt cong (cười híp)
  const half = ex === 3 || ex === 10 || ex === 13;                     // mí sụp
  // má hồng
  if (kid || fem || ex === 1 || ex === 2 || ex === 8 || ex === 9 || ex === 14 || ex === 15) {
    g.fillStyle = 'rgba(240,110,110,.42)';
    const rx = ex === 15 ? 15 : 11, ry = ex === 15 ? 11 : 7;
    for (const x of [28, 100]) { g.beginPath(); g.ellipse(x, 82, rx, ry, 0, 0, TAU); g.fill(); }
  }
  // mắt
  for (const x of [ex0, ex1]) {
    if (id === 6) continue;
    if (ex === 11) { // đau: nhắm tịt, hai vệt chéo
      g.strokeStyle = ink; g.lineWidth = 4; g.beginPath();
      g.moveTo(x - 8, eyeY - 6); g.lineTo(x + 8, eyeY + 6); g.moveTo(x + 8, eyeY - 6); g.lineTo(x - 8, eyeY + 6); g.stroke();
      continue;
    }
    const wink = ex === 9 && x === ex0;
    if (arc || ex === 7 || wink) {
      g.strokeStyle = ink; g.lineWidth = 4.5; g.beginPath();
      if (arc || wink) g.arc(x, eyeY + 4, 9, Math.PI * 1.15, Math.PI * 1.85); else { g.moveTo(x - 9, eyeY + 1); g.quadraticCurveTo(x, eyeY + 5, x + 9, eyeY + 1); }
      g.stroke(); continue;
    }
    const fear = ex === 12, sleep = ex === 10;
    const ry = old && !fear ? ery * 0.72 : fear ? ery * 1.28 : ex === 6 ? ery * 1.12 : sleep ? ery * 0.9 : ery;
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, eyeY, fear ? erx * 1.14 : erx, ry, 0, 0, TAU); g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.6; g.stroke();
    const dx = ex === 3 || ex === 13 ? 2.5 : sleep ? -1.5 : 0, pr = ex === 6 ? 5.2 : fear ? 4.6 : sleep ? 5.6 : 6.6;
    g.fillStyle = ink; g.beginPath(); g.arc(x + dx, eyeY + (ex === 5 || sleep ? 2.5 : 0.5), pr, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + dx - 2.2, eyeY - 2.4, 2.1, 0, TAU); g.fill();
    if (half || ex === 4) { // mí sụp
      const lid = ex === 4 ? 0.55 : ex === 13 ? 0.62 : 0.78;
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillRect(x - erx - 3, eyeY - ry - 4, erx * 2 + 6, ry * lid + 4); g.restore();
      g.strokeStyle = ink; g.lineWidth = 3.4; g.beginPath(); const yy = eyeY - ry + ry * lid;
      g.moveTo(x - erx, yy); g.lineTo(x + erx, yy); g.stroke();
    }
    if (fem) { g.strokeStyle = ink; g.lineWidth = 2.4; const s = x < 64 ? -1 : 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + s * (erx - 3 + k), eyeY - ry * 0.7 + k * 3); g.lineTo(x + s * (erx + 5 + k), eyeY - ry * 0.95 + k * 3.5); g.stroke(); } }
    if (old) { g.strokeStyle = 'rgba(60,40,30,.55)'; g.lineWidth = 1.8; const s = x < 64 ? -1 : 1; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(x + s * (erx + 3), eyeY - 3 + k * 6); g.lineTo(x + s * (erx + 10), eyeY - 6 + k * 10); g.stroke(); } }
  }
  // lông mày
  const bw = id === 7 || id === 0 ? 5.2 : fem ? 2.8 : 4, by = eyeY - (kid ? 22 : 20) - (ex === 6 ? 5 : ex === 12 ? 7 : 0);
  const tilt = ex === 4 ? 9 : ex === 11 ? 10 : ex === 15 ? 8 : ex === 3 || ex === 13 ? 5 : ex === 12 ? -6 : ex === 5 ? -7 : ex === 1 || ex === 2 || ex === 8 ? -1 : 0; // + = nhíu vào trong
  g.strokeStyle = old ? '#9a9590' : ink; g.lineWidth = bw;
  if (id !== 6) for (const s of [-1, 1]) { const x = 64 + s * 23; g.beginPath(); g.moveTo(x - s * 11, by + tilt); g.quadraticCurveTo(x, by - 3 - (ex === 6 ? 3 : 0), x + s * 11, by - tilt * 0.6 + 1); g.stroke(); }
  // mũi
  g.strokeStyle = 'rgba(70,35,25,.5)'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(62, 72); g.quadraticCurveTo(66, 77, 60, 78); g.stroke();
  // miệng
  const my = kid ? 96 : 94; g.strokeStyle = ink; g.lineWidth = 3.6; g.fillStyle = '#7a2a2a';
  g.beginPath();
  if (ex === 0 || ex === 7) { g.moveTo(53, my); g.quadraticCurveTo(64, my + 4, 75, my); g.stroke(); }
  else if (ex === 1) { g.moveTo(49, my - 3); g.quadraticCurveTo(64, my + 11, 79, my - 3); g.stroke(); }
  else if (ex === 2) { g.moveTo(47, my - 5); g.quadraticCurveTo(64, my + 20, 81, my - 5); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(55, my - 4, 18, 4); }
  else if (ex === 3) { g.moveTo(52, my + 1); g.lineTo(76, my - 1); g.stroke(); }
  else if (ex === 4) { g.moveTo(50, my + 7); g.quadraticCurveTo(64, my - 9, 78, my + 7); g.closePath(); g.fill(); g.stroke(); }
  else if (ex === 5) { g.moveTo(51, my + 5); g.quadraticCurveTo(64, my - 6, 77, my + 5); g.stroke(); }
  else if (ex === 6) { g.ellipse(64, my + 2, 7.5, 9.5, 0, 0, TAU); g.fill(); g.stroke(); }
  else if (ex === 8) { g.moveTo(54, my + 1); g.quadraticCurveTo(64, my + 9, 74, my + 1); g.stroke(); }                       // cười mỉm
  else if (ex === 9) { g.moveTo(48, my - 3); g.quadraticCurveTo(64, my + 14, 80, my - 3); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(54, my - 3, 20, 4); } // cười tươi
  else if (ex === 10) { g.ellipse(64, my + 3, 5, 7.5, 0, 0, TAU); g.fill(); g.stroke(); }                                 // ngáp
  else if (ex === 11) { g.moveTo(50, my + 2); g.lineTo(56, my - 3); g.lineTo(62, my + 3); g.lineTo(68, my - 3); g.lineTo(74, my + 3); g.lineTo(78, my - 1); g.stroke(); } // nghiến răng
  else if (ex === 12) { g.ellipse(64, my + 2, 6, 8.5, 0, 0, TAU); g.fill(); g.stroke(); }                                 // há miệng vì sợ
  else if (ex === 13) { g.moveTo(52, my + 5); g.quadraticCurveTo(64, my + 2, 77, my - 4); g.stroke(); }                    // cười khẩy
  else if (ex === 14) { g.moveTo(52, my - 2); g.quadraticCurveTo(64, my + 12, 76, my - 2); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(55, my - 3, 18, 4); } // nhai ngon
  else if (ex === 15) { g.ellipse(64, my + 2, 5.5, 6.5, 0, 0, TAU); g.fill(); g.stroke(); }                               // chu môi hờn
  if (fem && !(ex === 2 || ex === 4 || ex === 6 || ex === 10 || ex === 11 || ex === 12 || ex === 13)) { g.strokeStyle = 'rgba(200,60,80,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(56, my + 4); g.quadraticCurveTo(64, my + 8, 72, my + 4); g.stroke(); }
  // phụ kiện theo kiểu mặt
  if (id === 5) { g.strokeStyle = '#1e2430'; g.lineWidth = 3.2; for (const x of [ex0, ex1]) { g.beginPath(); g.arc(x, eyeY, 15.5, 0, TAU); g.stroke(); } g.beginPath(); g.moveTo(ex0 + 15, eyeY - 2); g.lineTo(ex1 - 15, eyeY - 2); g.stroke(); }
  if (id === 6) {
    g.fillStyle = '#15161a'; for (const x of [ex0, ex1]) { g.beginPath(); g.roundRect(x - 17, eyeY - 10, 34, 21, 7); g.fill(); }
    g.fillRect(ex0 + 14, eyeY - 6, ex1 - ex0 - 28, 4);
    g.fillStyle = 'rgba(255,255,255,.3)'; for (const x of [ex0, ex1]) g.fillRect(x - 12, eyeY - 7, 9, 3);
    g.strokeStyle = 'rgba(150,40,40,.75)'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(96, 70); g.lineTo(106, 90); g.stroke();
    g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); g.moveTo(40, eyeY - 21 + (ex === 4 ? 5 : 0)); g.lineTo(60, eyeY - 17); g.moveTo(88, eyeY - 21 + (ex === 4 ? 5 : 0)); g.lineTo(68, eyeY - 17); g.stroke();
  }
  if (id === 7) { g.fillStyle = ink; g.beginPath(); g.moveTo(46, 87); g.quadraticCurveTo(64, 76, 82, 87); g.quadraticCurveTo(64, 85, 46, 87); g.fill(); g.lineWidth = 4; g.strokeStyle = ink; g.stroke(); }
  if (id === 3) { g.strokeStyle = '#c9c4be'; g.lineWidth = 5; g.beginPath(); g.moveTo(48, 87); g.quadraticCurveTo(64, 80, 80, 87); g.stroke(); }
  if (ex === 5 && id !== 6) { g.fillStyle = 'rgba(120,190,255,.85)'; g.beginPath(); g.ellipse(ex1 + 9, eyeY + 17, 3.5, 6, 0, 0, TAU); g.fill(); }
  // mồ hôi: sợ / đau; giọt to bên thái dương
  if ((ex === 11 || ex === 12) && id !== 6) {
    const drop = (x: number, y: number, r: number) => { g.fillStyle = 'rgba(120,190,255,.85)'; g.beginPath(); g.ellipse(x, y, r * 0.8, r * 1.5, 0, 0, TAU); g.fill(); };
    drop(30, eyeY + 12, 4.4);
    if (ex === 12) drop(98, eyeY + 2, 3.6);
  }
  // buồn ngủ: hai chữ z lơ lửng góc trên
  if (ex === 10) {
    g.fillStyle = 'rgba(60,55,70,.75)'; g.font = 'bold 17px system-ui,sans-serif'; g.textAlign = 'center';
    g.fillText('z', 100, 32); g.font = 'bold 13px system-ui,sans-serif'; g.fillText('z', 112, 20);
  }
}

// ───────────────────────── Biển hiệu ─────────────────────────
export interface SignStyle { bg: string; fg: string; border?: string; font?: 'display' | 'hand'; sub?: string; subFg?: string; vertical?: boolean; stripe?: string; }
export interface UVRect { u0: number; v0: number; u1: number; v1: number; }

/** Một tấm canvas lớn chứa mọi biển hiệu → cả thành phố chỉ tốn 1 draw call cho chữ. */
export class SignAtlas {
  canvas: HTMLCanvasElement; g: CanvasRenderingContext2D; texture: THREE.CanvasTexture;
  private y = 0; private shelves: { h: number; x: number; y: number }[] = []; full = false; private cache = new Map<string, UVRect>();
  /** Tỉ lệ diện tích đã dùng (0–1) — để kiểm tra khi phát triển. */
  get used() { return this.y / this.size; }
  constructor(public size = 2048) {
    [this.canvas, this.g] = canvas(size, size);
    this.texture = tex(this.canvas, false);
    this.texture.generateMipmaps = true; this.texture.minFilter = THREE.LinearMipmapLinearFilter; this.texture.anisotropy = 4;
  }
  /** Vẽ một biển, trả về vùng UV. aspect = rộng/cao của biển ngoài đời; px = chiều cao điểm ảnh mong muốn. */
  draw(text: string, aspect: number, st: SignStyle, px = 64): UVRect {
    const key = text + '|' + aspect.toFixed(2) + '|' + JSON.stringify(st) + px;
    const hit = this.cache.get(key); if (hit) return hit;
    const k = this.size / 2048;
    let h = Math.round(px * k), w = Math.round(px * aspect * k);
    if (st.vertical) { w = Math.round(px * k); h = Math.round((px / aspect) * k); }
    // xếp theo "kệ": các biển cao gần bằng nhau nằm chung một hàng để đỡ phí chỗ
    const bucket = Math.ceil(h / 6) * 6;
    let sh = this.shelves.find((q) => q.h === bucket && q.x + w + 2 <= this.size);
    if (!sh) {
      if (this.y + bucket > this.size) { if (!this.full) console.warn('SignAtlas đầy'); this.full = true; return { u0: 0, v0: 0, u1: 0.01, v1: 0.01 }; }
      sh = { h: bucket, x: 0, y: this.y }; this.shelves.push(sh); this.y += bucket + 2;
    }
    const g = this.g, x = sh.x, y = sh.y;
    g.save(); g.translate(x, y);
    g.fillStyle = st.bg; g.fillRect(0, 0, w, h);
    if (st.stripe) { g.fillStyle = st.stripe; g.fillRect(0, h * 0.82, w, h * 0.18); }
    if (st.border) { g.strokeStyle = st.border; g.lineWidth = Math.max(2, h * 0.07); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth); }
    g.fillStyle = st.fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const fam = st.font === 'hand' ? FONT_HAND : FONT_DISPLAY, wt = st.font === 'hand' ? '400' : '800';
    if (st.vertical) {
      const chars = text.split(' '); const lh = Math.min((h * 0.9) / chars.length, w * 0.9);
      chars.forEach((ch, i) => { let fs = lh * 0.82; g.font = `${wt} ${fs}px ${fam}`; const tw = g.measureText(ch).width; if (tw > w * 0.86) { fs *= (w * 0.86) / tw; g.font = `${wt} ${fs}px ${fam}`; } g.fillText(ch, w / 2, h * 0.05 + lh * (i + 0.55)); });
    } else {
      const hasSub = !!st.sub, mainH = hasSub ? h * 0.6 : h;
      let fs = mainH * 0.7; g.font = `${wt} ${fs}px ${fam}`;
      const tw = g.measureText(text).width; if (tw > w * 0.9) { fs *= (w * 0.9) / tw; g.font = `${wt} ${fs}px ${fam}`; }
      g.fillText(text, w / 2, mainH * 0.54 + (hasSub ? h * 0.03 : 0));
      if (hasSub) { let f2 = h * 0.24; g.font = `600 ${f2}px ${FONT_DISPLAY}`; const t2 = g.measureText(st.sub!).width; if (t2 > w * 0.92) { f2 *= (w * 0.92) / t2; g.font = `600 ${f2}px ${FONT_DISPLAY}`; } g.fillStyle = st.subFg ?? st.fg; g.fillText(st.sub!, w / 2, h * 0.79); }
    }
    g.restore();
    const S = this.size, r: UVRect = { u0: (x + 0.5) / S, u1: (x + w - 0.5) / S, v1: 1 - (y + 0.5) / S, v0: 1 - (y + h - 0.5) / S };
    sh.x += w + 2;
    this.cache.set(key, r); this.texture.needsUpdate = true;
    return r;
  }
}

export async function fontsReady(): Promise<void> {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('800 32px "Baloo 2"', 'Phố ẩm thực'), document.fonts.load('600 32px "Baloo 2"', 'Phố ẩm thực'), document.fonts.load('400 32px "Patrick Hand"', 'Phố ẩm thực')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* dùng font hệ thống */ }
}
