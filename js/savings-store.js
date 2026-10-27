/* Shared household Savings Plan storage.
   Records savings activity; it does not move bank money.
   Unused $0 funds may be deleted. Archiving preserves balances and history. */
(() => {
  "use strict";
  if (window.BillBeaconSavingsStore) return;
  let sdkPromise;
  const sdk = () => sdkPromise ||= import(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
  ).catch(error => { sdkPromise = null; throw error; });
  const clone = value => JSON.parse(JSON.stringify(value));
  const canonical = value => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === "object" ? Object.fromEntries(
      Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  const fail = message => { throw new Error(message); };
  const integer = (value, min = 0, max = 1000000000000) =>
    Number.isSafeInteger(value) && value >= min && value <= max;
  const uuid = value => typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  const text = (value, max) => typeof value === "string" && value.length <= max;
  const day = value => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return y >= 1900 && date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  };
  const slot = value => typeof value === "string" && /^[1-9]\d*:\d{4}-\d{2}-\d{2}$/.test(value) &&
    day(value.slice(value.indexOf(":") + 1));

  function session() {
    const user = window.getBillBeaconFirebaseUser?.();
    const household = window.getBillBeaconHouseholdContext?.();
    const db = window.getBillBeaconFirestore?.();
    if (!user?.uid || !household?.ready || household.uid !== user.uid || !household.householdId || !db) {
      fail("Wait for your signed-in household to load.");
    }
    return {uid: user.uid, householdId: household.householdId, generation: household.generation, db};
  }
  function assertSession(saved) {
    const now = session();
    if (now.uid !== saved.uid || now.householdId !== saved.householdId || now.generation !== saved.generation) {
      fail("Account or household changed. Reopen Savings Plan.");
    }
  }
  function validate(value) {
    if (!value || !/^[A-Z]{3}$/.test(value.currency) || !Array.isArray(value.funds) || !Array.isArray(value.entries)) {
      fail("Saved savings data has an invalid format. Nothing was overwritten.");
    }
    if (value.funds.length > 100 || value.entries.length > 10000) {
      fail("Savings history exceeds the supported size. Do not delete history to bypass this limit.");
    }
    const funds = new Map(), ids = new Set(), groups = new Map(), balances = new Map(), slots = new Set();
    for (const f of value.funds) {
      if (!f || !uuid(f.id) || funds.has(f.id) || !text(f.name, 80) || !f.name.trim() ||
          !["goal", "sinking", "emergency"].includes(f.type) || !integer(f.opening) ||
          !(f.target === null || integer(f.target, 1)) || !integer(f.amount, 1) ||
          !["weekly", "biweekly", "monthly"].includes(f.cadence) || !day(f.first) || !day(f.created) ||
          !text(f.deadline, 10) || f.deadline && (!day(f.deadline) || f.deadline < f.first) ||
          !text(f.note, 200) || typeof f.paused !== "boolean" ||
          f.archivedAt !== undefined && (!text(f.archivedAt, 40) || !Number.isFinite(Date.parse(f.archivedAt)) || f.paused !== true) ||
          !integer(f.version, 1, 1000000) || !Array.isArray(f.skips) || f.skips.length > 10000 ||
          f.skips.some(key => !slot(key)) || new Set(f.skips).size !== f.skips.length ||
          !f.moves || typeof f.moves !== "object" || Array.isArray(f.moves) ||
          Object.entries(f.moves).some(([key, date]) => !slot(key) || !day(date))) {
        fail("A savings fund is invalid. Review the record before saving.");
      }
      funds.set(f.id, f);
      balances.set(f.id, f.opening);
    }
    for (const e of value.entries) {
      const f = funds.get(e?.fund);
      if (!e || !uuid(e.id) || ids.has(e.id) || !f || !uuid(e.group) || !day(e.date) || e.date < f.created ||
          !text(e.note, 200) || typeof e.voided !== "boolean" || !integer(e.delta, -1000000000000) || e.delta === 0 ||
          !["Contribution", "Withdrawal", "Move in", "Move out"].includes(e.kind) || !text(e.slot, 100) ||
          e.slot && (e.kind !== "Contribution" || !slot(e.slot)) ||
          ((e.kind === "Contribution" || e.kind === "Move in") !== (e.delta > 0))) {
        fail("A savings history entry is invalid. Nothing was overwritten.");
      }
      ids.add(e.id);
      if (!groups.has(e.group)) groups.set(e.group, []);
      groups.get(e.group).push(e);
      if (!e.voided) {
        balances.set(e.fund, balances.get(e.fund) + e.delta);
        if (e.slot) {
          const key = JSON.stringify([e.fund, e.slot]);
          if (slots.has(key)) fail("The same scheduled contribution was recorded twice.");
          slots.add(key);
        }
      }
    }
    for (const group of groups.values()) {
      const moves = group.filter(e => e.kind === "Move in" || e.kind === "Move out");
      if (!moves.length) {
        if (group.length !== 1) fail("Invalid savings history group.");
        continue;
      }
      if (group.length !== 2 || moves.length !== 2 || group[0].fund === group[1].fund ||
          group[0].delta + group[1].delta !== 0 || group[0].date !== group[1].date || group[0].voided !== group[1].voided) {
        fail("Both sides of a savings move must balance and be reversed together.");
      }
    }
    for (const balance of balances.values()) {
      if (!integer(balance)) fail("A fund balance would be negative or exceed the supported limit.");
    }
    if (new TextEncoder().encode(JSON.stringify(value)).length > 700000) {
      fail("Savings history is approaching the document size limit. Nothing was trimmed or deleted.");
    }
    return value;
  }
  function read(snapshot, defaultCurrency) {
    if (!snapshot.exists()) return {exists: false, revision: 0, writeId: null, currency: defaultCurrency, funds: [], entries: []};
    const data = snapshot.data();
    if (data.schemaVersion !== 1 || !integer(data.revision, 1, Number.MAX_SAFE_INTEGER) || !uuid(data.writeId)) {
      fail("The saved Savings Plan version is not supported. Nothing was overwritten.");
    }
    validate(data);
    return {exists: true, revision: data.revision, writeId: data.writeId, currency: data.currency,
      funds: clone(data.funds), entries: clone(data.entries)};
  }
function preserveHistory(previous, next) {
    const funds = new Map(next.funds.map(f => [f.id, f]));
    for (const old of previous.funds) {
      const f = funds.get(old.id);

      if (!f) {
        const hasHistory =
          previous.entries.some(e => e.fund === old.id) ||
          next.entries.some(e => e.fund === old.id);

        if (old.opening !== 0 || hasHistory) {
          fail(
            "A plan with savings or history cannot be deleted. " +
            "Archive it instead."
          );
        }

        continue;
      }

      if (
        f.opening !== old.opening ||
        f.created !== old.created
      ) {
        fail(
          "Existing funds and starting balances cannot " +
          "be silently removed or rewritten."
        );
      }
    }
    const entries = new Map(next.entries.map(e => [e.id, e]));
    for (const old of previous.entries) {
      const e = entries.get(old.id);
      if (!e) fail("Existing savings history cannot be deleted.");
      const {voided: oldVoided, ...oldFields} = old;
      const {voided: newVoided, ...newFields} = e;
      if (JSON.stringify(canonical(oldFields)) !== JSON.stringify(canonical(newFields)) || (oldVoided && !newVoided)) {
        fail("Existing history cannot be rewritten. Reverse the original record instead.");
      }
    }
  }
  function watch(currency, onData, onError, onConnection = () => {}) {
    const saved = session();
    let active = true, unsubscribe = null;
    (async () => {
      const F = await sdk();
      if (!active) return;
      assertSession(saved);
      const reference = F.doc(saved.db, "households", saved.householdId, "savingsPlans", "main");
      unsubscribe = F.onSnapshot(reference, {includeMetadataChanges: true}, snapshot => {
        if (!active) return;
        try {
          assertSession(saved);
          const confirmed = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
          onConnection(confirmed);
          if (!confirmed) return;
          onData(read(snapshot, currency));
        } catch (error) {onError(error);}
      }, error => {if (active) onError(error);});
    })().catch(error => {if (active) onError(error);});
    return () => {active = false; unsubscribe?.();};
  }
  async function save(value, expectedRevision, writeId) {
    const saved = session();
    if (navigator.onLine === false) fail("Connect to the internet before saving Savings Plan.");
    if (!uuid(writeId) || !integer(expectedRevision, 0, Number.MAX_SAFE_INTEGER)) fail("Invalid savings save request.");
    const payload = clone({currency: value.currency, funds: value.funds, entries: value.entries});
    validate(payload);
    const F = await sdk();
    assertSession(saved);
    const reference = F.doc(saved.db, "households", saved.householdId, "savingsPlans", "main");
    const result = await F.runTransaction(saved.db, async transaction => {
      assertSession(saved);
      const snapshot = await transaction.get(reference);
      assertSession(saved);
      const previous = read(snapshot, payload.currency);
      if (previous.writeId === writeId) return previous;
      if (previous.revision !== expectedRevision) {
        const error = new Error("Another household member changed Savings Plan. Reload and review before saving again.");
        error.code = "savings/conflict"; error.remote = previous; throw error;
      }
      if (previous.exists && previous.currency !== payload.currency) {
        fail("The savings currency cannot be changed by relabeling its amounts.");
      }
      preserveHistory(previous, payload);
      const data = {schemaVersion: 1, ...payload, revision: previous.revision + 1, writeId,
        createdBy: snapshot.exists() ? snapshot.data().createdBy : saved.uid, updatedBy: saved.uid,
        createdAt: snapshot.exists() ? snapshot.data().createdAt : F.serverTimestamp(), updatedAt: F.serverTimestamp()};
      transaction.set(reference, data);
      return {exists: true, revision: data.revision, writeId, ...clone(payload)};
    });
    assertSession(saved);
    return result;
  }
  window.BillBeaconSavingsStore = Object.freeze({version: "1.1.0", watch, save});
})();
