import 'server-only';

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StoredPushSubscription } from './types';

const FILE_NAME = 'push-subscriptions.json';

function dataDirectory(): string {
  return process.env.PUSH_DATA_DIR || path.join(process.cwd(), '.data');
}

function subscriptionsPath(): string {
  return path.join(dataDirectory(), FILE_NAME);
}

async function readSubscriptions(): Promise<StoredPushSubscription[]> {
  try {
    const contents = await readFile(subscriptionsPath(), 'utf8');
    const parsed: unknown = JSON.parse(contents);
    return Array.isArray(parsed) ? (parsed as StoredPushSubscription[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function writeSubscriptions(subscriptions: StoredPushSubscription[]): Promise<void> {
  const directory = dataDirectory();
  const target = subscriptionsPath();
  const temporary = `${target}.${process.pid}.tmp`;
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(temporary, `${JSON.stringify(subscriptions, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, target);
}

let writeQueue: Promise<void> = Promise.resolve();

function serializeWrite(operation: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(operation, operation);
  return writeQueue;
}

export async function listSubscriptions(): Promise<StoredPushSubscription[]> {
  await writeQueue;
  return readSubscriptions();
}

export async function saveSubscription(subscription: StoredPushSubscription): Promise<void> {
  return serializeWrite(async () => {
    const subscriptions = await readSubscriptions();
    const withoutCurrent = subscriptions.filter((item) => item.endpoint !== subscription.endpoint);
    await writeSubscriptions([...withoutCurrent, subscription]);
  });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  return serializeWrite(async () => {
    const subscriptions = await readSubscriptions();
    await writeSubscriptions(subscriptions.filter((item) => item.endpoint !== endpoint));
  });
}
