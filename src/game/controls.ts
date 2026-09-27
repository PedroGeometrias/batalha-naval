import type { Controls } from './simulation';

const bindings: Record<string, keyof Controls> = {
  KeyW: 'forward', ArrowUp: 'forward', KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right', KeyJ: 'front', KeyQ: 'broadsideLeft', KeyE: 'broadsideRight',
};

export function createControls() {
  const keys = new Set<keyof Controls>();
  const touch = new Set<keyof Controls>();
  function down(event: KeyboardEvent) {
    const action = bindings[event.code];
    if (!action || event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    keys.add(action);
  }
  function up(event: KeyboardEvent) {
    const action = bindings[event.code];
    if (action) keys.delete(action);
  }
  function clear() { keys.clear(); touch.clear(); }
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return { read(): Controls {
    const held = (key: keyof Controls) => keys.has(key) || touch.has(key);
    return { forward: held('forward'), left: held('left'), right: held('right'),
      front: held('front'), broadsideLeft: held('broadsideLeft'), broadsideRight: held('broadsideRight') };
  }, press(action: keyof Controls) { touch.add(action); },
  release(action: keyof Controls) { touch.delete(action); }, clear,
  destroy() { clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); } };
}
export type GameControls = ReturnType<typeof createControls>;
