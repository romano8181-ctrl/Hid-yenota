import { decodeState, encodeState } from './codec';
import { solve, type Request } from './engine';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (m: unknown) => void; reject: (e: unknown) => void }>();

function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; move?: unknown; error?: string }>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.error) p.reject(e.data.error);
      else p.resolve(e.data.move ?? null);
    };
    worker.onerror = () => {
      for (const p of pending.values()) p.reject('worker failed');
      pending.clear();
      worker = null;
    };
    return worker;
  } catch {
    return null;
  }
}

/** Обчислює хід ШІ або підказку у фоновому потоці; якщо воркер недоступний, рахує одразу */
export async function ask<M>(req: Request): Promise<M | null> {
  const encoded = { ...req, state: encodeState(req.gameId, req.state) } as Request;
  const w = getWorker();
  if (w) {
    try {
      return await new Promise<M | null>((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve: resolve as (m: unknown) => void, reject });
        w.postMessage({ id, req: encoded });
      });
    } catch { /* падаємо назад на синхронний розрахунок */ }
  }
  return solve(encoded, decodeState) as M | null;
}
