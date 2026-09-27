import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react';
import { Application } from 'pixi.js';
import timeIcon from '../assets/challenge/icon_time.png';
import scoreIcon from '../assets/challenge/icon_score.png';
import heartIcon from '../assets/challenge/icon_heart.png';
import type { GameOptions } from '../settings';
import { useMatchCompletion } from '../session-context';
import { createBattleAudio } from './audio';
import { createControls, type GameControls } from './controls';
import { createBattleView } from './render';
import { createGame, stepGame, type Controls } from './simulation';

const STEP = 1/60;
type Hud = { score: number; remaining: number; hp: number; enemies: number };

declare global {
  interface Window {
    __PIRATE_TEST__?: {
      snapshot: () => { x: number; y: number; angle: number; hp: number; score: number;
        elapsed: number; remaining: number; enemies: number; ended: string | null;
        visibleTiles: number; wakes: number };
      advance: (seconds: number) => void;
    };
  }
}

function TouchButton({ label, action, input }: { label: string; action: keyof Controls;
  input: React.RefObject<GameControls | null> }) {
  function press(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    input.current?.press(action);
  }
  function release(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    input.current?.release(action);
  }
  return <button className="touch-key" onPointerDown={press} onPointerUp={release}
    onPointerCancel={release} onLostPointerCapture={() => input.current?.release(action)}
    aria-label={label}>{label}</button>;
}

export function BattleCanvas({ options, onAbandon }: { options: GameOptions; onAbandon: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const controls = useRef<GameControls | null>(null);
  const audioRef = useRef<ReturnType<typeof createBattleAudio> | null>(null);
  const complete = useMatchCompletion();
  const completeRef = useRef(complete);
  useEffect(() => { completeRef.current = complete; }, [complete]);
  const pausedRef = useRef(false);
  const resumeButton = useRef<HTMLButtonElement>(null);
  const pauseButton = useRef<HTMLButtonElement>(null);
  const pauseDialog = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const [loading, setLoading] = useState('Preparing the sea…');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [hud, setHud] = useState<Hud>(() => ({ score: 0, remaining: options.sessionTime, hp: 100, enemies: 0 }));

  function pause() {
    if (pausedRef.current || loading || error) return;
    controls.current?.clear();
    pausedRef.current = true;
    audioRef.current?.pause();
    setPaused(true);
  }
  function resume() {
    controls.current?.clear();
    pausedRef.current = false;
    audioRef.current?.resume();
    setPaused(false);
    pauseButton.current?.focus();
  }
  useEffect(() => { if (paused) resumeButton.current?.focus(); }, [paused]);
  function keepDialogFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') { event.preventDefault(); resume(); return; }
    if (event.key !== 'Tab') return;
    const buttons = pauseDialog.current?.querySelectorAll('button');
    if (!buttons?.length) return;
    if (event.shiftKey && document.activeElement === buttons[0]) {
      event.preventDefault(); buttons[buttons.length-1].focus();
    } else if (!event.shiftKey && document.activeElement === buttons[buttons.length-1]) {
      event.preventDefault(); buttons[0].focus();
    }
  }
  function toggleSound() {
    const next = !soundEnabled;
    soundEnabledRef.current = next;
    audioRef.current?.setEnabled(next);
    setSoundEnabled(next);
  }

  useEffect(() => {
    const target = container.current;
    if (!target) return;
    const app = new Application();
    const game = createGame(options);
    const testMode = import.meta.env.DEV && new URLSearchParams(location.search).has('test');
    let disposed = false, initialized = false, appDestroyed = false;
    let view: Awaited<ReturnType<typeof createBattleView>> | null = null;
    let accumulator = 0, hudClock = 0, finished = false;
    const syncHud = () => setHud({ score: game.score, remaining: game.remaining,
      hp: game.player.hp, enemies: game.enemies.length });
    const finishIfNeeded = () => {
      if (game.ended && !finished) {
        finished = true;
        controls.current?.clear();
        completeRef.current?.({ score: game.score, durationSeconds: game.elapsed, reason: game.ended });
      }
    };
    const destroyApp = () => {
      audioRef.current?.destroy(); audioRef.current = null;
      if (initialized && !appDestroyed) { view?.destroy(); app.destroy(true); appDestroyed = true; }
    };
    const stopKeys = (event: KeyboardEvent) => {
      if ((event.code === 'Escape' || event.code === 'Space') && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        if (pausedRef.current) {
          controls.current?.clear(); pausedRef.current = false; setPaused(false);
          audioRef.current?.resume();
        } else {
          controls.current?.clear(); pausedRef.current = true; setPaused(true);
          audioRef.current?.pause();
        }
      }
    };
    const stopOnBlur = () => {
      if (!disposed && !pausedRef.current && !game.ended) {
        controls.current?.clear(); pausedRef.current = true; setPaused(true);
        audioRef.current?.pause();
      }
    };
    const stopOnHide = () => { if (document.hidden) stopOnBlur(); };
    const startSound = () => { if (!pausedRef.current) audioRef.current?.resume(); };

    async function start() {
      try {
        await app.init({ resizeTo: target!, autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          antialias: true, background: '#092c3f' });
        initialized = true;
        if (disposed) { destroyApp(); return; }
        target!.appendChild(app.canvas);
        setLoading('Loading ships and islands…');
        view = await createBattleView(app);
        if (disposed) { destroyApp(); return; }
        controls.current = createControls();
        audioRef.current = createBattleAudio();
        audioRef.current.setEnabled(soundEnabledRef.current);
        window.addEventListener('keydown', stopKeys);
        window.addEventListener('keydown', startSound);
        window.addEventListener('pointerdown', startSound);
        window.addEventListener('blur', stopOnBlur);
        document.addEventListener('visibilitychange', stopOnHide);
        setLoading('');
        if (testMode) window.__PIRATE_TEST__ = {
          snapshot: () => ({ x: game.player.x, y: game.player.y, angle: game.player.angle,
            hp: game.player.hp, score: game.score, elapsed: game.elapsed,
            remaining: game.remaining, enemies: game.enemies.length, ended: game.ended,
            visibleTiles: view?.tileCount() ?? 0, wakes: game.wakes.length }),
          advance: seconds => {
            if (pausedRef.current || finished || disposed) return;
            for (let frame = 0; frame < Math.round(seconds/STEP) && !game.ended; frame++) {
              stepGame(game, controls.current!.read(), STEP);
              game.soundEvents.length = 0;
            }
            view?.render(game, 0);
            syncHud();
            finishIfNeeded();
          },
        };
        app.ticker.add(ticker => {
          if (disposed || pausedRef.current || finished || !view) return;
          if (testMode) { view.render(game, 0); return; }
          const dt = Math.min(ticker.deltaMS/1000, .25);
          accumulator += dt;
          while (accumulator >= STEP && !game.ended) {
            stepGame(game, controls.current!.read(), STEP);
            accumulator -= STEP;
          }
          if (game.soundEvents.length) {
            audioRef.current?.play(game.soundEvents);
            game.soundEvents.length = 0;
          }
          view.render(game, dt);
          hudClock += dt;
          if (hudClock >= .2 || game.ended) {
            syncHud();
            hudClock = 0;
          }
          finishIfNeeded();
        });
      } catch (cause) {
        destroyApp();
        if (!disposed) { setLoading(''); setError(cause instanceof Error ? cause.message : 'Unable to load game assets.'); }
      }
    }
    void start();
    return () => {
      disposed = true;
      controls.current?.destroy(); controls.current = null;
      window.removeEventListener('keydown', stopKeys);
      window.removeEventListener('keydown', startSound);
      window.removeEventListener('pointerdown', startSound);
      window.removeEventListener('blur', stopOnBlur);
      document.removeEventListener('visibilitychange', stopOnHide);
      if (testMode) delete window.__PIRATE_TEST__;
      destroyApp();
    };
  }, [options, retry]);

  return <div className="battle-root">
    <div ref={container} className="game-canvas" aria-hidden="true" />
    <div className="battle-hud" aria-label="Match status">
      <div className="hud-title">⚓ PIRATE BATTLE <span>· THE OPEN SEA</span></div>
      <div className="hud-values"><div><small><img src={timeIcon} alt="" />TIME</small><strong>{Math.ceil(hud.remaining)}s</strong></div>
        <div><small><img src={scoreIcon} alt="" />SCORE</small><strong>{hud.score}</strong></div>
        <div><small><img src={heartIcon} alt="" />HULL</small><strong>{hud.hp}%</strong></div></div>
      <div className="hud-health" role="meter" aria-label="Ship health" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={hud.hp}><span style={{ width: `${hud.hp}%` }} /></div>
      <p className="hud-keys">W sail · A / D turn · J bow cannon · Q / E broadsides · Space pause</p>
    </div>
    <div className="battle-actions"><button ref={pauseButton} className="secondary" onClick={pause}>Pause</button>
      <button className="secondary" onClick={toggleSound} aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
        aria-pressed={soundEnabled}>{soundEnabled ? 'Sound on' : 'Sound off'}</button>
      <button className="secondary" onClick={onAbandon}>Abandon match</button></div>
    {!paused && !loading && !error && <div className="touch-controls" aria-label="Touch controls">
      <div><TouchButton label="Turn left" action="left" input={controls} />
        <TouchButton label="Sail" action="forward" input={controls} />
        <TouchButton label="Turn right" action="right" input={controls} /></div>
      <div><TouchButton label="Port cannons" action="broadsideLeft" input={controls} />
        <TouchButton label="Bow cannon" action="front" input={controls} />
        <TouchButton label="Starboard cannons" action="broadsideRight" input={controls} /></div>
    </div>}
    {loading && <div className="battle-message" role="status"><div className="message-card"><p className="eyebrow">Preparing your voyage</p><h2>{loading}</h2></div></div>}
    {error && <div className="battle-message" role="alert"><div className="message-card">
      <h2>Could not load the voyage</h2><p>{error}</p>
      <button onClick={() => { setError(''); setLoading('Preparing the sea…'); setRetry(value => value+1); }}>Try again</button>
      <button className="secondary" onClick={onAbandon}>Main Menu</button>
    </div></div>}
    {paused && <div ref={pauseDialog} className="battle-message" role="dialog" aria-modal="true" aria-labelledby="pause-title" onKeyDown={keepDialogFocus}><div className="message-card">
      <p className="eyebrow">Anchored</p><h2 id="pause-title">Game paused</h2>
      <p>The sea waits for you. Resume when you're ready.</p>
      <button ref={resumeButton} onClick={resume}>Resume</button>
      <button className="secondary" onClick={onAbandon}>Main Menu</button>
    </div></div>}
  </div>;
}
