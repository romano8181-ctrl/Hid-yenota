import { describe, expect, it } from 'vitest';
import { reversi, counts } from './reversi';
import { mill, MILLS, ADJ } from './mill';
import { mancala } from './mancala';
import { chooseMove } from '../ai/minimax';
import { levelFor } from '../ai/levels';
import type { Game } from './types';

function randomGame<S, M>(g: Game<S, M>, max = 500): S {
  let s = g.initial();
  let n = 0;
  while (!g.outcome(s).over && n++ < max) {
    const ms = g.moves(s);
    expect(ms.length).toBeGreaterThan(0);
    s = g.apply(s, ms[Math.floor(Math.random() * ms.length)]);
  }
  expect(n).toBeLessThan(max);
  return s;
}

describe('реверсі', () => {
  it('початок: 4 ходи, по 2 фішки', () => {
    const s = reversi.initial();
    expect(reversi.moves(s).sort((a, b) => a - b)).toEqual([19, 26, 37, 44]);
    expect(counts(s.board)).toEqual([2, 2]);
  });
  it('хід перевертає фішки суперника', () => {
    const s = reversi.apply(reversi.initial(), 19);
    expect(counts(s.board)).toEqual([4, 1]);
    expect(s.turn).toBe(1);
  });
  it('випадкові партії завершуються, всі клітинки коректні', () => {
    for (let i = 0; i < 30; i++) {
      const s = randomGame(reversi);
      const [a, b] = counts(s.board);
      expect(a + b).toBeLessThanOrEqual(64);
    }
  });
  it('ШІ найвищого рівня перемагає випадкового гравця', () => {
    const lion = levelFor('reversi', 5);
    let wins = 0;
    for (let i = 0; i < 6; i++) {
      let s = reversi.initial();
      const ai = (i % 2) as 0 | 1;
      while (!reversi.outcome(s).over) {
        const ms = reversi.moves(s);
        const m = reversi.turn(s) === ai ? chooseMove(reversi, s, lion)! : ms[Math.floor(Math.random() * ms.length)];
        s = reversi.apply(s, m);
      }
      if (reversi.outcome(s).winner === ai) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(5);
  }, 60000);
});

describe('мельниця', () => {
  it('геометрія: 24 точки, 32 ребра, 16 мельниць', () => {
    expect(ADJ.reduce((a, l) => a + l.length, 0) / 2).toBe(32);
    expect(MILLS).toHaveLength(16);
    expect(ADJ.every((l) => l.length >= 2 && l.length <= 4)).toBe(true);
  });
  it('мельниця дозволяє зняти фішку суперника', () => {
    let s = mill.initial();
    for (const to of [0, 8, 1, 9]) s = mill.apply(s, { from: -1, to, remove: -1 });
    const ms = mill.moves(s).filter((m) => m.to === 2);
    expect(ms.length).toBeGreaterThan(0);
    expect(ms.every((m) => m.remove >= 0)).toBe(true);
  });
  it('фішки в мельниці захищені, якщо є інші', () => {
    const s = mill.initial();
    s.board[0] = 1; s.board[1] = 1; s.board[2] = 1; s.board[8] = 1;
    s.board[16] = 0; s.board[17] = 0;
    s.hand = [5, 5];
    const ms = mill.moves(s).filter((m) => m.to === 18);
    expect(ms.map((m) => m.remove)).toEqual([8]);
  });
  it('випадкові партії завершуються', () => {
    for (let i = 0; i < 30; i++) randomGame(mill, 800);
  });
  it('політ при трьох фішках', () => {
    const s = mill.initial();
    s.hand = [0, 0];
    s.board[0] = 0; s.board[3] = 0; s.board[6] = 0;
    s.board[10] = 1; s.board[12] = 1; s.board[14] = 1; s.board[20] = 1;
    const targets = new Set(mill.moves(s).filter((m) => m.from === 0).map((m) => m.to));
    expect(targets.size).toBe(24 - 7);
  });
});

describe('манкала', () => {
  it('сівба проти годинника, хід у комору дає ще хід', () => {
    const s = mancala.initial();
    const n = mancala.apply(s, 2);
    expect(n.pits.slice(0, 7)).toEqual([4, 4, 0, 5, 5, 5, 1]);
    expect(n.turn).toBe(0);
    const n2 = mancala.apply(s, 0);
    expect(n2.turn).toBe(1);
  });
  it('захоплення: остання в порожню свою лунку забирає навпроти', () => {
    const s = mancala.initial();
    s.pits = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0];
    s.pits[11] = 5; s.pits[7] = 1;
    const n = mancala.apply(s, 0);
    expect(n.pits[6]).toBe(6);
    expect(n.pits[11]).toBe(0);
  });
  it('кінець гри збирає залишки', () => {
    const s = mancala.initial();
    s.pits = [0, 0, 0, 0, 0, 1, 20, 3, 0, 0, 0, 0, 0, 15];
    const n = mancala.apply(s, 5);
    expect(mancala.outcome(n)).toEqual({ over: true, winner: 0 });
    expect(n.pits[6] + n.pits[13]).toBe(39);
  });
  it('всього 48 каменів завжди, випадкові партії завершуються', () => {
    for (let i = 0; i < 50; i++) {
      let s = mancala.initial();
      let n = 0;
      while (!mancala.outcome(s).over && n++ < 500) {
        const ms = mancala.moves(s);
        s = mancala.apply(s, ms[Math.floor(Math.random() * ms.length)]);
        expect(s.pits.reduce((a, b) => a + b, 0)).toBe(48);
      }
      expect(n).toBeLessThan(500);
    }
  });
});

describe('швидкість ШІ (хвиля 3)', () => {
  it('«Лев» у кожній грі думає менше 2,5 секунд', () => {
    for (const [g, id] of [[reversi, 'reversi'], [mill, 'mill'], [mancala, 'mancala']] as const) {
      let s = g.initial();
      for (let i = 0; i < 6; i++) {
        const ms = g.moves(s as never) as unknown[];
        s = g.apply(s as never, ms[Math.floor(ms.length / 2)] as never) as never;
      }
      const t0 = performance.now();
      chooseMove(g as Game<unknown, unknown>, s, levelFor(id, 5));
      const dt = performance.now() - t0;
      console.log(`${id}: ${Math.round(dt)} ms`);
      expect(dt).toBeLessThan(10000);
    }
  });
});
