import { useState, type FormEvent } from 'react';
import { SESSION_LIMITS, SPAWN_LIMITS, validateOptions, type GameOptions } from '../settings';

export function Options({ options, onSave, onBack }: {
  options: GameOptions; onSave: (options: GameOptions) => void; onBack: () => void;
}) {
  const [sessionTime, setSessionTime] = useState(String(options.sessionTime));
  const [spawnTime, setSpawnTime] = useState(String(options.spawnTime));
  const [error, setError] = useState('');

  function save(event: FormEvent) {
    event.preventDefault();
    const next = { sessionTime: Number(sessionTime), spawnTime: Number(spawnTime) };
    if (!validateOptions(next) || sessionTime.trim() === '' || spawnTime.trim() === '') {
      setError(`Game session time must be ${SESSION_LIMITS.min}–${SESSION_LIMITS.max} seconds; enemy spawn time must be ${SPAWN_LIMITS.min}–${SPAWN_LIMITS.max} whole seconds.`);
      return;
    }
    setError('');
    onSave(next);
  }

  return <section className="panel narrow" aria-labelledby="options-title">
    <p className="eyebrow">Before you set sail</p>
    <h1 id="options-title">Options</h1>
    <p>These settings apply to the next match. Each match takes a snapshot when it begins.</p>
    <form onSubmit={save} noValidate>
      <label htmlFor="session-time">Game session time <span>(seconds, 60–180)</span></label>
      <input id="session-time" type="number" min={SESSION_LIMITS.min} max={SESSION_LIMITS.max} step="1"
        value={sessionTime} onChange={event => setSessionTime(event.target.value)} aria-invalid={!!error} />
      <label htmlFor="spawn-time">Enemy spawn time <span>(seconds, 2–30)</span></label>
      <input id="spawn-time" type="number" min={SPAWN_LIMITS.min} max={SPAWN_LIMITS.max} step="1"
        value={spawnTime} onChange={event => setSpawnTime(event.target.value)} aria-invalid={!!error} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions"><button type="submit">Save options</button><button type="button" className="secondary" onClick={onBack}>Main Menu</button></div>
    </form>
  </section>;
}
