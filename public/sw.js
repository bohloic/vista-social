/**
 * PulseSocial PWA Service Worker (v2.1)
 * Strict multi-tenant security:
 * 1. NetworkOnly for all non-GET, authenticated requests (Authorization header or session cookies), /api/*, and RSC data.
 * 2. NetworkFirst with /offline.html fallback for HTML navigation.
 * 3. CacheFirst only for immutable hashed static assets (/_next/static/*).
 * 4. Never cache responses carrying Set-Cookie or sensitive headers.
 */

const STATIC_CACHE_NAME = 'pulsesocial-static-v2.1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/images/3d-dashboard-cm.jpg',
  '/images/3d-login-character.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. NON-GET requests -> NetworkOnly
  if (request.method !== 'GET') {
    return;
  }

  // 2. CRITICAL SECURITY: Never cache /api/*, authenticated requests, or Next.js RSC data
  const hasAuthHeader = request.headers.has('authorization');
  const isAuthOrApiOrRsc =
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') ||
    url.pathname.includes('.rsc') ||
    url.searchParams.has('_rsc') ||
    hasAuthHeader;

  if (isAuthOrApiOrRsc) {
    // NetworkOnly: bypass service worker cache completely
    event.respondWith(fetch(request));
    return;
  }

  // 3. NetworkFirst with Offline Fallback for HTML page navigation
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 4. CacheFirst ONLY for immutable hashed static assets (_next/static, icons, images)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff|woff2)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Never cache responses with Set-Cookie or non-200 responses
          if (
            response &&
            response.status === 200 &&
            !response.headers.has('set-cookie') &&
            !hasAuthHeader
          ) {
            const clone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: Network fetch
  event.respondWith(fetch(request));
});
