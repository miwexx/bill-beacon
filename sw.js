self.addEventListener("push", (event) => {
  let payload = {
    title: "Bill Beacon",
    body: "You have a bill reminder.",
    url: "/"
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Bill Beacon", {
      body: payload.body || "You have a bill reminder.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: {
        url: payload.url || "/"
      },
      tag: "bill-beacon-reminder",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const targetUrl = event.notification?.data?.url || "/";

      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});