import type { GameOptions } from '../settings';

export type EndReason = 'time' | 'death';
export type MatchRecord = {
  id: string;
  playerId: string;
  playerName: string;
  completedAt: string;
  score: number;
  durationSeconds: number;
  reason: EndReason;
  options: GameOptions;
};
export type Page<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };
