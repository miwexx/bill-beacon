
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

async function openCreateAccountDialog() {
  if (householdLoading || auth.currentUser) return;

  let createdUser = null;

  return bbAccountForm(
    "Create Account",
    [
      {
        key: "firstName",
        label: "First Name",
        autocomplete: "given-name"
      },
      {
        key: "lastName",
        label: "Last Name",
        autocomplete: "family-name"
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        autocomplete: "email",
        value: getElement("email-login")?.value.trim()
      },
      {
        key: "password",
        label: "Password",
        type: "password",
        autocomplete: "new-password"
      },
      {
        key: "confirmation",
        label: "Confirm Password",
        type: "password",
        autocomplete: "new-password"
      }
    ],
    "Create Account",
    async (values, inputs) => {
      if (!values.firstName.trim() || !values.lastName.trim()) {
        throw new Error("Enter both first and last name.");
      }

      if (!createdUser) {
        if (values.password.length < 6) {
          throw new Error(
            "Use a password with at least 6 characters."
          );
        }

        if (values.password !== values.confirmation) {
          throw new Error("The passwords do not match.");
        }

        const result = await createUserWithEmailAndPassword(
          auth,
          values.email.trim(),
          values.password
        );

        createdUser = result.user;

        const loginEmail = getElement("email-login");
        if (loginEmail) loginEmail.value = values.email.trim();

        const loginPassword = getElement("password-login");
        if (loginPassword) loginPassword.value = "";

        inputs.email.disabled = true;

        for (const key of ["password", "confirmation"]) {
          inputs[key].value = "";
          inputs[key].required = false;
          inputs[key].disabled = true;
        }
      }

      bbCheckAccountUser(createdUser);

      try {
        await bbSaveAccountName(
          values.firstName,
          values.lastName,
          createdUser
        );
      } catch {
        throw new Error(
          "The account was created, but name setup did not finish. " +
          "Retry this button to save the name, or use Change Name " +
          "in Settings. No second account will be created by this retry."
        );
      }

      window.dispatchEvent(
        new CustomEvent("billbeacon:account-created", {
          detail: {
            uid: createdUser.uid
          }
        })
      );

      return "Your account has been created.";
    }
  );
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
const bbAccountSDK = Promise.all([
  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")
]);

function bbAccountUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in first.");
  return user;
}

function bbCheckAccountUser(user) {
  if (auth.currentUser?.uid !== user.uid) {
    throw new Error("The signed-in account changed. Close this window and try again.");
  }
}

async function bbWriteProfileFields(user, fields) {
  const [, dbSDK] = await bbAccountSDK;
  const allowed = ["firstName", "lastName", "displayName", "email"];
  if (Object.keys(fields).some(key => !allowed.includes(key))) {
    throw new Error("Invalid profile update.");
  }
  const patch = { ...fields, updatedAt: new Date().toISOString() };
  for (let attempt = 0; attempt < 20; attempt++) {
    bbCheckAccountUser(user);
    try {
      await dbSDK.runTransaction(firestore, async transaction => {
        bbCheckAccountUser(user);
        const userRef = dbSDK.doc(firestore, "users", user.uid);
        const profile = await transaction.get(userRef);
        if (!profile.exists() || !profile.data().householdId) {
          throw Object.assign(new Error("Household profile is still loading."), { code: "bb/profile-loading" });
        }
        const householdId = profile.data().householdId;
        if (typeof householdId !== "string" || householdId.includes("/")) {
          throw new Error("The household profile needs repair.");
        }
        const memberRef = dbSDK.doc(firestore, "households", householdId, "members", user.uid);
        const member = await transaction.get(memberRef);
        bbCheckAccountUser(user);
        if (!member.exists()) {
          throw Object.assign(new Error("Household membership is still loading."), { code: "bb/profile-loading" });
        }
        const membership = member.data();
        if (!["owner", "member"].includes(membership.role) ||
            (membership.uid && membership.uid !== user.uid)) {
          throw new Error("Household membership needs review.");
        }
        transaction.update(userRef, patch);
        transaction.update(memberRef, patch);
      });
      return;
    } catch (error) {
      if (error.code !== "bb/profile-loading" || attempt === 19) throw error;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

async function bbSaveAccountName(firstName, lastName, user = bbAccountUser()) {
  firstName = String(firstName || "").trim();
  lastName = String(lastName || "").trim();
  if (!firstName || !lastName) throw new Error("Enter both first and last name.");
  if (firstName.length > 100 || lastName.length > 100) {
    throw new Error("Each name must be 100 characters or fewer.");
  }
  const displayName = `${firstName} ${lastName}`;
  await bbWriteProfileFields(user, { firstName, lastName, displayName });
  bbCheckAccountUser(user);
  const [authSDK] = await bbAccountSDK;
  try {
    await authSDK.updateProfile(user, { displayName });
  } catch {
    throw new Error("Your name was saved in Firestore, but the sign-in profile did not update. Retry Save.");
  }
}

async function bbReauthenticate(currentPassword) {
  const user = bbAccountUser();
  if (!currentPassword) throw new Error("Enter your current password.");
  const [authSDK] = await bbAccountSDK;
  const credential = authSDK.EmailAuthProvider.credential(user.email, currentPassword);
  await authSDK.reauthenticateWithCredential(user, credential);
  bbCheckAccountUser(user);
  return user;
}

async function bbChangeAccountPassword(currentPassword, newPassword, confirmation) {
  if (newPassword.length < 6) throw new Error("Use at least 6 characters for the new password.");
  if (newPassword !== confirmation) throw new Error("The new passwords do not match.");
  const user = await bbReauthenticate(currentPassword);
  const [authSDK] = await bbAccountSDK;
  await authSDK.updatePassword(user, newPassword);
}

async function bbChangeAccountEmail(currentPassword, newEmail) {
  newEmail = String(newEmail || "").trim();
  if (!newEmail) throw new Error("Enter the new email address.");
  const user = await bbReauthenticate(currentPassword);
  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    throw new Error("Enter a different email address.");
  }
  const [authSDK] = await bbAccountSDK;
  await authSDK.verifyBeforeUpdateEmail(user, newEmail);
}

async function bbSyncAccountEmail(user = bbAccountUser()) {
  bbCheckAccountUser(user);
  await user.reload();
  bbCheckAccountUser(user);
  await user.getIdToken(true);
  if (!user.email) throw new Error("The account has no email address.");
  await bbWriteProfileFields(user, { email: user.email });
}

function bbAccountForm(title, definitions, saveLabel, save) {
  return new Promise(resolve => {
    if (document.getElementById("bb-account-dialog")) { resolve(false); return; }
    const dialog = document.createElement("dialog");
    dialog.id = "bb-account-dialog";
    dialog.style.cssText = "margin:auto;width:min(440px,calc(100% - 32px));max-height:85dvh;overflow:auto;padding:24px;border:1px solid var(--border);border-radius:24px;background:var(--surface);color:var(--text);";
    const heading = document.createElement("h2");
    heading.id = "bb-account-heading";
    heading.textContent = title;
    heading.style.cssText = "margin:0 0 18px;font-size:22px;";
    dialog.setAttribute("aria-labelledby", heading.id);
    const form = document.createElement("form");
    form.style.cssText = "display:grid;gap:12px;";
    const inputs = {};
    for (const definition of definitions) {
      const label = document.createElement("label");
      label.className = "login-label";
      label.textContent = definition.label;
      const input = document.createElement("input");
      input.id = `bb-account-${definition.key}`;
      input.className = "login-input";
      input.type = definition.type || "text";
      input.required = true;
      input.autocomplete = definition.autocomplete || "off";
      input.value = definition.value || "";
      if (input.type === "text") input.maxLength = 100;
      if (input.type === "email") { input.autocapitalize = "none"; input.spellcheck = false; }
      label.htmlFor = input.id;
      inputs[definition.key] = input;
      form.append(label, input);
    }
    const message = document.createElement("p");
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    message.style.cssText = "margin:0;font-size:14px;line-height:1.4;";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn-primary";
    submit.textContent = saveLabel;
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "bb-outline-pill";
    cancel.textContent = "Cancel";
    let busy = false, succeeded = false;
    cancel.addEventListener("click", () => dialog.close());
    dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
    dialog.addEventListener("close", () => {
      Object.values(inputs).forEach(input => { if (input.type === "password") input.value = ""; });
      dialog.remove();
      resolve(succeeded);
    }, { once: true });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (busy || succeeded) return;
      busy = true;
      submit.disabled = cancel.disabled = true;
      submit.textContent = "Saving…";
      message.textContent = "";
      try {
        const values = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value]));
        message.textContent = await save(values, inputs);
        message.style.color = "var(--paid, #00b894)";
        succeeded = true;
        Object.values(inputs).forEach(input => {
          if (input.type === "password") input.value = "";
          input.disabled = true;
        });
        submit.hidden = true;
        cancel.textContent = "Done";
      } catch (error) {
        message.style.color = "var(--overdue, #f43f5e)";
        message.textContent = friendlyError(error);
      } finally {
        busy = false;
        submit.disabled = cancel.disabled = false;
        submit.textContent = saveLabel;
      }
    });
    form.append(message, submit, cancel);
    dialog.append(heading, form);
    document.body.appendChild(dialog);
    dialog.showModal();
  });
}

async function bbOpenAccountSettings(mode) {
  try {
    const user = bbAccountUser();
    const [, dbSDK] = await bbAccountSDK;
    if (mode === "name") {
      const snapshot = await dbSDK.getDoc(dbSDK.doc(firestore, "users", user.uid));
      bbCheckAccountUser(user);
      const profile = snapshot.exists() ? snapshot.data() : {};
      return bbAccountForm("Change Name", [
        { key: "firstName", label: "First Name", autocomplete: "given-name", value: profile.firstName },
        { key: "lastName", label: "Last Name", autocomplete: "family-name", value: profile.lastName }
      ], "Save Name", async values => {
        bbCheckAccountUser(user);
        await bbSaveAccountName(values.firstName, values.lastName, user);
        return "Your name has been updated.";
      });
    }
    if (mode === "email") {
      return bbAccountForm("Change Email", [
        { key: "currentPassword", label: "Current Password", type: "password", autocomplete: "current-password" },
        { key: "newEmail", label: "New Email", type: "email", autocomplete: "email" }
      ], "Send Verification Email", async values => {
        bbCheckAccountUser(user);
        await bbChangeAccountEmail(values.currentPassword, values.newEmail);
        return "Check your new email for the verification link. After verifying, sign out and sign in with the new email. Firestore will synchronize after sign-in.";
      });
    }
    if (mode === "password") {
      return bbAccountForm("Change Password", [
        { key: "currentPassword", label: "Current Password", type: "password", autocomplete: "current-password" },
        { key: "newPassword", label: "New Password", type: "password", autocomplete: "new-password" },
        { key: "confirmation", label: "Confirm New Password", type: "password", autocomplete: "new-password" }
      ], "Update Password", async values => {
        bbCheckAccountUser(user);
        await bbChangeAccountPassword(values.currentPassword, values.newPassword, values.confirmation);
        return "Password updated. Use your new password next time you sign in.";
      });
    }
  } catch (error) { window.alert(friendlyError(error)); }
}

window.bbOpenAccountSettings = bbOpenAccountSettings;
window.addEventListener("billbeacon:authenticated", event => {
  const user = event.detail?.user;
  if (!user) return;
  bbSyncAccountEmail(user).catch(() => {
    console.warn("Account email synchronization did not finish. Login remains managed by Firebase Authentication.");
  });
});