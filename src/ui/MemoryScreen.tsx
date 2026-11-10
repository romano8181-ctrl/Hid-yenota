import { useEffect, useRef, useState } from 'react';
import { flip, isOver, newMemory, resolve, rockyPick, type MemState } from '../games/memory';
import { speak } from '../speech';
import { t } from '../i18n/uk';
import { ResultCard } from './ResultCard';
import { Rocky, type Mood } from './Rocky';
import { LEVEL_ICONS, Setup, type LevelId, type Mode } from './Setup';

const PAIRS = 8;
/** Імовірність, що Рокі запам'ятає відкриту карту */
const MEMORY_P = [0.1, 0.3, 0.55, 0.8, 1];

interface Props { onHome: () => void; onResult: (gameId: string, won: boolean, level: number) => void }

export function MemoryScreen({ onHome, onResult }: Props) {
  const [phase, setPhase] = useState<'setup' | 'play'>('setup');
  const [mode, setMode] = useState<Mode>('ai');
  const [level, setLevel] = useState<LevelId>(2);
  const [s, setS] = useState<MemState>(() => newMemory(PAIRS));
  const [rocky, setRocky] = useState<{ text: string; mood: Mood }>({ text: t.rocky.findPair, mood: 'happy' });
  const reported = useRef(false);

  const say = (text: string, mood: Mood = 'happy', voice = true) => {
    setRocky({ text, mood });
    if (voice) speak(text);
  };

  const memP = MEMORY_P[level - 1];
  const over = isOver(s);
  const rockyTurn = phase === 'play' && mode === 'ai' && s.turn === 1 && !over;
  const locked = over || rockyTurn || s.pending !== null;

  const begin = (m: Mode, l: LevelId) => {
    reported.current = false;
    setMode(m);
    setLevel(l);
    setS(newMemory(PAIRS));
    setPhase('play');
    say(t.rocky.findPair, 'happy');
  };

  /** Застосовує відкриття карти й коментує результат (і для дитини, і для Рокі) */
  const commit = (prev: MemState, next: MemState) => {
    if (next.pending) say(t.rocky.noPair, 'think', false);
    else if (next.scores[prev.turn] > prev.scores[prev.turn]) say(t.rocky.pairFound, 'cheer', false);
    setS(next);
  };

  const onFlip = (i: number) => {
    if (locked) return;
    commit(s, flip(s, i, memP));
  };

  // Закриваємо карти, що не збіглися
  useEffect(() => {
    if (!s.pending) return;
    const id = setTimeout(() => setS((cur) => resolve(cur)), 1100);
    return () => clearTimeout(id);
  }, [s.pending]);

  // Хід Рокі: кожна відкрита карта — окремий крок
  useEffect(() => {
    if (!rockyTurn || s.pending) return;
    const id = setTimeout(() => commit(s, flip(s, rockyPick(s), memP)), 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rockyTurn, s, memP]);

  // Кінець гри
  useEffect(() => {
    if (!over || reported.current || phase !== 'play') return;
    reported.current = true;
    const [a, b] = s.scores;
    if (mode === 'ai') {
      onResult('memory', a > b, level);
      if (a > b) say(t.rocky.memoryWin(a, b), 'cheer');
      else if (b > a) say(t.rocky.memoryLose(a, b), 'sad');
      else say(t.rocky.draw, 'happy');
    } else if (a === b) say(t.rocky.draw, 'happy');
    else say(`${t.player(a > b ? 1 : 2)}: ${a > b ? a : b} пар. Вітаю!`, 'cheer');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, phase]);

  if (phase === 'setup') return <Setup gameId="memory" onStart={begin} onHome={onHome} />;

  const names = mode === 'ai' ? [t.you, t.rockyName] : [t.player(1), t.player(2)];
  return (
    <main className="screen play">
      <header className="topbar">
        <button className="btn round" onClick={onHome} aria-label={t.home}>🏠</button>
        <h1>{t.games.memory}</h1>
        <div className="actions">
          <button className="btn round" onClick={() => begin(mode, level)} aria-label={t.restart}>🔄</button>
        </div>
      </header>
      <div className="rocky-row small">
        <Rocky mood={rockyTurn ? 'think' : rocky.mood} size={72} />
        <p className="bubble">{rockyTurn && !s.pending ? t.rocky.thinking : rocky.text}</p>
      </div>
      <div className="scores">
        {names.map((n, i) => (
          <div key={i} className={`score p${i} ${s.turn === i && !over ? 'on' : ''}`}>{n}: <b>{s.scores[i]}</b></div>
        ))}
      </div>
      <div className="memgrid" role="grid">
        {s.cards.map((c, i) => (
          <button
            key={i}
            className={`mcard ${c.state !== 'down' ? 'up' : ''} ${c.state === 'matched' ? `matched o${c.owner}` : ''}`}
            onClick={() => onFlip(i)}
            disabled={locked || c.state !== 'down'}
            aria-label={c.state === 'down' ? 'Закрита картка' : c.face}
          >
            <span className="mface back">⭐</span>
            <span className="mface front">{c.face}</span>
          </button>
        ))}
      </div>
      {mode === 'ai' && <p className="levelbar">{LEVEL_ICONS[level - 1]} {t.levels[level - 1]}</p>}
      {over && <ResultCard mood={rocky.mood} text={rocky.text} onAgain={() => begin(mode, level)} onHome={onHome} />}
    </main>
  );
}
