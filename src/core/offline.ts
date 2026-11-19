/**
 * Chơi offline: đăng ký service worker (public/sw.js) và cho biết trạng thái để hiện trong Cài đặt.
 *
 * Tiến trình chơi nằm trong localStorage nên không cần mạng; thứ duy nhất cần mạng là tệp game.
 * Sau khi service worker cài xong và trang đã tải đủ một lần, mở lại game lúc mất mạng vẫn chạy.
 */

type State = 'chua' | 'dang' | 'san sang' | 'khong';

let state: State = 'chua';
let reg: ServiceWorkerRegistration | null = null;
let savedBytes = 0;

export const offlineState = () => state;
export const offlineBytes = () => savedBytes;

/** Trình duyệt có hỗ trợ không (Safari cũ ở chế độ riêng tư thì không). */
export const canOffline = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && location.protocol !== 'file:';

const fmtBytes = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export async function initOffline(): Promise<void> {
  if (!canOffline()) { state = 'khong'; return; }
  state = 'dang';
  try {
    reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    await navigator.serviceWorker.ready;
    state = reg.active ? 'san sang' : 'dang';
    // Trang đã tải đủ tài nguyên chưa? Nếu chưa (đang tải dở) thì lần mở sau mới đủ.
    savedBytes = await estimateSaved();
  } catch { state = 'khong'; }
}

/** Tổng dung lượng tài nguyên trang đã dùng — con số này chính là phần được lưu để chơi offline. */
async function estimateSaved(): Promise<number> {
  try {
    const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return res.reduce((a, r) => a + (r.encodedBodySize || r.transferSize || 0), 0);
  } catch { return 0; }
}

/**
 * Tải sẵn mọi tệp của bản đang chạy để chơi offline ngay (không phải chờ mở lại).
 * Trả về câu thông báo cho người chơi.
 */
export async function downloadForOffline(): Promise<string> {
  if (!canOffline()) return 'Trình duyệt này không cho lưu để chơi offline.';
  const urls = new Set<string>();
  urls.add('./'); urls.add('./index.html');
  try {
    for (const r of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
      if (r.name.startsWith(location.origin)) urls.add(r.name);
    }
  } catch { /* trình duyệt cũ */ }
  const sw = reg?.active ?? navigator.serviceWorker.controller;
  if (!sw) { state = 'khong'; return 'Chưa sẵn sàng, thử lại sau vài giây.'; }
  sw.postMessage({ type: 'cache-all', urls: [...urls] });
  savedBytes = await estimateSaved();
  state = 'san sang';
  return savedBytes ? `Đã lưu ${fmtBytes(savedBytes)} để chơi offline.` : 'Đã lưu bản chơi offline.';
}
