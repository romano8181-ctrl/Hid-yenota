import { useEffect, useRef, useState } from 'react';
import { RING, START, absCell, applyMove, initialLudo, legalMoves, noMove, rockyMove, winner, type LudoState } from '../games/ludo';
import type { Player } from '../games/types';
import { speak } from '../speech';
import { t } from '../i18n/uk';
import { ResultCard } from './ResultCard';
import { Rocky, type Mood } from './Rocky';
import { LEVEL_ICONS, Setup, type LevelId, type Mode } from './Setup';

const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const C = 300, R = 215;
const COLORS = ['#3b82f6', '#fb923c'];
const FACES = ['🐱', '🦝'];
const BASES: [number, number][][] = [
  [[470, 470], [530, 470], [470, 530], [530, 530]],
  [[70, 70], [130, 70], [70, 130], [130, 130]],
];

function ringXY(abs: number, r = R): [number, number] {
  const a = (abs / RING) * Math.PI * 2;
  return [C - r * Math.sin(a), C + r * Math.cos(a)];
}

function tokenXY(p: Player, prog: number, idx: number): [number, number] {
  if (prog < 0) return BASES[p][idx];
  if (prog < RING) return ringXY(absCell(p, prog));
  const entry = (START[p] + RING - 1) % RING;
  return ringXY(entry, R - (prog - 39) * 32);
}

interface Props { onHome: () => void; onResult: (gameId: string, won: boolean, level: number) => void }

export function LudoScreen({ onHome, onResult }: Props) {
  const [phase, setPhase] = useState<'setup' | 'play'>('setup');
  const [mode, setMode] = useState<Mode>('ai');
  const [level, setLevel] = useState<LevelId>(2);
  const [ls, setLs] = useState<LudoState>(initialLudo());
  const [die, setDie] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ die: number; moves: number[] } | null>(null);
  const [rocky, setRocky] = useState<{ text: string; mood: Mood }>({ text: t.rocky.ludoTip, mood: 'happy' });
  const alive = useRef(true);
  const reported = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const say = (text: string, mood: Mood = 'happy', voice = true) => {
    setRocky({ text, mood });
    if (voice) speak(text);
  };

  const win = winner(ls);
  const names = mode === 'ai' ? [t.you, t.rockyName] : [t.player(1), t.player(2)];
  const rockyTurn = mode === 'ai' && ls.turn === 1;

  const begin = (m: Mode, l: LevelId) => {
    reported.current = false;
    setMode(m);
    setLevel(l);
    setLs(initialLudo());
    setDie(0);
    setBusy(false);
    setPending(null);
    setPhase('play');
    say(t.rocky.ludoTip, 'happy');
  };

  const doMove = async (state: LudoState, i: number, v: number) => {
    const who = state.turn;
    const r = applyMove(state, i, v);
    setLs(r.state);
    setPending(null);
    const w = winner(r.state);
    if (w !== null) {
      if (!reported.current) {
        reported.current = true;
        if (mode === 'ai') {
          onResult('ludo', w === 0, level);
          say(w === 0 ? t.rocky.win : t.rocky.lose, w === 0 ? 'cheer' : 'sad');
        } else say(`${t.player(w + 1)}: ${t.rocky.win}`, 'cheer');
      }
    } else if (r.captured) {
      say(mode === 'ai' && who === 1 ? t.rocky.captured : t.rocky.youCaptured, who === 1 && mode === 'ai' ? 'sad' : 'cheer');
    } else if (v === 6) say(t.rocky.six, 'cheer');
    setBusy(false);
  };

  const roll = async () => {
    if (busy || win !== null) return;
    setBusy(true);
    setPending(null);
    let v = 1;
    for (let k = 0; k < 8; k++) {
      v = 1 + Math.floor(Math.random() * 6);
      setDie(v);
      await sleep(70);
      if (!alive.current) return;
    }
    const moves = legalMoves(ls, v);
    if (!moves.length) {
      say(ls.tokens[ls.turn].every((x) => x < 0) ? t.rocky.needSix : t.rocky.noMoveRoll, 'think', false);
      await sleep(1000);
      if (!alive.current) return;
      setLs(noMove(ls));
      setBusy(false);
      return;
    }
    if (rockyTurn) {
      await sleep(600);
      if (!alive.current) return;
      await doMove(ls, rockyMove(ls, v, moves, level), v);
    } else if (moves.length === 1) {
      await sleep(500);
      if (!alive.current) return;
      await doMove(ls, moves[0], v);
    } else {
      setPending({ die: v, moves });
      say(t.rocky.pickToken, 'happy', false);
      setBusy(false);
    }
  };

  // Рокі кидає кубик сам
  useEffect(() => {
    if (phase !== 'play' || !rockyTurn || busy || win !== null) return;
    const id = setTimeout(() => { void roll(); }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, rockyTurn, busy, win, ls]);

  if (phase === 'setup') return <Setup gameId="ludo" onStart={begin} onHome={onHome} />;

  const canRoll = !busy && !pending && win === null && !rockyTurn;
  const mover = ls.turn;
  const cells = [];
  for (let k = 0; k < RING; k++) {
    const [x, y] = ringXY(k);
    const startOf = k === START[0] ? 0 : k === START[1] ? 1 : -1;
    cells.push(<circle key={k} cx={x} cy={y} r="15" fill={startOf >= 0 ? COLORS[startOf] : '#fff'} opacity={startOf >= 0 ? 0.55 : 1} stroke="#8a5a1a" strokeWidth="2" />);
  }
  const lanes = ([0, 1] as const).flatMap((p) =>
    [0, 1, 2, 3].map((j) => {
      const [x, y] = tokenXY(p, 40 + j, 0);
      return <circle key={`l${p}${j}`} cx={x} cy={y} r="15" fill={COLORS[p]} opacity=".3" stroke={COLORS[p]} strokeWidth="2" />;
    }),
  );

  return (
    <main className="screen play">
      <header className="topbar">
        <button className="btn round" onClick={onHome} aria-label={t.home}>🏠</button>
        <h1>{t.games.ludo}</h1>
        <div className="actions">
          <button className="btn round" onClick={() => begin(mode, level)} aria-label={t.restart}>🔄</button>
        </div>
      </header>
      <div className="rocky-row small">
        <Rocky mood={rocky.mood} size={72} />
        <p className="bubble">{win !== null ? rocky.text : rockyTurn && busy ? t.rocky.thinking : rocky.text}</p>
      </div>
      <svg viewBox="0 0 600 600" className="snakeboard ludo" role="img" aria-label="Поле Лудо">
        <rect width="600" height="600" fill="#fff6e5" />
        {BASES.map((b, p) => (
          <g key={p}>
            <rect x={b[0][0] - 40} y={b[0][1] - 40} width="140" height="140" rx="24" fill={COLORS[p]} opacity=".18" />
            {b.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="18" fill="#fff" stroke={COLORS[p]} strokeWidth="3" />)}
          </g>
        ))}
        {cells}{lanes}
        {([0, 1] as const).flatMap((p) =>
          ls.tokens[p].map((prog, i) => {
            const [x, y] = tokenXY(p, prog, i);
            const movable = pending !== null && p === mover && pending.moves.includes(i);
            return (
              <g key={`${p}${i}`} transform={`translate(${x},${y})`} style={{ cursor: movable ? 'pointer' : 'default', transition: 'transform .25s' }} onClick={() => { if (movable && pending) { setBusy(true); void doMove(ls, i, pending.die); } }}>
                {movable && <circle r="24" fill="none" stroke="#ffb703" strokeWidth="5" className="pulse" />}
                <circle r="17" fill={COLORS[p]} stroke="#fff" strokeWidth="3" />
                <text textAnchor="middle" y="6" fontSize="18">{FACES[p]}</text>
              </g>
            );
          }),
        )}
      </svg>
      <div className="dice-row">
        <div className={`score p${mover} on`}>{names[mover]}{ls.tries > 0 ? ` · ${ls.tries + 1}/3` : ''}</div>
        <button className="dice" onClick={() => void roll()} disabled={!canRoll} aria-label="Кинути кубик">{die ? DICE[die - 1] : '🎲'}</button>
      </div>
      {mode === 'ai' && <p className="levelbar">{LEVEL_ICONS[level - 1]} {t.levels[level - 1]}</p>}
      {win !== null && <ResultCard mood={rocky.mood} text={rocky.text} onAgain={() => begin(mode, level)} onHome={onHome} />}
    </main>
  );
}
