import { useEffect, useState } from 'react';
import type { ChessMove, ChessState } from '../games/chess';
import type { BoardProps } from './types';

const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const name = (r: number, c: number) => 'abcdefgh'[c] + (8 - r);

export function ChessBoard({ state, moves, onMove, hint, last, locked, showHints }: BoardProps<ChessState, ChessMove>) {
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => setSel(null), [state]);

  const board = state.board();
  const movableFrom = new Set(moves.map((m) => m.from));
  const targets = new Map(moves.filter((m) => m.from === sel).map((m) => [m.to, m]));
  const turn = state.turn();
  const checkedKing = state.isCheck()
    ? board.flat().find((p) => p && p.type === 'k' && p.color === turn)?.square
    : undefined;

  const click = (sqName: string) => {
    if (locked) return;
    const m = targets.get(sqName);
    if (m) return onMove(m);
    setSel(movableFrom.has(sqName) ? sqName : null);
  };

  const cells = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = name(r, c);
      const p = board[r][c];
      const cls = [
        'sq', (r + c) % 2 === 1 ? 'dark' : 'light',
        sel === sq ? 'sel' : '',
        last && (last.from === sq || last.to === sq) ? 'last' : '',
        hint && (hint.from === sq || hint.to === sq) ? 'hint' : '',
        checkedKing === sq ? 'check' : '',
        showHints && !locked && sel === null && movableFrom.has(sq) ? 'can' : '',
      ].filter(Boolean).join(' ');
      cells.push(
        <button key={sq} className={cls} onClick={() => click(sq)} aria-label={sq}>
          {p && <span className={`piece ${p.color === 'w' ? 'pw' : 'pb'}`}>{GLYPH[p.type]}{'︎'}</span>}
          {targets.has(sq) && <span className={p ? 'ring' : 'dot'} />}
        </button>,
      );
    }
  }
  return <div className="board grid8" role="grid">{cells}</div>;
}
