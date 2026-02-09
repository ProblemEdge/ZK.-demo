const CACHE_VERSION = 'v4';
const CACHE_NAME = `site-static-${CACHE_VERSION}`;
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico?v=3',
  '/icon-192x192.png',
  '/badge-72x72.png',
  '/sw.js',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(function (err) {
        console.error('Cache install failed:', err);
      }),
  );
  // Activate new service worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  // Take control of clients immediately after activation
  if (self.clients && self.clients.claim) {
    self.clients.claim();
  }
});

self.addEventListener('fetch', function (event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Prefer network for API requests so clients get fresh data
  try {
    const url = new URL(event.request.url);
    const isApi = url.pathname.startsWith('/api/');

    if (isApi) {
      event.respondWith(
        fetch(event.request)
          .then(function (networkResponse) {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type === 'opaque'
            ) {
              return caches.match(event.request);
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          })
          .catch(function () {
            return caches.match(event.request).then(function (response) {
              return response || caches.match('/');
            });
          }),
      );
      return;
    }

    // For non-API requests, prefer network for navigations (HTML) to avoid stale pages,
    // and use cache-first for other static resources.
    if (
      event.request.mode === 'navigate' ||
      event.request.headers.get('accept')?.includes('text/html')
    ) {
      // Network-first for navigations
      event.respondWith(
        fetch(event.request)
          .then(function (networkResponse) {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type === 'opaque'
            ) {
              return caches.match(event.request);
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          })
          .catch(function () {
            return caches.match(event.request).then(function (response) {
              return response || caches.match('/');
            });
          }),
      );
      return;
    }

    // For other non-API requests, serve from cache first
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(function (networkResponse) {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type === 'opaque'
            ) {
              return networkResponse;
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          })
          .catch(function () {
            return caches.match('/');
          });
      }),
    );
  } catch (e) {
    // If URL parsing fails, fallback to original cache-first behavior
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) return response;
        return fetch(event.request)
          .then(function (networkResponse) {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type === 'opaque'
            ) {
              return networkResponse;
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseClone);
            });
            return networkResponse;
          })
          .catch(function () {
            return caches.match('/');
          });
      }),
    );
  }
});

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// Listen for messages from clients to perform actions like clearing caches or skipWaiting
self.addEventListener('message', function (event) {
  const data = event.data || {};
  if (data && data.type === 'CLEAR_CACHE') {
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        }),
      );
    });
  }

  if (data && data.type === 'SKIP_WAITING') {
    if (self.skipWaiting) self.skipWaiting();
  }
});
