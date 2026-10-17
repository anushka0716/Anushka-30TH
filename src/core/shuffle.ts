import type { Question, Round } from './types.js';

export type Rng = () => number;

/** Fisher–Yates shuffle. Returns a new array; the input is untouched. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface GamePlan {
  /** Question ids in play order. */
  order: string[];
  /** Option-id order per question id (correctness is tracked by id, never by position). */
  optionOrder: Record<string, string[]>;
}

/** Builds the play order: rounds stay in sequence, questions (optionally) shuffle within a round. */
export function buildPlan(
  rounds: Round[],
  questions: Question[],
  opts: { shuffleQuestions: boolean; shuffleOptions: boolean },
  rng: Rng = Math.random,
): GamePlan {
  const order: string[] = [];
  const optionOrder: Record<string, string[]> = {};
  for (const r of rounds) {
    const inRound = questions.filter((q) => q.round === r.id);
    const sequenced = opts.shuffleQuestions ? shuffle(inRound, rng) : inRound;
    for (const q of sequenced) {
      order.push(q.id);
      const ids = q.options.map((o) => o.id);
      optionOrder[q.id] = opts.shuffleOptions ? shuffle(ids, rng) : ids;
    }
  }
  return { order, optionOrder };
}
