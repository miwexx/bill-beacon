/* Load after js/app.js. Calendar, sync and bank matching are unchanged. */
(() => {
  "use strict";
  if (window.BillBeaconSettingsCleanup) return;
  const previousOpenBillForm = openBillForm;
    const previousRender = render;
  openBillForm = function (billId = null, selectedDate = null) {
    const result = previousOpenBillForm.apply(this, arguments);
    const bill = billId ? Store.getBill(billId) : null;
    const title = document.querySelector("#billSheet .sheet-title");
    if (title) {
      title.textContent = bill
        ? bill.installmentPlanId ? "Edit Payment Plan" : "Edit Bill"
        : "New Bill";
    }
    return result;
  };

let myNotificationPreferences = null;
let notificationPreferenceBusy = false;
let notificationPreferenceLoadVersion = 0;
let notificationPreferenceSaveAgain = false;

function personalNotificationContext() {
  const user = window.getBillBeaconFirebaseUser?.();
  const context = window.getBillBeaconHouseholdContext?.();
  if (!user?.uid || !context?.ready || context.uid !== user.uid || !context.householdId) {
    throw new Error("Wait for your signed-in household to finish loading.");
  }
  return {uid:user.uid,householdId:context.householdId,generation:context.generation};
}

function samePersonalNotificationContext(saved) {
  try {
    const now = personalNotificationContext();
    return now.uid === saved.uid && now.householdId === saved.householdId &&
      now.generation === saved.generation;
  } catch { return false; }
}

async function personalNotificationRequest(path, body, context) {
  const token = await window.getBillBeaconFirebaseToken?.();
  if (!token || !samePersonalNotificationContext(context)) throw new Error("The sign-in session changed.");
  const response = await fetch(
    "https://bill-beacon-notifications.rodz-m-1990.workers.dev" + path,
    {method:body === undefined ? "GET" : "POST", cache:"no-store",
     headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
     ...(body === undefined ? {} : {body:JSON.stringify(body)})}
  );
  const result = await response.json().catch(() => null);
  if (!samePersonalNotificationContext(context)) throw new Error("The sign-in session changed.");
  if (!response.ok || !result?.ok) throw new Error(result?.error || "Notification request failed.");
  if (result.uid !== context.uid || result.householdId !== context.householdId) {
    throw new Error("Notification account verification failed.");
  }
  return result;
}

function setPersonalReminderStatus(body, message, error = false) {
  const status = body?.querySelector("#personalReminderSaveStatus");
  if (!status) return;
  status.textContent = message;
    status.hidden = !message;
  status.style.color = error ? "var(--overdue)" : "var(--text-secondary)";
}

function setPersonalReminderControls(body, disabled) {
  body?.querySelectorAll(
    ".global-reminder-toggle,#globalReminderTime,#personalReminderTimeZone,#savePersonalReminders"
  ).forEach(control => {control.disabled = disabled;});
}
function populatePersonalReminderTimeZones(select, selectedZone) {
  if (!select) return;

  const zones = [
    ["America/New_York", "Eastern"],
    ["America/Chicago", "Central"],
    ["America/Denver", "Mountain"],
    ["America/Phoenix", "Arizona"],
    ["America/Los_Angeles", "Pacific"],
    ["America/Anchorage", "Alaska"],
    ["Pacific/Honolulu", "Hawaii"],
    ["America/Puerto_Rico", "Puerto Rico / Atlantic"]
  ];

  // Preserve an existing saved zone rather than silently changing it.
  if (
    selectedZone &&
    !zones.some(([value]) => value === selectedZone)
  ) {
    zones.unshift([
      selectedZone,
      `Current saved zone — ${selectedZone.replace(/_/g, " ")}`
    ]);
  }

  select.replaceChildren();

  for (const [value, label] of zones) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  select.value = selectedZone || "America/New_York";
}
async function loadPersonalReminderSettings() {
  if (notificationPreferenceBusy) return;

  const body = document.getElementById("bbSettingsSectionBody");
  if (!body?.querySelector("#personalReminderSaveStatus")) return;
  const version = ++notificationPreferenceLoadVersion;
  myNotificationPreferences = null;
  setPersonalReminderControls(body,true);
  setPersonalReminderStatus(body,"Loading your account's reminder preferences…");
  let context;
  try {
    context = personalNotificationContext();
    const result = await personalNotificationRequest("/notification-preferences",undefined,context);
    if (version !== notificationPreferenceLoadVersion || !body.isConnected ||
        !samePersonalNotificationContext(context)) return;
    myNotificationPreferences = {...result.preferences, ...context};
    body.dataset.notificationPreferencesUid = context.uid;
    body.querySelectorAll(".global-reminder-toggle").forEach(input => {
      input.checked = result.preferences.reminderOffsets.includes(Number(input.dataset.days));
    });
    body.querySelector("#globalReminderTime").value = result.preferences.reminderTimeOfDay;
        populatePersonalReminderTimeZones(
      body.querySelector("#personalReminderTimeZone"),
      result.preferences.timeZone
    );
    setPersonalReminderControls(body,false);
        setPersonalReminderStatus(body, "");

    // Establish this account's preferences automatically on first load.
    if (result.source === "legacy-household") {
      await saveGlobalReminderSettings();
    }
  } catch (error) {
    if (version === notificationPreferenceLoadVersion && body.isConnected) {
      setPersonalReminderStatus(body,error.message,true);
    }
  }
}

async function saveGlobalReminderSettings() {
  const body = document.getElementById("bbSettingsSectionBody");

  if (!body?.querySelector("#personalReminderSaveStatus")) {
    return;
  }

  // Keep the latest edit instead of dropping changes during a save.
  if (notificationPreferenceBusy) {
    notificationPreferenceSaveAgain = true;
    return;
  }

  let context;

  try {
    context = personalNotificationContext();

    if (
      !myNotificationPreferences ||
      myNotificationPreferences.uid !== context.uid ||
      myNotificationPreferences.householdId !== context.householdId ||
      myNotificationPreferences.generation !== context.generation ||
      body.dataset.notificationPreferencesUid !== context.uid
    ) {
      throw new Error(
        "Load your account's preferences before saving."
      );
    }

    const preferences = {
      reminderOffsets: [
        ...body.querySelectorAll(".global-reminder-toggle")
      ]
        .filter(input => input.checked)
        .map(input => Number(input.dataset.days)),

      reminderTimeOfDay:
        body.querySelector("#globalReminderTime").value,

      timeZone:
        body.querySelector("#personalReminderTimeZone").value.trim()
    };

    ++notificationPreferenceLoadVersion;
    notificationPreferenceBusy = true;

    // Do not disable inputs or rebuild the form during saving.
    setPersonalReminderStatus(body, "");

    const result = await personalNotificationRequest(
      "/notification-preferences",
      preferences,
      context
    );

    if (
      body.isConnected &&
      samePersonalNotificationContext(context)
    ) {
      myNotificationPreferences = {
        ...result.preferences,
        ...context
      };

      setPersonalReminderStatus(body, "");
    }
  } catch (error) {
    if (
      body.isConnected &&
      (!context || samePersonalNotificationContext(context))
    ) {
      setPersonalReminderStatus(
        body,
        error.message,
        true
      );
    }
  } finally {
    notificationPreferenceBusy = false;

    const saveAgain = notificationPreferenceSaveAgain;
    notificationPreferenceSaveAgain = false;

    if (
      saveAgain &&
      body.isConnected &&
      context &&
      samePersonalNotificationContext(context)
    ) {
      // Read the current controls and save the most recent values.
      void saveGlobalReminderSettings();
    }
  }
}
window.reloadMyNotificationPreferences = loadPersonalReminderSettings;
window.saveMyNotificationPreferences = saveGlobalReminderSettings;
window.addEventListener("billbeacon:signed-out", () => {
  notificationPreferenceLoadVersion++;
  myNotificationPreferences = null;
    notificationPreferenceSaveAgain = false;
  const body = document.getElementById("bbSettingsSectionBody");
  if (body?.querySelector("#personalReminderSaveStatus")) {
    setPersonalReminderControls(body,true);
    setPersonalReminderStatus(body,"Sign in and reopen Notifications.");
  }
});



  function settingsAction(label, icon, action, selected = false) {
    return `<button type="button" class="form-row" onclick="${action}"
      style="width:100%;text-align:left;background:transparent;border:0;color:inherit;cursor:pointer;min-height:52px;">
      <span style="display:flex;align-items:center;gap:12px;width:100%;">
        <span style="display:flex;color:var(--text-muted);">${svgIcon(icon, 20)}</span>
        <span style="flex:1;min-width:0;font-weight:700;">${escapeHtml(label)}</span>
        ${svgIcon(selected ? "check" : "chevronRight", 18)}
      </span></button>`;
  }

  renderSettings = function () {
      const settingsBackRoute =
    routeParams.returnRoute === "today" ? "today" : "more";

  const settingsBackLabel =
    settingsBackRoute === "today" ? "Dashboard" : "More";
  const settings = Store.getSettings();
  const email =
    window.getBillBeaconUserEmail?.() ||
    "Signed-in account";

  return `
    <style>
      #householdInviteStatus:empty,
      #notificationTestStatus:empty {
        display:none;
      }

      #notificationPermissionStatus {
        display:none !important;
      }
    </style>

        <div class="nav-bar settings-page-header">
      <div class="nav-bar-content">
        <button
          type="button"
          class="nav-button"
                    onclick="navigate('${settingsBackRoute}')"
          aria-label="Back to ${settingsBackLabel}"
          style="color:var(--text);"
        >
          ${svgIcon("chevronLeft", 22)}
        </button>

        <div class="nav-title">Settings</div>
        <div style="width:44px;"></div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad content-gap">

        <section class="settings-section">
          <div class="section-header">
            Settings
          </div>

          <div class="card card-pad">
            <button
              type="button"
              class="bb-outline-pill"
              style="
                width:100%;
                min-height:46px;
                justify-content:center;
              "
              onclick="window.openSettingsSection('account')"
            >
              Account & Household
            </button>

            <button
              type="button"
              class="bb-outline-pill"
              style="
                width:100%;
                min-height:46px;
                justify-content:center;
                margin-top:10px;
              "
              onclick="window.openSettingsSection('notifications')"
            >
              Notifications
            </button>

            <button
              type="button"
              class="bb-outline-pill"
              style="
                width:100%;
                min-height:46px;
                justify-content:center;
                margin-top:10px;
              "
              onclick="window.openSettingsSection('income')"
            >
              Income & Paychecks
            </button>

            <button
              type="button"
              class="bb-outline-pill"
              style="
                width:100%;
                min-height:46px;
                justify-content:center;
                margin-top:10px;
              "
              onclick="window.openSettingsSection('appearance')"
            >
              Appearance
            </button>

            <button
              type="button"
              class="bb-outline-pill"
              style="
                width:100%;
                min-height:46px;
                justify-content:center;
                margin-top:10px;
              "
              onclick="window.openSettingsSection('records')"
            >
              Import & Export Data
            </button>

            <button
              type="button"
              class="bb-outline-pill"
              style="
                width:100%;
                min-height:46px;
                justify-content:center;
                margin-top:10px;
              "
              onclick="window.openSettingsSection('about')"
            >
              About
            </button>

            <button
              type="button"
              class="bb-outline-pill"
              style="
                width:100%;
                min-height:46px;
                justify-content:center;
                margin-top:10px;
              "
              onclick="window.openSettingsSection('advanced')"
            >
              Advanced
            </button>
          </div>
        </section>

        <!-- Sign Out stays at the bottom -->
        <section class="settings-section">
          <div class="card card-pad">
            <button
              id="signout-button"
              type="button"
              class="bb-outline-pill"
              style="
                width:100%;
                min-height:46px;
                justify-content:center;
              "
            >
              Sign Out
            </button>
          </div>
        </section>

      </div>
    </div>
  `;
};

    addBackupSettings = function() {};
  addNotificationSettings = function() {};

  render = function () {
    const result = previousRender.apply(this, arguments);

    if (currentRoute === "settings") {
      refreshHouseholdSettingsCard();
    }

    return result;
  };

  window.render = render;
  window.BillBeaconSettingsCleanup = {version: 3};

  if (document.readyState !== "loading") {
    render();
  }
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
          ? "OWNER"
          : "MEMBER";

      ownerActions.style.display =
        data.role === "owner" ? "block" : "none";

      // Owners of empty personal households may also join.
      // The Worker checks whether switching is permitted.
            memberActions.style.display =
        data.role === "owner" ? "block" : "none";

      let leaveButton = document.getElementById(
        "bbLeaveHouseholdButton"
      );

      if (!leaveButton) {
        leaveButton = document.createElement("button");

        leaveButton.id = "bbLeaveHouseholdButton";
        leaveButton.type = "button";
        leaveButton.className = "bb-outline-pill";
        leaveButton.textContent = "Leave Household";

        leaveButton.style.cssText = `
          width:100%;
          min-height:46px;
          margin-top:12px;
          justify-content:center;
        `;

        leaveButton.onclick = () =>
          window.leaveSharedHousehold();

        memberActions.parentElement.appendChild(
          leaveButton
        );
      }

      leaveButton.style.display =
        data.role === "member" ? "flex" : "none";
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
        } catch (error) {
      const message =
        error?.message ||
        "Could not generate an invite code.";

      const status = document.getElementById(
        "householdInviteStatus"
      );

      if (status) {
        status.style.color = "var(--overdue)";
        status.textContent = message;
      } else {
        alert(message);
      }
    } finally {
      const currentButton =
        document.getElementById(
          "createHouseholdInviteButton"
        );

      if (button) {
        button.disabled = false;
      }

      if (currentButton) {
        currentButton.disabled = false;
      }
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
    window.leaveSharedHousehold = async function () {
    const user =
      window.getBillBeaconFirebaseUser?.();

    if (!user) {
      alert("Please sign in first.");
      return;
    }

    const approved = confirm(
      "Leave this household?\n\n" +
      "You will become the owner of a new, empty " +
      "personal household. Your name and login " +
      "stay the same. The shared household's " +
      "records are not deleted."
    );

    if (!approved) return;

    const app = document.getElementById("app");

    const previousInert =
      app?.inert || false;

    const button = document.getElementById(
      "bbLeaveHouseholdButton"
    );

    if (button) {
      button.disabled = true;
      button.textContent = "Leaving…";
    }

    if (app) app.inert = true;

    let sync;
    let stopped = false;

    try {
      const before =
        await window.billBeaconPrepareDataTransfer();

      sync = await import(
        "./firebase-sync.js"
      );

      const status =
        window.billBeaconSyncStatus?.();

      const context =
        window.getBillBeaconHouseholdContext?.();

      if (
        !status?.ready ||
        status.pending ||
        status.conflict ||
        context?.householdId !== before.householdId ||
        window.getBillBeaconFirebaseUser?.()?.uid !==
          user.uid
      ) {
        throw new Error(
          "Finish syncing before leaving."
        );
      }

      const theme =
        document.documentElement.getAttribute(
          "data-theme"
        ) || "dark";

      sync.stopHouseholdSync();
      stopped = true;

      await householdWorkerRequest(
        "/households/leave",
        {
          householdId: before.householdId,
          theme
        }
      );

      // Clear shared snapshots on this device only.
      // Do not clear Firebase's login storage.
      for (const key of [
        "bills",
        "payments",
        "incomeSources",
        "archivedBills",
        "activityLog",
        "bankTransactions",
        "settings"
      ]) {
        try {
          localStorage.removeItem(key);
        } catch {}
      }

      window.location.reload();
    } catch (error) {
      if (
        stopped &&
        window.getBillBeaconFirebaseUser?.()?.uid ===
          user.uid
      ) {
        await sync.startHouseholdSync(user)
          .catch(() => {});
      }

      alert(
        (
          error?.message ||
          "The request did not finish."
        ) +
        "\n\nRefresh and check your household status " +
        "before trying again."
      );
    } finally {
      if (app) {
        app.inert = previousInert;
      }

      if (button?.isConnected) {
        button.disabled = false;
        button.textContent = "Leave Household";
      }
    }
  };
    window.deleteBillBeaconAccount =
    async function () {
      const user =
        window.getBillBeaconFirebaseUser?.();

      if (!user) {
        alert("Please sign in first.");
        return;
      }

      const first = String(
        user.displayName || ""
      ).trim() || "your";

      const confirmed = confirm(
        `Permanently delete ${first} account?\n\n` +
          "This removes your Bill Beacon profile " +
          "and household membership. Shared " +
          "household records created with others " +
          "are not deleted.\n\n" +
          "This cannot be undone."
      );

      if (!confirmed) return;

      const button = document.getElementById(
        "bbDeleteAccountButton"
      );

      const app = document.getElementById("app");
      const previousInert =
        app?.inert || false;

      if (button) {
        button.disabled = true;
        button.textContent = "Deleting…";
      }

      if (app) app.inert = true;

      let sync;
      let stopped = false;

      try {
        const prepared =
          await window.billBeaconPrepareDataTransfer();

        sync = await import("./firebase-sync.js");

        const status =
          window.billBeaconSyncStatus?.();

        const context =
          window.getBillBeaconHouseholdContext?.();

        if (
          !status?.ready ||
          status.pending ||
          status.conflict ||
          context?.householdId !==
            prepared.householdId ||
          window.getBillBeaconFirebaseUser?.()?.uid !==
            user.uid
        ) {
          throw new Error(
            "Finish syncing before deleting " +
              "this account."
          );
        }

        sync.stopHouseholdSync();
        stopped = true;

        await householdWorkerRequest(
          "/accounts/delete",
          {
            confirm: true
          }
        );

        // Best-effort sign-out; household profile is gone.
        try {
          await window.firebaseAuth?.signOut?.();
        } catch {}

        alert(
          "Your account was deleted. " +
            "You can close Bill Beacon now."
        );

        window.location.reload();
      } catch (error) {
        if (
          stopped &&
          window.getBillBeaconFirebaseUser?.()?.uid ===
            user.uid
        ) {
          await sync
            .startHouseholdSync(user)
            .catch(() => {});
        }

        alert(
          (
            error?.message ||
            "The delete request did not finish."
          ) +
            "\n\nRefresh and check your account " +
            "status before retrying."
        );
      } finally {
        if (app) {
          app.inert = previousInert;
        }

        if (button?.isConnected) {
          button.disabled = false;
          button.textContent =
            "Delete Account";
        }
      }
    };
      window.closeSettingsSectionSheet = function () {
    const container =
      document.getElementById(
        "bbSettingsSectionContainer"
      );

    if (!container) return;

    const overlay =
      document.getElementById(
        "bbSettingsSectionOverlay"
      );

    const sheet =
      document.getElementById(
        "bbSettingsSectionSheet"
      );

    overlay?.classList.remove("show");
    sheet?.classList.remove("show");

    setTimeout(() => {
      container.remove();
    }, 260);
  }
     function buildAccountHouseholdSection() {
    const email =
      window.getBillBeaconUserEmail?.() ||
      "Signed-in account";

    return `
      <section class="settings-section">
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
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:6px;
              "
            >
              <div
                style="
                  font-size:15px;
                  font-weight:800;
                "
              >
                Shared Household
              </div>

              <div
                id="bbHouseholdRole"
                style="
                  font-size:13px;
                  color:var(--text-secondary);
                "
              >
                Loading…
              </div>
            </div>

            <div
              id="bbHouseholdOwnerActions"
              style="display:none;margin-top:12px;"
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

            <!-- Leave Household button is added by refreshHouseholdSettingsCard -->
          </div>
        </div>
      </section>
    `;
  }
function buildNotificationSettingsSection() {
  const selectedOffsets = [];
  const reminderTime = "09:00";

  return `
    <section class="settings-section">
      <div class="card card-pad">
        <p
          id="notificationPermissionStatus"
          style="font-size:var(--text-sm);color:var(--text-muted);line-height:1.5;margin-bottom:var(--space-3)"
        >
          Checking notification status…
        </p>
        <button
          id="notificationPermissionButton"
          type="button"
          class="bb-outline-pill"
          style="width:100%;min-height:46px;justify-content:center"
          onclick="activateBillNotifications()"
        >
          ${svgIcon("bell", 20)}
          <span>Turn On Notifications</span>
        </button>
        <p id="notificationEnrollmentStatus" hidden role="status" aria-live="polite"
          style="font-size:13px;line-height:1.5;margin-top:12px;color:var(--text-secondary)">
          Checking backend registration…
        </p>
        <p
          id="notificationTestStatus"
          style="font-size:var(--text-sm);color:var(--text-muted);line-height:1.5;margin:var(--space-2) 0 0"
          role="status"
          aria-live="polite"
        ></p>
      </div>

      <div class="card card-pad" id="notificationSettingsCard" style="margin-top:var(--space-3)">
        <div style="font-weight:800;font-size:var(--text-base);margin-bottom:var(--space-3)">
          My Bill & Installment Reminders
        </div>

        ${REMINDER_OFFSETS.map(offset => {
          const isSelected = selectedOffsets.includes(offset.days);
          return `
            <div class="form-row">
              <div class="form-label">${escapeHtml(offset.label)}</div>
              <div
                class="form-input-row"
                style="flex:1;display:flex;justify-content:flex-end;align-items:center;"
              >
                <label class="toggle">
                  <input
                    type="checkbox"
                    class="global-reminder-toggle"
                    disabled
                    data-days="${escapeHtml(String(offset.days))}"
                    ${isSelected ? "checked" : ""}
                  />
                  <div class="toggle-track">
                    <div class="toggle-thumb"></div>
                  </div>
                </label>
              </div>
            </div>
          `;
        }).join("")}

        <div class="form-row" style="margin-top:var(--space-1)">
          <div class="form-label">Time</div>
          <div
            class="form-input-row"
            style="flex:1;display:flex;justify-content:flex-end;align-items:center;"
          >
            <input
              id="globalReminderTime"
              disabled
              type="time"
              class="form-input"
              value="${escapeHtml(reminderTime)}"
              style="max-width:130px;text-align:left"
              aria-label="Time of day for bill reminders"
            />
          </div>
        </div>

        <div class="form-row">
          <label class="form-label" for="personalReminderTimeZone">Time zone</label>
          <select
  id="personalReminderTimeZone"
  class="form-select"
  disabled
  style="min-width:0;max-width:65%;text-align:left"
  aria-label="Reminder time zone"
>
  <option value="">Loading time zones…</option>
</select>
        </div>
        <p id="personalReminderSaveStatus" role="status" aria-live="polite"
          style="font-size:13px;line-height:1.5;margin-top:12px;">
          Loading your personal preferences…
        </p>
        

      </div>
    </section>
  `;
}
    function buildIncomeSettingsSection() {
    const sources = Store.getIncomeSources();
    const sourceRows = sources
      .map(
        source => `
        <button
          type="button"
          class="form-row"
          onclick="openIncomeSourceForm('${escapeInlineString(
            source.id
          )}')"
          style="
            width:100%;
            text-align:left;
            background:transparent;
            border:0;
            color:inherit;
            cursor:pointer;
            min-height:52px;
          "
        >
          <span
            style="
              display:flex;
              align-items:center;
              gap:12px;
              width:100%;
            "
          >
            <span
              style="
                flex:1;
                min-width:0;
                font-weight:700;
              "
            >
              ${escapeHtml(source.name)}
            </span>

            <span
              style="font-weight:800;"
            >
              ${formatCurrency(source.expectedAmount)}
            </span>

            ${svgIcon("chevronRight", 18)}
          </span>
        </button>`
      )
      .join("");

    return `
      <section class="settings-section">
      
        ${
          sourceRows
            ? `<div class="card">${sourceRows}</div>`
            : ""
        }

        <button
          type="button"
          class="bb-outline-pill"
          onclick="openIncomeSourceForm()"
          style="
            width:100%;
            min-height:46px;
            justify-content:center;
            ${
              sourceRows
                ? "margin-top:12px;"
                : "margin-top:0;"
            }
          "
        >
          <span class="pill-icon">
            ${svgIcon("plus", 18)}
          </span>
          <span>Add Income Source</span>
        </button>
      </section>
    `;
  }
    function buildAppearanceSettingsSection() {
  const preference = getDeviceAppearance();
  const automatic = preference.mode === "system";
  return `
    <section class="settings-section" data-bb-device-appearance>
      <div class="card">
        ${settingsAction("Dark", "check", "setTheme('dark')", preference.mode === "dark")}
        ${settingsAction("Light", "check", "setTheme('light')", preference.mode === "light")}
        ${settingsAction("Automatic", "check", "setTheme('system')", automatic)}
      </div>
      
      ${automatic ? `
        <div class="section-header">Automatic appearance</div>
        <div class="card">
          ${settingsAction("Follow device", "check",
            "updateDeviceAppearance({source:'device'})", preference.source === "device")}
          ${settingsAction("Custom schedule", "check",
            "updateDeviceAppearance({source:'schedule'})", preference.source === "schedule")}
        </div>
        ${preference.source === "schedule" ? `
          <div class="card" style="margin-top:12px;">
            <div class="form-row">
              <label class="form-label" for="bbAppearanceLightAt">Light starts</label>
              <input class="form-input" id="bbAppearanceLightAt" type="time"
                value="${preference.lightAt}"
                onchange="updateDeviceAppearance({lightAt:this.value})">
            </div>
            <div class="form-row">
              <label class="form-label" for="bbAppearanceDarkAt">Dark starts</label>
              <input class="form-input" id="bbAppearanceDarkAt" type="time"
                value="${preference.darkAt}"
                onchange="updateDeviceAppearance({darkAt:this.value})">
            </div>
          </div>
          <p class="settings-footer" style="margin-top:12px;">
            Uses this device's local time. 
          </p>
        ` : ""}
      ` : ""}
    </section>
  `;
}

window.addEventListener("bb-device-appearance-changed", () => {
  const body = document.getElementById("bbSettingsSectionBody");
  if (!body?.querySelector("[data-bb-device-appearance]")) return;
  const scroll = body.scrollTop;
  body.innerHTML = buildAppearanceSettingsSection();
  body.scrollTop = scroll;
});
   function buildRecordsSettingsSection() {
  return `
    <section class="settings-section">
      

      <div class="card">
        ${settingsAction(
          "Export Bills CSV",
          "export",
          "exportCSV()"
        )}

        ${settingsAction(
          "Import Bills CSV",
          "tray",
          "document.getElementById('billImportFile').click()"
        )}
      </div>

      <input
        id="billImportFile"
        type="file"
        accept=".csv,text/csv"
        style="display:none;"
        onchange="importBillsCSV(event)"
      >
    </section>
  `;
}
    function buildAboutSettingsSection() {
    return `
      <section class="settings-section">
           <div class="card card-pad">
          <div style="font-weight:800;">
            App Name:Bill Beacon,
            Version: 2.1
          
          </div>
        </div>
      </section>
    `;
  }
    function buildAdvancedSettingsSection() {
    return `
      <section class="settings-section">
        

        <div class="card card-pad">
          <button
            id="bbDeleteAccountButton"
            type="button"
            class="bb-outline-pill"
            onclick="window.deleteBillBeaconAccount()"
            style="
              width:100%;
              min-height:46px;
              justify-content:center;
              color:var(--overdue);
              border-color:var(--overdue);
            "
          >
            Delete Account
          </button>


          <button
            type="button"
            class="bb-outline-pill"
            onclick="clearAllAppData()"
            style="
              width:100%;
              min-height:46px;
              margin-top:16px;
              justify-content:center;
              color:var(--overdue);
              border-color:var(--overdue);
            "
          >
            Clear App Data
          </button>

        </div>
      </section>
    `;
  }

  window.openSettingsSection = function (section) {
    document.getElementById(
      "bbSettingsSectionContainer"
    )?.remove();


 
    const container =
      document.createElement("div");

    container.id =
      "bbSettingsSectionContainer";

    container.innerHTML = `
      <div
        class="sheet-overlay show"
        id="bbSettingsSectionOverlay"
        onclick="closeSettingsSectionSheet()"
      ></div>

      <div
        class="sheet show"
        id="bbSettingsSectionSheet"
      >
        <div class="sheet-handle"></div>

        <div class="sheet-nav">
          <button
            type="button"
            class="nav-button"
            onclick="closeSettingsSectionSheet()"
            aria-label="Close settings section"
            style="color:var(--text);"
          >
            ${svgIcon("chevronLeft", 22)}
          </button>

          <div
            id="bbSettingsSectionTitle"
            class="nav-title"
          >
            Settings
          </div>

          <div style="width:44px;"></div>
        </div>

        <div
          class="sheet-body content-gap"
          id="bbSettingsSectionBody"
        ></div>
      </div>
    `;

    document.body.appendChild(container);

    const titleElement =
      document.getElementById(
        "bbSettingsSectionTitle"
      );

    const bodyElement =
      document.getElementById(
        "bbSettingsSectionBody"
      );

    if (!bodyElement || !titleElement) {
      return;
    }

    let title = "Settings";
    let content = "";

    if (section === "account") {
      title = "Account & Household";
      content = buildAccountHouseholdSection();
    } else if (section === "notifications") {
      title = "Notifications";
      content = buildNotificationSettingsSection();
    } else if (section === "income") {
      title = "Income & Paychecks";
      content = buildIncomeSettingsSection();
    } else if (section === "appearance") {
      title = "Appearance";
      content = buildAppearanceSettingsSection();
    } else if (section === "records") {
      title = "Import & Export Data";
      content = buildRecordsSettingsSection();
    } else if (section === "about") {
      title = "About";
      content = buildAboutSettingsSection();
    } else if (section === "advanced") {
      title = "Advanced";
      content = buildAdvancedSettingsSection();
    }

    titleElement.textContent = title;
bodyElement.innerHTML = content;

// Re-run household / notification helpers when needed.
if (section === "account") {
  refreshHouseholdSettingsCard();
} else if (section === "notifications") {
  loadPersonalReminderSettings();
  refreshNotificationSettingsCard();

  // Attach handlers for the reminder-day options.
  document
    .querySelectorAll(".global-reminder-toggle")
    .forEach(input => {
      input.addEventListener(
        "change",
        saveGlobalReminderSettings
      );
    });

  // Save when the reminder time changes.
  const timeInput = document.getElementById(
    "globalReminderTime"
  );

  if (timeInput) {
    timeInput.addEventListener(
      "change",
      saveGlobalReminderSettings
    );
  }

  // NEW: save when the reminder time zone changes.
  const zoneInput = document.getElementById(
    "personalReminderTimeZone"
  );

  if (zoneInput) {
    zoneInput.addEventListener(
      "change",
      saveGlobalReminderSettings
    );
  }
}
  };
})();