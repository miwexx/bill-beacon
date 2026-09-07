(function () {
  "use strict";

  const CARD_ID = "billReminderTestCard";

  function getBills() {
    const possibleSources = [
      window.bills,
      window.appState?.bills,
      window.state?.bills,
      window.store?.bills
    ];

    for (const source of possibleSources) {
      if (Array.isArray(source)) {
        return source;
      }
    }

    return [];
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

  function formatBillOption(bill, index) {
    const name = getBillName(bill, index);
    const amount = Number(bill?.amount);

    if (Number.isFinite(amount)) {
      return `${name} — $${amount.toFixed(2)}`;
    }

    return name;
  }

  function findSettingsContainer() {
    const selectors = [
      "#settingsView",
      "#settings",
      "[data-view='settings']",
      ".settings-page",
      ".settings-content",
      ".page-content",
      "main"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);

      if (element && element.offsetParent !== null) {
        return element;
      }
    }

    return null;
  }

  function looksLikeSettingsPage() {
    const visibleText = document.body?.innerText || "";

    return (
      visibleText.includes("Settings") &&
      !document.getElementById(CARD_ID)
    );
  }

  function buildCard() {
    const bills = getBills();
    const section = document.createElement("section");

    section.id = CARD_ID;
    section.style.cssText = [
      "margin-top: 24px",
      "padding: 16px",
      "border: 1px solid rgba(128, 128, 128, 0.35)",
      "border-radius: 14px",
      "background: rgba(128, 128, 128, 0.06)"
    ].join(";");

    const options = bills
      .map((bill, index) => {
        const id = getBillId(bill, index);
        const label = formatBillOption(bill, index);

        return `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`;
      })
      .join("");

    section.innerHTML = `
      <h3 style="margin: 0 0 8px;">Bill Reminder Testing</h3>
      <p style="margin: 0 0 14px; opacity: 0.75;">
        Select a bill to confirm the reminder tester can access your bill list.
        This does not send a notification yet.
      </p>

      <label for="billReminderTestSelect" style="display: block; margin-bottom: 6px;">
        Bill
      </label>

      <select
        id="billReminderTestSelect"
        style="width: 100%; padding: 10px; border-radius: 10px; margin-bottom: 12px;"
        ${bills.length ? "" : "disabled"}
      >
        ${
          bills.length
            ? `<option value="">Choose a bill…</option>${options}`
            : `<option value="">No bills were found yet</option>`
        }
      </select>

      <button
        id="billReminderTestButton"
        type="button"
        style="width: 100%; padding: 11px; border-radius: 10px; cursor: pointer;"
        ${bills.length ? "" : "disabled"}
      >
        Check Selected Bill
      </button>

      <p
        id="billReminderTestStatus"
        role="status"
        style="min-height: 20px; margin: 12px 0 0; opacity: 0.8;"
      ></p>
    `;

    const select = section.querySelector("#billReminderTestSelect");
    const button = section.querySelector("#billReminderTestButton");
    const status = section.querySelector("#billReminderTestStatus");

    button.addEventListener("click", () => {
      const selectedId = select.value;

      if (!selectedId) {
        status.textContent = "Choose a bill first.";
        return;
      }

      const selectedIndex = bills.findIndex(
        (bill, index) => getBillId(bill, index) === selectedId
      );

      if (selectedIndex === -1) {
        status.textContent = "That bill could not be found. Refresh and try again.";
        return;
      }

      status.textContent = `Ready to test: ${getBillName(
        bills[selectedIndex],
        selectedIndex
      )}.`;
    });

    return section;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function addBillReminderTestCard() {
    if (!looksLikeSettingsPage()) {
      return;
    }

    const container = findSettingsContainer();

    if (!container) {
      return;
    }

    container.appendChild(buildCard());
  }

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(addBillReminderTestCard);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener("DOMContentLoaded", addBillReminderTestCard);
  window.addEventListener("hashchange", addBillReminderTestCard);

  window.BillBeaconReminderTester = {
    refresh: addBillReminderTestCard
  };
})();