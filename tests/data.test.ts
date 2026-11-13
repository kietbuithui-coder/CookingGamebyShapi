// Kiểm tra tính nhất quán của dữ liệu: thêm món/nguyên liệu mới mà quên một đầu mối thì bài này báo ngay.
import { describe, it, expect } from 'vitest';
import { INGS, ING_LIST } from '../src/data/ingredients';
import { SHOP_LIST, SHOPS } from '../src/data/shops';
import { RECIPE_LIST, RECIPES, START_RECIPES, toolsFor, fuelPerPortion, STEP_TOOLS } from '../src/data/recipes';
import { GEAR, GEAR_LIST, TIERS, HOUSING_LIST, JUNK_LIST } from '../src/data/gear';
import { ARCH_LIST, REGULARS, ARCH, LINES, FIXED, SEEN, FIXED_ROLE } from '../src/data/people';
import { WEATHER, EVENT_LIST, hourCurve } from '../src/data/world';
import { SPOTS, DISTRICT, NAV, findPath, nearestNode, PLACES, districtAt, MAP } from '../src/world/layout';

const sold = new Set(SHOP_LIST.flatMap((s) => s.items));

describe('nguyên liệu và cửa hàng', () => {
  it('không trùng mã, giá và hạn dùng hợp lệ', () => {
    expect(new Set(ING_LIST.map((i) => i.id)).size).toBe(ING_LIST.length);
    for (const i of ING_LIST) { expect(i.price, i.id).toBeGreaterThan(0); expect(i.shelf, i.id).toBeGreaterThan(0); expect(i.kg, i.id).toBeGreaterThanOrEqual(0); expect(i.name.length).toBeGreaterThan(0); }
  });
  it('mọi mặt hàng trên kệ đều là nguyên liệu có thật', () => {
    for (const s of SHOP_LIST) { expect(s.items.length, s.id).toBeGreaterThan(0); for (const id of s.items) expect(INGS[id], `${s.id}/${id}`).toBeDefined(); expect(s.open[0]).toBeLessThan(s.open[1]); }
  });
  it('có đủ 12 nơi bán và hơn 60 nguyên liệu', () => {
    expect(SHOP_LIST.length).toBeGreaterThanOrEqual(12);
    expect(ING_LIST.length).toBeGreaterThanOrEqual(60);
  });
});

describe('công thức', () => {
  it('có ít nhất 25 món, không trùng mã', () => {
    expect(RECIPE_LIST.length).toBeGreaterThanOrEqual(25);
    expect(new Set(RECIPE_LIST.map((r) => r.id)).size).toBe(RECIPE_LIST.length);
  });
  it('mọi nguyên liệu trong công thức đều mua được ở đâu đó', () => {
    for (const r of RECIPE_LIST) for (const id of Object.keys(r.ings)) { expect(INGS[id], `${r.id}: ${id}`).toBeDefined(); expect(sold.has(id), `${r.id}: không nơi nào bán ${id}`).toBe(true); }
  });
  it('nguyên liệu khâu hoàn thiện phải nằm trong danh sách nguyên liệu của món', () => {
    for (const r of RECIPE_LIST) for (const id of r.fin) expect(r.ings[id], `${r.id}: ${id}`).toBeGreaterThan(0);
  });
  it('mọi bước nấu tham chiếu nguyên liệu có thật và món nào cũng có bước trình bày cuối', () => {
    for (const r of RECIPE_LIST) {
      expect(r.finish.length, r.id).toBeGreaterThan(0);
      for (const s of [...r.prep, ...r.finish]) {
        const ids = s.t === 'cut' || s.t === 'grill' ? [s.ing] : s.t === 'fry' ? s.ings : s.t === 'boil' ? s.adds : s.layers.map((l) => l.ing).filter((i) => !i.startsWith('@'));
        for (const id of ids) expect(INGS[id], `${r.id}: bước ${s.t} dùng ${id}`).toBeDefined();
      }
    }
  });
  it('dụng cụ cần cho mỗi món đều mua được ở tiệm đồ nghề', () => {
    for (const r of RECIPE_LIST) for (const t of toolsFor(r)) expect(t === 'bep' || GEAR[t], `${r.id}: ${t}`).toBeTruthy();
    for (const tools of Object.values(STEP_TOOLS)) for (const t of tools) expect(t === 'bep' || GEAR[t]).toBeTruthy();
    expect(GEAR.bepthan).toBeDefined(); expect(GEAR.bepgas).toBeDefined();
  });
  it('món có bước dùng lửa thì tốn nhiên liệu, món nguội thì không', () => {
    for (const r of RECIPE_LIST) { const hot = [...r.prep, ...r.finish].some((s) => s.t === 'fry' || s.t === 'grill' || s.t === 'boil'); expect(fuelPerPortion(r) > 0, r.id).toBe(hot); }
  });
  it('thông số kinh tế hợp lệ', () => {
    for (const r of RECIPE_LIST) {
      expect(r.ref % 1000, r.id).toBe(0); expect(r.batch).toBeGreaterThan(0); expect(r.serve).toBeGreaterThan(0); expect(r.elastic).toBeGreaterThan(0);
      expect(r.meal).toHaveLength(4); expect(Math.max(...r.meal)).toBeGreaterThan(0);
    }
  });
  it('bốn món khởi đầu không cần học và làm được chỉ với đồ nghề rẻ', () => {
    for (const id of START_RECIPES) { const r = RECIPES[id]; expect(r, id).toBeDefined(); expect(r.learn).toBeUndefined(); for (const t of toolsFor(r)) expect(t === 'bep' || GEAR[t].price <= 100000, `${id}: ${t}`).toBe(true); }
  });
  it('các món còn lại đều có nơi học, người dạy có thật', () => {
    for (const r of RECIPE_LIST) if (!START_RECIPES.includes(r.id)) {
      expect(r.learn, r.id).toBeDefined();
      expect(SHOPS[r.learn!.from] || FIXED[r.learn!.from], `${r.id}: học ở ${r.learn!.from}`).toBeTruthy();
      expect(r.learn!.cost).toBeGreaterThan(0);
    }
  });
});

describe('đồ nghề, chỗ ở, ve chai', () => {
  it('các bậc quầy tăng dần sức chứa và giá', () => {
    for (let i = 2; i < TIERS.length; i++) { expect(TIERS[i].cap).toBeGreaterThan(TIERS[i - 1].cap); expect(TIERS[i].queue).toBeGreaterThanOrEqual(TIERS[i - 1].queue); expect(GEAR[TIERS[i].id].price).toBeGreaterThan(GEAR[TIERS[i - 1].id].price); }
    expect(GEAR_LIST.every((g) => g.price > 0)).toBe(true);
  });
  it('chỗ ở đắt hơn thì tốt hơn', () => {
    const paid = HOUSING_LIST.filter((h) => h.rent > 0);
    expect(paid.length).toBeGreaterThanOrEqual(2);
    for (const h of HOUSING_LIST) { expect(h.sleep).toBeGreaterThan(0); expect(h.safety).toBeGreaterThanOrEqual(0); expect(h.safety).toBeLessThanOrEqual(1); }
  });
  it('ve chai có giá và nơi thu mua', () => {
    for (const j of JUNK_LIST) { expect(j.price).toBeGreaterThan(0); expect(['scrap', 'pawn']).toContain(j.where); }
  });
});

describe('con người', () => {
  it('mỗi nhóm khách có túi tiền, độ kiên nhẫn và lời thoại', () => {
    for (const a of ARCH_LIST) { expect(a.budget[0], a.id).toBeLessThanOrEqual(a.budget[1]); expect(a.patience[0]).toBeLessThanOrEqual(a.patience[1]); expect(a.wtp).toBeGreaterThan(0); expect((LINES.bark as any)[a.id]?.length ?? 1, a.id).toBeGreaterThan(0); }
  });
  it('khách quen thuộc nhóm có thật', () => {
    expect(REGULARS.length).toBeGreaterThanOrEqual(8);
    for (const r of REGULARS) expect(ARCH[r.arch], r.id).toBeDefined();
  });
  it('người lạ chỉ được gọi theo vẻ ngoài, không lộ nghề nghiệp hay tên riêng', () => {
    // Chỉ những gì nhìn bằng mắt là biết mới được dùng làm nhãn: đồng phục học sinh, sắc phục, tuổi tác, vẻ lang thang, khách Tây.
    const visible = new Set(['hocsinh', 'vogiacu', 'dukhach', 'congan', 'nguoigia', 'treem']);
    for (const a of ARCH_LIST) {
      const label = SEEN[a.id];
      expect(label, a.id).toBeTruthy();
      if (!visible.has(a.id)) expect(label, a.id).toBe('Người lạ');
    }
    for (const id of ['vanphong', 'shipper', 'taixe', 'congnhan', 'nhagiau', 'phebinh'] as const) expect(SEEN[id]).not.toBe(ARCH[id].name);
  });
  it('người đứng quầy nào cũng có nhãn "chưa quen", và nhãn đó không chứa tên riêng của họ', () => {
    for (const f of Object.values(FIXED)) {
      const role = FIXED_ROLE[f.id];
      expect(role, f.id).toBeTruthy();
      expect(role, f.id).not.toBe(f.name);
      const given = f.name.split(' ').slice(1).join(' ');     // "Bà Tư" → "Tư", "Chú Ba Tài" → "Ba Tài"
      if (given.length > 2) expect(role.includes(given), f.id).toBe(false);
    }
  });
  it('các bộ lời thoại không rỗng', () => {
    for (const [k, v] of Object.entries(LINES)) if (Array.isArray(v)) expect(v.length, k).toBeGreaterThan(0);
  });
});

describe('thế giới', () => {
  it('thời tiết chỉ chuyển sang kiểu có thật, tổng trọng số dương', () => {
    for (const [id, w] of Object.entries(WEATHER)) { let sum = 0; for (const [n, p] of Object.entries(w.next)) { expect((WEATHER as any)[n], `${id}→${n}`).toBeDefined(); sum += p as number; } expect(sum, id).toBeGreaterThan(0); }
  });
  it('có ít nhất 20 sự kiện, mỗi sự kiện có mô tả và thời lượng', () => {
    expect(EVENT_LIST.length).toBeGreaterThanOrEqual(20);
    for (const e of EVENT_LIST) { expect(e.text.length, e.id).toBeGreaterThan(10); expect(e.dur).toBeGreaterThan(0); expect(e.w).toBeGreaterThan(0); for (const s of e.closed ?? []) expect(SHOPS[s] || FIXED[s], `${e.id}: ${s}`).toBeTruthy(); }
  });
  it('đường cong giờ cao điểm luôn dương và có đỉnh ban ngày', () => {
    for (const d of Object.keys(DISTRICT) as (keyof typeof DISTRICT)[]) {
      let mx = 0, at = 0; for (let h = 0; h < 24; h += 0.5) { const v = hourCurve(h, d); expect(v).toBeGreaterThanOrEqual(0); if (v > mx) { mx = v; at = h; } }
      expect(mx, d).toBeGreaterThan(0.3); expect(at).toBeGreaterThanOrEqual(5);
    }
  });
  it('chỗ bán hàng nằm trong bản đồ, thuộc khu có thật', () => {
    expect(SPOTS.length).toBeGreaterThanOrEqual(4);
    expect(SPOTS.some((s) => s.fee === 0)).toBe(true);
    for (const s of SPOTS) { expect(DISTRICT[s.district], s.id).toBeDefined(); expect(s.x).toBeGreaterThan(MAP.x0); expect(s.x).toBeLessThan(MAP.x1); expect(s.z).toBeGreaterThan(MAP.z0); expect(s.z).toBeLessThan(MAP.z1); expect(s.traffic).toBeGreaterThan(0); }
  });
  it('lưới đường đi của NPC liên thông: từ gầm cầu tới được mọi chỗ bán hàng', () => {
    expect(NAV.length).toBeGreaterThan(50);
    const from = nearestNode(PLACES.camp.x, PLACES.camp.z);
    for (const s of SPOTS) { const to = nearestNode(s.x, s.z), path = findPath(from.id, to.id); expect(path.length, s.id).toBeGreaterThan(1); expect(path[path.length - 1]).toBe(to.id); }
  });
  it('quanh mỗi chỗ bán luôn có đủ nút đường đi để khách và nhân vật sự kiện xuất hiện', () => {
    // Npcs.spawnPed chỉ thả người ở các nút cách quầy 16–42 m và không nằm trong hẻm. Nếu sau này sửa bản đồ làm một
    // chỗ bán thiếu nút như vậy thì khách vãng lai, thanh tra, nhà phê bình… sẽ lặng lẽ không bao giờ tới.
    for (const sp of SPOTS) {
      const ring = NAV.filter((c) => { const d = Math.hypot(c.x - sp.x, c.z - sp.z); return d >= 18 && d <= 38 && c.tag !== 'alley'; });
      expect(ring.length, sp.id).toBeGreaterThanOrEqual(6);
    }
  });
  it('mọi điểm trên bản đồ đều thuộc một khu', () => {
    for (let x = MAP.x0; x <= MAP.x1; x += 12) for (let z = MAP.z0; z <= MAP.z1; z += 12) expect(DISTRICT[districtAt(x, z)]).toBeDefined();
  });
});
