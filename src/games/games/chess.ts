import { Chess } from 'chess.js';
import type { Game, Outcome, Player } from './types';

/** Шахи: правила з бібліотеки chess.js. Пішак, що дійшов до краю, завжди стає ферзем (для малюків). */
export interface ChessMove {
  from: string;
  to: string;
  promotion?: 'q';
  capture: boolean;
}

export type ChessState = Chess;

const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

export const chessGame: Game<ChessState, ChessMove> = {
  id: 'chess',
  initial: () => new Chess(),
  turn: (s) => (s.turn() === 'w' ? 0 : 1) as Player,
  moves: (s) =>
    s
      .moves({ verbose: true })
      .filter((m) => !m.promotion || m.promotion === 'q')
      .map((m) => ({ from: m.from, to: m.to, promotion: m.promotion as 'q' | undefined, capture: m.isCapture() })),
  apply: (s, m) => {
    const next = new Chess(s.fen());
    next.move({ from: m.from, to: m.to, promotion: m.promotion });
    return next;
  },
  outcome: (s): Outcome => {
    if (s.isCheckmate()) return { over: true, winner: s.turn() === 'w' ? 1 : 0 };
    if (s.isDraw() || s.isStalemate()) return { over: true, winner: null };
    return { over: false, winner: null };
  },
  score: (s) => {
    let v = 0;
    const board = s.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        const sign = p.color === 'w' ? 1 : -1;
        let val = VALUE[p.type];
        const centre = 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5));
        if (p.type === 'n' || p.type === 'b') val += centre * 6;
        if (p.type === 'p') {
          const advance = p.color === 'w' ? 6 - r : r - 1;
          val += advance * 6 + centre * 3;
        }
        v += sign * val;
      }
    }
    return v;
  },
  order: (_s, moves) => [...moves].sort((a, b) => Number(b.capture) - Number(a.capture)),
};
