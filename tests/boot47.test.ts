// Lượt 47 — hotfix "điện thoại mở lên không vào được menu".
//
// Nguyên nhân đo được: nếu tệp JS của game không tải được (mạng chập chờn, hoặc service worker đời cũ trả
// một tệp JS đã bị xoá sau lần cập nhật), trang chỉ còn một màu đen trơn — không nút, không lời báo. Đo trên
// bản build bằng puppeteer: body.innerText rỗng, 0 nút bấm được.
//
// Bản sửa: index.html tự mang màn hình chờ + bảng báo lỗi + nút "Sửa lỗi tải" (xoá bộ nhớ đệm, service worker
// rồi mở lại), và service worker đổi sang "mạng trước, mất mạng mới dùng bản lưu".
import { describe, it, expect } from 'vitest';
import html from '../index.html?raw';
import sw from '../public/sw.js?raw';

describe('index.html tự cứu được khi tệp game không tải được', () => {
  it('có màn hình chờ và bảng báo lỗi ngay trong trang', () => {
    expect(html).toContain('id="bootload"');
    expect(html).toContain('id="booterr"');
    expect(html).toContain('Đang dựng thành phố');
  });

  it('có hai nút thoát: Thử lại và Sửa lỗi tải', () => {
    expect(html).toContain('id="bootreload"');
    expect(html).toContain('id="bootfix"');
    expect(html).toMatch(/Sửa lỗi tải/);
  });

  it('"Sửa lỗi tải" xoá bộ nhớ đệm và service worker cũ', () => {
    expect(html).toContain('caches.keys()');
    expect(html).toContain('caches.delete');
    expect(html).toContain('getRegistrations');
    expect(html).toContain('unregister');
    // mở lại bằng địa chỉ mới để không dùng lại bản lưu cũ
    expect(html).toMatch(/location\.replace\(location\.pathname \+ '\?v='/);
  });

  it('có hẹn giờ: quá 15 giây không lên hình thì báo lỗi', () => {
    expect(html).toMatch(/setTimeout\([\s\S]{0,200}15000/);
    expect(html).toContain('__boot.fail');
  });

  it('bắt được cả trường hợp riêng tệp script bị lỗi', () => {
    expect(html).toMatch(/addEventListener\('error'[\s\S]{0,160}SCRIPT/);
  });

  it('kiểu dáng màn hình chờ nằm ngay trong trang, không phụ thuộc tệp CSS của game', () => {
    expect(html).toMatch(/<style>[\s\S]*#booterr/);
    expect(html).toMatch(/#booterr button/);
  });

  it('mở kèm ?reset thì chủ động xoá bản cũ', () => {
    expect(html).toMatch(/\[\?&\]reset/);
  });
});

describe('service worker không còn ghim điện thoại vào bản cũ', () => {
  it('phiên bản bộ nhớ đệm đã tăng (v1 → v2)', () => {
    expect(sw).toContain("'ganhhang-v2'");
    expect(sw).not.toContain("'ganhhang-v1'");
  });

  it('trang: lấy mạng trước, mất mạng mới rơi về bản lưu', () => {
    const start = sw.indexOf('if (isPage(url))');
    const page = sw.slice(start, sw.indexOf('if (isPage(url))', start + 10));
    expect(page).toContain('try');
    expect(page.indexOf('fetch(req')).toBeLessThan(page.indexOf('catch'));
    expect(page).toContain("cache: 'no-store'");
  });

  it('tài nguyên khác: cũng mạng trước, chỉ khi mất mạng mới dùng bản lưu', () => {
    const tail = sw.slice(sw.lastIndexOf('e.respondWith'));
    expect(tail.indexOf('fetch(req)')).toBeLessThan(tail.indexOf('catch'));
  });
});
