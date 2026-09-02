import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtQjabLSI4qoHPqGn7BQYWwLhOtpa2BLI",
  authDomain: "bill-beacon-1646c.firebaseapp.com",
  projectId: "bill-beacon-1646c",
  storageBucket: "bill-beacon-1646c.firebasestorage.app",
  messagingSenderId: "573940060750",
  appId: "1:573940060750:web:17ae12740a4fead0aee91f",
  measurementId: "G-KTS8E5YZM1"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

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
  const loginScreen = getElement("login-screen");
  const app = getElement("app");

  loginScreen?.classList.remove("hidden");

  if (app) {
    app.style.display = "none";
  }
}
function showApp() {
  const loginScreen = getElement("login-screen");
  const app = getElement("app");

  loginScreen?.classList.add("hidden");

  if (app) {
    app.style.display = "";
  }

  console.log("Firebase user signed in:", auth.currentUser?.email);
  console.log("Bill Beacon renderer:", typeof window.render);

  if (typeof window.render !== "function") {
    console.error(
      "Bill Beacon could not start because js/app.js did not expose window.render."
    );

    if (app) {
      app.innerHTML = `
        <main style="
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #111827;
          color: #ffffff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          text-align: center;
        ">
          <section style="max-width: 420px;">
            <h1 style="margin: 0 0 12px;">Bill Beacon could not start</h1>
            <p style="margin: 0; color: #cbd5e1; line-height: 1.5;">
              Firebase login worked, but the main app script did not finish loading.
            </p>
            <p style="margin: 16px 0 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
              Check that <code>js/app.js</code> has no Firebase imports,
              no old login functions, and contains
              <code>window.render = render;</code>.
            </p>
          </section>
        </main>
      `;
    }

    return;
  }

  try {
    window.render();

    window.dispatchEvent(
      new CustomEvent("billbeacon:authenticated", {
        detail: { user: auth.currentUser }
      })
    );
  } catch (error) {
    console.error("Bill Beacon render failed:", error);

    if (app) {
      app.innerHTML = `
        <main style="
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #111827;
          color: #ffffff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          text-align: center;
        ">
          <section style="max-width: 420px;">
            <h1 style="margin: 0 0 12px;">Bill Beacon could not render</h1>
            <p style="margin: 0; color: #cbd5e1; line-height: 1.5;">
              Firebase login worked, but the dashboard encountered a JavaScript error.
            </p>
            <p style="margin: 16px 0 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
              Open the browser console and look for the error beginning
              with <code>Bill Beacon render failed:</code>.
            </p>
          </section>
        </main>
      `;
    }
  }
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
      "No account was found for that email. Choose Create Household Account.",
    "auth/wrong-password":
      "The email or password is not correct.",
    "auth/too-many-requests":
      "Too many attempts. Wait a moment, then try again.",
    "auth/unauthorized-domain":
      "This site domain is not authorized in Firebase Authentication."
  };

  return messages[code] || error?.message || "Something went wrong. Try again.";
}

async function createAccount() {
  const email = getElement("email-login")?.value.trim() || "";
  const password = getElement("password-login")?.value || "";

  if (!email || !password) {
    setMessage("Enter an email and password.", true);
    return;
  }

  if (password.length < 6) {
    setMessage("Use a password with at least 6 characters.", true);
    return;
  }

  setMessage("Creating household account…");

  await createUserWithEmailAndPassword(auth, email, password);
}

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

function setBusy(button, busy, busyText, normalText) {
  if (!button) return;

  button.disabled = busy;
  button.textContent = busy ? busyText : normalText;
}

function initFirebaseLogin() {
  const signInButton = getElement("email-signin-button");
  const createButton = getElement("email-create-button");

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

  createButton.addEventListener("click", async () => {
    try {
      setBusy(
        createButton,
        true,
        "Creating account…",
        "Create Household Account"
      );

      await createAccount();
    } catch (error) {
      console.error("Firebase account creation failed:", error);
      setMessage(friendlyError(error), true);
    } finally {
      setBusy(
        createButton,
        false,
        "Creating account…",
        "Create Household Account"
      );
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setMessage("");
      showApp();
    } else {
      showLogin();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFirebaseLogin, { once: true });
} else {
  initFirebaseLogin();
}

export { auth, signOut };