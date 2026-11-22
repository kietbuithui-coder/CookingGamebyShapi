// Lượt 56: soi cận mặt Bà Chín Ve Chai (vựa ve chai ở Khu Dân Cư) — chụp góc mặt trước + báo màu da đang dùng.
import { boot, fresh } from '../lib.mjs';
const face = (label, dist, camY, name) => ({ eval: async (label, dist, camY, name) => {
  const g0 = window.__game, g = g0.g, L = await import('/src/world/layout.ts');
  g.min = 9 * 60; g.weather.now = 'nang';
  g0.ui.closeDialog(); g0.mode = 'play';
  const n = g0.npcs.fixed.get('scrap2');
  if (!n) return 'không thấy Bà Chín';
  const x = n.x, z = n.z, yaw = n.yaw;
  const cx = x + Math.sin(yaw) * dist, cz = z + Math.cos(yaw) * dist;
  const headY = n.y + n.rig.headY - 0.28;
  g0.player.place(cx, cz, yaw + Math.PI, -0.05);
  for (const n of g0.npcs.list) g0.ui.unsay(n);   // nhãn hội thoại của NPC hay mọc ngay trên mặt — tắt cho ảnh soi sạch   // đứng thẳng chỗ camera để KHÔNG hiện nhãn tương tác che mặt
  const pos = g0.camera.position.clone().set(cx, camY, cz);
  const look = g0.camera.position.clone().set(x, headY, z);
  g0.player.camTo = { pos, look, fov: 34 };
  g0.ui.$('quest').style.display = 'none'; g0.ui.$('focus').style.display = 'none'; g0.interact.focus = null;
  return { who: n.name, skin: '#' + n.rig.look.skin.toString(16).padStart(6, '0'), face: n.rig.look.face, hat: n.rig.look.hat,
    hairStyle: n.rig.look.hairStyle, hair: '#' + n.rig.look.hair.toString(16).padStart(6, '0'), at: [+x.toFixed(2), +z.toFixed(2)] };
}, args: [label, dist, camY, name], wait: 1400 });
export default [boot, fresh(9 * 60),
  { label: '① cận mặt Bà Chín — nhìn thẳng' },
  face('thang', 1.05, 1.62),
  { shot: 'f56_ba_chin_mat' },
  { label: '② ba phần tư mặt, hơi cao' },
  face('cheo', 1.2, 1.85),
  { shot: 'f56_ba_chin_cheo' },
  { eval: () => { window.__game.player.camTo = null; window.__game.ui.$('quest').style.display = ''; window.__game.ui.$('focus').style.display = ''; return 1; }, quiet: true },
];
