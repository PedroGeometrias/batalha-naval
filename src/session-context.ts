import { createContext, useContext } from 'react';
import type { GameOutcome } from './session';

export const MatchCompletionContext = createContext<((outcome: GameOutcome) => void) | null>(null);

// TODO: GameCanvas can call this hook once its simulation implements a real end state.
export function useMatchCompletion() {
  return useContext(MatchCompletionContext);
}
