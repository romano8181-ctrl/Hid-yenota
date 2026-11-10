import type { Game, Outcome, Player } from './types';
import { other } from './types';

/**
 * Мельниця (Nine Men's Morris): 24 точки, по 9 фішок. Фази: розстановка, ходи, а коли лишилось 3 фішки,
 * «політ» на будь-яку вільну точку. Збудував мельницю (три в ряд) — зніми фішку суперника.
 */
export interface MillState {
  board: (Player | null)[];
  turn: Player;
  hand: [number, number];
  quiet: number;
}
/** from = -1 при розстановці; remove = -1, якщо мельниці немає */
export interface MillMove {
  from: number;
  to: number;
  remove: number;
}

// Кільця: 0..7 зовнішнє, 8..15 середнє, 16..23 внутрішнє; кутові — парні, середини сторін — непарні
export const COORDS: [number, number][] = [
  [0, 0], [3, 0], [6, 0], [6, 3], [6, 6], [3, 6], [0, 6], [0, 3],
  [1, 1], [3, 1], [5, 1], [5, 3], [5, 5], [3, 5], [1, 5], [1, 3],
  [2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [2, 3],
];

export const ADJ: number[][] = (() => {
  const a: number[][] = Array.from({ length: 24 }, () => []);
  const link = (x: number, y: number) => { a[x].push(y); a[y].push(x); };
  for (let ring = 0; ring < 3; ring++) for (let k = 0; k < 8; k++) link(ring * 8 + k, ring * 8 + ((k + 1) % 8));
  for (const k of [1, 3, 5, 7]) { link(k, 8 + k); link(8 + k, 16 + k); }
  return a;
})();

export const MILLS: number[][] = (() => {
  const m: number[][] = [];
  for (let ring = 0; ring < 3; ring++) {
    const o = ring * 8;
    for (const k of [0, 2, 4, 6]) m.push([o + k, o + k + 1, o + ((k + 2) % 8)]);
  }
  for (const k of [1, 3, 5, 7]) m.push([k, 8 + k, 16 + k]);
  return m;
})();

const inMill = (board: (Player | null)[], i: number, p: Player) =>
  MILLS.some((m) => m.includes(i) && m.every((x) => board[x] === p));

const total = (s: MillState, p: Player) => s.board.filter((c) => c === p).length + s.hand[p];

function rawMoves(s: MillState): { from: number; to: number }[] {
  const p = s.turn;
  const empties: number[] = [];
  s.board.forEach((c, i) => { if (c === null) empties.push(i); });
  if (s.hand[p] > 0) return empties.map((to) => ({ from: -1, to }));
  const mine: number[] = [];
  s.board.forEach((c, i) => { if (c === p) mine.push(i); });
  const flying = mine.length === 3;
  const out: { from: number; to: number }[] = [];
  for (const from of mine) {
    for (const to of flying ? empties : ADJ[from].filter((x) => s.board[x] === null)) out.push({ from, to });
  }
  return out;
}

function legalMoves(s: MillState): MillMove[] {
  const out: MillMove[] = [];
  const opp = other(s.turn);
  for (const { from, to } of rawMoves(s)) {
    const b = s.board.slice();
    if (from >= 0) b[from] = null;
    b[to] = s.turn;
    if (inMill(b, to, s.turn)) {
      const oppPieces: number[] = [];
      b.forEach((c, i) => { if (c === opp) oppPieces.push(i); });
      const free = oppPieces.filter((i) => !inMill(b, i, opp));
      for (const remove of free.length ? free : oppPieces) out.push({ from, to, remove });
    } else out.push({ from, to, remove: -1 });
  }
  return out;
}

export const mill: Game<MillState, MillMove> = {
  id: 'mill',
  initial: () => ({ board: Array(24).fill(null), turn: 0, hand: [9, 9], quiet: 0 }),
  turn: (s) => s.turn,
  moves: (s) => (mill.outcome(s).over ? [] : legalMoves(s)),
  apply: (s, m) => {
    const board = s.board.slice();
    const hand: [number, number] = [...s.hand];
    if (m.from >= 0) board[m.from] = null;
    else hand[s.turn]--;
    board[m.to] = s.turn;
    if (m.remove >= 0) board[m.remove] = null;
    const quiet = m.remove >= 0 || m.from < 0 ? 0 : s.quiet + 1;
    return { board, turn: other(s.turn), hand, quiet };
  },
  outcome: (s): Outcome => {
    if (s.quiet >= 60) return { over: true, winner: null };
    const p = s.turn;
    if (total(s, p) < 3) return { over: true, winner: other(p) };
    if (s.hand[p] === 0 && rawMoves(s).length === 0) return { over: true, winner: other(p) };
    return { over: false, winner: null };
  },
  score: (s) => {
    let v = (total(s, 0) - total(s, 1)) * 30;
    for (const m of MILLS) {
      const a = m.filter((i) => s.board[i] === 0).length;
      const b = m.filter((i) => s.board[i] === 1).length;
      if (a === 3) v += 8;
      else if (b === 3) v -= 8;
      else if (a === 2 && b === 0) v += 5;
      else if (b === 2 && a === 0) v -= 5;
    }
    const mob = (p: Player) => {
      let n = 0;
      s.board.forEach((c, i) => { if (c === p) n += ADJ[i].filter((x) => s.board[x] === null).length; });
      return n;
    };
    return v + 2 * (mob(0) - mob(1));
  },
};
