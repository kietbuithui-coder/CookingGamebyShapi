// Kiểm tra va chạm xe cộ (nhẹ · trung bình · nặng) với người chơi & NPC, và đánh đấm hất văng.
// Chạy: cd tools/probe && OUT=/tmp/probe/impact node play.mjs steps/impact.mjs
import { boot, fresh } from '../lib.mjs';
const OUT = '';
export default [boot, fresh(10 * 60),
  { label: '① cho xe chạy thẳng vào người chơi & một người đi đường', eval: async () => {
    const g0 = window.__game, G = g0.g, p = g0.player;
    const startHp = G.st.health;
    // tìm 1 xe bất kỳ trong Traffic và đặt trên trục đường gần người chơi nhất
    const T = g0.traffic;
    const r = T.list.find((x) => x.car) || T.list[0];
    if (!r) return { ok: false, reason: 'no_rider' };
    // đặt người chơi & 1 NPC đi bộ ngay phía trước mũi xe 1.2m & 2.2m
    const fx = r.axis === 0 ? r.sign : 0, fz = r.axis === 0 ? 0 : r.sign;
    const rx = r.axis === 0 ? r.pos : r.road + r.lane;
    const rz = r.axis === 0 ? r.road + r.lane : r.pos;
    p.place(rx + fx * 1.4, rz + fz * 1.4, 0, 0);
    const npc = g0.npcs.list.find((n) => n.state === 'walk' && !n.hidden);
    if (npc) { npc.x = rx + fx * 1.5 - fz * 0.35; npc.z = rz + fz * 1.5 + fx * 0.35; npc.vehCd = 0; npc.fallT = 0; }
    await new Promise((res) => setTimeout(res, 750));
    const afterHp = G.st.health;
    const flashVisible = document.getElementById('hitflash')?.style.opacity;
    return {
      ok: afterHp < startHp,
      car: r.car || (r.moto ? 'moto' : 'bike'),
      hpBefore: startHp,
      hpAfter: afterHp,
      stunT: Number(p.stunT.toFixed(2)),
      npcKnocked: npc ? ((npc.vehCd ?? 0) > 0 || (npc.fallT ?? 0) > 0 || Math.hypot(npc.kbx ?? 0, npc.kbz ?? 0) > 0.1) : null,
      flashVisible,
    };
  }, wait: 250 },
  { shot: OUT + 'impact_hit' },

  { label: '② kiểm tra đấm NPC khiến NPC văng lùi lại', eval: async () => {
    const g0 = window.__game, p = g0.player;
    p.stunT = 0; p.fallT = 0; p.hitCd = 0;
    const npc = g0.npcs.list.find((n) => n.state === 'walk' && !n.hidden);
    if (!npc) return { ok: false };
    p.place(npc.x - 1.0, npc.z, Math.PI / 2, 0);
    const nx0 = npc.x;
    g0.acts.punchCd = 0;
    g0.acts.punch();
    await new Promise((res) => setTimeout(res, 350));
    return { moved: Number(Math.hypot(npc.x - nx0, 0).toFixed(2)), hurt: npc.hurt ?? 0 };
  } },
];
