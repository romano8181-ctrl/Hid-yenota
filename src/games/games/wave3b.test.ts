import { describe, expect, it } from 'vitest';
import { draw, endValues, newDomino, options, outcome, pass, play, rockyOption, type DominoState } from './domino';
import { absCell, applyMove, initialLudo, legalMoves, noMove, rockyMove, winner, type LudoState } from './ludo';

function playDomino(level: number): DominoState {
  let s = newDomino();
  let guard = 0;
  while (!outcome(s).over && guard++ < 500) {
    const p = s.turn;
    const opts = options(s, p);
    if (opts.length) {
      const o = p === 1 ? rockyOption(s, level) : opts[Math.floor(Math.random() * opts.length)];
      s = play(s, p, o.index, o.end);
    } else if (s.yard.length) s = draw(s, p);
    else s = pass(s);
  }
  expect(guard).toBeLessThan(500);
  return s;
}

describe('доміно', () => {
  it('28 унікальних кісток, по 7 у руках, 14 у купці', () => {
    const s = newDomino();
    const all = [...s.hands[0], ...s.hands[1], ...s.yard];
    expect(all).toHaveLength(28);
    expect(new Set(all.map((t) => [...t].sort().join('-'))).size).toBe(28);
    expect(s.yard).toHaveLength(14);
  });
  it('кістка повертається під ряд, обидва кінці працюють', () => {
    const s = newDomino();
    s.hands = [[[1, 2], [2, 3], [4, 5]], [[6, 6]]];
    let n = play(s, 0, 0, 'R');
    expect(n.chain).toEqual([[1, 2]]);
    n = { ...n, turn: 0 };
    expect(endValues(n)).toEqual([1, 2]);
    n = play(n, 0, 0, 'R');
    expect(n.chain).toEqual([[1, 2], [2, 3]]);
    n = { ...n, turn: 0, hands: [[[1, 0], [5, 3]], [[6, 6]]] };
    n = play(n, 0, 0, 'L');
    expect(n.chain).toEqual([[0, 1], [1, 2], [2, 3]]);
    n = { ...n, turn: 0 };
    expect(options(n, 0)).toEqual([{ index: 0, end: 'R' }]);
    n = play(n, 0, 0, 'R');
    expect(n.chain).toEqual([[0, 1], [1, 2], [2, 3], [3, 5]]);
  });
  it('випадкові й Рокі-партії завершуються з коректним ланцюжком', () => {
    for (let lv = 1; lv <= 5; lv++) {
      for (let i = 0; i < 20; i++) {
        const s = playDomino(lv);
        expect(s.chain.every((t, k) => k === 0 || s.chain[k - 1][1] === t[0])).toBe(true);
        expect(outcome(s).over).toBe(true);
      }
    }
  });
});

describe('лудо', () => {
  it('вийти з бази можна лише шісткою', () => {
    const s = initialLudo();
    expect(legalMoves(s, 3)).toHaveLength(0);
    expect(legalMoves(s, 6)).toHaveLength(4);
  });
  it('шістка дає ще хід, інше число передає хід', () => {
    const s = initialLudo();
    expect(applyMove(s, 0, 6).state.turn).toBe(0);
    const s2: LudoState = { ...s, tokens: [[5, -1, -1, -1], [-1, -1, -1, -1]] };
    expect(applyMove(s2, 0, 3).state.turn).toBe(1);
  });
  it('удар по фішці суперника відправляє її на базу', () => {
    const s: LudoState = { tokens: [[18, -1, -1, -1], [0, -1, -1, -1]], turn: 0, tries: 0 };
    // фішка 0 гравця 1 стоїть на абсолютній клітинці 20; гравець 0 на 18 + 2
    expect(absCell(1, 0)).toBe(20);
    const r = applyMove(s, 0, 2);
    expect(r.captured).toBe(true);
    expect(r.state.tokens[1][0]).toBe(-1);
  });
  it('не можна стати на власну фішку чи перелетіти домівку', () => {
    const s: LudoState = { tokens: [[10, 12, 42, -1], [-1, -1, -1, -1]], turn: 0, tries: 0 };
    expect(legalMoves(s, 2)).not.toContain(0);
    expect(legalMoves(s, 4)).not.toContain(2);
  });
  it('три спроби, якщо всі на базі', () => {
    let s = initialLudo();
    s = noMove(s); expect(s.turn).toBe(0);
    s = noMove(s); expect(s.turn).toBe(0);
    s = noMove(s); expect(s.turn).toBe(1);
  });
  it('випадкові партії завершуються перемогою', () => {
    for (let g = 0; g < 30; g++) {
      let s = initialLudo();
      let n = 0;
      while (winner(s) === null && n++ < 20000) {
        const die = 1 + Math.floor(Math.random() * 6);
        const ms = legalMoves(s, die);
        if (!ms.length) { s = noMove(s); continue; }
        const i = s.turn === 1 ? rockyMove(s, die, ms, 5) : ms[Math.floor(Math.random() * ms.length)];
        s = applyMove(s, i, die).state;
      }
      expect(winner(s)).not.toBeNull();
    }
  });
  it('Рокі найвищого рівня зазвичай перемагає випадкового гравця', () => {
    let wins = 0;
    for (let g = 0; g < 300; g++) {
      let s = initialLudo();
      let n = 0;
      while (winner(s) === null && n++ < 20000) {
        const die = 1 + Math.floor(Math.random() * 6);
        const ms = legalMoves(s, die);
        if (!ms.length) { s = noMove(s); continue; }
        const i = s.turn === 1 ? rockyMove(s, die, ms, 5) : ms[Math.floor(Math.random() * ms.length)];
        s = applyMove(s, i, die).state;
      }
      if (winner(s) === 1) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(165);
  });
});
