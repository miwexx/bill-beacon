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
        ttl: 60,
        urgency: "normal"
      }
    }
  });

  if (!isAllowedPushEndpoint(endpoint) || new URL(endpoint).href !== new URL(subscription.endpoint).href) {
    throw new Error("Push request destination changed unexpectedly.");
  }
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "error",
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
    removed: 0,
    failures: 0
  };

  for (const bill of bills) {
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
// Plaid Sandbox: private connection and transaction storage.
function plaidSandboxKey(uid) {
  return `plaid:sandbox:user:${uid}`;
}

async function plaidSandboxRequest(env, endpoint, payload = {}) {
  if (env.PLAID_ENV !== "sandbox") {
    throw new Error("This integration is currently Sandbox-only.");
  }

  if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET) {
    throw new Error("Plaid credentials are missing.");
  }

  const response = await fetch(
    `https://sandbox.plaid.com${endpoint}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        client_id: env.PLAID_CLIENT_ID,
        secret: env.PLAID_SECRET
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result.error_message || "Plaid request failed."
    );
    error.code = result.error_code;
    throw error;
  }

  return result;
}

function safePlaidSandboxConnection(record) {
  return {
    environment: "sandbox",
    connected: Boolean(record),
    accounts: record?.accounts || [],
    selectedAccountId: record?.selectedAccountId || null,
    lastSyncedAt: record?.lastSyncedAt || null,
    transactions: (record?.transactions || []).filter(
      (transaction) =>
        transaction.accountId === record?.selectedAccountId
    )
  };
}

function normalizePlaidSandboxTransaction(transaction) {
  const merchantName =
    transaction.merchant_name || transaction.name || "Transaction";

  const signedAmount = Number(transaction.amount || 0);

  return {
    id: transaction.transaction_id,
    accountId: transaction.account_id,
    merchantName,
    merchantInitials: merchantName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join(""),
    amount: Math.abs(signedAmount),
    date: `${transaction.date}T12:00:00`,
    pending: Boolean(transaction.pending),
    pendingTransactionId:
      transaction.pending_transaction_id || null,
    type: signedAmount < 0 ? "credit" : "debit",
    category:
      transaction.personal_finance_category?.primary ||
      "Uncategorized",
    iconColor: "#7c5cff",
    source: "plaid-sandbox"
  };
}

async function syncPlaidSandboxTransactions(env, record) {
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
        const result = await plaidSandboxRequest(
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
            normalizePlaidSandboxTransaction(transaction)
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
    const sandboxBankRoutes = new Set([
  "/plaid/exchange-token",
  "/plaid/account",
  "/plaid/sync",
  "/plaid/status"
]);

if (sandboxBankRoutes.has(url.pathname)) {
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

  if (env.PLAID_ENV !== "sandbox") {
    return json(
      { ok: false, error: "Sandbox configuration required." },
      503,
      origin
    );
  }

  const key = plaidSandboxKey(authentication.user.uid);

  try {
    let record = await env.NOTIFICATIONSKV.get(key, "json");

    if (url.pathname === "/plaid/status") {
      return json(
        { ok: true, ...safePlaidSandboxConnection(record) },
        200,
        origin
      );
    }

    if (url.pathname === "/plaid/exchange-token") {
      // Avoid replacing an existing connection accidentally.
      if (record) {
        return json(
          {
            ok: false,
            error:
              "A Sandbox bank is already connected. Use Load or Sync instead."
          },
          409,
          origin
        );
      }

      const body = await request.json();

      if (
        typeof body.public_token !== "string" ||
        !body.public_token.startsWith("public-sandbox-")
      ) {
        return json(
          { ok: false, error: "A valid Sandbox token is required." },
          400,
          origin
        );
      }

      const exchanged = await plaidSandboxRequest(
        env,
        "/item/public_token/exchange",
        { public_token: body.public_token }
      );

      // Save immediately so a later account-fetch error does not
      // discard a successfully exchanged connection.
      record = {
        accessToken: exchanged.access_token,
        itemId: exchanged.item_id,
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

      const accountResult = await plaidSandboxRequest(
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
        { ok: false, error: "Connect a Sandbox bank first." },
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
        const accountResult = await plaidSandboxRequest(
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

      record = await syncPlaidSandboxTransactions(env, record);
    }

    await env.NOTIFICATIONSKV.put(
      key,
      JSON.stringify(record)
    );

    return json(
      { ok: true, ...safePlaidSandboxConnection(record) },
      200,
      origin
    );
  } catch (error) {
    // Do not log tokens or complete Plaid request/response objects.
    return json(
      {
        ok: false,
        error: error.message || "Sandbox banking request failed."
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

  // This first connection test must remain Sandbox-only.
  if (env.PLAID_ENV !== "sandbox") {
    return json(
      {
        ok: false,
        error: "This connection test requires PLAID_ENV=sandbox."
      },
      503,
      origin
    );
  }

  if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET) {
    return json(
      {
        ok: false,
        error: "Plaid credentials are missing in Cloudflare."
      },
      503,
      origin
    );
  }

  try {
    const response = await fetch(
      "https://sandbox.plaid.com/link/token/create",
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          client_id: env.PLAID_CLIENT_ID,
          secret: env.PLAID_SECRET,
          client_name: "Bill Beacon",
          user: {
            client_user_id: authentication.user.uid
          },
          products: ["transactions"],
          country_codes: ["US"],
          language: "en"
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.link_token) {
      return json(
        {
          ok: false,
          error:
            result.error_message ||
            "Plaid could not create a connection token.",
          code: result.error_code || null
        },
        502,
        origin
      );
    }

    return json(
      {
        ok: true,
        environment: "sandbox",
        link_token: result.link_token
      },
      200,
      origin
    );
  } catch {
    return json(
      {
        ok: false,
        error: "Could not reach Plaid. Please try again."
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

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runScheduledBillReminders(env));
  }
};