
/* ============================================
   Bill Tracker PWA — App Logic
   ============================================ */

// ====================================
// CONSTANTS
// ====================================

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
  { id: 'paymentplans', label: 'Installments', icon: 'Subscription', color: 'cat-paymentplans' },
  { id: 'health', label: 'Health', icon: 'cross', color: 'cat-health' },
  { id: 'education', label: 'Education', icon: 'graduationcap', color: 'cat-education' },
  { id: 'other', label: 'Other', icon: 'doc', color: 'cat-other' },
];

const RECURRENCE = ['None', 'Weekly', 'Every 2 Weeks', 'Monthly', 'Quarterly', 'Yearly'];

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
  search: `<path d="M10.8 4a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6Zm0 2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm6.7 10.1 3.3 3.3-1.4 1.4-3.3-3.3 1.4-1.4Z" fill="currentColor" />`,
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
  window.dispatchEvent(new CustomEvent("billbeacon:data-changed"));
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
  const idx = bills.findIndex(bill => bill.id === id);

  if (idx < 0) return null;

  const previousBill = { ...bills[idx] };

  preserveBillPaymentSnapshots(previousBill);

  const now = new Date();
  const updatedAt = now.toISOString();

  const effectiveFrom = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const updatedBill = {
    ...previousBill,
    ...updates,
    updatedAt
  };

  const buildScheduleSnapshot = bill => ({
    name: bill.name || "Bill",
    amount: Number(bill.amount || 0),
    category: bill.category || "other",
    dueDate: bill.dueDate || null,
    dueDay: bill.dueDay ?? null,
    recurrence: bill.recurrence || "None",
    payCycle: bill.payCycle || null,
    paycheckAssignment: bill.paycheckAssignment || "auto",
    paymentMethod: bill.paymentMethod || "",
    paymentUrl: bill.paymentUrl || "",
    autopay: Boolean(bill.autopay),
    notes: bill.notes || "",
    reminderOffsets: Array.isArray(bill.reminderOffsets)
      ? [...bill.reminderOffsets]
      : []
  });

  const previousSchedule = buildScheduleSnapshot(previousBill);
  const updatedSchedule = buildScheduleSnapshot(updatedBill);

  const scheduleChanged =
    JSON.stringify(previousSchedule) !==
    JSON.stringify(updatedSchedule);

  const hasRecurringHistory =
    Array.isArray(previousBill.scheduleHistory) &&
    previousBill.scheduleHistory.length > 0;

  const shouldTrackSchedule =
    isRecurringBill(previousBill) ||
    isRecurringBill(updatedBill) ||
    hasRecurringHistory;

  if (scheduleChanged && shouldTrackSchedule) {
    const history = hasRecurringHistory
      ? previousBill.scheduleHistory.map(version => ({
          ...version,
          snapshot: {
            ...version.snapshot,
            reminderOffsets: Array.isArray(
              version.snapshot?.reminderOffsets
            )
              ? [...version.snapshot.reminderOffsets]
              : []
          }
        }))
      : [{
          version: 1,
          effectiveFrom: null,
          capturedAt: updatedAt,
          captureSource: "legacy-available-schedule",
          snapshot: previousSchedule
        }];

    history.push({
      version: 1,
      effectiveFrom,
      capturedAt: updatedAt,
      captureSource: "bill-edited",
      snapshot: updatedSchedule
    });

    updatedBill.scheduleHistory = history;
  } else if (hasRecurringHistory) {
    updatedBill.scheduleHistory = previousBill.scheduleHistory;
  } else {
    delete updatedBill.scheduleHistory;
  }

  bills[idx] = updatedBill;
  this.saveBills(bills);

  return updatedBill;
},
  deleteBill(id) {
  const bill = this.getBill(id);
  if (!bill) return;
    preserveBillPaymentSnapshots(bill);
  const archivedBills = getArchivedBills();

  if (!archivedBills.some(item => item.id === id)) {
    archivedBills.push({
      ...bill,
      archivedAt: new Date().toISOString()
    });

    saveArchivedBills(archivedBills);
  }

  // Remove only the active bill. Preserve all payment records.
  this.saveBills(
    this.getBills().filter(item => item.id !== id)
  );
},
  getPayments() {
    try { return JSON.parse(localStorage.getItem('payments') || '[]'); }
    catch { return []; }
  },
  savePayments(payments) {
  const existingPayments = this.getPayments();

  const existingById = new Map(
    existingPayments
      .filter(payment => payment.id)
      .map(payment => [payment.id, payment])
  );

  const preservedPayments = payments.map(payment => {
    const previous = payment.id
      ? existingById.get(payment.id)
      : null;

    if (previous?.billSnapshot) {
      return {
        ...payment,
        billSnapshot: previous.billSnapshot
      };
    }

    return attachPaymentBillSnapshot(
      payment,
      Boolean(previous)
    );
  });

  localStorage.setItem(
    "payments",
    JSON.stringify(preservedPayments)
  );

  window.dispatchEvent(
    new CustomEvent("billbeacon:data-changed")
  );
},
     getBankTransactions() {
  try {
    return JSON.parse(
      localStorage.getItem("bankTransactions")
    ) || [];
  } catch {
    return [];
  }
},

saveBankTransactions(transactions) {
  localStorage.setItem(
    "bankTransactions",
    JSON.stringify(transactions)
  );

  window.dispatchEvent(
    new CustomEvent("billbeacon:data-changed")
  );
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
  window.dispatchEvent(new CustomEvent("billbeacon:data-changed"));
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
  window.dispatchEvent(new CustomEvent("billbeacon:data-changed"));
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
      title: `${bill?.name || "Bill"} Payment Reversed`,
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
    window.dispatchEvent(new CustomEvent("billbeacon:data-changed"));
     },
};
function createPaymentBillSnapshot(payment, bill, isLegacy = false) {
  if (!bill) return null;

  const expectedAmount = isLegacy
    ? (
        payment.expectedAmountAtMatch != null
          ? Number(payment.expectedAmountAtMatch)
          : null
      )
    : Number(bill.amount);

  return {
    version: 1,
    billId: payment.billId,
    name: bill.name || "Bill",
    category: bill.category || "other",

    // For older records, do not pretend the current estimate
    // was necessarily the estimate when payment was recorded.
    amount: Number.isFinite(expectedAmount)
      ? expectedAmount
      : null,

    dueDate: payment.paidForDueDate || null,
    recurrence: bill.recurrence || "None",
    dueDay: bill.dueDay ?? null,
    paycheckAssignment: bill.paycheckAssignment || "auto",

    installmentPlanId: bill.installmentPlanId || null,
    installmentProvider: bill.installmentProvider || null,
    installmentStore: bill.installmentStore || null,
    installmentNumber: bill.installmentNumber || null,
    installmentTotal: bill.installmentTotal || null,

    capturedAt: new Date().toISOString(),
    captureSource: isLegacy
      ? "legacy-available-bill-details"
      : "payment-recorded"
  };
}

function attachPaymentBillSnapshot(payment, isLegacy = false) {
  if (payment.billSnapshot) return payment;

  const bill =
    Store.getBill(payment.billId) ||
    getArchivedBills().find(item => item.id === payment.billId);

  const snapshot = createPaymentBillSnapshot(
    payment,
    bill,
    isLegacy
  );

  return snapshot
    ? { ...payment, billSnapshot: snapshot }
    : payment;
}

function preserveBillPaymentSnapshots(bill) {
  if (!bill) return;

  let changed = false;

  const payments = Store.getPayments().map(payment => {
    if (
      payment.billId !== bill.id ||
      payment.billSnapshot
    ) {
      return payment;
    }

    const snapshot = createPaymentBillSnapshot(
      payment,
      bill,
      true
    );

    if (!snapshot) return payment;

    changed = true;
    return { ...payment, billSnapshot: snapshot };
  });

  if (changed) {
    Store.savePayments(payments);
  }
}

// ====================================
// UTILITIES
// ====================================
function getDemoBankTransactions() {
  // Compatibility entry point; never seed fake transactions into financial data.
  return Store.getBankTransactions();
}


async function refreshBillBeaconApp() {
  try {
    if (!("serviceWorker" in navigator)) {
      window.location.reload();
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      window.location.reload();
      return;
    }

    await registration.update();

    if (registration.waiting) {
      registration.waiting.postMessage({
        type: "SKIP_WAITING"
      });

      alert(
        "Bill Beacon is updating. The app will reload in a moment."
      );

      return;
    }

    alert(
      "Bill Beacon is checking for updates. Close and reopen the app once if an update prompt appears."
    );
  } catch (error) {
    console.error("Could not refresh Bill Beacon:", error);

    alert(
      "Could not check for an update. Check your internet connection and try again."
    );
  }
}
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
              textContent: '${escapeInlineString(getBrandInitials(brand))}',
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
  const deletionActions = [
    "bill_deleted",
    "bill_archived",
    "payment_plan_cancelled",
  ];

  const isDeletionActivity = deletionActions.includes(action);
  const planId =
    before?.installmentPlanId ||
    before?.planId ||
    after?.installmentPlanId ||
    after?.planId ||
    null;

  /*
    Payment-plan deletion can pass through legacy code that tries to log
    each installment separately. Keep one activity record for that plan
    deletion action and ignore the duplicate installment records.
  */
  if (isDeletionActivity && planId) {
    const now = Date.now();

    const duplicateAlreadyLogged = Store.getActivityLog().some((entry) => {
      const entryTimestamp = new Date(entry.timestamp).getTime();

      const entryPlanId =
        entry.before?.installmentPlanId ||
        entry.before?.planId ||
        entry.after?.installmentPlanId ||
        entry.after?.planId ||
        null;

      return (
        deletionActions.includes(entry.action) &&
        entryPlanId === planId &&
        Number.isFinite(entryTimestamp) &&
        now - entryTimestamp >= 0 &&
        now - entryTimestamp < 5000
      );
    });

    if (duplicateAlreadyLogged) {
      return;
    }
  }

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
function buildDeletedDetail(bill) {
  const amount = formatCurrency(bill.amount);

  if (bill.recurrence && bill.recurrence !== "None") {
    return `${amount} · repeats ${bill.recurrence.toLowerCase()}`;
  }

  if (bill.dueDay) {
    return `${amount} · due on the ${bill.dueDay}${getOrdinalSuffix(bill.dueDay)}`;
  }

  if (bill.dueDate) {
    return `${amount} · due ${formatDate(bill.dueDate, "short")}`;
  }

  return amount;
}

function getOrdinalSuffix(day) {
  const value = Number(day);
  if ([11, 12, 13].includes(value % 100)) return "th";
  if (value % 10 === 1) return "st";
  if (value % 10 === 2) return "nd";
  if (value % 10 === 3) return "rd";
  return "th";
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
    case 'Every 2 Weeks': d.setDate(d.getDate() + 14); break;
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
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > 9999) return null;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date.toISOString() : null;
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
  const referenceDate = new Date(year, month, 1, 12);
  const occurrence = getCurrentCalendarBillOccurrence(bill, referenceDate);
  if (occurrence) return occurrence.dueDate;
  if (Array.isArray(bill.scheduleHistory) && bill.scheduleHistory.length) return null;
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

  if (bill.recurrence === 'Weekly' || bill.recurrence === 'Every 2 Weeks') {
    const intervalDays = bill.recurrence === 'Every 2 Weeks' ? 14 : 7;
    const candidate = new Date(
      originalDueDate.getFullYear(),
      originalDueDate.getMonth(),
      originalDueDate.getDate(),
      12,
      0,
      0
    );

    while (candidate < start) {
      candidate.setDate(candidate.getDate() + intervalDays);
    }

    while (candidate <= end) {
      occurrenceDates.push(new Date(candidate));
      candidate.setDate(candidate.getDate() + intervalDays);
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

function getBillScheduleVersions(bill) {
  const history = Array.isArray(bill.scheduleHistory)
    ? bill.scheduleHistory.filter(v => v && v.snapshot)
    : [];
  if (!history.length) return [{effectiveFrom: null, snapshot: bill}];
  return history.map((v, index) => ({...v, index})).sort((a, b) =>
    String(a.effectiveFrom || "").localeCompare(String(b.effectiveFrom || "")) ||
    a.index - b.index
  );
}

function getBillScheduleAtDate(bill, dateValue) {
  const key = getLocalDateKey(dateValue);
  const versions = getBillScheduleVersions(bill);
  let selected = versions[0];
  for (const version of versions) {
    if (!version.effectiveFrom || version.effectiveFrom <= key) selected = version;
  }
  return {...bill, ...selected.snapshot, id: bill.id};
}

function getCalendarScheduleSlot(recurrence, dateValue, anchorValue = dateValue) {
  const date = new Date(dateValue);
  if (recurrence === "Every 2 Weeks") {
    const anchor = new Date(anchorValue);
    const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const origin = Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    return `fortnight:${Math.floor((day - origin) / (14 * 86400000))}`;
  }
  if (recurrence === "Weekly") {
    date.setDate(date.getDate() - (date.getDay() + 6) % 7);
    return `week:${getLocalDateKey(date)}`;
  }
  if (recurrence === "Yearly") return `year:${date.getFullYear()}`;
  if (recurrence === "Quarterly") return `quarter:${date.getFullYear()}-${Math.floor(date.getMonth() / 3)}`;
  return `month:${date.getFullYear()}-${date.getMonth()}`;
}

function getVersionedBillOccurrences(bill, referenceDate) {
  const monthKey = value => {
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}`;
  };
  const targetMonth = monthKey(referenceDate);
  const versions = getBillScheduleVersions(bill);
  const calendarScheduleSlot = (recurrence, value) => getCalendarScheduleSlot(
    recurrence, value, versions[0]?.snapshot?.dueDate || bill.dueDate
  );
  const candidates = new Map();
  const payments = Store.getPaymentsForBill(bill.id).map(payment => {
    const key = getPaymentOccurrenceDateKey(payment);
    return !payment.paidForDueDate && key
      ? {...payment, paidForDueDate: dateFromInput(key)} : payment;
  }).sort((a, b) =>
    Number(a.status !== "voided") - Number(b.status !== "voided") ||
    new Date(a.paidDate) - new Date(b.paidDate)
  );
  const hasVersions = versions.length > 1;
  const archiveKey = bill.archivedAt ? getLocalDateKey(bill.archivedAt) : null;

  const addScheduled = (versionIndex, originalDueDate) => {
    const version = versions[versionIndex];
    const key = getLocalDateKey(originalDueDate);
    const next = versions[versionIndex + 1];
    if (!key) return;
    const explicitOverride = (bill.occurrenceOverrides || []).find(item =>
      getLocalDateKey(item.originalDueDate) === key && !item.cancelled && item.postponedTo
    );
    if (!explicitOverride) {
      if (version.effectiveFrom && key < version.effectiveFrom) return;
      if (next?.effectiveFrom && key >= next.effectiveFrom) return;
    } else {
      const recordedKey = explicitOverride.postponedAt
        ? getLocalDateKey(explicitOverride.postponedAt) : key;
      let owner = 0;
      versions.forEach((item, index) => {
        if (!item.effectiveFrom || item.effectiveFrom <= recordedKey) owner = index;
      });
      if (owner !== versionIndex) return;
    }
    if (archiveKey && key >= archiveKey) return;
    const schedule = {...bill, ...version.snapshot, id: bill.id};
    const occurrence = createBillOccurrence(schedule, originalDueDate);
    if (!occurrence || monthKey(occurrence.dueDate) !== targetMonth) return;
    const slot = calendarScheduleSlot(schedule.recurrence, originalDueDate);
    if (hasVersions) {
      const priorObligation = versions.slice(0, versionIndex).some((prior, priorIndex) => {
        const priorSchedule = {...bill, ...prior.snapshot, id: bill.id};
        if (!isRecurringBill(priorSchedule)) return false;
        const priorEnd = versions[priorIndex + 1]?.effectiveFrom;
        const date = new Date(originalDueDate);
        const offsets = schedule.recurrence === "Yearly" ? Array.from({length: 12}, (_, i) => -i)
          : schedule.recurrence === "Quarterly" ? [0, -1, -2] : [0, -1];
        return offsets.some(offset => getMonthOccurrenceDates(priorSchedule,
          new Date(date.getFullYear(), date.getMonth() + offset, 1, 12)
        ).some(value => {
          const key = getLocalDateKey(value);
          return (!prior.effectiveFrom || key >= prior.effectiveFrom) &&
            (!priorEnd || key < priorEnd) &&
            calendarScheduleSlot(priorSchedule.recurrence, value) === slot;
        }));
      });
      if (priorObligation) return;
      const recordedElsewhere = payments.some(payment => {
        if (!payment.paidForDueDate) return false;
        const original = payment.originalDueDate || payment.paidForDueDate;
        const recurrence = payment.billSnapshot?.recurrence || schedule.recurrence;
        return calendarScheduleSlot(recurrence, original) === slot &&
          getLocalDateKey(payment.paidForDueDate) !== getLocalDateKey(occurrence.dueDate);
      });
      if (recordedElsewhere) return;
      const pinnedElsewhere = (bill.occurrenceOverrides || []).some(item => {
        if (item.cancelled || !item.postponedTo || !item.originalDueDate) return false;
        const recordedKey = item.postponedAt ? getLocalDateKey(item.postponedAt) : getLocalDateKey(item.originalDueDate);
        let owner = 0;
        versions.forEach((v, i) => {
          if (!v.effectiveFrom || v.effectiveFrom <= recordedKey) owner = i;
        });
        return (owner < versionIndex || (item.scheduleSnapshot &&
          getLocalDateKey(item.originalDueDate) !== getLocalDateKey(originalDueDate))) &&
          calendarScheduleSlot(item.scheduleSnapshot?.recurrence || versions[owner].snapshot.recurrence, item.originalDueDate) === slot;
      });
      if (pinnedElsewhere) return;
    }
    const earlier = [...candidates.values()].find(item => item.scheduleSlot === slot);
    // Preserve the old obligation when its date predates a mid-period edit.
    if (hasVersions && earlier && earlier.scheduleVersionIndex < versionIndex) return;
    candidates.set(occurrence.occurrenceKey, {
      ...occurrence,
      scheduleSlot: slot,
      scheduleVersionIndex: versionIndex,
      isArchivedHistory: Boolean(bill.archivedAt)
    });
  };

  versions.forEach((version, index) => {
    const schedule = {...bill, ...version.snapshot, id: bill.id};
    if (!isRecurringBill(schedule)) {
      if (schedule.dueDate) addScheduled(index, schedule.dueDate);
      return;
    }
    getMonthOccurrenceDates(schedule, referenceDate).forEach(date => addScheduled(index, date));
    // Include an occurrence moved here from another month, even years earlier.
    for (const override of bill.occurrenceOverrides || []) {
      if (!override.originalDueDate || !override.postponedTo || override.cancelled) continue;
      if (monthKey(override.postponedTo) !== targetMonth) continue;
      const sourceMonth = new Date(override.originalDueDate);
      const scheduled = getMonthOccurrenceDates(schedule, sourceMonth).some(date =>
        getLocalDateKey(date) === getLocalDateKey(override.originalDueDate)
      );
      if (scheduled) addScheduled(index, override.originalDueDate);
    }
  });

  for (const override of bill.occurrenceOverrides || []) {
    if (override.cancelled || !override.scheduleSnapshot || !override.postponedTo) continue;
    if (monthKey(override.postponedTo) !== targetMonth) continue;
    if (archiveKey && getLocalDateKey(override.postponedTo) >= archiveKey) continue;
    const schedule = {...bill, ...override.scheduleSnapshot, id: bill.id};
    const occurrence = createBillOccurrence(schedule, override.originalDueDate);
    if (!occurrence) continue;
    const slot = calendarScheduleSlot(schedule.recurrence, override.originalDueDate);
    for (const [key, candidate] of candidates) {
      if (candidate.scheduleSlot === slot && candidate.occurrenceKey !== occurrence.occurrenceKey) candidates.delete(key);
    }
    candidates.set(occurrence.occurrenceKey, {...occurrence, scheduleSlot: slot,
      isArchivedHistory: Boolean(bill.archivedAt)});
  }

  // A recorded occurrence keeps its date even if a later edit moved the template.
  // Voided records also anchor the obligation, so reversal restores the same bill.
  for (const payment of payments) {
    const dueDate = payment.paidForDueDate;
    if (!dueDate || monthKey(dueDate) !== targetMonth) continue;
    const matched = [...candidates.values()].find(item =>
      getLocalDateKey(item.dueDate) === getLocalDateKey(dueDate)
    );
    const schedule = getBillScheduleAtDate(bill, dueDate);
    const snapshot = payment.billSnapshot || {};
    const recurrence = snapshot.recurrence || schedule.recurrence;
    if (!isRecurringBill({recurrence}) && !hasVersions && !matched) continue;
    const originalDueDate = payment.originalDueDate || matched?.originalDueDate || dueDate;
    const slot = calendarScheduleSlot(recurrence, originalDueDate);
    if (hasVersions) {
      for (const [candidateKey, candidate] of candidates) {
        if (candidate.scheduleSlot === slot &&
            getLocalDateKey(candidate.dueDate) !== getLocalDateKey(dueDate)) {
          candidates.delete(candidateKey);
        }
      }
    }
    const occurrenceKey = matched?.occurrenceKey || getOccurrenceKey(bill.id, originalDueDate);
    const expected = snapshot.amount ?? payment.expectedAmountAtMatch ??
      matched?.amount ?? payment.amount;
    candidates.set(occurrenceKey, {
      ...schedule,
      ...(matched || {}),
      ...snapshot,
      id: occurrenceKey,
      occurrenceKey,
      templateId: getRecurringTemplateId(bill),
      sourceBillId: bill.id,
      dueDate,
      originalDueDate,
      amount: Number(expected),
      recurrence,
      isOccurrence: true,
      scheduleSlot: slot,
      isArchivedHistory: Boolean(bill.archivedAt)
    });
  }
  return [...candidates.values()].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function resolveCalendarBillOccurrence(billId, dueDate) {
  const key = getLocalDateKey(dueDate);
  if (!key) return null;
  return getCalendarBillsForMonth(new Date(dueDate)).find(item =>
    getBillPaymentId(item) === billId && getLocalDateKey(item.dueDate) === key
  ) || null;
}

function getCurrentCalendarBillOccurrence(bill, referenceDate = new Date()) {
  const items = getVersionedBillOccurrences(bill, referenceDate);
  return items.find(item => !isOccurrencePaid(item, new Date(item.dueDate))) || items[0] || null;
}

function getRecurringOccurrencesForMonth(referenceDate = new Date()) {
  const seen = new Set();
  return Store.getBills()
    .filter(bill => isRecurringBill(bill) || bill.scheduleHistory?.length)
    .flatMap(bill => getVersionedBillOccurrences(bill, referenceDate))
    .filter(item => {
      if (seen.has(item.occurrenceKey)) return false;
      seen.add(item.occurrenceKey);
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
  const matchesMonth = value => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) &&
      date.getFullYear() === referenceDate.getFullYear() &&
      date.getMonth() === referenceDate.getMonth();
  };
  const active = Store.getBills();
  const activeIds = new Set(active.map(bill => bill.id));
  const archived = getArchivedBills().filter(bill => !activeIds.has(bill.id));
  const oneTime = [...active, ...archived].filter(bill => {
    if (isRecurringBill(bill) || bill.scheduleHistory?.length) return false;
    if (!matchesMonth(bill.dueDate)) return false;
    if (!bill.archivedAt) return true;
    return getLocalDateKey(bill.dueDate) < getLocalDateKey(bill.archivedAt) ||
      Store.getPaymentsForBill(bill.id).some(payment =>
        payment.paidForDueDate &&
        getLocalDateKey(payment.paidForDueDate) === getLocalDateKey(bill.dueDate)
      );
  }).map(bill => ({...bill, isArchivedHistory: Boolean(bill.archivedAt)}));
  const archivedOccurrences = archived.flatMap(bill =>
    getVersionedBillOccurrences(bill, referenceDate)
  );
  const seen = new Set();
  return [...oneTime, ...getRecurringOccurrencesForMonth(referenceDate), ...archivedOccurrences]
    .filter(item => {
      const key = `${getBillPaymentId(item)}:${getLocalDateKey(item.dueDate)}`;
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
        value="${escapeHtml(dateInputValue(minimumDate))}"
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
          onclick="confirmPostponeBill('${escapeInlineString(bill.id)}')"
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
              value="${escapeHtml(dateInputValue(minimumDate))}"
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
            '${escapeInlineString(bill.id)}',
            '${escapeInlineString(originalDueDate)}'
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

  const existingOverride = (bill.occurrenceOverrides || []).find(item =>
    getLocalDateKey(item.originalDueDate) === getLocalDateKey(originalDueDate)
  );
  const currentDueDate = existingOverride?.postponedTo || originalDueDate;
  const occurrence = resolveCalendarBillOccurrence(billId, currentDueDate);
  if (!occurrence) { alert("Reopen Calendar and choose the current occurrence."); return; }
  if (isOccurrencePaid(occurrence, new Date(currentDueDate))) {
    alert("A paid occurrence cannot be postponed. Reverse its payment first."); return;
  }

  const postponedTo = dateFromInput(input.value);

  if (new Date(postponedTo) <= new Date(currentDueDate)) {
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
        scheduleSnapshot: {
          name: occurrence.name,
          amount: occurrence.amount,
          category: occurrence.category,
          dueDate: originalDueDate,
          dueDay: occurrence.dueDay ?? null,
          recurrence: occurrence.recurrence,
          payCycle: occurrence.payCycle || null,
          paycheckAssignment: occurrence.paycheckAssignment || "auto",
          paymentMethod: occurrence.paymentMethod || "",
          paymentUrl: occurrence.paymentUrl || "",
          autopay: Boolean(occurrence.autopay),
          notes: occurrence.notes || "",
          reminderOffsets: [...(occurrence.reminderOffsets || [])]
        },
      },
    ],
  });

  recordActivity({
    action: "recurring_occurrence_postponed",
    entityType: "bill",
    entityId: billId,
    title: `${bill.name} Occurrence Postponed`,
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

// Part 1: exact occurrence links; never infer payment assignment from its month.
function financialDateKey(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day ? value : "";
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? getLocalDateKey(value) : "";
}

function getPaymentOccurrenceDateKey(payment) {
  if (!payment || typeof payment !== "object") return "";
  const value = payment.paidForDueDate || payment.billSnapshot?.dueDate;
  return financialDateKey(value);
}

function isFinancialPaymentActive(payment) {
  return payment && String(payment.status || "active").toLowerCase() !== "voided";
}

function getUnlinkedPaymentsForBill(billId, includeVoided = false) {
  return Store.getPaymentsForBill(billId).filter(payment =>
    (includeVoided || isFinancialPaymentActive(payment)) &&
    !getPaymentOccurrenceDateKey(payment)
  );
}

function confirmUnlinkedPaymentReview(billId) {
  const records = getUnlinkedPaymentsForBill(billId);
  return !records.length || confirm(
    `${records.length} older payment record(s) for this bill have no confirmed occurrence date. ` +
    "Check Payment History to avoid recording the same payment twice. " +
    "Continue recording a NEW payment for the selected occurrence? " +
    "The older records will not be reassigned or deleted."
  );
}

function renderLegacyPaymentReviewNotice(billId = null) {
  const records = (billId ? Store.getPaymentsForBill(billId) : Store.getPayments()).filter(
    payment => !getPaymentOccurrenceDateKey(payment)
  );
  if (!records.length) return "";
  return `<div class="card card-pad" role="status" style="margin:12px 0;">
    <div style="display:flex;align-items:center;gap:8px;color:var(--upcoming);font-weight:800;">
      ${svgIcon("warning", 18)} ${records.length} Payment${records.length === 1 ? "" : "s"} Need Review
    </div>
    <p style="margin-top:8px;font-size:var(--text-sm);color:var(--text-muted);line-height:1.5;">
      Older active or voided payments without an occurrence date remain in Payment History, but are not assigned
      to a bill occurrence or included in occurrence-based Paid totals. Automatic matching for
      affected bills is paused. Confirm the correct occurrence before recording another payment.
    </p>
    <button type="button" class="bb-outline-pill" style="margin-top:12px;"
      onclick="navigate('history')">View Payment History</button>
  </div>`;
}

function bankMatchIsEligibleBill(bill) {
  if (!bill || typeof bill !== "object") return false;
  const status = String(bill.status || "").toLowerCase().replace(/[ _]/g, "-");
  if (bill.archived || bill.archivedAt || bill.isArchivedHistory || bill.cancelled ||
      bill.cancelledAt || bill.paidInFullAt ||
      ["archived", "cancelled", "canceled", "paid-in-full", "paidinfull"].includes(status)) return false;
  return !getUnlinkedPaymentsForBill(getBillPaymentId(bill), true).length;
}

function getActivePaymentForOccurrence(bill, referenceDate = new Date()) {
  const billId = getBillPaymentId(bill);
  const dueDateKey = financialDateKey(getBillOccurrenceDueDate(bill, referenceDate));
  if (!billId || !dueDateKey) return null;
  return Store.getPaymentsForBill(billId)
    .filter(isFinancialPaymentActive)
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
    .find(payment => getPaymentOccurrenceDateKey(payment) === dueDateKey) || null;
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
    <span>${escapeHtml(billName)} Marked Paid</span>
    <button
      type="button"
      data-payment-undo="${escapeHtml(payment.id)}"
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

  if (!bill) {
    alert("Bill not found.");
    return;
  }

  if (isRecurringBill(bill) || bill.scheduleHistory?.length) {
    const occurrence = getCurrentCalendarBillOccurrence(bill);
    if (!occurrence) { alert("No occurrence is scheduled this month. Choose a date in Calendar."); return; }
    confirmMarkPaidOccurrence(billId, occurrence.dueDate);
    return;
  }

  if (!confirmUnlinkedPaymentReview(billId)) return;
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

  if (isOccurrencePaid(occurrenceBill, new Date(dueDate))) {
    alert("This bill is already marked as paid.");
    return;
  }

  const paidAt = new Date().toISOString();

  const payment = {
    id: uid(),
    billId: bill.id,
    paidDate: paidAt,
    amount: Number(bill.amount || 0),
    paidForDueDate: dueDate,
    status: "active",
    voidedAt: null,
  };

  Store.addPayment(payment);

  recordActivity({
    action: "bill_paid",
    entityType: bill.installmentPlanId ? "paymentplan" : "bill",
    entityId: bill.installmentPlanId || bill.id,
    title: `${bill.name} Marked as Paid`,
    detail: `${formatCurrency(payment.amount)} · due ${formatDate(
      dueDate,
      "short"
    )}`,
    before: {
      billId: bill.id,
      dueDate,
      paymentStatus: "unpaid",
      amount: Number(bill.amount || 0),
    },
    after: {
      paymentId: payment.id,
      billId: bill.id,
      dueDate,
      paidDate: payment.paidDate,
      paymentStatus: "active",
      amount: payment.amount,
      paymentPlanId: bill.installmentPlanId || null,
    },
  });

  render();
  showPaymentUndoToast(payment, bill.name);
}
function markSelectedPlanInstallmentPaid(planId) {
  const select = document.getElementById(
    "paymentPlanInstallmentSelect"
  );

  const installmentId = select?.value;

  if (!installmentId) {
    alert("Choose a payment first.");
    return;
  }

  const installment = Store.getBill(installmentId);

  if (!installment || installment.installmentPlanId !== planId) {
    alert("That payment could not be found.");
    return;
  }

  const dueDate = new Date(installment.dueDate);

  if (isOccurrencePaid(installment, dueDate)) {
    alert("This payment is already marked as paid.");
    return;
  }

  const paymentNumber = installment.installmentNumber || "";
  const paymentTotal = installment.installmentTotal || "";

  const confirmed = confirm(
    `Mark Payment ${paymentNumber} of ${paymentTotal} as paid?\n\n` +
    `${formatCurrency(installment.amount)} due ` +
    `${formatDate(installment.dueDate, "full")}`
  );

  if (!confirmed) {
    return;
  }

  closePaymentPlanDetails();
  markBillPaid(installment.id);
}
function markBillUnpaid(billId) {
  const bill = Store.getBill(billId);

  if (!bill) {
    alert("Bill Not Found.");
    return;
  }

  if (isRecurringBill(bill) || bill.scheduleHistory?.length) {
    const items = getVersionedBillOccurrences(bill, new Date());
    const paid = items.filter(item => isOccurrencePaid(item, new Date(item.dueDate)));
    if (paid.length !== 1) { alert("Choose the exact paid occurrence in Calendar to reverse."); return; }
    markBillOccurrenceUnpaid(billId, paid[0].dueDate);
    return;
  }

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
    `Mark ${bill.name} As Unpaid For ${formatDate(
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
    entityType: bill.installmentPlanId ? "paymentplan" : "bill",
    entityId: bill.installmentPlanId || bill.id,
    title: `${bill.name} Marked as Unpaid`,
    detail: `${formatCurrency(payment.amount)} payment voided · due ${formatDate(
      dueDate,
      "short"
    )}`,
    before: {
      paymentId: payment.id,
      billId: bill.id,
      dueDate,
      paidDate: payment.paidDate,
      paymentStatus: "active",
      amount: Number(payment.amount || 0),
    },
    after: {
      paymentId: payment.id,
      billId: bill.id,
      dueDate,
      paidDate: payment.paidDate,
      paymentStatus: "voided",
      voidedAt,
      amount: Number(payment.amount || 0),
    },
  });

  render();
}
function confirmMarkPaidOccurrence(billId, dueDate) {
  const bill = Store.getBill(billId);
  if (!bill) {
    alert("This bill is archived or no longer active.");
    return;
  }
  const occurrence = resolveCalendarBillOccurrence(billId, dueDate);
  if (!occurrence || occurrence.isArchivedHistory) {
    alert("This occurrence is no longer scheduled. Reopen Calendar and select its date.");
    return;
  }
  if (isOccurrencePaid(occurrence, new Date(occurrence.dueDate))) {
    alert("This occurrence is already marked as paid.");
    return;
  }
  if (!confirmUnlinkedPaymentReview(billId)) return;
  const payment = {
    id: uid(),
    billId,
    paidDate: new Date().toISOString(),
    amount: Number(occurrence.amount || 0),
    paidForDueDate: occurrence.dueDate,
    originalDueDate: occurrence.originalDueDate || occurrence.dueDate,
    status: "active",
    voidedAt: null
  };
  payment.billSnapshot = createPaymentBillSnapshot(payment, occurrence);
  Store.addPayment(payment);
  recordActivity({
    action: "bill_paid",
    entityType: bill.installmentPlanId ? "paymentplan" : "bill",
    entityId: bill.installmentPlanId || billId,
    title: `${occurrence.name} marked as paid`,
    detail: `${formatCurrency(payment.amount)} due ${formatDate(occurrence.dueDate, "short")}`,
    before: {billId, dueDate: occurrence.dueDate, paymentStatus: "unpaid", amount: payment.amount},
    after: {paymentId: payment.id, billId, dueDate: occurrence.dueDate,
      paidDate: payment.paidDate, paymentStatus: "active", amount: payment.amount}
  });
  render();
  showPaymentUndoToast(payment, occurrence.name);
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

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Specific to string values embedded in generated JavaScript/HTML handlers.
function escapeInlineString(value) {
  return String(value ?? "").replace(/[^A-Za-z0-9_.:/-]/g, character =>
    "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0")
  );
}

function safeTransactionColor(value) {
  const color = String(value || "").trim();
  return /^#(?:[a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(color) ? color : "var(--accent)";
}

function csvCell(value) {
  let text = String(value ?? "");
  if (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}



function safePaymentUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw || /[\u0000-\u0020\u007f]/.test(raw)) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https:\/\//i.test(raw)) return "";
  try {
    const url = new URL(/^https:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === "https:" && !url.username && !url.password && url.hostname ? url.href : "";
  } catch { return ""; }
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
let routeParams = { billSort: 'dueDate' };
const DASHBOARD_RETURN_DELAY = 5 * 60 * 1000;

let dashboardHiddenAt = null;
let dashboardRouteWhenHidden = null;
let dashboardParamsWhenHidden = null;

function dashboardHasOpenFormOrPopup() {
  return Boolean(
    document.querySelector(`
      #sheetContainer,
      #installmentPlanContainer,
      #incomeSourceContainer,
      #postponeBillContainer,
      #postponeRecurringOccurrenceContainer,
      #paymentLinkPopupContainer,
      .sheet-overlay,
      [role="dialog"][aria-modal="true"]
    `)
  ) || document.body.classList.contains("popup-open");
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    dashboardHiddenAt = Date.now();
    dashboardRouteWhenHidden = currentRoute;
    dashboardParamsWhenHidden = routeParams;
    return;
  }

  if (
    document.visibilityState !== "visible" ||
    dashboardHiddenAt === null
  ) {
    return;
  }

  const timeAway = Date.now() - dashboardHiddenAt;

  const routeChanged =
    currentRoute !== dashboardRouteWhenHidden ||
    routeParams !== dashboardParamsWhenHidden;

  dashboardHiddenAt = null;
  dashboardRouteWhenHidden = null;
  dashboardParamsWhenHidden = null;

  if (timeAway < DASHBOARD_RETURN_DELAY) return;

  // Avoid overriding navigation that happened while away.
  if (routeChanged) return;

  // Preserve forms and popups instead of discarding them.
  if (dashboardHasOpenFormOrPopup()) return;

  navigate("today");
});

window.addEventListener("billbeacon:authenticated", () => {
  startNotificationInboxListener();

  if (handleHouseholdInviteFromUrl()) {
    return;
  }

  currentRoute = "today";
  render();
});

window.addEventListener('billbeacon:signed-out', () => {
  clearNotificationInboxState();

  currentRoute = 'today';
  routeParams = { billSort: 'dueDate' };
});

function navigate(route, params = {}) {
  currentRoute = route;
  routeParams = params;

  render();
  window.scrollTo(0, 0);

  const main = document.querySelector(".main-content");
  if (main) main.scrollTop = 0;

  if (route === "transactions") {
    refreshPlaidSandboxAutomatically();
  }
}
let transactionSearchTimer = null;

function searchTransactions(value) {
  clearTimeout(transactionSearchTimer);

  transactionSearchTimer = setTimeout(() => {
    routeParams.transactionSearch = value;
    render();

    setTimeout(() => {
      const input = document.querySelector(
        'input[placeholder="Search transactions"]'
      );

      if (!input) {
        return;
      }

      input.focus();
      input.setSelectionRange(
        input.value.length,
        input.value.length
      );
    }, 0);
  }, 180);
}
function openTransactionDetails(transactionId) {
  const transaction = plaidBankState.transactions.find(
    item => item.id === transactionId
  );

  if (!transaction) {
    alert("Transaction not found.");
    return;
  }

  const key = bankMatchTransactionKey(transaction);

  const linkedPayments = Store.getPayments().filter(payment =>
    (key && payment.bankMatchKey === key) ||
    (
      payment.source === "plaid-sandbox-test" &&
      payment.bankTransactionId === transaction.id
    )
  );

  const allocations = linkedPayments.map(payment => {
    const bill = Store.getBill(payment.billId);
    return [
      bill?.name || "Archived bill",
      formatCurrency(payment.amount),
      payment.status === "voided" ? "Reversed" : "Paid",
      payment.paidForDueDate
        ? `Due ${formatDate(payment.paidForDueDate, "short")}`
        : ""
    ].filter(Boolean).join(" · ");
  });

  alert([
    transaction.merchantName,
    `${formatCurrency(transaction.amount)} · ${
      formatDate(transaction.date, "full")
    }`,
    `Status: ${transaction.pending ? "Pending" : "Posted"}`,
    "",
    allocations.length
      ? allocations.join("\n")
      : "No payment linked. Sync runs matching for [bank-match] items.",
    "",
    "Bank transaction data. Bill Beacon does not send payments."
  ].join("\n"));
}
function getNotificationDeepLink() {
  const params = new URLSearchParams(window.location.search);

  const notificationType = params.get('notification');
  const billId = params.get('billId');
  const planId = params.get('planId');
  const dueDate = params.get('dueDate');

  if (!notificationType || !billId) {
    return null;
  }

  if (notificationType === 'payment-plan' && planId) {
    return {
      route: 'payment-plans',
      params: {
        planId,
        billId,
        occurrenceDueDate: dueDate || null,
      },
    };
  }

  if (notificationType === 'bill') {
    return {
      route: 'detail',
      params: {
        id: billId,
        occurrenceDueDate: dueDate || null,
        returnRoute: 'today',
      },
    };
  }

  return null;
}

let notificationDeepLinkBusy = false;
let notificationDeepLinkFailed = "";
function consumeNotificationDeepLink() {
  const destination = getNotificationDeepLink();
  if (!destination || !notificationContext() || !notificationInboxState.loaded || notificationDeepLinkBusy) return false;
  const url = new URL(window.location.href);
  if (notificationDeepLinkFailed === url.href) return false;
  const householdId = url.searchParams.get("householdId");
  if (householdId && householdId !== notificationInboxState.householdId) {
    console.warn("Notification belongs to another household; no read update or navigation was performed.");
    return false;
  }
  notificationDeepLinkBusy = true;
  const context = notificationContext();
  (async () => {
    try {
      const id = url.searchParams.get("notificationId");
      if (id) await markNotificationRead(id, true);
      if (notificationContext()?.generation !== context.generation) return;
      for (const key of ["notification", "billId", "planId", "dueDate", "notificationId", "householdId"])
        url.searchParams.delete(key);
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      navigate(destination.route, destination.params);
    } catch (error) {
      notificationDeepLinkFailed = url.href;
      console.error("External notification could not be marked read:", error);
      alert(`Notification could not be marked read: ${error.message}. Open the bell and retry. The link was retained.`);
    } finally { notificationDeepLinkBusy = false; }
  })();
  return true;
}

// ====================================
// VIEWS
// ====================================
function getDashboardUpcomingGroups(referenceDate = new Date()) {
  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0,
    0
  );

  const endOfUpcomingWindow = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + 7,
    12,
    0,
    0,
    0
  );

  const currentMonthDate = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    1,
    12,
    0,
    0,
    0
  );

  const nextMonthDate = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth() + 1,
    1,
    12,
    0,
    0,
    0
  );

  const sourceBills = [
    ...getCalendarBillsForMonth(currentMonthDate),
    ...getCalendarBillsForMonth(nextMonthDate),
  ];

  const seen = new Set();

  const uniqueBills = sourceBills.filter((bill) => {
    const sourceBillId = bill.isOccurrence ? bill.sourceBillId : bill.id;
    const key = `${sourceBillId}|${getLocalDateKey(bill.dueDate)}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });

  const unpaidBills = uniqueBills.filter(
    (bill) => !isOccurrencePaid(bill, new Date(bill.dueDate))
  );

  const overdue = unpaidBills
    .filter((bill) => {
      const dueDate = new Date(bill.dueDate);

      return dueDate < startOfToday;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const upcoming = unpaidBills
    .filter((bill) => {
      const dueDate = new Date(bill.dueDate);

      return dueDate >= startOfToday && dueDate <= endOfUpcomingWindow;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return {
    overdue,
    upcoming,
    startOfToday,
    endOfUpcomingWindow,
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
        id: '${escapeInlineString(sourceBillId)}',
        occurrenceDueDate: '${escapeInlineString(bill.dueDate)}',
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
let selectedDashboardPaycheck = null;

function getPaycheckAssignmentLabel(assignment) {
  switch (assignment) {
    case "first":
      return "First paycheck";
    case "second":
      return "Second paycheck";
    case "previous":
      return "Previous paycheck";
    case "auto":
    default:
      return "Automatic by due date";
  }
}

function getPaycheckPlan(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const firstPayday = new Date(year, month, 1, 12, 0, 0, 0);
  const secondPayday = new Date(year, month, 15, 12, 0, 0, 0);
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  const firstWindowEnd = new Date(year, month, 14, 12, 0, 0, 0);
  const secondWindowEnd = new Date(
    year,
    month,
    lastDayOfMonth,
    12,
    0,
    0,
    0
  );

  const bills = getCalendarBillsForMonth(
    new Date(year, month, 1, 12, 0, 0, 0)
  ).filter(bill => !bill.isArchivedHistory || isOccurrencePaid(bill, new Date(bill.dueDate)));

  const firstBills = [];
  const secondBills = [];
  const previousBills = [];

  bills.forEach((bill) => {
    const assignment = bill.paycheckAssignment || "auto";
    const dueDate = new Date(bill.dueDate);
    const dueDay = dueDate.getDate();

    if (assignment === "previous") {
      previousBills.push(bill);
      return;
    }

    if (assignment === "first") {
      firstBills.push(bill);
      return;
    }

    if (assignment === "second") {
      secondBills.push(bill);
      return;
    }

    if (dueDay <= 14) {
      firstBills.push(bill);
    } else {
      secondBills.push(bill);
    }
  });

  const sortBills = (items) =>
  [...items].sort((first, second) => {
    const firstPaid = isOccurrencePaid(
      first,
      new Date(first.dueDate)
    );

    const secondPaid = isOccurrencePaid(
      second,
      new Date(second.dueDate)
    );

    if (firstPaid !== secondPaid) {
      return firstPaid ? 1 : -1;
    }

    return new Date(first.dueDate) - new Date(second.dueDate);
  });

  const summarize = (id, payday, startDate, endDate, items) => {
    const sortedBills = sortBills(items);

    const paidBills = sortedBills.filter((bill) =>
      isOccurrencePaid(bill, new Date(bill.dueDate))
    );

    const unpaidBills = sortedBills.filter(
      (bill) => !isOccurrencePaid(bill, new Date(bill.dueDate))
    );

    const scheduled = sortedBills.reduce(
      (sum, bill) => sum + Number(bill.amount || 0),
      0
    );

    const paid = paidBills.reduce(
  (sum, bill) => sum + getOccurrencePaidAmount(bill),
  0
);

    const remaining = unpaidBills.reduce(
      (sum, bill) => sum + Number(bill.amount || 0),
      0
    );

    const progress =
  sortedBills.length > 0
    ? (paidBills.length / sortedBills.length) * 100
    : 0;

    return {
      id,
      payday,
      startDate,
      endDate,
      bills: sortedBills,
      paidBills,
      unpaidBills,
      scheduled,
      paid,
      remaining,
      progress,
    };
  };

  return {
    first: summarize(
      "first",
      firstPayday,
      firstPayday,
      firstWindowEnd,
      firstBills
    ),
    second: summarize(
      "second",
      secondPayday,
      secondPayday,
      secondWindowEnd,
      secondBills
    ),
    previous: summarize(
      "previous",
      new Date(year, month - 1, 15, 12, 0, 0, 0),
      new Date(year, month - 1, 15, 12, 0, 0, 0),
      new Date(year, month, 0, 12, 0, 0, 0),
      previousBills
    ),
  };
}

function getDefaultDashboardPaycheck(referenceDate = new Date()) {
  return referenceDate.getDate() <= 14 ? "first" : "second";
}

function getPaycheckBillStatusLabel(bill) {
  const status = getOccurrenceStatus(bill, new Date(bill.dueDate));

  if (status === "paid") {
    const payment = getActivePaymentForOccurrence(
      bill,
      new Date(bill.dueDate)
    );

    return {
      label: payment?.paidDate
        ? `Paid ${formatDate(payment.paidDate, "short")}`
        : "Paid",
      color: "var(--paid)",
      icon: "checkCircle",
    };
  }

  if (status === "overdue") {
    return {
      label: `Overdue · ${relativeDue(bill.dueDate)}`,
      color: "var(--overdue)",
      icon: "warning",
    };
  }

  return {
    label: `Due ${formatDate(bill.dueDate, "short")}`,
    color: "var(--text-muted)",
    icon: "calendar",
  };
}

function renderDashboardPaycheckPlan(referenceDate = new Date()) {
  const plan = getPaycheckPlan(referenceDate);

  if (!selectedDashboardPaycheck) {
    selectedDashboardPaycheck = getDefaultDashboardPaycheck(referenceDate);
  }

  const selectedKey =
    selectedDashboardPaycheck === "second" ? "second" : "first";

  const selected = plan[selectedKey];

  const firstLabel = formatDate(plan.first.payday, "short");
  const secondLabel = formatDate(plan.second.payday, "short");

  const previewBills = selected.bills.slice(0, 3);

  return `
    <div class="section-header">Paycheck Plan</div>

    <div class="card card-pad">
      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
          margin-bottom:var(--space-3);
        "
      >
        <button
          type="button"
          onclick="setDashboardPaycheck('first')"
          style="
            min-height:42px;
            border:1px solid ${
              selectedKey === "first"
                ? "var(--accent)"
                : "var(--border)"
            };
            border-radius:12px;
            background:${
              selectedKey === "first"
                ? "var(--accent-soft, rgba(124,92,255,.14))"
                : "transparent"
            };
            color:var(--text);
            font:inherit;
            font-size:var(--text-sm);
            font-weight:800;
            cursor:pointer;
          "
        >
          PAYCHECK · ${firstLabel}
        </button>

        <button
          type="button"
          onclick="setDashboardPaycheck('second')"
          style="
            min-height:42px;
            border:1px solid ${
              selectedKey === "second"
                ? "var(--accent)"
                : "var(--border)"
            };
            border-radius:12px;
            background:${
              selectedKey === "second"
                ? "var(--accent-soft, rgba(124,92,255,.14))"
                : "transparent"
            };
            color:var(--text);
            font:inherit;
            font-size:var(--text-sm);
            font-weight:800;
            cursor:pointer;
          "
        >
          PAYCHECK · ${secondLabel}
        </button>
      </div>

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
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
              ${formatDate(selected.startDate, "short")}–${formatDate(
              selected.endDate,
              "short"
            )}
          </div>

          <div
            style="
              margin-top:4px;
              font-size:var(--text-xs);
              color:var(--text-muted);
            "
          >
            ${selected.paidBills.length} of ${selected.bills.length} bill${
              selected.bills.length === 1 ? "" : "s"
            } paid
          </div>
        </div>

        <div style="text-align:right;">
          <div
            style="
              font-size:var(--text-xs);
              color:var(--text-muted);
            "
          >
            Remaining
          </div>

          <div
            class="text-upcoming"
            style="
              margin-top:3px;
              font-size:var(--text-xl);
              font-weight:800;
            "
          >
            ${formatCurrency(selected.remaining)}
          </div>
        </div>
      </div>

      <div
        class="dashboard-progress-track"
        style="margin-top:var(--space-3);"
      >
        <div
          class="dashboard-progress-fill"
          style="width:${selected.progress}%;"
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
        <span>${formatCurrency(selected.paid)} Paid</span>
        <span>${formatCurrency(selected.scheduled)} Scheduled</span>
      </div>

      ${
        previewBills.length
          ? `
            <div
              style="
                margin-top:var(--space-3);
                border-top:1px solid var(--border);
              "
            >
              ${previewBills
                .map((bill) => {
                  const status = getPaycheckBillStatusLabel(bill);
                  const sourceBillId = bill.isOccurrence
                    ? bill.sourceBillId
                    : bill.id;

                  return `
                    <button
                      type="button"
                      onclick="navigate('detail', {
                        id: '${escapeInlineString(sourceBillId)}',
                        occurrenceDueDate: '${escapeInlineString(bill.dueDate)}',
                        returnRoute: 'today'
                      })"
                      style="
                        width:100%;
                        display:flex;
                        align-items:center;
                        gap:10px;
                        padding:12px 0;
                        border:0;
                        border-bottom:1px solid var(--border);
                        background:transparent;
                        color:inherit;
                        font:inherit;
                        text-align:left;
                        cursor:pointer;
                      "
                    >
                      <div
                        style="
                          width:32px;
                          height:32px;
                          min-width:32px;
                          display:flex;
                          align-items:center;
                          justify-content:center;
                          border-radius:10px;
                          overflow:hidden;
                          background:${
                            getBillBrand(bill.name)
                              ? "#fff"
                              : `var(--${getCategory(bill.category).color})`
                          };
                          color:${
                            getBillBrand(bill.name)
                              ? "#1e1e2e"
                              : "#fff"
                          };
                        "
                      >
                        ${billOrPaymentPlanVisual(bill, 28)}
                      </div>

                      <div style="min-width:0;flex:1;">
                        <div
                          style="
                            overflow:hidden;
                            text-overflow:ellipsis;
                            white-space:nowrap;
                            font-size:var(--text-sm);
                            font-weight:800;
                          "
                        >
                          ${escapeHtml(bill.name)}
                        </div>

                        <div
                          style="
                            margin-top:3px;
                            display:flex;
                            align-items:center;
                            gap:4px;
                            color:${status.color};
                            font-size:var(--text-xs);
                          "
                        >
                          ${svgIcon(status.icon, 14)}
                          <span>${status.label}</span>
                        </div>
                      </div>

                      <div
                        style="
                          text-align:right;
                          font-size:var(--text-sm);
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
            <div
              style="
                margin-top:var(--space-3);
                padding-top:var(--space-3);
                border-top:1px solid var(--border);
                color:var(--text-muted);
                font-size:var(--text-sm);
              "
            >
              No bills assigned to this paycheck yet.
            </div>
          `
      }

      <button
        type="button"
        class="bb-outline-pill"
        style="
          width:100%;
          min-height:42px;
          margin-top:var(--space-3);
        "
        onclick="openPaycheckPlanSheet('${escapeInlineString(selectedKey)}')"
      >
        <span>View all ${
          selected.bills.length
        } bill${selected.bills.length === 1 ? "" : "s"}</span>
        <span class="pill-chevron">
          ${svgIcon("chevronRight", 18)}
        </span>
      </button>
    </div>
  `;
}

function setDashboardPaycheck(paycheckKey) {
  selectedDashboardPaycheck =
    paycheckKey === "second" ? "second" : "first";

  render();
}

function openPaycheckPlanSheet(paycheckKey) {
  const plan = getPaycheckPlan(new Date());
  const selected =
    paycheckKey === "second" ? plan.second : plan.first;

  const paycheckTitle = `Paycheck · ${formatDate(
    selected.payday,
    "short"
  )}`;

  const billsHtml = selected.bills.length
    ? selected.bills
        .map((bill) => {
          const status = getPaycheckBillStatusLabel(bill);
          const sourceBillId = bill.isOccurrence
            ? bill.sourceBillId
            : bill.id;

          return `
            <button
              type="button"
              class="bill-row"
              style="width:100%;text-align:left;"
              onclick="closePaycheckPlanSheet();navigate('detail', {
                id: '${escapeInlineString(sourceBillId)}',
                occurrenceDueDate: '${escapeInlineString(bill.dueDate)}',
                returnRoute: 'today'
              })"
            >
              <div
                class="bill-icon"
                style="
                  background:${
                    getBillBrand(bill.name)
                      ? "#fff"
                      : `var(--${getCategory(bill.category).color})`
                  };
                  color:${
                    getBillBrand(bill.name)
                      ? "#1e1e2e"
                      : "#fff"
                  };
                  overflow:hidden;
                "
              >
                ${billOrPaymentPlanVisual(bill, 42)}
              </div>

              <div class="bill-info">
                <div class="bill-name">${escapeHtml(bill.name)}</div>

                <div
                  class="bill-meta"
                  style="color:${status.color};"
                >
                  ${status.label}
                </div>
              </div>

              <div class="bill-amount">
                ${formatCurrency(bill.amount)}
              </div>
            </button>
          `;
        })
        .join("")
    : `
      <div class="empty-state">
        <div class="empty-state-icon">
          ${svgIcon("calendar", 40)}
        </div>
        <div class="empty-state-title">No bills in this paycheck</div>
        <div class="empty-state-text">
          Bills assigned here will appear automatically based on their due
          date, unless you choose a different Fund With option.
        </div>
      </div>
    `;

  document.getElementById("paycheckPlanContainer")?.remove();

  const container = document.createElement("div");

  container.id = "paycheckPlanContainer";

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="paycheckPlanOverlay"
      onclick="closePaycheckPlanSheet()"
    ></div>

    <div class="sheet" id="paycheckPlanSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button
          type="button"
          class="nav-button"
          onclick="closePaycheckPlanSheet()"
        >
          Close
        </button>

        <div class="sheet-title">${paycheckTitle}</div>

        <div style="width:54px;"></div>
      </div>

      <div class="sheet-body content-gap">
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
                "
              >
                Remaining
              </div>

              <div
                class="text-upcoming"
                style="
                  margin-top:4px;
                  font-size:var(--text-xl);
                  font-weight:800;
                "
              >
                ${formatCurrency(selected.remaining)}
              </div>
            </div>

            <div style="text-align:right;">
              <div
                style="
                  font-size:var(--text-xs);
                  color:var(--text-muted);
                "
              >
                Paid
              </div>

              <div
                class="text-paid"
                style="
                  margin-top:4px;
                  font-size:var(--text-xl);
                  font-weight:800;
                "
              >
                ${formatCurrency(selected.paid)}
              </div>
            </div>
          </div>

          <div
            class="dashboard-progress-track"
            style="margin-top:var(--space-3);"
          >
            <div
              class="dashboard-progress-fill"
              style="width:${selected.progress}%;"
            ></div>
          </div>

          <div
            style="
              margin-top:8px;
              font-size:var(--text-xs);
              color:var(--text-muted);
            "
          >
            Covers bills due ${formatDate(
              selected.startDate,
              "short"
            )}–${formatDate(selected.endDate, "short")}
          </div>
        </div>

        <div>
          <div class="section-header">
            ${selected.bills.length} bill${
              selected.bills.length === 1 ? "" : "s"
            }
          </div>

          <div class="card">
            ${billsHtml}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document
      .getElementById("paycheckPlanOverlay")
      ?.classList.add("show");

    document
      .getElementById("paycheckPlanSheet")
      ?.classList.add("show");
  });
}

function closePaycheckPlanSheet() {
  document
    .getElementById("paycheckPlanOverlay")
    ?.classList.remove("show");

  document
    .getElementById("paycheckPlanSheet")
    ?.classList.remove("show");

  setTimeout(() => {
    document.getElementById("paycheckPlanContainer")?.remove();
    unlockBackgroundScroll();
  }, 300);
}
function renderMore() {
  const activePlans = new Set(
    Store.getBills()
      .filter((bill) => bill.installmentPlanId)
      .filter((bill) => !isOccurrencePaid(bill, new Date(bill.dueDate)))
      .map((bill) => bill.installmentPlanId)
  ).size;

  const upcomingInstallmentTotal = Store.getBills()
    .filter((bill) => bill.installmentPlanId)
    .filter((bill) => !isOccurrencePaid(bill, new Date(bill.dueDate)))
    .filter((bill) => {
      const dueDate = new Date(bill.dueDate);
      const today = new Date();

      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      const daysAway = Math.round(
        (dueDate - today) / 86400000
      );

      return daysAway >= 0 && daysAway <= 14;
    })
    .reduce((total, bill) => {
      return total + Number(bill.amount || 0);
    }, 0);

  const activityCount = Store.getActivityLog()
    .filter((entry) => entry && entry.action)
    .length;

  const moneyTileStyle = `
    min-height:154px;
    padding:18px;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
    border:1px solid rgba(192,151,255,.20);
    border-radius:20px;
    background:
      radial-gradient(
        circle at top right,
        rgba(196,76,255,.15),
        transparent 52%
      ),
      var(--surface);
    color:var(--text);
    text-align:left;
    cursor:pointer;
    font-family:inherit;
  `;

  const wideCardStyle = `
    width:100%;
    min-height:84px;
    padding:16px 18px;
    display:flex;
    align-items:center;
    gap:14px;
    border:1px solid rgba(192,151,255,.18);
    border-radius:18px;
    background:var(--surface);
    color:var(--text);
    text-align:left;
    cursor:pointer;
    font-family:inherit;
  `;

  return `
    <div class="nav-bar">
      <div
        class="nav-bar-content"
        style="
          display:grid;
          grid-template-columns:44px 1fr 44px;
          align-items:center;
        "
      >
        <div style="width:44px;height:44px"></div>

        <div
          class="nav-title"
          style="text-align:center"
        >
          More
        </div>

        <div style="width:44px;height:44px"></div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div
        class="content-pad content-gap"
        style="padding-bottom:calc(104px + env(safe-area-inset-bottom))"
      >

        <section
          style="
            margin-top:4px;
            padding:20px;
            border:1px solid rgba(192,151,255,.20);
            border-radius:22px;
            background:
              radial-gradient(
                circle at 92% 10%,
                rgba(246,76,174,.22),
                transparent 37%
              ),
              radial-gradient(
                circle at 8% 100%,
                rgba(143,54,255,.20),
                transparent 42%
              ),
              var(--surface);
            overflow:hidden;
          "
        >
          <div
            style="
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:16px;
            "
          >
            <div style="min-width:0">
              <div
                style="
                  font-size:20px;
                  font-weight:900;
                  letter-spacing:-.02em;
                "
              >
                Your Money Tools
              </div>

              <div
                style="
                  margin-top:6px;
                  color:var(--text-muted);
                  font-size:14px;
                  line-height:1.45;
                "
              >
                Manage plans, bank activity, and Bill Beacon settings.
              </div>
            </div>

            
          </div>
        </section>

        <section class="settings-section">
          <div
            class="section-header"
            style="margin-bottom:10px"
          >
            Money tools
          </div>

          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:12px;
            "
          >
            <button
              type="button"
              onclick="navigate('transactions')"
              style="${moneyTileStyle}"
            >
              <div
                style="
                  width:42px;
                  height:42px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  border-radius:14px;
                  color:#d9ccff;
                  background:rgba(143,54,255,.20);
                "
              >
                ${svgIcon("internaldrive", 22)}
              </div>

              <div>
                <div
                  style="
                    font-size:16px;
                    font-weight:850;
                    line-height:1.2;
                  "
                >
                  Banking
                </div>

              </div>

              <div
                style="
                  color:#c47cff;
                  font-size:12px;
                  font-weight:800;
                "
              >
                View Transactions
              </div>
            </button>

            <button
              type="button"
              onclick="navigate('payment-plans')"
              style="${moneyTileStyle}"
            >
              <div
                style="
                  width:42px;
                  height:42px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  border-radius:14px;
                  color:#ffdce9;
                  background:rgba(246,76,174,.18);
                "
              >
                ${svgIcon("creditcard", 22)}
              </div>

              <div>
                <div
                  style="
                    font-size:16px;
                    font-weight:850;
                    line-height:1.2;
                  "
                >
                  Installments
                </div>

                </div>

              <div
                style="
                  color:var(--text-muted);
                  font-size:12px;
                  font-weight:800;
                "
              >
                ${
                  activePlans
                    ? `${activePlans} Active · ${formatCurrency(upcomingInstallmentTotal)} Due Soon`
                    : "No active plans"
                }
              </div>
            </button>
          </div>

          <button
            type="button"
            onclick="openCreditCardsComingSoon()"
            style="${wideCardStyle}; margin-top:12px"
          >
            <div
              style="
                width:46px;
                height:46px;
                min-width:46px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:15px;
                color:#b8efff;
                background:rgba(63,196,235,.16);
              "
            >
              ${svgIcon("creditcard", 23)}
            </div>

            <div style="min-width:0;flex:1">
              <div
                style="
                  font-size:16px;
                  font-weight:850;
                "
              >
                Credit Cards
              </div>

            </div>

            <div
              style="
                color:#69d4f3;
                font-size:12px;
                font-weight:800;
                white-space:nowrap;
              "
            >
              Soon
            </div>
          </button>
        </section>

        <section
  style="
    display:grid;
    gap:12px;
    margin-top:2px;
  "
>
  <button
    type="button"
    onclick="navigate('activity')"
    style="${wideCardStyle}"
  >
    <div
      style="
        width:46px;
        height:46px;
        min-width:46px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:15px;
        color:#ffe2b5;
        background:rgba(255,174,74,.14);
      "
    >
      ${svgIcon("doc", 23)}
    </div>

    <div style="min-width:0;flex:1">
      <div
        style="
          font-size:16px;
          font-weight:850;
        "
      >
        Activity & Changes
      </div>

      <div
        style="
          margin-top:4px;
          color:var(--text-muted);
          font-size:13px;
          line-height:1.35;
        "
      >
        
      </div>
    </div>

    <div style="color:var(--text-muted)">
      ${svgIcon("chevronRight", 20)}
    </div>
  </button>

  <button
    type="button"
    onclick="navigate('settings')"
    style="${wideCardStyle}"
  >
    <div
      style="
        width:46px;
        height:46px;
        min-width:46px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:15px;
        color:#d8d0ff;
        background:rgba(143,54,255,.16);
      "
    >
      ${svgIcon("gear", 23)}
    </div>

    <div style="min-width:0;flex:1">
      <div
        style="
          font-size:16px;
          font-weight:850;
        "
      >
        Settings
      </div>

      <div
        style="
          margin-top:4px;
          color:var(--text-muted);
          font-size:13px;
          line-height:1.35;
        "
      >
        Income sources, notifications, backup, and household.
      </div>
    </div>

    <div style="color:var(--text-muted)">
      ${svgIcon("chevronRight", 20)}
    </div>
  </button>
</section>

      </div>
    </div>
  `;
}
function getOccurrencePaidAmount(bill) {
  const payment = getActivePaymentForOccurrence(
    bill,
    new Date(bill.dueDate)
  );

  if (!payment) return 0;

  const amount = Number(payment.amount);
  return Number.isFinite(amount) ? amount : 0;
}
function dashboardDate(value) {
  if (!value) return null;

  const text = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T12:00:00`)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function dashboardMoneyTotal(values) {
  return values.reduce((sum, value) => {
    const amount = Number(value);
    return sum + (
      Number.isFinite(amount) ? Math.round(amount * 100) : 0
    );
  }, 0) / 100;
}

function getDashboardPaidOccurrences(referenceDate = new Date()) {
  const activeBills = Store.getBills();
  const activeById = new Map(activeBills.map(bill => [bill.id, bill]));

  const archivedById = new Map(
    getArchivedBills().map(bill => [bill.id, bill])
  );

  const seenPaymentIds = new Set();
  const groups = new Map();

  for (const payment of Store.getPayments()) {
    if (!isFinancialPaymentActive(payment)) continue;

    const dateValue = getPaymentOccurrenceDateKey(payment);
    if (!dateValue) continue;
    const occurrenceDate = dashboardDate(dateValue);
    if (!occurrenceDate) continue;

    if (
      occurrenceDate.getFullYear() !== referenceDate.getFullYear() ||
      occurrenceDate.getMonth() !== referenceDate.getMonth()
    ) {
      continue;
    }

    if (payment.id) {
      if (seenPaymentIds.has(payment.id)) continue;
      seenPaymentIds.add(payment.id);
    }

    const dateKey = getLocalDateKey(occurrenceDate);
    const key = `${payment.billId}:${dateKey}`;

    const activeBill = activeById.get(payment.billId);
    const archivedBill = archivedById.get(payment.billId);
    const bill = activeBill || archivedBill || null;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        billId: payment.billId,
        bill,
        name:
          payment.billSnapshot?.name ||
          bill?.name ||
          "Removed bill",
        removed: !activeBill,
        dueDate: occurrenceDate.toISOString(),
        expectedAmount:
          payment.expectedAmountAtMatch ??
          payment.billSnapshot?.amount ??
          bill?.amount ??
          payment.amount,
        payments: []
      });
    }

    groups.get(key).payments.push(payment);
  }

  return [...groups.values()].map(item => {
    const ordered = [...item.payments].sort((a, b) =>
      (dashboardDate(b.paidDate)?.getTime() || 0) -
      (dashboardDate(a.paidDate)?.getTime() || 0)
    );

    return {
      ...item,
      amount: dashboardMoneyTotal(
        item.payments.map(payment => payment.amount)
      ),
      paidDate: ordered[0]?.paidDate || null
    };
  }).sort((a, b) =>
    (dashboardDate(b.paidDate)?.getTime() || 0) -
    (dashboardDate(a.paidDate)?.getTime() || 0)
  );
}

function getDashboardMonthSummary(referenceDate = new Date()) {
  const bills = getCalendarBillsForMonth(referenceDate).filter(bill =>
    !bill.isArchivedHistory || isOccurrencePaid(bill, new Date(bill.dueDate))
  );
  const paid = getDashboardPaidOccurrences(referenceDate);

  const unpaid = bills.filter(bill =>
    !isOccurrencePaid(bill, new Date(bill.dueDate))
  );

  const activeOccurrenceKeys = new Set(
    bills.map(bill =>
      `${getBillPaymentId(bill)}:${getLocalDateKey(bill.dueDate)}`
    )
  );

  // Retain the scheduled estimate for paid occurrences
  // that have disappeared from the active schedule.
  const historicalPaid = paid.filter(
    item => !activeOccurrenceKeys.has(item.key)
  );

  const scheduled = dashboardMoneyTotal([
    ...bills.map(bill => bill.amount),
    ...historicalPaid.map(item => item.expectedAmount)
  ]);

  const totalCount = paid.length + unpaid.length;

  return {
    bills,
    paid,
    unpaid,
    paidTotal: dashboardMoneyTotal(paid.map(item => item.amount)),
    remainingTotal: dashboardMoneyTotal(unpaid.map(bill => bill.amount)),
    scheduled,
    paidCount: paid.length,
    totalCount,
    progress: totalCount > 0
      ? paid.length / totalCount * 100
      : 0
  };
}

function closeDashboardPaidSheet() {
  document.getElementById("dashboardPaidContainer")?.remove();
  unlockBackgroundScroll();
}

function openDashboardPaidSheet() {
  closeDashboardPaidSheet();

  const now = new Date();
  const summary = getDashboardMonthSummary(now);
  const activePaid = summary.paid.filter(item => !item.removed);
  const removedPaid = summary.paid.filter(item => item.removed);

  const renderRow = item => {
    const paidDate = item.paidDate
      ? formatDate(item.paidDate, "full")
      : "Date unavailable";

    return `
      <div class="bill-row">
        <div class="bill-icon"
          style="background:var(--paid-bg);color:var(--paid);">
          ${svgIcon("checkCircle", 20)}
        </div>

        <div class="bill-info">
          <div class="bill-name">${escapeHtml(item.name)}</div>
          <div class="bill-meta">
            Paid ${escapeHtml(paidDate)}
          </div>
          <div class="bill-meta">
            Due ${formatDate(item.dueDate, "short")}
            ${item.removed
              ? `<span style="color:var(--overdue);font-weight:800;">
                  · Removed — payment retained
                </span>`
              : ""}
          </div>
        </div>

        <div class="bill-amount" style="color:var(--paid);">
          ${formatCurrency(item.amount)}
        </div>
      </div>
    `;
  };

  const container = document.createElement("div");
  container.id = "dashboardPaidContainer";

  container.innerHTML = `
    <div class="sheet-overlay show"
      onclick="closeDashboardPaidSheet()"></div>

    <div class="sheet show" role="dialog" aria-modal="true"
      aria-label="Paid bills this month">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button type="button" class="nav-button"
          onclick="closeDashboardPaidSheet()" aria-label="Close">
          ${svgIcon("close", 22)}
        </button>
        <div class="sheet-title">Paid Bills</div>
        <div style="width:54px;"></div>
      </div>

      <div class="sheet-body content-gap">
       <div class="card" style="overflow:hidden;">
  <div class="form-row">
    <div style="
      display:flex;
      align-items:center;
      gap:var(--space-2);
      color:var(--paid);
    ">
      ${svgIcon("checkCircle", 18)}

      <span style="font-weight:700;">
        ${summary.paidCount}
        ${summary.paidCount === 1 ? "Bill Paid" : "Bills Paid"}
      </span>
    </div>

    <div style="
      margin-left:auto;
      font-size:var(--text-lg);
      font-weight:800;
      color:var(--paid);
      white-space:nowrap;
    ">
      ${formatCurrency(summary.paidTotal)}
    </div>
  </div>
</div>

        ${activePaid.length ? `
  <div class="card">
    ${activePaid.map(renderRow).join("")}
  </div>
` : ""}

        ${removedPaid.length ? `
          <div class="section-header" style="color:var(--overdue);">
            Removed Bills — Payment Retained
          </div>
          <div class="card">
            ${removedPaid.map(renderRow).join("")}
          </div>
        ` : ""}

        ${!summary.paidCount ? `
          <div class="dashboard-empty-card">
            ${svgIcon("tray", 22)}
            <span>No paid bills for this month.</span>
          </div>
        ` : ""}

        <button type="button" class="bb-outline-pill"
          style="width:100%;"
          onclick="closeDashboardPaidSheet();navigate('history');">
          View All Payment History
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();
}
function renderToday() {
  const now = new Date();
  const summary = getDashboardMonthSummary(now);

  const currentDateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(now);

  const dueBills = summary.unpaid.filter(bill =>
    getOccurrenceStatus(bill, new Date(bill.dueDate)) === "upcoming"
  );

  const overdueBills = summary.unpaid.filter(bill =>
    getOccurrenceStatus(bill, new Date(bill.dueDate)) === "overdue"
  );

  const upcomingGroups = getDashboardUpcomingGroups(now);
  const upcomingBills = [
    ...(upcomingGroups.overdue || []),
    ...(upcomingGroups.upcoming || [])
  ];

  const allBillsById = new Map(
    getArchivedBills().map(bill => [bill.id, bill])
  );

  for (const bill of Store.getBills()) {
    allBillsById.set(bill.id, bill);
  }

  const recentPayments = Store.getPayments()
    .map(payment => ({
      ...payment,
      bill: allBillsById.get(payment.billId) || null
    }))
    .sort((a, b) =>
      (dashboardDate(b.voidedAt || b.paidDate)?.getTime() || 0) -
      (dashboardDate(a.voidedAt || a.paidDate)?.getTime() || 0)
    )
    .slice(0, 5);

  const notificationCount = getNotificationCount();

  const moneyButtonStyle = `
    width:100%;min-height:82px;padding:8px 0;
    border:0;background:transparent;color:inherit;
    font:inherit;cursor:pointer;
  `;

  const recentRows = recentPayments.map(payment => {
    const voided = payment.status === "voided";
    const removed = !Store.getBill(payment.billId);
    const name =
      payment.billSnapshot?.name ||
      payment.bill?.name ||
      "Removed bill";

    const shownDate = payment.voidedAt || payment.paidDate;
    const dateLabel = shownDate
      ? formatDate(shownDate, "full")
      : "Date unavailable";

    return `
      <div class="recent-payment-row"
        style="${voided ? "opacity:.58;" : ""}">
        <div class="recent-payment-icon"
          style="color:${voided ? "var(--text-muted)" : "var(--paid)"};">
          ${svgIcon(voided ? "close" : "checkCircle", 18)}
        </div>

        <div class="bill-info">
          <div class="bill-name">
            ${escapeHtml(name)}${voided ? " · Voided" : ""}
          </div>
          <div class="bill-meta">
            ${voided ? "Payment Voided" : "Paid"}
            ${escapeHtml(dateLabel)}
          </div>
          ${removed ? `
            <div class="bill-meta" style="color:var(--overdue);">
              Removed — History Retained
            </div>
          ` : ""}
        </div>

        <div class="recent-payment-amount"
          style="${voided
            ? "text-decoration:line-through;color:var(--text-muted);"
            : ""}">
          ${formatCurrency(payment.amount)}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="nav-bar dashboard-nav">
      <div class="nav-bar-content">
        <button type="button"
          class="nav-button dashboard-icon-button"
          onclick="navigate('settings')" aria-label="Open settings"
          style="color:var(--text-muted);">
          ${svgIcon("gear", 22)}
        </button>

        <div class="dashboard-date">${currentDateLabel}</div>

        <button type="button"
          class="nav-button dashboard-icon-button"
          onclick="openNotificationCenter()"
          aria-label="Open notifications"
          style="position:relative;color:var(--text-muted);">
          ${svgIcon("bell", 22)}
          ${notificationCount > 0 ? `
            <span style="
              position:absolute;top:-3px;right:0;
              min-width:17px;padding:1px 4px;border-radius:999px;
              background:var(--overdue);color:#fff;
              font-size:10px;font-weight:800;">
              ${notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ` : ""}
        </button>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad dashboard-content">
        ${renderLegacyPaymentReviewNotice()}

        <section
  class="dashboard-month-card"
  style="
    display:block;
    width:100%;
    height:auto;
    min-height:0;
    box-sizing:border-box;
    padding:18px 20px;
    text-align:left;
  "
  aria-label="This month's bills"
>
  <div
    class="dashboard-card-topline"
    style="
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin:0;
    "
  >
    <span style="font-size:14px;font-weight:800;">
      This Month
    </span>

    <span style="
      font-size:12px;
      font-weight:600;
      color:var(--text-muted);
    ">
      ${summary.paidCount} of ${summary.totalCount} Bills Paid
    </span>
  </div>

  <div style="
    display:grid;
    grid-template-columns:minmax(0,1fr) minmax(0,1fr);
    align-items:start;
    gap:16px;
    margin-top:14px;
  ">
    <button
      type="button"
      onclick="openDashboardStatusSheet('unpaid')"
      aria-label="View this month's due and overdue bills"
      style="
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        gap:4px;
        width:100%;
        height:auto;
        min-height:0;
        margin:0;
        padding:6px 0;
        border:0;
        background:transparent;
        color:inherit;
        font:inherit;
        text-align:left;
        cursor:pointer;
      "
    >
      <span style="
        font-size:12px;
        line-height:1.3;
        color:var(--text-muted);
      ">
        Remaining
      </span>

      <span class="text-upcoming" style="
        font-size:clamp(22px,6.5vw,30px);
        font-weight:800;
        line-height:1.15;
        letter-spacing:-0.6px;
        font-variant-numeric:tabular-nums;
        white-space:nowrap;
      ">
        ${formatCurrency(summary.remainingTotal)}
      </span>
    </button>

    <button
      type="button"
      onclick="openDashboardPaidSheet()"
      aria-label="View this month's paid bills"
      style="
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        gap:4px;
        width:100%;
        height:auto;
        min-height:0;
        margin:0;
        padding:6px 0;
        border:0;
        background:transparent;
        color:inherit;
        font:inherit;
        text-align:right;
        cursor:pointer;
      "
    >
      <span style="
        font-size:12px;
        line-height:1.3;
        color:var(--text-muted);
      ">
        Paid
      </span>

      <span class="text-paid" style="
        font-size:clamp(22px,6.5vw,30px);
        font-weight:800;
        line-height:1.15;
        letter-spacing:-0.6px;
        font-variant-numeric:tabular-nums;
        white-space:nowrap;
      ">
        ${formatCurrency(summary.paidTotal)}
      </span>
    </button>
  </div>

  <div
    class="dashboard-progress-track"
    style="
      height:8px;
      margin:12px 0 0;
      overflow:hidden;
      border-radius:999px;
    "
  >
    <div
      class="dashboard-progress-fill"
      style="
        width:${summary.progress}%;
        height:100%;
        border-radius:inherit;
      "
    ></div>
  </div>
</section>

        <div class="section-header">Bill Status This Month</div>
        <div class="dashboard-status-row">
          <button type="button"
            class="dashboard-status-card status-paid-card"
            onclick="openDashboardPaidSheet()" aria-label="View paid bills">
            <div class="dashboard-status-number text-paid">
              ${summary.paidCount}
            </div>
            <div class="dashboard-status-label">Paid</div>
          </button>

          <button type="button"
            class="dashboard-status-card status-upcoming-card"
            onclick="openDashboardStatusSheet('due')"
            aria-label="View bills due">
            <div class="dashboard-status-number text-upcoming">
              ${dueBills.length}
            </div>
            <div class="dashboard-status-label">Due</div>
          </button>

          <button type="button"
            class="dashboard-status-card status-overdue-card"
            onclick="openDashboardStatusSheet('overdue')"
            aria-label="View overdue bills">
            <div class="dashboard-status-number text-overdue">
              ${overdueBills.length}
            </div>
            <div class="dashboard-status-label">Overdue</div>
          </button>
        </div>

        ${renderDashboardPaycheckPlan(now)}

        <div class="dashboard-section-title-row">
          <div class="section-header dashboard-section-header">
            Upcoming Bills
          </div>
          <button type="button" class="bb-outline-pill"
            style="min-height:34px;padding:0 12px;font-size:var(--text-xs);"
            onclick="openDashboardStatusSheet('upcoming')">
            <span>See All</span>
            <span class="pill-chevron">${svgIcon("chevronRight", 14)}</span>
          </button>
        </div>

        ${upcomingBills.length ? `
          <div class="upcoming-carousel">
            ${upcomingBills.slice(0, 8)
              .map(renderDashboardUpcomingBill).join("")}
          </div>
        ` : `
          <div class="dashboard-empty-card">
            ${svgIcon("checkCircle", 22)}
            <span>No overdue or upcoming bills in the next 7 days</span>
          </div>
        `}

        <div class="dashboard-section-title-row">
          <div class="section-header dashboard-section-header">
            Recent Payments
          </div>
          ${recentPayments.length ? `
            <button type="button" class="bb-outline-pill"
              style="min-height:34px;padding:0 12px;font-size:var(--text-xs);"
              onclick="navigate('history')">
              <span>See All</span>
              <span class="pill-chevron">${svgIcon("chevronRight", 14)}</span>
            </button>
          ` : ""}
        </div>

        ${recentPayments.length ? `
          <div class="card">${recentRows}</div>
        ` : `
          <div class="dashboard-empty-card">
            ${svgIcon("tray", 22)}
            <span>Payments you mark as paid will appear here</span>
          </div>
        `}
      </div>
    </div>
  `;
}
function getCycleForBill(bill) {
  if (bill.payCycle === 'first') return 'early';
  if (bill.payCycle === 'second') return 'late';
  return new Date(bill.dueDate).getDate() <= 15 ? 'early' : 'late';
}

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

  const monthBills = getCalendarBillsForMonth(viewDate);

  const selectedDateKey = routeParams.recurringSelectedDate
    ? getLocalDateKey(routeParams.recurringSelectedDate)
    : null;

  const cells = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    cells.push(`
      <div class="recurring-calendar-day is-empty"></div>
    `);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day, 12, 0, 0);
    const dateString = date.toISOString();

    const dayBills = monthBills.filter((bill) => {
      return getLocalDateKey(bill.dueDate) === getLocalDateKey(dateString);
    });

    const isToday = date.toDateString() === today.toDateString();

    const isSelected =
      selectedDateKey === getLocalDateKey(dateString);

    const hasOverdue = dayBills.some((bill) => {
      return getCalendarBillStatus(bill) === "overdue";
    });

    const hasUpcoming = dayBills.some((bill) => {
      return getCalendarBillStatus(bill) === "upcoming";
    });

    const hasPaid = dayBills.some(isCalendarBillPaid);

    let marker = "";

    if (dayBills.length) {
      const markerClass = hasOverdue
        ? "overdue"
        : hasUpcoming
          ? "upcoming"
          : hasPaid
            ? "paid"
            : "upcoming";

      marker = `
        <i class="recurring-calendar-marker ${markerClass}"></i>
      `;
    }

    cells.push(`
      <button
        type="button"
        class="recurring-calendar-day
          ${isToday ? "is-today" : ""}
          ${isSelected ? "is-selected" : ""}
          ${hasOverdue ? "has-overdue" : ""}"
        onclick="toggleRecurringCalendarDay('${escapeInlineString(dateString)}')"
        aria-label="View Bills For ${formatDate(dateString, "full")}"
        aria-pressed="${isSelected ? "true" : "false"}"
      >
        <span>${day}</span>
        ${marker}
      </button>
    `);
  }

  const selectedDate = routeParams.recurringSelectedDate
    ? new Date(
        `${routeParams.recurringSelectedDate.slice(0, 10)}T12:00:00`
      )
    : null;

  const selectedDayBills = selectedDate
    ? monthBills.filter((bill) => {
        return (
          getLocalDateKey(bill.dueDate) ===
          getLocalDateKey(selectedDate.toISOString())
        );
      })
    : [];
const selectedDayHtml = selectedDate
  ? `
    <div class="recurring-calendar-selected-header">
      <div class="recurring-calendar-selected-title-group">
        <div class="recurring-calendar-selected-date">
          <span class="recurring-calendar-selected-date-icon">
            ${svgIcon("calendar", 18)}
          </span>

          <span>
            ${formatDate(selectedDate.toISOString(), "full")}
          </span>
        </div>

        <div class="recurring-calendar-selected-count">
          ${
            selectedDayBills.length
              ? `${selectedDayBills.length} ${
                  selectedDayBills.length === 1 ? "Bill" : "Bills"
                } Scheduled`
              : "No Bills Scheduled"
          }
        </div>
      </div>

      <button
        type="button"
        class="nav-button"
        onclick="toggleRecurringCalendarDay('${escapeInlineString(selectedDate.toISOString())}')"
        aria-label="Close selected day"
        style="color:var(--text-muted);"
      >
        ${svgIcon("close", 20)}
      </button>
    </div>

    ${
      selectedDayBills.length
        ? `
          <div
            class="card recurring-calendar-selected-list"
            style="margin-bottom:0;"
          >
            ${selectedDayBills
              .map(bill => renderRecurringOccurrenceRow(bill))
              .join("")}
          </div>
        `
        : `
          <div class="recurring-calendar-empty-day">
            ${svgIcon("calendar", 20)}
            <span>Nothing Scheduled For This Day.</span>
          </div>
        `
    }
  `
  : "";
  const prevMonth = new Date(year, month - 1, 1).toISOString();
  const nextMonth = new Date(year, month + 1, 1).toISOString();

  return `
    <section
      class="recurring-calendar-card"
      aria-label="Recurring Bills Calendar"
    >
      <div class="recurring-calendar-heading">
        <button
          type="button"
          class="month-nav-btn"
          onclick="navigate('recurring', { month: '${escapeInlineString(prevMonth)}' })"
          aria-label="Previous Month"
        >
          ${svgIcon("chevronLeft", 18)}
        </button>

        <strong>${formatDate(viewDate.toISOString(), "monthYear")}</strong>

        <button
          type="button"
          class="month-nav-btn"
          onclick="navigate('recurring', { month: '${escapeInlineString(nextMonth)}' })"
          aria-label="Next Month"
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

      ${selectedDayHtml}
    </section>
  `;
}

const RECURRING_SECTION_LIMIT = 3;
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
  const isPaymentPlanInstallment = Boolean(bill.installmentPlanId);

  const statusColor =
    status === "paid"
      ? "var(--paid)"
      : status === "overdue"
        ? "var(--overdue)"
        : "var(--text-muted)";

  const statusLabel =
    status === "paid"
      ? `Paid ${formatDate(bill.dueDate, "short")}`
      : status === "overdue"
        ? `${getRecurringRelativeLabel(bill.dueDate)} · ${formatDate(
            bill.dueDate,
            "short"
          )}`
        : `${getRecurringRelativeLabel(bill.dueDate)} · ${formatDate(
            bill.dueDate,
            "short"
          )}`;

  const clickAction = isPaymentPlanInstallment
    ? `openPaymentPlanDetails('${escapeInlineString(bill.installmentPlanId)}')`
    : `navigate('detail', {
        id: '${escapeInlineString(sourceBillId)}',
        occurrenceDueDate: '${escapeInlineString(bill.dueDate)}',
        returnRoute: 'recurring'
      })`;

  const accessibleLabel = isPaymentPlanInstallment
    ? `View payment plan details for ${bill.name}`
    : `View ${bill.name} due ${formatDate(bill.dueDate, "full")}`;

  const iconBackground = isPaymentPlanInstallment
    ? "transparent"
    : getBillBrand(bill.name)
      ? "#fff"
      : `var(--${getCategory(bill.category).color})`;

  const iconColor = isPaymentPlanInstallment
    ? "var(--accent)"
    : getBillBrand(bill.name)
      ? "#1e1e2e"
      : "#fff";

  return `
    <button
      type="button"
      class="bill-row clickable"
      style="width:100%; text-align:left;"
      onclick="${clickAction}"
      aria-label="${escapeHtml(accessibleLabel)}"
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
          background:${iconBackground};
          color:${iconColor};
        "
      >
        ${billOrPaymentPlanVisual(bill, 42)}
      </div>

      <div class="bill-info">
        <div class="bill-name">${escapeHtml(bill.name)}</div>

        <div class="bill-meta" style="color:${statusColor};">
          ${escapeHtml(statusLabel)}
        </div>
      </div>

      <div style="margin-left:auto; text-align:right;">
        <div class="bill-amount">${formatCurrency(bill.amount)}</div>

        ${
          isPaymentPlanInstallment
            ? `
              <div
                style="
                  margin-top:3px;
                  font-size:var(--text-xs);
                  color:var(--text-muted);
                "
              >
                ${escapeHtml(
                  bill.installmentProvider || "Payment plan"
                )} · Payment ${bill.installmentNumber || 1} of ${
                  bill.installmentTotal || "?"
                }
              </div>
            `
            : ""
        }
      </div>

      <div style="margin-left:var(--space-2); color:var(--text-muted);">
        ${svgIcon("chevronRight", 18)}
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
function toggleRecurringCalendarDay(dateString) {
  const clickedDate = getLocalDateKey(dateString);
  const selectedDate = routeParams.recurringSelectedDate
    ? getLocalDateKey(routeParams.recurringSelectedDate)
    : null;

  if (selectedDate === clickedDate) {
    const { recurringSelectedDate, ...remainingParams } = routeParams;
    navigate("recurring", remainingParams);
    return;
  }

  navigate("recurring", {
    ...routeParams,
    recurringSelectedDate: dateString
  });
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
                        onclick="toggleRecurringSection('${escapeInlineString(id)}')"
                        aria-expanded="false"
                      >
                        <span class="gradient-action-text">Show More</span>
                        ${svgIcon('chevronRight', 18)}
                      </button>
                    `
                    : ''
                }
              </div>
            `
            : `
              <div class="empty-state recurring-empty-state ${
  id === "upcoming" ? "calendar-caught-up" : ""
}">
  ${
    id === "upcoming"
      ? `
        <div class="calendar-caught-up-icon">
          ${svgIcon("checkCircle", 36)}
        </div>

        <h3 class="calendar-caught-up-title">
          ${
            overdue.length > 0
              ? "Nothing Upcoming"
              : "You're All Caught Up"
          }
        </h3>
      `
      : `
        <div class="empty-state-text">
          ${emptyMessage}
        </div>
      `
  }
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
        ${renderLegacyPaymentReviewNotice()}
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
          subtitle: 'Due Today & Over The Next 5 Days',
          bills: upcoming,
          emptyMessage:
            'You have no unpaid bills or payment plans due in the next 5 days.'
        })}

        ${renderSection({
          id: 'later',
          title: 'Coming Up Later',
          subtitle: 'Due In 6 To 10 Days',
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
    dueDate: 'Due Date',
    amountLow: 'Amount: Low to High',
    amountHigh: 'Amount: High to Low',
    name: 'Name: A–Z',
    category: 'Category'
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
  .map((categoryName) => {
    const categoryBills = groups[categoryName].sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );

    const billCount = categoryBills.length;

    return `
      <div>
        <div
          class="section-header"
          style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3);"
        >
          <span>${escapeHtml(categoryName)}</span>

          <span
            aria-label="${billCount} bill${billCount === 1 ? "" : "s"} in ${escapeHtml(categoryName)}"
            style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              min-width:24px;
              height:24px;
              padding:0 8px;
              border-radius:999px;
              background:var(--surface-2);
              border:1px solid var(--border);
              color:var(--text-muted);
              font-size:var(--text-xs);
              font-weight:800;
              line-height:1;
              font-variant-numeric:tabular-nums;
            "
          >
            ${billCount}
          </span>
        </div>

        <div class="card">
          ${categoryBills.map((bill) => billRow(bill, false)).join("")}
        </div>
      </div>
    `;
  })
  .join("");
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
  onclick="openBillForm()"
  aria-label="Add a bill"
>
  ${svgIcon("plus", 18)}
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
  onclick="openBillForm()"
>
  ${svgIcon("plus", 18)}
  Add Bill
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
    { id: 'dueDate', label: 'Due Date', icon: 'calendar' },
    { id: 'amountLow', label: 'Amount: Low to High', icon: 'trendUp' },
    { id: 'amountHigh', label: 'Amount: High to Low', icon: 'trendUp' },
    { id: 'name', label: 'Name: A–Z', icon: 'doc' },
    { id: 'category', label: 'Category', icon: 'tray' },
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
                  onclick="setBillSort('${escapeInlineString(option.id)}')"
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
        onclick="openCalendarDay('${escapeInlineString(date.toISOString())}')"
        aria-label="View ${
          dayBills.length ? `${dayBills.length} Bills Due On ` : ""
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
              onclick="navigate('calendar', { month: '${escapeInlineString(prevMonth)}' })"
              aria-label="Previous month"
            >
              ${svgIcon("chevronLeft", 22)}
            </button>

            <div class="month-nav-title">
              ${formatDate(viewDate.toISOString(), "monthYear")}
            </div>

            <button
              class="month-nav-btn"
              onclick="navigate('calendar', { month: '${escapeInlineString(nextMonth)}' })"
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
                  Add Recurring Bill
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

  const billsForDay = getCalendarBillsForDay(dateString);

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
                ${billsForDay.length === 1 ? "bill" : "bills"} Scheduled
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
                            id:'${escapeInlineString(sourceBillId)}',
                            occurrenceDueDate:'${escapeInlineString(bill.dueDate)}',
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
                            ${billOrPaymentPlanVisual(bill, 42)}
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
                                  '${escapeInlineString(sourceBillId)}',
                                  '${escapeInlineString(bill.dueDate)}'
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
                onclick="closeCalendarDay();openCalendarAddMenu('${escapeInlineString(dateString)}')"
              >
                ${svgIcon("plus", 18)}
                Add Recurring Bill
              </button>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon("calendar", 44)}
                </div>

                <div class="empty-state-title">No Bills Due</div>

                <div class="empty-state-text">
                  There are no bills scheduled for this date.
                </div>

                <button
                  class="calendar-add-pill"
                  onclick="closeCalendarDay();openCalendarAddMenu('${escapeInlineString(dateString)}')"
                >
                  ${svgIcon("plus", 18)}
                  Add Recurring Bill
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
if (!confirmUnlinkedPaymentReview(billId)) return;
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
                ${bills.length} ${bills.length === 1 ? 'bill' : 'bills'} Scheduled
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
  title = "Due & Overdue Bills";
  color = "var(--upcoming)";
  icon = svgIcon("clock", 18);

  selectedBills = monthBills
    .filter(bill => getBillStatusForSheet(bill) !== "paid")
    .sort((a, b) => {
      const aOverdue = getBillStatusForSheet(a) === "overdue";
      const bOverdue = getBillStatusForSheet(b) === "overdue";

      if (aOverdue !== bOverdue) {
        return aOverdue ? -1 : 1;
      }

      return new Date(a.dueDate) - new Date(b.dueDate);
    });
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
  return sum + (
    status === "paid"
      ? getOccurrencePaidAmount(bill)
      : Number(bill.amount || 0)
  );
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
  type="button"
  class="nav-button"
  onclick="closeDashboardStatusSheet()"
  aria-label="Back to dashboard"
  style="color:var(--text);"
>
  ${svgIcon("chevronLeft", 22)}
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
                ${selectedBills.length === 1 ? "Bill" : "Bills"}
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
                        id:'${escapeInlineString(sourceBillId)}',
                         occurrenceDueDate:'${escapeInlineString(bill.dueDate)}',
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
                          ${formatCurrency(
  status === "paid"
    ? getOccurrencePaidAmount(bill)
    : bill.amount
)}
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
  const installmentBills = Store.getBills().filter((bill) =>
    Boolean(bill.installmentPlanId)
  );

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

      const unpaidInstallments = sortedInstallments.filter(
        (bill) => !isOccurrencePaid(bill, new Date(bill.dueDate))
      );

      const representative = sortedInstallments[0];
      const provider = representative.installmentProvider || "Payment Plan";

      const storeName =
        representative.installmentStore?.trim() ||
        String(representative.name || "")
          .replace(/\s+Payment Plan$/i, "")
          .trim() ||
        "";

      const totalAmount = sortedInstallments.reduce(
        (sum, bill) => sum + parseFloat(bill.amount || 0),
        0
      );

      const remainingBalance = unpaidInstallments.reduce(
        (sum, bill) => sum + parseFloat(bill.amount || 0),
        0
      );

      const paidAmount = Math.max(totalAmount - remainingBalance, 0);
      const installmentCount = sortedInstallments.length;
      const paidCount = paidInstallments.length;
      const remainingCount = Math.max(installmentCount - paidCount, 0);

      const paidInFullAt =
        sortedInstallments.find((bill) => bill.paidInFullAt)?.paidInFullAt ||
        null;

      return {
        id: planId,
        provider,
        storeName,
        installmentCount,
        paidCount,
        remainingCount,
        totalAmount,
        paidAmount,
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

  const totalRemainingBalance = activePlans.reduce(
    (sum, plan) => sum + plan.remainingBalance,
    0
  );

  // The four nearest active payment plans.
  const dueNextPlans = activePlans.slice(0, 4);

  // Every active payment plan after the first four.
  const upcomingPlans = activePlans.slice(4);

  // Keep the Upcoming preview compact.
  const visibleUpcomingPlans = upcomingPlans.slice(0, 4);

  // Active-plan cards: first 3 are visible; the rest expand below.
  const visibleActivePlans = activePlans.slice(0, 3);
  const moreActivePlans = activePlans.slice(3);

  const dueNextTotal = dueNextPlans.reduce(
    (sum, plan) => sum + parseFloat(plan.nextInstallment?.amount || 0),
    0
  );

  const upcomingTotal = upcomingPlans.reduce(
    (sum, plan) => sum + parseFloat(plan.nextInstallment?.amount || 0),
    0
  );

  const renderPlanCard = (plan, isCompleted = false) => {
    const planTitle = plan.storeName || plan.provider;

    const planSubtitle = isCompleted
      ? `${plan.provider} · Paid in full`
      : plan.storeName
        ? `${plan.provider} · Payment ${Math.min(
            plan.paidCount + 1,
            plan.installmentCount
          )} of ${plan.installmentCount}`
        : `Payment ${Math.min(
            plan.paidCount + 1,
            plan.installmentCount
          )} of ${plan.installmentCount}`;

    const nextPaymentLabel = plan.nextInstallment
      ? `Next ${formatDate(plan.nextInstallment.dueDate, "short")}`
      : plan.paidInFullAt
        ? `Paid ${formatDate(plan.paidInFullAt, "short")}`
        : "Complete";

    const progressPercent = plan.installmentCount
      ? Math.round((plan.paidCount / plan.installmentCount) * 100)
      : 0;

    const nextPaymentAmount = plan.nextInstallment
      ? formatCurrency(plan.nextInstallment.amount)
      : null;

    return `
      <button
        type="button"
        class="card card-pad"
        style="
          width:100%;
          text-align:left;
          cursor:pointer;
          opacity:${isCompleted ? 0.72 : 1};
          color:inherit;
          background:var(--surface);
          border:1px solid rgba(192, 151, 255, 0.18);
        "
        onclick="openPaymentPlanDetails('${escapeInlineString(plan.id)}')"
        aria-label="View payment plan details for ${escapeHtml(planTitle)}"
      >
        <div style="display:flex; align-items:flex-start; gap:var(--space-3);">
          ${paymentPlanVisual(plan.provider, 42)}

          <div style="min-width:0; flex:1;">
            <div
              style="
                overflow:hidden;
                font-size:var(--text-base);
                font-weight:800;
                text-overflow:ellipsis;
                white-space:nowrap;
              "
            >
              ${escapeHtml(planTitle)}
            </div>

            <div
              style="
                margin-top:4px;
                overflow:hidden;
                font-size:var(--text-sm);
                color:var(--text-muted);
                text-overflow:ellipsis;
                white-space:nowrap;
              "
            >
              ${escapeHtml(planSubtitle)}
            </div>
          </div>

          <div style="min-width:92px; text-align:right;">
            <div
              style="
                font-size:var(--text-base);
                font-weight:800;
                color:${isCompleted ? "var(--text-muted)" : "var(--text)"};
                white-space:nowrap;
              "
            >
              ${
                isCompleted
                  ? "Paid in full"
                  : `${formatCurrency(plan.remainingBalance)} left`
              }
            </div>

            <div
              style="
                margin-top:4px;
                font-size:var(--text-xs);
                color:var(--text-muted);
                white-space:nowrap;
              "
            >
              ${escapeHtml(nextPaymentLabel)}
            </div>
          </div>
        </div>

        <div
          style="
            height:6px;
            margin-top:14px;
            overflow:hidden;
            border-radius:999px;
            background:rgba(174, 96, 255, 0.14);
          "
          aria-label="${progressPercent}% of payments completed"
        >
          <div
            style="
              width:${progressPercent}%;
              height:100%;
              border-radius:inherit;
              background:${
                isCompleted
                  ? "var(--text-subtle, #6f6b7c)"
                  : "linear-gradient(105deg, #8f36ff 0%, #c44cff 34%, #f64cae 65%, #ff7138 100%)"
              };
              transition:width 180ms ease;
            "
          ></div>
        </div>

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:var(--space-3);
            margin-top:8px;
            font-size:var(--text-xs);
            color:var(--text-muted);
          "
        >
          <span>
            ${plan.paidCount} of ${plan.installmentCount} payments complete
          </span>

          <span>
            ${
              nextPaymentAmount
                ? `Next payment ${nextPaymentAmount}`
                : "Plan complete"
            }
          </span>
        </div>
      </button>
    `;
  };

  const renderOverviewRow = (plan, showPill = false) => {
    const title = plan.storeName || plan.provider;
    const dueDate = formatDate(plan.nextInstallment.dueDate, "short");
    const paymentAmount = formatCurrency(plan.nextInstallment.amount);
    const paymentNumber = Math.min(
      plan.paidCount + 1,
      plan.installmentCount
    );

    return `
      <button
        type="button"
        onclick="openPaymentPlanDetails('${escapeInlineString(plan.id)}')"
        style="
          display:flex;
          width:100%;
          align-items:center;
          gap:var(--space-3);
          padding:var(--space-3) var(--space-4);
          color:inherit;
          text-align:left;
          cursor:pointer;
          background:transparent;
          border:0;
        "
        aria-label="View ${escapeHtml(title)} payment plan"
      >
        ${paymentPlanVisual(plan.provider, 42)}

        <div style="min-width:0; flex:1;">
          <div
            style="
              overflow:hidden;
              font-size:var(--text-base);
              font-weight:800;
              text-overflow:ellipsis;
              white-space:nowrap;
            "
          >
            ${escapeHtml(title)}
          </div>

          <div
            style="
              margin-top:3px;
              overflow:hidden;
              font-size:var(--text-sm);
              color:var(--text-muted);
              text-overflow:ellipsis;
              white-space:nowrap;
            "
          >
            Payment ${paymentNumber} of ${plan.installmentCount} · Due ${dueDate}
          </div>
        </div>

        ${
          showPill
            ? `
              <div
                style="
                  padding:7px 12px;
                  border:1px solid rgba(226, 185, 255, 0.68);
                  border-radius:999px;
                  color:var(--text);
                  font-size:var(--text-base);
                  font-weight:800;
                  white-space:nowrap;
                "
              >
                ${paymentAmount}
              </div>
            `
            : `
              <div
                style="
                  color:var(--text);
                  font-size:var(--text-base);
                  font-weight:800;
                  white-space:nowrap;
                "
              >
                ${paymentAmount}
              </div>
            `
        }
      </button>
    `;
  };

  const renderJumpButton = (targetId, label = "See More") => `
    <button
      type="button"
      onclick="document.getElementById('${escapeInlineString(targetId)}').scrollIntoView({ behavior: 'smooth' })"
      style="
        width:100%;
        padding:var(--space-3) var(--space-4);
        border:0;
        border-top:1px solid rgba(192, 151, 255, 0.14);
        color:#c76aff;
        background:transparent;
        font-size:var(--text-base);
        font-weight:850;
        cursor:pointer;
      "
    >
      ${label}
    </button>
  `;

  return `
    <div class="nav-bar">
  <div
    class="nav-bar-content"
    style="
      display:grid;
      grid-template-columns:44px 1fr 44px;
      align-items:center;
    "
  >
    <button
      type="button"
      class="nav-button"
      onclick="navigate('more')"
      aria-label="Back to More"
      title="Back to More"
      style="
        width:44px;
        height:44px;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0;
        color:var(--text);
      "
    >
      ${svgIcon("chevronLeft", 22)}
    </button>

    <div
      class="nav-title"
      style="
        min-width:0;
        text-align:center;
      "
    >
      Installments
    </div>

    <button
      type="button"
      class="nav-button"
      onclick="closeAddMenu(); openInstallmentPlanForm()"
      aria-label="Add a payment plan"
      title="Add payment plan"
      style="
        width:44px;
        height:44px;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0;
        color:#b45cff;
      "
    >
      ${svgIcon("plus", 22)}
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
                  Add a bill with installments to track it here.
                </div>

                <button
                  type="button"
                  class="button button-primary"
                  style="
                    width:min(100%, 290px);
                    justify-content:center;
                    margin-top:var(--space-4);
                    color:#fff;
                    border:0;
                    background:linear-gradient(
                      105deg,
                      #8f36ff 0%,
                      #c44cff 34%,
                      #f64cae 65%,
                      #ff7138 100%
                    );
                    box-shadow:0 12px 32px rgba(231, 68, 182, 0.24);
                  "
                  onclick="closeAddMenu(); openInstallmentPlanForm()"
                >
                  ${svgIcon("plus", 18)}
                  Add payment plan
                </button>
              </div>
            `
            : `
              <section
                style="
                  padding:var(--space-4) 0 var(--space-4);
                  text-align:center;
                "
              >
                <div
                  style="
                    font-size:var(--text-base);
                    color:var(--text-muted);
                  "
                >
                  Remaining Balance
                </div>

                <div
                  style="
                    margin-top:7px;
                    font-size:clamp(40px, 11vw, 56px);
                    line-height:1;
                    font-weight:900;
                    letter-spacing:-0.05em;
                    color:var(--text);
                  "
                >
                  ${formatCurrency(totalRemainingBalance)}
                </div>

                <div
                  style="
                    margin-top:11px;
                    font-size:var(--text-base);
                    color:var(--text-muted);
                  "
                >
                  ${activePlans.length} Active ${
                    activePlans.length === 1 ? "Installment" : "Installments"
                  } Remaining
                </div>
              </section>

              ${
                dueNextPlans.length
                  ? `
                    <section
                      class="card"
                      style="
                        overflow:hidden;
                        background:var(--surface);
                        border:1px solid rgba(192, 151, 255, 0.18);
                      "
                    >
                      <div
                        style="
                          display:flex;
                          align-items:center;
                          justify-content:space-between;
                          gap:var(--space-3);
                          padding:var(--space-4) var(--space-4) var(--space-3);
                        "
                      >
                        <div
                          style="
                            display:flex;
                            align-items:center;
                            gap:10px;
                            font-size:var(--text-xl);
                            font-weight:850;
                          "
                        >
                          Due Next

                          <span
                            style="
                              display:inline-flex;
                              align-items:center;
                              justify-content:center;
                              min-width:28px;
                              height:28px;
                              padding:0 8px;
                              border-radius:999px;
                              color:#efcaff;
                              background:linear-gradient(
                                105deg,
                                rgba(143, 54, 255, 0.35),
                                rgba(246, 76, 174, 0.28)
                              );
                              font-size:var(--text-sm);
                              font-weight:850;
                            "
                          >
                            ${dueNextPlans.length}
                          </span>
                        </div>

                        <div
                          style="
                            font-size:var(--text-xl);
                            font-weight:850;
                            white-space:nowrap;
                          "
                        >
                          ${formatCurrency(dueNextTotal)}
                        </div>
                      </div>

                      <div>
                        ${dueNextPlans
                          .map((plan) => renderOverviewRow(plan, true))
                          .join("")}
                      </div>

                      ${
  activePlans.length > 4
    ? `
      <button
        type="button"
        onclick="openPaymentPlanSchedule('month')"
        style="
          width:100%;
          padding:var(--space-3) var(--space-4);
          border:0;
          border-top:1px solid rgba(192, 151, 255, 0.14);
          color:#c76aff;
          background:transparent;
          font-size:var(--text-base);
          font-weight:850;
          cursor:pointer;
        "
      >
        <span class="gradient-action-text">See More</span>
      </button>
    `
    : ""
}
                    </section>
                  `
                  : ""
              }

              ${
                visibleUpcomingPlans.length
                  ? `
                    <section
                      class="card"
                      style="
                        overflow:hidden;
                        background:var(--surface);
                        border:1px solid rgba(192, 151, 255, 0.18);
                      "
                    >
                      <div
                        style="
                          display:flex;
                          align-items:center;
                          justify-content:space-between;
                          gap:var(--space-3);
                          padding:var(--space-4) var(--space-4) var(--space-3);
                        "
                      >
                        <div
                          style="
                            display:flex;
                            align-items:center;
                            gap:10px;
                            font-size:var(--text-xl);
                            font-weight:850;
                          "
                        >
                          Upcoming

                          <span
                            style="
                              display:inline-flex;
                              align-items:center;
                              justify-content:center;
                              min-width:28px;
                              height:28px;
                              padding:0 8px;
                              border-radius:999px;
                              color:#efcaff;
                              background:linear-gradient(
                                105deg,
                                rgba(143, 54, 255, 0.35),
                                rgba(246, 76, 174, 0.28)
                              );
                              font-size:var(--text-sm);
                              font-weight:850;
                            "
                          >
                            ${upcomingPlans.length}
                          </span>
                        </div>

                        <div
                          style="
                            font-size:var(--text-xl);
                            font-weight:850;
                            white-space:nowrap;
                          "
                        >
                          ${formatCurrency(upcomingTotal)}
                        </div>
                      </div>

                      <div>
                        ${visibleUpcomingPlans
                          .map((plan) => renderOverviewRow(plan))
                          .join("")}
                      </div>

                      ${
  upcomingPlans.length > 0
    ? `
      <button
        type="button"
        onclick="openPaymentPlanSchedule('upcoming')"
        style="
          width:100%;
          padding:var(--space-3) var(--space-4);
          border:0;
          border-top:1px solid rgba(192, 151, 255, 0.14);
          color:#c76aff;
          background:transparent;
          font-size:var(--text-base);
          font-weight:850;
          cursor:pointer;
        "
      >
        <span class="gradient-action-text">See More</span>
      </button>
    `
    : ""
}
                       </section>
                  `
                  : ""
              }
             ${
  visibleActivePlans.length
    ? `
      <section id="active-payment-plans">
        <div class="section-header">Active Installments</div>

        <div class="content-gap">
          ${visibleActivePlans
            .map((plan) => renderPlanCard(plan))
            .join("")}
        </div>

        ${
          moreActivePlans.length
            ? `
                <div
                id="extra-active-payment-plans"
                class="content-gap"
                style="display:none; margin-top:var(--space-3);"
              >
                ${moreActivePlans
                  .map((plan) => renderPlanCard(plan))
                  .join("")}
              </div>
              <button
                type="button"
                id="toggle-active-payment-plans"
                onclick="showMoreActivePaymentPlans()"
                style="
                  width:100%;
                  margin-top:var(--space-2);
                  padding:var(--space-3) var(--space-4);
                  border:1px solid rgba(192, 151, 255, 0.28);
                  border-radius:14px;
                  color:#c76aff;
                  background:transparent;
                  font-size:var(--text-base);
                  font-weight:850;
                  cursor:pointer;
                "
              >
                <span class="gradient-action-text">Show More</span>
              </button>
            `
            : ""
        }
      </section>
    `
    : ""
}

              ${
                completedPlans.length
                  ? `
                    <button
                      type="button"
                      onclick="openCompletedPlansHistory()"
                      style="
  display:flex;
  width:100%;
  align-items:center;
  justify-content:center;
  gap:10px;
  margin-top:var(--space-3);
  padding:15px var(--space-4);
  border:0;
  border-radius:14px;
  color:#fff;
  background:linear-gradient(
    105deg,
    #8f36ff 0%,
    #c44cff 34%,
    #f64cae 65%,
    #ff7138 100%
  );
  box-shadow:0 12px 32px rgba(231, 68, 182, 0.22);
  font-family:inherit;
  font-size:var(--text-base);
  font-weight:850;
  cursor:pointer;
"
                    >
                      ${svgIcon("clock", 18)}
                      History
                    </button>
                  `
                  : ""
              }
            `
        }
            </div>
    </div>
  `;
}

function showMoreActivePaymentPlans() {
  const extraPlans = document.getElementById("extra-active-payment-plans");
  const toggleButton = document.getElementById("toggle-active-payment-plans");

  if (!extraPlans || !toggleButton) return;

  const isExpanded = extraPlans.style.display !== "none";

  extraPlans.style.display = isExpanded ? "none" : "grid";
  toggleButton.innerHTML = `
  <span class="gradient-action-text">
    ${isExpanded ? "Show More" : "Show Less"}
  </span>
`;

  if (isExpanded) {
    toggleButton.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
}
window.showMoreActivePaymentPlans = showMoreActivePaymentPlans;
function getUnpaidPaymentPlanInstallments() {
  return Store.getBills()
    .filter((bill) => Boolean(bill.installmentPlanId))
    .filter((bill) => !isOccurrencePaid(bill, new Date(bill.dueDate)))
    .map((bill) => {
      const provider = bill.installmentProvider || "Payment Plan";

      const storeName =
        bill.installmentStore?.trim() ||
        String(bill.name || "")
          .replace(/\s+Payment Plan$/i, "")
          .trim() ||
        provider;

      return {
        id: bill.id,
        planId: bill.installmentPlanId,
        provider,
        storeName,
        amount: parseFloat(bill.amount || 0),
        dueDate: bill.dueDate,
        installmentNumber: bill.installmentNumber || null,
        installmentTotal: bill.installmentTotal || null,
      };
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function getPaymentPlanScheduleGroups(type) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    12,
    0,
    0,
    0
  );

  const currentMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    12,
    0,
    0,
    0
  );

  const nextMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    12,
    0,
    0,
    0
  );

  const installments = getUnpaidPaymentPlanInstallments().filter((item) => {
    const dueDate = new Date(item.dueDate);

    if (type === "month") {
      return (
        dueDate >= startOfToday &&
        dueDate >= currentMonthStart &&
        dueDate < nextMonthStart
      );
    }

    return dueDate >= nextMonthStart;
  });

  const groups = installments.reduce((result, installment) => {
    const dueDate = new Date(installment.dueDate);
    const key = `${dueDate.getFullYear()}-${String(
      dueDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!result[key]) {
      result[key] = {
        date: new Date(dueDate.getFullYear(), dueDate.getMonth(), 1),
        items: [],
      };
    }

    result[key].items.push(installment);
    return result;
  }, {});

  return Object.values(groups).sort((a, b) => a.date - b.date);
}

function closePaymentPlanSchedule() {
  document
    .getElementById("paymentPlanScheduleOverlay")
    ?.classList.remove("show");

  document
    .getElementById("paymentPlanScheduleSheet")
    ?.classList.remove("show");

  setTimeout(() => {
    document.getElementById("paymentPlanScheduleContainer")?.remove();
    unlockBackgroundScroll();
  }, 300);
}

function openPaymentPlanSchedule(type = "month") {
  document.getElementById("paymentPlanScheduleContainer")?.remove();

  const isCurrentMonth = type === "month";
  const title = isCurrentMonth
    ? "This Month's Payments"
    : "Upcoming Payment Schedule";

  const groups = getPaymentPlanScheduleGroups(type);

  const renderInstallment = (item) => {
    const dueDate = new Date(item.dueDate);
    const day = dueDate.getDate();
    const month = formatDate(item.dueDate, "monthShort");

    const installmentText =
      item.installmentNumber && item.installmentTotal
        ? `Payment ${item.installmentNumber} of ${item.installmentTotal}`
        : item.provider;

    return `
      <button
        type="button"
        class="bill-row"
        style="
          width:100%;
          text-align:left;
          background:transparent;
          border:0;
          color:inherit;
          cursor:pointer;
        "
        onclick="closePaymentPlanSchedule(); openPaymentPlanDetails('${escapeInlineString(item.planId)}')"
        aria-label="View ${escapeHtml(item.storeName)} payment plan"
      >
        <div
          style="
            width:46px;
            min-width:46px;
            padding:6px 0;
            border-radius:12px;
            text-align:center;
            color:var(--text);
            background:rgba(143, 54, 255, 0.12);
          "
        >
          <div style="font-size:var(--text-xs); color:var(--text-muted);">
            ${month}
          </div>

          <div style="margin-top:2px; font-size:var(--text-lg); font-weight:900;">
            ${day}
          </div>
        </div>

        <div
          style="
            width:42px;
            height:42px;
            min-width:42px;
            display:flex;
            align-items:center;
            justify-content:center;
            overflow:hidden;
          "
        >
          ${paymentPlanVisual(item.provider, 38)}
        </div>

        <div class="bill-info">
          <div class="bill-name">${escapeHtml(item.storeName)}</div>

          <div class="bill-meta">
            ${escapeHtml(item.provider)} · ${escapeHtml(installmentText)}
          </div>
        </div>

        <div
          style="
            margin-left:auto;
            padding:7px 11px;
            border:1px solid rgba(226, 185, 255, 0.68);
            border-radius:999px;
            font-size:var(--text-sm);
            font-weight:800;
            white-space:nowrap;
          "
        >
          ${formatCurrency(item.amount)}
        </div>
      </button>
    `;
  };

  const renderGroup = (group) => {
    const groupTotal = group.items.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    return `
      <section>
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:var(--space-3);
            margin:var(--space-3) 0 var(--space-2);
          "
        >
          <div
            style="
              font-size:var(--text-xl);
              font-weight:900;
              letter-spacing:-0.02em;
            "
          >
            ${formatDate(group.date.toISOString(), "monthYear")}
          </div>

          <div
            style="
              font-size:var(--text-base);
              font-weight:800;
              color:var(--text-muted);
            "
          >
            ${formatCurrency(groupTotal)}
          </div>
        </div>

        <div class="card">
          ${group.items.map(renderInstallment).join("")}
        </div>
      </section>
    `;
  };

  const container = document.createElement("div");
  container.id = "paymentPlanScheduleContainer";

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="paymentPlanScheduleOverlay"
      onclick="closePaymentPlanSchedule()"
    ></div>

    <div
      class="sheet"
      id="paymentPlanScheduleSheet"
      style="max-height:94vh;"
      role="dialog"
      aria-modal="true"
      aria-label="${escapeHtml(title)}"
    >
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
  <button
    type="button"
    class="nav-button"
    onclick="closePaymentPlanSchedule()"
    aria-label="Back to payment plans"
    style="color:#b45cff;"
  >
    ${svgIcon("chevronLeft", 22)}
  </button>

  <div class="sheet-title">${title}</div>

  <div style="width:54px"></div>
</div>

      <div class="sheet-body content-gap">
        ${
          groups.length
            ? groups.map(renderGroup).join("")
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon("checkCircle", 44)}
                </div>

                <div class="empty-state-title">Nothing Scheduled</div>

                <div class="empty-state-text">
                  ${
                    isCurrentMonth
                      ? "You have no remaining payment-plan installments due this month."
                      : "You have no remaining payment-plan installments after this month."
                  }
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
      .getElementById("paymentPlanScheduleOverlay")
      ?.classList.add("show");

    document
      .getElementById("paymentPlanScheduleSheet")
      ?.classList.add("show");
  });
}

window.openPaymentPlanSchedule = openPaymentPlanSchedule;
window.closePaymentPlanSchedule = closePaymentPlanSchedule;
function getCompletedPaymentPlans() {
  const installmentBills = Store.getBills().filter((bill) =>
    Boolean(bill.installmentPlanId)
  );

  const plansById = installmentBills.reduce((plans, bill) => {
    if (!plans[bill.installmentPlanId]) {
      plans[bill.installmentPlanId] = [];
    }

    plans[bill.installmentPlanId].push(bill);
    return plans;
  }, {});

  return Object.entries(plansById)
    .map(([planId, installments]) => {
      const sortedInstallments = [...installments].sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
      );

      const paidInstallments = sortedInstallments.filter((bill) =>
        isOccurrencePaid(bill, new Date(bill.dueDate))
      );

      const unpaidInstallments = sortedInstallments.filter(
        (bill) => !isOccurrencePaid(bill, new Date(bill.dueDate))
      );

      if (unpaidInstallments.length) {
        return null;
      }

      const representative = sortedInstallments[0];
      const provider = representative.installmentProvider || "Payment Plan";

      const storeName =
        representative.installmentStore?.trim() ||
        String(representative.name || "")
          .replace(/\s+Payment Plan$/i, "")
          .trim() ||
        "";

      const totalAmount = sortedInstallments.reduce(
        (sum, bill) => sum + parseFloat(bill.amount || 0),
        0
      );

      const paidInFullAt =
        sortedInstallments.find((bill) => bill.paidInFullAt)?.paidInFullAt ||
        null;

      return {
        id: planId,
        provider,
        storeName,
        installmentCount: sortedInstallments.length,
        paidCount: paidInstallments.length,
        totalAmount,
        paidInFullAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dateA = a.paidInFullAt
        ? new Date(a.paidInFullAt).getTime()
        : 0;

      const dateB = b.paidInFullAt
        ? new Date(b.paidInFullAt).getTime()
        : 0;

      return dateB - dateA;
    });
}

function openCompletedPlansHistory() {
  document.getElementById("completed-plans-history")?.remove();

  const completedPlans = getCompletedPaymentPlans();

  const renderHistoryCard = (plan) => {
  const title = plan.storeName || plan.provider;

  return `
    <button
      type="button"
      onclick="closeCompletedPlansHistory(); openPaymentPlanDetails('${escapeInlineString(plan.id)}')"
      style="
        display:flex;
        width:100%;
        align-items:center;
        gap:var(--space-3);
        padding:var(--space-4);
        text-align:left;
        color:inherit;
        cursor:pointer;
        background:var(--surface);
        border:1px solid rgba(192, 151, 255, 0.18);
        border-radius:16px;
      "
      aria-label="View completed payment plan for ${escapeHtml(title)}"
    >
      ${paymentPlanVisual(plan.provider, 42)}

      <div style="min-width:0; flex:1;">
        <div
          style="
            overflow:hidden;
            font-size:var(--text-base);
            font-weight:800;
            text-overflow:ellipsis;
            white-space:nowrap;
          "
        >
          ${escapeHtml(title)}
        </div>

        <div
          style="
            margin-top:4px;
            font-size:var(--text-sm);
            color:var(--text-muted);
          "
        >
          Paid in full
        </div>
      </div>

      <div
        style="
          font-size:var(--text-base);
          font-weight:800;
          white-space:nowrap;
        "
      >
        ${formatCurrency(plan.totalAmount)} paid
      </div>
    </button>
  `;
};
  const container = document.createElement("div");
  container.id = "completed-plans-history";

  container.innerHTML = `
    <div
      style="
        position:fixed;
        inset:0;
        z-index:1000;
        overflow-y:auto;
        background:var(--bg, #09090c);
        color:var(--text, #f7f5fa);
      "
      role="dialog"
      aria-modal="true"
      aria-label="Completed Installments"
    >
      <div class="nav-bar">
        <div class="nav-bar-content">
          <div class="nav-button" aria-hidden="true"></div>

          <div class="nav-title">Completed plans</div>

          <button
            type="button"
            class="nav-button"
            onclick="closeCompletedPlansHistory()"
            aria-label="Close completed plans history"
            style="color:#b45cff;"
          >
            ${svgIcon("close", 22)}
          </button>
        </div>
      </div>

      <div class="main-content fade-in">
        <div class="content-pad content-gap">
          <div
            style="
              padding:var(--space-2) 0 var(--space-1);
              color:var(--text-muted);
              font-size:var(--text-sm);
            "
          >
            ${completedPlans.length} Completed ${
              completedPlans.length === 1 ? "Plan" : "Plans"
            }
          </div>

          <div
            style="
              font-size:var(--text-2xl);
              font-weight:900;
              letter-spacing:-0.03em;
            "
          >
            Payment History
          </div>

          <div
            style="
              margin-top:6px;
              color:var(--text-muted);
              font-size:var(--text-sm);
              line-height:1.5;
            "
          >
            Review installment plans you have paid in full.
          </div>

          <div class="content-gap" style="margin-top:var(--space-4);">
            ${
              completedPlans.length
                ? completedPlans.map(renderHistoryCard).join("")
                : `
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      ${svgIcon("creditcard", 44)}
                    </div>
                    <div class="empty-state-title">No Completed Plans</div>
                    <div class="empty-state-text">
                      Completed payment plans will appear here.
                    </div>
                  </div>
                `
            }
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
}

function closeCompletedPlansHistory() {
  document.getElementById("completed-plans-history")?.remove();
}

window.openCompletedPlansHistory = openCompletedPlansHistory;
window.closeCompletedPlansHistory = closeCompletedPlansHistory;
function closePaymentPlanDetails() {
  document.getElementById("paymentPlanDetailsOverlay")?.classList.remove("show");
  document.getElementById("paymentPlanDetailsSheet")?.classList.remove("show");

  setTimeout(() => {
    document.getElementById("paymentPlanDetailsContainer")?.remove();
    unlockBackgroundScroll();
  }, 300);
}
function openPaymentPlanDetails(planId) {
  const installments = Store.getBills()
    .filter((bill) => bill.installmentPlanId === planId)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (!installments.length) {
    alert("Payment plan not found.");
    return;
  }

  const representative = installments[0];

  const provider =
    representative.installmentProvider || "Payment Plan";

  const storeName =
    representative.installmentStore?.trim() ||
    String(representative.name || "")
      .replace(/\s+Payment Plan$/i, "")
      .trim() ||
    provider;

  const paidInstallments = installments.filter((bill) => {
    return isOccurrencePaid(bill, new Date(bill.dueDate));
  });

  const unpaidInstallments = installments.filter((bill) => {
    return !isOccurrencePaid(bill, new Date(bill.dueDate));
  });

  const totalAmount = installments.reduce((sum, bill) => {
    return sum + parseFloat(bill.amount || 0);
  }, 0);

  const remainingBalance = unpaidInstallments.reduce((sum, bill) => {
    return sum + parseFloat(bill.amount || 0);
  }, 0);

  const paidAmount = Math.max(totalAmount - remainingBalance, 0);
  const installmentCount = installments.length;
  const paidCount = paidInstallments.length;
  const remainingCount = Math.max(installmentCount - paidCount, 0);
  const nextInstallment = unpaidInstallments[0] || null;

  document.getElementById("paymentPlanDetailsContainer")?.remove();

  const installmentRows = installments
    .map((bill) => {
      const dueDate = new Date(bill.dueDate);
      const payment = getActivePaymentForOccurrence(bill, dueDate);
      const status = getOccurrenceStatus(bill, dueDate);
      const isPaid = isOccurrencePaid(bill, dueDate);

      const statusColor = isPaid
        ? "var(--paid)"
        : status === "overdue"
          ? "var(--overdue)"
          : "var(--text-muted)";

      const statusLabel = isPaid
        ? `Paid ${formatDate(payment?.paidDate || bill.dueDate, "short")}`
        : status === "overdue"
          ? `Overdue ${formatDate(bill.dueDate, "short")}`
          : `Due ${formatDate(bill.dueDate, "short")}`;

      return `
        <div class="bill-row" style="align-items:center;">
          <div
            class="bill-icon"
            style="
              background:transparent;
              color:var(--accent);
              overflow:hidden;
            "
          >
            ${paymentPlanVisual(provider, 34)}
          </div>

          <div class="bill-info">
            <div class="bill-name">
              Payment ${bill.installmentNumber || "—"} of ${
                bill.installmentTotal || installmentCount
              }
            </div>

            <div class="bill-meta" style="color:${statusColor};">
              ${escapeHtml(statusLabel)}
            </div>
          </div>

          <div style="margin-left:auto; text-align:right;">
            <div class="bill-amount">
              ${formatCurrency(bill.amount)}
            </div>

            <div
              style="
                margin-top:3px;
                font-size:var(--text-xs);
                font-weight:800;
                color:${statusColor};
              "
            >
              ${
                isPaid
                  ? "PAID"
                  : status === "overdue"
                    ? "OVERDUE"
                    : "UNPAID"
              }
            </div>
          </div>
        </div>
      `;
    })
    .join("");

 const paymentSelectorHtml = unpaidInstallments.length
  ? `
    <div class="section-header">Make a Payment</div>

    <div class="card card-pad" style="margin-bottom:0;">
      <select
        id="paymentPlanInstallmentSelect"
        class="form-input"
        aria-label="Choose a Scheduled Payment"
        style="
          width:100%;
          height:52px;
          padding:0 14px;
          border:1px solid var(--border);
          border-radius:12px;
          background:var(--surface-2);
          color:var(--text);
          font-size:var(--text-sm);
          font-weight:800;
        "
      >
        ${unpaidInstallments
          .map((bill) => {
            const number = bill.installmentNumber || "—";
            const total = bill.installmentTotal || installmentCount;

            return `
              <option value="${escapeHtml(bill.id)}">
                Installment ${number} of ${total} ·
                ${formatDate(bill.dueDate, "short")} ·
                ${formatCurrency(bill.amount)}
              </option>
            `;
          })
          .join("")}
      </select>

      <button
  id="markSelectedPlanPaymentButton"
  type="button"
  class="btn-primary"
  style="
    width:100%;
    margin:var(--space-3) 0 0;
  "
  onclick="markSelectedPlanInstallmentPaid('${escapeInlineString(planId)}')"
>
  ${svgIcon("checkCircle", 18)}
  Mark as Paid
</button>
    </div>
  `
  : `
    <div class="section-header">Make a Payment</div>

    <div class="card card-pad" style="margin-bottom:0;">
      <div
        style="
          display:flex;
          align-items:center;
          gap:var(--space-2);
          color:var(--paid);
          font-weight:800;
        "
      >
        ${svgIcon("checkCircle", 20)}
        This payment plan is paid in full.
      </div>
    </div>
  `;

  const container = document.createElement("div");
  container.id = "paymentPlanDetailsContainer";

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="paymentPlanDetailsOverlay"
      onclick="closePaymentPlanDetails()"
    ></div>

    <div class="sheet" id="paymentPlanDetailsSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button
          type="button"
          class="nav-button"
          onclick="closePaymentPlanDetails()"
          aria-label="Close payment plan details"
          style="color:var(--text);"
        >
          ${svgIcon("close", 22)}
        </button>

        <div class="sheet-title">Payment Plan</div>

        <button
          type="button"
          class="nav-button"
          onclick="
            closePaymentPlanDetails();
            openPaymentPlanActions('${escapeInlineString(planId)}');
          "
          aria-label="Payment plan actions"
          style="color:var(--text);"
        >
          ${svgIcon("moreVertical", 22)}
        </button>
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
            ${paymentPlanVisual(provider, 46)}

            <div style="min-width:0; flex:1;">
              <div
                style="
                  font-size:var(--text-lg);
                  font-weight:800;
                  overflow:hidden;
                  text-overflow:ellipsis;
                  white-space:nowrap;
                "
              >
                ${escapeHtml(storeName)}
              </div>

              <div
                style="
                  margin-top:4px;
                  font-size:var(--text-sm);
                  color:var(--text-muted);
                "
              >
                ${escapeHtml(provider)}
              </div>
            </div>

            <div style="text-align:right;">
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

        ${paymentSelectorHtml}

        <div class="section-header">Summary</div>

        <div class="card" style="margin-bottom:0;">
          ${detailRow("Total Purchase", formatCurrency(totalAmount))}
          ${detailRow(
            "Each Payment",
            formatCurrency(
              installmentCount
                ? totalAmount / installmentCount
                : 0
            )
          )}
          ${detailRow("Paid So Far", formatCurrency(paidAmount))}
          ${detailRow(
            "Remaining Balance",
            formatCurrency(remainingBalance)
          )}
          ${detailRow(
            "Payments Left",
            `${remainingCount} of ${installmentCount}`
          )}
        </div>

        <div class="section-header">Next Payment</div>

        <div class="card" style="margin-bottom:0;">
          ${detailRow(
            "Next Payment",
            nextInstallment
              ? formatDate(nextInstallment.dueDate, "full")
              : "Paid in full"
          )}
          ${detailRow(
            "Next Amount",
            nextInstallment
              ? formatCurrency(nextInstallment.amount)
              : "—"
          )}
        </div>

        <div class="section-header">Installments</div>

        <div class="card" style="margin-bottom:0;">
          ${installmentRows}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document
      .getElementById("paymentPlanDetailsOverlay")
      ?.classList.add("show");

    document
      .getElementById("paymentPlanDetailsSheet")
      ?.classList.add("show");
  });
}
function openPaymentPlanActions(planId) {
  const installments = Store.getBills()
    .filter((bill) => bill.installmentPlanId === planId)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (!installments.length) {
    alert("Payment plan not found.");
    return;
  }

  const unpaidInstallments = installments.filter(
    (bill) => !isOccurrencePaid(bill, new Date(bill.dueDate))
  );

  const representative = installments[0];
  const provider = representative.installmentProvider || "Payment Plan";
  const storeName =
    representative.installmentStore?.trim() ||
    String(representative.name || provider)
      .replace(/\s*Payment Plan\s*$/i, "")
      .trim() ||
    provider;

  const remainingBalance = unpaidInstallments.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  document
    .getElementById("paymentPlanActionsContainer")
    ?.remove();

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

            <div style="min-width:0; flex:1">
              <div
                style="
                  font-size:var(--text-base);
                  font-weight:800;
                  overflow:hidden;
                  text-overflow:ellipsis;
                  white-space:nowrap;
                "
              >
                ${escapeHtml(storeName)}
              </div>

              <div
                style="
                  margin-top:4px;
                  font-size:var(--text-sm);
                  color:var(--text-muted);
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

        ${
          unpaidInstallments.length
            ? `
              <button
                type="button"
                class="btn-primary"
                style="width:100%"
                onclick="payPaymentPlanInFull('${escapeInlineString(planId)}')"
              >
                ${svgIcon("checkCircle", 20)}
                Pay in Full
              </button>
            `
            : ""
        }
        <button
          type="button"
          class="btn-danger"
          style="width:100%"
          onclick="confirmDeletePaymentPlan('${escapeInlineString(planId)}')"
        >
          ${svgIcon("trash", 20)}
          Delete Plan
        </button>

        <button
          type="button"
          class="btn-secondary"
          style="width:100%"
          onclick="openExistingPaymentPlanEditor('${escapeInlineString(planId)}')"
        >
          ${svgIcon("gear", 20)}
          Edit Plan
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
function confirmDeletePaymentPlan(planId) {
  const installments = Store.getBills()
    .filter((bill) => bill.installmentPlanId === planId)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (!installments.length) {
    alert("Payment plan not found.");
    return;
  }

  const representative = installments[0];
  const provider = representative.installmentProvider || "Payment Plan";
  const storeName =
    representative.installmentStore?.trim() ||
    String(representative.name || provider)
      .replace(/\s*Payment Plan\s*$/i, "")
      .trim() ||
    provider;

  const confirmed = window.confirm(
    `Delete ${storeName}?\n\n` +
      `This removes all ${installments.length} installments` +
      `Payment and activity history should remain available.`
  );

  if (!confirmed) return;

  closePaymentPlanActions();

window.setTimeout(() => {
  archivePaymentPlan(planId);
}, 320);
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
function archivePaymentPlan(planId) {
  const installments = Store.getBills().filter(
    bill => bill.installmentPlanId === planId
  );

  if (!installments.length) {
    alert("Payment plan not found.");
    return;
  }

  // Use the shared archive path, which archives all installments
  // in this plan and records one plan-level activity entry.
  archiveBill(installments[0].id);

  render();
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
  document.getElementById("categorySpendingContainer")?.remove();

  const category = getCategory(categoryId);

  const items = getMonthlyCategoryPayments(new Date()).filter(
    item => item.categoryId === categoryId
  );

  const total = dashboardMoneyTotal(
    items.map(item => item.amount)
  );

  const rows = items.map(item => {
    const paidDate = item.paidDate
      ? formatDate(item.paidDate, "full")
      : "Date unavailable";

    return `
      <div class="bill-row">
        <div class="bill-icon" style="
          background:var(--paid-bg);
          color:var(--paid);
        ">
          ${svgIcon("checkCircle", 20)}
        </div>

        <div class="bill-info">
          <div class="bill-name">
            ${escapeHtml(item.name)}
          </div>

          <div class="bill-meta" style="color:var(--paid);">
            Paid ${escapeHtml(paidDate)}
          </div>

          <div class="bill-meta">
            Due ${formatDate(item.dueDate, "short")}
          </div>

          ${item.removed ? `
            <div class="bill-meta" style="color:var(--overdue);">
              Removed — payment retained
            </div>
          ` : ""}
        </div>

        <div class="bill-amount" style="color:var(--paid);">
          ${formatCurrency(item.amount)}
        </div>
      </div>
    `;
  }).join("");

  const container = document.createElement("div");
  container.id = "categorySpendingContainer";

  container.innerHTML = `
    <div class="sheet-overlay"
      id="categorySpendingOverlay"
      onclick="closeCategorySpendingSheet()"></div>

    <div class="sheet"
      id="categorySpendingSheet"
      role="dialog"
      aria-modal="true"
      aria-label="${escapeHtml(category.label)} payments">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button type="button" class="nav-button"
          onclick="closeCategorySpendingSheet()"
          aria-label="Close category spending">
          ${svgIcon("close", 22)}
        </button>

        <div class="sheet-title">
          ${escapeHtml(category.label)}
        </div>

        <div style="width:54px;"></div>
      </div>

      <div class="sheet-body content-gap">
        <div class="card">
          <div class="form-row">
            <div style="
              display:flex;
              align-items:center;
              gap:var(--space-2);
              color:var(--paid);
            ">
              ${svgIcon("checkCircle", 18)}
              <span style="font-weight:700;">
                ${items.length}
                ${items.length === 1 ? "Bill" : "Bills"}
              </span>
            </div>

            <div style="
              margin-left:auto;
              font-size:var(--text-lg);
              font-weight:800;
              color:var(--paid);
            ">
              ${formatCurrency(total)}
            </div>
          </div>
        </div>

        ${items.length ? `
          <div class="card">${rows}</div>
        ` : `
          <div class="dashboard-empty-card">
            ${svgIcon("tray", 22)}
            <span>No paid bills in this category for this month.</span>
          </div>
        `}

        <button type="button" class="bb-outline-pill"
          style="width:100%;"
          onclick="closeCategorySpendingSheet();navigate('history');">
          View All Payment History
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document.getElementById("categorySpendingOverlay")
      ?.classList.add("show");

    document.getElementById("categorySpendingSheet")
      ?.classList.add("show");
  });
}
function getMonthlyCategoryPayments(referenceDate = new Date()) {
  const validCategoryIds = new Set(
    CATEGORIES.map(category => category.id)
  );

  return getDashboardPaidOccurrences(referenceDate).map(item => {
    const snapshotCategory = item.payments
      .map(payment => payment.billSnapshot?.category)
      .find(Boolean);

    const storedCategory =
      snapshotCategory ||
      item.bill?.category ||
      "other";

    const categoryId = validCategoryIds.has(storedCategory)
      ? storedCategory
      : "other";

    return {
      ...item,
      categoryId
    };
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
const scheduledThisMonth = getDashboardMonthSummary(now).scheduled;
const paidThisMonth = getDashboardMonthSummary(now).paidTotal;

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

  const activeBillsById = new Map(
  Store.getBills()
    .filter((bill) => !bill.archivedAt)
    .map((bill) => [bill.id, bill])
);
const categoryPayments = getMonthlyCategoryPayments(now);
const categoryCents = {};

for (const item of categoryPayments) {
  const amountCents = Math.round(Number(item.amount) * 100);

  if (!Number.isFinite(amountCents)) continue;

  categoryCents[item.categoryId] =
    (categoryCents[item.categoryId] || 0) + amountCents;
}

const catTotals = Object.fromEntries(
  Object.entries(categoryCents).map(([categoryId, cents]) => [
    categoryId,
    cents / 100
  ])
);
  const catEntries = Object.entries(catTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const maxCat = catEntries.length ? catEntries[0][1] : 1;
const monthlyData = [];

for (let i = 5; i >= 0; i -= 1) {
  const date = new Date(
    now.getFullYear(),
    now.getMonth() - i,
    1,
    12,
    0,
    0
  );

  monthlyData.push({
    label: formatDate(date.toISOString(), "monthShort"),
    amount: getDashboardMonthSummary(date).paidTotal
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
                  getDashboardMonthSummary(now).progress
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
              Bill${unpaidBillsThisMonth.length === 1 ? "" : "s"} Remaining
            </span>

            <span>
              ${
                estimatedMonthlyIncome > 0
                  ? `Est. ${formatCurrency(estimatedRemaining)} After Bills`
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
                aria-label="View Installments"
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
                      Installments
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
                          : `${activePlans.length} Installments`
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
                  id: '${escapeInlineString(largestUpcomingBill.isOccurrence
                      ? largestUpcomingBill.sourceBillId
                      : largestUpcomingBill.id)}',
                  occurrenceDueDate: '${escapeInlineString(largestUpcomingBill.dueDate)}',
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
                          onclick="openCategorySpendingSheet('${escapeInlineString(categoryId)}')"
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
    case "bill_created":
    case "bill_imported":
    case "income_source_created":
      return {
        icon: "plus",
        color: "var(--paid)",
      };

    case "bill_paid":
      return {
        icon: "checkCircle",
        color: "var(--paid)",
      };

    case "payment_voided":
    case "payment_undone":
    case "payment_plan_cancelled":
      return {
        icon: "close",
        color: "var(--overdue)",
      };

    case "bill_amount_changed":
      return {
        icon: "trendUp",
        color: "var(--accent)",
      };

    case "bill_due_date_changed":
    case "bill_schedule_changed":
    case "bill_postponed":
    case "recurring_occurrence_postponed":
      return {
        icon: "calendar",
        color: "var(--accent)",
      };

    case "bill_autopay_changed":
    case "payment_plan_created":
      return {
        icon: "creditcard",
        color: "var(--accent)",
      };

    case "bill_reminders_changed":
      return {
        icon: "bell",
        color: "var(--accent)",
      };

    case "bill_updated":
    case "recurring_occurrence_updated":
    case "payment_plan_updated":
    case "income_source_updated":
      return {
        icon: "gear",
        color: "var(--accent)",
      };

    case "bill_deleted":
    case "bill_archived":
    case "income_source_deleted":
      return {
        icon: "trash",
        color: "var(--overdue)",
      };

    case "bill_restored":
    case "payment_plan_restored":
    case "payment_plan_paid_in_full":
      return {
        icon: "checkCircle",
        color: "var(--paid)",
      };

    case "backup_restored":
      return {
        icon: "internaldrive",
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
    case "bill_created":
      return "Bill added";

    case "bill_imported":
      return "Bill imported";

    case "bill_paid":
      return "Bill paid";

    case "payment_voided":
      return "Payment reversed";

    case "payment_undone":
      return "Payment undone";

    case "bill_amount_changed":
      return "Amount Changed";

    case "bill_due_date_changed":
      return "Due Date Changed";

    case "bill_schedule_changed":
      return "Schedule Changed";

    case "bill_postponed":
      return "Bill Postponed";

    case "recurring_occurrence_postponed":
      return "Recurring Bill Postponed";

    case "bill_autopay_changed":
      return "Autopay Changed";

    case "bill_reminders_changed":
      return "Reminders Changed";

    case "bill_updated":
      return "Bill updated";

    case "recurring_occurrence_updated":
      return "Recurring bill updated";

    case "bill_deleted":
      return "Bill deleted";

    case "bill_archived":
      return "Bill archived";

    case "bill_restored":
      return "Bill restored";

    case "payment_plan_created":
      return "Payment plan added";

    case "payment_plan_updated":
      return "Payment plan updated";

    case "payment_plan_paid_in_full":
      return "Payment plan paid in full";

    case "payment_plan_cancelled":
      return "Payment plan cancelled";

    case "payment_plan_restored":
      return "Payment plan restored";

    case "income_source_created":
      return "Income source added";

    case "income_source_updated":
      return "Income source updated";

    case "income_source_deleted":
      return "Income source deleted";

    case "backup_restored":
      return "Backup restored";

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
  onclick="navigate('more')"
  aria-label="Back to More"
  title="Back to More"
  style="color:var(--text)"
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
const HOUSEHOLD_INVITE_WORKER_URL =
  "https://bill-beacon-notifications.rodz-m-1990.workers.dev";

async function getHouseholdInviteFirebaseToken() {
  if (typeof window.getBillBeaconFirebaseToken === "function") {
    const token = await window.getBillBeaconFirebaseToken();

    if (token) {
      return token;
    }
  }

  if (
    window.BillBeaconAuth &&
    typeof window.BillBeaconAuth.getIdToken === "function"
  ) {
    const token = await window.BillBeaconAuth.getIdToken();

    if (token) {
      return token;
    }
  }

  return "";
}

async function copyHouseholdInviteLink(inviteUrl) {
  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(inviteUrl);
    return true;
  }

  const textarea = document.createElement("textarea");

  textarea.value = inviteUrl;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");

  textarea.remove();

  return copied;
}

async function createHouseholdInvite() {
  const button = document.getElementById(
    "createHouseholdInviteButton"
  );

  const status = document.getElementById(
    "householdInviteStatus"
  );

  if (!button || !status) {
    return;
  }

  const token = await getHouseholdInviteFirebaseToken();

  if (!token) {
    status.textContent =
      "Your sign-in session is not ready. Refresh the app and try again.";
    return;
  }

  const originalButtonHtml = button.innerHTML;

  try {
    button.disabled = true;
    button.textContent = "Creating invite…";
    status.textContent = "Creating your private invite link…";

    const response = await fetch(
      `${HOUSEHOLD_INVITE_WORKER_URL}/household-invites`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`
        }
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok || !result.inviteUrl) {
      throw new Error(
        result.error ||
          `The invite service returned status ${response.status}.`
      );
    }

    const copied = await copyHouseholdInviteLink(
      result.inviteUrl
    );

    const expiration = result.expiresAt
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short"
        }).format(new Date(result.expiresAt))
      : "7 days";

    status.textContent = copied
      ? `Invite link copied. It expires ${expiration}.`
      : `Invite link created. Copy this link: ${result.inviteUrl}`;
  } catch (error) {
    console.error("Could not create household invite:", error);

    status.textContent =
      error?.message ||
      "Could not create an invite link. Try again.";
  } finally {
    button.disabled = false;
    button.innerHTML = originalButtonHtml;
  }
}

window.createHouseholdInvite = createHouseholdInvite;
function getHouseholdInviteTokenFromUrl() {
  const url = new URL(window.location.href);
  const token = (url.searchParams.get("invite") || "").trim();

  return /^[a-f0-9]{64}$/i.test(token) ? token : "";
}

function removeHouseholdInviteTokenFromUrl() {
  const url = new URL(window.location.href);

  url.searchParams.delete("invite");

  window.history.replaceState(
    {},
    document.title,
    `${url.pathname}${url.search}${url.hash}`
  );
}

function showHouseholdInviteJoinScreen(token) {
  const app = document.getElementById("app");

  if (!app) {
    return;
  }

  app.innerHTML = `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <div class="nav-title">Join Household</div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad">
        <div class="settings-section">
          <div class="section-header">Shared Household Invite</div>

          <div class="card card-pad">
            <div style="font-size:var(--text-lg);font-weight:800">
              Join this shared household?
            </div>

            <div
              style="
                margin-top:8px;
                font-size:var(--text-sm);
                color:var(--text-muted);
                line-height:1.5;
              "
            >
              You will be able to view and manage the same bills, payments,
              reminders, and settings as the household owner.
            </div>

            <button
              id="acceptHouseholdInviteButton"
              class="btn-primary"
              type="button"
              style="width:100%;margin-top:var(--space-4)"
            >
              Join Household
            </button>

            <button
              id="cancelHouseholdInviteButton"
              class="bb-outline-pill"
              type="button"
              style="
                width:100%;
                min-height:46px;
                margin-top:var(--space-3);
              "
            >
              Not Now
            </button>

            <div
              id="acceptHouseholdInviteStatus"
              role="status"
              aria-live="polite"
              style="
                min-height:20px;
                margin-top:12px;
                font-size:var(--text-sm);
                color:var(--text-muted);
              "
            ></div>
          </div>

          <div class="settings-footer">
            This invite can be used only once. Make sure you are signed in
            with the account that should join the household.
          </div>
        </div>
      </div>
    </div>
  `;

  const joinButton = document.getElementById(
    "acceptHouseholdInviteButton"
  );

  const cancelButton = document.getElementById(
    "cancelHouseholdInviteButton"
  );

  const status = document.getElementById(
    "acceptHouseholdInviteStatus"
  );

  cancelButton?.addEventListener("click", () => {
    removeHouseholdInviteTokenFromUrl();

    window.location.reload();
  });

  joinButton?.addEventListener("click", async () => {
    const firebaseToken =
      await getHouseholdInviteFirebaseToken();

    if (!firebaseToken) {
      status.textContent =
        "Your sign-in session is not ready. Refresh the app and try again.";
      return;
    }

    const originalButtonText = joinButton.textContent;

    try {
      joinButton.disabled = true;
      cancelButton.disabled = true;
      joinButton.textContent = "Joining…";
      status.textContent = "Joining the shared household…";

      const response = await fetch(
        `${HOUSEHOLD_INVITE_WORKER_URL}/household-invites/accept`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${firebaseToken}`
          },
          body: JSON.stringify({
            token
          })
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            `The invite service returned status ${response.status}.`
        );
      }

      status.textContent =
        "You joined the household. Loading shared bills…";

      removeHouseholdInviteTokenFromUrl();

      window.setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Could not accept household invite:", error);

      status.textContent =
        error?.message ||
        "Could not join the household. Try again.";

      joinButton.disabled = false;
      cancelButton.disabled = false;
      joinButton.textContent = originalButtonText;
    }
  });
}

function handleHouseholdInviteFromUrl() {
  const token = getHouseholdInviteTokenFromUrl();

  if (!token) {
    return false;
  }

  showHouseholdInviteJoinScreen(token);

  return true;
}
function renderSettings() {
  const settings = Store.getSettings();
  const activeBills = Store.getBills();

const regularBillCount = activeBills.filter(
  (bill) => !bill.installmentPlanId
).length;

const paymentPlanCount = new Set(
  activeBills
    .filter((bill) => {
      return (
        bill.installmentPlanId &&
        !bill.archivedAt &&
        !bill.cancelledAt &&
        !bill.paidInFullAt &&
        bill.status !== "cancelled" &&
        bill.status !== "paid-in-full" &&
        bill.status !== "paidInFull"
      );
    })
    .map((bill) => bill.installmentPlanId)
).size;

const dataSummaryParts = [];

if (regularBillCount > 0) {
  dataSummaryParts.push(
    `${regularBillCount} bill${regularBillCount === 1 ? "" : "s"}`
  );
}

if (paymentPlanCount > 0) {
  dataSummaryParts.push(
    `${paymentPlanCount} payment plan${paymentPlanCount === 1 ? "" : "s"}`
  );
}

const dataSummary =
  dataSummaryParts.length > 0
    ? dataSummaryParts.join(" · ")
    : "No active bills or payment plans";

  const currentAccountEmail =
    window.getBillBeaconUserEmail?.() || "Signed in household account";

  return `
    <div class="nav-bar">
  <div class="nav-bar-content">

    <button
      type="button"
      class="nav-button"
      onclick="navigate('more')"
      aria-label="Back to More"
      title="Back to More"
      style="color:var(--text)"
    >
      ${svgIcon("chevronLeft", 22)}
    </button>

    <div class="nav-title">Settings</div>

    <div style="width:44px"></div>

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
                settings.theme === "dark" || settings.theme === "system"
                  ? svgIcon("check", 20)
                  : ""
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
                settings.theme === "light"
                  ? svgIcon("check", 20)
                  : ""
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
                          onclick="openIncomeSourceForm('${escapeInlineString(source.id)}')"
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
                                "short"
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
                    .join("")
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
            <span class="pill-icon">${svgIcon("plus", 18)}</span>
            <span>Add Income Source</span>
          </button>
        </div>
       
        <div class="settings-section">
          <div class="section-header">Data</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">
                ${svgIcon("internaldrive", 18)}
              </div>

              <div style="flex:1;color:var(--text-muted)">
                ${dataSummary}
              </div>
            </div>

            <div
              class="form-row"
              onclick="navigate('activity')"
              style="cursor:pointer"
            >
              <div class="form-label">
                ${svgIcon("doc", 18)}
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
                  Payments, reversals, bill changes, and archives
                </div>
              </div>

              ${svgIcon("chevronRight", 18)}
            </div>

            <div
              class="form-row"
              onclick="exportCSV()"
              style="cursor:pointer"
            >
              <div class="form-label">${svgIcon("export", 18)}</div>

              <div style="flex:1;color:var(--text)">
  Export Bills CSV
</div>
            </div>

            <div
              class="form-row"
              onclick="document.getElementById('billImportFile').click()"
              style="cursor:pointer"
            >
              <div class="form-label">${svgIcon("tray", 18)}</div>

              <div style="flex:1;color:var(--text)">
  Import Bills CSV
</div>

              <input
                id="billImportFile"
                type="file"
                accept=".csv,text/csv"
                style="display:none"
                onchange="importBillsCSV(event)"
              >
            </div>

            <div
              class="form-row"
              onclick="clearAllAppData()"
              style="cursor:pointer"
            >
              <div class="form-label">${svgIcon("trash", 18)}</div>

              <div style="flex:1;color:var(--overdue)">
                Clear All App Data
              </div>
            </div>
          </div>

        </div>
                    <div class="settings-section">
          <div class="section-header">Account</div>

          <div class="card card-pad">
            <button
              id="signout-button"
              type="button"
              class="btn-primary"
              style="width:100%;margin:0;"
            >
              Sign Out
            </button>
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
              <span class="about-value">Cloud Firestore</span>
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

              <span
                class="about-value"
                style="
                  max-width:62%;
                  overflow-wrap:anywhere;
                  text-align:right;
                "
              >
                ${escapeHtml(currentAccountEmail)}
              </span>
            </div>
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

  if (['every 2 weeks', 'every two weeks', 'every other week', 'biweekly', 'fortnightly'].includes(input)) {
    return 'Every 2 Weeks';
  }
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
  let bill = Store.getBill(routeParams.id) ||
    getArchivedBills().find(item => item.id === routeParams.id);

  if (!bill) {
    navigate("bills");
    return "";
  }

  const occurrenceDueDate = routeParams.occurrenceDueDate || null;
const returnRoute = routeParams.returnRoute || null;

const sourceRecord = bill;
const selectedDueDate = occurrenceDueDate || (
  isRecurringBill(bill) || bill.scheduleHistory?.length
    ? getCurrentCalendarBillOccurrence(bill)?.dueDate || bill.dueDate
    : bill.dueDate
);
const resolved = resolveCalendarBillOccurrence(bill.id, selectedDueDate);
const detailBill = resolved || {...bill, dueDate: selectedDueDate, isOccurrence: false};
const isRecurring = Boolean(detailBill.isOccurrence);
const isArchivedHistory = Boolean(sourceRecord.archivedAt);
bill = {...bill, ...detailBill, id: sourceRecord.id};

const referenceDate = new Date(selectedDueDate);

const payment = getActivePaymentForOccurrence(
  detailBill,
  referenceDate
);

const status = payment
  ? "paid"
  : getOccurrenceStatus(detailBill, referenceDate);

const cat = getCategory(bill.category);
const sourceBillId = bill.id;

// This means the user reached a specific recurring occurrence,
// including an implicit occurrence for a recurring bill opened
// from the normal Bills list.
const isCalendarOccurrence = isRecurring && Boolean(occurrenceDueDate);
  const backRoute = returnRoute || (
  isCalendarOccurrence ? 'recurring' : 'bills'
);

const backParams = backRoute === 'recurring' && isCalendarOccurrence
  ? `{ month: '${escapeInlineString(detailBill.dueDate)}' }`
  : '{}';
const backAction = routeParams.returnToNotificationPopup
  ? "returnToNotificationCenter()"
  : `navigate('${escapeInlineString(backRoute)}', ${backParams})`;

const backLabel = routeParams.returnToNotificationPopup
  ? "Notifications"
  : backRoute === 'today'
    ? 'Dashboard'
    : backRoute === 'recurring'
      ? 'Recurring'
      : 'Bills';
const markPaidAction = isRecurring
  ? `confirmMarkPaidOccurrence(
      '${escapeInlineString(sourceBillId)}',
      '${escapeInlineString(detailBill.dueDate)}'
    )`
  : `markBillPaid('${escapeInlineString(sourceBillId)}')`;

const markUnpaidAction = isRecurring
  ? `markBillOccurrenceUnpaid(
      '${escapeInlineString(sourceBillId)}',
      '${escapeInlineString(detailBill.dueDate)}'
    )`
  : `markBillUnpaid('${escapeInlineString(sourceBillId)}')`;

const postponeAction = isRecurring
  ? `openPostponeRecurringOccurrenceSheet(
      '${escapeInlineString(sourceBillId)}',
      '${escapeInlineString(detailBill.originalDueDate || detailBill.dueDate)}'
    )`
  : `openPostponeBillSheet('${escapeInlineString(sourceBillId)}')`;
  const paymentAction = isArchivedHistory ? `<div class="settings-footer">Archived history — read only.</div>` : !payment
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
        onclick="${markPaidAction}"
      >
        ${svgIcon("checkCircle", 18)}
        Mark as Paid
      </button>

      <button
        class="bb-outline-pill"
        style="width:100%;min-width:0;margin:0;padding:0 12px"
        onclick="${postponeAction}"
      >
        ${svgIcon("calendar", 18)}
        <span>Postpone</span>
      </button>
    </div>
  `
  : `
    <button
      class="bb-outline-pill"
      style="width:100%;min-height:46px;margin-top:var(--space-4);"
      onclick="${markUnpaidAction}"
    >
      ${svgIcon("close", 18)}
      <span>Mark as Unpaid</span>
    </button>
  `;

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <button
  type="button"
  class="nav-button"
  onclick="${backAction}"
  aria-label="Back to ${backLabel}"
  style="color:var(--text);"
>
  ${svgIcon("chevronLeft", 22)}
  ${backLabel}
</button>

        <button
  type="button"
  class="nav-button"
  ${isArchivedHistory ? 'disabled' : `onclick="openBillForm('${escapeInlineString(sourceBillId)}')"`}
  style="color:var(--text);"
>
  ${isArchivedHistory ? "Archived" : "Edit"}
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
            !isArchivedHistory && safePaymentUrl(bill.paymentUrl)
              ? `
                <button
                  class="btn-primary"
                  style="width:100%;margin-top:var(--space-4);"
                  onclick="openPaymentPage('${escapeInlineString(sourceBillId)}')"
                >
                  Make a Payment
                </button>
              `
              : `
                <button
                  class="btn-secondary"
                  style="width:100%;margin-top:var(--space-4);"
                  ${isArchivedHistory ? 'disabled' : `onclick="openPaymentLinkPopup('${escapeInlineString(sourceBillId)}')"`}
                >
                  Add Payment Link
                </button>
              `
          }
        </div>

        ${renderLegacyPaymentReviewNotice(sourceBillId)}
        ${paymentAction}

        <button
          type="button"
          class="bb-outline-pill bill-show-details-button"
          style="
            width:100%;
            min-height:46px;
            margin-top:var(--space-3);
          "
          onclick="openBillDetailsSheet('${escapeInlineString(sourceBillId)}')"
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
    case 'Every 2 Weeks':
      return 'Repeats Every 2 Weeks';

    case 'Weekly':
      return `Repeats Weekly`;

    case 'Monthly':
      return `Due on The ${ordinal(day)} of Each Month`;

    case 'Quarterly':
      return `Repeats Every 3 Months`;

    case 'Yearly':
      return `Repeats Yearly`;

    default:
      return `Due ${formatDate(bill.dueDate, 'full')}`;
  }
}

function billRow(bill, clickable = false) {
  const cat = getCategory(bill.category);
  const dueDate = new Date(bill.dueDate);

  const dueDay =
    bill.recurrence === "Monthly"
      ? getMonthlyDueDay(bill)
      : dueDate.getDate();

  const ordinal = (() => {
    const value = Number(dueDay);
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
  })();

  const scheduleText =
    bill.recurrence && bill.recurrence !== "None"
      ? bill.recurrence === "Monthly"
        ? `Due on the ${ordinal} of each month`
        : getBillScheduleLabel(bill)
      : `Due on ${formatDate(bill.dueDate, "full")}`;

  const detailBillId = bill.isOccurrence
    ? bill.sourceBillId
    : bill.id;

  const detailDueDate = bill.isOccurrence
    ? bill.dueDate
    : "";

  const rowClick = clickable
    ? `
      onclick="openBillDetailsSheet('${escapeInlineString(detailBillId)}')"
      role="button"
      tabindex="0"
      onkeydown="
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openBillDetailsSheet('${escapeInlineString(detailBillId)}');
        }
      "
    `
    : "";

  const moreButtonAction = bill.isOccurrence
    ? `
      navigate('detail', {
        id: '${escapeInlineString(detailBillId)}',
        occurrenceDueDate: '${escapeInlineString(detailDueDate)}',
        returnRoute: 'recurring'
      })
    `
    : `openBillQuickActions('${escapeInlineString(detailBillId)}')`;

  return `
    <div class="bill-row ${clickable ? "clickable" : ""}" ${rowClick}>
      <div
        class="bill-icon"
        style="
          background:${
            getBillBrand(bill.name)
              ? "#fff"
              : `var(--${cat.color})`
          };
          color:${getBillBrand(bill.name) ? "#1e1e2e" : "white"};
          padding:${getBillBrand(bill.name) ? "3px" : "0"};
          overflow:hidden;
        "
      >
        ${billVisual(bill, 32)}
      </div>

      <div class="bill-info">
        <div class="bill-name">${escapeHtml(bill.name)}</div>

        <div class="bill-meta-row">
          <div class="bill-meta">${scheduleText}</div>
        </div>
      </div>

      <div
        style="
          display:flex;
          align-items:center;
          gap:6px;
        "
      >
        <div
          style="
            display:flex;
            flex-direction:column;
            align-items:flex-end;
            gap:4px;
          "
        >
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
            ${moreButtonAction}
          "
        >
          ${svgIcon("moreVertical", 22)}
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
  { id: 'recurring', label: 'Calendar', icon: 'calendar' },
  { id: 'bills', label: 'Bills', icon: 'tray' },
  { id: 'insights', label: 'Insights', icon: 'chart' },
  { id: "more", label: "More", icon: "moreVertical" }
  
];

  return `
    <div class="tab-bar">
      ${tabs.map(tab => `
        <button class="tab-item ${currentRoute === tab.id ? 'active' : ''}" onclick="navigate('${escapeInlineString(tab.id)}')">
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
          Add Recurring Bill
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
          onclick="closeCalendarAddMenu(); openBillForm(null, '${escapeInlineString(selectedDate)}')"
        >
          ${svgIcon('plus', 20)}
          Add Recurring Bill
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
                value="${escapeHtml(source ? source.name : '')}"
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
                value="${escapeHtml(source ? source.expectedAmount : '')}"
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
                    value="${escapeHtml(frequency)}"
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
                value="${escapeHtml(source ? source.nextPayDate.split('T')[0] : today)}"
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
            onclick="confirmDeleteIncomeSource('${escapeInlineString(source.id)}')"
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

  const sourceBillId = bill.isOccurrence
    ? bill.sourceBillId
    : bill.id;

  const occurrenceDueDate = bill.isOccurrence
    ? bill.dueDate
    : getBillOccurrenceDueDate(bill, new Date());

  const detailBill = bill.isOccurrence
    ? bill
    : {
        ...bill,
        sourceBillId: bill.id,
        dueDate: occurrenceDueDate,
        isOccurrence: isRecurringBill(bill)
      };

  const isPaid = isOccurrencePaid(
    detailBill,
    new Date(occurrenceDueDate)
  );

  const paymentActionHtml = isPaid
    ? `
      <button
        type="button"
        class="bill-sheet-action"
        onclick="
          closeBillQuickActions();
          ${
            isRecurringBill(bill)
              ? `markBillOccurrenceUnpaid(
                  '${escapeInlineString(sourceBillId)}',
                  '${escapeInlineString(occurrenceDueDate)}'
                )`
              : `markBillUnpaid('${escapeInlineString(sourceBillId)}')`
          };
        "
      >
        <span>${svgIcon("close", 20)}</span>
        <span>Mark as Unpaid</span>
        <span>${svgIcon("chevronRight", 18)}</span>
      </button>
    `
    : `
      <button
        type="button"
        class="bill-sheet-action"
        onclick="
          closeBillQuickActions();
          ${
            isRecurringBill(bill)
              ? `confirmMarkPaidOccurrence(
                  '${escapeInlineString(sourceBillId)}',
                  '${escapeInlineString(occurrenceDueDate)}'
                )`
              : `markBillPaid('${escapeInlineString(sourceBillId)}')`
          };
        "
      >
        <span>${svgIcon("checkCircle", 20)}</span>
        <span>Mark as Paid</span>
        <span>${svgIcon("chevronRight", 18)}</span>
      </button>
    `;

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
          type="button"
          class="nav-button"
          onclick="closeBillQuickActions()"
          aria-label="Close bill actions"
          style="color:var(--text);"
        >
          ${svgIcon("chevronLeft", 22)}
        </button>

        <div class="sheet-title">Bill Actions</div>

        <div style="width:54px"></div>
      </div>

      <div class="sheet-body">
        <div class="bill-sheet-actions">
          <button
            type="button"
            class="bill-sheet-action"
            onclick="
              closeBillQuickActions();
              openBillForm('${escapeInlineString(sourceBillId)}');
            "
          >
            <span>${svgIcon("gear", 20)}</span>
            <span>Edit Details</span>
            <span>${svgIcon("chevronRight", 18)}</span>
          </button>

          ${paymentActionHtml}

          <button
            type="button"
            class="bill-sheet-action bill-sheet-action-danger"
            onclick="
              closeBillQuickActions();
              openBillActionRemove('${escapeInlineString(sourceBillId)}');
            "
          >
            <span>${svgIcon("trash", 20)}</span>
            <span>Delete Bill</span>
            <span>${svgIcon("chevronRight", 18)}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("billQuickActionsContainer")?.remove();

  const container = document.createElement("div");
  container.id = "billQuickActionsContainer";
  container.innerHTML = sheetHtml;

  document.body.appendChild(container);

  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document
      .getElementById("billQuickActionsOverlay")
      ?.classList.add("show");

    document
      .getElementById("billQuickActionsSheet")
      ?.classList.add("show");
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
                    ${isVoided ? "Payment Voided" : "Payment made"}
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
  const today = new Date().toISOString().split("T")[0];

  const dueDate = bill
    ? bill.dueDate.split("T")[0]
    : selectedDate || today;

  const defaultPaycheckAssignment =
    bill?.paycheckAssignment || "auto";

  const selectedReminders = bill
    ? bill.reminderOffsets || [7, 1]
    : [7, 1];

  const currentDueDay = bill?.dueDay
    ? Number(bill.dueDay)
    : new Date(`${dueDate}T12:00:00`).getDate();

  const sheetHtml = `
    <div class="sheet-overlay" id="sheetOverlay" onclick="closeBillForm()"></div>

    <div class="sheet" id="billSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button
          type="button"
          class="nav-button"
          onclick="closeBillForm()"
          style="color:var(--text);"
        >
          Cancel
        </button>

        <div class="sheet-title">${bill ? "Edit Bill" : "New Bill"}</div>

        <button
          type="button"
          class="nav-button"
          onclick="saveBill()"
          style="color:var(--text); font-weight:700;"
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
                  value="${escapeHtml(bill ? bill.name : "")}"
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
                  value="${escapeHtml(bill ? bill.amount : "")}"
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
                ${CATEGORIES.map(
                  (category) => `
                    <option
                      value="${escapeHtml(category.id)}"
                      ${
                        bill && bill.category === category.id
                          ? "selected"
                          : ""
                      }
                    >
                      ${category.label}
                    </option>
                  `
                ).join("")}
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
                  ${RECURRENCE.map(
                    (recurrence) => `
                      <option
                        value="${escapeHtml(recurrence)}"
                        ${
                          bill && bill.recurrence === recurrence
                            ? "selected"
                            : ""
                        }
                      >
                        ${recurrence}
                      </option>
                    `
                  ).join("")}
                </select>
              </div>

              <div class="form-row">
                <div class="form-label" id="billDueDateLabel">Due Date</div>

                <input
                  class="form-input"
                  id="billDueDate"
                  type="date"
                  value="${escapeHtml(dueDate)}"
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
                        value="${escapeHtml(day)}"
                        ${currentDueDay === day ? "selected" : ""}
                      >
                        ${day}
                      </option>
                    `;
                  }).join("")}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div class="section-header">Paycheck Plan</div>

            <div class="card">
              <div class="form-row">
                <div class="form-label">Fund with</div>

                <select
                  class="form-select"
                  id="billPaycheckAssignment"
                >
                  <option
                    value="auto"
                    ${
                      defaultPaycheckAssignment === "auto"
                        ? "selected"
                        : ""
                    }
                  >
                    Automatic by due date
                  </option>

                  <option
                    value="first"
                    ${
                      defaultPaycheckAssignment === "first"
                        ? "selected"
                        : ""
                    }
                  >
                    First paycheck · 1st
                  </option>

                  <option
                    value="second"
                    ${
                      defaultPaycheckAssignment === "second"
                        ? "selected"
                        : ""
                    }
                  >
                    Second paycheck · 15th
                  </option>

                  <option
                    value="previous"
                    ${
                      defaultPaycheckAssignment === "previous"
                        ? "selected"
                        : ""
                    }
                  >
                    Previous paycheck · 15th
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
                ${PAYMENT_METHODS.map(
                  (method) => `
                    <option
                      value="${escapeHtml(method)}"
                      ${
                        bill && bill.paymentMethod === method
                          ? "selected"
                          : ""
                      }
                    >
                      ${method || "None"}
                    </option>
                  `
                ).join("")}
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
                  id="billPaymentUrl"
                  type="text"
                  inputmode="url"
                  placeholder="provider.com/pay"
                  value="${escapeHtml(bill ? bill.paymentUrl || "" : "")}"
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
                    ${bill && bill.autopay ? "checked" : ""}
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
              ${REMINDER_OFFSETS.map(
                (reminder) => `
                  <div class="form-row">
                    <div class="form-label">${reminder.label}</div>
                    <div style="flex:1"></div>

                    <label class="toggle">
                      <input
                        type="checkbox"
                        class="reminder-toggle"
                        name="billReminderOffsets"
                        value="${escapeHtml(reminder.days)}"
                        data-days="${escapeHtml(reminder.days)}"
                        ${
                          selectedReminders.includes(reminder.days)
                            ? "checked"
                            : ""
                        }
                      >

                      <div class="toggle-track">
                        <div class="toggle-thumb"></div>
                      </div>
                    </label>
                  </div>
                `
              ).join("")}
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
              >${bill ? escapeHtml(bill.notes || "") : ""}</textarea>
            </div>
          </div>

          ${
            bill
              ? `
                <button
                  class="btn-danger"
                  onclick="confirmDeleteBill('${escapeInlineString(bill.id)}', true)"
                >
                  ${svgIcon("trash", 16)}
                  Delete Bill
                </button>
              `
              : ""
          }
        </div>
      </div>
    </div>
  `;

  const sheetContainer = document.createElement("div");

  sheetContainer.id = "sheetContainer";
  sheetContainer.innerHTML = sheetHtml;

  document.body.appendChild(sheetContainer);

  updateBillDueDateField();
  lockBackgroundScroll();

  requestAnimationFrame(() => {
    document.getElementById("sheetOverlay")?.classList.add("show");
    document.getElementById("billSheet")?.classList.add("show");
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
          onclick="savePaymentLinkPopup('${escapeInlineString(bill.id)}')"
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
  const name = document.getElementById("billName")?.value.trim();
  const amount = parseFloat(
    document.getElementById("billAmount")?.value || 0
  );
  const category =
    document.getElementById("billCategory")?.value || "other";
  const dueDateInput =
    document.getElementById("billDueDate")?.value;
  const recurrence =
    document.getElementById("billRecurrence")?.value || "None";
  const dueDayValue =
    document.getElementById("billDueDay")?.value;
  const payCycle =
  Store.getBill(editingBillId)?.payCycle ||
  (new Date(`${dueDateInput}T12:00:00`).getDate() <= 15
    ? "first"
    : "second");
  const paycheckAssignment =
    document.getElementById("billPaycheckAssignment")?.value || "auto";
  const paymentMethod =
    document.getElementById("billPaymentMethod")?.value || "";
  const paymentUrl =
    document.getElementById("billPaymentUrl")?.value.trim() || "";
  const autopay = Boolean(
    document.getElementById("billAutopay")?.checked
  );
  const notes =
    document.getElementById("billNotes")?.value.trim() || "";

  const reminderOffsets = Array.from(
    document.querySelectorAll(
      'input[name="billReminderOffsets"]:checked'
    )
  )
    .map((input) => Number(input.value))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b);

  if (!name) {
    alert("Please enter a bill name.");
    return;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    alert("Please enter a valid amount.");
    return;
  }

  if (!dueDateInput) {
    alert("Please choose a due date.");
    return;
  }

  const dueDate = dateFromInput(dueDateInput);

  if (!dueDate) {
    alert("Please choose a valid due date.");
    return;
  }

  const dueDay =
    recurrence === "Monthly"
      ? Math.max(
          1,
          Math.min(
            31,
            Number(dueDayValue || new Date(dueDate).getDate())
          )
        )
      : null;

  const validAssignments = [
    "auto",
    "first",
    "second",
    "previous",
  ];

  const safePaycheckAssignment = validAssignments.includes(
    paycheckAssignment
  )
    ? paycheckAssignment
    : "auto";

  const now = new Date().toISOString();

  const data = {
    name,
    amount,
    category,
    dueDate,
    dueDay,
    recurrence,
    payCycle,
    paycheckAssignment: safePaycheckAssignment,
    paymentMethod,
    paymentUrl,
    autopay,
    notes,
    reminderOffsets,
  };

  const buildBillSnapshot = (bill) => ({
    id: bill.id,
    name: bill.name,
    amount: Number(bill.amount || 0),
    category: bill.category || "other",
    dueDate: bill.dueDate || null,
    dueDay: bill.dueDay ?? null,
    recurrence: bill.recurrence || "None",
    payCycle: bill.payCycle || null,
    paycheckAssignment: bill.paycheckAssignment || "auto",
    paymentMethod: bill.paymentMethod || "",
    paymentUrl: bill.paymentUrl || "",
    autopay: Boolean(bill.autopay),
    notes: bill.notes || "",
    reminderOffsets: Array.isArray(bill.reminderOffsets)
      ? [...bill.reminderOffsets]
      : [],
  });

  const getOrdinalSuffix = (day) => {
    const value = Number(day);

    if (value >= 11 && value <= 13) {
      return "th";
    }

    switch (value % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const formatSchedule = (bill) => {
    if (bill.recurrence === "Monthly") {
      const day = Number(
        bill.dueDay || new Date(bill.dueDate).getDate()
      );

      return `due on the ${day}${getOrdinalSuffix(day)} of each month`;
    }

    return bill.dueDate
      ? `due ${formatDate(bill.dueDate, "short")}`
      : "no due date";
  };

  const paycheckAssignmentLabel = (assignment) => {
    switch (assignment) {
      case "first":
        return "First paycheck";
      case "second":
        return "Second paycheck";
      case "previous":
        return "Previous paycheck";
      case "auto":
      default:
        return "Automatic by due date";
    }
  };

  const getChangedFields = (before, after) => {
    const changes = [];

    if (before.name !== after.name) {
      changes.push("name");
    }

    if (Number(before.amount) !== Number(after.amount)) {
      changes.push("amount");
    }

    if (before.category !== after.category) {
      changes.push("category");
    }

    if (
      before.dueDate !== after.dueDate ||
      Number(before.dueDay || 0) !== Number(after.dueDay || 0)
    ) {
      changes.push("due date");
    }

    if (before.recurrence !== after.recurrence) {
      changes.push("schedule");
    }

    if (before.paycheckAssignment !== after.paycheckAssignment) {
      changes.push("paycheck assignment");
    }

    if (before.paymentMethod !== after.paymentMethod) {
      changes.push("payment method");
    }

    if (before.paymentUrl !== after.paymentUrl) {
      changes.push("payment link");
    }

    if (Boolean(before.autopay) !== Boolean(after.autopay)) {
      changes.push("Autopay");
    }

    if (before.notes !== after.notes) {
      changes.push("notes");
    }

    if (
      JSON.stringify(before.reminderOffsets || []) !==
      JSON.stringify(after.reminderOffsets || [])
    ) {
      changes.push("reminders");
    }

    return changes;
  };

  const getSingleChangeActivity = (before, after, changedField) => {
    const billName = after.name || before.name;

    switch (changedField) {
      case "amount":
        return {
          action: "bill_amount_changed",
          title: `${billName} amount changed`,
          detail: `${formatCurrency(before.amount)} → ${formatCurrency(
            after.amount
          )}`,
        };

      case "due date":
      case "schedule":
        return {
          action: "bill_schedule_changed",
          title: `${billName} schedule changed`,
          detail: `${formatSchedule(before)} → ${formatSchedule(after)}`,
        };

      case "paycheck assignment":
        return {
          action: "bill_updated",
          title: `${billName} paycheck plan changed`,
          detail: `${paycheckAssignmentLabel(
            before.paycheckAssignment
          )} → ${paycheckAssignmentLabel(after.paycheckAssignment)}`,
        };

      case "Autopay":
        return {
          action: "bill_autopay_changed",
          title: `${billName} Autopay ${
            after.autopay ? "turned on" : "turned off"
          }`,
          detail: after.autopay
            ? "This bill is marked as paid automatically."
            : "This bill is no longer marked as paid automatically.",
        };

      case "reminders":
        return {
          action: "bill_reminders_changed",
          title: `${billName} reminders changed`,
          detail:
            after.reminderOffsets.length > 0
              ? after.reminderOffsets
                  .map((offset) =>
                    offset === 0
                      ? "on due date"
                      : `${offset} day${
                          offset === 1 ? "" : "s"
                        } before`
                  )
                  .join(", ")
              : "No reminders",
        };

      case "name":
      case "category":
      case "payment method":
      case "payment link":
      case "notes":
      default:
        return {
          action: "bill_updated",
          title: `${billName} details updated`,
          detail: `Updated ${changedField}.`,
        };
    }
  };

  if (!editingBillId) {
    const newBill = {
      id: uid(),
      ...data,
      createdAt: now,
      updatedAt: now,
      postponementHistory: [],
      occurrenceOverrides: [],
    };

    Store.addBill(newBill);

    recordActivity({
      action: "bill_created",
      entityType: "bill",
      entityId: newBill.id,
      title: `${newBill.name} added`,
      detail: `${formatCurrency(newBill.amount)} · ${formatSchedule(
        newBill
      )}`,
      before: null,
      after: buildBillSnapshot(newBill),
    });

    closeBillForm();
    render();
    return;
  }

  const existingBill = Store.getBill(editingBillId);

  if (!existingBill) {
    alert("Bill not found. Please refresh and try again.");
    return;
  }

  const before = buildBillSnapshot(existingBill);

  const updatedBill = {
    ...existingBill,
    ...data,
    updatedAt: now,
  };

  const after = buildBillSnapshot(updatedBill);
  const changedFields = getChangedFields(before, after);

  Store.updateBill(editingBillId, {
    ...data,
    updatedAt: now,
  });

  if (changedFields.length === 1) {
    const activity = getSingleChangeActivity(
      before,
      after,
      changedFields[0]
    );

    recordActivity({
      ...activity,
      entityType: "bill",
      entityId: editingBillId,
      before,
      after,
    });
  }

  if (changedFields.length > 1) {
    const billName = after.name || before.name;

    recordActivity({
      action: "bill_updated",
      entityType: "bill",
      entityId: editingBillId,
      title: `${billName} updated`,
      detail: `Changed ${changedFields.join(", ")}.`,
      before,
      after,
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
    ? `Show Less ${svgIcon('chevronRight', 18)}`
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
function openBankingComingSoon() {
  alert("Banking & Transactions is coming soon.");
}

function openCreditCardsComingSoon() {
  alert("Credit Cards is coming soon.");
}

function openBillPaymentLink(billId) {
  const url = safePaymentUrl(Store.getBill(billId)?.paymentUrl);
  if (!url) { alert("Please add a valid HTTPS payment website link."); return; }
  window.open(url, "_blank", "noopener,noreferrer");
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
  const bill = Store.getBill(billId);

  if (!bill) {
    alert("Bill not found.");
    return;
  }

  const shouldArchive = confirm(
  `Delete ${bill.name}? It will be removed from the app, but its payment history will be kept.`
);

  if (!shouldArchive) {
    return;
  }

  archiveBill(billId);

  if (fromForm) {
    closeBillForm();
  }

  navigate("bills");
}

function clearAllAppData() {
  if (!confirm("Clear Bill Beacon app data?\n\nThis removes local bills, payments, income, archives, activity, saved local transactions, and settings. Empty lists may sync to your household if sync is active. This does not delete your account, disconnect the server-side bank connection, or revoke push subscriptions. Create a backup first.")) return;
  const entries = new Map([["bills", []], ["payments", []], ["incomeSources", []], ["archivedBills", []], ["activityLog", []], ["bankTransactions", []], ["settings", {}]]);
  const previous = new Map([...entries.keys()].map(key => [key, localStorage.getItem(key)]));
  try { for (const [key, value] of entries) localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) {
    let rollbackFailed = false;
    for (const [key, value] of previous) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { rollbackFailed = true; } }
    alert(rollbackFailed ? "Clear failed and rollback was incomplete. Recover from your backup before editing." : "App data could not be cleared. Check device storage and keep your backup."); return;
  }
  for (const key of ["initialized", "billTrackerAdminToken", "billTrackerSubscriptionId"]) localStorage.removeItem(key);
  dismissPaymentUndoToast(); plaidSessionVersion += 1;
  plaidBankState = {connected: false, accounts: [], selectedAccountId: null, transactions: [], lastSyncedAt: null};
  window.dispatchEvent(new CustomEvent("billbeacon:data-changed")); initTheme(); navigate("today");
  alert("Local app lists were cleared. Account and server-side bank connection were not deleted.");
}

const BB_BILLS_CSV_HEADERS = [
  "Format", "Source Household", "ID", "Record Type", "Name", "Amount",
  "Due Date", "Category", "Recurrence", "Due Day", "Reminders",
  "Pay Cycle", "Paycheck Assignment", "Payment Method", "Payment Link",
  "Autopay", "Notes", "Plan ID", "Provider", "Merchant",
  "Installment Number", "Installment Total", "Frequency Days", "Original Plan Total",
  "Paid (Information Only)"
];
let bbBillsCsvBusy = false;

function bbBillsCsvCanonical(value) {
  if (Array.isArray(value)) return value.map(bbBillsCsvCanonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, bbBillsCsvCanonical(value[key])]));
  }
  return value;
}

function bbBillsCsvZone() {
  const zone = Store.getSettings().timeZone || "America/New_York";
  new Intl.DateTimeFormat("en", {timeZone: zone}).format(new Date());
  return zone;
}

function bbBillsCsvValidDate(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && y <= 9999 && date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function bbBillsCsvDateKey(value, zone = bbBillsCsvZone()) {
  const text = String(value || "").trim();
  if (bbBillsCsvValidDate(text)) return text;
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const key = `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
    if (bbBillsCsvValidDate(key)) return key;
    throw new Error("Invalid calendar date.");
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(text) || !bbBillsCsvValidDate(text.slice(0, 10))) {
    throw new Error("Use YYYY-MM-DD or MM/DD/YYYY for dates.");
  }
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date.");
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function bbBillsCsvDateISO(key, zone = bbBillsCsvZone()) {
  if (!bbBillsCsvValidDate(key)) throw new Error("Invalid due date.");
  const [y, m, d] = key.split("-").map(Number);
  const desired = Date.UTC(y, m - 1, d, 12);
  let time = desired;
  const formatter = new Intl.DateTimeFormat("en", {timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit",
    minute: "2-digit", second: "2-digit", hourCycle: "h23"});
  for (let n = 0; n < 3; n += 1) {
    const p = Object.fromEntries(formatter.formatToParts(new Date(time)).map(part => [part.type, part.value]));
    const represented = Date.UTC(Number(p.year), Number(p.month)-1, Number(p.day),
      Number(p.hour), Number(p.minute), Number(p.second));
    time += desired - represented;
  }
  const iso = new Date(time).toISOString();
  if (bbBillsCsvDateKey(iso, zone) !== key) throw new Error("Due date could not be represented safely.");
  return iso;
}

function bbBillsCsvCell(value) {
  let text = String(value ?? "");
  if (/^\s*[=+@-]/.test(text) || /^[\t\r\n']/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function bbBillsCsvParse(text) {
  text = String(text).replace(/^\uFEFF/, "");
  const rows = []; let row = [], cell = "", quoted = false, closed = false;
  const finishCell = () => {row.push(cell); cell = ""; closed = false;};
  const finishRow = () => {finishCell(); if (row.some(value => value !== "")) rows.push(row); row = [];};
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {cell += '"'; i += 1;}
        else {quoted = false; closed = true;}
      } else cell += ch;
    } else if (ch === ',') finishCell();
    else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      finishRow();
    } else if (ch === '"') {
      if (cell || closed) throw new Error("Unexpected quote in CSV.");
      quoted = true;
    } else {
      if (closed) throw new Error("Unexpected characters after a quoted CSV value.");
      cell += ch;
    }
    if (cell.length > 100000 || rows.length > 50000) throw new Error("CSV is too large or complex.");
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted value.");
  if (cell || row.length || closed) finishRow();
  return rows;
}

async function bbBillsCsvHash(value) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function bbBillsCsvFingerprint(bill) {
  return JSON.stringify([String(bill.name).trim().toLowerCase(), Number(bill.amount).toFixed(2),
    bbBillsCsvDateKey(bill.dueDate), bill.category || "other", bill.recurrence || "None",
    bill.dueDay || null, bill.installmentProvider || "", bill.installmentStore || "",
    bill.installmentNumber || null, bill.installmentTotal || null]);
}

function bbBillsCsvBuild(bills, householdId, isPaid) {
  const rows = [BB_BILLS_CSV_HEADERS];
  for (const bill of bills) {
    if (bill.archived || bill.archivedAt || bill.cancelled || bill.cancelledAt || bill.paidInFullAt ||
        ["cancelled", "canceled", "paid-in-full", "paidInFull"].includes(bill.status)) continue;
    const paid = isPaid(bill);
    if (bill.installmentPlanId && paid) continue;
    rows.push(["Bill Beacon Bills CSV 1", householdId, bill.id,
      bill.installmentPlanId ? "Installment" : "Bill", bill.name, bill.amount,
      bbBillsCsvDateKey(bill.dueDate), bill.category || "other", bill.recurrence || "None",
      bill.dueDay ?? "", JSON.stringify(bill.reminderOffsets || []), bill.payCycle || "",
      bill.paycheckAssignment || "auto", bill.paymentMethod || "", bill.paymentUrl || "",
      bill.autopay ? "Yes" : "No", bill.notes || "", bill.installmentPlanId || "",
      bill.installmentProvider || "", bill.installmentStore || "",
      bill.installmentNumber ?? "", bill.installmentTotal ?? "",
      bill.installmentFrequencyDays ?? "", bill.installmentOriginalTotal ?? "", paid ? "Yes" : "No"]);
  }
  return {count: rows.length - 1, csv: "\uFEFF" + rows.map(row => row.map(bbBillsCsvCell).join(",")).join("\r\n") + "\r\n"};
}

async function exportCSV() {
  if (bbBillsCsvBusy) return;
  bbBillsCsvBusy = true;
  try {
    if (typeof window.billBeaconPrepareDataTransfer !== "function") {
      throw new Error("The sync-aware transfer helper is missing. Keep the earlier firebase-sync.js export helper.");
    }
    const prepared = await window.billBeaconPrepareDataTransfer();
    const result = bbBillsCsvBuild(prepared.snapshot.bills, prepared.householdId,
      bill => isOccurrencePaid(bill, new Date(bill.dueDate)));
    if (!result.count) throw new Error("No active bills or unpaid installments to export.");
    const url = URL.createObjectURL(new Blob([result.csv], {type: "text/csv;charset=utf-8"}));
    const link = document.createElement("a"); link.href = url;
    link.download = `bill-beacon-bills-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {alert(`Could not export bills: ${error.message}`);}
  finally {bbBillsCsvBusy = false;}
}

async function bbBillsCsvPreview(text, existing, archived, householdId) {
  const rows = bbBillsCsvParse(text);
  if (rows.length < 2) throw new Error("CSV needs a header and at least one record.");
  const normalize = header => String(header).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const headers = new Map();
  rows[0].forEach((header, i) => {
    const key = normalize(header);
    if (!key || headers.has(key)) throw new Error("CSV has blank or duplicate column names.");
    headers.set(key, i);
  });
  for (const key of ["name", "amount", "duedate"]) {
    if (!headers.has(key)) throw new Error(`Missing required column: ${key}`);
  }
  const known = new Map([...existing, ...archived].map(bill => [bill.id, bill]));
  const fingerprints = new Set();
  for (const bill of [...existing, ...archived]) {
    try {fingerprints.add(bbBillsCsvFingerprint(bill));} catch {}
  }
  const added = [], skipped = [], errors = [], seen = new Map(), planNumbers = new Map();
  const planDefinitions = new Map(); let paidLabels = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index], rowNumber = index + 1;
    try {
      if (row.length !== rows[0].length) throw new Error("Column count differs from the header.");
      const raw = (...names) => {
        const key = names.map(normalize).find(name => headers.has(name));
        return key ? String(row[headers.get(key)] ?? "") : "";
      };
      const format = raw("Format");
      const modern = format === "Bill Beacon Bills CSV 1";
      if (format && !modern) throw new Error("Unsupported CSV format.");
      const get = (...names) => {
        const value = raw(...names);
        return modern && value.startsWith("'") ? value.slice(1) : value;
      };
      const name = get("Name").trim();
      const amountText = get("Amount").trim().replace(/^\$/, "");
      if (!name || !/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(amountText)) {
        throw new Error("Name and a nonnegative amount with up to two decimal places are required.");
      }
      const amount = Number(amountText.replace(/,/g, ""));
      if (!Number.isFinite(amount) || !Number.isSafeInteger(Math.round(amount * 100))) throw new Error("Amount is too large.");
      const dateKey = bbBillsCsvDateKey(get("Due Date"));
      const recurrenceText = get("Recurrence").trim();
      const recurrence = recurrenceText ? RECURRENCE.find(value => value.toLowerCase() === recurrenceText.toLowerCase()) : "None";
      if (!recurrence) throw new Error("Unknown recurrence.");
      let reminders = [7, 1];
      if (headers.has("reminders")) {
        const value = get("Reminders").trim();
        reminders = value ? (value.startsWith("[") ? JSON.parse(value) : value.split(/[;|,]/).map(Number)) : [];
      }
      if (!Array.isArray(reminders) || reminders.some(value => !Number.isInteger(value) || value < 0 || value > 365)) {
        throw new Error("Reminders must be whole-number offsets from 0 to 365.");
      }
      reminders = [...new Set(reminders)].sort((a,b) => a-b);
      const bool = value => {
        const v = String(value).trim().toLowerCase();
        if (["", "no", "false", "0"].includes(v)) return false;
        if (["yes", "true", "1"].includes(v)) return true;
        throw new Error("Use Yes or No for Autopay/Paid.");
      };
      const integer = (label, required = false) => {
        const value = get(label).trim();
        if (!value && !required) return null;
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
          throw new Error(`${label} must be a positive whole number.`);
        }
        return Number(value);
      };
      const dueDay = recurrence === "Monthly" ? (integer("Due Day") || Number(dateKey.slice(-2))) : null;
      if (dueDay > 31) throw new Error("Due Day cannot exceed 31.");
      const methodText = get("Payment Method").trim();
      if (methodText.length > 200) throw new Error("Payment method is too long.");
      const method = methodText;
      const paymentUrl = get("Payment Link", "Website").trim();
      if (paymentUrl) {
        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(paymentUrl) ? paymentUrl : "https://" + paymentUrl;
        const url = new URL(candidate);
        if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
          throw new Error("Payment Link must be a web address without embedded credentials.");
        }
      }
      const assignment = get("Paycheck Assignment").trim() || "auto";
      if (!["auto", "first", "second", "previous"].includes(assignment)) throw new Error("Invalid paycheck assignment.");
      const cycle = get("Pay Cycle").trim() || (Number(dateKey.slice(-2)) <= 15 ? "first" : "second");
      if (!["first", "second"].includes(cycle)) throw new Error("Pay Cycle must be first or second.");
      const sourceHousehold = get("Source Household").trim();
      const sourceId = get("ID").trim();
      const sourcePlan = get("Plan ID").trim();
      if ([sourceHousehold,sourceId,sourcePlan].some(value => value.length > 512)) throw new Error("Record identifier is too long.");
      const type = get("Record Type").trim().toLowerCase() || (sourcePlan ? "installment" : "bill");
      if (!["bill","installment"].includes(type) || (type === "bill" && sourcePlan)) throw new Error("Record Type conflicts with Plan ID.");
      const bill = {name, amount, dueDate: bbBillsCsvDateISO(dateKey), category: categoryIdFromImport(get("Category")),
        recurrence, dueDay, reminderOffsets: reminders, payCycle: cycle, paycheckAssignment: assignment,
        paymentMethod: method, paymentUrl, autopay: bool(get("Autopay")), notes: get("Notes")};
      if (type === "installment") {
        if (!sourcePlan || !get("Provider").trim() || recurrence !== "None") throw new Error("Installments require Plan ID, Provider, and recurrence None.");
        const number = integer("Installment Number", true), total = integer("Installment Total", true);
        if (number > total || total > 1000) throw new Error("Invalid installment number or total.");
        const planId = sourceHousehold && sourceHousehold !== householdId
          ? "csv-plan-" + await bbBillsCsvHash(JSON.stringify([sourceHousehold, sourcePlan])) : sourcePlan;
        const frequency = integer("Frequency Days");
        const originalText = get("Original Plan Total").trim();
        if (originalText && !/^\d+(?:\.\d{1,2})?$/.test(originalText)) throw new Error("Invalid original plan total.");
        const original = originalText ? Number(originalText) : null;
        if (original !== null && (!Number.isFinite(original) || original < amount)) throw new Error("Original plan total is too small.");
        Object.assign(bill, {installmentPlanId: planId, isPaymentPlanInstallment: true,
          installmentProvider: get("Provider").trim(), installmentStore: get("Merchant").trim(),
          installmentNumber: number, installmentTotal: total});
        if (frequency !== null) bill.installmentFrequencyDays = frequency;
        if (original !== null) bill.installmentOriginalTotal = original;
        const samePlan = [...existing, ...archived].filter(record => record.installmentPlanId === planId);
        if (samePlan.some(record =>
          (record.installmentProvider && record.installmentProvider !== bill.installmentProvider) ||
          (record.installmentStore && record.installmentStore !== bill.installmentStore) ||
          (record.installmentTotal != null && Number(record.installmentTotal) !== total))) {
          throw new Error("Plan ID conflicts with an existing installment plan.");
        }
        const definition = JSON.stringify([bill.installmentProvider, bill.installmentStore, total, frequency, original]);
        if (planDefinitions.has(planId) && planDefinitions.get(planId) !== definition) throw new Error("Conflicting fields within the same installment plan.");
        planDefinitions.set(planId, definition);
        const planKey = `${planId}:${number}`;
        const slot = JSON.stringify(bbBillsCsvCanonical(bill));
        if (planNumbers.has(planKey) && planNumbers.get(planKey) !== slot) throw new Error("Conflicting rows for the same installment number.");
        planNumbers.set(planKey, slot);
      }
      const fingerprint = bbBillsCsvFingerprint(bill);
      const id = sourceId
        ? (sourceHousehold && sourceHousehold !== householdId
          ? "csv-bill-" + await bbBillsCsvHash(JSON.stringify([sourceHousehold, sourceId])) : sourceId)
        : "csv-bill-" + await bbBillsCsvHash(fingerprint);
      bill.id = id;
      const signature = JSON.stringify(bbBillsCsvCanonical(bill));
      if (seen.has(id)) {
        if (seen.get(id) !== signature) throw new Error("Conflicting duplicate ID in this file.");
        skipped.push(`Row ${rowNumber}: duplicate file ID`); continue;
      }
      seen.set(id, signature);
      if (bool(get("Paid (Information Only)", "Paid"))) paidLabels += 1;
      if (known.has(id)) {skipped.push(`Row ${rowNumber}: existing or archived ID (not updated)`); continue;}
      if (bill.installmentPlanId && [...existing,...archived].some(record =>
        record.installmentPlanId === bill.installmentPlanId && Number(record.installmentNumber) === bill.installmentNumber)) {
        skipped.push(`Row ${rowNumber}: installment number already exists`); continue;
      }
      if (fingerprints.has(fingerprint)) {skipped.push(`Row ${rowNumber}: possible duplicate definition`); continue;}
      fingerprints.add(fingerprint);
      const now = new Date().toISOString();
      bill.createdAt = now; bill.updatedAt = now; bill.occurrenceOverrides = []; bill.postponementHistory = [];
      added.push(bill);
    } catch (error) {errors.push(`Row ${rowNumber}: ${error.message}`);}
  }
  return {added, skipped, errors, paidLabels};
}

async function importBillsCSV(event) {
  const input = event.target, file = input.files?.[0];
  if (!file || bbBillsCsvBusy) {input.value = ""; return;}
  bbBillsCsvBusy = true; let applied = false;
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error("CSV exceeds the 10 MB limit.");
    if (typeof window.billBeaconPrepareDataTransfer !== "function") {
      throw new Error("The sync-aware transfer helper is missing. Keep the earlier firebase-sync.js export helper.");
    }
    const prepared = await window.billBeaconPrepareDataTransfer();
    const preview = await bbBillsCsvPreview(await file.text(), prepared.snapshot.bills,
      prepared.snapshot.archivedBills, prepared.householdId);
    if (preview.errors.length) throw new Error("Nothing imported. Correct these rows:\n" + preview.errors.slice(0,20).join("\n") +
      (preview.errors.length > 20 ? `\nPlus ${preview.errors.length-20} more errors.` : ""));
    if (!preview.added.length) {alert(`No new records to add. ${preview.skipped.length} existing/duplicate rows skipped.`); return;}
    const installments = preview.added.filter(bill => bill.installmentPlanId).length;
    const notice = [
      `Add ${preview.added.length-installments} bills and ${installments} installment records?`,
      `${preview.skipped.length} existing/duplicate rows will be skipped.`,
      preview.skipped.slice(0,8).join("\n"),
      "Existing bills, payments, bank links, and archived records will NOT be replaced.",
      "Imported records start unpaid. Paid labels are information only; payment history is not imported.",
      `${preview.paidLabels} CSV row(s) contain paid labels.`,
      "New records use today's creation timestamp. Past schedule versions and postponement history are not imported."
    ].filter(Boolean).join("\n\n");
    if (!confirm(notice)) return;
    const fresh = await window.billBeaconPrepareDataTransfer();
    if (fresh.householdId !== prepared.householdId ||
        JSON.stringify(bbBillsCsvCanonical(fresh.snapshot)) !== JSON.stringify(bbBillsCsvCanonical(prepared.snapshot))) {
      throw new Error("Household data changed after the preview. Select the file again.");
    }
    Store.saveBills([...fresh.snapshot.bills, ...preview.added]); applied = true;
    render();
    await window.billBeaconPrepareDataTransfer();
    alert(`${preview.added.length} new bill/installment records added and household save completed.`);
  } catch (error) {
    alert((applied ? "Records were added locally, but cloud confirmation did not finish. Do not clear local data. " : "") + error.message);
  } finally {input.value = ""; bbBillsCsvBusy = false;}
}



// ====================================
// MAIN RENDER
// ====================================
function closeNotificationCenter(keepReturn = false) {
  const container = document.getElementById(
    "notificationCenterContainer"
  );

  if (keepReturn !== true) {
    notificationPopupReturn = null;
  }

  if (!container) return;

  container.remove();
  unlockBackgroundScroll();
}
window.closeNotificationCenter = closeNotificationCenter;
let billBeaconPlaidScriptPromise = null;

function loadBillBeaconPlaidLink() {
  if (window.Plaid) {
    return Promise.resolve();
  }

  if (billBeaconPlaidScriptPromise) {
    return billBeaconPlaidScriptPromise;
  }

  billBeaconPlaidScriptPromise = new Promise(
    (resolve, reject) => {
      const script = document.createElement("script");

      script.src =
        "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

      script.onload = () => {
        if (window.Plaid) {
          resolve();
        } else {
          script.remove();
          billBeaconPlaidScriptPromise = null;
          reject(new Error("Plaid Link did not initialize."));
        }
      };

      script.onerror = () => {
        script.remove();
        billBeaconPlaidScriptPromise = null;
        reject(new Error("Could not load Plaid Link."));
      };

      document.head.appendChild(script);
    }
  );

  return billBeaconPlaidScriptPromise;
}

let plaidBankState = {
  connected: false,
  accounts: [],
  selectedAccountId: null,
  transactions: [],
  lastSyncedAt: null
};

function setPlaidBankMessage(message) {
  const element = document.getElementById(
    "plaidConnectionStatus"
  );

  if (element) {
    element.textContent = message;
  }
}

async function callPlaidWorker(path, body) {
  const basePath = String(path).split("?")[0];

  const allowedPaths = [
    "/plaid/status",
    "/plaid/sync",
    "/plaid/account",
    "/plaid/link-token",
    "/plaid/exchange-token"
  ];

  if (!allowedPaths.includes(basePath)) {
    throw new Error(
      "Unsupported banking request."
    );
  }

  const firebaseToken =
    await window.getBillBeaconFirebaseToken?.();

  if (!firebaseToken) {
    throw new Error(
      "Please sign in to Bill Beacon first."
    );
  }

  const response = await fetch(
    "https://bill-beacon-notifications.rodz-m-1990.workers.dev" +
    path,
    {
      method:
        body === undefined ? "GET" : "POST",

      headers: {
        authorization: `Bearer ${firebaseToken}`,
        "content-type": "application/json"
      },

      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body) })
    }
  );

  const result = await response.json().catch(
    () => null
  );

  if (
    !response.ok ||
    !result ||
    result.ok !== true
  ) {
    const error = new Error(
      result?.error || "Banking request failed."
    );

    error.code = result?.code || null;
    throw error;
  }

  return result;
}
function applyPlaidBankState(result) {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result) ||
    result.environment !== "production"
  ) {
    throw new Error(
      "A valid Production bank response is required."
    );
  }

  const accounts = Array.isArray(result.accounts)
    ? result.accounts
    : [];

  const transactions = Array.isArray(result.transactions)
    ? result.transactions
    : [];

  const safeAccounts = accounts.filter(account =>
    account &&
    typeof account.id === "string" &&
    typeof account.name === "string"
  );

  const selectedAccountId =
    typeof result.selectedAccountId === "string"
      ? result.selectedAccountId
      : null;

  if (
    selectedAccountId &&
    !safeAccounts.some(account =>
      account.id === selectedAccountId
    )
  ) {
    throw new Error(
      "The selected bank account is not in this connection."
    );
  }

  const safeTransactions = transactions.filter(
    transaction =>
      transaction &&
      typeof transaction.id === "string" &&
      typeof transaction.accountId === "string" &&
      transaction.accountId === selectedAccountId &&
      typeof transaction.date === "string" &&
      Number.isFinite(
        new Date(transaction.date).getTime()
      ) &&
      Number.isFinite(Number(transaction.amount))
  );

  plaidBankState = {
    environment: "production",
    connected: result.connected === true,

    canManageBankConnection:
      result.canManageBankConnection === true,

    sharedHouseholdConnection:
      result.sharedHouseholdConnection === true,

    accounts: safeAccounts,
    selectedAccountId,
    transactions: safeTransactions,

    lastSyncedAt:
      typeof result.lastSyncedAt === "string"
        ? result.lastSyncedAt
        : null
  };

  if (currentRoute === "transactions") {
    render();
  }
}
let plaidSandboxRefreshInFlight = null;

async function refreshPlaidSandboxAutomatically() {
  if (plaidSandboxRefreshInFlight) {
    return plaidSandboxRefreshInFlight;
  }

  const sessionVersion = plaidSessionVersion;

  const task = (async () => {
    try {
      // Load the Worker's saved data.
      // Do not request another bank synchronization here.
      const saved = await loadPlaidSandboxBank();

      if (
        sessionVersion !== plaidSessionVersion
      ) return;

      if (!saved) return;

      setPlaidBankMessage(
        saved.connected
          ? `${plaidBankState.transactions.length} ` +
            "saved bank transaction(s) loaded."
          : "No saved bank connection. Tap Connect Bank."
      );
    } catch (error) {
      setPlaidBankMessage(
        error.message ||
        "Could not load saved bank data."
      );
    }
  })();

  plaidSandboxRefreshInFlight = task;

  try {
    return await task;
  } finally {
    if (plaidSandboxRefreshInFlight === task) {
      plaidSandboxRefreshInFlight = null;
    }
  }
}
window.addEventListener("billbeacon-authenticated", () => {
  refreshPlaidSandboxAutomatically();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshPlaidSandboxAutomatically();
  }
});

window.addEventListener("billbeacon-signed-out", () => {
  plaidSessionVersion++;
});
async function loadPlaidSandboxBank() {
  const sessionVersion = plaidSessionVersion;

  try {
    setPlaidBankMessage(
      "Loading household bank transactions…"
    );

    const viewingAccountId =
      plaidBankState.canManageBankConnection === false
        ? plaidBankState.selectedAccountId
        : null;

    const path = viewingAccountId
      ? "/plaid/status?accountId=" +
        encodeURIComponent(viewingAccountId)
      : "/plaid/status";

    const result = await callPlaidWorker(path);

    if (
      sessionVersion !== plaidSessionVersion
    ) return;

    applyPlaidBankState(result);

    setPlaidBankMessage(
      result.connected
        ? "Household bank transactions loaded."
        : result.canManageBankConnection
          ? "No saved bank connection. Tap Connect Bank."
          : "The household owner has not saved " +
            "a bank connection for this household."
    );

    return result;
  } catch (error) {
    setPlaidBankMessage(error.message);
    return null;
  }
}
const BANK_MATCH_OPT_IN = "[bank-match]";

function bankMatchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function bankMatchCents(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : NaN;
}

function bankMatchDay(value) {
  const text = String(value || "");
  const key = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? text
    : getLocalDateKey(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return NaN;

  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}

function bankMatchEnabled(bill) {
  return String(bill.notes || "")
    .toLowerCase()
    .includes(BANK_MATCH_OPT_IN);
}

function bankMatchIsInstallment(bill) {
  return Boolean(bill.installmentPlanId);
}

function bankMatchProvider(value) {
  const name = bankMatchText(value);

  const aliases = {
    "zip pay in 4": "zip",
    "zip pay": "zip",
    "zip co": "zip",
    "paypal pay later": "paypal",
    "paypal pay in 4": "paypal"
  };

  return aliases[name] || name;
}

function bankMatchMerchantMatches(description, merchant) {
  const text = ` ${bankMatchText(description)} `;
  const name = bankMatchText(merchant);
  return Boolean(name && text.includes(` ${name} `));
}

function bankMatchOccurrenceKey(bill) {
  return `${getBillPaymentId(bill)}:${getLocalDateKey(bill.dueDate)}`;
}

function bankMatchPaymentForOccurrence(payment, bill) {
  if (payment.billId !== getBillPaymentId(bill)) return false;
  const key = getPaymentOccurrenceDateKey(payment);
  return Boolean(key && key === financialDateKey(bill.dueDate));
}

function bankMatchTransactionKey(transaction) {
  const accountId =
    transaction.accountId ||
    transaction.account_id ||
    plaidBankState.selectedAccountId;

  if (!accountId || !transaction.id) return null;
  return `plaid-sandbox:${accountId}:${transaction.id}`;
}
function enableBankAutoMatchingFrom(startDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startDate))) {
    throw new Error("Use a start date in YYYY-MM-DD format.");
  }

  const parsed = new Date(`${startDate}T12:00:00Z`);

  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== startDate
  ) {
    throw new Error("Invalid matching start date.");
  }

  const settings = Store.getSettings();

  Store.saveSettings({
    ...settings,
    bankAutoMatchStartDate: startDate
  });

  return startDate;
}

function runPlaidSandboxAutoMatch() {
  const summary = { matched: 0, review: 0 };

  const settings = Store.getSettings();
  const selectedAccountId = plaidBankState.selectedAccountId;

  // Explicit activation date prevents old bank history from being
  // assigned to today's unpaid installments.
  const startDate = settings.bankAutoMatchStartDate;
  const startDay = bankMatchDay(startDate);

  if (!selectedAccountId || !Number.isFinite(startDay)) {
    return summary;
  }

  const payments = Store.getPayments();
  const bills = Store.getBills();

  const proposals = [];
  const seenTransactionIds = new Set();

  function accountIdFor(transaction) {
    return transaction.accountId || transaction.account_id || null;
  }

  function transactionAlreadyUsed(transaction) {
    return payments.some(payment => {
      if (payment.bankMatchKey === bankMatchTransactionKey(transaction)) {
        return true;
      }

      if (payment.bankTransactionId !== transaction.id) {
        return false;
      }

      // A legacy record without an account ID also blocks reuse.
      return (
        !payment.bankAccountId ||
        payment.bankAccountId === accountIdFor(transaction)
      );
    });
  }

  function occurrencePayments(bill) {
    return payments.filter(payment =>
      bankMatchPaymentForOccurrence(payment, bill)
    );
  }

  function activeOccurrencePayments(bill) {
    return occurrencePayments(bill).filter(payment =>
      String(payment.status || "active").toLowerCase() !== "voided"
    );
  }

  function occurrenceHasReversal(bill) {
    return occurrencePayments(bill).some(payment =>
      String(payment.status || "active").toLowerCase() === "voided"
    );
  }

  function validAmount(bill) {
    const amount = bankMatchCents(bill.amount);
    return Number.isSafeInteger(amount) && amount > 0;
  }

  const transactions = plaidBankState.transactions
    .filter(transaction => {
      const day = bankMatchDay(transaction.date);
      const amount = bankMatchCents(transaction.amount);

      return (
        transaction.pending === false &&
        transaction.type === "debit" &&
        accountIdFor(transaction) === selectedAccountId &&
        Number.isFinite(day) &&
        day >= startDay &&
        Number.isSafeInteger(amount) &&
        amount > 0
      );
    })
    .sort((a, b) =>
      bankMatchDay(a.date) - bankMatchDay(b.date) ||
      String(a.id).localeCompare(String(b.id))
    );

  for (const transaction of transactions) {
    if (!transaction.id) continue;

    const transactionIdentity =
      `${accountIdFor(transaction)}:${transaction.id}`;

    if (seenTransactionIds.has(transactionIdentity)) continue;
    seenTransactionIds.add(transactionIdentity);

    if (transactionAlreadyUsed(transaction)) continue;

    const key = bankMatchTransactionKey(transaction);
    const transactionDay = bankMatchDay(transaction.date);
    const transactionAmount = bankMatchCents(transaction.amount);
    const description = transaction.merchantName || "";

    if (!key) continue;

    const candidates = [];
    let unsafeCandidate = false;

    // Ordinary bills: exact amount, merchant match, narrow date window.
    const transactionDate = new Date(transactionDay * 86400000);

    const occurrences = [-1, 0, 1].flatMap(offset =>
      getCalendarBillsForMonth(
        new Date(
          transactionDate.getUTCFullYear(),
          transactionDate.getUTCMonth() + offset,
          1,
          12
        )
      )
    );

    const seenOccurrences = new Set();

    for (const bill of occurrences) {
      if (bankMatchIsInstallment(bill)) continue;
      if (!bankMatchIsEligibleBill(bill)) continue;
      if (!bankMatchMerchantMatches(description, bill.name)) continue;

      const occurrenceKey = bankMatchOccurrenceKey(bill);

      if (seenOccurrences.has(occurrenceKey)) continue;
      seenOccurrences.add(occurrenceKey);

      const dueDay = bankMatchDay(bill.dueDate);

      if (!Number.isFinite(dueDay)) continue;
      if (Math.abs(dueDay - transactionDay) > 2) continue;
      if (!validAmount(bill)) continue;
      if (bankMatchCents(bill.amount) !== transactionAmount) continue;

      if (occurrenceHasReversal(bill)) {
        unsafeCandidate = true;
        continue;
      }

      const existing = activeOccurrencePayments(bill);

      // Do not reuse the debit on another bill if it could describe
      // a payment already recorded manually.
      if (existing.length) {
        unsafeCandidate = true;
        continue;
      }

      candidates.push([{ bill, amount: transactionAmount }]);
    }

    // Payment plans: identify the provider, then inspect the entire
    // unpaid queue. Never filter out a blocking unpaid installment.
    const installmentBills = bills.filter(bill =>
      bankMatchIsInstallment(bill) &&
      bankMatchIsEligibleBill(bill)
    );

    const providers = [...new Set(
      installmentBills
        .map(bill => bankMatchProvider(bill.installmentProvider))
        .filter(Boolean)
    )];

    for (const provider of providers) {
      if (!bankMatchMerchantMatches(description, provider)) continue;

      const providerBills = installmentBills.filter(bill =>
        bankMatchProvider(bill.installmentProvider) === provider
      );

      // A recent manual payment might already represent this debit.
      // Without an explicit transaction link, do not guess.
      const possibleManualPayment = providerBills.some(bill =>
        activeOccurrencePayments(bill).some(payment => {
          if (payment.bankTransactionId || payment.bankMatchKey) {
            return false;
          }

          const paidDay = bankMatchDay(payment.paidDate);

          return (
            Number.isFinite(paidDay) &&
            Math.abs(paidDay - transactionDay) <= 2
          );
        })
      );

      if (possibleManualPayment) {
        unsafeCandidate = true;
        continue;
      }

      const unpaid = providerBills.filter(bill =>
        activeOccurrencePayments(bill).length === 0
      );

      if (!unpaid.length) continue;

      // Provider-only statements cannot identify a purchase when
      // multiple plans still have unpaid installments.
      const planIds = new Set(
        unpaid.map(bill => String(bill.installmentPlanId))
      );

      if (planIds.size !== 1) {
        unsafeCandidate = true;
        continue;
      }

      const queue = unpaid.slice().sort((a, b) => {
        const aDay = bankMatchDay(a.dueDate);
        const bDay = bankMatchDay(b.dueDate);

        return (
          aDay - bDay ||
          Number(a.installmentNumber || 0) -
            Number(b.installmentNumber || 0) ||
          String(a.id).localeCompare(String(b.id))
        );
      });

      if (queue.some(bill =>
        !Number.isFinite(bankMatchDay(bill.dueDate)) ||
        !validAmount(bill)
      )) {
        unsafeCandidate = true;
        continue;
      }

      const allocation = [];
      let total = 0;
      let foundExactTotal = false;

      for (let index = 0; index < queue.length; index++) {
        const bill = queue[index];

        if (occurrenceHasReversal(bill)) {
          unsafeCandidate = true;
          break;
        }

        const amount = bankMatchCents(bill.amount);

        total += amount;
        allocation.push({ bill, amount });

        if (!Number.isSafeInteger(total)) {
          unsafeCandidate = true;
          break;
        }

        if (total > transactionAmount) {
          break;
        }

        if (total === transactionAmount) {
          const next = queue[index + 1];

          // Do not select arbitrarily from a same-date boundary.
          if (
            next &&
            bankMatchDay(next.dueDate) === bankMatchDay(bill.dueDate)
          ) {
            unsafeCandidate = true;
          } else {
            foundExactTotal = true;
          }

          break;
        }
      }

      if (foundExactTotal) {
        candidates.push(allocation);
      } else {
        unsafeCandidate = true;
      }
    }

    if (unsafeCandidate || candidates.length > 1) {
      summary.review++;
      continue;
    }

    if (candidates.length === 1) {
      proposals.push({
        transaction,
        key,
        allocation: candidates[0]
      });
    }
  }

  // Evaluate competing claims before changing any payment records.
  const claims = new Map();

  for (const proposal of proposals) {
    for (const item of proposal.allocation) {
      const occurrenceKey = bankMatchOccurrenceKey(item.bill);
      claims.set(
        occurrenceKey,
        (claims.get(occurrenceKey) || 0) + 1
      );
    }
  }

  const nextPayments = payments.map(payment => ({ ...payment }));
  const accepted = [];

  for (const proposal of proposals) {
    const conflict = proposal.allocation.some(item =>
      claims.get(bankMatchOccurrenceKey(item.bill)) !== 1
    );

    if (conflict) {
      summary.review++;
      continue;
    }

    const paidDate = dateFromInput(
      String(proposal.transaction.date).slice(0, 10)
    );

    if (!paidDate) {
      summary.review++;
      continue;
    }

    const records = proposal.allocation.map(item => {
      const payment = {
        id: uid(),
        billId: getBillPaymentId(item.bill),
        amount: item.amount / 100,
        paidDate,
        paidForDueDate: item.bill.dueDate,
        originalDueDate:
          item.bill.originalDueDate || item.bill.dueDate,
        status: "active",
        voidedAt: null,
        source: "plaid-auto",
        bankMatchSource: "plaid-auto",
        bankMatchKey: proposal.key,
        bankTransactionId: proposal.transaction.id,
        bankAccountId: accountIdFor(proposal.transaction),
        bankPostedDate: paidDate,
        bankMatchedAt: new Date().toISOString(),
        bankAllocatedAmount: item.amount / 100,
        bankTransactionAmount:
          bankMatchCents(proposal.transaction.amount) / 100,
        expectedAmountAtMatch: Number(item.bill.amount)
      };

      payment.billSnapshot = createPaymentBillSnapshot(
        payment,
        item.bill,
        false
      );

      return payment;
    });

    nextPayments.push(...records);
    accepted.push(proposal);
    summary.matched++;
  }

  if (!accepted.length) return summary;

  // One local payment-store write for the complete batch.
  Store.savePayments(nextPayments);

  for (const proposal of accepted) {
    recordActivity({
      action: "bankpaymentmatched",
      entityType: "bill",
      entityId: getBillPaymentId(proposal.allocation[0].bill),
      title: "Bank payment matched",
      detail:
        `${proposal.transaction.merchantName} · ` +
        `${formatCurrency(proposal.transaction.amount)} · ` +
        `${proposal.allocation.length} installment/bill allocation(s)`,
      after: {
        bankMatchKey: proposal.key,
        bankTransactionId: proposal.transaction.id,
        allocations: proposal.allocation.map(item => ({
          billId: getBillPaymentId(item.bill),
          dueDate: item.bill.dueDate,
          amount: item.amount / 100
        }))
      }
    });
  }

  return summary;
}
let plaidSyncInFlight = null;
let plaidSessionVersion = 0;

async function syncPlaidBank() {
  
  if (
  plaidBankState.canManageBankConnection === false
) {
  return loadPlaidSandboxBank();
}if (plaidSyncInFlight) {
    return plaidSyncInFlight;
  }

  const sessionVersion = plaidSessionVersion;

  const task = (async () => {
    try {
      setPlaidBankMessage("Loading bank transactions…");

      const result = await callPlaidWorker(
        "/plaid/sync",
        {}
      );

      // Ignore a response from a previous signed-in session.
      if (sessionVersion !== plaidSessionVersion) {
        return;
      }

      // Never treat a test-bank response as Production data.
      if (result.environment !== "production") {
        throw new Error(
          "Production bank configuration is required. " +
          "No bill payments were changed."
        );
      }

      applyPlaidBankState(result);
      await loadPlaidSandboxBank();

if (
  sessionVersion !== plaidSessionVersion
) return;
      // Payment allocation will run in the Worker.
      // Do not run the browser matcher here.
      render();

      setPlaidBankMessage(
        `${plaidBankState.transactions.length} ` +
        "bank transaction(s) loaded. " +
        "No payment records were changed by this browser."
      );

      return result;
    } catch (error) {
      console.error(
        "Bank transaction synchronization failed:",
        error
      );

      setPlaidBankMessage(
        error?.message ||
        "Could not load bank transactions."
      );

      return null;
    }
  })();

  plaidSyncInFlight = task;

  try {
    return await task;
  } finally {
    if (plaidSyncInFlight === task) {
      plaidSyncInFlight = null;
    }
  }
}
async function choosePlaidSandboxAccount(accountId) {
  const sessionVersion = plaidSessionVersion;

  try {
    setPlaidBankMessage(
      "Loading selected account…"
    );

    const result =
      plaidBankState.canManageBankConnection === true
        ? await callPlaidWorker(
            "/plaid/account",
            { accountId }
          )
        : await callPlaidWorker(
            "/plaid/status?accountId=" +
            encodeURIComponent(accountId)
          );

    if (
      sessionVersion !== plaidSessionVersion
    ) return;

    applyPlaidBankState(result);

    if (result.canManageBankConnection === undefined) {
      await loadPlaidSandboxBank();
    } else {
      setPlaidBankMessage(
        "Selected account transactions loaded."
      );
    }
  } catch (error) {
    setPlaidBankMessage(error.message);
  }
}
let plaidConnectInFlight = false;

const PLAID_LINK_SESSION_KEY =
  "billBeaconPlaidProductionLinkSession";
async function showBankConnectionIdentity() {
  try {
    const token =
      await window.getBillBeaconFirebaseToken?.();

    if (!token) {
      alert("Please sign in to Bill Beacon first.");
      return;
    }

    const encoded = token.split(".")[1];
    const base64 = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const claims = JSON.parse(
      atob(
        base64 +
        "=".repeat((4 - base64.length % 4) % 4)
      )
    );

    const uid = claims.sub;

    if (!uid) {
      throw new Error("The sign-in token has no UID.");
    }

    const {
      getFirestore,
      doc,
      getDoc
    } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );

    const db = getFirestore();

    const profileSnapshot = await getDoc(
      doc(db, "users", uid)
    );

    const profile = profileSnapshot.exists()
      ? profileSnapshot.data()
      : null;

    const householdId =
      typeof profile?.householdId === "string"
        ? profile.householdId.trim()
        : "";

    let member = null;

    if (householdId) {
      const memberSnapshot = await getDoc(
        doc(
          db,
          "households",
          householdId,
          "members",
          uid
        )
      );

      member = memberSnapshot.exists()
        ? memberSnapshot.data()
        : null;
    }

    const syncContext =
      window.getBillBeaconHouseholdContext?.();

    alert([
      "Bill Beacon identity check",
      "",
      "Email: " + (claims.email || "(not supplied)"),
      "Firebase UID: " + uid,
      "Profile exists: " + Boolean(profile),
      "Household ID: " + (householdId || "(missing)"),
      "Profile role: " + (profile?.role || "(missing)"),
      "Membership exists: " + Boolean(member),
      "Membership role: " + (member?.role || "(missing)"),
      "Membership UID matches: " +
        (
          member
            ? String(!member.uid || member.uid === uid)
            : "(no membership)"
        ),
      "App sync household: " +
        (syncContext?.householdId || "(not ready)")
    ].join("\n"));
  } catch (error) {
    alert(
      "Identity check failed: " +
      (error?.message || "Unknown error.")
    );
  }
}
async function connectBillBeaconBank() {
  if (plaidConnectInFlight) return;

  plaidConnectInFlight = true;

  const version = plaidSessionVersion;
  let handler;
  let opened = false;

  const finish = () => {
    plaidConnectInFlight = false;

    const button = document.getElementById(
      "connectPlaidBank"
    );

    if (button) button.disabled = false;

    window.setTimeout(
      () => handler?.destroy(),
      0
    );
  };

  const clearSession = () => {
    localStorage.removeItem(
      PLAID_LINK_SESSION_KEY
    );
  };

  const clearOAuthParameter = () => {
    const url = new URL(window.location.href);

    url.searchParams.delete("oauth_state_id");

    window.history.replaceState(
      null,
      document.title,
      url.pathname + url.search + url.hash
    );
  };

  try {
    const button = document.getElementById(
      "connectPlaidBank"
    );

    if (button) button.disabled = true;

    const firebaseToken =
      await window.getBillBeaconFirebaseToken?.();

    if (!firebaseToken) {
      throw new Error("Please sign in first.");
    }

    // This identifies the local Link session's user.
    // The Worker still verifies the Firebase token.
    const encoded = firebaseToken.split(".")[1];

    if (!encoded) {
      throw new Error("Please sign in again.");
    }

    const base64 = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const userId = JSON.parse(
      atob(
        base64 +
        "=".repeat((4 - base64.length % 4) % 4)
      )
    ).sub;

    if (!userId) {
      throw new Error("Please sign in again.");
    }

    if (version !== plaidSessionVersion) return;

    const returning = new URL(
      window.location.href
    ).searchParams.has("oauth_state_id");

    let linkToken;

    if (returning) {
      const saved = JSON.parse(
        localStorage.getItem(
          PLAID_LINK_SESSION_KEY
        ) || "null"
      );

      if (
        !saved ||
        saved.userId !== userId ||
        typeof saved.token !== "string" ||
        !Number.isFinite(saved.createdAt) ||
        Date.now() - saved.createdAt >
          60 * 60 * 1000 ||
        saved.createdAt > Date.now()
      ) {
        clearSession();
        clearOAuthParameter();

        throw new Error(
          "The bank connection session expired " +
          "or belongs to another user. " +
          "Tap Connect Bank again."
        );
      }

      linkToken = saved.token;
    } else {
      setPlaidBankMessage(
        "Checking the saved bank connection…"
      );

      const existing = await callPlaidWorker(
        "/plaid/status"
      );

      if (version !== plaidSessionVersion) return;

      applyPlaidBankState(existing);
      if (
  existing.canManageBankConnection === false
) {
  setPlaidBankMessage(
    existing.connected
      ? "Household transactions loaded. " +
        "Only the owner manages the bank connection."
      : "The household owner must connect the bank."
  );

  return;
}

      if (existing.connected) {
        clearSession();

        setPlaidBankMessage(
          "A bank is connected. " +
          "Use Sync Transactions."
        );

        return;
      }

      const result = await callPlaidWorker(
        "/plaid/link-token",
        {}
      );

      if (version !== plaidSessionVersion) return;

      if (
        result.environment !== "production" ||
        typeof result.link_token !== "string"
      ) {
        throw new Error(
          "A Production Link token is required."
        );
      }

      linkToken = result.link_token;

      localStorage.setItem(
        PLAID_LINK_SESSION_KEY,
        JSON.stringify({
          token: linkToken,
          userId,
          createdAt: Date.now()
        })
      );
    }

    await loadBillBeaconPlaidLink();

    if (version !== plaidSessionVersion) return;

    handler = window.Plaid.create({
      token: linkToken,

      ...(returning
        ? {
            receivedRedirectUri:
              window.location.href
          }
        : {}),

      onSuccess: async publicToken => {
        try {
          if (
            version !== plaidSessionVersion
          ) return;

          setPlaidBankMessage(
            "Saving the bank connection…"
          );

          const saved = await callPlaidWorker(
            "/plaid/exchange-token",
            {
              public_token: publicToken
            }
          );

          if (
            version !== plaidSessionVersion
          ) return;

          applyPlaidBankState(saved);

          clearSession();

          if (returning) {
            clearOAuthParameter();
          }

          await syncPlaidBank();
        } catch (error) {
          if (
            version === plaidSessionVersion
          ) {
            setPlaidBankMessage(
              error.message +
              " If the connection was saved, " +
              "use Load Saved Connection, " +
              "then Sync Transactions."
            );
          }
        } finally {
          finish();
        }
      },

      onExit: error => {
        if (
          version === plaidSessionVersion
        ) {
          clearSession();

          if (returning) {
            clearOAuthParameter();
          }

          setPlaidBankMessage(
            error?.display_message ||
            error?.error_message ||
            "Bank connection window closed."
          );
        }

        finish();
      }
    });

    setPlaidBankMessage(
      returning
        ? "Resuming bank connection…"
        : "Opening Plaid…"
    );

    handler.open();
    opened = true;
  } catch (error) {
    if (version === plaidSessionVersion) {
      setPlaidBankMessage(
        error.message ||
        "Could not connect the bank."
      );
    }
  } finally {
    if (!opened) {
      finish();
    }
  }
}

async function resumePlaidOAuthIfNeeded() {
  const returning = new URL(
    window.location.href
  ).searchParams.has("oauth_state_id");

  if (!returning) return;

  try {
    const token =
      await window.getBillBeaconFirebaseToken?.();

    if (!token) return;

    await connectBillBeaconBank();
  } catch (error) {
    setPlaidBankMessage(error.message);
  }
}

window.addEventListener(
  "billbeacon-authenticated",
  resumePlaidOAuthIfNeeded
);

window.addEventListener(
  "billbeacon-signed-out",
  () => {
    localStorage.removeItem(
      PLAID_LINK_SESSION_KEY
    );
  }
);

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    resumePlaidOAuthIfNeeded,
    { once: true }
  );
} else {
  window.setTimeout(
    resumePlaidOAuthIfNeeded,
    0
  );
}
window.connectBillBeaconBank = connectBillBeaconBank;
window.loadPlaidSandboxBank = loadPlaidSandboxBank;
window.syncPlaidBank = syncPlaidBank;
window.choosePlaidSandboxAccount = choosePlaidSandboxAccount;

window.addEventListener("billbeacon:signed-out", () => {
  plaidSessionVersion++;

  plaidBankState = {
    connected: false,
    accounts: [],
    selectedAccountId: null,
    transactions: [],
    lastSyncedAt: null
  };
});
function transactionMonthDisplayKey(monthKey) {
  return JSON.stringify([
    plaidBankState.selectedAccountId || "none",
    String(
      routeParams.transactionSearch || ""
    ).trim().toLowerCase(),
    monthKey
  ]);
}

function setTransactionMonthLimit(
  monthKey,
  collapse = false
) {
  if (
    currentRoute !== "transactions" ||
    !/^\d{4}-\d{2}$/.test(monthKey)
  ) return;

  const main = document.querySelector(
    ".main-content"
  );

  const top = main?.scrollTop || 0;
  const windowTop = window.scrollY;

  const limits = {
    ...(routeParams.transactionMonthLimits || {})
  };

  const key = transactionMonthDisplayKey(monthKey);
  const previous = Number(limits[key]);

  limits[key] = collapse
    ? 5
    : (
        Number.isSafeInteger(previous) &&
        previous >= 5
          ? previous
          : 5
      ) + 5;

  routeParams.transactionMonthLimits = limits;

  render();

  requestAnimationFrame(() => {
    const nextMain = document.querySelector(
      ".main-content"
    );

    if (nextMain) {
      nextMain.scrollTop = top;
    }

    window.scrollTo(0, windowTop);
  });
}
function renderTransactions() {
  const searchQuery = String(
    routeParams.transactionSearch || ""
  ).trim().toLowerCase();

  const transactions =
    (plaidBankState.transactions || [])
      .filter(transaction =>
        Number.isFinite(
          new Date(transaction.date).getTime()
        )
      )
      .slice()
      .sort((a, b) =>
        new Date(b.date) - new Date(a.date) ||
        String(a.id).localeCompare(String(b.id))
      );

  const filtered = transactions.filter(
    transaction =>
      !searchQuery ||
      [
        transaction.merchantName,
        transaction.category,
        transaction.matchStatus,
        transaction.matchedBillName,
        transaction.matchNote,
        transaction.amount
      ]
        .filter(value =>
          value !== null &&
          value !== undefined
        )
        .join(" ")
        .toLowerCase()
        .includes(searchQuery)
  );

  const groups = new Map();

  for (const transaction of filtered) {
    const date = new Date(transaction.date);

    const monthKey =
      `${date.getFullYear()}-` +
      String(date.getMonth() + 1).padStart(2, "0");

    if (!groups.has(monthKey)) {
      groups.set(monthKey, {
        monthKey,
        date: new Date(
          date.getFullYear(),
          date.getMonth(),
          1,
          12
        ),
        transactions: []
      });
    }

    groups.get(monthKey).transactions.push(
      transaction
    );
  }

  const monthGroups = [...groups.values()].sort(
    (a, b) =>
      b.monthKey.localeCompare(a.monthKey)
  );

  const debitTotal = items =>
    items
      .filter(transaction =>
        transaction.type === "debit"
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );

  const row = transaction => `
    <button
      type="button"
      data-bank-transaction-row
      onclick="openTransactionDetails('${escapeInlineString(transaction.id)}')"
      style="
        width:100%;
        display:flex;
        align-items:center;
        gap:12px;
        padding:14px 16px;
        border:0;
        border-bottom:1px solid var(--border);
        background:transparent;
        color:var(--text);
        text-align:left;
        cursor:pointer;
        font:inherit;
      "
    >
      <span
        style="
          width:40px;
          height:40px;
          min-width:40px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:12px;
          color:white;
          background:${safeTransactionColor(transaction.iconColor)};
          font-size:12px;
          font-weight:900;
        "
      >
        ${escapeHtml(
          transaction.merchantInitials || "?"
        )}
      </span>

      <span style="min-width:0;flex:1;">
        <span
          style="
            display:block;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            font-size:15px;
            font-weight:800;
          "
        >
          ${escapeHtml(
            transaction.merchantName || "Transaction"
          )}
        </span>

        <span
          style="
            display:block;
            margin-top:4px;
            color:var(--text-muted);
            font-size:12px;
          "
        >
          ${formatDate(transaction.date, "short")}
          ${transaction.pending ? " · Pending" : ""}
        </span>
      </span>

      <span
        style="
          white-space:nowrap;
          font-size:16px;
          font-weight:850;
          color:${
            transaction.type === "credit"
              ? "var(--paid)"
              : "var(--text)"
          };
        "
      >
        ${transaction.type === "credit" ? "+" : "−"}
        ${formatCurrency(transaction.amount)}
      </span>
    </button>
  `;

  const transactionContent = monthGroups.length
    ? monthGroups.map(group => {
        const savedLimit = Number(
          routeParams.transactionMonthLimits?.[
            transactionMonthDisplayKey(
              group.monthKey
            )
          ]
        );

        const limit =
          Number.isSafeInteger(savedLimit) &&
          savedLimit >= 5
            ? savedLimit
            : 5;

        const visible =
          group.transactions.slice(0, limit);

        const remaining =
          group.transactions.length -
          visible.length;

        return `
          <section
            data-bank-month="${group.monthKey}"
            style="margin-top:20px;"
          >
            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:12px;
                margin:0 3px 9px;
              "
            >
              <div>
                <h2
                  style="
                    margin:0;
                    font-size:18px;
                    font-weight:850;
                  "
                >
                  ${formatDate(
                    group.date.toISOString(),
                    "monthYear"
                  )}
                </h2>

                <div
                  style="
                    margin-top:4px;
                    font-size:12px;
                    color:var(--text-muted);
                  "
                >
                  ${visible.length} of
                  ${group.transactions.length}
                  transactions
                </div>
              </div>

              <div
                style="
                  text-align:right;
                  color:var(--text-muted);
                  font-size:12px;
                "
              >
                <div style="font-weight:800;">
                  ${formatCurrency(
                    debitTotal(group.transactions)
                  )}
                </div>

                <div style="margin-top:3px;">
                  Debit total
                </div>
              </div>
            </div>

            <div
              class="card"
              style="
                overflow:hidden;
                border:1px solid rgba(192,151,255,.18);
              "
            >
              ${visible.map(row).join("")}
            </div>

            <div
              style="
                display:flex;
                gap:8px;
                margin-top:9px;
              "
            >
              ${
                remaining > 0
                  ? `
                    <button
                      type="button"
                      class="bb-outline-pill"
                      onclick="setTransactionMonthLimit('${group.monthKey}')"
                      aria-label="Show five more transactions for ${escapeHtml(
                        formatDate(
                          group.date.toISOString(),
                          "monthYear"
                        )
                      )}"
                      style="
                        flex:1;
                        min-height:42px;
                        justify-content:center;
                      "
                    >
                      Show more
                      (${remaining} remaining)
                    </button>
                  `
                  : ""
              }

              ${
                visible.length > 5
                  ? `
                    <button
                      type="button"
                      class="bb-outline-pill"
                      onclick="setTransactionMonthLimit('${group.monthKey}', true)"
                      style="
                        flex:1;
                        min-height:42px;
                        justify-content:center;
                      "
                    >
                      Show less
                    </button>
                  `
                  : ""
              }
            </div>
          </section>
        `;
      }).join("")
    : `
      <div class="empty-state">
        <div class="empty-state-icon">
          ${svgIcon("internaldrive", 44)}
        </div>

        <div class="empty-state-title">
          ${
            searchQuery
              ? "No matching transactions"
              : "No transactions loaded"
          }
        </div>

        <div class="empty-state-text">
          ${
            searchQuery
              ? "Try another search. Your saved transactions have not been removed."
              : "Load your saved connection or connect a bank using the controls below."
          }
        </div>
      </div>
    `;

  const accounts = plaidBankState.accounts || [];

const accountSelector = accounts.length
  ? `
    <section
      style="
        margin-top:10px;
        padding:14px;
        border:1px solid rgba(192,151,255,.20);
        border-radius:16px;
        background:var(--surface);
      "
    >
     
      <select
        id="plaidSandboxAccount"
        class="form-input"
        onchange="choosePlaidSandboxAccount(this.value)"
        aria-label="Select bill-pay account"
        style="
          width:100%;
          min-height:46px;
          text-align:left;
          background:var(--surface);
          color:var(--text);
          font-size:16px;
          font-weight:750;
        "
      >
        ${
          accounts.map(account => `
            <option
              value="${escapeHtml(account.id)}"
              ${
                account.id ===
                plaidBankState.selectedAccountId
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(account.name)}
              ${
                account.mask
                  ? ` · •••• ${escapeHtml(account.mask)}`
                  : ""
              }
            </option>
          `).join("")
        }
      </select>
    </section>
  `
  : "";

  const bankControls = `
  <section
    style="
      margin-top:24px;
      padding-top:18px;
      border-top:1px solid var(--border);
    "
  >
    <div class="section-header">
      Bank connection
    </div>

    <div class="card card-pad">
      <div style="display:grid;gap:9px;">
        <button
  id="connectPlaidBank"
  type="button"
  class="btn-primary"
  onclick="connectBillBeaconBank()"
  ${
    plaidBankState.canManageBankConnection === false
      ? "disabled"
      : ""
  }
  style="width:100%;margin:0;"
>
  ${
    plaidBankState.canManageBankConnection === false
      ? "Owner Manages Bank Connection"
      : "Connect Bank"
  }
</button>

        <button
          type="button"
          class="bb-outline-pill"
          onclick="loadPlaidSandboxBank()"
          style="
            width:100%;
            min-height:44px;
            justify-content:center;
          "
        >
          Load Saved Connection
        </button>

        <button
          type="button"
          class="bb-outline-pill"
          onclick="syncPlaidBank()"
          style="
            width:100%;
            min-height:44px;
            justify-content:center;
          "
        >
          Sync Transactions
        </button>
      </div>

      <div
        id="plaidConnectionStatus"
        role="status"
        aria-live="polite"
        style="
          margin-top:12px;
          font-size:12px;
          color:var(--text-muted);
          line-height:1.5;
        "
      >
        ${
          plaidBankState.connected
            ? "Bank connected. Select the bill-pay account at the top."
            : "Load your saved connection or connect a bank."
        }
      </div>
    </div>
  </section>
`;

  return `
    <div class="nav-bar">
      <div
        class="nav-bar-content"
        style="
          display:grid;
          grid-template-columns:44px 1fr 44px;
          align-items:center;
        "
      >
        <button
          type="button"
          class="nav-button"
          onclick="navigate('more')"
          aria-label="Back to More"
          style="
            width:44px;
            height:44px;
            padding:0;
            color:var(--text);
          "
        >
          ${svgIcon("chevronLeft", 22)}
        </button>

        <div
          class="nav-title"
          style="text-align:center;"
        >
          Transactions
        </div>

        <div style="width:44px;"></div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div
        class="content-pad"
        style="
          padding-bottom:calc(
            36px + env(safe-area-inset-bottom)
          );
        "
      >
      ${accountSelector}
        <section
          style="
            display:flex;
            align-items:center;
            gap:10px;
            margin-top:10px;
            padding:0 14px;
            min-height:52px;
            border:1px solid rgba(192,151,255,.20);
            border-radius:16px;
            background:var(--surface);
          "
        >
          <span style="color:var(--text-muted);">
            ${svgIcon("search", 22)}
          </span>

          <input
            type="search"
            value="${escapeHtml(
              routeParams.transactionSearch || ""
            )}"
            placeholder="Search transactions"
            aria-label="Search transactions"
            oninput="searchTransactions(this.value)"
            style="
              min-width:0;
              flex:1;
              border:0;
              outline:0;
              background:transparent;
              color:var(--text);
              font:inherit;
              font-size:16px;
            "
          />
        </section>

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            margin-top:12px;
            color:var(--text-muted);
            font-size:12px;
          "
        >
                  </div>

        ${transactionContent}

        ${bankControls}
      </div>
    </div>
  `;
}
function render() {
  const app = document.getElementById("app"); if (!app) return;
  const views = {today: renderToday, recurring: renderRecurring, bills: renderBills, more: renderMore,
    calendar: renderCalendar, insights: renderInsights, activity: renderActivity, "payment-plans": renderPaymentPlans,
    settings: renderSettings, transactions: renderTransactions, detail: renderBillDetail, history: renderPaymentHistory};
  const view = Object.prototype.hasOwnProperty.call(views, currentRoute) ? views[currentRoute] : renderToday;
  let content = view();
  if (["today", "recurring", "bills", "more", "insights", "settings"].includes(currentRoute)) content += tabBar();
  app.innerHTML = content;
  if (currentRoute !== "history") { addNotificationSettings(); addBackupSettings(); attachSignOutButton(); }
}



window.render = render;
/* ============================================
   Bill Tracker Push Notifications
============================================ */

const NOTIFICATION_WORKER_URL =
  "https://bill-beacon-notifications.rodz-m-1990.workers.dev";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((character) => character.charCodeAt(0))
  );
}

async function getNotificationVapidPublicKey() {
  const response = await fetch(
    `${NOTIFICATION_WORKER_URL}/config`
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.vapidPublicKey) {
    throw new Error(
      data?.error || "Notification setup is unavailable right now."
    );
  }

  return data.vapidPublicKey;
}

async function activateBillNotifications() {
  try {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      throw new Error(
        "Push notifications are not supported in this browser."
      );
    }

    if (
      typeof window.getBillBeaconFirebaseToken !==
      "function"
    ) {
      throw new Error(
        "Please sign in again before enabling notifications."
      );
    }

    const firebaseToken =
      await window.getBillBeaconFirebaseToken();

    if (!firebaseToken) {
      throw new Error(
        "Please sign in before enabling notifications."
      );
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      throw new Error(
        "Notifications were not allowed. Enable them in your browser or device settings, then try again."
      );
    }

    const registration = await navigator.serviceWorker.ready;

    const vapidPublicKey =
      await getNotificationVapidPublicKey();

    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(vapidPublicKey)
        });
    }

    const response = await fetch(
      `${NOTIFICATION_WORKER_URL}/subscriptions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${firebaseToken}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      throw new Error(
        result?.error ||
          "The notification subscription could not be saved."
      );
    }

    await refreshNotificationSettingsCard();  } catch (error) {
    console.error("Notification setup failed:", error);

    alert(
      `Notification setup failed: ${
        error?.message || "Please try again."
      }`
    );
  }
}
async function getNotificationDeviceState() {
  const isSupported =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  if (!isSupported) {
    return {
      supported: false,
      permission: "unsupported",
      subscribed: false
    };
  }

  const permission = Notification.permission;

  if (permission !== "granted") {
    return {
      supported: true,
      permission,
      subscribed: false
    };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return {
      supported: true,
      permission,
      subscribed: Boolean(subscription)
    };
  } catch (error) {
    console.warn("Could not read notification subscription state.", error);

    return {
      supported: true,
      permission,
      subscribed: false
    };
  }
}
async function refreshNotificationSettingsCard() {
  const button = document.getElementById(
    "notificationPermissionButton"
  );

  const status = document.getElementById(
    "notificationPermissionStatus"
  );

  if (!button || !status) {
    return;
  }

  const state = await getNotificationDeviceState();

  if (!state.supported) {
    button.disabled = true;
    button.style.opacity = "0.55";
    button.style.cursor = "not-allowed";

    button.innerHTML = `
      ${svgIcon("bell", 20)}
      Notifications Unavailable
    `;

    status.textContent =
      "Notifications are not supported in this browser.";

    return;
  }

  if (state.permission === "denied") {
    button.disabled = true;
    button.style.opacity = "0.55";
    button.style.cursor = "not-allowed";

    button.innerHTML = `
      ${svgIcon("bell", 20)}
      Notifications Blocked
    `;

    status.textContent =
      "Notifications are blocked. Enable them in your iPhone or browser settings.";

    return;
  }

  if (state.subscribed) {
    button.disabled = true;
    button.style.opacity = "0.72";
    button.style.cursor = "default";

    button.innerHTML = `
      ${svgIcon("checkCircle", 20)}
      Notifications On
    `;

    status.textContent =
      "Bill reminders are enabled on this device.";

    return;
  }

  button.disabled = false;
  button.style.opacity = "1";
  button.style.cursor = "pointer";

  button.innerHTML = `
    ${svgIcon("bell", 20)}
    Turn On Notifications
  `;

  status.textContent =
    "Receive bill reminders on this iPhone.";
}
async function sendBillNotificationTest() {
  const status = document.getElementById(
    "notificationTestStatus"
  );

  try {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      throw new Error(
        "Push notifications are not supported in this browser."
      );
    }

    if (Notification.permission !== "granted") {
      throw new Error(
        "Notifications are not allowed yet. Tap Turn On Notifications first."
      );
    }

    if (
      typeof window.getBillBeaconFirebaseToken !==
      "function"
    ) {
      throw new Error(
        "Please sign in again before testing notifications."
      );
    }

    const firebaseToken =
      await window.getBillBeaconFirebaseToken();

    if (!firebaseToken) {
      throw new Error(
        "Please sign in before testing notifications."
      );
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      throw new Error(
        "This device is not subscribed yet. Tap Turn On Notifications first."
      );
    }

    if (status) {
      status.textContent = "Sending test notification…";
    }

    const response = await fetch(
      `${NOTIFICATION_WORKER_URL}/test`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${firebaseToken}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      throw new Error(
        result?.error ||
          "The test notification could not be sent."
      );
    }

    if (status) {
      status.textContent =
        "Test request sent. Lock your iPhone and check the Lock Screen or Notification Center.";
    }
  } catch (error) {
    console.error("Test notification failed:", error);

    const message =
      error?.message ||
      "Test notification failed. Check the Cloudflare Worker logs.";

    if (status) {
      status.textContent = message;
    } else {
      alert(message);
    }
  }
}
async function sendBillInboxTest() {
  const status = document.getElementById(
    "notificationTestStatus"
  );

  try {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      throw new Error(
        "Push notifications are not supported in this browser."
      );
    }

    if (Notification.permission !== "granted") {
      throw new Error(
        "Notifications are not allowed yet. Tap Turn On Notifications first."
      );
    }

    if (
      typeof window.getBillBeaconFirebaseToken !== "function"
    ) {
      throw new Error(
        "Please sign in again before testing notifications."
      );
    }

    const firebaseToken =
      await window.getBillBeaconFirebaseToken();

    if (!firebaseToken) {
      throw new Error(
        "Please sign in before testing notifications."
      );
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      throw new Error(
        "This device is not subscribed yet. Tap Turn On Notifications first."
      );
    }

    const activeBills = Store.getBills().filter(
      (bill) => !bill.archivedAt
    );

    const selectedBill = activeBills[0];

    if (!selectedBill) {
      throw new Error(
        "Add an active bill before sending an inbox test."
      );
    }

    const billForTest = {
      id: String(selectedBill?.id || ""),
      name: String(
        selectedBill?.name ||
          selectedBill?.title ||
          ""
      ),
      amount: Number(
        selectedBill?.amount ??
          selectedBill?.monthlyAmount ??
          selectedBill?.amountDue ??
          selectedBill?.paymentAmount ??
          0
      ),
      dueDate: String(
        selectedBill?.dueDate ??
          selectedBill?.nextDueDate ??
          selectedBill?.date ??
          ""
      ),
      installmentPlanId:
        selectedBill?.installmentPlanId || null,
    };

    if (
      !billForTest.id ||
      !billForTest.name ||
      !Number.isFinite(billForTest.amount) ||
      billForTest.amount <= 0 ||
      !billForTest.dueDate
    ) {
      console.log(
        "Bill Beacon inbox test bill:",
        selectedBill
      );

      console.log(
        "Bill Beacon normalized test bill:",
        billForTest
      );

      throw new Error(
        "The selected bill is missing a name, amount, or due date. Check the browser console for the bill fields."
      );
    }

    if (status) {
      status.textContent =
        "Sending inbox test notification…";
    }

    const response = await fetch(
      `${NOTIFICATION_WORKER_URL}/test-bill-reminder`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          bill: billForTest,
          message: `Test reminder for ${billForTest.name}.`,
        }),
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      throw new Error(
        result?.error ||
          "The inbox test notification could not be sent."
      );
    }

    if (status) {
      status.textContent =
        "Inbox test sent. Open the bell to confirm the test item appears.";
    }
  } catch (error) {
    console.error("Inbox test notification failed:", error);

    const message =
      error?.message ||
      "Inbox test failed. Check the Cloudflare Worker logs.";

    if (status) {
      status.textContent = message;
    } else {
      alert(message);
    }
  }
}
function addNotificationSettings() {
  if (
    currentRoute !== "settings" ||
    document.getElementById("notificationSettingsCard")
  ) {
    return;
  }

  const container = document.querySelector(
    ".main-content .content-pad"
  );

  if (!container) {
    return;
  }

  const section = document.createElement("div");

  section.id = "notificationSettingsCard";
  section.className = "settings-section";

  section.innerHTML = `
    <div class="section-header">Notifications</div>

    <div class="card card-pad">
      <p
        id="notificationPermissionStatus"
        style="
          font-size:var(--text-sm);
          color:var(--text-muted);
          line-height:1.5;
          margin-bottom:var(--space-3);
        "
      >
        Checking notification status…
      </p>

      <button
        id="notificationPermissionButton"
        type="button"
        class="btn-primary"
        style="width:100%;"
        onclick="activateBillNotifications()"
      >
        ${svgIcon("bell", 20)}
        Turn On Notifications
      </button>
  
      <p
        id="notificationTestStatus"
        style="

          font-size:var(--text-sm);
          color:var(--text-muted);
          line-height:1.5;
          margin:var(--space-2) 0 0;
        "
        role="status"
        aria-live="polite"
      ></p>
    </div>
  `;

  container.appendChild(section);

  refreshNotificationSettingsCard();
}


/* ============================================
   Full Backup and Restore
============================================ */



// Validate the entire backup before any application storage is changed.
function validateBillBeaconBackup(data) {
  const object = value => value && typeof value === "object" && !Array.isArray(value);
  if (!object(data) || !Array.isArray(data.bills) || !Array.isArray(data.payments)) throw new Error("Invalid Bill Beacon backup.");
  if (data.version != null && ![1, 2].includes(data.version)) throw new Error("Unsupported backup version.");
  let visited = 0;
  const inspect = (value, depth = 0) => {
    if (++visited > 1000000 || depth > 24) throw new Error("Backup is too complex.");
    if (typeof value === "string" && value.length > 100000) throw new Error("Backup field is too long.");
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Invalid backup number.");
    if (value && typeof value === "object") for (const key of Object.keys(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("Unsafe backup object key.");
      inspect(value[key], depth + 1);
    }
  };
  inspect(data);
  for (const key of ["bills", "payments", "archivedBills", "incomeSources", "activityLog", "bankTransactions"]) {
    if (data[key] === undefined && !["bills", "payments"].includes(key)) continue;
    if (!Array.isArray(data[key]) || data[key].length > 50000) throw new Error(`Invalid ${key} list.`);
    const ids = new Set();
    for (const record of data[key]) {
      if (!object(record) || typeof record.id !== "string" || !record.id || record.id.length > 512 || ids.has(record.id)) throw new Error(`Invalid or duplicate ${key} ID.`);
      ids.add(record.id);
      if (record.amount != null && ((typeof record.amount !== "number" && typeof record.amount !== "string") || !Number.isFinite(Number(record.amount)) || Number(record.amount) < 0)) throw new Error(`Invalid ${key} amount.`);
      for (const field of ["dueDate", "paidDate", "paidForDueDate", "originalDueDate", "voidedAt", "archivedAt"]) {
        if (record[field] != null && record[field] !== "" && (typeof record[field] !== "string" || !Number.isFinite(new Date(record[field]).getTime()))) throw new Error(`Invalid ${field}.`);
      }
      if (record.scheduleHistory != null && !Array.isArray(record.scheduleHistory)) throw new Error("Invalid schedule history.");
      for (const version of record.scheduleHistory || []) {
        if (!object(version) || !object(version.snapshot) || (version.effectiveFrom != null && !dateFromInput(version.effectiveFrom))) throw new Error("Invalid schedule version.");
      }
      if (record.billSnapshot != null && !object(record.billSnapshot)) throw new Error("Invalid payment snapshot.");
      if (record.occurrenceOverrides != null && !Array.isArray(record.occurrenceOverrides)) throw new Error("Invalid occurrence overrides.");
      if (key === "payments" && (typeof record.billId !== "string" || !record.billId)) throw new Error("Invalid payment bill ID.");
    }
  }
  if (data.settings != null && !object(data.settings)) throw new Error("Invalid backup settings.");
  if (data.settings?.currency != null && !/^[A-Z]{3}$/.test(data.settings.currency)) throw new Error("Invalid backup currency.");
  if (data.settings?.theme != null && !["light", "dark", "system"].includes(data.settings.theme)) throw new Error("Invalid backup theme.");
  return data;
}

function restoreBillBeaconBackup(data) {
  validateBillBeaconBackup(data);
  const entries = new Map([["bills", JSON.stringify(data.bills)], ["payments", JSON.stringify(data.payments)],
    ["archivedBills", JSON.stringify(data.archivedBills || [])], ["initialized", "true"]]);
  for (const key of ["incomeSources", "activityLog", "bankTransactions", "settings"]) if (data[key] !== undefined) entries.set(key, JSON.stringify(data[key]));
  const previous = new Map([...entries.keys()].map(key => [key, localStorage.getItem(key)]));
  try { for (const [key, value] of entries) localStorage.setItem(key, value); }
  catch (error) {
    let rollbackFailed = false;
    for (const [key, value] of previous) {
      try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { rollbackFailed = true; }
    }
    if (rollbackFailed) throw new Error("Restore failed and rollback was incomplete. Keep your backup and recover storage before editing data.");
    throw error;
  }
  window.dispatchEvent(new CustomEvent("billbeacon:data-changed"));
}
async function exportBillTrackerBackup() {
  try {
    if (
      typeof window.billBeaconPrepareDataTransfer !==
      "function"
    ) {
      throw new Error(
        "Update the household sync file " +
        "before creating this backup."
      );
    }

    const prepared =
      await window.billBeaconPrepareDataTransfer();

    const backup = {
      app: "Bill Beacon",
      version: 2,
      exportedAt: new Date().toISOString(),
      sourceHouseholdId: prepared.householdId,

      ...prepared.snapshot,

      bankTransactions: Store.getBankTransactions()
    };

    validateBillBeaconBackup(backup);

    const url = URL.createObjectURL(
      new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
      )
    );

    const link = document.createElement("a");

    link.href = url;
    link.download =
      `bill-beacon-backup-` +
      `${new Date().toISOString().slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  } catch (error) {
    alert(
      `Could not create backup: ${error.message}`
    );
  }
}
function chooseBillTrackerBackup() {
  document.getElementById("billTrackerBackupFile").click();
}

function importBillTrackerBackup(event) {
  const input = event.target; const file = input.files?.[0]; if (!file) return;
  if (file.size > 10 * 1024 * 1024) { alert("Backup exceeds the supported 10 MB limit."); input.value = ""; return; }
  const reader = new FileReader();
  reader.onerror = () => { alert("Backup file could not be read."); input.value = ""; };
  reader.onload = () => {
    try {
      const backup = validateBillBeaconBackup(JSON.parse(String(reader.result)));
      const omitted = ["incomeSources", "activityLog", "bankTransactions"].filter(key => backup[key] === undefined);
      const summary = `${backup.bills.length} active bills, ${backup.payments.length} payments, ${(backup.archivedBills || []).length} archived bills.`;
      const notice = omitted.length ? " Older backups omit some lists; those lists will remain unchanged." : "";
      if (!confirm(`Restore this backup? ${summary}\n\nIncluded app data will be replaced and may sync to your household.${notice}`)) return;
      restoreBillBeaconBackup(backup); initTheme(); render(); alert("Backup restored successfully.");
    } catch (error) { alert(`Could not restore backup: ${error.message}`); }
    finally { input.value = ""; }
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
    section.hidden = true;
  section.style.display = "none";
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
const householdSection = document.createElement("div");

householdSection.className = "settings-section";
householdSection.innerHTML = `
  <div class="section-header">Shared Household</div>

  <div
    class="card"
    style="
      padding: var(--space-3);
    "
  >
    <div
  style="
    font-size: var(--text-sm);
    color: var(--text-muted);
    line-height: 1.5;
    margin-bottom: 8px;
  "
>
  Invite someone to share bills and payment updates.
</div>

    <button
      id="createHouseholdInviteButton"
      class="btn-primary"
      type="button"
      style="
        width: 100%;
        min-height: 44px;
        margin-top: 0;
      "
      onclick="window.createHouseholdInvite()"
    >
      ${svgIcon("plus", 18)}
      Share Account
    </button>

    <div
      id="householdInviteStatus"
      role="status"
      aria-live="polite"
      style="
        min-height: 0;
        margin-top: 6px;
        font-size: var(--text-xs);
        color: var(--text-muted);
      "
    ></div>
  </div>
`;
container.appendChild(householdSection);
container.appendChild(section);
}
 


function attachSignOutButton() {
  const signOutButton = document.getElementById("signout-button");

  if (!signOutButton || signOutButton.dataset.billBeaconBound === "true") {
    return;
  }

  signOutButton.dataset.billBeaconBound = "true";

  signOutButton.addEventListener("click", async () => {
    try {
      const { signOut, auth } = await import("./firebase-auth.js");

      await signOut(auth);
    } catch (error) {
      console.error("Firebase sign-out failed:", error);

      alert("Could not sign out. Please refresh and try again.");
    }
  });
}


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
  window.dispatchEvent(new CustomEvent("billbeacon:data-changed"));
}

function archiveBill(billId) {
  const activeBills = Store.getBills();
  const selectedBill = activeBills.find((bill) => bill.id === billId);

  if (!selectedBill) {
    alert("Bill not found.");
    return;
  }

  const archivedAt = new Date().toISOString();
  const isPaymentPlan = Boolean(selectedBill.installmentPlanId);

  const billsToArchive = isPaymentPlan
    ? activeBills.filter(
        (bill) => bill.installmentPlanId === selectedBill.installmentPlanId
      )
    : [selectedBill];

    billsToArchive.forEach(bill => {
  preserveBillPaymentSnapshots(bill);
});

  const billsToKeep = activeBills.filter(
    (bill) => !billsToArchive.some((item) => item.id === bill.id)
  );

  const archivedBills = getArchivedBills();

  const buildArchiveSnapshot = (bill) => ({
    id: bill.id,
    name: bill.name,
    amount: Number(bill.amount || 0),
    category: bill.category || "other",
    dueDate: bill.dueDate || null,
    dueDay: bill.dueDay ?? null,
    recurrence: bill.recurrence || "None",
    installmentPlanId: bill.installmentPlanId || null,
    installmentProvider: bill.installmentProvider || null,
    installmentStore: bill.installmentStore || null,
    installmentNumber: bill.installmentNumber || null,
    installmentTotal: bill.installmentTotal || null,
    archivedAt,
  });

  const getOrdinalSuffix = (day) => {
    const value = Number(day);

    if (value >= 11 && value <= 13) return "th";

    switch (value % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const getDueDescription = (bill) => {
    if (bill.recurrence === "Monthly") {
      const day = Number(
        bill.dueDay || new Date(bill.dueDate).getDate()
      );

      return `due on the ${day}${getOrdinalSuffix(day)}`;
    }

    return bill.dueDate
      ? `due ${formatDate(bill.dueDate, "short")}`
      : "no due date";
  };

  /*
    Log exactly once:
    - A normal bill makes one bill_deleted record.
    - A payment plan makes one payment_plan_cancelled record.
  */
  if (isPaymentPlan) {
    const planId = selectedBill.installmentPlanId;
    const provider = selectedBill.installmentProvider || "Payment Plan";
    const storeName =
      selectedBill.installmentStore?.trim() ||
      selectedBill.name ||
      provider;

    const planTotal = billsToArchive.reduce(
      (sum, bill) => sum + Number(bill.amount || 0),
      0
    );

    recordActivity({
      action: "payment_plan_cancelled",
      entityType: "paymentplan",
      entityId: planId,
      title: `${storeName} Payment Plan Deleted`,
      detail: `${provider} · ${billsToArchive.length} Payment${
        billsToArchive.length === 1 ? "" : "s"
      } · ${formatCurrency(planTotal)}`,
      before: {
        planId,
        provider,
        storeName,
        installmentCount: billsToArchive.length,
        totalAmount: planTotal,
        archivedAt,
        installments: billsToArchive.map(buildArchiveSnapshot),
      },
      after: null,
    });
  } else {
    recordActivity({
      action: "bill_deleted",
      entityType: "bill",
      entityId: selectedBill.id,
      title: `${selectedBill.name} Deleted`,
      detail: `${formatCurrency(selectedBill.amount)} · ${getDueDescription(
        selectedBill
      )}`,
      before: buildArchiveSnapshot(selectedBill),
      after: null,
    });
  }

  /*
    Archive every bill record, but deliberately do not log activity here.
    This prevents one deletion entry per installment.
  */
  billsToArchive.forEach((bill) => {
    const alreadyArchived = archivedBills.some(
      (archivedBill) => archivedBill.id === bill.id
    );

    if (!alreadyArchived) {
      archivedBills.push({
        ...bill,
        archivedAt,
      });
    }
  });

  saveArchivedBills(archivedBills);

  /*
    Remove all archived bills/installments from the active bill store.
  */
  Store.saveBills(billsToKeep);
  window.dispatchEvent(
    new CustomEvent("billbeacon:data-changed")
  );
 
}
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

                  const billName = escapeHtml(
  payment.billSnapshot?.name ||
  payment.bill?.name ||
  "Removed Bill"
);

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
                value="${escapeHtml(today)}"
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

function getNextInstallmentDate(date, frequencyDays, installmentIndex = 1) {
  const anchor = new Date(date);
  if (!Number.isFinite(anchor.getTime()) || !Number.isInteger(frequencyDays) || frequencyDays <= 0 ||
      !Number.isInteger(installmentIndex) || installmentIndex < 0) {
    throw new Error("Invalid installment schedule.");
  }
  const result = new Date(anchor);
  if (frequencyDays === 30 || frequencyDays === 90) {
    const months = (frequencyDays === 30 ? 1 : 3) * installmentIndex;
    const month = anchor.getMonth() + months;
    const lastDay = new Date(anchor.getFullYear(), month + 1, 0).getDate();
    result.setDate(1);
    result.setFullYear(anchor.getFullYear(), month, Math.min(anchor.getDate(), lastDay));
  } else {
    result.setDate(anchor.getDate() + frequencyDays * installmentIndex);
  }
  return result;
}

function saveInstallmentPlan() {
  const provider =
    document.getElementById("installmentProvider")?.value.trim() || "";

  const storeName =
    document.getElementById("installmentStore")?.value.trim() || "";

  const totalAmount = parseFloat(
  document.getElementById("installmentTotal")?.value || 0
);

  const installmentCount = parseInt(
    document.getElementById("installmentCount")?.value || 0,
    10
  );

  const frequencyDays = parseInt(
    document.getElementById("installmentFrequency")?.value || 0,
    10
  );

  const firstPaymentStatus =
    document.getElementById("installmentFirstPaymentStatus")?.value ||
    "notPaid";

  const firstPaymentDateInput =
    document.getElementById("installmentFirstPaymentDate")?.value;

  const paymentUrl =
    document.getElementById("installmentPaymentUrl")?.value.trim() || "";

  const autopay = Boolean(
    document.getElementById("installmentAutopay")?.checked
  );

  const notes =
    document.getElementById("installmentNotes")?.value.trim() || "";

  if (!provider) {
    alert("Please choose a payment app.");
    return;
  }

  if (!storeName) {
    alert("Please enter the store or merchant name.");
    return;
  }

  if (Number.isNaN(totalAmount) || totalAmount <= 0) {
    alert("Please enter a valid total purchase amount.");
    return;
  }

  if (!Number.isInteger(installmentCount) || installmentCount < 2 || installmentCount > 60) {
    alert("Please choose between 2 and 60 payments.");
    return;
  }

  if (Number.isNaN(frequencyDays) || frequencyDays <= 0) {
    alert("Please choose a payment frequency.");
    return;
  }

  if (!firstPaymentDateInput) {
    alert("Please choose the first payment date.");
    return;
  }

  const firstPaymentDate = dateFromInput(firstPaymentDateInput);

  if (!firstPaymentDate) {
    alert("Please choose a valid first payment date.");
    return;
  }

  const createdAt = new Date().toISOString();
  const planId = uid();

  const centsTotal = Math.round(totalAmount * 100);
  const baseInstallmentCents = Math.floor(centsTotal / installmentCount);
  const remainderCents = centsTotal % installmentCount;

  const installments = Array.from(
    { length: installmentCount },
    (_, index) => {
      const installmentCents =
        baseInstallmentCents + (index < remainderCents ? 1 : 0);

      const dueDate = getNextInstallmentDate(firstPaymentDate, frequencyDays, index);

      return {
        id: uid(),
        name: storeName,
        amount: installmentCents / 100,
        category: "paymentplans",
        dueDate: dueDate.toISOString(),
        dueDay: dueDate.getDate(),
        recurrence: "None",
        payCycle: dueDate.getDate() <= 15 ? "first" : "second",
        paymentMethod: provider,
        paymentUrl,
        autopay,
        notes,
        reminderOffsets: [7, 1],
        createdAt,
        updatedAt: createdAt,
        postponementHistory: [],
        occurrenceOverrides: [],
        installmentPlanId: planId,
        isPaymentPlanInstallment: true,
        installmentProvider: provider,
        installmentStore: storeName,
        installmentNumber: index + 1,
        installmentTotal: installmentCount,
        installmentFrequencyDays: frequencyDays,
        installmentOriginalTotal: totalAmount,
      };
    }
  );

  installments.forEach((installment) => Store.addBill(installment));

  if (firstPaymentStatus === "paid") {
    const firstInstallment = installments[0];

    const payment = {
      id: uid(),
      billId: firstInstallment.id,
      paidDate: createdAt,
      amount: Number(firstInstallment.amount || 0),
      paidForDueDate: firstInstallment.dueDate,
      status: "active",
      voidedAt: null,
      paymentPlanId: planId,
      paymentType: "initial-payment",
    };

    Store.addPayment(payment);
  }

  const firstInstallment = installments[0];
  const perPaymentAmount = firstInstallment
    ? Number(firstInstallment.amount || 0)
    : 0;

  const firstDueLabel = firstInstallment
    ? formatDate(firstInstallment.dueDate, "short")
    : "No due date";

  recordActivity({
    action: "payment_plan_created",
    entityType: "paymentplan",
    entityId: planId,
    title: `${storeName} Payment Plan Added`,
    detail: `${provider} · ${installmentCount} payments of ${formatCurrency(
      perPaymentAmount
    )} · first due ${firstDueLabel}`,
    before: null,
    after: {
      planId,
      provider,
      storeName,
      totalAmount,
      installmentCount,
      frequencyDays,
      firstPaymentStatus,
      paymentUrl,
      autopay,
      notes,
      createdAt,
      installments: installments.map((installment) => ({
        id: installment.id,
        amount: Number(installment.amount || 0),
        dueDate: installment.dueDate,
        installmentNumber: installment.installmentNumber,
        installmentTotal: installment.installmentTotal,
      })),
    },
  });

  closeInstallmentPlanForm();
  render();
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
  notifications: [], unreadCount: 0, loaded: false, unsubscribe: null,
  uid: null, householdId: null, generation: 0, error: null, fromCache: false
};
let badgeQueue = Promise.resolve();
function getNotificationCount() { return notificationInboxState.unreadCount || 0; }
function getCurrentNotificationUserId() { return window.getBillBeaconFirebaseUser?.()?.uid || null; }
function getNotificationFirestore() { return window.getBillBeaconFirestore?.() || null; }
function notificationContext() {
  const context = window.getBillBeaconHouseholdContext?.();
  return context?.ready && context.uid === getCurrentNotificationUserId() && context.householdId
    ? context : null;
}
function notificationDiagnostic(error) {
  return {code: error?.code || "notification-error", message: error?.message || "Could not load notifications.",
    path: notificationInboxState.householdId ? `households/${notificationInboxState.householdId}/notifications` : "Household not ready"};
}
window.getBillBeaconNotificationDiagnostics = () => ({
  ...notificationDiagnostic(notificationInboxState.error), loaded: notificationInboxState.loaded,
  fromCache: notificationInboxState.fromCache, count: notificationInboxState.notifications.length,
  unread: getNotificationCount(), error: notificationInboxState.error?.code || null
});
async function syncHomeScreenNotificationBadge(reset = false) {
  if (!reset && (!notificationInboxState.loaded || notificationInboxState.fromCache)) return;
  const generation = notificationInboxState.generation;
  badgeQueue = badgeQueue.catch(() => {}).then(async () => {
    if (generation !== notificationInboxState.generation) return;
    const count = reset ? 0 : getNotificationCount();
    const householdId = reset ? null : notificationInboxState.householdId;
    try {
      if (count > 0 && navigator.setAppBadge) await navigator.setAppBadge(count);
      else if (count === 0 && navigator.clearAppBadge) await navigator.clearAppBadge();
      const registration = await navigator.serviceWorker?.getRegistration();
      if (generation !== notificationInboxState.generation) return;
      (navigator.serviceWorker?.controller || registration?.active)?.postMessage({
        type: "BILL_BEACON_BADGE", count, householdId, observedAt: Date.now()
      });
    } catch (error) { console.warn("Badge reconciliation failed:", error); }
  });
  return badgeQueue;
}
function stopNotificationInboxListener() {
  notificationInboxState.generation += 1;
  notificationInboxState.unsubscribe?.();
  notificationInboxState.unsubscribe = null;
  notificationInboxState.uid = null;
}
function clearNotificationInboxState() {
  stopNotificationInboxListener();
  Object.assign(notificationInboxState, {notifications: [], unreadCount: 0, loaded: false,
    householdId: null, error: null, fromCache: false});
  document.getElementById("notificationCenterContainer")?.remove();
  syncHomeScreenNotificationBadge(true);
}
function normalizeNotificationRecord(documentSnapshot) {
  const data = documentSnapshot.data() || {};

  return {
    id: documentSnapshot.id,
    type: data.type || 'bill-reminder',
    entityType: data.entityType || 'bill',
    billId: data.billId || null,
    installmentPlanId: data.installmentPlanId || null,
    occurrenceDueDate: data.occurrenceDueDate || null,
    dueDate: data.dueDate || null,
    offsetDays: Number.isFinite(Number(data.offsetDays))
      ? Number(data.offsetDays)
      : null,
    title: data.title || 'Bill Beacon reminder',
    body: (data.deliveryState === 'pending' ? 'Delivery pending · ' : '') + (data.body || ''),
    sentAt: data.sentAt?.toDate?.()?.toISOString() || data.sentAt || null,
    readAt: data.readAt || null,
    openedAt: data.openedAt || null,
    clearedAt: data.clearedAt || null,
    url: data.url || '/',
  };
}

function sortNotificationRecords(notifications) {
  return [...notifications].sort((first, second) => {
    const firstTime = new Date(first.sentAt || 0).getTime();
    const secondTime = new Date(second.sentAt || 0).getTime();

    return secondTime - firstTime;
  });
}


function startNotificationInboxListener() {
  const context = notificationContext();
  const firestore = getNotificationFirestore();
  if (!context || !firestore || !window.firebaseOnSnapshot) return false;
  if (notificationInboxState.uid === context.uid && notificationInboxState.householdId === context.householdId &&
      notificationInboxState.unsubscribe && !notificationInboxState.error) return true;
  stopNotificationInboxListener();
  Object.assign(notificationInboxState, {uid: context.uid, householdId: context.householdId,
    notifications: [], unreadCount: 0, loaded: false, error: null});
  const generation = notificationInboxState.generation;
  const valid = () => generation === notificationInboxState.generation &&
    notificationContext()?.uid === context.uid && notificationContext()?.householdId === context.householdId;
  const failed = error => {
    if (!valid()) return;
    notificationInboxState.error = error;
    console.error("Notification inbox listener failed:", notificationDiagnostic(error));
    renderNotificationCenterContent();
  };
  try {
    // Full collection: includes old/missing sentAt records and all unread records.
    const reference = window.firebaseCollection(firestore, "households", context.householdId, "notifications");
    notificationInboxState.unsubscribe = window.firebaseOnSnapshot(reference, {includeMetadataChanges: true}, snapshot => {
      if (!valid()) return;
      notificationInboxState.notifications = snapshot.docs.map(normalizeNotificationRecord);
      notificationInboxState.unreadCount = notificationInboxState.notifications.filter(n => !n.readAt && !n.clearedAt).length;
      notificationInboxState.loaded = true;
      notificationInboxState.error = null;
      notificationInboxState.fromCache = snapshot.metadata.fromCache;
      if (!snapshot.metadata.fromCache) syncHomeScreenNotificationBadge();
      render(); renderNotificationCenterContent();
      consumeNotificationDeepLink();
    }, failed);
    return true;
  } catch (error) { failed(error); return false; }
}
function ensureNotificationInboxListener() { return startNotificationInboxListener(); }
function captureNotificationAction() {
  const context = notificationContext();
  if (!context || !notificationInboxState.loaded || notificationInboxState.error ||
      context.householdId !== notificationInboxState.householdId) throw new Error("Notification inbox is not ready. Retry loading it first.");
  return {...context, firestore: getNotificationFirestore()};
}
async function writeNotificationChanges(items, updates, context = captureNotificationAction()) {
  for (let offset = 0; offset < items.length; offset += 450) {
    const current = notificationContext();
    if (!current || current.uid !== context.uid || current.householdId !== context.householdId || current.generation !== context.generation)
      throw new Error("Account changed; remaining notification updates were stopped.");
    const batch = window.firebaseWriteBatch(context.firestore);
    for (const item of items.slice(offset, offset + 450)) {
      batch.update(window.firebaseDoc(context.firestore, "households", context.householdId, "notifications", item.id), updates);
    }
    await batch.commit();
  }
}
async function markNotificationRead(notificationId, opened = false) {
  const context = captureNotificationAction();
  const record = notificationInboxState.notifications.find(n => n.id === notificationId);
  if (!record) throw new Error("Notification record not found in this household.");
  const updates = {};
  if (!record.readAt) updates.readAt = new Date().toISOString();
  if (opened && !record.openedAt) updates.openedAt = new Date().toISOString();
  if (Object.keys(updates).length) await writeNotificationChanges([record], updates, context);
}
async function markAllNotificationsRead() {
  const context = captureNotificationAction();
  const items = notificationInboxState.notifications.filter(n => !n.readAt && !n.clearedAt);
  await writeNotificationChanges(items, {readAt: new Date().toISOString()}, context);
}
async function clearReadNotifications() {
  const context = captureNotificationAction();
  const items = notificationInboxState.notifications.filter(n => n.readAt && !n.clearedAt);
  if (!items.length || !confirm(`Hide ${items.length} read notifications? Their Firestore records will be preserved.`)) return;
  await writeNotificationChanges(items, {clearedAt: new Date().toISOString()}, context);
}
window.addEventListener("billbeacon:household-ready", () => { startNotificationInboxListener(); });
window.addEventListener("online", () => { if (notificationInboxState.error) startNotificationInboxListener(); });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") { startNotificationInboxListener(); consumeNotificationDeepLink(); syncHomeScreenNotificationBadge(); }
});
navigator.serviceWorker?.addEventListener("controllerchange", () => { syncHomeScreenNotificationBadge(); });

navigator.serviceWorker?.addEventListener("message", event => {
  if (event.data?.type !== "BILL_BEACON_NOTIFICATION_CLICK") return;
  try {
    const url = new URL(event.data.url, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    consumeNotificationDeepLink();
  } catch (error) { console.warn("Invalid notification click message:", error); }
});

function formatNotificationSentAt(sentAt) {
  if (!sentAt) {
    return '';
  }

  const date = new Date(sentAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getNotificationIcon(notification) {
  const title = String(notification.title || '').toLowerCase();
  const body = String(notification.body || '').toLowerCase();

  if (
    title.includes('due today') ||
    title.includes('overdue') ||
    body.includes('due today')
  ) {
    return {
      name: 'warning',
      color: 'var(--overdue)',
      background: 'var(--overdue-bg)',
    };
  }

  if (notification.entityType === 'payment-plan') {
    return {
      name: 'creditcard',
      color: 'var(--accent)',
      background: 'var(--upcoming-bg)',
    };
  }

  return {
    name: 'bell',
    color: 'var(--accent)',
    background: 'var(--upcoming-bg)',
  };
}
function dateFromNotificationDateKey(value) {
  if (!value) {
    return null;
  }

  const rawValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    const [year, month, day] = rawValue
      .split('-')
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0,
      0
    ).toISOString();
  }

  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
let notificationPopupReturn = null;

function returnToNotificationCenter() {
  const saved = notificationPopupReturn;
  const context = notificationContext();

  if (
    !saved ||
    !context ||
    context.uid !== saved.uid ||
    context.householdId !== saved.householdId ||
    context.generation !== saved.generation
  ) {
    notificationPopupReturn = null;
    navigate("today");
    return;
  }

  navigate(saved.route, { ...saved.params });
  openNotificationCenter(true);
}

async function openNotificationRecord(notification) {
  if (!notification?.billId) return;

  try {
    const context = captureNotificationAction();

    const bill =
      Store.getBill(notification.billId) ||
      getArchivedBills().find(
        item => item.id === notification.billId
      );

    if (!bill) {
      alert(
        "This bill is no longer available. The reminder was kept."
      );
      return;
    }

    await markNotificationRead(notification.id, true);

    const current = notificationContext();

    if (
      !current ||
      current.generation !== context.generation ||
      current.uid !== context.uid
    ) {
      return;
    }

    if (!notificationPopupReturn) {
      notificationPopupReturn = {
        uid: context.uid,
        householdId: context.householdId,
        generation: context.generation,
        route: currentRoute,
        params: { ...routeParams },
        scroll: 0
      };
    }

    notificationPopupReturn.scroll =
      document.getElementById("notificationCenterContent")
        ?.scrollTop || 0;

    closeNotificationCenter(true);

    navigate("detail", {
      id: notification.billId,
      occurrenceDueDate: dateFromNotificationDateKey(
        notification.occurrenceDueDate ||
        notification.dueDate
      ),
      returnRoute: "today",
      returnToNotificationPopup: true
    });
  } catch (error) {
    alert(`Could not open this reminder: ${error.message}`);
  }
}

function renderNotificationCenterContent() {
  const content = document.getElementById(
    "notificationCenterContent"
  );

  if (!content) return;

  const scroll = content.scrollTop;

  const records = sortNotificationRecords(
    notificationInboxState.notifications.filter(
      notification => !notification.clearedAt
    )
  );

  const unread = records.filter(
    notification => !notification.readAt
  ).length;

  const count = document.getElementById(
    "notificationPopupCount"
  );

  if (count) {
    count.textContent =
      `${unread} Unread · ${records.length} Reminders`;
  }

  const ready = Boolean(
    notificationContext() &&
    notificationInboxState.loaded &&
    !notificationInboxState.error
  );

  const markAll = document.getElementById(
    "markAllNotificationsReadButton"
  );

  const clear = document.getElementById(
    "clearReadNotificationsButton"
  );

  if (markAll) markAll.disabled = !ready || !unread;

  if (clear) {
    clear.disabled =
      !ready || !records.some(notification => notification.readAt);
  }

  if (!getCurrentNotificationUserId()) {
    content.textContent = "Sign in to view your reminders.";
    return;
  }

  if (notificationInboxState.error) {
    const error = notificationDiagnostic(
      notificationInboxState.error
    );

    content.innerHTML = `
      <div role="alert" class="bbn-empty">
        <h3>Notifications could not load</h3>
        <p>${escapeHtml(error.code)}</p>
        <p>${escapeHtml(error.message)}</p>
        <p>${escapeHtml(error.path)}</p>
        <button
          type="button"
          id="retryNotificationInbox"
          class="bbn-tool"
        >Retry</button>
      </div>
    `;

    content.querySelector("#retryNotificationInbox")
      ?.addEventListener("click", () => {
        startNotificationInboxListener();
        renderNotificationCenterContent();
      });

    return;
  }

  if (
    !notificationContext() ||
    !notificationInboxState.loaded
  ) {
    content.textContent =
      window.billBeaconSyncStatus?.().message ||
      "Loading shared reminders…";
    return;
  }

  if (!records.length) {
    content.innerHTML = `
      <div class="bbn-empty">
        ${svgIcon("checkCircle", 36)}
        <h3>${
          notificationInboxState.fromCache
            ? "Waiting for the inbox"
            : "You're All Caught Up"
        }
      </div>
    `;
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let previousGroup = "";

  content.innerHTML =
    (
      notificationInboxState.fromCache
        ? `<p class="bbn-hint">Showing cached reminders</p>`
        : ""
    ) +
    records.map(notification => {
      const date = notification.sentAt
        ? new Date(notification.sentAt)
        : null;

      const validDate =
        date && Number.isFinite(date.getTime());

      const group = validDate
        ? date >= today
          ? "Today"
          : date >= yesterday
            ? "Yesterday"
            : "Earlier"
        : "Date unavailable";

      const heading = group !== previousGroup
        ? `<h3 class="bbn-group">${group}</h3>`
        : "";

      previousGroup = group;

      const due = dateFromNotificationDateKey(
        notification.occurrenceDueDate ||
        notification.dueDate
      );

      const dueLabel = due
        ? `Due ${formatDate(due, "short")}`
        : "";

      const received = validDate
        ? group === "Today" || group === "Yesterday"
          ? date.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit"
            })
          : date.toLocaleDateString([], {
              month: "short",
              day: "numeric"
            })
        : "Date unavailable";

      const metadata = [
        dueLabel,
        `Received ${received}`,
        notification.readAt ? "Read" : "Unread"
      ].filter(Boolean).join(" · ");

      return `
        ${heading}

        <article class="bbn-row ${
          notification.readAt ? "is-read" : "is-unread"
        }">
          <span class="bbn-icon" aria-hidden="true">
            ${svgIcon(
              notification.installmentPlanId
                ? "creditcard"
                : "bell",
              20
            )}
          </span>

          <button
            type="button"
            class="bbn-copy"
            data-read-notification="${escapeHtml(notification.id)}"
            aria-label="${escapeHtml(
              notification.readAt
                ? `Already read: ${notification.title}`
                : `Mark read: ${notification.title}`
            )}"
          >
            <span class="bbn-title">
              ${
                !notification.readAt
                  ? '<span class="bbn-dot" aria-hidden="true"></span>'
                  : ""
              }
              ${escapeHtml(notification.title)}
            </span>

            <span class="bbn-message">
              ${escapeHtml(notification.body)}
            </span>

            <span class="bbn-meta">
              ${escapeHtml(metadata)}
            </span>
          </button>

          <button
            type="button"
            class="bbn-arrow"
            data-open-notification="${escapeHtml(notification.id)}"
            ${!notification.billId ? "disabled" : ""}
            aria-label="${escapeHtml(
              `View details: ${notification.title}`
            )}"
          >
            ${svgIcon("chevronRight", 21)}
          </button>
        </article>
      `;
    }).join("");

  content.scrollTop = scroll;

  content.querySelectorAll(
    "[data-read-notification], [data-open-notification]"
  ).forEach(button => {
    button.addEventListener("click", async () => {
      const open = button.hasAttribute(
        "data-open-notification"
      );

      const id = button.getAttribute(
        open
          ? "data-open-notification"
          : "data-read-notification"
      );

      const record =
        notificationInboxState.notifications.find(
          notification => notification.id === id
        );

      if (!record || button.disabled) return;

      button.disabled = true;

      try {
        if (open) {
          await openNotificationRecord(record);
        } else if (!record.readAt) {
          await markNotificationRead(record.id);
        }
      } catch (error) {
        alert(
          `Could not update the reminder: ${error.message}`
        );
      } finally {
        button.disabled = false;
      }
    });
  });
}

async function openNotificationCenter(restore = false) {
  notificationDeepLinkFailed = "";
  ensureNotificationInboxListener();

  const context = notificationContext();

  if (restore !== true) {
    notificationPopupReturn = context
      ? {
          uid: context.uid,
          householdId: context.householdId,
          generation: context.generation,
          route: currentRoute,
          params: { ...routeParams },
          scroll: 0
        }
      : null;
  }

  document.getElementById(
    "notificationCenterContainer"
  )?.remove();

  const container = document.createElement("div");
  container.id = "notificationCenterContainer";

  container.innerHTML = `
    <style>
      #notificationCenterSheet {
  position:fixed;

  left:12px !important;
  right:12px !important;
  width:auto !important;
  max-width:calc(100% - 24px);
  min-width:0;
  box-sizing:border-box;

  top:calc(env(safe-area-inset-top, 0px) + 12px) !important;
  bottom:calc(88px + env(safe-area-inset-bottom, 0px)) !important;
  max-height:none !important;

  display:flex;
  flex-direction:column;
  overflow:hidden;

  border:1px solid rgba(192,151,255,.23);
  border-radius:24px !important;
  background:var(--bg,#09090c);
}

      #notificationCenterSheet .bbn-head {
  flex:0 0 auto;
  min-width:0;
  box-sizing:border-box;

  margin:10px 16px 8px;
  padding:16px;

  border:1px solid rgba(192,151,255,.20);
  border-radius:20px;

  background:
    radial-gradient(
      ellipse at top left,
      rgba(143,54,255,.14),
      transparent 65%
    ),
    radial-gradient(
      ellipse at top right,
      rgba(246,76,174,.14),
      transparent 65%
    ),
    var(--surface);

  box-shadow:0 6px 18px rgba(0,0,0,.14);
}

      #notificationCenterSheet .bbn-top {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
      }

      #notificationCenterSheet .bbn-heading {
        margin:0;
        font-size:22px;
        font-weight:850;
        color:var(--text);
      }

      #notificationCenterSheet .bbn-close {
        width:44px;
        height:44px;
        border:0;
        background:none;
        color:#b45cff;
        cursor:pointer;
      }

      #notificationCenterSheet .bbn-count {
  display:inline-flex;
  align-items:center;
  width:fit-content;
  max-width:100%;
  box-sizing:border-box;

  margin:8px 0 14px;
  padding:6px 11px;

  border:1px solid rgba(192,151,255,.22);
  border-radius:999px;
  background:rgba(143,54,255,.09);

  font-size:12px;
  font-weight:650;
  line-height:1.4;
  color:var(--text-muted);
}
      #notificationCenterSheet .bbn-tool {
        padding:9px 13px;
        border:1px solid rgba(192,151,255,.28);
        border-radius:12px;
        background:rgba(143,54,255,.08);
        color:var(--text);
        font:inherit;
        font-size:12px;
        font-weight:700;
        cursor:pointer;
      }

      #notificationCenterSheet button:disabled {
        opacity:.45;
        cursor:default;
      }

      #notificationCenterSheet button:focus-visible {
        outline:2px solid #c47cff;
        outline-offset:2px;
      }

      #notificationCenterContent {
  flex:1 1 auto;
  min-height:0;
  min-width:0;
  overflow-y:auto;
  overflow-x:hidden;
  overscroll-behavior:contain;
  padding:4px 16px 18px;
}

      #notificationCenterSheet .bbn-group {
        margin:17px 4px 9px;
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:.1em;
        color:var(--text-muted);
      }

      #notificationCenterSheet .bbn-row {
        display:flex;
        align-items:center;
        gap:10px;
        margin-bottom:10px;
        padding:12px;
        border:1px solid rgba(192,151,255,.16);
        border-radius:17px;
        background:var(--surface);
      }

      #notificationCenterSheet .bbn-row.is-unread {
        border-color:rgba(192,151,255,.30);
        background:
          linear-gradient(
            120deg,
            rgba(143,54,255,.11),
            rgba(246,76,174,.045)
          ),
          var(--surface);
      }

      #notificationCenterSheet .bbn-icon {
        flex:0 0 36px;
        height:36px;
        display:grid;
        place-items:center;
        border-radius:12px;
        color:#d9ccff;
        background:rgba(143,54,255,.15);
      }

      #notificationCenterSheet .bbn-copy {
        flex:1;
        min-width:0;
        border:0;
        padding:3px 0;
        background:none;
        text-align:left;
        color:var(--text);
        font:inherit;
        cursor:pointer;
      }

      #notificationCenterSheet .bbn-title {
        display:block;
        font-size:14px;
        font-weight:800;
        line-height:1.4;
        overflow-wrap:anywhere;
      }

      #notificationCenterSheet .is-read .bbn-title {
        font-weight:650;
      }

      #notificationCenterSheet .bbn-dot {
        display:inline-block;
        width:6px;
        height:6px;
        margin-right:7px;
        border-radius:50%;
        background:#00d4c7;
        vertical-align:middle;
      }

      #notificationCenterSheet .bbn-message {
        display:-webkit-box;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
        overflow:hidden;
        margin-top:4px;
        font-size:12px;
        line-height:1.5;
        color:var(--text-muted);
      }

      #notificationCenterSheet .bbn-meta {
        display:block;
        margin-top:7px;
        font-size:10px;
        line-height:1.5;
        color:var(--text-muted);
      }

      #notificationCenterSheet .bbn-arrow {
        flex:0 0 44px;
        height:44px;
        border:1px solid rgba(192,151,255,.20);
        border-radius:13px;
        background:rgba(143,54,255,.10);
        color:#d9ccff;
        display:grid;
        place-items:center;
        cursor:pointer;
      }

      #notificationCenterSheet .bbn-hint {
  flex:0 0 auto;
  margin:0;
  padding:6px 20px 12px;

  font-size:11px;
  line-height:1.5;
  color:var(--text-muted);
}

      #notificationCenterSheet .bbn-empty {
        padding:30px 12px;
        text-align:center;
        color:var(--text-muted);
      }
    </style>

    <div
      class="sheet-overlay show"
      id="notificationCenterOverlay"
      onclick="closeNotificationCenter()"
    ></div>

    <section
      class="sheet show"
      id="notificationCenterSheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notificationPopupTitle"
    >
      <div class="sheet-handle"></div>

      <header class="bbn-head">
        <div class="bbn-top">
          <h2 class="bbn-heading" id="notificationPopupTitle">
            Notifications
          </h2>

          <button
            type="button"
            class="bbn-close"
            id="notificationCenterCloseButton"
            aria-label="Close notifications"
          >
            ${svgIcon("close", 24)}
          </button>
        </div>

        <p class="bbn-count" id="notificationPopupCount">
          Loading reminders…
        </p>

        <div class="bbn-top">
          <button
            type="button"
            class="bbn-tool"
            id="markAllNotificationsReadButton"
          >Mark All Read</button>

          <button
            type="button"
            class="bbn-tool"
            id="clearReadNotificationsButton"
          >Clear Read</button>
        </div>
      </header>
      <div id="notificationCenterContent"></div>
    </section>
  `;

  document.body.appendChild(container);
  lockBackgroundScroll();

  container.querySelector("#notificationCenterCloseButton")
    .addEventListener("click", () => closeNotificationCenter());

  const actions = [
    ["markAllNotificationsReadButton", markAllNotificationsRead],
    ["clearReadNotificationsButton", clearReadNotifications]
  ];

  for (const [id, action] of actions) {
    container.querySelector(`#${id}`)
      .addEventListener("click", async event => {
        const button = event.currentTarget;
        button.disabled = true;

        try {
          await action();
        } catch (error) {
          alert(error.message);
        } finally {
          if (container.isConnected) {
            renderNotificationCenterContent();
          }
        }
      });
  }

  renderNotificationCenterContent();

  if (restore === true) {
    container.querySelector("#notificationCenterContent")
      .scrollTop = notificationPopupReturn?.scroll || 0;
  }
}
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
  let attempts = 0;
  const maxAttempts = 30;

  const startWhenFirebaseIsReady = () => {
    attempts += 1;

    if (ensureNotificationInboxListener()) {
      render();
      return;
    }

    if (attempts < maxAttempts) {
      window.setTimeout(
        startWhenFirebaseIsReady,
        500
      );
      return;
    }

    console.warn(
      'Notification inbox did not start because Firebase was not ready.'
    );
  };

  startWhenFirebaseIsReady();
});

document.addEventListener(
  "touchmove",
  function (event) {
    if (!document.body.classList.contains("popup-open")) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const sheet = target.closest(".sheet");

    if (!sheet) {
      event.preventDefault();
      return;
    }

    let element = target;

    while (element && sheet.contains(element)) {
      const overflowY =
        getComputedStyle(element).overflowY;

      const canScroll =
        /^(auto|scroll)$/.test(overflowY) &&
        element.scrollHeight > element.clientHeight;

      if (canScroll) {
        return;
      }

      if (element === sheet) {
        break;
      }

      element = element.parentElement;
    }

    event.preventDefault();
  },
  { passive: false }
);
// ====================================
// INIT
// ====================================
function showAppUpdatePrompt(registration) {
  if (document.getElementById("billBeaconUpdatePrompt")) {
    return;
  }

  const updatePrompt = document.createElement("div");

  updatePrompt.id = "billBeaconUpdatePrompt";

  updatePrompt.style.cssText = `
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(88px + env(safe-area-inset-bottom));
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.35);
    font-size: 14px;
    font-weight: 700;
  `;

  updatePrompt.innerHTML = `
    <span>A new Bill Beacon update is ready.</span>

    <button
      id="billBeaconUpdateButton"
      type="button"
      style="
        flex: 0 0 auto;
        min-height: 38px;
        padding: 0 14px;
        border: 0;
        border-radius: 10px;
        background: linear-gradient(
          100deg,
          #8f2cff 0%,
          #d939d5 46%,
          #f14381 68%,
          #ff6b13 100%
        );
        color: #ffffff;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      "
    >
      Update
    </button>
  `;

  document.body.appendChild(updatePrompt);

  document
    .getElementById("billBeaconUpdateButton")
    ?.addEventListener("click", () => {
      const waitingWorker = registration.waiting;

      if (waitingWorker) {
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
      }
    });
}
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "./sw.js"
      );

      // Check once immediately when the app opens.
      registration.update();

      // Check again every 60 minutes while the app remains open.
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (!newWorker) {
          return;
        }

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showAppUpdatePrompt(registration);
          }
        });
      });

      let refreshing = false;

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) {
          return;
        }

        refreshing = true;
        window.location.reload();
      });
    } catch (error) {
      console.warn("Service worker registration failed:", error);
    }
  });
}
function initializeBillBeaconApp() { initTheme(); render(); }

document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.init === "function") window.init(); else initializeBillBeaconApp();
});
window.addEventListener("storage", () => {
  window.dispatchEvent(new CustomEvent("billbeacon:data-changed"));
});