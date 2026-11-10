import { useEffect, useState } from 'react';
import { COORDS, type MillMove, type MillState } from '../games/mill';
import type { BoardProps } from './types';

export function millInfo(s: MillState): string {
  return `🔵 в руці: ${s.hand[0]}   🟠 в руці: ${s.hand[1]}`;
}

const S = 80;
const px = (v: number) => 40 + v * S;
const COLORS = ['#3b82f6', '#fb923c'];
const RINGS = [[0, 2, 4, 6], [8, 10, 12, 14], [16, 18, 20, 22]];

export function MillBoard({ state, moves, onMove, hint, last, locked, showHints }: BoardProps<MillState, MillMove>) {
  const [sel, setSel] = useState<number | null>(null);
  const [pend, setPend] = useState<{ from: number; to: number } | null>(null);
  useEffect(() => { setSel(null); setPend(null); }, [state]);

  const placing = state.hand[state.turn] > 0;
  const removable = pend ? new Set(moves.filter((m) => m.from === pend.from && m.to === pend.to).map((m) => m.remove)) : new Set<number>();
  const movable = new Set(moves.map((m) => m.from));
  const targets = sel !== null ? new Set(moves.filter((m) => m.from === sel).map((m) => m.to)) : new Set<number>();
  const placeTargets = placing && !locked && !pend ? new Set(moves.map((m) => m.to)) : new Set<number>();

  const choose = (from: number, to: number) => {
    const cands = moves.filter((m) => m.from === from && m.to === to);
    if (cands.length === 1 && cands[0].remove < 0) onMove(cands[0]);
    else if (cands.length) setPend({ from, to });
  };

  const click = (i: number) => {
    if (locked) return;
    if (pend) {
      const m = moves.find((x) => x.from === pend.from && x.to === pend.to && x.remove === i);
      if (m) onMove(m);
      else setPend(null);
      return;
    }
    if (placing) return choose(-1, i);
    if (state.board[i] === state.turn && movable.has(i)) return setSel(i);
    if (sel !== null && targets.has(i)) return choose(sel, i);
    setSel(null);
  };

  return (
    <div className="millwrap">
      <p className="banner">{pend ? 'Мельниця! Обери фішку суперника, щоб її забрати.' : ' '}</p>
      <svg viewBox="0 0 560 560" className="mill" role="grid">
        <g stroke="#8a5a1a" strokeWidth="5" fill="none" strokeLinecap="round">
          {RINGS.map((r, k) => (
            <rect key={k} x={px(COORDS[r[0]][0])} y={px(COORDS[r[0]][1])} width={(COORDS[r[2]][0] - COORDS[r[0]][0]) * S} height={(COORDS[r[2]][1] - COORDS[r[0]][1]) * S} />
          ))}
          {[1, 3, 5, 7].map((k) => (
            <line key={k} x1={px(COORDS[k][0])} y1={px(COORDS[k][1])} x2={px(COORDS[16 + k][0])} y2={px(COORDS[16 + k][1])} />
          ))}
        </g>
        {COORDS.map(([cx, cy], i) => {
          const piece = state.board[i];
          const isLast = last !== null && (last.to === i || last.from === i);
          const isHint = hint !== null && (hint.to === i || hint.from === i || hint.remove === i);
          const can = !locked && (placeTargets.has(i) || targets.has(i) || (!placing && !pend && movable.has(i) && sel === null) || removable.has(i));
          return (
            <g key={i} onClick={() => click(i)} style={{ cursor: can ? 'pointer' : 'default' }} role="button" aria-label={`Точка ${i}`}>
              <circle cx={px(cx)} cy={px(cy)} r="30" fill="transparent" />
              {piece === null && <circle cx={px(cx)} cy={px(cy)} r="10" fill="#8a5a1a" />}
              {piece === null && can && showHints && <circle cx={px(cx)} cy={px(cy)} r="16" fill="none" stroke="#7c5cff" strokeWidth="4" strokeDasharray="5 4" />}
              {pend && pend.to === i && <circle cx={px(cx)} cy={px(cy)} r="20" fill={COLORS[state.turn]} opacity=".5" />}
              {piece !== null && (
                <circle
                  cx={px(cx)} cy={px(cy)} r="22" fill={COLORS[piece]} stroke={removable.has(i) ? '#ef4444' : sel === i ? '#22c55e' : isHint ? '#ffb703' : isLast ? '#facc15' : '#fff'}
                  strokeWidth={removable.has(i) || sel === i || isHint ? 7 : 4}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
