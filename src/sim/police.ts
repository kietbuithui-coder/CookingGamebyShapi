// CÔNG AN PHƯỜNG — mức "bị để ý" (wanted), phạt hành chính, tạm giữ ở phường và lao động khổ sai.
// Toàn bộ là logic thuần để kiểm thử được (xem tests/police.test.ts); phần gọi hội thoại, tua thời gian
// và đặt người chơi vào buồng giam nằm ở game/acts.ts.
import { clamp, round1k } from '../core/util';
import { Game, absMin } from './state';
import { toast } from '../core/bus';

/** Một cú đấm giữa đường làm công an để ý bao nhiêu. */
export const HEAT_PUNCH = 18;
/** Ngưỡng bị gọi lại hỏi giấy tờ. */
export const WANTED_ALERT = 45;
/** Mỗi phút ngoài đường nguôi đi bao nhiêu. */
export const HEAT_COOL = 0.25;
/** Nộp phạt xong thì bớt được chừng này. */
export const HEAT_FINE = 45;

export const addHeat = (g: Game, n: number) => { g.wanted = clamp(g.wanted + n, 0, 100); };
/** Nguôi dần theo thời gian (gọi mỗi phút trong game). */
export function cool(g: Game, minutes: number) {
  if (g.jailUntil > 0) return;
  g.wanted = clamp(g.wanted - minutes * HEAT_COOL, 0, 100);
}
/** Công an có để ý không: đủ ngưỡng và chưa bị gọi cách đây ít phút. */
export function shouldStop(g: Game): boolean {
  if (g.jailUntil > 0) return false;
  if (g.wanted < WANTED_ALERT) return false;
  return absMin(g) >= (g.flags.policeCool ?? 0);
}

/** Tiền phạt hành chính: cơ bản + theo mức bị để ý, càng vào phường nhiều lần càng nặng. */
export function fine(g: Game): number {
  const times = g.flags.jail ?? 0;
  return round1k(60000 + g.wanted * 900 + times * 40000);
}
/** Nộp phạt: trừ tiền, hết bị để ý, nghỉ một lúc mới bị gọi lại. false nếu không đủ tiền. */
export function payFine(g: Game): boolean {
  const f = fine(g);
  if (g.cash < f) return false;
  g.cash -= f; g.led.other += f;
  g.wanted = clamp(g.wanted - HEAT_FINE, 0, 100);
  g.flags.policeCool = absMin(g) + 60;
  return true;
}
/** Cãi được thì chỉ bị nhắc, không bị giữ. */
export function letGo(g: Game) {
  g.wanted = clamp(g.wanted - 15, 0, 100);
  g.flags.policeCool = absMin(g) + 45;
}

/** Số giờ tạm giữ: theo mức bị để ý, tái phạm thì lâu hơn. */
export function sentenceHours(g: Game): number {
  const times = g.flags.jail ?? 0;
  return clamp(2 + Math.floor(g.wanted / 18) + times * 2, 2, 12);
}
/** Bị giữ ở phường: hết hạn mới thả, trong buồng giam thì không bị để ý nữa. */
export function jail(g: Game, hours = sentenceHours(g)) {
  g.jailUntil = absMin(g) + Math.max(1, Math.round(hours)) * 60;
  g.wanted = 0;
  g.flags.jail = (g.flags.jail ?? 0) + 1;
  g.flags.jailDay = g.day;
}
export const jailLeft = (g: Game) => Math.max(0, g.jailUntil - absMin(g));
export const inJail = (g: Game) => g.jailUntil > absMin(g);

/** Một giờ đập đá / quét sân: bớt thêm một giờ tạm giữ, nhưng mất sức. Phải gọi sau khi đã tua 60 phút. */
export function labour(g: Game): boolean {
  if (!inJail(g)) return false;
  const minLeft = absMin(g) + 30;
  g.jailUntil = Math.max(minLeft, g.jailUntil - 60);
  g.st.health = clamp(g.st.health - 5, 0, 100);
  g.st.energy = clamp(g.st.energy - 12, 0, 100);
  g.st.hygiene = clamp(g.st.hygiene - 8, 0, 100);
  g.st.mood = clamp(g.st.mood - 6, 0, 100);
  g.st.hunger = clamp(g.st.hunger - 8, 0, 100);
  return true;
}

/** Hết hạn tạm giữ: ra khỏi buồng, mất uy tín và tinh thần, người thì lem luốc. */
export function release(g: Game) {
  g.jailUntil = 0;
  g.rep = clamp(g.rep - 8, 0, 100);
  g.st.mood = clamp(g.st.mood - 10, 0, 100);
  g.st.hygiene = clamp(g.st.hygiene - 18, 0, 100);
  toast('Hết hạn tạm giữ, chú công an mở cửa: “Về đi, lần sau đừng để tôi gặp lại.”', 'warn', 'badge', true);
}
