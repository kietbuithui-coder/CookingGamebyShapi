// Động cơ Cờ Vua 8×8 (luật đi quân hợp lệ, kiểm tra chiếu/chiếu bí, thế cờ & AI Ông Tư dùng Minimax + cắt tỉa Alpha-Beta).

export type Piece = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | '';
export interface CastlingRights { wk: boolean; wq: boolean; bk: boolean; bq: boolean; }
export interface ChessMeta {
  castling: CastlingRights;
  enPassant: [number, number] | null;
  halfmove: number;
  repetitions: Record<string, number>;
}
// 8 hàng (r=0 là hàng 8 của Đen, r=7 là hàng 1 của Trắng) × 8 cột (c=0..7 là a..h).
export type Board = Piece[][] & { meta: ChessMeta };

export interface ChessMove {
  fr: number;
  fc: number;
  tr: number;
  tc: number;
  piece: Piece;
  cap: Piece;
  promo?: Piece;
  castle?: 'K' | 'Q';
  enPassant?: boolean;
}

export interface ChessPreset {
  id: string;
  name: string;
  desc: string;
  rows: string[];
}

export const CHESS_PRESETS: ChessPreset[] = [
  {
    id: 'standard',
    name: 'Ván chuẩn 8×8',
    desc: 'Bàn cờ vua tiêu chuẩn đủ 32 quân — chạm quân Trắng rồi chạm ô xanh trên bàn cờ để đấu trí với Ông Tư!',
    rows: [
      'rnbqkbnr',
      'pppppppp',
      '........',
      '........',
      '........',
      '........',
      'PPPPPPPP',
      'RNBQKBNR',
    ],
  },
  {
    id: 'puzzle1',
    name: 'Cờ thế 1: Song Xe vây thành',
    desc: 'Thế cờ công sát của Ông Tư — quân Trắng phối hợp Hậu và Xe chiếu bí chỉ trong 1–2 nước!',
    rows: [
      '....r.k.',
      '.....ppp',
      '........',
      '........',
      '........',
      '..Q.....',
      '.....PPP',
      '....R.K.',
    ],
  },
  {
    id: 'puzzle2',
    name: 'Cờ thế 2: Mã Tượng công sát',
    desc: 'Vua Đen đang kẹt ở góc h8 — hãy điều Hậu hoặc Mã Trắng tung đòn quyết định!',
    rows: [
      'r....rk.',
      'ppp..p.p',
      '...p..pQ',
      '....n...',
      '....P...',
      '..NB....',
      'PPP..PPP',
      'R....RK.',
    ],
  },
];

export function isWhite(p: Piece): boolean {
  return p !== '' && p === p.toUpperCase();
}

export function isBlack(p: Piece): boolean {
  return p !== '' && p === p.toLowerCase();
}

export function sameSide(a: Piece, b: Piece): boolean {
  if (!a || !b) return false;
  return isWhite(a) === isWhite(b);
}

function rawBoardFromRows(rows: string[]): Piece[][] {
  return rows.map((row) => row.split('').map((ch) => (ch === '.' ? '' : (ch as Piece))));
}

function positionKey(b: Piece[][], whiteToMove: boolean, meta: ChessMeta): string {
  const rows = b.map((row) => row.map((p) => p || '.').join('')).join('/');
  const c = meta.castling;
  const rights = `${c.wk ? 'K' : ''}${c.wq ? 'Q' : ''}${c.bk ? 'k' : ''}${c.bq ? 'q' : ''}` || '-';
  let ep = '-';
  if (meta.enPassant) {
    const [targetRow, targetCol] = meta.enPassant;
    const sourceRow = whiteToMove ? targetRow + 1 : targetRow - 1;
    const pawn = whiteToMove ? 'P' : 'p';
    if (sourceRow >= 0 && sourceRow < 8 && [-1, 1].some((dc) => b[sourceRow]?.[targetCol + dc] === pawn)) {
      ep = sqName(targetRow, targetCol);
    }
  }
  return `${rows} ${whiteToMove ? 'w' : 'b'} ${rights} ${ep}`;
}

export function boardFromRows(rows: string[]): Board {
  if (rows.length !== 8 || rows.some((row) => row.length !== 8)) throw new Error('Bàn cờ phải có đúng 8 hàng, mỗi hàng 8 ô.');
  const b = rawBoardFromRows(rows) as Board;
  b.meta = {
    castling: {
      wk: b[7][4] === 'K' && b[7][7] === 'R',
      wq: b[7][4] === 'K' && b[7][0] === 'R',
      bk: b[0][4] === 'k' && b[0][7] === 'r',
      bq: b[0][4] === 'k' && b[0][0] === 'r',
    },
    enPassant: null,
    halfmove: 0,
    repetitions: {},
  };
  b.meta.repetitions[positionKey(b, true, b.meta)] = 1;
  return b;
}

export function cloneBoard(b: Board): Board {
  const copy = b.map((r) => r.slice()) as Board;
  const meta = b.meta ?? { castling: { wk: false, wq: false, bk: false, bq: false }, enPassant: null, halfmove: 0, repetitions: {} };
  copy.meta = {
    castling: { ...meta.castling },
    enPassant: meta.enPassant ? [...meta.enPassant] : null,
    halfmove: meta.halfmove,
    repetitions: { ...meta.repetitions },
  };
  return copy;
}

export function findKing(b: Board, white: boolean): [number, number] | null {
  const target: Piece = white ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (b[r][c] === target) return [r, c];
    }
  }
  return null;
}

/** Kiểm tra ô (tr, tc) có đang bị phe `byWhite` tấn công không. */
export function isSquareAttacked(b: Board, tr: number, tc: number, byWhite: boolean): boolean {
  const pr = byWhite ? tr + 1 : tr - 1;
  const pawn: Piece = byWhite ? 'P' : 'p';
  if (pr >= 0 && pr < 8) {
    if (tc - 1 >= 0 && b[pr][tc - 1] === pawn) return true;
    if (tc + 1 < 8 && b[pr][tc + 1] === pawn) return true;
  }
  const knight: Piece = byWhite ? 'N' : 'n';
  const kMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of kMoves) {
    const r = tr + dr, c = tc + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r][c] === knight) return true;
  }
  const king: Piece = byWhite ? 'K' : 'k';
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = tr + dr, c = tc + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && b[r][c] === king) return true;
    }
  }
  const rook: Piece = byWhite ? 'R' : 'r';
  const queen: Piece = byWhite ? 'Q' : 'q';
  const ortho = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of ortho) {
    let r = tr + dr, c = tc + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = b[r][c];
      if (p) {
        if (p === rook || p === queen) return true;
        break;
      }
      r += dr; c += dc;
    }
  }
  const bishop: Piece = byWhite ? 'B' : 'b';
  const diag = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of diag) {
    let r = tr + dr, c = tc + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = b[r][c];
      if (p) {
        if (p === bishop || p === queen) return true;
        break;
      }
      r += dr; c += dc;
    }
  }
  return false;
}

export function inCheck(b: Board, white: boolean): boolean {
  const k = findKing(b, white);
  if (!k) return true;
  return isSquareAttacked(b, k[0], k[1], !white);
}

export function pseudoMovesAt(b: Board, fr: number, fc: number): ChessMove[] {
  const p = b[fr][fc];
  if (!p) return [];
  const w = isWhite(p);
  const up = p.toUpperCase();
  const out: ChessMove[] = [];

  const add = (tr: number, tc: number, special: Partial<ChessMove> = {}) => {
    const cap = special.enPassant ? b[fr][tc] : b[tr][tc];
    // Vua không bị ăn trực tiếp; ván kết thúc khi bên bị chiếu không còn nước hợp lệ.
    if (cap && cap.toUpperCase() === 'K') return;
    if (up === 'P' && (tr === 0 || tr === 7)) {
      for (const promo of (w ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n']) as Piece[]) {
        out.push({ fr, fc, tr, tc, piece: p, cap, ...special, promo });
      }
    } else {
      out.push({ fr, fc, tr, tc, piece: p, cap, ...special });
    }
  };

  if (up === 'P') {
    const dir = w ? -1 : 1;
    const startRank = w ? 6 : 1;
    const nr = fr + dir;
    if (nr >= 0 && nr < 8) {
      if (!b[nr][fc]) {
        add(nr, fc);
        const nr2 = fr + dir * 2;
        if (fr === startRank && !b[nr2][fc]) add(nr2, fc);
      }
      for (const dc of [-1, 1]) {
        const nc = fc + dc;
        if (nc < 0 || nc >= 8) continue;
        if (b[nr][nc] && !sameSide(p, b[nr][nc])) add(nr, nc);
        else if (b.meta?.enPassant?.[0] === nr && b.meta.enPassant[1] === nc && b[fr][nc] === (w ? 'p' : 'P')) {
          add(nr, nc, { enPassant: true });
        }
      }
    }
  } else if (up === 'N') {
    const jumps = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of jumps) {
      const r = fr + dr, c = fc + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8 && !sameSide(p, b[r][c])) add(r, c);
    }
  } else if (up === 'K') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const r = fr + dr, c = fc + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && !sameSide(p, b[r][c])) add(r, c);
      }
    }
    const home = w ? 7 : 0;
    const rights = b.meta?.castling;
    if (fr === home && fc === 4 && rights && !inCheck(b, w)) {
      const enemy = !w;
      const rook = w ? 'R' : 'r';
      if ((w ? rights.wk : rights.bk) && b[home][7] === rook && !b[home][5] && !b[home][6]
        && !isSquareAttacked(b, home, 5, enemy) && !isSquareAttacked(b, home, 6, enemy)) add(home, 6, { castle: 'K' });
      if ((w ? rights.wq : rights.bq) && b[home][0] === rook && !b[home][1] && !b[home][2] && !b[home][3]
        && !isSquareAttacked(b, home, 3, enemy) && !isSquareAttacked(b, home, 2, enemy)) add(home, 2, { castle: 'Q' });
    }
  } else {
    const dirs: [number, number][] = [];
    if (up === 'R' || up === 'Q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    if (up === 'B' || up === 'Q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    for (const [dr, dc] of dirs) {
      let r = fr + dr, c = fc + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = b[r][c];
        if (!target) {
          add(r, c);
        } else {
          if (!sameSide(p, target)) add(r, c);
          break;
        }
        r += dr; c += dc;
      }
    }
  }
  return out;
}

export function applyMove(b: Board, m: ChessMove): Board {
  const nb = cloneBoard(b);
  const moving = b[m.fr][m.fc];
  const captured = m.cap;
  nb[m.tr][m.tc] = m.promo ?? moving;
  nb[m.fr][m.fc] = '';
  if (m.enPassant) nb[m.fr][m.tc] = '';
  if (m.castle) {
    const row = isWhite(moving) ? 7 : 0;
    const rookFrom = m.castle === 'K' ? 7 : 0;
    const rookTo = m.castle === 'K' ? 5 : 3;
    nb[row][rookTo] = nb[row][rookFrom];
    nb[row][rookFrom] = '';
  }

  const rights = nb.meta.castling;
  if (moving === 'K') rights.wk = rights.wq = false;
  if (moving === 'k') rights.bk = rights.bq = false;
  if (moving === 'R' && m.fr === 7 && m.fc === 0) rights.wq = false;
  if (moving === 'R' && m.fr === 7 && m.fc === 7) rights.wk = false;
  if (moving === 'r' && m.fr === 0 && m.fc === 0) rights.bq = false;
  if (moving === 'r' && m.fr === 0 && m.fc === 7) rights.bk = false;
  if (captured === 'R' && m.tr === 7 && m.tc === 0) rights.wq = false;
  if (captured === 'R' && m.tr === 7 && m.tc === 7) rights.wk = false;
  if (captured === 'r' && m.tr === 0 && m.tc === 0) rights.bq = false;
  if (captured === 'r' && m.tr === 0 && m.tc === 7) rights.bk = false;

  nb.meta.enPassant = moving?.toUpperCase() === 'P' && Math.abs(m.tr - m.fr) === 2
    ? [(m.fr + m.tr) / 2, m.fc]
    : null;
  nb.meta.halfmove = moving?.toUpperCase() === 'P' || captured ? 0 : nb.meta.halfmove + 1;
  const nextWhite = !isWhite(moving);
  const key = positionKey(nb, nextWhite, nb.meta);
  nb.meta.repetitions[key] = (nb.meta.repetitions[key] ?? 0) + 1;
  return nb;
}

export function legalMovesAt(b: Board, fr: number, fc: number): ChessMove[] {
  const p = b[fr][fc];
  if (!p) return [];
  const w = isWhite(p);
  return pseudoMovesAt(b, fr, fc).filter((m) => !inCheck(applyMove(b, m), w));
}

export function allLegalMoves(b: Board, white: boolean): ChessMove[] {
  const moves: ChessMove[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p && isWhite(p) === white) moves.push(...legalMovesAt(b, r, c));
    }
  }
  return moves;
}

export function insufficientMaterial(b: Board): boolean {
  const pieces: { p: Piece; squareColor: number }[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = b[r][c];
    if (p && p.toUpperCase() !== 'K') pieces.push({ p, squareColor: (r + c) % 2 });
  }
  if (!pieces.length) return true;
  if (pieces.length === 1 && ['B', 'N'].includes(pieces[0].p.toUpperCase())) return true;
  return pieces.every(({ p }) => p.toUpperCase() === 'B') && new Set(pieces.map((x) => x.squareColor)).size === 1;
}

/** Áp dụng hòa theo 50 nước/3 lần lặp (có thể yêu cầu), cùng ngưỡng tự động 75 nước/5 lần lặp. */
export function drawReason(b: Board, whiteToMove: boolean): string | null {
  const repetitions = b.meta.repetitions[positionKey(b, whiteToMove, b.meta)] ?? 0;
  if (b.meta.halfmove >= 150) return 'Hòa tự động theo luật 75 nước';
  if (repetitions >= 5) return 'Hòa tự động do lặp lại thế cờ 5 lần';
  if (b.meta.halfmove >= 100) return 'Hòa theo luật 50 nước';
  if (repetitions >= 3) return 'Hòa do lặp lại thế cờ';
  if (insufficientMaterial(b)) return 'Hòa do không đủ quân chiếu bí';
  return null;
}

const VAL: Record<string, number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

export function evaluateBoard(b: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p) continue;
      const w = isWhite(p);
      const up = p.toUpperCase();
      let v = VAL[up] ?? 0;
      const centerBonus = (3.5 - Math.abs(3.5 - c)) * 4 + (3.5 - Math.abs(3.5 - r)) * 4;
      if (up === 'P') {
        const adv = w ? 6 - r : r - 1;
        v += adv * 12 + (3.5 - Math.abs(3.5 - c)) * 3;
      } else if (up === 'N' || up === 'B' || up === 'Q') {
        v += centerBonus * 2;
      } else if (up === 'R') {
        v += centerBonus;
      }
      score += w ? v : -v;
    }
  }
  return score;
}

function orderMoves(moves: ChessMove[]): ChessMove[] {
  return moves.slice().sort((a, b) => {
    const va = (a.cap ? VAL[a.cap.toUpperCase()] ?? 100 : 0) + (a.promo ? 800 : 0);
    const vb = (b.cap ? VAL[b.cap.toUpperCase()] ?? 100 : 0) + (b.promo ? 800 : 0);
    return vb - va;
  });
}

function minimax(b: Board, depth: number, alpha: number, beta: number, maximizingWhite: boolean): number {
  const moves = allLegalMoves(b, maximizingWhite);
  if (!moves.length) {
    if (inCheck(b, maximizingWhite)) return maximizingWhite ? -99999 - depth * 100 : 99999 + depth * 100;
    return 0;
  }
  if (drawReason(b, maximizingWhite)) return 0;
  if (depth <= 0) return evaluateBoard(b);

  const ordered = orderMoves(moves);
  if (maximizingWhite) {
    let best = -Infinity;
    for (const m of ordered) {
      const val = minimax(applyMove(b, m), depth - 1, alpha, beta, false);
      if (val > best) best = val;
      if (val > alpha) alpha = val;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of ordered) {
      const val = minimax(applyMove(b, m), depth - 1, alpha, beta, true);
      if (val < best) best = val;
      if (val < beta) beta = val;
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function pickBestMove(b: Board, white: boolean, depth = 2): ChessMove | null {
  if (drawReason(b, white)) return null;
  const moves = orderMoves(allLegalMoves(b, white));
  if (!moves.length) return null;
  let bestMove = moves[0];
  let bestVal = white ? -Infinity : Infinity;

  for (const m of moves) {
    const nb = applyMove(b, m);
    const val = minimax(nb, depth - 1, -Infinity, Infinity, !white);
    const jitter = (Math.sin(m.fr * 7 + m.fc * 13 + m.tr * 19 + m.tc * 23) - 0.5) * 3;
    const total = val + jitter;
    if (white ? total > bestVal : total < bestVal) {
      bestVal = total;
      bestMove = m;
    }
  }
  return bestMove;
}

const PIECE_VN: Record<string, string> = {
  K: 'Vua', Q: 'Hậu', R: 'Xe', B: 'Tượng', N: 'Mã', P: 'Tốt',
};

/** Vẽ SVG sắc nét cho từng quân cờ vua (không phụ thuộc font chữ hệ thống). */
export function pieceSvg(p: Piece): string {
  if (!p) return '';
  const w = isWhite(p);
  const fill = w ? '#fffdf5' : '#241e1a';
  const stroke = w ? '#22140a' : '#f7e6c4';
  const inner = w ? '#22140a' : '#f7e6c4';
  const up = p.toUpperCase();
  let shape = '';
  if (up === 'P') {
    shape = `<circle cx="16" cy="10" r="4.5"/><path d="M11 16c1-1.5 9-1.5 10 0l-1.5 6.5H12.5z"/><rect x="8.5" y="23.5" width="15" height="3.2" rx="1.2"/>`;
  } else if (up === 'R') {
    shape = `<path d="M9.5 7.5h3v2.5h2v-2.5h3v2.5h2v-2.5h3v5l-2 1.8v8.2h-9v-8.2l-2-1.8z"/><rect x="8" y="23.5" width="16" height="3.2" rx="1.2"/>`;
  } else if (up === 'N') {
    shape = `<path d="M11 22.5l1-6.5-3.2-2.2 1.2-4.3 3.5-1.5 1.5-2.2 2.2 1.8c3.2 1.2 4.8 4.8 4.2 9.5l-.6 5.4z"/><circle cx="14.2" cy="11.2" r="1.1" fill="${inner}" stroke="none"/><rect x="8" y="23.5" width="16" height="3.2" rx="1.2"/>`;
  } else if (up === 'B') {
    shape = `<circle cx="16" cy="6.2" r="1.8"/><path d="M16 8.2c-4.5 2.5-5.5 8.2-3.5 14.3h7c2-6.1 1-11.8-3.5-14.3z"/><path d="M14 13.5h4M16 11.5v4" stroke="${inner}" stroke-width="1.5"/><rect x="8" y="23.5" width="16" height="3.2" rx="1.2"/>`;
  } else if (up === 'Q') {
    shape = `<path d="M7.5 11l4 6.5 4.5-7 4.5 7 4-6.5-2.5 11.5h-12z"/><circle cx="7.5" cy="9.5" r="1.5"/><circle cx="16" cy="8.5" r="1.6"/><circle cx="24.5" cy="9.5" r="1.5"/><rect x="8" y="23.5" width="16" height="3.2" rx="1.2"/>`;
  } else {
    shape = `<path d="M16 4.2v4.6M13.8 6.4h4.4" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/><path d="M9.5 12.5c0-3 3-4.2 6.5-4.2s6.5 1.2 6.5 4.2l-2 10h-9z"/><rect x="8" y="23.5" width="16" height="3.2" rx="1.2"/>`;
  }
  return `<svg class="chess-svg" viewBox="0 0 32 30" fill="${fill}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round" style="color-scheme:light;forced-color-adjust:none">${shape}</svg>`;
}

export function sqName(r: number, c: number): string {
  return String.fromCharCode(97 + c) + (8 - r);
}

export function moveLabel(m: ChessMove): string {
  const pName = PIECE_VN[m.piece.toUpperCase()] ?? 'Quân';
  const act = m.cap ? 'ăn' : 'qua';
  const promoName = m.promo ? PIECE_VN[m.promo.toUpperCase()] : '';
  return `${pName} ${sqName(m.fr, m.fc)} ${act} ${sqName(m.tr, m.tc)}${promoName ? ` (Phong ${promoName})` : ''}`;
}
