(function () {
  "use strict";

  const CARD_ID = "billReminderTestCard";

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

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

    return Number.isFinite(amount)
      ? `${name} — $${amount.toFixed(2)}`
      : name;
  }

  function getVisibleSettingsHost() {
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
          Select a bill to confirm the reminder tester can see your bill list.
          This step does not send a notification.
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
          Check Selected Bill
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

    button.addEventListener("click", () => {
      const selectedId = select.value;

      if (!selectedId) {
        status.textContent = "Choose a bill first.";
        return;
      }

      const selectedIndex = bills.findIndex(
        (bill, index) => getBillId(bill, index) === selectedId
      );

      if (selectedIndex < 0) {
        status.textContent = "That bill is no longer available. Refresh and try again.";
        return;
      }

      status.textContent = `Ready to test: ${getBillName(
        bills[selectedIndex],
        selectedIndex
      )}.`;
    });

    return card;
  }

  function addCardIfSettingsIsVisible() {
    const app = getVisibleSettingsHost();

    if (!app || document.getElementById(CARD_ID)) {
      return;
    }

    app.appendChild(buildCard());
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