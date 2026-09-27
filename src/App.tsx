import { useRef, useState } from 'react';
import { BattleCanvas } from './game/BattleCanvas';
import { Leaderboards } from './screens/Leaderboards';
import { NetworkPanel } from './screens/NetworkPanel';
import { Options } from './screens/Options';
import { Results } from './screens/Results';
import { useRecordMatch } from './network/queries';
import { lastResult, pendingMatches, playerId, queueMatch, saveLastResult } from './network/storage';
import { completedMatch, type GameOutcome } from './session';
import { MatchCompletionContext } from './session-context';
import { loadOptions, saveOptions, type GameOptions } from './settings';
import './App.css';

type Screen = 'menu' | 'options' | 'game' | 'result';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [options, setOptions] = useState(loadOptions);
  const [last, setLast] = useState(lastResult);
  const [pendingCount, setPendingCount] = useState(() => pendingMatches().length);
  const [player] = useState(playerId);
  const session = useRef<GameOptions | null>(null);
  const record = useRecordMatch(() => setPendingCount(pendingMatches().length));

  function play() {
    session.current = { ...options };
    setScreen('game');
  }

  function finish(outcome: GameOutcome) {
    if (!session.current) return;
    const match = completedMatch(outcome, session.current, player);
    session.current = null; // Ignore repeated completion events from the same match.
    saveLastResult(match);
    queueMatch(match); // Save before network I/O so refresh or failure cannot lose this submission.
    setLast(match);
    setPendingCount(pendingMatches().length);
    setScreen('result');
    record.mutate(match);
  }

  function abandon() {
    session.current = null;
    setScreen('menu');
  }

  function retryPending(id?: string) {
    const match = id ? pendingMatches().find(item => item.id === id) : pendingMatches()[0];
    if (match && !record.isPending) record.mutate(match);
  }

  function updateOptions(next: GameOptions) {
    saveOptions(next);
    setOptions(next);
    setScreen('menu');
  }

  if (screen === 'game') return <main className="game-screen">
    <MatchCompletionContext.Provider value={finish}>
      <BattleCanvas options={options} onAbandon={abandon} />
    </MatchCompletionContext.Provider>
  </main>;

  return <main className="site-shell">
    <header className="masthead"><div className="brand"><span aria-hidden="true">⚓</span> PIRATE BATTLE</div>
      <span className="edition">A voyage on open water</span></header>
    {screen === 'menu' && <div className="home-grid">
      <section className="panel hero-panel" aria-labelledby="menu-title">
        <p className="eyebrow">The open sea awaits</p><h1 id="menu-title">Set sail.</h1>
        <p>Navigate the water, face enemy ships, and make every voyage count.</p>
        <div className="actions"><button onClick={play}>Play</button>
          <button className="secondary" onClick={() => setScreen('options')}>Options</button>
          <button className="secondary" onClick={() => setScreen('result')}>Last Result</button></div>
        <div className="controls"><h2>Controls</h2><p><kbd>W</kbd> sail · <kbd>A</kbd> / <kbd>D</kbd> steer · <kbd>J</kbd> bow cannon</p>
          <p><kbd>Q</kbd> port broadside · <kbd>E</kbd> starboard broadside · <kbd>Space</kbd> pause. Touch controls appear on mobile.</p></div>
        {pendingCount > 0 && <div className="pending-note" role="status">
          {pendingCount} match {pendingCount === 1 ? 'record is' : 'records are'} pending.
          <button onClick={() => retryPending()} disabled={record.isPending}>Retry oldest pending record</button>
        </div>}
      </section>
      <Leaderboards options={options} playerId={player} />
    </div>}
    {screen === 'options' && <Options options={options} onSave={updateOptions} onBack={() => setScreen('menu')} />}
    {screen === 'result' && <Results match={last} pending={!!last && pendingMatches().some(item => item.id === last.id)}
      retrying={record.isPending} onRetry={() => retryPending(last?.id)} onPlay={play} onMenu={() => setScreen('menu')} />}
    <NetworkPanel onReset={() => { setPendingCount(0); setLast(null); }} />
    <footer>Local game · Simulated ranking and match history</footer>
  </main>;
}

export default App;
