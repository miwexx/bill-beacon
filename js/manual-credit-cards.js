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

    const dialog = state.dialog;
    const swipe = window.BillBeaconMorePopupSwipe;

    state.swipeScreens ||= new Map();

    const cardKey = state.view === "list"
      ? ""
      : state.cardId || "";

    const nextKey = `${state.view}:${cardKey}`;

    // Capture the outgoing screen before replacing its contents.
    if (
      state.renderedScreenKey &&
      state.renderedScreenKey !== nextKey &&
      typeof swipe?.snapshot === "function"
    ) {
      const previous = swipe.snapshot(dialog);

      if (previous) {
        state.swipeScreens.set(
          state.renderedScreenKey,
          previous
        );
      }
    }

    dialog.querySelector(
      "#bbml-dialog-title"
    ).textContent = title;

    dialog.querySelector(
      ".bbml-dialog-body"
    ).innerHTML = html;

    state.renderedScreenKey = nextKey;
    dialog.dataset.mccView = state.view;

    dialog.bbSwipeBackPreview = () => {
      if (!alive(state)) return null;

      const parentKey =
        state.view === "details" ||
        state.view === "purchase"
          ? `overview:${state.cardId}`
          : state.view === "overview" ||
            state.view === "form"
              ? "list:"
              : null;

      return parentKey
        ? state.swipeScreens.get(parentKey) || null
        : null;
    };
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
    function cardTotals(card) {
    const totals = {
      balanceCents: card.openingBalanceCents,
      paymentsCents: 0,
      excluded: 0
    };

    if (!Number.isSafeInteger(totals.balanceCents)) {
      throw new Error("The starting balance is invalid.");
    }

    for (const entry of card.transactions || []) {
      if (entry.voided) continue;

      if (
        !validDate(entry.date) ||
        !Number.isSafeInteger(entry.amountCents) ||
        ![
          "purchase", "payment", "refund",
          "interest", "fee", "adjustment"
        ].includes(entry.type)
      ) {
        throw new Error("A saved transaction needs review.");
      }

      // The starting balance already covers earlier activity.
      // Future-dated entries do not affect today's balance.
      if (
        entry.date < card.balanceAsOf ||
        entry.date > today()
      ) {
        totals.excluded++;
        continue;
      }

      const decreasesBalance =
        entry.type === "payment" ||
        entry.type === "refund";

      totals.balanceCents += decreasesBalance
        ? -entry.amountCents
        : entry.amountCents;

      if (entry.type === "payment") {
        totals.paymentsCents += entry.amountCents;
      }

      if (
        !Number.isSafeInteger(totals.balanceCents) ||
        !Number.isSafeInteger(totals.paymentsCents)
      ) {
        throw new Error("Transaction totals are too large.");
      }
    }

    return totals;
  }

  function addPurchase(state, id) {
    const card = state.cards.get(id);

    if (!alive(state) || !card || card.archived) return;

    if (writing) {
      message(state, "A save is still finishing.");
      return;
    }

    state.view = "purchase";
    state.cardId = id;
    state.serial++;

    body(
      state,
      `
        <p class="bbml-source">
          ${escape(card.bank)} •••• ${escape(card.last4)}
        </p>

        <form id="mcc-purchase-form" autocomplete="off">
          ${field(
            "Purchase amount",
            "purchaseAmount",
            "number",
            "",
            'min="0.01" max="10000000000" step="0.01" ' +
            'inputmode="decimal" required'
          )}

          ${field(
            "Purchase date",
            "purchaseDate",
            "date",
            today(),
            `min="${escape(card.balanceAsOf)}" ` +
            `max="${today()}" required`
          )}

          ${field(
            "Merchant / description — optional",
            "purchaseDescription",
            "text",
            "",
            'maxlength="500"'
          )}

          ${note(
            "Only add purchases that are not already included " +
            "in your starting balance. The same applies to " +
            "purchases made on the starting-balance date."
          )}

          <p id="mcc-message"
             class="bbml-help"
             role="status"></p>

          <button type="submit"
                  class="bbml-outline"
                  id="mcc-purchase-save">
            Save Purchase
          </button>

          <div style="margin-top:12px">
            ${button("Cancel", "cancel-purchase", id)}
          </div>
        </form>
      `,
      "Add Purchase"
    );

    const form = state.dialog.querySelector(
      "#mcc-purchase-form"
    );

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (
        writing ||
        !alive(state) ||
        !form.reportValidity()
      ) {
        return;
      }

      const save = form.querySelector(
        "#mcc-purchase-save"
      );

      let attempted = false;

      try {
        const values = new FormData(form);

        const amountCents = hundredths(
          values.get("purchaseAmount"),
          "Purchase amount"
        );

        const date = String(
          values.get("purchaseDate") || ""
        );

        const description = String(
          values.get("purchaseDescription") || ""
        ).trim();

        if (amountCents <= 0) {
          throw new Error("Enter an amount greater than zero.");
        }

        if (
          !validDate(date) ||
          date < card.balanceAsOf ||
          date > today()
        ) {
          throw new Error(
            "Use a date from the starting-balance date through today."
          );
        }

        if (description.length > 500) {
          throw new Error(
            "Keep the description within 500 characters."
          );
        }

        if (navigator.onLine === false) {
          throw new Error("Connect before saving a purchase.");
        }

        writing = true;
        save.disabled = true;
        save.textContent = "Saving…";

        const F = await sdk();

        assertSession(state);

        if (
          state.view !== "purchase" ||
          !form.isConnected
        ) {
          throw new Error("Purchase form closed. Reopen it.");
        }

        const reference = F.doc(
          F.collection(
            state.db,
            COLLECTION,
            id,
            "transactions"
          )
        );

        attempted = true;

        await F.setDoc(reference, {
          type: "purchase",
          amountCents,
          date,
          description,
          voided: false,
          voidedAt: null,
          createdAt: F.serverTimestamp(),
          updatedAt: F.serverTimestamp()
        });

        if (alive(state)) {
          await loadCards(state, id);
        }
      } catch (error) {
        console.error("Manual-card purchase failed:", error);

        message(
          state,
          (
            attempted
              ? "Save may or may not have completed. " +
                "Cancel and refresh the card before adding it again. "
              : ""
          ) + error.message
        );
      } finally {
        writing = false;

        if (save.isConnected) {
          save.disabled = attempted;
          save.textContent = attempted
            ? "Refresh card to check save"
            : "Save Purchase";
        }
      }
    });
  }

  async function reversePurchase(state, entryId) {
    if (writing || !alive(state)) return;

    const id = state.cardId;
    const card = state.cards.get(id);

    const entry = card?.transactions?.find(
      item => item.id === entryId
    );

    if (
      !entry ||
      entry.type !== "purchase" ||
      entry.voided
    ) {
      return;
    }

    if (!confirm(
      `Reverse this ${money(entry.amountCents, card.currency)} ` +
      "purchase? It will remain in history but stop affecting the balance."
    )) {
      return;
    }

    writing = true;

    try {
      if (navigator.onLine === false) {
        throw new Error("Connect before reversing a purchase.");
      }

      const F = await sdk();

      assertSession(state);

      await F.updateDoc(
        F.doc(
          state.db,
          COLLECTION,
          id,
          "transactions",
          entryId
        ),
        {
          voided: true,
          voidedAt: F.serverTimestamp(),
          updatedAt: F.serverTimestamp()
        }
      );

      if (alive(state)) {
        await loadCards(state, id);
      }
    } catch (error) {
      console.error("Purchase reversal failed:", error);

      message(
        state,
        "Reversal was not confirmed. Refresh before retrying. " +
        error.message
      );
    } finally {
      writing = false;
    }
  }
    function showOverview(state, id) {
    const card = state.cards.get(id);

    if (!card || !alive(state)) return;

    state.view = "overview";
    state.cardId = id;
    state.serial++;

    let totals;

    try {
      totals = cardTotals(card);
    } catch (error) {
      body(
        state,
        note(error.message) +
        button("Reload Cards", "list")
      );
      return;
    }

    const debtCents = Math.max(0, totals.balanceCents);

    // Supply the current tracked debt to the existing calculator.
    // This does NOT change the saved starting balance.
    const estimate = estimateCardPayoff({
      ...card,
      openingBalanceCents: debtCents
    });

    let payoffContent;

    if (estimate.status === "estimated") {
      const usableDate =
        validDate(card.nextDueDate) &&
        card.nextDueDate >= today() &&
        card.nextDueDate >= card.balanceAsOf;

      const payoffDate = usableDate
        ? payoffMonthDate(
            card.nextDueDate,
            estimate.months - 1
          ).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric"
          })
        : "Check next payment date";

            payoffContent = `
        ${row("Estimated payoff", payoffDate)}

        ${row(
          "Estimated payments remaining",
          String(estimate.months)
        )}
      `;
    } else {
      const explanations = {
        zero: totals.balanceCents < 0
          ? "The tracked account has a credit balance."
          : "The tracked balance is zero.",
        "payment-needed":
          "A planned monthly payment is needed for a payoff estimate.",
        "too-low":
          "The planned payment does not exceed the first month's estimated interest.",
        "long-term":
          "This repayment plan exceeds the calculator's 100-year limit.",
        invalid:
          "The saved balance, APR or planned payment needs review."
      };

      payoffContent = note(
        explanations[estimate.status] ||
        "Estimate unavailable."
      );
    }

    const purchases = (card.transactions || [])
      .filter(entry => entry.type === "purchase")
      .sort((a, b) =>
        b.date.localeCompare(a.date) ||
        (b.createdAt?.seconds || 0) -
        (a.createdAt?.seconds || 0) ||
        a.id.localeCompare(b.id)
      );

    const history = purchases.map(entry => `
      <section class="bbml-panel">
        ${row(
          entry.voided ? "Reversed purchase" : "Purchase",
          money(entry.amountCents, card.currency)
        )}

        ${row("Date", entry.date)}

        ${note(entry.description || "No description")}

        ${
          entry.voided
            ? note("Preserved in history; excluded from balance.")
            : button(
                "Reverse Purchase",
                "reverse-purchase",
                entry.id
              )
        }
      </section>
    `).join("");

    body(
      state,
      `
        <p class="bbml-source">
          Private · manually tracked · not bank-connected
        </p>

        <section class="bbml-panel">
          <h3>${escape(card.nickname || card.bank)}</h3>

          ${note(
            card.bank + " •••• " + card.last4
          )}

          <div style="
            padding:12px 0 18px;
            border-bottom:1px solid var(--border);
          ">
            <div class="bbml-help">Tracked balance</div>

            <div style="
              margin-top:6px;
              font-size:32px;
              line-height:1.2;
              font-weight:800;
              overflow-wrap:anywhere;
            ">
              ${escape(
                money(totals.balanceCents, card.currency)
              )}
            </div>

            ${note(
              "Starting balance plus recorded activity through " +
              today() + ". This is not a verified issuer balance."
            )}
          </div>

          ${row(
            "Original starting balance",
            money(card.openingBalanceCents, card.currency)
          )}

  

          ${row(
            "Purchase APR",
            (card.aprBasisPoints / 100).toFixed(2) + "%"
          )}

          ${row(
            "Estimated interest per payment",
            money(
              Math.round(
                debtCents * card.aprBasisPoints / 120000
              ),
              card.currency
            )
          )}

          ${row(
            "Current minimum",
            money(card.minimumPaymentCents, card.currency)
          )}

          ${
            debtCents > 0 &&
            card.plannedPaymentCents < card.minimumPaymentCents
              ? note(
                  "Your planned payment is below the minimum entered."
                )
              : ""
          }

          ${
            totals.excluded
              ? note(
                  totals.excluded +
                  " active transaction(s) fall before the starting " +
                  "balance date or after today and are excluded."
                )
              : ""
          }
          <div style="
            margin-top:12px;
            padding-top:12px;
            border-top:1px solid var(--border);
          ">
            ${payoffContent}
          </div>
        </section>

        <div style="
          display:grid;
          grid-template-columns:minmax(0, 1fr);
          gap:10px;
          margin-top:12px;
        ">
          ${button("Add Purchase", "add-purchase", id)}
          ${button("Card Details", "card-information", id)}
        </div>

        <div style="margin-top:12px">
          ${button("Back to My Cards", "list")}
        </div>

        <details style="margin-top:18px">
          <summary>Purchase history (${purchases.length})</summary>
          ${history || note("No purchases recorded yet.")}
        </details>

        <details style="margin-top:18px">
          <summary>How this estimate works</summary>

          ${note(
            "The estimate starts from the transaction-adjusted " +
            "tracked balance. It assumes the same APR and planned " +
            "payment each month, with no further purchases, fees " +
            "or refunds. Monthly interest is approximated as " +
            "APR divided by 12 and rounded to cents."
          )}

          ${note(
            "Projected interest is not posted to the transaction " +
            "history or automatically added to the tracked balance. " +
            "Actual interest and fees must be recorded separately. " +
            "The projection's first payment uses the saved next " +
            "payment date. This is not an issuer payoff quote."
          )}

          ${note(
            "Automatic bill-payment linking is not enabled yet."
          )}
        </details>

        <p id="mcc-message"
           role="status"
           class="bbml-help"></p>
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
            "Purchase APR",
            (card.aprBasisPoints / 100).toFixed(2) + "%"
          )}

          ${row(
            "Current minimum payment",
            money(card.minimumPaymentCents, card.currency)
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
          "These are your saved starting details. " +
          "Open the Overview for the transaction-adjusted balance, " +
          "purchase entry and payoff estimate. " +
          "Automatic bill linking, card editing and sharing controls " +
          "are not enabled yet."
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

      const loadedCards = [];

      for (const cardDoc of result.docs) {
        assertSession(state);

        if (serial !== state.serial) return;

        const card = cardDoc.data();

        const entries = await F.getDocsFromServer(
          F.collection(
            state.db,
            COLLECTION,
            cardDoc.id,
            "transactions"
          )
        );

        assertSession(state);

        if (serial !== state.serial) return;

        loadedCards.push([
          cardDoc.id,
          {
            ...card,
            transactions: entries.docs.map(entryDoc => ({
              ...entryDoc.data(),
              id: entryDoc.id
            }))
          }
        ]);
      }

      state.cards = new Map(loadedCards);

      if (
        selectedId &&
        state.cards.has(selectedId)
      ) {
        return showOverview(state, selectedId);
      }

            const sourceBills = creditCardSourceBills();

      const cards = [...state.cards]
        .filter(([, card]) =>
          !card.archived &&
          (
            !card.sourceBill ||
            (
              card.sourceBill.householdId === state.householdId &&
              sourceBills.has(card.sourceBill.billId)
            )
          )
        )
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
              Tracked balance through
              ${escape(today())}
            </small>
          </span>

          <span class="bbml-value">
            ${escape(
              money(
                cardTotals(card).balanceCents,
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

          ${billSetupRows(state)}

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
  function creditCardSourceBills() {
    const bills = Store.getBills();

    if (!Array.isArray(bills)) {
      throw new Error("The bill list could not be read.");
    }

    return new Map(
      bills
        .filter(bill =>
          bill &&
          typeof bill.id === "string" &&
          bill.category === "creditcards" &&
          !bill.archived &&
          !bill.archivedAt &&
          !bill.cancelled &&
          !bill.cancelledAt &&
          !bill.installmentPlanId &&
          !bill.splitPaymentParentId
        )
        .map(bill => [bill.id, bill])
    );
  }

  function billSetupRows(state) {
    const linkedBillIds = new Set(
      [...state.cards.values()]
        .filter(card =>
          card.sourceBill?.householdId === state.householdId
        )
        .map(card => card.sourceBill.billId)
    );

    const bills = [...creditCardSourceBills().values()]
      .filter(bill => !linkedBillIds.has(bill.id))
      .sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      );

    if (!bills.length) return "";

    return `
      <section class="bbml-panel" style="margin-top:16px">
        <h3>From your Bills</h3>

        ${note(
          "These are shared bill records, not completed card " +
          "accounts. Finish setup only for cards belonging to " +
          "the person currently signed in."
        )}

        ${bills.map(bill => `
          <div style="
            padding:14px 0;
            border-bottom:1px solid var(--border);
          ">
            <div style="font-weight:750">
              ${escape(bill.name || "Credit-card bill")}
            </div>

            ${note(
              "Balance and APR not entered. " +
              "The bill amount is a scheduled payment, not debt."
            )}

            ${button(
              "Finish Account Setup",
              "setup-bill",
              bill.id
            )}
          </div>
        `).join("")}
      </section>
    `;
  }

  function setupBillCard(state, billId) {
    if (!alive(state) || writing) return;

    const bill = creditCardSourceBills().get(billId);

    if (!bill) {
      message(state, "That credit-card bill is no longer active.");
      return;
    }

    const alreadyLinked = [...state.cards.values()].some(card =>
      card.sourceBill?.householdId === state.householdId &&
      card.sourceBill?.billId === billId
    );

    if (alreadyLinked) {
      message(state, "This bill already has a card account.");
      return;
    }

    if (!confirm(
      "This creates a private card owned by the currently " +
      "signed-in person. Continue only if this is their card."
    )) {
      return;
    }

    newCard(state);

    const form = state.dialog.querySelector("#mcc-form");

    if (!form) return;

    form.dataset.mccBillId = billId;
    form.dataset.mccBillHouseholdId = state.householdId;

    const set = (name, value) => {
      const input = form.elements.namedItem(name);

      if (input) input.value = value;
    };

    set("nickname", String(bill.name || "").slice(0, 80));

    // A scheduled bill payment is not an account balance,
    // a verified minimum payment, or an APR.
    set("bank", "");
    set("last4", "");
    set("balance", "");
    set("apr", "");
    set("minimum", "");

    const amount = Number(bill.amount);

    set(
      "planned",
      Number.isFinite(amount) && amount >= 0
        ? amount.toFixed(2)
        : ""
    );

    let due = "";

    try {
      due = typeof financialDateKey === "function"
        ? financialDateKey(bill.dueDate)
        : String(bill.dueDate || "").slice(0, 10);
    } catch {}

    set("due", validDate(due) ? due : "");

    const information = document.createElement("p");
    information.className = "bbml-help";
    information.textContent =
      "Imported from Bills: " + String(bill.name || "Credit card") +
      ". The scheduled amount was copied into planned payment. " +
      "Enter the actual account balance, APR, minimum payment, " +
      "issuer and last four digits before saving.";

    form.prepend(information);
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

    const sourceBillId = form.dataset.mccBillId || null;

    const sourceHouseholdId =
      form.dataset.mccBillHouseholdId || null;

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
            if (sourceBillId) {
        if (
          sourceHouseholdId !== state.householdId ||
          !creditCardSourceBills().has(sourceBillId)
        ) {
          throw new Error(
            "The source bill or household changed. Reopen setup."
          );
        }

        card.sourceBill = {
          householdId: sourceHouseholdId,
          billId: sourceBillId
        };
      }
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

      let reference;

      if (sourceBillId) {
        const identity = JSON.stringify([
          state.uid,
          sourceHouseholdId,
          sourceBillId
        ]);

        const digest = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(identity)
        );

        assertSession(state);

        const stableId = "bill_" + [...new Uint8Array(digest)]
          .map(value => value.toString(16).padStart(2, "0"))
          .join("");

        reference = F.doc(state.db, COLLECTION, stableId);
      } else {
        reference = F.doc(
          F.collection(state.db, COLLECTION)
        );
      }

      const savedCard = {
        ...card,
        createdAt: F.serverTimestamp(),
        updatedAt: F.serverTimestamp()
      };

      attempted = true;

      if (sourceBillId) {
        await F.runTransaction(state.db, async transaction => {
          assertSession(state);

          const household = await transaction.get(
            F.doc(
              state.db,
              "households",
              sourceHouseholdId
            )
          );

          assertSession(state);

          const source = household.exists()
            ? household.data().bills?.find(
                bill => bill.id === sourceBillId
              )
            : null;

          if (
            !source ||
            source.category !== "creditcards" ||
            source.archived ||
            source.archivedAt ||
            source.cancelled ||
            source.cancelledAt ||
            source.splitPaymentParentId ||
            source.installmentPlanId
          ) {
            throw new Error(
              "The source bill is not active on the server. " +
              "Finish household sync and reopen setup."
            );
          }

          transaction.set(reference, savedCard);
        });
      } else {
        await F.setDoc(reference, savedCard);
      }

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

      dialog.classList.add("bbml-manual-cards");

      if (!document.getElementById("mcc-popup-size-style")) {
        const style = document.createElement("style");
        style.id = "mcc-popup-size-style";

        style.textContent = `
          dialog.bbml-dialog.bbml-manual-cards[open] {
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;

            height: calc(100vh - 24px) !important;
            height: calc(
              100dvh - 24px -
              env(safe-area-inset-top, 0px) -
              env(safe-area-inset-bottom, 0px)
            ) !important;

            max-height: calc(100vh - 24px) !important;
            max-height: calc(
              100dvh - 24px -
              env(safe-area-inset-top, 0px) -
              env(safe-area-inset-bottom, 0px)
            ) !important;

            margin: auto !important;
            overflow: hidden !important;
          }

          dialog.bbml-manual-cards .bbml-dialog-header {
            flex: 0 0 auto !important;
          }

          dialog.bbml-manual-cards .bbml-dialog-body {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            overscroll-behavior-y: contain;
            -webkit-overflow-scrolling: touch;
          }
        `;

        document.head.appendChild(style);
      }

      dialog.addEventListener("billbeacon:popup-back", event => {
        if (screen !== state || !alive(state)) return;
                if (state.view === "purchase") {
          event.preventDefault();

          if (writing) {
            message(state, "Wait for the purchase save to finish.");
            return;
          }

          if (confirm("Discard this unsaved purchase form?")) {
            showOverview(state, state.cardId);
          }

          return;
        }
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
        ["form", "purchase"].includes(state.view) &&
        !confirm(
          "Discard this unsaved card form and reload cards?"
        )
      ) {
        return;
      }
      if (writing) {
        message(state, "Wait for the current save to finish.");
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
    } else if (action === "setup-bill") {
      setupBillCard(state, id);
    } else if (action === "details") {
      showOverview(state, id);
    } else if (action === "card-information") {
      showDetails(state, id);
    } else if (action === "overview") {
      showOverview(state, id);
    } else if (action === "add-purchase") {
      addPurchase(state, id);
    } else if (action === "cancel-purchase") {
      if (
        !writing &&
        confirm("Discard this unsaved purchase form?")
      ) {
        showOverview(state, id);
      }
    } else if (action === "reverse-purchase") {
      void reversePurchase(state, id);
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