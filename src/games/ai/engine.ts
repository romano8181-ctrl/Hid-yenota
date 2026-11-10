import { chessGame } from '../games/chess';
import { checkers } from '../games/checkers';
import { connect4 } from '../games/connect4';
import { wolves } from '../games/wolves';
import { reversi } from '../games/reversi';
import { mill } from '../games/mill';
import { mancala } from '../games/mancala';
import { ticTacToe } from '../games/tictactoe';
import type { Game } from '../games/types';
import { bestMove, chooseMove, type Level } from './minimax';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: Record<string, Game<any, any>> = {
  tictactoe: ticTacToe,
  checkers,
  chess: chessGame,
  connect4,
  wolves,
  reversi,
  mill,
  mancala,
};

export type Request =
  | { kind: 'move'; gameId: string; state: unknown; level: Level }
  | { kind: 'hint'; gameId: string; state: unknown; depth: number };

export function solve(req: Request, decode: (gameId: string, d: unknown) => unknown): unknown {
  const g = GAMES[req.gameId];
  const s = decode(req.gameId, req.state);
  return req.kind === 'move' ? chooseMove(g, s, req.level) : bestMove(g, s, req.depth);
}
