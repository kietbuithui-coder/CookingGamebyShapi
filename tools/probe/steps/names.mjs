import { boot, fresh } from '../lib.mjs';
const focus = () => { const f = window.__game.interact.focus; return f ? Object.fromEntries(Object.entries(f).filter(([k, v]) => typeof v === 'string')) : null; };
const dlg = () => { const d = document.querySelector('#dlg'); return d.classList.contains('hide') ? null : { title: d.querySelector('h3').innerText, text: d.querySelector('p').innerText.slice(0, 90), opts: [...d.querySelectorAll('.btn')].map((b) => b.innerText.split('\n')[0]).slice(0, 5) }; };
const toasts = () => (document.querySelector('#toasts') || { innerText: '' }).innerText.replace(/\n+/g, ' | ').slice(0, 300);
export default [boot, fresh(11.5 * 60),
  { label: 'người đứng quầy, chưa quen' },
  { eval: () => { const g0 = window.__game, v = g0.npcs.fixed.get('eatery'); g0.player.place(v.x - 0.4, v.z - 3.0, 0, -0.02); const dx = v.x - g0.player.x, dz = v.z - g0.player.z; g0.player.place(g0.player.x, g0.player.z, Math.atan2(dx, dz), -0.02); return { met: g0.g.met }; }, wait: 2500 },
  { eval: focus },
  { eval: () => { window.__game.interact.trigger(); return 1; }, quiet: true, wait: 900 },
  { eval: dlg }, { eval: toasts },
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; return { met: g0.g.met }; }, wait: 1500, shot: 'nm_fixed_after' },
  { eval: focus },
  { eval: () => { window.__game.interact.trigger(); return 1; }, quiet: true, wait: 900 }, { eval: dlg },
  { eval: () => { const g0 = window.__game; g0.ui.closeDialog(); g0.mode = 'play'; return 1; }, quiet: true },
  { label: 'người đi đường' },
  { eval: () => { const g0 = window.__game; window.__fast(true); return 1; }, quiet: true },
  { waitFor: () => window.__game.npcs.list.filter((n) => n.kind === 'ped' && n.state === 'walk').length >= 6, timeout: 60000 },
  { eval: () => { const g0 = window.__game; window.__fast(false); const peds = g0.npcs.list.filter((n) => n.kind === 'ped' && n.state === 'walk'); const out = []; for (const n of peds.slice(0, 8)) out.push(n.name + ' / ' + n.arch.name + ' → ' + JSON.stringify([n.arch.id])); window.__peds = peds; return out; }, max: 2000 },
];
