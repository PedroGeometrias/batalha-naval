export type GameOptions = { sessionTime: number; spawnTime: number };

export const DEFAULT_OPTIONS: GameOptions = { sessionTime: 120, spawnTime: 10 };
export const SESSION_LIMITS = { min: 60, max: 180 };
export const SPAWN_LIMITS = { min: 2, max: 30 };

export function validateOptions(value: GameOptions): boolean {
  return Number.isInteger(value.sessionTime) && value.sessionTime >= SESSION_LIMITS.min
    && value.sessionTime <= SESSION_LIMITS.max && Number.isInteger(value.spawnTime)
    && value.spawnTime >= SPAWN_LIMITS.min && value.spawnTime <= SPAWN_LIMITS.max;
}

const OPTIONS_KEY = 'pirate-battle:options';

export function loadOptions(): GameOptions {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(OPTIONS_KEY) || 'null');
    if (value && typeof value === 'object' && 'sessionTime' in value && 'spawnTime' in value) {
      const options = value as GameOptions;
      if (validateOptions(options)) return options;
    }
  } catch { /* Invalid stored options fall back to defaults. */ }
  return { ...DEFAULT_OPTIONS };
}

export function saveOptions(options: GameOptions): void {
  if (!validateOptions(options)) throw new Error('Invalid game options');
  localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
}
