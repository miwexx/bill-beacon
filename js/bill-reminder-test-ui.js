(function () {
  "use strict";

  const CARD_ID = "billReminderTestCard";
  const WORKER_URL =
    "https://bill-beacon-notifications.rodz-m-1990.workers.dev";

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