// POST /api/submit — validates a finished game, scores it on the server and saves it once.
import { config } from '../src/data/config.js';
import { getStore } from './_lib/store.js';
import { json, readJson } from './_lib/http.js';
import { parseSubmission, scoreSubmission } from './_lib/submission.js';

export async function POST(request: Request): Promise<Response> {
  const store = getStore();
  if (!store) return json({ ok: false, code: 'not_configured', error: 'Shared leaderboard is not set up.' }, 503);

  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return json({ ok: false, code: 'bad_request', error: 'Invalid request body.' }, 400);
  }

  const parsed = parseSubmission(body);
  if (!parsed.ok) return json({ ok: false, code: 'invalid', error: parsed.error }, 400);

  const sub = parsed.value;
  const score = scoreSubmission(sub);
  try {
    const outcome = await store.insert({
      gameId: config.gameId,
      deviceId: sub.deviceId,
      name: sub.name,
      nameKey: sub.nameKey,
      points: score.points,
      correct: score.correct,
      total: score.total,
      pct: score.pct,
      title: score.title.title,
      categories: score.categories,
    });
    if (outcome === 'duplicate_device') {
      return json({ ok: false, code: 'duplicate_device', error: 'This phone has already posted a score.' }, 409);
    }
    if (outcome === 'duplicate_name') {
      return json({ ok: false, code: 'duplicate_name', error: 'Someone already used that name. Add an initial or emoji.' }, 409);
    }
    return json({ ok: true, points: score.points, correct: score.correct, total: score.total, pct: score.pct });
  } catch (err) {
    console.error(err);
    return json({ ok: false, code: 'server_error', error: 'Could not save your score. Try again in a moment.' }, 500);
  }
}
