import type { Question } from '../core/types.js';

/**
 * ═════════════════════════════════════════════════════════════════════
 *  ROUND 3 — THE FRIEND GROUP LORE
 * ═════════════════════════════════════════════════════════════════════
 *
 * Built from the answers Declan, Siddhi, Arjun and Rahul sent back.
 * "Who said it?" questions use the four of them as the options; the rest
 * can be answered by anyone in the room, including people who didn't reply.
 *
 * HOW TO ADD A QUESTION — copy a block below, give it a new id (f16, f17 …),
 * and edit it. Rules: exactly 4 options, correctId must match an option id,
 * every id unique, commas between questions.
 */

const people = [
  { id: 'a', text: 'Declan' },
  { id: 'b', text: 'Siddhi' },
  { id: 'c', text: 'Arjun' },
  { id: 'd', text: 'Rahul' },
];
const DECLAN = 'a';
const SIDDHI = 'b';
const ARJUN = 'c';
const RAHUL = 'd';

const whoSaid = 'Group Chat Confessions';
const general = 'Group Chat Receipts';

export const friendQuestions: Question[] = [
  // ── Who said it? ──────────────────────────────────────────────────────
  {
    id: 'f01', round: 'friends', category: whoSaid, difficulty: 'medium',
    title: 'WHO SAID IT?',
    prompt: '“I was practising a traditional dance in front of my crush as a kid… and my lungi fell off.” Who confessed this?',
    options: people,
    correctId: DECLAN,
    explanation: 'Declan. The crush got a much more traditional performance than expected.',
  },
  {
    id: 'f02', round: 'friends', category: whoSaid, difficulty: 'medium',
    title: 'WHO SAID IT?',
    prompt: 'Who delivered a poop-shaped birthday cake to their girlfriend? (In their defence, it was meant to be a bear.)',
    options: people,
    correctId: RAHUL,
    explanation: 'Rahul. It’s the thought that counts. The thought was “bear”. The cake said otherwise.',
  },
  {
    id: 'f03', round: 'friends', category: whoSaid, difficulty: 'medium',
    title: 'THE PHASE WE DON’T TALK ABOUT',
    prompt: 'Whose phase they hope nobody remembers: red hair streaks?',
    options: people,
    correctId: SIDDHI,
    explanation: 'Siddhi. We remember. We will always remember.',
  },
  {
    id: 'f04', round: 'friends', category: whoSaid, difficulty: 'hard',
    title: 'THE PHASE WE DON’T TALK ABOUT',
    prompt: 'Who owned up to a full “groom-zilla” phase?',
    options: people,
    correctId: ARJUN,
    explanation: 'Arjun. Brides don’t get to have all the fun.',
  },
  {
    id: 'f05', round: 'friends', category: whoSaid, difficulty: 'easy',
    title: 'CANCELLED',
    prompt: 'Who cancelled plans because their “hair wasn’t hairing”?',
    options: people,
    correctId: SIDDHI,
    explanation: 'Siddhi. Honestly, a valid medical emergency.',
  },
  {
    id: 'f06', round: 'friends', category: whoSaid, difficulty: 'medium',
    title: 'CANCELLED',
    prompt: 'Who cancelled plans to watch a wrestling match?',
    options: people,
    correctId: ARJUN,
    explanation: 'Arjun. Your friendship was body-slammed and pinned for a three-count.',
  },
  {
    id: 'f07', round: 'friends', category: whoSaid, difficulty: 'easy',
    title: 'HARMLESS RED FLAG',
    prompt: '“If you say we’re leaving at 5pm, I’m ready by 4:45, standing at the door, staring at you until you hurry up.” Who?',
    options: people,
    correctId: DECLAN,
    explanation: 'Declan. If you feel a stare on the back of your neck at 4:46, now you know why.',
  },
  {
    id: 'f08', round: 'friends', category: whoSaid, difficulty: 'hard',
    title: 'HARMLESS RED FLAG',
    prompt: 'Whose harmless red flag is “overcommitting to social plans”?',
    options: people,
    correctId: ARJUN,
    explanation: 'Arjun. Which explains why he’s here tonight and also at three other things.',
  },
  {
    id: 'f09', round: 'friends', category: whoSaid, difficulty: 'medium',
    title: 'STILL WORKING ON IT',
    prompt: 'Who still hasn’t figured out how to make their money last the whole month?',
    options: people,
    correctId: RAHUL,
    explanation: 'Rahul. Payday is a holiday; the 23rd is a horror film.',
  },
  {
    id: 'f10', round: 'friends', category: whoSaid, difficulty: 'hard',
    title: 'BREAKING NEWS',
    prompt: 'Who thinks they’re most likely to end up in the news for a French fries eating competition?',
    options: people,
    correctId: SIDDHI,
    explanation: 'Siddhi. Fry-nal answer.',
  },
  {
    id: 'f11', round: 'friends', category: whoSaid, difficulty: 'medium',
    title: 'A MEMORY OF US',
    prompt: 'Whose favourite memory is trying to make pizza from scratch… just as Anisha showed up with Domino’s?',
    options: people,
    correctId: ARJUN,
    explanation: 'Arjun. Homemade pizza: 0. Domino’s: undefeated.',
  },

  {
    id: 'f15', round: 'friends', category: whoSaid, difficulty: 'medium',
    title: 'A MEMORY OF US',
    prompt: 'Whose favourite memory with Anushka is putting up an OLX ad… selling Anushka?',
    options: people,
    correctId: DECLAN,
    explanation: 'Declan. Listed as “used, good condition, overthinks”. Sadly, no buyers.',
  },

  // ── Anyone can play these ─────────────────────────────────────────────
  {
    id: 'f12', round: 'friends', category: general, difficulty: 'easy',
    title: 'FINISH THE HEADLINE',
    prompt: 'One friend’s dream news headline: “Local Man Discovers New Hangover Cure: …”',
    options: [
      { id: 'a', text: '…Run a 10K the Second You Wake Up' },
      { id: 'b', text: '…Just Keep Drinking' },
      { id: 'c', text: '…Lie Face Down on the Kitchen Floor' },
      { id: 'd', text: '…Passionfruit Caipiroskas, Obviously' },
    ],
    correctId: 'a',
    explanation: 'Run a 10K the second you wake up. Sent in by Declan, a man who has clearly never had a hangover.',
  },
  {
    id: 'f13', round: 'friends', category: general, difficulty: 'medium',
    title: 'SPOT THE FAKE',
    prompt: 'Three of these are real answers friends sent in. Which one is made up?',
    options: [
      { id: 'a', text: 'Pretended to love a sport I know nothing about' },
      { id: 'b', text: 'Cancelled plans because my washing machine broke' },
      { id: 'c', text: 'Sent a voice note meant for the group chat to my crush' },
      { id: 'd', text: 'Still can’t cook a good pot of rice' },
    ],
    correctId: 'c',
    explanation: 'The voice note is fake. The other three are real, which is somehow worse.',
  },
  {
    id: 'f14', round: 'friends', category: general, difficulty: 'easy',
    title: 'THE ORGANISER’S EXCUSE',
    prompt: 'Anushka organised this round last minute. What excuse did she give in the group chat?',
    options: [
      { id: 'a', text: 'She was keeping it low-key' },
      { id: 'b', text: 'She has a baby, so she’s excused' },
      { id: 'c', text: 'She was overthinking the questions' },
      { id: 'd', text: 'Mercury was in retrograde' },
    ],
    correctId: 'b',
    explanation: 'She has a baby, so she’s excused. Legally binding. No further questions.',
  },
];
