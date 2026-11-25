/**
 * PulseSocial PWA Service Worker (v4.0 Production)
 * Strict Cache-Invalidation & Multi-Tenant Zero-Leak Strategy:
 * 1. NetworkOnly for all non-GET, authenticated requests (Authorization or session cookies), /api/*, and RSC data.
 * 2. NetworkFirst for ALL HTML navigations (request.mode === 'navigate') with /offline.html fallback.
 *    (HTML pages are NEVER stored in cache to guarantee fresh state and immediate middleware redirections).
 * 3. CacheFirst ONLY for immutable hashed static assets (/_next/static/*, /icons/*).
 * 4. Immediate cache purge of all previous versions on activate.
 */

const STATIC_CACHE_NAME = 'pulsesocial-v4.0-prod';
const OFFLINE_URL = '/offline.html';

// Only immutable offline fallback assets are pre-cached. NEVER pre-cache '/' or HTML pages!
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/logo.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME) {
            console.log('[SW] Purging obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Claim all active client tabs immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. NON-GET requests or Chrome only-if-cached bug -> NetworkOnly
  if (request.method !== 'GET') {
    return;
  }
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
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
    // NetworkOnly: bypass service worker cache completely (let browser perform native network fetch)
    return;
  }

  // 3. NetworkFirst with Offline Fallback for HTML page navigation
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Return fresh network response directly; NEVER cache HTML pages with user session
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 4. CacheFirst ONLY for immutable hashed static assets (_next/static, icons, logo.svg)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/logo.svg' ||
    /\.(woff|woff2|ttf|ico|svg)$/.test(url.pathname)
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

  // Default: Network fetch with error handling
  event.respondWith(
    fetch(request).catch(() => {
      if (request.mode === 'navigate') {
        return caches.match(OFFLINE_URL);
      }
      return new Response('', { status: 408, statusText: 'Request Timeout' });
    })
  );
});
