import { useEffect, useMemo, useRef, useState } from 'react';
import { config } from '../data/config';
import { activeRounds, questionsById } from '../core/bank';
import { scoreAnswer, scoreRun } from '../core/scoring';
import type { GameState } from '../core/game';
import type { Question } from '../core/types';
import { confetti } from '../lib/confetti';
import { isMuted, setMuted, sfx } from '../lib/sound';

const LETTERS = ['A', 'B', 'C', 'D'];
const DRINKS = [
  'Take a sip.',
  'One sip. Make eye contact with Anushka while you do it.',
  'Sip, then say “I should have known that.”',
  'Two sips if you were confident. One if you guessed.',
  'Sip, and pass your phone to the left for judgement.',
];

interface Props {
  state: GameState;
  question: Question;
  onAnswer: (choiceId: string | null) => void;
  onNext: () => void;
}

export function QuestionScreen({ state, question, onAnswer, onNext }: Props) {
  const recorded = state.answers.find((a) => a.questionId === question.id);
  const answered = state.phase === 'feedback' && !!recorded;
  const optionOrder = state.plan.optionOrder[question.id] ?? question.options.map((o) => o.id);
  const options = optionOrder.map((id) => question.options.find((o) => o.id === id)!).filter(Boolean);
  const round = activeRounds.find((r) => r.id === question.round);
  const totalMs = config.timerSeconds * 1000;
  const timed = config.timerSeconds > 0;

  const [now, setNow] = useState(() => Date.now());
  const [muted, setMutedState] = useState(isMuted());
  const lock = useRef(false);
  const lastTick = useRef<number | null>(null);
  const verdictRef = useRef<HTMLDivElement>(null);

  const elapsed = Math.max(0, now - (state.questionStartedAt ?? now));
  const remainingMs = timed ? Math.max(0, totalMs - elapsed) : Infinity;
  const remainingS = Math.ceil(remainingMs / 1000);

  // Timer: re-render a few times a second; auto-submit a timeout at zero.
  useEffect(() => {
    if (answered || !timed) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [answered, timed]);

  useEffect(() => {
    if (answered || !timed) return;
    if (remainingMs <= 0 && !lock.current) {
      lock.current = true;
      sfx.wrong();
      onAnswer(null);
    } else if (remainingS <= 5 && remainingS > 0 && lastTick.current !== remainingS) {
      lastTick.current = remainingS;
      sfx.tick();
    }
  }, [remainingMs, remainingS, answered, timed, onAnswer]);

  const choose = (id: string) => {
    if (answered || lock.current) return; // one answer per question, even with frantic double taps
    lock.current = true;
    if (id === question.correctId) {
      sfx.correct();
      confetti();
    } else {
      sfx.wrong();
    }
    onAnswer(id);
  };

  useEffect(() => {
    if (answered) verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [answered]);

  const runningPoints = useMemo(() => {
    const answeredIds = new Map([...questionsById].filter(([id]) => state.answers.some((a) => a.questionId === id)));
    return scoreRun(state.answers, answeredIds, config).points;
  }, [state.answers]);

  const result = recorded ? scoreAnswer(question, recorded.choiceId, recorded.msTaken, config) : null;
  const correctOption = question.options.find((o) => o.id === question.correctId)!;
  const correctLetter = LETTERS[optionOrder.indexOf(question.correctId)];
  const drink = question.drink ?? DRINKS[question.id.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % DRINKS.length];
  const progress = ((state.index + (answered ? 1 : 0)) / state.plan.order.length) * 100;
  const isLast = state.index === state.plan.order.length - 1;

  return (
    <main className="shell question-screen">
      <header className="topbar">
        <div>
          <p className="topbar-round">{round?.title}</p>
          <p className="topbar-count">
            Question {state.index + 1} <span>of {state.plan.order.length}</span>
          </p>
        </div>
        <div className="topbar-right">
          <p className="score-pill" aria-label={`Score ${runningPoints} points`}>
            {runningPoints} <small>pts</small>
          </p>
          <button
            className="icon-btn"
            onClick={() => {
              setMuted(!muted);
              setMutedState(!muted);
            }}
            aria-pressed={!muted}
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      <div className="progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>

      {timed && (
        <div className={`timer ${remainingS <= 5 && !answered ? 'urgent' : ''}`} role="timer" aria-live="off">
          <div className="timer-bar">
            <span style={{ transform: `scaleX(${answered ? 0 : remainingMs / totalMs})` }} />
          </div>
          <span className="timer-num">{answered ? '—' : `${remainingS}s`}</span>
        </div>
      )}

      <section className="question" aria-labelledby="prompt">
        <div className="question-tags">
          {question.title && <span className="q-title">{question.title}</span>}
          <span className={`tag tag-${question.difficulty}`}>{question.difficulty}</span>
        </div>
        <h1 id="prompt" className="prompt">{question.prompt}</h1>

        <div className="options" role="group" aria-label="Answers">
          {options.map((o, i) => {
            const isCorrect = o.id === question.correctId;
            const isChosen = recorded?.choiceId === o.id;
            const cls = ['option', `option-${i}`];
            if (answered && isCorrect) cls.push('is-correct');
            if (answered && isChosen && !isCorrect) cls.push('is-wrong');
            if (answered && !isCorrect && !isChosen) cls.push('is-dim');
            return (
              <button key={o.id} className={cls.join(' ')} onClick={() => choose(o.id)} disabled={answered} aria-pressed={isChosen}>
                <span className="option-letter">{LETTERS[i]}</span>
                <span className="option-text">{o.text}</span>
                {answered && isCorrect && <span className="option-mark" aria-label="correct answer">✓</span>}
                {answered && isChosen && !isCorrect && <span className="option-mark" aria-label="your answer">✗</span>}
              </button>
            );
          })}
        </div>
      </section>

      {answered && result && (
        <div className={`verdict ${result.correct ? 'good' : 'bad'}`} ref={verdictRef} aria-live="polite">
          <p className="verdict-head">
            {result.correct ? 'Correct' : recorded?.choiceId === null ? 'Time’s up' : 'Wrong'}
            <span className="verdict-points">
              {result.correct ? `+${result.points}` : '+0'}
              {result.hardBonus > 0 && <small>hard bonus</small>}
              {result.speedBonus > 0 && <small>speed bonus</small>}
            </span>
          </p>
          {!result.correct && (
            <p className="verdict-answer">
              It was <strong>{correctLetter}: {correctOption.text}</strong>
            </p>
          )}
          {question.playful && <p className="playful-note">Intended answer, not a verified fact — this one’s a prediction.</p>}
          <p className="explanation">{question.explanation}</p>
          {state.drinking && !result.correct && <p className="drink-line">🥂 {drink} <small>(or skip it)</small></p>}
          <button className="btn btn-primary btn-big sticky-cta" onClick={onNext} autoFocus>
            {isLast ? 'See my score' : 'Next question'}
          </button>
        </div>
      )}
    </main>
  );
}
