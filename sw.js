const CACHE_VERSION = "bill-beacon-v8.9.8";
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
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );

  self.clients.claim();
});

/*
 * Intentionally no fetch event handler.
 *
 * Cloudflare Pages serves the current app files directly from the network.
 * This avoids intercepting Firebase authentication, Firestore sync, or the
 * separate notification Worker API during notification subscription setup.
 */

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
        if (
          client.url === targetUrl &&
          "focus" in client
        ) {
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