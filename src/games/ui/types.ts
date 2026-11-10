import type { ComponentType } from 'react';
import type { Game } from '../games/types';

export interface BoardProps<S, M> {
  state: S;
  moves: M[];
  onMove: (m: M) => void;
  hint: M | null;
  last: M | null;
  /** Дошка заблокована: хід ШІ, гра завершена */
  locked: boolean;
  showHints: boolean;
}

export interface Playable<S, M> {
  id: string;
  game: Game<S, M>;
  Board: ComponentType<BoardProps<S, M>>;
  /** Короткий підсумок позиції під дошкою (рахунок тощо) */
  info?: (s: S) => string;
}
