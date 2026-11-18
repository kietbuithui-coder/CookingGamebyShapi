// LƯỢT 32 — menu ẩn của lượt 31 + khách lựa hàng trong tiệm nhỏ + người đi đường nhận ra người chơi.
import { boot, fresh } from '../lib.mjs';
export default [boot, fresh(9 * 60),
  { eval: async () => { const b = document.getElementById('rotok'); if (b) { b.click(); await new Promise((r) => setTimeout(r, 250)); } return 1; } },

  { label: '① menu ẩn: nhóm "Mới nhất" của lượt 31' },
  { eval: async () => {
      window.__game.ui.closePanel();
      window.__game.ui.panel('settings');
      await new Promise((r) => setTimeout(r, 300));
      // menu ẩn mở bằng cách bấm 7 lần vào chữ "Cài đặt"
      const hit = [...document.querySelectorAll('#modal *')].find((e) => e.textContent?.trim() === 'Cài đặt' && e.children.length === 0);
      for (let i = 0; i < 8; i++) { hit?.click(); await new Promise((r) => setTimeout(r, 40)); }
      await new Promise((r) => setTimeout(r, 400));
      const titles = [...document.querySelectorAll('#modal h4, #modal .devsec')].map((e) => e.textContent.trim().slice(0, 60));
      const btns = [...document.querySelectorAll('#modal button')].map((b) => b.textContent.trim());
      return { nhóm: titles.slice(0, 4), cóNút: btns.filter((t) => /dáng|râu|tạp dề|câu riêng|ca/.test(t)).slice(0, 6) };
    }, wait: 600 },
  { shot: 'p32-01-menu-an.png' },

  { label: '② khách lựa hàng: vào tạp hoá, đi dọc kệ rồi ra quầy trả tiền' },
  { eval: async () => { window.__game.ui.closePanel(); await new Promise((r) => setTimeout(r, 300)); return 1; }, wait: 400 },
  { shot: 'p32-02-tiem.png' },
  { eval: async () => {
      const g = window.__game.g, W = window.__game.world, P = window.__game.player;
      const a = W.anchors.v_kiosk;
      g.min = 9 * 60;
      // đứng ngay cửa tiệm rồi cho một khách vào, chờ họ đi tới kệ thứ hai mới chụp
      P.place(a.x, a.z + 1.6, Math.PI);
      window.__game.browse.cd = 0; window.__game.browse.t = 0;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 300));
        const b = window.__game.browse.list[0];
        if (b && b.step >= 1) break;
      }
      const b = window.__game.browse.list[0], n = b?.n;
      if (!n) return { lỗi: 'khách chưa vào' };
      // đứng ngay lối đi giữa hai dãy kệ, nhìn thẳng về phía khách
      const ax = n.x, az = n.z + 2.4;
      P.place(ax, az, 0);
      window.__cam(null);
      await new Promise((r) => setTimeout(r, 500));
      window.__cam(ax, P.y + 1.6, az, n.x, n.y + 0.95, n.z);
      await new Promise((r) => setTimeout(r, 700));
      return { sốKhách: window.__game.browse.list.length, tiệm: b.shop, món: b.pick, bước: b.step,
        vịTrí: [+n.x.toFixed(1), +n.z.toFixed(1)], ẩn: !!n.hidden, hiện: n.rig.root.visible,
        ngườiChơi: [+P.x.toFixed(1), +P.z.toFixed(1)] };
    }, wait: 1000 },
  { shot: 'p32-03-khach-lua-hang.png' },

  { label: '③ bấm nói chuyện với khách đang lựa hàng' },
  { eval: async () => {
      const B = window.__game.browse, list = B.list, n = list[0]?.n;
      if (!n) return { lỗi: 'không có khách trong tiệm' };
      // đứng sát khách để họ nhờ lấy giùm món trên kệ cao (đúng như lúc chơi thật)
      window.__game.player.place(n.x + 1.1, n.z + 0.4, 0);
      if (n.data) delete n.data.askedDay;
      const ask = B.askNear();
      window.__game.acts.talk(n);
      await new Promise((r) => setTimeout(r, 400));
      const dlg = document.querySelector('#dlg');
      return { cóNhờ: !!ask, lờiNhờ: ask?.line ?? null, đangMở: !dlg?.classList.contains('hide'), chữ: dlg?.querySelector('.who')?.textContent ?? '',
        lựaChọn: [...(dlg?.querySelectorAll('.btn') ?? [])].map((b) => b.textContent.trim()).slice(0, 3) };
    }, wait: 700 },
  { shot: 'p32-04-noi-chuyen.png' },

  { label: '④ người đi đường đổi giọng khi người chơi vừa giàu / bị công an để ý' },
  { eval: async () => {
      const G = window.__life.greetKind, base = { hour: 12, rain: 0, weather: 'nang', rep: 30, met: true };
      return {
        quenMặt: G({ ...base }),
        vừaGiàu: G({ ...base, cash: 9000000 }),
        đangTúng: G({ ...base, met: false, cash: 1200 }),
        bịCôngAnĐểÝ: G({ ...base, wanted: 60 }),
      };
    }, wait: 200 },
];
