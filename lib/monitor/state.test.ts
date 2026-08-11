import { describe, expect, test } from 'bun:test';
import { initialMonitorState, recordFailure, recordSuccess } from './state';

describe('miner monitor state', () => {
  test('attend le seuil avant de déclarer une panne', () => {
    const first = recordFailure(initialMonitorState, '2026-01-01T00:00:00Z', 'timeout', 3);
    const second = recordFailure(first, '2026-01-01T00:00:30Z', 'timeout', 3);
    const third = recordFailure(second, '2026-01-01T00:01:00Z', 'timeout', 3);

    expect(first.status).toBe('unknown');
    expect(second.status).toBe('unknown');
    expect(third.status).toBe('down');
    expect(third.consecutiveFailures).toBe(3);
  });

  test('réinitialise les erreurs et signale le retour en ligne', () => {
    const down = {
      ...initialMonitorState,
      status: 'down' as const,
      notifiedStatus: 'down' as const,
      consecutiveFailures: 4,
    };
    const up = recordSuccess(down, '2026-01-01T00:02:00Z');

    expect(up.status).toBe('up');
    expect(up.consecutiveFailures).toBe(0);
    expect(up.lastTransitionAt).toBe('2026-01-01T00:02:00Z');
  });
});
