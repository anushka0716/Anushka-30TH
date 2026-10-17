import type { AnswerRecord, CategoryStat, Question, QuizConfig, RunScore, ScoreTitle } from './types.js';

export interface AnswerScore {
  correct: boolean;
  points: number;
  hardBonus: number;
  speedBonus: number;
}

/** Points for one answer. A timeout (choiceId null) is always wrong. */
export function scoreAnswer(q: Question, choiceId: string | null, msTaken: number, cfg: QuizConfig): AnswerScore {
  const correct = choiceId !== null && choiceId === q.correctId;
  if (!correct) return { correct: false, points: 0, hardBonus: 0, speedBonus: 0 };
  const hardBonus = q.difficulty === 'hard' ? cfg.points.hardBonus : 0;
  const speedOn = cfg.timerSeconds > 0 && cfg.points.speedBonus > 0;
  const speedBonus = speedOn && msTaken <= cfg.points.speedBonusWithinSeconds * 1000 ? cfg.points.speedBonus : 0;
  return { correct: true, points: cfg.points.correct + hardBonus + speedBonus, hardBonus, speedBonus };
}

export function maxPointsFor(q: Question, cfg: QuizConfig): number {
  const speedOn = cfg.timerSeconds > 0 && cfg.points.speedBonus > 0;
  return cfg.points.correct + (q.difficulty === 'hard' ? cfg.points.hardBonus : 0) + (speedOn ? cfg.points.speedBonus : 0);
}

/**
 * Picks the score title: highest `from` reached by the whole-number percentage (rounded DOWN),
 * so 99.6% stays below a `from: 100` title and only a perfect run gets it.
 */
export function titleFor(pct: number, titles: ScoreTitle[]): ScoreTitle {
  const sorted = titles.slice().sort((a, b) => a.from - b.from);
  const whole = Math.floor(Math.max(0, Math.min(100, pct)) + 1e-9);
  let pick = sorted[0];
  for (const t of sorted) if (whole >= t.from) pick = t;
  return pick;
}

export function scoreRun(answers: AnswerRecord[], questions: Map<string, Question>, cfg: QuizConfig): RunScore {
  let points = 0;
  let correct = 0;
  let maxPoints = 0;
  const cats = new Map<string, { correct: number; total: number }>();
  for (const q of questions.values()) {
    maxPoints += maxPointsFor(q, cfg);
    const c = cats.get(q.category) ?? { correct: 0, total: 0 };
    c.total += 1;
    cats.set(q.category, c);
  }
  const seen = new Set<string>();
  for (const a of answers) {
    const q = questions.get(a.questionId);
    if (!q || seen.has(a.questionId)) continue; // unknown or repeated answers never count
    seen.add(a.questionId);
    const s = scoreAnswer(q, a.choiceId, a.msTaken, cfg);
    points += s.points;
    if (s.correct) {
      correct += 1;
      cats.get(q.category)!.correct += 1;
    }
  }
  const total = questions.size;
  const pct = total ? Math.round((correct / total) * 1000) / 10 : 0;
  const categories: CategoryStat[] = [...cats.entries()].map(([category, c]) => ({
    category,
    correct: c.correct,
    total: c.total,
    pct: c.total ? Math.round((c.correct / c.total) * 100) : 0,
  }));
  // Only rank categories with 2+ questions so a single lucky guess doesn't become a "strength".
  const rankable = categories.filter((c) => c.total >= 2);
  const pool = rankable.length >= 2 ? rankable : categories;
  const byPct = pool.slice().sort((a, b) => b.pct - a.pct || b.total - a.total);
  const strongest = byPct.length ? byPct[0] : null;
  const weakest = byPct.length > 1 ? byPct[byPct.length - 1] : null;
  return {
    points,
    maxPoints,
    correct,
    total,
    pct,
    title: titleFor(pct, cfg.scoreTitles),
    categories,
    strongest,
    weakest: weakest && strongest && weakest.category !== strongest.category ? weakest : null,
  };
}
