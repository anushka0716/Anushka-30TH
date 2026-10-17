import { useCallback, useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../core/types';
import { fetchLeaderboard } from '../lib/api';

interface Props {
  highlightName?: string;
  /** Bump this number to force a refresh (e.g. right after posting a score). */
  refreshKey?: number;
}

export function Leaderboard({ highlightName, refreshKey = 0 }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'not_configured' | 'error'>('loading');

  const refresh = useCallback(async () => {
    const res = await fetchLeaderboard();
    setStatus(res.status);
    if (res.status === 'ok') setEntries(res.entries);
  }, []);

  useEffect(() => {
    void refresh();
    // Keep it live while people are still finishing.
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 12_000);
    return () => window.clearInterval(id);
  }, [refresh, refreshKey]);

  if (status === 'not_configured') {
    return (
      <p className="board-note">
        The shared leaderboard isn’t switched on for this link, so scores stay on each phone. Screenshot your score and show the room.
      </p>
    );
  }
  if (status === 'error' && !entries) {
    return (
      <p className="board-note">
        Couldn’t load the leaderboard. <button className="link-btn" onClick={() => void refresh()}>Try again</button>
      </p>
    );
  }
  if (!entries) return <p className="board-note">Loading the leaderboard…</p>;
  if (!entries.length) return <p className="board-note">No scores yet. Be the first name on the board.</p>;

  const me = highlightName?.toLocaleLowerCase('en');
  let rank = 0;
  let prev: LeaderboardEntry | null = null;
  return (
    <ol className="board">
      {entries.map((e, i) => {
        // Ties share a rank.
        if (!prev || prev.points !== e.points || prev.correct !== e.correct) rank = i + 1;
        prev = e;
        const mine = me && e.name.toLocaleLowerCase('en') === me;
        return (
          <li key={`${e.name}-${e.createdAt}`} className={mine ? 'mine' : undefined}>
            <span className="board-rank">{rank}</span>
            <span className="board-name">
              {e.name}
              {mine && <small> (you)</small>}
              <em>{e.title}</em>
            </span>
            <span className="board-score">
              {e.points}
              <small>{e.correct}/{e.total}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
