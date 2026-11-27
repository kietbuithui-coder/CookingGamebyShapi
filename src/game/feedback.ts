// GÓP Ý & BÁO LỖI (lượt 70) — người chơi yêu cầu: *“thêm 1 nút góp ý/báo lỗi và 1 chỗ lưu các góp ý để ng
// chơi đóng góp, kế các nút trong ảnh”*. Nút nằm trên thanh nút HUD, ngay cạnh Túi đồ / Sổ tay / Bản đồ /
// Cài đặt (xem `ui/ui.ts` mục `menub`), và mở bảng `feedback` trong `ui/panels.ts`.
//
// Góp ý được lưu **trên máy người chơi** (localStorage, khoá riêng) chứ không gửi đi đâu: bản này là game
// chạy tĩnh trên GitHub Pages, không có máy chủ. Người chơi đọc lại, sửa/xoá, và bấm **“Sao chép hết”** để
// dán vào tin nhắn/nhóm chat cho người làm game. Như vậy là “có chỗ lưu” thật, và người làm game vẫn nhận
// được nội dung mà không phải mở máy chủ.
//
// Hàm ở đây thuần dữ liệu (không DOM, không ba.js) nên `tests/feedback.test.ts` kiểm được.
import { CHANGELOG } from '../data/changelog';

export const FB_KEY = 'ganhhang.feedback.v1';
export const FB_MAX = 40;            // giữ tối đa 40 góp ý, quá thì bỏ cái cũ nhất
export const FB_TEXT_MIN = 8;        // ngắn hơn 8 ký tự thì gần như không phải góp ý
export const FB_TEXT_MAX = 600;

export type FbKind = 'loi' | 'gopy' | 'khac';
export const FB_KINDS: { id: FbKind; name: string; hint: string }[] = [
  { id: 'loi', name: 'Báo lỗi', hint: 'Kẹt đường, rơi khỏi bản đồ, bấm không ăn, mất tiền vô cớ…' },
  { id: 'gopy', name: 'Góp ý', hint: 'Muốn thêm gì, chỗ nào chán, giá cả có hợp lý không…' },
  { id: 'khac', name: 'Chuyện khác', hint: 'Cảm nghĩ, khen, chê, hay chỉ muốn chào một câu.' },
];

export interface Feedback {
  id: string;
  /** Lúc gửi, theo giờ máy người chơi (để đọc lại cho dễ hiểu). */
  at: number;
  kind: FbKind;
  text: string;
  /** Bối cảnh tự đính kèm — người làm game cần mấy số này mới dựng lại được lỗi. */
  ctx: { day: number; min: number; x: number; z: number; district: string; ver: string };
  /** Người chơi đã tự sửa chữ chưa (để hiện nhãn). */
  edited?: boolean;
}

const KIND_SET = new Set(FB_KINDS.map((k) => k.id));
/** Cắt gọn chữ người chơi gõ: bỏ khoảng trắng thừa, chặn độ dài. */
export function cleanText(t: string): string {
  return t.replace(/\s+/g, ' ').trim().slice(0, FB_TEXT_MAX);
}
/** Góp ý dùng được chưa — trả về lý do nếu chưa (để UI nói rõ chứ không im lặng). */
export function checkText(t: string): string | null {
  const s = cleanText(t);
  if (s.length < FB_TEXT_MIN) return `Ghi thêm chút nữa đi (ít nhất ${FB_TEXT_MIN} ký tự).`;
  return null;
}
/** Mã góp ý ngắn, đọc được bằng mắt: `L070-3` = lỗi, ngày 70, cái thứ 3. */
export function makeId(kind: FbKind, day: number, n: number): string {
  const k = kind === 'loi' ? 'L' : kind === 'gopy' ? 'G' : 'K';
  return `${k}${String(Math.round(day)).padStart(3, '0')}-${n + 1}`;
}

/** Đọc kho góp ý đã lưu (hỏng/không có thì trả mảng rỗng, không ném lỗi). */
export function loadFeedback(): Feedback[] {
  try {
    const raw = localStorage.getItem(FB_KEY);
    if (!raw) return [];
    const a = JSON.parse(raw);
    if (!Array.isArray(a)) return [];
    return a.filter((f) => f && typeof f.text === 'string' && KIND_SET.has(f.kind)).slice(0, FB_MAX);
  } catch { return []; }
}
function save(list: Feedback[]) {
  try { localStorage.setItem(FB_KEY, JSON.stringify(list.slice(0, FB_MAX))); } catch { /* bộ nhớ đầy */ }
}
/** Thêm một góp ý vào đầu danh sách; trả về bản ghi vừa lưu (hoặc null nếu chữ quá ngắn). */
export function addFeedback(
  list: Feedback[], kind: FbKind, text: string,
  ctxIn: { day: number; min: number; x: number; z: number; district: string },
): Feedback | null {
  if (checkText(text)) return null;
  const f: Feedback = {
    id: makeId(KIND_SET.has(kind) ? kind : 'khac', ctxIn.day, list.length),
    at: Date.now(), kind: KIND_SET.has(kind) ? kind : 'khac', text: cleanText(text),
    ctx: { ...ctxIn, ver: CHANGELOG[0]?.v ?? '' },
  };
  const next = [f, ...list].slice(0, FB_MAX);
  save(next);
  return f;
}
/** Sửa chữ của một góp ý (người chơi gõ nhầm thì sửa được, không phải xoá đi gõ lại). */
export function editFeedback(list: Feedback[], id: string, text: string): Feedback[] {
  const next = list.map((f) => (f.id === id ? { ...f, text: cleanText(text), edited: true } : f));
  save(next); return next;
}
export function removeFeedback(list: Feedback[], id: string): Feedback[] {
  const next = list.filter((f) => f.id !== id); save(next); return next;
}
export function clearFeedback(): Feedback[] { save([]); return []; }

/** Toàn bộ góp ý thành một khối chữ để người chơi dán gửi cho người làm game. */
export function exportFeedback(list: Feedback[]): string {
  if (!list.length) return '';
  const head = `GÓP Ý GAME GÁNH HÀNG ĐƯỜNG PHỐ — ${list.length} mục`;
  const body = list.map((f) => {
    const k = FB_KINDS.find((x) => x.id === f.kind)?.name ?? 'Khác';
    const d = new Date(f.at);
    const when = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const c = f.ctx;
    return `[${f.id}] ${k} · ${when} · ngày ${c.day}, ${Math.floor(c.min / 60)}h${String(Math.floor(c.min % 60)).padStart(2, '0')} · ${c.district} (${c.x.toFixed(0)};${c.z.toFixed(0)}) · ${c.ver}\n${f.text}`;
  }).join('\n\n');
  return head + '\n\n' + body;
}
