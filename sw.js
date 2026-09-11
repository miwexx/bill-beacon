const CACHE_VERSION = "bill-beacon-v8.9.3";
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
        const isSameOrigin =
          requestUrl.origin === self.location.origin;
        const isCacheable =
          isSameOrigin && networkResponse.ok;

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
          const isNavigationRequest =
            event.request.mode === "navigate";
          const isSameOrigin =
            requestUrl.origin === self.location.origin;

          if (isNavigationRequest && isSameOrigin) {
            return caches.match("./index.html");
          }

          return Response.error();
        })
      )
  );
});

async function setHomeScreenBadge(count) {
  try {
    if (
      Number(count) > 0 &&
      "setAppBadge" in self.navigator
    ) {
      await self.navigator.setAppBadge(Number(count));
      return;
    }

    if (
      Number(count) <= 0 &&
      "clearAppBadge" in self.navigator
    ) {
      await self.navigator.clearAppBadge();
    }
  } catch (error) {
    console.warn(
      "Could not update Bill Beacon Home Screen badge:",
      error
    );
  }
}

self.addEventListener("push", (event) => {
  let payload = {
    title: "Bill Beacon",
    body: "You have a new bill reminder.",
    url: "./",
    notificationId: null,
    billId: null,
    installmentPlanId: null,
    occurrenceDueDate: null,
    dueDate: null,
    offsetDays: null,
    kind: "bill-reminder"
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
    console.warn(
      "Could not read Bill Beacon push payload:",
      error
    );

    if (event.data) {
      payload.body = event.data.text() || payload.body;
    }
  }

  const notificationTag =
    payload.notificationId ||
    [
      "bill-beacon",
      payload.kind || "reminder",
      payload.billId || "general",
      payload.dueDate || "undated",
      payload.offsetDays ?? "none"
    ].join(":");

  const displayNotificationPromise =
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "./icons/bill-beacon-icon.png",
      badge: "./icons/bill-beacon-icon.png",
      tag: notificationTag,
      renotify: true,
      data: {
        notificationId: payload.notificationId || null,
        billId: payload.billId || null,
        installmentPlanId:
          payload.installmentPlanId || null,
        occurrenceDueDate:
          payload.occurrenceDueDate || null,
        dueDate: payload.dueDate || null,
        offsetDays: payload.offsetDays ?? null,
        kind: payload.kind || "bill-reminder",
        url: payload.url || "./"
      }
    });

  /*
   * The Worker payload currently does not include an exact unread
   * notification total, so the safe background behavior is to show 1:
   * at least one unread Bill Beacon reminder exists.
   *
   * When the app opens, app.js can replace this with the exact
   * Firestore unread count.
   */
  const badgePromise = setHomeScreenBadge(1);

  event.waitUntil(
    Promise.all([
      displayNotificationPromise,
      badgePromise
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "./",
    self.location.origin
  ).href;

  const clearBadgePromise = setHomeScreenBadge(0);

  const openAppPromise = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true
    })
    .then(async (clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return undefined;
    });

  event.waitUntil(
    Promise.all([
      clearBadgePromise,
      openAppPromise
    ])
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});