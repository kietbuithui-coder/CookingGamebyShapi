// GÁNH HÀNG ĐƯỜNG PHỐ — điểm khởi động: dựng thành phố, nối các hệ thống, vòng lặp chính, lưu/tải game.
import * as THREE from 'three';
import './ui/fonts.css';
import { ctx, QUALITY, MIN_PER_SEC, SAVE_KEY, loadSettings, saveSettings, baseFov, canFullscreen, toggleFullscreen } from './game/ctx';
import { fontsReady } from './gfx/tex';
import { buildCity } from './world/city';
import { Env } from './world/env';
import { Input } from './game/input';
import { Player } from './game/player';
import { Npcs, placeOpen } from './game/npc';
import { StallSys } from './game/stall';
import { Interact } from './game/interact';
import { Acts } from './game/acts';
import { Cook } from './cook/cook';
import { RaceSystem } from './game/race';
import { Sound } from './audio/audio';
import { Traffic } from './game/traffic';
import { Birds } from './world/birds';
import { UI } from './ui/ui';
import { newGame, migrate, hourOf, Game } from './sim/state';
import * as State from './sim/state';
import * as Rules from './sim/rules';
import { advance, wx, floodPct, activeEvents, mods, eventOn, blackoutAt } from './sim/rules';
import { bus, toast } from './core/bus';
import { districtAt } from './world/layout';
import { clamp } from './core/util';

async function boot() {
  const canvas = document.getElementById('gl') as HTMLCanvasElement;
  const mobile = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  ctx.mobile = mobile; ctx.set = loadSettings(mobile);
  ctx.sound = new Sound(); ctx.sound.sfxVol = ctx.set.sfx; ctx.sound.musVol = ctx.set.music;
  ctx.input = new Input(canvas);
  const ui = (ctx.ui = new UI());
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance', stencil: false }); }
  catch { ui.loading('Thiết bị hoặc trình duyệt này không hỗ trợ WebGL nên không chạy được game 3D.'); return; }
  ctx.renderer = renderer; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = (ctx.scene = new THREE.Scene()), camera = (ctx.camera = new THREE.PerspectiveCamera(68, 1, 0.08, 260));
  await fontsReady(); await new Promise((r) => setTimeout(r, 30));
  const city = (ctx.city = buildCity()); ctx.world = city.world; scene.add(city.root);
  ctx.env = new Env(scene, city); ctx.env.thunder = () => setTimeout(() => ctx.sound.play('thunder'), 300 + Math.random() * 1200);
  ctx.player = new Player(); ctx.npcs = new Npcs(); ctx.stall = new StallSys(); ctx.cook = new Cook(); ctx.acts = new Acts(); ctx.interact = new Interact(); ctx.race = new RaceSystem();
  ctx.traffic = new Traffic(); ctx.birds = new Birds();
  ctx.g = newGame(1);

  const resize = () => { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; if (!ctx.player?.camTo) camera.fov = baseFov(w / h); camera.updateProjectionMatrix(); };
  ctx.applyQuality = () => {
    const q = QUALITY[ctx.set.quality]; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pr)); resize();
    ctx.env.setShadows(q.shadow > 0, q.shadowSize || 30, q.shadow || 512); ctx.env.viewDist = q.view; camera.far = q.view + 60; camera.updateProjectionMatrix(); ctx.env.setLights(q.lights);
    for (const c of city.chunks) c.group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && (m.name === 'lit' || m.name === 'detail' || m.name === 'unlit')) m.castShadow = q.shadow > 0; });
    // ('unlit' cũng đổ bóng: tường bao đã bỏ mặt trong để khỏi trùng với lớp lót nội thất, nên chính lớp lót phải chắn nắng thay,
    //  nếu không nắng xiên buổi sáng/chiều sẽ lọt xuyên qua tường vào trong nhà.)
  };
  ctx.applyQuality(); window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));

  // ───────── lưu / tải ─────────
  let dirty = false, saveT = 0;
  ctx.save = () => { if (ctx.mode === 'menu') return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(ctx.g)); } catch { /* bộ nhớ đầy */ } dirty = false; saveT = 0; };
  bus.on('save', () => { dirty = true; });
  const hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } };
  const start = (g: Game, fresh: boolean) => {
    ctx.g = g; ctx.mode = 'play'; ctx.speed = MIN_PER_SEC; ctx.player.place(g.pos.x, g.pos.z, g.pos.yaw, g.pos.pitch); ctx.player.eyeTarget = 1.6; ctx.player.setCarry('');
    for (const n of ctx.npcs.list.slice()) if (n.state !== 'fixed') ctx.npcs.remove(n);
    ctx.stall.reset(); ctx.acts.cart = null; ctx.acts.job = null; ctx.acts.way = null; ctx.acts.spawnLitter(); ui.menu(null); ui.hud(true); ui.fade(false, 1.2); ctx.input.reset();
    if (fresh) {
      const you = g.ac === 'anh' ? 'anh' : 'chị';
      ui.dialog({ who: 'Gầm cầu vượt, 6 giờ sáng', text: `Tiếng xe cộ ầm ầm trên đầu đánh thức bạn dậy. Tấm bìa các-tông ẩm sương, bụng đói meo, trong túi còn đúng 18.000₫.\n\nMất việc, mất chỗ trọ, bạn chỉ còn hai bàn tay — và ký ức về gánh hàng thơm phức của mẹ ngày xưa. Biết đâu, ${you} cũng làm được?`, opts: [{ t: 'Đứng dậy thôi!', fn: () => {
        ui.dialog({ who: 'Bắt đầu từ đâu?', text: (mobile ? 'ĐIỀU KHIỂN: ngón trái kéo để đi · ngón phải vuốt để nhìn quanh · chạm vào người, đồ vật hoặc nút tròn vàng để tương tác.' : 'ĐIỀU KHIỂN: W A S D để đi, giữ Shift để chạy · giữ chuột kéo để nhìn quanh · bấm vào người, đồ vật hoặc phím E để tương tác.') + '\n\n• Chạm vào người đi đường để xin chút tiền lẻ.\n• Nhặt chai, lon; bới thùng rác rồi bán cho vựa ve chai.\n• Ra Chợ Xóm Chiều vác hàng thuê lúc sáng sớm, hoặc rửa chén cho quán cơm Bà Tư.\n• Ông Bảy ở lều bên kia biết nhiều chuyện lắm — ghé hỏi thử.\n\nĐủ tiền thì mua GÁNH ở tiệm Đồ Nghề Ba Tài. Mở Bản đồ để ghim đường đi.', opts: [{ t: 'Hiểu rồi.', fn: () => ctx.save() }] }); } }] });
    } else toast(`Chào mừng trở lại! Ngày ${g.day + 1}, ${Math.floor(g.min / 60)} giờ.`, 'info', 'sun');
  };
  ctx.newGame = (ac) => start(newGame((Math.random() * 1e9) | 0, ac), true);
  const menu = () => {
    ctx.mode = 'menu'; ui.hud(false); ui.fade(false, 0.5);
    const m = ui.menu(`<div class="box"><h1>Gánh Hàng<br>Đường Phố<small>Từ gầm cầu tới ông chủ quán — tự tay nấu, tự tay bán</small></h1><div class="btns">${hasSave() ? '<button class="btn yellow" data-m="cont">Chơi tiếp</button>' : ''}<button class="btn ${hasSave() ? '' : 'yellow'}" data-m="new">Chơi mới</button><button class="btn small" data-m="q">Đồ hoạ: ${QUALITY[ctx.set.quality].name}</button>${canFullscreen() ? '<button class="btn small" data-m="fs">Toàn màn hình</button>' : ''}</div><div class="note">Nên xoay ngang điện thoại · Game tự lưu trên máy này</div></div>`);
    m.onclick = (e) => {
      const b = (e.target as HTMLElement).closest('[data-m]') as HTMLElement | null; if (!b) return; ctx.sound.unlock(); ctx.sound.play('ui'); const k = b.dataset.m;
      if (k === 'cont') { try { const g = migrate(JSON.parse(localStorage.getItem(SAVE_KEY)!)); if (g) { start(g, false); return; } } catch { /* save hỏng */ } toast('Không đọc được bản lưu cũ.', 'bad'); }
      else if (k === 'new') m.innerHTML = `<div class="box"><h1 style="font-size:1.8em">Bạn muốn được gọi là…</h1><div class="btns"><button class="btn yellow" data-m="anh">Anh Hai</button><button class="btn yellow" data-m="chi">Chị Hai</button><button class="btn small" data-m="back">Quay lại</button></div>${hasSave() ? '<div class="note">Chơi mới sẽ ghi đè bản lưu hiện có.</div>' : ''}</div>`;
      else if (k === 'anh' || k === 'chi') ctx.newGame(k === 'anh' ? 'anh' : 'chị'); else if (k === 'back') menu();
      else if (k === 'q') { ctx.set.quality = (ctx.set.quality + 1) % QUALITY.length; ctx.set.auto = false; ctx.applyQuality(); saveSettings(); b.textContent = 'Đồ hoạ: ' + QUALITY[ctx.set.quality].name; }
      else if (k === 'fs') void toggleFullscreen();
    };
  };
  ctx.toMenu = menu;
  window.addEventListener('pointerdown', () => ctx.sound.unlock(), { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) ctx.save(); }); window.addEventListener('pagehide', () => ctx.save());
  let summary = false; bus.on('day', () => { summary = true; }); let bankrupt = false; bus.on('bankrupt', () => { bankrupt = true; });
  bus.on('sfx', (n) => ctx.sound.play(n));

  // ───────── vòng lặp chính ─────────
  let last = performance.now(), lowT = 0, musT = 0;
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now; ctx.time += dt;
    const g = ctx.g, inp = ctx.input; inp.enabled = ctx.mode === 'play'; inp.poll();
    if (ctx.mode !== 'menu') {
      const paused = !!ui.modalName;
      if (!paused) advance(g, dt * ctx.speed, ctx.acts.act());
      ctx.player.update(dt); ctx.npcs.update(dt); ctx.stall.update(dt); ctx.cook.update(dt); ctx.race.update(dt); ctx.acts.update(dt); ctx.interact.update(dt);
      ctx.traffic.update(dt); ctx.birds.update(dt);
      saveT += dt; if ((dirty && saveT > 2) || saveT > 45) ctx.save();
      if (ctx.mode === 'play' && !ui.modalName) { if (bankrupt) { bankrupt = false; summary = false; ui.panel('bankrupt'); } else if (summary) { summary = false; ui.panel('summary'); } }
      // tự hạ đồ hoạ nếu máy giật
      if (ctx.set.auto && ctx.mode === 'play' && ui.fpsVal < 23 && ctx.set.quality > 0) { lowT += dt; if (lowT > 6) { lowT = 0; ctx.set.quality--; ctx.applyQuality(); saveSettings(); toast(`Máy hơi giật nên đã hạ đồ hoạ xuống mức "${QUALITY[ctx.set.quality].name}". Đổi lại trong Cài đặt.`, 'info', 'gear', true); } } else lowT = Math.max(0, lowT - dt);
    } else {
      const t = ctx.time * 0.04; camera.position.set(-29.5 + Math.sin(t) * 3, 5.5 + Math.sin(t * 0.7) * 1.5, 44 - ((ctx.time * 1.2) % 70)); camera.lookAt(-29.5 + Math.sin(t * 1.3) * 10, 3, camera.position.z - 30);
    }
    const p = ctx.player, covered = ctx.mode !== 'menu' && ctx.acts.sheltered, d = districtAt(p.x, p.z), festive = activeEvents(g).some((e) => e.festive);
    ctx.env.blackout = blackoutAt(g, d); ctx.env.update(dt, hourOf(g), wx(g), camera, covered, floodPct(g), festive);
    const cp = camera.position, vd = ctx.env.fog.far;
    for (const c of city.chunks) { if (c.id === 'edge' || c.id === 'misc' || c.id === 'south') continue; const far = (c.cx - cp.x) ** 2 + (c.cz - cp.z) ** 2 > (vd * 0.62 + 34) ** 2; if (c.detail) c.detail.visible = !far; }
    ui.update(dt);
    // âm thanh môi trường + nhạc theo ngữ cảnh
    musT -= dt;
    if (musT <= 0) {
      musT = 0.25; const w = wx(g), h = hourOf(g), near = ctx.npcs.list.reduce((a, n) => a + (!n.hidden && (n.x - p.x) ** 2 + (n.z - p.z) ** 2 < 400 ? 1 : 0), 0);
      ctx.sound.ambient(0.25, { crowd: clamp(near / 9) * (d === 'cho' && h > 5 && h < 18 ? 1.5 : 1), rain: ctx.env.rainAmt, wind: w.wind, night: ctx.env.night, indoor: covered ? 1 : 0, morning: h > 5 && h < 9 });
      const danger = activeEvents(g).some((e) => e.danger) && (g.stall.where === 'placed' || eventOn(g, 'bao')) || g.st.health < 20;
      ctx.sound.music(ctx.mode === 'menu' ? 'sang' : danger ? 'nguy' : festive && (d === 'congvien' || d === 'cho') ? 'lehoi' : g.stall.open && g.stall.where === 'placed' ? 'ban' : w.rain > 0.3 ? 'mua' : ctx.env.night > 0.6 ? 'dem' : 'sang');
      void mods;
    }
    ctx.sound.tick();
    renderer.render(scene, camera);
  };
  try { renderer.compile(scene, camera); } catch { /* một số máy không hỗ trợ biên dịch trước */ }
  ui.loading(null); menu(); requestAnimationFrame(frame);
  // Cửa hậu gỡ lỗi: thêm ?debug vào địa chỉ để mở (dùng cho kiểm thử tự động).
  if (/[?&]debug/.test(location.search)) {
    const w = window as any; w.__game = ctx; w.__R = Rules; w.__S = State;
    w.__cam = (px?: number, py = 0, pz = 0, lx = 0, ly = 0, lz = 0) => (px === undefined ? ctx.player.view(null) : ctx.player.view(new THREE.Vector3(px, py, pz), new THREE.Vector3(lx, ly, lz)));
    w.__xp = (n = 40) => { const g = ctx.g, l0 = g.xp; g.xp += Math.max(0, n); const lvl = Math.min(10, Math.floor(Math.sqrt(g.xp / 30))); const got = lvl > Math.min(10, Math.floor(Math.sqrt(l0 / 30))) ? Rules.unlockRecipes(g, lvl <= 1 ? 1 : 2) : []; return { xp: g.xp, lvl, got: got.map((r) => r.id) }; };
    w.__lvl = (n: number) => { const g = ctx.g; g.xp = Math.max(0, 30 * n * n - 3); Rules.addXp(g, 1); return { xp: g.xp, known: Object.values(g.rec).filter((r) => r.known).length }; };
    w.__rude = (kind?: 'paper' | 'spit' | 'curse' | 'chase') => { const p = ctx.player, n = ctx.npcs.list.filter((x) => x.kind === 'ped').sort((a, b) => (a.x - p.x) ** 2 + (a.z - p.z) ** 2 - ((b.x - p.x) ** 2 + (b.z - p.z) ** 2))[0]; if (!n) return null; if (kind === 'spit') ctx.npcs.spit(n); else if (kind === 'chase') ctx.npcs.chase(n); else ctx.npcs['rude'](n, kind); return n.id; };
    w.__open = (id: string) => placeOpen(id);
    w.__give = (id: string, n: number, where: 'bag' | 'store' | 'home' = 'store') => State.addStack(where === 'bag' ? ctx.g.bag : where === 'home' ? ctx.g.home : ctx.g.stall.store, { id, n, fresh: 100, q: 1, cost: Rules.unitCost(ctx.g, id) });
  }
}
boot().catch((e) => { console.error(e); const l = document.getElementById('load'); if (l) l.textContent = 'Lỗi khởi động: ' + (e?.message ?? e); });
