import type { Game, Outcome, Player } from './types';
import { other } from './types';

/**
 * Шашки (українські/російські правила): дошка 8x8, прості шашки б'ють уперед і назад,
 * побиття обов'язкове, дамка літає, шашка, що дійшла до кінця під час побиття, стає дамкою і
 * продовжує бити. Побиті шашки знімаються після завершення ходу (турецький удар).
 */
export type Cell = null | 'w' | 'W' | 'b' | 'B';

export interface CheckersState {
  board: Cell[];
  turn: Player;
  /** Кількість підряд ходів дамками без побиття і без ходу простих шашок */
  quiet: number;
}

export interface CheckersMove {
  from: number;
  /** Усі поля, на які шашка приземляється по черзі (для простого ходу — одне) */
  path: number[];
  captured: number[];
  promote: boolean;
}

const rc = (i: number) => [Math.floor(i / 8), i % 8] as const;
const idx = (r: number, c: number) => r * 8 + c;
const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const;

const ownerOf = (c: Cell): Player | null => (c === null ? null : c === 'w' || c === 'W' ? 0 : 1);
const isKing = (c: Cell) => c === 'W' || c === 'B';
const promoRow = (p: Player) => (p === 0 ? 0 : 7);

export function initialBoard(): Cell[] {
  const b: Cell[] = Array(64).fill(null);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) b[idx(r, c)] = 'b';
        else if (r > 4) b[idx(r, c)] = 'w';
      }
    }
  }
  return b;
}

interface CaptureCtx {
  board: Cell[];
  player: Player;
  from: number;
}

function captureSequences(
  ctx: CaptureCtx,
  pos: number,
  king: boolean,
  captured: number[],
  path: number[],
  promoted: boolean,
  out: CheckersMove[],
): void {
  const { board, player } = ctx;
  const [r, c] = rc(pos);
  // Знаходимо всі можливі побиття з поточної позиції: { victim, landings[] }
  const options: { victim: number; landings: number[] }[] = [];
  for (const [dr, dc] of DIRS) {
    if (!king) {
      const vr = r + dr, vc = c + dc, lr = r + 2 * dr, lc = c + 2 * dc;
      if (!inside(lr, lc)) continue;
      const v = idx(vr, vc);
      if (ownerOf(board[v]) === other(player) && !captured.includes(v) && board[idx(lr, lc)] === null) {
        options.push({ victim: v, landings: [idx(lr, lc)] });
      }
    } else {
      let cr = r + dr, cc = c + dc;
      while (inside(cr, cc) && board[idx(cr, cc)] === null) { cr += dr; cc += dc; }
      if (!inside(cr, cc)) continue;
      const v = idx(cr, cc);
      if (ownerOf(board[v]) !== other(player) || captured.includes(v)) continue;
      const landings: number[] = [];
      let lr = cr + dr, lc = cc + dc;
      while (inside(lr, lc) && board[idx(lr, lc)] === null) {
        landings.push(idx(lr, lc));
        lr += dr; lc += dc;
      }
      if (landings.length) options.push({ victim: v, landings });
    }
  }

  if (options.length === 0) {
    if (captured.length > 0) out.push({ from: ctx.from, path, captured, promote: promoted });
    return;
  }

  for (const { victim, landings } of options) {
    const newCaptured = [...captured, victim];
    // Продовження з кожного поля приземлення
    const continues = landings.map((land) => {
      const [lr] = rc(land);
      const nowKing = king || lr === promoRow(player);
      const sub: CheckersMove[] = [];
      captureSequences(ctx, land, nowKing, newCaptured, [...path, land], promoted || (!king && lr === promoRow(player)), sub);
      return { land, nowKing, sub };
    });
    const withMore = continues.filter((x) => x.sub.some((m) => m.captured.length > newCaptured.length));
    // Дамка мусить обрати поле, з якого можна продовжити бити, якщо таке є
    const chosen = king && withMore.length ? withMore : continues;
    for (const { sub } of chosen) out.push(...sub);
  }
}

function legalMoves(s: CheckersState): CheckersMove[] {
  const caps: CheckersMove[] = [];
  const simple: CheckersMove[] = [];
  for (let i = 0; i < 64; i++) {
    const cell = s.board[i];
    if (ownerOf(cell) !== s.turn) continue;
    const king = isKing(cell);
    // Піднімаємо шашку з поля, щоб вона не блокувала сама себе
    const lifted = s.board.slice();
    lifted[i] = null;
    captureSequences({ board: lifted, player: s.turn, from: i }, i, king, [], [], false, caps);
    if (caps.length) continue;
    const [r, c] = rc(i);
    if (!king) {
      const dr = s.turn === 0 ? -1 : 1;
      for (const dc of [-1, 1]) {
        const nr = r + dr, nc = c + dc;
        if (inside(nr, nc) && s.board[idx(nr, nc)] === null) {
          simple.push({ from: i, path: [idx(nr, nc)], captured: [], promote: nr === promoRow(s.turn) });
        }
      }
    } else {
      for (const [dr, dc] of DIRS) {
        let nr = r + dr, nc = c + dc;
        while (inside(nr, nc) && s.board[idx(nr, nc)] === null) {
          simple.push({ from: i, path: [idx(nr, nc)], captured: [], promote: false });
          nr += dr; nc += dc;
        }
      }
    }
  }
  return caps.length ? caps : simple;
}

export const checkers: Game<CheckersState, CheckersMove> = {
  id: 'checkers',
  initial: () => ({ board: initialBoard(), turn: 0, quiet: 0 }),
  turn: (s) => s.turn,
  moves: (s) => legalMoves(s),
  apply: (s, m) => {
    const board = s.board.slice();
    const piece = board[m.from]!;
    board[m.from] = null;
    for (const v of m.captured) board[v] = null;
    const end = m.path[m.path.length - 1];
    const wasKing = isKing(piece);
    board[end] = m.promote || wasKing ? (s.turn === 0 ? 'W' : 'B') : piece;
    const quiet = m.captured.length > 0 || !wasKing ? 0 : s.quiet + 1;
    return { board, turn: other(s.turn), quiet };
  },
  outcome: (s): Outcome => {
    if (s.quiet >= 30) return { over: true, winner: null };
    if (legalMoves(s).length === 0) return { over: true, winner: other(s.turn) };
    return { over: false, winner: null };
  },
  score: (s) => {
    let v = 0;
    for (let i = 0; i < 64; i++) {
      const cell = s.board[i];
      if (cell === null) continue;
      const [r, c] = rc(i);
      const sign = ownerOf(cell) === 0 ? 1 : -1;
      if (isKing(cell)) v += sign * 330;
      else {
        const advance = ownerOf(cell) === 0 ? 7 - r : r;
        const edge = c === 0 || c === 7 ? 2 : 0;
        v += sign * (100 + advance * 4 + edge);
      }
    }
    return v;
  },
  order: (_s, moves) => [...moves].sort((a, b) => b.captured.length - a.captured.length),
};
