const CACHE_VERSION = "bill-beacon-v8";
const CACHE_NAME = CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/firebase-auth.js",
  "./js/firebase-sync.js",
  "./manifest.json",
  "./icons/bill-beacon-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  // Download and activate the new service worker immediately.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );

  // Let the new worker control all currently open Bill Beacon tabs/apps.
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const requestUrl = new URL(event.request.url);
        const isSameOrigin = requestUrl.origin === self.location.origin;
        const isCacheable = isSameOrigin && networkResponse.ok;

        if (isCacheable) {
          const responseCopy = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
        }

        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          const requestUrl = new URL(event.request.url);
          const isNavigationRequest = event.request.mode === "navigate";
          const isSameOrigin = requestUrl.origin === self.location.origin;

          if (isNavigationRequest && isSameOrigin) {
            return caches.match("./index.html");
          }

          return Response.error();
        })
      )
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});