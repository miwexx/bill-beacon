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


function isAllowedPushEndpoint(value) {
  if (typeof value !== "string" || value.length > 8192 || /[\u0000-\u0020\u007f]/.test(value)) return false;
  try {
    const endpoint = new URL(value);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.hash || (endpoint.port && endpoint.port !== "443")) return false;
    const host = endpoint.hostname.toLowerCase();
    return host === "fcm.googleapis.com" || host === "android.googleapis.com" ||
      host.endsWith(".push.apple.com") || host === "updates.push.services.mozilla.com" ||
      host.endsWith(".push.services.mozilla.com") || host.endsWith(".notify.windows.com");
  } catch { return false; }
}

function decodePushKey(value, expectedLength) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+={0,2}$/.test(value)) return null;
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
    if (decoded.length !== expectedLength) return null;
    return decoded;
  } catch { return null; }
}

function isValidPushSubscription(subscription) {
  if (!subscription || typeof subscription !== "object" || Array.isArray(subscription) ||
      !isAllowedPushEndpoint(subscription.endpoint) || !subscription.keys || typeof subscription.keys !== "object") return false;
  const publicKey = decodePushKey(subscription.keys.p256dh, 65);
  return Boolean(publicKey && publicKey.charCodeAt(0) === 4 && decodePushKey(subscription.keys.auth, 16));
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
  if (!isValidPushSubscription(subscription)) throw new Error("Unsupported or malformed push subscription.");
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
        ttl: 24 * 60 * 60,
        urgency: "high"
      }
    }
  });

  if (!isAllowedPushEndpoint(endpoint) || new URL(endpoint).href !== new URL(subscription.endpoint).href) {
    throw new Error("Push request destination changed unexpectedly.");
  }
    const response = await fetch(endpoint, {
    method: "POST",
    redirect: "manual",
    headers,
    body
  });

  if (!response.ok) {
    const errorBody = (await response.text().catch(() => "")).slice(0, 4096);

    const error = new Error(
      `Push service rejected the notification (${response.status}).`
    );

    error.status = response.status;
    error.body = errorBody;

    throw error;
  }
}

async function healthStorageCheck(env) {
  const key = `healthcheck:${crypto.randomUUID()}`;

  await env.NOTIFICATIONSKV.put(
    key,
    JSON.stringify({
      checkedAt: new Date().toISOString()
    }),
    {
      expirationTtl: 60
    }
  );

  const stored = await env.NOTIFICATIONSKV.get(key, "json");

  await env.NOTIFICATIONSKV.delete(key);

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
  if (!bill || typeof bill !== "object") return false;
  return !(bill.archived || bill.archivedAt || bill.cancelled || bill.cancelledAt || bill.paidInFullAt ||
    bill.status === "cancelled" || bill.status === "paid-in-full" || bill.status === "paidInFull");
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

  if (bill.recurrence === "Weekly" || bill.recurrence === "Every 2 Weeks") {
    const intervalDays = bill.recurrence === "Every 2 Weeks" ? 14 : 7;
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
      candidate.setUTCDate(candidate.getUTCDate() + intervalDays);
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

      candidate.setUTCDate(candidate.getUTCDate() + intervalDays);
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


// Calendar parity: use explicit date keys in the household time zone, then UTC arithmetic.
class ReminderCalendarDate extends Date {
  constructor(...args) { super(...(args.length > 1 ? [Date.UTC(...args)] : args)); }
}

function validatedReminderTimeZone(value) {
  const zone = typeof value === "string" && value ? value : DEFAULT_TIME_ZONE;
  try { new Intl.DateTimeFormat("en", {timeZone: zone}).format(new Date()); return zone; }
  catch { return DEFAULT_TIME_ZONE; }
}

function calendarValueForReminder(value, timeZone, field = "", depth = 0) {
  if (depth > 24) throw new Error("Calendar data is too deeply nested.");
  const dateFields = ["dueDate", "originalDueDate", "paidForDueDate", "paidDate", "voidedAt", "archivedAt", "postponedTo", "postponedAt", "capturedAt"];
  if (typeof value === "string" && dateFields.includes(field) && value) {
    const key = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : dateKeyInTimeZone(value, timeZone);
    return key ? `${key}T12:00:00.000Z` : value;
  }
  if (Array.isArray(value)) return value.map(item => calendarValueForReminder(item, timeZone, field, depth + 1));
  if (value && typeof value === "object") {
    const result = Object.create(null);
    for (const [key, item] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("Unsafe calendar data key.");
      result[key] = calendarValueForReminder(item, timeZone, key, depth + 1);
    }
    return result;
  }
  return value;
}

function getReminderOccurrencesForMonth(bill, dueDateKey, timeZone, payments = []) {
  const zone = validatedReminderTimeZone(timeZone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateKey)) return [];
  const [year, month] = dueDateKey.split("-").map(Number);
  const normalizedBill = calendarValueForReminder(bill, zone);
  const normalizedPayments = calendarValueForReminder(payments.filter(payment => payment?.billId === bill.id).map(payment => {
    const key = reminderPaymentOccurrenceDateKey(payment, zone);
    return !payment.paidForDueDate && key ? {...payment, paidForDueDate: key} : payment;
  }), zone);
  return reminderGetVersionedBillOccurrences(normalizedBill, new ReminderCalendarDate(year, month - 1, 1, 12), normalizedPayments)
    .map(occurrence => ({originalDueDateKey: reminderGetLocalDateKey(occurrence.originalDueDate || occurrence.dueDate),
      dueDateKey: reminderGetLocalDateKey(occurrence.dueDate),
      bill: {...occurrence, id: bill.id}}));
}

function allReminderOffsets(bill) {
  const schedules = [bill, ...(bill.scheduleHistory || []).map(version => version?.snapshot),
    ...(bill.occurrenceOverrides || []).map(override => override?.scheduleSnapshot)].filter(Boolean);
  return [...new Set(schedules.flatMap(schedule => normalizeReminderOffsets(schedule.reminderOffsets)))].sort((a,b)=>b-a);
}

function reminderGetMonthlyDueDay(bill) {
  const storedDay = Number(bill?.dueDay);

  if (Number.isInteger(storedDay) && storedDay >= 1 && storedDay <= 31) {
    return storedDay;
  }

  return new ReminderCalendarDate(bill.dueDate).getUTCDate();
}

function reminderGetMonthlyOccurrenceDate(bill, year, month) {
  const dueDay = reminderGetMonthlyDueDay(bill);
  const lastDay = new ReminderCalendarDate(year, month + 1, 0).getUTCDate();
  const actualDay = Math.min(dueDay, lastDay);

  return new ReminderCalendarDate(year, month, actualDay, 12).toISOString();
}

function reminderGetMonthBounds(referenceDate = new ReminderCalendarDate()) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  return {
    start: new ReminderCalendarDate(year, month, 1, 12, 0, 0),
    end: new ReminderCalendarDate(year, month + 1, 0, 12, 0, 0)
  };
}

function reminderGetMonthOccurrenceDates(bill, referenceDate = new ReminderCalendarDate()) {
  if (!bill || !reminderIsRecurringBill(bill)) return [];

  const { start, end } = reminderGetMonthBounds(referenceDate);
  const originalDueDate = new ReminderCalendarDate(bill.dueDate);

  if (Number.isNaN(originalDueDate.getTime())) return [];

  const occurrenceDates = [];

  if (bill.recurrence === 'Weekly' || bill.recurrence === 'Every 2 Weeks') {
    const intervalDays = bill.recurrence === 'Every 2 Weeks' ? 14 : 7;
    const candidate = new ReminderCalendarDate(
      originalDueDate.getUTCFullYear(),
      originalDueDate.getUTCMonth(),
      originalDueDate.getUTCDate(),
      12,
      0,
      0
    );

    while (candidate < start) {
      candidate.setUTCDate(candidate.getUTCDate() + intervalDays);
    }

    while (candidate <= end) {
      occurrenceDates.push(new ReminderCalendarDate(candidate));
      candidate.setUTCDate(candidate.getUTCDate() + intervalDays);
    }
  }

  if (bill.recurrence === 'Monthly') {
    occurrenceDates.push(
      new ReminderCalendarDate(
        reminderGetMonthlyOccurrenceDate(
          bill,
          start.getUTCFullYear(),
          start.getUTCMonth()
        )
      )
    );
  }

  if (bill.recurrence === 'Quarterly') {
    const startYear = originalDueDate.getUTCFullYear();
    const startMonth = originalDueDate.getUTCMonth();
    const targetYear = start.getUTCFullYear();
    const targetMonth = start.getUTCMonth();

    const monthsSinceStart =
      (targetYear - startYear) * 12 + (targetMonth - startMonth);

    if (monthsSinceStart >= 0 && monthsSinceStart % 3 === 0) {
      const lastDay = new ReminderCalendarDate(targetYear, targetMonth + 1, 0).getUTCDate();
      const dueDay = Math.min(originalDueDate.getUTCDate(), lastDay);

      occurrenceDates.push(
        new ReminderCalendarDate(targetYear, targetMonth, dueDay, 12, 0, 0)
      );
    }
  }

  if (bill.recurrence === 'Yearly') {
    const targetYear = start.getUTCFullYear();
    const dueMonth = originalDueDate.getUTCMonth();

    if (
      targetYear >= originalDueDate.getUTCFullYear() &&
      start.getUTCMonth() === dueMonth
    ) {
      const lastDay = new ReminderCalendarDate(targetYear, dueMonth + 1, 0).getUTCDate();
      const dueDay = Math.min(originalDueDate.getUTCDate(), lastDay);

      occurrenceDates.push(
        new ReminderCalendarDate(targetYear, dueMonth, dueDay, 12, 0, 0)
      );
    }
  }

  return occurrenceDates
    .filter(date => date >= start && date <= end)
    .map(date => date.toISOString());
}

function reminderGetOccurrenceKey(templateId, dueDate) {
  const date = new ReminderCalendarDate(dueDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${templateId}:${year}-${month}-${day}`;
}

function reminderIsRecurringBill(bill) {
  return Boolean(bill && bill.recurrence && bill.recurrence !== 'None');
}

function reminderGetRecurringTemplateId(bill) {
  if (!bill) return null;
  return bill.recurringTemplateId || bill.id;
}

function reminderCreateBillOccurrence(bill, dueDate) {
  if (!bill || !dueDate) return null;

  const normalizedDueDate = new ReminderCalendarDate(
    new ReminderCalendarDate(dueDate).getUTCFullYear(),
    new ReminderCalendarDate(dueDate).getUTCMonth(),
    new ReminderCalendarDate(dueDate).getUTCDate(),
    12,
    0,
    0
  ).toISOString();

  const templateId = reminderGetRecurringTemplateId(bill);

  const occurrenceOverrides = Array.isArray(bill.occurrenceOverrides)
    ? bill.occurrenceOverrides
    : [];

  const override = occurrenceOverrides.find(
    (item) => item.originalDueDate === normalizedDueDate
  );

  if (override?.cancelled) {
    return null;
  }

  const effectiveDueDate =
    override?.postponedTo || normalizedDueDate;

  const occurrenceKey = reminderGetOccurrenceKey(
    templateId,
    normalizedDueDate
  );

  return {
    ...bill,
    id: occurrenceKey,
    occurrenceKey,
    templateId,
    sourceBillId: bill.id,
    name: bill.name,
    amount: bill.amount,
    category: bill.category,
    dueDate: effectiveDueDate,
    originalDueDate: normalizedDueDate,
    recurrence: bill.recurrence,
    paymentMethod: bill.paymentMethod || "",
    paymentUrl: bill.paymentUrl || "",
    autopay: Boolean(bill.autopay),
    notes: bill.notes || "",
    reminderOffsets: Array.isArray(bill.reminderOffsets)
      ? [...bill.reminderOffsets]
      : [],
    isOccurrence: true,
  };
}

function reminderGetBillScheduleVersions(bill) {
  const history = Array.isArray(bill.scheduleHistory)
    ? bill.scheduleHistory.filter(v => v && v.snapshot)
    : [];
  if (!history.length) return [{effectiveFrom: null, snapshot: bill}];
  return history.map((v, index) => ({...v, index})).sort((a, b) =>
    String(a.effectiveFrom || "").localeCompare(String(b.effectiveFrom || "")) ||
    a.index - b.index
  );
}

function reminderGetBillScheduleAtDate(bill, dateValue) {
  const key = reminderGetLocalDateKey(dateValue);
  const versions = reminderGetBillScheduleVersions(bill);
  let selected = versions[0];
  for (const version of versions) {
    if (!version.effectiveFrom || version.effectiveFrom <= key) selected = version;
  }
  return {...bill, ...selected.snapshot, id: bill.id};
}

function reminderGetCalendarScheduleSlot(recurrence, dateValue, anchorValue = dateValue) {
  const date = new ReminderCalendarDate(dateValue);
  if (recurrence === "Every 2 Weeks") {
    const anchor = new ReminderCalendarDate(anchorValue);
    const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const origin = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate());
    return `fortnight:${Math.floor((day - origin) / (14 * 86400000))}`;
  }
  if (recurrence === "Weekly") {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    return `week:${reminderGetLocalDateKey(date)}`;
  }
  if (recurrence === "Yearly") return `year:${date.getUTCFullYear()}`;
  if (recurrence === "Quarterly") return `quarter:${date.getUTCFullYear()}-${Math.floor(date.getUTCMonth() / 3)}`;
  return `month:${date.getUTCFullYear()}-${date.getUTCMonth()}`;
}

function reminderGetVersionedBillOccurrences(bill, referenceDate, paymentRecords = []) {
  const monthKey = value => {
    const date = new ReminderCalendarDate(value);
    return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
  };
  const targetMonth = monthKey(referenceDate);
  const versions = reminderGetBillScheduleVersions(bill);
  const calendarScheduleSlot = (recurrence, value) => reminderGetCalendarScheduleSlot(
    recurrence, value, versions[0]?.snapshot?.dueDate || bill.dueDate
  );
  const candidates = new Map();
  const payments = [...paymentRecords.filter(payment => payment.billId === bill.id)].sort((a, b) =>
    Number(a.status !== "voided") - Number(b.status !== "voided") ||
    new ReminderCalendarDate(a.paidDate) - new ReminderCalendarDate(b.paidDate)
  );
  const hasVersions = versions.length > 1;
  const archiveKey = bill.archivedAt ? reminderGetLocalDateKey(bill.archivedAt) : null;

  const addScheduled = (versionIndex, originalDueDate) => {
    const version = versions[versionIndex];
    const key = reminderGetLocalDateKey(originalDueDate);
    const next = versions[versionIndex + 1];
    if (!key) return;
    const explicitOverride = (bill.occurrenceOverrides || []).find(item =>
      reminderGetLocalDateKey(item.originalDueDate) === key && !item.cancelled && item.postponedTo
    );
    if (!explicitOverride) {
      if (version.effectiveFrom && key < version.effectiveFrom) return;
      if (next?.effectiveFrom && key >= next.effectiveFrom) return;
    } else {
      const recordedKey = explicitOverride.postponedAt
        ? reminderGetLocalDateKey(explicitOverride.postponedAt) : key;
      let owner = 0;
      versions.forEach((item, index) => {
        if (!item.effectiveFrom || item.effectiveFrom <= recordedKey) owner = index;
      });
      if (owner !== versionIndex) return;
    }
    if (archiveKey && key >= archiveKey) return;
    const schedule = {...bill, ...version.snapshot, id: bill.id};
    const occurrence = reminderCreateBillOccurrence(schedule, originalDueDate);
    if (!occurrence || monthKey(occurrence.dueDate) !== targetMonth) return;
    const slot = calendarScheduleSlot(schedule.recurrence, originalDueDate);
    if (hasVersions) {
      const priorObligation = versions.slice(0, versionIndex).some((prior, priorIndex) => {
        const priorSchedule = {...bill, ...prior.snapshot, id: bill.id};
        if (!reminderIsRecurringBill(priorSchedule)) return false;
        const priorEnd = versions[priorIndex + 1]?.effectiveFrom;
        const date = new ReminderCalendarDate(originalDueDate);
        const offsets = schedule.recurrence === "Yearly" ? Array.from({length: 12}, (_, i) => -i)
          : schedule.recurrence === "Quarterly" ? [0, -1, -2] : [0, -1];
        return offsets.some(offset => reminderGetMonthOccurrenceDates(priorSchedule,
          new ReminderCalendarDate(date.getUTCFullYear(), date.getUTCMonth() + offset, 1, 12)
        ).some(value => {
          const key = reminderGetLocalDateKey(value);
          return (!prior.effectiveFrom || key >= prior.effectiveFrom) &&
            (!priorEnd || key < priorEnd) &&
            calendarScheduleSlot(priorSchedule.recurrence, value) === slot;
        }));
      });
      if (priorObligation) return;
      const recordedElsewhere = payments.some(payment => {
        if (!payment.paidForDueDate) return false;
        const original = payment.originalDueDate || payment.paidForDueDate;
        const recurrence = payment.billSnapshot?.recurrence || schedule.recurrence;
        return calendarScheduleSlot(recurrence, original) === slot &&
          reminderGetLocalDateKey(payment.paidForDueDate) !== reminderGetLocalDateKey(occurrence.dueDate);
      });
      if (recordedElsewhere) return;
      const pinnedElsewhere = (bill.occurrenceOverrides || []).some(item => {
        if (item.cancelled || !item.postponedTo || !item.originalDueDate) return false;
        const recordedKey = item.postponedAt ? reminderGetLocalDateKey(item.postponedAt) : reminderGetLocalDateKey(item.originalDueDate);
        let owner = 0;
        versions.forEach((v, i) => {
          if (!v.effectiveFrom || v.effectiveFrom <= recordedKey) owner = i;
        });
        return (owner < versionIndex || (item.scheduleSnapshot &&
          reminderGetLocalDateKey(item.originalDueDate) !== reminderGetLocalDateKey(originalDueDate))) &&
          calendarScheduleSlot(item.scheduleSnapshot?.recurrence || versions[owner].snapshot.recurrence, item.originalDueDate) === slot;
      });
      if (pinnedElsewhere) return;
    }
    const earlier = [...candidates.values()].find(item => item.scheduleSlot === slot);
    // Preserve the old obligation when its date predates a mid-period edit.
    if (hasVersions && earlier && earlier.scheduleVersionIndex < versionIndex) return;
    candidates.set(occurrence.occurrenceKey, {
      ...occurrence,
      scheduleSlot: slot,
      scheduleVersionIndex: versionIndex,
      isArchivedHistory: Boolean(bill.archivedAt)
    });
  };

  versions.forEach((version, index) => {
    const schedule = {...bill, ...version.snapshot, id: bill.id};
    if (!reminderIsRecurringBill(schedule)) {
      if (schedule.dueDate) addScheduled(index, schedule.dueDate);
      return;
    }
    reminderGetMonthOccurrenceDates(schedule, referenceDate).forEach(date => addScheduled(index, date));
    // Include an occurrence moved here from another month, even years earlier.
    for (const override of bill.occurrenceOverrides || []) {
      if (!override.originalDueDate || !override.postponedTo || override.cancelled) continue;
      if (monthKey(override.postponedTo) !== targetMonth) continue;
      const sourceMonth = new ReminderCalendarDate(override.originalDueDate);
      const scheduled = reminderGetMonthOccurrenceDates(schedule, sourceMonth).some(date =>
        reminderGetLocalDateKey(date) === reminderGetLocalDateKey(override.originalDueDate)
      );
      if (scheduled) addScheduled(index, override.originalDueDate);
    }
  });

  for (const override of bill.occurrenceOverrides || []) {
    if (override.cancelled || !override.scheduleSnapshot || !override.postponedTo) continue;
    if (monthKey(override.postponedTo) !== targetMonth) continue;
    if (archiveKey && reminderGetLocalDateKey(override.postponedTo) >= archiveKey) continue;
    const schedule = {...bill, ...override.scheduleSnapshot, id: bill.id};
    const occurrence = reminderCreateBillOccurrence(schedule, override.originalDueDate);
    if (!occurrence) continue;
    const slot = calendarScheduleSlot(schedule.recurrence, override.originalDueDate);
    for (const [key, candidate] of candidates) {
      if (candidate.scheduleSlot === slot && candidate.occurrenceKey !== occurrence.occurrenceKey) candidates.delete(key);
    }
    candidates.set(occurrence.occurrenceKey, {...occurrence, scheduleSlot: slot,
      isArchivedHistory: Boolean(bill.archivedAt)});
  }

  // A recorded occurrence keeps its date even if a later edit moved the template.
  // Voided records also anchor the obligation, so reversal restores the same bill.
  for (const payment of payments) {
    const dueDate = payment.paidForDueDate;
    if (!dueDate || monthKey(dueDate) !== targetMonth) continue;
    const matched = [...candidates.values()].find(item =>
      reminderGetLocalDateKey(item.dueDate) === reminderGetLocalDateKey(dueDate)
    );
    const recordedAt = [payment.billSnapshot?.capturedAt, payment.paidDate, payment.originalDueDate || dueDate]
      .filter(value => value && !Number.isNaN(new ReminderCalendarDate(value).getTime())).sort()[0] || dueDate;
    const schedule = reminderGetBillScheduleAtDate(bill, recordedAt);
    const snapshot = payment.billSnapshot || {};
    const recurrence = snapshot.recurrence || schedule.recurrence;
    if (!reminderIsRecurringBill({recurrence}) && !hasVersions && !matched) continue;
    const originalDueDate = payment.originalDueDate || matched?.originalDueDate || dueDate;
    const slot = calendarScheduleSlot(recurrence, originalDueDate);
    if (hasVersions) {
      for (const [candidateKey, candidate] of candidates) {
        if (candidate.scheduleSlot === slot &&
            reminderGetLocalDateKey(candidate.dueDate) !== reminderGetLocalDateKey(dueDate)) {
          candidates.delete(candidateKey);
        }
      }
    }
    const occurrenceKey = matched?.occurrenceKey || reminderGetOccurrenceKey(bill.id, originalDueDate);
    const expected = snapshot.amount ?? payment.expectedAmountAtMatch ??
      matched?.amount ?? payment.amount;
    candidates.set(occurrenceKey, {
      ...schedule,
      ...(matched || {}),
      ...snapshot,
      id: occurrenceKey,
      occurrenceKey,
      templateId: reminderGetRecurringTemplateId(bill),
      sourceBillId: bill.id,
      dueDate,
      originalDueDate,
      amount: Number(expected),
      recurrence,
      isOccurrence: true,
      scheduleSlot: slot,
      isArchivedHistory: Boolean(bill.archivedAt)
    });
  }
  return [...candidates.values()].sort((a, b) => new ReminderCalendarDate(a.dueDate) - new ReminderCalendarDate(b.dueDate));
}

function reminderGetLocalDateKey(value) {
  const date = new ReminderCalendarDate(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getOccurrenceForDueDateKey(bill, dueDateKey, timeZone, payments = []) {
  return getReminderOccurrencesForMonth(bill, dueDateKey, timeZone, payments)
    .find(occurrence => occurrence.dueDateKey === dueDateKey) || null;
}



// Exact payment links only. Ambiguous legacy payments are held for review.
function reminderFinancialDateKey(value, timeZone) {
  if (typeof value !== "string" || !value.trim()) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day ? value : "";
  }
  return dateKeyInTimeZone(value, timeZone);
}

function reminderPaymentOccurrenceDateKey(payment, timeZone) {
  return reminderFinancialDateKey(payment?.paidForDueDate || payment?.billSnapshot?.dueDate, timeZone);
}

function hasUnlinkedPaymentForReminderMonth(bill, occurrence, payments, timeZone) {
  return (Array.isArray(payments) ? payments : []).some(payment => {
    if (!payment || payment.billId !== bill.id || String(payment.status || "active").toLowerCase() === "voided" ||
        reminderPaymentOccurrenceDateKey(payment, timeZone)) return false;
    const paidKey = reminderFinancialDateKey(payment.paidDate, timeZone);
    return !paidKey || paidKey.slice(0, 7) === occurrence.dueDateKey.slice(0, 7);
  });
}

function isOccurrencePaid(bill, occurrence, payments, timeZone) {
  if (!bill || !occurrence) return false;
  return (Array.isArray(payments) ? payments : []).some(payment =>
    payment && payment.billId === bill.id &&
    String(payment.status || "active").toLowerCase() !== "voided" &&
    reminderPaymentOccurrenceDateKey(payment, timeZone) === occurrence.dueDateKey
  );
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
    const result = await env.NOTIFICATIONSKV.list({
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
        console.info("Skipped unsupported or malformed push subscription record.", {
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
        await env.NOTIFICATIONSKV.delete(existing.key);
      }

      latestByEndpoint.set(endpoint, item);
    } else {
      await env.NOTIFICATIONSKV.delete(item.key);
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
async function getUserProfile(uid, accessToken) {
  const response = await fetch(
    `${FIRESTORE_DOCUMENT_BASE}/users/${encodeURIComponent(uid)}`,
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
      `Could not load user profile ${uid} from Firestore: ` +
      `${response.status} ${body}`
    );
  }

  const document = await response.json();

  return firestoreFieldsToJs(document.fields || {});
}

async function getHouseholdSnapshot(householdId, accessToken) {
  const response = await fetch(
    `${FIRESTORE_DOCUMENT_BASE}/households/${encodeURIComponent(
      householdId
    )}`,
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
      `Could not load household ${householdId} from Firestore: ` +
      `${response.status} ${body}`
    );
  }

  const document = await response.json();

  return firestoreFieldsToJs(document.fields || {});
}
async function writeNotificationInboxRecord(
  householdId,
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
    deliveryState: "pending",
    readAt: null,
    openedAt: null
  };

  const response = await fetch(
    `${FIRESTORE_DOCUMENT_BASE}/households/${encodeURIComponent(householdId)}/notifications/${documentId}?currentDocument.exists=false`,
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

  if (response.status === 409 || response.status === 412) return;
  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new Error(
      `Could not write notification inbox record (${response.status}): ${body}`
    );
  }
}
async function markInboxDelivered(householdId, notificationId, accessToken) {
  const url = new URL(`${FIRESTORE_DOCUMENT_BASE}/households/${encodeURIComponent(householdId)}/notifications/${encodeURIComponent(notificationId)}`);
  url.searchParams.append("updateMask.fieldPaths", "deliveryState");
  url.searchParams.append("updateMask.fieldPaths", "deliveredAt");
  url.searchParams.set("currentDocument.exists", "true");
  const response = await fetch(url, {method: "PATCH", headers: {
    authorization: `Bearer ${accessToken}`, "content-type": "application/json"
  }, body: JSON.stringify({fields: jsObjectToFirestoreFields({deliveryState: "delivered", deliveredAt: new Date().toISOString()})})});
  if (!response.ok) throw new Error(`Could not record push delivery (${response.status}).`);
}
async function getHouseholdUnreadCount(householdId, accessToken) {
  let count = 0, pageToken = "";
  do {
    const url = new URL(`${FIRESTORE_DOCUMENT_BASE}/households/${encodeURIComponent(householdId)}/notifications`);
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, {headers: {authorization: `Bearer ${accessToken}`}});
    if (!response.ok) throw new Error(`Unread count failed (${response.status}).`);
    const result = await response.json();
    for (const document of result.documents || []) {
      const data = firestoreFieldsToJs(document.fields || {});
      if (!data.readAt && !data.clearedAt) count += 1;
    }
    pageToken = result.nextPageToken || "";
  } while (pageToken);
  return count;
}
async function prepareInboxPush(householdId, notification, accessToken) {
  notification.householdId = householdId;
  const link = new URL(notification.url || "/", APP_ORIGIN);
  link.searchParams.set("notificationId", notification.notificationId);
  link.searchParams.set("householdId", householdId);
  notification.url = link.pathname + link.search;
  await writeNotificationInboxRecord(householdId, notification, accessToken);
  try {
    const observedAt = Date.now();
    notification.unreadCount = await getHouseholdUnreadCount(householdId, accessToken);
    notification.badgeObservedAt = observedAt;
  } catch (error) {
    // Inbox creation succeeded; a count outage must not suppress the reminder.
    console.warn("Badge count unavailable:", error.message);
  }
  return notification;
}
const HOUSEHOLD_INVITE_PREFIX = "household-invite:";
const HOUSEHOLD_INVITE_TTL_SECONDS = 60 * 60 * 24 * 7;

function inviteKey(tokenHash) {
  return `${HOUSEHOLD_INVITE_PREFIX}${tokenHash}`;
}

function createInviteToken() {
  const bytes = new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    bytes
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getFirestoreDocument(path, accessToken) {
  const response = await fetch(
    `${FIRESTORE_DOCUMENT_BASE}/${path}`,
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
      `Could not load Firestore document ${path}: ` +
      `${response.status} ${body}`
    );
  }

  const document = await response.json();

  return firestoreFieldsToJs(document.fields || {});
}

async function writeFirestoreDocument(
  path,
  data,
  accessToken
) {
  const response = await fetch(
    `${FIRESTORE_DOCUMENT_BASE}/${path}`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        fields: jsObjectToFirestoreFields(data)
      })
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    throw new Error(
      `Could not write Firestore document ${path}: ` +
      `${response.status} ${body}`
    );
  }
}
async function getHouseholdMember(
  householdId,
  uid,
  accessToken
) {
  return getFirestoreDocument(
    `households/${encodeURIComponent(
      householdId
    )}/members/${encodeURIComponent(uid)}`,
    accessToken
  );
}

async function requireHouseholdOwner(
  uid,
  accessToken
) {
  const profile = await getUserProfile(uid, accessToken);

  const householdId =
    typeof profile?.householdId === "string"
      ? profile.householdId.trim()
      : "";

  if (!householdId) {
    throw new Error(
      "Your account is not connected to a household."
    );
  }

  const member = await getHouseholdMember(
    householdId,
    uid,
    accessToken
  );

  if (member?.role !== "owner") {
    throw new Error(
      "Only the household owner can create an invite."
    );
  }

  return {
    householdId,
    profile,
    member
  };
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
        await env.NOTIFICATIONSKV.delete(key);

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
async function processUserReminders(env, uid, accessToken, now) {
  const profile = await getUserProfile(uid, accessToken);

  const householdId =
    typeof profile?.householdId === "string"
      ? profile.householdId.trim()
      : "";

  if (!householdId) {
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

  const membership = await getHouseholdMember(householdId, uid, accessToken);
  if (!membership || !["owner", "member"].includes(membership.role) || (membership.uid && membership.uid !== uid)) {
    return {uid, householdId, status: "no-household", reason: "no-valid-membership", eligible: 0, sent: 0, skipped: 0, removed: 0, failures: 0};
  }

  const snapshot = await getHouseholdSnapshot(
    householdId,
    accessToken
  );

  if (!snapshot) {
    return {
      uid,
      householdId,
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

  const timeZone = validatedReminderTimeZone(settings.timeZone);

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
    reviewRequired: 0,
    eligible: 0,
    sent: 0,
    skipped: 0,
    noSubscriptions: 0,
    removed: 0,
    failures: 0
  };

  for (const bill of bills) {
        if (bill.name === "Test 3") {
      const occurrence = getOccurrenceForDueDateKey(
        bill,
        todayKey,
        timeZone,
        payments
      );

      const reminderId = createReminderId(
        uid,
        bill.id,
        todayKey,
        0
      );

      const priorSend = await env.NOTIFICATIONSKV.get(
        reminderId,
        "json"
      );

      console.info("Test 3 reminder diagnostic", {
        billId: bill.id,
        householdId,
        todayKey,
        timeZone,
        savedDueDate: bill.dueDate,
        savedReminderOffsets: bill.reminderOffsets,
        active: isActiveBill(bill),
        occurrenceFound: Boolean(occurrence),

        occurrenceReminderOffsets:
          occurrence?.bill?.reminderOffsets || [],

        occurrencePaid: occurrence
          ? isOccurrencePaid(
              bill,
              occurrence,
              payments,
              timeZone
            )
          : null,

        sentMarkerFound: Boolean(priorSend?.sentAt),
        priorSentAt: priorSend?.sentAt || null
      });
    }
    if (!isActiveBill(bill) || !bill.id || !bill.name) {
      continue;
    }

    const reminderOffsets = allReminderOffsets(bill);

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
        timeZone,
        payments
      );

      if (!occurrence || !isActiveBill(occurrence.bill) ||
          !normalizeReminderOffsets(occurrence.bill.reminderOffsets).includes(offsetDays)) {
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

      if (hasUnlinkedPaymentForReminderMonth(bill, occurrence, payments, timeZone)) {
        outcomes.reviewRequired += 1;
        continue;
      }
      outcomes.eligible += 1;

      const notification = buildReminderPresentation(
        occurrence.bill,
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

      await prepareInboxPush(householdId, notification, accessToken);
      const delivery = await sendReminderToUserSubscriptions(
        env,
        uid,
        notification
      );

      outcomes.sent += delivery.sent;
      outcomes.removed += delivery.removed;
      outcomes.failures += delivery.failures;
            if (delivery.subscriptionCount === 0) {
        outcomes.noSubscriptions += 1;
      }

      if (delivery.sent > 0) {
        await env.NOTIFICATIONSKV.put(
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
          await markInboxDelivered(householdId, notification.notificationId, accessToken);
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
    remindersNeedReview: 0,
    remindersAlreadySent: 0,
    remindersWithoutSubscriptions: 0,
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
                summary.remindersAlreadySent +=
          result.skipped || 0;

        summary.remindersWithoutSubscriptions +=
          result.noSubscriptions || 0;
        summary.remindersNeedReview += result.reviewRequired || 0;
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

    await env.NOTIFICATIONSKV.put(
      CRON_STATUS_KEY,
      JSON.stringify(summary)
    );
  }
}
// Plaid Production: private connection and transaction storage.
function plaidConnectionKey(uid) {
  return `plaid:production:user:${uid}`;
}
async function plaidRequest(
  env,
  endpoint,
  payload = {}
) {
  function fail(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  if (env.PLAID_ENV !== "production") {
    throw fail(
      "LOCAL_PLAID_ENV_INVALID",
      "Plaid Production configuration is required."
    );
  }

  if (
    !env.PLAID_CLIENT_ID ||
    !String(env.PLAID_CLIENT_ID).trim()
  ) {
    throw fail(
      "LOCAL_PLAID_CLIENT_ID_MISSING",
      "PLAID_CLIENT_ID is missing in this Worker."
    );
  }

  if (
    !env.PLAID_SECRET ||
    !String(env.PLAID_SECRET).trim()
  ) {
    throw fail(
      "LOCAL_PLAID_SECRET_MISSING",
      "PLAID_SECRET is missing in this Worker."
    );
  }

  const allowedEndpoints = new Set([
    "/link/token/create",
    "/item/public_token/exchange",
    "/accounts/get",
    "/transactions/sync"
  ]);

  if (!allowedEndpoints.has(endpoint)) {
    throw fail(
      "LOCAL_PLAID_ENDPOINT_INVALID",
      "Unsupported Plaid endpoint."
    );
  }

  let response;

  try {
    response = await fetch(
      `https://production.plaid.com${endpoint}`,
      {
        method: "POST",
        redirect: "manual",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          ...payload,
          client_id: env.PLAID_CLIENT_ID,
          secret: env.PLAID_SECRET
        })
      }
    );
 } catch (cause) {
  let diagnosticMessage = String(
    cause?.message || "Unknown outbound request error."
  );

  // Redact credential/token values if an exception
  // happens to include them.
  const sensitiveValues = [
    env.PLAID_CLIENT_ID,
    env.PLAID_SECRET,
    payload?.access_token,
    payload?.public_token
  ];

  for (const value of sensitiveValues) {
    if (typeof value === "string" && value.length) {
      diagnosticMessage = diagnosticMessage
        .split(value)
        .join("[REDACTED]");
    }
  }

  console.error(
    "Plaid outbound request exception",
    {
      endpoint,
      exceptionName:
        String(cause?.name || "Error"),
      message: diagnosticMessage.slice(0, 1000)
    }
  );

  throw fail(
    "LOCAL_PLAID_NETWORK_ERROR",
    "The Worker could not reach Plaid."
  );
}
if (
  response.status >= 300 &&
  response.status < 400
) {
  throw fail(
    "LOCAL_PLAID_REDIRECT_BLOCKED",
    "Plaid returned an unexpected redirect. " +
    "The request was not forwarded."
  );
}
  const result = await response.json().catch(
    () => null
  );

  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    throw fail(
      "LOCAL_PLAID_RESPONSE_INVALID",
      "Plaid returned an unreadable response."
    );
  }

  if (!response.ok) {
    const error = fail(
      typeof result.error_code === "string"
        ? result.error_code
        : "PLAID_REQUEST_FAILED",
      "Plaid rejected the banking request."
    );

    error.plaidStatus = response.status;

    error.requestId =
      typeof result.request_id === "string"
        ? result.request_id
        : null;

    // Log diagnostic metadata only.
    // Never log credentials or complete responses.
    console.warn(
      "Plaid request rejected.",
      {
        endpoint,
        code: error.code,
        httpStatus: error.plaidStatus,
        requestId: error.requestId
      }
    );

    throw error;
  }

  if (
    endpoint === "/link/token/create" &&
    typeof result.link_token !== "string"
  ) {
    throw fail(
      "LOCAL_PLAID_LINK_TOKEN_MISSING",
      "Plaid did not return a Link token."
    );
  }

  return result;
}
function safePlaidConnection(record) {
  return {
    environment: "production",
    connected: Boolean(record),
    accounts: record?.accounts || [],
    selectedAccountId: record?.selectedAccountId || null,
    lastSyncedAt: record?.lastSyncedAt || null,
    transactions: (record?.transactions || []).filter(
      transaction =>
        transaction.accountId === record?.selectedAccountId
    )
  };
}
function normalizePlaidTransaction(transaction) {
  const merchantName =
    transaction.merchant_name ||
    transaction.name ||
    "Transaction";

  const signedAmount = Number(transaction.amount);

  if (!Number.isFinite(signedAmount)) {
    throw new Error("The bank returned an invalid transaction amount.");
  }

  return {
    id: transaction.transaction_id,
    accountId: transaction.account_id,
    merchantName,
    originalDescription: transaction.name || "",
    merchantInitials: merchantName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join(""),
    amount: Math.abs(signedAmount),
    date: `${transaction.date}T12:00:00`,
    authorizedDate: transaction.authorized_date
      ? `${transaction.authorized_date}T12:00:00`
      : null,
    pending: Boolean(transaction.pending),
    pendingTransactionId:
      transaction.pending_transaction_id || null,
    type: signedAmount < 0 ? "credit" : "debit",
    category:
      transaction.personal_finance_category?.primary ||
      "Uncategorized",
    iconColor: "#7c5cff",
    source: "plaid-production"
  };
}
async function syncPlaidTransactions(env, record) {
  const originalCursor = record.cursor || "";
  let lastError;

  // Retry the entire pagination sequence if data changes mid-sync.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let cursor = originalCursor;
    let hasMore = true;

    const transactions = new Map(
      (record.transactions || []).map((transaction) => [
        transaction.id,
        transaction
      ])
    );

    try {
      while (hasMore) {
        const result = await plaidRequest(
          env,
          "/transactions/sync",
          {
            access_token: record.accessToken,
            cursor,
            count: 100
          }
        );

        for (const transaction of [
          ...(result.added || []),
          ...(result.modified || [])
        ]) {
          transactions.set(
            transaction.transaction_id,
            normalizePlaidTransaction(transaction)
          );
        }

        for (const transaction of result.removed || []) {
          transactions.delete(transaction.transaction_id);
        }

        cursor = result.next_cursor;
        hasMore = Boolean(result.has_more);
      }

      return {
        ...record,
        cursor,
        transactions: [...transactions.values()],
        lastSyncedAt: new Date().toISOString()
      };
    } catch (error) {
      lastError = error;

      if (
        error.code !==
        "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION"
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}
async function loadHouseholdForBankCommit(
  householdId,
  accessToken
) {
  if (
    typeof householdId !== "string" ||
    !householdId.trim() ||
    householdId.includes("/")
  ) {
    throw new Error(
      "A valid household ID is required."
    );
  }

  const response = await fetch(
    `${FIRESTORE_DOCUMENT_BASE}/households/` +
    encodeURIComponent(householdId),
    {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (response.status === 404) {
    throw new Error("Household not found.");
  }

  if (!response.ok) {
    throw new Error(
      "Could not load household for bank processing " +
      `(${response.status}).`
    );
  }

  const document = await response.json();

  if (!document.name || !document.updateTime) {
    throw new Error(
      "Household version metadata is missing."
    );
  }

  const data = firestoreFieldsToJs(
    document.fields || {}
  );

  if (
    !Array.isArray(data.payments) ||
    !Array.isArray(data.activityLog)
  ) {
    throw new Error(
      "Household payment or activity data needs " +
      "migration before bank processing."
    );
  }

  return {
    householdId,
    documentName: document.name,
    updateTime: document.updateTime,
    data
  };
}

async function bankTransactionClaimId(
  itemId,
  transaction
) {
  if (
    typeof itemId !== "string" ||
    !itemId ||
    typeof transaction?.id !== "string" ||
    !transaction.id ||
    typeof transaction.accountId !== "string" ||
    !transaction.accountId
  ) {
    throw new Error(
      "Bank transaction identity is incomplete."
    );
  }

  return sha256Hex(
    JSON.stringify([
      "production",
      itemId,
      transaction.accountId,
      transaction.id
    ])
  );
}

async function commitBankPaymentAllocation({
  loadedHousehold,
  itemId,
  transaction,
  nextPayments,
  activityEntry,
  allocationPaymentIds,
  accessToken
}) {
  if (
    !loadedHousehold?.documentName ||
    !loadedHousehold.updateTime
  ) {
    throw new Error(
      "Load the current household before " +
      "committing payments."
    );
  }

  if (
    transaction?.pending !== false ||
    transaction.type !== "debit" ||
    !Number.isFinite(Number(transaction.amount)) ||
    Number(transaction.amount) <= 0
  ) {
    throw new Error(
      "Only a posted outgoing bank transaction " +
      "can be allocated."
    );
  }

  if (
    !Array.isArray(nextPayments) ||
    !Array.isArray(allocationPaymentIds) ||
    !allocationPaymentIds.length ||
    !activityEntry ||
    typeof activityEntry.id !== "string"
  ) {
    throw new Error(
      "Payment allocation or activity entry " +
      "is incomplete."
    );
  }

  const ids = new Set(allocationPaymentIds);

  if (
    ids.size !== allocationPaymentIds.length ||
    nextPayments.some(payment =>
      !payment ||
      typeof payment.id !== "string"
    ) ||
    new Set(
      nextPayments.map(payment => payment.id)
    ).size !== nextPayments.length
  ) {
    throw new Error(
      "Payment IDs must be present and unique."
    );
  }

  const allocated = allocationPaymentIds.map(
    id => nextPayments.find(
      payment => payment.id === id
    )
  );

  if (
    allocated.some(payment =>
      !payment ||
      String(
        payment.status || "active"
      ).toLowerCase() === "voided" ||
      payment.bankTransactionId !== transaction.id ||
      payment.bankAccountId !== transaction.accountId ||
      !payment.paidForDueDate ||
      !Number.isFinite(Number(payment.amount)) ||
      Number(payment.amount) <= 0
    )
  ) {
    throw new Error(
      "Allocated payments must be active, " +
      "occurrence-linked, and linked to " +
      "this transaction."
    );
  }

  const revision = Number(
    loadedHousehold.data.syncRevision || 0
  );

  if (
    !Number.isSafeInteger(revision) ||
    revision < 0 ||
    revision >= Number.MAX_SAFE_INTEGER
  ) {
    throw new Error(
      "Invalid household sync revision."
    );
  }

  const claimId = await bankTransactionClaimId(
    itemId,
    transaction
  );

  const claimName =
    `${loadedHousehold.documentName}/` +
    `bankTransactionClaims/${claimId}`;

  const now = new Date().toISOString();

  const activityLog = [
    ...loadedHousehold.data.activityLog,
    activityEntry
  ];

  const updates = {
    payments: nextPayments,
    activityLog,
    updatedAt: now,
    syncRevision: revision + 1,
    syncWriteId: `bank:${crypto.randomUUID()}`
  };

  const claim = {
    environment: "production",
    itemId,
    transactionId: transaction.id,
    accountId: transaction.accountId,
    transactionAmount: Number(transaction.amount),
    postedDate: transaction.date,
    paymentIds: allocationPaymentIds,
    createdAt: now,
    status: "allocated"
  };

  const response = await fetch(
    `${FIRESTORE_DOCUMENT_BASE}:commit`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: claimName,
              fields: jsObjectToFirestoreFields(
                claim
              )
            },
            currentDocument: {
              exists: false
            }
          },
          {
            update: {
              name: loadedHousehold.documentName,
              fields: jsObjectToFirestoreFields(
                updates
              )
            },
            updateMask: {
              fieldPaths: Object.keys(updates)
            },
            currentDocument: {
              updateTime:
                loadedHousehold.updateTime
            }
          }
        ]
      })
    }
  );

  const result = await response.json().catch(
    () => null
  );

  if (!response.ok) {
    const code = result?.error?.status;

    if (
      [
        "ALREADY_EXISTS",
        "FAILED_PRECONDITION",
        "ABORTED"
      ].includes(code)
    ) {
      return {
        committed: false,
        reason: "reload-and-recheck",
        claimId
      };
    }

    throw new Error(
      `Bank payment commit failed (${response.status}).`
    );
  }

  if (!result?.commitTime) {
    throw new Error(
      "Bank commit confirmation is missing. " +
      "Reload the claim before retrying."
    );
  }

  return {
    committed: true,
    claimId,
    commitTime: result.commitTime
  };
}
async function buildBankManualReconciliation({
  household,
  transaction,
  itemId
}) {
  const review = reason => ({
    status: "review",
    reason
  });

  const cents = value => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) return NaN;

    const amount = Number(value);

    return Number.isFinite(amount)
      ? Math.round(amount * 100)
      : NaN;
  };

  const text = value =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const provider = value => {
    const name = text(value);

    const aliases = {
      "zip pay in 4": "zip",
      "zip pay": "zip",
      "zip co": "zip",
      "paypal pay later": "paypal",
      "paypal pay in 4": "paypal"
    };

    return aliases[name] || name;
  };

  const zone = validatedReminderTimeZone(
    household?.settings?.timeZone
  );

  const day = value => {
    if (!value) return NaN;

    const key = reminderFinancialDateKey(
      value,
      zone
    );

    const date = key
      ? utcMiddayFromDateKey(key)
      : null;

    return date
      ? Math.floor(date.getTime() / 86400000)
      : NaN;
  };

  if (
    transaction?.pending !== false ||
    transaction.type !== "debit"
  ) {
    return { status: "ignored" };
  }

  const bankAmount = cents(transaction.amount);

  if (
    !Number.isSafeInteger(bankAmount) ||
    bankAmount <= 0
  ) {
    return review("Invalid bank amount.");
  }

  if (
    !Array.isArray(household?.payments) ||
    !Array.isArray(household?.bills)
  ) {
    return review(
      "Household payment or bill data is missing."
    );
  }

  const payments = household.payments;

  const billById = new Map(
    [
      ...(household.archivedBills || []),
      ...household.bills
    ].map(bill => [bill.id, bill])
  );

  const accountId = transaction.accountId;

  if (!accountId || !transaction.id) {
    return review(
      "Bank identity is incomplete."
    );
  }

  if (
    payments.some(payment =>
      payment.bankTransactionId === transaction.id &&
      (
        !payment.bankAccountId ||
        payment.bankAccountId === accountId
      )
    )
  ) {
    return { status: "already-linked" };
  }

  const description =
    ` ${text(
      transaction.merchantName ||
      transaction.originalDescription
    )} `;

  const postedDay = day(transaction.date);
  const authorizedDay = day(
    transaction.authorizedDate
  );

  if (!Number.isFinite(postedDay)) {
    return review(
      "Bank posting date is missing."
    );
  }

  const groups = new Map();

  for (const payment of payments) {
    const bill = billById.get(payment.billId);
    const snapshot = payment.billSnapshot || {};

    const subject =
      provider(
        bill?.installmentProvider ||
        snapshot.installmentProvider
      ) ||
      text(bill?.name || snapshot.name);

    if (
      !subject ||
      !description.includes(` ${subject} `)
    ) continue;

    if (
      payment.bankAccountId &&
      payment.bankAccountId !== accountId
    ) continue;

    if (
      payment.bankTransactionId ||
      payment.bankMatchKey
    ) continue;

    const paidDay = day(payment.paidDate);

    if (!Number.isFinite(paidDay)) {
      return review(
        "A matching manual payment has no valid payment date."
      );
    }

    const method = text(
      bill?.paymentMethod ||
      snapshot.paymentMethod
    );

    const transfer =
      /bank transfer|ach|echeck|e check/.test(method);

    const near =
      (
        Number.isFinite(authorizedDay) &&
        Math.abs(authorizedDay - paidDay) <= 2
      ) ||
      (
        postedDay - paidDay >= -1 &&
        postedDay - paidDay <=
          (transfer ? 7 : 3)
      );

    if (!near) continue;

    if (
      String(
        payment.status || "active"
      ).toLowerCase() === "voided"
    ) {
      return review(
        "A nearby manual payment was reversed."
      );
    }

    if (
      /sandbox|test/i.test(
        String(payment.source || "") +
        " " +
        String(payment.bankMatchSource || "")
      )
    ) {
      return review(
        "Nearby test payment history must not be linked to a real debit."
      );
    }

    const occurrence =
      reminderPaymentOccurrenceDateKey(
        payment,
        zone
      );

    const amount = cents(payment.amount);

    if (
      !occurrence ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !payment.id
    ) {
      return review(
        "A matching manual payment is missing its occurrence, ID, or amount."
      );
    }

    // Only combine the same provider/merchant
    // and the same recorded local payment day.
    const key = `${subject}:${paidDay}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push({
      payment,
      amount,
      occurrence
    });
  }

  if (!groups.size) {
    return { status: "no-manual-match" };
  }

  let bestDifference = Infinity;
  const candidates = [];

  for (const records of groups.values()) {
    if (records.length > 16) {
      return review(
        "Too many nearby payments to identify a safe group."
      );
    }

    for (
      let mask = 1;
      mask < 2 ** records.length;
      mask++
    ) {
      const selected = records.filter(
        (_, index) =>
          (mask & (1 << index)) !== 0
      );

      const total = selected.reduce(
        (sum, record) => sum + record.amount,
        0
      );

      if (!Number.isSafeInteger(total)) {
        return review(
          "Manual payment total is invalid."
        );
      }

      const difference = Math.abs(
        total - bankAmount
      );

      if (
        difference > 200 ||
        difference > bestDifference
      ) continue;

      const occurrenceKeys = selected.map(
        record =>
          `${record.payment.billId}:` +
          record.occurrence
      );

      if (
        new Set(occurrenceKeys).size !==
        selected.length
      ) {
        return review(
          "Duplicate manual payments exist for an occurrence."
        );
      }

      if (difference < bestDifference) {
        bestDifference = difference;
        candidates.length = 0;
      }

      candidates.push({
        selected,
        total
      });
    }
  }

  if (candidates.length !== 1) {
    return review(
      candidates.length
        ? "Several manual payment groups are equally close."
        : "Nearby manual payments do not explain this debit."
    );
  }

  const candidate = candidates[0];

  const claimId = await bankTransactionClaimId(
    itemId,
    transaction
  );

  const groupId =
    `plaid-production:${accountId}:` +
    transaction.id;

  const selectedIds = new Set(
    candidate.selected.map(
      record => record.payment.id
    )
  );

  const now = new Date().toISOString();

  const difference =
    (bankAmount - candidate.total) / 100;

  const nextPayments = payments.map(payment =>
    selectedIds.has(payment.id)
      ? {
          ...payment,

          paidForDueDate:
            payment.paidForDueDate ||
            payment.billSnapshot.dueDate,

          bankTransactionId: transaction.id,
          bankAccountId: accountId,
          bankItemId: itemId,
          bankMatchKey: groupId,
          bankReconciliationGroupId: groupId,

          bankMatchSource:
            "plaid-production-reconciliation",

          bankPostedDate: transaction.date,
          bankAuthorizedDate:
            transaction.authorizedDate || null,

          bankMatchedAt: now,
          bankAllocatedAmount:
            Number(payment.amount),

          bankTransactionAmount:
            bankAmount / 100,

          bankReconciliationDifference:
            difference
        }
      : { ...payment }
  );

  const allocations = candidate.selected.map(
    record => ({
      paymentId: record.payment.id,
      billId: record.payment.billId,

      dueDate:
        record.payment.paidForDueDate ||
        record.payment.billSnapshot?.dueDate,

      amount: record.amount / 100
    })
  );

  const activityEntry = {
    id: `bank-reconciled:${claimId}`,
    action: "bank_payment_reconciled",
    entityType: "bill",
    entityId: allocations[0].billId,
    title: "Manual payments reconciled",

    detail:
      `${transaction.merchantName || "Bank debit"} · ` +
      `${formatAmount(transaction.amount)} · ` +
      `${allocations.length} payment(s) linked`,

    timestamp: now,
    before: null,

    after: {
      bankMatchKey: groupId,
      transactionAmount: bankAmount / 100,
      recordedPaymentTotal:
        candidate.total / 100,

      reconciliationDifference: difference,
      allocations
    }
  };

  return {
    status: "reconcile",
    nextPayments,
    activityEntry,
    allocationPaymentIds: [...selectedIds]
  };
}
async function buildBankNewPaymentAllocationCore({
  household,
  transaction,
  itemId
}) {
  // Always reconcile existing manual payments first.
  const manual = await buildBankManualReconciliation({
    household,
    transaction,
    itemId
  });

  if (manual.status !== "no-manual-match") {
    return manual;
  }

  const review = reason => ({
    status: "review",
    reason
  });

  const zone = validatedReminderTimeZone(
    household.settings?.timeZone
  );

  const cents = value => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) return NaN;

    const amount = Number(value);

    return Number.isFinite(amount)
      ? Math.round(amount * 100)
      : NaN;
  };

  const text = value =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const provider = value => {
    const name = text(value);

    const aliases = {
      "zip pay in 4": "zip",
      "zip pay": "zip",
      "zip co": "zip",
      "paypal pay later": "paypal",
      "paypal pay in 4": "paypal"
    };

    return aliases[name] || name;
  };

  const matches = name => {
    const normalized = text(name);

    const description =
      ` ${text(
        transaction.merchantName ||
        transaction.originalDescription
      )} `;

    return (
      Boolean(normalized) &&
      description.includes(` ${normalized} `)
    );
  };

  const dateKey = value =>
    reminderFinancialDateKey(value, zone);

  const day = value => {
    const key = value ? dateKey(value) : "";

    const date = key
      ? utcMiddayFromDateKey(key)
      : null;

    return date
      ? Math.floor(date.getTime() / 86400000)
      : NaN;
  };

  const payments = household.payments;

  const active = payment =>
    String(
      payment.status || "active"
    ).toLowerCase() !== "voided";

  const forOccurrence = (billId, dueKey) =>
    payments.filter(payment =>
      payment.billId === billId &&
      reminderPaymentOccurrenceDateKey(
        payment,
        zone
      ) === dueKey
    );

  const bills = household.bills.filter(isActiveBill);
  const amount = cents(transaction.amount);
  const candidates = [];

  let blocked = false;

  // Legacy payments without occurrence links must
  // not be silently reassigned or duplicated.
  for (const bill of bills) {
    const subject = bill.installmentPlanId
      ? provider(bill.installmentProvider)
      : bill.name;

    if (!matches(subject)) continue;

    if (
      payments.some(payment =>
        payment.billId === bill.id &&
        !reminderPaymentOccurrenceDateKey(
          payment,
          zone
        )
      )
    ) {
      return review(
        "A matching bill has payment history " +
        "without a confirmed occurrence."
      );
    }
  }

  // Payment plans: build a consecutive prefix of
  // the next unpaid installments.
  const providers = [
    ...new Set(
      bills
        .filter(bill => bill.installmentPlanId)
        .map(bill =>
          provider(bill.installmentProvider)
        )
        .filter(Boolean)
    )
  ];

  for (const name of providers) {
    if (!matches(name)) continue;

    const queue = bills
      .filter(bill =>
        bill.installmentPlanId &&
        provider(bill.installmentProvider) === name
      )
      .filter(bill =>
        !forOccurrence(
          bill.id,
          dateKey(bill.dueDate)
        ).some(active)
      );

    if (!queue.length) continue;

    if (
      new Set(
        queue.map(bill => bill.installmentPlanId)
      ).size !== 1
    ) {
      blocked = true;
      continue;
    }

    if (
      queue.some(bill =>
        !Number.isFinite(day(bill.dueDate)) ||
        !Number.isSafeInteger(cents(bill.amount)) ||
        cents(bill.amount) <= 0
      )
    ) {
      blocked = true;
      continue;
    }

    queue.sort((a, b) =>
      day(a.dueDate) - day(b.dueDate) ||
      Number(a.installmentNumber || 0) -
      Number(b.installmentNumber || 0)
    );

    let total = 0;
    const allocation = [];

    for (
      let index = 0;
      index < queue.length;
      index++
    ) {
      const bill = queue[index];

      // A reversed occurrence blocks the queue;
      // do not skip it to find a convenient total.
      if (
        forOccurrence(
          bill.id,
          dateKey(bill.dueDate)
        ).length
      ) {
        blocked = true;
        break;
      }

      total += cents(bill.amount);

      if (!Number.isSafeInteger(total)) {
        blocked = true;
        break;
      }

      allocation.push({
        bill,
        dueDate: bill.dueDate,
        originalDueDate: bill.dueDate,
        amount: cents(bill.amount)
      });

      if (total > amount) break;

      if (total === amount) {
        const next = queue[index + 1];

        if (
          next &&
          day(next.dueDate) === day(bill.dueDate)
        ) {
          blocked = true;
        } else {
          candidates.push(allocation);
        }

        break;
      }
    }
  }

  // Ordinary bills: use the existing calendar
  // occurrence logic, not just the bill template.
  const postedDay = day(transaction.date);
  const authorizedDay = day(
    transaction.authorizedDate
  );

  const postedKey = dateKey(transaction.date);

  const [year, month] = postedKey
    .split("-")
    .map(Number);

  const seen = new Set();

  for (
    const bill of bills.filter(
      bill => !bill.installmentPlanId
    )
  ) {
    for (const offset of [-1, 0, 1]) {
      const reference = new Date(
        Date.UTC(
          year,
          month - 1 + offset,
          1,
          12
        )
      );

      const key = reference
        .toISOString()
        .slice(0, 10);

      const occurrences =
        getReminderOccurrencesForMonth(
          bill,
          key,
          zone,
          payments
        );

      for (const occurrence of occurrences) {
        const scheduled = occurrence.bill;

        if (
          !isActiveBill(scheduled) ||
          !matches(scheduled.name)
        ) continue;

        const occurrenceKey =
          bill.id + ":" + occurrence.dueDateKey;

        if (seen.has(occurrenceKey)) continue;
        seen.add(occurrenceKey);

        const dueDay = day(
          occurrence.dueDateKey
        );

        const transfer =
          /bank transfer|ach|echeck|e check/.test(
            text(scheduled.paymentMethod)
          );

        const near =
          (
            Number.isFinite(authorizedDay) &&
            Math.abs(authorizedDay - dueDay) <= 2
          ) ||
          (
            postedDay - dueDay >= -2 &&
            postedDay - dueDay <=
              (transfer ? 7 : 3)
          );

        if (
          !near ||
          cents(scheduled.amount) !== amount
        ) continue;

        if (
          forOccurrence(
            bill.id,
            occurrence.dueDateKey
          ).length
        ) {
          blocked = true;
          continue;
        }

        candidates.push([
          {
            bill: scheduled,
            dueDate: scheduled.dueDate,
            originalDueDate:
              scheduled.originalDueDate ||
              scheduled.dueDate,
            amount
          }
        ]);
      }
    }
  }

  if (blocked || candidates.length > 1) {
    return review(
      "The debit has conflicting or ambiguous " +
      "unpaid bill candidates."
    );
  }

  if (!candidates.length) {
    return { status: "unmatched" };
  }

  const allocation = candidates[0];

  const claimId = await bankTransactionClaimId(
    itemId,
    transaction
  );

  const groupId =
    `plaid-production:${transaction.accountId}:` +
    transaction.id;

  const now = new Date().toISOString();

  const records = allocation.map(
    (item, index) => {
      const bill = item.bill;

      const payment = {
        id: `bank:${claimId}:${index}`,
        billId: bill.id,
        amount: item.amount / 100,
        paidDate: transaction.date,
        paidForDueDate: item.dueDate,
        originalDueDate: item.originalDueDate,
        status: "active",
        voidedAt: null,

        source: "plaid-production-auto",
        expectedAmountAtMatch: item.amount / 100,

        bankTransactionId: transaction.id,
        bankAccountId: transaction.accountId,
        bankItemId: itemId,
        bankMatchKey: groupId,
        bankReconciliationGroupId: groupId,
        bankMatchSource: "plaid-production-auto",

        bankPostedDate: transaction.date,
        bankAuthorizedDate:
          transaction.authorizedDate || null,

        bankMatchedAt: now,
        bankAllocatedAmount: item.amount / 100,
        bankTransactionAmount: amount / 100,
        bankReconciliationDifference: 0
      };

      payment.billSnapshot = {
        id: bill.id,
        name: bill.name,
        amount: item.amount / 100,
        dueDate: item.dueDate,
        originalDueDate: item.originalDueDate,
        recurrence: bill.recurrence || "None",
        category: bill.category || "other",
        paymentMethod: bill.paymentMethod || "",
        capturedAt: now,

        installmentPlanId:
          bill.installmentPlanId || null,

        installmentProvider:
          bill.installmentProvider || null,

        installmentNumber:
          bill.installmentNumber || null,

        installmentTotal:
          bill.installmentTotal || null
      };

      return payment;
    }
  );

  return {
    status: "allocate",

    nextPayments: [
      ...payments.map(payment => ({ ...payment })),
      ...records
    ],

    allocationPaymentIds: records.map(
      payment => payment.id
    ),

    activityEntry: {
      id: `bank-matched:${claimId}`,
      action: "bank_payment_matched",
      entityType: "bill",
      entityId: records[0].billId,
      title: "Bank payment matched",

      detail:
        `${transaction.merchantName || "Bank debit"} · ` +
        `${formatAmount(transaction.amount)} · ` +
        `${records.length} payment(s) recorded`,

      timestamp: now,
      before: null,

      after: {
        bankMatchKey: groupId,

        allocations: records.map(payment => ({
          paymentId: payment.id,
          billId: payment.billId,
          dueDate: payment.paidForDueDate,
          amount: payment.amount
        }))
      }
    }
  };
}
async function requireBankHousehold(uid, accessToken) {
  const profile = await getUserProfile(uid, accessToken);

  const householdId =
    typeof profile?.householdId === "string"
      ? profile.householdId.trim()
      : "";

  if (!householdId) {
    throw new Error("Bank owner has no household.");
  }

  const member = await getHouseholdMember(
    householdId,
    uid,
    accessToken
  );

  if (
    !member ||
    member.role !== "owner" ||
    (member.uid && member.uid !== uid)
  ) {
    throw new Error(
      "Automatic banking requires the household owner connection."
    );
  }

  return householdId;
}

async function processBankConnection(env, uid, accessToken) {
  const key = plaidConnectionKey(uid);

  let record = await env.NOTIFICATIONSKV.get(key, "json");

  const summary = {
    uid,
    matched: 0,
    reconciled: 0,
    review: 0,
    unmatched: 0,
    alreadyLinked: 0
  };

  if (
    !record?.accessToken ||
    !record.itemId ||
    !record.selectedAccountId
  ) {
    return {
      ...summary,
      status: "no-selected-connection"
    };
  }

  const householdId = await requireBankHousehold(
    uid,
    accessToken
  );

  if (
    !record.bankHouseholdId ||
    record.bankHouseholdId !== householdId
  ) {
    throw new Error(
      "Bank connection is not bound to this household. " +
      "Do not automatically reassign it."
    );
  }

  summary.householdId = householdId;

  record = await syncPlaidTransactions(env, record);

  await env.NOTIFICATIONSKV.put(
    key,
    JSON.stringify(record)
  );

  let loaded = await loadHouseholdForBankCommit(
    householdId,
    accessToken
  );

  const zone = validatedReminderTimeZone(
    loaded.data.settings?.timeZone
  );

  // Do not apply earlier bank history to today's unpaid bills.
  // This includes the connection date and all subsequent dates.
  const startKey = reminderFinancialDateKey(
    record.createdAt,
    zone
  );

  if (!startKey) {
    throw new Error("Bank connection start date is invalid.");
  }

  const transactions = (record.transactions || [])
    .filter(transaction =>
      transaction.accountId === record.selectedAccountId &&
      transaction.pending === false &&
      transaction.type === "debit" &&
      reminderFinancialDateKey(
        transaction.date,
        zone
      ) >= startKey
    )
    .sort((a, b) =>
      String(a.date).localeCompare(String(b.date)) ||
      String(a.id).localeCompare(String(b.id))
    );

  const plans = [];

  const outcomePath = id =>
    `households/${encodeURIComponent(householdId)}/` +
    `bankReconciliationEvents/${id}`;

  const claimPath = id =>
    `households/${encodeURIComponent(householdId)}/` +
    `bankTransactionClaims/${id}`;

  async function saveOutcome(
    transaction,
    claimId,
    status,
    reason = ""
  ) {
    await writeFirestoreDocument(
      outcomePath(claimId),
      {
        transactionId: transaction.id,
        accountId: transaction.accountId,
        itemId: record.itemId,
        amount: Number(transaction.amount),
        postedDate: transaction.date,
        status,
        reason,
        checkedAt: new Date().toISOString()
      },
      accessToken
    );
  }

  // Calculate proposals against the same household snapshot.
  // This lets us detect transactions competing for a payment.
  for (const transaction of transactions) {
    const claimId = await bankTransactionClaimId(
      record.itemId,
      transaction
    );

    const existingClaim = await getFirestoreDocument(
      claimPath(claimId),
      accessToken
    );

    if (existingClaim) {
      const linked = loaded.data.payments.filter(
        payment =>
          (existingClaim.paymentIds || []).includes(
            payment.id
          )
      );

      const changed =
        Math.round(
          Number(existingClaim.transactionAmount) * 100
        ) !==
        Math.round(Number(transaction.amount) * 100);

      const missing =
        linked.length !==
        (existingClaim.paymentIds || []).length;

      if (changed || missing) {
        summary.review++;

        await saveOutcome(
          transaction,
          claimId,
          "review",
          changed
            ? "Claimed bank amount changed."
            : "Previously claimed payments are missing " +
              "after a household change or restore."
        );
      } else {
        summary.alreadyLinked++;
      }

      continue;
    }

    const plan = await buildBankNewPaymentAllocation({
      household: loaded.data,
      transaction,
      itemId: record.itemId
    });

    if (
      plan.status === "allocate" ||
      plan.status === "reconcile"
    ) {
      plans.push({
        transaction,
        claimId,
        plan
      });
    } else {
      if (
        plan.status === "review" ||
        plan.status === "already-linked"
      ) {
        summary.review++;
      } else {
        summary.unmatched++;
      }

      await saveOutcome(
        transaction,
        claimId,
        plan.status === "already-linked"
          ? "review"
          : plan.status,
        plan.reason ||
          (
            plan.status === "already-linked"
              ? "Payment has a bank link but no atomic claim. " +
                "Left unchanged."
              : ""
          )
      );
    }
  }

  const occurrenceKey = payment =>
    payment.billId +
    ":" +
    reminderPaymentOccurrenceDateKey(payment, zone);

  const allocations = plan =>
    plan.nextPayments.filter(payment =>
      plan.allocationPaymentIds.includes(payment.id)
    );

  const claims = new Map();

  for (const proposal of plans) {
    for (const payment of allocations(proposal.plan)) {
      const occurrence = occurrenceKey(payment);

      claims.set(
        occurrence,
        (claims.get(occurrence) || 0) + 1
      );
    }
  }

  for (const proposal of plans) {
    const { transaction, claimId } = proposal;

    const originalKeys = allocations(proposal.plan)
      .map(occurrenceKey)
      .sort();

    if (
      originalKeys.some(
        occurrence => claims.get(occurrence) !== 1
      )
    ) {
      summary.review++;

      await saveOutcome(
        transaction,
        claimId,
        "review",
        "Competing transactions claim the same bill occurrence."
      );

      continue;
    }

    let committed = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      const currentHouseholdId =
        await requireBankHousehold(uid, accessToken);

      if (currentHouseholdId !== householdId) {
        throw new Error(
          "Bank household membership changed."
        );
      }

      const latestRecord =
        await env.NOTIFICATIONSKV.get(key, "json");

      if (
        latestRecord?.itemId !== record.itemId ||
        latestRecord.selectedAccountId !==
          record.selectedAccountId ||
        latestRecord.bankHouseholdId !== householdId
      ) {
        throw new Error(
          "Selected bank connection changed during processing."
        );
      }

      if (
        await getFirestoreDocument(
          claimPath(claimId),
          accessToken
        )
      ) {
        summary.alreadyLinked++;
        committed = true;
        break;
      }

      loaded = await loadHouseholdForBankCommit(
        householdId,
        accessToken
      );

      const plan = await buildBankNewPaymentAllocation({
        household: loaded.data,
        transaction,
        itemId: record.itemId
      });

      if (
        plan.status !== "allocate" &&
        plan.status !== "reconcile"
      ) break;

      const freshKeys = allocations(plan)
        .map(occurrenceKey)
        .sort();

      // Never redirect a transaction to different installments
      // merely because the household changed during processing.
      if (
        JSON.stringify(freshKeys) !==
        JSON.stringify(originalKeys)
      ) break;

      const result = await commitBankPaymentAllocation({
        loadedHousehold: loaded,
        itemId: record.itemId,
        transaction,
        nextPayments: plan.nextPayments,
        activityEntry: plan.activityEntry,
        allocationPaymentIds: plan.allocationPaymentIds,
        accessToken
      });

      if (result.committed) {
        committed = true;

        if (plan.status === "reconcile") {
          summary.reconciled++;
        } else {
          summary.matched++;
        }

        await saveOutcome(
          transaction,
          claimId,
          plan.status === "reconcile"
            ? "reconciled"
            : "allocated"
        );

        break;
      }
    }

    if (!committed) {
      summary.review++;

      await saveOutcome(
        transaction,
        claimId,
        "review",
        "Household changed or allocation could not " +
        "be committed safely."
      );
    }
  }

  return {
    ...summary,
    status: "processed"
  };
}

async function runScheduledBankPayments(env) {
  const summary = {
    startedAt: new Date().toISOString(),
    processed: 0,
    matched: 0,
    reconciled: 0,
    review: 0,
    unmatched: 0,
    failures: 0
  };

  try {
    if (env.PLAID_ENV !== "production") {
      throw new Error(
        "Production banking configuration required."
      );
    }

    const keys = await listAllKvKeys(
      env,
      "plaid:production:user:"
    );

    if (!keys.length) return summary;

    const accessToken = await getFirestoreAccessToken(env);

    for (const key of keys) {
      const uid = key.name.slice(
        "plaid:production:user:".length
      );

      try {
        const result = await processBankConnection(
          env,
          uid,
          accessToken
        );
        await env.NOTIFICATIONSKV.put(
  `plaid:production:run-status:${uid}`,
  JSON.stringify({
    ...result,
    startedAt: summary.startedAt,
    finishedAt: new Date().toISOString(),
    source: "scheduled"
  })
);
        if (result.status !== "processed") continue;

        summary.processed++;

        for (
          const field of [
            "matched",
            "reconciled",
            "review",
            "unmatched"
          ]
        ) {
          summary[field] += result[field];
        }
      } catch (error) {
        summary.failures++;

        console.error(
          "Scheduled bank processing failed.",
          {
            uid,
            message: error.message
          }
        );
      }
    }

    return summary;
  } catch (error) {
    summary.failures++;

    console.error(
      "Scheduled banking unavailable.",
      { message: error.message }
    );

    return summary;
  } finally {
    summary.finishedAt = new Date().toISOString();

    await env.NOTIFICATIONSKV.put(
      "system:last-bank-run",
      JSON.stringify(summary)
    );
  }
}
function bankBillHistoryEligibility(
  bill,
  transaction,
  timeZone
) {
  const key = value =>
    value
      ? reminderFinancialDateKey(value, timeZone)
      : "";

  const createdKey = key(bill?.createdAt);
  const postedKey = key(transaction?.date);
  const authorizedKey = key(
    transaction?.authorizedDate
  );

  if (!createdKey) {
    return {
      eligible: false,
      reason:
        "Bill creation date is missing or invalid."
    };
  }

  if (!postedKey) {
    return {
      eligible: false,
      reason:
        "Transaction posting date is missing or invalid."
    };
  }

  // Use the earlier known payment date.
  // A later posting date must not make a newly
  // added bill eligible for an older payment.
  const paymentKey =
    authorizedKey && authorizedKey < postedKey
      ? authorizedKey
      : postedKey;

  if (createdKey > paymentKey) {
    return {
      eligible: false,
      reason:
        "The bill was added after this " +
        "transaction's payment date."
    };
  }

  // The transaction data currently preserves dates,
  // not reliable transaction times. Do not invent
  // ordering from the synthetic T12:00:00 value.
  if (createdKey === paymentKey) {
    return {
      eligible: false,
      reason:
        "The bill and transaction have the same " +
        "date; their order cannot be confirmed."
    };
  }

  return {
    eligible: true
  };
}

async function buildBankNewPaymentAllocation({
  household,
  transaction,
  itemId
}) {
  const plan =
    await buildBankNewPaymentAllocationCore({
      household,
      transaction,
      itemId
    });

  // Preserve manual reconciliation and all existing
  // ignored, unmatched, already-linked, and review results.
  if (plan.status !== "allocate") {
    return plan;
  }

  const review = reason => ({
    status: "review",
    reason
  });

  if (
    !Array.isArray(plan.nextPayments) ||
    !Array.isArray(plan.allocationPaymentIds) ||
    !plan.allocationPaymentIds.length ||
    !Array.isArray(household?.bills)
  ) {
    return review(
      "Allocation or bill history is incomplete."
    );
  }

  const timeZone = validatedReminderTimeZone(
    household.settings?.timeZone
  );

  const billById = new Map(
    household.bills.map(
      bill => [bill.id, bill]
    )
  );

  for (
    const paymentId of plan.allocationPaymentIds
  ) {
    const payment = plan.nextPayments.find(
      record => record.id === paymentId
    );

    const bill = payment
      ? billById.get(payment.billId)
      : null;

    if (!payment || !bill) {
      return review(
        "An allocated payment has no confirmed active bill."
      );
    }

    const history =
      bankBillHistoryEligibility(
        bill,
        transaction,
        timeZone
      );

    if (!history.eligible) {
      return review(
        `${bill.name || "Bill"}: ` +
        history.reason +
        " No payment records were changed."
      );
    }
  }

  return plan;
}
async function handleBankAutomationRequest(
  request,
  env,
  origin
) {
  const path = new URL(request.url).pathname;

  if (
    ![
      "/plaid/automation-status",
      "/plaid/run-now"
    ].includes(path)
  ) {
    return null;
  }

  const method =
    path === "/plaid/run-now"
      ? "POST"
      : "GET";

  if (request.method !== method) {
    return json(
      {
        ok: false,
        error: "Method not allowed."
      },
      405,
      origin
    );
  }

  const authentication =
    await verifyFirebaseToken(request);

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

  const uid = authentication.user.uid;

  const statusKey =
    `plaid:production:run-status:${uid}`;

  try {
    const accessToken =
      await getFirestoreAccessToken(env);

    const householdId =
      await requireBankHousehold(
        uid,
        accessToken
      );

    if (path === "/plaid/automation-status") {
      const record =
        await env.NOTIFICATIONSKV.get(
          plaidConnectionKey(uid),
          "json"
        );

      const status =
        await env.NOTIFICATIONSKV.get(
          statusKey,
          "json"
        );

      const sameHousehold =
        record?.bankHouseholdId === householdId;

      return json(
        {
          ok: true,
          environment: env.PLAID_ENV,
          connected: Boolean(record),
          householdBound: sameHousehold,

          selectedAccountId:
            sameHousehold
              ? record?.selectedAccountId || null
              : null,

          lastSyncedAt:
            sameHousehold
              ? record?.lastSyncedAt || null
              : null,

          lastRun:
            status?.householdId === householdId
              ? status
              : null,

          scheduleUtc: "00:00 and 12:00",

          manualRunEnabled:
            env.BANK_RUN_NOW_ENABLED === "true"
        },
        200,
        origin
      );
    }

    if (env.BANK_RUN_NOW_ENABLED !== "true") {
      return json(
        {
          ok: false,
          error: "Manual bank processing is disabled."
        },
        403,
        origin
      );
    }

    if (env.PLAID_ENV !== "production") {
      return json(
        {
          ok: false,
          error: "Production configuration required."
        },
        503,
        origin
      );
    }

    const startedAt = new Date().toISOString();

    const result = await processBankConnection(
      env,
      uid,
      accessToken
    );

    const status = {
      ...result,
      householdId,
      startedAt,
      finishedAt: new Date().toISOString(),
      source: "manual"
    };

    await env.NOTIFICATIONSKV.put(
      statusKey,
      JSON.stringify(status)
    );

    return json(
      {
        ok: true,
        ...status
      },
      200,
      origin
    );
  } catch (error) {
    console.error(
      "Bank automation request failed.",
      {
        uid,
        message: error.message
      }
    );

    return json(
      {
        ok: false,
        error:
          "Bank processing or status lookup failed. " +
          "Check Worker logs; do not assume " +
          "no payments changed."
      },
      500,
      origin
    );
  }
}
async function loadSharedHouseholdBankView(
  env,
  uid,
  requestedAccountId = null
) {
  const accessToken =
    await getFirestoreAccessToken(env);

  const profile =
    await getUserProfile(uid, accessToken);

  const householdId =
    typeof profile?.householdId === "string"
      ? profile.householdId.trim()
      : "";

  if (!householdId) {
    throw new Error(
      "No household is assigned to this account."
    );
  }

  const membership = await getHouseholdMember(
    householdId,
    uid,
    accessToken
  );

  if (
    !membership ||
    !["owner", "member"].includes(membership.role) ||
    (membership.uid && membership.uid !== uid)
  ) {
    throw new Error(
      "Valid household membership is required " +
      "to view transactions."
    );
  }

  const owners = new Set();
  let pageToken;

  do {
    const url = new URL(
      `${FIRESTORE_DOCUMENT_BASE}/households/` +
      `${encodeURIComponent(householdId)}/members`
    );

    url.searchParams.set("pageSize", "1000");

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(
        "Could not verify the household bank owner."
      );
    }

    const result = await response.json();

    for (const document of result.documents || []) {
      const member = firestoreFieldsToJs(
        document.fields || {}
      );

      const ownerUid = document.name
        .split("/")
        .pop();

      if (
        member.role === "owner" &&
        (!member.uid || member.uid === ownerUid)
      ) {
        owners.add(ownerUid);
      }
    }

    pageToken = result.nextPageToken;
  } while (pageToken);

  const connections = [];

  for (const ownerUid of owners) {
    const ownerProfile = await getUserProfile(
      ownerUid,
      accessToken
    );

    if (
      ownerProfile?.householdId !== householdId
    ) continue;

    const record =
      await env.NOTIFICATIONSKV.get(
        plaidConnectionKey(ownerUid),
        "json"
      );

    if (
      record &&
      record.bankHouseholdId === householdId
    ) {
      connections.push({
        ownerUid,
        record
      });
    }
  }

  if (connections.length > 1) {
    throw new Error(
      "Multiple owner bank connections exist. " +
      "A primary connection must be designated " +
      "before sharing."
    );
  }

  if (!connections.length) {
    if (requestedAccountId) {
      throw new Error(
        "No shared bank account is available."
      );
    }

    return {
      ...safePlaidConnection(null),
      sharedHouseholdConnection: true,
      canManageBankConnection:
        membership.role === "owner"
    };
  }

  const { ownerUid, record } = connections[0];

  const viewAccountId =
    requestedAccountId ||
    record.selectedAccountId;

  if (
    viewAccountId &&
    !(record.accounts || []).some(
      account => account.id === viewAccountId
    )
  ) {
    throw new Error(
      "Choose an account from the household " +
      "bank connection."
    );
  }

  const latestMember = await getHouseholdMember(
    householdId,
    uid,
    accessToken
  );

  if (
    !latestMember ||
    !["owner", "member"].includes(latestMember.role) ||
    (latestMember.uid && latestMember.uid !== uid)
  ) {
    throw new Error(
      "Household access changed."
    );
  }

  return {
    ...safePlaidConnection({
      ...record,
      selectedAccountId: viewAccountId
    }),

    sharedHouseholdConnection: true,

    canManageBankConnection:
      latestMember.role === "owner" &&
      uid === ownerUid
  };
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
    const bankAutomationResponse =
  await handleBankAutomationRequest(
    request,
    env,
    origin
  );

if (bankAutomationResponse) {
  return bankAutomationResponse;
}
    const plaidBankRoutes = new Set([
  "/plaid/exchange-token",
  "/plaid/account",
  "/plaid/sync",
  "/plaid/status"
]);

if (plaidBankRoutes.has(url.pathname)) {
  const expectedMethod =
    url.pathname === "/plaid/status" ? "GET" : "POST";

  if (request.method !== expectedMethod) {
    return json(
      { ok: false, error: "Method not allowed." },
      405,
      origin
    );
  }

  const authentication = await verifyFirebaseToken(request);

  if (!authentication.ok) {
    return json(
      { ok: false, error: authentication.error },
      authentication.status,
      origin
    );
  }

  if (env.PLAID_ENV !== "production") {
  return json(
    {
      ok: false,
      error: "Plaid Production configuration required."
    },
    503,
    origin
  );
}

  const key = plaidConnectionKey(authentication.user.uid);

  try {
    let record = await env.NOTIFICATIONSKV.get(key, "json");

    if (url.pathname === "/plaid/status") {
  const view = await loadSharedHouseholdBankView(
    env,
    authentication.user.uid,
    url.searchParams.get("accountId")
  );

  return json(
    {
      ok: true,
      ...view
    },
    200,
    origin
  );
}
const bankManagementToken =
  await getFirestoreAccessToken(env);

const bankManagementHouseholdId =
  await requireBankHousehold(
    authentication.user.uid,
    bankManagementToken
  );

if (
  record &&
  record.bankHouseholdId !==
    bankManagementHouseholdId
) {
  throw new Error(
    "The bank connection does not belong " +
    "to this household."
  );
}
    if (url.pathname === "/plaid/exchange-token") {
      // Avoid replacing an existing connection accidentally.
      if (record) {
        return json(
          {
            ok: false,
            error:
              "A bank is already connected. Use Load or Sync instead"
          },
          409,
          origin
        );
      }

      const body = await request.json();

      if (
  typeof body.public_token !== "string" ||
  body.public_token.length > 512 ||
  !body.public_token.startsWith("public-production-")
) {
  return json(
    {
      ok: false,
      error: "A valid Production public token is required."
    },
    400,
    origin
  );
}

      const bankFirestoreToken =
  await getFirestoreAccessToken(env);

const bankHouseholdId =
  await requireBankHousehold(
    authentication.user.uid,
    bankFirestoreToken
  );

const exchanged = await plaidRequest(
  env,
  "/item/public_token/exchange",
  { public_token: body.public_token }
);
      // Save immediately so a later account-fetch error does not
      // discard a successfully exchanged connection.
      record = {
        accessToken: exchanged.access_token,
        itemId: exchanged.item_id,
        bankHouseholdId,
        accounts: [],
        selectedAccountId: null,
        transactions: [],
        cursor: "",
        createdAt: new Date().toISOString(),
        lastSyncedAt: null
      };

      await env.NOTIFICATIONSKV.put(
        key,
        JSON.stringify(record)
      );

      const accountResult = await plaidRequest(
        env,
        "/accounts/get",
        { access_token: record.accessToken }
      );

      record.accounts = accountResult.accounts.map((account) => ({
        id: account.account_id,
        name: account.name,
        mask: account.mask || "",
        type: account.type,
        subtype: account.subtype || ""
      }));

      record.selectedAccountId =
        record.accounts.find(
          (account) => account.subtype === "checking"
        )?.id || record.accounts[0]?.id || null;
    }

    if (!record) {
      return json(
        { ok: false, error: "Connect a bank first." },
        400,
        origin
      );
    }

    if (url.pathname === "/plaid/account") {
      const body = await request.json();

      if (
        !record.accounts.some(
          (account) => account.id === body.accountId
        )
      ) {
        return json(
          { ok: false, error: "Choose an account from this connection." },
          400,
          origin
        );
      }

      record.selectedAccountId = body.accountId;
    }

    if (url.pathname === "/plaid/sync") {
      // Also repairs account loading after an interrupted enrollment.
      if (!record.accounts.length) {
        const accountResult = await plaidRequest(
          env,
          "/accounts/get",
          { access_token: record.accessToken }
        );

        record.accounts = accountResult.accounts.map((account) => ({
          id: account.account_id,
          name: account.name,
          mask: account.mask || "",
          type: account.type,
          subtype: account.subtype || ""
        }));

        record.selectedAccountId =
          record.accounts.find(
            (account) => account.subtype === "checking"
          )?.id || record.accounts[0]?.id || null;
      }

      record = await syncPlaidTransactions(env, record);
    }

    await env.NOTIFICATIONSKV.put(
      key,
      JSON.stringify(record)
    );

    return json(
      { ok: true, ...safePlaidConnection(record) },
      200,
      origin
    );
  } catch (error) {
    // Do not log tokens or complete Plaid request/response objects.
    return json(
      {
        ok: false,
        error: error.message || "Banking request failed."
      },
      502,
      origin
    );
  }
}
   if (
  request.method === "POST" &&
  url.pathname === "/plaid/link-token"
) {
  const authentication = await verifyFirebaseToken(request);

  if (!authentication.ok) {
    return json(
      { ok: false, error: authentication.error },
      authentication.status,
      origin
    );
  }

  if (env.PLAID_ENV !== "production") {
    return json(
      {
        ok: false,
        error: "Plaid Production configuration required."
      },
      503,
      origin
    );
  }

  try {
    const result = await plaidRequest(
      env,
      "/link/token/create",
      {
        client_name: "Bill Beacon",
        user: {
          client_user_id: authentication.user.uid
        },
        products: ["transactions"],
        country_codes: ["US"],
        language: "en",
        ...(env.PLAID_REDIRECT_URI
          ? { redirect_uri: env.PLAID_REDIRECT_URI }
          : {})
      }
    );

    if (!result.link_token) {
      throw new Error("Plaid did not return a connection token.");
    }

    return json(
      {
        ok: true,
        environment: "production",
        link_token: result.link_token
      },
      200,
      origin
    );
  } catch (error) {
    return json(
      {
        ok: false,
        error: "Could not create the bank connection session.",
        code: error.code || "PLAID_LINK_TOKEN_FAILED"
      },
      502,
      origin
    );
  }
}
        if (
      request.method === "POST" &&
      url.pathname === "/household-invites"
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

      try {
        const accessToken = await getFirestoreAccessToken(env);

        const owner = await requireHouseholdOwner(
          authentication.user.uid,
          accessToken
        );

        const token = createInviteToken();
        const tokenHash = await sha256Hex(token);
        const now = new Date().toISOString();
        const expiresAt = new Date(
          Date.now() + HOUSEHOLD_INVITE_TTL_SECONDS * 1000
        ).toISOString();

        await env.NOTIFICATIONSKV.put(
          inviteKey(tokenHash),
          JSON.stringify({
            householdId: owner.householdId,
            createdByUid: authentication.user.uid,
            createdByEmail: authentication.user.email || "",
            createdAt: now,
            expiresAt,
            usedAt: null,
            usedByUid: null
          }),
          {
            expirationTtl: HOUSEHOLD_INVITE_TTL_SECONDS
          }
        );

        const inviteUrl = new URL("/", APP_ORIGIN);

        inviteUrl.searchParams.set("invite", token);

        return json(
          {
            ok: true,
            inviteUrl: inviteUrl.toString(),
            expiresAt
          },
          201,
          origin
        );
      } catch (error) {
        console.error("Household invite creation failed:", error);

        return json(
          {
            ok: false,
            error:
              error?.message ||
              "Could not create a household invite."
          },
          400,
          origin
        );
      }
    }

    if (
      request.method === "POST" &&
      url.pathname === "/household-invites/accept"
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

      const token =
        typeof body?.token === "string"
          ? body.token.trim()
          : "";

      if (!/^[a-f0-9]{64}$/i.test(token)) {
        return json(
          {
            ok: false,
            error: "This household invite link is invalid."
          },
          400,
          origin
        );
      }

      try {
        const tokenHash = await sha256Hex(token);

        const storedInvite = await env.NOTIFICATIONSKV.get(
          inviteKey(tokenHash),
          "json"
        );

        if (!storedInvite) {
          return json(
            {
              ok: false,
              error:
                "This household invite has expired, was revoked, or has already been used."
            },
            404,
            origin
          );
        }

        const expiresAt = new Date(storedInvite.expiresAt);

        if (
          Number.isNaN(expiresAt.getTime()) ||
          expiresAt.getTime() <= Date.now()
        ) {
          await env.NOTIFICATIONSKV.delete(
            inviteKey(tokenHash)
          );

          return json(
            {
              ok: false,
              error:
                "This household invite has expired. Ask the owner for a new link."
            },
            410,
            origin
          );
        }

        if (
          storedInvite.usedAt ||
          storedInvite.usedByUid
        ) {
          return json(
            {
              ok: false,
              error:
                "This household invite has already been used."
            },
            409,
            origin
          );
        }

        if (
          storedInvite.createdByUid ===
          authentication.user.uid
        ) {
          return json(
            {
              ok: false,
              error:
                "You cannot use your own household invite."
            },
            400,
            origin
          );
        }

        const accessToken = await getFirestoreAccessToken(env);

        const existingProfile = await getUserProfile(
          authentication.user.uid,
          accessToken
        );

        /*
         * A person may join only if they do not already belong
         * to another household.
         */
        if (
          existingProfile &&
          typeof existingProfile.householdId === "string" &&
          existingProfile.householdId.trim() &&
          existingProfile.householdId !==
            storedInvite.householdId
        ) {
          return json(
            {
              ok: false,
              error:
                "This account already belongs to another household."
            },
            409,
            origin
          );
        }

        const now = new Date().toISOString();
        const householdId = storedInvite.householdId;

        await writeFirestoreDocument(
          `users/${encodeURIComponent(
            authentication.user.uid
          )}`,
          {
            householdId,
            role: "member",
            email: authentication.user.email || "",
            createdAt: existingProfile?.createdAt || now,
            updatedAt: now
          },
          accessToken
        );

        await writeFirestoreDocument(
          `households/${encodeURIComponent(
            householdId
          )}/members/${encodeURIComponent(
            authentication.user.uid
          )}`,
          {
            uid: authentication.user.uid,
            email: authentication.user.email || "",
            role: "member",
            joinedAt: now,
            updatedAt: now
          },
          accessToken
        );

        /*
         * Delete first so this invite is one-time use.
         * KV deletion makes it unavailable for later attempts.
         */
        await env.NOTIFICATIONSKV.delete(
          inviteKey(tokenHash)
        );

        return json(
          {
            ok: true,
            householdId,
            role: "member"
          },
          200,
          origin
        );
      } catch (error) {
        console.error("Household invite acceptance failed:", error);

        return json(
          {
            ok: false,
            error:
              error?.message ||
              "Could not join the household."
          },
          500,
          origin
        );
      }
    }
        
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

      await env.NOTIFICATIONSKV.put(
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
        const accessToken = await getFirestoreAccessToken(env);
        const profile = await getUserProfile(authentication.user.uid, accessToken);
        const householdId = profile?.householdId;
        if (typeof householdId !== "string" || !householdId.trim()) throw new Error("No household profile.");
        const member = await getHouseholdMember(householdId, authentication.user.uid, accessToken);
        if (!member || !["owner", "member"].includes(member.role) || (member.uid && member.uid !== authentication.user.uid))
          throw new Error("Valid household membership required.");
        const household = await getHouseholdSnapshot(householdId, accessToken);
        const actualBill = (household?.bills || []).find(item => item.id === bill.id);
        if (!actualBill || !isActiveBill(actualBill)) throw new Error("Choose an active shared household bill.");
        const notification = buildReminderPresentation(actualBill,
          dateKeyInTimeZone(actualBill.dueDate, validatedReminderTimeZone(household?.settings?.timeZone)),
          0, household?.settings || {}, authentication.user.uid);
        notification.notificationId = `test:${crypto.randomUUID()}`;
        notification.title = "Payment Reminder (Test)";
        notification.body = message;
        notification.kind = "bill-reminder-test";
        await prepareInboxPush(householdId, notification, accessToken);
        await sendPushNotification(subscription, notification, env);
        await markInboxDelivered(householdId, notification.notificationId, accessToken);

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

  async scheduled(event, env, ctx) {
  if (event.cron === "0 0,12 * * *") {
    ctx.waitUntil(runScheduledBankPayments(env));
    return;
  }

  if (event.cron === "*/5 * * * *") {
    ctx.waitUntil(runScheduledBillReminders(env));
    return;
  }

  console.warn(
    "Unrecognized scheduled trigger:",
    event.cron
  );
}
};