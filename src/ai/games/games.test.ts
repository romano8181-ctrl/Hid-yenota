import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { ticTacToe } from './tictactoe';
import { checkers, initialBoard, type CheckersState, type Cell } from './checkers';
import { chessGame } from './chess';
import { bestMove, chooseMove } from '../ai/minimax';
import { levelFor } from '../ai/levels';
import type { Game } from './types';

function perft<S, M>(g: Game<S, M>, s: S, d: number): number {
  if (d === 0) return 1;
  let n = 0;
  for (const m of g.moves(s)) n += perft(g, g.apply(s, m), d - 1);
  return n;
}

function emptyState(turn: 0 | 1 = 0): CheckersState {
  return { board: Array(64).fill(null) as Cell[], turn, quiet: 0 };
}
const sq = (name: string) => (8 - Number(name[1])) * 8 + (name.charCodeAt(0) - 97);

describe('хрестики-нулики', () => {
  it('визначає переможця й нічию', () => {
    let s = ticTacToe.initial();
    for (const m of [0, 3, 1, 4, 2]) s = ticTacToe.apply(s, m);
    expect(ticTacToe.outcome(s)).toEqual({ over: true, winner: 0 });
  });
  it('ШІ найвищого рівня ніколи не програє випадковому гравцю', () => {
    const lion = levelFor('tictactoe', 5);
    for (let i = 0; i < 40; i++) {
      let s = ticTacToe.initial();
      const aiPlays = (i % 2) as 0 | 1;
      while (!ticTacToe.outcome(s).over) {
        const m = ticTacToe.turn(s) === aiPlays
          ? chooseMove(ticTacToe, s, lion)!
          : ticTacToe.moves(s)[Math.floor(Math.random() * ticTacToe.moves(s).length)];
        s = ticTacToe.apply(s, m);
      }
      const w = ticTacToe.outcome(s).winner;
      expect(w === null || w === aiPlays).toBe(true);
    }
  });
});

describe('шашки', () => {
  it('на початку 7 ходів, далі 49', () => {
    const s = checkers.initial();
    expect(checkers.moves(s)).toHaveLength(7);
    expect(perft(checkers, s, 2)).toBe(49);
  });
  it('перфт 3 і 4 збігаються з відомими значеннями для російських шашок', () => {
    const s = checkers.initial();
    expect(perft(checkers, s, 3)).toBe(302);
    expect(perft(checkers, s, 4)).toBe(1469);
  });
  it('побиття обов\'язкове', () => {
    const s = emptyState();
    s.board[sq('c3')] = 'w';
    s.board[sq('d4')] = 'b';
    s.board[sq('h2')] = 'w';
    const moves = checkers.moves(s);
    expect(moves.every((m) => m.captured.length > 0)).toBe(true);
    expect(moves).toHaveLength(1);
    expect(moves[0].path).toEqual([sq('e5')]);
  });
  it('проста шашка б\'є назад', () => {
    const s = emptyState();
    s.board[sq('e5')] = 'w';
    s.board[sq('d4')] = 'b';
    const m = checkers.moves(s);
    expect(m).toHaveLength(1);
    expect(m[0].path).toEqual([sq('c3')]);
  });
  it('багаторазове побиття однією шашкою', () => {
    const s = emptyState();
    s.board[sq('a1')] = 'w';
    s.board[sq('b2')] = 'b';
    s.board[sq('d4')] = 'b';
    s.board[sq('f6')] = 'b';
    s.board[sq('h8')] = null;
    const m = checkers.moves(s);
    expect(m).toHaveLength(1);
    expect(m[0].captured).toHaveLength(3);
    expect(m[0].path).toEqual([sq('c3'), sq('e5'), sq('g7')]);
  });
  it('шашка, що дійшла до краю, стає дамкою', () => {
    const s = emptyState();
    s.board[sq('b7')] = 'w';
    const m = checkers.moves(s).find((x) => x.path[0] === sq('a8'))!;
    const n = checkers.apply(s, m);
    expect(n.board[sq('a8')]).toBe('W');
  });
  it('дамка літає й б\'є здалеку', () => {
    const s = emptyState();
    s.board[sq('a1')] = 'W';
    s.board[sq('d4')] = 'b';
    const m = checkers.moves(s);
    expect(m.length).toBeGreaterThanOrEqual(1);
    expect(m.every((x) => x.captured.includes(sq('d4')))).toBe(true);
    expect(m.map((x) => x.path[0]).sort()).toEqual([sq('e5'), sq('f6'), sq('g7'), sq('h8')].sort());
  });
  it('без ходів — програш', () => {
    const s = emptyState();
    s.board[sq('a1')] = 'w';
    s.board[sq('b2')] = 'b';
    s.board[sq('c3')] = 'b';
    expect(checkers.moves(s)).toHaveLength(0);
    expect(checkers.outcome(s)).toEqual({ over: true, winner: 1 });
    const free = emptyState();
    free.board[sq('a1')] = 'w';
    free.board[sq('h8')] = 'b';
    expect(checkers.outcome(free).over).toBe(false);
    expect(initialBoard().filter(Boolean)).toHaveLength(24);
  });
  it('випадкові партії завершуються без помилок', () => {
    for (let i = 0; i < 30; i++) {
      let s = checkers.initial();
      let n = 0;
      while (!checkers.outcome(s).over && n++ < 400) {
        const ms = checkers.moves(s);
        s = checkers.apply(s, ms[Math.floor(Math.random() * ms.length)]);
      }
      expect(n).toBeLessThan(400);
    }
  });
});

describe('шахи', () => {
  it('перфт 3 з початкової позиції = 8902', () => {
    expect(perft(chessGame, chessGame.initial(), 3)).toBe(8902);
  });
  it('ШІ знаходить мат в 1 хід', () => {
    const c = new Chess('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1');
    const m = bestMove(chessGame, c, 2)!;
    expect(m.from + m.to).toBe('a1a8');
  });
  it('розпізнає мат', () => {
    const c = new Chess('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
    expect(chessGame.outcome(c)).toEqual({ over: true, winner: 1 });
  });
});

describe('швидкість ШІ', () => {
  it('шахи: «Лев» думає менше 4 секунд у середньогрі', () => {
    const c = new Chess('r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P1B2/2PBPN2/PP1N1PPP/R2QK2R w KQ - 0 8');
    const t0 = performance.now();
    const m = chooseMove(chessGame, c, levelFor('chess', 5));
    const dt = performance.now() - t0;
    console.log(`chess lion: ${Math.round(dt)} ms`);
    expect(m).not.toBeNull();
    expect(dt).toBeLessThan(4000);
  });
  it('шашки: «Лев» думає менше 2 секунд', () => {
    let s = checkers.initial();
    for (let i = 0; i < 8; i++) s = checkers.apply(s, checkers.moves(s)[0]);
    const t0 = performance.now();
    const m = chooseMove(checkers, s, levelFor('checkers', 5));
    const dt = performance.now() - t0;
    console.log(`checkers lion: ${Math.round(dt)} ms`);
    expect(m).not.toBeNull();
    expect(dt).toBeLessThan(2000);
  });
});
