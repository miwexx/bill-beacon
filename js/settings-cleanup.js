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
          <div class="section-header">Account & Household</div>
          <div class="card card-pad">
            <div style="font-weight:800;overflow-wrap:anywhere;">${escapeHtml(email)}</div>
            <button id="createHouseholdInviteButton" type="button" class="bb-outline-pill"
              onclick="window.createHouseholdInvite()" style="width:100%;min-height:46px;margin-top:14px;justify-content:center;">
              ${svgIcon("plus", 18)} Invite Household Member
            </button>
            <div id="householdInviteStatus" role="status" aria-live="polite" style="font-size:var(--text-sm);color:var(--text-muted);margin-top:8px;"></div>
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
  window.BillBeaconSettingsCleanup = {version: 2};
  if (document.readyState !== "loading") render();
})();
