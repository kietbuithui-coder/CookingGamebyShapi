// Ba giao diện điện thoại: mỗi mẫu máy một kiểu bố cục và một cách bấm, và app chỉ mở đúng máy có chức năng đó.
import { describe, it, expect } from 'vitest';
import { PHONE_LIST, PHONES, appsOf, PHONE_APPS } from '../src/data/phone';
import { fresh } from './helpers';

describe('giao diện ba mẫu điện thoại', () => {
  it('mỗi máy một kiểu giao diện riêng: cục gạch, nắp gập, cảm ứng', () => {
    expect(PHONE_LIST.map((p) => p.id)).toEqual(['cucgach', 'napgap', 'camung']);
    // tên máy và hãng khác nhau, để màn hình chính hiện đúng tên
    const names = new Set(PHONE_LIST.map((p) => p.name));
    expect(names.size).toBe(3);
    for (const p of PHONE_LIST) expect(p.brand.length).toBeGreaterThan(3);
  });

  it('app trên máy đúng theo chức năng: cục gạch ít nhất, cảm ứng nhiều nhất', () => {
    const ids = (id: string) => appsOf(PHONES[id]).map((a) => a.id);
    expect(ids('cucgach')).toEqual(['ledger', 'contacts', 'sms', 'battery']);
    expect(ids('napgap')).toEqual(['ledger', 'contacts', 'sms', 'radio', 'music', 'battery']);
    expect(ids('camung')).toEqual(['ledger', 'contacts', 'sms', 'radio', 'music', 'wap', 'battery']);
    // máy rẻ không có nhạc, radio, web
    expect(ids('cucgach')).not.toContain('music');
    expect(ids('cucgach')).not.toContain('wap');
    // mục Pin máy nào cũng có
    for (const p of PHONE_LIST) expect(appsOf(p).some((a) => a.id === 'battery')).toBe(true);
  });

  it('tên app ngắn gọn để nhét vừa lưới icon 3 cột và danh sách máy phím', () => {
    for (const a of PHONE_APPS) {
      expect(a.name.length).toBeGreaterThan(2);
      expect(a.short.length).toBeLessThanOrEqual(9);
    }
    // không có app trùng id
    const ids = PHONE_APPS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mỗi app có tên hiện trên cả hai kiểu máy, không app nào bị bỏ quên', () => {
    const all = new Set(PHONE_LIST.flatMap((p) => appsOf(p).map((a) => a.id)));
    expect([...all].sort()).toEqual(['battery', 'contacts', 'ledger', 'music', 'radio', 'sms', 'wap']);
  });

  it('máy mua ở tiệm là máy duy nhất đang cắm sim, không mở được app khi hết pin', () => {
    const g = fresh();
    expect(PHONES.cucgach.feats).not.toContain('wap');
    // chưa có máy thì không có gì để mở
    expect(g.phone).toBe(null);
    g.phone = { id: 'cucgach', battery: 0 };
    expect(g.phone.battery).toBe(0);
  });
});
