import type { Level } from './minimax';

export const LEVEL_DEPTHS: Record<string, number[]> = {
  tictactoe: [0, 1, 3, 6, 9],
  checkers: [0, 1, 2, 4, 6],
  chess: [0, 1, 2, 2, 3],
  connect4: [0, 1, 2, 4, 6],
  wolves: [0, 2, 4, 6, 8],
  reversi: [0, 1, 2, 3, 4],
  mill: [0, 1, 2, 3, 4],
  mancala: [0, 2, 4, 6, 8],
};

const BLUNDER = [1, 0.5, 0.2, 0.05, 0];

export function levelFor(gameId: string, n: 1 | 2 | 3 | 4 | 5): Level {
  const depths = LEVEL_DEPTHS[gameId] ?? [0, 1, 2, 3, 4];
  return { id: n, depth: depths[n - 1], blunder: BLUNDER[n - 1] };
}

/** Глибина для підказок: як у «Кота-мудреця» */
export function hintDepth(gameId: string): number {
  return (LEVEL_DEPTHS[gameId] ?? [0, 1, 2, 3, 4])[3];
}
