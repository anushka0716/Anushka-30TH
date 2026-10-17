// GET /api/leaderboard — the shared scoreboard for the current gameId.
import { config } from '../src/data/config.js';
import { getStore } from './_lib/store.js';
import { json } from './_lib/http.js';

export async function GET(): Promise<Response> {
  const store = getStore();
  if (!store) return json({ configured: false, entries: [] }, 503);
  try {
    const entries = await store.list(config.gameId, 100);
    return json({ configured: true, mode: store.kind, entries });
  } catch (err) {
    console.error(err);
    return json({ configured: true, error: 'Could not load the leaderboard.', entries: [] }, 500);
  }
}
