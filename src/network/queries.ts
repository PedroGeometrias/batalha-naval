import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { GameOptions } from '../settings';
import { api } from './client';
import type { MatchRecord } from './contracts';
import { queueMatch, removePending } from './storage';

export function retry(attempt: number, error: Error): boolean {
  if (axios.isAxiosError(error) && error.response && error.response.status < 500) return false;
  return attempt < 1;
}

export function useRanking(options: GameOptions, page: number, enabled: boolean) {
  return useQuery({ queryKey: ['ranking', options.sessionTime, options.spawnTime, page],
    queryFn: ({ signal }) => api.ranking(options, page, signal), enabled, retry, staleTime: 0 });
}

export function useHistory(playerId: string, page: number, enabled: boolean) {
  return useQuery({ queryKey: ['history', playerId, page],
    queryFn: ({ signal }) => api.history(playerId, page, signal), enabled, retry, staleTime: 0 });
}

export function useRecordMatch(onSettled?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (match: MatchRecord) => {
      queueMatch(match);
      const confirmed = await api.record(match);
      removePending(match.id);
      return confirmed;
    },
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['ranking'] }),
        queryClient.invalidateQueries({ queryKey: ['history'] })]);
      onSettled?.();
    },
    onError: () => onSettled?.(),
  });
}
