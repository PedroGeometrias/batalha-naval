import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateOptions, DEFAULT_OPTIONS } from '../src/settings.ts';
import { createDatabase, addMatch, listHistory, listRanking } from '../src/mocks/database.ts';
import type { MatchRecord } from '../src/network/contracts.ts';

const match = (id: string, score: number): MatchRecord => ({
  id, playerId: 'local-player', playerName: 'You', completedAt: '2026-09-27T00:00:00.000Z',
  score, durationSeconds: 60, reason: 'time', options: { ...DEFAULT_OPTIONS },
});

test('options reject out-of-range and fractional values', () => {
  assert.equal(validateOptions({ sessionTime: 59, spawnTime: 5 }), false);
  assert.equal(validateOptions({ sessionTime: 120, spawnTime: 0 }), false);
  assert.equal(validateOptions({ sessionTime: 120, spawnTime: 2.1 }), false);
  assert.equal(validateOptions({ sessionTime: 180, spawnTime: 30 }), true);
});

test('repeated match submissions return the same record and do not duplicate ranking', () => {
  const db = createDatabase([]);
  assert.equal(addMatch(db, match('one', 3)).id, 'one');
  assert.equal(addMatch(db, match('one', 3)).id, 'one');
  assert.equal(listHistory(db, 'local-player', 1, 10).total, 1);
  assert.equal(listRanking(db, DEFAULT_OPTIONS, 1, 10).total, 1);
});

test('ranking compares matching settings, sorts by score and paginates', () => {
  const db = createDatabase([]);
  addMatch(db, match('a', 2));
  addMatch(db, match('b', 5));
  addMatch(db, { ...match('other', 20), options: { sessionTime: 180, spawnTime: 5 } });
  const page = listRanking(db, DEFAULT_OPTIONS, 1, 1);
  assert.deepEqual(page.items.map(item => item.id), ['b']);
  assert.equal(page.total, 2);
  assert.deepEqual(listRanking(db, DEFAULT_OPTIONS, 2, 1).items.map(item => item.id), ['a']);
});
