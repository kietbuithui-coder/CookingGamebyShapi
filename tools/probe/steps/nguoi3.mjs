// Lượt 15 — góc nhìn thứ ba + tiệm cắt tóc + tiệm thời trang.
import { boot, fresh } from '../lib.mjs';
const OUT = 'fix/';
export default [boot, fresh(9 * 60),

  { label: '① bấm phím V — góc nhìn thứ ba ở gầm cầu' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g; g.cash = 500000;
    const truoc = g0.set.cam3; g0.input.onKey('v');
    g0.player.place(52.5, 96.5, Math.PI * 0.62, -0.03);
    await new Promise((r) => setTimeout(r, 2600));
    const luu = JSON.parse(localStorage.getItem('ganhhang.settings.v1') || '{}');
    return { truoc, sau: g0.set.cam3, daLuu: luu.cam3, thayNhanVat: g0.player.rig.root.visible, kieuToc: g.look.hairStyle };
  }, wait: 1700 },
  { shot: OUT + 'goc_nhin_3' },

  { label: '② tiệm cắt tóc trong chợ (nhìn từ lối đi, ngang tầm mắt)' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, n = g0.npcs.fixed.get('hot_toc');
    const me = { x: -45.5, z: 11.4 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(n.x - me.x, n.z - me.z), -0.02);
    g0.set.cam3 = false;
    await new Promise((r) => setTimeout(r, 900));
    return { ten: n?.name, x: +n?.x?.toFixed(1), z: +n?.z?.toFixed(1) };
  }, wait: 1100 },
  { shot: OUT + 'tien_cat_toc' },

  { label: '③ mở menu cắt tóc' },
  { eval: async () => {
    const g0 = window.__game; g0.acts.talk(g0.npcs.fixed.get('hot_toc'));
    await new Promise((r) => setTimeout(r, 500));
    return { nut: [...document.querySelectorAll('#dlg .btn')].map((b) => b.textContent.replace(/\s+/g, ' ').trim().slice(0, 46)) };
  }, wait: 700 },
  { shot: OUT + 'cat_toc_menu' },

  { label: '④ danh sách 8 kiểu tóc' },
  { eval: async () => {
    [...document.querySelectorAll('#dlg .btn')].find((x) => x.textContent.includes('Cắt kiểu mới'))?.click();
    await new Promise((r) => setTimeout(r, 400));
    return { nut: [...document.querySelectorAll('#dlg .btn')].map((x) => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 30)) };
  }, wait: 700 },
  { shot: OUT + 'cat_toc_kieu' },

  { label: '⑤ uốn xoăn rồi soi ở góc nhìn thứ ba' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, truoc = g.cash;
    [...document.querySelectorAll('#dlg .btn')].find((x) => x.textContent.includes('Uốn xoăn'))?.click();
    await new Promise((r) => setTimeout(r, 900)); g0.ui.closeDialog();
    const me = { x: -45.5, z: 4.4 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(-45.5 - me.x, 8.2 - me.z), -0.05); g0.set.cam3 = true; g0.player.camOn = false;
    await new Promise((r) => setTimeout(r, 2600));
    const p = g0.player;
    // camera quay mặt lại nhìn thẳng vào nhân vật để thấy kiểu tóc mới
    p.view(g0.camera.position.clone().set(-45.5, 1.45, 7.2), g0.camera.position.clone().set(-45.5, 1.12, 4.4), 50);
    p.camK = 1;
    await new Promise((r) => setTimeout(r, 2600));
    return { daTru: truoc - g.cash, kieuToc: g.look.hairStyle, rigKieuToc: p.rig.look?.hairStyle, camDist: +p.camDist.toFixed(2), vis: p.rig.root.visible };
  }, wait: 3000 },
  { shot: OUT + 'cat_toc_xong' },

  { label: '⑥ tiệm thời trang của Cô Ngọc' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, n = g0.npcs.fixed.get('thoi_trang');
    g0.player.view(null); g0.set.cam3 = false;
    const me = { x: -43.0, z: -6.2 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(n.x - me.x, n.z - me.z), -0.02);
    await new Promise((r) => setTimeout(r, 900));
    return { ten: n?.name, x: +n?.x?.toFixed(1), z: +n?.z?.toFixed(1) };
  }, wait: 1100 },
  { shot: OUT + 'tien_thoi_trang' },

  { label: '⑦ mua áo đỏ + quần xanh bò + kính đen' },
  { eval: async () => {
    const g0 = window.__game, g = g0.g, out = [];
    g0.player.view(null); g0.set.cam3 = false;
    const pick = async (label, item) => {
      g0.acts.talk(g0.npcs.fixed.get('thoi_trang')); await new Promise((r) => setTimeout(r, 250));
      const open = async (txt) => { [...document.querySelectorAll('#dlg .btn')].find((x) => x.textContent.includes(txt))?.click(); await new Promise((r) => setTimeout(r, 260)); };
      await open(label); await open(item); await new Promise((r) => setTimeout(r, 300)); g0.ui.closeDialog();
      out.push({ [label]: item, cash: g.cash, look: { shirt: g.look.shirt, pants: g.look.pants, face: g.look.face } });
    };
    await pick('Áo', 'Đỏ đô'); await pick('Quần', 'Xanh bò'); await pick('Kính', 'Kính đen');
    const me = { x: -45.5, z: -3.4 }; g0.world.resolve(me.x, me.z, 0.4, me);
    g0.player.place(me.x, me.z, Math.atan2(-45.5 - me.x, -8.2 - me.z), -0.05); g0.set.cam3 = true; g0.player.camOn = false;
    await new Promise((r) => setTimeout(r, 1600));
    g0.player.view(g0.camera.position.clone().set(-45.5, 1.45, -6.4), g0.camera.position.clone().set(-45.5, 1.1, -3.4), 50);
    g0.player.camK = 1;
    await new Promise((r) => setTimeout(r, 1600));
    return out;
  }, wait: 1600, max: 900 },
  { shot: OUT + 'thoi_trang_xong' },

  { label: '⑧ bản lưu: ngoại hình vào save v11' },
  { eval: () => {
    const g0 = window.__game, g = g0.g, raw = JSON.parse(JSON.stringify(g)), back = window.__S.migrate(raw);
    return { v: back.v, look: { hairStyle: back.look.hairStyle, shirt: back.look.shirt, pants: back.look.pants, face: back.look.face } };
  }, wait: 300 },
];
