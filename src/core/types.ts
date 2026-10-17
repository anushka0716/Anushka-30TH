// Shared types — used by the browser app AND the server functions in /api.

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Option {
  /** Stable id for this option (e.g. "a"). Must be unique within the question. */
  id: string;
  text: string;
}

export interface Question {
  /** Stable, unique id. Used for scoring and duplicate protection — don't reuse ids. */
  id: string;
  /** Which round this belongs to. Must match a round id in rounds.ts. */
  round: string;
  /** Short category label, used for "strongest / weakest category" on the end screen. */
  category: string;
  difficulty: Difficulty;
  /** Optional all-caps headline shown above the question, e.g. "THE SIGNATURE DRINK". */
  title?: string;
  prompt: string;
  /** Exactly four options. */
  options: Option[];
  /** The id of the correct option. */
  correctId: string;
  /** Shown after the player answers. Keep it short and funny. */
  explanation: string;
  /** true = opinion/prediction question. The "correct" answer is the intended, playful answer — not a verified fact. */
  playful?: boolean;
  /** Optional custom drinking penalty for a wrong answer on this question. */
  drink?: string;
}

export interface Round {
  id: string;
  title: string;
  subtitle: string;
  /** Optional drinking rule shown on the round intro card when drinking mode is on. */
  drinkingRule: string;
}

export interface ScoreTitle {
  /** Lowest whole-number percentage that earns this title (0–100). */
  from: number;
  title: string;
  blurb: string;
}

export interface QuizConfig {
  gameId: string;
  quizTitle: string;
  quizKicker: string;
  timerSeconds: number;
  shuffleQuestionsWithinRound: boolean;
  shuffleOptions: boolean;
  points: {
    correct: number;
    hardBonus: number;
    speedBonus: number;
    speedBonusWithinSeconds: number;
  };
  scoreTitles: ScoreTitle[];
}

/** One answer as recorded by the client. choiceId null = the timer ran out. */
export interface AnswerRecord {
  questionId: string;
  choiceId: string | null;
  msTaken: number;
}

export interface CategoryStat {
  category: string;
  correct: number;
  total: number;
  pct: number;
}

export interface RunScore {
  points: number;
  maxPoints: number;
  correct: number;
  total: number;
  pct: number;
  title: ScoreTitle;
  categories: CategoryStat[];
  strongest: CategoryStat | null;
  weakest: CategoryStat | null;
}

export interface LeaderboardEntry {
  name: string;
  points: number;
  correct: number;
  total: number;
  pct: number;
  title: string;
  createdAt: string;
}
