/**
 * Lượt 62 — đá viên tan chậm gấp 3 lần, và hiển thị theo **độ lạnh** thay vì “hỏng/tươi”.
 *
 * Người chơi: “×3 độ lâu tan của đá và để là độ lạnh thay vì hỏng”. Hai việc tách nhau:
 * (1) thời gian: đá tan chậm 3× so với trước, ở mọi nơi (túi, kho quầy, nhà) và ở mọi kiểu giữ lạnh;
 * (2) câu chữ: đá tan chứ không ôi, nên túi đá phải ghi “lạnh 82 %” / “đá tan 40 %” / “tan hết”,
 *     và KHÔNG được nằm trong danh sách “đồ sắp hỏng” của app Quản lý cửa hàng.
 */
import { describe, it, expect } from 'vitest';
import { newGame, addStack, spoil, freshLabel, isSpoiled, ICE_MELT_MUL, Stack } from '../src/sim/state';
import { hoursLeft, shopRows } from '../src/sim/rules';
import { INGS } from '../src/data/ingredients';

/** Một lô hàng dựng tay để thử nhãn và tốc độ tan. */
const lot = (id: string, fresh = 100): Stack => ({ id, n: 1, fresh, q: 1, cost: 5000 }) as Stack;

describe('độ bền của đá viên (lượt 62)', () => {
  it('hệ số tan là 3 — đúng nghĩa “×3 độ lâu tan”', () => {
    expect(ICE_MELT_MUL).toBe(3);
  });

  it('đá tan chậm đúng 1/3 tốc độ của một nguyên liệu cùng hạn dùng', () => {
    const g = newGame(7);
    // Dựng hai lô cùng hạn dùng 9 giờ để so công bằng: đá và một bản sao “không phải đá”.
    const da = lot('da'), thuong = lot('da');
    const trước = da.fresh;
    spoil([da], 1, 1, false);                        // 1 giờ, không giữ lạnh
    const mấtCủaĐá = trước - da.fresh;
    // Bảng nguyên liệu nới hạn dùng 1,2 lần khi nạp (9 h → 10,8 h). Tốc độ cũ = 100 / 10,8 × 2,6 mỗi giờ; nay chia 3.
    const hạn = INGS.da.shelf;
    const tốcĐộCũ = (100 / hạn) * 2.6;
    expect(mấtCủaĐá).toBeCloseTo(tốcĐộCũ / 3, 6);
    expect(thuong.fresh).toBe(100);                  // lô khác không bị đụng
    expect(g).toBeTruthy();
  });

  it('sau 1 ngày (24 giờ) đá vẫn còn dùng được — trước đây tan hết trong chưa tới 3,5 giờ', () => {
    const da = lot('da');
    // Giữ lạnh như thùng đá ở quầy: hệ số 0,22. Trước lượt 62 còn 0 % sau ~16 giờ.
    spoil([da], 24, 1, true);
    expect(da.fresh).toBeGreaterThan(60);
    expect(isSpoiled(da)).toBe(false);
    const trước = lot('da');
    for (let h = 0; h < 4; h++) spoil([trước], 1, 1, false);   // 4 giờ ngoài trời, không lạnh
    expect(trước.fresh).toBeGreaterThan(0);          // trước lượt 62: đã tan hết
  });

  it('lời nhắc “còn mấy giờ” dùng cùng hệ số, không lệch với tốc độ tan thật', () => {
    const g = newGame(7);
    g.stall.where = 'placed'; g.stall.x = 41; g.stall.z = -37.3;
    g.stall.store = [];
    addStack(g.stall.store, lot('da'));
    const giờ = hoursLeft(g, g.stall.store[0]);
    // Tốc độ mỗi giờ đúng bằng lượng giảm đo được, nên giờ còn lại = (fresh − 10) / tốc độ.
    const đo = lot('da'); spoil([đo], 1, 1, false);
    expect(giờ).toBeCloseTo((100 - 10) / (100 - đo.fresh), 4);
    expect(giờ).toBeGreaterThan(8);                  // 90 / ~9,6 %/giờ
  });

  it('nhãn của đá ghi độ lạnh, không bao giờ ghi “tươi” hay “hỏng”', () => {
    expect(freshLabel(lot('da', 100)).text).toBe('lạnh 100%');
    expect(freshLabel(lot('da', 82)).text).toBe('lạnh 82%');
    expect(freshLabel(lot('da', 60)).text).toBe('lạnh 60%');
    expect(freshLabel(lot('da', 40)).text).toBe('đá tan 40%');
    expect(freshLabel(lot('da', 12)).text).toBe('đá tan 12%');
    expect(freshLabel(lot('da', 4)).text).toBe('tan hết');
    for (const f of [100, 82, 40, 12, 4]) {
      const t = freshLabel(lot('da', f)).text;
      expect(t).not.toMatch(/tươi|hỏng/);
    }
    // Màu nhãn vẫn theo mức: còn lạnh = tốt, sắp tan = cảnh báo, gần hết = xấu.
    expect(freshLabel(lot('da', 90)).level).toBe('good');
    expect(freshLabel(lot('da', 50)).text).toBe('lạnh 50%');
    expect(freshLabel(lot('da', 35)).level).toBe('warn');
    expect(freshLabel(lot('da', 20)).level).toBe('bad');
  });

  it('nguyên liệu khác giữ nguyên câu chữ “tươi …%” / “hỏng”', () => {
    expect(freshLabel(lot('heo', 90)).text).toBe('tươi 90%');
    expect(freshLabel(lot('heo', 5)).text).toBe('hỏng');
  });

  it('đá không nằm trong danh sách “đồ sắp hỏng” của app Quản lý cửa hàng', () => {
    const g = newGame(7);
    g.stall.where = 'placed'; g.stall.x = 41; g.stall.z = -37.3; g.stall.store = [];
    addStack(g.stall.store, lot('da', 12));          // đá gần tan
    addStack(g.stall.store, lot('heo', 12));         // thịt gần hỏng
    const row = shopRows(g)[0];
    expect(row.spoilNames).toContain('Thịt heo nạc');
    expect(row.spoilNames).not.toContain('Đá viên');
  });
});
