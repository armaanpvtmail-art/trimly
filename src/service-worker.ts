/**
 * Service Worker for Trimly PWA.
 * Handles caching strategies, offline fallback, and background sync.
 */

// Declare self to avoid TypeScript errors in SW context.
declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'trimly-v1';
const RUNTIME_CACHE = 'trimly-runtime';
const THEME_CACHE = 'trimly-themes';

const CACHE_URLS = [
  '/',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/**
 * Install event: cache essential assets.
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(CACHE_URLS);
      console.log('[SW] Install complete, caches primed');
      await self.skipWaiting();
    })()
  );
});

/**
 * Activate event: clean up old caches.
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== RUNTIME_CACHE && name !== THEME_CACHE)
          .map((name) => caches.delete(name))
      );
      console.log('[SW] Activation complete, old caches removed');
      await self.clients.claim();
    })()
  );
});

/**
 * Fetch event: implement cache-first strategy for static assets,
 * network-first for API/dynamic content, and offline fallback.
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests.
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (no caching).
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline. Please check your connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Cache-first for static assets (icons, images, fonts).
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/i) ||
    url.pathname.startsWith('/icons')
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const cache = THEME_CACHE;
          const responseToCache = response.clone();
          caches.open(cache).then((c) => c.put(request, responseToCache));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for everything else (HTML, CSS, JS, etc.).
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Return offline page for HTML requests.
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/offline.html');
        }
        // Return cached version or error response.
        return caches.match(request).then((response) => {
          return (
            response ||
            new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        });
      })
  );
});

console.log('[SW] Service Worker loaded');
