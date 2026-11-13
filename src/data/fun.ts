// CHỖ VUI CHƠI — những chỗ ngồi chơi, thư giãn để lên tinh thần. Không kiếm được tiền, chỉ tiêu tiền và thời gian,
// nhưng tinh thần thấp thì khách cũng quay đi và thao tác nấu kém hơn, nên đây là một phần của vòng chơi.
export interface FunDef {
  id: string; anchor: string; label: string; note: string;
  cost: number;          // đồng
  mins: number;          // phút trôi qua
  mood: number;          // tinh thần cộng thêm
  energy?: number;       // năng lượng cộng/trừ
  thirst?: number; hunger?: number; hygiene?: number;
  minEnergy?: number;    // cần ít nhất bao nhiêu năng lượng
  hours?: [number, number];
}
export const FUN_LIST: FunDef[] = [
  // Quán cà phê có tivi (tv_bongda) — ngồi uống, hát karaoke, xem bóng đá (khi có trận)
  { id: 'cafe_sua', anchor: 'tv_bongda', label: 'Ngồi uống cà phê sữa đá — 20.000₫', note: 'Ngồi ghế nhựa, nghe nhạc, ngắm phố', cost: 20000, mins: 30, mood: 13, thirst: 14, energy: 4, hours: [5.5, 23] },
  { id: 'cafe_karaoke', anchor: 'tv_bongda', label: 'Hát karaoke một bài — 30.000₫', note: 'Hát dở cũng được, vui là chính', cost: 30000, mins: 40, mood: 19, energy: -6, thirst: -6, minEnergy: 15, hours: [8, 22.5] },
  // Chùa Phước An (v_temple) — thắp nhang cầu an
  { id: 'temple_huong', anchor: 'v_temple', label: 'Thắp nhang, cầu một điều may — 5.000₫', note: 'Khói nhang, tiếng chuông, lòng nhẹ đi', cost: 5000, mins: 12, mood: 11, hours: [5, 20] },
];
export const FUNS: Record<string, FunDef> = Object.fromEntries(FUN_LIST.map((f) => [f.id, f]));
/** Các chỗ chơi gắn với một địa điểm (neo). */
export const funAt = (anchor: string) => FUN_LIST.filter((f) => f.anchor === anchor);
/** Chỗ chơi còn mở ở giờ đã cho (hoạt động không ghi giờ thì mở cả ngày). */
export const funOpenAt = (anchor: string, hour: number) => funAt(anchor).filter((f) => !f.hours || (hour >= f.hours[0] && hour < f.hours[1]));
/** 22.5 → "22h30". */
export const fmtHour = (h: number) => `${Math.floor(h)}h${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
/** Giờ mở cửa để nói với người chơi, ví dụ "5h30–23h · 8h–22h30". */
export const funHoursText = (anchor: string) => [...new Set(funAt(anchor).filter((f) => f.hours).map((f) => f.hours!.map(fmtHour).join('–')))].join(' · ');
