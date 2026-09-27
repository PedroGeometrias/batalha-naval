import { useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { MatchRecord, Page } from '../network/contracts';
import { useHistory, useRanking } from '../network/queries';
import type { GameOptions } from '../settings';

type Tab = 'ranking' | 'history';
function Table({ query, tab, page, setPage }: {
  query: UseQueryResult<Page<MatchRecord>, Error>; tab: Tab;
  page: number; setPage: (page: number) => void;
}) {
  if (query.isPending) return <p role="status">Loading {tab === 'ranking' ? 'ranking' : 'match history'}…</p>;
  if (query.isError) return <div role="alert"><p>Could not load {tab === 'ranking' ? 'ranking' : 'match history'}.</p>
    <button onClick={() => void query.refetch()}>Try again</button></div>;
  return <>
    {query.isFetching && <p className="subtle" role="status">Updating…</p>}
    {query.data.items.length === 0 ? <p>No matches on this page.</p> : <div className="table-wrap"><table>
      <thead><tr>{tab === 'ranking' && <th scope="col">Rank</th>}<th scope="col">Player</th>
        <th scope="col">Score</th><th scope="col">Date</th>
        {tab === 'history' && <><th scope="col">Duration</th><th scope="col">End reason</th></>}</tr></thead>
      <tbody>{query.data.items.map((match, index) => <tr key={match.id}>
        {tab === 'ranking' && <td>{(page - 1) * query.data.pageSize + index + 1}</td>}
        <td>{match.playerName}</td><td>{match.score}</td><td>{new Date(match.completedAt).toLocaleDateString('en-US')}</td>
        {tab === 'history' && <><td>{match.durationSeconds.toFixed(1)}s</td><td>{match.reason === 'time' ? 'Time expired' : 'Ship destroyed'}</td></>}
      </tr>)}</tbody></table></div>}
    <div className="pagination"><button className="secondary" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</button>
      <span>Page {page} of {Math.max(query.data.totalPages, 1)}</span>
      <button className="secondary" onClick={() => setPage(page + 1)} disabled={page >= query.data.totalPages}>Next</button></div>
  </>;
}

export function Leaderboards({ options, playerId }: { options: GameOptions; playerId: string }) {
  const [tab, setTab] = useState<Tab>('ranking');
  const [rankingPage, setRankingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const ranking = useRanking(options, rankingPage, tab === 'ranking');
  const history = useHistory(playerId, historyPage, tab === 'history');
  return <section className="panel leaderboard" aria-label="Match records">
    <div className="tabs" role="tablist" aria-label="Match records">
      <button role="tab" aria-selected={tab === 'ranking'} className={tab === 'ranking' ? 'selected' : ''}
        onClick={() => setTab('ranking')}>Ranking</button>
      <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'selected' : ''}
        onClick={() => setTab('history')}>Match History</button>
    </div>
    <div role="tabpanel" aria-label={tab === 'ranking' ? 'Ranking' : 'Match History'}>
      {tab === 'ranking' ? <><p className="subtle">Matches using {options.sessionTime}s sessions and {options.spawnTime}s spawns.</p>
        <Table query={ranking} tab="ranking" page={rankingPage} setPage={setRankingPage} /></>
        : <Table query={history} tab="history" page={historyPage} setPage={setHistoryPage} />}
    </div>
  </section>;
}
