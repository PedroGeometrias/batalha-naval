import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { resetMockState, resetNetworkSequence } from '../mocks/handlers';
import { getScenario, scenarios, setScenario, type Scenario } from '../mocks/scenarios';
import { clearLastResult, clearPending } from '../network/storage';

export function NetworkPanel({ onReset }: { onReset: () => void }) {
  const [scenario, select] = useState(getScenario);
  const queryClient = useQueryClient();

  async function change(next: Scenario) {
    await queryClient.cancelQueries();
    setScenario(next);
    resetNetworkSequence();
    select(next);
    await queryClient.invalidateQueries();
  }

  async function reset() {
    await queryClient.cancelQueries();
    resetMockState();
    clearPending();
    clearLastResult();
    select('success');
    onReset();
    await queryClient.invalidateQueries();
  }

  return <details className="network-panel"><summary>Network scenarios</summary>
    <label htmlFor="scenario">Simulated response</label>
    <select id="scenario" value={scenario} onChange={event => void change(event.target.value as Scenario)}>
      {scenarios.map(item => <option key={item} value={item}>{item.replaceAll('-', ' ')}</option>)}
    </select>
    <button className="secondary" onClick={() => void reset()}>Reset network data and records</button>
    <p className="subtle">Scenarios persist across refresh. Reset restores fixtures and clears pending submissions.</p>
  </details>;
}
