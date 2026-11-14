// Công an phường: mức bị để ý, phạt hành chính, tạm giữ và lao động khổ sai.
import { describe, it, expect } from 'vitest';
import { SAVE_VERSION, migrate, newGame, absMin } from '../src/sim/state';
import { advance } from '../src/sim/rules';
import { addHeat, cool, shouldStop, fine, payFine, letGo, sentenceHours, jail, jailLeft, inJail, labour, release, HEAT_PUNCH, WANTED_ALERT } from '../src/sim/police';
import { LOTS } from '../src/world/layout';
import { fresh, IDLE } from './helpers';

const at = (g: ReturnType<typeof fresh>, minutes: number) => advance(g, minutes, IDLE);

describe('công an phường', () => {
  it('có đồn riêng trong thành phố', () => {
    const lot = LOTS.find((l) => l.kind === 'police');
    expect(lot).toBeTruthy();
    expect(lot!.id).toBe('police');
    expect(lot!.w).toBeGreaterThanOrEqual(6);
  });

  it('đấm người thì bị để ý, để lâu thì nguôi', () => {
    const g = fresh();
    expect(g.wanted).toBe(0);
    addHeat(g, HEAT_PUNCH);
    expect(g.wanted).toBe(HEAT_PUNCH);
    addHeat(g, HEAT_PUNCH);
    expect(g.wanted).toBe(HEAT_PUNCH * 2);
    addHeat(g, 999);
    expect(g.wanted).toBe(100);
    cool(g, 60);
    expect(g.wanted).toBeLessThan(100);
    cool(g, 10000);
    expect(g.wanted).toBe(0);
  });

  it('chỉ bị gọi lại khi vượt ngưỡng và không phải vừa nộp phạt xong', () => {
    const g = fresh();
    addHeat(g, WANTED_ALERT - 1);
    expect(shouldStop(g)).toBe(false);
    addHeat(g, 10);
    expect(shouldStop(g)).toBe(true);
    g.flags.policeCool = absMin(g) + 30;
    expect(shouldStop(g)).toBe(false);
  });

  it('tiền phạt theo mức bị để ý, tái phạm thì nặng hơn', () => {
    const g = fresh(); g.cash = 1000000;
    addHeat(g, 20);
    const once = fine(g);
    g.flags.jail = 2;
    expect(fine(g)).toBeGreaterThan(once);
    addHeat(g, 100);
    expect(fine(g)).toBeGreaterThan(once);
  });

  it('nộp phạt: trừ đúng tiền, hết bị để ý, có thời gian yên', () => {
    const g = fresh(); g.cash = 500000;
    addHeat(g, 80);
    const f = fine(g);
    expect(payFine(g)).toBe(true);
    expect(g.cash).toBe(500000 - f);
    expect(g.wanted).toBe(80 - 45);
    expect(shouldStop(g)).toBe(false);

    // nghèo thì không nộp nổi, tiền không bị trừ
    const poor = fresh(); poor.cash = 100; addHeat(poor, 80);
    expect(payFine(poor)).toBe(false);
    expect(poor.cash).toBe(100);
  });

  it('cãi được thì chỉ bị nhắc', () => {
    const g = fresh(); addHeat(g, 60);
    letGo(g);
    expect(g.wanted).toBe(45);
  });

  it('án tạm giữ theo mức bị để ý, tái phạm thì lâu hơn', () => {
    const g = fresh();
    addHeat(g, 20);
    const first = sentenceHours(g);
    expect(first).toBeGreaterThanOrEqual(2);
    g.flags.jail = 2;
    expect(sentenceHours(g)).toBeGreaterThan(first);
    addHeat(g, 100);
    expect(sentenceHours(g)).toBeLessThanOrEqual(12);
  });

  it('vào buồng: đếm ngược theo thời gian, hết hạn thì thả', () => {
    const g = fresh(); addHeat(g, 60);
    const hours = sentenceHours(g);
    jail(g, hours);
    expect(inJail(g)).toBe(true);
    expect(jailLeft(g)).toBe(hours * 60);
    expect(g.wanted).toBe(0);
    at(g, 60);
    expect(jailLeft(g)).toBe((hours - 1) * 60);
    at(g, 600);
    expect(inJail(g)).toBe(false);
  });

  it('đập đá: mỗi giờ bớt thêm một giờ, mất sức', () => {
    const g = fresh(); addHeat(g, 60); jail(g, 6);
    const before = jailLeft(g), hp = g.st.health, en = g.st.energy;
    at(g, 60);
    labour(g);
    expect(jailLeft(g)).toBe(before - 120);
    expect(g.st.health).toBeLessThan(hp);
    expect(g.st.energy).toBeLessThan(en);
    // ngoài buồng thì không lao động được
    const free = fresh();
    expect(labour(free)).toBe(false);
  });

  it('lao động mãi cũng không ra sớm hơn nửa tiếng', () => {
    const g = fresh(); addHeat(g, 100); jail(g, 1);
    at(g, 59);
    labour(g);
    expect(jailLeft(g)).toBeGreaterThanOrEqual(30);
  });

  it('hết hạn thì tinh thần, vệ sinh, uy tín đều tụt', () => {
    const g = fresh(); addHeat(g, 80); jail(g, 3); g.rep = 50;
    const m = g.st.mood, hy = g.st.hygiene, rep = g.rep;
    g.jailUntil = absMin(g);
    release(g);
    expect(g.st.mood).toBeLessThan(m);
    expect(g.st.hygiene).toBeLessThan(hy);
    expect(g.rep).toBeLessThan(rep);
    expect(inJail(g)).toBe(false);
    expect(g.jailUntil).toBe(0);
  });

  it('bản lưu cũ (v5) mở lên thì chưa bị công an để ý', () => {
    const raw = JSON.parse(JSON.stringify(newGame(5, 'anh')));
    raw.v = 5; delete raw.wanted; delete raw.jailUntil;
    const g = migrate(raw)!;
    expect(g.wanted).toBe(0);
    expect(g.jailUntil).toBe(0);
    expect(g.v).toBe(SAVE_VERSION);
  });
});
