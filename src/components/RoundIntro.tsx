import type { Round } from '../core/types';

interface Props {
  round: Round;
  roundNumber: number;
  roundCount: number;
  questionCount: number;
  drinking: boolean;
  onGo: () => void;
}

export function RoundIntro({ round, roundNumber, roundCount, questionCount, drinking, onGo }: Props) {
  return (
    <main className="shell round-intro">
      <p className="round-count">Round {roundNumber} of {roundCount}</p>
      <h1 className="display">{round.title}</h1>
      <p className="kicker">{round.subtitle}</p>
      <p className="round-meta">{questionCount} questions</p>
      {drinking && round.drinkingRule && (
        <aside className="drink-card">
          <strong>House rule</strong>
          <p>{round.drinkingRule}</p>
          <small>Not drinking? Swap any sip for water or a dramatic gasp.</small>
        </aside>
      )}
      <button className="btn btn-primary btn-big sticky-cta" onClick={onGo} autoFocus>
        Start round {roundNumber}
      </button>
    </main>
  );
}
