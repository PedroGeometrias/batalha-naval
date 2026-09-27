import type { MatchRecord } from '../network/contracts';

export function Results({ match, pending, onRetry, retrying, onPlay, onMenu }: {
  match: MatchRecord | null; pending: boolean; onRetry: () => void; retrying: boolean;
  onPlay: () => void; onMenu: () => void;
}) {
  return <section className="panel narrow" aria-labelledby="result-title">
    <p className="eyebrow">Voyage report</p><h1 id="result-title">Result</h1>
    {match ? <>
      <dl className="result-list"><div><dt>Total score</dt><dd>{match.score}</dd></div>
        <div><dt>Time played</dt><dd>{match.durationSeconds.toFixed(1)} seconds</dd></div>
        <div><dt>End reason</dt><dd>{match.reason === 'time' ? 'Time expired' : 'Ship destroyed'}</dd></div>
        <div><dt>Match record</dt><dd>{pending ? 'Pending — retry available' : 'Recorded'}</dd></div></dl>
      {pending && <button type="button" onClick={onRetry} disabled={retrying}>Retry record</button>}
    </> : <p>No completed match has been recorded on this device yet.</p>}
    <div className="actions"><button onClick={onPlay}>Play Again</button><button className="secondary" onClick={onMenu}>Main Menu</button></div>
  </section>;
}
