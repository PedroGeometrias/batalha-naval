import type { MatchRecord } from '../network/contracts';
import { DEFAULT_OPTIONS } from '../settings';

export const fixtures: MatchRecord[] = Array.from({ length: 24 }, (_, index) => ({
  id: `fixture-${index + 1}`,
  playerId: `fixture-player-${index % 7}`,
  playerName: ['Morgan', 'Avery', 'Blake', 'Riley', 'Casey', 'Jordan', 'Sage'][index % 7],
  completedAt: new Date(Date.UTC(2026, 8, 1 + index)).toISOString(),
  score: 24 - index,
  durationSeconds: 60 + index,
  reason: index % 3 === 0 ? 'death' : 'time',
  options: { ...DEFAULT_OPTIONS },
}));
