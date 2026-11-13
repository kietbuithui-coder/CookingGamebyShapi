// GIAO DIỆN: HUD, bong bóng thoại/gọi món bám theo nhân vật 3D, hội thoại lựa chọn, lớp phủ khi nấu, thông báo.
import * as THREE from 'three';
import './style.css';
import { ctx, MIN_PER_SEC } from '../game/ctx';
import type { Npc } from '../game/npc';
import type { Focus } from '../game/interact';
import type { Opt } from '../game/acts';
import { bus, Toast } from '../core/bus';
import { money, hhmm, clamp, dist2 } from '../core/util';
import { WEATHER, EVENTS } from '../data/world';
import { RECIPES, RecipeDef } from '../data/recipes';
import { INGS } from '../data/ingredients';
import { SHOPS } from '../data/shops';
import { DISTRICT, districtAt } from '../world/layout';
import { hourOf } from '../sim/state';
import { activeEvents, totalDebt, level, tier, hasMet, fixedLabel } from '../sim/rules';
import { stallHint } from '../game/stall';
import { openPanel } from './panels';
import { applyLayout, editLayout } from './layout';

const IC: Record<string, string> = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  hot: '<circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
  rain: '<path d="M7 15a4 4 0 010-8 5 5 0 019.6-1A4 4 0 0117 15z"/><path d="M9 18v2M15 18v2"/>', rain2: '<path d="M7 14a4 4 0 010-8 5 5 0 019.6-1A4 4 0 0117 14z"/><path d="M8 17l-1 4M12 17l-1 4M16 17l-1 4"/>',
  storm: '<path d="M7 14a4 4 0 010-8 5 5 0 019.6-1A4 4 0 0117 14"/><path d="M13 12l-3 5h3l-2 5"/>', wind: '<path d="M3 9h10a3 3 0 10-3-3M3 14h14a3 3 0 11-3 3M3 19h6"/>', cold: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>', cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>', bag: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>',
  book: '<path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h10M9 8h5"/>', map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>', star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z"/>', starf: '<path fill="currentColor" d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z"/>',
  heart: '<path d="M12 20S4 15 4 9a4 4 0 018-1 4 4 0 018 1c0 6-8 11-8 11z"/>', home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>', shop: '<path d="M4 10l1-5h14l1 5M5 10v10h14V10M10 20v-5h4v5M4 10h16"/>',
  box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>', tool: '<path d="M14 6a4 4 0 005 5l-9 9a2 2 0 01-3-3l9-9a4 4 0 00-2-2z"/>', knife: '<path d="M4 20l5-5M9 15L19 5c1 4-1 8-6 12z"/>',
  dish: '<path d="M3 12h18a9 9 0 01-18 0zM8 8c0-2 2-2 2-4M13 8c0-2 2-2 2-4"/>', fire: '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>', flag: '<path d="M5 21V4M5 5h12l-2 4 2 4H5"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>', up: '<path d="M4 16l6-6 4 4 6-7M15 7h5v5"/>', down: '<path d="M4 8l6 6 4-4 6 7M15 17h5v-5"/>', bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  block: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>', rival: '<path d="M4 20V9l5-4 5 4v11M14 20v-7l3-2 3 2v7M2 20h20"/>', badge: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  pen: '<path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4"/>', skull: '<path d="M6 16v-5a6 6 0 0112 0v5l-2 1v3H8v-3z"/><circle cx="9.5" cy="12" r="1"/><circle cx="14.5" cy="12" r="1"/>', angry: '<circle cx="12" cy="12" r="9"/><path d="M8 16c1.5-2 6.5-2 8 0M7 9l3 1.5M17 9l-3 1.5"/>',
  drop: '<path d="M12 3c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z"/>', sparkle: '<path d="M11 3l1.8 4.7L17 9.5l-4.2 1.8L11 16l-1.8-4.7L5 9.5l4.2-1.8zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14c1.5 2.5 6.5 2.5 8 0M9 9.5v.5M15 9.5v.5"/>', run: '<circle cx="15" cy="5" r="2"/><path d="M8 21l3-6-3-3 3-4 4 2 3 1M11 15l4 2 1 4M6 10l3-2"/>',
  hand: '<path d="M8 13V5a1.5 1.5 0 013 0v6V4a1.5 1.5 0 013 0v7V6a1.5 1.5 0 013 0v9c0 4-2 6-6 6s-6-3-7-7l-1-3c1-1 2-1 3 1z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 21s7-6 7-12a7 7 0 00-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>', arrow: '<path d="M12 3l7 9h-4v9H9v-9H5z" fill="currentColor"/>', check: '<path d="M5 12l5 5 9-10"/>',
  fist: '<path d="M5.2 12.4V9.6a1.5 1.5 0 013 0v1.6V6.8a1.5 1.5 0 013 0v4.4V7.4a1.5 1.5 0 013 0v6.4"/><path d="M14.2 8.2a1.5 1.5 0 013 0v5.2a6 6 0 01-6 6h-1.2a5.2 5.2 0 01-5.2-5.2v-1.6"/>', jump: '<path d="M12 20V6M6.5 11.5L12 5l5.5 6.5"/><path d="M5 21h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.5"/>', chat: '<path d="M4 5h16v11H10l-5 4v-4H4z"/>',
};
export const ic = (n: string) => `<svg class="ic" viewBox="0 0 24 24">${IC[n] ?? IC.info}</svg>`;
/** k sao đặc + (5−k) sao rỗng, vẽ bằng SVG để máy nào cũng hiện đúng. */
export const starsHtml = (k: number) => ic('starf').repeat(clamp(Math.round(k), 0, 5)) + ic('star').repeat(5 - clamp(Math.round(k), 0, 5));
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = '', parent?: HTMLElement): HTMLElementTagNameMap[K] { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; parent?.appendChild(e); return e; }
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

const iconCache = new Map<string, string>();
/** Biểu tượng món ăn vẽ bằng canvas (dùng trong bong bóng gọi món và thực đơn). */
export function dishIcon(r: RecipeDef): string {
  let u = iconCache.get(r.id); if (u) return u;
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d')!, hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
  const layers = r.finish.find((s) => s.t === 'assemble') as any, cols: number[] = layers ? layers.layers.map((l: any) => l.col ?? INGS[l.ing]?.c ?? 0xd9a05a) : Object.keys(r.ings).slice(0, 3).map((k) => INGS[k].c);
  const main = hex(cols[0] ?? 0xd9a05a), top = hex(cols[1] ?? cols[0] ?? 0x3fae5a), acc = hex(cols[2] ?? 0x3fae5a);
  g.lineWidth = 4; g.strokeStyle = '#3b2a1e'; g.lineJoin = 'round';
  const v = r.vessel;
  if (v === 'bowl') { g.fillStyle = main; g.beginPath(); g.ellipse(48, 46, 32, 12, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = top; g.beginPath(); g.ellipse(42, 42, 14, 6, -0.3, 0, 7); g.fill(); g.fillStyle = acc; g.beginPath(); g.ellipse(58, 44, 8, 4, 0.4, 0, 7); g.fill(); g.fillStyle = '#fbfaf5'; g.beginPath(); g.moveTo(14, 48); g.quadraticCurveTo(20, 84, 48, 84); g.quadraticCurveTo(76, 84, 82, 48); g.quadraticCurveTo(48, 62, 14, 48); g.fill(); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3; for (const x of [34, 48, 62]) { g.beginPath(); g.moveTo(x, 30); g.quadraticCurveTo(x + 6, 20, x, 12); g.stroke(); } }
  else if (v === 'plate' || v === 'paper' || v === 'box') { g.fillStyle = v === 'plate' ? '#fbfaf5' : '#f3e6c8'; g.beginPath(); if (v === 'plate') g.ellipse(48, 60, 40, 18, 0, 0, 7); else g.roundRect(10, 44, 76, 34, 6); g.fill(); g.stroke(); g.fillStyle = main; g.beginPath(); g.ellipse(40, 52, 22, 14, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = top; g.beginPath(); g.ellipse(62, 54, 14, 9, 0.3, 0, 7); g.fill(); g.stroke(); g.fillStyle = acc; g.beginPath(); g.ellipse(48, 44, 9, 5, -0.4, 0, 7); g.fill(); }
  else if (v === 'bread' || v === 'bun') { g.fillStyle = '#d9a05a'; g.beginPath(); if (v === 'bread') g.ellipse(48, 56, 40, 16, -0.25, 0, 7); else g.ellipse(48, 62, 30, 12, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = top; g.beginPath(); g.ellipse(48, 48, v === 'bread' ? 32 : 30, 7, v === 'bread' ? -0.25 : 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = acc; g.beginPath(); g.ellipse(50, 44, 26, 5, v === 'bread' ? -0.25 : 0, 0, 7); g.fill(); g.fillStyle = '#e9b56a'; g.beginPath(); if (v === 'bread') g.ellipse(46, 38, 36, 12, -0.25, Math.PI, 7); else g.ellipse(48, 40, 30, 20, 0, Math.PI, 7); g.fill(); g.stroke(); }
  else if (v === 'cup' || v === 'glass') { g.fillStyle = main; g.beginPath(); g.moveTo(28, 24); g.lineTo(34, 84); g.lineTo(62, 84); g.lineTo(68, 24); g.closePath(); g.fill(); g.stroke(); g.fillStyle = top; g.fillRect(31, 26, 34, 14); g.strokeStyle = '#3b2a1e'; g.beginPath(); g.moveTo(28, 24); g.lineTo(68, 24); g.stroke(); g.strokeStyle = '#d9463c'; g.lineWidth = 5; g.beginPath(); g.moveTo(54, 30); g.lineTo(64, 6); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(38, 46, 9, 9); g.fillRect(50, 58, 9, 9); }
  else { g.fillStyle = '#fbfaf0'; g.beginPath(); g.roundRect(12, 40, 72, 22, 11); g.fill(); g.stroke(); g.fillStyle = top; g.fillRect(24, 44, 48, 6); g.fillStyle = acc; g.fillRect(30, 52, 36, 5); }
  u = c.toDataURL(); iconCache.set(r.id, u); return u;
}

interface Att { e: HTMLElement; n?: Npc; p?: { x: number; y: number; z: number }; dy: number; life: number; rise: number; kind: 'bub' | 'ord' | 'flt' | 'lab'; w?: number; h?: number; sx?: number; sy?: number; }
const _v = new THREE.Vector3();
export class UI {
  root = document.getElementById('ui')!; world: HTMLElement; private atts: Att[] = []; private hudT = 0; private E: Record<string, HTMLElement> = {};
  private dlgOpen = false; private prevMode = 'play'; modalName = ''; onCookBtn: ((id: string, down: boolean) => void) | null = null; onCookSlide: ((v: number) => void) | null = null;
  private labels: Att[] = []; private gradeT = 0; private fpsN = 0; private fpsT = 0; fpsVal = 60; private lastMs = performance.now(); private worstMs = 0; /** khung hình chậm nhất (ms) trong nửa giây vừa qua */ hitch = 0; private lastCash = -1; private questMin = false; private em = 14; private sliderV = 0.4;
  constructor() {
    const R = this.root, E = this.E, add = (id: string, html = '', cls = '') => { const e = el('div', cls, html, R); e.id = id; E[id] = e; return e; };
    this.world = add('world');
    // ba chip giờ – thời tiết – chỗ đang đứng nằm chung một hàng cho gọn (hẹp quá thì tự xuống dòng)
    add('hud-tl', `<div class="row"><span class="chip" id="clock"></span><span class="chip" id="wx"></span><span class="chip" id="place"></span></div><div id="stats"></div>`);
    add('hud-tr', `<div class="row"><span class="chip" id="rep"></span><span class="chip" id="money"></span></div><div class="row" id="menub"><button class="ib hide" id="stowb" title="Cất gánh vào ba lô">${ic('box')}</button><button class="ib" data-p="bag">${ic('bag')}<span class="dot hide" id="bagdot"></span></button><button class="ib" data-p="book">${ic('book')}</button><button class="ib" data-p="map">${ic('map')}</button><button class="ib" data-p="settings">${ic('gear')}</button></div><div class="row"><span class="chip hide" id="wanted"></span><span class="chip hide" id="debt"></span><span class="chip" id="fps"></span></div>`);
    add('quest', '<small>MỤC TIÊU</small><span></span>'); add('way', '', 'chip hide'); add('events'); add('cross'); add('focus'); add('stam', '<b></b>', 'hide');
    add('act', `<button class="alt hide"></button><button class="main dim">${ic('hand')}</button>`); add('runb', `<button class="run">${ic('run')}</button>`);
    add('act2', `<button class="hit" title="Đấm (F)">${ic('fist')}</button><button class="jump" title="Nhảy (Space)">${ic('jump')}</button>`);
    add('stick', '<i></i>', 'hide'); add('cart', '', 'chip hide'); add('stallchip', '', 'chip hide'); add('toasts');
    add('cook', `<button class="btn small red quit">${ic('x')} Bỏ dở</button><div class="top"><div class="title"></div><div class="steps"></div><div class="hint"></div><div class="prog hide"><div class="meter"><div class="z"></div><div class="v"></div></div><small></small></div></div><div class="heat hide"><small>LỬA</small><div class="meter"><div class="z"></div><div class="v"></div><div class="n"></div></div></div><div class="slider hide"><i>LỬA</i></div><div class="card hide"></div><div class="btns"></div>`, 'hide');
    add('grade', '', 'hide'); add('dlg', '', 'hide'); add('fade'); add('zzz', '', 'hide'); add('modal', '', 'hide'); add('menu', '', 'hide'); add('load', 'Đang dựng thành phố…<small>Gánh Hàng Đường Phố</small>'); add('rotate', 'Hãy xoay ngang điện thoại để chơi thoải mái hơn.<br><br><button class="btn" id="rotok">Cứ chơi dọc</button>', 'want');
    for (const id of ['clock', 'wx', 'place', 'stats', 'rep', 'money', 'bagdot', 'debt', 'fps', 'stowb', 'wanted']) E[id] = document.getElementById(id)!;
    E.stowb.onclick = () => { if (ctx.mode === 'play') ctx.stall.stow(); };
    E.stats.innerHTML = [['dish', 'hunger', 'Đói'], ['drop', 'thirst', 'Khát'], ['bolt', 'energy', 'Sức'], ['heart', 'health', 'Khoẻ'], ['sparkle', 'hygiene', 'Sạch'], ['smile', 'mood', 'Vui']].map(([i, k, t]) => `<div class="stat" data-k="${k}" title="${t}">${ic(i)}<i><b></b></i></div>`).join('');
    document.getElementById('rotok')!.onclick = () => E.rotate.classList.remove('want');
    R.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-p]') as HTMLElement | null; if (b && ctx.mode === 'play') { ctx.sound.play('ui'); this.panel(b.dataset.p!); } });
    const main = E.act.querySelector('.main') as HTMLElement, alt = E.act.querySelector('.alt') as HTMLElement, run = E.runb.querySelector('.run') as HTMLElement;
    main.onclick = () => ctx.interact.trigger(); alt.onclick = () => ctx.interact.triggerAlt(); run.onclick = () => { ctx.input.runLock = !ctx.input.runLock; run.classList.toggle('on', ctx.input.runLock); };
    const hitB = E.act2.querySelector('.hit') as HTMLElement, jumpB = E.act2.querySelector('.jump') as HTMLElement;
    hitB.onclick = () => ctx.acts.punch(); jumpB.onclick = () => ctx.acts.jump();
    E.quest.onclick = () => { this.questMin = !this.questMin; E.quest.classList.toggle('min', this.questMin); };
    E.cart.onclick = () => { const c = ctx.acts.cart; if (c) { const v = ctx.npcs.fixed.get(c.shop); if (v) ctx.acts.way = { x: v.x, z: v.z, name: 'Tính tiền: ' + SHOPS[c.shop].name }; } };
    E.stallchip.onclick = () => { const s = ctx.g.stall; if (s.where === 'placed' || s.where === 'home') ctx.acts.way = { x: s.x, z: s.z, name: 'Quầy của bạn' }; };
    // lớp nấu ăn
    const C = E.cook; (C.querySelector('.quit') as HTMLElement).onclick = () => this.onCookBtn?.('quit', true);
    C.querySelector('.btns')!.addEventListener('pointerdown', (e) => { const b = (e.target as HTMLElement).closest('button'); if (b) { e.preventDefault(); this.onCookBtn?.(b.dataset.id!, true); } });
    const sl = C.querySelector('.slider') as HTMLElement, setS = (e: PointerEvent) => { const r = sl.getBoundingClientRect(), v = clamp(1 - (e.clientY - r.top) / r.height); this.sliderV = v; (sl.firstElementChild as HTMLElement).style.bottom = v * 100 + '%'; this.onCookSlide?.(v); };
    sl.addEventListener('pointerdown', (e) => { sl.setPointerCapture(e.pointerId); setS(e); }); sl.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') setS(e); });
    applyLayout(); window.addEventListener('resize', () => applyLayout()); window.addEventListener('orientationchange', () => setTimeout(applyLayout, 250));
    bus.on('toast', (t) => this.toast(t)); bus.on('cash', () => { E.money.classList.remove('bump'); void E.money.offsetWidth; E.money.classList.add('bump'); });
    ctx.input.onStick = (on, ox, oy, dx, dy) => { const s = E.stick; s.classList.toggle('hide', !on); if (on) { s.style.left = ox + 'px'; s.style.top = oy + 'px'; (s.firstElementChild as HTMLElement).style.transform = `translate(${dx}px,${dy}px)`; } };
    ctx.input.onKey = (k) => {
      // Đang mở lời thoại: phím nào cũng để chọn câu trả lời.
      if (this.dlgOpen) {
        if (k === 'e' || k === 'f' || k === ' ' || k === 'enter') (E.dlg.querySelector('.btn:not(.off)') as HTMLElement)?.click();
        else if (k >= '1' && k <= '9') (E.dlg.querySelectorAll('.btn')[+k - 1] as HTMLElement)?.click();
        return;
      }
      if (k === 'e' || k === 'enter') ctx.interact.trigger();
      else if (k === 'f') ctx.acts.punch();
      else if (k === ' ') ctx.acts.jump();
      else if (k === 'r') ctx.interact.triggerAlt();
      else if (ctx.mode === 'play' && (k === 'tab' || k === 'i')) this.panel('bag');
      else if (ctx.mode === 'play' && k === 'm') this.panel('map');
      else if (ctx.mode === 'play' && k === 'b') this.panel('book');
      else if (k === 'escape') { if (this.modalName) this.closePanel(); else if (ctx.mode === 'play') this.panel('settings'); }
    };
  }
  $(id: string) { return this.E[id]; }
  /** Áp lại cỡ giao diện và vị trí nút (sau khi đổi cài đặt). */
  layout() { applyLayout(); }
  /** Mở màn hình cho người chơi tự xếp vị trí và độ lớn các nút. Game tạm dừng nhận điều khiển trong lúc xếp. */
  editLayout() {
    this.closePanel(); this.closeDialog(); ctx.mode = 'panel'; ctx.input.reset();
    editLayout(() => { ctx.mode = 'play'; bus.emit('toast', { text: 'Đã lưu cách xếp nút.', kind: 'good' }); });
  }
  loading(t: string | null) { this.E.load.classList.toggle('hide', t === null); if (t) this.E.load.firstChild!.textContent = t; }
  toast(t: Toast) {
    const box = this.E.toasts, e = el('div', 'toast ' + (t.kind ?? 'info'), (t.icon ? ic(t.icon) : '') + `<span>${esc(t.text)}</span>`, box);
    while (box.children.length > 4) box.firstChild!.remove();
    setTimeout(() => { e.classList.add('out'); setTimeout(() => e.remove(), 320); }, t.long ? 6500 : 3600);
  }
  // ───────── phần tử bám theo thế giới 3D ─────────
  private att(kind: Att['kind'], cls: string, html: string, n: Npc | undefined, p: Att['p'], dy: number, life: number, rise = 0): Att { const a: Att = { e: el('div', cls, html, this.world), n, p, dy, life, rise, kind }; this.atts.push(a); return a; }
  say(n: Npc, text: string, secs = 3) { this.unsay(n); this.att('bub', 'bub', esc(text), n, undefined, 0.12, secs); }
  unsay(n: Npc) { for (const a of this.atts) if (a.n === n && a.kind === 'bub') a.life = 0; }
  order(n: Npc, rid: string, count: number) { this.unorder(n); const r = RECIPES[rid]; this.att('ord', 'ord', `<img src="${dishIcon(r)}" alt=""><span>${count > 1 ? count + '× ' : ''}${esc(r.short)}</span><i><b style="width:100%"></b></i>`, n, undefined, 0.1, 1e9); }
  unorder(n: Npc) { for (const a of this.atts) if (a.n === n && a.kind === 'ord') a.life = 0; }
  patience(n: Npc, f: number) { const a = this.atts.find((x) => x.n === n && x.kind === 'ord'); if (!a) return; (a.e.querySelector('b') as HTMLElement).style.width = clamp(f) * 100 + '%'; a.e.classList.toggle('hurry', f < 0.3); }
  float(text: string, at: Npc | { x: number; y: number; z: number }, kind = 'info') { const isN = (at as Npc).rig !== undefined; this.att('flt', 'flt ' + kind, esc(text), isN ? (at as Npc) : undefined, isN ? undefined : (at as any), isN ? 0.45 : 0, 1.5, 0.6); }
  floatAt(text: string, p: THREE.Vector3, kind = 'info') { this.att('flt', 'flt ' + kind, esc(text), undefined, { x: p.x, y: p.y, z: p.z }, 0, 1.1, 0.25); }
  stars(n: Npc, s: number) { const k = Math.round(s); this.att('flt', 'flt stars', starsHtml(k), n, undefined, 0.75, 2, 0.4); }
  private place(a: Att, dt: number): boolean {
    a.life -= dt; if (a.life <= 0 || (a.n && a.n.state === 'gone')) { a.e.remove(); return false; }
    const cam = ctx.camera; let x: number, y: number, z: number;
    if (a.n) { x = a.n.x; y = a.n.y + a.n.rig.headY + a.dy; z = a.n.z; } else { x = a.p!.x; y = a.p!.y + a.dy; z = a.p!.z; }
    if (a.rise) a.dy += a.rise * dt;
    _v.set(x, y, z).project(cam);
    const far = dist2(x, z, cam.position.x, cam.position.z) > (a.kind === 'ord' ? 30 * 30 : 20 * 20);
    if (_v.z > 1 || far || Math.abs(_v.x) > 1.2 || Math.abs(_v.y) > 1.2) { a.e.style.visibility = 'hidden'; return true; }
    let sx = (_v.x * 0.5 + 0.5) * window.innerWidth, sy = (-_v.y * 0.5 + 0.5) * window.innerHeight;
    if (a.kind === 'bub' || a.kind === 'ord') {
      // khách đứng sát quầy thì đầu chạm mép trên màn hình: giữ bong bóng luôn nằm trọn trong khung nhìn, dưới dải HUD
      if (a.w === undefined) { a.w = a.e.offsetWidth; a.h = a.e.offsetHeight; }
      const top = 2.7 * this.em, W = window.innerWidth;
      if (a.kind === 'ord') {
        // phiếu gọi món: nằm trên lời thoại nếu còn chỗ, không thì dạt sang bên cạnh lời thoại
        const b = this.atts.find((q) => q.n === a.n && q.kind === 'bub' && q.sx !== undefined && q.life > 0);
        if (b) { const above = b.sy! - b.h! - 6; if (above - a.h! >= top) sy = above; else { const right = b.sx! + b.w! / 2 + a.w! / 2 + 6; sx = right + a.w! / 2 < W - 4 ? right : b.sx! - b.w! / 2 - a.w! / 2 - 6; sy = b.sy!; } }
      }
      sy = Math.max(sy, top + a.h!); sx = clamp(sx, a.w! / 2 + 4, W - a.w! / 2 - 4); a.sx = sx; a.sy = sy;
    }
    a.e.style.visibility = 'visible'; a.e.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) translate(-50%,${a.kind === 'lab' ? '-50%' : '-100%'})`;
    if (a.kind === 'flt') a.e.style.opacity = String(clamp(a.life * 2));
    return true;
  }
  // ───────── hội thoại ─────────
  dialog(d: { who: string; npc?: Npc; text: string; opts: Opt[] }) {
    const E = this.E.dlg; if (!this.dlgOpen && ctx.mode !== 'panel') this.prevMode = ctx.mode; this.dlgOpen = true; if (ctx.mode === 'play') { ctx.mode = 'panel'; ctx.input.reset(); }
    E.classList.remove('hide'); E.innerHTML = `<h3>${esc(d.who)}</h3><p>${esc(d.text)}</p><div class="opts"></div>`; const box = E.lastElementChild as HTMLElement;
    if (d.npc) d.npc.talkT = 1.5;
    d.opts.forEach((o, i) => { const b = el('button', 'btn' + (o.off ? ' off' : '') + (i === 0 && d.opts.length > 1 && !o.off ? ' yellow' : ''), `<span>${esc(o.t)}</span>` + (o.sub ? `<small>${esc(o.sub)}</small>` : ''), box); b.onclick = () => { ctx.sound.play('ui'); this.closeDialog(); o.fn?.(); }; });
    this.focus(null);
  }
  closeDialog() { if (!this.dlgOpen) return; this.dlgOpen = false; this.E.dlg.classList.add('hide'); if (ctx.mode === 'panel' && !this.modalName) ctx.mode = 'play'; }
  // ───────── bảng lớn ─────────
  panel(name: string) { if (ctx.mode !== 'play' && ctx.mode !== 'panel') return; this.closeDialog(); this.modalName = name; ctx.mode = 'panel'; ctx.input.reset(); this.E.modal.classList.remove('hide'); openPanel(this, name); }
  closePanel() { if (!this.modalName) return; this.modalName = ''; this.E.modal.classList.add('hide'); this.E.modal.innerHTML = ''; if (ctx.mode === 'panel' && !this.dlgOpen) ctx.mode = 'play'; ctx.stall.refresh(); }
  focus(f: Focus | null) {
    const E = this.E, key = f ? f.label + '|' + (f.sub ?? '') + '|' + (f.alt?.label ?? '') : '';
    if (E.focus.dataset.k === key) return; E.focus.dataset.k = key;
    E.focus.innerHTML = f ? `<b>${esc(f.label)}</b>` + (f.sub ? `<small>${esc(f.sub)}</small>` : '') : ''; E.cross.classList.toggle('on', !!f);
    (E.act.querySelector('.main') as HTMLElement).classList.toggle('dim', !f); const alt = E.act.querySelector('.alt') as HTMLElement; alt.classList.toggle('hide', !f?.alt); if (f?.alt) alt.textContent = f.alt.label;
  }
  fade(on: boolean, secs = 0.8) { const f = this.E.fade; f.style.transitionDuration = secs + 's'; f.classList.toggle('on', on); }
  sleeping(on: boolean) { this.E.zzz.classList.toggle('hide', !on); }
  menu(html: string | null) { const m = this.E.menu; m.classList.toggle('hide', html === null); if (html !== null) m.innerHTML = html; return m; }
  // ───────── lớp phủ nấu ăn ─────────
  cookShow(title: string, steps: string[], idx: number) { const C = this.E.cook; C.classList.remove('hide'); C.querySelector('.title')!.textContent = title; C.querySelector('.steps')!.innerHTML = steps.length > 1 ? steps.map((s, i) => `<span class="${i < idx ? 'done' : i === idx ? 'on' : ''}">${esc(s)}</span>`).join('') : ''; this.setHud(false); }
  cookHint(t: string) { this.E.cook.querySelector('.hint')!.textContent = t; }
  cookHeat(v: number | null, lo = 0, hi = 0) { const h = this.E.cook.querySelector('.heat') as HTMLElement; h.classList.toggle('hide', v === null); if (v === null) return; const s = (h.querySelector('.z') as HTMLElement).style; s.bottom = lo * 100 + '%'; s.height = (hi - lo) * 100 + '%'; (h.querySelector('.v') as HTMLElement).style.height = clamp(v) * 100 + '%'; (h.querySelector('.n') as HTMLElement).style.bottom = clamp(v) * 100 + '%'; }
  cookProg(v: number | null, lo = 0, hi = 0, label = '') { const p = this.E.cook.querySelector('.prog') as HTMLElement; p.classList.toggle('hide', v === null); if (v === null) return; const z = (p.querySelector('.z') as HTMLElement).style; z.left = lo * 100 + '%'; z.width = (hi - lo) * 100 + '%'; (p.querySelector('.v') as HTMLElement).style.width = clamp(v) * 100 + '%'; p.querySelector('small')!.textContent = label; }
  cookButtons(list: { id: string; t: string; hot?: boolean }[]) { this.E.cook.querySelector('.btns')!.innerHTML = list.map((b) => `<button class="btn${b.hot ? ' hot' : ''}" data-id="${b.id}">${esc(b.t)}</button>`).join(''); }
  cookSlider(v: number | null) { const s = this.E.cook.querySelector('.slider') as HTMLElement; s.classList.toggle('hide', v === null); if (v !== null) { this.sliderV = v; (s.firstElementChild as HTMLElement).style.bottom = v * 100 + '%'; } }
  cookLabels(list: { t: string; p: THREE.Vector3; cur?: boolean; done?: boolean }[]) { for (const a of this.labels) a.life = 0; this.labels = list.map((l) => this.att('lab', 'lab' + (l.cur ? ' cur' : '') + (l.done ? ' done' : ''), esc(l.t), undefined, { x: l.p.x, y: l.p.y, z: l.p.z }, 0, 1e9)); }
  cookCard(items: { t: string; state: number }[] | null) { const c = this.E.cook.querySelector('.card') as HTMLElement; c.classList.toggle('hide', !items); if (items) c.innerHTML = '<b>Thứ tự cho vào</b>' + items.map((i, k) => `<div class="${i.state === 2 ? 'done' : i.state === 1 ? 'cur' : ''}">${k + 1}. ${esc(i.t)}</div>`).join(''); }
  cookGrade(score: number, text: string) { const g = this.E.grade; g.classList.remove('hide'); const k = Math.max(1, Math.round(score * 5)); g.innerHTML = `${esc(text)}<small>${starsHtml(k)}</small>`; this.gradeT = 1.1; g.style.animation = 'none'; void g.offsetWidth; g.style.animation = ''; }
  cookHide() { this.E.cook.classList.add('hide'); this.E.grade.classList.add('hide'); for (const a of this.labels) a.life = 0; this.labels = []; this.setHud(true); }
  private setHud(on: boolean) { for (const k of ['hud-tl', 'hud-tr', 'quest', 'act', 'runb', 'act2', 'cross', 'focus', 'events', 'way', 'cart', 'stallchip']) this.E[k].style.display = on ? '' : 'none'; if (!on) this.E['hud-tl'].style.display = ''; this.root.classList.toggle('cooking', !on); }
  hud(on: boolean) { for (const k of ['hud-tl', 'hud-tr', 'quest', 'act', 'runb', 'act2', 'cross', 'focus', 'events', 'way', 'cart', 'stallchip', 'toasts', 'stam']) this.E[k].style.display = on ? '' : 'none'; }

  update(dt: number) {
    this.atts = this.atts.filter((a) => this.place(a, dt));
    if (this.gradeT > 0) { this.gradeT -= dt; if (this.gradeT <= 0) this.E.grade.classList.add('hide'); }
    // FPS đo theo đồng hồ thật (dt của game bị chặn ở 50 ms nên không dùng để đo được)
    const nowMs = performance.now(); if (!this.fpsT) this.fpsT = nowMs; this.fpsN++;
    const frameMs = nowMs - this.lastMs; this.lastMs = nowMs; if (frameMs > this.worstMs && frameMs < 5000) this.worstMs = frameMs;
    if (nowMs - this.fpsT >= 500) { this.fpsVal = (this.fpsN * 1000) / (nowMs - this.fpsT); this.fpsN = 0; this.fpsT = nowMs; this.hitch = this.worstMs; this.worstMs = 0; }
    this.hudT -= dt; if (this.hudT > 0 || !ctx.g) return; this.hudT = 0.2;
    this.em = parseFloat(getComputedStyle(this.root).fontSize) || 14;
    const g = ctx.g, E = this.E, w = WEATHER[g.weather.now], p = ctx.player;
    E.clock.innerHTML = `${ic('clock')}Ngày ${g.day + 1} · <b>${hhmm(g.min)}</b>`;
    E.wx.innerHTML = `${ic(hourOf(g) > 18.6 || hourOf(g) < 5.4 ? (w.rain > 0 ? w.icon : 'moon') : w.icon)}${w.name}`;
    E.place.innerHTML = `${ic('pin')}${DISTRICT[districtAt(p.x, p.z)].name}`;
    if (g.cash !== this.lastCash) { this.lastCash = g.cash; E.money.innerHTML = `${ic('cash')}${money(g.cash)}`; }
    E.rep.innerHTML = `${ic('star')}${Math.round(g.rep)} · cấp ${level(g)}`;
    E.wanted.classList.toggle('hide', (g.wanted ?? 0) < 1);
    if (g.wanted >= 1) { E.wanted.innerHTML = `${ic('badge')}Bị để ý ${Math.round(g.wanted)}%`; E.wanted.style.background = g.wanted >= 45 ? 'rgba(160,30,24,.92)' : 'rgba(40,26,16,.72)'; }
    const td = totalDebt(g); E.debt.classList.toggle('hide', td <= 0); if (td > 0) { const due = Math.min(...g.debts.map((d) => d.due)); E.debt.innerHTML = `${ic('skull')}Nợ ${money(td)} · ${due < g.day ? 'QUÁ HẠN' : due === g.day ? 'hạn hôm nay' : 'còn ' + (due - g.day) + ' ngày'}`; E.debt.style.background = due <= g.day ? 'rgba(160,30,24,.9)' : ''; }
    E.fps.classList.toggle('hide', !ctx.set.fps); if (ctx.set.fps) E.fps.textContent = `${Math.round(this.fpsVal)} FPS · ${ctx.renderer.info.render.calls} lệnh vẽ`;
    for (const s of Array.from(E.stats.children) as HTMLElement[]) { const v = (g.st as any)[s.dataset.k!] as number; (s.querySelector('b') as HTMLElement).style.width = v + '%'; s.classList.toggle('low', v < 22); s.classList.toggle('mid', v >= 22 && v < 45); }
    (E.quest.lastElementChild as HTMLElement).textContent = ctx.acts.quest(); E.quest.classList.toggle('min', this.questMin || (g.stall.open && g.stall.where === 'placed' && dist2(p.x, p.z, g.stall.x, g.stall.z) < 25));
    const way = ctx.acts.way; E.way.classList.toggle('hide', !way);
    if (way) { const dx = way.x - p.x, dz = way.z - p.z, ang = Math.atan2(dx, dz) - p.yaw; E.way.innerHTML = `<svg class="ic" viewBox="0 0 24 24" style="transform:rotate(${(-ang * 180 / Math.PI).toFixed(0)}deg)">${IC.arrow}</svg>${esc(way.name)} · ${Math.round(Math.hypot(dx, dz))} m`; }
    const evs = activeEvents(g); E.events.innerHTML = evs.map((e) => `<span class="chip${e.danger ? ' danger' : ''}">${ic(e.icon)}${esc(e.name)}</span>`).join('') + (g.flags.sick ? `<span class="chip danger">${ic('heart')}Bị cảm</span>` : '') + (g.weather.wet > 55 ? `<span class="chip">${ic('drop')}Ướt sũng</span>` : '') + (g.weather.flood > 0.35 ? `<span class="chip">${ic('drop')}Ngập khu trũng</span>` : '');
    const c = ctx.acts.cart; E.cart.classList.toggle('hide', !c); if (c) E.cart.innerHTML = `${ic('bag')}Giỏ: ${c.lines.map((l) => `${l.n} ${INGS[l.id].name.toLowerCase()}`).join(', ')} — <b>${money(ctx.acts.cartTotal())}</b> · đưa ${hasMet(g, c.shop) ? SHOPS[c.shop].vendor : fixedLabel(g, c.shop).toLowerCase()} tính tiền`;
    const s = g.stall; E.stallchip.classList.toggle('hide', s.tier === 0); if (s.tier) E.stallchip.innerHTML = `${ic('shop')}${tier(g).name}: ${stallHint(g, ctx.stall.stowed)}` + (s.open ? ` · ${ctx.stall.customers.length} khách · hôm nay ${money(g.led.revenue + g.led.tips)}` : '');
    // Thanh sức bền chỉ hiện khi đang hụt so với trần hiện tại (đang chạy hoặc đang hồi), không hiện suốt chỉ vì đói/khát làm trần tụt xuống.
    const st = E.stam; st.classList.toggle('hide', p.stamina > p.staminaCap - 0.02 || ctx.mode !== 'play'); (st.firstElementChild as HTMLElement).style.width = p.stamina * 100 + '%'; st.style.setProperty('--cap', p.staminaCap * 100 + '%');
    const n = g.bag.reduce((a, x) => a + (x.fresh < 35 && INGS[x.id].shelf < 9000 ? 1 : 0), 0); E.bagdot.classList.toggle('hide', n === 0); E.bagdot.textContent = String(n);
    // nút cất gánh: đang gánh trên vai thì cất vào ba lô; đang dựng quầy thì dọn cả quầy vào ba lô
    const carried = s.tier > 0 && s.where === 'carried';
    const placed = s.tier > 0 && s.tier < 3 && (s.where === 'placed' || s.where === 'home') && Math.hypot(s.x - ctx.player.x, s.z - ctx.player.z) < 6;
    E.stowb.classList.toggle('hide', !(carried || placed));
    E.stowb.classList.toggle('on', carried && ctx.stall.stowed);
    E.stowb.title = placed ? 'Dọn quầy, gói vào ba lô' : ctx.stall.stowed ? 'Lấy gánh ra khỏi ba lô' : 'Cất gánh vào ba lô';
    void EVENTS; void MIN_PER_SEC;
  }
}
