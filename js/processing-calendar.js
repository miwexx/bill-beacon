/* Processing trial v1 — presentation integration for existing Calendar preview v2.
   Load last, after app.js and calendar-preview.js. No financial storage writes. */
(() => {
  'use strict';
  if (window.BillBeaconProcessingCalendar) return;
  if (!window.BillBeaconCalendarPreview?._test?.model || typeof renderRecurring !== 'function' ||
      typeof isOccurrenceProcessing !== 'function') {
    console.error('Processing Calendar: load the patched app.js and existing calendar-preview.js first.');
    return;
  }
  const before = renderRecurring;
  const decode = value => JSON.parse('"' + value.replace(/"/g, '\\"') + '"');
  renderRecurring = function() {
    const html = before.apply(this, arguments);
    try {
      const root = document.createElement('div'); root.innerHTML = html;
      const page = root.querySelector('.bb-calendar-preview-page');
      if (!page) return html;
      const model = window.BillBeaconCalendarPreview._test.model();
      for (const button of page.querySelectorAll('.bill-row[onclick]')) {
        const match = (button.getAttribute('onclick') || '').match(/BillBeaconCalendarPreview\.openBill\('([^']*)','([^']*)'\)/);
        if (!match) continue;
        const id = decode(match[1]), dueDate = decode(match[2]);
        const bill = resolveCalendarBillOccurrence(id, dueDate);
        if (!bill || !isOccurrenceProcessing(bill, new Date(bill.dueDate))) continue;
        const meta = button.querySelector('.bill-meta');
        if (meta) { meta.textContent = `Processing · Due ${formatDate(bill.dueDate,'short')}`; meta.style.color = '#79b9ff'; }
        button.setAttribute('aria-label', `${bill.name}, processing, original due ${formatDate(bill.dueDate,'full')}, ${formatCurrency(bill.amount)}`);
      }
      for (const button of page.querySelectorAll('.recurring-calendar-day[onclick]')) {
        const match = (button.getAttribute('onclick') || '').match(/selectDay\('(\d{4}-\d{2}-\d{2})'\)/);
        if (!match) continue;
        const day = match[1];
        const bills = model.visible.filter(bill => financialDateKey(bill.dueDate) === day);
        const processing = bills.filter(bill => isOccurrenceProcessing(bill, new Date(bill.dueDate))).length;
        if (!processing) continue;
        const statuses = bills.map(bill => getOccurrenceStatus(bill, new Date(bill.dueDate)));
        const paid = statuses.filter(status => status === 'paid').length;
        const due = statuses.filter(status => status === 'upcoming' || status === 'overdue').length;
        button.setAttribute('aria-label', `${formatDate(day+'T12:00:00','full')}, ${bills.length} payments, ${paid} paid, ${processing} processing, ${due} still to submit`);
        if (!statuses.includes('overdue') && !statuses.includes('upcoming')) {
          const marker = button.querySelector('.recurring-calendar-marker');
          if (marker) { marker.classList.remove('paid','upcoming','overdue'); marker.classList.add('processing'); marker.style.backgroundColor='#79b9ff'; }
        }
      }
      const pending = model.list.filter(bill => isOccurrenceProcessing(bill, new Date(bill.dueDate)));
      const meta = page.querySelector('.bb-cal-listmeta');
      if (meta && pending.length) {
        const totalCents = pending.reduce((sum,bill) => sum + bbLFCents(bill.amount),0);
        if (!Number.isSafeInteger(totalCents)) throw new Error('Invalid processing total.');
        meta.append(document.createTextNode(` · ${formatCurrency(totalCents/100)} processing`));
      }
      return root.innerHTML;
    } catch (error) {
      // Never silently return the old processing-as-paid marker. Surface the incompatibility.
      console.error('Processing Calendar integration needs review:',error);
      return `<div class="nav-bar"><div class="nav-bar-content"><div class="nav-title">Calendar</div></div></div><main class="main-content"><div class="content-pad"><div class="card card-pad" role="alert">Calendar status display could not be verified. Your payment data was not changed. Return to Dashboard and review Processing there.</div><button type="button" class="btn-primary" onclick="navigate('today')">Dashboard</button></div></main>`;
    }
  };
  window.BillBeaconProcessingCalendar = {version:1, originalRenderer:before};
})();
