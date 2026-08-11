import 'server-only';

import webpush, { type PushSubscription } from 'web-push';
import { listSubscriptions, removeSubscription } from './subscription-store';
import type { PushPayload, StoredPushSubscription } from './types';

function configureWebPush(): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error('VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY et VAPID_SUBJECT sont requis');
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function toWebPushSubscription(subscription: StoredPushSubscription): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: subscription.keys,
  };
}

export async function sendPush(
  subscription: StoredPushSubscription,
  payload: PushPayload,
): Promise<boolean> {
  configureWebPush();

  try {
    await webpush.sendNotification(toWebPushSubscription(subscription), JSON.stringify(payload), {
      TTL: 300,
      urgency: 'high',
    });
    return true;
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await removeSubscription(subscription.endpoint);
      return false;
    }
    throw error;
  }
}

export async function sendPushToAll(payload: PushPayload): Promise<number> {
  const subscriptions = await listSubscriptions();
  const results = await Promise.allSettled(
    subscriptions.map((subscription) => sendPush(subscription, payload)),
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[miner-monitor] Échec Web Push:', result.reason);
    }
  }

  return results.filter((result) => result.status === 'fulfilled' && result.value).length;
}
