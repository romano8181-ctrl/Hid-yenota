import type { Game } from '../games/types';

export interface Level {
  id: 1 | 2 | 3 | 4 | 5;
  /** Глибина пошуку; 0 — випадковий хід */
  depth: number;
  /** Імовірність зробити випадковий (необдуманий) хід */
  blunder: number;
}

const WIN = 1_000_000;

export function search<S, M>(g: Game<S, M>, s: S, depth: number, alpha: number, beta: number, ply: number): number {
  const out = g.outcome(s);
  if (out.over) {
    if (out.winner === 0) return WIN - ply;
    if (out.winner === 1) return -WIN + ply;
    return 0;
  }
  if (depth === 0) return g.score(s);
  const maximizing = g.turn(s) === 0;
  let moves = g.moves(s);
  if (g.order) moves = g.order(s, moves);
  let best = maximizing ? -Infinity : Infinity;
  for (const m of moves) {
    const v = search(g, g.apply(s, m), depth - 1, alpha, beta, ply + 1);
    if (maximizing) {
      if (v > best) best = v;
      if (best > alpha) alpha = best;
    } else {
      if (v < best) best = v;
      if (best < beta) beta = best;
    }
    if (alpha >= beta) break;
  }
  return best;
}

/** Найкращий хід на заданій глибині (випадково серед рівних) */
export function bestMove<S, M>(g: Game<S, M>, s: S, depth: number, rnd: () => number = Math.random): M | null {
  let moves = g.moves(s);
  if (moves.length === 0) return null;
  if (g.order) moves = g.order(s, moves);
  const maximizing = g.turn(s) === 0;
  const EPS = 1e-6;
  let bestVal = maximizing ? -Infinity : Infinity;
  let best: M[] = [];
  for (const m of moves) {
    // Вузьке вікно від поточного найкращого значення: гірші ходи відсікаються швидко
    const alpha = maximizing ? bestVal - EPS : -Infinity;
    const beta = maximizing ? Infinity : bestVal + EPS;
    const v = search(g, g.apply(s, m), Math.max(0, depth - 1), alpha, beta, 1);
    const better = maximizing ? v > bestVal + EPS : v < bestVal - EPS;
    if (better) { bestVal = v; best = [m]; }
    else if (Math.abs(v - bestVal) <= EPS) best.push(m);
  }
  return best[Math.floor(rnd() * best.length)];
}

/** Хід ШІ відповідно до рівня: іноді навмисно помиляється, як і личить «Кошеняті» */
export function chooseMove<S, M>(g: Game<S, M>, s: S, level: Level, rnd: () => number = Math.random): M | null {
  const moves = g.moves(s);
  if (moves.length === 0) return null;
  if (level.depth === 0 || rnd() < level.blunder) return moves[Math.floor(rnd() * moves.length)];
  return bestMove(g, s, level.depth, rnd);
}
