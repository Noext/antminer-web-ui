import { NextResponse } from 'next/server';
import { readMonitorState } from '@/lib/monitor/miner-monitor';
import { listSubscriptions } from '@/lib/push/subscription-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: 'Les notifications ne sont pas configurées' }, { status: 503 });
  }

  const [monitor, subscriptions] = await Promise.all([
    readMonitorState(),
    listSubscriptions(),
  ]);

  return NextResponse.json({
    publicKey,
    monitor,
    subscriptionCount: subscriptions.length,
  });
}
