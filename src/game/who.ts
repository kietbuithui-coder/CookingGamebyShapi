// Ai là ai: người lạ thì chỉ thấy được vẻ ngoài; phải quen rồi mới biết tên.
import { ctx } from './ctx';
import type { Npc } from './npc';
import { SEEN } from '../data/people';
import { hasMet, fixedLabel } from '../sim/rules';

/** Người chơi đã biết tên người này chưa? */
export function known(n: Npc): boolean {
  if (n.fixedId) return hasMet(ctx.g, n.fixedId);
  if (n.regular) return hasMet(ctx.g, n.regular.id);
  return false;
}
/**
 * Tên để hiện lên màn hình (viết hoa đầu, dùng làm tiêu đề).
 * - Người đứng quầy: chưa quen → việc họ đang làm ("Bà chủ quán cơm"); quen rồi → tên.
 * - Khách quen: lần đầu ghé vẫn là người lạ; bán cho họ một lần thì biết tên.
 * - Nhân vật sự kiện (thanh tra, khách say…): gọi theo điều nhìn thấy/tự xưng.
 * - Người đi đường: luôn là người lạ, chỉ phân biệt theo vẻ ngoài (học sinh, người vô gia cư…).
 */
export function who(n: Npc): string {
  if (n.fixedId) return fixedLabel(ctx.g, n.fixedId);
  if (n.regular) return known(n) ? n.regular.name : SEEN[n.arch.id];
  if (n.kind === 'actor') return n.name;
  return SEEN[n.arch.id];
}
/** Như who() nhưng để chen vào giữa câu: nhãn chung thì viết thường ("nói chuyện với bà chủ quán cơm"), tên riêng giữ nguyên. */
export function whoIn(n: Npc): string {
  const w = who(n);
  return known(n) || (n.kind === 'actor' && !n.regular) ? w : w.charAt(0).toLowerCase() + w.slice(1);
}
