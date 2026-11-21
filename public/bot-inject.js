// ═══════════════════════════════════════════════════════════════
// BOT GÁNH HÀNG ĐƯỜNG PHỐ — inject trực tiếp vào game page
// Chạy trong cùng DOM context → truy cập window.__game trực tiếp
// ═══════════════════════════════════════════════════════════════
(function() {
'use strict';

const LOC = {
  camp:    {x:49, z:100.3},
  mktGate: {x:-36.5, z:0},
  mktMid:  {x:-59, z:0},
  dock:    {x:-79, z:-3.6},
  equip:   {x:-23, z:5},
  scrap:   {x:-59, z:29.5},
  eatery:  {x:-5, z:-23},
  temple:  {x:-45, z:-65},
  sellCho: {x:-37.2, z:9},
  park:    {x:59, z:-59},
  tap:     {x:73.1, z:-75.1},
};

const B = {
  phase:'wait', target:null, sub:'', log:[], paused:false,
  cash0:0, earnGoal:200000, sellGoal:100000, sellEarned:0,
  begs:0, litters:0, docks:0, dishes:0, lastBegCash:0, begCooldown:0, giveUpUntil:0,
  stuck:0, lx:0, lz:0, retries:0, wait:0, action:'', tick:0,
  started:false, menuStep:0, dlgWait:0,
};

// ─── Game accessors (trực tiếp, không iframe) ───
const ctx = () => window.__game;
const G = () => window.__game?.g;
const P = () => window.__game?.player;
const IX = () => window.__game?.interact;
const ACTS = () => window.__game?.acts;
const NPCS = () => window.__game?.npcs;
const UI = () => window.__game?.ui;
const ready = () => !!window.__gameReady;

// Read anchor positions from game to auto-fix LOC
function syncLOC() {
  const c = ctx();
  const A = c?.world?.anchors;
  if (!A) return;
  if (A.v_temple) { LOC.temple = {x:A.v_temple.x, z:A.v_temple.z}; }
  if (A.v_scrap) { LOC.scrap = {x:A.v_scrap.x, z:A.v_scrap.z}; }
  if (A.v_scrap2) { LOC.scrap2 = {x:A.v_scrap2.x, z:A.v_scrap2.z}; }
  if (A.v_eatery) { LOC.eatery = {x:A.v_eatery.x, z:A.v_eatery.z}; }
  if (A.bed_gamcau) { LOC.camp = {x:A.bed_gamcau.x, z:A.bed_gamcau.z}; }
  if (A.v_dock) { LOC.dock = {x:A.v_dock.x, z:A.v_dock.z}; }
  if (A.board) { LOC.board = {x:A.board.x, z:A.board.z}; }
  if (A.v_equip) { LOC.equip = {x:A.v_equip.x, z:A.v_equip.z}; }
  if (A.v_m_kho) { LOC.mKho = {x:A.v_m_kho.x, z:A.v_m_kho.z}; }
  if (A.dock) { LOC.dockTake = {x:A.dock.x, z:A.dock.z}; }
  if (A.v_wholesale) { LOC.wholesale = {x:A.v_wholesale.x, z:A.v_wholesale.z}; }
  const names = Object.entries(LOC).map(([k,v])=>`${k}(${v.x?.toFixed(0)},${v.z?.toFixed(0)})`).join(' ');
  lg(`📍 LOC: ${names}`,'good');
}

const D = (x1,z1,x2,z2) => Math.hypot(x1-x2, z1-z2);
const angTo = (px,pz,tx,tz) => Math.atan2(tx-px, tz-pz);
const h = () => { const g=G(); return g ? g.min/60 : 6; };
const hStr = () => { const g=G(); if(!g)return'??:??'; return Math.floor(g.min/60)+'h'+String(Math.floor(g.min%60)).padStart(2,'0'); };

function lg(msg, cls='') {
  B.log.push({m:`[${hStr()}] ${msg}`, c:cls, t:Date.now()});
  if(B.log.length>200) B.log.shift();
  console.log(`[BOT ${hStr()}] ${msg}`);
  // Gửi log về server
  try { fetch('/__bot_log', {method:'POST',headers:{'Content-Type':'text/plain'},body:`[${hStr()}] ${msg}`}); } catch{}
}

// ─── UI State Detection (trực tiếp trong DOM) ───
function uiState() {
  const menu = document.getElementById('menu');
  const dlg = document.getElementById('dlg');
  const modal = document.getElementById('modal');
  const cook = document.getElementById('cook');
  if (menu && !menu.classList.contains('hide')) return 'menu';
  if (dlg && !dlg.classList.contains('hide')) return 'dlg';
  if (cook && !cook.classList.contains('hide')) return 'cook';
  if (modal && !modal.classList.contains('hide')) return 'panel';
  return 'play';
}

// ═══ WAYPOINT NAVIGATION SYSTEM ═══
// Based on the game's road grid (CORR = [-88.5, -29.5, 29.5, 88.5])
// Blocks: [-82,-36], [-23,23], [36,82] in both x and z
// Roads run BETWEEN blocks — bot must follow roads, not cut through buildings

const WP = [
  // Hobo corridor (under bridge, south of city)
  {x:49, z:98},   // 0: camp
  {x:20, z:99},   // 1: under bridge 1
  {x:-8, z:99},   // 2: under bridge 2
  {x:-40, z:99},  // 3: under bridge 3
  // Road intersections (x-roads × z-roads)
  {x:29.5, z:88.5},   // 4: SE road junction
  {x:-29.5, z:88.5},  // 5: SW road junction
  {x:29.5, z:29.5},   // 6: mid-E junction
  {x:-29.5, z:29.5},  // 7: mid-W junction (near market south)
  {x:29.5, z:-29.5},  // 8: central-E junction
  {x:-29.5, z:-29.5}, // 9: central-W junction
  {x:-88.5, z:29.5},  // 10: far-W mid
  {x:-88.5, z:-29.5}, // 11: far-W south
  {x:-88.5, z:0},     // 12: far-W market level
  // Key destinations
  {x:-36.5, z:0},     // 13: market gate
  {x:-79, z:-4},      // 14: dock
  {x:-8, z:-17},      // 15: eatery
  {x:56, z:40},       // 16: temple
  {x:-88.5, z:88.5},  // 17: far-W north
  {x:59, z:-59},      // 18: park south (near tap)
];

// Edges: [from, to] — bidirectional safe paths
const WP_EDGES = [
  // Hobo corridor (east-west under bridge)
  [0,1],[1,2],[2,3],
  // Connect hobo to road grid
  [0,4],  // camp → SE junction (east route, ~14m)
  [3,5],  // hobo3 → SW junction (west route, ~15m)
  // North-south corridors (along x-roads)
  [4,6],  // SE → mid-E (59m)
  [5,7],  // SW → mid-W (59m)
  [6,8],  // mid-E → central-E (59m)
  [7,9],  // mid-W → central-W (59m)
  // East-west corridors (along z-roads)
  [4,5],  // z=88.5 east-west (59m)
  [6,7],  // z=29.5 east-west (59m)
  [8,9],  // z=-29.5 east-west (59m)
  // Far-west corridor (x=-88.5, north-south)
  [17,10], // far-W north → far-W mid (59m)
  [10,12], // far-W mid → far-W market (29.5m)
  [12,11], // far-W market → far-W south (29.5m)
  // Connect far-W to mid-W
  [10,7],  // far-W mid → mid-W (59m)
  [12,9],  // far-W market → central-W (~43m diagonal)
  // Connect to destinations
  [7,13],  // mid-W → market gate (~31m)
  [9,13],  // central-W → market gate (~31m)
  [12,14], // far-W market → dock (~10m)
  [11,14], // far-W south → dock (~10m)
  [9,15],  // central-W → eatery (~25m)
  [6,16],  // mid-E → temple (~28m)
  [3,17],  // hobo3 → far-W north (~18m)
  [8,18],  // central-E → park south (~42m, near tap)
];

// A* pathfinding on waypoint graph
function findPathWP(fromIdx, toIdx) {
  if (fromIdx === toIdx) return [fromIdx];
  const n = WP.length;
  const open = new Set([fromIdx]);
  const cameFrom = {};
  const gScore = new Array(n).fill(Infinity);
  const fScore = new Array(n).fill(Infinity);
  gScore[fromIdx] = 0;
  fScore[fromIdx] = D(WP[fromIdx].x, WP[fromIdx].z, WP[toIdx].x, WP[toIdx].z);

  while (open.size > 0) {
    // Find node in open with lowest fScore
    let current = -1, bestF = Infinity;
    for (const node of open) {
      if (fScore[node] < bestF) { bestF = fScore[node]; current = node; }
    }
    if (current === toIdx) {
      // Reconstruct path
      const path = [current];
      while (cameFrom[current] !== undefined) { current = cameFrom[current]; path.unshift(current); }
      return path;
    }
    open.delete(current);
    // Find neighbors
    const neighbors = [];
    for (const [a, b] of WP_EDGES) {
      if (a === current) neighbors.push(b);
      else if (b === current) neighbors.push(a);
    }
    for (const nb of neighbors) {
      const d = D(WP[current].x, WP[current].z, WP[nb].x, WP[nb].z);
      const tentG = gScore[current] + d;
      if (tentG < gScore[nb]) {
        cameFrom[nb] = current;
        gScore[nb] = tentG;
        fScore[nb] = tentG + D(WP[nb].x, WP[nb].z, WP[toIdx].x, WP[toIdx].z);
        open.add(nb);
      }
    }
  }
  return [fromIdx, toIdx]; // fallback: direct path
}

// Find nearest waypoint to a position
function nearestWP(x, z) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < WP.length; i++) {
    const d = D(x, z, WP[i].x, WP[i].z);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

// Current path state
let wpPath = [], wpIdx = 0, lastDestKey = '';

// ─── Movement: Follow waypoint path ───
let gotoTarget = null;
function goTo(tx, tz, th=2.5) {
  if (Date.now() < stuckUntil) return false; // anti-stuck driving
  const p = P(), c = ctx();
  if (!p || !c?.input) return false;
  const d = D(p.x, p.z, tx, tz);
  if (d < th) { gotoTarget = null; wpPath = []; return true; }

  gotoTarget = {x:tx, z:tz};

  // Compute waypoint path if destination changed or path empty
  const destKey = `${tx.toFixed(0)},${tz.toFixed(0)}`;
  if (destKey !== lastDestKey || wpPath.length === 0) {
    const fromWP = nearestWP(p.x, p.z);
    const toWP = nearestWP(tx, tz);
    wpPath = findPathWP(fromWP, toWP);
    wpIdx = 0;
    lastDestKey = destKey;
    lg(`🗺️ Path(${wpPath.length}): ${wpPath.slice(0,6).map(i=>`(${WP[i].x.toFixed(0)},${WP[i].z.toFixed(0)})`).join('→')}${wpPath.length>6?'...':''}`);
  }

  // Navigate along waypoint path
  if (wpIdx < wpPath.length) {
    const wp = WP[wpPath[wpIdx]];
    const wpD = D(p.x, p.z, wp.x, wp.z);
    // Advance to next waypoint if close enough
    if (wpD < 3 && wpIdx < wpPath.length - 1) {
      wpIdx++;
    }
    // Walk toward current waypoint
    const target = (wpIdx < wpPath.length - 1) ? WP[wpPath[wpIdx]] : {x:tx, z:tz};
    p.yaw = angTo(p.x, p.z, target.x, target.z);
  } else {
    // Path exhausted, walk directly to target
    p.yaw = angTo(p.x, p.z, tx, tz);
  }

  // Move forward
  c.input.mx = 0;
  c.input.mz = 1;
  c.input.keys.add('w');

  // Run if far and not carrying heavy stuff
  if (d > 8 && !p.carry && (p.stamina ?? 1) > 0.1) {
    c.input.keys.add('shift');
  } else {
    c.input.keys.delete('shift');
  }
  return false;
}

function stop() {
  const c = ctx();
  if (!c?.input) return;
  c.input.mx = 0; c.input.mz = 0;
  ['w','s','a','d','shift',' '].forEach(k => c.input.keys.delete(k));
}

// ─── Interaction ───
function interact() {
  const ix = IX();
  const p = P();
  const c = ctx();
  if (!ix || !p || !c) return false;
  // CRITICAL: Force camera sync before interact check
  p.update(0); // dt=0 → updates camera rotation from yaw/pitch
  // Force Three.js to recalculate camera world matrix
  if (c.camera) c.camera.updateMatrixWorld(true);
  ix.update(0.05); // refresh focus with updated camera direction
  if (ix.focus) {
    ix.trigger();
    return true;
  }
  return false;
}

function interactLabel(labelMatch) {
  const ix = IX();
  if (!ix) return false;
  ix.update(0.05);
  if (ix.focus && ix.focus.label && ix.focus.label.includes(labelMatch)) {
    ix.trigger();
    return true;
  }
  return false;
}

// ─── Dialog Control ───
function dlgBtn(textMatch) {
  const dlg = document.getElementById('dlg');
  if (!dlg || dlg.classList.contains('hide')) return false;
  const btns = dlg.querySelectorAll('.btn:not(.off)');
  for (const b of btns) {
    if (b.textContent.includes(textMatch)) { b.click(); return true; }
  }
  return false;
}

function dlgFirst() {
  const dlg = document.getElementById('dlg');
  if (!dlg || dlg.classList.contains('hide')) return false;
  const b = dlg.querySelector('.btn:not(.off)');
  if (b) { b.click(); return true; }
  return false;
}

function dlgLast() {
  const dlg = document.getElementById('dlg');
  if (!dlg || dlg.classList.contains('hide')) return false;
  const btns = [...dlg.querySelectorAll('.btn:not(.off)')];
  if (btns.length) { btns[btns.length-1].click(); return true; }
  return false;
}

function dlgDismiss() {
  const dlg = document.getElementById('dlg');
  if (!dlg || dlg.classList.contains('hide')) return false;
  const btns = dlg.querySelectorAll('.btn:not(.off)');
  // Find dismiss-like button
  for (const b of btns) {
    const t = b.textContent;
    if (t.includes('Thôi') || t.includes('Cảm ơn') || t.includes('Hiểu rồi') ||
        t.includes('Đứng dậy') || t.includes('Để con') || t.includes('Tạm') ||
        t.includes('Quay lại') || t.includes('Đóng') || t.includes('không')) {
      b.click(); return true;
    }
  }
  // Click last (usually the "bye" option)
  if (btns.length) { [...btns].pop().click(); return true; }
  return false;
}

// ─── Menu Control ───
function menuBtn(dataM) {
  const m = document.getElementById('menu');
  if (!m || m.classList.contains('hide')) return false;
  const btn = m.querySelector(`[data-m="${dataM}"]`);
  if (btn) { btn.click(); return true; }
  return false;
}

// ─── Find Entities ───
function findPed() {
  const npcs = NPCS(), p = P();
  if (!npcs || !p) return null;
  let best=null, bd=25;
  for (const n of npcs.list) {
    if (n.hidden || n.kind !== 'ped' || n.asked) continue;
    if (n.state !== 'walk' && n.state !== 'idle') continue;
    const d = D(p.x, p.z, n.x, n.z);
    if (d < bd) { bd=d; best=n; }
  }
  return best;
}

function findLitter() {
  const a = ACTS(), p = P();
  if (!a?.litter || !p) return null;
  // Clean old blacklist entries (> 20 minutes old)
  if (B.blacklistLit) {
    B.blacklistLit = B.blacklistLit.filter(bl => B.tick - bl.tick < 1200);
  }
  let best=null, bd=30;
  for (const l of a.litter) {
    // Skip blacklisted positions (within 5m of stuck location)
    if (B.blacklistLit?.some(bl => D(bl.x, bl.z, l.x, l.z) < 5)) continue;
    const d = D(p.x, p.z, l.x, l.z);
    if (d < bd) { bd=d; best=l; }
  }
  return best;
}

function findBin() {
  const c = ctx(), p = P();
  if (!c?.world?.bins || !p) return null;
  let best=null, bd=20;
  for (const b of c.world.bins) {
    const d = D(p.x, p.z, b.x, b.z);
    if (d < bd) { bd=d; best=b; }
  }
  return best;
}

function hasJunk() { const g=G(); return g?.junk && Object.values(g.junk).some(v=>v>0); }
function junkN() { const g=G(); return g?.junk ? Object.values(g.junk).reduce((a,b)=>a+b,0) : 0; }
function binRummaged(binIdx) { const g=G(); return g?.wd?.bins && g.wd.bins[binIdx] === g.day; }
function findUnrummagedBin() {
  const c = ctx(), g = G();
  if (!c?.world?.bins?.length || !g) return null;
  const p = P();
  let best = null, bestD = 999;
  c.world.bins.forEach((b, i) => {
    if (binRummaged(i)) return; // skip if already rummaged today
    const d = D(p.x, p.z, b.x, b.z);
    if (d < bestD) { bestD = d; best = {x:b.x, z:b.z, idx:i}; }
  });
  return best;
}

// ─── Anti-stuck (perpendicular escape with clearance check) ───
let stuckUntil = 0;
let stuckDir = 1; // 1 = right 90°, -1 = left 90°
let stuckOrigin = null; // where we were when we got stuck
function antiStuck() {
  const p = P();
  if (!p || B.phase==='wait') return false;
  const now = Date.now();
  // If in stuck-recovery mode, drive movement directly (bypass goTo)
  if (now < stuckUntil) {
    const c = ctx();
    if (c?.input) {
      c.input.mx = 0; c.input.mz = 1;
      c.input.keys.add('w');
      c.input.keys.add('shift'); // run while escaping
    }
    // Check if we've moved far enough from where we got stuck
    if (stuckOrigin && D(p.x, p.z, stuckOrigin.x, stuckOrigin.z) > 6) {
      stuckUntil = 0; // escaped far enough, resume normal movement
      stuckOrigin = null;
    }
    return true; // signal: skip goTo this tick
  }
  const d = D(p.x, p.z, B.lx, B.lz);
  if (d < 0.15) {
    B.stuck++;
    if (B.stuck >= 10) {
      // Turn exactly 90° (alternate left/right each time)
      const dir = stuckDir;
      p.yaw += dir * Math.PI * 0.5;
      stuckDir *= -1; // alternate direction next time
      stuckOrigin = {x: p.x, z: p.z};
      stuckUntil = now + 6000; // walk perpendicular for up to 6s (or until 6m clearance)
      B.stuck = 0;
      B.stuckEscapes = (B.stuckEscapes || 0) + 1;
      lg(`⚠️ Kẹt #${B.stuckEscapes} → né ${dir > 0 ? 'phải' : 'trái'} 90°`,'warn');
      // Emergency: if stuck too many times, teleport to camp to reset
      if (B.stuckEscapes > 25) {
        lg(`🆘 Kẹt quá nhiều (${B.stuckEscapes}) → teleport về camp`, 'error');
        p.x = LOC.camp.x; p.z = LOC.camp.z;
        B.stuckEscapes = 0;
        B.lockedBin = null;
        B.lockedLit = null;
        B.target = null;
        B.action = '';
        B.giveUpUntil = B.tick + 600; // don't set distant targets for 10 minutes
        // Blacklist current target position if it's litter
        if (B.blacklistLit) B.blacklistLit.push({x: B.lx, z: B.lz, tick: B.tick});
        else B.blacklistLit = [{x: B.lx, z: B.lz, tick: B.tick}];
        stuckUntil = 0;
      }
    }
  } else { B.stuck = 0; }
  B.lx = p.x; B.lz = p.z;
  return false;
}

// ═══════════════════════════════════
//  STATE MACHINE
// ═══════════════════════════════════
function update() {
  try {
  if (B.paused || !ready()) return;
  B.tick++;
  const state = G(), p = P();
  if (!state || !p) {
    if (B.tick % 40 === 0) lg(`⏳ state=${!!state} player=${!!p} ctx=${!!ctx()}`,'warn');
    return;
  }

  const isStuck = antiStuck();
  const ui = uiState();
  
  // Log state every 40 ticks (~2s)
  if (B.tick % 40 === 0) {
    const tgt = B.target ? `tgt=(${B.target.x?.toFixed(0)},${B.target.z?.toFixed(0)}) d=${D(p.x,p.z,B.target.x,B.target.z).toFixed(0)}` : 'no-tgt';
    lg(`📊 phase=${B.phase} ${tgt} esc=${B.stuckEscapes||0} act="${B.action}"`);
  }

  // ─── Handle UI blocks ───
  if (ui === 'menu') {
    if (B.phase === 'start') doMenu();
    return;
  }
  if (ui === 'dlg') {
    if (B.dlgWait > 0) { B.dlgWait--; return; }
    doDialog();
    return;
  }
  if (ui === 'panel') {
    if (B.tick % 40 === 0) { UI()?.closePanel(); lg('Đóng panel','warn'); }
    return;
  }
  if (ui === 'cook') {
    doCook();
    return;
  }

  // ─── Play mode ───
  const hr = h();
  
  // Debug: log which doEarn condition fires
  if (B.phase === 'earn' && B.tick % 40 === 0) {
    const carry = p.carry;
    const jk = junkN();
    const ped = findPed();
    const lit = findLitter();
    const bin = findBin();
    lg(`📋 earn: hr=${hr.toFixed(1)} carry=${carry} junk=${jk} dock=${hr>=4.5&&hr<10?'Y':'N'} dish=${hr>=10&&hr<14.5?'Y':'N'} temple=${hr>=11&&hr<13?'Y':'N'} ped=${ped?'Y':'N'} lit=${lit?'Y':'N'} bin=${bin?'Y':'N'}`);
  }

  // Detect nearby bins (used by survival and earn logic)
  const nearBin = findBin();
  const nearBinD = nearBin ? D(p.x, p.z, nearBin.x, nearBin.z) : 999;

  // ─── SURVIVAL: Drink, eat, sleep (only if reachable) ───
  if (state.st) {
    const hunger = state.st.hunger ?? 100;
    const thirst = state.st.thirst ?? 100;
    const energy = state.st.energy ?? 100;

    // Log stats + action periodically
    if (B.tick % 200 === 0) {
      lg(`❤️ đói=${hunger.toFixed(0)} khát=${thirst.toFixed(0)} NL=${energy.toFixed(0)} 💵${state.cash.toLocaleString()}₫ esc=${B.stuckEscapes||0}`);
    }

    // Track if we can travel far (not too stuck)
    const esc = B.stuckEscapes || 0;

    // Reset bin attempts if not thirsty/hungry (new cycle)
    if (thirst >= 55 && hunger >= 50) B.binAttempts = 0;

    // ─── DRINK: tap (always go, use waypoint path) → trash bins (if stuck) ───
    if (thirst < 55) {
      const tapD = D(p.x, p.z, LOC.tap.x, LOC.tap.z);
      // Try trash bins first if tap is far AND bins are close AND haven't tried too many times
      if (tapD > 50 && nearBin && nearBinD < 15 && (B.binAttempts || 0) < 3) {
        B.target = {x:nearBin.x, z:nearBin.z, n:'Thùng rác'};
        B.action = `🗑️ Tìm nước trong rác (${nearBinD.toFixed(0)}m)...`;
        goTo(nearBin.x, nearBin.z, 2);
        if (nearBinD < 2.5) {
          stop(); p.face(nearBin.x, nearBin.z);
          B.binAttempts = (B.binAttempts || 0) + 1;
          if (interact()) { lg('🗑️ Bới rác tìm nước','good'); B.dlgWait = 5; B.binAttempts = 0; }
        }
        return;
      }
      // Go to tap (waypoint path will navigate around obstacles)
      if (!B.target || B.target.n !== 'Vòi nước') {
        B.target = {x:LOC.tap.x, z:LOC.tap.z, n:'Vòi nước'};
        lg(`💧 Đi uống nước (${tapD.toFixed(0)}m)...`);
      }
      B.action = `💧 Đi uống nước (${tapD.toFixed(0)}m)...`;
      goTo(LOC.tap.x, LOC.tap.z, 1.8);
      if (tapD < 3.0) {
        stop(); p.face(LOC.tap.x, LOC.tap.z);
        // Try to open dialog first
        const dlgOpen = document.getElementById('dlg') && !document.getElementById('dlg').classList.contains('hide');
        if (dlgBtn('Uống')) {
          lg('💧 Uống nước!', 'good'); B.dlgWait = 5; B.stuckEscapes = 0;
        } else if (!dlgOpen) {
          // Try interact, or directly call wash if interact fails
          if (interact()) {
            lg('💧 Mở dialog vòi nước', 'good'); B.dlgWait = 3;
          } else {
            // Direct call as fallback
            try {
              const acts = ACTS();
              if (acts?.wash) { acts.wash('tap'); lg('💧 Uống nước (direct)!', 'good'); B.dlgWait = 5; B.stuckEscapes = 0; }
            } catch(e) { if (B.tick % 20 === 0) lg(`❌ wash: ${e.message}`, 'warn'); }
          }
        }
      }
      return;
    }

    // Debug: confirm we reached past DRINK
    if (B.tick % 40 === 0) lg(`✅ Past DRINK: thirst=${thirst.toFixed(0)} hunger=${hunger.toFixed(0)}`);

    // ─── EAT: temple (11-13h) → trash bins (always) ───
    if (hunger < 50 && B.tick % 40 === 0) {
      lg(`🍽️ EAT check: hunger=${hunger.toFixed(0)} hr=${hr.toFixed(1)} nearBin=${nearBin?'Y':'N'} nearBinD=${nearBinD.toFixed(1)} binAttempts=${B.binAttempts||0} esc=${esc}`);
    }
    // Option 1: Temple food 10h30-13h (free!) - go early to arrive by 11h
    if (hunger < 60 && hr >= 10.5 && hr < 13) {
      const templeD = D(p.x, p.z, LOC.temple.x, LOC.temple.z);
      // If before 11h, just walk there and wait
      if (hr < 11) {
        B.target = LOC.temple;
        B.action = `🍚 Đi ăn chùa sớm (${templeD.toFixed(0)}m, đợi 11h)...`;
        goTo(LOC.temple.x, LOC.temple.z, 4);
        return;
      }
      // 11h-13h: actually eat
      B.target = LOC.temple;
      B.action = `🍚 Đi ăn chùa (${templeD.toFixed(0)}m)...`;
      goTo(LOC.temple.x, LOC.temple.z, 4);
      if (templeD < 5) {
        stop(); p.face(LOC.temple.x, LOC.temple.z);
        const dlgOpen = document.getElementById('dlg') && !document.getElementById('dlg').classList.contains('hide');
        if (dlgBtn('Nhận')) { lg('🍚 Ăn chùa!', 'good'); B.dlgWait = 8; }
        else if (!dlgOpen && interact()) { B.dlgWait = 3; }
        else if (!dlgOpen) {
          try { const acts = ACTS(); if (acts?.temple) { acts.temple(); lg('🍚 Ăn chùa (direct)!', 'good'); B.dlgWait = 8; } } catch(e) {}
        }
      }
      return;
    }
    // Option 2: Trash bins (only unrummaged bins, max 3 attempts OR give up if stuck)
    const unrummagedBin = findUnrummagedBin();
    const binStuck = (B.binAttempts || 0) >= 3 || (esc > 15 && B.action?.includes('rác'));
    if (hunger < 50 && unrummagedBin && D(p.x, p.z, unrummagedBin.x, unrummagedBin.z) < 25 && !binStuck) {
      const binDist = D(p.x, p.z, unrummagedBin.x, unrummagedBin.z);
      // Lock onto a bin target until reached or give up (avoid constant target switching)
      if (!B.lockedBin || D(B.lockedBin.x, B.lockedBin.z, unrummagedBin.x, unrummagedBin.z) > 5) {
        B.lockedBin = {x:unrummagedBin.x, z:unrummagedBin.z, idx:unrummagedBin.idx};
        lg(`🗑️ Đi tới thùng rác chưa bới (${binDist.toFixed(0)}m)...`);
      }
      B.target = {x:B.lockedBin.x, z:B.lockedBin.z, n:'Thùng rác'};
      B.action = `🗑️ Tìm đồ ăn trong rác (${D(p.x, p.z, B.lockedBin.x, B.lockedBin.z).toFixed(0)}m)...`;
      goTo(B.lockedBin.x, B.lockedBin.z, 2);
      const lockedDist = D(p.x, p.z, B.lockedBin.x, B.lockedBin.z);
      // Count attempt if close OR if stuck trying to reach
      if (lockedDist < 3.0 || (esc > 10 && lockedDist > 5)) {
        if (lockedDist < 3.0) { stop(); p.face(B.lockedBin.x, B.lockedBin.z); }
        B.binAttempts = (B.binAttempts || 0) + 1;
        if (lockedDist < 3.0) {
          if (interact()) {
            lg('🗑️ Bới rác tìm đồ ăn','good'); B.dlgWait = 5; B.binAttempts = 0; B.lockedBin = null;
          } else {
            try {
              const acts = ACTS();
              if (acts?.rummage && B.lockedBin?.idx >= 0) { acts.rummage(B.lockedBin.idx); lg('🗑️ Bới rác (direct)!', 'good'); B.dlgWait = 5; B.binAttempts = 0; B.lockedBin = null; }
            } catch(e) { /* ignore */ }
          }
        }
      }
      return;
    }
    if (hunger < 50 && binStuck && B.tick % 100 === 0) {
      lg(`⚠️ Không thể tới thùng rác (attempts=${B.binAttempts||0}, esc=${esc}) → bỏ qua`, 'warn');
    }
    // Reset binAttempts and lockedBin when not hungry
    if (hunger >= 50) { B.binAttempts = 0; B.lockedBin = null; }

    // Sleep if very tired and night
    if (energy < 20 && (hr >= 22 || hr < 5)) {
      B.target = LOC.camp;
      B.action = '😴 Kiệt sức → ngủ...';
      goTo(LOC.camp.x, LOC.camp.z, 5);
      return;
    }
  }

  // Phase transitions
  if (hr >= 23 && B.phase !== 'sleep' && B.phase !== 'done') {
    lg('🌙 Khuya → ngủ'); B.phase='sleep'; B.target=LOC.camp;
  }
  if (B.phase === 'earn' && state.cash >= B.earnGoal) {
    lg(`💰 Đủ ${state.cash.toLocaleString()}₫ → mua gánh`,'good');
    B.phase = 'buy_ganh';
  }

  switch (B.phase) {
    case 'earn': doEarn(); break;
    case 'buy_ganh': doBuyGanh(); break;
    case 'buy_gear': doBuyGear(); break;
    case 'buy_ing': doBuyIng(); break;
    case 'sell': doSell(); break;
    case 'sleep': doSleep(); break;
    case 'done': stop(); break;
  }
  } catch(e) { if (B.tick % 40 === 0) lg(`❌ update: ${e.message}`, 'warn'); }
}

// ═══ MENU ═══
function doMenu() {
  const m = document.getElementById('menu');
  if (B.tick % 20 === 0) {
    const btns = m ? [...m.querySelectorAll('button')].map(b => `${b.dataset.m||'?'}:"${b.textContent.trim().slice(0,20)}"`) : [];
    lg(`📋 Menu step=${B.menuStep} visible=${m?!m.classList.contains('hide'):false} btns=[${btns.join(', ')}]`);
  }
  if (B.menuStep === 0) {
    if (m && m.querySelector('[data-m="cont"]')) {
      menuBtn('cont');
      lg('▶ Chơi tiếp','good');
      B.phase = 'earn';
      B.cash0 = G().cash;
      return;
    }
    if (menuBtn('new')) {
      lg('🎮 Chơi mới');
      B.menuStep = 1;
      return;
    }
  }
  if (B.menuStep === 1) {
    if (menuBtn('anh')) {
      lg('👤 Anh Hai','good');
      B.menuStep = 2;
      B.dlgWait = 40;
      return;
    }
    if (menuBtn('chi')) {
      lg('👤 Chị Hai','good');
      B.menuStep = 2;
      B.dlgWait = 40;
      return;
    }
  }
  if (B.menuStep >= 2) {
    B.menuStep = 3;
  }
}

// ═══ DIALOG ═══
function doDialog() {
  const state = G();
  
  // Log dialog content
  if (B.tick % 20 === 0) {
    const dlg = document.getElementById('dlg');
    const h3 = dlg?.querySelector('h3')?.textContent || '';
    const btns = dlg ? [...dlg.querySelectorAll('.btn')].map(b => `"${b.textContent.trim().slice(0,25)}"${b.classList.contains('off')?'[off]':''}`) : [];
    lg(`💬 Dialog: "${h3}" btns=[${btns.join(', ')}]`);
  }

  // Intro dialog
  if (dlgBtn('Đứng dậy')) {
    lg('🎮 Đứng dậy!','good');
    B.dlgWait = 15;
    return;
  }
  if (dlgBtn('Hiểu rồi')) {
    lg('✅ Hiểu rồi!','good');
    B.phase = 'earn';
    B.cash0 = state.cash;
    B.dlgWait = 10;
    return;
  }

  // Trash bin — eat if hungry
  if (dlgBtn('Ăn luôn') || dlgBtn('Ăn đỡ')) {
    lg('🗑️ Ăn từ thùng rác!','good');
    B.dlgWait = 8;
    return;
  }

  // Begging — when dialog has beg-like options, click the best one (not cancel)
  {
    const dlg = document.getElementById('dlg');
    const h3 = dlg?.querySelector('h3')?.textContent || '';
    const btns = dlg ? [...dlg.querySelectorAll('.btn:not(.off)')] : [];
    // Detect beg dialog: title contains "Người lạ" or "xin" or similar
    const isBegDialog = h3.includes('Người') || h3.includes('lạ') || h3.includes('xin') || btns.some(b => b.textContent.includes('xin') || b.textContent.includes('Xin') || b.textContent.includes('giúp'));
    if (isBegDialog && btns.length >= 2) {
      // Click the first non-cancel button (cancel usually has "Thôi", "ngại", "Không")
      const cancelKeywords = ['Thôi', 'ngại', 'Không', 'Bỏ'];
      const begBtn = btns.find(b => !cancelKeywords.some(k => b.textContent.includes(k)));
      if (begBtn) {
        const cashBefore = state.cash;
        begBtn.click();
        B.begs++;
        // Check earnings after a brief delay
        setTimeout(() => {
          const earned = state.cash - cashBefore;
          if (earned > 0) lg(`🙏 Xin #${B.begs} +${earned.toLocaleString()}₫ → ${state.cash.toLocaleString()}₫`, 'good');
          else if (B.begs % 5 === 0) lg(`🙏 Xin #${B.begs} → ${state.cash.toLocaleString()}₫`);
          if (earned === 0 && B.begs > 10) {
            lg(`⚠️ Beg hết hiệu quả (#${B.begs}) → cooldown`,'warn');
            B.begCooldown = B.tick + 400;
          }
        }, 500);
        B.dlgWait = 8;
        return;
      }
    }
  }

  // Sell junk
  if (dlgBtn('Bán hết')) {
    lg(`💰 Bán ve chai! ${state.cash.toLocaleString()}₫`,'good');
    B.dlgWait = 8;
    return;
  }

  // Dock work
  if (dlgBtn('Dạ làm')) {
    lg('💪 Bốc hàng!','good');
    B.docks++; B.dlgWait = 8;
    return;
  }

  // Dishes
  if (dlgBtn('Rửa chén') || dlgBtn('Dạ rửa') || dlgBtn('Dạ, con') || dlgBtn('Xin rửa')) {
    lg('🍽️ Rửa chén!','good');
    B.dishes++; B.dlgWait = 8;
    return;
  }

  // Delivery
  if (dlgBtn('Giao hàng') || dlgBtn('Nhận giao') || dlgBtn('Dạ nhận')) {
    lg('📦 Nhận giao hàng!','good');
    B.dlgWait = 8;
    return;
  }

  // Drink from tap
  if (dlgBtn('Uống')) {
    lg('💧 Uống nước!','good');
    B.dlgWait = 8;
    return;
  }

  // Temple food
  if (dlgBtn('Cơm chay') || dlgBtn('Xin cơm') || dlgBtn('Nhận cơm')) {
    lg('🍚 Cơm chay!','good');
    B.dlgWait = 8;
    return;
  }

  // Buy items
  if (dlgBtn('Mua') && (B.phase==='buy_ganh'||B.phase==='buy_gear'||B.phase==='buy_ing')) {
    lg('🛒 Mua đồ','good');
    B.dlgWait = 8;
    return;
  }

  // Selling
  if (dlgBtn('Mở bán') || dlgBtn('Đặt gánh')) {
    lg('🏪 Mở bán!','good');
    B.dlgWait = 8;
    return;
  }
  if (dlgBtn('Thực đơn') || dlgBtn('Sơ chế')) {
    lg('📋 Thực đơn','good');
    B.dlgWait = 8;
    return;
  }

  // Sleep
  if (dlgBtn('Ngủ') || dlgBtn('ngủ')) {
    lg('😴 Ngủ','good');
    B.dlgWait = 20;
    return;
  }

  // Dock carry
  if (dlgBtn('bao hàng') || dlgBtn('lấy bao')) {
    lg('📦 Lấy bao','good');
    B.dlgWait = 5;
    return;
  }

  // Ca bốc cá
  if (dlgBtn('bốc cá')) {
    lg('🐟 Bốc cá!','good');
    B.dlgWait = 8;
    return;
  }

  // Generic: dismiss
  if (B.tick % 4 === 0) {
    dlgDismiss();
    B.dlgWait = 5;
  }
}

// ═══ COOKING ═══
function doCook() {
  // Auto-click cook buttons (timing-based mini-games)
  const cook = document.getElementById('cook');
  if (!cook) return;
  const btns = cook.querySelectorAll('.btns .btn');
  if (btns.length > 0 && B.tick % 8 === 0) {
    // For cutting/timing games: click middle button
    btns[Math.floor(btns.length/2)]?.click();
  }
  // Press space/enter for timing games
  if (B.tick % 12 === 0) {
    const c = ctx();
    if (c?.input) {
      c.input.keys.add(' ');
      setTimeout(() => c.input.keys.delete(' '), 50);
    }
  }
}

// ═══ EARNING ═══
let progressCheck = { tick: 0, x: 0, z: 0 };
function doEarn() {
  const state = G(), p = P(), hr = h();

  // Global progress check: if target distance hasn't decreased, give up
  if (B.tick - progressCheck.tick > 200) {
    const moved = D(p.x, p.z, progressCheck.x, progressCheck.z);
    const currentDist = B.target ? D(p.x, p.z, B.target.x, B.target.z) : 0;
    if (moved < 5) {
      if (B.target && currentDist > 15) {
        // Distant target, not making progress → give up on it
        lg(`⚠️ Không tiến tới target (${currentDist.toFixed(0)}m) → bỏ qua`,'warn');
        B.target = null;
        B.action = '';
        B.giveUpUntil = B.tick + 200; // don't set distant targets for a while
      } else {
        // Close target or no target → random walk
        lg(`⚠️ Kẹt → đi hướng khác`,'warn');
      }
      B.stuckEscapes = (B.stuckEscapes || 0) + 5;
      stuckUntil = Date.now() + 5000;
      p.yaw = Math.random() * Math.PI * 2;
    }
    progressCheck = { tick: B.tick, x: p.x, z: p.z };
  }
  // Don't set distant targets during give-up period
  if (B.giveUpUntil && B.tick < B.giveUpUntil) {
    // Force local-only actions during give-up
  }

  // Carrying sack → deliver to Bà Hai's stall
  if (p.carry === 'sack') {
    const dest = LOC.mKho || {x:-68, z:-13};
    B.target = dest; B.action = '📦 Vác bao gạo...';
    if (goTo(dest.x, dest.z, 4)) {
      stop();
      p.face(dest.x, dest.z);
      interact();
      B.dlgWait = 5;
    }
    return;
  }

  // Carrying delivery box → go to delivery target
  if (p.carry === 'box') {
    const acts = ACTS();
    const job = acts?.job;
    if (job?.kind === 'delivery') {
      B.target = {x:job.x, z:job.z, n:'Giao hàng'};
      B.action = `📦 Giao hàng (${D(p.x,p.z,job.x,job.z).toFixed(0)}m)...`;
      if (goTo(job.x, job.z, 2.5)) {
        stop();
        // deliveryCheck() is called automatically by the game
        lg(`📦 Giao hàng tới nơi!`, 'good');
        B.dlgWait = 5;
      }
      return;
    }
  }

  // ─── WORK PRIORITY: Go to dock/eatery when it's work hours (only if not hungry/thirsty) ───
  const hunger = state.st?.hunger ?? 100;
  const thirst = state.st?.thirst ?? 100;
  const esc = B.stuckEscapes || 0;
  
  // Dock work: 4h30-10h, earn 6000₫ per sack
  if (hr >= 4.5 && hr < 10 && !p.carry && hunger >= 40 && thirst >= 45 && !(B.giveUpUntil && B.tick < B.giveUpUntil)) {
    const dockDest = LOC.dock || {x:-79, z:-4};
    const dockDist = D(p.x, p.z, dockDest.x, dockDest.z);
    // If not at dock yet, go there (unless very far and have better options nearby)
    if (dockDist >= 25) {
      const nearPedTmp = findPed();
      const nearLitTmp = findLitter();
      const nearPedDTmp = nearPedTmp ? D(p.x, p.z, nearPedTmp.x, nearPedTmp.z) : 999;
      const nearLitDTmp = nearLitTmp ? D(p.x, p.z, nearLitTmp.x, nearLitTmp.z) : 999;
      // Only skip dock if there's a ped or litter very close (< 10m)
      if (nearPedDTmp > 10 && nearLitDTmp > 10) {
        B.target = dockDest; B.action = `💪 Đi tới dock (${dockDist.toFixed(0)}m)...`;
        goTo(dockDest.x, dockDest.z, 5);
        return;
      }
    }
  }
  
  // Dish washing: 10h-14h30 or 17h30-21h, earn money
  if (((hr >= 10 && hr < 14.5) || (hr >= 17.5 && hr < 21)) && !p.carry && hunger >= 40 && thirst >= 45 && !(B.giveUpUntil && B.tick < B.giveUpUntil)) {
    const eateryDest = LOC.eatery || {x:-8, z:-17};
    const eateryDist = D(p.x, p.z, eateryDest.x, eateryDest.z);
    // If not at eatery yet, go there (unless very far and have better options nearby)
    if (eateryDist >= 25) {
      const nearPedTmp = findPed();
      const nearLitTmp = findLitter();
      const nearPedDTmp = nearPedTmp ? D(p.x, p.z, nearPedTmp.x, nearPedTmp.z) : 999;
      const nearLitDTmp = nearLitTmp ? D(p.x, p.z, nearLitTmp.x, nearLitTmp.z) : 999;
      // Only skip eatery if there's a ped or litter very close (< 10m)
      if (nearPedDTmp > 10 && nearLitDTmp > 10) {
        B.target = eateryDest; B.action = `🍽️ Đi tới nhà hàng (${eateryDist.toFixed(0)}m)...`;
        goTo(eateryDest.x, eateryDest.z, 5);
        return;
      }
    }
  }

  // ─── OPPORTUNISTIC: Grab nearby opportunities before traveling far ───
  const nearPed = findPed();
  const nearLit = findLitter();
  const nearBin = findBin();
  const nearPedD = nearPed ? D(p.x, p.z, nearPed.x, nearPed.z) : 999;
  const nearLitD = nearLit ? D(p.x, p.z, nearLit.x, nearLit.z) : 999;
  const nearBinD = nearBin ? D(p.x, p.z, nearBin.x, nearBin.z) : 999;

  // Beg from nearby pedestrian (< 15m) — skip during cooldown
  const begOnCooldown = B.begCooldown && B.tick < B.begCooldown;
  if (nearPed && nearPedD < 15 && !begOnCooldown) {
    B.target = {x:nearPed.x, z:nearPed.z, n:'Xin tiền'};
    B.action = `🙏 Xin (${nearPedD.toFixed(1)}m)...`;
    goTo(nearPed.x, nearPed.z, 2.0);
    if (nearPedD < 4.0) {
      stop();
      const acts = ACTS();
      if (acts?.beg) {
        try { acts.beg(nearPed); B.dlgWait = 8; }
        catch(e) { lg(`❌ beg: ${e.message}`, 'warn'); }
      }
    }
    return;
  }
  // Reset beg cooldown
  if (B.begCooldown && B.tick >= B.begCooldown) {
    B.begCooldown = 0;
    lg('🙏 Beg cooldown hết → thử lại','good');
  }

  // Pick up nearby litter (< 25m) — skip if stuck too many times
  const litStuck = esc > 15 && B.action?.includes('Nhặt');
  if (nearLit && nearLitD < 25 && !litStuck) {
    // Lock onto litter target to avoid constant switching
    if (!B.lockedLit || D(B.lockedLit.x, B.lockedLit.z, nearLit.x, nearLit.z) > 3) {
      B.lockedLit = {x:nearLit.x, z:nearLit.z};
    }
    B.target = {x:B.lockedLit.x, z:B.lockedLit.z, n:'Ve chai'};
    B.action = `🗑️ Nhặt (${D(p.x, p.z, B.lockedLit.x, B.lockedLit.z).toFixed(1)}m)...`;
    goTo(B.lockedLit.x, B.lockedLit.z, 1.0);
    const lockedLitDist = D(p.x, p.z, B.lockedLit.x, B.lockedLit.z);
    if (lockedLitDist < 3.5) {
      stop();
      const acts = ACTS();
      if (acts?.pickLitter) {
        try { acts.pickLitter(nearLit); B.litters++; lg(`🗑️ Nhặt #${B.litters} junk=${junkN()}`, 'good'); B.lockedLit = null; }
        catch(e) { lg(`❌ pick: ${e.message}`, 'warn'); }
      }
    }
    return;
  }
  if (litStuck && B.tick % 100 === 0) {
    lg(`⚠️ Không thể nhặt rác (esc=${esc}) → bỏ qua`, 'warn');
    B.lockedLit = null;
  }

  // Dig nearby bins (< 4m — only very close, with cooldown to prevent spam)
  const binCooldown = B.lastBinDig && (B.tick - B.lastBinDig) < 30;
  const binDigStuck = esc > 15 && B.action?.includes('Bới rác');
  if (nearBin && nearBinD < 4 && !binCooldown && !binDigStuck) {
    B.target = {x:nearBin.x, z:nearBin.z, n:'Rác'};
    B.action = `🗑️ Bới rác (${nearBinD.toFixed(1)}m)...`;
    goTo(nearBin.x, nearBin.z, 1.5);
    if (nearBinD < 2.0) {
      stop();
      p.face(nearBin.x, nearBin.z);
      if (interact()) { B.litters++; lg(`🗑️ Bới rác`, 'good'); B.dlgWait = 5; B.lastBinDig = B.tick; }
    }
    return;
  }

  // Sell junk if have enough - GO TO DEALER if junk >= 10
  if (hasJunk() && junkN() >= 10 && !(B.giveUpUntil && B.tick < B.giveUpUntil)) {
    const scrap1 = LOC.scrap || {x:-60, z:79};
    const scrap2 = LOC.scrap2 || {x:79, z:-7};
    const d1 = D(p.x, p.z, scrap1.x, scrap1.z);
    const d2 = D(p.x, p.z, scrap2.x, scrap2.z);
    const dealer = d1 < d2 ? scrap1 : scrap2;
    const sd = Math.min(d1, d2);
    // Go to dealer regardless of distance
    B.target = dealer; B.action = `🗑️ Đi bán ve chai (${sd.toFixed(0)}m, junk=${junkN()})...`;
    goTo(dealer.x, dealer.z, 3);
    if (sd < 4) {
      stop();
      // Try multiple angles to find NPC
      const tryAngle = (B.tick % 4) * Math.PI * 0.5;
      const faceX = dealer.x + Math.sin(tryAngle) * 2;
      const faceZ = dealer.z + Math.cos(tryAngle) * 2;
      p.face(faceX, faceZ);
      if (interact()) {
        lg('🗑️ Nói chuyện vựa ve chai!','good');
        B.dlgWait = 10;
      }
    }
    return;
  }
  // Sell junk if dealer is close (< 25m) and junk >= 2
  if (hasJunk() && junkN() >= 2 && !(B.giveUpUntil && B.tick < B.giveUpUntil)) {
    const scrap1 = LOC.scrap || {x:-60, z:79};
    const scrap2 = LOC.scrap2 || {x:79, z:-7};
    const d1 = D(p.x, p.z, scrap1.x, scrap1.z);
    const d2 = D(p.x, p.z, scrap2.x, scrap2.z);
    const dealer = d1 < d2 ? scrap1 : scrap2;
    const sd = Math.min(d1, d2);
    if (sd < 25) { // Only try if dealer is reachable (< 25m)
      B.target = dealer; B.action = `🗑️ Bán ve chai (${sd.toFixed(0)}m)...`;
      goTo(dealer.x, dealer.z, 3);
      if (sd < 4) {
        stop();
        // Try multiple angles to find NPC
        const tryAngle = (B.tick % 4) * Math.PI * 0.5;
        const faceX = dealer.x + Math.sin(tryAngle) * 2;
        const faceZ = dealer.z + Math.cos(tryAngle) * 2;
        p.face(faceX, faceZ);
        if (interact()) {
          lg('🗑️ Nói chuyện vựa ve chai!','good');
          B.dlgWait = 10;
        }
      }
      return;
    }
  }

  // (old wash dishes section removed — handled above)

  // Eat at temple 11h-13h if hungry
  if (hr >= 11 && hr < 13 && state.st.hunger < 40) {
    B.target = LOC.temple; B.action = '🍚 Đi ăn chùa...';
    if (goTo(LOC.temple.x, LOC.temple.z, 3)) {
      stop(); interact(); B.dlgWait = 8;
    }
    return;
  }

  // Wash dishes 10h-14h30 or 17h30-21h (only if eatery is nearby)
  if (((hr >= 10 && hr < 14.5) || (hr >= 17.5 && hr < 21)) && !(B.giveUpUntil && B.tick < B.giveUpUntil)) {
    const eatD = D(p.x,p.z,LOC.eatery.x,LOC.eatery.z);
    if (eatD < 25) {
      B.target = LOC.eatery; B.action = '🍽️ Đi rửa chén...';
      goTo(LOC.eatery.x, LOC.eatery.z, 3);
      if (eatD < 4) {
        stop();
        p.face(LOC.eatery.x, LOC.eatery.z);
        interact(); B.dlgWait = 10;
      }
      return;
    }
  }

  // Board work — accept delivery jobs when near the board (skip during give-up)
  if (LOC.board && !p.carry && !(B.giveUpUntil && B.tick < B.giveUpUntil)) {
    const bd = D(p.x, p.z, LOC.board.x, LOC.board.z);
    const acts = ACTS();
    const job = acts?.job;
    if (bd < 8 && !job && (state.wd?.deliveries ?? 0) < 4) {
      B.target = LOC.board; B.action = '📋 Xem bảng việc làm...';
      if (goTo(LOC.board.x, LOC.board.z, 3)) {
        stop();
        p.face(LOC.board.x, LOC.board.z);
        interact(); B.dlgWait = 8;
        lg('📋 Tới bảng việc làm','good');
      }
      return;
    }
  }

  // Dock work 4h30-10h (only if dock is nearby, < 25m)
  if (hr >= 4.5 && hr < 10 && !p.carry && !(B.giveUpUntil && B.tick < B.giveUpUntil)) {
    const dockDest = LOC.dock || {x:-76.6, z:-4.4};
    const dockDist = D(p.x, p.z, dockDest.x, dockDest.z);
    if (dockDist < 25) {
      const acts = ACTS();
      const job = acts?.job;
      if (!job || job.kind !== 'dock') {
        B.target = dockDest; B.action = '💪 Đi bốc hàng...';
        if (goTo(dockDest.x, dockDest.z, 3)) {
          stop();
          p.face(dockDest.x, dockDest.z);
          interact(); B.dlgWait = 8;
        }
        return;
      }
      if (job.kind === 'dock' && !job.carrying) {
        const pickDest = LOC.dockTake || {x:-78.9, z:-3.6};
        B.target = pickDest; B.action = '📦 Lấy bao hàng...';
        if (goTo(pickDest.x, pickDest.z, 3)) {
          stop();
          p.face(pickDest.x, pickDest.z);
          interact(); B.dlgWait = 5;
        }
        return;
      }
    }
  }

  // Wander to busy areas - log EVERYTHING
  B.action = '🚶 Tìm người & ve chai...';
  if (B.tick % 40 === 0) {
    const npcs = NPCS();
    const allNpcs = npcs?.list?.filter(n => !n.hidden) || [];
    const nearNpcs = allNpcs.filter(n => D(p.x,p.z,n.x,n.z) < 30);
    const ped = findPed();
    const lit = findLitter();
    const bin = findBin();
    const acts = ACTS();
    lg(`🔍 near=${nearNpcs.length} ped=${ped?`${ped.kind}@(${ped.x.toFixed(0)},${ped.z.toFixed(0)})`:'none'} lit=${lit?`@(${lit.x.toFixed(0)},${lit.z.toFixed(0)})`:'none'} bin=${bin?'yes':'no'} acts.litter=${acts?.litter?.length||0}`);
    if (nearNpcs.length > 0 && B.tick % 120 === 0) {
      nearNpcs.slice(0,3).forEach(n => lg(`  NPC: ${n.kind} state=${n.state} asked=${n.asked} @(${n.x.toFixed(0)},${n.z.toFixed(0)}) d=${D(p.x,p.z,n.x,n.z).toFixed(1)}`));
    }
  }
  if (!B.target || D(p.x,p.z,B.target.x,B.target.z) < 5 || B.tick%120===0) {
    // Smart patrol: only choose targets within 20m
    const allAreas = [
      LOC.mktGate || {x:-37, z:0},
      LOC.mktMid || {x:-59, z:0},
      {x:29.5, z:0},
      {x:0, z:29.5},
      LOC.temple || {x:56, z:40},
      LOC.eatery || {x:-8, z:-17},
      LOC.dock || {x:-77, z:-4},
      {x:0, z:0},
      {x:-29.5, z:-29.5},
      LOC.camp || {x:49, z:101},
    ];
    // Filter: prefer targets 10-60m away (not too close, not too far)
    const good = allAreas.filter(a => {
      const d = D(p.x,p.z,a.x,a.z);
      return d > 10 && d < 60;
    });
    const close = allAreas.filter(a => D(p.x,p.z,a.x,a.z) <= 10);
    if (good.length > 0) {
      B.target = good[Math.floor(Math.random()*good.length)];
    } else if (close.length > 0) {
      // All targets are close — pick the farthest one
      let farthest = close[0], fd = 0;
      for (const a of close) {
        const d = D(p.x,p.z,a.x,a.z);
        if (d > fd) { fd = d; farthest = a; }
      }
      B.target = farthest;
    } else {
      // All targets are very far — pick nearest
      let nearest = allAreas[0], nd = D(p.x,p.z,allAreas[0].x,allAreas[0].z);
      for (const a of allAreas) {
        const d = D(p.x,p.z,a.x,a.z);
        if (d < nd) { nd = d; nearest = a; }
      }
      B.target = nearest;
    }
  }
  goTo(B.target.x, B.target.z, 5);
}

// ═══ BUY GÁNH ═══
function doBuyGanh() {
  const state = G(), p = P();
  B.target = LOC.equip; B.action = '🎒 Mua gánh...';
  if (goTo(LOC.equip.x, LOC.equip.z, 3)) {
    stop();
    p.face(LOC.equip.x-5, LOC.equip.z);
    const acts = ACTS();
    if (acts?.buyGear && !state.gear?.ganh) {
      acts.buyGear('ganh');
      lg('🎒 MUA GÁNH! -120k','good');
    }
    B.phase = 'buy_gear';
    B.dlgWait = 10;
  }
}

// ═══ BUY GEAR ═══
function doBuyGear() {
  const state = G(), p = P();
  B.target = LOC.equip; B.action = '🔪 Mua đồ nghề...';
  if (goTo(LOC.equip.x, LOC.equip.z, 3)) {
    stop();
    const acts = ACTS();
    if (acts?.buyGear) {
      if (!state.gear?.daothot && state.cash >= 45000) {
        acts.buyGear('daothot');
        lg('🔪 Dao thớt! -45k','good');
      }
    }
    B.phase = 'buy_ing';
    B.dlgWait = 10;
  }
}

// ═══ BUY INGREDIENTS ═══
function doBuyIng() {
  const p = P();
  B.target = LOC.mktMid; B.action = '🛒 Mua nguyên liệu...';
  if (goTo(LOC.mktMid.x, LOC.mktMid.z, 4)) {
    stop();
    interact(); B.dlgWait = 10;
    lg('🛒 Đang mua...');
    setTimeout(() => {
      B.phase = 'sell'; B.target = LOC.sellCho;
      B.cash0 = G().cash;
      lg('🏪 → Chỗ bán!','good');
    }, 3000);
  }
}

// ═══ SELLING ═══
function doSell() {
  const state = G(), p = P();
  B.sellEarned = Math.max(0, state.cash - B.cash0);
  if (B.sellEarned >= B.sellGoal) {
    lg(`🎉🎉🎉 ĐẠT 100K! 🎉🎉🎉`,'good');
    B.phase = 'done'; return;
  }
  const s = state.stall;

  if (s.where === 'carried' && state.gear?.ganh) {
    B.target = LOC.sellCho; B.action = '🏪 Tìm chỗ đặt gánh...';
    if (goTo(LOC.sellCho.x, LOC.sellCho.z, 3.5)) {
      stop();
      interact(); B.dlgWait = 10;
      lg('🏪 Đặt gánh!','good');
    }
    return;
  }

  if (s.where === 'placed' && !s.open) {
    B.action = '🔔 Mở quầy...';
    if (goTo(s.x, s.z, 2.5)) {
      stop(); interact(); B.dlgWait = 10;
    }
    return;
  }

  if (s.open || s.where === 'placed') {
    if (D(p.x,p.z,s.x,s.z) > 3) { goTo(s.x,s.z,2); return; }
    stop();
    B.action = `🏪 Bán: ${B.sellEarned.toLocaleString()}₫`;
    const ix = IX();
    if (ix) { ix.update(0.05); if (ix.focus) { ix.trigger(); B.dlgWait=5; lg('👨‍🍳 Khách!'); } }
  }
}

// ═══ SLEEP ═══
function doSleep() {
  const p = P();
  B.target = LOC.camp; B.action = '😴 Về ngủ...';
  if (goTo(LOC.camp.x, LOC.camp.z, 3)) {
    stop(); interact(); B.dlgWait = 15;
    setTimeout(() => {
      const state = G();
      B.docks=0; B.begs=0;
      B.phase = !state.gear?.ganh ? (state.cash >= B.earnGoal ? 'buy_ganh' : 'earn') : 'sell';
      lg(`☀️ Ngày ${state.day+1}! ${state.cash.toLocaleString()}₫`,'good');
    }, 4000);
  }
}

// ═══ STATUS OVERLAY ═══
function createOverlay() {
  const el = document.createElement('div');
  el.id = 'bot-overlay';
  el.style.cssText = 'position:fixed;top:8px;left:8px;z-index:99999;background:rgba(0,0,0,.88);color:#fff;padding:10px;border-radius:8px;font:12px/1.4 system-ui;max-width:280px;pointer-events:auto;border:1px solid rgba(255,215,0,.3);';
  document.body.appendChild(el);
  return el;
}

let overlay = null;
function updateOverlay() {
  if (!overlay) overlay = createOverlay();
  const state = G(), p = P();
  const phases = {
    wait:'⏳ Chờ', start:'🎮 Bắt đầu', earn:'💰 Kiếm tiền',
    buy_ganh:'🎒 Mua gánh', buy_gear:'🔪 Đồ nghề', buy_ing:'🛒 Nguyên liệu',
    sell:'🏪 Bán hàng', sleep:'😴 Ngủ', done:'🎉 Xong!'
  };

  overlay.innerHTML = `
    <div style="color:#ffd700;font-weight:700;font-size:13px">🤖 ${phases[B.phase]||B.phase}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin:4px 0;font-size:11px">
      <span>💵 ${state?state.cash.toLocaleString():'?'}₫</span>
      <span>🕐 ${hStr()}</span>
      <span>📅 Ngày ${state?state.day+1:'?'}</span>
      <span>🎯 ${B.target?.n||'—'}</span>
      <span>🙏${B.begs} 🗑️${B.litters}</span>
      <span>📦${B.docks} 🏪${B.sellEarned.toLocaleString()}₫</span>
    </div>
    <div style="font-size:10px;color:#aaa">${B.action||''}</div>
    ${p?`<div style="font-size:9px;color:#666">(${p.x.toFixed(0)},${p.z.toFixed(0)}) ${uiState()}</div>`:''}
    <div style="max-height:100px;overflow-y:auto;font-size:10px;margin-top:4px">
      ${B.log.slice(-10).map(l=>`<div style="color:${l.c==='good'?'#4f4':l.c==='warn'?'#fa0':'#8cf'}">${l.m}</div>`).join('')}
    </div>
    <div style="margin-top:6px;display:flex;gap:4px">
      <button onclick="__botStart()" style="padding:3px 10px;background:#4c5;color:#fff;border:0;border-radius:4px;cursor:pointer;font-size:11px">▶</button>
      <button onclick="__botPause()" style="padding:3px 10px;background:#f90;color:#fff;border:0;border-radius:4px;cursor:pointer;font-size:11px">⏸</button>
      <button onclick="__botSpeed(2)" style="padding:3px 10px;background:#29f;color:#fff;border:0;border-radius:4px;cursor:pointer;font-size:11px">×2</button>
      <button onclick="__botSpeed(4)" style="padding:3px 10px;background:#29f;color:#fff;border:0;border-radius:4px;cursor:pointer;font-size:11px">×4</button>
    </div>
  `;
}

// Global controls
window.__botStart = () => { B.paused=false; if(B.phase==='wait')B.phase='start'; lg('▶ Bắt đầu','good'); };
window.__botPause = () => { B.paused=!B.paused; if(B.paused)stop(); lg(B.paused?'⏸':'▶'); };
window.__botSpeed = (m) => { const c=ctx(); if(c){c.speed=0.75*m; lg('⏩×'+m);} };

// ─── Init ───
function init() {
  overlay = createOverlay();
  lg('🤖 Bot injected!');

  // Clear stale save on each new session
  const SAVE_KEY = 'ganhhang.save.v1';
  const url = new URL(location.href);
  if (!url.searchParams.has('v8')) {
    localStorage.removeItem(SAVE_KEY);
    lg('🔄 Xóa save → ngày mới (v9 survival-fix)','warn');
    url.searchParams.set('v8', '1');
    if (!url.searchParams.has('debug')) url.searchParams.set('debug', '');
    location.href = url.toString();
    return;
  }

  const check = setInterval(() => {
    if (ready()) {
      clearInterval(check);
      lg('✅ Game ready! Auto-start...','good');
      syncLOC();
      // Auto-start after 1 second
      setTimeout(() => {
        B.phase = 'start';
        lg('▶ AUTO-START!','good');
      }, 1000);
    }
  }, 500);

  setInterval(update, 50);       // 20fps logic
  setInterval(updateOverlay, 300); // 3fps UI
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
