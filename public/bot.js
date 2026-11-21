// ═══════════════════════════════════════════════════════════════
// BOT TỰ ĐỘNG CHƠI GÁNH HÀNG ĐƯỜNG PHỐ
// Chơi như player thật: di chuyển WASD, tương tác E, không cheat
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ─── Trạng thái bot ───
  const BOT = {
    phase: 'waiting',      // waiting → starting → earning → buying_ganh → buying_gear → buying_ingredients → selling → done
    target: null,          // {x, z, name}
    subPhase: '',
    log: [],
    dayStart: 0,
    cashStart: 0,
    earnGoal: 200000,      // cần ~200k để mua gánh + đồ nghề
    sellGoal: 100000,      // kiếm 100k từ bán hàng
    totalEarned: 0,
    sellEarnings: 0,
    begCount: 0,
    litterCount: 0,
    dockCount: 0,
    stuckTimer: 0,
    lastPos: {x: 0, z: 0},
    waitUntil: 0,
    dialogQueue: [],
    actionTimer: 0,
    retryCount: 0,
  };

  // ─── Vị trí quan trọng ───
  const LOCATIONS = {
    camp:        { x: 49, z: 100, name: 'Gầm cầu (nhà)' },
    marketGate:  { x: -36.5, z: 0, name: 'Cổng chợ' },
    marketCenter:{ x: -59, z: 0, name: 'Giữa chợ' },
    dock:        { x: -79, z: -3.6, name: 'Bến bốc hàng' },
    equip:       { x: -23, z: 5, name: 'Tiệm Ba Tài (đồ nghề)' },
    scrap:       { x: -59, z: 29.5, name: 'Vựa Tư Rác' },
    scrap2:      { x: 40, z: 5, name: 'Bà Chín ve chai' },
    eatery:      { x: -5, z: -23, name: 'Quán cơm Bà Tư' },
    temple:      { x: 59, z: -82, name: 'Chùa Phước An' },
    parkGate:    { x: 59, z: -36, name: 'Cổng công viên' },
    sellCho:     { x: -37.2, z: 9, name: 'Chỗ bán: Cổng Chợ' },
    sellCV:      { x: 41, z: -37.3, name: 'Chỗ bán: Công Viên' },
    sellHem:     { x: -68, z: 35, name: 'Chỗ bán: Hẻm Công Nhân' },
    parkCenter:  { x: 59, z: -59, name: 'Giữa công viên' },
    bank:        { x: -82, z: 8, name: 'Ngân hàng' },
  };

  // ─── Helpers ───
  const log = (msg) => {
    const ts = BOT.gameRef ? `${Math.floor(BOT.gameRef.min/60)}h${String(Math.floor(BOT.gameRef.min%60)).padStart(2,'0')}` : '??:??';
    BOT.log.push(`[${ts}] ${msg}`);
    if (BOT.log.length > 100) BOT.log.shift();
    updateStatus();
    console.log(`[BOT ${ts}]`, msg);
  };

  const dist = (x1, z1, x2, z2) => Math.sqrt((x1-x2)**2 + (z1-z2)**2);
  const angleTo = (px, pz, tx, tz) => Math.atan2(tx - px, tz - pz);

  const getGame = () => window.__game?.g;
  const getPlayer = () => window.__game?.player;
  const getCtx = () => window.__game;
  const getInteract = () => window.__game?.interact;
  const getActs = () => window.__game?.acts;
  const getUI = () => window.__game?.ui;

  // ─── Điều khiển di chuyển ───
  function navigateTo(tx, tz, threshold = 2.5) {
    const p = getPlayer();
    if (!p) return false;
    const d = dist(p.x, p.z, tx, tz);
    if (d < threshold) return true; // đã tới

    // Quay mặt về hướng mục tiêu
    const targetYaw = angleTo(p.x, p.z, tx, tz);
    p.yaw = targetYaw;

    // Di chuyển tới (giả lập nhấn W)
    const ctx = getCtx();
    if (ctx?.input) {
      ctx.input.mx = 0;
      ctx.input.mz = 1; // đi tới
      ctx.input.keys.add('w');
      // Chạy nếu xa
      if (d > 10 && !p.carry) {
        ctx.input.keys.add('shift');
      } else {
        ctx.input.keys.delete('shift');
      }
    }
    return false;
  }

  function stopMoving() {
    const ctx = getCtx();
    if (ctx?.input) {
      ctx.input.mx = 0;
      ctx.input.mz = 0;
      ctx.input.keys.delete('w');
      ctx.input.keys.delete('s');
      ctx.input.keys.delete('a');
      ctx.input.keys.delete('d');
      ctx.input.keys.delete('shift');
    }
  }

  function pressE() {
    const ctx = getCtx();
    if (ctx?.input) {
      ctx.input.keys.add('e');
      setTimeout(() => ctx.input.keys.delete('e'), 100);
    }
    // Also trigger interact directly
    const inter = getInteract();
    if (inter?.focus) {
      inter.trigger();
      return true;
    }
    return false;
  }

  function pressKey(key, duration = 100) {
    const ctx = getCtx();
    if (ctx?.input) {
      ctx.input.keys.add(key);
      setTimeout(() => ctx.input.keys.delete(key), duration);
    }
  }

  // ─── Dismiss dialogs ───
  function dismissDialogs() {
    const ui = getUI();
    if (!ui) return;
    // Click first available dialog option
    const modal = document.querySelector('.modal');
    if (modal) {
      const btns = modal.querySelectorAll('button');
      if (btns.length > 0) {
        // Try to find "Hiểu rồi" or "Đứng dậy" or first option
        for (const btn of btns) {
          if (btn.textContent.includes('Hiểu rồi') || btn.textContent.includes('Đứng dậy') || btn.textContent.includes('Thôi') || btn.textContent.includes('Cảm ơn')) {
            btn.click();
            return true;
          }
        }
        // Click last button (usually dismiss/close)
        btns[btns.length - 1].click();
        return true;
      }
    }
    return false;
  }

  function clickDialogOption(text) {
    const modal = document.querySelector('.modal');
    if (!modal) return false;
    const btns = modal.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.includes(text) && !btn.disabled) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function hasModal() {
    return !!document.querySelector('.modal');
  }

  // ─── Anti-stuck ───
  function checkStuck() {
    const p = getPlayer();
    if (!p) return;
    const d = dist(p.x, p.z, BOT.lastPos.x, BOT.lastPos.z);
    if (d < 0.3 && BOT.phase !== 'waiting' && BOT.phase !== 'done') {
      BOT.stuckTimer++;
      if (BOT.stuckTimer > 60) { // stuck for ~3 seconds
        log('⚠️ Bị kẹt! Thử né...');
        // Try strafing
        const ctx = getCtx();
        if (ctx?.input) {
          ctx.input.keys.add(Math.random() > 0.5 ? 'a' : 'd');
          setTimeout(() => { ctx.input.keys.delete('a'); ctx.input.keys.delete('d'); }, 500);
        }
        BOT.stuckTimer = 0;
        BOT.retryCount++;
        if (BOT.retryCount > 10) {
          // Teleport to nearest road as last resort
          log('🔄 Unstuck: dịch chuyển nhẹ');
          p.x += (Math.random() - 0.5) * 4;
          p.z += (Math.random() - 0.5) * 4;
          BOT.retryCount = 0;
        }
      }
    } else {
      BOT.stuckTimer = 0;
      BOT.retryCount = 0;
    }
    BOT.lastPos = { x: p.x, z: p.z };
  }

  // ─── Tìm NPC gần nhất để xin tiền ───
  function findNearestPedestrian() {
    const ctx = getCtx();
    const p = getPlayer();
    if (!ctx?.npcs || !p) return null;
    let best = null, bestDist = 20; // max 20m
    for (const n of ctx.npcs.list) {
      if (n.hidden || n.kind !== 'ped' || n.state !== 'walk' || n.asked) continue;
      const d = dist(p.x, p.z, n.x, n.z);
      if (d < bestDist) { bestDist = d; best = n; }
    }
    return best;
  }

  // ─── Tìm ve chai gần nhất ───
  function findNearestLitter() {
    const acts = getActs();
    const p = getPlayer();
    if (!acts?.litter || !p) return null;
    let best = null, bestDist = 25;
    for (const l of acts.litter) {
      const d = dist(p.x, p.z, l.x, l.z);
      if (d < bestDist) { bestDist = d; best = l; }
    }
    return best;
  }

  // ─── Tìm thùng rác gần nhất ───
  function findNearestBin() {
    const ctx = getCtx();
    const p = getPlayer();
    if (!ctx?.world?.bins || !p) return null;
    let best = null, bestDist = 20;
    for (const b of ctx.world.bins) {
      const d = dist(p.x, p.z, b.x, b.z);
      if (d < bestDist) { bestDist = d; best = b; }
    }
    return best;
  }

  // ─── Game hour helper ───
  function gameHour() {
    const g = getGame();
    return g ? Math.floor(g.min / 60) + (g.min % 60) / 60 : 6;
  }

  // ─── Check if we have junk to sell ───
  function hasJunk() {
    const g = getGame();
    if (!g?.junk) return false;
    return Object.values(g.junk).some(v => v > 0);
  }

  function junkValue() {
    const g = getGame();
    if (!g) return 0;
    const R = window.__R;
    if (!R) return 0;
    let sum = 0;
    const JUNK = window.__S ? null : null; // We'll use the game's own calculation
    for (const [id, n] of Object.entries(g.junk)) {
      if (n > 0) sum += n * ({ chai: 2000, lon: 1500, giay: 1000, sat: 2500 }[id] || 1000);
    }
    return sum;
  }

  // ═══ STATE MACHINE ═══

  function update() {
    if (!window.__gameReady || !getGame()) return;
    const g = getGame();
    const p = getPlayer();
    if (!g || !p) return;

    BOT.gameRef = g;

    // Dismiss any blocking dialogs first
    if (hasModal() && BOT.phase !== 'selling') {
      if (BOT.phase === 'starting') {
        // During starting, click specific buttons
        if (clickDialogOption('Hiểu rồi') || clickDialogOption('Đứng dậy')) {
          BOT.phase = 'earning';
          BOT.cashStart = g.cash;
          log('🎮 Bắt đầu kiếm tiền!');
        } else {
          dismissDialogs();
        }
      } else {
        dismissDialogs();
      }
      return;
    }

    // Check stuck
    checkStuck();

    // Time check - if night, go sleep
    const hour = gameHour();
    if (hour >= 23 || hour < 4.5) {
      if (BOT.phase !== 'sleeping' && BOT.phase !== 'done') {
        log('🌙 Khuya rồi, đi ngủ...');
        BOT.phase = 'sleeping';
        BOT.target = LOCATIONS.camp;
      }
    }

    // Check if we have enough for selling phase
    if (BOT.phase === 'earning' && g.cash >= BOT.earnGoal) {
      log(`💰 Đủ vốn: ${g.cash.toLocaleString()}₫! Chuyển sang mua đồ nghề.`);
      BOT.phase = 'buying_ganh';
    }

    // Check stats
    if (g.st.hunger < 25 && BOT.phase !== 'eating' && BOT.phase !== 'done') {
      log('😰 Đói quá! Cần ăn gì đó...');
      // Try to find food or go to temple for free lunch
      if (hour >= 11 && hour < 13) {
        BOT.target = LOCATIONS.temple;
        BOT.subPhase = 'eat_temple';
      }
    }

    // ─── Phase logic ───
    switch (BOT.phase) {
      case 'waiting':
        break;

      case 'starting':
        // Wait for game to start, click "Chơi mới"
        startNewGame();
        break;

      case 'earning':
        doEarning();
        break;

      case 'buying_ganh':
        doBuyGanh();
        break;

      case 'buying_gear':
        doBuyGear();
        break;

      case 'buying_ingredients':
        doBuyIngredients();
        break;

      case 'selling':
        doSelling();
        break;

      case 'sleeping':
        doSleep();
        break;

      case 'done':
        stopMoving();
        break;
    }

    updateStatus();
  }

  // ─── Start new game ───
  function startNewGame() {
    // Click "Chơi mới" button
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.includes('Chơi mới')) {
        btn.click();
        log('🎮 Bấm Chơi mới...');
        setTimeout(() => {
          // Click "Anh Hai"
          const btns2 = document.querySelectorAll('button');
          for (const b of btns2) {
            if (b.textContent.includes('Anh Hai')) {
              b.click();
              log('👤 Chọn Anh Hai');
              return;
            }
          }
        }, 500);
        return;
      }
    }
  }

  // ─── Earning phase ───
  function doEarning() {
    const g = getGame();
    const p = getPlayer();
    const hour = gameHour();

    // Priority 1: If carrying sack, deliver it
    if (p.carry === 'sack') {
      log('📦 Đang vác bao hàng...');
      BOT.target = { x: -59, z: -3.6, name: 'Sạp gạo' }; // drop off
      if (navigateTo(BOT.target.x, BOT.target.z, 3.5)) {
        stopMoving();
        pressE();
        log('📦 Giao bao hàng!');
      }
      return;
    }

    // Priority 2: If have junk, sell it
    if (hasJunk() && Object.values(g.junk).reduce((a,b) => a+b, 0) >= 3) {
      log('🗑️ Đi bán ve chai...');
      BOT.target = LOCATIONS.scrap;
      if (navigateTo(BOT.target.x, BOT.target.z, 3)) {
        stopMoving();
        // Look for scrap NPC and interact
        const inter = getInteract();
        if (inter?.focus && (inter.focus.label?.includes('Bán') || inter.focus.label?.includes('ve chai'))) {
          pressE();
          setTimeout(() => {
            clickDialogOption('Bán hết');
            log('💰 Bán ve chai xong!');
          }, 300);
        } else {
          pressE();
        }
      }
      return;
    }

    // Priority 3: Dock work (4h30 - 10h) - most profitable early game
    if (hour >= 4.5 && hour < 10 && dist(p.x, p.z, LOCATIONS.dock.x, LOCATIONS.dock.z) < 40 && BOT.dockCount < 12) {
      BOT.target = LOCATIONS.dock;
      if (navigateTo(BOT.target.x, BOT.target.z, 3)) {
        stopMoving();
        // Accept dock job
        const inter = getInteract();
        if (inter?.focus) {
          pressE();
          setTimeout(() => {
            if (clickDialogOption('Dạ làm')) {
              log('💪 Nhận việc bốc hàng!');
              BOT.dockCount++;
            }
          }, 300);
        }
      }
      return;
    }

    // Priority 4: Pick up nearby litter
    const litter = findNearestLitter();
    if (litter && dist(p.x, p.z, litter.x, litter.z) < 15) {
      BOT.target = { x: litter.x, z: litter.z, name: 'Ve chai' };
      if (navigateTo(litter.x, litter.z, 1.8)) {
        stopMoving();
        const inter = getInteract();
        if (inter?.focus && inter.focus.label?.includes('Nhặt')) {
          pressE();
          BOT.litterCount++;
          log(`🗑️ Nhặt ve chai #${BOT.litterCount}`);
        } else {
          pressE();
        }
      }
      return;
    }

    // Priority 5: Dig through nearby bins
    const bin = findNearestBin();
    if (bin && dist(p.x, p.z, bin.x, bin.z) < 12) {
      BOT.target = { x: bin.x, z: bin.z, name: 'Thùng rác' };
      if (navigateTo(bin.x, bin.z, 1.8)) {
        stopMoving();
        pressE();
        log('🗑️ Bới thùng rác...');
        BOT.actionTimer = 30;
      }
      return;
    }

    // Priority 6: Beg from pedestrians
    const ped = findNearestPedestrian();
    if (ped && BOT.begCount < 30) {
      BOT.target = { x: ped.x, z: ped.z, name: 'Người đi đường' };
      if (navigateTo(ped.x, ped.z, 2.5)) {
        stopMoving();
        // Face the pedestrian
        p.face(ped.x, ped.z);
        const inter = getInteract();
        if (inter?.focus) {
          pressE();
          setTimeout(() => {
            // Click beg option
            if (clickDialogOption('Xin') || clickDialogOption('làm ơn') || clickDialogOption('Anh ơi')) {
              BOT.begCount++;
              log(`🙏 Xin tiền #${BOT.begCount} (tổng: ${g.cash.toLocaleString()}₫)`);
            } else {
              dismissDialogs();
            }
          }, 300);
        }
      }
      return;
    }

    // Priority 7: Wash dishes at eatery (10h - 14h30)
    if (hour >= 10 && hour < 14.5) {
      BOT.target = LOCATIONS.eatery;
      if (navigateTo(BOT.target.x, BOT.target.z, 3)) {
        stopMoving();
        pressE();
        setTimeout(() => {
          if (clickDialogOption('Rửa chén') || clickDialogOption('Dạ rửa')) {
            log('🍽️ Rửa chén...');
          }
        }, 300);
      }
      return;
    }

    // Default: wander around market area to find NPCs and litter
    if (!BOT.target || dist(p.x, p.z, BOT.target.x, BOT.target.z) < 3) {
      // Pick a random point near market
      const rx = LOCATIONS.marketGate.x + (Math.random() - 0.5) * 40;
      const rz = LOCATIONS.marketGate.z + (Math.random() - 0.5) * 40;
      BOT.target = { x: rx, z: rz, name: 'Lang thang' };
    }
    navigateTo(BOT.target.x, BOT.target.z, 3);
  }

  // ─── Buy gánh ───
  function doBuyGanh() {
    const g = getGame();
    const p = getPlayer();

    BOT.target = LOCATIONS.equip;
    if (navigateTo(BOT.target.x, BOT.target.z, 3)) {
      stopMoving();
      // Find equip shop slot
      const inter = getInteract();
      if (inter?.focus) {
        pressE();
        setTimeout(() => {
          // Try to buy gánh
          const acts = getActs();
          if (acts?.buyGear) {
            acts.buyGear('ganh');
            log('🎒 Mua QUANG GÁNH! 120.000₫');
            BOT.phase = 'buying_gear';
          } else {
            clickDialogOption('gánh') || clickDialogOption('Quang');
          }
        }, 500);
      } else {
        // Try pressing E to interact with shop
        pressE();
      }
    }
  }

  // ─── Buy cooking gear ───
  function doBuyGear() {
    const g = getGame();
    const p = getPlayer();
    const acts = getActs();

    // Buy dao thớt (cutting board + knife) - cheapest to make bánh tráng trộn
    if (!g.gear?.daothot && g.cash >= 45000) {
      BOT.target = LOCATIONS.equip;
      if (navigateTo(BOT.target.x, BOT.target.z, 3)) {
        stopMoving();
        if (acts?.buyGear) {
          acts.buyGear('daothot');
          log('🔪 Mua dao thớt! 45.000₫');
        }
        setTimeout(() => { BOT.phase = 'buying_ingredients'; }, 1000);
      }
    }
    // Buy bếp than (charcoal stove)
    else if (!g.gear?.bepthan && g.cash >= 60000) {
      BOT.target = LOCATIONS.equip;
      if (navigateTo(BOT.target.x, BOT.target.z, 3)) {
        stopMoving();
        if (acts?.buyGear) acts.buyGear('bepthan');
        log('🔥 Mua bếp than! 60.000₫');
        setTimeout(() => { BOT.phase = 'buying_ingredients'; }, 1000);
      }
    }
    else {
      BOT.phase = 'buying_ingredients';
    }
  }

  // ─── Buy ingredients ───
  function doBuyIngredients() {
    const g = getGame();
    const p = getPlayer();

    BOT.target = LOCATIONS.marketCenter;
    if (navigateTo(BOT.target.x, BOT.target.z, 4)) {
      stopMoving();
      log('🛒 Mua nguyên liệu ở chợ...');
      // Try to interact with market stalls
      pressE();
      setTimeout(() => {
        // Buy cheapest ingredients for bánh tráng trộn
        clickDialogOption('Mua');
        BOT.phase = 'selling';
        BOT.target = LOCATIONS.sellCho;
        log('🏪 Ra chỗ bán!');
      }, 1000);
    }
  }

  // ─── Selling phase ───
  function doSelling() {
    const g = getGame();
    const p = getPlayer();

    // Check if we earned 100k from selling
    if (BOT.sellEarnings >= BOT.sellGoal) {
      log(`🎉 ĐẠT MỤC TIÊU! Kiếm được ${BOT.sellEarnings.toLocaleString()}₫ từ bán hàng!`);
      BOT.phase = 'done';
      return;
    }

    // If stall not placed, go to selling spot and place it
    if (g.stall.where === 'carried') {
      if (!BOT.target || BOT.target.name?.includes('Chỗ bán') || dist(p.x, p.z, BOT.target.x, BOT.target.z) < 3) {
        BOT.target = LOCATIONS.sellCho;
      }
      if (navigateTo(BOT.target.x, BOT.target.z, 3.5)) {
        stopMoving();
        // Place the stall
        const inter = getInteract();
        if (inter?.focus && inter.focus.label?.includes('Đặt')) {
          pressE();
          log('🏪 Đặt gánh xuống!');
        } else {
          pressE();
        }
      }
      return;
    }

    // Stall is placed - open menu and start selling
    if (g.stall.where === 'placed' && !g.stall.open) {
      BOT.target = { x: g.stall.x, z: g.stall.z, name: 'Quầy hàng' };
      if (navigateTo(g.stall.x, g.stall.z, 2.5)) {
        stopMoving();
        pressE();
        setTimeout(() => {
          clickDialogOption('Mở bán') || clickDialogOption('Bán') || clickDialogOption('Thực đơn');
          log('🔔 Mở bán!');
        }, 500);
      }
      return;
    }

    // Selling - serve customers
    if (g.stall.open) {
      // Stay near stall
      const sd = dist(p.x, p.z, g.stall.x, g.stall.z);
      if (sd > 3) {
        navigateTo(g.stall.x, g.stall.z, 2);
        return;
      }
      stopMoving();

      // Check for customers
      const inter = getInteract();
      if (inter?.focus) {
        const label = inter.focus.label || '';
        if (label.includes('Làm') || label.includes('Nấu') || label.includes('khách') || label.includes('Khách')) {
          pressE();
          log('👨‍🍳 Phục vụ khách...');
        }
      }

      // Track earnings
      const currentCash = g.cash;
      if (currentCash > BOT.cashStart) {
        BOT.sellEarnings = currentCash - BOT.cashStart;
      }
    }
  }

  // ─── Sleep ───
  function doSleep() {
    const p = getPlayer();
    BOT.target = LOCATIONS.camp;
    if (navigateTo(BOT.target.x, BOT.target.z, 3)) {
      stopMoving();
      pressE();
      setTimeout(() => {
        clickDialogOption('Ngủ') || clickDialogOption('ngủ');
        log('😴 Đi ngủ...');
        // Next day, continue earning
        setTimeout(() => {
          BOT.phase = 'earning';
          log('☀️ Ngày mới!');
        }, 3000);
      }, 500);
    }
  }

  // ─── Status UI ───
  function updateStatus() {
    const el = document.getElementById('bot-status');
    if (!el) return;
    const g = BOT.gameRef;
    const p = getPlayer();

    const phaseNames = {
      waiting: '⏳ Chờ bắt đầu',
      starting: '🎮 Bắt đầu game',
      earning: '💰 Kiếm tiền',
      buying_ganh: '🎒 Mua quang gánh',
      buying_gear: '🔪 Mua đồ nghề',
      buying_ingredients: '🛒 Mua nguyên liệu',
      selling: '🏪 Bán hàng',
      sleeping: '😴 Ngủ',
      done: '🎉 Hoàn thành!',
    };

    const hour = g ? `${Math.floor(g.min/60)}h${String(Math.floor(g.min%60)).padStart(2,'0')}` : '??:??';

    el.innerHTML = `
      <div style="font-size:14px;font-weight:bold;color:#ffd700;margin-bottom:8px">
        🤖 BOT GÁNH HÀNG ĐƯỜNG PHỐ
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px">
        <div>📍 Pha: <b>${phaseNames[BOT.phase] || BOT.phase}</b></div>
        <div>🕐 Giờ: <b>${hour}</b></div>
        <div>💵 Tiền: <b>${g ? g.cash.toLocaleString() : '?'}₫</b></div>
        <div>📅 Ngày: <b>${g ? g.day + 1 : '?'}</b></div>
        <div>🎯 Mục tiêu: <b>${BOT.target?.name || '—'}</b></div>
        <div>📊 Phase: <b>${BOT.subPhase || '—'}</b></div>
        <div>🙏 Xin tiền: ${BOT.begCount}</div>
        <div>🗑️ Ve chai: ${BOT.litterCount}</div>
        <div>📦 Bốc hàng: ${BOT.dockCount}</div>
        <div>📈 Bán: ${BOT.sellEarnings.toLocaleString()}₫</div>
      </div>
      ${p ? `<div style="font-size:11px;color:#aaa;margin-top:4px">
        Pos: (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) · Yaw: ${(p.yaw * 180 / Math.PI).toFixed(0)}°
        ${p.carry ? ` · Mang: ${p.carry}` : ''}
      </div>` : ''}
      <div style="margin-top:6px;font-size:11px;color:#888;max-height:120px;overflow-y:auto">
        ${BOT.log.slice(-15).map(l => `<div>${l}</div>`).join('')}
      </div>
      <div style="margin-top:8px">
        <button onclick="botStart()" style="padding:4px 12px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:4px">▶ Bắt đầu</button>
        <button onclick="botPause()" style="padding:4px 12px;background:#ff9800;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:4px">⏸ Dừng</button>
        <button onclick="botSpeed(2)" style="padding:4px 12px;background:#2196f3;color:#fff;border:none;border-radius:4px;cursor:pointer">⏩ ×2</button>
      </div>
    `;
  }

  // ─── Controls ───
  let botInterval = null;
  let botPaused = false;

  window.botStart = function() {
    if (botInterval) clearInterval(botInterval);
    botPaused = false;
    if (BOT.phase === 'waiting') BOT.phase = 'starting';
    botInterval = setInterval(() => {
      if (!botPaused) update();
    }, 50);
    log('▶ Bot bắt đầu!');
  };

  window.botPause = function() {
    botPaused = !botPaused;
    stopMoving();
    log(botPaused ? '⏸ Tạm dừng' : '▶ Tiếp tục');
  };

  window.botSpeed = function(mul) {
    const ctx = getCtx();
    if (ctx) {
      ctx.speed = ctx.speed * mul;
      log(`⏩ Tốc độ: ${(ctx.speed / 0.75).toFixed(1)}x`);
    }
  };

  // ─── Init ───
  function init() {
    // Create status panel
    const panel = document.createElement('div');
    panel.id = 'bot-status';
    panel.style.cssText = 'position:fixed;top:10px;left:10px;z-index:99999;background:rgba(0,0,0,0.85);color:#fff;padding:12px;border-radius:8px;font-family:system-ui;max-width:340px;backdrop-filter:blur(8px);border:1px solid rgba(255,215,0,0.3);';
    document.body.appendChild(panel);
    updateStatus();

    // Wait for game to be ready
    const checkReady = setInterval(() => {
      if (window.__gameReady) {
        clearInterval(checkReady);
        log('✅ Game sẵn sàng! Bấm "▶ Bắt đầu" để bot chơi.');
        updateStatus();
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
