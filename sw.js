---
---
var CACHE_NAME = 'tls-v1';
var BASE = '{{ site.baseurl }}';
var STATIC_ASSETS = [
  BASE + '/',
  BASE + '/assets/css/custom.css',
  BASE + '/assets/js/favorites.js',
  BASE + '/assets/js/resources.js',
  BASE + '/assets/js/lib/filter-resources.js',
  BASE + '/offline.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('api.github.com')) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match(BASE + '/offline.html');
      });
    })
  );
});
