import axios from 'axios';
import type { GameOptions } from '../settings';
import type { MatchRecord, Page } from './contracts';

const client = axios.create({ baseURL: '/api', timeout: 3000 });

export const api = {
  async ranking(options: GameOptions, page: number, signal?: AbortSignal): Promise<Page<MatchRecord>> {
    const response = await client.get<Page<MatchRecord>>('/ranking', {
      params: { ...options, page, pageSize: 10 }, signal,
    });
    return response.data;
  },
  async history(playerId: string, page: number, signal?: AbortSignal): Promise<Page<MatchRecord>> {
    const response = await client.get<Page<MatchRecord>>('/history', {
      params: { playerId, page, pageSize: 10 }, signal,
    });
    return response.data;
  },
  async record(match: MatchRecord): Promise<MatchRecord> {
    const response = await client.post<MatchRecord>('/history', match);
    return response.data;
  },
};
