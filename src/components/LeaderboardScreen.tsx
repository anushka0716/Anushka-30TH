import { config } from '../data/config';
import { Leaderboard } from './Leaderboard';

export function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="shell">
      <button className="btn btn-ghost back" onClick={onBack}>Back</button>
      <h1 className="display">Leaderboard</h1>
      <p className="kicker">{config.quizTitle}. Updates every few seconds.</p>
      <Leaderboard />
      <p className="board-note tv-link">
        Hosting? Open <a href="/tv">{window.location.host}/tv</a> on a laptop or TV for the big-screen leaderboard.
      </p>
    </main>
  );
}
