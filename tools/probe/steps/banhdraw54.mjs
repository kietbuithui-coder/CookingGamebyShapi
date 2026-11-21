// Hình 3D của ba loại bánh lượt 54 (bánh mì que, bánh tiêu, bánh su kem): soi cận cảnh từng loại
// đặt trên bàn trống giữa trời, cho thấy rõ hình dáng chứ không bị quầy che.
import * as THREE from 'three';
import { boot, fresh } from '../lib.mjs';
/** Đặt một chiếc bánh (hình thật của nguyên liệu) lên bàn và đưa camera soi cận cảnh. */
const showCake = (id, dist = 0.55, tilt = 0.5, rot = 0.6) => ({ eval: async (id, dist, tilt, rot) => {
  const g0 = window.__game;
  if (!window.__bakeProbe) {
    const mod = await import('/src/gfx/props.ts');
    window.__bakeProbe = { mod, list: [] };
  }
  const { mod, list } = window.__bakeProbe;
  list.forEach((m) => g0.scene.remove(m)); list.length = 0;
  // Đặt chiếc bánh ngay trước mặt nhân vật (y = 1,25 m, ngang tầm mắt) rồi cho camera chĩa vào nó.
  // Dùng `player.camTo` — cơ chế camera cố định sẵn có của game; tự đặt camera thì `player.update()`
  // ghi đè lại mỗi khung hình nên ảnh chụp ra toàn phố.
  const p = g0.player, bx = p.x + Math.sin(p.yaw) * 1.2, bz = p.z + Math.cos(p.yaw) * 1.2;
  const mesh = mod.ingMesh(id, 3);                 // phóng to cho dễ soi (bánh thật chỉ ~4 cm)
  mesh.position.set(bx, 1.25, bz); g0.scene.add(mesh); list.push(mesh);
  const cx = bx + Math.cos(rot) * dist, cz = bz + Math.sin(rot) * dist;
  p.camTo = {
    pos: g0.camera.position.clone().set(cx, 1.25 + Math.sin(tilt) * dist, cz),
    look: g0.camera.position.clone().set(bx, 1.25, bz), fov: 40,
  };
  return { id, at: [+bx.toFixed(2), +bz.toFixed(2)], tris: mesh.geometry.index ? mesh.geometry.index.count / 3 : 0 };
}, args: [id, dist, tilt, rot], wait: 700 });
export default [boot, fresh(9 * 60),
  { eval: () => { const g0 = window.__game; g0.set.cam3 = false; return 1; }, quiet: true },
  { eval: () => { const g0 = window.__game; g0.mode = 'play'; g0.ui.$('quest').style.display = 'none'; g0.player.rig.root.visible = false; return 1; }, quiet: true },
  { label: '① bánh mì que pa-tê — ổ dài, nhỏ, thon hai đầu, có giấy gói' },
  showCake('banhmique', 0.8, 0.5, 0.6), { shot: 'banhdraw_mique' },
  showCake('banhmique', 0.8, 0.95, 1.9), { shot: 'banhdraw_mique_top' },
  { label: '② bánh tiêu — đĩa tròn dẹt phồng, rắc mè trắng' },
  showCake('banhtieu', 0.78, 0.55, 0.6), { shot: 'banhdraw_tieu' },
  { label: '③ bánh su kem — vỏ choux nâu, kem trắng phía trên' },
  showCake('banhsu', 0.95, 0.42, 0.6), { shot: 'banhdraw_su' },
  { label: '④ đặt cạnh nhau để so hình dáng (nhỏ → lớn)' },
  { eval: async () => {
    const g0 = window.__game, { mod, list } = window.__bakeProbe, p = g0.player;
    list.forEach((m) => g0.scene.remove(m)); list.length = 0;
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    // hàng ngang: bánh mì que · bánh tiêu · bánh su kem · bánh bông lan · bánh bao · bánh mì ổ
    const ids = ['banhmique', 'banhtieu', 'banhsu', 'banhbonglan', 'banhbao', 'banhmi'];
    const bx = p.x + fx * 1.5, bz = p.z + fz * 1.5;
    ids.forEach((id, i) => {
      const o = (i - (ids.length - 1) / 2) * 0.5;
      const m = mod.ingMesh(id, 2.4); m.position.set(bx + rx * o, 1.25, bz + rz * o); g0.scene.add(m); list.push(m);
    });
    p.camTo = {
      pos: g0.camera.position.clone().set(bx - fx * 1.9, 1.85, bz - fz * 1.9),
      look: g0.camera.position.clone().set(bx, 1.22, bz), fov: 40,
    };
    return list.length;
  }, wait: 900 },
  { shot: 'banhdraw_lineup' },
];
