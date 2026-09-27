export const scenarios = [
  'success', 'empty', 'multiple-pages', 'slow', 'variable-latency', 'out-of-order',
  'timeout', 'connection-failure', 'http-400', 'http-500', 'ranking-error',
  'history-error', 'post-timeout', 'offline',
] as const;
export type Scenario = typeof scenarios[number];
const KEY = 'pirate-battle:scenario';
export function getScenario(): Scenario {
  const saved = localStorage.getItem(KEY);
  return scenarios.find(item => item === saved) ?? 'success';
}
export function setScenario(scenario: Scenario): void { localStorage.setItem(KEY, scenario); }
export function resetScenario(): void { localStorage.removeItem(KEY); }
