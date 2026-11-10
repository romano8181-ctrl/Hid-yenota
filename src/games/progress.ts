export interface GameProgress {
  played: number;
  wins: number;
  /** Найвищий рівень ШІ (1–5), який дитина перемогла */
  bestLevel: number;
}
export type Progress = Record<string, GameProgress>;

const KEY = 'hid-yenota:progress:v1';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

export function saveProgress(p: Progress): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* приватний режим */ }
}

export function recordResult(p: Progress, gameId: string, won: boolean, level: number): Progress {
  const cur = p[gameId] ?? { played: 0, wins: 0, bestLevel: 0 };
  return {
    ...p,
    [gameId]: {
      played: cur.played + 1,
      wins: cur.wins + (won ? 1 : 0),
      bestLevel: won ? Math.max(cur.bestLevel, level) : cur.bestLevel,
    },
  };
}
