import { t } from '../i18n/uk';
import { Rocky, type Mood } from './Rocky';

export function ResultCard({ mood, text, onAgain, onHome }: { mood: Mood; text: string; onAgain: () => void; onHome: () => void }) {
  return (
    <div className="overlay">
      <div className="card">
        <Rocky mood={mood} size={130} />
        <p className="bubble big">{text}</p>
        <div className="row">
          <button className="btn big" onClick={onAgain}>{t.again}</button>
          <button className="btn big alt" onClick={onHome}>{t.home}</button>
        </div>
      </div>
    </div>
  );
}
