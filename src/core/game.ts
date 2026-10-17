// Pure game-state logic (no React, no browser) so it can be unit-tested.
import type { AnswerRecord, Question, QuizConfig } from './types.js';
import type { GamePlan } from './shuffle.js';

export type Phase = 'round-intro' | 'question' | 'feedback' | 'end';

export interface GameState {
  v: 2;
  gameId: string;
  name: string;
  drinking: boolean;
  plan: GamePlan;
  answers: AnswerRecord[];
  /** Index into plan.order of the current question. */
  index: number;
  phase: Phase;
  /** Epoch ms when the current question was shown (null while not on a question). */
  questionStartedAt: number | null;
  /** Leaderboard submission state. */
  submission: 'pending' | 'saved' | 'duplicate_device' | 'not_configured';
}

export function newGame(gameId: string, name: string, drinking: boolean, plan: GamePlan): GameState {
  return {
    v: 2,
    gameId,
    name,
    drinking,
    plan,
    answers: [],
    index: 0,
    phase: 'round-intro',
    questionStartedAt: null,
    submission: 'pending',
  };
}

export function currentQuestionId(s: GameState): string | undefined {
  return s.plan.order[s.index];
}

export function hasAnswered(s: GameState, questionId: string): boolean {
  return s.answers.some((a) => a.questionId === questionId);
}

export function showQuestion(s: GameState, now: number): GameState {
  if (s.phase !== 'round-intro') return s;
  return { ...s, phase: 'question', questionStartedAt: now };
}

/** Records an answer (or a timeout when choiceId is null). Ignored if already answered or not on a question. */
export function answer(s: GameState, choiceId: string | null, now: number, cfg: QuizConfig): GameState {
  const qid = currentQuestionId(s);
  if (s.phase !== 'question' || !qid || hasAnswered(s, qid)) return s;
  const started = s.questionStartedAt ?? now;
  const limit = cfg.timerSeconds > 0 ? cfg.timerSeconds * 1000 : Infinity;
  const msTaken = Math.max(0, Math.min(now - started, limit));
  return {
    ...s,
    phase: 'feedback',
    answers: [...s.answers, { questionId: qid, choiceId, msTaken }],
  };
}

/** Moves on after feedback: next question, a new round's intro card, or the end screen. */
export function next(s: GameState, questions: Map<string, Question>, now: number): GameState {
  if (s.phase !== 'feedback') return s;
  const nextIndex = s.index + 1;
  if (nextIndex >= s.plan.order.length) return { ...s, index: nextIndex, phase: 'end', questionStartedAt: null };
  const prevRound = questions.get(s.plan.order[s.index])?.round;
  const nextRound = questions.get(s.plan.order[nextIndex])?.round;
  if (prevRound !== nextRound) return { ...s, index: nextIndex, phase: 'round-intro', questionStartedAt: null };
  return { ...s, index: nextIndex, phase: 'question', questionStartedAt: now };
}

/** True when a saved game still matches the current question set (otherwise it's discarded). */
export function isCompatible(s: GameState | null, gameId: string, questions: Map<string, Question>): s is GameState {
  if (!s || s.v !== 2 || s.gameId !== gameId) return false;
  if (s.plan.order.length !== questions.size) return false;
  return s.plan.order.every((id) => questions.has(id));
}
