import type { Game, Outcome, Player } from './types';
import { other } from './types';

/** Чотири в ряд: 7 стовпців, 6 рядів. Хід — номер стовпця. Рядок 0 — верх дошки. */
export const COLS = 7;
export const ROWS = 6;

export interface C4State {
  board: (Player | null)[];
  turn: Player;
}
export type C4Move = number;

const at = (b: (Player | null)[], r: number, c: number) => b[r * COLS + c];

const WINDOWS: number[][] = (() => {
  const w: number[][] = [];
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        const er = r + 3 * dr, ec = c + 3 * dc;
        if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
        w.push([0, 1, 2, 3].map((k) => (r + k * dr) * COLS + (c + k * dc)));
      }
    }
  }
  return w;
})();

export function winningCells(board: (Player | null)[]): number[] | null {
  for (const w of WINDOWS) {
    const a = board[w[0]];
    if (a !== null && a === board[w[1]] && a === board[w[2]] && a === board[w[3]]) return w;
  }
  return null;
}

/** Рядок, у який впаде фішка в стовпець, або -1 */
export function dropRow(board: (Player | null)[], col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (at(board, r, col) === null) return r;
  return -1;
}

const CENTER_FIRST = [3, 2, 4, 1, 5, 0, 6];

export const connect4: Game<C4State, C4Move> = {
  id: 'connect4',
  initial: () => ({ board: Array(COLS * ROWS).fill(null), turn: 0 }),
  turn: (s) => s.turn,
  moves: (s) => {
    if (winningCells(s.board)) return [];
    return CENTER_FIRST.filter((c) => at(s.board, 0, c) === null);
  },
  apply: (s, col) => {
    const board = s.board.slice();
    board[dropRow(board, col) * COLS + col] = s.turn;
    return { board, turn: other(s.turn) };
  },
  outcome: (s): Outcome => {
    const w = winningCells(s.board);
    if (w) return { over: true, winner: s.board[w[0]] };
    if (s.board.every((c) => c !== null)) return { over: true, winner: null };
    return { over: false, winner: null };
  },
  score: (s) => {
    let v = 0;
    for (let r = 0; r < ROWS; r++) if (at(s.board, r, 3) !== null) v += at(s.board, r, 3) === 0 ? 3 : -3;
    for (const w of WINDOWS) {
      let a = 0, b = 0;
      for (const i of w) {
        if (s.board[i] === 0) a++;
        else if (s.board[i] === 1) b++;
      }
      if (a && b) continue;
      const n = a || b;
      const val = n === 3 ? 8 : n === 2 ? 2 : 0;
      v += a ? val : -val;
    }
    return v;
  },
};
