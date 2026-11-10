import { COLS, winningCells, type C4Move, type C4State } from '../games/connect4';
import type { BoardProps } from './types';

export function Connect4Board({ state, moves, onMove, hint, last, locked, showHints }: BoardProps<C4State, C4Move>) {
  const win = winningCells(state.board);
  // Клітинка, у яку щойно впала фішка
  const lastCell = last === null ? -1 : state.board.findIndex((c, i) => i % COLS === last && c !== null);
  const cols = Array.from({ length: COLS }, (_, c) => c);
  return (
    <div className="c4" role="grid">
      <div className="c4-heads">
        {cols.map((c) => {
          const can = !locked && moves.includes(c);
          return (
            <button key={c} className={`c4-head ${can && showHints ? 'can' : ''} ${hint === c ? 'hint' : ''}`} disabled={!can} onClick={() => onMove(c)} aria-label={`Стовпець ${c + 1}`}>
              ▼
            </button>
          );
        })}
      </div>
      <div className="c4-grid">
        {state.board.map((cell, i) => {
          const c = i % COLS;
          const cls = ['c4-cell', win?.includes(i) ? 'win' : ''].filter(Boolean).join(' ');
          return (
            <button key={i} className={cls} disabled={locked || !moves.includes(c)} onClick={() => onMove(c)} aria-label={`Клітинка ${i}`} tabIndex={-1}>
              {cell !== null && <span className={`disc d${cell} ${i === lastCell ? 'drop' : ''}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
