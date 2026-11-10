export type Mood = 'happy' | 'think' | 'cheer' | 'sad';

const MOUTH: Record<Mood, string> = {
  happy: 'M-9 30 Q0 38 9 30',
  think: 'M-6 33 L6 33',
  cheer: 'M-11 29 Q0 46 11 29 Z',
  sad: 'M-9 36 Q0 28 9 36',
};

export function Rocky({ mood = 'happy', crown = true, size = 120 }: { mood?: Mood; crown?: boolean; size?: number }) {
  const pupilY = mood === 'think' ? -6 : -1;
  return (
    <svg width={size} height={size} viewBox="-75 -95 150 150" role="img" aria-label="Єнот Рокі" className={`rocky rocky-${mood}`}>
      <circle cx="-40" cy="-42" r="16" fill="#5F5E5A" />
      <circle cx="40" cy="-42" r="16" fill="#5F5E5A" />
      <circle cx="-40" cy="-42" r="8" fill="#F4C0D1" />
      <circle cx="40" cy="-42" r="8" fill="#F4C0D1" />
      <ellipse rx="58" ry="50" fill="#888780" />
      <rect x="-52" y="-18" width="104" height="32" rx="16" fill="#2C2C2A" />
      <circle cx="-24" cy="-2" r="10" fill="#fff" />
      <circle cx="24" cy="-2" r="10" fill="#fff" />
      <circle cx="-22" cy={pupilY} r="5" fill="#2C2C2A" />
      <circle cx="26" cy={pupilY} r="5" fill="#2C2C2A" />
      <ellipse cy="26" rx="26" ry="19" fill="#F1EFE8" />
      <ellipse cy="16" rx="7" ry="5" fill="#2C2C2A" />
      <path d={MOUTH[mood]} fill={mood === 'cheer' ? '#E24B4A' : 'none'} stroke="#2C2C2A" strokeWidth="2" strokeLinecap="round" />
      {crown && (
        <>
          <polygon points="-18,-48 -18,-72 -9,-60 0,-78 9,-60 18,-72 18,-48" fill="#EF9F27" stroke="#BA7517" strokeWidth="2" strokeLinejoin="round" />
          <circle cy="-80" r="3" fill="#EF9F27" />
        </>
      )}
    </svg>
  );
}
