import type { Round } from '../core/types.js';

/**
 * Rounds are played in this order. A round with no questions is skipped automatically,
 * so "THE FRIEND GROUP LORE" stays hidden until you add questions to friends.ts.
 */
export const rounds: Round[] = [
  {
    id: 'anushka',
    title: 'The Anushka Files',
    subtitle: 'Hard facts and harder predictions about the birthday girl.',
    drinkingRule: 'Wrong answer: one sip. Get the Franz question wrong: two sips and an apology.',
  },
  {
    id: 'trivia',
    title: 'Big Brain Hours',
    subtitle: 'Architecture, pop culture, the early internet and facts that sound made up.',
    drinkingRule: 'Get a HARD question right: you may hand out one sip to anyone in the room.',
  },
  {
    id: 'friends',
    title: 'The Friend Group Lore',
    subtitle: 'Questions about all of you. Nobody is safe.',
    drinkingRule: 'Wrong answer about yourself: finish your drink. Wrong about someone else: one sip.',
  },
];
