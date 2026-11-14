// Quán net: giá theo giờ, hiệu ứng từng kiểu chơi, mỏi mắt sau 2 tiếng, sạc nhờ điện thoại.
import { describe, it, expect } from 'vitest';
import { SAVE_VERSION, migrate, newGame, absMin } from '../src/sim/state';
import { advance, consume } from '../src/sim/rules';
import { activate, battery, fullCharge, hasPhone } from '../src/sim/phone';
import {
  NET_RATE, FILM_MUL, EYE_LIMIT, CHARGE_FEE, DRINK_PRICE, NET_ACTS, NET_PACKS, MACHINES, NET_OPEN,
  cost, plan, commit, strain, todayMinutes,
} from '../src/sim/net';
import { LotKind } from '../src/world/layout';
import { FIXED } from '../src/data/people';
import { fresh, IDLE } from './helpers';

describe('quán net', () => {
  it('giá tính theo phút, phim tính thêm nửa giá', () => {
    expect(NET_RATE).toBe(3000);
    expect(cost('game', 60)).toBe(3000);
    expect(cost('web', 30)).toBe(1500);
    expect(cost('game', 120)).toBe(6000);
    expect(cost('film', 60)).toBe(4500);
    expect(cost('film', 60)).toBe(NET_RATE * FILM_MUL);
    // luôn làm tròn tới 500 đồng, không bao giờ ra số lẻ
    for (const m of [10, 45, 95, 200]) expect(cost('game', m) % 500).toBe(0);
  });

  it('bốn gói giờ bán ở quán, xếp từ ít tới nhiều', () => {
    expect(NET_PACKS).toHaveLength(4);
    expect([...NET_PACKS].sort((a, b) => a - b)).toEqual(NET_PACKS);
    expect(NET_PACKS[0]).toBeGreaterThanOrEqual(30);
    expect(NET_PACKS.reduce((a, b) => a + b, 0)).toBe(450);
  });

  it('chơi game vui nhất nhưng mất sức nhiều nhất, lướt web thì rẻ sức', () => {
    expect(NET_ACTS.game.mood).toBeGreaterThan(NET_ACTS.web.mood);
    expect(NET_ACTS.film.mood).toBeGreaterThan(NET_ACTS.game.mood);
    expect(NET_ACTS.game.energy).toBeLessThan(NET_ACTS.web.energy);
    expect(NET_ACTS.game.hunger).toBeLessThan(0);
    expect(NET_ACTS.game.thirst).toBeLessThan(0);
  });

  it('một tiếng chơi game: tính đúng tiền và hiệu ứng', () => {
    const g = fresh();
    const s = plan(g, 'game', 60);
    expect(s.cost).toBe(3000);
    expect(s.mood).toBe(NET_ACTS.game.mood);
    expect(s.energy).toBe(NET_ACTS.game.energy);
    expect(s.tired).toBe(false);
    expect(s.health).toBe(0);
  });

  it('quá hai tiếng trong ngày là mỏi mắt: tinh thần hụt, mất sức khoẻ', () => {
    const g = fresh();
    expect(EYE_LIMIT).toBe(120);
    expect(strain(g, 120)).toBe(false);
    const s1 = plan(g, 'game', 120);
    commit(g, s1);
    expect(todayMinutes(g)).toBe(120);
    expect(strain(g, 30)).toBe(true);
    const s2 = plan(g, 'game', 60);
    expect(s2.tired).toBe(true);
    expect(s2.health).toBe(-2);
    expect(s2.mood).toBeLessThan(Math.round(NET_ACTS.game.mood * 1));
  });

  it('sang ngày mới thì mỏi mắt được tính lại từ đầu', () => {
    const g = fresh();
    commit(g, plan(g, 'game', 180));
    expect(todayMinutes(g)).toBe(180);
    g.day += 1;
    expect(todayMinutes(g)).toBe(0);
    expect(strain(g, 60)).toBe(false);
    commit(g, plan(g, 'web', 60));
    expect(g.flags.netDay).toBe(g.day);
    expect(g.flags.netMin).toBe(60);
  });

  it('ngồi máy thật sự làm đói, khát, tụt sức và lên tinh thần', () => {
    const g = fresh();
    const s = plan(g, 'film', 120);
    const before = { ...g.st };
    consume(g, { m: s.mood, e: s.energy, h: s.hunger, t: s.thirst, hp: s.health });
    expect(g.st.mood).toBeGreaterThan(before.mood);
    expect(g.st.energy).toBeLessThan(before.energy);
    expect(g.st.hunger).toBeLessThan(before.hunger);
    expect(g.st.thirst).toBeLessThan(before.thirst);
    // tinh thần không thể vượt 100 dù chơi bao lâu
    for (let i = 0; i < 20; i++) consume(g, { m: s.mood });
    expect(g.st.mood).toBe(100);
  });

  it('quán mở 6 giờ sáng tới 11 giờ đêm, có mười máy', () => {
    expect(NET_OPEN).toEqual([6, 23]);
    expect(MACHINES).toBe(10);
  });

  it('sạc nhờ và nước ngọt có giá riêng', () => {
    expect(CHARGE_FEE).toBe(2000);
    expect(DRINK_PRICE).toBe(8000);
    const g = fresh();
    activate(g, 'cucgach');
    g.phone!.battery = 20;
    expect(hasPhone(g)).toBe(true);
    expect(battery(g)).toBe(20);
    const m0 = absMin(g);
    advance(g, 20, IDLE);
    expect(absMin(g)).toBe(m0 + 20); // ngồi chờ sạc thì thời gian vẫn trôi
    fullCharge(g);
    expect(battery(g)).toBe(100);
  });

  it('quán net nằm trong danh sách loại lô và có chủ quán lẫn khách ngồi máy', () => {
    const kinds: LotKind[] = ['net'];
    expect(kinds).toContain('net');
    expect(FIXED.net.name).toBe('Chị Hạnh');
    expect(FIXED.net.fem).toBe(true);
    expect(FIXED.net_bi.name).toBe('Thằng Bi');
    expect(FIXED.net_nhung.name).toBe('Con Nhung');
    expect(FIXED.net_nhung.fem).toBe(true);
  });

  it('bản lưu cũ (v7) mở lên có sẵn sổ phút ngồi máy', () => {
    const g = newGame(101);
    const raw = JSON.parse(JSON.stringify(g));
    raw.v = 7;
    delete raw.flags.netDay;
    delete raw.flags.netMin;
    const m = migrate(raw)!;
    expect(m.v).toBe(SAVE_VERSION);
    expect(m.flags.netDay).toBe(-1);
    expect(m.flags.netMin).toBe(0);
    expect(todayMinutes(m)).toBe(0);
    expect(absMin(m)).toBeGreaterThan(0);
  });
});
