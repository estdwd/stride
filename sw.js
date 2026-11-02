/* Stride service worker */
const VERSION = 'stride-v1';
const SHELL = ['./', 'index.html', 'app.html', 'test.html', 'styles.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

// Optional: real background push via OneSignal (set the App ID in app.html too)
try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) {}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // never cache Supabase / API calls
  if (url.hostname.endsWith('supabase.co')) return;

  // pages: network first, fall back to cache (offline)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('app.html')))
    );
    return;
  }
  // everything else: stale-while-revalidate (fonts, CDN libs, css, icons)
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

// Push (works with any Web Push sender)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Stride', {
    body: d.body || 'Time to keep your streak alive 🔥',
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
    tag: d.tag || 'stride', data: { url: d.url || './app.html' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './app.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(target);
  }));
});
