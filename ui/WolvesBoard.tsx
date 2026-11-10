import { useEffect, useState } from 'react';
import type { WolvesMove, WolvesState } from '../games/wolves';
import type { BoardProps } from './types';

export function WolvesBoard({ state, moves, onMove, hint, last, locked, showHints }: BoardProps<WolvesState, WolvesMove>) {
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => setSel(null), [state]);

  const movable = new Set(moves.map((m) => m.from));
  const targets = new Map(moves.filter((m) => m.from === sel).map((m) => [m.to, m]));

  const click = (i: number) => {
    if (locked) return;
    const m = targets.get(i);
    if (m) return onMove(m);
    setSel(movable.has(i) ? i : null);
  };

  const cells = [];
  for (let i = 0; i < 64; i++) {
    const r = Math.floor(i / 8), c = i % 8;
    const dark = (r + c) % 2 === 1;
    const cls = [
      'sq', dark ? 'dark' : 'light',
      sel === i ? 'sel' : '',
      last && (last.from === i || last.to === i) ? 'last' : '',
      hint && (hint.from === i || hint.to === i) ? 'hint' : '',
      showHints && !locked && sel === null && movable.has(i) ? 'can' : '',
    ].filter(Boolean).join(' ');
    const isWolf = state.wolf === i;
    const isSheep = state.sheep.includes(i);
    cells.push(
      <button key={i} className={cls} onClick={() => click(i)} disabled={!dark} aria-label={`Поле ${i}`}>
        {isWolf && <span className="animal">🐺</span>}
        {isSheep && <span className="animal">🐑</span>}
        {targets.has(i) && <span className="dot" />}
      </button>,
    );
  }
  return <div className="board grid8" role="grid">{cells}</div>;
}
