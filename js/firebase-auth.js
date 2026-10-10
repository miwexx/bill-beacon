
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtQjabLSI4qoHPqGn7BQYWwLhOtpa2BLI",
  authDomain: "bill-beacon-1646c.firebaseapp.com",
  projectId: "bill-beacon-1646c",
  storageBucket: "bill-beacon-1646c.firebasestorage.app",
  messagingSenderId: "573940060750",
  appId: "1:573940060750:web:17ae12740a4fead0aee91f",
  measurementId: "G-KTS8E5YZM1"
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

function getElement(id) {
  return document.getElementById(id);
}

function setMessage(message = "", isError = false) {
  const messageElement = getElement("login-error");

  if (!messageElement) return;

  messageElement.textContent = message;
  messageElement.style.color = isError ? "#ff9d9d" : "";
}

function showLogin() {
  householdLoading = false;
  closeCreateAccountDialog(true);
  setLoginControlsLocked(false);
  setupActions(false);
  const password = getElement("password-login");
  if (password) password.value = "";
  window.dispatchEvent(new CustomEvent("billbeacon:signed-out"));

  const loginScreen = getElement("login-screen");
  const app = getElement("app");

  loginScreen?.classList.remove("hidden");

  if (app) {
    app.style.display = "none";
  }
}

function showApp() {
  householdLoading = true;
  closeCreateAccountDialog(true);
  getElement("login-screen")?.classList.remove("hidden");
  const app = getElement("app");
  if (app) app.style.display = "none";
  setLoginControlsLocked(true);
  setupActions(false);
  setMessage("Loading your account…");
  window.dispatchEvent(new CustomEvent("billbeacon:authenticated", {detail:{user:auth.currentUser}}));
  revealReadyHousehold();
}


function friendlyError(error) {
  const code = error?.code || "";

  const messages = {
    "auth/invalid-email": "Enter a valid email address.",
    "auth/missing-email": "Enter your email address.",
    "auth/missing-password": "Enter your password.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/email-already-in-use":
      "That email already has an account. Choose Sign In instead.",
    "auth/invalid-credential":
      "The email or password is not correct.",
    "auth/user-not-found":
      "No account was found for that email. Choose Create Account.",
    "auth/wrong-password":
      "The email or password is not correct.",
    "auth/too-many-requests":
      "Too many attempts. Wait a moment, then try again.",
    "auth/unauthorized-domain":
      "This site domain is not authorized in Firebase Authentication."
  };

  return messages[code] || error?.message || "Something went wrong. Try again.";
}

let signupBusy = false;
let signupPreviousFocus = null;
let householdLoading = false;

function signupValidation(email, password, confirmation) {
  if (!email.trim()) return "Enter your email address.";
  if (!password) return "Enter a password.";
  if (password.length < 6) return "Use a password with at least 6 characters.";
  if (!confirmation) return "Confirm your password.";
  if (password !== confirmation) return "The passwords do not match.";
  return "";
}

function closeCreateAccountDialog(force = false) {
  if (signupBusy && !force) return;
  const dialog = getElement("billBeaconSignupDialog");
  if (!dialog) return;
  dialog.querySelectorAll('input[type="password"]').forEach(input => { input.value = ""; });
  dialog.remove();
  if (!force && signupPreviousFocus?.isConnected) signupPreviousFocus.focus();
  signupPreviousFocus = null;
}

function openCreateAccountDialog() {
  if (householdLoading || auth.currentUser) return;
  if (getElement("billBeaconSignupDialog")) return;
  signupPreviousFocus = document.activeElement;
  const dialog = document.createElement("div");
  dialog.id = "billBeaconSignupDialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "billBeaconSignupTitle");
  dialog.style.cssText = "position:fixed;inset:0;z-index:30000;display:flex;align-items:center;justify-content:center;padding:max(20px,env(safe-area-inset-top)) 20px max(20px,env(safe-area-inset-bottom));background:rgba(0,0,0,.72);overflow-y:auto;box-sizing:border-box;";
  dialog.innerHTML = `
    <section style="width:min(100%,440px);max-height:calc(100dvh - 40px);overflow-y:auto;padding:24px;border:1px solid var(--border);border-radius:24px;background:var(--surface);color:var(--text);box-sizing:border-box;">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;">
        <h2 id="billBeaconSignupTitle" style="margin:0;font-size:24px;font-weight:800;">Create Account</h2>
        <button id="signupClose" type="button" aria-label="Close Create Account" style="min-width:44px;min-height:44px;font-size:28px;color:var(--accent);">&times;</button>
      </header>
      <form id="billBeaconSignupForm" novalidate style="display:grid;gap:12px;">
        <label class="login-label" for="signupEmail">Email</label>
        <input class="login-input" id="signupEmail" name="email" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" required>
        <label class="login-label" for="signupPassword">Password</label>
        <input class="login-input" id="signupPassword" name="password" type="password" autocomplete="new-password" minlength="6" required>
        <label class="login-label" for="signupConfirmation">Confirm Password</label>
        <input class="login-input" id="signupConfirmation" name="confirmation" type="password" autocomplete="new-password" minlength="6" required>
        <div id="signupError" role="alert" aria-live="polite" style="color:var(--overdue);font-size:14px;line-height:1.4;"></div>
        <button id="signupSubmit" type="submit" class="login-button login-button-primary">Create Account</button>
        <button id="signupCancel" type="button" class="login-button login-button-secondary">Cancel</button>
      </form>
    </section>`;
  document.body.appendChild(dialog);
  getElement("signupEmail").value = getElement("email-login")?.value.trim() || "";
  getElement("signupClose").addEventListener("click", () => closeCreateAccountDialog());
  getElement("signupCancel").addEventListener("click", () => closeCreateAccountDialog());
  dialog.addEventListener("click", event => { if (event.target === dialog) closeCreateAccountDialog(); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); closeCreateAccountDialog(); }
    if (event.key === "Tab") {
      const focusable = [...dialog.querySelectorAll("button,input")].filter(node => !node.disabled);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  getElement("billBeaconSignupForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (signupBusy) return;
    const emailField = getElement("signupEmail");
    const passwordField = getElement("signupPassword");
    const confirmationField = getElement("signupConfirmation");
    const email = emailField.value.trim();
    const password = passwordField.value;
    const confirmation = confirmationField.value;
    const errorBox = getElement("signupError");
    const validation = signupValidation(email, password, confirmation);
    if (validation || !emailField.validity.valid) {
      errorBox.textContent = validation || "Enter a valid email address.";
      return;
    }
    signupBusy = true;
    errorBox.textContent = "";
    const controls = [...dialog.querySelectorAll("button,input")];
    controls.forEach(control => { control.disabled = true; });
    getElement("signupSubmit").textContent = "Creating account…";
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const loginEmail = getElement("email-login");
      if (loginEmail) loginEmail.value = email;
      const loginPassword = getElement("password-login");
      if (loginPassword) loginPassword.value = "";
      window.dispatchEvent(new CustomEvent("billbeacon:account-created", {detail: {uid: credential.user.uid}}));
      closeCreateAccountDialog(true);
    } catch (error) {
      if (dialog.isConnected) errorBox.textContent = friendlyError(error);
    } finally {
      signupBusy = false;
      if (dialog.isConnected) {
        controls.forEach(control => { control.disabled = false; });
        getElement("signupSubmit").textContent = "Create Account";
      }
    }
  });
  requestAnimationFrame(() => { if (dialog.isConnected) getElement("signupEmail")?.focus(); });
}

function setLoginControlsLocked(locked) {
  for (const id of ["email-login","password-login","email-signin-button","email-create-button","forgot-password-button"]) {
    const control = getElement(id);
    if (control) control.disabled = locked;
  }
}

function setupActions(show = false) {
  let actions = getElement("billBeaconSetupActions");
  if (!actions) {
    const message = getElement("login-error");
    if (!message?.parentElement) return;
    actions = document.createElement("div");
    actions.id = "billBeaconSetupActions";
    actions.style.cssText = "display:none;gap:10px;margin-top:14px;";
    actions.innerHTML = '<button id="billBeaconRetrySetup" type="button" class="login-button login-button-primary">Retry Setup</button><button id="billBeaconSetupSignOut" type="button" class="login-button login-button-secondary">Sign Out</button>';
    message.parentElement.appendChild(actions);
    getElement("billBeaconRetrySetup").addEventListener("click", () => {
      if (!auth.currentUser) return;
      setupActions(false);
      setMessage("Loading your account…");
      window.dispatchEvent(new CustomEvent("billbeacon:authenticated", {detail:{user:auth.currentUser}}));
      revealReadyHousehold();
    });
    getElement("billBeaconSetupSignOut").addEventListener("click", async () => {
      try { await signOut(auth); }
      catch (error) { setMessage(friendlyError(error), true); }
    });
  }
  actions.style.display = show ? "grid" : "none";
}

function revealReadyHousehold() {
  const context = window.getBillBeaconHouseholdContext?.();
  if (!auth.currentUser || !context?.ready || context.uid !== auth.currentUser.uid) return false;
  householdLoading = false;
  setLoginControlsLocked(false);
  setupActions(false);
  setMessage("");
  getElement("login-screen")?.classList.add("hidden");
  const app = getElement("app");
  if (app) app.style.display = "";
  return true;
}

window.addEventListener("billbeacon:household-ready", revealReadyHousehold);
window.addEventListener("billbeacon:sync-status", event => {
  if (!householdLoading || !auth.currentUser || event.detail?.state !== "error") return;
  setMessage("Account setup could not finish. Retry setup or sign out.", true);
  setupActions(true);
});


async function signIn() {
  const email = getElement("email-login")?.value.trim() || "";
  const password = getElement("password-login")?.value || "";

  if (!email || !password) {
    setMessage("Enter an email and password.", true);
    return;
  }

  setMessage("Signing in…");

  await signInWithEmailAndPassword(auth, email, password);
}

async function resetPassword() {
  const email = getElement("email-login")?.value.trim() || "";

  if (!email) {
    setMessage(
      "Enter your household email first, then choose Forgot password.",
      true
    );

    getElement("email-login")?.focus();
    return;
  }

  setMessage("Sending password-reset email…");

  await sendPasswordResetEmail(auth, email);

  setMessage(
    "Password-reset email sent. Check your inbox and spam folder."
  );
}

function setBusy(button, busy, busyText, normalText) {
  if (!button) return;

  button.disabled = busy || householdLoading;
  button.textContent = busy ? busyText : normalText;
}
function getHouseholdInviteToken() {
  return new URLSearchParams(window.location.search).get("invite") || "";
}

function clearHouseholdInviteTokenFromUrl() {
  const cleanUrl = new URL(window.location.href);

  cleanUrl.searchParams.delete("invite");

  window.history.replaceState(
    {},
    document.title,
    `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`
  );
}

async function handleHouseholdInvite(user) {
  const inviteToken = getHouseholdInviteToken();

  if (!inviteToken || !user) {
    return false;
  }

  const shouldJoin = window.confirm(
    "Join this shared household? You will be able to see and manage its shared bills."
  );

  if (!shouldJoin) {
    return false;
  }

  try {
    const idToken = await user.getIdToken();

    const response = await fetch(
  "https://bill-beacon-notifications.rodz-m-1990.workers.dev/household-invites/accept",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({
      token: inviteToken
    })
  }
);

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Could not join the household.");
    }

    clearHouseholdInviteTokenFromUrl();

    window.alert("You joined the shared household.");

    window.location.reload();

    return true;
  } catch (error) {
    console.error("Household invite acceptance failed:", error);

    window.alert(
      error?.message ||
        "Could not join the household. Check the invite and try again."
    );

    return false;
  }
}
function initFirebaseLogin() {
  const signInButton = getElement("email-signin-button");
  const createButton = getElement("email-create-button");
  const forgotPasswordButton = getElement("forgot-password-button");

  if (!signInButton || !createButton) {
    setMessage("Login controls are missing. Refresh and try again.", true);
    return;
  }

  signInButton.addEventListener("click", async () => {
    try {
      setBusy(signInButton, true, "Signing in…", "Sign In");
      await signIn();
    } catch (error) {
      console.error("Firebase sign-in failed:", error);
      setMessage(friendlyError(error), true);
    } finally {
      setBusy(signInButton, false, "Signing in…", "Sign In");
    }
  });

  createButton.addEventListener("click", openCreateAccountDialog);

  forgotPasswordButton?.addEventListener("click", async () => {
    try {
      setBusy(
        forgotPasswordButton,
        true,
        "Sending reset email…",
        "Forgot password?"
      );

      await resetPassword();
    } catch (error) {
      console.error("Firebase password reset failed:", error);

      const code = error?.code || "";

      if (code === "auth/invalid-email") {
        setMessage("Enter a valid email address.", true);
      } else if (code === "auth/user-not-found") {
        setMessage("No household account was found for that email.", true);
      } else if (code === "auth/too-many-requests") {
        setMessage("Too many attempts. Wait a moment, then try again.", true);
      } else {
        setMessage(
          error?.message || "Could not send the reset email. Try again.",
          true
        );
      }
    } finally {
      setBusy(
        forgotPasswordButton,
        false,
        "Sending reset email…",
        "Forgot password?"
      );
    }
  });

  onAuthStateChanged(auth, async (user) => {
  if (user) {
    setMessage("");

    const joinedHousehold = await handleHouseholdInvite(user);

    if (!joinedHousehold) {
      showApp();
    }
  } else {
    showLogin();
  }
});
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFirebaseLogin, {
    once: true
  });
} else {
  initFirebaseLogin();
}

function getCurrentUserEmail() {
  return auth.currentUser?.email || "";
}

async function getCurrentUserIdToken(forceRefresh = false) {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  return user.getIdToken(forceRefresh);
}

window.getBillBeaconUserEmail = getCurrentUserEmail;
window.getBillBeaconFirebaseToken = getCurrentUserIdToken;

window.getBillBeaconFirebaseUser = function () {
  return auth.currentUser || null;
};

window.getBillBeaconFirestore = function () {
  return firestore;
};

window.firebaseCollection = collection;
window.firebaseDoc = doc;
window.firebaseQuery = query;
window.firebaseOrderBy = orderBy;
window.firebaseLimit = limit;
window.firebaseOnSnapshot = onSnapshot;
window.firebaseUpdateDoc = updateDoc;
window.firebaseWriteBatch = writeBatch;

export {
  auth,
  firestore,
  signOut,
  getCurrentUserEmail,
  getCurrentUserIdToken
};

window.BillBeaconAuth = {
  async getIdToken() {
    const user = auth.currentUser;

    if (!user) {
      return "";
    }

    return user.getIdToken();
  }
};