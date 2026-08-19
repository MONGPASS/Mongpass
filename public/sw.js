/**
 * MongPass service worker — Web Push receiver.
 *
 * Pushes arrive payload-less (see src/lib/push/server.ts): on each
 * push we fetch the caller's badge counts and compose the notification
 * text locally. The fixed `tag` collapses stacked notifications into
 * one, so a burst of orders/messages doesn't spam the shade.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let title = 'MongPass';
    let body = 'Шинэ мэдэгдэл ирлээ';
    let url = '/notifications';
    try {
      const res = await fetch('/api/me/badges', { credentials: 'include' });
      if (res.ok) {
        const b = await res.json();
        if (b.bizPendingOrders > 0) {
          title = 'Шинэ захиалга';
          body = 'Хүлээгдэж буй ' + b.bizPendingOrders + ' захиалга байна';
          url = '/biz';
        } else if (b.chatUnread > 0) {
          title = 'Шинэ мессеж';
          body = 'Уншаагүй ' + b.chatUnread + ' чат байна';
          url = '/chat';
        }
      }
    } catch (e) {
      /* offline / signed out — show the generic text */
    }
    await self.registration.showNotification(title, {
      body,
      icon: '/icons/other.png',
      tag: 'mongpass',
      renotify: true,
      data: { url },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if ('focus' in w) {
        await w.focus();
        if ('navigate' in w) await w.navigate(url);
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
