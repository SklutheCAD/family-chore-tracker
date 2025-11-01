// Force a fresh cache when you bump VERSION
const VERSION = 'v4';
const CACHE = `chore-cache-${VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js?v=4',           // matches the script in index.html
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './favicon.png'
];

// Install: cache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    fetch(req)
      .then(net => {
        // Cache same-origin GET requests
        try {
          if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
            const copy = net.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
        } catch {}
        return net;
      })
      .catch(() => caches.match(req).then(res => res || caches.match('./index.html')))
  );
});
