import { NextRequest, NextResponse } from 'next/server';
import { readMonitorState } from '@/lib/monitor/miner-monitor';
import { removeSubscription, saveSubscription } from '@/lib/push/subscription-store';
import type { StoredPushSubscription } from '@/lib/push/types';
import { sendPush } from '@/lib/push/web-push';

export const runtime = 'nodejs';

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin;
}

function parseSubscription(value: unknown, userAgent: string | null): StoredPushSubscription | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const keys = candidate.keys as Record<string, unknown> | undefined;
  if (
    typeof candidate.endpoint !== 'string' ||
    !candidate.endpoint.startsWith('https://') ||
    !keys ||
    typeof keys.p256dh !== 'string' ||
    typeof keys.auth !== 'string'
  ) return null;

  return {
    endpoint: candidate.endpoint,
    expirationTime: typeof candidate.expirationTime === 'number' ? candidate.expirationTime : null,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
    createdAt: new Date().toISOString(),
    userAgent,
  };
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origine refusée' }, { status: 403 });
  }

  const subscription = parseSubscription(await request.json(), request.headers.get('user-agent'));
  if (!subscription) {
    return NextResponse.json({ error: 'Abonnement invalide' }, { status: 400 });
  }

  await saveSubscription(subscription);
  const monitor = await readMonitorState();
  await sendPush(subscription, {
    title: 'Notifications Antminer activées',
    body: monitor.status === 'down'
      ? 'Attention : le miner est actuellement hors ligne.'
      : 'Vous serez averti en cas de panne et de retour en ligne.',
    tag: 'antminer-subscription',
    url: '/',
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origine refusée' }, { status: 403 });
  }

  const body = await request.json() as { endpoint?: unknown };
  if (typeof body.endpoint !== 'string') {
    return NextResponse.json({ error: 'Endpoint invalide' }, { status: 400 });
  }

  await removeSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
