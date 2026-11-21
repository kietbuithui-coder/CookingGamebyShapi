// Lượt 55 — bốn việc người chơi nhờ:
//   1. "Trứng - Giò chả Dì Sáu đổi tên thành Trứng - Sữa - Giò Dì Sáu"
//   2. "NPC đi từng đằng sau lưng rồi đi xuyên qua quầy" (bán gánh ở chợ và CV, cả đt lẫn PC)
//   3. "ngủ ở giường nhà nghỉ / trọ bị văng vào 1 khung gian khác và kẹt"
//   4. "vẽ thêm chi tiết một tí cho vòi hoa sen và phòng"
// Dự án không dựng được world 3D trong vitest, nên phần hình học kiểm bằng nội dung tệp nguồn.
import { describe, it, expect } from 'vitest';
import { SHOPS } from '../src/data/shops';
import { INGS } from '../src/data/ingredients';
import { HOUSING } from '../src/data/gear';
import { FIXED_ROLE } from '../src/data/people';
import stallSrc from '../src/game/stall.ts?raw';
import actsSrc from '../src/game/acts.ts?raw';
import placesSrc from '../src/world/places.ts?raw';

describe('sạp Dì Sáu đổi tên thành “Trứng – Sữa – Giò” (lượt 55)', () => {
  it('tên sạp đúng như người chơi đặt, và bán đủ ba thứ trong tên', () => {
    const s = SHOPS.m_trung;
    expect(s.name).toBe('Trứng – Sữa – Giò Dì Sáu');
    // trứng + giò (đã có từ trước) và sữa (mới thêm) — không bán thứ mình không có
    for (const id of ['trung', 'gio', 'suatuoi', 'suadac']) expect(s.items, id).toContain(id);
    for (const id of s.items) expect(INGS[id], id).toBeDefined();
  });

  it('lời chào của Dì Sáu nhắc cả sữa, và chức danh người đứng quầy cũng đổi theo', () => {
    expect(SHOPS.m_trung.say).toContain('sữa');
    expect(FIXED_ROLE.m_trung).toBe('Người bán trứng, sữa, giò chả');
  });
});

describe('khách không đi xuyên thân quầy (lượt 55)', () => {
  it('mọi bậc quầy đều có hộp thân quầy để chặn NPC (trước đây chỉ bậc 5–6 có tường)', () => {
    const m = stallSrc.match(/private counterBox\(\)[^{]*\{([\s\S]*?)\n  \}/);
    expect(m, 'không thấy counterBox()').toBeTruthy();
    const body = m![1];
    // bề ngang theo bậc: gánh/xe 0,95 · sạp 1,4 · quán ăn nhỏ 2,3 · quán có chỗ ngồi 2,9
    expect(body).toMatch(/0\.95/); expect(body).toMatch(/1\.4/); expect(body).toMatch(/2\.3/); expect(body).toMatch(/2\.9/);
    expect(body).toMatch(/z1:\s*0\.62/);
  });

  it('đường vào quầy của khách bậc 1–4 phải vòng qua đầu quầy, không cắt ngang thân quầy', () => {
    const m = stallSrc.match(/safeApproach\(fromX[^)]*\)[^{]*\{([\s\S]*?)\n  \}/);
    expect(m, 'không thấy safeApproach()').toBeTruthy();
    const body = m![1];
    expect(body).toMatch(/if \(s\.tier < 5\)/);                 // bậc thấp cũng phải vòng
    expect(body).toMatch(/b\.hw \+ 0\.85/);                     // đi vòng ngoài mép quầy
    expect(body).toMatch(/b\.z1 \+ 1\.05/);                     // rồi mới ra trước mặt quầy
  });

  it('NPC đứng lọt trong quầy thì bị đẩy ra, và khách đang vào quầy thì được chèn điểm vòng', () => {
    const m = stallSrc.match(/resolveNpcWalls\(n: Npc[^)]*\)[^{]*\{([\s\S]*?)\n    let \[lx, lz\] = this\.worldToLocal/);
    expect(m, 'không thấy nhánh bậc thấp trong resolveNpcWalls()').toBeTruthy();
    const body = m![1];
    expect(body).toMatch(/if \(s\.tier < 5\)/);
    expect(body).toMatch(/this\.onCounter\(/);
    expect(body).toMatch(/b\.hw \+ 0\.85/);                     // chèn waypoint vòng đầu quầy cho khách toStall/actor
  });
});

describe('ngủ ở nhà nghỉ / trọ không bị văng sang gian khác (lượt 55)', () => {
  it('mỏ neo giường nằm giữa nệm, nên phải tìm chỗ đứng trống cạnh giường', () => {
    const m = actsSrc.match(/private bedSpot\([^)]*\)[^{]*\{([\s\S]*?)\n  \}/);
    expect(m, 'không thấy bedSpot()').toBeTruthy();
    expect(m![1]).toMatch(/W\.blocked\(x, z, 0\.36\)/);
  });

  it('sleep() đặt người chơi ở chỗ trống đó, không đặt đúng tâm giường', () => {
    expect(actsSrc).toMatch(/const sp = this\.bedSpot\(a\); ctx\.player\.place\(sp\.x, sp\.z, sp\.yaw/);
  });

  it('tỉnh dậy mà chân còn trong khung giường thì bước ra trước khi trả quyền điều khiển', () => {
    const m = actsSrc.match(/if \(ctx\.world\.blocked\(p0\.x, p0\.z, 0\.32\)\) \{([\s\S]{0,120}?)\}/);
    expect(m, 'không thấy bước ra chỗ trống trong wake()').toBeTruthy();
    expect(m![1]).toContain('this.bedSpot(a)');
  });

  it('cả hai chỗ ngủ có vòi sen vẫn giữ mỏ neo buồng tắm ngay cạnh giường', () => {
    for (const id of ['nhanghi', 'tro']) {
      expect(HOUSING[id].shower, id).toBe(true);
      expect(placesSrc).toContain(`b.anchor('wash_${id}'`);
    }
  });
});

describe('buồng tắm có vòi hoa sen dựng thật (lượt 55)', () => {
  it('có hàm shower() dùng cho cả nhà nghỉ và nhà trọ', () => {
    expect(placesSrc).toMatch(/function shower\(b: Builder/);
    expect(placesSrc).toMatch(/shower\(b, 7\.0, 4\.6, 0, -1, 2\.0\); b\.anchor\('wash_nhanghi'/);
    expect(placesSrc).toMatch(/shower\(b, 3\.7, 5\.3, 0, -1, 2\.0\); b\.anchor\('wash_tro'/);
  });

  it('đủ chi tiết: tường ốp gạch có ron, khay + lỗ thoát, cột sen, tay vạt, đầu sen có lỗ phun, kệ chai, gương, tấm chắn', () => {
    const m = placesSrc.match(/function shower\(b: Builder[\s\S]*?\n\}/);
    expect(m, 'không thấy thân hàm shower()').toBeTruthy();
    const body = m![0];
    expect(body).toContain('đường ron');                        // tường ốp men
    expect(body).toMatch(/lỗ thoát/);                            // khay + nắp thoát nước
    expect(body).toMatch(/cột sen/);
    expect(body).toMatch(/d9463c/);                              // tay gạt đỏ nóng/lạnh
    expect(body).toMatch(/for \(let i = 0; i < 6; i\+\+\)/);      // 6 lỗ phun của đầu sen
    expect(body).toMatch(/b\.collide\(/);                        // tấm chắn kính có va chạm
  });

  it('đầu sen không bị vẽ thành “cái mâm”: bán kính đỉnh nhỏ hơn đáy', () => {
    // mb.cyl nhận bán kính ĐỈNH tuyệt đối ở tham số cuối — 0,82 từng làm cái đĩa sen thành mâm 4 m.
    const m = placesSrc.match(/U\.cyl\(hx, hy, hz, ([\d.]+), [\d.]+, \w+, \d+, ([\d.]+)\)/);
    expect(m, 'không thấy lệnh vẽ đĩa sen').toBeTruthy();
    expect(Number(m![2])).toBeLessThan(Number(m![1]));
    expect(Number(m![2])).toBeLessThan(0.2);
  });
});
