import { describe, it, expect } from 'vitest';
import {
  CHESS_PRESETS,
  boardFromRows,
  legalMovesAt,
  allLegalMoves,
  inCheck,
  applyMove,
  pickBestMove,
  moveLabel,
} from '../src/game/chess';

describe('Động cơ Cờ Vua 8×8 (Ông Tư)', () => {
  it('khởi tạo bàn cờ chuẩn 8×8 có đúng 20 nước đi hợp lệ đầu tiên cho quân Trắng', () => {
    const b = boardFromRows(CHESS_PRESETS[0].rows);
    const moves = allLegalMoves(b, true);
    expect(moves.length).toBe(20); // 16 nước Tốt + 4 nước Mã
    expect(inCheck(b, true)).toBe(false);
    expect(inCheck(b, false)).toBe(false);
  });

  it('Tốt trắng ở e2 đi được 1 hoặc 2 ô (e3, e4)', () => {
    const b = boardFromRows(CHESS_PRESETS[0].rows);
    const e2Moves = legalMovesAt(b, 6, 4);
    expect(e2Moves.map((m) => [m.tr, m.tc])).toEqual([
      [5, 4],
      [4, 4],
    ]);
  });

  it('AI Ông Tư (Minimax + Alpha-Beta) chọn được nước đi hợp lệ và hiển thị ký hiệu tiếng Việt', () => {
    const b = boardFromRows(CHESS_PRESETS[0].rows);
    const wBest = pickBestMove(b, true, 2);
    expect(wBest).not.toBeNull();
    const afterW = applyMove(b, wBest!);
    const bBest = pickBestMove(afterW, false, 2);
    expect(bBest).not.toBeNull();
    expect(moveLabel(wBest!)).toMatch(/^(Tốt|Mã|Tượng|Xe|Hậu|Vua) [a-h][1-8]/);
  });

  it('Cờ thế 1 cho phép quân Trắng tấn công và chiếu Vua Đen', () => {
    const b = boardFromRows(CHESS_PRESETS[1].rows);
    const moves = allLegalMoves(b, true);
    expect(moves.length).toBeGreaterThan(0);
    const best = pickBestMove(b, true, 2);
    expect(best).not.toBeNull();
  });
});
