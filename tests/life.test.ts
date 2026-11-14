// Lượt 11 — sinh hoạt của phố: giờ cao điểm, chỗ đông theo giờ, lịch của từng nhóm người, câu chào.
import { describe, it, expect } from 'vitest';
import { GREET_GAP, GREET_NEAR, RUSH, crowdWeight, greetKind, routineFor, rushMul, voicePitch } from '../src/sim/life';
import { ARCH } from '../src/data/people';
import { LINES } from '../src/data/people';

describe('sinh hoạt của phố', () => {
  it('giờ cao điểm đi nhanh hơn, khuya thì lững thững', () => {
    expect(RUSH.length).toBe(2);
    expect(rushMul(7)).toBeGreaterThan(1);          // sáng đi làm
    expect(rushMul(17)).toBeGreaterThan(1);         // chiều tan tầm
    expect(rushMul(12)).toBe(1);                    // trưa thì bình thường
    expect(rushMul(23)).toBeLessThan(1);            // khuya vắng, đi chậm
    expect(rushMul(3)).toBeLessThan(1);
  });

  it('chợ đông buổi sáng, quán đông buổi trưa, công viên đông lúc chiều tối', () => {
    expect(crowdWeight('market', 7)).toBeGreaterThan(crowdWeight('market', 20));
    expect(crowdWeight('stall', 12)).toBeGreaterThan(crowdWeight('stall', 8));
    expect(crowdWeight('park', 18)).toBeGreaterThan(crowdWeight('park', 12));
    expect(crowdWeight('bench', 19)).toBeGreaterThan(crowdWeight('bench', 9));
    expect(crowdWeight('school', 7)).toBeGreaterThan(crowdWeight('school', 21));
    expect(crowdWeight('office', 8)).toBeGreaterThan(crowdWeight('office', 20));
  });

  it('mỗi nhóm người có ba chỗ hay lui tới, đúng giờ đúng chỗ', () => {
    // học sinh: sáng tới trường, chiều ra quán vặt / công viên
    expect(routineFor('hocsinh', 7)[0]).toBe('school');
    expect(routineFor('hocsinh', 18)).toContain('park');
    // công nhân: sáng ra chợ, tan ca ghé quán
    expect(routineFor('congnhan', 6)[0]).toBe('market');
    expect(routineFor('congnhan', 19)[0]).toBe('stall');
    // người lớn tuổi thì quanh quẩn công viên, ghế đá
    expect(routineFor('nguoigia', 15)).toEqual(['bench', 'park', 'stall']);
    // vô gia cư: ban ngày lân la chợ, tối về gầm cầu
    expect(routineFor('vogiacu', 20)[0]).toBe('camp');
    expect(routineFor('vogiacu', 9)).not.toBe('camp');
    // nhóm nào cũng phải có chỗ để đi, không ai trả về danh sách rỗng
    for (const id of Object.keys(ARCH)) for (const h of [6, 9, 12, 15, 18, 21]) {
      const r = routineFor(id as keyof typeof ARCH, h);
      expect(r.length).toBeGreaterThanOrEqual(2);
      expect(new Set(r).size).toBe(r.length);
    }
  });

  it('quen mặt thì chào thân trước, rồi mới tới mưa nắng và giờ giấc', () => {
    expect(greetKind({ hour: 8, rain: 0, weather: 'nang', rep: 20, met: true })).toBe('known');
    // uy tín còn thấp thì chưa tính là quen, vẫn chào theo trời
    expect(greetKind({ hour: 8, rain: 0.6, weather: 'muato', rep: 0, met: true })).toBe('rain');
    expect(greetKind({ hour: 12, rain: 0, weather: 'nong', rep: 3, met: false })).toBe('hot');
    expect(greetKind({ hour: 12, rain: 0, weather: 'lanh', rep: 3, met: false })).toBe('cold');
    expect(greetKind({ hour: 7, rain: 0, weather: 'nang', rep: 0, met: false })).toBe('morning');
    expect(greetKind({ hour: 12, rain: 0, weather: 'nang', rep: 0, met: false })).toBe('noon');
    expect(greetKind({ hour: 17, rain: 0, weather: 'nang', rep: 0, met: false })).toBe('evening');
    expect(greetKind({ hour: 21, rain: 0, weather: 'nang', rep: 0, met: false })).toBe('night');
  });

  it('câu chào có đủ cho tám kiểu, câu nào cũng dùng được cho mọi nhóm người', () => {
    const kinds = ['known', 'rain', 'cold', 'hot', 'morning', 'noon', 'evening', 'night'] as const;
    for (const k of kinds) { expect(LINES.greet[k].length).toBeGreaterThanOrEqual(2); }
    // chỉ dùng {self}/{you}/{ac} — nhóm người nào thay vào cũng thành câu
    for (const k of kinds) for (const line of LINES.greet[k]) expect(line).not.toMatch(/\{[a-z]+\}/i.source ? /\{(?!self\}|you\}|ac\}|Self\}|You\})/ : /$^/);
    expect(GREET_NEAR).toBeGreaterThan(3);
    expect(GREET_GAP).toBeGreaterThanOrEqual(30);
    expect(LINES.cheer.win.length).toBeGreaterThan(1);
    expect(LINES.cheer.lose.length).toBeGreaterThan(1);
  });

  it('cao độ giọng nói: nữ cao hơn nam, người nhỏ con cao hơn người tầm vóc lớn', () => {
    expect(voicePitch(true, 1)).toBeGreaterThan(voicePitch(false, 1));
    expect(voicePitch(false, 0.85)).toBeGreaterThan(voicePitch(false, 1.05));
    for (const fem of [true, false]) for (const size of [0.8, 1, 1.1]) {
      const p = voicePitch(fem, size);
      expect(Number.isFinite(p)).toBe(true);
      expect(p).toBeGreaterThan(100); expect(p).toBeLessThan(320);
    }
    // giọng không đổi theo thời gian: cùng người, cùng cao độ
    expect(voicePitch(true, 0.9)).toBe(voicePitch(true, 0.9));
  });
});
