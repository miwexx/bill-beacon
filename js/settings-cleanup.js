/* Load after js/app.js. Calendar, sync and bank matching are unchanged. */
(() => {
  "use strict";
  if (window.BillBeaconSettingsCleanup) return;
  const previousOpenBillForm = openBillForm;
  const previousRender = render;

  openBillForm = function(billId = null, selectedDate = null) {
    const result = previousOpenBillForm.apply(this, arguments);
    const bill = billId ? Store.getBill(billId) : null;
    if (!billId || (bill && !Array.isArray(bill.reminderOffsets))) {
      document.querySelectorAll('input[name="billReminderOffsets"]').forEach(input => {
        input.checked = [1, 3].includes(Number(input.value));
      });
    }
    return result;
  };

  function settingsAction(label, icon, action, selected = false) {
    return `<button type="button" class="form-row" onclick="${action}"
      style="width:100%;text-align:left;background:transparent;border:0;color:inherit;cursor:pointer;min-height:52px;">
      <span style="display:flex;align-items:center;gap:12px;width:100%;">
        <span style="display:flex;color:var(--text-muted);">${svgIcon(icon, 20)}</span>
        <span style="flex:1;min-width:0;font-weight:700;">${escapeHtml(label)}</span>
        ${svgIcon(selected ? "check" : "chevronRight", 18)}
      </span></button>`;
  }

  renderSettings = function() {
    const settings = Store.getSettings();
    const email = window.getBillBeaconUserEmail?.() || "Signed-in account";
    const sources = Store.getIncomeSources();
    const sourceRows = sources.map(source => `
      <button type="button" class="form-row"
        onclick="openIncomeSourceForm('${escapeInlineString(source.id)}')"
        style="width:100%;text-align:left;background:transparent;border:0;color:inherit;cursor:pointer;min-height:52px;">
        <span style="display:flex;align-items:center;gap:12px;width:100%;">
          <span style="flex:1;min-width:0;font-weight:700;">${escapeHtml(source.name)}</span>
          <span style="font-weight:800;">${formatCurrency(source.expectedAmount)}</span>
          ${svgIcon("chevronRight", 18)}
        </span>
      </button>`).join("");
    return `
      <style>
        #householdInviteStatus:empty, #notificationTestStatus:empty { display:none; }
        #notificationPermissionStatus { display:none !important; }
      </style>
      <div class="nav-bar"><div class="nav-bar-content">
        <button type="button" class="nav-button" onclick="navigate('more')" aria-label="Back to More" style="color:var(--text);">${svgIcon("chevronLeft", 22)}</button>
        <div class="nav-title">Settings</div><div style="width:44px;"></div>
      </div></div>
      <div class="main-content fade-in"><div class="content-pad content-gap">
        <section class="settings-section">
         <section class="settings-section">
          <div class="section-header">
            Account & Household
          </div>

          <div class="card">
            <div
              style="
                padding:16px;
                border-bottom:1px solid var(--border);
              "
            >
              <div
                id="bbAccountDisplayName"
                style="
                  font-size:17px;
                  font-weight:850;
                  overflow-wrap:anywhere;
                "
              >
                Your Account
              </div>

              <div
                style="
                  margin-top:4px;
                  font-size:13px;
                  color:var(--text-muted);
                  overflow-wrap:anywhere;
                "
              >
                ${escapeHtml(email)}
              </div>
            </div>

            ${settingsAction(
              "Personal Details",
              "user",
              "window.bbOpenAccountSettings('name')"
            )}

            ${settingsAction(
              "Email Address",
              "mail",
              "window.bbOpenAccountSettings('email')"
            )}

            ${settingsAction(
              "Password",
              "lock",
              "window.bbOpenAccountSettings('password')"
            )}

            <div
              style="
                padding:16px;
                border-top:1px solid var(--border);
              "
            >
              <div
                style="
                  font-size:15px;
                  font-weight:800;
                  margin-bottom:6px;
                "
              >
                Shared Household
              </div>

              <div
                id="bbHouseholdRole"
                style="
                  font-size:13px;
                  color:var(--text-secondary);
                  line-height:1.4;
                "
              >
                Loading household…
              </div>

              <div
                id="bbHouseholdOwnerActions"
                style="display:none;margin-top:14px;"
              >
                <button
                  id="createHouseholdInviteButton"
                  type="button"
                  class="bb-outline-pill"
                  onclick="window.createHouseholdInviteCode()"
                  style="
                    width:100%;
                    min-height:46px;
                    justify-content:center;
                  "
                >
                  ${svgIcon("plus", 18)}
                  Generate Invite Code
                </button>

                <button
                  type="button"
                  class="bb-outline-pill"
                  onclick="window.cancelHouseholdInviteCode()"
                  style="
                    width:100%;
                    min-height:44px;
                    margin-top:10px;
                    justify-content:center;
                  "
                >
                  Cancel Invite Code
                </button>

                <div
                  id="householdInviteStatus"
                  role="status"
                  aria-live="polite"
                  style="
                    font-size:var(--text-sm);
                    color:var(--text-muted);
                    margin-top:8px;
                    line-height:1.4;
                  "
                ></div>
              </div>

              <div
                id="bbHouseholdMemberActions"
                style="display:none;margin-top:12px;"
              >
                <button
                  type="button"
                  class="bb-outline-pill"
                  onclick="window.openJoinHouseholdCodeDialog()"
                  style="
                    width:100%;
                    min-height:46px;
                    justify-content:center;
                  "
                >
                  ${svgIcon("plus", 18)}
                  Join a Household
                </button>
              </div>
            </div>
          </div>
        </section>
        <div id="bbSettingsNotificationsSlot"></div>
        <section class="settings-section">
          <div class="section-header">Income & Paychecks</div>
          ${sourceRows ? `<div class="card">${sourceRows}</div>` : ""}
          <button type="button" class="bb-outline-pill" onclick="openIncomeSourceForm()"
            style="width:100%;min-height:46px;justify-content:center;${sourceRows ? 'margin-top:12px;' : 'margin-top:0;'}">
            <span class="pill-icon">${svgIcon("plus", 18)}</span>
            <span>Add Income Source</span>
          </button>
        </section>
        <section class="settings-section">
          <div class="section-header">Appearance</div>
          <div class="card">
            ${settingsAction("Dark", "check", "setTheme('dark')", settings.theme !== "light")}
            ${settingsAction("Light", "check", "setTheme('light')", settings.theme === "light")}
          </div>
        </section>
        <section class="settings-section">
          <div class="section-header">Records & Transfers</div>
          <div class="card">
            ${settingsAction("Payment History", "checkCircle", "navigate('history')")}
            ${settingsAction("Activity & Changes", "doc", "navigate('activity')")}
            ${settingsAction("Export Bills CSV", "export", "exportCSV()")}
            ${settingsAction("Import Bills CSV", "tray", "document.getElementById('billImportFile').click()")}
          </div>
          <input id="billImportFile" type="file" accept=".csv,text/csv" style="display:none;" onchange="importBillsCSV(event)">
        </section>
        <section class="settings-section">
          <div class="section-header">About</div>
          <div class="card card-pad"><div style="font-weight:800;">Bill Beacon</div></div>
        </section>
        <section class="settings-section">
          <div class="card card-pad"><button id="signout-button" type="button" class="bb-outline-pill"
            style="width:100%;min-height:46px;justify-content:center;">Sign Out</button></div>
        </section>
        <section class="settings-section">
          <div class="section-header">Advanced</div>
          <details class="card card-pad"><summary style="cursor:pointer;font-weight:700;">Clear App Data</summary>
            <p style="font-size:var(--text-sm);color:var(--text-muted);margin:12px 0;">Clears app records and may sync the deletion to your household. Does not disconnect the bank.</p>
            <button type="button" class="btn-danger" onclick="clearAllAppData()" style="width:100%;">Clear All App Data</button>
          </details>
        </section>
      </div></div>`;
  };

  addBackupSettings = function() {};

  renderPaymentHistory = function() {
    const allBills = [...Store.getBills(), ...getArchivedBills()];
    const payments = Store.getPayments().map(payment => ({...payment,
      bill: allBills.find(bill => bill.id === payment.billId)
    })).sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
    const rows = payments.map(payment => {
      const voided = String(payment.status || "active").toLowerCase() === "voided";
      const dueKey = getPaymentOccurrenceDateKey(payment);
      const name = payment.billSnapshot?.name || payment.bill?.name || "Removed Bill";
      const shownDate = voided ? payment.voidedAt || payment.paidDate : payment.paidDate;
      return `<div class="bill-row" style="${voided ? 'opacity:.6;' : ''}">
        <div class="bill-icon" style="background:${voided ? 'var(--surface-2)' : 'var(--paid-bg)'};color:${voided ? 'var(--text-muted)' : 'var(--paid)'};">${svgIcon(voided ? "close" : "checkCircle", 18)}</div>
        <div class="bill-info">
          <div class="bill-name">${escapeHtml(name)}${voided ? " · Reversed" : ""}</div>
          <div class="bill-meta">${voided ? "Reversed" : "Paid"} ${escapeHtml(shownDate ? formatDate(shownDate, "full") : "Date unavailable")}</div>
          ${dueKey ? `<div class="bill-meta">Due ${escapeHtml(dueKey)}</div>` : ""}
        </div><div class="bill-amount">${formatCurrency(payment.amount)}</div>
      </div>`;
    }).join("");
    return `<div class="nav-bar"><div class="nav-bar-content">
      <button type="button" class="nav-button" onclick="navigate('today')" aria-label="Back to Dashboard">${svgIcon("chevronLeft", 22)}</button>
      <div class="nav-title">Payment History</div><div style="width:44px;"></div>
      </div></div><div class="main-content fade-in"><div class="content-pad content-gap">
      ${rows ? `<div class="section-header">All Payments</div><div class="card">${rows}</div>` :
        '<div class="empty-state"><div class="empty-state-title">No payment history yet</div></div>'}
      </div></div>`;
  };

  render = function() {
    const result = previousRender.apply(this, arguments);
    if (currentRoute === "settings") {
      const slot = document.getElementById("bbSettingsNotificationsSlot");
      const notifications = document.getElementById("notificationSettingsCard");
      if (slot && notifications && notifications.parentElement !== slot) slot.appendChild(notifications);
    }
    return result;
  };
  window.render = render;
  window.BillBeaconSettingsCleanup = {version: 3};
  if (document.readyState !== "loading") render();
    const HOUSEHOLD_WORKER_URL =
    "https://bill-beacon-notifications.rodz-m-1990.workers.dev";

  function formatInviteCode(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/[^A-Z2-9]/g, "")
      .slice(0, 8)
      .replace(/^(.{4})(.{0,4}).*$/, (_, first, second) =>
        second ? `${first}-${second}` : first
      );
  }

  async function householdWorkerRequest(path, body) {
    const token = await window.getBillBeaconFirebaseToken?.(true);

    if (!token) {
      throw new Error("Please sign in again.");
    }

    const response = await fetch(
      `${HOUSEHOLD_WORKER_URL}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body || {})
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result?.ok !== true) {
      throw new Error(result?.error || "Household request failed.");
    }

    return result;
  }

    let bbHouseholdCardCache = null;
  let bbHouseholdCardRequest = 0;

  async function refreshHouseholdSettingsCard() {
    const roleElement =
      document.getElementById("bbHouseholdRole");

    const ownerActions =
      document.getElementById("bbHouseholdOwnerActions");

    const memberActions =
      document.getElementById("bbHouseholdMemberActions");

    const displayName =
      document.getElementById("bbAccountDisplayName");

    if (
      !roleElement ||
      !ownerActions ||
      !memberActions
    ) {
      return;
    }

    const user =
      window.getBillBeaconFirebaseUser?.();

    const context =
      window.getBillBeaconHouseholdContext?.();

    if (!user) {
      bbHouseholdCardCache = null;
      ownerActions.style.display = "none";
      memberActions.style.display = "none";

      roleElement.textContent =
        "Sign in to manage your household.";

      return;
    }

    const scopeKey =
      `${user.uid}:${context?.householdId || ""}`;

    const requestNumber =
      ++bbHouseholdCardRequest;

    function applyCard(data) {
      if (
        !roleElement.isConnected ||
        !ownerActions.isConnected ||
        !memberActions.isConnected
      ) {
        return;
      }

      if (displayName && data.name) {
        displayName.textContent = data.name;
      }

      roleElement.textContent =
        data.role === "owner"
          ? "Account Status: Owner"
          : "Account Status: Member.";

      ownerActions.style.display =
        data.role === "owner" ? "block" : "none";

      // Owners of empty personal households may also join.
      // The Worker checks whether switching is permitted.
      memberActions.style.display = "block";
    }

    if (
      bbHouseholdCardCache?.scopeKey === scopeKey
    ) {
      applyCard(bbHouseholdCardCache);
    }

    try {
      const firestore =
        window.getBillBeaconFirestore?.();

      if (!firestore || !window.firebaseDoc) {
        throw new Error(
          "Account information is still loading."
        );
      }

      const firebaseFirestore = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
      );

      const profileSnapshot =
        await firebaseFirestore.getDoc(
          window.firebaseDoc(
            firestore,
            "users",
            user.uid
          )
        );

      if (!profileSnapshot.exists()) {
        throw new Error(
          "Your account profile is still loading."
        );
      }

      const profile = profileSnapshot.data();

      const householdId = String(
        profile.householdId || ""
      ).trim();

      if (!householdId) {
        throw new Error(
          "Your household is still loading."
        );
      }

      const memberSnapshot =
        await firebaseFirestore.getDoc(
          window.firebaseDoc(
            firestore,
            "households",
            householdId,
            "members",
            user.uid
          )
        );

      const latestContext =
        window.getBillBeaconHouseholdContext?.();

      if (
        requestNumber !== bbHouseholdCardRequest ||
        window.getBillBeaconFirebaseUser?.()?.uid !==
          user.uid ||
        `${user.uid}:${latestContext?.householdId || ""}` !==
          scopeKey
      ) {
        return;
      }

      if (!memberSnapshot.exists()) {
        throw new Error(
          "Your household membership is unavailable."
        );
      }

      const member = memberSnapshot.data();

      if (
        !["owner", "member"].includes(member.role) ||
        (member.uid && member.uid !== user.uid)
      ) {
        throw new Error(
          "Your household membership needs review."
        );
      }

      const firstName = String(
        profile.firstName || ""
      ).trim();

      const lastName = String(
        profile.lastName || ""
      ).trim();

      const data = {
        scopeKey,
        role: member.role,
        name: `${firstName} ${lastName}`.trim()
      };

      bbHouseholdCardCache = data;
      applyCard(data);
    } catch (error) {
      if (
        requestNumber !== bbHouseholdCardRequest ||
        !roleElement.isConnected
      ) {
        return;
      }

      if (
        bbHouseholdCardCache?.scopeKey !== scopeKey
      ) {
        ownerActions.style.display = "none";
        memberActions.style.display = "none";

        roleElement.textContent =
          error?.message ||
          "Could not load household information.";
      }
    }
  }
  function showHouseholdCodeDialog({
    title,
    content,
    primaryLabel,
    onPrimary
  }) {
    document.getElementById("bbHouseholdCodeDialog")?.remove();

    const dialog = document.createElement("dialog");

    dialog.id = "bbHouseholdCodeDialog";

    dialog.style.cssText = `
      margin:auto;
      width:min(440px,calc(100% - 32px));
      max-height:85dvh;
      overflow:auto;
      padding:24px;
      border:1px solid var(--border);
      border-radius:24px;
      background:var(--surface);
      color:var(--text);
    `;

    dialog.innerHTML = `
      <h2 style="margin:0 0 14px;font-size:22px;">${escapeHtml(title)}</h2>

      <div id="bbHouseholdCodeContent"></div>

      <div
        id="bbHouseholdCodeMessage"
        role="status"
        aria-live="polite"
        style="min-height:20px;margin-top:14px;font-size:14px;line-height:1.4;"
      ></div>

      <div style="display:grid;gap:10px;margin-top:16px;">
        <button
          id="bbHouseholdCodePrimary"
          type="button"
          class="btn-primary"
        >
          ${escapeHtml(primaryLabel)}
        </button>

        <button
          id="bbHouseholdCodeCancel"
          type="button"
          class="bb-outline-pill"
        >
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(dialog);

    const contentElement = document.getElementById(
      "bbHouseholdCodeContent"
    );

    contentElement.innerHTML = content;

    const primaryButton = document.getElementById(
      "bbHouseholdCodePrimary"
    );

    const cancelButton = document.getElementById(
      "bbHouseholdCodeCancel"
    );

    cancelButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener(
      "close",
      () => dialog.remove(),
      { once: true }
    );

    primaryButton.addEventListener("click", async () => {
      const message = document.getElementById(
        "bbHouseholdCodeMessage"
      );

      primaryButton.disabled = true;
      cancelButton.disabled = true;

      try {
        await onPrimary({
          dialog,
          message,
          primaryButton,
          cancelButton
        });
      } catch (error) {
        message.style.color = "var(--overdue)";
        message.textContent =
          error?.message || "Could not complete this request.";

        primaryButton.disabled = false;
        cancelButton.disabled = false;
      }
    });

        const mainContent =
      document.querySelector(".main-content");

    const savedMainScroll =
      mainContent?.scrollTop || 0;

    const savedWindowX = window.scrollX;
    const savedWindowY = window.scrollY;

    primaryButton.autofocus = true;

    dialog.showModal();

    primaryButton.focus({
      preventScroll: true
    });

    if (mainContent?.isConnected) {
      mainContent.scrollTop = savedMainScroll;
    }

    window.scrollTo({
      left: savedWindowX,
      top: savedWindowY,
      behavior: "auto"
    });

    return dialog;
  }

  window.createHouseholdInviteCode = async function () {
    const button = document.getElementById(
      "createHouseholdInviteButton"
    );

    if (button) button.disabled = true;

    try {
      const result = await householdWorkerRequest(
        "/household-codes",
        {}
      );

      const code = String(result.code || "");

      showHouseholdCodeDialog({
        title: "Invite Code",
        primaryLabel: "Copy Code",
        content: `
          <p
            style="margin:0;color:var(--text-secondary);line-height:1.5;"
          >
            Share this code to the household member. Code Expires in 24 Hours.
          </p>

          <div
            id="bbHouseholdInviteCode"
            style="
              margin-top:18px;
              padding:16px;
              border:1px solid var(--border);
              border-radius:14px;
              font-size:26px;
              font-weight:900;
              letter-spacing:2px;
              text-align:center;
            "
          >
            ${escapeHtml(code)}
          </div>
        `,
        onPrimary: async ({
          message,
          primaryButton,
          cancelButton
        }) => {
          await navigator.clipboard.writeText(code);

          message.style.color = "var(--paid)";
          message.textContent = "Invite code copied.";

          primaryButton.textContent = "Copied";
          cancelButton.disabled = false;
        }
      });

      const status = document.getElementById(
        "householdInviteStatus"
      );

      if (status) {
        status.textContent =
          "A new invite code is ready. It expires in 24 hours.";
      }
    } finally {
      if (button) button.disabled = false;
    }
  };
  window.openJoinHouseholdCodeDialog = function () {
    document.getElementById(
      "bbHouseholdCodeDialog"
    )?.remove();

    const dialog = document.createElement("dialog");

    dialog.id = "bbHouseholdCodeDialog";

    dialog.style.cssText = `
      margin:auto;
      width:min(440px,calc(100% - 32px));
      padding:24px;
      border:1px solid var(--border);
      border-radius:24px;
      background:var(--surface);
      color:var(--text);
    `;

    dialog.innerHTML = `
      <h2 style="margin:0 0 16px;">
        Join a Household
      </h2>

      <label
        class="login-label"
        for="bbJoinCode"
      >
        Invite Code
      </label>

      <input
        id="bbJoinCode"
        class="login-input"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        maxlength="16"
        style="margin-top:8px;text-transform:uppercase;"
      >

      <p
        id="bbJoinMessage"
        role="status"
        aria-live="polite"
        style="margin:14px 0;line-height:1.4;"
      ></p>

      <button
        id="bbJoinContinue"
        type="button"
        class="btn-primary"
      >
        Continue
      </button>

      <button
        id="bbJoinCancel"
        type="button"
        class="bb-outline-pill"
        style="width:100%;margin-top:10px;"
      >
        Cancel
      </button>
    `;

    document.body.appendChild(dialog);

    const input =
      dialog.querySelector("#bbJoinCode");

    const message =
      dialog.querySelector("#bbJoinMessage");

    const button =
      dialog.querySelector("#bbJoinContinue");

    const cancel =
      dialog.querySelector("#bbJoinCancel");

    let confirmedCode = null;
    let busy = false;

    cancel.onclick = () => dialog.close();

    dialog.addEventListener(
      "cancel",
      event => {
        if (busy) event.preventDefault();
      }
    );

    dialog.addEventListener(
      "close",
      () => dialog.remove(),
      { once: true }
    );

    button.onclick = async () => {
      if (busy) return;

      busy = true;
      button.disabled = true;
      cancel.disabled = true;

      try {
        if (!confirmedCode) {
          const result =
            await householdWorkerRequest(
              "/household-codes/preview",
              {
                code: input.value
              }
            );

          if (!result.ownerFirstName) {
            throw new Error(
              "The invite owner could not be verified."
            );
          }

          confirmedCode = input.value;
          input.disabled = true;

          message.textContent =
            `Join ${result.ownerFirstName}'s Household?`;

          button.textContent = "Join Household";
        } else {
          const user =
            window.getBillBeaconFirebaseUser?.();

          const app =
            document.getElementById("app");

          const previousInert =
            app?.inert || false;

          if (!user) {
            throw new Error("Please sign in again.");
          }

          if (app) app.inert = true;

          let sync;
          let stopped = false;

          try {
            if (!window.billBeaconPrepareDataTransfer) {
              throw new Error(
                "The sync helper is missing."
              );
            }

            await window.billBeaconPrepareDataTransfer();

            sync = await import(
              "./firebase-sync.js"
            );

            const status =
              window.billBeaconSyncStatus?.();

            if (
              !status?.ready ||
              status.pending ||
              status.conflict ||
              window.getBillBeaconFirebaseUser?.()?.uid !==
                user.uid
            ) {
              throw new Error(
                "Finish syncing before joining."
              );
            }

            sync.stopHouseholdSync();
            stopped = true;

            message.textContent =
              "Joining household…";

            await householdWorkerRequest(
              "/household-codes/join",
              {
                code: confirmedCode
              }
            );

            message.textContent =
              "Household joined. Loading shared bills…";

            window.location.reload();
            return;
          } catch (error) {
            if (
              stopped &&
              window.getBillBeaconFirebaseUser?.()?.uid ===
                user.uid
            ) {
              await sync.startHouseholdSync(user);
            }

            throw error;
          } finally {
            if (app) {
              app.inert = previousInert;
            }
          }
        }
      } catch (error) {
        message.style.color = "var(--overdue)";

        message.textContent =
          error?.message ||
          "The request did not finish. " +
          "Refresh before retrying.";
      } finally {
        busy = false;
        button.disabled = false;
        cancel.disabled = false;
      }
    };

    dialog.showModal();
    input.focus();
  };

  window.cancelHouseholdInviteCode =
    async function () {
      try {
        await householdWorkerRequest(
          "/household-codes/revoke",
          {}
        );

        const status =
          document.getElementById(
            "householdInviteStatus"
          );

        if (status) {
          status.textContent =
            "The invitation code was cancelled.";
        }

        document.getElementById(
          "bbHouseholdCodeDialog"
        )?.close();
      } catch (error) {
        alert(
          error?.message ||
          "Could not cancel the code."
        );
      }
    };
  const previousSettingsRender = render;

  render = function () {
    const result = previousSettingsRender.apply(this, arguments);

    if (currentRoute === "settings") {
      refreshHouseholdSettingsCard();
    }

    return result;
  };

  window.render = render;
})();
