// Tiện ích dùng chung cho các bài kiểm thử: dựng nhanh một ván chơi ở trạng thái mong muốn.
import { newGame, addStack, Game } from '../src/sim/state';
import type { Activity, Persona } from '../src/sim/rules';
import { ARCH, ArchId } from '../src/data/people';
import { SPOTS } from '../src/world/layout';

/** Hoạt động "đứng yên dưới mái che" — dùng khi chỉ muốn cho thời gian trôi. */
export const IDLE: Activity = { moving: false, running: false, sleeping: false, sheltered: true, working: false, load: 0, sleepQ: 1 };

/** Ván mới với hạt giống cố định (kết quả lặp lại được). */
export function fresh(seed = 12345): Game {
  return newGame(seed, 'anh');
}

/** Cho thẳng nguyên liệu vào kho quầy. */
export function give(g: Game, id: string, n: number, fresh = 95, q = 0.9, cost = 1000, where: 'store' | 'bag' | 'home' = 'store') {
  addStack(where === 'store' ? g.stall.store : where === 'bag' ? g.bag : g.home, { id, n, fresh, q, cost });
}

/** Ván đã có gánh hàng đặt ở cổng công viên, đủ đồ nghề cơ bản, 15:00 ngày đầu. */
export function withStall(seed = 12345): Game {
  const g = fresh(seed);
  g.cash = 500000; g.min = 15 * 60;
  for (const id of ['ganh', 'daothot', 'bepthan', 'vi', 'noi', 'chao']) g.gear[id] = 100;
  const sp = SPOTS.find((s) => s.id === 'cv')!;
  g.stall = { ...g.stall, tier: 1, where: 'placed', spot: sp.id, x: sp.x, z: sp.z, yaw: sp.yaw, open: true, paidDay: g.day };
  return g;
}

/** Bật bán trà đá, có sẵn 12 phần sơ chế + đá để hoàn thiện. */
export function sellingTea(seed = 12345): Game {
  const g = withStall(seed);
  g.stall.preps.push({ rid: 'tra_da', n: 12, q: 0.9, at: g.day * 1440 + g.min, cost: 800 });
  give(g, 'da', 3); give(g, 'than', 2);
  g.rec.tra_da.on = true;
  return g;
}

/** Một vị khách thuộc nhóm cho trước, độ "dễ tính" trung bình. */
export function persona(arch: ArchId, budget?: number, noise = 1.03): Persona {
  const a = ARCH[arch];
  return { arch: a, budget: budget ?? (a.budget[0] + a.budget[1]) / 2, noise };
}
