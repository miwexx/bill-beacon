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
  export: '<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>',
  bell: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>',
  lock: '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-9H9V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2z" fill="currentColor"/>',
  clock: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.3 2.5-.8 1.5z" fill="currentColor"/>',
  internaldrive: '<path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" fill="currentColor"/>',
  tray: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v8.59l-2.3-2.3-3.59 3.59-4-4L5 14.59V5h14zM7 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" fill="currentColor"/>',
  pieChart: '<path d="M11 2v20c5.52 0 10-4.48 10-10S16.52 2 11 2zm-1 7L4.6 7.3C3.6 8.8 3 10.6 3 12.5 3 17.2 6.8 21 11.5 21c1.9 0 3.7-.6 5.2-1.6L10 9z" fill="currentColor"/>',
  trendUp: '<path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="currentColor"/>',
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
    localStorage.setItem('bills', JSON.stringify(bills));
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
    const idx = bills.findIndex(b => b.id === id);
    if (idx >= 0) {
      bills[idx] = { ...bills[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveBills(bills);
    }
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
  getPaymentsForBill(billId) {
    return this.getPayments().filter(p => p.billId === billId).sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
  },
  getSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('settings') || '{}');
      return {
        currency: s.currency || 'USD',
        biometricLock: s.biometricLock || false,
        theme: s.theme || 'dark',
        ...s,
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
  return `https://img.logo.dev/${brand.domain}?token=pk_Oi2mTbJ_SOOVDVoEsRz5kg&size=64&format=png`;
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

function billVisual(bill, size = 18) {
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
          object-fit:cover;
transform:scale(1.32);
padding:0;
border-radius:4px;
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

function getBillStatus(bill) {
  const payments = Store.getPaymentsForBill(bill.id);
  if (bill.recurrence === 'None' && payments.length > 0) return 'paid';
  if (bill.recurrence !== 'None') {
    // Recurring: always show as unpaid (active bill = next due date)
    if (daysUntil(bill.dueDate) < 0) return 'overdue';
    return 'upcoming';
  }
  if (daysUntil(bill.dueDate) < 0) return 'overdue';
  return 'upcoming';
}

function isPaidThisCycle(bill) {
  return getBillStatus(bill) === 'paid';
}

function isPaidThisMonth(bill) {
  return Store.getPaymentsForBill(bill.id).some((payment) =>
    isSameMonth(payment.paidDate)
  );
}

function markBillPaid(billId) {
  const bill = Store.getBill(billId);
  if (!bill) return;

  // Create payment record
  Store.addPayment({
    id: uid(),
    billId: billId,
    paidDate: new Date().toISOString(),
    amount: bill.amount,
  });

  // Advance due date for recurring bills
  if (bill.recurrence !== 'None') {
    const next = nextDate(bill.dueDate, bill.recurrence);
    if (next) {
      Store.updateBill(billId, { dueDate: next });
    }
  }
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
    // Default to dark (Rocket Money style)
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// ====================================
// ROUTER
// ====================================

let currentRoute = 'today';
let routeParams = {};

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
function renderToday() {
  const bills = Store.getBills();
  const payments = Store.getPayments();
  const now = new Date();

  const currentMonthLabel = formatDate(now.toISOString(), 'monthYear');
  const currentDateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(now);

  const monthBills = bills.filter((bill) => isSameMonth(bill.dueDate, now));

  const monthPayments = payments.filter((payment) =>
    isSameMonth(payment.paidDate, now)
  );

  const paidBillIds = new Set(monthPayments.map((payment) => payment.billId));

  const paidThisMonth = monthPayments.reduce(
    (sum, payment) => sum + (parseFloat(payment.amount) || 0),
    0
  );

  const unpaidMonthBills = monthBills.filter(
    (bill) => !paidBillIds.has(bill.id)
  );

  const upcomingMonthBills = unpaidMonthBills.filter(
    (bill) => getBillStatus(bill) === 'upcoming'
  );

  const overdueBills = bills.filter(
    (bill) => getBillStatus(bill) === 'overdue'
  );

  const remainingThisMonth = unpaidMonthBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const totalThisMonth = paidThisMonth + remainingThisMonth;

const next7DaysEnd = new Date(now);
next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
next7DaysEnd.setHours(23, 59, 59, 999);

const next7DaysBills = bills.filter((bill) => {
  if (isPaidThisCycle(bill)) {
    return false;
  }

  const dueDate = new Date(bill.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate >= now && dueDate <= next7DaysEnd;
});

const next7DaysTotal = next7DaysBills.reduce(
  (sum, bill) => sum + (parseFloat(bill.amount) || 0),
  0
);
  const paidProgress =
    totalThisMonth > 0
      ? Math.min((paidThisMonth / totalThisMonth) * 100, 100)
      : 0;

  const nextDueBill = [...upcomingMonthBills, ...overdueBills]
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  const upcomingBills = bills
    .filter(
      (bill) =>
        getBillStatus(bill) === 'upcoming' &&
        !paidBillIds.has(bill.id)
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  const recentPayments = payments
    .map((payment) => ({
      ...payment,
      bill: Store.getBill(payment.billId),
    }))
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
    .slice(0, 5);

  const paidCount = paidBillIds.size;
  const upcomingCount = upcomingMonthBills.length;
  const overdueCount = overdueBills.length;
  const notificationCount = getNotificationCount();

  return `
      <div class="nav-bar dashboard-nav">
  <div class="nav-bar-content">
    <button
      class="nav-button dashboard-icon-button"
      onclick="navigate('settings')"
      aria-label="Open settings"
    >
      ${svgIcon('gear', 22)}
    </button>

    <div class="dashboard-date">${currentDateLabel}</div>

    <button
  class="nav-button dashboard-icon-button"
  onclick="openNotificationCenter()"
  aria-label="Open notifications"
  style="position:relative"
>
  ${svgIcon('bell', 22)}
  ${
    notificationCount > 0
      ? `<span style="
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
        ">${notificationCount > 9 ? '9+' : notificationCount}</span>`
      : ''
  }
</button>
  </div>
</div>

    <div class="main-content fade-in">
      <div class="content-pad dashboard-content">

        <button
          class="dashboard-month-card"
          onclick="navigate('bills', { filter: 'unpaid' })"
          aria-label="View bills due this month"
        >
          <div class="dashboard-card-topline">
            <span>Bills Due This Month</span>
            <span>${currentMonthLabel}</span>
          </div>

          <div class="dashboard-month-amount">
            ${formatCurrency(totalThisMonth)}
          </div>

          <div class="dashboard-progress-track">
            <div
              class="dashboard-progress-fill"
              style="width: ${paidProgress}%"
            ></div>
          </div>

          <div class="dashboard-progress-meta">
            <span class="text-paid">
              ${formatCurrency(paidThisMonth)} paid
            </span>
            <span>
              ${formatCurrency(remainingThisMonth)} remaining
            </span>
          </div>

          <div class="dashboard-month-footer">
            ${paidCount} paid · ${unpaidMonthBills.length} still due
          </div>
        </button>

        <div
  style="
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    margin:10px 0 18px;
    padding:11px 14px;
    border:1px solid var(--border, rgba(255,255,255,0.12));
    border-radius:999px;
    background:var(--card, rgba(255,255,255,0.06));
    font-size:13px;
  "
>
  <span style="color:var(--text-muted);">Next 7 days</span>
  <strong>${formatCurrency(next7DaysTotal)}</strong>
  <span style="color:var(--text-muted);">
    ${next7DaysBills.length}
    ${next7DaysBills.length === 1 ? "bill due" : "bills due"}
  </span>
</div>
        ${
          nextDueBill
            ? `
              <button
                class="next-due-card ${
                  getBillStatus(nextDueBill) === 'overdue'
                    ? 'next-due-card-overdue'
                    : ''
                }"
                onclick="navigate('detail', { id: '${nextDueBill.id}' })"
                aria-label="View next due bill"
              >
                <div class="next-due-icon">
                  ${svgIcon(
                    getBillStatus(nextDueBill) === 'overdue'
                      ? 'warning'
                      : 'clock',
                    18
                  )}
                </div>

                <div class="next-due-copy">
                  <div class="next-due-label">
                    ${
                      getBillStatus(nextDueBill) === 'overdue'
                        ? 'Overdue'
                        : 'Next Due'
                    }
                  </div>

                  <div class="next-due-name">
                    ${escapeHtml(nextDueBill.name)}
                  </div>

                  <div class="next-due-meta">
                    ${formatDate(nextDueBill.dueDate, 'full')} ·
                    ${relativeDue(nextDueBill.dueDate)}
                  </div>
                </div>

                <div class="next-due-amount">
                  ${formatCurrency(nextDueBill.amount)}
                </div>

                <div class="next-due-arrow">
                  ${svgIcon('chevronRight', 20)}
                </div>
              </button>
            `
            : `
              <div class="next-due-card next-due-card-empty">
                <div class="next-due-icon">${svgIcon('checkCircle', 18)}</div>
                <div class="next-due-copy">
                  <div class="next-due-label">Next Due</div>
                  <div class="next-due-name">You are all caught up</div>
                </div>
              </div>
            `
        }

        <div class="section-header">Bill Status · ${currentMonthLabel}</div>
<div class="dashboard-status-row">
  <button class="dashboard-status-card status-paid-card" onclick="openDashboardStatusSheet('paid')" aria-label="View paid bills">
    <div class="dashboard-status-number text-paid">${paidCount}</div>
    <div class="dashboard-status-label">Paid</div>
  </button>

  <button class="dashboard-status-card status-upcoming-card" onclick="openDashboardStatusSheet('due')" aria-label="View bills due">
    <div class="dashboard-status-number text-upcoming">${upcomingCount}</div>
    <div class="dashboard-status-label">Due</div>
  </button>

  <button class="dashboard-status-card status-overdue-card" onclick="openDashboardStatusSheet('overdue')" aria-label="View overdue bills">
    <div class="dashboard-status-number text-overdue">${overdueCount}</div>
    <div class="dashboard-status-label">Overdue</div>
  </button>
</div>

        <div>
          <div class="dashboard-section-title-row">
            <div class="section-header dashboard-section-header">
              Upcoming Bills
            </div>

            <button
              class="dashboard-see-all"
              onclick="navigate('bills', { filter: 'unpaid' })"
            >
              See all
            </button>
          </div>

          ${
            upcomingBills.length
              ? `
                <div class="upcoming-carousel">
                  ${upcomingBills
                    .map((bill) => {
                      const category = getCategory(bill.category);

                      return `
                        <button
                          class="upcoming-bill-card"
                          onclick="navigate('detail', { id: '${bill.id}' })"
                          aria-label="View ${escapeHtml(bill.name)} details"
                        >
                          <div
                            class="upcoming-bill-icon"
                            style="background:var(--${category.color})"
                          >
                            ${svgIcon(category.icon, 20)}
                          </div>

                          <div class="upcoming-bill-name">
                            ${escapeHtml(bill.name)}
                          </div>

                          <div class="upcoming-bill-amount">
                            ${formatCurrency(bill.amount)}
                          </div>

                          <div class="upcoming-bill-date">
                            ${formatDate(bill.dueDate)} ·
                            ${relativeDue(bill.dueDate)}
                          </div>
                        </button>
                      `;
                    })
                    .join('')}
                </div>
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
                    class="dashboard-see-all"
                    onclick="navigate('history')"
                  >
                    See more
                  </button>
                `
                : ''
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
                        : 'Archived bill';

                      return `
                        <button
                          class="recent-payment-row"
                          onclick="navigate('detail', { id: '${payment.billId}' })"
                        >
                          <div class="recent-payment-icon">
                            ${svgIcon('checkCircle', 18)}
                          </div>

                          <div class="bill-info">
                            <div class="bill-name">${billName}</div>
                            <div class="bill-meta">
                              Paid ${formatDate(payment.paidDate, 'full')}
                            </div>
                          </div>

                          <div class="recent-payment-amount">
                            ${formatCurrency(payment.amount)}
                          </div>
                        </button>
                      `;
                    })
                    .join('')}
                </div>
              `
              : `
                <div class="dashboard-empty-card">
                  ${svgIcon('tray', 22)}
                  <span>Payments you mark as paid will appear here</span>
                </div>
              `
          }
        </div>

      </div>
    </div>
  `;
}
function renderBills() {
  const bills = Store.getBills();
  const cycleFilter = routeParams.cycle || 'all';
  const statusFilter = routeParams.status || routeParams.filter || 'all';
  const search = routeParams.search || '';

  let filtered = bills;
  if (statusFilter === 'unpaid') {
  const now = new Date();

  filtered = filtered.filter(bill => {
    const dueDate = new Date(bill.dueDate);
    const isDueThisMonth =
      dueDate.getMonth() === now.getMonth() &&
      dueDate.getFullYear() === now.getFullYear();

    return isDueThisMonth && getBillStatus(bill) !== 'paid';
  });
}

if (statusFilter === 'paid') {
  filtered = filtered.filter(bill => isPaidThisMonth(bill));
}

if (statusFilter === 'overdue') {
  filtered = filtered.filter(bill => getBillStatus(bill) === 'overdue');
}

if (cycleFilter === 'early') {
  filtered = filtered.filter(bill => {
    if (bill.payCycle === 'first') return true;
    if (bill.payCycle === 'second') return false;

    return new Date(bill.dueDate).getDate() <= 15;
  });
}

if (cycleFilter === 'late') {
  filtered = filtered.filter(bill => {
    if (bill.payCycle === 'second') return true;
    if (bill.payCycle === 'first') return false;

    return new Date(bill.dueDate).getDate() > 15;
  });
}

  if (search) {
    filtered = filtered.filter(b =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      getCategory(b.category).label.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Group by month
  const groups = {};
  filtered.forEach(b => {
    const key = formatDate(b.dueDate, 'monthYear');
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });

  // Sort groups chronologically
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const da = groups[a][0].dueDate;
    const db = groups[b][0].dueDate;
    return new Date(da) - new Date(db);
  });

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <div class="nav-title">Recurring</div>
        
        <div style="display: flex; align-items: center; gap: var(--space-2)">
  <button class="nav-button" onclick="openAddMenu()" aria-label="Add a bill or payment plan" title="Add">
    ${svgIcon('plus', 18)}
  </button>
</div>
      </div>
    </div>
    <div class="main-content fade-in">
      <div class="search-bar">
        <input class="search-input" type="search" placeholder="Search Bills" value="${escapeHtml(search)}"
          oninput="debouncedSearch(this.value)">
      </div>
     <div class="filter-bar cycle-filter-bar">
  ${[
    { id: 'all', label: 'All Cycles' },
    { id: 'early', label: 'Early Cycle' },
    { id: 'late', label: 'Late Cycle' },
  ].map(item => `
    <button class="filter-pill ${cycleFilter === item.id ? 'active' : ''}"
      onclick="setCycleFilter('${item.id}')">
      ${item.label}
    </button>
  `).join('')}
</div>

<div class="filter-bar">
  ${[
    { id: 'all', label: 'All' },
    { id: 'unpaid', label: 'Due' },
    { id: 'paid', label: 'Paid' },
    { id: 'overdue', label: 'Overdue' },
  ].map(item => `
    <button class="filter-pill ${statusFilter === item.id ? 'active' : ''}"
      onclick="setStatusFilter('${item.id}')">
      ${item.label}
    </button>
  `).join('')}
</div>
      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${svgIcon('tray', 48)}</div>
          <div class="empty-state-title">No bills found</div>
          <div class="empty-state-text">Try a different filter or add a new bill.</div>
        </div>
      ` : sortedKeys.map(key => `
        <div>
          <div class="section-header">${key}</div>
          <div class="card">
            ${groups[key].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(bill => billRow(bill, true)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    
  `;
}

function renderCalendar() {
  let viewDate = routeParams.month ? new Date(routeParams.month) : new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const today = new Date();
  const bills = Store.getBills();

  const monthBills = bills.filter(bill => {
    const dueDate = new Date(bill.dueDate);
    return dueDate.getMonth() === month && dueDate.getFullYear() === year;
  });

  const monthTotal = monthBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const paidBills = monthBills.filter(bill => isPaidThisMonth(bill));
  const paidTotal = paidBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const dueBills = monthBills.filter(
    bill => !isPaidThisMonth(bill) && getBillStatus(bill) === 'upcoming'
  );

  const dueTotal = dueBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const overdueBills = bills.filter(bill => getBillStatus(bill) === 'overdue');
  const overdueTotal = overdueBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayCells = [];

  for (let i = 0; i < startWeekday; i++) {
    dayCells.push('<div class="calendar-day calendar-day-empty"></div>');
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayBills = monthBills.filter(bill => {
      const dueDate = new Date(bill.dueDate);
      return dueDate.getDate() === day;
    });

    const isToday = date.toDateString() === today.toDateString();
    const hasPaid = dayBills.some(bill => isPaidThisMonth(bill));
    const hasUpcoming = dayBills.some(
      bill => !isPaidThisMonth(bill) && getBillStatus(bill) === 'upcoming'
    );
    const hasOverdue = dayBills.some(
      bill => getBillStatus(bill) === 'overdue'
    );

       let dots = '';
    if (dayBills.length) {
      dots = `
        <div class="calendar-dot-row">
          ${hasPaid ? '<div class="calendar-dot" style="background:var(--paid)"></div>' : ''}
          ${hasUpcoming ? '<div class="calendar-dot" style="background:var(--upcoming)"></div>' : ''}
          ${hasOverdue ? '<div class="calendar-dot" style="background:var(--overdue)"></div>' : ''}
        </div>
      `;
    }

   
    dayCells.push(`
      <button
        class="calendar-day calendar-day-clickable ${isToday ? 'today' : ''} ${hasOverdue ? 'calendar-day-overdue' : ''}"
        onclick="openCalendarDay('${date.toISOString()}')"
        aria-label="View ${dayBills.length ? `${dayBills.length} bills due on ` : ''}${formatDate(date.toISOString(), 'full')}"
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
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
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
            <button class="month-nav-btn" onclick="navigate('calendar', { month: '${prevMonth}' })" aria-label="Previous month">
              ${svgIcon('chevronLeft', 22)}
            </button>

            <div class="month-nav-title">${formatDate(viewDate.toISOString(), 'monthYear')}</div>

            <button class="month-nav-btn" onclick="navigate('calendar', { month: '${nextMonth}' })" aria-label="Next month">
              ${svgIcon('chevronRight', 22)}
            </button>
          </div>

          ${
            !viewingCurrentMonth
              ? `<button class="btn-secondary" style="width:100%;margin:var(--space-2) 0 var(--space-4)" onclick="navigate('calendar')">
                  ${svgIcon('calendar', 18)}
                  Today
                </button>`
              : ''
          }

          <div class="calendar-grid">
            ${weekdays.map(day => `<div class="calendar-weekday">${day}</div>`).join('')}
            ${dayCells.join('')}
          </div>
        </div>

        <div class="calendar-summary">
          <div class="calendar-summary-item">
            <div class="calendar-summary-label">Scheduled</div>
            <div class="calendar-summary-value">${formatCurrency(monthTotal)}</div>
            <div class="calendar-summary-meta">${monthBills.length} ${monthBills.length === 1 ? 'bill' : 'bills'}</div>
          </div>

          <div class="calendar-summary-item">
            <div class="calendar-summary-label">Still due</div>
            <div class="calendar-summary-value text-upcoming">${formatCurrency(dueTotal)}</div>
            <div class="calendar-summary-meta">${dueBills.length} ${dueBills.length === 1 ? 'bill' : 'bills'}</div>
          </div>

          <div class="calendar-summary-item">
            <div class="calendar-summary-label">Paid</div>
            <div class="calendar-summary-value text-paid">${formatCurrency(paidTotal)}</div>
            <div class="calendar-summary-meta">${paidBills.length} ${paidBills.length === 1 ? 'bill' : 'bills'}</div>
          </div>
        </div>

        ${
          overdueBills.length
            ? `<div class="card card-pad" style="border-color:color-mix(in srgb, var(--overdue) 38%, var(--border))">
                <div style="display:flex;align-items:center;gap:var(--space-2);color:var(--overdue)">
                  ${svgIcon('warning', 18)}
                  <strong>${overdueBills.length} overdue ${overdueBills.length === 1 ? 'bill' : 'bills'}</strong>
                  <span style="margin-left:auto;font-weight:800">${formatCurrency(overdueTotal)}</span>
                </div>
              </div>`
            : ''
        }

        ${
  monthBillsSorted.length
    ? `<div>
        <div class="section-header">This Month</div>

        <div class="card">
          ${visibleMonthBills.map(bill => billRow(bill, true)).join('')}

          ${
            hiddenMonthBills.length
              ? `<div id="moreMonthBills" class="more-month-bills">
                  ${hiddenMonthBills.map(bill => billRow(bill, true)).join('')}
                </div>

                <button
                  id="toggleMonthBills"
                  class="show-more-bills-button"
                  onclick="toggleMonthBills()"
                >
                  Show all ${monthBillsSorted.length} bills
                  ${svgIcon('chevronRight', 18)}
                </button>`
              : ''
          }
        </div>
      </div>`
    : `<div class="empty-state">
        <div class="empty-state-icon">${svgIcon('calendar', 44)}</div>
        <div class="empty-state-title">No bills this month</div>
        <div class="empty-state-text">
          Add a bill to begin planning this month’s payments.
        </div>
        <button
          class="btn-primary"
          style="margin-top:var(--space-4)"
          onclick="openBillForm()"
        >
          ${svgIcon('plus', 18)}
          Add bill
        </button>
      </div>`
}
      </div>
    </div>
  `;
}

window.closeCalendarDay = function () {
  const overlay = document.getElementById("calendarDayOverlay");
  const sheet = document.getElementById("calendarDaySheet");

  if (overlay) {
    overlay.classList.remove("show");
  }

  if (sheet) {
    sheet.classList.remove("show");
  }

  setTimeout(() => {
    const container = document.getElementById("calendarDaySheetContainer");

    if (container) {
      container.remove();
    }
  }, 300);
}

window.openCalendarDay = function(dateString) {
  const selectedDate = new Date(dateString);

  const billsForDay = Store.getBills().filter(bill => {
    const dueDate = new Date(bill.dueDate);
    return dueDate.getDate() === selectedDate.getDate()
      && dueDate.getMonth() === selectedDate.getMonth()
      && dueDate.getFullYear() === selectedDate.getFullYear();
  });

  const dayTotal = billsForDay.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const container = document.createElement('div');
  container.id = 'calendarDaySheetContainer';

  container.innerHTML = `
    <div class="sheet-overlay" id="calendarDayOverlay" onclick="closeCalendarDay()"></div>

    <div class="sheet" id="calendarDaySheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeCalendarDay()">Close</button>
        <div class="sheet-title">${formatDate(dateString, 'full')}</div>
        <div style="width:54px"></div>
      </div>

      <div style="padding:var(--space-4)">
        <div class="card" style="margin-bottom:var(--space-4)">
          <div class="form-row">
            <div>
              
              <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">
                ${billsForDay.length} ${billsForDay.length === 1 ? 'bill' : 'bills'} scheduled
              </div>
            </div>
            <div style="margin-left:auto;font-size:var(--text-lg);font-weight:800">
              ${formatCurrency(dayTotal)}
            </div>
          </div>
        </div>

        ${
          billsForDay.length
            ? `<div class="card">
                ${billsForDay.map(bill => {
                  const category = getCategory(bill.category);
                  const paid = isPaidThisMonth(bill);
                  const status = getBillStatus(bill);
                  const statusText = paid ? 'Paid' : status === 'overdue' ? 'Overdue' : 'Due';
                  const statusColor = paid
                    ? 'var(--paid)'
                    : status === 'overdue'
                      ? 'var(--overdue)'
                      : 'var(--upcoming)';

                  return `
                    <div class="bill-row">
                      <button
                        onclick="closeCalendarDay();navigate('detail',{id:'${bill.id}'})"
                        style="display:contents;text-align:left"
                        aria-label="View ${escapeHtml(bill.name)}"
                      >
                        <div class="bill-icon" style="background:var(--${category.color});color:white">
  ${billVisual(bill, 32)}
</div>

                        <div class="bill-info">
                          <div class="bill-name">${escapeHtml(bill.name)}</div>
                          <div class="bill-meta" style="color:${statusColor}">${statusText}</div>
                        </div>

                        <div class="bill-amount">${formatCurrency(bill.amount)}</div>
                      </button>

                      ${
                        !paid
                          ? `<button
                              class="calendar-pay-button"
                              onclick="markCalendarBillPaid('${bill.id}','${dateString}')"
                              aria-label="Mark ${escapeHtml(bill.name)} as paid"
                            >
                              ${svgIcon('check', 16)}
                            </button>`
                          : ''
                      }
                    </div>
                  `;
              }).join('')}
</div>

<button
  class="calendar-add-pill"
  onclick="closeCalendarDay(); openCalendarAddMenu('${dateString}')"
>
  ${svgIcon('plus', 18)}
  Add Bill
</button>`
            : `<div class="empty-state">
                <div class="empty-state-icon">${svgIcon('calendar', 44)}</div>
                <div class="empty-state-title">No bills due</div>
                <div class="empty-state-text">There are no bills scheduled for this date.</div>
                <button
  class="calendar-add-pill"
  onclick="closeCalendarDay(); openCalendarAddMenu('${dateString}')"
>
  ${svgIcon('plus', 18)}
  Add Bill
</button>
              </div>`
        }
      </div>
    </div>
  `;

  document.body.appendChild(container);

  requestAnimationFrame(() => {
    document.getElementById('calendarDayOverlay')?.classList.add('show');
    document.getElementById('calendarDaySheet')?.classList.add('show');
  });
};

window.markCalendarBillPaid = function(billId, dateString) {
  markBillPaid(billId);

  closeCalendarDay();

  setTimeout(() => {
    openCalendarDay(dateString);
    render();
  }, 320);
};
function closeDashboardStatusSheet() {
  const overlay = document.getElementById('dashboardStatusOverlay');
  const sheet = document.getElementById('dashboardStatusSheet');

  if (overlay) overlay.classList.remove('show');
  if (sheet) sheet.classList.remove('show');

  setTimeout(() => {
    document.getElementById('dashboardStatusContainer')?.remove();
  }, 300);
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

      <div style="padding:var(--space-4)">
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
  }, 300);
}
function openDashboardStatusSheet(status) {
  const now = new Date();
  const currentMonthBills = Store.getBills().filter(bill => {
    const dueDate = new Date(bill.dueDate);
    return dueDate.getMonth() === now.getMonth()
      && dueDate.getFullYear() === now.getFullYear();
  });

  let title = 'Paid';
  let color = 'var(--paid)';
  let background = 'var(--paid-bg)';
  let icon = svgIcon('checkCircle', 18);
  let selectedBills = [];

  if (status === 'paid') {
    const paidBillIds = new Set(
      Store.getPayments()
        .filter(payment => isSameMonth(payment.paidDate, now))
        .map(payment => payment.billId)
    );
    selectedBills = currentMonthBills.filter(bill => paidBillIds.has(bill.id));
  }

  if (status === 'due') {
    title = 'Due';
    color = 'var(--upcoming)';
    background = 'var(--upcoming-bg)';
    icon = svgIcon('clock', 18);
    selectedBills = currentMonthBills.filter(
      bill => getBillStatus(bill) === 'upcoming'
    );
  }

  if (status === 'overdue') {
    title = 'Overdue';
    color = 'var(--overdue)';
    background = 'var(--overdue-bg)';
    icon = svgIcon('warning', 18);
    selectedBills = Store.getBills().filter(
      bill => getBillStatus(bill) === 'overdue'
    );
  }

  selectedBills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const total = selectedBills.reduce(
    (sum, bill) => sum + (parseFloat(bill.amount) || 0),
    0
  );

  const container = document.createElement('div');
  container.id = 'dashboardStatusContainer';
  container.innerHTML = `
    <div class="sheet-overlay" id="dashboardStatusOverlay" onclick="closeDashboardStatusSheet()"></div>

    <div class="sheet" id="dashboardStatusSheet">
      <div class="sheet-handle"></div>

      <div class="sheet-nav">
        <button class="nav-button" onclick="closeDashboardStatusSheet()">Close</button>
        <div class="sheet-title">${title} bills</div>
        <div style="width: 54px"></div>
      </div>

      <div style="padding: var(--space-4)">
        <div class="card" style="margin-bottom: var(--space-4); overflow: hidden">
          <div class="form-row">
            <div style="display: flex; align-items: center; gap: var(--space-2); color: ${color}">
              ${icon}
              <span style="font-weight: 700">${selectedBills.length} ${selectedBills.length === 1 ? 'bill' : 'bills'}</span>
            </div>
            <div style="flex: 1"></div>
            <div style="font-size: var(--text-lg); font-weight: 800; color: ${color}">
              ${formatCurrency(total)}
            </div>
          </div>
        </div>

        ${
          selectedBills.length
            ? `<div class="card">
                ${selectedBills.map(bill => {
                  const category = getCategory(bill.category);
                  const dateLabel = status === 'paid'
                    ? 'Paid this month'
                    : `${formatDate(bill.dueDate, 'full')} · ${relativeDue(bill.dueDate)}`;

                  return `
                    <button
                      class="bill-row"
                      onclick="closeDashboardStatusSheet(); navigate('detail', { id: '${bill.id}' })"
                      style="width: 100%; text-align: left"
                      aria-label="View ${escapeHtml(bill.name)}"
                    >
                      <div class="bill-icon" style="background: var(--${category.color}); color: white">
                        ${svgIcon(category.icon, 18)}
                      </div>

                      <div class="bill-info">
                        <div class="bill-name">${escapeHtml(bill.name)}</div>
                        <div class="bill-meta" style="color: ${color}">${dateLabel}</div>
                      </div>

                      <div class="bill-amount">${formatCurrency(bill.amount)}</div>
                    </button>
                  `;
                }).join('')}
              </div>`
            : `<div class="empty-state">
                <div class="empty-state-icon">${svgIcon('checkCircle', 44)}</div>
                <div class="empty-state-title">No ${title.toLowerCase()} bills</div>
                <div class="empty-state-text">There is nothing to show for this month.</div>
              </div>`
        }
      </div>
    </div>
  `;

  document.body.appendChild(container);

  requestAnimationFrame(() => {
    document.getElementById('dashboardStatusOverlay')?.classList.add('show');
    document.getElementById('dashboardStatusSheet')?.classList.add('show');
  });
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

function renderInsights() {
  const bills = Store.getBills();
  const payments = Store.getPayments();
    const totalMonthlyIncome = getTotalMonthlyIncomeEstimate();

  const monthlyIncomeSources = Store.getIncomeSources().filter(
    source => source.frequency !== 'Manual / irregular'
  );
  const recentPayments = payments
  .map(payment => ({
    ...payment,
    bill: Store.getBill(payment.billId),
  }))
  .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
  .slice(0, 5);
  const now = new Date();
  const today = new Date();
const currentCycle = today.getDate() <= 15 ? 'first' : 'second';

const currentCycleLabel = currentCycle === 'first'
  ? 'Early Cycle'
  : 'Late Cycle';

const cycleBills = bills.filter(bill => {
  const dueDate = new Date(bill.dueDate);

  if (
    dueDate.getMonth() !== today.getMonth() ||
    dueDate.getFullYear() !== today.getFullYear()
  ) {
    return false;
  }

  const billCycle = bill.payCycle ||
    (dueDate.getDate() <= 15 ? 'first' : 'second');

  return billCycle === currentCycle;
});

const scheduledThisCycle = cycleBills.reduce(
  (total, bill) => total + (parseFloat(bill.amount) || 0),
  0
);

const estimatedIncomeThisCycle =
  getTotalIncomeForPayCycle(currentCycle);

const estimatedLeftThisCycle =
  estimatedIncomeThisCycle - scheduledThisCycle;

const cycleCoveragePercent = estimatedIncomeThisCycle > 0
  ? Math.min(
      (scheduledThisCycle / estimatedIncomeThisCycle) * 100,
      100
    )
  : 0;

const incomeCoversCycleBills =
  estimatedIncomeThisCycle >= scheduledThisCycle;
  // This month payments
  const monthPayments = payments.filter(p => isSameMonth(p.paidDate));
  const totalPaid = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const monthlyLimit = getMonthlySpendingLimit();
const remainingLimit = Math.max(monthlyLimit - totalPaid, 0);
const limitPercent = monthlyLimit > 0
  ? Math.min((totalPaid / monthlyLimit) * 100, 100)
  : 0;

const isOverLimit = monthlyLimit > 0 && totalPaid > monthlyLimit;

  // Unpaid
  const unpaid = bills.filter(b => getBillStatus(b) !== 'paid');
  const totalDue = unpaid.reduce((sum, b) => sum + parseFloat(b.amount), 0);

  // Spending by category
  const catTotals = {};
  monthPayments.forEach(p => {
    const bill = Store.getBill(p.billId);
    const cat = bill ? bill.category : 'other';
    catTotals[cat] = (catTotals[cat] || 0) + parseFloat(p.amount);
  });
  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries.length > 0 ? catEntries[0][1] : 1;

  // Monthly spending (6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthPayments = payments.filter(p => {
      const pd = new Date(p.paidDate);
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
    });
    monthlyData.push({
      label: formatDate(d.toISOString(), 'monthShort'),
      amount: monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    });
  }

   const maxMonthly = Math.max(...monthlyData.map(m => m.amount), 1);

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <div class="nav-title">Insights</div>
      </div>
    </div>
    <div class="main-content fade-in">
      <div class="content-pad content-gap">
        <div class="stat-row">
  <div class="stat-card">
    <div class="stat-value text-paid">
      ${formatCurrency(totalMonthlyIncome)}
    </div>
    <div class="stat-label">Est. Monthly Income</div>
  </div>

  <div class="stat-card">
    <div class="stat-value text-upcoming">
      ${formatCurrency(totalDue)}
    </div>
    <div class="stat-label">Still Due</div>
  </div>
</div>

 <div class="settings-footer" style="padding-top:0">
  ${
    monthlyIncomeSources.length
      ? `Based on ${monthlyIncomeSources.length} recurring income source${
          monthlyIncomeSources.length === 1 ? '' : 's'
        }.`
      : 'Add an income source in Settings to estimate monthly income.'
  }
</div> 
        <div>
      
<div>
  <div class="section-header">
    Bill Schedule · ${currentCycleLabel}
  </div>

  <button
  class="card card-pad"
  onclick="openCycleBillsSheet('${currentCycle}', '${currentCycleLabel}')"
  style="width:100%;text-align:left;cursor:pointer"
>
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:var(--space-3)">
      <div>
        <div style="font-size:var(--text-sm);color:var(--text-muted)">
          Bills in this cycle
        </div>

        <div style="font-size:var(--text-xl);font-weight:800;margin-top:4px">
          ${formatCurrency(scheduledThisCycle)}
        </div>
      </div>

      <div style="text-align:right">
        <div style="font-size:var(--text-sm);color:var(--text-muted)">
          Estimated left
        </div>

        <div style="
          font-size:var(--text-xl);
          font-weight:800;
          margin-top:4px;
          color:${incomeCoversCycleBills ? 'var(--paid)' : 'var(--overdue)'}
        ">
          ${formatCurrency(estimatedLeftThisCycle)}
        </div>
      </div>
    </div>

    <div class="dashboard-progress-track" style="margin-top:var(--space-3)">
      <div
        class="dashboard-progress-fill"
        style="
          width:${cycleCoveragePercent}%;
          background:${incomeCoversCycleBills ? 'var(--accent)' : 'var(--overdue)'}
        "
      ></div>
    </div>

    <div style="
      display:flex;
      justify-content:space-between;
      margin-top:8px;
      font-size:var(--text-xs);
      color:var(--text-muted)
    ">
      <span>
        ${incomeCoversCycleBills
          ? 'Estimated income covers cycle bills'
          : 'Cycle bills exceed estimated income'}
      </span>

      <span>
  View ${cycleBills.length}
  ${cycleBills.length === 1 ? 'bill' : 'bills'}
  ${svgIcon('chevronRight', 14)}
</span>
    </div>
  </button>
</div>
    <button
      class="dashboard-see-all"
      onclick="editMonthlySpendingLimit()"
    >
      ${monthlyLimit > 0 ? 'Edit' : 'Set limit'}
    </button>
  </div>

  ${monthlyLimit > 0 ? `
    <div class="card card-pad">
      <div style="display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2);">
        <div style="font-size: var(--text-lg); font-weight: 800;">
          ${formatCurrency(totalPaid)}
          <span style="font-size: var(--text-sm); color: var(--text-muted); font-weight: 500;">
            of ${formatCurrency(monthlyLimit)}
          </span>
        </div>

        <div style="font-size: var(--text-sm); color: ${isOverLimit ? 'var(--overdue)' : 'var(--text-muted)'}; font-weight: 700;">
          ${isOverLimit
            ? `${formatCurrency(totalPaid - monthlyLimit)} over`
            : `${formatCurrency(remainingLimit)} left`}
        </div>
      </div>

      <div class="dashboard-progress-track" style="margin-top: var(--space-3);">
        <div
          class="dashboard-progress-fill"
          style="width: ${limitPercent}%; background: ${isOverLimit ? 'var(--overdue)' : 'var(--accent)'};"
        ></div>
      </div>
    </div>
  ` : `
    <button
      class="card card-pad"
      onclick="editMonthlySpendingLimit()"
      style="width: 100%; text-align: left; cursor: pointer;"
    >
      <div style="font-weight: 700;">Set a monthly spending limit</div>
      <div style="font-size: var(--text-sm); color: var(--text-muted); margin-top: 4px;">
        Track your monthly payments against one target.
      </div>
    </button>
  `}
</div>
        <div>
          <div class="section-header">Spending by Category</div>
          <div class="card card-pad">
            ${catEntries.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('pieChart', 40)}</div>
                <div class="empty-state-text">No payments this month yet.</div>
              </div>
            ` : catEntries.map(([catId, total]) => {
              const cat = getCategory(catId);
              return `
                <div class="h-chart-row">
                  <div class="h-chart-label">${svgIcon(cat.icon, 14)} ${cat.label}</div>
                  <div class="h-chart-bar-bg">
                    <div class="h-chart-bar-fill" style="width:${(total/maxCat*100)}%;background:var(--${cat.color})"></div>
                  </div>
                  <div class="h-chart-value">${formatCurrency(total)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div>
          <div class="section-header">Monthly Spending (6 Months)</div>
          <div class="card card-pad">
            ${monthlyData.every(m => m.amount === 0) ? `
              <div class="empty-state">
                <div class="empty-state-icon">${svgIcon('trendUp', 40)}</div>
                <div class="empty-state-text">Your spending over time will appear here.</div>
              </div>
            ` : `
              <div class="chart-bar-container">
                ${monthlyData.map(m => `
                  <div class="chart-bar-item">
                    <div class="chart-bar-value">${m.amount > 0 ? formatCurrency(m.amount).replace(/\.\d+$/, '') : ''}</div>
                    <div class="chart-bar" style="height:${(m.amount/maxMonthly*100)}%;background:var(--accent)"></div>
                    <div class="chart-bar-label">${m.label}</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <div>
        
        </div>
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
            <div class="form-row" onclick="setTheme('dark')" style="cursor:pointer">
              <div class="form-label">Dark</div>
              <div style="flex:1"></div>
              ${(settings.theme === 'dark' || settings.theme === 'system') ? svgIcon('check', 20) : ''}
            </div>
            <div class="form-row" onclick="setTheme('light')" style="cursor:pointer">
              <div class="form-label">Light</div>
              <div style="flex:1"></div>
              ${settings.theme === 'light' ? svgIcon('check', 20) : ''}
            </div>
          </div>
          <div class="settings-footer">Dark mode is recommended for the best experience.</div>
        </div>

        <div class="settings-section">
  <div class="section-header">Income Sources</div>

  <div class="card">
    ${Store.getIncomeSources().length
      ? Store.getIncomeSources().map(source => `
        <div
          class="form-row"
          onclick="openIncomeSourceForm('${source.id}')"
          style="cursor: pointer;"
        >
          <div>
            <div class="form-label">${escapeHtml(source.name)}</div>

            <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 3px;">
              ${escapeHtml(source.frequency)} · Next: ${formatDate(source.nextPayDate, 'short')}
            </div>
          </div>

          <div style="margin-left: auto; text-align: right;">
            <div style="font-weight: 800;">
              ${formatCurrency(source.expectedAmount)}
            </div>

            <div style="font-size: var(--text-xs); color: var(--text-muted);">
              expected pay
            </div>
          </div>
        </div>
      `).join('')
      : `
        <div class="card-pad" style="font-size: var(--text-sm); color: var(--text-muted);">
          Add an income source to plan future paychecks and fund bills.
        </div>
      `
    }
  </div>

  <button
    class="btn-secondary"
    style="width: 100%; margin-top: var(--space-3);"
    onclick="openIncomeSourceForm()">
       Add Income Source
   </button>
</div>

        <div class="settings-section">
          <div class="section-header">Data</div>

          <div class="card">
            <div class="form-row">
              <div class="form-label">${svgIcon('internaldrive', 18)}</div>
              <div style="flex:1;color:var(--text-muted)">
                ${billCount} bill${billCount === 1 ? '' : 's'} stored on device
              </div>
            </div>

            <div class="form-row" onclick="exportCSV()" style="cursor:pointer">
              <div class="form-label">${svgIcon('export', 18)}</div>
              <div style="flex:1;color:var(--accent)">Export Bills CSV</div>
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
              <span class="about-value">1.0.0</span>
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
            <p style="font-size:var(--text-sm);color:var(--text-muted);line-height:1.5">
              To install this app on your iPhone home screen:
            </p>

            <ol style="font-size:var(--text-sm);color:var(--text-muted);line-height:1.7;padding-left:var(--space-5);margin-top:var(--space-2)">
              <li>Tap the <strong>Share</strong> button in Safari</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong></li>
            </ol>

            <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-3)">
              The app will work offline after installation. No internet needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBillDetail() {
  const bill = Store.getBill(routeParams.id);
  if (!bill) {
    navigate('bills');
    return '';
  }

  const status = getBillStatus(bill);
  const cat = getCategory(bill.category);
  const payments = Store.getPaymentsForBill(bill.id);

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <button class="nav-button" onclick="navigate('bills')">${svgIcon('chevronLeft', 22)} Bills</button>
        <button class="nav-button" onclick="openBillForm('${bill.id}')">Edit</button>
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
    background:${getBillBrand(bill.name) ? 'white' : `var(--${cat.color})`};
    color:${getBillBrand(bill.name) ? '#1e1e2e' : 'white'};
  "
>
  ${billVisual(bill, 46)}
</div>
          <div class="detail-amount">${formatCurrency(bill.amount)}</div>
          <div class="detail-status">
            <span class="status-pill" style="background:var(--${status === 'paid' ? 'paid-bg' : status === 'overdue' ? 'overdue-bg' : 'upcoming-bg'});color:var(--${status === 'paid' ? 'paid' : status === 'overdue' ? 'overdue' : 'upcoming'})">
              ${status === 'paid' ? svgIcon('checkCircle', 12) : status === 'overdue' ? svgIcon('warning', 12) : svgIcon('clock', 12)}
              ${status === 'paid' ? 'Paid' : relativeDue(bill.dueDate).charAt(0).toUpperCase() + relativeDue(bill.dueDate).slice(1)}
            </span>
          </div>
        </div>

        <div>
        ${safePaymentUrl(bill.paymentUrl) ? `
  <button
    class="btn-primary"
    style="width:100%; margin-top:var(--space-4);"
    onclick="openPaymentPage('${bill.id}')"
  >
    Pay ${escapeHtml(bill.name)}
  </button>
` : `
  <button
    class="btn-secondary"
    style="width:100%; margin-top:var(--space-4);"
    onclick="openBillForm('${bill.id}')"
  >
    Add payment link
  </button>
`}
          <div class="section-header">Details</div>
          <div class="card">
            ${detailRow('Due Date', formatDate(bill.dueDate, 'full'))}
            ${detailRow('Pay Cycle', getPayCycleLabel(bill))}
            ${detailRow('Category', cat.label)}
            ${detailRow('Repeats', bill.recurrence)}
            ${bill.paymentMethod ? detailRow('Payment Method', bill.paymentMethod) : ''}
            ${detailRow('Autopay', bill.autopay ? 'On' : 'Off')}
            ${bill.notes ? detailRow('Notes', bill.notes) : ''}
          </div>
        </div>

        ${payments.length > 0 ? `
          <div>
            <div class="section-header">Payment History</div>
            <div class="card">
              ${payments.map(p => `
                <div class="bill-row">
                  ${svgIcon('checkCircle', 20)}
                  <div class="bill-info">
                    <div class="bill-name">${formatDate(p.paidDate, 'full')}</div>
                  </div>
                  <div class="bill-amount text-paid">${formatCurrency(p.amount)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
              
        ${status !== 'paid' ? `
          <button class="btn-primary" onclick="confirmMarkPaid('${bill.id}')">
            ${svgIcon('checkCircle', 22)}
            Mark as Paid
          </button>
        ` : ''}

        <button class="btn-danger" onclick="confirmDeleteBill('${bill.id}')">
          ${svgIcon('trash', 16)} Archive Bill
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

function billRow(bill, clickable = false) {
  const cat = getCategory(bill.category);
  const status = getBillStatus(bill);

  const statusColor =
    status === 'paid'
      ? 'paid'
      : status === 'overdue'
        ? 'overdue'
        : 'upcoming';

  const meta = `${formatDate(bill.dueDate)} · ${
    bill.recurrence === 'None' ? 'One-time' : bill.recurrence
  } · ${relativeDue(bill.dueDate)}`;

  const payCycleLabel = getPayCycleLabel(bill);

  return `
    <div
      class="bill-row"
      ${
        clickable
          ? `onclick="navigate('detail', {id: '${bill.id}'})"`
          : ''
      }
    >
      <div
  class="bill-icon"
  style="
    background:${getBillBrand(bill.name) ? 'white' : `var(--${cat.color})`};
    color:${getBillBrand(bill.name) ? '#1e1e2e' : 'white'};
    padding:${getBillBrand(bill.name) ? '3px' : '0'};
    overflow:hidden;
  "
>
  ${billVisual(bill, 32)}
</div>

      <div class="bill-info">
        <div class="bill-name">${escapeHtml(bill.name)}</div>

        <div class="bill-meta-row">
          <div class="bill-meta text-${statusColor}">
            ${meta}
          </div>

          <span class="pay-cycle-pill ${
  bill.payCycle === 'first' ||
  (!bill.payCycle && new Date(bill.dueDate).getDate() <= 15)
    ? 'pay-cycle-first'
    : 'pay-cycle-second'
}">
  ${payCycleLabel}
</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div class="bill-amount">${formatCurrency(bill.amount)}</div>
        <div
          class="bill-status-dot"
          style="background:var(--${statusColor})"
        ></div>
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
    { id: 'bills', label: 'Recurring', icon: 'tray' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
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
    <div class="sheet-overlay" id="addMenuOverlay" onclick="closeAddMenu()"></div>
    <div class="sheet" id="addMenuSheet">
      <div class="sheet-handle"></div>
      <div class="sheet-nav">
        <button class="nav-button" onclick="closeAddMenu()">Cancel</button>
        <div class="sheet-title">Add Recurring</div>
        <div style="width: 54px"></div>
      </div>

      <div style="padding: var(--space-4)">
        <div class="settings-footer" style="padding: 0 0 var(--space-4)">
          Choose what you want to track.
        </div>

        <button class="btn-primary" onclick="closeAddMenu(); openBillForm()">
          ${svgIcon('plus', 20)}
          Add bill
        </button>

        <button class="btn-secondary" style="margin-top: var(--space-3)" onclick="closeAddMenu(); openInstallmentPlanForm()">
          ${svgIcon('calendar', 20)}
          Add payment plan
        </button>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.id = 'addMenuContainer';
  container.innerHTML = menuHtml;
  document.body.appendChild(container);

  requestAnimationFrame(() => {
    document.getElementById('addMenuOverlay').classList.add('show');
    document.getElementById('addMenuSheet').classList.add('show');
  });
}

function closeAddMenu() {
  const overlay = document.getElementById('addMenuOverlay');
  const sheet = document.getElementById('addMenuSheet');

  if (overlay) overlay.classList.remove('show');
  if (sheet) sheet.classList.remove('show');

  setTimeout(() => {
    document.getElementById('addMenuContainer')?.remove();
  }, 300);
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

      <div style="padding:var(--space-4)">
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
          class="btn-secondary"
          style="margin-top:var(--space-3)"
          onclick="closeCalendarAddMenu(); openInstallmentPlanForm()"
        >
          ${svgIcon('calendar', 20)}
          Add payment plan
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

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
      class="sheet-overlay"
      id="incomeSourceOverlay"
      onclick="closeIncomeSourceForm()"
    ></div>

    <div class="sheet" id="incomeSourceSheet">
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

      <div style="padding: var(--space-4);" class="content-gap">
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

  requestAnimationFrame(() => {
    document.getElementById('incomeSourceOverlay')?.classList.add('show');
    document.getElementById('incomeSourceSheet')?.classList.add('show');
  });
}

function closeIncomeSourceForm() {
  document.getElementById('incomeSourceOverlay')?.classList.remove('show');
  document.getElementById('incomeSourceSheet')?.classList.remove('show');

  setTimeout(() => {
    document.getElementById('incomeSourceContainer')?.remove();
  }, 300);

  editingIncomeSourceId = null;
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
  const selectedReminders = bill ? (bill.reminderOffsets || [7, 1]) : [7, 1];

  const sheetHtml = `
    <div class="sheet-overlay" id="sheetOverlay" onclick="closeBillForm()"></div>
    <div class="sheet" id="billSheet">
      <div class="sheet-handle"></div>
      <div class="sheet-nav">
        <button class="nav-button" onclick="closeBillForm()">Cancel</button>
        <div class="sheet-title">${bill ? 'Edit Bill' : 'New Bill'}</div>
        <button class="nav-button" onclick="saveBill()" style="font-weight:700">Save</button>
      </div>
      <div style="padding:var(--space-4)">
        <div class="content-gap">
          <div>
            <div class="section-header">Bill Details</div>
            <div class="card">
              <div class="form-row">
                <div class="form-label">Name</div>
                <input class="form-input" id="billName" type="text" placeholder="Electricity" value="${bill ? escapeHtml(bill.name) : ''}" style="text-align:left">
              </div>
              <div class="form-row">
                <div class="form-label">Amount</div>
                <input class="form-input" id="billAmount" type="number" step="0.01" placeholder="0.00" value="${bill ? bill.amount : ''}">
              </div>
            </div>
          </div>

          <div>
            <div class="section-header">Category</div>
            <div class="card">
              <select class="form-select" id="billCategory" style="width:100%;height:48px;padding:0 var(--space-4);border:none;background:transparent;font-size:var(--text-base);-webkit-appearance:none">
                ${CATEGORIES.map(c => `<option value="${c.id}" ${bill && bill.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <div>
            <div class="section-header">Due Date & Recurrence</div>
            <div class="card">
              <div class="form-row">
                <div class="form-label">Due Date</div>
                <input class="form-input" id="billDueDate" type="date" value="${dueDate}">
              </div>
              <div class="form-row">
                <div class="form-label">Repeats</div>
                <div class="form-row">
  <div class="form-label">Pay Cycle</div>

  <select class="form-select" id="billPayCycle">
    <option value="first" ${defaultPayCycle === 'first' ? 'selected' : ''}>
      Early Cycle
    </option>

    <option value="second" ${defaultPayCycle === 'second' ? 'selected' : ''}>
      Late Cycle
    </option>
  </select>
</div>
                <select class="form-select" id="billRecurrence">
                  ${RECURRENCE.map(r => `<option value="${r}" ${bill && bill.recurrence === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div class="section-header">Payment Method</div>
            <div class="card">
              <select class="form-select" id="billPaymentMethod" style="width:100%;height:48px;padding:0 var(--space-4);border:none;background:transparent;font-size:var(--text-base);-webkit-appearance:none">
                ${PAYMENT_METHODS.map(m => `<option value="${m}" ${bill && bill.paymentMethod === m ? 'selected' : ''}>${m || 'None'}</option>`).join('')}
              </select>
            </div>
          </div>
    <div class="section-header">Payment Link</div>

<div class="card">
  <div class="form-row">
    <div class="form-label">Website</div>

    <input
      class="form-input"
      id="PaymentUrl"
      type="url"
      placeholder="provider.com/pay"
      value="${bill ? escapeHtml(bill.paymentUrl || '') : ''}"
      style="text-align: left;"
    />
  </div>
</div>
          <div>
            <div class="section-header">Autopay</div>
<div class="card">
  <div class="form-row">
    <div class="form-label">Pay automatically</div>
    <div style="flex: 1;"></div>
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
  Autopay bills are paid automatically by your bank or card. You will still receive a reminder before the payment date.
</div>
            <div class="section-header">Reminders</div>
            <div class="card">
              ${REMINDER_OFFSETS.map(r => `
                <div class="form-row">
                  <div class="form-label">${r.label}</div>
                  <div style="flex:1"></div>
                  <label class="toggle">
                    <input type="checkbox" class="reminder-toggle" data-days="${r.days}" ${selectedReminders.includes(r.days) ? 'checked' : ''}>
                    <div class="toggle-track"><div class="toggle-thumb"></div></div>
                  </label>
                </div>
              `).join('')}
            </div>
            <div class="settings-footer">Reminders appear when you open the app. Enable notifications in Safari for best results.</div>
          </div>
                
          <div>
            <div class="section-header">Notes</div>
            <div class="card">
              <textarea class="form-textarea" id="billNotes" placeholder="Optional notes">${bill ? escapeHtml(bill.notes || '') : ''}</textarea>
            </div>
          </div>

          ${bill ? `
            <button class="btn-danger" onclick="confirmDeleteBill('${bill.id}', true)">
              ${svgIcon('trash', 16)} Archive Bill
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Append sheet to body
  const sheetContainer = document.createElement('div');
  sheetContainer.id = 'sheetContainer';
  sheetContainer.innerHTML = sheetHtml;
  document.body.appendChild(sheetContainer);

  // Animate in
  requestAnimationFrame(() => {
    document.getElementById('sheetOverlay').classList.add('show');
    document.getElementById('billSheet').classList.add('show');
  });
}

function closeBillForm() {
  const overlay = document.getElementById('sheetOverlay');
  const sheet = document.getElementById('billSheet');
  if (overlay) overlay.classList.remove('show');
  if (sheet) sheet.classList.remove('show');
  setTimeout(() => {
    const container = document.getElementById('sheetContainer');
    if (container) container.remove();
  }, 300);
  editingBillId = null;
}


function saveBill() {
  const name = document.getElementById('billName').value.trim();
  const amount = parseFloat(document.getElementById('billAmount').value) || 0;

  if (!name) {
  alert('Please enter a bill name');
  return;
}

const paymentUrlInput = document.getElementById('paymentUrl');
let paymentUrl = paymentUrlInput ? paymentUrlInput.value.trim() : '';

if (paymentUrl) {
  if (!/^https?:\/\//i.test(paymentUrl)) {
    paymentUrl = `https://${paymentUrl}`;
  }

  try {
    const url = new URL(paymentUrl);

    if (url.protocol !== 'https:') {
      throw new Error('Payment link must use HTTPS');
    }

    paymentUrl = url.href;
  } catch {
    alert('Please enter a valid payment website, for example: verizon.com');
    return;
  }
}

const data = {
    name,
    amount: amount.toString(),
    dueDate: new Date(document.getElementById('billDueDate').value).toISOString(),
    category: document.getElementById('billCategory').value,
    recurrence: document.getElementById('billRecurrence').value,
    payCycle: document.getElementById('billPayCycle').value,
    paymentMethod: document.getElementById('billPaymentMethod').value,
    paymentUrl: document.getElementById('billPaymentUrl').value.trim(),
    autopay: document.getElementById('billAutopay').checked,
    notes: document.getElementById('billNotes').value.trim(),
    reminderOffsets: Array.from(document.querySelectorAll('.reminder-toggle:checked')).map(cb => parseInt(cb.dataset.days)),
  };

  if (editingBillId) {
    Store.updateBill(editingBillId, data);
  } else {
    Store.addBill({
      id: uid(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  const app = document.getElementById('app');

  let content = '';
  switch (currentRoute) {
    case 'today': content = renderToday(); break;
    case 'bills': content = renderBills(); break;
    case 'calendar': content = renderCalendar(); break;
    case 'insights': content = renderInsights(); break;
    case 'settings': content = renderSettings(); break;
    case 'detail': content = renderBillDetail(); break;
    default: content = renderToday();
  }

  // Add tab bar for main views
  const showTabBar = ['today', 'bills', 'calendar', 'insights', 'settings'].includes(currentRoute);
  if (showTabBar) {
    content += tabBar();
  }

  app.innerHTML = content;
}

// ====================================
// INIT
// ====================================

function init() {
  initTheme();

  // Add sample data on first load
  const bills = Store.getBills();
  if (bills.length === 0 && !localStorage.getItem('initialized')) {
    const now = new Date();
    const sampleBills = [
      {
        id: uid(), name: 'Rent', amount: '1250',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 12).toISOString(),
        category: 'housing', recurrence: 'Monthly', paymentMethod: 'Bank Transfer',
        notes: '', reminderOffsets: [7, 1],
        createdAt: now.toISOString(), updatedAt: now.toISOString(),
      },
      {
        id: uid(), name: 'Electricity', amount: '86',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
        category: 'utilities', recurrence: 'Monthly', paymentMethod: '',
        notes: 'Account ending in 0421', reminderOffsets: [7, 1],
        createdAt: now.toISOString(), updatedAt: now.toISOString(),
      },
      {
        id: uid(), name: 'Internet', amount: '65',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
        category: 'internet', recurrence: 'Monthly', paymentMethod: 'Credit Card',
        notes: '', reminderOffsets: [7, 3],
        createdAt: now.toISOString(), updatedAt: now.toISOString(),
      },
      {
        id: uid(), name: 'Netflix', amount: '15.49',
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
        category: 'subscriptions', recurrence: 'Monthly', paymentMethod: 'Credit Card',
        notes: '', reminderOffsets: [7, 1],
        createdAt: now.toISOString(), updatedAt: now.toISOString(),
      },
    ];

    // Mark Netflix as paid
    Store.saveBills(sampleBills);
    Store.addPayment({
      id: uid(),
      billId: sampleBills[3].id,
      paidDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      amount: '15.49',
    });

    localStorage.setItem('initialized', 'true');
  }

  render();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);

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

  container.appendChild(section);
  loadUpcomingReminders();
}

const renderWithUpcomingReminders = render;

render = function () {
  renderWithUpcomingReminders();
  addUpcomingReminderSettings();
};



/* ============================================
   Drag Back With Previous Page Preview
============================================ */

const billTrackerNavigationHistory = [];
let isBillTrackerGoingBack = false;

const originalNavigateForSwipeBack = navigate;

navigate = function (route, params = {}) {
  const isDifferentPage =
    route !== currentRoute ||
    JSON.stringify(params) !== JSON.stringify(routeParams);

  if (!isBillTrackerGoingBack && isDifferentPage && currentRoute) {
    const app = document.getElementById("app");

    billTrackerNavigationHistory.push({
      route: currentRoute,
      params: { ...routeParams },
      html: app ? app.innerHTML : "",
    });
  }

  originalNavigateForSwipeBack(route, params);
};

function goBackWithDrag() {
  const previousPage = billTrackerNavigationHistory.pop();

  if (!previousPage) {
    return;
  }

  isBillTrackerGoingBack = true;

originalNavigateForSwipeBack(previousPage.route, previousPage.params);

requestAnimationFrame(() => {
  if (typeof addHistoryButton === "function") {
    addHistoryButton(true);
  }
});
isBillTrackerGoingBack = false;
}

let dragStartPoint = null;
let isDraggingBack = false;
let previousPagePreview = null;

function getAppElement() {
  return document.getElementById("app");
}

function showPreviousPagePreview() {
  const previousPage =
    billTrackerNavigationHistory[billTrackerNavigationHistory.length - 1];

  const app = getAppElement();

  if (!previousPage || !app || previousPagePreview) {
    return;
  }

  previousPagePreview = document.createElement("div");
  previousPagePreview.id = "swipeBackPreview";

  previousPagePreview.style.position = "fixed";
  previousPagePreview.style.inset = "0";
  previousPagePreview.style.zIndex = "1";
  previousPagePreview.style.overflow = "hidden";
  previousPagePreview.style.background = "var(--bg, #000)";
  previousPagePreview.style.transform = "translateX(-32px)";
  previousPagePreview.style.filter = "brightness(0.72)";
  previousPagePreview.style.willChange = "transform, filter";

  previousPagePreview.innerHTML = previousPage.html;

  document.body.insertBefore(previousPagePreview, app);

  app.style.position = "relative";
  app.style.zIndex = "2";
  app.style.background = "var(--bg, #000)";
  app.style.willChange = "transform";
}

function removePreviousPagePreview() {
  const app = getAppElement();

  if (previousPagePreview) {
    previousPagePreview.remove();
    previousPagePreview = null;
  }

  if (app) {
    app.style.position = "";
    app.style.zIndex = "";
    app.style.background = "";
    app.style.transform = "";
    app.style.transition = "";
    app.style.willChange = "";
  }
}

document.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) {
      dragStartPoint = null;
      return;
    }

    const target = event.target;

    if (
      target.closest(
        "input, textarea, select, .sheet, .sheet-overlay, .toggle"
      )
    ) {
      dragStartPoint = null;
      return;
    }

    const touch = event.touches[0];

    if (touch.clientX > 40 || billTrackerNavigationHistory.length === 0) {
      dragStartPoint = null;
      return;
    }

    dragStartPoint = {
      x: touch.clientX,
      y: touch.clientY,
    };

    isDraggingBack = false;
    showPreviousPagePreview();
  },
  { passive: true }
);

document.addEventListener(
  "touchmove",
  (event) => {
            
    if (!dragStartPoint || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const distanceX = touch.clientX - dragStartPoint.x;
    const distanceY = Math.abs(touch.clientY - dragStartPoint.y);

    if (distanceY > 70 || distanceX < 0) {
      return;
    }

    const app = getAppElement();

    if (!app) {
      return;
    }

    isDraggingBack = true;

    const dragDistance = Math.min(distanceX, window.innerWidth);
    const progress = Math.min(dragDistance / window.innerWidth, 1);

    app.style.transition = "none";
    app.style.transform = `translateX(${dragDistance}px)`;

    if (previousPagePreview) {
      const previewOffset = -32 + progress * 32;
      const brightness = 0.72 + progress * 0.28;

      previousPagePreview.style.transition = "none";
      previousPagePreview.style.transform = `translateX(${previewOffset}px)`;
      previousPagePreview.style.filter = `brightness(${brightness})`;
    }
  },
  { passive: true }
);

document.addEventListener(
  "touchend",
  (event) => {
    if (!dragStartPoint || event.changedTouches.length !== 1) {
      dragStartPoint = null;
      removePreviousPagePreview();
      return;
    }

    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - dragStartPoint.x;
    const distanceY = Math.abs(touch.clientY - dragStartPoint.y);

    const app = getAppElement();

    const shouldGoBack =
      isDraggingBack &&
      distanceX >= 90 &&
      distanceY <= 70;

    if (!app) {
      dragStartPoint = null;
      isDraggingBack = false;
      removePreviousPagePreview();
      return;
    }

    app.style.transition = "transform 180ms ease-out";

    if (previousPagePreview) {
      previousPagePreview.style.transition =
        "transform 180ms ease-out, filter 180ms ease-out";
    }

    if (shouldGoBack) {
      app.style.transform = "translateX(100%)";

      if (previousPagePreview) {
        previousPagePreview.style.transform = "translateX(0)";
        previousPagePreview.style.filter = "brightness(1)";
      }

      setTimeout(() => {
        goBackWithDrag();
        removePreviousPagePreview();
      }, 180);
    } else {
      app.style.transform = "translateX(0)";

      if (previousPagePreview) {
        previousPagePreview.style.transform = "translateX(-32px)";
        previousPagePreview.style.filter = "brightness(0.72)";
      }

      setTimeout(() => {
        removePreviousPagePreview();
      }, 180);
    }

    dragStartPoint = null;
    isDraggingBack = false;
  },
  { passive: true }
);

document.addEventListener(
  "touchcancel",
  () => {
    const app = getAppElement();

    if (app) {
      app.style.transition = "transform 180ms ease-out";
      app.style.transform = "translateX(0)";
    }

    if (previousPagePreview) {
      previousPagePreview.style.transition =
        "transform 180ms ease-out, filter 180ms ease-out";
      previousPagePreview.style.transform = "translateX(-32px)";
      previousPagePreview.style.filter = "brightness(0.72)";
    }

    setTimeout(() => {
      removePreviousPagePreview();
    }, 180);

    dragStartPoint = null;
    isDraggingBack = false;
  },
  { passive: true }
);

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
    .map((payment) => ({
      ...payment,
      bill: allBills.find((bill) => bill.id === payment.billId),
    }))
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));

  return `
    <div class="nav-bar">
      <div class="nav-bar-content">
        <button class="nav-button" onclick="navigate('bills')">
          ${svgIcon("chevronLeft", 22)} Bills
        </button>
        <div class="nav-title">Payment History</div>
        <div style="width: 54px;"></div>
      </div>
    </div>

    <div class="main-content fade-in">
      <div class="content-pad content-gap">
        ${
          payments.length
            ? `
              <div class="section-header">All Payments</div>
              <div class="card">
                ${payments
                  .map(
                    (payment) => `
                      <div class="bill-row">
                        <div class="bill-icon" style="background: var(--paid-bg); color: var(--paid);">
                          ${svgIcon("checkCircle", 18)}
                        </div>

                        <div class="bill-info">
                          <div class="bill-name">
                            ${escapeHtml(
                              payment.bill ? payment.bill.name : "Archived bill"
                            )}
                          </div>
                          <div class="bill-meta">
                            ${formatDate(payment.paidDate, "full")}
                            ${
                              payment.bill?.autopay
                                ? " · Autopay"
                                : ""
                            }
                          </div>
                        </div>

                        <div class="bill-amount text-paid">
                          ${formatCurrency(payment.amount)}
                        </div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            `
            : `
              <div class="empty-state">
                <div class="empty-state-icon">
                  ${svgIcon("tray", 48)}
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
  const overlay = document.getElementById("installmentPlanOverlay");
  const sheet = document.getElementById("installmentPlanSheet");

  if (overlay) {
    overlay.classList.remove("show");
  }

  if (sheet) {
    sheet.classList.remove("show");
  }

  setTimeout(() => {
    document.getElementById("installmentPlanContainer")?.remove();
  }, 300);
}

function updateInstallmentFirstPaymentLabel() {
  const status = document.getElementById("installmentFirstPaymentStatus");
  const label = document.getElementById("installmentFirstPaymentDateLabel");

  if (!status || !label) {
    return;
  }

  label.textContent =
    status.value === "paid"
      ? "Date Paid"
      : "First Due Date";
}

function openInstallmentPlanForm() {
  const today = new Date().toISOString().split("T")[0];

  const container = document.createElement("div");
  container.id = "installmentPlanContainer";

  container.innerHTML = `
    <div
      class="sheet-overlay"
      id="installmentPlanOverlay"
      onclick="closeInstallmentPlanForm()"
    ></div>

    <div class="sheet" id="installmentPlanSheet">
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
                  Not paid — first payment is scheduled
                </option>
                <option value="paid">
                  Already paid at checkout
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

  requestAnimationFrame(() => {
    document.getElementById("installmentPlanOverlay")?.classList.add("show");
    document.getElementById("installmentPlanSheet")?.classList.add("show");
  });
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

    const billName = store
      ? `${provider} — ${store} — Payment ${paymentNumber} of ${paymentCount}`
      : `${provider} — Payment ${paymentNumber} of ${paymentCount}`;

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

    if (paymentNumber === 1 && firstPaymentStatus === "paid") {
      Store.addPayment({
        id: uid(),
        billId: bill.id,
        paidDate: paymentDate.toISOString(),
        amount: paymentAmount,
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

  requestAnimationFrame(() => {
    document
      .getElementById('notificationCenterOverlay')
      ?.classList.add('show');

    document
      .getElementById('notificationCenterSheet')
      ?.classList.add('show');
  });
};
    
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

