import { ticTacToe } from '../games/tictactoe';
import { checkers } from '../games/checkers';
import { chessGame } from '../games/chess';
import { connect4 } from '../games/connect4';
import { wolves } from '../games/wolves';
import { reversi } from '../games/reversi';
import { mill } from '../games/mill';
import { mancala } from '../games/mancala';
import { TttBoard } from './TttBoard';
import { CheckersBoard } from './CheckersBoard';
import { ChessBoard } from './ChessBoard';
import { Connect4Board } from './Connect4Board';
import { WolvesBoard } from './WolvesBoard';
import { ReversiBoard, reversiInfo } from './ReversiBoard';
import { MillBoard, millInfo } from './MillBoard';
import { MancalaBoard } from './MancalaBoard';
import { MemoryScreen } from './MemoryScreen';
import { SnakesScreen } from './SnakesScreen';
import { DominoScreen } from './DominoScreen';
import { LudoScreen } from './LudoScreen';
import type { ComponentType } from 'react';
import type { Playable } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPlayable = Playable<any, any>;

export const PLAYABLE: AnyPlayable[] = [
  { id: 'tictactoe', game: ticTacToe, Board: TttBoard },
  { id: 'checkers', game: checkers, Board: CheckersBoard },
  { id: 'chess', game: chessGame, Board: ChessBoard },
  { id: 'connect4', game: connect4, Board: Connect4Board },
  { id: 'wolves', game: wolves, Board: WolvesBoard },
  { id: 'reversi', game: reversi, Board: ReversiBoard, info: reversiInfo },
  { id: 'mill', game: mill, Board: MillBoard, info: millInfo },
  { id: 'mancala', game: mancala, Board: MancalaBoard },
];

export interface CustomProps {
  onHome: () => void;
  onResult: (gameId: string, won: boolean, level: number) => void;
}

/** Ігри з власним екраном (без шахового інтерфейсу «дошка + ШІ») */
export const CUSTOM: Record<string, ComponentType<CustomProps>> = {
  snakes: SnakesScreen,
  memory: MemoryScreen,
  domino: DominoScreen,
  ludo: LudoScreen,
};

/** Ігри, де в прогресі показуємо перемоги, а не рівні складності */
export const NO_LEVELS = new Set(['snakes']);

export interface IslandInfo {
  id: string;
  icon: string;
  age: number;
  color: string;
}

/** Порядок на карті: від простого до складного */
export const ISLANDS: IslandInfo[] = [
  { id: 'tictactoe', icon: '❌', age: 5, color: '#60a5fa' },
  { id: 'snakes', icon: '🐍', age: 5, color: '#4ade80' },
  { id: 'memory', icon: '🃏', age: 5, color: '#f472b6' },
  { id: 'domino', icon: '🁢', age: 5, color: '#fbbf24' },
  { id: 'connect4', icon: '🔴', age: 6, color: '#f87171' },
  { id: 'ludo', icon: '🎲', age: 6, color: '#a78bfa' },
  { id: 'wolves', icon: '🐺', age: 6, color: '#94a3b8' },
  { id: 'checkers', icon: '⚪', age: 7, color: '#fb923c' },
  { id: 'mill', icon: '🟤', age: 7, color: '#d6a36b' },
  { id: 'mancala', icon: '🪨', age: 7, color: '#34d399' },
  { id: 'chess', icon: '♞', age: 8, color: '#7c5cff' },
  { id: 'reversi', icon: '⚫', age: 8, color: '#475569' },
];
