import type { AnswerRecord } from '../../src/core/types.js';
import { config } from '../../src/data/config.js';
import { questionsById } from '../../src/core/bank.js';
import { scoreRun } from '../../src/core/scoring.js';

export interface ValidSubmission {
  deviceId: string;
  name: string;
  nameKey: string;
  answers: AnswerRecord[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f-\u009f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (name.length < 1 || name.length > 24) return null;
  return name;
}

/** Validates the raw JSON body. Returns the cleaned submission or an error message. */
export function parseSubmission(body: unknown): { ok: true; value: ValidSubmission } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request.' };
  const b = body as Record<string, unknown>;

  if (typeof b.deviceId !== 'string' || !UUID.test(b.deviceId)) return { ok: false, error: 'Invalid device id.' };
  const name = cleanName(b.name);
  if (!name) return { ok: false, error: 'Name must be 1–24 characters.' };
  if (!Array.isArray(b.answers)) return { ok: false, error: 'Missing answers.' };
  if (b.answers.length !== questionsById.size) return { ok: false, error: 'Answer every question before submitting.' };

  const maxMs = config.timerSeconds > 0 ? config.timerSeconds * 1000 + 2000 : 60 * 60 * 1000;
  const seen = new Set<string>();
  const answers: AnswerRecord[] = [];
  for (const raw of b.answers) {
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid answer.' };
    const a = raw as Record<string, unknown>;
    const q = typeof a.questionId === 'string' ? questionsById.get(a.questionId) : undefined;
    if (!q) return { ok: false, error: 'Unknown question in answers.' };
    if (seen.has(q.id)) return { ok: false, error: 'Each question can only be answered once.' };
    seen.add(q.id);
    const choiceId = a.choiceId === null ? null : typeof a.choiceId === 'string' ? a.choiceId : undefined;
    if (choiceId === undefined || (choiceId !== null && !q.options.some((o) => o.id === choiceId))) {
      return { ok: false, error: 'Invalid answer choice.' };
    }
    const ms = typeof a.msTaken === 'number' && Number.isFinite(a.msTaken) ? a.msTaken : maxMs;
    answers.push({ questionId: q.id, choiceId, msTaken: Math.round(Math.min(Math.max(ms, 0), maxMs)) });
  }

  return {
    ok: true,
    value: { deviceId: b.deviceId.toLowerCase(), name, nameKey: name.toLocaleLowerCase('en'), answers },
  };
}

/** Server-side score — the client's own score is never trusted. */
export function scoreSubmission(s: ValidSubmission) {
  return scoreRun(s.answers, questionsById, config);
}
