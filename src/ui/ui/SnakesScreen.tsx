import { useEffect, useRef, useState } from 'react';
import { LADDERS, SNAKES, cellPos, resolveRoll } from '../games/snakes';
import { speak } from '../speech';
import { t } from '../i18n/uk';
import { ResultCard } from './ResultCard';
import { Rocky, type Mood } from './Rocky';
import { Setup, type Mode } from './Setup';

const CELL = 60;
const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const center = (n: number) => {
  const { row, col } = cellPos(n);
  return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
};

interface Props { onHome: () => void; onResult: (gameId: string, won: boolean, level: number) => void }

function Board({ pos }: { pos: [number, number] }) {
  const cells = [];
  for (let n = 1; n <= 100; n++) {
    const { row, col } = cellPos(n);
    cells.push(
      <g key={n}>
        <rect x={col * CELL} y={row * CELL} width={CELL} height={CELL} fill={(row + col) % 2 ? '#ffe9b8' : '#ffd98a'} />
        <text x={col * CELL + 5} y={row * CELL + 15} fontSize="12" fill="#8a5a1a">{n}</text>
      </g>,
    );
  }
  const ladders = Object.entries(LADDERS).map(([from, to]) => {
    const a = center(Number(from)), b = center(to);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    const nx = (-dy / len) * 7, ny = (dx / len) * 7;
    const rungs = Math.max(2, Math.floor(len / 28));
    return (
      <g key={`l${from}`} stroke="#9a5b13" strokeWidth="4" strokeLinecap="round">
        <line x1={a.x + nx} y1={a.y + ny} x2={b.x + nx} y2={b.y + ny} />
        <line x1={a.x - nx} y1={a.y - ny} x2={b.x - nx} y2={b.y - ny} />
        {Array.from({ length: rungs }, (_, k) => {
          const f = (k + 0.5) / rungs;
          return <line key={k} strokeWidth="3" x1={a.x + dx * f + nx} y1={a.y + dy * f + ny} x2={a.x + dx * f - nx} y2={a.y + dy * f - ny} />;
        })}
      </g>
    );
  });
  const snakes = Object.entries(SNAKES).map(([head, tail]) => {
    const a = center(Number(head)), b = center(tail);
    const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.1, my = (a.y + b.y) / 2 + (b.x - a.x) * 0.1;
    return (
      <g key={`s${head}`}>
        <path d={`M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`} fill="none" stroke="#2fa84f" strokeWidth="7" strokeLinecap="round" opacity=".8" />
        <circle cx={a.x} cy={a.y} r="9" fill="#2fa84f" />
        <circle cx={a.x - 3} cy={a.y - 2} r="2" fill="#fff" /><circle cx={a.x + 3} cy={a.y - 2} r="2" fill="#fff" />
      </g>
    );
  });
  const tokens = [0, 1].map((p) => {
    if (pos[p] === 0) return null;
    const c = center(pos[p]);
    const off = pos[0] === pos[1] ? (p === 0 ? -9 : 9) : 0;
    return (
      <g key={p} style={{ transition: 'transform .2s' }} transform={`translate(${c.x + off},${c.y + 4})`}>
        <circle r="15" fill={p === 0 ? '#60a5fa' : '#fb923c'} stroke="#fff" strokeWidth="3" />
        <text textAnchor="middle" y="6" fontSize="18">{p === 0 ? '🐱' : '🦝'}</text>
      </g>
    );
  });
  return (
    <svg viewBox="0 0 600 600" className="snakeboard" role="img" aria-label="Поле змій та драбин">
      {cells}{ladders}{snakes}{tokens}
    </svg>
  );
}

export function SnakesScreen({ onHome, onResult }: Props) {
  const [phase, setPhase] = useState<'setup' | 'play'>('setup');
  const [mode, setMode] = useState<Mode>('ai');
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [die, setDie] = useState(0);
  const [busy, setBusy] = useState(false);
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [rocky, setRocky] = useState<{ text: string; mood: Mood }>({ text: t.rocky.rollPrompt, mood: 'happy' });
  const alive = useRef(true);
  const posRef = useRef<[number, number]>([0, 0]);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const say = (text: string, mood: Mood = 'happy', voice = true) => {
    setRocky({ text, mood });
    if (voice) speak(text);
  };
  const names = mode === 'ai' ? [t.you, t.rockyName] : [t.player(1), t.player(2)];

  const begin = (m: Mode) => {
    setMode(m);
    posRef.current = [0, 0];
    setPos([0, 0]);
    setTurn(0);
    setWinner(null);
    setDie(0);
    setBusy(false);
    setPhase('play');
    say(t.rocky.rollPrompt, 'happy');
  };

  const roll = async () => {
    if (busy || winner !== null) return;
    const who = turn;
    setBusy(true);
    let value = 1;
    for (let k = 0; k < 8; k++) {
      value = 1 + Math.floor(Math.random() * 6);
      setDie(value);
      await sleep(70);
      if (!alive.current) return;
    }
    const res = resolveRoll(posRef.current[who], value);
    const setAt = (p: number) => {
      const next: [number, number] = [...posRef.current];
      next[who] = p;
      posRef.current = next;
      setPos(next);
    };
    if (res.steps.length === 0) say(t.rocky.needExact, 'think');
    for (const p of res.steps) {
      setAt(p);
      await sleep(230);
      if (!alive.current) return;
    }
    if (res.jump) {
      say(res.jump === 'ladder' ? t.rocky.ladder : t.rocky.snake, res.jump === 'ladder' ? 'cheer' : 'sad');
      await sleep(700);
      if (!alive.current) return;
      setAt(res.final);
      await sleep(400);
    }
    if (res.final === 100) {
      setWinner(who);
      if (mode === 'ai') {
        onResult('snakes', who === 0, 1);
        say(who === 0 ? t.rocky.win : t.rocky.lose, who === 0 ? 'cheer' : 'sad');
      } else say(`${t.player(who + 1)}: ${t.rocky.win}`, 'cheer');
    } else {
      setTurn(who === 0 ? 1 : 0);
      if (!res.jump && res.steps.length) say(who === 0 && mode === 'ai' ? t.rocky.rockyRolls : t.rocky.rollPrompt, 'happy', false);
    }
    setBusy(false);
  };

  // Рокі кидає кубик сам
  useEffect(() => {
    if (phase !== 'play' || mode !== 'ai' || turn !== 1 || busy || winner !== null) return;
    const id = setTimeout(() => { void roll(); }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, turn, busy, winner]);

  if (phase === 'setup') return <Setup gameId="snakes" showLevels={false} onStart={(m) => begin(m)} onHome={onHome} />;

  const rockyTurn = mode === 'ai' && turn === 1;
  return (
    <main className="screen play">
      <header className="topbar">
        <button className="btn round" onClick={onHome} aria-label={t.home}>🏠</button>
        <h1>{t.games.snakes}</h1>
        <div className="actions">
          <button className="btn round" onClick={() => begin(mode)} aria-label={t.restart}>🔄</button>
        </div>
      </header>
      <div className="rocky-row small">
        <Rocky mood={rocky.mood} size={72} />
        <p className="bubble">{rocky.text}</p>
      </div>
      <Board pos={pos} />
      <div className="dice-row">
        <div className={`score p${turn} on`}>{names[turn]}</div>
        <button className="dice" onClick={roll} disabled={busy || rockyTurn || winner !== null} aria-label="Кинути кубик">
          {die ? DICE[die - 1] : '🎲'}
        </button>
      </div>
      {winner !== null && <ResultCard mood={rocky.mood} text={rocky.text} onAgain={() => begin(mode)} onHome={onHome} />}
    </main>
  );
}
