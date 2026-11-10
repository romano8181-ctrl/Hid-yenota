import type { MancalaMove, MancalaState } from '../games/mancala';
import type { BoardProps } from './types';

function Stones({ n }: { n: number }) {
  const shown = Math.min(n, 12);
  return (
    <span className="stones">
      {Array.from({ length: shown }, (_, i) => <i key={i} style={{ background: ['#f87171', '#60a5fa', '#facc15', '#4ade80'][i % 4] }} />)}
      <b>{n}</b>
    </span>
  );
}

export function MancalaBoard({ state, moves, onMove, hint, locked, showHints }: BoardProps<MancalaState, MancalaMove>) {
  const canPit = (abs: number) => !locked && abs >= state.turn * 7 && abs < state.turn * 7 + 6 && moves.includes(abs - state.turn * 7);
  const pit = (abs: number) => {
    const owner = abs < 7 ? 0 : 1;
    const can = canPit(abs);
    const isHint = hint !== null && owner === state.turn && abs === owner * 7 + hint;
    return (
      <button
        key={abs}
        className={`pit o${owner} ${can && showHints ? 'can' : ''} ${isHint ? 'hint' : ''}`}
        disabled={!can}
        onClick={() => onMove(abs - state.turn * 7)}
        aria-label={`Лунка ${abs}, камінців ${state.pits[abs]}`}
      >
        <Stones n={state.pits[abs]} />
      </button>
    );
  };
  return (
    <div className="mancala" role="grid">
      <div className="store o1" aria-label="Комора верхнього гравця"><Stones n={state.pits[13]} /></div>
      <div className="mrow">{[12, 11, 10, 9, 8, 7].map(pit)}</div>
      <div className="mrow">{[0, 1, 2, 3, 4, 5].map(pit)}</div>
      <div className="store o0" aria-label="Комора нижнього гравця"><Stones n={state.pits[6]} /></div>
    </div>
  );
}
