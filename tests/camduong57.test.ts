// Lượt 57 — rào “Cấm đường” phải chặn CẢ XE, không chỉ người đi bộ.
// Trước đây `NAV_BLOCK` (NPC) và rào vẽ ở `world/city.ts` là hai chuyện của `stall.ts`, còn `traffic.ts` không biết
// sự kiện nào cả — xe chạy dọc tuyến x = −29,5 cứ thế xuyên qua hai hàng rào ở z = ±25.
import { describe, it, expect, afterEach } from 'vitest';
import { CORR } from '../src/world/layout';
import { ROADBLOCK, barrierStop, roadBlocked, setRoadblock, spawnInBlock, pickSpawn } from '../src/game/roads';
import trafficRaw from '../src/game/traffic.ts?raw';
import stallRaw from '../src/game/stall.ts?raw';
import cityRaw from '../src/world/city.ts?raw';

afterEach(() => setRoadblock(false));

const rand = (seed = 1) => {
  let s = seed;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return { chance: (p: number) => next() < p, range: (a: number, b: number) => a + next() * (b - a), pick: <T>(a: T[]) => a[Math.floor(next() * a.length) % a.length] };
};

describe('rào cấm đường chặn được xe (lượt 57)', () => {
  it('rào thật dựng ở đúng chỗ luật khai: tâm x = −29,5, hai vạch z = ±25', () => {
    // city.ts dựng 3 tấm mỗi hàng, tâm cách nhau 2,5 m, mỗi tấm rộng 2,2 m, ở x = −32 + i*2,5
    const m = cityRaw.match(/for \(const z of \[(-?\d+), (-?\d+)\]\) for \(let i = 0; i < 3;/);
    expect(m, 'không thấy hai hàng rào trong city.ts').toBeTruthy();
    expect(Number(m![1])).toBe(ROADBLOCK.v0);
    expect(Number(m![2])).toBe(ROADBLOCK.v1);
    const xs = cityRaw.match(/\{ const x = (-?\d+) \+ i \* ([\d.]+);/);
    expect(xs, 'không thấy công thức xếp tấm rào').toBeTruthy();
    const x0 = Number(xs![1]), step = Number(xs![2]), centre = x0 + step;     // tấm giữa = tâm đoạn
    expect(Math.abs(centre - ROADBLOCK.road)).toBeLessThan(0.01);
    expect(ROADBLOCK.axis).toBe(1);      // rào chắn ngang đường nên chỉ chặn xe chạy dọc trục z
  });

  it('tắt mặc định; bật thì chỉ tuyến bị rào là bị chặn', () => {
    expect(roadblockActiveOff()).toBe(true);
    setRoadblock(true);
    expect(roadBlocked(1, ROADBLOCK.road)).toBe(true);
    for (const c of CORR) if (c !== ROADBLOCK.road) expect(roadBlocked(1, c), String(c)).toBe(false);
    expect(roadBlocked(0, ROADBLOCK.road)).toBe(false);   // xe chạy ngang qua giao lộ vẫn đi được
  });

  it('xe từ phía bắc chạy xuống phải quay đầu ở vạch bắc, không lọt vào giữa hai hàng rào', () => {
    setRoadblock(true);
    expect(barrierStop(1, ROADBLOCK.road, 40, -1)).toBe(ROADBLOCK.v1);
    expect(barrierStop(1, ROADBLOCK.road, 26, -1)).toBe(ROADBLOCK.v1);
    // đã ở phía nam rào thì chạy tiếp bình thường
    expect(barrierStop(1, ROADBLOCK.road, -40, -1)).toBeNull();
    expect(barrierStop(1, ROADBLOCK.road, -26, -1)).toBeNull();
  });

  it('xe từ phía nam chạy lên phải quay đầu ở vạch nam', () => {
    setRoadblock(true);
    expect(barrierStop(1, ROADBLOCK.road, -40, 1)).toBe(ROADBLOCK.v0);
    expect(barrierStop(1, ROADBLOCK.road, -26, 1)).toBe(ROADBLOCK.v0);
    expect(barrierStop(1, ROADBLOCK.road, 40, 1)).toBeNull();
  });

  it('xe lỡ nằm trong đoạn cấm thì đi thẳng ra, không bị bắt quay đầu tại chỗ', () => {
    setRoadblock(true);
    expect(barrierStop(1, ROADBLOCK.road, 0, 1)).toBeNull();
    expect(barrierStop(1, ROADBLOCK.road, 0, -1)).toBeNull();
  });

  it('mô phỏng 3.000 bước: không xe nào vượt qua được vạch rào', () => {
    setRoadblock(true);
    let pos = 60, sign: 1 | -1 = -1, lane = 1.7, crossings = 0, turns = 0;
    const speed = 9, END = 80;   // mép mặt đường: chạy hết thì quay đầu như ở giao lộ cuối
    for (let i = 0; i < 4000; i++) {
      const stop = barrierStop(1, ROADBLOCK.road, pos, sign), next = pos + sign * speed * 0.05;
      if (stop !== null && (next - stop) * sign > 0) { pos = stop - sign * 0.1; sign = -sign as 1 | -1; lane = -lane; turns++; }
      else if ((sign > 0 && next >= END) || (sign < 0 && next <= -END)) { sign = -sign as 1 | -1; lane = -lane; pos = next; }
      else pos = next;
      if (pos > ROADBLOCK.v0 && pos < ROADBLOCK.v1) crossings++;
    }
    expect(turns).toBeGreaterThan(2);        // có quay đầu thật
    expect(crossings).toBe(0);               // và không lần nào nằm giữa hai hàng rào
  });

  it('không sinh xe trong đoạn cấm, kể cả hai làn cộng bề dày rào', () => {
    setRoadblock(true);
    for (const p of [ROADBLOCK.v0 - 6, ROADBLOCK.v0 + 0.5, 0, ROADBLOCK.v1 - 0.5, ROADBLOCK.v1 + 6]) expect(spawnInBlock(1, ROADBLOCK.road, p), String(p)).toBe(true);
    expect(spawnInBlock(1, ROADBLOCK.road, ROADBLOCK.v1 + 7)).toBe(false);
    expect(spawnInBlock(1, CORR[2], 0)).toBe(false);
    const r = rand(5);
    for (let i = 0; i < 600; i++) {
      const sp = pickSpawn(1, -1, r.range(-80, 80), ROADBLOCK.road + r.range(-2, 2), r);
      if (sp.pos === null) continue;
      expect(spawnInBlock(sp.axis, sp.road, sp.pos)).toBe(false);
    }
  });

  it('hệ xe quay đầu ở rào, và sự kiện bật/tắt rào đi qua đúng một hàm dùng chung', () => {
    expect(trafficRaw).toContain('barrierStop(');
    expect(trafficRaw).toMatch(/r\.sign = -r\.sign/);
    expect(stallRaw).toMatch(/setRoadblock\(on\)/);
    expect(stallRaw).toMatch(/setRoadblock\(false\)/);       // khôi phục lúc vào ván cũng phải tắt
    expect(trafficRaw).not.toMatch(/ctx\.city\.roadblock/);  // xe không tự đoán rào đang bật hay tắt
  });
});

/** Mặc định phải là tắt (kiểm riêng để không phụ thuộc thứ tự test). */
function roadblockActiveOff() {
  setRoadblock(false);
  return !roadBlocked(1, ROADBLOCK.road);
}
