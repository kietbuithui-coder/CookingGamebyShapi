export default [
  {
    label: 'Vào ván mới và mở bàn cờ Ông Tư',
    waitFor: () => !!document.querySelector('[data-m="new"]'),
  },
  {
    eval: () => {
      document.getElementById('rotok')?.click();
      __game.newGame('anh');
      __game.ui.closeDialog();
      const ongTu = __game.npcs.list.find((n) => n.id === 'ongtu') || __game.npcs.list[0];
      __game.anim.startChess(ongTu, 0);
      return {
        squares: document.querySelectorAll('.chess-sq').length,
        turn: __game.anim.chessTurn,
      };
    },
  },
  {
    label: 'Kiểm tra màu SVG Trắng/Đen và bố cục không đè nút',
    eval: () => {
      const wSvg = document.querySelector('.chess-p.w .chess-svg');
      const bSvg = document.querySelector('.chess-p.b .chess-svg');
      const wStyle = wSvg ? getComputedStyle(wSvg) : null;
      const bStyle = bSvg ? getComputedStyle(bSvg) : null;
      const wrap = document.querySelector('.chess-wrap')?.getBoundingClientRect();
      const top = document.querySelector('#cook .top')?.getBoundingClientRect();
      const btns = document.querySelector('#cook .btns')?.getBoundingClientRect();
      const overlap = (a, b) => !!(a && b && a.width > 0 && b.width > 0 && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
      return {
        wFill: wStyle?.fill,
        bFill: bStyle?.fill,
        distinctColors: wStyle?.fill !== bStyle?.fill,
        viewport: [window.innerWidth, window.innerHeight],
        wrapRect: wrap ? [Math.round(wrap.left), Math.round(wrap.top), Math.round(wrap.right), Math.round(wrap.bottom)] : null,
        overlapTop: overlap(wrap, top),
        overlapBtns: overlap(wrap, btns),
      };
    },
    shot: 'chess_start',
  },
  {
    label: 'Chạm e2 → e4 và chờ Ông Tư đáp lại',
    tapsEval: () => {
      const e2 = document.querySelector('.chess-sq[data-r="6"][data-c="4"]')?.getBoundingClientRect();
      const e4 = document.querySelector('.chess-sq[data-r="4"][data-c="4"]')?.getBoundingClientRect();
      return [
        [e2.left + e2.width / 2, e2.top + e2.height / 2],
        [e4.left + e4.width / 2, e4.top + e4.height / 2],
      ];
    },
    gap: 180,
  },
  {
    waitFor: () => __game.anim.chessTurn === 'w' && __game.anim.chessLog.length === 1 && __game.anim.chessLog[0].includes('Ông Tư:'),
    timeout: 8000,
  },
  {
    eval: () => ({
      turn: __game.anim.chessTurn,
      log: __game.anim.chessLog,
      e4: __game.anim.chessBoard[4][4],
    }),
  },
  {
    label: 'Kiểm tra phong cấp (chọn Tượng) bằng chạm',
    eval: () => {
      const b = __game.anim.chessBoard;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) b[r][c] = '';
      b[0][4] = 'k';
      b[1][7] = 'p';
      b[1][0] = 'P';
      b[7][4] = 'K';
      b.meta.castling = { wk: false, wq: false, bk: false, bq: false };
      b.meta.enPassant = null;
      b.meta.halfmove = 0;
      b.meta.repetitions = {};
      __game.anim.chessSel = null;
      __game.anim.chessLegal = [];
      __game.anim.chessPendingPromo = null;
      __game.anim.chessTurn = 'w';
      __game.anim.renderChessUI();
      return true;
    },
  },
  {
    tapsEval: () => {
      const a7 = document.querySelector('.chess-sq[data-r="1"][data-c="0"]')?.getBoundingClientRect();
      const a8 = document.querySelector('.chess-sq[data-r="0"][data-c="0"]')?.getBoundingClientRect();
      return [
        [a7.left + a7.width / 2, a7.top + a7.height / 2],
        [a8.left + a8.width / 2, a8.top + a8.height / 2],
      ];
    },
    gap: 180,
  },
  {
    eval: () => {
      const btns = Array.from(document.querySelectorAll('.chess-promo'));
      const firstSvg = btns[0]?.querySelector('.chess-svg');
      return {
        promoCount: btns.length,
        labels: btns.map((x) => x.textContent.trim()),
        promoFill: firstSvg ? getComputedStyle(firstSvg).fill : null,
      };
    },
    shot: 'chess_promo',
  },
  {
    tapsEval: () => {
      const bishopBtn = document.querySelector('.chess-promo[data-promo="2"]')?.getBoundingClientRect();
      return [[bishopBtn.left + bishopBtn.width / 2, bishopBtn.top + bishopBtn.height / 2]];
    },
  },
  {
    waitFor: () => __game.anim.chessTurn === 'w' && __game.anim.chessBoard[0][0] === 'B',
    timeout: 8000,
  },
  {
    eval: () => ({
      promotedAtA8: __game.anim.chessBoard[0][0],
      turnAfterPromo: __game.anim.chessTurn,
    }),
  },
  {
    label: 'Kiểm tra chiếu bí rồi Đi lại 1 nước phải xóa hint hết ván',
    eval: () => {
      const b = __game.anim.chessBoard;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) b[r][c] = '';
      b[0][7] = 'k';
      b[2][6] = 'K';
      b[1][0] = 'Q';
      b.meta.castling = { wk: false, wq: false, bk: false, bq: false };
      b.meta.enPassant = null;
      b.meta.halfmove = 0;
      b.meta.repetitions = {};
      __game.anim.chessSel = null;
      __game.anim.chessLegal = [];
      __game.anim.chessPendingPromo = null;
      __game.anim.chessTurn = 'w';
      __game.anim.renderChessUI();
      return true;
    },
  },
  {
    tapsEval: () => {
      const qa7 = document.querySelector('.chess-sq[data-r="1"][data-c="0"]')?.getBoundingClientRect();
      const g7 = document.querySelector('.chess-sq[data-r="1"][data-c="6"]')?.getBoundingClientRect();
      return [
        [qa7.left + qa7.width / 2, qa7.top + qa7.height / 2],
        [g7.left + g7.width / 2, g7.top + g7.height / 2],
      ];
    },
    gap: 180,
  },
  {
    eval: () => ({
      turnAfterMate: __game.anim.chessTurn,
      endReasonAfterMate: __game.anim.chessEndReason,
      hintAfterMate: document.querySelector('#cook .hint')?.textContent,
    }),
    shot: 'chess_mate',
  },
  {
    tapsEval: () => {
      const undoBtn = Array.from(document.querySelectorAll('#cook .btns .btn')).find((b) => b.textContent.includes('Đi lại'))?.getBoundingClientRect();
      return [[undoBtn.left + undoBtn.width / 2, undoBtn.top + undoBtn.height / 2]];
    },
  },
  {
    eval: () => ({
      turnAfterUndo: __game.anim.chessTurn,
      hintAfterUndo: document.querySelector('#cook .hint')?.textContent,
    }),
  },
  {
    label: 'Kiểm tra nút Yêu cầu hòa theo luật 50 nước',
    eval: () => {
      const b = __game.anim.chessBoard;
      b.meta.halfmove = 100;
      __game.anim.renderChessUI();
      const btns = Array.from(document.querySelectorAll('#cook .btns .btn')).map((x) => x.textContent.trim());
      return {
        btns,
        hint: document.querySelector('#cook .hint')?.textContent,
      };
    },
  },
  {
    tapsEval: () => {
      const drawBtn = Array.from(document.querySelectorAll('#cook .btns .btn')).find((b) => b.textContent.includes('Yêu cầu hòa'))?.getBoundingClientRect();
      return [[drawBtn.left + drawBtn.width / 2, drawBtn.top + drawBtn.height / 2]];
    },
  },
  {
    eval: () => ({
      turnAfterClaim: __game.anim.chessTurn,
      endReason: __game.anim.chessEndReason,
      hintAfterClaim: document.querySelector('#cook .hint')?.textContent,
    }),
  },
];
