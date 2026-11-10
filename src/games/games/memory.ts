import type { Player } from './types';
import { other } from './types';

export interface MemCard {
  face: string;
  state: 'down' | 'up' | 'matched';
  owner: Player | null;
}

export interface MemState {
  cards: MemCard[];
  /** Перша відкрита карта ходу */
  first: number | null;
  /** Пара, що не збіглася й чекає закриття */
  pending: [number, number] | null;
  turn: Player;
  scores: [number, number];
  /** Карти, які Рокі «запам'ятав» (відкриті й не знайдені) */
  known: number[];
}

export const FACES = ['🐱', '🐶', '🦝', '🐰', '🦊', '🐼', '🐸', '🦁', '🐵', '🐷', '🐯', '🐮'];

export function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function newMemory(pairs: number, rnd: () => number = Math.random): MemState {
  const faces = shuffle(FACES, rnd).slice(0, pairs);
  const cards = shuffle([...faces, ...faces], rnd).map((face): MemCard => ({ face, state: 'down', owner: null }));
  return { cards, first: null, pending: null, turn: 0, scores: [0, 0], known: [] };
}

/** Відкрити карту. memP — імовірність, що Рокі запам'ятає цю карту */
export function flip(s: MemState, i: number, memP: number, rnd: () => number = Math.random): MemState {
  if (s.pending || s.cards[i].state !== 'down') return s;
  const cards = s.cards.slice();
  cards[i] = { ...cards[i], state: 'up' };
  const known = !s.known.includes(i) && rnd() < memP ? [...s.known, i] : s.known;
  if (s.first === null) return { ...s, cards, first: i, known };
  const a = s.first;
  if (cards[a].face === cards[i].face) {
    cards[a] = { ...cards[a], state: 'matched', owner: s.turn };
    cards[i] = { ...cards[i], state: 'matched', owner: s.turn };
    const scores: [number, number] = [...s.scores];
    scores[s.turn]++;
    return { ...s, cards, first: null, known: known.filter((k) => k !== a && k !== i), scores };
  }
  return { ...s, cards, first: null, pending: [a, i], known };
}

/** Закрити непарні карти й передати хід */
export function resolve(s: MemState): MemState {
  if (!s.pending) return s;
  const cards = s.cards.slice();
  for (const i of s.pending) cards[i] = { ...cards[i], state: 'down' };
  return { ...s, cards, pending: null, turn: other(s.turn) };
}

export const isOver = (s: MemState) => s.cards.every((c) => c.state === 'matched');

/** Вибір карти Рокі: спершу відома пара, потім невідомі карти */
export function rockyPick(s: MemState, rnd: () => number = Math.random): number {
  const down = s.cards.map((c, i) => (c.state === 'down' ? i : -1)).filter((i) => i >= 0);
  if (s.first === null) {
    for (const a of s.known) {
      if (s.known.some((b) => b !== a && s.cards[b].face === s.cards[a].face)) return a;
    }
  } else {
    const face = s.cards[s.first].face;
    const m = s.known.find((k) => k !== s.first && s.cards[k].face === face && s.cards[k].state === 'down');
    if (m !== undefined) return m;
  }
  const unknown = down.filter((i) => !s.known.includes(i));
  const pool = unknown.length ? unknown : down;
  return pool[Math.floor(rnd() * pool.length)];
}
