/* Manual credit cards — Part 1: private creation, listing and details. */
(() => {
  "use strict";

  if (window.BillBeaconManualCards) return;

  const COLLECTION = "manualCreditCards";

  let sdkPromise = null;
  let screen = null;
  let writing = false;

  const escape = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  const sdk = () =>
    sdkPromise ||= import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    ).catch(error => {
      sdkPromise = null;
      throw error;
    });

  function session() {
    const user = window.getBillBeaconFirebaseUser?.();
    const household = window.getBillBeaconHouseholdContext?.();
    const db = window.getBillBeaconFirestore?.();

    if (!user?.uid || !db) {
      throw new Error("Please sign in first.");
    }

    if (!household?.ready || household.uid !== user.uid) {
      throw new Error(
        "Wait for your household to finish loading."
      );
    }

    return {
      uid: user.uid,
      householdId: household.householdId,
      generation: household.generation,
      db
    };
  }

  function alive(state) {
    if (
      screen !== state ||
      !state.dialog.isConnected ||
      !state.dialog.open
    ) {
      return false;
    }

    try {
      const now = session();

      return (
        now.uid === state.uid &&
        now.householdId === state.householdId &&
        now.generation === state.generation
      );
    } catch {
      return false;
    }
  }

  function assertSession(state) {
    if (!alive(state)) {
      throw new Error(
        "Account or household changed. Reopen Credit Cards."
      );
    }
  }

  function body(state, html, title = "Credit Cards") {
    if (!alive(state)) return;

    state.dialog.querySelector(
      "#bbml-dialog-title"
    ).textContent = title;

    state.dialog.querySelector(
      ".bbml-dialog-body"
    ).innerHTML = html;
  }

  const button = (label, action, id = "") => `
    <button
      type="button"
      class="bbml-outline"
      data-mcc-action="${action}"
      data-mcc-id="${escape(id)}"
    >
      ${escape(label)}
    </button>
  `;

  const note = text => `
    <p class="bbml-help">${escape(text)}</p>
  `;

  function message(state, text) {
    if (!alive(state)) return;

    const target = state.dialog.querySelector(
      "#mcc-message"
    );

    if (target) target.textContent = text;
  }

  function money(cents, currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency
      }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)} ${currency}`;
    }
  }

  function today() {
    const d = new Date();

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12);

    return (
      y >= 1900 &&
      y <= 9999 &&
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );
  }

  function hundredths(value, label, optional = false) {
    const text = String(value ?? "").trim();

    if (!text && optional) return null;

    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
      throw new Error(
        `${label}: enter a nonnegative number with up to two decimals.`
      );
    }

    const [whole, fraction = ""] = text.split(".");

    const result =
      Number(whole) * 100 +
      Number(fraction.padEnd(2, "0"));

    if (
      !Number.isSafeInteger(result) ||
      result > 1000000000000
    ) {
      throw new Error(`${label} is too large.`);
    }

    return result;
  }

  function field(
    label,
    name,
    type = "text",
    value = "",
    extra = ""
  ) {
    return `
      <label
        class="bbml-field-label"
        for="mcc-${name}"
      >
        ${label}
      </label>

      <input
        class="bbml-input"
        id="mcc-${name}"
        name="${name}"
        type="${type}"
        value="${escape(value)}"
        ${extra}
      >
    `;
  }

  function row(label, value) {
    return `
      <div class="bbml-detail">
        <span>${escape(label)}</span>
        <strong>${escape(value)}</strong>
      </div>
    `;
  }
  function estimateCardPayoff(card) {
    const balanceStart = Number(card.openingBalanceCents);
    const payment = Number(card.plannedPaymentCents);
    const apr = Number(card.aprBasisPoints);

    if (
      !Number.isSafeInteger(balanceStart) ||
      balanceStart < 0 ||
      !Number.isSafeInteger(payment) ||
      payment < 0 ||
      !Number.isSafeInteger(apr) ||
      apr < 0
    ) {
      return { status: "invalid" };
    }

    if (balanceStart === 0) {
      return { status: "zero" };
    }

    if (payment === 0) {
      return { status: "payment-needed" };
    }

    let balance = balanceStart;
    let interestTotal = 0;
    let paidTotal = 0;

    for (let month = 1; month <= 1200; month++) {
      // APR basis points / 10,000 / 12 months.
      const interest = Math.round(
        balance * apr / 120000
      );

      if (payment <= interest) {
        return { status: "too-low" };
      }

      const actualPayment = Math.min(
        payment,
        balance + interest
      );

      interestTotal += interest;
      paidTotal += actualPayment;

      balance =
        balance +
        interest -
        actualPayment;

      if (balance <= 0) {
        return {
          status: "estimated",
          months: month,
          interestCents: interestTotal,
          totalCents: paidTotal
        };
      }
    }

    return { status: "long-term" };
  }

  function payoffMonthDate(firstDate, monthsAfter) {
    const [year, month, day] = firstDate
      .split("-")
      .map(Number);

    const target = new Date(
      year,
      month - 1 + monthsAfter,
      1,
      12
    );

    const lastDay = new Date(
      target.getFullYear(),
      target.getMonth() + 1,
      0
    ).getDate();

    target.setDate(Math.min(day, lastDay));

    return target;
  }

  function showOverview(state, id) {
    const card = state.cards.get(id);

    if (!card || !alive(state)) return;

    state.view = "overview";
    state.cardId = id;
    state.serial++;

    const estimate = estimateCardPayoff(card);

    let payoffContent = "";

    if (estimate.status === "estimated") {
      const usableDate =
        validDate(card.nextDueDate) &&
        validDate(card.balanceAsOf) &&
        card.nextDueDate >= card.balanceAsOf &&
        card.nextDueDate >= today();

      let payoffDate = "Check next due date";

      if (usableDate) {
        payoffDate = payoffMonthDate(
          card.nextDueDate,
          estimate.months - 1
        ).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric"
        });
      }

      const years = Math.floor(
        estimate.months / 12
      );

      const months = estimate.months % 12;

      const duration = [
        years
          ? `${years} year${years === 1 ? "" : "s"}`
          : "",
        months
          ? `${months} month${months === 1 ? "" : "s"}`
          : ""
      ].filter(Boolean).join(" ");

      payoffContent = `
        <section class="bbml-panel">
          <h3>Your payoff estimate</h3>

          ${row("Estimated payoff", payoffDate)}

          ${row(
            "Estimated time",
            duration
          )}

          ${row(
            "Monthly payments",
            String(estimate.months)
          )}

          ${row(
            "Estimated interest",
            money(
              estimate.interestCents,
              card.currency
            )
          )}

          ${row(
            "Estimated total paid",
            money(
              estimate.totalCents,
              card.currency
            )
          )}

          ${
            usableDate
              ? ""
              : note(
                  "A payoff date needs a valid upcoming payment " +
                  "date that is not earlier than the balance date."
                )
          }
        </section>
      `;
    } else {
      const explanations = {
        zero:
          "The starting balance you entered is zero. " +
          "There is no balance to project from.",
        "payment-needed":
          "Enter a planned monthly payment to calculate " +
          "a payoff estimate.",
        "too-low":
          "The planned payment does not exceed the first " +
          "month’s estimated interest, so this model " +
          "does not produce a payoff date.",
        "long-term":
          "This plan exceeds the calculator’s " +
          "100-year limit. No payoff date is shown.",
        invalid:
          "The saved balance, APR or planned payment " +
          "could not be used for a payoff estimate."
      };

      payoffContent = `
        <section class="bbml-panel">
          <h3>Payoff estimate</h3>

          ${note(
            explanations[estimate.status] ||
            "Estimate unavailable."
          )}
        </section>
      `;
    }

    const belowMinimum =
      card.openingBalanceCents > 0 &&
      card.plannedPaymentCents <
        card.minimumPaymentCents;

    body(
      state,
      `
        <p class="bbml-source">
          Private · manually tracked
        </p>

        <section class="bbml-panel">
          <h3>
            ${escape(
              card.nickname || card.bank
            )}
          </h3>

          <p class="bbml-help">
            ${escape(card.bank)}
            •••• ${escape(card.last4)}
          </p>

          <div
            style="
              padding:12px 0 18px;
              border-bottom:1px solid var(--border);
            "
          >
            <div
              style="
                color:var(--text-secondary);
                font-size:12px;
              "
            >
              Balance entered
            </div>

            <div
              style="
                margin-top:6px;
                font-size:32px;
                line-height:1.2;
                font-weight:800;
                overflow-wrap:anywhere;
              "
            >
              ${escape(
                money(
                  card.openingBalanceCents,
                  card.currency
                )
              )}
            </div>

            <div
              style="
                margin-top:6px;
                color:var(--text-secondary);
                font-size:12px;
              "
            >
              As of ${escape(card.balanceAsOf)}
            </div>
          </div>

          ${row(
            "Purchase APR",
            (card.aprBasisPoints / 100).toFixed(2) + "%"
          )}

          ${row(
            "First-month estimated interest",
            money(
              Math.round(
                card.openingBalanceCents *
                card.aprBasisPoints /
                120000
              ),
              card.currency
            )
          )}

          ${row(
            "Your monthly payment",
            money(
              card.plannedPaymentCents,
              card.currency
            )
          )}

          ${row(
            "Current minimum",
            money(
              card.minimumPaymentCents,
              card.currency
            )
          )}

          ${row(
            "Next payment due",
            card.nextDueDate
          )}

          ${
            belowMinimum
              ? note(
                  "Your planned payment is below " +
                  "the minimum payment you entered."
                )
              : ""
          }
        </section>

        ${payoffContent}

        ${button(
          "Card Details",
          "card-information",
          id
        )}

        <div style="margin-top:12px">
          ${button(
            "Back to My Cards",
            "list"
          )}
        </div>

        <details style="margin-top:18px">
          <summary>How this estimate works</summary>

          ${note(
            "This estimate starts with your saved starting " +
            "balance and assumes the same APR and payment " +
            "each month, with no new purchases, fees or refunds. " +
            "Interest is approximated as APR divided by 12, " +
            "rounded to cents before each payment. " +
            "The first payment is assigned to your saved " +
            "next due date. It is not an issuer payoff quote."
          )}

          ${note(
            "Purchase and payment tracking has not been " +
            "added yet. Until then, this screen does not " +
            "automatically update the balance as time passes."
          )}
        </details>

        <p
          id="mcc-message"
          role="status"
          class="bbml-help"
        ></p>
      `,
      card.bank + " •••• " + card.last4
    );
  }
  function showDetails(state, id) {
    const card = state.cards.get(id);

    if (!card || !alive(state)) return;

    state.view = "details";
    state.cardId = id;
    state.serial++;

    const optionalMoney = value =>
      value == null
        ? "Not entered"
        : money(value, card.currency);

    body(
      state,
      `
        <p class="bbml-source">
          Private · manually entered · owner only
        </p>

        <section class="bbml-panel">
          <h3>${escape(card.nickname || card.bank)}</h3>

          ${row("Bank / issuer", card.bank)}

          ${row("Card", "•••• " + card.last4)}

          ${row(
            "Starting balance",
            money(card.openingBalanceCents, card.currency)
          )}

          ${row("Balance as of", card.balanceAsOf)}

          ${row(
            "Purchase APR",
            (card.aprBasisPoints / 100).toFixed(2) + "%"
          )}

          ${row(
            "Current minimum payment",
            money(card.minimumPaymentCents, card.currency)
          )}

          ${row(
            "Planned monthly payment",
            money(card.plannedPaymentCents, card.currency)
          )}

          ${row("Next payment due", card.nextDueDate)}

          ${row(
            "Credit limit",
            optionalMoney(card.creditLimitCents)
          )}

          ${row(
            "Statement balance",
            optionalMoney(card.statementBalanceCents)
          )}

          ${row(
            "Statement closing day",
            card.statementClosingDay ?? "Not entered"
          )}
        </section>

        ${note(
          "This step saves the starting information only. " +
          "Purchase/payment entry, a running balance, payoff estimates, " +
          "editing and sharing are the next steps. " +
          "It does not create or update a bill."
        )}

        ${button("Back to My Cards", "list")}

        <div style="margin-top:12px">
          ${button("Archive Card", "archive", id)}
        </div>

        <details style="margin-top:20px">
          <summary>Privacy-test card ID</summary>

          <p style="overflow-wrap:anywhere;user-select:text">
            ${escape(id)}
          </p>
        </details>

        <p
          id="mcc-message"
          role="status"
          class="bbml-help"
        ></p>
      `,
      card.bank + " •••• " + card.last4
    );
  }

  async function loadCards(state, selectedId = null) {
    if (!alive(state)) return;

    state.view = "list";
    state.cardId = null;

    const serial = ++state.serial;

    body(
      state,
      `
        <p class="bbml-help">
          Loading your private cards from the server…
        </p>
      `
    );

    try {
      const F = await sdk();

      assertSession(state);

      const query = F.query(
        F.collection(state.db, COLLECTION),
        F.where("ownerUid", "==", state.uid)
      );

      const result = await F.getDocsFromServer(query);

      if (!alive(state) || serial !== state.serial) {
        return;
      }

      state.cards = new Map(
        result.docs.map(doc => [
          doc.id,
          doc.data()
        ])
      );

      if (
        selectedId &&
        state.cards.has(selectedId)
      ) {
        return showOverview(state, selectedId);
      }

      const cards = [...state.cards]
        .filter(([, card]) => !card.archived)
        .sort((a, b) =>
          String(a[1].bank).localeCompare(
            String(b[1].bank)
          )
        );

      const rows = cards.map(([id, card]) => `
        <button
          type="button"
          class="bbml-item"
          data-mcc-action="details"
          data-mcc-id="${escape(id)}"
        >
          <span class="bbml-item-copy">
            <strong>
              ${escape(card.nickname || card.bank)}
            </strong>

            <small>
              ${escape(card.bank)}
              •••• ${escape(card.last4)}
              · Private
            </small>

            <small>
              Starting balance as of
              ${escape(card.balanceAsOf)}
            </small>
          </span>

          <span class="bbml-value">
            ${escape(
              money(
                card.openingBalanceCents,
                card.currency
              )
            )}
          </span>
        </button>
      `).join("");

      body(
        state,
        `
          <p class="bbml-source">
            My Cards · private · no bank connection
          </p>

          ${button("Add Manual Card", "new")}

          <section
            class="bbml-panel"
            style="margin-top:16px"
          >
            ${
              cards.length
                ? rows
                : `
                  <h3>No manual cards yet</h3>

                  <p class="bbml-help">
                    Add your bank, last four digits
                    and starting information.
                  </p>
                `
            }
          </section>

          ${note(
            "These accounts are independent of Bills and Paycheck Plan. " +
            "This first step lists only cards you own; " +
            "sharing is not enabled in this interface yet."
          )}

          <p
            id="mcc-message"
            role="status"
            class="bbml-help"
          ></p>
        `
      );
    } catch (error) {
      if (!alive(state) || serial !== state.serial) {
        return;
      }

      body(
        state,
        `
          <section class="bbml-panel">
            <h3>Cards could not load</h3>

            <p class="bbml-help">
              ${escape(error.message)}
            </p>
          </section>

          ${button("Retry", "list")}
        `
      );
    }
  }

  function newCard(state) {
    if (!alive(state)) return;

    if (writing) {
      message(
        state,
        "A save is still finishing. Wait before adding another card."
      );

      return;
    }

    state.view = "form";
    state.serial++;

    let currency = "USD";

    try {
      currency = Store.getSettings().currency || "USD";
    } catch {}

    const amount =
      'min="0" max="10000000000" step="0.01" ' +
      'inputmode="decimal" required';

    body(
      state,
      `
        <p class="bbml-source">
          New card · private by default
        </p>

        <form id="mcc-form" autocomplete="off">

          ${field(
            "Bank / issuer",
            "bank",
            "text",
            "",
            'maxlength="80" required'
          )}

          ${field(
            "Last four digits only",
            "last4",
            "text",
            "",
            'inputmode="numeric" pattern="[0-9]{4}" ' +
            'minlength="4" maxlength="4" required'
          )}

          ${field(
            "Nickname — optional",
            "nickname",
            "text",
            "",
            'maxlength="80"'
          )}

          ${field(
            "Currency — fixed after creation",
            "currency",
            "text",
            currency,
            "readonly required"
          )}

          ${field(
            "Starting balance",
            "balance",
            "number",
            "",
            amount
          )}

          ${field(
            "Balance as of",
            "asOf",
            "date",
            today(),
            "required"
          )}

          ${field(
            "Purchase APR (%)",
            "apr",
            "number",
            "",
            'min="0" max="1000" step="0.01" ' +
            'inputmode="decimal" required'
          )}

          ${field(
            "Current minimum payment",
            "minimum",
            "number",
            "",
            amount
          )}

          ${field(
            "Planned monthly payment",
            "planned",
            "number",
            "",
            amount
          )}

          ${field(
            "Next payment due date",
            "due",
            "date",
            "",
            "required"
          )}

          ${field(
            "Credit limit — optional",
            "limit",
            "number",
            "",
            'min="0" step="0.01" inputmode="decimal"'
          )}

          ${field(
            "Statement balance — optional",
            "statement",
            "number",
            "",
            'min="0" step="0.01" inputmode="decimal"'
          )}

          ${field(
            "Statement closing day — optional",
            "closing",
            "number",
            "",
            'min="1" max="31" step="1"'
          )}

          ${note(
            "Enter the balance as it stands on the “as of” date. " +
            "Do not enter a full card number or security code. " +
            "No information from this form is added to household bill lists."
          )}

          <p
            id="mcc-message"
            role="status"
            class="bbml-help"
          ></p>

          <button
            type="submit"
            class="bbml-outline"
            id="mcc-save"
          >
            Save Private Card
          </button>

          <div style="margin-top:12px">
            ${button("Cancel / Reload Cards", "list")}
          </div>

        </form>
      `,
      "Add Manual Card"
    );

    state.dialog.querySelector(
      "#mcc-form"
    ).addEventListener("submit", event => {
      event.preventDefault();

      void saveCard(state, event.currentTarget);
    });
  }

  async function saveCard(state, form) {
    if (
      writing ||
      !alive(state) ||
      !form.reportValidity()
    ) {
      return;
    }

    const values = Object.fromEntries(
      new FormData(form)
    );

    let attempted = false;
    let saved = false;

    const save = form.querySelector("#mcc-save");

    try {
      assertSession(state);

      if (navigator.onLine === false) {
        throw new Error(
          "Connect to the internet before saving a card."
        );
      }

      const bank = values.bank.trim();
      const last4 = values.last4.trim();
      const currency = values.currency.trim();

      if (!bank || bank.length > 80) {
        throw new Error(
          "Enter a bank name of up to 80 characters."
        );
      }

      if (!/^\d{4}$/.test(last4)) {
        throw new Error("Enter exactly four digits.");
      }

      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new Error(
          "The app currency must be a three-letter currency code."
        );
      }

      if (
        !validDate(values.asOf) ||
        !validDate(values.due)
      ) {
        throw new Error(
          "Enter valid balance and due dates."
        );
      }

      const apr = hundredths(values.apr, "APR");

      if (apr > 100000) {
        throw new Error(
          "APR must be between 0% and 1000%."
        );
      }

      const closing =
        values.closing.trim() === ""
          ? null
          : Number(values.closing);

      if (
        closing !== null &&
        (
          !Number.isInteger(closing) ||
          closing < 1 ||
          closing > 31
        )
      ) {
        throw new Error(
          "Statement closing day must be from 1 through 31."
        );
      }

      const card = {
        schemaVersion: 1,
        ownerUid: state.uid,
        bank,
        last4,
        nickname: values.nickname.trim(),
        currency,

        openingBalanceCents: hundredths(
          values.balance,
          "Starting balance"
        ),

        balanceAsOf: values.asOf,
        aprBasisPoints: apr,

        minimumPaymentCents: hundredths(
          values.minimum,
          "Minimum payment"
        ),

        plannedPaymentCents: hundredths(
          values.planned,
          "Planned payment"
        ),

        nextDueDate: values.due,

        creditLimitCents: hundredths(
          values.limit,
          "Credit limit",
          true
        ),

        statementBalanceCents: hundredths(
          values.statement,
          "Statement balance",
          true
        ),

        statementClosingDay: closing,

        visibility: "private",
        householdId: null,
        sharedWith: {},
        archived: false
      };

      writing = true;

      save.disabled = true;
      save.textContent = "Saving…";

      message(
        state,
        "Saving to your private card collection. " +
        "If you close, check My Cards before adding it again."
      );

      const F = await sdk();

      assertSession(state);

      const reference = F.doc(
        F.collection(state.db, COLLECTION)
      );

      attempted = true;

      await F.setDoc(reference, {
        ...card,
        createdAt: F.serverTimestamp(),
        updatedAt: F.serverTimestamp()
      });

      saved = true;

      if (alive(state)) {
        await loadCards(state, reference.id);
      }
    } catch (error) {
      message(
        state,
        (
          saved
            ? "The card was saved, but reloading did not finish. Reload Cards. "
            : attempted
              ? "Save was not confirmed. Reload Cards before trying again to avoid duplicates. "
              : ""
        ) + error.message
      );
    } finally {
      writing = false;

      if (save.isConnected) {
        save.disabled = attempted;

        save.textContent = attempted
          ? "Reload Cards to check save"
          : "Save Private Card";
      }
    }
  }

  async function archiveCard(state, id) {
    if (writing || !alive(state)) return;

    const card = state.cards.get(id);

    if (!card) return;

    if (!confirm(
      `Archive ${card.bank} •••• ${card.last4}? ` +
      "This hides it from My Cards and preserves its records."
    )) {
      return;
    }

    writing = true;

    try {
      const F = await sdk();

      assertSession(state);

      await F.updateDoc(
        F.doc(state.db, COLLECTION, id),
        {
          archived: true,
          updatedAt: F.serverTimestamp()
        }
      );

      if (alive(state)) {
        await loadCards(state);
      }
    } catch (error) {
      message(
        state,
        "Archive was not confirmed. " +
        "Reload Cards before retrying. " +
        error.message
      );
    } finally {
      writing = false;
    }
  }

  function open() {
    try {
      const context = session();
      const more = window.BillBeaconMoreLive;

      if (!more?.open) {
        throw new Error(
          "Load the app-data More file before this script."
        );
      }

      more.open("cards");

      const dialog = document.getElementById(
        "bbml-dialog"
      );

      if (!dialog?.open) {
        throw new Error(
          "The More popup could not open."
        );
      }

      const state = {
        ...context,
        dialog,
        cards: new Map(),
        serial: 0,
        view: "list",
        cardId: null
      };

      screen = state;

      dialog.addEventListener("billbeacon:popup-back", event => {
        if (screen !== state || !alive(state)) return;

        if (state.view === "details") {
          event.preventDefault();
          showOverview(state, state.cardId);
          return;
        }

        if (state.view === "overview") {
          event.preventDefault();
          void loadCards(state);
          return;
        }

        if (state.view === "form") {
          event.preventDefault();

          if (confirm("Discard this unsaved card form?")) {
            void loadCards(state);
          }
        }

        // On My Cards, allow the existing close-to-More behavior.
      });

      const eyebrow = dialog.querySelector(
        ".bbml-dialog-header .bbml-eyebrow"
      );

      if (eyebrow) {
        eyebrow.textContent = "MANUAL CREDIT CARDS";
      }

      dialog.addEventListener(
        "close",
        () => {
          if (screen === state) screen = null;
        },
        { once: true }
      );

      void loadCards(state);
    } catch (error) {
      alert(error.message);
    }
  }

  function click(event) {
    if (
      !(event.target instanceof Element) ||
      event.target.closest(
        "[data-bb-drag-preview],[data-bb-copy-id]"
      )
    ) {
      return;
    }

    const more = event.target.closest(
      "[data-bbml-action]"
    );

    if (
      more?.dataset.bbmlAction === "open:cards"
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();

      open();
      return;
    }

    const state = screen;

    if (
      !state ||
      !alive(state) ||
      !state.dialog.contains(event.target)
    ) {
      return;
    }

    if (
      more?.dataset.bbmlAction === "refresh"
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (
        state.view === "form" &&
        !confirm(
          "Discard this unsaved card form and reload cards?"
        )
      ) {
        return;
      }

      void loadCards(
        state,
        ["overview", "details"].includes(state.view)
          ? state.cardId
          : null
      );

      return;
    }

    const control = event.target.closest(
      "[data-mcc-action]"
    );

    if (!control) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const action = control.dataset.mccAction;
    const id = control.dataset.mccId;

    if (action === "list") {
      void loadCards(state);
    } else if (action === "new") {
      newCard(state);
    } else if (action === "details") {
      showOverview(state, id);
    } else if (action === "card-information") {
      showDetails(state, id);
    } else if (action === "overview") {
      showOverview(state, id);
    } else if (action === "archive") {
      void archiveCard(state, id);
    }
  }

  function invalidate() {
    const state = screen;

    if (!state || alive(state)) return;

    screen = null;
    state.cards.clear();

    if (state.dialog.open) {
      state.dialog.close();
    }

    state.dialog.remove();
  }

  document.addEventListener(
    "click",
    click,
    true
  );

  for (const name of [
    "billbeacon:signed-out",
    "billbeacon:authenticated",
    "billbeacon:household-ready",
    "billbeacon:sync-status"
  ]) {
    window.addEventListener(
      name,
      invalidate
    );
  }

  window.BillBeaconManualCards = Object.freeze({
    version: "1.0.0-private-setup",

    open,

    async checkRead(id) {
      const context = session();
      const F = await sdk();

      if (
        typeof id !== "string" ||
        !id ||
        id.includes("/")
      ) {
        throw new Error(
          "Enter a card ID, not a path."
        );
      }

      if (session().uid !== context.uid) {
        throw new Error(
          "Account changed. Retry."
        );
      }

      try {
        const result = await F.getDocFromServer(
          F.doc(
            context.db,
            COLLECTION,
            id
          )
        );

        return {
          allowed: true,
          exists: result.exists()
        };
      } catch (error) {
        if (
          error.code === "permission-denied"
        ) {
          return {
            allowed: false,
            reason: "permission-denied"
          };
        }

        throw error;
      }
    }
  });
})();