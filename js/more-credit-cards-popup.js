(function () {
  'use strict';

  // Bill Beacon Manual Credit Card UI
  // First version: front-end only, using localStorage for persistence.
  // Does NOT write to household/shared Firestore records.

  var STORAGE_KEY = 'bbManualCards_v1';

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { cards: [], ledger: {} };
      }
      var parsed = JSON.parse(raw);
      if (!parsed.cards) parsed.cards = [];
      if (!parsed.ledger) parsed.ledger = {};
      return parsed;
    } catch (e) {
      console.error('Bill Beacon manual card: failed to load state', e);
      return { cards: [], ledger: {} };
    }
  }

  function saveState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Bill Beacon manual card: failed to save state', e);
    }
  }

  function createCardId() {
    return 'card-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function createLedgerEntryId() {
    return 'entry-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function formatMoney(value) {
    if (typeof value !== 'number' || isNaN(value)) return 'Not set';
    var fixed = value.toFixed(2);
    return '$' + fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatPercent(value) {
    if (typeof value !== 'number' || isNaN(value)) return 'Not set';
    return value.toFixed(2) + '%';
  }

  function formatDate(value) {
    if (!value) return 'Not set';
    try {
      var d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return d.toLocaleDateString();
    } catch (e) {
      return value;
    }
  }

  function todayLabel() {
    var d = new Date();
    return d.toLocaleDateString();
  }

  function displayName(card) {
    var base = (card.bank || '').trim();
    var last4 = (card.lastFour || '').trim();
    if (base && last4) {
      base += ' •••• ' + last4; // "•••• 1234" style
    }
    if (card.nickname) {
      base += ' — ' + card.nickname;
    }
    return base || 'My credit card';
  }

  function ensureLedger(state, cardId) {
    if (!state.ledger[cardId]) state.ledger[cardId] = [];
    return state.ledger[cardId];
  }

  function computeBalance(state, card) {
    var base = typeof card.currentBalance === 'number' ? card.currentBalance : 0;
    var entries = ensureLedger(state, card.id);
    var totalDelta = entries.reduce(function (sum, entry) {
      if (entry.reversed) return sum;
      var amt = typeof entry.amount === 'number' ? entry.amount : 0;
      switch (entry.type) {
        case 'purchase':
        case 'interest':
        case 'fee':
          return sum + amt;
        case 'payment':
        case 'refund':
        case 'adjustment':
          return sum + amt; // adjustment is signed
        default:
          return sum;
      }
    }, 0);
    return base + totalDelta;
  }

  // Simple fixed-APR payoff estimate: no new purchases.
  function computePayoff(card, modeledBalance, extraPayment) {
    var balance = typeof modeledBalance === 'number' ? modeledBalance : (typeof card.currentBalance === 'number' ? card.currentBalance : 0);
    var apr = typeof card.purchaseApr === 'number' ? card.purchaseApr : 0;
    var planned = typeof card.plannedPayment === 'number' ? card.plannedPayment : 0;

    var result = {
      months: null,
      payoffDate: null,
      totalInterest: null,
      tooLow: false,
      extraMonths: null,
      extraTotalInterest: null,
      extraTooLow: false
    };

    if (balance <= 0 || apr <= 0 || planned <= 0) {
      return result;
    }

    var monthlyRate = apr / 100 / 12;

    function simulate(payment) {
      var mBalance = balance;
      var months = 0;
      var totalInterest = 0;
      var maxMonths = 600; // safety cap ~50 years

      if (payment <= mBalance * monthlyRate) {
        return { tooLow: true, months: null, totalInterest: null };
      }

      while (mBalance > 0 && months < maxMonths) {
        var interest = mBalance * monthlyRate;
        totalInterest += interest;
        mBalance = mBalance + interest - payment;
        months++;
        if (mBalance < 0) {
          mBalance = 0;
        }
      }

      if (months >= maxMonths) {
        return { tooLow: true, months: null, totalInterest: null };
      }

      return { tooLow: false, months: months, totalInterest: totalInterest };
    }

    var baseScenario = simulate(planned);
    result.tooLow = baseScenario.tooLow;
    result.months = baseScenario.months;
    result.totalInterest = baseScenario.totalInterest;

    if (typeof extraPayment === 'number' && extraPayment > planned) {
      var extraScenario = simulate(extraPayment);
      result.extraTooLow = extraScenario.tooLow;
      result.extraMonths = extraScenario.months;
      result.extraTotalInterest = extraScenario.totalInterest;
    }

    if (result.months) {
      var d = new Date();
      d.setMonth(d.getMonth() + result.months);
      result.payoffDate = d;
    }

    return result;
  }

  function payoffSummaryHtml(card, state) {
    var modeledBalance = computeBalance(state, card);
    var extraPayment = card.extraPayment && typeof card.extraPayment === 'number' ? card.extraPayment : null;
    var payoff = computePayoff(card, modeledBalance, extraPayment);

    var parts = [];
    parts.push('<div class="bb-card-section">');
    parts.push('<div class="bb-card-section-title">Payoff estimate</div>');

    parts.push('<div class="bb-card-assumption">Assumes no new purchases and a fixed purchase APR.</div>');

    if (modeledBalance <= 0) {
      parts.push('<div class="bb-card-row">This card is paid off based on the tracked balance.</div>');
    } else if (!card.purchaseApr || !card.plannedPayment) {
      parts.push('<div class="bb-card-row">Add a purchase APR and a planned monthly payment to see a payoff estimate.</div>');
    } else if (payoff.tooLow) {
      parts.push('<div class="bb-card-row bb-card-warning">The modeled payment is too low to reduce this balance. Increase your payment to see an estimate.</div>');
    } else {
      parts.push('<div class="bb-card-row">Estimated payoff date <span class="bb-card-strong">' + formatDate(payoff.payoffDate) + '</span></div>');
      parts.push('<div class="bb-card-row">Estimated interest over payoff <span class="bb-card-strong">' + formatMoney(payoff.totalInterest) + '</span></div>');
    }

    if (extraPayment && !payoff.extraTooLow && payoff.extraMonths != null) {
      parts.push('<div class="bb-card-row">With an extra payment of <span class="bb-card-strong">' + formatMoney(extraPayment - card.plannedPayment) + '</span> per month:</div>');
      parts.push('<div class="bb-card-row">Estimated payoff date <span class="bb-card-strong">' + formatDate((function () {
        var d2 = new Date();
        d2.setMonth(d2.getMonth() + payoff.extraMonths);
        return d2;
      })()) + '</span>, estimated interest <span class="bb-card-strong">' + formatMoney(payoff.extraTotalInterest) + '</span></div>');
    }

    parts.push('</div>');
    return parts.join('');
  }

  function visibilityLabel(card) {
    var v = card.visibility || 'private';
    switch (v) {
      case 'private':
        return 'Only you can see this card.';
      case 'selected':
        return 'Shared with selected household members (view-only).';
      case 'household':
        return 'Shared with your household (view-only).';
      default:
        return 'Only you can see this card.';
    }
  }

  function renderCardDetails(cardId) {
    var state = loadState();
    var card = state.cards.find(function (c) { return c.id === cardId; });
    if (!card) {
      console.warn('Manual card not found for id', cardId);
      return;
    }

    var dialog = document.getElementById('bbml-dialog') || document.getElementById('bbmp-dialog');
    if (!dialog) {
      console.warn('Manual card: dialog element not found (#bbml-dialog or #bbmp-dialog)');
      return;
    }

    dialog.setAttribute('data-bb-section', 'manual-card-details');

    var body = dialog.querySelector('[data-bb-dialog-body]') || dialog.querySelector('.bb-dialog-body') || dialog;

    var modeledBalance = computeBalance(state, card);

    var html = '';
    html += '<div class="bb-card-dialog bb-scroll">';
    html += '<div class="bb-card-header">';
    html += '<div class="bb-card-title">' + escapeHtml(displayName(card)) + '</div>';
    html += '<div class="bb-card-subtitle">Manually tracked · Last updated ' + escapeHtml(card.lastUpdated || todayLabel()) + '</div>';
    html += '</div>';

    html += '<div class="bb-card-summary">';
    html += '<div class="bb-card-summary-row">';
    html += '<div class="bb-card-summary-label">Current balance</div>';
    html += '<div class="bb-card-summary-value">' + escapeHtml(formatMoney(modeledBalance)) + '</div>';
    html += '</div>';

    html += '<div class="bb-card-summary-row">';
    html += '<div class="bb-card-summary-label">Purchase APR</div>';
    html += '<div class="bb-card-summary-value">' + escapeHtml(formatPercent(card.purchaseApr)) + '</div>';
    html += '</div>';

    html += '<div class="bb-card-summary-row">';
    html += '<div class="bb-card-summary-label">Minimum payment</div>';
    html += '<div class="bb-card-summary-value">' + escapeHtml(formatMoney(card.minimumPayment)) + '</div>';
    html += '</div>';

    html += '<div class="bb-card-summary-row">';
    html += '<div class="bb-card-summary-label">Payment due</div>';
    html += '<div class="bb-card-summary-value">' + escapeHtml(formatDate(card.nextDueDate)) + '</div>';
    html += '</div>';

    html += '<div class="bb-card-summary-row">';
    html += '<div class="bb-card-summary-label">Your planned monthly payment</div>';
    html += '<div class="bb-card-summary-value">' + escapeHtml(formatMoney(card.plannedPayment)) + '</div>';
    html += '</div>';

    if (typeof card.creditLimit === 'number') {
      html += '<div class="bb-card-summary-row">';
      html += '<div class="bb-card-summary-label">Credit limit</div>';
      html += '<div class="bb-card-summary-value">' + escapeHtml(formatMoney(card.creditLimit)) + '</div>';
      html += '</div>';
    }

    if (typeof card.statementBalance === 'number') {
      html += '<div class="bb-card-summary-row">';
      html += '<div class="bb-card-summary-label">Statement balance</div>';
      html += '<div class="bb-card-summary-value">' + escapeHtml(formatMoney(card.statementBalance)) + '</div>';
      html += '</div>';
    }

    if (card.statementClosingDate) {
      html += '<div class="bb-card-summary-row">';
      html += '<div class="bb-card-summary-label">Statement closing date</div>';
      html += '<div class="bb-card-summary-value">' + escapeHtml(formatDate(card.statementClosingDate)) + '</div>';
      html += '</div>';
    }

    html += '</div>'; // summary

    html += payoffSummaryHtml(card, state);

    // Actions
    html += '<div class="bb-card-actions">';
    html += '<button type="button" class="bb-btn bb-btn-primary" data-bb-card-action="purchase">Add Purchase</button>';
    html += '<button type="button" class="bb-btn" data-bb-card-action="payment">Record Payment</button>';
    html += '<button type="button" class="bb-btn" data-bb-card-action="refund">Record Refund / Credit</button>';
    html += '<button type="button" class="bb-btn" data-bb-card-action="interest">Add Interest / Fee</button>';
    html += '<button type="button" class="bb-btn" data-bb-card-action="adjust">Correct Balance</button>';
    html += '</div>';

    // Visibility and sharing
    html += '<div class="bb-card-section">';
    html += '<div class="bb-card-section-title">Privacy & sharing</div>';
    html += '<div class="bb-card-row">' + escapeHtml(visibilityLabel(card)) + '</div>';
    html += '<div class="bb-card-row">';
    html += '<label class="bb-toggle"><input type="checkbox" data-bb-card-share-payment ' + (card.sharePaymentOnly ? 'checked' : '') + '> <span>Share payment in Paycheck Plan without sharing card details.</span></label>';
    html += '</div>';
    html += '</div>';

    // Linked bill
    if (card.linkedBillId) {
      html += '<div class="bb-card-section">';
      html += '<div class="bb-card-section-title">Payment bill</div>';
      html += '<div class="bb-card-row">This card is linked to a payment bill. Recording the same payment in both places should not reduce the balance twice.</div>';
      html += '<div class="bb-card-row">';
      html += '<button type="button" class="bb-btn" data-bb-open-linked-bill="' + escapeHtml(card.linkedBillId) + '">Open Linked Bill</button>';
      html += '</div>';
      html += '</div>';
    }

    // How this works
    html += '<details class="bb-card-how">';
    html += '<summary>How this works</summary>';
    html += '<div class="bb-card-row">This is a manually tracked credit-card account. You enter the balance, APR, minimum payment, and payment plan yourself.</div>';
    html += '<div class="bb-card-row">The payoff estimate assumes no new purchases and a fixed purchase APR. Actual issuer interest can differ because of daily balances, grace periods, fees, and timing.</div>';
    html += '<div class="bb-card-row">Recording payments, purchases, refunds, interest, and fees updates the tracked balance and history. Use Correct Balance when you need to reconcile with your statement.</div>';
    html += '<div class="bb-card-row">Sharing the full card makes its identification, balances, APR, and transaction descriptions visible to shared members. Sharing only the payment keeps the card details private while still including the payment in your household paycheck plan.</div>';
    html += '</details>';

    html += '</div>'; // dialog root

    body.innerHTML = html;

    attachCardDetailsHandlers(dialog, cardId);

    if (typeof dialog.showModal === 'function') {
      try {
        dialog.showModal();
      } catch (e) {
        // Some browsers may already have it open.
      }
    }
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseMoneyInput(value) {
    if (!value) return null;
    var cleaned = String(value).replace(/[^0-9.\-]/g, '');
    var num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  function attachCardDetailsHandlers(dialog, cardId) {
    var state = loadState();
    var card = state.cards.find(function (c) { return c.id === cardId; });
    if (!card) return;

    var body = dialog.querySelector('[data-bb-dialog-body]') || dialog.querySelector('.bb-dialog-body') || dialog;

    body.addEventListener('click', function (evt) {
      var target = evt.target;
      if (!(target instanceof HTMLElement)) return;

      var action = target.getAttribute('data-bb-card-action');
      if (action) {
        evt.preventDefault();
        openEntryForm(cardId, action);
        return;
      }

      var billId = target.getAttribute('data-bb-open-linked-bill');
      if (billId) {
        evt.preventDefault();
        if (window.BB && typeof window.BB.openBillDetails === 'function') {
          window.BB.openBillDetails(billId);
        }
        return;
      }
    });

    var sharePaymentToggle = body.querySelector('[data-bb-card-share-payment]');
    if (sharePaymentToggle) {
      sharePaymentToggle.addEventListener('change', function () {
        var state2 = loadState();
        var card2 = state2.cards.find(function (c) { return c.id === cardId; });
        if (!card2) return;
        card2.sharePaymentOnly = !!sharePaymentToggle.checked;
        card2.lastUpdated = new Date().toISOString();
        saveState(state2);
      });
    }
  }

  function openEntryForm(cardId, actionType) {
    var dialog = document.getElementById('bbml-dialog') || document.getElementById('bbmp-dialog');
    if (!dialog) return;
    var body = dialog.querySelector('[data-bb-dialog-body]') || dialog.querySelector('.bb-dialog-body') || dialog;
    var state = loadState();
    var card = state.cards.find(function (c) { return c.id === cardId; });
    if (!card) return;

    var label;
    switch (actionType) {
      case 'purchase':
        label = 'Add Purchase';
        break;
      case 'payment':
        label = 'Record Payment';
        break;
      case 'refund':
        label = 'Record Refund / Credit';
        break;
      case 'interest':
        label = 'Add Interest / Fee';
        break;
      case 'adjust':
        label = 'Correct Balance';
        break;
      default:
        label = 'Update';
    }

    var html = '';
    html += '<div class="bb-card-entry">';
    html += '<div class="bb-card-entry-title">' + escapeHtml(label) + '</div>';
    html += '<label class="bb-field"><div class="bb-field-label">Amount</div><input type="number" step="0.01" inputmode="decimal" data-bb-entry-amount></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Date</div><input type="date" data-bb-entry-date value="' + escapeHtml(card.defaultEntryDate || new Date().toISOString().slice(0, 10)) + '"></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Description</div><input type="text" data-bb-entry-desc placeholder="Groceries, statement payment, refund..."></label>';
    if (actionType === 'adjust') {
      html += '<div class="bb-card-assumption">Use Correct Balance when your tracked balance does not match your statement. The app records only the adjustment, not the full statement balance again.</div>';
    }
    html += '<div class="bb-card-entry-buttons">';
    html += '<button type="button" class="bb-btn bb-btn-primary" data-bb-entry-save>Save</button>';
    html += '<button type="button" class="bb-btn" data-bb-entry-cancel>Cancel</button>';
    html += '</div>';
    html += '</div>';

    body.innerHTML = html;

    var amountInput = body.querySelector('[data-bb-entry-amount]');
    var dateInput = body.querySelector('[data-bb-entry-date]');
    var descInput = body.querySelector('[data-bb-entry-desc]');
    var saveBtn = body.querySelector('[data-bb-entry-save]');
    var cancelBtn = body.querySelector('[data-bb-entry-cancel]');

    if (amountInput) amountInput.focus();

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        renderCardDetails(cardId);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var amt = parseMoneyInput(amountInput && amountInput.value);
        if (amt == null) {
          window.alert('Enter an amount.');
          return;
        }
        var date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().slice(0, 10);
        var desc = descInput && descInput.value ? descInput.value : '';

        var state2 = loadState();
        var card2 = state2.cards.find(function (c) { return c.id === cardId; });
        if (!card2) return;
        var ledger = ensureLedger(state2, cardId);

        var entry = {
          id: createLedgerEntryId(),
          type: actionType === 'adjust' ? 'adjustment' : actionType,
          amount: (function () {
            if (actionType === 'payment' || actionType === 'refund') {
              return -Math.abs(amt);
            }
            return amt;
          })(),
          date: date,
          description: desc,
          reversed: false,
          createdAt: new Date().toISOString()
        };

        ledger.push(entry);
        card2.lastUpdated = new Date().toISOString();
        saveState(state2);

        renderCardDetails(cardId);
      });
    }
  }

  function renderCreditCardList(container) {
    var state = loadState();
    var cards = state.cards.slice().sort(function (a, b) {
      var na = (displayName(a) || '').toLowerCase();
      var nb = (displayName(b) || '').toLowerCase();
      if (na < nb) return -1;
      if (na > nb) return 1;
      return 0;
    });

    var html = '';
    html += '<div class="bb-section-header">';
    html += '<div class="bb-section-title">Credit Cards</div>'; 
    html += '<div class="bb-section-subtitle">Manually tracked card accounts. No bank connection required.</div>';
    html += '</div>';

    if (cards.length === 0) {
      html += '<div class="bb-empty">';
      html += '<div class="bb-empty-title">No manually tracked cards yet.</div>';
      html += '<div class="bb-empty-text">Add a card to start tracking its balance, payments, and payoff estimate without linking it to your bank.</div>';
      html += '</div>';
    } else {
      html += '<div class="bb-card-list">';
      cards.forEach(function (card) {
        html += '<button type="button" class="bb-card-list-item" data-bb-card-id="' + escapeHtml(card.id) + '">';
        html += '<div class="bb-card-list-main">';
        html += '<div class="bb-card-list-name">' + escapeHtml(displayName(card)) + '</div>';
        html += '<div class="bb-card-list-meta">Current balance ' + escapeHtml(formatMoney(computeBalance(state, card))) + '</div>';
        html += '</div>';
        html += '<div class="bb-card-list-chevron">›</div>';
        html += '</button>';
      });
      html += '</div>';
    }

    html += '<div class="bb-card-list-footer">';
    html += '<button type="button" class="bb-btn bb-btn-primary" data-bb-add-card>Add manual card</button>';
    html += '</div>';

    container.innerHTML = html;

    container.addEventListener('click', function (evt) {
      var target = evt.target;
      if (!(target instanceof HTMLElement)) return;

      var btn = target.closest('[data-bb-card-id]');
      if (btn) {
        var id = btn.getAttribute('data-bb-card-id');
        renderCardDetails(id);
        return;
      }

      if (target.closest('[data-bb-add-card]')) {
        openAddCardForm(container);
        return;
      }
    }, { passive: true });
  }

  function openAddCardForm(container) {
    var html = '';
    html += '<div class="bb-card-add">';
    html += '<div class="bb-card-add-title">Add manual credit card</div>';
    html += '<label class="bb-field"><div class="bb-field-label">Bank / Issuer</div><input type="text" data-bb-card-bank placeholder="Capital One"></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Last four digits</div><input type="text" inputmode="numeric" maxlength="4" data-bb-card-last4 placeholder="1234"></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Nickname (optional)</div><input type="text" data-bb-card-nickname placeholder="Everyday Card"></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Current balance</div><input type="number" step="0.01" inputmode="decimal" data-bb-card-balance placeholder="2400.00"></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Balance as of</div><input type="date" data-bb-card-balance-date></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Purchase APR</div><input type="number" step="0.01" inputmode="decimal" data-bb-card-apr placeholder="24.99"></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Minimum payment</div><input type="number" step="0.01" inputmode="decimal" data-bb-card-min placeholder="75.00"></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Next payment due date</div><input type="date" data-bb-card-due></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Your planned monthly payment</div><input type="number" step="0.01" inputmode="decimal" data-bb-card-planned placeholder="150.00"></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Credit limit (optional)</div><input type="number" step="0.01" inputmode="decimal" data-bb-card-limit></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Statement balance (optional)</div><input type="number" step="0.01" inputmode="decimal" data-bb-card-stmt-bal></label>';
    html += '<label class="bb-field"><div class="bb-field-label">Statement closing date (optional)</div><input type="date" data-bb-card-stmt-date></label>';

    html += '<div class="bb-card-section">';
    html += '<div class="bb-card-section-title">Visibility</div>';
    html += '<label class="bb-radio"><input type="radio" name="bb-card-visibility" value="private" checked> <span>Only me</span></label>';
    html += '<label class="bb-radio"><input type="radio" name="bb-card-visibility" value="selected"> <span>Selected household members (view-only)</span></label>';
    html += '<label class="bb-radio"><input type="radio" name="bb-card-visibility" value="household"> <span>Entire household (view-only)</span></label>';
    html += '<label class="bb-toggle"><input type="checkbox" data-bb-card-share-payment> <span>Share payment amount and due date in Paycheck Plan without sharing card details.</span></label>';
    html += '</div>';

    html += '<div class="bb-card-add-buttons">';
    html += '<button type="button" class="bb-btn bb-btn-primary" data-bb-card-save>Save card</button>';
    html += '<button type="button" class="bb-btn" data-bb-card-cancel>Cancel</button>';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;

    var saveBtn = container.querySelector('[data-bb-card-save]');
    var cancelBtn = container.querySelector('[data-bb-card-cancel]');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        renderCreditCardList(container);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var bank = container.querySelector('[data-bb-card-bank]').value.trim();
        var last4 = container.querySelector('[data-bb-card-last4]').value.trim();
        var nickname = container.querySelector('[data-bb-card-nickname]').value.trim();
        var balance = parseMoneyInput(container.querySelector('[data-bb-card-balance]').value);
        var balanceDate = container.querySelector('[data-bb-card-balance-date]').value || null;
        var apr = parseMoneyInput(container.querySelector('[data-bb-card-apr]').value);
        var minPayment = parseMoneyInput(container.querySelector('[data-bb-card-min]').value);
        var dueDate = container.querySelector('[data-bb-card-due]').value || null;
        var planned = parseMoneyInput(container.querySelector('[data-bb-card-planned]').value);
        var limit = parseMoneyInput(container.querySelector('[data-bb-card-limit]').value);
        var stmtBal = parseMoneyInput(container.querySelector('[data-bb-card-stmt-bal]').value);
        var stmtDate = container.querySelector('[data-bb-card-stmt-date]').value || null;
        var visibilityInput = container.querySelector('input[name="bb-card-visibility"]:checked');
        var visibility = visibilityInput ? visibilityInput.value : 'private';
        var sharePaymentOnly = !!container.querySelector('[data-bb-card-share-payment]').checked;

        if (!bank || !last4) {
          window.alert('Enter the bank and last four digits.');
          return;
        }

        var state = loadState();
        var card = {
          id: createCardId(),
          bank: bank,
          lastFour: last4,
          nickname: nickname || null,
          currentBalance: balance || 0,
          balanceAsOf: balanceDate,
          purchaseApr: apr || null,
          minimumPayment: minPayment || null,
          nextDueDate: dueDate,
          plannedPayment: planned || null,
          creditLimit: limit || null,
          statementBalance: stmtBal || null,
          statementClosingDate: stmtDate,
          visibility: visibility,
          sharePaymentOnly: sharePaymentOnly,
          lastUpdated: new Date().toISOString(),
          extraPayment: null,
          linkedBillId: null
        };

        state.cards.push(card);
        saveState(state);

        renderCreditCardList(container);
      });
    }
  }

  window.BBManualCards = {
    renderCreditCardList: renderCreditCardList,
    renderCardDetails: renderCardDetails,
    openAddCardForm: openAddCardForm
  };
})();
