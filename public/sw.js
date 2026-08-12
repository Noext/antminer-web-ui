self.addEventListener('push', (event) => {
  const fallback = {
    title: 'Antminer Dashboard',
    body: 'Nouvelle alerte du miner',
    tag: 'antminer-status',
    url: '/',
  };

  let payload = fallback;
  if (event.data) {
    try {
      payload = { ...fallback, ...event.data.json() };
    } catch {
      payload = { ...fallback, body: event.data.text() };
    }
  }

  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/icons/antminer-192.png',
    badge: '/icons/antminer-192.png',
    tag: payload.tag,
    renotify: true,
    requireInteraction: payload.tag === 'antminer-status',
    vibrate: [250, 100, 250, 100, 500],
    data: { url: payload.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) {
      await existing.focus();
      if ('navigate' in existing) await existing.navigate(destination);
      return;
    }
    await self.clients.openWindow(destination);
  })());
});
