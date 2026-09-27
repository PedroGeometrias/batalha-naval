import type { EndReason, MatchRecord } from './network/contracts';
import type { GameOptions } from './settings';

export type GameOutcome = { score: number; durationSeconds: number; reason: EndReason };

export function completedMatch(outcome: GameOutcome, options: GameOptions, playerId: string): MatchRecord {
  return { id: crypto.randomUUID(), playerId, playerName: 'You', completedAt: new Date().toISOString(),
    score: outcome.score, durationSeconds: outcome.durationSeconds, reason: outcome.reason,
    options: { ...options } };
}

