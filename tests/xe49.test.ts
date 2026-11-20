// Lượt 49 — người chơi: "sửa các xe sau cho chung kh xuất hiện từ chỗ kh hợp lí (chỗ gầm cầu là 1 ví dụ),
// thêm 3 màu cho xe và tiếng còi cảnh báo của xe hơi".
//
// Lỗi cũ: xe chỉ biết tâm tuyến (`CORR`) rồi đặt vào làn và chạy thẳng, trong khi mặt đường chỉ có trong
// z ∈ [−92; 92] / x ∈ [−96; 96]. Ngoài khoảng đó là bãi đất gầm cầu (z 94,5–107) và bờ kênh (z ≥ 108,4)
// → xe "mọc" từ gầm cầu và chạy xuyên bãi rác.
import { describe, it, expect } from 'vitest';
import { CORR, ROAD_HALF, MAP } from '../src/world/layout';
import { roadSpan, pickSpawn, inWasherGround, onRoad, ROAD_X_END, ROAD_Z_NORTH, ROAD_Z_SOUTH } from '../src/game/roads';
import { CARS, CAR_BY, CAR_EXTRA_COLORS } from '../src/data/cars';
import audioRaw from '../src/audio/audio.ts?raw';
import trafficRaw from '../src/game/traffic.ts?raw';

/** Máy ngẫu nhiên giả để kiểm thử tất định. */
function fakeRand(seed: number) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  return {
    chance: (p: number) => rnd() < p,
    range: (a: number, b: number) => a + rnd() * (b - a),
    pick: <T>(arr: T[]) => arr[Math.floor(rnd() * arr.length)],
  };
}

describe('xe không còn xuất hiện ở chỗ không có đường (lượt 49)', () => {
  it('bãi đất gầm cầu + bờ kênh bị nhận đúng là "không có đường"', () => {
    expect(inWasherGround(0, 100)).toBe(true);     // lều người chơi dưới gầm cầu (z ≈ 101,5)
    expect(inWasherGround(49, 101.5)).toBe(true);
    expect(inWasherGround(0, 120)).toBe(true);     // bờ kênh bên kia
    expect(inWasherGround(0, 88.5)).toBe(false);   // vẫn trên tuyến vành ngoài
    expect(inWasherGround(0, 30)).toBe(false);
  });

  it('không tuyến nào có mặt đường vượt qua bãi gầm cầu', () => {
    for (const axis of [0, 1] as const) for (const sign of [1, -1] as const) for (const road of CORR) {
      const sp = roadSpan(axis, sign, road);
      const hi = Math.max(sp.front, sp.back), lo = Math.min(sp.front, sp.back);
      expect(hi, `axis ${axis} sign ${sign} road ${road}`).toBeLessThanOrEqual(ROAD_Z_NORTH);
      expect(lo).toBeGreaterThanOrEqual(-ROAD_X_END);
    }
  });

  it('chạy dọc trục x thì được suốt thành phố, dọc trục z thì dừng ở mép ô phố', () => {
    expect(roadSpan(0, 1, CORR[1])).toEqual({ back: -ROAD_X_END, front: ROAD_X_END });
    expect(roadSpan(0, -1, CORR[1])).toEqual({ back: ROAD_X_END, front: -ROAD_X_END });
    expect(roadSpan(1, 1, CORR[1])).toEqual({ back: ROAD_Z_SOUTH, front: ROAD_Z_NORTH });
  });

  it('vành ngoài ±88,5 là đường cụt: phía nam dừng ở giao lộ cuối, không phóng ra bãi', () => {
    for (const road of [CORR[0], CORR[3]]) {
      const nam = roadSpan(1, 1, road);     // đi về phía nam (z tăng)
      expect(nam.front).toBe(ROAD_Z_NORTH);
      expect(nam.back).toBe(CORR[3]);       // chỉ được sinh từ giao lộ cuối trở lên
      expect(nam.back).toBeLessThan(nam.front);
    }
  });

  it('sinh 5.000 xe ở mọi hướng: 100 % nằm trên mặt đường thật', () => {
    const rand = fakeRand(99);
    let sinhRa = 0, ngoaiBang = 0, hoan = 0;
    for (let i = 0; i < 5000; i++) {
      const axis = rand.chance(0.5) ? 0 : 1;
      const sign = rand.chance(0.5) ? 1 : -1;
      // người chơi đứng nhiều chỗ khác nhau, kể cả sát gầm cầu
      const along = rand.range(-90, 88), across = rand.range(-90, 88);
      const sp = pickSpawn(axis as 0 | 1, sign as 1 | -1, along, across, rand);
      if (sp.pos === null) { hoan++; continue; }   // hoãn: chưa có chỗ hợp lệ thì không sinh
      const x = sp.axis === 0 ? sp.pos : sp.road + sp.lane * 0.9;
      const z = sp.axis === 0 ? sp.road : sp.pos;
      sinhRa++;
      if (!onRoad(x, z, 0.6) || inWasherGround(x, z)) ngoaiBang++;
    }
    expect(sinhRa).toBeGreaterThan(4800);   // gần như luôn có chỗ sinh
    expect(ngoaiBang).toBe(0);              // không một xe nào ngoài mặt đường
    expect(hoan).toBeLessThan(200);         // hoãn chỉ xảy ra khi người chơi đứng sát mép
  });

  it('không bao giờ sinh xe ngay trước mặt người chơi', () => {
    const rand = fakeRand(7);
    for (let i = 0; i < 800; i++) {
      const axis = (rand.chance(0.5) ? 0 : 1) as 0 | 1, sign = (rand.chance(0.5) ? 1 : -1) as 1 | -1;
      const along = rand.range(-85, 85), across = rand.range(-85, 85);
      const sp = pickSpawn(axis, sign, along, across, rand);
      if (sp.pos === null) continue;              // hoãn: không sinh xe nào cả
      const ahead = (sp.pos - along) * sign;      // >0 nghĩa là phía trước mặt
      // hoặc sau lưng, hoặc rất xa phía trước (ngoài tầm nhìn) — không bao giờ hiện ra sát mặt
      expect(ahead < 6 || ahead > 130).toBe(true);
    }
  });

  it('hệ xe dùng luật mới và chặn an toàn bãi gầm cầu', () => {
    expect(trafficRaw).toContain("from './roads'");
    expect(trafficRaw).toContain('pickSpawn(');
    expect(trafficRaw).toContain('roadSpan(');
    expect(trafficRaw).toContain('inWasherGround(x, z)');
  });
});

describe('ba màu sơn mới cho xe hơi (lượt 49)', () => {
  it('có đúng 3 màu mới, khác hẳn các màu cũ', () => {
    expect(CAR_EXTRA_COLORS.length).toBe(3);
    expect(new Set(CAR_EXTRA_COLORS).size).toBe(3);
    for (const c of CAR_EXTRA_COLORS) expect(c).toBeGreaterThan(0);
  });

  it('mọi mẫu xe hơi đều có ít nhất 6 màu (3 cũ + 3 mới)', () => {
    for (const car of CARS) {
      expect(car.colors.length, car.id).toBeGreaterThanOrEqual(6);
      expect(new Set(car.colors).size, car.id).toBe(car.colors.length);  // không trùng màu
    }
  });

  it('màu mới có mặt ở cả ba mẫu xe con', () => {
    for (const id of ['corolla', 'matiz', 'cd5'] as const) {
      for (const c of CAR_EXTRA_COLORS) expect(CAR_BY[id].colors, id).toContain(c);
    }
  });
});

describe('tiếng còi cảnh báo của xe hơi (lượt 49)', () => {
  it('mỗi mẫu xe có kiểu còi riêng', () => {
    expect(CAR_BY.matiz.horn).toBe('beep');    // xe nhỏ: bíp bíp
    expect(CAR_BY.corolla.horn).toBe('honk');  // sedan: bìm bìm
    expect(CAR_BY.truck.horn).toBe('truck');   // tải: bừm
  });

  it('bộ âm thanh có ba tiếng còi ô tô riêng, khác tiếng còi xe máy', () => {
    for (const n of ['horn_beep', 'horn_honk', 'horn_truck']) expect(audioRaw, n).toContain(`case '${n}'`);
    const beep = audioRaw.slice(audioRaw.indexOf("case 'horn_beep'"), audioRaw.indexOf("case 'horn_honk'"));
    const honk = audioRaw.slice(audioRaw.indexOf("case 'horn_honk'"), audioRaw.indexOf("case 'horn_truck'"));
    const truck = audioRaw.slice(audioRaw.indexOf("case 'horn_truck'"), audioRaw.indexOf('// ── đấm, nhảy, ngất, xe đụng ──'));
    // tần số khác nhau: xe nhỏ cao nhất, xe tải trầm nhất
    const f = (src: string) => Math.max(...[...src.matchAll(/T\((\d+(?:\.\d+)?),/g)].map((m) => +m[1]));
    expect(f(beep)).toBeGreaterThan(f(honk));
    expect(f(honk)).toBeGreaterThan(f(truck));
    // xe tải ngân dài hơn hai loại kia
    expect(truck).toMatch(/T\(196, 0\.42/);
  });

  it('xe hơi bấm còi riêng, xe máy/xe đạp vẫn dùng còi cũ', () => {
    expect(trafficRaw).toContain('hornOf');
    expect(trafficRaw).toMatch(/r\.car \? hornOf\(r\.car\) : 'horn'/);
    // còi kêu cả khi đứng gần lẫn khi va chạm
    expect((trafficRaw.match(/hornOf\(r\.car\)/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});
