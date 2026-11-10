import { decodeState } from './codec';
import { solve, type Request } from './engine';

self.onmessage = (e: MessageEvent<{ id: number; req: Request }>) => {
  const { id, req } = e.data;
  try {
    self.postMessage({ id, move: solve(req, decodeState) ?? null });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
};
