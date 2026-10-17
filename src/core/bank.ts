import type { Question, Round } from './types.js';
import { rounds } from '../data/rounds.js';
import { personalQuestions } from '../data/personal.js';
import { triviaQuestions } from '../data/trivia.js';
import { friendQuestions } from '../data/friends.js';

export const allQuestions: Question[] = [...personalQuestions, ...triviaQuestions, ...friendQuestions];

/** Rounds that actually have questions, in play order. */
export const activeRounds: Round[] = rounds.filter((r) => allQuestions.some((q) => q.round === r.id));

/** Questions that belong to an active round. These are the ones a full game must answer. */
export const playableQuestions: Question[] = activeRounds.flatMap((r) => allQuestions.filter((q) => q.round === r.id));

export const questionsById: Map<string, Question> = new Map(playableQuestions.map((q) => [q.id, q]));

/** Returns a list of human-readable problems with the question data (empty = all good). */
export function validateBank(questions: Question[] = allQuestions, roundList: Round[] = rounds): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const roundIds = new Set(roundList.map((r) => r.id));
  for (const q of questions) {
    const label = `Question "${q.id || '(missing id)'}"`;
    if (!q.id) problems.push(`${label}: missing id`);
    if (seen.has(q.id)) problems.push(`${label}: duplicate id`);
    seen.add(q.id);
    if (!roundIds.has(q.round)) problems.push(`${label}: unknown round "${q.round}"`);
    if (!q.prompt?.trim()) problems.push(`${label}: missing prompt`);
    if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(`${label}: needs exactly 4 options`);
    const optIds = new Set((q.options || []).map((o) => o.id));
    if (optIds.size !== (q.options || []).length) problems.push(`${label}: option ids must be unique`);
    if ((q.options || []).some((o) => !o.text?.trim())) problems.push(`${label}: an option is empty`);
    if (!optIds.has(q.correctId)) problems.push(`${label}: correctId "${q.correctId}" doesn't match any option`);
    if (!['easy', 'medium', 'hard'].includes(q.difficulty)) problems.push(`${label}: difficulty must be easy, medium or hard`);
  }
  return problems;
}
