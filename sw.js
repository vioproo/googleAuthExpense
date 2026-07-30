const CACHE_NAME = "liquid-spend-v2";

// Install — immediate skip waiting
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

// Activate — clear all old cache storage
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network first, fallback to cache
self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
