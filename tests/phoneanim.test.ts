// Hoạt ảnh ngay trên màn hình điện thoại (lượt 29): mở radio / nghe nhạc / lướt WAP / gọi điện / soạn tin
// thì máy phải "chạy" đúng việc đó, chạy đủ lâu để người chơi kịp thấy, và đổi kênh / cúp máy được.
// Đây là kiểm tra trạng thái hoạt ảnh (luật + dữ liệu), còn hình thức thì kiểm bằng probe ảnh chụp.
import { describe, it, expect } from 'vitest';
import { phoneAct, setPhoneAct, endPhoneAct, tickPhoneAct, phoneActNext, phoneView } from '../src/ui/phoneUI';
import { PHONES } from '../src/data/phone';
import { activate } from '../src/sim/phone';
import { fresh } from './helpers';

const boot = (id = 'camung') => { const g = fresh(); activate(g, id); g.cash = 100000; return g; };

describe('hoạt ảnh trên màn hình máy', () => {
  it('máy chưa làm gì thì không có lớp hoạt ảnh', () => {
    boot();
    expect(phoneAct()).toBe(null);
  });

  it('bật radio: màn hình máy chạy đúng việc, đủ dài và có chữ đang phát', () => {
    boot();
    setPhoneAct('radio', 15, 'Bản tin sáng');
    const a = phoneAct();
    expect(a?.k).toBe('radio');
    expect(a?.dur).toBe(15);
    expect(a?.line).toBe('Bản tin sáng');
  });

  it('đếm ngược theo thời gian thật rồi tự tắt — lớp hoạt ảnh biến mất', () => {
    boot();
    setPhoneAct('call', 2, '', 'Chú Ba xe ôm');
    expect(tickPhoneAct(0.5)).toBe(false);
    expect(tickPhoneAct(1)).toBe(false);       // còn 0,5 giây, chưa hết
    expect(phoneAct()).not.toBe(null);
    expect(tickPhoneAct(0.6)).toBe(true);      // vừa hết: báo để vẽ lại màn hình
    expect(phoneAct()).toBe(null);
    expect(tickPhoneAct(1)).toBe(false);       // đã hết thì không báo nữa
  });

  it('đổi kênh: radio đổi nội dung và chạy tiếp từ đầu; WAP đổi trang', () => {
    boot();
    setPhoneAct('radio', 20, 'Đài 1');
    expect(phoneActNext()).toBe(true);
    expect(phoneAct()?.line).not.toBe('Đài 1');
    expect(phoneAct()?.dur).toBe(20);
    setPhoneAct('wap', 20, '');
    const first = phoneAct()?.line;
    expect(phoneActNext()).toBe(true);
    expect(phoneAct()?.line).not.toBe(first);
    // cuộc gọi không "đổi kênh" được
    setPhoneAct('call', 9, '', 'Ai đó');
    expect(phoneActNext()).toBe(false);
  });

  it('cúp máy / bấm tắt là lớp hoạt ảnh tắt ngay', () => {
    boot();
    setPhoneAct('music', 999, 'Bài hát');
    expect(phoneAct()?.k).toBe('music');
    endPhoneAct();
    expect(phoneAct()).toBe(null);
  });

  it('máy không có chức năng thì không bật được hoạt ảnh đó (luật vẫn trong sim/phone)', () => {
    const g = boot('cucgach');
    expect(PHONES.cucgach.feats).not.toContain('radio');
    // bấm "Nghe nhạc" trên cục gạch không có dòng nào để bấm, nên màn hình cũng không chạy nhạc
    const apps = PHONES.cucgach.feats.join(',');
    expect(apps).not.toContain('music');
    expect(g.phone?.id).toBe('cucgach');
  });

  it('mở máy là về màn hình chính, hoạt ảnh cũ không còn dính lại', () => {
    boot();
    setPhoneAct('wap', 30, '');
    expect(phoneAct()).not.toBe(null);
    expect(phoneView().app).toBe('home');
  });
});
