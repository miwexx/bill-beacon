import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot
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
const db = getFirestore(firebaseApp);

const STORAGE_KEYS = [
  "bills",
  "payments",
  "activityLog",
  "incomeSources",
  "settings",
  "archivedBills"
];

let activeUserId = null;
let cloudIsReady = false;
let saving = false;
let saveTimer = null;
let unsubscribeFromHousehold = null;
let lastCloudUpdatedAt = null;

function getLocalValue(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function isNonEmpty(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return Boolean(value);
}

function localHouseholdHasData() {
  return (
    isNonEmpty(getLocalValue("bills", [])) ||
    isNonEmpty(getLocalValue("payments", [])) ||
    isNonEmpty(getLocalValue("activityLog", [])) ||
    isNonEmpty(getLocalValue("incomeSources", [])) ||
    isNonEmpty(getLocalValue("archivedBills", []))
  );
}

function createLocalSnapshot() {
  return {
    schemaVersion: 1,
    bills: getLocalValue("bills", []),
    payments: getLocalValue("payments", []),
    activityLog: getLocalValue("activityLog", []),
    incomeSources: getLocalValue("incomeSources", []),
    settings: getLocalValue("settings", {}),
    archivedBills: getLocalValue("archivedBills", []),
    updatedAt: new Date().toISOString()
  };
}

function applyCloudSnapshot(data) {
  if (!data || typeof data !== "object") {
    return;
  }

  localStorage.setItem("bills", JSON.stringify(Array.isArray(data.bills) ? data.bills : []));
  localStorage.setItem(
    "payments",
    JSON.stringify(Array.isArray(data.payments) ? data.payments : [])
  );
  localStorage.setItem(
    "activityLog",
    JSON.stringify(Array.isArray(data.activityLog) ? data.activityLog : [])
  );
  localStorage.setItem(
    "incomeSources",
    JSON.stringify(Array.isArray(data.incomeSources) ? data.incomeSources : [])
  );
  localStorage.setItem(
    "settings",
    JSON.stringify(data.settings && typeof data.settings === "object" ? data.settings : {})
  );
  localStorage.setItem(
    "archivedBills",
    JSON.stringify(Array.isArray(data.archivedBills) ? data.archivedBills : [])
  );

  lastCloudUpdatedAt = data.updatedAt || null;
}

function renderUpdatedApp() {
  if (typeof window.initTheme === "function") {
    window.initTheme();
  }

  if (typeof window.render === "function") {
    window.render();
  }
}

async function saveNow() {
  if (!activeUserId || !cloudIsReady || saving) {
    return;
  }

  saving = true;

  try {
    const householdRef = doc(db, "households", activeUserId);
    const snapshot = createLocalSnapshot();

    await setDoc(householdRef, snapshot, { merge: true });

    lastCloudUpdatedAt = snapshot.updatedAt;
    console.log("Bill Beacon household saved to Firestore.");
  } catch (error) {
    console.error("Bill Beacon Firestore save failed:", error);
  } finally {
    saving = false;
  }
}

function queueSave() {
  if (!activeUserId || !cloudIsReady) {
    return;
  }

  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    saveNow();
  }, 600);
}

async function startHouseholdSync(user) {
  if (!user?.uid) {
    return;
  }

  if (activeUserId === user.uid && cloudIsReady) {
    return;
  }

  stopHouseholdSync();

  activeUserId = user.uid;

  const householdRef = doc(db, "households", activeUserId);

  try {
    const cloudDocument = await getDoc(householdRef);

    if (cloudDocument.exists()) {
      const cloudData = cloudDocument.data();

      applyCloudSnapshot(cloudData);

      console.log("Bill Beacon household loaded from Firestore.");
    } else {
      const firstSnapshot = createLocalSnapshot();

      /*
       * First-device migration:
       * If this browser already has bill data, upload it.
       * If it is a new empty device, create a safe empty household document.
       */
      if (!localHouseholdHasData()) {
        firstSnapshot.bills = [];
        firstSnapshot.payments = [];
        firstSnapshot.activityLog = [];
        firstSnapshot.incomeSources = [];
        firstSnapshot.archivedBills = [];
      }

      await setDoc(householdRef, firstSnapshot);

      lastCloudUpdatedAt = firstSnapshot.updatedAt;

      console.log("Bill Beacon household created in Firestore.");
    }

    cloudIsReady = true;

    renderUpdatedApp();

    unsubscribeFromHousehold = onSnapshot(
      householdRef,
      (snapshot) => {
        if (!snapshot.exists() || !cloudIsReady) {
          return;
        }

        const cloudData = snapshot.data();

        /*
         * Ignore the same document version this device just saved.
         * This prevents unnecessary self-renders.
         */
        if (
          cloudData.updatedAt &&
          cloudData.updatedAt === lastCloudUpdatedAt
        ) {
          return;
        }

        applyCloudSnapshot(cloudData);

        console.log("Bill Beacon household updated from another device.");

        renderUpdatedApp();
      },
      (error) => {
        console.error("Bill Beacon Firestore live sync failed:", error);
      }
    );
  } catch (error) {
    cloudIsReady = false;
    console.error("Bill Beacon Firestore startup failed:", error);
    alert(
      "You are signed in, but Bill Beacon could not load shared household data. " +
      "Check your Firestore rules and refresh."
    );
  }
}

function stopHouseholdSync() {
  clearTimeout(saveTimer);

  if (unsubscribeFromHousehold) {
    unsubscribeFromHousehold();
    unsubscribeFromHousehold = null;
  }

  activeUserId = null;
  cloudIsReady = false;
  saving = false;
  lastCloudUpdatedAt = null;
}

window.addEventListener("billbeacon:authenticated", (event) => {
  startHouseholdSync(event.detail?.user);
});

window.addEventListener("billbeacon:signed-out", () => {
  stopHouseholdSync();
});

window.addEventListener("billbeacon:data-changed", () => {
  queueSave();
});

export {
  startHouseholdSync,
  stopHouseholdSync,
  queueSave,
  saveNow
};