'use client';

import { Bell, BellOff, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type NotificationState = 'loading' | 'unsupported' | 'blocked' | 'disabled' | 'enabled' | 'error';

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  return new Uint8Array(bytes.buffer);
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  return navigator.serviceWorker.ready;
}

export function NotificationManager() {
  const [state, setState] = useState<NotificationState>('loading');
  const [message, setMessage] = useState('Vérification des notifications…');

  useEffect(() => {
    async function inspect() {
      if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState('unsupported');
        setMessage('Ouvrez le dashboard en HTTPS pour activer les alertes Android.');
        return;
      }
      if (Notification.permission === 'denied') {
        setState('blocked');
        setMessage('Notifications bloquées dans les réglages du navigateur.');
        return;
      }

      const registration = await getRegistration();
      const subscription = await registration.pushManager.getSubscription();
      setState(subscription ? 'enabled' : 'disabled');
      setMessage(subscription
        ? 'Alertes de panne actives sur cet appareil.'
        : 'Recevez une alerte si le miner tombe, puis quand il redémarre.');
    }

    inspect().catch((error) => {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Vérification impossible');
    });
  }, []);

  async function enable() {
    setState('loading');
    setMessage('Activation en cours…');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'disabled');
        setMessage('Autorisation de notification non accordée.');
        return;
      }

      const configResponse = await fetch('/api/push/config', { cache: 'no-store' });
      const config = await configResponse.json() as { publicKey?: string; error?: string };
      if (!configResponse.ok || !config.publicKey) {
        throw new Error(config.error || 'Notifications non configurées sur le serveur');
      }
      const registration = await getRegistration();
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(config.publicKey),
      });

      const response = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Enregistrement de cet appareil impossible');
      }

      setState('enabled');
      setMessage('Alertes actives. Une notification de confirmation vient d’être envoyée.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Activation impossible');
    }
  }

  async function disable() {
    setState('loading');
    setMessage('Désactivation en cours…');
    try {
      const registration = await getRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setState('disabled');
      setMessage('Alertes désactivées sur cet appareil.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Désactivation impossible');
    }
  }

  const enabled = state === 'enabled';
  const actionable = state === 'enabled' || state === 'disabled' || state === 'error';

  return (
    <div className="mb-8 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-cyan-500/15 p-2">
          {enabled ? <Bell className="h-5 w-5 text-cyan-400" /> : <BellOff className="h-5 w-5 text-slate-400" />}
        </div>
        <div>
          <p className="font-semibold text-slate-100">Alertes Android</p>
          <p className="mt-1 text-sm text-slate-300">{message}</p>
        </div>
      </div>
      {actionable && (
        <button
          type="button"
          onClick={enabled ? disable : enable}
          className="mt-4 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/25 sm:mt-0 sm:w-auto"
        >
          {enabled ? 'Désactiver' : 'Activer les alertes'}
        </button>
      )}
      {state === 'loading' && <LoaderCircle className="mt-4 h-5 w-5 animate-spin text-cyan-400 sm:mt-0" />}
    </div>
  );
}
