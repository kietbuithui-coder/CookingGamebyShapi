// BA BÀI NHẠC RIÊNG CỦA CHIẾC ĐIỆN THOẠI — viết tay theo ngũ cung, khác hẳn nhạc nền theo ngữ cảnh của game.
// Máy có loa ngoài: bật "Nghe nhạc" trên điện thoại là đổi luôn nhạc nền (BGM) sang bài của máy, bấm
// "Bài khác" để đổi bài, "Tắt" để trả về nhạc nền theo ngữ cảnh. Ba bài dùng chung khuôn `Track` với
// src/audio/audio.ts nên không cần sửa bộ tổng hợp âm thanh.
//
// Ghi chú nhạc lý (đơn giản để người sau sửa được):
//   · Mỗi ký tự = một nốt móc đơn. 0–9,a–e là bậc trong thang âm của bài, '.' = lặng, '-' = ngân dài.
//   · 16 ký tự = 1 ô nhịp; `lead` là giai điệu, `bass` là 8 nốt trầm (mỗi nốt dài 2 móc).
//   · Bộ gõ: k = trống trầm, s = mõ, h = nhịp nhẹ.
export interface Track { bpm: number; scale: number[]; root: number; lead: string[]; bass: string[]; perc: string; inst: 'pluck' | 'flute' | 'bell'; pad: boolean; swing?: number; }

export interface SongDef {
  id: string;
  /** Tên bài như in trên màn hình máy. */
  name: string;
  /** Ca sĩ / ban nhạc hát trong băng cassette (hư cấu, đúng thời máy đời 2005). */
  by: string;
  /** Độ dài bài (phút trong game) — chỉ để hiện trên máy. */
  min: number;
  /** Tinh thần cộng thêm mỗi lần nghe hết một lượt. */
  mood: number;
  track: Track;
}

const PENTA_MAJ = [0, 2, 4, 7, 9], PENTA_MIN = [0, 3, 5, 7, 10], BAC = [0, 2, 5, 7, 9];

export const SONGS: SongDef[] = [
  {
    id: 'mua_chieu', name: 'Mưa chiều miền Trung', by: 'Bolero tuyển chọn', min: 12, mood: 6,
    track: { bpm: 68, scale: PENTA_MIN, root: 57, inst: 'bell', pad: true, perc: '................',
      lead: ['4---5---4---2...', '0---2---4-------', '5---4---2---0...', '2-------........',
        '7---5---4---2...', '4---5---7---5...', '4---2---0---2...', '0-------........'],
      bass: ['0.......', '2.......', '0.......', '0.......', '3.......', '2.......', '0.......', '0.......'] },
  },
  {
    id: 'pho_chieu', name: 'Mưa rơi trên phố chiều', by: 'Nhóm Lá Bàng', min: 10, mood: 5,
    track: { bpm: 82, scale: BAC, root: 60, inst: 'pluck', pad: true, perc: '....h.....h.....', swing: 0.1,
      lead: ['4.5.7.5.4.2.4...', '2.4.5.7.5.4.2...', '4.2.0.2.4.5.4...', '2...0...-.......',
        '7.5.4.5.7.9.7...', '5.4.2.4.5.4.2...', '4.2.0.2.4...2...', '0...0...-.......'],
      bass: ['0...4...', '2...4...', '0...2...', '0...0...', '3...4...', '2...3...', '0...2...', '0...0...'] },
  },
  {
    id: 'xe_om', name: 'Chuyện người xe ôm', by: 'Tài Tử Sài Gòn', min: 9, mood: 4,
    track: { bpm: 96, scale: PENTA_MAJ, root: 62, inst: 'flute', pad: false, perc: 'k.h.s.h.k.h.s.h.', swing: 0.06,
      lead: ['0.2.4.5.4.2.0...', '2.4.5.7.5.4.2...', '4.5.7.9.7.5.4...', '5...4.2.0...-...',
        '7.9.a.9.7.5.4...', '5.7.5.4.2.0.2...', '4.2.0.2.4.5.4...', '2...0...0.......'],
      bass: ['0.0.4.4.', '2.2.4.4.', '0.0.2.2.', '2.0.0...', '3.3.4.4.', '2.2.0.0.', '0.0.2.2.', '0.0.0...'] },
  },
];
export const SONG_BY_ID: Record<string, SongDef> = Object.fromEntries(SONGS.map((s) => [s.id, s]));

/** Nhạc nền của máy dùng đúng khuôn `Track` của bộ tổng hợp âm thanh. */
export const SONG_TRACKS: Record<string, Track> = Object.fromEntries(SONGS.map((s) => ['phone_' + s.id, s.track]));
/** Có phải "bài của máy" không (để bộ phát nhạc biết mà phát). */
export const isPhoneTrack = (key: string) => key.startsWith('phone_');
/** Đổi một khoá nhạc nền thành thông tin bài hát (null nếu đó là nhạc theo ngữ cảnh). */
export const songOf = (key: string): SongDef | null => SONG_BY_ID[key.replace(/^phone_/, '')] ?? null;
