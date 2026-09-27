import type { MatchRecord } from './contracts';

const PENDING_KEY = 'pirate-battle:pending';
const LAST_KEY = 'pirate-battle:last-result';
const PLAYER_KEY = 'pirate-battle:player-id';

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

export function playerId(): string {
  let id = localStorage.getItem(PLAYER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_KEY, id);
  }
  return id;
}

export function pendingMatches(): MatchRecord[] { return read(PENDING_KEY, []); }
export function queueMatch(match: MatchRecord): void {
  if (!pendingMatches().some(item => item.id === match.id)) {
    localStorage.setItem(PENDING_KEY, JSON.stringify([...pendingMatches(), match]));
  }
}
export function removePending(id: string): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(pendingMatches().filter(item => item.id !== id)));
}
export function lastResult(): MatchRecord | null { return read(LAST_KEY, null); }
export function saveLastResult(match: MatchRecord): void { localStorage.setItem(LAST_KEY, JSON.stringify(match)); }
export function clearLastResult(): void { localStorage.removeItem(LAST_KEY); }
export function clearPending(): void { localStorage.removeItem(PENDING_KEY); }
