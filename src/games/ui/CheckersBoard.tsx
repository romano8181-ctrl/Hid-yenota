import { useEffect, useState } from 'react';
import type { CheckersMove, CheckersState } from '../games/checkers';
import type { BoardProps } from './types';

const isWhite = (c: string | null) => c === 'w' || c === 'W';

export function CheckersBoard({ state, moves, onMove, hint, last, locked, showHints }: BoardProps<CheckersState, CheckersMove>) {
  const [sel, setSel] = useState<number | null>(null);
  const [partial, setPartial] = useState<number[]>([]);

  useEffect(() => { setSel(null); setPartial([]); }, [state]);

  const movable = new Set(moves.map((m) => m.from));
  const live = sel === null ? [] : moves.filter((m) => m.from === sel && partial.every((p, i) => m.path[i] === p));
  const targets = new Set(live.filter((m) => m.path.length > partial.length).map((m) => m.path[partial.length]));
  const lastSquares = new Set(last ? [last.from, ...last.path] : []);

  const click = (i: number) => {
    if (locked) return;
    if (sel !== null && targets.has(i)) {
      const next = [...partial, i];
      const done = live.find((m) => m.path.length === next.length && m.path.every((p, k) => p === next[k]));
      if (done) onMove(done);
      else setPartial(next);
      return;
    }
    if (partial.length === 0 && movable.has(i)) setSel(i);
    else if (partial.length === 0) setSel(null);
  };

  const cells = [];
  for (let i = 0; i < 64; i++) {
    const r = Math.floor(i / 8), c = i % 8;
    const dark = (r + c) % 2 === 1;
    const piece = state.board[i];
    const cls = [
      'sq', dark ? 'dark' : 'light',
      sel === i ? 'sel' : '',
      lastSquares.has(i) ? 'last' : '',
      hint !== null && (hint.from === i || hint.path[0] === i) ? 'hint' : '',
      showHints && !locked && sel === null && movable.has(i) ? 'can' : '',
    ].filter(Boolean).join(' ');
    cells.push(
      <button key={i} className={cls} onClick={() => click(i)} disabled={!dark} aria-label={`Поле ${i}`}>
        {piece && (
          <span className={`checker ${isWhite(piece) ? 'cw' : 'cb'} ${piece === 'W' || piece === 'B' ? 'king' : ''}`}>
            {(piece === 'W' || piece === 'B') && '♛︎'}
          </span>
        )}
        {targets.has(i) && <span className="dot" />}
      </button>,
    );
  }
  return <div className="board grid8" role="grid">{cells}</div>;
}
