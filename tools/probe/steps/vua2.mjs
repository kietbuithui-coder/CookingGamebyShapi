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

  { label: '②b lùi ra xa 4m để nhìn rõ cả cánh cửa' },
  { eval: async () => {
    const G = window.__game, d = G.interact.doors.find((x) => x.d.lock === 'canho').d;
    const px = d.x + d.w / 2 + 2.4, pz = d.z - 3.4;          // đứng chéo để thấy rõ cánh cửa
    G.player.place(px, pz, Math.atan2(d.x + d.w / 2 - px, d.z - pz));
    await new Promise((r) => setTimeout(r, 900));
    return true;
  }, wait: 1100 },
  { shot: 'vua2-02b-cua-truoc-khi-bam.png' },

  { label: '②b bấm chuông → đo góc mở của cánh cửa + chủ nhà có ra ngoài không' },
  { eval: async () => {
    const G = window.__game, I = G.interact, m = window.__dev;
    const d = I.doors.find((x) => x.d.lock === 'canho');
    const before = { open: d?.open ?? null, want: d?.want ?? null, rotY: d?.m.rotation.y ?? null };
    m.getDevSections()[0].items.find((i) => i.id === 'bell_now').run();
    await new Promise((r) => setTimeout(r, 1200));   // cửa damp 9/s nên ~1 giây là mở hết
    const after = { open: d?.open ?? null, want: d?.want ?? null, rotY: d?.m.rotation.y ?? null, boxOn: d?.d.box.on ?? null };
    const npc = G.npcs.fixed.get('canho');
    return { before, after, doorMovedDeg: Math.round(((after.rotY ?? 0) - (before.rotY ?? 0)) * 180 / Math.PI),
      npcVisible: !npc?.hidden, npcOut: !!npc?.bellOut };
  }, wait: 1500 },
  { label: '②b dời góc nhìn sang chéo cánh cửa để thấy nó đang mở' },
  { eval: async () => {
    const G = window.__game, d = G.interact.doors.find((x) => x.d.lock === 'canho').d;
    const px = d.x + d.w / 2 + 2.4, pz = d.z - 3.4;
    G.player.place(px, pz, Math.atan2(d.x + d.w / 2 - px, d.z - pz));
    await new Promise((r) => setTimeout(r, 900));
    return { open: Math.round(G.interact.doors.find((x) => x.d.lock === 'canho').open * 100) / 100 };
  }, wait: 1100 },
  { shot: 'vua2-03-cua-mo.png' },

  { label: '②c tua hết 16 giây hẹn giờ → cửa tự đóng lại' },
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
