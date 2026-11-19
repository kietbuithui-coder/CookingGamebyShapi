/* Gánh Hàng Đường Phố — service worker cho chơi offline.
 *
 * Nguyên tắc: sau lần mở đầu tiên (khi còn mạng), toàn bộ vỏ game được lưu lại, nên những lần sau mở
 * máy bay / mất 4G vẫn vào được và chơi tiếp từ chỗ đã lưu (tiến trình nằm trong localStorage, không
 * cần mạng để đọc).
 *
 * Chiến lược:
 *  · Tài nguyên có hàm băm trong tên (assets/index-abc123.js) → "tải trước, rơi về bộ nhớ đệm": mở
 *    mạng trước cho tươi, mất mạng thì trả bản đã lưu. Không bao giờ cũ vì tên đã đổi theo nội dung.
 *  · Trang (index.html, ./) → "bộ nhớ đệm trước, cập nhật sau": mở offline vẫn vào ngay, còn khi có
 *    mạng thì âm thầm lấy bản mới cho lần sau.
 *  · Mọi thứ khác (icon, font, manifest) → bộ nhớ đệm trước, thiếu thì tải rồi lưu.
 */
const VERSION = 'ganhhang-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Từng tệp một: một tệp lỗi (ví dụ thiếu icon) không được làm hỏng cả lần cài.
    await Promise.all(SHELL.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/** Trang thì ưu tiên bản đã lưu (mở tức thì); tài nguyên khác ưu tiên mạng để luôn đúng bản mới. */
const isPage = (url) => url.pathname.endsWith('/') || url.pathname.endsWith('.html');

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // không đụng vào tài nguyên bên ngoài

  if (isPage(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const hit = (await cache.match(req)) || (await cache.match('./index.html'));
      const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || new Response('Ngoại tuyến và chưa có bản lưu. Hãy mở game một lần khi có mạng.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req);
    if (hit) {
      // Có bản lưu: trả ngay, đồng thời làm mới cho lần sau (stale-while-revalidate).
      fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); }).catch(() => {});
      return hit;
    }
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return new Response('', { status: 504 });
    }
  })());
});

/* Trang có thể xin lưu sẵn toàn bộ tệp đang dùng (nút "Chơi offline" trong Cài đặt). */
self.addEventListener('message', (e) => {
  if (e.data?.type !== 'cache-all' || !Array.isArray(e.data.urls)) return;
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(e.data.urls.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    const n = (await cache.keys()).length;
    (await self.clients.matchAll({ includeUncontrolled: true })).forEach((c) => c.postMessage({ type: 'offline-ready', n }));
  })());
});
