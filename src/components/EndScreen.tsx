import { useEffect, useMemo, useRef, useState } from 'react';
import { config } from '../data/config';
import { questionsById } from '../core/bank';
import { scoreRun } from '../core/scoring';
import type { GameState } from '../core/game';
import { submitScore } from '../lib/api';
import { confetti } from '../lib/confetti';
import { sfx } from '../lib/sound';
import { deviceId, load, save } from '../lib/storage';
import { Leaderboard } from './Leaderboard';

interface Props {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState | null>>;
  onPlayAgain: () => void;
}

interface LocalResult {
  name: string;
  points: number;
  correct: number;
  total: number;
  at: string;
}

export function EndScreen({ state, setState, onPlayAgain }: Props) {
  const score = useMemo(() => scoreRun(state.answers, questionsById, config), [state.answers]);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduced ? score.points : 0);
  const [revealed, setRevealed] = useState(!!reduced);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [nameClash, setNameClash] = useState('');
  const [newName, setNewName] = useState(state.name);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shareMsg, setShareMsg] = useState('');
  const attempted = useRef(false);

  // Dramatic count-up, then the title lands with a fanfare.
  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    const dur = 1800;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      setShown(Math.round(score.points * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
      else {
        setRevealed(true);
        sfx.fanfare();
        if (score.pct > 50) confetti(160, 2600);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score.points, score.pct, reduced]);

  // Keep a record on this phone, whatever happens with the leaderboard.
  useEffect(() => {
    const key = `a30:history:${config.gameId}`;
    const history = load<LocalResult[]>(key) ?? [];
    const entry = { name: state.name, points: score.points, correct: score.correct, total: score.total, at: new Date().toISOString() };
    if (!history.some((h) => h.name === entry.name && h.points === entry.points && h.correct === entry.correct)) {
      save(key, [...history, entry].slice(-20));
    }
  }, [state.name, score.points, score.correct, score.total]);

  const send = async (name: string) => {
    setSending(true);
    setError('');
    const res = await submitScore({ deviceId: deviceId(), name, answers: state.answers });
    setSending(false);
    if (res.status === 'saved') {
      setNameClash('');
      setState((s) => (s ? { ...s, name, submission: 'saved' } : s));
      setRefreshKey((k) => k + 1);
    } else if (res.status === 'duplicate_device') {
      setState((s) => (s ? { ...s, submission: 'duplicate_device' } : s));
    } else if (res.status === 'not_configured') {
      setState((s) => (s ? { ...s, submission: 'not_configured' } : s));
    } else if (res.status === 'duplicate_name') {
      setNameClash(res.message);
    } else {
      setError(res.message);
    }
  };

  useEffect(() => {
    if (state.submission === 'pending' && !attempted.current) {
      attempted.current = true;
      void send(state.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const share = async () => {
    const url = window.location.origin + window.location.pathname;
    const text = `I scored ${score.points} points (${score.correct}/${score.total}) on “${config.quizTitle}” and got “${score.title.title}”. Think you know her better?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: config.quizTitle, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareMsg('Copied to your clipboard.');
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') setShareMsg('Sharing isn’t available here. Screenshot it instead.');
    }
  };

  return (
    <main className="shell end">
      <p className="round-count">{state.name}, your final score</p>
      <div className="big-score" aria-live="polite">
        <span className="big-score-num">{shown}</span>
        <span className="big-score-unit">points</span>
      </div>
      <p className="score-sub">
        {score.correct} of {score.total} correct, {Math.round(score.pct)}%
      </p>

      <div className={`title-card ${revealed ? 'is-revealed' : ''}`} aria-hidden={!revealed}>
        <p className="title-label">Your title</p>
        <h1 className="display">{score.title.title}</h1>
        <p>{score.title.blurb}</p>
      </div>

      {(score.strongest || score.weakest) && (
        <section className="cats">
          {score.strongest && (
            <div className="cat good">
              <p>Strongest</p>
              <strong>{score.strongest.category}</strong>
              <span>{score.strongest.correct}/{score.strongest.total}</span>
            </div>
          )}
          {score.weakest && (
            <div className="cat bad">
              <p>Weakest</p>
              <strong>{score.weakest.category}</strong>
              <span>{score.weakest.correct}/{score.weakest.total}</span>
            </div>
          )}
        </section>
      )}

      <div className="actions">
        <button className="btn btn-primary btn-big" onClick={share}>Share my score</button>
        <button className="btn btn-ghost" onClick={onPlayAgain}>Play again</button>
        {shareMsg && <p className="board-note">{shareMsg}</p>}
      </div>

      <section className="panel board-panel">
        <h2 className="display-sm">Leaderboard</h2>
        {state.submission === 'saved' && <p className="status ok">Your score is on the board.</p>}
        {state.submission === 'duplicate_device' && (
          <p className="status">This phone already posted a score, so this replay stays off the board.</p>
        )}
        {state.submission === 'pending' && sending && <p className="status">Posting your score…</p>}
        {state.submission === 'pending' && error && !sending && (
          <p className="status bad">
            {error} <button className="link-btn" onClick={() => void send(state.name)}>Try again</button>
          </p>
        )}
        {state.submission === 'pending' && nameClash && !sending && (
          <form
            className="rename"
            onSubmit={(e) => {
              e.preventDefault();
              const clean = newName.replace(/\s+/g, ' ').trim();
              if (clean) void send(clean);
            }}
          >
            <p className="status bad">{nameClash}</p>
            <input className="input" value={newName} maxLength={24} onChange={(e) => setNewName(e.target.value)} aria-label="New name" />
            <button className="btn btn-primary" type="submit">Post with this name</button>
          </form>
        )}
        <Leaderboard highlightName={state.submission === 'saved' ? state.name : undefined} refreshKey={refreshKey} />
      </section>
    </main>
  );
}
