// Lượt 42 — nút nhảy thật sự vượt được vật thấp (ghế đá, bàn nhựa, thùng rác, băng ngồi…),
// nhưng tường nhà vẫn chặn tuyệt đối dù đang bay cao.
import { describe, it, expect } from 'vitest';
import { World } from '../src/world/build';

/** Dựng một thế giới nhỏ: một tường cao và một vật thấp. */
function mk() {
  const w = new World();
  w.addBox({ x0: -1, z0: 4, x1: 1, z1: 6 });                 // tường cao (không có top)
  w.addBox({ x0: -1, z0: -6, x1: 1, z1: -4, top: 0.6 });     // ghế đá
  w.addCirc({ x: 5, z: 0, r: 0.36, top: 0.93 });             // thùng rác
  w.addCirc({ x: 9, z: 0, r: 1.2, top: 0.42 });              // bồn hoa công viên (vành cao 0,42 m)
  w.addCirc({ x: -9, z: 0, r: 2, top: 0.62, kind: 'trough' }); // thành hồ nước công viên
  return w;
}
const at = (w: World, x: number, z: number, feet: number) => { const o = { x, z }; w.resolve(x, z, 0.3, o, feet); return o; };

describe('nhảy qua vật thấp', () => {
  it('đứng dưới đất: ghế đá vẫn chặn như bình thường', () => {
    const w = mk();
    const o = at(w, 0, -5, 0);
    expect(o.x).toBe(-1.3);            // bị đẩy ra khỏi mép ghế
    const edge = at(w, 0, -3.85, 0);   // tới sát mép cũng bị đẩy ra
    expect(Math.abs(edge.z - -3.85)).toBeGreaterThan(0.05);
  });

  it('đang bay cao hơn nóc ghế (0,6 m) thì đi xuyên qua được', () => {
    const w = mk();
    const o = at(w, 0, -5, 0.9);
    expect(o.x).toBe(0);
    expect(o.z).toBe(-5);
  });

  it('bay chưa đủ cao thì vẫn bị chặn', () => {
    const w = mk();
    const o = at(w, 0, -5, 0.3);
    expect(o.x).toBe(-1.3);
  });

  it('tường cao chặn cả khi đang bay rất cao — không lọt vào nhà', () => {
    const w = mk();
    for (const feet of [0, 0.5, 1, 3, 10]) {
      const o = at(w, 0, 5, feet);
      expect(o.x, `feet=${feet}`).toBe(-1.3);
    }
  });

  it('thùng rác (vật tròn, cao 0,93) cũng nhảy qua được khi đủ cao', () => {
    const w = mk();
    expect(at(w, 5, 0, 0).x).not.toBe(5);
    expect(at(w, 5, 0, 1.0).x).toBe(5);
  });

  it('biết được nóc vật thấp để đáp xuống, tường cao thì không', () => {
    const w = mk();
    expect(w.lowTopAt(0, -5)).toBe(0.6);
    expect(w.lowTopAt(0, 5)).toBe(0);          // trên tường không có nóc để đứng
    expect(w.lowTopAt(20, 20)).toBe(0);        // giữa đường trống
  });

  it('nóc thùng rác đọc ra đúng chiều cao', () => {
    const w = mk();
    expect(w.lowTopAt(5, 0)).toBeCloseTo(0.93, 5);
  });

  it('mức 2 — đứng được trên nóc ghế đá, đi lại trên nóc không bị đẩy ra', () => {
    const w = mk();
    expect(w.lowTopAt(0, -5)).toBe(0.6);
    // đang ở độ cao nóc (0,6): resolve + blocked phải cho phép đi trên mặt ghế
    expect(w.blocked(0, -5, 0.28, 0.6)).toBe(false);
    const o = at(w, 0.5, -4.6, 0.6);
    expect(o.x).toBe(0.5); expect(o.z).toBe(-4.6);
  });

  it('mức 2 — supportAt: còn trên nóc mới đỡ, bước hụt ra ngoài thì trả 0 (rơi)', () => {
    const w = mk();
    expect(w.supportAt(0, -5, 0.6)).toBe(0.6);
    expect(w.supportAt(0, -5, 0.3)).toBe(0);      // đang thấp hơn nóc → không đứng trên được
    expect(w.supportAt(0, -2, 0.6)).toBe(0);      // ngoài mép ghế
  });

  it('mức 2 — thùng rác chỉ đỡ khi đứng thật trên miệng thùng', () => {
    const w = mk();
    expect(w.supportAt(5, 0, 0.93)).toBeCloseTo(0.93, 5);
    expect(w.supportAt(5.45, 0, 0.93)).toBe(0);   // quá mép miệng thùng thì trượt
  });

  it('bồn hoa công viên (0,42 m) nhảy qua được', () => {
    const w = mk();
    expect(at(w, 9, 0, 0).x).not.toBe(9);      // đi bộ thì bị chặn
    expect(at(w, 9, 0, 0.6).x).toBe(9);        // nhảy lên là qua
    expect(w.lowTopAt(9, 0)).toBeCloseTo(0.42, 5);
  });

  it('thành hồ nước nhảy qua được nhưng KHÔNG đứng được trên mặt nước', () => {
    const w = mk();
    expect(at(w, -9, 0, 0).x).not.toBe(-9);    // đi bộ bị chặn ở thành hồ
    expect(at(w, -9, 0, 0.9).x).toBe(-9);      // nhảy qua được
    expect(w.lowTopAt(-9, 0)).toBe(0);         // mặt nước không phải nóc để đứng
    expect(w.supportAt(-9, 0, 0.62)).toBe(0);
    expect(w.troughAt(-9, 0)).toBe(true);      // biết mình đang ở trong bồn nước
    expect(w.troughAt(9, 0)).toBe(false);      // bồn hoa thì không phải nước
  });
});
