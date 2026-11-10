import { Chess } from 'chess.js';

/** Стан шахів не серіалізується напряму (це клас), тому передаємо FEN; інші ігри мають простий JSON-стан */
export function encodeState(gameId: string, s: unknown): unknown {
  return gameId === 'chess' ? (s as Chess).fen() : s;
}

export function decodeState(gameId: string, d: unknown): unknown {
  return gameId === 'chess' ? new Chess(d as string) : d;
}
