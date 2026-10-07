const CACHE_VERSION = "bill-beacon-v2.0-notification-inbox";
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
          .filter((cacheName) => cacheName.startsWith("bill-beacon-v") && cacheName !== CACHE_NAME)
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

const BADGE_STATE_CACHE = "bill-beacon-badge-state";
const BADGE_STATE_URL = new URL("__badge_state__", self.registration.scope).href;
let badgeTask = Promise.resolve();
function reconcileBadge(message) {
  badgeTask = badgeTask.catch(() => {}).then(async () => {
    if (!Number.isInteger(message.count) || message.count < 0 || !Number.isFinite(message.observedAt)) return;
    const cache = await caches.open(BADGE_STATE_CACHE);
    const saved = await cache.match(BADGE_STATE_URL);
    const state = saved ? await saved.json() : null;
    if (!message.foreground && state && state.householdId !== message.householdId) return;
    if (state && message.observedAt < state.observedAt) return;
    await cache.put(BADGE_STATE_URL, new Response(JSON.stringify(message), {headers: {"content-type": "application/json"}}));
    await setHomeScreenBadge(message.count);
  });
  return badgeTask;
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
        householdId: payload.householdId || null,
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

  const badgePromise = Number.isInteger(payload.unreadCount) && payload.unreadCount >= 0
    ? reconcileBadge({count: payload.unreadCount, householdId: payload.householdId || null,
        observedAt: payload.badgeObservedAt}) : Promise.resolve();

  event.waitUntil(
    Promise.all([
      displayNotificationPromise,
      badgePromise
    ])
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const data = event.notification.data || {};
    let url;
    try { url = new URL(data.url || "./", self.registration.scope); }
    catch { url = new URL("./", self.registration.scope); }
    const scope = new URL(self.registration.scope);
    if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) url = new URL("./", scope);
    if (data.notificationId) url.searchParams.set("notificationId", data.notificationId);
    if (data.householdId) url.searchParams.set("householdId", data.householdId);
    const windows = await self.clients.matchAll({type: "window", includeUncontrolled: true});
    for (const client of windows) {
      const current = new URL(client.url);
      if (current.origin === scope.origin && current.pathname.startsWith(scope.pathname) && "navigate" in client) {
        client.postMessage({type: "BILL_BEACON_NOTIFICATION_CLICK", url: url.href});
        await client.focus();
        return;
      }
    }
    await self.clients.openWindow(url.href);
    // A tap alone is not a successful Firestore read. The app reconciles afterwards.
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
  if (event.data?.type === "BILL_BEACON_BADGE" && event.source?.url) {
    const source = new URL(event.source.url), scope = new URL(self.registration.scope);
    if (source.origin === scope.origin && source.pathname.startsWith(scope.pathname))
      event.waitUntil(reconcileBadge({...event.data, foreground: true}));
  }
});
