/* Load after the working js/app.js. Calendar, sync and bank matching are not replaced. */
(() => {
  "use strict";
  if (window.BillBeaconSettingsCleanup) return;

  const previousOpenBillForm = openBillForm;
  const previousRender = render;
  const activePayment = payment => String(payment?.status || "active").toLowerCase() !== "voided";
  const inactiveBill = bill => !bill || Boolean(bill.archived || bill.archivedAt || bill.isArchivedHistory ||
    bill.cancelled || bill.cancelledAt || bill.paidInFullAt) ||
    ["archived", "cancelled", "canceled", "paid-in-full", "paidinfull"]
      .includes(String(bill.status || "").trim().toLowerCase());

  function paymentContext(payment) {
    const bill = Store.getBill(payment?.billId);
    const dueKey = payment ? getPaymentOccurrenceDateKey(payment) : "";
    const eligible = Boolean(payment && activePayment(payment) && dueKey && !inactiveBill(bill));
    const siblings = eligible ? Store.getPayments().filter(other =>
      other.id !== payment.id && other.billId === payment.billId && activePayment(other) &&
      getPaymentOccurrenceDateKey(other) === dueKey
    ) : [];
    return {bill, dueKey, eligible, siblings};
  }

  function reversePayment(paymentId) {
    const payment = Store.getPayments().find(item => item.id === paymentId);
    const context = paymentContext(payment);
    if (!context.eligible) {
      alert("This payment cannot be reversed here. It is already reversed, the bill is inactive, " +
        "or its exact bill occurrence needs review.");
      return false;
    }
    const {bill, dueKey, siblings} = context;
    const before = JSON.stringify(payment);
    const verb = siblings.length ? "Reverse this payment" : "Mark this occurrence as unpaid";
    const notice = `${verb}?\n\n${bill.name}\nDue: ${dueKey}\nPayment: ${formatCurrency(payment.amount)}\n\n` +
      (siblings.length ? "Other active payments are linked to this occurrence, so it will remain marked paid.\n\n" : "") +
      "Only this payment record will be reversed. Other months and payments will not change. " +
      "The record stays in Payment History. This does not refund or cancel a bank payment.";
    if (!confirm(notice)) return false;
    const current = Store.getPayments().find(item => item.id === paymentId);
    const fresh = paymentContext(current);
    if (!fresh.eligible || JSON.stringify(current) !== before) {
      alert("The payment changed. Refresh Payment History before trying again.");
      return false;
    }
    const voidedAt = new Date().toISOString();
    Store.updatePayment(paymentId, {status: "voided", voidedAt});
    recordActivity({
      action: "payment_voided",
      entityType: bill.installmentPlanId ? "paymentplan" : "bill",
      entityId: bill.installmentPlanId || bill.id,
      title: `${bill.name} payment reversed`,
      detail: `${formatCurrency(payment.amount)} reversed · due ${dueKey}`,
      before: {paymentId, billId: payment.billId, dueDate: dueKey, paymentStatus: "active", amount: Number(payment.amount || 0)},
      after: {paymentId, billId: payment.billId, dueDate: dueKey, paymentStatus: "voided", voidedAt, amount: Number(payment.amount || 0)}
    });
    render();
    if (typeof refreshOpenBillSummaryPanels === "function") refreshOpenBillSummaryPanels();
    return true;
  }

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

  function settingsAction(label, icon, action, description = "", extra = "") {
    return `<button type="button" class="form-row" onclick="${action}" ${extra}
      style="width:100%;text-align:left;background:transparent;border:0;color:inherit;cursor:pointer;min-height:52px;">
      <span style="display:flex;align-items:center;gap:12px;width:100%;">
        <span style="display:flex;color:var(--text-muted);">${svgIcon(icon, 20)}</span>
        <span style="flex:1;min-width:0;"><span style="display:block;font-weight:700;">${escapeHtml(label)}</span>
          ${description ? `<span style="display:block;font-size:var(--text-xs);color:var(--text-muted);margin-top:3px;">${escapeHtml(description)}</span>` : ""}
        </span>${svgIcon("chevronRight", 18)}
      </span></button>`;
  }

  renderSettings = function() {
    const settings = Store.getSettings();
    const email = window.getBillBeaconUserEmail?.() || "Signed-in account";
    const sources = Store.getIncomeSources();
    const sync = window.billBeaconSyncStatus?.();
    const syncMessage = sync?.message || "Household sync status unavailable";
    const sourceRows = sources.map(source => settingsAction(source.name, "creditcard",
      `openIncomeSourceForm('${escapeInlineString(source.id)}')`,
      `${source.frequency} · ${formatCurrency(source.expectedAmount)} · Next ${formatDate(source.nextPayDate, "short")}`)).join("");
    return `
      <div class="nav-bar"><div class="nav-bar-content">
        <button type="button" class="nav-button" onclick="navigate('more')" aria-label="Back to More" style="color:var(--text);">${svgIcon("chevronLeft", 22)}</button>
        <div class="nav-title">Settings</div><div style="width:44px;"></div>
      </div></div>
      <div class="main-content fade-in"><div class="content-pad content-gap">
        <section class="settings-section">
          <div class="section-header">Account & Household</div>
          <div class="card card-pad">
            <div style="font-weight:800;overflow-wrap:anywhere;">${escapeHtml(email)}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:6px;" role="status">${escapeHtml(syncMessage)}</div>
            <button id="createHouseholdInviteButton" type="button" class="bb-outline-pill"
              onclick="window.createHouseholdInvite()" style="width:100%;min-height:46px;margin-top:14px;justify-content:center;">
              ${svgIcon("plus", 18)} Invite Household Member
            </button>
            <div id="householdInviteStatus" role="status" aria-live="polite" style="font-size:var(--text-xs);color:var(--text-muted);margin-top:8px;"></div>
          </div>
        </section>
        <div id="bbSettingsNotificationsSlot"></div>
        <section class="settings-section">
          <div class="section-header">Income & Paychecks</div>
          
            ${settingsAction("Add Income Source", "plus", "openIncomeSourceForm()")}
          </div>
        </section>
        <section class="settings-section">
          <div class="section-header">Appearance</div>
          <div class="card">
            ${settingsAction("Dark", "check", "setTheme('dark')", settings.theme !== "light" ? "Selected" : "")}
            ${settingsAction("Light", "check", "setTheme('light')", settings.theme === "light" ? "Selected" : "")}
          </div>
        </section>
        <section class="settings-section">
          <div class="section-header">Records & Transfers</div>
          <div class="card">
            ${settingsAction("Payment History", "checkCircle", "navigate('history')",)}
            ${settingsAction("Activity & Changes", "doc", "navigate('activity')",)}
            ${settingsAction("Export Bills CSV", "export", "exportCSV()",)}
            ${settingsAction("Import Bills CSV", "tray", "document.getElementById('billImportFile').click()",)}
          </div>
          <input id="billImportFile" type="file" accept=".csv,text/csv" style="display:none;" onchange="importBillsCSV(event)">
        </section>
        <section class="settings-section">
          <div class="section-header">About</div>
          <div class="card card-pad"><div style="font-weight:800;">Bill Beacon</div>
            <div style="font-size:var(--text-sm);color:var(--text-muted);margin-top:6px;">Bills, payment history and shared household planning.</div>
          </div>
        </section>
        <section class="settings-section">
          
          <div class="card card-pad"><button id="signout-button" type="button" class="bb-outline-pill"
            style="width:100%;min-height:46px;justify-content:center;">Sign Out</button></div>
        </section>
        <section class="settings-section">
          <div class="section-header">Advanced · Destructive Action</div>
          <details class="card card-pad"><summary style="cursor:pointer;font-weight:700;">Clear App Data</summary>
            <p style="font-size:var(--text-sm);color:var(--text-muted);margin:12px 0;">This clears app records and may sync those changes to your household. It does not disconnect your bank account.</p>
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
      const context = paymentContext(payment);
      const voided = !activePayment(payment);
      const name = payment.billSnapshot?.name || payment.bill?.name || "Removed Bill";
      const shownDate = voided ? payment.voidedAt || payment.paidDate : payment.paidDate;
     // const reason = voided ? "Reversed record" : !context.dueKey ? "Occurrence date needs review" :
      //  inactiveBill(context.bill) ? "Inactive or removed bill · read only" : "" ;
      const label = context.siblings.length ? "Reverse This Payment" : "Mark as Unpaid";
      return `<div style="border-bottom:1px solid var(--border);padding:14px 16px;${voided ? 'opacity:.6;' : ''}">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="bill-icon" style="background:${voided ? 'var(--surface-2)' : 'var(--paid-bg)'};color:${voided ? 'var(--text-muted)' : 'var(--paid)'};">${svgIcon(voided ? "close" : "checkCircle", 18)}</div>
          <div style="flex:1;min-width:0;">
            <div class="bill-name">${escapeHtml(name)}${voided ? " · Reversed" : ""}</div>
            <div class="bill-meta">${voided ? "Reversed" : "Paid"} ${escapeHtml(shownDate ? formatDate(shownDate, "full") : "Date unavailable")}</div>
            <div class="bill-meta">${context.dueKey ? `For due date ${escapeHtml(context.dueKey)}` : "No confirmed occurrence date"}</div>
          </div><div class="bill-amount">${formatCurrency(payment.amount)}</div>
        </div>
        ${context.eligible ? `<button type="button" class="bb-outline-pill" data-payment-id="${escapeHtml(payment.id)}"
          onclick="window.BillBeaconSettingsCleanup.reversePayment(this.dataset.paymentId)"
          style="width:100%;min-height:42px;justify-content:center;margin-top:10px;">${svgIcon("close", 16)} ${label}</button>` :
          `<div class="bill-meta" style="margin-top:8px;">${escapeHtml(reason)}</div>`}
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
      if (notifications && !notifications.querySelector('[data-default-reminder-note]')) {
        const note = document.createElement("p");
        note.dataset.defaultReminderNote = "true";
        note.className = "settings-footer";
               notifications.appendChild(note);
      }
    }
    return result;
  };
  window.render = render;
  window.BillBeaconSettingsCleanup = {reversePayment};
  if (document.readyState !== "loading") render();
})();
