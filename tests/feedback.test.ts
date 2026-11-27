// Góp ý & báo lỗi (lượt 70): chỗ lưu góp ý của người chơi + luật tiền thưởng của hai mini-game mới.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  FB_KEY, FB_MAX, FB_TEXT_MAX, FB_TEXT_MIN, FB_KINDS, addFeedback, editFeedback, removeFeedback,
  clearFeedback, exportFeedback, loadFeedback, checkText, cleanText, makeId, type Feedback,
} from '../src/game/feedback';
import { miaBonus, siteBonus, MIA_CUPS_SHIFT } from '../src/sim/rules';
import { MIA_CUPS, MIA_ZONE, SITE_LOADS, SITE_SHOVELS, SITE_LOAD_SECS, SITE_PUSH_SECS, SITE_FILL_MIN, SITE_FILL_MAX } from '../src/game/anim';

const store: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
  };
});
const ctxIn = { day: 3, min: 9 * 60 + 20, x: -46, z: -6, district: 'Chợ Xóm Chiều' };

describe('góp ý / báo lỗi', () => {
  it('ba loại góp ý, mỗi loại có câu gợi ý đủ dài để người chơi biết ghi gì', () => {
    expect(FB_KINDS.map((k) => k.id)).toEqual(['loi', 'gopy', 'khac']);
    for (const k of FB_KINDS) { expect(k.name.length).toBeGreaterThan(1); expect(k.hint.length).toBeGreaterThan(10); }
  });

  it('chặn chữ quá ngắn nhưng không im lặng: trả về lý do', () => {
    expect(checkText('a')).toMatch(/ít nhất/);
    expect(checkText('   ')).toMatch(/ít nhất/);
    expect(checkText('bấm vào xe mía không ăn')).toBeNull();
  });

  it('cắt gọn chữ: gộp khoảng trắng, chặn độ dài tối đa', () => {
    expect(cleanText('  a   b \n c ')).toBe('a b c');
    expect(cleanText('x'.repeat(FB_TEXT_MAX + 50)).length).toBe(FB_TEXT_MAX);
  });

  it('gửi góp ý thì lưu lại được, đọc lại thấy đúng nội dung + bối cảnh', () => {
    const f = addFeedback([], 'loi', 'Xe nước mía bị kẹt ở cổng chợ', ctxIn)!;
    expect(f).toBeTruthy();
    expect(f.id).toBe('L003-1');
    expect(f.ctx.district).toBe('Chợ Xóm Chiều');
    expect(f.ctx.ver).toMatch(/^Lượt \d+$/);
    const back = loadFeedback();
    expect(back.length).toBe(1);
    expect(back[0].text).toBe('Xe nước mía bị kẹt ở cổng chợ');
  });

  it('góp ý quá ngắn thì KHÔNG lưu (trả null)', () => {
    expect(addFeedback([], 'gopy', 'ngắn', ctxIn)).toBeNull();
    expect(loadFeedback().length).toBe(0);
  });

  it('mã góp ý đọc được bằng mắt: loại + ngày + số thứ tự', () => {
    expect(makeId('loi', 7, 0)).toBe('L007-1');
    expect(makeId('gopy', 70, 4)).toBe('G070-5');
    expect(makeId('khac', 3, 11)).toBe('K003-12');
  });

  it('sửa và xoá được góp ý đã lưu, và ghi dấu đã sửa', () => {
    let list: Feedback[] = [addFeedback([], 'loi', 'Lỗi thứ nhất ở chợ', ctxIn)!];
    list = editFeedback(list, list[0].id, 'Lỗi thứ nhất ở chợ (sửa lại cho rõ)');
    expect(list[0].edited).toBe(true);
    expect(loadFeedback()[0].text).toMatch(/sửa lại/);
    list = removeFeedback(list, list[0].id);
    expect(list.length).toBe(0);
    expect(loadFeedback().length).toBe(0);
  });

  it(`giữ tối đa ${FB_MAX} góp ý, cái mới nhất ở đầu`, () => {
    let list: Feedback[] = [];
    for (let i = 0; i < FB_MAX + 5; i++) list = [addFeedback(list, 'khac', `góp ý số ${i} đủ dài để lưu`, ctxIn)!, ...list].slice(0, FB_MAX);
    expect(loadFeedback().length).toBeLessThanOrEqual(FB_MAX);
    expect(loadFeedback()[0].text).toBe(`góp ý số ${FB_MAX + 4} đủ dài để lưu`);
  });

  it('xuất ra khối chữ có mã, loại, ngày giờ, chỗ đứng và bản dựng để dán gửi', () => {
    const list = [addFeedback([], 'loi', 'Kẹt ở cổng chợ không đi qua được', ctxIn)!];
    const txt = exportFeedback(list);
    expect(txt).toContain('GÓP Ý GAME');
    expect(txt).toContain('L003-1');
    expect(txt).toContain('Báo lỗi');
    expect(txt).toContain('Chợ Xóm Chiều');
    expect(txt).toContain('Kẹt ở cổng chợ');
    expect(exportFeedback([])).toBe('');
  });

  it('kho góp ý hỏng/không có thì trả mảng rỗng chứ không làm sập game', () => {
    store[FB_KEY] = '{{{ hỏng';
    expect(loadFeedback()).toEqual([]);
    store[FB_KEY] = JSON.stringify([{ text: 'thiếu kind' }, { kind: 'loi', text: 'đủ dài để dùng' }]);
    expect(loadFeedback().length).toBe(1);
    clearFeedback();
    expect(loadFeedback()).toEqual([]);
  });

  it(`chặn độ dài tối thiểu ${FB_TEXT_MIN} ký tự thật sự có hiệu lực`, () => {
    expect(cleanText('a'.repeat(FB_TEXT_MIN - 1)).length).toBeLessThan(FB_TEXT_MIN);
    expect(checkText('a'.repeat(FB_TEXT_MIN - 1))).not.toBeNull();
    expect(checkText('a'.repeat(FB_TEXT_MIN))).toBeNull();
  });
});

describe('thưởng khéo tay của hai mini-game (lượt 70)', () => {
  it('ép mía: cả 6 ly đều chuẩn thì được thưởng, tràn hết thì bị trừ', () => {
    expect(MIA_CUPS).toBe(6);
    expect(miaBonus(6, 6)).toBeGreaterThan(0);
    expect(miaBonus(0, 6)).toBeLessThan(0);
    expect(miaBonus(3, 6)).toBe(0);
    expect(miaBonus(6, 6)).toBeGreaterThan(miaBonus(4, 6));
  });

  it('phụ hồ: một ca ba xe, đủ 2/3 xe đầy vừa trở lên mới có thưởng', () => {
    expect(SITE_LOADS).toBe(3);
    expect(SITE_SHOVELS).toBe(5);
    expect(siteBonus(3, 3)).toBeGreaterThan(0);
    expect(siteBonus(2, 3)).toBeGreaterThan(0);
    expect(siteBonus(1, 3)).toBeLessThan(0);
  });

  it('một ca phụ hồ dài 1–2 phút thật: 3 xe × 5 xẻng, mỗi xẻng canh tay vài giây + mỗi xe một nhịp đẩy', () => {
    const secs = SITE_LOADS * SITE_SHOVELS * SITE_LOAD_SECS + SITE_LOADS * SITE_PUSH_SECS;
    expect(secs).toBeGreaterThanOrEqual(60);
    expect(secs).toBeLessThanOrEqual(120);
    // Canh tay phải đủ chậm để bấm bằng mắt: mỗi thang không dưới 2 giây.
    expect(SITE_LOAD_SECS).toBeGreaterThanOrEqual(2);
  });

  it('vùng vàng của hai mini-game nằm giữa thang, không sát hai đầu (bấm là ăn thì vô nghĩa)', () => {
    expect(MIA_ZONE[0]).toBeGreaterThan(0.15);
    expect(MIA_ZONE[1]).toBeLessThan(0.9);
    expect(MIA_ZONE[0]).toBeLessThan(MIA_ZONE[1]);
    expect(SITE_FILL_MIN).toBeGreaterThan(0.4);
    expect(SITE_FILL_MAX).toBeLessThan(0.95);
    expect(SITE_FILL_MIN).toBeLessThan(SITE_FILL_MAX);
    expect(MIA_CUPS_SHIFT).toBe(MIA_CUPS);
  });
});
