// RES Scholar Tracker app shell cache.

const APP_VERSION = 'v13';
const CACHE_PREFIX = 'res-scholar-tracker-';
const APP_SHELL = `${CACHE_PREFIX}${APP_VERSION}`;

const FILES_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './students.csv',
  './documents.csv',
  './publications.csv',
  './message-templates.txt',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/screenshots/phone-01.png',
  './assets/screenshots/tablet-7-01.png'
];

function refreshAppShell() {
  return caches.open(APP_SHELL).then((cache) => {
    return Promise.all(
      FILES_TO_CACHE.map((file) => {
        return fetch(file, { cache: 'reload' })
          .then((response) => {
            if (response && response.status === 200) {
              return cache.put(file, response);
            }
            return undefined;
          })
          .catch(() => undefined);
      })
    );
  });
}

self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing ${APP_SHELL}`);
  
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== APP_SHELL) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(APP_SHELL).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('./index.html');
            });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(APP_SHELL).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return cachedResponse || new Response('Resource unavailable', { status: 503 });
        });

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => {
          console.log(`[Service Worker] Clearing cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    });
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'res-scholar-background-sync') {
    event.waitUntil(refreshAppShell());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'res-scholar-periodic-cache') {
    event.waitUntil(refreshAppShell());
  }
});

console.log('[Service Worker] Loaded successfully');
