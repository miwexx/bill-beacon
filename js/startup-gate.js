/* Bill Beacon: neutral authentication/household startup gate.
   Load synchronously in <head>, after the critical CSS in the read-me. */
(() => {
  "use strict";
  if (window.BillBeaconStartupGate) return;
  const root = document.documentElement;
  let phase = "loading";
  let expectedUid = null;
  let timer = null;
  let failure = "";
  let lastStage = "Checking your saved session…";
  let panel = null;
  const appUser = () => window.getBillBeaconFirebaseUser?.() || null;
  const context = () => window.getBillBeaconHouseholdContext?.();

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
          <button type="button" id="bb-startup-retry" style="min-height:46px;border:1px solid var(--border,#555);border-radius:12px;background:var(--surface,#20202b);color:inherit;font:inherit;cursor:pointer;">Retry</button>
          <button type="button" id="bb-startup-signout" style="min-height:46px;border:1px solid var(--border,#555);border-radius:12px;background:transparent;color:inherit;font:inherit;cursor:pointer;">Sign Out</button>
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
      if (phase !== "loading") return;
      failure = "This is taking longer than expected. Check your connection and retry. You have not been signed out by this screen.";
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

  function fail(message) {
    if (phase !== "loading") return;
    clearTimeout(timer);
    failure = message;
    paint();
  }

  function reveal() {
    const user = appUser();
    const live = context();
    if (phase !== "loading" || !expectedUid || !user ||
        user.uid !== expectedUid || !live?.ready || live.uid !== user.uid ||
        !live.householdId) return false;
    clearTimeout(timer);
    phase = "ready";
    root.setAttribute("data-bb-startup", "ready");
    // The existing auth module remains responsible for .hidden and inline display.
    return true;
  }

  function retry() {
    const user = appUser();
    const live = context();
    if (!user || !window.billBeaconSyncStatus) {
      window.location.reload();
      return;
    }
    if (live?.ready && live.uid === user.uid && expectedUid === user.uid) {
      failure = "";
      window.dispatchEvent(new CustomEvent("billbeacon:household-ready", {detail:live}));
      reveal();
      return;
    }
    // Reload when setup may still be running, instead of starting a second sync job.
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
    if (app) {
      app.style.display = "none";
      app.replaceChildren();
    }
    // Remove leftover app dialogs and copied page previews on a real signed-out transition.
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
    expectedUid = user.uid;
    loading("Loading your household…");
    // Sync initialization follows this event; reveal only after its ready event.
  });

  window.addEventListener("billbeacon:household-ready", event => {
    const live = context();
    const incoming = event.detail;
    if (!incoming?.ready || incoming.uid !== expectedUid ||
        incoming.uid !== live?.uid || incoming.householdId !== live?.householdId ||
        incoming.generation !== live?.generation) return;
    reveal();
  });

  window.addEventListener("billbeacon:signed-out", () => {
    if (appUser()) return;
    clearTimeout(timer);
    phase = "login";
    expectedUid = null;
    failure = "";
    discardOldScreens();
    root.setAttribute("data-bb-startup", "login");
    paint();
  });

  window.addEventListener("billbeacon:sync-status", event => {
    if (phase !== "loading" || !expectedUid || appUser()?.uid !== expectedUid) return;
    if (event.detail?.state === "error") {
      fail("Your account is signed in, but household loading could not finish. Check your connection and retry, or choose Sign Out.");
    }
  });

  window.addEventListener("online", () => {
    if (phase === "loading" && failure) {
      lastStage = "Connection restored. Waiting for your household…";
      paint();
    }
  });

  window.BillBeaconStartupGate = {getState:() => ({phase, expectedUid, error:failure || null})};
  root.setAttribute("data-bb-startup", "loading");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint, {once:true});
  else paint();
  armSlowWarning();
})();