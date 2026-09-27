import { delay, http, HttpResponse } from 'msw';
import type { MatchRecord } from '../network/contracts';
import { validateOptions } from '../settings';
import { addMatch, createDatabase, listHistory, listRanking, type Database } from './database';
import { fixtures } from './fixtures';
import { getScenario, resetScenario, type Scenario } from './scenarios';

const DATABASE_KEY = 'pirate-battle:mock-matches';
let sequence = 0;

function loadDatabase(): Database {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(DATABASE_KEY) || 'null');
    if (stored && typeof stored === 'object' && 'matches' in stored && Array.isArray(stored.matches)) {
      return { matches: stored.matches as MatchRecord[], timedOutIds: Array.isArray((stored as Database).timedOutIds)
        ? (stored as Database).timedOutIds : [] };
    }
  } catch { /* Corrupt local data is replaced with fixtures. */ }
  return createDatabase(fixtures);
}
let db: Database = loadDatabase();
function persist(): void { localStorage.setItem(DATABASE_KEY, JSON.stringify(db)); }

export function resetNetworkSequence(): void { sequence = 0; }

export function resetMockState(): void {
  resetScenario();
  localStorage.removeItem(DATABASE_KEY);
  db = createDatabase(fixtures);
  sequence = 0;
}

async function network(scenario: Scenario, resource: 'ranking' | 'history' | 'post') {
  sequence += 1;
  const time = scenario === 'slow' ? 1800 : scenario === 'variable-latency'
    ? [150, 900, 350, 1100][(sequence - 1) % 4]
    : scenario === 'out-of-order' ? (sequence % 2 ? 1200 : 100) : 120;
  await delay(time);
  if (scenario === 'timeout') { await delay(12000); return new HttpResponse(null, { status: 504 }); }
  if (scenario === 'connection-failure') return HttpResponse.error();
  if (scenario === 'offline' || (scenario === 'ranking-error' && resource === 'ranking')
    || (scenario === 'history-error' && resource === 'history') || scenario === 'http-500') {
    return HttpResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
  if (scenario === 'http-400') return HttpResponse.json({ message: 'Bad request' }, { status: 400 });
  return null;
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export const handlers = [
  http.get('/api/ranking', async ({ request }) => {
    const scenario = getScenario();
    const failure = await network(scenario, 'ranking');
    if (failure) return failure;
    const params = new URL(request.url).searchParams;
    const options = { sessionTime: Number(params.get('sessionTime')), spawnTime: Number(params.get('spawnTime')) };
    const page = positiveInteger(params.get('page'), 1);
    const pageSize = positiveInteger(params.get('pageSize'), 10);
    if (!validateOptions(options) || !page || !pageSize || pageSize > 50) return HttpResponse.json({ message: 'Invalid query' }, { status: 400 });
    const records = scenario === 'empty' ? createDatabase([]) : scenario === 'multiple-pages' ? db
      : { ...db, matches: db.matches.filter(item => !item.id.startsWith('fixture-')
        || Number(item.id.slice('fixture-'.length)) <= 8) };
    return HttpResponse.json(listRanking(records, options, page, pageSize));
  }),
  http.get('/api/history', async ({ request }) => {
    const scenario = getScenario();
    const failure = await network(scenario, 'history');
    if (failure) return failure;
    const params = new URL(request.url).searchParams;
    const player = params.get('playerId');
    const page = positiveInteger(params.get('page'), 1);
    const pageSize = positiveInteger(params.get('pageSize'), 10);
    if (!player || !page || !pageSize || pageSize > 50) return HttpResponse.json({ message: 'Invalid query' }, { status: 400 });
    return HttpResponse.json(listHistory(scenario === 'empty' ? createDatabase([]) : db, player, page, pageSize));
  }),
  http.post('/api/history', async ({ request }) => {
    const scenario = getScenario();
    const failure = await network(scenario, 'post');
    if (failure) return failure;
    const match = await request.json() as MatchRecord;
    if (!match || typeof match.id !== 'string' || !match.id || typeof match.playerId !== 'string'
      || !Number.isInteger(match.score) || match.score < 0 || !Number.isFinite(match.durationSeconds)
      || match.durationSeconds < 0 || !['time', 'death'].includes(match.reason)
      || !match.options || !validateOptions(match.options) || !Number.isFinite(Date.parse(match.completedAt))) {
      return HttpResponse.json({ message: 'Invalid match' }, { status: 400 });
    }
    const stored = addMatch(db, match);
    if (scenario === 'post-timeout' && !db.timedOutIds.includes(match.id)) {
      db.timedOutIds.push(match.id);
      persist();
      await delay(12000);
      return HttpResponse.json({ message: 'Response timed out' }, { status: 504 });
    }
    persist();
    return HttpResponse.json(stored, { status: 200 });
  }),
];
