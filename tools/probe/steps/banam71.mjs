import { boot, fresh } from '../lib.mjs';
export default [
  boot, fresh(15*60),
  { eval: () => { const g0 = window.__game; const n = g0.npcs.fixed.get('ba_nam'); const a = g0.world.anchors.v_ba_nam;
    return { cóN: !!n, cóNeo: !!a, tên: n?.name, ở: n ? [+n.x.toFixed(1), +n.z.toFixed(1)] : null, neo: a ? [+a.x.toFixed(1), +a.z.toFixed(1)] : null }; } },
  { eval: () => { const g0 = window.__game, n = g0.npcs.fixed.get('ba_nam'); if (!n) return 'no npc';
      const a = g0.world.anchors.v_ba_nam; g0.player.place(n.x + 0.9, n.z + 0.9, 0); g0.acts.talk(n);
      return { tiêu: document.querySelector('#dlg h3')?.innerText, bài: document.querySelector('#dlg p')?.innerText.slice(0, 200),
        nút: [...(document.querySelector('#dlg')?.querySelectorAll('button') || [])].map((b) => b.innerText.slice(0, 50)) }; } },
  { shot: 'ba-nam' },
];
