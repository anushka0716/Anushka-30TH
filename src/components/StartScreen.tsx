import { useState } from 'react';
import { config } from '../data/config';
import { activeRounds, playableQuestions } from '../core/bank';
import type { GameState } from '../core/game';
import { load, save } from '../lib/storage';

interface Props {
  resumable: GameState | null;
  onStart: (name: string, drinking: boolean) => void;
  onResume: () => void;
  onLeaderboard: () => void;
}

export function StartScreen({ resumable, onStart, onResume, onLeaderboard }: Props) {
  const [name, setName] = useState(() => load<string>('a30:name') ?? '');
  const [drinking, setDrinking] = useState(false);
  const [error, setError] = useState('');
  const total = playableQuestions.length;
  const minutes = Math.round((total * ((config.timerSeconds || 20) * 0.5 + 25)) / 60);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.replace(/\s+/g, ' ').trim();
    if (!clean) return setError('Add your name so we know who to roast.');
    if (clean.length > 24) return setError('Keep it to 24 characters.');
    save('a30:name', clean);
    onStart(clean, drinking);
  };

  const p = config.points;
  return (
    <main className="shell start">
      <header className="hero">
        <div className="stamp" aria-hidden="true">
          <span>30</span>
        </div>
        <h1 className="display">{config.quizTitle}</h1>
        <p className="kicker">{config.quizKicker}</p>
      </header>

      {resumable && (
        <section className="panel resume">
          <p>
            <strong>{resumable.name}</strong>, you’re {resumable.answers.length} of {total} questions in.
          </p>
          <button className="btn btn-primary" onClick={onResume}>Keep playing</button>
        </section>
      )}

      <form className="panel" onSubmit={submit} noValidate>
        <label className="field-label" htmlFor="name">{resumable ? 'Or start over as' : 'Your name or nickname'}</label>
        <input
          id="name"
          className="input"
          value={name}
          maxLength={24}
          autoComplete="nickname"
          placeholder="e.g. Franz"
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          aria-invalid={!!error}
          aria-describedby={error ? 'name-error' : undefined}
        />
        {error && <p className="error" id="name-error">{error}</p>}

        <label className="toggle">
          <input type="checkbox" checked={drinking} onChange={(e) => setDrinking(e.target.checked)} />
          <span className="toggle-track" aria-hidden="true" />
          <span>
            <strong>Drinking mode</strong>
            <small>Shows a penalty when you get one wrong. Water counts. Skipping counts.</small>
          </span>
        </label>

        <button className="btn btn-primary btn-big" type="submit">
          {resumable ? 'Start a new game' : 'Start the quiz'}
        </button>
      </form>

      <section className="rules">
        <h2 className="display-sm">How it works</h2>
        <ol className="round-list">
          {activeRounds.map((r) => (
            <li key={r.id}>
              <strong>{r.title}</strong>
              <span>{r.subtitle}</span>
            </li>
          ))}
        </ol>
        <ul className="fine">
          <li>{total} questions, about {minutes} minutes. One shot at each — no take-backs.</li>
          {config.timerSeconds > 0 && <li>{config.timerSeconds} seconds per question. Run out and it counts as wrong.</li>}
          <li>
            {p.correct} point per correct answer
            {p.hardBonus > 0 && `, +${p.hardBonus} on hard ones`}
            {p.speedBonus > 0 && config.timerSeconds > 0 && `, +${p.speedBonus} if you answer within ${p.speedBonusWithinSeconds} seconds`}.
          </li>
          <li>Your first finished game goes on the leaderboard. Replays are just for fun.</li>
        </ul>
        <button className="btn btn-ghost" onClick={onLeaderboard}>See the leaderboard</button>
      </section>
    </main>
  );
}
