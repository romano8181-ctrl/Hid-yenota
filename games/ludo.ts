import type { Player } from './types';
import { other } from './types';

/**
 * Лудо («Не сердься»), для двох гравців. Кільце з 40 клітинок, у кожного 4 фішки.
 * Щоб вийти з бази, потрібна шістка. Потрапив на фішку суперника — вона йде на базу.
 * Шістка дає ще хід. Фішка: -1 база, 0..39 шлях кільцем від свого старту, 40..43 — домівка.
 * Виграє той, у кого всі фішки в домівці. Якщо всі фішки на базі, дозволено три спроби.
 */
export interface LudoState {
  tokens: [number[], number[]];
  turn: Player;
  tries: number;
}

export const START: [number, number] = [0, 20];
export const RING = 40;

export const initialLudo = (): LudoState => ({ tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1]], turn: 0, tries: 0 });

export const absCell = (p: Player, prog: number) => (START[p] + prog) % RING;

export function legalMoves(s: LudoState, die: number): number[] {
  const p = s.turn;
  const mine = s.tokens[p];
  const out: number[] = [];
  mine.forEach((prog, i) => {
    if (prog < 0) {
      if (die === 6 && !mine.includes(0)) out.push(i);
    } else {
      const np = prog + die;
      if (np <= 43 && !mine.includes(np)) out.push(i);
    }
  });
  return out;
}

export interface LudoResult { state: LudoState; captured: boolean }

export function applyMove(s: LudoState, i: number, die: number): LudoResult {
  const p = s.turn;
  const tokens: [number[], number[]] = [s.tokens[0].slice(), s.tokens[1].slice()];
  const np = tokens[p][i] < 0 ? 0 : tokens[p][i] + die;
  tokens[p][i] = np;
  let captured = false;
  if (np < RING) {
    const q = other(p);
    tokens[q] = tokens[q].map((prog) => {
      if (prog >= 0 && prog < RING && absCell(q, prog) === absCell(p, np)) { captured = true; return -1; }
      return prog;
    });
  }
  const won = tokens[p].every((x) => x >= 40);
  return { state: { tokens, turn: die === 6 && !won ? p : other(p), tries: 0 }, captured };
}

/** Немає ходу: або нова спроба (усі на базі), або хід переходить */
export function noMove(s: LudoState): LudoState {
  const allHome = s.tokens[s.turn].every((x) => x < 0);
  if (allHome && s.tries < 2) return { ...s, tries: s.tries + 1 };
  return { ...s, turn: other(s.turn), tries: 0 };
}

export const winner = (s: LudoState): Player | null =>
  s.tokens[0].every((x) => x >= 40) ? 0 : s.tokens[1].every((x) => x >= 40) ? 1 : null;

/** Хід Рокі: 1–2 випадково, 3 — бити й виходити, 4–5 — ще й уникати небезпеки */
export function rockyMove(s: LudoState, die: number, moves: number[], level: number, rnd: () => number = Math.random): number {
  if (level <= 1 || (level === 2 && rnd() < 0.5)) return moves[Math.floor(rnd() * moves.length)];
  let best = moves[0], bestScore = -Infinity;
  for (const i of moves) {
    const { state: n, captured } = applyMove(s, i, die);
    const prog = s.tokens[1][i];
    const np = n.tokens[1][i];
    let sc = np * 1 + rnd();
    if (captured) sc += 100;
    if (prog < 0) sc += 40;
    if (np >= 40) sc += 50;
    if (level >= 4 && np < RING) {
      const here = absCell(1, np);
      for (const op of s.tokens[0]) {
        if (op < 0 || op >= RING) continue;
        const d = (here - absCell(0, op) + RING) % RING;
        if (d >= 1 && d <= 6) sc -= 25;
      }
      // Небезпека, з якої ми тікаємо
      if (prog >= 0 && prog < RING) {
        const from = absCell(1, prog);
        for (const op of s.tokens[0]) {
          if (op < 0 || op >= RING) continue;
          const d = (from - absCell(0, op) + RING) % RING;
          if (d >= 1 && d <= 6) sc += 20;
        }
      }
    }
    if (sc > bestScore) { bestScore = sc; best = i; }
  }
  return best;
}
