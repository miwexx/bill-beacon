import { createRemoteJWKSet, jwtVerify } from "jose";
import { buildPushHTTPRequest } from "@pushforge/builder";

const APP_ORIGIN = "https://bill-beacon.pages.dev";
const FIREBASE_PROJECT_ID = "bill-beacon-1646c";
const FIREBASE_ISSUER =
  `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

const firebaseKeys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

function isAllowedOrigin(origin) {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);

    return (
      url.protocol === "https:" &&
      (
        url.hostname === "bill-beacon.pages.dev" ||
        url.hostname.endsWith(".bill-beacon.pages.dev")
      )
    );
  } catch {
    return false;
  }
}

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-max-age": "86400",
    vary: "Origin"
  };
}

function allowedOrigin(request) {
  const origin = request.headers.get("Origin");

  if (!origin) {
    return APP_ORIGIN;
  }

  return isAllowedOrigin(origin) ? origin : null;
}

function json(data, status = 200, origin = APP_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(origin)
    }
  });
}

async function verifyFirebaseToken(request) {
  const authorization = request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      error: "Missing Firebase authentication token."
    };
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Missing Firebase authentication token."
    };
  }

  try {
    const { payload } = await jwtVerify(token, firebaseKeys, {
      audience: FIREBASE_PROJECT_ID,
      issuer: FIREBASE_ISSUER
    });

    if (!payload.sub || typeof payload.sub !== "string") {
      return {
        ok: false,
        status: 401,
        error: "Invalid Firebase user."
      };
    }

    return {
      ok: true,
      user: {
        uid: payload.sub,
        email: typeof payload.email === "string" ? payload.email : null
      }
    };
  } catch (error) {
    console.warn("Firebase token verification failed:", error?.code);

    return {
      ok: false,
      status: 401,
      error: "Invalid or expired Firebase authentication token."
    };
  }
}

function isValidPushSubscription(subscription) {
  return Boolean(
    subscription &&
      typeof subscription === "object" &&
      typeof subscription.endpoint === "string" &&
      subscription.endpoint.startsWith("https://") &&
      subscription.keys &&
      typeof subscription.keys === "object" &&
      typeof subscription.keys.p256dh === "string" &&
      subscription.keys.p256dh.length > 0 &&
      typeof subscription.keys.auth === "string" &&
      subscription.keys.auth.length > 0
  );
}

function requireVapidConfiguration(env) {
  if (
    !env.VAPID_PUBLIC_KEY ||
    !env.VAPID_PRIVATE_KEY ||
    !env.VAPID_SUBJECT
  ) {
    throw new Error(
      "VAPID configuration is incomplete. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in Cloudflare."
    );
  }
}

async function sendPushNotification(subscription, payload, env) {
  requireVapidConfiguration(env);

  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK: JSON.parse(env.VAPID_PRIVATE_KEY),
    subscription: {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    },
    message: {
      payload,
      options: {
        ttl: 60,
        urgency: "normal"
      },
      adminContact: env.VAPID_SUBJECT
    }
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body
  });

  if (!response.ok) {
    throw new Error(
      `Push service rejected the notification (${response.status}).`
    );
  }
}

async function healthStorageCheck(env) {
  const key = `healthcheck:${crypto.randomUUID()}`;
  const value = JSON.stringify({
    checkedAt: new Date().toISOString()
  });

  await env.NOTIFICATIONS_KV.put(key, value, {
    expirationTtl: 60
  });

  const stored = await env.NOTIFICATIONS_KV.get(key, "json");

  await env.NOTIFICATIONS_KV.delete(key);

  return Boolean(stored?.checkedAt);
}

function subscriptionKey(uid, endpoint) {
  const endpointBytes = new TextEncoder().encode(endpoint);

  return crypto.subtle
    .digest("SHA-256", endpointBytes)
    .then((hashBuffer) => {
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      return `subscriptions:${uid}:${hash}`;
    });
}

function buildBillDeepLink(billId) {
  return `/?notification=bill&billId=${encodeURIComponent(billId)}`;
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request);

    if (!origin) {
      return new Response("Forbidden origin", {
        status: 403
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    const url = new URL(request.url);

    if (
      request.method === "POST" &&
      url.pathname === "/subscriptions"
    ) {
      const authentication = await verifyFirebaseToken(request);

      if (!authentication.ok) {
        return json(
          {
            ok: false,
            error: authentication.error
          },
          authentication.status,
          origin
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json(
          {
            ok: false,
            error: "Request body must be valid JSON."
          },
          400,
          origin
        );
      }

      const subscription = body?.subscription;

      if (!isValidPushSubscription(subscription)) {
        return json(
          {
            ok: false,
            error: "A valid push subscription is required."
          },
          400,
          origin
        );
      }

      const key = await subscriptionKey(
        authentication.user.uid,
        subscription.endpoint
      );

      const now = new Date().toISOString();

      await env.NOTIFICATIONS_KV.put(
        key,
        JSON.stringify({
          uid: authentication.user.uid,
          email: authentication.user.email,
          subscription,
          createdAt: now,
          updatedAt: now
        })
      );

      return json(
        {
          ok: true,
          saved: true
        },
        201,
        origin
      );
    }

    if (request.method === "POST" && url.pathname === "/test") {
      const authentication = await verifyFirebaseToken(request);

      if (!authentication.ok) {
        return json(
          {
            ok: false,
            error: authentication.error
          },
          authentication.status,
          origin
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json(
          {
            ok: false,
            error: "Request body must be valid JSON."
          },
          400,
          origin
        );
      }

      const subscription = body?.subscription;

      if (!isValidPushSubscription(subscription)) {
        return json(
          {
            ok: false,
            error: "A valid push subscription is required."
          },
          400,
          origin
        );
      }

      try {
        await sendPushNotification(
          subscription,
          {
            title: "Bill Beacon",
            body: "Test successful — notifications are working on this iPhone.",
            url: "/"
          },
          env
        );

        return json(
          {
            ok: true,
            sent: true
          },
          200,
          origin
        );
      } catch (error) {
        console.error("Test push notification failed:", error);

        return json(
          {
            ok: false,
            error:
              error?.message ||
              "The Worker could not send the test notification."
          },
          500,
          origin
        );
      }
    }

    if (
      request.method === "POST" &&
      url.pathname === "/test-bill-reminder"
    ) {
      const authentication = await verifyFirebaseToken(request);

      if (!authentication.ok) {
        return json(
          {
            ok: false,
            error: authentication.error
          },
          authentication.status,
          origin
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json(
          {
            ok: false,
            error: "Request body must be valid JSON."
          },
          400,
          origin
        );
      }

      const subscription = body?.subscription;
      const bill = body?.bill;
      const message =
        typeof body?.message === "string" ? body.message.trim() : "";

      if (!isValidPushSubscription(subscription)) {
        return json(
          {
            ok: false,
            error: "A valid push subscription is required."
          },
          400,
          origin
        );
      }

      if (
        !bill ||
        typeof bill.id !== "string" ||
        !bill.id ||
        typeof bill.name !== "string" ||
        !bill.name ||
        !Number.isFinite(Number(bill.amount)) ||
        typeof bill.dueDate !== "string" ||
        !bill.dueDate
      ) {
        return json(
          {
            ok: false,
            error: "A valid bill is required."
          },
          400,
          origin
        );
      }

      if (!message || message.length > 240) {
        return json(
          {
            ok: false,
            error: "A valid reminder message is required."
          },
          400,
          origin
        );
      }

      try {
        await sendPushNotification(
          subscription,
          {
            title: "Bill Beacon",
            body: message,
            url: buildBillDeepLink(bill.id),
            billId: bill.id,
            kind: "bill-reminder-test"
          },
          env
        );

        return json(
          {
            ok: true,
            sent: true
          },
          200,
          origin
        );
      } catch (error) {
        console.error("Bill reminder test failed:", error);

        return json(
          {
            ok: false,
            error:
              error?.message ||
              "The Worker could not send the bill reminder test."
          },
          500,
          origin
        );
      }
    }

    if (request.method === "GET" && url.pathname === "/auth/test") {
      const authentication = await verifyFirebaseToken(request);

      if (!authentication.ok) {
        return json(
          {
            ok: false,
            error: authentication.error
          },
          authentication.status,
          origin
        );
      }

      return json(
        {
          ok: true,
          user: authentication.user
        },
        200,
        origin
      );
    }

    if (request.method === "GET" && url.pathname === "/config") {
      if (!env.VAPID_PUBLIC_KEY) {
        return json(
          {
            ok: false,
            error: "VAPID public key is not configured."
          },
          503,
          origin
        );
      }

      return json(
        {
          ok: true,
          vapidPublicKey: env.VAPID_PUBLIC_KEY
        },
        200,
        origin
      );
    }

    if (request.method === "GET" && url.pathname === "/health") {
      const lastCronRun = await env.NOTIFICATIONS_KV.get(
        "system:last-cron-run",
        "json"
      );

      return json(
        {
          ok: true,
          service: "bill-beacon-notifications",
          version: 1,
          storage: "kv",
          cron: {
            configured: true,
            lastRunAt: lastCronRun?.at || null
          }
        },
        200,
        origin
      );
    }

    if (request.method === "GET" && url.pathname === "/health/storage") {
      try {
        const kvAvailable = await healthStorageCheck(env);

        return json(
          {
            ok: kvAvailable,
            service: "bill-beacon-notifications",
            storage: "kv"
          },
          kvAvailable ? 200 : 503,
          origin
        );
      } catch (error) {
        console.error("KV health check failed:", error);

        return json(
          {
            ok: false,
            error: "KV storage is unavailable."
          },
          503,
          origin
        );
      }
    }

    return json({ error: "Not found." }, 404, origin);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      env.NOTIFICATIONS_KV.put(
        "system:last-cron-run",
        JSON.stringify({
          at: new Date().toISOString(),
          source: "scheduled"
        })
      )
    );
  }
};