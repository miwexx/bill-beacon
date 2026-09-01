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

  window.dispatchEvent(
    new CustomEvent("billbeacon:authenticated", {
      detail: { user: auth.currentUser }
    })
  );

  if (typeof window.render === "function") {
    window.render();
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