/** Змії та драбини: поле 10x10, потрібно потрапити точно на 100 (при переборі стоїмо на місці). */
export const LADDERS: Record<number, number> = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
export const SNAKES: Record<number, number> = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };

export interface RollResult {
  /** Клітинки, якими крокує фішка */
  steps: number[];
  /** Після кроків: стрибок по драбині або змії */
  jump: 'ladder' | 'snake' | null;
  final: number;
}

export function resolveRoll(pos: number, roll: number): RollResult {
  if (pos + roll > 100) return { steps: [], jump: null, final: pos };
  const steps: number[] = [];
  for (let p = pos + 1; p <= pos + roll; p++) steps.push(p);
  const landed = pos + roll;
  if (LADDERS[landed]) return { steps, jump: 'ladder', final: LADDERS[landed] };
  if (SNAKES[landed]) return { steps, jump: 'snake', final: SNAKES[landed] };
  return { steps, jump: null, final: landed };
}

/** Центр клітинки n (1..100) у сітці 10x10; рядок 0 — верх; нумерація зміїною */
export function cellPos(n: number): { row: number; col: number } {
  const ri = Math.floor((n - 1) / 10);
  const off = (n - 1) % 10;
  return { row: 9 - ri, col: ri % 2 === 0 ? off : 9 - off };
}
