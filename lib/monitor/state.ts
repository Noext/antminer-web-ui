export type MinerStatus = 'unknown' | 'up' | 'down';

export interface MonitorState {
  status: MinerStatus;
  notifiedStatus: MinerStatus;
  consecutiveFailures: number;
  lastCheckedAt: string | null;
  lastTransitionAt: string | null;
  lastError: string | null;
}

export const initialMonitorState: MonitorState = {
  status: 'unknown',
  notifiedStatus: 'unknown',
  consecutiveFailures: 0,
  lastCheckedAt: null,
  lastTransitionAt: null,
  lastError: null,
};

export function recordSuccess(state: MonitorState, checkedAt: string): MonitorState {
  return {
    ...state,
    status: 'up',
    consecutiveFailures: 0,
    lastCheckedAt: checkedAt,
    lastTransitionAt: state.status === 'up' ? state.lastTransitionAt : checkedAt,
    lastError: null,
  };
}

export function recordFailure(
  state: MonitorState,
  checkedAt: string,
  error: string,
  failureThreshold: number,
): MonitorState {
  const consecutiveFailures = state.consecutiveFailures + 1;
  const status = consecutiveFailures >= failureThreshold ? 'down' : state.status;

  return {
    ...state,
    status,
    consecutiveFailures,
    lastCheckedAt: checkedAt,
    lastTransitionAt: status !== state.status ? checkedAt : state.lastTransitionAt,
    lastError: error,
  };
}
