/* ============================================
   Bill Tracker PWA — App Logic
   ============================================ */

// ====================================
// CONSTANTS
// ====================================

/*function showApp() {
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
async function createHouseholdAccount() {
  const email = document.getElementById("email-login")?.value.trim();
  const password = document.getElementById("password-login")?.value || "";

  if (!email || !password) {
    setLoginError("Enter an email and password.");
    return;
  }

  setLoginError("");
  await createUserWithEmailAndPassword(auth, email, password);
}

async function signInToHousehold() {
  const email = document.getElementById("email-login")?.value.trim();
  const password = document.getElementById("password-login")?.value || "";

  if (!email || !password) {
    setLoginError("Enter an email and password.");
    return;
  }

  setLoginError("");
  await signInWithEmailAndPassword(auth, email, password);
}

async function signOutOfHousehold() {
  await signOut(auth);
}

function setupLoginScreen() {
  const signInButton = document.getElementById("email-signin-button");
  const createButton = document.getElementById("email-create-button");
  const signOutButton = document.getElementById("signout-button");

  console.log("Bill Beacon Firebase login initialized");

  console.log("Login controls found:", {
    signInButton: Boolean(signInButton),
    createButton: Boolean(createButton),
    signOutButton: Boolean(signOutButton),
    emailInput: Boolean(document.getElementById("email-login")),
    passwordInput: Boolean(document.getElementById("password-login"))
  });

  if (!signInButton || !createButton) {
    console.error("Bill Beacon login controls are missing.");
    setLoginError(
      "The login form could not initialize. Please refresh and try again."
    );
    return;
  }

  signInButton.addEventListener("click", async () => {
    try {
      setLoginError("Signing in…");

      signInButton.disabled = true;
      signInButton.textContent = "Signing in…";

      await signInToHousehold();
    } catch (error) {
      console.error("Firebase sign-in failed:", error);

      setLoginError(
        `${friendlyAuthError(error)} (${error.code || "unknown error"})`
      );
    } finally {
      signInButton.disabled = false;
      signInButton.textContent = "Sign In";
    }
  });

  createButton.addEventListener("click", async () => {
    try {
      setLoginError("Creating household account…");

      createButton.disabled = true;
      createButton.textContent = "Creating account…";

      await createHouseholdAccount();
    } catch (error) {
      console.error("Firebase account creation failed:", error);

      setLoginError(
        `${friendlyAuthError(error)} (${error.code || "unknown error"})`
      );
    } finally {
      createButton.disabled = false;
      createButton.textContent = "Create Household Account";
    }
  });

  signOutButton?.addEventListener("click", async () => {
    try {
      await signOutOfHousehold();
    } catch (error) {
      console.error("Firebase sign-out failed:", error);
      alert(`Could not sign out: ${error.message || "Unknown error"}`);
    }
  });

  onAuthStateChanged(auth, async (user) => {
    console.log(
      "Firebase auth state:",
      user ? `signed in as ${user.email}` : "signed out"
    );

    currentUser = user || null;

    if (!currentUser) {
      cloudLoaded = false;
      showLogin();
      return;
    }

    try {
      setLoginError("Loading household bills…");

      await loadCloudData();

      showApp();
      render();
    } catch (error) {
      console.error("Firebase cloud load failed:", error);

      cloudLoaded = false;

      setLoginError(
        `Signed in, but your household bills could not load: ${
          error.message || error.code || "Unknown error"
        }`
      );

      showLogin();
    }
  });
} 
function makeCloudDocument() {
  return {
    bills: Store.getBills(),
    payments: Store.getPayments(),
    activityLog: Store.getActivityLog(),
    incomeSources: Store.getIncomeSources(),
    settings: Store.getSettings(),
    updatedAt: new Date().toISOString()
  };
}

function applyCloudDocument(data) {
  if (!data || typeof data !== "object") return;

  localStorage.setItem("bills", JSON.stringify(data.bills || []));
  localStorage.setItem("payments", JSON.stringify(data.payments || []));
  localStorage.setItem("activityLog", JSON.stringify(data.activityLog || []));
  localStorage.setItem(
    "incomeSources",
    JSON.stringify(data.incomeSources || [])
  );
  localStorage.setItem("settings", JSON.stringify(data.settings || {}));
}

async function loadCloudData() {
  if (!currentUser) return;

  const householdRef = doc(db, "households", currentUser.uid);
  const householdSnapshot = await getDoc(householdRef);

  if (householdSnapshot.exists()) {
    applyCloudDocument(householdSnapshot.data());
  } else {
    await setDoc(householdRef, makeCloudDocument());
  }

  cloudLoaded = true;
}

async function saveCloudData() {
  if (!currentUser || !cloudLoaded) return;

  const householdRef = doc(db, "households", currentUser.uid);

  await setDoc(householdRef, makeCloudDocument());
}

function queueCloudSave() {
  if (!currentUser || !cloudLoaded) return;

  clearTimeout(cloudSaveTimer);

  cloudSaveTimer = setTimeout(() => {
    saveCloudData().catch((error) => {
      console.error("Firebase cloud save failed:", error);
    });
  }, 500);
}*/
const CATEGORIES = [
  { id: 'housing', label: 'Housing', icon: 'home', color: 'cat-housing' },
  { id: 'utilities', label: 'Utilities', icon: 'bolt', color: 'cat-utilities' },
  { id: 'internet', label: 'Internet & TV', icon: 'wifi', color: 'cat-internet' },
  { id: 'insurance', label: 'Insurance', icon: 'shield', color: 'cat-insurance' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'play', color: 'cat-subscriptions' },
  { id: 'phone', label: 'Phone', icon: 'phone', color: 'cat-phone' },
  { id: 'transportation', label: 'Transportation', icon: 'car', color: 'cat-transportation' },
  { id: 'loans', label: 'Loans', icon: 'percent', color: 'cat-loans' },
  { id: 'creditcards', label: 'Credit Cards', icon: 'creditcard', color: 'cat-creditcards' },
  { id: 'paymentplans', label: 'Payment Plans', icon: 'Subscription', color: 'cat-paymentplans' },
  { id: 'health', label: 'Health', icon: 'cross', color: 'cat-health' },
  { id: 'education', label: 'Education', icon: 'graduationcap', color: 'cat-education' },
  { id: 'other', label: 'Other', icon: 'doc', color: 'cat-other' },
];

const RECURRENCE = ['None', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];

const REMINDER_OFFSETS = [
  { days: 1, label: '1 day before' },
  { days: 3, label: '3 days before' },
  { days: 7, label: '7 days before' },
  { days: 14, label: '14 days before' },
];

const PAYMENT_METHODS = ['', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Apple Pay', 'Check'];

const INCOME_FREQUENCIES = [
  'Weekly',
  'Biweekly',
  'Twice monthly',
  'Monthly',
  'Manual / irregular',
];
const BILL_BRANDS = [
  // Phone, internet, and utilities
  { terms: ['at&t', 'att', 'at&t wireless'], label: 'AT&T', domain: 'att.com' },
  { terms: ['verizon'], label: 'Verizon', domain: 'verizon.com' },
  { terms: ['t-mobile', 'tmobile'], label: 'T-Mobile', domain: 't-mobile.com' },
  { terms: ['mint mobile'], label: 'Mint Mobile', domain: 'mintmobile.com' },
  { terms: ['xfinity', 'xfinity internet', 'comcast'], label: 'Xfinity', domain: 'xfinity.com' },
  { terms: ['spectrum'], label: 'Spectrum', domain: 'spectrum.com' },
  { terms: ['cox communications'], label: 'Cox', domain: 'cox.com' },

  // Streaming and subscriptions
  { terms: ['netflix'], label: 'Netflix', domain: 'netflix.com' },
  { terms: ['spotify'], label: 'Spotify', domain: 'spotify.com' },
  { terms: ['hulu'], label: 'Hulu', domain: 'hulu.com' },
  { terms: ['disney+', 'disney plus'], label: 'Disney+', domain: 'disneyplus.com' },
  { terms: ['hbo max', 'max streaming'], label: 'Max', domain: 'max.com' },
  { terms: ['youtube tv', 'youtube premium'], label: 'YouTube', domain: 'youtube.com' },
  { terms: ['amazon prime', 'prime video'], label: 'Prime Video', domain: 'primevideo.com' },
  { terms: ['ring camera', 'ring protect'], label: 'Ring', domain: 'ring.com' },

  // Insurance
  { terms: ['geico'], label: 'GEICO', domain: 'geico.com' },
  { terms: ['progressive'], label: 'Progressive', domain: 'progressive.com' },
  { terms: ['state farm'], label: 'State Farm', domain: 'statefarm.com' },
  { terms: ['usaa'], label: 'USAA', domain: 'usaa.com' },
  { terms: ['allstate'], label: 'Allstate', domain: 'allstate.com' },

  // Banking, cards, loans, and auto
  { terms: ['navy federal', 'nfcu'], label: 'Navy Federal', domain: 'navyfederal.org' },
  { terms: ['credit one', 'creditone'], label: 'Credit One Bank', domain: 'creditonebank.com' },
  { terms: ['fortiva', 'fortiva credit card'], label: 'Fortiva', domain: 'myfortiva.com' },
  { terms: ['capital one'], label: 'Capital One', domain: 'capitalone.com' },
  { terms: ['chase'], label: 'Chase', domain: 'chase.com' },
  { terms: ['american express', 'amex'], label: 'American Express', domain: 'americanexpress.com' },
  { terms: ['discover'], label: 'Discover', domain: 'discover.com' },
  { terms: ['ally auto', 'ally financial'], label: 'Ally', domain: 'ally.com' },
  { terms: ['avant loan', 'avant'], label: 'Avant', domain: 'avant.com' },

  // Buy now, pay later
  { terms: ['zip pay in 4', 'zip pay'], label: 'Zip', domain: 'zip.co' },
  { terms: ['klarna', 'kl;;arna'], label: 'Klarna', domain: 'klarna.com' },
  { terms: ['affirm'], label: 'Affirm', domain: 'affirm.com' },

  // Government
  { terms: ['irs', 'internal revenue service'], label: 'IRS', domain: 'irs.gov' },
];

const ICONS = {
  home: '<path d="M3 12l9-9 9 9v9a2 2 0 01-2 2h-4v-7H10v7H6a2 2 0 01-2-2v-9z" fill="currentColor"/>',
  bolt: '<path d="M13 2L3 14h7v8l10-12h-7V2z" fill="currentColor"/>',
  wifi: '<path d="M12 18a2 2 0 100 4 2 2 0 000-4zM5.64 12.46a9.5 9.5 0 0112.72 0l-1.42 1.42a7.5 7.5 0 00-9.88 0l-1.42-1.42zM8.46 15.29a5 5 0 017.08 0l-1.42 1.42a3 3 0 00-4.24 0l-1.42-1.42z" fill="currentColor"/>',
  shield: '<path d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" fill="currentColor"/>',
  play: '<rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/><path d="M10 8l6 4-6 4V8z" fill="white"/>',
  phone: '<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>',
  car: '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/>',
  percent: '<path d="M7.5 11C9.43 11 11 9.43 11 7.5S9.43 4 7.5 4 4 5.57 4 7.5 5.57 11 7.5 11zm9 8c1.93 0 3.5-1.57 3.5-3.5S18.43 12 16.5 12 13 13.57 13 15.5s1.57 3.5 3.5 3.5zm-12 2L18 8l-1.5-1.5L3 19.5 4.5 21z" fill="currentColor"/>',
  creditcard: '<path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="currentColor"/>',
  cross: '<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.4-1.4L10 14.2l6.6-6.6L18 9l-8 8z" fill="currentColor"/>',
  graduationcap: '<path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" fill="currentColor"/>',
  doc: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>',
  plus: '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>',
  check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>',
  checkCircle: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>',
  warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>',
  calendar: '<path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/>',
  chart: '<path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" fill="currentColor"/>',
  gear: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.17l-2.39 1.2c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-1.2c-.22-.11-.47-.04-.59.17L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94 0 .31.04.64.09.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.17l2.39-1.2c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39 1.2c.22.11.47.04.59-.17l1.92-3.32c.12-.21.06-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>',
  chevronLeft: '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>',
  chevronRight: '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>',
  close: '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>',
  trash: '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>',
  moreVertical: ` <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>`,
  export: '<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>',
  bell: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>',
  lock: '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-9H9V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2z" fill="currentColor"/>',
  clock: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.3 2.5-.8 1.5z" fill="currentColor"/>',
  internaldrive: '<path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" fill="currentColor"/>',
  tray: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v8.59l-2.3-2.3-3.59 3.59-4-4L5 14.59V5h14zM7 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" fill="currentColor"/>',
  pieChart: '<path d="M11 2v20c5.52 0 10-4.48 10-10S16.52 2 11 2zm-1 7L4.6 7.3C3.6 8.8 3 10.6 3 12.5 3 17.2 6.8 21 11.5 21c1.9 0 3.7-.6 5.2-1.6L10 9z" fill="currentColor"/>',
  trendUp: '<path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="currentColor"/>',
  sort: '<path d="M7 3h10v2H7V3zm-3 6h16v2H4V9zm3 6h10v2H7v-2zm3 6h4v2h-4v-2z" fill="currentColor"/>',
};

// ====================================
// DATA LAYER (localStorage)
// ====================================

const Store = {
  getBills() {
    try { return JSON.parse(localStorage.getItem('bills') || '[]'); }
    catch { return []; }
  },
  saveBills(bills) {
  localStorage.setItem("bills", JSON.stringify(bills));
  },
  getBill(id) {
    return this.getBills().find(b => b.id === id);
  },
  addBill(bill) {
    const bills = this.getBills();
    bills.push(bill);
    this.saveBills(bills);
  },
  updateBill(id, updates) {
  const bills = this.getBills();
  const idx = bills.findIndex((b) => b.id === id);

  if (idx < 0) return null;

  const previousBill = { ...bills[idx] };

  bills[idx] = {
    ...bills[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  this.saveBills(bills);

  const updatedBill = bills[idx];

  const trackedFields = [
    "name",
    "amount",
    "dueDate",
    "dueDay",
    "category",
    "paymentMethod",
    "paymentUrl",
    "autopay",
    "notes",
    "recurrence",
    "payCycle",
  ];

  const fieldLabels = {
    name: "Name",
    amount: "Amount",
    dueDate: "Due date",
    dueDay: "Due day",
    category: "Category",
    paymentMethod: "Payment method",
    paymentUrl: "Payment link",
    autopay: "Autopay",
    notes: "Notes",
    recurrence: "Repeats",
    payCycle: "Pay cycle",
  };

  const formatActivityValue = (field, value) => {
    if (value === null || value === undefined || value === "") return "None";

    switch (field) {
      case "amount":
        return formatCurrency(value);
      case "dueDate":
        return formatDate(value, "short");
      case "dueDay":
        return `Day ${value}`;
      case "autopay":
        return value ? "On" : "Off";
      case "category":
        return getCategory(value)?.label || String(value);
      case "payCycle":
        return value === "first"
          ? "Early Cycle"
          : value === "second"
            ? "Late Cycle"
            : String(value);
      default:
        return String(value);
    }
  };

  const changes = trackedFields
    .filter((field) => {
      const before = previousBill[field] ?? null;
      const after = updatedBill[field] ?? null;

      if (field === "amount") {
        return (parseFloat(before) || 0) !== (parseFloat(after) || 0);
      }

      if (field === "dueDay") {
        return Number(before) !== Number(after);
      }

      return before !== after;
    })
    .map((field) => ({
      field,
      before: previousBill[field] ?? null,
      after: updatedBill[field] ?? null,
      label: fieldLabels[field] || field,
    }));

  if (changes.length) {
    const primaryChange =
      changes.find((change) => change.field === "amount") ||
      changes.find((change) => change.field === "dueDay") ||
      changes.find((change) => change.field === "dueDate") ||
      changes[0];

    const detail =
      `${primaryChange.label}: ` +
      `${formatActivityValue(primaryChange.field, primaryChange.before)} → ` +
      `${formatActivityValue(primaryChange.field, primaryChange.after)}`;

    this.addActivity({
      action: primaryChange.field === "amount" ? "billbalancechanged" : "billupdated",
      entityType: updatedBill.installmentPlanId ? "paymentplan" : "bill",
      entityId: updatedBill.installmentPlanId || updatedBill.id,
      title:
        primaryChange.field === "amount"
          ? `${updatedBill.name} balance changed`
          : `${updatedBill.name} updated`,
      detail,
      before: { [primaryChange.field]: primaryChange.before },
      after: { [primaryChange.field]: primaryChange.after },
    });
  }

  return updatedBill;
},
  deleteBill(id) {
    const bills = this.getBills().filter(b => b.id !== id);
    this.saveBills(bills);
    // Also delete related payments
    const payments = this.getPayments().filter(p => p.billId !== id);
    localStorage.setItem('payments', JSON.stringify(payments));
  },
  getPayments() {
    try { return JSON.parse(localStorage.getItem('payments') || '[]'); }
    catch { return []; }
  },
  savePayments(payments) {
    localStorage.setItem('payments', JSON.stringify(payments));
     },
  getActivityLog() {
  try {
    return JSON.parse(localStorage.getItem("activityLog")) || [];
  } catch {
    return [];
  }
},

saveActivityLog(entries) {
  localStorage.setItem("activityLog", JSON.stringify(entries));
 },

addActivity(entry) {
  const entries = this.getActivityLog();

  entries.push({
    id: uid(),
    timestamp: new Date().toISOString(),
    ...entry,
  });

  this.saveActivityLog(entries);
},
  getIncomeSources() {
  try {
    return JSON.parse(localStorage.getItem('incomeSources')) || [];
  } catch {
    return [];
  }
},

saveIncomeSources(sources) {
  localStorage.setItem('incomeSources', JSON.stringify(sources));
 },

addIncomeSource(source) {
  const sources = this.getIncomeSources();
  sources.push(source);
  this.saveIncomeSources(sources);
},

updateIncomeSource(id, updates) {
  const sources = this.getIncomeSources();
  const index = sources.findIndex(source => source.id === id);

  if (index < 0) return;

  sources[index] = {
    ...sources[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  this.saveIncomeSources(sources);
},

deleteIncomeSource(id) {
  const sources = this.getIncomeSources()
    .filter(source => source.id !== id);

  this.saveIncomeSources(sources);
},
  
  addPayment(payment) {
  const payments = this.getPayments();
  payments.push(payment);
  this.savePayments(payments);
},

updatePayment(paymentId, updates) {
  const payments = this.getPayments();

  const index = payments.findIndex(
    (payment) => payment.id === paymentId
  );

  if (index === -1) return null;

  const previousPayment = { ...payments[index] };

  payments[index] = {
    ...payments[index],
    ...updates,
  };

  this.savePayments(payments);

  const updatedPayment = payments[index];

  const isNewlyVoided =
    previousPayment.status !== "voided" &&
    updatedPayment.status === "voided";

  if (isNewlyVoided) {
    const bill = this.getBill(updatedPayment.billId);

    const dueDate =
      updatedPayment.paidForDueDate ||
      bill?.dueDate ||
      new Date().toISOString();

    this.addActivity({
      action: "payment_voided",
      entityType: bill?.installmentPlanId ? "payment_plan" : "bill",
      entityId: bill?.installmentPlanId || updatedPayment.billId,
      title: `${bill?.name || "Bill"} payment reversed`,
      detail: `${formatCurrency(
        updatedPayment.amount
      )} · Due ${formatDate(dueDate, "short")}`,
      before: {
        paymentId: previousPayment.id,
        status: previousPayment.status,
        amount: parseFloat(previousPayment.amount) || 0,
        paidDate: previousPayment.paidDate,
        dueDate,
      },
      after: {
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
        voidedAt: updatedPayment.voidedAt || new Date().toISOString(),
      },
    });
  }

  return updatedPayment;
},
  getPaymentsForBill(billId) {
    return this.getPayments().filter(p => p.billId === billId).sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
  },
  getSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('settings') || '{}');
      return {
  currency: 'USD',
  biometricLock: false,
  theme: 'dark',
  currentPayCycle: 'auto',
  ...s
};
    } catch {
      return { currency: 'USD', biometricLock: false, theme: 'dark' };
    }
  },
  saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
     },
};

// ====================================
// UTILITIES
// ====================================

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
function getBillBrand(billName) {
  const normalizedName = String(billName || '').toLowerCase();

  return BILL_BRANDS.find(brand =>
    brand.terms.some(term => normalizedName.includes(term))
  ) || null;
}

function billLogoUrl(brand) {
  return `https://img.logo.dev/${brand.domain}?token=pk_Oi2mTbJ_SOOVDVoEsRz5kg&size=256&format=png`;
}
function getBrandInitials(brand) {
  return brand.label
    .replace(/[^a-z0-9 ]/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

function billVisual(bill, size = 32) {
  const brand = getBillBrand(bill.name);
  const category = getCategory(bill.category);

  if (brand) {
    return `
      <img
        src="${billLogoUrl(brand)}"
        alt="${escapeHtml(brand.label)} logo"
        title="${escapeHtml(brand.label)}"
        width="${size}"
        height="${size}"
        style="
          display:block;
          width:${size}px;
          height:${size}px;
          object-fit:contain;
transform:scale(1.30);
padding:0;
border-radius:0;
        "
        onerror="
          this.onerror=null;
          this.replaceWith(
            Object.assign(document.createElement('span'), {
              textContent: '${getBrandInitials(brand)}',
              style: 'display:inline-flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;border-radius:5px;background:rgba(255,255,255,0.92);color:#1e1e2e;font-size:${Math.max(8, Math.round(size * 0.42))}px;font-weight:900;line-height:1;'
            })
          );
        "
      >
    `;
  }

  return svgIcon(category.icon, size);
}

function getCategory(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'other');
}
function getPayCycleLabel(bill) {
  if (bill.payCycle === 'first') return 'Early Cycle';
  if (bill.payCycle === 'second') return 'Late Cycle';

  const dueDay = new Date(bill.dueDate).getDate();
  return dueDay <= 15 ? 'Early Cycle' : 'Late Cycle';
}

function getCurrentPayCycle() {
  const settings = Store.getSettings();

  if (
    settings.currentPayCycle === 'first' ||
    settings.currentPayCycle === 'second'
  ) {
    return settings.currentPayCycle;
  }

  return new Date().getDate() <= 15 ? 'first' : 'second';
}

function setCurrentPayCycle(cycle) {
  const settings = Store.getSettings();

  Store.saveSettings({
    ...settings,
    currentPayCycle: cycle
  });

  render();
}
function getMonthlyIncomeEstimate(source) {
  const amount = Number(source.expectedAmount) || 0;

  switch (source.frequency) {
    case 'Weekly':
      return amount * 52 / 12;

    case 'Biweekly':
      return amount * 26 / 12;

    case 'Twice monthly':
      return amount * 2;

    case 'Monthly':
      return amount;

    case 'Manual / irregular':
    default:
      return 0;
  }
}

function getTotalMonthlyIncomeEstimate() {
  return Store.getIncomeSources().reduce(
    (total, source) => total + getMonthlyIncomeEstimate(source),
    0
  );
}
function getIncomeForPayCycle(source, cycle) {
  const amount = Number(source.expectedAmount) || 0;

  switch (source.frequency) {
    case 'Weekly':
      return amount * (52 / 24);

    case 'Biweekly':
      return amount * (26 / 24);

    case 'Twice monthly':
      return amount;

    case 'Monthly':
      return cycle === 'first' ? amount : 0;

    case 'Manual / irregular':
    default:
      return 0;
  }
}

function getTotalIncomeForPayCycle(cycle) {
  return Store.getIncomeSources().reduce(
    (total, source) => total + getIncomeForPayCycle(source, cycle),
    0
  );
}
function recordActivity({
  action,
  entityType,
  entityId,
  title,
  detail = "",
  before = null,
  after = null,
}) {
  Store.addActivity({
    action,
    entityType,
    entityId,
    title,
    detail,
    before,
    after,
  });
}
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString(undefined, { style: 'currency', currency: Store.getSettings().currency || 'USD' });
}

function formatDate(dateStr, format = 'short') {
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (format === 'short') return `${months[d.getMonth()]} ${d.getDate()}`;
  if (format === 'full') return `${fullMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  if (format === 'monthYear') return `${fullMonths[d.getMonth()]} ${d.getFullYear()}`;
  if (format === 'monthShort') return months[d.getMonth()];
  return d.toLocaleDateString();
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function relativeDue(dateStr) {
  const diff = daysUntil(dateStr);
  if (diff < 0) return Math.abs(diff) === 1 ? '1 day overdue' : `${Math.abs(diff)} days overdue`;
  if (diff === 0) return 'due today';
  if (diff === 1) return 'in 1 day';
  return `in ${diff} days`;
}

function isSameMonth(dateStr, refDate = new Date()) {
  const d = new Date(dateStr);
  return d.getMonth() === refDate.getMonth() && d.getFullYear() === refDate.getFullYear();
}

function nextDate(afterDateStr, recurrence) {
  if (recurrence === 'None') return null;
  const d = new Date(afterDateStr);
  switch (recurrence) {
    case 'Weekly': d.setDate(d.getDate() + 7); break;
    case 'Monthly': d.setMonth(d.getMonth() + 1); break;
    case 'Quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'Yearly': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString();
}
function dateInputValue(date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}


function dateFromInput(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
}
function getMonthlyDueDay(bill) {
  const storedDay = Number(bill?.dueDay);

  if (Number.isInteger(storedDay) && storedDay >= 1 && storedDay <= 31) {
    return storedDay;
  }

  return new Date(bill.dueDate).getDate();
}

function getMonthlyOccurrenceDate(bill, year, month) {
  const dueDay = getMonthlyDueDay(bill);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(dueDay, lastDay);

  return new Date(year, month, actualDay, 12).toISOString();
}

function getBillOccurrenceDate(bill, year, month) {
  if (!bill) return null;

  if (bill.recurrence === 'Monthly') {
    return getMonthlyOccurrenceDate(bill, year, month);
  }

  return bill.dueDate;
}

function getOccurrenceKey(templateId, dueDate) {
  const date = new Date(dueDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${templateId}:${year}-${month}-${day}`;
}

function isRecurringBill(bill) {
  return Boolean(bill && bill.recurrence && bill.recurrence !== 'None');
}

function getRecurringTemplateId(bill) {
  if (!bill) return null;
  return bill.recurringTemplateId || bill.id;
}

function getOccurrenceDueDate(bill, year, month) {
  if (!bill) return null;

  if (bill.recurrence === 'Monthly') {
    return getMonthlyOccurrenceDate(bill, year, month);
  }

  return getBillOccurrenceDate(bill, year, month);
}

function createBillOccurrence(bill, dueDate) {
  if (!bill || !dueDate) return null;

  const normalizedDueDate = new Date(
    new Date(dueDate).getFullYear(),
    new Date(dueDate).getMonth(),
    new Date(dueDate).getDate(),
    12,
    0,
    0
  ).toISOString();

  const templateId = getRecurringTemplateId(bill);

  const occurrenceOverrides = Array.isArray(bill.occurrenceOverrides)
    ? bill.occurrenceOverrides
    : [];

  const override = occurrenceOverrides.find(
    (item) => item.originalDueDate === normalizedDueDate
  );

  if (override?.cancelled) {
    return null;
  }

  const effectiveDueDate =
    override?.postponedTo || normalizedDueDate;

  const occurrenceKey = getOccurrenceKey(
    templateId,
    normalizedDueDate
  );

  return {
    ...bill,
    id: occurrenceKey,
    occurrenceKey,
    templateId,
    sourceBillId: bill.id,
    name: bill.name,
    amount: bill.amount,
    category: bill.category,
    dueDate: effectiveDueDate,
    originalDueDate: normalizedDueDate,
    recurrence: bill.recurrence,
    paymentMethod: bill.paymentMethod || "",
    paymentUrl: bill.paymentUrl || "",
    autopay: Boolean(bill.autopay),
    notes: bill.notes || "",
    reminderOffsets: Array.isArray(bill.reminderOffsets)
      ? [...bill.reminderOffsets]
      : [],
    isOccurrence: true,
  };
}
function getMonthBounds(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  return {
    start: new Date(year, month, 1, 12, 0, 0),
    end: new Date(year, month + 1, 0, 12, 0, 0)
  };
}

function getMonthOccurrenceDates(bill, referenceDate = new Date()) {
  if (!bill || !isRecurringBill(bill)) return [];

  const { start, end } = getMonthBounds(referenceDate);
  const originalDueDate = new Date(bill.dueDate);

  if (Number.isNaN(originalDueDate.getTime())) return [];

  const occurrenceDates = [];

  if (bill.recurrence === 'Weekly') {
    const candidate = new Date(
      originalDueDate.getFullYear(),
      originalDueDate.getMonth(),
      originalDueDate.getDate(),
      12,
      0,
      0
    );

    while (candidate < start) {
      candidate.setDate(candidate.getDate() + 7);
    }

    while (candidate <= end) {
      occurrenceDates.push(new Date(candidate));
      candidate.setDate(candidate.getDate() + 7);
    }
  }

  if (bill.recurrence === 'Monthly') {
    occurrenceDates.push(
      new Date(
        getMonthlyOccurrenceDate(
          bill,
          start.getFullYear(),
          start.getMonth()
        )
      )
    );
  }

  if (bill.recurrence === 'Quarterly') {
    const startYear = originalDueDate.getFullYear();
    const startMonth = originalDueDate.getMonth();
    const targetYear = start.getFullYear();
    const targetMonth = start.getMonth();

    const monthsSinceStart =
      (targetYear - startYear) * 12 + (targetMonth - startMonth);

    if (monthsSinceStart >= 0 && monthsSinceStart % 3 === 0) {
      const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      const dueDay = Math.min(originalDueDate.getDate(), lastDay);

      occurrenceDates.push(
        new Date(targetYear, targetMonth, dueDay, 12, 0, 0)
      );
    }
  }

  if (bill.recurrence === 'Yearly') {
    const targetYear = start.getFullYear();
    const dueMonth = originalDueDate.getMonth();

    if (
      targetYear >= originalDueDate.getFullYear() &&
      start.getMonth() === dueMonth
    ) {
      const lastDay = new Date(targetYear, dueMonth + 1, 0).getDate();
      const dueDay = Math.min(originalDueDate.getDate(), lastDay);

      occurrenceDates.push(
        new Date(targetYear, dueMonth, dueDay, 12, 0, 0)
      );
    }
  }

  return occurrenceDates
    .filter(date => date >= start && date <= end)
    .map(date => date.toISOString());
}

function getRecurringOccurrencesForMonth(referenceDate = new Date()) {
  const seen = new Set();

  return Store.getBills()
    .filter(isRecurringBill)
    .flatMap(bill =>
      getMonthOccurrenceDates(bill, referenceDate)
        .map(dueDate => createBillOccurrence(bill, dueDate))
        .filter(Boolean)
    )
    .filter(occurrence => {
      if (seen.has(occurrence.occurrenceKey)) return false;
      seen.add(occurrence.occurrenceKey);
      return true;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function getRecurringOccurrencesForNextMonths(
  startDate = new Date(),
  monthCount = 3
) {
  const occurrences = [];
  const seen = new Set();

  for (let offset = 0; offset < monthCount; offset += 1) {
    const monthDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + offset,
      1,
      12,
      0,
      0
    );

    getRecurringOccurrencesForMonth(monthDate).forEach(occurrence => {
      if (seen.has(occurrence.occurrenceKey)) return;
      seen.add(occurrence.occurrenceKey);
      occurrences.push(occurrence);
    });
  }

  return occurrences.sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );
}

function getCalendarBillsForMonth(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const seen = new Set();

  const oneTimeBills = Store.getBills().filter(bill => {
    if (isRecurringBill(bill)) return false;

    const dueDate = new Date(bill.dueDate);

    return (
      !Number.isNaN(dueDate.getTime()) &&
      dueDate.getFullYear() === year &&
      dueDate.getMonth() === month
    );
  });

  return [...oneTimeBills, ...getRecurringOccurrencesForMonth(referenceDate)]
    .filter(bill => {
      const key = bill.occurrenceKey || bill.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function getCalendarBillsForDay(dateString) { 
  const selectedDate = new Date(dateString);

  if (Number.isNaN(selectedDate.getTime())) return [];

  const selectedKey = [
    selectedDate.getFullYear(),
    String(selectedDate.getMonth() + 1).padStart(2, '0'),
    String(selectedDate.getDate()).padStart(2, '0')
  ].join('-');

  return getCalendarBillsForMonth(selectedDate).filter(bill => {
    const dueDate = new Date(bill.dueDate);

    if (Number.isNaN(dueDate.getTime())) return false;

    const dueKey = [
      dueDate.getFullYear(),
      String(dueDate.getMonth() + 1).padStart(2, '0'),
      String(dueDate.getDate()).padStart(2, '0')
    ].join('-');

    return dueKey === selectedKey;
  });
}
function isCalendarBillPaid(bill) {
  return isOccurrencePaid(bill, new Date(bill.dueDate));
}

function getCalendarBillStatus(bill) {
  return getOccurrenceStatus(bill, new Date(bill.dueDate));
}
function postponeBill(billId, newDueDate) {
  const bill = Store.getBill(billId);

  if (!bill || !newDueDate) return;

  const previousDueDate = bill.dueDate;
  const postponedDueDate = dateFromInput(newDueDate);

  if (Number.isNaN(new Date(postponedDueDate).getTime())) {
    alert("Please choose a valid new due date.");
    return;
  }

  if (new Date(postponedDueDate) <= new Date(previousDueDate)) {
    alert("Choose a date after the current due date.");
    return;
  }

  const postponedAt = new Date().toISOString();

  const postponementHistory = Array.isArray(bill.postponementHistory)
    ? bill.postponementHistory
    : [];

  Store.updateBill(billId, {
    dueDate: postponedDueDate,
    postponementHistory: [
      ...postponementHistory,
      {
        id: uid(),
        originalDueDate: previousDueDate,
        postponedTo: postponedDueDate,
        postponedAt,
      },
    ],
  });

  recordActivity({
    action: "bill_postponed",
    entityType: bill.installmentPlanId ? "payment_plan" : "bill",
    entityId: bill.installmentPlanId || bill.id,
    title: `${bill.name} postponed`,
    detail: `${formatDate(previousDueDate, "short")} → ${formatDate(
      postponedDueDate,
      "short"
    )}`,
    before: {
      dueDate: previousDueDate,
    },
    after: {
      dueDate: postponedDueDate,
      postponedAt,
    },
  });
}
function openPostponeBillSheet(billId) {
  const bill = Store.getBill(billId);
  if (!bill) return;

  const originalDue = new Date(bill.dueDate);
  const minimumDate = new Date(originalDue);
  minimumDate.setDate(minimumDate.getDate() + 1);

  const container = document.createElement('div');
  container.id = 'postponeBillContainer';

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="postponeBillOverlay"
      onclick="closePostponeBillSheet()"
    ></div>

    <div class="sheet" id="postponeBillSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closePostponeBillSheet()">
          Cancel
        </button>

        <div class="sheet-title">Postpone Bill</div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body content-gap">
        <div class="card card-pad">
          <div style="font-weight:800;font-size:var(--text-lg)">
            ${escapeHtml(bill.name)}
          </div>

          <div style="font-size:var(--text-sm);color:var(--text-muted);margin-top:4px">
            Currently due ${formatDate(bill.dueDate, 'full')}
          </div>
        </div>

        <div>
  <div class="section-header">New due date</div>

  <div class="card">
    <div style="padding:var(--space-4)">
      <div
        style="
          display:flex;
          align-items:center;
          gap:var(--space-2);
          margin-bottom:var(--space-3);
          color:var(--accent);
          font-weight:800
        "
      >
        ${svgIcon('calendar', 20)}
        Choose a new date
      </div>

      <input
        class="form-input"
        id="postponeBillDate"
        type="date"
        min="${dateInputValue(minimumDate)}"
        value="${dateInputValue(minimumDate)}"
        style="
          width:100%;
          height:54px;
          font-size:var(--text-base);
          font-weight:700;
          text-align:left;
        "
      >
    </div>
  </div>
</div>

        <div class="settings-footer">
          This keeps the bill unpaid and moves its current due date.
        </div>

        <button
          class="btn-primary"
          style="width:100%"
          onclick="confirmPostponeBill('${bill.id}')"
        >
          ${svgIcon('calendar', 20)}
          Confirm Postpone
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document.getElementById('postponeBillOverlay')?.classList.add('show');
    document.getElementById('postponeBillSheet')?.classList.add('show');
  });
}

function closePostponeBillSheet() {
  document.getElementById('postponeBillOverlay')?.classList.remove('show');
  document.getElementById('postponeBillSheet')?.classList.remove('show');

  setTimeout(() => {
    document.getElementById('postponeBillContainer')?.remove();
    unlockBackgroundScroll();
  }, 300);
}

function confirmPostponeBill(billId) {
  const input = document.getElementById('postponeBillDate');

  if (!input?.value) {
    alert('Choose a new due date.');
    return;
  }

  postponeBill(billId, input.value);
  closePostponeBillSheet();
  render();
}
function openPostponeRecurringOccurrenceSheet(
  billId,
  originalDueDate
) {
  const bill = Store.getBill(billId);

  if (!bill) return;

  const originalDue = new Date(originalDueDate);

  const minimumDate = new Date(originalDue);
  minimumDate.setDate(minimumDate.getDate() + 1);

  const container = document.createElement("div");
  container.id = "postponeRecurringOccurrenceContainer";

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="postponeRecurringOccurrenceOverlay"
      onclick="closePostponeRecurringOccurrenceSheet()"
    ></div>

    <div
      class="sheet"
      id="postponeRecurringOccurrenceSheet"
    >
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button
          class="nav-button"
          onclick="closePostponeRecurringOccurrenceSheet()"
        >
          Cancel
        </button>

        <div class="sheet-title">Postpone This Occurrence</div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body content-gap">
        <div class="card card-pad">
          <div style="font-size:var(--text-lg);font-weight:800">
            ${escapeHtml(bill.name)}
          </div>

          <div
            style="
              font-size:var(--text-sm);
              color:var(--text-muted);
              margin-top:4px;
            "
          >
            Scheduled for ${formatDate(originalDueDate, "full")}
          </div>
        </div>

        <div class="section-header">New due date</div>

        <div class="card">
          <div style="padding:var(--space-4)">
            <input
              id="postponeRecurringOccurrenceDate"
              class="form-input"
              type="date"
              min="${dateInputValue(minimumDate)}"
              value="${dateInputValue(minimumDate)}"
              style="
                width:100%;
                height:54px;
                font-size:var(--text-base);
                font-weight:700;
                text-align:left;
              "
            />
          </div>
        </div>

        <div class="settings-footer">
          Only this scheduled occurrence will move. Future recurring dates will not change.
        </div>

        <button
          class="btn-primary"
          style="width:100%"
          onclick="confirmPostponeRecurringOccurrence(
            '${bill.id}',
            '${originalDueDate}'
          )"
        >
          ${svgIcon("calendar", 20)}
          Postpone This Occurrence
        </button>
      </div>
    </div>
  `;

  document
    .getElementById("postponeRecurringOccurrenceContainer")
    ?.remove();

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document
      .getElementById("postponeRecurringOccurrenceOverlay")
      ?.classList.add("show");

    document
      .getElementById("postponeRecurringOccurrenceSheet")
      ?.classList.add("show");
  });
}

function closePostponeRecurringOccurrenceSheet() {
  document
    .getElementById("postponeRecurringOccurrenceOverlay")
    ?.classList.remove("show");

  document
    .getElementById("postponeRecurringOccurrenceSheet")
    ?.classList.remove("show");

  setTimeout(() => {
    document
      .getElementById("postponeRecurringOccurrenceContainer")
      ?.remove();

    unlockBackgroundScroll();
  }, 300);
}

function confirmPostponeRecurringOccurrence(
  billId,
  originalDueDate
) {
  const input = document.getElementById(
    "postponeRecurringOccurrenceDate"
  );

  if (!input?.value) {
    alert("Choose a new due date.");
    return;
  }

  const bill = Store.getBill(billId);

  if (!bill) {
    alert("Bill not found.");
    return;
  }

  const postponedTo = dateFromInput(input.value);

  if (new Date(postponedTo) <= new Date(originalDueDate)) {
    alert("Choose a date after the current occurrence date.");
    return;
  }

  const occurrenceOverrides = Array.isArray(bill.occurrenceOverrides)
    ? bill.occurrenceOverrides.filter(
        (item) => item.originalDueDate !== originalDueDate
      )
    : [];

  const postponedAt = new Date().toISOString();

  Store.updateBill(billId, {
    occurrenceOverrides: [
      ...occurrenceOverrides,
      {
        id: uid(),
        originalDueDate,
        postponedTo,
        postponedAt,
      },
    ],
  });

  recordActivity({
    action: "recurring_occurrence_postponed",
    entityType: "bill",
    entityId: billId,
    title: `${bill.name} occurrence postponed`,
    detail: `${formatDate(
      originalDueDate,
      "short"
    )} → ${formatDate(postponedTo, "short")}`,
    before: {
      dueDate: originalDueDate,
    },
    after: {
      dueDate: postponedTo,
      postponedAt,
    },
  });

  closePostponeRecurringOccurrenceSheet();
  navigate("recurring");
}
function getLocalDateKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getBillPaymentId(bill) {
  if (!bill) return null;
  return bill.isOccurrence ? bill.sourceBillId : bill.id;
}

function getBillOccurrenceDueDate(bill, referenceDate = new Date()) {
  if (!bill) return null;

  if (bill.isOccurrence) {
    return bill.dueDate;
  }

  if (isRecurringBill(bill)) {
    return getOccurrenceDueDate(
      bill,
      referenceDate.getFullYear(),
      referenceDate.getMonth()
    );
  }

  return bill.dueDate;
}

function getActivePaymentForOccurrence(bill, referenceDate = new Date()) {
  const billId = getBillPaymentId(bill);
  const occurrenceDueDate = getBillOccurrenceDueDate(bill, referenceDate);

  if (!billId || !occurrenceDueDate) {
    return null;
  }

  const dueDateKey = getLocalDateKey(occurrenceDueDate);

  const payments = Store.getPaymentsForBill(billId)
    .filter((payment) => payment.status !== "voided")
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));

  const exactPayment = payments.find((payment) => {
    return (
      payment.paidForDueDate &&
      getLocalDateKey(payment.paidForDueDate) === dueDateKey
    );
  });

  if (exactPayment) {
    return exactPayment;
  }

  return (
    payments.find((payment) => {
      if (payment.paidForDueDate) return false;

      return isSameMonth(payment.paidDate, new Date(occurrenceDueDate));
    }) || null
  );
}

function isOccurrencePaid(bill, referenceDate = new Date()) {
  return Boolean(getActivePaymentForOccurrence(bill, referenceDate));
}

function getOccurrenceStatus(bill, referenceDate = new Date()) {
  const occurrenceDueDate = getBillOccurrenceDueDate(bill, referenceDate);

  if (!occurrenceDueDate) {
    return "upcoming";
  }

  if (isOccurrencePaid(bill, referenceDate)) {
    return "paid";
  }

  return daysUntil(occurrenceDueDate) < 0 ? "overdue" : "upcoming";
}
function getBillStatus(bill) {
  return getOccurrenceStatus(bill, new Date());
}

function isPaidThisCycle(bill) {
  return getBillStatus(bill) === 'paid';
}

function getLatestActivePaymentForBill(billId) {
  return Store.getPaymentsForBill(billId)
    .filter(payment => payment.status !== 'voided')
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))[0] || null;
}
function isPaidThisMonth(bill, referenceDate = new Date()) {
  return isOccurrencePaid(bill, referenceDate);
}
let paymentUndoTimer = null;
let paymentUndoToastId = null;

function dismissPaymentUndoToast() {
  if (paymentUndoTimer) {
    clearTimeout(paymentUndoTimer);
    paymentUndoTimer = null;
  }

  if (paymentUndoToastId) {
    document.getElementById(paymentUndoToastId)?.remove();
    paymentUndoToastId = null;
  }
}

function showPaymentUndoToast(payment, billName) {
  if (!payment?.id) return;

  dismissPaymentUndoToast();

  const toastId = `payment-undo-${payment.id}`;
  paymentUndoToastId = toastId;

  const toast = document.createElement("div");

  toast.id = toastId;
  toast.setAttribute("role", "status");

  toast.style.cssText = `
    position:fixed;
    left:16px;
    right:16px;
    bottom:calc(82px + env(safe-area-inset-bottom, 0px));
    z-index:10000;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    padding:14px 16px;
    border-radius:14px;
    background:var(--surface, #1e1e2e);
    color:var(--text, #ffffff);
    box-shadow:0 12px 30px rgba(0,0,0,.28);
    font-size:14px;
    font-weight:700;
  `;

  toast.innerHTML = `
    <span>${escapeHtml(billName)} marked paid</span>
    <button
      type="button"
      data-payment-undo="${payment.id}"
      style="
        border:0;
        background:transparent;
        color:var(--accent, #7c5cff);
        font:inherit;
        font-weight:900;
        padding:6px 2px;
        cursor:pointer;
      "
    >
      Undo
    </button>
  `;

  document.body.appendChild(toast);

  toast
    .querySelector("[data-payment-undo]")
    ?.addEventListener("click", () => {
      const activePayment = Store.getPayments().find(
        (item) =>
          item.id === payment.id &&
          item.status !== "voided"
      );

      if (!activePayment) {
        dismissPaymentUndoToast();
        return;
      }

      const bill = Store.getBill(activePayment.billId);
      const voidedAt = new Date().toISOString();

      Store.updatePayment(activePayment.id, {
        status: "voided",
        voidedAt,
      });

      recordActivity({
        action: "payment_undone",
        entityType: bill?.installmentPlanId ? "payment_plan" : "bill",
        entityId: bill?.installmentPlanId || activePayment.billId,
        title: `${bill?.name || billName} payment undone`,
        detail: `${formatCurrency(activePayment.amount)} · Due ${formatDate(
          activePayment.paidForDueDate,
          "short"
        )}`,
        before: {
          paymentId: activePayment.id,
          status: "active",
          amount: parseFloat(activePayment.amount) || 0,
          paidDate: activePayment.paidDate,
          dueDate: activePayment.paidForDueDate,
        },
        after: {
          paymentId: activePayment.id,
          status: "voided",
          voidedAt,
        },
      });

      dismissPaymentUndoToast();
      render();
    });

  paymentUndoTimer = setTimeout(dismissPaymentUndoToast, 3000);
}
function markBillPaid(billId) {
  const bill = Store.getBill(billId);

  if (!bill) return;

  const today = new Date();

  const dueDate = isRecurringBill(bill)
    ? getOccurrenceDueDate(
        bill,
        today.getFullYear(),
        today.getMonth()
      )
    : bill.dueDate;

  const occurrenceBill = {
    ...bill,
    sourceBillId: bill.id,
    dueDate,
    isOccurrence: isRecurringBill(bill),
  };

  if (isOccurrencePaid(occurrenceBill, new Date(dueDate))) return;

  const payment = {
    id: uid(),
    billId: bill.id,
    paidDate: new Date().toISOString(),
    amount: bill.amount,
    paidForDueDate: dueDate,
    status: "active",
    voidedAt: null,
  };

  Store.addPayment(payment);

  recordActivity({
    action: "bill_paid",
    entityType: bill.installmentPlanId ? "payment_plan" : "bill",
    entityId: bill.installmentPlanId || bill.id,
    title: `${bill.name} marked as paid`,
    detail: `${formatCurrency(bill.amount)} · Due ${formatDate(
      dueDate,
      "short"
    )}`,
    after: {
      paymentId: payment.id,
      amount: parseFloat(bill.amount) || 0,
      dueDate,
      paidDate: payment.paidDate,
      paymentPlanId: bill.installmentPlanId || null,
    },
  });

  render();
  showPaymentUndoToast(payment, bill.name);
}
function markBillUnpaid(billId) {
  const bill = Store.getBill(billId);

  if (!bill) return;

  const today = new Date();

  const dueDate = isRecurringBill(bill)
    ? getOccurrenceDueDate(
        bill,
        today.getFullYear(),
        today.getMonth()
      )
    : bill.dueDate;

  const occurrenceBill = {
    ...bill,
    sourceBillId: bill.id,
    dueDate,
    isOccurrence: isRecurringBill(bill),
  };

  const payment = getActivePaymentForOccurrence(
    occurrenceBill,
    new Date(dueDate)
  );

  if (!payment) {
    alert("This bill occurrence does not have an active payment to reverse.");
    return;
  }

  const confirmed = confirm(
    `Mark ${bill.name} as unpaid for ${formatDate(
      dueDate,
      "full"
    )}? ${formatCurrency(payment.amount)} will be added back to bills still due.`
  );

  if (!confirmed) return;

  const voidedAt = new Date().toISOString();

  Store.updatePayment(payment.id, {
    status: "voided",
    voidedAt,
  });

  recordActivity({
    action: "payment_voided",
    entityType: bill.installmentPlanId ? "payment_plan" : "bill",
    entityId: bill.installmentPlanId || bill.id,
    title: `${bill.name} marked as unpaid`,
    detail: `${formatCurrency(payment.amount)} · Due ${formatDate(
      dueDate,
      "short"
    )}`,
    before: {
      paymentId: payment.id,
      status: "active",
      amount: parseFloat(payment.amount) || 0,
      dueDate,
      paidDate: payment.paidDate,
    },
    after: {
      paymentId: payment.id,
      status: "voided",
      voidedAt,
    },
  });

  render();
}
function confirmMarkPaidOccurrence(billId, dueDate) {
  const bill = Store.getBill(billId);

  if (!bill) {
    alert('Bill not found.');
    return;
  }

  const confirmed = confirm(
    `Mark ${bill.name} as paid for ${formatDate(dueDate, 'full')}?\n\n` +
    `${formatCurrency(bill.amount)} will be recorded for this occurrence.`
  );

  if (!confirmed) {
    return;
  }

  const occurrenceBill = {
    ...bill,
    id: getOccurrenceKey(bill.id, dueDate),
    sourceBillId: bill.id,
    dueDate,
    isOccurrence: true
  };

  if (isOccurrencePaid(occurrenceBill, new Date(dueDate))) {
    alert('This occurrence is already marked as paid.');
    return;
  }

  const payment = {
    id: uid(),
    billId: bill.id,
    paidDate: new Date().toISOString(),
    amount: bill.amount,
    paidForDueDate: dueDate,
    status: 'active',
    voidedAt: null
  };

  Store.addPayment(payment);
  render();
  showPaymentUndoToast(payment, bill.name);
}

function markBillOccurrenceUnpaid(billId, dueDate) {
  const bill = Store.getBill(billId);

  if (!bill) {
    alert("Bill not found.");
    return;
  }

  const occurrenceBill = {
    ...bill,
    id: getOccurrenceKey(bill.id, dueDate),
    sourceBillId: bill.id,
    dueDate,
    isOccurrence: true
  };

  const payment = getActivePaymentForOccurrence(
    occurrenceBill,
    new Date(dueDate)
  );

  if (!payment) {
    alert("This occurrence does not have an active payment to reverse.");
    return;
  }

  const confirmed = confirm(
    `Mark ${bill.name} as unpaid for ${formatDate(dueDate, "full")}?\n\n` +
    `${formatCurrency(payment.amount)} will be added back to bills due.`
  );

  if (!confirmed) {
    return;
  }

  Store.updatePayment(payment.id, {
    status: "voided",
    voidedAt: new Date().toISOString()
  });

  render();
}
function svgIcon(name, size = 20) {
  const path = ICONS[name] || ICONS.doc;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="fill:currentColor">${path}</svg>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function safePaymentUrl(value) {
  let url = String(value || "").trim();

  if (!url) return "";

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return "";
    }

    return parsed.href;
  } catch {
    return "";
  }
}

function openPaymentPage(billId) {
  const bill = Store.getBill(billId);

  if (!bill) {
    alert("Bill not found.");
    return;
  }

  const paymentUrl = safePaymentUrl(bill.paymentUrl);

  if (!paymentUrl) {
    alert("No payment link has been added for this bill.");
    openBillForm(bill.id);
    return;
  }

  window.open(paymentUrl, "_blank", "noopener,noreferrer");
}

// ====================================
// THEME
// ====================================

function initTheme() {
  const settings = Store.getSettings();
  if (settings.theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else if (settings.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
        document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// ====================================
// ROUTER
// ====================================

let currentRoute = 'today';
let routeParams = {
  billSort: 'dueDate',
};

function navigate(route, params = {}) {
  currentRoute = route;
  routeParams = params;
  render();
  window.scrollTo(0, 0);
  const main = document.querySelector('.main-content');
  if (main) main.scrollTop = 0;
}

// ====================================
// VIEWS
// ====================================
function getNotificationCount() {
  return Store.getBills().filter((bill) => {
    const status = getBillStatus(bill);

    return (
      status === 'overdue' ||
      (status === 'upcoming' && daysUntil(bill.dueDate) <= 7)
    );
  }).length;
}
function getDashboardUpcomingGroups(referenceDate = new Date()) {
  const currentMonthBills = getCalendarBillsForMonth(referenceDate);

  const nextMonthDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    1,
    12,
    0,
    0
  );

  const nextMonthBills = getCalendarBillsForMonth(nextMonthDate);

  const isUnpaid = bill =>
    !isOccurrencePaid(bill, new Date(bill.dueDate));

  const sortDue = (a, b) =>
    new Date(a.dueDate) - new Date(b.dueDate);

  const currentMonth = currentMonthBills
    .filter(isUnpaid)
    .sort(sortDue);

  const nextMonth = nextMonthBills
    .filter(isUnpaid)
    .sort(sortDue);

  return {
    currentMonth,
    nextMonth,
    nextMonthLabel: formatDate(nextMonthDate.toISOString(), 'monthYear')
  };
}

function renderDashboardUpcomingBill(bill) {
  const category = getCategory(bill.category);

  const billStatus = getOccurrenceStatus(
    bill,
    new Date(bill.dueDate)
  );

  const sourceBillId = bill.isOccurrence
    ? bill.sourceBillId
    : bill.id;

  const isPaymentPlan = Boolean(
    bill.installmentPlanId && bill.installmentProvider
  );

  const iconBackground = isPaymentPlan
    ? "transparent"
    : getBillBrand(bill.name)
      ? "#fff"
      : `var(--${category.color})`;

  const iconColor = isPaymentPlan || getBillBrand(bill.name)
    ? "#1e1e2e"
    : "white";

  return `
    <button
      type="button"
      class="dashboard-upcoming-tile ${
        billStatus === "overdue" ? "is-overdue" : ""
      }"
      onclick="navigate('detail', {
        id: '${sourceBillId}',
        occurrenceDueDate: '${bill.dueDate}',
        returnRoute: 'today'
      })"
      aria-label="View ${escapeHtml(bill.name)} details"
    >
      <div
  class="upcoming-bill-icon"
  style="
    width:42px;
    height:42px;
    min-width:42px;
    background:${iconBackground};
    color:${iconColor};
    overflow:hidden;
  "
>
  ${billOrPaymentPlanVisual(bill, 42)}
</div>

      <div class="upcoming-bill-name">
        ${escapeHtml(bill.name)}
      </div>

      <div class="upcoming-bill-amount">
        ${formatCurrency(bill.amount)}
      </div>

      <div
        class="upcoming-bill-date"
        style="
          color:${
            billStatus === "overdue"
              ? "var(--overdue)"
              : "var(--text-muted)"
          };
        "
      >
        ${formatDate(bill.dueDate, "short")}
        · ${relativeDue(bill.dueDate)}
      </div>
    </button>
  `;
}
function renderToday() {
  const now = new Date();

  const currentDateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(now);

  /*
   * Use the exact same month-specific objects used by the calendar:
   * - one-time bills due this month
   * - generated occurrences for recurring bills due this month
   */
  const monthBills = getCalendarBillsForMonth(now);

  const paidThisMonthBills = monthBills.filter((bill) => {
    return isOccurrencePaid(bill, new Date(bill.dueDate));
  });

  const unpaidThisMonthBills = monthBills.filter((bill) => {
    return !isOccurrencePaid(bill, new Date(bill.dueDate));
  });

  const upcomingMonthBills = unpaidThisMonthBills.filter((bill) => {
    return getOccurrenceStatus(bill, new Date(bill.dueDate)) === "upcoming";
  });

  const overdueBills = unpaidThisMonthBills.filter((bill) => {
    return getOccurrenceStatus(bill, new Date(bill.dueDate)) === "overdue";
  });

  const totalDueThisMonth = unpaidThisMonthBills.reduce((sum, bill) => {
    return sum + (parseFloat(bill.amount) || 0);
  }, 0);

  const totalPaidThisMonth = paidThisMonthBills.reduce((sum, bill) => {
    return sum + (parseFloat(bill.amount) || 0);
  }, 0);

  const totalScheduledThisMonth =
    totalDueThisMonth + totalPaidThisMonth;

  const monthPaymentProgress =
    totalScheduledThisMonth > 0
      ? Math.min(
          (totalPaidThisMonth / totalScheduledThisMonth) * 100,
          100
        )
      : 0;

  const nextDueBill = [...upcomingMonthBills, ...overdueBills]
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  const dashboardUpcomingGroups = getDashboardUpcomingGroups(now);

const currentMonthUpcomingBills = dashboardUpcomingGroups.currentMonth;
const nextMonthUpcomingBills = dashboardUpcomingGroups.nextMonth;
const nextMonthLabel = dashboardUpcomingGroups.nextMonthLabel;

  const recentPayments = Store.getPayments()
    .map((payment) => ({
      ...payment,
      bill: Store.getBill(payment.billId)
    }))
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
    .slice(0, 5);

  const paidCount = paidThisMonthBills.length;
  const upcomingCount = upcomingMonthBills.length;
  const overdueCount = overdueBills.length;
  const notificationCount = getNotificationCount();

  const getSourceBillId = (bill) => {
    return bill.isOccurrence ? bill.sourceBillId : bill.id;
  };

  const getBillStatusForDashboard = (bill) => {
    return getOccurrenceStatus(bill, new Date(bill.dueDate));
  };

  return `
    <div class="nav-bar dashboard-nav">
      <div class="nav-bar-content">
        <button
          class="nav-button dashboard-icon-button"
          onclick="navigate('settings')"
          aria-label="Open settings"
        >
          ${svgIcon("gear", 22)}
        </button>

        <div class="dashboard-date">${currentDateLabel}</div>

        <button
          class="nav-button dashboard-icon-button"
          onclick="openNotificationCenter()"
          aria-label="Open notifications"
          style="position:relative"
        >
          ${svgIcon("bell", 22)}
          ${
            notificationCount > 0
              ? `
                <span style="
                  position:absolute;
                  top:2px;
                  right:2px;
                  min-width:16px;
                  height:16px;
                  padding:0 4px;
                  border-radius:999px;
                  background:var(--overdue);
                  color:white;
                  font-size:10px;
                  font-weight:700;
                  line-height:16px;
                  text-align:center;
                  border:2px solid var(--bg);
                ">
                  ${notificationCount > 9 ? "9+" : notificationCount}
                </span>
              `
              : ""
          }
        </button>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad dashboard-content">
        <button
          class="dashboard-month-card"
          onclick="openDashboardStatusSheet('unpaid')"
          aria-label="View bills still due this month"
        >
          <div class="dashboard-card-topline">
            <span>This Month</span>

            <span>
              ${paidThisMonthBills.length} of ${monthBills.length} bills paid
            </span>
          </div>

          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:var(--space-3);
              margin-top:var(--space-4);
            "
          >
            <div>
              <div
                style="
                  font-size:var(--text-xs);
                  color:var(--text-muted);
                  margin-bottom:4px;
                "
              >
                Remaining
              </div>

              <div
                class="text-upcoming"
                style="
                  font-size:var(--text-2xl);
                  font-weight:800;
                  line-height:1.1;
                "
              >
                ${formatCurrency(totalDueThisMonth)}
              </div>
            </div>

            <div style="text-align:right">
              <div
                style="
                  font-size:var(--text-xs);
                  color:var(--text-muted);
                  margin-bottom:4px;
                "
              >
                Paid
              </div>

              <div
                class="text-paid"
                style="
                  font-size:var(--text-2xl);
                  font-weight:800;
                  line-height:1.1;
                "
              >
                ${formatCurrency(totalPaidThisMonth)}
              </div>
            </div>
          </div>

          <div
            class="dashboard-progress-track"
            style="margin-top:var(--space-4)"
          >
            <div
              class="dashboard-progress-fill"
              style="width:${monthPaymentProgress}%"
            ></div>
          </div>

          <div class="dashboard-month-footer">
            <span>
              ${unpaidThisMonthBills.length}
              bill${unpaidThisMonthBills.length === 1 ? "" : "s"} left
            </span>

            <span>
              View Unpaid Bills ${svgIcon("chevronRight", 14)}
            </span>
          </div>
        </button>

        <div class="section-header">Bill Status · This Month</div>

        <div class="dashboard-status-row">
          <button
            class="dashboard-status-card status-paid-card"
            onclick="openDashboardStatusSheet('paid')"
            aria-label="View paid bills"
          >
            <div class="dashboard-status-number text-paid">${paidCount}</div>
            <div class="dashboard-status-label">Paid</div>
          </button>

          <button
            class="dashboard-status-card status-upcoming-card"
            onclick="openDashboardStatusSheet('due')"
            aria-label="View bills due"
          >
            <div class="dashboard-status-number text-upcoming">
              ${upcomingCount}
            </div>
            <div class="dashboard-status-label">Due</div>
          </button>

          <button
            class="dashboard-status-card status-overdue-card"
            onclick="openDashboardStatusSheet('overdue')"
            aria-label="View overdue bills"
          >
            <div class="dashboard-status-number text-overdue">
              ${overdueCount}
            </div>
            <div class="dashboard-status-label">Overdue</div>
          </button>
        </div>

        ${
          nextDueBill
            ? `
              <button
                class="next-due-card ${
                  getBillStatusForDashboard(nextDueBill) === "overdue"
                    ? "next-due-card-overdue"
                    : ""
                }"
                onclick="navigate('detail', {
  id: '${getSourceBillId(nextDueBill)}',
  occurrenceDueDate: '${nextDueBill.dueDate}',
  returnRoute: 'today'
})"
                aria-label="View next due bill"
              >
                <div class="next-due-icon">
                  ${svgIcon(
                    getBillStatusForDashboard(nextDueBill) === "overdue"
                      ? "warning"
                      : "clock",
                    18
                  )}
                </div>

                <div class="next-due-copy">
                  <div class="next-due-label">
                    ${
                      getBillStatusForDashboard(nextDueBill) === "overdue"
                        ? "Overdue"
                        : "Next Due"
                    }
                  </div>

                  <div class="next-due-name">
                    ${escapeHtml(nextDueBill.name)}
                  </div>

                  <div class="next-due-meta">
                    ${formatDate(nextDueBill.dueDate, "full")} ·
                    ${relativeDue(nextDueBill.dueDate)}
                  </div>
                </div>

                <div class="next-due-amount">
                  ${formatCurrency(nextDueBill.amount)}
                </div>

                <div class="next-due-arrow">
                  ${svgIcon("chevronRight", 20)}
                </div>
              </button>
            `
            : `
              <div class="next-due-card next-due-card-empty">
                <div class="next-due-icon">
                  ${svgIcon("checkCircle", 18)}
                </div>

                <div class="next-due-copy">
                  <div class="next-due-label">Next Due</div>
                  <div class="next-due-name">
                    You Are All Caught Up
                  </div>
                </div>
              </div>
            `
        }

        <div>
          <div class="dashboard-section-title-row">
            <div class="section-header dashboard-section-header">
              Upcoming Bills
            </div>

            <button
              class="bb-outline-pill"
              style="
                min-height:34px;
                padding:0 12px;
                font-size:var(--text-xs);
              "
              onclick="openDashboardStatusSheet('upcoming')"
            >
              <span>See All</span>
              <span class="pill-chevron">
                ${svgIcon("chevronRight", 14)}
              </span>
            </button>
          </div>

          ${
  currentMonthUpcomingBills.length || nextMonthUpcomingBills.length
    ? `
      ${
        currentMonthUpcomingBills.length
          ? `
            <div class="upcoming-carousel">
              ${currentMonthUpcomingBills
                .slice(0, 6)
                .map(renderDashboardUpcomingBill)
                .join('')}
            </div>
          `
          : ''
      }

      ${
        nextMonthUpcomingBills.length
          ? `
            <div class="dashboard-upcoming-month-divider">
  <span>${nextMonthLabel}</span>
  <span>
    ${
      nextMonthUpcomingBills.slice(0, 6).length
    } shown
    · ${formatCurrency(
      nextMonthUpcomingBills
        .slice(0, 6)
        .reduce(
          (total, bill) =>
            total + (parseFloat(bill.amount) || 0),
          0
        )
    )}
  </span>
</div>

            <div class="upcoming-carousel">
              ${nextMonthUpcomingBills
                .slice(0, 6)
                .map(renderDashboardUpcomingBill)
                .join('')}
            </div>
          `
          : ''
      }
    `
    : `
      <div class="dashboard-empty-card">
        ${svgIcon('checkCircle', 22)}
        <span>No upcoming bills right now</span>
      </div>
    `
}
 
        </div>

        <div>
          <div class="dashboard-section-title-row">
            <div class="section-header dashboard-section-header">
              Recent Payments
            </div>

            ${
              recentPayments.length
                ? `
                  <button
                    class="bb-outline-pill"
                    style="
                      min-height:34px;
                      padding:0 12px;
                      font-size:var(--text-xs);
                    "
                    onclick="navigate('history')"
                  >
                    <span>See All</span>
                    <span class="pill-chevron">
                      ${svgIcon("chevronRight", 14)}
                    </span>
                  </button>
                `
                : ""
            }
          </div>

          ${
            recentPayments.length
              ? `
                <div class="card">
                  ${recentPayments
                    .map((payment) => {
                      const billName = payment.bill
                        ? escapeHtml(payment.bill.name)
                        : "Archived bill";

                      const isVoided = payment.status === "voided";

                      return `
                        <button
                          class="recent-payment-row"
                          onclick="navigate('detail', {
  id: '${payment.billId}',
  occurrenceDueDate: '${payment.paidForDueDate || ''}'
})"
                          ${
                            isVoided
                              ? 'style="opacity:.58; text-decoration:line-through"'
                              : ""
                          }
                        >
                          <div
                            class="recent-payment-icon"
                            style="color:${
                              isVoided
                                ? "var(--text-muted)"
                                : "var(--paid)"
                            }"
                          >
                            ${svgIcon(
                              isVoided ? "close" : "checkCircle",
                              18
                            )}
                          </div>

                          <div class="bill-info">
                            <div class="bill-name">
                              ${billName}${isVoided ? " · Voided" : ""}
                            </div>

                            <div class="bill-meta">
                              ${
                                isVoided
                                  ? `Payment voided ${formatDate(
                                      payment.voidedAt || payment.paidDate,
                                      "full"
                                    )}`
                                  : `Paid ${formatDate(
                                      payment.paidDate,
                                      "full"
                                    )}`
                              }
                            </div>
                          </div>

                          <div
                            class="recent-payment-amount"
                            style="${
                              isVoided
                                ? "text-decoration:line-through; color:var(--text-muted)"
                                : ""
                            }"
                          >
                            ${formatCurrency(payment.amount)}
                          </div>
                        </button>
                      `;
                    })
                    .join("")}
                </div>
              `
              : `
                <div class="dashboard-empty-card">
                  ${svgIcon("tray", 22)}
                  <span>Payments you mark as paid will appear here</span>
                </div>
              `
          }
        </div>
      </div>
    </div>
  `;
}
function getCycleForBill(bill) {
  if (bill.payCycle === 'first') return 'early';
  if (bill.payCycle === 'second') return 'late';
  return new Date(bill.dueDate).getDate() <= 15 ? 'early' : 'late';
}

function renderCompactRecurringCalendar() {
  const viewDate = routeParams.month
    ? new Date(`${routeParams.month.slice(0, 10)}T12:00:00`)
    : new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const currentMonthStart = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
);

const viewedMonthStart = new Date(year, month, 1);

const monthBills =
  viewedMonthStart < currentMonthStart
    ? []
    : getCalendarBillsForMonth(viewDate);

  const cells = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    cells.push('<div class="recurring-calendar-day is-empty"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);

    const dayBills = monthBills.filter((bill) => {
      return new Date(bill.dueDate).getDate() === day;
    });

    const isToday = date.toDateString() === today.toDateString();

    const hasOverdue = dayBills.some(
      (bill) => getCalendarBillStatus(bill) === "overdue"
    );

    const hasUpcoming = dayBills.some(
      (bill) => getCalendarBillStatus(bill) === "upcoming"
    );

    const hasPaid = dayBills.some(isCalendarBillPaid);

    let marker = "";

    if (dayBills.length) {
      const markerClass = hasOverdue
        ? "overdue"
        : hasUpcoming
          ? "upcoming"
          : "paid";

      marker = `<i class="recurring-calendar-marker ${markerClass}"></i>`;
    }

    cells.push(`
      <button
        class="recurring-calendar-day ${
          isToday ? "is-today" : ""
        } ${hasOverdue ? "has-overdue" : ""}"
        onclick="openCalendarDay('${date.toISOString()}')"
        aria-label="View bills for ${formatDate(date.toISOString(), "full")}"
      >
        <span>${day}</span>
        ${marker}
      </button>
    `);
  }

  const prevMonth = new Date(year, month - 1, 1).toISOString();
  const nextMonth = new Date(year, month + 1, 1).toISOString();

  return `
    <section class="recurring-calendar-card" aria-label="Recurring bills calendar">
      <div class="recurring-calendar-heading">
        <button
          class="month-nav-btn"
          onclick="navigate('recurring', { month: '${prevMonth}' })"
          aria-label="Previous month"
        >
          ${svgIcon("chevronLeft", 18)}
        </button>

        <strong>${formatDate(viewDate.toISOString(), "monthYear")}</strong>

        <button
          class="month-nav-btn"
          onclick="navigate('recurring', { month: '${nextMonth}' })"
          aria-label="Next month"
        >
          ${svgIcon("chevronRight", 18)}
        </button>
      </div>

      <div class="recurring-calendar-weekdays">
        ${["S", "M", "T", "W", "T", "F", "S"]
          .map((day) => `<span>${day}</span>`)
          .join("")}
      </div>

      <div class="recurring-calendar-grid">
        ${cells.join("")}
      </div>
    </section>
  `;
}
const RECURRING_SECTION_LIMIT = 3;

function getStartOfLocalDay(date = new Date()) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0
  );
}

function getRecurringRelativeLabel(dateString, now = new Date()) {
  const startOfToday = getStartOfLocalDay(now);
  const dueDate = getStartOfLocalDay(new Date(dateString));
  const dayDifference = Math.round(
    (dueDate - startOfToday) / 86400000
  );

  if (dayDifference === 0) return 'Today';
  if (dayDifference === 1) return 'Tomorrow';
  if (dayDifference === -1) return '1 day ago';
  if (dayDifference < 0) return `${Math.abs(dayDifference)} days ago`;

  return `In ${dayDifference} days`;
}

function isActiveRecurringOccurrence(bill) {
  if (!bill || !bill.isOccurrence) return false;

  return !(
    bill.archived ||
    bill.cancelled ||
    bill.status === 'cancelled' ||
    bill.status === 'paid-in-full' ||
    bill.status === 'paidInFull'
  );
}

function renderRecurringOccurrenceRow(bill) {
  const sourceBillId = bill.sourceBillId || bill.id;
  const dueDate = new Date(bill.dueDate);
  const status = getOccurrenceStatus(bill, dueDate);
  const statusColor =
    status === 'overdue' ? 'var(--overdue)' : 'var(--text-muted)';

  return `
    <button
      type="button"
      class="bill-row clickable"
      style="width:100%;text-align:left"
      onclick="navigate('detail', {
        id: '${sourceBillId}',
        occurrenceDueDate: '${bill.dueDate}',
        returnRoute: 'recurring'
      })"
      aria-label="View ${escapeHtml(bill.name)} due ${formatDate(
        bill.dueDate,
        'full'
      )}"
    >
      <div
        class="bill-icon"
        style="
          background:${
  bill.installmentPlanId
    ? 'transparent'
    : getBillBrand(bill.name)
      ? '#fff'
      : `var(--${getCategory(bill.category).color})`
};
          color:${getBillBrand(bill.name) ? '#1e1e2e' : 'white'};
          padding:${getBillBrand(bill.name) ? '3px' : '0'};
          overflow:hidden;
        "
      >
        ${billOrPaymentPlanVisual(bill, 42)}
      </div>

      <div class="bill-info">
        <div class="bill-name">${escapeHtml(bill.name)}</div>

        <div class="bill-meta" style="color:${statusColor}">
          ${getRecurringRelativeLabel(bill.dueDate)}
          · ${formatDate(bill.dueDate, 'short')}
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px">
        <div class="bill-amount">${formatCurrency(bill.amount)}</div>
        ${svgIcon('chevronRight', 18)}
      </div>
    </button>
  `;
}

function toggleRecurringSection(sectionId) {
  const hiddenRows = document.getElementById(
    `recurring-${sectionId}-more`
  );

  const button = document.getElementById(
    `recurring-${sectionId}-toggle`
  );

  if (!hiddenRows || !button) return;

  const isOpen = hiddenRows.classList.toggle('is-open');

  button.innerHTML = isOpen
    ? `<span>Show Less</span>${svgIcon('chevronRight', 18)}`
    : `<span>Show More</span>${svgIcon('chevronRight', 18)}`;

  button.setAttribute('aria-expanded', String(isOpen));
}
function renderRecurring() {
  const now = new Date();
  const startOfToday = getStartOfLocalDay(now);

  const endOfUpcoming = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    startOfToday.getDate() + 5,
    12,
    0,
    0
  );

  const startOfLater = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    startOfToday.getDate() + 6,
    12,
    0,
    0
  );

  const endOfLater = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    startOfToday.getDate() + 10,
    12,
    0,
    0
  );

  const recurringOccurrences = getRecurringOccurrencesForNextMonths(now, 3);

  const paymentPlanInstallments = Store.getBills()
    .filter(bill => {
      if (!bill.installmentPlanId) return false;

      const dueDate = new Date(bill.dueDate);

      return (
        !Number.isNaN(dueDate.getTime()) &&
        !bill.archivedAt &&
        !bill.cancelledAt &&
        !bill.paidInFullAt
      );
    })
    .map(bill => ({
      ...bill,
      isPaymentPlanInstallment: true
    }));

  const scheduledItems = [
    ...recurringOccurrences,
    ...paymentPlanInstallments
  ];

  const isUnpaidEligibleOccurrence = bill => {
    const dueDate = new Date(bill.dueDate);

    const isActivePaymentPlanInstallment =
      Boolean(bill.installmentPlanId) &&
      !bill.archivedAt &&
      !bill.cancelledAt &&
      !bill.paidInFullAt;

    const isEligible =
      isActiveRecurringOccurrence(bill) ||
      isActivePaymentPlanInstallment;

    return (
      isEligible &&
      !Number.isNaN(dueDate.getTime()) &&
      getOccurrenceStatus(bill, dueDate) !== 'paid'
    );
  };

  const sortDue = (a, b) => new Date(a.dueDate) - new Date(b.dueDate);

  const overdue = scheduledItems
    .filter(bill => {
      const dueDate = new Date(bill.dueDate);

      return isUnpaidEligibleOccurrence(bill) && dueDate < startOfToday;
    })
    .sort(sortDue);

  const upcoming = scheduledItems
    .filter(bill => {
      const dueDate = new Date(bill.dueDate);

      return (
        isUnpaidEligibleOccurrence(bill) &&
        dueDate >= startOfToday &&
        dueDate <= endOfUpcoming
      );
    })
    .sort(sortDue);

  const comingUpLater = scheduledItems
    .filter(bill => {
      const dueDate = new Date(bill.dueDate);

      return (
        isUnpaidEligibleOccurrence(bill) &&
        dueDate >= startOfLater &&
        dueDate <= endOfLater
      );
    })
    .sort(sortDue);

  const renderSection = ({
    id,
    title,
    subtitle,
    bills,
    emptyMessage,
    showWhenEmpty = true
  }) => {
    if (!bills.length && !showWhenEmpty) return '';

    const visibleBills = bills.slice(0, RECURRING_SECTION_LIMIT);
    const hiddenBills = bills.slice(RECURRING_SECTION_LIMIT);
    const hasMore = hiddenBills.length > 0;

    return `
      <section class="recurring-list-section">
        <div class="recurring-list-heading">
          <div>
            <div class="section-header">${title}</div>
            <div class="recurring-list-subtitle">${subtitle}</div>
          </div>

          <span class="recurring-count">${bills.length}</span>
        </div>

        ${
          bills.length
            ? `
              <div class="card recurring-bills-card">
                ${visibleBills
                  .map(renderRecurringOccurrenceRow)
                  .join('')}

                ${
                  hasMore
                    ? `
                      <div
                        id="recurring-${id}-more"
                        class="recurring-section-more"
                      >
                        ${hiddenBills
                          .map(renderRecurringOccurrenceRow)
                          .join('')}
                      </div>

                      <button
                        type="button"
                        id="recurring-${id}-toggle"
                        class="show-more-bills-button"
                        onclick="toggleRecurringSection('${id}')"
                        aria-expanded="false"
                      >
                        <span>Show More</span>
                        ${svgIcon('chevronRight', 18)}
                      </button>
                    `
                    : ''
                }
              </div>
            `
            : `
              <div class="empty-state recurring-empty-state">
                <div class="empty-state-text">${emptyMessage}</div>
              </div>
            `
        }
      </section>
    `;
  };

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <div class="nav-title">Recurring</div>

        <button
          class="nav-button"
          onclick="openAddMenu()"
          aria-label="Add a recurring bill"
        >
          ${svgIcon('plus', 18)}
        </button>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad recurring-content">
        ${renderCompactRecurringCalendar()}

        ${renderSection({
          id: 'overdue',
          title: 'Overdue',
          subtitle: 'Past-due bills and payment plans',
          bills: overdue,
          emptyMessage: '',
          showWhenEmpty: false
        })}

        ${renderSection({
          id: 'upcoming',
          title: 'Upcoming',
          subtitle: 'Due today through the next 5 days',
          bills: upcoming,
          emptyMessage:
            'You have no unpaid bills or payment plans due in the next 5 days.'
        })}

        ${renderSection({
          id: 'later',
          title: 'Coming Up Later',
          subtitle: 'Due in 6 to 10 days',
          bills: comingUpLater,
          emptyMessage:
            'You have no unpaid bills or payment plans due 6 to 10 days from now.'
        })}
      </div>
    </div>
  `;
}
function renderBills() {
  const allBills = Store.getBills();

  // Payment-plan installments remain stored as individual bills for their
  // independent due dates and payment history, but do not appear in Bills.
  const bills = allBills.filter(bill => !bill.installmentPlanId);

  const billSort = routeParams.billSort || 'dueDate';

  const sortOptions = {
    dueDate: 'Due date',
    amountLow: 'Amount: low to high',
    amountHigh: 'Amount: high to low',
    name: 'Name: A–Z',
    category: 'Type / category'
  };

  const sortBills = items => {
    const copy = [...items];

    switch (billSort) {
      case 'amountLow':
        return copy.sort(
          (a, b) =>
            (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0)
        );

      case 'amountHigh':
        return copy.sort(
          (a, b) =>
            (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0)
        );

      case 'name':
        return copy.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            sensitivity: 'base'
          })
        );

      case 'category':
        return copy.sort((a, b) => {
          const categoryCompare = getCategory(a.category).label.localeCompare(
            getCategory(b.category).label
          );

          return categoryCompare ||
            new Date(a.dueDate) - new Date(b.dueDate);
        });

      case 'dueDate':
      default:
        return copy.sort(
          (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
        );
    }
  };

  const sortedBills = sortBills(bills);

  let billContent = '';

  if (billSort === 'category') {
    const groups = {};

    sortedBills.forEach(bill => {
      const categoryName = getCategory(bill.category).label;

      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }

      groups[categoryName].push(bill);
    });

    const sortedCategoryNames = Object.keys(groups).sort((a, b) =>
      a.localeCompare(b)
    );

    billContent = sortedCategoryNames
      .map(
        categoryName => `
          <div>
            <div class="section-header">${categoryName}</div>

            <div class="card">
              ${groups[categoryName]
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map(bill => billRow(bill, false))
                .join('')}
            </div>
          </div>
        `
      )
      .join('');
  } else if (sortedBills.length) {
    billContent = `
      <div class="card">
        ${sortedBills.map(bill => billRow(bill, false)).join('')}
      </div>
    `;
  }

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <div class="nav-title">Bills</div>

        <button
          class="nav-button"
          onclick="openAddMenu()"
          aria-label="Add a bill or payment plan"
        >
          ${svgIcon('plus', 18)}
        </button>
      </div>
    </div>

    <div class="main-content fade-in">
      ${
        bills.length === 0
          ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                ${svgIcon('tray', 48)}
              </div>

              <div class="empty-state-title">No bills yet</div>

              <div class="empty-state-text">
                Add a bill to start tracking payments.
              </div>

              <button
                class="btn-primary"
                style="margin-top:var(--space-4)"
                onclick="openAddMenu()"
              >
                ${svgIcon('plus', 18)}
                Add bill
              </button>
            </div>
          `
          : `
            <div
              style="
                display:flex;
                justify-content:center;
                margin:var(--space-3) 0 var(--space-4);
              "
            >
              <button
                class="bb-outline-pill"
                onclick="openBillSortSheet()"
                aria-label="Sort bills by ${sortOptions[billSort]}"
                style="min-width:230px"
              >
                <span class="pill-icon">${svgIcon('sort', 18)}</span>
                <span>Sort: ${sortOptions[billSort]}</span>
                <span class="pill-chevron">
                  ${svgIcon('chevronRight', 16)}
                </span>
              </button>
            </div>

            <div class="content-pad content-gap">
              ${billContent}
            </div>
          `
      }
    </div>
  `;
}
function closeBillSortSheet() {
  document.getElementById('billSortContainer')?.remove();
}

function openBillSortSheet() {
  const currentSort = routeParams.billSort || 'dueDate';

  const options = [
    { id: 'dueDate', label: 'Due date', icon: 'calendar' },
    { id: 'amountLow', label: 'Amount: low to high', icon: 'trendUp' },
    { id: 'amountHigh', label: 'Amount: high to low', icon: 'trendUp' },
    { id: 'name', label: 'Name: A–Z', icon: 'doc' },
    { id: 'category', label: 'Type / category', icon: 'tray' },
  ];

  const container = document.createElement('div');
  container.id = 'billSortContainer';

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="billSortOverlay"
      onclick="closeBillSortSheet()"
    ></div>

    <div class="sheet" id="billSortSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeBillSortSheet()">
          Cancel
        </button>

        <div class="sheet-title">Sort bills</div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body">
        <div class="card">
          ${options
            .map(
              (option) => `
                <button
                  class="form-row"
                  style="
                    width:100%;
                    text-align:left;
                    cursor:pointer;
                    background:transparent;
                    color:inherit;
                    border:0;
                  "
                  onclick="setBillSort('${option.id}')"
                >
                  <div
                    style="
                      display:flex;
                      align-items:center;
                      gap:var(--space-3);
                      width:100%;
                    "
                  >
                    <span
                      style="
                        display:inline-flex;
                        color:${
                          currentSort === option.id
                            ? 'var(--accent)'
                            : 'var(--text-muted)'
                        };
                      "
                    >
                      ${svgIcon(option.icon, 20)}
                    </span>

                    <span
                      style="
                        flex:1;
                        font-weight:${
                          currentSort === option.id ? '800' : '500'
                        };
                      "
                    >
                      ${option.label}
                    </span>

                    ${
                      currentSort === option.id
                        ? `<span style="color:var(--accent)">${svgIcon(
                            'check',
                            20
                          )}</span>`
                        : ''
                    }
                  </div>
                </button>
              `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
document.body.appendChild(container);
}

function setBillSort(sort) {
  routeParams.billSort = sort;
  closeBillSortSheet();
  render();
}
function renderCalendar() {
  const viewDate = routeParams.month
    ? new Date(routeParams.month)
    : new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const today = new Date();

  const monthBills = getCalendarBillsForMonth(viewDate);

  const monthTotal = monthBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const paidBills = monthBills.filter(isCalendarBillPaid);
  const paidTotal = paidBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const dueBills = monthBills.filter(
    (bill) => getCalendarBillStatus(bill) === "upcoming"
  );

  const dueTotal = dueBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const overdueBills = monthBills.filter(
    (bill) => getCalendarBillStatus(bill) === "overdue"
  );

  const overdueTotal = overdueBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const dayCells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    dayCells.push('<div class="calendar-day calendar-day-empty"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);

    const dayBills = monthBills.filter((bill) => {
      const dueDate = new Date(bill.dueDate);

      return dueDate.getDate() === day;
    });

    const isToday = date.toDateString() === today.toDateString();
    const hasPaid = dayBills.some(isCalendarBillPaid);

    const hasUpcoming = dayBills.some(
      (bill) => getCalendarBillStatus(bill) === "upcoming"
    );

    const hasOverdue = dayBills.some(
      (bill) => getCalendarBillStatus(bill) === "overdue"
    );

    let dots = "";

    if (dayBills.length) {
      dots = `
        <div class="calendar-dot-row">
          ${
            hasPaid
              ? '<div class="calendar-dot" style="background:var(--paid)"></div>'
              : ""
          }
          ${
            hasUpcoming
              ? '<div class="calendar-dot" style="background:var(--upcoming)"></div>'
              : ""
          }
          ${
            hasOverdue
              ? '<div class="calendar-dot" style="background:var(--overdue)"></div>'
              : ""
          }
        </div>
      `;
    }

    dayCells.push(`
      <button
        class="calendar-day calendar-day-clickable ${
          isToday ? "today" : ""
        } ${hasOverdue ? "calendar-day-overdue" : ""}"
        onclick="openCalendarDay('${date.toISOString()}')"
        aria-label="View ${
          dayBills.length ? `${dayBills.length} bills due on ` : ""
        }${formatDate(date.toISOString(), "full")}"
      >
        <span>${day}</span>
        ${dots}
      </button>
    `);
  }

  const monthBillsSorted = [...monthBills].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );

  const visibleMonthBills = monthBillsSorted.slice(0, 5);
  const hiddenMonthBills = monthBillsSorted.slice(5);

  const prevMonth = new Date(year, month - 1, 1).toISOString();
  const nextMonth = new Date(year, month + 1, 1).toISOString();

  const viewingCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <div class="nav-title">Calendar</div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad content-gap">
        <div class="card card-pad">
          <div class="month-nav">
            <button
              class="month-nav-btn"
              onclick="navigate('calendar', { month: '${prevMonth}' })"
              aria-label="Previous month"
            >
              ${svgIcon("chevronLeft", 22)}
            </button>

            <div class="month-nav-title">
              ${formatDate(viewDate.toISOString(), "monthYear")}
            </div>

            <button
              class="month-nav-btn"
              onclick="navigate('calendar', { month: '${nextMonth}' })"
              aria-label="Next month"
            >
              ${svgIcon("chevronRight", 22)}
            </button>
          </div>

          ${
            !viewingCurrentMonth
              ? `
                <button
                  class="btn-secondary"
                  style="width:100%;margin:var(--space-2) 0 var(--space-4)"
                  onclick="navigate('calendar')"
                >
                  ${svgIcon("calendar", 18)}
                  Today
                </button>
              `
              : ""
          }

          <div class="calendar-grid">
            ${weekdays
              .map((day) => `<div class="calendar-weekday">${day}</div>`)
              .join("")}
            ${dayCells.join("")}
          </div>
        </div>

        <div class="calendar-summary">
          <div class="calendar-summary-item">
            <div class="calendar-summary-label">Scheduled</div>
            <div class="calendar-summary-value">
              ${formatCurrency(monthTotal)}
            </div>
            <div class="calendar-summary-meta">
              ${monthBills.length} ${monthBills.length === 1 ? "bill" : "bills"}
            </div>
          </div>

          <div class="calendar-summary-item">
            <div class="calendar-summary-label">Still due</div>
            <div class="calendar-summary-value text-upcoming">
              ${formatCurrency(dueTotal)}
            </div>
            <div class="calendar-summary-meta">
              ${dueBills.length} ${dueBills.length === 1 ? "bill" : "bills"}
            </div>
          </div>

          <div class="calendar-summary-item">
            <div class="calendar-summary-label">Paid</div>
            <div class="calendar-summary-value text-paid">
              ${formatCurrency(paidTotal)}
            </div>
            <div class="calendar-summary-meta">
              ${paidBills.length} ${paidBills.length === 1 ? "bill" : "bills"}
            </div>
          </div>
        </div>

        ${
          overdueBills.length
            ? `
              <button
                class="card card-pad"
                onclick="openDashboardStatusSheet('overdue')"
                style="
                  width:100%;
                  text-align:left;
                  cursor:pointer;
                  border-color:color-mix(
                    in srgb,
                    var(--overdue) 38%,
                    var(--border)
                  );
                "
                aria-label="View overdue bills"
              >
                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:var(--space-2);
                    color:var(--overdue);
                  "
                >
                  ${svgIcon("warning", 18)}
                  <strong>
                    ${overdueBills.length}
                    overdue ${overdueBills.length === 1 ? "bill" : "bills"}
                  </strong>
                  <span style="margin-left:auto;font-weight:800">
                    ${formatCurrency(overdueTotal)}
                  </span>
                </div>
              </button>
            `
            : ""
        }

        ${
          monthBillsSorted.length
            ? `
              <div>
                <div class="section-header">This Month</div>

                <div class="card">
                  ${visibleMonthBills
                    .map((bill) => billRow(bill, true))
                    .join("")}

                  ${
                    hiddenMonthBills.length
                      ? `
                        <div id="moreMonthBills" class="more-month-bills">
                          ${hiddenMonthBills
                            .map((bill) => billRow(bill, true))
                            .join("")}
                        </div>

                        <button
                          id="toggleMonthBills"
                          class="show-more-bills-button"
                          onclick="toggleMonthBills()"
                        >
                          Show all ${monthBillsSorted.length} bills
                          ${svgIcon("chevronRight", 18)}
                        </button>
                      `
                      : ""
                  }
                </div>
              </div>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">${svgIcon("calendar", 44)}</div>
                <div class="empty-state-title">No bills this month</div>
                <div class="empty-state-text">
                  Add a bill to begin planning this month’s payments.
                </div>
                <button
                  class="btn-primary"
                  style="margin-top:var(--space-4)"
                  onclick="openBillForm()"
                >
                  ${svgIcon("plus", 18)}
                  Add bill
                </button>
              </div>
            `
        }
      </div>
    </div>
  `;
}


window.closeCalendarDay = function() {
  document.getElementById('calendarDaySheetContainer')?.remove();
};

window.openCalendarDay = function (dateString) {
  const selectedDate = new Date(dateString);

  const currentMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const selectedMonthStart = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  );

  const billsForDay =
    selectedMonthStart < currentMonthStart
      ? []
      : getCalendarBillsForDay(dateString);

  const dayTotal = billsForDay.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const container = document.createElement("div");
  container.id = "calendarDaySheetContainer";

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="calendarDayOverlay"
      onclick="closeCalendarDay()"
    ></div>

    <div class="sheet" id="calendarDaySheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeCalendarDay()">
          Close
        </button>

        <div class="sheet-title">
          ${formatDate(dateString, "full")}
        </div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body">
        <div class="card" style="margin-bottom:var(--space-4)">
          <div class="form-row">
            <div>
              <div
                style="
                  font-size:var(--text-xs);
                  color:var(--text-muted);
                  margin-top:2px;
                "
              >
                ${billsForDay.length}
                ${billsForDay.length === 1 ? "bill" : "bills"} scheduled
              </div>
            </div>

            <div
              style="
                margin-left:auto;
                font-size:var(--text-lg);
                font-weight:800;
              "
            >
              ${formatCurrency(dayTotal)}
            </div>
          </div>
        </div>

        ${
          billsForDay.length
            ? `
              <div class="card">
                ${billsForDay
                  .map((bill) => {
                    const category = getCategory(bill.category);
                    const paid = isCalendarBillPaid(bill);
                    const status = getCalendarBillStatus(bill);

                    const statusText = paid
                      ? "Paid"
                      : status === "overdue"
                        ? "Overdue"
                        : "Due";

                    const statusColor = paid
                      ? "var(--paid)"
                      : status === "overdue"
                        ? "var(--overdue)"
                        : "var(--upcoming)";

                    const sourceBillId = bill.isOccurrence
                      ? bill.sourceBillId
                      : bill.id;

                    return `
                      <div class="bill-row">
                        <button
                          onclick="closeCalendarDay();navigate('detail',{
                            id:'${sourceBillId}',
                            occurrenceDueDate:'${bill.dueDate}',
                            returnRoute:'recurring'
                          })"
                          style="display:contents;text-align:left"
                          aria-label="View ${escapeHtml(bill.name)}"
                        >
                          <div
                            class="bill-icon"
                            style="
                              background:${
  bill.installmentPlanId
    ? 'transparent'
    : getBillBrand(bill.name)
      ? '#fff'
      : `var(--${category.color})`
};
color:${
  bill.installmentPlanId || getBillBrand(bill.name)
    ? '#1e1e2e'
    : 'white'
};
overflow:hidden;
                            "
                          >
                            ${billOrPaymentPlanVisual(bill, 32)}
                          </div>

                          <div class="bill-info">
                            <div class="bill-name">
                              ${escapeHtml(bill.name)}
                            </div>

                            <div
                              class="bill-meta"
                              style="color:${statusColor}"
                            >
                              ${statusText}
                            </div>
                          </div>

                          <div class="bill-amount">
                            ${formatCurrency(bill.amount)}
                          </div>
                        </button>

                        ${
                          !paid
                            ? `
                              <button
                                class="calendar-pay-button"
                                onclick="markCalendarBillPaid(
                                  '${sourceBillId}',
                                  '${bill.dueDate}'
                                )"
                                aria-label="Mark ${escapeHtml(
                                  bill.name
                                )} as paid"
                              >
                                ${svgIcon("check", 16)}
                              </button>
                            `
                            : ""
                        }
                      </div>
                    `;
                  })
                  .join("")}
              </div>

              <button
                class="calendar-add-pill"
                onclick="closeCalendarDay();openCalendarAddMenu('${dateString}')"
              >
                ${svgIcon("plus", 18)}
                Add Bill
              </button>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon("calendar", 44)}
                </div>

                <div class="empty-state-title">No bills due</div>

                <div class="empty-state-text">
                  There are no bills scheduled for this date.
                </div>

                <button
                  class="calendar-add-pill"
                  onclick="closeCalendarDay();openCalendarAddMenu('${dateString}')"
                >
                  ${svgIcon("plus", 18)}
                  Add Bill
                </button>
              </div>
            `
        }
      </div>
    </div>
  `;

  document.body.appendChild(container);
};
window.markCalendarBillPaid = function (billId, dateString) {
  const bill = Store.getBill(billId);

  if (!bill) {
    alert("Bill not found.");
    return;
  }
const confirmed = confirm(
  `Mark ${bill.name} as paid for ${formatDate(dateString, "full")}?\n\n` +
  `${formatCurrency(bill.amount)} will be recorded as paid for this occurrence.`
);

if (!confirmed) {
  return;
}
  const dueDate = new Date(dateString);

  if (Number.isNaN(dueDate.getTime())) {
    alert("This bill occurrence has an invalid due date.");
    return;
  }

  const occurrenceDueDate = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
    12,
    0,
    0
  ).toISOString();

  const occurrenceBill = {
    ...bill,
    sourceBillId: bill.id,
    dueDate: occurrenceDueDate,
    isOccurrence: true
  };

  if (isOccurrencePaid(occurrenceBill, new Date(occurrenceDueDate))) {
    alert("This bill occurrence is already marked as paid.");
    return;
  }

    const payment = {
    id: uid(),
    billId: bill.id,
    paidDate: new Date().toISOString(),
    amount: bill.amount,
    paidForDueDate: occurrenceDueDate,
    status: 'active',
    voidedAt: null
  };

  Store.addPayment(payment);
  showPaymentUndoToast(payment, bill.name);

  closeCalendarDay();

setTimeout(() => {
  navigate("recurring");
}, 320);
};
function closeDashboardStatusSheet() {
  document.getElementById('dashboardStatusContainer')?.remove();
}
function openCycleBillsSheet(cycle, cycleLabel) {
  const now = new Date();

  const bills = Store.getBills()
    .filter(bill => {
      const dueDate = new Date(bill.dueDate);

      if (
        dueDate.getMonth() !== now.getMonth() ||
        dueDate.getFullYear() !== now.getFullYear()
      ) {
        return false;
      }

      const billCycle = bill.payCycle ||
        (dueDate.getDate() <= 15 ? 'first' : 'second');

      return billCycle === cycle;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const total = bills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const container = document.createElement('div');
  container.id = 'cycleBillsContainer';

  container.innerHTML = `
    <div class="sheet-overlay" id="cycleBillsOverlay"
      onclick="closeCycleBillsSheet()"></div>

    <div class="sheet" id="cycleBillsSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeCycleBillsSheet()">
          Close
        </button>

        <div class="sheet-title">Cycle Bills</div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body">
        <div class="card" style="margin-bottom:var(--space-4)">
          <div class="form-row">
            <div>
              <div class="form-label">${cycleLabel}</div>
              <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:3px">
                ${bills.length} ${bills.length === 1 ? 'bill' : 'bills'} scheduled
              </div>
            </div>

            <div style="margin-left:auto;font-size:var(--text-lg);font-weight:800">
              ${formatCurrency(total)}
            </div>
          </div>
        </div>

        ${
          bills.length
            ? `<div class="card">
                ${bills.map(bill => billRow(bill, true)).join('')}
              </div>`
            : `<div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon('checkCircle', 44)}
                </div>
                <div class="empty-state-title">No bills this cycle</div>
                <div class="empty-state-text">
                  Add bills or assign existing bills to this pay cycle.
                </div>
              </div>`
        }
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document.getElementById('cycleBillsOverlay')?.classList.add('show');
    document.getElementById('cycleBillsSheet')?.classList.add('show');
  });
}

function closeCycleBillsSheet() {
  document.getElementById('cycleBillsOverlay')?.classList.remove('show');
  document.getElementById('cycleBillsSheet')?.classList.remove('show');

  setTimeout(() => {
  document.getElementById('cycleBillsContainer')?.remove();
  unlockBackgroundScroll();
}, 300);
}
function openDashboardStatusSheet(status) {
  const now = new Date();

  const monthBills = getCalendarBillsForMonth(now);

  const getBillStatusForSheet = (bill) => {
    return getOccurrenceStatus(bill, new Date(bill.dueDate));
  };

  const getSourceBillId = (bill) => {
    return bill.isOccurrence ? bill.sourceBillId : bill.id;
  };

  const getOccurrencePayment = (bill) => {
    return getActivePaymentForOccurrence(
      bill,
      new Date(bill.dueDate)
    );
  };

  let title = "Paid Bills";
  let color = "var(--paid)";
  let icon = svgIcon("checkCircle", 18);
  let selectedBills = [];

  if (status === "paid") {
    selectedBills = monthBills
      .filter((bill) => {
        return getBillStatusForSheet(bill) === "paid";
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  if (status === "unpaid") {
    title = "Unpaid Bills";
    color = "var(--upcoming)";
    icon = svgIcon("clock", 18);

    selectedBills = monthBills
      .filter((bill) => {
        return getBillStatusForSheet(bill) !== "paid";
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  if (status === "upcoming") {
    title = "Upcoming Bills";
    color = "var(--upcoming)";
    icon = svgIcon("clock", 18);

    selectedBills = monthBills
      .filter((bill) => {
        const billStatus = getBillStatusForSheet(bill);

        return billStatus === "overdue" || billStatus === "upcoming";
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  if (status === "due") {
    title = "Due Bills";
    color = "var(--upcoming)";
    icon = svgIcon("clock", 18);

    selectedBills = monthBills
      .filter((bill) => {
        return getBillStatusForSheet(bill) === "upcoming";
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  if (status === "overdue") {
    title = "Overdue Bills";
    color = "var(--overdue)";
    icon = svgIcon("warning", 18);

    selectedBills = monthBills
      .filter((bill) => {
        return getBillStatusForSheet(bill) === "overdue";
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  const total = selectedBills.reduce((sum, bill) => {
    return sum + (parseFloat(bill.amount) || 0);
  }, 0);

  const container = document.createElement("div");
  container.id = "dashboardStatusContainer";

  container.innerHTML = `
    <div
      class="sheet-overlay show"
      id="dashboardStatusOverlay"
      onclick="closeDashboardStatusSheet()"
    ></div>

    <div class="sheet show" id="dashboardStatusSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button
          class="nav-button"
          onclick="closeDashboardStatusSheet()"
        >
          Close
        </button>

        <div class="sheet-title">${title}</div>
        <div style="width:54px"></div>
      </div>

      <div class="sheet-body">
        <div
          class="card"
          style="margin-bottom:var(--space-4); overflow:hidden"
        >
          <div class="form-row">
            <div
              style="
                display:flex;
                align-items:center;
                gap:var(--space-2);
                color:${color};
              "
            >
              ${icon}
              <span style="font-weight:700">
                ${selectedBills.length}
                ${selectedBills.length === 1 ? "bill" : "bills"}
              </span>
            </div>

            <div style="flex:1"></div>

            <div
              style="
                font-size:var(--text-lg);
                font-weight:800;
                color:${color};
              "
            >
              ${formatCurrency(total)}
            </div>
          </div>
        </div>

        ${
          selectedBills.length
            ? `
              <div class="card">
                ${selectedBills
                  .map((bill) => {
                    const payment =
                      status === "paid"
                        ? getOccurrencePayment(bill)
                        : null;

                    const billStatus = getBillStatusForSheet(bill);

                    const rowColor =
                      status === "unpaid" && billStatus === "overdue"
                        ? "var(--overdue)"
                        : color;

                    const dateLabel =
                      status === "paid" && payment
                        ? `Paid ${formatDate(payment.paidDate, "full")}`
                        : billStatus === "overdue"
                          ? `Overdue · ${formatDate(
                              bill.dueDate,
                              "full"
                            )}`
                          : `${formatDate(
                              bill.dueDate,
                              "full"
                            )} · ${relativeDue(bill.dueDate)}`;

                    const category = getCategory(bill.category);
                    const sourceBillId = getSourceBillId(bill);

                    return `
                      <button
                        class="bill-row"
                        onclick="closeDashboardStatusSheet();navigate('detail',{
                        id:'${sourceBillId}',
                         occurrenceDueDate:'${bill.dueDate}',
                        returnRoute:'today'
                        })"
                        style="width:100%;text-align:left"
                        aria-label="View ${escapeHtml(bill.name)}"
                      >
                        <div
                          class="bill-icon"
                          style="
                            width:42px;
                            height:42px;
                            min-width:42px;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            overflow:hidden;
                            border-radius:10px;
                            background:${
                              getBillBrand(bill.name)
                                ? "#fff"
                                : `var(--${category.color})`
                            };
                            color:${
                              getBillBrand(bill.name)
                                ? "#1e1e2e"
                                : "white"
                            };
                          "
                        >
                          ${billVisual(bill, 32)}
                        </div>

                        <div class="bill-info">
                          <div class="bill-name">
                            ${escapeHtml(bill.name)}
                          </div>

                          <div
                            class="bill-meta"
                            style="color:${rowColor}"
                          >
                            ${dateLabel}
                          </div>
                        </div>

                        <div class="bill-amount">
                          ${formatCurrency(bill.amount)}
                        </div>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon("checkCircle", 44)}
                </div>

                <div class="empty-state-title">
                  No ${title.toLowerCase()} bills
                </div>

                <div class="empty-state-text">
                  There is nothing to show for this month.
                </div>
              </div>
            `
        }
      </div>
    </div>
  `;

  document.body.appendChild(container);
}


function getMonthlySpendingLimit() {
  const settings = Store.getSettings();
  return Number(settings.monthlySpendingLimit || 0);
}

function saveMonthlySpendingLimit(limit) {
  const settings = Store.getSettings();

  Store.saveSettings({
    ...settings,
    monthlySpendingLimit: Number(limit || 0),
  });
}

function editMonthlySpendingLimit() {
  const currentLimit = getMonthlySpendingLimit();

  const value = prompt(
    "Set your monthly spending limit. Enter 0 to remove it:",
    currentLimit || ""
  );

  if (value === null) return;

  const limit = Number(value);

  if (Number.isNaN(limit) || limit < 0) {
    alert("Please enter a valid amount.");
    return;
  }

  saveMonthlySpendingLimit(limit);
  render();
}
function billOrPaymentPlanVisual(bill, size = 32) {
  if (bill?.installmentPlanId && bill?.installmentProvider) {
    return paymentPlanVisual(bill.installmentProvider, size);
  }

  return billVisual(bill, size);
}
function paymentPlanVisual(provider, size = 42) {
  const normalized = String(provider || "")
    .trim()
    .toLowerCase();

  const providers = {
    klarna: {
      label: "Klarna",
      domain: "klarna.com",
      background: "#ffb3c7",
    },
    afterpay: {
      label: "Afterpay",
      domain: "afterpay.com",
      background: "#b7f7d8",
    },
    affirm: {
      label: "Affirm",
      domain: "affirm.com",
      background: "#4a4af4",
    },
    sezzle: {
      label: "Sezzle",
      domain: "sezzle.com",
      background: "#7b5cff",
    },
    zip: {
      label: "Zip",
      domain: "zip.co",
      background: "#6d5cff",
    },
    "paypal pay later": {
      label: "PayPal Pay Later",
      domain: "paypal.com",
      background: "#003087",
    },
    paypal: {
      label: "PayPal",
      domain: "paypal.com",
      background: "#003087",
    },
  };

  const plan = providers[normalized] || {
    label: String(provider || "Payment Plan"),
    domain: "",
    background: "var(--accent)",
  };

  const fallback = `
    <span
      style="
        position:absolute;
        inset:0;
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
      "
    >
      ${svgIcon("creditcard", Math.round(size * 0.5))}
    </span>
  `;

  return `
    <span
      style="
        position:relative;
        display:inline-flex;
        width:${size}px;
        height:${size}px;
        flex:0 0 ${size}px;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        border-radius:${Math.round(size * 0.3)}px;
        background:${plan.background};
      "
      aria-label="${escapeHtml(plan.label)}"
      title="${escapeHtml(plan.label)}"
    >
      ${fallback}

      ${
        plan.domain
          ? `
            <img
              src="https://img.logo.dev/${plan.domain}?token=pk_Oi2mTbJ_SOOVDVoEsRz5kg&size=256&format=png"
              alt=""
              width="${size}"
              height="${size}"
              style="
                position:relative;
                z-index:1;
                display:block;
                width:${size}px;
                height:${size}px;
                object-fit:contain;
                transform:scale(1.08);
              "
              onerror="this.style.display='none'"
            >
          `
          : ""
      }
    </span>
  `;
}
function renderPaymentPlans() {
  const installmentBills = Store.getBills().filter((bill) => {
    return Boolean(bill.installmentPlanId);
  });

  const plansById = installmentBills.reduce((plans, bill) => {
    if (!plans[bill.installmentPlanId]) {
      plans[bill.installmentPlanId] = [];
    }

    plans[bill.installmentPlanId].push(bill);
    return plans;
  }, {});

  const plans = Object.entries(plansById)
    .map(([planId, installments]) => {
      const sortedInstallments = [...installments].sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
      );

      const paidInstallments = sortedInstallments.filter((bill) =>
        isOccurrencePaid(bill, new Date(bill.dueDate))
      );

      const unpaidInstallments = sortedInstallments.filter((bill) =>
        !isOccurrencePaid(bill, new Date(bill.dueDate))
      );

      const representative = sortedInstallments[0];
      const provider =
        representative.installmentProvider || "Payment Plan";

      const storeName = String(representative.name || "")
        .split(" ")
        .slice(1, -1)
        .join(" ")
        .trim();

      const totalAmount = sortedInstallments.reduce(
        (sum, bill) => sum + (parseFloat(bill.amount) || 0),
        0
      );

      const remainingBalance = unpaidInstallments.reduce(
        (sum, bill) => sum + (parseFloat(bill.amount) || 0),
        0
      );

      const paidInFullAt =
        sortedInstallments.find((bill) => bill.paidInFullAt)
          ?.paidInFullAt || null;

      return {
        id: planId,
        provider,
        storeName,
        installmentCount: sortedInstallments.length,
        paidCount: paidInstallments.length,
        totalAmount,
        remainingBalance,
        nextInstallment: unpaidInstallments[0] || null,
        paidInFullAt,
      };
    })
    .sort((a, b) => {
      if (!a.nextInstallment && !b.nextInstallment) {
        return a.provider.localeCompare(b.provider);
      }

      if (!a.nextInstallment) return 1;
      if (!b.nextInstallment) return -1;

      return (
        new Date(a.nextInstallment.dueDate) -
        new Date(b.nextInstallment.dueDate)
      );
    });

  const activePlans = plans.filter((plan) => plan.nextInstallment);
  const completedPlans = plans.filter((plan) => !plan.nextInstallment);

  const renderPlanCard = (plan, isCompleted = false) => {
    const planTitle = plan.storeName
      ? `${plan.provider} · ${plan.storeName}`
      : plan.provider;

    const progressPercent = plan.installmentCount
      ? (plan.paidCount / plan.installmentCount) * 100
      : 0;

    return `
      <div
        class="card card-pad"
        style="
          width:100%;
          text-align:left;
          opacity:${isCompleted ? ".72" : "1"};
        "
      >
        <div
          style="
            display:flex;
            align-items:flex-start;
            gap:var(--space-3);
          "
        >
          ${paymentPlanVisual(plan.provider, 42)}

          <div style="min-width:0;flex:1">
            <div
              style="
                font-size:var(--text-base);
                font-weight:800;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
              "
            >
              ${escapeHtml(planTitle)}
            </div>

            <div
              style="
                margin-top:4px;
                font-size:var(--text-sm);
                color:var(--text-muted);
              "
            >
              ${
                isCompleted
                  ? "Paid in full"
                  : `Payment ${plan.paidCount + 1} of ${plan.installmentCount}`
              }
            </div>
          </div>

          <div style="text-align:right">
            ${
              !isCompleted
                ? `
                  <button
                    type="button"
                    class="nav-button"
                    onclick="openPaymentPlanActions('${plan.id}')"
                    aria-label="Payment Plan actions for ${escapeHtml(planTitle)}"
                    style="
                      width:36px;
                      height:36px;
                      padding:0;
                      margin:-6px -6px 0 0;
                      display:inline-flex;
                      align-items:center;
                      justify-content:center;
                    "
                  >
                    ${svgIcon("moreVertical", 20)}
                  </button>
                `
                : ""
            }

            <div
              style="
                margin-top:${isCompleted ? "0" : "4px"};
                font-size:var(--text-base);
                font-weight:800;
                color:${isCompleted ? "var(--text-muted)" : "var(--text)"};
              "
            >
              ${
                isCompleted
                  ? "Paid in full"
                  : `${formatCurrency(plan.remainingBalance)} left`
              }
            </div>

            ${
              plan.nextInstallment
                ? `
                  <div
                    style="
                      margin-top:4px;
                      font-size:var(--text-xs);
                      color:var(--text-muted);
                    "
                  >
                    Next ${formatDate(plan.nextInstallment.dueDate, "short")}
                  </div>
                `
                : plan.paidInFullAt
                  ? `
                    <div
                      style="
                        margin-top:4px;
                        font-size:var(--text-xs);
                        color:var(--text-muted);
                      "
                    >
                      ${formatDate(plan.paidInFullAt, "short")}
                    </div>
                  `
                  : ""
            }
          </div>
        </div>

        <div
          class="dashboard-progress-track"
          style="margin-top:var(--space-3)"
        >
          <div
            class="dashboard-progress-fill"
            style="width:${Math.min(progressPercent, 100)}%"
          ></div>
        </div>
      </div>
    `;
  };

  return `
    <div class="nav-bar">
  <div class="nav-bar-content">
    <button
      type="button"
      class="nav-button"
      onclick="navigate('insights')"
      aria-label="Back to Insights"
    >
      ${svgIcon("chevronLeft", 22)}
    </button>

    <div class="nav-title">Payment Plans</div>

    <button
      type="button"
      class="nav-button"
      onclick="navigate('insights')"
      aria-label="Close Payment Plans"
    >
      ${svgIcon("close", 22)}
    </button>
  </div>
</div>

    <div class="main-content fade-in">
      <div class="content-pad content-gap">
        ${
          !plans.length
            ? `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon("creditcard", 44)}
                </div>
                <div class="empty-state-title">No payment plans</div>
                <div class="empty-state-text">
                  Payment plans you add will appear here.
                </div>
              </div>
            `
            : `
              ${
                activePlans.length
                  ? `
                    <div>
                      <div class="section-header">Active Plans</div>
                      <div class="content-gap">
                        ${activePlans
                          .map((plan) => renderPlanCard(plan))
                          .join("")}
                      </div>
                    </div>
                  `
                  : ""
              }

              ${
                completedPlans.length
                  ? `
                    <div>
                      <div class="section-header">Completed</div>
                      <div class="content-gap">
                        ${completedPlans
                          .map((plan) => renderPlanCard(plan, true))
                          .join("")}
                      </div>
                    </div>
                  `
                  : ""
              }
            `
        }
      </div>
    </div>
  `;
}

function openPaymentPlanActions(planId) {
  const installments = Store.getBills()
    .filter((bill) => bill.installmentPlanId === planId)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const unpaidInstallments = installments.filter(
    (bill) => !isOccurrencePaid(bill, new Date(bill.dueDate))
  );

  if (!installments.length) {
    alert("Payment plan not found.");
    return;
  }

  const representative = installments[0];
  const provider =
    representative?.installmentProvider || "Payment Plan";

  const remainingBalance = unpaidInstallments.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  document.getElementById("paymentPlanActionsContainer")?.remove();

  const container = document.createElement("div");
  container.id = "paymentPlanActionsContainer";

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="paymentPlanActionsOverlay"
      onclick="closePaymentPlanActions()"
    ></div>

    <div class="sheet" id="paymentPlanActionsSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button
          type="button"
          class="nav-button"
          onclick="closePaymentPlanActions()"
          aria-label="Close payment plan actions"
        >
          ${svgIcon("close", 22)}
        </button>

        <div class="sheet-title">Payment Plan</div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body content-gap">
        <div class="card card-pad">
          <div
            style="
              display:flex;
              align-items:center;
              gap:var(--space-3);
            "
          >
            ${paymentPlanVisual(provider, 42)}

            <div style="min-width:0;flex:1">
              <div
                style="
                  font-size:var(--text-base);
                  font-weight:800;
                "
              >
                ${escapeHtml(provider)}
              </div>
            </div>

            <div style="text-align:right">
              <div
                style="
                  font-size:var(--text-xs);
                  color:var(--text-muted);
                "
              >
                Remaining
              </div>

              <div
                style="
                  margin-top:3px;
                  font-size:var(--text-lg);
                  font-weight:800;
                "
              >
                ${formatCurrency(remainingBalance)}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="btn-secondary"
          style="width:100%"
          onclick="openExistingPaymentPlanEditor('${planId}')"
        >
          ${svgIcon("gear", 20)}
          Edit Plan
        </button>

        ${
          unpaidInstallments.length
            ? `
              <button
                type="button"
                class="btn-primary"
                style="width:100%"
                onclick="payPaymentPlanInFull('${planId}')"
              >
                ${svgIcon("checkCircle", 20)}
                Pay in Full
              </button>
            `
            : ""
        }

        <button
          type="button"
          class="btn-secondary"
          style="width:100%"
          onclick="closePaymentPlanActions()"
        >
          Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document
      .getElementById("paymentPlanActionsOverlay")
      ?.classList.add("show");

    document
      .getElementById("paymentPlanActionsSheet")
      ?.classList.add("show");
  });
}
function closePaymentPlanActions() {
  document
    .getElementById("paymentPlanActionsOverlay")
    ?.classList.remove("show");

  document
    .getElementById("paymentPlanActionsSheet")
    ?.classList.remove("show");

  setTimeout(() => {
    document.getElementById("paymentPlanActionsContainer")?.remove();
    unlockBackgroundScroll();
  }, 300);
}
function payPaymentPlanInFull(planId) {
  const paidInFullAt = new Date().toISOString();

  const installments = Store.getBills().filter(
    (bill) => bill.installmentPlanId === planId
  );

  const unpaidInstallments = installments.filter(
    (bill) => !isOccurrencePaid(bill, new Date(bill.dueDate))
  );

  if (!unpaidInstallments.length) {
    closePaymentPlanActions();
    alert("This payment plan is already paid in full.");
    return;
  }

  const payoffAmount = unpaidInstallments.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const confirmed = confirm(
    `Pay off ${formatCurrency(payoffAmount)}?\n\n` +
    `This will mark ${unpaidInstallments.length} remaining scheduled ` +
    `payment${unpaidInstallments.length === 1 ? "" : "s"} as paid.`
  );

  if (!confirmed) return;

  unpaidInstallments.forEach((bill) => {
    Store.addPayment({
      id: uid(),
      billId: bill.id,
      paidDate: paidInFullAt,
      amount: parseFloat(bill.amount) || 0,
      paidForDueDate: bill.dueDate,
      status: "active",
      voidedAt: null,
      paymentPlanId: planId,
      paymentType: "paid-in-full",
      paidInFullAt,
    });
  });

  installments.forEach((bill) => {
    Store.updateBill(bill.id, {
      paidInFullAt,
      paidInFullAmount: payoffAmount,
    });
  });

  closePaymentPlanActions();
  render();
}
function openExistingPaymentPlanEditor(planId) {
  const installments = Store.getBills()
    .filter((bill) => bill.installmentPlanId === planId)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (!installments.length) {
    alert("Payment plan not found.");
    return;
  }

  closePaymentPlanActions();

  // Opens the normal existing Bill/Recurring edit form
  // using the first installment as the representative record.
  openBillForm(installments[0].id);
}
function closeCategorySpendingSheet() {
  document
    .getElementById("categorySpendingOverlay")
    ?.classList.remove("show");

  document
    .getElementById("categorySpendingSheet")
    ?.classList.remove("show");

  setTimeout(() => {
    document.getElementById("categorySpendingContainer")?.remove();
    unlockBackgroundScroll();
  }, 300);
}

function getCategorySpendingItems(categoryId) {
  const now = new Date();

  return getCalendarBillsForMonth(now)
    .filter((bill) => bill.category === categoryId)
    .map((bill) => {
      const dueDate = new Date(bill.dueDate);
      const payment = getActivePaymentForOccurrence(bill, dueDate);
      const status = getOccurrenceStatus(bill, dueDate);

      return {
        bill,
        payment,
        status,
        amount: parseFloat(bill.amount) || 0,
      };
    })
    .sort(
      (a, b) =>
        new Date(a.bill.dueDate) - new Date(b.bill.dueDate)
    );
}

function openCategorySpendingSheet(categoryId) {
  const category = getCategory(categoryId);
  const items = getCategorySpendingItems(categoryId);

  const total = items.reduce((sum, item) => {
    return sum + item.amount;
  }, 0);

  document.getElementById("categorySpendingContainer")?.remove();

  const container = document.createElement("div");
  container.id = "categorySpendingContainer";

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="categorySpendingOverlay"
      onclick="closeCategorySpendingSheet()"
    ></div>

    <div class="sheet" id="categorySpendingSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button
          type="button"
          class="nav-button"
          onclick="closeCategorySpendingSheet()"
          aria-label="Close category spending"
        >
          ${svgIcon("close", 22)}
        </button>

        <div class="sheet-title">
          ${escapeHtml(category.label)}
        </div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body content-gap">
        <div class="card card-pad">
          <div
            style="
              display:flex;
              align-items:center;
              gap:var(--space-3);
            "
          >
            <div
              style="
                width:42px;
                height:42px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:12px;
                color:white;
                background:var(--${category.color});
              "
            >
              ${svgIcon(category.icon, 22)}
            </div>

            <div style="flex:1">
              <div
                style="
                  font-size:var(--text-sm);
                  color:var(--text-muted);
                "
              >
                This month
              </div>

              <div
                style="
                  margin-top:3px;
                  font-size:var(--text-lg);
                  font-weight:800;
                "
              >
                ${formatCurrency(total)}
              </div>
            </div>

            <div
              style="
                font-size:var(--text-sm);
                color:var(--text-muted);
              "
            >
              ${items.length} item${items.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        ${
          items.length
            ? `
              <div class="card">
                ${items
                  .map(({ bill, payment, status }) => {
                    const sourceBillId = bill.isOccurrence
                      ? bill.sourceBillId
                      : bill.id;

                    const statusColor =
                      status === "paid"
                        ? "var(--paid)"
                        : status === "overdue"
                          ? "var(--overdue)"
                          : "var(--upcoming)";

                    const statusLabel =
                      status === "paid"
                        ? `Paid ${formatDate(
                            payment?.paidDate,
                            "short"
                          )}`
                        : status === "overdue"
                          ? `Overdue ${formatDate(
                              bill.dueDate,
                              "short"
                            )}`
                          : `Due ${formatDate(
                              bill.dueDate,
                              "short"
                            )}`;

                    return `
                      <button
                        type="button"
                        class="bill-row"
                        style="width:100%;text-align:left"
                        onclick="
                          closeCategorySpendingSheet();
                          navigate('detail', {
                            id: '${sourceBillId}',
                            occurrenceDueDate: '${bill.dueDate}',
                            returnRoute: 'insights'
                          });
                        "
                        aria-label="View ${escapeHtml(bill.name)} details"
                      >
                        <div
                          class="bill-icon"
                          style="
                            background:${
                              getBillBrand(bill.name)
                                ? "#fff"
                                : `var(--${category.color})`
                            };
                            color:${
                              getBillBrand(bill.name)
                                ? "#1e1e2e"
                                : "white"
                            };
                            overflow:hidden;
                          "
                        >
                          ${billVisual(bill, 32)}
                        </div>

                        <div class="bill-info">
                          <div class="bill-name">
                            ${escapeHtml(bill.name)}
                          </div>

                          <div
                            class="bill-meta"
                            style="color:${statusColor}"
                          >
                            ${statusLabel}
                          </div>
                        </div>

                        <div
                          style="
                            margin-left:auto;
                            text-align:right;
                            font-weight:800;
                          "
                        >
                          ${formatCurrency(bill.amount)}
                        </div>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon("tray", 44)}
                </div>

                <div class="empty-state-title">
                  No items this month
                </div>

                <div class="empty-state-text">
                  There are no bills in ${escapeHtml(category.label)} for this month.
                </div>
              </div>
            `
        }
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document
      .getElementById("categorySpendingOverlay")
      ?.classList.add("show");

    document
      .getElementById("categorySpendingSheet")
      ?.classList.add("show");
  });
}
function renderInsights() {
  const payments = Store.getPayments();
  const now = new Date();

  const monthBills = getCalendarBillsForMonth(now);

  const paidBillsThisMonth = monthBills.filter((bill) =>
    isOccurrencePaid(bill, new Date(bill.dueDate))
  );

  const unpaidBillsThisMonth = monthBills.filter((bill) =>
    !isOccurrencePaid(bill, new Date(bill.dueDate))
  );

  const overdueBills = unpaidBillsThisMonth.filter(
    (bill) =>
      getOccurrenceStatus(bill, new Date(bill.dueDate)) === "overdue"
  );
const startOfToday = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  12,
  0,
  0,
  0
);

const endOfNextSevenDays = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() + 7,
  12,
  0,
  0,
  0
);

const relevantMonths = [
  new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0),
  new Date(
    endOfNextSevenDays.getFullYear(),
    endOfNextSevenDays.getMonth(),
    1,
    12,
    0,
    0
  ),
];

const upcomingBillsForInsight = relevantMonths
  .flatMap((monthDate) => getCalendarBillsForMonth(monthDate))
  .filter((bill, index, allBills) => {
    const sourceBillId = bill.isOccurrence ? bill.sourceBillId : bill.id;

    const firstMatchIndex = allBills.findIndex((candidate) => {
      const candidateSourceBillId = candidate.isOccurrence
        ? candidate.sourceBillId
        : candidate.id;

      return (
        candidateSourceBillId === sourceBillId &&
        candidate.dueDate === bill.dueDate
      );
    });

    if (index !== firstMatchIndex) return false;

    const rawDueDate = new Date(bill.dueDate);

    if (Number.isNaN(rawDueDate.getTime())) return false;

    const dueDate = new Date(
      rawDueDate.getFullYear(),
      rawDueDate.getMonth(),
      rawDueDate.getDate(),
      12,
      0,
      0,
      0
    );

    return (
      !isOccurrencePaid(bill, rawDueDate) &&
      dueDate >= startOfToday &&
      dueDate <= endOfNextSevenDays
    );
  })
  .sort(
    (a, b) =>
      (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0)
  );

const largestUpcomingBill = upcomingBillsForInsight[0] || null;
  const scheduledThisMonth = monthBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const paidThisMonth = paidBillsThisMonth.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const stillDueThisMonth = unpaidBillsThisMonth.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const overdueTotal = overdueBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const estimatedMonthlyIncome = getTotalMonthlyIncomeEstimate();
  const estimatedRemaining = estimatedMonthlyIncome - scheduledThisMonth;

  const monthlyLimit = getMonthlySpendingLimit();
  const remainingLimit = Math.max(monthlyLimit - paidThisMonth, 0);

  const limitPercent =
    monthlyLimit > 0
      ? Math.min((paidThisMonth / monthlyLimit) * 100, 100)
      : 0;

  const isOverLimit =
    monthlyLimit > 0 && paidThisMonth > monthlyLimit;

  const catTotals = {};

  paidBillsThisMonth.forEach((bill) => {
    const categoryId = bill.category || "other";

    catTotals[categoryId] =
      (catTotals[categoryId] || 0) +
      (parseFloat(bill.amount) || 0);
  });

  const catEntries = Object.entries(catTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const maxCat = catEntries.length ? catEntries[0][1] : 1;

  const monthlyData = [];

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    const paymentsForMonth = payments.filter((payment) => {
      const paidDate = new Date(payment.paidDate);

      return (
        payment.status !== "voided" &&
        paidDate.getMonth() === date.getMonth() &&
        paidDate.getFullYear() === date.getFullYear()
      );
    });

    monthlyData.push({
      label: formatDate(date.toISOString(), "monthShort"),
      amount: paymentsForMonth.reduce(
        (sum, payment) => sum + (parseFloat(payment.amount) || 0),
        0
      ),
    });
  }

  const maxMonthly = Math.max(
    ...monthlyData.map((month) => month.amount),
    1
  );

  const installmentBills = Store.getBills().filter(
    (bill) =>
      Boolean(bill.installmentPlanId) &&
      !bill.archivedAt &&
      !bill.cancelledAt &&
      !bill.paidInFullAt
  );

  const plansById = installmentBills.reduce((plans, bill) => {
    if (!plans[bill.installmentPlanId]) {
      plans[bill.installmentPlanId] = [];
    }

    plans[bill.installmentPlanId].push(bill);
    return plans;
  }, {});

  const activePlans = Object.entries(plansById)
    .map(([planId, installments]) => {
      const sortedInstallments = [...installments].sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
      );

      const unpaidInstallments = sortedInstallments.filter(
        (bill) => !isOccurrencePaid(bill, new Date(bill.dueDate))
      );

      if (!unpaidInstallments.length) return null;

      const nextInstallment = unpaidInstallments[0];
      const provider =
        nextInstallment.installmentProvider || "Payment Plan";

      return {
        id: planId,
        provider,
        remainingBalance: unpaidInstallments.reduce(
          (sum, bill) => sum + (parseFloat(bill.amount) || 0),
          0
        ),
        nextInstallment,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(a.nextInstallment.dueDate) -
        new Date(b.nextInstallment.dueDate)
    );

  const paymentPlansRemaining = activePlans.reduce(
    (sum, plan) => sum + plan.remainingBalance,
    0
  );

  const nextPlanPayment = activePlans[0] || null;

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <div class="nav-title">Insights</div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad content-gap">
        <div class="section-header">This Month</div>

        <div class="stat-row">
          <div class="stat-card">
            <div class="stat-value text-paid">
              ${formatCurrency(estimatedMonthlyIncome)}
            </div>
            <div class="stat-label">Expected Income</div>
          </div>

          <div class="stat-card">
            <div class="stat-value text-upcoming">
              ${formatCurrency(stillDueThisMonth)}
            </div>
            <div class="stat-label">Still Due</div>
          </div>
        </div>

        <div class="card card-pad">
          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:var(--space-3);
            "
          >
            <div>
              <div
                style="
                  font-size:var(--text-xs);
                  color:var(--text-muted);
                  margin-bottom:4px;
                "
              >
                Scheduled
              </div>

              <div style="font-size:var(--text-xl);font-weight:800">
                ${formatCurrency(scheduledThisMonth)}
              </div>
            </div>

            <div style="text-align:right">
              <div
                style="
                  font-size:var(--text-xs);
                  color:var(--text-muted);
                  margin-bottom:4px;
                "
              >
                Paid
              </div>

              <div
                class="text-paid"
                style="font-size:var(--text-xl);font-weight:800"
              >
                ${formatCurrency(paidThisMonth)}
              </div>
            </div>
          </div>

          <div
            class="dashboard-progress-track"
            style="margin-top:var(--space-4)"
          >
            <div
              class="dashboard-progress-fill"
              style="
                width:${
                  scheduledThisMonth > 0
                    ? Math.min(
                        (paidThisMonth / scheduledThisMonth) * 100,
                        100
                      )
                    : 0
                }%
              "
            ></div>
          </div>

          <div
            style="
              display:flex;
              justify-content:space-between;
              margin-top:8px;
              font-size:var(--text-xs);
              color:var(--text-muted);
            "
          >
            <span>
              ${unpaidBillsThisMonth.length}
              bill${unpaidBillsThisMonth.length === 1 ? "" : "s"} remaining
            </span>

            <span>
              ${
                estimatedMonthlyIncome > 0
                  ? `Est. ${formatCurrency(estimatedRemaining)} after bills`
                  : "Add income to see your estimate"
              }
            </span>
          </div>
        </div>

        ${
          activePlans.length
            ? `
              <button
                type="button"
                class="card card-pad"
                onclick="navigate('payment-plans')"
                style="
                  width:100%;
                  text-align:left;
                  cursor:pointer;
                  border:1px solid var(--border);
                "
                aria-label="View payment plans"
              >
                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:var(--space-2);
                  "
                >
                  <div
                    style="
                      width:38px;
                      height:38px;
                      border-radius:12px;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      color:var(--accent);
                      background:var(--accent-soft,rgba(124,92,255,.14));
                    "
                  >
                    ${
                      activePlans.length === 1
                        ? paymentPlanVisual(nextPlanPayment.provider, 38)
                        : svgIcon("calendar", 20)
                    }
                  </div>

                  <div style="min-width:0;flex:1">
                    <div style="font-size:var(--text-base);font-weight:800">
                      Payment Plans
                    </div>

                    <div
                      style="
                        font-size:var(--text-sm);
                        color:var(--text-muted);
                        margin-top:3px;
                      "
                    >
                      ${
                        activePlans.length === 1
                          ? nextPlanPayment.provider
                          : `${activePlans.length} active plans`
                      }
                    </div>
                  </div>

                  <div style="text-align:right">
                    <div style="font-size:var(--text-base);font-weight:800">
                      ${formatCurrency(paymentPlansRemaining)}
                    </div>

                    <div
                      style="
                        font-size:var(--text-xs);
                        color:var(--text-muted);
                        margin-top:3px;
                      "
                    >
                      Next ${formatDate(
                        nextPlanPayment.nextInstallment.dueDate,
                        "short"
                      )}
                    </div>
                  </div>

                  ${svgIcon("chevronRight", 18)}
                </div>
              </button>
            `
            : ""
        }

        ${
          largestUpcomingBill
            ? `
              <button
                type="button"
                class="card card-pad"
                onclick="navigate('detail', {
                  id: '${
                    largestUpcomingBill.isOccurrence
                      ? largestUpcomingBill.sourceBillId
                      : largestUpcomingBill.id
                  }',
                  occurrenceDueDate: '${largestUpcomingBill.dueDate}',
                  returnRoute: 'insights'
                })"
                style="
                  width:100%;
                  text-align:left;
                  cursor:pointer;
                  border:1px solid var(--border);
                "
                aria-label="View largest upcoming bill: ${escapeHtml(
                  largestUpcomingBill.name
                )}"
              >
                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:var(--space-3);
                  "
                >
                  <div
                    style="
                      width:38px;
                      height:38px;
                      min-width:38px;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      overflow:hidden;
                      border-radius:12px;
                      background:${
                        largestUpcomingBill.installmentPlanId
                          ? "transparent"
                          : getBillBrand(largestUpcomingBill.name)
                            ? "#fff"
                            : `var(--${
                                getCategory(largestUpcomingBill.category).color
                              })`
                      };
                      color:${
                        largestUpcomingBill.installmentPlanId ||
                        getBillBrand(largestUpcomingBill.name)
                          ? "#1e1e2e"
                          : "white"
                      };
                    "
                  >
                    ${billOrPaymentPlanVisual(largestUpcomingBill, 38)}
                  </div>

                  <div style="min-width:0;flex:1">
                    <div
                      style="
                        font-size:var(--text-xs);
                        color:var(--text-muted);
                      "
                    >
                      Largest Upcoming Bill
                    </div>

                    <div
                      style="
                        margin-top:3px;
                        font-size:var(--text-base);
                        font-weight:800;
                        overflow:hidden;
                        text-overflow:ellipsis;
                        white-space:nowrap;
                      "
                    >
                      ${escapeHtml(largestUpcomingBill.name)}
                    </div>

                    <div
                      style="
                        margin-top:3px;
                        font-size:var(--text-sm);
                        color:var(--text-muted);
                      "
                    >
                      Due ${formatDate(largestUpcomingBill.dueDate, "short")}
                    </div>
                  </div>

                  <div style="text-align:right">
                    <div style="font-size:var(--text-lg);font-weight:800">
                      ${formatCurrency(largestUpcomingBill.amount)}
                    </div>

                    <div
                      style="
                        margin-top:3px;
                        color:var(--text-muted);
                      "
                    >
                      ${svgIcon("chevronRight", 18)}
                    </div>
                  </div>
                </div>
              </button>
            `
            : ""
        }

        ${
          overdueBills.length
            ? `
              <button
                class="card card-pad"
                type="button"
                onclick="openDashboardStatusSheet('overdue')"
                style="
                  width:100%;
                  text-align:left;
                  cursor:pointer;
                  border-color:color-mix(
                    in srgb,
                    var(--overdue) 38%,
                    var(--border)
                  );
                "
                aria-label="View overdue bills"
              >
                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:var(--space-2);
                    color:var(--overdue);
                  "
                >
                  ${svgIcon("warning", 18)}

                  <strong>
                    ${overdueBills.length}
                    overdue bill${overdueBills.length === 1 ? "" : "s"}
                  </strong>

                  <span style="margin-left:auto;font-weight:800">
                    ${formatCurrency(overdueTotal)}
                  </span>
                </div>
              </button>
            `
            : ""
        }

        ${
          monthlyLimit > 0
            ? `
              <div>
                <div class="section-header">Monthly Spending Limit</div>

                <div class="card card-pad">
                  <div
                    style="
                      display:flex;
                      justify-content:space-between;
                      align-items:baseline;
                      gap:var(--space-3);
                    "
                  >
                    <div>
                      <div
                        style="
                          font-size:var(--text-sm);
                          color:var(--text-muted);
                        "
                      >
                        Spent this month
                      </div>

                      <div
                        style="
                          font-size:var(--text-xl);
                          font-weight:800;
                          color:${
                            isOverLimit
                              ? "var(--overdue)"
                              : "var(--text)"
                          };
                          margin-top:4px;
                        "
                      >
                        ${formatCurrency(paidThisMonth)}
                      </div>
                    </div>

                    <div style="text-align:right">
                      <div
                        style="
                          font-size:var(--text-sm);
                          color:var(--text-muted);
                        "
                      >
                        Limit
                      </div>

                      <div
                        style="
                          font-size:var(--text-xl);
                          font-weight:800;
                          margin-top:4px;
                        "
                      >
                        ${formatCurrency(monthlyLimit)}
                      </div>
                    </div>
                  </div>

                  <div
                    class="dashboard-progress-track"
                    style="margin-top:var(--space-3)"
                  >
                    <div
                      class="dashboard-progress-fill"
                      style="
                        width:${limitPercent}%;
                        background:${
                          isOverLimit
                            ? "var(--overdue)"
                            : "var(--accent)"
                        };
                      "
                    ></div>
                  </div>

                  <div
                    style="
                      margin-top:8px;
                      font-size:var(--text-xs);
                      color:${
                        isOverLimit
                          ? "var(--overdue)"
                          : "var(--text-muted)"
                      };
                    "
                  >
                    ${
                      isOverLimit
                        ? `${formatCurrency(
                            paidThisMonth - monthlyLimit
                          )} over your monthly limit`
                        : `${formatCurrency(remainingLimit)} remaining`
                    }
                  </div>
                </div>
              </div>
            `
            : ""
        }

        <div>
          <div class="section-header">Spending by Category</div>

          <div class="card card-pad">
            ${
              catEntries.length === 0
                ? `
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      ${svgIcon("pieChart", 40)}
                    </div>

                    <div class="empty-state-text">
                      No payments this month yet.
                    </div>
                  </div>
                `
                : catEntries
                    .map(([categoryId, total]) => {
                      const category = getCategory(categoryId);

                      return `
                        <button
                          type="button"
                          class="h-chart-row"
                          onclick="openCategorySpendingSheet('${categoryId}')"
                          aria-label="View ${escapeHtml(
                            category.label
                          )} spending details"
                          style="
                            width:100%;
                            border:0;
                            background:transparent;
                            color:inherit;
                            padding:8px 0;
                            cursor:pointer;
                            text-align:left;
                          "
                        >
                          <div class="h-chart-label">
                            ${escapeHtml(category.label)}
                          </div>

                          <div class="h-chart-bar-bg">
                            <div
                              class="h-chart-bar-fill"
                              style="
                                width:${(total / maxCat) * 100}%;
                                background:var(--${category.color});
                              "
                            ></div>
                          </div>

                          <div class="h-chart-value">
                            ${formatCurrency(total)}
                          </div>
                        </button>
                      `;
                    })
                    .join("")
            }
          </div>
        </div>

        <div>
          <div class="section-header">Monthly Spending · 6 Months</div>

          <div class="card card-pad">
            ${
              monthlyData.every((month) => month.amount === 0)
                ? `
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      ${svgIcon("trendUp", 40)}
                    </div>

                    <div class="empty-state-text">
                      Your spending over time will appear here.
                    </div>
                  </div>
                `
                : `
                  <div class="chart-bar-container">
                    ${monthlyData
                      .map(
                        (month) => `
                          <div class="chart-bar-item">
                            <div class="chart-bar-value">
                              ${
                                month.amount > 0
                                  ? formatCurrency(month.amount).replace(
                                      /\\.\\d+$/,
                                      ""
                                    )
                                  : ""
                              }
                            </div>

                            <div
                              class="chart-bar"
                              style="
                                height:${
                                  (month.amount / maxMonthly) * 100
                                }%;
                                background:var(--accent);
                              "
                            ></div>

                            <div class="chart-bar-label">
                              ${month.label}
                            </div>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
            }
          </div>
        </div>
      </div>
    </div>
  `;
}
function getActivityActionIcon(action) {
  switch (action) {
    case "bill_paid":
      return {
        icon: "checkCircle",
        color: "var(--paid)",
      };
      case 'bill_balance_changed':
  return {
    icon: 'gear',
    color: 'var(--accent)',
  };
    case "payment_voided":
    case "payment_undone":
      return {
        icon: "close",
        color: "var(--overdue)",
      };
      case "bill_updated":
  return {
    icon: "gear",
    color: "var(--accent)",
  };
    case "bill_postponed":
      return {
        icon: "calendar",
        color: "var(--accent)",
      };

    default:
      return {
        icon: "doc",
        color: "var(--text-muted)",
      };
  }
}

function getActivityLabel(action) {
  switch (action) {
    case "billbalancechanged":
      return "Balance changed";
    case "billupdated":
      return "Bill updated";
    case "billpostponed":
      return "Bill postponed";
    case "paymentvoided":
      return "Payment reversed";
    case "paymentundone":
      return "Payment undone";
    case "billpaid":
      return "Bill paid";
    default:
      return "Recent activity";
  }
}

function renderActivity() {
  const entries = Store.getActivityLog()
    .filter(
      (entry) => entry && entry.action && (entry.title || entry.detail)
    )
    .slice()
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    );

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <button
          type="button"
          class="nav-button"
          onclick="navigate('settings')"
          aria-label="Back to Settings"
        >
          ${svgIcon("chevronLeft", 22)}
        </button>

        <div class="nav-title">Activity & Changes</div>

        <div style="width:44px"></div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad content-gap">
        <div class="settings-footer" style="padding:0">
          Your recent payment and bill changes are stored on this device.
        </div>

        ${
          entries.length
            ? `
              <div class="card">
                ${entries
                  .map((entry) => {
                    const appearance = getActivityActionIcon(entry.action);
                    const timestamp = new Date(entry.timestamp);

                    return `
                      <div
                        class="form-row"
                        style="
                          align-items:flex-start;
                          padding-top:14px;
                          padding-bottom:14px;
                        "
                      >
                        <div
                          style="
                            display:flex;
                            align-items:flex-start;
                            gap:14px;
                            width:100%;
                          "
                        >
                          <div
                            style="
                              width:40px;
                              height:40px;
                              min-width:40px;
                              display:flex;
                              align-items:center;
                              justify-content:center;
                              border-radius:12px;
                              margin-top:2px;
                              color:${appearance.color};
                              background:color-mix(
                                in srgb,
                                ${appearance.color} 14%,
                                transparent
                              );
                            "
                          >
                            ${svgIcon(appearance.icon, 18)}
                          </div>

                          <div style="min-width:0; flex:1; padding-top:1px;">
                            <div
                              style="
                                font-size:var(--text-sm);
                                font-weight:800;
                                overflow:hidden;
                                text-overflow:ellipsis;
                                white-space:nowrap;
                              "
                            >
                              ${escapeHtml(
                                entry.title || getActivityLabel(entry.action)
                              )}
                            </div>

                            ${
                              entry.detail
                                ? `
                                  <div
                                    style="
                                      margin-top:4px;
                                      font-size:var(--text-xs);
                                      color:var(--text-muted);
                                      overflow:hidden;
                                      text-overflow:ellipsis;
                                      white-space:nowrap;
                                    "
                                  >
                                    ${escapeHtml(entry.detail)}
                                  </div>
                                `
                                : ""
                            }

                            <div
                              style="
                                margin-top:4px;
                                font-size:var(--text-xs);
                                color:var(--text-muted);
                              "
                            >
                              ${formatDate(
                                timestamp.toISOString(),
                                "short"
                              )} · ${timestamp.toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon("doc", 44)}
                </div>

                <div class="empty-state-title">No activity yet</div>

                <div class="empty-state-text">
                  Payment, reversal, and postponement changes will appear here.
                </div>
              </div>
            `
        }
      </div>
    </div>
  `;
}
function renderSettings() {
  const settings = Store.getSettings();
  const billCount = Store.getBills().length;

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <div class="nav-title">Settings</div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad">
        <div class="settings-section">
          <div class="section-header">Theme</div>

          <div class="card">
            <div
              class="form-row"
              onclick="setTheme('dark')"
              style="cursor:pointer"
            >
              <div class="form-label">Dark</div>
              <div style="flex:1"></div>
              ${
                settings.theme === 'dark' || settings.theme === 'system'
                  ? svgIcon('check', 20)
                  : ''
              }
            </div>

            <div
              class="form-row"
              onclick="setTheme('light')"
              style="cursor:pointer"
            >
              <div class="form-label">Light</div>
              <div style="flex:1"></div>
              ${
                settings.theme === 'light'
                  ? svgIcon('check', 20)
                  : ''
              }
            </div>
          </div>

          <div class="settings-footer">
            Dark mode is recommended for the best experience.
          </div>
        </div>

        <div class="settings-section">
          <div class="section-header">Income Sources</div>

          <div class="card">
            ${
              Store.getIncomeSources().length
                ? Store.getIncomeSources()
                    .map(
                      (source) => `
                        <div
                          class="form-row"
                          onclick="openIncomeSourceForm('${source.id}')"
                          style="cursor:pointer"
                        >
                          <div>
                            <div class="form-label">
                              ${escapeHtml(source.name)}
                            </div>

                            <div
                              style="
                                font-size:var(--text-xs);
                                color:var(--text-muted);
                                margin-top:3px;
                              "
                            >
                              ${escapeHtml(source.frequency)} ·
                              Next: ${formatDate(
                                source.nextPayDate,
                                'short'
                              )}
                            </div>
                          </div>

                          <div style="margin-left:auto;text-align:right">
                            <div style="font-weight:800">
                              ${formatCurrency(source.expectedAmount)}
                            </div>

                            <div
                              style="
                                font-size:var(--text-xs);
                                color:var(--text-muted);
                              "
                            >
                              expected pay
                            </div>
                          </div>
                        </div>
                      `
                    )
                    .join('')
                : `
                    <div
                      class="card-pad"
                      style="
                        font-size:var(--text-sm);
                        color:var(--text-muted);
                      "
                    >
                      Add an income source to plan future paychecks and fund bills.
                    </div>
                  `
            }
          </div>

          <button
            class="bb-outline-pill"
            style="
              width:100%;
              min-height:46px;
              margin-top:var(--space-3);
            "
            onclick="openIncomeSourceForm()"
          >
            <span class="pill-icon">${svgIcon('plus', 18)}</span>
            <span>Add Income Source</span>
          </button>
        </div>

        <div class="settings-section">
          <div class="section-header">Data</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">
                ${svgIcon('internaldrive', 18)}
              </div>

              <div style="flex:1;color:var(--text-muted)">
                ${billCount} bill${billCount === 1 ? '' : 's'} stored on device
              </div>
            </div>

            <div
              class="form-row"
              onclick="navigate('activity')"
              style="cursor:pointer"
            >
              <div class="form-label">
                ${svgIcon('doc', 18)}
              </div>

              <div style="flex:1">
                <div style="font-weight:700">Activity & Changes</div>

                <div
                  style="
                    margin-top:3px;
                    font-size:var(--text-xs);
                    color:var(--text-muted);
                  "
                >
                  Payments, reversals, and bill changes
                </div>
              </div>

              ${svgIcon('chevronRight', 18)}
            </div>

            <div
              class="form-row"
              onclick="exportCSV()"
              style="cursor:pointer"
            >
              <div class="form-label">${svgIcon('export', 18)}</div>

              <div style="flex:1;color:var(--accent)">
                Export Bills CSV
              </div>
            </div>

            <div
              class="form-row"
              onclick="document.getElementById('billImportFile').click()"
              style="cursor:pointer"
            >
              <div class="form-label">${svgIcon('tray', 18)}</div>

              <div style="flex:1;color:var(--accent)">
                Import Bills CSV
              </div>

              <input
                id="billImportFile"
                type="file"
                accept=".csv,text/csv"
                style="display:none"
                onchange="importBillsCSV(event)"
              />
            </div>

                        <div
              class="form-row"
              onclick="clearAllAppData()"
              style="cursor:pointer"
            >
              <div class="form-label">${svgIcon('trash', 18)}</div>

              <div style="flex:1;color:var(--overdue)">
                Clear all app data
              </div>
            </div>
          </div>

          <div class="settings-footer">
            All data is stored on this device only. No cloud, no sync, no account.
          </div>
        </div>

        <div class="settings-section">
          <div class="section-header">About</div>

          <div class="card">
            <div class="about-row">
              <span class="about-label">App Name</span>
              <span class="about-value">Bill Beacon</span>
            </div>

            <div class="about-row">
              <span class="about-label">Version</span>
              <span class="about-value">1.2.0</span>
            </div>

            <div class="about-row">
              <span class="about-label">Storage</span>
              <span class="about-value">Local Offline</span>
            </div>

            <div class="about-row">
              <span class="about-label">Cost</span>
              <span class="about-value text-paid">Free</span>
            </div>

            <div class="about-row">
              <span class="about-label">Ads</span>
              <span class="about-value">None</span>
            </div>

            <div class="about-row">
              <span class="about-label">Account</span>
              <span class="about-value">Not Required</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-header">Install on Home Screen</div>

          <div class="card card-pad">
            <p
              style="
                font-size:var(--text-sm);
                color:var(--text-muted);
                line-height:1.5;
              "
            >
              To install this app on your iPhone home screen:
            </p>

            <ol
              style="
                font-size:var(--text-sm);
                color:var(--text-muted);
                line-height:1.7;
                padding-left:var(--space-5);
                margin-top:var(--space-2);
              "
            >
              <li>Tap the <strong>Share</strong> button in Safari</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong></li>
            </ol>

            <p
              style="
                font-size:var(--text-xs);
                color:var(--text-muted);
                margin-top:var(--space-3);
              "
            >
              The app will work offline after installation. No internet needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;

      row.push(cell.trim());
      cell = '';

      if (row.some(value => value !== '')) {
        rows.push(row);
      }

      row = [];
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());

  if (row.some(value => value !== '')) {
    rows.push(row);
  }

  return rows;
}

function normaliseHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getImportedValue(row, headerMap, names) {
  for (const name of names) {
    const index = headerMap[normaliseHeader(name)];

    if (index !== undefined) {
      return String(row[index] || '').trim();
    }
  }

  return '';
}

function categoryIdFromImport(value) {
  const input = String(value || '').trim().toLowerCase();

  const category = CATEGORIES.find(item =>
    item.id.toLowerCase() === input ||
    item.label.toLowerCase() === input
  );

  return category ? category.id : 'other';
}

function recurrenceFromImport(value) {
  const input = String(value || '').trim().toLowerCase();

  const match = RECURRENCE.find(item => item.toLowerCase() === input);

  return match || 'None';
}

function payCycleFromImport(value, dueDate) {
  const input = String(value || '').trim().toLowerCase();

  if (input === 'first' || input === 'early' || input === 'early cycle') {
    return 'first';
  }

  if (input === 'second' || input === 'late' || input === 'late cycle') {
    return 'second';
  }

  const dueDay = new Date(`${dueDate}T12:00:00`).getDate();

  return dueDay <= 15 ? 'first' : 'second';
}

function paymentMethodFromImport(value) {
  const input = String(value || '').trim().toLowerCase();

  const match = PAYMENT_METHODS.find(
    item => item.toLowerCase() === input
  );

  return match || '';
}

function booleanFromImport(value) {
  return ['yes', 'true', '1', 'on'].includes(
    String(value || '').trim().toLowerCase()
  );
}

function normaliseImportedDate(value) {
  const input = String(value || '').trim();

  if (!input) return '';

  const directMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}T12:00:00.000Z`;
  }

  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString();
}

function importBillsCSV(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const rows = parseCSV(String(reader.result || ''));

      if (rows.length < 2) {
        alert('The file needs a header row and at least one bill.');
        return;
      }

      const headerMap = {};

      rows[0].forEach((header, index) => {
        headerMap[normaliseHeader(header)] = index;
      });

      const requiredHeaders = ['name', 'amount', 'duedate'];
      const missingHeaders = requiredHeaders.filter(
        header => headerMap[header] === undefined
      );

      if (missingHeaders.length) {
        alert(
          `Missing required column(s): ${missingHeaders.join(', ')}.`
        );
        return;
      }

      const importedBills = [];
      const skippedRows = [];

      rows.slice(1).forEach((row, rowIndex) => {
        const name = getImportedValue(row, headerMap, ['Name']);
        const amount = Number(
          getImportedValue(row, headerMap, ['Amount'])
            .replace(/[$,]/g, '')
        );
        const dueDate = normaliseImportedDate(
          getImportedValue(row, headerMap, ['Due Date', 'DueDate'])
        );

        if (!name || !Number.isFinite(amount) || amount < 0 || !dueDate) {
          skippedRows.push(rowIndex + 2);
          return;
        }

        const category = categoryIdFromImport(
          getImportedValue(row, headerMap, ['Category'])
        );

        const recurrence = recurrenceFromImport(
          getImportedValue(row, headerMap, ['Recurrence'])
        );

        const payCycle = payCycleFromImport(
          getImportedValue(row, headerMap, ['Pay Cycle', 'PayCycle']),
          dueDate.slice(0, 10)
        );

        const paymentMethod = paymentMethodFromImport(
          getImportedValue(row, headerMap, ['Payment Method', 'PaymentMethod'])
        );

        importedBills.push({
          id: uid(),
          name,
          amount: amount.toString(),
          dueDate,
          category,
          recurrence,
          payCycle,
          paymentMethod,
          paymentUrl: getImportedValue(row, headerMap, [
            'Payment Link',
            'PaymentLink',
            'Website'
          ]),
          autopay: booleanFromImport(
            getImportedValue(row, headerMap, ['Autopay'])
          ),
          notes: getImportedValue(row, headerMap, ['Notes']),
          reminderOffsets: [7, 1],
          createdAt: new Date().toISOString()
        });
      });

      if (!importedBills.length) {
        alert('No valid bills were found. Check Name, Amount, and Due Date.');
        return;
      }

      const existingBills = Store.getBills();

      const confirmed = confirm(
        `Import ${importedBills.length} bill(s) into this device?` +
        (skippedRows.length
          ? `\\n\\nSkipped row(s): ${skippedRows.join(', ')}.`
          : '')
      );

      if (!confirmed) return;

      Store.saveBills([...existingBills, ...importedBills]);

      event.target.value = '';

      alert(
        `${importedBills.length} bill(s) imported successfully.` +
        (skippedRows.length
          ? `\\nSkipped row(s): ${skippedRows.join(', ')}.`
          : '')
      );

      render();
    } catch (error) {
      console.error(error);
      alert('Unable to import this CSV file. Please use the Bill Beacon template.');
    }
  };

  reader.readAsText(file);
}
function toggleBillDetails() {
  const content = document.getElementById('billDetailsContent');
  const button = document.getElementById('billDetailsToggle');
  const chevron = document.getElementById('billDetailsChevron');

  if (!content || !button || !chevron) return;

  const isOpen = content.classList.toggle('is-open');

  button.setAttribute('aria-expanded', String(isOpen));
  button.querySelector('span').textContent = isOpen
    ? 'Hide Details'
    : 'Show Details';

  chevron.innerHTML = isOpen
    ? svgIcon('chevronLeft', 18)
    : svgIcon('chevronRight', 18);
}
function renderBillDetail() {
  const bill = Store.getBill(routeParams.id);

  if (!bill) {
    navigate("bills");
    return "";
  }

  const occurrenceDueDate = routeParams.occurrenceDueDate || null;
const returnRoute = routeParams.returnRoute || null;
  const detailBill = occurrenceDueDate
    ? {
        ...bill,
        id: getOccurrenceKey(bill.id, occurrenceDueDate),
        sourceBillId: bill.id,
        dueDate: occurrenceDueDate,
        isOccurrence: true
      }
    : {
        ...bill,
        dueDate: getBillOccurrenceDueDate(bill, new Date()),
        isOccurrence: isRecurringBill(bill)
      };

  const referenceDate = new Date(detailBill.dueDate);
  const payment = getActivePaymentForOccurrence(
  detailBill,
  referenceDate
);

const status = payment
  ? 'paid'
  : getOccurrenceStatus(detailBill, referenceDate);
  const cat = getCategory(bill.category);
  const sourceBillId = bill.id;
  const isCalendarOccurrence = Boolean(occurrenceDueDate);

  const backRoute = returnRoute || (
  isCalendarOccurrence ? 'recurring' : 'bills'
);

const backParams = backRoute === 'recurring' && isCalendarOccurrence
  ? `{ month: '${detailBill.dueDate}' }`
  : '{}';

const backAction = `navigate('${backRoute}', ${backParams})`;

const backLabel = backRoute === 'today'
  ? 'Dashboard'
  : backRoute === 'recurring'
    ? 'Recurring'
    : 'Bills';

  const paymentAction = !payment
    ? `
      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:var(--space-2);
          margin-top:var(--space-4);
        "
      >
        <button
          class="btn-primary"
          style="margin:0;min-width:0;padding-left:12px;padding-right:12px"
          onclick="confirmMarkPaidOccurrence(
            '${sourceBillId}',
            '${detailBill.dueDate}'
          )"
        >
          ${svgIcon("checkCircle", 18)}
          Mark as Paid
        </button>

        ${
          isCalendarOccurrence
            ? `
              <button
  class="bb-outline-pill"
  style="
    width:100%;
    min-width:0;
    margin:0;
    padding:0 12px;
  "
  onclick="openPostponeRecurringOccurrenceSheet(
    '${sourceBillId}',
    '${detailBill.originalDueDate || detailBill.dueDate}'
  )"
>
  ${svgIcon('calendar', 18)}
  <span>Postpone</span>
</button>
            `
            : `
              <button
                class="bb-outline-pill"
                style="width:100%;min-width:0;margin:0;padding:0 12px"
                onclick="openPostponeBillSheet('${sourceBillId}')"
              >
                ${svgIcon("calendar", 18)}
                <span>Postpone</span>
              </button>
            `
        }
      </div>
    `
    : `
      <button
        class="bb-outline-pill"
        style="width:100%;min-height:46px;margin-top:var(--space-4);"
        onclick="markBillOccurrenceUnpaid(
          '${sourceBillId}',
          '${detailBill.dueDate}'
        )"
      >
        ${svgIcon("close", 18)}
        <span>Mark as Unpaid</span>
      </button>
    `;

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <button class="nav-button" onclick="${backAction}">
          ${svgIcon("chevronLeft", 22)}
          ${backLabel}
        </button>

        <button class="nav-button" onclick="openBillForm('${sourceBillId}')">
          Edit
        </button>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad content-gap">
        <div class="detail-header">
          <div
            style="
              width:52px;
              height:52px;
              display:flex;
              align-items:center;
              justify-content:center;
              overflow:hidden;
              border-radius:14px;
              margin:0 auto var(--space-2);
              background:${
                getBillBrand(bill.name)
                  ? "white"
                  : `var(--${cat.color})`
              };
              color:${
                getBillBrand(bill.name) ? "#1e1e2e" : "white"
              };
            "
          >
            ${billVisual(bill, 46)}
          </div>

          <div style="flex:1;min-width:0;margin-left:12px;">
            <div
              style="
                font-size:var(--text-xl);
                font-weight:800;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
              "
            >
              ${escapeHtml(bill.name)}
            </div>

            <div
              style="
                font-size:var(--text-sm);
                color:var(--text-muted);
                margin-top:4px;
              "
            >
              ${cat.label}
            </div>
          </div>

          <div class="detail-amount">
            ${formatCurrency(bill.amount)}
          </div>

          <div class="detail-status">
            <span
              class="status-pill"
              style="
                background:var(--${
                  status === "paid"
                    ? "paid-bg"
                    : status === "overdue"
                      ? "overdue-bg"
                      : "upcoming-bg"
                });
                color:var(--${
                  status === "paid"
                    ? "paid"
                    : status === "overdue"
                      ? "overdue"
                      : "upcoming"
                });
              "
            >
              ${
                status === "paid"
                  ? svgIcon("checkCircle", 12)
                  : status === "overdue"
                    ? svgIcon("warning", 12)
                    : svgIcon("clock", 12)
              }

              ${status === 'paid'
  ? `Paid ${formatDate(payment.paidDate, 'short')}`
  : relativeDue(detailBill.dueDate).charAt(0).toUpperCase() +
    relativeDue(detailBill.dueDate).slice(1)
}
            </span>
          </div>

          ${
            isCalendarOccurrence
              ? `
                <div
                  style="
                    width:100%;
                    margin-top:var(--space-2);
                    font-size:var(--text-sm);
                    color:var(--text-muted);
                  "
                >
                  Occurrence due ${formatDate(detailBill.dueDate, "full")}
                </div>
              `
              : ""
          }
        </div>

        <div>
          ${
            safePaymentUrl(bill.paymentUrl)
              ? `
                <button
                  class="btn-primary"
                  style="width:100%;margin-top:var(--space-4);"
                  onclick="openPaymentPage('${sourceBillId}')"
                >
                  Make a Payment
                </button>
              `
              : `
                <button
                  class="btn-secondary"
                  style="width:100%;margin-top:var(--space-4);"
                  onclick="openPaymentLinkPopup('${sourceBillId}')"
                >
                  Add Payment Link
                </button>
              `
          }
        </div>

        ${paymentAction}

        <button
          type="button"
          class="bb-outline-pill bill-show-details-button"
          style="
            width:100%;
            min-height:46px;
            margin-top:var(--space-3);
          "
          onclick="openBillDetailsSheet('${sourceBillId}')"
        >
          <span class="pill-icon">${svgIcon("doc", 20)}</span>
          <span>Show Details</span>
          <span class="pill-chevron">
            ${svgIcon("chevronRight", 18)}
          </span>
        </button>
      </div>
    </div>
  `;
}

function detailRow(label, value) {
  return `
    <div class="form-row">
      <div class="form-label">${label}</div>
      <div style="flex:1;text-align:right;font-weight:500">${escapeHtml(value)}</div>
    </div>
  `;
}

// ====================================
// COMPONENTS
// ====================================
function getBillScheduleLabel(bill) {
  const dueDate = new Date(bill.dueDate);
  const day = bill.dueDay || dueDate.getDate();

  const ordinal = (value) => {
    const mod100 = value % 100;

    if (mod100 >= 11 && mod100 <= 13) {
      return `${value}th`;
    }

    switch (value % 10) {
      case 1:
        return `${value}st`;
      case 2:
        return `${value}nd`;
      case 3:
        return `${value}rd`;
      default:
        return `${value}th`;
    }
  };

  switch (bill.recurrence) {
    case 'Weekly':
      return `Repeats weekly`;

    case 'Monthly':
      return `Due on the ${ordinal(day)} of each month`;

    case 'Quarterly':
      return `Repeats every 3 months`;

    case 'Yearly':
      return `Repeats yearly`;

    default:
      return `Due ${formatDate(bill.dueDate, 'full')}`;
  }
}

function billRow(bill, clickable = false) {
  const cat = getCategory(bill.category);
  const payCycleLabel = getPayCycleLabel(bill);
  const dueDate = new Date(bill.dueDate);
  const dueDay = bill.recurrence === 'Monthly'
    ? getMonthlyDueDay(bill)
    : dueDate.getDate();

  const ordinal = (day) => {
    const mod100 = day % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
    switch (day % 10) {
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
    }
  };

  const scheduleText =
    bill.recurrence && bill.recurrence !== 'None'
      ? bill.recurrence === 'Monthly'
        ? `Due on the ${ordinal(dueDay)} of each month`
        : getBillScheduleLabel(bill)
      : `Due on ${formatDate(bill.dueDate, 'full')}`;
  const payCycleClass =
    bill.payCycle === 'first' ||
    (!bill.payCycle && dueDay <= 15)
      ? 'pay-cycle-first'
      : 'pay-cycle-second';

  // Occurrences have their own due date but use the source template ID.
  const detailBillId = bill.isOccurrence
    ? bill.sourceBillId
    : bill.id;

  const detailDueDate = bill.isOccurrence
    ? bill.dueDate
    : '';
  const quickActionArgs = bill.isOccurrence
    ? `'${detailBillId}', '${detailDueDate}'`
    : `'${detailBillId}'`;
  const rowClick = '';

  return `
    <div class="bill-row">
      <div
        class="bill-icon"
        style="
          background:${getBillBrand(bill.name) ? '#fff' : `var(--${cat.color})`};
          color:${getBillBrand(bill.name) ? '#1e1e2e' : 'white'};
          padding:${getBillBrand(bill.name) ? '3px' : '0'};
          overflow:hidden;
        "
      >
        ${billVisual(bill, 32)}
      </div>

      <div class="bill-info">
        <div class="bill-name">
          ${escapeHtml(bill.name)}
        </div>

        <div class="bill-meta-row">
          <div class="bill-meta">
            ${scheduleText}
          </div>

          <span class="pay-cycle-pill ${payCycleClass}">
            ${payCycleLabel}
          </span>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:6px">
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <div class="bill-amount">
            ${formatCurrency(bill.amount)}
          </div>
        </div>

        <button
          type="button"
          class="bill-more-button"
          aria-label="More options for ${escapeHtml(bill.name)}"
          title="More options"
          onclick="
  event.stopPropagation();
  ${
    bill.isOccurrence
      ? `navigate('detail', {
          id: '${detailBillId}',
          occurrenceDueDate: '${detailDueDate}',
          returnRoute: 'recurring'
        })`
      : `openBillQuickActions('${detailBillId}')`
  }
"
        >
          ${svgIcon('moreVertical', 22)}
        </button>
      </div>
    </div>
  `;
}
function fab() {
  return `
    <button class="fab" onclick="openBillForm()">
      ${svgIcon('plus', 26)}
    </button>
  `;
}

function tabBar() {
  const tabs = [
    { id: 'today', label: 'Dashboard', icon: 'home' },
    { id: 'recurring', label: 'Recurring', icon: 'calendar' },
    { id: 'bills', label: 'Bills', icon: 'tray' },
    { id: 'insights', label: 'Insights', icon: 'chart' },
    { id: 'settings', label: 'Settings', icon: 'gear' },
  ];

  return `
    <div class="tab-bar">
      ${tabs.map(tab => `
        <button class="tab-item ${currentRoute === tab.id ? 'active' : ''}" onclick="navigate('${tab.id}')">
          <div class="tab-icon">${svgIcon(tab.icon, 24)}</div>
          <span>${tab.label}</span>
        </button>
      `).join('')}
    </div>
  `;
}

// ====================================
// BILL FORM (Bottom Sheet)
// ====================================

let editingBillId = null;
function openAddMenu() {
  const menuHtml = `
    <div class="sheet-overlay show" id="addMenuOverlay" onclick="closeAddMenu()"></div>

    <div class="sheet show" id="addMenuSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeAddMenu()">Cancel</button>
        <div class="sheet-title">Add Recurring</div>
        <div style="width:54px"></div>
      </div>

      <div class="sheet-body">
        <div class="settings-footer" style="padding:0 0 var(--space-4)">
          Choose what you want to track.
        </div>

        <button
          class="btn-primary"
          onclick="closeAddMenu(); openBillForm()"
        >
          ${svgIcon('plus', 20)}
          Add bill
        </button>

        <button
          class="bb-outline-pill"
          style="
            width:100%;
            min-height:46px;
            margin-top:var(--space-3);
          "
          onclick="closeAddMenu(); openInstallmentPlanForm()"
        >
          <span class="pill-icon">${svgIcon('calendar', 18)}</span>
          <span>Add Payment Plan</span>
          <span class="pill-chevron">${svgIcon('chevronRight', 18)}</span>
        </button>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.id = 'addMenuContainer';
  container.innerHTML = menuHtml;

  document.body.appendChild(container);
}

function closeAddMenu() {
  document.getElementById('addMenuContainer')?.remove();
}
window.openCalendarAddMenu = function(dateString) {
  const selectedDate = dateString.split('T')[0];

  const container = document.createElement('div');
  container.id = 'calendarAddMenuContainer';

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="calendarAddMenuOverlay"
      onclick="closeCalendarAddMenu()"
    ></div>

    <div class="sheet" id="calendarAddMenuSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeCalendarAddMenu()">
          Cancel
        </button>

        <div class="sheet-title">Add Recurring</div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body">
        <div
          class="settings-footer"
          style="padding:0 0 var(--space-4)"
        >
          Choose what you want to track.
        </div>

        <button
          class="btn-primary"
          onclick="closeCalendarAddMenu(); openBillForm(null, '${selectedDate}')"
        >
          ${svgIcon('plus', 20)}
          Add bill
        </button>

        <button
  class="bb-outline-pill"
  style="
    width:100%;
    min-height:46px;
    margin-top:var(--space-3);
  "
  onclick="closeAddMenu(); openInstallmentPlanForm()"
>
  <span class="pill-icon">${svgIcon('calendar', 18)}</span>
  <span>Add Payment Plan</span>
  <span class="pill-chevron">${svgIcon('chevronRight', 18)}</span>
</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document.getElementById('calendarAddMenuOverlay')?.classList.add('show');
    document.getElementById('calendarAddMenuSheet')?.classList.add('show');
  });
};

window.closeCalendarAddMenu = function() {
  document.getElementById('calendarAddMenuOverlay')?.classList.remove('show');
  document.getElementById('calendarAddMenuSheet')?.classList.remove('show');

  setTimeout(() => {
    document.getElementById('calendarAddMenuContainer')?.remove();
  }, 300);
};

let editingIncomeSourceId = null;

function openIncomeSourceForm(sourceId = null) {
  editingIncomeSourceId = sourceId;

  const source = sourceId
    ? Store.getIncomeSources().find(item => item.id === sourceId)
    : null;

  const today = new Date().toISOString().split('T')[0];

  const sheetHtml = `
    <div
      class="sheet-overlay show"
      id="incomeSourceOverlay"
      onclick="closeIncomeSourceForm()"
    ></div>

    <div class="sheet show" id="incomeSourceSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeIncomeSourceForm()">
          Cancel
        </button>

        <div class="sheet-title">
          ${source ? 'Edit Income' : 'Income Source'}
        </div>

        <button
          class="nav-button"
          onclick="saveIncomeSource()"
          style="font-weight: 700;"
        >
          Save
        </button>
      </div>

      <div class="sheet-body content-gap">
        <div>
          <div class="section-header">Income Details</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">Name</div>

              <input
                class="form-input"
                id="incomeSourceName"
                type="text"
                placeholder="Military pay"
                value="${source ? escapeHtml(source.name) : ''}"
                style="text-align: left;"
              >
            </div>

            <div class="form-row">
              <div class="form-label">Expected pay</div>

              <input
                class="form-input"
                id="incomeSourceAmount"
                type="number"
                inputmode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value="${source ? source.expectedAmount : ''}"
              >
            </div>
          </div>
        </div>

        <div>
          <div class="section-header">Schedule</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">Frequency</div>

              <select class="form-select" id="incomeSourceFrequency">
                ${INCOME_FREQUENCIES.map(frequency => `
                  <option
                    value="${frequency}"
                    ${source?.frequency === frequency ? 'selected' : ''}
                  >
                    ${frequency}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-row">
              <div class="form-label">Next payday</div>

              <input
                class="form-input"
                id="incomeSourceNextPayDate"
                type="date"
                value="${source ? source.nextPayDate.split('T')[0] : today}"
              >
            </div>
          </div>
        </div>

        <div class="settings-footer">
          Expected pay is used for planning. You can record a different actual amount for each paycheck later.
        </div>

        ${source ? `
          <button
            class="btn-danger"
            onclick="confirmDeleteIncomeSource('${source.id}')"
          >
            ${svgIcon('trash', 16)}
            Delete income source
          </button>
        ` : ''}
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.id = 'incomeSourceContainer';
  container.innerHTML = sheetHtml;
 document.body.appendChild(container);
}

function closeIncomeSourceForm() {
  document.getElementById('incomeSourceContainer')?.remove();
}
function saveIncomeSource() {
  const name = document.getElementById('incomeSourceName').value.trim();

  const expectedAmount = Number(
    document.getElementById('incomeSourceAmount').value
  );

  const frequency = document.getElementById('incomeSourceFrequency').value;

  const nextPayDate = document.getElementById(
    'incomeSourceNextPayDate'
  ).value;

  if (!name) {
    alert('Please enter an income source name.');
    return;
  }

  if (Number.isNaN(expectedAmount) || expectedAmount < 0) {
    alert('Please enter a valid expected pay amount.');
    return;
  }

  if (!nextPayDate) {
    alert('Please choose the next payday.');
    return;
  }

  const data = {
    name,
    expectedAmount,
    frequency,
    nextPayDate: new Date(`${nextPayDate}T12:00:00`).toISOString(),
  };

  if (editingIncomeSourceId) {
    Store.updateIncomeSource(editingIncomeSourceId, data);
  } else {
    Store.addIncomeSource({
      id: uid(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }



  closeIncomeSourceForm();
  render();
}

function confirmDeleteIncomeSource(id) {
  if (!confirm('Delete this income source?')) return;

  Store.deleteIncomeSource(id);
  closeIncomeSourceForm();
  render();
}
function openBillQuickActions(billId) {
  const bill = Store.getBill(billId);

  if (!bill) return;

  const dueDate = new Date(bill.dueDate);

  const isPaid = isOccurrencePaid(bill, dueDate);

  const sheetHtml = `
    <div
      class="sheet-overlay"
      id="billQuickActionsOverlay"
      onclick="closeBillQuickActions()"
    ></div>

    <div class="sheet" id="billQuickActionsSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button
          class="nav-button"
          onclick="closeBillQuickActions()"
        >
          Cancel
        </button>

        <div class="sheet-title">Bill Actions</div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body">
        <div class="bill-sheet-header">
          <div class="bill-sheet-heading">
            <div class="bill-sheet-title">
              ${escapeHtml(bill.name)}
            </div>

            <div class="bill-sheet-subtitle">
              ${formatCurrency(bill.amount)}
              · Due ${formatDate(bill.dueDate, "short")}
            </div>
          </div>
        </div>

        <div class="bill-sheet-actions">
          <button
            class="bill-sheet-action"
            onclick="
              closeBillQuickActions();
              navigate('detail', { id: '${bill.id}' });
            "
          >
            <span>${svgIcon('doc', 20)}</span>
            <span>Bill Details</span>
            <span>${svgIcon('chevronRight', 18)}</span>
          </button>

          <button
            class="bill-sheet-action"
            onclick="
              closeBillQuickActions();
              openBillForm('${bill.id}');
            "
          >
            <span>${svgIcon('gear', 20)}</span>
            <span>Edit Details</span>
            <span>${svgIcon('chevronRight', 18)}</span>
          </button>

          ${
  !isPaid
    ? `
      <button
        class="bill-sheet-action"
        onclick="
          closeBillQuickActions();
          ${
            isRecurringBill(bill)
              ? `openPostponeRecurringOccurrenceSheet(
                  '${bill.id}',
                  '${getOccurrenceDueDate(
                    bill,
                    new Date().getFullYear(),
                    new Date().getMonth()
                  )}'
                );`
              : `openPostponeBillSheet('${bill.id}');`
          }
        "
      >
        <span>${svgIcon('calendar', 20)}</span>
        <span>Postpone</span>
        <span>${svgIcon('chevronRight', 18)}</span>
      </button>
    `
    : ''
}
          <button
            class="bill-sheet-action bill-sheet-action-danger"
            onclick="
              closeBillQuickActions();
              openBillActionRemove('${bill.id}');
            "
          >
            <span>${svgIcon('trash', 20)}</span>
            <span>Remove from list</span>
            <span>${svgIcon('chevronRight', 18)}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('billQuickActionsContainer')?.remove();

  const container = document.createElement('div');
  container.id = 'billQuickActionsContainer';
  container.innerHTML = sheetHtml;

  document.body.appendChild(container);

  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document
      .getElementById('billQuickActionsOverlay')
      ?.classList.add('show');

    document
      .getElementById('billQuickActionsSheet')
      ?.classList.add('show');
  });
}
function closeBillQuickActions(callback) {
  const overlay = document.getElementById('billQuickActionsOverlay');
  const sheet = document.getElementById('billQuickActionsSheet');

  overlay?.classList.remove('show');
  sheet?.classList.remove('show');

  setTimeout(() => {
    document.getElementById('billQuickActionsContainer')?.remove();
    unlockBackgroundScroll();

    if (typeof callback === 'function') {
      callback();
    }
  }, 300);
}

window.openBillActionEdit = function (billId) {
  closeBillQuickActions(() => {
    openBillForm(billId);
  });
};

window.openBillActionHistory = function (billId) {
  closeBillQuickActions(() => {
    openBillDetailsSheet(billId);
  });
};

window.openBillActionRemove = function (billId) {
  closeBillQuickActions(() => {
    confirmDeleteBill(billId);
  });
};
function closeBillDetailsSheet() {
  document.getElementById('billDetailsContainer')?.remove();
}

function openBillDetailsSheet(billId) {
  const bill = Store.getBill(billId);

  if (!bill) return;

  const category = getCategory(bill.category);

  // Important: includes both active and voided payments.
  const payments = Store.getPaymentsForBill(billId).sort((a, b) => {
    const aDate = new Date(
      a.voidedAt || a.paidDate || a.createdAt || 0
    ).getTime();

    const bDate = new Date(
      b.voidedAt || b.paidDate || b.createdAt || 0
    ).getTime();

    return bDate - aDate;
  });

  const paymentHistoryHtml = payments.length
    ? `
      <div class="section-header">Payment History</div>

      <div class="card" style="margin-bottom:18px">
        ${payments
          .map((payment) => {
            const isVoided = payment.status === "voided";

            const paidDate = payment.paidDate;
            const voidedDate = payment.voidedAt || payment.updatedAt;

            return `
              <div
                class="bill-row"
                style="${
                  isVoided
                    ? "opacity:.62; background:rgba(255,255,255,.02)"
                    : ""
                }"
              >
                <div
                  class="bill-icon"
                  style="
                    background:${
                      isVoided ? "var(--surface-2)" : "var(--paid-bg)"
                    };
                    color:${
                      isVoided ? "var(--text-muted)" : "var(--paid)"
                    };
                  "
                >
                  ${svgIcon(isVoided ? "close" : "checkCircle", 20)}
                </div>

                <div class="bill-info">
                  <div
                    class="bill-name"
                    style="${
                      isVoided
                        ? "text-decoration:line-through; color:var(--text-muted)"
                        : ""
                    }"
                  >
                    ${isVoided ? "Payment voided" : "Payment made"}
                  </div>

                  <div
                    class="bill-meta"
                    style="color:${
                      isVoided ? "var(--text-muted)" : "var(--paid)"
                    }"
                  >
                    ${
                      isVoided
                        ? `Originally paid ${formatDate(
                            paidDate,
                            "full"
                          )}${
                            voidedDate
                              ? ` · Voided ${formatDate(voidedDate, "full")}`
                              : ""
                          }`
                        : `Paid ${formatDate(paidDate, "full")}`
                    }
                  </div>
                </div>

                <div
                  class="bill-amount"
                  style="${
                    isVoided
                      ? "color:var(--text-muted); text-decoration:line-through"
                      : "color:var(--paid)"
                  }"
                >
                  ${formatCurrency(payment.amount)}

                  <div
                    style="
                      margin-top:3px;
                      font-size:var(--text-xs);
                      font-weight:800;
                      color:${
                        isVoided ? "var(--overdue)" : "var(--paid)"
                      };
                    "
                  >
                    ${isVoided ? "VOIDED" : "PAID"}
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `
    : `
      <div class="section-header">Payment History</div>

      <div class="card" style="margin-bottom:18px">
        <div class="settings-footer">No payments recorded yet.</div>
      </div>
    `;

  const postponementHistoryHtml =
    Array.isArray(bill.postponementHistory) &&
    bill.postponementHistory.length
      ? `
        <div class="section-header">Postponement History</div>

        <div class="card" style="margin-bottom:18px">
          ${bill.postponementHistory
            .slice()
            .reverse()
            .map(
              (item) => `
                <div class="form-row">
                  <div>
                    <div class="form-label">
                      ${formatDate(item.originalDueDate, "short")} →
                      ${formatDate(item.postponedTo, "short")}
                    </div>

                    <div
                      style="
                        font-size:var(--text-xs);
                        color:var(--text-muted);
                        margin-top:3px;
                      "
                    >
                      Postponed ${formatDate(item.postponedAt, "full")}
                    </div>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      `
      : "";

  const sheetHtml = `
    <div
  class="sheet-overlay show"
  id="billDetailsOverlay"
  onclick="closeBillDetailsSheet()"
  style="transition:none"
></div>

    <div
  class="bill-details-sheet"
  id="billDetailsSheet"
  style="
    position:fixed;
    top:0;
    right:0;
    bottom:0;
    left:0;
    width:100vw;
    height:100dvh;
    max-width:none;
    max-height:none;
    margin:0;
    padding:0;
    border:0;
    border-radius:0;
    background:var(--bg);
    transform:none;
    transition:none;
    z-index:1000;
    overflow-y:auto;
    overscroll-behavior:contain;
  "
>
      <div
  style="
    position:sticky;
    top:0;
    z-index:3;
    height:calc(56px + env(safe-area-inset-top));
    padding-top:env(safe-area-inset-top);
    display:flex;
    align-items:center;
    justify-content:center;
    background:var(--bg);
  "
>
  <div
    style="
      font-size:var(--text-lg);
      font-weight:800;
      line-height:56px;
    "
  >
    Bill Details
  </div>

  <button
    type="button"
    onclick="closeBillDetailsSheet()"
    aria-label="Close bill details"
    style="
      position:absolute;
      top:env(safe-area-inset-top);
      right:12px;
      width:56px;
      height:56px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:0;
      border:0;
      background:transparent;
      color:var(--text);
      cursor:pointer;
      -webkit-tap-highlight-color:transparent;
    "
  >
    ${svgIcon('close', 24)}
  </button>
</div>
      <div class="sheet-body">
        <div class="bill-sheet-header bill-details-sheet-header">
          <div
            class="bill-sheet-logo"
            style="background:${
              getBillBrand(bill.name)
                ? "#fff"
                : `var(--${category.color})`
            }"
          >
            ${billVisual(bill, 52)}
          </div>

          <div class="bill-sheet-heading">
            <div class="bill-sheet-title">${escapeHtml(bill.name)}</div>

            <div class="bill-sheet-subtitle">
              ${formatCurrency(bill.amount)} · ${getPayCycleLabel(bill)}
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom:18px">
          ${detailRow(
  bill.recurrence && bill.recurrence !== 'None' ? 'Schedule' : 'Due Date',
  getBillScheduleLabel(bill)
)}
          ${detailRow("Pay Cycle", getPayCycleLabel(bill))}
          ${detailRow("Category", category.label)}
          ${detailRow("Repeats", bill.recurrence)}

          ${
            bill.paymentMethod
              ? detailRow("Payment Method", bill.paymentMethod)
              : ""
          }

          ${detailRow("Autopay", bill.autopay ? "On" : "Off")}

          ${
            bill.notes
              ? detailRow("Notes", escapeHtml(bill.notes))
              : ""
          }
        </div>

        ${postponementHistoryHtml}

        ${paymentHistoryHtml}
      </div>
    </div>
  `;

  const container = document.createElement("div");
  container.id = "billDetailsContainer";
  container.innerHTML = sheetHtml;

  document.body.appendChild(container);
}
function openBillForm(billId = null, selectedDate = null) {
  editingBillId = billId;

  const bill = billId ? Store.getBill(billId) : null;
  const today = new Date().toISOString().split('T')[0];

  const dueDate = bill
    ? bill.dueDate.split('T')[0]
    : (selectedDate || today);

  const defaultPayCycle = bill?.payCycle || (
    new Date(`${dueDate}T12:00:00`).getDate() <= 15
      ? 'first'
      : 'second'
  );

  const selectedReminders = bill
    ? (bill.reminderOffsets || [7, 1])
    : [7, 1];

  const currentDueDay = bill?.dueDay
    ? Number(bill.dueDay)
    : new Date(`${dueDate}T12:00:00`).getDate();

  const sheetHtml = `
    <div class="sheet-overlay" id="sheetOverlay" onclick="closeBillForm()"></div>

    <div class="sheet" id="billSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeBillForm()">Cancel</button>

        <div class="sheet-title">${bill ? 'Edit Bill' : 'New Bill'}</div>

        <button
          class="nav-button"
          onclick="saveBill()"
          style="font-weight:700"
        >
          Save
        </button>
      </div>

      <div class="sheet-body">
        <div class="content-gap">

          <div>
            <div class="section-header">Bill Details</div>

            <div class="card">
              <div class="form-row">
                <div class="form-label">Name</div>

                <input
                  class="form-input"
                  id="billName"
                  type="text"
                  placeholder="Electricity"
                  value="${bill ? escapeHtml(bill.name) : ''}"
                  style="text-align:left"
                >
              </div>

              <div class="form-row">
                <div class="form-label">Amount</div>

                <input
                  class="form-input"
                  id="billAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value="${bill ? bill.amount : ''}"
                >
              </div>
            </div>
          </div>

          <div>
            <div class="section-header">Category</div>

            <div class="card">
              <select
                class="form-select"
                id="billCategory"
                style="width:100%;height:48px;padding:0 var(--space-4);border:none;background:transparent;font-size:var(--text-base);-webkit-appearance:none"
              >
                ${CATEGORIES.map(category => `
                  <option
                    value="${category.id}"
                    ${bill && bill.category === category.id ? 'selected' : ''}
                  >
                    ${category.label}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div>
            <div class="section-header">Due Date & Recurrence</div>

            <div class="card">

            <div class="form-row">
                <div class="form-label">Repeats</div>

                <select
                  class="form-select"
                  id="billRecurrence"
                  onchange="updateBillDueDateField()"
                >
                  ${RECURRENCE.map(recurrence => `
                    <option
                      value="${recurrence}"
                      ${bill && bill.recurrence === recurrence ? 'selected' : ''}
                    >
                      ${recurrence}
                    </option>
                  `).join('')}
                </select>
              </div>
              <div class="form-row">
                <div class="form-label" id="billDueDateLabel">Due Date</div>

                <input
                  class="form-input"
                  id="billDueDate"
                  type="date"
                  value="${dueDate}"
                >

                <select
                  class="form-select"
                  id="billDueDay"
                  style="display:none"
                >
                  ${Array.from({ length: 31 }, (_, index) => {
                    const day = index + 1;

                    return `
                      <option
                        value="${day}"
                        ${currentDueDay === day ? 'selected' : ''}
                      >
                        ${day}
                      </option>
                    `;
                  }).join('')}
                </select>
              </div>
              
              <div class="form-row">
                <div class="form-label">Pay Cycle</div>

                <select class="form-select" id="billPayCycle">
                  <option
                    value="first"
                    ${defaultPayCycle === 'first' ? 'selected' : ''}
                  >
                    Early Cycle
                  </option>

                  <option
                    value="second"
                    ${defaultPayCycle === 'second' ? 'selected' : ''}
                  >
                    Late Cycle
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div class="section-header">Payment Method</div>

            <div class="card">
              <select
                class="form-select"
                id="billPaymentMethod"
                style="width:100%;height:48px;padding:0 var(--space-4);border:none;background:transparent;font-size:var(--text-base);-webkit-appearance:none"
              >
                ${PAYMENT_METHODS.map(method => `
                  <option
                    value="${method}"
                    ${bill && bill.paymentMethod === method ? 'selected' : ''}
                  >
                    ${method || 'None'}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div>
            <div class="section-header">Payment Link</div>

            <div class="card">
              <div class="form-row">
                <div class="form-label">Website</div>

                <input
                  class="form-input"
                  id="paymentUrl"
                  type="text"
                  inputmode="url"
                  placeholder="provider.com/pay"
                  value="${bill ? escapeHtml(bill.paymentUrl || '') : ''}"
                  style="text-align:left"
                >
              </div>
            </div>
          </div>

          <div>
            <div class="section-header">Autopay</div>

            <div class="card">
              <div class="form-row">
                <div class="form-label">Pay automatically</div>
                <div style="flex:1"></div>

                <label class="toggle">
                  <input
                    type="checkbox"
                    id="billAutopay"
                    ${bill && bill.autopay ? 'checked' : ''}
                  >

                  <div class="toggle-track">
                    <div class="toggle-thumb"></div>
                  </div>
                </label>
              </div>
            </div>

            <div class="settings-footer">
              Autopay bills are paid automatically by your bank or card.
              You will still receive a reminder before the payment date.
            </div>
          </div>

          <div>
            <div class="section-header">Reminders</div>

            <div class="card">
              ${REMINDER_OFFSETS.map(reminder => `
                <div class="form-row">
                  <div class="form-label">${reminder.label}</div>
                  <div style="flex:1"></div>

                  <label class="toggle">
                    <input
                      type="checkbox"
                      class="reminder-toggle"
                      data-days="${reminder.days}"
                      ${selectedReminders.includes(reminder.days) ? 'checked' : ''}
                    >

                    <div class="toggle-track">
                      <div class="toggle-thumb"></div>
                    </div>
                  </label>
                </div>
              `).join('')}
            </div>

            <div class="settings-footer">
              Reminders appear when you open the app. Enable notifications
              in Safari for best results.
            </div>
          </div>

          <div>
            <div class="section-header">Notes</div>

            <div class="card">
              <textarea
                class="form-textarea"
                id="billNotes"
                placeholder="Optional notes"
              >${bill ? escapeHtml(bill.notes || '') : ''}</textarea>
            </div>
          </div>

          ${bill ? `
            <button
              class="btn-danger"
              onclick="confirmDeleteBill('${bill.id}', true)"
            >
              ${svgIcon('trash', 16)}
              Archive Bill
            </button>
          ` : ''}

        </div>
      </div>
    </div>
  `;

  const sheetContainer = document.createElement('div');
  sheetContainer.id = 'sheetContainer';
  sheetContainer.innerHTML = sheetHtml;
  document.body.appendChild(sheetContainer);

  updateBillDueDateField();

  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document.getElementById('sheetOverlay')?.classList.add('show');
    document.getElementById('billSheet')?.classList.add('show');
  });
}


function updateBillDueDateField() {
  const recurrenceSelect = document.getElementById('billRecurrence');
  const dueDateInput = document.getElementById('billDueDate');
  const dueDaySelect = document.getElementById('billDueDay');
  const dueDateLabel = document.getElementById('billDueDateLabel');

  if (
    !recurrenceSelect ||
    !dueDateInput ||
    !dueDaySelect ||
    !dueDateLabel
  ) {
    return;
  }

  const isMonthly = recurrenceSelect.value === 'Monthly';

  dueDateInput.style.display = isMonthly ? 'none' : '';
  dueDaySelect.style.display = isMonthly ? '' : 'none';
  dueDateLabel.textContent = isMonthly ? 'Due Day' : 'Due Date';
}


function closeBillForm() {
  const overlay = document.getElementById('sheetOverlay');
  const sheet = document.getElementById('billSheet');

  if (overlay) overlay.classList.remove('show');
  if (sheet) sheet.classList.remove('show');

  setTimeout(() => {
    document.getElementById('sheetContainer')?.remove();
    unlockBackgroundScroll();
  }, 300);

  editingBillId = null;
}
function openPaymentLinkPopup(billId) {
  const bill = Store.getBill(billId);

  if (!bill) {
    alert('Bill not found.');
    return;
  }

  const container = document.createElement('div');
  container.id = 'paymentLinkPopupContainer';

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="paymentLinkPopupOverlay"
      onclick="closePaymentLinkPopup()"
    ></div>

    <div class="sheet" id="paymentLinkPopupSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closePaymentLinkPopup()">
          Cancel
        </button>

        <div class="sheet-title">Payment Link</div>

        <button
          class="nav-button"
          onclick="savePaymentLinkPopup('${bill.id}')"
          style="font-weight:700"
        >
          Save
        </button>
      </div>

      <div class="sheet-body">
        <div class="section-header">${escapeHtml(bill.name)}</div>

        <div class="card">
          <div class="form-row">
            <div class="form-label">Website</div>

            <input
              class="form-input"
              id="quickPaymentUrl"
              type="text"
              inputmode="url"
              placeholder="provider.com/pay"
              value="${escapeHtml(bill.paymentUrl || '')}"
              style="text-align:left"
            />
          </div>
        </div>

        <div class="settings-footer">
          Optional. Paste the company’s payment or sign-in website.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document.getElementById('paymentLinkPopupOverlay')?.classList.add('show');
    document.getElementById('paymentLinkPopupSheet')?.classList.add('show');

    document.getElementById('quickPaymentUrl')?.focus();
  });
}

function closePaymentLinkPopup() {
  document.getElementById('paymentLinkPopupOverlay')?.classList.remove('show');
  document.getElementById('paymentLinkPopupSheet')?.classList.remove('show');

  setTimeout(() => {
    document.getElementById('paymentLinkPopupContainer')?.remove();
  }, 300);
}

function savePaymentLinkPopup(billId) {
  const input = document.getElementById('quickPaymentUrl');
  const paymentUrl = input ? input.value.trim() : '';

  Store.updateBill(billId, { paymentUrl });

  closePaymentLinkPopup();
  render();
}
function saveBill() {
  const name = document.getElementById('billName')?.value.trim();
  const amount = parseFloat(document.getElementById('billAmount')?.value || 0);
  const category = document.getElementById('billCategory')?.value || 'other';
  const dueDateInput = document.getElementById('billDueDate')?.value;
  const recurrence = document.getElementById('billRecurrence')?.value || 'None';
  const dueDayValue = document.getElementById('billDueDay')?.value;
  const payCycle = document.getElementById('billPayCycle')?.value || 'first';
  const paymentMethod = document.getElementById('billPaymentMethod')?.value || '';
  const paymentUrl = document.getElementById('billPaymentUrl')?.value.trim() || '';
  const autopay = Boolean(document.getElementById('billAutopay')?.checked);
  const notes = document.getElementById('billNotes')?.value.trim() || '';

  const reminderOffsets = Array.from(
    document.querySelectorAll('input[name="billReminderOffsets"]:checked')
  )
    .map((input) => Number(input.value))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b);

  if (!name) {
    alert('Please enter a bill name.');
    return;
  }

  if (Number.isNaN(amount) || amount < 0) {
    alert('Please enter a valid amount.');
    return;
  }

  if (!dueDateInput) {
    alert('Please choose a due date.');
    return;
  }

  const dueDate = dateFromInput(dueDateInput);

  if (!dueDate) {
    alert('Please choose a valid due date.');
    return;
  }

  const dueDay =
    recurrence === 'Monthly'
      ? Math.max(1, Math.min(31, Number(dueDayValue) || new Date(dueDate).getDate()))
      : new Date(dueDate).getDate();

  const existingBill = editingBillId ? Store.getBill(editingBillId) : null;

  const data = {
    name,
    amount,
    category,
    dueDate,
    dueDay,
    recurrence,
    payCycle,
    paymentMethod,
    paymentUrl,
    autopay,
    notes,
    reminderOffsets,
  };

  if (editingBillId) {
    Store.updateBill(editingBillId, data);
  } else {
    Store.addBill({
      id: uid(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      postponementHistory: [],
      occurrenceOverrides: [],
    });
  }

  closeBillForm();
  render();
}

// ====================================
// ACTIONS
// ====================================

let currentFilter = 'all';
window.toggleMonthBills = function() {
  const extraBills = document.getElementById('moreMonthBills');
  const button = document.getElementById('toggleMonthBills');

  if (!extraBills || !button) return;

  const isOpen = extraBills.classList.toggle('is-open');

  button.innerHTML = isOpen
    ? `Show less ${svgIcon('chevronRight', 18)}`
    : `Show all ${document.querySelectorAll('#moreMonthBills .bill-row').length + 5} bills ${svgIcon('chevronRight', 18)}`;

  button.classList.toggle('is-open', isOpen);
};

function setCycleFilter(cycle) {
  routeParams.cycle = cycle;
  render();
}
function openCurrentCycleBills() {
  const currentCycle = getCurrentPayCycle();

  navigate('bills', {
    cycle: currentCycle === 'first' ? 'early' : 'late'
  });
}
function setStatusFilter(status) {
  routeParams.status = status;
  delete routeParams.filter;
  render();
}

let searchTimer;
function debouncedSearch(value) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    routeParams.search = value;
    render();
    // Restore focus
    setTimeout(() => {
      const input = document.querySelector('.search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }, 300);
}

function setTheme(theme) {
  const settings = Store.getSettings();
  settings.theme = theme;
  Store.saveSettings(settings);
  initTheme();
  render();
}

function openBillPaymentLink(billId) {
  const bill = Store.getBill(billId);

  if (!bill || !bill.paymentUrl) {
    alert("No payment link has been added for this bill yet.");
    return;
  }

  let url = bill.paymentUrl.trim();

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const paymentUrl = new URL(url);

    if (
      paymentUrl.protocol !== "https:" &&
      paymentUrl.protocol !== "http:"
    ) {
      throw new Error("Unsupported link");
    }

    window.open(paymentUrl.href, "_blank", "noopener,noreferrer");
  } catch {
    alert("Please enter a valid payment website link.");
  }
}
function confirmMarkPaid(billId) {
  if (confirm('Mark this bill as paid?')) {
    markBillPaid(billId);
    closeDashboardStatusSheet();
navigate('today');
    render();
  }
}

function confirmDeleteBill(billId, fromForm = false) {
  if (confirm('Delete this bill? This cannot be undone.')) {
    Store.deleteBill(billId);
    if (fromForm) {
      closeBillForm();
      navigate('bills');
    } else {
      navigate('bills');
    }
  }
}

function clearAllAppData() {
  const confirmed = confirm(
    'Clear all Bill Tracker data?\n\n' +
    'This permanently deletes bills, payments, income sources, archives, and settings stored on this device.'
  );

  if (!confirmed) return;

  localStorage.removeItem('bills');
  localStorage.removeItem('payments');
  localStorage.removeItem('incomeSources');
  localStorage.removeItem('archivedBills');
  localStorage.removeItem('settings');
  localStorage.removeItem('initialized');
  localStorage.removeItem('billTrackerAdminToken');
  localStorage.removeItem('billTrackerSubscriptionId');

  alert('All Bill Tracker data has been cleared.');
  navigate('today');
}

function exportCSV() {
  const bills = Store.getBills();
  let csv = 'Name,Amount,Due Date,Category,Recurrence,Paid,Payment Method,Notes\n';
  bills.forEach(bill => {
    const paid = isPaidThisCycle(bill) ? 'Yes' : 'No';
    csv += `"${bill.name}",`;
    csv += `${bill.amount},`;
    csv += `${bill.dueDate.split('T')[0]},`;
    csv += `${getCategory(bill.category).label},`;
    csv += `${bill.recurrence},`;
    csv += `${paid},`;
    csv += `"${bill.paymentMethod || ''}",`;
    csv += `"${bill.notes || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bills-export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ====================================
// MAIN RENDER
// ====================================

function closeNotificationCenter() {
  const overlay = document.getElementById('notificationCenterOverlay');
  const sheet = document.getElementById('notificationCenterSheet');

  if (overlay) overlay.classList.remove('show');
  if (sheet) sheet.classList.remove('show');

      
  }
  setTimeout(() => {
    document.getElementById('notificationCenterContainer')?.remove();
  }, 300);


function openNotificationCenter() {
  const bills = Store.getBills();

  const overdueBills = bills
    .filter((bill) => getBillStatus(bill) === 'overdue')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const upcomingBills = bills
    .filter((bill) => getBillStatus(bill) === 'upcoming')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const notifications = [
    ...overdueBills.map((bill) => ({
      bill,
      type: 'overdue',
      title: 'Payment overdue',
      message: `${formatCurrency(bill.amount)} was due ${formatDate(
        bill.dueDate,
        'short'
      )}`,
    })),
    ...upcomingBills.map((bill) => ({
      bill,
      type: 'upcoming',
      title: relativeDue(bill.dueDate) === 'due today'
        ? 'Due today'
        : 'Upcoming bill',
      message: `${formatCurrency(bill.amount)} · ${formatDate(
        bill.dueDate,
        'full'
      )}`,
    })),
  ];

  const container = document.createElement('div');
  container.id = 'notificationCenterContainer';

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="notificationCenterOverlay"
      onclick="closeNotificationCenter()"
    ></div>

    <div class="sheet" id="notificationCenterSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeNotificationCenter()">
          Close
        </button>

        <div class="sheet-title">Notifications</div>

        <div style="width:54px"></div>
      </div>

      <div style="padding: var(--space-4);">
        ${
          notifications.length
            ? `
              <div class="notification-list">
                ${notifications
                  .map(({ bill, type, title, message }) => {
                    const color =
                      type === 'overdue'
                        ? 'var(--overdue)'
                        : 'var(--upcoming)';

                    const background =
                      type === 'overdue'
                        ? 'var(--overdue-bg)'
                        : 'var(--upcoming-bg)';

                    const icon =
                      type === 'overdue'
                        ? svgIcon('warning', 18)
                        : svgIcon('bell', 18);

                    return `
                      <button
                        class="notification-row"
                        onclick="closeNotificationCenter(); navigate('detail', { id: '${bill.id}' })"
                      >
                        <div
                          class="notification-row-icon"
                          style="color:${color}; background:${background};"
                        >
                          ${icon}
                        </div>

                        <div class="notification-row-copy">
                          <div class="notification-row-title">
                            ${title}
                          </div>

                          <div class="notification-row-message">
                            ${escapeHtml(bill.name)} · ${message}
                          </div>
                        </div>

                        <div class="notification-row-arrow">
                          ${svgIcon('chevronRight', 18)}
                        </div>
                      </button>
                    `;
                  })
                  .join('')}
              </div>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon('checkCircle', 48)}
                </div>
                <div class="empty-state-title">You are all caught up</div>
                <div class="empty-state-text">
                  No overdue or upcoming bill reminders right now.
                </div>
              </div>
            `
        }

        <button
          class="btn-secondary"
          style="margin-top: var(--space-4);"
          onclick="closeNotificationCenter(); navigate('settings')"
        >
          ${svgIcon('gear', 18)}
          Notification Settings
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document
      .getElementById('notificationCenterOverlay')
      ?.classList.add('show');

    document
      .getElementById('notificationCenterSheet')
      ?.classList.add('show');
  });
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  let content = "";

  switch (currentRoute) {
    case "today":
      content = renderToday();
      break;
    case "recurring":
      content = renderRecurring();
      break;
    case "bills":
      content = renderBills();
      break;
    case "calendar":
      content = renderCalendar();
      break;
    case "insights":
      content = renderInsights();
      break;
    case "activity":
      content = renderActivity();
      break;
    case "payment-plans":
      content = renderPaymentPlans();
      break;
    case "settings":
      content = renderSettings();
      break;
    case "detail":
      content = renderBillDetail();
      break;
    default:
      content = renderToday();
  }

  const showTabBar = ["today", "recurring", "bills", "insights", "settings"]
    .includes(currentRoute);

  if (showTabBar) {
    content += tabBar();
  }

  app.innerHTML = content;
}

window.render = render;
console.log(
  "Bill Beacon app.js loaded successfully. window.render:",
  typeof window.render
);
/* ============================================
   Bill Tracker Push Notifications
============================================ */

const NOTIFICATION_WORKER_URL =
  "https://bill-tracker-reminders.rodz-m-1990.workers.dev";

const VAPID_PUBLIC_KEY = "BFQkR3Ai2QQ8FzCwJyTTBKniWjHXqQnFCIBEmiQPI-COW_NrfhfS-HxP5w3xQMFNERI1-EkzH4HSsFfRejp1jpw";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

async function activateBillNotifications() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }

    const savedToken = localStorage.getItem("billTrackerAdminToken");
    const adminToken =
      savedToken ||
      window.prompt("Enter your private notification connection code:");

    if (!adminToken) {
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Notifications were not allowed. Enable them in iPhone Settings and try again.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subscribeResponse = await fetch(
      `${NOTIFICATION_WORKER_URL}/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(subscription),
      }
    );

    if (!subscribeResponse.ok) {
      throw new Error("The notification subscription could not be saved.");
    }

    const { subscriptionId } = await subscribeResponse.json();

    localStorage.setItem("billTrackerAdminToken", adminToken);
    localStorage.setItem("billTrackerSubscriptionId", subscriptionId);

    const testResponse = await fetch(`${NOTIFICATION_WORKER_URL}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!testResponse.ok) {
      throw new Error("Subscription saved, but the test notification failed.");
    }

    await syncAllBillReminders(adminToken, subscriptionId);
    alert("Notifications are on. A test notification was sent.");
  } catch (error) {
    console.error(error);
    alert(`Notification setup failed: ${error.message}`);
  }
}

function addNotificationSettings() {
  if (
    currentRoute !== "settings" ||
    document.getElementById("notificationSettingsCard")
  ) {
    return;
  }

  const container = document.querySelector(".main-content .content-pad");

  if (!container) {
    return;
  }

  const section = document.createElement("div");
  section.id = "notificationSettingsCard";
  section.className = "settings-section";

  section.innerHTML = `
    <div class="section-header">Notifications</div>
    <div class="card card-pad">
      <p style="font-size: var(--text-sm); color: var(--text-muted); line-height: 1.5; margin-bottom: var(--space-3);">
        Receive bill reminders on this iPhone.
      </p>
      <button class="btn-primary" onclick="activateBillNotifications()">
        ${svgIcon("bell", 20)} Turn On Notifications
      </button>
    </div>
  `;

  container.appendChild(section);
}

const originalBillTrackerRender = render;

render = function () {
  originalBillTrackerRender();
  addNotificationSettings();
};

function getReminderSendTime(dueDate, daysBefore) {
  const [year, month, day] = dueDate.slice(0, 10).split("-").map(Number);

  const sendTime = new Date(
    year,
    month - 1,
    day - Number(daysBefore),
    9,
    0,
    0,
    0
  );

  return sendTime.toISOString();
}

async function syncBillReminders(billId, bill, adminToken, subscriptionId) {
  const reminders = bill
    ? (bill.reminderOffsets || [])
        .map((daysBefore) => ({
          title: bill.autopay
  ? `Autopay upcoming: ${bill.name}`
  : `Bill due: ${bill.name}`,

body: bill.autopay
  ? `${formatCurrency(bill.amount)} will be paid automatically on ${formatDate(
      bill.dueDate,
      "full"
    )}.`
  : `${formatCurrency(bill.amount)} is due on ${formatDate(
      bill.dueDate,
      "full"
    )}.`,
          sendAt: getReminderSendTime(bill.dueDate, daysBefore),
        }))
        .filter((reminder) => new Date(reminder.sendAt).getTime() > Date.now())
    : [];

  const response = await fetch(`${NOTIFICATION_WORKER_URL}/sync-bill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      subscriptionId,
      billId,
      reminders,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not schedule bill reminders.");
  }
}

async function syncAllBillReminders(adminToken, subscriptionId) {
  const bills = Store.getBills();

  await Promise.all(
    bills.map((bill) =>
      syncBillReminders(bill.id, bill, adminToken, subscriptionId)
    )
  );
}

function queueBillReminderSync(billId, bill) {
  const adminToken = localStorage.getItem("billTrackerAdminToken");
  const subscriptionId = localStorage.getItem("billTrackerSubscriptionId");

  if (!adminToken || !subscriptionId) {
    return;
  }

  syncBillReminders(billId, bill, adminToken, subscriptionId).catch((error) => {
    console.error("Reminder sync failed:", error);
  });
}

const originalAddBillForReminders = Store.addBill.bind(Store);

Store.addBill = function (bill) {
  originalAddBillForReminders(bill);
  queueBillReminderSync(bill.id, bill);
};

const originalUpdateBillForReminders = Store.updateBill.bind(Store);

Store.updateBill = function (billId, updates) {
  originalUpdateBillForReminders(billId, updates);
  queueBillReminderSync(billId, Store.getBill(billId));
};

const originalDeleteBillForReminders = Store.deleteBill.bind(Store);

Store.deleteBill = function (billId) {
  originalDeleteBillForReminders(billId);
  queueBillReminderSync(billId, null);
};

const originalAddPaymentForReminders = Store.addPayment.bind(Store);

Store.addPayment = function (payment) {
  const bill = Store.getBill(payment.billId);

  originalAddPaymentForReminders(payment);

  if (bill && bill.recurrence === "None") {
    queueBillReminderSync(bill.id, null);
  }
};

/* ============================================
   Full Backup and Restore
============================================ */

function exportBillTrackerBackup() {
  const backup = {
    app: "Bill Tracker",
    version: 1,
    exportedAt: new Date().toISOString(),
    bills: Store.getBills(),
    archivedBills: getArchivedBills(),
    payments: Store.getPayments(),
    settings: Store.getSettings(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `bill-tracker-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  link.click();
  URL.revokeObjectURL(url);
}

function chooseBillTrackerBackup() {
  document.getElementById("billTrackerBackupFile").click();
}

function importBillTrackerBackup(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);

      if (!Array.isArray(backup.bills) || !Array.isArray(backup.payments)) {
        throw new Error("This is not a valid Bill Tracker backup file.");
      }

      const replace = confirm(
        "Restore this backup? It will replace the bills and payment history currently stored on this device."
      );

      if (!replace) {
        return;
      }

      Store.saveBills(backup.bills);

      saveArchivedBills(
       Array.isArray(backup.archivedBills) ? backup.archivedBills : []
        );

Store.savePayments(backup.payments);

      if (backup.settings) {
        Store.saveSettings(backup.settings);
      }

      localStorage.setItem("initialized", "true");
    
      alert("Backup restored successfully.");
      render();
    } catch (error) {
      alert(`Could not restore backup: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}

function addBackupSettings() {
  if (
    currentRoute !== "settings" ||
    document.getElementById("backupSettingsCard")
  ) {
    return;
  }

  const container = document.querySelector(".main-content .content-pad");

  if (!container) {
    return;
  }

  const section = document.createElement("div");
  section.id = "backupSettingsCard";
  section.className = "settings-section";

  section.innerHTML = `
    <div class="section-header">Backup & Restore</div>
    <div class="card card-pad">
      <p style="font-size: var(--text-sm); color: var(--text-muted); line-height: 1.5; margin-bottom: var(--space-3);">
        Save all bills, payment history, and settings in one private backup file.
      </p>

      <button class="btn-primary" onclick="exportBillTrackerBackup()">
        ${svgIcon("export", 20)} Create Backup
      </button>

      <button
        class="btn-secondary"
        style="margin-top: var(--space-3); width: 100%;"
        onclick="chooseBillTrackerBackup()"
      >
        Restore Backup
      </button>

      <input
        id="billTrackerBackupFile"
        type="file"
        accept=".json,application/json"
        style="display: none;"
        onchange="importBillTrackerBackup(event)"
      >
    </div>
  `;

  container.appendChild(section);
}

const renderWithBackupSettings = render;

render = function () {
  renderWithBackupSettings();
  addBackupSettings();
};

/* ============================================
   Upcoming Notification Schedule
============================================ */

function formatReminderDateTime(dateString) {
  return new Date(dateString).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function loadUpcomingReminders() {
  const content = document.getElementById("upcomingReminderList");

  if (!content) {
    return;
  }

  const adminToken = localStorage.getItem("billTrackerAdminToken");
  const subscriptionId = localStorage.getItem("billTrackerSubscriptionId");

  if (!adminToken || !subscriptionId) {
    content.innerHTML = `
      <div style="font-size: var(--text-sm); color: var(--text-muted);">
        Turn on notifications first to view scheduled reminders.
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div style="font-size: var(--text-sm); color: var(--text-muted);">
      Loading scheduled reminders…
    </div>
  `;

  try {
    const response = await fetch(
      `${NOTIFICATION_WORKER_URL}/upcoming-reminders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ subscriptionId }),
      }
    );

    if (!response.ok) {
      throw new Error("Could not load scheduled reminders.");
    }

    const { reminders } = await response.json();

    if (!reminders.length) {
      content.innerHTML = `
        <div style="font-size: var(--text-sm); color: var(--text-muted);">
          No future reminders are currently scheduled.
        </div>
      `;
      return;
    }

    content.innerHTML = reminders
      .map(
        (reminder) => `
          <div class="form-row">
            <div style="flex: 1;">
              <div class="form-label">${escapeHtml(reminder.title)}</div>
              <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 4px;">
                ${escapeHtml(reminder.body)}
              </div>
            </div>
            <div style="font-size: var(--text-xs); color: var(--accent); text-align: right; max-width: 130px;">
              ${formatReminderDateTime(reminder.sendAt)}
            </div>
          </div>
        `
      )
      .join("");
  } catch (error) {
    content.innerHTML = `
      <div style="font-size: var(--text-sm); color: var(--status-overdue);">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

function addUpcomingReminderSettings() {
  if (
    currentRoute !== "settings" ||
    document.getElementById("upcomingReminderSettings")
  ) {
    return;
  }

  const container = document.querySelector(".main-content .content-pad");

  if (!container) {
    return;
  }

  const section = document.createElement("div");
  section.id = "upcomingReminderSettings";
  section.className = "settings-section";

  section.innerHTML = `
    <div class="section-header">Upcoming Notifications</div>
    <div class="card card-pad">
      <div id="upcomingReminderList"></div>

      <button
        class="btn-secondary"
        style="margin-top: var(--space-3); width: 100%;"
        onclick="loadUpcomingReminders()"
      >
        Refresh Schedule
      </button>
    </div>
  `;
<button id="signout-button" type="button">
  Sign Out
</button>

  container.appendChild(section);
  loadUpcomingReminders();
}

const renderWithUpcomingReminders = render;

render = function () {
  renderWithUpcomingReminders();
  addUpcomingReminderSettings();
};

/* ============================================
   Archive Bills and Payment History
============================================ */

function getArchivedBills() {
  try {
    return JSON.parse(localStorage.getItem("archivedBills")) || [];
  } catch {
    return [];
  }
}

function saveArchivedBills(bills) {
  localStorage.setItem("archivedBills", JSON.stringify(bills));
}

function archiveBill(billId) {
  const activeBills = Store.getBills();
  const bill = activeBills.find((item) => item.id === billId);

  if (!bill) {
    return;
  }

  const archivedBills = getArchivedBills();

  archivedBills.push({
    ...bill,
    archivedAt: new Date().toISOString(),
  });

  saveArchivedBills(archivedBills);
  Store.saveBills(activeBills.filter((item) => item.id !== billId));

  if (typeof queueBillReminderSync === "function") {
    queueBillReminderSync(billId, null);
  }
}

confirmDeleteBill = function (billId, fromForm = false) {
  const shouldArchive = confirm(
    "Archive this bill? It will be removed from active bills, but its payment history will be kept."
  );

  if (!shouldArchive) {
    return;
  }

  archiveBill(billId);

  if (fromForm) {
    closeBillForm();
  }

  navigate("bills");
};

function renderPaymentHistory() {
  const activeBills = Store.getBills();
  const archivedBills = getArchivedBills();
  const allBills = [...activeBills, ...archivedBills];

  const payments = Store.getPayments()
    .map(payment => ({
      ...payment,
      bill: allBills.find(bill => bill.id === payment.billId)
    }))
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <button class="nav-button" onclick="navigate('today')">
          ${svgIcon('chevronLeft', 22)}
        </button>

        <div class="nav-title">Payment History</div>
        <div style="width:54px"></div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad content-gap">
        ${
          payments.length
            ? `
              <div class="section-header">All Payments</div>

              <div class="card">
                ${payments.map(payment => {
                  const isVoided = payment.status === 'voided';

                  const billName = payment.bill
                    ? escapeHtml(payment.bill.name)
                    : 'Archived bill';

                  const shownDate = isVoided
                    ? payment.voidedAt || payment.paidDate
                    : payment.paidDate;

                  return `
                    <div
                      class="bill-row"
                      style="
                        ${isVoided
                          ? 'opacity:.58; text-decoration:line-through;'
                          : ''
                        }
                      "
                    >
                      <div
                        class="bill-icon"
                        style="
                          background:${isVoided ? 'var(--surface-2)' : 'var(--paid-bg)'};
                          color:${isVoided ? 'var(--text-muted)' : 'var(--paid)'};
                        "
                      >
                        ${svgIcon(isVoided ? 'close' : 'checkCircle', 18)}
                      </div>

                      <div class="bill-info">
                        <div class="bill-name">
                          ${billName}${isVoided ? ' · Voided' : ''}
                        </div>

                        <div
                          class="bill-meta"
                          style="color:${isVoided ? 'var(--text-muted)' : 'var(--paid)'}"
                        >
                          ${isVoided
                            ? `Voided ${formatDate(shownDate, 'full')}`
                            : `Paid ${formatDate(shownDate, 'full')}`
                          }
                        </div>
                      </div>

                      <div
                        class="bill-amount"
                        style="
                          color:${isVoided ? 'var(--text-muted)' : 'var(--paid)'};
                          ${isVoided ? 'text-decoration:line-through;' : ''}
                        "
                      >
                        ${formatCurrency(payment.amount)}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon('tray', 48)}
                </div>

                <div class="empty-state-title">No payment history yet</div>

                <div class="empty-state-text">
                  Payments you mark as paid will appear here.
                </div>
              </div>
            `
        }
      </div>
    </div>
  `;
}
const renderWithArchiveHistory = render;

render = function () {
  if (currentRoute === "history") {
    const app = document.getElementById("app");

    if (app) {
      app.innerHTML = renderPaymentHistory();
    }

    return;
  }

  renderWithArchiveHistory();
};

/* ============================================
   Installment / Pay-in-4 Plan Form
============================================ */

function closeInstallmentPlanForm() {
  document.getElementById('installmentPlanContainer')?.remove();
}

function updateInstallmentFirstPaymentLabel() {
  const status = document.getElementById("installmentFirstPaymentStatus");
  const label = document.getElementById("installmentFirstPaymentDateLabel");

  if (!status || !label) {
    return;
  }

  label.textContent =
    status.value === "paid"
      ? "Payment Date"
      : "First Due Date";
}

function openInstallmentPlanForm() {
  const today = new Date().toISOString().split("T")[0];

  const container = document.createElement("div");
  container.id = "installmentPlanContainer";

  container.innerHTML = `
    <div
  class="sheet-overlay show"
  id="installmentPlanOverlay"
  onclick="closeInstallmentPlanForm()"
></div>

<div class="sheet show" id="installmentPlanSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeInstallmentPlanForm()">
          Cancel
        </button>

        <div class="sheet-title">Add Payment Plan</div>

        <button
          class="nav-button"
          onclick="saveInstallmentPlan()"
          style="font-weight: 700;"
        >
          Create
        </button>
      </div>

      <div style="padding: var(--space-4);">
        <div class="content-gap">

          <div class="section-header">Payment App</div>

          <div class="card">
            <select
              class="form-select"
              id="installmentProvider"
              style="width:100%;height:48px;padding:0 var(--space-4);border:none;background:transparent;font-size:var(--text-base);-webkit-appearance:none"
            >
              <option value="Klarna">Klarna</option>
              <option value="Afterpay">Afterpay</option>
              <option value="Affirm">Affirm</option>
              <option value="Zip">Zip</option>
              <option value="Sezzle">Sezzle</option>
              <option value="PayPal Pay Later">PayPal Pay Later</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="section-header">Purchase Details</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">Store</div>
              <input
                class="form-input"
                id="installmentStore"
                type="text"
                placeholder="Optional"
                style="text-align:left;"
              />
            </div>

            <div class="form-row">
              <div class="form-label">Total</div>
              <input
                class="form-input"
                id="installmentTotal"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div class="section-header">Payment Schedule</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">Payments</div>
              <input
                class="form-input"
                id="installmentCount"
                type="number"
                min="2"
                max="60"
                value="4"
              />
            </div>

            <div class="form-row">
              <div class="form-label">Frequency</div>
              <select class="form-select" id="installmentFrequency">
                <option value="14">Every 2 weeks</option>
                <option value="7">Weekly</option>
                <option value="30">Monthly</option>
                <option value="90">Quarterly</option>
              </select>
            </div>
          </div>

          <div class="section-header">First Payment</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">Status</div>
              <select
                class="form-select"
                id="installmentFirstPaymentStatus"
                onchange="updateInstallmentFirstPaymentLabel()"
              >
                <option value="notPaid">
                  No Down Payment Required
                </option>
                <option value="paid">
                  Paid At Checkout
                </option>
              </select>
            </div>

            <div class="form-row">
              <div
                class="form-label"
                id="installmentFirstPaymentDateLabel"
              >
                First Due Date
              </div>

              <input
                class="form-input"
                id="installmentFirstPaymentDate"
                type="date"
                value="${today}"
              />
            </div>
          </div>

          <div class="section-header">Payment Link</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">Website</div>

              <input
                class="form-input"
                id="installmentPaymentUrl"
                type="text"
                placeholder="Website or Shortcut link"
                style="text-align:left;"
              />
            </div>
          </div>

          <div class="section-header">Options</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">Autopay</div>

              <label class="toggle">
                <input
                  id="installmentAutopay"
                  type="checkbox"
                  checked
                />
                <div class="toggle-track">
                  <div class="toggle-thumb"></div>
                </div>
              </label>
            </div>
          </div>

          <div class="settings-footer">
            The app will create one separate bill for every payment in this plan.
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
}

function getNextInstallmentDate(date, frequencyDays) {
  const nextDate = new Date(date);

  if (frequencyDays === 30) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (frequencyDays === 90) {
    nextDate.setMonth(nextDate.getMonth() + 3);
  } else {
    nextDate.setDate(nextDate.getDate() + frequencyDays);
  }

  return nextDate;
}

function saveInstallmentPlan() {
  const provider = document.getElementById("installmentProvider").value;
  const store = document.getElementById("installmentStore").value.trim();
  const total = parseFloat(
    document.getElementById("installmentTotal").value
  );
  const paymentCount = parseInt(
    document.getElementById("installmentCount").value,
    10
  );
  const frequencyDays = parseInt(
    document.getElementById("installmentFrequency").value,
    10
  );
  const firstPaymentStatus = document.getElementById(
    "installmentFirstPaymentStatus"
  ).value;
  const firstPaymentDateValue = document.getElementById(
    "installmentFirstPaymentDate"
  ).value;
  const paymentUrl = document.getElementById(
    "installmentPaymentUrl"
  ).value.trim();
  const autopay = document.getElementById("installmentAutopay").checked;

  if (!total || total <= 0) {
    alert("Please enter the total purchase amount.");
    return;
  }

  if (!paymentCount || paymentCount < 2 || paymentCount > 60) {
    alert("Please enter between 2 and 60 payments.");
    return;
  }

  if (!firstPaymentDateValue) {
    alert("Please select the first payment date.");
    return;
  }

  const firstPaymentDate = new Date(`${firstPaymentDateValue}T12:00:00`);

  if (Number.isNaN(firstPaymentDate.getTime())) {
    alert("Please enter a valid first payment date.");
    return;
  }

  const planId = uid();
  const totalCents = Math.round(total * 100);
  const basePaymentCents = Math.floor(totalCents / paymentCount);
  const extraCents = totalCents % paymentCount;
  const createdAt = new Date().toISOString();

  let paymentDate = new Date(firstPaymentDate);

  for (let index = 0; index < paymentCount; index += 1) {
    const paymentNumber = index + 1;

    const paymentCents =
      basePaymentCents + (index < extraCents ? 1 : 0);

    const paymentAmount = (paymentCents / 100).toFixed(2);

    const billName = store || "Payment Plan";
 

    const bill = {
      id: uid(),
      name: billName,
      amount: paymentAmount,
      dueDate: paymentDate.toISOString(),
      category: "loans",
      recurrence: "None",
      paymentMethod: "",
      paymentUrl,
      autopay,
      notes: `Installment plan: ${provider}. Payment ${paymentNumber} of ${paymentCount}.`,
      reminderOffsets: [7, 3, 1],
      installmentPlanId: planId,
      installmentProvider: provider,
      installmentNumber: paymentNumber,
      installmentTotal: paymentCount,
      createdAt,
      updatedAt: createdAt,
    };

    Store.addBill(bill);

    if (paymentNumber === 1 && firstPaymentStatus === 'paid') {
  Store.addPayment({
    id: uid(),
    billId: bill.id,
    paidDate: paymentDate.toISOString(),
    amount: paymentAmount,
    paidForDueDate: bill.dueDate,
    status: 'active',
    voidedAt: null
  });
}

    paymentDate = getNextInstallmentDate(
      paymentDate,
      frequencyDays
    );
  }

  closeInstallmentPlanForm();
  navigate("bills");

  const firstPaymentMessage =
    firstPaymentStatus === "paid"
      ? " The first payment was marked paid."
      : "";

  alert(
    `Created ${paymentCount} installment bills for ${provider}.${firstPaymentMessage}`
  );
}

document.addEventListener(
  'click',
  (event) => {
    const bellButton = event.target.closest('[data-notification-bell]');

    if (!bellButton) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (typeof openNotificationCenter === 'function') {
      openNotificationCenter();
    }
  },
  true
);

/* ============================================
   Real Push Notification Inbox
   Uses Worker notification send history
============================================ */

let notificationInboxState = {
  notifications: [],
  unreadCount: 0,
  loaded: false,
};

getNotificationCount = function () {
  return notificationInboxState.unreadCount || 0;
};

function getNotificationConnection() {
  const adminToken = localStorage.getItem('billTrackerAdminToken');
  const subscriptionId = localStorage.getItem('billTrackerSubscriptionId');

  if (!adminToken || !subscriptionId) {
    return null;
  }

  return { adminToken, subscriptionId };
}

async function refreshNotificationInbox() {
  const connection = getNotificationConnection();

  if (!connection) {
    notificationInboxState = {
      notifications: [],
      unreadCount: 0,
      loaded: true,
    };

    return notificationInboxState;
  }

  const response = await fetch(`${NOTIFICATION_WORKER_URL}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${connection.adminToken}`,
    },
    body: JSON.stringify({
      subscriptionId: connection.subscriptionId,
    }),
  });

  if (!response.ok) {
    throw new Error('Could not load notification history.');
  }

  const data = await response.json();

  notificationInboxState = {
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    unreadCount: Number(data.unreadCount) || 0,
    loaded: true,
  };

  return notificationInboxState;
}

async function markNotificationInboxRead() {
  const connection = getNotificationConnection();

  if (!connection || notificationInboxState.unreadCount === 0) {
    return;
  }

  const response = await fetch(
    `${NOTIFICATION_WORKER_URL}/notifications/mark-read`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${connection.adminToken}`,
      },
      body: JSON.stringify({
        subscriptionId: connection.subscriptionId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Could not mark notifications as read.');
  }

  notificationInboxState = {
    ...notificationInboxState,
    unreadCount: 0,
    notifications: notificationInboxState.notifications.map((notification) => ({
      ...notification,
      read: true,
      readAt: notification.readAt || new Date().toISOString(),
    })),
  };
}

openNotificationCenter = async function () {
  let history;
  let loadError = '';

  try {
    history = await refreshNotificationInbox();
    await markNotificationInboxRead();
  } catch (error) {
    console.error(error);
    history = notificationInboxState;
    loadError = error.message;
  }

  if (currentRoute === 'today') {
    render();
  }

  const notifications = history.notifications || [];

  const container = document.createElement('div');
  container.id = 'notificationCenterContainer';

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="notificationCenterOverlay"
      onclick="closeNotificationCenter()"
    ></div>

    <div class="sheet" id="notificationCenterSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeNotificationCenter()">
          Close
        </button>

        <div class="sheet-title">Notifications</div>

        <div style="width:54px"></div>
      </div>

      <div style="padding: var(--space-4);">
        ${
          loadError
            ? `
              <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('warning', 48)}</div>
                <div class="empty-state-title">Could not load notifications</div>
                <div class="empty-state-text">${escapeHtml(loadError)}</div>
              </div>
            `
            : !getNotificationConnection()
            ? `
              <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('bell', 48)}</div>
                <div class="empty-state-title">Notifications are not connected</div>
                <div class="empty-state-text">
                  Turn on notifications in Settings first.
                </div>
              </div>
            `
            : notifications.length
            ? `
              <div class="notification-list">
                ${notifications
                  .map((notification) => {
                    const icon = svgIcon(
                      notification.title.toLowerCase().includes('overdue')
                        ? 'warning'
                        : 'bell',
                      18
                    );

                    const canOpenBill = Boolean(notification.billId);

                    return `
                      <button
                        class="notification-row"
                        onclick="
                          closeNotificationCenter();
                          ${
                            canOpenBill
                              ? `navigate('detail', { id: '${notification.billId}' });`
                              : ''
                          }
                        "
                      >
                        <div
                          class="notification-row-icon"
                          style="
                            color:var(--accent);
                            background:var(--upcoming-bg);
                          "
                        >
                          ${icon}
                        </div>

                        <div class="notification-row-copy">
                          <div class="notification-row-title">
                            ${escapeHtml(notification.title)}
                          </div>

                          <div class="notification-row-message">
                            ${escapeHtml(notification.body)}
                          </div>

                          <div
                            style="
                              font-size:var(--text-xs);
                              color:var(--text-muted);
                              margin-top:4px;
                            "
                          >
                            Sent ${formatReminderDateTime(notification.sentAt)}
                          </div>
                        </div>

                        ${
                          canOpenBill
                            ? `
                              <div class="notification-row-arrow">
                                ${svgIcon('chevronRight', 18)}
                              </div>
                            `
                            : ''
                        }
                      </button>
                    `;
                  })
                  .join('')}
              </div>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('checkCircle', 48)}</div>
                <div class="empty-state-title">You’re all caught up</div>
              </div>
            `
        }

        
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document
      .getElementById('notificationCenterOverlay')
      ?.classList.add('show');

    document
      .getElementById('notificationCenterSheet')
      ?.classList.add('show');
  });
};

let backgroundScrollY = 0;

function lockBackgroundScroll() {
  if (document.body.classList.contains('popup-open')) return;

  backgroundScrollY = window.scrollY;

  document.body.classList.add('popup-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${backgroundScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}

function unlockBackgroundScroll() {
  const scrollY = backgroundScrollY || 0;

  document.body.classList.remove('popup-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';

  backgroundScrollY = 0;

  requestAnimationFrame(() => {
    window.scrollTo(0, scrollY);

    const main = document.querySelector('.main-content');
    if (main) {
      main.scrollTop = 0;
    }
  });
}
document.addEventListener('DOMContentLoaded', () => {
  refreshNotificationInbox()
    .then(() => {
      if (currentRoute === 'today') {
        render();
      }
    })
    .catch((error) => {
      console.error('Notification history refresh failed:', error);
    });
});

document.addEventListener(
  'touchmove',
  function (event) {
    if (!document.body.classList.contains('popup-open')) return;

    const sheet = event.target.closest('.sheet');

    if (!sheet) {
      event.preventDefault();
      return;
    }

    const canScroll = sheet.scrollHeight > sheet.clientHeight;

    if (!canScroll) {
      event.preventDefault();
    }
  },
  { passive: false }
);
// ====================================
// INIT
// ====================================

function init() {
  initTheme();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  }
}

document.addEventListener("DOMContentLoaded", init);