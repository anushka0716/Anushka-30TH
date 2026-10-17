import type { Question } from '../core/types.js';

/**
 * ═════════════════════════════════════════════════════════════════════
 *  ROUND 3 — THE FRIEND GROUP LORE   ← PASTE YOUR FRIEND QUESTIONS HERE
 * ═════════════════════════════════════════════════════════════════════
 *
 * This round is EMPTY on purpose, so it is hidden from players.
 * As soon as you add at least one question below, it appears automatically
 * as the final round. Nothing else needs changing.
 *
 * HOW TO ADD A QUESTION — copy this block, paste it inside the [ ] below,
 * and edit it:
 *
 *   {
 *     id: 'f01',                      // unique: f01, f02, f03 …
 *     round: 'friends',               // leave as-is
 *     category: 'Friend Group Lore',  // leave as-is (or e.g. 'Group Chat Crimes')
 *     difficulty: 'medium',           // 'easy' | 'medium' | 'hard' (hard earns a bonus point)
 *     title: 'THE GROUP CHAT',        // optional headline in CAPS
 *     prompt: 'Who is most likely to leave the group chat on read for three days?',
 *     options: [
 *       { id: 'a', text: 'Friend one' },
 *       { id: 'b', text: 'Friend two' },
 *       { id: 'c', text: 'Friend three' },
 *       { id: 'd', text: 'Friend four' },
 *     ],
 *     correctId: 'b',                 // must match one of the option ids above
 *     explanation: 'The punchline shown after people answer.',
 *     playful: true,                  // optional: use for opinion questions (no verified answer)
 *     drink: 'If you picked yourself: finish your drink.', // optional custom penalty
 *   },
 *
 * RULES (the app checks these when it starts and shows an error if one is broken):
 *   • exactly 4 options
 *   • correctId must match an option id
 *   • every id must be unique across ALL rounds
 *   • remember the commas between questions
 */
export const friendQuestions: Question[] = [
  // ← paste questions here
];
