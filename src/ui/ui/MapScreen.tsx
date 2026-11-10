import { useState } from 'react';
import { t } from '../i18n/uk';
import { setSoundEnabled, soundEnabled, speak } from '../speech';
import type { Progress } from '../progress';
import { CUSTOM, ISLANDS, NO_LEVELS, PLAYABLE } from './registry';
import { Rocky } from './Rocky';

export function MapScreen({ progress, onOpen }: { progress: Progress; onOpen: (id: string) => void }) {
  const [sound, setSound] = useState(soundEnabled());
  const ready = new Set([...PLAYABLE.map((p) => p.id), ...Object.keys(CUSTOM)]);

  const toggle = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) speak(t.rocky.pickGame);
  };

  return (
    <main className="screen map">
      <header className="topbar">
        <div className="brand">
          <Rocky size={64} />
          <div>
            <h1>{t.appName}</h1>
            <p className="tag">{t.tagline}</p>
          </div>
        </div>
        <button className="btn round" onClick={toggle} aria-label={t.sound} aria-pressed={sound}>{sound ? '🔊' : '🔇'}</button>
      </header>
      <div className="islands">
        {ISLANDS.map((isl) => {
          const open = ready.has(isl.id);
          const best = progress[isl.id]?.bestLevel ?? 0;
          return (
            <button
              key={isl.id}
              className={`island ${open ? '' : 'locked'}`}
              style={{ background: isl.color }}
              disabled={!open}
              onClick={() => onOpen(isl.id)}
            >
              <span className="icon">{isl.icon}</span>
              <span className="name">{t.games[isl.id]}</span>
              <span className="age">{isl.age}+</span>
              {open && NO_LEVELS.has(isl.id) ? (
                <span className="stars"><span className="on">🏆</span> {progress[isl.id]?.wins ?? 0}</span>
              ) : open ? (
                <span className="stars" aria-label={`Зірок: ${best}`}>
                  {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= best ? 'on' : ''}>★</span>)}
                </span>
              ) : (
                <span className="soon">{t.soon}</span>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}
