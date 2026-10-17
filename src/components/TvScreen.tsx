import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '../data/config';
import { playableQuestions } from '../core/bank';
import type { LeaderboardEntry } from '../core/types';
import { fetchLeaderboard } from '../lib/api';
import { confetti } from '../lib/confetti';
import { sfx, unlockAudio } from '../lib/sound';
import { Qr } from './Qr';
import '../tv.css';

const POLL_MS = 4000;
const keyOf = (e: LeaderboardEntry) => `${e.name}|${e.createdAt}`;

/** Ranks with ties sharing a place (same points and same number correct). */
function withRanks(entries: LeaderboardEntry[]) {
  let rank = 0;
  return entries.map((e, i) => {
    const prev = entries[i - 1];
    if (!prev || prev.points !== e.points || prev.correct !== e.correct) rank = i + 1;
    return { ...e, rank };
  });
}

export function TvScreen() {
  const joinUrl = `${window.location.origin}/`;
  const prettyUrl = window.location.host;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'not_configured' | 'error'>('loading');
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [ticker, setTicker] = useState<LeaderboardEntry | null>(null);
  const [hideScores, setHideScores] = useState(false);
  const [finaleStep, setFinaleStep] = useState<number | null>(null); // null = live board
  const known = useRef<Set<string> | null>(null);
  const tickerQueue = useRef<LeaderboardEntry[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetchLeaderboard();
    setStatus(res.status);
    if (res.status !== 'ok') return;
    setEntries(res.entries);
    const keys = new Set(res.entries.map(keyOf));
    if (known.current) {
      const arrivals = res.entries.filter((e) => !known.current!.has(keyOf(e)));
      if (arrivals.length) {
        setFresh(new Set(arrivals.map(keyOf)));
        tickerQueue.current.push(...arrivals);
        window.setTimeout(() => setFresh(new Set()), 6000);
      }
    }
    known.current = keys;
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  // Show "just finished" announcements one at a time.
  useEffect(() => {
    let showing = false;
    const id = window.setInterval(() => {
      if (showing) {
        showing = false;
        setTicker(null);
        return;
      }
      const nextUp = tickerQueue.current.shift();
      if (nextUp) {
        showing = true;
        setTicker(nextUp);
      }
    }, 3500);
    return () => window.clearInterval(id);
  }, []);

  const ranked = withRanks(entries);
  const podium = ranked.slice(0, 3);
  const finaleOrder = podium.slice().reverse(); // reveal 3rd → 1st
  const finaleDone = finaleStep !== null && finaleStep >= finaleOrder.length - 1;

  const startFinale = useCallback(() => {
    unlockAudio();
    setFinaleStep(-1); // all three hidden, then revealed one press at a time
  }, []);

  const advanceFinale = useCallback(() => {
    if (finaleStep === null) return startFinale();
    const next = finaleStep + 1;
    if (next > finaleOrder.length - 1) return;
    setFinaleStep(next);
    if (next === finaleOrder.length - 1) {
      sfx.fanfare();
      confetti(260, 4200);
    } else {
      sfx.correct();
    }
  }, [finaleStep, finaleOrder.length, startFinale]);

  // Keyboard / TV-remote shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'h') setHideScores((v) => !v);
      if (k === 'f' && finaleStep === null && podium.length) startFinale();
      if ((k === ' ' || k === 'arrowright' || k === 'enter') && finaleStep !== null) {
        e.preventDefault();
        advanceFinale();
      }
      if (k === 'escape') setFinaleStep(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advanceFinale, startFinale, finaleStep, podium.length]);

  const fullscreen = () => {
    const el = document.documentElement;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void el.requestFullscreen?.().catch(() => {});
  };

  const topScore = entries[0]?.points ?? 0;
  const average = entries.length ? Math.round(entries.reduce((n, e) => n + e.pct, 0) / entries.length) : 0;

  // ── Finale ──────────────────────────────────────────────────────────
  if (finaleStep !== null) {
    const places = ['3rd', '2nd', '1st'].slice(3 - finaleOrder.length);
    return (
      <main className="tv tv-finale" onClick={advanceFinale}>
        <h1 className="tv-finale-head">{finaleDone ? 'Your podium' : 'And the winners are…'}</h1>
        <div className="tv-podium">
          {finaleOrder.map((e, i) => {
            const shown = finaleStep >= i;
            const place = places[i];
            const tied = podium.filter((p) => p.rank === e.rank).length > 1;
            const label = `${tied ? 'Joint ' : ''}${['1st', '2nd', '3rd'][e.rank - 1] ?? `${e.rank}th`}`;
            return (
              <div key={keyOf(e)} className={`tv-step tv-step-${place} ${shown ? 'is-shown' : ''}`}>
                <p className="tv-step-place">{shown ? label : place}</p>
                {shown ? (
                  <>
                    <p className="tv-step-name">{e.name}</p>
                    <p className="tv-step-score">{e.points} pts</p>
                    <p className="tv-step-title">{e.title}</p>
                  </>
                ) : (
                  <p className="tv-step-name tv-mystery">?</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="tv-controls">
          {!finaleDone && <button className="tv-btn" onClick={(ev) => { ev.stopPropagation(); advanceFinale(); }} autoFocus>Reveal next</button>}
          <button className="tv-btn tv-btn-quiet" onClick={(ev) => { ev.stopPropagation(); setFinaleStep(null); }}>Back to the board</button>
        </div>
      </main>
    );
  }

  // ── Live board ──────────────────────────────────────────────────────
  const top = ranked.slice(0, 10);
  const rest = ranked.slice(10);

  return (
    <main className="tv">
      <header className="tv-head">
        <div className="stamp tv-stamp" aria-hidden="true"><span>30</span></div>
        <div>
          <h1 className="tv-title">{config.quizTitle}</h1>
          <p className="tv-kicker">{config.quizKicker}</p>
        </div>
      </header>

      <section className="tv-board" aria-label="Leaderboard">
        <div className="tv-board-head">
          <h2>{hideScores ? 'Who’s finished' : 'Leaderboard'}</h2>
          <p className="tv-live"><span className="tv-dot" /> Live</p>
        </div>

        {status === 'not_configured' && (
          <p className="tv-empty">The shared leaderboard isn’t switched on yet. Add the Supabase settings in Vercel and redeploy.</p>
        )}
        {status === 'error' && !entries.length && <p className="tv-empty">Can’t reach the leaderboard. Retrying…</p>}
        {status === 'loading' && <p className="tv-empty">Loading…</p>}
        {status === 'ok' && !entries.length && (
          <p className="tv-empty">No scores yet. Scan the code, play, and claim the top spot.</p>
        )}

        {entries.length > 0 && hideScores && (
          <ul className="tv-names">
            {entries
              .slice()
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              .map((e) => <li key={keyOf(e)} className={fresh.has(keyOf(e)) ? 'is-fresh' : ''}>{e.name}</li>)}
          </ul>
        )}

        {entries.length > 0 && !hideScores && (
          <>
            <ol className="tv-rows">
              {top.map((e) => (
                <li key={keyOf(e)} className={`${fresh.has(keyOf(e)) ? 'is-fresh' : ''} ${e.rank === 1 ? 'is-first' : ''}`}>
                  <span className="tv-rank">{e.rank}</span>
                  <span className="tv-name">
                    {e.name}
                    <em>{e.title}</em>
                  </span>
                  <span className="tv-correct">{e.correct}/{e.total}</span>
                  <span className="tv-points">{e.points}</span>
                </li>
              ))}
            </ol>
            {rest.length > 0 && (
              <p className="tv-rest">
                Also playing: {rest.map((e) => `${e.name} (${e.points})`).join(', ')}
              </p>
            )}
          </>
        )}
      </section>

      <aside className="tv-join">
        <p className="tv-join-head">Scan to play</p>
        <div className="tv-qr-wrap"><Qr value={joinUrl} label={`QR code to join the quiz at ${prettyUrl}`} /></div>
        <p className="tv-url">{prettyUrl}</p>
        <dl className="tv-stats">
          <div><dt>Finished</dt><dd>{entries.length}</dd></div>
          <div><dt>{hideScores ? 'Questions' : 'Top score'}</dt><dd>{hideScores ? playableQuestions.length : topScore}</dd></div>
          {!hideScores && <div><dt>Average</dt><dd>{average}%</dd></div>}
        </dl>
      </aside>

      {ticker && (
        <div className="tv-ticker" role="status">
          <strong>{ticker.name}</strong> just finished
          {!hideScores && <> with {ticker.points} points: <em>{ticker.title}</em></>}
        </div>
      )}

      <nav className="tv-controls tv-controls-live" aria-label="Host controls">
        <button className="tv-btn" onClick={startFinale} disabled={!podium.length}>Reveal the winners</button>
        <button className="tv-btn tv-btn-quiet" onClick={() => setHideScores((v) => !v)}>{hideScores ? 'Show scores' : 'Hide scores'}</button>
        <button className="tv-btn tv-btn-quiet" onClick={fullscreen}>Full screen</button>
      </nav>
    </main>
  );
}
