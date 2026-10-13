// LifeAdmin's service worker: it exists to show notifications when the app is closed. It keeps no copy of
// pages or data (nothing is cached here), so it can never show something stale or somebody else's.
//
// What arrives is three short fields: which fixed sentence to show, where in the app to go, and a name for
// the event. No title, name or text of the person's own data ever travels in a push: it could be read on a
// locked screen.

const TEXT = {
  update: 'You have something new.',
  reminder: 'A reminder is due.',
  chat: 'New message in your circle.',
  comment: 'New comment on a task.',
  task: 'New task in your circle.',
  test: 'Notifications work on this device.',
};

// Only a place inside the app.
function safePath(path) {
  return typeof path === 'string' && /^\/(#\/[A-Za-z0-9/_-]{0,80})?$/.test(path) ? path : '/';
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {}
  const options = { body: TEXT[data.k] || TEXT.update, icon: '/icons/icon-192.png', badge: '/icons/badge-96.png', data: { path: safePath(data.u) } };
  if (typeof data.g === 'string' && data.g) options.tag = data.g;
  // A notification is always shown for a push: browsers take the permission away from sites that stay silent.
  event.waitUntil(self.registration.showNotification('LifeAdmin', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = safePath(event.notification.data && event.notification.data.path);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        // The page decides what to show: it checks the session and the person's access as for any other visit.
        open.postMessage({ type: 'la-open', path });
        return;
      }
      await self.clients.openWindow(path);
    })()
  );
});

// The browser replaced the subscription on its own: tell the server, with the session cookie this browser has.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const options = event.oldSubscription ? event.oldSubscription.options : null;
        const fresh = event.newSubscription || (options ? await self.registration.pushManager.subscribe(options) : null);
        if (!fresh) return;
        await fetch('/api/push/subscription', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fresh.toJSON()) });
      } catch {}
    })()
  );
});
