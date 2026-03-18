const CACHE_NAME = "markit-v1";
const STATIC_ASSETS = ["/", "/choose-market"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests, skip API calls
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/")
  ) {
    return;
  }
  event.respondWith(
    caches
      .match(event.request)
      .then(
        (cached) =>
          cached ||
          fetch(event.request).catch(() => caches.match("/"))
      )
  );
});
