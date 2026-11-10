import { describe, expect, it } from 'vitest';
import { connect4, winningCells, COLS } from './connect4';
import { wolves } from './wolves';
import { LADDERS, SNAKES, resolveRoll, cellPos } from './snakes';
import { flip, isOver, newMemory, resolve, rockyPick } from './memory';
import { chooseMove } from '../ai/minimax';
import { levelFor } from '../ai/levels';
import type { Game } from './types';

function randomGame<S, M>(g: Game<S, M>, max = 300): S {
  let s = g.initial();
  let n = 0;
  while (!g.outcome(s).over && n++ < max) {
    const ms = g.moves(s);
    s = g.apply(s, ms[Math.floor(Math.random() * ms.length)]);
  }
  expect(n).toBeLessThan(max);
  return s;
}

describe('чотири в ряд', () => {
  it('фішка падає вниз і чергується', () => {
    let s = connect4.initial();
    s = connect4.apply(s, 3);
    s = connect4.apply(s, 3);
    expect(s.board[5 * COLS + 3]).toBe(0);
    expect(s.board[4 * COLS + 3]).toBe(1);
    expect(s.turn).toBe(0);
  });
  it('вертикальна, горизонтальна й діагональна перемога', () => {
    let s = connect4.initial();
    for (const m of [0, 1, 0, 1, 0, 1, 0]) s = connect4.apply(s, m);
    expect(connect4.outcome(s)).toEqual({ over: true, winner: 0 });
    s = connect4.initial();
    for (const m of [0, 0, 1, 1, 2, 2, 3]) s = connect4.apply(s, m);
    expect(winningCells(s.board)).toHaveLength(4);
    s = connect4.initial();
    for (const m of [0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]) s = connect4.apply(s, m);
    expect(connect4.outcome(s).winner).toBe(0);
  });
  it('повний стовпець недоступний', () => {
    let s = connect4.initial();
    for (let i = 0; i < 6; i++) s = connect4.apply(s, 0);
    expect(connect4.moves(s)).not.toContain(0);
  });
  it('випадкові партії завершуються', () => {
    for (let i = 0; i < 30; i++) randomGame(connect4);
  });
  it('ШІ закриває виграшний хід суперника й виграє сам', () => {
    let s = connect4.initial();
    for (const m of [0, 6, 1, 6, 2]) s = connect4.apply(s, m); // 0 має 3 в ряд, хід 1
    const level = levelFor('connect4', 4);
    expect(chooseMove(connect4, s, level, () => 0.99)).toBe(3);
  });
  it('«Лев» думає менше 2 секунд', () => {
    let s = connect4.initial();
    for (const m of [3, 3, 2, 4]) s = connect4.apply(s, m);
    const t0 = performance.now();
    chooseMove(connect4, s, levelFor('connect4', 5));
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});

describe('вовк і вівці', () => {
  it('початок: 4 вівці, перший хід у вівець', () => {
    const s = wolves.initial();
    expect(s.sheep).toHaveLength(4);
    expect(wolves.moves(s).length).toBe(7);
  });
  it('вовк перемагає, дійшовши до низу', () => {
    const s = { wolf: 49, sheep: [0, 2, 4, 6], turn: 1 as const };
    const n = wolves.apply(s, { from: 49, to: 56 });
    expect(wolves.outcome(n)).toEqual({ over: true, winner: 1 });
  });
  it('вівці перемагають, якщо вовк у пастці', () => {
    const s = { wolf: 0 + 1, sheep: [8, 10], turn: 1 as const };
    expect(wolves.moves(s)).toHaveLength(0);
    expect(wolves.outcome(s)).toEqual({ over: true, winner: 0 });
  });
  it('вівці не ходять назад і не стають на зайняте', () => {
    const s = wolves.initial();
    for (const m of wolves.moves(s)) expect(m.to).toBeLessThan(m.from);
  });
  it('випадкові партії завершуються', () => {
    for (let i = 0; i < 40; i++) randomGame(wolves);
  });
  it('ідеальні вівці перемагають випадкового вовка, а ідеальний вовк — випадкових овець', () => {
    const lion = levelFor('wolves', 5);
    let sheepWins = 0;
    for (let i = 0; i < 10; i++) {
      let s = wolves.initial();
      while (!wolves.outcome(s).over) {
        const ms = wolves.moves(s);
        const m = s.turn === 0 ? chooseMove(wolves, s, lion)! : ms[Math.floor(Math.random() * ms.length)];
        s = wolves.apply(s, m);
      }
      if (wolves.outcome(s).winner === 0) sheepWins++;
    }
    expect(sheepWins).toBeGreaterThanOrEqual(8);
    let wolfWins = 0;
    for (let i = 0; i < 10; i++) {
      let s = wolves.initial();
      while (!wolves.outcome(s).over) {
        const ms = wolves.moves(s);
        const m = s.turn === 1 ? chooseMove(wolves, s, lion)! : ms[Math.floor(Math.random() * ms.length)];
        s = wolves.apply(s, m);
      }
      if (wolves.outcome(s).winner === 1) wolfWins++;
    }
    expect(wolfWins).toBeGreaterThanOrEqual(5);
  }, 60000);
});

describe('змії та драбини', () => {
  it('драбини ведуть угору, змії вниз, початки не збігаються', () => {
    for (const [a, b] of Object.entries(LADDERS)) expect(b).toBeGreaterThan(Number(a));
    for (const [a, b] of Object.entries(SNAKES)) expect(b).toBeLessThan(Number(a));
    const starts = [...Object.keys(LADDERS), ...Object.keys(SNAKES)];
    expect(new Set(starts).size).toBe(starts.length);
    for (const e of [...Object.values(LADDERS), ...Object.values(SNAKES)]) expect(starts).not.toContain(String(e));
  });
  it('звичайний хід, драбина, змія й перебір', () => {
    expect(resolveRoll(10, 3)).toEqual({ steps: [11, 12, 13], jump: null, final: 13 });
    expect(resolveRoll(2, 2).final).toBe(14);
    expect(resolveRoll(2, 2).jump).toBe('ladder');
    expect(resolveRoll(13, 3)).toMatchObject({ jump: 'snake', final: 6 });
    expect(resolveRoll(98, 6)).toEqual({ steps: [], jump: null, final: 98 });
    expect(resolveRoll(94, 6).final).toBe(100);
  });
  it('зміїна нумерація клітинок', () => {
    expect(cellPos(1)).toEqual({ row: 9, col: 0 });
    expect(cellPos(10)).toEqual({ row: 9, col: 9 });
    expect(cellPos(11)).toEqual({ row: 8, col: 9 });
    expect(cellPos(100)).toEqual({ row: 0, col: 0 });
  });
  it('випадкові партії завершуються', () => {
    for (let g = 0; g < 50; g++) {
      let pos = 0, n = 0;
      while (pos < 100 && n++ < 2000) pos = resolveRoll(pos, 1 + Math.floor(Math.random() * 6)).final;
      expect(pos).toBe(100);
    }
  });
});

describe('мемо', () => {
  it('колода має пари, збіг додає очко й залишає хід', () => {
    let s = newMemory(8);
    expect(s.cards).toHaveLength(16);
    const a = 0;
    const b = s.cards.findIndex((c, i) => i !== a && c.face === s.cards[a].face);
    s = flip(s, a, 0);
    s = flip(s, b, 0);
    expect(s.scores).toEqual([1, 0]);
    expect(s.turn).toBe(0);
    expect(s.cards[a].state).toBe('matched');
  });
  it('промах: карти закриваються й хід переходить', () => {
    let s = newMemory(8);
    const b = s.cards.findIndex((c, i) => i !== 0 && c.face !== s.cards[0].face);
    s = flip(s, 0, 0);
    s = flip(s, b, 0);
    expect(s.pending).not.toBeNull();
    expect(flip(s, 3, 0)).toBe(s);
    s = resolve(s);
    expect(s.turn).toBe(1);
    expect(s.cards[0].state).toBe('down');
  });
  it('Рокі з ідеальною пам\'яттю збирає всі пари, сума очок = кількість пар', () => {
    let s = newMemory(8);
    let guard = 0;
    while (!isOver(s) && guard++ < 500) {
      s = flip(s, rockyPick(s), 1);
      if (s.pending) s = resolve(s);
    }
    expect(isOver(s)).toBe(true);
    expect(s.scores[0] + s.scores[1]).toBe(8);
  });
  it('Рокі без пам\'яті теж завершує гру', () => {
    let s = newMemory(6);
    let guard = 0;
    while (!isOver(s) && guard++ < 1000) {
      s = flip(s, rockyPick(s), 0);
      if (s.pending) s = resolve(s);
    }
    expect(isOver(s)).toBe(true);
  });
});
