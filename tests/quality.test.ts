// Canh các mức đồ hoạ: mức mặc định cho điện thoại phải thật nhẹ, và các mức phải tăng dần.
// Nếu ai đó lại bật bóng đổ / tăng tỉ lệ điểm ảnh ở mức "Vừa", FPS trên máy yếu sẽ tụt ngay — test này chặn việc đó.
import { describe, it, expect } from 'vitest';
import { QUALITY, Q_DEFAULT_MOBILE, Q_DEFAULT_DESKTOP, loadSettings } from '../src/game/ctx';

describe('mức đồ hoạ cho điện thoại', () => {
  it('mức mặc định của điện thoại không có bóng đổ và không vượt 1 điểm ảnh', () => {
    const q = QUALITY[Q_DEFAULT_MOBILE];
    expect(q.shadow).toBe(0);
    expect(q.pr).toBeLessThanOrEqual(1);
    expect(q.msaa).toBe(false);
  });

  it('mức mặc định của điện thoại vẽ ít NPC và tầm nhìn ngắn', () => {
    const q = QUALITY[Q_DEFAULT_MOBILE];
    expect(q.npcs).toBeLessThanOrEqual(18);
    expect(q.view).toBeLessThanOrEqual(145);
    expect(q.lights).toBeLessThanOrEqual(1);
  });

  it('chỉ mức cao nhất mới có bóng đổ thật', () => {
    const withShadow = QUALITY.filter((q) => q.shadow > 0);
    expect(withShadow).toHaveLength(1);
    expect(QUALITY[QUALITY.length - 1].shadow).toBeGreaterThan(0);
  });

  it('điện thoại không bật MSAA ở bất cứ mức nào', () => {
    for (const q of QUALITY) expect(q.msaa === undefined || q.msaa === false || q === QUALITY[QUALITY.length - 1]).toBe(true);
  });

  it('các mức xếp tăng dần theo độ nặng', () => {
    for (let i = 1; i < QUALITY.length; i++) {
      expect(QUALITY[i].pr).toBeGreaterThanOrEqual(QUALITY[i - 1].pr);
      expect(QUALITY[i].npcs).toBeGreaterThanOrEqual(QUALITY[i - 1].npcs);
      expect(QUALITY[i].view).toBeGreaterThanOrEqual(QUALITY[i - 1].view);
    }
  });

  it('mức cao dùng cho máy tính vẫn giữ bóng đổ và tỉ lệ điểm ảnh 2', () => {
    const q = QUALITY[Q_DEFAULT_DESKTOP];
    expect(q.shadow).toBeGreaterThan(0);
    expect(q.pr).toBe(2);
  });

  it('thiết bị mới mặc định mức "Vừa" cho điện thoại, mức cao cho máy tính', () => {
    expect(loadSettings(true).quality).toBe(Q_DEFAULT_MOBILE);
    expect(loadSettings(false).quality).toBe(Q_DEFAULT_DESKTOP);
  });
});
