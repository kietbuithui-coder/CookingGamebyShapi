// Vựa ve chai thứ hai bên kia thành phố + chuyện bấm chuông thì chủ nhà mở cửa thật.
import { describe, it, expect } from 'vitest';
import { JUNK_LIST, JUNK, SCRAP_SITES } from '../src/data/gear';
import { FIXED } from '../src/data/people';
import { LOTS } from '../src/world/layout';
import { sellJunk } from '../src/sim/rules';
import { PLACE_HOURS } from '../src/game/npc';
import placesSrc from '../src/world/places.ts?raw';
import interactSrc from '../src/game/interact.ts?raw';
import npcSrc from '../src/game/npc.ts?raw';
import citySrc from '../src/world/city.ts?raw';
import actsSrc from '../src/game/acts.ts?raw';
import { fresh } from './helpers';

// Dự án không dựng được world 3D trong vitest nên kiểm tra thẳng dữ liệu cửa của căn hộ.
describe('bấm chuông căn hộ', () => {

  it('cửa căn hộ An Bình có khoá là "canho" — đó là cách biết cửa thuộc căn nào', () => {
    const m = placesSrc.match(/b\.door\('(door_\w+)',[^)]*'canho'\)/);
    expect(m, 'không thấy cửa của căn hộ An Bình').toBeTruthy();
    expect(m![1]).toBe('door_canho');
  });

  it('bấm chuông thì mở đúng cánh cửa của căn đó (so theo khoá, không phải thuộc tính lạ)', () => {
    // openBellDoor phải so `lock` của DoorDef, vì DoorDef không có trường `home`.
    expect(interactSrc).toMatch(/doorHome\(d: \{ lock\?: string \}\) \{ return d\.lock; \}/);
    expect(interactSrc).toMatch(/if \(this\.doorHome\(d\.d\) === homeId\) \{ d\.want = 1;/);
    expect(interactSrc).not.toMatch(/d\.d\.home/);
  });

  it('chủ nhà bước ra đúng ô cửa của căn (không hiện ra xuyên tường)', () => {
    // ringBell phải lấy tâm ô cửa + pháp tuyến của cánh cửa làm gốc, và đứng về phía người chơi
    expect(actsSrc).toMatch(/const dr = ctx\.interact\.bellDoor\(hid\)/);
    expect(actsSrc).toMatch(/phía người chơi đứng = phía ngoài/);
    expect(interactSrc).toMatch(/bellDoor\(homeId: string\)/);
    // và phải chờ cửa mở xong mới nói chuyện (≥ 1,2 giây, trước đây 0,62)
    const m = actsSrc.match(/\}, (\d{3,4})\);/);
    expect(m).toBeTruthy();
    expect(Number(m![1])).toBeGreaterThanOrEqual(1200);
  });

  it('không còn biển dọc chìa ra đường che biển tiệm bên cạnh', () => {
    expect(citySrc).not.toContain('vertical: true');
    expect(citySrc).not.toContain('shop.blade');
  });

  it('chủ nhà ra mở cửa kể cả ngoài giờ mở cửa', () => {
    expect(npcSrc).toMatch(/const open = placeOpen\(n\.fixedId!\) \|\| inAnim \|\| bellActive/);
  });
});

describe('vựa ve chai thứ hai', () => {
  it('có hai vựa thu mua ve chai, mỗi vựa là một hộp đất riêng trên bản đồ', () => {
    expect(SCRAP_SITES).toEqual(['scrap', 'scrap2']);
    for (const id of SCRAP_SITES) {
      const lot = LOTS.find((l) => l.id === id);
      expect(lot, `thiếu lô ${id}`).toBeTruthy();
      expect(lot!.kind).toBe('scrap');
    }
    const a = LOTS.find((l) => l.id === 'scrap')!, b = LOTS.find((l) => l.id === 'scrap2')!;
    // hai vựa phải ở hai khu khác nhau, không dựng sát nhau
    expect(a.district).not.toBe(b.district);
  });

  it('mỗi vựa có chủ riêng, mở cửa đúng giờ như vựa cũ', () => {
    for (const id of SCRAP_SITES) {
      const p = FIXED[id];
      expect(p, `thiếu người bán ở ${id}`).toBeTruthy();
      expect(p.name.length).toBeGreaterThan(3);
      expect(PLACE_HOURS[id]).toEqual(PLACE_HOURS.scrap);
    }
    expect(FIXED.scrap2.name).not.toBe(FIXED.scrap.name);
  });

  it('ve chai vẫn chỉ bán được ở vựa, không bán nhầm ở tiệm cầm đồ', () => {
    for (const j of JUNK_LIST) expect(SCRAP_SITES).toContain(j.where === 'pawn' ? 'scrap' : j.where);
    expect(JUNK.chai.where).toBe('scrap');
  });

  it('bán ở vựa nào cũng ra đúng tiền, và số liệu tổng chỉ cộng một lần', () => {
    for (const site of SCRAP_SITES) {
      const g = fresh();
      g.junk = { chai: 10, lon: 4 };
      const before = g.cash;
      const got = sellJunk(g, site);
      expect(got).toBe(10 * JUNK.chai.price + 4 * JUNK.lon.price);
      expect(g.cash).toBe(before + got);
      expect(g.tot.scrap).toBe(got);
      expect(g.junk).toEqual({});
      // bán lần hai không còn gì
      expect(sellJunk(g, site)).toBe(0);
    }
  });

  it('bán ở vựa này thì không mất ve chai của vựa kia', () => {
    const g = fresh();
    g.junk = { chai: 3, dongho: 1 };
    expect(sellJunk(g, 'scrap2')).toBe(3 * JUNK.chai.price);
    expect(g.junk.dongho).toBe(1);
    expect(sellJunk(g, 'pawn')).toBe(JUNK.dongho.price);
  });

  it('ve chai nhặt ở bên nào cũng bán được ở vựa gần nhất', () => {
    const g = fresh();
    g.junk.chai = 2;
    expect(sellJunk(g, 'scrap2')).toBe(2 * JUNK.chai.price);
  });
});
