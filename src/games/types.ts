export type Player = 0 | 1;

export interface Outcome {
  over: boolean;
  /** Переможець; null — нічия або гра триває */
  winner: Player | null;
}

/**
 * Єдиний інтерфейс гри. Інтерфейс, ШІ, підказки й тести працюють з будь-якою грою,
 * що його реалізує. Стани вважаються незмінними (apply повертає новий стан).
 * Гравець 0 ходить першим (білі / хрестики).
 */
export interface Game<S, M> {
  id: string;
  initial(): S;
  turn(s: S): Player;
  moves(s: S): M[];
  apply(s: S, m: M): S;
  outcome(s: S): Outcome;
  /** Евристична оцінка з погляду гравця 0: більше — краще для гравця 0 */
  score(s: S): number;
  /** Необов'язкове впорядкування ходів для швидшого пошуку */
  order?(s: S, moves: M[]): M[];
}

export const other = (p: Player): Player => (p === 0 ? 1 : 0);
