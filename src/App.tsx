import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { config } from './data/config';
import { activeRounds, playableQuestions, questionsById, validateBank } from './core/bank';
import { buildPlan } from './core/shuffle';
import * as game from './core/game';
import type { GameState } from './core/game';
import { load, remove, save } from './lib/storage';
import { unlockAudio } from './lib/sound';
import { StartScreen } from './components/StartScreen';
import { RoundIntro } from './components/RoundIntro';
import { QuestionScreen } from './components/QuestionScreen';
import { EndScreen } from './components/EndScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';

const SAVE_KEY = `a30:game:${config.gameId}`;

// The TV view is a separate, lazily loaded bundle so phones never download it.
const TvScreen = lazy(() => import('./components/TvScreen').then((m) => ({ default: m.TvScreen })));

function isTvRoute() {
  const { pathname, search } = window.location;
  return /^\/tv\/?$/.test(pathname) || new URLSearchParams(search).has('tv');
}

export default function App() {
  if (isTvRoute()) {
    return (
      <Suspense fallback={null}>
        <TvScreen />
      </Suspense>
    );
  }
  return <QuizApp />;
}

function QuizApp() {
  const problems = useMemo(() => validateBank(), []);
  const [state, setState] = useState<GameState | null>(() => {
    const saved = load<GameState>(SAVE_KEY);
    return game.isCompatible(saved, config.gameId, questionsById) ? saved : null;
  });
  // A saved, unfinished game is offered as "Resume" on the start screen instead of jumping straight in.
  const [view, setView] = useState<'start' | 'game' | 'board'>(() => (state?.phase === 'end' ? 'game' : 'start'));

  useEffect(() => {
    if (state) save(SAVE_KEY, state);
  }, [state]);

  const start = useCallback((name: string, drinking: boolean) => {
    unlockAudio();
    const plan = buildPlan(activeRounds, playableQuestions, {
      shuffleQuestions: config.shuffleQuestionsWithinRound,
      shuffleOptions: config.shuffleOptions,
    });
    setState(game.newGame(config.gameId, name, drinking, plan));
    setView('game');
    window.scrollTo(0, 0);
  }, []);

  const resume = useCallback(() => {
    unlockAudio();
    setView('game');
  }, []);

  const playAgain = useCallback(() => {
    remove(SAVE_KEY);
    setState(null);
    setView('start');
    window.scrollTo(0, 0);
  }, []);

  if (problems.length) {
    return (
      <main className="shell">
        <section className="panel problems" role="alert">
          <h1 className="display-sm">The question file needs a fix</h1>
          <p>The quiz won’t start until these are sorted:</p>
          <ul>{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
      </main>
    );
  }

  if (view === 'board') return <LeaderboardScreen onBack={() => setView('start')} />;

  if (view === 'start' || !state) {
    return (
      <StartScreen
        resumable={state && state.phase !== 'end' ? state : null}
        onStart={start}
        onResume={resume}
        onLeaderboard={() => setView('board')}
      />
    );
  }

  const qid = game.currentQuestionId(state);
  const question = qid ? questionsById.get(qid) : undefined;

  if (state.phase === 'end' || !question) {
    return <EndScreen state={state} setState={setState} onPlayAgain={playAgain} />;
  }

  if (state.phase === 'round-intro') {
    const round = activeRounds.find((r) => r.id === question.round)!;
    const roundNumber = activeRounds.indexOf(round) + 1;
    return (
      <RoundIntro
        round={round}
        roundNumber={roundNumber}
        roundCount={activeRounds.length}
        questionCount={playableQuestions.filter((q) => q.round === round.id).length}
        drinking={state.drinking}
        onGo={() => setState((s) => (s ? game.showQuestion(s, Date.now()) : s))}
      />
    );
  }

  return (
    <QuestionScreen
      key={question.id}
      state={state}
      question={question}
      onAnswer={(choiceId) => setState((s) => (s ? game.answer(s, choiceId, Date.now(), config) : s))}
      onNext={() => {
        setState((s) => (s ? game.next(s, questionsById, Date.now()) : s));
        window.scrollTo(0, 0);
      }}
    />
  );
}
