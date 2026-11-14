// SINH HOẠT CỦA PHỐ: mỗi nhóm người có lịch đi đứng riêng theo giờ, giờ cao điểm thì bước nhanh hơn,
// và có câu chào khác nhau tuỳ quen mặt – thời tiết – giờ giấc. Toàn bộ là hàm thuần để kiểm thử được.
import type { ArchId } from '../data/people';
import { clamp } from '../core/util';

/** Giờ cao điểm: đi làm buổi sáng, tan tầm buổi chiều. */
export const RUSH: [number, number][] = [[6.4, 8.2], [16.3, 18.3]];

/** Hệ số tốc độ đi bộ theo giờ: cao điểm thì nhanh hơn, khuya thì lững thững. */
export function rushMul(hour: number): number {
  for (const [a, b] of RUSH) if (hour >= a && hour < b) return 1.3;
  if (hour >= 22 || hour < 5) return 0.9;
  return 1;
}

/**
 * Chỗ nào đông ở giờ này — nhân vào trọng số chọn điểm đến của người đi đường.
 * Nhờ vậy chợ đông buổi sáng, quán ăn đông buổi trưa, công viên đông lúc chiều tối.
 */
export function crowdWeight(tag: string, hour: number): number {
  const morning = hour < 10, noon = hour >= 10 && hour < 14, afternoon = hour >= 14 && hour < 17.5, evening = hour >= 17.5;
  if (tag === 'market') return morning ? 3.4 : noon ? 1.3 : afternoon ? 1.5 : 0.5;
  if (tag === 'stall') return morning ? 2.4 : noon ? 2.6 : afternoon ? 1.4 : 2.2;
  if (tag === 'park' || tag === 'bench') return morning ? 1.5 : noon ? 0.7 : afternoon ? 2 : 3.2;
  if (tag === 'school') return morning ? 2 : afternoon ? 1.8 : 0.15;
  if (tag === 'office') return morning ? 2.2 : noon ? 0.9 : afternoon ? 1.6 : 0.3;
  if (tag === 'exit') return hour >= 21 || hour < 6 ? 2.6 : 0.4;
  if (tag === 'camp' || tag === 'hobo' || tag === 'under') return evening ? 2 : 0.8;
  if (tag === 'yard' || tag === 'dock') return morning ? 1.6 : 0.5;
  return 1;
}

/** Ba chỗ mà một nhóm người hay lui tới vào giờ này (ưu tiên giảm dần). */
export function routineFor(arch: ArchId, hour: number): string[] {
  switch (arch) {
    case 'congnhan': return hour < 10 ? ['market', 'yard', 'stall'] : hour >= 17.5 ? ['stall', 'park', 'bench'] : ['yard', 'dock', 'stall'];
    case 'hocsinh': return hour < 11 ? ['school', 'market', 'stall'] : hour < 17 ? ['stall', 'park', 'market'] : ['bench', 'park', 'stall'];
    case 'vanphong': return hour < 11 ? ['office', 'stall', 'school'] : hour < 17 ? ['stall', 'office', 'market'] : ['park', 'bench', 'stall'];
    case 'shipper': return ['stall', 'market', 'office'];
    case 'taixe': return ['stall', 'market', 'park'];
    case 'nguoigia': return hour < 10 ? ['market', 'bench', 'park'] : ['bench', 'park', 'stall'];
    case 'phuhuynh': return hour < 9 ? ['market', 'school', 'stall'] : hour < 17 ? ['school', 'stall', 'market'] : ['park', 'bench', 'market'];
    case 'dukhach': return ['park', 'market', 'stall'];
    case 'nhagiau': return ['office', 'park', 'stall'];
    case 'vogiacu': return hour >= 18 ? ['camp', 'hobo', 'under'] : ['market', 'stall', 'hobo'];
    case 'giangho': return ['stall', 'yard', 'park'];
    case 'congan': return ['office', 'market', 'stall'];
    case 'hangrong': return hour < 11 ? ['market', 'stall', 'park'] : ['stall', 'market', 'park'];
    default: {
      const spot = hour < 11 ? 'office' : 'stall', eat = hour < 12 ? 'market' : 'park';
      return [spot, eat, eat === 'park' ? 'bench' : 'stall'];
    }
  }
}

export type GreetKind = 'known' | 'rain' | 'cold' | 'hot' | 'morning' | 'noon' | 'evening' | 'night';
export interface GreetCtx { hour: number; rain: number; weather: string; rep: number; met: boolean; }

/** Kiểu câu chào: quen mặt trước, rồi tới thời tiết, rồi tới giờ trong ngày. */
export function greetKind(c: GreetCtx): GreetKind {
  if (c.met && c.rep > 6) return 'known';
  if (c.rain > 0.35) return 'rain';
  if (c.weather === 'nong') return 'hot';
  if (c.weather === 'lanh') return 'cold';
  if (c.hour < 10) return 'morning';
  if (c.hour < 14) return 'noon';
  if (c.hour < 18.5) return 'evening';
  return 'night';
}

/** Bao nhiêu lâu thì người đi đường chào người chơi một lần nữa (giây). */
export const GREET_GAP = 55;
/** Đứng cách bao xa thì chào (mét). */
export const GREET_NEAR = 5.2;

/**
 * Cao độ giọng nói của một người (Hz) — dùng cho tiếng "nói" ngắn khi họ mở miệng.
 * Nữ cao hơn nam; người nhỏ con / trẻ thì giọng cao hơn người tầm vóc lớn.
 */
export function voicePitch(fem: boolean, size = 1): number {
  const base = fem ? 236 : 152;
  return Math.round(base * clamp(1.07 - (size - 0.85) * 1.5, 0.84, 1.12));
}
