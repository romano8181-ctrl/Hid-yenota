import type { Game, Outcome, Player } from './types';
import { other } from './types';

export interface TttState {
  board: (Player | null)[];
  turn: Player;
}

export type TttMove = number;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function winningLine(board: (Player | null)[]): number[] | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

export const ticTacToe: Game<TttState, TttMove> = {
  id: 'tictactoe',
  initial: () => ({ board: Array(9).fill(null), turn: 0 }),
  turn: (s) => s.turn,
  moves: (s) => {
    if (winningLine(s.board)) return [];
    const m: number[] = [];
    s.board.forEach((c, i) => { if (c === null) m.push(i); });
    return m;
  },
  apply: (s, m) => {
    const board = s.board.slice();
    board[m] = s.turn;
    return { board, turn: other(s.turn) };
  },
  outcome: (s): Outcome => {
    const line = winningLine(s.board);
    if (line) return { over: true, winner: s.board[line[0]] };
    if (s.board.every((c) => c !== null)) return { over: true, winner: null };
    return { over: false, winner: null };
  },
  score: () => 0,
};
