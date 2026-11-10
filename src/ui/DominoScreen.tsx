import { useEffect, useRef, useState } from 'react';
import { draw, newDomino, options, outcome, pass, pips, play, rockyOption, type DominoState, type End } from '../games/domino';
import { speak } from '../speech';
import { t } from '../i18n/uk';
import { DominoTile } from './DominoTile';
import { ResultCard } from './ResultCard';
import { Rocky, type Mood } from './Rocky';
import { LEVEL_ICONS, Setup, type LevelId } from './Setup';

interface Props { onHome: () => void; onResult: (gameId: string, won: boolean, level: number) => void }

export function DominoScreen({ onHome, onResult }: Props) {
  const [phase, setPhase] = useState<'setup' | 'play'>('setup');
  const [level, setLevel] = useState<LevelId>(2);
  const [s, setS] = useState<DominoState>(() => newDomino());
  const [chosen, setChosen] = useState<number | null>(null);
  const [rocky, setRocky] = useState<{ text: string; mood: Mood }>({ text: t.rocky.dominoTip, mood: 'happy' });
  const reported = useRef(false);

  const say = (text: string, mood: Mood = 'happy', voice = true) => {
    setRocky({ text, mood });
    if (voice) speak(text);
  };

  const out = outcome(s);
  const mine = options(s, 0);
  const rockyTurn = phase === 'play' && s.turn === 1 && !out.over;
  const myTurn = phase === 'play' && s.turn === 0 && !out.over;
  const canDraw = myTurn && mine.length === 0 && s.yard.length > 0;
  const mustPass = myTurn && mine.length === 0 && s.yard.length === 0;
  const playableIdx = new Set(mine.map((o) => o.index));

  const begin = (_m: unknown, l: LevelId) => {
    reported.current = false;
    setLevel(l);
    setS(newDomino());
    setChosen(null);
    setPhase('play');
    say(t.rocky.dominoTip, 'happy');
  };

  const tapTile = (i: number) => {
    if (!myTurn) return;
    const opts = mine.filter((o) => o.index === i);
    if (!opts.length) return;
    if (opts.length === 1) { setChosen(null); setS(play(s, 0, i, opts[0].end)); return; }
    setChosen(i);
    say(t.rocky.chooseEnd, 'think', false);
  };
  const placeAt = (end: End) => {
    if (chosen === null) return;
    setS(play(s, 0, chosen, end));
    setChosen(null);
  };

  // Підказка, що робити, коли ходу немає
  useEffect(() => {
    if (canDraw) say(t.rocky.yardDraw, 'think');
    if (mustPass) say(t.rocky.yardEmpty, 'think');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDraw, mustPass]);

  // Автоматичний пас дитини, якщо ні ходу, ні купки
  useEffect(() => {
    if (!mustPass) return;
    const id = setTimeout(() => setS((cur) => pass(cur)), 1500);
    return () => clearTimeout(id);
  }, [mustPass]);

  // Хід Рокі
  useEffect(() => {
    if (!rockyTurn) return;
    const id = setTimeout(() => {
      const opts = options(s, 1);
      if (opts.length) {
        const o = rockyOption(s, level);
        setS(play(s, 1, o.index, o.end));
        setRocky({ text: t.rocky.yourTurn, mood: 'happy' });
      } else if (s.yard.length) {
        setS(draw(s, 1));
        setRocky({ text: t.rocky.rockyDraws, mood: 'think' });
      } else {
        setS(pass(s));
        say(t.rocky.rockyPass, 'think');
      }
    }, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rockyTurn, s, level]);

  // Кінець гри
  useEffect(() => {
    if (!out.over || reported.current || phase !== 'play') return;
    reported.current = true;
    onResult('domino', out.winner === 0, level);
    if (out.winner === 0) say(t.rocky.win, 'cheer');
    else if (out.winner === 1) say(t.rocky.lose, 'sad');
    else say(t.rocky.draw, 'happy');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out.over, phase]);

  if (phase === 'setup') return <Setup gameId="domino" allowTwo={false} onStart={begin} onHome={onHome} />;

  const status = out.over ? rocky.text : rockyTurn ? t.rocky.thinking : myTurn && canDraw ? t.rocky.yardDraw : myTurn ? t.rocky.yourTurn : rocky.text;
  return (
    <main className="screen play domino">
      <header className="topbar">
        <button className="btn round" onClick={onHome} aria-label={t.home}>🏠</button>
        <h1>{t.games.domino}</h1>
        <div className="actions">
          <button className="btn round" onClick={() => begin(null, level)} aria-label={t.restart}>🔄</button>
        </div>
      </header>
      <div className="rocky-row small">
        <Rocky mood={rockyTurn ? 'think' : rocky.mood} size={72} />
        <p className="bubble">{status}</p>
      </div>
      <div className="dhand rockyhand" aria-label="Кістки Рокі">
        {s.hands[1].map((_, i) => <DominoTile key={i} a={0} b={0} back />)}
      </div>
      <div className="chain" aria-label="Ряд кісток">
        {s.chain.length === 0 && <p className="hintline">{t.rocky.dominoTip}</p>}
        {s.chain.map((tile, i) => <DominoTile key={i} a={tile[0]} b={tile[1]} />)}
      </div>
      <div className="row dctl">
        <span className="pill">{t.yard}: {s.yard.length}</span>
        <button className="btn" disabled={!canDraw} onClick={() => setS(draw(s, 0))}>{t.fromYard}</button>
        {chosen !== null && (
          <>
            <button className="btn alt" onClick={() => placeAt('L')}>◀ {t.left}</button>
            <button className="btn alt" onClick={() => placeAt('R')}>{t.right} ▶</button>
          </>
        )}
      </div>
      <div className="dhand">
        {s.hands[0].map((tile, i) => (
          <button
            key={`${tile[0]}${tile[1]}`}
            className={`dbtn ${playableIdx.has(i) && myTurn ? 'can' : ''} ${chosen === i ? 'sel' : ''}`}
            disabled={!myTurn || !playableIdx.has(i)}
            onClick={() => tapTile(i)}
          >
            <DominoTile a={tile[0]} b={tile[1]} />
          </button>
        ))}
      </div>
      <p className="levelbar">{LEVEL_ICONS[level - 1]} {t.levels[level - 1]}{out.over ? ` · ${pips(s.hands[0])} : ${pips(s.hands[1])}` : ''}</p>
      {out.over && <ResultCard mood={rocky.mood} text={rocky.text} onAgain={() => begin(null, level)} onHome={onHome} />}
    </main>
  );
}
