import type { GameOptions } from '../settings';
import type { MatchRecord, Page } from '../network/contracts';

export type Database = { matches: MatchRecord[]; timedOutIds: string[] };
export function createDatabase(matches: MatchRecord[]): Database {
  return { matches: [...matches], timedOutIds: [] };
}

export function addMatch(db: Database, match: MatchRecord): MatchRecord {
  const existing = db.matches.find(item => item.id === match.id);
  if (existing) return existing;
  db.matches.push(match);
  return match;
}

function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize,
    total: items.length, totalPages: Math.ceil(items.length / pageSize) };
}

export function listRanking(db: Database, options: GameOptions, page: number, pageSize: number): Page<MatchRecord> {
  const matching = db.matches.filter(item => item.options.sessionTime === options.sessionTime
    && item.options.spawnTime === options.spawnTime);
  matching.sort((a, b) => b.score - a.score || a.durationSeconds - b.durationSeconds
    || a.completedAt.localeCompare(b.completedAt) || a.id.localeCompare(b.id));
  return paginate(matching, page, pageSize);
}

export function listHistory(db: Database, playerId: string, page: number, pageSize: number): Page<MatchRecord> {
  const matching = db.matches.filter(item => item.playerId === playerId);
  matching.sort((a, b) => b.completedAt.localeCompare(a.completedAt) || a.id.localeCompare(b.id));
  return paginate(matching, page, pageSize);
}
