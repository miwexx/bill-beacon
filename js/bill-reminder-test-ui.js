(function () {
  "use strict";

  const CARD_ID = "billReminderTestCard";
  const WORKER_URL =
    "https://bill-tracker-reminders.rodz-m-1990.workers.dev";

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getBills() {
    try {
      if (
        window.Store &&
        typeof window.Store.getBills === "function"
      ) {
        const storeBills = window.Store.getBills();

        if (Array.isArray(storeBills)) {
          return storeBills;
        }
      }

      const savedBills = JSON.parse(localStorage.getItem("bills") || "[]");

      return Array.isArray(savedBills) ? savedBills : [];
    } catch (error) {
      console.error("Could not read saved bills:", error);
      return [];
    }
  }

  function getBillId(bill, index) {
    return String(bill?.id ?? bill?.billId ?? index);
  }

  function getBillName(bill, index) {
    return String(
      bill?.name ??
      bill?.title ??
      bill?.merchant ??
      bill?.payee ??
      `Bill ${index + 1}`
    );
  }

  function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  }

  function formatDueDate(value) {
    const rawDate = String(value || "").trim();

    if (!rawDate) {
      return "";
    }

    const parsedDate = new Date(`${rawDate}T12:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(parsedDate);
  }

  function formatBillOption(bill, index) {
    const billName = getBillName(bill, index);
    const amount = formatMoney(bill?.amount);

    return amount ? `${billName} — ${amount}` : billName;
  }

 function getSettingsPage() {
  const app = document.getElementById("app");

  if (!app || app.offsetParent === null) {
    return null;
  }

  const pageText = app.innerText || "";

  if (!pageText.includes("Settings")) {
    return null;
  }

  return app;
}

 function findInsertBeforeElement(app) {
  const tabLabels = [
    "Dashboard",
    "Recurring",
    "Bills",
    "Insights",
    "Settings"
  ];

  const navigationCandidate = Array.from(
    app.querySelectorAll("nav, div, section")
  ).find((element) => {
    const text = (element.innerText || "").trim();

    return (
      text.includes(tabLabels[0]) &&
      text.includes(tabLabels[1]) &&
      text.includes(tabLabels[2]) &&
      text.includes(tabLabels[3]) &&
      text.includes(tabLabels[4])
    );
  });

  return navigationCandidate || null;
}

  async function getPushSubscription() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("This browser does not support service workers.");
    }

    const registration = await navigator.serviceWorker.ready;

    return registration.pushManager.getSubscription();
  }

async function getFirebaseToken() {
  if (typeof window.getBillBeaconFirebaseToken === "function") {
    const token = await window.getBillBeaconFirebaseToken();

    if (token) {
      return token;
    }
  }

  if (
    window.BillBeaconAuth &&
    typeof window.BillBeaconAuth.getIdToken === "function"
  ) {
    const token = await window.BillBeaconAuth.getIdToken();

    if (token) {
      return token;
    }
  }

  return "";
}
  function buildCard() {
    const bills = getBills();
    const card = document.createElement("section");

    card.id = CARD_ID;
    card.className = "settings-section";

    const options = bills
      .map((bill, index) => {
        const id = getBillId(bill, index);
        const label = formatBillOption(bill, index);

        return `
          <option value="${escapeHtml(id)}">
            ${escapeHtml(label)}
          </option>
        `;
      })
      .join("");

    card.innerHTML = `
      <div class="section-header">Bill Reminder Testing</div>

      <div class="card card-pad">
        <p style="margin-top: 0;">
          Select a bill and send a one-time test reminder to this device.
        </p>

        <label
          for="billReminderTestSelect"
          style="display: block; margin-bottom: 8px;"
        >
          Bill
        </label>

        <select
          id="billReminderTestSelect"
          style="width: 100%; margin-bottom: 12px;"
          ${bills.length ? "" : "disabled"}
        >
          ${
            bills.length
              ? `<option value="">Choose a bill…</option>${options}`
              : `<option value="">No bills found yet</option>`
          }
        </select>

        <button
          id="billReminderTestButton"
          class="btn btn-primary"
          type="button"
          style="width: 100%;"
          ${bills.length ? "" : "disabled"}
        >
          Send Test Reminder
        </button>

        <p
          id="billReminderTestStatus"
          role="status"
          aria-live="polite"
          style="min-height: 20px; margin: 12px 0 0;"
        ></p>
      </div>
    `;

    const select = card.querySelector("#billReminderTestSelect");
    const button = card.querySelector("#billReminderTestButton");
    const status = card.querySelector("#billReminderTestStatus");

    button.addEventListener("click", async () => {
      const selectedId = select.value;

      if (!selectedId) {
        status.textContent = "Choose a bill first.";
        return;
      }

      const billsNow = getBills();

      const selectedIndex = billsNow.findIndex(
        (bill, index) => getBillId(bill, index) === selectedId
      );

      if (selectedIndex < 0) {
        status.textContent =
          "That bill is no longer available. Refresh and try again.";
        return;
      }

      const bill = billsNow[selectedIndex];
      const billName = getBillName(bill, selectedIndex);
      const amount = Number(bill?.amount);
      const dueDate = String(
        bill?.nextDueDate ??
        bill?.dueDate ??
        bill?.due ??
        ""
      ).trim();

      if (!Number.isFinite(amount)) {
        status.textContent =
          "This bill needs a valid amount before it can be tested.";
        return;
      }

      if (!dueDate) {
        status.textContent =
          "This bill needs a due date before it can be tested.";
        return;
      }

      const token = await getFirebaseToken();

if (!token) {
  status.textContent =
    "Your sign-in session is not ready. Refresh the app and try again.";
  return;
}

      const originalButtonText = button.textContent;

      try {
        button.disabled = true;
        button.textContent = "Sending…";
        status.textContent = "Preparing test reminder…";

        const subscription = await getPushSubscription();

        if (!subscription) {
          throw new Error(
            "Notifications are not enabled on this device. Enable them first, then try again."
          );
        }

        
        const amountText = formatMoney(amount);
        const dueDateText = formatDueDate(dueDate);
        const message = `${billName} is due ${dueDateText}. ${amountText}`.trim();

        status.textContent = "Sending test reminder…";

        const response = await fetch(`${WORKER_URL}/test-bill-reminder`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            bill: {
              id: getBillId(bill, selectedIndex),
              name: billName,
              amount,
              dueDate
            },
            message
          })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
            `The notification Worker returned status ${response.status}.`
          );
        }

        status.textContent =
          "Test reminder sent. Check your device notification.";
      } catch (error) {
        console.error("Bill reminder test failed:", error);

        status.textContent =
          error?.message ||
          "The test reminder could not be sent. Try again.";
      } finally {
        button.disabled = false;
        button.textContent = originalButtonText;
      }
    });

    return card;
  }

  function addCardIfSettingsIsVisible() {
    const app = getSettingsPage();

    if (!app || document.getElementById(CARD_ID)) {
      return;
    }

    const card = buildCard();
    const insertBefore = findInsertBeforeElement(app);

    if (insertBefore) {
      app.insertBefore(card, insertBefore);
    } else {
      app.appendChild(card);
    }
  }

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(addCardIfSettingsIsVisible);
  });

  function start() {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    addCardIfSettingsIsVisible();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();