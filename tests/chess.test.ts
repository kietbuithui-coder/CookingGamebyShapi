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
  drawReason,
  insufficientMaterial,
} from '../src/game/chess';

const play = (board: ReturnType<typeof boardFromRows>, from: [number, number], to: [number, number]) => {
  const found = legalMovesAt(board, ...from).find((m) => m.tr === to[0] && m.tc === to[1]);
  if (!found) throw new Error(`Không tìm thấy nước ${from} -> ${to}`);
  return applyMove(board, found);
};

describe('Động cơ Cờ Vua 8×8 (Ông Tư)', () => {
  it('khởi tạo bàn cờ chuẩn với 20 nước đi hợp lệ cho Trắng', () => {
    const b = boardFromRows(CHESS_PRESETS[0].rows);
    expect(allLegalMoves(b, true)).toHaveLength(20);
    expect(inCheck(b, true)).toBe(false);
    expect(inCheck(b, false)).toBe(false);
    expect(() => boardFromRows(['........'])).toThrow();
  });

  it('Tốt e2 đi được e3 và e4', () => {
    const b = boardFromRows(CHESS_PRESETS[0].rows);
    expect(legalMovesAt(b, 6, 4).map((m) => [m.tr, m.tc])).toEqual([[5, 4], [4, 4]]);
  });

  it('AI chọn nước hợp lệ và ghi ký hiệu nước đi tiếng Việt', () => {
    const b = boardFromRows(CHESS_PRESETS[0].rows);
    const whiteMove = pickBestMove(b, true, 2);
    expect(whiteMove).not.toBeNull();
    const afterWhite = applyMove(b, whiteMove!);
    const blackMove = pickBestMove(afterWhite, false, 2);
    expect(blackMove).not.toBeNull();
    expect(allLegalMoves(afterWhite, false)).toContainEqual(blackMove);
    expect(moveLabel(whiteMove!)).toMatch(/^(Tốt|Mã|Tượng|Xe|Hậu|Vua) [a-h][1-8]/);
  });

  it('các bàn cờ thế đều có nước hợp lệ và AI chọn được nước đi', () => {
    for (const preset of CHESS_PRESETS.slice(1)) {
      const b = boardFromRows(preset.rows);
      expect(allLegalMoves(b, true).length).toBeGreaterThan(0);
      expect(pickBestMove(b, true, 2)).not.toBeNull();
    }
  });

  it('nhập thành hai bên khi đủ điều kiện, đồng thời di chuyển Xe và thu hồi quyền', () => {
    const b = boardFromRows([
      '....k...', '........', '........', '........',
      '........', '........', '........', 'R...K..R',
    ]);
    const castles = legalMovesAt(b, 7, 4).filter((m) => m.castle);
    expect(castles.map((m) => m.castle)).toEqual(['K', 'Q']);
    const after = applyMove(b, castles[0]);
    expect(after[7][6]).toBe('K');
    expect(after[7][5]).toBe('R');
    expect(after[7][7]).toBe('');
    expect(after.meta.castling.wk).toBe(false);
    expect(after.meta.castling.wq).toBe(false);

    const rookMoved = play(b, [7, 7], [6, 7]);
    const rookReturned = play(rookMoved, [6, 7], [7, 7]);
    expect(legalMovesAt(rookReturned, 7, 4).some((m) => m.castle === 'K')).toBe(false);
  });

  it('không cho nhập thành khi Vua đang bị chiếu hoặc đi qua ô bị tấn công', () => {
    const attackedTransit = boardFromRows([
      '....kr..', '........', '........', '........',
      '........', '........', '........', '....K..R',
    ]);
    expect(legalMovesAt(attackedTransit, 7, 4).some((m) => m.castle === 'K')).toBe(false);

    const currentlyChecked = boardFromRows([
      '....r...', '........', '........', '........',
      '........', '........', '........', '....K..R',
    ]);
    expect(inCheck(currentlyChecked, true)).toBe(true);
    expect(legalMovesAt(currentlyChecked, 7, 4).some((m) => m.castle)).toBe(false);
  });

  it('bắt tốt qua đường chỉ được dùng ngay lượt kế tiếp', () => {
    const b = boardFromRows([
      '....k...', '...p....', '........', '....P...',
      '........', '........', '........', '....K...',
    ]);
    const afterDouble = play(b, [1, 3], [3, 3]);
    expect(afterDouble.meta.enPassant).toEqual([2, 3]);
    const ep = legalMovesAt(afterDouble, 3, 4).find((m) => m.enPassant);
    expect(ep?.cap).toBe('p');
    const afterEp = applyMove(afterDouble, ep!);
    expect(afterEp[2][3]).toBe('P');
    expect(afterEp[3][3]).toBe('');
    expect(afterEp.meta.enPassant).toBeNull();

    const declined = play(afterDouble, [7, 4], [7, 5]);
    expect(legalMovesAt(declined, 3, 4).some((m) => m.enPassant)).toBe(false);
  });

  it('không cho bắt Vua và lọc bắt tốt qua đường khiến Vua tự chiếu', () => {
    const noKingCapture = boardFromRows([
      'k.......', '........', '........', '........',
      '........', '........', '........', 'Q...K...',
    ]);
    expect(legalMovesAt(noKingCapture, 7, 0).some((m) => m.tr === 0 && m.tc === 0)).toBe(false);

    const pinnedEp = boardFromRows([
      '....k...', '...p....', '........', 'r...P..K',
      '........', '........', '........', '........',
    ]);
    const afterBlackDouble = play(pinnedEp, [1, 3], [3, 3]);
    expect(legalMovesAt(afterBlackDouble, 3, 4).some((m) => m.enPassant)).toBe(false);
  });

  it('cho phép phong cấp thành Hậu, Xe, Tượng hoặc Mã và ghi đúng tên quân', () => {
    const b = boardFromRows([
      '....k...', 'P.......', '........', '........',
      '........', '........', '........', '....K...',
    ]);
    const promos = legalMovesAt(b, 1, 0).filter((m) => m.tr === 0 && m.tc === 0);
    expect(promos.map((m) => m.promo)).toEqual(['Q', 'R', 'B', 'N']);
    expect(applyMove(b, promos[3])[0][0]).toBe('N');
    expect(moveLabel(promos[2])).toContain('(Phong Tượng)');
  });

  it('phát hiện hòa do thiếu quân, luật 50 nước và lặp thế cờ ba lần', () => {
    const bareKings = boardFromRows([
      '....k...', '........', '........', '........',
      '........', '........', '........', '....K...',
    ]);
    expect(insufficientMaterial(bareKings)).toBe(true);
    expect(drawReason(bareKings, true)).toBe('Hòa do không đủ quân chiếu bí');

    const live = boardFromRows([
      '....k...', '........', '........', '........',
      '........', '........', '........', '....K..R',
    ]);
    live.meta.halfmove = 99;
    const fifty = play(live, [7, 7], [6, 7]);
    expect(fifty.meta.halfmove).toBe(100);
    expect(drawReason(fifty, false)).toBe('Hòa theo luật 50 nước');
    fifty.meta.halfmove = 149;
    const seventyFive = play(fifty, [0, 4], [1, 4]);
    expect(drawReason(seventyFive, true)).toBe('Hòa tự động theo luật 75 nước');

    let repeated = boardFromRows(CHESS_PRESETS[0].rows);
    for (let i = 0; i < 2; i++) {
      repeated = play(repeated, [7, 6], [5, 5]);
      repeated = play(repeated, [0, 6], [2, 5]);
      repeated = play(repeated, [5, 5], [7, 6]);
      repeated = play(repeated, [2, 5], [0, 6]);
    }
    expect(Math.max(...Object.values(repeated.meta.repetitions))).toBe(3);
    expect(drawReason(repeated, true)).toBe('Hòa do lặp lại thế cờ');
    for (let i = 0; i < 2; i++) {
      repeated = play(repeated, [7, 6], [5, 5]);
      repeated = play(repeated, [0, 6], [2, 5]);
      repeated = play(repeated, [5, 5], [7, 6]);
      repeated = play(repeated, [2, 5], [0, 6]);
    }
    expect(Math.max(...Object.values(repeated.meta.repetitions))).toBe(5);
    expect(drawReason(repeated, true)).toBe('Hòa tự động do lặp lại thế cờ 5 lần');
    expect(pickBestMove(repeated, true)).toBeNull();
  });

  it('phát hiện thế hòa pat, khác với chiếu bí', () => {
    const stalemate = boardFromRows([
      'k.......', '..Q.....', '..K.....', '........',
      '........', '........', '........', '........',
    ]);
    expect(inCheck(stalemate, false)).toBe(false);
    expect(allLegalMoves(stalemate, false)).toHaveLength(0);
  });
});
