// LƯỢT 21 — ① vựa ve chai Bà Chín ở bên kia thành phố (Khu Dân Cư), bán được đúng như vựa Tư Rác
//            ② bấm chuông căn hộ An Bình thì cánh cửa MỞ RA và chủ nhà bước ra.
// Chạy: cd tools/probe && OUT=/tmp/probe/vua2 node play.mjs steps/vua2.mjs
import { boot, fresh } from '../lib.mjs';

export default [boot, fresh(10 * 60),
  { label: '①a màn dọc: đóng lời nhắc xoay ngang' },
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return !!b; } },

  { label: '①b tele tới vựa Bà Chín, cho sẵn ve chai trong túi' },
  { eval: async () => {
    const m = await import('/src/game/devPoints.ts');
    window.__dev = m;
    m.getDevSections()[0].items.find((i) => i.id === 'setup_vua2').run();
    await new Promise((r) => setTimeout(r, 2000));   // đứng chờ nhân vật rơi xuống đất + NPC hiện ra
    const G = window.__game, g = G.g, a = G.world.anchors.v_scrap2;
    const npc = G.npcs.fixed.get('scrap2');
    return { anchor: a ?? null, junk: g.junk, npcName: npc?.name ?? null, npcHidden: npc?.hidden ?? null };
  }, wait: 2400 },
  { shot: 'vua2-01-vua-ba-chin.png' },

  { label: '①c bấm bán hết ve chai ngay trong túi (luật sellJunk)' },
  { eval: async () => {
    const m = window.__dev, g = window.__game.g, R = window.__R;
    const before = g.cash, tot = g.tot.scrap;
    m.getDevSections()[0].items.find((i) => i.id === 'vua2_sell').run();
    await new Promise((r) => setTimeout(r, 300));
    return { earned: g.cash - before, totScrap: g.tot.scrap - tot, left: Object.keys(g.junk).length, R_hasSell: typeof R.sellJunk };
  }, wait: 400 },

  { label: '①d chạm thẳng Bà Chín để mở hội thoại bán ve chai' },
  { eval: async () => {
    const g = window.__game.g;
    for (const id of ['chai', 'lon']) g.junk[id] = 3;
    const npc = window.__game.npcs.fixed.get('scrap2');
    return { found: !!npc, name: npc?.name ?? null, x: npc?.x ?? null, z: npc?.z ?? null };
  }, wait: 200 },

  { label: '②a tele tới cửa căn hộ An Bình rồi bấm chuông' },
  { eval: async () => {
    const m = window.__dev;
    m.getDevSections()[0].items.find((i) => i.id === 'bell_canho').run();
    await new Promise((r) => setTimeout(r, 1500));
    return true;
  }, wait: 1800 },
  { shot: 'vua2-02-cua-dong.png' },

  { label: '②b đứng đúng trước cửa (nhìn thẳng vào ô cửa)' },
  { eval: async () => {
    const G = window.__game, d = G.interact.doors.find((x) => x.d.lock === 'canho').d;
    const cx = d.x + Math.cos(d.yaw) * d.w * 0.5, cz = d.z + Math.sin(d.yaw) * d.w * 0.5;
    const nx = -Math.sin(d.yaw), nz = Math.cos(d.yaw);
    G.player.place(cx + nx * 2.4, cz + nz * 2.4, Math.atan2(cx - (cx + nx * 2.4), cz - (cz + nz * 2.4)));
    await new Promise((r) => setTimeout(r, 900));
    return { doorCentre: [Math.round(cx * 100) / 100, Math.round(cz * 100) / 100] };
  }, wait: 1100 },
  { shot: 'vua2-02b-cua-truoc-khi-bam.png' },

  { label: '②c bấm chuông → cửa mở, chủ nhà đi ra đúng ô cửa (không xuyên tường)' },
  { eval: async () => {
    const G = window.__game, I = G.interact, m = window.__dev;
    const d = I.doors.find((x) => x.d.lock === 'canho');
    const before = { open: d?.open ?? null, want: d?.want ?? null, rotY: d?.m.rotation.y ?? null };
    m.getDevSections()[0].items.find((i) => i.id === 'bell_now').run();
    const n0 = G.npcs.fixed.get('canho');
    const start = { x: n0.x, z: n0.z, t: G.time };
    await new Promise((r) => setTimeout(r, 1300));   // cửa damp 9/s nên ~1 giây là mở gần hết
    const after = { open: d?.open ?? null, want: d?.want ?? null, rotY: d?.m.rotation.y ?? null, boxOn: d?.d.box.on ?? null };
    const dd = d.d;
    const cx = dd.x + Math.cos(dd.yaw) * dd.w * 0.5, cz = dd.z + Math.sin(dd.yaw) * dd.w * 0.5;
    const nx = -Math.sin(dd.yaw), nz = Math.cos(dd.yaw);
    // "ra khỏi cửa" = từ phía trong (âm pháp tuyến) sang phía ngoài (dương pháp tuyến), và bám sát ô cửa
    const sideOf = (x, z) => (x - cx) * nx + (z - cz) * nz;
    return { before, after, doorMovedDeg: Math.round(((after.rotY ?? 0) - (before.rotY ?? 0)) * 180 / Math.PI),
      npcVisible: !n0?.hidden, npcOut: !!n0?.bellOut,
      startSide: Math.round(sideOf(start.x, start.z) * 100) / 100,
      nowSide: Math.round(sideOf(n0.x, n0.z) * 100) / 100,
      nowAlongDoor: Math.round(Math.abs((n0.x - cx) * Math.cos(dd.yaw) + (n0.z - cz) * Math.sin(dd.yaw)) * 100) / 100,
      travelled: Math.round(Math.hypot(n0.x - start.x, n0.z - start.z) * 100) / 100 };
  }, wait: 1500 },
  { shot: 'vua2-03-cua-mo.png' },

  { label: '②d tua hết 16 giây hẹn giờ → cửa tự đóng lại' },
  { eval: async () => {
    const G = window.__game, I = G.interact;
    const d = I.doors.find((x) => x.d.lock === 'canho');
    const held = d.bellUntil - G.time;                 // còn bao nhiêu giây nữa cửa tự đóng
    G.time = d.bellUntil + 0.5;                        // máy chạy chậm nên tua thẳng mốc hết giờ
    await new Promise((r) => setTimeout(r, 3500));
    return { holdSeconds: Math.round(held), want: d?.want ?? null, open: Math.round((d?.open ?? 0) * 100) / 100, boxOn: d?.d.box.on ?? null };
  }, wait: 4000 },
  { shot: 'vua2-04-cua-dong-lai.png' },
];
