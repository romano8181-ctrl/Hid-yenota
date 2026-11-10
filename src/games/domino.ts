import type { Player } from './types';
import { other } from './types';
import { shuffle } from './memory';

/**
 * Доміно (набір до шести, 28 кісток, по 7 кісток на гравця): викладай кістку з тим же числом, що на кінці ряду.
 * Немає ходу: бери з купки, поки не з'явиться; купка порожня: пас. Перемагає той, хто першим викладе всі кістки.
 * Якщо обидва пасують підряд («риба»), перемагає той, у кого менше очок.
 */
export type Tile = [number, number];
export type End = 'L' | 'R';

export interface DominoState {
  hands: [Tile[], Tile[]];
  yard: Tile[];
  /** Ряд: у кожної кістки [ліва, права] половини вже повернуті під ряд */
  chain: Tile[];
  turn: Player;
  passes: number;
}

export interface DominoOption { index: number; end: End }

export function newDomino(rnd: () => number = Math.random): DominoState {
  const all: Tile[] = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) all.push([a, b]);
  const d = shuffle(all, rnd);
  return { hands: [d.slice(0, 7), d.slice(7, 14)], yard: d.slice(14), chain: [], turn: 0, passes: 0 };
}

export const endValues = (s: DominoState): [number, number] | null =>
  s.chain.length ? [s.chain[0][0], s.chain[s.chain.length - 1][1]] : null;

export function options(s: DominoState, p: Player): DominoOption[] {
  const ends = endValues(s);
  const out: DominoOption[] = [];
  s.hands[p].forEach((t, index) => {
    if (!ends) { out.push({ index, end: 'R' }); return; }
    if (t[0] === ends[0] || t[1] === ends[0]) out.push({ index, end: 'L' });
    if (t[0] === ends[1] || t[1] === ends[1]) out.push({ index, end: 'R' });
  });
  return out;
}

export function play(s: DominoState, p: Player, index: number, end: End): DominoState {
  const tile = s.hands[p][index];
  const chain = s.chain.slice();
  if (!chain.length) chain.push(tile);
  else if (end === 'L') chain.unshift(tile[1] === chain[0][0] ? tile : [tile[1], tile[0]]);
  else chain.push(tile[0] === chain[chain.length - 1][1] ? tile : [tile[1], tile[0]]);
  const hands: [Tile[], Tile[]] = [s.hands[0].slice(), s.hands[1].slice()];
  hands[p].splice(index, 1);
  return { ...s, hands, chain, turn: other(p), passes: 0 };
}

export function draw(s: DominoState, p: Player): DominoState {
  if (!s.yard.length) return s;
  const yard = s.yard.slice();
  const t = yard.pop()!;
  const hands: [Tile[], Tile[]] = [s.hands[0].slice(), s.hands[1].slice()];
  hands[p].push(t);
  return { ...s, hands, yard };
}

export function pass(s: DominoState): DominoState {
  return { ...s, turn: other(s.turn), passes: s.passes + 1 };
}

export const pips = (hand: Tile[]) => hand.reduce((a, t) => a + t[0] + t[1], 0);

export function outcome(s: DominoState): { over: boolean; winner: Player | null } {
  if (s.hands[0].length === 0) return { over: true, winner: 0 };
  if (s.hands[1].length === 0) return { over: true, winner: 1 };
  if (s.passes >= 2) {
    const a = pips(s.hands[0]), b = pips(s.hands[1]);
    return { over: true, winner: a < b ? 0 : b < a ? 1 : null };
  }
  return { over: false, winner: null };
}

/** Хід Рокі: рівні 1–2 — майже навмання, 3 — найважчу кістку, 4–5 — ще й тримає в руці різноманітні числа */
export function rockyOption(s: DominoState, level: number, rnd: () => number = Math.random): DominoOption {
  const opts = options(s, 1);
  const random = () => opts[Math.floor(rnd() * opts.length)];
  if (level <= 1 || (level === 2 && rnd() < 0.5)) return random();
  const hand = s.hands[1];
  const ends = endValues(s);
  const count = (v: number) => hand.reduce((a, t) => a + (t[0] === v ? 1 : 0) + (t[1] === v ? 1 : 0), 0);
  let best = opts[0], bestScore = -Infinity;
  for (const o of opts) {
    const t = hand[o.index];
    let sc = t[0] + t[1];
    if (level >= 4) {
      const rest = ends ? (o.end === 'L' ? (t[1] === ends[0] ? t[0] : t[1]) : (t[0] === ends[1] ? t[1] : t[0])) : t[1];
      sc += count(rest) * 3 + (t[0] === t[1] ? 2 : 0);
    }
    if (sc + rnd() * 0.5 > bestScore) { bestScore = sc + rnd() * 0.5; best = o; }
  }
  return best;
}
