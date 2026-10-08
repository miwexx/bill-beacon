
import { initializeApp, getApps, getApp } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
runTransaction,
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


const STORAGE_KEYS = ["bills", "payments", "activityLog", "incomeSources", "settings", "archivedBills"];
const PENDING_PREFIX = "billbeacon:pending-sync:";
const LOCAL_OWNER_KEY = "billbeacon:local-data-owner";
let activeUserId = null;
let activeHouseholdId = null;
let activeUser = null;
let cloudIsReady = false;
let sessionGeneration = 0;
let localRevision = 0;
let savedLocalRevision = 0;
let baseline = null;
let inFlight = null;
let saveTimer = null;
let retryTimer = null;
let retryDelay = 1000;
let unsubscribeFromHousehold = null;
let conflict = null;
let starting = false;
let statusMessage = "Signed out";

function assertSession(generation, uid = activeUserId) {
  if (generation !== sessionGeneration || uid !== activeUserId || !uid) {
    const error = new Error("The sign-in session changed."); error.code = "stale-session"; throw error;
  }
}

function getNotificationHouseholdContext() {
  return {uid: activeUserId, householdId: activeHouseholdId,
    ready: cloudIsReady, generation: sessionGeneration};
}
window.getBillBeaconHouseholdContext = getNotificationHouseholdContext;
function setSyncStatus(state, message) {
  statusMessage = message;
  window.dispatchEvent(new CustomEvent("billbeacon:sync-status", {detail: {state, message}}));
}

function getLocalValue(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw); }
  catch { throw new Error(`Saved ${key} data is invalid. Restore a backup before syncing.`); }
}

function normalizeSnapshot(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid household snapshot.");
  const result = {};
  for (const key of STORAGE_KEYS) {
    const value = data[key] ?? (key === "settings" ? {} : []);
    if (key === "settings") {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid settings snapshot.");
    } else if (!Array.isArray(value)) throw new Error(`Invalid ${key} snapshot.`);
    result[key] = value;
  }
  return result;
}

function createLocalSnapshot() {
  const result = {};
  for (const key of STORAGE_KEYS) result[key] = getLocalValue(key, key === "settings" ? {} : []);
  return normalizeSnapshot(result);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}

function snapshotVersion(data) {
  if (!data) return null;
  return JSON.stringify(canonical({records: normalizeSnapshot(data), updatedAt: data.updatedAt || null,
    syncRevision: Number(data.syncRevision || 0)}));
}

function hasLocalChanges() { return localRevision > savedLocalRevision; }

function pendingKey(uid = activeUserId, householdId = activeHouseholdId) {
  return PENDING_PREFIX + encodeURIComponent(uid) + ":" + encodeURIComponent(householdId);
}

function readPending(uid = activeUserId, householdId = activeHouseholdId) {
  if (!uid || !householdId) return null;
  try { return JSON.parse(localStorage.getItem(pendingKey(uid, householdId)) || "null"); }
  catch { throw new Error("The pending-sync recovery record is invalid. Export local data before continuing."); }
}

function persistPending() {
  if (!activeUserId || !activeHouseholdId) return;
  localStorage.setItem(pendingKey(), JSON.stringify({uid: activeUserId, householdId: activeHouseholdId,
    baseline, snapshot: createLocalSnapshot(), savedAt: new Date().toISOString()}));
}

function clearPending(uid, householdId) {
  const pending = readPending(uid, householdId);
  if (pending?.uid === uid && pending?.householdId === householdId) localStorage.removeItem(pendingKey(uid, householdId));
}

function applyCloudSnapshot(data) {
  const snapshot = normalizeSnapshot(data);
  const previous = new Map(STORAGE_KEYS.map(key => [key, localStorage.getItem(key)]));
  try { for (const key of STORAGE_KEYS) localStorage.setItem(key, JSON.stringify(snapshot[key])); }
  catch (error) {
    let rollbackFailed = false;
    for (const [key, value] of previous) {
      try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); }
      catch { rollbackFailed = true; }
    }
    if (rollbackFailed) throw new Error("Cloud load failed and rollback was incomplete. Recover your backup before editing.");
    throw error;
  }
}

function renderUpdatedApp() {
  if (typeof window.initTheme === "function") window.initTheme();
  if (typeof window.render === "function") window.render();
}

function downloadSyncRecovery() {
  const backup = {app: "Bill Beacon", version: 2, exportedAt: new Date().toISOString(),
    ...createLocalSnapshot(), syncRecovery: {uid: activeUserId, householdId: activeHouseholdId,
      sharedSnapshot: conflict?.data || null}};
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], {type: "application/json"}));
  const link = document.createElement("a"); link.href = url; link.download = "bill-beacon-sync-recovery.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showConflictPanel() {
  if (!conflict || document.getElementById("billBeaconSyncConflict")) return;
  const panel = document.createElement("section"); panel.id = "billBeaconSyncConflict";
  panel.setAttribute("role", "alertdialog"); panel.setAttribute("aria-label", "Household sync conflict");
  panel.style.cssText = "position:fixed;left:12px;right:12px;bottom:20px;z-index:10050;padding:18px;background:#172025;color:white;border:2px solid #f59e0b;border-radius:14px;box-shadow:0 8px 30px #0008";
  const text = document.createElement("p");
  text.textContent = "Sync paused: shared data changed while this device had unsaved edits. Your local data has not been overwritten. Download recovery data before choosing a version.";
  panel.appendChild(text);
  for (const [label, action] of [["Download recovery", downloadSyncRecovery],
    ["Use shared version", useSharedVersion], ["Replace shared with this device", replaceSharedVersion]]) {
    const button = document.createElement("button"); button.type = "button"; button.textContent = label;
    button.style.cssText = "margin:6px;padding:10px;border-radius:8px;cursor:pointer";
    button.addEventListener("click", () => { Promise.resolve().then(action).catch(error => alert(error.message)); });
    panel.appendChild(button);
  }
  document.body.appendChild(panel);
}

function markConflict(data) {
  conflict = {data, version: snapshotVersion(data)};
  clearTimeout(saveTimer); clearTimeout(retryTimer);
  persistPending(); setSyncStatus("conflict", "Sync paused; choose a version after downloading recovery data.");
  showConflictPanel();
}

function clearConflict() { conflict = null; document.getElementById("billBeaconSyncConflict")?.remove(); }

function useSharedVersion() {
  if (!conflict || !activeUserId || !cloudIsReady) return;
  if (!confirm("Replace this device's local lists with the shared version? Unsaved local edits will be discarded. Download recovery first.")) return;
  applyCloudSnapshot(conflict.data || {}); baseline = conflict.version;
  savedLocalRevision = localRevision; clearPending(activeUserId, activeHouseholdId); clearConflict();
  renderUpdatedApp(); setSyncStatus("ready", "Shared version loaded.");
}

async function replaceSharedVersion() {
  if (!conflict || !activeUserId || !cloudIsReady) return;
  if (!confirm("Replace the household's shared bill and payment lists with this device's version? Other members' conflicting edits may be lost. Download recovery first.")) return;
  baseline = conflict.version; clearConflict(); localRevision += 1; persistPending();
  await saveNow();
}

function scheduleRetry(generation) {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (generation === sessionGeneration && cloudIsReady && hasLocalChanges() && !conflict) saveNow();
  }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, 30000);
}

async function saveNow() {
  if (!activeUserId || !activeHouseholdId || !cloudIsReady || conflict || !hasLocalChanges()) return false;
  if (inFlight) return inFlight.promise;
  const generation = sessionGeneration, uid = activeUserId, householdId = activeHouseholdId;
  const revision = localRevision, expectedVersion = baseline;
  const writeId = crypto.randomUUID();
  const operation = {writeId, promise: null}; inFlight = operation;
  operation.promise = (async () => {
    try {
      persistPending();
      const records = createLocalSnapshot();
      const reference = doc(db, "households", householdId);
      let writtenData = null;
      await runTransaction(db, async transaction => {
        assertSession(generation, uid);
        const current = await transaction.get(reference); assertSession(generation, uid);
        const remote = current.exists() ? current.data() : null;
        if (snapshotVersion(remote) !== expectedVersion) {
          const error = new Error("Shared data changed."); error.code = "sync-conflict"; error.remote = remote; throw error;
        }
        writtenData = {...records, schemaVersion: 1, updatedAt: new Date().toISOString(),
          syncRevision: Number(remote?.syncRevision || 0) + 1, syncWriteId: writeId};
        transaction.set(reference, writtenData, {merge: true});
      });
      assertSession(generation, uid);
      baseline = snapshotVersion(writtenData); savedLocalRevision = revision; retryDelay = 1000;
      if (hasLocalChanges()) persistPending(); else clearPending(uid, householdId);
      setSyncStatus("ready", hasLocalChanges() ? "Saving newer edits…" : "Household saved.");
      return true;
    } catch (error) {
      if (generation !== sessionGeneration || error.code === "stale-session") return false;
      if (error.code === "sync-conflict") markConflict(error.remote);
      else { console.error("Bill Beacon sync save failed:", error); setSyncStatus("error", "Save failed; local edits retained and retry scheduled."); scheduleRetry(generation); }
      return false;
    } finally {
      if (generation === sessionGeneration && inFlight === operation) {
        inFlight = null;
        if (hasLocalChanges() && !conflict && !retryTimer) queueSave(false);
      }
    }
  })();
  return operation.promise;
}

function queueSave(recordChange = true) {
  if (!activeUserId) return;
  if (recordChange) localRevision += 1;
  if (activeHouseholdId) {
    try { persistPending(); } catch (error) { setSyncStatus("error", error.message); console.error(error); return; }
  }
  if (!cloudIsReady || conflict) { if (conflict) showConflictPanel(); return; }
  clearTimeout(saveTimer); saveTimer = setTimeout(() => { saveTimer = null; saveNow(); }, 600);
}

function stopHouseholdSync() {
  sessionGeneration += 1; clearTimeout(saveTimer); clearTimeout(retryTimer);
  saveTimer = null; retryTimer = null;
  if (unsubscribeFromHousehold) unsubscribeFromHousehold(); unsubscribeFromHousehold = null;
  activeUserId = null; activeHouseholdId = null; activeUser = null; cloudIsReady = false;
  inFlight = null; baseline = null; localRevision = 0; savedLocalRevision = 0; starting = false;
  clearConflict(); setSyncStatus("signed-out", "Sync stopped. Pending edits remain in local recovery storage.");
}

async function resolveHouseholdId(user, generation) {
  assertSession(generation, user?.uid);
  const userRef = doc(db, "users", user.uid);
  let householdId = null;
  await runTransaction(db, async transaction => {
    assertSession(generation, user.uid);
    const profileSnapshot = await transaction.get(userRef); assertSession(generation, user.uid);
    if (profileSnapshot.exists()) {
      const profile = profileSnapshot.data();
      if (typeof profile.householdId !== "string" || !profile.householdId.trim()) throw new Error("Your household profile is incomplete. Ask the owner for a new invite.");
      householdId = profile.householdId.trim(); return;
    }
    householdId = user.uid;
    const memberRef = doc(db, "households", householdId, "members", user.uid);
    const memberSnapshot = await transaction.get(memberRef); assertSession(generation, user.uid);
    if (memberSnapshot.exists() && memberSnapshot.data().role !== "owner") throw new Error("Existing household membership requires review.");
    const now = new Date().toISOString();
    transaction.set(userRef, {householdId, role: "owner", email: user.email || "", createdAt: now, updatedAt: now});
    if (!memberSnapshot.exists()) transaction.set(memberRef, {uid: user.uid, email: user.email || "", role: "owner", joinedAt: now, updatedAt: now});
  });
  assertSession(generation, user.uid); return householdId;
}

async function startHouseholdSync(user) {
  if (!user?.uid || (activeUserId === user.uid && (cloudIsReady || starting))) return;
  stopHouseholdSync(); activeUserId = user.uid; activeUser = user; starting = true;
  const generation = sessionGeneration;
  try {
    const householdId = await resolveHouseholdId(user, generation); assertSession(generation, user.uid);
    activeHouseholdId = householdId;
    const reference = doc(db, "households", householdId);
    let cloudDocument = await getDoc(reference); assertSession(generation, user.uid);
    const pending = readPending();
    const matchingPending = pending?.uid === user.uid && pending?.householdId === householdId;
    let cloudData = cloudDocument.exists() ? cloudDocument.data() : null;
    const localOwner = JSON.parse(localStorage.getItem(LOCAL_OWNER_KEY) || "null");
    if (!cloudDocument.exists()) {
      let initial = createLocalSnapshot();
      const hasData = STORAGE_KEYS.some(key => key !== "settings" && initial[key].length);
      if ((localOwner && localOwner.uid !== user.uid) || (hasData && !matchingPending && !confirm("No shared household data exists yet. Upload this browser's local bills and payments to this signed-in household?"))) {
        initial = normalizeSnapshot({});
      }
      await runTransaction(db, async transaction => {
        assertSession(generation, user.uid);
        const existing = await transaction.get(reference); assertSession(generation, user.uid);
        if (existing.exists()) { cloudData = existing.data(); return; }
        cloudData = {...initial, schemaVersion: 1, updatedAt: new Date().toISOString(), syncRevision: 1};
        transaction.set(reference, cloudData);
      });
      assertSession(generation, user.uid);
    }
    cloudIsReady = true; starting = false;
    if (matchingPending) {
      applyCloudSnapshot(pending.snapshot); localRevision += 1; baseline = pending.baseline;
      if (snapshotVersion(cloudData) !== baseline) markConflict(cloudData);
    } else if (hasLocalChanges()) {
      baseline = snapshotVersion(cloudData); markConflict(cloudData);
    } else {
      applyCloudSnapshot(cloudData); baseline = snapshotVersion(cloudData);
    }
    localStorage.setItem(LOCAL_OWNER_KEY, JSON.stringify({uid: user.uid, householdId}));
    renderUpdatedApp();
    window.dispatchEvent(new CustomEvent("billbeacon:household-ready", {detail: getNotificationHouseholdContext()}));
    unsubscribeFromHousehold = onSnapshot(reference, snapshot => {
      if (generation !== sessionGeneration || !cloudIsReady || snapshot.metadata?.fromCache || snapshot.metadata?.hasPendingWrites) return;
      try {
        const data = snapshot.exists() ? snapshot.data() : null;
        if (data?.syncWriteId && data.syncWriteId === inFlight?.writeId) return;
        const version = snapshotVersion(data);
        if (version === baseline) return;
        if (hasLocalChanges() || inFlight || conflict) { markConflict(data); return; }
        applyCloudSnapshot(data || {}); baseline = version; renderUpdatedApp();
        setSyncStatus("ready", "Household updated from another device.");
      } catch (error) { setSyncStatus("error", error.message); console.error(error); }
    }, error => { if (generation === sessionGeneration) { setSyncStatus("error", "Live sync failed; local data retained."); console.error(error); } });
    if (!conflict) { setSyncStatus("ready", "Household loaded."); if (hasLocalChanges()) queueSave(false); }
  } catch (error) {
    if (generation !== sessionGeneration) return;
    starting = false; cloudIsReady = false; setSyncStatus("error", "Household loading failed; local data was retained.");
    console.error("Bill Beacon sync startup failed:", error);
    alert("Bill Beacon could not safely load household data. Your local data was retained. Check the connection and try again.");
  }
}

window.addEventListener("billbeacon:authenticated", event => { startHouseholdSync(event.detail?.user); });
window.addEventListener("billbeacon:signed-out", stopHouseholdSync);
window.addEventListener("billbeacon:data-changed", () => queueSave());
window.addEventListener("online", () => {
  if (!activeUser) return;
  if (!cloudIsReady) startHouseholdSync(activeUser); else if (hasLocalChanges() && !conflict) saveNow();
});
window.billBeaconSyncStatus = () => ({ready: cloudIsReady, pending: hasLocalChanges(), conflict: Boolean(conflict), message: statusMessage});
window.billBeaconPrepareDataTransfer = async function () {
  const generation = sessionGeneration;
  const uid = activeUserId;
  const householdId = activeHouseholdId;

  if (!uid || !householdId || !cloudIsReady) {
    throw new Error(
      "Wait until the shared household has loaded."
    );
  }

  if (conflict) {
    throw new Error(
      "Resolve the household sync conflict before exporting."
    );
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assertSession(generation, uid);

    if (
      !cloudIsReady ||
      activeHouseholdId !== householdId ||
      conflict
    ) {
      throw new Error(
        "Household state changed. Finish syncing and try again."
      );
    }

    if (!inFlight && !hasLocalChanges()) {
      return {
        householdId,
        snapshot: JSON.parse(
          JSON.stringify(createLocalSnapshot())
        )
      };
    }

    const saved = await saveNow();

    assertSession(generation, uid);

    if (!saved) {
      throw new Error(
        "Household save did not finish. " +
        "Your local data is still retained."
      );
    }
  }

  throw new Error(
    "Edits are still being saved. " +
    "Wait a moment and try again."
  );
};
export { startHouseholdSync, stopHouseholdSync, queueSave, saveNow };