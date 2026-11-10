import { winningLine, type TttMove, type TttState } from '../games/tictactoe';
import type { BoardProps } from './types';

function Mark({ who }: { who: 0 | 1 }) {
  return who === 0 ? (
    <svg viewBox="0 0 100 100" className="mark">
      <path d="M22 22 L78 78 M78 22 L22 78" stroke="#3b82f6" strokeWidth="14" strokeLinecap="round" fill="none" />
    </svg>
  ) : (
    <svg viewBox="0 0 100 100" className="mark">
      <circle cx="50" cy="50" r="28" stroke="#ec4899" strokeWidth="14" fill="none" />
    </svg>
  );
}

export function TttBoard({ state, moves, onMove, hint, locked, showHints }: BoardProps<TttState, TttMove>) {
  const win = winningLine(state.board);
  return (
    <div className="board ttt" role="grid">
      {state.board.map((cell, i) => {
        const playable = !locked && moves.includes(i);
        const cls = ['cell', playable && showHints ? 'can' : '', hint === i ? 'hint' : '', win?.includes(i) ? 'win' : '']
          .filter(Boolean).join(' ');
        return (
          <button key={i} className={cls} disabled={!playable} onClick={() => onMove(i)} aria-label={`Клітинка ${i + 1}`}>
            {cell !== null && <Mark who={cell} />}
          </button>
        );
      })}
    </div>
  );
}
