/* Bill Beacon startup gate: last confirmed signed-out state is a UI hint only. */
(() => {
  "use strict";
  if (window.BillBeaconStartupGate) return;
  const root = document.documentElement;
  const LOGIN_HINT = "billbeacon:last-confirmed-signed-out";
  let loginHint = false;
  try { loginHint = localStorage.getItem(LOGIN_HINT) === "1"; } catch (_) {}
  let phase = loginHint ? "login" : "loading";
  let expectedUid = null;
  let authSettled = false;
  let timer = null;
  let failure = "";
  let lastStage = "Checking your saved session…";
  let panel = null;
  const appUser = () => window.getBillBeaconFirebaseUser?.() || null;
  const context = () => window.getBillBeaconHouseholdContext?.();

  function rememberSignedOut(value) {
    try {
      if (value) localStorage.setItem(LOGIN_HINT, "1");
      else localStorage.removeItem(LOGIN_HINT);
    } catch (_) {}
  }

  function lockLogin(locked) {
    for (const id of ["email-login", "password-login", "email-signin-button", "email-create-button", "forgot-password-button"]) {
      const control = document.getElementById(id);
      if (control) control.disabled = locked;
    }
  }

  function paint() {
    if (!document.body) return;
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "bb-startup-screen";
      panel.setAttribute("aria-label", "Opening Bill Beacon");
      panel.innerHTML = `<div style="width:min(340px,100%);text-align:center;">
        <div style="font-size:22px;font-weight:700;">Bill Beacon</div>
        <p id="bb-startup-message" role="status" aria-live="polite" style="margin:14px 0 0;font-size:14px;line-height:1.5;"></p>
        <div id="bb-startup-actions" style="display:none;gap:10px;margin-top:22px;">
          <button type="button" id="bb-startup-retry" style="min-height:46px;border:1px solid #ccd3df;border-radius:12px;background:#f2f4f8;color:#202b3d;font:inherit;cursor:pointer;">Retry</button>
          <button type="button" id="bb-startup-signout" style="min-height:46px;border:1px solid #ccd3df;border-radius:12px;background:#f2f4f8;color:#202b3d;font:inherit;cursor:pointer;">Sign Out</button>
        </div>
      </div>`;
      document.body.appendChild(panel);
      panel.querySelector("#bb-startup-retry").addEventListener("click", retry);
      panel.querySelector("#bb-startup-signout").addEventListener("click", requestSignOut);
    }
    panel.classList.toggle("bb-startup-error", Boolean(failure));
    panel.querySelector("#bb-startup-message").textContent = failure || lastStage;
    panel.querySelector("#bb-startup-actions").style.display = failure ? "grid" : "none";
    panel.querySelector("#bb-startup-signout").hidden = !appUser();
  }

  function armSlowWarning() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (phase === "ready" || (phase === "login" && authSettled)) return;
      phase = "loading";
      root.setAttribute("data-bb-startup", "loading");
      failure = "Startup is taking longer than expected. Check your connection and retry. This screen has not signed you out.";
      paint();
    }, 25000);
  }

  function loading(message) {
    phase = "loading";
    failure = "";
    lastStage = message;
    root.setAttribute("data-bb-startup", "loading");
    paint();
    armSlowWarning();
  }

  function reveal() {
    const user = appUser();
    const live = context();
    if (!authSettled || phase !== "loading" || !expectedUid || !user ||
        user.uid !== expectedUid || !live?.ready || live.uid !== user.uid || !live.householdId) return false;
    clearTimeout(timer);
    phase = "ready";
    failure = "";
    rememberSignedOut(false);
    root.setAttribute("data-bb-startup", "ready");
    return true;
  }

  function retry() {
    const user = appUser();
    const live = context();
    if (user && live?.ready && live.uid === user.uid && expectedUid === user.uid) {
      failure = "";
      window.dispatchEvent(new CustomEvent("billbeacon:household-ready", {detail:live}));
      reveal();
      return;
    }
    window.location.reload();
  }

  async function requestSignOut() {
    const button = panel?.querySelector("#bb-startup-signout");
    if (button) button.disabled = true;
    try {
      const {auth, signOut} = await import("./firebase-auth.js");
      await signOut(auth);
    } catch (error) {
      failure = error?.message || "Could not sign out. Please retry.";
      paint();
    } finally {
      if (button?.isConnected) button.disabled = false;
    }
  }

  function discardOldScreens() {
    const app = document.getElementById("app");
    if (app) { app.style.display = "none"; app.replaceChildren(); }
    for (const child of Array.from(document.body?.children || [])) {
      if (["app", "login-screen", "bb-startup-screen"].includes(child.id)) continue;
      if (["SCRIPT", "STYLE", "LINK", "NOSCRIPT"].includes(child.tagName)) continue;
      if (child.matches("dialog, [role='dialog'], [role='alertdialog']") ||
          child.querySelector(".sheet, .bill-details-sheet, [data-bb-copy-id], [role='dialog']")) child.remove();
    }
  }

  window.addEventListener("billbeacon:authenticated", event => {
    const user = event.detail?.user;
    if (!user?.uid || appUser()?.uid !== user.uid) return;
    authSettled = true;
    expectedUid = user.uid;
    rememberSignedOut(false);
    loading("Loading your household…");
  });

  window.addEventListener("billbeacon:household-ready", event => {
    const live = context();
    const incoming = event.detail;
    if (!incoming?.ready || incoming.uid !== expectedUid || incoming.uid !== live?.uid ||
        incoming.householdId !== live?.householdId || incoming.generation !== live?.generation) return;
    reveal();
  });

  window.addEventListener("billbeacon:signed-out", () => {
    if (appUser()) return;
    clearTimeout(timer);
    authSettled = true;
    phase = "login";
    expectedUid = null;
    failure = "";
    rememberSignedOut(true);
    discardOldScreens();
    root.setAttribute("data-bb-startup", "login");
    lockLogin(false);
    paint();
  });

  window.addEventListener("billbeacon:sync-status", event => {
    if (phase !== "loading" || !expectedUid || appUser()?.uid !== expectedUid) return;
    if (event.detail?.state === "error") {
      clearTimeout(timer);
      failure = "Your account is signed in, but household loading could not finish. Check your connection and retry, or choose Sign Out.";
      paint();
    }
  });

  window.BillBeaconStartupGate = {getState:() => ({phase, expectedUid, authSettled, error:failure || null})};
  root.setAttribute("data-bb-startup", phase);
  function initializeUI() {
    if (!authSettled) lockLogin(true);
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeUI, {once:true});
  else initializeUI();
  armSlowWarning();
})();