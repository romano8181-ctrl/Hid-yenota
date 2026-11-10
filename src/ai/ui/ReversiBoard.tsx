import { counts, type ReversiMove, type ReversiState } from '../games/reversi';
import type { BoardProps } from './types';

export function reversiInfo(s: ReversiState): string {
  const [a, b] = counts(s.board);
  return `⚫ ${a}   ⚪ ${b}`;
}

export function ReversiBoard({ state, moves, onMove, hint, last, locked, showHints }: BoardProps<ReversiState, ReversiMove>) {
  return (
    <div className="board grid8 reversi" role="grid">
      {state.board.map((cell, i) => {
        const can = !locked && moves.includes(i);
        const cls = ['sq', 'green', last === i ? 'last' : '', hint === i ? 'hint' : ''].filter(Boolean).join(' ');
        return (
          <button key={i} className={cls} disabled={!can} onClick={() => onMove(i)} aria-label={`Клітинка ${i}`}>
            {cell !== null && <span className={`rdisc ${cell === 0 ? 'rb' : 'rw'}`} />}
            {can && showHints && cell === null && <span className="dot" />}
          </button>
        );
      })}
    </div>
  );
}
