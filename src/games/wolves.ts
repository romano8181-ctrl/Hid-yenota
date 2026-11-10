import type { Game, Outcome, Player } from './types';
import { other } from './types';

/**
 * Вовк і вівці: чотири вівці (гравець 0, ходять першими) рухаються по діагоналі лише вгору.
 * Вовк (гравець 1) ходить по діагоналі в будь-який бік. Вовк перемагає, дійшовши до нижнього ряду;
 * вівці перемагають, якщо вовку нікуди ходити.
 */
export interface WolvesState {
  wolf: number;
  sheep: number[];
  turn: Player;
}
export interface WolvesMove {
  from: number;
  to: number;
}

const rc = (i: number) => [Math.floor(i / 8), i % 8] as const;
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

function wolfMoves(s: WolvesState): WolvesMove[] {
  const [r, c] = rc(s.wolf);
  const out: WolvesMove[] = [];
  for (const dr of [-1, 1]) {
    for (const dc of [-1, 1]) {
      const nr = r + dr, nc = c + dc;
      if (!inside(nr, nc)) continue;
      const to = nr * 8 + nc;
      if (!s.sheep.includes(to)) out.push({ from: s.wolf, to });
    }
  }
  return out;
}

function sheepMoves(s: WolvesState): WolvesMove[] {
  const out: WolvesMove[] = [];
  for (const from of s.sheep) {
    const [r, c] = rc(from);
    for (const dc of [-1, 1]) {
      const nr = r - 1, nc = c + dc;
      if (!inside(nr, nc)) continue;
      const to = nr * 8 + nc;
      if (to !== s.wolf && !s.sheep.includes(to)) out.push({ from, to });
    }
  }
  return out;
}

export const wolves: Game<WolvesState, WolvesMove> = {
  id: 'wolves',
  initial: () => ({ wolf: 3, sheep: [56, 58, 60, 62], turn: 0 }),
  turn: (s) => s.turn,
  moves: (s) => (rc(s.wolf)[0] === 7 ? [] : s.turn === 0 ? sheepMoves(s) : wolfMoves(s)),
  apply: (s, m) =>
    s.turn === 1
      ? { ...s, wolf: m.to, turn: other(s.turn) }
      : { ...s, sheep: s.sheep.map((p) => (p === m.from ? m.to : p)), turn: other(s.turn) },
  outcome: (s): Outcome => {
    if (rc(s.wolf)[0] === 7) return { over: true, winner: 1 };
    if (s.turn === 1 && wolfMoves(s).length === 0) return { over: true, winner: 0 };
    if (s.turn === 0 && sheepMoves(s).length === 0) return { over: true, winner: 1 };
    return { over: false, winner: null };
  },
  score: (s) => {
    const [wr] = rc(s.wolf);
    const behind = s.sheep.filter((p) => rc(p)[0] <= wr).length;
    return -12 * wr - 25 * behind - 4 * wolfMoves({ ...s, turn: 1 }).length;
  },
};
