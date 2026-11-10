import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ask } from '../ai/client';
import { hintDepth, levelFor } from '../ai/levels';
import { speak } from '../speech';
import { t } from '../i18n/uk';
import { Rocky, type Mood } from './Rocky';
import { ResultCard } from './ResultCard';
import { LEVEL_ICONS, Setup, type LevelId, type Mode } from './Setup';
import type { Playable } from './types';

interface Entry<S, M> { s: S; move: M | null }

interface Props<S, M> {
  playable: Playable<S, M>;
  onHome: () => void;
  onResult: (gameId: string, won: boolean, level: number) => void;
}

export function GameScreen<S, M>({ playable, onHome, onResult }: Props<S, M>) {
  const { game, Board, id, info } = playable;
  const [phase, setPhase] = useState<'setup' | 'play'>('setup');
  const [mode, setMode] = useState<Mode>('ai');
  const [level, setLevel] = useState<LevelId>(2);
  const [hist, setHist] = useState<Entry<S, M>[]>([{ s: game.initial(), move: null }]);
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState<M | null>(null);
  const [rocky, setRocky] = useState<{ text: string; mood: Mood }>({ text: t.rocky.hello, mood: 'happy' });
  const reported = useRef(false);

  const say = useCallback((text: string, mood: Mood = 'happy', voice = true) => {
    setRocky({ text, mood });
    if (voice) speak(text);
  }, []);

  const cur = hist[hist.length - 1];
  const moves = useMemo(() => game.moves(cur.s), [game, cur]);
  const outcome = useMemo(() => game.outcome(cur.s), [game, cur]);
  const over = outcome.over;
  const turn = game.turn(cur.s);
  const aiTurn = phase === 'play' && mode === 'ai' && !over && turn === 1;
  const sideNames = t.sides[id] ?? ['Гравець 1', 'Гравець 2'];

  const push = useCallback((m: M) => {
    setHint(null);
    setHist((h) => [...h, { s: game.apply(h[h.length - 1].s, m), move: m }]);
  }, [game]);

  // Хід ШІ (рахується у фоновому потоці; пауза робить хід «людянішим»)
  useEffect(() => {
    if (!aiTurn) return;
    let cancelled = false;
    setThinking(true);
    const pause = new Promise((r) => setTimeout(r, 600));
    Promise.all([ask<M>({ kind: 'move', gameId: id, state: cur.s, level: levelFor(id, level) }), pause]).then(([m]) => {
      if (cancelled) return;
      setThinking(false);
      if (m !== null) {
        push(m);
        const phrases = t.rocky.nice;
        say(phrases[Math.floor(Math.random() * phrases.length)], 'happy', false);
      }
    });
    return () => { cancelled = true; setThinking(false); };
  }, [aiTurn, cur, id, level, push, say]);

  // Кінець гри
  useEffect(() => {
    if (!over || reported.current || phase !== 'play') return;
    reported.current = true;
    if (mode === 'ai') {
      const won = outcome.winner === 0;
      onResult(id, won, level);
      if (won) say(t.rocky.win, 'cheer');
      else if (outcome.winner === 1) say(t.rocky.lose, 'sad');
      else say(t.rocky.draw, 'happy');
    } else if (outcome.winner === null) say(t.rocky.draw, 'happy');
    else say(t.rocky.winSide(sideNames[outcome.winner]), 'cheer');
  }, [over, outcome, phase, mode, id, level, onResult, say, sideNames]);

  const begin = (m: Mode, l: LevelId) => {
    reported.current = false;
    setMode(m);
    setLevel(l);
    setHist([{ s: game.initial(), move: null }]);
    setHint(null);
    setPhase('play');
    say(id === 'wolves' && m === 'ai' ? t.rocky.wolvesTip : m === 'ai' ? t.rocky.yourTurn : t.rocky.hello, 'happy');
  };
  const start = () => begin(mode, level);

  const showHint = async () => {
    if (over || aiTurn || thinking) return;
    setThinking(true);
    const m = await ask<M>({ kind: 'hint', gameId: id, state: cur.s, depth: hintDepth(id) });
    setThinking(false);
    if (m === null) return say(t.rocky.noHint, 'think');
    setHint(m);
    say(t.rocky.hintShown, 'think');
  };

  const undo = () => {
    if (thinking || hist.length < 2) return;
    setHint(null);
    reported.current = false;
    setHist((h) => {
      const next = h.slice(0, -1);
      if (mode === 'ai') while (next.length > 1 && game.turn(next[next.length - 1].s) !== 0) next.pop();
      return next;
    });
    say(t.rocky.undone, 'happy', false);
  };

  if (phase === 'setup') return <Setup gameId={id} onStart={begin} onHome={onHome} />;

  const locked = over || aiTurn;
  const status = over ? '' : mode === 'two' ? `${sideNames[turn]}: ${t.rocky.yourTurn}` : thinking ? t.rocky.thinking : t.rocky.yourTurn;

  return (
    <main className="screen play">
      <header className="topbar">
        <button className="btn round" onClick={onHome} aria-label={t.home}>🏠</button>
        <h1>{t.games[id]}</h1>
        <div className="actions">
          <button className="btn round" onClick={showHint} disabled={locked} aria-label={t.hint}>💡</button>
          <button className="btn round" onClick={undo} disabled={thinking || hist.length < 2} aria-label={t.undo}>↩️</button>
          <button className="btn round" onClick={start} aria-label={t.restart}>🔄</button>
        </div>
      </header>
      <div className="rocky-row small">
        <Rocky mood={thinking ? 'think' : rocky.mood} size={72} />
        <p className="bubble">{over ? rocky.text : status || rocky.text}</p>
      </div>
      <Board state={cur.s} moves={moves} onMove={push} hint={hint} last={cur.move} locked={locked} showHints={true} />
      {info && <p className="levelbar info">{info(cur.s)}</p>}
      {mode === 'ai' && <p className="levelbar">{LEVEL_ICONS[level - 1]} {t.levels[level - 1]}</p>}
      {over && <ResultCard mood={rocky.mood} text={rocky.text} onAgain={start} onHome={onHome} />}
    </main>
  );
}
