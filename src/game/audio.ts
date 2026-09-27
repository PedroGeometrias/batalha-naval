import cannon from '../assets/challenge/sounds/cannon_fire_1.wav';
import hit from '../assets/challenge/sounds/ship_wood_hit_1.wav';
import explosion from '../assets/challenge/sounds/ship_explosion_1.wav';
import ocean from '../assets/challenge/sounds/ocean_ambience_loop.wav';
import type { SoundEvent } from './simulation';

export function createBattleAudio() {
  const ambient = new Audio(ocean);
  ambient.loop = true;
  ambient.volume = .16;
  const voices: Record<SoundEvent, HTMLAudioElement[]> = {
    cannon: [new Audio(cannon), new Audio(cannon)],
    hit: [new Audio(hit), new Audio(hit)],
    explosion: [new Audio(explosion), new Audio(explosion)],
  };
  let enabled = true;
  let disposed = false;

  function resume() {
    if (enabled && !disposed && ambient.paused) void ambient.play().catch(() => {});
  }
  function pause() { ambient.pause(); }
  function play(events: SoundEvent[]) {
    if (!enabled || disposed) return;
    for (const event of events) {
      const pool = voices[event];
      const clip = pool.find(sound => sound.paused || sound.ended) ?? pool[0];
      clip.volume = event === 'cannon' ? .28 : .38;
      clip.currentTime = 0;
      void clip.play().catch(() => {});
    }
  }
  function setEnabled(value: boolean) {
    enabled = value;
    if (enabled) resume(); else pause();
  }
  function destroy() {
    disposed = true;
    pause();
    for (const pool of Object.values(voices)) for (const clip of pool) clip.pause();
  }

  return { resume, pause, play, setEnabled, destroy };
}
