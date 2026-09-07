const CACHE_VERSION = "bill-beacon-v6.6";
const CACHE_NAME = CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/bill-reminder-test-ui.js",
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

self.addEventListener("push", (event) => {
  let payload = {
    title: "Bill Beacon",
    body: "You have a new bill reminder.",
    url: "./"
  };

  try {
    if (event.data) {
      const receivedPayload = event.data.json();

      payload = {
        ...payload,
        ...receivedPayload
      };
    }
  } catch (error) {
    console.warn("Could not read Bill Beacon push payload:", error);

    if (event.data) {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "./icons/bill-beacon-icon.png",
      badge: "./icons/bill-beacon-icon.png",
      tag: "bill-beacon-reminder",
      renotify: true,
      data: {
        url: payload.url || "./"
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "./",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});