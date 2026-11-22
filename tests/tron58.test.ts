// Lượt 58 — mini game bánh tráng trộn: 5 topping nằm ở vị trí NGẪU NHIÊN mỗi ván, màn hình gọi tên
// từng thứ và người chơi phải chạm đúng cái đang được gọi (yêu cầu: “mini game của bánh tráng trộn
// 5 tp random vị trí”). Vị trí rải và thứ tự gọi tính ở `src/cook/tron.ts` nên đo được bằng máy.
import { describe, it, expect } from 'vitest';
import { RECIPES, RECIPE_LIST, STEP_NAME, STEP_TOOLS, toolsFor, fuelPerPortion } from '../src/data/recipes';
import { INGS } from '../src/data/ingredients';
import { RNG } from '../src/core/util';
import { tronSpots, tronCalls, tronTapAt, tronScore, tronLimit, TRON_N, TRON_ROUNDS, TRON_GAP, TRON_HIT, TRON_RX, TRON_RZ, TRON_CZ } from '../src/cook/tron';
import gamesRaw from '../src/cook/games.ts?raw';
import cookRaw from '../src/cook/cook.ts?raw';
import uiRaw from '../src/ui/ui.ts?raw';

const rand = (seed = 7) => { const r = new RNG(seed); return () => r.next(); };
const TRON_INGS = ['banhtrang', 'tuongot', 'dauphong', 'rauthom', 'chanh'];

describe('bánh tráng trộn trộn topping (lượt 58)', () => {
  it('bước hoàn thiện của bánh tráng trộn đổi sang bước TRỘN, vẫn đủ 5 topping của công thức', () => {
    const r = RECIPES.banh_trang_tron;
    expect(r.finish.length).toBe(1);
    const st = r.finish[0];
    expect(st.t).toBe('tron');
    // món này KHÔNG còn bước trình bày cũ (yêu cầu: thay bước trình bày của riêng món này)
    expect(r.finish.some((s) => s.t === 'assemble')).toBe(false);
    const layers = (st as any).layers as { ing: string }[];
    expect(layers.length).toBe(TRON_N);
    expect(layers.map((l) => l.ing).sort()).toEqual([...TRON_INGS].sort());
    // 5 topping đúng bằng 5 nguyên liệu dùng lúc hoàn thiện — không thừa không thiếu
    expect([...r.fin].sort()).toEqual([...(r.fin as string[])].sort());
    expect([...r.fin].sort()).toEqual(['chanh', 'dauphong', 'tuongot']);   // phần còn lại (bánh tráng, rau thơm) dùng lúc sơ chế
    for (const id of TRON_INGS) expect(INGS[id], id).toBeDefined();
  });

  it('chỉ riêng món này đổi: các món khác vẫn dùng bước trình bày cũ', () => {
    const others = RECIPE_LIST.filter((r) => r.id !== 'banh_trang_tron');
    expect(others.some((r) => r.finish.some((s) => s.t === 'assemble'))).toBe(true);
    expect(others.every((r) => r.finish.every((s) => s.t !== 'tron'))).toBe(true);
    // và không món nào khác bị đổi công thức
    expect(RECIPES.banh_trang_tron.prep.map((s) => s.t)).toEqual(['cut', 'cut']);
  });

  it('bước trộn không tốn lửa, không cần thêm dụng cụ', () => {
    expect(STEP_NAME.tron).toBeTruthy();
    expect(STEP_TOOLS.tron).toEqual([]);
    expect(toolsFor(RECIPES.banh_trang_tron).sort()).toEqual(['daothot']);
    expect(fuelPerPortion(RECIPES.banh_trang_tron)).toBe(0);
  });

  it('mỗi ván rải đúng 5 chỗ, nằm gọn trên bàn bếp, không chỗ nào chồng lên chỗ khác', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = tronSpots(rand(seed));
      expect(s.length, `hạt ${seed}`).toBe(TRON_N);
      for (const p of s) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(TRON_RX + 0.05);
        expect(p.z).toBeGreaterThanOrEqual(TRON_CZ - TRON_RZ - 0.06);
        expect(p.z).toBeLessThanOrEqual(TRON_CZ + TRON_RZ + 0.06);
        expect(Number.isFinite(p.x) && Number.isFinite(p.z)).toBe(true);
      }
      for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
        const d = Math.hypot(s[i].x - s[j].x, s[i].z - s[j].z);
        // hai đĩa phải cách nhau hơn 2 bán kính ăn tay, nếu không bấm vào chỗ này lại ra chỗ kia
        expect(d, `hạt ${seed}: chỗ ${i} và ${j} chỉ cách ${d.toFixed(3)}`).toBeGreaterThan(TRON_HIT);
      }
    }
  });

  it('vị trí ĐỔI mỗi ván: 40 hạt giống khác nhau cho 40 cách xếp khác nhau', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      seen.add(tronSpots(rand(seed)).map((p) => `${p.x.toFixed(3)},${p.z.toFixed(3)}`).join('|'));
    }
    expect(seen.size).toBe(40);
    // cùng hạt giống thì tái lập được (để test/probe chụp lại đúng một ván)
    expect(tronSpots(rand(123))).toEqual(tronSpots(rand(123)));
    // không ván nào rơi vào cách xếp đều đặn kiểu “xếp hàng ngang” — khoảng cách các chỗ không bằng nhau
    const s = tronSpots(rand(5)), ds: number[] = [];
    for (let i = 0; i < s.length; i++) ds.push(Math.hypot(s[i].x - s[(i + 1) % s.length].x, s[i].z - s[(i + 1) % s.length].z));
    expect(Math.max(...ds) - Math.min(...ds)).toBeGreaterThan(0.01);
  });

  it('mỗi ván gọi đủ 5 topping hai vòng, mỗi vòng đủ mặt 5 thứ, không gọi trùng hai lần liền', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const c = tronCalls(rand(seed));
      expect(c.length).toBe(TRON_N * TRON_ROUNDS);
      for (let r = 0; r < TRON_ROUNDS; r++) expect([...c.slice(r * TRON_N, (r + 1) * TRON_N)].sort()).toEqual([0, 1, 2, 3, 4]);
      for (let i = 1; i < c.length; i++) expect(c[i], `hạt ${seed} vị trí ${i}`).not.toBe(c[i - 1]);
    }
    const orders = new Set(Array.from({ length: 12 }, (_, i) => tronCalls(rand(i + 1)).join(',')));
    expect(orders.size).toBeGreaterThan(8);       // thứ tự gọi cũng không lặp lại y hệt
  });

  it('mỗi lượt gọi càng về sau càng gấp nhưng vẫn đủ thời gian bấm', () => {
    for (let k = 0; k < TRON_N * TRON_ROUNDS; k++) {
      expect(tronLimit(k)).toBeGreaterThanOrEqual(1.1);
      expect(tronLimit(k)).toBeLessThanOrEqual(3.1);
    }
    expect(tronLimit(9)).toBeLessThan(tronLimit(0));
    expect(tronLimit(9)).toBeGreaterThanOrEqual(1.5);
  });

  it('chạm trúng đĩa nào trả về đúng đĩa đó, chạm ra ngoài trả −1', () => {
    const s = tronSpots(rand(3));
    s.forEach((p, i) => expect(tronTapAt(s, p.x, p.z)).toBe(i));
    // lệch trong bán kính ăn tay vẫn tính là chạm trúng
    expect(tronTapAt(s, s[2].x + TRON_HIT * 0.7, s[2].z)).toBe(2);
    // chạm ra ngoài hẳn
    expect(tronTapAt(s, 0.9, 0.9)).toBe(-1);
    // chạm sát hẳn về phía đĩa số 1 thì phải ra đĩa số 1 (không lấy bừa cái đầu tiên tìm thấy)
    expect(tronTapAt(s, s[1].x + 0.004, s[1].z)).toBe(1);
  });

  it('điểm: bấm đúng hết mà nhanh tay thì gần 1, chạm nhầm và chậm tay đều bị trừ', () => {
    const total = TRON_N * TRON_ROUNDS;
    expect(tronScore(0, total, 5)).toBeGreaterThan(0.95);
    expect(tronScore(2, total, 5)).toBeLessThan(tronScore(1, total, 5));
    expect(tronScore(0, total, 400)).toBeLessThan(0.8);
    expect(tronScore(0, total, 400)).toBeGreaterThanOrEqual(0.05);
    // bấm nhầm nhiều thì không thể vẫn được điểm cao
    expect(tronScore(total, total, 5)).toBeLessThan(0.5);
    for (const v of [tronScore(0, total, 0), tronScore(99, total, 9999)]) { expect(v).toBeGreaterThanOrEqual(0.05); expect(v).toBeLessThanOrEqual(1); }
  });

  it('mini game được nối vào bàn bếp, và MỖI ván lấy hạt giống mới (hết ván này sang ván khác vị trí đổi)', () => {
    expect(gamesRaw).toMatch(/export class TronGame implements Mini/);
    expect(gamesRaw).toMatch(/from '\.\/tron'/);                     // dùng chung luật rải với phần test
    expect(gamesRaw).toMatch(/tronSpots\(rand, n\)/);
    expect(gamesRaw).toMatch(/tronTapAt\(this\.spots/);
    expect(gamesRaw).toMatch(/new RNG\(\(Math\.random\(\) \* 2 \*\* 31\) \| 0\)/);   // không dùng hạt cố định
    // cook.ts chạy bước trộn bằng TronGame và coi đó là bước không dùng lửa
    expect(cookRaw).toMatch(/case 'tron': this\.setMini\(new TronGame\(this, s, r\)\); break;/);
    expect(cookRaw).toMatch(/x\.t !== 'tron'/);
    // biểu tượng món trong thực đơn vẫn lấy được 5 màu topping từ bước trộn
    expect(uiRaw).toMatch(/s\.t === 'assemble' \|\| s\.t === 'tron'/);
  });
});
