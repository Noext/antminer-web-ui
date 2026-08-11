import 'server-only';

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getMinerLiveInfo } from '@/lib/miner-live-data';
import { sendPushToAll } from '@/lib/push/web-push';
import {
  initialMonitorState,
  recordFailure,
  recordSuccess,
  type MonitorState,
} from './state';

const STATE_FILE = 'miner-monitor-state.json';
const globalMonitor = globalThis as typeof globalThis & {
  antminerMonitorTimer?: NodeJS.Timeout;
};

function dataDirectory(): string {
  return process.env.PUSH_DATA_DIR || path.join(process.cwd(), '.data');
}

function statePath(): string {
  return path.join(dataDirectory(), STATE_FILE);
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function readMonitorState(): Promise<MonitorState> {
  try {
    const parsed: unknown = JSON.parse(await readFile(statePath(), 'utf8'));
    return { ...initialMonitorState, ...(parsed as Partial<MonitorState>) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return initialMonitorState;
    throw error;
  }
}

async function writeMonitorState(state: MonitorState): Promise<void> {
  const directory = dataDirectory();
  const target = statePath();
  const temporary = `${target}.${process.pid}.tmp`;
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, target);
}

export async function checkMiner(): Promise<void> {
  const previous = await readMonitorState();
  const checkedAt = new Date().toISOString();
  const threshold = positiveInteger(process.env.MINER_MONITOR_FAILURE_THRESHOLD, 3);
  let next: MonitorState;

  try {
    const info = await getMinerLiveInfo();
    next = recordSuccess(previous, checkedAt);

    if (previous.notifiedStatus === 'down') {
      try {
        const delivered = await sendPushToAll({
          title: 'Antminer de nouveau en ligne',
          body: `${info.hashrate.current} TH/s · ${info.temperatures.maximumChipCelsius} °C`,
          tag: 'antminer-status',
          url: '/',
        });
        if (delivered > 0) next.notifiedStatus = 'up';
      } catch (error) {
        console.error('[miner-monitor] Notification de retour impossible:', error);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    next = recordFailure(previous, checkedAt, message, threshold);

    if (next.status === 'down' && previous.notifiedStatus !== 'down') {
      try {
        const delivered = await sendPushToAll({
          title: 'Antminer hors ligne',
          body: `${threshold} contrôles consécutifs ont échoué. Dernière erreur : ${message}`,
          tag: 'antminer-status',
          url: '/',
        });
        if (delivered > 0) next.notifiedStatus = 'down';
      } catch (notificationError) {
        console.error('[miner-monitor] Notification de panne impossible:', notificationError);
      }
    }
  }

  await writeMonitorState(next);
}

export function startMinerMonitor(): void {
  if (globalMonitor.antminerMonitorTimer) return;

  const interval = positiveInteger(process.env.MINER_MONITOR_INTERVAL_MS, 30_000);
  const run = () => void checkMiner().catch((error) => {
    console.error('[miner-monitor] Contrôle impossible:', error);
  });

  run();
  globalMonitor.antminerMonitorTimer = setInterval(run, interval);
  globalMonitor.antminerMonitorTimer.unref();
  console.log(`[miner-monitor] Surveillance active toutes les ${interval / 1000} secondes`);
}
