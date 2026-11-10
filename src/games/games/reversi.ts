import type { Game, Outcome, Player } from './types';
import { other } from './types';

/** Реверсі: 8x8, гравець 0 — чорні (ходять першими). Якщо ходу немає, а в суперника є, хід пропускається автоматично. */
export interface ReversiState {
  board: (Player | null)[];
  turn: Player;
}
export type ReversiMove = number;

const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] as const;

export function flipsFor(board: (Player | null)[], cell: number, p: Player): number[] {
  if (board[cell] !== null) return [];
  const r0 = Math.floor(cell / 8), c0 = cell % 8;
  const out: number[] = [];
  for (const [dr, dc] of DIRS) {
    const line: number[] = [];
    let r = r0 + dr, c = c0 + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === other(p)) {
      line.push(r * 8 + c);
      r += dr; c += dc;
    }
    if (line.length && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === p) out.push(...line);
  }
  return out;
}

export function movesFor(board: (Player | null)[], p: Player): number[] {
  const m: number[] = [];
  for (let i = 0; i < 64; i++) if (flipsFor(board, i, p).length) m.push(i);
  return m;
}

export function counts(board: (Player | null)[]): [number, number] {
  let a = 0, b = 0;
  for (const c of board) { if (c === 0) a++; else if (c === 1) b++; }
  return [a, b];
}

const W = [
  100, -20, 10, 5, 5, 10, -20, 100,
  -20, -50, -2, -2, -2, -2, -50, -20,
  10, -2, 1, 1, 1, 1, -2, 10,
  5, -2, 1, 0, 0, 1, -2, 5,
  5, -2, 1, 0, 0, 1, -2, 5,
  10, -2, 1, 1, 1, 1, -2, 10,
  -20, -50, -2, -2, -2, -2, -50, -20,
  100, -20, 10, 5, 5, 10, -20, 100,
];

export const reversi: Game<ReversiState, ReversiMove> = {
  id: 'reversi',
  initial: () => {
    const board: (Player | null)[] = Array(64).fill(null);
    board[27] = 1; board[36] = 1; board[28] = 0; board[35] = 0;
    return { board, turn: 0 };
  },
  turn: (s) => s.turn,
  moves: (s) => movesFor(s.board, s.turn),
  apply: (s, m) => {
    const board = s.board.slice();
    for (const f of flipsFor(board, m, s.turn)) board[f] = s.turn;
    board[m] = s.turn;
    const next = other(s.turn);
    const turn = movesFor(board, next).length === 0 && movesFor(board, s.turn).length > 0 ? s.turn : next;
    return { board, turn };
  },
  outcome: (s): Outcome => {
    if (movesFor(s.board, 0).length || movesFor(s.board, 1).length) return { over: false, winner: null };
    const [a, b] = counts(s.board);
    return { over: true, winner: a > b ? 0 : b > a ? 1 : null };
  },
  score: (s) => {
    let v = 0;
    for (let i = 0; i < 64; i++) {
      if (s.board[i] === 0) v += W[i];
      else if (s.board[i] === 1) v -= W[i];
    }
    v += 4 * (movesFor(s.board, 0).length - movesFor(s.board, 1).length);
    return v;
  },
};
