import type { QuizConfig } from '../core/types.js';

/**
 * ─────────────────────────────────────────────────────────────
 *  GAME SETTINGS — edit freely, then redeploy.
 * ─────────────────────────────────────────────────────────────
 */
export const config: QuizConfig = {
  /**
   * Leaderboard key. Every result is stored against this id.
   * Change it (e.g. "anushka-30-final") to start a fresh, empty leaderboard —
   * handy after you've tested the quiz yourself.
   */
  gameId: 'anushka-30-party',

  quizTitle: 'Anushka Turns 30',
  quizKicker: 'How well do you actually know her?',

  /** Seconds per question. Set to 0 to switch the timer off (also disables the speed bonus). */
  timerSeconds: 25,

  /** Shuffle question order inside each round (rounds always stay in order). */
  shuffleQuestionsWithinRound: true,

  /** Shuffle the four options on each question. The correct answer is tracked by id, so it stays correct. */
  shuffleOptions: true,

  points: {
    /** Points for any correct answer. */
    correct: 1,
    /** Extra points for a correct answer on a question marked difficulty: 'hard'. Set 0 to disable. */
    hardBonus: 1,
    /** Extra points for a correct answer given quickly. Set 0 to disable. */
    speedBonus: 1,
    /** "Quickly" means within this many seconds of the question appearing. */
    speedBonusWithinSeconds: 7,
  },

  /**
   * Titles are picked from the player's % of correct answers (rounded DOWN to a whole number),
   * using the highest `from` that the percentage reaches. Keep them sorted by `from`.
   * 100 only applies to a perfect score.
   */
  scoreTitles: [
    { from: 0, title: 'You Were Here for the Free Drinks', blurb: 'Honestly? Respect. The bar is open and so is your mind.' },
    { from: 31, title: 'Casual Acquaintance Energy', blurb: 'You know her face. You know her drink, maybe. That’s about it.' },
    { from: 51, title: 'Knows Enough to Be Dangerous', blurb: 'Solid lore, questionable recall. Keep your secrets close.' },
    { from: 71, title: 'Certified Anushka Lore Keeper', blurb: 'You’ve clearly been paying attention. Slightly concerning.' },
    { from: 86, title: 'Emotionally Invested in the Lore', blurb: 'This is no longer a quiz. This is a relationship.' },
    { from: 100, title: 'Unemployed Private Investigator', blurb: 'Perfect score. We need to talk about how you know all this.' },
  ],
};
