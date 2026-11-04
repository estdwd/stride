/* Stride service worker */
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
const VERSION = 'stride-v6';

// Only list files that ACTUALLY exist. Anything missing here breaks install.
const SHELL = [
  './',
  'index.html',
  'app.html',
  'test.html',
  'admin.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
    // Cache each file independently so a single 404 does NOT kill the SW install.
    .then(c => Promise.all(SHELL.map(url => c.add(url).catch(() => null))))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  
  // Never cache Supabase / API calls
  if (url.hostname.endsWith('supabase.co')) return;
  
  // Pages: network-first, fall back to cache (offline)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
      .then(res => {
        const c = res.clone();
        caches.open(VERSION).then(x => x.put(req, c));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('app.html')))
    );
    return;
  }
  
  // Everything else: stale-while-revalidate
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const c = res.clone();
          caches.open(VERSION).then(x => x.put(req, c));
        }
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
    body: d.body || 'Time to keep your streak alive',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: d.tag || 'stride',
    data: { url: d.url || './app.html' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './app.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return clients.openWindow(target);
    })
  );
});

// In-memory question cache (per SW lifetime). test.html also keeps a localStorage fallback.
const Q_CACHE = new Map();
self.addEventListener('message', e => {
  const d = e.data || {};
  const port = e.ports && e.ports[0];
  if (d.type === 'cacheQuestion') { Q_CACHE.set(d.key, d.data); if (port) port.postMessage({ ok: true }); }
  else if (d.type === 'getQuestion') { const found = Q_CACHE.has(d.key); if (port) port.postMessage({ found, data: found ? Q_CACHE.get(d.key) : null }); }
  else if (d.type === 'clearQuestions') { Q_CACHE.clear(); if (port) port.postMessage({ ok: true }); }
});
