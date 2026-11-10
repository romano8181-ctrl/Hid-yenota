const POS: Record<string, [number, number]> = { tl: [15, 15], tr: [35, 15], ml: [15, 25], mm: [25, 25], mr: [35, 25], bl: [15, 35], br: [35, 35] };
const PATTERN: string[][] = [[], ['mm'], ['tl', 'br'], ['tl', 'mm', 'br'], ['tl', 'tr', 'bl', 'br'], ['tl', 'tr', 'mm', 'bl', 'br'], ['tl', 'tr', 'ml', 'mr', 'bl', 'br']];

export function DominoTile({ a, b, back = false }: { a: number; b: number; back?: boolean }) {
  return (
    <svg viewBox="0 0 100 50" className="dtile" aria-label={back ? 'Кістка' : `Кістка ${a}-${b}`}>
      <rect x="1.5" y="1.5" width="97" height="47" rx="9" fill={back ? '#7c5cff' : '#fffdf5'} stroke="#2b2140" strokeWidth="3" />
      {back ? (
        <text x="50" y="33" textAnchor="middle" fontSize="22" fill="#ffe14a">★</text>
      ) : (
        <>
          <line x1="50" y1="7" x2="50" y2="43" stroke="#2b2140" strokeWidth="2.5" />
          {[a, b].map((v, half) =>
            PATTERN[v].map((k) => <circle key={`${half}${k}`} cx={POS[k][0] + half * 50} cy={POS[k][1]} r="4.6" fill="#2b2140" />),
          )}
        </>
      )}
    </svg>
  );
}
