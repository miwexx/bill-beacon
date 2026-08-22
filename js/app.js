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
