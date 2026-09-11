import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";
import { buildPushHTTPRequest } from "@pushforge/builder";

const APP_ORIGIN = "https://bill-beacon.pages.dev";
const FIREBASE_PROJECT_ID = "bill-beacon-1646c";
const FIREBASE_ISSUER =
  `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

const FIRESTORE_SCOPE =
  "https://www.googleapis.com/auth/datastore";

const FIRESTORE_DOCUMENT_BASE =
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const FIRESTORE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const DEFAULT_TIME_ZONE = "America/New_York";
const REMINDER_PREFIX = "reminders:";
const SUBSCRIPTION_PREFIX = "subscriptions:";
const CRON_STATUS_KEY = "system:last-cron-run";

const firebaseKeys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

function isAllowedOrigin(origin) {
  if (!origin) return false;

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
      adminContact: env.VAPID_SUBJECT,
      options: {
        ttl: 60,
        urgency: "normal"
      }
    }
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");

    const error = new Error(
      `Push service rejected the notification (${response.status}): ${errorBody}`
    );

    error.status = response.status;
    error.body = errorBody;

    throw error;
  }
}

async function healthStorageCheck(env) {
  const key = `healthcheck:${crypto.randomUUID()}`;

  await env.NOTIFICATIONS_KV.put(
    key,
    JSON.stringify({
      checkedAt: new Date().toISOString()
    }),
    {
      expirationTtl: 60
    }
  );

  const stored = await env.NOTIFICATIONSKV.get(key, "json");

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

      return `${SUBSCRIPTION_PREFIX}${uid}:${hash}`;
    });
}

function createReminderId(uid, billId, dueDateKey, offsetDays) {
  return [
    REMINDER_PREFIX,
    uid,
    ":",
    billId,
    ":",
    dueDateKey,
    ":",
    offsetDays
  ].join("");
}

function buildNotificationUrl({
  billId,
  installmentPlanId,
  dueDateKey
}) {
  const params = new URLSearchParams();

  params.set(
    "notification",
    installmentPlanId ? "payment-plan" : "bill"
  );

  params.set("billId", billId);

  if (installmentPlanId) {
    params.set("planId", installmentPlanId);
  }

  if (dueDateKey) {
    params.set("dueDate", dueDateKey);
  }

  return `/?${params.toString()}`;
}

function buildBillDeepLink(billId) {
  return buildNotificationUrl({ billId });
}

function getDatePartsInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day)
  };
}

function dateKeyFromParts({ year, month, day }) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}

function dateKeyInTimeZone(value, timeZone) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return dateKeyFromParts(getDatePartsInTimeZone(date, timeZone));
}

function utcMiddayFromDateKey(dateKey) {
  const [year, month, day] = String(dateKey)
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function addDaysToDateKey(dateKey, days) {
  const date = utcMiddayFromDateKey(dateKey);

  if (!date) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() + Number(days || 0));

  return [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function formatDateKey(dateKey) {
  const date = utcMiddayFromDateKey(dateKey);

  if (!date) {
    return dateKey;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function formatAmount(amount, currency = "USD") {
  const number = Number(amount);

  if (!Number.isFinite(number)) {
    return "";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(number);
  } catch {
    return `$${number.toFixed(2)}`;
  }
}

function normalizeReminderOffsets(offsets) {
  if (!Array.isArray(offsets)) {
    return [];
  }

  return [...new Set(
    offsets
      .map((value) => Number(value))
      .filter((value) =>
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 365
      )
  )].sort((a, b) => b - a);
}

function isActiveBill(bill) {
  if (!bill || typeof bill !== "object") {
    return false;
  }

  return !(
    bill.archived ||
    bill.cancelled ||
    bill.status === "cancelled" ||
    bill.status === "paid-in-full" ||
    bill.status === "paidInFull"
  );
}

function isRecurringBill(bill) {
  return Boolean(
    bill &&
    bill.recurrence &&
    bill.recurrence !== "None"
  );
}

function getMonthlyDueDay(bill, timeZone) {
  const configuredDay = Number(bill?.dueDay);

  if (
    Number.isInteger(configuredDay) &&
    configuredDay >= 1 &&
    configuredDay <= 31
  ) {
    return configuredDay;
  }

  const dueDateKey = dateKeyInTimeZone(bill?.dueDate, timeZone);
  const day = Number(dueDateKey.split("-")[2]);

  return Number.isInteger(day) && day >= 1 ? day : null;
}

function makeDateKey(year, month, day) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}

function daysInMonth(year, zeroBasedMonth) {
  return new Date(Date.UTC(year, zeroBasedMonth + 1, 0))
    .getUTCDate();
}

function getMonthlyOccurrenceDateKey(
  bill,
  year,
  zeroBasedMonth,
  timeZone
) {
  const configuredDay = getMonthlyDueDay(bill, timeZone);

  if (!configuredDay) {
    return "";
  }

  return makeDateKey(
    year,
    zeroBasedMonth + 1,
    Math.min(configuredDay, daysInMonth(year, zeroBasedMonth))
  );
}

function recurrenceIntervalMonths(recurrence) {
  if (recurrence === "Quarterly") return 3;
  if (recurrence === "Yearly") return 12;
  return 0;
}

function getOccurrenceOriginalDueDateKeysForMonth(
  bill,
  targetYear,
  targetZeroBasedMonth,
  timeZone
) {
  if (!isRecurringBill(bill)) {
    const key = dateKeyInTimeZone(bill?.dueDate, timeZone);
    return key ? [key] : [];
  }

  const initialKey = dateKeyInTimeZone(bill?.dueDate, timeZone);

  if (!initialKey) {
    return [];
  }

  const [initialYear, initialMonth, initialDay] = initialKey
    .split("-")
    .map(Number);

  if (bill.recurrence === "Weekly") {
    const start = utcMiddayFromDateKey(
      makeDateKey(targetYear, targetZeroBasedMonth + 1, 1)
    );

    const end = utcMiddayFromDateKey(
      makeDateKey(
        targetYear,
        targetZeroBasedMonth + 1,
        daysInMonth(targetYear, targetZeroBasedMonth)
      )
    );

    const candidate = utcMiddayFromDateKey(initialKey);

    while (candidate < start) {
      candidate.setUTCDate(candidate.getUTCDate() + 7);
    }

    const results = [];

    while (candidate <= end) {
      results.push(
        makeDateKey(
          candidate.getUTCFullYear(),
          candidate.getUTCMonth() + 1,
          candidate.getUTCDate()
        )
      );

      candidate.setUTCDate(candidate.getUTCDate() + 7);
    }

    return results;
  }

  if (bill.recurrence === "Monthly") {
    if (
      targetYear < initialYear ||
      (
        targetYear === initialYear &&
        targetZeroBasedMonth < initialMonth - 1
      )
    ) {
      return [];
    }

    return [
      getMonthlyOccurrenceDateKey(
        bill,
        targetYear,
        targetZeroBasedMonth,
        timeZone
      )
    ].filter(Boolean);
  }

  const interval = recurrenceIntervalMonths(bill.recurrence);

  if (!interval) {
    return [];
  }

  const initialZeroBasedMonth = initialMonth - 1;

  const monthsSinceInitial =
    (targetYear - initialYear) * 12 +
    (targetZeroBasedMonth - initialZeroBasedMonth);

  if (monthsSinceInitial < 0 || monthsSinceInitial % interval !== 0) {
    return [];
  }

  const dueDay = Math.min(
    initialDay,
    daysInMonth(targetYear, targetZeroBasedMonth)
  );

  return [
    makeDateKey(
      targetYear,
      targetZeroBasedMonth + 1,
      dueDay
    )
  ];
}

function getOccurrenceOverride(bill, originalDueDateKey, timeZone) {
  const overrides = Array.isArray(bill?.occurrenceOverrides)
    ? bill.occurrenceOverrides
    : [];

  return overrides.find((override) => {
    return (
      dateKeyInTimeZone(
        override?.originalDueDate,
        timeZone
      ) === originalDueDateKey
    );
  }) || null;
}

function getEffectiveOccurrence(bill, originalDueDateKey, timeZone) {
  const override = getOccurrenceOverride(
    bill,
    originalDueDateKey,
    timeZone
  );

  if (override?.cancelled) {
    return null;
  }

  const effectiveDueDateKey =
    dateKeyInTimeZone(override?.postponedTo, timeZone) ||
    originalDueDateKey;

  return {
    originalDueDateKey,
    dueDateKey: effectiveDueDateKey
  };
}

function getOccurrenceForDueDateKey(bill, dueDateKey, timeZone) {
  const [year, month] = dueDateKey.split("-").map(Number);

  if (!year || !month) {
    return null;
  }

  const monthOffsets = [-1, 0, 1];

  for (const monthOffset of monthOffsets) {
    const monthDate = new Date(
      Date.UTC(year, month - 1 + monthOffset, 1, 12, 0, 0)
    );

    const possibleOriginalDates =
      getOccurrenceOriginalDueDateKeysForMonth(
        bill,
        monthDate.getUTCFullYear(),
        monthDate.getUTCMonth(),
        timeZone
      );

    for (const originalDueDateKey of possibleOriginalDates) {
      const occurrence = getEffectiveOccurrence(
        bill,
        originalDueDateKey,
        timeZone
      );

      if (occurrence?.dueDateKey === dueDateKey) {
        return occurrence;
      }
    }
  }

  if (!isRecurringBill(bill)) {
    const originalDueDateKey = dateKeyInTimeZone(
      bill?.dueDate,
      timeZone
    );

    if (originalDueDateKey === dueDateKey) {
      return {
        originalDueDateKey,
        dueDateKey
      };
    }
  }

  return null;
}

function isOccurrencePaid(bill, occurrence, payments, timeZone) {
  if (!bill || !occurrence) {
    return false;
  }

  const activePayments = (Array.isArray(payments) ? payments : [])
    .filter((payment) => {
      return (
        payment &&
        payment.billId === bill.id &&
        String(payment.status || "").toLowerCase() !== "voided"
      );
    })
    .sort((a, b) => {
      return new Date(b?.paidDate || 0) -
        new Date(a?.paidDate || 0);
    });

  const exactPayment = activePayments.find((payment) => {
    return (
      dateKeyInTimeZone(
        payment?.paidForDueDate,
        timeZone
      ) === occurrence.dueDateKey
    );
  });

  if (exactPayment) {
    return true;
  }

  return activePayments.some((payment) => {
    if (payment?.paidForDueDate) {
      return false;
    }

    const paidDateKey = dateKeyInTimeZone(
      payment?.paidDate,
      timeZone
    );

    return (
      paidDateKey &&
      paidDateKey.slice(0, 7) ===
        occurrence.dueDateKey.slice(0, 7)
    );
  });
}

function buildReminderPresentation(
  bill,
  dueDateKey,
  offsetDays,
  settings,
  uid
) {
  const currency = settings?.currency || "USD";
  const amount = formatAmount(bill.amount, currency);
  const formattedDueDate = formatDateKey(dueDateKey);
  const reminderId = createReminderId(
    uid,
    bill.id,
    dueDateKey,
    offsetDays
  );

  const isPaymentPlan = Boolean(bill.installmentPlanId);
  const provider = bill.installmentProvider || "Payment Plan";
  const merchant =
    String(bill.installmentStore || "").trim() ||
    String(bill.name || "").trim() ||
    provider;

  const installmentNumber = bill.installmentNumber || 1;
  const installmentTotal = bill.installmentTotal || "?";

  let timingTitle = 'Due Soon';

if (offsetDays === 1) {
  timingTitle = 'Due Tomorrow';
} else if (offsetDays === 0) {
  timingTitle = 'Due Today';
}

  let title;
  let body;

  if (isPaymentPlan) {
    title = `Payment Plan ${timingTitle}: ${provider}`;
    body = `Payment ${installmentNumber} of ${installmentTotal} · Amount due: ${amount}`;
  } else {
    title = `${timingTitle}: ${bill.name}`;
    body = `Amount due: ${amount}`;
  }

  return {
    notificationId: reminderId,
    title,
    body,
    url: buildNotificationUrl({
      billId: bill.id,
      installmentPlanId: bill.installmentPlanId || null,
      dueDateKey
    }),
    billId: bill.id,
    installmentPlanId: bill.installmentPlanId || null,
    occurrenceDueDate: dueDateKey,
    dueDate: dueDateKey,
    offsetDays,
    kind: isPaymentPlan
      ? "payment-plan-reminder"
      : "bill-reminder",
    entityType: isPaymentPlan
      ? "payment-plan"
      : "bill"
  };
}

async function listAllKvKeys(env, prefix) {
  const keys = [];
  let cursor;

  do {
    const result = await env.NOTIFICATIONS_KV.list({
      prefix,
      cursor,
      limit: 1000
    });

    keys.push(...result.keys);
    cursor = result.list_complete ? null : result.cursor;
  } while (cursor);

  return keys;
}

async function getUserSubscriptions(env, uid) {
  const keys = await listAllKvKeys(
    env,
    `${SUBSCRIPTION_PREFIX}${uid}:`
  );

  const records = await Promise.all(
    keys.map(async (key) => {
      const record = await env.NOTIFICATIONSKV.get(key.name, "json");

      if (
        !record ||
        record.uid !== uid ||
        !isValidPushSubscription(record.subscription)
      ) {
        await env.NOTIFICATIONS_KV.delete(key.name);

        console.info("Removed malformed push subscription record.", {
          uid,
          reason: "invalid-subscription-shape"
        });

        return null;
      }

      return {
        key: key.name,
        record
      };
    })
  );

  const latestByEndpoint = new Map();

  for (const item of records.filter(Boolean)) {
    const endpoint = item.record.subscription.endpoint;
    const existing = latestByEndpoint.get(endpoint);

    const existingUpdatedAt = new Date(
      existing?.record?.updatedAt || existing?.record?.createdAt || 0
    ).getTime();

    const itemUpdatedAt = new Date(
      item.record.updatedAt || item.record.createdAt || 0
    ).getTime();

    if (!existing || itemUpdatedAt >= existingUpdatedAt) {
      if (existing) {
        await env.NOTIFICATIONS_KV.delete(existing.key);
      }

      latestByEndpoint.set(endpoint, item);
    } else {
      await env.NOTIFICATIONS_KV.delete(item.key);
    }
  }

  return [...latestByEndpoint.values()]
    .sort((a, b) => {
      const aUpdatedAt = new Date(
        a.record.updatedAt || a.record.createdAt || 0
      ).getTime();

      const bUpdatedAt = new Date(
        b.record.updatedAt || b.record.createdAt || 0
      ).getTime();

      return bUpdatedAt - aUpdatedAt;
    })
    .slice(0, 5);
}

async function getAllSubscribedUserIds(env) {
  const keys = await listAllKvKeys(env, SUBSCRIPTION_PREFIX);
  const userIds = new Set();

  for (const key of keys) {
    const remainder = key.name.slice(SUBSCRIPTION_PREFIX.length);
    const separatorIndex = remainder.indexOf(":");

    if (separatorIndex > 0) {
      userIds.add(remainder.slice(0, separatorIndex));
    }
  }

  return [...userIds];
}

function requireFirebaseServiceAccount(env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is required for scheduled reminders."
    );
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON."
    );
  }

  if (
    !serviceAccount?.client_email ||
    !serviceAccount?.private_key
  ) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON must include client_email and private_key."
    );
  }

  return serviceAccount;
}

async function getFirestoreAccessToken(env) {
  const serviceAccount = requireFirebaseServiceAccount(env);
  const issuedAt = Math.floor(Date.now() / 1000);

  const privateKey = await importPKCS8(
    serviceAccount.private_key,
    "RS256"
  );

  const assertion = await new SignJWT({
    scope: FIRESTORE_SCOPE
  })
    .setProtectedHeader({
      alg: "RS256",
      typ: "JWT"
    })
    .setIssuer(serviceAccount.client_email)
    .setSubject(serviceAccount.client_email)
    .setAudience(FIRESTORE_TOKEN_URL)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 3600)
    .sign(privateKey);

  const response = await fetch(FIRESTORE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type":
        "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type:
        "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new Error(
      `Could not obtain Firestore access token (${response.status}): ${body}`
    );
  }

  const payload = await response.json();

  if (!payload?.access_token) {
    throw new Error(
      "Firestore OAuth token response did not include access_token."
    );
  }

  return payload.access_token;
}

function firestoreValueToJs(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("bytesValue" in value) return value.bytesValue;

  if ("arrayValue" in value) {
    return (value.arrayValue.values || [])
      .map(firestoreValueToJs);
  }

  if ("mapValue" in value) {
    return firestoreFieldsToJs(
      value.mapValue.fields || {}
    );
  }

  return null;
}

function firestoreFieldsToJs(fields) {
  const result = {};

  for (const [key, value] of Object.entries(fields || {})) {
    result[key] = firestoreValueToJs(value);
  }

  return result;
}

function jsValueToFirestore(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }

    return { doubleValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(jsValueToFirestore)
      }
    };
  }

  if (typeof value === "object") {
    return {
      mapValue: {
        fields: jsObjectToFirestoreFields(value)
      }
    };
  }

  return { stringValue: String(value) };
}

function jsObjectToFirestoreFields(object) {
  const fields = {};

  for (const [key, value] of Object.entries(object || {})) {
    fields[key] = jsValueToFirestore(value);
  }

  return fields;
}

async function getHouseholdSnapshot(uid, accessToken) {
  const response = await fetch(
    `${FIRESTORE_DOCUMENT_BASE}/households/${encodeURIComponent(uid)}`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new Error(
      `Could not load household ${uid} from Firestore (${response.status}): ${body}`
    );
  }

  const document = await response.json();

  return firestoreFieldsToJs(document.fields || {});
}

async function writeNotificationInboxRecord(
  uid,
  notification,
  accessToken
) {
  const documentId = encodeURIComponent(
    notification.notificationId
  );

  const record = {
    id: notification.notificationId,
    type: notification.kind,
    entityType: notification.entityType,
    billId: notification.billId,
    installmentPlanId: notification.installmentPlanId,
    occurrenceDueDate: notification.occurrenceDueDate,
    dueDate: notification.dueDate,
    offsetDays: notification.offsetDays,
    title: notification.title,
    body: notification.body,
    url: notification.url,
    sentAt: new Date().toISOString(),
    readAt: null,
    openedAt: null
  };

  const response = await fetch(
    `${FIRESTORE_DOCUMENT_BASE}/households/${encodeURIComponent(uid)}/notifications/${documentId}`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        fields: jsObjectToFirestoreFields(record)
      })
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new Error(
      `Could not write notification inbox record (${response.status}): ${body}`
    );
  }
}

async function sendReminderToUserSubscriptions(
  env,
  uid,
  payload
) {
  const subscriptions = await getUserSubscriptions(env, uid);

  let sent = 0;
  let removed = 0;
  let failures = 0;

  for (const { key, record } of subscriptions) {
    try {
      await sendPushNotification(
        record.subscription,
        payload,
        env
      );

      sent += 1;
    } catch (error) {
      const message = String(
        error?.body || error?.message || ""
      );

      const isExpiredSubscription =
        error?.status === 404 || error?.status === 410;

      const isVapidKeyMismatch =
        error?.status === 400 &&
        message.includes("VapidPkHashMismatch");

      const isInvalidAuthSecret =
        message.includes("Incorrect auth length");

      if (
        isExpiredSubscription ||
        isVapidKeyMismatch ||
        isInvalidAuthSecret
      ) {
        await env.NOTIFICATIONS_KV.delete(key);

        removed += 1;

        console.info("Removed invalid push subscription.", {
          uid,
          status: error?.status || null,
          reason: isVapidKeyMismatch
            ? "VapidPkHashMismatch"
            : isInvalidAuthSecret
              ? "invalid-auth-secret"
              : "expired-or-gone"
        });

        continue;
      }

      failures += 1;

      console.error(
        "Push delivery failed; subscription retained for retry.",
        {
          uid,
          error: error?.message || String(error)
        }
      );
    }
  }

  return {
    subscriptionCount: subscriptions.length,
    sent,
    removed,
    failures
  };
}

async function processUserReminders(
  env,
  uid,
  accessToken,
  now
) {
  const snapshot = await getHouseholdSnapshot(uid, accessToken);

  if (!snapshot) {
    return {
      uid,
      status: "no-household",
      eligible: 0,
      sent: 0,
      skipped: 0,
      removed: 0,
      failures: 0
    };
  }

  const settings =
    snapshot.settings && typeof snapshot.settings === "object"
      ? snapshot.settings
      : {};

  const timeZone =
    typeof settings.timeZone === "string" &&
    settings.timeZone
      ? settings.timeZone
      : DEFAULT_TIME_ZONE;

  const todayKey = dateKeyInTimeZone(now, timeZone);

  const bills = Array.isArray(snapshot.bills)
    ? snapshot.bills
    : [];

  const payments = Array.isArray(snapshot.payments)
    ? snapshot.payments
    : [];

  const outcomes = {
    uid,
    status: "processed",
    eligible: 0,
    sent: 0,
    skipped: 0,
    removed: 0,
    failures: 0
  };

  for (const bill of bills) {
    if (!isActiveBill(bill) || !bill.id || !bill.name) {
      continue;
    }

    const reminderOffsets = normalizeReminderOffsets(
      bill.reminderOffsets
    );

    if (!reminderOffsets.length) {
      continue;
    }

    for (const offsetDays of reminderOffsets) {
      const dueDateKey = addDaysToDateKey(
        todayKey,
        offsetDays
      );

      const occurrence = getOccurrenceForDueDateKey(
        bill,
        dueDateKey,
        timeZone
      );

      if (!occurrence) {
        continue;
      }

      if (
        isOccurrencePaid(
          bill,
          occurrence,
          payments,
          timeZone
        )
      ) {
        continue;
      }

      outcomes.eligible += 1;

      const notification = buildReminderPresentation(
        bill,
        occurrence.dueDateKey,
        offsetDays,
        settings,
        uid
      );

      const priorSend = await env.NOTIFICATIONSKV.get(
        notification.notificationId,
        "json"
      );

      if (priorSend?.sentAt) {
        outcomes.skipped += 1;
        continue;
      }

      const delivery = await sendReminderToUserSubscriptions(
        env,
        uid,
        notification
      );

      outcomes.sent += delivery.sent;
      outcomes.removed += delivery.removed;
      outcomes.failures += delivery.failures;

      if (delivery.sent > 0) {
        await env.NOTIFICATIONS_KV.put(
          notification.notificationId,
          JSON.stringify({
            uid,
            billId: bill.id,
            dueDate: occurrence.dueDateKey,
            originalDueDate:
              occurrence.originalDueDateKey,
            offsetDays,
            sentAt: new Date().toISOString(),
            deliveryCount: delivery.sent
          }),
          {
            expirationTtl: 60 * 60 * 24 * 400
          }
        );

        try {
          await writeNotificationInboxRecord(
            uid,
            notification,
            accessToken
          );
        } catch (error) {
          console.error(
            "Push was delivered, but notification inbox history could not be written.",
            {
              uid,
              billId: bill.id,
              error: error?.message || String(error)
            }
          );
        }
      }

      if (
        delivery.sent === 0 &&
        delivery.subscriptionCount > 0 &&
        delivery.failures > 0
      ) {
        console.warn(
          "Reminder was not marked sent because delivery had temporary failures.",
          {
            uid,
            billId: bill.id,
            dueDate: occurrence.dueDateKey,
            offsetDays
          }
        );
      }
    }
  }

  return outcomes;
}

async function runScheduledBillReminders(env) {
  const startedAt = new Date();

  const summary = {
    startedAt: startedAt.toISOString(),
    source: "scheduled",
    users: 0,
    processedUsers: 0,
    noHouseholdUsers: 0,
    remindersEligible: 0,
    notificationsSent: 0,
    subscriptionsRemoved: 0,
    failures: 0
  };

  try {
    const userIds = await getAllSubscribedUserIds(env);

    summary.users = userIds.length;

    if (!userIds.length) {
      return summary;
    }

    const accessToken = await getFirestoreAccessToken(env);

    for (const uid of userIds) {
      try {
        const result = await processUserReminders(
          env,
          uid,
          accessToken,
          startedAt
        );

        if (result.status === "no-household") {
          summary.noHouseholdUsers += 1;
          continue;
        }

        summary.processedUsers += 1;
        summary.remindersEligible += result.eligible;
        summary.notificationsSent += result.sent;
        summary.subscriptionsRemoved += result.removed;
        summary.failures += result.failures;
      } catch (error) {
        summary.failures += 1;

        console.error(
          "Scheduled reminder user processing failed.",
          {
            uid,
            error: error?.message || String(error)
          }
        );
      }
    }

    return summary;
  } finally {
    summary.finishedAt = new Date().toISOString();

    await env.NOTIFICATIONS_KV.put(
      CRON_STATUS_KEY,
      JSON.stringify(summary)
    );
  }
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

      const existing = await env.NOTIFICATIONSKV.get(key, "json");

      await env.NOTIFICATIONS_KV.put(
        key,
        JSON.stringify({
          uid: authentication.user.uid,
          email: authentication.user.email,
          subscription,
          createdAt: existing?.createdAt || now,
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
        typeof body?.message === "string"
          ? body.message.trim()
          : "";

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
            title: "Payment Reminder",
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
      const lastCronRun = await env.NOTIFICATIONSKV.get(
        CRON_STATUS_KEY,
        "json"
      );

      return json(
        {
          ok: true,
          service: "bill-beacon-notifications",
          version: 3,
          storage: "kv",
          cron: {
            configured: true,
            lastRun: lastCronRun || null
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
    ctx.waitUntil(runScheduledBillReminders(env));
  }
};