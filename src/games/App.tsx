import { useCallback, useState } from 'react';
import { loadProgress, recordResult, saveProgress, type Progress } from './progress';
import { stopSpeaking } from './speech';
import { GameScreen } from './ui/GameScreen';
import { MapScreen } from './ui/MapScreen';
import { CUSTOM, PLAYABLE } from './ui/registry';

export default function App() {
  const [current, setCurrent] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(loadProgress);

  const onResult = useCallback((gameId: string, won: boolean, level: number) => {
    setProgress((p) => {
      const next = recordResult(p, gameId, won, level);
      saveProgress(next);
      return next;
    });
  }, []);

  const playable = PLAYABLE.find((p) => p.id === current);
  if (playable) {
    return (
      <GameScreen
        key={playable.id}
        playable={playable}
        onHome={() => { stopSpeaking(); setCurrent(null); }}
        onResult={onResult}
      />
    );
  }
  const Custom = current ? CUSTOM[current] : undefined;
  if (Custom) {
    return <Custom key={current} onHome={() => { stopSpeaking(); setCurrent(null); }} onResult={onResult} />;
  }
  return <MapScreen progress={progress} onOpen={setCurrent} />;
}
