import { useState } from 'react';
import { t } from '../i18n/uk';
import { Rocky } from './Rocky';

export type Mode = 'ai' | 'two';
export type LevelId = 1 | 2 | 3 | 4 | 5;
export const LEVEL_ICONS = ['🐱', '🐶', '🦝', '😼', '🦁'];

interface Props {
  gameId: string;
  /** Чи є рівні складності для гри проти Рокі */
  showLevels?: boolean;
  /** Чи доступна гра вдвох на одному екрані (не підходить для ігор з прихованими кістками) */
  allowTwo?: boolean;
  onStart: (mode: Mode, level: LevelId) => void;
  onHome: () => void;
}

export function Setup({ gameId, showLevels = true, allowTwo = true, onStart, onHome }: Props) {
  const [mode, setMode] = useState<Mode>('ai');
  const [level, setLevel] = useState<LevelId>(2);
  return (
    <main className="screen setup">
      <header className="topbar">
        <button className="btn round" onClick={onHome} aria-label={t.home}>🏠</button>
        <h1>{t.games[gameId]}</h1>
      </header>
      <div className="rocky-row"><Rocky mood="happy" size={110} /><p className="bubble">{t.rocky.hello}</p></div>
      <section>
        <h2>{t.chooseMode}</h2>
        <div className="choices">
          <button className={`choice ${mode === 'ai' ? 'on' : ''}`} onClick={() => setMode('ai')}><span className="ci">🦝</span>{t.vsRocky}</button>
          {allowTwo && <button className={`choice ${mode === 'two' ? 'on' : ''}`} onClick={() => setMode('two')}><span className="ci">👫</span>{t.vsFriend}</button>}
        </div>
      </section>
      {mode === 'ai' && showLevels && (
        <section>
          <h2>{t.chooseLevel}</h2>
          <div className="choices levels">
            {t.levels.map((name, i) => (
              <button key={name} className={`choice ${level === i + 1 ? 'on' : ''}`} onClick={() => setLevel((i + 1) as LevelId)}>
                <span className="ci">{LEVEL_ICONS[i]}</span>{name}
              </button>
            ))}
          </div>
        </section>
      )}
      <button className="btn big" onClick={() => onStart(mode, level)}>▶ {t.play}</button>
    </main>
  );
}
