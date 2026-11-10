import type { Game, Outcome, Player } from './types';
import { other } from './types';

/**
 * Манкала (Калах): по 6 лунок і комора на гравця. pits[0..5] — лунки гравця 0, pits[6] — його комора,
 * pits[7..12] — лунки гравця 1, pits[13] — його комора. Хід — номер лунки (0..5) свого боку.
 * Остання камінця в коморі дає ще хід; в порожню свою лунку — забираєш камені навпроти.
 */
export interface MancalaState {
  pits: number[];
  turn: Player;
}
export type MancalaMove = number;

export const store = (p: Player) => (p === 0 ? 6 : 13);

export const mancala: Game<MancalaState, MancalaMove> = {
  id: 'mancala',
  initial: () => ({ pits: [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0], turn: 0 }),
  turn: (s) => s.turn,
  moves: (s) => {
    const m: number[] = [];
    for (let j = 0; j < 6; j++) if (s.pits[s.turn * 7 + j] > 0) m.push(j);
    return mancala.outcome(s).over ? [] : m;
  },
  apply: (s, j) => {
    const p = s.turn;
    const pits = s.pits.slice();
    const from = p * 7 + j;
    let stones = pits[from];
    pits[from] = 0;
    let i = from;
    const skip = store(other(p));
    while (stones > 0) {
      i = (i + 1) % 14;
      if (i === skip) continue;
      pits[i]++;
      stones--;
    }
    let extra = i === store(p);
    if (!extra && i >= p * 7 && i < p * 7 + 6 && pits[i] === 1 && pits[12 - i] > 0) {
      pits[store(p)] += pits[12 - i] + 1;
      pits[12 - i] = 0;
      pits[i] = 0;
    }
    const side0 = pits.slice(0, 6).reduce((a, b) => a + b, 0);
    const side1 = pits.slice(7, 13).reduce((a, b) => a + b, 0);
    if (side0 === 0 || side1 === 0) {
      pits[6] += side0;
      pits[13] += side1;
      for (let k = 0; k < 6; k++) { pits[k] = 0; pits[7 + k] = 0; }
      extra = false;
    }
    return { pits, turn: extra ? p : other(p) };
  },
  outcome: (s): Outcome => {
    const rest = s.pits.slice(0, 6).concat(s.pits.slice(7, 13)).reduce((a, b) => a + b, 0);
    if (rest > 0) return { over: false, winner: null };
    return { over: true, winner: s.pits[6] > s.pits[13] ? 0 : s.pits[13] > s.pits[6] ? 1 : null };
  },
  score: (s) => {
    const side0 = s.pits.slice(0, 6).reduce((a, b) => a + b, 0);
    const side1 = s.pits.slice(7, 13).reduce((a, b) => a + b, 0);
    return (s.pits[6] - s.pits[13]) * 10 + (side0 - side1);
  },
};
