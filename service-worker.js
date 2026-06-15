/* ============================================================
   منصة وعي الشباب BBA - Service Worker v1.0
   ============================================================ */

const CACHE_NAME = 'bba-platform-v2';
const STATIC_CACHE = 'bba-static-v2';
const DYNAMIC_CACHE = 'bba-dynamic-v2';

/* Derive relative paths from the service worker's own location */
const BASE_PATH = self.location.pathname.replace(/\/[^/]*$/, '');
const OFFLINE_URL = BASE_PATH + '/offline.html';

const PRECACHE_URLS = [
  BASE_PATH + '/index.html',
  BASE_PATH + '/css/styles.css',
  BASE_PATH + '/js/app.js',
  BASE_PATH + '/js/config.js',
  BASE_PATH + '/js/database.js',
  BASE_PATH + '/js/platform-core.js',
  BASE_PATH + '/manifest.json',
  OFFLINE_URL
];

/* Install: Cache core assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function(err) {
        console.warn('[SW] Precaching failed for some URLs:', err.message);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activate: Clean old caches */
self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: Cache-first for static, network-first for dynamic */
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  /* Skip non-GET and API/external requests */
  if (event.request.method !== 'GET') return;
  if (requestUrl.origin !== self.location.origin && !requestUrl.hostname.includes('fonts.googleapis.com') && !requestUrl.hostname.includes('fonts.gstatic.com') && !requestUrl.hostname.includes('cdn.jsdelivr.net') && !requestUrl.hostname.includes('cdnjs.cloudflare.com')) return;

  /* HTML pages: Network first, fallback to cache, then offline */
  if (event.request.headers.get('Accept') && event.request.headers.get('Accept').indexOf('text/html') !== -1) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var copy = response.clone();
        caches.open(DYNAMIC_CACHE).then(function(cache) {
          cache.put(event.request, copy);
        });
        return response;
      }).catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  /* CSS, JS, fonts: Cache-first */
  if (event.request.url.match(/\.(css|js|json)$/) || requestUrl.hostname.includes('fonts.')) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        var fetchPromise = fetch(event.request).then(function(response) {
          var copy = response.clone();
          caches.open(STATIC_CACHE).then(function(cache) {
            cache.put(event.request, copy);
          });
          return response;
        }).catch(function() {
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  /* Images, other: Cache-first, network update */
  if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        var fetchPromise = fetch(event.request).then(function(response) {
          var copy = response.clone();
          caches.open(DYNAMIC_CACHE).then(function(cache) {
            cache.put(event.request, copy);
          });
          return response;
        }).catch(function() {
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  /* CDN resources: Network first */
  event.respondWith(
    fetch(event.request).then(function(response) {
      var copy = response.clone();
      caches.open(DYNAMIC_CACHE).then(function(cache) {
        cache.put(event.request, copy);
      });
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});

/* Message: Skip waiting */
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
